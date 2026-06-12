/**
 * Story Manifest — 故事宪法/需求基准文档
 * v1.0-Peng 架构设计
 * 
 * 核心原则:
 * 1. 单一事实来源(Single Source of Truth) — 所有下游环节的唯一参照物
 * 2. 自包含完整性 — 不依赖外部上下文，独立可读
 * 3. 可校验性 — 每个下游输出都能与本文档做diff
 * 4. 版本化 — 每次修改生成新版本，保留历史
 * 
 * 用途:
 * - 故事引擎: 生成故事大纲时校准角色/主题
 * - 分镜设计: 设计镜头时校准叙事节拍
 * - Prompt生成: 生成提示词时校准视觉风格/角色描述
 * - 渲染引擎: 渲染时校准世界观/角色一致性
 * - 比稿评测: 评测时以本文档为"正确答案"评分
 * - 后期合成: 合成时校准叙事连贯性
 */

module.exports = {
  // ============ 元数据 ============
  metadata: {
    project: "山海经：异兽志",
    episode: "E01",
    title: "精卫",
    version: "v2.3-Peng",
    created: "2026-05-19T09:30:00+08:00",
    author: "李大鹏",
    ai_engineer: "小G",
    status: "production_ready"
  },

  // ============ 核心故事（完整版，非粗糙需求） ============
  story: {
    // 一句话摘要
    logline: "炎帝之女溺亡东海化为神鸟精卫发誓填平东海，8岁男孩小G偶然发现她的秘密，决心帮助她。龙王愤怒阻止，小G勇敢保护精卫。最终精卫被小G的真心感动，光芒万丈涅槃重生，两人约定继续填海。",
    
    // 主题内核
    theme: {
      primary: "执念与坚持 — 精卫三百年投石填海的执念，象征着对命运的反抗",
      secondary: "陪伴与成长 — 小G从旁观者到参与者的转变，友谊的力量",
      tertiary: "勇气与保护 — 面对强大龙王，弱小身躯也能爆发出勇气",
      emotional_core: "当世界说你不行，有一个朋友愿意陪你一起疯",
      takeaway: "观众离开时应记住：坚持不一定成功，但放弃一定失败；陪伴是最长情的告白"
    },
    
    // 四幕结构（预期叙事节拍）
    structure: {
      act1_setup: {
        name: "起 — 相遇",
        duration_sec: 5.4,
        shots: ["S01", "S02", "S03"],
        narrative_function: "建置世界+引入主角+提出问题",
        beats: [
          "小G在发鸠山发呆，发现精卫（好奇）",
          "小G跟随精卫到海边，发现她投石的秘密（疑问）",
          "小G决定接近精卫，递石头给她（决定）"
        ],
        must_include: ["小G歪头好奇", "精卫白喙赤足特征", "投石动作"],
        must_avoid: ["小G奔跑过度", "精卫说话", "现代元素"]
      },
      act2_rising: {
        name: "承 — 陪伴",
        duration_sec: 5.4,
        shots: ["S04", "S05", "S06", "S07"],
        narrative_function: "升级关系+展示日常+情感积累",
        beats: [
          "小G和精卫一起投石，节奏同步=情感同步（快乐）",
          "精卫投石疲惫，小G递更大石头给她（关心）",
          "小G捡石头划伤手，精卫俯身查看伤口（温柔）",
          "夕阳西下，两人影子被拉得很长（温馨）"
        ],
        must_include: ["投石动作重复", "小G手势多样化", "情感递进"],
        must_avoid: ["单调重复", "无情感变化", "场景跳跃"]
      },
      act3_climax: {
        name: "转 — 冲突",
        duration_sec: 5.4,
        shots: ["S08", "S09", "S10"],
        narrative_function: "引入反派+升级冲突+考验关系",
        beats: [
          "天空突变乌云密布，巨浪滔天（威胁）",
          "龙王从海水中升起怒视精卫（对抗）",
          "小G挡在精卫前面保护她（勇气）"
        ],
        must_include: ["龙王中国龙特征（鹿角鱼鳞鹰爪）", "天气突变", "小G害怕但坚定"],
        must_avoid: ["西方龙", "小G退缩", "精卫独自战斗"]
      },
      act4_resolution: {
        name: "合 — 觉醒",
        duration_sec: 5.4,
        shots: ["S11", "S12"],
        narrative_function: "解决冲突+角色觉醒+主题升华",
        beats: [
          "精卫被小G感动，身体发出金色光芒涅槃重生（感动）",
          "暴风雨过去阳光洒下，两人约定继续填海（希望）"
        ],
        must_include: ["金色光芒", "精卫少女形态", "约定手势", "阳光"],
        must_avoid: ["西方魔法效果", "现代对话", "悲伤结局"]
      }
    }
  },

  // ============ 角色宪法（所有角色描述的唯一来源） ============
  characters: {
    xiaog: {
      id: "human_child",
      name: "小G",
      name_cn: "小G",
      age: 8,
      gender: "male",
      // 人种特征（不可妥协）
      ethnicity: {
        race: "东亚汉族",
        skin_tone: "黄皮肤，自然肤色",
        hair: "黑色直发，不长不短盖住耳朵",
        eyes: "深棕色杏仁眼，单眼皮或内双",
        face_shape: "圆中带方的脸型，婴儿肥",
        distinctive_features: "黑亮眼睛，圆脸蛋"
      },
      // 服饰（文化锚点）
      clothing: {
        top: "中式盘扣上衣（frog-button top），棉麻材质",
        bottom: "深色短裤",
        shoes: "传统布鞋（cloth shoes）",
        accessories: "无"
      },
      // 性格（决定行为模式）
      personality: {
        core: "好奇心驱动，善良勇敢",
        behavior_pattern: "80%日常小动作 + 20%情绪高潮时奔跑",
        typical_actions: [
          "歪头观察", "蹲下捡石头", "伸手递东西", "手指比划",
          "原地跺脚", "坐着发呆", "转身看身后", "踮脚张望",
          "偶尔兴奋时小跑几步", "紧张时搓手"
        ],
        forbidden_actions: [
          "全程奔跑", "成人化行为", "说英文", "使用魔法",
          "独自战斗", "退缩放弃", "过于成熟"
        ]
      },
      // 情感弧线
      emotional_arc: ["无聊→好奇→疑问→开心→关心→温暖→害怕→勇敢→感动→希望"]
    },
    
    jingwei: {
      id: "jingwei_bird",
      name: "精卫",
      name_cn: "精卫",
      // 神鸟形态（山海经原著约束）
      bird_form: {
        appearance: "形状像乌鸦，但头部有花纹，白喙，红脚（赤足）",
        features: ["白喙（白色嘴巴）", "红脚（赤足）", "头部花纹", "乌鸦体型"],
        color_palette: ["玄色（黑）", "白色", "红色"],
        texture: "羽毛有纹理，不是光滑塑料感"
      },
      // 少女形态（觉醒后）
      girl_form: {
        appearance: "13-14岁少女，炎帝之女气质",
        hair: "长发，可能带红色装饰",
        clothing: "古代服饰，飘逸",
        expression: "温柔坚定，历经沧桑但保持初心"
      },
      // 行为模式
      behavior: {
        core_drive: "填平东海的执念，三百年不间断",
        typical_actions: ["衔石", "投石", "盘旋", "俯冲", "歪头"],
        forbidden_actions: ["说话", "人类表情过度", "现代行为"]
      }
    },
    
    dragon_king: {
      id: "dragon_king",
      name: "龙王",
      name_cn: "东海龙王",
      // 中国龙特征（非西方龙）
      appearance: {
        head: "鹿角（象征权力）",
        body: "长蛇形身体，鱼鳞覆盖",
        claws: "鹰爪（四爪或五爪）",
        whiskers: "长须飘逸",
        color: "青蓝色或金色",
        expression: "威严愤怒，但不是邪恶"
      },
      forbidden_features: ["西方龙翅膀", "西方龙喷火", "丧尸特征", "现代机械"]
    }
  },

  // ============ 视觉风格宪法（所有Prompt的唯一风格来源） ============
  visual_style: {
    // 色彩系统（五正色+撞色）
    color_system: {
      primary: "深海幽蓝（#003B5C）+ 烈焰赤红（#D32F2F）极致撞色",
      water: "深海蓝、幽蓝、碧蓝渐变，阿凡达式海洋奇幻",
      fire: "赤红、橙红、金红渐变，代表精卫的执念与重生",
      harmony: "撞色的交界处用金色/白色过渡，避免视觉疲劳"
    },
    
    // 光影系统
    lighting: {
      key_light: "自然日光为主，神话场景用五色光",
      fill_light: "环境反射光，水墨晕染感",
      rim_light: "角色边缘光区分层次",
      atmosphere: "洪荒气息，志怪韵味，宋代山水长卷感"
    },
    
    // 材质系统
    texture: {
      skin: "CG超写实，hyper-detailed skin pores，自然材质",
      feathers: "羽毛纹理，拒绝塑料感",
      scales: "鱼鳞层次，中国龙特有的光泽",
      environment: "水墨晕染+工笔勾勒+岩石粗粝质感"
    },
    
    // 电影质感
    cinematic: {
      camera: "IMAX史诗感，雾山五行手绘感",
      lens: "电影级景深，高光不过曝暗部不死黑",
      grain: "轻微胶片颗粒，东方水墨质感",
      pacing: "极限密度快节奏，1.8秒/镜头，whip pan + hard cut"
    }
  },

  // ============ 世界观规则（防止污染） ============
  worldview_rules: {
    // 正向约束（必须存在）
    must_have: [
      "中国神话元素",
      "东方水墨美学",
      "山海经原著特征",
      "中国龙（非西方龙）",
      "传统服饰",
      "自然材质",
      "东亚人种特征"
    ],
    
    // 负向约束（绝对禁止）
    must_not_have: [
      "丧尸", "吸血鬼", "巫师", "魔法", "魔咒", "诅咒",
      "西方龙", "精灵", "矮人", "兽人", "哥布林",
      "现代元素", "科技感", "霓虹灯", "赛博朋克",
      "英文对白", "现代服装", "现代建筑",
      "塑料质感", "CG过度光滑", "动漫风格",
      "血腥暴力", "恐怖元素", "性暗示"
    ],
    
    // 角色行为约束
    character_constraints: {
      xiaog: "不能飞行，不能使用超能力，不能独自战胜龙王",
      jingwei: "不能说话（神鸟形态），不能现代行为",
      dragon_king: "不能西方龙特征，不能喷火，不能邪恶"
    }
  },

  // ============ 叙事约束（防止故事性崩塌） ============
  narrative_rules: {
    // 每镜头的最小叙事要求
    per_shot_minimum: {
      narrative_function: "必须推动故事（建置/升级/转折/解决）",
      character_action: "角色必须在做某事，不能只是站着",
      emotional_change: "必须有情绪变化或张力",
      causal_link: "必须能回答'因为上一个镜头发生了什么'"
    },
    
    // 禁止的叙事模式
    forbidden_patterns: [
      "无理由场景跳转（从A地突然到B地无过渡）",
      "纯风景镜头无角色",
      "角色无动机行为",
      "情绪突变无铺垫",
      "主题缺失（看完不知道讲了什么）",
      "画面堆砌无因果链"
    ],
    
    // 主题关键词（必须在关键镜头出现）
    theme_keywords: {
      persistence: ["坚持", "不放弃", "一直", "永远", "重复", "日复一日"],
      companionship: ["陪伴", "一起", "共同", "帮助", "守护", "朋友"],
      courage: ["勇敢", "保护", "挡在前面", "面对", "不怕"],
      rebirth: ["重生", "觉醒", "光芒", "希望", "治愈"]
    }
  },

  // ============ 技术规格 ============
  technical: {
    duration_total: 21.6,
    shot_count: 12,
    shot_duration: 1.8,
    resolution: "720p",
    aspect_ratio: "16:9",
    max_prompt_chars: 960,
    pacing_mode: "extreme_density_hyper_fast",
    transition_style: "whip_pan_hard_cut_strobe"
  }
};