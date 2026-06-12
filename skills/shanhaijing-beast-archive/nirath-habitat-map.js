// Nirath 栖息地映射表 v1.0-Peng
// 根据神兽档案中的栖息地字段，自动匹配Nirath Environment Concept Bible中的十大场景

const nirathHabitatMap = {
  // S01 归墟之海
  "abyssal-luminara": {
    sceneId: "S01",
    name: "归墟之海",
    keywords: ["ocean", "sea", "abyss", "water", "deep", "敖之腿", "鳌足"],
    visualAnchors: [
      "直径4000km水下裂谷",
      "荧光蓝绿色海水",
      "青绿色生物荧光浪涌",
      "巨型黑曜石柱群'鳌足'",
      "玫瑰金色暮光",
      "低空孢子云带",
      "实体化神光柱"
    ],
    promptSegment: "infinite rolling grassland where vegetation displays impossible blue-green hue, plants utilizing rhodopsin-like photosynthesis pigments unknown on modern Earth. Tall grasses undulate like ocean in wind, edges traced with delicate bioluminescent cyan. Gentle hills carpeted in 'Azure Jade Moss' lichen emitting soft blue-white luminescence under twin moons. Sky filled with floating 'Spore Jellies' translucent air-buoyant creatures several meters diameter, ribbon-like tentacles trailing, internal organs glowing gradients of pink and gold. Silver-mercury lakes dot landscape like liquid mirrors, perfectly reflecting two moons and bioluminescent sky-life above"
  },
  
  // S02 不周山脉
  "broken-axis-peaks": {
    sceneId: "S02",
    name: "不周山脉",
    keywords: ["mountain", "volcano", "peak", "fire", "magma", "黑曜石", "建木"],
    visualAnchors: [
      "断裂火山链",
      "12000m中央峰",
      "半透明黑曜石山体",
      "内部熔岩河流",
      "极光+火山灰混合天穹",
      "建木巨型发光藤蔓",
      "灯笼状花朵"
    ],
    promptSegment: "titanic volcanic mountain chain at equator. Central peak 'Broken Sky Summit' rises 12000 meters, sheared in half by ancient asteroid impact. Exposed cross-section reveals cathedral-sized chambers filled with pulsing orange-red crystal veins and rivers of molten magma visible through semi-transparent obsidian rock. Mountain surface draped in 'Jianmu' colossal bioluminescent vine-plants hundreds of meters tall, their lantern-like flowers hanging in clusters, emitting warm amber and soft pink light. Upper atmosphere shows curtains of aurora borealis in violet and teal, mixing with volcanic ash clouds"
  },
  
  // S03 青丘灵原 - 九尾狐栖息地
  "azure-hills-spirit-plain": {
    sceneId: "S03",
    name: "青丘灵原",
    keywords: ["grassland", "plain", "hill", "meadow", "九尾狐", "青丘", "灵原", "jade", "moss"],
    visualAnchors: [
      "蓝绿色丘陵草原",
      "类视紫红质光合作用",
      "漂浮孢子水母",
      "银汞湖泊",
      "青玉苔地衣",
      "蓝白色辉光",
      "粉金色内部器官"
    ],
    promptSegment: "infinite rolling grassland where vegetation displays impossible blue-green hue, plants utilizing rhodopsin-like photosynthesis pigments unknown on modern Earth. Tall grasses undulate like ocean in wind, their edges traced with delicate bioluminescent cyan. Gentle hills carpeted in 'Azure Jade Moss' — a lichen that emits soft blue-white luminescence under the twin moons. The sky is filled with floating 'Spore Jellies' — translucent air-buoyant creatures several meters in diameter, their ribbon-like tentacles trailing behind them, internal organs glowing in gradients of pink and gold. Silver-mercury lakes dot the landscape like liquid mirrors, perfectly reflecting the two moons and the bioluminescent sky-life above. A herd of nine-tailed fox-like creatures moves through the grass in the middle distance, their tails leaving traces of golden bioluminescent particles"
  },
  
  // S04 幽冥地下海
  "subterranean-styx": {
    sceneId: "S04",
    name: "幽冥地下海",
    keywords: ["underground", "cave", "dark", "幽冥", "地下", "黄泉", "魂丝"],
    visualAnchors: [
      "大教堂级地下溶洞",
      "地热裂缝熔岩光",
      "磷光矿物岩壁",
      "乳白色地下海洋",
      "巨型菌丝体魂丝",
      "幽蓝色生物发光",
      "三光源照明系统"
    ],
    promptSegment: "cathedral-scale subterranean ocean system beneath planet's crust. Immense caverns with domed ceilings kilometers high, entirely devoid of natural light. Illumination from three sources: geothermal fissures glowing with molten orange-red magma, phosphorescent mineral deposits coating cave walls in electric blue and violet, and trillions of bioluminescent microorganisms making underground sea glow from within. Colossal 'Soul Threads' hang from ceiling like inverted aurora — giant fungal filaments meters in diameter, emitting ethereal pale-blue bioluminescence"
  },
  
  // S05 汤谷扶桑
  "solar-cradle-fusang": {
    sceneId: "S05",
    name: "汤谷扶桑",
    keywords: ["sun", "solar", "cradle", "fusang", "汤谷", "扶桑", "晶体", "crystal"],
    visualAnchors: [
      "800km陨石撞击盆地",
      "永恒金色时刻",
      "3000m晶体扶桑树",
      "多重日华现象",
      "同心圆地质纹理",
      "地热晨雾",
      "硅基生命结晶构造"
    ],
    promptSegment: "immense 800km asteroid impact basin facing primary star. Crater walls show concentric geological rings like tree growth rings, colored in gradients of rust-red, terracotta, and deep amber. At center stands 'Fusang' — a 3000-meter colossal structure of interwoven silicon-based crystal columns, grown by ancient crystalline lifeform, its overall form resembling upward-reaching tree with millions of branches. Each crystal branch refracts and amplifies sunlight, glowing from within with intensified gold and white light. Perpetual geothermal mist rises from crater floor, mixing with atmospheric spores to create eternal golden-hour atmosphere"
  },
  
  // S06 昆仑悬境
  "kunlun-sky-continent": {
    sceneId: "S06",
    name: "昆仑悬境",
    keywords: ["sky", "float", "levitate", "悬浮", "昆仑", "瀑布", "superconducting"],
    visualAnchors: [
      "澳洲大小悬浮大陆",
      "15km高天河瀑布",
      "超导矿脉发光底面",
      "深红紫森林冠层",
      "双重地平线奇观",
      "真空边缘生物适应",
      "神经网络状能量脉络"
    ],
    promptSegment: "continent-sized landmass the size of Australia levitating 15 kilometers above planetary surface, defying gravity through superconducting mineral veins in exposed underside. Underbelly reveals network of glowing electric-blue superconductor pathways pulsing with magnetic energy. Rivers at continent's edge plunge as 15km-high 'Celestial Waterfalls,' atomizing into prismatic rainbow clouds. Upper surface features impossibly tall forests adapted to low-gravity and high altitude — trees reaching 500 meters with crimson and violet foliage"
  },
  
  // S07 涿鹿战场
  "plain-zhulu": {
    sceneId: "S07",
    name: "涿鹿战场",
    keywords: ["battle", "war", "plain", "涿鹿", "龟裂", "电磁", "棋盘"],
    visualAnchors: [
      "潮汐锁定龟裂平原",
      "电磁风暴云层",
      "三色地热裂隙棋盘",
      "兵主冢黑石结构",
      "极光般多彩闪电",
      "发光岩脉缝合线",
      "重力异常光畸变"
    ],
    promptSegment: "vast tectonically active plain where gravitational forces from two moons create constant geological tension. Ground is cracked chessboard of massive fissures, each emitting different colored geothermal light — molten orange from iron-rich vents, electric blue from copper deposits, toxic green from sulfur compounds. Permanent electromagnetic storm brews overhead, lightning arcing across sky in aurora-like spectra of pink, violet, and cyan"
  },
  
  // S08 蓬莱迷雾
  "archipelago-penglai": {
    sceneId: "S08",
    name: "蓬莱迷雾",
    keywords: ["island", "archipelago", "mist", "蓬莱", "迷雾", "虹桥", "polar"],
    visualAnchors: [
      "极地悬浮岛群",
      "超临界二氧化碳海洋",
      "深红黑色发光蕨类",
      "天然水晶虹桥",
      "液态金属质感流体",
      "无限拉长影子",
      "长黄昏双恒星"
    ],
    promptSegment: "chain of volcanic islands in polar ocean that float upon sea of supercritical carbon dioxide mixed with bioluminescent microorganisms, creating liquid-metal-like fluid with impossible reflective and refractive properties. Conical volcanic islands covered in deep crimson and black bioluminescent fern forests. Between islands span natural 'Rainbow Bridges' — colossal crystal arches formed over millions of years. Supercritical 'sea' below flows like liquid mercury but with internal bioluminescent swirls of gold and teal"
  },
  
  // S09 星门祭坛
  "astrop-gate-nexus": {
    sceneId: "S09",
    name: "星门祭坛",
    keywords: ["gate", "nexus", "altar", "祭坛", "星门", "crystal", "plasma"],
    visualAnchors: [
      "十二根800m超导水晶巨柱",
      "压缩等离子体液态光球",
      "能量束几何网络",
      "珍珠白干冰平原",
      "极端极光背景",
      "星座天文对齐",
      "星球能量心脏"
    ],
    promptSegment: "ancient monumental structure of twelve 800-meter superconducting crystal pillars, each composed of different spectral-colored crystal, arranged in precise astronomical alignment with distant constellations. At center floats perpetual sphere of compressed plasma in liquid-light state — morphing with fluid dynamics beauty yet maintaining perfect spherical form. Visible energy beams connect pillars in complex sacred geometry, appearing as luminous strings against backdrop of extreme aurora borealis"
  },
  
  // S10 盘古之脊
  "spine-pangu": {
    sceneId: "S10",
    name: "盘古之脊",
    keywords: ["spine", "backbone", "ridge", "盘古", "山脉", "rift", "mantle"],
    visualAnchors: [
      "贯穿南北极超级山脉",
      "半透明黑曜石玄武岩",
      "地幔对流暗红光芒",
      "星球冷却初期构造",
      "生物发光脉络",
      "大气涡流云图案",
      "太空视角发光伤疤"
    ],
    promptSegment: "super-mountain system spanning from pole to pole, planet's first-formed landmass visible from space as glowing scar across planetary surface. Mountains are glassy obsidian-basalt formations from planet's cooling phase, semi-transparent and refractive. Central 'Pangu Rift' is continental-scale chasm reaching to mantle, revealing planet's slow internal convection — pulsing dark crimson glow like heartbeat. Bioluminescent organisms colonize warm obsidian surfaces, tracing mountain contours with cyan and gold luminescent veins"
  }
};

// 栖息地匹配函数
function matchHabitat(beastHabitat) {
  // 将栖息地描述转换为小写关键词
  const habitatLower = beastHabitat.toLowerCase();
  
  // 遍历所有场景，匹配关键词
  for (const [sceneKey, sceneData] of Object.entries(nirathHabitatMap)) {
    for (const keyword of sceneData.keywords) {
      if (habitatLower.includes(keyword.toLowerCase())) {
        return sceneData;
      }
    }
  }
  
  // 默认回退到青丘灵原（通用栖息地）
  return nirathHabitatMap["azure-hills-spirit-plain"];
}

// Prompt注入函数（升级后）
function injectNirathHabitat(beastId, beastHabitat, basePrompt) {
  const sceneData = matchHabitat(beastHabitat);
  
  // 构建Nirath专属环境描述
  const nirathSegment = `on proto-Earth Nirath — ${sceneData.promptSegment}`;
  
  // 将Nirath环境注入Prompt（替换通用模板）
  const enhancedPrompt = basePrompt.replace(
    /青丘群岛浮空晶簇山脉由半透明石英与紫水晶交织而成.*?(?=，|。)/s,
    nirathSegment
  );
  
  return {
    prompt: enhancedPrompt,
    sceneMatched: sceneData.sceneId,
    sceneName: sceneData.name,
    visualAnchors: sceneData.visualAnchors
  };
}

module.exports = {
  nirathHabitatMap,
  matchHabitat,
  injectNirathHabitat
};