/**
 * Scale-Aware Shot Designer v1.0-Peng
 * 
 * 尺度感知镜头设计系统 —— 基于异兽与人物的真实比例，自动生成差异化景别策略
 * 
 * 核心设计原则：
 * 1. 异兽大小差异巨大（从一尺到千里），不能对所有异兽使用同一套镜头语言
 * 2. 人物（小G，8岁，约1.3米）是固定的尺度参考锚点
 * 3. 镜头设计必须让观衆 "感知" 到异兽的真实大小
 * 
 * 景别策略：
 * - 远景：展示异兽全貌（或全貌的局部，当异兽太大时）
 * - 中景：对异兽来说是"特写"，对人物来说是"全景"（展示比例关系）
 * - 近景：刻画人物表情（异兽作为背景或画面边缘）
 */

const { loadBeastArchive } = require('./beast-engine.js');

// 人物参考尺度（小G）
const HUMAN_HEIGHT = 1.3; // 米

// 异兽尺度分类体系
const SCALE_CATEGORIES = {
  MICRO:    { label: '微型',     maxMeters: 2,    ratioLabel: '1-1.5x', description: '比人小或与人相近' },
  MEDIUM:   { label: '中型',     maxMeters: 10,   ratioLabel: '2-7x',   description: '数倍于人，可同框' },
  LARGE:    { label: '大型',     maxMeters: 50,   ratioLabel: '7-35x',  description: '数十倍于人，压迫感' },
  HUGE:     { label: '巨型',     maxMeters: 100,  ratioLabel: '35-75x', description: '百倍于人，如山岳' },
  COLOSSAL: { label: '超巨型',   maxMeters: 1000, ratioLabel: '100-750x', description: '如山如城' },
  MYTHIC:   { label: '神话级',   maxMeters: Infinity, ratioLabel: '750x+', description: '千里绵延' }
};

// 中文尺度词解析映射
const CHINESE_SCALE_PATTERNS = [
  { pattern: /一尺|1尺/,        meters: 0.3 },
  { pattern: /二尺|2尺/,        meters: 0.6 },
  { pattern: /三尺|3尺/,        meters: 0.9 },
  { pattern: /一丈|1丈/,        meters: 3.3 },
  { pattern: /三丈|3丈/,        meters: 10 },
  { pattern: /数丈/,            meters: 15 },
  { pattern: /丈余|十余米/,     meters: 12 },
  { pattern: /十米|10米/,       meters: 10 },
  { pattern: /数十米/,          meters: 30 },
  { pattern: /百米|100米/,      meters: 100 },
  { pattern: /百丈/,            meters: 330 },
  { pattern: /数百米/,          meters: 500 },
  { pattern: /千里|1000里/,     meters: 500000 },
  { pattern: /不知几千里/,      meters: 1000000 },
  { pattern: /千寻/,            meters: 500000 },
  { pattern: /一米五|1.5米/,    meters: 1.5 },
  { pattern: /中型|中等/,       meters: 5 },
  { pattern: /大型|巨大/,       meters: 20 },
  { pattern: /巨型|庞大/,       meters: 80 },
  { pattern: /超巨型/,          meters: 500 },
  { pattern: /微型|小型|幼/,    meters: 1 },
];

/**
 * 解析异兽尺度（米）
 * @param {string} scaleText - bodyParts.scale 或 cinema.scale 的文本
 * @returns {number} - 估算的米数
 */
function parseBeastScale(scaleText) {
  if (!scaleText) return 10; // 默认值
  
  for (const { pattern, meters } of CHINESE_SCALE_PATTERNS) {
    if (pattern.test(scaleText)) {
      return meters;
    }
  }
  
  // 尝试数字提取
  const numMatch = scaleText.match(/(\d+(?:\.\d+)?)\s*(米|m|丈|尺)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    const unit = numMatch[2];
    if (unit === '丈') return num * 3.3;
    if (unit === '尺') return num * 0.33;
    return num;
  }
  
  return 10; // 默认大型
}

/**
 * 获取异兽的尺度分类
 * @param {number} meters - 异兽高度（米）
 * @returns {string} - 分类标识
 */
function getScaleCategory(meters) {
  if (meters < 2) return 'MICRO';
  if (meters < 10) return 'MEDIUM';
  if (meters < 50) return 'LARGE';
  if (meters < 100) return 'HUGE';
  if (meters < 1000) return 'COLOSSAL';
  return 'MYTHIC';
}

/**
 * 计算人物与异兽的视觉比例描述
 * @param {number} beastMeters - 异兽高度
 * @returns {string} - 比例描述文本
 */
function getVisualRatioDescription(beastMeters) {
  const ratio = beastMeters / HUMAN_HEIGHT;
  
  if (ratio < 1) {
    return `比小G还小巧，小G可以把它抱在怀里`;
  } else if (ratio < 2) {
    return `与小G身高相近，可以并肩同行`;
  } else if (ratio < 5) {
    return `是小G的${Math.round(ratio)}倍高，需要仰望`;
  } else if (ratio < 15) {
    return `是小G的${Math.round(ratio)}倍高，小G只到它的膝盖`;
  } else if (ratio < 40) {
    return `是小G的${Math.round(ratio)}倍高，小G在它脚下像只小蚂蚁`;
  } else if (ratio < 100) {
    return `是小G的${Math.round(ratio)}倍高，小G站在它面前如同站在摩天大楼下`;
  } else if (ratio < 1000) {
    return `是小G的${Math.round(ratio)}倍高，小G如同站在一座山峰脚下`;
  } else {
    return `绵延千里，小G如同微尘般渺小`;
  }
}

/**
 * 生成尺度感知的 Prompt 注入文本
 * @param {number} beastMeters - 异兽高度
 * @param {string} shotType - 镜头类型: wide|medium|close
 * @returns {string} - 注入文本
 */
function generateScalePrompt(beastMeters, shotType = 'medium') {
  const category = getScaleCategory(beastMeters);
  const ratio = beastMeters / HUMAN_HEIGHT;
  
  const prompts = {
    wide: {
      MICRO:    `全身入镜，小G与异兽同框站立，比例相近，背景为${beastMeters > 2 ? '开阔原野' : '花丛草丛'}`,
      MEDIUM:   `异兽全身入镜占据画面主体，小G站在异兽旁边作为比例参考，突出${Math.round(ratio)}倍身高差`,
      LARGE:    `异兽全身巍峨耸立，小G在画面一角显得渺小，仰视视角强调巨兽压迫感`,
      HUGE:     `异兽如山岳般矗立，只能拍摄到腰部以上，小G在画面底部如蚂蚁般微小`,
      COLOSSAL: `航拍视角，异兽身躯如山脉横亘，小G只是一个几乎不可见的黑点`,
      MYTHIC:   `卫星视角，异兽绵延如大地本身，小G在画面中完全不可见，仅通过环境比例暗示存在`
    },
    medium: {
      MICRO:    `异兽半身特写，小G在旁抚摸或观察，展现亲密互动`,
      MEDIUM:   `异兽躯干特写占据画面2/3，小G入镜作为比例尺，展现${Math.round(ratio)}倍震撼差异`,
      LARGE:    `异兽躯干局部（如腿部/腹部）填满画面，小G在画面边缘仰望，形成强烈尺度对比`,
      HUGE:     `异兽一个器官（如眼睛/爪掌）占据画面主体，小G站在器官下方显得极其渺小`,
      COLOSSAL: `异兽鳞片/皮肤纹理的局部特写，纹理缝隙间小G如同在峡谷中行走`,
      MYTHIC:   `异兽的一个微小局部（如一根睫毛/一片鳞屑），小G在其上攀登或站立`
    },
    close: {
      MICRO:    `小G面部特写，异兽在肩头或怀中，眼神互动`,
      MEDIUM:   `小G面部特写，背景中异兽模糊的身形作为环境元素`,
      LARGE:    `小G面部特写，背景被异兽的巨大身躯填满（如皮毛纹理/鳞片）`,
      HUGE:     `小G面部特写，瞳孔中倒映着异兽的巨大身影`,
      COLOSSAL: `小G仰望的面部特写，下巴抬高，眼中映出头顶遮天蔽日的巨兽轮廓`,
      MYTHIC:   `小G面部特写，表情是面对"天地本身"的震撼与敬畏，背景是异兽身躯如天空般延伸`
    }
  };
  
  return prompts[shotType]?.[category] || prompts.medium.MEDIUM;
}

/**
 * 生成完整的景别策略
 * @param {string} beastId - 异兽ID
 * @returns {Object} - 景别策略对象
 */
function generateShotScaleStrategy(beastId) {
  const archive = loadBeastArchive(beastId);
  if (!archive) return null;
  
  // 优先使用 bodyParts.scale，其次 cinema.scale
  const scaleText = archive.bodyParts?.scale || archive.cinema?.scale || '大型';
  const meters = parseBeastScale(scaleText);
  const category = getScaleCategory(meters);
  const categoryInfo = SCALE_CATEGORIES[category];
  const ratioDesc = getVisualRatioDescription(meters);
  
  // 根据尺度计算推荐的镜头组合
  const shotDistribution = calculateShotDistribution(category, meters);
  
  return {
    beastId,
    beastName: archive.name,
    beastNameEn: archive.nameEn,
    scaleText,
    estimatedMeters: meters,
    category,
    categoryLabel: categoryInfo.label,
    ratioToHuman: (meters / HUMAN_HEIGHT).toFixed(1),
    ratioDescription: ratioDesc,
    humanReference: `小G（8岁男孩，身高${HUMAN_HEIGHT}米）`,
    
    // 三种景别的 Prompt 注入文本
    widePrompt: generateScalePrompt(meters, 'wide'),
    mediumPrompt: generateScalePrompt(meters, 'medium'),
    closePrompt: generateScalePrompt(meters, 'close'),
    
    // 镜头数量分配建议
    shotDistribution,
    
    // 运镜特殊建议
    cameraAdvice: generateCameraAdvice(category, meters),
    
    // 构图建议
    compositionAdvice: generateCompositionAdvice(category, meters)
  };
}

/**
 * 计算镜头数量分配
 * @param {string} category - 尺度分类
 * @param {number} meters - 米数
 * @returns {Object} - 分配方案
 */
function calculateShotDistribution(category, meters) {
  const distributions = {
    // 微型：强调互动，近景多
    MICRO:    { wide: 2, medium: 3, close: 3, total: 8,  emphasis: '互动与情感' },
    // 中型：平衡，展示比例差异
    MEDIUM:   { wide: 2, medium: 4, close: 2, total: 8,  emphasis: '比例对比' },
    // 大型：强调压迫感，中景展示巨大身躯
    LARGE:    { wide: 3, medium: 3, close: 2, total: 8,  emphasis: '压迫与敬畏' },
    // 巨型：远景展示全貌，中景展示局部巨大
    HUGE:     { wide: 4, medium: 3, close: 1, total: 8,  emphasis: '如山岳的体量' },
    // 超巨型：几乎全是远景和超大全景
    COLOSSAL: { wide: 5, medium: 2, close: 1, total: 8,  emphasis: '天地般的存在' },
    // 神话级：只能展示局部，人物永远渺小
    MYTHIC:   { wide: 4, medium: 3, close: 1, total: 8,  emphasis: '神话尺度' }
  };
  
  return distributions[category] || distributions.MEDIUM;
}

/**
 * 生成运镜特殊建议
 * @param {string} category - 尺度分类
 * @param {number} meters - 米数
 * @returns {Array} - 建议列表
 */
function generateCameraAdvice(category, meters) {
  const advice = {
    MICRO: [
      '低角度仰拍：让小G显得高大，异兽显得可爱',
      '平视互动镜头：两者眼神交流',
      '手持跟随：捕捉亲密互动瞬间'
    ],
    MEDIUM: [
      '低角度仰拍：强调异兽的高度优势',
      '水平推移：展示两者并肩行走的比例差异',
      '从小G视角向上仰拍：让观众代入小G的仰视感受'
    ],
    LARGE: [
      '极低角度仰拍（worm view）：强调巨兽压迫感',
      '从异兽脚下向上推移：展示从地面到头顶的全程',
      '小G视角：镜头从地面快速上摇至巨兽面部',
      '航拍/无人机视角：展示巨兽全貌'
    ],
    HUGE: [
      '航拍：展示如山岳般的全貌',
      '从山崖/树梢俯拍小G仰望：展示人与山的对比',
      '超广角镜头：边缘畸变强化巨兽体量',
      'FPV穿越：从小G身边起飞，穿越巨兽身躯缝隙'
    ],
    COLOSSAL: [
      '卫星/航拍视角：巨兽如山脉绵延',
      '从云层向下俯拍：巨兽背脊如大地',
      '延时摄影：展示巨兽呼吸时身体的起伏如山崩',
      'FPV从巨兽鳞片缝隙中穿梭飞行'
    ],
    MYTHIC: [
      '地图/卫星视角：展示千里绵延的全貌',
      '从太空俯瞰：巨兽如大陆板块',
      '穿越云层：展示巨兽在云海中的部分身躯',
      '极端特写：一根毛发如参天古树'
    ]
  };
  
  return advice[category] || advice.MEDIUM;
}

/**
 * 生成构图建议
 * @param {string} category - 尺度分类
 * @param {number} meters - 米数
 * @returns {Array} - 建议列表
 */
function generateCompositionAdvice(category, meters) {
  const advice = {
    MICRO: [
      '三分法：异兽和小G各在一侧，中间留白增强互动感',
      '前景虚化：用花草作为前景，营造亲近自然的氛围',
      '对称构图：两者居中，背景是柔和的自然环境'
    ],
    MEDIUM: [
      '参照物构图：小G作为"尺度尺"站在异兽旁边',
      '框架构图：用树木或岩石框住两者，强调他们在自然中的位置',
      '引导线：地面纹路或河流引导视线从人物到异兽'
    ],
    LARGE: [
      '小人构图（Small Figure）：小G放在画面一角，巨兽占据主体',
      '留白压迫：巨兽占据画面上半部，下半部留白让压迫感更强',
      '镜像水面：如果有水，利用倒影 doubling 巨兽的视觉体量'
    ],
    HUGE: [
      '极简构图：巨兽只露局部，大量留白营造未知恐惧',
      '对比构图：画面底部是小G，上方是巨兽的身躯如天空',
      '层次构图：前景小G → 中景岩石 → 远景巨兽，三层深度'
    ],
    COLOSSAL: [
      '抽象构图：巨兽的身躯成为画面的"纹理"和"地形"',
      '负空间：巨兽的轮廓切割天空，形成几何感',
      '人类痕迹：小G在巨兽身上留下的微小痕迹（如攀爬的绳索）作为比例尺'
    ],
    MYTHIC: [
      '宏观构图：将巨兽作为"地形"来处理，如同拍摄山脉或峡谷',
      '微宏观对比：同一场景中既有巨兽的局部特景，又有小G的渺小身影',
      '天体构图：将巨兽与天空、星辰并置，如同神话画卷'
    ]
  };
  
  return advice[category] || advice.MEDIUM;
}

/**
 * 为镜头注入尺度感知的描述
 * @param {Object} shot - 镜头对象
 * @param {string} beastId - 异兽ID
 * @param {string} shotType - 镜头类型
 * @returns {string} - 注入后的描述
 */
function injectScaleAwareness(shot, beastId, shotType = 'medium') {
  const strategy = generateShotScaleStrategy(beastId);
  if (!strategy) return shot.description || '';
  
  const scalePrompt = generateScalePrompt(strategy.estimatedMeters, shotType);
  const ratioDesc = strategy.ratioDescription;
  
  // 构建注入文本
  const injection = `【尺度】${strategy.beastName}(${strategy.estimatedMeters}米，${strategy.ratioToHuman}倍于小G)，${ratioDesc}。${scalePrompt}`;
  
  // 将注入文本追加到 shot description
  const originalDesc = shot.description || '';
  return `${originalDesc}\n${injection}`;
}

module.exports = {
  parseBeastScale,
  getScaleCategory,
  getVisualRatioDescription,
  generateScalePrompt,
  generateShotScaleStrategy,
  calculateShotDistribution,
  generateCameraAdvice,
  generateCompositionAdvice,
  injectScaleAwareness,
  HUMAN_HEIGHT,
  SCALE_CATEGORIES
};