// scripts/stage8-prompt-service.js
// Stage 8 Prompt 文件统一写入收口层
const path = require('path');
const { ensureDir, writeTextSafe } = require('./pipeline-helpers');

function savePromptFiles(productionDir, shots) {
  const promptsDir = path.join(productionDir, '04-prompts');
  ensureDir(promptsDir);

  let written = 0;
  for (const shot of shots || []) {
    if (!shot || !shot.id) continue;
    const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
    const filePath = path.join(promptsDir, `${shot.id}-prompt.md`);
    const content = `# ${shot.id} Prompt\n\n\`\`\`\n${prompt}\n\`\`\`\n`;
    if (writeTextSafe(filePath, content)) written++;
  }

  return { promptsDir, written };
}

module.exports = { savePromptFiles };
