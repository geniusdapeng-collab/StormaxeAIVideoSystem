/**
 * 山海经系列 FPV 灵魂生成器 v1.0-Peng
 * 
 * 基于15个标杆案例的底层方法论，为山海经神话系列建立专属的FPV生成策略。
 * 设计原则：不直接套用模板，而是提取设计逻辑，根据片子主题综合产出。
 */

// ============ 山海经专属场景元素映射库 ============
const SHANHAI_ELEMENT_MAP = {
  // 白泽专属映射
  baize: {
    elements: [
      { name: '银白毛发', macro: '银白森林/光之草原', visual: '每一根毛发如发光光纤，在鱼眼镜头下弯曲成巨树', interaction: '穿梭其中' },
      { name: '身体轮廓', macro: '山脉/丘陵', visual: '身体曲线如起伏山脊，皮肤纹理如大地龟裂', interaction: '仰望/环绕' },
      { name: '眼睛', macro: '巨大湖泊/发光深渊', visual: '瞳孔如深邃湖泊，眼白如月光云海', interaction: '俯冲向眼睛' },
      { name: '符文', macro: '发光峡谷/神秘图腾', visual: '皮肤上的古老符文在运动中闪烁，如星图流转', interaction: '擦边掠过' },
      { name: '呼吸', macro: '风暴气流/云雾涌动', visual: '每次呼吸产生可见的气流漩涡，卷动周围尘埃', interaction: '被气流吹动' },
      { name: '低鸣', macro: '空气共振/低频震动', visual: '声音可视化——空气产生涟漪般波纹', interaction: '穿越波纹' },
      { name: '角/冠', macro: '发光建筑/神性图腾', visual: '角上缠绕着光脉，如微型星云旋转', interaction: '仰望旋转' },
      { name: '尾巴', macro: '流动的光河', visual: '尾巴摆动拖曳出光粒子轨迹，如银河倾泻', interaction: '跟随光河' }
    ],
    mood: '智慧/威严/神圣',
    pacing: 'divine_revelation' // 神威降临型
  },
  
  // 烛龙专属映射
  zhulong: {
    elements: [
      { name: '龙鳞', macro: '赤金山脉/熔岩峡谷', visual: '每片鳞甲如燃烧的山岩，缝隙中流淌熔岩', interaction: '贴近飞行' },
      { name: '龙目', macro: '烈日/燃烧深渊', visual: '睁眼时如烈日升起，闭眼时如夜幕降临', interaction: '直视' },
      { name: '龙息', macro: '火焰风暴', visual: '吐息时形成火焰龙卷风，空气燃烧扭曲', interaction: '穿越火焰' },
      { name: '龙须', macro: '闪电触须', visual: '龙须飘动带起电弧，如无数闪电鞭挞天空', interaction: '从下方穿过' },
      { name: '龙爪', macro: '五指山/天柱', visual: '龙爪抓握大地，指缝间岩浆喷涌', interaction: '环绕爪指' }
    ],
    mood: '暴烈/毁灭/创世',
    pacing: 'beast_awakening' // 凶兽觉醒型
  },
  
  // 帝江专属映射
  dijiang: {
    elements: [
      { name: '混沌身躯', macro: '活体星云', visual: '身体如不断变换色彩的星云，边界模糊', interaction: '环绕飞行' },
      { name: '无面之脸', macro: '虚空深渊', visual: '面部是一片深邃的虚空，偶尔闪现符文', interaction: '逼近凝视' },
      { name: '六足四翼', macro: '扭曲的时空结构', visual: '翅膀拍动时空间产生涟漪', interaction: '从翼下穿过' },
      { name: '歌舞', macro: '声波可视化', visual: '歌舞时空气产生彩色波纹', interaction: '在波纹中穿行' }
    ],
    mood: '神秘/混沌/远古',
    pacing: 'mystery_discovery' // 探秘发现型
  },
  
  // 通用山海经映射（适用于所有异兽）
  universal: {
    elements: [
      { name: '灵气/云雾', macro: '能量海洋', visual: '地面弥漫的灵气如发光的雾气海洋', interaction: '低空穿行' },
      { name: '古老符文', macro: '发光峡谷/星图', visual: '符文在运动中闪烁，如星图流转', interaction: '擦边掠过' },
      { name: '异兽血液', macro: '熔岩河流', visual: '战斗时血液如熔岩流淌', interaction: '贴近飞行' },
      { name: '山海边界', macro: '结界/屏障', visual: '山海结界如半透明光幕', interaction: '撞击穿越' }
    ]
  }
};

// ============ 山海经专属节奏五段式变体 ============
const PACING_VARIANTS = {
  divine_revelation: {
    name: '神威降临型',
    stages: [
      { time: '0-2s', emotion: '好奇', action: '小G在山林中行走，镜头平稳跟随', lighting: '自然光，暖色调' },
      { time: '2-4s', emotion: '疑惑', action: '前方出现异象，光芒渐显', lighting: '光芒渐强，冷色调介入' },
      { time: '4-6s', emotion: '敬畏→恐惧', action: '神兽身形显现，镜头开始震颤', lighting: '体积光爆发，阴影吞噬' },
      { time: '6-8s', emotion: '震撼', action: '神兽睁眼/低鸣，镜头被冲击剧烈翻滚', lighting: '强光爆发，符文全亮' },
      { time: '8-10s', emotion: '臣服', action: '小G跪倒/仰望，镜头俯冲向神兽眼睛', lighting: '瞳孔深渊，戛然而止' }
    ]
  },
  
  beast_awakening: {
    name: '凶兽觉醒型',
    stages: [
      { time: '0-2s', emotion: '平静', action: '沉睡中的神兽，环境宁静', lighting: '暗调，微弱呼吸光' },
      { time: '2-4s', emotion: '异动', action: '地面震动，神兽身体开始起伏', lighting: '红光从缝隙渗出' },
      { time: '4-6s', emotion: '暴怒', action: '神兽猛然睁眼，仰天咆哮', lighting: '火光冲天，阴影撕裂' },
      { time: '6-8s', emotion: '毁灭', action: '毁灭性能量释放，镜头在冲击波中翻滚', lighting: '爆炸强光，热浪扭曲' },
      { time: '8-10s', emotion: '吞噬', action: '神兽吞噬一切，在混沌中结束', lighting: '黑暗吞没，余烬闪烁' }
    ]
  },
  
  mystery_discovery: {
    name: '探秘发现型',
    stages: [
      { time: '0-2s', emotion: '探索', action: '小G在迷雾中探索，镜头谨慎推进', lighting: '迷雾散射光，低对比度' },
      { time: '2-4s', emotion: '迷失', action: '进入迷宫般的环境，空间扭曲', lighting: '幻彩折射，方向感丧失' },
      { time: '4-6s', emotion: '发现', action: '透过迷雾看到巨大轮廓', lighting: '轮廓光渐显，神秘冷光' },
      { time: '6-8s', emotion: '震撼', action: '全貌显现，镜头因震撼而颤抖', lighting: '全面照亮，色彩爆发' },
      { time: '8-10s', emotion: '归隐', action: '神兽隐入云雾，镜头怅然若失', lighting: '光芒渐收，回归宁静' }
    ]
  },
  
  battle_confrontation: {
    name: '战斗对决型',
    stages: [
      { time: '0-2s', emotion: '对峙', action: '双方对峙，镜头在两者之间快速切换', lighting: '高对比，红蓝对撞' },
      { time: '2-4s', emotion: '试探', action: '第一次交锋，快速闪避', lighting: '闪电般的光影交错' },
      { time: '4-6s', emotion: '爆发', action: '正面冲突，能量碰撞', lighting: '爆炸光芒，冲击波扩散' },
      { time: '6-8s', emotion: '高潮', action: '终极招式释放，天地变色', lighting: '极致强光，色彩饱和' },
      { time: '8-10s', emotion: '胜负', action: '一方倒下/退去，镜头跟随胜者', lighting: '胜光/败影' }
    ]
  },
  
  healing_bond: {
    name: '治愈共生型',
    stages: [
      { time: '0-2s', emotion: '孤独', action: '小G独自在荒野，镜头缓慢漂移', lighting: '冷调，空旷感' },
      { time: '2-4s', emotion: '相遇', action: '与幼兽/温和神兽初次相遇', lighting: '暖光渐显，柔和过渡' },
      { time: '4-6s', emotion: '互动', action: '互相试探，逐渐靠近', lighting: '双向光源，交汇融合' },
      { time: '6-8s', emotion: '信任', action: '亲密接触，能量共鸣', lighting: '同频发光，色彩同步' },
      { time: '8-10s', emotion: '依偎', action: '小G依偎在神兽身旁，镜头缓缓拉远', lighting: '温馨暖光，渐行渐远' }
    ]
  }
};

// ============ 山海经专属技法库 ============
const SHANHAI_TECHNIQUES = {
  divine_tremor: {
    name: '神威震颤',
    source: '01狂暴蚂蚁（高频颤动）',
    description: '镜头因神兽气场产生非物理性震颤，频率随威压升级',
    prompt: '镜头因神兽威压产生非物理性高频震颤，频率随气场强度升级'
  },
  
  aura_water_transition: {
    name: '灵气入水转场',
    source: '02精灵乐园（入水转场）',
    description: '撞破灵气水面→水下慢速梦幻世界',
    prompt: '撞破灵气水面，瞬间坠入水下慢速梦幻世界，气泡上升，光线折射'
  },
  
  rune_overexposure: {
    name: '符文过曝转场',
    source: '08苍蝇出行（光线过曝）',
    description: '穿越符文屏障/进入神域',
    prompt: '强光涌入镜头，画面剧烈过曝后迅速恢复，标志进入神域'
  },
  
  realm_shift: {
    name: '洪荒空间跃迁',
    source: '09万物悬浮（空间跃迁）',
    description: '撞击山海结界→瞬间切换空间',
    prompt: '撞击山海结界，空间瞬间扭曲切换，进入洞天福地'
  },
  
  chaos_glitch: {
    name: '混沌噪点黑屏',
    source: '09万物悬浮（数码黑屏）',
    description: '混沌侵蚀/时空断裂',
    prompt: '撞向混沌能量，画面在触碰瞬间进入噪点黑屏'
  },
  
  divine_barrel_roll: {
    name: '神威桶滚',
    source: '12逃离博物馆（桶滚）',
    description: '被异兽气息冲击翻滚',
    prompt: '镜头进行180度高速横滚（Barrel Roll），视觉中心锁定异兽'
  },
  
  weightless_flip: {
    name: '失重翻转',
    source: '12逃离博物馆（失重翻转）',
    description: '进入仙山/悬浮洞天',
    prompt: '重力瞬间消失，FPV镜头在虚空中划出疯狂弧线'
  },
  
  light_devour: {
    name: '光芒吞没',
    source: '06海啸（光芒吞没）',
    description: '异兽能量爆发/神光降临',
    prompt: '能量光芒迅速吞没画面，形成强烈光爆，在光之内部结束'
  },
  
  progressive_reveal: {
    name: '渐进揭秘',
    source: '05陨石坠冰（渐进揭秘）',
    description: '层层深入后发现异兽真身',
    prompt: '从光芒→毛发→眼睛→全身，层层深入后揭示异兽全貌'
  },
  
  speed_variation: {
    name: '变速处理',
    source: '09/15（升格+加速）',
    description: '异兽细节展示（鳞片/符文）',
    prompt: '常速→120fps升格展示鳞片纹理→猛然加速冲向后厨'
  },
  
  dolly_zoom_pressure: {
    name: '希区柯克威压',
    source: '15尿不湿车神',
    description: '异兽威压逼近',
    prompt: '异兽逼近时产生希区柯克变焦（Dolly Zoom），背景缩放产生空间挤压感'
  },
  
  sudden_awakening: {
    name: '突发事件',
    source: '02精灵乐园',
    description: '异兽突然睁眼/展翅',
    prompt: '异兽突然睁眼/展翅，打破原有节奏，制造意外紧张感'
  },
  
  disaster_chain: {
    name: '灾难连锁',
    source: '02/04/13',
    description: '异兽行动引发天地异变',
    prompt: '一吼→山崩→云卷→电闪，连续破坏反应链'
  },
  
  tyndall_effect: {
    name: '丁达尔神光',
    source: '01狂暴蚂蚁',
    description: '光芒穿透异兽毛发/云雾',
    prompt: '光线透过异兽毛发缝隙形成巨大光柱（丁达尔效应）'
  },
  
  rim_silhouette: {
    name: '轮廓神光',
    source: '01/05/10',
    description: '黑暗中异兽轮廓显现',
    prompt: '微弱侧光勾勒异兽轮廓，如剪影般显现神性'
  },
  
  heat_distortion: {
    name: '热浪扭曲',
    source: '04/05',
    description: '异兽能量释放/火焰',
    prompt: '空气因异兽能量产生折射扭曲，如热浪般波动'
  }
};

// ============ FPV Prompt生成器 ============

/**
 * 根据片子主题综合生成FPV一镜到底镜头
 * @param {Object} params - 生成参数
 * @param {string} params.beastType - 异兽类型 (baize/zhulong/dijiang/...)
 * @param {string} params.pacingType - 节奏变体 (divine_revelation/beast_awakening/...)
 * @param {string} params.sceneDesc - 场景描述
 * @param {Array} params.techniques - 选择的技法ID数组
 * @param {string} params.promptStyle - 提示词风格 (narrative/structured/minimal)
 * @returns {Object} 生成的FPV方案
 */
function generateShanhaiFPV(params) {
  const { beastType, pacingType, sceneDesc, techniques = [], promptStyle = 'narrative' } = params;
  
  // 1. 获取异兽映射
  const beastMap = SHANHAI_ELEMENT_MAP[beastType] || SHANHAI_ELEMENT_MAP.universal;
  const pacing = PACING_VARIANTS[pacingType] || PACING_VARIANTS.divine_revelation;
  
  // 2. 选择技法
  const selectedTechniques = techniques.length > 0 
    ? techniques.map(tid => SHANHAI_TECHNIQUES[tid]).filter(Boolean)
    : autoSelectTechniques(beastType, pacingType);
  
  // 3. 生成Prompt
  let prompt;
  switch (promptStyle) {
    case 'structured':
      prompt = generateStructuredPrompt(beastMap, pacing, selectedTechniques, sceneDesc);
      break;
    case 'minimal':
      prompt = generateMinimalPrompt(beastMap, pacing, selectedTechniques, sceneDesc);
      break;
    case 'narrative':
    default:
      prompt = generateNarrativePrompt(beastMap, pacing, selectedTechniques, sceneDesc);
  }
  
  // 4. 注入山海经专属修饰
  prompt = injectShanhaiModifiers(prompt, beastType);
  
  // 5. 控制长度在490字以内
  if (prompt.length > 490) {
    prompt = prompt.substring(0, 487) + '...';
  }
  
  return {
    prompt,
    beastType,
    pacingType,
    pacingName: pacing.name,
    techniques: selectedTechniques.map(t => ({ id: t.name, ...t })),
    elementMap: beastMap.elements,
    stages: pacing.stages,
    style: promptStyle
  };
}

/**
 * 自动选择技法（根据异兽类型和节奏变体）
 */
function autoSelectTechniques(beastType, pacingType) {
  const defaults = {
    baize: ['progressive_reveal', 'divine_tremor', 'light_devour', 'tyndall_effect'],
    zhulong: ['sudden_awakening', 'divine_barrel_roll', 'heat_distortion', 'disaster_chain'],
    dijiang: ['progressive_reveal', 'realm_shift', 'rim_silhouette', 'aura_water_transition'],
    default: ['progressive_reveal', 'divine_tremor', 'light_devour']
  };
  
  const techniqueIds = defaults[beastType] || defaults.default;
  return techniqueIds.map(tid => SHANHAI_TECHNIQUES[tid]).filter(Boolean);
}

/**
 * 生成叙事长文本Prompt（默认风格）
 */
function generateNarrativePrompt(beastMap, pacing, techniques, sceneDesc) {
  const beastName = beastMap.elements[0]?.name.split('/')[0] || '神兽';
  const stages = pacing.stages;
  
  let prompt = `一段10秒钟、超电影感、超写实的8岁男孩第一人称视角（POV）。小G正处于${sceneDesc || '山海经洪荒世界'}中，采用单一连续镜头拍摄。整体为FPV穿越机风格，但带有神兽威压产生的非物理性震颤。使用8mm超广角鱼眼镜头，产生强烈边缘畸变、暗角与灵气色散。\n\n`;
  
  // 五段式叙事
  prompt += `视频以${stages[0].emotion}开启。${stages[0].action}，镜头${stages[0].time.includes('0') ? '平稳跟随' : '剧烈震颤'}。${stages[0].lighting}。\n\n`;
  
  prompt += `镜头开始震颤，${beastName}的身形从光芒中渐显。`;
  
  // 添加元素映射
  beastMap.elements.slice(0, 3).forEach((el, i) => {
    prompt += `${el.name}如${el.macro}般覆盖视野，${el.visual}。`;
    if (i < 2) prompt += ' ';
  });
  
  prompt += `\n\n${beastName}缓缓低头，巨大的特征在镜头前显现。`;
  
  // 添加技法
  techniques.forEach(tech => {
    prompt += `${tech.prompt}。`;
  });
  
  prompt += `\n\n画面在${stages[4].emotion}中戛然而止，仿佛小G的灵魂被吸入这洪荒之海。\n\n`;
  
  // 音效
  prompt += `音效：完全采用同步环境音（Diegetic）。洪荒风声、灵气涌动声、神兽呼吸的低频震动、符文共振的清脆共鸣。无音乐。无旁白。无文字。超写实洪荒电影感。`;
  
  return prompt;
}

/**
 * 生成结构化参数Prompt
 */
function generateStructuredPrompt(beastMap, pacing, techniques, sceneDesc) {
  const beastName = beastMap.elements[0]?.name.split('/')[0] || '神兽';
  
  return `1. 摄影机与光学设定 (Cinematography & Optics)
极限FPV第一人称视角。采用8mm极度畸变鱼眼微距镜头，产生夸张的桶形畸变。画面中心保持锐利，边缘被大幅度拉伸扭曲。镜头动态模拟神兽威压下的非稳态运动，包含剧烈的轴向翻转和受迫性高频震动。
光学特效：强烈的向心动态模糊，灵气色散，暗角。

2. 运动动力学 (Motion Dynamics)
FPV超高速运镜，完全剥离慢动作。视频以瞬间的${pacing.stages[0].emotion}开启，小G在洪荒世界中穿行。
变速控制：${techniques.find(t => t.name === '变速处理') ? '在展示神兽细节时进入120fps升格，随后猛然加速。' : '保持高速运动，不减速。'}
空间跃迁：连续镜头，严禁跳切。

3. 环境与物理交互 (Environment & Physics)
${sceneDesc || '山海经洪荒世界'}：
${beastMap.elements.map(e => `- ${e.name}：${e.visual}，${e.interaction}`).join('\n')}
物理特效：神兽气息产生的气流漩涡、符文闪烁的能量波动、灵气翻涌的物理模拟。

4. 灯光与材质 (Lighting & Material)
${pacing.stages.map(s => `${s.time}：${s.lighting}`).join('\n')}
材质表现：神兽鳞甲/毛发的质感、符文的金属光泽、灵气的半透明质感。

5. 感官与情绪 (Sensory & Mood)
完全采用同步环境音（Diegetic）。神兽呼吸的低频震动、符文共振、灵气涌动声、洪荒风声。无音乐。无旁白。
情绪弧线：${pacing.stages.map(s => `${s.time} ${s.emotion}`).join(' → ')}`;
}

/**
 * 生成极简关键词Prompt
 */
function generateMinimalPrompt(beastMap, pacing, techniques, sceneDesc) {
  const beastName = beastMap.elements[0]?.name.split('/')[0] || '神兽';
  const techNames = techniques.map(t => t.name).join('，');
  
  return `极速FPV不稳定镜头运动，POV视角，8mm鱼眼广角，一镜到底。${sceneDesc || '山海经洪荒世界'}。
小G第一人称，8岁男孩眼高。${beastName}神威降临，${techNames}。
神兽威压震颤，灵气翻涌，符文闪烁。超写实洪荒电影感。`;
}

/**
 * 注入山海经专属修饰
 */
function injectShanhaiModifiers(prompt, beastType) {
  const modifiers = {
    baize: '智慧神兽，银白光芒，通晓万物，祥瑞之兆',
    zhulong: '创世烛龙，赤金烈焰，睁眼为昼，闭眼为夜',
    dijiang: '混沌帝江，无面无耳，歌舞通明，远古之迷',
    default: '山海经异兽，洪荒气韵，神话再现'
  };
  
  const modifier = modifiers[beastType] || modifiers.default;
  
  // 在prompt中注入修饰（在开头或适当位置）
  if (prompt.includes('8岁男孩第一人称视角')) {
    prompt = prompt.replace('8岁男孩第一人称视角（POV）', `8岁男孩第一人称视角（POV），${modifier}`);
  }
  
  return prompt;
}

// ============ 导出 ============
module.exports = {
  generateShanhaiFPV,
  autoSelectTechniques,
  SHANHAI_ELEMENT_MAP,
  PACING_VARIANTS,
  SHANHAI_TECHNIQUES
};