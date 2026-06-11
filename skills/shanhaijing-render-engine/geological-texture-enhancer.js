/**
 * 地质质感增强系统 v1.0-Peng
 * Geological Texture Enhancement System
 * 
 * 核心问题：AI视频生成中岩石/山脉/地质地貌默认呈现"塑料感"/"3D渲染光滑感"
 * 根因：Prompt缺少微观纹理、材质细节、风化痕迹、光照交互描述
 * 目标：为所有含地质元素的Prompt注入反塑料质感关键词
 * 
 * 系统级设计：
 * - 不替换原有环境描述，而是追加"地质质感层"
 * - 自动检测地质关键词，智能注入
 * - 所有rocky/mountain/cliff场景自动受益
 * 
 * 版本: v1.0-Peng
 * 创建: 2026-05-27
 * 作者: 小G（机制级修复，非case定制）
 */

// ========== 地质关键词检测库 ==========
// 用于判断Prompt是否涉及地质/岩石场景
const GEOLOGICAL_KEYWORDS = [
  // 中文
  '山', '山脉', '岩壁', '悬崖', '岩石', '断层', '地质', '火山', '山峰', '绝壁',
  '裂谷', '峡谷', '峭壁', '山脊', '山崖', '山体', '岩层', '石壁', '巨石', '石块',
  '玄武岩', '黑曜石', '花岗岩', '砂岩', '石灰岩', '沉积岩', '火山岩', '岩浆',
  '不周', '盘古', '断裂', '断层线', '风化', '侵蚀',
  // 英文
  'mountain', 'cliff', 'rock', 'volcanic', 'geological', 'ridge', 'peak',
  'canyon', 'gorge', 'crag', 'boulder', 'stone', 'basalt', 'obsidian',
  'granite', 'sedimentary', 'igneous', 'metamorphic', 'lava', 'magma',
  'fault', 'fracture', 'erosion', 'weathering', 'strata', 'bedrock'
];

// ========== 反塑料地质质感核心词库 ==========
// 中英文混合，Seedance友好，约180字
const GEOLOGICAL_TEXTURE_CORE = `
粗糙多孔的火山岩表面，深层风化裂缝纵横交错如老人皱纹，
铁氧化物沉积形成赭红色与暗褐色矿脉纹理沿岩壁蜿蜒，
玄武岩柱状节理清晰可见呈六边形垂直排列，
冰劈作用形成的尖锐棱角与崩裂碎石散布坡面，
沉积层理在流水侵蚀作用下裸露分层如翻开的地质史书，
岩缝间生长着蓝绿色地衣与灰白微型苔藓点缀暗色岩石，
碎石坡与崩积物散落山脚形成自然颗粒过渡带，
岩石表面绝非光滑塑料质感而是天然粗糙的矿物基质，
斜射光在凹凸表面形成深邃阴影池与高光脊对比强烈，
风化剥蚀形成的蜂窝状孔洞与垂直凹槽增加表面复杂度，
微量石英与长石矿物结晶在裂缝中闪烁微弱反光。
rough porous volcanic rock surface with deep weathering fissures crisscrossing like aged wrinkles,
iron oxide deposits creating ochre-red and dark-brown mineral vein patterns winding along cliff face,
basalt columnar joints clearly visible in hexagonal vertical formations,
frost-shattered sharp edges and fractured debris scattered on slopes,
exposed stratified sedimentary layers from water erosion like opened geological history books,
blue-green lichen and gray-white micro moss growing in rock crevices dotting dark stone,
talus slopes and scree at mountain base forming natural granular transition zone,
matte stone surface absolutely not smooth plastic-like but naturally rough mineral matrix,
raking light creating deep shadow pools and highlight ridges with strong contrast on uneven surface,
weathering honeycomb holes and vertical grooves increasing surface complexity,
minute quartz and feldspar mineral crystals glinting faintly in fractures.
`.trim();

// ========== 地质质感增强主函数 ==========
/**
 * 检测Prompt是否含地质元素，如含则返回质感增强片段
 * @param {string} prompt - 原始Prompt
 * @returns {string|null} - 质感增强片段（不含地质元素返回null）
 */
function detectGeologicalTextureNeed(prompt) {
  if (!prompt) return null;
  const promptLower = prompt.toLowerCase();
  // 🆕 v1.1-Peng-fix: 提高检测阈值，需要至少2个地质关键词才触发
  // 避免单字匹配（如'山'在'山脚下'中）导致过度注入
  let matchCount = 0;
  for (const kw of GEOLOGICAL_KEYWORDS) {
    if (promptLower.includes(kw.toLowerCase()) || prompt.includes(kw)) {
      matchCount++;
    }
  }
  // 需要至少2个匹配且必须包含核心地质词（非泛化单字）
  const hasCoreGeo = ['山脉', '岩壁', '悬崖', '岩石', '断层', '地质', '火山', '玄武岩', '花岗岩', '沉积岩',
    'mountain', 'cliff', 'rock', 'volcanic', 'geological', 'basalt', 'granite', 'sedimentary',
    'fault', 'strata', 'bedrock'].some(kw => promptLower.includes(kw.toLowerCase()));
  return (matchCount >= 2 && hasCoreGeo) ? GEOLOGICAL_TEXTURE_CORE : null;
}

/**
 * 将地质质感增强注入Prompt（作为环境描述追加）
 * @param {string} prompt - 原始Prompt
 * @param {string} injectionPoint - 注入位置标记（默认在Nirath环境描述后）
 * @returns {string} - 增强后的Prompt
 */
function injectGeologicalTexture(prompt, injectionPoint = 'Nirath') {
  const textureFragment = detectGeologicalTextureNeed(prompt);
  if (!textureFragment) return prompt;
  
  // 智能注入：在环境描述段落之后、角色/动作描述之前
  // 策略：寻找第一个角色相关关键词，在其之前插入
  const roleMarkers = ['角色形象', '小G', '男孩', 'camera', '镜头', 'tracking', 'crane'];
  let insertIndex = -1;
  
  for (const marker of roleMarkers) {
    const idx = prompt.indexOf(marker);
    if (idx !== -1 && (insertIndex === -1 || idx < insertIndex)) {
      insertIndex = idx;
    }
  }
  
  if (insertIndex === -1) {
    // 未找到合适插入点，追加到末尾
    return prompt + ' ' + textureFragment;
  }
  
  // 在角色描述之前插入地质质感
  return prompt.slice(0, insertIndex) + textureFragment + ' ' + prompt.slice(insertIndex);
}

/**
 * 获取纯地质质感片段（供模板直接使用）
 * @returns {string}
 */
function getGeologicalTextureFragment() {
  return GEOLOGICAL_TEXTURE_CORE;
}

// ========== 版本信息 ==========
const VERSION = 'v1.0-Peng';

module.exports = {
  GEOLOGICAL_KEYWORDS,
  GEOLOGICAL_TEXTURE_CORE,
  detectGeologicalTextureNeed,
  injectGeologicalTexture,
  getGeologicalTextureFragment,
  VERSION
};