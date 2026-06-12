// scripts/pipeline-logger.js
// 统一日志和审计写入的轻量工具
const path = require('path');
const { writeJSONSafe } = require('./pipeline-helpers');

function log({ module, emoji = '', message, level = 'info' }) {
  const prefix = module ? `[${module}] ` : '';
  const icon = emoji ? `${emoji} ` : '';
  const full = ` ${prefix}${icon}${message}`;

  switch (level) {
    case 'error': console.error(full); break;
    case 'warn': console.warn(full); break;
    default: console.log(full);
  }
}

function appendAuditLog(auditLog, productionDir, stage, details = {}) {
  const entry = { stage, timestamp: new Date().toISOString(), ...details };
  if (!auditLog.stages) auditLog.stages = [];
  auditLog.stages.push(entry);

  const auditPath = path.join(productionDir, '.audit.json');
  writeJSONSafe(auditPath, auditLog);
}

function logInfo(module, message) { log({ module, message, level: 'info' }); }
function logWarn(module, message) { log({ module, message, level: 'warn' }); }
function logError(module, message) { log({ module, message, level: 'error' }); }

module.exports = { log, appendAuditLog, logInfo, logWarn, logError };
