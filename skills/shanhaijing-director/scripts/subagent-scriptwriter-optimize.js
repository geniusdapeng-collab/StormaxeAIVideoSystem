#!/usr/bin/env node
/**
 * 编剧优化Subagent v2.0-Peng
 * 独立运行编剧优化，20分钟超时
 * 
 * 输入: 通过 PRODUCTION_DIR 环境变量指定生产目录
 * 输出: scriptwriter-optimize-report.json + 修改后的story-plan.json + 04-prompts/
 * 
 * 版本: v2.0-Peng | 2026-05-31
 * 所属系统: ShanhaiStory Forge v2.34-Peng
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const productionDir = process.env.PRODUCTION_DIR;
  
  if (!productionDir) {
    console.error('❌ 缺少 PRODUCTION_DIR 环境变量');
    process.exit(1);
  }
  
  console.log(`[ScriptwriterOptimizeSubagent] ✍️ 启动 | 目录: ${productionDir}`);
  
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
  
  console.log(`[ScriptwriterOptimizeSubagent] 镜头数: ${shots.length}`);
  
  // 加载Agent
  const { ScriptwriterOptimizer } = require('./scriptwriter-optimizer');
  
  const report = {
    timestamp: new Date().toISOString(),
    productionDir,
    stage: 'scriptwriter-optimize',
    iterations: 0,
    changeCount: 0,
    writtenCount: 0,
    llmCall: null,
    errors: []
  };
  
  try {
    console.log(`\n[ScriptwriterOptimizeSubagent] ✍️ 编剧优化开始...`);
    const optimizer = new ScriptwriterOptimizer({
      maxChangesPerIteration: 20,
      preservePromptLength: true,
      promptMaxLength: 1650
    });
    
    // 读取导演优化报告（如果存在）
    const directorReportPath = path.join(productionDir, '99-reports', 'director-optimize-report.json');
    let directorScore = 4.0;
    if (fs.existsSync(directorReportPath)) {
      const directorReport = JSON.parse(fs.readFileSync(directorReportPath, 'utf8'));
      directorScore = directorReport.finalScore || directorReport.score || 4.0;
      console.log(`[ScriptwriterOptimizeSubagent] 导演优化评分: ${directorScore.toFixed(1)}/5.0`);
    }
    
    const reviewReport = {
      overallScore: directorScore,
      passThresholdMet: true,
      issueList: []
    };
    
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
      console.log(`[ScriptwriterOptimizeSubagent] 编剧优化迭代 ${iteration}/${maxIterations}...`);
      
      optimizeResult = await optimizer.optimize(optimizeContext);
      
      console.log(`[ScriptwriterOptimizeSubagent] 变更数: ${optimizeResult.changesSummary?.length || 0}`);
      console.log(`[ScriptwriterOptimizeSubagent] 一致性: ${optimizeResult.consistencyCheck?.passed ? '通过' : '未通过'}`);
      
      if (optimizeResult.consistencyCheck?.passed &&
          optimizeResult.qualityEstimate?.estimatedScore >= (passThreshold || 4.0)) {
        console.log(`[ScriptwriterOptimizeSubagent] 优化达标，提前收敛`);
        break;
      }
      
      // 更新上下文
      optimizeContext.storyPlan = optimizeResult.optimizedScript?.storyPlan || optimizeContext.storyPlan;
      optimizeContext.shots = optimizeResult.optimizedScript?.shots || optimizeContext.shots;
      optimizeContext.prompts = optimizeResult.optimizedScript?.prompts || optimizeContext.prompts;
      optimizeContext.dialogue = optimizeResult.optimizedScript?.dialogue || optimizeContext.dialogue;
    }
    
    report.iterations = iteration;
    report.changeCount = optimizeResult?.changesSummary?.length || 0;
    report.llmCall = optimizeResult?.llmCall || null;
    
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
        
        report.writtenCount = writtenCount;
        console.log(`[ScriptwriterOptimizeSubagent] 写回: ${writtenCount}个shots更新`);
      }
    }
    
    console.log(`[ScriptwriterOptimizeSubagent] 编剧优化完成: ${iteration}次迭代`);
    
  } catch (error) {
    console.error(`[ScriptwriterOptimizeSubagent] 编剧优化失败: ${error.message}`);
    report.errors.push({ stage: 'scriptwriter-optimize', error: error.message });
  }
  
  // 持久化storyPlan
  const storyPlanPath = path.join(productionDir, '01-story', 'story-plan.json');
  if (fs.existsSync(storyPlanPath)) {
    fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
  }
  
  // 生成报告
  const reportPath = path.join(productionDir, '99-reports', 'scriptwriter-optimize-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`\n[ScriptwriterOptimizeSubagent] ✅ 完成 | 报告: ${reportPath}`);
  if (report.errors.length > 0) {
    console.log(`[ScriptwriterOptimizeSubagent] ⚠️ 错误: ${report.errors.length}个`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`[ScriptwriterOptimizeSubagent] 致命错误: ${err.message}`);
  process.exit(1);
});