#!/usr/bin/env node
/**
 * Cinematography Dictionary v1.0-Peng
 * 好莱坞级运镜词库 — 中文简写 → 英文专业描述
 * 
 * 来源: Seedance Shot Design Skill 影视知识库
 * 覆盖: 航拍/跟拍/甩镜/环绕/升降/推移等50+运镜方式
 */

const CINEMATOGRAPHY_DICT = {
  // 景别
  '特写': 'extreme close-up, shallow depth of field, intimate detail',
  '近景': 'close-up, soft focus background, emotional intensity',
  '中景': 'medium shot, balanced framing, clear subject isolation',
  '全景': 'wide shot, full body visible, environmental context',
  '远景': 'long shot, vast landscape, subject in scale',
  '大全景': 'extreme wide shot, epic landscape, aerial perspective',
  
  // 基础运镜
  '推': 'slow dolly-in pushing forward, dramatic tension building, shallow DOF shift',
  '拉': 'steady dolly-out revealing wider view, expanding scale, pulling back from subject',
  '摇': 'smooth pan across scene, horizontal sweep, following action line',
  '移': 'tracking lateral movement, parallel to subject, dynamic side-scrolling',
  '跟': 'tracking shot following subject at breakneck speed, ground-level rushing, motion blur trails',
  '升': 'crane shot ascending, rising above scene, god-view revelation',
  '降': 'crane shot descending from god-view, coming down to earth, immersive descent',
  '环绕': '360-degree orbital shot circling subject, continuous rotation, revealing all angles',
  '航拍': 'drone shot sweeping over epic landscape at 100km/h, bird\'s-eye view, vast terrain scrolling',
  '手持': 'handheld camera with subtle shake, documentary realism, immersive chaos',
  '固定': 'static locked-off frame, tableau composition, watching from distance',
  '甩': 'whip pan rapid camera swing, kinetic energy burst, flash transition',
  '变焦': 'snap zoom pushing in with motion blur, vertigo effect, sudden focus shift',
  '旋转': '360-roll spinning camera, disorienting rotation, barrel roll effect',
  
  // 高级运镜（v9.2-Peng扩展）
  '急速跟拍': 'tracking shot at breakneck speed, ground-level rushing, motion blur trails, heart-pounding chase',
  '甩镜': 'whip pan rapid camera swing, kinetic energy burst, flash transition, blurred motion streaks',
  '延时推移': 'time-lapse push-in, temporal compression, slow progression of time',
  '急速航拍': 'drone racing at 150km/h, FPV freefall perspective, vertigo-inducing speed',
  '环绕推进': 'orbital dolly shot spiraling inward, tightening circle, converging on subject',
  '穿越': 'drone flying through narrow spaces, threading needle, point-of-view flight',
  '俯冲': 'nose-dive camera plunge, freefall perspective, stomach-dropping descent',
  '低角度': 'worm\'s-eye view looking up, towering perspective, heroic angle',
  '高角度': 'god\'s-eye view looking down, omniscient perspective, surveillance angle',
  '斯坦尼康': 'steadicam smooth floating movement, dreamlike glide, seamless tracking',
  '肩扛': 'shoulder-mounted camera, documentary grit, on-the-ground intimacy',
  '滑轨': 'slider shot silky horizontal movement, precision tracking, controlled glide',
  '摇臂': 'jimmy jib sweeping arc, dramatic elevation change, crane ballet',
  '车载': 'car-mounted camera, road-level speed, vehicle POV chase',
  '轨道环绕': 'dolly track 360 around subject, perfect circle, subject at center',
  '急速推拉': 'crash zoom in-out, violent focal length change, chaotic energy',
};

/**
 * 获取专业运镜描述
 * @param {string} cameraDesc - 中文运镜描述（如"大全景，急速跟拍"）
 * @returns {string} 英文专业运镜描述
 */
function getCinematicMove(cameraDesc = '') {
  if (!cameraDesc) return '';
  
  const moves = [];
  const desc = cameraDesc.toLowerCase();
  
  // 匹配景别
  for (const [cn, en] of Object.entries(CINEMATOGRAPHY_DICT)) {
    if (desc.includes(cn)) {
      moves.push(en);
    }
  }
  
  // 去重并组合
  return moves.length > 0 
    ? moves.join(', ') 
    : 'dynamic camera movement, professional cinematography';
}

/**
 * 为镜头生成承接叙事（延续上一镜头动作）
 * @param {number} shotIndex - 当前镜头索引（0-based）
 * @param {string} prevAction - 上一镜头的动作描述
 * @param {string} currentDesc - 当前镜头描述
 * @returns {string} 承接叙事
 */
function generateContinuityNarrative(shotIndex, prevAction, currentDesc) {
  if (shotIndex === 0) return currentDesc;
  
  // v1.3-Peng修复: 简化承接叙事，避免与currentDesc重复
  // 只描述"状态延续"，不重复具体动作
  const continuityPrefixes = [
    '延续上一步动作，',
    '动作无缝衔接，',
    '承接上一镜头，',
    '连贯叙事，',
  ];
  
  const prefix = continuityPrefixes[shotIndex % continuityPrefixes.length];
  return prefix + currentDesc;
}

module.exports = {
  CINEMATOGRAPHY_DICT,
  getCinematicMove,
  generateContinuityNarrative
};