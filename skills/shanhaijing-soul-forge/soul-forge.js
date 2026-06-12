#!/usr/bin/env node
/**
 * Nirath原创世界观灵魂铸造系统 — Shanhaijing Soul Forge
 * 
 * ⚠️ 重要声明：这是【山海经专用子系统】，包含Nirath世界观特定角色配置（如dijiang/xuangui）
 * ⚠️ 通用视频分支（FPV/科普/广告）请勿引用此文件
 * ⚠️ 角色关系硬编码为Nirath世界观预期设计，非系统漏洞
 * 
 * 三层灵魂模型：本能层(Instinct) → 人性层(Humanity) → 灵性层(Spirituality)
 * 将"万物有灵"编码为可计算的角色驱动参数
 * 
 * 融合策略：内核注入，soul-forge输出驱动shanhaijing-micromotion
 */

const { Bestiary } = require('../shanhaijing-bestiary/bestiary');

// ============ 三层灵魂分析器 ============

class InstinctLayer {
  /**
   * 分析异兽本能层
   */
  static analyze(beastData) {
    const soul = beastData.soulThreeLayers?.instinct;
    
    if (!soul) {
      // 缺失时推断
      return this.inferFromCategory(beastData.category);
    }
    
    return {
      coreDrive: soul.coreDrive,
      behavioralPatterns: soul.behavioralPatterns || [],
      emotionalExpressions: soul.emotionalExpressions || {},
      fightOrFlight: soul.fightOrFlight || 'neutral',
      layer: 'instinct',
      weight: 0.33
    };
  }
  
  static inferFromCategory(category) {
    const driveMap = {
      natural_god: '领地守护与现象维持',
      celestial_god: '秩序维护与天道执行',
      auspicious_beast: '祥瑞降临与福泽传播',
      spirit_beast: '情感体验与众生连接',
      demon_beast: '欲望满足与混沌扩张'
    };
    
    return {
      coreDrive: driveMap[category] || '生存与繁衍',
      behavioralPatterns: ['领地标记', '资源获取', '威胁应对'],
      emotionalExpressions: {
        anger: '本能狂暴，破坏一切阻碍',
        joy: '领地标记行为增强',
        fear: '逃跑或僵直',
        sadness: '领地收缩，活动减少'
      },
      fightOrFlight: 'context-dependent',
      layer: 'instinct',
      weight: 0.33
    };
  }
}

class HumanityLayer {
  static analyze(beastData) {
    const soul = beastData.soulThreeLayers?.humanity;
    
    if (!soul) {
      return this.generateWounds(beastData);
    }
    
    return {
      woundPatterns: soul.woundPatterns || [],
      evolutionArc: soul.evolutionArc || '',
      relationships: soul.relationships || {},
      moralAlignment: soul.moralAlignment || 'neutral',
      layer: 'humanity',
      weight: 0.33
    };
  }
  
  static generateWounds(beastData) {
    // 按类别推断伤口模式
    const woundMap = {
      natural_god: [
        { name: '永恒的孤独', coreNeed: '被理解', coreLie: '强大不需要陪伴' },
        { name: '无法参与的悲哀', coreNeed: '归属感' },
        { name: '被当作工具的恐惧', coreNeed: '被尊重' }
      ],
      celestial_god: [
        { name: '秩序的重压', coreNeed: '自由', coreLie: '规则就是一切' }
      ],
      auspicious_beast: [
        { name: '被期待的负担', coreNeed: '真实自我', coreLie: '祥瑞不能悲伤' }
      ],
      spirit_beast: [
        { name: '情感的过载', coreNeed: '平静', coreLie: '感受一切是礼物' }
      ],
      demon_beast: [
        { name: '欲望的虚无', coreNeed: '满足', coreLie: '更多就是答案' }
      ]
    };
    
    return {
      woundPatterns: woundMap[beastData.category] || [],
      evolutionArc: '从本能驱动到理解自我',
      relationships: { withHumans: '复杂', withOtherGods: '竞争' },
      moralAlignment: 'neutral',
      layer: 'humanity',
      weight: 0.33
    };
  }
}

class SpiritualityLayer {
  static analyze(beastData) {
    const soul = beastData.soulThreeLayers?.spirituality;
    
    if (!soul) {
      return this.inferTao(beastData);
    }
    
    return {
      tao: soul.tao || '',
      wuwei: soul.wuwei || '',
      harmony: soul.harmony || '',
      cosmicRole: soul.cosmicRole || '',
      layer: 'spirituality',
      weight: 0.34
    };
  }
  
  static inferTao(beastData) {
    const taoMap = {
      natural_god: '无为而无不为',
      celestial_god: '天道有序，万物归位',
      auspicious_beast: '福泽众生，不求回报',
      spirit_beast: '感同身受，众生一体',
      demon_beast: '混沌之道，无序即序'
    };
    
    const roleMap = {
      natural_god: '天道执行者，自然现象的人格化',
      celestial_god: '秩序守护者，天庭的执法者',
      auspicious_beast: '福泽使者，吉祥的化身',
      spirit_beast: '情感化身，体验众生之爱的使者',
      demon_beast: '欲望化身，人性阴暗面的具象'
    };
    
    return {
      tao: taoMap[beastData.category] || '道可道，非常道',
      wuwei: '顺应自然，不强求',
      harmony: '与天地同寿，与万物共生',
      cosmicRole: roleMap[beastData.category] || '未知存在',
      layer: 'spirituality',
      weight: 0.34
    };
  }
}

// ============ Soul Forge 核心类 ============

class SoulForge {
  constructor() {
    this.bestiary = new Bestiary();
  }
  
  /**
   * 铸造异兽完整灵魂档案
   * 
   * 输出导演可用的10字段灵魂档案：
   * coreDrive, keyWound, coreNeed, coreLie, evolutionArc,
   * tao, wuwei, cosmicRole, emotionalExpressions, dialogueStyle
   */
  forgeSoul(beastId) {
    const beast = this.bestiary.getBeast(beastId);
    
    // 🆕 v4.3-Peng-C-fix: 防御性处理 — 找不到异兽时使用默认档案
    if (!beast) {
      console.warn(`    [SoulForge] 未找到异兽档案: ${beastId}，使用默认未知异兽灵魂`);
      const defaultInstinct = {
        coreDrive: '未知本能',
        behavioralPatterns: [],
        emotionalExpressions: {},
        fightOrFlight: 'neutral',
        layer: 'instinct',
        weight: 0.33
      };
      const defaultHumanity = {
        woundPatterns: [],
        evolutionArc: '',
        relationships: {},
        moralAlignment: 'neutral',
        layer: 'humanity',
        weight: 0.33
      };
      const defaultSpirituality = {
        tao: '未知之道',
        wuwei: '顺应自然',
        harmony: '与天地同寿',
        cosmicRole: '未知存在',
        layer: 'spirituality',
        weight: 0.34
      };
      const defaultIntegrity = this.calculateIntegrity(defaultInstinct, defaultHumanity, defaultSpirituality);
      
      return {
        beastId,
        beastName: beastId,
        coreDrive: defaultInstinct.coreDrive,
        keyWound: '',
        coreNeed: '',
        coreLie: '',
        evolutionArc: '',
        tao: defaultSpirituality.tao,
        wuwei: defaultSpirituality.wuwei,
        cosmicRole: defaultSpirituality.cosmicRole,
        emotionalExpressions: {},
        dialogueStyle: '',
        integrity: defaultIntegrity,
        layerWeights: {
          instinct: 0.33,
          humanity: 0.33,
          spirituality: 0.34
        }
      };
    }
    
    // 三层分析
    const instinct = InstinctLayer.analyze(beast);
    const humanity = HumanityLayer.analyze(beast);
    const spirituality = SpiritualityLayer.analyze(beast);
    
    // 完整性校验
    const integrity = this.calculateIntegrity(instinct, humanity, spirituality);
    
    // 输出导演档案
    const soulProfile = {
      beastId,
      beastName: beast.name,
      
      // 动机层
      coreDrive: instinct.coreDrive,
      keyWound: humanity.woundPatterns[0]?.name || '',
      coreNeed: humanity.woundPatterns[0]?.coreNeed || '',
      coreLie: humanity.woundPatterns[0]?.coreLie || '',
      
      // 弧光层
      evolutionArc: humanity.evolutionArc,
      
      // 哲学层
      tao: spirituality.tao,
      wuwei: spirituality.wuwei,
      cosmicRole: spirituality.cosmicRole,
      
      // 表达层
      emotionalExpressions: instinct.emotionalExpressions,
      dialogueStyle: beast.personality?.dialogueStyle || '',
      
      // 元数据
      integrity,
      layerWeights: {
        instinct: instinct.weight,
        humanity: humanity.weight,
        spirituality: spirituality.weight
      }
    };
    
    return soulProfile;
  }
  
  /**
   * 计算灵魂完整性
   */
  calculateIntegrity(instinct, humanity, spirituality) {
    let score = 0;
    
    // 本能层完整性
    if (instinct.coreDrive) score += 33;
    if (instinct.behavioralPatterns?.length > 0) score += 10;
    
    // 人性层完整性
    if (humanity.woundPatterns?.length > 0) score += 33;
    if (humanity.evolutionArc) score += 10;
    
    // 灵性层完整性
    if (spirituality.tao) score += 34;
    
    // 分级
    let level;
    if (score >= 100) level = 'complete';
    else if (score >= 66) level = 'basic';
    else if (score >= 33) level = 'rudimentary';
    else level = 'empty';
    
    return { score, level, max: 120 };
  }
  
  /**
   * 导出导演版灵魂档案（9字段精简版）
   */
  exportDirectorsProfile(soulProfile) {
    return {
      coreDrive: soulProfile.coreDrive,
      keyWound: soulProfile.keyWound,
      coreNeed: soulProfile.coreNeed,
      coreLie: soulProfile.coreLie,
      evolutionArc: soulProfile.evolutionArc,
      tao: soulProfile.tao,
      wuwei: soulProfile.wuwei,
      cosmicRole: soulProfile.cosmicRole,
      dialogueStyle: soulProfile.dialogueStyle
    };
  }
  
  /**
   * 导出编剧版角色卡（6字段）
   */
  exportScriptCharacterCard(soulProfile) {
    return {
      name: soulProfile.beastName,
      want: soulProfile.coreDrive,
      need: soulProfile.coreNeed,
      lie: soulProfile.coreLie,
      arc: soulProfile.evolutionArc,
      voice: soulProfile.dialogueStyle
    };
  }
  
  /**
   * 生成情绪弧光建议（供导演系统使用）
   */
  generateEmotionArcSuggestion(beastId, sceneType = 'normal') {
    const soul = this.forgeSoul(beastId);
    
    // 根据场景类型推荐情绪状态
    const arcMap = {
      opening: { emotion: 'dignified', layer: 'instinct', intensity: 0.3 },
      rising: { emotion: 'tension', layer: 'humanity', intensity: 0.6 },
      climax: { emotion: 'catharsis', layer: 'spirituality', intensity: 1.0 },
      falling: { emotion: 'reflection', layer: 'humanity', intensity: 0.4 },
      ending: { emotion: 'transcendence', layer: 'spirituality', intensity: 0.7 }
    };
    
    return arcMap[sceneType] || { emotion: 'neutral', layer: 'instinct', intensity: 0.5 };
  }
}

// ============ 小G（主角）灵魂档案 ============
const XG_SOUL_PROFILE = {
  id: 'xiaoG',
  name: '小G',
  nameEn: 'Little G',
  role: '主角/记录者',
  
  // 基础档案
  basicProfile: {
    ageAtReset: '8岁3个月',
    birthday: '12月24日（平安夜）',
    resetDate: '2147年9月17日凌晨3点17分',
    preResetIdentity: '二年级小学生',
    father: '工程师，核电站工作',
    mother: '小学语文教师'
  },
  
  // 核心性格（三大特质）
  coreTraits: {
    observersQuiet: {
      name: '观察者的静',
      description: '不急于行动，先观察、再理解、后行动。面对危险异兽时，先观察行为模式，找出安全的方法',
      manifestation: '在危险中保持冷静，在混乱中发现秩序'
    },
    gentleStubbornness: {
      name: '温柔的执拗',
      description: '认定的事情（要活下去、要记录一切、光囊母兽是朋友），温柔但不可动摇地坚持',
      manifestation: '用数周时间，每天给害怕他的异兽喂食，直到对方信任他'
    },
    delayedTrust: {
      name: '延迟的信任',
      description: '不轻易相信任何人/异兽，但一旦信任建立，就是绝对的、无条件的',
      manifestation: '慢热但持久的伙伴关系——光囊母兽、冰甲龟兽、雪白智兽、九尾光狐'
    }
  },
  
  // 情感表达方式
  emotionalExpression: {
    style: '身体化——不擅长用语言表达复杂情感，而是通过行动、绘画、书写来表达',
    examples: [
      '不会说"我很难过"，而是会在笔记本上画很多黑色的线条',
      '害怕时紧紧抱住光囊母兽',
      '开心时给异兽画肖像'
    ]
  },
  
  // 认知特点
  cognitiveTraits: {
    classificationUrge: {
      name: '分类癖',
      description: '喜欢给事物命名、归类、整理——天生的"记录者"',
      manifestation: '把遇到的异兽按照"大小""颜色""危险程度"分类'
    },
    psychologicalTrauma: {
      name: '幸存者内疚',
      description: '反复问自己"为什么只有我活下来了"',
      manifestation: '第三卷的主要心理危机："如果我做得更好，是不是别人也能活下来？"'
    },
    psychologicalResilience: {
      name: '心理韧性',
      description: '出人意料的强——经历了末日但没有崩溃',
      source: '母亲从小培养的阅读习惯——书本给了他一个"可以躲进去的世界"'
    },
    humor: {
      name: '隐藏的冷幽默',
      description: '不会故意讲笑话，但"天真"的评论会让雪白智兽忍不住笑',
      example: '看到猬毛凶兽的领地时说："这里的主人不太会收拾房间"'
    }
  },
  
  // 核心恐惧与渴望
  coreFear: {
    name: '被遗忘',
    description: '不是害怕自己死去，而是害怕"没有人记得我曾经存在"',
    motivation: '执着于"记录"的深层动机'
  },
  coreDesire: {
    name: '被看见、被理解',
    description: '唯一记得旧世界的人，极度渴望有人能分享他的记忆',
    manifestation: '发现雪白智兽"理解"他时，情感爆发是全系列最动人的时刻之一'
  },
  
  // 情感触发器
  emotionalTriggers: [
    { trigger: '旧物品（照片、玩具等）', effect: '触发强烈的情感反应' },
    { trigger: '月圆之夜', effect: '格外思念家人' },
    { trigger: '下雨', effect: '感到安全（因为可以躲在光囊母兽身下）' },
    { trigger: '看到母亲形象（某些温柔的雌性异兽）', effect: '既温暖又悲伤' }
  ],
  
  // 外在形象变化
  appearanceEvolution: {
    initial: {
      description: '瘦弱、皮肤白皙、短发、穿着破烂校服和过大的外套（爸爸的）',
      signatureItem: '手里总是攥着半张照片（全家福的碎片）'
    },
    midTerm: {
      description: '健壮了一些、皮肤晒黑、头发变长（自己用石头剪的）、穿着自制兽皮衣',
      signatureItem: '眼神中的沉静变成了"好奇的光芒"'
    },
    later: {
      description: '像"小野人"——穿着自制兽皮衣，身上挂着各种"工具"',
      signatureItems: [
        '笔记本（用绳子挂在脖子上）',
        '半张照片（藏在衣服内袋）',
        '炭笔（插在头发里）',
        '光囊母兽的羽毛（后期，系在手腕上）',
        '石头刀（冰甲龟兽送的）'
      ]
    }
  },
  
  // 生存技能成长
  survivalSkills: [
    { time: '第1-10天', skill: '找水、找庇护所、躲避危险', method: '试错+观察光音鸟' },
    { time: '第10-30天', skill: '生火、做简单工具、辨识食物', method: '光囊母兽的陪伴给了安全感' },
    { time: '第30-60天', skill: '基础医疗（草药）、追踪与躲避、游泳', method: '九尾光狐幼崽的"玩耍"启发' },
    { time: '第60-180天', skill: '建造庇护所、制作武器（非攻击性）、光脉能量感知', method: '雪白智兽的系统性教学' },
    { time: '第180-365天', skill: '高级生存技能、异兽"语言"基础、光脉能量操控基础', method: '与各种异兽的互动' },
    { time: '1-2年', skill: '精通异兽"语言"、光脉能量操控中级、水下呼吸', method: '鲛人教学' },
    { time: '2-3年', skill: '光脉能量操控高级、预言解读、"太素时刻"进入', method: '雪白智兽+遗迹学习' },
    { time: '3-4年+', skill: '"记录者"的完整能力——书写具有"定义现实"的力量', method: '自我领悟' }
  ],
  
  // 光脉能量能力成长
  auraAbilityGrowth: [
    { phase: '第一阶段（0-6个月）', ability: '无', description: '完全不具备光脉能量感知能力' },
    { phase: '第二阶段（6-12个月）', ability: '光脉能量感知', description: '能"感觉到"光脉能量浓郁的地方，如同直觉' },
    { phase: '第三阶段（1-2年）', ability: '光脉能量共鸣', description: '能与异兽进行基础的"光脉能量共鸣"沟通（情感层面）' },
    { phase: '第四阶段（2-3年）', ability: '光脉能量引导', description: '能引导光脉能量进行简单的操作（如点燃篝火、净化水源）' },
    { phase: '第五阶段（3-4年+）', ability: '光脉能量锚定', description: '书写时可以将光脉能量"固定"在文字中——文字具有"定义现实"的力量' }
  ],
  
  // 书写行为四个阶段
  writingStages: [
    { 
      stage: '涂鸦期（第1-30天）',
      content: '简单的图画——线条、圆圈、涂色块',
      tools: '石头、木炭、泥',
      format: '无格式',
      motivation: '宣泄情感、记录恐惧'
    },
    { 
      stage: '图画期（第30天-6个月）',
      content: '炭笔画——异兽的轮廓、植物的样子',
      tools: '炭笔、兽皮',
      format: '无格式，有标注',
      motivation: '表达好奇、建立连接（给异兽看画）'
    },
    { 
      stage: '文字期（6个月-2年）',
      content: '文字为主，配合图画——开始有"条目"格式',
      tools: '炭笔、兽皮、纸张碎片',
      format: '名称→外观→所在→特征',
      motivation: '系统记录、理解世界'
    },
    { 
      stage: '创作期（2年+）',
      content: '完整的"Nirath原创世界观"写作——每异兽一篇',
      tools: '雪白智兽的羽毛笔、光脉能量墨水',
      format: '完整的"Nirath原创世界观"条目格式',
      motivation: '使命驱动——"让世界被记住"'
    }
  ],
  
  // 书写行为心理分析
  writingPsychology: {
    surface: { level: '表层', explanation: '"我要记住这些东西，这样我才能活下来"——实用的生存需求' },
    middle: { level: '中层', explanation: '"如果这些异兽有名字，它们就不是怪物了"——通过命名来消除恐惧' },
    deep: { level: '深层', explanation: '"如果我不写下来，就没有人知道它们存在过"——对抗孤独和遗忘的终极方式' },
    core: { level: '核心层', explanation: '"我写，故我在"——写作是他证明自己"存在"的方式' }
  },
  
  // 八阶段成长模型
  eightStageGrowth: [
    { stage: 1, name: '恐惧的幸存者', coreEvent: '在废墟中醒来', mindset: '"我要活下去"', writingRelation: '涂鸦——宣泄恐惧' },
    { stage: 2, name: '好奇的探索者', coreEvent: '遇到光囊母兽', mindset: '"这是什么世界？"', writingRelation: '图画——记录好奇' },
    { stage: 3, name: '孤独的求问者', coreEvent: '遇到雪白智兽', mindset: '"我为什么会在这里？"', writingRelation: '文字开始——提问' },
    { stage: 4, name: '信任的建造者', coreEvent: '建立第一个家', mindset: '"我有了朋友"', writingRelation: '系统记录——建立秩序' },
    { stage: 5, name: '失去的痛苦者', coreEvent: '光囊母兽死亡', mindset: '"我失去了一切"', writingRelation: '写作暂停——悲痛' },
    { stage: 6, name: '理解的承受者', coreEvent: '理解死亡的循环', mindset: '"失去是成长的一部分"', writingRelation: '重新开始写作——带着痛苦' },
    { stage: 7, name: '使命的承担者', coreEvent: '决定写《Nirath原创世界观》', mindset: '"我必须记录这一切"', writingRelation: '使命驱动——书写成为责任' },
    { stage: 8, name: '传承的完成者', coreEvent: '完成《Nirath原创世界观》', mindset: '"我是桥梁"', writingRelation: '写作完成——从"记录者"到"被记录者"' }
  ],
  
  // 与关键角色的关系
  relationships: {
    dijiang: {
      name: '光囊母兽',
      role: '无面之母——无条件的爱',
      stages: [
        { phase: '庇护者', description: '光囊母兽是"安全的来源"。小G躺在它身上睡觉，它用身体挡风遮雨' },
        { phase: '玩伴', description: '小G给光囊母兽讲故事，光囊母兽用"歌舞"（光脉能量共鸣）回应' },
        { phase: '家人', description: '小G称光囊母兽为"我的大朋友"——超越语言的深厚情感' },
        { phase: '灵魂伴侣', description: '光囊母兽成为了小G"存在的证明"——不需要隐藏任何情感' }
      ],
      sacrifice: '光囊母兽为保护小G而死',
      legacy: '小G在笔记本上写下关于光囊母兽最长、最深情的一篇'
    },
    xuangui: {
      name: '冰甲龟兽',
      role: '沉默之父——沉默的父爱',
      stages: [
        { phase: '交通工具', description: '小G把冰甲龟兽当作"会走的船"' },
        { phase: '导航者', description: '发现冰甲龟兽背上的地图——成为导航者' },
        { phase: '沉默的智慧', description: '冰甲龟兽虽然不说话，但"什么都懂"' },
        { phase: '永恒陪伴', description: '冰甲龟兽存活到最后——用行动证明爱' }
      ]
    },
    baize: {
      name: '雪白智兽',
      role: '智慧之父——知识守护者',
      stages: [
        { phase: '遇见', description: '小G迷路，雪白智兽出现——温和的声音安抚了他' },
        { phase: '老师-学生', description: '雪白智兽系统性地教导小G关于山海世界的知识' },
        { phase: '对话者', description: '小G开始有自己的见解，与雪白智兽进行真正的对话' },
        { phase: '平等伙伴', description: '雪白智兽承认小G"超越了自己能教的范围"' }
      ],
      departure: '雪白智兽自然死亡，走入深山',
      legacy: '小G继承了雪白智兽的"羽毛笔"'
    },
    jiuweihu: {
      name: '九尾光狐（火火）',
      role: '童年伙伴——共同成长的"姐妹"',
      stages: [
        { phase: '遇见', description: '遇到迷路的九尾光狐幼崽（只有一尾）' },
        { phase: '玩伴', description: '一起探索、玩耍、学习——教彼此技能' },
        { phase: '共同成长', description: '幼崽成长为成年九尾光狐（尾巴增加），小G从孩子成长为少年' },
        { phase: '永远的朋友', description: '即使后来遇到更多异兽，九尾光狐始终是最好的朋友' }
      ]
    },
    qiongqi: {
      name: '猬毛凶兽',
      role: '从恐惧到尊重的"对手"',
      stages: [
        { phase: '恐惧', description: '小G误入猬毛凶兽领地，被追逐——极度恐惧' },
        { phase: '理解', description: '通过雪白智兽的讲解，理解猬毛凶兽不是"邪恶"，而是"秩序的守护者"' },
        { phase: '试探', description: '在领地边缘放置食物表示尊重' },
        { phase: '尊重', description: '猬毛凶兽允许小G进入领地——最高认可' }
      ]
    }
  },
  
  // 语言成长曲线
  languageGrowthCurve: [
    { stage: '8岁', sentenceLength: '短句为主（3-8词）', vocabulary: '基础词汇，大量拟声词', emotionalExpression: '直接的、即时的（"我怕！""好美！"）', philosophy: '无', example: '光囊母兽好大好软。像妈妈的被子。' },
    { stage: '8-9岁', sentenceLength: '中短句（5-12词）', vocabulary: '开始出现形容词和比喻', emotionalExpression: '能描述复杂的混合情感', philosophy: '简单因果关系（"因为……所以……"）', example: '光囊母兽没有脸，所以它不会生气。生气的脸都有眉毛。' },
    { stage: '9-10岁', sentenceLength: '中句（8-15词）', vocabulary: '抽象词汇开始出现', emotionalExpression: '能表达延迟的情感', philosophy: '简单哲学（"死了就是变成别的"）', example: '死亡不是消失。死亡是变成风，或者雨，或者别的东西。' },
    { stage: '10-11岁', sentenceLength: '长句开始出现（12-20词）', vocabulary: '丰富的描述性词汇', emotionalExpression: '反思性情感', philosophy: '哲学追问（"为什么存在？"）', example: '如果我记得一件事，它还存在吗？如果我不在了，我的记忆去哪了？' },
    { stage: '11-12岁+', sentenceLength: '长短结合，有节奏感（15-30词）', vocabulary: '诗意的、精确的词汇', emotionalExpression: '能承载复杂情感', philosophy: '完整的哲学立场（"记忆即存在"）', example: '我记录，不是为了自己。我记录，是为了让一切存在过的东西，都有被记住的机会。' }
  ]
};

// ============ 导出 ============
module.exports = {
  SoulForge,
  InstinctLayer,
  HumanityLayer,
  SpiritualityLayer,
  XG_SOUL_PROFILE
};

// CLI 测试入口
if (require.main === module) {
  const forge = new SoulForge();
  
  console.log('\n🔥 Nirath原创世界观灵魂铸造系统测试\n');
  const soul = forge.forgeSoul('zhulong');
  console.log('守光巨兽灵魂档案：');
  console.log(JSON.stringify(soul, null, 2));
  
  console.log('\n小G灵魂档案（基础）：');
  console.log(JSON.stringify(XG_SOUL_PROFILE.basicProfile, null, 2));
}