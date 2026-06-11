/**
 * Global Style Selector v1.0-Peng
 * 全局风格选择器 — 一键切换整部片子的视觉风格体系
 * 
 * 职责：
 * 1. 定义预设风格档案（shanhai / hyperrealistic / toon / noir 等）
 * 2. 为下游所有模块提供统一风格词库、光影、色彩、负面词
 * 3. 与 config-center.js 联动，支持热重载切换
 */

const STYLE_PROFILES = {
  
  /**
   * 档案A：山海经洪荒水墨志怪（剧情片专用）
   */
  shanhai: {
    name: '山海经洪荒水墨',
    id: 'shanhai',
    version: '1.0',
    // 核心风格词（英文，直接注入Prompt尾部）
    styleKeywords: 'Honghuang era Chinese mythology, IMAX grand narrative, ink wash painting texture, Song Dynasty landscape aesthetic, ancient scroll atmosphere, celestial jade glow',
    // 光影体系
    lightingKeywords: 'volumetric god rays piercing through mist, jade luminescence, golden hour through ancient trees, celestial rim light, ink-wash dramatic chiaroscuro, soft volumetric fog',
    // 色彩体系（五正色）
    colorPalette: [
      { name: '赤', hex: '#D32F2F', meaning: '火/南/激情' },
      { name: '青', hex: '#2E7D32', meaning: '木/东/生机' },
      { name: '黄', hex: '#F9A825', meaning: '土/中/厚德' },
      { name: '黑', hex: '#212121', meaning: '水/北/未知' },
      { name: '白', hex: '#FAFAFA', meaning: '金/西/秩序' },
    ],
    colorKeywords: 'five-element color system, deep sea blue #003B5C, flame red #D32F2F, jade green #2E7D32, imperial yellow #F9A825, ink black #212121, celestial white #FAFAFA',
    // 材质纹理（种族纹理系统）
    textureKeywords: 'dragon scale rhomboid plate texture, fox triple-layer fur system, phoenix structural color feathers, ink wash brushstroke texture on surfaces, jade subsurface scattering, ancient stone weathering',
    // 环境氛围
    atmosphereKeywords: 'Honghuang primal mist, Zhongshan crimson veins pulsing, Kunlun jade fog ethereal, weak water black fog, ancient sacred mountain atmosphere, celestial gate mist',
    // 电影质感
    cinematicKeywords: 'Oriental IMAX widescreen, ink-wash film grain, ARRI Alexa skin tone, rice paper texture overlay, mature content tone, epic mythological grandeur',
    // 负面防护（严禁出现的元素）
    negativePrompt: 'zombie, wizard, magic spell, western dragon, modern clothing, smartphone, car, neon light, anime style, cartoon, 3D Disney, western fantasy, cyberpunk, sci-fi',
    // 角色皮肤质感
    characterSkin: 'ethereal jade-like glow, mythological aura, non-human texture overlay, ancient divine being skin',
    // 运镜节奏
    cameraKeywords: 'rapid whip pan, handheld chase,急速环绕甩镜, 急速推轨甩镜,三远法之高远俯瞰, 急速升降如绝地天通, 急速仰拍如凡人望神',
    // 情绪节奏
    pacingKeywords: 'relentless fast-paced cuts, information overload aesthetic, visual density maximum, rapid-fire action sequence',
    // 景别细分
    shotSizeKeywords: {
      '特写': '面部特写，微表情清晰，皮肤纹理与毛孔可见，眼神光细节丰富，情绪在脸上漾开，水墨质感的细腻笔触',
      '近景': '胸像构图，肢体语言完整，肩部以上入画，表情与手势同时被捕捉，水墨渲染的情绪传递',
      '中景': '腰部以上，人物与环境比例协调，动作范围完整适合叙事推进，洪荒环境中的人物定位',
      '全景': '全身入镜，人与场景关系明确，空间定位清晰，肢体语言全貌展现，山水长卷中的人物',
      '远景': '大全景铺开，环境氛围主导，人物融入景致，格局与气势并存，三远法之平远意境',
      '航拍': '上帝视角俯瞰，空间纵深感强，地理格局一目了然，宏大叙事感扑面而来，洪荒宇宙的格局',
    },
    // 构图法则
    compositionKeywords: [
      '三分法构图，主体位于视觉黄金点，画面平衡自然，视线引导流畅',
      '对称构图，画面庄重稳定，仪式感强烈，东方建筑的平衡美学',
      '框架构图，利用 foreground 神木框住主体，引导视线聚焦',
      '对角线构图，动态线条引导视线流动，画面富有张力与洪荒动感',
      '中心构图，主体占据视觉焦点，压迫感与神性并存',
    ],
    // 时间/季节
    timeKeywords: [
      '黄昏黄金时刻，光线温暖柔和，洪荒暮色中的神圣感',
      '深夜月光清冷，蓝色调主导，静谧神秘，大荒之野的孤独',
      '黎明破晓前，天际线微光初现，希望萌芽，神兽苏醒前的微光',
      '正午阳光直射，阴影短促强烈，明晃晃的真实，神域的明亮',
      '深秋落叶满地，金黄与棕红交织，季节感浓厚，收获与离别',
      '初春嫩芽初绽，生机盎然，万物复苏，青丘之泽的希望',
    ],
  },

  /**
   * 档案B：超写实CG（科普/广告/宣传片专用）
   */
  hyperrealistic: {
    name: '超写实CG',
    id: 'hyperrealistic',
    version: '1.0',
    styleKeywords: 'CG cinematic photorealistic, hyper-detailed skin pores visible, no cartoon no anime, Unreal Engine 5 ray tracing render, physically based rendering, photorealism, lifelike, real-world lighting',
    lightingKeywords: 'natural sunlight, golden hour warm rim light, soft window light from large floor-to-ceiling windows, natural side light, highlight not blown out shadow detail preserved, subtle vintage film soft glow, realistic volumetric light',
    colorPalette: [
      { name: 'clinical white', hex: '#F5F5F5', meaning: '医疗/清洁/专业' },
      { name: 'medical blue', hex: '#0277BD', meaning: '科技/信任/冷静' },
      { name: 'natural skin', hex: '#FFCCBC', meaning: '真实肤色/温暖' },
      { name: 'warm sunlight', hex: '#FFF8E1', meaning: '日光/舒适/日常' },
      { name: 'deep green', hex: '#1B5E20', meaning: '自然/生命/户外' },
    ],
    colorKeywords: 'real-world natural colors, clinical white #F5F5F5, medical blue #0277BD, warm sunlight #FFF8E1, natural green #1B5E20, skin tone accurate #FFCCBC',
    textureKeywords: 'realistic human skin texture with visible pores, fabric texture detail, natural material surfaces, medical equipment brushed metal, realistic hair strand detail',
    atmosphereKeywords: 'clean clinical environment, natural outdoor daylight, realistic indoor office/home setting, professional studio lighting, everyday real-world atmosphere',
    cinematicKeywords: '35mm film grain subtle, ARRI Alexa natural skin tone, realistic depth of field, documentary style authenticity, broadcast professional quality',
    negativePrompt: 'anime, cartoon, illustration, painting style, ink wash, watercolor, sketch, western dragon, mythical glow, fantasy elements, zombie, wizard, magic, sci-fi cyberpunk, neon, unrealistic lighting',
    characterSkin: 'realistic human skin texture, pores visible on close-up, subtle natural makeup, natural skin tone with subsurface scattering, no ethereal glow, no mythical aura',
    cameraKeywords: 'smooth tracking shot, stable handheld documentary style, slow push-in, gentle dolly, professional steady cam, realistic camera movement',
    pacingKeywords: 'steady pace, clear information delivery, comfortable viewing rhythm, professional broadcast timing',
    shotSizeKeywords: {
      '特写': '面部特写，微表情清晰，皮肤纹理与毛孔真实可见，自然眼神光，真实人类面部细节',
      '近景': '胸像构图，肢体语言自然，肩部以上入画，真实社交距离感，专业访谈质感',
      '中景': '腰部以上，人物与环境比例自然，动作范围真实，日常场景中的真实互动',
      '全景': '全身入镜，人与真实环境关系明确，空间定位清晰，自然肢体语言',
      '远景': '大全景铺开，真实环境氛围主导，人物融入真实场景，自然格局',
      '航拍': '上帝视角俯瞰，真实地理空间感，现代城市或自然景观的真实格局',
    },
    compositionKeywords: [
      '三分法构图，主体位于视觉黄金点，画面平衡自然，视线引导流畅',
      '对称构图，画面庄重稳定，专业仪式感，现代建筑平衡美学',
      '框架构图，利用真实前景元素框住主体，引导视线聚焦',
      '对角线构图，动态线条引导视线流动，画面富有真实张力',
      '中心构图，主体占据视觉焦点，专业感与重要性并存',
    ],
    timeKeywords: [
      '黄昏黄金时刻，光线温暖柔和，真实世界最美的时段',
      '深夜室内灯光，冷暖色调交织，现代都市的真实夜晚',
      '清晨自然光，柔和舒适，新的一天真实开始',
      '正午阳光直射，阴影短促强烈，真实时间的强烈感',
      '深秋自然光线，金黄与棕红交织，真实季节感',
      '初春柔和光线，生机盎然，真实万物复苏',
    ],
  },

  /**
   * 档案C：Nirath原创异世界（双星荒野/剧情片专用）
   * 🌍 v3.0-Peng: Nirath Environment Concept Bible 固化
   */
  nirath: {
    name: 'Nirath双星荒野',
    id: 'nirath',
    version: '1.0',
    // 核心风格词（英文，直接注入Prompt尾部）
    styleKeywords: 'Nirath alien planet, twin sun eternal twilight, bioluminescent ecosystem, Avatar-level volumetric light, obsidian glass geology, superconductor crystal formations, Cameron biological wonderland, Honghuang era reimagined as alien wilderness, IMAX grand narrative',
    // 光影体系 — 双恒星光照系统
    lightingKeywords: 'twin sun eternal twilight orange-purple primary light, bioluminescent fill light, god rays through alien canopy, volumetric light贯穿全场景, atmospheric perspective远景偏蓝紫, subsurface scattering on living organisms, crystal caustics折射, obsidian rim light黑曜石边缘光',
    // 色彩体系 — Nirath六色系统
    colorPalette: [
      { name: '深海青', hex: '#008B8B', meaning: 'abyssal bioluminescence / 生命起源' },
      { name: '天光金', hex: '#FFD700', meaning: 'upper atmosphere warmth / 神圣光芒' },
      { name: '地热红', hex: '#FF4500', meaning: 'geothermal energy / 大地脉动' },
      { name: '超导电', hex: '#00BFFF', meaning: 'superconductor plasma / 科技能量' },
      { name: '黑曜石', hex: '#1C1C1C', meaning: 'obsidian glass /  grounding anchor' },
      { name: '灵原绿', hex: '#00FA9A', meaning: 'spirit plain vitality / 原始生机' },
    ],
    colorKeywords: 'Nirath six-color system, abyssal teal #008B8B, twilight gold #FFD700, geothermal red #FF4500, superconductor blue #00BFFF, obsidian black #1C1C1C, spirit green #00FA9A, dual-star orange-purple ambient',
    // 材质纹理
    textureKeywords: 'obsidian glass volcanic high-gloss surface, superconductor crystal electric-blue luminescence, alien organism translucent membrane, liquid metal mirror-reflective flow, bioluminescent organ pulsating glow, crystalline geological formation sharp edges',
    // 环境氛围 — Nirath十大场景
    atmosphereKeywords: 'Abyssal Luminara deep-sea bioluminescence, Broken Axis floating crystal mountains, Azure Hills Spirit Plain gene-vault ruins, Subterranean Styx underground light veins, Solar Cradle world-tree crown, Kunlun Sky hanging celestial realm, Plain Zhulu battlefield petrified bones, Archipelago Penglai mist-shrouded floating islands, Astrop Nexus star-gate geometric altar, Spine Pangu tectonic back crystal rain',
    // 电影质感
    cinematicKeywords: 'Nirath IMAX widescreen, Avatar biological wonderland aesthetic, vintage sci-fi film grain, ARRI Alexa natural skin tone, obsidian glass reflective depth, volumetric light shafts piercing atmosphere',
    // 负面防护（严禁出现的元素）
    negativePrompt: 'Earth-normal vegetation without bioluminescence, single sun lighting, contemporary technology, modern clothing, smartphone, car, neon light, anime style, cartoon, 3D Disney, western fantasy, cyberpunk, noon daylight, midnight darkness, pure black shadows, Earth plants, grass, trees without glow',
    // 角色皮肤质感
    characterSkin: 'natural human skin with subtle bioluminescent tint, pores visible, subsurface scattering warm, no mythical aura unless character is native Nirath being',
    // 运镜节奏 — Nirath专属
    cameraKeywords: 'slow majestic crane through crystal formations, underwater drift in Abyssal Luminara, high-speed track along floating Axis, orbital drone shot around star-gate, intimate handheld through alien forest, epic dolly reveal of world-tree crown',
    // 情绪节奏
    pacingKeywords: 'slow majestic wonder, information-rich wide shots, contemplative pacing for world-building, sudden shifts for alien encounters, rhythmic cuts matching bioluminescent pulse',
    // 景别细分
    shotSizeKeywords: {
      '特写': '面部特写，微表情清晰，皮肤纹理与毛孔可见，眼神光细节丰富，情绪在脸上漾开，生物发光微弱反射在脸颊',
      '近景': '胸像构图，肢体语言完整，肩部以上入画，表情与手势同时被捕捉，双恒星暖光在侧脸',
      '中景': '腰部以上，人物与环境比例协调，动作范围完整适合叙事推进，Nirath环境中的人物定位',
      '全景': '全身入镜，人与场景关系明确，空间定位清晰，肢体语言全貌展现，黑曜石地面反光',
      '远景': '大全景铺开，环境氛围主导，人物融入外星景致，格局与气势并存，双星天际线为背景',
      '航拍': '上帝视角俯瞰，空间纵深感强，地理格局一目了然，宏大叙事感扑面而来，Nirath星球尺度震撼',
    },
    // 构图法则
    compositionKeywords: [
      '三分法构图，主体位于视觉黄金点，双恒星之一作为背景光，画面平衡自然',
      '对称构图，利用外星地貌对称性，画面庄重神秘，Nirath祭坛式平衡',
      '框架构图，利用发光晶簇框住主体，生物发光作为天然画框',
      '对角线构图，浮空山脉对角线引导，画面富有外星张力与洪荒动感',
      '中心构图，主体占据视觉焦点，双星压迫感与异世界神性并存',
    ],
    // 时间/季节 — Nirath无四季，只有双星周期
    timeKeywords: [
      '永恒黄昏，双星悬于天际，一橙一紫交织，Nirath最典型的光照',
      '双星重合时刻，光芒最盛，橙紫混合成奇异白光，神圣时刻',
      '单星主导时段，较暗恒星被遮挡，另一星独自照耀，类似 Earth twilight',
      '双星皆弱时刻，生物发光最显眼，深海青绿与超导蓝主导视觉',
      '晶簇山脉折射时段，阳光通过晶体散射，彩虹光斑遍布大地',
      '光脉晶窟内部，无直接星光，全靠生物发光与超导照明，幽蓝神秘',
    ],
  },
};

// ============ 模块接口 ============

/**
 * 获取风格档案
 * @param {string} profileId - 'shanhai' | 'hyperrealistic' | 'nirath'
 * @returns {Object} 风格档案对象
 */
function getStyleProfile(profileId = 'nirath') {  // 🌍 v3.0-Peng: 默认Nirath
  const profile = STYLE_PROFILES[profileId];
  if (!profile) {
    console.warn(`[StyleSelector] 未知风格档案: ${profileId}，回退到 nirath`);
    return STYLE_PROFILES.nirath;
  }
  return profile;
}

/**
 * 列出所有可用风格档案
 */
function listStyleProfiles() {
  return Object.values(STYLE_PROFILES).map(p => ({
    id: p.id,
    name: p.name,
    version: p.version,
  }));
}

/**
 * 注册新风格档案（运行时扩展）
 */
function registerStyleProfile(profileId, profile) {
  if (STYLE_PROFILES[profileId]) {
    console.warn(`[StyleSelector] 覆盖已有风格档案: ${profileId}`);
  }
  STYLE_PROFILES[profileId] = profile;
  console.log(`[StyleSelector] 注册风格档案: ${profileId} (${profile.name})`);
}

/**
 * 根据风格档案生成 Prompt 尾部风格签名
 * 用于 inject 到每个镜头的 prompt 末尾
 */
function buildStyleSignature(profileId = 'nirath') {
  const p = getStyleProfile(profileId);
  return `${p.styleKeywords}, ${p.lightingKeywords}, ${p.cinematicKeywords}`;
}

/**
 * 根据风格档案生成负面防护词
 */
function buildNegativePrompt(profileId = 'nirath') {
  return getStyleProfile(profileId).negativePrompt;
}

/**
 * 根据风格档案和景别获取细分描述
 */
function getShotSizeDescription(shotSize, profileId = 'nirath') {
  const p = getStyleProfile(profileId);
  return p.shotSizeKeywords[shotSize] || p.shotSizeKeywords['中景'];
}

/**
 * 根据风格档案获取色彩描述
 */
function getColorDescription(profileId = 'nirath') {
  return getStyleProfile(profileId).colorKeywords;
}

/**
 * 根据风格档案获取材质描述
 */
function getTextureDescription(profileId = 'nirath') {
  return getStyleProfile(profileId).textureKeywords;
}

/**
 * 获取角色皮肤质感描述（用于角色一致性）
 */
function getCharacterSkinDescription(profileId = 'nirath') {
  return getStyleProfile(profileId).characterSkin;
}

/**
 * 获取运镜关键词
 */
function getCameraKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).cameraKeywords;
}

/**
 * 获取构图描述列表
 */
function getCompositionKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).compositionKeywords;
}

/**
 * 获取光线描述列表
 */
function getLightingKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).lightingKeywords;
}

/**
 * 获取环境氛围描述
 */
function getAtmosphereKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).atmosphereKeywords;
}

/**
 * 获取电影质感描述
 */
function getCinematicKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).cinematicKeywords;
}

/**
 * 获取时间/季节描述
 */
function getTimeKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).timeKeywords;
}

/**
 * 获取快节奏关键词
 */
function getPacingKeywords(profileId = 'nirath') {
  return getStyleProfile(profileId).pacingKeywords;
}

// ============ 校准器：检查 Prompt 是否包含跨风格污染词 ============

const CROSS_CONTAMINATION_MAP = {
  // 超写实风格中不该出现的山海经/Nirath词
  hyperrealistic: [
    'Honghuang', 'ink wash', '水墨', '志怪', '神话', 'mythological aura',
    'jade glow', 'celestial', '洪荒', '五正色', '龙鳞', '凤羽', '狐毛',
    'Kunlun', 'Zhongshan', 'weak water', '神兽', '钟山', '昆仑',
    'Song Dynasty', 'ancient scroll', 'rice paper', '三远法',
    '绝陫通', '绝地天通', '洪荒宇宙', '东方IMAX', '山水长卷',
    'mythical beast', '神兽', '异兽', '妖兽', '仙兽',
    'Nirath', 'twin sun', 'bioluminescent', 'obsidian', 'superconductor',
    'alien planet', 'eternal twilight', 'crystal rain', 'floating mountain',
    '光脉晶窟', '浮空晶簇', '双星', '双恒星', '生物发光',
  ],
  // 山海经风格中不该出现的现代/科幻/Nirath词
  shanhai: [
    'smartphone', 'iPhone', 'computer', 'laptop', 'car', 'modern building',
    'skyscraper', 'neon', 'cyberpunk', 'sci-fi', 'spaceship', 'airplane',
    'Western dragon', 'wizard', 'magic wand', 'Hogwarts',
    'Nirath', 'twin sun', 'bioluminescent', 'obsidian glass', 'superconductor',
    'alien planet', 'eternal twilight', 'floating mountain', 'crystal rain',
    '光脉晶窟', '浮空晶簇', '双星', '双恒星', '生物发光',
  ],
  // Nirath风格中不该出现的地球常规/山海经词
  nirath: [
    'smartphone', 'iPhone', 'computer', 'laptop', 'car', 'modern building',
    'skyscraper', 'neon', 'cyberpunk', 'sci-fi', 'spaceship', 'airplane',
    'Western dragon', 'wizard', 'magic wand', 'Hogwarts',
    'Earth-normal', 'single sun', 'contemporary technology', 'modern clothing',
    'Honghuang', 'ink wash', '水墨', '志怪', '五正色', '龙鳞', '凤羽', '狐毛',
    'Song Dynasty', 'ancient scroll', 'rice paper', '三远法', '绝地天通',
    'noon daylight', 'midnight darkness', 'Earth plants', 'grass', 'trees without glow',
    '钟山', '昆仑', '弱水', '山海经',
  ],
};

/**
 * 检测 Prompt 是否包含跨风格污染词
 * @returns {Object} { contaminated: boolean, violations: string[] }
 */
function detectCrossContamination(prompt, profileId = 'nirath') {
  const violations = [];
  const forbidden = CROSS_CONTAMINATION_MAP[profileId] || [];
  for (const word of forbidden) {
    if (prompt.includes(word)) {
      violations.push(word);
    }
  }
  return {
    contaminated: violations.length > 0,
    violations,
    profileId,
    profileName: getStyleProfile(profileId).name,
  };
}

// ============ 导出 ============
module.exports = {
  getStyleProfile,
  listStyleProfiles,
  registerStyleProfile,
  buildStyleSignature,
  buildNegativePrompt,
  getShotSizeDescription,
  getColorDescription,
  getTextureDescription,
  getCharacterSkinDescription,
  getCameraKeywords,
  getCompositionKeywords,
  getLightingKeywords,
  getAtmosphereKeywords,
  getCinematicKeywords,
  getTimeKeywords,
  getPacingKeywords,
  detectCrossContamination,
  STYLE_PROFILES,
};

// ============ CLI 接口 ============
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  if (cmd === 'list') {
    console.log('可用风格档案:');
    for (const p of listStyleProfiles()) {
      console.log(`  ${p.id}: ${p.name} (v${p.version})`);
    }
  } else if (cmd === 'show') {
    const profileId = args[1] || 'nirath';
    const p = getStyleProfile(profileId);
    console.log(JSON.stringify(p, null, 2));
  } else if (cmd === 'check') {
    const profileId = args[1] || 'nirath';
    const prompt = args[2] || '';
    const result = detectCrossContamination(prompt, profileId);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('用法:');
    console.log('  node style-selector.js list');
    console.log('  node style-selector.js show [shanhai|hyperrealistic|nirath]');
    console.log('  node style-selector.js check <profileId> "<prompt>"');
  }
}