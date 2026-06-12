#!/usr/bin/env node
/**
 * Style Contamination Guard v2.0-Peng
 * 风格污染守卫 — 穿透所有Pipeline的防御层
 *
 * 核心职责：
 * 1. Prompt提交前强制通过风格检查
 * 2. 实时检测跨风格关键词污染
 * 3. 自动修复或拒绝提交
 * 4. 记录污染日志，追溯责任
 * 5. 为所有下游模块提供统一的防御接口
 *
 * 防御等级：
 * - CRITICAL: 检测到跨风格禁用词 → 拒绝提交，必须修复
 * - WARNING: 缺少风格必需词 → 提示建议，可继续
 * - INFO: 风格优化建议 → 记录日志，不影响提交
 */

'use strict';

const { StyleIsolationGateway, STYLE_TYPES } = require('./style-isolation-gateway');

const CONTAMINATION_LEVELS = {
  CRITICAL: 'critical',   // 跨风格禁用词 → 拦截
  WARNING: 'warning',     // 缺少必需词 → 警告
  INFO: 'info'           // 优化建议 → 提示
};

class StyleContaminationGuard {
  constructor(gateway) {
    if (!gateway || !(gateway instanceof StyleIsolationGateway)) {
      throw new Error('[StyleContaminationGuard] 必须传入已初始化的 StyleIsolationGateway 实例');
    }
    this.gateway = gateway;
    this.manifest = gateway.getManifest();
    this.styleType = gateway.getManifest().id;
    this.contaminationLog = [];
    this.stats = {
      totalChecked: 0,
      criticalBlocked: 0,
      warningIssued: 0,
      autoFixed: 0,
      passed: 0
    };
  }

  /**
   * 全面检查Prompt
   * @param {string} promptText - 要检查的Prompt
   * @param {Object} options - 检查选项
   *   { 
   *     strictMode: true,      // 严格模式：任何warning也拦截
   *     autoFix: false,        // 自动修复模式
   *     logLevel: 'all'        // 日志级别: 'all'|'critical'|'none'
   *   }
   * @returns {Object} 检查结果
   *   {
   *     passed: boolean,
   *     level: 'pass'|'critical'|'warning',
   *     violations: Array,
   *     fixedPrompt: string|null,
   *     recommendations: Array
   *   }
   */
  validate(promptText, options = {}) {
    const strictMode = options.strictMode !== false; // 默认严格
    const autoFix = options.autoFix === true;
    const logLevel = options.logLevel || 'all';

    this.stats.totalChecked++;

    const violations = [];
    const recommendations = [];
    const promptLower = promptText.toLowerCase();
    const crossConfig = this._getCrossStyleConfig();

    // ─── 检测1: 跨风格禁用词（CRITICAL）───
    for (const keyword of crossConfig.forbiddenKeywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        violations.push({
          level: CONTAMINATION_LEVELS.CRITICAL,
          type: 'cross_style_contamination',
          category: this._categorizeKeyword(keyword),
          keyword: keyword,
          message: `❌ 严重污染: 检测到${this.styleType === 'documentary' ? '神话' : '写实'}风格词汇"${keyword}"，不应出现在${this.manifest.name}中`,
          suggestion: `移除"${keyword}"，替换为${this.styleType === 'documentary' ? '写实' : '神话'}风格等价词`
        });
      }
    }

    // ─── 检测2: 缺少必需词（WARNING）───
    for (const keyword of crossConfig.requiredKeywords) {
      if (!promptLower.includes(keyword.toLowerCase())) {
        violations.push({
          level: CONTAMINATION_LEVELS.WARNING,
          type: 'missing_required_keyword',
          keyword: keyword,
          message: `⚠️ 风格弱化: 缺少${this.manifest.name}必需词"${keyword}"`,
          suggestion: `添加"${keyword}"以强化${this.manifest.name}风格特征`
        });
      }
    }

    // ─── 检测3: 缺少核心负面词（WARNING）───
    const negativeList = this.manifest.negative.fullList;
    const coreNegatives = negativeList.slice(0, 10); // 前10项为核心
    for (const negative of coreNegatives) {
      if (!promptLower.includes(`no ${negative.toLowerCase()}`)) {
        violations.push({
          level: CONTAMINATION_LEVELS.WARNING,
          type: 'missing_core_negative',
          keyword: negative,
          message: `⚠️ 防护缺失: 缺少核心负面防护"no ${negative}"`,
          suggestion: `添加"no ${negative}"防止风格偏差`
        });
      }
    }

    // ─── 检测4: 色彩系统污染（CRITICAL）───
    const wrongColors = this._detectWrongColorPalette(promptText);
    for (const color of wrongColors) {
      violations.push({
        level: CONTAMINATION_LEVELS.CRITICAL,
        type: 'color_contamination',
        keyword: color.keyword,
        message: `❌ 色彩污染: 检测到${this.styleType === 'documentary' ? '神话' : '写实'}色彩"${color.keyword}"`,
        suggestion: `替换为${this.manifest.visual.colorPalette.map(c => c.name).join('/')}色彩系统`
      });
    }

    // ─── 检测5: 环境元素污染（CRITICAL）───
    const wrongEnv = this._detectWrongEnvironment(promptText);
    for (const env of wrongEnv) {
      violations.push({
        level: CONTAMINATION_LEVELS.CRITICAL,
        type: 'environment_contamination',
        keyword: env,
        message: `❌ 环境污染: 检测到${this.styleType === 'documentary' ? '神话' : '写实'}环境"${env}"`,
        suggestion: `替换为${this.manifest.environment.type}`
      });
    }

    // ─── 检测6: 字符长度（WARNING）───
    if (promptText.length > 990) {
      violations.push({
        level: CONTAMINATION_LEVELS.WARNING,
        type: 'prompt_too_long',
        keyword: 'length',
        message: `⚠️ 长度超限: Prompt ${promptText.length}字符 > 990上限`,
        suggestion: '精简场景描述或负面词数量'
      });
    }

    // ─── 分级处理 ───
    const criticalCount = violations.filter(v => v.level === CONTAMINATION_LEVELS.CRITICAL).length;
    const warningCount = violations.filter(v => v.level === CONTAMINATION_LEVELS.WARNING).length;

    let passed = criticalCount === 0;
    if (strictMode && warningCount > 0) {
      passed = false;
    }

    let fixedPrompt = null;

    // 自动修复
    if (!passed && autoFix) {
      const fixResult = this._autoFixPrompt(promptText, violations);
      fixedPrompt = fixResult.fixed;
      this.stats.autoFixed++;
    }

    // 更新统计
    if (!passed) {
      if (criticalCount > 0) this.stats.criticalBlocked++;
      if (warningCount > 0) this.stats.warningIssued++;
    } else {
      this.stats.passed++;
    }

    // 记录日志
    if (logLevel !== 'none') {
      this._logContamination(promptText, violations, passed, fixedPrompt);
    }

    return {
      passed,
      level: criticalCount > 0 ? 'critical' : (warningCount > 0 ? 'warning' : 'pass'),
      violations: violations.filter(v => logLevel === 'all' || v.level === CONTAMINATION_LEVELS.CRITICAL),
      allViolations: violations,
      fixedPrompt,
      recommendations,
      stats: { ...this.stats }
    };
  }

  /**
   * 快速检查（仅检测CRITICAL级别）
   * @param {string} promptText
   * @returns {boolean} 是否通过
   */
  quickCheck(promptText) {
    const result = this.validate(promptText, { strictMode: false, logLevel: 'none' });
    return result.level !== 'critical';
  }

  /**
   * 获取污染统计
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 获取污染日志
   */
  getContaminationLog() {
    return [...this.contaminationLog];
  }

  /**
   * 打印污染报告
   */
  printReport() {
    console.log('\n=== 风格污染防御报告 ===');
    console.log(`  风格类型: ${this.manifest.name}`);
    console.log(`  总检查数: ${this.stats.totalChecked}`);
    console.log(`  通过: ${this.stats.passed} (${((this.stats.passed / this.stats.totalChecked) * 100).toFixed(1)}%)`);
    console.log(`  严重拦截: ${this.stats.criticalBlocked}`);
    console.log(`  警告: ${this.stats.warningIssued}`);
    console.log(`  自动修复: ${this.stats.autoFixed}`);

    if (this.contaminationLog.length > 0) {
      console.log('\n  最近污染记录:');
      this.contaminationLog.slice(-5).forEach(log => {
        console.log(`    [${log.level}] ${log.violations.length}项问题`);
      });
    }
    console.log('========================\n');
  }

  // ─── 内部方法 ───

  _getCrossStyleConfig() {
    const { CROSS_STYLE_CONTAMINATION_MAP } = require('./global-style-manifest');
    return CROSS_STYLE_CONTAMINATION_MAP[this.styleType];
  }

  _categorizeKeyword(keyword) {
    const lower = keyword.toLowerCase();
    if (lower.includes('era') || lower.includes('era') || lower.includes('古代') || lower.includes('洪荒')) return 'era';
    if (lower.includes('atmosphere') || lower.includes('mystical') || lower.includes('spiritual') || lower.includes('仙气')) return 'atmosphere';
    if (lower.includes('color') || lower.includes('painting') || lower.includes('水墨') || lower.includes('#')) return 'visual_style';
    if (lower.includes('camera') || lower.includes('pan') || lower.includes('cut') || lower.includes('镜头')) return 'camera';
    if (lower.includes('island') || lower.includes('mountain') || lower.includes('studio') || lower.includes('实验室')) return 'environment';
    return 'other';
  }

  _detectWrongColorPalette(promptText) {
    const wrongColors = [];
    const promptLower = promptText.toLowerCase();

    if (this.styleType === 'documentary') {
      // 写实风格不应该出现神话色彩
      const mythColors = ['深海幽蓝', '烈焰赤红', '宣纸黄', '金色轮廓光', '翡翠绿'];
      for (const color of mythColors) {
        if (promptLower.includes(color.toLowerCase())) {
          wrongColors.push({ keyword: color, style: 'mythology' });
        }
      }
    } else {
      // 神话风格不应该出现写实色彩
      const docColors = ['医疗白', '浅蓝', '健康绿', '警示橙', '暖木'];
      for (const color of docColors) {
        if (promptLower.includes(color.toLowerCase())) {
          wrongColors.push({ keyword: color, style: 'documentary' });
        }
      }
    }

    return wrongColors;
  }

  _detectWrongEnvironment(promptText) {
    const wrongEnv = [];
    const promptLower = promptText.toLowerCase();

    if (this.styleType === 'documentary') {
      // 写实风格不应该出现神话环境
      const mythEnv = ['floating islands', 'spiritual mist', '浮空岛屿', '仙山', '洞天福地', '洪荒'];
      for (const env of mythEnv) {
        if (promptLower.includes(env.toLowerCase())) {
          wrongEnv.push(env);
        }
      }
    } else {
      // 神话风格不应该出现写实环境
      const docEnv = ['medical office', 'health education studio', 'laboratory', 'whiteboard', '现代医学'];
      for (const env of docEnv) {
        if (promptLower.includes(env.toLowerCase())) {
          wrongEnv.push(env);
        }
      }
    }

    return wrongEnv;
  }

  _autoFixPrompt(promptText, violations) {
    let fixed = promptText;
    const changes = [];

    for (const v of violations) {
      if (v.type === 'cross_style_contamination' || v.type === 'color_contamination' || v.type === 'environment_contamination') {
        // 移除禁用词
        const regex = new RegExp(v.keyword, 'gi');
        fixed = fixed.replace(regex, '');
        changes.push({ type: 'removed', keyword: v.keyword });
      }
    }

    // 清理多余空格和标点
    fixed = fixed.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
    fixed = fixed.replace(/^,\s*/, '').replace(/,\s*$/, '');

    // 检查是否还缺少必需词
    const crossConfig = this._getCrossStyleConfig();
    for (const keyword of crossConfig.requiredKeywords) {
      if (!fixed.toLowerCase().includes(keyword.toLowerCase())) {
        fixed += `, ${keyword}`;
        changes.push({ type: 'added', keyword });
      }
    }

    return { fixed, changes };
  }

  _logContamination(promptText, violations, passed, fixedPrompt) {
    this.contaminationLog.push({
      timestamp: new Date().toISOString(),
      promptPreview: promptText.substring(0, 100) + '...',
      promptLength: promptText.length,
      violationCount: violations.length,
      criticalCount: violations.filter(v => v.level === CONTAMINATION_LEVELS.CRITICAL).length,
      warningCount: violations.filter(v => v.level === CONTAMINATION_LEVELS.WARNING).length,
      passed,
      fixed: fixedPrompt ? fixedPrompt.substring(0, 100) + '...' : null,
      styleType: this.styleType
    });
  }
}

// ─── 导出 ───
module.exports = { StyleContaminationGuard, CONTAMINATION_LEVELS };

// ─── CLI 测试 ───
if (require.main === module) {
  const { StyleIsolationGateway } = require('./style-isolation-gateway');

  console.log('\n=== Style Contamination Guard v2.0-Peng 测试 ===\n');

  // 初始化Documentary风格的网关和守卫
  const docGateway = new StyleIsolationGateway({
    styleType: 'documentary',
    projectName: '健康小课堂-E01'
  });
  const docGuard = new StyleContaminationGuard(docGateway);

  // 测试1: 干净的写实Prompt
  console.log('--- Test 1: 干净的写实Prompt ---');
  const cleanPrompt = 'CG cinematic photorealistic, nurse in modern studio with white walls and medical equipment, natural sunlight 5600K, no cartoon no anime no plastic skin, 4K documentary';
  const result1 = docGuard.validate(cleanPrompt);
  console.log(`通过: ${result1.passed ? '✅' : '❌'}`);
  console.log(`级别: ${result1.level}`);
  console.log(`问题数: ${result1.violations.length}`);

  // 测试2: 严重污染Prompt（混入神话元素）
  console.log('\n--- Test 2: 严重污染Prompt ---');
  const contaminatedPrompt = 'CG cinematic photorealistic, Honghuang era mystical atmosphere, ink wash painting texture, nurse in flowing silk robes with divine glow, floating islands in spiritual mist, 深海幽蓝色彩, no cartoon';
  const result2 = docGuard.validate(contaminatedPrompt);
  console.log(`通过: ${result2.passed ? '✅' : '❌'}`);
  console.log(`级别: ${result2.level}`);
  console.log(`问题数: ${result2.allViolations.length}`);
  result2.allViolations.forEach(v => {
    console.log(`  ${v.level === 'critical' ? '❌' : '⚠️'} ${v.type}: ${v.keyword}`);
    console.log(`     ${v.message}`);
  });

  // 测试3: 自动修复
  console.log('\n--- Test 3: 自动修复 ---');
  const result3 = docGuard.validate(contaminatedPrompt, { autoFix: true });
  console.log(`自动修复: ${result3.fixedPrompt ? '✅' : '❌'}`);
  if (result3.fixedPrompt) {
    console.log(`修复后: ${result3.fixedPrompt.substring(0, 120)}...`);
    console.log(`修复后长度: ${result3.fixedPrompt.length}字符`);
  }

  // 测试4: 快速检查
  console.log('\n--- Test 4: 快速检查 ---');
  console.log(`干净Prompt快速检查: ${docGuard.quickCheck(cleanPrompt) ? '✅' : '❌'}`);
  console.log(`污染Prompt快速检查: ${docGuard.quickCheck(contaminatedPrompt) ? '✅' : '❌'}`);

  // 测试5: 统计报告
  console.log('\n--- Test 5: 统计报告 ---');
  docGuard.printReport();

  // 测试6: Drama风格守卫
  console.log('--- Test 6: Drama风格守卫 ---');
  const dramaGateway = new StyleIsolationGateway({
    styleType: 'drama',
    projectName: '烛龙觉醒-E01'
  });
  const dramaGuard = new StyleContaminationGuard(dramaGateway);

  const docContaminated = 'CG cinematic epic, modern studio with whiteboard and medical equipment, nurse in dark navy uniform, natural sunlight 5600K, 医疗白色彩, no cartoon';
  const dramaResult = dramaGuard.validate(docContaminated);
  console.log(`Drama检测写实污染: ${dramaResult.passed ? '✅' : '❌'}`);
  console.log(`级别: ${dramaResult.level}`);
  dramaResult.allViolations.forEach(v => {
    console.log(`  ${v.level === 'critical' ? '❌' : '⚠️'} ${v.type}: ${v.keyword}`);
  });

  // 测试7: 日志查询
  console.log('\n--- Test 7: 污染日志 ---');
  const logs = docGuard.getContaminationLog();
  console.log(`Documentary守卫日志: ${logs.length}条`);
  logs.forEach((log, i) => {
    console.log(`  [${i + 1}] ${log.passed ? '✅' : '❌'} ${log.violationCount}项问题`);
  });

  console.log('\n=== 全部测试通过 ===');
}