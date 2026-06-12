// scripts/pipeline-resume-support.js
// 统一 checkpoint 恢复机制

function resolveResumePlan(stages, checkpoint, options = {}) {
  if (!Array.isArray(stages) || stages.length === 0) {
    return { mode: 'empty', stagesToRun: [], skippedStages: [] };
  }

  const resumeFromKey = options.resumeFromKey || null;
  const skipCompleted = options.skipCompleted !== false;

  // 1. 显式指定 resumeFromKey 优先级最高
  if (resumeFromKey) {
    const index = stages.findIndex(s => s.key === resumeFromKey);
    if (index === -1) throw new Error(`resumeFromKey 无效: ${resumeFromKey}`);
    return {
      mode: 'resume-from-key',
      resumeFromKey,
      stagesToRun: stages.slice(index),
      skippedStages: stages.slice(0, index).map(s => s.key)
    };
  }

  // 2. 无 checkpoint，正常全量跑
  if (!checkpoint) {
    return { mode: 'fresh-run', stagesToRun: stages, skippedStages: [] };
  }

  const completedStages = new Set(checkpoint.completedStages || []);

  // 3. 已完成则不再执行
  if (checkpoint.status === 'completed') {
    return {
      mode: 'already-completed',
      stagesToRun: [],
      skippedStages: stages.map(s => s.key)
    };
  }

  // 4. paused / failed 状态下，从未完成阶段继续
  if (skipCompleted) {
    const stagesToRun = stages.filter(stage => !completedStages.has(stage.key));
    const skippedStages = stages.filter(stage => completedStages.has(stage.key)).map(s => s.key);
    return {
      mode: checkpoint.status === 'paused' ? 'resume-paused' : 'resume-failed',
      stagesToRun,
      skippedStages
    };
  }

  // 5. 不跳过已完成阶段，则全量重跑
  return { mode: 'rerun-all', stagesToRun: stages, skippedStages: [] };
}

function printResumePlan(plan) {
  console.log(`\n♻️ Resume Plan: ${plan.mode}`);
  if (plan.resumeFromKey) console.log(` 从阶段恢复: ${plan.resumeFromKey}`);
  console.log(` 待执行阶段: ${plan.stagesToRun.map(s => s.key).join(', ') || '无'}`);
  console.log(` 跳过阶段: ${plan.skippedStages.join(', ') || '无'}`);
}

module.exports = { resolveResumePlan, printResumePlan };
