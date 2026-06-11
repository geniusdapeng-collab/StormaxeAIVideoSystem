#!/usr/bin/env node
/**
 * Hook Factory v5.1-Peng
 * 开场与集尾钩子生成器 — 自动为剧本注入吸引力钩子
 * 
 * 5种开场钩子 + 集尾悬念生成
 */
const fs = require('fs');

const HOOK_TEMPLATES = {
  crisis: { name: '危机开场', template: '直接切入最危险时刻', example: '刀尖抵住喉咙的第一视角', retentionRate: '85%+' },
  puzzle: { name: '谜题开场', template: '展示不解释的奇异现象', example: '镜子里的自己在微笑，但现实中没有', retentionRate: '80%+' },
  dialogue: { name: '台词钩子', template: '第一句就是爆炸信息', example: '"你杀了我父亲。"——女孩握着刀', retentionRate: '78%+' },
  visual: { name: '视觉奇观', template: '直接展示最强视觉画面', example: '九尾狐月光下展开九条尾巴', retentionRate: '82%+' },
  emotion: { name: '情绪冲击', template: '展示最极致情绪画面', example: '雨中崩溃大哭的无声画面', retentionRate: '75%+' }
};

const ENDING_HOOK_TEMPLATES = {
  suspense: (scene) => `${scene.climax || '高潮时刻'} —— 但 ${scene.unansweredQuestion || '答案尚未揭晓'}`,
  twist: (scene) => `${scene.expectedOutcome || '预期发展'} —— 然而 ${scene.unexpectedTwist || '意想不到的转折'}`,
  emotion: (scene) => `${scene.emotionalPeak || '情感高潮'} —— 突然 ${scene.emotionalCut || '画面定格'}`,
  crisis: (scene) => `${scene.lifeThreateningMoment || '生死瞬间'} —— 画面定格`
};

function injectHooks(data) {
  const shots = data.shots || [];
  return shots.map((shot, index) => {
    const openingHook = index === 0 ? generateOpeningHook(shot, data.hookDensity || 'high') : null;
    const endingHook = generateEndingHook(shot);
    return { ...shot, openingHook, endingHook, hookInjected: true };
  });
}

function generateOpeningHook(shot, density) {
  const types = Object.keys(HOOK_TEMPLATES);
  const tension = shot.tension || 0;
  // 根据张力选择钩子类型
  let selectedType;
  if (tension >= 80) selectedType = 'crisis';
  else if (tension >= 60) selectedType = 'visual';
  else if (tension >= 40) selectedType = 'puzzle';
  else if (tension >= 20) selectedType = 'emotion';
  else selectedType = 'dialogue';
  
  const template = HOOK_TEMPLATES[selectedType];
  return {
    type: selectedType, name: template.name,
    description: template.template, example: template.example,
    estimatedRetention: template.retentionRate,
    generatedFor: shot.description?.substring(0, 50) || '开场'
  };
}

function generateEndingHook(shot) {
  const types = Object.keys(ENDING_HOOK_TEMPLATES);
  const selectedType = types[Math.floor(Math.random() * types.length)];
  const generator = ENDING_HOOK_TEMPLATES[selectedType];
  return {
    type: selectedType, text: generator(shot),
    purpose: '驱动观众点击下一镜头'
  };
}

// CLI
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input') args.input = argv[++i];
    if (argv[i] === '--output') args.output = argv[++i];
    if (argv[i] === '--density') args.density = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.log('用法: node hook-factory.js --input story-plan.json --output hooked.json [--density high|standard|minimal]');
    process.exit(0);
  }
  const data = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  data.shots = injectHooks(data);
  data.hookDensity = args.density || 'high';
  fs.writeFileSync(args.output || args.input, JSON.stringify(data, null, 2));
  console.log('✅ Hook Factory: 钩子注入完成');
}

if (require.main === module) main();
module.exports = { injectHooks, generateOpeningHook, generateEndingHook, HOOK_TEMPLATES };
