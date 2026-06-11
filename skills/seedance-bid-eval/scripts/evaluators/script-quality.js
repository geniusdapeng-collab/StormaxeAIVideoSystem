/**
 * 剧本质量评估器
 * 评估故事脉络、角色弧光、冲突设计、节奏感
 */

function evaluate(plan, userNeed) {
  const shots = plan.shots || [];
  const subScores = {};
  const feedback = [];
  const warnings = [];
  const strengths = [];

  // === 2.1 故事脉络清晰度（起承转合） ===
  const acts = shots.reduce((acc, s) => {
    if (!acc.includes(s.act)) acc.push(s.act);
    return acc;
  }, []);

  const actDuration = {};
  shots.forEach(s => {
    if (!actDuration[s.act]) actDuration[s.act] = 0;
    actDuration[s.act] += s.duration || 0;
  });

  // 检查是否有完整的四幕结构
  const hasFourActs = acts.length >= 3;
  const actBalance = calculateActBalance(actDuration);

  subScores.structureClarity = hasFourActs ? Math.round(70 + actBalance * 30) : Math.round(actBalance * 60);

  if (hasFourActs && actBalance > 0.7) {
    strengths.push('故事脉络完整，四幕结构清晰');
  } else if (!hasFourActs) {
    feedback.push(`结构不完整：仅有 ${acts.length} 幕，建议至少 3 幕`);
  }

  // === 2.2 角色弧光完整性 ===
  const charTimeline = plan.characterTimeline || {};
  const arcScore = evaluateCharacterArcs(charTimeline, shots);
  subScores.characterArc = arcScore;

  if (arcScore >= 70) {
    strengths.push('角色弧光设计合理，有成长变化');
  } else {
    feedback.push('角色弧光不足，建议增加角色成长/变化轨迹');
  }

  // === 2.3 冲突设计（张力变化） ===
  const tensionCurve = shots.map(s => s.tension || 0);
  const tensionScore = evaluateTensionCurve(tensionCurve);
  subScores.conflictDesign = tensionScore;

  if (tensionScore >= 70) {
    strengths.push('张力曲线设计合理，有冲突和转折');
  } else {
    feedback.push('张力变化平淡，建议增加冲突和转折');
  }

  // === 2.4 节奏感（幕间时长分配） ===
  const totalDuration = shots.reduce((s, shot) => s + (shot.duration || 0), 0);
  const rhythmScore = evaluateRhythm(actDuration, totalDuration, shots);
  subScores.rhythm = rhythmScore;

  if (rhythmScore >= 65) {
    strengths.push('节奏分配合理');
  } else {
    feedback.push('节奏分配不均，建议调整各幕时长比例');
  }

  // === 2.5 转场自然度 ===
  const transitions = shots.filter(s => s.transitionType).length;
  const transitionRatio = shots.length > 0 ? transitions / (shots.length - 1) : 0;
  const transitionScore = Math.round(Math.min(100, transitionRatio * 100 + 30));
  subScores.transitionQuality = transitionScore;

  if (transitionRatio > 0.8) {
    strengths.push('转场设计完整');
  } else {
    feedback.push(`转场覆盖不足：${Math.round(transitionRatio * 100)}%，建议增加转场设计`);
  }

  // 加权总分
  const weights = { structureClarity: 0.25, characterArc: 0.25, conflictDesign: 0.20, rhythm: 0.15, transitionQuality: 0.15 };
  const score = Math.round(
    Object.entries(subScores).reduce((sum, [k, v]) => sum + v * (weights[k] || 0), 0)
  );

  return { score, subScores, feedback, warnings, strengths };
}

function calculateActBalance(actDuration) {
  const values = Object.values(actDuration);
  if (values.length < 2) return 0.5;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  const cv = Math.sqrt(variance) / avg; // 变异系数
  return Math.max(0, Math.min(1, 1 - cv));
}

function evaluateCharacterArcs(charTimeline, shots) {
  let score = 50;
  const chars = Object.entries(charTimeline);

  if (chars.length === 0) return 40;

  for (const [name, info] of chars) {
    // 角色是否有成长：从开始到结束的情绪变化
    const firstShot = shots.find(s => s.id === info.firstAppears);
    const lastShot = shots.find(s => s.id === info.lastAppears);

    if (firstShot && lastShot) {
      const startTension = firstShot.tension || 0;
      const endTension = lastShot.tension || 0;
      const tensionDiff = Math.abs(endTension - startTension);

      if (tensionDiff > 30) score += 15; // 有明显变化
      else if (tensionDiff > 10) score += 10;
    }

    // 角色是否有关键时刻
    if (info.keyMoments && info.keyMoments.length > 0) score += 10;
  }

  return Math.min(100, score);
}

function evaluateTensionCurve(tensions) {
  if (tensions.length < 3) return 40;

  // 检查是否有明显的上升趋势和下降趋势
  const maxIdx = tensions.indexOf(Math.max(...tensions));
  const hasClimax = maxIdx > tensions.length * 0.3 && maxIdx < tensions.length * 0.8;

  // 检查波动性（是否有变化）
  let changes = 0;
  for (let i = 1; i < tensions.length; i++) {
    if (Math.abs(tensions[i] - tensions[i - 1]) > 10) changes++;
  }
  const volatility = changes / tensions.length;

  let score = 50;
  if (hasClimax) score += 20;
  score += Math.round(volatility * 30);

  return Math.min(100, Math.max(0, score));
}

function evaluateRhythm(actDuration, totalDuration, shots) {
  if (totalDuration === 0) return 50;

  // 检查镜头时长分布是否合理
  const durations = shots.map(s => s.duration || 0);
  const avgDuration = durations.reduce((s, d) => s + d, 0) / durations.length;
  const shortShots = durations.filter(d => d < 3).length;
  const longShots = durations.filter(d => d > 15).length;

  let score = 70;
  if (shortShots > durations.length * 0.3) score -= 15; // 太多短镜头
  if (longShots > durations.length * 0.2) score -= 10;  // 太多长镜头
  if (avgDuration < 4 || avgDuration > 10) score -= 10;  // 平均时长不合理

  return Math.max(0, Math.min(100, score));
}

module.exports = { evaluate };
