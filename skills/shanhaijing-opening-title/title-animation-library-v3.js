/**
 * 英文标题动效库 v3.0-Peng — 增强版
 * 
 * 基于参考方案「title-animation-library.js」升级：
 * - 保留4大类16种动效框架
 * - 新增Nirath生态专属动效（磁场/双恒星/浮空岛屿）
 * - 新增小G角色互动动效
 * - 新增时长自适应（5-15秒）
 * - 新增合规声明注入点
 */

const TITLE_ANIMATION_TEMPLATES = {
  // ========== 类型1：异兽互动型 ==========
  beastInteraction: {
    name: '异兽互动型',
    description: '异兽跑过/飞出/缠绕，带来或形成标题',
    variants: [
      {
        id: 'beast_run_through',
        name: '异兽狂奔穿过',
        timing: '0-1秒：异兽从画面一侧狂奔而入',
        action: '1-2秒：异兽奔跑带起的气流/火焰/粒子在空中凝结',
        formation: '2-3秒：凝结的粒子形成英文标题字母',
        settle: '3-4秒：标题稳定呈现，异兽停在画面另一侧回望',
        example: '九尾狐狂奔，九条尾巴火焰拖尾形成"NINE-TAILED FOX"'
      },
      {
        id: 'beast_fly_in',
        name: '异兽飞入盘旋',
        timing: '0-1秒：异兽从天空俯冲而下',
        action: '1-2秒：翅膀扇动产生涡流，涡流中显现标题',
        formation: '2-3秒：涡流凝固成字母形态',
        settle: '3-4秒：标题悬浮空中，异兽盘旋守护',
        example: '应龙俯冲，翅膀涡流形成"DRAGON OF YING"'
      },
      {
        id: 'beast_wrap',
        name: '异兽缠绕环绕',
        timing: '0-1秒：异兽身体从画面边缘缓缓进入',
        action: '1-2秒：身体缠绕成环形，鳞片/毛发发光',
        formation: '2-3秒：发光的身体轮廓形成字母形状',
        settle: '3-4秒：标题在异兽身体环绕中完整呈现',
        example: '烛龙身体缠绕，赤红鳞片形成"ZHULONG"'
      }
    ]
  },

  // ========== 类型2：环境融合型 ==========
  environmentFusion: {
    name: '环境融合型',
    description: '标题从Nirath自然环境元素中自然生长/凝结/浮现',
    variants: [
      {
        id: 'waterfall_mist',
        name: '虹脉瀑布水雾凝结',
        timing: '0-1秒：虹脉瀑布倾泻，水雾弥漫含发光微生物',
        action: '1-2秒：水雾在双恒星光芒下折射虹彩',
        formation: '2-3秒：水雾粒子凝结成字母形态，如冰雕般晶莹',
        settle: '3-4秒：标题虹彩闪烁，底部有水流滴落',
        example: '虹脉瀑布水雾凝结成"MYSTERY"'
      },
      {
        id: 'light_column',
        name: '双恒星光柱投影',
        timing: '0-1秒：云层裂开，双恒星金色光柱穿透',
        action: '1-2秒：光柱在地面/水面投射文字阴影',
        formation: '2-3秒：光柱中的尘埃粒子形成文字轮廓',
        settle: '3-4秒：标题在光柱中闪烁，双光源产生双重阴影',
        example: '双恒星光柱投射"EPIC OF BEASTS"'
      },
      {
        id: 'particle_gather',
        name: '虹彩孢子汇聚',
        timing: '0-1秒：虹彩发光孢子从四面八方飘来',
        action: '1-2秒：粒子受磁场影响汇聚成螺旋流',
        formation: '2-3秒：粒子流编织成字母形态',
        settle: '3-4秒：字母如银河般闪烁，粒子持续环绕',
        example: '虹彩孢子汇聚成"LEGENDS"'
      },
      {
        id: 'crystal_grow',
        name: '浮空晶簇生长成型',
        timing: '0-1秒：地面紫色水晶开始生长',
        action: '1-2秒：水晶在磁场中生长伴随碎裂声和光芒',
        formation: '2-3秒：水晶内部折射形成文字',
        settle: '3-4秒：标题在晶簇内部清晰可见，磁场辉光',
        example: '浮空晶簇生长显示"CRYSTAL"'
      },
      {
        id: 'moss_spread',
        name: '光脉苔藓蔓延',
        timing: '0-1秒：地面光脉苔藓开始发光',
        action: '1-2秒：苔藓沿磁场线蔓延成图案',
        formation: '2-3秒：蔓延轨迹形成字母',
        settle: '3-4秒：标题由发光苔藓组成，同步呼吸闪烁',
        example: '光脉苔藓蔓延成"NIRATH"'
      }
    ]
  },

  // ========== 类型3：物理破坏型 ==========
  physicalDestruction: {
    name: '物理破坏型',
    description: '通过破坏/崩裂/碎裂等物理过程形成标题',
    variants: [
      {
        id: 'rock_crack',
        name: '浮空岩石崩裂显现',
        timing: '0-1秒：浮空岛屿表面出现裂缝',
        action: '1-2秒：岩石崩裂碎片飞溅，碎片含虹彩',
        formation: '2-3秒：裂缝中透出磁场光芒，形成字母形状',
        settle: '3-4秒：标题如刻在岩石中，碎片悬浮周围',
        example: '浮空岩石崩裂显示"ANCIENT"'
      },
      {
        id: 'ground_explode',
        name: '能量爆发',
        timing: '0-1秒：地面开始震动，磁场波动',
        action: '1-2秒：能量柱冲天而起，含虹彩粒子',
        formation: '2-3秒：能量柱中文字显现',
        settle: '3-4秒：标题悬浮在爆发中心，磁场波纹扩散',
        example: '能量爆发显示"POWER"'
      }
    ]
  },

  // ========== 类型4：光影魔术型 ==========
  lightMagic: {
    name: '光影魔术型',
    description: '通过光影变化形成标题',
    variants: [
      {
        id: 'shadow_play',
        name: '双恒星光影剪影',
        timing: '0-1秒：双恒星从背后照射，产生双重阴影',
        action: '1-2秒：前景物体投射双重阴影',
        formation: '2-3秒：阴影巧妙组合成字母',
        settle: '3-4秒：标题由双重阴影构成',
        example: '银色树木双重阴影形成"FOREST"'
      },
      {
        id: 'reflection_form',
        name: '银汞湖面倒影成型',
        timing: '0-1秒：银汞湖面如镜，含金属微粒',
        action: '1-2秒：空中物体变化',
        formation: '2-3秒：水面倒影形成文字',
        settle: '3-4秒：标题倒影完美对称，虹彩闪烁',
        example: '银汞倒影显示"MIRROR"'
      }
    ]
  },

  // ========== 类型5：Nirath专属 — 磁场动效 ==========
  magneticEffect: {
    name: 'Nirath磁场动效',
    description: '利用Nirath特有磁场现象形成标题',
    variants: [
      {
        id: 'magnetic_field_form',
        name: '磁场线编织',
        timing: '0-1秒：淡蓝色磁场屏障显现',
        action: '1-2秒：磁场线如丝线般交织',
        formation: '2-3秒：磁场线编织成字母形态',
        settle: '3-4秒：标题由淡蓝色磁场线组成，微微波动',
        example: '磁场线编织成"MAGNETIC"'
      },
      {
        id: 'aurora_dance',
        name: '极光舞动成型',
        timing: '0-1秒：天空中极光开始流动',
        action: '1-2秒：极光受磁场影响形成螺旋',
        formation: '2-3秒：极光螺旋凝固成字母',
        settle: '3-4秒：标题由绿色/紫色极光组成，持续流动',
        example: '极光舞动成"AURORA"'
      }
    ]
  },

  // ========== 类型6：小G角色互动型 ==========
  xiaoGInteraction: {
    name: '小G角色互动型',
    description: '小G探险者角色与标题互动',
    variants: [
      {
        id: 'xiaoG_discover',
        name: '小G发现标题',
        timing: '0-1秒：小G在Nirath森林中探险',
        action: '1-2秒：小G拨开灌木，发现发光标题',
        formation: '2-3秒：标题从地面升起，小G后退惊讶',
        settle: '3-4秒：标题稳定，小G好奇注视',
        example: '小G发现"NIRATH"'
      },
      {
        id: 'xiaoG_torch_reveal',
        name: '手电筒照亮标题',
        timing: '0-1秒：黑暗洞穴，只有小G手电筒光芒',
        action: '1-2秒：手电筒扫过岩壁，标题显现',
        formation: '2-3秒：标题被手电光照亮，荧光反应',
        settle: '3-4秒：标题完全显现，小G微笑',
        example: '手电筒照亮"ADVENTURE"'
      }
    ]
  }
};

// ============ API ============

/**
 * 生成标题动效Prompt
 * @param {string} templateType - 动效类型
 * @param {string} variantId - 变体ID
 * @param {string} titleText - 标题文字
 * @param {Object} options - 额外选项 {duration, hasXiaoG}
 * @returns {string} - 动效描述
 */
function generateTitleAnimationPrompt(templateType, variantId, titleText, options = {}) {
  const template = TITLE_ANIMATION_TEMPLATES[templateType];
  if (!template) return '';

  const variant = template.variants.find(v => v.id === variantId);
  if (!variant) return '';

  // 根据时长调整描述
  const duration = options.duration || 9;
  const hasXiaoG = options.hasXiaoG || false;

  let prompt = `【标题动效 - ${variant.name}】\n`;

  // 时长自适应
  if (duration <= 5) {
    prompt += `快速呈现（${duration}秒）：`;
    prompt += `${variant.timing.replace(/0-1秒/, '0-0.5秒').replace(/1-2秒/, '0.5-1.5秒')}\n`;
    prompt += `${variant.action.replace(/1-2秒/, '0.5-1.5秒').replace(/2-3秒/, '1.5-2.5秒')}\n`;
    prompt += `${variant.formation.replace(/2-3秒/, '1.5-2.5秒').replace(/3-4秒/, '2.5-${duration}秒')}\n`;
    prompt += `${variant.settle.replace(/3-4秒/, '2.5-${duration}秒')}\n`;
  } else if (duration >= 12) {
    prompt += `慢速史诗呈现（${duration}秒）：`;
    prompt += `${variant.timing}\n`;
    prompt += `${variant.action}\n`;
    prompt += `${variant.formation}\n`;
    prompt += `${variant.settle}\n`;
    prompt += `${duration-4}-${duration}秒：标题稳定悬浮，环境持续动态，小G角色反应（如有）\n`;
  } else {
    // 标准9秒
    prompt += `${variant.timing}\n`;
    prompt += `${variant.action}\n`;
    prompt += `${variant.formation.replace(/标题/g, `"${titleText}"`)}\n`;
    prompt += `${variant.settle}\n`;
  }

  // 小G角色注入
  if (hasXiaoG) {
    prompt += `【角色互动】小G：8岁男孩，身高1.2米，探险者服装（黄色冲锋衣+牛仔裤+运动鞋），\n`;
    prompt += `佩戴指南针/水壶/手电筒，在场景中探险/仰望/发现标题，表情从好奇到震撼。\n`;
    prompt += `必须使用前镜一致定妆照参考（character-ref: xiaoG）。\n`;
  }

  return prompt;
}

/**
 * 获取所有可用模板
 * @returns {Array} - 模板列表
 */
function getAvailableTemplates() {
  return Object.entries(TITLE_ANIMATION_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    variantCount: value.variants.length
  }));
}

/**
 * 获取模板变体
 * @param {string} templateType - 模板类型
 * @returns {Array} - 变体列表
 */
function getTemplateVariants(templateType) {
  const template = TITLE_ANIMATION_TEMPLATES[templateType];
  if (!template) return [];

  return template.variants.map(v => ({
    id: v.id,
    name: v.name,
    example: v.example
  }));
}

/**
 * 根据异兽ID推荐动效类型
 * @param {string} beastId - 异兽ID
 * @returns {Object} - 推荐配置
 */
function recommendAnimationForBeast(beastId) {
  const recommendations = {
    jiuweihu: {
      type: 'beastInteraction',
      variant: 'beast_run_through',
      reason: '九尾狐狂奔最适合展示九条尾巴火焰拖尾'
    },
    zhulong: {
      type: 'beastInteraction',
      variant: 'beast_wrap',
      reason: '烛龙缠绕最适合展示赤红鳞片'
    },
    hundun: {
      type: 'magneticEffect',
      variant: 'magnetic_field_form',
      reason: '混沌适合磁场线编织效果'
    },
    yinglong: {
      type: 'beastInteraction',
      variant: 'beast_fly_in',
      reason: '应龙俯冲最适合展示翅膀涡流'
    },
    // 默认
    default: {
      type: 'environmentFusion',
      variant: 'light_column',
      reason: '通用推荐：双恒星光柱投影'
    }
  };

  return recommendations[beastId] || recommendations.default;
}

module.exports = {
  TITLE_ANIMATION_TEMPLATES,
  generateTitleAnimationPrompt,
  getAvailableTemplates,
  getTemplateVariants,
  recommendAnimationForBeast
};