/**
 * SchemaRuntimeValidator v6.0-Peng
 *
 * 🆕 v6.0-Peng (2026-06-11): LLM语义级验证接入
 *   - LLM进行语义级schema验证（不仅是结构检查）
 *   - 本地结构验证降级为fallback
 * 轻量级运行时Schema校验层（无ajv依赖）
 * 
 * 在Pipeline关键节点自动校验数据结构，防止脏数据流入下游。
 */

const fs = require('fs');
const path = require('path');
const { LLMReasoningLayer } = require('./llm-reasoning-layer');

const SCHEMA_DIR = path.join(__dirname, 'schema');

class SchemaRuntimeValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== false; // 默认严格
    this.schemas = {};
    this._loadSchemas();
  }

  _loadSchemas() {
    const files = fs.readdirSync(SCHEMA_DIR).filter(f => f.endsWith('.schema.json'));
    for (const file of files) {
      const name = file.replace('.schema.json', '');
      try {
        const content = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf8');
        this.schemas[name] = JSON.parse(content);
      } catch (e) {
        console.warn(`[SchemaRuntimeValidator] Schema ${file} parse error: ${e.message.substring(0, 80)}`);
        this.schemas[name] = null; // 降级：schema损坏不影响主流程
      }
    }
  }

  /**
   * 🆕 v6.0-Peng: LLM语义级验证优先，失败降级结构验证
   * @param {string} schemaName - 'story-plan' | 'shot-prompt' | 'character-asset'
   * @param {Object} data - 要校验的数据
   * @returns {{valid: boolean, errors: string[]}}
   */
  async validate(schemaName, data) {
    // 🆕 v6.0-Peng: 尝试LLM语义级验证
    try {
      const llmResult = await this._validateWithLLM(schemaName, data);
      if (llmResult) {
        console.log('   ✅ LLM语义验证完成');
        return llmResult;
      }
    } catch (err) {
      console.log(`   ⚠️ LLM验证失败: ${err.message?.substring(0, 60)}，降级结构验证`);
    }

    return this._validateLocal(schemaName, data);
  }

  async _validateWithLLM(schemaName, data) {
    const llm = new LLMReasoningLayer();
    const dataSample = JSON.stringify(data).substring(0, 1500);

    const result = await llm.llmReason({
      stage: 'schema-validator',
      systemPrompt: `You are a schema validation expert for a video production pipeline. Validate the semantic correctness of the data structure beyond structural checks. For schema "${schemaName}", check: data type consistency, field value reasonableness, cross-field semantic coherence, narrative logic consistency. Return JSON: { valid: boolean, errors: [strings], semanticIssues: [strings], suggestions: [strings] }.`,
      userPrompt: `Schema: ${schemaName}\nData: ${dataSample}`,
      level: 'light',
      fallback: () => null
    });

    if (result && typeof result === 'string') {
      try { return JSON.parse(result); } catch (e) { return null; }
    }
    return result || null;
  }

  _validateLocal(schemaName, data) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      return { valid: true, errors: [], degraded: true };
    }
    const errors = [];
    this._validateObject(data, schema, '', errors);
    return { valid: errors.length === 0, errors };
  }

  _validateObject(obj, schema, path, errors) {
    // required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (obj === undefined || obj === null || !(field in obj)) {
          errors.push(`${path}: missing required field '${field}'`);
        }
      }
    }

    if (obj === undefined || obj === null) return;

    // type checking
    if (schema.type === 'object' && typeof obj === 'object') {
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in obj) {
            this._validateValue(obj[key], propSchema, `${path}.${key}`, errors);
          }
        }
      }
    } else if (schema.type === 'array' && Array.isArray(obj)) {
      if (schema.minItems !== undefined && obj.length < schema.minItems) {
        errors.push(`${path}: array length ${obj.length} < min ${schema.minItems}`);
      }
      if (schema.items) {
        obj.forEach((item, i) => {
          this._validateValue(item, schema.items, `${path}[${i}]`, errors);
        });
      }
    } else {
      this._validateValue(obj, schema, path, errors);
    }
  }

  _validateValue(value, schema, path, errors) {
    if (value === undefined || value === null) {
      if (schema.type && !['null'].includes(schema.type)) {
        // null values in non-null fields are caught by required check
      }
      return;
    }

    // type
    const expectedType = schema.type;
    if (expectedType) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (expectedType === 'integer') {
        if (!Number.isInteger(value)) {
          errors.push(`${path}: expected integer, got ${actualType} (${value})`);
        }
      } else if (expectedType === 'number') {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          errors.push(`${path}: expected number, got ${actualType} (${value})`);
        }
      } else if (expectedType === 'string') {
        if (typeof value !== 'string') {
          errors.push(`${path}: expected string, got ${actualType} (${value})`);
        }
      } else if (expectedType === 'boolean') {
        if (typeof value !== 'boolean') {
          errors.push(`${path}: expected boolean, got ${actualType} (${value})`);
        }
      } else if (expectedType === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${path}: expected array, got ${actualType} (${value})`);
        }
      } else if (expectedType === 'object') {
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`${path}: expected object, got ${actualType} (${value})`);
        } else {
          this._validateObject(value, schema, path, errors);
        }
      }
    }

    // minLength / maxLength for strings
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path}: string length ${value.length} < min ${schema.minLength}`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path}: string length ${value.length} > max ${schema.maxLength}`);
      }
      if (schema.pattern) {
        const re = new RegExp(schema.pattern);
        if (!re.test(value)) {
          errors.push(`${path}: string '${value}' does not match pattern ${schema.pattern}`);
        }
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path}: string '${value}' not in enum [${schema.enum.join(', ')}]`);
      }
    }

    // minimum / maximum for numbers
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${path}: value ${value} < minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${path}: value ${value} > maximum ${schema.maximum}`);
      }
    }

    // format
    if (schema.format && typeof value === 'string') {
      if (schema.format === 'date-time') {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          errors.push(`${path}: invalid date-time '${value}'`);
        }
      } else if (schema.format === 'uri') {
        const uriRe = /^https?:\/\/.+/;
        if (!uriRe.test(value)) {
          errors.push(`${path}: invalid URI '${value}'`);
        }
      }
    }
  }

  /**
   * Pipeline钩子：在关键节点自动校验
   * @param {string} stage - 'story-plan' | 'shot-prompt' | 'character-asset'
   * @param {Object} data
   * @param {Object} options - {throwOnError: boolean}
   */
  gate(stage, data, options = {}) {
    const result = this.validate(stage, data);
    if (!result.valid) {
      const errMsg = `[SchemaGate] ${stage} validation failed:\n` + result.errors.map(e => '  - ' + e).join('\n');
      if (options.throwOnError !== false && this.strictMode) {
        throw new Error(errMsg);
      } else {
        console.warn(errMsg);
      }
    }
    return result;
  }
}

module.exports = { SchemaRuntimeValidator };