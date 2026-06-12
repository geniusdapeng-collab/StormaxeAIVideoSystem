/**
 * Nirath水晶→原生能量体自动转换器 v1.0-Peng
 * 
 * 原则：不修改世界观基础文件(orient-primordial-core.js)，
 * 在Prompt生成/输出的最后一刻做文本替换。
 * 
 * 替换范围：
 * - 中文：水晶/晶簇/晶体/晶尘/晶柱/晶球/晶脉/晶簇/晶矿/晶格
 * - 英文：crystal/crystalline/prismatic/geode/quartz/diamond-like
 */

const REPLACEMENT_MAP = {
  // 中文替换
  '水晶': '光脉岩',
  '晶簇': '光脉网络',
  '晶体': '地质能量节点',
  '晶尘': '虹脉孢子',
  '晶柱': '光脉岩柱',
  '晶球': '虹脉核心',
  '晶脉': '光脉矿脉',
  '晶矿': '光脉矿藏',
  '晶格': '光脉网络',
  '晶化': '光脉化',
  '晶状体': '能量凝聚体',
  '晶莹剔透': '光脉渗出',
  '水晶般': '光脉岩般',
  '水晶球': '虹脉核心',
  '水晶柱': '光脉岩柱',
  '水晶簇': '光脉网络',
  '水晶矿': '光脉矿藏',
  '水晶宫殿': '光脉岩宫殿',
  '水晶森林': '光脉岩森林',
  '水晶洞穴': '光脉岩洞',
  '水晶桥': '光脉岩桥',
  '水晶塔': '光脉岩塔',
  
  // 英文替换（大小写不敏感）
  'crystal': 'luminous vein rock',
  'crystalline': 'luminous vein',
  'crystals': 'luminous vein rocks',
  'prismatic': 'halo spectrum',
  'geode': 'geothermal node',
  'quartz': 'luminous mineral',
  'diamond-like': 'light-emitting',
  'crystal column': 'luminous vein pillar',
  'crystal pillar': 'luminous vein pillar',
  'crystal sphere': 'halo core',
  'crystal ball': 'halo core',
  'crystal cluster': 'luminous vein network',
  'crystal chambers': 'luminous vein chambers',
  'crystal veins': 'luminous vein networks',
  'crystal arches': 'luminous vein arches',
  'crystal structure': 'luminous vein structure',
  'superconducting crystal': 'superconducting luminous vein',
};

/**
 * 执行替换
 * @param {string} text - 输入文本
 * @returns {string} - 替换后的文本
 */
function convertCrystalToNirathEnergy(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // 中文替换（精确匹配）
  for (const [from, to] of Object.entries(REPLACEMENT_MAP)) {
    // 中文：全局替换（中文词长度按字符计，2字词也要替换）
    if (/[\u4e00-\u9fa5]/.test(from)) {
      const regex = new RegExp(from, 'g');
      result = result.replace(regex, to);
    }
  }
  
  // 英文替换（大小写不敏感，但保留原始大小写模式）
  for (const [from, to] of Object.entries(REPLACEMENT_MAP)) {
    if (/[\u4e00-\u9fa5]/.test(from)) continue; // 跳过中文
    
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // 保留原始大小写模式
      if (match === match.toUpperCase()) return to.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return to.charAt(0).toUpperCase() + to.slice(1);
      return to;
    });
  }
  
  return result;
}

/**
 * 在Prompt生成流程中注入转换
 * 调用时机：最终Prompt输出前的最后一步
 */
function applyNirathEnergyConversion(prompt) {
  const converted = convertCrystalToNirathEnergy(prompt);
  
  // 如果发生了替换，追加免责声明（但检查长度不超限）
  if (converted !== prompt) {
    const disclaimer = ' NO crystal formations NO transparent crystalline structures NO prismatic refraction, Nirath native geological energy manifestations only';
    // 如果追加后会超过490字上限，使用更短的免责声明
    if ((converted + disclaimer).length > 490) {
      const shortDisclaimer = ' NO crystal NO prismatic, Nirath native energy only';
      if ((converted + shortDisclaimer).length <= 490) {
        return converted + shortDisclaimer;
      }
      // 如果即使短声明也超限，只返回转换后的文本（不追加声明）
      return converted;
    }
    return converted + disclaimer;
  }
  
  return prompt;
}

/**
 * 检查文本中是否仍包含主动描述的水晶相关词汇（用于质检）
 * 忽略否定声明如 "NO crystal"
 */
function containsCrystalReferences(text) {
  if (!text) return false;
  
  // 移除所有否定声明部分（NO crystal...等）
  // 找到 "NO crystal" 或 "NO crystalline" 或 "NO prismatic" 的位置，只检查前面的内容
  const noCrystalIndex = text.search(/\bNO\s+crystal/i);
  const noCrystallineIndex = text.search(/\bNO\s+crystalline/i);
  const noPrismaticIndex = text.search(/\bNO\s+prismatic/i);
  
  const cutoffIndex = Math.min(
    noCrystalIndex >= 0 ? noCrystalIndex : Infinity,
    noCrystallineIndex >= 0 ? noCrystallineIndex : Infinity,
    noPrismaticIndex >= 0 ? noPrismaticIndex : Infinity
  );
  
  const checkText = cutoffIndex < Infinity ? text.substring(0, cutoffIndex) : text;
  
  const crystalPatterns = [
    /水晶/i, /晶簇/i, /晶体/i, /晶尘/i, /晶柱/i, /晶球/i, /晶脉/i,
    /\bcrystal\b/i, /\bcrystalline\b/i, /\bprismatic\b/i, /\bgeode\b/i, /\bquartz\b/i
  ];
  
  for (const pattern of crystalPatterns) {
    if (pattern.test(checkText)) return true;
  }
  
  return false;
}

module.exports = {
  convertCrystalToNirathEnergy,
  applyNirathEnergyConversion,
  containsCrystalReferences,
  REPLACEMENT_MAP
};

// 快速测试
if (require.main === module) {
  const tests = [
    '浮空晶簇山脉区域，无数棱柱状晶簇悬浮空中',
    'Crystal chambers pulsing with energy',
    'Superconducting crystal pillars spectral colors',
    '水晶球散发着晶莹剔透的光芒',
    '天空带电粒子与晶尘共同组成字体',
    'Nirath光脉岩柱散发出紫金色光芒'  // 已转换的，不应再变
  ];
  
  console.log('=== Nirath水晶→原生能量体转换测试 ===\n');
  for (const test of tests) {
    const converted = applyNirathEnergyConversion(test);
    const hasCrystal = containsCrystalReferences(converted);
    console.log(`原文: ${test}`);
    console.log(`转换: ${converted}`);
    console.log(`含水晶: ${hasCrystal ? '❌ YES' : '✅ NO'}`);
    console.log('');
  }
}