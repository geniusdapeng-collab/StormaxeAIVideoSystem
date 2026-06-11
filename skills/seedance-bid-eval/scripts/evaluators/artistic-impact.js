/**
 * 艺术感染力评估器
 * 从提示词推测视频作品的视觉冲击力、情感共鸣、独特性、镜头语言丰富度
 */

function evaluate(plan, userNeed) {
  const shots = plan.shots || [];
  const subScores = {};
  const feedback = [];
  const warnings = [];
  const strengths = [];

  // === 4.1 画面想象力（视觉冲击力） ===
  const visualImpact = evaluateVisualImpact(shots);
  subScores.visualImpact = visualImpact;

  if (visualImpact >= 70) {
    strengths.push('画面想象力丰富，视觉冲击力强');
  } else if (visualImpact < 40) {
    feedback.push('画面描述平淡，建议增加视觉层次和光影细节');
  }

  // === 4.2 情感共鸣潜力 ===
  const emotionScore = evaluateEmotionalResonance(shots);
  subScores.emotionalResonance = emotionScore;

  if (emotionScore >= 70) {
    strengths.push('情感层次丰富，有共鸣潜力');
  } else {
    feedback.push('情感表达单薄，建议增加情绪层次');
  }

  // === 4.3 独特性（非套路化） ===
  const uniquenessScore = evaluateUniqueness(shots, plan);
  subScores.uniqueness = uniquenessScore;

  if (uniquenessScore >= 65) {
    strengths.push('方案有一定独特性');
  } else {
    feedback.push('方案套路化明显，建议增加创意元素');
  }

  // === 4.4 镜头语言丰富度 ===
  const cameraScore = evaluateCameraLanguage(shots);
  subScores.cameraLanguage = cameraScore;

  if (cameraScore >= 70) {
    strengths.push('镜头语言丰富多样');
  } else {
    feedback.push('镜头语言单一，建议增加运镜变化');
  }

  // === 4.5 节奏与张力配合 ===
  const rhythmScore = evaluateTensionRhythm(shots);
  subScores.tensionRhythm = rhythmScore;

  if (rhythmScore >= 60) {
    strengths.push('节奏与张力配合良好');
  } else {
    feedback.push('节奏与张力配合不够，建议调整');
  }

  // 加权总分
  const weights = {
    visualImpact: 0.25,
    emotionalResonance: 0.25,
    uniqueness: 0.20,
    cameraLanguage: 0.15,
    tensionRhythm: 0.15
  };
  const score = Math.round(
    Object.entries(subScores).reduce((sum, [k, v]) => sum + v * (weights[k] || 0), 0)
  );

  return { score, subScores, feedback, warnings, strengths };
}

function evaluateVisualImpact(shots) {
  let score = 50;

  // 检查光影描述的丰富度
  const lightingKeywords = ['光', '影', '光晕', '逆光', '侧光', '顶光', '漫射', '高光', '暗部', '轮廓光', 'golden', 'rim light', 'backlit'];
  const lightingCount = shots.reduce((sum, s) => {
    const text = (s.description || '') + (s.environment || '');
    return sum + lightingKeywords.filter(kw => text.includes(kw)).length;
  }, 0);
  if (lightingCount > shots.length * 0.5) score += 20;

  // 检查色彩描述的丰富度
  const colorKeywords = ['金色', '蓝色', '红色', '暖色', '冷色', '暗金', '冰蓝', '暖黄', '冷蓝', 'golden', 'warm', 'cool'];
  const colorCount = shots.reduce((sum, s) => {
    const text = (s.description || '') + (s.environment || '');
    return sum + colorKeywords.filter(kw => text.includes(kw)).length;
  }, 0);
  if (colorCount > shots.length * 0.3) score += 15;

  // 检查场景多样性
  const scenes = new Set(shots.map(s => s.environment || s.scene || ''));
  if (scenes.size > shots.length * 0.3) score += 15;

  return Math.min(100, Math.max(0, score));
}

function evaluateEmotionalResonance(shots) {
  let score = 50;

  // 情绪变化的丰富度
  const emotions = new Set(shots.map(s => s.emotionStart + s.emotionEnd));
  if (emotions.size > 5) score += 20;
  else if (emotions.size > 3) score += 10;

  // 张力曲线是否有明显起伏
  const tensions = shots.map(s => s.tension || 0);
  const maxTension = Math.max(...tensions, 0);
  const minTension = Math.min(...tensions, 100);
  const tensionRange = maxTension - minTension;

  if (tensionRange > 60) score += 20;
  else if (tensionRange > 30) score += 10;

  // 检查是否有情感关键词
  const emotionKeywords = ['感动', '温暖', '震撼', '治愈', '悲伤', '愤怒', '喜悦', '恐惧', '希望', '绝望', '勇气', '爱', '恨', '释怀'];
  const emotionCount = shots.reduce((sum, s) => {
    const text = (s.description || '') + (s.emotionStart || '') + (s.emotionEnd || '');
    return sum + emotionKeywords.filter(kw => text.includes(kw)).length;
  }, 0);
  if (emotionCount > shots.length * 0.2) score += 10;

  return Math.min(100, Math.max(0, score));
}

function evaluateUniqueness(shots, plan) {
  let score = 50;

  // 检查是否有独特的场景设置
  const uniqueScenes = shots.filter(s => {
    const desc = (s.description || '').toLowerCase();
    const env = (s.environment || '').toLowerCase();
    return env.includes('废墟') || env.includes('星空') || env.includes('海底') ||
           env.includes('云端') || env.includes('沙漠') || env.includes('极光') ||
           env.includes('wasteland') || env.includes('starry') || env.includes('underwater');
  }).length;
  if (uniqueScenes > shots.length * 0.2) score += 20;

  // 检查运镜是否有创意
  const creativeCameras = shots.filter(s => {
    const cam = (s.camera || '').toLowerCase();
    return cam.includes('环绕') || cam.includes('穿越') || cam.includes('跟随') ||
           cam.includes('orbit') || cam.includes('drone') || cam.includes('aerial') ||
           cam.includes('whip') || cam.includes('crane');
  }).length;
  if (creativeCameras > shots.length * 0.3) score += 15;

  // 检查是否有转场设计
  const hasTransitions = shots.filter(s => s.transitionType && !s.transitionType.includes('硬切')).length;
  if (hasTransitions > shots.length * 0.5) score += 15;

  return Math.min(100, Math.max(0, score));
}

function evaluateCameraLanguage(shots) {
  let score = 50;

  // 运镜多样性
  const cameras = shots.map(s => s.camera || '');
  const uniqueCameras = new Set(cameras);
  const cameraDiversity = uniqueCameras.size / Math.max(1, cameras.length);

  if (cameraDiversity > 0.6) score += 25;
  else if (cameraDiversity > 0.4) score += 15;

  // 景别变化
  const sizes = ['特写', '近景', '中景', '全景', '远景', 'close', 'medium', 'wide', 'extreme'];
  const sizeCoverage = shots.filter(s => {
    const cam = (s.camera || '').toLowerCase();
    return sizes.some(sz => cam.includes(sz));
  }).length;
  if (sizeCoverage > shots.length * 0.5) score += 15;

  // 角度变化
  const angles = ['仰拍', '俯拍', '倾斜', 'low angle', 'high angle', 'dutch'];
  const angleCoverage = shots.filter(s => {
    const cam = (s.camera || '').toLowerCase();
    return angles.some(a => cam.includes(a));
  }).length;
  if (angleCoverage > shots.length * 0.2) score += 10;

  return Math.min(100, Math.max(0, score));
}

function evaluateTensionRhythm(shots) {
  if (shots.length < 3) return 40;

  const tensions = shots.map(s => s.tension || 0);
  let score = 50;

  // 检查是否有明显的张力变化趋势
  let rises = 0, falls = 0;
  for (let i = 1; i < tensions.length; i++) {
    if (tensions[i] > tensions[i - 1] + 5) rises++;
    else if (tensions[i] < tensions[i - 1] - 5) falls++;
  }

  if (rises > 0 && falls > 0) score += 20; // 有起伏
  if (rises + falls > shots.length * 0.3) score += 15; // 变化频繁

  // 检查是否有明显的高潮和低谷
  const maxTension = Math.max(...tensions);
  const minTension = Math.min(...tensions);
  if (maxTension - minTension > 50) score += 15;

  return Math.min(100, Math.max(0, score));
}

module.exports = { evaluate };
