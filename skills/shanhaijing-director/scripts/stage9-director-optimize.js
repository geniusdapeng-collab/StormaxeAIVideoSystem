/**
 * stage9-director-optimize.js
 * Stage 9 导演优化评审 - 从 director-pipeline.js 抽取
 * 调用: await stage9_DirectorOptimize(pipeline)
 */
const path = require('path');
const { getStoryPlanStatus } = require('./story-plan-service');
const { logInfo } = require('./pipeline-logger');

async function stage9_DirectorOptimize(pipeline) {
  pipeline.currentStage = 'director-optimize';
  console.log(`\n🎬 阶段9/12: 导演优化评审 (v6.3-Peng)`);

  const spStatus = getStoryPlanStatus(pipeline.productionDir, pipeline.results.storyPlan);
  if (!spStatus) {
    console.warn(`  ⚠️ 无story-plan,跳过导演优化`);
    return;
  }
  const { storyPlan, shots } = spStatus;

  const directorStyleId = pipeline.results.directorStyleId || 'cinematic';

  try {
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    const result = await llmLayer.llmReason(
      `你是资深导演,评审以下故事计划的导演质量:\n${JSON.stringify(storyPlan).slice(0, 3000)}\n\n风格:${directorStyleId}\n请给出优化建议(JSON):{score,issues:[],suggestions:[]}`,
      { role: 'director', temperature: 0.3, timeout: 60000 }
    );

    if (result?.result) {
      pipeline.results.directorOptimization = { passed: true, result: result.result };
      logInfo('导演优化评审完成');
    } else {
      pipeline.results.directorOptimization = { passed: false, note: 'LLM返回为空' };
    }
  } catch (e) {
    pipeline.errors.push({ stage: 'director-optimize', error: e.message });
    console.warn(`  ⚠️ 导演优化失败: ${e.message}`);
  }

  console.log(`  ✅ Stage 9 完成`);
}

module.exports = { stage9_DirectorOptimize };
