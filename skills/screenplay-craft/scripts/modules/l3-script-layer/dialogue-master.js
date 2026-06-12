#!/usr/bin/env node
/**
 * Dialogue Master — 对白大师 (L3)
 * 生成高质量角色对白，支持多语言风格
 */
function run(input) {
  const sceneData = input.sceneData || { scenes: [] };
  const characterData = input.characterData || { characters: [] };
  const themeData = input.themeData || {};
  const seriesMode = input.seriesMode || false;

  const chars = characterData.characters || [];
  const dialogueScript = [];

  for (const scene of (sceneData.scenes || [])) {
    const sceneLines = [];
    const sceneChars = (scene.slugLine || '').split('.')[1] || '';
    const involvedChars = chars.filter(c => sceneChars.includes(c.name) || Math.random() > 0.5);

    // 生成对白（基于角色 voiceProfile）
    const lineCount = Math.min(involvedChars.length * 2, seriesMode ? 5 : 8);
    for (let i = 0; i < lineCount; i++) {
      const speaker = involvedChars[i % involvedChars.length];
      if (!speaker) continue;
      sceneLines.push({
        speaker: speaker.name,
        text: seriesMode ? '...' : `${speaker.personality?.coreDesire || '目标'}驱动下的台词`,
        emotion: speaker.voiceProfile?.emotionRange?.[i % (speaker.voiceProfile?.emotionRange?.length || 1)] || '平静',
        deliveryNote: speaker.voiceProfile?.speakingStyle || '自然',
        subText: speaker.personality?.truthTheyNeed || '',
        duration: seriesMode ? Math.min(3, Math.random() * 2 + 1) : Math.random() * 3 + 1
      });
    }

    dialogueScript.push({
      sceneId: scene.sceneId,
      lines: sceneLines,
      promptEnhancement: `${themeData.coreTheme || ''}氛围，${chars.map(c=>c.name).join('、')}对话`
    });
  }

  return { dialogueScript };
}
module.exports = { run };
