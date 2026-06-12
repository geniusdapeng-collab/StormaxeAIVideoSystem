/**
 * stage3-field-enrichment.js
 * Stage 3.5 字段充实 — 介于 Stage3 Schema校验 和 Stage4 故事板校验 之间
 * 修复fix15: 为每个shot补充 9 个必需字段 (character/action/scene/mood/camera/lighting/negativePrompt/renderStyle/directorStyle)
 * 调用: await stage3_FieldEnrichment(pipeline)
 *
 * 核心策略:
 * 1. 优先从 shot.scene/action/camera/lighting 等已有字段推断（避免调LLM）
 * 2. 只有当字段真的为空时，才调用 LLM 生成（批量、JSON 格式）
 * 3. LLM失败时降级到本地规则填充（不阻断pipeline）
 * 4. 字段充实后写回 story-plan.json
 */
const path = require('path');
const fs = require('fs');
const { logInfo, logWarn } = require('./pipeline-logger');
const { extractBalancedJSON } = require('./pipeline-helpers');
const { saveStoryPlan } = require('./story-plan-service');
const { normalizeStoryPlan, parseLLMContract, safeParseJSON, extractJSONObject } = require('./llm-contract');

/**
 * 9个必需字段的默认值（用于本地降级填充）
 * 注意：默认值是**剧情无关的占位**，与LLM生成的剧情相关字段有本质区别
 * 🆕 fix-v6.26: 全部改为英文（除Dialogue保留中文）
 */
const DEFAULT_FIELDS = {
  character: 'Character visual appearance and posture (to be LLM-enriched)',
  action: 'Primary action and movement (to be LLM-enriched)',
  scene: 'Scene environment details (to be LLM-enriched)',
  mood: 'mysterious and solemn atmosphere',
  camera: 'cinematic wide shot, shallow depth of field',
  lighting: 'dual-star spectral illumination, volumetric haze, dramatic rim light',
  negativePrompt: 'NO anime NO cartoon NO 3D Disney NO sci-fi NO glowing eyes NO bright colors',
  renderStyle: 'CG hyper-realistic digital environment, photorealistic textures',
  directorStyle: 'Nirath mythical-scale environment, ecological coherence, epic framing'
};

/**
 * 从 shot 已有字段推断9字段（不调LLM）
 * @returns {object|null} - 全部9字段都有值才返回；否则返回null（应走LLM）
 */
function inferFieldsFromShot(shot) {
  const result = {};

  // character: 从 characters 数组 + visualAppearance 推断
  const charNames = shot.characters || [];
  if (charNames.length > 0) {
    result.character = charNames.join(' and ') + ' visual appearance, posture, and behavior';
  } else {
    result.character = '';
  }

  // action: 直接从 shot.action 读，没有则空
  result.action = (shot.action && shot.action.length > 5) ? shot.action : '';

  // scene: 从 shot.scene / shot.location / shot.setting 读
  const sceneText = shot.scene || shot.location || shot.setting || '';
  result.scene = sceneText.length > 10 ? sceneText : '';

  // mood: 从 shot.emotion / shot.emotionalTarget 读
  const moodText = shot.emotion || shot.emotionalTarget?.emotion || shot.mood || '';
  result.mood = moodText.length > 2 ? moodText : '';

  // camera: 从 shot.camera / shot.cinematography 读
  const cameraText = shot.camera || shot.cinematography || '';
  result.camera = cameraText.length > 5 ? cameraText : '';

  // lighting: 从 shot.lighting 读
  result.lighting = (shot.lighting && shot.lighting.length > 5) ? shot.lighting : '';

  // negativePrompt: 默认值
  result.negativePrompt = DEFAULT_FIELDS.negativePrompt;

  // renderStyle: 从 shot.visual / shot.renderStyle 读
  const renderText = shot.renderStyle || shot.visual || '';
  result.renderStyle = renderText.length > 5 ? renderText : '';

  // directorStyle: 默认值
  result.directorStyle = DEFAULT_FIELDS.directorStyle;

  // 全部9字段必须有值才返回
  const allFilled = Object.values(result).every(v => v && String(v).trim().length > 0);
  return allFilled ? result : null;
}

/**
 * 拼接 9字段 → 符合 PromptParser.parseKeyValueFormat 的文本
 * 用于生成 LLM prompt 或作为 finalRawDesc 注入 PromptAssembler
 */
function fieldsToKeyValueText(fields) {
  return [
    `Character: ${fields.character || ''}`,
    `Action: ${fields.action || ''}`,
    `Scene: ${fields.scene || ''}`,
    `Mood: ${fields.mood || ''}`,
    `Camera: ${fields.camera || ''}`,
    `Lighting: ${fields.lighting || ''}`,
    `NegativePrompt: ${fields.negativePrompt || ''}`,
    `RenderStyle: ${fields.renderStyle || ''}`,
    `DirectorStyle: ${fields.directorStyle || ''}`
  ].join(' | ');
}

/**
 * 构造LLM prompt - 9字段批量生成
 * 🆕 v6.35-Peng-fix42: 修复LLM缺乏故事背景导致场景幻觉（实验室/走廊/控制室→应为Nirath光脉峡谷）
 * 根因: storyPlan.synopsis/description 为空, LLM拿不到故事背景, 只能瞎编通用科幻场景
 * 修复: 从 storyPlan.outline + shot.description + beastMind 提取完整故事上下文
 */
function buildEnrichmentPrompt(shot, storyPlan, characters) {
  const prdPath = path.join(storyPlan?._prdDir || '', '00-prd', 'prd.md');
  
  // 🆕 fix42: 构建完整故事上下文（原prdSummary为空导致LLM幻觉）
  const storyContextParts = [];
  
  // 1. 世界观
  const worldview = storyPlan?.worldview || 'nirath';
  storyContextParts.push(`Worldview: ${worldview} — an alien planet with dual suns, light veins (光脉) flowing through geological cracks, bioluminescent ecosystem, purple-gold dual-sunset lighting.`);
  
  // 2. 大纲（起承转合）
  const outline = storyPlan?.outline || {};
  if (Object.keys(outline).length > 0) {
    const outlineText = Object.entries(outline).map(([k, v]) => `${k}: ${v}`).join('\n');
    storyContextParts.push(`Story Outline:\n${outlineText}`);
  }
  
  // 3. 异兽信息
  const beastMind = storyPlan?.beastMind || {};
  if (beastMind.archetype) {
    storyContextParts.push(`Beast: ${storyPlan?.title || 'Unknown'} — Archetype: ${beastMind.archetype}, Burden: ${beastMind.burden || ''}`);
  }
  
  // 4. 当前镜头描述（BeastMind生成的生态级描述，含Nirath环境细节）
  const shotDesc = shot.description || '';
  if (shotDesc.length > 10) {
    storyContextParts.push(`This shot's narrative context: ${shotDesc.slice(0, 300)}`);
  }
  
  // 5. 角色信息
  const charProfiles = characters.map(c => {
    const desc = c.description || c.profile?.visualAppearance || c.appearance || c.visualAppearance || '';
    const descStr = typeof desc === 'string' ? desc : (JSON.stringify(desc) || '');
    return `${c.name} (${c.role || c.type || 'character'}): ${descStr.slice(0, 200)}`;
  }).join('\n');
  
  const storyContext = storyContextParts.join('\n\n');

  return `You are a cinematic storyboard expert for the mythological series "ShanhaiStory Forge". Based on the following information, output a JSON with 9 required fields for shot ${shot.id}.

## Shot Info
- Shot ID: ${shot.id}
- Duration: ${shot.duration} seconds
- Type: ${shot.type || 'action'}
- Characters: ${(shot.characters || []).join(', ') || 'unknown'}
- Emotion: ${shot.emotion || 'unknown'}

## Character Profiles
${charProfiles}

## Story Context (CRITICAL — base ALL field values on this)
${storyContext}

## Output Requirements
Strictly output JSON with these 9 fields, no extra text or code blocks:
{
  "character": "Visual appearance and behavior of the character(s) in this shot, 30-60 words in English",
  "action": "Primary action and interaction happening in this shot, 20-40 words in English",
  "scene": "Scene environment and setting details, 30-60 words in English — MUST be set in the Nirath world (alien planet, dual suns, light veins, bioluminescence, geological formations), NEVER use Earth-like labs/corridors/control rooms",
  "mood": "Emotional atmosphere, 10-20 words in English",
  "camera": "Camera angle, lens type, and movement, 15-30 words in English",
  "lighting": "Light design including key/fill/rim/volumetric, 15-30 words in English — MUST use dual-sunset purple-gold light, bioluminescent accents, light vein glow",
  "negativePrompt": "Elements to avoid in rendering, 15-25 words in English",
  "renderStyle": "Rendering style and material quality, 10-20 words in English",
  "directorStyle": "Director approach to framing and pacing, 10-20 words in English"
}

CRITICAL RULES:
1. ALL scene descriptions MUST be set in the Nirath alien world — geological formations, light veins, dual suns, bioluminescent flora. NEVER use Earth-like indoor settings (labs, corridors, control rooms, metallic walls).
2. Character descriptions MUST match the actual characters: 白泽 is a mythical beast (lion-like, pure white, vertical eye on forehead, three tails with white flame tips, hooves), NOT a human boy/man. 小G is an 8-year-old Chinese boy explorer, NOT a robot.
3. All field values must be in ENGLISH (except Dialogue which stays Chinese).
4. Base ALL content on the Story Context above, never use generic placeholders.`;
}

/**
 * 调用 LLM 生成9字段（带降级）
 * @returns {object|null} - 成功返回9字段对象，失败返回null
 */
async function enrichShotWithLLM(shot, storyPlan, characters, llm) {
  try {
    const userPrompt = buildEnrichmentPrompt(shot, storyPlan, characters);
    const result = await llm.llmReason({
      stage: 'field-enrichment',
      systemPrompt: 'You are a cinematic storyboard expert. Strictly output JSON only, no extra text or code block markers. All field values must be in ENGLISH.',
      userPrompt,
      level: 'fast',  // 用fast级别，单字段简单生成
      llmOptions: { temperature: 0.4, maxTokens: 800 },
      fallback: null
    });

    if (!result?.result) return null;

    // 解析JSON
    const jsonStr = extractBalancedJSON(result.result);
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr);

    // 验证9个字段都存在
    const requiredKeys = ['character', 'action', 'scene', 'mood', 'camera', 'lighting', 'negativePrompt', 'renderStyle', 'directorStyle'];
    const allPresent = requiredKeys.every(k => parsed[k] && String(parsed[k]).trim().length > 0);
    if (!allPresent) return null;

    return parsed;
  } catch (e) {
    logWarn(`[stage3-field-enrichment] LLM生成失败(${shot.id}): ${e.message}`);
    return null;
  }
}

/**
 * 本地降级填充 - 复用已有字段 + 通用模板
 */
function localFallbackFields(shot) {
  return {
    character: (shot.characters && shot.characters.length > 0) ? `Visual appearance and posture of ${shot.characters.join(' and ')}` : DEFAULT_FIELDS.character,
    action: shot.action || shot.movement || `Primary action in shot ${shot.id}`,
    scene: shot.scene || shot.location || shot.setting || `Scene environment for shot ${shot.id}`,
    mood: shot.emotion || DEFAULT_FIELDS.mood,
    camera: shot.camera || shot.cinematography || DEFAULT_FIELDS.camera,
    lighting: shot.lighting || DEFAULT_FIELDS.lighting,
    negativePrompt: DEFAULT_FIELDS.negativePrompt,
    renderStyle: shot.visual || shot.renderStyle || DEFAULT_FIELDS.renderStyle,
    directorStyle: DEFAULT_FIELDS.directorStyle
  };
}

/**
 * Stage 3.5 字段充实主函数
 * @param {DirectorPipeline} pipeline
 */
async function stage3_FieldEnrichment(pipeline) {
  pipeline.currentStage = 'field-enrichment';
  console.log(`\n🎨 阶段3.5/12: 字段充实 (v6.33-Peng-fix41)`);

  let storyPlan = pipeline.results.storyPlan;
  if (!storyPlan) {
    console.log(`  ⚠️ 无story-plan,跳过字段充实`);
    return { enriched: 0, total: 0 };
  }

  // 🆕 v6.33-Peng-fix41: 统一标准化
  storyPlan = normalizeStoryPlan(storyPlan);
  pipeline.results.storyPlan = storyPlan;

  // 收集所有 shots
  const allShots = [];
  for (const segment of storyPlan.segments || []) {
    allShots.push(...(segment.shots || []));
  }

  if (allShots.length === 0) {
    console.log(`  ⚠️ 无shots,跳过字段充实`);
    return { enriched: 0, total: 0 };
  }

  // 收集角色信息（兼容array和dict格式）
  const charactersRaw = storyPlan.characters || [];
  const characters = Array.isArray(charactersRaw) ? charactersRaw : Object.values(charactersRaw);

  // 初始化 LLM 客户端
  let llm = null;
  try {
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    llm = new LLMReasoningLayer();
  } catch (e) {
    logWarn(`[stage3-field-enrichment] LLMReasoningLayer加载失败,仅用本地推断: ${e.message}`);
  }

  let enrichedCount = 0;
  let inferredCount = 0;
  let llmCount = 0;
  let fallbackCount = 0;
  const enrichedShots = [];

  for (const shot of allShots) {
    const shotId = shot.id || shot.shotId;

    // 片头(opening_title)跳过 — 由 opening-title-design.json 提供内容
    if (shot.type === 'opening_title') {
      console.log(`  [Stage3.5] ⏭️ ${shotId}: 片头shot,跳过字段充实(由opening-title-design.json提供)`);
      continue;
    }

    // 1. 优先从已有字段推断
    let fields = inferFieldsFromShot(shot);

    if (fields) {
      // 推断成功,无需LLM
      inferredCount++;
      console.log(`  [Stage3.5] ✅ ${shotId}: 本地推断成功(${Object.keys(fields).length}字段)`);
    } else if (llm) {
      // 2. 推断失败,调用LLM
      const llmFields = await enrichShotWithLLM(shot, storyPlan, characters, llm);
      if (llmFields) {
        fields = llmFields;
        llmCount++;
        console.log(`  [Stage3.5] 🧠 ${shotId}: LLM生成成功(${Object.keys(fields).length}字段)`);
      } else {
        // 3. LLM也失败,用本地fallback
        fields = localFallbackFields(shot);
        fallbackCount++;
        console.log(`  [Stage3.5] ⚠️ ${shotId}: LLM失败,使用本地fallback`);
      }
    } else {
      // 3. LLM不可用,用本地fallback
      fields = localFallbackFields(shot);
      fallbackCount++;
      console.log(`  [Stage3.5] ⚠️ ${shotId}: LLM不可用,使用本地fallback`);
    }

    // 4. 注入到 shot 对象 — **直接写入 shot 字段**，PromptAssembler 优先使用
    shot.character = fields.character;
    shot.action = fields.action;
    shot.scene = fields.scene;
    shot.mood = fields.mood;
    shot.camera = fields.camera;
    shot.lighting = fields.lighting;
    shot.negativePrompt = fields.negativePrompt;
    shot.renderStyle = fields.renderStyle;
    shot.directorStyle = fields.directorStyle;

    // 🆕 fix15-v4: 补上 shot.characters 字段，供下游 discoverCharacterRefs 查找定妆照
    // 根因: 白泽预生产story-plan.json的shot.characters全部为None,导致定妆照绑定闸机无法识别
    // 修复: 从 storyPlan.characters 获取所有角色名,注入到 shot.characters
    if ((!shot.characters || shot.characters.length === 0) && characters && characters.length > 0) {
      shot.characters = characters.map(c => c.name).filter(Boolean);
      console.log(`  [Stage3.5] 🆕 fix15-v4: ${shotId} 补上 shot.characters = [${shot.characters.join(',')}]`);
    }

    // 5. 注入到 _enrichedFields 供下游读取
    shot._enrichedFields = fields;
    // 6. 构造 PromptParser 友好的 KeyValue 文本，供 description 兜底
    shot._enrichedKVText = fieldsToKeyValueText(fields);

    enrichedCount++;
    enrichedShots.push(shotId);
  }

  // 7. 保存更新后的 story-plan.json
  try {
    saveStoryPlan(pipeline.productionDir, storyPlan);
    console.log(`  [Stage3.5] 💾 story-plan.json已保存(${enrichedCount}个shot已充实)`);
  } catch (e) {
    logWarn(`[stage3-field-enrichment] 保存story-plan.json失败: ${e.message}`);
  }

  console.log(`  📊 字段充实统计: 总${allShots.length}个, 已充实${enrichedCount}个`);
  console.log(`     本地推断: ${inferredCount} | LLM生成: ${llmCount} | Fallback: ${fallbackCount}`);

  pipeline.results.fieldEnrichment = {
    applied: true,
    totalShots: allShots.length,
    enrichedCount,
    inferredCount,
    llmCount,
    fallbackCount,
    enrichedShots
  };

  return { enriched: enrichedCount, total: allShots.length };
}

module.exports = { stage3_FieldEnrichment, inferFieldsFromShot, localFallbackFields };
