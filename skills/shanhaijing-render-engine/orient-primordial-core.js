/**
 * Nirath Orient Primordial Core v4.4-Peng
 * ShanhaiStory Forge v2.10-Peng | Nirath Orient Primordial Core v4.4-Peng
 * 大视频系统统一版本号：v2.10-Peng（山海经系列 + 通用视频系列）
 * 
 * v4.4-Peng 更新（大系统 v2.10-Peng）：
 * + 🆕 数字人显假问题软性注入 —— 微表情+生物节律+不完美=真实
 *   - EMOTION_ENHANCEMENTS扩展：眨眼/呼吸/眼神漂移/微表情系统
 *   - 人类角色：小G/成年男/成年女新增生物节律参数
 *   - 来源：数字人显假问题实战指南（大鹏2026-05-26）
 * + 版本同步：大视频系统统一版本号 v2.10-Peng
 * 
 * v4.0-Peng 更新（大系统 v1.1-Peng）：
 * + 🆕 异兽表情增强模块去科技化 — 移除所有科技元素暗示
 * + 🆕 纯粹神话生物描述强化 — 烛龙/九尾/麒麟/饕餮/凤凰
 * + 🆕 负面约束自动注入 — 配合异兽专用生成模式
 * 
 * v3.0-Peng 更新:
 * Nirath原生星球核心锚点 — 强约束风格注入系统
 * 
 * 核心设计:
 * 1. L1前置注入 — CG超写实渲染器风格（通用层，保留）
 * 2. L2环境氛围 — Nirath双星原始荒野氛围（替换水墨志怪）
 * 3. L3场景构建 — Nirath十大场景数据库（替换山海经场景）
 * 4. L4角色描述 — 种族纹理/体型约束/表情/动作（保留小G，增加Nirath原生生物）
 * 5. L5光影构建 — 双恒星光照系统 + 生物发光生态（替换五色光/水墨光照）
 * 6. 空余空间智能填充引擎 — 自动追加细节提升画质
 * 
 * 强约束原则:
 * - 双恒星系统在所有室外场景保持一致的相对位置和色温（一橙一紫）
 * - 生物发光色系统一：深海青绿/翡翠，高空暖金/粉红，地热橙红，超导电蓝
 * - 大气透视始终存在——远景有明确的色彩偏移（远处偏蓝紫）
 * - 体积光效果贯穿所有场景——阿凡达美学的核心特征
 * - 材质质感区分明确：黑曜石玻璃、超导晶体、生物组织、液态金属各有独特的高光响应
 * - 规模暗示——每个场景必须包含人类尺度的参照物或强迫透视来传达Nirath的巨大
 */

// ========== 【栖息地→Nirath场景映射表】神兽档案自动匹配 ==========
// 来源: Nirath Environment Concept Bible v1.0-Peng 十大场景
// 映射逻辑: beastId / habitat关键词 → L3_SCENES 键名

const BEAST_HABITAT_MAP = {
  // 九尾狐 → S03 青丘灵原 (蓝绿色丘陵草原)
  jiuweihu: 'azure_hills',
  '九尾狐': 'azure_hills',
  '青丘': 'azure_hills',
  '青丘群岛': 'azure_hills',
  '灵原': 'azure_hills',

  // 烛龙 → S05 汤谷扶桑 (日光/地热/永恒黄昏)
  zhulong: 'solar_cradle',
  '烛龙': 'solar_cradle',
  '章尾山': 'solar_cradle',
  '汤谷': 'solar_cradle',
  '扶桑': 'solar_cradle',

  // 帝江 → S06 昆仑悬境 (悬浮/混沌)
  dijiang: 'kunlun_sky',
  '帝江': 'kunlun_sky',
  '昆仑': 'kunlun_sky',
  '悬境': 'kunlun_sky',

  // 饕餮 → S02 不周山脉 (火山/贪婪)
  taotie: 'broken_axis',
  '饕餮': 'broken_axis',
  '不周': 'broken_axis',
  '虹脉深渊': 'broken_axis',

  // 白泽 → S06 昆仑悬境 (智慧/悬浮)
  baize: 'kunlun_sky',
  '白泽': 'kunlun_sky',

  // 应龙/有翼龙 → S10 盘古之脊 (超级山脉)
  yinglong: 'spine_pangu',
  '应龙': 'spine_pangu',
  '浮空晶簇山': 'spine_pangu',

  // 凤凰 → S08 蓬莱迷雾 (悬浮岛群/涅槃)
  fenghuang: 'archipelago_penglai',
  '凤凰': 'archipelago_penglai',
  '蓬莱': 'archipelago_penglai',

  // 麒麟 → S07 涿鹿战场 (祥瑞降世/大地)
  qilin: 'plain_zhulu',
  '麒麟': 'plain_zhulu',
  '大荒东经': 'plain_zhulu',

  // 穷奇 → S02 不周山脉 (凶兽/战争)
  qiongqi: 'broken_axis',
  '穷奇': 'broken_axis',
  '大荒西经': 'broken_axis',

  // 鲲鹏 → S01 归墟之海 (海洋/化鹏)
  kun_peng: 'abyssal_luminara',
  '鲲鹏': 'abyssal_luminara',
  '北海': 'abyssal_luminara',

  // 通用兜底映射（避免未命中时完全退化）
  '山脉': 'spine_pangu',
  '山': 'spine_pangu',
  '海': 'abyssal_luminara',
  '草原': 'azure_hills',
  '平原': 'plain_zhulu',
  '洞穴': 'subterranean_styx',
  '祭坛': 'astrop_nexus',
  '森林': 'spine_pangu', // 盘古之脊有生物发光森林
};

// ========== 中文场景关键词→L3_SCENES映射（描述级 fallback） ==========
const SCENE_KEYWORD_MAP = {
  '青丘': 'azure_hills',
  '蓝绿色': 'azure_hills',
  '草原': 'azure_hills',
  '丘陵': 'azure_hills',
  '灵原': 'azure_hills',
  '汤谷': 'solar_cradle',
  '扶桑': 'solar_cradle',
  '黄昏': 'solar_cradle',
  '不周': 'broken_axis',
  '火山': 'broken_axis',
  '断裂': 'broken_axis',
  '昆仑': 'kunlun_sky',
  '悬浮': 'kunlun_sky',
  '悬境': 'kunlun_sky',
  '归墟': 'abyssal_luminara',
  '海洋': 'abyssal_luminara',
  '深海': 'abyssal_luminara',
  '幽冥': 'subterranean_styx',
  '地下': 'subterranean_styx',
  '黄泉': 'subterranean_styx',
  '涿鹿': 'plain_zhulu',
  '战场': 'plain_zhulu',
  '地热': 'plain_zhulu',
  '熔岩': 'plain_zhulu',
  '蓬莱': 'archipelago_penglai',
  '迷雾': 'archipelago_penglai',
  '岛群': 'archipelago_penglai',
  '星门': 'astrop_nexus',
  '祭坛': 'astrop_nexus',
  '能量': 'astrop_nexus',
  '盘古': 'spine_pangu',
  '脊': 'spine_pangu',
  '裂谷': 'spine_pangu',
};

/** 智能场景解析器 — 根据神兽ID/栖息地/描述自动匹配Nirath场景 */
function resolveSceneType(beastId, habitatDesc, sceneDesc) {
  // P0: 精确匹配 — beastId 直接映射
  if (beastId && BEAST_HABITAT_MAP[beastId]) {
    return BEAST_HABITAT_MAP[beastId];
  }

  // P1: 栖息地关键词匹配
  if (habitatDesc) {
    for (const [keyword, sceneId] of Object.entries(SCENE_KEYWORD_MAP)) {
      if (habitatDesc.includes(keyword)) return sceneId;
    }
  }

  // P2: 场景描述关键词匹配
  if (sceneDesc) {
    for (const [keyword, sceneId] of Object.entries(SCENE_KEYWORD_MAP)) {
      if (sceneDesc.includes(keyword)) return sceneId;
    }
  }

  // P3: 通用关键词 fallback
  if (sceneDesc) {
    for (const [keyword, sceneId] of Object.entries(BEAST_HABITAT_MAP)) {
      if (sceneDesc.includes(keyword)) return sceneId;
    }
  }

  // 未命中 — 返回 null（调用方应回退到 _detectSceneType 或 default）
  return null;
}

// ========== Nirath星球核心参数 ==========
const NIRATH_CORE = require('./nirath-world-core.js');
const { NIRATH_CREATURES } = require('./nirath-world-core.js');

// ========== 【Nirath色彩系统】双恒星色谱 ==========
// 基于Nirath双恒星系统 + 生物发光生态
// 核心规律: 深海=青绿/翡翠, 高空=暖金/粉红, 地热=橙红, 超导=电蓝

const NIRATH_COLORS = {
  // 深海生物发光: 青绿/翡翠 — 海洋/水下场景主色
  deepSea: { name: '深海青', hex: ['#008B8B', '#20B2AA', '#00CED1'], emotion: '神秘/广阔/生命力', scene: '归墟之海/幽冥地下海' },
  // 高空双星光: 暖金/粉红 — 天空/大气场景主色
  skyLight: { name: '天光金', hex: ['#FFD700', '#FF69B4', '#FFA500'], emotion: '神圣/温暖/永恒黄昏', scene: '汤谷扶桑/昆仑悬境' },
  // 地热岩浆: 橙红 — 火山/地热场景主色
  geothermal: { name: '地热红', hex: ['#FF4500', '#DC143C', '#B22222'], emotion: '力量/毁灭/重生', scene: '不周山脉/涿鹿战场' },
  // 超导矿物: 电蓝 — 能量/晶体场景主色
  superconductor: { name: '超导电', hex: ['#00BFFF', '#1E90FF', '#4169E1'], emotion: '科技/神秘/能量流动', scene: '星门祭坛/昆仑悬境底部' },
  // 黑曜石/玄武岩: 深黑/半透明 — 山脉/构造场景主色
  obsidian: { name: '黑曜石', hex: ['#1C1C1C', '#2F4F4F', '#000000'], emotion: '永恒/坚硬/原始', scene: '盘古之脊/不周山脉' },
  // 草原/植物: 蓝绿/翠绿 — 生命场景主色
  flora: { name: '灵原绿', hex: ['#228B22', '#32CD32', '#00FA9A'], emotion: '生机/富饶/梦幻', scene: '青丘灵原' }
};

// ========== 【Nirath场景色彩剧本】 ==========
// 基于"双恒星位置 + 地貌类型 + 生物发光"三维绑定 + 情绪弧线设计

const NIRATH_EPISODE_COLOR_SCRIPT = {
  e01_kuafu_chasing_sun: [
    { shots: [1, 2], phase: '建置', colors: ['skyLight', 'flora'], scene: '汤谷扶桑', desc: '双恒星永恒黄昏 — 金色暮光中的扶桑巨树，小G初次踏入Nirath' },
    { shots: [3, 4], phase: '冲突', colors: ['geothermal', 'obsidian'], scene: '涿鹿战场', desc: '地热橙红裂缝 + 光脉巨碑 — 夸父奔跑的能量平原，裂缝边缘生长着发光苔藓' },
    { shots: [5, 6], phase: '追逐', colors: ['deepSea', 'skyLight'], scene: '归墟之海', desc: '青绿海浪 + 玫瑰金天光 — 夸父穿越发光海洋追逐恒星' },
    { shots: [7, 8], phase: '高潮', colors: ['superconductor', 'obsidian'], scene: '星门祭坛', desc: '电蓝能量柱 + 光脉晶化地面 — 夸父抵达能量核心' },
    { shots: [9, 10], phase: '觉醒', colors: ['geothermal', 'skyLight'], scene: '汤谷扶桑', desc: '橙红光芒 + 金色暮光 — 夸父与双恒星的对视，力量觉醒' },
    { shots: [11, 12], phase: '结尾', colors: ['deepSea', 'flora', 'skyLight'], scene: '青丘灵原', desc: '五色渐变 — 从深海青到灵原绿到天光金，暗示Nirath的完整生态' }
  ]
};

// ========== Layer1: CG超写实渲染器风格 (~120字符) ==========
// 保留: 通用CG渲染标准

const L1_CHARACTER = `CG cinematic, photorealistic, hyper-detailed skin pores peach fuzz, strong subsurface scattering, gritty realistic, epic atmospheric, mature content, iris fiber eyes, flyaway hair, 8K ACES, fast-paced.`;

// ========== Layer2: Nirath环境氛围 (~130字符) ==========
// 替换水墨志怪 → Nirath双星原始荒野
// 核心特征: 双恒星永恒黄昏 + 生物发光生态 + 原始地球童年

const L2_ENVIRONMENT = `Nirath proto-Earth wilderness, dual-star eternal twilight amber and violet, bioluminescent ecosystem glowing, primordial scale overwhelming, Avatar-level production quality, volumetric god-rays through spore clouds, atmospheric perspective distant blue-purple.`;

// ========== 【Nirath光照风格关键词】 ==========
// 替换水墨光照 → 双恒星光照系统

const NIRATH_LIGHTING = {
  // 双恒星主光源: 一暖(琥珀橙)一冷(紫罗兰)，永恒黄昏
  dual_star: `dual-star lighting amber-orange key from primary star + violet-cool fill from secondary star, eternal twilight rose-gold atmosphere, never midday never midnight`,
  // 生物发光填充光: 来自植物/水体/生物的次级光源
  bioluminescent_fill: `bioluminescent teal-cyan fill from ocean waves + warm amber-pink from floating spore jellies + electric blue from superconductor veins, multi-source organic lighting`,
  // 体积光效果: 孢子云/雾气中的光束 — Avatar美学核心
  volumetric_god_rays: `volumetric god-rays piercing through spore clouds and mist, solid-looking pillars of divine light, crepuscular rays in rose-gold and cyan`,
  // 大气透视: 远景蓝紫色偏移 — 传达Nirath巨大尺度
  atmospheric_perspective: `strong atmospheric perspective distant elements shifting blue-purple, haze depth conveying planetary scale, macro-photography detail on foreground elements`
};

// ========== Layer3: Nirath十大场景定制 (~60-80字符/场景) ==========
// 来源: Nirath Environment Concept Bible v1.0

const L3_SCENES = {
  // S01: 归墟之海 — 深渊发光海洋
  abyssal_luminara: `Abyssal Luminara infinite glowing ocean, bioluminescent waves crashing luminous crystal pillars "Legs of Ao", trillions of photoplankton cyan-emerald glow, dual suns amber-violet at horizon rose-gold twilight, spore clouds ribbon formations pierced by god-rays.`,
  
  // S02: 不周山脉 — 断裂火山链
  broken_axis: `Broken Axis Peaks titanic volcanic chain, 12000m peak sheared by asteroid impact, exposed crystal chambers pulsing orange-red, Jianmu bioluminescent vine-plants lantern flowers, aurora violet-teal mixed volcanic ash sky-dome. Rough porous volcanic rock surface with deep weathering fissures crisscrossing, iron oxide deposits creating ochre-red mineral vein patterns, basalt columnar joints clearly visible, frost-shattered sharp edges and fractured debris scattered on slopes, exposed stratified sedimentary layers, blue-green lichen in rock crevices, talus slopes and scree at mountain base, matte stone surface not smooth plastic-like but naturally rough mineral matrix, raking light creating deep shadow pools and highlight ridges.`,
  
  // S03: 青丘灵原 — 蓝绿色丘陵草原
  azure_hills: `Azure Hills Spirit Plain infinite blue-green grassland, rhodopsin-like vegetation cyan edges bioluminescent, Azure Jade Moss soft blue-white under twin moons, floating Spore Jellies pink-gold internal organs, silver-mercury lakes reflecting dual moons.`,
  
  // S04: 幽冥地下海 — 地下发光海洋
  subterranean_styx: `Subterranean Styx cathedral-scale caverns kilometers high, geothermal fissures molten orange-red + phosphorescent minerals electric blue-violet + bioluminescent sea milk-azure, Soul Threads giant fungal filaments pale-blue ethereal glow hanging like inverted aurora.`,
  
  // S05: 汤谷扶桑 — 陨石撞击盆地
  solar_cradle: `Solar Cradle Fusang 800km impact basin facing primary star, concentric geological rings rust-red to deep amber, 3000m Fusang crystal-column structure refracting sunlight gold-white within, perpetual geothermal mist eternal golden-hour, multiple sundogs halos sun pillars from binary refraction.`,
  
  // S06: 昆仑悬境 — 悬浮大陆
  kunlun_sky: `Kunlun Sky-Continent Australia-sized levitating 15km above surface, exposed underside electric-blue superconductor pathways pulsing magnetic energy, 15km Celestial Waterfalls atomizing prismatic rainbow clouds, 500m crimson-violet trees extending into vacuum, double-horizon spectacle.`,
  
  // S07: 涿鹿战场 — 地热能量平原
  plain_zhulu: `Plain of Zhulu vast geothermal energy plain with luminous fissure networks, mineral deposits glowing warm orange-blue-green light from underground heat, permanent electromagnetic storm with lightning in pink-violet-cyan aurora-like ribbons, healing fissures with glowing rock veins stitching shut like living wounds, ancient monolithic Tombs of Weaponmaster with gravity anomalies, geothermal springs creating misty hot pools where bioluminescent algae thrive, warm steam rising between energy-charged basalt pillars covered in heat-resistant moss.`,
  
  // S08: 蓬莱迷雾 — 悬浮岛群
  archipelago_penglai: `Archipelago of Penglai volcanic islands floating on supercritical CO2 sea liquid-metal-like fluid, crimson black bioluminescent fern forests, natural Rainbow Bridges crystal arches refracting spectral rainbows, polar long twilight infinite-length shadows, sky luminous canvas.`,
  
  // S09: 星门祭坛 — 磁北极能量核心
  astrop_nexus: `Astrop Gate Nexus twelve 800m superconducting crystal pillars spectral colors astronomical alignment, central compressed plasma sphere liquid-light state cycling blue-white-crimson, visible energy beams sacred geometry luminous strings, pearl dry ice ground diffusing all light, extreme aurora green-violet-white sky.`,
  
  // S10: 盘古之脊 — 超级山脉系统
  spine_pangu: `Spine of Pangu super-mountain pole to pole glowing scar across planet, glassy crystal-basalt semi-transparent refractive rough porous surface with deep weathering fissures, iron oxide deposits creating ochre-red mineral vein patterns, basalt columnar joints clearly visible, frost-shattered sharp edges and fractured debris, exposed stratified sedimentary layers, blue-green lichen in rock crevices, talus slopes and scree, matte stone surface not smooth plastic-like but naturally rough mineral matrix, raking light creating deep shadow pools, Pangu Rift continental chasm reaching mantle pulsing crimson-gold heartbeat visible from orbit, atmospheric vortex clouds breathing spirals, bioluminescent cyan-gold veins tracing contours.`
};

// ========== Layer4: 山海经角色锚点 (~100字符) ==========
// 来源: 调研报告§1.2 (异兽造型三种构成法则) + §6.4 (种族纹理设计系统)
// 核心原则: 解剖学可信度 + 纹理材质真实感 + 色彩符号性 + 动态生物合理性

const L4_CHARACTERS = {
  // 人类角色 — 小G
  // 性格: 8岁中国男孩，活泼好动但不全程奔跑，思维敏捷，天真烂漫，有好奇心
  // 动作特征: 多样化日常动作（歪头/蹲下/伸手/转圈/小跑/坐地/手指比划），只在情绪高潮时奔跑
  // 人种特征: 黑直发、深棕色杏仁眼、黄皮肤、圆中带方脸型、单眼皮或内双 — 强制中国人
  // 服饰: 亮黄色短款户外冲锋衣（及腰长度，拉链微开），深蓝色直筒牛仔裤，白色低帮运动鞋，干净简洁
  // 配饰精确统一规范（v13.1-Peng）:
  //   - 指南针: 脖子挂着黄铜指南针，皮革挂绳，圆形黄铜外壳，表盘清晰可见，垂到胸口位置
  //   - 水壶: 腰间右侧，军绿色圆柱形水壶，帆布保护套，背带扣
  //   - 手电筒: 冲锋衣左胸口袋，露出半截黑色LED手电筒，头部露出，短挂绳
  // 🆕 v2.1-Peng: 待机感注入 —— 小G的"真实感"来自等待时的下意识小动作
  //   - 等待时脚尖点地打拍子，或无意识用手指敲指南针表壳
  //   - 思考时咬吸管/手指轻敲脸颊，眼神飘向虚空某点
  //   - 紧张时搓手指、整理衣服拉链、左脚鞋尖蹭地面画半圆
  //   - 兴奋时身体重心前倾，双手 gesturing animatedly，停不下来
  // 🔴 v13.0-Peng: 强化中国人特征注入 —— 默认所有人类角色 = Chinese, East Asian, NOT Western
  human_child: `Chinese 8-year-old boy named XiaoG, straight black hair dark brown almond eyes yellow skin round-square face East Asian features single eyelids or inner double eyelids, NOT Caucasian NOT Western NOT European, curious innocent lively playful, tilting head crouching down reaching out pointing finger spinning around small running steps sitting on ground gesturing explaining, occasional jumping when excited, wearing bright yellow short outdoor windbreaker jacket waist-length zipper slightly open dark blue straight-leg jeans white low-top athletic sneakers clean and simple, brass compass hanging around neck on leather cord at chest position circular brass case dial visible, army green cylindrical canteen hanging on right side of waist with canvas cover and strap buckle, black LED flashlight sticking out from left chest pocket of jacket head visible short lanyard, natural skin texture hyper-detailed pores definitely Chinese appearance, when waiting toe tapping unconsciously or finger drumming on compass case, when thinking eyes drifting to void biting straw finger tapping cheek, when nervous rubbing fingers adjusting zipper left shoe toe scraping ground drawing semicircle, when excited body leaning forward hands gesturing animatedly restless can't-stand-still energy`,

  // 成年男性 — 默认中国人/East Asian
  human_adult_male: `Chinese adult male, East Asian features, straight black hair dark brown eyes yellow skin tone round-square face, NOT Caucasian NOT Western NOT European, weathered skin strong bone structure, natural hair determined eyes authentic anatomy, hyper-detailed skin pores lifelike iris fiber, definitely Chinese appearance`,

  // 成年女性 — 默认中国人/East Asian
  // 🔴 v13.0-Peng: 新增护士Chen专用基础模板
  human_adult_female: `Chinese adult female, East Asian features, straight black hair dark brown almond eyes yellow skin tone round-square face, NOT Caucasian NOT Western NOT European, delicate features soft grace, natural luminous authentic beauty, subsurface scattering skin translucent glow, hyper-detailed skin pores lifelike iris fiber, definitely Chinese appearance`,

  // 护士Chen — 专业女性，白色制服+红十字臂章
  // 🔴 v13.0-Peng: 角色档案系统标准模板
  human_nurse: `Chinese female nurse named Chen, 28 years old, East Asian features, straight black hair dark brown almond eyes yellow skin tone round-square face single eyelids, NOT Caucasian NOT Western NOT European, short professional hair warm caring smile confident gaze, slender athletic build 165cm height, white medical uniform with red cross armband emergency badge on sleeve, warm professional smile caring eyes, hyper-detailed skin pores lifelike iris fiber, definitely Chinese appearance, professional healthcare worker demeanor`,

  // 九尾狐 — 九尾，银白，狐仙
  // 种族纹理: 狐族 = Guard Hair(粗硬防水)+Undercoat(细软保暖)+Awn Hair(中间层), 冬纯白→夏青灰, 尾尖白毛
  // 【体型约束】本体高约2.5米(含尾高约4米)，九尾展开时横向占画面70%，保持跨镜头尺度一致
  // 🆕 v2.1-Peng: 待机感注入 —— 九尾狐的"真实感"来自狐族本能的待机动作
  //   - 等待时尾巴尖轻咬自己的毛尖，耳朵间歇性抖动整理听觉
  //   - 思考时前爪轻拨地面小石子，下巴搁在前爪上九条尾巴铺开
  //   - 紧张时舔爪子的动作比实际需要多几下，尾巴无意识地轻扫地面
  //   - 警觉时耳朵转向声音来源但身体保持不动，瞳孔闪过一丝金色
  nine_tailed_fox: `Qingqiu nine-tailed fox spirit, 2.5-meter body fixed scale, silver-white fur triple-layer coat guard-undercoat-awn, winter pure white summer blue-gray seasonal molt, nine flowing tails white tips traditional auspicious mark, enchanting amber almond eyes, mystical ethereal grace, gritty realistic fur texture hyper-detailed, when waiting tail tip nibbling own fur ear twitching intermittently adjusting hearing, when thinking front paw lightly flicking pebbles chin resting on paws nine tails spreading, when nervous licking paws more than needed tail sweeping ground unconsciously, when alert ears turning to sound source body remaining still pupils flashing gold, idle presence breathing rhythm slightly irregular amber eyes drifting to void`,

  // 麒麟 — 龙首、鹿角、牛蹄，金鳞，火云
  // 种族纹理: 麒麟 = 鳞(前身)+毛(后身)+角(额顶), 青/黄+荧光边缘光
  // 【体型约束】肩高约3米，角高0.8米，整体占画面50%纵向空间
  qilin: `Qilin auspicious beast dragon-head deer-horn ox-hoof, 3-meter shoulder fixed scale, golden scales anterior leathery posterior fur, fluorescent edge light jade-green gold, fire cloud surrounding divine majestic, horn branching annual rings age indicator, gritty realistic composite texture hyper-detailed.`,

  // 饕餮 — 羊身人面，目在腋下，虎齿人爪
  // 种族纹理: 饕餮 = 厚皮+角质增生(类似犀牛), 土黄/赭石+泥土苔藓附着, 面部褶皱
  // 【体型约束】体长约4米，肩高1.8米，横向占画面55%，保持凶兽压迫感尺度
  taotie: `Taotie gluttonous beast goat-body human-face thick rhinoceros-like skin keratin growth, 4-meter body fixed scale, eyes under armpits tiger teeth human hands, ocher yellow earth tone mud-moss附着色, facial wrinkles age-aggression marks, ferocious ancient gritty realistic skin texture hyper-detailed.`,

  // 凤凰 — 五彩，火尾羽，金冠
  // 种族纹理: 凤族 = 羽轴(Rachis)+羽枝(Barb)+羽小枝(Barbule)三级结构, 结构色+色素色, 尾羽眼状斑同心圆
  // 【体型约束】翼展约6米，站立身高2.5米，展翅时横向占画面80%
  fenghuang: `Fenghuang phoenix five-color plumage structural-pigment dual color system, 6-meter wingspan fixed scale, rachis-barb-barbule triple feather structure, fire tail feathers eyespot concentric pattern, golden crest divine bird rebirth flames, hooklet engagement aerodynamic integrity, gritty realistic feather texture hyper-detailed 8K.`,

  // 相柳 — 九头蛇，毒，沼泽
  // 种族纹理: 蛇族(近龙族简化) = 平滑鳞+毒腺凸起
  // 【体型约束】单头颈长约1.5米，九头展开时横向占画面75%，蛇身直径0.5米
  xiangliu: `Xiangliu nine-headed serpent venomous hydra, 1.5-meter neck per head fixed scale, smooth scales with venom gland protrusions, marsh dwelling toxic breath green-black coloration, chaos demon snake gritty realistic scale texture hyper-detailed.`,

  default: `Photorealistic anatomy, natural material, cinematic, 8K texture, authentic creature.`
};

// ========== 【调研融合】种族纹理快速参考表 ==========
// 用于Prompt生成时快速注入种族专属纹理关键词

const BEAST_TEXTURE_MAP = {
  dragon: {
    scaleType: 'rhomboid placoid-ganoid hybrid scales',
    colorPattern: 'dorsal dark to ventral light countershading',
    specialMarks: 'horn-claw-tail wear marks, age indicators',
    refBio: 'Komodo dragon scale structure + corn snake color pattern'
  },
  fox: {
    furType: 'triple-layer coat: guard hair( waterproof) + undercoat(insulating) + awn hair(intermediate)',
    colorPattern: 'winter pure white summer blue-gray seasonal molt',
    specialMarks: 'tail tip white fur traditional auspicious mark',
    refBio: 'arctic fox fur density + red fox color variation'
  },
  phoenix: {
    featherType: 'rachis-barb-barbule triple structure with hooklet engagement',
    colorPattern: 'structural color + pigment color dual system',
    specialMarks: 'tail feather eyespot concentric fractal pattern',
    refBio: 'peacock tail structure + hummingbird structural color'
  },
  taotie: {
    skinType: 'thick skin with keratin growth similar to rhinoceros',
    colorPattern: 'ocher yellow earth tone with mud-moss附着色',
    specialMarks: 'facial wrinkles age and aggression indicators',
    refBio: 'rhinoceros skin thickness + hippopotamus color pattern'
  },
  qilin: {
    compositeType: 'scales(anterior) + fur(posterior) + horn(forehead)',
    colorPattern: 'jade-green gold with fluorescent edge light',
    specialMarks: 'horn branching annual rings age indicator',
    refBio: 'giraffe spot pattern + antelope horn spiral'
  }
};

// ========== 负面约束 (~140字符) ==========
// Nirath风格负面约束：保持超写实，排除卡通/现代/地球常见元素

const NEGATIVE_CONSTRAINTS = `NO cartoon anime Disney Pixar, NO plastic doll chibi, NO text script writing, NO flat sci-fi modern western, NO contemporary buildings vehicles technology, NO Earth-normal vegetation without bioluminescence, NO single sun lighting, NO pure black shadows, NO blown-out white highlights.`;

// ========== 空余空间智能填充引擎 ==========
// 来源: 调研报告§2.5 (生成式纹理合成) + §3.4 (水墨美学技术转译) + §7.2 (光照体系)

/** 表情增强模块 — 优先级: P1 */
const EMOTION_ENHANCEMENTS = {
  human_child: [
    `genuine joyful smile, eyes sparkling with mischief, natural childlike wonder, authentic playful emotion, energetic expression, natural blinking 15-20 times per minute with 20% random interval variation, breathing visible as subtle chest rise and fall 18-22 times per minute, gaze drifting to interesting objects then returning, hands fidgeting with compass or jacket zipper unconsciously`,
    `expressive curious face, head tilted exploring, warm innocent glow, lifelike mischievous personality, agile alertness, micro-expressions flickering across face, eyebrows raising instinctively at novelty, mouth slightly open in concentrated focus, body weight shifting from foot to foot when standing still`,
    `natural happy expression, subtle micro-expressions of excitement, organic warmth, hands gesturing animatedly, restless energy, shoulders relaxing and tensing with emotional shifts, occasional rapid blinking when excited, chin lifting slightly with pride or discovery`,
    `wide-eyed wonder looking up, mouth slightly open in awe, hands reaching out eagerly, pure childhood curiosity, breathing slowing to 12-15 per minute in awe state, eyes widening then narrowing as processing new information, fingers spreading then curling instinctively`,
    `grinning with excitement, body leaning forward energetically, restless can't-stand-still energy, playful challenging gaze, toes tapping unconsciously when paused, slight bouncing on balls of feet, intermittent rapid blinking matching excitement peaks`
  ],
  human_adult_male: [
    `weathered wise expression, steady determined gaze, subtle depth, natural blinking with thoughtful pauses between, breathing deep and slow 10-12 per minute, occasional jaw tightening when concentrating, eyes narrowing slightly in evaluation, micro-expressions of consideration crossing face`,
    `calm confident look, natural human warmth, authentic character, relaxed shoulders with occasional tension release, gaze steady but with periodic soft focus shifts, breathing rhythm matching emotional state, unconscious hand movements when speaking`,
    `focused alert expression, emotional depth, organic personality, eyebrows drawing together in concentration then releasing, slight head tilt when listening, eyes tracking with deliberate movement then pausing, breathing becoming shallow when focused deepening when relaxed`,
  ],
  human_adult_female: [
    `gentle knowing smile, graceful serene warmth, authentic kindness, natural blinking with warm social rhythm, breathing smooth and even, micro-smile flickering at corners of mouth, eyes softening when empathy triggered, slight head nodding unconsciously in agreement`,
    `calm maternal glow, quiet inner strength, soft expressive features, breathing visible as gentle abdomen rise and fall, gaze shifting between objects of care and distant thought, eyebrows raising subtly in gentle surprise, lips parting slightly in contemplation`,
    `natural feminine beauty, subtle emotional depth, genuine warmth, eyes brightening then dimming with thought, micro-expressions revealing inner processing, breathing pattern changing with emotional shifts, unconscious hair tucking or collar adjusting movements`,
  ],
  zhulong: [
    `divine serpent majesty, ancient wisdom gaze, primordial power emanating from crimson scales, when waiting timeline slightly knotting at one point thermal imaging forehead flickering unconsciously, when thinking time hourglass in eyes slowly reversing neck of time channel slightly bent`,
    `vertical slit pupils focused, mythical presence, magma glow within translucent scales, when nervous crimson scales light-heat output slightly decreasing spacetime sparks between whiskers jumping, when alert vertical pupils in eyes contracting breathing driving magma energy flowing under scales`,
    `ancient deity authority, ten-thousand-meter body coiling around sacred mountain, NO technology, NO mechanical elements, idle presence time perception occasionally missing half-beat psychological activity evidence`,
  ],
  nine_tailed_fox: [
    `enchanting almond eyes gleaming, nine tails flowing gracefully, mystical allure, pure spirit beast.`,
    `silver fur shimmering in moonlight, ethereal fox spirit presence, NO human companion, NO modern elements.`,
    `wise ancient spirit gaze, knowing smile beneath furry muzzle, supernatural wisdom.`,
  ],
  qilin: [
    `benevolent divine beast gaze, golden scales reflecting virtue, pure auspicious creature.`,
    `majestic deer-horn crown, sacred body harmony, NO technology, NO artificial elements.`,
    `ancient auspicious presence, natural elemental aura, primordial spiritual energy.`,
  ],
  taotie: [
    `fierce gluttonous hunger, eyes under armpits scanning prey, ancient ferocity.`,
    `tiger teeth bared, human hands grasping, primordial beast wrath, thick skin vibrating with rage.`,
    `mythical hunger personified, NO mechanical parts, NO technology, pure ancient beast.`,
  ],
  fenghuang: [
    `divine bird rebirth flames, five-color plumage radiant, pure phoenix spirit.`,
    `golden crest gleaming, eyespot tail feathers fanned, NO human rider, NO modern elements.`,
    `eternal cycle wisdom, phoenix gaze transcending time, natural divine fire.`,
  ],
  default: [
    `expressive natural face, subtle authentic emotion, lifelike depth.`,
    `genuine warm expression, organic personality, natural character.`,
    `authentic emotional depth, micro-expressions driving mood.`,
  ]
};

/** 环境细节增强模块 — 优先级: P2 (Nirath十大场景) */
const ENVIRONMENT_ENHANCEMENTS = {
  abyssal_luminara: [
    `bioluminescent waves cresting cyan-green, luminous crystal pillars rising from depths like frozen myth.`,
    `dual stars amber-violet at horizon casting rose-gold twilight across liquid light ocean.`,
    `trillions of photoplankton glowing with every wave, spore clouds pierced by god-rays.`,
  ],
  broken_axis: [
    `semi-transparent crystal mountain with glowing minerals inside, lava rivers visible through rock.`,
    `peak sheared at mid-mountain exposing crystal veins pulsing orange-red.`,
    `Jianmu bioluminescent vine-plants hundreds of meters tall, lantern-like flowers glowing amber.`,
  ],
  azure_hills: [
    `infinite blue-green tall grass undulating like ocean, edges traced with faint bioluminescent cyan.`,
    `Azure Jade Moss lichen emitting soft blue-white luminescence under twin moons.`,
    `floating Spore Jellies translucent air-buoyant creatures, ribbon tentacles glowing pink-gold.`,
  ],
  subterranean_styx: [
    `cathedral-scale cavern domed ceiling kilometers high, three-source illumination creating dreamlike haze.`,
    `underground sea transitioning milky white near shore to deep azure in depths.`,
    `Soul Threads giant fungal filaments hanging like inverted aurora, pale-blue ethereal glow.`,
  ],
  solar_cradle: [
    `800km impact basin with concentric geological rings like tree growth rings rust-red to deep amber.`,
    `3000m Fusang crystal-column structure refracting sunlight gold-white within, millions of branches.`,
    `perpetual geothermal mist eternal golden-hour, multiple sundogs halos sun pillars from binary refraction.`,
  ],
  kunlun_sky: [
    `Australia-sized continent levitating 15km above surface, electric-blue superconductor pathways pulsing magnetic energy.`,
    `15km Celestial Waterfalls atomizing into prismatic rainbow clouds before reaching ground.`,
    `impossibly tall 500m trees crimson-violet foliage extending into vacuum edge, double-horizon spectacle.`,
  ],
  plain_zhulu: [
    `vast cracked chessboard of massive fissures emitting different colored geothermal light orange-blue-green.`,
    `permanent electromagnetic storm lightning in aurora-like spectra pink-violet-cyan.`,
    `healing fissures with new-growth glowing rock veins stitching shut like luminescent scars.`,
  ],
  archipelago_penglai: [
    `volcanic islands floating on supercritical CO2 sea liquid-metal-like fluid with bioluminescent swirls.`,
    `deep crimson black bioluminescent fern forests adapted to acidic atmosphere.`,
    `natural Rainbow Bridges crystal arches refracting polar light into spectral rainbows between islands.`,
  ],
  astrop_nexus: [
    `twelve 800m superconducting crystal pillars spectral colors arranged in astronomical alignment.`,
    `central compressed plasma sphere liquid-light state cycling blue-white-crimson.`,
    `visible energy beams sacred geometry luminous strings against extreme aurora green-violet-white sky.`,
  ],
  spine_pangu: [
    `glassy crystal-basalt formations semi-transparent refractive, glowing interior visible through rock.`,
    `Pangu Rift continental-scale chasm reaching to mantle pulsing crimson-gold like heartbeat.`,
    `bioluminescent cyan-gold veins tracing mountain contours like illuminated anatomical drawing.`,
  ],
  default: [
    `Nirath dual-star eternal twilight atmosphere, bioluminescent ecosystem ambient glow.`,
    `atmospheric perspective distant elements shifting blue-purple conveying planetary scale.`,
    `volumetric god-rays through spore clouds, solid-looking pillars of divine light.`,
  ]
};

/** 光影质感增强模块 — 优先级: P3 (Nirath双恒星光照系统) */
// Nirath光照规范: 双恒星主光源 + 生物发光填充 + 体积光效果 + 大气透视
const LIGHTING_ENHANCEMENTS = [
  // 双恒星核心: 一暖(琥珀橙)一冷(紫罗兰)，永恒黄昏
  { text: `dual-star lighting amber-orange key from primary star + violet-cool fill from secondary star, eternal twilight rose-gold atmosphere.`, len: 108 },
  // 生物发光核心: 多源有机光照系统
  { text: `bioluminescent teal-cyan fill from ocean waves + warm amber-pink from spore jellies + electric blue from superconductor veins.`, len: 104 },
  // 体积光核心: 孢子云/雾气中的光束 — Avatar美学
  { text: `volumetric god-rays piercing through spore clouds and mist, solid-looking pillars of divine light, crepuscular rays in rose-gold and cyan.`, len: 115 },
  // 大气透视核心: 远景蓝紫色偏移 — 传达Nirath巨大尺度
  { text: `strong atmospheric perspective distant elements shifting blue-purple, haze depth conveying planetary scale, macro-photography detail on foreground.`, len: 118 },
  // 材质高光: 黑曜石玻璃、超导晶体、生物组织、液态金属各有独特响应
  { text: `crystal glass subsurface refraction + superconductor crystal internal glow + biological tissue translucent luminescence + liquid metal mirror reflection.`, len: 130 },
  // IMAX电影级补充
  { text: `cinematic depth of field, subtle vignette, atmospheric haze conveying immense scale.`, len: 73 },
  { text: `dual-star diffused warm light + bioluminescent teal fill from below + volumetric god-rays through spore clouds.`, len: 93 },
  { text: `emotional cinematic lighting, Avatar-level bioluminescent atmosphere, IMAX 70mm film grain.`, len: 83 },
];

/** 【极限快节奏】超密度信息注入模块 — 优先级: P4 v2.2 */
const FAST_PACING_MODULES = [
  { text: `rapid action sequence, fast-paced cuts, high information density, visual bombardment`, len: 78 },
  { text: `quick transitions between multiple actions, dynamic movement overload, kinetic chaos`, len: 82 },
  { text: `rapid-fire visual beats, kinetic energy bursting frame, relentless momentum, no pause`, len: 83 },
  { text: `action-packed frames with simultaneous foreground background motion, layered chaos`, len: 87 },
  { text: `multi-layered motion, character sprinting while environment shifts rapidly, turbocharged`, len: 89 },
  { text: `continuous motion blur, high-speed action choreography, frantic energy`, len: 72 },
  { text: `relentless pacing, no static moments, constant visual stimulation, sensory overload`, len: 82 },
  { text: `dynamic camera whip pan strobe, rapid scene changes, information overload aesthetic`, len: 84 },
  { text: `crash zoom smash cut, jarring frame collision, chaotic motion blur`, len: 68 },
  { text: `frantic kinetic energy, turbocharged relentless pace, no breathing room`, len: 71 },
];

/** 智能空余填充引擎 */
function _fillSurplus(prompt, sceneType, charType, maxLength) {
  const surplus = maxLength - prompt.length;
  if (surplus < 20) return prompt; // 少于20字符不做增强

  const usedModules = [];
  const modulesToAppend = [];

  // === P1: 表情增强 ===
  const emotionList = EMOTION_ENHANCEMENTS[charType] || EMOTION_ENHANCEMENTS.default;
  for (const module of emotionList.sort((a, b) => a.length - b.length)) {
    const needed = module.length + 2; // +2 for ", " separator
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.replace(/\.$/, '')); // strip trailing period
      usedModules.push(`表情+${module.length}`);
      break;
    }
  }

  // === P2: 环境细节增强 ===
  const envList = ENVIRONMENT_ENHANCEMENTS[sceneType] || ENVIRONMENT_ENHANCEMENTS.default;
  for (const module of envList.sort((a, b) => a.length - b.length)) {
    const needed = module.length + 2;
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.replace(/\.$/, ''));
      usedModules.push(`环境+${module.length}`);
      break;
    }
  }

  // === P3: 光影质感增强（水墨规范优先，最多2个）===
  // 优先使用水墨光照关键词(前4个)，再补充电影级(后4个)，但最多只取2个最短
  const sortedLight = [...LIGHTING_ENHANCEMENTS].sort((a, b) => a.len - b.len);
  let lightCount = 0;
  for (const module of sortedLight) {
    if (lightCount >= 2) break; // 最多2个光影模块
    const needed = module.len + 2;
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.text.replace(/\.$/, ''));
      usedModules.push(`光影+${module.len}`);
      lightCount++;
    }
  }

  // === P4: 【快节奏】高密度信息注入 ===
  // 大鹏要求: 非常快节奏，信息密度大，动作多，切换快
  const sortedPacing = [...FAST_PACING_MODULES].sort((a, b) => a.len - b.len);
  for (const module of sortedPacing) {
    const needed = module.len + 2;
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.text.replace(/\.$/, ''));
      usedModules.push(`快+${module.len}`);
      break; // 只注入1个，避免过度
    }
  }

  // 统一追加所有模块
  if (modulesToAppend.length > 0) {
    const cleanPrompt = prompt.replace(/\.$/, ''); // strip trailing period
    prompt = cleanPrompt + ', ' + modulesToAppend.join(', ') + '.';
    console.log(`  [山海经增强-调研融合版] ${usedModules.join(', ')} | 最终${prompt.length}/${maxLength}`);
  }

  return prompt;
}

// ========== 【调研融合】色彩合法性检查 ==========
// 基于§1.6: 五正色体系提供了文化原生的色彩代码
// 用于生成后检查Prompt是否符合原著色彩统计规律

function validateColorLegitimacy(prompt, sceneType) {
  const colorFrequency = {
    '赤': 162, '红': 162, 'crimson': 162, 'red': 162, 'fire': 162,
    '白': 143, 'white': 143, 'silver': 143,
    '青': 111, 'cyan': 111, 'green-blue': 111, 'teal': 111,
    '黄': 106, 'yellow': 106, 'gold': 106, 'golden': 106,
    '黑': 68, 'black': 68, 'dark': 68, 'abyss': 68
  };

  const foundColors = [];
  for (const [color, freq] of Object.entries(colorFrequency)) {
    if (prompt.toLowerCase().includes(color.toLowerCase())) {
      foundColors.push({ color, freq });
    }
  }

  // 检查是否符合场景的色彩剧本
  const script = EPISODE_COLOR_SCRIPT.e01_zhulong_awakening;
  const expectedColors = script.find(s => L3_SCENES[sceneType]?.includes(s.phase.toLowerCase()))?.colors || [];

  return {
    foundColors,
    expectedColors,
    isValid: foundColors.length > 0, // 至少包含一种五正色标识
    recommendation: foundColors.length === 0 ? '建议注入五正色关键词以符合山海经色彩基因' : null
  };
}

// ========== 组合函数(960字符硬控,预留20字符缓冲) ==========
// v4.2-Peng: 新增 habitat-aware 自动场景匹配
function buildOrientPrompt(sceneType, charType, action, maxLength = 990, options = {}) {
  const { beastId, habitat, sceneDesc } = options;
  
  // 🔴 v4.2-Peng: 栖息地感知场景解析 — 自动匹配Nirath十大场景
  let resolvedSceneType = sceneType;
  if (beastId || habitat || sceneDesc) {
    const matched = resolveSceneType(beastId, habitat, sceneDesc);
    if (matched) {
      resolvedSceneType = matched;
      console.log(`  [栖息地匹配] ${beastId || '-'} / ${habitat ? habitat.substring(0,20) : '-'} → ${matched} ✅`);
    } else if (sceneType && !L3_SCENES[sceneType]) {
      // 传入的 sceneType 不在 L3_SCENES 中，且未通过栖息地匹配 — 使用通用兜底
      console.log(`  [栖息地匹配] ${beastId || '-'} / ${habitat ? habitat.substring(0,20) : '-'} → 未命中，回退到 default ⚠️`);
      resolvedSceneType = 'default';
    }
  }

  const l3 = L3_SCENES[resolvedSceneType] || L3_SCENES.default || '';
  const l4 = L4_CHARACTERS[charType] || L4_CHARACTERS.default;

  // 固定基座部分（不可裁剪）
  const base = `${L1_CHARACTER} ${L2_ENVIRONMENT}`;
  const core = `${l3} ${l4}`;
  const negative = NEGATIVE_CONSTRAINTS;

  // 先尝试完整组合（含负面约束）
  let prompt = `${base} ${core} ${action} ${negative}`;

  if (prompt.length > maxLength) {
    // 第一步：裁剪action，保留最低40字符
    const excess = prompt.length - maxLength;
    const actionTrim = Math.max(40, action.length - excess);
    const trimmedAction = action.substring(0, actionTrim);

    prompt = `${base} ${core} ${trimmedAction} ${negative}`;

    if (prompt.length > maxLength) {
      // 第二步：裁剪L3场景，保留最低20字符
      const excess2 = prompt.length - maxLength;
      const sceneTrim = Math.max(20, l3.length - excess2);
      const trimmedScene = l3.substring(0, sceneTrim);

      prompt = `${base} ${trimmedScene} ${l4} ${trimmedAction} ${negative}`;

      if (prompt.length > maxLength) {
        // 第三步：裁剪L4角色描述，保留最低60字符
        const excess3 = prompt.length - maxLength;
        const charTrim = Math.max(60, l4.length - excess3);
        const trimmedChar = l4.substring(0, charTrim);

        prompt = `${base} ${trimmedScene} ${trimmedChar} ${trimmedAction} ${negative}`;
      }
    }
  }

  prompt = _fillSurplus(prompt, resolvedSceneType, charType, maxLength);

  // 【调研融合】色彩合法性检查(仅日志提示，不阻塞)
  const colorCheck = validateColorLegitimacy(prompt, resolvedSceneType);
  if (!colorCheck.isValid) {
    console.log(`  [色彩合法性] ⚠️ ${colorCheck.recommendation}`);
  } else {
    console.log(`  [色彩合法性] ✅ 检测到${colorCheck.foundColors.map(c => c.color).join('/')}色系`);
  }

  return prompt;
}

// ========== CLI测试入口 ==========
if (require.main === module) {
  console.log('\n🐉 Nirath Orient Primordial Core v4.1-Peng — 大系统v2.0-Peng版本同步\n');
  console.log('核心设计: 双恒星永恒黄昏 × 生物发光生态 × Avatar级制作水准');
  console.log('强约束: 双星位置一致 + 生物发光色系统一 + 大气透视始终存在 + 体积光贯穿全场景\n');

  // 测试1: 烛龙+钟山
  const prompt1 = buildOrientPrompt('solar_cradle', 'human_adult_male', 'Kuafu giant standing before Fusang tree reaching toward dual suns');
  console.log('\n【测试1】夸父@汤谷扶桑(永恒黄昏/金色):');
  console.log(prompt1);
  console.log(`长度: ${prompt1.length}字符`);

  // 测试2: 小男孩+荒野
  const prompt2 = buildOrientPrompt('azure_hills', 'human_child', 'XiaoG running through blue-green grassland chasing floating Spore Jellies');
  console.log('\n【测试2】小G@青丘灵原(蓝绿/梦幻):');
  console.log(prompt2);
  console.log(`长度: ${prompt2.length}字符`);

  // 测试3: 九尾狐+青丘
  const prompt3 = buildOrientPrompt('astrop_nexus', 'default', 'twelve crystal pillars pulsing with energy beams, plasma sphere floating center');
  console.log('\n【测试3】星门祭坛@磁北极(全光谱/神圣):');
  console.log(prompt3);
  console.log(`长度: ${prompt3.length}字符`);

  // 测试4: 色彩合法性验证
  console.log('\n【测试4】Nirath双恒星色谱验证:');
  console.log(`  地热红(火山/地热): ${NIRATH_COLORS.geothermal.hex.join(', ')} `);
  console.log(`  深海青(海洋/水下): ${NIRATH_COLORS.deepSea.hex.join(', ')} `);
  console.log(`  天光金(天空/大气): ${NIRATH_COLORS.skyLight.hex.join(', ')} `);
  console.log(`  黑曜石(山脉/构造): ${NIRATH_COLORS.obsidian.hex.join(', ')} `);
  console.log(`  灵原绿(生命/草原): ${NIRATH_COLORS.flora.hex.join(', ')} `);

  console.log('\n✅ Nirath风格测试完成！(v4.0-Peng 原生星球风格注入系统)');
}

module.exports = {
  L1_CHARACTER,
  L2_ENVIRONMENT,
  L3_SCENES,
  L4_CHARACTERS,
  NEGATIVE_CONSTRAINTS,
  NIRATH_COLORS,
  NIRATH_EPISODE_COLOR_SCRIPT,
  NIRATH_LIGHTING,
  NIRATH_CREATURES,
  BEAST_HABITAT_MAP,
  SCENE_KEYWORD_MAP,
  buildOrientPrompt,
  resolveSceneType,
  validateColorLegitimacy
};