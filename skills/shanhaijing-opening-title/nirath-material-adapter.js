/**
 * 片头制作系统 v3.0-Peng — Nirath材质适配器
 * 将通用材质系统与Nirath原创世界观深度绑定
 * 
 * 基于参考方案「质感引擎」升级：
 * - 保留7种物理材质框架
 * - 注入Nirath生态专属参数
 * - 与异兽档案系统联动
 */

// ============ Nirath生态材质库 ============
const NIRATH_MATERIAL_CONSTRAINTS = {
  // 1. 毛发材质 — Nirath双恒星光照下的极光毛发
  fur: {
    type: '次表面散射极光毛发',
    baseDescription: '每根毛发独立几何体渲染，次表面散射SSS，皮下血管隐约可见',
    nirathAdaptation: {
      lighting: '双恒星金色光柱作为主光源，产生冷暖对比的毛发边缘光',
      colorShift: 'Nirath大气折射导致毛发根部呈琥珀金，尖端呈极光银白',
      magneticEffect: '淡蓝色磁场屏障在毛发表面产生微弱等离子体辉光'
    },
    physicalParams: {
      sssDepth: '2.5mm次表面散射深度',
      melanin: '低黑色素（极光银白）',
      specularRoughness: '0.3（半光滑）',
      anisotropy: '0.8（强各向异性高光）'
    },
    examples: {
      nineTailedFox: '九尾狐毛发：根部琥珀金渐变尖端极光银白，九条尾巴各有独立毛流动态，双恒星下闪烁金属光泽，磁场屏障产生淡蓝色边缘辉光',
      baiZe: '白泽毛发：纯白色神圣毛发，淡金色光泽，双恒星下如丝绸般顺滑，磁场产生彩虹色边缘光'
    }
  },

  // 2. 火焰材质 — Nirath磁场影响下的等离子体火焰
  flame: {
    type: '磁场等离子体火焰',
    baseDescription: '等离子体体积渲染，核心高色温，边缘渐变',
    nirathAdaptation: {
      magneticInfluence: 'Nirath磁场使火焰产生螺旋形扭曲，类似极光形态',
      particleDensity: '磁场影响粒子密度分布，形成分层结构',
      colorShift: '双恒星金光叠加使火焰核心偏白金，边缘偏靛蓝紫'
    },
    physicalParams: {
      coreTemp: '12000K（白热，含磁场能量）',
      edgeTemp: '8000K（靛蓝紫，磁场冷却效应）',
      volumetricScattering: '10^15/cm³粒子密度，磁场分层结构',
      turbulence: '受磁场力影响产生螺旋湍流，非地球重力湍流'
    },
    examples: {
      nineTailedFlame: '九尾狐尾焰：淡蓝色等离子体火焰，核心白金，边缘靛蓝紫，磁场影响下呈螺旋拖尾，尾巴挥动时产生磁场波纹',
      zhuLongEye: '烛龙眼焰：赤红色永恒火焰，双恒星金光叠加呈金红色，磁场产生环状火焰结构，热浪扭曲呈螺旋形'
    }
  },

  // 3. 水面材质 — Nirath流光虹脉河/银汞湖泊
  water: {
    type: '流光虹脉水体',
    baseDescription: '物理真实水面，菲涅尔反射，焦散光斑',
    nirathAdaptation: {
      bioluminescent: '水体含有发光微生物，产生虹彩流光效果',
      magneticEffect: '磁场影响水面张力，产生涟漪波纹图案',
      mineralContent: '高矿物质含量使水体呈现虹彩折射'
    },
    physicalParams: {
      ior: '1.38（高矿物质含量，高于地球水）',
      surfaceTension: '78mN/m（磁场增强效应）',
      flowSpeed: '瀑布3.5m/s（磁场加速），河流1.2m/s，虹脉河2.0m/s',
      caustics: '焦散光斑呈虹彩色，矿物质晶体折射'
    },
    examples: {
      waterfall: '虹脉瀑布：湍急水流含发光微生物，白色泡沫带虹彩，撞击岩石产生虹色水雾，磁场影响下水流呈螺旋下落',
      stillLake: '银汞湖泊：如镜水面含金属微粒，完美倒影，涟漪从中心扩散呈同心圆磁场图案',
      river: '流光虹脉河：流动水面含虹彩微生物，水草飘动带荧光，石头周围产生虹色小漩涡'
    }
  },

  // 4. 岩石材质 — Nirath浮空晶簇山脉/黑曜石柱
  rock: {
    type: 'Nirath地质岩石',
    baseDescription: '基于真实岩石类型的材质，含Nirath特有矿物',
    nirathAdaptation: {
      floatingStructure: '浮空晶簇内部含反重力矿物，产生微弱发光',
      magneticInclusions: '岩石内部含磁性矿物，产生磁场纹路',
      crystalGrowth: '水晶在磁场中生长，产生六方晶系变形结构'
    },
    physicalParams: {
      hardness: '莫氏硬度5-8（含反重力矿物）',
      weathering: '表面风化纹理含磁场侵蚀痕迹',
      mineralInclusions: '内部含虹彩晶体包裹体，双恒星下折射彩虹'
    },
    examples: {
      basalt: '黑曜石柱：深黑色火山玻璃，含铁氧化物褐色纹理，内部含虹彩包裹体，双恒星下产生彩虹折射',
      crystal: '浮空晶簇：紫水晶六方晶系，磁场影响下产生螺旋生长纹，折射率1.55-1.65，内部虹彩包裹体发光',
      sandstone: '虹彩砂岩：层理结构含发光矿物，风化产生虹彩表面，双恒星下闪烁'
    }
  },

  // 5. 发光生物材质 — Nirath原生荧光生态
  bioluminescent: {
    type: 'Nirath原生生物荧光',
    baseDescription: '基于真实生物荧光机制，Nirath特有物种',
    nirathAdaptation: {
      magneticEnhancement: 'Nirath磁场增强生物荧光效率，发光强度提升200%',
      spectrumShift: '双恒星金光使荧光色温偏暖，产生金绿/金蓝渐变',
      networked: '荧光生物通过磁场形成网络，同步闪烁'
    },
    physicalParams: {
      mechanism: '荧光素酶反应 + 磁场能量共振',
      colorTemp: '4800K-6200K（双恒星暖光叠加）',
      intensity: '0.5-3.0流明（磁场增强）',
      microstructure: '微观菌丝/细胞结构含磁性颗粒'
    },
    examples: {
      moss: '光脉苔藓：蓝绿色荧光苔藓，菌丝网络在微距下如神经网络，磁场同步闪烁呈呼吸节奏',
      spore: '虹彩孢子：发光孢子颗粒含磁性，空气中飘浮如萤火虫，受磁场影响形成螺旋轨迹',
      flower: '极光荧光花：花瓣半透明含虹彩细胞，花蕊发光，双恒星下呈金蓝渐变'
    }
  },

  // 6. 金属材质 — Nirath银色树木/陨铁
  metal: {
    type: 'Nirath原生金属',
    baseDescription: '基于真实金属属性，Nirath特有矿物',
    nirathAdaptation: {
      biologicalMetal: '银色树木为生物金属，具有有机生长纹理',
      magneticProperties: '金属含磁性，与Nirath磁场产生共振发光',
      growthPattern: '生物金属随磁场方向生长，产生螺旋纹理'
    },
    physicalParams: {
      reflectivity: '0.95（高反射率，类似银镜）',
      roughness: '0.2（生物纹理，非机械抛光）',
      oxidation: '无氧化层（生物金属自修复）',
      magneticResonance: '磁场频率共振产生微弱金光'
    },
    examples: {
      silverTree: '银色树木：生物金属树皮，高反射率如镜面，反射双恒星金光产生金边效果，树皮纹理如指纹独特',
      goldOre: '虹彩金矿：自然形态与岩石混合，金色斑点含虹彩，双恒星下闪烁虹彩金光',
      meteorite: 'Nirath陨铁：表面熔融纹理含磁性，金属光泽带虹彩，磁场影响下产生涡纹'
    }
  },

  // 7. 大气材质 — Nirath晨雾/极光/双恒星大气
  atmosphere: {
    type: 'Nirath体积大气',
    baseDescription: '真实大气散射，Nirath特有光学现象',
    nirathAdaptation: {
      dualStarLight: '双恒星产生双重阴影，金色光柱交叉',
      magneticAurora: '磁场激发的大气极光，呈螺旋形态',
      bioluminescentMist: '大气中含发光微生物，雾气自带微光'
    },
    physicalParams: {
      scattering: '瑞利散射+米氏散射+磁场康普顿散射',
      density: '粒子密度随海拔和磁场强度变化',
      color: '晨昏时金紫双色，正午时淡蓝金双色，夜间深紫带极光'
    },
    examples: {
      morningMist: '双星晨雾：低处浓高处淡，金色光柱交叉穿透，雾气中含发光微粒',
      cloudLayer: '极光云层：蓬松体积，边缘受双星光产生金紫双色边',
      aurora: 'Nirath极光：带电粒子+磁场激发，绿色/紫色/金色光带螺旋流动'
    }
  }
};

// ============ API ============

/**
 * 获取Nirath材质约束描述
 * @param {string} materialType - 材质类型
 * @param {string} variant - 变体名称
 * @returns {string} - 材质描述文本
 */
function getNirathMaterialConstraint(materialType, variant) {
  const material = NIRATH_MATERIAL_CONSTRAINTS[materialType];
  if (!material) return '';

  let description = `【${material.type}】`;
  description += `${material.baseDescription}。`;

  // Nirath适配
  const adapt = material.nirathAdaptation;
  if (adapt) {
    const adaptTexts = [];
    if (adapt.lighting) adaptTexts.push(adapt.lighting);
    if (adapt.magneticInfluence) adaptTexts.push(adapt.magneticInfluence);
    if (adapt.bioluminescent) adaptTexts.push(adapt.bioluminescent);
    if (adapt.floatingStructure) adaptTexts.push(adapt.floatingStructure);
    if (adapt.magneticEnhancement) adaptTexts.push(adapt.magneticEnhancement);
    if (adapt.dualStarLight) adaptTexts.push(adapt.dualStarLight);
    if (adapt.networked) adaptTexts.push(adapt.networked);
    if (adapt.magneticProperties) adaptTexts.push(adapt.magneticProperties);
    if (adapt.growthPattern) adaptTexts.push(adapt.growthPattern);
    if (adapt.biologicalMetal) adaptTexts.push(adapt.biologicalMetal);
    if (adapt.magneticAurora) adaptTexts.push(adapt.magneticAurora);
    if (adapt.bioluminescentMist) adaptTexts.push(adapt.bioluminescentMist);
    if (adapt.colorShift) adaptTexts.push(adapt.colorShift);
    if (adapt.magneticEffect) adaptTexts.push(adapt.magneticEffect);
    if (adapt.mineralContent) adaptTexts.push(adapt.mineralContent);
    if (adapt.magneticInclusions) adaptTexts.push(adapt.magneticInclusions);
    if (adapt.crystalGrowth) adaptTexts.push(adapt.crystalGrowth);
    if (adapt.spectrumShift) adaptTexts.push(adapt.spectrumShift);
    if (adapt.particleDensity) adaptTexts.push(adapt.particleDensity);
    
    if (adaptTexts.length > 0) {
      description += `Nirath特性：${adaptTexts.join('，')}。`;
    }
  }

  // 物理参数
  const params = material.physicalParams;
  if (params) {
    const paramTexts = [];
    if (params.ior) paramTexts.push(`折射率${params.ior}`);
    if (params.coreTemp) paramTexts.push(`核心色温${params.coreTemp}`);
    if (params.hardness) paramTexts.push(`莫氏硬度${params.hardness}`);
    if (params.sssDepth) paramTexts.push(params.sssDepth);
    if (params.melanin) paramTexts.push(params.melanin);
    if (params.specularRoughness) paramTexts.push(`高光粗糙度${params.specularRoughness}`);
    if (params.anisotropy) paramTexts.push(`各向异性${params.anisotropy}`);
    if (params.surfaceTension) paramTexts.push(`表面张力${params.surfaceTension}`);
    if (params.flowSpeed) paramTexts.push(`流速${params.flowSpeed}`);
    if (params.volumetricScattering) paramTexts.push(params.volumetricScattering);
    if (params.turbulence) paramTexts.push(params.turbulence);
    if (params.weathering) paramTexts.push(params.weathering);
    if (params.mechanism) paramTexts.push(`机制：${params.mechanism}`);
    if (params.colorTemp) paramTexts.push(`色温${params.colorTemp}`);
    if (params.intensity) paramTexts.push(`强度${params.intensity}`);
    if (params.reflectivity) paramTexts.push(`反射率${params.reflectivity}`);
    if (params.roughness) paramTexts.push(`粗糙度${params.roughness}`);
    if (params.oxidation) paramTexts.push(params.oxidation);
    if (params.magneticResonance) paramTexts.push(params.magneticResonance);
    if (params.scattering) paramTexts.push(`散射：${params.scattering}`);
    if (params.density) paramTexts.push(params.density);
    if (params.color) paramTexts.push(`色彩：${params.color}`);
    
    if (paramTexts.length > 0) {
      description += `物理参数：${paramTexts.join('，')}。`;
    }
  }

  // 具体变体
  if (variant && material.examples[variant]) {
    description += `具体表现：${material.examples[variant]}。`;
  }

  return description;
}

/**
 * 生成完整材质段
 * @param {Array} materials - 材质列表 [{type, variant}]
 * @returns {string} - 完整材质描述
 */
function generateNirathMaterialSection(materials) {
  return materials.map(m => getNirathMaterialConstraint(m.type, m.variant)).join('\n');
}

/**
 * 根据异兽ID自动推荐材质组合
 * @param {string} beastId - 异兽ID
 * @returns {Array} - 推荐材质列表
 */
function recommendMaterialsForBeast(beastId) {
  const recommendations = {
    jiuweihu: [
      { type: 'fur', variant: 'nineTailedFox' },
      { type: 'flame', variant: 'nineTailedFlame' },
      { type: 'water', variant: 'waterfall' },
      { type: 'bioluminescent', variant: 'moss' },
      { type: 'rock', variant: 'basalt' }
    ],
    zhulong: [
      { type: 'flame', variant: 'zhuLongEye' },
      { type: 'rock', variant: 'crystal' },
      { type: 'atmosphere', variant: 'aurora' },
      { type: 'bioluminescent', variant: 'spore' }
    ],
    hundun: [
      { type: 'atmosphere', variant: 'morningMist' },
      { type: 'bioluminescent', variant: 'spore' },
      { type: 'rock', variant: 'sandstone' }
    ],
    // 默认推荐
    default: [
      { type: 'rock', variant: 'basalt' },
      { type: 'bioluminescent', variant: 'moss' },
      { type: 'atmosphere', variant: 'morningMist' }
    ]
  };

  return recommendations[beastId] || recommendations.default;
}

/**
 * Prompt字数检查器
 */
function checkPromptLength(prompt, targetLength = 950) {
  const currentLength = prompt.length;
  const maxLength = 990;

  return {
    current: currentLength,
    target: targetLength,
    max: maxLength,
    status: currentLength >= targetLength ? '✅ 达标' : `⚠️ 还需${targetLength - currentLength}字`,
    suggestion: currentLength < targetLength
      ? '建议补充：材质细节、光影参数、物理约束'
      : 'Prompt已打满，质感有保障'
  };
}

module.exports = {
  NIRATH_MATERIAL_CONSTRAINTS,
  getNirathMaterialConstraint,
  generateNirathMaterialSection,
  recommendMaterialsForBeast,
  checkPromptLength
};