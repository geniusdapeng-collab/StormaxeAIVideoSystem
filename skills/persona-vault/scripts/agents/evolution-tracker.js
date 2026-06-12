/**
 * Evolution Tracker — 进化追踪者 (Agent 4)
 * 追踪并管理角色在整个系列中的成长轨迹
 */
const stateBus = require('../utils/state-bus');

// 内置角色成长轨迹
const EVOLUTION_TEMPLATES = {
  '孙悟空': {
    startingState: { episode: 'E01', belief: '强者不需要遵守规则', behavior: '无法无天，不服管束', emotionalState: '愤怒、叛逆、不信任任何人', relationshipState: { 'C02': '不信任', 'C03': '看不顺眼' } },
    keyTurningPoints: [
      { episode: 'E08', event: '首次为保护唐僧而自愿收敛', from: '完全自私', to: '开始有保护对象', cost: '压抑自己的天性', visibleChange: '打斗时刻意不伤及唐僧' },
      { episode: 'E25', event: '三打白骨精被逐——信任崩塌', from: '对师父有信任', to: '彻底封闭内心', cost: '确认了"没人真正懂我"的信念', visibleChange: '回到花果山，拒绝再取经' },
      { episode: 'E45', event: '真假美猴王——身份危机', from: '知道自己是孙悟空', to: '怀疑"我到底是谁"', cost: '身份认同的根基动摇', visibleChange: '第一次主动求助' },
      { episode: 'E70', event: '最终抉择——牺牲自由换师父平安', from: '自由高于一切', to: '所爱之人的安全高于自由', cost: '放弃了五百年的执念', visibleChange: '主动戴上紧箍' }
    ],
    endingState: { episode: 'E80', belief: '真正的力量来自保护所爱之人', behavior: '有责任感但不失本性', emotionalState: '平静中带着力量', relationshipState: { 'C02': '真正的师徒', 'C03': '生死兄弟' } },
    episodeSnapshots: [
      { episode: 'E01', emotionalState: '愤怒100 信任0 自由100', activeWound: '被压五百年的屈辱' },
      { episode: 'E10', emotionalState: '愤怒80 信任20 自由90', activeWound: '被约束的不甘' },
      { episode: 'E25', emotionalState: '愤怒90 信任0 自由100', activeWound: '被误解的剧痛' },
      { episode: 'E45', emotionalState: '愤怒60 信任40 自由70', activeWound: '身份迷失' },
      { episode: 'E70', emotionalState: '愤怒30 信任80 自由50', activeWound: '面对真正的自己' },
      { episode: 'E80', emotionalState: '愤怒10 信任90 自由60', activeWound: '伤口愈合' }
    ],
    consistencyBaseline: { neverChanges: ['不服输的内核', '保护弱小的本能', '自称"俺"'], evolves: ['对规则的态度', '对师父的信任度'], changeMustHaveTrigger: true, maxChangePerEpisode: 0.15 }
  }
};

function run(input, statePath) {
  const charId = input.characterId || 'C01';
  const name = input.characterName || '';
  const totalEpisodes = input.totalEpisodes || 80;
  const wound = input.woundProfile || {};

  // 先查内置模板
  let evolution = null;
  for (const [key, val] of Object.entries(EVOLUTION_TEMPLATES)) {
    if (name.includes(key) || key.includes(name)) {
      evolution = { characterId: charId, evolutionTrack: val };
      break;
    }
  }

  // 没有内置数据就通用生成
  if (!evolution) {
    const coreNeed = wound.structure?.coreNeed || '被理解';
    const coreLie = wound.structure?.coreLie || '必须足够强大';
    
    evolution = {
      characterId: charId,
      evolutionTrack: {
        startingState: { episode: 'E01', belief: coreLie, behavior: '防御性行为', emotionalState: '紧张、防备', relationshipState: {} },
        keyTurningPoints: [
          { episode: `E${Math.floor(totalEpisodes * 0.15)}`, event: '第一次被迫面对内心', from: '逃避', to: '正视', cost: '痛苦', visibleChange: '行为模式开始改变' },
          { episode: `E${Math.floor(totalEpisodes * 0.5)}`, event: '最大危机', from: '旧信念', to: '信念动摇', cost: '重大损失', visibleChange: '彻底改变行为方式' },
          { episode: `E${Math.floor(totalEpisodes * 0.85)}`, event: '最终抉择', from: '旧我', to: '新我', cost: '放弃执念', visibleChange: '行为与过去形成鲜明对比' }
        ],
        endingState: { episode: `E${totalEpisodes}`, belief: coreNeed.replace('被', '学会给予'), behavior: '成熟但不失本色', emotionalState: '平静', relationshipState: {} },
        episodeSnapshots: [
          { episode: 'E01', emotionalState: '紧张100 信任0', activeWound: wound.surface?.event || '初始创伤' },
          { episode: `E${Math.floor(totalEpisodes / 4)}`, emotionalState: '紧张70 信任30', activeWound: '结构层伤口' },
          { episode: `E${Math.floor(totalEpisodes / 2)}`, emotionalState: '紧张50 信任50', activeWound: '存在层伤口' },
          { episode: `E${Math.floor(totalEpisodes * 3 / 4)}`, emotionalState: '紧张30 信任70', activeWound: '正在愈合' },
          { episode: `E${totalEpisodes}`, emotionalState: '紧张10 信任90', activeWound: '伤口愈合' }
        ],
        consistencyBaseline: { neverChanges: ['核心人格底色'], evolves: ['对核心伤口的应对方式'], changeMustHaveTrigger: true, maxChangePerEpisode: 0.15 }
      }
    };
  }

  if (statePath) {
    const state = stateBus.loadState(statePath);
    stateBus.setEvolution(state, charId, evolution.evolutionTrack);
    stateBus.saveState(statePath, state);
  }

  return evolution;
}

module.exports = { run, EVOLUTION_TEMPLATES };
