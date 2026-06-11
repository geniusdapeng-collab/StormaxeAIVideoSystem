#!/usr/bin/env node
/**
 * 创意打磨Subagent v1.0-Peng
 * 独立运行导演优化 + 编剧优化，避免main session超时
 * 
 * 输入: 通过 --productionDir 参数指定生产目录
 * 输出: 修改后的 story-plan.json + 04-prompts/ + creative-polishing-report.json
 * 
 * 版本: v1.0-Peng | 2026-05-30
 * 所属系统: ShanhaiStory Forge v2.33-Peng
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      if (value !== true) i++;
    }
  }
  return options;
}

async function main() {
  const args = parseArgs();
  // 🆕 v1.1-Peng-fix: 同时支持命令行参数和环境变量
  const productionDir = args.productionDir || process.env.PRODUCTION_DIR;
  
  if (!productionDir) {
    console.error('❌ 缺少 productionDir 参数 (通过 --productionDir 或 PRODUCTION_DIR 环境变量)');
    process.exit(1);
  }
  
  console.log(`[CreativePolishingSubagent] 启动 | 目录: ${productionDir}`);
  
  // 读取输入文件
  const inputPath = path.join(productionDir, '99-reports', 'creative-polishing-input.json');
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 输入文件不存在: ${inputPath}`);
    process.exit(1);
  }
  
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { storyPlan, styleProfile, passThreshold } = input;
  
  // 提取shots和prompts
  const shots = [];
  const prompts = [];
  for (const segment of storyPlan.segments || []) {
    for (const shot of segment.shots || []) {
      shots.push(shot);
      prompts.push({
        shotId: shot.id,
        prompt: shot._generatedPrompt || shot._finalPrompt || shot.prompt || ''
      });
    }
  }
  
  const dialogue = input.dialogue || {};
  
  console.log(`[CreativePolishingSubagent] 镜头数: ${shots.length} | 风格: ${styleProfile || 'cameron'}`);
  
  // 加载Agent
  const DirectorOptimizeAgent = require('./director-optimize-agent');
  const ScriptwriterOptimizer = require('./scriptwriter-optimizer');
  
  const report = {
    timestamp: new Date().toISOString(),
    productionDir,
    directorOptimize: null,
    scriptwriterOptimize: null,
    errors: []
  };
  
  // ========== Stage 1: 导演优化 ==========
  try {
    console.log(`\n[CreativePolishingSubagent] 🎬 导演优化...`);
    const directorAgent = new DirectorOptimizeAgent({
      directorStyle: styleProfile || 'cameron',
      passThreshold: passThreshold || 4.0
    });
    
    const reviewReport = await directorAgent.review({
      storyPlan, shots, prompts, dialogue,
      styleProfile: styleProfile || 'cameron'
    });
    
    report.directorOptimize = {
      score: reviewReport.overallScore,
      passed: reviewReport.passThresholdMet,
      issueCount: reviewReport.issueList?.length || 0,
      llmCall: reviewReport.llmCall || null
    };
    
    console.log(`[CreativePolishingSubagent] 导演优化: ${reviewReport.overallScore.toFixed(1)}/5.0`);
    
    // 导演优化（直接修改shots/prompts）
    if (reviewReport.issueList && reviewReport.issueList.length > 0) {
      console.log(`[CreativePolishingSubagent] 导演优化: ${reviewReport.issueList.length}个问题...`);
      
      // 模拟导演优化（简化版，直接应用规则修复）
      // 注意：完整版需要 _applyDirectorOptimize，但subagent中无法直接调用Pipeline内部方法
      // 这里使用规则引擎修复
      const modifiedCount = applyDirectorFixes(reviewReport, shots, prompts, productionDir);
      
      report.directorOptimize.modifiedCount = modifiedCount;
      console.log(`[CreativePolishingSubagent] 导演优化完成: ${modifiedCount}个shots修复`);
      
      // 重新审片
      const reReviewReport = await directorAgent.review({
        storyPlan, shots, prompts, dialogue,
        styleProfile: styleProfile || 'cameron'
      });
      report.directorOptimize.finalScore = reReviewReport.overallScore;
      console.log(`[CreativePolishingSubagent] 重新审片: ${reReviewReport.overallScore.toFixed(1)}/5.0`);
    }
    
  } catch (error) {
    console.error(`[CreativePolishingSubagent] 导演优化失败: ${error.message}`);
    report.errors.push({ stage: 'director-optimize', error: error.message });
  }
  
  // ========== Stage 2: 编剧优化 ==========
  try {
    console.log(`\n[CreativePolishingSubagent] ✍️ 编剧优化...`);
    const optimizer = new ScriptwriterOptimizer({
      maxChangesPerIteration: 20,
      preservePromptLength: true,
      promptMaxLength: 1650
    });
    
    const reviewReport = report.directorOptimize ? 
      { overallScore: report.directorOptimize.finalScore || report.directorOptimize.score, passThresholdMet: true, issueList: [] } :
      { overallScore: 4.0, passThresholdMet: true, issueList: [] };
    
    const optimizeContext = {
      reviewReport,
      storyPlan,
      shots,
      prompts,
      dialogue
    };
    
    let optimizeResult = null;
    let iteration = 0;
    const maxIterations = 3;
    
    while (iteration < maxIterations) {
      iteration++;
      console.log(`[CreativePolishingSubagent] 编剧优化迭代 ${iteration}/${maxIterations}...`);
      
      optimizeResult = await optimizer.optimize(optimizeContext);
      
      console.log(`[CreativePolishingSubagent] 变更数: ${optimizeResult.changesSummary?.length || 0}`);
      console.log(`[CreativePolishingSubagent] 一致性: ${optimizeResult.consistencyCheck?.passed ? '通过' : '未通过'}`);
      
      if (optimizeResult.consistencyCheck?.passed &&
          optimizeResult.qualityEstimate?.estimatedScore >= (passThreshold || 4.0)) {
        console.log(`[CreativePolishingSubagent] 优化达标，提前收敛`);
        break;
      }
      
      // 更新上下文
      optimizeContext.storyPlan = optimizeResult.optimizedScript?.storyPlan || optimizeContext.storyPlan;
      optimizeContext.shots = optimizeResult.optimizedScript?.shots || optimizeContext.shots;
      optimizeContext.prompts = optimizeResult.optimizedScript?.prompts || optimizeContext.prompts;
      optimizeContext.dialogue = optimizeResult.optimizedScript?.dialogue || optimizeContext.dialogue;
    }
    
    report.scriptwriterOptimize = {
      iterations: iteration,
      changeCount: optimizeResult?.changesSummary?.length || 0,
      llmCall: optimizeResult?.llmCall || null
    };
    
    // 写回优化结果
    if (optimizeResult?.optimizedScript) {
      const optimizedShots = optimizeResult.optimizedScript.shots;
      const optimizedPrompts = optimizeResult.optimizedScript.prompts;
      
      if (optimizedShots && optimizedPrompts) {
        let writtenCount = 0;
        
        for (const segment of storyPlan.segments || []) {
          for (let i = 0; i < (segment.shots || []).length; i++) {
            const shot = segment.shots[i];
            const optimizedShot = optimizedShots.find(s => s.id === shot.id);
            const optimizedPrompt = optimizedPrompts.find(p => p.shotId === shot.id);
            
            if (optimizedShot) {
              if (optimizedShot.description) shot.description = optimizedShot.description;
              if (optimizedShot.emotion) shot.emotion = optimizedShot.emotion;
              if (optimizedShot.camera) shot.camera = optimizedShot.camera;
              writtenCount++;
            }
            
            if (optimizedPrompt && optimizedPrompt.prompt) {
              shot._generatedPrompt = optimizedPrompt.prompt;
              shot._finalPrompt = optimizedPrompt.prompt;
              
              // 写回04-prompts/
              const promptsDir = path.join(productionDir, '04-prompts');
              const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
              if (fs.existsSync(promptFile)) {
                fs.writeFileSync(promptFile, `# ${shot.id} Prompt\n\n\`\`\`\n${optimizedPrompt.prompt}\n\`\`\`\n`, 'utf8');
              }
            }
          }
        }
        
        report.scriptwriterOptimize.writtenCount = writtenCount;
        console.log(`[CreativePolishingSubagent] 写回: ${writtenCount}个shots更新`);
      }
    }
    
    console.log(`[CreativePolishingSubagent] 编剧优化完成: ${iteration}次迭代`);
    
  } catch (error) {
    console.error(`[CreativePolishingSubagent] 编剧优化失败: ${error.message}`);
    report.errors.push({ stage: 'scriptwriter-optimize', error: error.message });
  }
  
  // 持久化storyPlan
  const storyPlanPath = path.join(productionDir, '01-story', 'story-plan.json');
  if (fs.existsSync(storyPlanPath)) {
    fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
  }
  
  // 生成报告
  const reportPath = path.join(productionDir, '99-reports', 'creative-polishing-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`\n[CreativePolishingSubagent] ✅ 完成 | 报告: ${reportPath}`);
  if (report.errors.length > 0) {
    console.log(`[CreativePolishingSubagent] ⚠️ 错误: ${report.errors.length}个`);
  }
}

// 规则引擎导演修复（subagent内简化版）
function applyDirectorFixes(reviewReport, shots, prompts, productionDir) {
  let modifiedCount = 0;
  const fs = require('fs');
  const path = require('path');
  
  for (const issue of reviewReport.issueList || []) {
    const relatedShots = issue.relatedShots || [];
    
    for (const shotId of relatedShots) {
      const shot = shots.find(s => s.id === shotId);
      const promptObj = prompts.find(p => p.shotId === shotId);
      
      if (!shot || !promptObj) continue;
      
      switch (issue.type) {
        case 'continuity':
          if (issue.description.includes('景别')) {
            shot.description = `[景别过渡修复] ${shot.description}`;
            promptObj.prompt = `平滑景别过渡,${promptObj.prompt}`;
          }
          if (issue.description.includes('运镜')) {
            promptObj.prompt = `运镜方向连贯,${promptObj.prompt}`;
          }
          modifiedCount++;
          break;
          
        case 'story':
          if (issue.description.includes('情绪')) {
            shot.description = `${shot.description} [情绪弧线强化: ${issue.suggestion}]`;
            promptObj.prompt = `${promptObj.prompt},情绪递进自然流畅`;
          }
          modifiedCount++;
          break;
          
        case 'visual':
          if (issue.description.includes('构图')) {
            promptObj.prompt = `${promptObj.prompt},构图精准表达情感`;
          }
          modifiedCount++;
          break;
          
        case 'style':
          if (issue.description.includes('光影') || issue.description.includes('色调')) {
            promptObj.prompt = `${promptObj.prompt},光影色调全片统一`;
          }
          modifiedCount++;
          break;
          
        default:
          if (issue.suggestion && issue.suggestion.length < 100) {
            promptObj.prompt = `${promptObj.prompt},${issue.suggestion}`;
            modifiedCount++;
          }
      }
      
      shot._generatedPrompt = promptObj.prompt;
      shot._finalPrompt = promptObj.prompt;
      
      const promptsDir = path.join(productionDir, '04-prompts');
      const promptFile = path.join(promptsDir, `${shotId}-prompt.md`);
      if (fs.existsSync(promptFile)) {
        fs.writeFileSync(promptFile, `# ${shotId} Prompt\n\n\`\`\`\n${promptObj.prompt}\n\`\`\`\n`, 'utf8');
      }
    }
  }
  
  return modifiedCount;
}

main().catch(err => {
  console.error(`[CreativePolishingSubagent] 致命错误: ${err.message}`);
  process.exit(1);
});