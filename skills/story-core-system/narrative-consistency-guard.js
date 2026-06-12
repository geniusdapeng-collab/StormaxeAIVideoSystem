#!/usr/bin/env node

class NarrativeConsistencyGuard {
 validate(kernel, shots) {
 const issues = [];
 if (!kernel.theme) issues.push('缺少主题');
 if (!kernel.conflict) issues.push('缺少核心冲突');
 if (!kernel.emotionalCurve || kernel.emotionalCurve.length < 3) issues.push('情感弧线不足');
 const beats = shots.map(s => s.beat);
 if (!(beats.includes('protect') || beats.includes('burst') || beats.includes('defy'))) issues.push('缺少高潮行为节点');
 const hasEnding = beats.includes('dissolve') || beats.includes('stand') || beats.includes('understand');
 if (!hasEnding) issues.push('缺少余韵或收束结尾');
 if (!shots.every(s => s.worldReaction && s.worldReaction.atmosphere)) issues.push('Nirath世界未充分参与叙事');
 if (!shots.every(s => !!s.dramaticPurpose)) issues.push('存在镜头没有戏剧目的');
 return { passed: issues.length === 0, issues };
 }
}

module.exports = { NarrativeConsistencyGuard };
