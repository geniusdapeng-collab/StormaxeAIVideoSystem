/**
 * 出品人信息模块 v3.0-Peng — 增强版
 * 
 * 基于参考方案"title-producer-module.js"升级：
 * - 保留5种显示方式框架
 * - 新增Nirath生态专属显示方式
 * - 新增小G角色旁白/发现方式
 * - 新增合规声明集成
 */

const PRODUCER_DISPLAY_MODES = {
  // ========== 方式1：水面倒影 ==========
  waterReflection: {
    name: '虹脉水面倒影',
    description: '出品人信息通过虹脉水面倒影呈现',
    effect: '标题落入虹脉水面后，水面平静，底部浮现出品人信息',
    material: '虹脉水体菲涅尔反射，折射率1.38，高矿物质虹彩折射',
    timing: '标题完全呈现后2秒，水面涟漪平息，倒影浮现',
    nirathEnhancement: '水面含发光微生物，倒影带虹彩边缘',
    examples: {
      byGenius: '水面倒影显示 "by Genius"，字体如水中墨迹般晕开，虹彩边缘闪烁',
      producedBy: '倒影显示 "Produced by Nirath Studio"，虹彩光晕'
    }
  },

  // ========== 方式2：岩石刻痕 ==========
  rockCarving: {
    name: '浮空岩石刻痕',
    description: '出品人信息如古老刻痕般在浮空岩石上显现',
    effect: '浮空岛屿表面风化纹理中，隐约浮现刻痕',
    material: '黑曜石柱/虹彩砂岩表面，刻痕深度2-3mm，内有荧光物质',
    timing: '标题呈现后，镜头下移或缩放，岩石细节显现',
    nirathEnhancement: '刻痕内荧光物质受磁场影响同步闪烁',
    examples: {
      byGenius: '岩石上古老刻痕 "by Genius"，如千年铭文，荧光闪烁',
      studio: '刻痕显示 "Nirath Studio"，边缘有光脉苔藓覆盖'
    }
  },

  // ========== 方式3：光粒子排列 ==========
  lightParticles: {
    name: '虹彩光粒子排列',
    description: '虹彩发光粒子自然排列成出品人信息',
    effect: '地面光脉苔藓/虹彩孢子汇聚成文字',
    material: '生物荧光粒子，色温4800K-6200K，发光强度0.5-3.0流明，含磁性颗粒',
    timing: '标题呈现同时，底部粒子开始汇聚',
    nirathEnhancement: '粒子受磁场影响形成螺旋排列轨迹',
    examples: {
      byGenius: '苔藓组成 "by Genius"，如地面星空，磁场同步呼吸闪烁',
      createdBy: '孢子排列成 "Created by Genius"，螺旋轨迹'
    }
  },

  // ========== 方式4：雾气形成 ==========
  mistFormation: {
    name: '双星雾气形成',
    description: '双恒星雾气自然形成出品人信息',
    effect: '底部雾气升起，在双恒星光线下显现文字',
    material: '含发光微生物水雾，密度根据磁场强度调整',
    timing: '标题呈现后，底部雾气缓慢升起',
    nirathEnhancement: '双恒星金光穿透雾气产生丁达尔效应，文字呈金色',
    examples: {
      byGenius: '雾气中显现 "by Genius"，若隐若现，金色光晕',
      studio: '云雾中 "Nirath Studio" 如仙境题词，双星背景'
    }
  },

  // ========== 方式5：金属铭牌 ==========
  metalPlate: {
    name: '生物金属铭牌',
    description: '生物金属质感的出品人铭牌',
    effect: '一块生物金属铭牌从画面边缘滑入或从地面升起',
    material: '生物金属，表面生物纹理，高反射率，磁场共振产生金光',
    timing: '标题完全呈现后，铭牌缓缓出现',
    nirathEnhancement: '铭牌表面生长纹理如指纹独特，双恒星下反射金光',
    examples: {
      byGenius: '银色生物金属铭牌 "by Genius"，反光清晰，磁场微光',
      studio: '生物金属铭牌 "Nirath Studio"，独特纹理，Nirath原生质感'
    }
  },

  // ========== 方式6：小G手写字 ==========
  xiaoGHandwriting: {
    name: '小G探险者笔记',
    description: '小G用探险者笔记记录出品人信息',
    effect: '小G从背包取出笔记本，用笔写下出品人信息',
    material: '皮革笔记本，金属笔，纸张纹理',
    timing: '片头结尾，小G角色出现',
    nirathEnhancement: '笔记本上有Nirath探险地图草图，背景是Nirath生态',
    examples: {
      byGenius: '小G写下 "by Genius"，探险者笔记风格',
      studio: '笔记本显示 "Nirath Studio"，手绘风格'
    }
  },

  // ========== 方式7：磁场铭牌 ==========
  magneticPlate: {
    name: '磁场能量铭牌',
    description: '由磁场能量凝聚的出品人信息',
    effect: '淡蓝色磁场能量凝聚成铭牌形态',
    material: '等离子体能量场，淡蓝色辉光，磁场波动',
    timing: '标题呈现后，磁场能量从四周汇聚',
    nirathEnhancement: '铭牌在磁场中微微浮动，能量波纹扩散',
    examples: {
      byGenius: '磁场凝聚 "by Genius"，淡蓝色辉光，能量流动',
      studio: '磁场铭牌 "Nirath Studio"，Nirath特有质感'
    }
  }
};

// ============ API ============

/**
 * 生成出品人信息Prompt
 * @param {string} producerText - 出品人文字
 * @param {string} displayMode - 显示方式
 * @param {Object} options - 选项 {hasXiaoG}
 * @returns {string} - 出品人描述
 */
function generateProducerPrompt(producerText, displayMode = 'waterReflection', options = {}) {
  const mode = PRODUCER_DISPLAY_MODES[displayMode];
  if (!mode) return '';

  let prompt = `【出品人信息 - ${mode.name}】\n`;
  prompt += `${mode.effect}\n`;
  prompt += `材质：${mode.material}\n`;
  prompt += `时机：${mode.timing}\n`;

  // Nirath增强
  if (mode.nirathEnhancement) {
    prompt += `Nirath特性：${mode.nirathEnhancement}\n`;
  }

  prompt += `内容："${producerText}"\n`;

  // 小G角色注入
  if (options.hasXiaoG && displayMode === 'xiaoGHandwriting') {
    prompt += `【角色】小G：8岁男孩，探险者服装，从背包取出皮革笔记本，\n`;
    prompt += `用笔写下出品人信息，表情认真专注，必须使用前镜一致定妆照。\n`;
  }

  return prompt;
}

/**
 * 获取所有显示方式
 * @returns {Array} - 显示方式列表
 */
function getDisplayModes() {
  return Object.entries(PRODUCER_DISPLAY_MODES).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description
  }));
}

/**
 * 根据场景类型推荐出品人方式
 * @param {string} sceneType - 场景类型
 * @returns {string} - 推荐方式ID
 */
function recommendProducerMode(sceneType) {
  const recommendations = {
    waterfall: 'waterReflection',
    mountain: 'rockCarving',
    forest: 'lightParticles',
    mist: 'mistFormation',
    cave: 'metalPlate',
    xiaoG: 'xiaoGHandwriting',
    magnetic: 'magneticPlate',
    // 默认
    default: 'waterReflection'
  };

  return recommendations[sceneType] || recommendations.default;
}

module.exports = {
  PRODUCER_DISPLAY_MODES,
  generateProducerPrompt,
  getDisplayModes,
  recommendProducerMode
};