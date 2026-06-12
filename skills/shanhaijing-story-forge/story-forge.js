#!/usr/bin/env node
/**
 * Nirath原创世界观剧本引擎 — Shanhaijing Story Forge
 * 
 * ⚠️ 重要声明：这是【山海经专用子系统】，包含Nirath世界观特定异兽配置
 * ⚠️ 通用视频分支（FPV/科普/广告）请勿引用此文件
 * ⚠️ suitableBeasts等硬编码为山海经世界观预期设计，非系统漏洞
 * 
 * 弧线规划器(Arc Planner) + 冲突设计器(Conflict Designer) + 母题引擎(Motif Engine)
 * 将叙事意图转化为可执行的五幕结构
 * 
 * 融合策略：深度替换seedance-story-engine，母题-弧线映射为叙事核心
 */

// ============ 五种角色弧线模板 ============
const ARC_TEMPLATES = {
  growth: {
    name: '成长型',
    stages: ['封闭/拒绝', '触动/萌芽', '挣扎/冲突', '接纳/行动', '蜕变/新生'],
    description: '从拒绝改变到拥抱成长'
  },
  fall: {
    name: '堕落型',
    stages: ['理想/崇高', '诱惑/动摇', '妥协/沉沦', '迷失/毁灭', '觉醒/救赎'],
    description: '从理想到现实，再到自我救赎'
  },
  cyclical: {
    name: '轮回型',
    stages: ['无知/安逸', '冲击/觉醒', '抗争/挣扎', '领悟/接纳', '循环/超越'],
    description: '从无知到有知的无知，螺旋上升'
  },
  sacrifice: {
    name: '牺牲型',
    stages: ['自保/回避', '羁绊/牵挂', '抉择/痛苦', '牺牲/超越', '回响/永恒'],
    description: '从自我保护到超越自我的奉献'
  },
  awakening: {
    name: '觉醒型',
    stages: ['假象/蒙蔽', '质疑/裂痕', '追寻/探索', '真相/震撼', '接纳/新生'],
    description: '从被蒙蔽到接纳真实'
  }
};

// ============ 17种母题-弧线映射 ============
const MOTIF_TO_ARC = {
  time_cycle: { arc: 'cyclical', weight: 1.0, suitableBeasts: ['zhulong', 'kun_peng', 'yinglong'] },
  beast_encounter: { arc: 'growth', weight: 0.9, suitableBeasts: ['jiuweihu', 'baize', 'qilin'] },
  desire_fable: { arc: 'fall', weight: 0.9, suitableBeasts: ['taotie', 'qiongqi', 'hundun'] },
  guardian_solitude: { arc: 'sacrifice', weight: 1.0, suitableBeasts: ['zhulong', 'yinglong'] },
  divine_order: { arc: 'awakening', weight: 0.8, suitableBeasts: ['yinglong', 'fenghuang'] },
  transformation: { arc: 'growth', weight: 1.0, suitableBeasts: ['kun_peng', 'jiuweihu'] },
  nature_harmony: { arc: 'awakening', weight: 0.7, suitableBeasts: ['qilin', 'pixiu', 'suanni'] },
  chaos_invasion: { arc: 'sacrifice', weight: 0.9, suitableBeasts: ['zhulong', 'qilin', 'fenghuang'] },
  origin_myth: { arc: 'cyclical', weight: 0.9, suitableBeasts: ['zhulong', 'fenghuang', 'qilin'] },
  wisdom_seeking: { arc: 'growth', weight: 0.8, suitableBeasts: ['baize', 'baihu'] },
  revenge: { arc: 'fall', weight: 0.8, suitableBeasts: ['qiongqi', 'taotie'] },
  prophecy: { arc: 'awakening', weight: 0.9, suitableBeasts: ['zhulong', 'baize'] },
  kinship: { arc: 'sacrifice', weight: 0.7, suitableBeasts: ['pixiu', 'suanni'] },
  exile: { arc: 'cyclical', weight: 0.7, suitableBeasts: ['kun_peng', 'yinglong'] },
  temptation: { arc: 'fall', weight: 0.8, suitableBeasts: ['jiuweihu', 'hundun'] },
  redemption: { arc: 'growth', weight: 0.9, suitableBeasts: ['qiongqi', 'taotie'] },
  reincarnation: { arc: 'cyclical', weight: 1.0, suitableBeasts: ['fenghuang', 'kun_peng'] }
};

// ============ 16个东方叙事母题 ============
const SHANHAI_MOTIFS = {
  time_cycle: {
    id: 'time_cycle',
    name: '时间循环',
    source: '守光巨兽睁眼闭眼',
    coreConflict: '永恒 vs 短暂',
    emotionalCore: '敬畏与无奈',
    visualPeak: '瞳孔开合间天地亮度瞬间切换',
    suitableBeasts: ['zhulong', 'kun_peng', 'yinglong'],
    narrativeArc: 'cyclical',
    moralProposition: '时间的流逝无法阻挡，但意义可以永存'
  },
  beast_encounter: {
    id: 'beast_encounter',
    name: '人兽相遇',
    source: '九尾光狐魅惑',
    coreConflict: '本能 vs 理性',
    emotionalCore: '好奇与恐惧',
    visualPeak: '人与异兽目光交汇的瞬间',
    suitableBeasts: ['jiuweihu', 'baize', 'qilin'],
    narrativeArc: 'growth',
    moralProposition: '理解异类就是理解自己'
  },
  desire_fable: {
    id: 'desire_fable',
    name: '欲望寓言',
    source: '晶齿萌兽贪食',
    coreConflict: '欲望 vs 节制',
    emotionalCore: '贪婪与虚无',
    visualPeak: '吞噬一切后的空洞',
    suitableBeasts: ['taotie', 'qiongqi', 'hundun'],
    narrativeArc: 'fall',
    moralProposition: '欲望是深渊，凝视深渊时深渊也在凝视你'
  },
  guardian_solitude: {
    id: 'guardian_solitude',
    name: '守护孤独',
    source: '守光巨兽独守章尾山',
    coreConflict: '责任 vs 自由',
    emotionalCore: '孤独与崇高',
    visualPeak: '龙瞳中映出万年孤独',
    suitableBeasts: ['zhulong', 'yinglong'],
    narrativeArc: 'sacrifice',
    moralProposition: '真正的守护从不期待被看见'
  }
};

// ============ 【故事内核融入】核心主题与情感配方 ============
const CORE_THEMES = {
  memoryExistence: {
    name: '记忆即存在',
    nameEn: 'Memory is Existence',
    weight: 0.70,
    description: '一个文明的存续不在于建筑，而在于有人记住了它的样子',
    narrativeFunction: '贯穿全系列的精神内核——小G是旧世界最后的记忆携带者',
    visualMotif: '笔记本、半张照片、废墟中的旧物、文字发光'
  },
  namingUnderstanding: {
    name: '命名即理解',
    nameEn: 'Naming is Understanding',
    weight: 0.15,
    description: '给孩子命名是建立关系的第一步，给世界命名是理解世界的第一步',
    narrativeFunction: '小G从"怕怪物"到"叫出怪物的名字"的过程',
    visualMotif: '命名瞬间的光脉能量纽带、异兽歪头回应'
  },
  solitudeConnection: {
    name: '孤独与连接',
    nameEn: 'Solitude and Connection',
    weight: 0.10,
    description: '真正的孤独不是身边没有人，而是没有人能理解你的回忆',
    narrativeFunction: '小G与异兽建立的连接来自共享的"被遗弃"处境',
    visualMotif: '月圆之夜、回声、光囊母兽的包裹'
  },
  innocenceDivinity: {
    name: '童稚与神性',
    nameEn: 'Innocence and Divinity',
    weight: 0.05,
    description: '孩子的心灵最接近"神性视角"——不预设立场，不被善恶二元束缚',
    narrativeFunction: '8岁视角的独特优势——陌生化、去道德化、语言诗意',
    visualMotif: '小G的眼睛特写、未完成的句子、涂鸦'
  }
};

// ============ 【故事内核融入】情感配方 ============
const EMOTIONAL_FORMULA = {
  gentleSadness: {
    name: '温柔的悲伤',
    proportion: 0.70,
    description: '对失去的理解与接纳',
    triggers: ['小规模的具体的失去', '无法回头的成长瞬间', '孤独的对照'],
    examples: ['光囊母兽慢慢死去，体温一点一点流失', '废墟中发现幼儿园同学的玩具', '雪白智兽走入深山，只看到发光的白色毛发']
  },
  aweMagnificence: {
    name: '惊叹的壮美',
    proportion: 0.20,
    description: '对世界的敬畏',
    triggers: ['生命的韧性', '跨越物种的理解', '记录的使命'],
    examples: ['废墟中野草开花', '第一次被异兽接纳为"自己人"', '完成《Nirath原创世界观》的那一刻']
  },
  burningHope: {
    name: '燃烧的希望',
    proportion: 0.10,
    description: '对意义的追寻',
    triggers: ['小G的成长里程碑', '异兽的善意', '文字的力量'],
    examples: ['第一次生火成功', '第一次给异兽命名', '决定写《Nirath原创世界观》']
  }
};

// ============ 【故事内核融入】情感节拍地图（13个关键节点） ============
const EMOTIONAL_BEAT_MAP = [
  { node: '恐惧', position: '开篇', emotion: '害怕、迷茫', trigger: '小G在废墟中醒来，四周是陌生的世界' },
  { node: '安慰', position: '第一卷中段', emotion: '安全感', trigger: '找到第一个庇护所，第一次安稳地睡觉' },
  { node: '喜悦', position: '第一卷末', emotion: '快乐、希望', trigger: '遇见光囊母兽，第一次笑' },
  { node: '哀伤', position: '第二卷初', emotion: 'nostalgia', trigger: '发现与旧世界有关的物品，想起妈妈' },
  { node: '惊叹', position: '第二卷中段', emotion: '敬畏、好奇', trigger: '第一次见到超大型异兽（鲲鹏）' },
  { node: '信任', position: '第二卷末', emotion: '安全感、归属感', trigger: '被异兽群体接纳（九尾光狐长老授予"公民身份"）' },
  { node: '心碎', position: '第三卷初', emotion: '悲伤、绝望', trigger: '重要伙伴光囊母兽的离去' },
  { node: '愤怒', position: '第三卷中段', emotion: '愤怒、不公', trigger: '目睹"不公平"的自然事件（小角被捕食）' },
  { node: '接受', position: '第三卷末', emotion: '平静、理解', trigger: '理解自然循环，接受失去' },
  { node: '使命感', position: '第四卷初', emotion: '决心、充实', trigger: '决定写下《Nirath原创世界观》' },
  { node: '恐惧', position: '第四卷中段', emotion: '害怕（写作本身）', trigger: '面对最痛苦的记忆，犹豫是否要写下' },
  { node: '释放', position: '第四卷末', emotion: '平静、自由', trigger: '写完最后一页，接受自己的身份' },
  { node: '希望', position: '结尾', emotion: '温暖的希望', trigger: '放下书，继续前行——"故事结束了，但我还没有"' }
];

// ============ 【故事内核融入】世界观规则约束 ============
const WORLD_RULES = {
  povConstraint: {
    name: '严格8岁男孩视角',
    rules: [
      '叙事严格限制在小G的感知范围内——读者只能看到小G看到的东西',
      '没有全知旁白解释"这个世界是怎么回事"',
      '没有切到其他视角的"补充说明"',
      '造物主意图、时间循环真相、《Nirath原创世界观》全貌——必须通过小G的逐步发现来呈现'
    ],
    growth: '小G的叙事声音会随故事进展"成长"——第一卷像8岁孩子，第四卷像12岁少年'
  },
  worldFusion: {
    name: '世界是"融合的"',
    rules: [
      '科技废墟与上古生态已经共生超过10年，边界已经模糊',
      '某些"异兽"实际上是科技残骸的"神话化"',
      '"上古时代"不是纯粹的过去——它是一个新的可能性的分支',
      '能量守恒——科技的能量以神话的形式重新分布，转化为"光脉能量"'
    ]
  },
  informationRelease: {
    name: '信息释放规则',
    schedule: [
      { info: '小G在大爆炸前的生活', when: '第一卷，碎片式', how: '梦境、闪回、独白' },
      { info: '世界基本运作法则', when: '第一-二卷，逐步', how: '雪白智兽教学、直接体验' },
      { info: '科技残骸真实身份', when: '第二-三卷，选择性', how: '废墟中发现"认识的东西"' },
      { info: '时间循环/造物主真相', when: '第三-四卷，逐步揭示', how: '雪白智兽暗示、既视感、《Nirath原创世界观》写作发现' },
      { info: '《Nirath原创世界观》终极意义', when: '第四卷结尾', how: '小G写下的最后一页，读者自己领悟' }
    ]
  }
};

// ============ 【故事内核融入】五个核心哲学问题 ============
const CORE_PHILOSOPHICAL_QUESTIONS = {
  taisuIntent: {
    question: '造物主为何重置时间线？',
    surfaceAnswer: '太素是宇宙自我保护机制——文明偏离平衡时进行重置',
    deepAnswer: '太素没有"意图"——它不是人格化的神，只是一个机制。选择《Nirath原创世界观》不是它的决定，而是人类集体潜意识与光脉能量共振的结果',
    corePhilosophy: '意义不是被给予的，而是被创造的'
  },
  timeCycle: {
    question: '时间循环的真相？',
    surfaceAnswer: '这是第一次重置——全新开始',
    deepAnswer: '这不是第一次。在漫长历史中文明经历多次"呼吸"——扩张→危机→重置。《Nirath原创世界观》本身就是上一轮的"记录"',
    corePhilosophy: '文明是呼吸，不是直线。循环不是无意义的——每一次记录都是传承'
  },
  boyIdentity: {
    question: '小G真的只是偶然幸存者吗？',
    surfaceAnswer: '小G只是普通8岁男孩，活下来是因为运气',
    deepAnswer: '小G不是"特殊的"——但他通过"书写"获得了特殊性。在这个世界中，"命名"和"记录"本身就是光脉能量活动',
    corePhilosophy: '不是你是谁赋予了你力量，而是你做了什么赋予了你力量'
  },
  oldWorldFate: {
    question: '旧世界是否真的毁灭了？',
    surfaceAnswer: '旧世界被彻底重置，不存在了',
    deepAnswer: '旧世界既"存在"又"不存在"——物质层面彻底解构，信息层面保存在"海内经"中，时间层面存在于时间褶皱中',
    corePhilosophy: '过去不在你身后，过去在你写下的每一个字里'
  },
  beastHumanRelation: {
    question: '异兽与人类的关系？',
    surfaceAnswer: '异兽是"新生命"，对人类没有记忆',
    deepAnswer: '异兽对人类的态度基于"光脉能量记忆"——旧世界人类集体行为被编码在光脉能量中，成为异兽"本能"的一部分',
    corePhilosophy: '你死后，你的行为将继续影响世界——不是作为你，而是作为世界的一部分'
  }
};

// ============ 【故事内核融入】感官词汇表 ============
const SENSORY_VOCABULARY = {
  visual: {
    auraGlow: { word: '灵晕', definition: '异兽或光脉能量浓郁区域周围的淡淡光晕', example: '"光囊母兽身边有一圈灵晕，金色的，暖暖的"' },
    ruinsRustLight: { word: '锈光', definition: '科技废墟在特定光照下的独特光泽', example: '"那栋楼的骨架上有一层锈光，红红的，像是流血的颜色"' },
    boneWhite: { word: '骨白', definition: '大荒经区域特有的灰白色调', example: '"大荒经的地是骨白色的，不是雪的白，也不是云的白"' },
    abyssBlue: { word: '渊蓝', definition: '深海和光脉能量水源的深蓝色', example: '"鲛人湾的水是渊蓝色的，深得看不见底"' },
    glowGreen: { word: '荧绿', definition: '夜间发光植物和菌类的蓝绿色光芒', example: '"夜晚的丛林是荧绿色的，所有的树都在发光"' }
  },
  auditory: {
    auraHum: { word: '灵嗡', definition: '光脉能量流动时的低频嗡嗡声', example: '"我听到了一种声音，像是从地底下传上来的"' },
    ruinsCreak: { word: '骨响', definition: '科技废墟在风力或光脉能量波动下的声响', example: '"那栋楼在响，像是骨头在咔咔响"' },
    foxChant: { word: '狐吟', definition: '九尾光狐的独特声音——类似歌唱的低吟', example: '"火火在叫，是一种唱歌一样的声音"' },
    abyssSilence: { word: '渊默', definition: '深海或深谷中的绝对寂静', example: '"水里好安静，所有的声音都被吃掉了"' },
    dragonRoar: { word: '龙吟', definition: 'S级存在发出的声音——天空本身的轰鸣', example: '"光翼游天兽叫了一声，整个天空在响"' }
  }
};

// ============ 【故事内核融入】小G八阶段成长模型 ============
const XG_GROWTH_MODEL = [
  { stage: 1, name: '恐惧的幸存者', episodes: 'S1E1-S1E3', age: '8岁', mindset: '我要活下去', writing: '涂鸦——宣泄恐惧', languageFeature: '短句、大量感叹、频繁恐惧描述' },
  { stage: 2, name: '好奇的探索者', episodes: 'S1E4-S1E8', age: '8-9岁', mindset: '这是什么世界？', writing: '图画——记录好奇', languageFeature: '出现比喻句、开始用名字称呼异兽' },
  { stage: 3, name: '孤独的求问者', episodes: 'S1E9-S2E3', age: '9-10岁', mindset: '我为什么会在这里？', writing: '文字开始——提问', languageFeature: '抽象词汇开始出现、情感词汇丰富' },
  { stage: 4, name: '信任的建造者', episodes: 'S2E4-S2E8', age: '9-10岁', mindset: '我有了朋友', writing: '系统记录——建立秩序', languageFeature: '出现反思性段落、能用光脉能量语言表达情感' },
  { stage: 5, name: '失去的痛苦者', episodes: 'S3E1-S3E5', age: '10-11岁', mindset: '我失去了一切', writing: '写作暂停——悲痛', languageFeature: '延迟的情感表达、"我现在不难过，但我昨晚哭了"' },
  { stage: 6, name: '理解的承受者', episodes: 'S3E6-S3E10', age: '10-11岁', mindset: '失去是成长的一部分', writing: '重新开始——带着痛苦', languageFeature: '哲学追问("为什么存在？")' },
  { stage: 7, name: '使命的承担者', episodes: 'S3E11-S4E5', age: '11-12岁', mindset: '我必须记录这一切', writing: '使命驱动——书写成为责任', languageFeature: '更复杂的句式、反思性段落' },
  { stage: 8, name: '传承的完成者', episodes: 'S4E6-S4E10', age: '11-12岁+', mindset: '我是桥梁', writing: '完成——从记录者到被记录者', languageFeature: '成熟的叙述声音、诗意的表达' }
];

// ============ 弧线规划器 ============
class ArcPlanner {
  /**
   * 规划灵魂弧线
   * 将灵魂三层与叙事节拍逐层绑定
   */
  planSoulEvolution(soulProfile, arcType = 'growth') {
    const template = ARC_TEMPLATES[arcType];
    if (!template) {
      throw new Error(`[ArcPlanner] 未知弧线类型: ${arcType}`);
    }

    const stages = template.stages.map((stageName, index) => {
      const progress = index / (template.stages.length - 1);

      // 确定主导灵魂层级
      let layerActive;
      if (progress < 0.3) layerActive = 'instinct';
      else if (progress < 0.7) layerActive = 'humanity';
      else layerActive = 'spirituality';

      return {
        stage: index + 1,
        name: stageName,
        progress,
        layerActive,
        instinct: this.generateLayerState(soulProfile, 'instinct', progress),
        humanity: this.generateLayerState(soulProfile, 'humanity', progress),
        spirituality: this.generateLayerState(soulProfile, 'spirituality', progress),
        keyEvent: this.generateKeyEvent(soulProfile, progress, layerActive)
      };
    });

    return {
      arcType,
      arcName: template.name,
      stages,
      soulProfile: {
        coreDrive: soulProfile.coreDrive,
        keyWound: soulProfile.keyWound,
        coreNeed: soulProfile.coreNeed,
        evolutionArc: soulProfile.evolutionArc
      }
    };
  }

  generateLayerState(soulProfile, layer, progress) {
    const states = {
      instinct: {
        0.0: '本能主导，遵循原始冲动',
        0.5: '本能与人性冲突，挣扎',
        1.0: '本能升华为灵性驱动力'
      },
      humanity: {
        0.0: '人性沉睡，情感封闭',
        0.5: '人性觉醒，痛苦与成长并存',
        1.0: '人性圆满，理解与宽恕'
      },
      spirituality: {
        0.0: '灵性未启，局限于物质世界',
        0.5: '灵性萌芽，开始追问意义',
        1.0: '灵性圆满，与天道合一'
      }
    };

    const layerStates = states[layer];
    if (progress < 0.3) return layerStates['0.0'];
    if (progress < 0.7) return layerStates['0.5'];
    return layerStates['1.0'];
  }

  generateKeyEvent(soulProfile, progress, layerActive) {
    const events = [
      `${soulProfile.coreDrive}触发初始冲突`,
      `${soulProfile.keyWound}被揭开`,
      `${soulProfile.coreNeed}面临考验`,
      `${layerActive}层主导下的抉择时刻`,
      `${soulProfile.evolutionArc}达成关键转折`
    ];
    return events[Math.floor(progress * (events.length - 1))];
  }

  /**
   * 自动推荐弧线类型
   */
  recommendArc(motifId, beastId) {
    const mapping = MOTIF_TO_ARC[motifId];
    if (!mapping) {
      return { arc: 'growth', reason: '默认成长型' };
    }

    const beastMatch = mapping.suitableBeasts.includes(beastId);
    return {
      arc: mapping.arc,
      weight: mapping.weight,
      beastMatch,
      reason: beastMatch
        ? `母题${motifId}完美适配异兽${beastId}`
        : `母题${motifId}推荐弧线${mapping.arc}`
    };
  }
}

// ============ 冲突设计器 ============
class ConflictDesigner {
  /**
   * 生成三层冲突结构
   */
  generateConflict(soulProfile, motif, supportingCharacters = []) {
    // 内部冲突
    const internal = {
      want: soulProfile.coreDrive,
      need: soulProfile.coreNeed,
      lie: soulProfile.coreLie,
      wound: soulProfile.keyWound,
      taoConflict: `${soulProfile.tao} vs 现实欲望`
    };

    // 人际冲突
    const interpersonal = supportingCharacters.map(char => ({
      with: char.name || '未知角色',
      role: char.role || '对手',
      conflictType: this.inferRelationshipConflict(soulProfile, char),
      escalation: '从误解到对抗再到理解'
    }));

    // 外部冲突
    const external = {
      coreConflict: motif.coreConflict,
      celestialConstraint: this.generateCelestialConstraint(motif),
      antagonist: motif.suitableBeasts[0] !== soulProfile.beastId ? motif.suitableBeasts[0] : '自然法则'
    };

    return {
      internal,
      interpersonal,
      external,
      complexity: this.calculateComplexity(internal, interpersonal, external)
    };
  }

  inferRelationshipConflict(soulProfile, character) {
    const conflicts = {
      mentor: '传承与叛逆',
      rival: '竞争与认同',
      lover: '吸引与恐惧',
      family: '羁绊与负担',
      ally: '信任与背叛'
    };
    return conflicts[character.role] || '认知冲突';
  }

  generateCelestialConstraint(motif) {
    const constraints = {
      time_cycle: '时间不可逆转，改变命运需付出等价代价',
      beast_encounter: '人兽殊途，过度接近必有灾祸',
      desire_fable: '欲望无底，满足一个必生十个',
      guardian_solitude: '守护者不可离开领地，否则天地失衡'
    };
    return constraints[motif.id] || '天道轮回，因果不爽';
  }

  calculateComplexity(internal, interpersonal, external) {
    let score = 0;
    if (internal.want && internal.need && internal.lie) score += 3;
    score += interpersonal.length;
    if (external.coreConflict) score += 2;
    return score;
  }
}

// ============ 母题引擎 ============
class MotifEngine {
  /**
   * 推荐母题
   */
  recommendMotifs(beastId, emotionTone = 'mysterious', targetCount = 3) {
    const candidates = Object.values(SHANHAI_MOTIFS).map(motif => {
      let score = 0;

      // 适配度
      if (motif.suitableBeasts.includes(beastId)) score += 40;

      // 情感匹配
      if (motif.emotionalCore.includes(emotionTone)) score += 30;

      // 视觉潜力
      if (motif.visualPeak && motif.visualPeak.length > 10) score += 20;

      // 故事潜力
      if (motif.moralProposition) score += 10;

      return { motif, score };
    });

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)
      .map(c => ({ ...c.motif, recommendationScore: c.score }));
  }

  /**
   * 组合两个母题
   */
  combineMotifs(motif1, motif2) {
    return {
      combinedConflict: `${motif1.coreConflict} × ${motif2.coreConflict}`,
      emotionalLayers: [motif1.emotionalCore, motif2.emotionalCore],
      moralComplexity: `${motif1.moralProposition}；与此同时，${motif2.moralProposition}`,
      visualContrast: `${motif1.visualPeak} vs ${motif2.visualPeak}`,
      suitableBeasts: [...new Set([...motif1.suitableBeasts, ...motif2.suitableBeasts])]
    };
  }
}

// ============ 剧本引擎核心类 ============
class StoryForge {
  constructor() {
    this.arcPlanner = new ArcPlanner();
    this.conflictDesigner = new ConflictDesigner();
    this.motifEngine = new MotifEngine();
  }

  /**
   * 生成完整剧本包
   */
  createScript(episodeConfig) {
    const { title, beastId, motifId, template, soulProfile } = episodeConfig;

    // 1. 推荐/确认母题
    const motif = SHANHAI_MOTIFS[motifId] || this.motifEngine.recommendMotifs(beastId)[0];

    // 2. 规划弧线
    const arcRecommendation = this.arcPlanner.recommendArc(motif.id, beastId);
    const soulEvolution = this.arcPlanner.planSoulEvolution(soulProfile, arcRecommendation.arc);

    // 3. 设计冲突
    const conflict = this.conflictDesigner.generateConflict(soulProfile, motif);

    // 4. 输出剧本包
    return {
      title,
      beastId,
      motif: {
        id: motif.id,
        name: motif.name,
        coreConflict: motif.coreConflict,
        moralProposition: motif.moralProposition
      },
      arc: soulEvolution,
      conflict,
      fiveActStructure: this.mapArcToFiveActs(soulEvolution),
      worldConstraints: {
        celestialConstraint: conflict.external.celestialConstraint
      }
    };
  }

  /**
   * 将弧线映射为五幕结构
   */
  mapArcToFiveActs(soulEvolution) {
    const acts = [
      { name: '序幕', purpose: '建立世界', soulState: soulEvolution.stages[0] },
      { name: '上升', purpose: '冲突触发', soulState: soulEvolution.stages[1] },
      { name: '高潮', purpose: '核心对抗', soulState: soulEvolution.stages[2] },
      { name: '转折', purpose: '代价显现', soulState: soulEvolution.stages[3] },
      { name: '尾声', purpose: '新平衡', soulState: soulEvolution.stages[4] }
    ];

    return acts.map((act, index) => ({
      actNumber: index + 1,
      ...act,
      tension: [0.1, 0.4, 0.8, 0.9, 0.3][index],
      requiredBeats: this.generateRequiredBeats(act.soulState, index)
    }));
  }

  generateRequiredBeats(soulState, actIndex) {
    const beatTemplates = [
      ['世界观展示', '异兽登场', '日常状态'],
      ['触发事件', '灵魂触动', '抉择萌芽'],
      ['核心对抗', '灵魂试炼', '高潮爆发'],
      ['代价付出', '真相揭露', '不可逆转'],
      ['新平衡', '余韵悠长', '主题回响']
    ];
    return beatTemplates[actIndex] || ['推进剧情'];
  }

  /**
   * 适配视频系统
   */
  adaptToVideoSystem(scriptPackage) {
    return {
      ...scriptPackage,
      videoAdaptation: {
        sceneCount: scriptPackage.fiveActStructure.length * 3, // 每幕3个镜头
        estimatedDuration: 720,
        keyVisualMoments: scriptPackage.fiveActStructure.map(act => ({
          act: act.actNumber,
          visual: act.soulState?.keyEvent || '',
          emotion: act.soulState?.layerActive || 'neutral'
        })),
        emotionArc: scriptPackage.fiveActStructure.map(act => ({
          act: act.actNumber,
          layer: act.soulState?.layerActive,
          tension: act.tension
        }))
      }
    };
  }

  /**
   * 获取核心主题
   */
  getCoreTheme(themeId) {
    return CORE_THEMES[themeId] || null;
  }

  /**
   * 获取所有核心主题
   */
  getAllCoreThemes() {
    return CORE_THEMES;
  }

  /**
   * 获取情感配方
   */
  getEmotionalFormula() {
    return EMOTIONAL_FORMULA;
  }

  /**
   * 获取情感节拍地图
   */
  getEmotionalBeatMap() {
    return EMOTIONAL_BEAT_MAP;
  }

  /**
   * 获取指定位置的情感节点
   */
  getEmotionalNode(position) {
    return EMOTIONAL_BEAT_MAP.find(n => n.position === position) || null;
  }

  /**
   * 获取世界观规则约束
   */
  getWorldRule(ruleId) {
    return WORLD_RULES[ruleId] || null;
  }

  /**
   * 获取所有世界观规则
   */
  getAllWorldRules() {
    return WORLD_RULES;
  }

  /**
   * 获取核心哲学问题
   */
  getPhilosophicalQuestion(questionId) {
    return CORE_PHILOSOPHICAL_QUESTIONS[questionId] || null;
  }

  /**
   * 获取所有核心哲学问题
   */
  getAllPhilosophicalQuestions() {
    return CORE_PHILOSOPHICAL_QUESTIONS;
  }

  /**
   * 获取感官词汇表
   */
  getSensoryVocabulary(category, wordId) {
    const cat = SENSORY_VOCABULARY[category];
    if (!cat) return null;
    return wordId ? cat[wordId] : cat;
  }

  /**
   * 获取所有感官词汇
   */
  getAllSensoryVocabulary() {
    return SENSORY_VOCABULARY;
  }

  /**
   * 获取小G成长模型
   */
  getXGGrowthStage(stageNumber) {
    return XG_GROWTH_MODEL.find(s => s.stage === stageNumber) || null;
  }

  /**
   * 获取所有小G成长阶段
   */
  getAllXGGrowthStages() {
    return XG_GROWTH_MODEL;
  }

  /**
   * 根据集数获取小G成长阶段
   */
  getXGGrowthStageByEpisode(episodeCode) {
    const stage = XG_GROWTH_MODEL.find(s => {
      const episodes = s.episodes.split('-');
      if (episodes.length === 1) {
        return s.episodes.includes(episodeCode);
      }
      const start = episodes[0];
      const end = episodes[1];
      return episodeCode >= start && episodeCode <= end;
    });
    return stage || XG_GROWTH_MODEL[0];
  }

  /**
   * 生成故事内核摘要（供外部系统调用）
   */
  generateStoryKernelSummary() {
    return {
      themes: Object.values(CORE_THEMES).map(t => ({ name: t.name, weight: t.weight })),
      emotionalFormula: {
        gentleSadness: EMOTIONAL_FORMULA.gentleSadness.proportion,
        aweMagnificence: EMOTIONAL_FORMULA.aweMagnificence.proportion,
        burningHope: EMOTIONAL_FORMULA.burningHope.proportion
      },
      philosophicalQuestions: Object.keys(CORE_PHILOSOPHICAL_QUESTIONS),
      growthStages: XG_GROWTH_MODEL.map(s => ({ stage: s.stage, name: s.name, age: s.age })),
      totalEpisodes: 64, // 10+18+18+18
      totalSeasons: 4
    };
  }
}

// ============ 导出 ============
module.exports = {
  StoryForge,
  ArcPlanner,
  ConflictDesigner,
  MotifEngine,
  ARC_TEMPLATES,
  MOTIF_TO_ARC,
  SHANHAI_MOTIFS,
  CORE_THEMES,
  EMOTIONAL_FORMULA,
  EMOTIONAL_BEAT_MAP,
  WORLD_RULES,
  CORE_PHILOSOPHICAL_QUESTIONS,
  SENSORY_VOCABULARY,
  XG_GROWTH_MODEL
};

// CLI 测试
if (require.main === module) {
  const forge = new StoryForge();
  console.log('\n📜 Nirath原创世界观剧本引擎测试\n');

  const script = forge.createScript({
    title: '守光巨兽睁眼',
    beastId: 'zhulong',
    motifId: 'time_cycle',
    template: 'origin_myth',
    soulProfile: {
      coreDrive: '领地守护与现象维持',
      keyWound: '永恒的孤独',
      coreNeed: '被理解',
      coreLie: '强大不需要陪伴',
      evolutionArc: '从纯粹的时空执行者到选择守护而非维持',
      tao: '无为而无不为'
    }
  });

  console.log('剧本标题：', script.title);
  console.log('母题：', script.motif.name);
  console.log('弧线：', script.arc.arcName);
  console.log('五幕结构：');
  script.fiveActStructure.forEach(act => {
    console.log(`  ${act.actNumber}. ${act.name} (张力${act.tension}) — ${act.soulState?.name || ''}`);
  });
}