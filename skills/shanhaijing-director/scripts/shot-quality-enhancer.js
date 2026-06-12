'use strict';

const { LLMReasoningLayer } = require('./llm-reasoning-layer');

// 肾上腺镜头库懒加载
let _adrenalineLib = null;
function getAdrenalineLib() {
  if (!_adrenalineLib) {
    try {
      _adrenalineLib = require('../../shanhaijing-cinematography/adrenaline-shot-library');
    } catch (e) {
      _adrenalineLib = null;
    }
  }
  return _adrenalineLib;
}

/**
 * Shot Quality Enhancer v2.0-Peng
 *
 * 🆕 v2.0-Peng (2026-06-11): LLM智能质量增强接入
 *   - LLM综合分析镜头并生成针对性质量增强建议
 *   - 本地11项规则降级为fallback，LLM失败时自动回退
 *
 * 内容质量增强模块，提供 11 项内容质量提升：
 * 1-10: 原有10项（叙事目的/视觉钩子/差异化/行为逻辑/高潮升级/片头钩子/景深层次/视觉重点/可拍摄性）
 * 11: 肾上腺镜头注入（极限运动震撼镜头系统）
 * 1. 叙事目的（narrative purpose）
 * 2. 视觉唯一性标签（visual hook）
 * 3. 相邻镜头差异化（diversify adjacent）
 * 4. 角色行为逻辑（behavior logic）
 * 5. 高潮镜头升级（climax upgrade）
 * 6. 片头钩子（opening hook）
 * 7. 前景/中景/背景层次（depth plan）
 * 8. 第一视觉重点（primary focus）
 * 9. 可拍摄化约束（cinematic readability）
 * 10. 统一入口（enhanceShotQualityBundle）
 */

function isString(v) {
  return typeof v === 'string';
}

function safeString(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * 方案1：叙事目的
 */
function inferNarrativePurpose(shot, index = 0, total = 1) {
  const type = String(shot.type || '').toLowerCase();
  const emotion = String(shot.emotion || '').toLowerCase();

  if (index === 0 || shot.id === 'S00') return 'establish';
  if (type.includes('opening')) return 'establish';
  if (type.includes('reveal')) return 'reveal';
  if (type.includes('climax')) return 'climax';
  if (type.includes('resolution') || type.includes('ending')) return 'resolution';
  if (emotion.includes('fear') || emotion.includes('tense') || emotion.includes('angry')) return 'conflict';
  if (emotion.includes('sad') || emotion.includes('awe') || emotion.includes('tender')) return 'emotion';
  if (index === total - 1) return 'resolution';
  return 'progress';
}

function injectNarrativePurpose(shot, index = 0, total = 1) {
  const purpose = inferNarrativePurpose(shot, index, total);
  shot._narrativePurpose = purpose;
  return purpose;
}

/**
 * 方案2：视觉唯一性标签
 */
function inferVisualHook(shot) {
  const text = `${shot.Scene || ''} ${shot.Action || ''} ${shot.description || ''}`.toLowerCase();

  if (/竖眼|pupil|eye/.test(text)) return 'glowing vertical pupil close-up';
  if (/裂缝|cliff|rock|岩壁/.test(text)) return 'fractured cliff face with hard texture contrast';
  if (/孢子|spore|particle/.test(text)) return 'floating luminous spores in layered depth';
  if (/手|hand|触碰|reach/.test(text)) return 'trembling hand reaching into uncertain space';
  if (/尾|tail/.test(text)) return 'tail motion creating elegant spatial rhythm';
  if (/火|flame|burn/.test(text)) return 'heat shimmer and ember drift around the subject';
  if (/水|water|river/.test(text)) return 'reflective liquid surface with moving light distortion';

  return 'clear single visual focal point with cinematic depth';
}

function injectVisualHook(shot) {
  shot._visualHook = inferVisualHook(shot);
  return shot._visualHook;
}

/**
 * 方案3：相邻镜头差异化
 */
function simpleSimilarity(a, b) {
  const wa = new Set(String(a).toLowerCase().split(/\s+/).filter(Boolean));
  const wb = new Set(String(b).toLowerCase().split(/\s+/).filter(Boolean));
  const inter = [...wa].filter(x => wb.has(x)).length;
  return inter / Math.max(1, Math.min(wa.size, wb.size));
}

function diversifyAdjacentShots(shots) {
  for (let i = 1; i < shots.length; i++) {
    const prev = shots[i - 1];
    const curr = shots[i];
    const sim = simpleSimilarity(
      `${prev.Scene || ''} ${prev.Action || ''} ${prev.description || ''}`,
      `${curr.Scene || ''} ${curr.Action || ''} ${curr.description || ''}`
    );

    if (sim > 0.75) {
      curr._diversifyHint = 'Change shot scale, focal subject, and spatial emphasis from previous shot.';
      curr.Camera = curr.Camera || 'cinematic reframing with different shot scale';
      curr.Mood = curr.Mood || 'heightened contrast and fresh visual emphasis';
    }
  }
}

/**
 * 方案4：角色行为逻辑
 */
function inferBehaviorLogic(shot) {
  const emotion = String(shot.emotion || '').toLowerCase();

  if (emotion.includes('fear') || emotion.includes('scared')) {
    return 'instinctive half-step backward, tense shoulders, interrupted breathing';
  }
  if (emotion.includes('curious') || emotion.includes('wonder')) {
    return 'slight forward lean, eyes locked, hand subtly reaching before full commitment';
  }
  if (emotion.includes('awe')) {
    return 'stillness, upward gaze, softened jaw, quiet breath hold';
  }
  if (emotion.includes('angry') || emotion.includes('determination')) {
    return 'spine straightened, jaw set, controlled forward tension';
  }
  if (emotion.includes('sad') || emotion.includes('tender')) {
    return 'small restrained movement, lowered breath, softened eye focus';
  }

  return 'clear readable body reaction aligned with the emotional beat';
}

function injectBehaviorLogic(shot) {
  shot._behaviorLogic = inferBehaviorLogic(shot);
  return shot._behaviorLogic;
}

/**
 * 方案5：高潮镜头升级
 */
function upgradeClimaxShots(shots) {
  for (const shot of shots) {
    const tension = Number(shot.tension || 0);
    const type = String(shot.type || '').toLowerCase();
    const isClimax = type.includes('climax') || type.includes('reveal') || tension >= 8;

    if (isClimax) {
      shot._climaxUpgrade = true;
      shot.Lighting = (shot.Lighting || '') + ' hard contrast, strong rim separation, dramatic directional highlight';
      shot.Camera = (shot.Camera || '') + ' decisive push-in or scale-reveal composition';
      shot.Mood = (shot.Mood || '') + ' heightened tension, irreversible turning point';
    }
  }
}

/**
 * 方案6：片头钩子
 */
function enhanceOpeningHook(shot) {
  if (!shot) return;
  const isOpening = shot.id === 'S00' || shot.type === 'opening_title' || shot._isOpeningTitle;

  if (!isOpening) return;

  shot._openingHook = [
    'massive scale contrast',
    'mysterious world anomaly',
    'beast silhouette reveal',
    'human curiosity anchor',
    'sub-bass atmospheric impact'
  ];

  shot.Scene = (shot.Scene || '') + ' colossal environmental scale, unreadable ancient anomaly, distant beast silhouette';
  shot.Mood = (shot.Mood || '') + ' immediate mystery, awe hook, cinematic anticipation';
  shot.AudioLayer = (shot.AudioLayer || '') + ' sub-bass impact, low magnetic hum, restrained atmospheric build';
}

/**
 * 方案7：前景/中景/背景层次
 */
function buildDepthPlan(shot) {
  const text = `${shot.Scene || ''} ${shot.description || ''}`.toLowerCase();

  let foreground = 'subtle environmental framing element';
  let midground = 'primary subject action zone';
  let background = 'large-scale spatial context';

  if (/岩壁|cliff|rock/.test(text)) foreground = 'broken rock edge in foreground';
  if (/孢子|spore/.test(text)) foreground = 'floating luminous spores in foreground depth';
  if (/水|river|lake/.test(text)) foreground = 'reflective surface distortion in foreground';

  if (/神兽|白泽|beast|baize/.test(text)) midground = 'beast body or face as dominant midground subject';
  if (/小g|boy|少年/.test(text)) midground = 'xiaoG body reaction as readable midground anchor';

  if (/山|sky|cliff|mountain/.test(text)) background = 'monumental geological backdrop';
  if (/洞|cave/.test(text)) background = 'deep cave darkness with readable depth falloff';

  shot._depthPlan = { foreground, midground, background };
  return shot._depthPlan;
}

/**
 * 方案8：第一视觉重点
 */
function inferPrimaryFocus(shot) {
  const text = `${shot.Action || ''} ${shot.Scene || ''} ${shot.description || ''}`.toLowerCase();

  if (/眼|eye|竖眼|pupil/.test(text)) return 'the eye region as the first visual focal point';
  if (/手|hand|触碰|reach/.test(text)) return 'the reaching hand as the first visual focal point';
  if (/裂缝|crack|光脉|glow/.test(text)) return 'the glowing crack as the first visual focal point';
  if (/白泽|baize|神兽/.test(text)) return 'the beast silhouette or face as the first visual focal point';
  if (/小g|boy|少年/.test(text)) return 'xiaoG facial reaction as the first visual focal point';

  return 'single readable visual center with no competing subject';
}

function injectPrimaryFocus(shot) {
  shot._primaryFocus = inferPrimaryFocus(shot);
  return shot._primaryFocus;
}

/**
 * 方案9：可拍摄化约束
 */
function injectCinematicReadability(shot) {
  shot._cinematicReadability = 'single clear focal point, readable subject separation, believable physical motion, no competing action layers';
  return shot._cinematicReadability;
}

/**
 * 方案10：统一打包入口
 */
/**
 * 肾上腺镜头注入 v1.0-Peng
 * 当镜头标记为极限运动场景时，自动注入POV+外部跟拍双视角震撼镜头
 * @param {object} shot - 镜头对象
 * @param {number} idx - 镜头索引
 * @param {number} total - 总镜头数
 */
function injectAdrenalineShot(shot, idx, total) {
  const lib = getAdrenalineLib();
  if (!lib) return;

  // 判断是否需要注入肾上腺镜头
  const sportType = shot._sportType || (shot.tags && shot.tags.includes('extreme_sport')) ? 'skiing' : null;
  if (!sportType) return;

  // 根据镜头位置决定phase
  const phase = idx === 0 ? 'buildup'
    : idx < total * 0.3 ? 'action'
    : idx < total * 0.8 ? 'peak'
    : 'release';

  // 生成POV注入
  const povText = lib.getFVPInject(sportType, phase);
  const efxText = lib.getEFXInject(sportType, phase);

  // 注入到Camera字段
  const existingCamera = shot._cameraDesc || '';
  const adrenalineCamera = `[ADRENALINE-POV]\n${povText}\n[ADRENALINE-EFX]\n${efxText}`;
  shot._cameraDesc = existingCamera ? `${existingCamera}\n${adrenalineCamera}` : adrenalineCamera;

  // 标记已注入
  shot._adrenalineInjected = true;
  shot._adrenalineSport = sportType;
  shot._adrenalinePhase = phase;
}

/**
 * 抖音快剪「前3秒杀手」检查 v1.0-Peng
 * 前3个镜头不允许建立/铺垫，必须是强视觉冲击
 * @param {object} shot - 镜头对象
 * @param {number} idx - 镜头索引
 */
function enforceFirst3SecondsKiller(shot, idx) {
  // 仅对前3个镜头生效
  if (idx >= 3) return;

  // 禁止的镜头类型（建立/铺垫）
  const forbiddenTypes = ['establishing', 'establish', 'transition', 'explanation'];
  const type = String(shot.type || '').toLowerCase();
  
  if (forbiddenTypes.some(f => type.includes(f))) {
    shot.type = 'action';
    shot._typeAdjusted = true;
    shot._originalType = shot._originalType || shot.type;
  }

  // 强制提升情绪张力
  const currentEmotion = String(shot.emotion || '').toLowerCase();
  if (!currentEmotion.includes('intense') && !currentEmotion.includes('tension') && !currentEmotion.includes('excitement')) {
    shot._enhancedEmotion = shot.emotion;
    shot.emotion = (shot.emotion || '') + ' | intense visual impact';
  }

  // 注入视觉钩子
  if (!shot._visualHook) {
    shot._visualHook = 'First 3 seconds must be visually striking — no establishing, no transition, pure impact';
  }
}

async function enhanceShotQualityBundle(shots, storyPlan) {
  if (!Array.isArray(shots)) return shots;

  // 🆕 v2.0-Peng: 尝试LLM智能质量增强
  try {
    const llmResult = await _enhanceWithLLM(shots, storyPlan);
    if (llmResult) {
      console.log('   ✅ LLM镜头质量增强完成');
      return llmResult;
    }
  } catch (err) {
    console.log(`   ⚠️ LLM质量增强失败: ${err.message?.substring(0, 60)}，降级本地规则`);
  }

  return _enhanceLocal(shots, storyPlan);
}

/**
 * 🆕 v2.0-Peng: LLM智能质量增强
 */
async function _enhanceWithLLM(shots, storyPlan) {
  const llm = new LLMReasoningLayer();
  const shotSummary = shots.map((s, i) => ({
    index: i, id: s.id, type: s.type, emotion: s.emotion,
    camera: s.camera, duration: s.duration,
    Action: s.Action?.substring(0, 100), Scene: s.Scene?.substring(0, 100)
  }));

  const result = await llm.llmReason({
    stage: 'shot-quality-enhancer',
    systemPrompt: `You are a shot quality expert for AI video generation. Analyze each shot and provide targeted quality enhancements. For each shot, return: _narrativePurpose, _visualHook, _behaviorLogic, _depthPlan, _primaryFocus, _cinematicReadability, _enhancedEmotion. Also suggest climax upgrades and adjacent shot diversification. Return the full shots array with these fields injected.`,
    userPrompt: `Shots to enhance:\n${JSON.stringify(shotSummary, null, 2)}`,
    level: 'medium',
    fallback: () => null
  });

  if (result && typeof result === 'string') {
    try {
      const enhanced = JSON.parse(result);
      if (Array.isArray(enhanced)) {
        // Merge LLM enhancements back into original shots
        enhanced.forEach((es, i) => {
          if (shots[i]) Object.assign(shots[i], es);
        });
        return shots;
      }
    } catch (e) { return null; }
  }
  return null;
}

/**
 * 本地规则增强（原enhanceShotQualityBundle逻辑）
 */
function _enhanceLocal(shots, storyPlan) {
  const platform = storyPlan && storyPlan._platform ? storyPlan._platform : 'narrative';

  shots.forEach((shot, idx) => {
    injectNarrativePurpose(shot, idx, shots.length);
    injectVisualHook(shot);
    injectBehaviorLogic(shot);
    buildDepthPlan(shot);
    injectPrimaryFocus(shot);
    injectCinematicReadability(shot);
    enhanceOpeningHook(shot);
    injectAdrenalineShot(shot, idx, shots.length);

    if (platform !== 'narrative') {
      enforceFirst3SecondsKiller(shot, idx);
    }
  });

  upgradeClimaxShots(shots);
  diversifyAdjacentShots(shots);

  return shots;
}

module.exports = {
  inferNarrativePurpose,
  injectNarrativePurpose,
  inferVisualHook,
  injectVisualHook,
  simpleSimilarity,
  diversifyAdjacentShots,
  inferBehaviorLogic,
  injectBehaviorLogic,
  upgradeClimaxShots,
  enhanceOpeningHook,
  buildDepthPlan,
  inferPrimaryFocus,
  injectPrimaryFocus,
  injectCinematicReadability,
  injectAdrenalineShot,
  enforceFirst3SecondsKiller,
  enhanceShotQualityBundle
};
