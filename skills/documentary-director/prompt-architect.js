#!/usr/bin/env node
/**
 * Prompt Architect v1.0-Peng
 * 6层提示词架构师 — 将7维分析+合规结果构建为高质量定妆照Prompt
 *
 * 6层模型：
 * Layer 1: Subject / 主体 — 种族+性别+年龄+体型+面部特征+特殊标记
 * Layer 2: Costume / 服装 — 上装+下装+鞋履+整体风格
 * Layer 3: Accessories & Details / 配饰与细节 — 头部/颈部/手部/腰部/耳部/其他
 * Layer 4: Expression & Pose / 表情与姿态 — 气质+表情+眼神+姿态
 * Layer 5: Environment & Lighting / 环境与光线 — 背景+光线+氛围
 * Layer 6: Technical Specs / 技术规格 — 镜头+构图+画质修饰
 *
 * 集成自：Character Photo Generator Skill (参考借鉴版)
 * 适配：写实纪录片定妆照（现代场景，Seedance/Seedream兼容）
 */

'use strict';

// ─── 6层构建器 ───
class PromptArchitect {
  constructor(config = {}) {
    this.maxLength = config.maxLength || 990;
    this.defaultNegatives = this._buildDefaultNegatives();
  }

  /**
   * 构建完整定妆照Prompt（6层模型）
   * @param {Object} analysis — CharacterAnalyzer的7维分析结果
   * @param {Object} compliance — ComplianceGuard的检测结果
   * @param {Object} options — 构建选项（shotType, style, etc.）
   * @returns {Object} { prompt, negativePrompt, report }
   */
  build(analysis, compliance = null, options = {}) {
    const layers = {
      l1: this._buildLayer1(analysis.dimension1_physical, options),
      l2: this._buildLayer2(analysis, options),
      l3: this._buildLayer3(analysis, options),
      l4: this._buildLayer4(analysis.dimension5_temperament, options),
      l5: this._buildLayer5(analysis.dimension2_era, options),
      l6: this._buildLayer6(options)
    };

    // 合并合规修改器（加标记便于精简时保护）
    if (compliance && compliance.promptModifiers.length > 0) {
      layers.l3.accessories = layers.l3.accessories || '';
      const markedModifiers = compliance.promptModifiers.map(m => `[COMPLIANCE] ${m}`);
      layers.l3.accessories += ', ' + markedModifiers.join(', ');
    }

    // 组装正向提示词
    let prompt = this._assemblePrompt(layers);

    // 长度检查与精简
    if (prompt.length > this.maxLength) {
      prompt = this._trimPrompt(prompt, layers, this.maxLength);
    }

    // 构建负面提示词
    const negativePrompt = this._buildNegativePrompt(analysis, compliance, options);

    // 构建报告
    const report = this._buildReport(layers, prompt.length, compliance);

    return {
      prompt,
      negativePrompt,
      length: prompt.length,
      negativeLength: negativePrompt.length,
      layers,
      report,
      complianceLevel: compliance ? compliance.overallLevel : 'PASS'
    };
  }

  /**
   * 快速构建（极简模式）
   */
  buildQuick(quickAnalysis, options = {}) {
    const parts = [
      // Layer 1: 主体
      `${quickAnalysis.age}-year-old ${quickAnalysis.gender === 'male' ? 'Chinese boy' : 'Chinese woman'}`,
      quickAnalysis.build,

      // Layer 2: 服装（简化为职业关键词）
      ...(quickAnalysis.profession === 'medical' ? ['nurse uniform'] : []),
      ...(quickAnalysis.profession === 'police' ? ['police uniform'] : []),
      ...(quickAnalysis.profession === 'student' ? ['school uniform'] : []),

      // Layer 4: 气质
      quickAnalysis.temperament,

      // Layer 5: 环境
      'clean studio background',

      // Layer 6: 技术
      'CG cinematic photorealistic portrait, character design, not real person, not stock photo, professional 85mm lens render'
    ].filter(Boolean);

    const prompt = parts.join(', ');
    const negativePrompt = this.defaultNegatives;

    return { prompt, negativePrompt, length: prompt.length };
  }

  // ─── Layer 1: 主体 ───
  _buildLayer1(physical, options) {
    const parts = [];

    // 种族+性别+年龄
    const ageDesc = physical.age
      ? `${physical.age}-year-old`
      : 'adult';
    const genderDesc = physical.gender === 'female'
      ? 'East Asian woman'
      : physical.gender === 'male'
        ? 'East Asian man'
        : 'East Asian person';

    parts.push(`${ageDesc} ${genderDesc}`);

    // 体型
    if (physical.build) {
      const buildMap = {
        'slim': 'slim build',
        'average': 'average build',
        'athletic': 'athletic build',
        'stocky': 'stocky build',
        'overweight': 'heavyset build',
        'child': 'child build'
      };
      parts.push(buildMap[physical.build] || physical.build);
    }

    // 面部特征
    if (physical.faceShape) {
      parts.push(`${physical.faceShape} face shape`);
    }

    // 特殊标记
    if (physical.specialMarks && physical.specialMarks.length > 0) {
      // 只取前2个特殊标记
      parts.push(...physical.specialMarks.slice(0, 2));
    }

    return {
      content: parts.join(', '),
      priority: 'P0',
      weight: 'highest'
    };
  }

  // ─── Layer 2: 服装 ───
  _buildLayer2(analysis, options) {
    const prof = analysis.dimension4_profession;
    const parts = [];

    // 根据职业生成服装描述
    const costumeMap = {
      'medical': {
        nurse: 'dark navy professional nurse uniform with red cross emblem, white nurse cap, white shoes',
        doctor: 'white medical coat, stethoscope around neck, professional attire'
      },
      'police': 'dark police-style uniform with blurred insignia, unidentifiable badge, professional law enforcement attire',
      'military': 'olive drab military-style uniform with fictional insignia',
      'education': 'professional teaching attire, neat and respectable',
      'business': 'professional business suit, formal attire',
      'student': 'school uniform, clean and tidy',
      'presenter': 'professional on-camera attire, well-groomed'
    };

    if (prof.profession && costumeMap[prof.profession]) {
      const costume = costumeMap[prof.profession];
      if (typeof costume === 'object') {
        // 根据子角色选择（nurse vs doctor）
        parts.push(costume.nurse || costume.doctor || Object.values(costume)[0]);
      } else {
        parts.push(costume);
      }
    }

    // 如果是儿童，添加儿童服装
    if (analysis.dimension1_physical.age && analysis.dimension1_physical.age < 18) {
      parts.push('child-appropriate clothing, modest and clean');
    }

    return {
      content: parts.join(', '),
      priority: 'P1',
      weight: 'high'
    };
  }

  // ─── Layer 3: 配饰与细节 ───
  _buildLayer3(analysis, options) {
    const parts = [];
    const prof = analysis.dimension4_profession;

    // 职业配饰
    const accessoryMap = {
      'medical': 'stethoscope, professional medical accessories',
      'police': 'duty belt with equipment, professional law enforcement gear',
      'education': 'eyeglasses, books or teaching materials',
      'business': 'watch, briefcase or professional bag'
    };

    if (prof.profession && accessoryMap[prof.profession]) {
      parts.push(accessoryMap[prof.profession]);
    }

    // 年龄相关配饰
    if (analysis.dimension1_physical.age && analysis.dimension1_physical.age > 50) {
      parts.push('reading glasses, mature accessories');
    }

    return {
      content: parts.join(', '),
      priority: 'P2',
      weight: 'medium'
    };
  }

  // ─── Layer 4: 表情与姿态 ───
  _buildLayer4(temperament, options) {
    const parts = [];

    // 表情
    const expressionMap = {
      'smiling': 'warm genuine smile',
      'serious': 'serious professional expression',
      'tired': 'tired but determined expression',
      'determined': 'determined focused expression',
      'friendly': 'friendly approachable expression'
    };

    if (temperament.expression && expressionMap[temperament.expression]) {
      parts.push(expressionMap[temperament.expression]);
    } else {
      // 默认表情
      parts.push('natural relaxed expression');
    }

    // 眼神
    const gazeMap = {
      'sharp': 'sharp intelligent gaze',
      'warm': 'warm kind eyes',
      'tired': 'tired but alert eyes'
    };

    if (temperament.gaze && gazeMap[temperament.gaze]) {
      parts.push(gazeMap[temperament.gaze]);
    }

    // 姿态
    const postureMap = {
      'upright': 'standing upright with confidence',
      'slightly_hunched': 'natural relaxed posture',
      'relaxed': 'casual comfortable stance'
    };

    if (temperament.posture && postureMap[temperament.posture]) {
      parts.push(postureMap[temperament.posture]);
    } else {
      parts.push('natural standing pose');
    }

    return {
      content: parts.join(', '),
      priority: 'P3',
      weight: 'medium'
    };
  }

  // ─── Layer 5: 环境与光线 ───
  _buildLayer5(era, options) {
    const parts = [];

    // 环境
    const shotType = options.shotType || 'portrait';

    if (shotType === 'portrait' || shotType === 'headshot') {
      parts.push('clean neutral gray studio background');
    } else if (shotType === 'environmental') {
      parts.push('professional environment with soft background blur');
    } else {
      parts.push('clean simple background');
    }

    // 光线
    parts.push('soft even studio lighting, flattering illumination');

    // 时代氛围
    if (era.era === 'contemporary' || era.era === '2010-20') {
      parts.push('modern professional atmosphere');
    } else if (era.era && era.era !== 'contemporary') {
      parts.push(`${era.era} atmosphere, period-appropriate setting`);
    }

    return {
      content: parts.join(', '),
      priority: 'P4',
      weight: 'medium'
    };
  }

  // ─── Layer 6: 技术规格 ───
  _buildLayer6(options) {
    const parts = [];

    // 镜头
    const shotType = options.shotType || 'portrait';
    const lensMap = {
      'portrait': '85mm portrait lens',
      'headshot': '50mm lens, headshot framing',
      'fullbody': '35mm lens, full body shot',
      'medium': '50mm lens, medium shot'
    };

    parts.push(lensMap[shotType] || '85mm portrait lens');

    // 构图
    parts.push('rule of thirds, centered on face');

    // 画质
    parts.push('CG cinematic photorealistic, hyper-detailed, professional character design');
    parts.push('sharp focus on eyes, shallow depth of field');
    parts.push('4K resolution, studio quality');

    // 写实风格修饰 — 明确是CG而非真人照片
    parts.push('realistic skin texture with visible pores, natural lighting');
    parts.push('CG character design, not real person, not stock photo');

    return {
      content: parts.join(', '),
      priority: 'P5',
      weight: 'low'
    };
  }

  // ─── 组装Prompt ───
  _assemblePrompt(layers) {
    const parts = [
      layers.l1.content,
      layers.l2.content,
      layers.l3.content,
      layers.l4.content,
      layers.l5.content,
      layers.l6.content
    ].filter(Boolean);

    let prompt = parts.join(', ');

    // 清理
    prompt = prompt.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
    prompt = prompt.replace(/^,\s*/, '').replace(/,\s*$/, '');

    return prompt;
  }

  // ─── 精简Prompt（超限后）───
  _trimPrompt(prompt, layers, maxLen, options = {}) {
    // 策略1: 移除Layer 6的低优先级技术词
    if (prompt.length > maxLen) {
      const l6Reduced = layers.l6.content
        .replace(/,\s*4K resolution,\s*studio quality/, '')
        .replace(/,\s*rule of thirds,\s*centered on face/, '');
      layers.l6.content = l6Reduced;
      prompt = this._assemblePrompt(layers);
    }

    // 策略2: 精简Layer 5环境
    if (prompt.length > maxLen) {
      const l5Reduced = layers.l5.content
        .replace(/,\s*modern professional atmosphere/, '');
      layers.l5.content = l5Reduced;
      prompt = this._assemblePrompt(layers);
    }

    // 策略3: 精简Layer 3配饰但保留[COMPLIANCE]标记的修改器
    if (prompt.length > maxLen) {
      const original = layers.l3.content || '';
      const compliancePattern = /\[COMPLIANCE\].*?(?=,|$)/gi;
      const complianceParts = original.match(compliancePattern) || [];
      const nonCompliance = original.replace(compliancePattern, '').replace(/,\s*,/g, ',').trim();
      layers.l3.content = (complianceParts.join(', ') + ', ' + nonCompliance)
        .replace(/^,\s*|,\s*$/g, '').trim();
      if (layers.l3.content.length < 10 && complianceParts.length > 0) {
        layers.l3.content = complianceParts.join(', ');
      }
      prompt = this._assemblePrompt(layers);
    }

    // 策略4: 精简Layer 6到核心但保留shotType适配
    if (prompt.length > maxLen) {
      const shotType = options.shotType || 'portrait';
      const lensMap = {
        'portrait': '85mm lens',
        'headshot': '50mm lens',
        'fullbody': '35mm lens',
        'medium': '50mm lens',
        'wide': '24mm lens',
        'closeup': '100mm macro',
        'detail': 'macro lens',
      };
      layers.l6.content = `${lensMap[shotType] || '85mm lens'}, photorealistic, professional photography`;
      prompt = this._assemblePrompt(layers);
    }

    // 最终截断
    if (prompt.length > maxLen) {
      prompt = prompt.substring(0, maxLen - 3) + '...';
    }

    return prompt;
  }

  // ─── 负面提示词 ───
  _buildNegativePrompt(analysis, compliance, options) {
    const negatives = [];

    // 通用负面
    negatives.push(...this.defaultNegatives.split(', '));

    // 禁止真人照片风格（Seedance 2.0合规）
    negatives.push('real person', 'real human', 'celebrity', 'stock photo', 'photograph of real person');
    negatives.push('identifiable real individual', 'paparazzi photo', 'snapshot');

    // 按职业添加
    const prof = analysis.dimension4_profession.profession;
    if (prof === 'police') {
      negatives.push('readable badge number', 'identifiable police insignia', 'real department name');
    }
    if (prof === 'military') {
      negatives.push('real military insignia', 'identifiable unit patches');
    }
    if (prof === 'medical') {
      negatives.push('readable name tag', 'real hospital logo');
    }

    // 儿童安全
    if (analysis.dimension1_physical.age && analysis.dimension1_physical.age < 18) {
      negatives.push('adult themes', 'inappropriate for children', 'sexualized');
    }

    // 品牌
    negatives.push('brand logos', 'trademark', 'identifiable labels');

    // 年代错误（现代场景）
    negatives.push('anachronistic elements', 'historical inaccuracy');

    // 合规相关的负面
    if (compliance) {
      for (const item of compliance.l2) {
        if (item.action === 'BLUR') {
          negatives.push('sharp clear ' + item.rule.replace(/_/g, ' '));
        }
      }
    }

    return [...new Set(negatives)].join(', ');
  }

  // ─── 默认负面提示词 ───
  _buildDefaultNegatives() {
    return [
      'cartoon', 'anime', 'illustration', '3D render', 'painting', 'drawing',
      'deformed hands', 'extra fingers', 'mutated hands',
      'blurry face', 'disfigured', 'bad anatomy',
      'malformed limbs', 'missing arms', 'missing legs',
      'plastic skin', 'wax skin', 'porcelain skin', 'mannequin', 'doll',
      'oversaturated', 'neon colors', 'low quality', 'watermark',
      'text overlay', 'modern elements out of place',
      'real person', 'celebrity', 'stock photo', 'photograph of real person', 'identifiable real individual'
    ].join(', ');
  }

  // ─── 构建报告 ───
  _buildReport(layers, length, compliance) {
    return {
      totalLength: length,
      layerLengths: {
        l1: layers.l1.content.length,
        l2: layers.l2.content.length,
        l3: layers.l3.content.length,
        l4: layers.l4.content.length,
        l5: layers.l5.content.length,
        l6: layers.l6.content.length
      },
      compliance: compliance ? {
        level: compliance.overallLevel,
        l1Count: compliance.l1.length,
        l2Count: compliance.l2.length,
        l3Count: compliance.l3.length
      } : null,
      withinLimit: length <= this.maxLength
    };
  }

  /**
   * 生成审核清单
   */
  generateChecklist(characterName, buildResult) {
    const lines = [
      `## 定妆照生成清单 — ${characterName}`,
      '',
      '### 正向提示词',
      '```',
      buildResult.prompt,
      '```',
      '',
      '### 负面提示词',
      '```',
      buildResult.negativePrompt,
      '```',
      '',
      '### 技术参数',
      `- 正向长度: ${buildResult.length} 字符`,
      `- 负面长度: ${buildResult.negativeLength} 字符`,
      `- 合规等级: ${buildResult.complianceLevel}`,
      `- 在限制内: ${buildResult.report.withinLimit ? '✅' : '⚠️'}`,
      '',
      '### 质量检查点',
      '- [ ] 面部特征符合角色气质',
      '- [ ] 服装符合设定职业',
      '- [ ] 合规元素已处理（模糊/虚构）',
      '- [ ] 无品牌logo',
      '- [ ] 光影氛围专业',
      '- [ ] 无现代元素穿帮',
      '- [ ] 无敏感符号'
    ];

    return lines.join('\n');
  }
}

// ─── 导出 ───
module.exports = { PromptArchitect };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Prompt Architect v1.0-Peng 测试 ===\n');

  const architect = new PromptArchitect({ maxLength: 990 });

  // 模拟分析结果
  const mockAnalysis = {
    dimension1_physical: {
      age: 26,
      gender: 'female',
      build: 'average',
      faceShape: 'oval',
      specialMarks: [],
      keyFeatures: ['26岁', '女性', 'average']
    },
    dimension2_era: { era: 'contemporary' },
    dimension3_region: { region: null },
    dimension4_profession: {
      profession: 'medical',
      professionCategory: 'medical',
      complianceFlags: ['medical_uniform', 'nameplate_blur']
    },
    dimension5_temperament: {
      primary: 'professional',
      expression: 'smiling',
      gaze: 'warm',
      posture: 'upright'
    },
    dimension6_narrative: { physicalCondition: 'healthy' },
    dimension7_reference: { materials: [] }
  };

  const mockCompliance = {
    overallLevel: 'L2_RESTRICTED',
    l1: [],
    l2: [{ rule: 'medical_nameplate', action: 'BLUR', promptModifier: 'blurred name tag' }],
    l3: [],
    promptModifiers: ['blurred name tag'],
    passed: true
  };

  // 测试1: 完整构建
  console.log('--- Test 1: 陈女士定妆照Prompt ---');
  const result = architect.build(mockAnalysis, mockCompliance, { shotType: 'portrait' });

  console.log(`  Prompt长度: ${result.length}字符`);
  console.log(`  合规等级: ${result.complianceLevel}`);
  console.log(`  在限制内: ${result.report.withinLimit ? '✅' : '⚠️'}`);
  console.log(`  6层长度:`, result.report.layerLengths);
  console.log(`  前200字符:`);
  console.log(`    ${result.prompt.substring(0, 200)}...`);

  // 测试2: 负面提示词
  console.log('\n--- Test 2: 负面提示词 ---');
  console.log(`  长度: ${result.negativeLength}字符`);
  console.log(`  内容: ${result.negativePrompt.substring(0, 150)}...`);

  // 测试3: 快速构建
  console.log('\n--- Test 3: 快速构建 ---');
  const quickResult = architect.buildQuick({
    age: 8,
    gender: 'male',
    build: 'child',
    profession: 'student',
    temperament: 'cheerful'
  });
  console.log(`  快速Prompt: ${quickResult.prompt}`);
  console.log(`  长度: ${quickResult.length}字符`);

  // 测试4: 清单生成
  console.log('\n--- Test 4: 生成清单 ---');
  const checklist = architect.generateChecklist('陈女士', result);
  console.log(checklist.substring(0, 400) + '...');

  console.log('\n=== 全部测试通过 ===');
}