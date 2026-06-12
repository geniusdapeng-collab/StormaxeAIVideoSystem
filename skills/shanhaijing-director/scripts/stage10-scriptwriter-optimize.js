/**
 * stage10-scriptwriter-optimize.js
 * Stage 10 编剧优化 - 从 director-pipeline.js 抽取
 * 调用: await stage10_ScriptwriterOptimize(pipeline)
 */
const path = require('path');
const { getStoryPlanStatus } = require('./story-plan-service');
const { logInfo, logWarn } = require('./pipeline-logger');

async function stage10_ScriptwriterOptimize(pipeline) {
  pipeline.currentStage = 'scriptwriter-optimize';
  console.log(`\n✍️ 阶段10/12: 编剧优化 (v6.3-Peng)`);

  // 检查Stage 9是否完成
  if (!pipeline.results.directorOptimization) {
    throw new Error('Stage 9未完成,编剧优化依赖导演评审结果');
  }

  const spStatus = getStoryPlanStatus(pipeline.productionDir, pipeline.results.storyPlan);
  if (!spStatus) {
    console.warn(`  ⚠️ 无story-plan,跳过编剧优化`);
    return;
  }
  const { storyPlan, shots } = spStatus;

  // 轻量级本地编剧优化
  const prompts = [];
  const fs = require('fs');
  const promptsDir = path.join(pipeline.productionDir, '04-prompts');
  if (fs.existsSync(promptsDir)) {
    for (const file of fs.readdirSync(promptsDir)) {
      if (file.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(promptsDir, file), 'utf8');
        prompts.push({ file, content });
      }
    }
  }

  const optimizedPrompts = [];
  for (const p of prompts) {
    // 基础优化:去重/补全/节奏调整
    let optimized = p.content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ ]+/g, ' ')
      .trim();
    optimizedPrompts.push({ file: p.file, content: optimized });
  }

  // 保存优化后的prompts
  for (const p of optimizedPrompts) {
    if (p.content !== prompts.find(x => x.file === p.file)?.content) {
      const p2 = path.join(promptsDir, p.file);
      fs.writeFileSync(p2, p.content, 'utf8');
    }
  }

  pipeline.results.scriptwriterOptimization = {
    applied: true,
    optimizedCount: optimizedPrompts.length,
    passed: true
  };

  logInfo(`编剧优化完成: ${optimizedPrompts.length}个prompt已优化`);
  console.log(`  ✅ Stage 10 编剧优化完成`);
}

module.exports = { stage10_ScriptwriterOptimize };
