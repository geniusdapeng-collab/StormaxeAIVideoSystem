/**
 * Prompt Budget Optimizer v2.5-Peng
 * 核心机制：自动逼近Seedance 2.0 Prompt空间上限
 * 
 * 原则：
 * - 不是"不超过"，是"逼近上限"
 * - 中文和英文是独立限制（非混合token）
 * - 固定模块自动测量，可变预算精确分配
 * - 优先级：中文场景动作 > 英文质感词 > 运镜指令
 * 
 * 使用方法:
 *   const { PromptBudgetOptimizer } = require('./prompt-budget-optimizer');
 *   const optimizer = new PromptBudgetOptimizer();
 *   optimizer.setFixedModules({ system_prefix: '...', ... });
 *   const result = optimizer.generateShotPrompt({ ch_scene: '...', en_supplement: '...', camera: '...' });
 *   // result.prompt, result.analysis, result.isCompliant
 */

const DEFAULT_LIMITS = {
  CHINESE: 490,  // 官方~590，buffer后490
  ENGLISH: 990,  // 官方~1000，buffer后990
};

class PromptBudgetOptimizer {
  constructor(options = {}) {
    this.limits = {
      chinese: options.chineseLimit || DEFAULT_LIMITS.CHINESE,
      english: options.englishLimit || DEFAULT_LIMITS.ENGLISH,
    };
    
    // 固定模块（必须存在，长度自动测量）
    this.fixedModules = {
      system_prefix: '',
      character_desc: '',
      honghuang_style: '',
      lighting_quality: '',
      color_system: '',
      negative_guard: '',
    };
    
    // 可变模块（每镜头不同）
    this.variableModules = {
      ch_scene: '',      // 中文场景动作（最高优先级）
      en_supplement: '',  // 英文补充（次优先级）
      camera: '',         // 运镜指令（最低优先级）
    };
    
    // 已测量状态
    this.measured = false;
    this.fixedEnglishLength = 0;
    this.variableBudget = 0; // 每镜头剩余英文预算
  }
  
  /**
   * 设置固定模块（从系统配置文件加载）
   */
  setFixedModules(modules) {
    this.fixedModules = { ...this.fixedModules, ...modules };
    this.measured = false;
    return this;
  }
  
  /**
   * 测量固定模块长度（英文+中文）
   */
  measureFixedModules() {
    let totalEn = 0;
    let totalCh = 0;
    const lengths = {};
    
    for (const [key, text] of Object.entries(this.fixedModules)) {
      const enLen = this._measureEnglish(text);
      const chLen = (text.match(/[\u4e00-\u9fff]/g) || []).length;
      lengths[key] = { en: enLen, ch: chLen };
      totalEn += enLen;
      totalCh += chLen;
    }
    
    // 加上逗号分隔符（每个模块间1个逗号+1空格=2字符）
    const separatorCount = Object.keys(this.fixedModules).length - 1;
    totalEn += separatorCount * 2;
    
    this.fixedEnglishLength = totalEn;
    this.variableBudget = this.limits.english - totalEn;
    this.fixedChineseLength = totalCh;
    this.variableChineseBudget = this.limits.chinese - totalCh;
    this.measured = true;
    
    return {
      totalEn,
      totalCh,
      perModule: lengths,
      variableBudget: this.variableBudget,
      variableChineseBudget: this.variableChineseBudget,
    };
  }
  
  /**
   * 生成单镜头Prompt，自动逼近上限
   * 
   * shotConfig: { ch_scene: string, en_supplement: string, camera: string }
   * 返回: { prompt, analysis, utilization, isCompliant }
   */
  generateShotPrompt(shotConfig) {
    if (!this.measured) {
      this.measureFixedModules();
    }
    
    const { ch_scene, en_supplement, camera } = shotConfig;
    
    // 1. 中文场景动作：使用扣除固定模块中文后的预算
    const targetChinese = this.variableChineseBudget - 20; // 留20字buffer
    const optimizedChinese = this._optimizeChineseLength(ch_scene, targetChinese);
    
    // 2. 英文可变部分：分配预算
    // 优先级：en_supplement (60%) > camera (40%)
    const enSupplementBudget = Math.floor(this.variableBudget * 0.6);
    const cameraBudget = Math.floor(this.variableBudget * 0.4);
    
    const optimizedEnSupplement = this._optimizeEnglishLength(en_supplement, enSupplementBudget);
    const optimizedCamera = this._optimizeEnglishLength(camera, cameraBudget);
    
    // 3. 组装Prompt
    const parts = [
      this.fixedModules.system_prefix,
      this.fixedModules.character_desc,
      optimizedChinese,
      optimizedEnSupplement,
      this.fixedModules.honghuang_style,
      this.fixedModules.lighting_quality,
      this.fixedModules.color_system,
      this.fixedModules.negative_guard,
      optimizedCamera,
    ];
    
    const prompt = parts.join(', ');
    
    // 4. 验证
    const analysis = this.analyze(prompt);
    
    return {
      prompt,
      analysis,
      utilization: {
        chinese: (analysis.chineseChars / this.limits.chinese * 100).toFixed(1) + '%',
        english: (analysis.englishChars / this.limits.english * 100).toFixed(1) + '%',
      },
      isCompliant: analysis.chineseChars <= this.limits.chinese && analysis.englishChars <= this.limits.english,
    };
  }
  
  /**
   * 分析Prompt长度
   */
  analyze(prompt) {
    const chineseChars = (prompt.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishChars = prompt.replace(/[\u4e00-\u9fff\s，。！？、：""''（）【】《》\n\r]/g, '').length;
    const totalChars = prompt.length;
    
    return {
      chineseChars,
      englishChars,
      totalChars,
      chineseLimit: this.limits.chinese,
      englishLimit: this.limits.english,
      chineseUtilization: (chineseChars / this.limits.chinese * 100).toFixed(1) + '%',
      englishUtilization: (englishChars / this.limits.english * 100).toFixed(1) + '%',
    };
  }
  
  /**
   * 批量生成并验证
   * 
   * shotConfigs: Array<{ ch_scene, en_supplement, camera, ... }>
   * 返回: { results, summary }
   */
  generateBatch(shotConfigs) {
    const results = [];
    let passCount = 0;
    
    for (const config of shotConfigs) {
      const result = this.generateShotPrompt(config);
      results.push({ ...config, ...result });
      if (result.isCompliant) passCount++;
    }
    
    const avgChinese = Math.round(results.reduce((s, r) => s + r.analysis.chineseChars, 0) / results.length);
    const avgEnglish = Math.round(results.reduce((s, r) => s + r.analysis.englishChars, 0) / results.length);
    
    return {
      results,
      summary: {
        total: results.length,
        compliant: passCount,
        complianceRate: (passCount / results.length * 100).toFixed(0) + '%',
        avgChinese,
        avgEnglish,
        avgChineseUtilization: (avgChinese / this.limits.chinese * 100).toFixed(1) + '%',
        avgEnglishUtilization: (avgEnglish / this.limits.english * 100).toFixed(1) + '%',
      },
    };
  }
  
  // ============ 私有方法 ============
  
  _measureEnglish(text) {
    return text.replace(/[\u4e00-\u9fff\s，。！？、：""''（）【】《》\n\r]/g, '').length;
  }
  
  _optimizeChineseLength(text, target) {
    // 如果未超限，直接返回
    const current = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    if (current <= target) return text;
    
    // 严格截断：只保留前target个中文字符
    let charCount = 0;
    let cutIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      if (/[\u4e00-\u9fff]/.test(text[i])) {
        charCount++;
        if (charCount > target) {
          cutIndex = i;
          break;
        }
      }
    }
    
    return text.substring(0, cutIndex);
  }
  
  _optimizeEnglishLength(text, target) {
    const current = text.replace(/[\u4e00-\u9fff\s，。！？、：""''（）【】《》\n\r]/g, '').length;
    if (current <= target) return text;
    
    // 截断策略：按单词截断，不截断在单词中间
    const words = text.split(/\s+/);
    let result = '';
    let charCount = 0;
    
    for (const word of words) {
      const wordChars = word.replace(/[\u4e00-\u9fff，。！？、：""''（）【】《》]/g, '').length;
      if (charCount + wordChars > target) break;
      result += (result ? ' ' : '') + word;
      charCount += wordChars;
    }
    
    return result || text.substring(0, target);
  }
}

// ============ 导出 ============

module.exports = { PromptBudgetOptimizer, DEFAULT_LIMITS };