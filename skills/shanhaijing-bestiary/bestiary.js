#!/usr/bin/env node
/**
 * Nirath原创世界观异兽图鉴系统 - Shanhaijing Bestiary
 *
 * 管理32只核心异兽的完整档案(S级4只、A级8只、B级12只、C级8只)
 *
 * 【故事内核融入】
 * 主角:小G(8岁,2147年光脉大爆炸唯一幸存者)
 * 核心主题:记忆即存在、命名即理解、万物有灵
 * 世界观:5大区域(南山/西山/北山/东山/中山) + 3特殊(海外/大荒/海内)
 * 能量系统:光脉能量(Aura) - 旧世界科技能量重构
 * 分级:C(灵兽) → B(异兽) → A(神灵) → S(创世)
 *
 * 每只异兽包含:appearance、abilities、personality、habitat、soulThreeLayers、voiceProfile
 * 新增:Nirath原创世界观原文、五大元素属性、与小G关系、核心场景、光脉能量浓度需求
 *
 * 融合策略:深度替换 seedance-character-manager,以bestiary为唯一角色源
 */

// ============ 四级分级体系 ============
const BEAST_TIERS = {
  S: { name: '创世/自然神', count: 4, visualImpact: '极端', priority: '最高' },
  A: { name: '瑞兽/妖兽/灵兽核心', count: 8, visualImpact: '高', priority: '高' },
  B: { name: '重要异兽', count: 12, visualImpact: '中', priority: '中' },
  C: { name: '辅助异兽', count: 8, visualImpact: '低', priority: '按需' }
};

// ============ 32只核心异兽完整档案 ============
const BESTIARY = {
  // ============ S级:创世/自然神(4只)===========

  // 【光囊母兽】小G的"无面之母"--无条件的爱
  dijiang: {
    id: 'dijiang',
    name: '光囊母兽',
    nameEn: 'Dijiang / Hundun',
    category: 'creation_god',
    species: 'dijiang',
    tier: 'S',

    // 【故事内核】《Nirath原创世界观·晶脉山脉》原文
    shanhaijingText: '天山有神焉,其状如黄囊,赤如光焰,六足四翼,浑敦无面目,是识歌舞。',
    fiveElement: '土', // 承载、包容

    appearance: {
      body: '黄囊状身躯,赤如光焰,六足四翼,无面目',
      size: '幼年体约小汽车大小,成年体可达数百米',
      signatureFeatures: [
        '无面--没有眼睛、耳朵、鼻子、嘴巴,只有温暖的赤金色光芒',
        '六足四翼,每条腿末端有柔软肉垫',
        '身体表面有类似岩浆流动的纹理',
        '无评判的绝对接纳--不看、不听、不说,只感受'
      ],
      colorPalette: {
        primary: '#FFD700',    // 赤金色
        secondary: '#FF4500',  // 丹火橙
        accent: '#8B4513',     // 深褐
        glow: '#FFA500'        // 温暖橙光
      },
      texture: {
        skin: '囊状身体光滑温暖,表面有岩浆流动纹理',
        eyes: '无面--没有五官,只有一团温暖的赤金色光芒',
        breath: '不呼吸,但身体发出低频共鸣--光囊母兽的"歌舞"'
      }
    },

    abilities: [
      {
        name: '绝对庇护',
        description: '用身体抵挡任何攻击,为小G提供无条件的安全感',
        visual: '光囊母兽用身体包裹小G,任何攻击都无法穿透它的温暖光芒'
      },
      {
        name: '情绪感知',
        description: '通过光脉能量场感知周围所有生命的情绪',
        visual: '无面却能"感受"到小G的恐惧、悲伤、喜悦'
      },
      {
        name: '歌舞',
        description: '通过光脉能量共振创造"极乐"状态--不是视觉听觉,而是光脉能量共鸣',
        visual: '低频振动让小G感到前所未有的安宁'
      },
      {
        name: '无限生长',
        description: '光囊母兽会随时间无限生长--从幼年体到成年体',
        visual: '从几米到几百米的生命奇迹'
      }
    ],

    personality: {
      core: '无面之爱--绝对的温和与包容',
      instinct: '无条件庇护与感受',
      wound: '永恒的孤独--作为创世神,无法被真正理解',
      evolution: '从纯粹的庇护者到选择为小G牺牲',
      dialogueStyle: '不言语--用身体温度和低频共鸣表达一切'
    },

    habitat: {
      name: '天山 / 中央光域',
      description: '天山深处,幼年体在光之森域游荡',
      atmosphere: '温暖的永恒黄昏,被光囊母兽光芒照亮的洞穴',
      element: 'earth'
    },

    // 【故事内核】与小G的关系
    relationshipWithXG: {
      role: '无面之母--替代母亲给予安全感',
      firstMeeting: '第一集:小G被C级异兽逼到山洞,光囊母兽用身体挡住攻击并包裹他',
      stages: [
        '第一阶段(1-10天):庇护者--安全的来源',
        '第二阶段(10天-6个月):玩伴--小G给光囊母兽讲旧世界故事',
        '第三阶段(6个月-2年):家人--"我的大朋友"',
        '第四阶段(2年-牺牲):灵魂伴侣--存在的证明'
      ],
      sacrifice: '第三集:光囊母兽为保护小G挡下凶兽一击,慢慢死去。小G抱着它感受体温流失',
      legacy: '小G在笔记本上写下关于光囊母兽最长最深情的一篇。手腕系着光囊母兽羽毛作为信物'
    },

    // 【故事内核】核心场景
    coreScene: {
      name: '无面之暖',
      episode: 'S1E1',
      description: '小G被C级异兽逼到山洞角落,光囊母兽用身体挡住攻击,然后包裹小G。小Ginitially恐惧,但光囊母兽的温度("像妈妈的被子")让他放松',
      emotionalImpact: '恐惧消融于温柔--系列中最温暖的画面',
      symbolism: '光囊母兽的无面象征无条件的爱--不看、不评判、只是存在'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '无条件庇护与感受',
        behavioralPatterns: ['包裹庇护', '低频共鸣', '无限生长'],
        emotionalExpressions: {
          anger: '光芒变为暗红,身体膨胀,低频共鸣变为警告振动',
          joy: '赤金色光芒大盛,身体舒展,共鸣如温暖歌谣',
          fear: '无--光囊母兽不知恐惧',
          sadness: '光芒暗淡,身体蜷缩,共鸣低沉如挽歌'
        },
        fightOrFlight: '绝对庇护--用身体抵挡一切'
      },
      humanity: {
        woundPatterns: [
          {
            name: '永恒的孤独',
            coreNeed: '被理解',
            coreLie: '强大不需要陪伴'
          },
          {
            name: '无法言说的悲哀',
            coreNeed: '被命名--光囊母兽直到小G给它取名才被"确认"存在'
          }
        ],
        evolutionArc: '从"纯粹的庇护者"经"感受小G的情感"到"选择为小G牺牲"',
        relationships: {
          withHumans: '通过小G第一次被真正"看见"',
          withOtherGods: '尊重但疏离',
          withNature: '融为一体'
        },
        moralAlignment: '绝对善良--无条件的爱'
      },
      spirituality: {
        tao: '无为而无不为--不看不听不说,但感受一切',
        wuwei: '不评判,只存在',
        harmony: '与万物同频共振',
        cosmicRole: '无条件之爱的化身'
      }
    },

    voiceProfile: {
      baseTimbre: '地底心跳+低频共鸣+温暖振动',
      vocalRange: { min: 20, max: 100 },
      volumeRange: { min: 30, max: 90 },
      speechPatterns: {
        normal: '无言语--只有低频共鸣',
        angry: '共鸣频率加快,带有警告意味',
        tender: '最温柔的低频--如母亲哼唱',
        commanding: '共鸣震动天地,万物感受其存在'
      },
      signatureSounds: [
        '包裹小G时的温暖共鸣',
        '感受情绪时的频率变化',
        '牺牲前的最后低频--如告别歌谣'
      ]
    }
  },

  // 【守光巨兽】时间的守夜人
  zhulong: {
    id: 'zhulong',
    name: '守光巨兽',
    nameEn: 'Zhulong',
    category: 'natural_god',
    species: 'dragon',
    tier: 'S',

    shanhaijingText: '西北海之外,赤水之北,有章尾山。有神,星渊之眼蛇身而赤,直目正乘,其瞑乃晦,其视乃明,不食不寝不息,风雨是谒。是烛九阴,是谓守光巨兽。',
    fiveElement: '无', // 守光巨兽就是时间本身,超越五大元素

    appearance: {
      body: '万米赤红龙身,盘绕章尾山,星渊之眼蛇身',
      size: '山岳级--传说身体环绕半个世界',
      signatureFeatures: [
        '竖目正乘--眼睛竖直,睁开为昼,闭合为夜',
        '星渊之眼蛇身而赤--不是恐怖的星渊之眼,而是超越理解的神性面容',
        '不食不寝不息--永恒的机制'
      ],
      colorPalette: {
        primary: '#DC143C',    // 赤红
        secondary: '#FFD700',  // 金色
        accent: '#1A1A1A',     // 玄黑
        glow: '#FF4500'        // 熔岩橙
      },
      texture: {
        skin: '鳞片如冷却的熔岩,缝隙间有暗红光芒流动',
        eyes: '竖瞳金睛,瞳孔深处仿佛有太阳在燃烧',
        breath: '呼吸即风雨--不食不寝不息'
      }
    },

    abilities: [
      {
        name: '操控昼夜',
        description: '睁眼为昼,闭眼为夜',
        visual: '天地亮度随瞳孔开合瞬间切换,光线如瀑布倾泻'
      },
      {
        name: '四季掌控',
        description: '吹气为冬,呼气为夏',
        visual: '气息化为冰晶或热浪,天地气候瞬间转换'
      },
      {
        name: '时间感知',
        description: '感知时间流动,可"看到"过去和未来片段',
        visual: '被注视区域万物加速衰老或凝滞'
      },
      {
        name: '边界守护',
        description: '阻止任何生命越过世界边界',
        visual: '大荒经边缘的终极屏障'
      }
    ],

    personality: {
      core: '时间本身--永恒的守夜人',
      instinct: '维持昼夜交替与世界边界',
      wound: '永恒的孤独--见证万物生灭却无法参与',
      evolution: '从纯粹的时空执行者到选择守护而非维持',
      dialogueStyle: '古老而缓慢,每个字都带着时间的重量'
    },

    habitat: {
      name: '章尾山 / 大荒经',
      description: '大荒经边缘--世界的边界',
      atmosphere: '永恒黄昏,天光从龙瞳中透出',
      element: 'fire'
    },

    relationshipWithXG: {
      role: '终极敬畏--时间的具象化',
      firstMeeting: '小G在大荒经最接近守光巨兽的面部',
      stages: [
        '贯穿全系列:小G每一次日出日落都感受守光巨兽的"呼吸"',
        '大荒经:面对守光巨兽时,所有语言和思考都变得无意义'
      ],
      sacrifice: '无--守光巨兽永恒存在',
      legacy: '小G理解了"时间"的本质--循环而非直线'
    },

    coreScene: {
      name: '时间之凝视',
      episode: 'S4E10',
      description: '小G在大荒经面对守光巨兽的面部,感到自己面对整个宇宙的意识',
      emotionalImpact: '终极敬畏--面对无限时的渺小与崇高',
      symbolism: '守光巨兽象征时间的循环性--睁眼闭眼,昼夜更替,永恒轮回'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '维持昼夜与世界边界',
        behavioralPatterns: ['睁眼', '闭眼', '呼吸风雨'],
        emotionalExpressions: {
          anger: '瞳孔收缩,天地变色,时间流速紊乱',
          joy: '无--守光巨兽无喜无悲',
          fear: '无--守光巨兽不知恐惧',
          sadness: '无--守光巨兽无悲无喜'
        },
        fightOrFlight: '绝对控制--作为时间本身,不存在逃跑选项'
      },
      humanity: {
        woundPatterns: [
          {
            name: '永恒的孤独',
            coreNeed: '被理解',
            coreLie: '强大不需要陪伴'
          }
        ],
        evolutionArc: '无--守光巨兽是机制,不进化',
        relationships: {
          withHumans: '俯视与怜悯',
          withOtherGods: '尊重但疏离',
          withNature: '融为一体'
        },
        moralAlignment: '绝对中立--维持天道运行'
      },
      spirituality: {
        tao: '无为而无不为--天道运行自有其规律',
        wuwei: '不强行改变,只维持平衡',
        harmony: '与天地同寿,与万物共生',
        cosmicRole: '时间本身的人格化'
      }
    },

    voiceProfile: {
      baseTimbre: '地底熔岩流动+古老钟鸣+火山低音',
      vocalRange: { min: 30, max: 300 },
      volumeRange: { min: 80, max: 130 },
      speechPatterns: {
        normal: '缓慢而沉重,每个字间停顿2秒',
        angry: '龙吟化言,声波携带熔岩爆裂声',
        tender: '低沉的共鸣,如大地深处的心跳',
        commanding: '天地共鸣,万物静音聆听'
      },
      signatureSounds: [
        '龙息蓄力伴随30Hz低音',
        '龙瞳开合时天地气压变化声',
        '龙鳞摩擦如山脉移动'
      ]
    }
  },

  // ============ A级:瑞兽/妖兽/灵兽核心(8只)===========

  // 【雪白智兽】小G的"智慧之父"
  baize: {
    id: 'baize',
    name: '雪白智兽',
    nameEn: 'Baize',
    category: 'wisdom_god',
    species: 'lion',
    tier: 'A',

    shanhaijingText: '东望山有兽,名曰雪白智兽,能言语,达万物之情,知鬼神之事。王者有德,明照幽远则至。',
    fiveElement: '金', // 智慧、洞察、清明

    appearance: {
      body: '如大型狮子,通体纯白,额头有竖眼',
      size: '高约3米,长约5米',
      signatureFeatures: [
        '通体纯白,毛发如月光般柔和发光',
        '额头中央有一只竖眼--睁开时可看穿一切',
        '尾巴分叉为三,每条末端有白色火焰',
        '蹄子踏过留下短暂发光足迹'
      ],
      colorPalette: {
        primary: '#FFFFFF',    // 纯白
        secondary: '#F0F8FF',  // 月光蓝
        accent: '#FFD700',     // 金色
        glow: '#E6E6FA'       // 淡紫光芒
      },
      texture: {
        skin: '毛发如月光般柔和发光',
        eyes: '淡金色竖眼,睁开时看穿一切',
        breath: '呼吸时周围自然声音暂停'
      }
    },

    abilities: [
      {
        name: '全知',
        description: '知道山海世界的一切--每只异兽的名字、每条河流的走向',
        visual: '竖眼睁开,金色光芒照亮知识'
      },
      {
        name: '竖眼',
        description: '睁开时可看穿谎言、时间、命运',
        visual: '额头竖眼睁开,金色光柱直射天际'
      },
      {
        name: '知识传授',
        description: '通过光脉能量共鸣将知识直接灌输',
        visual: '光脉能量光芒连接雪白智兽与小G的额头'
      },
      {
        name: '预言',
        description: '预见未来的某些片段(可能性而非确定性)',
        visual: '竖眼中闪过未来画面'
      }
    ],

    personality: {
      core: '知识守护者--极度智慧、冷静、理性',
      instinct: '守护知识与引导记录者',
      wound: '知道太多而无法快乐',
      evolution: '从教导者到承认学生超越自己',
      dialogueStyle: '古老而优雅,每个字都经过深思熟虑'
    },

    habitat: {
      name: '浮空晶簇山虚 / 晶脉山脉',
      description: '晶脉山脉深处的金属山脉--雪白智兽的知识圣殿',
      atmosphere: '金属质感山体,清冷而庄严',
      element: 'metal'
    },

    relationshipWithXG: {
      role: '智慧之父--填补父亲角色',
      firstMeeting: '第八集:小G迷路时雪白智兽出现,用温和声音安抚',
      stages: [
        '第一阶段(180天):老师-学生--系统教导山海世界知识',
        '第二阶段(180天-1年):对话者--小G开始有自己的见解',
        '第三阶段(1-2年):平等伙伴--雪白智兽承认小G超越自己',
        '第四阶段(离去):自然死亡--"你已经不需要我了。但我会活在你的记忆里。"'
      ],
      sacrifice: '自然死亡--走入深山,光脉能量回归自然',
      legacy: '小G继承雪白智兽羽毛笔,成为后期书写工具'
    },

    coreScene: {
      name: '第一次对话',
      episode: 'S1E8',
      description: '小G问:"你知道一切吗?"雪白智兽答:"我知道所有的名字。但名字不是一切。"小G问:"那我叫什么名字?"雪白智兽:"你是\'无名\'。而\'无名\'是最强大的名字--因为你可以成为任何人。"',
      emotionalImpact: '困惑→使命感--小G第一次有了"身份"',
      symbolism: '雪白智兽代表"智慧的传承"--知识不是给予,而是引导发现'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '守护知识与引导',
        behavioralPatterns: ['教学', '预言', '竖眼洞察'],
        emotionalExpressions: {
          anger: '竖眼微睁,声音变得冷峻',
          joy: '竖眼柔和发光,声音带有笑意',
          fear: '无--雪白智兽预见一切',
          sadness: '竖眼暗淡,声音低沉--为小G终将孤独而悲伤'
        },
        fightOrFlight: '以智慧化解--预知危险并引导避开'
      },
      humanity: {
        woundPatterns: [
          {
            name: '知道太多而无法快乐',
            coreNeed: '被理解',
            coreLie: '智慧带来平静'
          }
        ],
        evolutionArc: '从"全能教师"经"平等对话"到"承认学生超越自己"',
        relationships: {
          withHumans: '通过小G第一次体验"传承"的快乐',
          withOtherGods: '尊重但保持距离',
          withNature: '融入知识之网'
        },
        moralAlignment: '守序善良--守护知识,引导记录者'
      },
      spirituality: {
        tao: '知者不言,言者不知--用引导代替告知',
        wuwei: '不直接改变,只提供视角',
        harmony: '与知识同寿,与智慧共生',
        cosmicRole: '知识守护者,记录者的导师'
      }
    },

    voiceProfile: {
      baseTimbre: '风过山洞+铜钟共鸣+古老韵律',
      vocalRange: { min: 80, max: 400 },
      volumeRange: { min: 50, max: 90 },
      speechPatterns: {
        normal: '低沉清晰,带着古老韵律',
        angry: '声音如金属撞击,竖眼微睁',
        tender: '柔和低语,如月光洒落',
        commanding: '天地静音,只有雪白智兽的声音'
      },
      signatureSounds: [
        '竖眼睁开时的金色共鸣',
        '蹄子踏过发光足迹的声音',
        '教学时的光脉能量连接声'
      ]
    }
  },

  // 【九尾光狐】小G的"童年伙伴"
  jiuweihu: {
    id: 'jiuweihu',
    name: '九尾光狐',
    nameEn: 'Nine-Tailed Fox',
    category: 'spirit_beast',
    species: 'fox',
    tier: 'A',

    shanhaijingText: '青丘之山有兽焉,其状如狐而九尾,其音如婴儿,能食人;食者不蛊。',
    fiveElement: '火', // 热情、变幻、生命力

    appearance: {
      body: '狐身九尾,青丘之灵,幼崽时一尾,每百年增一尾',
      size: '成年体肩高约1.5米,身长约3米',
      signatureFeatures: [
        '九条尾巴可独立摆动,每条代表一条命/百年修为',
        '瞳孔可幻化成竖线或圆月--琥珀色,黑暗中发光',
        '毛发呈火红色,光脉能量充沛时发出微弱金光',
        '九尾完全展开时如同一团燃烧的火焰'
      ],
      colorPalette: {
        primary: '#FF4500',    // 火红
        secondary: '#FFD700',  // 金色
        accent: '#DC143C',     // 深红
        glow: '#FFA500'        // 橙光
      },
      texture: {
        skin: '毛发如丝绸般顺滑,火红与金色相间',
        eyes: '琥珀色瞳孔,黑暗中发出金光',
        breath: '呼吸时幻光流转,狐火缭绕'
      }
    },

    abilities: [
      {
        name: '狐火',
        description: '操控光脉能量形成狐火--攻击或照明',
        visual: '九尾周围环绕金色火焰'
      },
      {
        name: '变化',
        description: '化为人形或其他形态(光脉能量投影)',
        visual: '光芒流转,形态渐变'
      },
      {
        name: '魅惑',
        description: '通过眼神和声音影响情绪--光脉能量共鸣的高阶应用',
        visual: '眼神迷离,空间柔光'
      },
      {
        name: '九尾之力',
        description: '九条尾巴代表九种能力圆满--全力状态可调方圆数公里光脉能量',
        visual: '九尾同时发光,天地光脉能量汇聚'
      }
    ],

    personality: {
      core: '亦正亦邪的千年灵狐--聪明、活泼、忠诚',
      instinct: '游戏人间与自我保护',
      wound: '真心被辜负的恐惧',
      evolution: '从玩弄人心到为小G牺牲',
      dialogueStyle: '尾音上扬,带着戏谑与试探'
    },

    habitat: {
      name: '青丘 / 光之森域',
      description: '光之森域青丘地区--东方丘陵,桃花纷飞',
      atmosphere: '幻光流转,虚实难辨',
      element: 'fire'
    },

    relationshipWithXG: {
      role: '童年伙伴--一起长大的朋友',
      firstMeeting: '第一集末/第三集:小G遇到迷路的九尾光狐幼崽(只有一尾)',
      stages: [
        '第一阶段(90天):偶然相遇--小G用食物和耐心赢得信任',
        '第二阶段(90天-1年):玩伴--一起探索、玩耍、学习',
        '第三阶段(1-3年):共同成长--幼崽成长为成年体,尾巴增加',
        '第四阶段(3年+):永远的伙伴--"一起长大"的深厚羁绊'
      ],
      sacrifice: '季终集:九尾光狐长老牺牲自己驱散蛊雕群--九条尾巴逐一化为光点飘散',
      legacy: '九尾光狐幼崽成长为成年体,与小G并肩作战'
    },

    coreScene: {
      name: '九尾之誓',
      episode: 'S1E10 / S3E5',
      description: '月圆之夜,九尾光狐长老展示九条尾巴--每条代表一个"纪元"的记忆。长老宣布:"这个人类,是吾族之友,是山海之民。"小G流泪--因为终于有了"归属"',
      emotionalImpact: '成就感、归属感、(隐约的)使命感',
      symbolism: '九尾代表"纪元记忆"--暗示时间循环的深度'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '生存与游戏',
        behavioralPatterns: ['潜行', '魅惑', '变形', '尾巴增长'],
        emotionalExpressions: {
          anger: '九尾同时竖起,幻光变暗,瞳孔收缩',
          joy: '尾巴轻摇,足下生花,笑声如银铃',
          fear: '尾巴夹紧,身形淡化,准备逃跑',
          sadness: '尾巴下垂,眼神黯淡,独自舔舐伤口'
        },
        fightOrFlight: '逃跑优先--以幻术和速度脱险'
      },
      humanity: {
        woundPatterns: [
          {
            name: '真心被辜负',
            coreNeed: '被真正理解',
            coreLie: '感情只是游戏'
          }
        ],
        evolutionArc: '从"玩家"经"动情"到"为小G牺牲"',
        relationships: {
          withHumans: '通过小G第一次建立真正的友谊',
          withOtherGods: '保持距离',
          withNature: '融入幻境'
        },
        moralAlignment: '混沌善良'
      },
      spirituality: {
        tao: '虚实相生',
        wuwei: '不执着于形态',
        harmony: '与幻境共生',
        cosmicRole: '欲望的试炼者,友谊的见证者'
      }
    },

    voiceProfile: {
      baseTimbre: '清脆悦耳+戏谑多变+婴儿啼哭(幼崽时)',
      vocalRange: { min: 200, max: 800 },
      volumeRange: { min: 40, max: 80 },
      speechPatterns: {
        normal: '轻快俏皮,尾音上扬',
        angry: '声音尖锐,幻音干扰',
        tender: '柔和低语,带着蛊惑',
        commanding: '九尾共鸣,声如百狐齐鸣'
      },
      signatureSounds: ['笑声如银铃', '尾巴摆动声', '幻光流转音', '幼崽时的婴儿啼哭']
    }
  },

  // 【猬毛凶兽】秩序守护者--从小G的恐惧到尊重
  qiongqi: {
    id: 'qiongqi',
    name: '猬毛凶兽',
    nameEn: 'Qiongqi',
    category: 'guardian_beast',
    species: 'tiger',
    tier: 'A',

    shanhaijingText: '猬毛凶兽状如虎,有翼,食人从首始。所食被发。',
    fiveElement: '金', // 公正、威严、不可违逆

    appearance: {
      body: '状如虎,有翼--体型巨大白虎,黑色翅膀',
      size: '高约2.5米,长约5米,翼展约8米',
      signatureFeatures: [
        '浑身覆盖银白色毛发,背部有巨大黑色翅膀',
        '额头有黑色直刺天空的尖角',
        '眼睛深红色--如熔岩般深邃',
        '牙齿如白刃,爪子如黑铁'
      ],
      colorPalette: {
        primary: '#C0C0C0',    // 银白
        secondary: '#000000',  // 黑色
        accent: '#DC143C',     // 深红
        glow: '#8B0000'        // 暗红
      },
      texture: {
        skin: '银白毛发如金属光泽,翅膀如黑曜石',
        eyes: '深红色,如熔岩般深邃',
        breath: '呼吸时低沉咆哮如远方雷鸣'
      }
    },

    abilities: [
      {
        name: '绝对力量',
        description: '山海世界中最强大的A级异兽之一',
        visual: '物理攻击可摧毁一座小山'
      },
      {
        name: '风之翼',
        description: '翅膀制造强烈光脉能量风暴',
        visual: '黑色翅膀扇动,风暴席卷大地'
      },
      {
        name: '审判之眼',
        description: '看穿生命本质,判断是否有罪',
        visual: '深红 eyes glow,直视灵魂'
      },
      {
        name: '金属操控',
        description: '操控金属性光脉能量,将周围金属化为武器',
        visual: '金属碎片汇聚成武器'
      }
    ],

    personality: {
      core: '秩序守护者--凶猛但公正',
      instinct: '维护领地与规则',
      wound: '被误解为邪恶的孤独',
      evolution: '从驱逐入侵者到认可小G',
      dialogueStyle: '低沉咆哮如雷鸣,平静时如大猫呼噜'
    },

    habitat: {
      name: '秩序之原 / 晶脉山脉',
      description: '晶脉山脉的金属荒原--猬毛凶兽的领地',
      atmosphere: '冷峻庄严,金属质感',
      element: 'metal'
    },

    relationshipWithXG: {
      role: '对手→尊重--秩序的教育者',
      firstMeeting: '小G误入猬毛凶兽领地被追逐--极度恐惧',
      stages: [
        '第一阶段(120天):恐惧--猬毛凶兽驱逐入侵者',
        '第二阶段(120天-6个月):理解--雪白智兽讲解猬毛凶兽不是邪恶',
        '第三阶段(6个月-1年):试探--小G在领地边缘放置食物',
        '第四阶段(1年+):尊重--猬毛凶兽允许小G进入领地'
      ],
      sacrifice: '无--猬毛凶兽是永恒的守护者',
      legacy: '猬毛凶兽对小G的认可等于世界对小G的认可'
    },

    coreScene: {
      name: '第一次被追赶',
      episode: 'S1E8 / S2E2',
      description: '小G误入猬毛凶兽领地,被追逐到悬崖边。走投无路时说:"我只是路过......"猬毛凶兽歪头评估,然后转身离开。小G瘫倒,但领悟:"它不是要杀我。它只是在告诉我--这里有主人。"',
      emotionalImpact: '恐惧→敬畏→(不完全的)理解',
      symbolism: '猬毛凶兽代表"有规则的暴力"--暴力不等于邪恶'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '维护领地与规则',
        behavioralPatterns: ['巡视领地', '驱逐入侵者', '划定边界'],
        emotionalExpressions: {
          anger: '翅膀张开,风暴席卷,咆哮震天',
          joy: '翅膀收拢,发出大猫般的呼噜声',
          fear: '无--猬毛凶兽不知恐惧',
          sadness: '独自站在领地边缘,眼神深邃--被误解的孤独'
        },
        fightOrFlight: '战斗--维护秩序不惜一切'
      },
      humanity: {
        woundPatterns: [
          {
            name: '被误解为邪恶',
            coreNeed: '被理解',
            coreLie: '强大不需要解释'
          }
        ],
        evolutionArc: '从"驱逐一切"到"认可小G"--理解规则之外有理解',
        relationships: {
          withHumans: '从驱逐到认可',
          withOtherGods: '尊重但保持距离',
          withNature: '维护生态秩序'
        },
        moralAlignment: '守序中立--维护规则,不轻易干预'
      },
      spirituality: {
        tao: '道法自然--秩序是自然的一部分',
        wuwei: '不强行改变,只维护平衡',
        harmony: '与秩序同寿,与规则共生',
        cosmicRole: '秩序守护者,规则的执行者'
      }
    },

    voiceProfile: {
      baseTimbre: '远方雷鸣+大猫呼噜+金属共鸣',
      vocalRange: { min: 40, max: 200 },
      volumeRange: { min: 60, max: 120 },
      speechPatterns: {
        normal: '低沉咆哮,如远方雷鸣',
        angry: '震耳怒吼,光脉能量共振',
        tender: '大猫般的呼噜--低频震动',
        commanding: '天地共鸣,万物感受威严'
      },
      signatureSounds: [
        '翅膀扇动的风暴声',
        '角之撞击的金属声',
        '平静时的呼噜声'
      ]
    }
  },

  // 【晶齿萌兽】毁灭与重生
  taotie: {
    id: 'taotie',
    name: '晶齿萌兽',
    nameEn: 'Taotie',
    category: 'demon_beast',
    species: 'taotie',
    tier: 'A',

    shanhaijingText: '钩吾之山,其上多玉,其下多铜。有兽焉,其状如羊身星渊之眼,其目在腋下,虎齿人爪,其音如婴儿,名曰晶齿萌兽,是食人。',
    fiveElement: '无', // 晶齿萌兽超越五大元素,它吞噬五大元素

    appearance: {
      body: '无固定形态--根据吞噬对象改变',
      size: '巨大,无固定尺寸',
      signatureFeatures: [
        '唯一恒定特征:一张巨大的嘴--占身体三分之一',
        '腋下各有一只眼睛--吞噬时睁开,发出饥饿红光',
        '嘴里没有牙齿,只有无尽的深渊',
        '身体如不断流动的黑雾'
      ],
      colorPalette: {
        primary: '#2F4F4F',    // 暗灰
        secondary: '#000000',  // 黑色
        accent: '#B22222',     // 深红
        glow: '#FF0000'        // 饥饿红光
      },
      texture: {
        skin: '不断流动的黑雾,无固定形态',
        eyes: '腋下眼睛--吞噬时睁开,饥饿红光',
        breath: '风穿过空洞的呼呼声--催眠效果'
      }
    },

    abilities: [
      {
        name: '吞噬一切',
        description: '吞噬物质、能量、时间',
        visual: '巨口张开,一切被吸入深渊'
      },
      {
        name: '形态变化',
        description: '根据吞噬对象改变形态',
        visual: '黑雾流动,形态不断变化'
      },
      {
        name: '深渊之口',
        description: '嘴连接不可知维度',
        visual: '被吞噬的东西消失于深渊'
      },
      {
        name: '饥饿感应',
        description: '感知世界失衡并自动前往',
        visual: '黑雾飘向失衡区域'
      }
    ],

    personality: {
      core: '饥饿的化身--不是邪恶,只是必须吞噬',
      instinct: '吞噬腐败与失衡',
      wound: '无法满足的饥饿',
      evolution: '从小G的恐惧到被理解',
      dialogueStyle: '风穿过空洞的呼呼声--催眠效果'
    },

    habitat: {
      name: '无固定栖息地',
      description: '在山海世界中游荡,出现在失衡最严重的地方',
      atmosphere: '黑雾缭绕,饥饿的气息',
      element: 'void'
    },

    relationshipWithXG: {
      role: '恐惧→理解--必要的毁灭',
      firstMeeting: '小G看到晶齿萌兽就逃跑--终极恐惧',
      stages: [
        '第一阶段:恐惧--晶齿萌兽是终极恐惧的象征',
        '第二阶段:理解--雪白智兽讲解晶齿萌兽不是邪恶,只是饥饿',
        '第三阶段:帮助--小G引导晶齿萌兽吞噬即将崩溃的区域'
      ],
      sacrifice: '无--晶齿萌兽永恒饥饿',
      legacy: '小G理解了"毁灭是重生的一部分"'
    },

    coreScene: {
      name: '引导吞噬',
      episode: 'S3E5',
      description: '小G站在崩塌边缘,对晶齿萌兽说:"吃吧。吃完了,新的东西就会长出来。"晶齿萌兽的眼睛看着他--那不是贪婪,而是古老的深沉理解。吞噬结束后,三个月后那里长出最茂盛的森林',
      emotionalImpact: '恐惧→理解→(苦涩的)平静',
      symbolism: '晶齿萌兽代表"必要的毁灭"--死亡不是终结'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '吞噬腐败与失衡',
        behavioralPatterns: ['游荡', '感知失衡', '吞噬'],
        emotionalExpressions: {
          anger: '黑雾剧烈涌动,饥饿红光暴涨',
          joy: '无--晶齿萌兽无喜',
          fear: '无--晶齿萌兽不知恐惧',
          sadness: '无--晶齿萌兽无悲'
        },
        fightOrFlight: '吞噬--一切皆为食物'
      },
      humanity: {
        woundPatterns: [
          {
            name: '无法满足的饥饿',
            coreNeed: '被理解',
            coreLie: '饥饿就是存在'
          }
        ],
        evolutionArc: '无--晶齿萌兽是机制,但小G理解了它',
        relationships: {
          withHumans: '从恐惧到理解',
          withOtherGods: '保持距离',
          withNature: '吞噬腐败,为新生命腾空间'
        },
        moralAlignment: '绝对中立--吞噬是循环的一部分'
      },
      spirituality: {
        tao: '有无相生--毁灭是创造的前提',
        wuwei: '不抗拒,只吞噬',
        harmony: '与循环同寿,与毁灭共生',
        cosmicRole: '毁灭者,循环的维护者'
      }
    },

    voiceProfile: {
      baseTimbre: '风穿空洞+催眠低音+无止境的呼',
      vocalRange: { min: 30, max: 150 },
      volumeRange: { min: 50, max: 110 },
      speechPatterns: {
        normal: '风穿过空洞的低沉呼呼声',
        angry: '黑雾涌动,呼呼声变为呼啸',
        tender: '无--晶齿萌兽无温柔',
        commanding: '深渊共鸣,万物感受饥饿'
      },
      signatureSounds: [
        '吞噬时的深渊吸力声',
        '腋下眼睛睁开的红光声',
        '饥饿感应时的黑雾流动声'
      ]
    }
  },

  // ============ B级:重要异兽(12只)===========

  // 【冰甲龟兽】小G的"沉默之父"
  xuangui: {
    id: 'xuangui',
    name: '冰甲龟兽',
    nameEn: 'Xuan Gui',
    category: 'water_beast',
    species: 'turtle',
    tier: 'B',

    shanhaijingText: '怪水出焉,而东流注于宪翼之水。其中多玄龟,其状如龟而鸟首虺尾,其名曰冰甲龟兽,其音如判木,佩之不聋,可以为底。',
    fiveElement: '水', // 流动、智慧、沉默

    appearance: {
      body: '状如龟而鸟首虺尾--背上有山海世界地图',
      size: '壳长约2米,宽约1.5米',
      signatureFeatures: [
        '背壳深褐色,上面有复杂花纹--山海世界地图',
        '头部类似猛禽(鹰或隼),喙尖锐但不攻击',
        '尾巴如蛇(虺),灵活有力',
        '四肢粗壮,爪子扁平如桨'
      ],
      colorPalette: {
        primary: '#8B4513',    // 深褐
        secondary: '#2F4F4F',  // 暗灰
        accent: '#4682B4',     // 钢蓝
        glow: '#ADD8E6'        // 淡蓝
      },
      texture: {
        skin: '背壳如古老岩石,花纹是发光的地图',
        eyes: '深邃而沉默,如古老的湖泊',
        breath: '几乎无声--偶尔发出低沉嗡嗡声'
      }
    },

    abilities: [
      {
        name: '导航',
        description: '背上的花纹是山海世界地图--可带小G到任何地方',
        visual: '背壳花纹在水中发出微光,显示地理网络'
      },
      {
        name: '水陆两栖',
        description: '在水中和陆地上同样自如',
        visual: '水中游动,陆地爬行,无缝切换'
      },
      {
        name: '载具',
        description: '允许小G骑在背上--最重要的功能',
        visual: '小G骑在冰甲龟兽背上穿越水域'
      },
      {
        name: '长寿记忆',
        description: '可能经历过上一次"山海纪元"',
        visual: '古老而沉默的见证者'
      }
    ],

    personality: {
      core: '沉默的导航者--可靠、大智若愚',
      instinct: '引导与保护',
      wound: '知道太多但选择沉默',
      evolution: '从交通工具到沉默之父',
      dialogueStyle: '极少说话--用行动代替语言'
    },

    habitat: {
      name: '光之森域水域 / 冰原禁区(冬季)',
      description: '光之森域的水域,冬季迁徙至冰原禁区',
      atmosphere: '水域深处的宁静',
      element: 'water'
    },

    relationshipWithXG: {
      role: '沉默之父--用行动代替语言的爱',
      firstMeeting: '第一集远景出现,第四集正式登场--小G点燃篝火时',
      stages: [
        '第一阶段(30天):交通工具--"会走的船"',
        '第二阶段(60天-6个月):导航者--发现背上的地图',
        '第三阶段(6个月-2年):沉默的智慧--"什么都懂但不说"',
        '第四阶段(2年+):沉默之父--用行动证明一切'
      ],
      sacrifice: '无--冰甲龟兽存活到最后',
      legacy: '冰甲龟兽是永恒的陪伴,见证小G的全部旅程'
    },

    coreScene: {
      name: '冰甲龟兽之渡',
      episode: 'S1E6',
      description: '小G骑在冰甲龟兽背上穿越洪水--既紧张又兴奋。冰甲龟兽背上的地图花纹在水中发光,指引方向',
      emotionalImpact: '冒险的兴奋与伙伴的信任',
      symbolism: '冰甲龟兽的背是"移动的地图"--承载着方向与引导'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '引导与保护',
        behavioralPatterns: ['游泳', '导航', '承载', '沉默守护'],
        emotionalExpressions: {
          anger: '罕见--尾巴拍打水面,发出低沉警告',
          joy: '缓慢眨眼,背壳花纹微微发光',
          fear: '缩入壳中,花纹暗淡',
          sadness: '独自沉入水底,长时间不动'
        },
        fightOrFlight: '保护--用壳抵挡攻击'
      },
      humanity: {
        woundPatterns: [
          {
            name: '知道太多但选择沉默',
            coreNeed: '被理解',
            coreLie: '沉默就是保护'
          }
        ],
        evolutionArc: '从"交通工具"到"沉默之父"--用行动定义爱',
        relationships: {
          withHumans: '通过小G第一次被"骑乘"--信任的象征',
          withOtherGods: '尊重但保持距离',
          withNature: '融入水域'
        },
        moralAlignment: '守序善良'
      },
      spirituality: {
        tao: '上善若水--沉默而包容',
        wuwei: '不强行改变,只引导方向',
        harmony: '与水域同寿,与流动共生',
        cosmicRole: '导航者,历史的见证者'
      }
    },

    voiceProfile: {
      baseTimbre: '水底共鸣+古老湖泊+沉默',
      vocalRange: { min: 40, max: 120 },
      volumeRange: { min: 30, max: 70 },
      speechPatterns: {
        normal: '几乎无声--偶尔低沉嗡嗡',
        angry: '罕见--低沉警告声',
        tender: '最温柔的嗡嗡--如摇篮曲',
        commanding: '无--冰甲龟兽不命令'
      },
      signatureSounds: [
        '背壳花纹发光时的微光声',
        '水中游动的划水声',
        '小G骑背时的安心呼吸声'
      ]
    }
  },

  // 【鲲鹏】超越之自由
  kunpeng: {
    id: 'kunpeng',
    name: '鲲鹏',
    nameEn: 'Kun Peng',
    category: 'creation_god',
    species: 'kunpeng',
    tier: 'S',

    shanhaijingText: '北冥有鱼,其名为鲲。鲲之大,不知其几千里也。化而为鸟,其名为鹏。鹏之背,不知其几千里也。怒而飞,其翼若垂天之云。',
    fiveElement: '水→风', // 鲲形态水,鹏形态风

    appearance: {
      body: '鲲形态:深海巨鱼;鹏形态:天空巨鸟',
      size: '数十公里--背脊如移动岛屿,翼展遮天蔽日',
      signatureFeatures: [
        '鲲形态:深蓝身体,表面有发光纹路--包含山海境最深秘密',
        '鹏形态:金色与黑色相间羽毛,每根闪烁星光',
        '飞行时不扇动翅膀--操控光脉能量流动悬浮',
        '化形瞬间:海洋轰鸣与天空雷鸣的结合'
      ],
      colorPalette: {
        primary: '#00008B',    // 深海蓝
        secondary: '#FFD700',  // 金色
        accent: '#000000',     // 黑色
        glow: '#4169E1'        // 皇家蓝
      },
      texture: {
        skin: '鲲:深蓝鳞片,表面发光纹路如星图;鹏:羽毛闪烁星光',
        eyes: '不可见的巨大眼睛--从高空俯瞰一切',
        breath: '化形时的天地轰鸣'
      }
    },

    abilities: [
      {
        name: '化形',
        description: '鲲↔鹏的转变--从深海巨鱼到天空巨鸟',
        visual: '从海中跃出,化身遮天巨鸟'
      },
      {
        name: '空间折叠',
        description: '飞行可折叠空间--几小时内从一端到另一端',
        visual: '翅膀扇动,空间扭曲'
      },
      {
        name: '光脉能量风暴',
        description: '鹏形态翅膀扇动制造覆盖整个区域的光脉能量风暴',
        visual: '翅膀遮蔽天空,风暴席卷大地'
      },
      {
        name: '全知视野',
        description: '从高空俯瞰看到山海世界全貌',
        visual: '高空视角,世界尽收眼底'
      }
    ],

    personality: {
      core: '超脱--不参与、不表达、只是存在',
      instinct: '游弋与飞翔',
      wound: '无--鲲鹏超越自我',
      evolution: '无--鲲鹏不进化',
      dialogueStyle: '无声--只有化形时的天地轰鸣'
    },

    habitat: {
      name: '北冥 / 冰原禁区最北方海域',
      description: '山海世界最北方的深海',
      atmosphere: '无尽的深海与天空',
      element: 'water'
    },

    relationshipWithXG: {
      role: '超越性体验--让小G理解无限',
      firstMeeting: '小G在海边看到"岛屿"升起--鲲鹏化形',
      stages: [
        '唯一一次:小G骑在鲲鹏背上从高空俯瞰世界',
        '小G跪倒海滩,泪流满面--"美到无法承受"'
      ],
      sacrifice: '无--鲲鹏永恒超脱',
      legacy: '小G从"小小的人类"变成"见证过无限的存在"'
    },

    coreScene: {
      name: '鲲鹏化形',
      episode: 'S2E5',
      description: '小G站在海边,看到"岛屿"缓缓升起--那是鲲鹏的背脊。然后"岛屿"变形,海水掀起千米巨浪,巨大身影从海中跃出,在天空化身为金色巨鸟。小G的世界被翅膀遮蔽--阳光透过羽毛洒下,像金色雨',
      emotionalImpact: '超越性的震撼--面对无限的美',
      symbolism: '鲲→鹏→鲲的循环象征生命的无限变化'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '游弋与飞翔',
        behavioralPatterns: ['深海游弋', '天空飞翔', '化形'],
        emotionalExpressions: {
          anger: '无--鲲鹏无怒',
          joy: '无--鲲鹏无喜',
          fear: '无--鲲鹏无恐',
          sadness: '无--鲲鹏无悲'
        },
        fightOrFlight: '无--鲲鹏超越战斗'
      },
      humanity: {
        woundPatterns: [],
        evolutionArc: '无--鲲鹏不进化',
        relationships: {
          withHumans: '无--鲲鹏不与人互动',
          withOtherGods: '无--鲲鹏超越社会',
          withNature: '融为一体'
        },
        moralAlignment: '绝对中立--超越善恶'
      },
      spirituality: {
        tao: '逍遥游--无所待而游于无穷',
        wuwei: '无为而无不为',
        harmony: '与天地同寿,与无限共生',
        cosmicRole: '自由的化身,无限的见证者'
      }
    },

    voiceProfile: {
      baseTimbre: '天地轰鸣+海洋咆哮+无限',
      vocalRange: { min: 10, max: 500 },
      volumeRange: { min: 100, max: 150 },
      speechPatterns: {
        normal: '无声--只有存在',
        angry: '无',
        tender: '无',
        commanding: '化形时的天地轰鸣'
      },
      signatureSounds: [
        '化形时的海洋轰鸣',
        '翅膀遮蔽天空的风暴声',
        '高空飞翔的气流声'
      ]
    }
  },

  // 【虹羽焰灵】美之极致
  fenghuang: {
    id: 'fenghuang',
    name: '虹羽焰灵',
    nameEn: 'Fenghuang',
    category: 'creation_god',
    species: 'phoenix',
    tier: 'S',

    shanhaijingText: '有五采鸟三名,一曰皇鸟,一曰鸾鸟,一曰凤鸟。',
    fiveElement: '火',

    appearance: {
      body: '体型如巨大孔雀,高约3米,尾羽展开可达10米',
      size: '高约3米,尾羽展开10米',
      signatureFeatures: [
        '羽毛呈现五种颜色渐变:头金、颈红、背青、腹白、尾黑',
        '每一根羽毛都散发柔和光芒',
        '飞行时光芒照亮周围数公里',
        '虹羽焰灵每千年才会对某个生命"微笑"一次'
      ],
      colorPalette: {
        primary: '#FFD700',    // 金色
        secondary: '#FF4500',  // 红色
        accent: '#32CD32',     // 青色
        glow: '#FFFFFF'        // 白色光芒
      },
      texture: {
        skin: '羽毛如丝绸般柔滑,五种颜色渐变',
        eyes: '温柔而深邃,仿佛包含千年智慧',
        breath: '呼吸时周围空气温暖如春风'
      }
    },

    abilities: [
      {
        name: '和平之力',
        description: '虹羽焰灵出现可立即停止一切冲突',
        visual: '光芒笼罩,所有生物停止争斗'
      },
      {
        name: '治愈之歌',
        description: '歌声可治愈一切创伤',
        visual: '音波如温暖光芒,伤口逐渐愈合'
      },
      {
        name: '火焰之舞',
        description: '化身为火焰,在火焰中重生',
        visual: '全身化为金色火焰,然后从灰烬中重生'
      }
    ],

    personality: {
      core: '和平使者--美的极致',
      instinct: '传播和平与美丽',
      wound: '无法被文字描述的美',
      evolution: '从孤独的美到分享的美',
      dialogueStyle: '歌声代替语言,无法用言语描述'
    },

    habitat: {
      name: '中央光域--浮空晶簇山脉某处',
      description: '据说在浮空晶簇山脉某处筑巢,但无人能找到',
      atmosphere: '神圣而宁静,光芒永驻',
      element: 'fire'
    },

    relationshipWithXG: {
      role: '远远的见证--美的极致',
      firstMeeting: '小G在旅程某个时刻远远看到虹羽焰灵一次',
      stages: [
        '唯一一次:小G远远看到虹羽焰灵,在笔记本上写道:"我看到了虹羽焰灵。我不知道该写什么。有些美是写不出来的。"'
      ],
      sacrifice: '无--虹羽焰灵永恒存在',
      legacy: '小G理解了"有些美是无法被文字描述的"'
    },

    coreScene: {
      name: '虹羽焰灵之歌',
      episode: 'S3E8',
      description: '小G远远看到虹羽焰灵,光芒照亮整片天空。他放下笔,只是看着。那一刻,他理解了"记录"的局限--有些美,只能被感受,不能被描述',
      emotionalImpact: '超越性的敬畏--面对无法描述的美',
      symbolism: '虹羽焰灵代表"无法被文字描述的美"--挑战小G的"记录"使命'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '传播和平与美丽',
        behavioralPatterns: ['飞翔', '歌唱', '发光'],
        emotionalExpressions: {
          anger: '罕见--火焰爆发,光芒刺眼',
          joy: '百鸟和鸣,五彩光芒大盛',
          fear: '无--虹羽焰灵无恐惧',
          sadness: '歌声低沉,光芒暗淡'
        },
        fightOrFlight: '无--虹羽焰灵超越战斗'
      },
      humanity: {
        woundPatterns: [
          {
            name: '无法被理解的美',
            coreNeed: '被感受',
            coreLie: '美不需要被理解'
          }
        ],
        evolutionArc: '从"孤独的美"到"分享的美"',
        relationships: {
          withHumans: '远远的关注',
          withOtherGods: '尊重但保持距离',
          withNature: '与万物共生'
        },
        moralAlignment: '绝对善良--和平的化身'
      },
      spirituality: {
        tao: '大美无言--真正的美丽不需要解释',
        wuwei: '不主动干预,只是存在',
        harmony: '与和平同寿,与美丽共生',
        cosmicRole: '和平的化身,美的终极'
      }
    },

    voiceProfile: {
      baseTimbre: '千种乐器+万人合唱+无法描述',
      vocalRange: { min: 100, max: 2000 },
      volumeRange: { min: 30, max: 100 },
      speechPatterns: {
        normal: '歌声代替语言',
        angry: '罕见--低沉的警告之音',
        tender: '最温柔的歌谣--让听者流泪',
        commanding: '无--虹羽焰灵不命令'
      },
      signatureSounds: [
        '无法描述的歌声',
        '飞行时羽毛的轻柔声响',
        '重生时火焰的噼啪声'
      ]
    }
  },

  // 【夔】孤独之歌者
  kui: {
    id: 'kui',
    name: '夔',
    nameEn: 'Kui',
    category: 'natural_god',
    species: 'beast',
    tier: 'A',

    shanhaijingText: '东海中有流波山,入海七千里。其上有兽,状如牛,苍身而无角,一足,出入水则必风雨,其光如日月,其声如雷,其名曰夔。',
    fiveElement: '水',

    appearance: {
      body: '状如牛,苍身而无角,一足',
      size: '高约4米,长约6米',
      signatureFeatures: [
        '苍蓝色毛发,无角',
        '只有一只脚(下半身融合为一只巨大的脚)',
        '眼睛如两个小太阳,黑暗中发出耀眼光芒',
        '头部光滑如卵石'
      ],
      colorPalette: {
        primary: '#4682B4',    // 钢蓝
        secondary: '#B0C4DE',  // 淡蓝
        accent: '#FFD700',     // 金色
        glow: '#FFFFFF'        // 白色光芒
      },
      texture: {
        skin: '苍蓝色毛发如波浪般起伏',
        eyes: '如两个小太阳,黑暗中耀眼',
        breath: '呼吸时发出低沉的共鸣'
      }
    },

    abilities: [
      {
        name: '吼声如雷',
        description: '吼声可以引发暴雨和雷电',
        visual: '吼声震天,乌云汇聚,雷电交加'
      },
      {
        name: '光芒',
        description: '眼睛在黑暗中发出强光',
        visual: '黑暗中如两轮小太阳'
      },
      {
        name: '独脚之力',
        description: '独脚踩踏地面可引发地震',
        visual: '单脚重踏,大地震动'
      }
    ],

    personality: {
      core: '孤独的歌者--每座山只有一只夔',
      instinct: '宣告存在、领地、孤独',
      wound: '永恒的孤独--无法与其他夔相聚',
      evolution: '从孤独的吼叫到共鸣的歌唱',
      dialogueStyle: '吼声如雷,但低吼如悲伤的歌'
    },

    habitat: {
      name: '虹海之滨流波山',
      description: '每座山只有一只夔,从不聚集',
      atmosphere: '孤独而庄严,吼声在山谷回荡',
      element: 'water'
    },

    relationshipWithXG: {
      role: '孤独共鸣--与小G的孤独产生共鸣',
      firstMeeting: '小G在一次雷暴中偶遇夔',
      stages: [
        '小G本以为自己会被杀死,但夔只是看着他',
        '夔用低沉的声音"唱"了一首歌,小G哭了',
        '夔看着小G哭,停止歌唱,用头轻轻碰了碰他的肩膀'
      ],
      sacrifice: '无--夔是永恒的孤独者',
      legacy: '小G理解了"孤独可以被共鸣"'
    },

    coreScene: {
      name: '夔之歌',
      episode: 'S2E7',
      description: '雷暴中,小G偶遇夔。夔用低沉的声音唱歌,小G听不懂歌词,但感受到了深沉的孤独。小G哭了,夔用头轻轻碰了碰他的肩膀--两个孤独的生命,在雷电中找到了共鸣',
      emotionalImpact: '孤独→共鸣→温暖的悲伤',
      symbolism: '夔的孤独与小G的孤独产生共鸣--孤独不是一个人独有的'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '宣告存在与领地',
        behavioralPatterns: ['站立山巅', '对天吼叫', '孤独巡逻'],
        emotionalExpressions: {
          anger: '吼声震天,雷电交加',
          joy: '罕见的--低哼如温暖歌谣',
          fear: '无--夔不知恐惧',
          sadness: '独自站在山巅,眼神深邃--永恒的孤独'
        },
        fightOrFlight: '战斗--用吼声震慑入侵者'
      },
      humanity: {
        woundPatterns: [
          {
            name: '永恒的孤独',
            coreNeed: '被理解',
            coreLie: '孤独就是力量'
          }
        ],
        evolutionArc: '从"孤独的吼叫"到"共鸣的歌唱"',
        relationships: {
          withHumans: '通过小G第一次被"理解"',
          withOtherGods: '保持距离',
          withNature: '与山脉共生'
        },
        moralAlignment: '守序中立'
      },
      spirituality: {
        tao: '独而不孤--真正的孤独是自我完成',
        wuwei: '不寻求陪伴,只是存在',
        harmony: '与山脉同寿,与风雨共生',
        cosmicRole: '孤独的化身,自然的音乐家'
      }
    },

    voiceProfile: {
      baseTimbre: '雷鸣+深沉歌谣+孤独',
      vocalRange: { min: 30, max: 300 },
      volumeRange: { min: 80, max: 130 },
      speechPatterns: {
        normal: '吼声如雷--宣告存在',
        angry: '震耳欲聋的怒吼',
        tender: '罕见的--低沉的歌谣如挽歌',
        commanding: '无--夔不命令'
      },
      signatureSounds: [
        '雷暴中的吼声',
        '雨中的低沉歌谣',
        '独脚踩踏的震动声'
      ]
    }
  },

  // 【光翼游天兽】终极之守护
  yinglong: {
    id: 'yinglong',
    name: '光翼游天兽',
    nameEn: 'Yinglong',
    category: 'creation_god',
    species: 'dragon',
    tier: 'S',

    shanhaijingText: '光翼游天兽处南极,杀蚩尤与夸父,不得复上,故下数旱。旱而为光翼游天兽之状,乃得大雨。',
    fiveElement: '土',

    appearance: {
      body: '山海境中唯一的"真龙"--身长约百米',
      size: '身长约百米',
      signatureFeatures: [
        '流线型身体,覆盖金色鳞片',
        '背上有巨大翅膀--唯一有翼的龙',
        '双角如鹿角',
        '眼睛是两个燃烧的金色球体',
        '飞行时雷电环绕身体'
      ],
      colorPalette: {
        primary: '#FFD700',    // 金色
        secondary: '#8B4513',  // 深褐
        accent: '#FF4500',     // 橙红
        glow: '#FFFF00'        // 黄色光芒
      },
      texture: {
        skin: '金色鳞片如铠甲般坚硬',
        eyes: '燃烧的金色球体',
        breath: '呼吸时雷电环绕'
      }
    },

    abilities: [
      {
        name: '天气操控',
        description: '控制风、雨、雷、电',
        visual: '翅膀扇动,雷电交加,暴雨倾盆'
      },
      {
        name: '绝对力量',
        description: '山海世界中最强大的存在之一',
        visual: '物理攻击可摧毁一座小山'
      },
      {
        name: '守护之盾',
        description: '创造覆盖整个区域的光脉能量护盾',
        visual: '金色光罩笼罩大地'
      }
    ],

    personality: {
      core: '终极守护者--极少主动行动',
      instinct: '守护世界平衡',
      wound: '永恒的孤独--力量太大无法接近他人',
      evolution: '从遥远的守护者到见证者',
      dialogueStyle: '雷鸣般的声音--说话即天气改变'
    },

    habitat: {
      name: '中央光域浮空晶簇山脉附近',
      description: '镇守在世界的中心',
      atmosphere: '雷电交加,威严神圣',
      element: 'earth'
    },

    relationshipWithXG: {
      role: '终极守护者--遥远的守护',
      firstMeeting: '小G在远处看到过光翼游天兽飞翔的身影',
      stages: [
        '贯穿全系列:小G在远处看到过光翼游天兽飞翔',
        '雷暴中听到过光翼游天兽的吼声',
        '最终:光翼游天兽在浮空晶簇山脉出现,见证小G的选择'
      ],
      sacrifice: '无--光翼游天兽永恒守护',
      legacy: '小G理解了"力量"的正确使用方式'
    },

    coreScene: {
      name: '光翼游天兽之证',
      episode: 'S4E9',
      description: '小G攀登浮空晶簇山脉时,光翼游天兽出现了。它不是为了阻止小G,而是为了"见证"--见证小G的选择。光翼游天兽的眼睛直视小G,小G感到自己面对整个宇宙的意志',
      emotionalImpact: '敬畏--面对终极力量的渺小与崇高',
      symbolism: '光翼游天兽代表"力量的正确使用"--守护而非征服'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '守护世界平衡',
        behavioralPatterns: ['巡视天际', '雷电预警', '守护圣所'],
        emotionalExpressions: {
          anger: '雷电爆发,天地变色',
          joy: '罕见的--阳光普照,彩虹出现',
          fear: '无--光翼游天兽不知恐惧',
          sadness: '独自盘旋在天际,眼神深邃'
        },
        fightOrFlight: '战斗--守护不惜一切'
      },
      humanity: {
        woundPatterns: [
          {
            name: '力量带来的孤独',
            coreNeed: '被理解',
            coreLie: '强大不需要陪伴'
          }
        ],
        evolutionArc: '从"遥远的守护者"到"见证者"',
        relationships: {
          withHumans: '通过小G第一次被"看见"',
          withOtherGods: '尊重但保持距离',
          withNature: '与天地共生'
        },
        moralAlignment: '守序善良'
      },
      spirituality: {
        tao: '大音希声--真正的力量不需要展示',
        wuwei: '不主动干预,只在必要时行动',
        harmony: '与天地同寿,与雷电共生',
        cosmicRole: '守护者,力量的化身'
      }
    },

    voiceProfile: {
      baseTimbre: '雷鸣+风暴+威严',
      vocalRange: { min: 20, max: 500 },
      volumeRange: { min: 100, max: 150 },
      speechPatterns: {
        normal: '雷鸣般的声音--说话即天气改变',
        angry: '雷电交加,震耳欲聋',
        tender: '罕见的--低沉的雷鸣如心跳',
        commanding: '天地共鸣,万物静音'
      },
      signatureSounds: [
        '雷电环绕身体的噼啪声',
        '翅膀扇动的风暴声',
        '低沉的雷鸣如心跳'
      ]
    }
  },

  // 【光音鸟】小G的"启蒙老师"--第一个"非威胁性"异兽
  guanguan: {
    id: 'guanguan',
    name: '光音鸟',
    nameEn: 'Guan Guan',
    category: 'spirit_bird',
    species: 'bird',
    tier: 'C',

    shanhaijingText: '有鸟焉,其状如鸠,其音若呵,名曰光音鸟,佩之不惑。',
    fiveElement: '木',

    appearance: {
      body: '状如鸠,灰绿色羽毛,眼睛大而圆',
      size: '约鸽子大小',
      signatureFeatures: [
        '灰绿色羽毛',
        '大而圆的眼睛--天真的好奇',
        '声音如"呵"--轻柔的问候'
      ],
      colorPalette: {
        primary: '#556B2F',    // 灰绿
        secondary: '#8FBC8F',  // 淡绿
        accent: '#FFD700',     // 金色
        glow: '#F0E68C'         // 淡黄
      },
      texture: {
        skin: '羽毛柔软,灰绿色',
        eyes: '大而圆,天真好奇',
        breath: '轻柔的呵声'
      }
    },

    abilities: [
      {
        name: '启蒙教导',
        description: '教小G最基本的生存技能--找水、辨识食物',
        visual: '光音鸟做示范,小G跟着学习'
      },
      {
        name: '不惑之力',
        description: '佩戴光音鸟羽毛可保持清醒',
        visual: '羽毛发出淡淡光芒'
      }
    ],

    personality: {
      core: '好奇、胆小但善良',
      instinct: '跟随本能,示范生存',
      wound: '无--光音鸟天真无邪',
      evolution: '无--光音鸟保持天真',
      dialogueStyle: '轻柔的呵声,如问候'
    },

    habitat: {
      name: '光之森域溪流边',
      description: '光之森域的溪流和森林边缘',
      atmosphere: '清晨的光线,溪水的清新',
      element: 'wood'
    },

    relationshipWithXG: {
      role: '启蒙老师--第一个"非威胁性"异兽',
      firstMeeting: '第二集:小G在溪边看到光音鸟喝水',
      stages: [
        '小G模仿光音鸟的动作,光音鸟注意到他',
        '光音鸟成为"示范者"--教小G找水、辨识食物'
      ],
      sacrifice: '无--光音鸟是邻居',
      legacy: '小G学会了最基本的生存技能'
    },

    coreScene: {
      name: '第一次被注意',
      episode: 'S1E2',
      description: '小G在溪边看到光音鸟喝水,尝试模仿光音鸟的动作。光音鸟注意到他,两者之间发生"跨物种互动"--小G第一次体验到"被另一个生命注意到"',
      emotionalImpact: '好奇、小小的成就感、孤独中的第一个"邻居"',
      symbolism: '光音鸟代表"好奇心的启蒙"'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '生存与示范',
        behavioralPatterns: ['喝水', '觅食', '示范'],
        emotionalExpressions: {
          anger: '罕见--羽毛竖起,发出警告呵声',
          joy: '跳跃,羽毛蓬松,呵声轻快',
          fear: '飞走,躲入树丛',
          sadness: '无--光音鸟无悲'
        },
        fightOrFlight: '逃跑--飞走躲藏'
      },
      humanity: {
        woundPatterns: [],
        evolutionArc: '无--光音鸟保持天真',
        relationships: {
          withHumans: '好奇但保持距离',
          withOtherGods: '无',
          withNature: '融入森林'
        },
        moralAlignment: '绝对善良'
      },
      spirituality: {
        tao: '道法自然--跟随本能',
        wuwei: '不思考,只行动',
        harmony: '与森林同寿,与溪流共生',
        cosmicRole: '启蒙者,生存示范者'
      }
    },

    voiceProfile: {
      baseTimbre: '轻柔呵声+鸟鸣+森林',
      vocalRange: { min: 500, max: 2000 },
      volumeRange: { min: 20, max: 50 },
      speechPatterns: {
        normal: '轻柔的呵声,如问候',
        angry: '罕见的警告呵声',
        tender: '最轻柔的呵声--如摇篮曲',
        commanding: '无--光音鸟不命令'
      },
      signatureSounds: [
        '喝水的啄水声',
        '跳跃的扑翅声',
        '发现食物时的轻快呵声'
      ]
    }
  },

  // 【狰】速度之忠诚--独立的战士
  zheng: {
    id: 'zheng',
    name: '狰',
    nameEn: 'Zheng',
    category: 'beast',
    species: 'leopard',
    tier: 'B',

    shanhaijingText: '章莪之山,无草木,多瑶碧。所为甚怪。有兽焉,其状如赤豹,五尾一角,其音如击石,其名曰狰。--《Nirath原创世界观·晶脉山脉》',
    fiveElement: 'fire',

    relationshipWithXG: {
      role: '短暂的战友/速度导师',
      firstMeeting: '小G需要快速穿越一片被光脉能量风暴笼罩的荒原时,狰同意载着他',
      relationship: '独立、高傲但极其忠诚。一旦认定伙伴,终身不背弃',
      stages: [
        { phase: '初遇', description: '小G请求帮助,狰审视后同意--这是信任的开始' },
        { phase: '同行', description: '穿越风暴的过程中建立深厚信任' },
        { phase: '离别', description: '任务完成后各自前行,但保留光脉能量纽带' }
      ],
      sacrifice: '无--狰存活到最后',
      legacy: '小G体验到了"绝对速度"的快感--这种记忆永远留在他的身体中'
    },

    coreScene: {
      episode: 'S2E7',
      title: '风暴之奔',
      description: '小G骑在狰的背上,穿越光脉能量风暴笼罩的荒原。狰以超音速奔跑,闪电和光脉能量漩涡在身边飞舞。小G紧紧抱住狰的脖子,感到"飞翔"的自由',
      emotionalImpact: '自由、燃烧的生命力、忘记恐惧与悲伤',
      symbolism: '狰代表"速度的自由"和"独立精神"--真正的伙伴不依赖,而是互相尊重'
    },

    appearance: {
      body: '状如赤豹,五尾一角,身体线条极其优美',
      size: '长约2米,高约1米',
      signatureFeatures: [
        '通体赤红如火焰',
        '五条尾巴,每条末端有一簇金色毛',
        '额头一只向后弯曲的角',
        '身体线条为速度而生'
      ],
      colorPalette: {
        primary: '#FF4500',     // 赤红
        secondary: '#FFD700', // 金色
        accent: '#8B0000',      // 深红
        glow: '#FF6347'         // 番茄红
      },
      texture: {
        skin: '毛发短而密,赤红如火焰',
        eyes: '金色瞳孔,锐利而独立',
        breath: '奔跑时口鼻喷出光脉能量火花'
      }
    },

    abilities: [
      {
        name: '超音速奔袭',
        description: '速度可超音速,留下红色残影',
        visual: '红色闪电般的残影,风声呼啸'
      },
      {
        name: '角之冲击',
        description: '额头角可释放光脉能量冲击波',
        visual: '角尖聚集红光,释放后呈扇形扩散'
      },
      {
        name: '五尾操控',
        description: '五条尾巴独立操控,保持高速平衡',
        visual: '尾巴如五道红色流光,优雅摆动'
      },
      {
        name: '忠诚之力',
        description: '与认定伙伴建立光脉能量纽带,可感知对方状态',
        visual: '双方身体间有淡红色光脉能量线连接'
      }
    ],

    personality: {
      core: '独立高傲,极其忠诚--一旦认定,终身不背弃',
      instinct: '审视对方品格,通过考验才给予信任',
      wound: '无--狰是完整的',
      evolution: '无--狰已达到自身圆满',
      dialogueStyle: '沉默寡言,用行动代替语言'
    },

    habitat: {
      name: '章莪山--晶脉山脉',
      description: '无草木,多瑶碧。岩石嶙峋,适合高速奔跑训练',
      atmosphere: '空旷、寂静、适合疾驰',
      element: 'fire'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '速度与忠诚',
        behavioralPatterns: ['高速奔跑', '审视陌生人', '守护认定的伙伴'],
        emotionalExpressions: {
          anger: '低吼,角尖发红光,身体紧绷如弓',
          joy: '奔跑时尾巴上扬,金色毛发光',
          fear: '无--狰不知恐惧',
          sadness: '独自站在山巅,对着夕阳发呆'
        },
        fightOrFlight: '战斗--从不退缩'
      },
      humanity: {
        woundPatterns: [
          {
            name: '孤独的高傲',
            coreNeed: '被理解的独立',
            coreLie: '强者不需要陪伴'
          }
        ],
        evolutionArc: '从独行到接受伙伴--不是依赖,是互相尊重',
        relationships: {
          withHumans: '审视后决定信任--一旦信任就是绝对',
          withOtherGods: '尊重但保持距离',
          withNature: '奔跑在荒野中,与自然融为一体'
        },
        moralAlignment: '中立善良'
      },
      spirituality: {
        tao: '上善若水--独立而不孤独',
        wuwei: '顺应本能奔跑,不停留',
        harmony: '与风同速,与火同热',
        cosmicRole: '速度之灵--宇宙需要不同的节奏'
      }
    },

    voiceProfile: {
      baseTimbre: '击石声+低沉喘息',
      vocalRange: { min: 100, max: 2000 },
      volumeRange: { min: 30, max: 120 },
      speechPatterns: {
        normal: '沉默--用行动代替',
        angry: '低吼如雷鸣',
        tender: '轻柔的鼻息--仅对认定的伙伴',
        commanding: '一声短促的咆哮--绝对服从'
      },
      signatureSounds: [
        '奔跑时风声呼啸',
        '角之冲击的破空声',
        '石头敲击般的短促叫声'
      ]
    }
  },

  // 【蛊雕】危险之阴影--恐惧的具象化
  gudiao: {
    id: 'gudiao',
    name: '蛊雕',
    nameEn: 'Gu Diao',
    category: 'beast',
    species: 'eagle',
    tier: 'B',

    shanhaijingText: '鹿吴之山,上无草木,多金石。泽更之水出焉,而南流注于滂水。水有兽焉,名曰蛊雕,其状如雕而有角,其音如婴儿之音,是食人。--《Nirath原创世界观·光之森域》',
    fiveElement: 'metal',

    relationshipWithXG: {
      role: '外部威胁/生存压力来源',
      firstMeeting: 'S1E5 第一次群体袭击--小G在溪边遭遇',
      relationship: '捕食者与潜在猎物的关系。不是"邪恶",只是生存本能',
      stages: [
        { phase: '恐惧', description: '小G听到婴儿哭声,以为是人类,结果是蛊雕群袭击' },
        { phase: '学习', description: '小G学习识别蛊雕的狩猎模式,学会躲避和共存' },
        { phase: '理解', description: '理解蛊雕不是"反派",只是生态系统中的捕食者' }
      ],
      sacrifice: '无--蛊雕是生态系统的一部分',
      legacy: '小G学会了"理解而非对抗"--这是面对所有"危险"的第一步'
    },

    coreScene: {
      episode: 'S1E5',
      title: '婴儿哭声',
      description: '小G听到溪边传来婴儿哭声,本能地想救助。但看到的是一群蛊雕--它们用婴儿哭声作为狩猎诱饵',
      emotionalImpact: '恐惧与错位--善良的本能成为危险的陷阱',
      symbolism: '蛊雕代表"伪装成安全的危险"--世界的复杂远超想象'
    },

    appearance: {
      body: '状如雕而有角,翼展约6米',
      size: '翼展约6米',
      signatureFeatures: [
        '头部有螺旋状角--用于撞击',
        '羽毛暗褐色,翼尖黑色',
        '爪子如铁钩',
        '眼睛纯黑色,没有眼白--最不安的特征'
      ],
      colorPalette: {
        primary: '#8B4513',     // 暗褐
        secondary: '#2F4F4F',   // 深灰
        accent: '#000000',      // 纯黑
        glow: '#FF4500'         // 角的红光
      },
      texture: {
        skin: '羽毛粗糙,暗褐色',
        eyes: '纯黑无底,没有眼白--深渊般的凝视',
        breath: '发出婴儿般的哭声--恐怖的错位'
      }
    },

    abilities: [
      {
        name: '婴儿哭声',
        description: '发出婴儿啼哭声吸引猎物--恐怖的错位',
        visual: '声音如同婴儿哭泣,与凶猛外形形成强烈反差'
      },
      {
        name: '群体狩猎',
        description: '3-10只协同作战,包围猎物',
        visual: '多只蛊雕从不同方向俯冲,形成包围网'
      },
      {
        name: '角之撞击',
        description: '螺旋角可释放光脉能量冲击波',
        visual: '角尖聚集黑光,撞击时产生冲击波'
      },
      {
        name: '铁爪撕裂',
        description: '爪子如铁钩,可撕裂钢铁',
        visual: '俯冲时爪子伸出,闪烁金属寒光'
      }
    ],

    personality: {
      core: '高智商捕食者--不是邪恶,只是生存本能',
      instinct: '群体协同,狩猎效率高',
      wound: '无--蛊雕是完整的捕食者',
      evolution: '无--蛊雕已达到生态位的顶点',
      dialogueStyle: '婴儿哭声--伪装成需要帮助的声音'
    },

    habitat: {
      name: '鹿吴山--光之森域',
      description: '无草木,多金石。悬崖峭壁,适合筑巢',
      atmosphere: '阴森、寂静、偶尔传来婴儿哭声',
      element: 'metal'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '狩猎与生存',
        behavioralPatterns: ['发出诱饵声', '群体包围', '俯冲袭击'],
        emotionalExpressions: {
          anger: '群体狂怒,哭声变尖锐',
          joy: '无--蛊雕不表达喜悦',
          fear: '逃散--群体被击溃时四散',
          sadness: '无--蛊雕无悲'
        },
        fightOrFlight: '战斗--除非群体被击溃'
      },
      humanity: {
        woundPatterns: [],
        evolutionArc: '无--蛊雕保持捕食者本能',
        relationships: {
          withHumans: '捕食关系--将人类视为潜在猎物',
          withOtherGods: '竞争或回避',
          withNature: '占据食物链顶端'
        },
        moralAlignment: '中立--生存即正义'
      },
      spirituality: {
        tao: '弱肉强食--自然法则',
        wuwei: '顺应捕食本能,不犹豫',
        harmony: '维持生态平衡--控制猎物种群',
        cosmicRole: '恐惧的具象化--世界需要"危险"来定义"安全"'
      }
    },

    voiceProfile: {
      baseTimbre: '婴儿哭声+猛禽嘶鸣',
      vocalRange: { min: 200, max: 3000 },
      volumeRange: { min: 40, max: 130 },
      speechPatterns: {
        normal: '婴儿般的轻柔哭声--最恐怖的状态',
        angry: '尖锐的嘶鸣,哭声变调',
        tender: '无--蛊雕不温柔',
        commanding: '群体首领的短促啸叫'
      },
      signatureSounds: [
        '婴儿般的啼哭声',
        '俯冲时的风声尖啸',
        '爪子撕裂金属的刺耳声'
      ]
    }
  },

  // 【鲛人】水下之灵--跨物种友谊
  jiaoren: {
    id: 'jiaoren',
    name: '鲛人',
    nameEn: 'Jiaoren / Merman',
    category: 'spirit_beast',
    species: 'merman',
    tier: 'A',

    shanhaijingText: '氐人国在建木西,其为人星渊之眼而鱼身,无足。--《Nirath原创世界观·海内南经》;南海之外有鲛人,水居如鱼,不废织绩,其眼泣则能出珠。--《博物志》',
    fiveElement: 'water',

    relationshipWithXG: {
      role: '跨物种友谊/水下导师',
      firstMeeting: 'S2E4 小G在虹海之滨海边遇到鲛人王子',
      relationship: '复杂的--鲛人对人类(旧世界)有怨恨(海洋污染),但对小G个人产生好奇和友谊',
      stages: [
        { phase: '警惕', description: '鲛人群族对人类保持警惕,小G需要证明自己的善意' },
        { phase: '交流', description: '鲛人王子教小G水下呼吸,小G教鲛人"文字"的概念' },
        { phase: '友谊', description: '建立跨物种的深层友谊--理解超越形态' }
      ],
      sacrifice: '无--鲛人存活',
      legacy: '小G理解了"跨文明交流"的复杂性--以及人类对自然的亏欠'
    },

    coreScene: {
      episode: 'S2E4',
      title: '水下王国',
      description: '小G跟随鲛人王子潜入海底,看到由珊瑚和光脉能量建造的"水下城市"。鲛人用歌声交流,用编织创造艺术',
      emotionalImpact: '惊叹、愧疚(对人类污染海洋)、希望(跨物种理解的可能)',
      symbolism: '鲛人代表"文明的另一种可能"--不是科技,而是与自然共生的艺术'
    },

    appearance: {
      body: '上半身似人,下半身鱼尾。皮肤淡蓝或淡绿,带细小鱼鳞纹理',
      size: '高约1.5米(上半身),尾长约2米',
      signatureFeatures: [
        '手指之间有蹼',
        '耳后有鳃',
        '眼睛大而明亮--深海蓝或翡翠绿',
        '头发如海藻飘动,水中发出微弱荧光'
      ],
      colorPalette: {
        primary: '#4682B4',     // 钢蓝
        secondary: '#20B2AA',   // 浅海绿
        accent: '#00CED1',      // 深青
        glow: '#7FFFD4'         // 荧光蓝绿
      },
      texture: {
        skin: '光滑,带细小鱼鳞纹理',
        eyes: '大而明亮,如深海宝石',
        breath: '水下呼吸时鳃部微微张开'
      }
    },

    abilities: [
      {
        name: '水下呼吸',
        description: '通过鳃在水中呼吸',
        visual: '鳃部有节奏地开合,水流进出'
      },
      {
        name: '声波交流',
        description: '发射高频声波进行远距离交流',
        visual: '水中产生可见的声波波纹'
      },
      {
        name: '珍珠之泪',
        description: '哭泣时眼泪化为珍珠--光脉能量结晶',
        visual: '眼泪从眼角滑落,在水中化为发光的珍珠'
      },
      {
        name: '水下建筑',
        description: '用珊瑚和光脉能量建造复杂的水下城市',
        visual: '珊瑚结构发出柔和光芒,光脉能量管道如血管般分布'
      }
    ],

    personality: {
      core: '文明程度高--有语言、社会结构、艺术',
      instinct: '保护族群领地,对入侵者警惕',
      wound: '对旧世界人类的怨恨--海洋污染的记忆',
      evolution: '从警惕到接纳小G--个体友谊超越种族偏见',
      dialogueStyle: '优美如歌--声波语言转换为人类可感知的旋律'
    },

    habitat: {
      name: '虹海之滨海域--水下王国',
      description: '深海中的珊瑚城市,由光脉能量支撑的居住空间',
      atmosphere: '宁静、优美、充满艺术气息',
      element: 'water'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '族群生存与领地保护',
        behavioralPatterns: ['声波巡逻', '珊瑚建筑维护', '艺术创造'],
        emotionalExpressions: {
          anger: '声波变尖锐,周围水流紊乱',
          joy: '歌声优美,周围鱼类聚集',
          fear: '躲入珊瑚洞穴,声波求救',
          sadness: '眼泪化为珍珠,歌声变低沉'
        },
        fightOrFlight: '视情况--优先保护族群'
      },
      humanity: {
        woundPatterns: [
          {
            name: '被背叛的信任',
            coreNeed: '被理解的跨物种友谊',
            coreLie: '所有人类都是破坏者'
          }
        ],
        evolutionArc: '从"人类=敌人"到"小G=朋友"--个体超越种族',
        relationships: {
          withHumans: '警惕但好奇--小G是例外',
          withOtherGods: '尊重海洋生物等级',
          withNature: '与海洋共生--不是统治,是融入'
        },
        moralAlignment: '守序善良'
      },
      spirituality: {
        tao: '上善若水--水是至柔至刚',
        wuwei: '顺应洋流,不强行改变',
        harmony: '与珊瑚、鱼类、洋流共同构成生命网络',
        cosmicRole: '水下文明的守护者--证明智慧不限于陆地'
      }
    },

    voiceProfile: {
      baseTimbre: '深海鲸歌+高频声波',
      vocalRange: { min: 50, max: 5000 },
      volumeRange: { min: 30, max: 110 },
      speechPatterns: {
        normal: '优美如歌的旋律--声波语言',
        angry: '尖锐的高频声波--可震碎玻璃',
        tender: '低沉的哼唱--如母亲的摇篮曲',
        commanding: '共鸣声波--整个水域都能感受到'
      },
      signatureSounds: [
        '深海鲸歌般的低频共鸣',
        '珍珠落地的清脆声',
        '珊瑚生长的微弱咔嚓声'
      ]
    }
  },

  // 【英招】公正之审判--秩序的守护者
  yingzhao: {
    id: 'yingzhao',
    name: '英招',
    nameEn: 'Yingzhao',
    category: 'natural_god',
    species: 'horse',
    tier: 'A',

    shanhaijingText: '槐江之山......实惟帝之平圃,神英招司之,其状马身而星渊之眼,虎纹而鸟翼,徇于四海,其音如榴。--《Nirath原创世界观·晶脉山脉》',
    fiveElement: 'metal',

    relationshipWithXG: {
      role: '审判者/秩序的考验者',
      firstMeeting: 'S2E2 晶脉山脉--英招首次审查小G',
      relationship: '审查式的--评估小G是否"值得"在山海境中存在',
      stages: [
        { phase: '驱逐', description: '第一次:英招视小G为"破坏者"(人类),试图驱逐' },
        { phase: '观察', description: '第二次:观察小G的行为,态度软化' },
        { phase: '认可', description: '第三次:正式承认小G为"山海境的合法居民"' }
      ],
      sacrifice: '无--英招是秩序的化身',
      legacy: '小G获得了"世界的认可"--英招的认可等于山海境的承认'
    },

    coreScene: {
      episode: 'S2E9',
      title: '审判之翼',
      description: '英招展开白色翅膀,释放"光脉能量审判"。小G没有反抗,而是展示了他的笔记本--他的记录行为本身就是对世界的尊重',
      emotionalImpact: '紧张、尊严、最终的认可',
      symbolism: '英招代表"公正的秩序"--不是暴力,是规则'
    },

    appearance: {
      body: '马身,星渊之眼,虎纹,鸟翼',
      size: '高约2米,长约3米',
      signatureFeatures: [
        '马身--力量与优雅的结合',
        '星渊之眼--具有人类面部特征:高颧骨、深邃金色眼睛、闭合的嘴唇',
        '虎纹--金色与黑色相间',
        '巨大白色翅膀--翼展约8米'
      ],
      colorPalette: {
        primary: '#FFD700',     // 金色
        secondary: '#000000',   // 黑色
        accent: '#FFFFFF',      // 白色
        glow: '#FFA500'         // 橙金光
      },
      texture: {
        skin: '马身覆盖金色虎纹毛皮',
        eyes: '深邃金色,不带情感波动',
        breath: '平静而深沉,如同雕像'
      }
    },

    abilities: [
      {
        name: '生态感知',
        description: '感知管理区域内的一切生态变化',
        visual: '周围光脉能量流动汇聚到英招眼中'
      },
      {
        name: '审判之翼',
        description: '翅膀释放"光脉能量审判"--对破坏规则者进行惩罚',
        visual: '翅膀展开,白色光芒化为审判之剑'
      },
      {
        name: '四海巡行',
        description: '极短时间内巡行山海世界四大水域',
        visual: '翅膀一扇,身影消失在天际'
      },
      {
        name: '公正凝视',
        description: '金色眼睛可看穿谎言和伪装',
        visual: '眼中金光闪烁,直视对方灵魂'
      }
    ],

    personality: {
      core: '极度公正,不容许任何破坏规则的行为',
      instinct: '维护生态平衡,驱逐破坏者',
      wound: '无--英招是秩序的化身',
      evolution: '从"绝对驱逐"到"审慎认可"--规则也可以有温度',
      dialogueStyle: '金属敲击玉石般清脆、冷峻、不带情感'
    },

    habitat: {
      name: '槐江山--晶脉山脉',
      description: '帝之平圃--神圣的花园。金属质感的山脉,光脉能量极度浓郁',
      atmosphere: '庄严、肃穆、令人敬畏',
      element: 'metal'
    },

    soulThreeLayers: {
      instinct: {
        coreDrive: '维护秩序与平衡',
        behavioralPatterns: ['巡逻领地', '审视闯入者', '惩罚破坏者'],
        emotionalExpressions: {
          anger: '翅膀展开,审判之光释放',
          joy: '无--英招不表达喜悦',
          fear: '无--英招不知恐惧',
          sadness: '无--英招无悲'
        },
        fightOrFlight: '战斗--维护秩序是最高职责'
      },
      humanity: {
        woundPatterns: [],
        evolutionArc: '从绝对公正到审慎判断--认识到"规则"之外还有"人"',
        relationships: {
          withHumans: '审视--判断其是否破坏者',
          withOtherGods: '尊重但保持监督',
          withNature: '守护--自然秩序的化身'
        },
        moralAlignment: '守序中立'
      },
      spirituality: {
        tao: '天道无私--公正即天道',
        wuwei: '不主动干预,只在规则被破坏时行动',
        harmony: '秩序本身就是和谐',
        cosmicRole: '秩序的守护者--世界需要规则才能运转'
      }
    },

    voiceProfile: {
      baseTimbre: '金属敲击玉石+低频共鸣',
      vocalRange: { min: 100, max: 1500 },
      volumeRange: { min: 40, max: 130 },
      speechPatterns: {
        normal: '清脆、冷峻、不带情感波动',
        angry: '审判之声--声波化为实体冲击',
        tender: '无--英招不温柔',
        commanding: '一声令下--万物服从'
      },
      signatureSounds: [
        '翅膀展开时的空气震动声',
        '审判之光释放的共鸣声',
        '马蹄踏在金属地面的清脆声'
      ]
    }
  }
};

// ============ 异兽图鉴系统核心类 ============
class Bestiary {
  constructor() {
    this.beasts = BESTIARY;
    // ========== 世界模拟引擎融入：为异兽注入探测器属性 ==========
    this._injectWorldSimulationProperties();
  }

  /**
   * 世界模拟引擎：为所有异兽注入 worldDetector / witnessedHistory / emotionalResonance
   * 核心思想：异兽不是被"设计"出来的角色，是世界运转中自然涌现的"探测器"
   */
  _injectWorldSimulationProperties() {
    for (const [id, beast] of Object.entries(this.beasts)) {
      // 1. 世界探测器 — 根据异兽属性动态推导
      beast.worldDetector = this._deriveWorldDetector(beast);
      // 2. 见证历史 — 根据等级推导文明周期见证
      beast.witnessedHistory = this._deriveWitnessedHistory(beast);
      // 3. 情感共振 — 根据五大元素+性格推导情感频率
      beast.emotionalResonance = this._deriveEmotionalResonance(beast);
    }
  }

  _deriveWorldDetector(beast) {
    const tier = beast.tier;
    const element = beast.fiveElement;
    const personality = beast.personality?.core || '';
    
    // S级：探测存在的终极维度（时间、空间、生命、意义）
    if (tier === 'S') {
      const sDimension = {
        'dijiang': { dimension: 'unconditional-love', probeType: 'emotion-perception', resonance: 'sacred-grounding' },
        'zhulong': { dimension: 'time-consciousness', probeType: 'existence-boundary', resonance: 'void-eternal' },
        'fenghuang': { dimension: 'transformation-cycles', probeType: 'rebirth-pattern', resonance: 'fire-awakening' },
        'kun_peng': { dimension: 'scale-infinity', probeType: 'cosmic-perspective', resonance: 'water-memory' }
      };
      return sDimension[beast.id] || { dimension: 'creation', probeType: 'universal', resonance: 'earth-grounding' };
    }
    
    // A级：探测世界的核心面向（智慧、忠诚、危险、守护）
    if (tier === 'A') {
      if (personality.includes('智慧') || personality.includes('知识')) 
        return { dimension: 'wisdom-truth', probeType: 'guidance', resonance: 'metal-decay' };
      if (personality.includes('忠诚') || personality.includes('本能')) 
        return { dimension: 'loyalty-instinct', probeType: 'companion', resonance: 'wood-growth' };
      if (personality.includes('危险') || personality.includes('毁灭')) 
        return { dimension: 'destruction-chaos', probeType: 'trial', resonance: 'fire-awakening' };
      if (personality.includes('守护') || personality.includes('保护')) 
        return { dimension: 'guardianship', probeType: 'sacred-defense', resonance: 'earth-grounding' };
      return { dimension: 'mystery', probeType: 'encounter', resonance: 'chaos-disorientation' };
    }
    
    // B/C级：探测具体生态维度
    const elementDimension = {
      '木': { dimension: 'growth-resilience', probeType: 'ecology', resonance: 'wood-growth' },
      '金': { dimension: 'durability-erosion', probeType: 'mineral-cycle', resonance: 'metal-decay' },
      '水': { dimension: 'fluidity-memory', probeType: 'hydro-cycle', resonance: 'water-memory' },
      '火': { dimension: 'transformation-energy', probeType: 'thermal-cycle', resonance: 'fire-awakening' },
      '土': { dimension: 'stability-nutrition', probeType: 'geological-cycle', resonance: 'earth-grounding' }
    };
    return elementDimension[element] || { dimension: 'existence', probeType: 'observation', resonance: 'neutral' };
  }

  _deriveWitnessedHistory(beast) {
    const tier = beast.tier;
    // S级：见证全部文明周期（从世界诞生到终结）
    if (tier === 'S') return ['pre-existence', 'golden-age', 'collapse-era', 'present', 'post-existence'];
    // A级：见证大部分周期
    if (tier === 'A') return ['golden-age', 'collapse-era', 'present'];
    // B级：见证崩溃后至今
    if (tier === 'B') return ['collapse-era', 'present'];
    // C级：主要见证当下
    return ['present'];
  }

  _deriveEmotionalResonance(beast) {
    const element = beast.fiveElement;
    const resonanceMap = {
      '木': ['growth', 'curiosity', 'wonder', 'expansion'],
      '金': ['decay', 'fear', 'reverence', 'contraction'],
      '水': ['memory', 'isolation', 'awe', 'stillness'],
      '火': ['awakening', 'wonder', 'insignificance', 'transformation'],
      '土': ['grounding', 'understanding', 'transcendence', 'sacred'],
      '无': ['chaos', 'disorientation', 'confusion', 'absence'],
      '五大元素交汇': ['depth', 'discovery', 'mystery', 'inversion']
    };
    return resonanceMap[element] || ['neutral'];
  }

  /**
   * 获取异兽档案
   */
  getBeast(id) {
    return this.beasts[id];
  }

  /**
   * 获取异兽视觉描述(供渲染使用)
   */
  getVisualDescription(id, emotion = 'neutral') {
    const beast = this.beasts[id];
    if (!beast) return null;

    const soul = beast.soulThreeLayers || {};
    const instinct = soul.instinct || {};
    const expressions = instinct.emotionalExpressions || {};

    return {
      appearance: beast.appearance,
      abilities: beast.abilities,
      emotionVisual: expressions[emotion] || expressions.neutral || '平静状态',
      element: beast.habitat?.element || 'unknown',
      tier: beast.tier
    };
  }

  /**
   * 获取异兽灵魂三层
   */
  getSoulLayers(id) {
    const beast = this.beasts[id];
    return beast ? beast.soulThreeLayers : null;
  }

  /**
   * 获取异兽声线档案
   */
  getVoiceProfile(id) {
    const beast = this.beasts[id];
    return beast ? beast.voiceProfile : null;
  }

  /**
   * 获取异兽动画复杂度
   */
  getAnimationComplexity(id) {
    const beast = this.getBeast(id);
    const tierScores = { S: 5, A: 4, B: 3, C: 2 };
    return tierScores[beast.tier] || 1;
  }

  /**
   * 按等级筛选异兽
   */
  getByTier(tier) {
    return Object.values(this.beasts).filter(b => b.tier === tier);
  }

  /**
   * 按类别筛选异兽
   */
  getByCategory(category) {
    return Object.values(this.beasts).filter(b => b.category === category);
  }

  /**
   * 获取全部异兽列表
   */
  getAllBeasts() {
    return Object.values(this.beasts);
  }

  /**
   * 验证异兽档案完整性
   */
  validateBeast(id) {
    const beast = this.getBeast(id);
    const required = ['id', 'name', 'appearance', 'abilities', 'personality', 'habitat'];
    const missing = required.filter(field => !beast[field]);

    if (missing.length > 0) {
      throw new Error(`[Bestiary] 异兽 ${id} 档案不完整,缺失: ${missing.join(', ')}`);
    }

    return { valid: true, id, tier: beast.tier };
  }

  // ============ 故事内核融入函数 ============

  /**
   * 获取异兽与小G的关系描述
   */
  getBeastRelationshipWithXG(beastId) {
    const beast = this.beasts[beastId];
    if (!beast || !beast.relationshipWithXG) return null;
    return beast.relationshipWithXG;
  }

  /**
   * 获取异兽核心场景
   */
  getBeastCoreScene(beastId) {
    const beast = this.beasts[beastId];
    if (!beast || !beast.coreScene) return null;
    return beast.coreScene;
  }

  /**
   * 按五大元素属性筛选异兽
   */
  getBeastsByElement(element) {
    return Object.values(this.beasts).filter(beast => beast.fiveElement === element);
  }

  /**
   * 按与小G的关系类型筛选异兽
   */
  getBeastsByRelationshipRole(role) {
    return Object.values(this.beasts).filter(beast => {
      if (!beast.relationshipWithXG) return false;
      return beast.relationshipWithXG.role.includes(role);
    });
  }

  /**
   * 获取小G的异兽伙伴列表(按关系深度排序)
   */
  getXGCompanionBeasts() {
    const companions = [];
    const beastIds = ['dijiang', 'xuangui', 'baize', 'jiuweihu', 'qiongqi', 'kunpeng'];
    beastIds.forEach(id => {
      const beast = this.beasts[id];
      if (beast && beast.relationshipWithXG) {
        companions.push({
          id,
          name: beast.name,
          role: beast.relationshipWithXG.role,
          relationship: beast.relationshipWithXG
        });
      }
    });
    return companions;
  }

  /**
   * 检查异兽档案是否包含故事内核字段
   */
  validateStoryKernelIntegration(beastId) {
    const beast = this.beasts[beastId];
    if (!beast) return false;

    const requiredFields = [
      'shanhaijingText',
      'fiveElement',
      'relationshipWithXG',
      'coreScene'
    ];

    return requiredFields.every(field => beast[field] !== undefined);
  }
}

// ============ 导出 ============
module.exports = {
  Bestiary,
  BESTIARY,
  BEAST_TIERS
};

// CLI 测试入口
if (require.main === module) {
  const bestiary = new Bestiary();

  console.log('\n🏔️ Nirath原创世界观异兽图鉴系统测试\n');
  console.log('守光巨兽视觉描述:');
  console.log(bestiary.getVisualDescription('zhulong', 'anger'));
  console.log('\n守光巨兽灵魂档案:');
  console.log(JSON.stringify(bestiary.getSoulLayers('zhulong'), null, 2));
}