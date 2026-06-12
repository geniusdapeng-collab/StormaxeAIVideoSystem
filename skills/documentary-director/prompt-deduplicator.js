// PromptDeduplicator — prompt片段去重器
// 解决prompt中重复片段浪费字符的问题（如"Honghuang era"出现4次）

class PromptDeduplicator {
  constructor() {
    this.seen = new Set();
  }

  // 对一组prompt片段去重（保留第一次出现的）
  deduplicate(parts) {
    this.seen.clear();
    const result = [];
    for (const part of parts) {
      const normalized = this._normalize(part);
      if (this._isDuplicate(normalized)) continue;
      this.seen.add(normalized);
      result.push(part);
    }
    return result;
  }

  // 归一化：小写+去标点+去多余空格
  _normalize(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  // 检查是否重复（完全匹配或子串包含）
  _isDuplicate(normalized) {
    if (this.seen.has(normalized)) return true;
    for (const existing of this.seen) {
      if (existing.includes(normalized) && normalized.length > 10) return true;
      if (normalized.includes(existing) && existing.length > 10) return true;
    }
    return false;
  }

  // 对完整prompt进行跨字段去重
  static deduplicatePrompt(prompt) {
    const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const dedup = new PromptDeduplicator();
    const unique = dedup.deduplicate(segments);
    return unique.join(', ');
  }
}

module.exports = { PromptDeduplicator };