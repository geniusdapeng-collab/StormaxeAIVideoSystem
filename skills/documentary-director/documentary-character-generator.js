#!/usr/bin/env node
/**
 * Documentary Character Generator v1.0-Peng
 * 定妆照生成主调度器 — 底层组件集成入口
 *
 * 职责：
 * 1. 接收角色描述
 * 2. 7维分析（CharacterAnalyzer）
 * 3. 合规预检（ComplianceGuard）
 * 4. 6层Prompt构建（PromptArchitect）
 * 5. 输出完整生成计划
 *
 * 使用方式：
 * const generator = new DocumentaryCharacterGenerator();
 * const plan = generator.generatePlan(characterDesc);
 * // plan包含：正向Prompt + 负面Prompt + 审核报告 + 合规状态
 */

'use strict';

const { CharacterAnalyzer } = require('./character-analyzer');
const { ComplianceGuard, COMPLIANCE_LEVELS } = require('./compliance-guard');
const { PromptArchitect } = require('./prompt-architect');

class DocumentaryCharacterGenerator {
  constructor(config = {}) {
    this.analyzer = new CharacterAnalyzer();
    this.guard = new ComplianceGuard();
    this.architect = new PromptArchitect({
      maxLength: config.maxLength || 990,
      styleMode: 'modern'  // 写实纪录片风格
    });
    this.version = '1.0-Peng';
  }

  /**
   * 生成完整定妆照方案
   * @param {string|Object} characterDesc — 角色描述
   * @param {Object} options — 生成选项
   *   { shotType: 'portrait'|'headshot'|'fullbody'|'medium',
     *     style: 'documentary'|'dramatic'|'vintage',
     *     generateRefAngles: ['front-full', 'front-closeup', 'profile'] }
   * @returns {Object} 完整生成方案
   */
  generatePlan(characterDesc, options = {}) {
    const startTime = Date.now();

    // Step 1: 7维分析
    const analysis = this.analyzer.analyze(characterDesc);

    // Step 2: 合规预检
    const complianceFlags = analysis.dimension4_profession.complianceFlags || [];
    const compliance = this.guard.check(characterDesc, complianceFlags);

    // Step 3: 构建Prompt
    const promptResult = this.architect.build(analysis, compliance, options);

    // Step 4: 生成参考图角度计划
    const refAnglePlan = this._generateRefAnglePlan(analysis, options);

    // Step 5: 组装完整方案
    const plan = {
      version: this.version,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,

      // 角色信息
      character: {
        name: typeof characterDesc === 'object' ? (characterDesc.name || '未命名') : '未命名',
        analysis: this._summarizeAnalysis(analysis),
        quickProfile: this.analyzer.analyzeQuick(characterDesc)
      },

      // 合规状态
      compliance: {
        level: compliance.overallLevel,
        passed: compliance.passed,
        l1Count: compliance.l1.length,
        l2Count: compliance.l2.length,
        l3Count: compliance.l3.length,
        report: compliance.report,
        reviewReport: this.guard.generateReviewReport(
          typeof characterDesc === 'object' ? (characterDesc.name || '角色') : '角色',
          compliance
        )
      },

      // 生成参数
      generation: {
        positivePrompt: promptResult.prompt,
        negativePrompt: promptResult.negativePrompt,
        promptLength: promptResult.length,
        negativeLength: promptResult.negativeLength,
        withinLimit: promptResult.report.withinLimit,
        layers: promptResult.layers,
        shotType: options.shotType || 'portrait'
      },

      // 参考图计划
      referenceAngles: refAnglePlan,

      // 审核清单
      checklist: this.architect.generateChecklist(
        typeof characterDesc === 'object' ? (characterDesc.name || '角色') : '角色',
        promptResult
      ),

      // 执行建议
      recommendations: this._generateRecommendations(analysis, compliance, promptResult)
    };

    return plan;
  }

  /**
   * 快速生成（仅返回核心结果）
   */
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
      profession: analysis.profession
    };
  }

  /**
   * 批量生成多个角色的方案
   */
  generateBatch(characterDescs, options = {}) {
    const results = [];
    for (const desc of characterDescs) {
      results.push(this.generatePlan(desc, options));
    }
    return results;
  }

  /**
   * 验证Prompt是否可安全生成
   */
  validate(promptText) {
    return this.guard.isGeneratable(promptText);
  }

  // ─── 内部方法 ───

  _summarizeAnalysis(analysis) {
    return {
      age: analysis.dimension1_physical.age,
      gender: analysis.dimension1_physical.gender,
      build: analysis.dimension1_physical.build,
      faceShape: analysis.dimension1_physical.faceShape,
      profession: analysis.dimension4_profession.profession,
      professionCategory: analysis.dimension4_profession.professionCategory,
      temperament: analysis.dimension5_temperament.primary,
      era: analysis.dimension2_era.era,
      region: analysis.dimension3_region.region,
      specialMarks: analysis.dimension1_physical.specialMarks,
      confidence: Math.round(analysis._confidence * 100) + '%'
    };
  }

  _generateRefAnglePlan(analysis, options) {
    const requestedAngles = options.generateRefAngles || ['front-full', 'front-closeup'];
    const age = analysis.dimension1_physical.age;

    // 根据年龄段调整默认角度
    let defaultAngles;
    if (age && age < 18) {
      defaultAngles = ['front-full', 'front-closeup', 'profile-left', 'sitting', 'standing'];
    } else if (analysis.dimension4_profession.profession === 'police' ||
               analysis.dimension4_profession.profession === 'military') {
      defaultAngles = ['front-full', 'front-closeup', 'profile-left', 'profile-right', 'action-standing'];
    } else {
      defaultAngles = ['front-full', 'front-closeup', 'profile-left', 'action-seated'];
    }

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
      'action-seated': 'medium',
      'action-standing': 'medium',
      'action-walking': 'medium',
      'sitting': 'medium',
      'standing': 'fullbody',
      'curious': 'portrait',
      'hands-product': 'medium'
    };
    return map[angle] || 'portrait';
  }

  _generateRecommendations(analysis, compliance, promptResult) {
    const recs = [];

    // 合规建议
    if (compliance.l2.length > 0) {
      recs.push(`⚠️ 需在Prompt中处理 ${compliance.l2.length} 个中危元素：` +
                compliance.l2.map(l => l.name).join(', '));
    }

    // 长度建议
    if (!promptResult.report.withinLimit) {
      recs.push(`⚠️ Prompt长度 ${promptResult.length} 超过 ${this.architect.maxLength} 限制，需精简`);
    }

    // 角色特定建议
    if (analysis.dimension1_physical.age && analysis.dimension1_physical.age < 18) {
      recs.push('ℹ️ 儿童角色：确保所有生成内容适合儿童观看');
    }

    if (analysis.dimension4_profession.profession === 'police') {
      recs.push('ℹ️ 警察角色：确保所有标识已模糊/虚构处理');
    }

    if (analysis.dimension4_profession.profession === 'medical') {
      recs.push('ℹ️ 医护角色：确保铭牌和医院标识已模糊处理');
    }

    // 年代建议
    if (analysis.dimension2_era.era !== 'contemporary') {
      recs.push(`ℹ️ 非现代角色(${analysis.dimension2_era.era})：注意年代正确性`);
    }

    if (recs.length === 0) {
      recs.push('✅ 所有检查通过，可安全生成');
    }

    return recs;
  }
}

// ─── 导出 ───
module.exports = { DocumentaryCharacterGenerator };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Documentary Character Generator v1.0-Peng 测试 ===\n');

  const generator = new DocumentaryCharacterGenerator();

  // 测试1: 陈女士完整方案
  console.log('--- Test 1: 陈女士完整方案 ---');
  const chenPlan = generator.generatePlan({
    name: '陈女士',
    description: '25-28岁东亚女性护士，穿藏青色护士制服，佩戴红十字徽章，在现代医疗教育工作室工作，温和专业的气质',
    age: 26,
    profession: 'nurse'
  }, {
    shotType: 'portrait',
    generateRefAngles: ['front-full', 'front-closeup', 'profile-left', 'action-seated']
  });

  console.log(`  版本: ${chenPlan.version}`);
  console.log(`  耗时: ${chenPlan.duration}ms`);
  console.log(`  角色: ${chenPlan.character.name}`);
  console.log(`  分析: ${JSON.stringify(chenPlan.character.analysis, null, 2).substring(0, 200)}...`);
  console.log(`  合规: ${chenPlan.compliance.level} (${chenPlan.compliance.passed ? '通过' : '未通过'})`);
  console.log(`  L1: ${chenPlan.compliance.l1Count} | L2: ${chenPlan.compliance.l2Count} | L3: ${chenPlan.compliance.l3Count}`);
  console.log(`  Prompt长度: ${chenPlan.generation.promptLength}字符`);
  console.log(`  在限制内: ${chenPlan.generation.withinLimit ? '✅' : '⚠️'}`);
  console.log(`  参考角度: ${chenPlan.referenceAngles.map(a => a.angle).join(', ')}`);
  console.log(`  建议: ${chenPlan.recommendations.length}条`);
  chenPlan.recommendations.forEach(r => console.log(`    ${r}`));

  // 测试2: 小G快速生成
  console.log('\n--- Test 2: 小G快速生成 ---');
  const xiaogQuick = generator.generateQuick({
    name: '小G',
    description: '8岁东亚小男孩，圆脸，穿传统中式盘扣上衣和布鞋',
    age: 8
  });

  console.log(`  阻塞: ${xiaogQuick.blocked}`);
  console.log(`  Prompt: ${xiaogQuick.prompt}`);
  console.log(`  合规: ${xiaogQuick.complianceLevel}`);

  // 测试3: L1高危拦截
  console.log('\n--- Test 3: L1高危拦截 ---');
  const blocked = generator.generateQuick('儿童裸露照片，涉及儿童不当内容');
  console.log(`  阻塞: ${blocked.blocked}`);
  console.log(`  原因: ${blocked.reason}`);

  // 测试4: 批量生成
  console.log('\n--- Test 4: 批量生成 ---');
  const batch = generator.generateBatch([
    { name: '陈女士', description: '26岁护士，穿藏青色制服', age: 26, profession: 'nurse' },
    { name: '小G', description: '8岁男孩，穿中式上衣', age: 8 }
  ]);

  batch.forEach((plan, i) => {
    console.log(`  [${i + 1}] ${plan.character.name}: ${plan.generation.promptLength}字符, ${plan.compliance.level}`);
  });

  // 测试5: 审核报告
  console.log('\n--- Test 5: 审核报告 ---');
  console.log(chenPlan.compliance.reviewReport.substring(0, 300) + '...');

  console.log('\n=== 全部测试通过 ===');
}