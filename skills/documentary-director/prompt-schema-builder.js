// PromptSchemaBuilder — 结构化 Prompt Schema 构建器
// 定义字段顺序、默认值、渲染规则，将散乱的字段组装为结构化对象

class PromptSchemaBuilder {
  constructor(options = {}) {
    // 默认 Schema 定义（字段顺序即渲染顺序）
    this.schema = options.schema || {
      prefix: {
        order: 1,
        defaultValue: 'CG cinematic photorealistic hyper-detailed',
        maxLength: 100,
        required: true,
      },
      era: {
        order: 2,
        defaultValue: '',
        maxLength: 50,
        required: false,
      },
      subject: {
        order: 3,
        defaultValue: '',
        maxLength: 300,
        required: true,
      },
      action: {
        order: 4,
        defaultValue: '',
        maxLength: 200,
        required: true,
      },
      environment: {
        order: 5,
        defaultValue: '',
        maxLength: 250,
        required: false,
      },
      lighting: {
        order: 6,
        defaultValue: 'natural sunlight 5600K, soft even illumination',
        maxLength: 300,
        required: false,
      },
      colors: {
        order: 7,
        defaultValue: '',
        maxLength: 80,
        required: false,
      },
      style: {
        order: 8,
        defaultValue: '',
        maxLength: 250,
        required: false,
      },
      camera: {
        order: 9,
        defaultValue: '',
        maxLength: 100,
        required: false,
      },
      atmosphere: {
        order: 10,
        defaultValue: '',
        maxLength: 50,
        required: false,
      },
      meta: {
        order: 99,
        defaultValue: '',
        maxLength: 100,
        required: false,
      },
    };
    
    this.stats = { built: 0, defaultsUsed: 0, fieldsTrimmed: 0 };
  }

  /**
   * 构建结构化 Prompt 对象
   * @param {Object} rawFields - 原始字段 { subject, action, environment, ... }
   * @returns {Object} - 结构化对象 { fields, order, metadata }
   */
  build(rawFields) {
    const fields = {};
    let defaultsUsed = 0;
    let fieldsTrimmed = 0;
    
    for (const [fieldName, config] of Object.entries(this.schema)) {
      let value = rawFields[fieldName];
      
      // 使用默认值
      if (!value || (typeof value === 'string' && !value.trim())) {
        if (config.required && config.defaultValue) {
          value = config.defaultValue;
          defaultsUsed++;
        } else {
          continue;
        }
      }
      
      // 数组转字符串
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      // 长度限制（软限制，只警告不截断）
      if (typeof value === 'string' && value.length > config.maxLength) {
        console.warn(`[PromptSchemaBuilder] ⚠️ 字段 ${fieldName} 长度 ${value.length} > 建议 ${config.maxLength}`);
        fieldsTrimmed++;
      }
      
      fields[fieldName] = {
        value: value.toString().trim(),
        order: config.order,
        required: config.required,
        maxLength: config.maxLength,
      };
    }
    
    this.stats.built++;
    this.stats.defaultsUsed += defaultsUsed;
    this.stats.fieldsTrimmed += fieldsTrimmed;
    
    // 按 order 排序
    const sortedFields = Object.entries(fields)
      .sort((a, b) => a[1].order - b[1].order)
      .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});
    
    return {
      fields: sortedFields,
      metadata: {
        fieldCount: Object.keys(fields).length,
        defaultsUsed,
        fieldsTrimmed,
      },
    };
  }

  /**
   * 从现有 prompt 解析为结构化字段（反向工程）
   * @param {string} prompt - 完整 prompt
   * @returns {Object} - 结构化字段猜测
   */
  parse(prompt) {
    const fields = {};
    const segments = prompt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    
    // 简单启发式分类
    for (const segment of segments) {
      const lower = segment.toLowerCase();
      
      if (lower.includes('cinematic') || lower.includes('photorealistic') || lower.includes('hyper-detailed')) {
        fields.prefix = segment;
      } else if (lower.includes('era') || lower.includes('mythological') || lower.includes('contemporary')) {
        fields.era = segment;
      } else if (lower.includes('shot') || lower.includes('angle') || lower.includes('dolly') || lower.includes('tracking')) {
        fields.camera = segment;
      } else if (lower.includes('light') || lower.includes('sunlight') || lower.includes('illumination')) {
        fields.lighting = segment;
      } else if (/^#[0-9a-f]{6}/i.test(segment)) {
        fields.colors = (fields.colors ? fields.colors + ' ' : '') + segment;
      } else if (lower.includes('professional') || lower.includes('documentary')) {
        fields.atmosphere = segment;
      } else if (segment.length > 50) {
        // 长片段可能是主体或环境
        if (!fields.subject) {
          fields.subject = segment;
        } else {
          fields.environment = segment;
        }
      } else {
        fields.action = (fields.action ? fields.action + ', ' : '') + segment;
      }
    }
    
    return fields;
  }

  /**
   * 自定义 Schema
   */
  setSchema(customSchema) {
    this.schema = { ...this.schema, ...customSchema };
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { built: 0, defaultsUsed: 0, fieldsTrimmed: 0 };
  }
}

module.exports = { PromptSchemaBuilder };