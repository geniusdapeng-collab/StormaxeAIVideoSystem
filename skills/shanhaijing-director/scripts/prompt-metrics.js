// ==================== 文件: prompt-metrics.js ====================
// v7.0-Peng: 双指标体系 + LLM质量评估
// 🆕 v7.0-Peng (2026-06-11): LLM质量评估接入
//   - LLM评估提示词质量并给出改进建议
//   - 本地指标降级为fallback — 上限合规率（vs 5500）+ 内容饱满度（vs 目标区间1402-1633，参考）
// 替代原有检查清单的误报逻辑
// v6.17-Peng-fix: 统一上限980字符（大鹏规则）

const { LLMReasoningLayer } = require('./llm-reasoning-layer');

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
  /**
   * 🆕 v7.0-Peng: LLM优先质量评估，失败降级本地指标
   */
  async calculate(prompt, weightedLen, shotId) {
    // 🆕 v7.0-Peng: 尝试LLM质量评估
    try {
      const llmResult = await this._calculateWithLLM(prompt, weightedLen, shotId);
      if (llmResult) {
        console.log('   ✅ LLM质量评估完成');
        return llmResult;
      }
    } catch (err) {
      console.log(`   ⚠️ LLM评估失败: ${err.message?.substring(0, 60)}，降级本地指标`);
    }

    return this._calculateLocal(prompt, weightedLen, shotId);
  }

  async _calculateWithLLM(prompt, weightedLen, shotId) {
    const llm = new LLMReasoningLayer();
    const pureLen = prompt.length;

    const result = await llm.llmReason({
      stage: 'prompt-metrics',
      systemPrompt: `You are a prompt quality evaluator for AI video generation. Assess the given prompt and provide quality metrics. Return JSON: { shotId, lengths: { weighted, pure, hardLimit }, metrics: { limitCompliance, limitUtilization, contentRichness, optimalMatch }, grade ("A"/"B"/"C"/"D"), status, recommendations: [strings], llmInsights: { strengths: [strings], weaknesses: [strings], improvementSuggestions: [strings] } }. Hard limit: ${this.HARD_LIMIT}.`,
      userPrompt: `Prompt (${pureLen} chars, weighted: ${weightedLen}):\n${prompt.substring(0, 800)}`,
      level: 'light',
      fallback: () => null
    });

    if (result && typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        // Validate result has required fields
        if (parsed && parsed.lengths && parsed.metrics && parsed.grade) return parsed;
        return null;
      } catch (e) { return null; }
    }
    if (result && result.lengths && result.metrics && result.grade) return result;
    return null;
  }

  _calculateLocal(prompt, weightedLen, shotId) {
    const pureLen = prompt.length;
    const limitCompliance = Math.min(100, (weightedLen / this.HARD_LIMIT) * 100);
    const limitUtilization = (pureLen / this.HARD_LIMIT) * 100;
    const contentRichness = (pureLen / this.TARGET_RANGE.min) * 100;
    const optimalMatch = weightedLen >= this.OPTIMAL_RANGE.min && weightedLen <= this.OPTIMAL_RANGE.max;
    const qualityGrade = this._calculateGrade(limitCompliance, contentRichness);

    return {
      shotId,
      lengths: { weighted: weightedLen, pure: pureLen, hardLimit: this.HARD_LIMIT },
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
    const { shotId, lengths = {}, metrics = {}, grade = '?', status = {} } = report || {};
    return `[PromptMetrics] ${shotId || '?'}: 加权${lengths.weighted || 0}/${lengths.hardLimit || 0} | 合规率:${metrics.limitCompliance || 0}% [${grade}] | 饱满度:${metrics.contentRichness || 0}% | ${status.emoji || '?'} ${status.code || '?'} — ${status.message || '?'}`;
  }

  batchCalculate(reports) {
    if (!reports || reports.length === 0) return { total: 0, pass: 0, warn: 0, fail: 0, avgCompliance: 0, gradeDistribution: {} };
    const validReports = reports.filter(r => r && r.metrics && r.grade);
    if (validReports.length === 0) return { total: reports.length, pass: 0, warn: 0, fail: 0, avgCompliance: 0, gradeDistribution: {} };
    const avgCompliance = validReports.reduce((s, r) => s + (r.metrics.limitCompliance || 0), 0) / validReports.length;
    const passCount = validReports.filter(r => r.grade === 'A' || r.grade === 'B').length;
    const failCount = validReports.filter(r => r.grade === 'D' || r.grade === 'F').length;
    return {
      total: reports.length,
      pass: passCount,
      warn: validReports.length - passCount - failCount,
      fail: failCount,
      avgCompliance: Math.round(avgCompliance * 10) / 10,
      gradeDistribution: validReports.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = { PromptMetrics };