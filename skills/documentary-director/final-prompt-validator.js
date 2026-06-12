// FinalPromptValidator — 最终 Prompt 质量校验器
// 检查利用率、结构、重复，输出结构化报告

class FinalPromptValidator {
  constructor(options = {}) {
    this.minUtilization = options.minUtilization || 0.6; // 60%
    this.maxLength = options.maxLength || 990;
    this.weightedMax = 1000; // 加权字符上限
  }

  /**
   * 校验 prompt 质量
   * @param {string} prompt - 最终 prompt
   * @returns {Object} - { passed, issues, utilization, weightedLength, score, details }
   */
  validate(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return {
        passed: false,
        issues: ['Prompt为空或无效'],
        utilization: 0,
        weightedLength: 0,
        score: 0,
        details: { length: 0, weighted: 0, hasSubject: false, hasDuplicate: false }
      };
    }

    const issues = [];
    const details = {};

    // 1. 计算加权长度
    const weightedLength = this._weightedLength(prompt);
    details.weighted = weightedLength;
    details.length = prompt.length;

    // 2. 利用率检查
    const utilization = prompt.length / this.maxLength;
    details.utilization = utilization;

    if (prompt.length < this.maxLength * this.minUtilization) {
      issues.push(`利用率不足: ${(utilization * 100).toFixed(1)}% < ${(this.minUtilization * 100).toFixed(0)}%`);
    }
    if (weightedLength > this.weightedMax) {
      issues.push(`加权长度超限: ${weightedLength} > ${this.weightedMax}`);
    }
    if (prompt.length > this.maxLength) {
      issues.push(`长度超限: ${prompt.length} > ${this.maxLength}`);
    }

    // 3. 结构检查：必须有主体描述
    const hasSubject = this._hasSubjectDescription(prompt);
    details.hasSubject = hasSubject;
    if (!hasSubject) {
      issues.push('缺少主体描述：prompt中未检测到人物/物体/场景的核心描述');
    }

    // 4. 重复检查
    const hasDuplicate = this._hasResidualDuplicate(prompt);
    details.hasDuplicate = hasDuplicate;
    if (hasDuplicate) {
      issues.push('残留重复：去重后仍有重复片段');
    }

    // 5. 质量评分 (0-100)
    const score = this._calculateScore(utilization, hasSubject, hasDuplicate, prompt.length);

    const passed = issues.length === 0;

    return {
      passed,
      issues,
      utilization,
      weightedLength,
      score,
      details
    };
  }

  /**
   * 计算加权字符数（非 ASCII 计为 2 个字符）
   */
  _weightedLength(str) {
    let length = 0;
    for (const char of str) {
      length += (char.charCodeAt(0) > 127) ? 2 : 1;
    }
    return length;
  }

  /**
   * 检查是否有主体描述
   */
  _hasSubjectDescription(prompt) {
    // 检测是否包含人物、物体、场景描述
    const subjectPatterns = [
      /\b(man|woman|person|character|figure|warrior|god|beast|creature|giant|hero|nurse|doctor|presenter)\b/i,
      /\b(mountain|forest|river|ocean|sky|city|temple|palace|battlefield|landscape|scene)\b/i,
      /\b(手|人物|角色|战士|神|兽|巨人|英雄|山|河|森林|城|殿|场|景)\b/,
      /\b\d+[-\s]*year[-\s]*old\b/i, // 年龄描述
    ];
    
    return subjectPatterns.some(p => p.test(prompt));
  }

  /**
   * 检查是否仍有残留重复
   */
  _hasResidualDuplicate(prompt) {
    const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const seen = new Set();
    
    for (const segment of segments) {
      const normalized = segment.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '').trim();
      if (normalized.length > 10 && seen.has(normalized)) {
        return true;
      }
      seen.add(normalized);
    }
    return false;
  }

  /**
   * 计算质量评分
   */
  _calculateScore(utilization, hasSubject, hasDuplicate, length) {
    let score = 0;
    
    // 利用率分数 (0-40)
    if (utilization >= 0.85) score += 40;
    else if (utilization >= 0.6) score += Math.round((utilization - 0.6) / 0.25 * 40);
    else score += Math.round(utilization / 0.6 * 20);
    
    // 主体描述 (0-30)
    if (hasSubject) score += 30;
    
    // 无重复 (0-20)
    if (!hasDuplicate) score += 20;
    
    // 长度适中 (0-10)
    if (length >= 600 && length <= 990) score += 10;
    else if (length > 200) score += 5;
    
    return Math.min(100, score);
  }
}

module.exports = { FinalPromptValidator };