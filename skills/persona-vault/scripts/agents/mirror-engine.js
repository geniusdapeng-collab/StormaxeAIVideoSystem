/**
 * Mirror Engine — 镜像引擎 (Agent 5)
 * 发现角色之间的镜像关系——谁是谁的另一种可能
 */
const stateBus = require('../utils/state-bus');

// 内置镜像关系数据库
const MIRROR_DATABASE = {
  '孙悟空': {
    '六耳猕猴': { mirrorType: '完美镜像——如果悟空没有遇到唐僧', woundSimilarity: 95, divergencePoint: '悟空遇到了唐僧（约束与引导），六耳没有（持续放纵）', thematicMeaning: '自由没有约束=毁灭。约束不是牢笼，是让你不坠落的护栏。', keyScene: '真假美猴王——两个一模一样的人，观众必须思考：如果没有唐僧，悟空会不会也变成这样？' },
    '白骨精': { mirrorType: '创伤共鸣——被排斥者的两种出路', woundSimilarity: 70, divergencePoint: '悟空选择战斗证明自己，白骨精选择欺骗融入人类', thematicMeaning: '同样的伤口，战斗是英雄之路，欺骗是反派之路——选择定义了你是谁。', keyScene: '三打白骨精——白骨精打中的不是悟空的身体，是他最脆弱的伤口' },
    '唐僧': { mirrorType: '互补镜像——秩序与混乱的共生', woundSimilarity: 40, divergencePoint: '天生互补——唐僧需要悟空的力量保护，悟空需要唐僧的信仰指引', thematicMeaning: '没有混乱的秩序是僵死，没有秩序的混乱是毁灭。两者需要彼此。', keyScene: '三打白骨精后的决裂与和解' },
    '猪八戒': { mirrorType: '对照镜像——同极相斥', woundSimilarity: 50, divergencePoint: '悟空选择战斗面对，八戒选择逃避麻痹', thematicMeaning: '同样的不完美，面对或逃避——这是每个人都要做的选择。', keyScene: '每次拌嘴但危机时刻互相救援' }
  }
};

function run(input, statePath) {
  const characters = input.characters || [];
  const personaStates = input.personaStates || {};

  const mirrors = [];

  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const c1 = characters[i];
      const c2 = characters[j];
      const c1Name = c1.name || '';
      const c2Name = c2.name || '';

      // 先查内置数据库
      let mirror = null;
      for (const [name, relations] of Object.entries(MIRROR_DATABASE)) {
        if (c1Name.includes(name) || name.includes(c1Name)) {
          for (const [otherName, val] of Object.entries(relations)) {
            if (c2Name.includes(otherName) || otherName.includes(c2Name)) {
              mirror = { ...val };
              break;
            }
          }
        }
        if (mirror) break;
      }

      // 没有内置数据就通用生成
      if (!mirror) {
        mirror = {
          pair: [`${c1.id}-${c1Name}`, `${c2.id}-${c2Name}`],
          mirrorType: `${c1Name}与${c2Name}的关系镜像`,
          woundSimilarity: Math.round(Math.random() * 40 + 30),
          divergencePoint: '待分析',
          thematicMeaning: '每个角色代表主题的一个面',
          keyScene: '待设计'
        };
      } else {
        mirror.pair = [`${c1.id}-${c1Name}`, `${c2.id}-${c2Name}`];
      }

      mirrors.push(mirror);
    }
  }

  const result = { mirrors };

  if (statePath) {
    const state = stateBus.loadState(statePath);
    stateBus.setMirrors(state, mirrors);
    stateBus.saveState(statePath, state);
  }

  return result;
}

module.exports = { run, MIRROR_DATABASE };
