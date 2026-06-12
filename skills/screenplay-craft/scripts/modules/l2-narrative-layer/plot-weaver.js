/**
 * Plot Weaver — 情节编织器 (L2)
 * 基于结构和角色，编织完整的情节网络
 */
function run(input) {
  const structureData = input.structureData || { acts: [] };
  const characterData = input.characterData || { characters: [] };
  const worldData = input.worldData || {};
  const themeData = input.themeData || {};

  const chars = characterData.characters || [];
  const protagonist = chars.find(c => c.role === 'protagonist') || chars[0];
  const antagonist = chars.find(c => c.role === 'antagonist') || chars[1];

  // 按幕生成场景
  const sceneBreakdown = [];
  let sceneNum = 1;

  for (const act of (structureData.acts || [])) {
    const actScenes = [
      {
        sceneId: `SC${String(sceneNum).padStart(2,'0')}`,
        act: act.actName,
        purpose: act.keyBeats?.[0]?.beatName || '开场建置',
        setting: worldData.worldName || '未知世界',
        characters: [protagonist?.name || '主角'].map(n => n),
        sceneQuestion: act.actName === '起' ? '这个世界发生了什么？' : act.actName === '承' ? '冲突如何升级？' : act.actName === '转' ? '局势如何逆转？' : '最终如何收束？',
        sceneAnswer: '故事由此展开',
        emotionalTurn: act.emotionalGoal || '好奇',
        durationEstimate: Math.round((act.durationRatio || 0.25) * 100 / (act.keyBeats?.length || 3)),
        prerequisiteScenes: sceneNum === 1 ? [] : [`SC${String(sceneNum-1).padStart(2,'0')}`],
        dependentScenes: [],
        hookType: sceneNum === 1 ? 'suspense' : 'emotion'
      }
    ];
    sceneBreakdown.push(...actScenes);
    sceneNum++;

    // 每幕的核心冲突场景
    if (chars.length >= 2) {
      sceneBreakdown.push({
        sceneId: `SC${String(sceneNum).padStart(2,'0')}`,
        act: act.actName,
        purpose: act.keyBeats?.[1]?.beatName || '核心冲突',
        setting: worldData.worldName || '未知世界',
        characters: [protagonist?.name, antagonist?.name].filter(Boolean),
        sceneQuestion: `${protagonist?.name || '主角'}与${antagonist?.name || '对手'}如何交锋？`,
        sceneAnswer: '力量与意志的碰撞',
        emotionalTurn: '紧张升级',
        durationEstimate: Math.round((act.durationRatio || 0.25) * 100 / (act.keyBeats?.length || 3) * 1.5),
        prerequisiteScenes: [`SC${String(sceneNum-1).padStart(2,'0')}`],
        dependentScenes: [],
        hookType: 'crisis'
      });
      sceneNum++;
    }

    // 每幕的转折点场景
    sceneBreakdown.push({
      sceneId: `SC${String(sceneNum).padStart(2,'0')}`,
      act: act.actName,
      purpose: act.turningPoint || '转折',
      setting: worldData.worldName || '未知世界',
      characters: [protagonist?.name || '主角'],
      sceneQuestion: '接下来会发生什么？',
      sceneAnswer: act.turningPoint || '局势转变',
      emotionalTurn: act.emotionalGoal || '期待',
      durationEstimate: Math.round((act.durationRatio || 0.25) * 100 / (act.keyBeats?.length || 3) * 0.8),
      prerequisiteScenes: [`SC${String(sceneNum-1).padStart(2,'0')}`],
      dependentScenes: [],
      hookType: 'twist'
    });
    sceneNum++;
  }

  // 连接依赖关系
  for (let i = 0; i < sceneBreakdown.length; i++) {
    if (i < sceneBreakdown.length - 1) {
      sceneBreakdown[i].dependentScenes = [sceneBreakdown[i+1].sceneId];
    }
  }

  return {
    plotSpine: `${protagonist?.name || '主角'}在${worldData.worldName || '新世界'}中面对${themeData.coreTheme || '挑战'}，经历${structureData.structureType || '四幕'}结构的蜕变`,
    subPlots: chars.filter(c => c.role !== 'protagonist').map(c => ({
      name: `${c.name}的故事线`,
      description: `${c.name}的${c.personality?.coreDesire || '追求'}与成长`,
      relatedChars: [c.id, protagonist?.id].filter(Boolean)
    })),
    sceneBreakdown,
    causeEffectChain: '每个场景都是前一个场景的直接结果，同时推动下一个场景',
    revelationSchedule: '信息逐步揭露：世界观→角色动机→核心冲突→真相',
    twistPoints: structureData.acts?.filter(a => a.turningPoint).map(a => `${a.actName}幕：${a.turningPoint}`) || []
  };
}
module.exports = { run };
