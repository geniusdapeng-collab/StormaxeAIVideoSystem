#!/usr/bin/env node
'use strict';

/**
 * Platform Preset System v1.0-Peng
 * 平台预设系统 — 抖音/TikTok 快剪模式
 * 
 * 核心理念：不同平台有不同叙事节奏，本系统支持多平台切换
 * 不改主链路，通过preset注入差异化配置
 * 
 * 预设类型：
 * - narrative:    叙事型（默认，30-120s，7镜，故事弧线）
 * - douyin_short:  抖音快剪（15-30s，10镜，钩子先行）
 * - tiktok_creator: TikTok创作（30-60s，12镜，BGM卡点）
 */

const PLATFORM_PRESETS = {
  // 叙事型（默认）
  narrative: {
    name: '叙事型中视频',
    nameEn: 'Narrative Medium Video',
    targetDuration: 60,        // 秒
    shotCount: 7,              // 镜头数
    shotCountRange: [6, 9],
    perShotMin: 4,             // 秒
    perShotMax: 15,
    perShotAvg: 8,
    basePacing: 0.65,         // 基础节奏系数（越小越快）
    aspectRatio: '16:9',
    subtitleRequired: false,
    hookPosition: 1,          // 钩子在第几个镜头
    openingStyle: 'establish', // 建立式开场
    musicStyle: 'ambient',     // 氛围型
    pacingProfile: 'drama',    // drama/documentary/action/short_drama
    // Prompt额外字段要求
    extraFields: [],
    // 镜头类型偏好
    shotTypeBias: ['establishing', 'dialogue', 'reaction', 'climax', 'resolution'],
    // 节奏规则
    rhythmRules: {
      allowPause: true,        // 允许情绪停顿
      minTension: 0.3,        // 最低张力值
      escalationCurve: 'story', // story/exponential/linear
    }
  },

  // 抖音快剪（15-30秒）
  douyin_short: {
    name: '抖音快剪',
    nameEn: 'Douyin Short Video',
    targetDuration: 20,         // 秒（黄金20秒）
    shotCount: 10,             // 镜头数（多镜头保持刺激）
    shotCountRange: [8, 15],
    perShotMin: 1.5,          // 秒
    perShotMax: 3.5,          // 秒（极限压缩）
    perShotAvg: 2,
    basePacing: 0.35,         // 极高节奏系数
    aspectRatio: '9:16',       // 竖版优先
    subtitleRequired: true,   // 必须字幕（抖音算法依赖）
    hookPosition: 0,          // 第0帧即钩子（无建立直接炸）
    openingStyle: 'hook',     // 钩子开场
    musicStyle: 'trending',    // 热门BGM
    pacingProfile: 'short_video',
    // Prompt额外字段要求
    extraFields: ['HOOK', 'SUBTITLE_KEY', 'VERTICAL_COMPOSE', 'CAMPO'],
    // 镜头类型偏好（无建立/过渡，全部推进）
    shotTypeBias: ['action', 'climax', 'reveal', 'emotional_peak', 'reaction'],
    // 节奏规则
    rhythmRules: {
      allowPause: false,       // 不允许任何松弛
      minTension: 0.7,         // 高张力底线
      escalationCurve: 'exponential', // 指数级升级
      maxCalmFrames: 0,        // 0帧允许平静
    },
    // 镜头时长分配（百分比）
    shotDurationProfile: {
      hook: 0.8,   // 钩子镜头极短
      action: 1.8,  // 动作镜头短
      climax: 2.5,  // 高潮镜头略长
      reaction: 1.5, // 反应镜头短
      transition: 1.0, // 过渡镜头极短
    }
  },

  // TikTok创作（30-60秒）
  tiktok_creator: {
    name: 'TikTok创作',
    nameEn: 'TikTok Creator',
    targetDuration: 45,         // 秒
    shotCount: 12,              // 镜头数
    shotCountRange: [10, 16],
    perShotMin: 2,
    perShotMax: 5,
    perShotAvg: 3.5,
    basePacing: 0.45,
    aspectRatio: '9:16',
    subtitleRequired: true,
    hookPosition: 0,
    openingStyle: 'hook',
    musicStyle: 'beat_sync',    // 节拍同步
    pacingProfile: 'micro_video',
    // Prompt额外字段要求
    extraFields: ['HOOK', 'SUBTITLE_KEY', 'VERTICAL_COMPOSE', 'BEAT_MARK', 'CAMPO'],
    // 镜头类型偏好
    shotTypeBias: ['action', 'climax', 'reveal', 'emotional_peak', 'reaction', 'visual-metaphor'],
    rhythmRules: {
      allowPause: false,
      minTension: 0.65,
      escalationCurve: 'exponential',
      maxCalmFrames: 1,        // 最多1个相对平静镜头
      beatSync: true,          // BGM卡点
    },
    shotDurationProfile: {
      hook: 1.0,
      action: 2.5,
      climax: 3.0,
      reaction: 2.0,
      transition: 1.5,
      visual_metaphor: 3.0,
    }
  }
};

// =====================================================================
// HOOK库 — 片头黄金3秒钩子
// =====================================================================

const HOOK_TEMPLATES = {
  // 恐惧型钩子
  fear: [
    'The moment everything could end — and they jump anyway.',
    'One mistake. Zero margin. This is what failure looks like.',
    'The drop is 300 meters. The rope is 10 meters short.',
    'She has three seconds to decide: jump or die standing.',
    'The wave is twice her height. She paddles anyway.',
  ],
  // 速度型钩子
  speed: [
    '200 km/h. No helmet. No brakes.',
    '0 to 100 in 2 seconds. On a mountain cliff.',
    'They cover more ground in 30 seconds than you do in a day.',
    'This is what 400 horsepower sounds like at 8000 meters.',
  ],
  // 悬念型钩子
  suspense: [
    'Nobody believed it was possible. Then they did it.',
    'For 10 years, no one attempted this. Here\'s why.',
    'The pro said it couldn\'t be done. He did it in 3 attempts.',
    'She trained for 5 years for this 8 seconds.',
  ],
  // 视觉冲击型钩子
  visual: [
    'The angle no camera has ever captured from this position.',
    'What the world looks like at 300 km/h.',
    'This is what fear looks like from the inside.',
    'Frame 1: She\'s fine. Frame 7: She\'s airborne.',
  ],
  // 肾上腺素型钩子
  adrenaline: [
    'When you\'re falling at 200 km/h and time slows down.',
    'The exact moment your brain says no and your body says go.',
    'This is the moment before everything changes.',
    'Nobody walks away from this. Except him.',
  ]
};

/**
 * 抽取随机钩子
 * @param {string} type - 'fear'/'speed'/'suspense'/'visual'/'adrenaline'
 * @returns {string} 英文钩子文本
 */
function getRandomHook(type = 'adrenaline') {
  const pool = HOOK_TEMPLATES[type] || HOOK_TEMPLATES.adrenaline;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 获取某平台的预设配置
 * @param {string} platform - 'narrative'/'douyin_short'/'tiktok_creator'
 * @returns {object} 平台预设配置
 */
function getPreset(platform) {
  return PLATFORM_PRESETS[platform] || PLATFORM_PRESETS.narrative;
}

/**
 * 获取所有可用平台
 * @returns {string[]} 平台键名数组
 */
function getAvailablePlatforms() {
  return Object.keys(PLATFORM_PRESETS);
}

/**
 * 判断是否需要竖版
 * @param {string} platform 
 * @returns {boolean}
 */
function isVertical(platform) {
  const preset = getPreset(platform);
  return preset.aspectRatio === '9:16';
}

/**
 * 获取时长分配（秒）for given platform and shot count
 * @param {string} platform 
 * @param {number} shotCount 
 * @returns {object[]} 每镜头时长数组
 */
function allocateDurations(platform, shotCount) {
  const preset = getPreset(platform);
  const total = preset.targetDuration;
  const profile = preset.shotDurationProfile;
  
  const durations = [];
  for (let i = 0; i < shotCount; i++) {
    const position = i === 0 ? 'hook' 
      : i < shotCount / 2 ? 'action' 
      : i < shotCount - 1 ? 'climax' 
      : 'reaction';
    const base = profile[position] || preset.perShotAvg;
    // 加一点随机波动
    const variance = (Math.random() * 0.4) - 0.2; // ±20%
    durations.push(Math.round(base * (1 + variance) * 10) / 10);
  }
  
  // 归一化到目标总时长
  const sum = durations.reduce((a, b) => a + b, 0);
  const scale = total / sum;
  const normalized = durations.map(d => Math.round(d * scale * 10) / 10);
  
  return normalized;
}

/**
 * 生成平台提示词附加字段（英文）
 * @param {string} platform 
 * @param {object} context - { shotIndex, totalShots, emotion, hookType }
 * @returns {string} 附加字段的英文文本
 */
function generatePlatformPromptSupplement(platform, context = {}) {
  const preset = getPreset(platform);
  if (platform === 'narrative') return '';

  const { shotIndex = 0, totalShots = 10, emotion = 'adrenaline', hookType = 'adrenaline' } = context;
  const lines = [];

  // HOOK字段（片头或钩子镜头）
  if (preset.extraFields.includes('HOOK') && shotIndex <= 1) {
    lines.push(`HOOK: ${getRandomHook(hookType)}`);
  }

  // SUBTITLE_KEY（每镜必须有字幕内容）
  if (preset.extraFields.includes('SUBTITLE_KEY')) {
    lines.push(`SUBTITLE_KEY: One punchy keyword or phrase visible as on-screen text`);
  }

  // VERTICAL_COMPOSE（竖版构图）
  if (preset.extraFields.includes('VERTICAL_COMPOSE')) {
    const compose = shotIndex === 0 
      ? 'Center-weighted, subject fills upper 2/3, negative space below'
      : 'Rule of thirds, subject on left or right vertical third, headroom above';
    lines.push(`VERTICAL_COMPOSE: ${compose}`);
  }

  // BEAT_MARK（TikTok节拍标记）
  if (preset.extraFields.includes('BEAT_MARK') && shotIndex % 3 === 0) {
    lines.push(`BEAT_MARK: Cut on beat — synchronize visual impact with audio drop`);
  }

  return lines.join('\n');
}

/**
 * 验证平台预设完整性
 * @param {string} platform 
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validatePreset(platform) {
  const preset = getPreset(platform);
  const errors = [];
  
  if (!preset.targetDuration) errors.push('Missing targetDuration');
  if (!preset.shotCount) errors.push('Missing shotCount');
  if (!preset.basePacing) errors.push('Missing basePacing');
  if (preset.targetDuration && preset.perShotMin) {
    const minTotal = preset.shotCount * preset.perShotMin;
    if (minTotal > preset.targetDuration) {
      errors.push(`Min total (${minTotal}s) exceeds target (${preset.targetDuration}s)`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

module.exports = {
  PLATFORM_PRESETS,
  HOOK_TEMPLATES,
  getRandomHook,
  getPreset,
  getAvailablePlatforms,
  isVertical,
  allocateDurations,
  generatePlatformPromptSupplement,
  validatePreset
};
