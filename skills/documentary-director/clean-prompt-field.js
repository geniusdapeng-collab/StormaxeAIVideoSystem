// PromptFieldCleaner — 弱字段清洗器
// 清洗 prompt 中无实际语义价值的占位符，释放空间给高质量描述

class PromptFieldCleaner {
  constructor() {
    this.weakPatterns = [
      /\[AUTO:通用\]/gi,
      /\[AUTO:默认\]/gi,
      /\[GENERIC\]/gi,
      /\[AUTO:\s*\]/gi,
      /\[PLACEHOLDER\]/gi,
      /undefined|null|通用|默认|占位符|647个文件/gi,
    ];
    this.emptyBracketPatterns = [
      /\(\s*\)/g,
      /\[\s*\]/g,
      /\{\s*\}/g,
    ];
    this.stats = { cleaned: 0, before: 0, after: 0 };
  }

  /**
   * 清洗单个字段
   * @param {string} field - 原始字段值
   * @returns {string} - 清洗后的字段值
   */
  clean(field) {
    if (!field || typeof field !== 'string') return '';
    
    let result = field;
    
    // 1. 移除弱标记
    for (const pattern of this.weakPatterns) {
      result = result.replace(pattern, '');
    }
    
    // 2. 移除空括号
    for (const pattern of this.emptyBracketPatterns) {
      result = result.replace(pattern, '');
    }
    
    // 3. 修复重复标点
    result = result
      .replace(/[。，,\s]+$/g, '')  // 去掉末尾标点/空格
      .replace(/^[，,\s]+/g, '')   // 去掉开头标点/空格
      .replace(/，，/g, '，')       // 双中文逗号
      .replace(/,,/g, ',')          // 双英文逗号
      .replace(/。，/g, '。')       // 句号+逗号
      .replace(/,\s*，/g, '，')     // 混合逗号
      .replace(/\s{2,}/g, ' ');     // 多余空格
    
    return result.trim();
  }

  /**
   * 对完整 prompt 进行全局清洗
   * @param {string} prompt - 原始 prompt
   * @returns {string} - 清洗后的 prompt
   */
  cleanPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') return '';
    
    this.stats.before = prompt.length;
    
    let result = prompt;
    
    // 1. 先按逗号分割，逐段清洗
    const segments = result.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const cleanedSegments = segments.map(seg => this.clean(seg)).filter(Boolean);
    
    // 2. 重新组装
    result = cleanedSegments.join(', ');
    
    // 3. 全局修复
    result = result
      .replace(/,\s*,/g, ',')        // 双逗号
      .replace(/\s{2,}/g, ' ')        // 多余空格
      .replace(/^,\s*/, '')           // 开头逗号
      .replace(/,\s*$/, '')           // 末尾逗号
      .trim();
    
    this.stats.after = result.length;
    this.stats.cleaned = this.stats.before - this.stats.after;
    
    return result;
  }

  /**
   * 获取统计信息
   * @returns {Object} - { before, after, saved }
   */
  getStats() {
    return {
      before: this.stats.before,
      after: this.stats.after,
      saved: this.stats.cleaned
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = { cleaned: 0, before: 0, after: 0 };
  }
}

module.exports = { PromptFieldCleaner };