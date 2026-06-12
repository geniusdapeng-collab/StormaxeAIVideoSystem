/**
 * Nirath栖息地标准化系统 v1.0-Peng
 * 
 * 核心设计：
 * 1. 所有神兽档案的栖息地 → 自动映射到Nirath十大生态区
 * 2. 不依赖档案中的location字段（很多为空或描述性文字）
 * 3. 基于神兽种类本身的知识映射（九尾狐→青丘，烛龙→汤谷等）
 * 4. 新增神兽时，自动从知识库中匹配
 * 
 * 十大生态区：
 * S01 归墟之海 (abyssal-luminara) — 海洋/深渊/敖之腿
 * S02 不周山脉 (broken-axis-peaks) — 火山/山脉/建木
 * S03 青丘灵原 (azure-hills-spirit-plain) — 草原/丘陵/灵原
 * S04 幽冥地下海 (subterranean-styx) — 地下/幽冥/黄泉
 * S05 汤谷扶桑 (solar-cradle-fusang) — 日光/恒星/扶桑
 * S06 昆仑悬境 (kunlun-sky-continent) — 悬浮/天空/瀑布
 * S07 涿鹿战场 (plain-zhulu) — 平原/战场/龟裂
 * S08 蓬莱迷雾 (archipelago-penglai) — 岛屿/迷雾/虹桥
 * S09 星门祭坛 (astrop-gate-nexus) — 祭坛/星门/晶体
 * S10 盘古之脊 (spine-pangu) — 山脊/裂缝/地幔
 */

// 神兽ID → Nirath生态区映射表
// 基于山海经原文 + Nirath生态特征的知识映射
const BEAST_HABITAT_MAP = {
  // S03 青丘灵原 — 草原、丘陵、灵原、九尾狐栖息地
  'jiuweihu': 'azure-hills-spirit-plain',
  'lushu': 'azure-hills-spirit-plain', // 鹿蜀 → 杻阳之山，有草焉，草原
  
  // S02 不周山脉 — 火山、山脉、建木、饕餮栖息地  
  'taotie': 'broken-axis-peaks',
  'taowu': 'broken-axis-peaks',
  'zhuyan': 'broken-axis-peaks',
  'luwu': 'broken-axis-peaks',
  
  // S01 归墟之海 — 海洋、深渊、鲲鹏栖息地
  'kunpeng': 'abyssal-luminara',
  'wenyaoyu': 'abyssal-luminara',
  'luoyu': 'abyssal-luminara',
  
  // S05 汤谷扶桑 — 日光、恒星、烛龙栖息地
  'zhulong': 'solar-cradle-fusang',
  'yinglong': 'solar-cradle-fusang',
  
  // S04 幽冥地下海 — 地下、幽冥、混沌栖息地
  'hundun': 'subterranean-styx',
  
  // S07 涿鹿战场 — 平原、战场、穷奇/刑天栖息地
  'qiongqi': 'plain-zhulu',
  'xingtian': 'plain-zhulu', // 刑天 → 常羊山战场，永不停止的战斗之舞
  
  // S08 蓬莱迷雾 — 岛屿、迷雾、文鳐鱼栖息地
  // 文鳐鱼已在S01
  
  // S06 昆仑悬境 — 悬浮、天空、应龙栖息地
  'yinglong': 'solar-cradle-fusang', // 应龙→汤谷
  
  // 其他神兽的默认映射（基于山海经原文推断）
  'baihu': 'azure-hills-spirit-plain', // 白虎 → 西方金气，草原
  'baize': 'plain-zhulu', // 白泽 → 通万物之情，平原
  'bashe': 'abyssal-luminara', // 巴蛇 → 食象，沼泽深渊
  'bifang': 'broken-axis-peaks', // 毕方 → 火鸟，火山
  'chongming': 'azure-hills-spirit-plain', // 重明鸟 → 光明之地
  'fei': 'plain-zhulu', // 蜚 → 所过之处枯萎，虹脉苔原
  'feiyi': 'broken-axis-peaks', // 肥遗 → 太华峭壁
  'fenghuang': 'solar-cradle-fusang', // 凤凰 → 丹穴山，火山
  'fuzhu': 'abyssal-luminara', // 夫诸 → 敖岸山脉，但近水
  'gudiao': 'azure-hills-spirit-plain', // 姑获鸟 → 草原
  'huashe': 'plain-zhulu', // 化蛇 → 阳山虹脉苔原
  'huodou': 'broken-axis-peaks', // 祸斗 → 厌火高原，火山
  'kui': 'broken-axis-peaks', // 夔 → 东海流波山，但近火山
  'menghuai': 'plain-zhulu', // 孟槐 → 谯明虹脉苔原
  'qilin': 'azure-hills-spirit-plain', // 麒麟 → 祥瑞之地
  'qinglong': 'abyssal-luminara', // 青龙 → 东方木气，深海
  'suanni': 'broken-axis-peaks', // 狻猊 → 香火山脉
  'suanyu': 'plain-zhulu', // 酸与 → 景山山脉
  'tiangou': 'solar-cradle-fusang', // 天狗 → 日食
  'xiangliu': 'abyssal-luminara', // 相柳 → 九头蛇，沼泽
  'xiezhi': 'azure-hills-spirit-plain', // 獬豸 → 公正之原
  'xuanwu': 'abyssal-luminara', // 玄武 → 北方水气，深海
  'xuanyuan': 'abyssal-luminara', // 旋龟 → 怪水三角洲
  'yingzhao': 'azure-hills-spirit-plain', // 英招 → 玄圃平原
  'zheng': 'plain-zhulu', // 狰 → 章莪之山
  'zhujian': 'plain-zhulu', // 诸犍 → 单张虹脉苔原
  'zhuque': 'broken-axis-peaks', // 朱雀 → 南方火气，火山
};

// 生态区 → Nirath专属Prompt段落（紧凑版，控制在60-80字）
const NIRATH_SCENE_PROMPTS = {
  'azure-hills-spirit-plain': "Nirath青丘灵原，蓝绿色高草如海浪起伏，边缘泛着生物荧光青，丘陵覆盖青玉苔地衣发蓝白色辉光，天空漂浮孢子水母粉金色触须摇曳，银汞湖泊如液态镜面倒映双月",
  
  'abyssal-luminara': "Nirath归墟之海，巨型生物荧光浪涌拍打黑曜石巨柱，海水亿万浮游生物发深青翡翠光，双星悬于地平线投射玫瑰金暮光，低空孢子云带被神光穿透",
  
  'broken-axis-peaks': "Nirath不周山脉，万米中央峰被陨石劈开，断面暴露大教堂级橙红水晶脉与岩浆河，半透明黑曜石岩壁粗糙多孔表面布满风化裂缝，铁氧化物沉积形成赭红色矿脉纹理沿断崖蜿蜒，玄武岩柱状节理清晰可见呈六边形垂直排列，冰劈作用形成的尖锐棱角与崩裂碎石散布坡面，沉积层理在侵蚀作用下裸露分层，岩缝间生长着琥珀粉光生物荧光藤蔓灯笼花发微光，山表垂挂建木巨型藤蔓，极光紫青色混合火山灰烬穹顶",
  
  'subterranean-styx': "Nirath幽冥地下海，地壳下大教堂级海洋，地热裂隙熔岩橙红光照亮穹顶，洞穴壁覆盖蓝紫磷光矿物，亿万微生物使地下海自发光，巨型魂丝真菌丝垂如倒悬极光",
  
  'solar-cradle-fusang': "Nirath汤谷扶桑，八百公里陨石撞击盆地正对主星，同心地质环锈红赤陶渐变深琥珀，中央三千米扶桑硅基晶体柱交织，枝杈折射放大阳光发炽烈金白光，永恒金色时刻",
  
  'kunlun-sky-continent': "Nirath昆仑悬境，澳洲大陆级陆地悬浮十五公里高空，底部超导矿脉发脉冲电蓝光，边缘河流倾泻为十五公里高空瀑布，雾化彩虹云，上部森林适应低重力树高达五百米",
  
  'plain-zhulu': "Nirath涿鹿战场，双月引力致地壳持续张力，地面遍布发光的能量裂缝网络如大地脉络，各裂缝喷发异色地热光，铁红铜蓝硫绿交织，裂缝边缘生长着耐高温的发光苔藓与虹脉蕨类，永恒电磁风暴 overhead 粉紫青色极光状电弧，蒸汽升腾间可见虹脉蝴蝶翩翩起舞",
  
  'archipelago-penglai': "Nirath蓬莱迷雾，极地海洋火山岛链，超临界二氧化碳海混生物荧光微生物呈液态金属质感，锥形岛覆深红黑生物荧光蕨林，岛间自然虹桥巨型水晶拱门",
  
  'astrop-gate-nexus': "Nirath星门祭坛，十二根八百米超导水晶柱按星座排列，中央悬浮压缩等离子液态光球，能量束连接 pillar 呈神圣几何光弦，极光背景下珍珠透明干冰地面",
  
  'spine-pangu': "Nirath盘古之脊，极地至极地超级山系太空可见发光疤痕，玻璃质黑曜石玄武岩半透明折射粗糙多孔表面，深层风化裂缝纵横交错，铁氧化物沉积形成赭红色矿脉纹理，玄武岩柱状节理清晰可见，冰劈作用形成的尖锐棱角与崩裂碎石散布坡面，沉积层理在侵蚀作用下裸露分层，岩缝间生长着蓝绿色地衣与灰白微型苔藓，中央盘古裂谷达地幔暗红脉动如心跳，生物荧光生物沿山轮廓绘青金脉"
};

/**
 * 获取神兽的Nirath生态区
 * @param {string} beastId - 神兽ID
 * @returns {string|null} - 生态区ID或null
 */
function getBeastHabitatZone(beastId) {
  return BEAST_HABITAT_MAP[beastId] || null;
}

/**
 * 获取生态区的渲染级Prompt
 * @param {string} zoneId - 生态区ID
 * @returns {string} - Prompt段落
 */
function getZonePrompt(zoneId) {
  return NIRATH_SCENE_PROMPTS[zoneId] || NIRATH_SCENE_PROMPTS['azure-hills-spirit-plain'];
}

/**
 * 为神兽生成完整的Nirath环境Prompt
 * @param {string} beastId - 神兽ID
 * @returns {string} - 完整的Nirath环境描述
 */
function generateNirathHabitatPrompt(beastId) {
  const zoneId = getBeastHabitatZone(beastId);
  if (!zoneId) {
    // 未知神兽，返回通用描述
    return "on proto-Earth Nirath — bioluminescent ecosystem with dual-sunset lighting";
  }
  return getZonePrompt(zoneId);
}

/**
 * 验证神兽是否有有效的栖息地映射
 * @param {string} beastId - 神兽ID
 * @returns {boolean}
 */
function hasValidHabitat(beastId) {
  return !!BEAST_HABITAT_MAP[beastId];
}

/**
 * 获取所有无映射的神兽
 * @returns {Array<string>} - 神兽ID列表
 */
function getUnmappedBeasts() {
  // 这里需要动态读取beast-index.js中的所有神兽
  // 返回未在BEAST_HABITAT_MAP中定义的神兽
  const fs = require('fs');
  const path = require('path');
  const beastsDir = path.join(__dirname, 'beasts');
  
  if (!fs.existsSync(beastsDir)) return [];
  
  const files = fs.readdirSync(beastsDir).filter(f => f.endsWith('.json'));
  const unmapped = [];
  
  for (const file of files) {
    const beastId = file.replace('.json', '');
    if (!BEAST_HABITAT_MAP[beastId]) {
      unmapped.push(beastId);
    }
  }
  
  return unmapped;
}

/**
 * 为神兽注册栖息地映射（用于动态新增）
 * @param {string} beastId - 神兽ID
 * @param {string} zoneId - 生态区ID
 */
function registerBeastHabitat(beastId, zoneId) {
  if (!NIRATH_SCENE_PROMPTS[zoneId]) {
    throw new Error(`未知生态区: ${zoneId}`);
  }
  BEAST_HABITAT_MAP[beastId] = zoneId;
}

module.exports = {
  BEAST_HABITAT_MAP,
  NIRATH_SCENE_PROMPTS,
  getBeastHabitatZone,
  getZonePrompt,
  generateNirathHabitatPrompt,
  hasValidHabitat,
  getUnmappedBeasts,
  registerBeastHabitat
};