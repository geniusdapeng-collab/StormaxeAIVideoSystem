/**
 * 开场标题设计师 - Opening Title Designer v1.4-Peng
 * 
 * Nirath世界观开场标题融入系统
 * 核心原则：
 * 1. ❌ 禁止任何中国文化传统元素（八卦、风水、阴阳、符文、篆刻、印章、毛笔、卷轴等）
 * 2. ✅ 所有标题融入必须是Nirath星球的自然/生物/地质现象
 * 3. ✅ 标题是场景的一部分，不是后期叠加的文字层
 * 4. ✅ 副标题（by Genius）必须以Nirath环境细节自然呈现
 * 5. 🆕 v1.3-Peng: 片头异兽首次出场必须是大场面、铺满全屏、震撼视听
 * 
 * v1.4-Peng 更新（2026-05-27）：
 * - 标题和出品人全面英文化：主标题英文映射、副标题固定为 "by Genius"
 * - 标题显示指令从中文改为英文，好莱坞大片风格
 * - 中文引号「」全部替换为英文引号"
 * 
 * v1.3-Peng 更新（2026-05-26）：
 * - 新增片头异兽大场面出场规范：全屏铺满、震撼音效、先声夺人
 * - 所有片头模板强制升级为大全景/史诗景别
 * - 异兽出场占据画面50%以上空间
 * - 声音层：先声夺人 + 震撼低音/低频轰鸣
 * 
 * v1.1-Peng 更新（2026-05-24）：
 * - 移除所有中国风元素（篆刻/印章/毛笔/卷轴/符文/水墨）
 * - 副标题样式改为Nirath自然/科技风格
 * - 异兽显化模板根据具体能力定制（火焰/冰晶/雷电/鳞粉等）
 * - 增加地质纹理、生物荧光、能量场等Nirath专属融入方式
 */

const fs = require('fs');
const path = require('path');

// 🆕 v4.0-Peng: 导入三个创意动效Agent
const TitleEffectDesigner = require('./opening-title-effect-designer');
const BeastEntranceDesigner = require('./beast-entrance-designer');
const XiaoGEntranceDesigner = require('./xiaoG-entrance-designer');
// 🆕 v4.1-Peng: 导入结构校验器
const OpeningTitleValidator = require('./opening-title-validator');

/**
 * 标题融入模板库
 * 每种模板都是一个完整的场景描述生成器
 */
const TITLE_TEMPLATES = {
  /**
   * 模板1: 山崖纹理
   * 主题名以Nirath地质纹理形式呈现在岩壁上（自然风化纹理，非人工雕刻）
   * 适合：史诗感、终极觉醒主题
   * 
   * 设计要点：
   * - 不是"刻字"或"符文"，而是岩层自然风化形成的纹理恰好组成字形
   * - 双日暮光照射使纹理形成明暗对比，恰好可读
   * - 副标题以苔藓/地衣/矿物结晶等自然细节呈现
   */
  mountain_carving: {
    id: 'mountain_carving',
    name: '山崖纹理',
    nameEn: 'Mountain Texture',
    description: '主题名以Nirath山脉岩层自然风化纹理的形式呈现，非人工雕刻',
    promptBuilder: (title, subtitle, theme, beastId) => {
      const nirathElements = _getNirathElements(theme, beastId);
      return {
        scene: `Nirath断裂山脉绝壁，亿万年的地质断层形成天然纹理，双日暮光将岩壁染成紫金色与琥珀橙的渐层。粗糙多孔的火山岩表面，深层风化裂缝纵横交错如老人皱纹，铁氧化物沉积形成赭红色矿脉纹理沿岩壁蜿蜒，玄武岩柱状节理清晰可见呈六边形垂直排列，冰劈作用形成的尖锐棱角与崩裂碎石散布坡面，沉积层理在流水侵蚀作用下裸露分层，岩缝间生长着蓝绿色地衣与灰白微型苔藓，碎石坡与崩积物散落山脚形成自然颗粒过渡带，岩石表面绝非光滑塑料质感而是天然粗糙的矿物基质，斜射光在凹凸表面形成深邃阴影池与高光脊对比强烈`,
        title: `岩壁天然风化纹理在双日斜射光线下形成明暗阴影，恰好构成"${title}"的字形轮廓——这不是雕刻，而是地质运动和风蚀作用亿万年自然形成的巧合纹理，光脉矿脉的走向恰好勾勒笔画，${nirathElements.lighting}`,
        subtitle: `岩壁底部一片蓝绿色地衣（类视紫红质共生苔藓）自然生长，其蔓延边界恰好形成"${subtitle}"的轮廓——如大自然留下的签名`,
        camera: `广角仰拍，镜头从山脚小G的渺小身影缓缓上摇，经过千万丈岩壁，最终定格在天然纹理形成的字形，展示人与地质时间的尺度对比`,
        atmosphere: `地质时间的史诗感，自然巧合的震撼，绝非人工痕迹的原始力量`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '巨物美学 + 地质奇观 + 自然巧合'
      };
    }
  },

  /**
   * 模板2: 异兽显化
   * 异兽的能力自然形成主题名（喷火凝字、甩尾成冰晶、鳞片飞散排列等）
   * 适合：异兽为主角的集
   * 
   * 设计要点：
   * - 根据异兽具体能力定制（火系=火焰凝结、水系=水柱冰晶、雷系=电光残留）
   * - 绝对禁止卷轴、符文、印章等中国文化元素
   * - 副标题以异兽能力残留效果呈现（余烬、冰屑、电荷等）
   */
  beast_manifestation: {
    id: 'beast_manifestation',
    name: '异兽显化',
    nameEn: 'Beast Manifestation',
    description: '异兽的自然能力形成主题名（喷火/甩尾/释放能量等）',
    promptBuilder: (title, subtitle, theme, beastId) => {
      const beast = _getBeastInfo(beastId);
      const manifestation = _getBeastManifestation(beast, title, subtitle);
      return {
        scene: `Nirath原生生态区，${beast.habitat || '双日暮光下的旷野'}`,
        title: manifestation.titleEffect,
        subtitle: manifestation.subtitleEffect,
        camera: `中景跟随，镜头锁定异兽动作，${manifestation.camera}`,
        atmosphere: `${manifestation.atmosphere}，天地为之变色`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '生物能力展示 + 自然物理现象'
      };
    }
  },

  /**
   * 模板3: 探险者之证
   * 小G的探险装备自然呈现主题名（不是投影，是物理/光学现象）
   * 适合：以小G视角展开的叙事
   * 
   * 设计要点：
   * - 不是全息投影/科技界面，而是Nirath环境对装备的自然反应
   * - 例如：指南针玻璃折射双日光形成字形、水壶表面冷凝水珠排列、手电筒光束穿透孢子雾形成光字
   * - 副标题以装备细节自然呈现
   */
  xiaoG_holding: {
    id: 'xiaoG_holding',
    name: '探险者之证',
    nameEn: "Explorer's Token",
    description: '小G探险装备在Nirath环境下自然形成主题名',
    promptBuilder: (title, subtitle, theme, beastId) => {
      const nirathElements = _getNirathElements(theme, beastId);
      return {
        scene: `小G站在Nirath荒野，手中黄铜指南针在双日暮光下反射奇异光芒`,
        title: `指南针玻璃表面因双日特殊光谱折射，在地面投射出扭曲但可辨的光影字形"${title}"——这不是科技投影，而是Nirath双恒星大气散射造成的自然光学现象，光字边缘有虹脉孢子彩虹色散，${nirathElements.lighting}`,
        subtitle: `指南针金属边框的氧化铜绿自然形成斑驳纹理，其分布轮廓恰好如"${subtitle}"的字形——岁月与化学反应留下的签名`,
        camera: `特写镜头从指南针表面缓缓拉远，先见光字投影，再 reveals 小G专注观察的表情，最后缓缓 reveals 身后异兽轮廓`,
        atmosphere: `神秘发现，光学奇景，探险即将开始的悸动，一切都是自然的巧合`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '光学奇观 + 微观自然现象 + 探险发现'
      };
    }
  },

  /**
   * 模板4: 天书显现
   * 双日暮光/云层/能量场在空中形成主题名
   * 适合：大气磅礴、天地异象主题
   * 
   * 设计要点：
   * - 不是"天书"或"神谕"，而是Nirath大气物理现象
   * - 云层光柱、等离子体放电、带电粒子排列等自然/物理现象
   * - 副标题以地面阴影/电荷痕迹等自然呈现
   */
  sky_projection: {
    id: 'sky_projection',
    name: '天象显字',
    nameEn: 'Atmospheric Typography',
    description: 'Nirath天空自然物理现象形成主题名',
    promptBuilder: (title, subtitle, theme, beastId) => {
      const nirathElements = _getNirathElements(theme, beastId);
      return {
        scene: `Nirath双日交叠的黄昏时刻，高层大气因双恒星引力扰动形成罕见的等离子体光带`,
        title: `天空带电粒子云层如幕布般分层，双日光线穿透不同密度的电离层，在地面投射出巨大的光影字"${title}"——这不是神迹，而是Nirath独特双恒星系统造成的大气光学现象，每个字由亿万发光孢子与虹脉孢子粒子共同组成，${nirathElements.lighting}`,
        subtitle: `光影字下方的地面上，因光线角度恰好形成阴影字"${subtitle}"——物理光学留下的自然落款`,
        camera: `从地面仰拍天空，镜头缓慢旋转展示光影字与双日、云层、地形的关系，证明这是自然现象而非人工`,
        atmosphere: `大气物理的震撼，自然巧合的壮美，绝非超自然力量的理性解释`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '大气光学 + 物理现象 + 天地尺度'
      };
    }
  },

  /**
   * 模板5: 光脉拼字 (v2.4-Peng: 从晶簇拼字重构，禁用水晶)
   * 浮空光脉山脉碎片受Nirath磁场/引力影响排列组成主题名
   * 适合：Nirath特色地质奇观
   * 
   * 设计要点：
   * - 不是"晶簇"或"晶体"，而是地质板块碎片+内部光脉网络
   * - 岩石因磁场/引力漂移排列，物理现象
   * - 副标题以脱落碎片的自然分布呈现
   */
  crystal_formation: {
    id: 'crystal_formation',
    name: '光脉拼字',
    nameEn: 'Luminous Vein Formation',
    description: 'Nirath浮空光脉山脉碎片受磁场/引力物理影响排列成主题名',
    promptBuilder: (title, subtitle, theme, beastId) => {
      return {
        scene: `Nirath浮空光脉山脉区域，地壳断裂的岩石板块悬浮空中，内部紫金光脉网络如神经网络分布`,
        title: `岩石板块因Nirath双恒星引力潮汐和地质磁场共同作用缓缓漂移，内部光脉网络因磁场共振亮度变化，板块自然排列组成悬浮的立体字"${title}"——每个笔画都是独立岩石板块，裂缝中渗出紫金色光晕，虹脉孢子因板块移动飘散形成能量尾迹，这是地质+磁场的物理现象，NO crystal NO transparent mineral`,
        subtitle: `板块边缘因碰撞脱落的碎石，受重力缓缓飘落，在地面上自然分布成"${subtitle}"的轮廓——引力与碰撞留下的自然签名`,
        camera: `环绕航拍，镜头围绕光脉字群做螺旋上升，展示三维结构与周围浮空山脉的地质关系`,
        atmosphere: `地质板块的壮美，磁场与岩石的共舞，自然秩序的精密，绝非水晶魔法`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '地质奇观 + 物理现象 + Nirath原生能量体'
      };
    }
  },

  /**
   * 模板6: 水面倒影
   * 流光虹脉河水面因特殊矿物质含量形成主题名
   * 适合：水域主题、镜像对称美学
   * 
   * 设计要点：
   * - 不是"水墨"或"东方美学"，而是Nirath河水矿物质的光学特性
   * - 河水中稀土元素在特定光照下呈现虹彩，恰好形成字形
   * - 副标题以河岸矿物质沉积呈现
   */
  water_reflection: {
    id: 'water_reflection',
    name: '水面显字',
    nameEn: 'Mineral Reflection',
    description: '流光虹脉河水中矿物质光学特性形成主题名',
    promptBuilder: (title, subtitle, theme, beastId) => {
      return {
        scene: `流光虹脉河河畔，河水因富含稀土元素呈现虹彩渐变色，水面如镜般平静`,
        title: `水面因温度梯度形成密度分层，双日光线在不同水层间全反射，恰好构成发光字"${title}"的轮廓——每个笔画都是不同深度的水流层，字体如水中生物般微微摇曳，这是Nirath河水矿物质的光学特性，绝非人工添加`,
        subtitle: `涟漪扩散至岸边，河水退潮后在湿地上留下矿物质沉积痕迹，其分布轮廓恰好如"${subtitle}"——化学反应留下的自然签名`,
        camera: `低角度贴近水面，镜头从水中光字缓缓抬起，reveals 真实天空与水面字的对称关系，证明这是光学现象`,
        atmosphere: `虚实交错的光学奇景，矿物质的化学反应，静谧而理性的壮美`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '光学现象 + 矿物质美学 + 水面镜像'
      };
    }
  },

  /**
   * 模板7: 孢子聚字
   * 漂浮孢子水母受生物电场影响聚集形成发光字体
   * 适合：生态主题、微观巨物美
   * 
   * 设计要点：
   * - 不是"生命智慧"或"群体意识"的神秘主义，而是生物电场的物理现象
   * - 孢子水母带电，在电场中自然排列
   * - 副标题以掉队孢子的自然分布呈现
   */
  spore_lights: {
    id: 'spore_lights',
    name: '孢子聚字',
    nameEn: 'Spore Luminescence',
    description: 'Nirath发光孢子水母受生物电场自然聚集形成主题名',
    promptBuilder: (title, subtitle, theme, beastId) => {
      return {
        scene: `Nirath黄昏生态区，无数发光孢子水母漂浮空中，如生物灯笼般因生物电场微微脉动`,
        title: `孢子水母受大型生物电场（如异兽或地质电磁场）影响，从四面八方自然汇聚，如同带电粒子在磁场中的运动轨迹，在空中拼出发光字"${title}"——每个字由数千只水母组成，内部发光器官因兴奋而明亮，这是生物电的物理现象，绝非意识控制`,
        subtitle: `字群边缘几只因电场强度衰减而掉队的孢子，自然飘落到地面，其分布位置恰好组成"${subtitle}"——物理衰减留下的自然落款`,
        camera: `从远处缓缓推进，最初只见一团光雾，逐渐 reveals 是电场作用下精密排列的字形，镜头最终展示电场源（异兽或地质结构）`,
        atmosphere: `生物电场的物理壮美，自然秩序的精密，理性可解释的生命现象`,
        duration: 5, // 默认5秒，有audioLayer时会被动态覆盖
        style: '生物电场 + 物理现象 + 生态奇观'
      };
    }
  }
};

/**
 * 副标题（出品人）样式配置
 * v1.1-Peng: 全面Nirath化，移除所有中国风元素
 */
const SUBTITLE_STYLES = {
  // Nirath自然融入风（默认）— 地衣/苔藓/矿物质自然生长形成
  natural: {
    prefix: '',
    suffix: '',
    description: 'Nirath地衣/苔藓/矿物质自然蔓延形成的纹理字，蓝绿色生物荧光边缘'
  },
  // 现代简约风
  modern: {
    prefix: '',
    suffix: '',
    description: '极简无衬线字体，金属氧化质感，与探险装备风格统一'
  },
  // 科技光效风（不推荐，避免过度科幻感）
  tech: {
    prefix: '',
    suffix: '',
    description: '双日光谱折射光晕，虹脉孢子散射形成的自然光字'
  },
  // 生物荧光风
  bioluminescent: {
    prefix: '',
    suffix: '',
    description: '生物荧光菌丝/发光水母器官自然形成的发光字，粉金色脉动'
  }
};

/**
 * 模板选择器
 * 根据主题特征自动选择最佳模板
 */
function selectTitleTemplate(theme, beastId, userPreference = null) {
  // 如果用户指定了模板，优先使用
  if (userPreference && TITLE_TEMPLATES[userPreference]) {
    return TITLE_TEMPLATES[userPreference];
  }

  // 基于主题特征自动选择
  const beast = _getBeastInfo(beastId);
  
  // 🆕 v1.3-Peng: 神话级异兽强制大场面模板
  if (beast.scale && (beast.scale.includes('千里') || beast.scale.includes('巨型') || beast.scale.includes('神话'))) {
    return TITLE_TEMPLATES.mountain_carving;
  }
  
  // 🆕 v1.3-Peng: 战神/无头神等史诗级异兽强制大场面
  if (beast.category && (beast.category.includes('战神') || beast.category.includes('神') || beast.category.includes('神话'))) {
    return TITLE_TEMPLATES.mountain_carving;
  }
  
  // 规则1: 如果主角是水系/生活在水域 → 水面倒影
  if (beast.habitat && (beast.habitat.includes('河') || beast.habitat.includes('海') || beast.habitat.includes('水'))) {
    return TITLE_TEMPLATES.water_reflection;
  }
  
  // 规则2: 如果主角是火系/能喷火发光 → 异兽幻化
  if (beast.abilities && beast.abilities.some(a => a.includes('火') || a.includes('光') || a.includes('焰'))) {
    return TITLE_TEMPLATES.beast_manifestation;
  }
  
  // 规则3: 如果主题强调探险/小G视角 → 小G手持
  if (theme && (theme.includes('探险') || theme.includes('小G') || theme.includes('寻'))) {
    return TITLE_TEMPLATES.xiaoG_holding;
  }
  
  // 规则4: 如果主角是空中生物/飞行类 → 天书显现
  if (beast.bodyParts && (beast.bodyParts.wing_count > 0 || beast.habitat && beast.habitat.includes('空'))) {
    return TITLE_TEMPLATES.sky_projection;
  }
  
  // 规则5: 如果主角是超巨型/神话级 → 山崖刻字（史诗感）
  if (beast.scale && (beast.scale.includes('千里') || beast.scale.includes('巨型') || beast.scale.includes('神话'))) {
    return TITLE_TEMPLATES.mountain_carving;
  }
  
  // 🆕 v1.3-Peng: 战神/史诗级异兽默认大场面
  if (beast.category && (beast.category.includes('战神') || beast.category.includes('神'))) {
    return TITLE_TEMPLATES.mountain_carving;
  }
  
  // 默认: 根据场景类型选择
  const sceneType = _detectSceneType(theme);
  switch (sceneType) {
    case 'epic': return TITLE_TEMPLATES.mountain_carving;
    case 'mystery': return TITLE_TEMPLATES.xiaoG_holding;
    case 'wonder': return TITLE_TEMPLATES.spore_lights;
    case 'scifi': return TITLE_TEMPLATES.crystal_formation;
    default: return TITLE_TEMPLATES.mountain_carving; // 默认史诗山崖
  }
}

/**
 * 生成开场标题的完整Prompt
 * 这是核心输出函数，被导演管线调用
 */
function generateOpeningTitlePrompt(config) {
  const {
    title,           // 主标题（如"烛龙觉醒"）
    subtitle = 'by Genius',  // 副标题/出品人 — v2.16-Peng: 固定英文出品人
    episodeNumber,   // 集数（如 E01）
    theme,           // 主题描述
    beastId,         // 主角异兽ID
    templateId,      // 指定模板（可选）
    subtitleStyle = 'natural',  // v1.1-Peng: Nirath自然融入风格
    duration = 5     // 展示时长（秒）—— 默认5秒，有audioLayer时动态覆盖
  } = config;

  // 选择模板
  const template = selectTitleTemplate(theme, beastId, templateId);
  
  // 构建标题和副标题文本
  const fullTitle = episodeNumber ? `${episodeNumber} ${title}` : title;
  const subtitleConfig = SUBTITLE_STYLES[subtitleStyle] || SUBTITLE_STYLES.natural; // v1.1-Peng: 默认natural
  const fullSubtitle = `${subtitleConfig.prefix}${subtitle}${subtitleConfig.suffix}`;
  
  // 生成场景描述
  const scene = template.promptBuilder(fullTitle, fullSubtitle, theme, beastId);
  
  // 🆕 v3.3-Peng-fix2: 如果调用方传入了duration，覆盖模板默认值
  // 用于神兽开场白动态时长计算
  if (config.duration && config.duration > 0) {
    scene.duration = config.duration;
  }
  
  // 组装完整Prompt（供Seedance渲染）
  const prompt = _assemblePrompt(scene, template, config);
  
  // 🆕 v1.4-Peng: 声音层注入 —— 开场白+音效必须进入Prompt
  // Seedance --generate-audio 会根据Prompt中的声音描述同步生成音频
  let finalPrompt = prompt;
  if (config.audioLayer) {
    const soundInjection = _generateSoundInjection(config.audioLayer, beastId);
    if (soundInjection && soundInjection.length > 0) {
      // 将声音描述追加到Prompt末尾（不破坏现有结构）
      finalPrompt = `${prompt}. ${soundInjection}`;
      console.log(`  [SoundInjection] ✅ 声音层已注入: ${soundInjection.length}字`);
    }
  }
  
  // 🆕 v4.0-Peng: 调用三个创意动效Agent，注入动效时间轴
  let titleEffect = null;
  let beastEntrance = null;
  let xiaoGEntrance = null;
  let enhancedPrompt = finalPrompt;
  
  try {
    const beastInfo = _getBeastInfo(beastId);
    titleEffect = TitleEffectDesigner.designTitleEffect(template.id, fullTitle, fullSubtitle, beastId, beastInfo);
    beastEntrance = BeastEntranceDesigner.designBeastEntrance(beastId, beastInfo, template.id);
    xiaoGEntrance = XiaoGEntranceDesigner.designXiaoGEntrance(beastId, beastInfo, template.id, theme);
    
    // 将动效描述追加到Prompt
    const effectParts = [
      titleEffect?.titleEffect?.promptEnhancement,
      titleEffect?.subtitleEffect?.promptEnhancement,
      beastEntrance?.promptEnhancement,
      xiaoGEntrance?.promptEnhancement
    ].filter(Boolean);
    
    if (effectParts.length > 0) {
      enhancedPrompt = `${finalPrompt}. ${effectParts.join(' ')}`;
      console.log(`  [OpeningTitle v4.0-Peng] ✅ 动效注入完成: 标题动效+神兽出场+小G入镜`);
    }

    // 🆕 v4.1-Peng: 结构校验 — 自动拦截6类矛盾
    const rawPromptFields = {
      Camera: scene?.camera || '',
      Transition: scene?.transition || scene?.atmosphere || '',
      AudioLayer: `${scene?.title || ''} ${scene?.subtitle || ''}`
    };
    const validationResult = OpeningTitleValidator.validate(
      { titleEffect, beastEntrance, xiaoGEntrance, totalDuration: scene?.duration || 8.0 },
      rawPromptFields
    );
    if (!validationResult.valid) {
      console.warn(`\n🔴 [OpeningTitle v4.1] STRUCTURAL ERRORS — 记录但不阻断 (将在 _designOpeningTitle 中修复后再次校验)`);
      for (const err of validationResult.errors) {
        console.warn(`   ${err.severity} [${err.type}] ${err.field}: ${err.message}`);
      }
    }
  } catch(e) {
    console.warn(`  [OpeningTitle v4.0-Peng] ⚠️ 动效Agent调用失败: ${e.message}`);
  }
  
  // 返回完整结果
  return {
    // 基础信息
    title: fullTitle,
    subtitle: fullSubtitle,
    episodeNumber,
    
    // 模板信息
    templateId: template.id,
    templateName: template.name,
    templateNameEn: template.nameEn,
    
    // 🆕 v3.1-Peng: 神兽音色系统注入
    ...(beastId ? _generateBeastAudioTrack(beastId, title) : {}),
    
    // 场景要素
    scene: scene.scene,
    
    // 🆕 v4.0-Peng: 动效时间轴
    titleEffect,
    beastEntrance,
    xiaoGEntrance,
    
    // 显示要素
    titleDisplay: scene.title,
    subtitleDisplay: scene.subtitle,
    camera: scene.camera,
    atmosphere: scene.atmosphere,
    duration: scene.duration,
    style: scene.style,
    
    // 完整Prompt（直接用于Seedance渲染）
    seedancePrompt: enhancedPrompt, // 🆕 v4.0-Peng: 使用注入动效后的增强Prompt
    
    // 元数据
    generatedAt: new Date().toISOString(),
    version: 'v4.0-Peng'
  };
}

/**
 * 组装Seedance可用的完整Prompt
 * 🆕 v1.3-Peng: 强制注入大场面/全屏铺满/震撼视听规范
 */
function _assemblePrompt(scene, template, config) {
  const { title, subtitle, theme, beastId } = config;
  
  // 🆕 v1.3-Peng: 片头大场面强制规范
  // 所有片头必须是：大全景/史诗景别、异兽铺满全屏、震撼视听
  const epicScaleInjection = _generateEpicScaleInjection(beastId, template.id);
  
  // 构建Prompt的各层
  const layers = [
    // L1: 标题内容（明确告诉AI要显示什么字）— v2.16-Peng: 英文版好莱坞大片风格
    `[TITLE DISPLAY] The screen must clearly display the main title "${title}" and subtitle "${subtitle}" in cinematic typography`,
    
    // 🆕 L1.5: 大场面强制规范（v1.3-Peng）
    epicScaleInjection,
    
    // L2: 场景描述
    scene.scene,
    
    // L3: 标题融入方式
    scene.title,
    
    // L4: 副标题融入方式
    scene.subtitle,
    
    // L5: 运镜（已升级为大全景/史诗景别）
    scene.camera,
    
    // L6: 氛围
    scene.atmosphere,
    
    // L7: 风格锚定
    scene.style,
    
    // L8: Seedance合规
    `CG hyper-realistic digital environment, Nirath alien planet, bioluminescent ecosystem, dual-sunset lighting, 85mm lens, cinematic composition`
  ];
  
  return layers.filter(Boolean).join('. ');
}

/**
 * 🆕 v1.3-Peng: 生成大场面强制注入文本
 * 片头异兽首次出场必须：大场面、铺满全屏、震撼视听
 */
function _generateEpicScaleInjection(beastId, templateId) {
  // 核心大场面描述（所有片头共享）
  const baseEpic = 'EPIC SCALE opening: the scene must be a GRAND VISTA, the beast fills 50%+ of the frame, full-screen presence, overwhelming visual impact, camera positioned at low angle looking up to emphasize the beast\'s massive scale';
  
  // 根据模板类型追加特定大场面描述
  const templateSpecific = {
    'beast_manifestation': 'the beast\'s ability manifestation dominates the entire sky/ground, shockwave visible, debris/particles fill the air, extreme wide angle lens distortion enhancing scale',
    'mountain_carving': 'the mountain itself is the beast\'s habitat, geological formations tower over the frame, the beast is visible in the background at massive scale',
    'xiaoG_holding': 'wide shot revealing the beast behind xiaoG, the beast towers over the landscape, xiaoG is tiny in foreground emphasizing scale contrast',
    'sky_projection': 'atmospheric phenomena cover the entire sky, the beast is silhouetted against the cosmic-scale light show',
    'crystal_formation': 'floating mountain range fills the background, the beast is perched on a massive crystal formation',
    'water_reflection': 'the beast\'s reflection dominates the entire water surface, ripples distort the massive image',
    'spore_lights': 'billions of spores create a galaxy-scale light show around the beast, the beast is the gravitational center of the particle swarm'
  };
  
  const specific = templateSpecific[templateId] || 'massive scale overwhelming the frame';
  
  return `${baseEpic}, ${specific}`;
}

/**
 * 辅助函数：获取Nirath环境要素
 */
function _getNirathElements(theme, beastId) {
  return {
    lighting: '双日暮光将场景染成紫金色，生物荧光点缀',
    atmosphere: 'Nirath原生生态区，浮空光脉山脉，流光虹脉河',
    particles: '发光孢子漂浮，虹脉孢子悬浮'
  };
}

/**
 * 辅助函数：获取异兽信息
 */
function _getBeastInfo(beastId) {
  try {
    // 🆕 v1.3-Peng: 中文名称到拼音的映射
    const nameToPinyinMap = {
      '刑天': 'xingtian',
      '烛龙': 'zhulong',
      '帝江': 'dijiang',
      '九尾狐': 'jiuweihu',
      '白泽': 'baize',
      '饕餮': 'taotie',
      '穷奇': 'qiongqi',
      '混沌': 'hundun',
      '梼杌': 'taowu',
      '相柳': 'xiangliu',
      '毕方': 'bifang',
      '夔': 'kui',
      '青龙': 'qinglong',
      '白虎': 'baihu',
      '朱雀': 'zhuque',
      '玄武': 'xuanwu',
      '蛊雕': 'gudiao',
      '天狗': 'tiangou',
      '狰': 'zheng',
      '蠃鱼': 'leiyu',
      '旋龟': 'xuangui',
      '化蛇': 'huashe',
      '陆吾': 'luwu',
      '英招': 'yingzhao',
      '诸犍': 'zhujian',
      '肥遗': 'feiyi',
      '狻猊': 'suanni',
      '獬豸': 'xiezhi',
      '重明鸟': 'chongming',
      '鲲鹏': 'kunpeng',
      '巴蛇': 'bashe',
      '鹿蜀': 'lushu',
      '文鳐鱼': 'wenyaoyu',
      '朱厌': 'zhuyan',
      '夫诸': 'fuzhu',
      '祸斗': 'huodou',
      '蜚': 'fei',
      '酸与': 'suanyu',
      '孟槐': 'menghuai'
    };
    
    // 尝试使用原始ID或映射后的拼音
    const pinyinId = nameToPinyinMap[beastId] || beastId;
    
    // 尝试多个路径查找
    const possiblePaths = [
      path.join(__dirname, '../beasts', `${pinyinId}.json`),
      path.join(__dirname, '../../shanhaijing-beast-archive/beasts', `${pinyinId}.json`),
      path.join(__dirname, '../beasts', `${beastId}.json`)
    ];
    
    for (const beastPath of possiblePaths) {
      if (fs.existsSync(beastPath)) {
        return JSON.parse(fs.readFileSync(beastPath, 'utf8'));
      }
    }
  } catch (e) {
    console.warn(`⚠️ 无法读取异兽档案: ${beastId}`);
  }
  return {};
}

/**
 * 辅助函数：获取异兽显化特效
 * v1.1-Peng: 根据异兽具体能力定制，绝对禁止卷轴/符文/印章等中国文化元素
 */
function _getBeastManifestation(beast, title, subtitle) {
  const abilities = beast.abilities || [];
  const appearance = beast.appearance || {};
  const bodyParts = beast.bodyParts || {};
  
  // 根据能力类型选择显化方式 — 每个都是物理/生物现象，非魔法
  if (abilities.some(a => a.includes('火') || a.includes('焰') || a.includes('烛') || a.includes('炎'))) {
    return {
      titleEffect: `异兽喷吐高温等离子火焰，烈焰因空气中的虹脉孢子粒子而呈现彩色，炽热气流上升形成对流，恰好将火焰扭曲成灼热的字"${title}"——每个字由跳动的火苗组成，边缘有火星飞溅如烟火，这是高温气体与大气虹脉孢子的物理作用`,
      subtitleEffect: `火焰熄灭后，地面余烬因温度差异形成热成像般的明暗分布，恰好勾勒出"${subtitle}"的轮廓——热辐射留下的自然签名`,
      camera: `跟随火焰喷射轨迹，从异兽口中到空中火字形成，镜头始终展示物理现象而非超自然力量`,
      atmosphere: '烈焰滔天，高温物理的壮丽，绝非魔法'
    };
  }
  
  if (abilities.some(a => a.includes('水') || a.includes('冰') || a.includes('霜') || a.includes('寒'))) {
    return {
      titleEffect: `异兽甩尾击水，水柱因惯性冲天而起，在Nirath低温高层大气中瞬间冻结成冰晶字"${title}"——每个字由无数六边形冰晶组成，双日阳光穿透冰字折射出完整彩虹光谱，这是水的物态变化物理现象`,
      subtitleEffect: `冰字融化后，水滴在地面上自然汇聚，其流动轨迹受微地形影响恰好形成"${subtitle}"——重力与地形留下的自然签名`,
      camera: `慢动作120fps捕捉水柱升空到冻结成字的瞬间，展示物理状态变化过程`,
      atmosphere: '冰晶剔透，物态变化的刹那永恒，理性可解释'
    };
  }
  
  if (abilities.some(a => a.includes('雷') || a.includes('电') || a.includes('霆') || a.includes('闪'))) {
    return {
      titleEffect: `异兽仰天长啸引发大气电离，雷电因Nirath双恒星带电粒子流而劈落，电光在视网膜/胶片上残留形成发光的字"${title}"——字体如闪电般分叉，这是大气放电的物理现象，绝非天罚`,
      subtitleEffect: `电荷消散后，地面因静电感应留下的电荷分布差异，使尘埃自然排列成"${subtitle}"——静电学留下的自然签名`,
      camera: `从地面仰拍，雷电劈落瞬间的字形形成，展示电离通道的物理过程`,
      atmosphere: '雷霆万钧，大气物理的壮阔，自然放电'
    };
  }

  if (abilities.some(a => a.includes('风') || a.includes('翼') || a.includes('飞') || a.includes('翔'))) {
    return {
      titleEffect: `异兽振翅掀起强风，将地面发光孢子/鳞片/羽毛卷入气流，空气动力学涡流将这些发光粒子自然排列成字"${title}"——每个字都是一场小型气旋的横截面，这是流体力学的自然结果`,
      subtitleEffect: `气流平息后，部分粒子因重力沉降，在地面上自然分布成"${subtitle}"——重力与空气阻力留下的自然签名`,
      camera: `跟随气旋旋转，从侧面展示粒子如何在涡流中排列成字形`,
      atmosphere: '气动美学，流体力学的精密，自然风的雕塑'
    };
  }
  
  // 默认：尾部/翅膀甩出发光粒子（鳞片/羽毛/孢子），物理飞散排列
  return {
    titleEffect: `异兽振翅/甩尾，将体表发光鳞片/羽毛洒向空中，这些带电粒子因静电排斥和空气阻力，在空中自然排列成字"${title}"——每片鳞都是一个发光像素，这是静电学与空气动力学的共同作用`,
    subtitleEffect: `部分鳞片因重力沉降，在地面上自然分布成"${subtitle}"——重力与静电平衡留下的自然签名`,
    camera: `跟随鳞片飞散轨迹，展示静电排斥如何让粒子自然排列`,
    atmosphere: '生物物理，静电与重力的共舞，理性之美'
  };
}

/**
 * 辅助函数：检测场景类型
 */
function _detectSceneType(theme) {
  if (!theme) return 'epic';
  
  const epicKeywords = ['史诗', '大战', '神话', '觉醒', '终极'];
  const mysteryKeywords = ['探险', '寻找', '谜团', '秘境', '未知'];
  const wonderKeywords = ['奇', '幻', '美', '仙境', '奇迹'];
  const scifiKeywords = ['科技', '未来', '机械', '太空', '异星'];
  
  if (epicKeywords.some(k => theme.includes(k))) return 'epic';
  if (mysteryKeywords.some(k => theme.includes(k))) return 'mystery';
  if (wonderKeywords.some(k => theme.includes(k))) return 'wonder';
  if (scifiKeywords.some(k => theme.includes(k))) return 'scifi';
  
  return 'epic';
}

/**
 * 导演管线集成接口
 * 在Stage 8（运镜控制）或单独阶段调用
 */
function integrateWithPipeline(storyPlan, options = {}) {
  const {
    title,
    subtitle = 'by Genius',  // v2.16-Peng: 固定英文出品人
    episodeNumber,
    templateId,
    subtitleStyle = 'natural',
    insertAsFirstShot = true  // 是否作为独立镜头插入
  } = options;
  
  if (!title) {
    console.warn('⚠️ 未提供标题，跳过开场标题设计');
    return null;
  }
  
  // 检测主角异兽
  let beastId = null;
  if (storyPlan.characters && storyPlan.characters.length > 0) {
    const _chars = Array.isArray(storyPlan.characters) ? storyPlan.characters : Object.values(storyPlan.characters || {});
    const beastChar = _chars.find(c => c.species && c.species.includes('兽'));
    if (beastChar) {
      // 🆕 v3.3-Peng-fix: 优先使用name（刑天），而不是id（beast）
      beastId = beastChar.name || beastChar.id;
      console.log(`[opening-title-designer] 检测到神兽: ${beastId} (name=${beastChar.name}, id=${beastChar.id})`);
    }
  }
  
  // 获取主题描述
  const theme = storyPlan.title || storyPlan.description || '';
  
  // 🆕 v3.3-Peng-fix3: 片头时长固定7-9秒（行业标准）
  // 神兽开场白声音跨镜头延续，不占用片头全部时长
  // 片头 = 声音启动(0s) + 画面渐显(0.5s) + 标题呈现(1.5s) + 神兽闪现(7-9s)
  let audioLayer = null;
  try {
    const VoiceDesigner = require('../../shanhaijing-opening-title/beast-voice-designer');
    audioLayer = VoiceDesigner.generateTitleAudioLayer(beastId);
  } catch(e) {
    // 无声音层
  }
  
  // 片头固定7-9秒，有声音层时取8秒（标准片头时长）
  const openingDuration = audioLayer ? 8 : 7;
  
  // 生成开场标题Prompt
  const openingTitle = generateOpeningTitlePrompt({
    title,
    subtitle,
    episodeNumber,
    theme,
    beastId,
    templateId,
    subtitleStyle,
    duration: openingDuration,
    audioLayer: audioLayer  // 🆕 v5.9-Peng-fix: 传入audioLayer确保声音注入Prompt
  });
  
  if (insertAsFirstShot && storyPlan.segments && storyPlan.segments.length > 0) {
    // 作为第一个segment的第一个shot插入
    const firstSegment = storyPlan.segments[0];
    if (!firstSegment.shots) {
      firstSegment.shots = [];
    }
    
    // 创建开场标题shot
    const titleShot = {
      id: 'S00',
      type: 'opening_title',
      description: openingTitle.seedancePrompt,
      duration: openingDuration,
      camera: openingTitle.camera,
      emotion: 'epic_reveal',
      beastSpecies: beastId,
      _isOpeningTitle: true,
      _titleConfig: openingTitle
    };
    
    // 🆕 v3.3-Peng-fix3: 如果有声音层，附加到shot并标记跨镜头延续
    if (audioLayer) {
      titleShot._audioLayer = {
        beastName: audioLayer.metadata.beastName,  // v2.16-Peng: 英文名称
        chineseDesc: audioLayer.chinese,            // 保留中文备用
        englishDesc: audioLayer.english,              // 英文描述
        triggerPoint: audioLayer.metadata.triggerPoint,  // v2.16-Peng: 英文触发点
        estimatedDuration: audioLayer.metadata.estimatedDuration,
        humanReference: audioLayer.metadata.humanReference,
        seedancePromptSegment: audioLayer.english,  // v2.16-Peng: 只使用英文版本注入Seedance
        // 🆕 新增：跨镜头延续标记
        crossShot: true,
        crossShotRange: 'S00-S05', // 声音延续到这些镜头
        voiceEndTime: audioLayer.metadata.estimatedDuration // 声音在第几秒结束
      };
    }
    
    // 插入到最前面
    firstSegment.shots.unshift(titleShot);
    
    console.log(`\n🎬 开场标题已设计: ${openingTitle.templateName}"${title}"`);
    console.log(`   副标题: ${subtitle}`);
    console.log(`   模板: ${openingTitle.templateId}`);
    console.log(`   时长: ${openingDuration}秒${audioLayer ? ' (神兽开场白' + audioLayer.metadata.estimatedDuration.toFixed(1) + '秒跨镜头延续)' : ''}`);
  }
  
  return openingTitle;
}

/**
 * 🆕 v3.1-Peng: 生成神兽开场声音层
 * @param {string} beastId - 神兽ID
 * @param {string} title - 剧集标题
 * @returns {Object} - 声音层设计
 */
function _generateBeastAudioTrack(beastId, title) {
  try {
    const VoiceDesigner = require('../../shanhaijing-opening-title/beast-voice-designer');
    const audioLayer = VoiceDesigner.generateTitleAudioLayer(beastId);
    
    return {
      audioLayer,
      beastVoiceProfile: {
        name: audioLayer.metadata.beastName,
        timbre: audioLayer.chinese.match(/音色特征：(.+)/)?.[1] || '',
        emotionTone: audioLayer.chinese.match(/情绪色彩：(.+)/)?.[1] || '',
        humanReference: audioLayer.metadata.humanReference
      },
      timeline: {
        audio: {
          triggerPoint: audioLayer.metadata.triggerPoint, // 0秒（先声夺人）
          voiceStart: 0.0,
          voiceDuration: audioLayer.metadata.estimatedDuration,
          sfxStart: 0.0,
          sfxDuration: audioLayer.metadata.estimatedDuration + 1.5
        },
        visual: {
          start: 0.0,
          sceneEmerges: 0.5,
          titleReveal: 1.5,
          subtitleReveal: 2.5,
          producerReveal: 3.0,
          beastAppears: audioLayer.metadata.estimatedDuration,
          end: Math.max(3, audioLayer.metadata.estimatedDuration + 1.0)
        }
      }
    };
  } catch (e) {
    console.warn(`[opening-title-designer] 神兽音色系统不可用: ${e.message}`);
    return {};
  }
}

/**
 * 快速测试函数
 */
function runQuickTests() {
  console.log('\n=== Opening Title Designer 快速测试 ===\n');
  
  const testCases = [
    { title: '烛龙觉醒', beastId: 'zhulong', theme: '终极觉醒' },
    { title: '九尾幻境', beastId: 'jiuweihu', theme: '秘境探险' },
    { title: '鲲鹏之变', beastId: 'kunpeng', theme: '天地变幻' },
    { title: '孟槐守护', beastId: 'menghuai', theme: '守护神兽' }
  ];
  
  testCases.forEach((test, i) => {
    console.log(`\n测试 ${i + 1}: ${test.title}`);
    const result = generateOpeningTitlePrompt({
      ...test,
      subtitle: 'by Genius',  // v2.16-Peng: 固定英文出品人
      episodeNumber: `E0${i + 1}`
    });
    
    console.log(`  模板: ${result.templateName} (${result.templateId})`);
    console.log(`  场景: ${result.scene.substring(0, 60)}...`);
    console.log(`  标题展示: ${result.titleDisplay.substring(0, 60)}...`);
    console.log(`  副标题: ${result.subtitleDisplay}`);
    console.log(`  运镜: ${result.camera.substring(0, 60)}...`);
  });
  
  console.log('\n=== 测试完成 ===');
}

// 导出
module.exports = {
  generateOpeningTitlePrompt,
  integrateWithPipeline,
  selectTitleTemplate,
  TITLE_TEMPLATES,
  SUBTITLE_STYLES,
  runQuickTests,
  OpeningTitleValidator  // 🆕 v4.1-Peng: 导出校验器供外部调用
};

// 如果直接运行，执行测试
if (require.main === module) {
  runQuickTests();
}

/**
 * 🆕 v1.4-Peng: 生成声音层注入文本
 * 将audioLayer声音描述转化为Seedance Prompt可用的声音指令
 * Seedance --generate-audio 会根据Prompt中的声音描述同步生成音频
 */
function _generateSoundInjection(audioLayer, beastId) {
  if (!audioLayer) return '';
  
  const parts = [];
  
  // 1. 开场白声音（角色台词，非旁白）
  // 旁白禁止约束：开场白必须是角色台词，不是旁白解说
  if (audioLayer.metadata) {
    const beastName = audioLayer.metadata.beastName || beastId;
    const fixedAnchor = audioLayer.metadata.fixedAnchor;
    const suspenseHook = audioLayer.metadata.suspenseHook;
    
    if (fixedAnchor) {
      parts.push(`a deep resonant bass voice with strong chest resonance and metallic undertone speaks slowly from the depths of the ancient cavern: "${fixedAnchor}"`);
    }
    if (suspenseHook) {
      parts.push(`the same voice continues with deliberate pauses between each word: "${suspenseHook}"`);
    }
  }
  
  // 2. 震撼音效（根据异兽特点定制）
  const beastSfx = _getBeastSoundEffects(beastId);
  if (beastSfx) {
    parts.push(beastSfx);
  }
  
  // 3. 环境音（Nirath星球特有）
  parts.push('sub-bass earth rumble 20-60Hz vibrating through the ground, Nirath magnetic field humming resonating with the beast\'s energy, bioluminescent spore particles pulsing with subtle rhythmic sound');
  
  return parts.join('. ');
}

/**
 * 🆕 v1.4-Peng: 获取异兽专属音效描述
 */
function _getBeastSoundEffects(beastId) {
  const sfxMap = {
    'xingtian': 'massive axe swoosh cutting through air with shockwave, shield clang resonating like ancient war drum deep reverberation, sub-bass earth rumble 20-60Hz as the beast moves, battle aura humming with low frequency vibration',
    'zhulong': 'deep dragon roar with harmonic overtones, scales shifting with crystalline chime sound, breath creating wind howl through canyon, eye blinking with thunderclap resonance',
    'jiuweihu': 'nine tails swaying with wind chime harmony, soft paw steps on crystal surface creating bell-like tones, gentle breathing with flute-like melody, fox chirp echoing through mist'
  };
  
  return sfxMap[beastId] || 'ancient beast presence creating low frequency hum, footsteps causing ground vibration audible, breathing creating atmospheric pressure waves';
}