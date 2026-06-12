/**
 * stage8-rhythm.js
 * Stage 8.2 节奏强化 - 从 director-pipeline.js 抽取
 * 调用: await stage8_RhythmIntensification(pipeline)
 */
const path = require('path');
const { getStoryPlanStatus } = require('./story-plan-service');
const { writeTextSafe } = require('./pipeline-helpers');

async function stage8_RhythmIntensification(pipeline) {
  console.log(`\n🎵 Stage 8.2: 节奏强化 (v1.0-Peng 短剧快剪模式)`);

  const spStatus = getStoryPlanStatus(pipeline.productionDir, pipeline.results.storyPlan);
  if (!spStatus) {
    pipeline._log({ message: '无story-plan,跳过节奏强化', emoji: '⚠️' });
    return;
  }
  const { storyPlan, shots: spShots } = spStatus;

  try {
    const { intensifyRhythm } = require('./rhythm-intensifier.js');
    const useShortDrama = pipeline.options.shortDramaMode !== false;

    // 🆕 v6.11-Peng-fix2: intensifyRhythm期望shots数组,不是storyPlan对象
    const shots = spShots; // spShots已经是flattenShots()返回的数组
    const result = intensifyRhythm(shots, {
      shortDrama: useShortDrama,
      debug: pipeline.options.verbose || false
    });

    pipeline.results.rhythmIntensification = {
      applied: true,
      mode: useShortDrama ? 'short-drama' : 'standard',
      stats: result.stats
    };

    if (result.report) {
      const reportPath = path.join(pipeline.productionDir, '03-shots', 'rhythm-intensification-report.txt');
      writeTextSafe(reportPath, result.report);
    }

    console.log(`  ✅ 节奏强化完成: ${result.stats?.shotsIntensified || 0} 个镜头已强化`);
  } catch (error) {
    pipeline.errors.push({ stage: 'rhythm-intensification', error: error.message });
    console.warn(`  ⚠️ 节奏强化失败: ${error.message}, 跳过`);
  }
}

module.exports = { stage8_RhythmIntensification };
