#!/usr/bin/env node
/**
 * ScreenplayCraft Adapter — 种子适配器
 * 将 screenplay.json 转换为 Seedance Pro 可直接消费的 story-plan.json
 */
const fs = require('fs');
const path = require('path');

function run(input) {
  const state = input.screenplayState || {};
  const outputDir = input.outputDir || './output';

  const cinematography = state.l3?.cinematography || {};
  const characters = (state.l2?.characters?.characters || []).map(c => {
    const cf = c.seedanceCharFormat || c;
    return `${c.id}-${cf.name || c.name}`;
  });

  // 字段映射: cinematography.shotPlan[] → story-plan.json/shots[]
  const shots = (cinematography.shotPlan || []).map(shot => ({
    id: shot.shotId || shot.id,
    act: shot.act,
    actIndex: shot.actIndex,
    duration: shot.duration,
    timeRange: shot.timeRange,
    timeRangeAbsolute: shot.timeRange,
    type: shot.type,
    description: shot.description,
    characters: shot.characters || [],
    emotionStart: shot.emotionStart,
    emotionEnd: shot.emotionEnd,
    tension: shot.tension,
    camera: typeof shot.camera === 'object'
      ? `${shot.camera.shotSize}，${shot.camera.angle}，${shot.camera.movement}`
      : (shot.camera || '推轨推进'),
    handoff: shot.handoff,
    transitionTo: null,
    transitionType: shot.transition?.type || '硬切',
    transitionDuration: shot.transition?.duration || 0.5,
    notes: shot.lighting || ''
  }));

  // 补全 transitionTo
  for (let i = 0; i < shots.length - 1; i++) {
    shots[i].transitionTo = shots[i + 1].id;
  }

  const storyPlan = {
    title: input.screenplayState?.l4?.screenplay?.title || input.screenplayState?.l1?.world?.worldName || '未命名',
    totalDuration: shots.reduce((sum, s) => sum + s.duration, 0),
    totalShots: shots.length,
    segments: state.l2?.structure?.acts?.length || 4,
    styleManifesto: cinematography.visualManifesto || '写实电影质感,动态光影,电影级构图',
    lightingThreeLayer: cinematography.lightingSystem
      ? `${cinematography.lightingSystem.keyLight}+${cinematography.lightingSystem.fillLight}+${cinematography.lightingSystem.backLight}`
      : '逆光暗金+冰蓝自发光+火焰散射暖光',
    videoType: cinematography.videoType || 'commercial',
    outline: state.l2?.plot?.plotSpine || '',
    characters,
    shots,
    emotionCurve: cinematography.emotionCurve || [],
    characterTimeline: buildCharacterTimeline(shots, characters)
  };

  // 保存 story-plan.json
  const outputPath = path.join(outputDir, 'story-plan.json');
  fs.writeFileSync(outputPath, JSON.stringify(storyPlan, null, 2));

  return storyPlan;
}

function buildCharacterTimeline(shots, characters) {
  const timeline = {};
  for (const char of characters) {
    const charName = char.split('-').slice(1).join('-') || char;
    const charShots = shots.filter(s => s.characters.some(c => c.includes(charName)));
    timeline[char] = {
      firstAppears: charShots[0]?.id || null,
      lastAppears: charShots[charShots.length - 1]?.id || null,
      totalShots: charShots.length
    };
  }
  return timeline;
}

module.exports = { run };
