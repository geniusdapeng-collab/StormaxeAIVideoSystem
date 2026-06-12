/**
 * NarrativeBridge — 镜头间叙事桥接注入器
 * 为每个镜头的提示词注入前后上下文，确保叙事连贯
 * 
 * 三层衔接：
 * 1. 视觉衔接：位置连续性、动作匹配、视线方向
 * 2. 情绪衔接：情绪递进、张力曲线
 * 3. 动作因果：上一镜头动作→当前镜头反应
 */

class NarrativeBridge {
  /**
   * 为指定镜头生成叙事桥接上下文
   * @param {Object} plan - 故事规划
   * @param {number} shotIndex - 当前镜头索引
   * @returns {string} 桥接上下文文本
   */
  inject(plan, shotIndex) {
    const shots = plan.shots;
    if (!shots || shots.length === 0) return '';

    const current = shots[shotIndex];
    const prev = shotIndex > 0 ? shots[shotIndex - 1] : null;
    const next = shotIndex < shots.length - 1 ? shots[shotIndex + 1] : null;

    const bridgeContext = [];

    // 1. 视觉连续性约束（上一镜头结尾→当前镜头开头）
    if (prev) {
      const prevEndState = this._extractEndState(prev);
      if (prevEndState) {
        bridgeContext.push(`紧接上画面: ${prevEndState}`);
      }
    }

    // 2. 情绪递进标记
    if (prev && current) {
      const emotionDelta = this._computeEmotionDelta(prev, current);
      if (emotionDelta > 20) {
        bridgeContext.push('情绪升级');
      } else if (emotionDelta < -20) {
        bridgeContext.push('情绪回落');
      }
    }

    // 3. 动作因果链
    if (prev && current) {
      const causalLink = this._findCausalLink(prev, current);
      if (causalLink) {
        bridgeContext.push(causalLink);
      }
    }

    // 4. 匹配剪辑提示
    const matchCutHint = this._suggestMatchCut(prev, current, next);
    if (matchCutHint) {
      bridgeContext.push(matchCutHint);
    }

    return bridgeContext.join('；');
  }

  _extractEndState(shot) {
    const handoff = shot.handoff || '';
    const chars = (shot.characters || []).join('、');
    if (!handoff && !chars) return '';
    
    const parts = [];
    if (chars) parts.push(chars);
    if (handoff) parts.push(handoff);
    
    return parts.join('，');
  }

  _computeEmotionDelta(prev, current) {
    const prevTension = prev.tension || 50;
    const currTension = current.tension || 50;
    return currTension - prevTension;
  }

  _findCausalLink(prev, current) {
    const prevDesc = (prev.description || '').toLowerCase();
    const currDesc = (current.description || '').toLowerCase();

    // 教学类：步骤A→步骤B
    if (prev.type === '步骤演示' && current.type === '步骤演示') {
      return '动作延续: 上一步衔接当前动作';
    }
    if (prev.type === '关键动作' && current.type === '特写放大') {
      return '因果衔接: 关键动作后放大细节';
    }
    if (prev.type === '效果展示' && current.type === '对比验证') {
      return '因果衔接: 展示效果后进行对比验证';
    }

    // 动作类：攻击→防御
    if (prevDesc.includes('挥') && currDesc.includes('挡')) {
      return '动作匹配: 攻击→格挡连续';
    }
    if (prevDesc.includes('跑') && currDesc.includes('停')) {
      return '动作匹配: 奔跑→急停';
    }

    // 视线匹配
    if (prevDesc.includes('看') && (currDesc.includes('场景') || currDesc.includes('环境'))) {
      return '视线匹配: 角色视线→场景展示';
    }

    return null;
  }

  _suggestMatchCut(prev, current, next) {
    if (!prev || !current) return null;

    // 幕切换时的转场提示
    if (prev.act !== current.act) {
      return '新幕开始，场景可能转换';
    }

    // 特写→全景的呼吸感
    if (prev.description?.includes('特写') && current.description?.includes('全景')) {
      return '景别呼吸: 特写→全景拉开';
    }

    // 全景→特写的聚焦
    if (prev.description?.includes('全景') && current.description?.includes('特写')) {
      return '景别聚焦: 全景→特写推进';
    }

    return null;
  }
}

module.exports = { NarrativeBridge };
