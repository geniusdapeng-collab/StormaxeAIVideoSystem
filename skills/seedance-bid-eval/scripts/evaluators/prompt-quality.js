#!/usr/bin/env node
/**
 * Prompt Quality Evaluator — 提示词实际质量评估器
 * 🆕 v2.6.1-Peng: 修复 P1 断点（评估与渲染质量脱节）
 * 
 * 评估 plan 中 shots 的实际 prompts 质量，而非仅评估 plan 结构。
 * 三项检查：角色名覆盖率、动作描述覆盖率、6步公式合规性
 */

function evaluate(plan, userNeed) {
  const shots = plan.shots || [];
  const total = shots.length || 1;
  
  let hasCharNameCount = 0;
  let hasActionCount = 0;
  let compliantCount = 0;
  const warnings = [];
  const strengths = [];
  const subScores = {};
  
  for (const shot of shots) {
    const prompt = shot.prompt || shot.composedPrompt || '';
    const chars = shot.characters || [];
    
    // 检查1：角色名是否在 prompt 中
    if (chars.length > 0) {
      const allCharsPresent = chars.every(c => {
        const name = typeof c === 'string' ? c : (c.name || '');
        return name && prompt.includes(name);
      });
      if (allCharsPresent) hasCharNameCount++;
    } else {
      hasCharNameCount++; // 无角色要求的镜头，算通过
    }
    
    // 检查2：动作描述核心关键词是否保留
    const desc = (shot.description || '').replace(/\d+-\d+秒[：:]/g, '').trim();
    if (!desc || desc.length < 4) {
      hasActionCount++; // 无描述的镜头，算通过
    } else {
      // 检查描述的前20字符是否在prompt中
      const coreFragment = desc.substring(0, 20);
      if (prompt.includes(coreFragment)) {
        hasActionCount++;
      }
    }
    
    // 检查3：6步公式合规性（角色/动作/camera/style/avoid 至少4个）
    let formulaHits = 0;
    if (chars.length > 0 && chars.some(c => prompt.includes(typeof c === 'string' ? c : (c.name || '')))) formulaHits++;
    if (/(?:camera|镜头|运镜|push|pull|pan|tilt|dolly|tracking)/i.test(prompt)) formulaHits++;
    if (/(?:style|风格|写实|写实真人|cinematic)/i.test(prompt)) formulaHits++;
    if (/avoid/i.test(prompt)) formulaHits++;
    if (formulaHits >= 3) compliantCount++;
  }
  
  const charNameRate = hasCharNameCount / total;
  const actionRate = hasActionCount / total;
  const compliantRate = compliantCount / total;
  
  // 加权得分：角色名40% + 动作描述40% + 公式合规20%
  const score = Math.round((charNameRate * 0.4 + actionRate * 0.4 + compliantRate * 0.2) * 100);
  
  subScores.charNameCoverage = `${hasCharNameCount}/${total} (${Math.round(charNameRate*100)}%)`;
  subScores.actionCoverage = `${hasActionCount}/${total} (${Math.round(actionRate*100)}%)`;
  subScores.formulaCompliance = `${compliantCount}/${total} (${Math.round(compliantRate*100)}%)`;
  
  // 生成反馈
  if (charNameRate < 0.5) {
    warnings.push(`${Math.round((1-charNameRate)*100)}%镜头缺失角色名`);
  } else if (charNameRate >= 0.9) {
    strengths.push('角色名覆盖率优秀');
  }
  
  if (actionRate < 0.5) {
    warnings.push(`${Math.round((1-actionRate)*100)}%镜头动作描述丢失`);
  } else if (actionRate >= 0.9) {
    strengths.push('动作描述保留完整');
  }
  
  if (compliantRate < 0.5) {
    warnings.push(`${Math.round((1-compliantRate)*100)}%镜头不符合6步公式`);
  } else if (compliantRate >= 0.9) {
    strengths.push('6步公式合规性优秀');
  }
  
  return {
    score,
    subScores,
    feedback: [],
    warnings,
    strengths
  };
}

module.exports = { evaluate };
