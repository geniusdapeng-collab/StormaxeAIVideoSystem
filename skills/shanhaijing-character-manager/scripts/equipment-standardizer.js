/**
 * 角色武器装备系统 v1.1-Peng
 * Character Weapon & Equipment System
 * 
 * 核心设计：每个角色有一个「武器装备档案」，详细记录所有装备信息
 * 支持：多武器、多持握方式、非手持装备（佩戴/悬浮/融合等）
 * 
 * 🌍 v1.1-Peng 更新（2026-05-25）：
 * + 🆕 角色武器装备档案（Character Equipment Profile）
 * + 🆕 支持多武器（weapon1, weapon2, weapon3...）
 * + 🆕 持握方式多样化（手持/佩戴/悬浮/融合/镶嵌等）
 * + 🆕 装备属性详细化（名称/类型/位置/尺寸/材质/特效/约束）
 * + 🆕 装备间关系定义（成对使用/互斥/顺序等）
 * + 🆕 生成Prompt自动组装引擎
 */

const fs = require('fs');
const path = require('path');

// ============ 装备标准库（可扩展） ============
const EQUIPMENT_STANDARDS = {
  // ===== 盾牌系列 =====
  'rectangular-shield': {
    type: 'shield',
    name: '长方形四角盾',
    shape: '竖直长方形平板状',
    dimensions: '宽约肩宽，高约从胸至膝',
    edges: '四边平直，四个直角，底部无尖角，边缘无弧度',
    material: '暗金晶化金属质地',
    surface: '表面仅有自然熔岩脉络纹理，无装饰图案',
    prompt: '竖直长方形平板状盾牌，宽约肩宽高约从胸至膝，四边平直四角直角底部无尖角，暗金晶化金属质地'
  },
  'tower-shield': {
    type: 'shield',
    name: '塔盾',
    shape: '上宽下窄的倒三角形',
    edges: '底部收尖，顶部宽弧',
    prompt: '塔盾，上宽下窄倒三角形，底部收尖'
  },
  'round-shield': {
    type: 'shield',
    name: '圆盾',
    shape: '正圆形或略椭圆',
    edges: '边缘光滑圆弧形',
    prompt: '圆形盾牌，边缘光滑圆弧'
  },

  // ===== 斧子系列 =====
  'single-bitted-axe': {
    type: 'axe',
    name: '单刃战斧',
    blade: '头部一侧有弯曲锋利的半月形刃口',
    back: '另一侧为平直钝背，顶部有小锤头结构',
    handle: '短粗柄，约半臂长',
    material: '黑曜石晶化刃面',
    prompt: '单刃短柄战斧，斧刃只在头部一侧有弯曲锋利的半月形刃口，另一侧为平直钝背顶部有小锤头结构，斧柄短粗约半臂长'
  },
  'double-bitted-axe': {
    type: 'axe',
    name: '双刃战斧',
    blade: '头部两侧对称的弯曲刃口',
    back: '无钝背，双侧皆刃',
    handle: '中长柄',
    prompt: '双刃战斧，头部两侧对称弯曲刃口'
  },

  // ===== 剑系列 =====
  'straight-sword': {
    type: 'sword',
    name: '直剑',
    blade: '笔直双刃，尖端锋利',
    guard: '十字形护手',
    handle: '单手握柄或双手握柄',
    prompt: '直剑，笔直双刃，十字形护手'
  },
  'broadsword': {
    type: 'sword',
    name: '阔剑',
    blade: '宽刃单刃或双刃，刀身厚重',
    guard: '简单护手',
    prompt: '阔剑，宽刃厚重刀身'
  },
  'katana': {
    type: 'sword',
    name: '太刀',
    blade: '单刃微弯，刀身修长',
    guard: '圆形镡',
    handle: '双手握柄，缠绕绳纹',
    prompt: '太刀，单刃微弯修长刀身，圆形镡，双手握柄'
  },

  // ===== 法器/特殊装备 =====
  'staff': {
    type: 'staff',
    name: '法杖',
    shape: '长杆，顶部有特殊结构',
    material: '木质、骨质或晶体质',
    prompt: '法杖，长杆顶部特殊结构'
  },
  'orb': {
    type: 'orb',
    name: '宝珠',
    shape: '正球形或略椭圆',
    material: '发光晶体或能量球',
    prompt: '宝珠，发光球体'
  },
  'bow': {
    type: 'bow',
    name: '长弓',
    shape: '弧形长弓身',
    material: '木质或骨质',
    prompt: '长弓，弧形弓身'
  },
  'spear': {
    type: 'spear',
    name: '长矛',
    shape: '长杆+尖刃',
    material: '金属或骨质',
    prompt: '长矛，长杆尖刃'
  },
  'whip': {
    type: 'whip',
    name: '鞭子',
    shape: '柔软长条状',
    material: '皮革或能量束',
    prompt: '鞭子，柔软长条'
  },
  'dual-blade': {
    type: 'dual-blade',
    name: '双刀',
    shape: '两把短刀对称',
    material: '金属',
    prompt: '双刀，两把短刀对称'
  }
};

// ============ 持握方式标准库 ============
const GRIP_STANDARDS = {
  'left-hand': { 
    name: '左手持握', 
    position: '左侧',
    description: '左手自然握持，手臂微曲'
  },
  'right-hand': { 
    name: '右手持握', 
    position: '右侧',
    description: '右手自然握持，手臂微曲'
  },
  'dual-hand': { 
    name: '双手持握', 
    position: '正中',
    description: '双手共同握持'
  },
  'back-mounted': { 
    name: '背部挂载', 
    position: '背部',
    description: '背负于背部'
  },
  'waist-hung': { 
    name: '腰间悬挂', 
    position: '腰部',
    description: '悬挂于腰间'
  },
  'floating': { 
    name: '悬浮伴随', 
    position: '身侧',
    description: '悬浮于身体周围'
  },
  'embedded': { 
    name: '身体融合', 
    position: '身体',
    description: '与身体融为一体'
  },
  'mouth-held': { 
    name: '口衔', 
    position: '口部',
    description: '用口部衔住'
  },
  'tail-held': { 
    name: '尾部卷持', 
    position: '尾部',
    description: '用尾部卷住'
  }
};

// ============ 角色武器装备档案 ============
class CharacterEquipmentProfile {
  constructor(characterId, characterName) {
    this.characterId = characterId;
    this.characterName = characterName;
    this.weapons = []; // 武器列表
    this.equipment = []; // 其他装备
    this.relationships = []; // 装备间关系
    this.constraints = []; // 全局约束
    this.createdAt = new Date().toISOString();
  }

  addWeapon(weapon) {
    const standard = EQUIPMENT_STANDARDS[weapon.standardId];
    if (!standard) {
      throw new Error(`❌ 未找到装备标准: ${weapon.standardId}`);
    }
    
    const grip = GRIP_STANDARDS[weapon.grip];
    if (!grip) {
      throw new Error(`❌ 未找到持握方式: ${weapon.grip}`);
    }

    this.weapons.push({
      ...weapon,
      standard,
      grip,
      consistencyLock: this.buildWeaponConsistencyLock(weapon, standard, grip)
    });
    
    return this;
  }

  addRelationship(relation) {
    this.relationships.push(relation);
    return this;
  }

  addConstraint(constraint) {
    this.constraints.push(constraint);
    return this;
  }

  buildWeaponConsistencyLock(weapon, standard, grip) {
    const rules = [
      `${weapon.name}必须是同一${standard.shape || standard.type}，尺寸形状在所有角度中保持100%一致`,
      `${grip.name}，${grip.description}`,
      `武器材质纹理必须在所有视图中完全匹配，不得变形或改变`
    ];
    
    if (weapon.slot === 'main-hand' || weapon.slot === 'off-hand') {
      rules.push(`${grip.position}位置不可互换，不得换手`);
    }
    
    if (standard.blade) {
      rules.push(`刃口形态固定：${standard.blade}，不得改变`);
    }
    if (standard.back) {
      rules.push(`钝背形态固定：${standard.back}，不得改变`);
    }
    if (standard.edges) {
      rules.push(`边缘形态固定：${standard.edges}`);
    }
    
    return rules;
  }

  generatePrompt() {
    const parts = [];
    
    this.weapons.forEach(w => {
      const desc = this.buildWeaponDescription(w);
      parts.push(desc);
    });
    
    this.relationships.forEach(r => {
      parts.push(r.description);
    });
    
    const lockParts = [];
    this.weapons.forEach(w => {
      lockParts.push(`[${w.name}] ${w.consistencyLock.join('，')}`);
    });
    
    if (this.constraints.length > 0) {
      lockParts.push(...this.constraints);
    }
    
    parts.push(`WEAPON CONSISTENCY LOCK: ${lockParts.join('；')}；所有武器装备的材质纹理在所有视图中必须100%匹配`);
    
    return parts.join('，');
  }

  buildWeaponDescription(weapon) {
    const descs = [];
    
    descs.push(`${weapon.grip.name}${weapon.name}`);
    
    if (weapon.standard.shape) descs.push(`为${weapon.standard.shape}`);
    if (weapon.standard.dimensions) descs.push(`，${weapon.standard.dimensions}`);
    if (weapon.standard.blade) descs.push(`，${weapon.standard.blade}`);
    if (weapon.standard.back) descs.push(`，${weapon.standard.back}`);
    if (weapon.standard.handle) descs.push(`，${weapon.standard.handle}`);
    if (weapon.standard.edges) descs.push(`，${weapon.standard.edges}`);
    
    if (weapon.material || weapon.standard.material) {
      descs.push(`，${weapon.material || weapon.standard.material}`);
    }
    if (weapon.standard.surface) descs.push(`，${weapon.standard.surface}`);
    if (weapon.specialEffect) descs.push(`，${weapon.specialEffect}`);
    
    if (weapon.slot === 'back') descs.push(`，背负于背部`);
    if (weapon.slot === 'waist') descs.push(`，悬挂于腰间`);
    if (weapon.slot === 'floating') descs.push(`，悬浮于身侧`);
    
    return descs.join('');
  }

  toJSON() {
    return {
      characterId: this.characterId,
      characterName: this.characterName,
      weapons: this.weapons.map(w => ({
        id: w.id,
        name: w.name,
        standardId: w.standardId,
        grip: w.grip.name,
        slot: w.slot,
        size: w.size,
        material: w.material,
        specialEffect: w.specialEffect
      })),
      relationships: this.relationships,
      constraints: this.constraints,
      prompt: this.generatePrompt(),
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString()
    };
  }
}

// ============ 注册表管理 ============
const REGISTRY_FILE = path.join(__dirname, '..', 'character-archive', 'equipment-registry.json');

function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[WeaponSystem] 注册表读取失败:', e.message);
  }
  return {};
}

function saveRegistry(registry) {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  } catch (e) {
    console.error('[WeaponSystem] 注册表写入失败:', e.message);
  }
}

// ============ 便捷函数 ============

function createEquipmentProfile(characterId, characterName) {
  return new CharacterEquipmentProfile(characterId, characterName);
}

function registerProfile(profile) {
  const registry = loadRegistry();
  registry[profile.characterId] = profile.toJSON();
  saveRegistry(registry);
  console.log(`[WeaponSystem] ✅ ${profile.characterName} 武器装备档案已注册`);
  console.log(`   武器数: ${profile.weapons.length}`);
  console.log(`   关系数: ${profile.relationships.length}`);
  return registry[profile.characterId];
}

function getEquipmentPrompt(characterId) {
  const registry = loadRegistry();
  const record = registry[characterId];
  if (!record) return '';
  return record.prompt || '';
}

function getEquipmentProfile(characterId) {
  const registry = loadRegistry();
  return registry[characterId] || null;
}

// ============ 初始化示例 ============
function initExamples() {
  // ===== 刑天示例 =====
  const xingtian = createEquipmentProfile('xingtian', '刑天');
  
  xingtian.addWeapon({
    id: 'weapon-1',
    name: '干（神盾）',
    standardId: 'rectangular-shield',
    grip: 'left-hand',
    slot: 'off-hand',
    size: 'large',
    material: '暗金晶化金属',
    specialEffect: '表面熔岩脉络纹理发光'
  });
  
  xingtian.addWeapon({
    id: 'weapon-2',
    name: '戚（战斧）',
    standardId: 'single-bitted-axe',
    grip: 'right-hand',
    slot: 'main-hand',
    size: 'medium',
    material: '黑曜石晶化',
    specialEffect: '斧刃有熔岩裂纹纹理'
  });
  
  xingtian.addRelationship({
    type: 'paired',
    weapons: ['weapon-1', 'weapon-2'],
    description: '干戚成对使用，左手盾右手斧，攻防一体'
  });
  
  xingtian.addConstraint('左手永远持盾，右手永远持斧，左右手不可互换');
  xingtian.addConstraint('盾与斧的材质纹理必须与身体岩质纹理风格统一');
  
  registerProfile(xingtian);
  
  // ===== 孙悟空示例（多武器+非手持） =====
  const wukong = createEquipmentProfile('wukong', '孙悟空');
  
  wukong.addWeapon({
    id: 'weapon-1',
    name: '如意金箍棒',
    standardId: 'staff',
    grip: 'dual-hand',
    slot: 'main-hand',
    size: 'large',
    material: '神铁',
    specialEffect: '可伸缩变化，两端金箍发光'
  });
  
  wukong.addWeapon({
    id: 'weapon-2',
    name: '七十二变分身',
    standardId: 'orb',
    grip: 'floating',
    slot: 'floating',
    size: 'small',
    material: '能量体',
    specialEffect: '身周环绕多个金色光球分身'
  });
  
  wukong.addRelationship({
    type: 'sequence',
    weapons: ['weapon-1', 'weapon-2'],
    description: '先以金箍棒近战，危急时分身术脱困'
  });
  
  registerProfile(wukong);
  
  console.log('[WeaponSystem] ✅ 示例角色武器装备档案已初始化');
}

// ============ 导出 ============
module.exports = {
  CharacterEquipmentProfile,
  createEquipmentProfile,
  registerProfile,
  getEquipmentPrompt,
  getEquipmentProfile,
  EQUIPMENT_STANDARDS,
  GRIP_STANDARDS,
  initExamples
};

// CLI用法
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'init') {
    initExamples();
  } else if (command === 'prompt' && args[1]) {
    console.log(getEquipmentPrompt(args[1]));
  } else if (command === 'profile' && args[1]) {
    console.log(JSON.stringify(getEquipmentProfile(args[1]), null, 2));
  } else {
    console.log(`
角色武器装备系统 v1.1-Peng
============================

用法:
  node equipment-standardizer.js init              # 初始化示例角色
  node equipment-standardizer.js prompt <角色ID>   # 生成装备Prompt
  node equipment-standardizer.js profile <角色ID>    # 查看装备档案

可用装备标准:
${Object.entries(EQUIPMENT_STANDARDS).map(([k, v]) => `  ${k.padEnd(20)} : ${v.name} (${v.type})`).join('\n')}

可用持握方式:
${Object.entries(GRIP_STANDARDS).map(([k, v]) => `  ${k.padEnd(20)} : ${v.name} (${v.position})`).join('\n')}

角色档案示例（刑天）:
  武器1: 干（神盾）- 长方形四角盾 - 左手持
  武器2: 戚（战斧）- 单刃战斧 - 右手持
  关系: 干戚成对使用，攻防一体
  约束: 左右手不可互换
    `);
  }}
