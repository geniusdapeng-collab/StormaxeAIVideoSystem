#!/usr/bin/env node
/**
 * Nirath世界引擎 — Shanhaijing World Engine v13.1-Peng
 * 
 * 世界观：Nirath = 地球前身 = 2147年科技文明归元产物
 * 《山海经：异兽志》是8岁男孩小G在Nirath上的真实记录
 * 
 * 管理五大元素体系、天象系统、地理志、种族等级
 * 从世界观设定到渲染参数的"五大元素一致性"
 * 

 */

// ============ Nirath原创世界观地理系统 ============
// 【故事内核融入】8大区域完整地理体系
const GEOGRAPHY = {
  // 5大主区域 + 3特殊区域
  regions: [
    {
      id: 'nanshan',
      name: '光之森域',
      element: 'wood',
      fiveElement: '木',
      description: '温暖湿润，四季如春，光脉能量充沛。植物异兽的天堂——树可以行走，花可以发光，草可以歌唱。',
      climate: '温暖湿润，四季如春',
      terrain: '低山丘陵为主，森林覆盖率达90%以上。河流密布，湖泊众多。海拔普遍低于2000米',
      ecology: '植物异兽的天堂——树可以行走，花可以发光，草可以歌唱。动物异兽以C级和B级为主，A级较少',
      ruins: '以城市废墟为主——曾经的南方大都市现在被原始森林覆盖。摩天大楼变成了巨型藤蔓的支架，地铁隧道变成了地下河流',
      auraLevel: '中-高（适合生命生长，但不足以产生大量A级异兽）',
      timeFlow: '正常（1:1）',
      representativeBeasts: ['光囊母兽', '冰甲龟兽', '九尾光狐', '光余草', '光音鸟'],
      significanceToXG: '小G的"出生地"和"第一个家"——在这里，他从一个恐惧的孩子变成了一个好奇的探索者',
      visualKeywords: ['发光的树冠', '藤蔓缠绕的摩天大楼', '巨型蘑菇', '彩虹色的溪流', '永不凋零的花'],
      colorPalette: {
        primary: '#228B22',    // 深翠绿
        secondary: '#FFD700',  // 暗金
        accent: '#006400',     // 墨绿
        atmosphere: '#8B4513'  // 赤褐
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'growth',           // 生长频率 — 木属性：扩张、向上、萌发
        emotionalTone: 'expansion',    // 情感基调：扩张感、生命力、好奇
        resonance: 'curiosity-wonder',   // 与小G的内心共振：好奇→惊奇
        tempo: 'flowing',              // 时间节奏：流动、不停滞
        visualWeight: 'light'            // 视觉重量：轻盈、向上
      },
      civilizationCycle: {
        goldenAge: '南方都市圈，生物技术之都',
        collapseEvent: '灵生季爆发，植被暴走吞噬城市',
        currentState: '废墟被原始森林覆盖，摩天大楼成藤蔓支架',
        rebirthSigns: '新物种在废墟中诞生，生态链重组'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '青苔覆盖的混凝土，藤蔓缠绕的钢架，新生命在旧物上生长' },
        { layer: 'middle', age: 'collapse-era', description: '破裂的玻璃幕墙，坍塌的天花板，停滞的自动扶梯' },
        { layer: 'deep', age: 'golden-age', description: '地铁站瓷砖上的广告海报，公园里生锈的游乐设施，学校墙上的涂鸦' }
      ]
    },
    {
      id: 'xishan',
      name: '晶脉山脉',
      element: 'metal',
      fiveElement: '金',
      description: '干燥凉爽，昼夜温差大，偶有暴风雪。金属性异兽的领地——异兽的皮毛呈现金属光泽，某些异兽的"骨骼"外露，如同活体的金属雕塑。',
      climate: '干燥凉爽，昼夜温差大，偶有暴风雪',
      terrain: '高山峡谷为主，山体呈现金属质感（铜色、银色、金色），某些山峰顶端终年积雪。峡谷深邃，河流湍急',
      ecology: '金属性异兽的领地——异兽的皮毛呈现金属光泽，某些异兽的"骨骼"外露，如同活体的金属雕塑。植物稀少但极为坚韧（如生长在岩石缝中的"铁树"）',
      ruins: '以工业废墟和军事基地为主——曾经的西部工业区和军事基地现在成为了异兽的"宫殿"。工厂的巨大钢架成为了巢穴的支架，地下掩体成为了冬眠的洞穴',
      auraLevel: '高（金属性光脉能量有"凝固"效应，光脉能量在此处"沉淀"，浓度较高）',
      timeFlow: '稍慢（0.9:1）',
      representativeBeasts: ['猬毛凶兽', '雪白智兽（季节性出现）', '多种金属性B级异兽'],
      significanceToXG: '他在这里第一次面对"高级别危险"（猬毛凶兽），也在这里第一次获得"导师"（雪白智兽）',
      visualKeywords: ['金属质感的山体', '铜色的峡谷', '巨大的齿轮与树根缠绕', '冰冷的河流', '发光的矿石'],
      colorPalette: {
        primary: '#8B4513',    // 赭石
        secondary: '#C0C0C0',  // 银白
        accent: '#B8860B',     // 暗金
        atmosphere: '#CD853F'  // 铜红
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'decay',            // 衰变频率 — 金属性：凝固、沉淀、剥落
        emotionalTone: 'contraction',  // 情感基调：收缩感、沉重、敬畏
        resonance: 'fear-reverence',     // 与小G的内心共振：恐惧→敬畏
        tempo: 'slowing',              // 时间节奏：缓慢、凝固
        visualWeight: 'heavy'            // 视觉重量：沉重、向下
      },
      civilizationCycle: {
        goldenAge: '西部工业区，重工业与军事中心',
        collapseEvent: '金属性光脉能量暴走，工业设施成为光脉能量结晶的温床',
        currentState: '钢架与树根缠绕，工厂成异兽宫殿，地下掩体成冬眠洞穴',
        rebirthSigns: '金属与有机物的奇异共生，新的生态在工业废墟中建立'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '锈蚀的钢架被藤蔓缠绕，齿轮与树根共生，金属表面覆盖苔藓' },
        { layer: 'middle', age: 'collapse-era', description: '断裂的传送带，坍塌的厂房，散落在地上的安全帽和工具' },
        { layer: 'deep', age: 'golden-age', description: '精密机床上的生产日志，员工食堂的菜单，公告栏上的加班通知' }
      ]
    },
    {
      id: 'beishan',
      name: '冰原禁区',
      element: 'water',
      fiveElement: '水',
      description: '极寒，常年冰雪覆盖，夏季短暂（仅2个月），冬季长达10个月。冰雪异兽的王国——异兽的皮毛呈现白色或冰蓝色，某些异兽完全由"冰光脉能量"构成。',
      climate: '极寒，常年冰雪覆盖，夏季短暂（仅2个月），冬季长达10个月',
      terrain: '广袤的冰原和雪山，冰川纵横，湖泊在冬季完全冻结。地表呈现一种"骨白色"的特殊色调',
      ecology: '冰雪异兽的王国——异兽的皮毛呈现白色或冰蓝色，某些异兽完全由"冰光脉能量"构成（即它们不是血肉之躯，而是"活着的冰"）。植物极少，但存在特殊的"冰生植物"（如冰晶花、雪莲）',
      ruins: '以能源设施废墟为主——曾经的核电站、风电场现在被冰雪覆盖。核电站的冷却塔成为了巨型鸟巢，风电机的叶片被改造成了异兽的"风力收集器"',
      auraLevel: '极高（但流动性差——光脉能量在低温下"凝固"，虽然浓度高但难以吸收）',
      timeFlow: '极慢（0.5:1）——"在这里，一天像是一年"',
      representativeBeasts: ['冰甲龟兽（冬季栖息地）', '冰属性B级和A级异兽'],
      significanceToXG: '他在这里经历了最严酷的生存考验，也在这里第一次体验到"孤独的美"——冰雪世界的纯净与寂静',
      visualKeywords: ['无尽的冰原', '骨白色的地面', '冰封的废墟', '极光', '巨大的冰雕异兽', '寂静'],
      colorPalette: {
        primary: '#1E90FF',    // 冰蓝
        secondary: '#F5F5F5',  // 苍白
        accent: '#4682B4',     // 银灰
        atmosphere: '#00008B' // 靛蓝
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'memory',           // 记忆频率 — 水属性：凝固、沉淀、回溯
        emotionalTone: 'stillness',    // 情感基调：静止、孤独、永恒
        resonance: 'isolation-awe',      // 与小G的内心共振：孤独→敬畏
        tempo: 'frozen',               // 时间节奏：冻结、缓慢
        visualWeight: 'immense'          // 视觉重量：巨大、无边
      },
      civilizationCycle: {
        goldenAge: '北部能源走廊，核电与风电之都',
        collapseEvent: '冰光脉能量暴走，极寒吞噬一切，时间流速减半',
        currentState: '冰封的核电站冷却塔成巨型鸟巢，风电叶片成风力收集器',
        rebirthSigns: '冰晶花在废墟上绽放，新的冰雪生态链建立'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '冰晶覆盖的地面，极光在废墟上空舞动，新的冰雪植物在缝隙中生长' },
        { layer: 'middle', age: 'collapse-era', description: '被冰封的输电塔，冻结的变压器，散落在雪地上的防护服' },
        { layer: 'deep', age: 'golden-age', description: '核电站控制室的值班表，风电场的维护日志，冰原公路上的路标' }
      ]
    },
    {
      id: 'dongshan',
      name: '虹海之滨',
      element: 'fire',
      fiveElement: '火',
      description: '温暖潮湿，海洋性气候，多台风和海啸。海洋异兽的世界——从C级的小型海洋生物到A级的巨型海兽。海洋中存在着"水下城市"——由珊瑚和光脉能量构成的异兽聚居地。',
      climate: '温暖潮湿，海洋性气候，多台风和海啸',
      terrain: '海岸线漫长，岛屿众多，海底地形复杂（有海底山脉、海底峡谷、海底火山）。部分区域存在"海上浮岛"——由光脉能量支撑的漂浮陆地',
      ecology: '海洋异兽的世界——从C级的小型海洋生物到A级的巨型海兽。海洋中存在着"水下城市"——由珊瑚和光脉能量构成的异兽聚居地。天空中常有飞行异兽盘旋',
      ruins: '以港口城市和舰船废墟为主——曾经的港口现在变成了异兽的"码头"，沉船变成了水下异兽的"公寓"，跨海大桥变成了飞行异兽的"栖息地"',
      auraLevel: '中高（海洋是光脉能量的"存储库"——水性光脉能量在海洋中极为充沛）',
      timeFlow: '稍快（1.2:1）——"海洋不等人"',
      representativeBeasts: ['海洋B级和A级异兽', '飞行异兽', '鲛人（人鱼形态的异兽）'],
      significanceToXG: '他在这里第一次体验"无边无际"——海洋的广阔让他理解"世界之大"，也让他理解"个体之小"',
      visualKeywords: ['无尽的海岸线', '沉船与珊瑚共生', '海上浮岛', '巨型海洋生物的背脊露出水面', '跨海大桥上栖息的飞行异兽'],
      colorPalette: {
        primary: '#00008B',    // 海蓝
        secondary: '#FF4500',  // 橙红
        accent: '#32CD32',     // 翠绿
        atmosphere: '#FFFFFF'  // 白
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'awakening',        // 觉醒频率 — 火属性：爆发、跃迁、无常
        emotionalTone: 'transformation', // 情感基调：变幻、无常、宏大
        resonance: 'wonder-insignificance', // 与小G的内心共振：惊奇→渺小感
        tempo: 'surging',              // 时间节奏：涌动、无常
        visualWeight: 'vast'            // 视觉重量：辽阔、无边
      },
      civilizationCycle: {
        goldenAge: '东部港口带，贸易与航海中心',
        collapseEvent: '海啸与台风在光脉能量作用下成为永恒风暴',
        currentState: '沉船成水下公寓，跨海大桥成飞行异兽栖息地',
        rebirthSigns: '珊瑚与光脉能量构成水下城市，新的海洋文明在废墟上建立'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '珊瑚在沉船上生长，跨海大桥的钢索上筑满鸟巢，海浪冲刷着高速公路' },
        { layer: 'middle', age: 'collapse-era', description: '倾覆的集装箱船，断裂的跨海大桥，被淹没的港口仓库' },
        { layer: 'deep', age: 'golden-age', description: '港口灯塔的航海日志，渔村的祭祀仪式记录，海运公司的货物清单' }
      ]
    },
    {
      id: 'zhongshan',
      name: '中央光域',
      element: 'earth',
      fiveElement: '土',
      description: '多样化——因为海拔差异巨大，从热带雨林到高山冰雪都有。山海世界的"心脏"——最高的山脉（"浮空晶簇山脉"位于此）、最深的峡谷、最大的河流源头。',
      climate: '多样化——因为海拔差异巨大，从热带雨林到高山冰雪都有',
      terrain: '山海世界的"心脏"——最高的山脉（"浮空晶簇山脉"位于此）、最深的峡谷、最大的河流源头。地形复杂多变，是所有区域的"交汇点"',
      ecology: '最古老的异兽栖息于此——中央光域是光脉能量浓度最高的区域，也是"圣所"最密集的区域。这里的异兽普遍等级较高（A级为主），C级异兽极少',
      ruins: '以"文化废墟"为主——曾经的博物馆、图书馆、大学现在成为了"圣所"。这些废墟不是被自然侵蚀，而是被"光脉能量保护"——它们维持着大毁灭前的样子，仿佛时间在这里停止了',
      auraLevel: '极高（世界最高）',
      timeFlow: '不稳定（波动）——"在这里，时间是一个谜"',
      representativeBeasts: ['光翼游天兽（S级）', '虹羽焰灵（S级）', '麒麟（S级）', '雪白智兽（常驻）'],
      significanceToXG: '他在这里完成了《Nirath原创世界观》——浮空晶簇山脉的山顶是"书写"的神圣场所。在这里，他第一次感受到"世界的意识"',
      visualKeywords: ['浮空晶簇山脉的通天之势', '光脉能量汇聚的光柱', '"时间停止"的圣所', '最古老的异兽', '金色的光脉能量云雾'],
      colorPalette: {
        primary: '#FFD700',    // 金
        secondary: '#FFFFFF',  // 白
        accent: '#800080',     // 紫
        atmosphere: '#C0C0C0' // 银
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'grounding',        // 沉淀频率 — 土属性：承载、包容、时间停止
        emotionalTone: 'sacred',       // 情感基调：神圣、庄严、永恒
        resonance: 'understanding-transcendence', // 与小G的内心共振：理解→超越
        tempo: 'timeless',             // 时间节奏：无时间、永恒
        visualWeight: 'monumental'       // 视觉重量： monumental、通天
      },
      civilizationCycle: {
        goldenAge: '中央文化带，知识与人文中心，博物馆与大学之城',
        collapseEvent: '光脉能量浓度达到峰值，时间流速不稳定，圣所形成',
        currentState: '博物馆与图书馆被光脉能量保护，时间停止，圣所遍布',
        rebirthSigns: '新的知识体系在圣所中诞生，文明记忆被光脉能量永久保存'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '光脉能量云雾缭绕，金色光柱通天，圣所中的文物完好如初，仿佛时间从未流逝' },
        { layer: 'middle', age: 'collapse-era', description: '光脉能量暴走时的能量痕迹，扭曲的时空裂缝，被光脉能量封印的灾难瞬间' },
        { layer: 'deep', age: 'golden-age', description: '大学图书馆的借阅卡，博物馆的导览手册，学术会议的演讲稿，孩子们在学校墙上的涂鸦' }
      ]
    },
    {
      id: 'haiwai',
      name: '浮空群岛经',
      element: 'chaos',
      fiveElement: '无（混合）',
      description: '不可预测——因为光脉能量混乱，天气在几分钟内可以从晴空变为暴风雨。远离大陆的岛屿群，某些岛屿不在海面上——它们漂浮在空中或半沉在水中。',
      climate: '不可预测——因为光脉能量混乱，天气在几分钟内可以从晴空变为暴风雨',
      terrain: '远离大陆的岛屿群，某些岛屿不在海面上——它们漂浮在空中或半沉在水中。地理坐标不稳定——某些岛屿会在不同时刻出现在不同位置',
      ecology: '"实验性"生态——因为光脉能量混乱，这里的生物形态极为奇特。某些异兽具有"混合属性"（如同时具有火性和水性的矛盾体）。这里的生态"不稳定"——物种可能在一夜之间进化或灭绝',
      ruins: '以"未知废墟"为主——某些废墟不属于旧世界，它们可能是"上一轮文明"的遗迹。这些废墟散发着不属于2147年或上古时代的"异质感"',
      auraLevel: '混乱（极高或极低，没有规律）',
      timeFlow: '极不稳定——某些岛屿上，时间可能在几秒内完成一年的循环',
      representativeBeasts: ['各种"奇异形态"的异兽', '"混血"异兽', '"灵体"异兽（没有实体，只有光脉能量构成的虚影）'],
      significanceToXG: '他在这里第一次面对"不可理解"——浮空群岛经的混乱让他理解，世界不是"可以被完全理解"的。这种"不可理解"是美的一部分',
      visualKeywords: ['漂浮的岛屿', '空中瀑布', '光脉能量漩涡', '"不属于这个世界"的植物', '时间的错乱（如同时存在春夏秋冬的同一棵树）'],
      colorPalette: {
        primary: '#4B0082',    // 深紫
        secondary: '#00CED1',  // 青绿
        accent: '#FFD700',     // 金
        atmosphere: '#000000'  // 黑
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'chaos',          // 混沌频率 — 无属性：不可预测、矛盾、超越
        emotionalTone: 'disorientation', // 情感基调：迷失、不可理解、超越认知
        resonance: 'confusion-awe',      // 与小G的内心共振：困惑→敬畏
        tempo: 'erratic',              // 时间节奏：错乱、无规律
        visualWeight: 'impossible'       // 视觉重量：不可能的、超越物理
      },
      civilizationCycle: {
        goldenAge: '上一轮文明，不属于2147年',
        collapseEvent: '不属于任何已知历史，废墟散发着异质感',
        currentState: '漂浮岛屿，空中瀑布，光脉能量漩涡，不属于这个世界的存在',
        rebirthSigns: '新的"实验性"生态在混乱中诞生，混血异兽进化'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '漂浮的岛屿在空中漂移，空中瀑布逆流而上，同一棵树同时存在春夏秋冬' },
        { layer: 'middle', age: 'unknown', description: '不属于任何时代的废墟，散发着异质感的建筑残骸，无法解读的符号' },
        { layer: 'deep', age: 'pre-civilization', description: '上一轮文明的遗迹，超越理解的技术痕迹，不属于这个世界的物质' }
      ]
    },
    {
      id: 'dahuang',
      name: '荒芜星原经',
      element: 'void',
      fiveElement: '无（混沌）',
      description: '不存在"天气"——荒芜星原经没有"天气"，因为它已经接近世界的"边界"。荒原——不是沙漠，不是冰原，而是"一切都被抹平"的空白。',
      climate: '不存在——荒芜星原经没有"天气"，因为它已经接近世界的"边界"',
      terrain: '荒原——不是沙漠，不是冰原，而是"一切都被抹平"的空白。地面呈现"骨白色"，没有任何植被。天空呈现灰白色，没有云。这里没有任何声音',
      ecology: '几乎没有生命——荒芜星原经是山海世界的"死亡地带"。但这里存在"边界守卫"（S级异兽，如守光巨兽），它们是世界的"免疫系统"，防止任何生命（或信息）越过边界',
      ruins: '几乎没有废墟——荒芜星原经不接受任何"存在"。任何进入荒芜星原经的物质都会逐渐"消散"——不是腐烂，而是"信息丢失"',
      auraLevel: '极低（接近零）',
      timeFlow: '几乎静止（0.1:1）——"在这里，永恒就是一瞬间"',
      representativeBeasts: ['守光巨兽（S级，世界的"守夜人"）', '"边界守卫"（不可见的存在）'],
      significanceToXG: '他在这里第一次面对"终结"——荒芜星原经的空白让他理解了"存在"的珍贵。这里的"什么都没有"让他更加珍惜"有什么"',
      visualKeywords: ['骨白色的荒原', '灰色的天空', '"正在褪色"的世界', '寂静', '空白', '边缘'],
      colorPalette: {
        primary: '#808080',    // 灰
        secondary: '#FFFFFF',  // 白
        accent: '#000000',     // 黑
        atmosphere: '#FFD700'  // 金
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'void',           // 虚空频率 — 无属性：空白、终结、永恒静止
        emotionalTone: 'absence',      // 情感基调：缺失、终结、存在的珍贵
        resonance: 'loss-gratitude',     // 与小G的内心共振：失去→感恩
        tempo: 'eternal',              // 时间节奏：永恒、静止
        visualWeight: 'infinite'         // 视觉重量：无限、无边空白
      },
      civilizationCycle: {
        goldenAge: '无——荒芜星原经不存在"文明"',
        collapseEvent: '世界的边界，一切存在的终点',
        currentState: '空白——一切都被抹平，骨白色的荒原，没有声音',
        rebirthSigns: '边界守卫（守光巨兽）的存在本身就是世界的免疫系统'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '骨白色的荒原，灰色的天空，正在褪色的世界，寂静中没有声音' },
        { layer: 'middle', age: 'dissolution', description: '物质逐渐消散的过程——不是腐烂，是信息丢失，存在被抹除的痕迹' },
        { layer: 'deep', age: 'pre-existence', description: '世界诞生之前的空白，没有时间，没有空间，没有存在——只有永恒的寂静' }
      ]
    },
    {
      id: 'hainei',
      name: '内海光域经',
      element: 'composite',
      fiveElement: '五大元素交汇',
      description: '不存在"天气"——内海光域经不是"地表"，而是"地下深层"和"海底"的世界。地下洞穴系统、海底峡谷、地下河流。内海光域经是一个"倒置的世界"——头顶是岩石（地面），脚下是深渊。',
      climate: '不存在——内海光域经不是"地表"，而是"地下深层"和"海底"的世界',
      terrain: '地下洞穴系统、海底峡谷、地下河流。内海光域经是一个"倒置的世界"——头顶是岩石（地面），脚下是深渊。某些区域存在"倒挂的城市"——由光脉能量支撑的地下异兽文明',
      ecology: '地下异兽的文明——这里存在着完整的异兽社会结构、"建筑"（由矿物质和光脉能量构成的洞穴城市）、"艺术"（石壁上的光脉能量纹路）。某些异兽从未见过阳光，它们的世界就是内海光域经',
      ruins: '以"深层科技废墟"为主——地下实验室、地下核设施、海底基地。这些废墟被"光脉能量矿化"——它们的表面覆盖着厚厚的光脉能量结晶，看起来像是"发光的矿石"',
      auraLevel: '高（内海光域经是光脉能量的"源头"之一——光脉能量从地核涌出，通过内海光域经流向地表）',
      timeFlow: '极慢（0.3:1）——"地下的时间是沉睡的时间"',
      representativeBeasts: ['地下A级和S级异兽', '"光脉能量精灵"（没有实体，只有光脉能量构成的发光体）'],
      significanceToXG: '他在这里发现了"深层记忆"——内海光域经是旧世界信息的"底层存储库"。在这里，他可以"读取"到比地表更完整的旧世界记忆',
      visualKeywords: ['发光的地下洞穴', '倒挂的城市', '光脉能量瀑布（从天花板流向地面）', '水晶化的科技废墟', '地下海洋'],
      colorPalette: {
        primary: '#FFD700',    // 暖黄
        secondary: '#000000',  // 黑
        accent: '#8B4513',     // 深褐
        atmosphere: '#FFD700'  // 金
      },
      // ========== 世界模拟引擎融入：情感频段 + 文明周期 ==========
      emotionalFrequency: {
        frequency: 'depth',          // 深度频率 — 五大元素交汇：沉淀、记忆、倒置
        emotionalTone: 'mystery',      // 情感基调：神秘、深层、倒置的世界
        resonance: 'discovery-memory',   // 与小G的内心共振：发现→深层记忆
        tempo: 'submerged',            // 时间节奏：沉没、缓慢、倒置
        visualWeight: 'heavy-inverted'   // 视觉重量：沉重、倒置、地下
      },
      civilizationCycle: {
        goldenAge: '地下深层城市，倒置文明',
        collapseEvent: '光脉能量从地核涌出，地下世界被光脉能量矿化',
        currentState: '发光的地下洞穴，倒挂的城市，光脉能量瀑布从天花板流向地面',
        rebirthSigns: '地下异兽文明建立完整社会结构，石壁上的光脉能量纹路成为新的艺术'
      },
      timeLayers: [
        { layer: 'surface', age: 'present', description: '发光的地下洞穴，倒挂的城市建筑，光脉能量瀑布从天花板流向地面，水晶化的科技废墟' },
        { layer: 'middle', age: 'collapse-era', description: '地下实验室被光脉能量淹没，海底基地被矿化，倒置的结构在重力反转中重组' },
        { layer: 'deep', age: 'golden-age', description: '地下城市的居民名册，海底基地的航海日志，倒置建筑的 engineering blueprints' }
      ]
    }
  ],
  
  // 圣所
  sanctuaries: [
    { name: '浮空晶簇山脉', location: '中央光域中心', description: '世界的"最高峰"，山顶永远被金色云雾环绕。时间流速极慢（0.1:1）', narrativeFunction: '小G完成《Nirath原创世界观》的地点' },
    { name: '虹脉深渊', location: '荒芜星原经边缘', description: '世界的"边界"——一个巨大的深渊，海水流入其中消失不见', narrativeFunction: '时间循环真相的揭示地点' },
    { name: '浮空晶簇山虚', location: '晶脉山脉深处', description: '一座"活"的金属山脉——山体由流动的金属构成，内部有"脉动"', narrativeFunction: '雪白智兽的"知识圣殿"' },
    { name: '蓬莱', location: '浮空群岛经', description: '一座漂浮的岛屿，永远在海平面上漂浮，不可登陆', narrativeFunction: '"可望而不可即"的象征' },
    { name: '灵木原', location: '光之森域', description: '一片由巨型发光树木构成的森林——树木高达千米，树冠在云层之上', narrativeFunction: '光囊母兽的"诞生地"' }
  ],
  
  // 区域间通道
  passages: [
    { type: '自然通道', description: '河流、山脉隘口、海底隧道——光脉能量屏障较弱的区域' },
    { type: '冰甲龟兽的"水道"', description: '冰甲龟兽知道一些水下的秘密通道——它们是冰甲龟兽一族代代相传的"地图"' },
    { type: '雪白智兽的"知识之门"', description: '雪白智兽可以通过某种方式"打开"光脉能量屏障的缺口——这需要消耗巨大的光脉能量' },
    { type: '"太素时刻"通道', description: '在太素时刻（时间停止的瞬间），光脉能量屏障会暂时消失——这是穿越区域的最快方式，但也最危险' }
  ],
  
  // 旧世界遗迹
  ruins: {
    cities: [
      { type: '城市废墟', state: '大部分建筑已倒塌，被植物覆盖', transformation: '摩天大楼→巨型藤蔓支架；地铁→地下河流；道路→动物迁徙通道', narrativeFunction: '小G探索的场所、旧世界记忆的触发器' },
      { type: '科技设施', state: '核电站、实验室等已停止运转，但部分"光脉能量化"', transformation: '核反应堆→"光脉能量炉"；超级计算机→"共鸣石"；卫星→"天河"', narrativeFunction: '"神器"的来源、旧世界知识的存储' },
      { type: '交通工具', state: '汽车、飞机等已锈蚀，被生态利用', transformation: '汽车→灵兽巢穴；飞机→飞行异兽栖息处；舰船→水下异兽公寓', narrativeFunction: '小G冒险的场所、"过去文明"的象征' },
      { type: '文化设施', state: '图书馆、博物馆等部分保存较好（因光脉能量保护）', transformation: '图书馆→"知识圣所"；博物馆→"记忆殿堂"；学校→"幼年异兽的庇护所"', narrativeFunction: '旧世界文化的载体、"记忆传承"的场所' }
    ]
  }
};

// ============ 五大元素色彩体系 ============
const FIVE_ELEMENTS = {
  metal: {
    name: '金',
    colors: ['#FFFFFF', '#C0C0C0', '#FFD700', '#F5F5F5'],
    hex: ['#FFFFFF', '#C0C0C0', '#FFD700', '#F5F5F5', '#E8E8E8'],
    direction: '西',
    season: '秋',
    taste: '辛'
  },
  wood: {
    name: '木',
    colors: ['#228B22', '#006400', '#00CED1', '#90EE90'],
    hex: ['#228B22', '#006400', '#00CED1', '#90EE90', '#3CB371'],
    direction: '东',
    season: '春',
    taste: '酸'
  },
  water: {
    name: '水',
    colors: ['#000000', '#00008B', '#1E90FF', '#C0C0C0'],
    hex: ['#000000', '#00008B', '#1E90FF', '#C0C0C0', '#4682B4'],
    direction: '北',
    season: '冬',
    taste: '咸'
  },
  fire: {
    name: '火',
    colors: ['#FF4500', '#DC143C', '#FF8C00', '#FFD700'],
    hex: ['#FF4500', '#DC143C', '#FF8C00', '#FFD700', '#FF6347'],
    direction: '南',
    season: '夏',
    taste: '苦'
  },
  earth: {
    name: '土',
    colors: ['#8B4513', '#D2691E', '#A0522D', '#FFD700'],
    hex: ['#8B4513', '#D2691E', '#A0522D', '#FFD700', '#CD853F'],
    direction: '中',
    season: '长夏',
    taste: '甘'
  }
};

// ============ 天象-情绪映射 ============
const CELESTIAL_PHENOMENA = {
  '守光巨兽睁眼': { emotion: '庄严', visual: '天地亮度瞬间切换，光线如瀑布倾泻', template: 'origin_myth' },
  '虹羽焰灵涅槃': { emotion: '激昂', visual: '火焰漩涡中重生，声波如光环扩散', template: 'transformation_journey' },
  '九尾幻术': { emotion: '妖异', visual: '景物如水墨溶解，空间扭曲', template: 'encounter_fable' },
  '光翼游天兽坠天': { emotion: '悲壮', visual: '龙翼折断，从云端缓缓坠落', template: 'divine_conflict' },
  '麒麟降世': { emotion: '祥和', visual: '祥瑞光晕如莲花绽放，金莲铺路', template: 'chorus_harmony' },
  '晶齿萌兽吞噬': { emotion: '恐惧', visual: '暗能量漩涡，万物被吸入深渊', template: 'encounter_fable' }
};

// ============ 世界观引擎核心类 ============
class WorldEngine {
  constructor() {
    this.geography = GEOGRAPHY;
    this.elements = FIVE_ELEMENTS;
    this.celestial = CELESTIAL_PHENOMENA;
  }
  
  /**
   * 生成场景描述
   */
  generateSceneDescription(locationName, timeOfDay = 'dusk', weather = 'clear', mood = 'mysterious') {
    const location = this.findLocation(locationName);
    if (!location) {
      throw new Error(`[WorldEngine] 未知地点: ${locationName}`);
    }
    
    const element = this.elements[location.element];
    
    // 时间视觉效果
    const timeVisuals = {
      dawn: '晨曦初露，天光如墨汁稀释',
      noon: '烈日当空，光线如刀剑直射',
      dusk: '夕阳西下，天光如熔金流淌',
      midnight: '星辰满天，月光如霜洒落',
      eternal_twilight: '永恒黄昏，天光从龙瞳中透出'
    };
    
    // 天气视觉效果
    const weatherVisuals = {
      clear: '天清气爽，视野辽阔',
      cloudy: '云层翻涌，光影变幻',
      foggy: '浓雾弥漫，神秘莫测',
      rainy: '雨丝如墨线垂落，地面泛起涟漪',
      stormy: '雷电交加，天地变色',
      snowy: '雪花如羽毛飘落，世界银装素裹'
    };
    
    // 情绪氛围词
    const moodDescriptors = {
      mysterious: '神秘莫测，仿佛隐藏着古老秘密',
      solemn: '庄严肃穆，令人心生敬畏',
      serene: '宁静祥和，时间仿佛静止',
      terrifying: '恐怖压抑，危险潜伏',
      melancholic: '苍凉悲壮，带着岁月沧桑',
      joyful: '生机勃勃，万物欢腾'
    };
    
    return {
      location: location.name,
      type: location.type,
      ruler: location.ruler,
      features: location.features,
      element: element.name,
      elementColors: element.colors,
      timeVisual: timeVisuals[timeOfDay] || timeVisuals.dusk,
      weatherVisual: weatherVisuals[weather] || weatherVisuals.clear,
      moodDescriptor: moodDescriptors[mood] || moodDescriptors.mysterious,
      fullDescription: `${location.name}，${location.features.join('、')}。${timeVisuals[timeOfDay]}，${weatherVisuals[weather]}。${moodDescriptors[mood]}。五大元素属${element.name}，主色调${element.colors.join('、')}。`
    };
  }
  
  /**
   * 生成五大元素色盘（供渲染使用）
   */
  generateColorPalette(elementKey) {
    const element = this.elements[elementKey];
    if (!element) {
      // 回退到通用色盘
      return ['#DC143C', '#FFD700', '#1A1A1A', '#FF4500', '#8B4513'];
    }
    return element.hex;
  }
  
  /**
   * 获取天象映射
   */
  getCelestialPhenomenon(name) {
    return this.celestial[name];
  }
  
  /**
   * 查找地点
   */
  findLocation(name) {
    const allLocations = [
      ...this.geography.mountains,
      ...this.geography.seas,
      ...this.geography.wilderness
    ];
    return allLocations.find(loc => loc.name === name);
  }
  
  /**
   * 获取五大元素信息
   */
  getElementInfo(elementKey) {
    return this.elements[elementKey];
  }
  
  /**
   * 获取区域与小G的关系/意义
   */
  getRegionSignificanceToXG(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    return region ? region.significanceToXG : null;
  }
  
  /**
   * 获取区域时间流速
   */
  getRegionTimeFlow(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    return region ? region.timeFlow : '正常（1:1）';
  }
  
  /**
   * 获取区域光脉能量浓度
   */
  getRegionAuraLevel(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    return region ? region.auraLevel : '未知';
  }
  
  /**
   * 获取区域代表异兽
   */
  getRegionRepresentativeBeasts(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    return region ? region.representativeBeasts : [];
  }
  
  /**
   * 获取区域视觉关键词（供渲染使用）
   */
  getRegionVisualKeywords(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    return region ? region.visualKeywords : [];
  }
  
  /**
   * 获取圣所信息
   */
  getSanctuary(name) {
    return this.geography.sanctuaries.find(s => s.name === name);
  }
  
  /**
   * 获取所有圣所列表
   */
  getAllSanctuaries() {
    return this.geography.sanctuaries;
  }
  
  /**
   * 获取区域间通道
   */
  getPassages() {
    return this.geography.passages;
  }
  
  /**
   * 获取旧世界遗迹信息
   */
  getRuinsInfo() {
    return this.geography.ruins;
  }
  
  /**
   * 生成区域完整档案（供导演/剧本使用）
   */
  generateRegionProfile(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    if (!region) return null;
    
    return {
      id: region.id,
      name: region.name,
      fiveElement: region.fiveElement,
      element: region.element,
      climate: region.climate,
      terrain: region.terrain,
      ecology: region.ecology,
      ruins: region.ruins,
      auraLevel: region.auraLevel,
      timeFlow: region.timeFlow,
      representativeBeasts: region.representativeBeasts,
      significanceToXG: region.significanceToXG,
      visualKeywords: region.visualKeywords,
      colorPalette: region.colorPalette,
      // 渲染参数
      renderParams: {
        primaryColor: region.colorPalette.primary,
        secondaryColor: region.colorPalette.secondary,
        accentColor: region.colorPalette.accent,
        atmosphereColor: region.colorPalette.atmosphere,
        elementColors: this.elements[region.element]?.hex || []
      }
    };
  }
  
  /**
   * 验证区域色彩编码是否符合故事内核设定
   */
  validateRegionColorPalette(regionId) {
    const region = this.geography.regions.find(r => r.id === regionId);
    if (!region) return { valid: false, reason: '区域不存在' };
    
    const expectedColors = {
      nanshan: { primary: '#228B22', secondary: '#FFD700' },
      xishan: { primary: '#8B4513', secondary: '#C0C0C0' },
      beishan: { primary: '#1E90FF', secondary: '#F0F8FF' },
      dongshan: { primary: '#FF4500', secondary: '#4682B4' },
      zhongshan: { primary: '#FFD700', secondary: '#FFFFFF' },
      haiwai: { primary: '#8A2BE2', secondary: '#00CED1' },
      dahuang: { primary: '#808080', secondary: '#FFFFFF' },
      hainei: { primary: '#DAA520', secondary: '#000000' }
    };
    
    const expected = expectedColors[regionId];
    if (!expected) return { valid: true, note: '无预设验证规则' };
    
    return {
      valid: region.colorPalette.primary === expected.primary,
      expected,
      actual: region.colorPalette,
      region: region.name
    };
  }
}

// ============ 导出 ============
module.exports = {
  WorldEngine,
  GEOGRAPHY,
  FIVE_ELEMENTS,
  CELESTIAL_PHENOMENA
};

// CLI 测试入口
if (require.main === module) {
  const engine = new WorldEngine();
  
  console.log('\n🌍 Nirath原创世界观世界观引擎测试\n');
  
  const scene = engine.generateSceneDescription('章尾山', 'eternal_twilight', 'stormy', 'solemn');
  console.log('场景描述：', scene.fullDescription);
  
  console.log('\n五大元素色盘（火）：', engine.generateColorPalette('fire'));
  
  console.log('\n天象映射（守光巨兽睁眼）：', engine.getCelestialPhenomenon('守光巨兽睁眼'));
}