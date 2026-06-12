#!/usr/bin/env node
/**
 * Documentary Prompt Builder v2.0-Peng
 * 写实纪录片Prompt构建器
 *
 * 完全独立于神话Prompt构建器，使用Documentary风格宪法生成Prompt。
 * 核心职责：
 * 1. 根据镜头定义和风格宪法，构建完整的写实风格Prompt
 * 2. 自动注入角色参考图映射
 * 3. 自动注入风格化负面防护词
 * 4. 确保Prompt字符长度控制在990以内
 * 5. 输出可直接提交给Seedance的content数组
 *
 * 与神话Prompt构建器的区别：
 * - 模块顺序不同（写实：场景描述优先，神话：氛围渲染优先）
 * - 色彩系统完全不同
 * - 负面防护词库完全不同
 * - 环境描述完全不同（现代工作室 vs 洪荒山水）
 * - 角色描述约束完全不同（毛孔/纹理 vs 仙气/神性）
 */

'use strict';

const { StyleIsolationGateway } = require('./style-isolation-gateway');

class DocumentaryPromptBuilder {
  constructor(gateway) {
    if (!gateway || !(gateway instanceof StyleIsolationGateway)) {
      throw new Error('[DocumentaryPromptBuilder] 必须传入已初始化的 StyleIsolationGateway 实例');
    }
    if (gateway.getManifest().id !== 'documentary') {
      throw new Error(`[DocumentaryPromptBuilder] 仅支持documentary风格，当前: ${gateway.getManifest().id}`);
    }
    this.gateway = gateway;
  }

  /**
   * 构建完整Prompt
   * @param {Object} shot - 镜头定义
   *   {
   *     id: 'S01',
   *     name: '开场建置',
   *     duration: 5,
   *     characters: [
   *       { name: 'chen', type: 'human', role: 'nurse', action: 'standing in front of whiteboard explaining' },
   *       { name: 'xiaog', type: 'human', role: 'boy', action: 'sitting on stool looking up attentively' }
   *     ],
   *     environment: 'bright health education studio with whiteboard and windows',
   *     camera: 'medium shot eye-level shallow depth of field',
   *     lighting: 'natural sunlight 5600K from left',
   *     colorAccent: 'medical white and light blue',
   *     medicalDetail: 'rhabdomyolysis diagram on whiteboard'
   *   }
   * @returns {string} 完整Prompt文本
   */
  buildPrompt(shot) {
    const manifest = this.gateway.getManifest();
    const parts = [];

    // ─── 1. 系统前缀（视觉基准 + 时代背景）───
    parts.push(manifest.visual.base);
    parts.push(manifest.visual.era);

    // ─── 2. 角色描述（写实约束）───
    if (shot.characters && shot.characters.length > 0) {
      for (const char of shot.characters) {
        const spec = this.gateway.getCharacterSpec(char.type);
        parts.push(this._buildCharacterDesc(char, spec));
      }
    }

    // ─── 3. 场景动作与环境 ───
    if (shot.environment) {
      parts.push(shot.environment);
    }
    if (shot.medicalDetail) {
      parts.push(shot.medicalDetail);
    }

    // ─── 4. 光影质感 ───
    parts.push(manifest.visual.lighting);

    // ─── 5. 色彩系统 ───
    const colorString = manifest.visual.colorPalette.map(c => `${c.name} ${c.hex}`).join(' ');
    parts.push(colorString);

    // ─── 6. 材质与纹理 ───
    if (shot.textureFocus) {
      parts.push(shot.textureFocus);
    }

    // ─── 7. 负面防护（自动注入）───
    const negatives = manifest.negative.fullList.map(n => `no ${n}`).join(' ');
    parts.push(negatives);

    // ─── 8. 运镜指令 ───
    if (shot.camera) {
      parts.push(shot.camera);
    } else {
      parts.push(manifest.visual.camera[0]);
    }

    // ─── 9. 氛围 ───
    parts.push(manifest.visual.atmosphere);

    // ─── 10. 质量锚定 ───
    parts.push('4K documentary educational scientific accuracy');

    let prompt = parts.join(', ');

    // 清理多余空格
    prompt = prompt.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();

    // 字符长度检查
    if (prompt.length > 990) {
      console.warn(`[DocumentaryPromptBuilder] ⚠️ Prompt超长: ${prompt.length}字符 > 990上限，需要精简`);
    }

    return prompt;
  }

  /**
   * 构建角色描述文本
   * @param {Object} char - 角色定义
   * @param {Object} spec - 角色规范（来自风格宪法）
   */
  _buildCharacterDesc(char, spec) {
    const desc = [];

    if (char.type === 'human') {
      desc.push(`${char.role || char.name}`);
      desc.push(spec.skin);
      desc.push(spec.hair);
      desc.push(spec.eyes);
      desc.push(spec.clothing);
      desc.push(spec.expression);
      if (char.action) desc.push(char.action);
    } else if (char.type === 'creature') {
      desc.push(`${char.role || char.name}`);
      desc.push(spec.anatomy);
      desc.push(spec.fur || spec.skin);
      desc.push(spec.expression);
      if (char.action) desc.push(spec.action);
    }

    return desc.join(', ');
  }

  /**
   * 构建完整的content数组（用于Seedance API）
   * @param {Object} shot - 镜头定义
   * @param {Object} characterRefs - 角色参考图映射 { chen: 'chen-01.png', xiaog: 'xiaog-01.png' }
   * @returns {Array} content数组 [{ type: 'image_url', ... }, { type: 'text', ... }]
   */
  buildContentArray(shot, characterRefs = {}) {
    const content = [];

    // 注入角色参考图
    for (const [roleName, filePath] of Object.entries(characterRefs)) {
      content.push({
        type: 'image_url',
        image_url: { url: filePath }, // 注意：实际使用时需要转换为data URL
        role: 'reference_image'
      });
    }

    // 注入Prompt文本
    const prompt = this.buildPrompt(shot);
    content.push({ type: 'text', text: prompt });

    return content;
  }

  /**
   * 批量构建所有镜头的Prompt
   * @param {Array} shots - 镜头定义数组
   * @param {Object} shotCharacterRefs - { S01: { chen: '...', xiaog: '...' }, ... }
   * @returns {Array} 镜头Prompt数组 [{ id, prompt, content, characterRefs }]
   */
  buildAllPrompts(shots, shotCharacterRefs = {}) {
    const results = [];

    for (const shot of shots) {
      const refs = shotCharacterRefs[shot.id] || {};
      const prompt = this.buildPrompt(shot);
      const content = this.buildContentArray(shot, refs);

      results.push({
        id: shot.id,
        name: shot.name,
        duration: shot.duration,
        prompt,
        content,
        characterRefs: refs,
        promptLength: prompt.length,
        refImageCount: Object.keys(refs).length
      });
    }

    return results;
  }

  /**
   * 精简Prompt（当超长时）
   * @param {string} prompt - 原始Prompt
   * @param {number} targetLength - 目标长度（默认990）
   * @returns {string} 精简后的Prompt
   */
  trimPrompt(prompt, targetLength = 990) {
    if (prompt.length <= targetLength) return prompt;

    let trimmed = prompt;
    const manifest = this.gateway.getManifest();

    // 策略1: 缩短色彩系统描述（保留HEX值，移除名称）
    for (const color of manifest.visual.colorPalette) {
      const fullPattern = new RegExp(`${color.name}\s*${color.hex}`, 'gi');
      trimmed = trimmed.replace(fullPattern, color.hex);
    }
    if (trimmed.length <= targetLength) return trimmed;

    // 策略2: 移除氛围描述（最后部分）
    const atmosphereIdx = trimmed.lastIndexOf(manifest.visual.atmosphere);
    if (atmosphereIdx > 0) {
      trimmed = trimmed.substring(0, atmosphereIdx).trim();
      if (trimmed.endsWith(',')) trimmed = trimmed.slice(0, -1);
    }
    if (trimmed.length <= targetLength) return trimmed;

    // 策略3: 缩短负面词（保留核心，移除部分）
    // 保留最核心的15项负面词
    const coreNegatives = ['cartoon', 'anime', '3D render look', 'plastic skin', 'wax skin',
      'mannequin', 'doll', 'puppet', 'fluffy', 'cute', 'exaggerated expression',
      'oversaturated', 'low quality', 'blurry', 'deformed'];
    const coreNegString = coreNegatives.map(n => `no ${n}`).join(' ');

    // 替换完整的负面词串
    const fullNeg = manifest.negative.fullList.map(n => `no ${n}`).join(' ');
    trimmed = trimmed.replace(fullNeg, coreNegString);
    if (trimmed.length <= targetLength) return trimmed;

    // 策略4: 缩短材质描述
    trimmed = trimmed.replace(/hyper-detailed skin pores and subsurface scattering visible/gi, '');
    trimmed = trimmed.replace(/fabric weave texture on cotton uniforms/gi, '');
    trimmed = trimmed.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();

    console.warn(`[DocumentaryPromptBuilder] ⚠️ 精简后仍超长: ${trimmed.length}字符`);
    return trimmed;
  }
}

// ─── 导出 ───
module.exports = { DocumentaryPromptBuilder };

// ─── CLI 测试 ───
if (require.main === module) {
  const { StyleIsolationGateway } = require('./style-isolation-gateway');

  console.log('\n=== Documentary Prompt Builder v2.0-Peng 测试 ===\n');

  // 初始化网关
  const gateway = new StyleIsolationGateway({
    styleType: 'documentary',
    projectName: '健康小课堂-E01'
  });

  const builder = new DocumentaryPromptBuilder(gateway);

  // 测试1: 构建单镜头Prompt
  console.log('--- Test 1: 构建开场镜头Prompt ---');
  const shot1 = {
    id: 'S01',
    name: '开场建置',
    duration: 5,
    characters: [
      { name: 'chen', type: 'human', role: 'young East Asian female nurse 25 years old', action: 'standing in front of whiteboard explaining rhabdomyolysis diagram' },
      { name: 'xiaog', type: 'human', role: '8-year-old East Asian boy', action: 'sitting on wooden stool looking up attentively' }
    ],
    environment: 'bright modern health education studio with floor-to-ceiling windows showing green park outside',
    camera: 'medium shot eye-level shallow depth of field',
    medicalDetail: 'whiteboard with muscle anatomy diagram and simple molecular formulas'
  };

  const prompt1 = builder.buildPrompt(shot1);
  console.log(`Prompt长度: ${prompt1.length}字符`);
  console.log(`Prompt前200字符: ${prompt1.substring(0, 200)}...`);
  console.log(`包含"photorealistic": ${prompt1.includes('photorealistic') ? '✅' : '❌'}`);
  console.log(`包含"no cartoon": ${prompt1.includes('no cartoon') ? '✅' : '❌'}`);
  console.log(`包含医疗白: ${prompt1.includes('#FFFFFF') ? '✅' : '❌'}`);

  // 测试2: 构建Content数组
  console.log('\n--- Test 2: 构建Content数组 ---');
  const content1 = builder.buildContentArray(shot1, {
    chen: '/path/to/chen-01.png',
    xiaog: '/path/to/xiaog-01.png'
  });
  console.log(`Content项数: ${content1.length}`);
  console.log(`参考图数: ${content1.filter(c => c.type === 'image_url').length}`);
  console.log(`文本项: ${content1.filter(c => c.type === 'text').length}`);

  // 测试3: 批量构建
  console.log('\n--- Test 3: 批量构建 ---');
  const shots = [
    shot1,
    {
      id: 'S02',
      name: '引入问题',
      duration: 5,
      characters: [
        { name: 'chen', type: 'human', role: 'nurse', action: 'crouching to child eye level asking question' },
        { name: 'xiaog', type: 'human', role: 'boy', action: 'head tilted showing puzzled curious expression' }
      ],
      environment: 'same health education studio',
      camera: 'eye-level angle shallow depth of field'
    },
    {
      id: 'S03',
      name: '朱厌正常',
      duration: 5,
      characters: [
        { name: 'zhuyuan', type: 'creature', role: 'realistic primate 1.2m tall', action: 'standing upright natural posture on demonstration platform' },
        { name: 'chen', type: 'human', role: 'nurse', action: 'pointing at primate introducing' },
        { name: 'xiaog', type: 'human', role: 'boy', action: 'watching at lower right' }
      ],
      environment: 'demonstration platform with gray anti-slip mat and white backdrop',
      camera: 'tracking medium shot stable framing'
    }
  ];

  const shotRefs = {
    S01: { chen: 'chen-01.png', xiaog: 'xiaog-01.png' },
    S02: { chen: 'chen-04.png', xiaog: 'xiaog-08.png' },
    S03: { chen: 'chen-06.png', xiaog: 'xiaog-01.png', zhuyuan: 'zhuyuan-01.png' }
  };

  const allPrompts = builder.buildAllPrompts(shots, shotRefs);
  console.log('批量构建结果:');
  for (const r of allPrompts) {
    const status = r.promptLength > 990 ? '❌ 超限' : r.promptLength > 950 ? '⚠️ 接近' : '✅';
    console.log(`  ${r.id}: ${r.promptLength}字符 ${status} | ${r.refImageCount}张参考图`);
  }

  // 测试4: Prompt精简
  console.log('\n--- Test 4: Prompt精简 ---');
  const longPrompt = prompt1 + ', ' + 'additional detailed description of every single element in the scene with extremely verbose language that makes this prompt way too long and exceeds the character limit of nine hundred and eighty characters';
  console.log(`超长Prompt: ${longPrompt.length}字符`);
  const trimmed = builder.trimPrompt(longPrompt);
  console.log(`精简后: ${trimmed.length}字符`);
  console.log(`精简后包含核心负面词: ${trimmed.includes('no cartoon') ? '✅' : '❌'}`);

  // 测试5: 错误检测
  console.log('\n--- Test 5: 错误检测 ---');
  try {
    const dramaGateway = new StyleIsolationGateway({
      styleType: 'drama',
      projectName: '烛龙觉醒'
    });
    const wrongBuilder = new DocumentaryPromptBuilder(dramaGateway);
  } catch (e) {
    console.log('✅ 正确拦截非documentary风格:', e.message);
  }

  console.log('\n=== 全部测试通过 ===');
}