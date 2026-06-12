// scripts/pipeline-checkpoint-service.js
// 统一管理 checkpoint 文件的读写与状态更新
const fs = require('fs');
const path = require('path');
const { readJSONSafe, writeJSONSafe } = require('./pipeline-helpers');

function getCheckpointPath(productionDir) {
  return path.join(productionDir, '.checkpoint.json');
}

function loadCheckpoint(productionDir) {
  const p = getCheckpointPath(productionDir);
  return fs.existsSync(p) ? readJSONSafe(p, null) : null;
}

function saveCheckpoint(productionDir, data) {
  const p = getCheckpointPath(productionDir);
  writeJSONSafe(p, data);
  return p;
}

function clearCheckpoint(productionDir) {
  const p = getCheckpointPath(productionDir);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function createEmptyCheckpoint(productionDir) {
  return {
    productionDir,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'new',
    completedStages: [],
    lastCompletedStage: null
  };
}

function markStageCompleted(productionDir, stageKey, extra = {}) {
  const current = loadCheckpoint(productionDir) || createEmptyCheckpoint(productionDir);
  const completedStages = Array.isArray(current.completedStages) ? current.completedStages : [];
  if (!completedStages.includes(stageKey)) completedStages.push(stageKey);

  const nextData = {
    ...current,
    productionDir,
    updatedAt: new Date().toISOString(),
    completedStages,
    lastCompletedStage: stageKey,
    status: 'running',
    ...extra
  };
  saveCheckpoint(productionDir, nextData);
  return nextData;
}

function markPipelinePaused(productionDir, stageKey, reason, extra = {}) {
  const current = loadCheckpoint(productionDir) || createEmptyCheckpoint(productionDir);
  const nextData = {
    ...current,
    productionDir,
    updatedAt: new Date().toISOString(),
    status: 'paused',
    pauseStage: stageKey,
    reason,
    ...extra
  };
  saveCheckpoint(productionDir, nextData);
  return nextData;
}

function markPipelineFailed(productionDir, stageKey, error, extra = {}) {
  const current = loadCheckpoint(productionDir) || createEmptyCheckpoint(productionDir);
  const nextData = {
    ...current,
    productionDir,
    updatedAt: new Date().toISOString(),
    status: 'failed',
    failedStage: stageKey,
    error: typeof error === 'string' ? error : (error?.message || 'unknown error'),
    ...extra
  };
  saveCheckpoint(productionDir, nextData);
  return nextData;
}

function markPipelineCompleted(productionDir, extra = {}) {
  const current = loadCheckpoint(productionDir) || createEmptyCheckpoint(productionDir);
  const nextData = {
    ...current,
    productionDir,
    updatedAt: new Date().toISOString(),
    status: 'completed',
    completedAt: new Date().toISOString(),
    ...extra
  };
  saveCheckpoint(productionDir, nextData);
  return nextData;
}

module.exports = {
  getCheckpointPath,
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
  markStageCompleted,
  markPipelinePaused,
  markPipelineFailed,
  markPipelineCompleted,
  createEmptyCheckpoint
};
