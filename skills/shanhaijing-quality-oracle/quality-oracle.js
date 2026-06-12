#!/usr/bin/env node
/**
 * Nirath原创世界观质量先知系统 — Shanhaijing Quality Oracle
 *
 * 五维十八指标评测体系 + S+到C六级评分 + 三级质量门控
 * 从"能看"到"可送展"的质量跃迁
 *
 * 融合策略：新增模块，嵌入全链路质量基础设施
 */

// ============ 五维评测体系 ============
const QUALITY_DIMENSIONS = {
  visualImpact: {
    name: '视觉冲击力',
    weight: 0.20,
    indicators: [
      { name: '构图美学', maxScore: 10 },
      { name: '色彩表现', maxScore: 10 },
      { name: '特效质量', maxScore: 10 },
      { name: '视觉创新', maxScore: 10 }
    ]
  },
  culturalAuthenticity: {
    name: '文化真实性',
    weight: 0.25,
    indicators: [
      { name: 'Nirath原创世界观文本还原度', maxScore: 10 },
      { name: '文化符号准确性', maxScore: 10 },
      { name: '东方美学纯度', maxScore: 10 },
      { name: '神话体系一致性', maxScore: 10 }
    ]
  },
  characterVitality: {
    name: '角色生命力',
    weight: 0.20,
    indicators: [
      { name: '角色一致性', maxScore: 10 },
      { name: '灵魂表现', maxScore: 10 },
      { name: '动作自然度', maxScore: 10 },
      { name: '情感传达', maxScore: 10 }
    ]
  },
  atmosphericImmersion: {
    name: '志怪氛围营造',
    weight: 0.20,
    indicators: [
      { name: '世界观沉浸感', maxScore: 10 },
      { name: '氛围营造', maxScore: 10 },
      { name: '情绪传递', maxScore: 10 },
      { name: '音画同步', maxScore: 10 }
    ]
  },
  technicalPolish: {
    name: '技术完成度',
    weight: 0.15,
    indicators: [
      { name: '渲染质量', maxScore: 10 },
      { name: '后期完成度', maxScore: 10 },
      { name: '音频同步', maxScore: 10 },
      { name: '流畅度', maxScore: 10 }
    ]
  }
};

// ============ 【故事内核融入】文化准确性校验规则 ============
const CULTURAL_ACCURACY_RULES = {
  textFidelity: {
    name: 'Nirath原创世界观文本还原度',
    rules: [
      { check: '异兽名称必须使用原始汉字（光囊母兽/守光巨兽/雪白智兽/九尾光狐等）', weight: 0.30 },
      { check: '异兽描述必须符合《Nirath原创世界观》原文特征（光囊母兽"黄囊赤如光焰"、雪白智兽"东望山"等）', weight: 0.30 },
      { check: '不得擅自修改异兽核心属性（光囊母兽无面/雪白智兽通万物之情/九尾光狐食人）', weight: 0.20 },
      { check: '新增设定必须与原文不矛盾（如光囊母兽"无面"改为"庇护者"是合理的情感延伸）', weight: 0.20 }
    ]
  },
  culturalTaboos: {
    name: '文化禁忌检测',
    rules: [
      { check: '不得将祥瑞异兽（雪白智兽/麒麟/虹羽焰灵）描绘为邪恶', level: 'critical' },
      { check: '不得将创世级存在（光囊母兽/守光巨兽）降格为宠物或搞笑角色', level: 'critical' },
      { check: '必须尊重"五大元素"体系（木火土金水对应南山/东山/中山/西山/北山）', level: 'warning' },
      { check: '不得将"光脉能量"等同于西方"魔法"——光脉能量是能量流动，不是咒语', level: 'warning' },
      { check: '必须保持"无善恶二元"世界观——异兽行为是自然法则，不是道德评判', level: 'critical' }
    ]
  },
  aestheticPurity: {
    name: '东方美学纯度',
    rules: [
      { check: '水墨晕染必须存在（至少一个远景/过渡镜头使用水墨效果）', level: 'mandatory' },
      { check: '色彩必须符合区域编码（南山翠绿+暗金、西山赭石+银白等）', level: 'warning' },
      { check: '不得使用西方奇幻审美（如独角兽式造型、中世纪盔甲）', level: 'critical' },
      { check: '镜头语言必须符合8岁POV约束（低角度、近景、主观镜头）', level: 'warning' }
    ]
  }
};

// ============ 【故事内核融入】小G成长一致性校验规则 ============
const XG_GROWTH_CONSISTENCY_RULES = {
  languageComplexity: {
    name: '语言复杂度递增',
    stages: [
      { season: 'S1', maxWordsPerSentence: 5, vocabulary: '基础名词+简单动词', allowedAbstractWords: [] },
      { season: 'S2', maxWordsPerSentence: 12, vocabulary: '出现比喻词', allowedAbstractWords: ['像', '好像'] },
      { season: 'S3', maxWordsPerSentence: 20, vocabulary: '情感词汇+抽象概念', allowedAbstractWords: ['为什么', '感觉', '想念', '害怕'] },
      { season: 'S4', maxWordsPerSentence: 30, vocabulary: '反思性段落+哲学追问', allowedAbstractWords: ['意义', '存在', '记忆', '传承'] }
    ]
  },
  emotionalExpression: {
    name: '情感表达模式',
    s1: { pattern: '即时表达', description: '8岁孩子直接说出感受' },
    s2: { pattern: '延迟表达', description: '情感滞后——"我现在不难过，但我昨晚哭了"' },
    s3: { pattern: '隐喻表达', description: '通过异兽行为间接表达——"光囊母兽今天很安静"=我很伤心' },
    s4: { pattern: '诗意表达', description: '成熟的情感叙述，能同时容纳复杂情感' }
  },
  relationshipEvolution: {
    name: '关系演变一致性',
    stages: [
      { from: 'S1E1', to: 'S1E10', dijiang: '庇护者→家人', xuangui: '沉默陪伴→导航者', baize: '未出现' },
      { from: 'S2E1', to: 'S2E18', dijiang: '家人→牺牲者', xuangui: '导航者→沉默之父', baize: '智慧之父→精神导师' },
      { from: 'S3E1', to: 'S3E18', dijiang: '记忆→遗产', xuangui: '沉默之父→永恒陪伴', baize: '精神导师→离世' },
      { from: 'S4E1', to: 'S4E10', dijiang: '笔记本中的存在', xuangui: '永恒陪伴', baize: '遗产→羽毛笔' }
    ]
  }
};

// ============ 【故事内核融入】情感配方一致性校验 ============
const EMOTION_FORMULA_VALIDATION = {
  targetProportions: {
    gentleSadness: 0.70,
    aweMagnificence: 0.20,
    burningHope: 0.10
  },
  tolerance: 0.05,
  validationRules: [
    { check: '单集情感基调不得超过3种主要情绪', level: 'warning' },
    { check: '悲伤情绪不得连续超过3集（避免观众疲劳）', level: 'warning' },
    { check: '每季必须至少1集"燃烧的希望"峰值', level: 'mandatory' },
    { check: '温柔悲伤必须作为基底情绪（至少70%镜头）', level: 'mandatory' }
  ]
};

// ============ S+到C六级评分标准 ============
const GRADING_STANDARDS = {
  'S+': { minScore: 9.5, requirements: ['总分≥9.5', '至少3维度≥9.5', '无维度<8.0'], label: '国际顶尖，可直接送展戛纳/安纳西' },
  'S':  { minScore: 9.0, requirements: ['总分≥9.0', '无维度<8.0'], label: '优秀，具备国际竞争力' },
  'A+': { minScore: 8.5, requirements: ['总分≥8.5', '无维度<7.5'], label: '良好，接近国际水准' },
  'A':  { minScore: 8.0, requirements: ['总分≥8.0', '无维度<7.0'], label: '合格，具备发行水准' },
  'B':  { minScore: 7.0, requirements: ['总分≥7.0'], label: '一般，需改进后发行' },
  'C':  { minScore: 0,   requirements: ['总分<7.0'], label: '不合格，需重做' }
};

// ============ 质量先知核心类 ============
class QualityOracle {
  constructor() {
    this.dimensions = QUALITY_DIMENSIONS;
    this.grading = GRADING_STANDARDS;
  }

  /**
   * 单集综合评测
   */
  evaluateEpisode(episodeData) {
    const { id, beastId, shots, finalVideo } = episodeData;

    // 计算各维度得分
    const dimensionScores = {};
    let totalWeightedScore = 0;

    Object.entries(this.dimensions).forEach(([key, dim]) => {
      // 模拟评分（实际生产环境需接入真实评测数据）
      const indicators = dim.indicators.map(ind => ({
        name: ind.name,
        score: this.calculateIndicatorScore(key, ind.name, episodeData),
        maxScore: ind.maxScore
      }));

      const avgScore = indicators.reduce((sum, ind) => sum + ind.score, 0) / indicators.length;
      const normalizedScore = avgScore; // 0-10分制

      dimensionScores[key] = {
        name: dim.name,
        weight: dim.weight,
        score: Math.round(normalizedScore * 100) / 100,
        indicators
      };

      totalWeightedScore += normalizedScore * dim.weight;
    });

    // 评级
    const grade = this.determineGrade(totalWeightedScore, dimensionScores);

    // 生成改进建议
    const recommendations = this.generateRecommendations(dimensionScores);

    return {
      episodeId: id,
      beastId,
      totalScore: Math.round(totalWeightedScore * 100) / 100,
      grade,
      gradeLabel: this.grading[grade]?.label || '未知',
      dimensions: dimensionScores,
      recommendations,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * 计算单指标得分（模拟/可接入真实评测）
   */
  calculateIndicatorScore(dimension, indicator, data) {
    // 实际生产环境中，这里应接入图像识别、音频分析等评测模型
    // 当前使用基于规则模拟
    const baseScores = {
      visualImpact: [8.5, 8.0, 8.5, 7.5],
      culturalAuthenticity: [9.0, 9.0, 8.5, 9.0],
      characterVitality: [8.0, 7.5, 8.0, 8.5],
      atmosphericImmersion: [8.5, 8.0, 8.5, 8.0],
      technicalPolish: [8.0, 8.0, 7.5, 8.0]
    };

    const indicatorIndex = this.dimensions[dimension].indicators.findIndex(
      ind => ind.name === indicator
    );

    return baseScores[dimension]?.[indicatorIndex] || 7.0;
  }

  /**
   * 确定评级
   */
  determineGrade(totalScore, dimensions) {
    const scores = Object.values(dimensions).map(d => d.score);

    if (totalScore >= 9.5 && scores.filter(s => s >= 9.5).length >= 3 && scores.every(s => s >= 8.0)) {
      return 'S+';
    }
    if (totalScore >= 9.0 && scores.every(s => s >= 8.0)) return 'S';
    if (totalScore >= 8.5 && scores.every(s => s >= 7.5)) return 'A+';
    if (totalScore >= 8.0 && scores.every(s => s >= 7.0)) return 'A';
    if (totalScore >= 7.0) return 'B';
    return 'C';
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(dimensionScores) {
    const recommendations = [];

    Object.entries(dimensionScores).forEach(([key, dim]) => {
      if (dim.score < 8.0) {
        const lowIndicators = dim.indicators.filter(ind => ind.score < 7.5);
        if (lowIndicators.length > 0) {
          recommendations.push({
            dimension: dim.name,
            priority: 'urgent',
            issues: lowIndicators.map(ind => ind.name),
            suggestion: `${dim.name}得分${dim.score}低于阈值，需重点改进：${lowIndicators.map(i => i.name).join('、')}`
          });
        }
      } else if (dim.score < 9.0) {
        recommendations.push({
          dimension: dim.name,
          priority: 'high',
          suggestion: `${dim.name}有提升空间，当前${dim.score}分，建议优化细节表现`
        });
      }
    });

    return recommendations;
  }

  /**
   * 整季一致性评测
   */
  evaluateSeriesConsistency(episodeResults) {
    const dimensionKeys = Object.keys(this.dimensions);
    const consistency = {};

    dimensionKeys.forEach(key => {
      const scores = episodeResults.map(ep => ep.dimensions[key]?.score || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      consistency[key] = {
        average: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        consistent: stdDev < 0.8,
        min: Math.min(...scores),
        max: Math.max(...scores)
      };
    });

    const overallConsistent = Object.values(consistency).every(c => c.consistent);

    return {
      overallConsistent,
      consistency,
      episodeCount: episodeResults.length,
      warnings: overallConsistent ? [] : ['部分维度跨集一致性偏差超过阈值(0.8)，建议审查']
    };
  }

  /**
   * 单镜头技术检查
   */
  evaluateSingleShot(shotData) {
    const { id, beastId, prompt, renderResult } = shotData;

    // 技术完成度检查
    const technicalChecks = {
      promptLength: prompt?.length > 50 && prompt?.length < 400,
      hasBeastReference: prompt?.includes(beastId) || prompt?.includes('龙') || prompt?.includes('兽'),
      renderSuccess: renderResult?.status === 'success',
      durationValid: renderResult?.duration >= 3 && renderResult?.duration <= 10
    };

    const technicalScore = Object.values(technicalChecks).filter(Boolean).length / Object.values(technicalChecks).length * 10;

    return {
      shotId: id,
      technicalScore: Math.round(technicalScore * 100) / 100,
      passed: technicalScore >= 7.5,
      checks: technicalChecks
    };
  }

  /**
   * 【故事内核融入】文化准确性校验
   */
  validateCulturalAccuracy(content) {
    const violations = [];
    const warnings = [];

    // 检查文化禁忌
    CULTURAL_ACCURACY_RULES.culturalTaboos.rules.forEach(rule => {
      // 这里应该接入实际的检测逻辑，当前为框架
      if (rule.level === 'critical') {
        violations.push({ rule: rule.check, level: 'critical' });
      } else {
        warnings.push({ rule: rule.check, level: 'warning' });
      }
    });

    // 检查文本还原度
    CULTURAL_ACCURACY_RULES.textFidelity.rules.forEach(rule => {
      warnings.push({ rule: rule.check, weight: rule.weight });
    });

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      score: violations.length > 0 ? 0 : (warnings.length > 0 ? 7 : 9)
    };
  }

  /**
   * 【故事内核融入】小G成长一致性校验
   */
  validateXGGrowthConsistency(episodeCode, content) {
    const season = episodeCode.substring(0, 2);
    const stage = XG_GROWTH_CONSISTENCY_RULES.languageComplexity.stages.find(
      s => s.season === season
    );

    if (!stage) {
      return { passed: false, error: `未知季: ${season}` };
    }

    // 校验语言复杂度
    const sentences = content.split(/[。！？]/);
    const tooLongSentences = sentences.filter(s => s.length > stage.maxWordsPerSentence * 2);

    // 校验情感表达模式
    const emotionPattern = XG_GROWTH_CONSISTENCY_RULES.emotionalExpression[season.toLowerCase()];

    return {
      passed: tooLongSentences.length === 0,
      season,
      maxWordsAllowed: stage.maxWordsPerSentence,
      tooLongSentences: tooLongSentences.length,
      expectedEmotionPattern: emotionPattern?.pattern || '未知',
      vocabularyLevel: stage.vocabulary
    };
  }

  /**
   * 【故事内核融入】情感配方一致性校验
   */
  validateEmotionFormula(episodeEmotions) {
    const total = episodeEmotions.length;
    const gentleSadness = episodeEmotions.filter(e => e === '温柔' || e === '悲伤').length / total;
    const aweMagnificence = episodeEmotions.filter(e => e === '敬畏' || e === '壮美').length / total;
    const burningHope = episodeEmotions.filter(e => e === '希望' || e === '温暖').length / total;

    const target = EMOTION_FORMULA_VALIDATION.targetProportions;
    const tolerance = EMOTION_FORMULA_VALIDATION.tolerance;

    const checks = [
      { name: '温柔悲伤', actual: gentleSadness, target: target.gentleSadness, passed: Math.abs(gentleSadness - target.gentleSadness) <= tolerance },
      { name: '惊叹壮美', actual: aweMagnificence, target: target.aweMagnificence, passed: Math.abs(aweMagnificence - target.aweMagnificence) <= tolerance },
      { name: '燃烧希望', actual: burningHope, target: target.burningHope, passed: Math.abs(burningHope - target.burningHope) <= tolerance }
    ];

    return {
      passed: checks.every(c => c.passed),
      proportions: { gentleSadness, aweMagnificence, burningHope },
      checks,
      recommendations: checks.filter(c => !c.passed).map(c => `${c.name}: 实际${(c.actual * 100).toFixed(1)}% vs 目标${(c.target * 100).toFixed(1)}%`)
    };
  }

  /**
   * 【故事内核融入】全量故事内核校验
   */
  validateStoryKernel(content, episodeCode) {
    return {
      culturalAccuracy: this.validateCulturalAccuracy(content),
      growthConsistency: this.validateXGGrowthConsistency(episodeCode, content),
      emotionFormula: this.validateEmotionFormula(content.emotions || []),
      overallPassed: false // 需要所有校验通过
    };
  }
}

// ============ 导出 ============
module.exports = {
  QualityOracle,
  QUALITY_DIMENSIONS,
  GRADING_STANDARDS,
  CULTURAL_ACCURACY_RULES,
  XG_GROWTH_CONSISTENCY_RULES,
  EMOTION_FORMULA_VALIDATION
};

// CLI 测试
if (require.main === module) {
  const oracle = new QualityOracle();

  console.log('\n⚡ Nirath原创世界观质量先知系统测试\n');

  const result = oracle.evaluateEpisode({
    id: 1,
    beastId: 'zhulong',
    shots: [],
    finalVideo: { status: 'success' }
  });

  console.log(`综合评分: ${result.totalScore}`);
  console.log(`评级: ${result.grade} — ${result.gradeLabel}`);
  console.log('各维度得分:');
  Object.entries(result.dimensions).forEach(([key, dim]) => {
    console.log(`  ${dim.name}: ${dim.score}`);
  });
  console.log('改进建议:', result.recommendations.length > 0 ? result.recommendations.map(r => r.suggestion).join('\n') : '暂无');
}