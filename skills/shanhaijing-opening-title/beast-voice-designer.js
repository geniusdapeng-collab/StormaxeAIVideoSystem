/**
 * 神兽音色设计系统 v3.4-Peng — Seedance同步生成版（方案C：固定锚点+悬念钩子）
 *
 * v2.16-Peng 更新（2026-05-27）：
 * - 默认返回英文版本：metadata 中 fixedAnchor/suspenseHook/fullLine/beastName 均为英文
 * - generateSeedanceVoicePrompt 全面英文化，直接构建英文 Prompt
 * - 保留中文版本在 *_Cn 备用字段中
 * - 悬念钩子模板 defaultSuspenseHookEn 作为默认输出
 *
 * v3.2-Peng更新：
 * - 开场台词拆分为固定锚点（统一品牌）+ 悬念钩子（每集变化）
 * - 固定锚点：硬编码，每集一样，建立统一预期
 * - 悬念钩子：从story-plan自动生成，制造本集独特期待
 */

// ========== 神兽音色档案库 ==========
const BEAST_VOICE_PROFILES = {
  // 刑天 — 不灭的战魂
  xingtian: {
    name: '刑天',
    nameEn: 'Xingtian',
    voiceDesign: {
      timbre: '低沉浑厚，胸腔共鸣强烈，带金属质感回响，如远古战鼓在胸腔内震荡',
      timbreEn: 'deep resonant bass voice with strong chest resonance and metallic undertone, like an ancient war drum echoing within a bronze chest cavity',
      pace: '缓慢而坚定，每个字之间有明显的停顿，如战鼓敲击的节奏',
      paceEn: 'slow and deliberate, pronounced pauses between each word, like war drum beats',
      space: '声音仿佛从巨大的远古洞穴深处传来，带有岩石壁面的反射回声',
      spaceEn: 'voice seems to emanate from deep within a vast ancient cavern, with reflective echoes off stone walls',
      emotion: '威严中带着历经沧桑的沉静，不是愤怒，是"我经历过一切"的从容',
      emotionEn: 'commanding yet serene, not angry but the calm of one who has endured everything',
      humanReference: '《指环王》甘道夫的低沉嗓音 + 《战神》奎托斯的金属质感',
      // 🆕 v1.3-Peng: 震撼音效设计
      soundEffect: '低频轰鸣如地壳震动，战斧挥动的破空声，盾牌撞击的金属巨响，远古战鼓的沉闷回响，低频sub-bass 20-60Hz震撼低音',
      soundEffectEn: 'sub-bass earth rumble 20-60Hz, axe swoosh cutting air, shield clang metallic impact, ancient war drum deep reverberation'
    },

    // 🆕 v3.2-Peng: 开场台词拆分为固定锚点 + 悬念钩子
    fixedAnchor: '欢迎来到Nirath星球。我是刑天——不灭的战魂。',
    fixedAnchorEn: 'Welcome to planet Nirath. I am Xingtian — the eternal war spirit.',
    suspenseHookTemplate: '今天，{conflict}将唤醒沉睡三千年的锋芒。',
    suspenseHookEnTemplate: 'Today, {conflict} will awaken a blade dormant for three millennia.',
    defaultSuspenseHook: '今天，一个孩子的好奇心将唤醒沉睡三千年的锋芒。',
    defaultSuspenseHookEn: 'Today, a child\'s curiosity will awaken a blade dormant for three millennia.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，Nirath场景开始从黑暗中缓缓渐显——先是微弱的光脉苔藓闪烁，然后是浮空晶簇轮廓浮现，最后整个生态完全呈现。主标题在声音说到中段时完全呈现。声音与画面的关系：不是画外音，而是Nirath环境本身在震动——岩石、磁场、能量场共同共振形成的声音现象。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。声音的尾音带有{sfx}。`
  },

  // 烛龙 — 赤金烈焰
  zhulong: {
    name: '烛龙',
    nameEn: 'Zhulong',
    voiceDesign: {
      timbre: '清亮而威严，带火焰爆裂的嘶嘶声质感，高音区明亮如金',
      timbreEn: 'bright and commanding with fire crackle sibilance, golden highs',
      pace: '中等偏快，字与字之间似有火焰跳跃的急切感',
      paceEn: 'moderately fast, words seem to leap like flames',
      space: '仿佛从火山岩洞深处传来，岩浆流动的低频轰鸣作为声音底色',
      spaceEn: 'as if emanating from deep within volcanic caverns, with magma flow rumble as sonic backdrop',
      emotion: '威严而神秘，如同面对一位古老的神明，温暖但不可触碰',
      emotionEn: 'commanding and mysterious, like facing an ancient deity, warm yet untouchable',
      humanReference: '《权力的游戏》龙母说话时的火焰背景感 + 佛教诵经的空灵'
    },

    fixedAnchor: '欢迎来到Nirath星球。我是烛龙——睁眼为昼，闭眼为夜。',
    fixedAnchorEn: 'Welcome to planet Nirath. I am Zhulong — when I open my eyes it is day, when I close them it is night.',
    suspenseHookTemplate: '今天，双日的光芒将照见深渊中最古老的{secret}。',
    suspenseHookEnTemplate: 'Today, the light of the twin suns will illuminate the most ancient {secret} in the abyss.',
    defaultSuspenseHook: '今天，双日的光芒将照见深渊中最古老的秘密。',
    defaultSuspenseHookEn: 'Today, the light of the twin suns will illuminate the most ancient secret in the abyss.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，背景中的火焰开始从黑暗中一点点燃起——先是微弱的火星，然后是火苗跳动，最后整个火山岩洞完全照亮。主标题在声音说到中段时完全呈现。声音与画面的关系：火焰不是背景，而是声音的来源——每一个字都像是从火苗中直接诞生。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。尾音带有{sfx}。`
  },

  // 帝江 — 混沌无面
  dijiang: {
    name: '帝江',
    nameEn: 'Dijiang',
    voiceDesign: {
      timbre: '多重声线叠加，无明确性别，似百人合唱的低语，不属于任何单一生物',
      timbreEn: 'multi-layered voice with no discernible gender, like a hundred whispering voices, belonging to no single being',
      pace: '极慢，每个字拖长，似从很远的地方传来，超越时间的尺度',
      paceEn: 'extremely slow, each syllable elongated, as if transmitted from vast distances beyond time',
      space: '声音似乎来自四面八方又似乎来自内部，空间感被完全扭曲',
      spaceEn: 'voice seems to come from everywhere and nowhere simultaneously, spatial perception completely distorted',
      emotion: '超然物外的神秘感，不是恐怖，是"你见到了无法理解之物"的敬畏',
      emotionEn: 'transcendent mystery, not horror but the awe of witnessing something beyond comprehension',
      humanReference: '《2001太空漫游》HAL 9000的多重和声 + 藏传佛教诵经'
    },

    fixedAnchor: '欢迎来到Nirath星球。我是帝江——混沌的源头，秩序的反面。',
    fixedAnchorEn: 'Welcome to planet Nirath. I am Dijiang — the source of chaos, the inverse of order.',
    suspenseHookTemplate: '而你将要见证的，是连{concept}都不敢记录的{event}。',
    suspenseHookEnTemplate: 'And what you are about to witness is a {event} that even {concept} dare not record.',
    defaultSuspenseHook: '而你将要见证的，是连时间都不敢记录的故事。',
    defaultSuspenseHookEn: 'And what you are about to witness is a story that even time dare not record.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，空间开始从黑暗中扭曲显现——先是微弱的晶体闪光，然后是磁场线浮现，最后整个混沌空间完全呈现。主标题在声音说到中段时完全呈现。声音与画面的关系：不是来自某个角色，而是空间本身在说话——磁场线、光脉孢子、浮空晶簇共同振动产生的宇宙级和声。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。尾音{sfx}。`
  },

  // 九尾狐 — 青丘之灵
  jiuweihu: {
    name: '九尾狐',
    nameEn: 'Nine-Tailed Fox',
    voiceDesign: {
      timbre: '柔美而灵动，带铃铛般的清脆尾音，似风中银铃，狡黠中带亲切',
      timbreEn: 'soft and agile with bell-like crisp tail tones, like wind chimes, mischievous yet warm',
      pace: '轻快流畅，字与字间有跳跃感，如狐狸轻盈的步伐，偶尔停顿似在眨眼',
      paceEn: 'light and flowing, words skip like fox steps, occasional pauses as if winking',
      space: '声音从青丘森林的深处传来，风穿过银色树叶产生自然的和声',
      spaceEn: 'voice emerges from deep within Azure Hills forest, wind through silver leaves creating natural harmonies',
      emotion: '狡黠而亲切，像一位古老的朋友在对你眨眼，智慧中带着调皮',
      emotionEn: 'mischievous yet intimate, like an ancient friend winking at you, wisdom wrapped in playfulness',
      humanReference: '《千与千寻》汤婆婆的变幻莫测 + 日本风铃的清脆'
    },

    fixedAnchor: '欢迎来到Nirath星球。我是九尾狐——青丘的灵，千年的智。',
    fixedAnchorEn: 'Welcome to planet Nirath. I am the Nine-Tailed Fox — spirit of Azure Hills, wisdom of a thousand years.',
    suspenseHookTemplate: '今天，{subject}将带你走进连我都未曾完全看透的{mystery}。',
    suspenseHookEnTemplate: 'Today, {subject} will lead you into a {mystery} that even I have not fully seen through.',
    defaultSuspenseHook: '今天，一条尾巴将带你走进连我都未曾完全看透的幻境。',
    defaultSuspenseHookEn: 'Today, one tail will lead you into an illusion that even I have not fully seen through.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，青丘森林开始从黑暗中缓缓渐显——先是微弱的孢子荧光，然后是银色树叶轮廓浮现，最后整个森林完全明亮。主标题在声音说到中段时完全呈现。声音与画面的关系：九条尾巴在声音发出时同步从黑暗中显现，每一条尾巴对应一种音色的层次。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。尾音带有{sfx}。`
  },

  // 白泽 — 智慧祥瑞
  baize: {
    name: '白泽',
    nameEn: 'Baize',
    voiceDesign: {
      timbre: '温润如玉，带书卷气的清朗，似古籍翻页的沙沙质感，知识沉淀的声音',
      timbreEn: 'warm and jade-like with scholarly clarity, like turning ancient pages, the sound of accumulated knowledge',
      pace: '从容不迫，每句话都像在讲述一个千年传说，停顿处似在回忆',
      paceEn: 'unhurried, each phrase like recounting a millennia-old legend, pauses as if recalling memories',
      space: '声音从一座古老的图书馆深处传来，木质书架产生温暖的共振',
      spaceEn: 'voice from deep within an ancient library, wooden shelves creating warm resonance',
      emotion: '博学而谦和，像一位慈祥的老者在分享千年智慧，不炫耀但充满力量',
      emotionEn: 'erudite yet humble, like a kind elder sharing millennia of wisdom, powerful without pretension',
      humanReference: '《星际迷航》斯波克的理性 + 中国传统说书人的韵味'
    },

    fixedAnchor: '欢迎来到Nirath星球。我是白泽——知晓万物，通晓古今。',
    fixedAnchorEn: 'Welcome to planet Nirath. I am Baize — knower of all things, comprehender of ancient and modern.',
    suspenseHookTemplate: '但有一件事，我读了十万卷古籍，依然无法回答——{question}',
    suspenseHookEnTemplate: 'But there is one thing, after reading a hundred thousand volumes, I still cannot answer — {question}',
    defaultSuspenseHook: '但有一件事，我读了十万卷古籍，依然无法回答。',
    defaultSuspenseHookEn: 'But there is one thing, after reading a hundred thousand volumes, I still cannot answer.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，古老图书馆开始从黑暗中缓缓显现——先是微弱的书卷光芒，然后是木质书架轮廓浮现，最后整个知识殿堂完全明亮。主标题在声音说到中段时完全呈现。声音与画面的关系：不是来自某个可见的角色，而是Nirath的知识场在说话——光脉苔藓、浮空晶簇、虹脉孢子共同记载着这个星球的历史。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。尾音带有{sfx}。`
  },

  // 饕餮 — 贪婪吞噬
  taotie: {
    name: '饕餮',
    nameEn: 'Taotie',
    voiceDesign: {
      timbre: '沙哑粗糙，带吞咽声的黏腻质感，似喉咙中有异物，饥饿的声音',
      timbreEn: 'raspy and rough with swallowing mucus texture, like throat obstruction, the sound of hunger',
      pace: '急促贪婪，字与字间似在喘息，饥饿感强烈，偶尔有咀嚼的停顿',
      paceEn: 'urgent and greedy, words gasped between breaths, hunger permeating every syllable',
      space: '声音从深渊底部传来，伴随着胃酸沸腾的低频咕噜声',
      spaceEn: 'voice from abyssal depths, accompanied by low-frequency stomach acid bubbling',
      emotion: '贪婪而直接，没有伪装，纯粹的欲望本身，让人本能地警惕',
      emotionEn: 'greedy and direct, no pretense, pure desire itself, instinctively alerting',
      humanReference: '《霍比特人》史矛革的低沉贪婪 + 恐龙咀嚼声'
    },

    fixedAnchor: '欢迎来到Nirath星球。我是饕餮——饥饿，是我的名字。',
    fixedAnchorEn: 'Welcome to planet Nirath. I am Taotie — hunger is my name.',
    suspenseHookTemplate: '而今天，一个{target}闯入了我的领地。',
    suspenseHookEnTemplate: 'And today, a {target} has wandered into my domain.',
    defaultSuspenseHook: '而今天，一个不知死活的小东西闯入了我的领地。',
    defaultSuspenseHookEn: 'And today, a foolish little thing has wandered into my domain.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，深渊开始从黑暗中缓缓显现——先是微弱的胃酸荧光，然后是岩壁轮廓浮现，最后整个饥饿深渊完全明亮。主标题在声音说到中段时完全呈现。声音与画面的关系：地面随着每个字震动，仿佛这个星球本身就是一个饥饿的胃。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。尾音带有{sfx}。`
  },

  // 默认模板
  default: {
    name: 'Nirath引导者',
    nameEn: 'Nirath Guide',
    voiceDesign: {
      timbre: '中性温和，带外星质感的轻微电子共鸣，友好但陌生',
      timbreEn: 'neutral and warm with alien electronic resonance, friendly yet strange',
      pace: '平稳清晰，信息传达优先',
      paceEn: 'steady and clear, prioritizing information delivery',
      space: '声音从Nirath的磁场屏障中传来，淡蓝色能量场的轻微嗡鸣作为底色',
      spaceEn: 'voice transmitted through Nirath magnetic barrier, pale blue energy field hum as backdrop',
      emotion: '友好而神秘，像一个可靠的向导，等待你的到来',
      emotionEn: 'friendly and mysterious, like a reliable guide awaiting your arrival',
      humanReference: '《她》中Samantha的温柔 + 科幻感'
    },

    fixedAnchor: '欢迎来到Nirath星球。',
    fixedAnchorEn: 'Welcome to planet Nirath.',
    suspenseHookTemplate: '今天，一段{adjective}的旅程即将展开。',
    suspenseHookEnTemplate: 'Today, a {adjective} journey is about to begin.',
    defaultSuspenseHook: '今天，一段未知的旅程即将展开。',
    defaultSuspenseHookEn: 'Today, an unknown journey is about to begin.',

    promptTemplate: `画面开始是一片黑暗，只有{tim}的声音在虚空中回荡。这声音{space}，说着固定锚点："{anchor}"紧接着抛出悬念钩子："{hook}"随着声音继续，Nirath场景开始从黑暗中缓缓渐显——先是微弱的磁场光芒，然后是浮空岛屿轮廓浮现，最后整个星球完全明亮。主标题在声音说到中段时完全呈现。声音与画面的关系：Nirath星球本身在欢迎访客——磁场、光脉、浮空岛屿共同发出的宇宙级问候。观众先被声音吸引，然后才看到画面，胃口被吊足。固定锚点建立统一品牌预期，悬念钩子制造本集独特期待。尾音带有{sfx}。`
  }
};

// ========== SFX层描述（用于Prompt） ==========
const SFX_DESCRIPTIONS = {
  xingtian: '金属盾牌轻微共鸣的尾韵，远处战鼓低频震颤的消散，岩石碎裂微粒坠落的细微声响',
  zhulong: '火焰爆裂的嘶嘶尾音，岩浆气泡破裂的细微声，鳞片摩擦的金属质感余韵',
  dijiang: '空间扭曲的相位漂移余音，远古回响的幽灵回声，晶体共振和声的衰减',
  jiuweihu: '风铃轻响的尾韵，远处溪流潺潺的持续声，孢子飘浮的细微闪烁声',
  baize: '古籍翻页的沙沙尾音，玉石碰撞的清脆共鸣，远处钟声的悠远回响',
  taotie: '饥饿胃鸣的持续低频，唾液黏连的细微声，深渊轰鸣的衰减',
  default: 'Nirath磁场嗡鸣的持续音，光脉苔藓脉冲的细微节奏'
};

// ========== 辅助函数 ==========

/**
 * 获取神兽音色档案
 * @param {string} beastId - 神兽ID（拼音或中文）
 * @returns {Object} - 音色档案
 */
function getVoiceProfile(beastId) {
  if (!beastId) return BEAST_VOICE_PROFILES.default;

  const id = beastId.toLowerCase().trim();

  if (BEAST_VOICE_PROFILES[id]) {
    return BEAST_VOICE_PROFILES[id];
  }

  const aliases = {
    '刑天': 'xingtian',
    '烛龙': 'zhulong',
    '帝江': 'dijiang',
    '九尾狐': 'jiuweihu',
    '九尾': 'jiuweihu',
    '白泽': 'baize',
    '饕餮': 'taotie',
    '穷奇': 'qiongqi',
    '混沌': 'hundun',
    '麒麟': 'qilin',
    '凤凰': 'fenghuang',
    '应龙': 'yinglong',
    '玄武': 'xuanwu',
    '青龙': 'qinglong',
    '白虎': 'baihu',
    '朱雀': 'zhuque'
  };

  const mapped = aliases[id];
  if (mapped && BEAST_VOICE_PROFILES[mapped]) {
    return BEAST_VOICE_PROFILES[mapped];
  }

  return BEAST_VOICE_PROFILES.default;
}

/**
 * 从story-plan生成悬念钩子
 * @param {string} beastId - 神兽ID
 * @param {Object} storyPlan - 故事计划
 * @returns {string} - 悬念钩子
 */
function generateSuspenseHook(beastId, storyPlan) {
  const profile = getVoiceProfile(beastId);
  const template = profile.suspenseHookTemplate;

  // 从story-plan提取关键元素
  const title = storyPlan?.title || '';
  const outline = storyPlan?.outline || storyPlan?.description || '';
  const conflict = storyPlan?.coreConflict || storyPlan?.conflict || '';
  const theme = storyPlan?.theme || '';

  // 提取核心矛盾关键词
  let extracted = '';

  // 基于神兽类型和故事内容生成
  switch(beastId) {
    case 'xingtian':
      extracted = conflict || theme || outline;
      if (extracted.includes('孩') || extracted.includes('小G') || extracted.includes('好奇')) {
        return template.replace('{conflict}', '一个孩子的好奇心');
      }
      if (extracted.includes('战') || extracted.includes('魂') || extracted.includes('锋芒')) {
        return template.replace('{conflict}', '远古战意的回响');
      }
      if (extracted.includes('传') || extracted.includes('承')) {
        return template.replace('{conflict}', '一把未完成的传承');
      }
      return template.replace('{conflict}', '沉睡三千年的锋芒');

    case 'zhulong':
      extracted = conflict || theme || outline;
      if (extracted.includes('光') || extracted.includes('昼') || extracted.includes('夜')) {
        return template.replace('{secret}', '光芒之下的真相');
      }
      if (extracted.includes('渊') || extracted.includes('深') || extracted.includes('底')) {
        return template.replace('{secret}', '深渊中的秘密');
      }
      if (extracted.includes('火') || extracted.includes('焰')) {
        return template.replace('{secret}', '火焰尽头之物');
      }
      return template.replace('{secret}', '秘密');

    case 'dijiang':
      extracted = conflict || theme || outline;
      if (extracted.includes('间') || extracted.includes('时') || extracted.includes('流逝')) {
        return template.replace('{concept}', '时间').replace('{event}', '故事');
      }
      if (extracted.includes('空') || extracted.includes('间') || extracted.includes('维度')) {
        return template.replace('{concept}', '空间').replace('{event}', '真相');
      }
      if (extracted.includes('混') || extracted.includes('沌') || extracted.includes('秩序')) {
        return template.replace('{concept}', '混沌').replace('{event}', '启示');
      }
      return template.replace('{concept}', '时间').replace('{event}', '故事');

    case 'jiuweihu':
      extracted = conflict || theme || outline;
      if (extracted.includes('境') || extracted.includes('幻') || extracted.includes('梦')) {
        return template.replace('{subject}', '一条尾巴').replace('{mystery}', '幻境');
      }
      if (extracted.includes('智') || extracted.includes('慧') || extracted.includes('谜')) {
        return template.replace('{subject}', '一道智慧').replace('{mystery}', '谜题');
      }
      if (extracted.includes('骗') || extracted.includes('局') || extracted.includes('真')) {
        return template.replace('{subject}', '一个真相').replace('{mystery}', '骗局');
      }
      return template.replace('{subject}', '一条尾巴').replace('{mystery}', '幻境');

    case 'baize':
      extracted = conflict || theme || outline;
      if (extracted.includes('知') || extracted.includes('识') || extracted.includes('尽头')) {
        return template.replace('{question}', '知识是否有尽头？');
      }
      if (extracted.includes('真') || extracted.includes('相') || extracted.includes('值得')) {
        return template.replace('{question}', '真相是否值得被知晓？');
      }
      if (extracted.includes('答') || extracted.includes('案') || extracted.includes('问题')) {
        return template.replace('{question}', '有些问题是否不该有答案？');
      }
      return profile.defaultSuspenseHook;

    case 'taotie':
      extracted = conflict || theme || outline;
      if (extracted.includes('孩') || extracted.includes('小G') || extracted.includes('小')) {
        return template.replace('{target}', '不知死活的小东西');
      }
      if (extracted.includes('食') || extracted.includes('吞') || extracted.includes('猎')) {
        return template.replace('{target}', '胆大包天的猎物');
      }
      if (extracted.includes('勇') || extracted.includes('敢') || extracted.includes('闯')) {
        return template.replace('{target}', '勇敢到愚蠢的挑战者');
      }
      return template.replace('{target}', '意外闯入者');

    default:
      return profile.defaultSuspenseHook;
  }
}

/**
 * 生成完整的片头声音层Prompt（中英文双语）
 * @param {string} beastId - 神兽ID
 * @param {Object} storyPlan - 故事计划（可选，用于生成悬念钩子）
 * @returns {Object} - {chinese, english, full}
 */
function generateTitleAudioLayer(beastId, storyPlan) {
  const profile = getVoiceProfile(beastId);

  // 🆕 v3.2-Peng: 从story-plan生成悬念钩子
  const suspenseHook = storyPlan ? generateSuspenseHook(beastId, storyPlan) : profile.defaultSuspenseHook;
  const suspenseHookEn = profile.defaultSuspenseHookEn;

  // 完整台词 = 固定锚点 + 悬念钩子（v2.16-Peng: 默认使用英文版本，好莱坞大片风格）
  const fullLine = profile.fixedAnchor + ' ' + suspenseHook;
  const fullLineEn = profile.fixedAnchorEn + ' ' + suspenseHookEn;

  // 中文声音描述
  const chineseVoiceDesc = `
【声音层 — ${profile.name}开场白】
声音出现时机：0秒（先声夺人，画面尚未出现声音先开始）
声音来源：${profile.voiceDesign.space}
音色特征：${profile.voiceDesign.timbre}
语速节奏：${profile.voiceDesign.pace}
情绪色彩：${profile.voiceDesign.emotion}
固定锚点（统一品牌）："${profile.fixedAnchor}"
悬念钩子（本集专属）："${suspenseHook}"
完整台词："${fullLine}"
声音与画面关系：画面开始是一片黑暗，只有声音在虚空中回荡。随着声音继续，Nirath场景开始从黑暗中缓缓渐显。观众先被声音吸引，然后才看到画面，胃口被吊足。声音不是画外音，而是Nirath环境本身在震动——磁场、光脉、能量场共同共振形成的声音现象。
尾音消散：${SFX_DESCRIPTIONS[beastId] || SFX_DESCRIPTIONS.default}
`;

  // 英文声音描述
  const englishVoiceDesc = `
[Audio Layer — ${profile.nameEn} Opening Narration]
Timing: 0 seconds (voice first, screen still dark, hooking audience before visuals)
Voice Source: ${profile.voiceDesign.spaceEn}
Timbre: ${profile.voiceDesign.timbreEn}
Pace: ${profile.voiceDesign.paceEn}
Emotion: ${profile.voiceDesign.emotionEn}
Fixed Anchor (Brand Identity): "${profile.fixedAnchorEn}"
Suspense Hook (Episode Specific): "${suspenseHookEn}"
Full Dialogue: "${fullLineEn}"
Sound-Visual Relationship: Screen starts completely dark, only voice echoes in void. As voice continues, Nirath scene gradually emerges from darkness. Audience is hooked by sound first, then sees visuals. Not voice-over but Nirath environment/energy field/bio-resonance naturally producing sound. Fixed anchor establishes consistent brand expectation, suspense hook creates unique episode anticipation.
Tail fade: ${SFX_DESCRIPTIONS[beastId] || SFX_DESCRIPTIONS.default}
`;

  return {
    chinese: chineseVoiceDesc,
    english: englishVoiceDesc,
    full: chineseVoiceDesc + '\n' + englishVoiceDesc,
    metadata: {
      beastName: profile.nameEn,  // v2.16-Peng: 默认返回英文名称，好莱坞大片风格
      beastNameCn: profile.name,  // 保留中文名称备用
      fixedAnchor: profile.fixedAnchorEn,  // v2.16-Peng: 英文固定锚点
      fixedAnchorCn: profile.fixedAnchor,   // 保留中文备用
      suspenseHook: suspenseHookEn,        // v2.16-Peng: 英文悬念钩子
      suspenseHookCn: suspenseHook,         // 保留中文备用
      fullLine: fullLineEn,                // v2.16-Peng: 英文完整台词
      fullLineCn: fullLine,                 // 保留中文备用
      triggerPoint: '0 seconds (voice first, screen still dark)',
      triggerPointCn: '0秒（先声夺人）',
      estimatedDuration: estimateDuration(fullLineEn, profile.voiceDesign.paceEn),
      humanReference: profile.voiceDesign.humanReference,
      isAutoGenerated: !!storyPlan
    }
  };
}

/**
 * 生成Seedance Prompt声音描述段落（英文版 — v2.16-Peng 好莱坞大片风格）
 * @param {string} beastId - 神兽ID
 * @param {string} suspenseHook - 悬念钩子英文版（可选）
 * @returns {string} - 可直接插入Seedance Prompt的英文声音描述
 */
function generateSeedanceVoicePrompt(beastId, suspenseHook) {
  const profile = getVoiceProfile(beastId);
  const sfx = SFX_DESCRIPTIONS[beastId] || SFX_DESCRIPTIONS.default;
  const hook = suspenseHook || profile.defaultSuspenseHookEn;  // v2.16-Peng: 默认使用英文悬念钩子

  // v2.16-Peng: 使用英文版promptTemplate（直接构建，避免中文模板）
  const prompt = `The screen begins in complete darkness, only ${profile.voiceDesign.timbreEn} echoes in the void. The voice ${profile.voiceDesign.spaceEn}, delivering the fixed anchor: "${profile.fixedAnchorEn}" followed by the suspense hook: "${hook}" As the voice continues, the Nirath scene gradually emerges from darkness -- first faint bioluminescent moss glimmers, then floating crystal formations silhouette, finally the entire ecosystem fully reveals. The main title fully presents when the voice reaches mid-point. Sound-visual relationship: not voice-over but Nirath environment itself vibrating -- rocks, magnetic fields, energy fields resonating together to produce sound. Audience is hooked by sound first, then sees visuals, appetite fully teased. Fixed anchor establishes consistent brand expectation, suspense hook creates unique episode anticipation. Voice tail carries ${sfx}.`;

  return prompt;
}

/**
 * 估算台词时长
 * @param {string} text - 台词文本
 * @param {string} paceDesc - 语速描述
 * @returns {number} - 预估秒数
 */
function estimateDuration(text, paceDesc) {
  const charCount = text.length;
  
  // 🆕 v3.3-Peng-fix2: 计算标点停顿（逗号/句号/破折号增加额外停顿时间）
  const punctuationMatches = text.match(/[，。！？、；：""''（）【】\-—……]/g) || [];
  const pauseTime = punctuationMatches.length * 0.3; // 每个标点增加0.3秒停顿

  if (paceDesc.includes('极慢') || paceDesc.includes('extremely slow')) {
    return (charCount * 0.8) + pauseTime;
  } else if (paceDesc.includes('缓慢') || paceDesc.includes('slow')) {
    return (charCount * 0.5) + pauseTime;
  } else if (paceDesc.includes('快') || paceDesc.includes('fast')) {
    return (charCount * 0.2) + pauseTime;
  } else {
    return (charCount * 0.3) + pauseTime;
  }
}

/**
 * 获取所有支持的神兽音色
 * @returns {Array} - 神兽列表
 */
function getSupportedBeasts() {
  return Object.entries(BEAST_VOICE_PROFILES)
    .filter(([key]) => key !== 'default')
    .map(([key, profile]) => ({
      id: key,
      name: profile.name,
      nameEn: profile.nameEn,
      emotionTone: profile.voiceDesign.emotion
    }));
}

module.exports = {
  BEAST_VOICE_PROFILES,
  getVoiceProfile,
  generateSuspenseHook,
  generateSeedanceVoicePrompt,
  generateTitleAudioLayer,
  estimateDuration,
  getSupportedBeasts
};