/**
 * Hook Factory — 钩子工厂 (M3)
 * 每集开场+集尾钩子生成
 */
function run(input) {
  const scenes = input.scenes || { scenes: [] };
  const paywallPlan = input.paywallPlan || {};
  const totalEpisodes = input.totalEpisodes || 80;

  const openingHookTemplates = [
    { type: 'crisis', text: '直接切入最危险时刻', example: '刀尖抵住喉咙的第一视角' },
    { type: 'puzzle', text: '展示不解释的奇异现象', example: '镜子里的自己在微笑，但现实中没有' },
    { type: 'dialogue', text: '第一句就是爆炸信息', example: '"你杀了我父亲。"——女孩握着刀' },
    { type: 'spectacle', text: '直接展示最强视觉画面', example: '九尾狐月光下展开九条尾巴' },
    { type: 'emotion', text: '展示最极致情绪画面', example: '雨中崩溃大哭的无声画面' }
  ];

  const openingHooks = [];
  const endingHooks = [];
  for (let i = 0; i < totalEpisodes && i < (scenes.scenes?.length || 80); i++) {
    const hook = openingHookTemplates[i % openingHookTemplates.length];
    openingHooks.push({ episode: i + 1, type: hook.type, text: hook.text, example: hook.example });
    endingHooks.push({
      episode: i + 1,
      type: paywallPlan.paywallPositions?.includes(i + 1) ? 'crisisHook' : ['suspenseHook', 'twistHook', 'emotionHook'][i % 3],
      cliffhanger: true
    });
  }

  return { openingHooks, endingHooks, totalHooks: openingHooks.length };
}
module.exports = { run };
