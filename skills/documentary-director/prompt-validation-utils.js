// PromptValidationUtils — 通用 Prompt 校验工具集
// v6.14-Peng 第6批：将校验逻辑独立抽出为通用方法
// 可被 documentary-director、seedance-render-engine、shanhaijing-director 等系统复用

class PromptValidationUtils {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 990;
    this.minLength = options.minLength || 100;
    this.warnLength = options.warnLength || 950;
    this.maxUtilization = options.maxUtilization || 100;
    this.weights = options.weights || {
      subject: 1.5,      // 主体描述权重高
      action: 1.3,      // 动作权重高
      environment: 1.0,
      lighting: 0.8,
      camera: 0.7,
      style: 0.6,
      colors: 0.5,
      atmosphere: 0.3,   // 氛围权重低
      meta: 0.2,
    };
    this.stats = { validations: 0, passed: 0, warnings: 0, failures: 0 };
  }

  /**
   * 完整校验：长度 + 加权利用率 + 质量评分
   * @param {string} prompt - 待校验的 Prompt
   * @param {Object} options - 校验选项
   * @returns {Object} - { passed, score, weightedLength, utilization, issues, details }
   */
  validate(prompt, options = {}) {
    this.stats.validations++;
    const maxLen = options.maxLength || this.maxLength;
    const issues = [];
    const details = {};

    // 1. 长度检查
    const lengthCheck = this._checkLength(prompt, maxLen);
    details.length = lengthCheck;
    if (!lengthCheck.passed) {
      issues.push(...lengthCheck.issues);
    }

    // 2. 加权长度计算
    const weighted = this._calculateWeightedLength(prompt);
    details.weighted = weighted;

    // 3. 利用率计算
    const utilization = this._calculateUtilization(prompt, weighted.weightedLength, maxLen);
    details.utilization = utilization;

    // 4. 质量评分（0-100）
    const score = this._calculateScore(prompt, { lengthCheck, weighted, utilization }, options);
    details.score = score;

    // 5. 综合判定
    const passed = lengthCheck.passed && score >= 50;
    if (!passed) {
      this.stats.failures++;
    } else if (issues.length > 0) {
      this.stats.warnings++;
    } else {
      this.stats.passed++;
    }

    return {
      passed,
      score,
      weightedLength: weighted.weightedLength,
      utilization,
      issues,
      details,
      timestamp: Date.now(),
    };
  }

  /**
   * 快速校验：仅检查长度
   */
  quickValidate(prompt, maxLength = this.maxLength) {
    return this._checkLength(prompt, maxLength);
  }

  /**
   * 批量校验（用于 Pipeline 测试）
   */
  batchValidate(prompts, options = {}) {
    const results = [];
    for (const prompt of prompts) {
      const result = this.validate(prompt, options);
      results.push(result);
    }
    return {
      results,
      summary: this._summarize(results),
    };
  }

  /**
   * 检查长度
   */
  _checkLength(prompt, maxLen) {
    const len = prompt.length;
    const issues = [];

    if (len > maxLen) {
      issues.push(`长度 ${len} > 限制 ${maxLen}，超出 ${len - maxLen} 字符`);
    } else if (len > this.warnLength) {
      issues.push(`长度 ${len} 接近限制 ${maxLen}，仅剩 ${maxLen - len} 字符余量`);
    }

    if (len < this.minLength) {
      issues.push(`长度 ${len} < 最小 ${this.minLength}，可能信息不足`);
    }

    return {
      passed: len <= maxLen && len >= this.minLength,
      length: len,
      maxLength: maxLen,
      issues,
    };
  }

  /**
   * 计算加权长度（按字段重要性加权）
   */
  _calculateWeightedLength(prompt) {
    // 按逗号分隔，估算各字段
    const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    let totalWeight = 0;
    let weightedSum = 0;

    for (const seg of segments) {
      // 识别字段类型（简化规则）
      const type = this._detectFieldType(seg);
      const weight = this.weights[type] || 1.0;
      const segLen = seg.length;

      totalWeight += weight;
      weightedSum += segLen * weight;
    }

    const avgWeight = totalWeight > 0 ? totalWeight / segments.length : 1.0;
    const weightedLength = avgWeight > 0 ? Math.round(weightedSum / avgWeight) : prompt.length;

    return {
      weightedLength,
      segmentCount: segments.length,
      avgWeight: Math.round(avgWeight * 100) / 100,
    };
  }

  /**
   * 检测字段类型（基于关键词）
   */
  _detectFieldType(segment) {
    const lower = segment.toLowerCase();

    if (/\b(cinematic|photorealistic|realistic|hyper-detailed|professional)\b/.test(lower)) return 'style';
    if (/\b(front|profile|close-up|wide|medium|aerial|drone|tracking|dolly)\b/.test(lower)) return 'camera';
    if (/\b(sunlight|golden|warm|soft|dramatic|harsh|diffused|rim)\b/.test(lower)) return 'lighting';
    if (/\b(mountain|forest|river|ocean|city|temple|palace|studio|background)\b/.test(lower)) return 'environment';
    if (/\b(standing|running|walking|fighting|holding|gesturing|speaking)\b/.test(lower)) return 'action';
    if (/\b(year old|adult|child|male|female|warrior|nurse|doctor|giant|beast)\b/.test(lower)) return 'subject';
    if (/\b(red|blue|green|golden|dark|bright|hex|color|palette)\b/.test(lower)) return 'colors';
    if (/\b(mystical|epic|serene|chaotic|tense|peaceful|nostalgic)\b/.test(lower)) return 'atmosphere';
    if (/\b(ref|reference|image|photo|url|http)\b/.test(lower)) return 'meta';

    return 'unknown';
  }

  /**
   * 计算利用率
   */
  _calculateUtilization(prompt, weightedLength, maxLength) {
    const rawUtil = Math.round((prompt.length / maxLength) * 100);
    const weightedUtil = Math.round((weightedLength / maxLength) * 100);
    return {
      raw: rawUtil,
      weighted: weightedUtil,
      effective: Math.min(rawUtil, weightedUtil),
      isOptimal: rawUtil >= 85 && rawUtil <= 95,
      isOverloaded: rawUtil > 95,
      isUnderloaded: rawUtil < 50,
    };
  }

  /**
   * 计算质量评分（0-100）
   */
  _calculateScore(prompt, checks, options = {}) {
    let score = 100;

    // 长度扣分
    const { lengthCheck } = checks;
    if (!lengthCheck.passed) {
      score -= 30;
    } else if (lengthCheck.issues.some(i => i.includes('接近限制'))) {
      score -= 10;
    }

    // 内容质量检查
    const qualityChecks = [
      { test: prompt.length >= 200, penalty: -10, reason: '内容过短' },
      { test: !/\b(cinematic|photorealistic|realistic|detailed)\b/i.test(prompt), penalty: -10, reason: '缺少质量锚定词' },
      { test: (prompt.match(/,/g) || []).length < 3, penalty: -10, reason: '字段过少' },
      { test: /\b(woman|female|girl|man|male|boy)\b/i.test(prompt) && !/\b(year old|age)\b/i.test(prompt), penalty: -5, reason: '人物缺少年龄' },
      { test: /\b\d+\s*(year old|years old|岁)\b/i.test(prompt) && !/\b(adult|child|teenager|elderly)\b/i.test(prompt), penalty: -3, reason: '年龄后缺少生命阶段' },
    ];

    for (const check of qualityChecks) {
      if (!check.test) {
        score += check.penalty;
      }
    }

    // 风格检查
    if (options.expectedStyle) {
      const stylePatterns = {
        documentary: /\b(realistic|documentary|natural|professional|live-action)\b/i,
        mythical: /\b(mythological|epic|ancient|legendary|fantasy)\b/i,
        modern: /\b(modern|contemporary|urban|street|city)\b/i,
      };
      const pattern = stylePatterns[options.expectedStyle];
      if (pattern && !pattern.test(prompt)) {
        score -= 15;
      }
    }

    // 加分项
    if (checks.utilization?.isOptimal) score += 5;
    if ((prompt.match(/,/g) || []).length >= 5) score += 3;
    if (/\b(8K|4K|HD|high resolution|sharp focus)\b/i.test(prompt)) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 汇总批量校验结果
   */
  _summarize(results) {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / total);
    const avgLen = Math.round(results.reduce((s, r) => s + r.weightedLength, 0) / total);
    const minScore = Math.min(...results.map(r => r.score));
    const maxIssues = Math.max(...results.map(r => r.issues.length));

    return {
      total,
      passed,
      failed: total - passed,
      avgScore,
      avgLength: avgLen,
      minScore,
      maxIssues,
      allPassed: passed === total,
    };
  }

  /**
   * 生成校验报告（人类可读）
   */
  generateReport(results) {
    const summary = this._summarize(results);
    const lines = [
      `=== Prompt 校验报告 ===`,
      `总计: ${summary.total} 个`,
      `通过: ${summary.passed} 个 | 失败: ${summary.failed} 个`,
      `平均评分: ${summary.avgScore}/100`,
      `平均长度: ${summary.avgLength} 字符`,
      `最低评分: ${summary.minScore}/100`,
      `最大问题数: ${summary.maxIssues}`,
      summary.allPassed ? '✅ 全部通过' : `⚠️ ${summary.failed} 个需要修复`,
    ];
    return lines.join('\n');
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { validations: 0, passed: 0, warnings: 0, failures: 0 };
  }
}

// ─── 静态工具方法（无需实例化）───

/**
 * 快速检查长度（静态方法）
 */
PromptValidationUtils.checkLength = (prompt, maxLen = 990) => {
  const len = prompt.length;
  return {
    valid: len <= maxLen,
    length: len,
    remaining: maxLen - len,
    utilization: Math.round((len / maxLen) * 100),
  };
};

/**
 * 检查是否包含弱字段（静态方法）
 */
PromptValidationUtils.hasWeakFields = (prompt) => {
  const weakPatterns = [
    /\[AUTO:\s*通用\]/,
    /\[AUTO:\s*default\]/i,
    /DO NOT include/,
    /EXCLUDE/,
    /AVOID/,
    /DISCLAIMER/,
  ];
  const found = [];
  for (const pattern of weakPatterns) {
    if (pattern.test(prompt)) {
      found.push(pattern.source);
    }
  }
  return { hasWeak: found.length > 0, patterns: found };
};

/**
 * 计算提示词熵值（字段多样性）
 */
PromptValidationUtils.calculateEntropy = (prompt) => {
  const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const uniqueWords = new Set();
  let totalWords = 0;

  for (const seg of segments) {
    const words = seg.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        uniqueWords.add(word.toLowerCase());
        totalWords++;
      }
    }
  }

  const diversity = totalWords > 0 ? uniqueWords.size / totalWords : 0;
  return {
    segmentCount: segments.length,
    uniqueWords: uniqueWords.size,
    totalWords,
    diversity: Math.round(diversity * 100) / 100,
    isDiverse: diversity >= 0.5,
  };
};

module.exports = { PromptValidationUtils };