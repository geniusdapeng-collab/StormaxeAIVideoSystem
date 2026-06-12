#!/usr/bin/env node
/**
 * Paywall Planner — 卡点节奏设计师 (M2)
 * 设计短剧的商业节奏，确保付费转化率
 */
function run(input) {
  const structureData = input.structureData || {};
  const totalEpisodes = input.totalEpisodes || 80;
  const paywallPositions = input.paywallPositions || [10, 28, 58];

  const episodeRhythm = [];
  for (let i = 1; i <= totalEpisodes; i++) {
    let hookType = 'suspenseHook';
    let isPaywall = paywallPositions.includes(i);
    let tensionTarget = 30;

    if (i <= 8) {
      hookType = ['suspenseHook', 'crisisHook', 'visualSpectacle'][i % 3];
      tensionTarget = 20 + i * 3;
    } else if (i <= paywallPositions[0]) {
      hookType = 'crisisHook';
      tensionTarget = 60 + (i - 8) * 3;
    } else if (i <= paywallPositions[1]) {
      hookType = 'twistHook';
      tensionTarget = 50 + (i - paywallPositions[0]) * 2;
    } else if (i <= paywallPositions[2]) {
      hookType = 'crisisHook';
      tensionTarget = 60 + (i - paywallPositions[1]) * 2;
    } else {
      hookType = 'emotionHook';
      tensionTarget = 80 + Math.min(20, (i - paywallPositions[2]) * 2);
    }

    episodeRhythm.push({
      episode: i,
      hookType,
      endingHook: isPaywall ? 'crisisHook' : hookType,
      isPaywall,
      tensionTarget: Math.min(100, tensionTarget)
    });
  }

  return {
    paywallPositions,
    episodeRhythm,
    freeZoneStrategy: `前 ${paywallPositions[0]-1} 集建立人设+核心矛盾+让观众追下去`,
    conversionStrategy: `卡一(${paywallPositions[0]}集)用生死悬念，卡二(${paywallPositions[1]}集)用真相揭露，卡三(${paywallPositions[2]}集)用终极抉择`,
    totalPaywalls: paywallPositions.length
  };
}
module.exports = { run };
