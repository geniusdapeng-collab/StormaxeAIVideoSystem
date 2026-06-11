#!/usr/bin/env node
/**
 * Nirath Cinematography System v3.3-Peng (Production)
 * Nirath原生星球运镜系统 — 双恒星光照下的电影语言 + 场景语法自动路由
 *
 * v3.3-Peng 更新：
 * + 🆕 山海经情绪-运镜映射：中英文双key兼容（中文/英文emotion都能命中）
 * + 🆕 英文情绪映射：mysterious/ominous/awe/majestic/divine 等16种
 * + 🆕 修复：英文emotion标签导致运镜映射失效的问题
 *
 * v3.2-Peng 更新：
 * + 🆕 自动场景识别：根据镜头描述自动检测Nirath生态区
 * + 🆕 镜头角色分类：识别镜头在场景中的叙事角色
 * + 🆕 场景专属运镜语法：10个生态区 × 6类运镜角色
 *
 * 核心特征:
 * - 双恒星永恒黄昏光照体系（一橙一紫）
 * - 生物发光生态运镜（深海青/天光金/地热红/超导电/黑曜石/灵原绿）
 * - Avatar级体积光与大气透视
 * - 十大场景专属运镜库（归墟之海/不周山脉/青丘灵原/幽冥地下海/汤谷扶桑/昆仑悬境/涿鹿战场/蓬莱迷雾/星门祭坛/盘古之脊）
 *
 * 架构: 情感频段→视觉参数→Nirath场景色彩→运镜指令
 */

// ============ 8大志怪分镜技法 ============

// ========== 世界模拟引擎融入：情感频段→视觉参数映射 ==========
const EMOTIONAL_FREQUENCY_MAP = {
  growth: {
    frequency: '生长',
    element: '木',
    region: 'Azure Hills Spirit Plain',
    colorTemperature: 'warm',      // 暖色调
    colorPalette: ['#008B8B', '#00FA9A', '#32CD32'],
    composition: 'expansion',      // 扩张构图 — 向上、向外、延伸
    cameraMovement: 'ascending',     // 运镜：上升、推进
    depthOfField: 'shallow-to-deep', // 景深：由浅入深
    texture: 'organic-soft',         // 质感：有机、柔软
    lightQuality: 'volumetric-glow', // 光质：体积光、发光
    tempo: 'flowing',              // 节奏：流动
    emotionalArc: 'curiosity → wonder'
  },
  decay: {
    frequency: '衰变',
    element: '金',
    region: 'Broken Axis Peaks',
    colorTemperature: 'cool',      // 冷色调
    colorPalette: ['#1C1C1C', '#2F4F4F', '#FFD700'],
    composition: 'contraction',      // 收缩构图 — 向内、下沉、压缩
    cameraMovement: 'slow-descent',  // 运镜：缓慢下沉
    depthOfField: 'deep-focus',      // 景深：深焦
    texture: 'metallic-rough',       // 质感：金属、粗糙
    lightQuality: 'hard-contrast',   // 光质：硬光、强对比
    tempo: 'slowing',              // 节奏：缓慢
    emotionalArc: 'fear → reverence'
  },
  memory: {
    frequency: '记忆',
    element: '水',
    region: 'Subterranean Styx',
    colorTemperature: 'cold-blue',   // 冷蓝调
    colorPalette: ['#008B8B', '#20B2AA', '#00CED1'],
    composition: 'vast-empty',       // 辽阔空旷构图
    cameraMovement: 'static-wide',   // 运镜：固定广角
    depthOfField: 'infinite',          // 景深：无限远
    texture: 'crystalline-smooth',   // 质感：晶体、光滑
    lightQuality: 'diffused-aurora',  // 光质：漫射、极光
    tempo: 'frozen',               // 节奏：冻结
    emotionalArc: 'isolation → awe'
  },
  awakening: {
    frequency: '觉醒',
    element: '火',
    region: 'Abyssal Luminara',
    colorTemperature: 'warm-vivid',  // 暖色鲜艳
    colorPalette: ['#00BFFF', '#FF4500', '#00FA9A'],
    composition: 'vast-dynamic',     // 辽阔动态构图
    cameraMovement: 'surging-flow',  // 运镜：涌动、流动
    depthOfField: 'variable',        // 景深：变化
    texture: 'fluid-chaotic',        // 质感：流体、混沌
    lightQuality: 'storm-prismatic', // 光质：风暴、棱镜
    tempo: 'erratic',              // 节奏：无常
    emotionalArc: 'wonder → insignificance'
  },
  grounding: {
    frequency: '沉淀',
    element: '土',
    region: 'Solar Cradle of Fusang',
    colorTemperature: 'golden-warm',   // 金色暖调
    colorPalette: ['#FFD700', '#FF69B4', '#FF4500'],
    composition: 'monumental-central', // monumental构图
    cameraMovement: 'timeless-static', // 运镜：永恒静止
    depthOfField: 'mystical-shallow',  // 景深：神秘浅焦
    texture: 'sacred-ancient',        // 质感：神圣、古老
    lightQuality: 'divine-volumetric', // 光质：神圣体积光
    tempo: 'timeless',             // 节奏：无时间
    emotionalArc: 'understanding → transcendence'
  },
  chaos: {
    frequency: '混沌',
    element: '无',
    region: 'Archipelago of Penglai',
    colorTemperature: 'shifting',    // 变化
    colorPalette: ['#4169E1', '#00BFFF', '#FFD700'],
    composition: 'impossible-geometry', // 不可能几何
    cameraMovement: 'disorienting-spin', // 运镜：眩晕旋转
    depthOfField: 'unstable',        // 景深：不稳定
    texture: 'ethereal-fragmented',   // 质感：空灵、碎片
    lightQuality: 'prismatic-uncanny', // 光质：棱镜、诡异
    tempo: 'erratic',              // 节奏：错乱
    emotionalArc: 'confusion → awe'
  },
  void: {
    frequency: '虚空',
    element: '无',
    region: 'Plain of Zhulu',
    colorTemperature: 'absent',      // 无色调
    colorPalette: ['#1C1C1C', '#2F4F4F', '#000000'],
    composition: 'infinite-void',      // 无限虚空
    cameraMovement: 'static-eternal',  // 运镜：永恒静止
    depthOfField: 'infinite-flat',   // 景深：无限平焦
    texture: 'blank-null',           // 质感：空白、虚无
    lightQuality: 'absent-ambient',   // 光质：缺失、环境
    tempo: 'eternal',              // 节奏：永恒
    emotionalArc: 'loss → gratitude'
  },
  depth: {
    frequency: '深度',
    element: '五大元素交汇',
    region: 'Kunlun Sky-Continent',
    colorTemperature: 'warm-deep',     // 暖色深沉
    colorPalette: ['#FFD700', '#1C1C1C', '#FF4500'],
    composition: 'inverted-depth',    // 倒置深度
    cameraMovement: 'submerged-float', // 运镜：沉没漂浮
    depthOfField: 'layered-crystal',   // 景深：层叠晶体
    texture: 'crystalline-ancient',    // 质感：晶体、古老
    lightQuality: 'bioluminescent',    // 光质：生物发光
    tempo: 'submerged',            // 节奏：沉没
    emotionalArc: 'discovery → memory'
  }
};

const SHANHAI_CINEMATOGRAPHY_TECHNIQUES = {
  impact_frame: {
    name: '冲击帧',
    description: '1-3帧高对比剪影+放射线条',
    useCase: '异兽登场瞬间',
    duration: '1-3帧',
    parameters: { contrast: 2.0, silhouette: true, radialLines: true }
  },
  black_flash: {
    name: '黑闪',
    description: '2-5帧纯黑硬切',
    useCase: '时空压缩、场景跳转',
    duration: '2-5帧',
    parameters: { frames: 3, color: '#000000', transition: 'hard_cut' }
  },
  white_flash: {
    name: '白闪',
    description: '3-8帧纯白过曝+粒子爆发',
    useCase: '神圣降临、力量觉醒',
    duration: '3-8帧',
    parameters: { frames: 5, exposure: 3.0, particleBurst: true }
  },
  screen_split: {
    name: '画面分割',
    description: '水墨/远古发光祭器边框2-4区域对照',
    useCase: '时空对比、内心与现实',
    duration: '3-5秒',
    parameters: { regions: 2, borderStyle: 'ink', ratio: [0.5, 0.5] }
  },
  transformation_sequence: {
    name: '变身序列',
    description: '触发→解构→重组→定型→收尾五阶段',
    useCase: '异兽变身、形态转换',
    duration: '3-8秒',
    parameters: { stages: 5, trigger: 'emotion_peak', deconstruction: true }
  },
  ink_dissolve: {
    name: '水墨溶解',
    description: '宣纸晕染扩散1-2秒',
    useCase: '场景过渡、回忆闪回',
    duration: '1-2秒',
    parameters: { inkSpread: 0.8, paperTexture: true, direction: 'center_out' }
  },
  slow_motion_detail: {
    name: '慢动作特写',
    description: '1/4-1/8速度聚焦鳞片/符文',
    useCase: '关键细节、情感峰值',
    duration: '2-4秒',
    parameters: { speed: 0.25, focus: 'detail', depthOfField: 'shallow' }
  },
  continuous_long_take: {
    name: '一镜到底',
    description: '15-60秒不间断穿越山海',
    useCase: '史诗场景、世界观展示',
    duration: '15-60秒',
    parameters: { duration: 30, movement: 'fly_through', complexity: 'high' }
  }
};

// ============ Nirath专属运镜技术库 v3.0-Peng ============
const NIRATH_CINEMATOGRAPHY_TECHNIQUES = {
  twin_sun_tracking: {
    name: '双恒星追踪',
    description: '镜头运动始终参照双恒星相对位置，一橙一紫在画面边缘形成天然逆光轮廓',
    useCase: '所有室外场景必须保持双星一致性，人物/异兽出场时的神圣逆光',
    duration: '5-15秒',
    parameters: { 
      sunPositions: ['upper_left_orange', 'lower_right_purple'], 
      backlightIntensity: 0.7,
      rimLightColor: '#FF8C00_#8B008B',
      mustMaintain: true  // 强约束：不可让双星同时消失
    }
  },
  bioluminescent_drift: {
    name: '生物发光漫游',
    description: '镜头在生物发光生态中缓慢漂移，深海青绿与超导蓝构成环境主光源',
    useCase: 'Abyssal Luminara深海、幽冥地下海、外星森林场景',
    duration: '8-20秒',
    parameters: { 
      primaryGlow: '#008B8B', 
      secondaryGlow: '#00BFFF',
      driftSpeed: '0.3x',
      particleDensity: 'high'
    }
  },
  crystal_orbit: {
    name: '浮空晶簇环绕',
    description: '360度或螺旋环绕浮空晶簇山脉，晶体折射产生彩虹光斑轨迹',
    useCase: 'Broken Axis浮空山脉、Penglai迷雾群岛的奇观展示',
    duration: '10-30秒',
    parameters: { 
      orbitType: 'spiral_ascending', 
      caustics: true,
      refractionColor: '#FFD700_#FF69B4_#00BFFF',
      crystalScale: 'massive'
    }
  },
  light_vein_tunnel: {
    name: '光脉晶窟穿梭',
    description: '镜头沿地下光脉隧道快速推进，两侧岩壁生物发光形成引导线',
    useCase: 'Subterranean Styx地下海、光脉晶窟内部场景',
    duration: '5-12秒',
    parameters: { 
      tunnelLight: '#008B8B', 
      speed: '1.5x',
      wallTexture: 'bioluminescent_organ',
      depthPerception: 'forced_perspective'
    }
  },
  crystal_caustic_detail: {
    name: '晶簇折射光斑特写',
    description: '微距镜头聚焦黑曜石/超导晶体表面，光斑在材质上缓慢流动',
    useCase: '材质质感展示、情绪沉淀镜头、过渡衔接',
    duration: '3-8秒',
    parameters: { 
      lens: 'macro_100mm', 
      causticPattern: 'organic_flow',
      surfaceType: 'obsidian_glass_or_superconductor',
      lightSource: 'dual_sun_refraction'
    }
  },
  atmospheric_push_pull: {
    name: '大气透视纵深推拉',
    description: '利用Nirath大气透视（远景蓝紫偏移）做纵深推拉，人物从远景蓝紫雾气中走向镜头',
    useCase: '强调Nirath星球巨大尺度、人物渺小感、史诗级出场',
    duration: '8-15秒',
    parameters: { 
      atmosphericColor: '#4169E1_#8A2BE2', 
      pushPullRange: '100m_to_2m',
      depthCue: 'mandatory',
      humanScaleReference: true  // 必须包含人类尺度参照物
    }
  },
  obsidian_reflection_reveal: {
    name: '黑曜石反射揭示',
    description: '镜头从黑曜石地面/岩壁的反射中缓慢揭示场景全貌，反射中双星位置与现实一致',
    useCase: '场景揭幕、世界树Solar Cradle、星门祭坛Astrop Nexus',
    duration: '6-12秒',
    parameters: { 
      reflectionSurface: 'obsidian_glass', 
      revealType: 'slow_tilt_up',
      dualSunReflection: true,  // 反射中必须保持双星一致
      rimLightOnSubject: true
    }
  },
  geothermal_bloom: {
    name: '地热绽放',
    description: '镜头从地热裂隙的橙红光芒中升起，揭示整个地热活跃区域',
    useCase: '地热红场景、Plain Zhulu战场遗迹、火山活动区域',
    duration: '5-10秒',
    parameters: { 
      primaryColor: '#FF4500', 
      bloomIntensity: 1.5,
      heatDistortion: true,
      risingAshParticles: true
    }
  }
};

// ============ Nirath场景-运镜映射表 ============
const NIRATH_SCENE_CAMERA_MAP = {
  'Abyssal Luminara':      { primary: 'bioluminescent_drift', secondary: 'crystal_caustic_detail' },
  'Broken Axis':           { primary: 'crystal_orbit', secondary: 'twin_sun_tracking' },
  'Azure Hills':           { primary: 'atmospheric_push_pull', secondary: 'twin_sun_tracking' },
  'Subterranean Styx':     { primary: 'light_vein_tunnel', secondary: 'bioluminescent_drift' },
  'Solar Cradle':          { primary: 'obsidian_reflection_reveal', secondary: 'twin_sun_tracking' },
  'Kunlun Sky':            { primary: 'atmospheric_push_pull', secondary: 'crystal_orbit' },
  'Plain Zhulu':           { primary: 'geothermal_bloom', secondary: 'twin_sun_tracking' },
  'Archipelago Penglai':   { primary: 'crystal_orbit', secondary: 'bioluminescent_drift' },
  'Astrop Nexus':          { primary: 'obsidian_reflection_reveal', secondary: 'light_vein_tunnel' },
  'Spine Pangu':           { primary: 'crystal_orbit', secondary: 'geothermal_bloom' }
};

// 合并运镜库：山海经+Nirath共存，根据世界观选择
function getCinematographyTechniques(worldview = 'nirath') {
  if (worldview === 'nirath' || worldview === 'superreal') {
    return { ...SHANHAI_CINEMATOGRAPHY_TECHNIQUES, ...NIRATH_CINEMATOGRAPHY_TECHNIQUES };
  }
  return SHANHAI_CINEMATOGRAPHY_TECHNIQUES;
}

function getSceneCameraMap(worldview = 'nirath') {
  if (worldview === 'nirath') {
    return NIRATH_SCENE_CAMERA_MAP;
  }
  // 山海经模式返回默认映射
  return {};
}

// ============ 12种志怪情绪-运镜映射 ============
const SHANHAI_EMOTION_CAMERA_MAP = {
  // 中文key（原生）
  敬畏: { lens: '广角', movement: '缓慢上升', angle: '仰拍', lighting: '天光+体积光', focalLength: '14mm' },
  神秘: { lens: '长焦', movement: '缓慢推进', angle: '微俯', lighting: '逆光+雾气', focalLength: '85mm' },
  妖异: { lens: '标准', movement: '轻微环绕', angle: '平视略低', lighting: '异色光紫青+轮廓光', focalLength: '50mm' },
  威严: { lens: '广角', movement: '稳定跟拍', angle: '低角度', lighting: '轮廓光+顶光', focalLength: '24mm' },
  幻梦: { lens: '柔焦', movement: '漂浮横移', angle: '不稳定', lighting: '柔光+光斑', focalLength: '50mm+soft' },
  恐惧: { lens: '广角', movement: '急促后退', angle: '主观视角', lighting: '硬光+强对比', focalLength: '16mm' },
  悲壮: { lens: '长焦', movement: '缓慢拉远', angle: '远景', lighting: '落日逆光', focalLength: '135mm' },
  祥和: { lens: '标准', movement: '固定观察', angle: '鸟瞰', lighting: '柔光散射+暖调', focalLength: '35mm' },
  激昂: { lens: '广角', movement: '急速推进', angle: '低角度', lighting: '强轮廓光', focalLength: '20mm' },
  孤独: { lens: '长焦', movement: '缓慢横移', angle: '远景', lighting: '冷调+暗角', focalLength: '200mm' },
  禅意: { lens: '标准', movement: '固定凝视', angle: '微俯', lighting: '天光漫射', focalLength: '50mm' },
  悠远: { lens: '长焦', movement: '缓慢上升', angle: '俯瞰', lighting: '柔光+远山雾', focalLength: '100mm' },
  温暖: { lens: '标准', movement: '固定', angle: '微俯', lighting: '暖色调+柔光', focalLength: '35mm' },
  好奇: { lens: '标准', movement: '缓慢推进', angle: '平视', lighting: '自然光+侧光', focalLength: '35mm' },
  心碎: { lens: '长焦', movement: '缓慢拉远', angle: '特写', lighting: '冷调+暗角', focalLength: '135mm' },
  成长: { lens: '广角', movement: '上升', angle: '低角度', lighting: '逆光+暖调', focalLength: '24mm' },
  // 英文key兼容（v5.1-Peng-fix）
  awe: { lens: '广角', movement: '缓慢上升', angle: '仰拍', lighting: '天光+体积光', focalLength: '14mm' },
  mysterious: { lens: '长焦', movement: '缓慢推进', angle: '微俯', lighting: '逆光+雾气', focalLength: '85mm' },
  ominous: { lens: '标准', movement: '轻微环绕', angle: '平视略低', lighting: '异色光紫青+轮廓光', focalLength: '50mm' },
  majestic: { lens: '广角', movement: '稳定跟拍', angle: '低角度', lighting: '轮廓光+顶光', focalLength: '24mm' },
  dreamlike: { lens: '柔焦', movement: '漂浮横移', angle: '不稳定', lighting: '柔光+光斑', focalLength: '50mm+soft' },
  fear: { lens: '广角', movement: '急促后退', angle: '主观视角', lighting: '硬光+强对比', focalLength: '16mm' },
  tragic: { lens: '长焦', movement: '缓慢拉远', angle: '远景', lighting: '落日逆光', focalLength: '135mm' },
  peaceful: { lens: '标准', movement: '固定观察', angle: '鸟瞰', lighting: '柔光散射+暖调', focalLength: '35mm' },
  passionate: { lens: '广角', movement: '急速推进', angle: '低角度', lighting: '强轮廓光', focalLength: '20mm' },
  lonely: { lens: '长焦', movement: '缓慢横移', angle: '远景', lighting: '冷调+暗角', focalLength: '200mm' },
  zen: { lens: '标准', movement: '固定凝视', angle: '微俯', lighting: '天光漫射', focalLength: '50mm' },
  distant: { lens: '长焦', movement: '缓慢上升', angle: '俯瞰', lighting: '柔光+远山雾', focalLength: '100mm' },
  warm: { lens: '标准', movement: '固定', angle: '微俯', lighting: '暖色调+柔光', focalLength: '35mm' },
  curious: { lens: '标准', movement: '缓慢推进', angle: '平视', lighting: '自然光+侧光', focalLength: '35mm' },
  heartbreak: { lens: '长焦', movement: '缓慢拉远', angle: '特写', lighting: '冷调+暗角', focalLength: '135mm' },
  growth_en: { lens: '广角', movement: '上升', angle: '低角度', lighting: '逆光+暖调', focalLength: '24mm' }
};

// ============ 物种专属运镜库 ============
const SHANHAI_CAMERA_MOVEMENTS = {
  dragon: {
    attack: { movement: '俯冲跟随+急速拉升', speed: 'fast', angle: '动态追踪' },
    fly: { movement: '鸟瞰+云海穿梭', speed: 'medium', angle: '俯瞰' },
    land: { movement: '镜头后撤+地面震动', speed: 'slow', angle: '低角度' },
    breathe: { movement: '固定+龙息粒子飘动', speed: 'static', angle: '正面' }
  },
  fox: {
    sneak: { movement: '树影遮蔽+尾巴若隐若现', speed: 'slow', angle: '平视' },
    transform: { movement: '快速变焦+粒子消散', speed: 'fast', angle: '特写' },
    charm: { movement: '景深变化+眼神特写', speed: 'slow', angle: '近景' },
    run: { movement: '跟拍+草丛穿梭', speed: 'fast', angle: '侧面' }
  },
  // ===== 故事内核融入：新增异兽物种运镜 =====
  dijiang: {
    emerge: { movement: '黄囊状身体从暗处缓缓膨胀出现', speed: 'slow', angle: '低角度仰拍' },
    protect: { movement: '无面身体包裹男孩，镜头从外部缓慢推进至表面', speed: 'slow', angle: '环绕微距' },
    glow: { movement: '赤金色表面发光，低频振动涟漪', speed: 'static', angle: '特写' },
    song: { movement: '空气波动可视化，温暖光晕扩散', speed: 'slow', angle: '广角' },
    rest: { movement: '固定观察混沌能量脉动', speed: 'static', angle: '正面' }
  },
  xuangui: {
    swim: { movement: '水中蛇尾波动，鸟首高昂，背纹发光如地图', speed: 'medium', angle: '侧面跟拍' },
    carry: { movement: '男孩爬上龟背，镜头从低角度升至俯瞰', speed: 'slow', angle: '上升' },
    map_glow: { movement: '背纹在水中发光，投射出地理信息', speed: 'slow', angle: '顶拍' }
  },
  baize: {
    wisdom: { movement: '白毛发光，镜头缓慢推进至眼睛', speed: 'slow', angle: '平视微仰' },
    teach: { movement: '静态授课，知识可视化如光点飘出', speed: 'static', angle: '过肩拍' },
    transform: { movement: '自然死亡时白毛化为光点飘散', speed: 'slow', angle: '远景拉远' }
  },
  phoenix: {
    takeoff: { movement: '慢动作展开翅膀', speed: 'slow_motion', angle: '仰拍' },
    dive: { movement: '第一人称视角', speed: 'fast', angle: '俯冲' },
    land: { movement: '翅膀减速+爪子抓地', speed: 'medium', angle: '低角度' },
    rebirth: { movement: '环绕+粒子爆发', speed: 'slow', angle: '中心' }
  },
  beast: {
    charge: { movement: '低角度正面冲击', speed: 'fast', angle: '正面' },
    roar: { movement: '镜头震动+声波可视化', speed: 'static', angle: '正面' },
    hunt: { movement: '跟拍+草丛穿梭', speed: 'medium', angle: '侧面' },
    rest: { movement: '固定观察', speed: 'static', angle: '鸟瞰' }
  }
};

// ============ 【故事内核融入】8岁男孩POV镜头语言约束 ============
const XG_POV_CAMERA_RULES = {
  perspective: {
    rule: '严格第一人称有限视角',
    height: '1.2米（8岁男孩眼高）',
    restrictions: [
      '禁止全知旁白式俯视',
      '禁止成人视角的解释性镜头',
      '禁止展示小G看不到的信息',
      '必须通过小G的眼睛、耳朵、身体感受来呈现世界'
    ]
  },
  language: {
    rule: '镜头语言随小G年龄成长',
    s1: { complexity: '简单直接', shots: '短镜头(2-4秒)', vocabulary: '基础词汇', metaphors: '简单比喻' },
    s2: { complexity: '开始探索', shots: '中长镜头(3-6秒)', vocabulary: '出现抽象词', metaphors: '自然比喻' },
    s3: { complexity: '情感深化', shots: '长镜头(5-8秒)', vocabulary: '情感词汇丰富', metaphors: '诗意比喻' },
    s4: { complexity: '成熟叙事', shots: '复杂调度', vocabulary: '反思性段落', metaphors: '哲学隐喻' }
  },
  signatureShots: {
    notebook: {
      name: '笔记本特写',
      description: '泛黄内页、炭笔线条、逐渐工整的字迹',
      evolution: 'S1涂鸦→S2图画+文字→S3系统记录→S4成熟书写',
      emotionalWeight: '笔记本是记忆的载体，每次出现都是情感锚点'
    },
    halfPhoto: {
      name: '半张照片',
      description: '家庭合影被撕裂或烧毁一半，只剩孩子和部分背景',
      evolution: 'S1模糊的回忆→S2具体的悲伤→S3接受失去→S4成为动力',
      emotionalWeight: '照片是旧世界的最后证据，每次出现都提醒"我失去了什么"'
    },
    featherPen: {
      name: '雪白智兽羽毛笔',
      description: '雪白智兽自然脱落的羽毛，小G用来写字',
      firstAppearance: 'S2雪白智兽首次见面后',
      emotionalWeight: '雪白智兽的遗产，写作工具，知识与传承的象征'
    }
  }
};

// ============ 【故事内核融入】8个标志性场景分镜规格 ============
const ICONIC_SCENE_SHOTS = {
  scene_1_guanyuan: {
    name: '归元之眼',
    shotSequence: [
      { shot: 'EXTREME_CLOSE_UP', target: '男孩眼睛', duration: 2, lighting: '瞳孔中倒映两个时间碰撞', emotion: '恐惧+震撼' },
      { shot: 'WIDE_SHOT', target: '城市与森林碰撞', duration: 5, lighting: '冷色调(蓝灰白)与暖色调(金绿赤)对比', emotion: '压倒性震撼' },
      { shot: 'DETAIL', target: '钢筋缠绕发光藤蔓', duration: 3, lighting: '金属网格长出树根', emotion: '诡异之美' },
      { shot: 'FLOATING', target: 'LED碎片漂浮如鳞片', duration: 4, lighting: '碎片反射异色光', emotion: '超现实' },
      { shot: 'WIDE_SHOT', target: '异兽在翻倒出租车旁饮水', duration: 5, lighting: '自然光', emotion: '新世界的日常' }
    ],
    totalDuration: 19,
    coreFunction: '30秒内建立世界观核心设定'
  },
  scene_2_wumian: {
    name: '无面之暖',
    shotSequence: [
      { shot: 'LOW_ANGLE', target: 'C级异兽逼到山洞角落', duration: 3, lighting: '冷暗', emotion: '恐惧' },
      { shot: 'SLOW_REVEAL', target: '光囊母兽缓缓出现', duration: 4, lighting: '黄囊状、赤金色、无面', emotion: '神秘+安全' },
      { shot: 'CLOSE_UP', target: '无面表面纹理', duration: 3, lighting: '低频振动产生的空气涟漪', emotion: '温柔' },
      { shot: 'OVER_SHOULDER', target: '男孩手贴光囊母兽表面', duration: 4, lighting: '暖光从接触点扩散', emotion: '连接' }
    ],
    totalDuration: 14,
    coreFunction: '建立光囊母兽"无条件庇护者"角色'
  },
  scene_3_gouhuo: {
    name: '篝火议会',
    shotSequence: [
      { shot: 'WIDE_SHOT', target: '夜晚篝火全景', duration: 5, lighting: '橙色火光为主光源', emotion: '温暖' },
      { shot: 'MEDIUM_SHOT', target: 'C级异兽围坐圆环', duration: 4, lighting: '异兽眼睛反射火光', emotion: '群体' },
      { shot: 'CLOSE_UP', target: '男孩给每只异兽取名', duration: 6, lighting: '光脉能量纽带形成——淡金色光线', emotion: '命名之力' },
      { shot: 'WIDE_SHOT', target: '画面对称构图', duration: 3, lighting: '深蓝夜空+金色光脉能量', emotion: '和谐' }
    ],
    totalDuration: 18,
    coreFunction: '展示"命名即理解"主题'
  }
};
// ============ 【世界模拟引擎融入】情感疲劳检测 + 光脉能量光晕计算 ============

/** 情感疲劳阈值配置 */
const FATIGUE_CONFIG = {
  consecutiveSameEmotionThreshold: 3,  // 连续同情感超过3镜头触发预警
  intensityAccumulationThreshold: 2.4,   // 强度累积阈值
  sorrowDominanceThreshold: 0.75,        // 悲伤占比过高阈值
  requiredVariationMin: 0.15,            // 最低情感变化幅度
  recoverySceneCount: 2,                 // 恢复所需镜头数
  maxRelicWords: 30                      // 遗迹描述词数上限
};

/** 五大元素→光脉能量光晕参数映射 */
const ELEMENT_AURA_PARAMS = {
  木: { particleCount: 100, particleColor: '#66BB6A', glowIntensity: 0.4, pulseFrequency: 0.6, resonanceWaveSpeed: 0.5, fadePattern: 'grow', trailLength: 20 },
  火: { particleCount: 200, particleColor: '#FF5722', glowIntensity: 0.9, pulseFrequency: 2.0, resonanceWaveSpeed: 1.5, fadePattern: 'flare', trailLength: 8 },
  土: { particleCount: 80, particleColor: '#FF8F00', glowIntensity: 0.7, pulseFrequency: 1.0, resonanceWaveSpeed: 0.4, fadePattern: 'settle', trailLength: 5 },
  金: { particleCount: 180, particleColor: '#FFF176', glowIntensity: 1.0, pulseFrequency: 1.5, resonanceWaveSpeed: 1.2, fadePattern: 'shimmer', trailLength: 10 },
  水: { particleCount: 150, particleColor: '#29B6F6', glowIntensity: 0.5, pulseFrequency: 0.8, resonanceWaveSpeed: 0.6, fadePattern: 'flow', trailLength: 25 },
  混沌: { particleCount: 120, particleColor: '#4FC3F7', glowIntensity: 0.6, pulseFrequency: 1.2, resonanceWaveSpeed: 0.8, fadePattern: 'ripple', trailLength: 15 }
};

/** 五大元素→五色映射 */
const ELEMENT_TO_COLOR = {
  木: '#4CAF50',  // 青
  火: '#F44336',  // 赤
  土: '#FF9800',  // 黄
  金: '#FFFFFF',  // 白
  水: '#2196F3',  // 黑(蓝)
  混沌: '#9C27B0'  // 紫
};

class ShanhaiCinematography {
  constructor(worldview = 'nirath') {
    this.techniques = getCinematographyTechniques(worldview);
    this.sceneCameraMap = getSceneCameraMap(worldview);
    this.worldview = worldview;
    console.log(`🎥 [Cinematography] 加载运镜库: ${worldview === 'nirath' ? 'Nirath双星荒野' : worldview === 'superreal' ? '超写实通用' : '山海经洪荒'} (${Object.keys(this.techniques).length} 项)`);
    this.emotionMap = SHANHAI_EMOTION_CAMERA_MAP;
    this.movements = SHANHAI_CAMERA_MOVEMENTS;
    this.povRules = XG_POV_CAMERA_RULES;
    this.iconicScenes = ICONIC_SCENE_SHOTS;
    this.fatigueConfig = FATIGUE_CONFIG;
    this.elementAuraParams = ELEMENT_AURA_PARAMS;
    this.elementToColor = ELEMENT_TO_COLOR;
    
    // 🎬 v3.1-Peng: 加载Nirath场景运镜语法圣经
    this.nirathSceneGrammar = null;
    if (worldview === 'nirath') {
      try {
        const { NIRATH_SCENES } = require('../shanhaijing-render-engine/nirath-world-core.js');
        this.nirathSceneGrammar = NIRATH_SCENES;
        console.log(`🎬 [Cinematography] 加载Nirath场景运镜语法: ${Object.keys(NIRATH_SCENES).length} 个生态区 × 6类运镜`);
      } catch (err) {
        console.warn(`⚠️ [Cinematography] Nirath场景语法加载失败: ${err.message}`);
      }
    }
  }

  /**
   * 🌍 v3.0-Peng: 根据Nirath场景获取推荐运镜
   */
  getSceneRecommendedMoves(sceneName) {
    if (this.worldview !== 'nirath') return null;
    const map = this.sceneCameraMap;
    for (const [key, value] of Object.entries(map)) {
      if (sceneName.includes(key)) {
        return value;
      }
    }
    return { primary: 'twin_sun_tracking', secondary: 'crystal_caustic_detail' };
  }

  /**
   * 推荐分镜技法
   */
  recommendTechniques(shotType, emotion, beastSpecies = 'beast') {
    const techniques = [];

    // 根据镜头类型推荐
    if (shotType === 'beast_entrance') {
      techniques.push(this.techniques.impact_frame);
      techniques.push(this.techniques.slow_motion_detail);
    } else if (shotType === 'scene_transition') {
      techniques.push(this.techniques.ink_dissolve);
      techniques.push(this.techniques.black_flash);
    } else if (shotType === 'power_awakening') {
      techniques.push(this.techniques.white_flash);
      techniques.push(this.techniques.transformation_sequence);
    } else if (shotType === 'emotional_peak') {
      techniques.push(this.techniques.slow_motion_detail);
      techniques.push(this.techniques.screen_split);
    } else if (shotType === 'world_showcase') {
      techniques.push(this.techniques.continuous_long_take);
    }

    // 根据情绪微调
    if (emotion === '恐惧' || emotion === '悲壮') {
      techniques.push(this.techniques.black_flash);
    }
    if (emotion === '激昂' || emotion === '敬畏') {
      techniques.push(this.techniques.white_flash);
    }

    return techniques;
  }

  /**
   * 获取情绪运镜参数
   */
  getCameraByEmotion(emotion) {
    return this.emotionMap[emotion] || this.emotionMap['神秘'];
  }

  /**
   * 获取物种专属运镜
   */
  getMovementBySpecies(species, action) {
    const speciesMovements = this.movements[species] || this.movements.beast;
    return speciesMovements[action] || speciesMovements.rest;
  }

  /**
   * 🎬 v3.1-Peng: 场景检测 — 从镜头描述中识别Nirath生态区
   */
  detectScene(description = '') {
    if (this.worldview !== 'nirath' || !this.nirathSceneGrammar) return null;
    const desc = description.toLowerCase();
    
    // 关键词映射表（按优先级排序）
    const sceneKeywords = {
      abyssal_luminara: ['ocean', 'sea', 'wave', 'tide', 'abyss', 'luminara', '敖之腿', '归墟', '发光海洋', '深渊'],
      broken_axis_peaks: ['mountain', 'volcano', 'peak', 'lava', 'magma', 'aurora', 'jianmu', '不周', '建木', '断裂'],
      azure_hills: ['grassland', 'plain', 'hill', 'meadow', 'spore jelly', 'azure', '青丘', '灵原', '草原', '丘陵'],
      subterranean_styx: ['cave', 'underground', 'cavern', 'subterranean', 'soul thread', '幽冥', '地下海', '黄泉'],
      solar_cradle: ['basin', 'crater', 'fusang', 'crystal tree', 'sundog', '汤谷', '扶桑', '盆地'],
      kunlun_sky: ['floating', 'levitat', 'sky continent', 'waterfall', 'superconductor', '昆仑', '悬境', '悬浮'],
      plain_zhulu: ['plain', 'fissure', 'chessboard', 'monolith', 'electromagnetic', '涿鹿', '裂隙', '棋盘'],
      archipelago_penglai: ['island', 'archipelago', 'penglai', 'fern', 'rainbow bridge', '蓬莱', '迷雾', '岛群'],
      astrop_nexus: ['nexus', 'pillar', 'plasma', 'sacred geometry', '星门', '祭坛', '晶体柱'],
      spine_pangu: ['spine', 'rift', 'mantle', 'obsidian', 'pangu', '盘古', '之脊', '裂谷']
    };
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [sceneId, keywords] of Object.entries(sceneKeywords)) {
      let score = 0;
      for (const kw of keywords) {
        if (desc.includes(kw)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sceneId;
      }
    }
    
    return bestScore > 0 ? bestMatch : null;
  }

  /**
   * 🎬 v3.1-Peng: 镜头角色分类 — 识别镜头在场景中的叙事角色
   */
  classifyShotRole(shotData, sceneId = null) {
    const { description = '', shotType = '', emotion = '', shotIndex = 0, totalShots = 1 } = shotData;
    const desc = description.toLowerCase();
    
    // 1. 基于shotType直接映射
    const typeRoleMap = {
      'beast_entrance': 'characterEntrance',
      'power_awakening': 'climax',
      'scene_transition': 'transition',
      'emotional_peak': 'climax',
      'world_showcase': 'spectacle'
    };
    if (typeRoleMap[shotType]) return typeRoleMap[shotType];
    
    // 2. 基于描述关键词识别
    if (desc.includes('opening') || desc.includes('intro') || desc.includes('开场') || desc.includes('建立') || shotIndex === 0) {
      return 'opening';
    }
    if (desc.includes('entrance') || desc.includes('appear') || desc.includes('出场') || desc.includes('浮现') || desc.includes('走来')) {
      return 'characterEntrance';
    }
    if (desc.includes('spectacle') || desc.includes('wonder') || desc.includes('奇观') || desc.includes('震撼') || desc.includes('展示')) {
      return 'spectacle';
    }
    if (desc.includes('transition') || desc.includes('穿越') || desc.includes('转场') || desc.includes('漂移到') || desc.includes('滑行')) {
      return 'transition';
    }
    if (desc.includes('climax') || desc.includes('peak') || desc.includes('awaken') || desc.includes('高潮') || desc.includes('觉醒') || desc.includes('决战')) {
      return 'climax';
    }
    if (desc.includes('creature') || desc.includes('species') || desc.includes('生物') || desc.includes('异兽') || desc.includes('共生')) {
      return 'speciesInteraction';
    }
    
    // 3. 基于位置启发式
    if (shotIndex === 0) return 'opening';
    if (shotIndex === totalShots - 1) return 'climax';
    if (shotIndex === Math.floor(totalShots / 2)) return 'spectacle';
    
    // 默认：基于情绪推断
    if (['激昂', '敬畏', '恐惧', '悲壮', '觉醒'].includes(emotion)) return 'climax';
    return 'transition';
  }

  /**
   * 🎬 v3.1-Peng: 获取场景专属运镜语法
   */
  getSceneCinematography(sceneId, role) {
    if (!this.nirathSceneGrammar || !sceneId) return null;
    const scene = this.nirathSceneGrammar[sceneId];
    if (!scene || !scene.cinematography) return null;
    return scene.cinematography[role] || null;
  }

  /**
   * 生成完整分镜方案 (v3.1-Peng: 自动场景识别 + 生态区专属运镜)
   */
  generateShotPlan(shotData) {
    const { id, description, emotion, beastSpecies, shotType, duration = 5, shotIndex = 0, totalShots = 1 } = shotData;

    // 🎬 v3.1: 自动场景识别
    const sceneId = this.detectScene(description);
    
    // 🎬 v3.1: 镜头角色分类
    const shotRole = this.classifyShotRole({ description, shotType, emotion, shotIndex, totalShots }, sceneId);
    
    // 🎬 v3.1: 获取场景专属运镜语法
    let sceneGrammar = null;
    if (sceneId && this.worldview === 'nirath') {
      sceneGrammar = this.getSceneCinematography(sceneId, shotRole);
      if (sceneGrammar) {
        console.log(`🎬 [Cinematography] ${id} → 场景: ${sceneId} | 角色: ${shotRole} | 运镜: ${sceneGrammar.technique} (${sceneGrammar.name})`);
      }
    }

    // 基础运镜
    const camera = this.getCameraByEmotion(emotion);

    // 物种运镜增强
    const movement = this.getMovementBySpecies(beastSpecies, shotType);

    // 技法推荐
    const techniques = this.recommendTechniques(shotType, emotion, beastSpecies);

    // 融合参数
    const fusedCamera = {
      ...camera,
      speciesMovement: movement.movement,
      speed: movement.speed,
      techniques: techniques.map(t => t.name)
    };
    
    // 🎬 v3.1: 如果场景专属运镜存在，覆盖/增强参数
    if (sceneGrammar) {
      if (sceneGrammar.lens) fusedCamera.lens = sceneGrammar.lens;
      if (sceneGrammar.aspectRatio) fusedCamera.aspectRatio = sceneGrammar.aspectRatio;
      if (sceneGrammar.ref) fusedCamera.ref = sceneGrammar.ref;
      if (sceneGrammar.description) fusedCamera.sceneDescription = sceneGrammar.description;
      if (sceneGrammar.mood) fusedCamera.sceneMood = sceneGrammar.mood;
    }

    const result = {
      shotId: id,
      description,
      emotion,
      beastSpecies,
      duration,
      camera: fusedCamera,
      techniques,
      lighting: camera.lighting,
      lens: fusedCamera.lens || camera.lens,
      angle: camera.angle,
      movement: movement.movement
    };
    
    // 🎬 v3.1: 附加场景级元数据
    if (sceneId) {
      result.sceneId = sceneId;
      result.shotRole = shotRole;
    }
    if (sceneGrammar) {
      result.sceneGrammar = sceneGrammar;
    }
    
    return result;
  }

  /**
   * 为整集生成全部分镜
   */
  generateEpisodeShots(episodePlan, beastId, beastSpecies = 'dragon') {
    const shots = [];
    let currentTime = 0;

    episodePlan.acts.forEach((act, actIndex) => {
      // 每幕生成3-5个镜头
      const shotsPerAct = Math.max(3, Math.floor(act.duration / 45));

      for (let i = 0; i < shotsPerAct; i++) {
        const shotDuration = Math.floor(act.duration / shotsPerAct);
        const shotId = `E${episodePlan.id}_A${actIndex + 1}_S${i + 1}`;

        const shot = this.generateShotPlan({
          id: shotId,
          description: `${act.name} - 镜头${i + 1}`,
          emotion: act.emotion,
          beastSpecies,
          shotType: this.inferShotType(act, i),
          duration: shotDuration
        });

        shot.startTime = currentTime;
        shot.endTime = currentTime + shotDuration;
        currentTime += shotDuration;

        shots.push(shot);
      }
    });

    return shots;
  }

  inferShotType(act, shotIndex) {
    if (shotIndex === 0) return 'beast_entrance';
    if (act.tension > 0.8) return 'power_awakening';
    if (act.tension < 0.3) return 'scene_transition';
    return 'emotional_peak';
  }

  /**
   * 获取8岁POV约束
   */
  getXGPovRules() {
    return this.povRules;
  }

  /**
   * 获取标志性场景分镜
   */
  getIconicSceneShots(sceneId) {
    return this.iconicScenes[sceneId] || null;
  }

  /**
   * 获取所有标志性场景分镜
   */
  getAllIconicSceneShots() {
    return this.iconicScenes;
  }

  /**
   * 根据集数获取镜头语言复杂度
   */
  getCameraLanguageByEpisode(episodeCode) {
    const season = episodeCode.substring(0, 2);
    const seasonMap = {
      'S1': this.povRules.language.s1,
      'S2': this.povRules.language.s2,
      'S3': this.povRules.language.s3,
      'S4': this.povRules.language.s4
    };
    return seasonMap[season] || this.povRules.language.s1;
  }

  /**
   * 【世界模拟引擎融入】情感疲劳检测
   * 检测连续镜头中是否存在情感疲劳风险
   * @param {Array} shotHistory - 历史镜头情感数据 [{emotion, intensity, sceneType}]
   * @returns {Object} 疲劳检测报告
   */
  detectEmotionFatigue(shotHistory) {
    if (!Array.isArray(shotHistory) || shotHistory.length === 0) {
      return { hasFatigue: false, fatigueLevel: 'none', warnings: [] };
    }

    const warnings = [];
    const config = this.fatigueConfig;

    // 1. 连续同情感检测
    let maxConsecutiveSame = 1;
    let currentConsecutive = 1;
    let consecutiveEmotion = shotHistory[0].emotion;

    for (let i = 1; i < shotHistory.length; i++) {
      if (shotHistory[i].emotion === consecutiveEmotion) {
        currentConsecutive++;
        maxConsecutiveSame = Math.max(maxConsecutiveSame, currentConsecutive);
      } else {
        currentConsecutive = 1;
        consecutiveEmotion = shotHistory[i].emotion;
      }
    }

    if (maxConsecutiveSame >= config.consecutiveSameEmotionThreshold) {
      warnings.push({
        type: 'consecutive_dominance',
        level: maxConsecutiveSame >= 5 ? 'high' : 'medium',
        message: `连续${maxConsecutiveSame}镜头以同一情感(${consecutiveEmotion})为主导`
      });
    }

    // 2. 悲伤占比检测
    const sorrowShots = shotHistory.filter(s => s.emotion === '温柔悲伤' || s.emotion === 'gentleSorrow');
    const sorrowRatio = sorrowShots.length / shotHistory.length;
    if (sorrowRatio > config.sorrowDominanceThreshold) {
      warnings.push({
        type: 'sorrow_overdominance',
        level: sorrowRatio > 0.85 ? 'high' : 'medium',
        message: `悲伤主导占比过高: ${Math.round(sorrowRatio * 100)}%`
      });
    }

    // 3. 强度累积检测
    const recentShots = shotHistory.slice(-5);
    const intensitySum = recentShots.reduce((s, e) => s + (e.intensity || 0), 0);
    if (intensitySum > config.intensityAccumulationThreshold) {
      warnings.push({
        type: 'intensity_accumulation',
        level: intensitySum > 3.5 ? 'high' : 'medium',
        message: `近5镜头强度累积过高: ${Math.round(intensitySum * 100) / 100}`
      });
    }

    // 4. 情感变化幅度检测（仅当镜头数≥4时判定，避免偶然小变化误报）
    let lowVariationCount = 0;
    if (shotHistory.length >= 4) {
      for (let i = 1; i < shotHistory.length; i++) {
        const delta = Math.abs((shotHistory[i].intensity || 0) - (shotHistory[i - 1].intensity || 0));
        if (delta < config.requiredVariationMin) {
          lowVariationCount++;
        }
      }
      if (lowVariationCount >= 2) {
        warnings.push({
          type: 'low_variation',
          level: 'medium',
          message: `连续${lowVariationCount}处相邻镜头情感变化幅度低于阈值${config.requiredVariationMin}`
        });
      }
    }

    // 确定疲劳等级
    const highWarnings = warnings.filter(w => w.level === 'high').length;
    const mediumWarnings = warnings.filter(w => w.level === 'medium').length;

    let fatigueLevel = 'none';
    if (highWarnings >= 2) fatigueLevel = 'severe';
    else if (highWarnings >= 1 || mediumWarnings >= 3) fatigueLevel = 'moderate';
    else if (mediumWarnings >= 1) fatigueLevel = 'mild';

    return {
      hasFatigue: warnings.length > 0,
      fatigueLevel,
      warnings,
      statistics: {
        totalShots: shotHistory.length,
        sorrowRatio: Math.round(sorrowRatio * 100) / 100,
        maxConsecutiveSame,
        avgIntensity: Math.round(
          (shotHistory.reduce((s, e) => s + (e.intensity || 0), 0) / shotHistory.length) * 100
        ) / 100,
        lowVariationCount: lowVariationCount || 0
      },
      recoveryPlan: fatigueLevel !== 'none' ? {
        recommendedEmotions: ['aweGrandeur', 'hopeFire'],
        targetIntensity: fatigueLevel === 'severe' ? 0.3 : fatigueLevel === 'moderate' ? 0.4 : 0.5,
        duration: config.recoverySceneCount,
        description: `建议引入壮美/希望情感镜头，将强度控制在${fatigueLevel === 'severe' ? 0.3 : fatigueLevel === 'moderate' ? 0.4 : 0.5}以下，持续${config.recoverySceneCount}个镜头`
      } : null
    };
  }

  /**
   * 【世界模拟引擎融入】计算光脉能量光晕强度
   * @param {string} element - 五大元素属性 (木/火/土/金/水/混沌)
   * @param {number} beastLevel - 异兽等级 1-10
   * @param {number} emotionIntensity - 情绪强度 0-1
   * @param {number} regionConcentration - 区域光脉能量浓度 0-1
   * @returns {Object} 光脉能量光晕参数
   */
  calculateSpiritAura(element, beastLevel = 5, emotionIntensity = 0.5, regionConcentration = 0.7) {
    const params = this.elementAuraParams[element] || this.elementAuraParams['混沌'];
    const concentration = Math.max(0, Math.min(1, regionConcentration));
    const level = Math.max(1, Math.min(10, beastLevel));
    const emotion = Math.max(0, Math.min(1, emotionIntensity));

    // 核心强度计算：区域浓度 × 异兽等级系数 × 情绪增幅
    const levelFactor = level / 10;
    const emotionBoost = 1 + emotion * 0.5;
    const intensity = Math.max(0, Math.min(1, concentration * levelFactor * emotionBoost));

    // 光晕半径基于异兽等级和光脉能量浓度
    const radius = Math.round(100 + level * 30 + concentration * 200);

    // 脉动频率与情绪强度正相关
    const pulseRate = Math.round((0.5 + emotion * 2.0) * 100) / 100;

    // 粒子密度
    const particleDensity = Math.round(50 + intensity * 300);

    // 根据强度确定色调
    let auraColor;
    if (intensity < 0.3) auraColor = '#4FC3F7'; // 浅蓝
    else if (intensity < 0.6) auraColor = '#81C784'; // 浅绿
    else if (intensity < 0.8) auraColor = '#FFF176'; // 浅黄
    else auraColor = '#FFFFFF'; // 纯白

    return {
      element,
      intensity: Math.round(intensity * 100) / 100,
      radius,
      pulseRate,
      particleDensity,
      auraColor,
      coreBrightness: Math.round(intensity * 1.2 * 100) / 100,
      particleCount: params.particleCount,
      particleColor: params.particleColor,
      glowIntensity: params.glowIntensity,
      resonanceWaveSpeed: params.resonanceWaveSpeed,
      fadePattern: params.fadePattern,
      trailLength: params.trailLength,
      formula: `intensity = concentration(${concentration}) × levelFactor(${levelFactor}) × emotionBoost(${emotionBoost})`
    };
  }

  /**
   * 【世界模拟引擎融入】生成书写光脉能量共振特效参数
   * @param {string} element - 五大元素属性
   * @returns {Object} 书写光脉能量共振特效参数
   */
  generateWritingResonance(element) {
    const params = this.elementAuraParams[element] || this.elementAuraParams['混沌'];
    const elementColor = this.elementToColor[element] || '#4FC3F7';

    const writingGuides = {
      木: { strokeStyle: '流畅舒展，如枝叶延展', rhythmPattern: '轻柔起伏，如风吹林动', inkDiffusion: '渐变渗透，如根系蔓延', recommendedScript: '行书' },
      火: { strokeStyle: '奔放热烈，如火焰跳动', rhythmPattern: '急促有力，如烈焰升腾', inkDiffusion: '爆裂扩散，如火星四溅', recommendedScript: '草书' },
      土: { strokeStyle: '厚重沉稳，如大地承载', rhythmPattern: '缓慢坚定，如山川不移', inkDiffusion: '均匀铺展，如尘沙落尽', recommendedScript: '楷书' },
      金: { strokeStyle: '锐利精确，如刀刻斧凿', rhythmPattern: '干脆利落，如金铁交鸣', inkDiffusion: '清晰边界，如铸印成型', recommendedScript: '隶书' },
      水: { strokeStyle: '婉转灵动，如流水不息', rhythmPattern: '连绵不绝，如潮汐往复', inkDiffusion: '自然晕染，如墨滴入水', recommendedScript: '行书' },
      混沌: { strokeStyle: '混沌天成，无迹可寻', rhythmPattern: '变化无常，如风云莫测', inkDiffusion: '随机渗透，如天地初开', recommendedScript: '狂草' }
    };

    return {
      element,
      particleCount: params.particleCount,
      particleColor: params.particleColor,
      glowIntensity: params.glowIntensity,
      pulseFrequency: params.pulseFrequency,
      resonanceWaveSpeed: params.resonanceWaveSpeed,
      fadePattern: params.fadePattern,
      trailLength: params.trailLength,
      writingGuide: writingGuides[element] || writingGuides['混沌'],
      elementColor
    };
  }
}

// ============ 导出 ============
module.exports = {
  ShanhaiCinematography,
  SHANHAI_CINEMATOGRAPHY_TECHNIQUES,
  SHANHAI_EMOTION_CAMERA_MAP,
  SHANHAI_CAMERA_MOVEMENTS,
  XG_POV_CAMERA_RULES,
  ICONIC_SCENE_SHOTS,
  NIRATH_CINEMATOGRAPHY_TECHNIQUES,
  NIRATH_SCENE_CAMERA_MAP,
  getCinematographyTechniques,
  getSceneCameraMap
};

// CLI 测试
if (require.main === module) {
  const cinema = new ShanhaiCinematography();

  console.log('\n🎥 Nirath原创世界观志怪分镜系统测试\n');

  const shot = cinema.generateShotPlan({
    id: 'E01_A3_S1',
    description: '守光巨兽力量觉醒',
    emotion: '敬畏',
    beastSpecies: 'dragon',
    shotType: 'power_awakening',
    duration: 8
  });

  console.log(`镜头: ${shot.shotId}`);
  console.log(`运镜: ${shot.camera.lens} + ${shot.movement}`);
  console.log(`技法: ${shot.techniques.join(', ')}`);
  console.log(`布光: ${shot.lighting}`);
}