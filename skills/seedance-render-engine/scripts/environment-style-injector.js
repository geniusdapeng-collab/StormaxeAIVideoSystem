/**
 * Environment Style Injector v2.0-Peng
 * 环境风格注入器 — 时间感知光照系统
 * 
 * 核心升级(v2.0-Peng): 从统一 golden hour 升级为时间感知光照体系
 * - 根据镜头 actIndex 自动推断叙事时间阶段
 * - 每个阶段分配独立光照方案，避免全片同质化
 * - 解决"光脉生物发光"与"golden hour"冲突问题
 * 
 * 核心设计：
 * - 角色/人物：CG超写实（由角色锚点控制）
 * - 背景环境：实景拍摄（由本模块统一注入）
 * 
 * ShanhaiStory Forge v2.28-Peng | Environment Style Injector v2.0-Peng
 */

// 环境风格词库（实景拍摄）
const ENVIRONMENT_STYLE = {
  // 核心风格标签
  core: 'real location filming, 4K UHD, cinematic film quality, ultra clear details, natural color grading',
  
  // 光影体系（自然光为主）— v2.0: 不再固定 golden hour，由时间感知系统动态替换
  lighting: 'natural sunlight, realistic volumetric light, soft natural shadows, no artificial studio lighting',
  
  // 色彩体系（自然色彩）
  color: 'natural real-world colors, no oversaturated digital tones, film-like color science, Kodak Vision3 color palette',
  
  // 质感体系（真实材质）
  texture: 'real material texture, natural surface detail, weathered authentic look, no CG plastic smoothness, organic imperfections',
  
  // 摄影质感（电影级）
  cinematic: 'ARRI Alexa film look, 35mm film grain subtle, realistic depth of field, documentary authenticity, IMAX location shooting',
  
  // 负面约束（禁止出现的）
  negative: 'NO CG background, NO 3D rendered environment, NO digital painting style, NO anime background, NO cartoon landscape, NO sci-fi neon city, NO artificial smoothness',
};

// 时间感知光照体系 — 根据叙事时间自动推断光照方案
const TIME_BASED_LIGHTING = {
  // 开场/建置：双恒星高角度，硬光冷暖对比
  opening: {
    time: '双恒星高角度白天',
    lighting: 'twin-star hard light, warm-cool color contrast, high-angle directional sunlight, sharp shadows, vivid color separation',
    mood: 'epic, overwhelming scale'
  },
  // 深入/冲突：主光源降低，光脉生物发光主导
  deepening: {
    time: '能量过载时刻',
    lighting: 'reduced key light, bioluminescent glow dominant, light-vein pulsing illumination, cool cyan ambient, bio-light contrasting with warm skin',
    mood: 'tension, mystery'
  },
  // 转折/揭示：阴影移动，光源变化
  turning: {
    time: '光源变化时刻',
    lighting: 'moving shadows, shifting light source, dynamic shadow play, transitional lighting between warm and cool',
    mood: 'uncertainty, revelation'
  },
  // 高潮/真相：顶光暖金色，生态系统认可
  climax: {
    time: '顶光黄金时刻',
    lighting: 'top-down warm golden light, god-rays through atmosphere, ecosystem recognition glow, warm amber wash, divine illumination',
    mood: 'revelation, awe'
  },
  // 结尾/余韵：柔和暮光，琥珀色散射
  resolution: {
    time: '柔和暮光',
    lighting: 'soft twilight, amber scattered light, gentle diffused glow, warm dusk atmosphere, fading natural light, peaceful silhouette',
    mood: 'melancholy, acceptance'
  }
};

/**
 * 根据镜头信息推断时间感知光照
 * v2.0-Peng: 从统一 golden hour 升级为时间感知光照体系
 */
function getTimeBasedLighting(shot) {
  if (!shot) return TIME_BASED_LIGHTING.opening.lighting;
  
  // 根据 actIndex 推断时间阶段
  const actIndex = shot.actIndex || 1;
  
  if (actIndex === 1) {
    return TIME_BASED_LIGHTING.opening.lighting;
  } else if (actIndex === 2) {
    return TIME_BASED_LIGHTING.deepening.lighting;
  } else if (actIndex === 3) {
    return TIME_BASED_LIGHTING.turning.lighting;
  } else if (actIndex === 4) {
    return TIME_BASED_LIGHTING.climax.lighting;
  } else if (actIndex >= 5) {
    return TIME_BASED_LIGHTING.resolution.lighting;
  }
  
  // 根据类型回退
  if (shot.type === 'opening_title') return TIME_BASED_LIGHTING.opening.lighting;
  if (shot.type === 'climax') return TIME_BASED_LIGHTING.climax.lighting;
  if (shot.type === 'resolution') return TIME_BASED_LIGHTING.resolution.lighting;
  
  return TIME_BASED_LIGHTING.opening.lighting;
}

/**
 * 构建环境风格字符串
 * v2.0-Peng: 支持时间感知光照，根据镜头actIndex自动推断时间
 * @param {string} mode 模式：'full'完整 | 'brief'精简 | 'light'仅核心
 * @param {Object} shot 镜头对象（可选，用于时间感知）
 * @returns {string} 环境风格描述
 */
function buildEnvironmentStyle(mode = 'full', shot = null) {
  // v2.0-Peng: 时间感知光照替换统一 golden hour
  const timeLighting = getTimeBasedLighting(shot);
  
  if (mode === 'light') {
    return `${ENVIRONMENT_STYLE.core}, ${timeLighting}`;
  }
  if (mode === 'brief') {
    return `${ENVIRONMENT_STYLE.core}, ${timeLighting}`;
  }
  // full mode
  return [
    ENVIRONMENT_STYLE.core,
    timeLighting,
    ENVIRONMENT_STYLE.color,
    ENVIRONMENT_STYLE.texture,
    ENVIRONMENT_STYLE.cinematic,
  ].join(', ');
}

/**
 * 注入环境风格到Prompt
 * v2.0-Peng: 支持时间感知光照
 * @param {string} prompt 原始Prompt
 * @param {string} mode 注入模式
 * @param {Object} shot 镜头对象（可选）
 * @returns {string} 注入后的Prompt
 */
function injectEnvironmentStyle(prompt, mode = 'full', shot = null) {
  const envStyle = buildEnvironmentStyle(mode, shot);
  
  // 策略：在Prompt末尾添加环境风格标记
  // 使用清晰的语义分隔：EnvironmentStyle: {风格词}
  const envBlock = `EnvironmentStyle: ${envStyle}`;
  
  // 如果Prompt已经包含环境风格，不再重复注入
  if (prompt.includes('EnvironmentStyle:') || prompt.includes('real location filming')) {
    return prompt;
  }
  
  return `${prompt}, ${envBlock}`;
}

/**
 * 获取环境风格模块（用于直接嵌入）
 * v2.0-Peng: 支持时间感知
 * @param {string} mode 模式
 * @param {Object} shot 镜头对象（可选）
 * @returns {string} 环境风格模块字符串
 */
function getEnvironmentStyleBlock(mode = 'full', shot = null) {
  return `EnvironmentStyle: ${buildEnvironmentStyle(mode, shot)}`;
}

module.exports = {
  ENVIRONMENT_STYLE,
  TIME_BASED_LIGHTING,
  buildEnvironmentStyle,
  injectEnvironmentStyle,
  getEnvironmentStyleBlock,
  getTimeBasedLighting,
};