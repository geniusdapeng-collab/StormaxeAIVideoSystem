// PromptFinalizer — 强制去重器
// 包装现有 PromptDeduplicator，提供强制去重入口和统计

const { PromptDeduplicator } = require('./prompt-deduplicator');

class PromptFinalizer {
  constructor() {
    this.deduplicator = new PromptDeduplicator();
    this.stats = { saved: 0, duplicates: 0, totalRuns: 0 };
  }

  /**
   * 对 prompt 进行最终去重处理
   * @param {string} prompt - 原始 prompt
   * @returns {Object} - { prompt, saved, duplicates, originalLength }
   */
  finalize(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return { prompt: prompt || '', saved: 0, duplicates: 0, originalLength: 0 };
    }

    const originalLength = prompt.length;
    this.stats.totalRuns++;

    // 1. 全局去重：对完整 prompt 先做一次粗粒度去重
    let result = this._globalDeduplicate(prompt);

    // 2. 语义去重：识别近义片段，保留第一次出现的
    result = this._semanticDeduplicate(result);

    // 3. 统计
    const saved = originalLength - result.length;
    const duplicates = this._countDuplicates(prompt, result);
    
    this.stats.saved += saved;
    this.stats.duplicates += duplicates;

    // 4. 日志分级
    if (saved > 150) {
      console.warn(`[PromptFinalizer] ⚠️ 严重重复: 节省 ${saved} 字符 (${duplicates} 处重复)`);
    } else if (saved > 50) {
      console.log(`[PromptFinalizer] ℹ️ 中度重复: 节省 ${saved} 字符 (${duplicates} 处重复)`);
    } else if (saved > 0) {
      console.log(`[PromptFinalizer] ℹ️ 轻度重复: 节省 ${saved} 字符 (${duplicates} 处重复)`);
    }

    return {
      prompt: result,
      saved,
      duplicates,
      originalLength
    };
  }

  /**
   * 全局去重：按逗号分割后逐段去重
   */
  _globalDeduplicate(prompt) {
    const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const unique = this.deduplicator.deduplicate(segments);
    return unique.join(', ');
  }

  /**
   * 语义去重：识别语义重复但措辞不同的片段
   * 例如 "Honghuang era Chinese mythology" 和 "Chinese mythology Honghuang era"
   */
  _semanticDeduplicate(prompt) {
    const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const seen = new Set();
    const result = [];

    for (const segment of segments) {
      // 创建语义指纹（小写+排序后的词）
      const fingerprint = this._semanticFingerprint(segment);
      
      if (seen.has(fingerprint)) {
        continue; // 语义重复，跳过
      }
      
      seen.add(fingerprint);
      result.push(segment);
    }

    return result.join(', ');
  }

  /**
   * 生成语义指纹
   */
  _semanticFingerprint(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z\u4e00-\u9fff\s]/g, '') // 只保留字母和中文
      .split(/\s+/)
      .filter(w => w.length > 2) // 忽略短词
      .sort()
      .join(' ');
  }

  /**
   * 统计重复数量
   */
  _countDuplicates(original, deduplicated) {
    const origSegments = original.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const dedupSegments = deduplicated.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    return Math.max(0, origSegments.length - dedupSegments.length);
  }

  /**
   * 获取累计统计
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = { saved: 0, duplicates: 0, totalRuns: 0 };
  }
}

module.exports = { PromptFinalizer };