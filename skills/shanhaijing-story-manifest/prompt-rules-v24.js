/**
 * Prompt字符限制与模块分配硬规则
 * v2.4-Peng
 * 
 * 使用方式:
 * const { PromptRules } = require('./prompt-rules-v24.js');
 * const rules = new PromptRules();
 * rules.validate(prompt); // 返回 {valid, errors, warnings}
 * 
 * 集成模块:
 * - story-manifest-calibrator.js: 校准器调用validate()做检查
 * - seedance-render-engine.js: 渲染引擎调用validate()提交前检查
 * - director.js: 导演引擎调用validate()生成后检查
 * - pitch-evaluation.js: 比稿评测引用规则做评分标准
 */

class PromptRules {
  constructor() {
    // Seedance 2.0官方限制（留buffer）
    this.CHINESE_LIMIT = 490;      // 中文字数上限
    this.ENGLISH_LIMIT = 990;      // 英文字符上限
    this.TOKEN_LIMIT = 500;        // 总token估算上限
    
    // 8大模块检查配置
    this.REQUIRED_MODULES = {
      'system_prefix': {
        regex: /CG\s+cinematic.*photorealistic.*hyper-detailed.*skin.*pores/i,
        description: 'CG超写实系统前缀',
        example: 'CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime',
        required: true
      },
      'character_desc': {
        regex: /Chinese\s+boy|divine\s+bird|Dragon\s+King|XiaoG|Jingwei|小G|精卫|龙王/i,
        description: '角色描述（含人种特征+种族纹理）',
        example: 'Chinese boy XiaoG 8yo straight black hair dark brown almond eyes... divine bird Jingwei white beak red feet...',
        required: true
      },
      'scene_action': {
        regex: /[\u4e00-\u9fff]{15,}/,
        description: '中文场景动作（至少15个中文字符）',
        example: '小G坐在发鸠山坡歪头好奇，白喙赤足的精卫从头顶飞过',
        required: true
      },
      'honghuang_style': {
        regex: /Honghuang.*era|IMAX|ink\s+wash|Song\s+Dynasty|洪荒|水墨|宋代/i,
        description: '东方洪荒风格',
        example: 'Honghuang era, IMAX aesthetic, ink wash painting, Song Dynasty landscape, film grain',
        required: true
      },
      'lighting_quality': {
        regex: /natural\s+sunlight|golden\s+hour|rim\s+light|Fog\s+Hill|光影|光照/i,
        description: '光影质感',
        example: 'natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style',
        required: true
      },
      'color_system': {
        regex: /003B5C|D32F2F|深海|赤红|幽蓝|烈焰|撞色|五正色/i,
        description: '色彩系统（含HEX色值）',
        example: '深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光',
        required: true
      },
      'negative_guard': {
        regex: /negative:.*zombie.*wizard.*magic.*western\s+dragon.*modern.*neon.*anime/i,
        description: '负面防护词',
        example: 'negative: zombie, wizard, magic, western dragon, modern, neon, anime',
        required: true
      },
      'camera_instruction': {
        regex: /广角|特写|中景|近景|过肩|跟随|甩镜|establishing|close-up|medium|wide|standard|tracking|whip\s+pan/i,
        description: '运镜指令',
        example: '广角 establishing shot / 特写 close-up / 急速甩镜 whip pan',
        required: true
      }
    };
    
    // 7个核心禁忌词（负面防护必须包含）
    this.CORE_FORBIDDEN_WORDS = ['zombie', 'wizard', 'magic', 'western dragon', 'modern', 'neon', 'anime'];
    
    // 字符分配建议
    this.CHAR_ALLOCATION = {
      chinese: { min: 30, target: 50, max: 80, description: '场景动作+色彩标注' },
      english: { min: 400, target: 600, max: 750, description: '系统前缀+角色+风格+光影+负面+运镜' }
    };
  }

  /**
   * 验证单个Prompt
   */
  validate(prompt, shotId = 'unknown') {
    const errors = [];
    const warnings = [];
    
    // 1. 字符限制检查
    const chineseChars = (prompt.match(/[\u4e00-\u9fff]/g) || []).length;
    const totalChars = prompt.length;
    const englishChars = totalChars - chineseChars;
    const estimatedTokens = chineseChars + Math.ceil(englishChars / 2);
    
    if (chineseChars > this.CHINESE_LIMIT) {
      errors.push({
        type: 'chinese_overflow',
        shotId,
        message: `中文字数${chineseChars} > 限制${this.CHINESE_LIMIT}`,
        fix: '精简中文场景描述，删除冗余修饰，保留核心动作叙事'
      });
    }
    
    if (englishChars > this.ENGLISH_LIMIT) {
      errors.push({
        type: 'english_overflow',
        shotId,
        message: `英文字符${englishChars} > 限制${this.ENGLISH_LIMIT}`,
        fix: '精简英文修饰词，删除重复形容词，使用更紧凑术语'
      });
    }
    
    if (estimatedTokens > this.TOKEN_LIMIT) {
      warnings.push({
        type: 'token_near_limit',
        shotId,
        message: `估算token${estimatedTokens}接近限制${this.TOKEN_LIMIT}`,
        fix: '建议精简至450token以下，为API留buffer'
      });
    }
    
    // 2. 8大模块覆盖检查
    for (const [moduleName, config] of Object.entries(this.REQUIRED_MODULES)) {
      if (!config.regex.test(prompt)) {
        const severity = config.required ? 'error' : 'warning';
        const issue = {
          type: 'missing_module',
          module: moduleName,
          shotId,
          message: `缺少模块: ${config.description}`,
          example: config.example,
          severity
        };
        
        if (severity === 'error') {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    }
    
    // 3. 核心禁忌词检查（负面防护子检查）
    const promptLower = prompt.toLowerCase();
    const missingForbidden = this.CORE_FORBIDDEN_WORDS.filter(w => !promptLower.includes(w.toLowerCase()));
    if (missingForbidden.length > 0) {
      warnings.push({
        type: 'incomplete_negative_guard',
        shotId,
        message: `负面防护不完整，缺少: ${missingForbidden.join(', ')}`,
        fix: `补充完整: negative: ${this.CORE_FORBIDDEN_WORDS.join(', ')}`
      });
    }
    
    // 4. 字符分配建议
    if (chineseChars < this.CHAR_ALLOCATION.chinese.min) {
      warnings.push({
        type: 'chinese_underflow',
        shotId,
        message: `中文字数${chineseChars} < 建议最小值${this.CHAR_ALLOCATION.chinese.min}`,
        fix: '增加中文场景动作描述，提升叙事丰富度'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        chineseChars,
        englishChars,
        totalChars,
        estimatedTokens,
        moduleCoverage: Object.keys(this.REQUIRED_MODULES).filter(m => this.REQUIRED_MODULES[m].regex.test(prompt)).length
      }
    };
  }

  /**
   * 批量验证多个Prompt
   */
  validateBatch(prompts) {
    const results = [];
    let allValid = true;
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = typeof prompts[i] === 'string' ? prompts[i] : (prompts[i].text || prompts[i].prompt || '');
      const shotId = `S${String(i+1).padStart(2, '0')}`;
      const result = this.validate(prompt, shotId);
      results.push({ shotId, ...result });
      if (!result.valid) allValid = false;
    }
    
    return {
      allValid,
      totalPrompts: prompts.length,
      passedPrompts: results.filter(r => r.valid).length,
      failedPrompts: results.filter(r => !r.valid).length,
      results,
      summary: this._generateSummary(results)
    };
  }

  /**
   * 生成验证摘要
   */
  _generateSummary(results) {
    const allErrors = results.flatMap(r => r.errors.map(e => ({ shotId: r.shotId, ...e })));
    const allWarnings = results.flatMap(r => r.warnings.map(w => ({ shotId: r.shotId, ...w })));
    
    return {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      errorTypes: this._countByType(allErrors),
      warningTypes: this._countByType(allWarnings),
      avgChineseChars: Math.round(results.reduce((sum, r) => sum + r.stats.chineseChars, 0) / results.length),
      avgEnglishChars: Math.round(results.reduce((sum, r) => sum + r.stats.englishChars, 0) / results.length),
      avgTokens: Math.round(results.reduce((sum, r) => sum + r.stats.estimatedTokens, 0) / results.length)
    };
  }

  _countByType(items) {
    const counts = {};
    for (const item of items) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * 获取规则说明（用于文档/日志）
   */
  getRulesDoc() {
    return {
      version: 'v2.4-Peng',
      limits: {
        chinese: this.CHINESE_LIMIT,
        english: this.ENGLISH_LIMIT,
        tokens: this.TOKEN_LIMIT
      },
      modules: Object.entries(this.REQUIRED_MODULES).map(([name, config]) => ({
        name,
        description: config.description,
        required: config.required,
        example: config.example
      })),
      allocation: this.CHAR_ALLOCATION,
      forbiddenWords: this.CORE_FORBIDDEN_WORDS
    };
  }
}

// ============ 导出 ============
module.exports = { PromptRules };

// ============ CLI入口 ============
if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'validate') {
    const promptsPath = args[1];
    if (!promptsPath) {
      console.error('Usage: node prompt-rules-v24.js validate <prompts.json>');
      process.exit(1);
    }
    
    const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    const rules = new PromptRules();
    const result = rules.validateBatch(prompts);
    
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.allValid ? 0 : 1);
  } else if (command === 'rules') {
    const rules = new PromptRules();
    console.log(JSON.stringify(rules.getRulesDoc(), null, 2));
  } else {
    console.log(`
Prompt字符限制与模块分配硬规则 v2.4-Peng

用法:
  node prompt-rules-v24.js validate <prompts.json>  — 验证Prompt列表
  node prompt-rules-v24.js rules                   — 打印规则说明

规则:
  中文 ≤ ${new PromptRules().CHINESE_LIMIT}字
  英文 ≤ ${new PromptRules().ENGLISH_LIMIT}字符
  8大模块必须全部覆盖
  7个核心禁忌词必须包含在负面防护中
    `);
  }
}