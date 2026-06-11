/**
 * 故事性质量评估模块 v1.0-Peng
 * 自动检测故事板是否有叙事质量，拦截"纯视觉堆砌"
 * 
 * 核心检查项：
 * 1. 角色互动检查 — 主角与神兽是否有实质性互动（不是纯旁观）
 * 2. 情感弧线检查 — 情绪是否有递进变化（不是平铺直叙）
 * 3. 叙事转折检查 — 是否有冲突-转折-高潮-收束
 * 4. 神兽视角检查 — 是否以神兽为主角视角（不是人类探险视角）
 */

const STORY_QUALITY_CHECKLIST = {
  // 1. 角色互动
  interaction: {
    check: (shots, characters) => {
      const mainChar = characters[0];
      const beastChar = characters[1];
      
      // 检查是否有"对视、触碰、反应、对话"等互动关键词
      const interactionKeywords = ['对视', '触碰', '反应', '回应', '感应', '交汇', '共鸣', '面对', '迎接', '注视'];
      const hasInteraction = shots.some(s => 
        interactionKeywords.some(kw => s.description?.includes(kw))
      );
      
      // 检查主角是否只是"看"（被动旁观）
      const passiveKeywords = ['发现', '看到', '见证', '仰望', '旁观', '注视'];
      const allPassive = shots.every(s => 
        passiveKeywords.some(kw => s.description?.includes(kw))
      );
      
      return {
        passed: hasInteraction && !allPassive,
        hasInteraction,
        allPassive,
        issue: !hasInteraction ? '主角与神兽无实质性互动（缺少对视/触碰/感应/共鸣等关键词）' : 
               allPassive ? '主角全程被动旁观，无实质性互动' : null
      };
    }
  },
  
  // 2. 情感弧线
  emotionArc: {
    check: (shots) => {
      const emotions = shots.map(s => s.emotion || s.emotionStart || 'neutral').filter(Boolean);
      const uniqueEmotions = [...new Set(emotions)];
      
      // 检查是否有情感递进（至少3种不同情绪）
      const hasProgression = uniqueEmotions.length >= 3;
      
      // 🆕 v5.10-Peng-fix: 扩展高潮情绪词，兼容BeastMind情绪（悲悯=情感高潮）
      // 🆕 v5.30-Peng-fix: 支持中英文双语匹配（fear/恐惧, awe/敬畏等）
      const climaxEmotions = ['狂暴', '爆发', '终极', '巅峰', '震撼', '敬畏', '悲悯', '苍凉', '恐惧',
        'fear', 'awe', 'epic', 'climax', 'peak', 'intense', 'shock', 'terror', 'reverence', 'solemn'];
      const hasClimax = shots.some(s => climaxEmotions.some(e => (s.emotion || '').includes(e)));
      
      return {
        passed: hasProgression && hasClimax,
        emotionCount: uniqueEmotions.length,
        hasClimax,
        issue: !hasProgression ? '情感平铺直叙，无递进变化' : !hasClimax ? '无高潮情绪爆发点' : null
      };
    }
  },
  
  // 3. 叙事转折
  narrativeTurn: {
    check: (shots) => {
      // 🆕 v5.10-Peng-fix: 兼容BeastMind的act格式（"转/Turn"、"转"等）
      const hasTurnAct = shots.some(s => {
        const act = s.act || '';
        return act === '转' || act.startsWith('转/') || act.includes('Turn');
      });
      
      // 检查是否有"起→承→转→高潮→合"的完整结构
      const acts = shots.map(s => s.act).filter(Boolean);
      const hasStructure = acts.some(a => a.startsWith('起') || a === '起') && 
                          acts.some(a => a.startsWith('承') || a === '承') && 
                          (acts.some(a => a.startsWith('转') || a === '转' || a.includes('Turn')) || 
                           acts.some(a => a.startsWith('高潮') || a === '高潮' || a.includes('Climax')));
      
      return {
        passed: hasTurnAct && hasStructure,
        hasTurnAct,
        hasStructure,
        issue: !hasTurnAct ? '缺少转折幕，故事无波澜' : !hasStructure ? '叙事结构不完整' : null
      };
    }
  },
  
  // 4. 神兽视角（核心）
  beastPerspective: {
    check: (shots, characters, outline) => {
      const beastChar = characters[1]; // 第二角色通常是神兽
      if (!beastChar) return { passed: false, issue: '无神兽角色' };
      
      // 检查神兽是否在第一幕就出现（建立主角地位）
      const firstSegmentShots = shots.slice(0, Math.ceil(shots.length / 3));
      const beastInOpening = firstSegmentShots.some(s => 
        (s.characters || []).includes(beastChar)
      );
      
      // 🆕 v5.10-Peng-fix: 扩展内心关键词，兼容BeastMind生态视角（misunderstandingLayers含内心活动）
      const innerKeywords = ['感应', '觉醒', '记忆', '意志', '战魂', '本能', '灵魂', '感知', '误解', '真相', '守护', '承担', '孤独'];
      const hasInnerLife = shots.some(s => 
        innerKeywords.some(kw => s.description?.includes(kw)) ||
        s.beastMind?.misunderstandingLayers?.beast  // BeastMind的内心独白
      );
      
      // 检查神兽是否有完整弧线（觉醒→战斗→永恒）
      const beastArc = shots.filter(s => (s.characters || []).includes(beastChar));
      const hasArc = beastArc.length >= 3; // 至少3个镜头有完整弧线
      
      return {
        passed: beastInOpening && hasInnerLife && hasArc,
        beastInOpening,
        hasInnerLife,
        hasArc,
        issue: !beastInOpening ? '神兽未在开场建立主角地位' : 
               !hasInnerLife ? '神兽无内心/感知描述，纯外观展示' : 
               !hasArc ? '神兽镜头不足，无完整弧线' : null
      };
    }
  }
};

/**
 * 运行故事性质量评估
 * @param {Array} shots 故事板镜头数组
 * @param {Array} characters 角色数组
 * @param {string} outline 故事大纲
 * @returns {Object} 评估结果
 */
function evaluateStoryQuality(shots, characters, outline) {
  const results = {};
  let allPassed = true;
  const issues = [];
  
  for (const [key, checker] of Object.entries(STORY_QUALITY_CHECKLIST)) {
    const result = checker.check(shots, characters, outline);
    results[key] = result;
    if (!result.passed) {
      allPassed = false;
      issues.push(`[${key}] ${result.issue}`);
    }
  }
  
  return {
    passed: allPassed,
    score: Object.values(results).filter(r => r.passed).length / Object.keys(results).length,
    issues,
    details: results
  };
}

module.exports = {
  STORY_QUALITY_CHECKLIST,
  evaluateStoryQuality
};