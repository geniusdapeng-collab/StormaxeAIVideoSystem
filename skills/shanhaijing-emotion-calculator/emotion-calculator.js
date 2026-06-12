#!/usr/bin/env node
/**
 * Nirath原创世界观情感曲线计算器 — Shanhaijing Emotional Curve Calculator
 *
 * 将70/20/10情感配方转化为可执行的分镜时间线
 * 输入：集数 + 场景类型
 * 输出：每镜头的情绪标签、持续时间、运镜参数
 */

// ============ 情感配方基准 ============
const EMOTION_FORMULA_BASELINE = {
  gentleSadness: {
    name: '温柔悲伤',
    baseline: 0.70,
    tolerance: 0.05,
    range: [0.65, 0.75],
    description: '贯穿全片的基底情绪——如微风般持续存在的轻微忧伤',
    visualSignature: '柔光+低饱和度+浅景深',
    cameraSignature: '跟拍/慢速推轨/长镜头',
    durationMin: 3,
    durationMax: 8
  },
  aweMagnificence: {
    name: '惊叹壮美',
    baseline: 0.20,
    tolerance: 0.05,
    range: [0.15, 0.25],
    description: '阶段性爆发的宏大情绪——如惊雷般震撼的壮丽体验',
    visualSignature: '逆光+高饱和度+广角',
    cameraSignature: '急速上升/环绕/升格',
    durationMin: 2,
    durationMax: 5
  },
  burningHope: {
    name: '燃烧希望',
    baseline: 0.10,
    tolerance: 0.05,
    range: [0.05, 0.15],
    description: '关键节点的爆发情绪——如火焰般燃烧的希望之光',
    visualSignature: '强轮廓光+高对比+暖色',
    cameraSignature: '急速推进/稳定器/轨道',
    durationMin: 1,
    durationMax: 3
  }
};

// ============ 场景类型→情感曲线模板 ============
const SCENE_TYPE_TEMPLATES = {
  beast_entrance: {
    name: '异兽出场',
    shotCount: 5,
    curve: [
      { emotion: 'gentleSadness', intensity: 0.6, duration: 3, shot: 'establishing' },
      { emotion: 'aweMagnificence', intensity: 0.8, duration: 4, shot: 'reveal' },
      { emotion: 'gentleSadness', intensity: 0.5, duration: 3, shot: 'intimacy' },
      { emotion: 'burningHope', intensity: 0.3, duration: 2, shot: 'connection' },
      { emotion: 'gentleSadness', intensity: 0.7, duration: 3, shot: 'departure' }
    ],
    totalDuration: 15,
    emotionRatio: { gentleSadness: 0.60, aweMagnificence: 0.27, burningHope: 0.13 }
  },
  xg_growth_moment: {
    name: '小G成长时刻',
    shotCount: 4,
    curve: [
      { emotion: 'gentleSadness', intensity: 0.7, duration: 4, shot: 'struggle' },
      { emotion: 'burningHope', intensity: 0.6, duration: 3, shot: 'breakthrough' },
      { emotion: 'aweMagnificence', intensity: 0.4, duration: 2, shot: 'realization' },
      { emotion: 'gentleSadness', intensity: 0.5, duration: 3, shot: 'acceptance' }
    ],
    totalDuration: 12,
    emotionRatio: { gentleSadness: 0.58, aweMagnificence: 0.17, burningHope: 0.25 }
  },
  farewell_scene: {
    name: '离别场景',
    shotCount: 6,
    curve: [
      { emotion: 'gentleSadness', intensity: 0.8, duration: 5, shot: 'lingering' },
      { emotion: 'gentleSadness', intensity: 0.9, duration: 4, shot: 'last_look' },
      { emotion: 'burningHope', intensity: 0.2, duration: 2, shot: 'flicker' },
      { emotion: 'gentleSadness', intensity: 1.0, duration: 5, shot: 'departure' },
      { emotion: 'gentleSadness', intensity: 0.7, duration: 4, shot: 'aftermath' },
      { emotion: 'burningHope', intensity: 0.1, duration: 2, shot: 'memory' }
    ],
    totalDuration: 22,
    emotionRatio: { gentleSadness: 0.86, aweMagnificence: 0, burningHope: 0.14 }
  },
  discovery_scene: {
    name: '发现场景',
    shotCount: 4,
    curve: [
      { emotion: 'gentleSadness', intensity: 0.4, duration: 2, shot: 'wandering' },
      { emotion: 'aweMagnificence', intensity: 0.7, duration: 3, shot: 'discovery' },
      { emotion: 'burningHope', intensity: 0.5, duration: 3, shot: 'wonder' },
      { emotion: 'gentleSadness', intensity: 0.3, duration: 2, shot: 'reflection' }
    ],
    totalDuration: 10,
    emotionRatio: { gentleSadness: 0.40, aweMagnificence: 0.30, burningHope: 0.30 }
  },
  sacred_ritual: {
    name: '神圣仪式',
    shotCount: 5,
    curve: [
      { emotion: 'gentleSadness', intensity: 0.5, duration: 3, shot: 'preparation' },
      { emotion: 'aweMagnificence', intensity: 0.9, duration: 4, shot: 'invocation' },
      { emotion: 'burningHope', intensity: 0.7, duration: 3, shot: 'climax' },
      { emotion: 'aweMagnificence', intensity: 0.6, duration: 3, shot: 'manifestation' },
      { emotion: 'gentleSadness', intensity: 0.6, duration: 3, shot: 'completion' }
    ],
    totalDuration: 16,
    emotionRatio: { gentleSadness: 0.38, aweMagnificence: 0.44, burningHope: 0.19 }
  },
  daily_life: {
    name: '日常生活',
    shotCount: 3,
    curve: [
      { emotion: 'gentleSadness', intensity: 0.5, duration: 4, shot: 'routine' },
      { emotion: 'gentleSadness', intensity: 0.6, duration: 3, shot: 'interaction' },
      { emotion: 'gentleSadness', intensity: 0.4, duration: 3, shot: 'rest' }
    ],
    totalDuration: 10,
    emotionRatio: { gentleSadness: 1.0, aweMagnificence: 0, burningHope: 0 }
  }
};

// ============ 情感镜头规格库 ============
const EMOTION_SHOT_SPECS = {
  gentleSadness: {
    lens: '50-85mm',
    aperture: 'f/1.4-f/2.8',
    movement: '缓慢推轨/跟拍',
    lighting: '柔光散射+暖调',
    colorGrade: '低饱和度+暖色温',
    depthOfField: '浅景深',
    durationRange: [3, 8],
    soundDesign: '低频嗡鸣+环境音',
    pacing: '慢速',
    composition: '近景为主，留空间感'
  },
  aweMagnificence: {
    lens: '16-35mm广角',
    aperture: 'f/5.6-f/8',
    movement: '急速上升/环绕/升格',
    lighting: '逆光+体积光',
    colorGrade: '高饱和度+冷/暖对比',
    depthOfField: '全景深',
    durationRange: [2, 5],
    soundDesign: '低频轰鸣+高频泛音',
    pacing: '加速',
    composition: '宏大构图，对比鲜明'
  },
  burningHope: {
    lens: '35-50mm',
    aperture: 'f/2.0-f/4',
    movement: '急速推进/稳定器',
    lighting: '强轮廓光+暖调',
    colorGrade: '高对比+暖色突出',
    depthOfField: '中等景深',
    durationRange: [1, 3],
    soundDesign: '渐强音+高频光芒声',
    pacing: '快速',
    composition: '中心构图，光芒向外辐射'
  }
};

// ============ 季节→情感曲线调整因子 ============
const SEASON_EMOTION_ADJUSTMENTS = {
  S1: {
    gentleSadness: { multiplier: 0.8, note: '灵生季——陌生感为主，悲伤较轻' },
    aweMagnificence: { multiplier: 1.2, note: '灵生季——新世界惊奇感强烈' },
    burningHope: { multiplier: 0.5, note: '灵生季——希望萌芽，尚未燃烧' }
  },
  S2: {
    gentleSadness: { multiplier: 0.9, note: '灵盛季——建立连接，悲伤与温暖并存' },
    aweMagnificence: { multiplier: 1.0, note: '灵盛季——世界熟悉，惊奇感平稳' },
    burningHope: { multiplier: 1.2, note: '灵盛季——成长带来希望增强' }
  },
  S3: {
    gentleSadness: { multiplier: 1.3, note: '灵收季——失去带来悲伤峰值' },
    aweMagnificence: { multiplier: 0.7, note: '灵收季——壮丽被失去阴影笼罩' },
    burningHope: { multiplier: 0.8, note: '灵收季——希望艰难维持' }
  },
  S4: {
    gentleSadness: { multiplier: 1.0, note: '灵藏季——悲伤沉淀为平静' },
    aweMagnificence: { multiplier: 1.1, note: '灵藏季——终极壮丽——传承完成' },
    burningHope: { multiplier: 1.5, note: '灵藏季——希望燃烧至最高——未来可期' }
  }
};

// ============ 情感曲线计算器核心类 ============
class EmotionalCurveCalculator {
  constructor() {
    this.baseline = EMOTION_FORMULA_BASELINE;
    this.templates = SCENE_TYPE_TEMPLATES;
    this.specs = EMOTION_SHOT_SPECS;
    this.seasonAdjustments = SEASON_EMOTION_ADJUSTMENTS;
  }

  /**
   * 计算指定场景的情感曲线
   */
  calculateSceneCurve(sceneType, season = 'S1', options = {}) {
    const template = this.templates[sceneType];
    if (!template) return null;

    const adjustment = this.seasonAdjustments[season] || this.seasonAdjustments.S1;

    // 应用季节调整
    const adjustedCurve = template.curve.map(shot => {
      const adj = adjustment[shot.emotion];
      const adjustedIntensity = Math.min(1.0, shot.intensity * (adj?.multiplier || 1.0));

      return {
        ...shot,
        originalIntensity: shot.intensity,
        adjustedIntensity,
        seasonNote: adj?.note || '',
        specs: this.getShotSpecs(shot.emotion)
      };
    });

    // 计算实际情感比例
    const totalDuration = adjustedCurve.reduce((sum, s) => sum + s.duration, 0);
    const actualRatios = {
      gentleSadness: adjustedCurve
        .filter(s => s.emotion === 'gentleSadness')
        .reduce((sum, s) => sum + s.duration, 0) / totalDuration,
      aweMagnificence: adjustedCurve
        .filter(s => s.emotion === 'aweMagnificence')
        .reduce((sum, s) => sum + s.duration, 0) / totalDuration,
      burningHope: adjustedCurve
        .filter(s => s.emotion === 'burningHope')
        .reduce((sum, s) => sum + s.duration, 0) / totalDuration
    };

    // 验证是否偏离目标
    const validations = this.validateRatios(actualRatios);

    return {
      sceneType,
      season,
      shots: adjustedCurve,
      totalDuration,
      targetRatios: {
        gentleSadness: this.baseline.gentleSadness.baseline,
        aweMagnificence: this.baseline.aweMagnificence.baseline,
        burningHope: this.baseline.burningHope.baseline
      },
      actualRatios,
      deviations: validations.deviations,
      passed: validations.passed,
      shotCount: adjustedCurve.length
    };
  }

  /**
   * 获取情感镜头的完整规格
   */
  getShotSpecs(emotion) {
    return this.specs[emotion] || null;
  }

  /**
   * 验证情感比例是否在容忍范围内
   */
  validateRatios(actualRatios) {
    const deviations = [];
    let passed = true;

    Object.entries(this.baseline).forEach(([emotion, config]) => {
      const actual = actualRatios[emotion] || 0;
      const target = config.baseline;
      const tolerance = config.tolerance;
      const deviation = Math.abs(actual - target);

      if (deviation > tolerance) {
        passed = false;
        deviations.push({
          emotion,
          target,
          actual: Math.round(actual * 100) / 100,
          deviation: Math.round(deviation * 100) / 100,
          tolerance,
          severity: deviation > tolerance * 2 ? 'CRITICAL' : 'WARNING'
        });
      }
    });

    return { passed, deviations };
  }

  /**
   * 计算整集的情感配方
   */
  calculateEpisodeFormula(season, scenes = []) {
    if (scenes.length === 0) {
      // 使用默认场景组合
      scenes = [
        { type: 'daily_life', count: 2 },
        { type: 'beast_entrance', count: 1 },
        { type: 'discovery_scene', count: 1 }
      ];
    }

    let totalDuration = 0;
    const emotionDurations = {
      gentleSadness: 0,
      aweMagnificence: 0,
      burningHope: 0
    };

    const sceneCurves = scenes.map(scene => {
      const curve = this.calculateSceneCurve(scene.type, season);
      if (!curve) return null;

      totalDuration += curve.totalDuration * scene.count;
      Object.entries(emotionDurations).forEach(([emotion]) => {
        emotionDurations[emotion] +=
          (curve.actualRatios[emotion] * curve.totalDuration * scene.count);
      });

      return { type: scene.type, count: scene.count, ...curve };
    }).filter(Boolean);

    const actualRatios = {
      gentleSadness: emotionDurations.gentleSadness / totalDuration,
      aweMagnificence: emotionDurations.aweMagnificence / totalDuration,
      burningHope: emotionDurations.burningHope / totalDuration
    };

    const validation = this.validateRatios(actualRatios);

    return {
      season,
      scenes: sceneCurves,
      totalDuration,
      emotionDurations,
      actualRatios: {
        gentleSadness: Math.round(actualRatios.gentleSadness * 100) / 100,
        aweMagnificence: Math.round(actualRatios.aweMagnificence * 100) / 100,
        burningHope: Math.round(actualRatios.burningHope * 100) / 100
      },
      targetRatios: {
        gentleSadness: this.baseline.gentleSadness.baseline,
        aweMagnificence: this.baseline.aweMagnificence.baseline,
        burningHope: this.baseline.burningHope.baseline
      },
      deviations: validation.deviations,
      passed: validation.passed
    };
  }

  /**
   * 生成镜头级情感时间线
   */
  generateShotTimeline(sceneType, season) {
    const curve = this.calculateSceneCurve(sceneType, season);
    if (!curve) return null;

    let currentTime = 0;
    const timeline = curve.shots.map((shot, index) => {
      const startTime = currentTime;
      const endTime = currentTime + shot.duration;
      currentTime = endTime;

      return {
        shotIndex: index + 1,
        emotion: shot.emotion,
        emotionName: this.baseline[shot.emotion].name,
        intensity: shot.adjustedIntensity,
        duration: shot.duration,
        startTime,
        endTime,
        shotType: shot.shot,
        specs: shot.specs
      };
    });

    return {
      sceneType,
      season,
      totalDuration: curve.totalDuration,
      timeline,
      emotionRatios: curve.actualRatios
    };
  }

  /**
   * 获取所有场景类型列表
   */
  getAllSceneTypes() {
    return Object.entries(this.templates).map(([id, template]) => ({
      id,
      name: template.name,
      shotCount: template.shotCount,
      totalDuration: template.totalDuration
    }));
  }

  /**
   * 获取情感配方基准
   */
  getFormulaBaseline() {
    return this.baseline;
  }

  /**
   * 获取季节调整因子
   */
  getSeasonAdjustment(season) {
    return this.seasonAdjustments[season] || null;
  }
}

// ============ 导出 ============
module.exports = {
  EmotionalCurveCalculator,
  EMOTION_FORMULA_BASELINE,
  SCENE_TYPE_TEMPLATES,
  EMOTION_SHOT_SPECS,
  SEASON_EMOTION_ADJUSTMENTS
};

// CLI 测试
if (require.main === module) {
  const calculator = new EmotionalCurveCalculator();

  console.log('\n📊 Nirath原创世界观情感曲线计算器测试\n');

  // 测试异兽出场场景
  console.log('=== 场景: 异兽出场 (S1) ===');
  const entranceCurve = calculator.calculateSceneCurve('beast_entrance', 'S1');
  console.log(`镜头数: ${entranceCurve.shotCount}`);
  console.log(`总时长: ${entranceCurve.totalDuration}s`);
  console.log(`实际比例: 温柔悲伤${(entranceCurve.actualRatios.gentleSadness * 100).toFixed(1)}% / 惊叹壮美${(entranceCurve.actualRatios.aweMagnificence * 100).toFixed(1)}% / 燃烧希望${(entranceCurve.actualRatios.burningHope * 100).toFixed(1)}%`);
  console.log(`目标比例: 温柔悲伤70% / 惊叹壮美20% / 燃烧希望10%`);
  console.log(`校验结果: ${entranceCurve.passed ? '✅ 通过' : '❌ 偏离'}`);
  if (!entranceCurve.passed) {
    entranceCurve.deviations.forEach(d => {
      console.log(`  ${d.severity}: ${d.emotion} 偏离 ${(d.deviation * 100).toFixed(1)}%`);
    });
  }
  console.log();

  // 测试离别场景
  console.log('=== 场景: 离别场景 (S3) ===');
  const farewellCurve = calculator.calculateSceneCurve('farewell_scene', 'S3');
  console.log(`镜头数: ${farewellCurve.shotCount}`);
  console.log(`总时长: ${farewellCurve.totalDuration}s`);
  console.log(`实际比例: 温柔悲伤${(farewellCurve.actualRatios.gentleSadness * 100).toFixed(1)}% / 惊叹壮美${(farewellCurve.actualRatios.aweMagnificence * 100).toFixed(1)}% / 燃烧希望${(farewellCurve.actualRatios.burningHope * 100).toFixed(1)}%`);
  console.log(`校验结果: ${farewellCurve.passed ? '✅ 通过' : '❌ 偏离'}`);
  console.log();

  // 测试镜头时间线
  console.log('=== 镜头时间线: 异兽出场 (S2) ===');
  const timeline = calculator.generateShotTimeline('beast_entrance', 'S2');
  timeline.timeline.forEach(shot => {
    console.log(`镜头${shot.shotIndex}: ${shot.emotionName} 强度${(shot.intensity * 100).toFixed(0)}% | ${shot.startTime}s-${shot.endTime}s | ${shot.specs.lens} | ${shot.specs.movement}`);
  });
  console.log();

  // 测试整集配方
  console.log('=== 整集配方: S2 (灵盛季) ===');
  const episodeFormula = calculator.calculateEpisodeFormula('S2');
  console.log(`总时长: ${episodeFormula.totalDuration}s`);
  console.log(`实际比例: 温柔悲伤${(episodeFormula.actualRatios.gentleSadness * 100).toFixed(1)}% / 惊叹壮美${(episodeFormula.actualRatios.aweMagnificence * 100).toFixed(1)}% / 燃烧希望${(episodeFormula.actualRatios.burningHope * 100).toFixed(1)}%`);
  console.log(`校验结果: ${episodeFormula.passed ? '✅ 通过' : '❌ 偏离'}`);
}