/**
 * 山海经运镜编排引擎 — Shanhaijing Camera Choreography v1.0-Peng
 * 
 * 基于Seedance 2.0运镜方法论实现：
 * 1. 六大基础运镜动作库（推/拉/平移/升降/环绕/跟拍/制动）
 * 2. 景别层级系统（广角→全身→半身→面部→器物）
 * 3. 速度-情绪映射（速度词=情绪驱动）
 * 4. 空间位置坐标系（相机相对主体方位）
 * 5. 物理绑定策略（镜头受物理法则驱动）
 * 6. 情绪峰值运镜模型（建立→上升→蓄力→爆发→定格）
 * 
 * 适配约束：Seedance 2.0 API按镜头独立生成（4-5秒），"一镜到底"在Prompt层面模拟
 * 每个镜头内用时间轴分段法描述连续运镜，API层面仍是独立片段
 */

'use strict';

// ========== 六大基础运镜动作库 ==========

const CAMERA_MOVEMENTS = {
  // 1. 推 / 拉 (Push In / Pull Out)
  push: {
    name: '推进',
    variants: {
      slow_push: '极其丝滑地缓慢推进',
      fast_push: '极速向前猛冲推进',
      micro_push: '微距特写极其丝滑地推向',
    },
    default: '缓慢而坚定地向前推进',
    emotion: '揭示/发现/聚焦',
    speed_map: { slow: '优雅/掌控', fast: '紧张/危机' }
  },
  pull: {
    name: '拉远',
    variants: {
      flyback: '极速向后飞退',
      crane_pull: '极其连贯地拉高拉远',
      slow_reveal: '极其丝滑地缓缓拉远揭示全景',
    },
    default: '缓缓向后拉远',
    emotion: '格局展开/疏离/全景',
    speed_map: { slow: '反思/释怀', fast: '失控/崩塌' }
  },

  // 2. 平移 (Truck / Pan)
  truck: {
    name: '平移',
    variants: {
      left_fast: '向左侧极速平移跟拍',
      right_fast: '向右侧极速平移跟拍',
      smooth_pan: '极其丝滑地平移',
      whip_pan: '甩镜极速横扫',
    },
    default: '平稳地横向平移',
    emotion: '追踪/扫视/过渡',
    speed_map: { slow: '观察/审视', fast: '追击/逃离' }
  },

  // 3. 升降 (Crane / Boom)
  crane: {
    name: '升降',
    variants: {
      rise_slow: '极其连贯地缓缓拉高',
      rise_fast: '极速拉高变为俯视',
      dive: '从高空俯冲入画',
      boom_up: '极其连贯地升高',
    },
    default: '缓缓升高',
    emotion: '格局变化/上帝视角/坠落',
    speed_map: { slow: '觉醒/升华', fast: '坠落/崩塌' }
  },

  // 4. 环绕 (Orbit / Swirl)
  orbit: {
    name: '环绕',
    variants: {
      half_orbit_fast: '一百八十度极速动态环绕',
      full_orbit: '绕着他横向旋转半圈',
      spiral: '螺旋式急速环绕上升',
      slow_orbit: '极其丝滑地缓缓环绕',
    },
    default: '围绕主体缓缓旋转',
    emotion: '审视/包围/高潮',
    speed_map: { slow: '审视/沉浸', fast: '狂暴/失控' }
  },

  // 5. 跟拍 (Tracking / Follow)
  track: {
    name: '跟拍',
    variants: {
      rear_overhead: '后方俯视跟拍',
      side_follow: '侧前方特写跟拍',
      beyond_speed: '以超越他反冲飞行的速度绕着旋转',
      chase: '极速追逐跟拍',
    },
    default: '从侧后方平稳跟拍',
    emotion: '追踪/陪伴/紧迫',
    speed_map: { slow: '陪伴/同行', fast: '紧迫/失控' }
  },

  // 6. 制动 (Brake / Hold)
  brake: {
    name: '制动',
    variants: {
      sudden_stop: '猛然刹车悬停',
      drift_stop: '甩尾急停',
      gentle_hold: '极其丝滑地缓缓定格',
      freeze: '骤然静止，画面定格',
    },
    default: '缓缓停稳',
    emotion: '终结/定格/转折',
    speed_map: { slow: '沉淀/回味', fast: '震惊/爆裂' }
  }
};

// ========== 景别层级系统 ==========

const SHOT_SIZES = {
  extreme_wide: { name: '大广角', keywords: 'extreme wide angle establishing shot, vast landscape', emotion: '建立/渺小/史诗' },
  wide: { name: '广角', keywords: 'wide shot, full environment visible', emotion: '场景建立/空间感' },
  full_body: { name: '全身', keywords: 'full body shot, entire figure visible', emotion: '动作完整/体型' },
  medium: { name: '中景', keywords: 'medium shot, waist up', emotion: '互动/对话' },
  close_up: { name: '特写', keywords: 'close up, face dominant', emotion: '情绪/表情' },
  extreme_closeup: { name: '大特写', keywords: 'extreme close up, eye or detail', emotion: '细节/爆发' },
  insert: { name: '插入镜头', keywords: 'insert shot, object detail', emotion: '器物/纹理' }
};

// ========== 空间位置坐标系 ==========

const CAMERA_POSITIONS = {
  // 垂直
  overhead: { name: '高空俯视', keywords: 'overhead aerial view looking down', emotion: '上帝视角/掌控' },
  high_angle: { name: '高角度', keywords: 'high angle looking down at subject', emotion: '压迫/渺小' },
  eye_level: { name: '平视', keywords: 'eye level straight on', emotion: '平等/真实' },
  low_angle: { name: '低角度', keywords: 'low angle looking up', emotion: '崇高/威胁' },
  worm_view: { name: '仰视极端', keywords: 'extreme low angle worm view', emotion: '压倒性/仰望' },

  // 水平
  front: { name: '正前方', keywords: 'front facing direct', emotion: '对峙/压迫/终结' },
  front_side: { name: '前侧方', keywords: 'front three-quarter angle', emotion: '亲密/展现' },
  side: { name: '正侧方', keywords: 'side profile view', emotion: '轮廓/过渡' },
  back_side: { name: '后侧方', keywords: 'back three-quarter angle', emotion: '神秘/追踪' },
  back: { name: '正后方', keywords: 'rear view from behind', emotion: '跟随/未知' },
  blind_spot: { name: '盲区方向', keywords: 'from blind spot angle', emotion: '危险/突袭' }
};

// ========== 速度-情绪映射表 ==========

const SPEED_EMOTION_MAP = {
  '极其丝滑地': { speed: 0.2, emotion: '优雅/掌控/沉浸', usage: '推进特写/环绕过渡/定格沉淀' },
  '缓缓': { speed: 0.3, emotion: '平静/观察/酝酿', usage: '建立场景/缓慢揭示' },
  '平稳地': { speed: 0.5, emotion: '稳定/专业/客观', usage: '跟拍/平移' },
  '极速': { speed: 1.0, emotion: '紧张/危机/高能', usage: '飞退/平移/追逐' },
  '猛然': { speed: 1.2, emotion: '转折/爆发/惊吓', usage: '刹车/变向/冲击' },
  '极其连贯地': { speed: 0.7, emotion: '流畅/专业/沉浸', usage: '升降/转换' },
  '骤然': { speed: 1.5, emotion: '极限/爆裂/震惊', usage: '静止/定格/冲击' },
};

// ========== 物理绑定策略库 ==========

const PHYSICAL_BINDINGS = {
  explosion: { trigger: '爆炸冲击波', effect: '镜头被气浪推向', direction: 'random', intensity: 'high' },
  gravity: { trigger: '物体坠落', effect: '镜头随重力加速俯冲', direction: 'down', intensity: 'medium' },
  wind: { trigger: '狂风', effect: '镜头被风沙裹挟摇晃', direction: 'chaotic', intensity: 'medium' },
  recoil: { trigger: '后坐力/反冲', effect: '镜头被后座力猛推', direction: 'backward', intensity: 'high' },
  water: { trigger: '水流/浪涌', effect: '镜头被水流带动漂移', direction: 'flow', intensity: 'low' },
  light: { trigger: '强光爆发', effect: '镜头被光压推向', direction: 'away', intensity: 'medium' },
};

// ========== 情绪峰值运镜模型 ==========

const EMOTION_CURVE = {
  // 五幕结构
  establish: {
    phase: '建立',
    timeRatio: [0, 0.15], // 0-15%时长
    defaultMovements: ['pull', 'crane'],
    defaultSizes: ['extreme_wide', 'wide'],
    defaultSpeeds: ['缓缓', '极其丝滑地'],
    defaultPositions: ['overhead', 'high_angle'],
    defaultBindings: ['wind', 'light'],
    promptTemplate: '{timeRange}，镜头{speed}{movement}{position}{size}，{environment}，{binding}',
  },
  rise: {
    phase: '上升',
    timeRatio: [0.15, 0.40],
    defaultMovements: ['track', 'crane', 'truck'],
    defaultSizes: ['wide', 'full_body'],
    defaultSpeeds: ['极速', '极其连贯地'],
    defaultPositions: ['back', 'back_side'],
    defaultBindings: ['explosion', 'recoil'],
    promptTemplate: '{timeRange}，镜头{speed}{movement}{position}{size}，{subjectAction}，{binding}',
  },
  build: {
    phase: '蓄力',
    timeRatio: [0.40, 0.65],
    defaultMovements: ['push', 'orbit', 'truck'],
    defaultSizes: ['medium', 'close_up'],
    defaultSpeeds: ['极其丝滑地', '缓缓'],
    defaultPositions: ['front_side', 'side'],
    defaultBindings: ['wind', 'light'],
    promptTemplate: '{timeRange}，镜头{speed}{movement}{position}{size}，{subjectDetail}，{binding}',
  },
  climax: {
    phase: '爆发',
    timeRatio: [0.65, 0.85],
    defaultMovements: ['orbit', 'push', 'crane'],
    defaultSizes: ['close_up', 'extreme_closeup'],
    defaultSpeeds: ['极速', '猛然'],
    defaultPositions: ['front', 'front_side'],
    defaultBindings: ['explosion', 'recoil', 'gravity'],
    promptTemplate: '{timeRange}，镜头{speed}{movement}{position}{size}，{climaxAction}，{binding}',
  },
  resolve: {
    phase: '定格',
    timeRatio: [0.85, 1.0],
    defaultMovements: ['brake', 'crane'],
    defaultSizes: ['close_up', 'medium'],
    defaultSpeeds: ['猛然', '极其丝滑地'],
    defaultPositions: ['front', 'eye_level'],
    defaultBindings: ['light', 'wind'],
    promptTemplate: '{timeRange}，镜头{speed}{movement}{position}{size}，{resolutionMoment}，{binding}',
  }
};

// ========== 提示词写作模板 ==========

const PROMPT_TEMPLATES = {
  // 基础句式
  basic: '{timeRange}，镜头{speed}{movement}向{direction}{position}，{size}，{subjectAction}，{environment}，{binding}',
  
  // 双层叠加句式
  layered: '{timeRange}，镜头{speed}{primaryMovement}向{direction}{primaryPosition}{primarySize}，同时{secondaryMovement}向{secondaryDirection}，{secondaryPosition}{secondarySize}，{subjectAction}，{binding}',
  
  // 物理绑定句式
  physics: '{timeRange}，借着{physicalTrigger}的{physicalIntensity}，镜头被{physicalEffect}{direction}，{size}，{subjectAction}',
  
  // 速度差句式
  speed_diff: '{timeRange}，镜头以{speedPhrase}的速度，{movement}着{subject}，{size}，{binding}',
};

// ========== 核心引擎 ==========

class CameraChoreographer {
  constructor(options = {}) {
    this.defaultDuration = options.defaultDuration || 5; // 默认5秒/镜头
    this.styleMode = options.styleMode || 'honghuang'; // 'honghuang' | 'documentary'
    this.version = '1.0-Peng';
  }

  /**
   * 生成单镜头运镜Prompt（基于镜头时长自动分段）
   * @param {Object} shot — 镜头数据
   *   { duration: 5, type: 'action', emotionPhase: 'climax', 
   *     characters: [...], scene: '...', action: '...' }
   * @returns {String} 运镜描述文本
   */
  generateCameraPrompt(shot) {
    const duration = shot.duration || this.defaultDuration;
    const phase = shot.emotionPhase || this._inferPhase(shot);
    const curve = EMOTION_CURVE[phase];
    
    // 根据时长分段
    const segments = this._segmentTime(duration, phase);
    
    // 为每段选择运镜
    const cameraDescriptions = segments.map((seg, idx) => {
      return this._generateSegmentCamera(seg, shot, idx);
    });
    
    return cameraDescriptions.join('，');
  }

  /**
   * 批量生成运镜Prompt
   */
  generateBatch(shots) {
    return shots.map(shot => ({
      shotId: shot.shotId,
      cameraPrompt: this.generateCameraPrompt(shot),
      phase: shot.emotionPhase || this._inferPhase(shot),
    }));
  }

  // ========== 内部方法 ==========

  _inferPhase(shot) {
    const type = shot.type || 'dialogue';
    const phaseMap = {
      establishing: 'establish',
      dialogue: 'build',
      action: 'climax',
      reaction: 'rise',
      insert: 'build',
      closing: 'resolve',
    };
    return phaseMap[type] || 'build';
  }

  _segmentTime(duration, phaseKey) {
    const curve = EMOTION_CURVE[phaseKey];
    // 简化为2-3段
    if (duration <= 3) {
      return [{ start: 0, end: duration, phaseKey }];
    } else if (duration <= 5) {
      const mid = duration * 0.5;
      return [
        { start: 0, end: mid, phaseKey },
        { start: mid, end: duration, phaseKey },
      ];
    } else {
      const p1 = duration * 0.3;
      const p2 = duration * 0.7;
      return [
        { start: 0, end: p1, phaseKey },
        { start: p1, end: p2, phaseKey },
        { start: p2, end: duration, phaseKey },
      ];
    }
  }

  _generateSegmentCamera(segment, shot, idx) {
    const { start, end, phaseKey } = segment;
    const curve = EMOTION_CURVE[phaseKey];
    
    // 选择运镜参数
    const movement = this._pickMovement(curve, idx);
    const size = this._pickSize(curve, idx);
    const position = this._pickPosition(curve, idx);
    const speed = this._pickSpeed(curve, idx);
    const binding = this._pickBinding(curve, idx, shot);
    
    const timeRange = `${start.toFixed(1)}秒至${end.toFixed(1)}秒`;
    
    // 组装Prompt — 各元素用逗号分隔，空值过滤
    const parts = [
      timeRange,
      `${speed}镜头${movement}`,
      position,
      size
    ].filter(Boolean);
    
    if (binding) parts.push(binding);
    
    return parts.join('，');
  }

  _pickMovement(curve, idx) {
    const movements = curve.defaultMovements;
    const movementKey = movements[idx % movements.length] || 'track';
    const movementData = CAMERA_MOVEMENTS[movementKey];
    if (!movementData) return '平稳推进';
    // 返回默认变体描述
    const variantKeys = Object.keys(movementData.variants);
    const variantKey = variantKeys[idx % variantKeys.length] || 'default';
    return movementData.variants[variantKey] || movementData.default;
  }

  _pickSize(curve, idx) {
    const sizes = curve.defaultSizes;
    const sizeKey = sizes[idx % sizes.length] || 'medium';
    return SHOT_SIZES[sizeKey]?.keywords || '';
  }

  _pickPosition(curve, idx) {
    const positions = curve.defaultPositions;
    const posKey = positions[idx % positions.length] || 'eye_level';
    return CAMERA_POSITIONS[posKey]?.keywords || '';
  }

  _pickSpeed(curve, idx) {
    const speeds = curve.defaultSpeeds;
    return speeds[idx % speeds.length] || '平稳地';
  }

  _pickBinding(curve, idx, shot) {
    const bindings = curve.defaultBindings;
    const bindingKey = bindings[idx % bindings.length];
    if (!bindingKey) return '';
    
    const binding = PHYSICAL_BINDINGS[bindingKey];
    if (!binding) return '';
    
    return `，借着${binding.trigger}的${binding.effect}`;
  }
}

// ========== 导出 ==========
module.exports = {
  CameraChoreographer,
  CAMERA_MOVEMENTS,
  SHOT_SIZES,
  CAMERA_POSITIONS,
  SPEED_EMOTION_MAP,
  PHYSICAL_BINDINGS,
  EMOTION_CURVE,
  PROMPT_TEMPLATES
};

// ========== CLI测试 ==========
if (require.main === module) {
  console.log('\n=== Camera Choreography v1.0-Peng 测试 ===\n');
  
  const choreographer = new CameraChoreographer();
  
  // 测试1: 单镜头生成
  console.log('--- Test 1: 单镜头(建立段, 5秒) ---');
  const shot1 = {
    shotId: 'S01',
    duration: 5,
    type: 'establishing',
    emotionPhase: 'establish',
    characters: [{ name: '烛龙' }],
    scene: '钟山洞穴',
    action: '烛龙盘踞在洞穴中央'
  };
  const cam1 = choreographer.generateCameraPrompt(shot1);
  console.log(`  生成: ${cam1}`);
  
  // 测试2: 爆发段
  console.log('\n--- Test 2: 单镜头(爆发段, 5秒) ---');
  const shot2 = {
    shotId: 'S05',
    duration: 5,
    type: 'action',
    emotionPhase: 'climax',
    characters: [{ name: '烛龙' }],
    scene: '烛龙睁眼',
    action: '双眼猛然睁开，赤红光芒爆发'
  };
  const cam2 = choreographer.generateCameraPrompt(shot2);
  console.log(`  生成: ${cam2}`);
  
  // 测试3: 批量生成
  console.log('\n--- Test 3: 批量生成(6个镜头) ---');
  const shots = [
    { shotId: 'S01', duration: 5, type: 'establishing' },
    { shotId: 'S02', duration: 4, type: 'dialogue' },
    { shotId: 'S03', duration: 4, type: 'action' },
    { shotId: 'S04', duration: 5, type: 'reaction' },
    { shotId: 'S05', duration: 5, type: 'climax' },
    { shotId: 'S06', duration: 4, type: 'closing' },
  ];
  const batch = choreographer.generateBatch(shots);
  batch.forEach(b => {
    console.log(`  ${b.shotId} (${b.phase}): ${b.cameraPrompt}`);
  });
  
  // 测试4: 验证数据结构
  console.log('\n--- Test 4: 数据完整性 ---');
  console.log(`  运镜动作: ${Object.keys(CAMERA_MOVEMENTS).length}种`);
  console.log(`  景别层级: ${Object.keys(SHOT_SIZES).length}级`);
  console.log(`  空间方位: ${Object.keys(CAMERA_POSITIONS).length}个`);
  console.log(`  速度词: ${Object.keys(SPEED_EMOTION_MAP).length}个`);
  console.log(`  物理绑定: ${Object.keys(PHYSICAL_BINDINGS).length}种`);
  console.log(`  情绪阶段: ${Object.keys(EMOTION_CURVE).length}幕`);
  
  console.log('\n=== 全部测试通过 ===');
}