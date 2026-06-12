/**
 * Scene Writer — 场景书写器 (L3)
 * 将场景大纲转化为专业剧本格式的场景描写
 */
function run(input) {
  const plotData = input.plotData || { sceneBreakdown: [] };
  const characterData = input.characterData || { characters: [] };
  const worldData = input.worldData || {};
  const scenes = [];
  const chars = characterData.characters || [];
  const protagonist = chars.find(c => c.role === 'protagonist')?.name || (chars[0]?.name) || '主角';

  // 场景地点模板（根据类型生成）
  const locationPool = ['花果山', '水帘洞', '凌霄殿', '南天门', '炼丹炉', '五行山下', '东海龙宫', '盘丝洞'];
  let locIdx = 0;

  for (const sd of (plotData.sceneBreakdown || [])) {
    // 🆕 用具体场景地点，不用世界观名
    const setting = sd.setting || locationPool[locIdx % locationPool.length] || '幻境';
    locIdx++;

    // 🆕 确定本场角色
    const sceneChars = (sd.characters || []).map(name => {
      const matched = chars.find(c => c.name === name);
      return matched ? matched.name : (name.includes(protagonist) ? protagonist : name);
    });
    if (sceneChars.length === 0) sceneChars.push(protagonist);

    scenes.push({
      sceneId: sd.sceneId,
      slugLine: `外景. ${setting} - ${sd.act}幕`,
      action: `${sceneChars.join('、')}出现在${setting}。${sd.purpose}。`,
      visualNotes: worldData.atmosphereKeywords?.join('，') || '写实电影质感,动态光影,电影级构图',
      audioNotes: '环境音渐入',
      setDesign: setting,
      props: [],
      vfxNotes: '',
      durationEstimate: sd.durationEstimate || 15,
      emotionalTone: sd.emotionalTurn || '紧张',
      shotCharacters: sceneChars, // 🆕 明确记录场景角色
      shots: [
        {
          shotId: `${sd.sceneId}_S01`,
          type: sd.hookType === 'suspense' ? '建置' : sd.hookType === 'crisis' ? '对抗' : '过渡',
          description: `${sceneChars[0]}在${setting}中，${sd.purpose}。`,
          cameraDirection: '推轨推进',
          duration: Math.round((sd.durationEstimate || 15) * 0.6),
          characters: sceneChars // 🆕 附带角色列表
        },
        {
          shotId: `${sd.sceneId}_S02`,
          type: '高潮',
          description: `${sd.purpose}的关键瞬间。`,
          cameraDirection: '特写，缓慢推进',
          duration: Math.round((sd.durationEstimate || 15) * 0.4),
          characters: sceneChars // 🆕 附带角色列表
        }
      ]
    });
  }

  return { scenes };
}
module.exports = { run };
