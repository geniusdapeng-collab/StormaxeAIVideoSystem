/**
 * Physics Descriptor Module v1.0-Peng
 * 基于《AI视频生成提示词工程方法论》物理真实感层
 * 
 * 定位：提示词构建的物理描述增强层
 * 被引用：story-engine.js 组装流水线、prompt-field-standard.js
 * 作用：为 Scene/Action 字段注入水体、大气、材质、柔体物理描述
 * 
 * 核心理念：用"物理过程"替代"形容词描述"
 */

class PhysicsDescriptor {
  constructor() {
    this.version = 'v1.0-Peng';
  }

  // ========== 水体物理描述词库 ==========
  get WATER_PHYSICS() {
    return {
      states: {
        glassy: {
          description: '镜面反射，微小涟漪',
          terms: ['glassy surface', 'mirror-like reflection', 'subtle ripple', 'still water', 'perfect reflection']
        },
        ripple: {
          description: '小波浪，光线扭曲',
          terms: ['gentle waves', 'light distortion on surface', 'wave pattern', 'small undulation', 'ripple spread']
        },
        swell: {
          description: '有规律的波浪，未破碎',
          terms: ['rolling swell', 'undulating surface', 'wave crest forming', 'rhythmic surge', 'long wavelength']
        },
        breaking: {
          description: '波浪破碎，白色泡沫',
          terms: ['breaking wave', 'white foam', 'wave crash', 'surf surge', 'crest collapse']
        },
        splash: {
          description: '水滴飞散，雾化',
          terms: ['splash', 'spray', 'water droplets airborne', 'atomization', 'mist formation', 'particles scatter']
        },
        turbulent: {
          description: '高速水流，湍流',
          terms: ['turbulent flow', 'rushing water', 'whitewater rapids', 'chaotic current', 'vortex']
        },
        cascade: {
          description: '垂直下落，水幕',
          terms: ['waterfall cascade', 'water curtain', 'falling sheet of water', 'vertical drop', 'water descent']
        },
        underwater: {
          description: '水下可见度变化，光线折射',
          terms: ['underwater visibility', 'light caustics underwater', 'suspended particles', 'refracted distortion', 'blue shift']
        }
      },
      opticalPhenomena: {
        caustics: {
          description: '光线穿过透明介质折射',
          terms: ['water caustics dancing on surface', 'refracted light patterns', 'light caustics', 'shimmering reflection']
        },
        refraction: {
          description: '光线穿过不同介质弯曲',
          terms: ['objects distorted through water', 'light bending at surface', 'refracted silhouette', 'wavy distortion']
        },
        reflection: {
          description: '光滑表面反光',
          terms: ['mirror reflection', 'distorted reflection on waves', 'sky reflection', 'inverted image']
        },
        foam: {
          description: '泡沫形态',
          terms: ['sea foam', 'whitecaps', 'froth bubbles', 'foam patterns', 'bubbling lather']
        },
        underwaterLight: {
          description: '水下光衰减',
          terms: ['light attenuation with depth', 'blue shift underwater', 'fading visibility', 'caustic patterns on floor']
        }
      }
    };
  }

  // ========== 大气物理描述词库 ==========
  get ATMOSPHERE_PHYSICS() {
    return {
      phenomena: {
        fog: {
          description: '雾/薄雾/阴霾',
          terms: ['fog', 'mist', 'haze', 'low visibility', 'particles suspended', 'vapor layer']
        },
        volumetricFog: {
          description: '体积雾，光线可见',
          terms: ['volumetric fog', 'light rays through fog', 'god rays', 'visible light beams', 'atmospheric depth']
        },
        smoke: {
          description: '烟，上升烟羽',
          terms: ['smoke', 'rising smoke', 'smoke plume', 'drifting smoke', 'particulate cloud']
        },
        dust: {
          description: '尘埃，漂浮粒子',
          terms: ['dust particles', 'dust in sunlight', 'floating dust motes', 'golden dust', 'particle scatter']
        },
        steam: {
          description: '蒸汽，凝结',
          terms: ['steam', 'vapor', 'condensation', 'rising steam', 'hot air distortion']
        },
        clouds: {
          description: '云，体积云',
          terms: ['clouds', 'cloud formation', 'cumulus', 'stratus', 'volumetric clouds', 'dense cloud mass']
        },
        rain: {
          description: '雨，降雨',
          terms: ['rain', 'rainfall', 'rain streaks', 'pouring rain', 'rain drops hitting surface', 'wet surface']
        },
        snow: {
          description: '雪，降雪',
          terms: ['snowfall', 'snowflakes', 'blizzard', 'snow particles', 'snow accumulation']
        },
        wind: {
          description: '风，粒子被吹动',
          terms: ['wind effect', 'wind-driven', 'particles blown by wind', 'gust', 'air current']
        },
        aurora: {
          description: '极光',
          terms: ['aurora borealis', 'northern lights', 'prismatic light curtain', 'color shifting sky']
        }
      },
      opticalEffects: {
        rayleigh: {
          description: '瑞利散射，蓝天渐变',
          terms: ['blue sky gradient', 'atmospheric scattering', 'distant blue haze', 'rayleigh scattering']
        },
        mie: {
          description: '米氏散射，温暖地平线',
          terms: ['warm haze at horizon', 'dusty atmosphere', 'foggy glow', 'scattered light']
        },
        tyndall: {
          description: '丁达尔效应，可见光束',
          terms: ['visible light beams', 'light shafts through particles', ' Tyndal effect', 'volumetric light']
        },
        rainbow: {
          description: '彩虹',
          terms: ['rainbow', 'prismatic arc', 'color spectrum in sky', 'rainbow after rain']
        },
        alpenglow: {
          description: '霞光，山体染红',
          terms: ['sunset afterglow', 'alpenglow', 'pink orange sky gradient', 'mountain glow']
        }
      }
    };
  }

  // ========== 材质物理描述框架 ==========
  get MATERIAL_PHYSICS() {
    return {
      dimensions: ['Base', 'Surface', 'Optical', 'Dynamic'],
      categories: {
        metal: {
          surface: ['polished', 'brushed', 'rusted', 'dented', 'corroded', 'pitted'],
          optical: ['specular reflection', 'metallic sheen', 'chrome highlight', 'diffuse metallic']
        },
        glass: {
          surface: ['smooth', 'frosted', 'cracked', 'stained', 'tinted'],
          optical: ['transparency', 'refraction', 'reflection', 'light transmission', 'dispersion']
        },
        fabric: {
          surface: ['woven', 'silky', 'rough', 'wet', 'translucent'],
          optical: ['diffuse', 'matte', 'slight sheen when wet', 'subsurface soft']
        },
        skin: {
          surface: ['smooth', 'textured', 'wrinkled', 'wet', 'scarred'],
          optical: ['subsurface scattering', 'specular highlights', 'porous', 'translucent edges']
        },
        stone: {
          surface: ['rough', 'polished', 'cracked', 'mossy', 'weathered'],
          optical: ['matte', 'slight reflection when wet', 'porous texture']
        },
        liquid: {
          surface: ['calm', 'turbulent', 'foamy', 'frozen', 'viscous'],
          optical: ['transparency', 'reflection', 'refraction', 'caustics', 'color absorption']
        },
        vegetation: {
          surface: ['leafy', 'bare', 'dense', 'sparse', 'wet', 'withered'],
          optical: ['diffuse', 'subsurface scattering in leaves', 'translucent backlit']
        },
        soil: {
          surface: ['dry', 'wet', 'cracked', 'muddy', 'sandy'],
          optical: ['matte', 'darkens when wet', 'absorbent', 'reflective when wet']
        }
      }
    };
  }

  // ========== 柔体物理动态描述 ==========
  get SOFTBODY_DYNAMICS() {
    return {
      types: {
        cloth: {
          description: '衣物随风动态',
          terms: ['billowing', 'flapping', 'draping', 'flowing', 'catching wind', 'snapping in breeze']
        },
        hair: {
          description: '头发摆动',
          terms: ['flowing', 'swaying', 'blowing across face', 'wind-driven strands', 'gravity fall']
        },
        flag: {
          description: '旗帜飘动',
          terms: ['waving', 'snapping in wind', 'fully extended', 'whip effect', 'rippling edge']
        },
        curtain: {
          description: '窗帘飘动',
          terms: ['billowing inward', 'fluttering', 'settling', 'breeze through window', 'undulating']
        },
        waterSurface: {
          description: '水面覆盖物',
          terms: ['rippling', 'undulating', 'lifting at edges', 'wave influence', 'surface tension ripple']
        }
      },
      driverFactors: ['wind speed', 'gravity', 'body movement', 'fluid drag', 'temperature', 'humidity']
    };
  }

  // ========== 核心组装方法 ==========

  /**
   * 构建水体物理描述
   * @param {string} waterState - 水体状态类型
   * @param {string[]} opticalPhenomena - 光学现象数组
   * @returns {string} 物理描述短语
   */
  buildWaterPhysics(waterState, opticalPhenomena = []) {
    const water = this.WATER_PHYSICS;
    let parts = [];
    
    if (waterState && water.states[waterState]) {
      const state = water.states[waterState];
      // 随机选2-3个术语
      const shuffled = [...state.terms].sort(() => Math.random() - 0.5);
      parts.push(shuffled.slice(0, 2).join(', '));
    }
    
    opticalPhenomena.forEach(opt => {
      if (water.opticalPhenomena[opt]) {
        const terms = water.opticalPhenomena[opt].terms;
        parts.push(terms[Math.floor(Math.random() * terms.length)]);
      }
    });
    
    return parts.length > 0 ? ` | ${parts.join(', ')}` : '';
  }

  /**
   * 构建大气物理描述
   * @param {string[]} phenomena - 大气现象数组
   * @param {string[]} opticalEffects - 光学效应数组
   * @returns {string} 物理描述短语
   */
  buildAtmospherePhysics(phenomena = [], opticalEffects = []) {
    const atm = this.ATMOSPHERE_PHYSICS;
    let parts = [];
    
    phenomena.forEach(p => {
      if (atm.phenomena[p]) {
        const terms = atm.phenomena[p].terms;
        parts.push(terms[Math.floor(Math.random() * terms.length)]);
      }
    });
    
    opticalEffects.forEach(opt => {
      if (atm.opticalEffects[opt]) {
        const terms = atm.opticalEffects[opt].terms;
        parts.push(terms[Math.floor(Math.random() * terms.length)]);
      }
    });
    
    return parts.length > 0 ? ` | ${parts.join(', ')}` : '';
  }

  /**
   * 构建材质物理描述
   * @param {string} materialCategory - 材质类别
   * @param {string} dynamicBehavior - 动态行为
   * @returns {string} 物理描述短语
   */
  buildMaterialPhysics(materialCategory, dynamicBehavior = '') {
    const mat = this.MATERIAL_PHYSICS;
    if (!mat.categories[materialCategory]) return '';
    
    const cat = mat.categories[materialCategory];
    let parts = [];
    
    // 随机选1个表面状态
    if (cat.surface.length > 0) {
      parts.push(cat.surface[Math.floor(Math.random() * cat.surface.length)]);
    }
    
    // 随机选1个光学反应
    if (cat.optical.length > 0) {
      parts.push(cat.optical[Math.floor(Math.random() * cat.optical.length)]);
    }
    
    if (dynamicBehavior) {
      parts.push(dynamicBehavior);
    }
    
    return parts.length > 0 ? ` | ${parts.join(', ')}` : '';
  }

  /**
   * 构建柔体动态描述
   * @param {string} softbodyType - 柔体类型
   * @param {string} driverFactor - 驱动因素
   * @returns {string} 物理描述短语
   */
  buildSoftbodyDynamics(softbodyType, driverFactor = 'wind') {
    const soft = this.SOFTBODY_DYNAMICS;
    if (!soft.types[softbodyType]) return '';
    
    const terms = soft.types[softbodyType].terms;
    const term = terms[Math.floor(Math.random() * terms.length)];
    const driver = driverFactor || soft.driverFactors[0];
    
    return ` | ${term}, ${driver}`;
  }

  /**
   * 通用物理描述组装（主入口）
   * @param {Object} physicsConfig - 物理配置对象
   * @param {string} physicsConfig.type - 物理类型：water/atmosphere/material/softbody
   * @param {string} physicsConfig.state - 状态/类别
   * @param {string[]} physicsConfig.secondary - 辅助物理现象
   * @param {string} physicsConfig.driver - 驱动因素
   * @returns {string} 完整物理描述
   */
  build(physicsConfig) {
    const { type, state, secondary = [], driver } = physicsConfig;
    
    switch (type) {
      case 'water':
        return this.buildWaterPhysics(state, secondary);
      case 'atmosphere':
        return this.buildAtmospherePhysics([state], secondary);
      case 'material':
        return this.buildMaterialPhysics(state, driver);
      case 'softbody':
        return this.buildSoftbodyDynamics(state, driver);
      default:
        return '';
    }
  }

  /**
   * 批量注入物理描述到场景
   * @param {string} sceneText - 原始场景文本
   * @param {Object[]} physicsList - 物理配置数组
   * @returns {string} 增强后的场景文本
   */
  injectIntoScene(sceneText, physicsList = []) {
    let physicsTerms = [];
    
    physicsList.forEach(config => {
      const term = this.build(config);
      if (term) physicsTerms.push(term.replace(/^\s*\|\s*/, ''));
    });
    
    if (physicsTerms.length > 0) {
      return `${sceneText} | ${physicsTerms.join(', ')}`;
    }
    
    return sceneText;
  }
}

module.exports = new PhysicsDescriptor();
