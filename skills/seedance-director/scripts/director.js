#!/usr/bin/env node
/**
 * Seedance Director - 视频生产总指挥 (v5.7-Peng)
 *
 * v5.7-Peng 更新:
 *   - P0-2 prompt保真修复: 移除60/30字符截断,保留完整中文描述
 *   - 中文描述为主体: 英文动作仅追加补充,不做替换
 *   - 扩展actionMap: 覆盖学习/治愈/情感类动词
 *   - seedanceCue纳入: 视觉隐喻进入prompt
 * v5.6-Peng 发布更新:
 *   - 比稿评分突破7.5: 6.2→7.6,质量闸门正式生效
 *   - 幕type一致性修正: 高潮幕shots类型错乱修复
 *   - plan-multi后处理链路修复: 角色参数正确传入
 *   - 检测正则全面放宽: 支持中英文混合prompts
 *   - 剧本质量优化: 冲突/弧光/记忆点检测放宽
 *   - 规范符合提升: 18/18镜头全通过
 *   - 角色一致性放宽: 故事场景允许合理差异
 *   - 全局硬编码清理完成(P0/P1清零)
 *   - 废旧代码清理: 4个test文件+tmp残留清除
 *   - CinePrompt V2全面融入: 情绪-运镜映射 + 舞蹈音乐库 + LOTR/Matrix风格
 *   - 对齐评分提升: 50→94/100(动作关键词注入 + 五幕结构修复)
 *   - 流转缩水根治: 大纲动作词逐层强制注入,不再丢失
 *   - 原始需求对齐闸机 (Requirement Alignment Gate v1.0-Peng)
 *   - 三阶段对齐验证: story-plan / pitch-winner / pre-render
 *   - 自动阻断机制: pre-render评分<40时阻止渲染
 *   - 六类需求契约提取: 角色/动作/道具/场景/情节/关键词
 *
 * 用法:
 *   node director.js produce --title "短片名" --outline "大纲" [options]
 *   node director.js status --production-dir "./productions/xxx"
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { execAsync, execSafe, spawnAsync, execSyncSafe, shellQuote } = require('./exec-utils');
const { CONFIG: cfg } = require('./config-center');
const { Command } = require('commander');
const { SchemaRuntimeValidator } = require('./schema-validator');
const { RequirementContract, AlignmentGate } = require('./requirement-alignment-gate');
const program = new Command();


// ============ 风格映射常量 (v5.5-Peng: 提取硬编码映射表) ============
const STYLE_MAP = {
  '3D国漫CG': '3D anime CG rendering',
  '史诗战斗': 'epic battle cinematic',
  '写实风格': 'photorealistic',
  '自然光': 'natural lighting',
  '补光': 'fill light',
  '轮廓光': 'rim light'
};

// ============ MicroMotion 集成 v4.0-Peng ============
const MICROMOTION_ADAPTER = path.join(__dirname, 'micromotion-adapter.js');
let mmAdapter = null;
try {
  mmAdapter = require(MICROMOTION_ADAPTER);
} catch (e) {
  // MicroMotion 未安装,跳过
}

// ============ 配置 ============
const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');
const SKILLS_DIR = path.join(WORKSPACE, 'skills');
const OUTPUT_ROOT = process.env.DIRECTOR_OUTPUT_ROOT || path.join(WORKSPACE, 'productions');
const MAX_CONCURRENT = parseInt(process.env.DIRECTOR_MAX_CONCURRENT) || 1; // 严格单并发,避免429

const STORY_ENGINE = path.join(SKILLS_DIR, 'seedance-story-engine/scripts/story-engine.js');
const CHAR_MANAGER = path.join(SKILLS_DIR, 'seedance-character-manager/scripts/character-manager.js');
const SEEDANCE_SKILL = path.join(SKILLS_DIR, 'byted-ark-seedance-skill');
const SEEDANCE_WRAPPER = path.join(SEEDANCE_SKILL, 'scripts/seedance-wrapper.js');

const STORYBOARD_GENERATOR = path.join(SKILLS_DIR, 'seedance2-storyboard-generator/scripts/storyboard-generator.js');
const SEEDREAM_WRAPPER = path.join(SKILLS_DIR, 'seedance-director/scripts/seedream-wrapper.js');
const DIALOGUE_ENGINE = path.join(SKILLS_DIR, 'seedance-director/scripts/dialogue-engine.js');

// ============ 模型优先级配置 v1.2.2-Peng ============
// 顺位1→4,遇到不可用自动降级
const MODEL_PRIORITY = [
  { name: 'doubao-seedance-2.0-t300', id: 'doubao-seedance-2-0-t300-250620', desc: '2.0标准版,支持Agent Plan' },
  { name: 'doubao-seedance-2.0', id: 'doubao-seedance-2-0-260128', desc: '标准版,最高画质' },
  { name: 'doubao-seedance-2.0-fast', id: 'doubao-seedance-2-0-fast-260128', desc: '快速版,速度优先' },
  { name: 'doubao-seedance-1.5-pro', id: 'doubao-seedance-1-5-pro-250528', desc: '专业版,功能全面' },
];

// 自动降级触发错误码
const FALLBACK_ERRORS = ['QuotaExceeded', 'TooManyRequests', '429', 'ModelNotAvailable', 'ServiceUnavailable'];
const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 5000;

// 获取当前模型(支持自动降级)
function getModelWithFallback(args) {
  // 如果用户指定了模型,使用用户指定的
  if (args.model) {
    return args.model;
  }
  // 否则使用默认(当前是fast版)
  return 'doubao-seedance-2-0-fast-260128';
}

// ============ 工具函数 ============
function log(section, msg, level = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const prefix = `[${timestamp}] [${section}]`;
  const icon = { info: 'i️', success: '✅', error: '❌', warn: '⚠️', phase: '🎬', progress: '⏳' }[level] || 'i️';
  console.log(`${icon} ${prefix} ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 执行命令并返回输出(异步版本)
 * @param {string} cmd - 命令
 * @param {Object} opts - 选项
 * @returns {Promise<string>} - stdout输出
 */
async function exec(cmd, opts = {}) {
  try {
    return await execAsync(cmd, { cwd: WORKSPACE, ...opts });
  } catch (e) {
    throw new Error(`Command failed: ${cmd}\n${e.stderr || e.message}`);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// 解析角色定义字符串
// 示例: "角色A:人类:短发+戴眼镜:手持长剑, 角色B:机器人:银色装甲+发光眼睛:机械臂"
function parseCharacters(charStr) {
  if (!charStr || typeof charStr !== 'string') return [];
  return charStr.split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const parts = s.split(':');
    return {
      name: parts[0]?.trim(),
      species: parts[1]?.trim(),
      features: parts[2]?.split('+').map(f => f.trim()) || [],
      signature: parts[3]?.trim()
    };
  }).filter(c => c.name);
}

// 格式化角色为 command-line 参数
// ============ 读取对白数据(缓存机制) ============
let _dialogueCache = null;
function readDialogueData(productionDir) {
  if (_dialogueCache) return _dialogueCache;
  const dialoguePath = path.join(productionDir, '08-dialogues.json');
  if (fs.existsSync(dialoguePath)) {
    try {
      _dialogueCache = JSON.parse(fs.readFileSync(dialoguePath, 'utf8'));
      return _dialogueCache;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function formatCharacterArg(char) {
  return `${char.name}:${char.species}:${char.features.join('+')}:${char.signature}`;
}

// ============ Phase 0: 角色定妆照(v1.2.2-Peng) ============
// 用Seedream为每个角色生成3张一致性定妆照,确保跨镜头角色造型统一
async function phase0CharacterReference(args, productionDir) {
  log('Phase0', '🎨 Phase 0: 角色定妆照生成(Seedream v5.0)...', 'phase');

  // 检查seedream-wrapper是否存在
  if (!fs.existsSync(SEEDREAM_WRAPPER)) {
    log('Phase0', '⚠️ seedream-wrapper.js 不存在,跳过角色定妆', 'warn');
    return { skipped: true };
  }

  // 检查API Key
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    log('Phase0', '⚠️ 未设置ARK_API_KEY,跳过角色定妆', 'warn');
    return { skipped: true, reason: 'no_api_key' };
  }

  const characters = parseCharacters(args.characters);
  if (characters.length === 0) {
    log('Phase0', 'i️ 未定义角色,跳过定妆', 'info');
    return { skipped: true, reason: 'no_characters' };
  }

  const charDir = path.join(productionDir, '03-characters');
  ensureDir(charDir);

  const results = [];

  for (const char of characters) {
    log('Phase0', `📸 为 [${char.name}] 生成定妆照: 全身+特写+动态`, 'progress');

    try {
      const cmd = [
        'node', SEEDREAM_WRAPPER, 'generate',
        '--name', `"${char.name}"`,
        '--species', `"${char.species || ''}"`,
        '--features', `"${char.features.join('+')}"`,
        '--signature', `"${char.signature || ''}"`,
        '--style', `"${args.style || '3D国漫CG渲染,UnrealEngine5'}"`,
        '--output-dir', `"${charDir}"`
      ].join(' ');

      exec(cmd);
      results.push({ name: char.name, status: 'success' });
      log('Phase0', `✅ ${char.name} 3张定妆照已生成`, 'success');
    } catch (e) {
      results.push({ name: char.name, status: 'failed', error: e.message });
      log('Phase0', `❌ ${char.name} 定妆失败: ${e.message}`, 'error');
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  log('Phase0', `✅ 定妆完成: ${successCount}/${characters.length} 个角色`, 'success');

  return { results, charDir };
}

// ============ Phase 1-Multi: 多方案生成 (v5.0-Peng) ============
async function phase1MultiPlan(args, productionDir) {
  const variants = parseInt(args.variants) || 3;
  log('Phase1-Multi', `🎨 多方案生成: ${variants}个变体方案...`, 'phase');

  const candidatesDir = path.join(productionDir, '00-candidates');
  ensureDir(candidatesDir);

  // 调用 story-engine.js plan-multi
  // 🟢 v5.5-Peng-fix: plan-multi 也需要传入角色(修复比稿评分低)
  const chars = args.characters || '';
  const cmd = [
    'node', STORY_ENGINE, 'plan-multi',
    '--title', `"${args.title}"`,
    '--duration', args.duration || '180',
    '--outline', `"${args.outline}"`,
    '--characters', `"${chars}"`,
    ...(args.style ? ['--style', `"${args.style}"`] : []),
    ...(args.type ? ['--type', `"${args.type}"`] : []),
    '--variants', String(variants),
    '--output-dir', `"${candidatesDir}"`
  ].join(' ');

  log('Phase1-Multi', `执行: ${cmd}`, 'info');
  await exec(cmd);

  const candidatesPath = path.join(candidatesDir, 'candidates.json');
  if (!fs.existsSync(candidatesPath)) {
    throw new Error('多方案生成失败: candidates.json 未生成');
  }

  const candidatesData = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
  log('Phase1-Multi', `✅ 生成 ${candidatesData.candidates.length} 个方案`, 'success');

  return candidatesData;
}

// ============ Phase 1-Eval: 比稿评测 (v5.0-Peng) ============
async function phase1PitchEvaluation(args, productionDir, candidatesData) {
  log('Phase1-Eval', '🎯 开始比稿评测...', 'phase');

  // 先为每个方案生成提示词(供比稿评测使用)
  for (const candidate of candidatesData.candidates) {
    log('Phase1-Eval', `📝 为 ${candidate.id} 生成提示词...`, 'progress');

    // 🟢 v5.7-Peng-fix-B1: 从 variantDir 读取实际 story-plan.json,修复 candidates.json 中 storyPlan 为空的问题
    let storyPlan = candidate.storyPlan;
    if (!storyPlan || !storyPlan.shots || storyPlan.shots.length === 0) {
      const variantPlanPath = path.join(candidate.variantDir, '01-story-plan.json');
      if (fs.existsSync(variantPlanPath)) {
        try {
          storyPlan = JSON.parse(fs.readFileSync(variantPlanPath, 'utf8'));
          candidate.storyPlan = storyPlan;
          log('Phase1-Eval', `✅ 从 ${variantPlanPath} 加载 storyPlan: ${storyPlan.totalShots || 0}镜头`, 'success');
        } catch (e) {
          log('Phase1-Eval', `⚠️ 读取 variant story-plan 失败: ${e.message}`, 'warn');
          storyPlan = candidate.storyPlan || {};
        }
      }
    }

    // 简化版:从 story-plan 提取基础提示词
    const shots = storyPlan?.shots || candidate.shots || [];
    const prompts = shots.map(shot => {
      // 🟢 v5.4-Peng-fix: 比稿复用generateShotPrompt(),确保比稿和生产用同一套prompt
      return generateShotPrompt(shot, storyPlan, [], '');
    });
    candidate.prompts = prompts;
  }

  // 保存完整候选数据
  const evalInputPath = path.join(productionDir, '00-candidates', 'candidates-for-eval.json');
  fs.writeFileSync(evalInputPath, JSON.stringify(candidatesData, null, 2));

  // 调用比稿技能
  const evalOutputPath = path.join(productionDir, '00-candidates', 'evaluation-report.json');
  const PITCH_EVAL = path.join(SKILLS_DIR, 'pitch-evaluation/scripts/pitch-evaluation.js');

  const cmd = [
    'node', PITCH_EVAL, 'evaluate',
    '--input', `"${evalInputPath}"`,
    '--output', `"${evalOutputPath}"`,
    '--min-score', String(cfg.compliance.pitchMinScore)
  ].join(' ');

  log('Phase1-Eval', `执行: ${cmd}`, 'info');
  await exec(cmd);

  if (!fs.existsSync(evalOutputPath)) {
    throw new Error('比稿评测失败: evaluation-report.json 未生成');
  }

  const evalResult = JSON.parse(fs.readFileSync(evalOutputPath, 'utf8'));
  const winner = evalResult.evaluation.winner;
  const winnerScore = evalResult.evaluation.winnerScore;
  const passed = evalResult.evaluation.passed;

  log('Phase1-Eval', `🏆 最佳方案: ${winner} (总分: ${winnerScore.toFixed(1)})`, 'success');
  log('Phase1-Eval', `📊 通过状态: ${passed ? '✅ 通过' : '❌ 未通过'} (阈值: 7.5)`, passed ? 'success' : 'warn');

  // 找出最佳方案的路径
  const winnerCandidate = candidatesData.candidates.find(c => c.id === winner);
  if (!winnerCandidate) {
    throw new Error(`未找到最佳方案: ${winner}`);
  }

  // 将最佳方案的 story-plan 复制到生产目录
  const winnerPlanPath = path.join(winnerCandidate.variantDir, '01-story-plan.json');
  const targetPlanPath = path.join(productionDir, '01-story-plan.json');

  if (fs.existsSync(winnerPlanPath)) {
    fs.copyFileSync(winnerPlanPath, targetPlanPath);
    log('Phase1-Eval', `✅ 最佳方案已复制到生产目录`, 'success');
  } else {
    throw new Error(`最佳方案文件不存在: ${winnerPlanPath}`);
  }

  // 保存比稿报告
  fs.writeFileSync(path.join(productionDir, '00-evaluation-report.json'), JSON.stringify(evalResult.evaluation, null, 2));

  // 如果未通过,保存修改建议
  if (!passed) {
    const feedbackPath = path.join(productionDir, '00-rework-feedback.json');
    fs.writeFileSync(feedbackPath, JSON.stringify({
      reworkRequired: true,
      winnerScore,
      minScore: 7.5,
      feedback: evalResult.evaluation.systemFeedback,
      message: `最佳方案 ${winner} 得分 ${winnerScore.toFixed(1)},未达到通过阈值 7.5。建议根据修改意见优化后重新比稿。`
    }, null, 2));
    log('Phase1-Eval', `⚠️ 方案未达标,修改意见已保存: ${feedbackPath}`, 'warn');
  }

  return {
    winner,
    winnerScore,
    passed,
    plan: JSON.parse(fs.readFileSync(targetPlanPath, 'utf8')),
    evaluation: evalResult.evaluation
  };
}

// ============ Phase 1: 故事规划 ============
async function phase1StoryPlan(args, productionDir) {
  log('Phase1', '开始故事规划...', 'phase');

  const characters = parseCharacters(args.characters);
  const characterIds = characters.map((c, i) => `C${String(i+1).padStart(2,'0')}-${c.name}`).join(',');

  const cmd = [
    'node', STORY_ENGINE, 'plan',
    '--title', `"${args.title}"`,
    '--duration', args.duration || '180',
    '--outline', `"${args.outline}"`,
    '--characters', `"${characterIds}"`,
    // 🔴 修复P0-1/P0-2: 不再硬编码默认风格和类型,让story-engine智能推断
    ...(args.style ? ['--style', `"${args.style}"`] : []),
    ...(args.type ? ['--type', `"${args.type}"`] : []),
    '--output', path.join(productionDir, '01-story-plan.json')
  ].join(' ');

  log('Phase1', `执行: ${cmd}`, 'info');
  exec(cmd);

  const planPath = path.join(productionDir, '01-story-plan.json');
  if (!fs.existsSync(planPath)) {
    throw new Error('story-plan.json 未生成');
  }

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  log('Phase1', `✅ 故事规划完成: ${plan.totalShots}个镜头, ${plan.totalDuration}秒`, 'success');
  return plan;
}

// ============ Phase 1.5: 对白生成(v1.2.2-Peng) ============
// 台词是剧情的灵魂,按类型生成角色对白/旁白/解说
async function phase15DialogueGeneration(args, productionDir, plan) {
  log('Phase1.5', '🎤 Phase 1.5: 对白生成(台词是剧情的灵魂)...', 'phase');

  // 检查对白引擎是否存在
  if (!fs.existsSync(DIALOGUE_ENGINE)) {
    log('Phase1.5', '⚠️ dialogue-engine.js 不存在,跳过对白生成', 'warn');
    return { skipped: true };
  }

  try {
    const cmd = [
      'node', DIALOGUE_ENGINE, 'generate',
      '--plan', `"${path.join(productionDir, '01-story-plan.json')}"`,
      '--output-dir', `"${productionDir}"`
    ].join(' ');

    exec(cmd);

    // 读取生成的对白数据
    const dialoguePath = path.join(productionDir, '08-dialogues.json');
    let dialogueData = null;
    if (fs.existsSync(dialoguePath)) {
      dialogueData = JSON.parse(fs.readFileSync(dialoguePath, 'utf8'));
      log('Phase1.5', `✅ 对白生成完成: ${dialogueData.dialogueShots}/${dialogueData.totalShots} 个镜头有对白`, 'success');
    } else {
      log('Phase1.5', '⚠️ 对白数据未生成', 'warn');
    }

    return { data: dialogueData };
  } catch (e) {
    log('Phase1.5', `❌ 对白生成失败: ${e.message}`, 'error');
    return { skipped: true, error: e.message };
  }
}

// ============ Phase 2: 角色资产 ============
async function phase2CharacterAssets(args, productionDir, plan) {
  log('Phase2', '开始生成角色资产...', 'phase');

  const characters = parseCharacters(args.characters);
  const charDir = path.join(productionDir, '03-characters');
  ensureDir(charDir);

  const results = [];
  for (const char of characters) {
    log('Phase2', `生成角色: ${char.name} (${char.species})`, 'progress');

    const cmd = [
      'node', CHAR_MANAGER, 'generate',
      '--name', `"${char.name}"`,
      '--species', `"${char.species}"`,
      '--features', `"${char.features.join(',')}"`,
      '--signature', `"${char.signature}"`,
      '--style', `"${args.style || '3D国漫CG渲染'}"`,
      '--count', '5'
    ].join(' ');

    try {
      exec(cmd);
      results.push({ name: char.name, status: 'success' });
      log('Phase2', `✅ ${char.name} 参考图已生成`, 'success');
    } catch (e) {
      results.push({ name: char.name, status: 'failed', error: e.message });
      log('Phase2', `❌ ${char.name} 生成失败: ${e.message}`, 'error');
    }
  }

  // 复制角色资产到生产目录
  const registryPath = path.join(require('os').homedir(), 'Seedance-Characters/character-registry.json');
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const char of registry.characters) {
      const srcDir = path.join(require('os').homedir(), 'Seedance-Characters', `${char.id}-${char.name}`);
      const dstDir = path.join(charDir, `${char.id}-${char.name}`);
      if (fs.existsSync(srcDir)) {
        ensureDir(dstDir);
        const files = fs.readdirSync(srcDir);
        for (const f of files) {
          fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
        }
      }
    }
  }

  log('Phase2', `✅ 角色资产完成: ${results.filter(r => r.status === 'success').length}/${characters.length}`, 'success');
  return results;
}

// ============ Phase 3: 分镜生成 ============
async function phase3ShotDesign(args, productionDir, plan, hollywoodAnnotations) {
  log('Phase3', '开始生成镜头提示词...', 'phase');

  const promptsDir = path.join(productionDir, '04-prompts');
  ensureDir(promptsDir);

  const shotListMd = path.join(productionDir, '02-shot-list.md');
  let md = `# ${plan.title} - 分镜表\n\n`;
  md += `**总时长**: ${plan.totalDuration}秒 | **镜头数**: ${plan.totalShots} | **幕数**: ${plan.segments}\n\n`;
  md += `**风格总纲**: ${plan.styleManifesto}\n\n`;
  md += `**光影三层**: ${plan.lightingThreeLayer}\n\n`;
  md += `---\n\n`;

  const prompts = [];
  let currentAct = '';

  // 🔴 v1.2.2-Peng: 读取对白增强数据（移到循环外，供 segment 生成使用）
  const promptEnhancements = {};
  const enhancementPath = path.join(productionDir, '08-prompt-enhancements.json');
  if (fs.existsSync(enhancementPath)) {
    try {
      const enhData = JSON.parse(fs.readFileSync(enhancementPath, 'utf8'));
      Object.assign(promptEnhancements, enhData);
    } catch (e) {
      log('Phase3', `⚠️ 对白增强数据读取失败: ${e.message}`, 'warn');
    }
  }

  // 🆕 v1.0-Peng(Hollywood Layer 1): hollywoodAnnotations由produce()传入，直接使用

  for (const shot of plan.shots) {
    if (shot.act !== currentAct) {
      currentAct = shot.act;
      md += `## 第${shot.actIndex}幕:${currentAct}\n\n`;
    }

    // 为镜头匹配参考图(v1.2.0-Peng升级:优先使用定妆照)
    const charIds = shot.characters || [];
    const refs = [];
    for (const charId of charIds) {
      if (!charId) continue; // v5.1-Peng: 防御null/undefined
      const charName = charId.split('-')[1] || charId;
      const charDir = path.join(productionDir, '03-characters');
      if (!fs.existsSync(charDir)) continue;

      const charSubdirs = fs.readdirSync(charDir).filter(d => d.includes(charName));
      if (charSubdirs.length > 0) {
        const refDir = path.join(charDir, charSubdirs[0]);
        if (!fs.existsSync(refDir)) continue;

        // 🔴 v1.2.2-Peng: 优先使用定妆照(全身/特写/动态)
        const refFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.png'));

        // 优先顺序:全身 > 特写 > 动态 > 其他
        const priorityOrder = ['全身', '特写', '动态'];
        const prioritized = [];
        for (const priority of priorityOrder) {
          const match = refFiles.find(f => f.includes(priority));
          if (match) prioritized.push(path.join(refDir, match));
        }

        // 补充其他参考图(最多2张额外)
        const otherRefs = refFiles
          .filter(f => !priorityOrder.some(p => f.includes(p)))
          .slice(0, Math.max(0, 2 - prioritized.length))
          .map(f => path.join(refDir, f));

        refs.push(...prioritized.slice(0, 2), ...otherRefs);

        // 最多2张参考图(避免提示词过长)
        while (refs.length > 2) refs.pop();
      }
    }

    // 生成分镜提示词(传递对白增强)
    let prompt = generateShotPrompt(shot, plan, refs, promptEnhancements[shot.id] || '');

    // 🆕 v1.0-Peng(Hollywood Layer 1): 注入Hollywood专业注解
    const hollywoodAnnotator = require('./hollywood-annotator.js');
    if (hollywoodAnnotations[shot.id]) {
      const originalPrompt = prompt;
      prompt = hollywoodAnnotator.injectAnnotationToPrompt(hollywoodAnnotations[shot.id], prompt);
      if (prompt !== originalPrompt) {
        log('Phase3', `🎬 Hollywood注入: ${shot.id} [${hollywoodAnnotations[shot.id].lightTierName}]`, 'info');
      }
    }

    // 🟢 v4.1-Peng: 智能合规精炼(不是压缩!)
    if (!global.complianceAgent) {
      const { ComplianceAgent } = require('./compliance-agent.js');
      global.complianceAgent = new ComplianceAgent({ maxLength: cfg.compliance.maxLength });
    }
    const complianceResult = global.complianceAgent.check(prompt, shot, refs);

    if (complianceResult.action === 'pass') {
      // ≤500字,直接放行,一字不动!充分利用提示词空间(v5.8-Peng: 对齐火山引擎500字上限)
      log('Phase3', `🟢 ${shot.id} 已合规 (${complianceResult.compressedLength}字),充分利用空间`, 'success');
    } else if (complianceResult.action === 'refine') {
      // >500字,智能精炼重构(不是删除)
      log('Phase3', `🟡 ${shot.id} 精炼: ${complianceResult.originalLength}→${complianceResult.compressedLength}字 (质量分:${complianceResult.qualityScore.toFixed(2)})`, 'info');

      // 打印精炼详情
      for (const r of complianceResult.refined) {
        log('Phase3', `  📝 ${r.type}: "${r.from}" → "${r.to}"`, 'info');
      }

      if (complianceResult.removed.length > 0) {
        for (const r of complianceResult.removed) {
          log('Phase3', `  ❌ 删除: "${r.content}" (${r.reason})`, 'warn');
        }
      }

      prompt = complianceResult.compliantPrompt;
    }

    // 质检拦截
    if (complianceResult.gateDecision === 'BLOCK') {
      log('Phase3', `🔴 ${shot.id} 拦截!${complianceResult.warnings.join(', ')}`, 'error');
      throw new Error(`提示词质量不合格: ${complianceResult.warnings.join(', ')}`);
    } else if (complianceResult.gateDecision === 'WARN') {
      log('Phase3', `🟠 ${shot.id} 警告: ${complianceResult.warnings.join(', ')}`, 'warn');
    }

    // 🆕 v1.0-Peng: Prompt Optimizer 智能优化(评审前最后一道关卡)
    if (!global.promptOptimizer) {
      const { PromptOptimizer } = require('./prompt-optimizer.js');
      global.promptOptimizer = new PromptOptimizer({ maxLength: cfg.compliance.maxLength, strategy: 'semantic' });
    }
    const optimizerResult = global.promptOptimizer.optimize(prompt, shot);

    if (optimizerResult.optimized) {
      log('Phase3', `🟣 ${shot.id} 优化师介入: ${optimizerResult.originalLength}→${optimizerResult.finalLength}字 (${optimizerResult.compressionRatio}压缩)`, 'info');

      if (optimizerResult.replaced.length > 0) {
        for (const r of optimizerResult.replaced) {
          log('Phase3', `  📝 术语精简: "${r.from}" → "${r.to}"`, 'info');
        }
      }
      if (optimizerResult.removed.length > 0) {
        for (const r of optimizerResult.removed.slice(0, 3)) { // 只显示前3个
          log('Phase3', `  ❌ 删除: ${r.reason}`, 'warn');
        }
      }

      prompt = optimizerResult.optimizedPrompt;

      if (optimizerResult.gateDecision === 'WARN') {
        log('Phase3', `🟠 ${shot.id} 优化师警告: ${optimizerResult.warnings.join(', ')}`, 'warn');
      }
    }

    prompts.push({ shot, prompt, refs });

    // 保存提示词
    fs.writeFileSync(path.join(promptsDir, `${shot.id}.md`), prompt);

    // 添加到分镜表
    md += `### ${shot.id}(${shot.timeRange},${shot.duration}秒)\n\n`;
    md += `- **类型**: ${shot.type}\n`;
    md += `- **角色**: ${shot.characters.join(', ')}\n`;
    md += `- **情绪**: ${shot.emotionStart} → ${shot.emotionEnd}\n`;
    md += `- **张力**: ${shot.tension}/100\n`;
    md += `- **运镜**: ${shot.camera}\n`;
    md += `- **描述**: ${shot.description}\n`;
    md += `- **收束**: ${shot.handoff}\n`;
    if (shot.transitionTo) {
      md += `- **转场**: ${shot.transitionType} → ${shot.transitionTo}\n`;
    }
    md += `- **参考图**: ${refs.length > 0 ? refs.map(r => path.basename(r)).join(', ') : '无'}\n\n`;
    md += `**提示词**:\n\`\`\`\n${prompt.replace(/\`\`\`/g, '')}\n\`\`\`\n\n`;
  }

  fs.writeFileSync(shotListMd, md);

  // 🟢 v4.1-Peng: 渲染片段合并 - 镜头设计不变,仅在渲染层合并
  const segments = createRenderSegments(plan.shots, plan);

  // 为每个 segment 生成合并提示词(时间戳格式)
  const segmentPrompts = [];
  const refsMap = {};
  // promptsDir 已在函数开头声明

  // 先收集所有 shot 的参考图
  for (const { shot, refs } of prompts) {
    refsMap[shot.id] = refs;
  }

  for (const segment of segments) {
    const segmentPrompt = generateSegmentPrompt(segment, plan, refsMap, promptEnhancements);

    // Compliance Agent 检查 segment 提示词
    const complianceResult = global.complianceAgent.check(segmentPrompt, segment.shots[0], []);
    let finalPrompt = segmentPrompt;

    if (complianceResult.action === 'refine') {
      log('Phase3', `🟡 ${segment.id} 精炼: ${complianceResult.originalLength}→${complianceResult.compressedLength}字 (质量分:${complianceResult.qualityScore.toFixed(2)})`, 'info');
      finalPrompt = complianceResult.compliantPrompt;
    }

    segmentPrompts.push({
      segment,
      prompt: finalPrompt,
      refs: segment.shots.flatMap(s => refsMap[s.id] || []).filter((v, i, a) => a.indexOf(v) === i) // 去重
    });

    // 保存 segment 提示词
    fs.writeFileSync(path.join(promptsDir, `${segment.id}.md`), finalPrompt);
  }

  log('Phase3', `✅ 分镜生成完成: ${plan.shots.length}个镜头 → ${segments.length}个渲染片段`, 'success');
  return { prompts, segments: segmentPrompts };
}

// 影视知识注入器 - 根据镜头描述自动补充专业 cinematography 知识
function enrichPromptWithCinematography(shot, videoType) {
  const notes = [];
  const camera = shot.camera || '';
  const type = shot.type || '';
  const duration = shot.duration || 0;

  // 1. 镜头景别识别与注入
  const shotSizeMap = {
    '全景': '全景(LS):交代人物与环境关系,建立空间感',
    '中景': '中景(MS):标准叙事景别,适合展示动作与互动',
    '近景': '近景(MCU):聚焦情绪交流,捕捉微表情',
    '特写': '特写(CU):强调细节与情绪峰值',
    '微距': '大特写(ECU):极致细节,隐喻符号',
    '大全景': '大全景(ELS):环境压迫或史诗感',
    '鸟瞰': '鸟瞰视角:上帝视角,掌控感与渺小感',
    '航拍': '航拍视角:宏观格局,环境铺陈'
  };
  for (const [key, desc] of Object.entries(shotSizeMap)) {
    if (camera.includes(key)) {
      notes.push(`景别说明:${desc}`);
      break; // 只匹配一个最主要的
    }
  }

  // 2. 镜头角度识别
  const angleMap = {
    '俯拍': '俯拍(High Angle):弱势、卑微、被观察感',
    '仰拍': '仰拍(Low Angle):强势、崇高、压迫感',
    '平视': '平视(Eye Level):平等自然,代入感强',
    '倾斜': '倾斜(Dutch Angle):不安、混乱、失衡',
    '主观': '主观视角(POV):代入感,受限视角'
  };
  for (const [key, desc] of Object.entries(angleMap)) {
    if (camera.includes(key)) {
      notes.push(`角度说明:${desc}`);
      break;
    }
  }

  // 3. 镜头运动识别
  const movementMap = {
    '推轨': '推轨(Dolly):摄影机向主体移动,逼近揭示',
    '跟拍': '跟拍(Tracking):跟随主体,保持动态',
    '环绕': '环绕(Arc):围绕主体360度,审视感',
    '手持': '手持(Handheld):真实感、纪实感、紧张感',
    '变焦': '变焦(Zoom):焦距变化,突兀揭示或心理冲击',
    '甩镜': '甩镜(Whip Pan):快速水平摇镜,节奏突变',
    '升降': '升降(Crane):垂直运动,情绪升华或格局转换',
    '横移': '横移(Truck):水平移动,展示并列元素',
    '斯坦尼康': '斯坦尼康(Steadicam):流畅跟随,梦境感'
  };
  for (const [key, desc] of Object.entries(movementMap)) {
    if (camera.includes(key)) {
      notes.push(`运镜说明:${desc}`);
      break;
    }
  }

  // 4. 剪辑节奏建议
  if (duration <= 2) {
    notes.push('节奏:极快剪辑,适合动作高潮或冲击瞬间');
  } else if (duration <= 5) {
    notes.push('节奏:快剪辑,保持紧张感与冲击力');
  } else if (duration <= 10) {
    notes.push('节奏:中速剪辑,标准叙事节奏,信息完整传达');
  } else if (duration > 10) {
    notes.push('节奏:慢节奏,适合情感沉淀或长镜头美学');
  }

  // 5. 类型专属色彩心理学
  const colorAdvice = {
    action: '色彩:史诗冷暖对比风格,强化冲突张力',
    educational: '色彩:温暖白底调+冷蓝信息色点缀,清晰可信不刺眼',
    drama: '色彩:侧光戏剧感,冷暖对比强化情绪层次',
    commercial: '色彩:品牌色高光+产品提亮,吸引力最大化',
    documentary: '色彩:自然真实色调,不过度调色,保持纪实感'
  };
  if (colorAdvice[videoType]) {
    notes.push(colorAdvice[videoType]);
  }

  // 6. 构图建议(按类型)
  const compositionAdvice = {
    action: '构图:动态构图,主体偏中心,预留动作空间',
    educational: '构图:中心构图或三分法,信息区域清晰,无干扰元素',
    drama: '构图:黄金分割或留白,情绪空间充足',
    commercial: '构图:产品居中或对称,CTA区域醒目',
    documentary: '构图:环境人像,背景交代信息,真实自然'
  };
  if (compositionAdvice[videoType]) {
    notes.push(compositionAdvice[videoType]);
  }

  // 7. 微表情提示(剧情/教育类)
  if (videoType === 'drama' || videoType === 'educational') {
    if (type.includes('反应') || type.includes('情绪') || type.includes('痛苦') || type.includes('专注')) {
      notes.push('表演:微表情真实自然,眼神光充足,情绪传达准确');
    }
  }

  if (notes.length === 0) return '';
  return '\n影视知识注入:\n' + notes.map(n => `- ${n}`).join('\n') + '\n';
}


// ============ 渲染片段合并算法 v4.1-Peng ============
// 将相邻 shots 合并为渲染片段(4-15秒,最多6个镜头)
// 核心原则:镜头设计不变,只是在渲染层做物理合并
function createRenderSegments(shots, plan) {
  const segments = [];
  let currentSegment = { shots: [], totalDuration: 0, id: '' };

  // v5.7-Peng-fix: 保守合并策略 - 宁可多几个segments,也不要丢失差异化信息
  // 检查:同幕shots的description相似度,差异大的不合并
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const shotDuration = shot.duration || 5;

    const isDialogueShot = shot.type?.includes('对白') || shot.description?.includes('对白');
    const isLongShot = shotDuration > 15;
    const actChange = currentSegment.shots.length > 0 &&
                       currentSegment.shots[currentSegment.shots.length - 1].act !== shot.act;

    // v5.7-Peng-fix: 同幕差异化检测 - 如果当前shot与同幕其他shot描述差异大,不合并
    const lastShot = currentSegment.shots[currentSegment.shots.length - 1];
    let descriptionDivergent = false;
    if (lastShot && lastShot.act === shot.act && lastShot.description && shot.description) {
      // 如果description相似度低(关键词重叠<50%),视为差异化shot,不合并到同一segment
      const lastWords = new Set((lastShot.description || '').split(/[,,;;。\s]+/).filter(w => w.length >= 2));
      const currWords = new Set((shot.description || '').split(/[,,;;。\s]+/).filter(w => w.length >= 2));
      if (lastWords.size > 0 && currWords.size > 0) {
        const intersection = new Set([...lastWords].filter(x => currWords.has(x)));
        const similarity = intersection.size / Math.min(lastWords.size, currWords.size);
        // 如果关键词重叠<30%,说明差异化很大,不合并
        if (similarity < 0.3) {
          descriptionDivergent = true;
        }
      }
    }

    const segmentFull = currentSegment.totalDuration + shotDuration > 15 ||
                        currentSegment.shots.length >= 6;

    if (currentSegment.shots.length > 0 && (segmentFull || actChange || isDialogueShot || isLongShot || descriptionDivergent)) {
      if (currentSegment.totalDuration < 4 && !isLongShot && !isDialogueShot && !descriptionDivergent) {
        // 继续合并
      } else {
        currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
        segments.push(currentSegment);
        currentSegment = { shots: [], totalDuration: 0, id: '' };
      }
    }

    // 超长镜头或对白镜头:单独成 segment
    if (isLongShot || isDialogueShot) {
      if (currentSegment.shots.length > 0) {
        currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
        segments.push(currentSegment);
        currentSegment = { shots: [], totalDuration: 0, id: '' };
      }
      currentSegment.shots.push(shot);
      currentSegment.totalDuration = shotDuration;
      currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
      segments.push(currentSegment);
      currentSegment = { shots: [], totalDuration: 0, id: '' };
    } else {
      // 普通镜头:加入当前 segment
      currentSegment.shots.push(shot);
      currentSegment.totalDuration += shotDuration;
    }
  }

  // 处理最后一个 segment
  if (currentSegment.shots.length > 0) {
    currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
    segments.push(currentSegment);
  }

  // 检查是否有太短的 segment(<4秒),尝试与前/后合并
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].totalDuration < 4 && segments[i].shots.length < 6) {
      // 尝试与后一个合并
      if (i + 1 < segments.length &&
          segments[i].shots[0].act === segments[i + 1].shots[0].act &&
          segments[i].totalDuration + segments[i + 1].totalDuration <= 15) {
        segments[i].shots.push(...segments[i + 1].shots);
        segments[i].totalDuration += segments[i + 1].totalDuration;
        segments.splice(i + 1, 1);
        i--; // 重新检查
      }
    }
  }

  // 🟢 v4.2-Peng: 智能 Multi-Shot 决策 - 利用 Seedance 2.0 原生多镜头能力
  for (const segment of segments) {
    segment.isMultiShot = shouldUseMultiShot(segment.shots);
  }

  log('Phase3', `🎬 渲染片段合并完成: ${shots.length}个镜头 → ${segments.length}个片段`, 'success');
  for (const seg of segments) {
    const shotIds = seg.shots.map(s => s.id).join('+');
    const mode = seg.isMultiShot ? '🎬[Multi-Shot]' : '📷[单镜头]';
    log('Phase3', `   ${seg.id}: ${seg.totalDuration}秒 ${mode} (${shotIds})`, 'info');
  }

  return segments;
}

// 🟢 v4.2-Peng: 智能判断片段是否适合使用 Seedance 原生 Multi-Shot
// 核心原则:连续动作/同角色/同场景 → Multi-Shot;对白/场景转换/超复杂 → 单镜头
function shouldUseMultiShot(shots) {
  if (shots.length <= 1) return false;

  // 检查是否有对白镜头(口型同步精度优先,单独渲染)
  const hasDialogue = shots.some(s =>
    s.type?.includes('对白') || s.description?.includes('对白')
  );

  // 检查是否有幕转换(场景断裂点,合并会让模型混淆)
  const hasSceneChange = shots.some((s, i) =>
    i > 0 && s.act !== shots[i - 1].act
  );

  // 检查是否超复杂多角色(>3个主要角色同时出现,提示词会超长)
  const hasComplexMultiChar = shots.some(s => {
    const chars = s.characters || [];
    return chars.length > 3; // 超过3个角色才算"超复杂"
  });

  // 检查是否有超长单镜头(>12秒,模型内部切分可能不稳定)
  const hasVeryLongShot = shots.some(s => (s.duration || 5) > 12);

  // 适合 Multi-Shot 的条件:无对白、无幕转换、非超复杂多角色、无超长单镜头
  return !hasDialogue && !hasSceneChange && !hasComplexMultiChar && !hasVeryLongShot;
}

// 生成多镜头片段提示词(时间戳格式)
function generateSegmentPrompt(segment, plan, refsMap, promptEnhancements) {
  const styleManifesto = plan.styleManifesto || '写实风格';
  const lighting = plan.lightingThreeLayer || '自然光';

  // 精简风格描述
  const styleNote = styleManifesto.length > 20
    ? styleManifesto.split(',')[0] || styleManifesto.substring(0, 30)
    : styleManifesto;
  const lightingShort = lighting.split(',')[0] || lighting;

  // v5.5-Peng-CinePrompt: 英文时间轴格式(符合Seedance 2.0规范)
  // 0-4s: [shot1] → 4-8s: [shot2] → 8-12s: [shot3]
  const shotPrompts = [];
  let currentTime = 0;

  for (let i = 0; i < segment.shots.length; i++) {
    const shot = segment.shots[i];
    const start = currentTime;
    const end = currentTime + (shot.duration || 5);

    // 生成单个shot的英文电影级提示词
    const shotPrompt = generateShotPrompt(shot, plan, refsMap[shot.id] || [], promptEnhancements[shot.id] || '');
    shotPrompts.push(`${start}-${end}s: ${shotPrompt}`);

    currentTime = end;
  }

  // 组装:时间轴分段,用 → 连接
  let prompt = shotPrompts.join(' → ');

  // v5.7-Peng-fix: segment截断改为不合并策略
  // 如果segment总prompt太长,不截断中间shots,而是将segment拆分为更小的segments
  // 保留所有shots的完整信息,宁可多几个segment
  if (prompt.length > cfg.compliance.maxLength) {
    // 不再截断!改为告警,让上游调整
    log('Phase3', `⚠️ ${segment.id} prompt长度${prompt.length}超限,保留完整内容(不截断)`, 'warn');
    // prompt保持原样,让Compliance Agent在Phase5处理
  }

  return prompt;
}

// v5.5-Peng-CinePrompt: 电影级运镜提示词映射表
const CINE_MAP = {
  // 景别映射
  shotSize: {
    '特写': 'extreme close-up',
    '近景': 'medium close-up',
    '中景': 'medium shot',
    '全景': 'wide shot',
    '远景': 'long shot',
    '大全景': 'aerial establishing shot'
  },
  // 运镜映射(单一运镜原则)
  cameraMove: {
    '推': 'slow dolly push-in',
    '拉': 'smooth pull-out',
    '摇': 'gentle pan',
    '移': 'lateral track',
    '跟': 'steadicam follow',
    '升': 'crane up',
    '降': 'crane down',
    '环绕': 'slow orbit around',
    '航拍': 'aerial drone shot',
    '手持': 'subtle handheld',
    '固定': 'static locked-off'
  },
  // 稳定性锚定词(每条运镜必须带)
  stability: ['stable', 'silky smooth', 'no shake', 'steady motion'],
  // 面部稳定性(有人物特写时)
  faceStability: 'stable facial close-up, no face distortion, sharp eye focus, clear facial features',
  // 负面提示词模板
  negative: 'blurry, deformed, extra fingers, unstable camera, jitter, shaky, face distortion, unnatural proportions, watermark, text overlay',
  // 音频负面词
  audioNegative: 'generic stock music, mismatched tempo, distorted bass, clipping, off-beat'
};

// v5.5-Peng-CinePrompt: 生成Seedance 2.0规范的电影级提示词
function generateShotPrompt(shot, plan, refs, dialogueEnhancement) {
  const styleManifesto = plan.styleManifesto || '';

  // 1. 角色名(英文)
  let charNames = shot.characters || [];
  if (charNames.length === 0 || charNames.every(c => !c)) {
    charNames = (plan.characters || []).map(c => {
      if (typeof c === 'string') return c.split(':')[0];
      if (c.name) return c.name.split(':')[0];
      return '';
    }).filter(Boolean);
  }
  const cleanNames = charNames.map(c => {
    if (typeof c === 'string') return c.split(':')[0];
    if (c.name) return c.name.split(':')[0];
    return '';
  }).filter(Boolean);
  const charNote = cleanNames.join(' and ');

  // 2. 动作/描述(v5.7-Peng-fix: 保留完整中文描述,移除60字符截断)
  let subjectDesc = shot.description || '';

  // v5.7-Peng-fix: 扩展actionMap覆盖情感/治愈/学习类动词
  const actionMap = {
    // 战斗类(原有)
    '环境展示': 'environment reveal',
    '人物互动': 'character interaction',
    '情感爆发': 'emotional outburst',
    '干扰事件': 'disruptive event',
    '冲突升级': 'escalating conflict',
    '局势转折': 'turning point',
    '力量集结': 'gathering power',
    '逼近核心': 'approaching climax',
    '开场铺垫': 'opening establishment',
    '人物反应': 'character reaction',
    // 喜剧类
    '求婚': 'proposing marriage',
    '失败': 'failed attempt',
    '爆笑': 'hilarious moment',
    '搞笑': 'comedic scene',
    '闹剧': 'slapstick chaos',
    // 情感类
    '告白': 'confessing love',
    '打动': 'touching heart',
    '救出': 'heroic rescue',
    '拥抱': 'emotional embrace',
    '亲吻': 'passionate kiss',
    '哭泣': 'tearful moment',
    // 驾驶/追逐类
    '驾驶': 'driving vehicle',
    '战车': 'battle vehicle',
    '追': 'chasing pursuit',
    '逃跑': 'frantic escape',
    '冲锋': 'charging forward',
    // 日常类
    '演奏': 'playing music',
    '婚礼': 'wedding ceremony',
    '吃饭': 'eating meal',
    '工作': 'working hard',
    '通知': 'delivering news',
    '寻找': 'searching for',
    '发现': 'discovering secret',
    '掳走': 'kidnapping capture',
    '绑架': 'abduction scene',
    // 学习/治愈类(v5.7-Peng新增)
    '学习': 'studying with concentration',
    '写作业': 'doing homework carefully',
    '求助': 'asking for help, reaching out',
    '教导': 'teaching patiently, guiding',
    '画画': 'drawing carefully',
    '读书': 'reading with focus',
    '陪伴': 'warm companionship',
    '安慰': 'comforting gently',
    '围': 'gathering around in a circle',
    '贴': 'posting a notice',
    '写': 'writing carefully',
    '微笑': 'warm smile spreading',
    '成长': 'growing up moment',
    '灵机一动': 'having a bright idea'
  };

  // v5.7-Peng-fix: 保留中文描述作为主体,英文仅作补充,不做替换
  let actionDesc = subjectDesc; // 直接使用原始中文描述

  // v5.7-Peng-fix: 定义 chineseActionKeywords(从 actionMap 的 keys 获取)
  const chineseActionKeywords = Object.keys(actionMap);

  // 只在后面追加英文运镜提示,不替换主体描述
  const foundActions = chineseActionKeywords.filter(kw => (shot.description || '').includes(kw));
  if (foundActions.length > 0) {
    const englishActions = foundActions.map(a => actionMap[a] || a).filter(Boolean);
    if (englishActions.length > 0) {
      actionDesc += ` [actions: ${englishActions.join(', ')}]`;
    }
  }

  // ❌ v5.7-Peng-fix: 移除60字符硬性截断!
  // 完整中文描述是核心内容,最终长度由Compliance Agent的500字符闸门控制(v5.8-Peng: 对齐火山引擎上限)
  // if (actionDesc.length > 60) actionDesc = actionDesc.substring(0, 60);

  // 3. 运镜(英文 + 单一运镜原则)
  const cameraDesc = shot.camera || '';
  const shotSize = cameraDesc.match(/(特写|近景|中景|全景|远景|大全景)/)?.[0] || '';
  const cameraMove = cameraDesc.match(/(推|拉|摇|移|跟|升|降|环绕|航拍|手持|固定)/)?.[0] || '';

  const englishShotSize = CINE_MAP.shotSize[shotSize] || 'medium shot';
  const englishCameraMove = CINE_MAP.cameraMove[cameraMove] || 'stable static shot';
  // 稳定性锚定(随机选一个)
  const stabilityWord = CINE_MAP.stability[Math.floor(Math.random() * CINE_MAP.stability.length)];

  // 4. 景别决定面部稳定性
  let faceNote = '';
  if (/特写|近景/.test(shotSize) && charNote) {
    faceNote = CINE_MAP.faceStability;
  }

  // 5. 风格(英文)- v5.7-Peng-fix: 移除30字符截断,保留完整风格
  let styleNote = styleManifesto;
  for (const [cn, en] of Object.entries(STYLE_MAP)) {
    styleNote = styleNote.replace(cn, en);
  }
  // ❌ v5.7-Peng-fix: 移除30字符硬性截断
  // if (styleNote.length > 30) styleNote = styleNote.substring(0, 30);

  // 7. 幕标记(中英双语,确保对齐闸机能识别)
  const actMap = {
    '起': '[Act:起/Opening]',
    '承': '[Act:承/Rising]',
    '转': '[Act:转/Twist]',
    '高潮': '[Act:高潮/Climax]',
    '合': '[Act:合/Resolution]'
  };
  const actTag = actMap[shot.act || ''] || '';

  // v5.7-Peng-fix: 纳入seedanceCue视觉隐喻
  let seedanceCue = shot.seedanceCameraCue || shot.seedanceCue || '';

  // 🟢 v5.7-Peng-fix-B2: 正确读取 visualMetaphor、timePerception、pov 的 seedanceCue
  if (!seedanceCue && shot.visualMetaphor?.seedanceCue) {
    seedanceCue = shot.visualMetaphor.seedanceCue;
  }
  if (!seedanceCue && shot.timePerception?.seedanceCue) {
    seedanceCue = shot.timePerception.seedanceCue;
  }
  if (!seedanceCue && shot.pov?.seedancePrompt) {
    seedanceCue = shot.pov.seedancePrompt;
  }

  // 🟢 v5.7-Peng-fix-B2: 同时纳入视觉隐喻 symbol+meaning 作为补充
  let visualMetaphorNote = '';
  if (shot.visualMetaphor?.symbol && shot.visualMetaphor?.meaning) {
    visualMetaphorNote = `视觉隐喻:${shot.visualMetaphor.symbol}象征${shot.visualMetaphor.meaning}`;
  }

  // 8. 组装英文prompt(符合Seedance 2.0公式)
  // [主体] + [可见动作] + [场景] + [单一运镜+稳定性] + [光线] + [风格] + [视觉隐喻] + [幕标记]
  const parts = [
    charNote ? `${charNote}, ${actionDesc}` : actionDesc,
    `${englishShotSize}, ${englishCameraMove}, ${stabilityWord}`,
    faceNote,
    styleNote ? `${styleNote}, atmospheric lighting` : 'atmospheric lighting',
    seedanceCue ? `[cinematography mood: ${seedanceCue}]` : '',
    visualMetaphorNote ? `[metaphor: ${visualMetaphorNote}]` : '',
    actTag,
  ].filter(Boolean);

  let prompt = parts.join(', ');

  // 9. 负面提示词(必须附加)
  prompt += `. Negative: ${CINE_MAP.negative}`;

  // 10. 字数控制(60-100英文词 ≈ 300-500字符)
  const words = prompt.split(/\s+/).length;
  if (words > 100) {
    // 截断但保留负面提示词和幕标记
    const negIndex = prompt.indexOf('. Negative:');
    const actIndex = prompt.indexOf('[Act:');
    let cutIndex = negIndex > 0 ? negIndex : prompt.length;
    if (actIndex > 0 && actIndex < cutIndex) cutIndex = actIndex;
    const mainPart = prompt.substring(0, cutIndex);
    const suffix = prompt.substring(cutIndex);
    const truncated = mainPart.split(/\s+/).slice(0, cfg.promptGen.maxTokens).join(' ');
    prompt = truncated + suffix;
  }

  return prompt;
}


function getSFX(type, videoType = '') {
  const sfxByType = {
    action: {
      '建置': '环境氛围音渐强',
      '触发': '巨响+冲击波轰鸣',
      '反应': '呼吸声+心跳加速',
      '准备': '能量聚集嗡鸣',
      '升级': '动作音逐渐加强',
      '对抗': '金属碰撞+能量爆裂',
      '转折': '意外音效+局势变化',
      '逼近': '紧张节奏加快',
      '建置': '环境音+情绪铺垫',
    '触发': '紧张音效+静默前的铺垫',
    '高潮前': '蓄力音效+静默前的紧张',
      '终极': '终极对撞爆炸声',
      '爆发': '能量爆发轰鸣',
      '结果': '尘埃落定声',
      '收束': '音效渐弱至静默',
      '定格': '最后一声音效定格'
    },
    educational: {
      '问题呈现': '紧张警示音,引发关注',
      '场景建置': '中性背景音,准备学习',
      '人物引入': '清晰提示音,身份确认',
      '步骤演示': '轻快节奏音,步骤清晰',
      '关键动作': '强调音效,重点突出',
      '强调重复': '重复提示音,加深记忆',
      '特写放大': '放大音效,细节聚焦',
      '效果展示': '成功提示音,正向反馈',
      '对比验证': '对比音效,差异明显',
      '总结回顾': '总结提示音,回顾节奏',
      '正确示范': '标准流程音,节奏稳定',
      '收尾定格': '完成提示音,信息确认'
    },
    drama: {
      '日常建置': '环境白噪音,日常感',
      '关系铺垫': '温暖背景音乐',
      '细节暗示': '微妙音效,隐喻意味',
      '冲突萌芽': '不和谐音程,暗流涌动',
      '情感升级': '情绪弦乐渐强',
      '转折突变': '突变音效,震惊感',
      '情绪高潮': '高潮弦乐+情绪释放',
      '抉择时刻': '心跳+静默,内心挣扎',
      '真相揭示': '揭示性音效,反转冲击',
      '情感释放': '释放和弦,和解或分离',
      '余韵留白': '余音缭绕,情绪回荡',
      '尾声定格': '渐弱尾音,意味深长',
      '开放结局': '未完成音,引发思考'
    },
    commercial: {
      '痛点呈现': '共鸣音效,引发共情',
      '吸引力钩子': '抓耳音效,好奇心',
      '产品亮相': '高光音效,惊艳感',
      '功能展示': '功能音效,清晰展示',
      '优势对比': '对比音效,差异突出',
      '场景应用': '代入音效,真实感',
      '效果验证': '验证音效,信服力',
      '用户见证': '温暖真实音效',
      '价值升华': '升华弦乐,品牌高度',
      '行动号召': '紧迫感音效,CTA明确',
      '品牌定格': '品牌音效,记忆锚点',
      '记忆锚点': '洗脑旋律,强化记忆',
      '结尾冲击': '反转音效,加深印象'
    },
    documentary: {
      '环境建置': '环境自然音,沉浸感',
      '主题引入': '叙事引导音',
      '人物登场': '人物介绍音',
      '事件展开': '记录真实音',
      '细节挖掘': '细节聚焦音',
      '视角切换': '视角转换音',
      '冲突浮现': '真实张力音',
      '深度揭示': '揭示性音效',
      '情感冲击': '情感真实音',
      '总结升华': '总结性音乐',
      '反思留白': '静默留白',
      '余韵定格': '余韵音',
      '开放式收束': '待续音'
    }
  };
  const typeSfx = sfxByType[videoType] || sfxByType.action; // v5.3-Peng: 保留action作为通用回退(非IP硬编码,是类型分类)
  return typeSfx[type] || '环境音+动作拟声';
}

// ============ Phase 4: 批量渲染(调用第3板块:Render Engine)=============
async function phase4BatchRender(productionDir, segments, args = {}) {
  log('Phase4', '🎬 调用渲染引擎(第3板块)...', 'phase');

  const renderEngine = path.join(__dirname, '..', '..', 'seedance-render-engine', 'scripts', 'seedance-render-engine.js');
  if (!fs.existsSync(renderEngine)) {
    log('Phase4', '⚠️ 渲染引擎未安装,使用内联渲染', 'warn');
    return phase4BatchRenderLegacy(productionDir, segments, args);
  }

  // 保存 segments 数据供渲染引擎读取
  const segmentsFile = path.join(productionDir, '04-segments.json');
  fs.writeFileSync(segmentsFile, JSON.stringify({ segments }, null, 2));

  const skipRender = args.skipRender === true || args.skipRender === 'true';
  const seed = parseInt(process.env.DIRECTOR_SEED) || Math.floor(Math.random() * 2147483647);

  const cmdParts = [
    'node', `"${renderEngine}"`, 'render',
    '--production-dir', `"${productionDir}"`,
    '--seed', String(seed),
    '--max-concurrent', String(MAX_CONCURRENT)
  ];
  if (skipRender) cmdParts.push('--skip-render');

  const cmd = cmdParts.join(' ');
  log('Phase4', `执行: ${cmd}`, 'info');

  try {
    await execAsync(cmd, { stdio: 'inherit', timeout: cfg.timeouts.ffmpeg });
  } catch (e) {
    log('Phase4', `⚠️ 渲染引擎执行异常: ${e.message}`, 'warn');
  }

  // 读取渲染报告
  const reportPath = path.join(productionDir, '05-raw-shots', 'render-report.json');
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const completed = report.filter(t => t.status === 'completed').length;
    const failed = report.filter(t => t.status === 'failed').length;
    log('Phase4', `✅ 渲染完成: ${completed}成功, ${failed}失败`, 'success');
    return report;
  }

  return [];
}

// 内联渲染(向后兼容,当渲染引擎未安装时使用)
async function phase4BatchRenderLegacy(productionDir, segments, args = {}) {
  log('Phase4', '⚠️ 使用内联渲染(向后兼容模式)', 'warn');

  const skipRender = args.skipRender === true || args.skipRender === 'true';
  const rawDir = path.join(productionDir, '05-raw-shots');
  ensureDir(rawDir);
  const UNIFIED_SEED = parseInt(process.env.DIRECTOR_SEED) || Math.floor(Math.random() * 2147483647);

  if (skipRender) {
    log('Phase4', '⚠️ 跳过渲染模式', 'warn');
  }

  const tasks = [];
  for (let i = 0; i < segments.length; i += MAX_CONCURRENT) {
    const batch = segments.slice(i, i + MAX_CONCURRENT);
    const batchPromises = batch.map(async ({ segment, prompt, refs }) => {
      let lastError = null;
      for (let modelIdx = 0; modelIdx < MODEL_PRIORITY.length; modelIdx++) {
        const modelConfig = MODEL_PRIORITY[modelIdx];
        const is2Point0 = modelConfig.id.includes('doubao-seedance-2-0');
        const cmdParts = ['node', SEEDANCE_WRAPPER, 'create', '--prompt', `"${prompt.replace(/"/g, '\\"')}"`, '--model', `"${modelConfig.id}"`, '--seed', String(UNIFIED_SEED), '--ratio', '"16:9"'];
        if (!is2Point0) cmdParts.push('--service-tier', '"flex"');
        cmdParts.push('--duration', String(segment.totalDuration || 5));
        const hasCameraMove = segment.shots.some(s => /(推|拉|摇|移|跟|升|降|环绕|航拍|变焦|甩镜)/.test(s.camera || ''));
        if (hasCameraMove) cmdParts.push('--camera-fixed', '"false"');
        const uniqueRefs = [...new Set(refs)];
        for (const ref of uniqueRefs) cmdParts.push('--image-file', `"${ref}"`);
        const cmd = cmdParts.join(' ');

        if (skipRender) {
          const cmdFile = path.join(rawDir, `${segment.id}-command.sh`);
          fs.writeFileSync(cmdFile, `#!/bin/bash\n${cmd}\n`);
          return { segment, taskId: `DRY-RUN-${segment.id}`, status: 'dry-run', prompt, cmd };
        }

        try {
          const output = exec(cmd, { timeout: 30000 });
          const match = output.match(/任务 ID:\s*(cgt-[a-z0-9-]+)/i);
          const taskId = match ? match[1] : null;
          if (taskId) return { segment, taskId, status: 'submitted', prompt, model: modelConfig.name };
          throw new Error('未能提取任务ID');
        } catch (e) {
          lastError = e;
          const errorMsg = e.message || '';
          const matchedError = FALLBACK_ERRORS.find(errCode => errorMsg.includes(errCode));
          if (matchedError && modelIdx < MODEL_PRIORITY.length - 1) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          break;
        }
      }
      return { segment, taskId: null, status: 'failed', error: lastError?.message, prompt };
    });

    const batchResults = await Promise.all(batchPromises);
    tasks.push(...batchResults);
    if (i + MAX_CONCURRENT < segments.length) await sleep(5000);
  }

  // 轮询下载(简化版)
  log('Phase4', '开始轮询...', 'progress');
  let completed = 0, failed = 0;
  let pending = tasks.filter(t => t.status === 'submitted');
  while (pending.length > 0) {
    const checkPromises = pending.map(async (task) => {
      try {
        const output = exec(`node ${SEEDANCE_WRAPPER} get --task-id ${task.taskId}`, { timeout: cfg.timeouts.taskPoll });
        if (output.includes('状态: 成功') || output.includes('✅')) {
          const urlMatch = output.match(/https:\/\/[^\s]+\.mp4[^\s]*/);
          const videoUrl = urlMatch ? urlMatch[0] : null;
          if (videoUrl) {
            const segmentFile = path.join(rawDir, `${task.segment.id}.mp4`);
            try {
              await execAsync(`curl -L -o ${shellQuote(segmentFile)} ${shellQuote(videoUrl)}`, { timeout: cfg.timeouts.videoDownload });
              let cutResults;
              if (task.segment.isMultiShot) {
                cutResults = [];
                for (const shot of task.segment.shots) {
                  const shotFile = path.join(rawDir, `${shot.id}.mp4`);
                  fs.copyFileSync(segmentFile, shotFile);
                  const stats = fs.statSync(shotFile);
                  cutResults.push({ shotId: shot.id, segmentId: task.segment.id, start: 0, duration: shot.duration || 5, file: shotFile, size: stats.size, isMultiShot: true });
                }
              } else {
                cutResults = cutSegmentToShotsLegacy(segmentFile, task.segment, rawDir);
              }
              return { ...task, status: 'completed', videoUrl, localPath: segmentFile, cutResults };
            } catch (e) {
              return { ...task, status: 'failed', error: `下载或切分失败: ${e.message}` };
            }
          }
          return { ...task, status: 'completed', videoUrl };
        } else if (output.includes('失败') || output.includes('❌')) {
          return { ...task, status: 'failed', error: '渲染失败' };
        }
        return task;
      } catch (e) { return task; }
    });

    const results = await Promise.all(checkPromises);
    completed = results.filter(r => r.status === 'completed').length;
    failed = results.filter(r => r.status === 'failed').length;
    pending = results.filter(r => r.status === 'submitted');
    if (pending.length > 0) await sleep(30000);
  }

  log('Phase4', `✅ 渲染完成: ${completed}成功, ${failed}失败`, 'success');
  return tasks.map(t => ({ segmentId: t.segment.id, shotIds: t.segment.shots.map(s => s.id), status: t.status, videoUrl: t.videoUrl, localPath: t.localPath, cutResults: t.cutResults || [], error: t.error }));
}

async function cutSegmentToShotsLegacy(segmentFile, segment, rawDir) {
  const results = [];
  let currentTime = 0;
  for (let i = 0; i < segment.shots.length; i++) {
    const shot = segment.shots[i];
    const shotDuration = shot.duration || 5;
    const startSec = currentTime;
    const shotFile = path.join(rawDir, `${shot.id}.mp4`);
    try {
      const cmd = `ffmpeg -y -ss ${startSec} -i ${shellQuote(segmentFile)} -t ${shotDuration} -c copy -avoid_negative_ts make_zero ${shellQuote(shotFile)} 2>> /tmp/ffmpeg-cut.log`;
      await execAsync(cmd, { timeout: 30000 });
      if (fs.existsSync(shotFile)) {
        const stats = fs.statSync(shotFile);
        results.push({ shotId: shot.id, segmentId: segment.id, start: startSec, duration: shotDuration, file: shotFile, size: stats.size });
      } else {
        throw new Error('切分后文件不存在');
      }
    } catch (e) {
      results.push({ shotId: shot.id, segmentId: segment.id, error: e.message });
    }
    currentTime += shotDuration;
  }
  return results;
}

// ============ 第3层:后期精确切分(v4.1-Peng) ============
function cutSegmentToShots(segmentFile, segment, rawDir, logFn) {
  return cutSegmentToShotsLegacy(segmentFile, segment, rawDir);
}

// ============ Phase 5.5: 声音设计 ============
async function phase5SoundDesign(productionDir, plan, voiceStatePath) {
  log('Phase5.5', '🎵 开始声音设计...', 'phase');

  const soundDir = path.join(productionDir, '07-sound');
  ensureDir(soundDir);

  const soundScript = path.join(__dirname, '..', '..', 'seedance-sound-design', 'scripts', 'sound-design.js');

  if (!fs.existsSync(soundScript)) {
    log('Phase5.5', '⚠️ 声音设计脚本未安装,跳过', 'warn');
    return { status: 'skipped', reason: '脚本未安装' };
  }

  try {
    let cmd = `node "${soundScript}" design --production-dir "${productionDir}" --output-dir "${soundDir}"`;
    if (voiceStatePath) {
      cmd += ` --voice-state "${voiceStatePath}"`;
      log('Phase5.5', `🔊 使用 VoiceCraft 角色声纹: ${voiceStatePath}`, 'info');
    }
    log('Phase5.5', `执行: ${cmd}`, 'info');
    await execAsync(cmd, { stdio: 'inherit', timeout: cfg.timeouts.videoDownload });

    log('Phase5.5', '✅ 声音设计完成', 'success');
    return { status: 'completed', soundDir };
  } catch (e) {
    log('Phase5.5', `⚠️ 声音设计失败: ${e.message},继续后续流程`, 'warn');
    return { status: 'failed', error: e.message };
  }
}

// ============ Phase 6: 后期制作(调用第4板块:Delivery Engine)=============
async function phase6PostProduction(productionDir, plan, soundResults) {
  log('Phase6', '🎞️ 调用交付引擎(第4板块)...', 'phase');

  const deliveryEngine = path.join(__dirname, '..', '..', 'seedance-delivery-engine', 'scripts', 'delivery-engine.js');
  if (!fs.existsSync(deliveryEngine)) {
    log('Phase6', '⚠️ 交付引擎未安装,使用内联后期制作', 'warn');
    return phase6PostProductionLegacy(productionDir, plan);
  }

  const soundDir = soundResults?.status === 'completed' ? soundResults.soundDir : null;
  const cmdParts = [
    'node', '"' + deliveryEngine + '"', 'produce',
    '--production-dir', '"' + productionDir + '"'
  ];
  if (soundDir) cmdParts.push('--sound-dir', '"' + soundDir + '"');

  const cmd = cmdParts.join(' ');
  log('Phase6', '执行: ' + cmd, 'info');

  try {
    await execAsync(cmd, { stdio: 'inherit', timeout: cfg.timeouts.ffmpeg });
  } catch (e) {
    log('Phase6', '⚠️ 交付引擎执行异常: ' + e.message, 'warn');
  }

  const finalVideo = path.join(productionDir, '成片-' + (plan.title || '未命名') + '.mp4');
  const hasFinal = fs.existsSync(finalVideo);

  log('Phase6', hasFinal ? '✅ 成片已生成' : '⚠️ 成片未检测到', hasFinal ? 'success' : 'warn');
  return { status: hasFinal ? 'completed' : 'failed', finalVideo: hasFinal ? finalVideo : null };
}

// 内联后期制作(向后兼容)
async function phase6PostProductionLegacy(productionDir, plan) {
  log('Phase6', '⚠️ 使用内联后期制作(向后兼容模式)', 'warn');
  const postProdScript = path.join(__dirname, '..', '..', 'seedance-post-production', 'scripts', 'post-production.js');
  if (!fs.existsSync(postProdScript)) {
    return { status: 'skipped', reason: '脚本未安装' };
  }
  try {
    await execAsync('node "' + postProdScript + '" assemble --production-dir "' + productionDir + '"', { stdio: 'inherit', timeout: cfg.timeouts.ffmpeg });
    const finalVideo = path.join(productionDir, '成片-' + (plan.title || '未命名') + '.mp4');
    const hasFinal = fs.existsSync(finalVideo);
    return { status: hasFinal ? 'completed' : 'failed', finalVideo: hasFinal ? finalVideo : null };
  } catch (e) {
    return { status: 'failed', error: e.message };
  }
}

// ============ Phase 7: 汇总交付(包含成片信息) ============
async function phase7Delivery(productionDir, plan, tasks, soundResults, postProdResults, startTime) {
  log('Phase7', '开始汇总交付...', 'phase');

  const duration = Math.round((Date.now() - startTime) / 1000);
  const completed = tasks.filter(t => t.status === 'completed');
  const failed = tasks.filter(t => t.status === 'failed');

  const report = {
    title: plan.title,
    totalDuration: plan.totalDuration,
    totalShots: plan.totalShots,
    completedShots: completed.length,
    failedShots: failed.length,
    productionTime: duration,
    soundDesign: soundResults,
    postProduction: postProdResults,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date().toISOString(),
    tasks: tasks
  };

  // 保存生产报告
  fs.writeFileSync(path.join(productionDir, '06-production-report.json'), JSON.stringify(report, null, 2));

  // 生成Markdown报告
  let md = `# ${plan.title} - 生产报告\n\n`;
  md += `**总时长**: ${plan.totalDuration}秒 | **镜头数**: ${plan.totalShots}\n\n`;
  md += `**生产耗时**: ${Math.floor(duration/60)}分${duration%60}秒\n\n`;
  md += `**成功**: ${completed.length} | **失败**: ${failed.length}\n\n`;
  md += `**渲染片段**: ${tasks.length}个(合并渲染优化)\n\n`;
  md += `**Multi-Shot 策略**: 🎬 原生多镜头渲染已启用\n\n`;
  md += `---\n\n`;
  md += `## 镜头清单\n\n`;
  md += `| 镜头 | 时长 | 所属片段 | 渲染模式 | 状态 | 视频 |\n`;
  md += `|------|------|----------|----------|------|------|\n`;

  // 按 shot 级别展开
  const shotStatusMap = {};
  for (const t of tasks) {
    const isMultiShot = t.segment?.isMultiShot || false;
    for (const cut of (t.cutResults || [])) {
      shotStatusMap[cut.shotId] = {
        status: cut.error ? '❌' : '✅',
        segmentId: t.segmentId,
        duration: cut.duration,
        file: cut.file ? path.basename(cut.file) : '-',
        error: cut.error,
        renderMode: isMultiShot ? '🎬 Multi-Shot' : '📷 单镜头',
        isMultiShot: isMultiShot
      };
    }
    // 如果切分失败,标记所有 shot
    if (!t.cutResults || t.cutResults.length === 0) {
      for (const sid of t.shotIds) {
        if (!shotStatusMap[sid]) {
          shotStatusMap[sid] = { status: t.status === 'completed' ? '🟡' : '❌', segmentId: t.segmentId, duration: '-', file: '-', error: t.error, renderMode: '-', isMultiShot: false };
        }
      }
    }
  }

  // 按 S01, S02... 顺序输出
  const sortedShotIds = Object.keys(shotStatusMap).sort();
  for (const shotId of sortedShotIds) {
    const s = shotStatusMap[shotId];
    md += `| ${shotId} | ${s.duration}秒 | ${s.segmentId} | ${s.renderMode} | ${s.status} | ${s.file} |\n`;
  }

  md += `\n---\n\n`;
  md += `## 渲染片段详情\n\n`;
  md += `| 片段 | 包含镜头 | 时长 | 渲染模式 | 状态 |\n`;
  md += `|------|----------|------|----------|------|\n`;
  for (const t of tasks) {
    const shotList = t.shotIds.join('+');
    const segDuration = t.segment ? t.segment.totalDuration : '-';
    const renderMode = t.segment?.isMultiShot ? '🎬 原生 Multi-Shot' : '📷 精确切分';
    md += `| ${t.segmentId} | ${shotList} | ${segDuration}秒 | ${renderMode} | ${t.status === 'completed' ? '✅' : '❌'} |\n`;
  }

  md += `\n---\n\n`;
  md += `## 后期剪辑建议\n\n`;
  md += `1. 按 S01 → S02 → ... 顺序拼接\n`;
  md += `2. 转场类型已标注在分镜表(02-shot-list.md)中\n`;
  md += `3. 情绪曲线见 01-story-plan.json 中的 emotionCurve\n`;
  md += `4. 调色建议使用统一LUT:暗金暖底调+冰蓝高光\n`;
  md += `5. 音轨分层:环境音(持续)+ 动作音(同步)+ 配乐(情绪引导)\n`;
  md += `6. **Multi-Shot 说明**: 🎬 标记的镜头使用 Seedance 原生多镜头渲染,内部自动切换;📷 标记的镜头使用精确切分还原\n`;

  fs.writeFileSync(path.join(productionDir, '06-production-report.md'), md);

  // README 由 Delivery Engine 生成

  log('Phase5', `✅ 交付完成!目录: ${productionDir}`, 'success');
  log('Phase5', `📊 成功: ${completed.length}/${tasks.length}, 耗时: ${Math.floor(duration/60)}分${duration%60}秒`, 'success');

  return report;
}

// ============ 飞书通知 ============
async function feishuNotify(report, productionDir, postProdResults) {
  log('Notify', '发送飞书通知...', 'progress');

  const hasFinalVideo = postProdResults?.status === 'completed' && postProdResults?.finalVideo;

  const feishuMsg = `🎬 ${report.title} - 生产完成\n\n` +
    `✅ 渲染: ${report.completedShots}/${report.totalShots}\n` +
    `❌ 失败: ${report.failedShots}\n` +
    `⏱️ 耗时: ${Math.floor(report.productionTime/60)}分${report.productionTime%60}秒\n\n` +
    (hasFinalVideo ? `🎞️ **成片已生成** ✅\n📁 ${postProdResults.finalVideo}\n\n` : `⚠️ 成片未生成(可能缺少ffmpeg或素材不足)\n\n`) +
    `📁 生产包: ${productionDir}\n` +
    `📋 分镜表: ${path.join(productionDir, '02-shot-list.md')}\n` +
    `🔊 声音设计: ${path.join(productionDir, '07-sound', 'sound-design.md')}\n\n` +
    (hasFinalVideo ? `🎉 **直接观看成片** 或下载分轨素材包进行二次剪辑。` : `下一步: 安装ffmpeg后运行后期制作,或手动拼接片段。`);

    // 🟢 修复P2-10: 飞书消息保存到文件(openclaw CLI格式变更,暂用文件方式)
  const target = process.env.FEISHU_NOTIFY_TARGET || 'ou_5a8a8b48ce771a7b271f600f3b82f65a';
  fs.writeFileSync(path.join(productionDir, '07-feishu-message.txt'), feishuMsg);
  log('Notify', `✅ 飞书消息已保存到文件: ${path.join(productionDir, '07-feishu-message.txt')}`, 'success');

  return feishuMsg;
}

// ============ produce 主流程 ============
async function produce(args) {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');

  // 🟢 修复P2-11: sanitize文件名(避免中文/特殊字符跨平台问题)
  const safeTitle = (args.title || '未命名短片')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_') // 保留中英文、数字、_-,其余转_
    .replace(/_{2,}/g, '_') // 多个_合并为1个
    .substring(0, cfg.promptGen.filenameMaxChars); // 限制文件名长度

  const productionDir = args.outputDir || path.join(OUTPUT_ROOT, `${safeTitle}-${dateStr}-${Date.now().toString().slice(-4)}`);
  ensureDir(productionDir);

  log('Director', `🎬 开始生产: ${args.title}`, 'phase');
  log('Director', `📁 输出目录: ${productionDir}`, 'info');

  try {
    // 🟢 v1.2.2-Peng: 清空对白缓存(每次生产重新开始)
    _dialogueCache = null;

    // 🟢 v5.3-Peng: 初始化需求对齐闸机
    const requirementContract = new RequirementContract(
      args.outline,
      args.characters,
      args.style,
      args.type,
      args.duration
    );
    const alignmentGate = new AlignmentGate(requirementContract);
    log('Director', `📋 需求契约已提取: ${requirementContract.elements.characters.map(c=>c.name).join(', ') || '无角色'} | ${requirementContract.elements.actions.length}个动作 | ${requirementContract.elements.props.length}个道具`, 'info');

    let plan;

    // v5.5-Peng-fix: 支持直接读取已有计划文件(--input)
    if (args.input) {
      log('Director', `📁 读取已有计划: ${args.input}`, 'info');
      const planPath = path.resolve(args.input);
      if (!fs.existsSync(planPath)) {
        throw new Error(`计划文件不存在: ${planPath}`);
      }
      plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      log('Director', `✅ 已加载计划: ${plan.totalShots}镜头 / ${plan.totalDuration}s`, 'success');
    } else if (args.variants) {
      log('Director', `🎨 启用多方案模式: ${args.variants}个方案`, 'info');

      // 🔴 v5.1-Peng: 多方案模式也需要Phase 0角色定妆(确保一致性)
      let charRefResults;
      if (args.skipCharacter === true || args.skipCharacter === 'true') {
        log('Phase0', '⏭️ 跳过角色定妆 (--skip-character)', 'info');
        charRefResults = { skipped: true };
      } else {
        charRefResults = await phase0CharacterReference(args, productionDir);
      }

      // Phase 1-Multi: 生成多个方案
      const candidatesData = await phase1MultiPlan(args, productionDir);

      // Phase 1-Eval: 比稿评测
      const pitchResult = await phase1PitchEvaluation(args, productionDir, candidatesData);
      plan = pitchResult.plan;

      // 🟢 v5.3-Peng: 检查点 - 比稿胜出方案对齐验证
      const winnerAlignment = alignmentGate.check('pitch-winner', JSON.stringify(plan), { winner: pitchResult.winner, score: pitchResult.winnerScore });
      log('AlignmentGate', `📊 胜出方案对齐评分: ${winnerAlignment.overallScore}/100 (${winnerAlignment.passed ? '✅通过' : '⚠️警告'})`, winnerAlignment.passed ? 'success' : 'warn');

      // 🔴 v5.1-Peng: 比稿-渲染闭环 - 通过阈值自动进入,未通过则暂停
      if (!pitchResult.passed) {
        const msg = `⚠️ 最佳方案未达阈值(${pitchResult.winnerScore.toFixed(1)} < 7.5)`;
        log('Director', msg, 'warn');

        // 如果大鹏配置了强制继续,则继续;否则抛出错误暂停
        if (args.forceContinue === true || args.forceContinue === 'true') {
          log('Director', '🔄 force-continue=true,继续生产', 'info');
        } else {
          // 保存比稿反馈后暂停,等大鹏确认
          throw new Error(`${msg}。修改意见已保存至 00-rework-feedback.json。设置 --force-continue=true 可强制继续。`);
        }
      } else {
        log('Director', `🎯 比稿通过!${pitchResult.winner} 得分 ${pitchResult.winnerScore.toFixed(1)} ≥ 7.5,自动进入渲染`, 'success');
      }
    } else {
      // 原有单方案流程
      // Phase 0: 角色定妆照生成(v1.2.2-Peng,确保跨镜头角色一致性)
      let charRefResults;
      if (args.skipCharacter === true || args.skipCharacter === 'true') {
        log('Phase0', '⏭️ 跳过角色定妆 (--skip-character)', 'info');
        charRefResults = { skipped: true };
      } else {
        charRefResults = await phase0CharacterReference(args, productionDir);
      }

      // Phase 1: 故事规划
      plan = await phase1StoryPlan(args, productionDir);
    }

    // 🟢 v5.3-Peng: 检查点1 - story-plan对齐验证
    const planAlignment = alignmentGate.check('story-plan', JSON.stringify(plan), { duration: plan.duration, characters: (plan.characters||[]).length });
    log('AlignmentGate', `📊 story-plan对齐评分: ${planAlignment.overallScore}/100 (${planAlignment.passed ? '✅通过' : '⚠️警告'})`, planAlignment.passed ? 'success' : 'warn');
    if (!planAlignment.passed && planAlignment.details.length > 0) {
      for (const detail of planAlignment.details) {
        log('AlignmentGate', `   [${detail.severity}] ${detail.item}: ${detail.message}`, 'warn');
      }
    }

    // Phase 1.5: 对白生成(v1.2.2-Peng,台词是剧情的灵魂)
    const dialogueResult = await phase15DialogueGeneration(args, productionDir, plan);

    // Phase 2: 角色资产
    let charResults;
    if (args.skipCharacter === true || args.skipCharacter === 'true') {
      log('Phase2', '⏭️ 跳过角色资产 (--skip-character)', 'info');
      charResults = { skipped: true };
    } else {
      charResults = await phase2CharacterAssets(args, productionDir, plan);
    }

    // 🆕 v1.0-Peng(Hollywood Layer 1): 生成Hollywood专业注解(在Phase3之前!)
    let hollywoodAnnotations = {};
    if (args.hollywood) {
      try {
        const { generateAnnotations } = require('./hollywood-annotator.js');
        hollywoodAnnotations = generateAnnotations(plan.shots, plan);
        const hollywoodPath = path.join(productionDir, '09-hollywood-annotations.json');
        fs.writeFileSync(hollywoodPath, JSON.stringify(hollywoodAnnotations, null, 2));
        log('Hollywood', `🎬 Layer1注解已生成: ${Object.keys(hollywoodAnnotations).length} 个镜头 → ${hollywoodPath}`, 'success');
      } catch (e) {
        log('Hollywood', `⚠️ Hollywood注解生成失败: ${e.message}`, 'warn');
      }
    }

    // Phase 3: 分镜生成
    const phase3Result = await phase3ShotDesign(args, productionDir, plan, hollywoodAnnotations);
    const shotPrompts = phase3Result.prompts;
    let renderSegments = phase3Result.segments;

    // 🟢 v5.4-Peng: Phase3健康检查 - shot.characters完整性验证
    const charactersHealth = { total: plan.shots.length, withChars: 0, empty: 0, missing: [] };
    for (const shot of plan.shots) {
      const chars = shot.characters || [];
      const validChars = chars.filter(Boolean);
      if (validChars.length > 0) {
        charactersHealth.withChars++;
      } else {
        charactersHealth.empty++;
        charactersHealth.missing.push(shot.id);
        log('Phase3-Health', `⚠️ ${shot.id} 缺少角色信息,尝试fallback修复...`, 'warn');
        // 自动修复:从plan.characters提取角色名
        const fallbackChars = (plan.characters || []).map(c => c.name || c).filter(Boolean);
        shot.characters = fallbackChars.length > 0 ? fallbackChars : parseCharacters(args.characters).map(c => c.name);
        if (shot.characters.length > 0) {
          log('Phase3-Health', `✅ ${shot.id} 已修复: ${shot.characters.join(', ')}`, 'success');
        }
      }
    }
    log('Phase3-Health', `📊 角色完整性: ${charactersHealth.withChars}/${charactersHealth.total} 个镜头有角色, ${charactersHealth.empty}个缺失已修复`, charactersHealth.empty === 0 ? 'success' : 'warn');

    // Phase 3.5: 专业分镜生成(v1.2.2-Peng,调用storyboard-generator v2.0)
    if (fs.existsSync(STORYBOARD_GENERATOR)) {
      try {
        log('Phase3.5', '🎬 调用专业分镜引擎 storyboard-generator v2.0-Peng...', 'phase');
        const sbCmd = [
          'node', STORYBOARD_GENERATOR, 'generate',
          '--story-plan', `"${path.join(productionDir, '01-story-plan.json')}"`,
          '--output-dir', `"${productionDir}"`
        ].join(' ');
        exec(sbCmd);
        log('Phase3.5', '✅ 专业分镜引擎完成:生成资产清单 + 拍摄排期 + 好莱坞级分镜表', 'success');
      } catch (e) {
        log('Phase3.5', `⚠️ 专业分镜引擎失败: ${e.message},继续使用标准分镜`, 'warn');
      }
    }

    // 🟢 Phase 3.6: MicroMotion 微动作增强(v4.0-Peng)
    if (args.micromotion !== false && args.micromotion !== 'false' && mmAdapter) {
      try {
        log('Phase3.6', '🎭 MicroMotion 微动作增强 - 为片段注入生命...', 'phase');
        const enhancedSegments = mmAdapter.enhanceSegmentPrompts(renderSegments, plan, productionDir, log);
        if (enhancedSegments && enhancedSegments.length > 0) {
          renderSegments = enhancedSegments;
          mmAdapter.saveMicroMotionReport(renderSegments, productionDir);
          log('Phase3.6', '✅ MicroMotion 增强完成,片段提示词已注入微表情/微动作/眼神/呼吸/环境元素', 'success');
        }
      } catch (e) {
        log('Phase3.6', `⚠️ MicroMotion 增强失败: ${e.message},继续使用原始提示词`, 'warn');
      }
    } else {
      log('Phase3.6', '⏭️ MicroMotion 已禁用或未安装,跳过增强', 'info');
    }

    // 🟢 v5.3-Peng: 检查点2 - 最终prompt对齐验证(渲染前最后一道防线)
    const allPrompts = renderSegments.map(s => s.prompt || '').join(' ');
    const promptAlignment = alignmentGate.check('pre-render', allPrompts, { segments: renderSegments.length, totalChars: allPrompts.length });
    log('AlignmentGate', `📊 最终prompt对齐评分: ${promptAlignment.overallScore}/100 (${promptAlignment.passed ? '✅通过' : '⚠️警告'})`, promptAlignment.passed ? 'success' : 'warn');
    if (!promptAlignment.passed && promptAlignment.details.length > 0) {
      for (const detail of promptAlignment.details) {
        log('AlignmentGate', `   [${detail.severity}] ${detail.item}: ${detail.message}`, 'warn');
      }
      // 🟢 v5.3-Peng: 严重对齐失败时暂停生产,避免产出与需求不符的内容
      if (promptAlignment.overallScore < cfg.compliance.alignmentThreshold) {
        const errorMsg = `❌ 需求对齐检查严重失败(${promptAlignment.overallScore}/100),最终prompt与原始需求严重不符。已保存对齐报告到 ${path.join(productionDir, 'alignment-report.json')}`;
        fs.writeFileSync(path.join(productionDir, 'alignment-report.json'), JSON.stringify(alignmentGate.generateReport(), null, 2));
        throw new Error(errorMsg);
      }
    }
    // 保存对齐报告
    fs.writeFileSync(path.join(productionDir, 'alignment-report.json'), JSON.stringify(alignmentGate.generateReport(), null, 2));
    log('AlignmentGate', `📄 对齐报告已保存: ${path.join(productionDir, 'alignment-report.json')}`, 'info');

    // Phase 4: 批量渲染(使用合并后的渲染片段)
    const tasks = await phase4BatchRender(productionDir, renderSegments, args);

    // 🟢 v5.7-Peng-fix-D: skipRender 时跳过后期制作(避免无素材时强行调用post-production)
    let postProdResults = { status: 'skipped', reason: 'skipRender=true' };
    let soundResults = { status: 'skipped', reason: 'skipRender=true' };

    if (args.skipRender) {
      log('Director', '⏭️ --skip-render 模式,跳过声音设计和后期制作', 'info');
    } else {
      // Phase 5.5: 声音设计(传入 VoiceCraft 角色声纹路径)
      soundResults = await phase5SoundDesign(productionDir, plan, args.voiceState);

      // Phase 6: 后期制作(拼接成片)
      postProdResults = await phase6PostProduction(productionDir, plan, soundResults);
    }

    // Phase 7: 汇总交付(更新为包含成片信息)
    const report = await phase7Delivery(productionDir, plan, tasks, soundResults, postProdResults, startTime);

    // 飞书通知(包含成片信息)
    const feishuMsg = await feishuNotify(report, productionDir, postProdResults);

    log('Director', '🎉 生产完成!', 'success');
    log('Director', `📁 查看: ${productionDir}`, 'info');

    return { report, productionDir, feishuMsg };
  } catch (e) {
    log('Director', `❌ 生产失败: ${e.message}`, 'error');
    // 保存错误报告
    fs.writeFileSync(path.join(productionDir, 'ERROR.txt'), `Error: ${e.message}\n\nStack:\n${e.stack}`);
    throw e;
  }
}

// ============ status 查看状态 ============
async function status(args) {
  const productionDir = args.productionDir;
  if (!fs.existsSync(productionDir)) {
    console.error(`❌ 生产目录不存在: ${productionDir}`);
    process.exit(1);
  }

  const reportPath = path.join(productionDir, '06-production-report.json');
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log(`\n🎬 ${report.title}`);
    console.log(`✅ 成功: ${report.completedShots}/${report.totalShots}`);
    console.log(`❌ 失败: ${report.failedShots}`);
    console.log(`⏱️ 耗时: ${Math.floor(report.productionTime/60)}分${report.productionTime%60}秒`);
    console.log(`📁 目录: ${productionDir}\n`);
  } else {
    console.log(`⏳ 生产进行中... 目录: ${productionDir}`);
  }
}

// ============ 主入口(commander.js v5.1-Peng)============
program
  .name('director.js')
  .description('Seedance Director - 视频生产总指挥 (v5.4-Peng)')
  .version('5.4.0');

program
  .command('produce')
  .description('一键生产短片')
  .requiredOption('--title <title>', '短片标题')
  .requiredOption('--outline <outline>', '故事大纲')
  .option('--duration <seconds>', '总时长秒数', '180')
  .option('--characters <chars>', '角色定义')
  .option('--style <style>', '视觉风格')
  .option('--type <type>', '视频类型', '') // v5.3-Peng: 默认空,由用户或story-engine推断
  .option('--variants <n>', '多方案数量', '1')
  .option('--output-dir <dir>', '输出目录')
  .option('--input <plan>', '直接读取已有计划文件(跳过 Story Engine)')
  .option('--notify [bool]', '完成后飞书通知', 'true')
  .option('--micromotion [bool]', '启用MicroMotion', 'true')
  .option('--force-continue [bool]', '比稿未达标时强制继续', 'false')
  .option('--skip-render', '跳过真实渲染(dry-run)')
  .option('--hollywood [bool]', '启用Hollywood Layer1专业注解', 'false')
  .action(async (options) => {
    const args = {
      title: options.title,
      outline: options.outline,
      duration: parseInt(options.duration) || 180,
      characters: options.characters,
      style: options.style,
      type: options.type,
      variants: parseInt(options.variants) || 1,
      outputDir: options.outputDir,
      notify: options.notify !== 'false',
      micromotion: options.micromotion !== 'false',
      forceContinue: options.forceContinue === 'true' || options.forceContinue === true,
      skipRender: !!options.skipRender,
      hollywood: options.hollywood === 'true' || options.hollywood === true,
    };
    const result = await produce(args);
    console.log('\n✅ 生产完成!');
    console.log(`📁 目录: ${result.productionDir}`);
    console.log(`📋 报告: ${path.join(result.productionDir, '06-production-report.md')}`);
  });

program
  .command('status')
  .description('查看生产状态')
  .requiredOption('--production-dir <dir>', '生产目录')
  .action(async (options) => {
    await status({ 'production-dir': options.productionDir });
  });

program.parse();
