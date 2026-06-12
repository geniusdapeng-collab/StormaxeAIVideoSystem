/**
 * 世界观污染检查器 — Worldview Contamination Detector
 * v2.3-Peng — 确保山海经系列不出现西幻/现代/丧尸等污染元素
 */

const CONTAMINATION_RULES = [
  // 西方奇幻元素
  {
    id: 'WESTERN_FANTASY',
    keywords: ['zombie', 'undead', 'vampire', 'werewolf', 'elf', 'dwarf', 'wizard', 'magic', 'sorcery', 'spell', 'witch', 'necromancer'],
    severity: 'CRITICAL',
    message: '检测到西方奇幻元素（丧尸/吸血鬼/巫师等），山海经系列禁止使用'
  },
  // 现代元素
  {
    id: 'MODERN_ELEMENTS',
    keywords: ['phone', 'car', 'airplane', 'computer', 'internet', 'city', 'building', 'skyscraper', 'street', 'road'],
    severity: 'CRITICAL',
    message: '检测到现代元素（手机/汽车/摩天楼等），山海经系列禁止使用'
  },
  // 语言污染
  {
    id: 'LANGUAGE',
    keywords: ['hello', 'hi', 'ok', 'yes', 'no', 'thank you', 'sorry', 'english', 'western'],
    severity: 'HIGH',
    message: '检测到英文/西方语言，山海经系列应使用中文或不说话'
  },
  // 小G超能力（关键检查）
  {
    id: 'XIAOG_SUPERPOWER',
    keywords: ['XiaoG flying', 'XiaoG magic', 'XiaoG superpower', 'XiaoG casts', 'boy flies', 'boy casting spell', 'child supernatural'],
    severity: 'CRITICAL',
    message: '小G是普通8岁男孩，不能使用飞行/魔法/超能力'
  },
  // 其他人类（需特殊审批）
  {
    id: 'OTHER_HUMANS',
    keywords: ['crowd', 'people', 'villagers', 'soldiers', 'army', 'horde'],
    severity: 'WARNING',
    message: '检测到群集人类，需确认是否符合故事设定（小G应是唯一/主要人类角色）'
  },
  // 血腥暴力
  {
    id: 'GORE',
    keywords: ['blood', 'gore', 'dismember', 'decapitate', 'corpse', 'rotting flesh'],
    severity: 'HIGH',
    message: '检测到血腥元素，山海经系列应保持美学水准，禁止血腥'
  },
  // 西方龙（山海经应使用中国龙）
  {
    id: 'WESTERN_DRAGON',
    keywords: ['western dragon', 'wyvern', 'drake', 'dragon wings', 'fire-breathing dragon'],
    severity: 'CRITICAL',
    message: '检测到西方龙形象，应使用中国龙（应龙/烛龙等）'
  }
];

/**
 * 检查Prompt是否包含世界观污染元素
 * @param {string} prompt — 要检查的Prompt文本
 * @returns {object} — { clean: boolean, violations: array }
 */
function checkWorldviewContamination(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { clean: true, violations: [] };
  }
  
  const promptLower = prompt.toLowerCase();
  const violations = [];
  
  for (const rule of CONTAMINATION_RULES) {
    for (const keyword of rule.keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        violations.push({
          rule: rule.id,
          severity: rule.severity,
          message: rule.message,
          keyword: keyword,
          position: promptLower.indexOf(keyword.toLowerCase())
        });
        break; // 只报告每个规则的第一个匹配
      }
    }
  }
  
  return {
    clean: violations.length === 0,
    violations: violations,
    summary: violations.length > 0 
      ? `发现 ${violations.length} 处污染：${violations.map(v => `[${v.severity}] ${v.rule}`).join(', ')}`
      : '无污染，通过检查'
  };
}

/**
 * 自动修复常见污染（如果可能）
 * @param {string} prompt — 原始Prompt
 * @returns {object} — { fixed: boolean, prompt: string, changes: array }
 */
function autoFixContamination(prompt) {
  let fixed = false;
  let fixedPrompt = prompt;
  const changes = [];
  
  // 修复小G飞行
  if (/XiaoG\s+flying/i.test(fixedPrompt)) {
    fixedPrompt = fixedPrompt.replace(/XiaoG\s+flying/gi, 'XiaoG looking up at the sky');
    changes.push('小G飞行 → 小G仰望天空（普通人不能飞）');
    fixed = true;
  }
  
  // 修复小G使用魔法
  if (/XiaoG\s+(casting|using)\s+magic/i.test(fixedPrompt)) {
    fixedPrompt = fixedPrompt.replace(/XiaoG\s+(casting|using)\s+magic/gi, 'XiaoG watching in amazement');
    changes.push('小G使用魔法 → 小G惊叹观望（普通人不能魔法）');
    fixed = true;
  }
  
  return { fixed, prompt: fixedPrompt, changes };
}

module.exports = {
  checkWorldviewContamination,
  autoFixContamination,
  CONTAMINATION_RULES
};