// FieldMerger — 字段合并器
// 定义字段优先级，合并时解决冲突，超限时按优先级裁剪

class FieldMerger {
  constructor(options = {}) {
    // 字段优先级定义（高 → 低）
    // 越靠前越重要，超限时后保留
    this.priorityOrder = options.priorityOrder || [
      'subject',      // 主体描述（人物/物体/场景）- 最高优先级
      'action',       // 动作/行为
      'environment',  // 环境/场景
      'lighting',     // 光影
      'camera',       // 运镜
      'style',        // 风格/锚定词
      'colors',       // 色彩
      'atmosphere',   // 氛围
      'meta',         // 元信息（参考图标注等）
    ];
    
    // 每个字段的最大长度建议（不强制截断，用于预警）
    // 基于实际生产数据调优（v6.14-Peng 第3批）
    this.fieldLimits = options.fieldLimits || {
      subject: 350,    // 主体描述（多角色时更长）
      action: 250,     // 动作/行为（运镜+描述）
      environment: 300, // 环境/场景
      lighting: 300,   // 光影（生产数据实际约250-300）
      camera: 150,     // 运镜
      style: 250,      // 风格/锚定词（生产数据实际约200-250）
      colors: 80,      // 色彩（HEX码+描述）
      atmosphere: 60,  // 氛围
      meta: 100,       // 元信息（参考图标注等）
    };
    
    this.totalMax = options.totalMax || 990;
    this.stats = { merged: 0, conflicts: 0, trimmed: 0 };
  }

  /**
   * 合并多个字段，解决冲突
   * @param {Object} fields - { fieldName: fieldValue }
   * @returns {Object} - { merged, conflicts, stats }
   */
  merge(fields) {
    const merged = {};
    const conflicts = [];
    
    for (const [key, value] of Object.entries(fields)) {
      if (!value || (typeof value === 'string' && !value.trim())) continue;
      
      // 字符串字段
      if (typeof value === 'string') {
        merged[key] = this._cleanField(value);
      }
      // 数组字段（如多个角色描述）
      else if (Array.isArray(value)) {
        merged[key] = this._mergeArray(value);
      }
      else {
        merged[key] = value;
      }
    }
    
    this.stats.merged++;
    return { merged, conflicts, stats: this.stats };
  }
  
  /**
   * 清理单个字段
   */
  _cleanField(value) {
    return value
      .replace(/[。，,\s]+$/, '')
      .replace(/^[，,\s]+/, '')
      .trim();
  }
  
  /**
   * 合并数组字段（去重）
   */
  _mergeArray(arr) {
    const seen = new Set();
    const result = [];
    for (const item of arr) {
      const cleaned = this._cleanField(item);
      if (!cleaned) continue;
      const normalized = cleaned.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(cleaned);
      }
    }
    return result;
  }
  
  /**
   * 按优先级裁剪，确保总长度不超过限制
   * @param {Object} mergedFields - 合并后的字段
   * @returns {Object} - { trimmed, removed, finalLength }
   */
  trimByPriority(mergedFields) {
    const removed = [];
    let currentLength = this._estimateLength(mergedFields);
    
    if (currentLength <= this.totalMax) {
      return { trimmed: mergedFields, removed, finalLength: currentLength };
    }
    
    // 按优先级从低到高裁剪
    const trimmed = { ...mergedFields };
    for (const fieldName of [...this.priorityOrder].reverse()) {
      if (currentLength <= this.totalMax) break;
      if (!trimmed[fieldName]) continue;
      
      const fieldValue = trimmed[fieldName];
      const fieldLength = typeof fieldValue === 'string' 
        ? fieldValue.length 
        : Array.isArray(fieldValue) 
          ? fieldValue.join(', ').length 
          : 0;
      
      // 尝试缩短而不是删除
      if (typeof fieldValue === 'string' && fieldLength > 50) {
        const shortened = this._shortenField(fieldValue, Math.floor(fieldLength * 0.6));
        trimmed[fieldName] = shortened;
        currentLength = this._estimateLength(trimmed);
        removed.push({ field: fieldName, action: 'shortened', saved: fieldLength - shortened.length });
        this.stats.trimmed++;
        continue;
      }
      
      // 删除低优先级字段
      delete trimmed[fieldName];
      currentLength = this._estimateLength(trimmed);
      removed.push({ field: fieldName, action: 'removed', saved: fieldLength });
      this.stats.trimmed++;
    }
    
    return { trimmed, removed, finalLength: currentLength };
  }
  
  /**
   * 缩短字段（保留核心词）
   */
  _shortenField(text, targetLength) {
    if (text.length <= targetLength) return text;
    
    // 按逗号分割，保留前半部分
    const parts = text.split(/[,，]/);
    let result = '';
    for (const part of parts) {
      if ((result + part).length > targetLength) break;
      result += (result ? ', ' : '') + part.trim();
    }
    return result || text.substring(0, targetLength);
  }
  
  /**
   * 估算总长度（含逗号分隔符）
   */
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
    // 加逗号分隔符
    return length + (count > 0 ? (count - 1) * 2 : 0);
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  resetStats() {
    this.stats = { merged: 0, conflicts: 0, trimmed: 0 };
  }
}

module.exports = { FieldMerger };