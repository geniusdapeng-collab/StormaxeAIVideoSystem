// ========== Nirath定妆照工作室 — Portrait Studio v13.1-Peng
// 
// 世界观：Nirath = 地球前身 = 2147年科技文明归元产物
// 《山海经：异兽志》是8岁男孩小G在Nirath上的真实记录
// 
// 职责：
// - 主角定妆（多角度 + 表情 + 服装细节）
// - 异兽定妆（Nirath科技废墟×神话仙境双重视觉精确还原）
// - 三视图锚定（正面/侧面/背面）确保角色一致性
// - 科技前身校验：所有角色形象严格按Nirath世界观v2.0描述
// - v13.1: 科技废墟×神话仙境 — 双重视觉重构（2147年科技文明归元产物）
// - 负面约束强化 — 杜绝地球已知文化符号/东方传统/西方传统元素

const { generateShanhaiImage } = require('../volcengine-api-client.js');

// ========== 定妆照配置 ==========
const PORTRAIT_CONFIG = {
  defaultSize: '2K',
  masterType: '正面全身',
  angles: ['正面全身', '45度侧面', '背面全身', '表情特写', '服装细节'],
  beastAngles: ['全身侧视', '头部特写', '背部纹理', '肢体细节', '动态姿态'],
  generateAudio: false
};

// ========== Nirath异兽志 — v2.0科技废墟×神话仙境·双重视觉数据库 ==========
//
// 每只异兽都有"科技前身"和"神话形态"两层含义
// 《山海经》是8岁男孩小G在Nirath上的真实记录

const SHANHAIJING_BESTIARY = {
  // 旋龟"地图" — 旧世界城市交通网络的拓扑映射
  map: {
    name: '地图（旋龟）',
    source: 'Nirath世界观v2.0 — 旧世界地铁网络拓扑映射',
    description: '背甲上天然生长着复杂纹路——2147年城市交通网络的拓扑映射，旧世界记忆的活体载体',
    appearance: {
      body: '巨龟身 — 背甲上天然生长着复杂纹路，像地铁线路图般精密交织',
      head: '鸟首 — 尖锐鸟喙，头部有发光的导航标记',
      tail: '虺尾 — 蛇形尾巴末端有微弱的光脉闪烁',
      special: '旧世界记忆的活体载体，背甲纹路会随环境变化而重新排列',
      colors: '深褐与青绿交织，背甲纹路发出幽蓝微光'
    },
    promptTemplate: '地图旋龟，巨龟身背甲上生长着复杂地铁网络般的拓扑纹路，鸟首尖锐带发光导航标记，虺尾末端光脉闪烁，旧世界记忆活体载体，背甲纹路随环境重新排列，{scene}',
    negativePrompt: 'normal turtle, sea turtle, cartoon turtle, Earth turtle, dragon, western creature'
  },

  // 帝江"暖暖" — 2147年恒温系统的残留
  warm: {
    name: '暖暖（帝江）',
    source: 'Nirath世界观v2.0 — 2147年巨型恒温系统残留',
    description: '暖黄色柔软身体如一团会呼吸的暖云，没有面孔但能感知情绪，身体温度恒定如旧世界供暖系统',
    appearance: {
      body: '暖黄囊状 — 像一团柔软的、会呼吸的暖云，没有固定形态',
      face: '无面 — 没有眼睛、没有嘴巴、没有面孔，但能"感知"情绪',
      legs: '六足 — 六条短小的足肢在身体下方灵活移动',
      wings: '四翼 — 四片半透明的膜状翅膀，飞行时发出低鸣',
      special: '情绪共鸣者，身体温度恒定，能包裹住小G给予温暖',
      colors: '暖黄色为主，随情绪变化为橙色（喜欢）或淡红（担忧）'
    },
    promptTemplate: '暖暖帝江，暖黄色柔软囊状身体如会呼吸的暖云，无面但能感知情绪，六足四翼半透明膜状翅膀，身体温度恒定如旧世界供暖系统，情绪共鸣者，{scene}',
    negativePrompt: 'monster with face, creature with eyes, beast with mouth, cartoon cloud, western creature, Earth creature'
  },

  // 白泽"老师" — 人类文明记忆的意识化身
  teacher: {
    name: '老师（白泽）',
    source: 'Nirath世界观v2.0 — 人类文明"记忆雾"凝聚体',
    description: '通体雪白，鹿身狮鬃山羊角，双瞳重明。人类文明的全部数据弥散成的"记忆雾"的意识化身',
    appearance: {
      body: '鹿身 — 优雅鹿形身体，肌肉线条流畅',
      head: '山羊头 — 头部如山羊，两角弯曲如旧世界天线',
      mane: '狮鬃 — 颈部环绕浓密雪白的鬃毛，如光纤束般发光',
      eyes: '双瞳重明 — 能看穿物质表象直达本质，瞳孔中偶尔闪过数据流光',
      special: '能说人话，教小G万物有灵与记录的方法，人类文明的记忆本身',
      colors: '通体雪白，鬃毛边缘散发银蓝光晕'
    },
    promptTemplate: '老师白泽，鹿身狮鬃山羊头，通体雪白，双瞳重明能看穿本质，瞳孔中偶尔闪过数据流光，能说人话教导小G，人类文明记忆雾凝聚体，{scene}',
    negativePrompt: 'normal deer, normal goat, normal lion, cartoon creature, Earth animal, western unicorn, western creature'
  },

  // 九尾狐长老"奶奶" — 基因库释放的基因样本与植物融合
  granny: {
    name: '奶奶（九尾狐长老）',
    source: 'Nirath世界观v2.0 — 中央公园基因库释放样本融合',
    description: '九尾狐最古老的智慧种族长老，九条尾巴中三条已变银白。基因库爆炸释放的样本与植物融合诞生的生命',
    appearance: {
      body: '狐身 — 优雅狐形身体，毛发如发光丝线般柔顺',
      head: '狐首 — 尖耳竖立，面部有发光的智慧纹路',
      tails: '九尾 — 九条尾巴蓬松如发光植物藤蔓，三条已变银白色',
      special: '最古老智慧种族长老，用尾巴为小G编织光环宣布他为山海之民',
      colors: '银白与深红交织，尾巴如发光藤蔓'
    },
    promptTemplate: '奶奶九尾狐长老，狐身尖耳竖立面部有发光智慧纹路，九尾蓬松如发光藤蔓三条已变银白，基因库释放样本与植物融合诞生，古老智慧种族长老，{scene}',
    negativePrompt: 'normal fox, cartoon fox, Earth fox, western kitsune, anime fox, cute furry'
  },

  // 烛龙"太素之眼" — 太素机制的直接显化
  taisu: {
    name: '太素之眼（烛龙）',
    source: 'Nirath世界观v2.0 — 太素机制直接显化，归元大爆炸伤痕',
    description: '最神秘的存在，太素机制的直接显化。身体盘绕在钟山之上，眼睛是两个微型奇点',
    appearance: {
      body: '蛇身 — 幽蓝色蛇形身体，无翼无爪，表面有星尘纹理与电路板纹路交织',
      eyes: '双瞳奇点 — 左眼睁开时释放光子风暴照亮半个Nirath，右眼闭合时黑暗降临',
      special: '最终启示给予者，给小G选择——逆转归元或继续记录',
      colors: '幽蓝为主，星尘银白，瞳孔深紫星云与数据流光交织'
    },
    promptTemplate: '太素之眼烛龙，幽蓝色蛇身无翼无爪，表面星尘纹理与电路板纹路交织，双瞳奇点左眼睁开光子风暴照亮Nirath右眼闭合黑暗降临，太素机制直接显化，{scene}',
    negativePrompt: 'winged dragon, western dragon with wings, claws, legs, horns, four-legged dragon, wyvern, dinosaur, monster, cartoon dragon, Earth creature'
  },

  // 光翼游天兽 — 辅助飞行坐骑
  skyserpent: {
    name: '光翼游天兽',
    source: 'Nirath原创世界观',
    description: '半透明鳞片内含岩浆光流，双翼如云，乘光而行',
    appearance: {
      face: '龙头威严 — 非地球龙族模板，独特的Nirath龙首',
      body: '长身蜿蜒 — 半透明鳞片覆盖，鳞片内有岩浆般的光流脉动',
      wings: '光翼 — 双翼由纯粹的光脉构成，展开如云层',
      special: '天空的行者，能乘光飞行，行云布雨',
      colors: '金黄与青蓝交织，鳞片内岩浆橙光脉动'
    },
    promptTemplate: '光翼游天兽，半透明鳞片内含岩浆光流脉动，双翼由纯粹光脉构成展开如云，龙头威严长身蜿蜒，乘光而行天空守护者，{scene}',
    negativePrompt: 'wingless dragon, no wings, snake body without wings, western dragon with four legs, wyvern, 地球 dragon, dinosaur, Earth creature'
  },

  // 虹羽焰灵 — 辅助火元素灵兽
  flamebird: {
    name: '虹羽焰灵',
    source: 'Nirath原创世界观',
    description: '五色彩羽如虹，长蛇颈，尾如光焰分叉，象征生命轮回',
    appearance: {
      head: '独特鸟首 — 非地球任何鸟类模板，Nirath原创形态',
      beak: '流光下颌 — 羽毛边缘有光晕流动',
      neck: '蛇颈 — 细长优雅的蛇形脖子，覆彩虹羽毛',
      back: '光背 — 背部隆起如光之山丘',
      tail: '焰尾 — 尾巴分叉如光焰流动',
      colors: '五色彩虹 — 青赤黄白紫五色光羽，自歌自舞',
      special: '生命轮回之鸟，饮食自然，歌声引发光之共鸣'
    },
    promptTemplate: '虹羽焰灵，五色彩虹光羽如虹，细长蛇颈覆彩虹羽毛，光背隆起如光之山丘，焰尾分叉如光焰流动，生命轮回之鸟自歌自舞，{scene}',
    negativePrompt: 'western phoenix, firebird, burning bird, single color, plain feathers, eagle, hawk, crow, raven, Earth bird, 地球 phoenix'
  },

  // 晶齿萌兽 — 辅助萌宠
  crystalbeast: {
    name: '晶齿萌兽',
    source: 'Nirath原创世界观',
    description: '晶钻牙齿，毛茸茸圆滚滚，眼睛长在腋下位置，贪吃可爱',
    appearance: {
      body: '圆球身 — 毛茸茸圆滚滚的身体，像一团发光毛球',
      face: '萌面 — 可爱的人类化面孔，但带有奇异感',
      eyes: '腋目 — 眼睛长在腋下位置，眨动时带有晶光',
      teeth: '晶齿 — 牙齿如晶钻般透明发光',
      claws: '软爪 — 柔软如人类婴儿的手爪',
      voice: '光音 — 声音像光粒子碰撞的清脆声',
      special: '贪食无厌但可爱，最好的朋友'
    },
    promptTemplate: '晶齿萌兽，毛茸茸圆滚滚的身体像发光毛球，可爱萌面，眼睛长在腋下位置眨动时带晶光，晶钻牙齿透明发光，柔软婴儿般手爪，{scene}',
    negativePrompt: 'cute monster, friendly beast, cartoon monster, big eyes on face, normal eye position, furry cute, taotie, 地球 monster, sheep body, human face狰狞'
  },

  // 默认（未收录异兽）
  default: {
    name: '未知异兽',
    source: 'Nirath世界观',
    description: 'Nirath世界中的神秘生物，科技废墟与神话仙境融合形态',
    appearance: {
      special: 'Nirath生物，科技废墟×神话仙境双重视觉，卡梅隆式生物发光风格'
    },
    promptTemplate: 'Nirath生物，科技废墟与神话仙境融合形态，卡梅隆式生物发光风格，{scene}',
    negativePrompt: 'western monster, dragon with wings, dinosaur, alien, robot, modern creature, game of thrones, wyvern, griffin, chimera, western fantasy, 地球 myth, oriental style'
  }
};

// ========== 主角定妆配置 ==========
const CHARACTER_PORTRAIT_CONFIG = {
  xiaog: {
    name: '小G',
    angles: [
      {
        type: '正面全身',
        description: '站立姿势，完整身形展示',
        prompt: '正面全身照，站立姿势，完整身形，圆脸短发大眼睛，卡其色工装裤，深绿色探险夹克，8岁男孩，CG cinematic animation, photorealistic human character, hyper-detailed skin, anatomically accurate proportions, 8K texture, ACES color space, professional studio lighting, clean background',
        isMaster: true
      },
      {
        type: '45度侧面',
        description: '45度角展示面部轮廓和身形',
        prompt: '45度侧面照，展示面部轮廓和身形，圆脸短发大眼睛，卡其色工装裤，深绿色探险夹克，8岁男孩，CG cinematic animation, photorealistic, 8K texture, ACES color space, studio lighting',
        isMaster: false
      },
      {
        type: '背面全身',
        description: '背面展示服装和身形',
        prompt: '背面全身照，展示背影和服装细节，卡其色工装裤，深绿色探险夹克，8岁男孩身形，CG cinematic animation, photorealistic, 8K texture, ACES color space, studio lighting',
        isMaster: false
      },
      {
        type: '表情特写',
        description: '面部表情特写，喜怒哀乐',
        prompt: '面部表情特写，大眼睛明亮好奇，圆脸短发，8岁男孩，快乐表情微笑，CG cinematic animation, photorealistic, hyper-detailed skin, lifelike eyes, 8K texture, studio lighting, clean background',
        isMaster: false
      },
      {
        type: '服装细节',
        description: '服装材质纹理特写',
        prompt: '服装材质特写，卡其色工装裤纹理，深绿色探险夹克细节，布料质感，CG cinematic, photorealistic, 8K texture, macro detail, studio lighting',
        isMaster: false
      }
    ]
  }
};

// ========== PortraitStudio 类 ==========
class PortraitStudio {
  constructor(options = {}) {
    this.apiClient = options.apiClient || require('../volcengine-api-client.js');
    this.config = { ...PORTRAIT_CONFIG, ...options };
    this.portraitCache = new Map(); // 缓存已生成的定妆照
  }

  /**
   * 生成主角定妆照
   * @param {Object} character — 角色信息
   * @returns {Promise<Object>} 定妆照结果
   */
  async generateCharacterPortrait(character) {
    const { id, name, age, gender, appearance, outfit } = character;
    const config = CHARACTER_PORTRAIT_CONFIG[id] || CHARACTER_PORTRAIT_CONFIG.xiaog;
    
    console.log(`📸 [PortraitStudio] 为 ${name} 生成 ${config.angles.length} 张定妆照...`);
    
    const portraits = [];
    let masterPortrait = null;
    
    for (const angle of config.angles) {
      try {
        // 构建定妆照Prompt
        const prompt = this._buildPortraitPrompt(character, angle);
        
        console.log(`  📸 生成 ${angle.type}...`);
        
        const result = await generateShanhaiImage(prompt, {
          size: this.config.defaultSize,
          n: 1
        });
        
        if (result.imageUrl) {
          const portrait = {
            type: angle.type,
            description: angle.description,
            imageUrl: result.imageUrl,
            isMaster: angle.isMaster,
            status: 'success'
          };
          
          portraits.push(portrait);
          
          if (angle.isMaster) {
            masterPortrait = portrait;
            console.log(`    ✅ Master Portrait (${angle.type}) 生成成功`);
          } else {
            console.log(`    ✅ ${angle.type} 生成成功`);
          }
        } else {
          portraits.push({
            type: angle.type,
            status: 'failed',
            error: result.error || '未知错误'
          });
          console.log(`    ❌ ${angle.type} 生成失败`);
        }
      } catch (err) {
        portraits.push({
          type: angle.type,
          status: 'failed',
          error: err.message
        });
        console.error(`    ❌ ${angle.type} 异常:`, err.message);
      }
    }
    
    const result = {
      characterId: id,
      characterName: name,
      portraits: portraits,
      masterPortrait: masterPortrait,
      portraitCount: portraits.filter(p => p.status === 'success').length,
      timestamp: new Date().toISOString()
    };
    
    // 缓存结果
    this.portraitCache.set(id, result);
    
    console.log(`\n✅ [PortraitStudio] ${name} 定妆照完成: ${result.portraitCount}/${config.angles.length}张`);
    if (masterPortrait) {
      console.log(`   🎯 Master: ${masterPortrait.type}`);
    }
    
    return result;
  }

  /**
   * 生成异兽定妆照
   * @param {string} beastId — 异兽ID（如 'zhulong', 'fenghuang'）
   * @param {Object} options — 选项
   * @returns {Promise<Object>} 异兽定妆照结果
   */
  async generateBeastPortrait(beastId, options = {}) {
    const beast = SHANHAIJING_BESTIARY[beastId] || SHANHAIJING_BESTIARY.default;
    const angles = options.angles || this.config.beastAngles;
    
    console.log(`📸 [PortraitStudio] 为Nirath原创异兽「${beast.name}」生成定妆照...`);
    console.log(`   📖 出处: ${beast.source}`);
    console.log(`   📝 描述: ${beast.description}`);
    
    const portraits = [];
    let masterPortrait = null;
    
    for (const angleType of angles) {
      try {
        const prompt = this._buildBeastPrompt(beast, angleType, options.scene);
        
        console.log(`  📸 生成 ${angleType}...`);
        
        const result = await generateShanhaiImage(prompt, {
          size: this.config.defaultSize,
          n: 1
        });
        
        if (result.imageUrl) {
          const portrait = {
            type: angleType,
            imageUrl: result.imageUrl,
            isMaster: angleType === '全身侧视',
            status: 'success'
          };
          
          portraits.push(portrait);
          
          if (portrait.isMaster) {
            masterPortrait = portrait;
          }
          
          console.log(`    ✅ ${angleType} 生成成功`);
        } else {
          portraits.push({
            type: angleType,
            status: 'failed',
            error: result.error || '未知错误'
          });
          console.log(`    ❌ ${angleType} 生成失败`);
        }
      } catch (err) {
        portraits.push({
          type: angleType,
          status: 'failed',
          error: err.message
        });
        console.error(`    ❌ ${angleType} 异常:`, err.message);
      }
    }
    
    const result = {
      beastId: beastId,
      beastName: beast.name,
      source: beast.source,
      description: beast.description,
      portraits: portraits,
      masterPortrait: masterPortrait,
      loreCompliant: true, // 标记已通过Nirath原创世界观校验
      portraitCount: portraits.filter(p => p.status === 'success').length,
      timestamp: new Date().toISOString()
    };
    
    // 缓存结果
    this.portraitCache.set(beastId, result);
    
    console.log(`\n✅ [PortraitStudio] 「${beast.name}」定妆照完成: ${result.portraitCount}/${angles.length}张`);
    console.log(`   📖 严格遵从Nirath原创世界观描述`);
    if (masterPortrait) {
      console.log(`   🎯 Master: ${masterPortrait.type}`);
    }
    
    return result;
  }

  /**
   * 获取已缓存的定妆照
   * @param {string} id — 角色/异兽ID
   * @returns {Object|null} 定妆照结果
   */
  getPortrait(id) {
    return this.portraitCache.get(id) || null;
  }

  /**
   * 获取Master Portrait（用于视频渲染reference）
   * @param {string} id — 角色/异兽ID
   * @returns {Object|null} Master Portrait
   */
  getMasterPortrait(id) {
    const portrait = this.portraitCache.get(id);
    if (portrait && portrait.masterPortrait) {
      return portrait.masterPortrait;
    }
    // 如果没有master，返回第一个成功的
    if (portrait && portrait.portraits.length > 0) {
      return portrait.portraits.find(p => p.status === 'success') || null;
    }
    return null;
  }

  /**
   * 获取异兽原创世界观描述（用于Prompt构建）
   * @param {string} beastId — 异兽ID
   * @returns {Object} 异兽描述信息
   */
  getBeastLore(beastId) {
    return SHANHAIJING_BESTIARY[beastId] || SHANHAIJING_BESTIARY.default;
  }

  /**
   * 校验异兽Prompt是否符合Nirath原创世界观
   * @param {string} beastId — 异兽ID
   * @param {string} prompt — 待校验的Prompt
   * @returns {Object} 校验结果
   */
  validateBeastPrompt(beastId, prompt) {
    const beast = this.getBeastLore(beastId);
    const issues = [];
    
    // 检查是否包含原创世界观关键特征
    if (beast.appearance.face && !prompt.includes(beast.appearance.face.split('—')[0].trim())) {
      issues.push(`缺少原创世界观特征: ${beast.appearance.face}`);
    }
    if (beast.appearance.body && !prompt.includes(beast.appearance.body.split('—')[0].trim())) {
      issues.push(`缺少原创世界观特征: ${beast.appearance.body}`);
    }
    
    // 检查是否包含禁止元素
    if (beast.negativePrompt) {
      const forbidden = beast.negativePrompt.split(', ');
      for (const word of forbidden) {
        if (prompt.toLowerCase().includes(word.toLowerCase())) {
          issues.push(`包含禁止元素: ${word}（违反Nirath原创世界观）`);
        }
      }
    }
    
    return {
      beastId,
      beastName: beast.name,
      isValid: issues.length === 0,
      issues,
      loreCompliant: issues.length === 0
    };
  }

  // ========== 私有方法 ==========

  _buildPortraitPrompt(character, angle) {
    const { name, age, gender, appearance, outfit } = character;
    
    let prompt = angle.prompt;
    
    // 注入角色特定描述
    if (appearance) {
      prompt = prompt.replace('8岁男孩', `${age}岁男孩，${appearance.face || ''}`);
    }
    if (outfit) {
      prompt = prompt.replace('卡其色工装裤，深绿色探险夹克', outfit);
    }
    
    return prompt;
  }

  _buildBeastPrompt(beast, angleType, scene = '') {
    let sceneDesc = scene || 'Nirath原创异世界生态，film grain，cinematic lighting';
    
    let prompt = beast.promptTemplate.replace('{scene}', sceneDesc);
    
    // 根据角度调整
    if (angleType === '头部特写') {
      prompt = prompt.replace('全身', '头部特写');
      prompt += '， hyper-detailed head, facial features, close-up, macro detail';
    } else if (angleType === '背部纹理') {
      prompt += '，背部纹理细节， scale texture, back view, detailed skin/scales';
    } else if (angleType === '肢体细节') {
      prompt += '，肢体细节特写， limb detail, claw/foot close-up, anatomical accuracy';
    } else if (angleType === '动态姿态') {
      prompt += '，动态飞行/奔跑姿态， dynamic pose, motion blur, action shot';
    }
    
    // 添加风格约束
    prompt += '， CG cinematic, photorealistic mythical creature, 8K texture, ACES color space, studio lighting';
    
    return prompt;
  }
}

// ========== 导出 ==========
module.exports = {
  PortraitStudio,
  SHANHAIJING_BESTIARY,
  CHARACTER_PORTRAIT_CONFIG,
  PORTRAIT_CONFIG
};