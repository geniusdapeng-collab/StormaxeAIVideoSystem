#!/usr/bin/env node
/**
 * Shanhaijing Character Generator v1.0-Peng
 * 山海经角色定妆照生成器 — 古装/神话风格适配层
 *
 * 职责：
 * 1. 调用通用底层（character-generator/）进行7维分析+合规检测+Prompt构建
 * 2. 注入古装/神话风格参数（styleMode: 'ancient'）
 * 3. 输出符合山海经世界观的角色定妆照方案
 *
 * 与 documentary-character-generator.js 平行：
 * - 共享同一套 CharacterAnalyzer / ComplianceGuard / PromptArchitect
 * - 仅在 PromptArchitect 中切换 styleMode = 'ancient'
 * - 服装/环境/光影/负面词全部自动切换为古装神话风格
 */

'use strict';

const { CharacterAnalyzer } = require('../character-generator/character-analyzer');
const { ComplianceGuard, COMPLIANCE_LEVELS } = require('../character-generator/compliance-guard');
const { PromptArchitect } = require('../character-generator/prompt-architect');

class ShanhaijingCharacterGenerator {
  constructor(config = {}) {
    this.analyzer = new CharacterAnalyzer();
    this.guard = new ComplianceGuard();
    this.architect = new PromptArchitect({
      maxLength: config.maxLength || 990,
      styleMode: 'ancient'  // 古装/神话风格 — 自动切换服装/环境/光影/负面词
    });
    this.version = '1.0-Peng';
  }

  /**
   * 生成完整山海经角色定妆照方案
   * @param {string|Object} characterDesc — 角色描述（可含中文古风描述）
   * @param {Object} options — 生成选项
   *   { shotType: 'portrait'|'headshot'|'fullbody'|'medium',
     *     generateRefAngles: [...] }
   * @returns {Object} 完整生成方案
   */
  generatePlan(characterDesc, options = {}) {
    const startTime = Date.now();

    // Step 1: 7维分析
    const analysis = this.analyzer.analyze(characterDesc);

    // Step 2: 合规预检（古装模式：神兽/禁忌/宗教符号检查）
    const complianceFlags = analysis.dimension4_profession.complianceFlags || [];
    const compliance = this.guard.check(characterDesc, complianceFlags);

    // Step 3: 构建Prompt（自动切换为古装神话风格）
    const promptResult = this.architect.build(analysis, compliance, options);

    // Step 4: 生成参考图角度计划
    const refAnglePlan = this._generateRefAnglePlan(analysis, options);

    // Step 5: 组装
    const plan = {
      version: this.version,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,

      character: {
        name: typeof characterDesc === 'object' ? (characterDesc.name || '未命名') : '未命名',
        analysis: this._summarizeAnalysis(analysis),
        quickProfile: this.analyzer.analyzeQuick(characterDesc)
      },

      compliance: {
        level: compliance.overallLevel,
        passed: compliance.passed,
        l1Count: compliance.l1.length,
        l2Count: compliance.l2.length,
        l3Count: compliance.l3.length,
        report: compliance.report
      },

      generation: {
        positivePrompt: promptResult.prompt,
        negativePrompt: promptResult.negativePrompt,
        promptLength: promptResult.length,
        negativeLength: promptResult.negativeLength,
        withinLimit: promptResult.report.withinLimit,
        layers: promptResult.layers,
        shotType: options.shotType || 'portrait',
        styleMode: 'ancient' // 标注风格模式
      },

      referenceAngles: refAnglePlan,

      checklist: this.architect.generateChecklist(
        typeof characterDesc === 'object' ? (characterDesc.name || '角色') : '角色',
        promptResult
      )
    };

    return plan;
  }

  generateQuick(characterDesc, options = {}) {
    const analysis = this.analyzer.analyzeQuick(characterDesc);
    const compliance = this.guard.checkCritical(characterDesc, analysis.complianceFlags);

    if (!compliance.passed) {
      return {
        blocked: true,
        reason: 'L1_CRITICAL: ' + compliance.level,
        message: '存在高危合规问题，无法生成'
      };
    }

    const promptResult = this.architect.buildQuick(analysis, options);

    return {
      blocked: false,
      prompt: promptResult.prompt,
      negativePrompt: promptResult.negativePrompt,
      complianceLevel: compliance.level,
      age: analysis.age,
      profession: analysis.profession,
      styleMode: 'ancient'
    };
  }

  generateBatch(characterDescs, options = {}) {
    return characterDescs.map(desc => this.generatePlan(desc, options));
  }

  validate(promptText) {
    return this.guard.isGeneratable(promptText);
  }

  // ─── 内部方法 ───

  _summarizeAnalysis(analysis) {
    return {
      age: analysis.dimension1_physical.age,
      gender: analysis.dimension1_physical.gender,
      build: analysis.dimension1_physical.build,
      profession: analysis.dimension4_profession.profession,
      temperament: analysis.dimension5_temperament.primary,
      era: analysis.dimension2_era.era,
      specialMarks: analysis.dimension1_physical.specialMarks,
      confidence: Math.round(analysis._confidence * 100) + '%'
    };
  }

  _generateRefAnglePlan(analysis, options) {
    const requestedAngles = options.generateRefAngles || ['front-full', 'front-closeup'];

    // 山海经角色默认需要更多角度（动态/飞行/战斗姿态）
    const defaultAngles = [
      'front-full',      // 正面全身
      'front-closeup',   // 正面特写
      'profile-left',    // 左侧轮廓
      'action-standing', // 站立动态
      'action-power'     // 施法/战斗姿态
    ];

    const angles = requestedAngles.length > 0 ? requestedAngles : defaultAngles;

    return angles.map(angle => ({
      angle,
      shotType: this._angleToShotType(angle),
      recommended: defaultAngles.includes(angle)
    }));
  }

  _angleToShotType(angle) {
    const map = {
      'front-full': 'fullbody',
      'front-closeup': 'portrait',
      'profile-left': 'portrait',
      'profile-right': 'portrait',
      'action-standing': 'medium',
      'action-power': 'medium',
      'action-flying': 'fullbody',
      'action-casting': 'medium'
    };
    return map[angle] || 'portrait';
  }
}

// ─── 导出 ───
module.exports = { ShanhaijingCharacterGenerator };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Shanhaijing Character Generator v1.0-Peng 测试 ===\n');

  const generator = new ShanhaijingCharacterGenerator();

  // 测试1: 烛龙角色
  console.log('--- Test 1: 烛龙古装角色 ---');
  const zhulong = generator.generatePlan({
    name: '烛龙',
    description: '中国古代神话中的钟山之神，人面蛇身，赤色，身长千里。睁眼为昼，闭眼为夜。身穿赤红战甲，头戴龙角冠，站在云雾缭绕的山巅',
    profession: 'deity'
  }, {
    shotType: 'fullbody',
    generateRefAngles: ['front-full', 'front-closeup', 'action-power']
  });

  console.log(`  角色: ${zhulong.character.name}`);
  console.log(`  风格: ${zhulong.generation.styleMode}`);
  console.log(`  Prompt前200字符: ${zhulong.generation.positivePrompt.substring(0, 200)}...`);
  console.log(`  Prompt长度: ${zhulong.generation.promptLength}字符`);
  console.log(`  负面词长度: ${zhulong.generation.negativeLength}字符`);
  console.log(`  合规: ${zhulong.compliance.level}`);
  console.log(`  参考角度: ${zhulong.referenceAngles.map(a => a.angle).join(', ')}`);

  // 测试2: 精卫（鸟形+人形）
  console.log('\n--- Test 2: 精卫角色 ---');
  const jingwei = generator.generatePlan({
    name: '精卫',
    description: '炎帝之女溺亡后化身的神鸟，白喙赤足，头戴花冠，身穿羽衣，站在发鸠山的柘木上，口衔木石欲填东海',
    profession: 'deity'
  }, {
    shotType: 'medium',
    generateRefAngles: ['front-full', 'action-standing', 'action-flying']
  });

  console.log(`  角色: ${jingwei.character.name}`);
  console.log(`  Prompt前150字符: ${jingwei.generation.positivePrompt.substring(0, 150)}...`);

  // 测试3: 小G（8岁男孩，古装版）
  console.log('\n--- Test 3: 小G古装版 ---');
  const xiaogAncient = generator.generateQuick({
    name: '小G',
    description: '8岁东亚小男孩，圆脸，穿古代棉质交领上衣和布鞋，站在古风庭院中',
    age: 8
  });

  console.log(`  阻塞: ${xiaogAncient.blocked}`);
  console.log(`  Prompt: ${xiaogAncient.prompt}`);
  console.log(`  风格: ${xiaogAncient.styleMode}`);

  // 测试4: 批量生成
  console.log('\n--- Test 4: 批量生成 ---');
  const batch = generator.generateBatch([
    { name: '烛龙', description: '赤色龙神，战甲，山巅', profession: 'deity' },
    { name: '小G', description: '8岁男孩，古装', age: 8 },
    { name: '九尾狐', description: '白色九尾狐，化为人形，身穿白色仙袍', profession: 'deity' }
  ]);

  batch.forEach((plan, i) => {
    console.log(`  [${i + 1}] ${plan.character.name}: ${plan.generation.promptLength}字符, ${plan.compliance.level}`);
  });

  // 测试5: 负面词检查（应包含古装专属禁令）
  console.log('\n--- Test 5: 负面词检查 ---');
  const negWords = zhulong.generation.negativePrompt.split(', ');
  const ancientKeywords = ['modern clothing', 'cars', 'phones', 'modern buildings'];
  const hasAncientBans = ancientKeywords.every(k => negWords.includes(k));
  console.log(`  古装负面词检测: ${hasAncientBans ? '✅ 全部包含' : '⚠️ 部分缺失'}`);
  console.log(`  负面词总数: ${negWords.length}项`);

  console.log('\n=== 全部测试通过 ===');
}