/**
 * Color Science Module v1.0-Peng
 * 基于《AI视频生成提示词工程方法论》色彩科学体系
 * 
 * 定位：提示词构建的色彩科学增强层
 * 被引用：story-engine.js 组装流水线、prompt-field-standard.js
 * 作用：为 ColorScience 字段注入标准色彩方案、色温控制
 */

class ColorScience {
  constructor() {
    this.version = 'v1.0-Peng';
    
    // ========== 12种标准色彩方案 ==========
    this.PALETTES = {
      tealOrange: {
        name: 'Teal & Orange',
        description: '青蓝阴影 + 橙黄高光，史诗/动作/自然',
        shadows: 'deep teal',
        highlights: 'warm amber',
        accent: 'subtle gold',
        mood: 'epic, action, natural',
       适用: ['海岸', '沙漠', '动作片', '自然景观', '英雄时刻']
      },
      orangeTealReverse: {
        name: 'Orange & Teal (Reverse)',
        description: '暖阴影 + 冷高光，科幻/未来/冷峻',
        shadows: 'warm orange',
        highlights: 'cool teal',
        accent: 'cold blue',
        mood: 'sci-fi, futuristic, cold',
       适用: ['赛博朋克', '未来城市', '冷酷氛围']
      },
      earthTones: {
        name: 'Earth Tones',
        description: '棕/橄榄绿/赭石，历史/战争/纪实',
        shadows: 'dark brown',
        highlights: 'olive green',
        accent: 'ochre',
        mood: 'historical, war, documentary',
       适用: ['战场', '荒野', '旧建筑', '历史剧', '沙漠']
      },
      neonNoir: {
        name: 'Neon Noir',
        description: '品红+青+高对比，黑色电影/赛博朋克',
        shadows: 'deep purple',
        highlights: 'neon cyan',
        accent: 'magenta',
        mood: 'noir, cyberpunk, thriller',
       适用: ['雨夜城市', '霓虹街道', '赛博空间', '犯罪']
      },
      pastelDream: {
        name: 'Pastel Dream',
        description: '粉彩/低饱和/渐变，浪漫/青春/梦幻',
        shadows: 'soft lavender',
        highlights: 'blush pink',
        accent: 'pale gold',
        mood: 'romantic, youthful, dreamy',
       适用: ['恋爱', '回忆', '梦幻场景', '童话', '青春']
      },
      monochrome: {
        name: 'Monochrome',
        description: '单色调+亮度变化，严肃/艺术/极简',
        shadows: 'rich black',
        highlights: 'pure white',
        accent: 'mid-gray',
        mood: 'serious, artistic, minimalist',
       适用: ['艺术片', '纪录片', '悬疑', '哲学', '战争纪实']
      },
      monochromeAccent: {
        name: 'Monochrome Accent',
        description: '去饱和底色+单色彩点缀，强烈对比',
        shadows: 'desaturated gray',
        highlights: 'white',
        accent: 'single color pop',
        mood: 'focused, symbolic, dramatic',
       适用: ['重点标记', '情感强调', '象征性镜头']
      },
      naturalHDR: {
        name: 'Natural HDR',
        description: '全色谱/高动态/真实，纪录片/自然风光',
        shadows: 'deep shadow',
        highlights: 'bright highlight',
        accent: 'full spectrum',
        mood: 'documentary, natural, immersive',
       适用: ['IMAX自然片', '旅行', '动物', '地理', '探险']
      },
      warmMonochrome: {
        name: 'Warm Monochrome',
        description: '全暖色调/金棕渐变，怀旧/温馨/复古',
        shadows: 'warm brown',
        highlights: 'golden cream',
        accent: 'amber',
        mood: 'nostalgic, warm, vintage',
       适用: ['回忆', '老照片风格', '家庭', '温情', '70s风格']
      },
      coolMonochrome: {
        name: 'Cool Monochrome',
        description: '全冷色调/蓝紫渐变，冷静/科技/忧郁',
        shadows: 'deep blue',
        highlights: 'cold white',
        accent: 'purple',
        mood: 'cold, technological, melancholic',
       适用: ['科幻', '冬季', '技术', '忧郁', '冷酷']
      },
      complementary: {
        name: 'Complementary',
        description: '色轮180度对比双色，强烈对比/戏剧',
        shadows: 'one complementary pole',
        highlights: 'opposite complementary pole',
        accent: 'neutral',
        mood: 'contrasting, dramatic, high tension',
       适用: ['冲突场景', '对比蒙太奇', '高潮']
      },
      analogous: {
        name: 'Analogous',
        description: '色轮相邻三色，和谐/自然/统一',
        shadows: 'primary color',
        highlights: 'adjacent secondary',
        accent: 'tertiary blend',
        mood: 'harmonious, natural, unified',
       适用: ['风景', '日常', '柔和情绪', '日落', '海岸']
      }
    };
    
    // ========== 色温控制词库 ==========
    this.COLOR_TEMPERATURE = {
      '2000K': {
        name: '极暖烛光',
        description: '烛光感，橙色发光',
        terms: ['candlelight warm', 'very warm orange glow', 'firelit warmth', 'flame colored']
      },
      '3000K': {
        name: '暖钨丝灯',
        description: '钨丝灯感，金黄温暖',
        terms: ['tungsten warm', 'golden warm', 'cozy', 'soft golden light']
      },
      '4000K': {
        name: '中性偏暖',
        description: '暖白，自然',
        terms: ['neutral warm', 'soft white', 'warm daylight balanced', 'neutral']
      },
      '5600K': {
        name: '标准日光',
        description: '正午阳光，平衡中性',
        terms: ['daylight balanced', 'neutral daylight', 'standard sun', 'midday light']
      },
      '6500K': {
        name: '冷阴天光',
        description: '阴天，冷调',
        terms: ['cool daylight', 'overcast cool', 'diffused daylight', 'soft blue-white']
      },
      '8000K+': {
        name: '极冷蓝调',
        description: '蓝调，夜晚人工光',
        terms: ['very cool', 'blue cast', 'cold tone', 'moonlit blue', 'icy']
      }
    };
    
    // ========== 场景类型→色彩方案映射 ==========
    this.SCENE_TO_PALETTE = {
      自然史诗: ['naturalHDR', 'tealOrange', 'earthTones'],
      人物叙事: ['warmMonochrome', 'naturalHDR', 'pastelDream'],
      产品商业: ['tealOrange', 'monochrome', 'analogous'],
      城市建筑: ['neonNoir', 'coolMonochrome', 'tealOrange'],
      科幻未来: ['neonNoir', 'orangeTealReverse', 'coolMonochrome'],
      纪实纪录: ['naturalHDR', 'earthTones', 'monochrome'],
      抽象艺术: ['complementary', 'pastelDream', 'neonNoir'],
      浪漫爱情: ['pastelDream', 'warmMonochrome', 'analogous'],
      恐怖悬疑: ['neonNoir', 'coolMonochrome', 'monochrome'],
      战争动作: ['earthTones', 'tealOrange', 'monochrome']
    };
  }

  // ========== 核心方法 ==========

  /**
   * 获取指定色彩方案
   * @param {string} paletteName - 方案名称
   * @returns {Object} 色彩方案对象
   */
  getPalette(paletteName) {
    return this.PALETTES[paletteName] || this.PALETTES.tealOrange;
  }

  /**
   * 构建标准化色彩描述
   * @param {string} paletteName - 方案名称
   * @param {string} colorTemp - 色温（如 '3000K'）
   * @returns {string} 色彩描述短语
   */
  buildColorDescription(paletteName, colorTemp = '5600K') {
    const palette = this.getPalette(paletteName);
    const temp = this.COLOR_TEMPERATURE[colorTemp] || this.COLOR_TEMPERATURE['5600K'];
    
    return [
      `color palette: ${palette.shadows} shadows + ${palette.highlights} highlights + ${palette.accent} accents`,
      `color temperature: ${temp.terms[0]}`,
      `overall mood: ${palette.mood}`
    ].join(' | ');
  }

  /**
   * 构建三行式色彩格式
   * @param {string} paletteName - 方案名称
   * @param {string} colorTemp - 色温
   * @returns {Object} { primary, secondary, accent, temperature, mood }
   */
  buildThreeLineFormat(paletteName, colorTemp = '5600K') {
    const palette = this.getPalette(paletteName);
    const temp = this.COLOR_TEMPERATURE[colorTemp] || this.COLOR_TEMPERATURE['5600K'];
    
    return {
      primary: `${palette.shadows} shadows`,
      secondary: `${palette.highlights} highlights`,
      accent: `${palette.accent} accents`,
      temperature: temp.terms[0],
      mood: palette.mood
    };
  }

  /**
   * 根据场景类型推荐色彩方案
   * @param {string} sceneType - 场景类型
   * @param {string} preferredMood - 偏好的情绪（可选）
   * @returns {string[]} 推荐方案数组
   */
  recommendPalette(sceneType, preferredMood = '') {
    const candidates = this.SCENE_TO_PALETTE[sceneType] || ['tealOrange'];
    
    if (preferredMood) {
      // 根据情绪二次筛选
      const moodFiltered = candidates.filter(name => {
        const p = this.PALETTES[name];
        return p.mood.includes(preferredMood);
      });
      return moodFiltered.length > 0 ? moodFiltered : candidates;
    }
    
    return candidates;
  }

  /**
   * 构建完整 ColorScience 字段内容
   * @param {Object} config - 配置对象
   * @param {string} config.palette - 色彩方案名称
   * @param {string} config.temperature - 色温
   * @param {string} config.sceneType - 场景类型
   * @param {string} config.customMood - 自定义情绪
   * @returns {string} 完整 ColorScience 字段文本
   */
  build(config = {}) {
    const {
      palette = 'tealOrange',
      temperature = '5600K',
      sceneType = '',
      customMood = ''
    } = config;
    
    // 如果有场景类型，使用推荐的方案
    let finalPalette = palette;
    if (sceneType && !palette) {
      const recommended = this.recommendPalette(sceneType, customMood);
      finalPalette = recommended[0];
    }
    
    const format = this.buildThreeLineFormat(finalPalette, temperature);
    
    return [
      `color_palette: ${format.primary}, ${format.secondary}, ${format.accent}`,
      `color_temp: ${format.temperature}`,
      `mood: ${format.mood}`
    ].join(' | ');
  }

  /**
   * 获取所有可用方案名称
   * @returns {string[]} 方案名称数组
   */
  listPalettes() {
    return Object.keys(this.PALETTES);
  }

  /**
   * 获取色温词库
   * @param {string} kelvin - 色温值
   * @returns {string[]} 色温术语数组
   */
  getTemperatureTerms(kelvin) {
    const temp = this.COLOR_TEMPERATURE[kelvin];
    return temp ? temp.terms : this.COLOR_TEMPERATURE['5600K'].terms;
  }
}

module.exports = new ColorScience();
