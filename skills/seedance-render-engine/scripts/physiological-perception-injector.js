/**
 * 🫀 Physiological Perception Injector v1.0-Peng
 * 系统级模块：根据角色生理结构自动选择微动作描述
 * 
 * 设计哲学：
 * - 不同生理结构的角色需要不同的"生命迹象"描述
 * - 避免语义错误（如无头角色注入blink）
 * - 将"生命迹象"从通用模板升级为智能生理感知系统
 * 
 * 适用：所有含角色的视频生成项目
 */

// 角色生理类型定义
const PHYSIO_TYPES = {
  HUMAN: 'human',           // 人类角色（小G）
  BEAST_HEADLESS: 'beast_headless',  // 无头神兽（刑天）
  BEAST_NORMAL: 'beast_normal',     // 有头神兽（九尾狐、烛龙等）
  HUMANOID: 'humanoid',     // 人形但非人类
  MECHANICAL: 'mechanical', // 机械/机器人
  ENERGY: 'energy'          // 纯能量体
};

// 生理感知模板库
const PERCEPTION_TEMPLATES = {
  [PHYSIO_TYPES.HUMAN]: {
    primary: [
      'natural breathing 15-20 times per minute',
      'subtle chest rise and fall with each breath',
      'natural blinking 15-20 times per minute',
      'gaze drifting naturally every few seconds',
      'micro-expressions flickering across face'
    ],
    secondary: [
      'unconscious finger fidgeting',
      'subtle weight shifting between feet',
      'hair swaying with micro air currents',
      'pupil dilation responding to light changes',
      'skin goosebumps from environmental chill'
    ],
    interaction: [
      'instinctive defensive micro-movements',
      'subtle leaning toward interesting stimuli',
      'unconscious hand gestures while thinking'
    ]
  },
  
  [PHYSIO_TYPES.BEAST_HEADLESS]: {
    primary: [
      'chest heaving with deep rhythmic breathing',
      'breast-eyes pulsing with bioluminescent heartbeat rhythm',
      'navel-mouth quivering with sub-vocal tremors',
      'torso skin tension shifting with internal energy flow',
      'veins glowing in pulsating patterns synchronized to unseen heartbeat'
    ],
    secondary: [
      'war-axe shaft vibrating with residual battle energy',
      'shield surface rippling with energy waves',
      'armor plates shifting with micro-adjustments',
      'tattoos/patterns glowing brighter with each energy pulse',
      'ground trembling subtly beneath massive weight'
    ],
    interaction: [
      'energy aura expanding and contracting with emotional state',
      'bioluminescent core brightening when alert',
      'micro-vibrations emanating from battle-worn scars'
    ]
  },
  
  [PHYSIO_TYPES.BEAST_NORMAL]: {
    primary: [
      'natural breathing with visible chest expansion',
      'eyes blinking with reflective membrane',
      'pupil shape adapting to light (vertical/horizontal slit)',
      'fur/feathers ruffling with environmental changes',
      'ears/swiveling antennae tracking sound sources'
    ],
    secondary: [
      'tail swaying with emotional state',
      'claws/talons unconsciously flexing',
      'scales/plates shifting with body movement',
      'whiskers/tentacles sensing air currents',
      'scent glands pulsing with pheromone release'
    ],
    interaction: [
      'predatory focus locking onto movement',
      'defensive posture micro-adjustments',
      'territorial display energy building'
    ]
  },
  
  [PHYSIO_TYPES.HUMANOID]: {
    primary: [
      'breathing visible as subtle body rhythm',
      'eye movements tracking environment',
      'micro-expressions suggesting inner thoughts',
      'natural posture shifts with weight transfer'
    ],
    secondary: [
      'fingers tapping unconscious rhythms',
      'ears perking at unexpected sounds',
      'skin texture changes with emotional flush'
    ],
    interaction: [
      'instinctive mirroring of nearby movements',
      'subtle leaning toward companions'
    ]
  },
  
  [PHYSIO_TYPES.MECHANICAL]: {
    primary: [
      'hydraulic pistons hissing with micro-adjustments',
      'LED indicator lights pulsing with processing cycles',
      'ventilation fans cycling with thermal regulation',
      'joint servos humming at idle frequency',
      'optic sensors refocusing with mechanical precision'
    ],
    secondary: [
      'armor panels shifting for ventilation',
      'cable bundles vibrating with data transmission',
      'hydraulic fluid circulating in transparent tubes',
      'gears meshing with precise timing'
    ],
    interaction: [
      'threat assessment sensors sweeping environment',
      'weapon systems charging with audible power buildup',
      'stabilizers micro-adjusting to terrain'
    ]
  },
  
  [PHYSIO_TYPES.ENERGY]: {
    primary: [
      'core luminosity fluctuating with energy cycles',
      'peripheral energy tendrils dancing in air',
      'surface ripples propagating from center',
      'color temperature shifting with emotional state',
      'density gradients causing light refraction'
    ],
    secondary: [
      'sub-atomic particles sparking at boundaries',
      'magnetic field lines visible as aurora patterns',
      'resonance hum changing pitch with proximity',
      'containment field micro-fluctuations'
    ],
    interaction: [
      'energy arcs jumping to nearby conductors',
      'gravitational micro-distortions bending light',
      'quantum foam bubbling at interaction points'
    ]
  }
};

/**
 * 检测角色生理类型
 * @param {Object} charData - 角色数据
 * @returns {string} 生理类型
 */
function detectPhysioType(charData) {
  if (!charData) return PHYSIO_TYPES.HUMAN;
  
  const name = (charData.name || '').toLowerCase();
  const species = (charData.species || '').toLowerCase();
  const role = (charData.role || '').toLowerCase();
  const features = (charData.features || []).join(' ').toLowerCase();
  const id = (charData.id || '').toLowerCase();
  
  // 🆕 v2.19-Peng-fix: 通过角色ID+描述识别无头神兽（刑天）
  // 无头神兽特征：id=beast 且 description/features包含headless相关描述
  const description = (charData.description || '').toLowerCase();
  const allText = [name, species, features, description].join(' ').toLowerCase();
  const isHeadlessById = id === 'beast' && (
    allText.includes('headless') || 
    allText.includes('无头') || 
    allText.includes('以乳为目') || 
    allText.includes('以脐为口') ||
    allText.includes('无首')
  );
  
  // 无头角色关键词检测
  const headlessKeywords = ['headless', '无头', '无首', '无面', '以乳为目', '以脐为口'];
  const isHeadlessByKeywords = headlessKeywords.some(kw => 
    name.includes(kw) || species.includes(kw) || features.includes(kw) || description.includes(kw)
  );
  
  if (isHeadlessById || isHeadlessByKeywords) return PHYSIO_TYPES.BEAST_HEADLESS;
  
  // 神兽检测
  const beastKeywords = ['beast', '神兽', '异兽', '魔兽', 'dragon', 'phoenix', '九尾', '烛龙'];
  const isBeast = beastKeywords.some(kw => 
    name.includes(kw) || species.includes(kw) || role.includes('beast')
  );
  
  if (isBeast) return PHYSIO_TYPES.BEAST_NORMAL;
  
  // 能量体检测
  const energyKeywords = ['energy', '能量', 'spirit', '灵体', 'ghost', '战魂'];
  const isEnergy = energyKeywords.some(kw =>
    name.includes(kw) || species.includes(kw)
  );
  
  if (isEnergy) return PHYSIO_TYPES.ENERGY;
  
  // 机械检测
  const mechKeywords = ['mech', 'robot', '机械', '机甲', 'cyborg'];
  const isMech = mechKeywords.some(kw =>
    name.includes(kw) || species.includes(kw)
  );
  
  if (isMech) return PHYSIO_TYPES.MECHANICAL;
  
  // 人形检测
  const humanoidKeywords = ['humanoid', '人形', 'elf', 'dwarf', '精灵'];
  const isHumanoid = humanoidKeywords.some(kw =>
    name.includes(kw) || species.includes(kw)
  );
  
  if (isHumanoid) return PHYSIO_TYPES.HUMANOID;
  
  // 默认人类
  return PHYSIO_TYPES.HUMAN;
}

/**
 * 为角色生成生理感知描述
 * @param {Object} charData - 角色数据
 * @param {Object} options - 配置
 * @returns {string} 感知描述字符串
 */
function generatePerceptionForCharacter(charData, options = {}) {
  const {
    intensity = 'normal', // 'subtle' | 'normal' | 'dramatic'
    count = 3, // 返回的描述数量
    includeInteraction = false
  } = options;
  
  const physioType = detectPhysioType(charData);
  const template = PERCEPTION_TEMPLATES[physioType];
  
  if (!template) return '';
  
  let selected = [];
  
  // 根据强度调整
  const intensityMap = {
    'subtle': { primary: 1, secondary: 1, interaction: 0 },
    'normal': { primary: 2, secondary: 1, interaction: 0 },
    'dramatic': { primary: 2, secondary: 2, interaction: 1 }
  };
  
  const counts = intensityMap[intensity] || intensityMap.normal;
  
  // 随机选择（保持一定稳定性）
  const seed = charData.name ? charData.name.charCodeAt(0) : 0;
  
  function selectFrom(arr, n) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort((a, b) => {
      const hashA = _hashString(a + seed);
      const hashB = _hashString(b + seed);
      return hashA - hashB;
    });
    return shuffled.slice(0, Math.min(n, arr.length));
  }
  
  selected.push(...selectFrom(template.primary, counts.primary));
  selected.push(...selectFrom(template.secondary, counts.secondary));
  
  if (includeInteraction && counts.interaction > 0) {
    selected.push(...selectFrom(template.interaction, counts.interaction));
  }
  
  return selected.join(', ');
}

/**
 * 为镜头生成所有角色的生理感知描述
 * @param {Object} shot - 镜头数据
 * @param {Object} plan - 计划数据
 * @returns {string} 组合感知描述
 */
function generateShotPerceptions(shot, plan) {
  const chars = shot.characters || [];
  if (chars.length === 0) return '';
  
  const perceptions = [];
  
  for (const charName of chars) {
    const charData = plan?.characters?.find(c => c.name === charName);
    if (charData) {
      const perception = generatePerceptionForCharacter(charData, {
        intensity: shot.emotion ? 'dramatic' : 'normal',
        count: 2
      });
      if (perception) {
        perceptions.push(`${charData.name || charName}: ${perception}`);
      }
    }
  }
  
  return perceptions.join('; ');
}

/**
 * 简单的字符串哈希函数
 */
function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

module.exports = {
  PHYSIO_TYPES,
  detectPhysioType,
  generatePerceptionForCharacter,
  generateShotPerceptions,
  PERCEPTION_TEMPLATES
};