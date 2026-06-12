/**
 * 风格纯净度黑名单系统 v1.2-Peng-fix
 * 自动检测并拦截暗黑风格关键词，替换为明亮史诗描述
 * 
 * 🆕 v1.1-Peng-fix: 保护约束声明（NO dark scene），避免误拦截
 * 🆕 v1.2-Peng-fix: 中文暗黑关键词全面覆盖（暗红色/阴郁/暗光/暗褐色/暗色/深邃阴影/蓝灰色/厚重云层/伤口/流血）
 * 触发条件: 所有Nirath/山海经视频生成任务
 * 作用位置: Prompt生成阶段，注入前自动清洗
 */

const DARK_STYLE_BLACKLIST = {
  // 英文暗黑关键词 → 明亮史诗替换
  'obsidian': ['紫晶岩', '暗金晶化岩', '光脉岩石'],
  'dark crimson': ['赤金光芒', '暖金辉光', '能量赤流'],
  'dark': ['深邃', '浓郁', '壮阔'],
  'abyssal': ['深海光脉', '深渊发光', '幽蓝深渊'],
  'black monolithic': ['巨型岩碑', '远古石柱', '光脉碑林'],
  '冷色调主导': ['暖金色调', '紫金渐变', '双星暖光'],
  '不安感强烈': ['史诗壮阔感', '宏大叙事感', '庄严神圣感'],
  '阴影锋利如刀': ['光影层次丰富', '体积光柔和过渡', '光脉晕染'],
  '压抑': ['开阔', '壮丽', '恢弘'],
  '阴森': ['神秘', '庄严', '神圣'],
  '恐怖': ['震撼', '敬畏', '惊叹'],
  'blood': ['赤金', '能量', '辉光'],
  '血腥': ['炽烈', '燃烧', '能量喷薄'],
  
  // 🆕 v1.2-Peng-fix: 中文暗黑关键词 → 明亮史诗替换
  // 根因：S00片头含大量中文暗黑描述未被拦截（暗红色/阴郁/暗光/暗褐色/暗色/深邃阴影池）
  '暗红色': ['鲜红色', '赤红色', '赭红色'],
  '暗褐色': ['赭色', '棕红色', '赤褐色'],
  '暗色': ['亮色', '彩色', '明色'],
  '暗光': ['柔光', '微光', '暖光'],
  '阴郁的': ['明朗的', '明快的', '鲜亮的'],
  '阴郁': ['明朗', '明快', '鲜亮'],
  '深邃阴影': ['明亮光影', '柔和光晕', '光脉纹理'],
  '深邃的': ['明亮的', '鲜明的', '透亮的'],
  '蓝灰色调': ['蓝金色调', '紫金渐变', '暖蓝明色调'],
  '蓝灰色': ['蓝金色', '紫金色', '暖蓝色'],
  '厚重云层': ['轻盈云带', '薄雾轻纱', '光脉云气'],
  '厚重云': ['薄云', '轻纱云', '光脉云'],
  '云隙间漏下': ['云层中透射', '云间洒落', '光瀑倾泻'],
  '伤口': ['纹理', '脉络', '印记'],
  '流血': ['能量流淌', '光脉流动', '辉光涌流'],
};

// 情绪-光照映射: 暗黑→明亮
const EMOTION_LIGHTING_MAP = {
  '震惊': '硬光高对比，暖金色调，戏剧性光照',
  '敬畏': '柔光散射，神圣顶光，暖色调',
  '狂暴': '频闪效果，强烈光比，赤金能量光芒',
  '恐惧': '逆光剪影，轮廓光勾勒，史诗压迫感',
};

// 场景色调强制修正
const SCENE_TONE_CORRECTION = {
  '战场': '紫金暮光下的壮阔战场，能量光芒交织',
  '峡谷': '双星照耀的雄伟峡谷，光脉岩柱林立',
  '遗迹': '神圣庄严的远古遗迹，暖金余晖笼罩',
  '祭坛': '光芒万丈的神圣祭坛，能量柱冲天',
};

/**
 * 清洗暗黑风格
 * @param {string} prompt 原始提示词
 * @returns {string} 清洗后的提示词
 */
function cleanseDarkStyle(prompt) {
  let cleaned = prompt;
  
  // 🆕 v1.1-Peng-fix: 保护约束声明，避免误拦截
  // 先保护 "NO dark" / "NO dark scene" 等约束性用法
  const CONSTRAINT_PLACEHOLDER = '___DARK_CONSTRAINT___';
  cleaned = cleaned.replace(/NO\s+dark\s+scene/gi, CONSTRAINT_PLACEHOLDER);
  cleaned = cleaned.replace(/NO\s+dark/gi, CONSTRAINT_PLACEHOLDER);
  
  for (const [dark, bright] of Object.entries(DARK_STYLE_BLACKLIST)) {
    if (cleaned.includes(dark)) {
      const replacement = Array.isArray(bright) ? bright[0] : bright;
      
      // 🆕 v1.2-Peng-fix: 区分中英文匹配策略
      if (/^[\x00-\x7F]+$/.test(dark)) {
        // 英文词：使用正则表达式匹配单词边界，避免替换子串
        const regex = new RegExp(`\\b${dark}\\b`, 'gi');
        cleaned = cleaned.replace(regex, replacement);
      } else {
        // 中文词：使用完整词组匹配（不使用单词边界，避免中文字符边界问题）
        // 策略：先检查是否包含，再使用 split/join 精确替换完整词组
        // 为防止误替换子串，确保前后不是中文字符（除非在词边界）
        const escaped = dark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 中文词组匹配：不要求单词边界，因为中文没有空格分隔
        const regex = new RegExp(escaped, 'g');
        cleaned = cleaned.replace(regex, replacement);
      }
      
      console.log(`[StyleCleanser] 🚫 暗黑词拦截: "${dark}" → "${replacement}"`);
    }
  }
  
  // 恢复约束声明
  cleaned = cleaned.replace(new RegExp(CONSTRAINT_PLACEHOLDER, 'g'), 'NO dark scene');
  
  return cleaned;
}

/**
 * 情绪光照修正
 * @param {string} emotion 情绪关键词
 * @returns {string} 明亮史诗光照描述
 */
function getBrightLighting(emotion) {
  return EMOTION_LIGHTING_MAP[emotion] || '双日暮光暖金色调，光影层次丰富，画面通透壮阔';
}

module.exports = {
  DARK_STYLE_BLACKLIST,
  EMOTION_LIGHTING_MAP,
  SCENE_TONE_CORRECTION,
  cleanseDarkStyle,
  getBrightLighting
};