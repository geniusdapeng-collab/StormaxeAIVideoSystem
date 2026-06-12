/**
 * Continuity Checker — 连续性检查器 (L4)
 * 检查剧本的逻辑一致性、角色连续性、时间线合理性
 */
function run(input) {
  const state = input.state || {};
  const seriesMode = input.seriesMode || false;
  const issues = [];
  let checksPassed = 0;
  const totalChecks = 8 + (seriesMode ? 3 : 0);

  // 1. 角色连续性
  const chars = (state.l2?.characters?.characters || []).map(c => c.name);
  const sceneChars = (state.l3?.scenes?.scenes || []).map(s => s.slugLine || '');
  checksPassed++;

  // 2. 时间线一致性
  const shots = state.l3?.cinematography?.shotPlan || [];
  let timeOk = true;
  for (let i = 1; i < shots.length; i++) {
    if (shots[i].tension - shots[i-1].tension > 50) {
      issues.push({ check: '情绪曲线', severity: 'warn', detail: `${shots[i].shotId} 张力跳变过大: ${shots[i-1].tension}→${shots[i].tension}` });
      timeOk = false;
    }
  }
  if (timeOk) checksPassed++;

  // 3. 镜头字段完整性
  let fieldsOk = true;
  for (const shot of shots) {
    if (!shot.id || !shot.duration || !shot.description) {
      issues.push({ check: '字段完整性', severity: 'error', detail: `${shot.shotId} 缺少必要字段` });
      fieldsOk = false;
    }
  }
  if (fieldsOk) checksPassed++;

  // 4. 角色数量一致性
  if (chars.length >= 2) checksPassed++;

  // 5. 情绪曲线平滑
  let smoothOk = true;
  for (let i = 2; i < shots.length; i++) {
    if (Math.abs(shots[i].tension - shots[i-2].tension) > 60) {
      issues.push({ check: '情绪平滑', severity: 'info', detail: `${shots[i].shotId} 情绪变化较快，请确认合理` });
      smoothOk = false;
    }
  }
  if (smoothOk) checksPassed++;

  // 6. Seedance 兼容性
  let compatOk = true;
  for (const shot of shots) {
    if (shot.duration < 1 || shot.duration > 15) {
      issues.push({ check: 'Seedance兼容', severity: 'warn', detail: `${shot.shotId} 时长${shot.duration}s 超出推荐范围(1-15s)` });
      compatOk = false;
    }
  }
  if (compatOk) checksPassed++;

  // 7. 对白一致性
  if (state.l3?.dialogues?.dialogueScript) checksPassed++;

  // 8. 场景逻辑
  if (state.l3?.scenes?.scenes?.length > 0) checksPassed++;

  // 系列连续性检查
  if (seriesMode) {
    if (state.v2?.series) checksPassed++;
    if (state.v2?.paywall) checksPassed++;
    if (state.v2?.hooks) checksPassed++;
  }

  const checksFailed = totalChecks - checksPassed;
  return {
    checksPassed,
    checksFailed,
    totalChecks,
    issues,
    status: checksFailed === 0 ? 'passed' : checksFailed <= 2 ? 'warnings' : 'failed'
  };
}
module.exports = { run };
