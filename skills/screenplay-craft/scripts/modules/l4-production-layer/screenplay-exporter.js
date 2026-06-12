/**
 * Screenplay Exporter — 剧本导出器 (L4)
 * 汇总 L1-L3 产物，导出标准剧本文档
 */
const fs = require('fs');
const path = require('path');

function run(input) {
  const state = input.state || {};
  const outputDir = input.outputDir || './output';
  const title = input.title || 'screenplay';
  const files = [];

  // 1. screenplay.json — 完整机器可读剧本
  const screenplay = {
    $schema: 'screenplaycraft-v2',
    meta: {
      title: title || state.l1?.world?.worldName || '未命名',
      logline: state.l1?.theme?.coreTheme || '',
      genre: [state.l2?.structure?.structureType || 'commercial'],
      videoType: state.l3?.cinematography?.videoType || 'commercial',
      videoFormat: { aspectRatio: input.seriesMode ? '9:16' : '16:9', resolution: input.seriesMode ? '1080x1920' : '1920x1080' },
      targetDuration: 180,
      mode: state.mode || 'original',
      version: '2.0',
      createdAt: new Date().toISOString()
    },
    l1_concept: { world: state.l1?.world, theme: state.l1?.theme, ipAnalysis: state.l1?.ipAnalysis },
    l2_narrative: { structure: state.l2?.structure, characters: state.l2?.characters?.characters, relationshipMap: state.l2?.characters?.relationshipMap, plot: state.l2?.plot },
    l3_script: { scenes: state.l3?.scenes?.scenes, dialogues: state.l3?.dialogues?.dialogueScript, cinematography: state.l3?.cinematography },
    v2_enhancements: {
      vertical: state.v2?.vertical ? { converted: true } : { converted: false },
      paywall: state.v2?.paywall || null,
      hooks: state.v2?.hooks || null,
      series: state.v2?.series || null,
      spectacles: state.v2?.spectacles || null
    },
    l4_production: { seedanceAdapter: state.l4?.seedanceAdapter || {}, continuityReport: state.l4?.continuityReport || { status: 'not-run' } }
  };

  const jsonPath = path.join(outputDir, 'screenplay.json');
  fs.writeFileSync(jsonPath, JSON.stringify(screenplay, null, 2));
  files.push('screenplay.json');

  // 2. screenplay.md — 人工可读
  let md = `# ${title}\n\n`;
  md += `**主题**: ${state.l1?.theme?.coreTheme || '未知'}\n`;
  md += `**世界观**: ${state.l1?.world?.worldName || '未知'}\n\n`;
  md += `## 角色\n\n`;
  for (const c of (state.l2?.characters?.characters || [])) {
    md += `- **${c.name}** (${c.role}): ${c.species} — ${c.personality?.coreDesire || ''}\n`;
  }
  md += `\n## 场景\n\n`;
  for (const s of (state.l3?.scenes?.scenes || [])) {
    md += `### ${s.sceneId}: ${s.slugLine}\n\n${s.action}\n\n`;
  }
  const mdPath = path.join(outputDir, 'screenplay.md');
  fs.writeFileSync(mdPath, md);
  files.push('screenplay.md');

  // 3. world-bible.md
  let bible = `# ${state.l1?.world?.worldName || '世界观圣经'}\n\n`;
  bible += `## 概述\n\n${state.l1?.world?.worldTagline || ''}\n\n`;
  bible += `## 地理\n\n${state.l1?.world?.geography || ''}\n\n`;
  bible += `## 社会结构\n\n${state.l1?.world?.socialStructure || ''}\n\n`;
  bible += `## 力量体系\n\n${state.l1?.world?.powerSystem || ''}\n\n`;
  for (const entry of (state.l1?.world?.loreEntries || [])) {
    bible += `### ${entry.title}\n\n${entry.content}\n\n`;
  }
  const biblePath = path.join(outputDir, 'world-bible.md');
  fs.writeFileSync(biblePath, bible);
  files.push('world-bible.md');

  // 4. series-plan.json (模式 C)
  if (input.seriesMode && state.v2?.series) {
    const seriesPath = path.join(outputDir, 'series-plan.json');
    fs.writeFileSync(seriesPath, JSON.stringify(state.v2.series, null, 2));
    files.push('series-plan.json');
  }

  return { files, title, screenplay };
}
module.exports = { run };
