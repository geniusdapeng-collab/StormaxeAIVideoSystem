// FinalPromptComposer — 统一最终 Prompt 合成器
// 接收结构化字段，按优先级组装，超限时智能裁剪，输出最终字符串

const { FieldMerger } = require('./field-merger');
const { PromptFieldPriority } = require('./prompt-field-priority');

class FinalPromptComposer {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 990;
    this.separator = options.separator || ', ';
    this.fieldMerger = new FieldMerger({
      totalMax: this.maxLength,
      ...options.fieldMergerOptions,
    });
    this.fieldPriority = new PromptFieldPriority({
      totalMax: this.maxLength,
      ...options.fieldPriorityOptions,
    });
    this.stats = { composed: 0, trimmed: 0, finalLength: 0 };
  }

  /**
   * 统一合成 Prompt
   * @param {Object} structuredFields - 结构化字段（支持对象格式 { value: '...' } 或字符串）
   * @returns {Object} - { prompt, length, fields, trimmed, stats }
   */
  compose(structuredFields) {
    // 将对象格式 { value: '...' } 扁平化为字符串
    const flatFields = {};
    for (const [key, val] of Object.entries(structuredFields)) {
      if (val === null || val === undefined) continue;
      if (typeof val === 'object' && val.value !== undefined) {
        flatFields[key] = val.value;
      } else {
        flatFields[key] = val;
      }
    }
    
    // 1. 合并字段
    const { merged, conflicts } = this.fieldMerger.merge(flatFields);

    // 2. 按优先级精细裁剪（如果超长）
    const { trimmed, removed, finalLength } = this.fieldPriority.trim(merged);

    // 3. 按顺序渲染为字符串
    const orderedFields = this._orderFields(trimmed);
    const prompt = this._render(orderedFields);

    // 4. 最终清理
    const cleaned = this._finalCleanup(prompt);

    // 5. 如果仍然超长，硬截断
    let finalPrompt = cleaned;
    let hardTruncated = false;
    if (cleaned.length > this.maxLength) {
      finalPrompt = this._hardTruncate(cleaned);
      hardTruncated = true;
    }

    this.stats.composed++;
    if (removed.length > 0) this.stats.trimmed++;
    this.stats.finalLength = finalPrompt.length;

    return {
      prompt: finalPrompt,
      length: finalPrompt.length,
      fields: orderedFields,
      trimmed: removed,
      conflicts,
      hardTruncated,
      stats: { ...this.stats },
    };
  }

  /**
   * 按 order 排序字段
   */
  _orderFields(fields) {
    const orderMap = {
      prefix: 1,
      era: 2,
      subject: 3,
      action: 4,
      environment: 5,
      lighting: 6,
      colors: 7,
      style: 8,
      camera: 9,
      atmosphere: 10,
      meta: 99,
    };

    return Object.entries(fields)
      .sort((a, b) => (orderMap[a[0]] || 100) - (orderMap[b[0]] || 100))
      .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});
  }

  /**
   * 渲染字段为字符串
   */
  _render(fields) {
    const parts = [];
    for (const [key, value] of Object.entries(fields)) {
      if (!value) continue;
      const str = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : String(value);
      if (str.trim()) {
        parts.push(str.trim());
      }
    }
    return parts.join(this.separator);
  }

  /**
   * 最终清理（标点、空格）
   */
  _finalCleanup(prompt) {
    return prompt
      .replace(/[。，,\s]+$/, '')  // 去掉末尾标点/空格
      .replace(/^[，,\s]+/, '')    // 去掉开头标点/空格
      .replace(/,\s*,/g, ',')      // 双逗号
      .replace(/\s{2,}/g, ' ')     // 多余空格
      .replace(/^,\s*/, '')        // 开头逗号
      .replace(/,\s*$/, '')        // 末尾逗号
      .trim();
  }

  /**
   * 硬截断（保留最后完整单词/短语）
   */
  _hardTruncate(prompt) {
    const cutoff = prompt.lastIndexOf(',', this.maxLength - 4);
    if (cutoff > this.maxLength * 0.5) {
      return prompt.substring(0, cutoff) + '...';
    }
    return prompt.substring(0, this.maxLength - 3) + '...';
  }

  /**
   * 从现有 _buildPrompts 风格的数组构建结构化字段
   * 兼容旧代码：接收 promptParts 数组，转换为结构化对象
   */
  composeFromParts(parts) {
    const structured = {};
    let currentIndex = 0;

    // 简单的启发式映射
    const mappings = [
      { key: 'prefix', test: (p) => /cinematic|photorealistic|hyper-detailed/i.test(p) },
      { key: 'era', test: (p) => /era|mythological|contemporary|ancient|modern/i.test(p) && p.length < 80 },
      { key: 'subject', test: (p) => p.length > 50 && /man|woman|person|character|figure|warrior|god|beast|creature|giant|hero|mountain|forest|river|city|temple|palace|battlefield|landscape/i.test(p) },
      { key: 'action', test: (p) => /shot|standing|speaking|walking|demonstrating|showing|explaining|close-up|medium|wide/i.test(p) && p.length < 150 },
      { key: 'environment', test: (p) => p.length > 80 && /studio|room|space|outdoor|indoor|scene|background/i.test(p) },
      { key: 'lighting', test: (p) => /light|sunlight|illumination|shadow|glow|ray/i.test(p) },
      { key: 'colors', test: (p) => /^#[0-9a-f]{6}/i.test(p) || /color|palette|tone/i.test(p) },
      { key: 'style', test: (p) => /realistic|photorealistic|professional|documentary|live-action/i.test(p) && p.length > 50 },
      { key: 'camera', test: (p) => /shot|angle|dolly|tracking|pan|zoom|orbit|aerial|drone|steadicam|handheld/i.test(p) && p.length < 120 },
      { key: 'atmosphere', test: (p) => /professional|clean|documentary|atmosphere|mood|tone/i.test(p) && p.length < 60 },
    ];

    for (const part of parts) {
      if (!part || typeof part !== 'string') continue;
      const str = part.trim();
      if (!str) continue;

      let assigned = false;
      for (const { key, test } of mappings) {
        if (!structured[key] && test(str)) {
          structured[key] = str;
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        // 未识别的归入 action 或 subject
        if (str.length > 50) {
          structured.subject = (structured.subject ? structured.subject + ', ' : '') + str;
        } else {
          structured.action = (structured.action ? structured.action + ', ' : '') + str;
        }
      }
    }

    return this.compose(structured);
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { composed: 0, trimmed: 0, finalLength: 0 };
  }
}

module.exports = { FinalPromptComposer };