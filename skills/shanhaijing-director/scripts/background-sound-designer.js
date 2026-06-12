'use strict';

/**
 * Universal Background Sound Designer v1.0-Peng
 *
 * 🆕 v1.0-Peng (2026-06-12): 通用化重构
 *   - 从 ShanhaiStory Forge 专属模块升级为通用视频制作系统的背景音效设计器
 *   - 引入专业电影音效设计框架: Murch层次、频率分离、叙事功能、镜头衔接连续性
 *   - LLM prompt 不再硬编码 Nirath/山海经，改为 genre + worldContext 参数化
 *   - 本地 fallback 不再依赖异兽/光脉等世界特定关键词，使用通用电影分类
 *
 * 设计框架:
 *   1. Murch 音效层次: Dialogue > Sound Effects > Music (diegetic/non-diegetic 区分)
 *   2. 频率分离: 低频 rumble (20-200Hz) / 中频 texture (200-2kHz) / 高频 detail (2k-20kHz)
 *   3. 叙事功能: establishing / transitional / emotional cue / tension builder / release
 *   4. 镜头衔接: 相邻镜头间的音效过渡设计 (audio bridge / crossfade / hard cut)
 *   5. 类型调色板: 每种 genre 有独立的音效风格指南
 *
 * 用法:
 *   const { designBackgroundSound } = require('./background-sound-designer');
 *   const sound = await designBackgroundSound({
 *     scene: 'dark alley at night, neon signs flickering',
 *     mood: 'tense, noir, suspenseful',
 *     action: 'detective walks cautiously, hand on holster',
 *     camera: 'slow dolly forward, low angle',
 *     duration: 8,
 *     genre: 'noir',
 *     environment: 'urban',
 *     prevShotSound: 'AMBIENT: ...',  // optional
 *     worldContext: '2049 Neo-Tokyo, perpetual rain, hologram ads'  // optional
 *   });
 */

const { LLMReasoningLayer } = require('./llm-reasoning-layer');

// ==================== 类型音效调色板 ====================

const GENRE_SOUND_PALETTE = {
  fantasy: {
    signature: 'magical resonance, ethereal chimes, ancient energy hum, mythical creature presence',
    lowEnd: 'deep earth rumble, primordial bass, tectonic resonance',
    midRange: 'enchanted wind, crystal harmonics, spellcasting sizzle',
    highEnd: 'fairy dust sparkle, magical particle chime, ethereal whisper',
    avoid: 'modern mechanical sounds, digital beeps, urban traffic'
  },
  scifi: {
    signature: 'synthetic drones, data stream hum, holographic flicker, quantum resonance',
    lowEnd: 'starship engine sub-bass, wormhole gravity well, reactor core thrum',
    midRange: 'computer processing whir, servo-mechanical movement, plasma field oscillation',
    highEnd: 'digital interface chime, laser refraction ping, quantum particle sizzle',
    avoid: 'medieval weapons, horse hooves, campfire crackle'
  },
  horror: {
    signature: 'dissonant drone, infrasound pressure, irregular heartbeat rhythm, cold silence gaps',
    lowEnd: 'subterranean groan, structural stress creak, predator breathing, 18Hz fear frequency',
    midRange: 'scratching inside walls, distant footsteps, wet organic squelch, whispered fragments',
    highEnd: 'violin string scrape, metal stress whine, child laughter echo, glass crack propagation',
    avoid: 'upbeat music, cheerful birdsong, comedy sound effects'
  },
  noir: {
    signature: 'rain on asphalt, distant saxophone, neon buzz, cigarette burn, lonely footsteps',
    lowEnd: 'city rumble, thunder roll, bass string pluck, elevator machinery',
    midRange: 'rain patter, venetian blind rattle, typewriter clack, whiskey pour',
    highEnd: 'neon hum 60Hz, match strike, police siren distant, telephone ring',
    avoid: 'epic orchestral swells, cartoon sounds, nature ambience'
  },
  action: {
    signature: 'impact percussion, debris scatter, adrenaline pulse, velocity whoosh',
    lowEnd: 'explosion sub-bass, vehicle engine roar, building collapse rumble, shockwave propagation',
    midRange: 'gunfire crack, metal impact, glass shatter, fist impact, tire screech',
    highEnd: 'bullet whiz, ricochet ping, spark scatter, alarm beep, radio static',
    avoid: 'peaceful nature, lullaby melodies, quiet dialogue ambience'
  },
  drama: {
    signature: 'intimate room tone, subtle emotional undertone, breathing space, environmental texture',
    lowEnd: 'heating system hum, distant traffic, heartbeat sub-bass, emotional weight drone',
    midRange: 'fabric rustle, cup placement, pen on paper, gentle wind through window',
    highEnd: 'clock tick, rain on window, bird outside, phone vibration',
    avoid: 'explosions, epic swells, cartoon sounds, aggressive SFX'
  },
  documentary: {
    signature: 'naturalistic ambience, authentic location sound, minimal manipulation, observational texture',
    lowEnd: 'environmental foundation, geological presence, architectural resonance',
    midRange: 'human activity sounds, natural world texture, mechanical operation',
    highEnd: 'wildlife calls, weather detail, human voice fragments, tool sounds',
    avoid: 'synthetic drones, magical effects, exaggerated impact sounds'
  },
  comedy: {
    signature: 'bright room tone, rhythmic punctuation, playful accents, timing-aware silence',
    lowEnd: 'warm room ambience, subtle bass punctuation, comedic rumble',
    midRange: 'door slam, pratfall impact, object fumble, exaggerated Foley',
    highEnd: 'rimshot, slide whistle, cartoon zip, record scratch, comedic sting',
    avoid: 'horror drones, tragic strings, epic battle sounds'
  },
  romance: {
    signature: 'warm intimate space, gentle breeze, soft fabric, emotional warmth',
    lowEnd: 'fireplace crackle, heartbeat warmth, gentle ocean swell, emotional bass pad',
    midRange: 'soft piano key, wine glass clink, page turn, gentle laughter',
    highEnd: 'wind chime, bird song, champagne bubble, jewelry sparkle',
    avoid: 'aggressive percussion, horror stings, industrial noise'
  },
  thriller: {
    signature: 'ticking clock, heartbeat acceleration, held breath, creeping tension',
    lowEnd: 'sub-bass pressure, distant threat rumble, underground resonance, pulse quickening',
    midRange: 'footsteps approaching, door creak, phone ring, breath pattern shift',
    highEnd: 'high string tension, metal stress, glass fracture, electronic beep acceleration',
    avoid: 'peaceful nature, comedy sounds, relaxed ambience'
  }
};

// ==================== 通用环境音库 ====================

const ENVIRONMENT_LIBRARY = {
  forest: {
    layers: [
      'wind through canopy, layered leaf rustle at multiple depths',
      'distant bird calls with natural reverb, occasional wing flutter',
      'branch creak and forest floor debris settling, subtle animal movement'
    ],
    spatial: 'wide stereo field, canopy sounds above, floor texture below, 360° natural placement',
    freqProfile: 'low: earth/root resonance | mid: leaf/animal texture | high: bird/insect detail'
  },
  mountain: {
    layers: [
      'wind howling through rock formations, pressure differential whistle',
      'distant rockfall echo, geological settling groan',
      'thin air texture, altitude pressure hum, sparse bird cry'
    ],
    spatial: 'expansive stereo with height cues, wind direction shifts, echo from distant peaks',
    freqProfile: 'low: geological rumble | mid: wind texture | high: thin air whistle'
  },
  urban: {
    layers: [
      'distant traffic drone, layered vehicle pass-bys at varying distances',
      'building HVAC resonance, electrical infrastructure hum',
      'occasional siren echo, construction impact, crowd murmur fragments'
    ],
    spatial: 'dense mid-field stereo, vehicles pan L-R, height layers for elevated sounds',
    freqProfile: 'low: traffic/construction rumble | mid: crowd/activity | high: sirens/alarms'
  },
  underwater: {
    layers: [
      'deep water pressure ambience, low-frequency current movement',
      'bubble streams rising, distant marine life calls with long reverb',
      'sonar ping echo, hull stress creak, propeller cavitation'
    ],
    spatial: '360° submerged field, sounds arrive from all directions with frequency-dependent attenuation',
    freqProfile: 'low: water mass/pressure | mid: marine life | high: sonar/bubble detail'
  },
  desert: {
    layers: [
      'wind over sand dunes, granular particle movement texture',
      'heat shimmer drone, distant rock thermal expansion crack',
      'extreme silence punctuated by sparse insect buzz, vulture cry'
    ],
    spatial: 'vast stereo field, extreme distance cues, wind direction as primary spatial anchor',
    freqProfile: 'low: dune resonance | mid: wind texture | high: insect/heat shimmer'
  },
  cave: {
    layers: [
      'water drip echo with natural cavern reverb tail',
      'deep earth resonance, subterranean pressure ambience',
      'bat wing flutter, distant rock shift, airflow through passages'
    ],
    spatial: 'enclosed reverb field, strong early reflections, sound source localization blurred by echo',
    freqProfile: 'low: earth resonance | mid: drip/echo texture | high: bat/air detail'
  },
  arctic: {
    layers: [
      'wind over ice field, crystalline particle drift',
      'glacier movement groan, ice crack propagation with sharp transients',
      'extreme cold silence, snow compression underfoot, distant animal call'
    ],
    spatial: 'wide frozen stereo field, wind as primary spatial element, ice cracks localize sharply',
    freqProfile: 'low: glacier movement | mid: wind texture | high: ice crack detail'
  },
  space: {
    layers: [
      'spacecraft hull stress, thermal expansion/contraction creak',
      'life support system hum, oxygen flow, electrical bus resonance',
      'vacuum silence between interior sounds, radiation particle impact ping'
    ],
    spatial: 'interior: close-mono field with equipment localization | exterior: vacuum silence',
    freqProfile: 'low: engine/hull resonance | mid: life support | high: computer/radiation detail'
  },
  indoor: {
    layers: [
      'room tone with HVAC presence, electrical hum from appliances',
      'building settlement creak, plumbing water flow through walls',
      'outside world muffled through structure, occasional door/floor sound from adjacent rooms'
    ],
    spatial: 'enclosed stereo field, sound source localization clear, room reverb character',
    freqProfile: 'low: building/HVAC rumble | mid: room activity | high: electrical/outside detail'
  },
  battlefield: {
    layers: [
      'distant artillery impact, shockwave propagation with delayed arrival',
      'debris rain after explosion, fire crackle at multiple distances',
      'radio chatter fragments, distant shouting, weapon mechanical sounds'
    ],
    spatial: 'chaotic 360° field, impacts at all distances, Doppler shift on flybys, ear-ringing proximity',
    freqProfile: 'low: explosion/impact | mid: debris/weapon | high: radio/ricochet'
  },
  coastal: {
    layers: [
      'wave rhythm with layered surf at shore, undertow pull texture',
      'seabird calls with ocean reverb, wind through dune grass',
      'distant foghorn, buoy bell, boat engine drone on horizon'
    ],
    spatial: 'wide ocean stereo, waves L-R with shore direction, height for birds, distance for boats',
    freqProfile: 'low: wave/undertow | mid: wind/birds | high: foghorn/buoy detail'
  }
};

// ==================== 叙事功能模板 ====================

const NARRATIVE_FUNCTIONS = {
  establishing: {
    description: 'Establish location, time, atmosphere — wide sonic canvas, slow build',
    intensityCurve: (d) => `slow fade-in 0-${Math.floor(d * 0.3)}s, steady ambient ${Math.floor(d * 0.3)}-${d}s`,
    layerCount: 4
  },
  transitional: {
    description: 'Bridge between scenes — carry one sonic element across, introduce next',
    intensityCurve: (d) => `crossfade: previous scene element decays 0-${Math.floor(d * 0.4)}s, new scene emerges ${Math.floor(d * 0.3)}-${d}s`,
    layerCount: 3
  },
  emotional: {
    description: 'Underscore emotional beat — subtle, character-subjective sound design',
    intensityCurve: (d) => `gentle swell 0-${Math.floor(d * 0.5)}s, emotional peak ${Math.floor(d * 0.5)}-${Math.floor(d * 0.7)}s, tender decay ${Math.floor(d * 0.7)}-${d}s`,
    layerCount: 3
  },
  tension: {
    description: 'Build suspense — layering, frequency narrowing, volume automation',
    intensityCurve: (d) => `creeping build 0-${Math.floor(d * 0.6)}s, held breath ${Math.floor(d * 0.6)}-${Math.floor(d * 0.85)}s, release ${Math.floor(d * 0.85)}-${d}s`,
    layerCount: 4
  },
  action_climax: {
    description: 'Peak intensity — full frequency spectrum, maximum layer density, impact punctuation',
    intensityCurve: (d) => `immediate impact 0-0.5s, sustained peak 0.5-${Math.floor(d * 0.7)}s, ringing decay ${Math.floor(d * 0.7)}-${d}s`,
    layerCount: 5
  },
  release: {
    description: 'Resolution after tension — frequency spectrum opens, layers thin out, reverb tail',
    intensityCurve: (d) => `release swell 0-${Math.floor(d * 0.2)}s, gradual thinning ${Math.floor(d * 0.2)}-${Math.floor(d * 0.7)}s, reverb tail ${Math.floor(d * 0.7)}-${d}s`,
    layerCount: 2
  }
};

// ==================== 镜头衔接连续性 ====================

/**
 * 生成镜头间音效过渡策略
 */
function _buildTransitionStrategy(shot, prevShotSound, nextShotSound) {
  if (!prevShotSound && !nextShotSound) return null;

  const parts = [];
  if (prevShotSound) {
    parts.push('IN: crossfade from previous shot ambient, carry one sonic element across cut');
  }
  if (nextShotSound) {
    parts.push('OUT: introduce next shot sonic preview in final 1-2s, smooth audio bridge');
  }
  return parts.join(' | ');
}

// ==================== 叙事功能推断 ====================

function _inferNarrativeFunction(shot, storyPlan) {
  const mood = (shot?.Mood || shot?.mood || '').toLowerCase();
  const action = (shot?.Action || shot?.action || '').toLowerCase();
  const type = (shot?.type || '').toLowerCase();
  const shotId = (shot?.id || '').toUpperCase();

  // S00 = establishing
  if (shotId === 'S00' || type === 'opening_title') return 'establishing';

  // 情绪驱动
  if (/epic|climax|climactic|peak|final|ultimate|决战|高潮/.test(mood + action)) return 'action_climax';
  if (/tense|tension|suspense|nervous|anxious|紧张|悬疑|不安/.test(mood + action)) return 'tension';
  if (/sad|tragic|mourn|grief|cry|悲伤|哀|哭|离别/.test(mood + action)) return 'emotional';
  if (/calm|peace|relief|resolve|宁静|释然|和解/.test(mood + action)) return 'release';
  if (/transition|bridge|passage|过渡|转场/.test(mood + action + type)) return 'transitional';

  // 结构驱动
  if (type === 'establishing' || type === '建置') return 'establishing';
  if (type === 'transition' || type === '过渡') return 'transitional';

  return 'establishing'; // default
}

// ==================== 主入口: LLM 驱动 ====================

/**
 * LLM 推理生成背景音效 — 通用版
 */
async function _designWithLLM(params) {
  const llm = new LLMReasoningLayer();

  const {
    scene, mood, action, camera, character,
    duration, genre, environment, worldContext,
    prevShotSound, nextShotSound
  } = params;

  const genrePalette = GENRE_SOUND_PALETTE[genre] || GENRE_SOUND_PALETTE['drama'];
  const envLib = ENVIRONMENT_LIBRARY[environment] || null;

  const systemPrompt = `You are a professional film sound designer with expertise across all genres. Design a rich, layered background ambient sound for a single shot.

FRAMEWORK — Apply these professional sound design principles:

1. MURCH HIERARCHY: Dialogue > Sound Effects > Music. Distinguish diegetic (in-world) from non-diegetic (score/emotional) sounds. Background ambience is diegetic.

2. FREQUENCY SEPARATION: Allocate sounds across the spectrum to avoid masking:
   - LOW (20-200Hz): rumble, weight, threat, geological presence
   - MID (200-2000Hz): texture, activity, spatial definition
   - HIGH (2k-20kHz): detail, sparkle, tension, proximity cues

3. NARRATIVE FUNCTION: Every sound should serve the story. Identify what this shot's sound is DOING (establishing location, building tension, emotional underscore, transition bridge, release).

4. SHOT CONTINUITY: Consider how this shot's sound connects to adjacent shots. Audio bridges, crossfades, or hard cuts — each has narrative meaning.

5. GENRE PALETTE: ${genre} genre signature sounds: ${genrePalette.signature}. Use: ${genrePalette.lowEnd} | ${genrePalette.midRange} | ${genrePalette.highEnd}. Avoid: ${genrePalette.avoid}.

CRITICAL RULE: Never reduce a complex scene to a single generic sound. Decompose every environment into its acoustic layers. A "busy marketplace" is NOT just "crowd noise" — it's vendor calls, footsteps on cobblestone, fabric rustle, coin exchange, animal sounds, cooking sizzle, distant music, architectural echo.

OUTPUT FORMAT — Exactly one line, no markdown, no extra text:
AMBIENT: [3-5 layered sound descriptions, each 8-15 words, separated by | ] | SPATIAL: [L/R panning, 3D movement, height cues, distance layers] | INTENSITY: [time-based volume curve with second markers] | FREQUENCY: [low/mid/high allocation per layer] | FUNCTION: [narrative purpose of this sound design]`;

  const userPrompt = `Design background sound:
DURATION: ${duration}s
GENRE: ${genre}
SCENE: ${scene}
MOOD: ${mood}
ACTION: ${action}
CAMERA: ${camera}
CHARACTER: ${character}
ENVIRONMENT: ${environment || 'auto-detect'}
${worldContext ? `WORLD CONTEXT: ${worldContext}` : ''}
${prevShotSound ? `PREV SHOT SOUND: ${prevShotSound.substring(0, 200)}` : ''}
${nextShotSound ? `NEXT SHOT SOUND: ${nextShotSound.substring(0, 200)}` : ''}

Generate the AMBIENT | SPATIAL | INTENSITY | FREQUENCY | FUNCTION line.`;

  const result = await llm.llmReason({
    stage: 'background-sound-design-universal',
    systemPrompt, userPrompt,
    level: 'light',
    llmOptions: { temperature: 0.7, maxTokens: 500 },
    fallback: () => null
  });

  if (!result || !result.success || result.fallbackUsed || !result.result) return null;

  const text = (typeof result.result === 'string' ? result.result : '').trim();
  if (/AMBIENT:.*SPATIAL:.*INTENSITY:/i.test(text)) return text;
  return null;
}

// ==================== 本地规则降级 ====================

function _designLocal(params) {
  const {
    scene, mood, action, camera, character,
    duration, genre, environment, worldContext,
    prevShotSound, nextShotSound
  } = params;

  const combined = `${scene} ${mood} ${action} ${character}`.toLowerCase();
  const genrePalette = GENRE_SOUND_PALETTE[genre] || GENRE_SOUND_PALETTE['drama'];
  const narrativeFunc = _inferNarrativeFunction(
    { Mood: mood, Action: action, type: params.shotType, id: params.shotId },
    params.storyPlan
  );

  // 1. 环境音层 — 从通用环境库匹配
  const ambientLayers = [];
  let matchedEnv = null;

  for (const [envKey, envData] of Object.entries(ENVIRONMENT_LIBRARY)) {
    const envPatterns = {
      forest: /forest|woods|jungle|tree|grove|林|森|丛林|树/,
      mountain: /mountain|cliff|canyon|peak|ridge|山|崖|峰|峡谷/,
      urban: /city|urban|street|alley|building|城|街|楼|巷|都市/,
      underwater: /underwater|ocean|sea|deep|submarine|海|水|洋|潜/,
      desert: /desert|sand|dune|arid|wasteland|沙|漠|荒/,
      cave: /cave|cavern|tunnel|underground|洞|穴|隧道|地下/,
      arctic: /ice|snow|arctic|frozen|glacier|冰|雪|冻|极/,
      space: /space|spaceship|orbit|asteroid|太空|飞船|星/,
      indoor: /room|house|hall|corridor|indoor|室|房|厅|廊/,
      battlefield: /battle|war|combat|fight|战|斗|争/,
      coastal: /coast|beach|shore|ocean|harbor|岸|滩|港|滨/
    };

    if (envPatterns[envKey]?.test(combined)) {
      matchedEnv = envData;
      break;
    }
  }

  // 如果明确指定了 environment，优先使用
  if (environment && ENVIRONMENT_LIBRARY[environment]) {
    matchedEnv = ENVIRONMENT_LIBRARY[environment];
  }

  if (matchedEnv) {
    ambientLayers.push(...matchedEnv.layers);
  } else {
    // 兜底：基于 genre 生成通用环境
    ambientLayers.push(
      `${genre} atmosphere, environmental foundation with spatial depth`,
      `subtle ${genrePalette.signature.split(',')[0].trim()}, ambient texture layer`,
      'distant environmental activity, natural reverb character'
    );
  }

  // 2. 类型特定音效增强
  const genreLow = genrePalette.lowEnd.split(',')[0].trim();
  const genreHigh = genrePalette.highEnd.split(',')[0].trim();
  ambientLayers.push(`genre texture: ${genreLow}, subtle ${genreHigh}`);

  // 3. 世界上下文注入
  if (worldContext) {
    const ctxShort = worldContext.substring(0, 80);
    ambientLayers.push(`world-specific: ${ctxShort}`);
  }

  // 4. 空间音频
  let spatial = matchedEnv?.spatial || 'stereo ambient field, subtle panning with camera movement';
  if (/pan|sweep|dolly|track|orbit|whip|环绕|摇|推|跟|甩/.test(combined + camera)) {
    spatial = '3D spatial audio synchronized with camera movement, dynamic L-R balance with Doppler cues';
  }

  // 5. 强度曲线
  const funcTemplate = NARRATIVE_FUNCTIONS[narrativeFunc] || NARRATIVE_FUNCTIONS['establishing'];
  const intensity = funcTemplate.intensityCurve(duration);

  // 6. 频率分配
  const freqProfile = matchedEnv?.freqProfile ||
    `low: ${genrePalette.lowEnd.split(',')[0]} | mid: ${genrePalette.midRange.split(',')[0]} | high: ${genrePalette.highEnd.split(',')[0]}`;

  // 7. 叙事功能
  const funcDesc = funcTemplate.description;

  // 8. 镜头衔接
  const transition = _buildTransitionStrategy(
    { id: params.shotId }, prevShotSound, nextShotSound
  );

  const ambient = ambientLayers.slice(0, 4).join(' | ');
  let result = `AMBIENT: ${ambient} | SPATIAL: ${spatial} | INTENSITY: ${intensity} | FREQUENCY: ${freqProfile} | FUNCTION: ${funcDesc}`;
  if (transition) result += ` | TRANSITION: ${transition}`;

  return result;
}

// ==================== 公共 API ====================

/**
 * 主入口: 设计单个镜头的背景音效
 *
 * @param {Object} params
 * @param {string} params.scene - 场景描述
 * @param {string} params.mood - 情绪/氛围
 * @param {string} params.action - 动作描述
 * @param {string} [params.camera] - 镜头运动
 * @param {string} [params.character] - 角色描述
 * @param {number} params.duration - 镜头时长(秒)
 * @param {string} params.genre - 类型: fantasy|scifi|horror|noir|action|drama|documentary|comedy|romance|thriller
 * @param {string} [params.environment] - 环境: forest|mountain|urban|underwater|desert|cave|arctic|space|indoor|battlefield|coastal
 * @param {string} [params.worldContext] - 世界观上下文(可选，如 "Nirath: bioluminescent ecosystem, dual suns")
 * @param {string} [params.prevShotSound] - 前一镜头音效(用于衔接)
 * @param {string} [params.nextShotSound] - 后一镜头音效(用于衔接)
 * @param {Object} [params.shot] - 原始 shot 对象(向后兼容)
 * @param {Object} [params.storyPlan] - 故事计划(向后兼容)
 * @param {string} [params.shotType] - 镜头类型(向后兼容)
 * @param {string} [params.shotId] - 镜头ID(向后兼容)
 * @returns {Promise<string>} 格式化的背景音效文本
 */
async function designBackgroundSound(params = {}) {
  // 归一化参数
  const normalized = _normalizeParams(params);

  // 先尝试 LLM
  try {
    const llmResult = await _designWithLLM(normalized);
    if (llmResult) {
      console.log(`   🎵 Universal BG Sound (LLM) — ${normalized.genre}/${normalized.environment || 'auto'}`);
      return llmResult;
    }
  } catch (err) {
    console.log(`   ⚠️ LLM BG sound failed: ${err.message?.substring(0, 60)}, falling back to local rules`);
  }

  // 降级本地规则
  const localResult = _designLocal(normalized);
  console.log(`   🎵 Universal BG Sound (local) — ${normalized.genre}/${normalized.environment || 'auto'}`);
  return localResult;
}

/**
 * 参数归一化: 支持新旧两种调用方式
 */
function _normalizeParams(params) {
  const shot = params.shot || {};
  const storyPlan = params.storyPlan || {};

  return {
    scene: params.scene || shot.Scene || shot.scene || shot.description || '',
    mood: params.mood || shot.Mood || shot.mood || shot.emotion || '',
    action: params.action || shot.Action || shot.action || '',
    camera: params.camera || shot.Camera || shot.camera || '',
    character: params.character || shot.Character || shot.character || '',
    duration: params.duration || shot.duration || 6,
    genre: params.genre || _inferGenre(shot, storyPlan),
    environment: params.environment || _inferEnvironment(shot),
    worldContext: params.worldContext || storyPlan.worldContext || '',
    prevShotSound: params.prevShotSound || '',
    nextShotSound: params.nextShotSound || '',
    // 向后兼容
    shotType: params.shotType || shot.type || 'normal',
    shotId: params.shotId || shot.id || 'UNKNOWN',
    shot,
    storyPlan
  };
}

/**
 * 从 shot/storyPlan 推断 genre
 */
function _inferGenre(shot, storyPlan) {
  const videoType = (storyPlan?.videoType || '').toLowerCase();
  const genreMap = {
    'shanhaijing': 'fantasy',
    'fantasy': 'fantasy',
    'scifi': 'scifi',
    'sci-fi': 'scifi',
    'horror': 'horror',
    'noir': 'noir',
    'action': 'action',
    'drama': 'drama',
    'documentary': 'documentary',
    'comedy': 'comedy',
    'romance': 'romance',
    'thriller': 'thriller'
  };
  return genreMap[videoType] || 'drama';
}

/**
 * 从 shot 推断 environment
 */
function _inferEnvironment(shot) {
  const combined = `${shot.Scene || ''} ${shot.scene || ''} ${shot.description || ''}`.toLowerCase();
  const envPatterns = {
    forest: /forest|woods|jungle|tree|grove|林|森|丛林/,
    mountain: /mountain|cliff|canyon|peak|ridge|山|崖|峰/,
    urban: /city|urban|street|alley|building|城|街|楼|巷/,
    underwater: /underwater|ocean|sea|deep|submarine|海|洋|潜/,
    desert: /desert|sand|dune|arid|沙|漠|荒/,
    cave: /cave|cavern|tunnel|underground|洞|穴|隧道/,
    arctic: /ice|snow|arctic|frozen|glacier|冰|雪|冻/,
    space: /space|spaceship|orbit|asteroid|太空|飞船|星/,
    indoor: /room|house|hall|corridor|indoor|室|房|厅|廊/,
    battlefield: /battle|war|combat|fight|战|斗/,
    coastal: /coast|beach|shore|ocean|harbor|岸|滩|港/
  };

  for (const [env, pattern] of Object.entries(envPatterns)) {
    if (pattern.test(combined)) return env;
  }
  return null; // auto-detect
}

module.exports = {
  designBackgroundSound,
  GENRE_SOUND_PALETTE,
  ENVIRONMENT_LIBRARY,
  NARRATIVE_FUNCTIONS
};
