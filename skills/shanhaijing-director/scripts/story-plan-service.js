// scripts/story-plan-service.js
// 统一 story-plan 的读写和 shots 拉平
const path = require('path');
const { readJSONSafe, writeJSONSafe } = require('./pipeline-helpers');

function getStoryPlanPath(productionDir) {
  return path.join(productionDir, '01-story', 'story-plan.json');
}

function loadStoryPlan(productionDir, fallback = null) {
  return readJSONSafe(getStoryPlanPath(productionDir), fallback);
}

function saveStoryPlan(productionDir, storyPlan) {
  return writeJSONSafe(getStoryPlanPath(productionDir), storyPlan);
}

function flattenShots(storyPlan) {
  if (!storyPlan) return [];
  if (Array.isArray(storyPlan.shots) && storyPlan.shots.length > 0) return storyPlan.shots;

  const shots = [];
  for (const segment of storyPlan.segments || []) {
    shots.push(...(segment.shots || []));
  }
  return shots;
}

// 🆕 Phase 3: 对齐 director-pipeline._getStoryPlanStatus() 行为
function getStoryPlanStatus(productionDir, resultsStoryPlan = null) {
  // 🆕 v6.11-Peng-fix: 优先使用in-memory版本(含Stage 7.5 dialogues更新),否则降级到磁盘
  let storyPlan = resultsStoryPlan || loadStoryPlan(productionDir, null);
  if (!storyPlan) return null;

  const segments = storyPlan.segments || [];
  const shots = flattenShots(storyPlan);
  const characters = storyPlan.characters || [];

  return {
    exists: true,
    storyPlan,
    segments,
    shots,
    characters,
    shotCount: shots.length,
    segmentCount: segments.length
  };
}

function normalizeActsToSegments(storyPlan) {
  if (!storyPlan) return storyPlan;
  const needsConversion = storyPlan.acts && (!storyPlan.segments || storyPlan.segments.length === 0);
  if (!needsConversion) return storyPlan;

  storyPlan.segments = storyPlan.acts.map((act, idx) => ({
    ...act,
    id: act.id || `act-${idx + 1}`,
    name: act.name || `Act ${idx + 1}`,
    shots: act.shots || []
  }));
  return storyPlan;
}

module.exports = {
  getStoryPlanPath,
  loadStoryPlan,
  saveStoryPlan,
  flattenShots,
  normalizeActsToSegments,
  getStoryPlanStatus
};
