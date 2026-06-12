/**
 * Gravity Weaver — 引力编织者 (Agent 2)
 * 计算角色在场景中的"引力场"——他如何改变周围的一切
 */
const stateBus = require('../utils/state-bus');

// 内置关系引力模板
const GRAVITY_TEMPLATES = {
  '孙悟空-唐僧': { relationship: '约束与被约束', woundOverlap: '唐僧想约束悟空（秩序需求），悟空需要唐僧（认同需求）——互补伤口', forceType: '双向拉扯——唐僧拉向秩序，悟空推向混乱', sceneImpact: '只要两人在场，场景必然有张力——要么冲突，要么和解', evolutionArc: '互不信任 → 磨合 → 真正师徒情 → 为对方牺牲', keyScenes: ['三打白骨精（信任危机）', '真假美猴王（身份危机）'] },
  '孙悟空-白骨精': { relationship: '信任试金石', woundOverlap: '白骨精利用悟空的"被误解创伤"——最懂伤口的人最会伤害你', forceType: '精准打击——白骨精专门攻击悟空和唐僧的信任裂缝', sceneImpact: '每次白骨精出现，师徒关系就裂一次——她是他们关系的放大镜', evolutionArc: '', keyScenes: ['三打白骨精'] },
  '唐僧-孙悟空': { relationship: '互补镜像——秩序与混乱的共生', woundOverlap: '天生互补——唐僧需要悟空的力量保护，悟空需要唐僧的信仰指引', forceType: '共生——没有彼此都不完整', sceneImpact: '两人的互动是叙事核心——冲突、和解、再冲突、更深和解', evolutionArc: '互不信任 → 磨合 → 真正师徒情', keyScenes: ['三打白骨精', '真假美猴王'] },
  '孙悟空-六耳猕猴': { relationship: '完美镜像——如果悟空没有遇到唐僧', woundOverlap: '同样的伤口，不同的选择', forceType: '对立面——一个是约束后的自我，一个是放纵的自我', sceneImpact: '真假对决是身份危机的外化', evolutionArc: '', keyScenes: ['真假美猴王'] }
};

function findGravityTemplate(name1, name2) {
  for (const [key, val] of Object.entries(GRAVITY_TEMPLATES)) {
    if (key.includes(name1) && key.includes(name2)) return val;
  }
  return null;
}

function run(input, statePath) {
  const sourceChar = input.sourceCharacter || {};
  const sourceId = sourceChar.id || 'C01';
  const sourceName = sourceChar.name || '';
  const others = input.otherCharacters || [];
  const woundProfile = input.woundProfile || null;

  const gravityMap = {};

  for (const other of others) {
    const otherId = other.id || '';
    const otherName = other.name || '';
    
    // 先查内置模板
    let gravity = findGravityTemplate(sourceName, otherName) || findGravityTemplate(otherName, sourceName);
    
    // 没有模板就通用生成
    if (!gravity) {
      gravity = {
        relationship: `${sourceName}与${otherName}的关系`,
        woundOverlap: woundProfile?.wound?.structure?.coreNeed ? `${sourceName}需要${otherName}来满足${woundProfile.wound.structure.coreNeed}` : '待分析',
        forceType: '待分析',
        sceneImpact: `${sourceName}与${otherName}同场时，场景会因两人关系产生张力`,
        evolutionArc: '待发展',
        keyScenes: []
      };
    }

    gravityMap[otherId] = gravity;
  }

  const result = { sourceCharacter: sourceId, sourceName, gravityMap };

  if (statePath) {
    const state = stateBus.loadState(statePath);
    stateBus.setGravity(state, sourceId, gravityMap);
    stateBus.saveState(statePath, state);
  }

  return result;
}

module.exports = { run, GRAVITY_TEMPLATES };
