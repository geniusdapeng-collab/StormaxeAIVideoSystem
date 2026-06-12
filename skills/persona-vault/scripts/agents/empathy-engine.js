/**
 * Empathy Engine — 共情引擎 (Agent 3)
 * 对反派角色执行"同情术"——找到让观众又爱又恨的精确开关
 */
const stateBus = require('../utils/state-bus');

// 内置反派共情矩阵
const EMPATHY_DATABASE = {
  '白骨精': {
    wantsWhatYouWant: { desire: '被接纳——她只是想吃唐僧肉变得像人一样被接纳', audienceConnection: '每个人都渴望被接纳，尤其是被排斥过的人' },
    hurtLikeYouHurt: { wound: '作为妖怪被人类恐惧和排斥，永远无法进入人类社会', audienceConnection: '被排斥、被标签化的经历是普遍的' },
    theMoment: { scene: '她最后一次变化成老妇人被悟空打死时，眼里不是恨，是困惑——"我只是想活下去，为什么你们都要杀我？"', effect: '观众突然意识到：她只是想要一个"人"的身份' },
    theTrap: { descent: '被排斥 → 怨恨 → 利用他人伤口 → 自己也成了制造伤口的人', warning: '她走过路，悟空也可能走——如果继续被误解和排斥' },
    sympathyScore: 78, repulsionScore: 85, complexityScore: 92
  }
};

function run(input, statePath) {
  const charId = input.characterId || 'C01';
  const name = input.characterName || '';
  const wound = input.woundProfile || {};
  const role = input.role || 'antagonist';

  // 先查内置数据库
  let empathyMatrix = null;
  for (const [key, val] of Object.entries(EMPATHY_DATABASE)) {
    if (name.includes(key) || key.includes(name)) {
      empathyMatrix = { characterId: charId, characterName: name, empathyMatrix: val };
      break;
    }
  }

  // 没有内置数据就通用生成
  if (!empathyMatrix) {
    const coreNeed = wound.structure?.coreNeed || '被理解';
    const coreFear = wound.existential?.fundamentalFear || '没有意义';
    empathyMatrix = {
      characterId: charId,
      characterName: name,
      empathyMatrix: {
        wantsWhatYouWant: { desire: coreNeed, audienceConnection: '这是人类共同的需求' },
        hurtLikeYouHurt: { wound: wound.surface?.event || '经历过创伤', audienceConnection: '每个人都可能经历类似的痛苦' },
        theMoment: { scene: `${name}在某个瞬间展现出脆弱，让观众突然理解了ta`, effect: '观众从"恨"转向"理解"' },
        theTrap: { descent: `从受害者 → 加害者的堕落路径`, warning: `${name}走过的路，主角也可能走` },
        sympathyScore: 65, repulsionScore: 70, complexityScore: 75
      }
    };
  }

  if (statePath) {
    const state = stateBus.loadState(statePath);
    stateBus.setEmpathy(state, charId, empathyMatrix.empathyMatrix);
    stateBus.saveState(statePath, state);
  }

  return empathyMatrix;
}

module.exports = { run, EMPATHY_DATABASE };
