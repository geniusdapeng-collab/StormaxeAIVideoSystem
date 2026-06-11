'use strict';

/**
 * Adrenaline Shot Library v1.0-Peng
 * 肾上腺镜头库 — 极限运动震撼视觉系统
 * 
 * 特色：第一视角(POV) + 外部跟拍双系统
 * 运动员视角让观众身临其境，外部跟拍展现极限瞬间
 * 
 * 支持运动类型：
 * - skiing:      高山滑雪
 * - wingsuit:    翼装飞行
 * - surfing:     冲浪
 * - parkour:     跑酷
 * - climbing:     徒手攀岩
 * - mountain_bike: 速降山地车
 * 
 * 镜头层级：
 * L1-ATOMIC    — 不可分割的运动原子镜头
 * L2-COMBO     — 预制组合模板（直接抽取使用）
 * L3-INJECT     — 注入函数（集成到shot prompt）
 */

const SPORTS = {
  skiing: {
    name: '高山滑雪',
    nameEn: 'Alpine Skiing',
    atmosphere: '冰冷、速度、雪山、狂风呼啸',
    emotions: ['exhilaration', 'fear', 'triumph', 'flow_state'],
    signatureMoves: ['carving_turn', 'aerial_jump', 'powder_cloud', 'steep_drop'],
    hazards: ['ice_patch', 'rock', 'tree', 'cliff_edge', 'narrow_pass']
  },
  wingsuit: {
    name: '翼装飞行',
    nameEn: 'Wingsuit Flying',
    atmosphere: '天空、自由落体、气流、山脊掠过',
    emotions: ['terror', 'ecstasy', 'unity_with_air', 'mortality_risk'],
    signatureMoves: ['pull_up', 'dive_bomberman', 'glide_pass', 'formation'],
    hazards: ['ridge', 'cliff', 'tree', 'power_line', 'ground_proximity']
  },
  surfing: {
    name: '冲浪',
    nameEn: 'Surfing',
    atmosphere: '海洋、巨浪、盐水、阳光折射',
    emotions: ['flow', 'awe', 'risk', 'connection_nature'],
    signatureMoves: ['paddle_takeoff', 'bottom_turn', 'tube_ride', 'aerial_full_rotation'],
    hazards: ['closeout_wave', 'reef', 'wipeout', 'currents', 'collision']
  },
  parkour: {
    name: '跑酷',
    nameEn: 'Parkour',
    atmosphere: '城市丛林、钢筋水泥、极限位移',
    emotions: ['control', 'freedom', 'rebellion', 'precision'],
    signatureMoves: ['vault', 'wall_run', 'cat_balance', 'precision_jump', 'lache'],
    hazards: ['gap', 'rooftop_edge', 'unstable_surface', 'obstacle_sequence']
  },
  climbing: {
    name: '徒手攀岩',
    nameEn: 'Free Solo Climbing',
    atmosphere: '岩壁、高空、独攀、专注到极致',
    emotions: ['focus', 'fear', 'solitude', 'triumph'],
    signatureMoves: ['finger_crimp', 'mono_pocket', 'heel_hook', 'dynamic_catch'],
    hazards: ['loose_rock', 'glossy_surface', 'height', 'exhaustion_zone']
  },
  mountain_bike: {
    name: '速降山地车',
    nameEn: 'Mountain Bike Downhill',
    atmosphere: '泥土、碎石、陡坡、飞坠',
    emotions: ['adrenaline', 'roughness', 'commitment', 'speed'],
    signatureMoves: ['drop_off', 'jump_whoops', 'rock_garden', 'steep_switchback'],
    hazards: ['loose_gravel', 'steep_cliff', 'root_ball', 'jump_landing']
  }
};

// =====================================================================
// LAYER 1: ATOMIC SHOTS — 运动原子镜头（不可分割的最小单位）
// =====================================================================

/**
 * FVP — First Vision Perspective（运动员第一视角）
 * 核心理念：观众变成运动员，看到他们所看，感受他们所感
 */
const FVP_SHOTS = {
  // 通用FVP原子镜头
  speed_poV: {
    name: '极速POV',
    trigger: 'speed_rush',
    description: 'POV speed lines dominate frame, peripheral vision blurs, sense of velocity overwhelming',
    camera: '第一视角正面，动态模糊主导画面，边缘视觉消失',
    duration: '1.5-3s',
    emotion: 'adrenaline_rush',
    keywords: ['POV', 'speed lines', 'motion blur', 'peripheral wipe', 'first person']
  },
  fear_poV: {
    name: '恐惧POV',
    trigger: 'fear_height',
    description: 'Eyes focus forward, slight shake, depth perception amplifies danger ahead',
    camera: '视线前方聚焦，轻微颤抖，深度感知放大前方危险',
    duration: '2-3s',
    emotion: 'fear',
    keywords: ['POV', 'shake', 'focus', 'depth', 'danger ahead', 'first person']
  },
  wait_poV: {
    name: '等待POV',
    trigger: 'tension_build',
    description: 'POV scans environment, assessing risk, breath control visible in frame edges',
    camera: '视线扫描环境，评估风险，呼吸控制体现在画面边缘',
    duration: '2-4s',
    emotion: 'tension',
    keywords: ['POV', 'scan', 'assess', 'breath', 'tension', 'first person']
  },
  g_force_poV: {
    name: 'G力POV',
    trigger: 'high_g',
    description: 'Peripheral vision narrows to tunnel, g-force pushes body back, tunnel vision onset',
    camera: '周边视野收窄成隧道，G力推背，隧道视觉开始',
    duration: '1-2s',
    emotion: 'overwhelming_force',
    keywords: ['POV', 'tunnel vision', 'g-force', 'blackout edges', 'first person']
  },
  splash_poV: {
    name: '水溅POV',
    trigger: 'water_impact',
    description: 'POV through water splash, light fractals, momentary blindness, water roar',
    camera: '透过水花看，水光折射，暂时失明，水声轰鸣',
    duration: '1-2s',
    emotion: 'chaos',
    keywords: ['POV', 'water splash', 'light fractals', 'blindness', 'first person']
  },
  wind_poV: {
    name: '狂风POV',
    trigger: 'extreme_wind',
    description: 'Hair and debris streak horizontally, face mask distortion, wind roar dominant',
    camera: '头发杂物横飞，面罩变形，风声主导听觉',
    duration: '1.5-3s',
    emotion: 'exposure',
    keywords: ['POV', 'wind streaks', 'debris', 'mask distortion', 'first person']
  }
};

/**
 * EFX — External Fixed Shot（外部跟拍摄影师视角）
 * 核心理念：展现运动员与极限环境搏斗的完整姿态
 */
const EFX_SHOTS = {
  // 通用EFX原子镜头
 极速_侧跟: {
    name: '极速侧跟',
    trigger: 'speed_run',
    description: 'Camera low at subject level, lateral tracking at max speed, subject centered',
    camera: '相机与运动员同高，横向极速追踪，主体居中',
    duration: '2-4s',
    emotion: 'speed',
    keywords: ['side tracking', 'low angle', 'speed', 'lateral', 'follow cam']
  },
  环绕捕捉: {
    name: '环绕捕捉',
    trigger: 'aerial_reveal',
    description: 'Drone or camera orbits subject, reveals scale of action, dynamic reveal',
    camera: '无人机或相机环绕主体，揭示动作规模和空间',
    duration: '3-5s',
    emotion: 'scale_revelation',
    keywords: ['drone orbit', 'reveal', 'scale', 'dynamic', 'aerial']
  },
  慢动作定格: {
    name: '慢动作定格',
    trigger: 'peak_moment',
    description: 'At critical instant, time stretches — muscle tension, spray, expression all visible',
    camera: '关键时刻，时间拉长 — 肌肉张力、水花、表情全部可见',
    duration: '2-4s',
    emotion: 'suspense',
    keywords: ['slow motion', 'freeze frame', 'peak tension', 'dramatic']
  },
  超低角仰拍: {
    name: '超低角仰拍',
    trigger: 'hero_angle',
    description: 'Camera nearly ground level looking up, subject against sky or backdrop, heroic framing',
    camera: '相机几乎贴地仰视，主体以天空为背景，英雄式构图',
    duration: '2-3s',
    emotion: 'heroism',
    keywords: ['low angle', 'hero shot', 'against sky', 'heroic', 'ground level']
  },
  高速甩镜: {
    name: '高速甩镜',
    trigger: 'punchy_transition',
    description: 'Camera whips past or through environment, subject reappears in new position',
    camera: '相机极速甩过或穿过环境，主体在新位置重新出现',
    duration: '1-2s',
    emotion: 'excitement',
    keywords: ['whip pan', 'speed ramp', 'dynamic transition', 'punchy']
  },
  长焦压缩: {
    name: '长焦压缩',
    trigger: 'compression',
    description: 'Telephoto flattens depth, athlete against distant backdrop, surreal compression',
    camera: '长焦压缩空间感，运动员与远景背景重叠，超现实压缩感',
    duration: '2-3s',
    emotion: 'surreal',
    keywords: ['telephoto', 'compression', 'flattened', 'surreal', 'distant backdrop']
  },
  水下仰拍: {
    name: '水下仰拍',
    trigger: 'underwater',
    description: 'Camera below surface looking up, light rays from above, athlete silhouette',
    camera: '相机在水下向上看，光线从上方射入，运动员剪影',
    duration: '2-4s',
    emotion: 'transcendence',
    keywords: ['underwater', 'upward angle', 'light rays', 'silhouette', 'surreal']
  },
  航拍大全景: {
    name: '航拍大全景',
    trigger: 'context',
    description: 'Extreme altitude drone shot, athlete tiny against vast environment, scale establishes terror',
    camera: '超高空无人机拍摄，运动员在巨大环境中如蚂蚁，规模感建立恐惧',
    duration: '3-5s',
    emotion: 'scale_terror',
    keywords: ['aerial', 'wide drone', 'vast environment', 'scale', 'tiny subject']
  }
};

// =====================================================================
// LAYER 2: COMBO TEMPLATES — 组合模板（直接抽取使用）
// =====================================================================

/**
 * 预制组合模板：每个运动6个经典组合
 * 格式：{ phase, shots[], description }
 * phase = 'buildup' | 'action' | 'peak' | 'release'
 */
const COMBO_TEMPLATES = {
  skiing: [
    {
      phase: 'buildup',
      name: '山顶起跳组合',
      shots: [
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV扫描雪道，评估起跳点' },
        { layer: 'EFX', shot: '超低角仰拍', desc: '超低角仰拍，运动员蓄力待发' },
        { layer: 'FVP', shot: 'fear_poV', desc: '悬崖边缘POV，恐惧与兴奋交织' }
      ],
      description: '从等待到恐惧到决策的3镜组合'
    },
    {
      phase: 'action',
      name: '极速下坡组合',
      shots: [
        { layer: 'FVP', shot: 'speed_poV', desc: '第一视角极速俯冲，速度线主导' },
        { layer: 'EFX', shot: '极速_侧跟', desc: '侧跟跟拍，展现完整滑行姿态' },
        { layer: 'FVP', shot: 'wind_poV', desc: '狂风POV，头盔视角风声呼啸' }
      ],
      description: '速度感三连击，观众心跳加速'
    },
    {
      phase: 'peak',
      name: '大跳台落地组合',
      shots: [
        { layer: 'FVP', shot: 'g_force_poV', desc: '腾空G力POV，身体失重感' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作落地，水花四溅' },
        { layer: 'FVP', shot: 'splash_poV', desc: '落地水溅POV，视网膜被水花冲击' }
      ],
      description: '高潮瞬间，观众屏住呼吸'
    },
    {
      phase: 'release',
      name: '粉雪滑行组合',
      shots: [
        { layer: 'EFX', shot: '航拍大全景', desc: '航拍大全景，粉雪喷涌如龙' },
        { layer: 'FVP', shot: 'speed_poV', desc: '低视角POV穿越粉雪云' },
        { layer: 'EFX', shot: '环绕捕捉', desc: '环绕拍摄，滑雪者如入仙境' }
      ],
      description: '释放感，征服后的满足'
    }
  ],
  wingsuit: [
    {
      phase: 'buildup',
      name: '起跳准备组合',
      shots: [
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV站在悬崖边，俯视深渊' },
        { layer: 'EFX', shot: '超低角仰拍', desc: '仰拍运动员张开翼膜，准备跃出' },
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV最后确认姿势，心跳如鼓' }
      ],
      description: '悬崖边的极致张力'
    },
    {
      phase: 'action',
      name: '山脊掠过组合',
      shots: [
        { layer: 'FVP', shot: 'g_force_poV', desc: '第一视角俯冲，G力拉满' },
        { layer: 'EFX', shot: '高速甩镜', desc: '侧跟掠过山脊，险象环生' },
        { layer: 'FVP', shot: 'wind_poV', desc: '狂风POV，气流撕扯翼膜' }
      ],
      description: '贴近山脊飞行的惊险三连'
    },
    {
      phase: 'peak',
      name: '极限通场组合',
      shots: [
        { layer: 'FVP', shot: 'speed_poV', desc: '极速POV，世界变成隧道' },
        { layer: 'EFX', shot: '长焦压缩', desc: '长焦跟拍，运动员压扁在远景中' },
        { layer: 'EFX', shot: '环绕捕捉', desc: '无人机追踪，完整轨迹可见' }
      ],
      description: '最极限的速度与距离感'
    },
    {
      phase: 'release',
      name: '开伞着陆组合',
      shots: [
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV抬头看伞，开伞瞬间的解脱' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作飘落，如羽毛着陆' },
        { layer: 'EFX', shot: '航拍大全景', desc: '航拍全景，降落伞如花朵绽放' }
      ],
      description: '从死亡边缘到平静落地'
    }
  ],
  surfing: [
    {
      phase: 'buildup',
      name: '等浪组合',
      shots: [
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV趴在冲浪板上，等待巨浪形成' },
        { layer: 'EFX', shot: '航拍大全景', desc: '航拍全景，巨浪正在成形' },
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV回头看浪墙，高度令人窒息' }
      ],
      description: '与海浪对峙的张力'
    },
    {
      phase: 'action',
      name: '起乘冲刺组合',
      shots: [
        { layer: 'FVP', shot: 'g_force_poV', desc: 'POV瞬间起乘，G力将你钉在板上' },
        { layer: 'EFX', shot: '极速_侧跟', desc: '侧跟追拍，冲浪者骑在浪肩' },
        { layer: 'FVP', shot: 'wind_poV', desc: '侧面POV，风声和浪声交织' }
      ],
      description: '起乘的瞬间爆发力'
    },
    {
      phase: 'peak',
      name: '管浪穿浪组合',
      shots: [
        { layer: 'FVP', shot: 'splash_poV', desc: 'POV被浪管包裹，世界变蓝白' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作穿出管浪，光柱射入' },
        { layer: 'EFX', shot: '水下仰拍', desc: '水下仰拍，冲浪者从浪底滑过' }
      ],
      description: '管浪内外两个世界'
    },
    {
      phase: 'release',
      name: '腾空动作组合',
      shots: [
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV离地腾空，滞空感强烈' },
        { layer: 'EFX', shot: '慢动作定格', desc: '空中旋转慢动作，完美姿态' },
        { layer: 'FVP', shot: 'splash_poV', desc: 'POV落水，被浪花完全覆盖' }
      ],
      description: '腾空到落水的完整弧线'
    }
  ],
  parkour: [
    {
      phase: 'buildup',
      name: '观察起步组合',
      shots: [
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV扫视障碍，评估路线' },
        { layer: 'EFX', shot: '超低角仰拍', desc: '仰拍运动员蓄力，英雄式起跑' },
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV看准跳点，深度感知距离' }
      ],
      description: '城市丛林的瞬间决策'
    },
    {
      phase: 'action',
      name: '极速穿越组合',
      shots: [
        { layer: 'FVP', shot: 'speed_poV', desc: '第一视角极速穿越障碍' },
        { layer: 'EFX', shot: '高速甩镜', desc: '甩镜穿过建筑间缝隙' },
        { layer: 'FVP', shot: 'wind_poV', desc: 'POV耳边风声呼啸' }
      ],
      description: '速度感与精确控制的结合'
    },
    {
      phase: 'peak',
      name: '大跳着陆组合',
      shots: [
        { layer: 'FVP', shot: 'g_force_poV', desc: 'POV跳跃，G力落地冲击' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作着地，缓冲姿态完美' },
        { layer: 'FVP', shot: 'splash_poV', desc: '着陆扬起尘土，视线短暂遮挡' }
      ],
      description: '最极限的跳跃与着陆'
    },
    {
      phase: 'release',
      name: '平衡定格组合',
      shots: [
        { layer: 'EFX', shot: '超低角仰拍', desc: '仰拍立于高楼边缘，城市在下' },
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV俯视街道，车流如蚁' },
        { layer: 'EFX', shot: '环绕捕捉', desc: '环绕拍摄，展现环境与人物的对比' }
      ],
      description: '征服后的掌控感'
    }
  ],
  climbing: [
    {
      phase: 'buildup',
      name: '起步凝视组合',
      shots: [
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV仰视岩壁，寻找第一个支点' },
        { layer: 'EFX', shot: '航拍大全景', desc: '航拍全景，悬崖峭壁如刀削' },
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV手指触碰第一个支点，试探' }
      ],
      description: '独攀者与岩壁的对话'
    },
    {
      phase: 'action',
      name: '指力攀爬组合',
      shots: [
        { layer: 'FVP', shot: 'g_force_poV', desc: 'POV手指抓握单薄支点，肌肉颤抖可见' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作换手，高空中的呼吸' },
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV俯视下方，恐惧与专注并存' }
      ],
      description: '指力与意志的极限'
    },
    {
      phase: 'peak',
      name: '动态跳跃组合',
      shots: [
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV扑向远处支点，滞空恐惧' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作捕捉dyno飞跃瞬间' },
        { layer: 'FVP', shot: 'g_force_poV', desc: 'POV抓住支点，G力冲击手臂' }
      ],
      description: 'dyno动态跳跃的生死瞬间'
    },
    {
      phase: 'release',
      name: '登顶定格组合',
      shots: [
        { layer: 'EFX', shot: '超低角仰拍', desc: '仰拍登顶者，世界在脚下' },
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV环顾360度，孤独的巅峰' },
        { layer: 'EFX', shot: '航拍大全景', desc: '航拍大全景，悬崖之下是深渊' }
      ],
      description: '征服后的孤独与壮阔'
    }
  ],
  mountain_bike: [
    {
      phase: 'buildup',
      name: '悬崖边起步组合',
      shots: [
        { layer: 'FVP', shot: 'wait_poV', desc: 'POV看着陡峭下坡，评估路线' },
        { layer: 'EFX', shot: '超低角仰拍', desc: '仰拍车身，运动员蓄势待发' },
        { layer: 'FVP', shot: 'fear_poV', desc: 'POV俯视前轮悬空，悬崖感强烈' }
      ],
      description: '悬崖边起步的恐惧'
    },
    {
      phase: 'action',
      name: '极速下坡组合',
      shots: [
        { layer: 'FVP', shot: 'speed_poV', desc: 'POV极速下坡，地面扑面而来' },
        { layer: 'EFX', shot: '极速_侧跟', desc: '侧跟追拍，泥土飞溅' },
        { layer: 'FVP', shot: 'wind_poV', desc: 'POV耳边风声，身体压低' }
      ],
      description: '速度与重力的挑战'
    },
    {
      phase: 'peak',
      name: '飞跃滞空组合',
      shots: [
        { layer: 'FVP', shot: 'g_force_poV', desc: 'POV离开地面，滞空失重' },
        { layer: 'EFX', shot: '慢动作定格', desc: '慢动作空中姿态，爱谁姿势' },
        { layer: 'FVP', shot: 'splash_poV', desc: 'POV落地，泥土和碎石扑面' }
      ],
      description: '飞跃腾空的极致瞬间'
    },
    {
      phase: 'release',
      name: '压弯甩尾组合',
      shots: [
        { layer: 'FVP', shot: 'speed_poV', desc: 'POV压弯，身体几乎贴地' },
        { layer: 'EFX', shot: '高速甩镜', desc: '甩镜跟拍，甩尾扬起的尘土' },
        { layer: 'EFX', shot: '长焦压缩', desc: '长焦压缩，背景快速掠过' }
      ],
      description: '压弯的力学美感'
    }
  ]
};

// =====================================================================
// LAYER 3: INJECTION FUNCTIONS — 注入函数（集成到shot prompt）
// =====================================================================

/**
 * 为指定运动类型和镜头生成肾上腺镜头注入文本
 * @param {string} sportType - 运动类型键名
 * @param {string} phase - 阶段 'buildup' | 'action' | 'peak' | 'release'
 * @param {string} perspective - 'FVP' | 'EFX' | 'BOTH' (默认BOTH)
 * @returns {string} 英文镜头注入描述
 */
function generateAdrenalineShot(sportType, phase, perspective = 'BOTH') {
  const templates = COMBO_TEMPLATES[sportType];
  if (!templates) {
    return `// Unknown sport type: ${sportType}`;
  }
  
  const combo = templates.find(t => t.phase === phase);
  if (!combo) {
    return `// Unknown phase: ${phase} for sport: ${sportType}`;
  }

  const filtered = perspective === 'BOTH' 
    ? combo.shots 
    : combo.shots.filter(s => s.layer === perspective);

  const lines = filtered.map(shot => {
    const layer = shot.layer === 'FVP' ? FVP_SHOTS[shot.shot] : EFX_SHOTS[shot.shot];
    if (!layer) return `// Shot not found: ${shot.shot}`;
    return `[${shot.layer}:${shot.shot}] ${layer.description}`;
  });

  return lines.join('\n');
}

/**
 * 获取单镜原子镜头描述（用于精准注入）
 * @param {string} layer - 'FVP' 或 'EFX'
 * @param {string} shotKey - 镜头键名
 * @returns {object} { description, keywords, emotion, duration }
 */
function getAtomicShot(layer, shotKey) {
  const shots = layer === 'FVP' ? FVP_SHOTS : EFX_SHOTS;
  return shots[shotKey] || null;
}

/**
 * 获取某运动某阶段的标准POV注入文本（英文，用于prompt）
 * @param {string} sportType 
 * @param {string} phase 
 * @returns {string} 英文POV描述
 */
function getFVPInject(sportType, phase) {
  return generateAdrenalineShot(sportType, phase, 'FVP');
}

/**
 * 获取某运动某阶段的标准外部视角注入文本（英文）
 * @param {string} sportType 
 * @param {string} phase 
 * @returns {string} 英文EFX描述
 */
function getEFXInject(sportType, phase) {
  return generateAdrenalineShot(sportType, phase, 'EFX');
}

/**
 * 获取全部可用运动类型
 * @returns {string[]} 运动类型键名数组
 */
function getAvailableSports() {
  return Object.keys(SPORTS);
}

/**
 * 获取某运动的全部组合模板
 * @param {string} sportType 
 * @returns {object[]} 组合模板数组
 */
function getCombos(sportType) {
  return COMBO_TEMPLATES[sportType] || [];
}

/**
 * 随机抽取一整套肾上腺镜头组合（4阶段各选一个）
 * @param {string} sportType 
 * @returns {object} { buildup, action, peak, release }
 */
function getRandomFullSequence(sportType) {
  const templates = COMBO_TEMPLATES[sportType];
  if (!templates) return null;
  
  const result = {};
  for (const phase of ['buildup', 'action', 'peak', 'release']) {
    const combo = templates.find(t => t.phase === phase);
    if (combo) result[phase] = combo;
  }
  return result;
}

module.exports = {
  SPORTS,
  FVP_SHOTS,
  EFX_SHOTS,
  COMBO_TEMPLATES,
  generateAdrenalineShot,
  getAtomicShot,
  getFVPInject,
  getEFXInject,
  getAvailableSports,
  getCombos,
  getRandomFullSequence
};

// =====================================================================
// 摩托越野 (Motorcross) + 扁带 (Slackline) — v1.1-Peng
// =====================================================================

const EXTREME_SPORTS = {
  motorcross: {
    name: '摩托越野',
    nameEn: 'Motocross / Extreme Off-road',
    atmosphere: '泥土飞溅、引擎咆哮、极限通过、泥泞赛道',
    emotions: ['raw_power', 'chaos', 'commitment', 'dirt_spray'],
    signatureMoves: ['whoop_declaration', 'tabletop_jump', 'rhythm_section', 'final_corner'],
    hazards: ['whoops', 'tabletop', 'steep_turn', 'landing_zone', 'mud_puddle']
  },
  slackline: {
    name: '扁带',
    nameEn: 'Slackline / Highline',
    atmosphere: '高空独行、极度专注、平衡即一切、风中摇摆',
    emotions: ['equilibrium', 'vertigo', 'solitude', 'flow'],
    signatureMoves: ['heel_ball', 'blind_side', 'wind_sway', 'sit_spot', 'zen_pose'],
    hazards: ['wind_gust', 'height', 'narrow_webbing', 'fall_zone', 'loss_balance']
  }
};

// 摩托越野专用原子镜头（扩展FVP+EFX）
const MOTOCROSS_SHOTS = {
  // FVP
  engine_poV: {
    name: '引擎咆哮POV',
    trigger: 'raw_power',
    description: 'POV from handlebars, engine vibration through frame, RPM scream, dirt particles on visor',
    camera: '把手视角，引擎震动传递到画面，转速尖叫，泥点溅上面罩',
    duration: '1.5-3s',
    emotion: 'raw_power',
    keywords: ['POV', 'handlebar', 'engine vibration', 'RPM', 'dirt', 'first person']
  },
  through_the_spray_poV: {
    name: '穿越泥浆POV',
    trigger: 'dirt_spray',
    description: 'POV obscured by mud spray, rider ahead barely visible, world turns to brown noise',
    camera: 'POV视角被泥浆遮挡，前方骑手若隐若现，世界变成一片泥色',
    duration: '1-2s',
    emotion: 'chaos',
    keywords: ['POV', 'mud spray', 'obscured', 'chaos', 'first person']
  },
  // EFX
  低视角泥泞跟拍: {
    name: '低视角泥泞跟拍',
    trigger: 'dirt_rider',
    description: 'Camera at knee height beside track, mud sprays laterally, bike dominates frame',
    camera: '相机贴近赛道侧面膝盖高度，泥巴横向飞溅，摩托占据画面主体',
    duration: '2-3s',
    emotion: 'power',
    keywords: ['low angle', 'mud spray', 'lateral', 'track side', 'follow cam']
  },
  腾空定格: {
    name: '腾空定格',
    trigger: 'airborne',
    description: 'Bike and rider airborne silhouetted against sky, full suspension extension, moment of flight',
    camera: '摩托与骑手腾空剪影以天空为背景，悬挂完全伸展，飞行瞬间',
    duration: '2-4s',
    emotion: 'flight',
    keywords: ['airborne', 'silhouette', 'sky backdrop', 'suspension', 'dramatic']
  }
};

// 扁带专用原子镜头
const SLACKLINE_SHOTS = {
  // FVP
  narrow_poV: {
    name: '窄带POV',
    trigger: 'equilibrium',
    description: 'POV feet on 2.5cm webbing, world extremely narrow, arms out for balance, wind pushes',
    camera: 'POV看脚踩在2.5厘米织带上，世界极度收窄，双臂展开保持平衡，风在推',
    duration: '2-4s',
    emotion: 'equilibrium',
    keywords: ['POV', 'webbing', 'balance', 'arms out', 'wind', 'first person']
  },
  abyss_poV: {
    name: '深渊POV',
    trigger: 'vertigo',
    description: 'POV looking down between feet to ground far below, vertigo spins, feet look tiny',
    camera: 'POV俯视双脚之间，看向下方遥远的地面，眩晕感袭来，脚看起来很小',
    duration: '1.5-3s',
    emotion: 'vertigo',
    keywords: ['POV', 'vertigo', 'depth', 'below', 'fear', 'first person']
  },
  // EFX
  高空独行仰拍: {
    name: '高空独行仰拍',
    trigger: 'solitude',
    description: 'Camera below looking up at line walker, figure against open sky, isolation and courage',
    camera: '相机在下方仰视，扁带行者以开阔天空为背景，孤独与勇气',
    duration: '3-5s',
    emotion: 'solitude',
    keywords: ['upward angle', 'against sky', 'solitude', 'silhouette', 'heroic']
  },
  风中之线平拍: {
    name: '风中之线平拍',
    trigger: 'wind_sway',
    description: 'Side profile shot, line walker sways with wind, cable vibrates, total focus visible',
    camera: '侧面跟拍，扁带行者随风轻晃，织带震颤，专注神情清晰可见',
    duration: '3-5s',
    emotion: 'flow',
    keywords: ['side profile', 'sway', 'cable vibration', 'focus', 'wind']
  },
  极限失衡定格: {
    name: '极限失衡定格',
    trigger: 'near_fall',
    description: 'Wide shot showing near-fall recovery, arms windmill, line bounces, tension to release',
    camera: '广角显示近乎跌落的恢复，双臂疯狂挥摆，织带弹跳，张力到释放',
    duration: '2-3s',
    emotion: 'tension_release',
    keywords: ['near fall', 'recovery', 'arms windmill', 'bounce', 'dramatic']
  }
};

// 为 EXTREME_SPORTS 扩展 COMBO_TEMPLATES
COMBO_TEMPLATES.motorcross = [
  {
    phase: 'buildup',
    name: '发车准备组合',
    shots: [
      { layer: 'FVP', shot: 'engine_poV', desc: 'POV坐在摩托上，引擎预热震动，等待发车' },
      { layer: 'EFX', shot: '超低角仰拍', desc: '超低角仰拍发车台，摩托引擎轰鸣待发' },
      { layer: 'FVP', shot: 'engine_poV', desc: 'POV手握油门，等待信号' }
    ],
    description: '引擎预热与等待发车的三镜组合'
  },
  {
    phase: 'action',
    name: '赛道穿越组合',
    shots: [
      { layer: 'FVP', shot: 'speed_poV', desc: '第一视角泥泞赛道穿越，地面扑面' },
      { layer: 'EFX', shot: '极速_侧跟', desc: '侧跟追拍，泥巴飞溅' },
      { layer: 'FVP', shot: 'through_the_spray_poV', desc: '穿越泥浆POV，世界变成一片泥色' }
    ],
    description: '泥泞赛道速度感三连'
  },
  {
    phase: 'peak',
    name: '大跳台组合',
    shots: [
      { layer: 'FVP', shot: 'g_force_poV', desc: 'POV离开跳台，滞空失重感' },
      { layer: 'EFX', shot: '腾空定格', desc: '腾空定格，摩托与骑手剪影' },
      { layer: 'FVP', shot: 'splash_poV', desc: 'POV落地，泥巴扑面完全遮挡视线' }
    ],
    description: '大跳台腾空落地的极限瞬间'
  },
  {
    phase: 'release',
    name: '冲线组合',
    shots: [
      { layer: 'FVP', shot: 'speed_poV', desc: 'POV最后冲刺，引擎最大转速' },
      { layer: 'EFX', shot: '高速甩镜', desc: '甩镜冲过终点线，庆祝动作' },
      { layer: 'EFX', shot: '环绕捕捉', desc: '环绕拍摄终点泥泞庆祝场面' }
    ],
    description: '征服赛道的释放感'
  }
];

COMBO_TEMPLATES.slackline = [
  {
    phase: 'buildup',
    name: '高空准备组合',
    shots: [
      { layer: 'FVP', shot: 'narrow_poV', desc: 'POV站在扁带上，双臂展开寻找平衡' },
      { layer: 'EFX', shot: '航拍大全景', desc: '航拍大全景，扁带悬于两峰之间如细线' },
      { layer: 'FVP', shot: 'abyss_poV', desc: 'POV向下看，眩晕感，地面遥远' }
    ],
    description: '高空准备与恐惧的三镜组合'
  },
  {
    phase: 'action',
    name: '平稳行走组合',
    shots: [
      { layer: 'FVP', shot: 'narrow_poV', desc: 'POV踩扁带行走，每一步精确控制' },
      { layer: 'EFX', shot: '风中之线平拍', desc: '侧面平拍，扁带行者随风调整姿态' },
      { layer: 'FVP', shot: 'wait_poV', desc: 'POV停在中央，风吹来，专注呼吸' }
    ],
    description: '专注与平衡的行进三连'
  },
  {
    phase: 'peak',
    name: '极限挑战组合',
    shots: [
      { layer: 'FVP', shot: 'abyss_poV', desc: 'POV做盲端动作，向后看，完全失去视觉参考' },
      { layer: 'EFX', shot: '极限失衡定格', desc: '慢动作极限失衡，双臂疯狂挥摆恢复' },
      { layer: 'FVP', shot: 'fear_poV', desc: 'POV恢复平衡，大口喘气，刚才差点坠落' }
    ],
    description: '极限动作与坠落的生死瞬间'
  },
  {
    phase: 'release',
    name: '禅定时刻组合',
    shots: [
      { layer: 'FVP', shot: 'narrow_poV', desc: 'POV站在扁带中央完全静止，风停了，进入心流' },
      { layer: 'EFX', shot: '高空独行仰拍', desc: '仰拍行者以天空为背景，如入禅定' },
      { layer: 'EFX', shot: '航拍大全景', desc: '航拍全景，扁带在云海之上，孤独而壮阔' }
    ],
    description: '征服后的心流与宁静'
  }
];

// 更新导出
SPORTS.motorcross = EXTREME_SPORTS.motorcross;
SPORTS.slackline = EXTREME_SPORTS.slackline;
