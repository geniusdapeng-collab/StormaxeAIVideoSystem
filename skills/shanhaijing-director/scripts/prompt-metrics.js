// ==================== 文件: prompt-metrics.js ====================
// v6.17-Peng: 双指标体系 — 上限合规率（vs 5500）+ 内容饱满度（vs 目标区间1402-1633，参考）
// 替代原有检查清单的误报逻辑
// v6.17-Peng-fix: 统一上限980字符（大鹏规则）

class PromptMetrics {
  constructor(config = {}) {
    this.HARD_LIMIT = config.hardLimit || 5500; // 🆕 v6.17-Peng-fix: 统一上限980字符（大鹏规则）
    this.TARGET_RANGE = config.targetRange || { min: 1402, max: 1633 };
    this.OPTIMAL_RANGE = config.optimalRange || { min: 1402, max: 1633 };
  }

  /**
   * 计算完整指标
   * @param {string} prompt - 最终 prompt
   * @param {number} weightedLen - 加权字符数
   * @param {string} shotId - 镜头 ID
   * @returns {object} 完整指标报告
   */
  calculate(prompt, weightedLen, shotId) {
    const pureLen = prompt.length;

    // 指标 1: 上限合规率（物理利用率，基于 5500）
    const limitCompliance = Math.min(100, (weightedLen / this.HARD_LIMIT) * 100);

    // 指标 2: 上限利用率（纯字符视角）
    const limitUtilization = (pureLen / this.HARD_LIMIT) * 100;

    // 指标 3: 内容饱满度（vs 理想目标区间，仅作参考）
    const contentRichness = (pureLen / this.TARGET_RANGE.min) * 100;

    // 指标 4: 最优区间匹配度
    const optimalMatch = weightedLen >= this.OPTIMAL_RANGE.min && weightedLen <= this.OPTIMAL_RANGE.max;

    // 指标 5: 质量等级
    const qualityGrade = this._calculateGrade(limitCompliance, contentRichness);

    return {
      shotId,
      lengths: {
        weighted: weightedLen,
        pure: pureLen,
        hardLimit: this.HARD_LIMIT
      },
      metrics: {
        limitCompliance: Math.round(limitCompliance * 10) / 10,
        limitUtilization: Math.round(limitUtilization * 10) / 10,
        contentRichness: Math.round(contentRichness * 10) / 10,
        optimalMatch
      },
      grade: qualityGrade,
      status: this._determineStatus(qualityGrade),
      recommendations: this._generateRecommendations(limitCompliance, contentRichness, prompt)
    };
  }

  _calculateGrade(compliance, richness) {
    if (compliance >= 95) return 'A';
    if (compliance >= 85) return 'B';
    if (compliance >= 70) return 'C';
    if (compliance >= 50) return 'D';
    return 'F';
  }

  _determineStatus(grade) {
    const statusMap = {
      'A': { code: 'PASS', emoji: '✅', message: '利用率优秀' },
      'B': { code: 'PASS', emoji: '✅', message: '利用率良好' },
      'C': { code: 'WARN', emoji: '⚠️', message: '利用率一般，建议检查' },
      'D': { code: 'FAIL', emoji: '❌', message: '利用率不足，需要优化' },
      'F': { code: 'FAIL', emoji: '❌', message: '利用率严重不足' }
    };
    return statusMap[grade];
  }

  _generateRecommendations(compliance, richness, prompt) {
    const recs = [];
    if (compliance < 70) {
      recs.push('prompt 长度远低于 5500 上限，建议从 LLM 生成阶段增加内容输出');
    }
    if (compliance < 50) {
      recs.push('严重短缺：检查 _generateShotPrompt() 是否存在过度截断');
    }
    if (richness < 40) {
      recs.push('内容饱满度低：建议确认 5500 上限是否可提高到 1200-1500');
    }
    if (prompt.length > 0 && compliance > 100) {
      recs.push('超出 5500 上限，截断可能丢失内容');
    }
    if (recs.length === 0) {
      recs.push('各项指标正常');
    }
    return recs;
  }

  formatLog(report) {
    const { shotId, lengths, metrics, grade, status } = report;
    return `[PromptMetrics] ${shotId}: 加权${lengths.weighted}/${lengths.hardLimit} | 合规率:${metrics.limitCompliance}% [${grade}] | 饱满度:${metrics.contentRichness}% | ${status.emoji} ${status.code} — ${status.message}`;
  }

  batchCalculate(reports) {
    const avgCompliance = reports.reduce((s, r) => s + r.metrics.limitCompliance, 0) / reports.length;
    const passCount = reports.filter(r => r.grade === 'A' || r.grade === 'B').length;
    const failCount = reports.filter(r => r.grade === 'D' || r.grade === 'F').length;
    return {
      total: reports.length,
      pass: passCount,
      warn: reports.length - passCount - failCount,
      fail: failCount,
      avgCompliance: Math.round(avgCompliance * 10) / 10,
      gradeDistribution: reports.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = { PromptMetrics };