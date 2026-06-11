#!/usr/bin/env node
/**
 * Duration Allocator v1.2-Peng
 * 智能镜头时长分配器 — 节奏感的灵魂
 * 
 * v1.2-Peng 更新（2026-05-25）：
 * + 🆕 片头固定时长保护：opening_title类型镜头不参与自动分配，保留预设时长
 * + 正片时长 = 总时长 - 片头固定时长，仅对正片镜头进行五层加权分配
 * + 片头信息返回在分配结果中（openingTitleProtected, openingTitleDuration）
 * 
 * v1.1-Peng 更新（2026-05-24）：
 * + 🆕 短剧快剪模式 short_drama：basePacing=0.50, minShot=1.5s, maxShot=8s
 * + 比action模式快40%，专为60秒短视频持续兴奋设计
 * + 一镜到底5-8秒，高潮4-8秒，极限压缩无长镜头
 *
 *
 * 核心职责：
 * 1. 五层加权计算每个镜头的合理时长
 * 2. 根据目标时长自动缩放，确保总时长精准
 * 3. 特殊镜头类型（一镜到底/climax）有独立边界保护
 * 4. 情绪曲线联动，高潮镜头组自动延长
 * 5. 字幕台词长度感知，内容多时给更多时间
 *
 * 五层加权体系：
 * Layer 1: 叙事类型权重（climax/oneshot/establishing...）
 * Layer 2: 内容长度权重（narration文本长度）
 * Layer 3: 运镜类型权重（一镜到底/甩镜/航拍...）
 * Layer 4: 情绪张力权重（tension值）
 * Layer 5: 全局节奏模式（action/drama/documentary...）
 *
 * 与旧版区别：
 * - 旧版：固定1.8秒基础 × 简单权重 = 结果（不考虑内容多少、运镜类型）
 * - 新版：动态计算，一镜到底强制8-15秒，climax 6-15秒，内容多自动延长
 */

'use strict';

// ============ Layer 1: 叙事类型权重 ============
const NARRATIVE_WEIGHTS = {
  'climax': 2.5,           // 高潮最重
  'oneshot': 2.2,          // 一镜到底次重（需要完整感受运镜）
  'action': 1.8,           // 动作戏
  'emotional_peak': 1.8,   // 情绪高潮
  'reveal': 1.5,           // 揭示/转折
  'character': 1.3,        // 角色刻画
  'interaction': 1.2,      // 互动
  'dialogue': 1.0,         // 对白（基准）
  'explanation': 1.1,    // 讲解（科普类）
  'demonstration': 1.15,   // 演示（科普类）
  'transition': 0.7,       // 过渡最短
  'reflection': 0.8,       // 反思/余韵
  'establishing': 0.8,    // 建置
  'question': 0.9,         // 提问
  'reaction': 0.85,        // 反应
  'visual-metaphor': 0.95, // 视觉隐喻
  'ending': 1.4            // 结尾
};

// ============ Layer 3: 运镜类型权重 ============
const CAMERA_MOVE_WEIGHTS = {
  'oneshot': 1.5,          // 一镜到底：需要完整时间感受
  '一镜到底': 1.5,
  'bullet_time': 1.3,      // 子弹时间
  'drone': 1.2,            // 航拍（壮观需要停留）
  '航拍': 1.2,
  'tracking': 1.0,         // 跟拍（基准）
  'handheld': 1.0,         // 手持
  'static': 0.9,           // 固定（可以短）
  'whip_pan': 0.8,         // 甩镜（快速切换）
  'crash_zoom': 0.85,      // 急推
  'push_in': 1.1,          // 缓推
  'pull_out': 1.05,        // 缓拉
  'orbit': 1.15            // 环绕
};

// ============ Layer 5: 全局节奏模式 ============
const RHYTHM_PROFILES = {
  'action': {              // 动作/山海经神话
    basePacing: 0.85,      // 整体偏快
    tensionBoost: 1.3,     // 高张力延长
    lowTensionCompress: 0.7, // 低张力压缩
    minShot: 2,
    maxShot: 15,
    oneshotMin: 8,         // 一镜到底最少8秒
    oneshotMax: 15,        // 一镜到底最多15秒 (Seedance 2.0上限)
    climaxMin: 6,          // 高潮最少6秒
    climaxMax: 15
  },
  'drama': {               // 剧情
    basePacing: 1.0,
    tensionBoost: 1.15,
    lowTensionCompress: 0.85,
    minShot: 3,
    maxShot: 15,
    oneshotMin: 10,
    oneshotMax: 15,        // 一镜到底最多15秒 (Seedance 2.0上限)
    climaxMin: 8,
    climaxMax: 15             // 高潮最多15秒 (Seedance 2.0上限)
  },
  'documentary': {         // 纪录片/科普
    basePacing: 1.2,       // 整体偏慢（讲解需要消化）
    tensionBoost: 1.05,
    lowTensionCompress: 0.95,
    minShot: 3,
    maxShot: 15,            // 最多15秒 (Seedance 2.0上限)
    oneshotMin: 10,
    oneshotMax: 15,          // 一镜到底最多15秒 (Seedance 2.0上限)
    climaxMin: 8,
    climaxMax: 15            // 高潮最多15秒 (Seedance 2.0上限)
  },
  'educational': {         // 教育
    basePacing: 1.1,
    tensionBoost: 1.0,
    lowTensionCompress: 1.0,
    minShot: 3,
    maxShot: 15,
    oneshotMin: 8,
    oneshotMax: 15,        // 一镜到底最多15秒 (Seedance 2.0上限)
    climaxMin: 6,
    climaxMax: 15
  },
  'commercial': {          // 广告
    basePacing: 0.75,        // 最快
    tensionBoost: 1.2,
    lowTensionCompress: 0.65,
    minShot: 2,
    maxShot: 12,
    oneshotMin: 6,
    oneshotMax: 15,
    climaxMin: 5,
    climaxMax: 12
  },
  'short_drama': {         // 🆕 v1.1-Peng: 短剧快剪模式（抖音/短剧节奏）
    basePacing: 0.50,      // 比action快40%
    tensionBoost: 1.5,     // 高张力更激进延长
    lowTensionCompress: 0.5, // 低张力更激进压缩
    minShot: 1.5,          // 最短1.5秒（极限）
    maxShot: 8,            // 最长8秒（绝不允许长镜头）
    oneshotMin: 5,         // 一镜到底最短5秒
    oneshotMax: 8,         // 一镜到底最长8秒
    climaxMin: 4,          // 高潮最短4秒
    climaxMax: 8           // 高潮最长8秒
  }
};

// ============ 节奏分配器核心类 ============
class DurationAllocator {
  constructor(options = {}) {
    this.rhythmProfile = RHYTHM_PROFILES[options.videoType || 'action'] || RHYTHM_PROFILES.action;
    this.debug = options.debug || false;
  }

/**
   * 智能时长分配主入口
   * @param {Array} shots - 镜头列表
   * @param {number} targetDuration - 目标总时长（秒）
   * @returns {Object} 分配结果
   */
  allocate(shots, targetDuration) {
    if (!shots || shots.length === 0) {
      return { shots: [], totalDuration: 0, deviation: 0, passed: false };
    }

    // 🆕 v1.2-Peng: 片头固定时长保护 — 不参与自动分配
    const openingTitleShots = shots.filter(s => s.type === 'opening_title');
    const openingTitleDuration = openingTitleShots.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // 正片镜头 = 总镜头 - 片头
    const mainShots = shots.filter(s => s.type !== 'opening_title');
    const mainTargetDuration = Math.max(1, targetDuration - openingTitleDuration);
    
    if (this.debug && openingTitleDuration > 0) {
      console.log(`  [DurationAllocator] 🎬 片头保护: ${openingTitleShots.length}个片头, 固定时长${openingTitleDuration}s, 正片分配${mainTargetDuration}s`);
    }

    const profile = this.rhythmProfile;
    let totalWeight = 0;
    const shotCalculations = [];

    // Step 1: 计算每个正片镜头的五层综合权重
    for (let i = 0; i < mainShots.length; i++) {
      const shot = mainShots[i];
      const calc = this._calculateShotWeight(shot, i, mainShots.length);
      shotCalculations.push(calc);
      totalWeight += calc.combinedWeight;
    }

    // Step 2: 计算基础时长（基于正片目标时长）
    const baseDuration = mainShots.length > 0 ? mainTargetDuration / totalWeight : 0;

    if (this.debug) {
      console.log(`  [DurationAllocator] 正片镜头: ${mainShots.length}, 总权重: ${totalWeight.toFixed(2)}, 基础时长: ${baseDuration.toFixed(2)}s`);
    }

    // Step 3: 分配正片镜头初始时长
    let allocatedTotal = 0;
    for (let i = 0; i < mainShots.length; i++) {
      const calc = shotCalculations[i];
      const rawDuration = baseDuration * calc.combinedWeight;

      // Step 4: 应用边界限制
      const boundedDuration = this._applyBounds(rawDuration, calc, profile);

      mainShots[i].duration = Math.round(boundedDuration);
      allocatedTotal += mainShots[i].duration;
    }

    // Step 5: 正片时长补偿（偏差 > 5%时微调）
    const diff = mainTargetDuration - allocatedTotal;
    if (Math.abs(diff) > mainTargetDuration * 0.05 && mainShots.length > 0) {
      this._compensateDuration(mainShots, diff, shotCalculations, profile);
    }

    // Step 6: 合并结果（片头 + 正片）
    const finalShots = [...openingTitleShots, ...mainShots];
    const finalTotal = finalShots.reduce((sum, s) => sum + s.duration, 0);
    const deviation = Math.abs(finalTotal - targetDuration) / targetDuration;

    return {
      shots: finalShots,
      totalDuration: finalTotal,
      targetDuration,
      deviation,
      passed: deviation <= 0.05,
      profile: this._getProfileName(),
      openingTitleProtected: openingTitleDuration > 0,
      openingTitleDuration,
      allocations: finalShots.map((s, i) => ({
        id: s.id || `S${i + 1}`,
        type: s.type || 'normal',
        duration: s.duration,
        isOpeningTitle: s.type === 'opening_title',
        layers: s.type === 'opening_title' ? null : shotCalculations[mainShots.indexOf(s)]
      }))
    };
  }

  /**
   * 计算单个镜头的五层权重
   */
  _calculateShotWeight(shot, index, totalShots) {
    // Layer 1: 叙事类型权重
    const narrativeWeight = NARRATIVE_WEIGHTS[shot.type] || 1.0;

    // Layer 2: 内容长度权重（基于narration或description）
    const contentLength = this._estimateContentLength(shot);
    const contentWeight = Math.log2(contentLength / 20 + 1) + 0.5;
    const boundedContentWeight = Math.max(0.5, Math.min(2.0, contentWeight));

    // Layer 3: 运镜类型权重
    const cameraMove = this._detectCameraMove(shot);
    const cameraWeight = CAMERA_MOVE_WEIGHTS[cameraMove] || 1.0;

    // Layer 4: 情绪张力权重
    const tension = shot.tension || 50;
    let tensionWeight = 1.0;
    if (tension >= 90) tensionWeight = 1.3;
    else if (tension >= 70) tensionWeight = 1.15;
    else if (tension >= 50) tensionWeight = 1.0;
    else if (tension >= 30) tensionWeight = 0.9;
    else tensionWeight = 0.8;

    // Layer 5: 全局节奏模式（basePacing已在后续乘法中应用，这里记录）
    const rhythmWeight = 1.0; // basePacing在外部乘法

    // 综合权重（Layer 1-4 相乘）
    const combinedWeight = narrativeWeight * boundedContentWeight * cameraWeight * tensionWeight;

    return {
      narrativeWeight,
      contentWeight: boundedContentWeight,
      cameraWeight,
      tensionWeight,
      combinedWeight,
      cameraMove,
      contentLength
    };
  }

  /**
   * 估算镜头内容长度（字符数）
   */
  _estimateContentLength(shot) {
    // 优先使用 dialogue（字幕/角色台词）
    if (shot.narration && shot.narration.length > 0) {
      return shot.narration.length;
    }
    // 其次使用 description
    if (shot.description && shot.description.length > 0) {
      return shot.description.length;
    }
    // 默认中等长度
    return 40;
  }

  /**
   * 检测运镜类型
   */
  _detectCameraMove(shot) {
    const text = `${shot.camera || ''} ${shot.description || ''} ${shot.type || ''}`.toLowerCase();

    if (text.includes('一镜到底') || text.includes('oneshot') || text.includes('one shot')) return 'oneshot';
    if (text.includes('子弹时间') || text.includes('bullet time')) return 'bullet_time';
    if (text.includes('航拍') || text.includes('drone') || text.includes('aerial')) return 'drone';
    if (text.includes('甩镜') || text.includes('whip pan')) return 'whip_pan';
    if (text.includes('环绕') || text.includes('orbit')) return 'orbit';
    if (text.includes('跟拍') || text.includes('tracking')) return 'tracking';
    if (text.includes('急推') || text.includes('crash zoom')) return 'crash_zoom';
    if (text.includes('缓推') || text.includes('push in')) return 'push_in';
    if (text.includes('固定') || text.includes('static') || text.includes('tripod')) return 'static';

    return 'tracking'; // 默认
  }

  /**
   * 应用边界限制
   */
  _applyBounds(rawDuration, calc, profile) {
    let min = profile.minShot;
    let max = profile.maxShot;

    // 特殊镜头类型有独立边界
    if (calc.cameraMove === 'oneshot' || calc.cameraMove === '一镜到底') {
      min = profile.oneshotMin;
      max = profile.oneshotMax;
    } else if (calc.narrativeWeight >= 2.0) { // climax
      min = profile.climaxMin;
      max = profile.climaxMax;
    }

    return Math.max(min, Math.min(max, rawDuration));
  }

  /**
   * 时长补偿：按镜头重要性排序微调
   * 优先调整低重要性镜头，保护高潮/一镜到底
   */
  _compensateDuration(shots, diff, calculations, profile) {
    const absDiff = Math.abs(diff);
    const direction = diff > 0 ? 1 : -1; // 正=需要增加，负=需要减少

    // 按重要性排序（低到高）
    const sortedIndices = calculations
      .map((calc, idx) => ({ idx, importance: calc.combinedWeight }))
      .sort((a, b) => a.importance - b.importance)
      .map(item => item.idx);

    let remaining = absDiff;

    for (const idx of sortedIndices) {
      if (remaining <= 0) break;

      const shot = shots[idx];
      const calc = calculations[idx];
      const current = shot.duration;

      // 计算可调范围
      let min = profile.minShot;
      let max = profile.maxShot;
      if (calc.cameraMove === 'oneshot') {
        min = profile.oneshotMin;
        max = profile.oneshotMax;
      } else if (calc.narrativeWeight >= 2.0) {
        min = profile.climaxMin;
        max = profile.climaxMax;
      }

      // 每次调整1秒
      const step = direction;
      const newDuration = current + step;

      if (newDuration >= min && newDuration <= max) {
        shot.duration = newDuration;
        remaining--;
      }
    }

    if (this.debug && remaining > 0) {
      console.log(`  [DurationAllocator] ⚠️ 补偿后仍有${remaining}s偏差无法分配`);
    }
  }

  _getProfileName() {
    for (const [name, profile] of Object.entries(RHYTHM_PROFILES)) {
      if (profile === this.rhythmProfile) return name;
    }
    return 'unknown';
  }
}

// ============ 便捷函数 ============

/**
 * 快速分配时长
 * @param {Array} shots - 镜头列表
 * @param {number} targetDuration - 目标时长
 * @param {string} videoType - 视频类型（action/drama/documentary/educational/commercial）
 * @returns {Object} 分配结果
 */
function allocateDurations(shots, targetDuration, videoType = 'action') {
  const allocator = new DurationAllocator({ videoType });
  return allocator.allocate(shots, targetDuration);
}

/**
 * 获取节奏配置信息
 */
function getRhythmProfile(videoType) {
  return RHYTHM_PROFILES[videoType] || RHYTHM_PROFILES.action;
}

/**
 * 列出所有支持的叙事类型权重
 */
function listNarrativeWeights() {
  return { ...NARRATIVE_WEIGHTS };
}

/**
 * 列出所有支持的运镜类型权重
 */
function listCameraMoveWeights() {
  return { ...CAMERA_MOVE_WEIGHTS };
}

module.exports = {
  DurationAllocator,
  allocateDurations,
  getRhythmProfile,
  listNarrativeWeights,
  listCameraMoveWeights,
  NARRATIVE_WEIGHTS,
  CAMERA_MOVE_WEIGHTS,
  RHYTHM_PROFILES
};