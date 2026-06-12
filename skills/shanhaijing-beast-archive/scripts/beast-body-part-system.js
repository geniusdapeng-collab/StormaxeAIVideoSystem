/**
 * 山海经异兽部位表通用模块 v1.0-Peng
 * 
 * 设计目标：
 * 1. 内置16部位标准模板
 * 2. 从任意文本自动提取特征并填充部位表
 * 3. 自动生成CG电影级Prompt
 * 4. 支持：已有异兽 / 新增异兽 / 自创异兽
 * 
 * 使用方式：
 * ```javascript
 * const BeastBodyPartSystem = require('./beast-body-part-system.js');
 * 
 * // 模式1：已有异兽（自动从档案加载）
 * const baize = BeastBodyPartSystem.loadFromArchive('baize');
 * 
 * // 模式2：新增异兽（文本自动解析）
 * const newBeast = BeastBodyPartSystem.parseFromText({
 *   name: '雷霆兽',
 *   description: '形如巨狮，背生双翼，额有独角，通体雷电缠绕...'
 * });
 * 
 * // 模式3：自创异兽（完全自定义）
 * const custom = BeastBodyPartSystem.createCustom({
 *   body: { shape: 'serpentine', material: '水晶构成', ... },
 *   ...
 * });
 * 
 * // 生成Prompt
 * const prompt = baize.generatePrompt({ angle: 'front_fullbody' });
 * ```
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 一、16基干部位标准模板（所有异兽共有）
// ============================================================
const BODY_PART_TEMPLATE = {
  // 1. 主体躯干
  body: {
    has: true,
    shape: '',      // serpentine/draconic/therian/avian/amorphous/centaurine
    material: '',   // 材质结构
    texture: '',    // 纹理
    color: '',      // 颜色
    light: '',      // 发光
    detail: '',     // 关键特征
    scale: ''       // 体型大小
  },
  
  // 2. 头部
  head: {
    has: true,
    type: '',       // humanoid/draconic/lupine/vulpine/avian/ophidian/bovine/none
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 3. 面部
  face: {
    has: true,
    expression: '', // 表情气质
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 4. 视觉器官
  eyes: {
    has: true,
    count: 2,
    position: '',   // normal/forehead/underarm/side/vertical
    material: '',
    texture: '',
    color: '',
    light: '',      // 是否发光
    detail: ''
  },
  
  // 5. 角/冠
  horns: {
    has: false,
    count: 0,
    type: '',       // straight/curved/spiral/branched
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 6. 听觉器官
  ears: {
    has: true,
    type: '',       // external/middle/none/fin
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 7. 口部
  mouth: {
    has: true,
    type: '',       // normal/beak/fanged/tusked/sucker
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 8. 颈部
  neck: {
    has: true,
    length: '',     // long/short/none/multiple
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 9. 前肢
  forelimbs: {
    has: true,
    count: 2,
    type: '',       // arms/wings/fins/legs/none
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 10. 后肢
  hindlimbs: {
    has: true,
    count: 2,
    type: '',       // legs/wings/fins/none
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 11. 手部/前肢末端
  hands: {
    has: true,
    count: 2,
    type: '',       // claws/hooves/paws/fins/suckers/hands
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 12. 足部/后肢末端
  feet: {
    has: true,
    count: 2,
    type: '',       // claws/hooves/paws/fins/suckers/hands
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 13. 翼/翅
  wings: {
    has: false,
    count: 0,
    type: '',       // feathered/membranous/scaly/energy
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 14. 尾部
  tail: {
    has: true,
    count: 1,
    type: '',       // long/short/none/forked/feathered
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 15. 被覆系统
  coat: {
    has: true,
    type: '',       // fur/feathers/scales/shell/skin/chitin
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 16. 脊背/脊柱
  spine: {
    has: true,
    type: '',       // normal/ridged/spiked/humped
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  },
  
  // 17. 特殊器官（标志性特征）
  special: {
    has: false,
    name: '',       // 特殊器官名称
    material: '',
    texture: '',
    color: '',
    light: '',
    detail: ''
  }
};

// ============================================================
// 二、扩展字段模板
// ============================================================
const EXTENSION_TEMPLATE = {
  limb_count: 4,
  tail_count: 1,
  wing_count: 0,
  head_count: 1,
  eye_count: 2,
  body_shape: '',
  head_type: '',
  coat_type: '',
  limb_type: ''
};

// ============================================================
// 三、Aura气场模板
// ============================================================
const AURA_TEMPLATE = {
  presence: '',   // 威严/恐怖/华贵/温和
  wisdom: '',    // 智慧程度
  divine: '',    // 神圣/祥瑞/诅咒
  power: '',     // 力量表现
  malevolent: '' // 邪煞/凶暴/无害
};

// ============================================================
// 四、身体形态枚举
// ============================================================
const BODY_SHAPES = {
  serpentine: '蛇形（无足/长身）',
  draconic: '龙形（有翼/有足）',
  therian: '兽形（四足哺乳类）',
  avian: '鸟形（双翼/鸟足）',
  amorphous: '无定形（囊/云/液）',
  centaurine: '半人半兽（人形+兽身）',
  hybrid: '复合形（跨类混合）'
};

const HEAD_TYPES = {
  humanoid: '人面',
  draconic: '龙首',
  lupine: '狼首',
  vulpine: '狐首',
  avian: '鸟首',
  ophidian: '蛇首',
  bovine: '牛首',
  feline: '虎首/狮首',
  none: '无头'
};

const COAT_TYPES = {
  fur: '毛发',
  feathers: '羽毛',
  scales: '鳞片',
  shell: '甲壳',
  skin: '皮肤',
  chitin: '外骨骼'
};

// ============================================================
// 五、核心类：异兽部位表系统
// ============================================================
class BeastBodyPartSystem {
  constructor(options = {}) {
    this.archiveDir = options.archiveDir || path.join(__dirname, '../beasts');
    this.version = 'v1.0-Peng';
  }

  /**
   * 模式1：从档案加载已有异兽
   * @param {string} beastId - 异兽ID
   * @returns {BeastProfile} 异兽部位表对象
   */
  loadFromArchive(beastId) {
    const filePath = path.join(this.archiveDir, `${beastId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`异兽档案不存在: ${beastId}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return this._convertArchiveToBodyParts(data);
  }

  /**
   * 模式2：从文本描述自动解析
   * @param {Object} input - { name, description, origin? }
   * @returns {BeastProfile} 异兽部位表对象
   */
  parseFromText(input) {
    const { name, description, origin = '用户自定义' } = input;
    
    // 使用NLP规则从文本提取部位特征
    const extracted = this._extractFeaturesFromText(description);
    
    // 构建部位表
    return new BeastProfile({
      id: this._generateId(name),
      name,
      origin,
      parts: extracted.parts,
      extension: extracted.extension,
      aura: extracted.aura,
      rawDescription: description
    });
  }

  /**
   * 模式3：完全自定义创建
   * @param {Object} customParts - 自定义部位表
   * @returns {BeastProfile} 异兽部位表对象
   */
  createCustom(customParts) {
    return new BeastProfile({
      id: customParts.id || 'custom-' + Date.now(),
      name: customParts.name || '未命名异兽',
      origin: customParts.origin || '用户自创',
      parts: { ...BODY_PART_TEMPLATE, ...customParts.parts },
      extension: { ...EXTENSION_TEMPLATE, ...customParts.extension },
      aura: { ...AURA_TEMPLATE, ...customParts.aura }
    });
  }

  /**
   * 批量加载所有档案异兽
   * @returns {Array<BeastProfile>}
   */
  loadAllArchives() {
    const files = fs.readdirSync(this.archiveDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const id = f.replace('.json', '');
      try {
        return this.loadFromArchive(id);
      } catch (err) {
        console.warn(`加载失败 ${id}:`, err.message);
        return null;
      }
    }).filter(Boolean);
  }

  // ============================================================
  // 内部方法
  // ============================================================
  
  _convertArchiveToBodyParts(data) {
    const desc = data.appearance?.fullDescription || '';
    const extracted = this._extractFeaturesFromText(desc);
    
    return new BeastProfile({
      id: data.id,
      name: data.name,
      nameEn: data.nameEn,
      origin: data.origin,
      parts: extracted.parts,
      extension: extracted.extension,
      aura: extracted.aura,
      rawDescription: desc,
      abilities: data.abilities || [],
      story: data.story || '',
      symbolism: data.symbolism || '',
      scale: data.cinema?.scale || '大型（十米级）'
    });
  }

  _extractFeaturesFromText(text) {
    // 基于关键词规则的特征提取 - v2智能解析
    const parts = JSON.parse(JSON.stringify(BODY_PART_TEMPLATE));
    const extension = { ...EXTENSION_TEMPLATE };
    const aura = { ...AURA_TEMPLATE };
    
    // === 形态检测 ===
    if (text.includes('蛇')) { extension.body_shape = 'serpentine'; parts.body.shape = 'serpentine'; }
    else if (text.includes('龙')) { extension.body_shape = 'draconic'; parts.body.shape = 'draconic'; }
    else if (text.includes('鸟') || text.includes('鸡') || text.includes('凤')) { extension.body_shape = 'avian'; parts.body.shape = 'avian'; }
    else { extension.body_shape = 'therian'; parts.body.shape = 'therian'; }
    
    // === 头部检测 ===
    if (text.includes('人面') || text.includes('人脸')) { 
      extension.head_type = 'humanoid'; parts.head.type = 'humanoid'; 
      parts.head.material = '人面'; parts.head.detail = '人的面容';
    }
    else if (text.includes('龙首') || text.includes('龙头')) { 
      extension.head_type = 'draconic'; parts.head.type = 'draconic'; 
      parts.head.material = '龙头'; parts.head.detail = '龙首威严';
    }
    else if (text.includes('虎') || text.includes('狮')) { 
      extension.head_type = 'feline'; parts.head.type = 'feline'; 
      parts.head.material = '虎头/狮首'; parts.head.detail = '铜铃双眼，威严凶猛';
    }
    else if (text.includes('狐')) { 
      extension.head_type = 'vulpine'; parts.head.type = 'vulpine'; 
      parts.head.material = '狐首'; parts.head.detail = '精致狐面，双眼魅惑';
    }
    else if (text.includes('鸟') || text.includes('鸡')) { 
      extension.head_type = 'avian'; parts.head.type = 'avian'; 
      parts.head.material = '鸟首'; parts.head.detail = '鸡头/鸟喙';
    }
    
    // === 主体躯干智能提取 ===
    // 找"身"、"躯"、"体"相关描述
    const bodySentences = this._extractSentences(text, ['身', '躯', '体', '形']);
    if (bodySentences.length > 0) {
      parts.body.material = bodySentences[0].substring(0, 100);
      parts.body.detail = bodySentences.join(' ').substring(0, 150);
    }
    
    // 体型大小
    const sizeMatch = text.match(/([十百千万一二三四五六七八九\d]+)[丈尺米余]/);
    if (sizeMatch) {
      parts.body.scale = sizeMatch[0];
      parts.body.detail += `, 体型${sizeMatch[0]}`;
    }
    
    // === 材质/被覆检测 ===
    if (text.includes('鳞')) { 
      parts.body.texture = '鳞片覆盖'; parts.coat.type = 'scales'; extension.coat_type = 'scales'; 
      parts.coat.material = '鳞片'; parts.coat.detail = '鳞片如铠甲';
    }
    else if (text.includes('毛')) { 
      parts.body.texture = '毛发覆盖'; parts.coat.type = 'fur'; extension.coat_type = 'fur'; 
      parts.coat.material = '毛发'; parts.coat.detail = '毛发浓密';
    }
    else if (text.includes('羽')) { 
      parts.body.texture = '羽毛覆盖'; parts.coat.type = 'feathers'; extension.coat_type = 'feathers'; 
      parts.coat.material = '羽毛'; parts.coat.detail = '羽翼丰满';
    }
    else if (text.includes('壳') || text.includes('甲')) { 
      extension.coat_type = 'shell'; parts.coat.type = 'shell'; 
      parts.coat.material = '甲壳'; parts.coat.detail = '硬壳铠甲';
    }
    
    // 被覆颜色
    const coatColors = this._extractColors(text);
    if (coatColors.length > 0) {
      parts.coat.color = coatColors[0];
      parts.body.color = coatColors[0];
    }
    
    // === 肢体数量检测 ===
    const limbMatch = text.match(/(\d+)[只条根个]?[足脚腿]/);
    if (limbMatch) {
      extension.limb_count = parseInt(limbMatch[1]);
      parts.forelimbs.count = Math.floor(extension.limb_count / 2);
      parts.hindlimbs.count = Math.ceil(extension.limb_count / 2);
      parts.forelimbs.material = `${extension.limb_count}足`;
      parts.hindlimbs.material = `${extension.limb_count}足`;
    }
    if (text.includes('无足') || text.includes('无脚')) {
      extension.limb_count = 0;
      parts.forelimbs.has = false;
      parts.hindlimbs.has = false;
    }
    if (text.includes('六足')) { 
      extension.limb_count = 6; 
      parts.forelimbs.count = 3; parts.hindlimbs.count = 3;
      parts.forelimbs.material = '六足'; parts.hindlimbs.material = '六足';
    }
    
    // 肢体细节
    const limbDetail = this._extractSentences(text, ['爪', '蹄', '足', '掌']);
    if (limbDetail.length > 0) {
      parts.hands.material = limbDetail[0].substring(0, 80);
      parts.feet.material = limbDetail[0].substring(0, 80);
    }
    
    // === 尾部检测 ===
    const tailMatch = text.match(/(\d+)[条]?尾/);
    if (tailMatch) {
      extension.tail_count = parseInt(tailMatch[1]);
      parts.tail.count = extension.tail_count;
      parts.tail.material = `${extension.tail_count}尾`;
    }
    if (text.includes('无尾')) { extension.tail_count = 0; parts.tail.has = false; }
    if (text.includes('九尾')) { 
      extension.tail_count = 9; parts.tail.count = 9;
      parts.tail.material = '九尾'; parts.tail.detail = '每条尾巴代表百年修为';
    }
    
    // 尾部细节
    const tailDetail = this._extractSentences(text, ['尾']);
    if (tailDetail.length > 0) {
      parts.tail.detail = tailDetail[0].substring(0, 100);
    }
    
    // === 翅膀检测 ===
    if (text.includes('翼') || text.includes('翅') || text.includes('翅膀')) {
      const wingMatch = text.match(/(\d+)[对只]?翼/);
      extension.wing_count = wingMatch ? parseInt(wingMatch[1]) : 2;
      parts.wings.has = true;
      parts.wings.count = extension.wing_count;
      parts.wings.material = `${extension.wing_count}翼`;
      if (text.includes('翼膜')) { parts.wings.texture = '膜翼'; }
      else if (text.includes('羽')) { parts.wings.texture = '羽翼'; }
    }
    if (text.includes('四翼')) { 
      extension.wing_count = 4; parts.wings.count = 4;
      parts.wings.material = '四翼'; parts.wings.detail = '四翅如蝉翼';
    }
    
    // 翅膀细节
    const wingDetail = this._extractSentences(text, ['翼', '翅']);
    if (wingDetail.length > 0) {
      parts.wings.detail = wingDetail[0].substring(0, 100);
    }
    
    // === 头部数量检测 ===
    const headMatch = text.match(/(\d+)[个颗]?头/);
    if (headMatch) {
      extension.head_count = parseInt(headMatch[1]);
      parts.head.count = extension.head_count;
      parts.head.material = `${extension.head_count}首`;
    }
    if (text.includes('九首')) { 
      extension.head_count = 9; parts.head.count = 9;
      parts.head.material = '九首'; parts.head.detail = '九张人面';
    }
    if (text.includes('无头') || text.includes('无面目')) { 
      extension.head_count = 0; parts.head.has = false; 
      parts.head.material = '无头/无面目';
    }
    
    // === 面部细节 ===
    const faceDetail = this._extractSentences(text, ['面', '脸', '表', '容']);
    if (faceDetail.length > 0) {
      parts.face.material = faceDetail[0].substring(0, 100);
    }
    
    // === 眼睛检测 ===
    if (text.includes('眼') || text.includes('目')) {
      parts.eyes.has = true;
      if (text.includes('腋下') && text.includes('眼')) { 
        parts.eyes.position = 'underarm'; parts.eyes.detail = '腋下生眼'; 
      }
      else if (text.includes('竖直') || text.includes('直目')) { 
        parts.eyes.position = 'vertical'; parts.eyes.detail = '竖直双目'; 
      }
      else if (text.includes('复眼')) { 
        parts.eyes.position = 'compound'; parts.eyes.detail = '复眼'; 
      }
      
      // 颜色
      if (text.includes('红')) { parts.eyes.color = '红色'; }
      else if (text.includes('金') || text.includes('黄')) { parts.eyes.color = '金色/琥珀'; }
      else if (text.includes('碧') || text.includes('绿')) { parts.eyes.color = '碧绿'; }
      else if (text.includes('紫')) { parts.eyes.color = '紫色'; }
      
      // 特征
      if (text.includes('凶光')) { parts.eyes.light = '凶光'; }
      if (text.includes('火焰')) { parts.eyes.light = '燃烧火焰'; }
      if (text.includes('闪电')) { parts.eyes.light = '闪电'; }
      
      // 眼睛细节
      const eyeDetail = this._extractSentences(text, ['眼', '目']);
      if (eyeDetail.length > 0) {
        parts.eyes.material = eyeDetail[0].substring(0, 100);
      }
    }
    
    // === 角检测 ===
    if (text.includes('角')) {
      parts.horns.has = true;
      const hornMatch = text.match(/(\d+)[个根只]?角/);
      parts.horns.count = hornMatch ? parseInt(hornMatch[1]) : 1;
      parts.horns.material = '角';
      if (text.includes('螺旋')) { parts.horns.type = 'spiral'; parts.horns.detail = '螺旋纹路'; }
      else if (text.includes('分叉')) { parts.horns.type = 'branched'; }
      else { parts.horns.type = 'straight'; }
      
      if (text.includes('独')) { parts.horns.count = 1; parts.horns.material = '独角'; }
      
      // 角细节
      const hornDetail = this._extractSentences(text, ['角']);
      if (hornDetail.length > 0) {
        parts.horns.material = hornDetail[0].substring(0, 100);
      }
    }
    
    // === 口部检测 ===
    if (text.includes('口') || text.includes('嘴') || text.includes('喙')) {
      parts.mouth.has = true;
      if (text.includes('喙')) { parts.mouth.type = 'beak'; parts.mouth.material = '鸟喙'; }
      else if (text.includes('牙') || text.includes('齿')) { 
        parts.mouth.type = 'fanged'; parts.mouth.material = '利齿'; 
      }
      else { parts.mouth.type = 'normal'; parts.mouth.material = '口'; }
      
      if (text.includes('大') && text.includes('口')) { 
        parts.mouth.detail = '巨口'; 
      }
      
      // 嘴部细节
      const mouthDetail = this._extractSentences(text, ['口', '嘴', '喙', '牙']);
      if (mouthDetail.length > 0) {
        parts.mouth.detail = mouthDetail[0].substring(0, 100);
      }
    }
    
    // === 颈部检测 ===
    const neckDetail = this._extractSentences(text, ['颈', '脖']);
    if (neckDetail.length > 0) {
      parts.neck.material = neckDetail[0].substring(0, 100);
    }
    if (text.includes('长颈')) { parts.neck.length = 'long'; }
    else if (text.includes('短颈')) { parts.neck.length = 'short'; }
    
    // === 脊背检测 ===
    const spineDetail = this._extractSentences(text, ['背', '脊']);
    if (spineDetail.length > 0) {
      parts.spine.material = spineDetail[0].substring(0, 100);
    }
    
    // === 特殊器官检测 ===
    if (text.includes('火精')) { 
      parts.special.has = true; parts.special.name = '火精'; 
      parts.special.material = '口中衔持永恒燃烧的神圣火焰'; 
    }
    if (text.includes('光环') || text.includes('背光')) { 
      parts.special.has = true; parts.special.name = '光环'; 
      parts.special.material = '身后智慧光环如佛教背光'; 
    }
    if (text.includes('祥云')) { 
      parts.special.has = true; parts.special.name = '祥云'; 
      parts.special.material = '脚下祥云'; 
    }
    if (text.includes('雷电') || text.includes('闪电')) {
      parts.special.has = true; parts.special.name = '雷电'; 
      parts.special.material = '通体雷电缠绕'; parts.special.light = '闪电';
    }
    
    // === Aura检测 ===
    if (text.includes('祥瑞') || text.includes('太平')) { aura.divine = '祥瑞之气'; }
    if (text.includes('凶') || text.includes('恶') || text.includes('恐怖')) { aura.malevolent = '凶暴恐怖'; }
    if (text.includes('智慧') || text.includes('知万物') || text.includes('通晓')) { aura.wisdom = '通天晓地'; }
    if (text.includes('威严') || text.includes('神圣')) { aura.presence = '威严神圣'; }
    if (text.includes('温和') || text.includes('善良')) { aura.presence = '温和祥瑞'; }
    if (text.includes('贪') || text.includes('欲')) { aura.malevolent = '贪欲无度'; }
    if (text.includes('威风') || text.includes('霸气')) { aura.presence = '威风凛凛'; }
    if (text.includes('雷电') || text.includes('闪电')) { aura.power = '操控雷电'; }
    
    return { parts, extension, aura };
  }

  /**
   * 从文本中提取包含关键词的句子
   */
  _extractSentences(text, keywords) {
    const sentences = text.split(/[。\.\n]/).filter(s => s.trim().length > 0);
    return sentences.filter(s => keywords.some(k => s.includes(k)));
  }

  /**
   * 从文本中提取颜色词
   */
  _extractColors(text) {
    const colorKeywords = ['红', '赤', '橙', '黄', '金', '绿', '青', '蓝', '紫', '白', '黑', '灰', '褐'];
    return colorKeywords.filter(c => text.includes(c));
  }

  _generateId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
}

// ============================================================
// 六、异兽部位表对象
// ============================================================
class BeastProfile {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.origin = data.origin;
    this.parts = data.parts;
    this.extension = data.extension;
    this.aura = data.aura;
    this.rawDescription = data.rawDescription || '';
    this.abilities = data.abilities || [];
    this.story = data.story || '';
    this.symbolism = data.symbolism || '';
    this.scale = data.scale || '大型（十米级）';
  }

  /**
   * 生成渲染Prompt
   * @param {Object} options - { angle: 'front_fullbody', style: 'CG', includeAura: true }
   * @returns {string} 完整Prompt
   */
  generatePrompt(options = {}) {
    const { angle = 'front_fullbody', style = 'CG hyper-realistic', includeAura = true } = options;
    
    // 角度聚焦映射
    const angleFocus = this._getAngleFocus(angle);
    
    // 构建基础Prompt
    let prompt = `${style} `;
    prompt += `character design sheet of ${this.name}, `;
    prompt += `${this.extension.body_shape} beast, `;
    
    // 按聚焦优先级添加部位
    const priorityParts = angleFocus.priority || ['body', 'head', 'coat'];
    for (const partId of priorityParts) {
      const part = this.parts[partId];
      if (part && part.has) {
        const desc = this._buildPartDescription(partId, part);
        if (desc) prompt += desc + ', ';
      }
    }
    
    // 添加Aura
    if (includeAura) {
      const auraDesc = this._buildAuraDescription();
      if (auraDesc) prompt += auraDesc + ', ';
    }
    
    // 角度特定描述
    const angleDesc = this._getAngleSpecificDescription(angle);
    if (angleDesc) prompt += angleDesc + ', ';
    
    // 质量锚点
    prompt += 'professional studio lighting, neutral gradient background, 8K, ultra-detailed';
    
    return prompt;
  }

  /**
   * 生成完整部位表JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      origin: this.origin,
      parts: this.parts,
      extension: this.extension,
      aura: this.aura,
      scale: this.scale
    };
  }

  // ============================================================
  // 内部方法
  // ============================================================

  _getAngleFocus(angle) {
    const focusMap = {
      front_fullbody: { priority: ['body', 'head', 'face', 'coat', 'forelimbs', 'hindlimbs'], desc: 'front view full body' },
      side_profile: { priority: ['body', 'head', 'neck', 'tail', 'coat'], desc: 'side view profile' },
      back_fullbody: { priority: ['body', 'spine', 'tail', 'coat', 'hindlimbs'], desc: 'back view full body' },
      three_quarter: { priority: ['head', 'body', 'forelimbs', 'coat'], desc: 'three-quarter view' },
      face_closeup: { priority: ['face', 'eyes', 'horns', 'ears', 'mouth'], desc: 'face close-up portrait' },
      action_running: { priority: ['forelimbs', 'hindlimbs', 'body', 'tail'], desc: 'dynamic running pose' },
      action_sitting: { priority: ['body', 'forelimbs', 'hindlimbs', 'tail', 'coat'], desc: 'sitting resting pose' },
      hand_detail: { priority: ['hands', 'feet', 'forelimbs', 'hindlimbs'], desc: 'limbs extremities detail' }
    };
    return focusMap[angle] || focusMap.front_fullbody;
  }

  _buildPartDescription(partId, part) {
    const parts = [];
    if (part.material) parts.push(part.material);
    if (part.texture) parts.push(part.texture);
    if (part.color) parts.push(part.color);
    if (part.light) parts.push(part.light);
    if (part.detail) parts.push(part.detail);
    
    return parts.join(', ');
  }

  _buildAuraDescription() {
    const auras = [];
    if (this.aura.presence) auras.push(this.aura.presence);
    if (this.aura.wisdom) auras.push(this.aura.wisdom);
    if (this.aura.divine) auras.push(this.aura.divine);
    if (this.aura.power) auras.push(this.aura.power);
    if (this.aura.malevolent) auras.push(this.aura.malevolent);
    return auras.join(', ');
  }

  _getAngleSpecificDescription(angle) {
    const descs = {
      front_fullbody: 'standing front facing camera',
      side_profile: 'side profile showing full body silhouette',
      back_fullbody: 'back view showing spine and tail',
      three_quarter: 'three-quarter angle showing depth',
      face_closeup: 'facial features extreme detail',
      action_running: 'mid-stride dynamic pose',
      action_sitting: 'resting seated posture',
      hand_detail: 'extremities claws paws hooves detail'
    };
    return descs[angle];
  }
}

// ============================================================
// 导出
// ============================================================
module.exports = {
  BeastBodyPartSystem,
  BeastProfile,
  BODY_PART_TEMPLATE,
  EXTENSION_TEMPLATE,
  AURA_TEMPLATE,
  BODY_SHAPES,
  HEAD_TYPES,
  COAT_TYPES
};

// 如果直接运行，测试三种模式
if (require.main === module) {
  console.log('=== 山海经异兽部位表通用模块 v1.0-Peng ===\n');
  
  const system = new BeastBodyPartSystem();
  
  // 测试模式1：从档案加载
  console.log('【模式1】从档案加载白泽...');
  const baize = system.loadFromArchive('baize');
  console.log(`✅ 白泽: ${baize.name}, 部位覆盖: ${Object.keys(baize.parts).length}/17`);
  console.log(`   形态: ${baize.extension.body_shape}, 头部: ${baize.extension.head_type}`);
  const prompt1 = baize.generatePrompt({ angle: 'front_fullbody' });
  console.log(`   Prompt长度: ${prompt1.length}字符`);
  console.log(`   预览: ${prompt1.substring(0, 120)}...\n`);
  
  // 测试模式2：从文本解析
  console.log('【模式2】从文本解析自创异兽...');
  const thunder = system.parseFromText({
    name: '雷霆兽',
    description: '形如巨狮，背生双翼，额有独角，通体雷电缠绕，双目如闪电般耀眼，四足踏火，威风凛凛'
  });
  console.log(`✅ 雷霆兽: ${thunder.name}, 形态: ${thunder.extension.body_shape}`);
  console.log(`   肢体: ${thunder.extension.limb_count}, 翅膀: ${thunder.extension.wing_count}`);
  const prompt2 = thunder.generatePrompt({ angle: 'front_fullbody' });
  console.log(`   Prompt预览: ${prompt2.substring(0, 120)}...\n`);
  
  // 测试模式3：完全自定义
  console.log('【模式3】完全自定义...');
  const crystal = system.createCustom({
    name: '晶龙',
    parts: {
      body: { has: true, shape: 'draconic', material: '水晶构成', texture: '透明晶体', color: '冰蓝', light: '内部发光', detail: '10米长' },
      head: { has: true, type: 'draconic', material: '龙头', texture: '晶面', color: '透明', light: '眼发光', detail: '独角' },
      wings: { has: true, count: 2, type: 'crystalline', material: '冰晶翼', texture: '透明', color: '冰蓝', light: '折射光芒', detail: '膜翼如钻石' }
    },
    extension: {
      body_shape: 'draconic',
      head_type: 'draconic',
      limb_count: 4,
      wing_count: 2,
      coat_type: 'shell'
    },
    aura: {
      presence: '冰冷威严',
      power: '操控寒冰'
    }
  });
  console.log(`✅ 晶龙: ${crystal.name}, 形态: ${crystal.extension.body_shape}`);
  const prompt3 = crystal.generatePrompt({ angle: 'front_fullbody' });
  console.log(`   Prompt预览: ${prompt3.substring(0, 120)}...\n`);
  
  console.log('=== 测试完成 ===');
}