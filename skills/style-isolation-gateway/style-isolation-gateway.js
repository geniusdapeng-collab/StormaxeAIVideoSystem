#!/usr/bin/env node
/**
 * Style Isolation Gateway v2.0-Peng
 * 风格隔离网关 — 系统唯一入口
 *
 * 核心职责：
 * 1. 项目初始化时强制指定 styleType（documentary | drama）
 * 2. 加载对应风格的 Global Style Manifest
 * 3. 为所有下游模块提供统一的风格配置读取接口
 * 4. 防止风格中途切换，防止风格交叉污染
 * 5. 记录风格决策日志
 *
 * 使用方式：
 * const gateway = new StyleIsolationGateway({ styleType: 'documentary', projectName: '...' });
 * gateway.getManifest(); // 获取完整风格宪法
 * gateway.getVisual('lighting'); // 获取光影配置
 * gateway.getNegativeList(); // 获取负面词列表
 * gateway.validatePrompt(promptText); // 验证Prompt是否有风格污染
 */

'use strict';

const { getManifest, STYLE_TYPES, CROSS_STYLE_CONTAMINATION_MAP } = require('./global-style-manifest');

class StyleIsolationGateway {
  constructor(config = {}) {
    this.styleType = config.styleType;
    this.projectName = config.projectName || 'unnamed-project';
    this.category = config.category || '';
    this._manifest = null;
    this._initialized = false;
    this._decisionLog = [];
    this._frozen = false; // 一旦初始化，配置冻结，不可更改

    if (this.styleType) {
      this._initialize();
    }
  }

  /**
   * 初始化风格系统
   * 一旦调用，配置冻结，不可中途切换风格
   */
  _initialize() {
    if (!Object.values(STYLE_TYPES).includes(this.styleType)) {
      throw new Error(
        `[StyleIsolationGateway] 无效的风格类型: "${this.styleType}". ` +
        `可用类型: ${Object.values(STYLE_TYPES).join(', ')}. ` +
        `请在项目配置中明确指定 styleType。`
      );
    }

    this._manifest = getManifest(this.styleType);
    this._initialized = true;
    this._frozen = true;

    this._logDecision('INIT', `项目 "${this.projectName}" 初始化风格: ${this._manifest.name} (${this.styleType})`);
    this._logDecision('CATEGORY', `项目类别: ${this.category || '未指定'}`);
    this._logDecision('MANIFEST', `加载风格宪法: ${this._manifest.id}`);
    this._logDecision('NEGATIVES', `负面词库: ${this._manifest.negative.fullList.length}项`);
    this._logDecision('ENV_FORBIDDEN', `禁用环境元素: ${this._manifest.environment.forbidden.length}项`);

    console.log(`[StyleIsolationGateway] ✅ 项目 "${this.projectName}" 已锁定风格: ${this._manifest.name}`);
    console.log(`[StyleIsolationGateway] ⚠️  风格已冻结，不可中途切换！`);
  }

  /**
   * 自动检测风格类型（根据项目类别）
   * 用于用户未显式指定 styleType 时的智能判断
   */
  static autoDetectStyleType(category) {
    const cat = (category || '').toLowerCase();

    // 写实纪录片类
    const documentaryKeywords = [
      'health', 'education', 'documentary', 'commercial', 'product',
      'promotion', 'introduction', 'science', 'medical', '科普',
      '宣传片', '产品介绍', '教育', '健康', '医疗', '纪录片',
      '营销', '广告', '商业'
    ];

    // 山海经神话类
    const dramaKeywords = [
      'drama', 'mythology', 'fantasy', 'shanhaijing', 'story',
      'epic', 'narrative', '神话', '山海经', '剧情', '史诗',
      '玄幻', '洪荒', '志怪', '传说'
    ];

    for (const kw of documentaryKeywords) {
      if (cat.includes(kw)) return STYLE_TYPES.DOCUMENTARY;
    }

    for (const kw of dramaKeywords) {
      if (cat.includes(kw)) return STYLE_TYPES.DRAMA;
    }

    // 默认使用documentary（安全默认）
    console.log(`[StyleIsolationGateway] ⚠️ 无法从类别 "${cat}" 自动检测风格，默认使用 documentary`);
    return STYLE_TYPES.DOCUMENTARY;
  }

  /**
   * 获取完整风格宪法
   */
  getManifest() {
    this._ensureInitialized();
    return this._manifest;
  }

  /**
   * 获取指定维度的风格配置
   * @param {string} path - 如 'visual.lighting', 'negative.fullList', 'character.human'
   */
  get(path) {
    this._ensureInitialized();
    const keys = path.split('.');
    let value = this._manifest;
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        throw new Error(`[StyleIsolationGateway] 路径 "${path}" 在风格 "${this.styleType}" 中不存在`);
      }
    }
    return value;
  }

  /**
   * 快捷获取方法
   */
  getVisual(dimension) { return this.get(`visual.${dimension}`); }
  getColorPalette() { return this.get('visual.colorPalette'); }
  getLighting() { return this.get('visual.lighting'); }
  getCameraStyle() { return this.get('visual.camera'); }
  getAtmosphere() { return this.get('visual.atmosphere'); }
  getNegativeList() { return this.get('negative.fullList'); }
  getEnvironmentType() { return this.get('environment.type'); }
  getEnvironmentElements() { return this.get('environment.elements'); }
  getForbiddenEnvironmentElements() { return this.get('environment.forbidden'); }
  getPostProductionConfig() { return this.get('postProduction'); }

  /**
   * 获取角色规范
   * @param {string} type - 'human' | 'creature'
   */
  getCharacterSpec(type) {
    this._ensureInitialized();
    if (this.styleType === STYLE_TYPES.DOCUMENTARY) {
      return type === 'human' ? this._manifest.character.human : this._manifest.character.creature;
    } else {
      return type === 'human' ? this._manifest.character.mythHuman : this._manifest.character.beast;
    }
  }

  /**
   * 验证Prompt是否有风格污染
   * @param {string} promptText - 要验证的Prompt文本
   * @returns {Object} { passed: boolean, violations: Array, level: 'critical'|'warning' }
   */
  validatePrompt(promptText) {
    this._ensureInitialized();
    const contaminationConfig = CROSS_STYLE_CONTAMINATION_MAP[this.styleType];
    const violations = [];
    const promptLower = promptText.toLowerCase();

    // 检测禁用词
    for (const keyword of contaminationConfig.forbiddenKeywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        violations.push({
          type: 'forbidden_keyword',
          keyword: keyword,
          level: 'critical',
          message: `检测到跨风格禁用词: "${keyword}"，属于${this.styleType === 'documentary' ? '神话' : '写实'}风格词汇，不应出现在${this._manifest.name}中`
        });
      }
    }

    // 检测缺失的必需词
    for (const keyword of contaminationConfig.requiredKeywords) {
      if (!promptLower.includes(keyword.toLowerCase())) {
        violations.push({
          type: 'missing_required',
          keyword: keyword,
          level: 'warning',
          message: `缺少风格必需词: "${keyword}"，建议添加以强化${this._manifest.name}风格`
        });
      }
    }

    // 检测缺失的必需负面词
    for (const negative of contaminationConfig.requiredNegatives) {
      if (!promptLower.includes(negative.toLowerCase())) {
        violations.push({
          type: 'missing_negative',
          keyword: negative,
          level: 'warning',
          message: `缺少核心负面防护: "${negative}"，可能导致风格偏差`
        });
      }
    }

    const criticalCount = violations.filter(v => v.level === 'critical').length;
    const passed = criticalCount === 0;

    this._logDecision('VALIDATE', `Prompt验证: ${violations.length}项问题 (${criticalCount}项严重)`);

    return { passed, violations, level: criticalCount > 0 ? 'critical' : (violations.length > 0 ? 'warning' : 'pass') };
  }

  /**
   * 自动修复风格污染
   * @param {string} promptText - 被污染的Prompt
   * @returns {Object} { fixed: string, changes: Array, originalViolations: Array }
   */
  autoFix(promptText) {
    const validation = this.validatePrompt(promptText);
    let fixed = promptText;
    const changes = [];

    for (const v of validation.violations) {
      if (v.type === 'forbidden_keyword') {
        // 移除禁用词
        const regex = new RegExp(v.keyword, 'gi');
        fixed = fixed.replace(regex, '');
        changes.push({ type: 'removed', keyword: v.keyword });
      }
    }

    // 清理多余空格和标点
    fixed = fixed.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
    // 移除开头和结尾的逗号
    fixed = fixed.replace(/^,\s*/, '').replace(/,\s*$/, '');

    this._logDecision('AUTOFIX', `自动修复: 移除${changes.length}项污染, 修复后长度: ${fixed.length}字符`);

    return { fixed, changes, originalViolations: validation.violations };
  }

  /**
   * 注入风格化负面防护词
   * @param {string} promptText - 原始Prompt
   * @returns {string} 注入负面防护后的完整Prompt
   */
  injectNegatives(promptText) {
    this._ensureInitialized();
    const negatives = this.getNegativeList();
    const negativeString = negatives.map(n => `no ${n}`).join(' ');

    // 检查Prompt是否已经有负面词
    if (promptText.toLowerCase().includes('no ')) {
      // 已经有负面词，检查完整性
      const missing = negatives.filter(n => !promptText.toLowerCase().includes(`no ${n.toLowerCase()}`));
      if (missing.length > 0) {
        const additional = missing.map(n => `no ${n}`).join(' ');
        return `${promptText}, ${additional}`;
      }
      return promptText;
    }

    return `${promptText}, ${negativeString}`;
  }

  /**
   * 获取风格决策日志
   */
  getDecisionLog() {
    return [...this._decisionLog];
  }

  /**
   * 打印风格配置摘要
   */
  printSummary() {
    this._ensureInitialized();
    const m = this._manifest;
    console.log('\n=== 风格配置摘要 ===');
    console.log(`  风格类型: ${m.name} (${m.id})`);
    console.log(`  项目: ${this.projectName}`);
    console.log(`  视觉基准: ${m.visual.base}`);
    console.log(`  时代背景: ${m.visual.era}`);
    console.log(`  光影系统: ${m.visual.lighting.substring(0, 80)}...`);
    console.log(`  色彩系统: ${m.visual.colorPalette.map(c => c.name).join(', ')}`);
    console.log(`  负面词: ${m.negative.fullList.length}项`);
    console.log(`  运镜: ${m.visual.camera[0]}`);
    console.log(`  氛围: ${m.visual.atmosphere}`);
    console.log(`  环境: ${m.environment.type}`);
    console.log('===================\n');
  }

  // ─── 内部方法 ───

  _ensureInitialized() {
    if (!this._initialized) {
      throw new Error(
        `[StyleIsolationGateway] 未初始化！` +
        `请调用 new StyleIsolationGateway({ styleType: 'documentary'|'drama', projectName: '...' }) 初始化。`
      );
    }
  }

  _logDecision(type, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      styleType: this.styleType,
      projectName: this.projectName
    };
    this._decisionLog.push(entry);
  }
}

// ─── 导出 ───
module.exports = { StyleIsolationGateway, STYLE_TYPES };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Style Isolation Gateway v2.0-Peng 测试 ===\n');

  // 测试1: Documentary风格初始化
  console.log('--- Test 1: Documentary 风格初始化 ---');
  const docGateway = new StyleIsolationGateway({
    styleType: 'documentary',
    projectName: '健康小课堂-E01',
    category: 'health-education'
  });
  docGateway.printSummary();

  // 测试2: 获取各维度配置
  console.log('--- Test 2: 获取维度配置 ---');
  console.log('光影:', docGateway.getLighting().substring(0, 60) + '...');
  console.log('色彩数:', docGateway.getColorPalette().length);
  console.log('负面词数:', docGateway.getNegativeList().length);
  console.log('环境元素:', docGateway.getEnvironmentElements().length);
  console.log('禁用环境:', docGateway.getForbiddenEnvironmentElements().length);

  // 测试3: 角色规范
  console.log('\n--- Test 3: 角色规范 ---');
  const humanSpec = docGateway.getCharacterSpec('human');
  console.log('人类角色皮肤:', humanSpec.skin.substring(0, 60) + '...');
  const creatureSpec = docGateway.getCharacterSpec('creature');
  console.log('生物角色解剖:', creatureSpec.anatomy.substring(0, 60) + '...');

  // 测试4: Prompt验证 — 污染检测
  console.log('\n--- Test 4: Prompt污染检测 ---');
  const contaminatedPrompt = 'CG cinematic, Honghuang era mystical atmosphere, modern studio lighting, ink wash painting texture, nurse in white uniform';
  const validation = docGateway.validatePrompt(contaminatedPrompt);
  console.log(`验证结果: ${validation.passed ? '✅ 通过' : '❌ 失败'} (${validation.violations.length}项问题)`);
  validation.violations.forEach(v => {
    console.log(`  ${v.level === 'critical' ? '❌' : '⚠️'} ${v.type}: ${v.message}`);
  });

  // 测试5: 自动修复
  console.log('\n--- Test 5: 自动修复 ---');
  const fixResult = docGateway.autoFix(contaminatedPrompt);
  console.log('修复前:', contaminatedPrompt.substring(0, 80) + '...');
  console.log('修复后:', fixResult.fixed.substring(0, 80) + '...');
  console.log('修改项:', fixResult.changes.map(c => `${c.type}: "${c.keyword}"`).join(', '));

  // 测试6: 负面词注入
  console.log('\n--- Test 6: 负面词注入 ---');
  const cleanPrompt = 'CG cinematic photorealistic, nurse in modern studio';
  const withNegatives = docGateway.injectNegatives(cleanPrompt);
  console.log('注入前:', cleanPrompt);
  console.log('注入后:', withNegatives.substring(0, 120) + '...');
  console.log('注入后长度:', withNegatives.length, '字符');

  // 测试7: Drama风格
  console.log('\n--- Test 7: Drama 风格初始化 ---');
  const dramaGateway = new StyleIsolationGateway({
    styleType: 'drama',
    projectName: '烛龙觉醒-E01',
    category: 'mythology-drama'
  });
  console.log('Drama色彩:', dramaGateway.getColorPalette().map(c => c.name).join(', '));

  // 测试8: 自动检测
  console.log('\n--- Test 8: 自动风格检测 ---');
  const detected1 = StyleIsolationGateway.autoDetectStyleType('health-education');
  console.log('health-education →', detected1);
  const detected2 = StyleIsolationGateway.autoDetectStyleType('mythology-epic');
  console.log('mythology-epic →', detected2);
  const detected3 = StyleIsolationGateway.autoDetectStyleType('unknown');
  console.log('unknown →', detected3, '(默认)');

  // 测试9: 决策日志
  console.log('\n--- Test 9: 决策日志 ---');
  const logs = docGateway.getDecisionLog();
  console.log(`共${logs.length}条决策记录:`);
  logs.forEach(l => console.log(`  [${l.type}] ${l.message}`));

  console.log('\n=== 全部测试通过 ===');
}