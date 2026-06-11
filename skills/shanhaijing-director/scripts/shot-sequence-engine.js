#!/usr/bin/env node
/**
 * Shot Sequence & Impact Engine v1.0-Peng
 * 镜头序列冲击引擎 — 时长×运镜×转场 = 视觉冲击力
 *
 * 核心职责：
 * 1. 分析相邻镜头的组合冲击力（尺度对比、运镜连续性、转场类型）
 * 2. 自动生成最优转场建议（硬切/甩镜/J切/叠化...）
 * 3. 检测"问题序列"（雷同镜头、无动机跳切、节奏断裂）
 * 4. 计算每个序列点的视觉冲击分数（1-10）
 * 5. 整体情绪曲线与冲击曲线双轨校验
 *
 * 核心公式：
 * Impact = ScaleJump(镜头尺度差) × MovementEnergy(运镜能量差) × TransitionMatch(转场匹配度) × DurationContrast(时长对比)
 *
 * 大鹏灵感："全景切特写，这就是极强的视觉冲击"
 * 原理：巨大尺度跳跃 + 方向突变 = 大脑强制聚焦
 */

'use strict';

// ============ 镜头尺度定义 ============
const SHOT_SCALE = {
  'extreme_wide': 1,      // 超大远景（环境全貌）
  'wide': 2,              // 远景/全景
  'medium_wide': 3,       // 中远景
  'medium': 4,            // 中景
  'medium_close': 5,      // 中近景
  'close_up': 6,          // 特写
  'extreme_close': 7      // 大特写（眼睛/细节）
};

// ============ 运镜能量定义 ============
const MOVEMENT_ENERGY = {
  'static': 0,            // 固定机位 = 0能量
  'slow_push': 1,         // 缓推
  'slow_pull': 1,         // 缓拉
  'pan_tilt': 2,          // 摇镜头
  'tracking': 3,          // 跟拍
  'handheld': 3,          // 手持
  'drift': 2,             // 漂移
  'whip_pan': 5,          // 甩镜 = 高能量
  'crash_zoom': 5,        // 急推 = 高能量
  'drone_fly': 3,         // 航拍
  'oneshot': 4,           // 一镜到底（持续能量）
  'bullet_time': 4,       // 子弹时间
  'orbit': 3,             // 环绕
  'jib_swing': 3          // 摇臂
};

// ============ 转场类型库 ============
const TRANSITION_TYPES = {
  'hard_cut': {
    name: '硬切',
    impact: 8,              // 高冲击
    energy_req: 'any',      // 任何能量差都可用
    best_for: ['scale_jump', 'energy_contrast', 'shock'],
    rhythm: 'staccato'      // 断奏/急促
  },
  'whip_pan_transition': {
    name: '甩镜转场',
    impact: 9,              // 极高冲击
    energy_req: 'high_to_any',
    best_for: ['action', 'chaos', 'directional_flow'],
    rhythm: 'staccato'
  },
  'match_cut': {
    name: '匹配剪辑',
    impact: 7,
    energy_req: 'similar',
    best_for: ['shape_match', 'continuity', 'metaphor'],
    rhythm: 'legato'        // 连奏/流畅
  },
  'j_cut': {
    name: 'J切（先声后画）',
    impact: 5,
    energy_req: 'any',
    best_for: ['anticipation', 'dialogue', 'suspense'],
    rhythm: 'legato'
  },
  'l_cut': {
    name: 'L切（先画后声）',
    impact: 5,
    energy_req: 'any',
    best_for: ['continuation', 'reaction', 'overlap'],
    rhythm: 'legato'
  },
  'fade_in': {
    name: '淡入',
    impact: 3,
    energy_req: 'low',
    best_for: ['opening', 'dream', 'memory'],
    rhythm: 'legato'
  },
  'fade_out': {
    name: '淡出',
    impact: 3,
    energy_req: 'low',
    best_for: ['ending', 'death', 'time_passage'],
    rhythm: 'legato'
  },
  'dissolve': {
    name: '叠化',
    impact: 4,
    energy_req: 'low_to_medium',
    best_for: ['time_transition', 'emotion', 'soft_link'],
    rhythm: 'legato'
  },
  'wipe': {
    name: '划像',
    impact: 6,
    energy_req: 'any',
    best_for: ['energetic', 'travel', 'comic'],
    rhythm: 'staccato'
  },
  'smash_cut': {
    name: '砸切',
    impact: 10,             // 最高冲击
    energy_req: 'extreme_contrast',
    best_for: ['horror', 'surprise', 'comedic_timing'],
    rhythm: 'staccato'
  }
};

// ============ 尺度跳跃冲击矩阵 ============
// 行=前镜头，列=后镜头，值=冲击分数(1-10)
const SCALE_JUMP_IMPACT = {
  'extreme_wide':  { 'extreme_wide': 1, 'wide': 2, 'medium_wide': 3, 'medium': 4, 'medium_close': 6, 'close_up': 9, 'extreme_close': 10 },
  'wide':          { 'extreme_wide': 2, 'wide': 1, 'medium_wide': 2, 'medium': 3, 'medium_close': 5, 'close_up': 8, 'extreme_close': 9 },
  'medium_wide':   { 'extreme_wide': 3, 'wide': 2, 'medium_wide': 1, 'medium': 2, 'medium_close': 4, 'close_up': 7, 'extreme_close': 8 },
  'medium':        { 'extreme_wide': 4, 'wide': 3, 'medium_wide': 2, 'medium': 1, 'medium_close': 3, 'close_up': 6, 'extreme_close': 7 },
  'medium_close':  { 'extreme_wide': 5, 'wide': 4, 'medium_wide': 3, 'medium': 2, 'medium_close': 1, 'close_up': 4, 'extreme_close': 6 },
  'close_up':      { 'extreme_wide': 8, 'wide': 6, 'medium_wide': 5, 'medium': 4, 'medium_close': 3, 'close_up': 1, 'extreme_close': 3 },
  'extreme_close': { 'extreme_wide': 9, 'wide': 7, 'medium_wide': 6, 'medium': 5, 'medium_close': 4, 'close_up': 2, 'extreme_close': 1 }
};

// ============ 冲击引擎核心类 ============
class ShotSequenceEngine {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.minImpactForFlag = options.minImpactForFlag || 7; // ≥7分标记为"强冲击点"
  }

  /**
   * 分析完整镜头序列
   * @param {Array} shots - 带duration/camera/scale的shots
   * @returns {Object} 序列分析报告
   */
  analyzeSequence(shots) {
    if (!shots || shots.length < 2) {
      return { sequences: [], impactCurve: [], warnings: ['至少需要2个镜头'] };
    }

    const sequences = [];
    const impactCurve = [];
    const warnings = [];

    for (let i = 0; i < shots.length - 1; i++) {
      const current = shots[i];
      const next = shots[i + 1];

      // 分析这对镜头的组合
      const sequence = this._analyzePair(current, next, i);
      sequences.push(sequence);
      impactCurve.push(sequence.impactScore);

      // 检测问题
      const warning = this._detectProblem(current, next, i, sequence);
      if (warning) warnings.push(warning);
    }

    // 整体节奏分析
    const rhythmAnalysis = this._analyzeRhythm(shots, impactCurve);

    return {
      sequences,
      impactCurve,
      warnings,
      rhythmAnalysis,
      avgImpact: impactCurve.reduce((a, b) => a + b, 0) / impactCurve.length,
      maxImpact: Math.max(...impactCurve),
      minImpact: Math.min(...impactCurve),
      strongImpactPoints: sequences.filter(s => s.impactScore >= this.minImpactForFlag)
    };
  }

  /**
   * 分析相邻镜头对
   */
  _analyzePair(current, next, index) {
    // 1. 尺度跳跃冲击
    const scaleImpact = this._calculateScaleImpact(current.scale || 'medium', next.scale || 'medium');

    // 2. 运镜能量差
    const currentEnergy = this._getMovementEnergy(current.camera || 'static');
    const nextEnergy = this._getMovementEnergy(next.camera || 'static');
    const energyDiff = Math.abs(currentEnergy - nextEnergy);
    const energyImpact = Math.min(10, energyDiff * 2); // 能量差×2，封顶10

    // 3. 时长对比（短→长=扩张，长→短=压缩）
    const durationRatio = next.duration / (current.duration || 1);
    let durationImpact;
    if (durationRatio >= 3) durationImpact = 8;      // 极长扩张
    else if (durationRatio >= 2) durationImpact = 6;  // 明显扩张
    else if (durationRatio >= 1.5) durationImpact = 4; // 轻微扩张
    else if (durationRatio <= 0.33) durationImpact = 7; // 极短压缩
    else if (durationRatio <= 0.5) durationImpact = 5;  // 明显压缩
    else if (durationRatio <= 0.75) durationImpact = 3; // 轻微压缩
    else durationImpact = 2; // 基本持平

    // 4. 叙事类型对比
    const narrativeImpact = this._calculateNarrativeImpact(current.type, next.type);

    // 综合冲击分数（非线性加权，极端尺度跳跃主导）
    const scaleDiff = Math.abs((SHOT_SCALE[next.scale || 'medium'] || 4) - (SHOT_SCALE[current.scale || 'medium'] || 4));
    const isExtremeJump = scaleDiff >= 5; // 5级以上尺度差 = 极端跳跃

    let impactScore;
    if (isExtremeJump) {
      // 极端尺度跳跃：尺度主导（50%），其他辅助
      impactScore = Math.round(
        scaleImpact * 0.50 +
        energyImpact * 0.20 +
        durationImpact * 0.10 +
        narrativeImpact * 0.20
      );
    } else if (scaleDiff >= 3) {
      // 大尺度跳跃：尺度主导（40%）
      impactScore = Math.round(
        scaleImpact * 0.40 +
        energyImpact * 0.25 +
        durationImpact * 0.15 +
        narrativeImpact * 0.20
      );
    } else {
      // 普通跳跃：均衡加权
      impactScore = Math.round(
        scaleImpact * 0.30 +
        energyImpact * 0.25 +
        durationImpact * 0.20 +
        narrativeImpact * 0.25
      );
    }

    // 推荐转场
    const recommendedTransition = this._recommendTransition(current, next, impactScore, energyDiff);

    return {
      index,
      from: { id: current.id, type: current.type, scale: current.scale || 'medium', duration: current.duration, camera: current.camera },
      to: { id: next.id, type: next.type, scale: next.scale || 'medium', duration: next.duration, camera: next.camera },
      scaleImpact,
      energyDiff,
      energyImpact,
      durationImpact,
      narrativeImpact,
      impactScore: Math.min(10, Math.max(1, impactScore)),
      recommendedTransition,
      rhythmType: this._getRhythmType(current, next, impactScore)
    };
  }

  /**
   * 计算尺度跳跃冲击
   */
  _calculateScaleImpact(fromScale, toScale) {
    const impact = SCALE_JUMP_IMPACT[fromScale]?.[toScale] || 5;
    return impact;
  }

  /**
   * 获取运镜能量值
   */
  _getMovementEnergy(cameraDesc) {
    if (!cameraDesc) return 0;
    // 🆕 v5.30-Peng-fix: 防御性类型检查
    if (typeof cameraDesc !== 'string') {
      cameraDesc = String(cameraDesc || '');
    }
    const desc = cameraDesc.toLowerCase();

    // 直接匹配
    for (const [move, energy] of Object.entries(MOVEMENT_ENERGY)) {
      if (desc.includes(move.replace('_', ' ')) || desc.includes(move)) {
        return energy;
      }
    }

    // 关键词匹配（更全面的中文+英文）
    if (desc.includes('甩') || desc.includes('whip')) return 5;
    if (desc.includes('急') || desc.includes('crash') || desc.includes('急速')) return 5;
    if (desc.includes('猛') || desc.includes('猛冲')) return 5;
    if (desc.includes('缓') || desc.includes('slow')) return 1;
    if (desc.includes('固定') || desc.includes('static') || desc.includes('固定')) return 0;
    if (desc.includes('跟') || desc.includes('track')) return 3;
    if (desc.includes('航') || desc.includes('drone') || desc.includes('航拍')) return 3;
    if (desc.includes('环绕') || desc.includes('orbit')) return 3;
    if (desc.includes('一镜') || desc.includes('oneshot') || desc.includes('one shot')) return 4;
    if (desc.includes('推') || desc.includes('push')) return 2;
    if (desc.includes('拉') || desc.includes('pull')) return 2;
    if (desc.includes('俯') || desc.includes('tilt')) return 2;
    if (desc.includes('摇') || desc.includes('pan')) return 2;

    return 1; // 默认低能量
  }

  /**
   * 计算叙事类型冲击
   */
  _calculateNarrativeImpact(fromType, toType) {
    // 特定组合的高冲击
    const highImpactPairs = [
      ['establishing', 'close_up'],      // 全景切特写 = 极强
      ['climax', 'reflection'],           // 高潮切余韵 = 情绪落差
      ['action', 'static'],              // 动作切静止 = 戛然而止
      ['transition', 'climax'],           // 过渡切高潮 = 意外爆发
      ['dialogue', 'action']              // 对白切动作 = 突变
    ];

    for (const [f, t] of highImpactPairs) {
      if ((fromType === f && toType === t) || (fromType === t && toType === f)) {
        return 8;
      }
    }

    // 同类型 = 低冲击（平淡）
    if (fromType === toType) return 2;

    return 5; // 默认中等
  }

  /**
   * 推荐转场类型
   */
  _recommendTransition(current, next, impactScore, energyDiff) {
    // 极高冲击 → 砸切
    if (impactScore >= 9 && energyDiff >= 4) {
      return { type: 'smash_cut', reason: '极端对比，需要最强冲击' };
    }

    // 高冲击 + 甩镜能量 → 甩镜转场
    if (impactScore >= 7 && (this._getMovementEnergy(current.camera) >= 4 || this._getMovementEnergy(next.camera) >= 4)) {
      return { type: 'whip_pan_transition', reason: '运镜能量高，甩镜转场延续动能' };
    }

    // 尺度跳跃大 → 硬切
    if (impactScore >= 7) {
      return { type: 'hard_cut', reason: '尺度/能量对比强，硬切保持冲击力' };
    }

    // 中等冲击 + 对话 → J切/L切
    if (current.type === 'dialogue' || next.type === 'dialogue') {
      return { type: 'j_cut', reason: '对白场景，声音先入保持流畅' };
    }

    // 低冲击 + 慢节奏 → 叠化
    if (impactScore <= 4 && this._getMovementEnergy(current.camera) <= 1 && this._getMovementEnergy(next.camera) <= 1) {
      return { type: 'dissolve', reason: '低能量，柔和过渡' };
    }

    // 结尾 → 淡出
    if (next.type === 'ending') {
      return { type: 'fade_out', reason: '结尾镜头，淡出收束' };
    }

    // 默认
    return { type: 'hard_cut', reason: '通用方案' };
  }

  /**
   * 检测问题序列
   */
  _detectProblem(current, next, index, sequence) {
    // 问题1：同尺度 + 同类型 + 同能量 = 重复/无聊
    if (current.scale === next.scale &&
        current.type === next.type &&
        this._getMovementEnergy(current.camera) === this._getMovementEnergy(next.camera)) {
      return {
        index,
        type: 'boring_sequence',
        severity: 'warning',
        message: `${current.id}→${next.id}: 同尺度+同类型+同运镜 = 视觉疲劳，建议改变其中一个维度`
      };
    }

    // 问题2：特写→特写无动机 = 跳切风险
    if (current.scale === 'close_up' && next.scale === 'close_up' && sequence.impactScore < 5) {
      return {
        index,
        type: 'jarring_jumpcut',
        severity: 'warning',
        message: `${current.id}→${next.id}: 特写接特写无动机跳切，建议插入中景过渡或改变角度`
      };
    }

    // 问题3：极长→极短 = 节奏断裂
    const durationRatio = next.duration / (current.duration || 1);
    if (durationRatio > 4 || durationRatio < 0.25) {
      return {
        index,
        type: 'rhythm_break',
        severity: 'info',
        message: `${current.id}(${current.duration}s)→${next.id}(${next.duration}s): 时长比${durationRatio.toFixed(1)}:1，节奏突变`
      };
    }

    return null;
  }

  /**
   * 节奏类型判断
   */
  _getRhythmType(current, next, impactScore) {
    if (impactScore >= 8) return 'staccato_shock';      // 断奏冲击
    if (impactScore >= 6) return 'staccato_energy';     // 断奏能量
    if (current.duration >= 8 && next.duration >= 8) return 'legato_flow'; // 连奏流畅
    if (current.duration <= 3 && next.duration <= 3) return 'staccato_rapid'; // 快速断奏
    return 'mixed'; // 混合
  }

  /**
   * 整体节奏分析
   */
  _analyzeRhythm(shots, impactCurve) {
    // 检测冲击波模式
    const patterns = [];

    // 检测" buildup-release "模式
    for (let i = 2; i < impactCurve.length - 2; i++) {
      if (impactCurve[i-2] < 5 && impactCurve[i-1] < 5 && impactCurve[i] >= 8 && impactCurve[i+1] < 5) {
        patterns.push({
          type: 'buildup_release',
          position: i,
          description: `第${i}序列点出现"蓄力-爆发-回落"模式（冲击${impactCurve[i]}）`
        });
      }
    }

    // 检测"持续高压"模式
    let highStreak = 0;
    let maxStreak = 0;
    for (const score of impactCurve) {
      if (score >= 7) {
        highStreak++;
        maxStreak = Math.max(maxStreak, highStreak);
      } else {
        highStreak = 0;
      }
    }

    return {
      totalSequences: impactCurve.length,
      avgImpact: Math.round(impactCurve.reduce((a, b) => a + b, 0) / impactCurve.length * 10) / 10,
      maxImpact: Math.max(...impactCurve),
      minImpact: Math.min(...impactCurve),
      highImpactStreak: maxStreak,
      patterns,
      pacingVerdict: maxStreak > 3 ? 'warning: 连续高压可能疲劳' : maxStreak === 0 ? 'warning: 缺乏冲击点' : 'balanced'
    };
  }

  /**
   * 生成序列可视化报告
   */
  generateReport(shots, analyzeResult) {
    const { sequences, impactCurve, warnings, rhythmAnalysis, strongImpactPoints } = analyzeResult;

    let report = `\n🎬 镜头序列冲击报告 v1.0-Peng\n`;
    report += `=${'='.repeat(50)}\n`;
    report += `📊 统计: ${sequences.length}个序列点 | 平均冲击${rhythmAnalysis.avgImpact} | 强冲击点${strongImpactPoints.length}个\n`;
    report += `🌊 节奏诊断: ${rhythmAnalysis.pacingVerdict}\n\n`;

    report += `📋 序列详情:\n`;
    for (const seq of sequences) {
      const impactBar = '🔥'.repeat(Math.floor(seq.impactScore / 2)) + '░'.repeat(5 - Math.floor(seq.impactScore / 2));
      const trans = TRANSITION_TYPES[seq.recommendedTransition.type];
      report += `  ${seq.from.id}→${seq.to.id}: 冲击${seq.impactScore}/10 ${impactBar} | ${trans?.name || seq.recommendedTransition.type} (${seq.recommendedTransition.reason})\n`;
      report += `    尺度${seq.from.scale}→${seq.to.scale}(${seq.scaleImpact}) × 能量${seq.energyDiff}(${seq.energyImpact}) × 时长比${(seq.to.duration/seq.from.duration).toFixed(1)}(${seq.durationImpact}) × 叙事${seq.narrativeImpact}\n`;
    }

    if (warnings.length > 0) {
      report += `\n⚠️ 警告:\n`;
      for (const w of warnings) {
        report += `  [${w.severity}] ${w.message}\n`;
      }
    }

    if (strongImpactPoints.length > 0) {
      report += `\n💥 强冲击点（≥7分）:\n`;
      for (const sp of strongImpactPoints) {
        report += `  ${sp.from.id}→${sp.to.id}: ${sp.impactScore}分 — ${sp.recommendedTransition.reason}\n`;
      }
    }

    return report;
  }
}

// ============ 便捷函数 ============

/**
 * 快速分析镜头序列
 */
function analyzeShotSequence(shots, options = {}) {
  const engine = new ShotSequenceEngine(options);
  return engine.analyzeSequence(shots);
}

/**
 * 生成可视化报告
 */
function generateSequenceReport(shots, options = {}) {
  const engine = new ShotSequenceEngine(options);
  const result = engine.analyzeSequence(shots);
  return engine.generateReport(shots, result);
}

module.exports = {
  ShotSequenceEngine,
  analyzeShotSequence,
  generateSequenceReport,
  SHOT_SCALE,
  MOVEMENT_ENERGY,
  TRANSITION_TYPES,
  SCALE_JUMP_IMPACT
};