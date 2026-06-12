/**
 * IP Deconstructor — IP 解析重构引擎 (L1/M6)
 * 深度解析经典作品，提取精神内核，为新创作提供基因
 */

function run(input) {
  const sourceType = input.sourceType || 'auto';
  const sourceTitle = input.sourceTitle || '';
  const extractDepth = input.extractDepth || 'medium';

  // 内置经典IP数据库
  const ipDB = {
    '西游记': {
      structurePattern: '英雄之旅+ episodic冒险',
      rhythmTemplate: '遇险→抗争→求助→化解→前行，循环推进',
      suspensionMechanism: '每难必有转折，绝处逢生',
      pacingSignature: '紧张与幽默交替，张弛有度',
      spiritualCore: {
        coreDNA: '反抗权威→历经磨难→修得正果，本质是自由灵魂被规训的悲剧与成长',
        irreducibleElements: ['孙悟空的反叛精神', '师徒四人性格互补', '八十一难的修行隐喻'],
        emotionalSignature: '热血+幽默+悲悯',
        culturalResonance: '中国人对自由与秩序的永恒矛盾',
        philosophicalAnchor: '修行不是消灭本性，而是学会与本性共处'
      },
      recommendedGenre: '科幻+东方神话',
      visualDirection: '赛博朋克+国漫美学，霓虹光影+古典元素'
    },
    '山海经': {
      structurePattern: '散点叙事，异兽地理志',
      rhythmTemplate: '探索→发现→记录→再探索',
      suspensionMechanism: '未知生物的恐惧与好奇',
      pacingSignature: '舒缓铺陈+突然惊悚',
      spiritualCore: {
        coreDNA: '先民对未知世界的想象与敬畏，万物有灵的原始宇宙观',
        irreducibleElements: ['异兽的奇幻想象', '人与自然的共生关系', '地理与神话的交织'],
        emotionalSignature: '敬畏+好奇+神秘',
        culturalResonance: '中华民族最初的想象力宝库',
        philosophicalAnchor: '世界远比人类所知的广阔和奇妙'
      },
      recommendedGenre: '奇幻冒险+纪录片风格',
      visualDirection: '水墨+3D融合，古卷质感+现代光影'
    },
    '封神演义': {
      structurePattern: '宿命论+阵营对抗+封神榜',
      rhythmTemplate: '布阵→斗法→破阵→封神，层层递进',
      suspensionMechanism: '天命与人事的矛盾',
      pacingSignature: '宏大叙事中的个人悲剧',
      spiritualCore: {
        coreDNA: '天命难违与个人意志的对抗，封神背后是权力重分配的残酷',
        irreducibleElements: ['封神榜的宿命感', '仙凡两界的力量体系', '正邪并非绝对'],
        emotionalSignature: '悲壮+宿命+史诗',
        culturalResonance: '对命运的无奈与抗争',
        philosophicalAnchor: '所谓天命，不过是赢家的叙事'
      },
      recommendedGenre: '史诗奇幻+权谋',
      visualDirection: '暗黑东方美学，青铜器纹样+雷电特效'
    }
  };

  // 查找匹配的IP
  let matched = null;
  for (const [key, val] of Object.entries(ipDB)) {
    if (sourceTitle.includes(key) || key.includes(sourceTitle)) {
      matched = val;
      break;
    }
  }

  if (!matched) {
    // 通用IP解析模板
    matched = {
      structurePattern: '经典三幕结构',
      rhythmTemplate: '铺垫→发展→高潮→结局',
      suspensionMechanism: '信息差与角色冲突',
      pacingSignature: '标准叙事节奏',
      spiritualCore: {
        coreDNA: `${sourceTitle}的核心精神需要深入分析原文本`,
        irreducibleElements: ['待分析'],
        emotionalSignature: '待分析',
        culturalResonance: '待分析',
        philosophicalAnchor: '待分析'
      },
      recommendedGenre: '根据IP特性定制',
      visualDirection: '保留原作美学基调+现代视觉升级'
    };
  }

  const depth = extractDepth === 'deep' ? 1.0 : extractDepth === 'light' ? 0.5 : 0.75;

  return {
    sourceAnalysis: {
      structurePattern: matched.structurePattern,
      rhythmTemplate: matched.rhythmTemplate,
      suspensionMechanism: matched.suspensionMechanism,
      pacingSignature: matched.pacingSignature
    },
    characterMatrix: {
      relationshipTopology: '角色关系网以主角为核心向外辐射',
      archetypeMapping: { '主角': '英雄原型', '导师': '智慧长者', '反派': '阴影原型' },
      conflictMatrix: ['理想vs现实', '个人vs集体', '自由vs秩序'],
      characterArchetypes: ['英雄', '导师', '守门人', '变形者', '伙伴']
    },
    spiritualCore: {
      ...matched.spiritualCore,
      coreDNA: depth >= 0.75 ? matched.spiritualCore.coreDNA : matched.spiritualCore.coreDNA.slice(0, 30) + '...',
      analysisDepth: extractDepth
    },
    worldviewRebuild: {
      recommendedGenre: matched.recommendedGenre,
      visualDirection: matched.visualDirection,
      newSettingSuggestion: `将${sourceTitle}的精神内核移植到现代/未来语境`,
      adaptationNotes: '保留精神内核，更换时代背景和具体事件'
    },
    retentionPlan: {
      elementsToKeep: matched.spiritualCore.irreducibleElements,
      elementsToTransform: ['具体情节事件', '时代背景', '部分角色身份'],
      elementsToDiscard: ['过时的价值观', '与目标受众不匹配的元素']
    },
    riskWarnings: ['避免简单翻拍', '注意版权合规', '保持足够的原创性'],
    comparisonMatrix: {
      original: { setting: sourceTitle + '原设定', tone: '原著基调', protagonist: '原著主角' },
      rebuild: { setting: matched.recommendedGenre, tone: '现代重构', protagonist: '精神继承者' }
    }
  };
}

module.exports = { run };
