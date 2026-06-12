/**
 * 🎭 Stage 8.5「台词编剧」系统 v1.0-Peng
 * 
 * 系统级设计原则（非个案定制）：
 * 1. 角色声音分离 — 人类角色 vs 非人类异兽使用完全不同的台词语法
 * 2. 孩童认知逻辑 — 人类孩童台词必须体现天真但触及本质的观察
 * 3. 异兽非语言化 — 异兽"说话"通过环境共振/战吼/能量脉冲，禁用完整人类语法
 * 4. 潜台词强制 — 每句台词必须携带至少一层未直接说出的情感/认知
 * 5. 同质化拦截 — 自动检测并阻止"不...不对..."等 LLM 偷懒模式
 * 6. 旁白零容忍 — 所有台词必须 LIP_SYNC:YES（异兽 LIP_SYNC:NO 但必须有口型情绪描述）
 * 
 * 触发条件：
 * - shot._dialogueMetadata 存在（LLM 已生成初稿）
 * - 或 shot.dialogues 存在（PRD 编剧意图）
 * - 或项目 DIALOGUE_ARCHIVE 中有预设台词
 * 
 * 输出：标准化的 🔴 P0 Dialogue 块，直接注入 Prompt
 */

const fs = require('fs');
const path = require('path');

// ============ 项目台词档案库 ============
// 支持多项目，每个项目独立管理台词
// 键 = 项目名称（与 productions/ 下目录名对应）
const DIALOGUE_ARCHIVE = {};

/**
 * 加载项目台词档案
 * 从 productions/{project}/01-story/dialogue-archive.json 读取
 * 如果不存在，返回空对象
 */
function loadProjectDialogueArchive(projectName) {
  if (DIALOGUE_ARCHIVE[projectName]) {
    return DIALOGUE_ARCHIVE[projectName];
  }
  
  const archivePath = path.join(
    '/root/.openclaw/workspace/productions',
    projectName,
    '01-story',
    'dialogue-archive.json'
  );
  
  if (fs.existsSync(archivePath)) {
    try {
      const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      DIALOGUE_ARCHIVE[projectName] = archive;
      console.log(`  [DialogueScreenwriter] 📚 加载项目台词档案: ${projectName}`);
      return archive;
    } catch (e) {
      console.warn(`  [DialogueScreenwriter] ⚠️ 加载失败 ${projectName}: ${e.message}`);
    }
  }
  
  return {};
}

/**
 * 保存项目台词档案（供人工编剧录入）
 */
function saveProjectDialogueArchive(projectName, archive) {
  const archivePath = path.join(
    '/root/.openclaw/workspace/productions',
    projectName,
    '01-story',
    'dialogue-archive.json'
  );
  
  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2));
  DIALOGUE_ARCHIVE[projectName] = archive;
}

// ============ 台词质检规则引擎 ============

const HOMOGENIZATION_PATTERNS = [
  // LLM 偷懒模式：重复的"不...不对..."
  { pattern: /不\.+不对\.*/, name: '否定重复模式', severity: 'fatal' },
  { pattern: /这\.+不对\.*/, name: '否定重复模式变体', severity: 'fatal' },
  // 空洞的惊叹
  { pattern: /^[啊哦嗯].{0,3}$/, name: '空洞语气词', severity: 'warn' },
  // 重复3次以上的相同句式结构
  { pattern: /(.{5,20}).*\1.*\1/, name: '句式重复3次+', severity: 'error' }
];

const CHILD_LOGIC_RULES = [
  // 孩童不应使用抽象概念，应使用具象比喻
  { test: (text) => /抽象|概念|本质|哲学/.test(text), issue: '孩童台词禁用抽象词汇' },
  // 孩童应使用短句和停顿
  { test: (text) => text.length > 40 && !text.includes('...') && !text.includes('，'), issue: '孩童台词过长，应加入停顿' }
];

const BEAST_VOICE_RULES = [
  // 异兽禁用完整人类语法（主谓宾完整句子）
  { test: (text) => /^[^，。]{3,}[是|在|有|要][^，。]{3,}$/.test(text), issue: '异兽禁用完整人类语法' },
  // 异兽台词应以单字/双字战吼为主
  { test: (text) => text.length > 10 && !text.includes('——'), issue: '异兽战吼过长，应加"——"断句' }
];

/**
 * 质检 LLM 生成的台词初稿
 * 返回 { passed: boolean, issues: [], suggestions: [] }
 */
function qualityCheckDialogue(dialogue, shot) {
  const issues = [];
  const suggestions = [];
  
  if (!dialogue) return { passed: true, issues, suggestions };
  
  const dialogues = Array.isArray(dialogue) ? dialogue : [dialogue];
  
  for (const d of dialogues) {
    const text = d.text || '';
    
    // 同质化检测
    for (const hp of HOMOGENIZATION_PATTERNS) {
      if (hp.pattern.test(text)) {
        issues.push({
          type: 'homogenization',
          severity: hp.severity,
          message: `${hp.name}: "${text}"`,
          suggestion: '参考项目台词档案，使用专业编剧设计的台词'
        });
      }
    }
    
    // 角色类型质检
    const isHumanChild = d.speaker === '小G' || d.speaker?.includes('child');
    const isBeast = d.speaker === '刑天' || d.speaker?.includes('beast') || d.speaker?.includes('神兽');
    
    if (isHumanChild) {
      for (const rule of CHILD_LOGIC_RULES) {
        if (rule.test(text)) {
          issues.push({ type: 'child_logic', severity: 'error', message: rule.issue });
        }
      }
    }
    
    if (isBeast) {
      for (const rule of BEAST_VOICE_RULES) {
        if (rule.test(text)) {
          issues.push({ type: 'beast_voice', severity: 'error', message: rule.issue });
        }
      }
      
      // 异兽必须 LIP_SYNC:NO
      if (d.lipSync === 'YES') {
        issues.push({ type: 'beast_voice', severity: 'fatal', message: '异兽台词必须为 LIP_SYNC:NO' });
      }
    }
    
    // 通用质检：潜台词检查
    if (!d.subtext || d.subtext.length < 10) {
      suggestions.push(`为 "${text}" 补充潜台词（未直接说出的情感/认知）`);
    }
    
    // 通用质检：情绪钩子
    if (!d.hook || d.hook.length < 5) {
      suggestions.push(`为 "${text}" 补充情绪钩子（观众共鸣点）`);
    }
  }
  
  const fatalCount = issues.filter(i => i.severity === 'fatal').length;
  const errorCount = issues.filter(i => i.severity === 'error').length;
  
  return {
    passed: fatalCount === 0 && errorCount === 0,
    issues,
    suggestions,
    fatalCount,
    errorCount
  };
}

// ============ 台词格式化 ============

function formatDialogueBlock(dialogue) {
  if (!dialogue) return '';
  
  if (Array.isArray(dialogue)) {
    return dialogue.map(d => formatSingleDialogue(d)).join(' | ');
  }
  
  return formatSingleDialogue(dialogue);
}

function formatSingleDialogue(d) {
  if (!d) return '';
  return `🔴 P0 Dialogue: - SPEAKER: ${d.speaker} | TYPE: ${d.type} | EMOTION: ${d.emotion} | TEXT: "${d.text}" | LIP_SYNC: ${d.lipSync} | 口型情绪: ${d.lipEmotion}`;
}

// ============ Stage 8.5 主入口 ============

/**
 * Stage 8.5「台词编剧」主函数
 * 
 * @param {Object} shot - 当前镜头
 * @param {Object} plan - 故事计划
 * @param {Object} options - 选项 { useArchive: true, qualityCheck: true }
 * @returns {String} 格式化后的 dialogueBlock 或 ''
 */
function stage8_5_DialogueScreenwriter(shot, plan, options = {}) {
  const projectName = plan?.projectName || plan?.title?.toLowerCase().replace(/\s+/g, '-');
  const shotId = shot.id;
  
  console.log(`  [Stage 8.5] 🎭 台词编剧处理: ${shotId}`);
  
  // 1. 尝试加载项目台词档案
  const archive = projectName ? loadProjectDialogueArchive(projectName) : {};
  const archivedDialogue = archive[shotId];
  
  // 2. 如果档案中有预设台词，直接使用（人工编剧优先）
  if (archivedDialogue !== undefined) {
    console.log(`  [Stage 8.5] 📚 使用项目台词档案: ${shotId}`);
    if (archivedDialogue) {
      const formatted = formatDialogueBlock(archivedDialogue);
      console.log(`  [Stage 8.5] 📝 台词: ${Array.isArray(archivedDialogue) 
        ? archivedDialogue.map(d => d.text).join(' / ') 
        : archivedDialogue.text}`);
      return formatted;
    } else {
      console.log(`  [Stage 8.5] 📝 该镜头无台词（档案显式标记为null）`);
      return '';
    }
  }
  
  // 3. 没有档案，检查 PRD 原始台词定义（shot.dialogues）
  const prdDialogues = shot.dialogues;
  if (prdDialogues && prdDialogues.length > 0) {
    console.log(`  [Stage 8.5] 📚 PRD有台词定义，但档案缺失: ${shotId}`);
    console.log(`  [Stage 8.5] 📝 建议: 将PRD台词录入 ${projectName}/01-story/dialogue-archive.json`);
  }
  
  // 4. 没有档案，检查 LLM 初稿
  const llmDialogue = shot._dialogueMetadata;
  if (!llmDialogue) {
    console.log(`  [Stage 8.5] ℹ️ 无台词需求（无LLM初稿且无档案）`);
    return '';
  }
  
  // 4. 质检 LLM 初稿
  if (options.qualityCheck !== false) {
    const qc = qualityCheckDialogue(llmDialogue, shot);
    
    if (!qc.passed) {
      console.warn(`  [Stage 8.5] ❌ 台词质检未通过: ${shotId}`);
      for (const issue of qc.issues) {
        console.warn(`    [${issue.severity}] ${issue.type}: ${issue.message}`);
      }
      
      // 如果有致命错误，尝试返回空或标记为需要人工编剧
      if (qc.fatalCount > 0) {
        console.error(`  [Stage 8.5] 🚨 致命错误 ${qc.fatalCount} 个，标记需要人工编剧`);
        shot._needsScreenwriter = true;
        return '';
      }
    } else {
      console.log(`  [Stage 8.5] ✅ 台词质检通过`);
    }
  }
  
  // 5. 格式化 LLM 初稿（转换为标准格式）
  // LLM 初稿格式：{ text, shotId, characters, timestamp, renderBy }
  // 需要补充：speaker, type, emotion, lipSync, lipEmotion, subtext, hook
  const speaker = shot.characters?.[0] || '未知角色';
  const formattedLLM = {
    speaker,
    type: 'LLM生成',
    emotion: shot.emotion || '未指定',
    text: llmDialogue.text?.substring(0, 100) || '',
    lipSync: 'YES',
    lipEmotion: '待补充'
  };
  
  console.log(`  [Stage 8.5] ⚠️ 使用LLM初稿（建议补充人工编剧档案）: "${formattedLLM.text}"`);
  return formatSingleDialogue(formattedLLM);
}

// ============ 导出 ============
module.exports = {
  stage8_5_DialogueScreenwriter,
  loadProjectDialogueArchive,
  saveProjectDialogueArchive,
  qualityCheckDialogue,
  formatDialogueBlock,
  HOMOGENIZATION_PATTERNS,
  CHILD_LOGIC_RULES,
  BEAST_VOICE_RULES,
  DIALOGUE_ARCHIVE
};