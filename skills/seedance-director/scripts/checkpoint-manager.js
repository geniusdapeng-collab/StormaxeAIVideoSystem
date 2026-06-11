#!/usr/bin/env node
/**
 * CheckpointManager — 断点续传管理器 V1.0
 * 
 * 解决问题：
 * 当前 Phase 渲染失败后需全量重跑，成本极高。
 * 断点续传在每个 Phase 完成后写入 checkpoint，
 * 失败后可从断点恢复，只重跑失败的 Phase。
 * 
 * 用法：
 *   const cp = new CheckpointManager(productionDir);
 *   // Phase 完成后记录
 *   cp.record('phase1_story_plan', { outputPath: planPath, shotCount: plan.totalShots });
 *   // 恢复时检查
 *   const plan = cp.resume('phase1_story_plan');
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CheckpointManager {
  constructor(productionDir) {
    this.productionDir = productionDir;
    this.checkpointFile = path.join(productionDir, '.checkpoint.json');
    this.checkpoints = this._load();
  }

  _load() {
    if (fs.existsSync(this.checkpointFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.checkpointFile, 'utf8'));
      } catch {
        return { phases: {}, version: 1 };
      }
    }
    return { phases: {}, version: 1 };
  }

  _save() {
    fs.writeFileSync(this.checkpointFile, JSON.stringify(this.checkpoints, null, 2), 'utf8');
  }

  /**
   * 记录 Phase 完成
   * @param {string} phaseName - Phase 名称
   * @param {Object} data - Phase 输出数据
   */
  record(phaseName, data = {}) {
    const checksum = data.outputPath ? this._fileChecksum(data.outputPath) : null;
    this.checkpoints.phases[phaseName] = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      checksum,
      data
    };
    this._save();
  }

  /**
   * 记录 Phase 部分完成（如渲染 25/25 中完成了 20 个）
   */
  recordPartial(phaseName, data = {}) {
    this.checkpoints.phases[phaseName] = {
      status: 'partial',
      completedAt: new Date().toISOString(),
      data
    };
    this._save();
  }

  /**
   * 检查 Phase 是否已完成
   */
  isCompleted(phaseName) {
    return this.checkpoints.phases[phaseName]?.status === 'completed';
  }

  /**
   * 获取 Phase 的 checkpoint 数据
   */
  get(phaseName) {
    return this.checkpoints.phases[phaseName] || null;
  }

  /**
   * 获取所有已完成的 Phase 列表
   */
  getCompletedPhases() {
    return Object.entries(this.checkpoints.phases)
      .filter(([, cp]) => cp.status === 'completed')
      .map(([name]) => name);
  }

  /**
   * 获取下一个待执行的 Phase
   */
  getNextPhase(allPhases) {
    for (const phase of allPhases) {
      if (!this.isCompleted(phase)) return phase;
    }
    return null; // 全部完成
  }

  /**
   * 校验 checkpoint 的数据完整性
   */
  validate(phaseName) {
    const cp = this.checkpoints.phases[phaseName];
    if (!cp) return { valid: false, reason: 'checkpoint 不存在' };
    if (cp.status !== 'completed') return { valid: false, reason: `状态: ${cp.status}` };
    if (cp.checksum && cp.data.outputPath) {
      const current = this._fileChecksum(cp.data.outputPath);
      if (current !== cp.checksum) {
        return { valid: false, reason: '数据文件已变更（checksum 不匹配）' };
      }
    }
    return { valid: true };
  }

  /**
   * 清除指定 Phase 的 checkpoint（用于强制重跑）
   */
  clear(phaseName) {
    delete this.checkpoints.phases[phaseName];
    this._save();
  }

  /**
   * 清除所有 checkpoint
   */
  clearAll() {
    this.checkpoints = { phases: {}, version: 1 };
    this._save();
  }

  /**
   * 获取 checkpoint 摘要
   */
  summary() {
    const total = Object.keys(this.checkpoints.phases).length;
    const completed = this.getCompletedPhases().length;
    const partial = Object.values(this.checkpoints.phases).filter(cp => cp.status === 'partial').length;
    return { total, completed, partial };
  }

  _fileChecksum(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch {
      return null;
    }
  }
}

module.exports = { CheckpointManager };

// 独立运行：测试
if (require.main === module) {
  const testDir = '/tmp/checkpoint-test';
  fs.mkdirSync(testDir, { recursive: true });
  
  const cp = new CheckpointManager(testDir);
  cp.record('phase1', { outputPath: null, shotCount: 25 });
  cp.record('phase2', { outputPath: null, charCount: 3 });
  
  console.log('已完成的 Phase:', cp.getCompletedPhases());
  console.log('Phase1 校验:', cp.validate('phase1'));
  console.log('摘要:', cp.summary());
  console.log('✅ 测试完成');
}
