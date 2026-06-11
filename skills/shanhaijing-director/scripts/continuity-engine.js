#!/usr/bin/env node
/**
 * 连贯性引擎 v1.0-Peng (ShanhaiStory Forge)
 * 
 * 核心设计：
 * - 四个正交子模块：转场规则库、运镜方向追踪器、景别过渡检查器、视觉元素验证器
 * - 输入：shots + prompts
 * - 输出：连贯性分析报告（评分 + 问题点位 + 过渡建议）
 * 
 * 七级景别体系：
 * ECU(1) < CU(2) < MCU(3) < MS(4) < FS(5) < LS(6) < ELS(7)
 * 
 * 版本: v1.0-Peng | 2026-05-29
 * 所属系统: ShanhaiStory Forge v2.26-Peng
 */

class ContinuityEngine {
  constructor() {
    this.version = '1.0-Peng';
    
    // 景别映射表
    this.SCALE_MAP = {
      'ECU': 1, 'extreme_close_up': 1, 'extreme close-up': 1, '大特写': 1,
      'CU': 2, 'close_up': 2, 'close-up': 2, '特写': 2,
      'MCU': 3, 'medium_close_up': 3, 'medium close-up': 3, '近景': 3,
      'MS': 4, 'medium_shot': 4, 'medium shot': 4, '中景': 4,
      'FS': 5, 'full_shot': 5, 'full shot': 5, '全景': 5,
      'LS': 6, 'long_shot': 6, 'long shot': 6, '远景': 6,
      'ELS': 7, 'extreme_long_shot': 7, 'extreme long shot': 7, '大远景': 7
    };
    
    // 景别过渡合法性矩阵
    this.SCALE_TRANSITION_MATRIX = this._buildScaleMatrix();
    
    // 运镜方向向量映射
    this.MOTION_VECTORS = {
      'push_in': [0, 0, 1], 'dolly_in': [0, 0, 1], 'zoom_in': [0, 0, 1],
      'pull_out': [0, 0, -1], 'dolly_out': [0, 0, -1], 'zoom_out': [0, 0, -1],
      'pan_left': [-1, 0, 0], 'pan_right': [1, 0, 0],
      'tilt_up': [0, 1, 0], 'tilt_down': [0, -1, 0],
      'track_left': [-1, 0, 0], 'track_right': [1, 0, 0],
      'crane_up': [0, 1, 0], 'crane_down': [0, -1, 0],
      'orbit_cw': [1, 0, 0], 'orbit_ccw': [-1, 0, 0],
      'handheld_follow': [0.3, 0, 0.5], 'static': [0, 0, 0],
      'aerial_push': [0, 0.3, 0.7], 'drone_forward': [0, 0.2, 0.8]
    };
  }

  /**
   * 主入口：分析相邻镜头对的连贯性
   * @param {Array} shots - 镜头列表
   * @param {Array} prompts - 提示词列表
   * @returns {Object} 连贯性分析结果
   */
  analyze(shots, prompts) {
    if (!shots || shots.length < 2) {
      return { score: 1.0, scaleIssues: [], motionIssues: [], visualIssues: [] };
    }
    
    const scaleIssues = [];
    const motionIssues = [];
    const visualIssues = [];
    
    // 分析所有相邻镜头对
    for (let i = 0; i < shots.length - 1; i++) {
      const shotA = shots[i];
      const shotB = shots[i + 1];
      const promptA = prompts?.find(p => p.shotId === shotA.id || p.id === shotA.id);
      const promptB = prompts?.find(p => p.shotId === shotB.id || p.id === shotB.id);
      
      // 1. 景别过渡检查
      const scaleCheck = this._checkScaleTransition(shotA, shotB);
      if (scaleCheck.verdict !== 'LEGAL') {
        scaleIssues.push({
          shotA: shotA.id,
          shotB: shotB.id,
          scaleA: scaleCheck.scaleA,
          scaleB: scaleCheck.scaleB,
          delta: scaleCheck.delta,
          verdict: scaleCheck.verdict,
          severity: scaleCheck.verdict === 'ILLEGAL' ? 'fatal' : 'severe',
          requiredTransition: scaleCheck.recommendedTransition
        });
      }
      
      // 2. 运镜方向检查
      const motionCheck = this._checkMotionContinuity(shotA, shotB);
      if (motionCheck.verdict !== 'ACCEPTABLE') {
        motionIssues.push({
          shotA: shotA.id,
          shotB: shotB.id,
          vectorA: motionCheck.vectorA,
          vectorB: motionCheck.vectorB,
          angle: motionCheck.angle,
          speedDelta: motionCheck.speedDelta,
          verdict: motionCheck.verdict,
          severity: motionCheck.verdict === 'CONFLICT_SEVERE' ? 'severe' : 'moderate',
          conflictType: motionCheck.conflictType
        });
      }
      
      // 3. 视觉元素检查
      const visualCheck = this._checkVisualContinuity(shotA, shotB, promptA, promptB);
      if (visualCheck.verdict !== 'CONTINUOUS') {
        visualIssues.push({
          shotA: shotA.id,
          shotB: shotB.id,
          element: visualCheck.element,
          lightingDelta: visualCheck.lightingDelta,
          overlapScore: visualCheck.overlapScore,
          verdict: visualCheck.verdict,
          severity: visualCheck.verdict === 'NO_CONTINUITY' ? 'severe' : 'moderate'
        });
      }
    }
    
    // 计算综合评分
    const score = this._calculateScore(scaleIssues, motionIssues, visualIssues, shots.length);
    
    return {
      score,
      scaleIssues,
      motionIssues,
      visualIssues,
      totalPairs: shots.length - 1,
      problemPairs: new Set([
        ...scaleIssues.map(i => i.shotA + '->' + i.shotB),
        ...motionIssues.map(i => i.shotA + '->' + i.shotB),
        ...visualIssues.map(i => i.shotA + '->' + i.shotB)
      ]).size
    };
  }

  // ====== 景别过渡检查器 ======
  _checkScaleTransition(shotA, shotB) {
    const scaleA = this._extractScale(shotA);
    const scaleB = this._extractScale(shotB);
    
    const levelA = this.SCALE_MAP[scaleA] || 4;
    const levelB = this.SCALE_MAP[scaleB] || 4;
    const delta = Math.abs(levelA - levelB);
    
    // 查合法性矩阵
    const verdict = this._lookupScaleMatrix(levelA, levelB);
    const recommendedTransition = verdict === 'ILLEGAL' ? 'dissolve_or_fade' : 
                                 verdict === 'CONDITIONAL' ? 'dissolve' : 'hard_cut';
    
    return { scaleA, scaleB, levelA, levelB, delta, verdict, recommendedTransition };
  }
  
  _extractScale(shot) {
    if (!shot) return 'MS';
    
    // 从多个可能来源提取景别
    const candidates = [
      shot.camera?.scale,
      shot.scale,
      shot.shotSize,
      shot.type
    ];
    
    for (const c of candidates) {
      if (!c) continue;
      const normalized = String(c).toUpperCase().trim();
      if (this.SCALE_MAP[normalized]) return normalized;
      
      // 模糊匹配
      const key = Object.keys(this.SCALE_MAP).find(k => 
        normalized.includes(k.toUpperCase()) || k.toUpperCase().includes(normalized)
      );
      if (key) return key;
    }
    
    return 'MS'; // 默认中景
  }
  
  _lookupScaleMatrix(levelA, levelB) {
    // 简化矩阵：差<=1=合法，差=2=条件合法，差>=3=非法
    const delta = Math.abs(levelA - levelB);
    if (delta <= 1) return 'LEGAL';
    if (delta === 2) return 'CONDITIONAL';
    return 'ILLEGAL';
  }
  
  _buildScaleMatrix() {
    // 生成7x7合法性矩阵
    const matrix = {};
    const levels = [1, 2, 3, 4, 5, 6, 7];
    
    levels.forEach(a => {
      matrix[a] = {};
      levels.forEach(b => {
        const delta = Math.abs(a - b);
        if (delta <= 1) matrix[a][b] = 'LEGAL';
        else if (delta === 2) matrix[a][b] = 'CONDITIONAL';
        else matrix[a][b] = 'ILLEGAL';
      });
    });
    
    return matrix;
  }

  // ====== 运镜方向追踪器 ======
  _checkMotionContinuity(shotA, shotB) {
    const moveA = this._extractMotion(shotA);
    const moveB = this._extractMotion(shotB);
    
    const vectorA = this.MOTION_VECTORS[moveA] || [0, 0, 0];
    const vectorB = this.MOTION_VECTORS[moveB] || [0, 0, 0];
    
    // 计算向量夹角
    const angle = this._calculateAngle(vectorA, vectorB);
    
    // 计算速度差异（模值差异率）
    const magA = this._magnitude(vectorA);
    const magB = this._magnitude(vectorB);
    const speedDelta = Math.abs(magA - magB) / Math.max(magA, magB, 0.001);
    
    // 判定冲突等级
    let verdict = 'ACCEPTABLE';
    let conflictType = 'none';
    
    if (angle > 90 && speedDelta > 0.3) {
      verdict = 'CONFLICT_SEVERE';
      conflictType = 'direction_reversal_with_speed_mismatch';
    } else if (angle > 90) {
      verdict = 'CONFLICT_MODERATE';
      conflictType = 'direction_reversal';
    } else if (speedDelta > 0.5) {
      verdict = 'CONFLICT_MINOR';
      conflictType = 'speed_mismatch';
    } else if (angle > 45 && speedDelta > 0.2) {
      verdict = 'CONFLICT_MINOR';
      conflictType = 'axis_shift';
    }
    
    return { vectorA, vectorB, angle, speedDelta, verdict, conflictType };
  }
  
  _extractMotion(shot) {
    if (!shot) return 'static';
    
    const move = (shot.camera?.move || shot.cameramove || shot.camera || '').toLowerCase();
    
    // 关键词匹配
    if (/push|dolly.in|zoom.in|crash/i.test(move)) return 'push_in';
    if (/pull|dolly.out|zoom.out/i.test(move)) return 'pull_out';
    if (/pan.left|left.pan/i.test(move)) return 'pan_left';
    if (/pan.right|right.pan/i.test(move)) return 'pan_right';
    if (/tilt.up|up.tilt/i.test(move)) return 'tilt_up';
    if (/tilt.down|down.tilt/i.test(move)) return 'tilt_down';
    if (/track.left/i.test(move)) return 'track_left';
    if (/track.right/i.test(move)) return 'track_right';
    if (/crane.up|boom.up/i.test(move)) return 'crane_up';
    if (/crane.down|boom.down/i.test(move)) return 'crane_down';
    if (/orbit|rotate|swirl/i.test(move)) return 'orbit_cw';
    if (/handheld|shake|run|jerk/i.test(move)) return 'handheld_follow';
    if (/static|lock|fixed|still/i.test(move)) return 'static';
    if (/aerial|drone|fly|helicopter/i.test(move)) return 'aerial_push';
    
    return 'static';
  }
  
  _calculateAngle(v1, v2) {
    const dot = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
    const mag1 = this._magnitude(v1);
    const mag2 = this._magnitude(v2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cos) * (180 / Math.PI);
  }
  
  _magnitude(v) {
    return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
  }

  // ====== 视觉元素验证器 ======
  _checkVisualContinuity(shotA, shotB, promptA, promptB) {
    const textA = promptA?.prompt || promptA?._generatedPrompt || '';
    const textB = promptB?.prompt || promptB?._generatedPrompt || '';
    
    // 提取关键视觉元素
    const elementsA = this._extractVisualElements(textA);
    const elementsB = this._extractVisualElements(textB);
    
    // 计算重叠度
    const overlap = elementsA.filter(e => elementsB.includes(e));
    const overlapScore = elementsA.length > 0 ? overlap.length / elementsA.length : 1;
    
    // 检查光影色调变化
    const lightingA = this._extractLightingTone(textA);
    const lightingB = this._extractLightingTone(textB);
    const lightingDelta = this._calculateLightingDelta(lightingA, lightingB);
    
    // 判定连续性
    let verdict = 'CONTINUOUS';
    let element = 'none';
    
    if (overlapScore < 0.2 && lightingDelta > 2000) {
      verdict = 'NO_CONTINUITY';
      element = 'lighting_and_elements';
    } else if (overlapScore < 0.1) {
      verdict = 'NO_CONTINUITY';
      element = 'visual_elements';
    } else if (lightingDelta > 2000) {
      verdict = 'LIGHTING_BREAK';
      element = 'lighting';
    }
    
    return { overlapScore, lightingDelta, verdict, element };
  }
  
  _extractVisualElements(prompt) {
    if (!prompt) return [];
    
    // 提取关键视觉元素关键词
    const elements = [];
    const elementPatterns = [
      /\b(torch|flame|fire|light)\b/gi,
      /\b(crystal|gem|stone|rock|mountain|tree|forest)\b/gi,
      /\b(weapon|sword|shield|axe|spear|bow)\b/gi,
      /\b(water|river|lake|ocean|rain|mist|fog)\b/gi,
      /\b(animal|creature|beast|dragon|bird|wolf)\b/gi,
      /\b(building|ruin|temple|castle|bridge|tower)\b/gi,
      /\b(sun|moon|star|cloud|sky|storm|lightning)\b/gi
    ];
    
    elementPatterns.forEach(pattern => {
      const matches = prompt.match(pattern);
      if (matches) elements.push(...matches.map(m => m.toLowerCase()));
    });
    
    return [...new Set(elements)]; // 去重
  }
  
  _extractLightingTone(prompt) {
    if (!prompt) return null;
    const p = prompt.toLowerCase();
    
    // 提取色温值（如果存在）
    const tempMatch = p.match(/(\d{3,4})\s*K/);
    if (tempMatch) return parseInt(tempMatch[1]);
    
    // 定性判断
    if (/warm|golden|sunset|orange|amber|firelight|torch|red|yellow/i.test(p)) return 2800;
    if (/cool|cold|blue|moonlight|twilight|dusk|cyan|teal/i.test(p)) return 6500;
    if (/harsh|high.contrast|dramatic|spotlight|hard/i.test(p)) return 4500;
    if (/soft|diffuse|even|flat|overcast|cloudy|gentle/i.test(p)) return 5500;
    if (/dark|pitch|black|shadow|noir|night|midnight/i.test(p)) return 2000;
    
    return 5500; // 默认中性色温
  }
  
  _calculateLightingDelta(toneA, toneB) {
    if (!toneA || !toneB) return 0;
    return Math.abs(toneA - toneB);
  }

  // ====== 评分合成 ======
  _calculateScore(scaleIssues, motionIssues, visualIssues, totalShots) {
    const totalPairs = totalShots - 1;
    if (totalPairs <= 0) return 1.0;
    
    // 致命问题扣分
    const fatalPenalty = scaleIssues.filter(i => i.severity === 'fatal').length * 0.25;
    const severePenalty = scaleIssues.filter(i => i.severity === 'severe').length * 0.15;
    const moderatePenalty = (motionIssues.filter(i => i.severity === 'severe').length + 
                             visualIssues.filter(i => i.severity === 'severe').length) * 0.1;
    
    const totalPenalty = fatalPenalty + severePenalty + moderatePenalty;
    
    // 基础分1.0，减去惩罚
    return Math.max(0, Math.min(1, 1.0 - totalPenalty));
  }
}

module.exports = ContinuityEngine;