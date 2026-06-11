#!/usr/bin/env node
/**
 * Spectacle Designer v5.1-Peng
 * AI视觉奇观规划器 — 6大奇观类型自动规划
 * 
 * 异兽登场 / 变身化形 / 法术释放 / 场景奇观 / 战斗冲击 / 情绪视觉
 */
const fs = require('fs');

const SPECTACLE_TYPES = {
  creatureReveal: { name: '异兽登场', description: '神话生物首次登场', formula: '宏大环境 + 全貌reveal + 动态光影', duration: '5-8s' },
  transformation: { name: '变身化形', description: '角色形态转换', formula: '当前形态 → 粒子转换 → 新形态', duration: '3-5s' },
  spellCast: { name: '法术释放', description: '法术/技能视觉', formula: '手势 → 能量聚集 → 释放 → 击中', duration: '2-4s' },
  sceneSpectacle: { name: '场景奇观', description: '宏大场景reveal', formula: '遮挡物 → 逐渐reveal → 全景震撼', duration: '5-10s' },
  combatImpact: { name: '战斗冲击', description: '动作戏视觉高潮', formula: '对峙 → 冲击瞬间 → 冲击波扩散', duration: '3-5s' },
  emotionVisual: { name: '情绪视觉', description: '情绪外化为环境', formula: '人物表情 + 环境呼应情绪 + 特效', duration: '2-3s' }
};

function designSpectacles(data) {
  const shots = data.shots || [];
  const level = data.spectacleLevel || 'standard';
  const densityMap = { minimal: { total: 5, big: 1 }, standard: { total: 15, big: 5 }, maximum: { total: 30, big: 10 } };
  const density = densityMap[level] || densityMap.standard;
  const types = Object.keys(SPECTACLE_TYPES);
  const spectacleList = [];
  let count = 0;

  shots.forEach((shot, index) => {
    if (isKeyScene(shot, index) && count < density.total) {
      const type = types[count % types.length];
      const template = SPECTACLE_TYPES[type];
      const isBig = count < density.big;
      spectacleList.push({
        shotId: shot.id || shot.shotId || index,
        type, name: template.name, description: template.description,
        formula: template.formula, duration: isBig ? '5-8s' : '2-4s',
        isBig, emotionalContext: shot.emotionStart || '中性',
        seedancePrompt: generatePrompt(template, shot)
      });
      count++;
    }
  });

  return { spectacles: spectacleList, density, level };
}

function isKeyScene(shot, index) {
  if (index === 0) return true;
  const type = (shot.type || '').toLowerCase();
  const desc = (shot.description || '').toLowerCase();
  if (type.includes('高潮') || type.includes('终极') || type.includes('爆发')) return true;
  if (desc.includes('变身') || desc.includes('登场') || desc.includes('reveal')) return true;
  if (shot.tension && shot.tension >= 70) return true;
  return false;
}

function generatePrompt(template, shot) {
  const char = (shot.characters || []).map(c => typeof c === 'string' ? c : c.name).join('、') || '角色';
  const desc = shot.description || '场景';
  return `${template.name}：${char}，${desc}，${template.formula}，${shot.emotionStart || '强烈'}情绪`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input') args.input = argv[++i];
    if (argv[i] === '--output') args.output = argv[++i];
    if (argv[i] === '--level') args.level = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.log('用法: node spectacle-designer.js --input story-plan.json --output spectacles.json [--level minimal|standard|maximum]');
    process.exit(0);
  }
  const data = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  data.spectacleLevel = args.level || 'standard';
  data.spectacles = designSpectacles(data);
  fs.writeFileSync(args.output || args.input, JSON.stringify(data, null, 2));
  console.log(`✅ Spectacle Designer: 奇观设计完成 (${data.spectacles.spectacles.length}个奇观)`);
}

if (require.main === module) main();
module.exports = { designSpectacles, isKeyScene, SPECTACLE_TYPES };
