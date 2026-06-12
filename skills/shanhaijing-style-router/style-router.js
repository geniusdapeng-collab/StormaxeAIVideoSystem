#!/usr/bin/env node
/**
 * Nirath原创世界观风格路由系统 — Shanhaijing Style Router
 *
 * 5种东方美学风格引擎 + visualDNA系统 + 异兽-风格智能匹配
 * 将抽象美学参考转化为可运算参数
 *
 * 融合策略：风格叠加，东方风格作为扩展集
 */

// ============ 五大风格引擎定义 ============
const SHANHAI_STYLES = {
  'epic-guoman': {
    id: 'epic-guoman',
    name: '史诗国漫CG',
    visualDNA: {
      saturation: 0.90,
      contrast: 1.20,
      warmth: 0.10,
      sharpness: 0.85,
      particleDensity: 0.60,
      glowIntensity: 0.70,
      inkInfluence: 0.10
    },
    toneMapping: 'ACES Filmic',
    avgShotDuration: 4.5,
    motionSpeed: 1.3,
    references: ['哪吒之魔童降世', '大鱼海棠'],
    suitableRaces: ['celestial_god', 'dragon'],
    description: '3D国漫宏大质感，高饱和高对比'
  },
  'shuimo-poetry': {
    id: 'shuimo-poetry',
    name: '水墨意境',
    visualDNA: {
      saturation: 0.15,
      contrast: 0.70,
      warmth: 0.0,
      sharpness: 0.50,
      particleDensity: 0.20,
      glowIntensity: 0.30,
      inkInfluence: 0.95
    },
    toneMapping: 'Reinhard',
    avgShotDuration: 8.0,
    motionSpeed: 0.5,
    references: ['山水情', '雾山五大元素'],
    suitableRaces: ['natural_god', 'auspicious_beast'],
    description: '留白与气韵流动，极低饱和高水墨'
  },
  'yokai-cel': {
    id: 'yokai-cel',
    name: '妖异赛璐珞',
    visualDNA: {
      saturation: 0.80,
      contrast: 1.40,
      warmth: 0.05,
      sharpness: 0.95,
      particleDensity: 0.70,
      glowIntensity: 0.50,
      inkInfluence: 0.30
    },
    toneMapping: 'Uncharted 2',
    avgShotDuration: 3.5,
    motionSpeed: 1.1,
    references: ['怪化猫', '犬夜叉'],
    suitableRaces: ['spirit_beast'],
    description: '平面装饰美学，高对比高锐度'
  },
  'dark-realism': {
    id: 'dark-realism',
    name: '暗黑写实',
    visualDNA: {
      saturation: 0.40,
      contrast: 1.50,
      warmth: -0.30,
      sharpness: 0.90,
      particleDensity: 0.40,
      glowIntensity: 0.20,
      inkInfluence: 0.00
    },
    toneMapping: 'ACES Filmic',
    avgShotDuration: 3.0,
    motionSpeed: 1.0,
    references: ['爱，死亡和机器人', 'Sonnie\'s Edge'],
    suitableRaces: ['demon_beast'],
    description: '冷峻暗黑，低饱和超高对比'
  },
  'dunhuang-mural': {
    id: 'dunhuang-mural',
    name: '敦煌壁画',
    visualDNA: {
      saturation: 0.60,
      contrast: 0.90,
      warmth: 0.40,
      sharpness: 0.70,
      particleDensity: 0.30,
      glowIntensity: 0.40,
      inkInfluence: 0.20
    },
    toneMapping: 'Reinhard',
    avgShotDuration: 6.0,
    motionSpeed: 0.7,
    references: ['敦煌壁画', '九色鹿'],
    suitableRaces: ['natural_god', 'auspicious_beast'],
    description: '矿物颜料质感，金箔效果，庄严神圣'
  }
};

// ============ 异兽-风格决策矩阵 ============
const STYLE_DECISION_MATRIX = {
  natural_god: { primary: 'dunhuang-mural', secondary: 'shuimo-poetry' },
  celestial_god: { primary: 'epic-guoman', secondary: 'dunhuang-mural' },
  auspicious_beast: { primary: 'shuimo-poetry', secondary: 'dunhuang-mural' },
  spirit_beast: { primary: 'yokai-cel', secondary: 'shuimo-poetry' },
  demon_beast: { primary: 'dark-realism', secondary: 'yokai-cel' }
};

// ============ 【故事内核融入】情感配方到视觉风格映射 ============
const EMOTION_FORMULA_STYLE_MAP = {
  gentleSadness: {
    name: '温柔的悲伤',
    proportion: 0.70,
    primaryStyle: 'shuimo-poetry',
    secondaryStyle: 'dunhuang-mural',
    blendRatio: 0.6,
    visualDNA: {
      saturation: 0.25,
      contrast: 0.60,
      warmth: 0.10,
      sharpness: 0.50,
      particleDensity: 0.15,
      glowIntensity: 0.40,
      inkInfluence: 0.85
    },
    lighting: '柔光散射+暖调',
    lens: '长焦',
    movement: '缓慢拉远',
    description: '70%情感基调——水墨留白承载悲伤，暖光维持温度，不冰冷'
  },
  aweMagnificence: {
    name: '惊叹的壮美',
    proportion: 0.20,
    primaryStyle: 'epic-guoman',
    secondaryStyle: 'shuimo-poetry',
    blendRatio: 0.3,
    visualDNA: {
      saturation: 0.80,
      contrast: 1.30,
      warmth: 0.20,
      sharpness: 0.90,
      particleDensity: 0.70,
      glowIntensity: 0.80,
      inkInfluence: 0.25
    },
    lighting: '逆光+体积光',
    lens: '广角',
    movement: '缓慢上升',
    description: '20%情感基调——宏大构图+逆光，展示世界的壮丽与神秘'
  },
  burningHope: {
    name: '燃烧的希望',
    proportion: 0.10,
    primaryStyle: 'epic-guoman',
    secondaryStyle: 'dunhuang-mural',
    blendRatio: 0.4,
    visualDNA: {
      saturation: 0.90,
      contrast: 1.10,
      warmth: 0.50,
      sharpness: 0.80,
      particleDensity: 0.50,
      glowIntensity: 0.90,
      inkInfluence: 0.15
    },
    lighting: '强轮廓光+暖调',
    lens: '广角',
    movement: '急速推进',
    description: '10%情感基调——高饱和+强轮廓光，希望的"燃烧感"'
  }
};

// ============ 【故事内核融入】小G视角风格路由 ============
const XG_PERSPECTIVE_STYLE = {
  name: '儿童视角',
  visualDNA: {
    cameraHeight: '1.2米',
    focalLength: '35-50mm',
    depthOfField: '浅景深',
    colorTemperature: '偏暖',
    saturation: '略高',
    contrast: '中等'
  },
  composition: {
    rule: '近景为主，低角度',
    avoid: ['过度俯视', '冷漠的全景', '成人视角的解释性镜头'],
    prefer: ['异兽眼睛特写', '小G的手与异兽接触', '笔记本页面特写']
  },
  evolution: {
    s1: { complexity: '简单', shots: '短镜头', color: '高饱和' },
    s2: { complexity: '探索', shots: '中长镜头', color: '自然' },
    s3: { complexity: '情感', shots: '长镜头', color: '柔和' },
    s4: { complexity: '成熟', shots: '复杂调度', color: '诗意' }
  }
};

// ============ 【故事内核融入】区域色彩到风格映射 ============
const REGION_TO_STYLE_MAP = {
  nanshan: { primary: 'shuimo-poetry', accent: 'epic-guoman', mood: '温暖丰饶' },
  xishan:  { primary: 'epic-guoman', accent: 'dunhuang-mural', mood: '庄严神秘' },
  beishan: { primary: 'dark-realism', accent: 'shuimo-poetry', mood: '肃穆孤独' },
  dongshan: { primary: 'epic-guoman', accent: 'yokai-cel', mood: '开阔自由' },
  zhongshan: { primary: 'dunhuang-mural', accent: 'epic-guoman', mood: '神圣压迫' },
  haiwai:  { primary: 'yokai-cel', accent: 'shuimo-poetry', mood: '超现实梦幻' },
  dahuang: { primary: 'dark-realism', accent: 'shuimo-poetry', mood: '荒凉终极' },
  hainei:  { primary: 'shuimo-poetry', accent: 'dunhuang-mural', mood: '平静永恒' }
};

// ============ 风格路由系统核心类 ============
class StyleRouter {
  constructor() {
    this.styles = SHANHAI_STYLES;
    this.emotionFormula = EMOTION_FORMULA_STYLE_MAP;
    this.xgPerspective = XG_PERSPECTIVE_STYLE;
    this.regionMap = REGION_TO_STYLE_MAP;
  }

  /**
   * 根据异兽类别选择风格
   */
  selectStyle(beastCategory, emotion = 'mysterious', theme = null) {
    const decision = STYLE_DECISION_MATRIX[beastCategory];
    if (!decision) {
      return { primary: 'epic-guoman', secondary: null };
    }

    let primary = decision.primary;
    let secondary = decision.secondary;

    // 情绪覆盖
    if (emotion === 'fear' || emotion === 'terror') {
      primary = 'dark-realism';
    } else if (emotion === 'serene' || emotion === 'peaceful') {
      primary = 'shuimo-poetry';
    } else if (emotion === 'mystical' || emotion === 'dreamy') {
      primary = 'yokai-cel';
    }

    // 主题覆盖
    if (theme === 'war') {
      primary = 'epic-guoman';
    } else if (theme === 'sacred') {
      primary = 'dunhuang-mural';
    }

    return { primary, secondary };
  }

  /**
   * 获取风格完整配置
   */
  getStyleConfig(styleId) {
    return this.styles[styleId] || this.styles['epic-guoman'];
  }

  /**
   * 混合visualDNA
   */
  mixVisualDNA(styleId1, styleId2, blendRatio = 0.3) {
    const style1 = this.getStyleConfig(styleId1);
    const style2 = this.getStyleConfig(styleId2);

    const mixed = {};
    Object.keys(style1.visualDNA).forEach(key => {
      const v1 = style1.visualDNA[key];
      const v2 = style2.visualDNA[key];
      mixed[key] = v1 * (1 - blendRatio) + v2 * blendRatio;
    });

    return {
      primary: styleId1,
      secondary: styleId2,
      blendRatio,
      visualDNA: mixed,
      toneMapping: style1.toneMapping,
      motionSpeed: style1.motionSpeed * (1 - blendRatio) + style2.motionSpeed * blendRatio
    };
  }

  /**
   * 验证风格兼容性
   */
  validateCompatibility(styleId1, styleId2) {
    const incompatible = [
      ['dark-realism', 'shuimo-poetry'] // 已排序
    ];

    const pair = [styleId1, styleId2].sort();
    const isIncompatible = incompatible.some(
      ([a, b]) => pair[0] === a && pair[1] === b
    );

    return {
      compatible: !isIncompatible,
      warning: isIncompatible ? '水墨与暗黑风格互斥，混合需谨慎' : null
    };
  }

  /**
   * 生成Seedance可用提示词片段
   */
  buildSeedanceTemplate(styleId, options = {}) {
    const style = this.getStyleConfig(styleId);

    const prefixParts = [
      `${style.name}风格`,
      style.visualDNA.inkInfluence > 0.5 ? '水墨晕染' : '数字渲染'
    ];

    const suffixParts = [
      style.visualDNA.glowIntensity > 0.5 ? '金色光芒流动' : '',
      style.visualDNA.inkInfluence > 0.5 ? '墨色晕染扩散' : ''
    ].filter(Boolean);

    return {
      prefix: prefixParts.join('，'),
      suffix: suffixParts.join('，'),
      visualDNA: style.visualDNA,
      toneMapping: style.toneMapping,
      motionSpeed: style.motionSpeed
    };
  }

  /**
   * 根据情绪选择辅助风格
   */
  selectSecondaryStyles(emotion, primaryStyle) {
    const emotionMap = {
      serene: ['shuimo-poetry'],
      mystical: ['yokai-cel'],
      fearful: ['dark-realism'],
      grand: ['epic-guoman'],
      sacred: ['dunhuang-mural']
    };

    const candidates = emotionMap[emotion] || [];
    return candidates.filter(s => s !== primaryStyle);
  }

  /**
   * 根据情感配方选择风格
   */
  selectStyleByEmotionFormula(formulaId) {
    const formula = this.emotionFormula[formulaId];
    if (!formula) {
      return this.selectStyle('natural_god', 'serene');
    }

    return {
      primary: formula.primaryStyle,
      secondary: formula.secondaryStyle,
      blendRatio: formula.blendRatio,
      visualDNA: formula.visualDNA,
      lighting: formula.lighting,
      lens: formula.lens,
      movement: formula.movement,
      description: formula.description
    };
  }

  /**
   * 获取小G视角风格
   */
  getXGPerspectiveStyle() {
    return this.xgPerspective;
  }

  /**
   * 根据区域获取风格
   */
  selectStyleByRegion(regionId) {
    const mapping = this.regionMap[regionId];
    if (!mapping) {
      return { primary: 'epic-guoman', secondary: null, mood: '通用' };
    }
    return mapping;
  }

  /**
   * 获取所有情感配方
   */
  getAllEmotionFormulas() {
    return this.emotionFormula;
  }

  /**
   * 获取区域风格映射
   */
  getAllRegionStyleMappings() {
    return this.regionMap;
  }
}

// ============ 导出 ============
module.exports = {
  StyleRouter,
  SHANHAI_STYLES,
  STYLE_DECISION_MATRIX,
  EMOTION_FORMULA_STYLE_MAP,
  XG_PERSPECTIVE_STYLE,
  REGION_TO_STYLE_MAP
};

// CLI 测试
if (require.main === module) {
  const router = new StyleRouter();

  console.log('\n🎨 Nirath原创世界观风格路由系统测试\n');

  const styleSelection = router.selectStyle('natural_god', 'fear');
  console.log('自然神+恐惧风格选择：', styleSelection);

  const config = router.getStyleConfig(styleSelection.primary);
  console.log('主风格配置：', config.name, config.visualDNA);

  const mixed = router.mixVisualDNA('epic-guoman', 'shuimo-poetry', 0.3);
  console.log('混合风格DNA：', mixed.visualDNA);
}