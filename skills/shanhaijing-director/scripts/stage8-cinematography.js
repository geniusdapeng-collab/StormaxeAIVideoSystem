/**
 * stage8-cinematography.js
 * Stage 8.1 运镜控制 - 从 director-pipeline.js 抽取
 * 调用: await stage8_Cinematography(pipeline)
 */
const path = require('path');
const { getStoryPlanStatus } = require('./story-plan-service');
const { extractBalancedJSON } = require('./pipeline-helpers');
const {
  buildShotCinematographyContext,
  formatLLMCinematography,
  localCinematography
} = require('./stage8-support');

async function stage8_Cinematography(pipeline) {
  pipeline.currentStage = 'cinematography-control';
  console.log(`\n🎥 阶段8/12: 运镜控制 (LLM电影级运镜生成 v6.3-Peng)`);

  const spStatus = getStoryPlanStatus(pipeline.productionDir, pipeline.results.storyPlan);
  if (!spStatus) {
    pipeline._log({ message: '无story-plan,跳过运镜控制', emoji: '⚠️' });
    return;
  }
  const { storyPlan, shots } = spStatus;

  const { LLMReasoningLayer } = require('./llm-reasoning-layer');
  const llmLayer = new LLMReasoningLayer();

  let totalShots = 0;
  for (const segment of storyPlan.segments || []) {
    totalShots += (segment.shots || []).length;
  }

  const cameraMoves = [];

  for (let idx = 0; idx < shots.length; idx++) {
    const shot = shots[idx];
    const shotContext = buildShotCinematographyContext(shot, idx, totalShots, storyPlan, shots);

    const result = await llmLayer.llmReason(
      `你是电影摄影师,为以下镜头生成专业运镜指令。

镜头: ${shotContext}

要求:
- 摄像机运动:推/拉/摇/移/跟/升降/手持/航拍/固定
- 速度:缓慢/中速/快速/高速
- 氛围:史诗/紧张/宁静/动态/电影感
- 景别:极远景/远景/全景/中景/近景/特写/大特写
- 风格:参考: ${shot.type === 'action' ? '动作电影' : shot.type === 'dialogue' ? '剧情片' : '纪录片'}`,
      {
        role: 'cinematographer',
        temperature: 0.4,
        timeout: 30000,
        fallback: () => localCinematography(shot, idx, totalShots)
      }
    );

    if (result && result.result) {
      const jsonStr = extractBalancedJSON(result.result);
      if (jsonStr) {
        try {
          const llmData = JSON.parse(jsonStr);
          const enhancedMove = formatLLMCinematography(llmData);
          cameraMoves.push({ shotId: shot.id, camera: enhancedMove });
          shot.camera = enhancedMove;
        } catch (e) {
          const lr = localCinematography(shot, idx, totalShots);
          cameraMoves.push({ shotId: shot.id, camera: lr });
          shot.camera = lr;
        }
      } else {
        const lr = localCinematography(shot, idx, totalShots);
        cameraMoves.push({ shotId: shot.id, camera: lr });
        shot.camera = lr;
      }
    } else {
      const lr = localCinematography(shot, idx, totalShots);
      cameraMoves.push({ shotId: shot.id, camera: lr });
      shot.camera = lr;
    }
  }

  pipeline._inject({ cameraMoves });
  await pipeline._insertOpeningTitleShot();
  await pipeline._analyzeShotSequenceImpact();
  await pipeline._enforceOneshotRequirement();

  if (pipeline.preProductionMode) {
    console.log(`     预生产模式: 运镜控制完成(${cameraMoves.length}个镜头)`);
  }
}

module.exports = { stage8_Cinematography };
