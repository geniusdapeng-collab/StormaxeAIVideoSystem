#!/usr/bin/env node
/**
 * Cinematography Dictionary v2.7-Peng
 * 好莱坞级运镜词库 — 中文简写 → 英文专业描述
 * 
 * v2.7-Peng 更新:
 * + 新增大鹏贡献8组电影级运镜（垂直下坠/希区柯克/子弹时间/摇臂升镜/POV/手持/360旋转/螺旋俯冲）
 * + 智能运镜推荐系统 — 根据镜头描述内容自动匹配最佳运镜
 * + 场景化增强 — 将基础运镜与镜头内容结合生成丰富描述
 * + 情绪 → 运镜风格映射
 * 
 * 来源: Seedance Shot Design Skill 影视知识库 + 大鹏8组运镜
 * 覆盖: 航拍/跟拍/甩镜/环绕/升降/推移/下坠/变焦/子弹时间/POV等58+运镜方式
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
  
  // ===== 大鹏贡献 · 8组电影级运镜 v2.7-Peng =====
  '垂直下坠摇摄': 'camera plunges vertically downward tracking subject, gravity-induced dynamic motion blur, stomach-dropping freefall perspective, plunging vertical tracking shot',
  '希区柯克变焦': 'Hitchcock dolly zoom, camera pulls back while zooming in, subject locked in frame, oppressive combat atmosphere, vertigo effect, background warps while subject stays same size',
  '子弹时间环绕': 'bullet time 360-degree orbital freeze, suspended energy streams and sparks frozen mid-air, time-stopped combat panorama, matrix-style frozen moment orbiting',
  '摇臂升镜': 'crane jib tracking horizontally along pillars then rising, revealing sect architecture panorama, sweeping elevation transition from ground to aerial',
  'POV镜头': 'POV first-person perspective simulating breathing rhythm, flashlight beam swaying creating horror atmosphere, subjective immersive viewpoint, chest-mounted camera',
  '手持感运镜': 'handheld camera with 8-10% organic shake, focus drift enhancing realism, documentary-style natural wobble, subtle breathing-induced micro-movements',
  '360度旋转': '360-degree continuous rotation orbiting subject, seamless circular camera movement, all-angle character showcase, smooth panoramic spin',
  '螺旋极速俯冲': 'FPV first-person spiral nosedive around statue, dizzying corkscrew descent revealing underwater relic details, helix-shaped rapid dive, gyroscopic rotation',
};

/**
 * 获取专业运镜描述
 * @param {string} cameraDesc - 中文运镜描述（如"大全景，急速跟拍"）
 * @param {string} shotDescription - 镜头描述内容（可选，用于智能匹配）
 * @param {string} emotion - 情绪标签（可选，用于智能匹配）
 * @returns {string} 英文专业运镜描述
 */
function getCinematicMove(cameraDesc = '', shotDescription = '', emotion = '') {
  // 🆕 v5.30-Peng-fix: 防御性类型检查，防止非字符串导致.toLowerCase()报错
  if (typeof cameraDesc !== 'string') {
    console.warn(`  ⚠️ cinematography.js: cameraDesc非字符串(${typeof cameraDesc}),强制转换`);
    cameraDesc = String(cameraDesc || '');
  }
  if (!cameraDesc) {
    // 🎬 v2.7-Peng: 无明确运镜时，根据镜头内容智能推荐
    if (shotDescription) {
      return _smartCameraRecommendation(shotDescription, emotion);
    }
    return '';
  }
  
  // v1.1-Peng: 如果已经是英文专业描述（包含英文单词且长度>30），直接保留
  const cameraDescStr = typeof cameraDesc === 'string' ? cameraDesc : ((cameraDesc?.move || '') + ' ' + (cameraDesc?.scale || ''));
  const hasEnglishWords = /[a-zA-Z]{3,}/.test(cameraDescStr);
  const isLongDescription = cameraDescStr.length > 30;
  if (hasEnglishWords && isLongDescription) {
    return cameraDescStr; // 已经是英文专业描述，直接保留
  }
  
  const moves = [];
  const desc = cameraDescStr.toLowerCase();
  
  // 匹配景别和运镜
  for (const [cn, en] of Object.entries(CINEMATOGRAPHY_DICT)) {
    if (desc.includes(cn)) {
      moves.push(en);
    }
  }
  
  // 去重并组合
  const baseMove = moves.length > 0 
    ? moves.join(', ') 
    : 'dynamic camera movement, professional cinematography';
  
  // 🎬 v2.7-Peng: 如果有镜头描述，做场景化增强
  if (shotDescription && baseMove.length < 100) {
    return _enhanceWithSceneContext(baseMove, shotDescription, emotion);
  }
  
  return baseMove;
}

// ===== 智能运镜推荐系统 v2.7-Peng =====

/**
 * 场景关键词 → 推荐运镜映射
 */
const SCENE_CAMERA_MAP = {
  // 下坠/掉落/重力
  '下坠': '垂直下坠摇摄',
  '坠落': '垂直下坠摇摄',
  '掉落': '垂直下坠摇摄',
  '悬崖': '垂直下坠摇摄',
  '深渊': '垂直下坠摇摄',
  '跳下': '垂直下坠摇摄',
  
  // 压迫/紧张/对峙
  '压迫': '希区柯克变焦',
  '对峙': '希区柯克变焦',
  '战斗': '希区柯克变焦',
  '杀气': '希区柯克变焦',
  '危机': '希区柯克变焦',
  '紧张': '希区柯克变焦',
  
  // 冻结时间/超慢动作/能量
  '时间凝固': '子弹时间环绕',
  '慢动作': '子弹时间环绕',
  '悬浮': '子弹时间环绕',
  '凝固': '子弹时间环绕',
  '能量': '子弹时间环绕',
  '火花': '子弹时间环绕',
  '爆发': '子弹时间环绕',
  '飞溅': '子弹时间环绕',
  
  // 建筑/宗门/全景展示
  '建筑': '摇臂升镜',
  '宗门': '摇臂升镜',
  '宫殿': '摇臂升镜',
  '全景': '摇臂升镜',
  '展开': '摇臂升镜',
  '俯瞰': '摇臂升镜',
  '群像': '摇臂升镜',
  
  // 恐怖/第一人称/探索
  '恐怖': 'POV镜头',
  '第一人称': 'POV镜头',
  '手电': 'POV镜头',
  '探索': 'POV镜头',
  '黑暗': 'POV镜头',
  '洞穴': 'POV镜头',
  '密室': 'POV镜头',
  
  // 真实感/纪录片/生活
  '真实': '手持感运镜',
  '生活': '手持感运镜',
  '日常': '手持感运镜',
  '纪实': '手持感运镜',
  '跟拍': '手持感运镜',
  '街头': '手持感运镜',
  
  // 展示/环绕/全貌
  '展示': '360度旋转',
  '全貌': '360度旋转',
  '环绕': '360度旋转',
  '介绍': '360度旋转',
  '形象': '360度旋转',
  '转身': '360度旋转',
  
  // 螺旋/遗迹/俯冲
  '螺旋': '螺旋极速俯冲',
  '神像': '螺旋极速俯冲',
  '遗迹': '螺旋极速俯冲',
  '海底': '螺旋极速俯冲',
  '古老': '螺旋极速俯冲',
  '神秘': '螺旋极速俯冲',
  '俯冲': '螺旋极速俯冲',
  '极速': '螺旋极速俯冲',
};

/**
 * 情绪 → 运镜风格映射
 */
const EMOTION_CAMERA_MAP = {
  '紧张': '急速跟拍, 甩镜',
  '恐惧': 'POV镜头, 手持感运镜',
  '压迫': '希区柯克变焦, 低角度',
  '震撼': '大全景, 摇臂升镜',
  '悲伤': '推, 特写',
  '喜悦': '环绕, 斯坦尼康',
  '神秘': '螺旋极速俯冲, 俯冲',
  '史诗': '急速航拍, 摇臂升镜',
  '战斗': '子弹时间环绕, 急速推拉',
  '温馨': '手持感运镜, 近景',
};

/**
 * 智能运镜推荐：根据镜头描述自动选择最佳运镜
 */
function _smartCameraRecommendation(shotDescription, emotion = '') {
  const desc = shotDescription.toLowerCase();
  const recommendations = [];
  
  // 1. 基于场景关键词匹配
  for (const [keyword, cameraType] of Object.entries(SCENE_CAMERA_MAP)) {
    if (desc.includes(keyword)) {
      const enMove = CINEMATOGRAPHY_DICT[cameraType];
      if (enMove && !recommendations.includes(enMove)) {
        recommendations.push(`[AUTO:${cameraType}] ${enMove}`);
      }
    }
  }
  
  // 2. 基于情绪匹配
  if (emotion) {
    const emotionCameras = EMOTION_CAMERA_MAP[emotion];
    if (emotionCameras) {
      for (const cam of emotionCameras.split(', ')) {
        const enMove = CINEMATOGRAPHY_DICT[cam.trim()];
        if (enMove && !recommendations.find(r => r.includes(enMove))) {
          recommendations.push(`[MOOD:${emotion}] ${enMove}`);
        }
      }
    }
  }
  
  // 3. 默认推荐
  if (recommendations.length === 0) {
    // 根据描述长度和内容类型推断
    if (desc.includes('跑') || desc.includes('追') || desc.includes('冲')) {
      recommendations.push(`[AUTO:动作] ${CINEMATOGRAPHY_DICT['急速跟拍']}`);
    } else if (desc.includes('飞') || desc.includes('空') || desc.includes('天')) {
      recommendations.push(`[AUTO:空中] ${CINEMATOGRAPHY_DICT['急速航拍']}`);
    } else {
      recommendations.push(`[AUTO:通用] ${CINEMATOGRAPHY_DICT['斯坦尼康'] || 'steadicam smooth floating movement, dreamlike glide, seamless tracking'}`);
    }
  }
  
  return recommendations.join(' | ');
}

/**
 * 场景化增强：将基础运镜与镜头内容结合，生成更丰富的描述
 */
function _enhanceWithSceneContext(baseMove, shotDescription, emotion = '') {
  const desc = shotDescription.toLowerCase();
  const enhancements = [];
  
  // 根据内容添加细节
  if (desc.includes('水') || desc.includes('湖') || desc.includes('海')) {
    enhancements.push('water surface reflection shimmering, fluid camera movement following ripples');
  }
  if (desc.includes('光') || desc.includes('发光') || desc.includes('荧光')) {
    enhancements.push('light rays piercing through, lens flare blooming, bioluminescent glow tracking');
  }
  if (desc.includes('雾') || desc.includes('云') || desc.includes('气')) {
    enhancements.push('misty atmospheric depth, fog layers revealing subject gradually');
  }
  if (desc.includes('跑') || desc.includes('奔') || desc.includes('冲')) {
    enhancements.push('ground-level rushing perspective, motion blur trails, heart-pounding pacing');
  }
  if (desc.includes('大') || desc.includes('巨') || desc.includes('山')) {
    enhancements.push('scale contrast between tiny subject and vast environment, awe-inducing framing');
  }
  
  // 根据情绪添加氛围
  if (emotion) {
    const moodWords = {
      '紧张': 'tense, suspenseful, edge-of-seat framing',
      '恐惧': 'claustrophobic, unsettling, primal dread atmosphere',
      '震撼': 'awe-inspiring, breath-taking, grandiose scale',
      '悲伤': 'melancholic, intimate, fragile beauty',
      '喜悦': 'uplifting, radiant, warm glow embrace',
      '神秘': 'enigmatic, shadow-play, hidden details revealing',
      '史诗': 'monumental, timeless, legendary framing',
      '温馨': 'gentle, tender, soft-focus warmth',
    };
    if (moodWords[emotion]) {
      enhancements.push(moodWords[emotion]);
    }
  }
  
  if (enhancements.length > 0) {
    return `${baseMove} | SCENE-ENRICHED: ${enhancements.join(', ')}`;
  }
  
  return baseMove;
}

/**
 * 根据镜头描述自动推荐运镜（供外部调用）
 * @param {string} shotDescription - 镜头描述
 * @param {string} emotion - 情绪标签
 * @returns {string} 推荐运镜（中文）
 */
function recommendCameraMove(shotDescription, emotion = '') {
  const desc = shotDescription.toLowerCase();
  
  // 检查场景关键词
  for (const [keyword, cameraType] of Object.entries(SCENE_CAMERA_MAP)) {
    if (desc.includes(keyword)) {
      return cameraType;
    }
  }
  
  // 检查情绪
  if (emotion && EMOTION_CAMERA_MAP[emotion]) {
    return EMOTION_CAMERA_MAP[emotion].split(', ')[0];
  }
  
  // 默认
  return '斯坦尼康';
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
  generateContinuityNarrative,
  recommendCameraMove,  // 🎬 v2.7-Peng: 智能运镜推荐
  _smartCameraRecommendation, // 🎬 v2.7-Peng: 内部智能推荐
  _enhanceWithSceneContext,   // 🎬 v2.7-Peng: 场景化增强
  SCENE_CAMERA_MAP,     // 🎬 v2.7-Peng: 场景关键词映射
  EMOTION_CAMERA_MAP,   // 🎬 v2.7-Peng: 情绪运镜映射
};