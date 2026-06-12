#!/usr/bin/env node
/**
 * Prompt维度质检引擎 v1.0-Peng
 * 反向检查：从最终prompt反推Pipeline模块是否真正生效
 * 
 * 核心理念：
 * 1. 定义理想prompt应包含的12个维度
 * 2. 对每个最终prompt做逆向分析
 * 3. 检查每个Pipeline阶段的产出是否真正传递到了prompt
 * 4. 缺失维度 → 自动反馈 → 触发对应阶段重跑
 */

const path = require('path');

// ===== 理想Prompt 12维度定义 =====
const PROMPT_DIMENSIONS = {
  // 维度1: 主体描述 — 角色+动作+场景
  SUBJECT_DESCRIPTION: {
    id: 'subject_description',
    name: '主体描述',
    sourceStages: ['stage2_StoryPlanning', 'stage5_ShotDesign'],
    check: (prompt) => prompt.length > 50, // 至少50字符的主体描述
    required: true,
    weight: 1.0,
    severity: 'critical', // critical/warning/info
  },
  
  // 维度2: 角色定妆照引用 — refs
  CHARACTER_REFS: {
    id: 'character_refs',
    name: '角色定妆照引用',
    sourceStages: ['stage4_CharacterRefs'],
    check: (prompt) => prompt.includes('参考') || prompt.includes('ref') || prompt.includes('character'),
    required: true,
    weight: 0.9,
    severity: 'critical',
  },
  
  // 维度3: 运镜控制 — cinematic shot
  CAMERA_CONTROL: {
    id: 'camera_control',
    name: '运镜控制',
    sourceStages: ['stage5_ShotDesign', 'stage8_Cinematography'],
    check: (prompt) => {
      const hasCinematic = prompt.includes('cinematic shot:') || prompt.includes('cinematic movement');
      const hasCameraMove = /(dolly|pan|track|crane|zoom|orbit|push|pull|plunge|spiral|POV)/i.test(prompt);
      return hasCinematic || hasCameraMove;
    },
    required: true,
    weight: 0.85,
    severity: 'critical',
  },
  
  // 维度4: 视觉风格
  VISUAL_STYLE: {
    id: 'visual_style',
    name: '视觉风格',
    sourceStages: ['stage0_Worldview', 'stage7_VisualStyle'],
    check: (prompt) => {
      const styleKeywords = ['写实', 'CG', '国漫', '3D', '动画', '皮克斯', '超写实', 'cinematic', 'hyperrealistic', 'anime', 'pixar'];
      return styleKeywords.some(kw => prompt.includes(kw));
    },
    required: true,
    weight: 0.8,
    severity: 'warning',
  },
  
  // 维度5: 光影设置
  LIGHTING: {
    id: 'lighting',
    name: '光影设置',
    sourceStages: ['stage7_VisualStyle'],
    check: (prompt) => {
      const lightKeywords = ['光', 'light', 'shadow', 'glow', 'backlight', 'rim light', 'soft light', 'golden hour', 'sunlight', 'moonlight'];
      return lightKeywords.some(kw => prompt.includes(kw));
    },
    required: true,
    weight: 0.7,
    severity: 'warning',
  },
  
  // 维度6: 情绪/氛围
  EMOTION: {
    id: 'emotion',
    name: '情绪氛围',
    sourceStages: ['stage1_Script', 'stage2_StoryPlanning'],
    check: (prompt) => {
      // v1.1-Peng-fix: 更智能的情绪检测 — 检测画面描述中的情绪线索
      const emotionKeywords = ['温暖', '紧张', '恐惧', '欢乐', '悲伤', '神秘', 'wonder', 'awe', 'mysterious', 'warm', 'tense', 'joyful', '震惊', '敬畏', '好奇', '压迫', '震撼', '狂暴', '愤怒', '感动', '敬畏', '敬畏与感动', '情绪', '表情', 'emotional', 'atmosphere'];
      const emotionActions = ['后退', '逃跑', '防御', '仰望', '挥舞', '举起', '停止', '旋转'];
      const hasEmotionWord = emotionKeywords.some(kw => prompt.includes(kw));
      const hasEmotionAction = emotionActions.some(kw => prompt.includes(kw));
      // 也检测通过画面描述隐式传递的情绪（如"小G仰望"暗示敬畏）
      return hasEmotionWord || hasEmotionAction || prompt.includes('表情') || prompt.includes('情绪');
    },
    required: false,
    weight: 0.6,
    severity: 'info',
  },
  
  // 维度7: 场景语法（Nirath专属）
  SCENE_GRAMMAR: {
    id: 'scene_grammar',
    name: '场景专属运镜',
    sourceStages: ['stage8_Cinematography'],
    check: (prompt) => prompt.includes('SCENE-SPECIFIC') || prompt.includes('SCENE-ENRICHED'),
    required: false,
    weight: 0.5,
    severity: 'info',
  },
  
  // 维度8: 承接叙事
  CONTINUITY: {
    id: 'continuity',
    name: '承接叙事',
    sourceStages: ['stage6_ShotPlanning'],
    check: (prompt) => {
      const continuityKeywords = ['延续', '衔接', '承接', '连贯', 'continues', 'following', 'then'];
      return continuityKeywords.some(kw => prompt.includes(kw));
    },
    required: false,
    weight: 0.4,
    severity: 'info',
  },
  
  // 维度9: 对白增强
  DIALOGUE: {
    id: 'dialogue',
    name: '对白增强',
    sourceStages: ['stage1_Script'],
    check: (prompt) => prompt.includes('对白') || prompt.includes('dialogue') || prompt.includes('says') || prompt.includes('speaks'),
    required: false,
    weight: 0.3,
    severity: 'info',
  },
  
  // 维度10: 负面防护词
  NEGATIVE_PROMPT: {
    id: 'negative_prompt',
    name: '负面防护词',
    sourceStages: ['stage0_Worldview', 'stage7_VisualStyle'],
    check: (prompt) => {
      // v1.1-Peng-fix: 大小写不敏感匹配 — Prompt中使用大写"NO anime"
      const promptLower = prompt.toLowerCase();
      return promptLower.includes('no ') || promptLower.includes('不要') || promptLower.includes('避免') || promptLower.includes('avoid') || promptLower.includes('禁止');
    },
    required: false,
    weight: 0.3,
    severity: 'warning',
  },
  
  // 维度11: 宽高比/分辨率
  ASPECT_RATIO: {
    id: 'aspect_ratio',
    name: '宽高比参数',
    sourceStages: ['stage0_Worldview', 'stage9_Render'],
    check: (prompt) => prompt.includes('16:9') || prompt.includes('9:16') || prompt.includes('1080p') || prompt.includes('4K') || prompt.includes('720p'),
    required: false,
    weight: 0.2,
    severity: 'warning',
  },
  
  // 维度12: 风格签名
  STYLE_SIGNATURE: {
    id: 'style_signature',
    name: '风格签名',
    sourceStages: ['stage7_VisualStyle'],
    check: (prompt) => {
      // v1.1-Peng-fix: 增加cinematic/hyperrealistic等实际使用的风格词
      const styleKeywords = ['风格', 'style', 'signature', 'cinematic', 'hyperrealistic', '写实', 'CG', '超写实'];
      return styleKeywords.some(kw => prompt.includes(kw));
    },
    required: false,
    weight: 0.2,
    severity: 'info',
  },
};

// ===== 阶段产出映射 =====
const STAGE_OUTPUT_MAP = {
  stage0_Worldview: ['worldview', 'styleProfile', 'styleManifesto'],
  stage1_Script: ['script', 'dialogues', 'emotions'],
  stage2_StoryPlanning: ['storyPlan', 'segments', 'shots'],
  stage3_CharacterDesign: ['characters', 'species', 'features', 'signatures'],
  stage4_CharacterRefs: ['characterReferences', 'refs', 'characterImages'],
  stage5_ShotDesign: ['shotDescriptions', 'cameraMoves', 'shotTypes'],
  stage6_ShotPlanning: ['shotPlan', 'continuity', 'transitions'],
  stage7_VisualStyle: ['styleSignature', 'lightingThreeLayer', 'negativePrompt'],
  stage8_Cinematography: ['cameraMoves', 'sceneGrammar', 'enhancedMoves'],
  stage9_Render: ['prompts', 'finalPrompts'],
};

// ===== 质检引擎类 =====
class PromptQualityEngine {
  constructor() {
    this.issues = [];
    this.score = 0;
    this.dimensions = {};
  }
  
  /**
   * 对单个最终prompt进行12维度质检
   */
  inspectPrompt(prompt, shotId, metadata = {}) {
    const result = {
      shotId,
      promptLength: prompt.length,
      dimensions: {},
      missing: [],
      present: [],
      score: 0,
      maxScore: 0,
      pass: false,
    };
    
    for (const [key, dim] of Object.entries(PROMPT_DIMENSIONS)) {
      const detected = dim.check(prompt);
      result.dimensions[dim.id] = {
        name: dim.name,
        present: detected,
        required: dim.required,
        weight: dim.weight,
        severity: dim.severity,
        sourceStages: dim.sourceStages,
      };
      
      result.maxScore += dim.weight;
      
      if (detected) {
        result.score += dim.weight;
        result.present.push(dim.name);
      } else {
        result.missing.push({
          name: dim.name,
          required: dim.required,
          severity: dim.severity,
          sourceStages: dim.sourceStages,
        });
      }
    }
    
    // 计算通过率
    const criticalMissing = result.missing.filter(m => m.required && m.severity === 'critical');
    result.pass = criticalMissing.length === 0 && result.score >= result.maxScore * 0.6;
    result.quality = (result.score / result.maxScore * 100).toFixed(1);
    
    return result;
  }
  
  /**
   * 对一批prompts批量质检
   */
  inspectBatch(prompts, storyPlan) {
    const results = [];
    let totalPass = 0;
    let totalCriticalMissing = 0;
    
    for (const { shotId, prompt } of prompts) {
      const result = this.inspectPrompt(prompt, shotId, { storyPlan });
      results.push(result);
      if (result.pass) totalPass++;
      totalCriticalMissing += result.missing.filter(m => m.required && m.severity === 'critical').length;
    }
    
    // 生成汇总报告
    const report = {
      totalShots: prompts.length,
      passedShots: totalPass,
      passRate: ((totalPass / prompts.length) * 100).toFixed(1),
      averageQuality: (results.reduce((sum, r) => sum + parseFloat(r.quality), 0) / results.length).toFixed(1),
      totalCriticalMissing,
      dimensionCoverage: this._calculateDimensionCoverage(results),
      stageEffectiveness: this._calculateStageEffectiveness(results),
      results,
    };
    
    return report;
  }
  
  /**
   * 计算维度覆盖率（哪些维度在所有shot中都存在）
   */
  _calculateDimensionCoverage(results) {
    const coverage = {};
    
    for (const dimKey of Object.keys(PROMPT_DIMENSIONS)) {
      const dimId = PROMPT_DIMENSIONS[dimKey].id;
      const presentCount = results.filter(r => r.dimensions[dimId]?.present).length;
      coverage[dimId] = {
        name: PROMPT_DIMENSIONS[dimKey].name,
        coverage: ((presentCount / results.length) * 100).toFixed(1),
        presentCount,
        totalCount: results.length,
      };
    }
    
    return coverage;
  }
  
  /**
   * 计算各阶段有效性（哪些阶段的产出真正传递到了prompt）
   */
  _calculateStageEffectiveness(results) {
    const stageStats = {};
    
    for (const [stageName, outputs] of Object.entries(STAGE_OUTPUT_MAP)) {
      // 找出这个阶段的产出对应的维度
      const relatedDims = Object.values(PROMPT_DIMENSIONS).filter(
        dim => dim.sourceStages.includes(stageName)
      );
      
      if (relatedDims.length === 0) continue;
      
      let totalPresent = 0;
      let totalPossible = 0;
      
      for (const result of results) {
        for (const dim of relatedDims) {
          totalPossible++;
          if (result.dimensions[dim.id]?.present) {
            totalPresent++;
          }
        }
      }
      
      stageStats[stageName] = {
        effectiveness: ((totalPresent / totalPossible) * 100).toFixed(1),
        presentCount: totalPresent,
        totalCount: totalPossible,
        relatedDimensions: relatedDims.map(d => d.name),
      };
    }
    
    return stageStats;
  }
  
  /**
   * 生成修复建议
   */
  generateFixPlan(report) {
    const fixes = [];
    
    // 检查哪些阶段有效性低
    for (const [stageName, stats] of Object.entries(report.stageEffectiveness)) {
      const effectiveness = parseFloat(stats.effectiveness);
      
      if (effectiveness < 50) {
        fixes.push({
          stage: stageName,
          priority: 'high',
          problem: `${stageName} 有效性仅 ${stats.effectiveness}% — 产出未传递到最终prompt`,
          action: `检查 ${stageName} → 输出字段名 → prompt组装链路`,
          relatedDimensions: stats.relatedDimensions,
        });
      } else if (effectiveness < 80) {
        fixes.push({
          stage: stageName,
          priority: 'medium',
          problem: `${stageName} 有效性 ${stats.effectiveness}% — 部分产出未传递`,
          action: `检查 ${stageName} 的字段映射，确保所有产出都写入shot对象`,
          relatedDimensions: stats.relatedDimensions,
        });
      }
    }
    
    // 检查关键缺失维度
    for (const [dimId, coverage] of Object.entries(report.dimensionCoverage)) {
      if (parseFloat(coverage.coverage) < 50) {
        const dim = Object.values(PROMPT_DIMENSIONS).find(d => d.id === dimId);
        if (dim && dim.required) {
          fixes.push({
            stage: dim.sourceStages.join(', '),
            priority: 'critical',
            problem: `${dim.name} 覆盖率仅 ${coverage.coverage}% — 关键维度大面积缺失`,
            action: `修复 ${dim.sourceStages[0]} → generateShotPrompt 的字段传递`,
            relatedDimensions: [dim.name],
          });
        }
      }
    }
    
    return fixes.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  /**
   * 生成人类可读的质检报告
   */
  formatReport(report) {
    const lines = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║           Prompt维度质检报告 v1.0-Peng                      ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      `📊 总体评分: ${report.averageQuality}/100`,
      `✅ 通过镜头: ${report.passedShots}/${report.totalShots} (${report.passRate}%)`,
      `🔴 关键缺失: ${report.totalCriticalMissing} 项`,
      '',
      '【阶段有效性 — 哪些模块真正生效】',
    ];
    
    for (const [stageName, stats] of Object.entries(report.stageEffectiveness)) {
      const eff = parseFloat(stats.effectiveness);
      const icon = eff >= 80 ? '✅' : eff >= 50 ? '⚠️' : '❌';
      lines.push(`  ${icon} ${stageName}: ${stats.effectiveness}% (${stats.presentCount}/${stats.totalCount})`);
      lines.push(`     相关维度: ${stats.relatedDimensions.join(', ')}`);
    }
    
    lines.push('');
    lines.push('【维度覆盖率 — 哪些维度在所有shot中都存在】');
    
    for (const [dimId, coverage] of Object.entries(report.dimensionCoverage)) {
      const cov = parseFloat(coverage.coverage);
      const icon = cov >= 80 ? '✅' : cov >= 50 ? '⚠️' : '❌';
      lines.push(`  ${icon} ${coverage.name}: ${coverage.coverage}% (${coverage.presentCount}/${coverage.totalCount})`);
    }
    
    // 修复建议
    const fixes = this.generateFixPlan(report);
    if (fixes.length > 0) {
      lines.push('');
      lines.push('【🛠️ 修复建议】');
      
      for (const fix of fixes) {
        const icon = fix.priority === 'critical' ? '🔴' : fix.priority === 'high' ? '🟠' : '🟡';
        lines.push(`  ${icon} [${fix.priority.toUpperCase()}] ${fix.stage}`);
        lines.push(`     问题: ${fix.problem}`);
        lines.push(`     修复: ${fix.action}`);
      }
    }
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  }
}

// ===== 集成到Pipeline的质检检查点 =====
class PipelineQualityGate {
  constructor() {
    this.engine = new PromptQualityEngine();
    this.history = [];
  }
  
  /**
   * Stage 9之后执行的质检检查点
   */
  async inspectBeforeRender(shotsData, storyPlan) {
    console.log('\n🔍 质检检查点: 对最终Prompt进行12维度反向检查...');
    
    const prompts = shotsData.map(d => ({
      shotId: d.shot.id,
      prompt: d.prompt,
    }));
    
    const report = this.engine.inspectBatch(prompts, storyPlan);
    
    // 打印报告
    console.log(this.engine.formatReport(report));
    
    // 保存到历史
    this.history.push({
      timestamp: new Date().toISOString(),
      report,
    });
    
    // 检查是否通过
    const passRate = parseFloat(report.passRate);
    const criticalMissing = report.totalCriticalMissing;
    
    if (passRate < 80 || criticalMissing > 0) {
      console.log(`\n⚠️ 质检未通过！需要修复 ${criticalMissing} 个关键缺失。`);
      
      // 生成修复计划
      const fixes = this.engine.generateFixPlan(report);
      
      // 如果有关键问题，抛出Error阻止渲染
      const criticalFixes = fixes.filter(f => f.priority === 'critical');
      if (criticalFixes.length > 0) {
        const errorMsg = `❌ Prompt质检未通过！关键问题:\n${criticalFixes.map(f => `  - ${f.problem}`).join('\n')}\n\n必须修复后才能提交渲染。修复建议:\n${fixes.map(f => `  [${f.priority}] ${f.action}`).join('\n')}`;
        
        console.error(errorMsg);
        
        // 将质检报告写入文件供分析
        const fs = require('fs');
        const reportPath = path.join(process.cwd(), 'quality-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
          report,
          fixes,
          timestamp: new Date().toISOString(),
        }, null, 2));
        console.log(`  质检报告已保存: ${reportPath}`);
        
        throw new Error(errorMsg);
      }
    }
    
    console.log(`\n✅ 质检通过！平均质量 ${report.averageQuality}/100`);
    return report;
  }
  
  /**
   * 获取历史质检记录
   */
  getHistory() {
    return this.history;
  }
}

// ===== 导出 =====
module.exports = {
  PromptQualityEngine,
  PipelineQualityGate,
  PROMPT_DIMENSIONS,
  STAGE_OUTPUT_MAP,
};

// 如果直接运行，执行测试
if (require.main === module) {
  console.log('Prompt维度质检引擎 v1.0-Peng — 自检模式');
  
  const engine = new PromptQualityEngine();
  
  // 测试用例
  const testPrompts = [
    {
      shotId: 'S01',
      prompt: '青丘灵原银色湖泊全景，小G和暖暖在湖边，cinematic shot: atmospheric_push_pull — 大气透视纵深推拉. 利用Nirath大气透视做纵深推拉，人物从远景蓝紫雾气中走向镜头 (8-15秒, wide angle 16mm, mood: awe)，超写实CG渲染风格，自然光光影，温暖氛围，参考角色图片',
    },
    {
      shotId: 'S02',
      prompt: '小G从蓝绿色高草中走来', // 极简prompt，缺少大部分维度
    },
  ];
  
  console.log('\n测试1: 完整prompt');
  const r1 = engine.inspectPrompt(testPrompts[0].prompt, testPrompts[0].shotId);
  console.log(`  评分: ${r1.quality}/100`);
  console.log(`  通过: ${r1.pass ? '✅' : '❌'}`);
  console.log(`  缺失维度: ${r1.missing.map(m => m.name).join(', ') || '无'}`);
  
  console.log('\n测试2: 极简prompt');
  const r2 = engine.inspectPrompt(testPrompts[1].prompt, testPrompts[1].shotId);
  console.log(`  评分: ${r2.quality}/100`);
  console.log(`  通过: ${r2.pass ? '✅' : '❌'}`);
  console.log(`  缺失维度: ${r2.missing.map(m => `${m.name}(${m.severity})`).join(', ')}`);
  
  console.log('\n测试3: 批量质检');
  const batch = engine.inspectBatch(testPrompts, {});
  console.log(engine.formatReport(batch));
}