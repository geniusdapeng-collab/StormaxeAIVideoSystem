/**
 * Seedance 合规性评估器
 * 评估提示词是否符合 Seedance 2.0 的提交规范和约束条件
 */

const MAX_PROMPT_LENGTH = 500;

function evaluate(plan, userNeed) {
  const shots = plan.shots || [];
  const subScores = {};
  const feedback = [];
  const warnings = [];
  const strengths = [];

  // === 3.1 提示词长度合规 ===
  const promptLengths = shots.map(s => {
    const desc = s.description || '';
    const chars = (s.characters || []).join(',');
    return desc.length + chars.length;
  });

  const validPrompts = promptLengths.filter(l => l <= MAX_PROMPT_LENGTH).length;
  const complianceRate = shots.length > 0 ? validPrompts / shots.length : 0.5;
  const lengthScore = Math.round(complianceRate * 100);
  subScores.promptLength = lengthScore;

  const overLengthShots = shots.filter((s, i) => promptLengths[i] > MAX_PROMPT_LENGTH);
  if (overLengthShots.length === 0) {
    strengths.push(`所有镜头提示词长度合规（≤${MAX_PROMPT_LENGTH}字符）`);
  } else {
    feedback.push(`${overLengthShots.length} 个镜头提示词超长：${overLengthShots.map(s => s.id).join(', ')}`);
  }

  // === 3.2 6步公式格式合规 ===
  const sixStepCompliant = shots.filter(s => checkSixStepFormat(s)).length;
  const formatScore = Math.round((sixStepCompliant / Math.max(1, shots.length)) * 100);
  subScores.sixStepFormat = formatScore;

  if (formatScore >= 80) {
    strengths.push(`${Math.round(sixStepCompliant / shots.length * 100)}% 镜头符合6步公式格式`);
  } else {
    feedback.push(`${shots.length - sixStepCompliant} 个镜头不符合6步公式格式`);
  }

  // === 3.3 敏感/违规内容 ===
  const sensitivePatterns = [
    /暴力/, /血腥/, /裸露/, /色情/, /违法/, /恐怖/, /歧视/,
    /violence/, /blood/, /nude/, /explicit/, /hate/, /terror/
  ];
  let hasSensitive = false;
  for (const s of shots) {
    const text = [s.description, s.environment, s.handoff].join(' ');
    if (sensitivePatterns.some(p => p.test(text))) {
      hasSensitive = true;
      warnings.push(`镜头 ${s.id} 可能包含敏感内容`);
    }
  }
  subScores.sensitiveContent = hasSensitive ? 0 : 100;

  if (hasSensitive) {
    feedback.push('检测到敏感内容，需要调整');
  }

  // === 3.4 参数合法性 ===
  const durationValid = plan.totalDuration > 0 && plan.totalDuration <= 600;
  const ratioValid = !plan.ratio || ['16:9', '9:16', '1:1', '4:3'].includes(plan.ratio);
  const shotsValid = plan.totalShots > 0 && plan.totalShots <= 200;

  let paramScore = 100;
  if (!durationValid) { paramScore -= 30; feedback.push(`时长不合法：${plan.totalDuration}秒`); }
  if (!ratioValid && plan.ratio) { paramScore -= 20; feedback.push(`比例不合法：${plan.ratio}`); }
  if (!shotsValid) { paramScore -= 20; feedback.push(`镜头数不合法：${plan.totalShots}`); }
  subScores.paramsValid = Math.max(0, paramScore);

  // === 3.5 角色一致性 ===
  const charNames = (plan.characters || []);
  const shotChars = [...new Set(shots.flatMap(s => s.characters || []))];
  const undefinedChars = shotChars.filter(c => !charNames.includes(c) && !charNames.some(cn => c.includes(cn)));
  const consistencyScore = undefinedChars.length === 0 ? 100 : Math.max(0, 100 - undefinedChars.length * 20);
  subScores.characterConsistency = consistencyScore;

  if (undefinedChars.length > 0) {
    feedback.push(`未定义角色：${undefinedChars.join(', ')}`);
  }

  // 加权总分
  const weights = {
    promptLength: 0.25,
    sixStepFormat: 0.25,
    sensitiveContent: 0.20,
    paramsValid: 0.15,
    characterConsistency: 0.15
  };
  const score = Math.round(
    Object.entries(subScores).reduce((sum, [k, v]) => sum + v * (weights[k] || 0), 0)
  );

  return { score, subScores, feedback, warnings, strengths };
}

function checkSixStepFormat(shot) {
  // 6步公式：[主体], [动作], in [环境], camera [镜头运动], style [风格+光线], avoid [约束]
  const desc = (shot.description || '') + (shot.environment || '') + (shot.camera || '');

  // 检查是否有主体（角色名）
  const hasSubject = (shot.characters || []).length > 0;
  // 检查是否有动作（描述字段）
  const hasAction = desc.length > 10;
  // 检查是否有环境
  const hasEnvironment = shot.environment && shot.environment.length > 2;
  // 检查是否有运镜
  const hasCamera = shot.camera && shot.camera.length > 2;
  // 检查是否有收束（作为风格和约束的代理）
  const hasHandoff = shot.handoff && shot.handoff.length > 2;

  const checks = [hasSubject, hasAction, hasEnvironment, hasCamera, hasHandoff];
  const passed = checks.filter(Boolean).length;
  return passed >= 4; // 至少 4/5 通过
}

module.exports = { evaluate };
