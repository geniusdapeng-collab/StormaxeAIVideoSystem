#!/usr/bin/env node
/**
 * 导演优化修复执行器 v1.0-Peng
 * 方案A增强版：导演优化输出修复指令 → 代码自动应用到story-plan
 */

const fs = require('fs');
const path = require('path');

class DirectorFixExecutor {
  constructor(options = {}) {
    this.productionDir = options.productionDir;
    this.verbose = options.verbose !== false;
  }

  /**
   * 应用修复指令到story-plan
   * @param {Array} fixes - 修复指令数组
   * @param {Object} storyPlan - 当前story-plan
   * @returns {Object} {applied: number, failed: number, details: []}
   */
  applyFixes(fixes, storyPlan) {
    if (!fixes || !fixes.length) {
      return { applied: 0, failed: 0, details: [], storyPlan };
    }

    const details = [];
    let applied = 0;
    let failed = 0;

    for (const fix of fixes) {
      try {
        const result = this._applySingleFix(fix, storyPlan);
        if (result.success) {
          applied++;
          details.push({ fix, status: 'applied', shotId: fix.shotId, field: fix.field });
        } else {
          failed++;
          details.push({ fix, status: 'failed', error: result.error });
        }
      } catch (err) {
        failed++;
        details.push({ fix, status: 'error', error: err.message });
      }
    }

    return { applied, failed, details, storyPlan };
  }

  _applySingleFix(fix, storyPlan) {
    const { shotId, field, action, value, reason } = fix;

    // 获取目标shots
    let targetShots = [];
    if (shotId === 'ALL') {
      for (const segment of storyPlan.segments || []) {
        targetShots.push(...(segment.shots || []));
      }
    } else if (shotId.includes('-')) {
      // 范围如 S00-S07
      const [start, end] = shotId.split('-');
      const startNum = parseInt(start.replace(/\D/g, ''));
      const endNum = parseInt(end.replace(/\D/g, ''));
      for (const segment of storyPlan.segments || []) {
        for (const shot of segment.shots || []) {
          const num = parseInt(shot.id?.replace(/\D/g, '') || 0);
          if (num >= startNum && num <= endNum) {
            targetShots.push(shot);
          }
        }
      }
    } else {
      // 单个shot
      for (const segment of storyPlan.segments || []) {
        const shot = (segment.shots || []).find(s => s.id === shotId);
        if (shot) targetShots.push(shot);
      }
    }

    if (!targetShots.length) {
      return { success: false, error: `Shot ${shotId} not found` };
    }

    // 应用修复
    for (const shot of targetShots) {
      this._setField(shot, field, action, value);
    }

    return { success: true };
  }

  _setField(obj, fieldPath, action, value) {
    const parts = fieldPath.split('.');
    let current = obj;

    // 遍历到倒数第二个属性
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) current[part] = {};
      current = current[part];
    }

    const lastKey = parts[parts.length - 1];

    switch (action) {
      case 'set':
        current[lastKey] = value;
        break;
      case 'append':
        if (Array.isArray(current[lastKey])) {
          current[lastKey].push(value);
        } else if (typeof current[lastKey] === 'string') {
          current[lastKey] += (current[lastKey] ? ' ' : '') + value;
        } else {
          current[lastKey] = value;
        }
        break;
      case 'delete':
        delete current[lastKey];
        break;
      default:
        current[lastKey] = value;
    }
  }

  /**
   * 持久化修复后的story-plan
   */
  persistStoryPlan(storyPlan, productionDir) {
    const storyPlanPath = path.join(productionDir, '01-story', 'story-plan.json');
    fs.mkdirSync(path.dirname(storyPlanPath), { recursive: true });
    fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
    return storyPlanPath;
  }

  /**
   * 生成修复报告
   */
  generateReport(fixResult) {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0-Peng',
      applied: fixResult.applied,
      failed: fixResult.failed,
      details: fixResult.details,
      score: fixResult.score
    };
  }
}

module.exports = DirectorFixExecutor;