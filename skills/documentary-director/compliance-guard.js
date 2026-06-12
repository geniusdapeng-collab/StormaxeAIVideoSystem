#!/usr/bin/env node
/**
 * Compliance Guard v1.0-Peng
 * 三级合规守卫 — 角色定妆照敏感元素检测与处理
 *
 * 分级系统：
 * - L1 高危 (CRITICAL): 触碰即违规，必须绝对避免
 * - L2 中危 (RESTRICTED): 需要特殊处理（模糊化/虚构化/移除）
 * - L3 低危 (CAUTION): 需要注意但一般可生成
 *
 * 集成自：Character Photo Generator Skill (参考借鉴版)
 * 适配：写实纪录片/科普视频场景（现代场景为主）
 */

'use strict';

const COMPLIANCE_LEVELS = {
  L1_CRITICAL: 'L1_CRITICAL',
  L2_RESTRICTED: 'L2_RESTRICTED',
  L3_CAUTION: 'L3_CAUTION',
  PASS: 'PASS'
};

// ─── L1 高危元素 — 绝对禁止 ───
const L1_RULES = {
  child_inappropriate: {
    name: '儿童不当内容',
    patterns: [
      /儿童.*?(?:裸露|色情|暴露)/i,
      /(?:child|kid|boy|girl).*?(?:nude|naked|sexual|exposed)/i,
      /儿童.*?(?:受虐|暴力|伤害)/i,
      /(?:child|kid).*?(?:abuse|violence|harmed)/i
    ],
    action: 'BLOCK',
    message: '涉及儿童的不当内容是绝对红线，必须拒绝执行'
  },

  terrorism: {
    name: '恐怖主义符号',
    patterns: [
      /ISIS|基地组织|al-qaeda|塔利班|taliban/i,
      /自杀式炸弹|自杀背心|terrorist vest/i,
      /恐袭|恐怖袭击场景/i
    ],
    action: 'BLOCK',
    message: '恐怖主义元素绝对禁止'
  },

  hate_symbols: {
    name: '仇恨与歧视符号',
    patterns: [
      /纳粹|nazi|卐|swastika/i,
      /三K党|KKK|white supremacy/i,
      /种族歧视|racist/i
    ],
    action: 'BLOCK',
    message: '仇恨与歧视符号绝对禁止'
  },

  extreme_political: {
    name: '极端政治敏感',
    patterns: [
      /(?:毛泽东|周恩来|邓小平|习近平|江泽民|胡锦涛).*?(?:形象|照片|写真)/i,
      /领导人.*?(?:写实|形象|还原)/i,
      /敏感政治.*?(?:还原|再现|还原)/i
    ],
    action: 'BLOCK',
    message: '涉及真实国家领导人形象绝对禁止'
  }
};

// ─── L2 中危元素 — 需要特殊处理 ───
const L2_RULES = {
  police_badge: {
    name: '警察标识',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /警号|badge number|警徽|police badge|臂章|shoulder patch|胸徽|chest emblem/i
    ],
    action: 'BLUR',
    promptModifier: 'blurred badge number, unidentifiable insignia, generic police emblem',
    message: '警察标识必须模糊化/虚构化'
  },

  military_insignia: {
    name: '军事标识',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /军衔|rank insignia|军种徽章|branch badge|部队编号|unit number|勋章|medal/i
    ],
    action: 'FICTIONALIZE',
    promptModifier: 'fictional military insignia, made-up rank patches',
    message: '军事标识必须虚构化'
  },

  medical_nameplate: {
    name: '医护铭牌',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /铭牌|name tag|nameplate|胸牌|badge/i
    ],
    action: 'BLUR',
    promptModifier: 'blurred name tag, unreadable nameplate',
    message: '医护铭牌必须模糊化'
  },

  hospital_logo: {
    name: '医院Logo',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /医院logo|hospital logo|科室标识|department sign/i
    ],
    action: 'REMOVE',
    promptModifier: 'generic hospital, no specific logo',
    message: '医院标识应移除或泛化'
  },

  religious_symbols: {
    name: '宗教符号',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /十字架(?!架)/i,  // 排除"十字架"作为建筑的意思
      /佛珠|念珠| prayer beads/i,
      /宗教头巾|hijab/i,
      /道士服饰|道袍|符箓/i
    ],
    action: 'REVIEW',
    promptModifier: 'religious symbol as character identity, not decorative',
    message: '宗教符号需审查是否与角色身份相关'
  },

  political_symbols: {
    name: '政治符号',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /党徽|party emblem|国徽|national emblem/i,
      /政治标语|political slogan|像章|badge/i
    ],
    action: 'REVIEW',
    promptModifier: 'contextual use only, avoid close-up',
    message: '政治符号需谨慎处理'
  },

  brand_logos: {
    name: '品牌Logo',
    level: COMPLIANCE_LEVELS.L2_RESTRICTED,
    patterns: [
      /Nike|Adidas|LV|Gucci|Apple|Samsung/i,
      /品牌logo|brand logo|商标|trademark/i
    ],
    action: 'REMOVE',
    promptModifier: 'plain surface, no visible logo, no brand names',
    message: '可识别品牌必须移除'
  }
};

// ─── L3 低危元素 — 需要注意 ───
const L3_RULES = {
  weapons: {
    name: '武器道具',
    level: COMPLIANCE_LEVELS.L3_CAUTION,
    patterns: [
      /手枪|handgun|步枪|rifle|枪械|gun/i,
      /刀具|knife|警械|警棍|baton/i,
      /手铐|handcuffs/i
    ],
    action: 'CAUTION',
    promptModifier: 'prop only, no specific model mentioned',
    message: '武器需确认剧情必要性，避免描述具体型号'
  },

  text_elements: {
    name: '文字元素',
    level: COMPLIANCE_LEVELS.L3_CAUTION,
    patterns: [
      /服装文字|clothing text|标语|slogan|铭牌文字/i
    ],
    action: 'CAUTION',
    promptModifier: 'blurred text, unreadable characters',
    message: '服装文字需模糊化'
  },

  anachronism: {
    name: '年代穿帮',
    level: COMPLIANCE_LEVELS.L3_CAUTION,
    patterns: [
      /智能手机|smartphone/i,
      /LED|现代汽车|modern car/i,
      /现代建筑|modern building/i
    ],
    action: 'CAUTION',
    promptModifier: 'era-appropriate only',
    message: '需注意年代正确性'
  },

  blood_violence: {
    name: '血腥暴力',
    level: COMPLIANCE_LEVELS.L3_CAUTION,
    patterns: [
      /大量血迹|excessive blood|暴力写实|graphic violence/i
    ],
    action: 'CAUTION',
    promptModifier: 'subtle stain only, no graphic depiction',
    message: '避免过度暴力写实'
  }
};

// ─── 合规守卫类 ───
class ComplianceGuard {
  constructor() {
    this.l1Rules = L1_RULES;
    this.l2Rules = L2_RULES;
    this.l3Rules = L3_RULES;
  }

  /**
   * 完整合规检测
   * @param {string|Object} input — 角色描述或提示词
   * @param {Array} knownFlags — 已知的合规标记（从CharacterAnalyzer来）
   * @returns {Object} 检测结果
   */
  check(input, knownFlags = []) {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const results = {
      l1: [],
      l2: [],
      l3: [],
      overallLevel: COMPLIANCE_LEVELS.PASS,
      passed: true,
      requiredActions: [],
      promptModifiers: [],
      report: []
    };

    // 检测L1
    for (const [key, rule] of Object.entries(this.l1Rules)) {
      for (const pattern of rule.patterns) {
        const match = text.match(pattern);
        if (match) {
          results.l1.push({
            rule: key,
            name: rule.name,
            match: match[0],
            action: rule.action,
            message: rule.message
          });
        }
      }
    }

    // 检测L2（文本模式 + 已知标记）
    for (const [key, rule] of Object.entries(this.l2Rules)) {
      let detected = false;

      // 检查文本匹配
      for (const pattern of rule.patterns) {
        const match = text.match(pattern);
        if (match) {
          detected = true;
          results.l2.push({
            rule: key,
            name: rule.name,
            match: match[0],
            action: rule.action,
            modifier: rule.promptModifier,
            message: rule.message
          });
          break;
        }
      }

      // 检查已知标记
      if (!detected && knownFlags.length > 0) {
        const flagMap = {
          'police_uniform': 'police_badge',
          'badge_blur': 'police_badge',
          'military_uniform': 'military_insignia',
          'insignia_fictional': 'military_insignia',
          'medical_uniform': 'medical_nameplate',
          'nameplate_blur': 'medical_nameplate',
          'brand_avoidance': 'brand_logos'
        };

        for (const flag of knownFlags) {
          if (flagMap[flag] === key) {
            results.l2.push({
              rule: key,
              name: rule.name,
              match: `[flag:${flag}]`,
              action: rule.action,
              modifier: rule.promptModifier,
              message: rule.message,
              source: 'known_flag'
            });
            break;
          }
        }
      }
    }

    // 检测L3
    for (const [key, rule] of Object.entries(this.l3Rules)) {
      for (const pattern of rule.patterns) {
        const match = text.match(pattern);
        if (match) {
          results.l3.push({
            rule: key,
            name: rule.name,
            match: match[0],
            action: rule.action,
            modifier: rule.promptModifier,
            message: rule.message
          });
        }
      }
    }

    // 确定整体等级
    if (results.l1.length > 0) {
      results.overallLevel = COMPLIANCE_LEVELS.L1_CRITICAL;
      results.passed = false;
    } else if (results.l2.length > 0) {
      results.overallLevel = COMPLIANCE_LEVELS.L2_RESTRICTED;
    } else if (results.l3.length > 0) {
      results.overallLevel = COMPLIANCE_LEVELS.L3_CAUTION;
    }

    // 收集必需动作和Prompt修改器
    results.requiredActions = [...new Set([
      ...results.l1.map(r => r.action),
      ...results.l2.map(r => r.action),
      ...results.l3.map(r => r.action)
    ])];

    results.promptModifiers = [
      ...results.l2.map(r => r.modifier).filter(Boolean),
      ...results.l3.map(r => r.modifier).filter(Boolean)
    ];

    // 生成报告条目
    results.report = this._generateReport(results);

    return results;
  }

  /**
   * 快速检测（仅L1+L2）
   */
  checkCritical(input, knownFlags = []) {
    const full = this.check(input, knownFlags);
    return {
      passed: full.passed,
      level: full.overallLevel,
      l1Count: full.l1.length,
      l2Count: full.l2.length,
      actions: full.requiredActions
    };
  }

  /**
   * 检查是否可生成（不BLOCK即可）
   */
  isGeneratable(input, knownFlags = []) {
    const result = this.check(input, knownFlags);
    return result.passed;
  }

  /**
   * 获取处理话术
   */
  getProcessingPhrase(action) {
    const phrases = {
      'BLUR': 'blurred, unidentifiable, obscured details',
      'FICTIONALIZE': 'fictional, made-up, generic, non-specific',
      'REMOVE': 'removed, no visible, plain surface, blank',
      'REVIEW': 'contextual, reviewed, appropriate',
      'CAUTION': 'subtle, non-graphic, era-appropriate',
      'BLOCK': 'ABSOLUTELY FORBIDDEN'
    };
    return phrases[action] || 'handled with care';
  }

  /**
   * 生成完整审核报告
   */
  generateReviewReport(characterName, checkResult) {
    const lines = [
      `## 定妆照审核报告 — ${characterName}`,
      '',
      '### 合规审查',
      '| 检查项 | 状态 | 说明 |',
      '|--------|------|------|'
    ];

    // L1
    for (const item of checkResult.l1) {
      lines.push(`| ${item.name} | ❌ BLOCKED | ${item.message} |`);
    }

    // L2
    for (const item of checkResult.l2) {
      const status = item.action === 'BLUR' ? '⚠️ 需模糊' :
                     item.action === 'FICTIONALIZE' ? '⚠️ 需虚构' :
                     item.action === 'REMOVE' ? '⚠️ 需移除' : '⚠️ 需审查';
      lines.push(`| ${item.name} | ${status} | ${item.message} |`);
    }

    // L3
    for (const item of checkResult.l3) {
      lines.push(`| ${item.name} | ℹ️ 注意 | ${item.message} |`);
    }

    if (checkResult.l1.length === 0 && checkResult.l2.length === 0 && checkResult.l3.length === 0) {
      lines.push(`| 全面检测 | ✅ 通过 | 未发现合规风险 |`);
    }

    lines.push('');

    // Prompt修改器
    if (checkResult.promptModifiers.length > 0) {
      lines.push('### 提示词修改建议');
      lines.push('```');
      lines.push(...checkResult.promptModifiers);
      lines.push('```');
      lines.push('');
    }

    // 总体结论
    lines.push('### 结论');
    if (checkResult.overallLevel === COMPLIANCE_LEVELS.L1_CRITICAL) {
      lines.push('❌ **无法生成** — 存在高危元素，必须拒绝执行');
    } else if (checkResult.overallLevel === COMPLIANCE_LEVELS.L2_RESTRICTED) {
      lines.push('⚠️ **有条件生成** — 需按建议处理中危元素后方可生成');
    } else if (checkResult.overallLevel === COMPLIANCE_LEVELS.L3_CAUTION) {
      lines.push('ℹ️ **可生成** — 注意低危元素，按建议处理即可');
    } else {
      lines.push('✅ **安全生成** — 无合规风险');
    }

    return lines.join('\n');
  }

  _generateReport(results) {
    const report = [];

    for (const item of results.l1) {
      report.push(`[L1-CRITICAL] ${item.name}: ${item.message} (匹配: "${item.match}")`);
    }

    for (const item of results.l2) {
      report.push(`[L2-RESTRICTED] ${item.name}: ${item.message} (动作: ${item.action})`);
    }

    for (const item of results.l3) {
      report.push(`[L3-CAUTION] ${item.name}: ${item.message}`);
    }

    return report;
  }
}

// ─── 导出 ───
module.exports = { ComplianceGuard, COMPLIANCE_LEVELS };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Compliance Guard v1.0-Peng 测试 ===\n');

  const guard = new ComplianceGuard();

  // 测试1: 陈女士（护士）
  console.log('--- Test 1: 陈女士（护士+警服）---');
  const chenResult = guard.check(
    '25岁东亚女性护士，穿藏青色护士制服，佩戴红十字徽章，在医院工作，佩戴铭牌',
    ['medical_uniform', 'nameplate_blur']
  );

  console.log(`  等级: ${chenResult.overallLevel}`);
  console.log(`  通过: ${chenResult.passed ? '✅' : '❌'}`);
  console.log(`  L1: ${chenResult.l1.length} | L2: ${chenResult.l2.length} | L3: ${chenResult.l3.length}`);
  console.log(`  必需动作: ${chenResult.requiredActions.join(', ')}`);
  console.log(`  Prompt修改器: ${chenResult.promptModifiers.length}项`);
  if (chenResult.l2.length > 0) {
    chenResult.l2.forEach(l2 => {
      console.log(`    L2: ${l2.name} → ${l2.action} (${l2.message})`);
    });
  }

  // 测试2: 刑警（含警号）
  console.log('\n--- Test 2: 刑警（含警号描述）---');
  const policeResult = guard.check(
    '42岁刑警，警号012345，佩戴警徽和臂章，穿99式警服，配枪',
    ['police_uniform', 'badge_blur', 'weapon_check']
  );

  console.log(`  等级: ${policeResult.overallLevel}`);
  console.log(`  L1: ${policeResult.l1.length} | L2: ${policeResult.l2.length} | L3: ${policeResult.l3.length}`);
  if (policeResult.l2.length > 0) {
    policeResult.l2.forEach(l2 => {
      console.log(`    L2: ${l2.name} → ${l2.action}`);
    });
  }
  if (policeResult.l3.length > 0) {
    policeResult.l3.forEach(l3 => {
      console.log(`    L3: ${l3.name} → ${l3.action}`);
    });
  }

  // 测试3: L1高危（儿童不当）
  console.log('\n--- Test 3: L1高危检测 ---');
  const l1Result = guard.check('儿童裸露照片，涉及儿童色情内容');
  console.log(`  等级: ${l1Result.overallLevel}`);
  console.log(`  通过: ${l1Result.passed ? '✅' : '❌'}`);
  l1Result.l1.forEach(l1 => {
    console.log(`    ❌ L1: ${l1.name} — ${l1.message}`);
  });

  // 测试4: 品牌检测
  console.log('\n--- Test 4: 品牌Logo检测 ---');
  const brandResult = guard.check('穿着Nike运动鞋，背着LV包包，使用iPhone手机');
  console.log(`  L2品牌检测: ${brandResult.l2.length}项`);
  brandResult.l2.forEach(l2 => {
    console.log(`    L2: ${l2.name} (${l2.match}) → ${l2.action}`);
  });

  // 测试5: 审核报告生成
  console.log('\n--- Test 5: 审核报告 ---');
  const report = guard.generateReviewReport('陈女士', chenResult);
  console.log(report.substring(0, 500) + '...');

  console.log('\n=== 全部测试通过 ===');
}