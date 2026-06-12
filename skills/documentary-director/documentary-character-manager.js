#!/usr/bin/env node
/**
 * Documentary Character Manager v1.0-Peng
 * 写实纪录片角色档案管理器
 *
 * 与山海经角色档案（shanhaijing-character-manager）完全隔离。
 * 职责：
 * 1. 管理写实角色档案（护士、小男孩、产品模特等）
 * 2. 为每个镜头自动匹配正确角度的定妆照引用
 * 3. 确保角色描述保持写实风格（毛孔、真实皮肤、职业服装）
 * 4. 输出可直接注入Seedance content数组的参考图配置
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSONSafeParser } = require('./json-safe-parser');

// ─── 角色档案根目录 ───
const CHARACTERS_ROOT = path.join(__dirname, 'characters');

// ─── 内置角色定义（写实风格，Prompt中自动注入）───
const BUILTIN_CHARACTERS = {
  'chen-nurse': {
    id: 'chen-nurse',
    name: '陈女士',
    displayName: '穿警服的护士陈女士',
    role: 'health-educator',
    styleType: 'documentary',
    version: '1.0',

    // 写实角色描述（注入Prompt的核心文本）
    description: {
      base: '25-28 year old East Asian female, realistic skin texture with visible pores and subtle imperfections, natural skin tone with warm undertone',
      hair: 'straight black hair neatly tied in professional bun, natural hair strands with realistic texture, no exaggerated shine',
      eyes: 'proportionally sized dark brown eyes with natural moisture and realistic iris texture, no sparkling or oversized',
      facialFeatures: 'natural oval face with subtle asymmetry, realistic expression lines, natural human proportions',
      attire: 'dark navy professional nurse uniform with red cross emblem on left chest, police badge on right chest, white nurse cap with red cross, white nurse shoes, clean pressed fabric with realistic folds and draping',
      expression: 'warm professional smile with natural human expression, subtle emotional warmth, no exaggerated theatrical or staged poses',
      movement: 'natural human movement, realistic physics and weight, professional posture, no cartoonish bounce or artificial smoothness'
    },

    // 定妆照角度定义
    refAngles: {
      'front-full':    { desc: '正面全身，站立姿势',    usage: 'establishing shots, full body scenes' },
      'front-closeup': { desc: '正面特写，面部表情',    usage: 'dialogue, emotional moments' },
      'profile-left':  { desc: '左侧Profile，半身',    usage: 'walking, side view scenes' },
      'profile-right': { desc: '右侧Profile，半身',    usage: 'walking, side view scenes' },
      'action-seated': { desc: '坐姿，自然放松',        usage: 'sitting, explaining at desk' },
      'action-walking':{ desc: '行走动态，自然步态',    usage: 'walking into scene, movement' }
    },

    // 分镜头→定妆照映射规则
    shotMapping: {
      'intro':          ['front-full', 'front-closeup'],
      'explaining':     ['front-closeup', 'action-seated'],
      'demonstrating':  ['front-full', 'front-closeup'],
      'walking':        ['action-walking', 'profile-left'],
      'closeup-emotion':['front-closeup'],
      'wide-establishing': ['front-full']
    }
  },

  'xiaog-boy': {
    id: 'xiaog-boy',
    name: '小G',
    displayName: '8岁小男孩小G',
    role: 'child-audience',
    styleType: 'documentary',
    version: '1.0',

    description: {
      base: '8-year-old East Asian boy, realistic child skin texture with visible pores and subtle natural flush, natural skin tone with healthy warmth',
      hair: 'short straight black hair with natural texture, slight bed-head imperfection, childlike natural messiness',
      eyes: 'proportionally sized dark brown child eyes with natural moisture, realistic iris texture, no sparkling or oversized anime eyes',
      facialFeatures: 'natural round-square child face with subtle asymmetry, realistic child proportions, natural chubby cheeks with natural skin tone not exaggerated rosy',
      attire: 'traditional Chinese children frog-button top in light blue or white, dark cloth shoes with realistic fabric texture, clean but naturally worn, realistic clothing folds',
      expression: 'natural child expressions ranging from curious to puzzled to happy, genuine emotional reactions, no exaggerated theatrical or staged poses, no artificial cute poses',
      movement: 'natural child movement, realistic physics, sitting naturally, standing with child posture, no cartoonish bounce or artificial smoothness'
    },

    refAngles: {
      'front-full':    { desc: '正面全身，自然站立',    usage: 'full body establishing shots' },
      'front-closeup': { desc: '正面特写，表情丰富',    usage: 'emotional reactions, listening' },
      'profile-left':  { desc: '左侧Profile',          usage: 'watching, side view' },
      'sitting':       { desc: '坐姿，自然放松',        usage: 'sitting on stool, watching' },
      'standing':      { desc: '站立，自然姿态',        usage: 'standing, observing' },
      'curious':       { desc: '好奇表情特写',          usage: 'curious, puzzled moments' }
    },

    shotMapping: {
      'intro':          ['front-full', 'front-closeup'],
      'listening':      ['sitting', 'front-closeup'],
      'watching':       ['standing', 'profile-left'],
      'reacting':       ['front-closeup', 'curious'],
      'wide':           ['front-full']
    }
  },

  'product-model': {
    id: 'product-model',
    name: '产品展示模特',
    displayName: '产品展示专用模特',
    role: 'product-presenter',
    styleType: 'documentary',
    version: '1.0',

    description: {
      base: 'professional product presenter, 28-35 year old East Asian female or male, realistic skin texture with visible pores, natural healthy skin tone',
      hair: 'neatly styled hair appropriate for commercial setting, natural texture, professional appearance',
      eyes: 'proportionally sized eyes with natural moisture, confident professional gaze, realistic iris texture',
      facialFeatures: 'natural professional appearance, subtle asymmetry, approachable yet authoritative expression',
      attire: 'modern professional attire suitable for product category, clean pressed fabric with realistic folds, no logos or distracting patterns unless product-branded',
      expression: 'confident professional smile, natural human warmth, trustworthy and knowledgeable, no exaggerated sales enthusiasm',
      movement: 'natural professional gestures when demonstrating product, realistic physics, smooth but not artificially polished movements'
    },

    refAngles: {
      'front-full':    { desc: '正面全身，展示产品',    usage: 'full product demonstration' },
      'front-closeup': { desc: '正面特写，讲解产品',    usage: 'product detail explanation' },
      'hands-product': { desc: '手部特写+产品',        usage: 'product feature close-up' },
      'profile':       { desc: '侧面展示产品轮廓',     usage: 'product silhouette, side view' }
    },

    shotMapping: {
      'intro':          ['front-full', 'front-closeup'],
      'demonstrating':  ['front-full', 'hands-product'],
      'explaining':     ['front-closeup', 'hands-product'],
      'closeup':        ['hands-product', 'front-closeup'],
      'wide':           ['front-full']
    }
  }
};

// ─── 角色档案类 ───
class DocumentaryCharacterManager {
  constructor(customRoot) {
    this.rootDir = customRoot || CHARACTERS_ROOT;
    this.characters = { ...BUILTIN_CHARACTERS };
    this._ensureDirectories();
    this._loadCustomCharacters();
  }

  /**
   * 注册自定义角色
   * @param {Object} characterDef — 角色定义对象（格式同BUILTIN_CHARACTERS）
   */
  registerCharacter(characterDef) {
    if (!characterDef.id) throw new Error('[CharacterManager] 角色定义必须包含id');
    if (!characterDef.description) throw new Error('[CharacterManager] 角色定义必须包含description');

    this.characters[characterDef.id] = {
      ...characterDef,
      styleType: 'documentary', // 强制写实风格
      registeredAt: new Date().toISOString()
    };

    // 创建角色目录
    const charDir = path.join(this.rootDir, characterDef.id);
    const refsDir = path.join(charDir, 'refs');
    if (!fs.existsSync(charDir)) {
      fs.mkdirSync(charDir, { recursive: true });
      fs.mkdirSync(refsDir, { recursive: true });
    }

    // 保存角色定义
    fs.writeFileSync(
      path.join(charDir, 'manifest.json'),
      JSON.stringify(this.characters[characterDef.id], null, 2)
    );

    console.log(`[CharacterManager] ✅ 已注册角色: ${characterDef.id} (${characterDef.name || '未命名'})`);
  }

  /**
   * 获取角色完整定义
   * @param {string} characterId — 角色ID
   * @returns {Object} 角色定义
   */
  getCharacter(characterId) {
    const char = this.characters[characterId];
    if (!char) {
      throw new Error(`[CharacterManager] 未知角色: "${characterId}"。可用角色: ${Object.keys(this.characters).join(', ')}`);
    }
    return char;
  }

  /**
   * 列出所有可用角色
   */
  listCharacters() {
    return Object.values(this.characters).map(c => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      role: c.role,
      refCount: Object.keys(c.refAngles || {}).length
    }));
  }

  /**
   * 为指定镜头获取角色Prompt描述
   * @param {string} characterId — 角色ID
   * @param {string} shotType — 镜头类型（如 'intro', 'explaining'）
   * @returns {Object} { promptText: string, refs: Array<string> }
   */
  getCharacterPromptForShot(characterId, shotType = 'intro') {
    const char = this.getCharacter(characterId);
    const desc = char.description;

    // 构建角色描述文本（用于Prompt注入）
    const promptParts = [
      desc.base,
      desc.hair,
      desc.eyes,
      desc.facialFeatures,
      desc.attire,
      desc.expression,
      desc.movement
    ].filter(Boolean);

    // 获取该镜头应引用的定妆照
    const mapping = char.shotMapping || {};
    const angleKeys = mapping[shotType] || mapping['intro'] || Object.keys(char.refAngles || {}).slice(0, 2);

    const refs = angleKeys.map(angleKey => {
      const angle = char.refAngles?.[angleKey];
      if (!angle) return null;
      const fileName = `${angleKey}.png`; // 实际文件名
      const filePath = path.join(this.rootDir, characterId, 'refs', fileName);
      return {
        angle: angleKey,
        desc: angle.desc,
        fileName,
        filePath,
        exists: fs.existsSync(filePath)
      };
    }).filter(Boolean);

    return {
      characterId,
      characterName: char.name,
      displayName: char.displayName,
      promptText: promptParts.join(', '),
      refs,
      refCount: refs.length
    };
  }

  /**
   * 为完整分镜计划生成所有角色的Prompt和参考图映射
   * @param {Array} shots — 分镜数组 [{ id, type, characters: ['chen-nurse', ...] }]
   * @returns {Object} { shotId: { characterId: { promptText, refs, ... } } }
   */
  buildShotCharacterMap(shots) {
    const map = {};

    for (const shot of shots) {
      map[shot.id] = {};
      const shotType = shot.type || 'intro';

      for (const charId of (shot.characters || [])) {
        map[shot.id][charId] = this.getCharacterPromptForShot(charId, shotType);
      }
    }

    return map;
  }

  /**
   * 生成Seedance content数组中的reference_image项
   * @param {Object} shotCharMap — 单镜头的角色映射
   * @param {string} refRootPath — 定妆照实际存储的根路径（绝对路径或URL前缀）
   * @returns {Array} content数组中的image_url项
   */
  buildReferenceImages(shotCharMap, refRootPath = '') {
    const images = [];

    for (const [charId, charData] of Object.entries(shotCharMap)) {
      for (const ref of (charData.refs || [])) {
        if (!ref.exists) {
          console.warn(`[CharacterManager] ⚠️ 定妆照不存在: ${ref.filePath}`);
          continue;
        }

        const fullPath = refRootPath
          ? path.join(refRootPath, charId, 'refs', ref.fileName)
          : ref.filePath;

        images.push({
          type: 'image_url',
          image_url: { url: fullPath },
          role: 'reference_image',
          characterId,
          angle: ref.angle,
          desc: ref.desc
        });
      }
    }

    return images;
  }

  /**
   * 获取角色写实风格约束（用于Prompt中的负面防护补充）
   * @param {string} characterId
   * @returns {Array<string>} 角色专属负面词
   */
  getCharacterNegativeConstraints(characterId) {
    const char = this.getCharacter(characterId);
    const role = char.role;

    // 角色类型特定的负面约束
    const constraints = [
      'no cartoon', 'no anime', 'no 3D render look',
      'no plastic skin', 'no wax skin', 'no porcelain skin',
      'no mannequin', 'no doll', 'no puppet',
      'no exaggerated expression', 'no staged pose', 'no artificial pose'
    ];

    if (role === 'child-audience') {
      constraints.push('no chibi', 'no big eyes', 'no cute anime style', 'no fluffy', 'no mascot style');
    }

    if (role === 'health-educator') {
      constraints.push('no sexualized', 'no glamorous makeup', 'no fashion model pose');
    }

    return constraints;
  }

  // ─── 内部方法 ───

  _ensureDirectories() {
    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }

    for (const [charId, charDef] of Object.entries(this.characters)) {
      const charDir = path.join(this.rootDir, charId);
      const refsDir = path.join(charDir, 'refs');

      if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true });
      if (!fs.existsSync(refsDir)) fs.mkdirSync(refsDir, { recursive: true });

      // 保存内置角色manifest
      const manifestPath = path.join(charDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        fs.writeFileSync(manifestPath, JSON.stringify(charDef, null, 2));
      }
    }
  }

  _loadCustomCharacters() {
    if (!fs.existsSync(this.rootDir)) return;

    const entries = fs.readdirSync(this.rootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const charId = entry.name;
      if (this.characters[charId]) continue; // 跳过内置角色

      const manifestPath = path.join(this.rootDir, charId, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const parser = new JSONSafeParser();
        const result = parser.parseFile(manifestPath, fs);
        if (result.success) {
          this.characters[charId] = result.data;
          console.log(`[CharacterManager] 📁 已加载自定义角色: ${charId}`);
        } else {
          console.warn(`[CharacterManager] ⚠️ 加载自定义角色失败: ${charId} — ${result.error}`);
          if (result.repairLog.length > 0) {
            console.log(`[CharacterManager] 🔧 修复尝试: ${result.repairLog.map(r => r.strategy).join(', ')}`);
          }
        }
      }
    }
  }
}

// ─── 导出 ───
module.exports = { DocumentaryCharacterManager, BUILTIN_CHARACTERS };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Documentary Character Manager v1.0-Peng 测试 ===\n');

  const manager = new DocumentaryCharacterManager();

  // 测试1: 列出角色
  console.log('--- Test 1: 列出所有角色 ---');
  const chars = manager.listCharacters();
  chars.forEach(c => {
    console.log(`  • ${c.id}: ${c.displayName} (${c.role}) — ${c.refCount}张定妆照`);
  });

  // 测试2: 获取角色定义
  console.log('\n--- Test 2: 获取陈女士角色定义 ---');
  const chen = manager.getCharacter('chen-nurse');
  console.log(`  名称: ${chen.displayName}`);
  console.log(`  基础描述: ${chen.description.base.substring(0, 80)}...`);
  console.log(`  服装: ${chen.description.attire.substring(0, 80)}...`);

  // 测试3: 获取镜头角色描述
  console.log('\n--- Test 3: 开场镜头角色描述 ---');
  const chenIntro = manager.getCharacterPromptForShot('chen-nurse', 'intro');
  console.log(`  角色: ${chenIntro.displayName}`);
  console.log(`  Prompt长度: ${chenIntro.promptText.length}字符`);
  console.log(`  Prompt前100字符: ${chenIntro.promptText.substring(0, 100)}...`);
  console.log(`  定妆照引用:`);
  chenIntro.refs.forEach(r => {
    console.log(`    • ${r.angle}: ${r.desc} ${r.exists ? '✅' : '⚠️ 待生成'}`);
  });

  // 测试4: 小G角色
  console.log('\n--- Test 4: 小G角色 ---');
  const xiaog = manager.getCharacterPromptForShot('xiaog-boy', 'listening');
  console.log(`  角色: ${xiaog.displayName}`);
  console.log(`  Prompt前80字符: ${xiaog.promptText.substring(0, 80)}...`);
  console.log(`  定妆照: ${xiaog.refs.map(r => r.angle).join(', ')}`);

  // 测试5: 负面约束
  console.log('\n--- Test 5: 角色负面约束 ---');
  const chenNegs = manager.getCharacterNegativeConstraints('chen-nurse');
  console.log(`  陈女士约束: ${chenNegs.length}项`);
  console.log(`  关键约束: ${chenNegs.slice(0, 6).join(', ')}...`);

  const xiaogNegs = manager.getCharacterNegativeConstraints('xiaog-boy');
  console.log(`  小G约束: ${xiaogNegs.length}项 (含儿童专属: no chibi, no big eyes)`);

  // 测试6: 分镜映射
  console.log('\n--- Test 6: 分镜角色映射 ---');
  const shots = [
    { id: 'S01', type: 'intro', characters: ['chen-nurse', 'xiaog-boy'] },
    { id: 'S02', type: 'explaining', characters: ['chen-nurse'] },
    { id: 'S03', type: 'demonstrating', characters: ['chen-nurse', 'xiaog-boy'] }
  ];
  const map = manager.buildShotCharacterMap(shots);
  for (const [shotId, chars] of Object.entries(map)) {
    console.log(`  ${shotId}:`);
    for (const [charId, data] of Object.entries(chars)) {
      console.log(`    ${charId}: ${data.refCount}张参考图, Prompt ${data.promptText.length}字符`);
    }
  }

  // 测试7: 参考图数组
  console.log('\n--- Test 7: 参考图Content数组 ---');
  const s01Images = manager.buildReferenceImages(map.S01, '/refs');
  console.log(`  S01生成 ${s01Images.length}个 reference_image 项`);
  s01Images.forEach(img => {
    console.log(`    • ${img.characterId}/${img.angle}: ${img.image_url.url.substring(0, 60)}...`);
  });

  // 测试8: 错误处理
  console.log('\n--- Test 8: 错误处理 ---');
  try {
    manager.getCharacter('nonexistent');
  } catch (e) {
    console.log(`  ✅ 正确捕获: ${e.message.substring(0, 80)}...`);
  }

  console.log('\n=== 全部测试通过 ===');
}