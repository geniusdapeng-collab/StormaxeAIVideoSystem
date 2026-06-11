/**
 * 🎨 Emotion-to-Visual Translation Engine v1.0-Peng
 * 系统级模块：将情绪标签自动翻译为具体视觉指令
 * 
 * 设计哲学：
 * - 情绪不是元数据标签，是视觉生成的核心驱动
 * - 每个情绪必须有对应的lighting/color/camera/atmosphere四维翻译
 * - 支持中文/英文情绪词，输出中英双语视觉指令
 * 
 * 适用：所有视频生成项目（山海经+通用视频）
 */

const EMOTION_VISUAL_MAP = {
  // 基础情绪库（中文关键词 → 视觉指令）
  '不安': {
    lighting: 'cold blue rim light on character edges, shallow depth of field, subtle camera drift',
    color: 'cool shadows warm highlights, slight desaturation, muted tones',
    camera: 'unstable tripod simulation, slight dutch angle, handheld micro-shake',
    atmosphere: 'uneasy silence, distant low-frequency hum, tension building'
  },
  '恐惧': {
    lighting: 'harsh top-down lighting creating deep shadows, high contrast, underlighting',
    color: 'desaturated midtones, vivid accent isolation, cold dominant',
    camera: 'handheld shake, claustrophobic framing, rack focus anxiety',
    atmosphere: 'pressure mounting, breath vapor visible, trembling particles'
  },
  '困惑': {
    lighting: 'dappled fractured light, multiple conflicting light sources',
    color: 'color temperature shifts across frame, split-tone confusion',
    camera: 'rack focus, slow zoom uncertainty, refracted perspective',
    atmosphere: 'disorienting reflections, crystalline light scattering'
  },
  '悲悯': {
    lighting: 'golden hour backlighting with volumetric rays, warm wrap light',
    color: 'golden amber dominant, soft transition to cool shadows',
    camera: 'slow push-in, gentle orbit, reverent framing',
    atmosphere: 'slow-motion particle drift, lens flare grace, transcendent hush'
  },
  '苍凉': {
    lighting: 'vast negative space, single warm accent light, long shadows',
    color: 'muted earth tones, desaturated palette, lonely warm spot',
    camera: 'static wide composition, empty frame holding, distant horizon',
    atmosphere: 'silence echoing, dust settling, time standing still'
  },
  '敬畏': {
    lighting: 'god rays through atmosphere, top light divine, volumetric beams',
    color: 'warm gold dominant, cool rim accent, sacred contrast',
    camera: 'low angle looking up, crane ascending, dwarfing perspective',
    atmosphere: 'sacred silence, ancient presence, timeless grandeur'
  },
  '震惊': {
    lighting: 'hard light high contrast, sharp shadow edges, sudden brightness',
    color: 'punchy saturation, high contrast, vivid shock',
    camera: 'whip pan, sudden zoom, freeze frame effect',
    atmosphere: 'air vibrating, particles suspended, moment frozen'
  },
  '平静': {
    lighting: 'soft diffused light, no harsh shadows, even illumination',
    color: 'balanced neutral, gentle gradients, serene harmony',
    camera: 'smooth dolly, stable tripod, breathing rhythm',
    atmosphere: 'gentle breeze, soft ambient sound visualized, tranquil flow'
  },
  '好奇': {
    lighting: 'side backlight, edge glow exploration, warm discovery light',
    color: 'warm highlights, cool mystery shadows, inviting contrast',
    camera: 'peeking angle, partial reveal, over-shoulder discovery',
    atmosphere: 'whisper of unknown, beckoning glow, path opening'
  },
  '永恒': {
    lighting: 'timeless golden light, eternal sunset glow, immortal radiance',
    color: 'amber gold eternal, colors that transcend time',
    camera: 'time-lapse motion, stars wheeling, enduring frame',
    atmosphere: ' millennia compressed, ancient echo, undying presence'
  },
  // 英文情绪词
  'unease': {
    lighting: 'cold blue rim light, shallow depth of field, subtle drift',
    color: 'cool shadows, slight desaturation',
    camera: 'unstable tripod, dutch angle',
    atmosphere: 'tension building, distant hum'
  },
  'fear': {
    lighting: 'harsh top-down, deep shadows, underlighting',
    color: 'desaturated, cold dominant',
    camera: 'handheld shake, claustrophobic',
    atmosphere: 'pressure, breath vapor'
  },
  'awe': {
    lighting: 'god rays, divine top light',
    color: 'warm gold, sacred contrast',
    camera: 'low angle, crane up',
    atmosphere: 'sacred silence, ancient'
  }
};

/**
 * 将情绪标签翻译为视觉指令字符串
 * @param {string} emotion - 情绪标签（如"恐惧"、"fear"）
 * @param {Object} options - 配置选项
 * @returns {string} 视觉指令字符串
 */
function translateEmotionToVisual(emotion, options = {}) {
  if (!emotion) return '';
  
  const { 
    language = 'mixed', // 'mixed' | 'english' | 'chinese'
    dimensions = ['lighting', 'color', 'camera', 'atmosphere'],
    maxLength = 200
  } = options;
  
  // 查找情绪映射
  const visual = EMOTION_VISUAL_MAP[emotion];
  if (!visual) {
    // 尝试部分匹配
    for (const [key, value] of Object.entries(EMOTION_VISUAL_MAP)) {
      if (emotion.includes(key) || key.includes(emotion)) {
        return _buildVisualString(value, dimensions, language, maxLength);
      }
    }
    return '';
  }
  
  return _buildVisualString(visual, dimensions, language, maxLength);
}

/**
 * 构建视觉指令字符串
 */
function _buildVisualString(visual, dimensions, language, maxLength) {
  const parts = [];
  
  for (const dim of dimensions) {
    if (visual[dim]) {
      parts.push(visual[dim]);
    }
  }
  
  let result = parts.join(', ');
  
  if (result.length > maxLength) {
    // 优先保留lighting和color
    const priorityParts = [];
    if (visual.lighting) priorityParts.push(visual.lighting);
    if (visual.color) priorityParts.push(visual.color);
    result = priorityParts.join(', ');
  }
  
  return result;
}

/**
 * 批量翻译镜头情绪
 * @param {Array} shots - 镜头数组
 * @returns {Object} 镜头ID → 视觉指令映射
 */
function translateShotsEmotions(shots) {
  const result = {};
  for (const shot of shots) {
    const emotion = shot.emotion || shot.mood || '';
    if (emotion) {
      result[shot.id] = translateEmotionToVisual(emotion);
    }
  }
  return result;
}

/**
 * 获取情绪维度库（用于调试和扩展）
 */
function getEmotionLibrary() {
  return Object.keys(EMOTION_VISUAL_MAP);
}

/**
 * 添加自定义情绪映射
 */
function addEmotionMapping(emotionKey, visualSpec) {
  EMOTION_VISUAL_MAP[emotionKey] = visualSpec;
}

module.exports = {
  translateEmotionToVisual,
  translateShotsEmotions,
  getEmotionLibrary,
  addEmotionMapping,
  EMOTION_VISUAL_MAP
};