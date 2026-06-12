// JSONSafeParser — 安全JSON解析器
// 处理LLM返回的脏JSON（多余字符、注释、换行、未闭合括号等）

class JSONSafeParser {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.repairStrategies = options.repairStrategies || [
      'stripMarkdown',
      'fixTrailingCommas',
      'fixUnclosedBrackets',
      'extractJSONBlock',
      'stripComments',
      'normalizeNewlines',
    ];
    this.stats = { parsed: 0, repaired: 0, failed: 0 };
  }

  /**
   * 安全解析JSON，自动修复常见问题
   * @param {string} input - 可能包含脏数据的JSON字符串
   * @returns {Object} - { success, data, error, repairLog }
   */
  parse(input) {
    if (!input || typeof input !== 'string') {
      return { success: false, data: null, error: 'Empty or non-string input', repairLog: [] };
    }

    let current = input.trim();
    const repairLog = [];

    // 尝试直接解析
    try {
      const data = JSON.parse(current);
      this.stats.parsed++;
      return { success: true, data, error: null, repairLog };
    } catch (e) {
      // 直接解析失败，尝试修复策略
    }

    // 按策略顺序尝试修复
    for (const strategy of this.repairStrategies) {
      const repaired = this._applyStrategy(current, strategy);
      if (repaired !== current) {
        repairLog.push({ strategy, before: current.length, after: repaired.length });
        current = repaired;

        try {
          const data = JSON.parse(current);
          this.stats.repaired++;
          return { success: true, data, error: null, repairLog };
        } catch (e) {
          // 继续下一个策略
        }
      }
    }

    // 所有策略失败，尝试暴力提取
    const extracted = this._bruteExtract(current);
    if (extracted) {
      try {
        const data = JSON.parse(extracted);
        this.stats.repaired++;
        repairLog.push({ strategy: 'bruteExtract', before: current.length, after: extracted.length });
        return { success: true, data, error: null, repairLog };
      } catch (e) {
        // 暴力提取也失败
      }
    }

    this.stats.failed++;
    return {
      success: false,
      data: null,
      error: `JSON parse failed after ${repairLog.length} repair attempts. Last error: ${e?.message || 'Unknown'}`,
      repairLog,
      rawInput: input.substring(0, 200) + (input.length > 200 ? '...' : ''),
    };
  }

  /**
   * 应用修复策略
   */
  _applyStrategy(text, strategy) {
    switch (strategy) {
      case 'stripMarkdown':
        return this._stripMarkdown(text);
      case 'fixTrailingCommas':
        return this._fixTrailingCommas(text);
      case 'fixUnclosedBrackets':
        return this._fixUnclosedBrackets(text);
      case 'extractJSONBlock':
        return this._extractJSONBlock(text);
      case 'stripComments':
        return this._stripComments(text);
      case 'normalizeNewlines':
        return this._normalizeNewlines(text);
      default:
        return text;
    }
  }

  _stripMarkdown(text) {
    // 移除 markdown 代码块标记
    return text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .replace(/^\s*`+/, '')
      .replace(/`+\s*$/, '')
      .trim();
  }

  _fixTrailingCommas(text) {
    // 修复对象和数组末尾的多余逗号
    return text
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/,(\s*,)/g, ',');
  }

  _fixUnclosedBrackets(text) {
    // 修复未闭合的括号
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    const openBrackets = (text.match(/\[/g) || []).length;
    const closeBrackets = (text.match(/\]/g) || []).length;

    let fixed = text;
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';

    return fixed;
  }

  _extractJSONBlock(text) {
    // 提取第一个 { ... } 或 [ ... ] 块
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];

    return text;
  }

  _stripComments(text) {
    // 移除 // 和 /* */ 注释
    return text
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
  }

  _normalizeNewlines(text) {
    // 统一换行符，移除多余的空行
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  _bruteExtract(text) {
    // 暴力提取：找到第一个 { 和最后一个 }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }

    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return text.substring(firstBracket, lastBracket + 1);
    }

    return null;
  }

  /**
   * 批量解析（用于文件读取）
   */
  parseFile(filePath, fs) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parse(content);
    } catch (e) {
      return {
        success: false,
        data: null,
        error: `File read error: ${e.message}`,
        repairLog: [],
      };
    }
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { parsed: 0, repaired: 0, failed: 0 };
  }
}

module.exports = { JSONSafeParser };