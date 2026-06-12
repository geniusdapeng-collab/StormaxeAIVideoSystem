'use strict';

/**
 * Prompt Final Normalizer v2.0-Peng
 *
 * 🆕 v2.0-Peng (2026-06-11): LLM智能规范化接入
 *   - LLM智能重组10字段顺序和内容，确保语义连贯
 *   - 本地正则降级为fallback，LLM失败时自动回退
 *
 * 目标：
 * 1. 统一识别 S00 / opening_title 镜头
 * 2. 将镜头最终 Prompt 规范化为固定 10 字段
 * 3. 除 Dialogue 外，所有字段内容强制英文
 * 4. 统一长度规则：
 *    - 英文部分 <= 1000 words
 *    - 中文台词 <= 500 chars
 *    - 总字符预算 ~= 6500 chars
 *
 * 最终固定字段顺序：
 * 【CharacterRef】
 * 【Timeline】
 * 【Dialogue】
 * 【AudioLayer】
 * 【Character】
 * 【Action】
 * 【Scene】
 * 【Mood】
 * 【Camera】
 * 【Lighting】
 */

const path = require('path');
const { LLMReasoningLayer } = require('./llm-reasoning-layer');

// v6.31-Peng-fix: 同时支持大写和小写字段名（LLM可能生成小写格式）
const FINAL_PROMPT_FIELDS = [
  'CharacterRef',
  'Timeline',
  'Dialogue',
  'AudioLayer',
  'Character',
  'Action',
  'Scene',
  'Mood',
  'Camera',
  'Lighting'
];
// 大小写不敏感的字段名映射（用于 extractFieldValue）
const FIELD_ALIASES = {
  'characterref': 'CharacterRef',
  'character': 'Character',
  'timeline': 'Timeline',
  'dialogue': 'Dialogue',
  'audiolayer': 'AudioLayer',
  'action': 'Action',
  'scene': 'Scene',
  'mood': 'Mood',
  'camera': 'Camera',
  'lighting': 'Lighting'
};

// 1000 英文单词 ≈ 6000 字符（粗略按 5 字母 + 1 空格）
const ENGLISH_WORD_LIMIT = 1000;
const ENGLISH_CHAR_BUDGET = 6000;
const CHINESE_DIALOGUE_BUDGET = 500;
const FINAL_TOTAL_CHAR_LIMIT = ENGLISH_CHAR_BUDGET + CHINESE_DIALOGUE_BUDGET; // 6500

function isString(v) {
  return typeof v === 'string';
}

function safeString(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch (e) {
    return String(v);
  }
}

/**
 * 统一识别片头镜头
 */
function isOpeningTitleShot(shot) {
  if (!shot) return false;
  return (
    shot.id === 'S00' ||
    shot.shotId === 'S00' ||
    shot.type === 'opening_title' ||
    shot._isOpeningTitle === true ||
    !!shot._titleConfig
  );
}

/**
 * 统计英文单词数
 */
function countEnglishWords(text) {
  if (!isString(text)) return 0;
  const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
  return words ? words.length : 0;
}

/**
 * 统计中文字符数
 */
function countChineseChars(text) {
  if (!isString(text)) return 0;
  const chars = text.match(/[\u4e00-\u9fff]/g);
  return chars ? chars.length : 0;
}

/**
 * 是否含中文
 */
function containsChinese(text) {
  if (!isString(text)) return false;
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * 基础清洗
 */
function normalizeSpaces(text) {
  return safeString(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+\|\s+/g, ' | ')
    .trim();
}

/**
 * 删除中文（用于非 Dialogue 字段）
 * 注意：这是“保守清洗”，不是翻译。
 * 如果字段里本来是中文，这里会删除中文并保留英文/数字/符号。
 */
function stripChinese(text) {
  return normalizeSpaces(
    safeString(text)
      .replace(/[\u4e00-\u9fff]/g, ' ')
  );
}

/**
 * 极简英文兜底文本，避免字段为空
 */
const DEFAULT_FIELD_VALUES = {
  CharacterRef: 'No external reference images.',
  Timeline: 'Duration 5 seconds.',
  Dialogue: 'SPEAKER: Character | TYPE: dialogue | EMOTION: neutral | TEXT: "..." | LIP_SYNC: YES',
  AudioLayer: 'Natural ambient sound design.',
  Character: 'Primary character in frame.',
  Action: 'Primary action unfolds clearly on screen.',
  Scene: 'Cinematic environment with readable spatial depth.',
  Mood: 'cinematic, clear, emotionally focused.',
  Camera: 'cinematic medium shot, stable readable framing.',
  Lighting: 'motivated cinematic lighting with readable contrast.'
};

/**
 * 从 prompt 中提取指定字段内容
 * 支持：
 * 【Field】 xxx
 * Field: xxx
 * P0 Field: xxx
 */
function extractFieldValue(prompt, fieldName) {
  const text = safeString(prompt);
  if (!text) return '';

  const patterns = [
    new RegExp(`【${fieldName}】\\s*([\\s\\S]*?)(?=\\s*\\|\\s*【|$)`, 'i'),
    new RegExp(`\\b${fieldName}:\\s*([\\s\\S]*?)(?=\\s*\\|\\s*[A-Za-z]+:|$)`, 'i'),
    new RegExp(`\\bP[0-9]\\s+${fieldName}:\\s*([\\s\\S]*?)(?=\\s*\\|\\s*P[0-9]\\s+|$)`, 'i')
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return normalizeSpaces(m[1]);
  }

  return '';
}

/**
 * 提取 CharacterRef 简写，避免长路径污染 prompt
 */
function extractCharacterRefShort(shot) {
  if (!shot || !shot._characterRefs) return '';

  const refs = [];
  for (const [charName, paths] of Object.entries(shot._characterRefs || {})) {
    const shortNames = (paths || []).slice(0, 3).map(p => {
      const file = safeString(p);
      const parts = file.split('/');
      return parts[parts.length - 1];
    }).filter(Boolean);

    if (shortNames.length > 0) {
      refs.push(`${charName}: ${shortNames.join(', ')}`);
    }
  }

  return refs.join(' | ');
}

/**
 * 侦测主场角色（简单版）
 */
function detectDominantRole(shot, storyPlan) {
  const text = `${safeString(shot?.Action)} ${safeString(shot?.Scene)} ${safeString(shot?.description)}`.toLowerCase();

  const baizeKw = ['白泽', 'baize', '竖眼', '三尾', '神兽'];
  const xiaogKw = ['小g', 'xiaog', '少年', '小男孩', '男孩'];

  let baizeScore = 0;
  let xiaogScore = 0;

  baizeKw.forEach(kw => { if (text.includes(kw.toLowerCase())) baizeScore++; });
  xiaogKw.forEach(kw => { if (text.includes(kw.toLowerCase())) xiaogScore++; });

  if (shot?.id === 'S00' || shot?.id === 'S01') return 'baize';
  return xiaogScore > baizeScore ? 'xiaoG' : 'baize';
}

/**
 * 从 shot.Dialogue / shot.dialogues / shot.dialogue 中取第一条对白
 */
function extractDialogueFromShot(shot, storyPlan) {
  let dialogues = [];

  if (Array.isArray(shot?.dialogues) && shot.dialogues.length > 0) {
    dialogues = shot.dialogues;
  } else if (Array.isArray(shot?.Dialogue) && shot.Dialogue.length > 0) {
    dialogues = shot.Dialogue;
  } else if (Array.isArray(shot?.dialogue) && shot.dialogue.length > 0) {
    dialogues = shot.dialogue;
  }

  if (dialogues.length > 0) {
    const d = dialogues[0] || {};
    const speaker = d.SPEAKER || d.speaker || d.character || (detectDominantRole(shot, storyPlan) === 'xiaoG' ? '小G' : '白泽');
    const type = d.TYPE || d.type || 'dialogue';
    const emotion = d.EMOTION || d.emotion || 'neutral';
    const text = d.TEXT || d.text || '...';

    return `SPEAKER: ${speaker} | TYPE: ${type} | EMOTION: ${emotion} | TEXT: "${text}" | LIP_SYNC: YES`;
  }

  const fallbackSpeaker = detectDominantRole(shot, storyPlan) === 'xiaoG' ? '小G' : '白泽';
  const fallbackText = fallbackSpeaker === '小G' ? '我在。' : '吾名白泽，通晓万物之情。';
  return `SPEAKER: ${fallbackSpeaker} | TYPE: dialogue | EMOTION: neutral | TEXT: "${fallbackText}" | LIP_SYNC: YES`;
}

/**
 * 构建 S00 专用字段
 */
function buildOpeningTitleFields(shot, storyPlan, options = {}) {
  const titleConfig = shot?._titleConfig || options.openingTitle || {};
  const titlePrompt = safeString(titleConfig.seedancePrompt || shot?.description || '');

  const characterRef = extractCharacterRefShort(shot) || 'Opening title character references attached.';
  const timeline = `Duration ${shot?.duration || 8} seconds opening title sequence with beast reveal, title emergence, and xiaoG entrance.`;
  
  // 🆕 v6.35-Peng-fix42: Dialogue 从故事大纲提取，不用硬编码品牌开场白
  // 根因: 硬编码 "Welcome to planet Nirath. I am Baize..." 是品牌文案而非故事内容
  const chars = Array.isArray(storyPlan?.characters) ? storyPlan.characters : Object.values(storyPlan?.characters || {});
  const beastName = chars.find(c => c.name !== '小G')?.name || storyPlan?.title || 'Beast';
  const outlineOpening = storyPlan?.outline?.['起'] || '';
  const storyDialogue = outlineOpening
    ? `SPEAKER: ${beastName} | TYPE: opening line | EMOTION: solemn | TEXT: "${outlineOpening.slice(0, 60)}..." | LIP_SYNC: YES`
    : `SPEAKER: ${beastName} | TYPE: opening line | EMOTION: solemn | TEXT: "吾名${beastName}，通晓万物之情。" | LIP_SYNC: YES`;
  const dialogue = extractFieldValue(titlePrompt, 'Dialogue') || storyDialogue;
  
  const audioLayer = safeString(shot?._audioLayer?.englishDesc || 'Sub-bass earth rumble, magnetic field hum, cinematic opening ambience.');
  const character = safeString((shot?.characters || []).join(', ') || storyPlan?.title || 'Mythical beast and xiaoG');
  const action = 'Opening reveal, title manifestation, beast emergence, xiaoG visual response.';
  
  // 🆕 v6.35-Peng-fix42: Scene 限制 300 字符（原 1500 导致 S00 过长）
  const sceneRaw = stripChinese(titlePrompt);
  const scene = (sceneRaw && sceneRaw.length > 10)
    ? sceneRaw.slice(0, 300)
    : 'Epic opening title scene on Nirath geological cliff landscape with dual suns and light veins.';
  
  const mood = 'epic, mysterious, awe-inspiring, cinematic, primordial.';
  const camera = stripChinese(safeString(titleConfig.camera || shot?.camera || 'wide-angle low-angle cinematic sweep'));
  const lighting = 'Dual-sunset purple-gold light, bioluminescent cyan accents, dramatic rim lighting.';

  return {
    CharacterRef: characterRef,
    Timeline: timeline,
    Dialogue: dialogue,
    AudioLayer: audioLayer,
    Character: character,
    Action: action,
    Scene: scene,
    Mood: mood,
    Camera: camera,
    Lighting: lighting
  };
}

/**
 * 构建普通镜头字段
 */
function buildNormalShotFields(shot, storyPlan, options = {}) {
  const originalPrompt = safeString(shot?._generatedPrompt || shot?._finalPrompt || shot?.prompt || '');

  const fields = {
    CharacterRef:
      extractCharacterRefShort(shot) ||
      extractFieldValue(originalPrompt, 'CharacterRef') ||
      '',
    Timeline:
      extractFieldValue(originalPrompt, 'Timeline') ||
      `Duration ${shot?.duration || 5} seconds.`,
    Dialogue:
      extractFieldValue(originalPrompt, 'Dialogue') ||
      extractDialogueFromShot(shot, storyPlan),
    AudioLayer:
      extractFieldValue(originalPrompt, 'AudioLayer') ||
      safeString(shot?._audioLayer?.englishDesc || ''),
    Character:
      safeString(shot?.Character || shot?.character || extractFieldValue(originalPrompt, 'Character')),
    Action:
      safeString(shot?.Action || shot?.action || extractFieldValue(originalPrompt, 'Action')),
    Scene:
      safeString(shot?.Scene || shot?.scene || extractFieldValue(originalPrompt, 'Scene') || shot?.description),
    Mood:
      safeString(shot?.Mood || shot?.mood || extractFieldValue(originalPrompt, 'Mood') || shot?.emotion),
    Camera:
      safeString(shot?.Camera || shot?.camera || extractFieldValue(originalPrompt, 'Camera')),
    Lighting:
      safeString(shot?.Lighting || shot?.lighting || extractFieldValue(originalPrompt, 'Lighting'))
  };

  return fields;
}

/**
 * 非 Dialogue 字段强制英文清洗
 */
function enforceEnglishOutsideDialogue(fields) {
  const cleaned = { ...fields };

  // 🆕 v6.35-Peng-fix42: CharacterRef 包含中文文件名（如 白泽-正面全身.png），
  // stripChinese 会损坏角色名和文件名，导致 "白泽: 白泽-45.png" → ": -45.png"
  // CharacterRef 是元数据字段，不参与 Seedance 视觉生成，保留中文不影响渲染
  const CHINESE_SAFE_FIELDS = new Set(['CharacterRef', 'Dialogue']);

  for (const key of FINAL_PROMPT_FIELDS) {
    if (CHINESE_SAFE_FIELDS.has(key)) continue;
    cleaned[key] = stripChinese(cleaned[key] || '');
  }

  return cleaned;
}

/**
 * 空字段兜底
 */
function applyDefaults(fields, shot, storyPlan) {
  const out = { ...fields };

  for (const key of FINAL_PROMPT_FIELDS) {
    if (!safeString(out[key]).trim()) {
      out[key] = DEFAULT_FIELD_VALUES[key];
    }
  }

  // Timeline 用真实时长覆盖默认
  if (!extractFieldValue(out.Timeline, 'Timeline')) {
    out.Timeline = `Duration ${shot?.duration || 5} seconds.`;
  }

  return out;
}

/**
 * 按最终规则截断
 */
function truncateByFinalLimits(fields) {
  const result = { ...fields };

  // 1. 中文台词预算控制
  if (result.Dialogue) {
    let dialogue = safeString(result.Dialogue);
    while (countChineseChars(dialogue) > CHINESE_DIALOGUE_BUDGET && dialogue.length > 0) {
      dialogue = dialogue.slice(0, -1);
    }
    result.Dialogue = dialogue.trim();
  }

  // 2. 非 Dialogue 英文词数控制
  const nonDialogueKeys = FINAL_PROMPT_FIELDS.filter(k => k !== 'Dialogue');
  const trimOrder = [
    'Lighting',
    'Camera',
    'Mood',
    'Scene',
    'Action',
    'Character',
    'AudioLayer',
    'Timeline',
    'CharacterRef'
  ];

  let nonDialogueText = nonDialogueKeys.map(k => result[k] || '').join(' ');
  let wordCount = countEnglishWords(nonDialogueText);

  if (wordCount > ENGLISH_WORD_LIMIT) {
    for (const key of trimOrder) {
      while (safeString(result[key]).length > 0) {
        nonDialogueText = nonDialogueKeys.map(k => result[k] || '').join(' ');
        wordCount = countEnglishWords(nonDialogueText);
        if (wordCount <= ENGLISH_WORD_LIMIT) break;

        result[key] = safeString(result[key]).slice(0, -20).trim();
      }

      nonDialogueText = nonDialogueKeys.map(k => result[k] || '').join(' ');
      wordCount = countEnglishWords(nonDialogueText);
      if (wordCount <= ENGLISH_WORD_LIMIT) break;
    }
  }

  // 3. 总字符预算控制
  let finalText = FINAL_PROMPT_FIELDS.map(k => `【${k}】 ${safeString(result[k])}`).join(' | ');
  while (finalText.length > FINAL_TOTAL_CHAR_LIMIT) {
    let changed = false;
    for (const key of ['Lighting', 'Camera', 'Mood', 'Scene', 'Action']) {
      if (safeString(result[key]).length > 20) {
        result[key] = safeString(result[key]).slice(0, -20).trim();
        changed = true;
        break;
      }
    }
    if (!changed) break;
    finalText = FINAL_PROMPT_FIELDS.map(k => `【${k}】 ${safeString(result[k])}`).join(' | ');
  }

  return result;
}

/**
 * 检查最终10字段完整性
 */
function checkFinalTenFields(prompt) {
  const missing = [];
  for (const field of FINAL_PROMPT_FIELDS) {
    const re = new RegExp(`【${field}】\\s*([\\s\\S]*?)(?=\\s*\\|\\s*【|$)`, 'i');
    const m = safeString(prompt).match(re);
    if (!m || !m[1] || !m[1].trim()) {
      missing.push(field);
    }
  }

  return {
    pass: missing.length === 0,
    missing
  };
}

/**
 * 组装最终 Prompt
 */
function composeFinalPrompt(fields) {
  return FINAL_PROMPT_FIELDS
    .map(fieldName => `【${fieldName}】 ${safeString(fields[fieldName] || '')}`)
    .join(' | ');
}

/**
 * 主入口：规范化单个 shot
 */
async function normalizeShotPromptFields(shot, storyPlan, options = {}) {
  // 🆕 v2.0-Peng: 尝试LLM智能规范化
  try {
    const llmResult = await _normalizeWithLLM(shot, storyPlan, options);
    if (llmResult) {
      shot._normalizedFields = llmResult.fields;
      shot._generatedPrompt = llmResult.prompt;
      shot._finalPrompt = llmResult.prompt;
      shot._promptLength = llmResult.prompt.length;
      console.log('   ✅ LLM提示词规范化完成');
      return llmResult.prompt;
    }
  } catch (err) {
    console.log(`   ⚠️ LLM规范化失败: ${err.message?.substring(0, 60)}，降级本地规则`);
  }

  return _normalizeLocal(shot, storyPlan, options);
}

/**
 * 🆕 v2.0-Peng: LLM智能规范化
 */
async function _normalizeWithLLM(shot, storyPlan, options = {}) {
  const llm = new LLMReasoningLayer();
  const shotInfo = {
    id: shot.id, type: shot.type, emotion: shot.emotion,
    camera: shot.camera, duration: shot.duration,
    Action: shot.Action, Scene: shot.Scene, Character: shot.Character,
    Dialogue: shot.Dialogue, description: shot.description
  };

  const result = await llm.llmReason({
    stage: 'prompt-final-normalizer',
    systemPrompt: `You are a prompt formatting expert for AI video generation. Reorganize the given shot fields into exactly 10 fixed fields: CharacterRef, Timeline, Dialogue, AudioLayer, Character, Action, Scene, Mood, Camera, Lighting. Ensure semantic coherence across fields. All non-Dialogue fields must be in English. Dialogue must be in Chinese with LIP_SYNC:YES. Return JSON: { prompt: "【Field】 value | 【Field】 value ...", fields: { CharacterRef: "...", Timeline: "...", ... } }. Max 1000 English words for non-Dialogue fields.`,
    userPrompt: `Shot info: ${JSON.stringify(shotInfo)}\nStoryPlan type: ${storyPlan?.videoType || 'shanhaijing'}`,
    level: 'medium',
    fallback: () => null
  });

  if (result && typeof result === 'string') {
    try { return JSON.parse(result); } catch (e) { return null; }
  }
  return result || null;
}

/**
 * 本地规则规范化（原normalizeShotPromptFields逻辑）
 */
function _normalizeLocal(shot, storyPlan, options = {}) {
  const isOpening = isOpeningTitleShot(shot);

  let fields = isOpening
    ? buildOpeningTitleFields(shot, storyPlan, options)
    : buildNormalShotFields(shot, storyPlan, options);

  fields = enforceEnglishOutsideDialogue(fields);
  fields = applyDefaults(fields, shot, storyPlan);
  fields = truncateByFinalLimits(fields);

  const finalPrompt = composeFinalPrompt(fields);

  shot._normalizedFields = fields;
  shot._generatedPrompt = finalPrompt;
  shot._finalPrompt = finalPrompt;
  shot._promptLength = finalPrompt.length;

  return finalPrompt;
}

/**
 * 批量规范化
 */
async function normalizeAllShots(shots, storyPlan, options = {}) {
  const results = [];
  const fs2 = require('fs');

  for (const shot of shots || []) {
    const prompt = await normalizeShotPromptFields(shot, storyPlan, options);
    const tenFieldCheck = checkFinalTenFields(prompt);

    const nonDialogueText = prompt.replace(/【Dialogue】[\s\S]*?(?=\s*\|\s*【|$)/i, '');
    const dialogueMatch = prompt.match(/【Dialogue】([\s\S]*?)(?=\s*\|\s*【|$)/i);
    const dialogueText = dialogueMatch ? dialogueMatch[1] : '';

    results.push({
      shotId: shot.id || shot.shotId || 'UNKNOWN',
      isOpeningTitle: isOpeningTitleShot(shot),
      prompt,
      promptLength: prompt.length,
      englishWordCount: countEnglishWords(nonDialogueText),
      chineseDialogueChars: countChineseChars(dialogueText),
      tenFieldCheck
    });
  }

  return results;
}

module.exports = {
  FINAL_PROMPT_FIELDS,
  ENGLISH_WORD_LIMIT,
  ENGLISH_CHAR_BUDGET,
  CHINESE_DIALOGUE_BUDGET,
  FINAL_TOTAL_CHAR_LIMIT,

  isOpeningTitleShot,
  countEnglishWords,
  countChineseChars,
  containsChinese,
  normalizeSpaces,
  stripChinese,

  extractFieldValue,
  extractCharacterRefShort,
  detectDominantRole,
  extractDialogueFromShot,

  buildOpeningTitleFields,
  buildNormalShotFields,
  enforceEnglishOutsideDialogue,
  applyDefaults,
  truncateByFinalLimits,
  checkFinalTenFields,
  composeFinalPrompt,

  normalizeShotPromptFields,
  normalizeAllShots
};
