#!/usr/bin/env node
/**
 * Structure Engine — 结构引擎 (L2)
 * 基于世界观和主题，设计叙事结构和幕结构
 */

function run(input) {
  const worldData = input.worldData || {};
  const themeData = input.themeData || {};
  const targetDuration = input.targetDuration || 180;
  const videoType = input.videoType || 'auto';
  const preference = input.structurePreference || 'four-act';

  // 自动检测视频类型
  let detected = videoType;
  if (videoType === 'auto') {
    const src = (worldData.worldTagline || '') + ' ' + (themeData.coreTheme || '');
    if (src.includes('爱') || src.includes('情感')) detected = 'drama';
    else if (src.includes('教') || src.includes('学')) detected = 'educational';
    else detected = 'action';
  }

  // 结构模板
  const structures = {
    'four-act': {
      type: '四幕结构',
      acts: [
        { actNumber: 1, actName: '起', purpose: '建置世界观与角色，引入核心矛盾', durationRatio: 0.25, tensionRange: [0, 40], emotionalGoal: '好奇与期待', turningPoint: '触发事件打破平衡' },
        { actNumber: 2, actName: '承', purpose: '冲突升级，角色面临挑战', durationRatio: 0.25, tensionRange: [40, 70], emotionalGoal: '紧张与投入', turningPoint: '局势突变' },
        { actNumber: 3, actName: '转', purpose: '高潮逼近，终极对决前夕', durationRatio: 0.25, tensionRange: [70, 95], emotionalGoal: '压迫与 anticipation', turningPoint: '最终准备完成' },
        { actNumber: 4, actName: '合', purpose: '高潮爆发与收束', durationRatio: 0.25, tensionRange: [95, 20], emotionalGoal: '释放与余韵', turningPoint: '胜负揭晓' }
      ]
    },
    'three-act': {
      type: '三幕结构',
      acts: [
        { actNumber: 1, actName: '建置', purpose: '介绍世界与角色', durationRatio: 0.25, tensionRange: [0, 30], emotionalGoal: '好奇', turningPoint: '触发事件' },
        { actNumber: 2, actName: '对抗', purpose: '冲突与挑战', durationRatio: 0.50, tensionRange: [30, 85], emotionalGoal: '紧张', turningPoint: '至暗时刻' },
        { actNumber: 3, actName: '解决', purpose: '高潮与结局', durationRatio: 0.25, tensionRange: [85, 20], emotionalGoal: '满足', turningPoint: '最终对决' }
      ]
    },
    'hero-journey': {
      type: '英雄之旅',
      acts: [
        { actNumber: 1, actName: '出发', purpose: '平凡世界→冒险召唤', durationRatio: 0.20, tensionRange: [0, 35], emotionalGoal: '共鸣', turningPoint: '跨越门槛' },
        { actNumber: 2, actName: '试炼', purpose: '盟友、敌人、考验', durationRatio: 0.40, tensionRange: [35, 75], emotionalGoal: '成长', turningPoint: '深入虎穴' },
        { actNumber: 3, actName: '归来', purpose: '终极考验→带回恩惠', durationRatio: 0.40, tensionRange: [75, 30], emotionalGoal: '蜕变', turningPoint: '浴火重生' }
      ]
    }
  };

  const structure = structures[preference] || structures['four-act'];

  return {
    structureType: structure.type,
    acts: structure.acts.map(act => ({
      ...act,
      keyBeats: [
        { beatName: '开场钩子', description: '抓住观众注意力', estimatedDuration: Math.round(targetDuration * act.durationRatio * 0.1) },
        { beatName: '核心事件', description: act.purpose, estimatedDuration: Math.round(targetDuration * act.durationRatio * 0.6) },
        { beatName: act.turningPoint, description: act.turningPoint, estimatedDuration: Math.round(targetDuration * act.durationRatio * 0.3) }
      ]
    })),
    overallArc: {
      setup: `${worldData.worldName || '世界'}的初始状态`,
      confrontation: `${themeData.coreTheme || '主题'}的考验与挣扎`,
      resolution: '蜕变与新的平衡'
    },
    pacingStrategy: detected === 'action' ? '快节奏，短镜头，强冲击' : detected === 'drama' ? '情绪驱动，留白与节奏交替' : '稳定节奏，信息清晰',
    audienceEmotionalJourney: structure.acts.map(a => a.emotionalGoal)
  };
}

module.exports = { run };
