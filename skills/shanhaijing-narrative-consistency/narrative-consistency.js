#!/usr/bin/env node
/**
 * Nirath原创世界观叙事一致性引擎 — Shanhaijing Narrative Consistency Engine
 *
 * 防止64集长篇设定漂移的全链路叙事警察
 * 追踪：异兽生死状态 / 道具位置 / 信息释放进度 / 小G成长阶段
 *
 * 融合策略：独立模块，可接入所有P0/P1/P2模块做一致性校验
 */

// ============ 异兽生命周期状态定义 ============
const BEAST_LIFECYCLE_STATES = {
  alive: { label: '存活', canAppear: true, canInteract: true },
  injured: { label: '受伤', canAppear: true, canInteract: true, restrictions: ['no_combat'] },
  dormant: { label: '沉睡', canAppear: false, canInteract: false },
  sealed: { label: '封印', canAppear: false, canInteract: false },
  deceased: { label: '死亡', canAppear: true, canInteract: false, restrictions: ['flashback_only', 'memory_only', 'spirit_form'] },
  ascended: { label: '升维', canAppear: true, canInteract: true, restrictions: ['limited_physical', 'spiritual_form'] },
  unknown: { label: '未知', canAppear: true, canInteract: true, restrictions: ['first_encounter'] }
};

// ============ 核心异兽出场规范（防止"死了又活"） ============
const BEAST_APPEARANCE_RULES = {
  dijiang: {
    firstAppearance: 'S1E1',
    lastAliveAppearance: 'S3E9',
    deathEpisode: 'S3E9',
    allowedPostDeath: ['S3E10_S4E10'], // 仅允许回忆/灵体形式
    forbiddenEpisodes: [], // 死亡后禁止以实体出现的集
    relationshipEvolution: [
      { episode: 'S1E1', stage: '庇护者', state: 'alive' },
      { episode: 'S1E5', stage: '家人', state: 'alive' },
      { episode: 'S2E12', stage: '牺牲准备', state: 'alive' },
      { episode: 'S3E9', stage: '牺牲者', state: 'deceased' },
      { episode: 'S4E10', stage: '记忆存在', state: 'deceased' }
    ],
    criticalRules: [
      'S3E9之后不得再以实体形式出现',
      'S3E10之后只能以回忆/灵体/笔记本记录形式出现',
      '任何S4集数中不得暗示光囊母兽"可能复活"'
    ]
  },
  baize: {
    firstAppearance: 'S2E3',
    lastAliveAppearance: 'S3E15',
    deathEpisode: 'S3E15',
    allowedPostDeath: ['S3E16_S4E10'],
    forbiddenEpisodes: [],
    relationshipEvolution: [
      { episode: 'S2E3', stage: '智慧之父', state: 'alive' },
      { episode: 'S2E8', stage: '精神导师', state: 'alive' },
      { episode: 'S3E12', stage: '临终传授', state: 'injured' },
      { episode: 'S3E15', stage: '离世', state: 'deceased' },
      { episode: 'S4E5', stage: '羽毛笔遗产', state: 'deceased' }
    ],
    criticalRules: [
      'S2E3之前不得出现（未登场）',
      'S3E15之后不得再以实体形式出现',
      '雪白智兽羽毛笔必须在S3E15之后成为小G的常规书写工具'
    ]
  },
  xuangui: {
    firstAppearance: 'S1E2',
    lastAliveAppearance: 'S4E10',
    deathEpisode: null, // 存活到最后
    allowedPostDeath: [],
    forbiddenEpisodes: [], // 全程可以出现
    relationshipEvolution: [
      { episode: 'S1E2', stage: '沉默陪伴', state: 'alive' },
      { episode: 'S2E5', stage: '导航者', state: 'alive' },
      { episode: 'S3E7', stage: '沉默之父', state: 'alive' },
      { episode: 'S4E8', stage: '永恒陪伴', state: 'alive' }
    ],
    criticalRules: [
      '全程存活，不得在任何集数中死亡',
      '背甲地图必须在每次长途旅行时激活发光',
      'S4结局必须确认冰甲龟兽继续存活'
    ]
  },
  jiuweihu: {
    firstAppearance: 'S1E3',
    lastAliveAppearance: 'S3E18',
    deathEpisode: 'S3E18', // 季终集牺牲
    allowedPostDeath: ['S4E1_S4E10'],
    forbiddenEpisodes: [],
    relationshipEvolution: [
      { episode: 'S1E3', stage: '幼崽伙伴', state: 'alive', tails: 1 },
      { episode: 'S1E8', stage: '童年伙伴', state: 'alive', tails: 3 },
      { episode: 'S2E10', stage: '成长伙伴', state: 'alive', tails: 5 },
      { episode: 'S3E15', stage: '长老守护者', state: 'alive', tails: 9 },
      { episode: 'S3E18', stage: '牺牲者', state: 'deceased', tails: 9 },
      { episode: 'S4E3', stage: '记忆传承', state: 'deceased', tails: 9 }
    ],
    criticalRules: [
      '尾巴数量必须随季节递增：S1(1-3尾)→S2(3-5尾)→S3(5-9尾)→S4(9尾/记忆)',
      'S3E18死亡后不得再以实体形式出现',
      '任何S4集数不得暗示九尾光狐"转世"或"重生"'
    ]
  },
  zhulong: {
    firstAppearance: 'S2E1',
    lastAliveAppearance: 'S4E5',
    deathEpisode: null,
    allowedPostDeath: [],
    forbiddenEpisodes: [],
    relationshipEvolution: [
      { episode: 'S2E1', stage: '威严存在', state: 'alive' },
      { episode: 'S2E15', stage: '知识传授者', state: 'alive' },
      { episode: 'S3E10', stage: '时间守护者', state: 'alive' },
      { episode: 'S4E5', stage: '终极试炼', state: 'alive' }
    ],
    criticalRules: [
      '守光巨兽睁眼=白天，闭眼=黑夜——任何出场必须遵守此规则',
      '不得在小G面前闭眼（会造成"时间跳跃"，8岁无法理解）'
    ]
  }
};

// ============ 道具状态追踪规范 ============
const PROP_STATE_RULES = {
  xg_notebook: {
    name: '炭笔笔记本',
    initialEpisode: 'S1E1',
    locationEvolution: [
      { episode: 'S1E1_S1E10', location: '脖子上挂着', state: 'active', content: '涂鸦为主' },
      { episode: 'S2E1_S2E18', location: '脖子上挂着', state: 'active', content: '图画+简单文字' },
      { episode: 'S3E1_S3E18', location: '脖子上挂着', state: 'active', content: '系统记录' },
      { episode: 'S4E1_S4E10', location: '脖子上挂着', state: 'active', content: '成熟书写' }
    ],
    criticalRules: [
      '任何集数不得丢失笔记本超过10分钟（记忆方舟）',
      'S2之后文字内容逐渐多于图画',
      'S4必须在笔记本中出现"光囊母兽/雪白智兽/九尾光狐"的名字（命名完成）'
    ]
  },
  xg_half_photo: {
    name: '半张照片',
    initialEpisode: 'S1E1',
    locationEvolution: [
      { episode: 'S1E1_S2E5', location: '藏在内袋', state: 'hidden', condition: '完整' },
      { episode: 'S2E6_S3E10', location: '偶尔拿出看', state: 'active', condition: '开始褪色' },
      { episode: 'S3E11_S4E10', location: '贴在笔记本扉页', state: 'integrated', condition: '大幅褪色但仍在' }
    ],
    criticalRules: [
      'S1不得被其他角色看到（私密物品）',
      'S3之后必须出现"照片开始褪色"的焦虑',
      'S4必须接受褪色是自然规律，不试图修复'
    ]
  },
  xg_charcoal_pen: {
    name: '炭笔',
    initialEpisode: 'S1E1',
    locationEvolution: [
      { episode: 'S1E1_S2E2', location: '插在头发里', state: 'active', condition: '常用' },
      { episode: 'S2E3_S4E10', location: '备用工具', state: 'backup', condition: '雪白智兽羽毛笔为主' }
    ],
    criticalRules: [
      'S2E3之后炭笔使用率必须下降（雪白智兽羽毛笔替代）',
      'S3之后炭笔只能作为"应急工具"出现',
      '不得在任何集数中完全丢失炭笔'
    ]
  },
  xg_baize_feather_pen: {
    name: '雪白智兽羽毛笔',
    initialEpisode: 'S2E3',
    locationEvolution: [
      { episode: 'S2E3_S2E10', location: '雪白智兽手中/演示用', state: 'mentor', condition: '演示' },
      { episode: 'S2E11_S3E14', location: '小G手中', state: 'active', condition: '常用' },
      { episode: 'S3E15_S4E10', location: '小G手中', state: 'legacy', condition: '遗产' }
    ],
    criticalRules: [
      'S2E3之前不得出现',
      'S3E15之后必须成为小G主要书写工具（雪白智兽遗产）',
      '书写时必须有微弱白光（雪白智兽光脉能量残留）'
    ]
  },
  xg_dijiang_feather: {
    name: '光囊母兽羽毛信物',
    initialEpisode: 'S3E9',
    locationEvolution: [
      { episode: 'S3E9_S3E12', location: '系在手腕上', state: 'mourning', condition: '温暖' },
      { episode: 'S4E1_S4E10', location: '系在手腕上', state: 'memory', condition: '微光' }
    ],
    criticalRules: [
      'S3E9之前不得出现（光囊母兽尚未牺牲）',
      '必须始终有微弱温暖光芒（光囊母兽残留光脉能量）',
      'S4不得熄灭光芒（暗示光囊母兽彻底消失）'
    ]
  },
  xg_xuangui_stone: {
    name: '冰甲龟兽石',
    initialEpisode: 'S1E2',
    locationEvolution: [
      { episode: 'S1E2_S4E10', location: '脖子上挂着', state: 'active', condition: '导航' }
    ],
    criticalRules: [
      '任何迷路场景必须出现冰甲龟兽石发光指路',
      '水中场景石头发光最强',
      '不得丢失或损坏'
    ]
  }
};

// ============ 信息释放进度规范（防止"过早揭示"或"遗忘伏笔"） ============
const INFORMATION_RELEASE_SCHEDULE = {
  // 第一季：灵生季 — 建立世界观基础
  season1: {
    episodeRange: 'S1E1_S1E12',
    mustReveal: [
      { episode: 'S1E1', info: '光脉大爆炸/山海境/光脉能量复苏/小G是孤儿', importance: 'critical' },
      { episode: 'S1E1', info: '光囊母兽是无面庇护者', importance: 'critical' },
      { episode: 'S1E2', info: '冰甲龟兽是导航者/背甲有地图', importance: 'major' },
      { episode: 'S1E3', info: '九尾光狐是童年伙伴/从幼崽开始', importance: 'major' },
      { episode: 'S1E5', info: '小G会写简单的字（命名初现）', importance: 'major' },
      { episode: 'S1E8', info: '旧世界遗迹存在/科技废墟', importance: 'major' },
      { episode: 'S1E10', info: '光脉能量五性（木火土金水）', importance: 'minor' }
    ],
    mustHide: [
      { info: '雪白智兽尚未登场', untilEpisode: 'S2E3', reason: 'S2才引入智慧导师' },
      { info: '光囊母兽会牺牲', untilEpisode: 'S3E5', reason: '过早揭示削弱冲击力' },
      { info: '时间循环真相', untilEpisode: 'S3E1', reason: '核心谜题不能过早揭示' },
      { info: '小G是"记录者"', untilEpisode: 'S2E10', reason: '能力需要渐进觉醒' }
    ]
  },
  // 第二季：灵盛季 — 引入智慧与冲突
  season2: {
    episodeRange: 'S2E1_S2E18',
    mustReveal: [
      { episode: 'S2E1', info: '守光巨兽存在/睁眼=白天闭眼=黑夜', importance: 'critical' },
      { episode: 'S2E3', info: '雪白智兽登场/智慧之父/知识守护者', importance: 'critical' },
      { episode: 'S2E8', info: '雪白智兽开始教授系统知识', importance: 'major' },
      { episode: 'S2E10', info: '小G意识到自己"记录者"身份', importance: 'critical' },
      { episode: 'S2E12', info: '光囊母兽为救小G开始准备牺牲（暗示）', importance: 'major' },
      { episode: 'S2E15', info: '猬毛凶兽/晶齿萌兽等凶兽的完整威胁', importance: 'major' }
    ],
    mustHide: [
      { info: '雪白智兽会死亡', untilEpisode: 'S3E10', reason: '需要建立深厚情感后才离别' },
      { info: '九尾光狐会牺牲', untilEpisode: 'S3E15', reason: '季终集冲击力' },
      { info: '太素的真实意图', untilEpisode: 'S4E1', reason: '终极谜题' }
    ]
  },
  // 第三季：灵收季 — 失去与理解
  season3: {
    episodeRange: 'S3E1_S3E18',
    mustReveal: [
      { episode: 'S3E1', info: '时间循环真相/文明呼吸周期', importance: 'critical' },
      { episode: 'S3E5', info: '光囊母兽牺牲的前兆（可预见的悲剧）', importance: 'critical' },
      { episode: 'S3E9', info: '光囊母兽牺牲/挡凶兽一击', importance: 'critical' },
      { episode: 'S3E12', info: '雪白智兽临终传授/羽毛笔遗产', importance: 'critical' },
      { episode: 'S3E15', info: '雪白智兽离世/知识传承', importance: 'critical' },
      { episode: 'S3E18', info: '九尾光狐牺牲/季终集高潮', importance: 'critical' }
    ],
    mustHide: [
      { info: '最终解决方案', untilEpisode: 'S4E8', reason: '需要完整理解后才能给出' }
    ]
  },
  // 第四季：灵藏季 — 整合与传承
  season4: {
    episodeRange: 'S4E1_S4E10',
    mustReveal: [
      { episode: 'S4E1', info: '小G进入"记录者"完整形态', importance: 'critical' },
      { episode: 'S4E5', info: '太素意图的完整揭示', importance: 'critical' },
      { episode: 'S4E8', info: '最终解决方案/整合所有知识', importance: 'critical' },
      { episode: 'S4E10', info: 'Nirath原创世界观写完/传承完成/开放式结局', importance: 'critical' }
    ],
    mustHide: [
      { info: '无', reason: '最终季所有信息应该释放' }
    ]
  }
};

// ============ 小G成长状态追踪规范 ============
const XG_GROWTH_TRACKING = {
  language: {
    stages: [
      { season: 'S1', stage: '灵语期', sentenceLength: '3-8字', vocabulary: '<200', canWrite: false, canName: false },
      { season: 'S2', stage: '初写期', sentenceLength: '8-15字', vocabulary: '200-500', canWrite: true, canName: true },
      { season: 'S3', stage: '表达期', sentenceLength: '15-25字', vocabulary: '500-1000', canWrite: true, canName: true },
      { season: 'S4', stage: '诗写期', sentenceLength: '25-30+字', vocabulary: '>1000', canWrite: true, canName: true }
    ],
    consistencyRules: [
      'S1不得出现复杂句子（>8字）',
      'S2之前不得出现"为什么"等抽象疑问',
      'S3之前不得使用隐喻',
      'S4必须出现诗意表达'
    ]
  },
  emotional: {
    stages: [
      { season: 'S1', dominant: '恐惧+好奇', canExpress: '即时', complexity: '单一情绪' },
      { season: 'S2', dominant: '信任+探索', canExpress: '延迟', complexity: '混合情绪（2种）' },
      { season: 'S3', dominant: '悲伤+理解', canExpress: '隐喻', complexity: '复杂情绪（3+种）' },
      { season: 'S4', dominant: '使命感+平静', canExpress: '诗意', complexity: '全光谱情绪' }
    ],
    consistencyRules: [
      'S1不得出现"使命感"或"传承"等抽象情感',
      'S2之前不得出现"理解异兽动机"的共情',
      'S3必须出现"失去光囊母兽"的悲伤贯穿全季',
      'S4必须出现"接受失去"的平静'
    ]
  },
  aura: {
    stages: [
      { season: 'S1', level: '感知者', canSee: true, canSense: true, canCommunicate: false },
      { season: 'S2', level: '共鸣者', canSee: true, canSense: true, canCommunicate: true },
      { season: 'S3', level: '调和者', canSee: true, canSense: true, canCommunicate: true, canHeal: true },
      { season: 'S4', level: '记录者', canSee: true, canSense: true, canCommunicate: true, canHeal: true, canTransform: true }
    ],
    consistencyRules: [
      'S1不得与异兽语言交流（只能感知情绪）',
      'S2才能开始简单交流（单字/词汇）',
      'S3才能使用光脉能量进行简单治愈',
      'S4才能完成"书写改变命运"的能力'
    ]
  }
};

// ============ 叙事一致性引擎核心类 ============
class NarrativeConsistencyEngine {
  constructor() {
    this.beastStates = new Map(); // 异兽当前状态
    this.propStates = new Map(); // 道具当前状态
    this.revealedInfo = new Set(); // 已揭示信息
    this.hiddenInfo = new Map(); // 待揭示信息
    this.xgState = { language: 'S1', emotional: 'S1', aura: 'S1' };
    this.violations = []; // 违规记录
    this.warnings = []; // 警告记录
  }

  // ============ 异兽状态管理 ============

  /**
   * 注册异兽初始状态
   */
  registerBeast(beastId, initialEpisode, initialState = 'unknown') {
    const rules = BEAST_APPEARANCE_RULES[beastId];
    if (!rules) {
      this.warn(`未注册的异兽: ${beastId}，请补充出场规范`);
      return null;
    }

    const state = {
      beastId,
      currentState: initialState,
      firstAppearance: rules.firstAppearance,
      lastAliveAppearance: rules.lastAliveAppearance,
      deathEpisode: rules.deathEpisode,
      currentEpisode: initialEpisode,
      relationshipStage: this.getRelationshipStage(beastId, initialEpisode),
      allowedPostDeath: rules.allowedPostDeath,
      violations: []
    };

    this.beastStates.set(beastId, state);
    return state;
  }

  /**
   * 获取指定集数的异兽关系阶段
   */
  getRelationshipStage(beastId, episodeCode) {
    const rules = BEAST_APPEARANCE_RULES[beastId];
    if (!rules || !rules.relationshipEvolution) return null;

    // 找到该集数对应的阶段
    const stage = rules.relationshipEvolution.find(
      s => s.episode === episodeCode
    );

    if (stage) return stage;

    // 如果没有精确匹配，找到最近的上一阶段
    const sorted = rules.relationshipEvolution.sort((a, b) => {
      return this.compareEpisodes(a.episode, b.episode);
    });

    let lastStage = null;
    for (const s of sorted) {
      if (this.compareEpisodes(s.episode, episodeCode) <= 0) {
        lastStage = s;
      } else {
        break;
      }
    }
    return lastStage;
  }

  /**
   * 更新异兽状态
   */
  updateBeastState(beastId, newState, episodeCode, context = '') {
    const state = this.beastStates.get(beastId);
    if (!state) {
      this.warn(`尝试更新未注册的异兽状态: ${beastId}`);
      return null;
    }

    const rules = BEAST_APPEARANCE_RULES[beastId];
    const lifecycle = BEAST_LIFECYCLE_STATES[newState];

    if (!lifecycle) {
      this.violate(`非法异兽状态: ${newState}`, beastId, episodeCode, context);
      return state;
    }

    // 检查死亡后实体出现
    if (state.deathEpisode && this.compareEpisodes(episodeCode, state.deathEpisode) > 0) {
      if (newState === 'alive' || newState === 'injured') {
        this.violate(
          `严重违规: ${beastId} 在 ${state.deathEpisode} 已死亡，但 ${episodeCode} 试图设为${lifecycle.label}`,
          beastId, episodeCode, context, 'CRITICAL'
        );
        return state;
      }

      // 检查是否允许以特殊形式出现
      const allowed = rules.allowedPostDeath.some(range => {
        const [start, end] = range.split('_');
        return this.compareEpisodes(episodeCode, start) >= 0 &&
               this.compareEpisodes(episodeCode, end) <= 0;
      });

      if (!allowed && newState !== 'deceased') {
        this.violate(
          `违规: ${beastId} 死亡后只能在特定集数以回忆/灵体形式出现`,
          beastId, episodeCode, context
        );
      }
    }

    // 检查首次出场前不得出现
    if (this.compareEpisodes(episodeCode, rules.firstAppearance) < 0) {
      this.violate(
        `违规: ${beastId} 首次出场在 ${rules.firstAppearance}，不得提前出现在 ${episodeCode}`,
        beastId, episodeCode, context
      );
    }

    state.currentState = newState;
    state.currentEpisode = episodeCode;
    state.relationshipStage = this.getRelationshipStage(beastId, episodeCode);

    return state;
  }

  /**
   * 检查异兽是否可以在指定集数以指定形式出现
   */
  canBeastAppear(beastId, episodeCode, appearanceType = 'physical') {
    const state = this.beastStates.get(beastId);
    if (!state) return { allowed: false, reason: '未注册' };

    const rules = BEAST_APPEARANCE_RULES[beastId];

    // 检查首次出场
    if (this.compareEpisodes(episodeCode, rules.firstAppearance) < 0) {
      return { allowed: false, reason: `首次出场前: ${rules.firstAppearance}` };
    }

    // 检查死亡后实体出现
    if (state.deathEpisode && this.compareEpisodes(episodeCode, state.deathEpisode) > 0) {
      if (appearanceType === 'physical') {
        return { allowed: false, reason: `已在${state.deathEpisode}死亡，实体禁止出现` };
      }

      // 检查允许范围
      const allowed = rules.allowedPostDeath.some(range => {
        const [start, end] = range.split('_');
        return this.compareEpisodes(episodeCode, start) >= 0 &&
               this.compareEpisodes(episodeCode, end) <= 0;
      });

      if (!allowed) {
        return { allowed: false, reason: '不在允许的后期出场范围内' };
      }
    }

    return { allowed: true, reason: '允许出场' };
  }

  // ============ 道具状态管理 ============

  /**
   * 注册道具
   */
  registerProp(propId, initialEpisode) {
    const rules = PROP_STATE_RULES[propId];
    if (!rules) {
      this.warn(`未注册的道具: ${propId}`);
      return null;
    }

    const initialState = rules.locationEvolution.find(
      e => this.isEpisodeInRange(initialEpisode, e.episode)
    );

    const state = {
      propId,
      name: rules.name,
      currentLocation: initialState?.location || '未知',
      currentState: initialState?.state || 'unknown',
      condition: initialState?.condition || '未知',
      initialEpisode,
      violations: []
    };

    this.propStates.set(propId, state);
    return state;
  }

  /**
   * 更新道具状态
   */
  updatePropState(propId, episodeCode, changes = {}) {
    const state = this.propStates.get(propId);
    if (!state) {
      this.warn(`尝试更新未注册的道具: ${propId}`);
      return null;
    }

    const rules = PROP_STATE_RULES[propId];

    // 检查道具是否应该已经存在
    if (this.compareEpisodes(episodeCode, rules.initialEpisode) < 0) {
      this.violate(
        `违规: ${rules.name} 在 ${rules.initialEpisode} 才首次出现，不得在 ${episodeCode} 提前出现`,
        propId, episodeCode, '', 'CRITICAL'
      );
    }
    if (changes.location) state.currentLocation = changes.location;
    if (changes.state) state.currentState = changes.state;
    if (changes.condition) state.condition = changes.condition;

    return state;
  }

  /**
   * 获取道具在指定集数应有的状态
   */
  getPropExpectedState(propId, episodeCode) {
    const rules = PROP_STATE_RULES[propId];
    if (!rules) return null;

    const expected = rules.locationEvolution.find(
      e => this.isEpisodeInRange(episodeCode, e.episode)
    );

    return expected || null;
  }

  // ============ 信息释放管理 ============

  /**
   * 标记信息已揭示
   */
  revealInfo(infoId, episodeCode) {
    this.revealedInfo.add(infoId);
    this.hiddenInfo.delete(infoId);
  }

  /**
   * 检查信息是否已揭示
   */
  isInfoRevealed(infoId) {
    return this.revealedInfo.has(infoId);
  }

  /**
   * 检查信息释放是否合规
   */
  validateInfoRelease(infoId, episodeCode, context = '') {
    // 检查是否过早揭示
    for (const [season, data] of Object.entries(INFORMATION_RELEASE_SCHEDULE)) {
      const hidden = data.mustHide.find(h => h.info === infoId);
      if (hidden) {
        if (this.compareEpisodes(episodeCode, hidden.untilEpisode) < 0) {
          this.violate(
            `信息释放违规: "${infoId}" 不得在 ${episodeCode} 揭示（应等到 ${hidden.untilEpisode} 之后）\n原因: ${hidden.reason}`,
            'INFO', episodeCode, context, 'CRITICAL'
          );
          return { valid: false, reason: '过早揭示', shouldWaitUntil: hidden.untilEpisode };
        }
      }
    }

    return { valid: true, reason: '释放时机合规' };
  }

  /**
   * 检查信息释放遗漏（该揭示但未揭示）
   */
  checkMissingRevelations(episodeCode) {
    const missing = [];

    for (const [season, data] of Object.entries(INFORMATION_RELEASE_SCHEDULE)) {
      const shouldReveal = data.mustReveal.filter(r => {
        return r.episode === episodeCode && !this.revealedInfo.has(r.info);
      });
      missing.push(...shouldReveal);
    }

    return missing;
  }

  // ============ 小G成长状态管理 ============

  /**
   * 获取小G在指定集数的预期成长状态
   */
  getXGExpectedState(episodeCode) {
    const season = episodeCode.substring(0, 2);

    const language = XG_GROWTH_TRACKING.language.stages.find(s => s.season === season);
    const emotional = XG_GROWTH_TRACKING.emotional.stages.find(s => s.season === season);
    const aura = XG_GROWTH_TRACKING.aura.stages.find(s => s.season === season);

    return { language, emotional, aura };
  }

  /**
   * 校验小G语言是否符合当前阶段
   */
  validateXGLanguage(episodeCode, text) {
    const season = episodeCode.substring(0, 2);
    const stage = XG_GROWTH_TRACKING.language.stages.find(s => s.season === season);

    if (!stage) return { valid: false, reason: '未知季' };

    const sentences = text.split(/[。！？]/).filter(s => s.trim());
    const violations = [];

    for (const sentence of sentences) {
      const charCount = sentence.trim().length;
      if (charCount > parseInt(stage.sentenceLength.split('-')[1])) {
        violations.push({ sentence: sentence.trim(), length: charCount, maxAllowed: stage.sentenceLength });
      }
    }

    if (violations.length > 0) {
      this.violate(
        `小G语言违规: ${episodeCode} 中 ${violations.length} 个句子超过 ${stage.sentenceLength} 字限制`,
        'XG', episodeCode, JSON.stringify(violations)
      );
    }

    return {
      valid: violations.length === 0,
      violations,
      stage: stage.stage,
      expectedLength: stage.sentenceLength
    };
  }

  /**
   * 校验小G情感表达是否符合阶段
   */
  validateXGEmotion(episodeCode, emotion) {
    const season = episodeCode.substring(0, 2);
    const stage = XG_GROWTH_TRACKING.emotional.stages.find(s => s.season === season);

    if (!stage) return { valid: false, reason: '未知季' };

    // S1不得出现"使命感"
    if (season === 'S1' && emotion.includes('使命感')) {
      this.violate(`小G情感违规: S1不得出现"使命感"`, 'XG', episodeCode, emotion, 'CRITICAL');
      return { valid: false, reason: 'S1不得出现使命感' };
    }

    return { valid: true, allowedEmotions: stage.dominant };
  }

  // ============ 全量校验接口 ============

  /**
   * 一键校验整集一致性
   */
  validateEpisode(episodeCode, episodeData) {
    const results = {
      episodeCode,
      beastChecks: [],
      propChecks: [],
      infoChecks: [],
      xgChecks: [],
      passed: true,
      violations: [],
      warnings: []
    };

    // 校验异兽出场
    if (episodeData.beasts) {
      for (const beast of episodeData.beasts) {
        const check = this.canBeastAppear(beast.id, episodeCode, beast.appearanceType);
        results.beastChecks.push({ beastId: beast.id, ...check });
        if (!check.allowed) {
          results.passed = false;
          results.violations.push({ type: 'beast', ...check });
        }
      }
    }

    // 校验道具
    if (episodeData.props) {
      for (const prop of episodeData.props) {
        const expected = this.getPropExpectedState(prop.id, episodeCode);
        const actual = this.propStates.get(prop.id);
        results.propChecks.push({
          propId: prop.id,
          expectedLocation: expected?.location,
          actualLocation: actual?.currentLocation,
          valid: expected?.location === actual?.currentLocation
        });
      }
    }

    // 校验信息释放
    if (episodeData.revealedInfo) {
      for (const info of episodeData.revealedInfo) {
        const check = this.validateInfoRelease(info, episodeCode);
        results.infoChecks.push({ infoId: info, ...check });
        if (!check.valid) {
          results.passed = false;
          results.violations.push({ type: 'info', ...check });
        }
      }
    }

    // 校验小G语言
    if (episodeData.xgDialogue) {
      const langCheck = this.validateXGLanguage(episodeCode, episodeData.xgDialogue);
      results.xgChecks.push({ type: 'language', ...langCheck });
      if (!langCheck.valid) results.passed = false;
    }

    return results;
  }

  // ============ 辅助方法 ============

  compareEpisodes(ep1, ep2) {
    const parse = (ep) => {
      const match = ep.match(/S(\d+)E(\d+)/);
      if (!match) return 0;
      return parseInt(match[1]) * 100 + parseInt(match[2]);
    };
    return parse(ep1) - parse(ep2);
  }

  isEpisodeInRange(episode, range) {
    if (range === episode) return true;
    if (range.includes('_')) {
      const [start, end] = range.split('_');
      return this.compareEpisodes(episode, start) >= 0 &&
             this.compareEpisodes(episode, end) <= 0;
    }
    return false;
  }

  violate(message, entity, episode, context = '', severity = 'WARNING') {
    const violation = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      entity,
      episode,
      context
    };
    this.violations.push(violation);
    console.error(`[叙事一致性] ${severity}: ${message} (${entity} @ ${episode})`);
  }

  warn(message) {
    const warning = {
      timestamp: new Date().toISOString(),
      message
    };
    this.warnings.push(warning);
    console.warn(`[叙事一致性] WARN: ${message}`);
  }

  /**
   * 生成一致性报告
   */
  generateReport() {
    return {
      totalViolations: this.violations.length,
      totalWarnings: this.warnings.length,
      criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
      violations: this.violations,
      warnings: this.warnings,
      beastStates: Array.from(this.beastStates.entries()),
      propStates: Array.from(this.propStates.entries()),
      revealedInfoCount: this.revealedInfo.size,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 清空违规记录（用于新集校验）
   */
  clearViolations() {
    this.violations = [];
    this.warnings = [];
  }
}

// ============ 导出 ============
module.exports = {
  NarrativeConsistencyEngine,
  BEAST_LIFECYCLE_STATES,
  BEAST_APPEARANCE_RULES,
  PROP_STATE_RULES,
  INFORMATION_RELEASE_SCHEDULE,
  XG_GROWTH_TRACKING
};

// CLI 测试
if (require.main === module) {
  const engine = new NarrativeConsistencyEngine();

  console.log('\n🔍 Nirath原创世界观叙事一致性引擎测试\n');

  // 注册光囊母兽
  engine.registerBeast('dijiang', 'S1E1', 'alive');
  console.log('光囊母兽注册完成');

  // 测试正常更新
  engine.updateBeastState('dijiang', 'alive', 'S2E5', '日常互动');
  console.log('光囊母兽 S2E5 状态更新: alive');

  // 测试死亡后实体出现（应该触发严重违规）
  engine.updateBeastState('dijiang', 'alive', 'S3E10', '试图复活');
  console.log('光囊母兽 S3E10 实体出现: 已触发违规检测');

  // 注册笔记本
  engine.registerProp('xg_notebook', 'S1E1');
  console.log('笔记本注册完成');

  // 测试道具状态
  const notebookState = engine.getPropExpectedState('xg_notebook', 'S2E5');
  console.log(`笔记本 S2E5 预期状态: ${notebookState?.location || '未知'}`);

  // 生成报告
  const report = engine.generateReport();
  console.log(`\n一致性检测报告:`);
  console.log(`- 总违规: ${report.totalViolations}`);
  console.log(`- 严重违规: ${report.criticalViolations}`);
  console.log(`- 警告: ${report.totalWarnings}`);

  if (report.violations.length > 0) {
    console.log('\n违规详情:');
    report.violations.forEach(v => {
      console.log(`  [${v.severity}] ${v.message} (${v.entity} @ ${v.episode})`);
    });
  }
}