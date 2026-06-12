/**
 * Nirath World Core v3.2-Peng (Production)
 * 原生星球Nirath世界观锚点 — 强约束风格注入系统
 * 
 * 核心原则: 这不是外星世界。这是地球在做梦——梦见自己46亿年前的样子。
 * 所有场景都应有可识别的地质形态，但其材质、尺度和发光属性必须超越地球经验。
 */

// ========== Nirath星球核心参数 ==========
const NIRATH_PLANET = {
  name: 'Nirath',
  subtitle: 'The Proto-Earth',
  size: '1.7x Earth',
  rotation: '28 hours',
  oceanCoverage: '71%',
  starSystem: 'Dual-star (binary)',
  
  // 双恒星系统（贯穿所有室外场景的一致性锚点）
  primaryStar: {
    name: 'Amber Sun',
    color: 'amber-orange',
    temperature: 'Warm',
    position: 'Primary horizon'
  },
  secondaryStar: {
    name: 'Violet Sun', 
    color: 'violet-purple',
    temperature: 'Cool',
    position: 'Secondary horizon'
  },
  
  // 大气特征
  atmosphere: {
    sporeClouds: true,
    bioluminescentParticles: true,
    godRays: true,
    dualSunset: true,
    colorTemperature: 'Rose-gold twilight'
  },
  
  // 海洋特征
  ocean: {
    type: 'Bioluminescent',
    color: 'Deep cyan to emerald',
    waves: 'Glowing crests',
    life: 'Trillions of photoplankton'
  }
};

// ========== 核心美学原则 ==========
const NIRATH_AESTHETIC = {
  principle1: 'Familiar yet alien: recognizable geological forms with impossible materials',
  principle2: 'Science in poetry: bioluminescence, superconductivity, supercritical fluids',
  principle3: 'Mythology as geology: every myth corresponds to a real geological event',
  principle4: 'Light as narrative: light is life, memory, unborn myth',
  
  // 一致性约束
  consistency: {
    dualStars: 'ALL outdoor scenes maintain consistent dual-star position and color temp',
    bioluminescence: 'Deep sea = cyan/emerald, high altitude = warm gold/pink, geothermal = orange-red, superconductor = electric blue',
    atmosphere: 'Atmospheric perspective ALWAYS present — distant views shift blue-purple',
    volumetricLight: 'Volumetric light effects贯穿所有场景 — Avatar aesthetic core',
    material: 'Obsidian glass, superconductor crystal, biological tissue, liquid metal each have unique highlight response',
    scale: 'Every scene MUST include human-scale reference or forced perspective to convey Nirath\'s immensity'
  }
};

// ========== 技术渲染参数 ==========
const NIRATH_RENDER = {
  engine: 'Unreal Engine 5.3+',
  lighting: 'Lumen real-time ray-traced global illumination',
  materials: 'Substrate layered material system',
  geometry: 'Nanite virtual geometry',
  volumetrics: 'Volumetric Fog + Cloud',
  postProcessing: 'Film simulation (Kodak 5219) + lens distortion (12-50mm)',
  resolution: '8K (7680x4320)',
  colorSpace: 'ACES 2065-1',
  dynamicRange: 'HDR peak 1000nit',
  aspectRatio: 'IMAX 1.43:1 / 2.39:1 anamorphic'
};

// ========== 十大场景数据库 ==========
const NIRATH_SCENES = {
  // 场景一：归墟之海 — 深渊发光海洋
  abyssal_luminara: {
    id: 'S01',
    name: '归墟之海 · The Abyssal Luminara',
    mythReference: '渤海之东，不知几亿万里，有大壑焉，实惟无底之谷，其下无底，名曰归墟',
    geography: 'Planet\'s largest ocean trench, 4000km diameter',
    
    visual: {
      sea: 'Unquiet liquid light blanket, wave crests erupting cyan-green bioluminescence',
      sky: 'Dual stars at horizon — one amber, one violet, interweaving rose-gold twilight',
      distance: 'Colossal obsidian pillars rising from depths — "Legs of Ao", frozen myth',
      atmosphere: 'Low-altitude spore cloud bands pierced by sunlight, forming solidified "divine light pillars"'
    },
    
    lighting: {
      key: 'Golden hour x2 (dual-star diffused warm light)',
      fill: 'Bioluminescent teal from below',
      accent: 'Volumetric god-rays through spore clouds'
    },
    
    colorPalette: ['Deep cyan', 'Emerald green', 'Rose gold', 'Obsidian black', 'Bioluminescent aqua'],
    mood: 'Primordial, sacred, overwhelming scale, birthplace of mythology',
    lens: '12mm ultra-wide, IMAX 1.43:1, slight barrel distortion',
    
    seedPrompt: `The Abyssal Luminara — infinite glowing ocean on proto-Earth Nirath. Bioluminescent waves crash against colossal obsidian pillars called "Legs of Ao". Seawater teems with trillions of photoplankton emitting cyan-emerald bioluminescence. Dual suns — amber and violet — hover at horizon casting rose-gold twilight. Spore clouds drift in ribbon formations pierced by crepuscular god-rays.`,
    
    // 🎬 S01 归墟之海 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'atmospheric_push_pull + twin_sun_tracking',
        name: '深渊凝视',
        duration: '10-15s',
        lens: '12mm ultra-wide',
        aspectRatio: 'IMAX 1.43:1',
        ref: 'Emmanuel Lubezki',
        description: '从蓝紫雾域远景推进，穿过雾气后突然"跌落"，海平面出现，生物发光浪涌涌来，双星形成剪影轮廓',
        mood: '从浩瀚到压迫'
      },
      characterEntrance: {
        technique: 'twin_sun_tracking + bioluminescent_drift',
        name: '逆光轮廓',
        duration: '6-8s',
        lens: '12mm',
        description: '角色站在黑曜石巨柱边缘，双星逆光轮廓，浪涌拍打脚下，面部从剪影中"浮现"',
        mood: '神秘、神圣、来自深渊'
      },
      spectacle: {
        technique: 'crystal_orbit + obsidian_reflection_reveal',
        name: '敖之腿仰望',
        duration: '12-20s',
        lens: '12mm',
        description: '从黑曜石巨柱底部反射水面缓慢上摇，双星倒影→巨柱真实形态"生长"出来',
        mood: '敬畏、超越人类尺度的神圣'
      },
      transition: {
        technique: 'bioluminescent_drift',
        name: '浪涌穿越',
        duration: '4-6s',
        description: '镜头在海平面高度漂移，穿过生物发光浪涌，每波浪涌填满画面1-2帧形成光闪转场',
        mood: '流动、过渡'
      },
      climax: {
        technique: 'abyssal_awakening_native',
        name: '深渊觉醒+双星归位',
        duration: '8-12s',
        lens: '12mm',
        description: '双星在画面上方交汇，生物发光指数级上升→white-cyan，浪涌同心圆汇聚',
        mood: '宇宙级力量的觉醒'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '光噬浮游微距',
        duration: '3-5s',
        lens: '微距',
        description: 'Wave Phage万亿微观生物在浪涌crest爆发cyan-emerald光芒，跟随单个浪涌形成到破裂',
        mood: '微观宇宙的壮美'
      }
    },
    
    variants: {
      storm: 'Massive electrical storm with bioluminescent lightning, 20-meter glowing waves, apocalyptic yet beautiful',
      calm: 'Pre-dawn glass-like water reflecting twin stars as perfect mirror, silent meditative, bioluminescence in gentle concentric rings'
    }
  },
  
  // 场景二：不周山脉 — 断裂火山链
  broken_axis_peaks: {
    id: 'S02',
    name: '不周山脉 · The Broken Axis Peaks',
    mythReference: '昔者共工与颛顼争为帝，怒而触不周之山，天柱折，地维绝',
    geography: 'Super volcano chain at equator, central peak "Broken Sky Summit" 12,000m',
    
    visual: {
      mountain: 'Semi-transparent obsidian interwoven with glowing minerals, lava rivers visible inside',
      fracture: 'Peak sheared at mid-mountain, exposed crystal veins pulsing orange-red',
      ecology: '"Jianmu" giant bioluminescent vine-plants hundreds of meters tall, lantern-like flowers',
      sky: 'Aurora borealis in violet-teal mixing with volcanic ash clouds, otherworldly sky-dome'
    },
    
    lighting: {
      key: 'Volcanic orange-red from within mountain',
      fill: 'Aurora violet from above',
      accent: 'Bioluminescent amber from Jianmu + lava bounce light'
    },
    
    colorPalette: ['Obsidian black', 'Magma orange', 'Crystal red', 'Aurora violet', 'Bioluminescent amber', 'Volcanic ash grey'],
    mood: 'Cataclysmic beauty, raw geological power, sacred destruction, heaven-earth connection severed',
    lens: '18mm wide angle, dramatic low-angle against aurora sky',
    
    seedPrompt: `Broken Axis Peaks — titanic volcanic mountain chain at equator. Central peak "Broken Sky Summit" 12,000m sheared by ancient asteroid impact. Exposed cross-section reveals cathedral-sized chambers with pulsing orange-red crystal veins and molten magma visible through semi-transparent obsidian. Surface draped in "Jianmu" — colossal bioluminescent vine-plants with lantern-like flowers. Aurora curtains in violet-teal mixed with volcanic ash clouds.`,
    
    // 🎬 S02 不周山脉 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'crystal_orbit + geothermal_bloom',
        name: '天柱断裂',
        duration: '12-18s',
        lens: '18mm wide angle',
        aspectRatio: '2.39:1',
        ref: 'Denis Villeneuve',
        description: '从断裂面"伤口"开始，晶体脉管脉动橙红光芒，横移揭示断裂尺度：晶体→熔岩→极光→消失在火山灰云层',
        mood: '灾难的美、地质创伤'
      },
      characterEntrance: {
        technique: 'geothermal_bloom + twin_sun_tracking',
        name: '熔岩轮廓',
        duration: '8-10s',
        lens: '18mm',
        description: '角色从半透明黑曜石山体内部"浮现"，熔岩光芒勾勒剪影，透明度变化从"内部发光体"变为实体',
        mood: '从地球内部走出的力量'
      },
      spectacle: {
        technique: 'vertical_life_entwining_native',
        name: '建木通天',
        duration: '15-25s',
        lens: '18mm',
        description: '仰拍建木沿螺旋生长轨迹上升，灯笼花朵逐个亮起，最终俯瞰整个火山链，极光流动',
        mood: '生命对抗地质暴力、向上的意志'
      },
      transition: {
        technique: 'light_vein_tunnel',
        name: '晶体通道',
        duration: '6-10s',
        description: '沿山体内部晶体脉管"滑行"，半透明黑曜石壁可见隔壁熔岩流动，光芒引导镜头',
        mood: '穿越地球内部'
      },
      climax: {
        technique: 'fracture_replay_native',
        name: '断裂重演',
        duration: '10-15s',
        lens: '18mm',
        description: '时间切片效果——断裂瞬间分解为100冻结切片，镜头从中穿过：完整→裂缝→晶体→熔岩→尘埃',
        mood: '瞬间的永恒、创伤的化石'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '建木共生微距',
        duration: '5-8s',
        lens: '微距',
        description: '建木表面游走，黑曜石质感外壳上生物发光纹理如电路板，灯笼花从闭合黑→透明→暗红→亮橙绽放',
        mood: '植物与矿物的共生'
      }
    },
    
    variants: {
      interior: 'Inside the mountain\'s exposed crystal chamber, rivers of lava flowing through translucent crystal walls, Jianmu roots penetrating from above like divine tentacles',
      impact: 'The Moment of Impact frozen in geological time, asteroid half-embedded in mountain side, shockwave pattern frozen in rock, molten debris suspended in air'
    }
  },
  
  // 场景三：青丘灵原 — 蓝绿色丘陵草原
  azure_hills: {
    id: 'S03',
    name: '青丘灵原 · The Azure Hills Spirit Plain',
    mythReference: '又东三百里，曰青丘之山，其阳多玉，其阴多青䴔。有兽焉，其状如狐而九尾',
    geography: 'Fertile rolling grassland, vegetation displays impossible blue-green hue',
    
    visual: {
      grassland: 'Infinite blue-green tall grass undulating like ocean, edges traced with faint bioluminescent cyan',
      hills: 'Gentle rolling terrain covered in "Azure Jade Moss" lichen emitting soft blue-white luminescence under twin moons',
      life: 'Floating "Spore Jellies" — translucent air-buoyant creatures meters in diameter, ribbon tentacles, glowing internal organs',
      water: 'Silver-mercury lakes dotting landscape like liquid mirrors, perfectly reflecting dual moons'
    },
    
    lighting: {
      key: 'Twin-moon cool blue',
      fill: 'Bioluminescent cyan from grass edges',
      accent: 'Warm pink-gold from spore jellies + silver reflection from mercury lakes'
    },
    
    colorPalette: ['Azure blue', 'Emerald-cyan', 'Silver white', 'Bioluminescent aqua', 'Twin-moon cool blue', 'Warm gold'],
    mood: 'Dreamlike serenity, abundant life, mystical fertility, Garden of Eden before the fall',
    lens: '35mm cinematic, gentle depth of field, Roger Deakins-inspired naturalistic lighting',
    
    seedPrompt: `Azure Hills Spirit Plain — infinite rolling grassland with impossible blue-green vegetation using rhodopsin-like photosynthesis. Tall grasses undulate like ocean with bioluminescent cyan edges. Hills carpeted in "Azure Jade Moss" emitting soft blue-white luminescence under twin moons. Sky filled with floating "Spore Jellies" — translucent air-buoyant creatures with glowing pink-gold internal organs. Silver-mercury lakes like liquid mirrors reflecting dual moons.`,
    
    // 🎬 S03 青丘灵原 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'atmospheric_push_pull + bioluminescent_drift',
        name: '灵原呼吸',
        duration: '12-18s',
        lens: '35mm cinematic',
        aspectRatio: '2.39:1',
        ref: 'Roger Deakins',
        description: '极高空俯瞰，蓝绿色织物铺在大地，银汞湖泊散落。镜头以"呼吸"节奏下降，草浪bioluminescent cyan边缘闪烁',
        mood: '宁静、生育力、自然的呼吸'
      },
      characterEntrance: {
        technique: 'bioluminescent_drift + twin_sun_tracking',
        name: '草浪浮现',
        duration: '6-8s',
        lens: '35mm',
        description: '角色从及腰深草丛中"浮现"，草原像"分娩"人物，孢子水母提供粉金色填充光',
        mood: '从大地中来、自然的子嗣'
      },
      spectacle: {
        technique: 'obsidian_reflection_reveal',
        name: '银汞镜界',
        duration: '10-15s',
        lens: '35mm',
        description: '银汞湖泊完美镜面反射，双星天空被液态金属扭曲成超现实主义，倾斜过渡真实天空',
        mood: '现实与梦境的边界'
      },
      transition: {
        technique: 'bioluminescent_drift',
        name: '孢子漂流',
        duration: '8-12s',
        description: '跟随孢子水母漂移——草丛→湖面→丘陵，粉金色内部器官提供移动填充光',
        mood: '轻盈、漂浮'
      },
      climax: {
        technique: 'azure_variation_native',
        name: '蓝绿变奏',
        duration: '8-12s',
        lens: '35mm',
        description: '草原色彩从蓝绿(#20B2AA)向金绿(#9ACD32)渐变，孢子水母群同步变色粉金→白金',
        mood: '生命的接纳、与自然的共振'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '孢子水母共舞微距',
        duration: '5-8s',
        lens: '微距',
        description: '进入孢子水母半透明体内，内部器官如精致灯笼发光，触手末端释放微小发光孢子',
        mood: '微观宇宙的优雅'
      }
    },
    
    variants: {
      temple: 'Temple of Nine Tails — monumental structure grown from living crystal and bioluminescent coral, nine spires shaped like fox tails reaching toward twin moons',
      dusk: 'Spirit Plain at Hour of Merging — two suns set simultaneously on opposite horizons, entire grassland transitioning from blue-green to molten gold, bioluminescence awakening in waves'
    }
  },
  
  // 场景四：幽冥地下海 — 地下发光海洋
  subterranean_styx: {
    id: 'S04',
    name: '幽冥地下海 · The Subterranean Styx',
    mythReference: '幽都、黄泉 — 地下液态海洋世界',
    geography: 'Cathedral-scale subterranean ocean beneath planetary crust',
    
    visual: {
      space: 'Cathedral-scale caverns with domed ceilings kilometers high',
      light: 'Three sources: geothermal fissures (molten orange-red), phosphorescent minerals (electric blue-violet), bioluminescent microorganisms (milk-azure)',
      water: 'Underground sea transitioning from milky white near shore to deep azure in depths',
      wonder: '"Soul Threads" hanging from ceiling like inverted aurora — giant fungal filaments meters in diameter emitting pale-blue bioluminescence'
    },
    
    lighting: {
      key: 'Magma orange-red from below',
      fill: 'Mineral electric-blue from walls',
      accent: 'Bioluminescent milk-azure from water + fungal pale-blue from ceiling'
    },
    
    colorPalette: ['Deep cave black', 'Magma orange', 'Mineral electric blue', 'Fungal pale-blue', 'Sea-milk white', 'Bioluminescent azure'],
    mood: 'Sacred mystery, womb of the planet, boundary between life and death, primordial cathedral',
    lens: '24mm wide angle, low camera near water surface, Emmanuel Lubezki-inspired long-take',
    
    seedPrompt: `Subterranean Styx — cathedral-scale subterranean ocean beneath planet crust. Immense caverns with domed ceilings kilometers high. Illumination from geothermal fissures glowing molten orange-red, phosphorescent mineral deposits in electric blue-violet, and trillions of bioluminescent microorganisms making sea glow from within. Colossal "Soul Threads" hang from ceiling like inverted aurora — giant fungal filaments emitting ethereal pale-blue bioluminescence.`,
    
    // 🎬 S04 幽冥地下海 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'light_vein_tunnel + atmospheric_push_pull',
        name: '降入幽冥',
        duration: '15-20s',
        lens: '24mm wide angle',
        aspectRatio: '2.39:1',
        ref: 'Emmanuel Lubezki',
        description: '从地热裂隙垂直向下，裂隙壁从正常岩石→发光矿物→菌丝网络，色彩：橙红→蓝紫→青白',
        mood: '从人间堕入冥界'
      },
      characterEntrance: {
        technique: 'obsidian_reflection_reveal + bioluminescent_drift',
        name: '灵魂丝线揭示',
        duration: '8-10s',
        lens: '24mm',
        description: '角色被"灵魂丝线"部分遮蔽，pale blue光芒在面部投下精细阴影，从丝线缝隙"窥视"',
        mood: '冥界的居民、被死亡温柔包裹'
      },
      spectacle: {
        technique: 'dome_gaze_native',
        name: '穹顶仰望',
        duration: '18-25s',
        lens: '24mm',
        description: '180度上摇——水面反射→三光源交织→穹顶→灵魂丝线倒悬森林→后仰至水面出现在顶部',
        mood: '地质大教堂、颠倒的世界'
      },
      transition: {
        technique: 'light_vein_tunnel',
        name: '灵魂丝线穿梭',
        duration: '6-10s',
        description: '沿两根灵魂丝线之间缝隙穿梭，pale blue光芒形成"光廊"，缝隙变窄变宽如在生物发光血管中旅行',
        mood: '在生命的织物中穿行'
      },
      climax: {
        technique: 'spectral_judgment_native',
        name: '光谱审判',
        duration: '10-14s',
        lens: '24mm',
        description: '三光源汇聚头顶形成"审判之光"，角色被分解成RGB三通道虚影代表不同选择，最终合并',
        mood: '命运的抉择、三重可能性'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '灵魂丝线共生微距',
        duration: '5-8s',
        lens: '微距',
        description: '沿灵魂丝线表面滑动，半透明丝绸质地，内部菌丝网络如发光电路脉动，丝线从岩石裂缝中"生长"',
        mood: '地质与生命的共生'
      }
    },
    
    variants: {
      waterfall: 'Massive underground waterfall of glowing milky-blue water plunging from unseen height, illuminated from behind by wall of magma, curtain of steam catching all underground spectrum colors',
      forest: 'Soul Thread Forest — camera drifting upward through dense cluster of hanging fungal filaments looking down at underground sea far below, threads creating natural cathedral nave of bioluminescent columns'
    }
  },
  
  // 场景五：汤谷扶桑 — 陨石撞击盆地
  solar_cradle: {
    id: 'S05',
    name: '汤谷扶桑 · The Solar Cradle of Fusang',
    mythReference: '汤谷上有扶桑，十日所浴，在黑齿北',
    geography: '800km asteroid impact basin facing primary star, perpetual golden-hour atmosphere',
    
    visual: {
      basin: 'Circular impact crater with concentric geological rings like tree growth rings, rust-red to deep amber',
      fusang: '3,000-meter colossal structure of interwoven silicon-based crystal columns resembling upward-reaching tree with millions of branches',
      mist: 'Perpetual geothermal mist rising from crater floor, mixing with spores creating eternal golden-hour',
      sky: 'Multiple concentric sundogs, halos, sun pillars from ice crystals and spore particles refracting binary starlight'
    },
    
    lighting: {
      key: 'Intensified binary starlight refracted through crystal',
      fill: 'Golden mist diffusion',
      accent: 'Geometric shadow patterns + internal crystal glow amplification'
    },
    
    colorPalette: ['Solar gold', 'Crystal white', 'Terracotta', 'Rust amber', 'Misty champagne', 'Starlight prismatic refractions'],
    mood: 'Sacred dawn that never ends, birthplace of light and time, architectural wonder of nature, spiritual awakening',
    lens: '16mm ultra-wide aerial establishing shot descending toward Fusang, Godfrey Reggio time-lapse motion feeling',
    
    seedPrompt: `Solar Cradle of Fusang — immense 800km asteroid impact basin facing primary star. Crater walls show concentric geological rings colored rust-red to deep amber. Central "Fusang" — 3,000-meter structure of interwoven silicon-based crystal columns grown by ancient crystalline lifeform, resembling upward-reaching tree with millions of branches. Each crystal branch refracts and amplifies sunlight glowing gold-white within. Perpetual geothermal mist creating eternal golden-hour atmosphere. Sky displays multiple sundogs, halos, sun pillars from binary starlight refraction.`,
    
    // 🎬 S05 汤谷扶桑 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'twin_sun_tracking + obsidian_reflection_reveal',
        name: '永恒黎明',
        duration: '12-18s',
        lens: '16mm ultra-wide aerial',
        aspectRatio: 'IMAX 1.43:1',
        ref: 'Godfrey Reggio',
        description: '盆地边缘"地质年轮"推进+上摇，扶桑晶体枝干从环形中心"生长"，多重日华不断折射变化',
        mood: '时间的凝固、永恒的黎明'
      },
      characterEntrance: {
        technique: 'twin_sun_tracking + crystal_caustic_detail',
        name: '光之洗礼',
        duration: '8-12s',
        lens: '16mm',
        description: '角色从扶桑晶体枝干间走出，晶体如棱镜分解双星光为彩虹投射身上，移动改变折射角度',
        mood: '光的选民、折射的祝福'
      },
      spectacle: {
        technique: 'light_vein_tunnel + crystal_orbit',
        name: '扶桑内部',
        duration: '20-30s',
        lens: '16mm',
        description: '进入扶桑内部晶体通道，螺旋上升+环绕旋转，通道壁光线轨迹如DNA双螺旋，从树顶穿出俯瞰盆地',
        mood: '时间的水晶、百万年的循环'
      },
      transition: {
        technique: 'crystal_orbit',
        name: '日华穿越',
        duration: '8-12s',
        description: '沿日华光柱缓慢环绕上升，冰晶和孢子粒子逐一捕捉，光柱"墙壁"如彩虹砖块砌成',
        mood: '穿越光的建筑'
      },
      climax: {
        technique: 'astronomical_alignment_native',
        name: '十日同辉',
        duration: '12-18s',
        lens: '16mm',
        description: '双星+八颗卫星排列形成"十日同辉"，扶桑每根枝干折射不同天体光芒，角色成为"第十一日"',
        mood: '宇宙级启示、天体合唱'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '晶体生命共鸣微距',
        duration: '6-10s',
        lens: '微距',
        description: '聚焦扶桑晶体枝干内部硅基生命"生长纹"，光在特定平面间来回反射形成"光腔"，共振频率改变发出"歌声"',
        mood: '晶体的歌唱'
      }
    },
    
    variants: {
      tenSuns: 'Rare astronomical alignment creating illusion of ten suns in sky above Fusang, each at different position and intensity, entire basin flooded with impossibly golden light',
      interior: 'Within Fusang — interior labyrinth of cathedral-sized chambers where light from primary star trapped and circulating for millions of years, creating solid-looking beams of liquid light'
    }
  },
  
  // 场景六：昆仑悬境 — 悬浮大陆
  kunlun_sky: {
    id: 'S06',
    name: '昆仑悬境 · The Kunlun Sky-Continent',
    mythReference: '海内昆仑之墟，在西北，帝之下都',
    geography: 'Australia-sized continent levitating 15km above surface via superconducting mineral veins',
    
    visual: {
      continent: 'Exposed underside revealing glowing electric-blue superconductor pathways pulsing with magnetic energy',
      waterfalls: '15km-high "Celestial Waterfalls" atomizing into prismatic rainbow clouds before reaching ground',
      forest: 'Impossibly tall trees reaching 500 meters with crimson-violet foliage, canopies extending into vacuum edge',
      horizon: 'Double-horizon spectacle: continent\'s own curvature below, true planetary surface with glowing ocean far beneath'
    },
    
    lighting: {
      key: 'Direct binary starlight above',
      fill: 'Magnetic-energy blue glow from below',
      accent: 'Prismatic refraction from waterfall mists + crimson-violet forest canopy'
    },
    
    colorPalette: ['Superconductor electric blue', 'Crimson forest', 'Violet canopy', 'Prismatic rainbow mist', 'Deep space black', 'Cloud white', 'Ocean teal'],
    mood: 'Defiance of natural law, realm of gods and immortals, vertigo-inducing scale, awe at impossible made real',
    lens: '21mm wide-angle from forest edge looking over void, Christopher Nolan Interstellar cosmic scale',
    
    seedPrompt: `Kunlun Sky-Continent — Australia-sized landmass levitating 15km above planetary surface. Underbelly reveals network of glowing electric-blue superconductor pathways pulsing magnetic energy. Rivers plunge as 15km-high "Celestial Waterfalls" atomizing into prismatic rainbow clouds. Upper surface features impossibly tall 500-meter trees with crimson-violet foliage extending into vacuum edge. Double-horizon spectacle: continent curvature below, true planetary surface with glowing ocean far beneath.`,
    
    // 🎬 S06 昆仑悬境 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'atmospheric_push_pull + crystal_orbit',
        name: '双重地平线',
        duration: '15-20s',
        lens: '21mm wide-angle',
        aspectRatio: '2.39:1',
        ref: 'Christopher Nolan',
        description: '从大陆底面超导矿脉开始，"翻"过大陆边缘露出15km瀑布，再到深红紫森林冠层，双地平线奇观',
        mood: '法则的悖反、双重世界的眩晕'
      },
      characterEntrance: {
        technique: 'twin_sun_tracking + atmospheric_push_pull',
        name: '悬空边缘',
        duration: '10-14s',
        lens: '21mm',
        description: '角色站在大陆边缘，15km虚空脚下瀑布水雾彩虹云，双星逆光+超导矿脉electric blue底部填充光',
        mood: '站在世界边缘'
      },
      spectacle: {
        technique: 'crystal_orbit + crystal_caustic_detail',
        name: '天瀑钻石',
        duration: '18-25s',
        lens: '21mm',
        description: '跟随瀑布一滴水坠落，双星光照射如钻石闪烁，环绕水滴旋转(失重视角)，背景15km尺度后退',
        mood: '微观的宏大'
      },
      transition: {
        technique: 'light_vein_tunnel',
        name: '超导脉管滑行',
        duration: '8-12s',
        description: '沿大陆底面超导矿脉"滑行"，磁能流动如液态光脉动，在分叉处选择路径如在发光神经网络中导航',
        mood: '在星球神经系统中穿行'
      },
      climax: {
        technique: 'gravity_liberation_native',
        name: '失重裂变',
        duration: '12-18s',
        lens: '21mm',
        description: '超导矿脉达到共振频率，角色"浮起"被磁场托举到真空边缘，环绕旋转背景在双地平线间切换',
        mood: '物理法则的臣服、自由飞翔'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '深红森林冠层微距',
        duration: '6-10s',
        lens: '微距',
        description: '森林冠层边缘，深红紫叶片在真空与大气层交界，边缘有生物发光金色描边，进入真空后激活成发光体',
        mood: '生命适应真空'
      }
    },
    
    variants: {
      falls: 'Close-up aerial shot following river as it reaches continental edge and transforms into 15km vertical waterfall, water breaking into individual droplets catching binary starlight like curtain of diamonds',
      groundView: 'Ground-level view from planetary surface 15km below looking straight up at continent overhead, superconductor veins creating second star-pattern in sky, waterfalls appearing as misty columns connecting heaven and earth'
    }
  },
  
  // 场景七：涿鹿战场 — 龟裂平原
  plain_zhulu: {
    id: 'S07',
    name: '涿鹿战场 · The Plain of Zhulu',
    mythReference: '蚩尤作兵伐黄帝，黄帝乃令应龙攻之冀州之野',
    geography: 'Vast tectonically active plain, tidal locking zone from dual moons creating constant geological tension',
    
    visual: {
      ground: 'Cracked chessboard of massive fissures emitting different colored geothermal light — orange, blue, green',
      sky: 'Permanent electromagnetic storm, lightning in aurora-like spectra of pink-violet-cyan',
      wonder: 'Fissures forming geometric patterns, some actively "healing" with new-growth glowing rock veins',
      ruins: '"Tombs of Weaponmaster" — colossal black monolithic structures of impossible geometry suggesting ancient intelligence'
    },
    
    lighting: {
      key: 'Multi-colored geothermal fissure light from below',
      fill: 'Electromagnetic lightning from above',
      accent: 'Healing-vein bioluminescence + monolith gravity-lens distortion'
    },
    
    colorPalette: ['Fissure orange', 'Copper blue', 'Sulfur green', 'Lightning pink-violet', 'Monolith void-black', 'Healing-vein white-gold', 'Storm cloud charcoal'],
    mood: 'Perpetual war between geological forces, sacred battlefield of gods, uneasy truce, power so vast it has become landscape',
    lens: '28mm low-angle across cracked plain emphasizing chessboard pattern, Ridley Scott Prometheus composition',
    
    seedPrompt: `Plain of Zhulu — vast tectonically active plain where gravitational forces from dual moons create constant geological tension. Ground is cracked chessboard of massive fissures each emitting different colored geothermal light — molten orange, electric blue, toxic green. Permanent electromagnetic storm with lightning in aurora-like spectra of pink-violet-cyan. Some fissures actively "healing" with visible new-growth glowing rock veins. Colossal black monolithic "Tombs of Weaponmaster" structures suggesting ancient intelligent design.`,
    
    // 🎬 S07 涿鹿战场 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'atmospheric_push_pull + geothermal_bloom',
        name: '战争棋盘',
        duration: '12-18s',
        lens: '28mm low-angle',
        aspectRatio: '2.39:1',
        ref: 'Ridley Scott',
        description: '极高空垂直俯瞰，龟裂平原如巨大棋盘，电磁风暴云层投下移动阴影如手移动棋子，45度角下降',
        mood: '战略的神圣、大地的战争'
      },
      characterEntrance: {
        technique: 'geothermal_bloom + twin_sun_tracking',
        name: '裂隙浮现',
        duration: '8-10s',
        lens: '28mm',
        description: '角色从地热裂隙中"升起"，裂隙光芒提供底部轮廓光(under-light)，恐怖/神圣双重氛围',
        mood: '从大地深处归来'
      },
      spectacle: {
        technique: 'obsidian_reflection_reveal + geothermal_bloom',
        name: '武器大师墓',
        duration: '15-22s',
        lens: '28mm',
        description: '黑曜石表面反射地热光芒形成扭曲彩色倒影，绕墓旋转呈现不同"面孔"：武器/人脸/星图',
        mood: '古代智慧的谜团'
      },
      transition: {
        technique: 'lightning_tunnel_native',
        name: '闪电隧道',
        duration: '6-10s',
        description: '沿持续闪电光束"飞行"，粉紫色光芒形成"墙壁"，终点是另一道裂隙',
        mood: '在雷电中穿行'
      },
      climax: {
        technique: 'gravitational_tide_native',
        name: '引力潮汐',
        duration: '12-18s',
        lens: '28mm',
        description: '双月在opposite horizons对齐，平原"呼吸"起伏，裂隙光芒随潮汐节律脉动，角色站在引力零点',
        mood: '天体级对抗'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '裂隙共生体微距',
        duration: '5-8s',
        lens: '微距',
        description: '聚焦"愈合"裂隙，白色-金色愈合纹路如地质伤疤发光，微小地热爱好者生物爬行以地热能量为食',
        mood: '地质的愈合、生命的韧性'
      }
    },
    
    variants: {
      convergence: 'Moment when both moons align on opposite horizons, gravitational war visible as entire plain begins to ripple like water, fissures opening and closing in waves, monoliths humming with activated energy',
      healing: 'Time-lapse aesthetic showing fissures slowly stitching shut over centuries compressed to seconds, glowing veins of new rock growing like accelerated biology'
    }
  },
  
  // 场景八：蓬莱迷雾 — 悬浮岛群
  archipelago_penglai: {
    id: 'S08',
    name: '蓬莱迷雾 · The Archipelago of Penglai',
    mythReference: '蓬莱、方丈、瀛洲三神山',
    geography: 'Polar ocean volcanic islands floating on supercritical CO2 and bioluminescent microorganism "liquid atmosphere"',
    
    visual: {
      islands: 'Conical volcanic islands covered in deep crimson and black bioluminescent fern forests',
      support: 'Islands float on supercritical fluid "sea" — density between gas and liquid, liquid-metal flow quality',
      bridges: 'Natural "Rainbow Bridges" — colossal crystal arches spanning between islands refracting polar light into spectral rainbows',
      atmosphere: 'Polar long twilight, dual stars at extreme low angle, infinite-length shadows, sky as luminous canvas'
    },
    
    lighting: {
      key: 'Extreme low-angle binary star polar light',
      fill: 'Internal bioluminescence from crimson ferns',
      accent: 'Spectral rainbow refraction from crystal bridges + liquid-metal reflection from supercritical sea'
    },
    
    colorPalette: ['Polar crimson', 'Black-fern deep red', 'Liquid mercury silver', 'Bioluminescent gold-teal', 'Spectral rainbow refraction', 'Infinite-shadow purple', 'Horizon-fire orange-gold'],
    mood: 'Edge of known world, islands between realities, where laws of nature become suggestions, transcendent beauty',
    lens: '50mm anamorphic compressed depth emphasizing crystal bridges, Makoto Shinkai sky detail + Denis Villeneuve otherworldliness',
    
    seedPrompt: `Archipelago of Penglai — chain of volcanic islands in polar ocean floating on sea of supercritical carbon dioxide mixed with bioluminescent microorganisms, creating liquid-metal-like fluid with impossible reflective properties. Conical islands covered in deep crimson and black bioluminescent fern forests adapted to acidic atmosphere. Natural "Rainbow Bridges" — colossal crystal arches refracting polar light into spectral rainbows bridging floating landmasses. Polar lighting creates infinite-length shadows, sky itself a luminous canvas.`,
    
    // 🎬 S08 蓬莱迷雾 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'atmospheric_push_pull + obsidian_reflection_reveal',
        name: '迷雾揭幕',
        duration: '12-18s',
        lens: '50mm anamorphic',
        aspectRatio: '2.39:1',
        ref: 'Makoto Shinkai + Denis Villeneuve',
        description: '从超临界"海"液态金属表面开始，"上浮"穿过超临界与大气界面(可见折射扭曲)，迷雾中岛屿从扭曲中"凝结"',
        mood: '现实与梦境的交界'
      },
      characterEntrance: {
        technique: 'crystal_orbit + twin_sun_tracking',
        name: '彩虹桥行走',
        duration: '10-14s',
        lens: '50mm',
        description: '角色行走在水晶彩虹桥上，晶体折射双星光形成个人专属"彩虹光环"(halo)，POV→第三人称环绕',
        mood: '行走在光之上'
      },
      spectacle: {
        technique: 'bioluminescent_drift + crystal_caustic_detail',
        name: '超临界海面',
        duration: '15-20s',
        lens: '50mm',
        description: '超临界海面上方10cm"滑行"，密度介于气液之间，表面有液态金属质感但无表面张力，密度波纹如呼吸',
        mood: '物质的第三种状态'
      },
      transition: {
        technique: 'light_vein_tunnel',
        name: '蕨类森林穿梭',
        duration: '8-12s',
        description: '深红蕨类森林冠层下方穿梭，蕨叶生物发光纹理如血管脉动，孢子释放形成金色雾',
        mood: '在植物的血管中穿行'
      },
      climax: {
        technique: 'polar_baptism_native',
        name: '极光洗礼',
        duration: '12-18s',
        lens: '50mm',
        description: '极光强度峰值从天空"倾泻"淹没角色和岛屿，彩虹桥共振发出音符(视觉化声波)，角色被光"穿透"',
        mood: '光的淹没'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '孢子释放微距',
        duration: '6-10s',
        lens: '微距',
        description: '聚焦蕨类孢子囊爆裂释放金色孢子，跟随一颗孢子：弹射→上升气流托举→落回另一蕨叶完成循环',
        mood: '生命的循环'
      }
    },
    
    variants: {
      bridgeTop: 'First-person view walking across crystal arch connecting two islands, looking down at supercritical sea flowing like liquid starlight hundreds of meters below, bridge refracting light to create personal rainbow halo',
      veil: 'Archipelago shrouded in dense polar fog, only glowing tips of volcanic peaks and bioluminescent fern forests visible, crystal bridges appearing as ghostly arcs of light in mist, supercritical sea glowing from below like second sky'
    }
  },
  
  // 场景九：星门祭坛 — 磁北极能量核心
  astrop_nexus: {
    id: 'S09',
    name: '星门祭坛 · The Astrop Gate Nexus',
    mythReference: 'Nirath最神秘地点 — 星球能量系统心脏',
    geography: 'Ancient monument at magnetic north pole, twelve 800m crystal pillars + central plasma sphere',
    
    visual: {
      pillars: 'Twelve 800-meter superconducting crystal pillars, each different spectral color (red through violet + ultraviolet/infrared), astronomical alignment with constellations',
      core: 'Perpetual sphere of compressed plasma in liquid-light state — morphing with fluid dynamics, colors cycling cool blue to hot white to deep crimson',
      connections: 'Visible energy beams connecting pillars in complex sacred geometry, luminous strings against extreme aurora backdrop',
      ground: 'Pearl-translucent dry ice (CO2 frost) catching and diffusing all colored light, landscape glowing from within'
    },
    
    lighting: {
      key: 'Plasma sphere omnidirectional light',
      fill: 'Multi-color pillar emission + extreme aurora sky',
      accent: 'Ground subsurface scattering from dry ice + energy beam luminous connections'
    },
    
    colorPalette: ['Full spectrum pillar colors', 'Plasma white-blue-crimson cycle', 'Pearl dry ice', 'Aurora green-violet', 'Energy beam gold', 'CO2 frost subsurface rainbow'],
    mood: 'Center of everything, axis mundi, where cosmic energy enters world, reverence, sacred geometry made physical, spiritual technology',
    lens: '14mm extreme wide-angle from ground looking up at circle of pillars, forced perspective like cathedral of energy, Kubrick 2001 monolith aesthetic meets Cameron bioluminescence',
    
    seedPrompt: `Astrop Gate Nexus at Nirath magnetic north pole — ancient monumental structure of twelve 800-meter superconducting crystal pillars each different spectral color arranged in astronomical alignment with constellations. Center floats perpetual sphere of compressed plasma in liquid-light state morphing with fluid dynamics beauty. Visible energy beams connect pillars in complex sacred geometry against extreme aurora borealis backdrop. Ground covered in pearl-translucent dry ice catching and diffusing all colored light.`,
    
    // 🎬 S09 星门祭坛 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'crystal_orbit + twin_sun_tracking',
        name: '神圣几何',
        duration: '15-22s',
        lens: '14mm extreme wide-angle',
        aspectRatio: 'IMAX 1.43:1',
        ref: 'Stanley Kubrick',
        description: '高空俯瞰十二根晶体柱完整排列形成神圣几何图案，外围下降旋转，每经一柱光谱变色，降至地面看向等离子球',
        mood: '神圣的几何、宇宙的秩序'
      },
      characterEntrance: {
        technique: 'light_vein_tunnel + twin_sun_tracking',
        name: '能量走廊',
        duration: '10-14s',
        lens: '14mm',
        description: '角色从两根晶体柱之间"能量走廊"走出，能量束形成光墙有sacred geometry图案，随步伐脉动',
        mood: '能量的选民、走向核心'
      },
      spectacle: {
        technique: 'crystal_orbit + crystal_caustic_detail',
        name: '等离子核心',
        duration: '20-30s',
        lens: '14mm',
        description: '环绕等离子球旋转，压缩等离子液态光状态如流体动力学雕塑，颜色循环cool blue→hot white→deep crimson',
        mood: '宇宙的心脏'
      },
      transition: {
        technique: 'crystal_orbit',
        name: '星座对齐',
        duration: '10-15s',
        description: '镜头从地面升起穿过柱阵能量束网络，能量束形成"星图"视觉效果，升至柱顶看到能量束与真实星座连接',
        mood: '天地之间的通道'
      },
      climax: {
        technique: 'plasma_expansion_native',
        name: '等离子膨胀',
        duration: '15-20s',
        lens: '14mm',
        description: '等离子球膨胀填满柱阵空间，颜色加速循环至white-hot，能量束实体化为光"墙壁"，角色成为星门"钥匙"',
        mood: '宇宙级开启'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '晶体柱生长微距',
        duration: '6-10s',
        lens: '微距',
        description: '聚焦晶体柱"生长纹"如树木年轮，每层对应不同地质年代和能量周期，能量爆发留下的"疤痕"如frozen lightning',
        mood: '时间的晶体'
      }
    },
    
    variants: {
      activation: 'Nexus at full power, plasma sphere expanding to fill space between pillars, energy beams intensifying to solid-looking walls of light, dry ice ground vaporizing to create floor of glowing mist, aurora responding with synchronized pulses',
      alignment: 'Rare stellar conjunction where constellations above exactly match pillar positions on ground, creating vertical column of corresponding stars and pillars with plasma sphere as junction point between sky and earth'
    }
  },
  
  // 场景十：盘古之脊 — 超级山脉系统
  spine_pangu: {
    id: 'S10',
    name: '盘古之脊 · The Spine of Pangu',
    mythReference: '盘古开天辟地，阳清为天，阴浊为地',
    geography: 'Super-mountain system spanning pole to pole, planet\'s first-formed landmass, glowing scar across planetary surface',
    
    visual: {
      mountains: 'Glassy obsidian-basalt formations from planet cooling phase, semi-transparent and refractive, glowing interior visible through translucent black rock',
      rift: 'Continental-scale "Pangu Rift" reaching to mantle, revealing slow internal convection — pulsing dark crimson glow like heartbeat visible from orbit',
      scale: 'Individual peaks dwarf Everest, yet from distance range appears as delicate line — paradox of scale',
      sky: 'Atmospheric vortex cloud patterns driven by thermal energy from rift, rhythmic breathing-like spirals'
    },
    
    lighting: {
      key: 'Internal mantle crimson glow from rift',
      fill: 'Bioluminescent cyan-gold surface tracing',
      accent: 'Binary star top-light + atmospheric vortex cloud diffusion + obsidian subsurface refraction'
    },
    
    colorPalette: ['Obsidian glass black', 'Mantle crimson pulse', 'Bioluminescent cyan-gold', 'Vortex cloud white-grey', 'Atmospheric blue edge', 'Internal orange-red glow diffusion'],
    mood: 'Backbone of a world, primordial origin, geological eternity, where planet first became solid, sacred geography',
    lens: 'Two-shot composite: orbital view showing full Spine as glowing line across planet curvature + ground-level view from rift edge looking into mantle depth',
    
    seedPrompt: `Spine of Pangu — super-mountain system spanning pole to pole, planet first-formed landmass visible from space as glowing scar across surface. Mountains are glassy obsidian-basalt formations from cooling phase, semi-transparent and refractive allowing glimpses of glowing interior. Central "Pangu Rift" is continental-scale chasm reaching to mantle revealing slow internal convection pulsing dark crimson glow like heartbeat visible from orbit. Bioluminescent organisms colonize warm obsidian surfaces tracing contours with cyan-gold luminescent veins.`,
    
    // 🎬 S10 盘古之脊 · 电影运镜语法
    cinematography: {
      opening: {
        technique: 'atmospheric_push_pull + twin_sun_tracking',
        name: '世界之脊',
        duration: '18-25s',
        lens: '双尺度合成',
        aspectRatio: '双画幅',
        ref: 'James Cameron',
        description: '双尺度合成：轨道远景盘古之脊如发光伤疤横跨星球曲面→自由落体冲向地表→裂谷边缘停止切换人类视角',
        mood: '从宇宙到个体、坠落到起源'
      },
      characterEntrance: {
        technique: 'twin_sun_tracking + atmospheric_push_pull',
        name: '裂谷边缘',
        duration: '10-15s',
        lens: '双尺度',
        description: '角色站在盘古裂谷边缘，100km宽度对面rim在地平线发光，地幔暗红色从下方勾勒，双星从上方轮廓',
        mood: '站在星球的伤口边缘'
      },
      spectacle: {
        technique: 'time_lapse_heartbeat_native',
        name: '地幔心跳',
        duration: '20-30s',
        lens: '双尺度',
        description: '画面分上下：上半实时角色站裂谷边缘，下半时间压缩地幔脉搏(centuries→seconds)，脉动频率与呼吸同步',
        mood: '星球的心跳'
      },
      transition: {
        technique: 'obsidian_reflection_reveal + bioluminescent_drift',
        name: '黑曜石镜面滑行',
        duration: '10-15s',
        description: '盘古之脊黑曜石表面"滑行"，玻璃质表面反射双星和天空，cyan-gold纹理脉动，偶尔可见内部橙色glow',
        mood: '在星球镜面上滑行'
      },
      climax: {
        technique: 'mantle_pulse_pierce_native',
        name: '地幔脉冲击穿',
        duration: '15-22s',
        lens: '双尺度',
        description: '地幔光芒从裂谷底部"射出"连接地心和天空，穿过角色身体将silhouette投射到大气层形成巨大"光人"',
        mood: '成为星球、个体即宇宙'
      },
      speciesInteraction: {
        technique: 'crystal_caustic_detail',
        name: '生物发光苔藓微距',
        duration: '6-10s',
        lens: '微距',
        description: '温暖黑曜石表面生物发光苔藓colony如发光地图覆盖岩石，图案对应地热流动路径，跟随"光河"汇聚成"湖泊"',
        mood: '地质之上的生命'
      }
    },
    
    variants: {
      heartbeat: 'Time-lapse from orbit showing Pangu Rift pulsing with mantle light in slow rhythmic cycle, glow propagating along entire Spine like wave, atmospheric vortex clouds pulsing in synchronization',
      edge: 'Human-scale perspective standing at rim of Pangu Rift looking across chasm to opposite rim 100 kilometers away, depth below descending into glowing crimson darkness, obsidian glass surfaces reflecting binary starlight like mirror'
    }
  }
};

// ========== 角色种族纹理系统（Nirath原生生物） ==========
const NIRATH_CREATURES = {
  // 人类 — 默认中国人/East Asian（保留小G设定）
  human_child: {
    base: `Chinese 8-year-old boy named XiaoG, straight black hair dark brown almond eyes yellow skin round-square face East Asian features, NOT Caucasian NOT Western`,
    clothing: `Traditional Chinese children's clothing frog-button top cloth shoes`,
    behavior: `Curious innocent lively playful, tilting head crouching down reaching out pointing finger spinning around small running steps sitting on ground gesturing explaining`,
    texture: `Natural skin texture hyper-detailed pores definitely Chinese appearance`
  },
  
  // Nirath原生生物 — 光噬浮游生物（取代传统异兽）
  photophage: {
    base: `Nirath native photophage creature, bioluminescent organism evolved to feed on dual-starlight and geothermal energy`,
    forms: {
      sporeJelly: `Translucent air-buoyant organism meters in diameter, ribbon-like tentacles trailing, internal organs glowing pink-gold gradients`,
      soulThread: `Giant fungal filament meters in diameter hanging from cavern ceilings, emitting ethereal pale-blue bioluminescence like inverted aurora`,
      wavePhage: `Microscopic trillions in ocean water, emitting deep cyan-emerald bioluminescence with every wave crest`
    }
  },
  
  // Nirath地质生命 — 晶体构造体
  crystalEntity: {
    base: `Ancient silicon-based crystalline lifeform, grown over millions of years, interwoven crystal columns forming monumental structures`,
    examples: {
      fusang: `3,000-meter structure of interwoven silicon-based crystal columns resembling upward-reaching tree, each branch refracts and amplifies sunlight glowing from within`,
      nexusPillar: `800-meter superconducting crystal pillar, different spectral colors, astronomical alignment with constellations`
    }
  }
};

// ========== 导出模块 ==========
module.exports = {
  NIRATH_PLANET,
  NIRATH_AESTHETIC,
  NIRATH_RENDER,
  NIRATH_SCENES,
  NIRATH_CREATURES,
  
  // 便捷函数：获取场景种子提示词
  getSceneSeed: (sceneId) => {
    const scene = NIRATH_SCENES[sceneId];
    return scene ? scene.seedPrompt : null;
  },
  
  // 便捷函数：获取场景变体
  getSceneVariant: (sceneId, variantKey) => {
    const scene = NIRATH_SCENES[sceneId];
    return scene && scene.variants ? scene.variants[variantKey] : null;
  },
  
  // 便捷函数：获取完整提示词（种子 + 变体）
  buildFullPrompt: (sceneId, variantKey = null) => {
    const scene = NIRATH_SCENES[sceneId];
    if (!scene) return null;
    
    let prompt = scene.seedPrompt;
    if (variantKey && scene.variants[variantKey]) {
      prompt += ` ${scene.variants[variantKey]}`;
    }
    return prompt;
  },
  
  // 便捷函数：获取色彩系统
  getColorPalette: (sceneId) => {
    const scene = NIRATH_SCENES[sceneId];
    return scene ? scene.colorPalette : null;
  }
};