#!/usr/bin/env node
/**
 * Wound Miner — 伤口矿工 (Agent 1)
 * 挖掘角色灵魂的三层伤口结构：表层→结构性→存在性
 */

const fs = require('fs');
const path = require('path');
const stateBus = require('../utils/state-bus');

// ============ 内置角色伤口数据库 ============
const WOUND_DATABASE = {
  '孙悟空': {
    surface: { event: '大闹天宫失败，被如来压在五行山下五百年', age: 342, immediateImpact: '从齐天大圣变成阶下囚，自由被剥夺' },
    structure: { behavioralPattern: '对所有权威极度不信任，用暴力和叛逆作为防御机制', triggerMap: { '被叫弼马温': '激活羞辱记忆 → 暴怒', '被欺骗': '激活天庭背叛记忆 → 过度反应', '师父被威胁': '激活无力保护记忆 → 拼命守护' }, copingMechanism: '用愤怒掩盖脆弱，用战斗代替思考', coreLie: '只有足够强大，才不会被欺负', coreNeed: '被真正尊重，而不是被利用后抛弃' },
    existential: { fundamentalFear: '自己的存在本身没有意义——石头生的，无父无母，天地不留', identityCrisis: '我是谁？齐天大圣是自封的，弼马温是天庭给的，孙悟空是师父给的——哪个才是真正的我？', redemptionDoor: '接受自己的不完美来源，在不完美的身份中找到真正的自由' },
    breathing: { pace: '急促爆发式，像鞭炮', volume: '大，从不低语', silencePattern: '愤怒前兆——越危险越安静', sentenceSignature: '短句为主，爱用反问，自称"俺"，不耐烦时打断别人' }
  },
  '唐僧': {
    surface: { event: '自幼出家，不知父母是谁，带着身世的空缺长大', age: 20, immediateImpact: '对身份的持续不安，渴望找到存在的意义' },
    structure: { behavioralPattern: '用规则和戒律构建安全感，对一切失控感到恐惧', triggerMap: { '杀生': '激活"慈悲与实用"的矛盾', '徒弟违抗': '激活"无力管束"的焦虑', '被诱惑': '激活"道心不稳"的恐惧' }, copingMechanism: '念经、坚持规则、用仪式安抚焦虑', coreLie: '只要严格遵守戒律，就能获得安宁', coreNeed: '被无条件接纳，包括自己的软弱' },
    existential: { fundamentalFear: '自己不够格——凭什么是我取经？我配吗？', identityCrisis: '我是金蝉子转世，还是只是一个普通和尚？', redemptionDoor: '承认自己的软弱才是真正的强大' },
    breathing: { pace: '缓慢、有节奏', volume: '温和但坚定', silencePattern: '犹豫时会闭眼默念', sentenceSignature: '长句为主，爱说"阿弥陀佛"，犹豫时重复"贫僧"' }
  },
  '白骨精': {
    surface: { event: '作为妖怪被人类恐惧和排斥，永远无法融入人类社会', age: 500, immediateImpact: '对被接纳的极端渴望' },
    structure: { behavioralPattern: '通过变形和欺骗来获取想要的一切', triggerMap: { '被识破': '激活"我永远不被接纳"的恐惧 → 攻击性', '被同情': '短暂触动内心柔软 → 短暂犹豫', '被排斥': '激活所有创伤 → 极端报复' }, copingMechanism: '用欺骗代替真实连接，用力量代替被爱', coreLie: '只有变成别人的样子，才能被接受', coreNeed: '以真实的自己被接纳' },
    existential: { fundamentalFear: '自己永远只是一个"妖怪"，不配拥有"人"的身份', identityCrisis: '我到底是谁？我变的每一个人都不是我', redemptionDoor: '也许不需要变成别人，也许真实的自己就值得' },
    breathing: { pace: '轻柔、多变', volume: '善于压低声音制造亲近感', silencePattern: '被戳穿时会先沉默，然后露出苦笑', sentenceSignature: '说话温柔但暗藏锋芒，爱用反问，善于引导' }
  },
  '猪八戒': {
    surface: { event: '天蓬元帅被贬下凡，错投猪胎，从天神变成妖怪', age: 800, immediateImpact: '从云端跌入泥潭的屈辱感' },
    structure: { behavioralPattern: '用享乐和逃避来麻痹痛苦', triggerMap: { '被嘲笑猪样': '激活天蓬记忆 → 短暂愤怒然后自嘲化解', '美食/美色': '激活补偿心理 → 无法自控', '危险': '激活无力感 → 第一反应是逃跑' }, copingMechanism: '吃、睡、逃避、用幽默掩饰自卑', coreLie: '只要我够快乐，过去就不重要', coreNeed: '重新证明自己的价值' },
    existential: { fundamentalFear: '自己永远回不到从前了——天蓬元帅已经死了', identityCrisis: '我是天蓬还是八戒？是天神还是猪妖？', redemptionDoor: '接受现在的自己，在平凡中找到价值' },
    breathing: { pace: '懒散、慢吞吞', volume: '平时嘟囔，兴奋时突然变大', silencePattern: '困了就直接睡', sentenceSignature: '爱用"老猪"自称，爱抱怨，爱说"散伙"' }
  },
  '沙僧': {
    surface: { event: '卷帘大将因打碎琉璃盏被贬流沙河，每日受飞剑穿胸之苦', age: 600, immediateImpact: '从忠诚卫士变成罪人，信念崩塌' },
    structure: { behavioralPattern: '沉默寡言，只做不说，用忠诚和服从来赎罪', triggerMap: { '被忽视': '默默承受，不表达不满', '被信任': '极度珍惜，加倍回报', '师父遇险': '第一反应是保护，不问原因' }, copingMechanism: '用行动代替语言，用忠诚定义自己', coreLie: '只要我够忠诚，过去的罪就能被原谅', coreNeed: '被真正看到和认可' },
    existential: { fundamentalFear: '自己只是一个"犯错的人"，不配拥有新的人生', identityCrisis: '我是卷帘大将还是沙悟净？', redemptionDoor: '放下赎罪心态，为自己而活' },
    breathing: { pace: '沉稳、不急不缓', volume: '低沉，说话不多但字字有力', silencePattern: '经常沉默，但沉默不是空洞，是思考', sentenceSignature: '短句，常用"大师兄说得对"，但关键时刻有自己的判断' }
  }
};

// ============ 通用伤口生成器 ============
function generateGenericWound(input) {
  const name = input.characterName || '未知角色';
  const desc = input.oneLiner || '';
  const role = input.role || 'protagonist';
  const world = input.worldContext || '';
  const theme = input.themeAnchor || '';

  // 从描述中提取线索
  const descLower = desc.toLowerCase();
  
  // 推断表层伤口
  let surfaceEvent = '经历了一次重大失败或失去';
  let immediateImpact = '从此行为模式发生改变';
  if (descLower.includes('失败') || descLower.includes('战败') || descLower.includes('被压')) {
    surfaceEvent = desc;
    immediateImpact = '从巅峰跌落，自尊心受重创';
  } else if (descLower.includes('被排斥') || descLower.includes('妖怪') || descLower.includes('异类')) {
    surfaceEvent = '因身份被排斥和恐惧';
    immediateImpact = '产生对归属感的极端渴望';
  } else if (descLower.includes('背叛') || descLower.includes('抛弃')) {
    surfaceEvent = '被信任的人背叛或抛弃';
    immediateImpact = '对信任产生根本性怀疑';
  } else if (descLower.includes('失去') || descLower.includes('死亡') || descLower.includes('牺牲')) {
    surfaceEvent = '失去了重要的人或事物';
    immediateImpact = '产生保护欲或补偿心理';
  }

  // 推断行为模式
  let behavioralPattern, copingMechanism, coreLie, coreNeed;
  if (role === 'antagonist') {
    behavioralPattern = '通过控制和操纵来获得安全感';
    copingMechanism = '用力量和欺骗代替真实连接';
    coreLie = '只有掌控一切，才不会再次受伤';
    coreNeed = '以真实的自己被接纳';
  } else if (role === 'protagonist') {
    behavioralPattern = '用战斗或行动来证明自己的价值';
    copingMechanism = '用强大掩盖脆弱';
    coreLie = '只有足够强大，才不会被伤害';
    coreNeed = '被真正理解和尊重';
  } else {
    behavioralPattern = '在他人之间寻找自己的位置';
    copingMechanism = '用忠诚和服务来定义价值';
    coreLie = '只要我对别人有用，就有存在的意义';
    coreNeed = '被看到真实的自己';
  }

  return {
    characterId: input.characterId || 'C01',
    characterName: name,
    wound: {
      surface: { event: surfaceEvent, age: 0, immediateImpact },
      structure: { behavioralPattern, triggerMap: { '被误解': '激活核心创伤 → 过度反应', '被信任': '短暂触动 → 短暂软化', '被抛弃': '激活全部防御 → 极端行为' }, copingMechanism, coreLie, coreNeed },
      existential: { fundamentalFear: '自己的存在没有意义', identityCrisis: '我到底是谁？', redemptionDoor: '在不完美的身份中找到真正的自由' },
      breathing: { pace: '正常', volume: '适中', silencePattern: '情绪激动时沉默', sentenceSignature: '根据角色性格变化' }
    }
  };
}

// ============ 主函数 ============
function run(input, statePath) {
  const charId = input.characterId || 'C01';
  const name = input.characterName || '未知角色';
  
  // 先查内置数据库
  let woundProfile = null;
  for (const [key, val] of Object.entries(WOUND_DATABASE)) {
    if (name.includes(key) || key.includes(name)) {
      woundProfile = { characterId: charId, characterName: name, wound: val };
      break;
    }
  }
  
  // 没有内置数据就用通用生成器
  if (!woundProfile) {
    woundProfile = generateGenericWound(input);
  }

  // 写入状态总线
  if (statePath) {
    const state = stateBus.loadState(statePath);
    state.characters[charId] = {
      id: charId,
      name,
      role: input.role || 'protagonist',
      oneLiner: input.oneLiner || '',
      worldContext: input.worldContext || '',
      themeAnchor: input.themeAnchor || '',
      hasWound: true
    };
    stateBus.setWound(state, charId, woundProfile.wound);
    stateBus.saveState(statePath, state);
  }

  return woundProfile;
}

module.exports = { run, WOUND_DATABASE };
