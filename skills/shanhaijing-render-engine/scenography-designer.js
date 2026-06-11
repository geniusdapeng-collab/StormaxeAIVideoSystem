#!/usr/bin/env node
/**
 * ============================================================
 * ShanhaiStory Forge | Scenography Designer v1.0-Peng
 * 美术布景设计师 / 舞台美术引擎
 * ============================================================
 * 
 * 定位：主链路增强模块，非阻断性插入
 * 职责：为每个镜头设计完整的场景背景美术——地形、大气、植被、水体、光影、纹理
 * 目标：像舞台美术师一样，为每一帧设计细腻、有质感的背景环境
 * 
 * 插入位置：渲染引擎 generateShotPrompt() 的 mandatoryDimensions 构建之前
 * 输出：环境描述片段（双语），被注入到 Prompt 的场景描述维度
 * 
 * 设计哲学：
 * - 场景不是"背景板"，是叙事的一部分
 * - 每一帧的背景都在讲故事——通过光线、色调、纹理暗示情绪
 * - Nirath世界观不是装饰，是场景设计的底层逻辑
 * 
 * 版本: v1.0-Peng
 * 作者: 小G
 * 创建: 2026-05-27
 */

const fs = require('fs');
const path = require('path');

const SCENOGRAPHY_VERSION = 'v1.1-Peng';

// ============================================================
// Nirath 场景美术档案库
// 每个场景定义包含：地形、大气、生态、光影、质感五维描述
// ============================================================

const NIRATH_SCENE_ARCHIVE = {
  // ---------- S01: 浮空晶簇山脉 ----------
  floating_crystal_peaks: {
    name: '浮空晶簇山脉',
    sceneId: 'S01',
    
    terrain: {
      cn: '巨型六方晶簇从地壳裂缝中垂直生长，晶面折射双恒星光芒形成彩虹色散，晶簇间隙悬浮着碎石与尘埃，地面覆盖着半透明的硅质结壳，脚踩上去会发出细微的碎裂声，远处可见断裂的山脊线如巨兽脊背般起伏',
      en: 'Giant hexagonal crystal clusters vertically emerging from crustal fissures, crystal facets refracting binary starlight into prismatic dispersion, suspended debris and dust in inter-crystal gaps, ground covered with translucent siliceous crust crinkling underfoot, distant broken ridgelines undulating like beast spines'
    },
    
    atmosphere: {
      cn: '稀薄大气中漂浮着晶尘微粒，在光线照射下形成持续的丁达尔效应光柱，天空呈现深邃的紫罗兰到靛蓝色渐变，低垂的云层被双恒星染成金橙色边缘，空气中弥漫着臭氧与矿物电离后的金属气息',
      en: 'Sparse atmosphere with floating crystal dust particles creating persistent Tyndall effect light columns, sky gradient from deep violet to indigo, low-hanging clouds edged with golden-orange from binary stars, air carrying ozone and ionized mineral metallic scent'
    },
    
    ecology: {
      cn: '晶簇表面寄生着发光地衣，呈现脉动的蓝绿色呼吸节律，孢子水母在晶簇间缓慢漂浮，伞盖半透明如灯笼，根系如银色丝线垂落，微型生物在晶面形成的露水坑中形成微型生态系统',
      en: 'Luminous lichen parasitizing crystal surfaces with pulsing blue-green respiratory rhythm, spore jellyfish drifting between clusters with translucent umbrella caps like lanterns, silver-thread roots dangling, microscopic organisms forming ecosystems in crystal-face dew pools'
    },
    
    lighting: {
      cn: '主恒星（橙红色，较大）从画面左上方45度角投射暖调侧光，伴星（蓝白色，较小）从右下方提供冷调补光，双光源在晶簇棱角处形成锐利的明暗分界线，地面反射出双重色彩的光斑，阴影区域呈现紫蓝色冷调',
      en: 'Primary star (orange-red, larger) casting warm sidelight from upper-left 45 degrees, companion star (blue-white, smaller) providing cool fill from lower-right, dual light sources creating sharp chiaroscuro at crystal edges, ground reflecting dual-colored light patches, shadow areas showing purple-blue cool tones'
    },
    
    texture: {
      cn: '晶面光滑如镜面但带有自然生长纹理——螺旋状的生长纹、包裹体气泡、应力裂纹，硅质结壳呈现蜂窝状多孔结构，碎石表面有微观的撞击坑与风化剥蚀痕迹，整体质感介于天然矿物与外星地貌之间',
      en: 'Crystal faces smooth as mirrors yet bearing natural growth textures—spiral growth lines, inclusion bubbles, stress cracks, siliceous crust showing honeycomb porous structure, debris surfaces with microscopic impact craters and weathering traces, overall texture between natural mineral and alien landscape'
    },
    
    moodPalette: {
      wonder: { tone: '暖金+冷紫对比', light: '强光柱穿透晶簇' },
      tension: { tone: '暗紫+深蓝', light: '仅有伴星冷光照亮局部' },
      mystery: { tone: '靛蓝+墨绿', light: '生物发光成为主光源' }
    }
  },
  
  // ---------- S02: 流光虹脉河 ----------
  flowing_light_artery: {
    name: '流光虹脉河',
    sceneId: 'S02',
    
    terrain: {
      cn: '河床由半透明的玛瑙质岩石构成，水流并非普通液态而是高浓度的能量流体，发出虹彩光芒，河岸边堆积着被水流打磨光滑的能量结晶卵石，远处河床分叉如血管网络蔓延，地势平缓但河底有看不见的暗流漩涡',
      en: 'Riverbed composed of translucent agate-quality rock, waterflow not ordinary liquid but high-density energy fluid emitting iridescent glow, riverbanks堆积 smooth energy-crystal pebbles polished by flow, distant riverbed branching like vascular networks, terrain gentle but riverbed hiding invisible current vortices'
    },
    
    atmosphere: {
      cn: '河面蒸腾着淡金色的能量雾气，在冷空气中凝结成缓慢下沉的光尘，空气中充满低频的能量嗡鸣声，河岸植被因长期能量辐射而呈现金属光泽，远处地平线被能量辉光染成淡青色',
      en: 'Pale golden energy mist rising from river surface, condensing into slowly settling light dust in cold air, air filled with low-frequency energy hum, riverside vegetation showing metallic sheen from chronic energy radiation, distant horizon dyed pale cyan by energy glow'
    },
    
    ecology: {
      cn: '河水中游动着光脉鱼群——半透明的能量生物体，身体呈现彩虹色的光谱分层，岸边生长着吸能苔藓，叶片呈扇形并随能量波动而开合，如微型太阳能电池板，河底沉积着发光硅藻层，形成缓慢脉动的生物光毯',
      en: 'Light-vein fish schools swimming in water—semi-transparent energy organisms with rainbow spectral layering in bodies, energy-absorbing moss growing on banks with fan-shaped leaves opening/closing with energy fluctuations like miniature solar panels, riverbed沉积 glowing diatom layer forming slowly pulsating biological light carpet'
    },
    
    lighting: {
      cn: '主光源来自河面本身的能量辐射——从下方向上照亮周围一切，形成反常的底光效果，双恒星的光芒被能量雾气散射成柔和的环境光，晶石卵石将光线分解成细碎的光斑投射到岩壁上，整体照明呈现出梦幻般的非自然感',
      en: 'Primary light source from river surface energy radiation itself—illumination from below creating unnatural uplight effect, binary starlight scattered into soft ambient light by energy mist, crystal pebbles分解 light into fragmented spots projected onto rock walls, overall lighting presenting dreamlike unnatural quality'
    },
    
    texture: {
      cn: '玛瑙质河床呈现蜡状光泽与玉质温润感并存，能量流体表面有类似石油薄膜的干涉色彩纹理，卵石表面光滑如釉但带有天然冰裂纹，雾气颗粒在微距下呈现完美的六边形冰晶结构，整体质感介于液态宝石与能量场之间',
      en: 'Agate riverbed showing wax luster coexisting with jade warmth, energy fluid surface with oil-film-like interference color texture, pebble surfaces smooth as glazed ceramic but bearing natural crackle patterns, mist particles showing perfect hexagonal ice crystal structure under macro, overall texture between liquid gemstone and energy field'
    },
    
    moodPalette: {
      serenity: { tone: '青蓝+金', light: '河面柔光反射' },
      danger: { tone: '暗红+紫', light: '能量过载的刺眼光芒' },
      ethereal: { tone: '全光谱彩虹', light: '雾气中的光折射' }
    }
  },
  
  // ---------- S03: 青丘灵原 ----------
  azure_hills_spirit_plain: {
    name: '青丘灵原',
    sceneId: 'S03',
    
    terrain: {
      cn: '低矮的丘陵呈现柔和的波浪曲线，覆盖着蓝绿色的高草（类视紫红质光合作用），草叶在微风中翻涌如海浪，地面点缀着青玉色苔原地衣，形成蓝白相间的斑驳图案，低洼处积聚着银汞湖泊——液态金属镜面反射天空',
      en: 'Gentle rolling hills presenting soft wave curves, covered with blue-green tall grass (rhodopsin-like photosynthesis), grass blades surging like ocean waves in breeze, ground dotted with azure jade tundra lichen forming blue-white mottled patterns, low-lying areas accumulating silver-mercury lakes—liquid metal mirrors reflecting sky'
    },
    
    atmosphere: {
      cn: '空气中飘浮着发光孢子，在黄昏光线下如同缓慢降落的星光，草丛释放的挥发性有机化合物形成淡蓝色的低空雾气，双恒星的光芒穿过草叶间隙形成无数细碎的光斑，风声穿过高草产生类似低吟的和声',
      en: 'Luminous spores floating in air like slowly descending starlight in dusk, volatile organic compounds released by grass forming pale blue low-altitude mist, binary starlight piercing through grass gaps creating countless fragmented light spots, wind through tall grass producing harmonic tones like low chanting'
    },
    
    ecology: {
      cn: '高草中隐藏着荧光色的小型生物，受惊扰时会爆发短暂的光脉冲然后熄灭，银汞湖泊边缘生长着耐金属植物，叶片呈现镜面般的金属反射质感，天空中漂浮着巨大的孢子水母，粉金色的内部器官在半透明伞盖下缓慢搏动',
      en: 'Fluorescent small creatures hidden in tall grass erupting brief light pulses when disturbed then extinguishing, metal-resistant plants growing at silver-mercury lake edges with mirror-like metallic reflective leaf texture, giant spore jellyfish floating in sky with pink-gold internal organs slowly pulsating under translucent umbrella caps'
    },
    
    lighting: {
      cn: '双恒星处于低空位置（模拟黄昏），主恒星的橙红光将高草染成金红色，伴星的蓝白光在阴影侧形成冷色调，草叶的半透明性使光线在叶脉中散射形成内部发光效果，银汞湖面反射出完整的双色天空镜像',
      en: 'Binary stars in low position (simulating dusk), primary star orange-red dyeing tall grass golden-red, companion star blue-white creating cool tones on shadow side, grass blade translucency scattering light in veins creating internal glow effect, silver-mercury lake surface reflecting complete dual-color sky mirror image'
    },
    
    texture: {
      cn: '高草叶片呈现蜡质光泽与丝绒触感并存，表面有微观的脊状纹理引导露水滑落，青玉地衣呈鳞片状紧密贴附地面，触感如抛光玉石般冰凉滑腻，银汞湖泊表面并非完全平滑而是有纳米级的涟漪，如同液态的丝绸',
      en: 'Tall grass blades showing wax luster coexisting with velvet touch, surface with microscopic ridge texture guiding dew runoff, azure jade lichen scales tightly adhering to ground with polished jade-like cool smooth touch, silver-mercury lake surface not completely smooth but with nano-scale ripples like liquid silk'
    },
    
    moodPalette: {
      peaceful: { tone: '蓝绿+金橙', light: '黄昏双星光' },
      foreboding: { tone: '暗蓝+银灰', light: '仅有伴星冷光' },
      magical: { tone: '全光谱生物发光', light: '孢子与水母成为主光源' }
    }
  },
  
  // ---------- S04: 断裂山脉（刑天战场） ----------
  broken_axis_peaks: {
    name: '断裂山脉（不周山遗迹）',
    sceneId: 'S04',
    
    terrain: {
      cn: '远古战场的遗迹——不周山断裂后形成的锯齿状山脉群，山体呈现不规则的断裂面，如同被巨斧劈开的伤口，裸露的岩层截面显示彩虹般的矿物分层，裂缝中渗出暗红色的氧化铁液流，仿佛山脉在流血，碎石坡与崩积物从山腰倾泻而下形成扇形堆积',
      en: 'Ancient battlefield ruins—serrated mountain range formed after Broken Axis collapse, mountain bodies showing irregular fractured surfaces like wounds split by giant axe, exposed rock layer cross-sections displaying rainbow mineral stratification, cracks seeping dark red iron oxide fluid as if mountains bleeding, debris slopes and talus倾泻 forming fan-shaped deposits from mountainsides'
    },
    
    atmosphere: {
      cn: '空气中弥漫着金属粉尘与臭氧混合的刺鼻气味，厚重的铁锈色云层低垂在山脊线上，能量闪电在云层间无声闪烁，将断裂的山峰轮廓瞬间镀上蓝白色的电光光辉，气压异常低，呼吸时能感觉到空气的粘稠感',
      en: 'Air permeated with pungent metallic dust and ozone mixture, heavy rust-colored clouds hanging low on ridgelines, occasional energy lightning silently flashing between cloud layers instantly illuminating broken peak silhouettes then casting blue-white electric glow, abnormally low air pressure, sticky sensation of air when breathing'
    },
    
    ecology: {
      cn: '极端环境下仅存嗜极生物——暗红色的嗜铁细菌在氧化液流中形成薄膜群落，裂缝深处偶尔可见发光的真菌菌丝网络，如同地下神经网络传递微弱的光信号，岩石表面覆盖着一层黑色的耐辐射地衣，触感如砂纸般粗糙',
      en: 'Extreme environment harboring only extremophiles—dark red iron-loving bacteria forming film colonies in oxidation fluid flow, glowing fungal hyphae networks occasionally visible in crack depths like underground neural networks transmitting faint light signals, rock surfaces covered with black radiation-resistant lichen with sandpaper-rough touch'
    },
    
    lighting: {
      cn: '主恒星被厚重云层遮挡，仅能从云隙间漏下几束斜射光柱，形成戏剧性的"上帝之光"效果照亮局部战场遗迹，伴星的冷蓝光从云层上方漫射下来，给整个场景笼罩一层阴郁的蓝灰色调，断裂岩面的金属矿物层在暗光中呈现虹彩微光，双恒星光芒在云层边缘形成金橙与蓝白的冷暖对比',
      en: 'Primary star blocked by heavy clouds, only several oblique light beams leaking through cloud gaps creating dramatic "God rays" illuminating局部 battlefield ruins, companion star cool blue light diffusing from above clouds casting entire scene in gloomy blue-gray tone, fractured rock surface metallic mineral layers showing iridescent微光 in dim light, binary starlight at cloud edges creating gold-orange and blue-white warm-cool contrast'
    },
    
    texture: {
      cn: '断裂岩面呈现参差不齐的锐利边缘，如同凝固的巨浪，新鲜的断口呈现贝壳状断口纹理（贝壳状/锯齿状），而风化面则布满蜂窝状溶蚀孔洞，氧化铁液流在岩石表面形成层层叠叠的赭红色沉积纹理，如同大地的年轮，碎石棱角分明但边缘有风化的圆润过渡',
      en: 'Fractured rock faces showing jagged sharp edges like frozen巨浪, fresh fractures presenting conchoidal fracture texture (conchoidal/serrated), weathered surfaces covered with honeycomb dissolution holes, iron oxide fluid flow forming layered ochre-red sedimentation texture on rock surfaces like earth growth rings, debris sharply angular but edges with weathered rounded transition'
    },
    
    moodPalette: {
      epic: { tone: '暗金+血红', light: '云隙漏下的戏剧性光束' },
      tragic: { tone: '铁灰+暗红', light: '仅有伴星的冷调漫射光' },
      ominous: { tone: '深紫+墨黑', light: '闪电瞬间的惨白照明' }
    }
  },
  
  // ---------- S05: 光脉晶窟 ----------
  light_vein_crystal_cave: {
    name: '光脉晶窟',
    sceneId: 'S05',
    
    terrain: {
      cn: '地下晶窟系统，穹顶由巨大的透明水晶柱支撑，如同倒置的哥特式教堂尖顶，地面覆盖着细碎的晶砂，踩上去发出风铃般的清脆声响，洞壁布满发光的晶洞（geode），如同无数发光的眼睛在晶壁上闪烁，中央有地下光脉河穿过，河水是纯能量态的液态光',
      en: 'Underground crystal cave system, dome supported by giant transparent crystal pillars like inverted Gothic church spires, ground covered with fine crystal sand producing wind-chime-like crisp sounds underfoot, cave walls covered with luminous geodes like countless luminous geodes glittering on crystal walls, central underground light-vein river passing through with pure energy-state liquid light'
    },
    
    atmosphere: {
      cn: '水晶穹顶折射着双恒星的柔和光芒，空气中充满了晶体散发的彩虹色光晕，空气纯净不含尘埃，因此光线传播异常清晰锐利，温度恒定且偏低，呼吸时能看到微弱的白雾，宁静的环境中只有晶砂移动的清脆声响与地下河的低频嗡鸣',
      en: 'Bright crystal dome refracting binary starlight with sole light source from crystal self-luminescence and underground light-vein river, air extremely pure without dust thus light propagation exceptionally clear and sharp, temperature constant and slightly low, faint white mist visible when breathing, absolute silence only broken by subtle crystal sand movement sounds and underground river low-frequency hum'
    },
    
    ecology: {
      cn: '晶洞内部生长着晶体化的微生物群落，在放大镜下呈现完美的几何花园，洞顶垂下的水晶钟乳石表面寄生着发光藻类，形成倒悬的光帘，地下河中有完全透明的盲鱼，骨骼在光脉照射下呈现玉质半透明感',
      en: 'Crystal geode interiors growing crystallized microbial colonies presenting perfect geometric gardens under magnification, crystal stalactites hanging from cave top parasitized by luminous algae forming inverted light curtains, completely transparent blind fish in underground river with bones showing jade-like translucency under light-vein illumination'
    },
    
    lighting: {
      cn: '双恒星的星光穿透水晶穹顶直射入洞，与晶体发光和光脉河照明交织，水晶柱将光线折射成复杂的光网投射到洞壁，光脉河面向上发射柔和的漫射光，如同地面上的月光，晶洞的开合造成光线的明暗呼吸节律，整体照明呈现出超现实的非自然美感，伴星的微弱光芒从地面裂缝渗入，形成明亮的蓝白背景光晕',
      en: 'No natural light source, illumination entirely from crystal luminescence and light-vein river, crystal pillars refracting light into complex light networks projected onto cave walls, light-vein river surface emitting soft diffuse light upward like moonlight on ground, geode opening/closing creating light明暗 breathing rhythm, overall lighting presenting surreal unnatural beauty, companion star faint light seeping through ground cracks creating faint blue-white background halo in bright crystal chambers'
    },
    
    texture: {
      cn: '水晶柱表面呈现完美的六边形生长纹理，内部可见包裹体与应力纹如同凝固的闪电，晶砂每一粒都是完美的微型多面体，在光线下如钻石般闪烁，洞壁的岩石是被高温高压重塑的变质岩，呈现流动般的纹理如同冻结的熔岩',
      en: 'Crystal pillar surfaces showing perfect hexagonal growth texture, interior visible inclusions and stress lines like frozen lightning, each crystal sand grain perfect miniature polyhedron sparkling like diamonds under light, cave wall rocks metamorphic rocks reshaped by high temperature and pressure showing flow-like texture like frozen lava'
    },
    
    moodPalette: {
      sacred: { tone: '全光谱白光', light: '水晶折射的纯净光网' },
      mysterious: { tone: '深紫+幽蓝', light: '光脉河的柔和底光' },
      awe: { tone: '冰蓝+银白', light: '晶洞全开时的强光爆发' }
    }
  },
  
  // ---------- S06: 虹脉苔原（原深空荒原重构） ----------
  // 🆕 2026-05-27: 全面重构为生机勃勃版本
  // 原因: Nirath星球不是死寂荒原，是充满奇特生命的生态星球
  rainbow_vein_tundra: {
    name: '虹脉苔原',
    sceneId: 'S06',
    
    terrain: {
      cn: '广袤的虹脉苔原延伸至地平线，地表覆盖着厚厚的发光能量苔藓地毯，呈现出翡翠绿与紫罗兰的渐变色彩，柱状节理的缝隙中生长着半透明的虹脉蕨类植物，它们的根系如同光纤般将地底能量传导至叶片，地热蒸汽从裂缝中升腾，在植物间形成朦胧的白色光雾，远处是覆盖着虹脉藤蔓的低矮山丘，山体呈现温暖的琥珀与深紫渐变',
      en: 'Vast rainbow-vein tundra extending to horizon, surface covered with thick glowing energy moss carpet presenting emerald green and violet gradient, columnar joint gaps growing semi-transparent rainbow-vein fern plants with roots like optical fibers conducting underground energy to leaves, geothermal steam rising from cracks forming misty white light fog among plants, distant low hills covered with rainbow-vein vines showing warm amber and deep purple gradient'
    },
    
    atmosphere: {
      cn: '微风拂过苔原，空气中弥漫着虹脉植物散发的清新能量气息，带着淡淡的甜味与矿物质的清新，双恒星的柔和光芒被大气中的虹脉花粉散射成梦幻的漫射光，天空呈现出柔和的淡紫与粉金色渐变，虹脉孢子随风飘舞如同无数微型发光体在空中舞蹈，偶尔能听到类似风铃的清脆声响——那是晶脉花朵在微风中碰撞的声音',
      en: 'Gentle breeze blowing over tundra, air permeated with fresh energy scent of rainbow-vein plants carrying faint sweetness and mineral freshness, binary star soft light scattered by rainbow-vein pollen in atmosphere into dreamy diffused light, sky presenting soft淡紫 and pink-gold gradient, rainbow-vein spores dancing in wind like countless微型 glowing particles dancing in air, occasional crisp bell-like sounds audible—crystal-vein flowers colliding in breeze'
    },
    
    ecology: {
      cn: '生机勃勃的生态乐园——能量苔藓地毯上点缀着发光的晶脉花朵，它们随着光线角度变换颜色，从深紫到金橙再到翠绿，虹脉蝴蝶（翅展约手掌大小，翅膀上有能量流动的光脉纹路）在蕨类植物间翩翩起舞，地下有发光甲虫群（背部呈现宝石般的荧光，夜间如同流动的星河）穿行于根系网络，某些柱状节理的顶部生长着球形的虹脉果实，成熟时散发柔和的金色光芒',
      en: 'Vibrant ecological paradise—energy moss carpet dotted with glowing crystal-vein flowers changing colors with light angle from deep purple to golden orange to emerald green, rainbow-vein butterflies (wingspan about palm-size with energy-flowing light-vein patterns) dancing among fern plants, underground glowing beetle swarms (backs showing gem-like fluorescence, at night like flowing star rivers) traveling through root network, certain columnar joint tops growing spherical rainbow-vein fruits emitting soft golden glow when ripe'
    },
    
    lighting: {
      cn: '双恒星的柔和光芒被大气和植物散射成温暖的漫射光，没有锐利的阴影边缘，光线如同透过薄纱般柔和，柱状节理的侧面被虹脉植物的光芒照亮，呈现出梦幻的蓝绿与金橙双色辉光，晶脉花朵在夜间会发出生物荧光，如同地面上的繁星，整体照明呈现出超自然的生机与温暖',
      en: 'Binary star soft light scattered by atmosphere and plants into warm diffused light, no sharp shadow edges, light as soft as through gauze, columnar joint sides illuminated by rainbow-vein plant glow presenting dreamy blue-green and golden-orange dual-color luminescence, crystal-vein flowers emitting bioluminescence at night like stars on ground, overall illumination presenting supernatural vitality and warmth'
    },
    
    texture: {
      cn: '能量苔藓地毯触感如同最柔软的丝绒，踩上去有轻微的弹性反馈，虹脉蕨类植物的叶片呈现半透明的蜡质光泽，触感凉爽顺滑，晶脉花朵的花瓣如同彩色玻璃般光滑坚硬，花蕊则是柔软的发光绒毛，柱状节理表面覆盖着一层薄薄的虹脉地衣，呈现彩虹般的色彩变幻，沙粒被植物根系包裹，形成圆润的有机颗粒而非锋利的棱角',
      en: 'Energy moss carpet touch like softest velvet with slight elastic feedback underfoot, rainbow-vein fern leaves presenting semi-transparent waxy luster with cool smooth touch, crystal-vein flower petals like colored glass smooth and hard while stamens are soft glowing绒毛, columnar joint surfaces covered with thin rainbow-vein lichen showing rainbow color shifts, sand grains wrapped by plant roots forming rounded organic particles rather than sharp edges'
    },
    
    moodPalette: {
      vitality: { tone: '翠绿+金橙', light: '温暖的漫射光，生机勃勃' },
      wonder: { tone: '粉金+淡紫', light: '虹脉花粉散射的梦幻光晕' },
      harmony: { tone: '琥珀+翠绿', light: '双星柔和的均衡照明' }
    }
  },
  
  // ---------- S07: 虹脉森林 ----------
  rainbow_vein_forest: {
    name: '虹脉森林',
    sceneId: 'S07',
    
    terrain: {
      cn: '参天巨树的树干呈现半透明的玉质感，内部可见能量如血液般在"虹脉"中流动，树冠层交织成密不透光的穹顶，地面覆盖着厚厚的落叶层——这些"落叶"实际上是脱落的能量鳞片，脚踩上去会发出碎裂的光芒',
      en: 'Towering giant trees with trunks showing translucent jade texture, interior energy flowing like blood in "rainbow veins", canopy layer interweaving into light-impermeable dome, ground covered with thick leaf litter—these "leaves" actually shed energy scales emitting破碎 light underfoot'
    },
    
    atmosphere: {
      cn: '森林内部的微气候与外界完全不同——恒定的温湿度、无风、空气中弥漫着树脂与能量电离的甜腻气味，树冠过滤后的光线呈现出翡翠般的绿色调，偶尔有能量雨滴从树冠间隙落下，在空中划出短暂的发光轨迹',
      en: 'Forest interior microclimate completely different from outside—constant temperature/humidity, no wind, air permeated with sweet sticky scent of resin and energy ionization, canopy-filtered light presenting emerald green tone, occasional energy raindrops falling through canopy gaps drawing brief luminous trajectories in air'
    },
    
    ecology: {
      cn: '树干上的寄生植物呈现荧光色，随虹脉能量波动而改变颜色，地面生活着以能量鳞片为食的生物，它们的排泄物会重新结晶形成新的能量矿物，树冠层中有漂浮的孢子群，在特定光线下呈现全息图般的立体影像',
      en: 'Parasitic plants on trunks showing fluorescent colors changing with rainbow vein energy fluctuations, ground creatures feeding on energy scales with excrement recrystallizing into new energy minerals, floating spore clusters in canopy layer presenting hologram-like立体 images under specific light'
    },
    
    lighting: {
      cn: '光源主要来自树干虹脉的自发光——温暖的橙红色光芒透过半透明的树皮投射到周围环境，形成独特的"血管照明"效果，树冠间隙漏下的双星光芒被上层叶片散射成柔和的绿色环境光，地面有发光蘑菇提供点状的补光',
      en: 'Primary light source from trunk rainbow vein self-luminescence—warm orange-red glow projecting through translucent bark onto surroundings creating unique "vascular lighting" effect, binary starlight leaking through canopy gaps scattered by upper leaves into soft green ambient light, ground luminous mushrooms providing spot fill light'
    },
    
    texture: {
      cn: '树皮呈现玉质温润与玻璃光泽的混合质感，虹脉通道在树干内部形成树瘤状突起，触感如脉搏般有节律的温热感，能量鳞片落叶层在微观下呈现层状的晶体结构，如同千层蛋糕般精密，树根暴露于地表的部分呈现金属般的氧化色',
      en: 'Bark showing mixed texture of jade warmth and glass luster, rainbow vein channels forming burl-like protrusions inside trunks with rhythmic warm touch like pulse, energy scale leaf litter under microscope showing layered crystal structure like精密 mille-feuille, exposed tree root portions above ground showing metallic oxidation colors'
    },
    
    moodPalette: {
      enchanted: { tone: '翡翠绿+暖橙', light: '虹脉透过树皮的血管照明' },
      threatening: { tone: '暗绿+血红', light: '虹脉能量过载的刺眼光芒' },
      serene: { tone: '薄荷绿+柔白', light: '树冠过滤后的柔和散射光' }
    }
  }
};

// ============================================================
// 场景美术设计引擎
// ============================================================

class ScenographyDesigner {
  constructor(options = {}) {
    this.options = options;
    this.nirathArchive = NIRATH_SCENE_ARCHIVE;
    this.version = SCENOGRAPHY_VERSION;
  }
  
  /**
   * 主入口：为单个镜头设计完整场景美术（支持长度感知）
   * @param {Object} shot - 镜头对象
   * @param {Object} storyPlan - 故事计划
   * @param {string} mood - 情绪关键词（可选）
   * @param {number} maxLength - 最大允许长度（可选，默认不限制）
   * @returns {string} - 环境描述片段
   */
  designSceneForShot(shot, storyPlan, mood = null, maxLength = null) {
    const targetMood = mood || shot.emotion || 'neutral';
    const sceneId = this._resolveSceneId(shot, storyPlan);
    
    const sceneArchive = this._getSceneArchive(sceneId);
    if (!sceneArchive) {
      console.log(`[ScenographyDesigner] ⚠️ 未找到场景档案: ${sceneId}, 使用通用Nirath环境`);
      return this._generateGenericNirathScene(shot, targetMood);
    }
    
    // 🆕 v1.0-Peng-release: 长度感知模式
    // 如果指定了maxLength，使用精简模式（只保留最核心的2个维度）
    const isBriefMode = maxLength !== null && maxLength < 600;
    const designDimensions = isBriefMode 
      ? this._selectBriefDimensions(shot, targetMood)
      : this._selectDimensions(shot, targetMood);
    
    const sceneDescription = this._composeSceneDescription(sceneArchive, designDimensions, targetMood, isBriefMode);
    
    // 如果仍然超长，截断到maxLength
    let finalDesc = sceneDescription;
    if (maxLength && sceneDescription.length > maxLength) {
      finalDesc = this._truncateToLength(sceneDescription, maxLength);
      console.log(`[ScenographyDesigner] ✂️ 场景描述截断: ${sceneDescription.length}→${finalDesc.length}字 (max=${maxLength})`);
    }
    
    console.log(`[ScenographyDesigner] 🎨 场景美术设计完成: ${shot.id} | 场景: ${sceneArchive.name} | 情绪: ${targetMood} | 维度: ${designDimensions.join(',')} | 长度: ${finalDesc.length}字${isBriefMode ? ' (精简模式)' : ''}`);
    
    return finalDesc;
  }
  
  /**
   * 批量设计：为一组镜头生成场景美术
   * @param {Array} shots - 镜头数组
   * @param {Object} storyPlan - 故事计划
   * @param {number} maxLength - 最大允许长度（可选）
   * @returns {Object} - { shotId: sceneDescription }
   */
  designScenesForShots(shots, storyPlan, maxLength) {
    const results = {};
    for (const shot of shots) {
      results[shot.id] = this.designSceneForShot(shot, storyPlan, null, maxLength);
    }
    return results;
  }
  
  /**
   * 精简模式维度选择（保留3个最关键维度）
   */
  _selectBriefDimensions(shot, mood) {
    const type = shot.type || 'action';
    // 片头/建置/全景：地形+光照+生态（宏观氛围+生物特征）
    if (type === 'opening_title' || type === 'establishing' || type === 'wide') {
      return ['terrain', 'lighting', 'ecology'];
    }
    // 特写/插入：纹理+光照+大气（质感+光影+氛围）
    if (type === 'close-up' || type === 'insert') {
      return ['texture', 'lighting', 'atmosphere'];
    }
    // 动作/追踪：地形+光照+生态（环境+生物）
    if (type === 'action' || type === 'tracking') {
      return ['terrain', 'lighting', 'ecology'];
    }
    // 默认：地形+光照+生态
    return ['terrain', 'lighting', 'ecology'];
  }
  
  /**
   * 截断到指定长度（智能截断，保护关键Nirath关键词）
   */
  _truncateToLength(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    // 🆕 v1.0-Peng-release: Nirath关键词保护
    const nirathKeywords = ['双恒星光', '双恒星', '伴星', 'binary star', '双星', 'companion star'];
    let protectedIndex = 0;
    for (const kw of nirathKeywords) {
      const idx = text.indexOf(kw);
      if (idx >= 0) {
        const endIdx = idx + kw.length;
        if (endIdx > protectedIndex) protectedIndex = endIdx;
      }
    }
    
    // 确保截断位置不早于Nirath关键词结束位置
    const safeLength = Math.max(maxLength, protectedIndex + 5);
    let truncated = text.substring(0, safeLength);
    
    // 在中文标点处截断，但确保不截断Nirath关键词
    const lastCnPunct = Math.max(
      truncated.lastIndexOf('，'),
      truncated.lastIndexOf('。'),
      truncated.lastIndexOf('、')
    );
    if (lastCnPunct > maxLength * 0.6 && lastCnPunct < protectedIndex) {
      // 如果标点截断位置在Nirath关键词之前，使用关键词后的第一个标点或安全长度
      const afterNirath = text.indexOf('，', protectedIndex);
      if (afterNirath > 0 && afterNirath < safeLength) {
        truncated = text.substring(0, afterNirath + 1);
      } else {
        // 关键词后无标点，直接截断到安全长度（确保包含关键词）
        truncated = text.substring(0, safeLength);
      }
    } else if (lastCnPunct > maxLength * 0.6) {
      truncated = text.substring(0, lastCnPunct + 1);
    }
    
    return truncated;
  }
  
  /**
   * 解析场景ID
   */
  _resolveSceneId(shot, storyPlan) {
    // 优先从shot的sceneId/_sceneId获取
    if (shot.sceneId || shot._sceneId) {
      return shot.sceneId || shot._sceneId;
    }
    
    // 从shot.description中匹配场景关键词
    const desc = (shot.description || '').toLowerCase();
    const sceneMapping = {
      '晶簇': 'floating_crystal_peaks',
      'crystal': 'floating_crystal_peaks',
      '虹脉': 'flowing_light_artery',
      'light vein': 'flowing_light_artery',
      '青丘': 'azure_hills_spirit_plain',
      '灵原': 'azure_hills_spirit_plain',
      '断裂': 'broken_axis_peaks',
      '不周': 'broken_axis_peaks',
      '战场': 'broken_axis_peaks',
      '晶窟': 'light_vein_crystal_cave',
      'cave': 'light_vein_crystal_cave',
      '荒原': 'rainbow_vein_tundra',
      'wasteland': 'rainbow_vein_tundra',
      '玄武岩': 'rainbow_vein_tundra',
      'basalt': 'rainbow_vein_tundra',
      '森林': 'rainbow_vein_forest',
      'forest': 'rainbow_vein_forest',
      '虹脉树': 'rainbow_vein_forest'
    };
    
    for (const [keyword, sceneId] of Object.entries(sceneMapping)) {
      if (desc.includes(keyword)) return sceneId;
    }
    
    // 从storyPlan的worldview或metadata中推断
    if (storyPlan?.metadata?.primaryScene) {
      return storyPlan.metadata.primaryScene;
    }
    
    return null;
  }
  
  /**
   * 获取场景档案
   */
  _getSceneArchive(sceneId) {
    if (!sceneId) return null;
    return this.nirathArchive[sceneId] || null;
  }
  
  /**
   * 根据镜头类型和情绪选择设计维度
   */
  _selectDimensions(shot, mood) {
    const type = shot.type || 'action';
    
    // 默认全部维度
    const allDimensions = ['terrain', 'atmosphere', 'ecology', 'lighting', 'texture'];
    
    // 根据镜头类型侧重不同维度
    const typeBias = {
      'establishing': ['terrain', 'atmosphere', 'lighting'], // 建置镜头重地形和大气
      'close-up': ['texture', 'lighting', 'ecology'], // 特写重纹理和生态
      'wide': ['terrain', 'atmosphere', 'lighting'], // 全景重地形和大气
      'action': ['terrain', 'lighting', 'texture'], // 动作镜头重地形和光影
      'dialogue': ['atmosphere', 'lighting', 'texture'], // 对话镜头重大气和质感
      'insert': ['texture', 'ecology'], // 插入镜头重纹理和生态
      'drone': ['terrain', 'atmosphere'], // 航拍重地形和大气
      'fpv': ['terrain', 'texture', 'lighting'], // FPV重地形纹理和光影
      'oneshot': ['terrain', 'atmosphere', 'lighting', 'texture'], // 一镜到底全维度
      'opening_title': ['terrain', 'atmosphere', 'lighting'] // 片头重地形大气光影
    };
    
    // 根据情绪调整
    const moodBias = {
      'fear': ['atmosphere', 'lighting', 'texture'],
      'wonder': ['terrain', 'lighting', 'ecology'],
      'tension': ['atmosphere', 'lighting', 'texture'],
      'peace': ['terrain', 'ecology', 'texture'],
      'epic': ['terrain', 'atmosphere', 'lighting'],
      'mysterious': ['atmosphere', 'ecology', 'lighting'],
      'sadness': ['atmosphere', 'lighting', 'texture'],
      'awe': ['terrain', 'lighting', 'ecology']
    };
    
    const typeDims = typeBias[type] || allDimensions;
    const moodDims = moodBias[mood] || allDimensions;
    
    // 合并去重
    const merged = [...new Set([...typeDims, ...moodDims])];
    
    // 确保至少有地形和光影（基础维度）
    if (!merged.includes('terrain')) merged.push('terrain');
    if (!merged.includes('lighting')) merged.push('lighting');
    
    return merged;
  }
  
  /**
   * 精简模式：保留每个维度的完整中文描述（不输出英文，不截断短语）
   * 目标：在有限空间内保留完整的视觉锚点
   */
  _composeBriefDescription(sceneArchive, dimensions, mood) {
    const parts = [];
    
    for (const dim of dimensions) {
      if (sceneArchive[dim] && sceneArchive[dim].cn) {
        parts.push(sceneArchive[dim].cn);
      }
    }
    
    return parts.join('，');
  }
  
  /**
   * 完整模式：组合场景描述
   */
  _composeFullDescription(sceneArchive, dimensions, mood) {
    const parts = [];
    
    for (const dim of dimensions) {
      if (sceneArchive[dim]) {
        const cn = sceneArchive[dim].cn || '';
        const en = sceneArchive[dim].en || '';
        if (cn) parts.push(cn);
        if (en) parts.push(en);
      }
    }
    
    // 添加情绪调色板（如果匹配）
    if (sceneArchive.moodPalette && sceneArchive.moodPalette[mood]) {
      const palette = sceneArchive.moodPalette[mood];
      parts.push(`情绪色调: ${palette.tone}。光照方案: ${palette.light}`);
    }
    
    return parts.join(', ');
  }
  
  /**
   * 组合场景描述（路由到精简/完整模式）
   */
  _composeSceneDescription(sceneArchive, dimensions, mood, isBriefMode = false) {
    if (isBriefMode) {
      return this._composeBriefDescription(sceneArchive, dimensions, mood);
    }
    return this._composeFullDescription(sceneArchive, dimensions, mood);
  }
  
  /**
   * 通用Nirath环境（当场景档案不存在时）
   */
  _generateGenericNirathScene(shot, mood) {
    const generic = {
      terrain: 'Nirath原生地貌，双恒星光芒下的外星地形，地表呈现非地球地质构造',
      atmosphere: '双恒星交织的天际线，大气中飘浮着能量微粒，呈现持续的低亮度发光',
      ecology: '原生能量生态，植物呈现生物发光特性，地表覆盖着硅质或晶质结壳',
      lighting: '主恒星橙红光芒与伴星蓝白光芒交织，形成冷暖对比的外星光照环境',
      texture: '非地球材质质感，表面呈现晶体、矿物或能量固化形成的独特纹理'
    };
    
    const parts = [];
    for (const [key, value] of Object.entries(generic)) {
      parts.push(value);
    }
    
    return parts.join(', ');
  }
  
  /**
   * 注册新场景档案（动态扩展）
   */
  registerSceneArchive(sceneId, archive) {
    this.nirathArchive[sceneId] = archive;
    console.log(`[ScenographyDesigner] 📚 新场景档案注册: ${sceneId} (${archive.name || '未命名'})`);
  }
  
  /**
   * 获取所有已注册场景列表
   */
  listRegisteredScenes() {
    return Object.keys(this.nirathArchive).map(id => ({
      id,
      name: this.nirathArchive[id].name || '未命名',
      sceneId: this.nirathArchive[id].sceneId || '未指定'
    }));
  }
}

// ============================================================
// 集成到渲染引擎的辅助函数
// ============================================================

/**
 * 快速调用入口：为单个镜头生成场景美术描述
 * @param {Object} shot - 镜头对象
 * @param {Object} storyPlan - 故事计划
 * @param {number} maxLength - 最大允许长度（可选）
 * @returns {string} - 环境描述片段
 */
function designSceneForShot(shot, storyPlan, maxLength) {
  const designer = new ScenographyDesigner();
  return designer.designSceneForShot(shot, storyPlan, null, maxLength);
}

/**
 * 批量调用入口
 * @param {Array} shots - 镜头数组
 * @param {Object} storyPlan - 故事计划
 * @param {number} maxLength - 最大允许长度（可选）
 * @returns {Object} - { shotId: sceneDescription }
 */
function designScenesForShots(shots, storyPlan, maxLength) {
  const designer = new ScenographyDesigner();
  return designer.designScenesForShots(shots, storyPlan, maxLength);
}

// ============================================================
// 模块导出
// ============================================================

module.exports = {
  ScenographyDesigner,
  designSceneForShot,
  designScenesForShots,
  NIRATH_SCENE_ARCHIVE,
  SCENOGRAPHY_VERSION
};

// 如果直接运行，打印场景档案列表
if (require.main === module) {
  const designer = new ScenographyDesigner();
  const scenes = designer.listRegisteredScenes();
  console.log('\n🎨 Nirath 场景美术档案库');
  console.log('='.repeat(60));
  scenes.forEach(s => {
    console.log(`  ${s.id} | ${s.name} | 场景ID: ${s.sceneId}`);
  });
  console.log(`\n总计: ${scenes.length} 个场景档案`);
}