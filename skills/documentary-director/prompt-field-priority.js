// PromptFieldPriority — 字段优先级定义与裁剪策略
// 定义字段权重、保留策略、超限时的裁剪规则

class PromptFieldPriority {
  constructor(options = {}) {
    // 字段优先级定义（权重越高越重要）
    this.fieldWeights = options.fieldWeights || {
      prefix: 1.0,      // 系统前缀（必须保留）
      subject: 0.95,    // 主体描述（核心）
      action: 0.9,      // 动作/行为
      environment: 0.85, // 环境
      lighting: 0.8,    // 光影
      camera: 0.75,     // 运镜
      style: 0.7,       // 风格锚定词
      colors: 0.6,      // 色彩
      atmosphere: 0.5,  // 氛围（低优先级，可裁剪）
      era: 0.55,        // 时代背景
      meta: 0.3,        // 元信息（最低优先级）
    };

    // 字段保留策略（是否可裁剪、最短保留长度）
    this.retentionRules = options.retentionRules || {
      prefix: { canTrim: false, minLength: 10 },
      subject: { canTrim: true, minLength: 50, strategy: 'keep-first-half' },
      action: { canTrim: true, minLength: 30, strategy: 'keep-core-verbs' },
      environment: { canTrim: true, minLength: 40, strategy: 'keep-first-half' },
      lighting: { canTrim: true, minLength: 30, strategy: 'keep-key-words' },
      camera: { canTrim: true, minLength: 20, strategy: 'keep-core-shot' },
      style: { canTrim: true, minLength: 50, strategy: 'keep-first-half' },
      colors: { canTrim: true, minLength: 10, strategy: 'keep-first-hex' },
      atmosphere: { canTrim: true, minLength: 10, strategy: 'remove-entirely' },
      era: { canTrim: true, minLength: 10, strategy: 'keep-first-half' },
      meta: { canTrim: true, minLength: 0, strategy: 'remove-entirely' },
    };

    this.totalMax = options.totalMax || 990;
    this.stats = { trimmed: 0, removed: 0, fieldsAdjusted: 0 };
  }

  /**
   * 根据优先级裁剪字段，确保总长度不超过限制
   * @param {Object} fields - 字段对象 { fieldName: value }
   * @returns {Object} - { trimmed, removed, stats, finalLength }
   */
  trim(fields) {
    const trimmed = {};
    const removed = [];
    let currentLength = this._estimateLength(fields);

    if (currentLength <= this.totalMax) {
      return { trimmed: fields, removed, stats: this.stats, finalLength: currentLength };
    }

    // 按权重排序（低到高），先裁剪低权重
    const sortedFields = Object.entries(fields)
      .sort((a, b) => (this.fieldWeights[a[0]] || 0.5) - (this.fieldWeights[b[0]] || 0.5));

    for (const [fieldName, value] of sortedFields) {
      if (currentLength <= this.totalMax) break;
      if (!value) continue;

      const str = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : String(value);
      if (!str) continue;

      const rule = this.retentionRules[fieldName] || { canTrim: true, minLength: 10, strategy: 'keep-first-half' };
      const fieldLength = str.length;

      if (!rule.canTrim) {
        // 不可裁剪字段，保留原样
        trimmed[fieldName] = value;
        continue;
      }

      // 计算需要节省的字符数
      const excess = currentLength - this.totalMax;
      const targetLength = Math.max(rule.minLength, fieldLength - excess);

      if (targetLength < rule.minLength) {
        // 无法缩短到最小长度，删除整个字段
        removed.push({
          field: fieldName,
          action: 'removed',
          saved: fieldLength,
          reason: 'cannot-trim-to-min',
        });
        this.stats.removed++;
        currentLength -= fieldLength + 2; // 加逗号分隔符
        continue;
      }

      // 根据策略裁剪
      const shortened = this._applyStrategy(str, targetLength, rule.strategy);
      const saved = fieldLength - shortened.length;

      if (saved > 0) {
        trimmed[fieldName] = shortened;
        removed.push({
          field: fieldName,
          action: 'trimmed',
          saved,
          strategy: rule.strategy,
        });
        this.stats.trimmed++;
        this.stats.fieldsAdjusted++;
        currentLength = this._estimateLength({ ...trimmed, [fieldName]: shortened });
      } else {
        trimmed[fieldName] = value;
      }
    }

    // 确保未处理的字段也被保留
    for (const [key, val] of Object.entries(fields)) {
      if (!(key in trimmed)) {
        trimmed[key] = val;
      }
    }

    return {
      trimmed,
      removed,
      stats: { ...this.stats },
      finalLength: this._estimateLength(trimmed),
    };
  }

  /**
   * 应用裁剪策略
   */
  _applyStrategy(text, targetLength, strategy) {
    if (text.length <= targetLength) return text;

    switch (strategy) {
      case 'keep-first-half':
        // 保留前半部分，按逗号分割
        return this._keepFirstHalf(text, targetLength);

      case 'keep-core-verbs':
        // 保留核心动词和关键短语
        return this._keepCoreVerbs(text, targetLength);

      case 'keep-key-words':
        // 保留关键词（如 sunlight, shadow, ray）
        return this._keepKeyWords(text, targetLength);

      case 'keep-core-shot':
        // 保留核心运镜词（如 wide shot, close-up）
        return this._keepCoreShot(text, targetLength);

      case 'keep-first-hex':
        // 保留第一个 HEX 颜色码
        return this._keepFirstHex(text, targetLength);

      case 'remove-entirely':
        // 直接删除整个字段（如果超过最小长度）
        return '';

      default:
        return this._keepFirstHalf(text, targetLength);
    }
  }

  _keepFirstHalf(text, targetLength) {
    const parts = text.split(/[,，]/).map(p => p.trim()).filter(Boolean);
    let result = '';
    for (const part of parts) {
      if ((result + part).length > targetLength) break;
      result += (result ? ', ' : '') + part;
    }
    return result || text.substring(0, targetLength);
  }

  _keepCoreVerbs(text, targetLength) {
    // 保留包含动词和关键名词的短语
    const corePatterns = /\b(standing|speaking|walking|demonstrating|showing|explaining|close-up|medium|wide|dolly|tracking|pan|zoom|orbit|aerial|drone)\b/gi;
    const matches = text.match(corePatterns) || [];
    if (matches.length > 0) {
      const coreStr = matches.join(', ');
      if (coreStr.length <= targetLength) return coreStr;
    }
    return this._keepFirstHalf(text, targetLength);
  }

  _keepKeyWords(text, targetLength) {
    // 保留光影关键词
    const keyPatterns = /\b(sunlight|shadow|ray|glow|illumination|light|soft|hard|warm|cool|dramatic|natural)\b/gi;
    const matches = text.match(keyPatterns) || [];
    if (matches.length > 0) {
      const keyStr = [...new Set(matches)].join(', ');
      if (keyStr.length <= targetLength) return keyStr;
    }
    return this._keepFirstHalf(text, targetLength);
  }

  _keepCoreShot(text, targetLength) {
    // 保留核心运镜词
    const shotPatterns = /\b(wide shot|medium shot|close-up|extreme close-up|aerial|drone|dolly|tracking|pan|zoom|orbit|handheld|steadicam)\b/gi;
    const matches = text.match(shotPatterns) || [];
    if (matches.length > 0) {
      const shotStr = [...new Set(matches)].join(', ');
      if (shotStr.length <= targetLength) return shotStr;
    }
    return this._keepFirstHalf(text, targetLength);
  }

  _keepFirstHex(text, targetLength) {
    // 保留 HEX 颜色码和简短描述
    const hexMatch = text.match(/#[0-9a-f]{6}/i);
    if (hexMatch) {
      const hex = hexMatch[0];
      const remaining = targetLength - hex.length - 2;
      if (remaining > 5) {
        const desc = text.replace(hex, '').trim().substring(0, remaining);
        return hex + (desc ? ', ' + desc : '');
      }
      return hex;
    }
    return this._keepFirstHalf(text, targetLength);
  }

  _estimateLength(fields) {
    let length = 0;
    let count = 0;
    for (const value of Object.values(fields)) {
      if (!value) continue;
      const str = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : String(value);
      if (str) {
        length += str.length;
        count++;
      }
    }
    return length + (count > 0 ? (count - 1) * 2 : 0);
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { trimmed: 0, removed: 0, fieldsAdjusted: 0 };
  }
}

module.exports = { PromptFieldPriority };