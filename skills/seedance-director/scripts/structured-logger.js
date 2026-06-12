#!/usr/bin/env node
/**
 * StructuredLogger — 结构化日志 V1.0
 * 
 * 解决问题：
 * 当前仅有 console.log 输出到 stdout，无结构化、无关联 ID。
 * 结构化日志每条记录包含：时间戳、级别、模块、correlation_id、附加字段。
 * 可直接被日志采集系统（Loki/ELK）解析。
 * 
 * 用法：
 *   const logger = new StructuredLogger({ service: 'seedance-director' });
 *   logger.info('phase1_started', { production_id: 'P001', total_shots: 25 });
 *   logger.error('render_failed', { shot_id: 'S12', model: 'seedance-2.0', error: 'QuotaExceeded' });
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
let globalLogLevel = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL.toLowerCase()] : LOG_LEVELS.info;

class StructuredLogger {
  constructor(options = {}) {
    this.service = options.service || 'seedance-director';
    this.version = options.version || '3.0.0';
    this.defaultFields = options.defaultFields || {};
    this.correlationId = options.correlationId || this._generateId();
    this.logLevel = options.logLevel || globalLogLevel;
  }

  _generateId() {
    return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  _emit(level, event, fields = {}) {
    if (LOG_LEVELS[level] < this.logLevel) return;
    
    const entry = {
      ts: new Date().toISOString(),
      level,
      service: this.service,
      version: this.version,
      correlation_id: this.correlationId,
      event,
      ...this.defaultFields,
      ...fields
    };

    // 同时输出结构化 JSON 和人类可读格式
    if (process.env.LOG_FORMAT === 'json') {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const icon = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level] || 'ℹ️';
      const fieldStr = Object.entries(fields)
        .filter(([k]) => k !== 'msg')
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      const msg = fields.msg || event;
      process.stdout.write(`${icon} [${entry.ts}] [${level.toUpperCase()}] ${msg}${fieldStr ? ' | ' + fieldStr : ''}\n`);
    }
  }

  debug(event, fields) { this._emit('debug', event, fields); }
  info(event, fields) { this._emit('info', event, fields); }
  warn(event, fields) { this._emit('warn', event, fields); }
  error(event, fields) { this._emit('error', event, fields); }

  // 创建子日志器（携带默认字段）
  child(fields) {
    return new StructuredLogger({
      service: this.service,
      version: this.version,
      correlationId: this.correlationId,
      defaultFields: { ...this.defaultFields, ...fields },
      logLevel: this.logLevel
    });
  }
}

module.exports = { StructuredLogger, LOG_LEVELS };

// 独立运行：测试
if (require.main === module) {
  const logger = new StructuredLogger({ service: 'test' });
  logger.info('app_started', { port: 9876, env: 'production' });
  logger.warn('quota_low', { model: 'seedance-2.0', remaining: 5 });
  logger.error('render_failed', { shot_id: 'S12', model: 'seedance-2.0', error: 'QuotaExceeded' });
  console.log('\n✅ 结构化日志测试完成');
}
