#!/usr/bin/env node
/**
 * 导演优化Subagent v2.1-Peng-fix
 * 独立运行导演优化，20分钟超时
 * 
 * 输入: 通过 PRODUCTION_DIR 环境变量指定生产目录
 * 输出: director-optimize-report.json + 修改后的story-plan.json
 * 
 * 版本: v2.1-Peng-fix | 2026-05-31
 * 所属系统: ShanhaiStory Forge v2.35-Peng
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const productionDir = process.env.PRODUCTION_DIR;
  
  if (!productionDir) {
    console.error('❌ 缺少 PRODUCTION_DIR 环境变量');
    process.exit(1);
  }
  
  console.log(`[DirectorOptimizeSubagent] 🎬 启动 | 目录: ${productionDir}`);
  
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
  
  console.log(`[DirectorOptimizeSubagent] 镜头数: ${shots.length} | 风格: ${styleProfile || 'cameron'}`);
  
  // 加载Agent
  const { DirectorOptimizeAgent } = require('./director-optimize-agent');
  
  const report = {
    timestamp: new Date().toISOString(),
    productionDir,
    stage: 'director-optimize',
    score: null,
    finalScore: null,
    passed: false,
    issueCount: 0,
    modifiedCount: 0,
    llmCall: null,
    errors: []
  };
  
  try {
    console.log(`\n[DirectorOptimizeSubagent] 🎬 导演优化开始...`);
    const directorAgent = new DirectorOptimizeAgent({
      directorStyle: styleProfile || 'cameron',
      passThreshold: passThreshold || 4.0
    });
    
    const reviewReport = await directorAgent.review({
      storyPlan, shots, prompts, dialogue,
      styleProfile: styleProfile || 'cameron'
    });
    
    report.score = reviewReport.overallScore;
    report.passed = reviewReport.passThresholdMet;
    report.issueCount = reviewReport.issueList?.length || 0;
    report.llmCall = reviewReport.llmCall || null;
    
    console.log(`[DirectorOptimizeSubagent] 导演优化评分: ${reviewReport.overallScore.toFixed(1)}/5.0`);
    
    // v2.1-Peng-fix: 导演只做评审，不做粗暴修复
    // 修复工作交给编剧Subagent基于评审报告执行
    if (reviewReport.issueList && reviewReport.issueList.length > 0) {
      console.log(`[DirectorOptimizeSubagent] 发现问题: ${reviewReport.issueList.length}个，已记录到评审报告`);
      console.log(`[DirectorOptimizeSubagent] 修复工作将由编剧Subagent根据评审报告执行`);
      report.modifiedCount = 0; // 导演Subagent不做修改
    } else {
      console.log(`[DirectorOptimizeSubagent] 无问题，无需修复`);
    }
    
    // 不再做重新审片——导演只做一轮评审，编剧Subagent基于该报告优化
    
  } catch (error) {
    console.error(`[DirectorOptimizeSubagent] 导演优化失败: ${error.message}`);
    report.errors.push({ stage: 'director-optimize', error: error.message });
  }
  
  // 持久化storyPlan
  const storyPlanPath = path.join(productionDir, '01-story', 'story-plan.json');
  if (fs.existsSync(storyPlanPath)) {
    fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
  }
  
  // 生成报告
  const reportPath = path.join(productionDir, '99-reports', 'director-optimize-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`\n[DirectorOptimizeSubagent] ✅ 完成 | 报告: ${reportPath}`);
  if (report.errors.length > 0) {
    console.log(`[DirectorOptimizeSubagent] ⚠️ 错误: ${report.errors.length}个`);
    process.exit(1);
  }
}

// 规则引擎导演修复（subagent内简化版）
function applyDirectorFixes(reviewReport, shots, prompts, productionDir) {
  let modifiedCount = 0;
  
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
  console.error(`[DirectorOptimizeSubagent] 致命错误: ${err.message}`);
  process.exit(1);
});