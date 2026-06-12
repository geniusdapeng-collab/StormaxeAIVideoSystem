#!/usr/bin/env node
/**
 * Seedance BidEval — 内容比稿技能 v1.0.0-Peng
 * 
 * 从 N 个候选方案中选出最佳方案，并给出修改建议。
 * 核心逻辑：渲染配额是稀缺资源，LLM是无限的。
 * 
 * 用法:
 *   node bid-eval.js evaluate --input <dir> --user-need "<text>" [--output <file>]
 *   node bid-eval.js help
 */

const fs = require('fs');
const path = require('path');

// ============ 工具函数 ============
function log(section, msg, level = 'info') {
  const ts = new Date().toISOString().slice(11, 19);
  const icon = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', phase: '🏆' }[level] || 'ℹ️';
  console.log(`${icon} [${ts}] [${section}] ${msg}`);
}

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '');
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

// ============ 加载子评估器 ============
const evaluators = {};
const evaluatorsDir = path.join(__dirname, 'evaluators');

if (fs.existsSync(evaluatorsDir)) {
  const files = fs.readdirSync(evaluatorsDir).filter(f => f.endsWith('.js'));
  for (const f of files) {
    const name = f.replace('.js', '');
    try {
      evaluators[name] = require(path.join(evaluatorsDir, f));
    } catch (e) {
      log('evaluator', `⚠️ 加载 ${name} 失败: ${e.message}`, 'warn');
    }
  }
}

// ============ 评估配置 ============
const DIMENSIONS = {
  needAlignment:        { name: '需求对齐度',   weight: parseFloat(process.env.BID_WEIGHT_NEED || '0.25'), evaluator: 'need-alignment' },
  scriptQuality:        { name: '剧本质量',     weight: parseFloat(process.env.BID_WEIGHT_SCRIPT || '0.20'), evaluator: 'script-quality' },
  seedanceCompliance:   { name: 'Seedance合规', weight: parseFloat(process.env.BID_WEIGHT_COMPLIANCE || '0.20'), evaluator: 'seedance-compliance' },
  artisticImpact:       { name: '艺术感染力',   weight: parseFloat(process.env.BID_WEIGHT_ARTISTIC || '0.20'), evaluator: 'artistic-impact' },
  // 🆕 v2.6.1-Peng: Prompt实际质量评估（修复 P1：评估与渲染质量脱节）
  promptQuality:        { name: '提示词实际质量', weight: parseFloat(process.env.BID_WEIGHT_PROMPT || '0.15'), evaluator: 'prompt-quality' },
};

// ============ 核心评估逻辑 ============
function evaluatePlan(plan, userNeed, planName) {
  const result = {
    plan: planName,
    totalScore: 0,
    dimensions: {},
    subScores: {},
    feedback: [],
    warnings: [],
    strengths: []
  };

  for (const [dimKey, config] of Object.entries(DIMENSIONS)) {
    const evaluator = evaluators[config.evaluator];
    if (!evaluator) {
      log('evaluate', `⚠️ 评估器 ${config.evaluator} 未找到`, 'warn');
      continue;
    }

    const dimResult = evaluator.evaluate(plan, userNeed);
    result.dimensions[dimKey] = {
      score: dimResult.score,
      weight: config.weight,
      weighted: Math.round(dimResult.score * config.weight * 10) / 10
    };
    result.subScores[dimKey] = dimResult.subScores || {};
    if (dimResult.feedback) result.feedback.push(...dimResult.feedback);
    if (dimResult.warnings) result.warnings.push(...dimResult.warnings);
    if (dimResult.strengths) result.strengths.push(...dimResult.strengths);
  }

  result.totalScore = Object.values(result.dimensions).reduce((sum, d) => sum + d.weighted, 0);
  return result;
}

function runBidEval(inputDir, userNeed, outputPath) {
  log('BidEval', '🏆 内容比稿闸门启动', 'phase');
  log('BidEval', `输入目录: ${inputDir}`, 'info');
  log('BidEval', `用户需求: ${userNeed?.substring(0, 50)}...`, 'info');

  // 读取所有候选方案
  const plans = [];
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) {
    throw new Error(`目录 ${inputDir} 中无 JSON 方案文件`);
  }

  for (const f of files) {
    const filePath = path.join(inputDir, f);
    const plan = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    plans.push({ name: f.replace('.json', ''), plan, path: filePath });
  }

  log('BidEval', `读取 ${plans.length} 个候选方案: ${plans.map(p => p.name).join(', ')}`, 'info');

  // 逐一评估
  const results = [];
  for (const { name, plan } of plans) {
    log('BidEval', `评估 ${name}...`, 'info');
    const score = evaluatePlan(plan, userNeed, name);
    results.push(score);
    log('BidEval', `  ${name} 总分: ${score.totalScore.toFixed(1)}`, score.totalScore >= 70 ? 'success' : 'warn');
  }

  // 排序选出赢家
  results.sort((a, b) => b.totalScore - a.totalScore);
  const winner = results[0];

  log('BidEval', '🏆 比稿结果:', 'phase');
  log('BidEval', `  胜出方案: ${winner.plan}`, 'success');
  log('BidEval', `  总分: ${winner.totalScore.toFixed(1)}/100`, 'success');
  log('BidEval', `  维度得分:`, 'info');
  for (const [dimKey, dim] of Object.entries(winner.dimensions)) {
    log('BidEval', `    ${DIMENSIONS[dimKey].name}: ${dim.score}/100 (权重 ${dim.weight}, 加权 ${dim.weighted})`, 'info');
  }

  // 生成优化建议（基于所有方案的共性问题）
  const feedbackToGenerator = generateFeedbackToGenerator(results, plans);

  const output = {
    winner: winner.plan,
    winnerScore: winner.totalScore,
    timestamp: new Date().toISOString(),
    totalCandidates: plans.length,
    scores: results,
    feedbackToGenerator
  };

  // 输出结果
  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    log('BidEval', `✅ 比稿结果已保存: ${outputPath}`, 'success');
  } else {
    console.log(JSON.stringify(output, null, 2));
  }

  return output;
}

function generateFeedbackToGenerator(results, plans) {
  const feedback = {
    overall: '',
    commonIssues: [],
    perPlan: {},
    suggestions: []
  };

  // 共性问题：所有方案都得分低的维度
  for (const [dimKey, config] of Object.entries(DIMENSIONS)) {
    const avgScore = results.reduce((sum, r) => sum + (r.dimensions[dimKey]?.score || 0), 0) / results.length;
    if (avgScore < 60) {
      feedback.commonIssues.push({
        dimension: DIMENSIONS[dimKey].name,
        avgScore: Math.round(avgScore),
        suggestion: `所有方案在"${DIMENSIONS[dimKey].name}"维度表现不佳，建议针对性优化`
      });
    }
  }

  // 各方案的个性化反馈
  for (const r of results) {
    feedback.perPlan[r.plan] = {
      score: r.totalScore,
      strengths: r.strengths.slice(0, 3),
      weaknesses: r.feedback.slice(0, 5),
      suggestions: generatePlanSuggestions(r)
    };
  }

  // 总体优化建议
  feedback.suggestions = generateOptimizationSuggestions(results);
  feedback.overall = `共评估 ${results.length} 个方案，最优方案得分 ${results[0].totalScore.toFixed(1)}。` +
    (feedback.commonIssues.length > 0 ? ` 共性问题：${feedback.commonIssues.map(i => i.suggestion).join('；')}` : '');

  return feedback;
}

function generatePlanSuggestions(result) {
  const suggestions = [];
  for (const [dimKey, dim] of Object.entries(result.dimensions)) {
    if (dim.score < 70) {
      suggestions.push({
        dimension: DIMENSIONS[dimKey].name,
        score: dim.score,
        issue: result.feedback.filter(f => f.toLowerCase().includes(dimKey.toLowerCase())).join('; ') || `需提升${DIMENSIONS[dimKey].name}`
      });
    }
  }
  return suggestions;
}

function generateOptimizationSuggestions(results) {
  const suggestions = [];
  const loser = results[results.length - 1];
  const winner = results[0];

  if (results.length >= 2) {
    const gap = winner.totalScore - loser.totalScore;
    suggestions.push(`方案间差距 ${gap.toFixed(1)} 分，${gap > 15 ? '差异显著' : '差异较小，建议加大方案差异化'}`);
  }

  suggestions.push(`建议增加方案多样性：不同叙事视角、不同镜头风格、不同情绪基调`);
  suggestions.push(`建议强化角色弧光：确保主角有明显的成长/变化轨迹`);

  return suggestions;
}

// ============ 主入口 ============
function main() {
  const command = process.argv[2];
  const args = parseArgs();

  switch (command) {
    case 'evaluate':
      if (!args.input) {
        console.error('❌ 缺少必要参数: --input <方案目录>');
        process.exit(1);
      }
      if (!args['user-need']) {
        console.error('❌ 缺少必要参数: --user-need "用户需求描述"');
        process.exit(1);
      }
      runBidEval(args.input, args['user-need'], args.output);
      break;

    case 'help':
    default:
      console.log(`
Seedance BidEval — 内容比稿技能 v1.0.0-Peng

用法:
  node bid-eval.js evaluate --input <dir> --user-need "<text>" [--output <file>]
  node bid-eval.js help

命令:
  evaluate    评估多个方案，选出最佳
  help        显示此帮助

evaluate 选项:
  --input       方案目录（包含 plan-01.json, plan-02.json 等）
  --user-need   用户原始需求描述（用于需求对齐度评估）
  --output      输出文件路径（可选，默认输出到控制台）

评测维度:
  需求对齐度(30%)  — 方案与用户需求的语义匹配度
  剧本质量(25%)     — 故事脉络、角色弧光、冲突设计
  Seedance合规(25%) — 提示词长度、6步公式、参数合法性
  艺术感染力(20%)   — 视觉冲击力、情感共鸣、独特性

示例:
  node bid-eval.js evaluate --input "./productions/XXX/bid-plans/" --user-need "制作一个关于亲情治愈的30秒短片" --output "./productions/XXX/bid-result.json"
      `);
  }
}

main();
