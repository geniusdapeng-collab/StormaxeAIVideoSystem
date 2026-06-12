#!/usr/bin/env node
/**
 * Mirror Engine v1.0-Peng — Agent 5: 镜像引擎
 * 
 * 发现角色间的镜像关系——谁是谁的另一种可能
 */

class MirrorEngine {
  constructor(stateBus) {
    this.stateBus = stateBus;
  }

  async calculate({ allPersonas, personaStates }) {
    console.log(`  🪞 [MirrorEngine] 计算 ${allPersonas.length} 个角色的镜像关系...`);
    
    const mirrors = [];
    
    // 对每对角色计算镜像关系
    for (let i = 0; i < allPersonas.length; i++) {
      for (let j = i + 1; j < allPersonas.length; j++) {
        const idA = allPersonas[i];
        const idB = allPersonas[j];
        
        const charA = personaStates.find(p => p.characterId === idA || p.id === idA);
        const charB = personaStates.find(p => p.characterId === idB || p.id === idB);
        
        if (!charA || !charB) continue;
        
        const mirror = this.analyzeMirrorPair(idA, idB, charA, charB);
        if (mirror) {
          mirrors.push(mirror);
        }
      }
    }
    
    // 按伤口相似度排序
    mirrors.sort((a, b) => (b.woundSimilarity || 0) - (a.woundSimilarity || 0));
    
    return { mirrors };
  }

  analyzeMirrorPair(idA, idB, charA, charB) {
    const nameA = charA.name || charA.characterName || idA;
    const nameB = charB.name || charB.characterName || idB;
    
    const woundA = charA.wound || {};
    const woundB = charB.wound || {};
    
    // 1. 计算伤口相似度
    const woundSimilarity = this.calculateWoundSimilarity(woundA, woundB);
    
    // 2. 找选择分歧点
    const divergencePoint = this.findDivergencePoint(woundA, woundB, nameA, nameB);
    
    // 3. 主题映射
    const thematicMeaning = this.inferThematicMeaning(woundA, woundB, nameA, nameB, divergencePoint);
    
    // 4. 关键场景
    const keyScene = this.inferKeyScene(woundA, woundB, nameA, nameB, divergencePoint);
    
    // 5. 镜像类型
    const mirrorType = this.classifyMirrorType(woundSimilarity, divergencePoint, nameA, nameB);
    
    // 相似度低于阈值则忽略
    if (woundSimilarity < 20) {
      return null;
    }
    
    return {
      pair: [idA, idB],
      pairNames: [nameA, nameB],
      mirrorType,
      woundSimilarity,
      divergencePoint,
      thematicMeaning,
      keyScene
    };
  }

  calculateWoundSimilarity(woundA, woundB) {
    let score = 0;
    
    // 表层伤口比较
    const eventA = (woundA.surface?.event || '').toLowerCase();
    const eventB = (woundB.surface?.event || '').toLowerCase();
    
    const traumaThemes = ['自由剥夺', '信任崩塌', '丧失', '身份危机', '创伤'];
    const themeA = this.extractTraumaTheme(eventA);
    const themeB = this.extractTraumaTheme(eventB);
    
    if (themeA === themeB && themeA !== '创伤') {
      score += 30;
    }
    
    // 结构性伤口比较
    const lieA = (woundA.structure?.coreLie || '').toLowerCase();
    const lieB = (woundB.structure?.coreLie || '').toLowerCase();
    
    if (lieA && lieB) {
      // 核心谎言类型匹配
      if (lieA.includes('强大') && lieB.includes('强大')) score += 25;
      else if (lieA.includes('信任') && lieB.includes('信任')) score += 25;
      else if (lieA.includes('抛弃') && lieB.includes('抛弃')) score += 25;
      else if (lieA.includes('价值') && lieB.includes('价值')) score += 25;
      else if (lieA.includes('安全') && lieB.includes('安全')) score += 20;
      else score += 5;
    }
    
    // 核心需求比较
    const needA = (woundA.structure?.coreNeed || '').toLowerCase();
    const needB = (woundB.structure?.coreNeed || '').toLowerCase();
    
    if (needA && needB) {
      if (needA.includes('尊重') && needB.includes('尊重')) score += 10;
      else if (needA.includes('接纳') && needB.includes('接纳')) score += 10;
      else if (needA.includes('安全') && needB.includes('安全')) score += 10;
      else if (needA.includes('爱') && needB.includes('爱')) score += 10;
      else score += 3;
    }
    
    // 存在性恐惧比较
    const fearA = (woundA.existential?.fundamentalFear || '').toLowerCase();
    const fearB = (woundB.existential?.fundamentalFear || '').toLowerCase();
    
    if (fearA.includes('意义') && fearB.includes('意义')) score += 15;
    else if (fearA.includes('孤独') && fearB.includes('孤独')) score += 15;
    else if (fearA.includes('价值') && fearB.includes('价值')) score += 15;
    
    return Math.min(100, score);
  }

  extractTraumaTheme(event) {
    if (event.includes('自由') || event.includes('压') || event.includes('囚')) return '自由剥夺';
    if (event.includes('信任') || event.includes('背叛')) return '信任崩塌';
    if (event.includes('失去') || event.includes('死') || event.includes('抛弃')) return '丧失';
    if (event.includes('身份') || event.includes('认同')) return '身份危机';
    return '创伤';
  }

  findDivergencePoint(woundA, woundB, nameA, nameB) {
    const patternA = (woundA.structure?.behavioralPattern || '').toLowerCase();
    const patternB = (woundB.structure?.behavioralPattern || '').toLowerCase();
    
    // 找行为模式的关键分歧
    if (patternA.includes('战斗') && patternB.includes('逃避')) {
      return `${nameA}选择战斗面对创伤，${nameB}选择逃避——面对恐惧的两种出路`;
    }
    if (patternA.includes('叛逆') && patternB.includes('服从')) {
      return `${nameA}选择反抗权威，${nameB}选择顺从——面对压迫的两种态度`;
    }
    if (patternA.includes('愤怒') && patternB.includes('冷漠')) {
      return `${nameA}用愤怒应对伤害，${nameB}用冷漠保护自己——情绪防御的两种模式`;
    }
    if (patternA.includes('战斗') && patternB.includes('欺骗')) {
      return `${nameA}选择战斗证明自己，${nameB}选择欺骗融入——被排斥者的两种出路`;
    }
    
    // 默认
    return `${nameA}和${nameB}在面对相似创伤时选择了不同的应对方式——选择定义了方向`;
  }

  inferThematicMeaning(woundA, woundB, nameA, nameB, divergencePoint) {
    const lieA = woundA.structure?.coreLie || '';
    const lieB = woundB.structure?.coreLie || '';
    
    if (lieA.includes('强大') && lieB.includes('强大')) {
      return '力量的两面——一个是外放的破坏，一个是内收的控制。真正的力量不是支配，是选择如何运用。';
    }
    if (lieA.includes('信任') && lieB.includes('信任')) {
      return '不信任的两面——一个是先拒绝别人，一个是先背叛别人。两个受伤的人互相伤害。';
    }
    if (lieA.includes('抛弃') && lieB.includes('抛弃')) {
      return '恐惧的两面——一个拼命留住，一个先离开。都是被抛弃恐惧的奴隶，只是表现相反。';
    }
    if (lieA.includes('价值') && lieB.includes('价值')) {
      return '证明的两面——一个拼命成功，一个拼命破坏。都需要外界确认自己的存在。';
    }
    
    return `同样的伤口，不同的应对——选择没有对错，但每个选择都有代价。${nameA}和${nameB}是同一枚硬币的两面。`;
  }

  inferKeyScene(woundA, woundB, nameA, nameB, divergencePoint) {
    const patternA = (woundA.structure?.behavioralPattern || '').toLowerCase();
    const patternB = (woundB.structure?.behavioralPattern || '').toLowerCase();
    
    if (patternA.includes('战斗') && patternB.includes('战斗')) {
      return `正面冲突——${nameA}和${nameB}都必须赢，因为只有强者才能生存。观众被迫选择支持谁。`;
    }
    if (patternA.includes('叛逆') && patternB.includes('约束')) {
      return `权力博弈——${nameA}挑战${nameB}的权威，${nameB}试图控制${nameA}。谁更需要谁？`;
    }
    if (patternA.includes('怀疑') && patternB.includes('信任')) {
      return `信任测试——${nameA}的怀疑能否被${nameB}的真诚打破？还是会被验证？`;
    }
    if (divergencePoint.includes('战斗') && divergencePoint.includes('欺骗')) {
      return `真相时刻——${nameA}发现${nameB}的欺骗，两人被迫面对：战斗和欺骗哪个更正当？`;
    }
    
    return `对峙场景——${nameA}和${nameB}的伤口在同一空间激活，观众看到两种可能性的碰撞。`;
  }

  classifyMirrorType(woundSimilarity, divergencePoint, nameA, nameB) {
    if (woundSimilarity >= 80) {
      if (divergencePoint.includes('面对')) {
        return '完美镜像——如果当初选择了另一条路';
      }
      return `高相似镜像——${nameA}和${nameB}是彼此的另一种可能`;
    }
    if (woundSimilarity >= 50) {
      if (divergencePoint.includes('战斗') || divergencePoint.includes('愤怒')) {
        return '创伤共鸣——同样的伤口，不同的爆发方式';
      }
      return '部分镜像——某些深层结构相似，但表层表现不同';
    }
    return '互补镜像——差异本身创造价值';
  }
}

module.exports = MirrorEngine;
