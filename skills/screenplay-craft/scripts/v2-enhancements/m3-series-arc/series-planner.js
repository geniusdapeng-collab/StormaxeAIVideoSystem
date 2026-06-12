#!/usr/bin/env node
/**
 * Series Planner — 系列化架构 (M4)
 * 管理 60-100 集系列，确保每集独立精彩、集集连续连贯
 */

function run(input) {
  const worldData = input.worldData || {};
  const themeData = input.themeData || {};
  const totalEpisodes = input.totalEpisodes || 80;
  const aspectRatio = input.aspectRatio || '9:16';

  const layer1End = Math.min(10, Math.floor(totalEpisodes * 0.125));
  const layer2End = Math.min(40, Math.floor(totalEpisodes * 0.5));
  const layer3End = totalEpisodes;

  // 生成每集目录
  const episodeDirectory = [];
  for (let i = 1; i <= totalEpisodes; i++) {
    let hook, layer, keyEvent;
    if (i <= layer1End) {
      layer = '表层';
      hook = i === 1 ? '💥' : '⚡';
      keyEvent = i === 1 ? '主角身份 reveal' : '世界规则展开';
    } else if (i <= layer2End) {
      layer = '深度';
      hook = '🔥';
      keyEvent = '隐藏身份逐步揭露';
    } else {
      layer = '核心';
      hook = '👑';
      keyEvent = '终极真相揭晓';
    }
    const isPaywall = [10, 28, 58].includes(i);
    episodeDirectory.push({
      episode: i,
      title: `第${i}集`,
      hook,
      paywall: isPaywall,
      keyEvent,
      layer
    });
  }

  return {
    totalEpisodes,
    worldRevealingPlan: {
      layer1: `1-${layer1End}（展开20%）`,
      layer2: `${layer1End + 1}-${layer2End}（展开50%）`,
      layer3: `${layer2End + 1}-${layer3End}（展开100%）`
    },
    episodeDirectory,
    continuityRules: [
      '角色外貌（发型/服装/特征）前后一致',
      '角色能力/法术使用前后一致',
      '角色关系状态按剧情线推进',
      '法宝/武器出现和消失有交代',
      '集与集时间流逝合理',
      '力量体系前后一致'
    ],
    aspectRatio,
    episodeDuration: Math.round((input.durationPerEpisode || 75)),
    previouslyOn: '前情提要模板：上集回顾 + 关键信息回顾 + 悬念引导'
  };
}

module.exports = { run };
