/**
 * Environment Sound Designer v1.0-Peng
 * 环境音效智能设计模块
 * 
 * 根据镜头环境和Nirath星球生态，自动生成环境音效描述
 * 作为独立字段注入Seedance Prompt: AmbientSoundBlock
 * 
 * 设计原则:
 * - 根据具体环境设定选择最佳音效(鸟叫/风声/流水/树叶/昆虫等)
 * - 与台词模块(dialogueBlock)分离，专注环境氛围音
 * - 支持Nirath十大生态区 + 通用自然环境
 */

// ========== Nirath 星球生态区环境音效库 ==========

const NIRATH_AMBIENCE_LIBRARY = {
  '断裂山脉': {
    description: 'Nirath断裂山脉，远古战场遗迹',
    sounds: [
      'wind whistling through narrow rock crevices and fissures',
      'distant sub-bass earth rumble from deep tectonic shifts',
      'loose stones tumbling down steep cliff faces',
      'crystalline mineral veins humming with faint electromagnetic resonance',
      'dry dust devils swirling across barren rock surfaces'
    ],
    atmosphere: 'desolate, ancient, weighty silence interrupted by wind'
  },
  '青丘灵原': {
    description: '蓝绿色高草原生态区，孢子水母漂浮',
    sounds: [
      'tall bioluminescent grass rustling in gentle breeze',
      'spore jellyfish emitting soft pulsating bioluminescent hum',
      'silver-mercury lake lapping against crystalline shores',
      'microscopic organisms crackling with faint electrical discharge',
      'distant chorus of unknown aerial creatures calling'
    ],
    atmosphere: 'ethereal, alive with subtle bioluminescent energy, mysterious'
  },
  '光脉晶窟': {
    description: '地下晶窟，光脉矿脉发光',
    sounds: [
      'water droplets echoing in vast underground cavern',
      'bioluminescent crystal veins pulsing with rhythmic light-hum',
      'distant underground river flowing through unseen channels',
      'mineral formations creaking from thermal expansion',
      'faint magnetic field resonance vibrating through rock'
    ],
    atmosphere: 'mysterious, resonant, dripping echoes in darkness'
  },
  '浮空晶簇山脉': {
    description: '悬浮晶簇山峰，反重力生态',
    sounds: [
      'anti-gravity field emitting low-frequency hum',
      'floating crystal clusters chiming in gentle collision',
      'wind rushing past levitating rock formations',
      'distant atmospheric energy discharge like aurora thunder',
      'micro-debris orbiting mountain peaks creating whispering sounds'
    ],
    atmosphere: 'otherworldly, humming with anti-gravity energy, vast open sky'
  },
  '时隙森林': {
    description: '时间扭曲森林，植物生长异常',
    sounds: [
      'trees groaning as they rapidly grow and wither in time loops',
      'temporal distortion creating echoing bird calls from different time periods',
      'leaves rustling in reverse-time wind',
      'distant time-portal humming like tinnitus',
      'insects chirping at unnaturally accelerated speeds'
    ],
    atmosphere: 'temporally disorienting, layered echoes from past and future'
  },
  '流光虹脉河': {
    description: '发光河流，虹色水流',
    sounds: [
      'iridescent water flowing over smooth luminescent stones',
      'river creating melodic tonal patterns as it cascades',
      'bioluminescent algae in water crackling with soft light-sounds',
      'mist rising from warm river creating whispering vapor sounds',
      'distant waterfall creating continuous white noise bass'
    ],
    atmosphere: 'flowing, melodic, warm misty ambience'
  },
  '孢子雾沼丛林': {
    description: '孢子雾沼泽，迷雾丛林',
    sounds: [
      'giant spore pods releasing pressurized mist with soft popping sounds',
      'moss-covered trees dripping condensation',
      'unseen amphibious creatures croaking in fog',
      'fungal networks underground pulsing with subsonic communication',
      'carnivorous plants snapping shut with wet clicks'
    ],
    atmosphere: 'damp, dense, alive with hidden biological activity'
  },
  '双日荒漠': {
    description: '双恒星照射下的高温荒漠',
    sounds: [
      'superheated sand cracking under extreme temperature',
      'thermal wind screaming across dunes',
      'distant dust storms approaching like rolling thunder',
      'rock surfaces expanding in heat creating sharp ticks',
      'mirage shimmer creating faint high-frequency resonance'
    ],
    atmosphere: 'extreme, harsh, searing silence broken by thermal violence'
  },
  '磁暴平原': {
    description: '强磁场风暴平原',
    sounds: [
      'magnetic storm creating continuous electrical crackling overhead',
      'iron-rich dust particles humming as they align to field lines',
      'distant lightning strikes on magnetic monoliths',
      'atmospheric ionization creating constant low static',
      'wind carrying charged particles making whispering magnetic sounds'
    ],
    atmosphere: 'electrically charged, crackling with magnetic energy, ominous'
  },
  '深海裂谷': {
    description: '深海裂谷，高压水下生态',
    sounds: [
      'crushing deep-water pressure creating constant deep bass',
      'bioluminescent anglerfish clicking their lures',
      'underwater thermal vents roaring like submerged volcanoes',
      'giant crustacean shells grinding against rock',
      'distant whale-song from alien cetacean species'
    ],
    atmosphere: 'crushing, dark, alien underwater pressure'
  }
};

// ========== 通用自然环境音效库 ==========

const GENERIC_AMBIENCE_LIBRARY = {
  '森林': {
    sounds: [
      'birds chirping and calling in canopy layers',
      'wind rustling through dense leaves',
      'distant woodpecker drumming on tree trunk',
      'small animals moving through underbrush',
      'occasional branch creaking under wind stress'
    ],
    atmosphere: 'alive, layered, natural woodland symphony'
  },
  '山脉': {
    sounds: [
      'wind howling across rocky peaks',
      'distant eagle cry echoing through valleys',
      'loose rocks tumbling down slopes',
      'snow/ice cracking on high altitude',
      'silence of thin air broken only by wind'
    ],
    atmosphere: 'majestic, cold, vast, wind-dominated'
  },
  '河流': {
    sounds: [
      'water flowing over rocks creating melodic patterns',
      'gentle river current consistent white noise',
      'occasional splash from fish jumping',
      'waterfall in distance creating bass rumble',
      'dragonflies humming near water surface'
    ],
    atmosphere: 'flowing, refreshing, continuous gentle movement'
  },
  '洞穴': {
    sounds: [
      'water droplets falling into underground pool',
      'distant bat wings fluttering',
      'subtle air currents moving through passages',
      'rock formations settling with faint creaks',
      'underground stream echoing in chambers'
    ],
    atmosphere: 'mysterious, damp, echoing, enclosed'
  },
  '草原': {
    sounds: [
      'grass swaying in persistent breeze',
      'insects buzzing and chirping in warm air',
      'distant herd animals calling',
      'hawks circling overhead crying',
      'seeds dispersing with papery rustling'
    ],
    atmosphere: 'open, warm, insect-buzzing, wind-swept'
  },
  '沼泽': {
    sounds: [
      'frogs croaking in rhythmic chorus',
      'insects droning in humid air',
      'muddy water bubbling with gas release',
      'reeds rustling as something moves through',
      'distant splashing of water birds'
    ],
    atmosphere: 'humid, dense with biological sounds, mysterious'
  },
  '沙漠': {
    sounds: [
      'wind-blown sand whispering across dunes',
      'occasional desert fox cry at night',
      'thermal expansion of rocks ticking',
      'distant sandstorm rumble like far thunder',
      'silence so deep you hear your own heartbeat'
    ],
    atmosphere: 'vast, silent, wind-sculpted, extreme temperature'
  },
  '海洋': {
    sounds: [
      'waves rolling and breaking on shore',
      'seagulls crying overhead',
      'distant whale song resonating underwater',
      'wind over open water creating hollow sound',
      'shell fragments clicking in wave recede'
    ],
    atmosphere: 'vast, rhythmic, salt-spray, open horizon'
  },
  '雪原': {
    sounds: [
      'snow crunching underfoot in extreme cold',
      'wind sweeping across flat ice fields',
      'ice crystals forming with delicate cracking',
      'distant glacier calving like thunder',
      'absolute silence of snow absorption'
    ],
    atmosphere: 'cold, pristine, wind-swept, crystalline silence'
  },
  '城市': {
    sounds: [
      'distant traffic creating continuous low hum',
      'occasional car horn or siren',
      'footsteps echoing on hard surfaces',
      'construction machinery rhythmic pounding',
      'neon signs buzzing with electrical hum'
    ],
    atmosphere: 'dense, layered human activity, electrical undertone'
  }
};

// ========== 环境关键词检测映射 ==========

const ENVIRONMENT_KEYWORDS = {
  '断裂山脉': ['断裂', '山脉', '岩壁', '悬崖', '绝壁', '断层', '火山岩', '玄武岩', '战场遗迹'],
  '青丘灵原': ['青丘', '灵原', '草原', '高草', '孢子', '水母', '银汞', '湖泊', '蓝绿色'],
  '光脉晶窟': ['晶窟', '洞穴', '地下', '水晶', '矿脉', '光脉', '发光', '晶簇'],
  '浮空晶簇山脉': ['浮空', '悬浮', '晶簇', '反重力', '漂浮', '空中'],
  '时隙森林': ['时隙', '森林', '树木', '时间', '扭曲', '生长'],
  '流光虹脉河': ['流光', '虹脉', '河流', '水流', '瀑布', '河岸'],
  '孢子雾沼丛林': ['孢子', '雾沼', '沼泽', '丛林', '迷雾', '真菌', '蘑菇'],
  '双日荒漠': ['荒漠', '沙漠', '双日', '沙丘', '高温', '干旱'],
  '磁暴平原': ['磁暴', '平原', '磁场', '风暴', '雷电', '放电'],
  '深海裂谷': ['深海', '裂谷', '水下', '海底', '高压', '水生'],
  '森林': ['森林', '树林', '树木', ' woodland', '丛林'],
  '山脉': ['山脉', '山峰', '山脊', '高山', 'alpine', 'mountain'],
  '河流': ['河流', '河水', '溪流', '瀑布', '河岸', 'waterfall', 'river'],
  '洞穴': ['洞穴', '山洞', '溶洞', '地下', 'cave'],
  '草原': ['草原', '草甸', '草地', 'grassland', 'prairie'],
  '沼泽': ['沼泽', '湿地', '泥塘', 'swamp', 'marsh'],
  '沙漠': ['沙漠', '荒漠', '沙丘', 'desert'],
  '海洋': ['海洋', '海边', '海岸', '海浪', 'ocean', 'sea'],
  '雪原': ['雪原', '雪地', '冰川', '冰原', 'snow', 'ice'],
  '城市': ['城市', '都市', '建筑', '街道', 'city', 'urban']
};

// ========== 核心函数 ==========

/**
 * 根据镜头和环境自动检测生态区
 */
function detectEnvironmentZone(shot, plan) {
  // 1. 从 shot 描述中提取环境关键词
  const desc = (shot.description || '') + (shot.scene || '') + (shot.location || '');
  const text = desc.toLowerCase();

  // 2. 优先检测 Nirath 生态区
  for (const [zone, keywords] of Object.entries(ENVIRONMENT_KEYWORDS)) {
    if (NIRATH_AMBIENCE_LIBRARY[zone]) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          return { zone, library: 'nirath' };
        }
      }
    }
  }

  // 3. 检测通用自然环境
  for (const [zone, keywords] of Object.entries(ENVIRONMENT_KEYWORDS)) {
    if (GENERIC_AMBIENCE_LIBRARY[zone]) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          return { zone, library: 'generic' };
        }
      }
    }
  }

  // 4. 从 plan 的世界观推断
  const worldview = plan?.worldview || plan?.style || '';
  if (worldview.includes('nirath') || worldview.includes('Nirath')) {
    // 默认返回断裂山脉（Nirath 最典型地貌）
    return { zone: '断裂山脉', library: 'nirath' };
  }

  // 5. 默认返回通用森林
  return { zone: '森林', library: 'generic' };
}

/**
 * 生成环境音效描述
 */
function generateAmbientSoundBlock(shot, plan, options = {}) {
  const { zone, library } = detectEnvironmentZone(shot, plan);
  
  const lib = library === 'nirath' ? NIRATH_AMBIENCE_LIBRARY : GENERIC_AMBIENCE_LIBRARY;
  const zoneData = lib[zone];
  
  if (!zoneData) {
    console.log(`  [EnvironmentSoundDesigner] ⚠️ 未找到生态区 "${zone}" 的音效库`);
    return null;
  }

  // 选择音效（默认选3个，可配置）
  const count = options.soundCount || 3;
  const selectedSounds = zoneData.sounds.slice(0, count);
  
  // 构建 AmbientSoundBlock
  const soundBlock = `AmbientSoundBlock: ${selectedSounds.join(', ')}. Atmosphere: ${zoneData.atmosphere}.`;
  
  console.log(`  [EnvironmentSoundDesigner] 🔊 ${zone}环境音效已生成: ${selectedSounds.length}个声音元素`);
  
  return {
    block: soundBlock,
    zone,
    library,
    sounds: selectedSounds,
    atmosphere: zoneData.atmosphere,
    length: soundBlock.length
  };
}

/**
 * 为镜头注入环境音效（简化接口）
 */
function injectAmbientSound(shot, plan, options = {}) {
  const result = generateAmbientSoundBlock(shot, plan, options);
  if (!result) return null;
  
  // 注入到 shot 对象供后续使用
  shot._ambientSoundBlock = result.block;
  shot._ambientSoundMeta = {
    zone: result.zone,
    library: result.library,
    sounds: result.sounds,
    atmosphere: result.atmosphere
  };
  
  return result.block;
}

/**
 * 批量生成环境音效（用于预生产检查）
 */
function batchGenerateAmbientSounds(shots, plan, options = {}) {
  const results = {};
  for (const shot of shots) {
    const result = generateAmbientSoundBlock(shot, plan, options);
    if (result) {
      results[shot.id] = result;
    }
  }
  return results;
}

// ========== 导出 ==========

module.exports = {
  generateAmbientSoundBlock,
  injectAmbientSound,
  batchGenerateAmbientSounds,
  detectEnvironmentZone,
  NIRATH_AMBIENCE_LIBRARY,
  GENERIC_AMBIENCE_LIBRARY,
  ENVIRONMENT_KEYWORDS
};

// CLI 测试
if (require.main === module) {
  const testShot = {
    id: 'S01',
    description: '小G穿越Nirath断裂山脉峡谷，发现远古战场遗迹',
    type: 'action'
  };
  const testPlan = { worldview: 'nirath' };
  
  const result = generateAmbientSoundBlock(testShot, testPlan);
  console.log('\n🎵 环境音效测试:');
  console.log(`生态区: ${result.zone}`);
  console.log(`音效库: ${result.library}`);
  console.log(`音效块: ${result.block}`);
  console.log(`氛围: ${result.atmosphere}`);
  console.log(`长度: ${result.length}字`);
}