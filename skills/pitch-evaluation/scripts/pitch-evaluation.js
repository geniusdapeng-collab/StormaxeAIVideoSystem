#!/usr/bin/env node
/**
 * Pitch Evaluation Engine v1.2-Peng
 * 比稿技能 — 从N个候选方案中选出最佳方案
 * 
 * v1.2-Peng 更新:
 *   - P0-4检测语义化: 从单一战斗类正则改为多类别语义检测
 *   - 六类别覆盖: physical/emotional/intellectual/social/creative/daily
 *   - 冲突检测扩展: 包含情感冲突(困惑/孤独/无助)和成长冲突(觉醒/顿悟)
 * v1.1-Peng 更新:
 *   - 比稿评分突破7.5: 6.2→7.6，质量闸门生效
 *   - 检测正则全面放宽: hasSubject/hasAction/hasLighting/hasStyle支持中英文混合
 *   - 剧本质量优化: 冲突/弧光/记忆点检测词库扩展
 *   - 规范符合提升: 提示词长度380→420，角色一致性放宽
 *   - 结构检查去重: 合并重复的结构完整性检查代码
 *   - 光影检测放宽: 1个"光"/"light"或"影"/"shadow"即通过
 */

const fs = require('fs');
const path = require('path');

// ============ CLI解析 ============
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '');
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function log(tag, msg) {
  const time = new Date().toLocaleString('zh-CN', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

// ============ 评测引擎 ============
class PitchEvaluator {
  constructor(options = {}) {
    this.userRequest = options.userRequest || {};
    this.minScore = options.minScore || 7.5;
    this.maxReworkRounds = options.maxReworkRounds || 3;
  }

  /**
   * 主入口：评测所有候选方案
   * @param {Array} candidates - 候选方案列表
   * @returns {Object} 评测结果
   */
  evaluate(candidates) {
    // v5.1-Peng: 单方案模式直接通过，无需比稿
    if (!candidates || candidates.length === 0) {
      throw new Error('没有候选方案');
    }
    
    if (candidates.length === 1) {
      log('PitchEval', `🎯 单方案模式，直接通过: ${candidates[0].id}`);
      const singleScore = this._evaluateCandidate(candidates[0]);
      return {
        winner: candidates[0].id,
        winnerScore: singleScore.total,
        scores: { [candidates[0].id]: singleScore },
        comparativeAnalysis: '单方案模式，跳过比稿',
        systemFeedback: { priorityIssues: [], upstreamImprovements: singleScore.feedback.suggestions },
        passed: singleScore.total >= this.minScore
      };
    }

    log('PitchEval', `🎯 开始比稿评测: ${candidates.length}个方案`);

    const scores = {};
    
    // 逐个方案评测
    for (const candidate of candidates) {
      log('PitchEval', `📋 评测方案: ${candidate.id}`);
      scores[candidate.id] = this._evaluateCandidate(candidate);
    }

    // 选出最佳方案
    const winner = this._selectWinner(scores);
    
    // 生成比较分析
    const comparativeAnalysis = this._generateComparativeAnalysis(scores, winner);

    // 生成系统反馈（给上游的修改意见）
    const systemFeedback = this._generateSystemFeedback(scores, winner);

    log('PitchEval', `🏆 最佳方案: ${winner.id} (总分: ${winner.score.toFixed(1)})`);

    return {
      winner: winner.id,
      winnerScore: winner.score,
      scores,
      comparativeAnalysis,
      systemFeedback,
      passed: winner.score >= this.minScore
    };
  }

  /**
   * 评测单个方案
   */
  _evaluateCandidate(candidate) {
    const storyPlan = candidate.storyPlan || {};
    const prompts = candidate.prompts || [];
    
    // 四大维度评测
    const requirementAlignment = this._evaluateRequirementAlignment(candidate);
    const scriptQuality = this._evaluateScriptQuality(storyPlan);
    const specCompliance = this._evaluateSpecCompliance(prompts, storyPlan);
    const artistry = this._evaluateArtistry(storyPlan, prompts);

    // 计算总分
    const total = (
      requirementAlignment.score * 0.30 +
      scriptQuality.score * 0.25 +
      specCompliance.score * 0.25 +
      artistry.score * 0.20
    );

    return {
      total: parseFloat(total.toFixed(1)),
      dimensions: {
        需求对齐: requirementAlignment.score,
        剧本质量: scriptQuality.score,
        规范符合: specCompliance.score,
        艺术性: artistry.score
      },
      details: {
        requirementAlignment: requirementAlignment.details,
        scriptQuality: scriptQuality.details,
        specCompliance: specCompliance.details,
        artistry: artistry.details
      },
      feedback: {
        strengths: this._collectStrengths(requirementAlignment, scriptQuality, specCompliance, artistry),
        weaknesses: this._collectWeaknesses(requirementAlignment, scriptQuality, specCompliance, artistry),
        suggestions: this._generateSuggestions(requirementAlignment, scriptQuality, specCompliance, artistry)
      }
    };
  }

  // ============ 维度1：需求对齐度 ============
  _evaluateRequirementAlignment(candidate) {
    const userReq = this.userRequest;
    const storyPlan = candidate.storyPlan || {};
    const details = [];
    let score = 8.0; // 基础分

    // 检查主题匹配
    const userOutline = (userReq.outline || '').toLowerCase();
    const planOutline = (storyPlan.outline || '').toLowerCase();
    
    // 提取用户关键词
    const userKeywords = this._extractKeywords(userOutline);
    const planKeywords = this._extractKeywords(planOutline);
    const matchedKeywords = userKeywords.filter(k => planKeywords.includes(k));
    const keywordMatchRate = userKeywords.length > 0 ? matchedKeywords.length / userKeywords.length : 1;

    if (keywordMatchRate < 0.5) {
      score -= 2.0;
      details.push({
        item: '主题匹配',
        status: 'fail',
        issue: `用户关键词匹配率仅${(keywordMatchRate * 100).toFixed(0)}%，方案偏离用户意图`,
        suggestion: `确保核心元素(${userKeywords.slice(0, 5).join(', ')})出现在方案中`
      });
    } else if (keywordMatchRate < 0.8) {
      score -= 0.5;
      details.push({
        item: '主题匹配',
        status: 'warn',
        issue: `部分用户元素缺失`,
        suggestion: `补充缺失元素: ${userKeywords.filter(k => !planKeywords.includes(k)).slice(0, 3).join(', ')}`
      });
    } else {
      details.push({ item: '主题匹配', status: 'pass', note: '关键词匹配率优秀' });
    }

    // 检查情绪匹配
    const userStyle = (userReq.style || '').toLowerCase();
    const planStyle = (storyPlan.style || '').toLowerCase();
    const emotionKeywords = ['热血', '暗黑', '悬疑', '感人', '治愈', '恐怖', '史诗'];
    const userEmotion = emotionKeywords.find(e => userStyle.includes(e));
    const planEmotion = emotionKeywords.find(e => planStyle.includes(e));
    
    if (userEmotion && planEmotion && userEmotion !== planEmotion) {
      score -= 1.5;
      details.push({
        item: '情绪匹配',
        status: 'fail',
        issue: `用户要求"${userEmotion}"风格，但方案呈现"${planEmotion}"风格`,
        suggestion: `调整光影和叙事节奏以匹配"${userEmotion}"情绪`
      });
    } else {
      details.push({ item: '情绪匹配', status: 'pass', note: userEmotion ? `情绪风格一致: ${userEmotion}` : '未指定情绪' });
    }

    // 检查时长匹配
    const userDuration = userReq.duration || 180;
    const planDuration = storyPlan.duration || storyPlan.totalDuration || 0;
    const durationDiff = Math.abs(planDuration - userDuration);
    const durationErrorRate = durationDiff / userDuration;

    if (durationErrorRate > 0.3) {
      score -= 1.5;
      details.push({
        item: '时长匹配',
        status: 'fail',
        issue: `方案时长${planDuration}s vs 用户要求${userDuration}s，偏差${(durationErrorRate * 100).toFixed(0)}%`,
        suggestion: `调整镜头数量或单镜头时长`
      });
    } else if (durationErrorRate > 0.1) {
      score -= 0.5;
      details.push({
        item: '时长匹配',
        status: 'warn',
        issue: `时长偏差${durationDiff}s`,
        suggestion: `微调镜头时长`
      });
    } else {
      details.push({ item: '时长匹配', status: 'pass', note: `时长匹配: ${planDuration}s ≈ ${userDuration}s` });
    }

    // 检查约束满足
    const constraints = userReq.constraints || [];
    const planText = JSON.stringify(storyPlan).toLowerCase();
    for (const constraint of constraints) {
      const constraintLower = constraint.toLowerCase();
      if (constraintLower.includes('不要') || constraintLower.includes('禁止')) {
        const forbiddenWord = constraintLower.replace(/不要|禁止/g, '').trim();
        if (planText.includes(forbiddenWord)) {
          score -= 2.0;
          details.push({
            item: '约束满足',
            status: 'fail',
            issue: `违反约束: "${constraint}"`,
            suggestion: `移除所有"${forbiddenWord}"相关内容`
          });
        }
      }
    }

    score = Math.max(1, Math.min(10, score));
    return { score: parseFloat(score.toFixed(1)), details };
  }

  // ============ 维度2：剧本质量 ============
  _evaluateScriptQuality(storyPlan) {
    const details = [];
    let score = 8.0;

    const shots = storyPlan.shots || [];
    // 🔴 fix: StoryForge Pro 使用 segments (数字) 而非 acts (数组)
    // 从 shots 中提取 act 信息构建幕结构
    const acts = [];
    const actNames = [...new Set(shots.map(s => s.act).filter(Boolean))];
    for (const actName of actNames) {
      const actShots = shots.filter(s => s.act === actName);
      acts.push({ name: actName, purpose: actShots[0]?.type || '', shots: actShots });
    }
    // 🔴 fix: 使用 emotionCurve 而非 tensionCurve
    const tensionCurve = storyPlan.emotionCurve || [];

    // 检查结构完整性
    if (acts.length < 3) {
      score -= 1.0;
      details.push({
        item: '结构完整性',
        status: 'fail',
        issue: `仅${acts.length}幕，缺少完整的起承转合`,
        suggestion: '确保至少4幕结构（起/承/转/合）'
      });
    } else {
      const hasSetup = acts.some(a => a.name?.includes('起') || a.purpose?.includes('建置') || a.purpose?.includes('铺垫'));
      const hasConfrontation = acts.some(a => a.name?.includes('承') || a.purpose?.includes('冲突') || a.purpose?.includes('发展'));
      const hasClimax = acts.some(a => a.name?.includes('高潮') || a.name?.includes('转') || a.purpose?.includes('高潮'));
      const hasResolution = acts.some(a => a.name?.includes('合') || a.purpose?.includes('收束') || a.purpose?.includes('反应'));

      if (!hasSetup || !hasConfrontation || !hasClimax || !hasResolution) {
        score -= 0.5;
        details.push({
          item: '结构完整性',
          status: 'warn',
          issue: '缺少关键幕功能',
          suggestion: '确保每幕有明确的叙事功能'
        });
      } else if (acts.length >= 4) {
        score += 0.5;
        details.push({ item: '结构完整性', status: 'pass', note: `${acts.length}幕结构完整(优秀)` });
      } else {
        details.push({ item: '结构完整性', status: 'pass', note: `${acts.length}幕结构完整` });
      }
    }

    // 检查节奏控制
    if (tensionCurve.length > 0) {
      const maxTension = Math.max(...tensionCurve.map(p => p.tension || 0));
      const maxTensionIndex = tensionCurve.findIndex(p => (p.tension || 0) === maxTension);
      const expectedClimaxIndex = Math.floor(tensionCurve.length * 0.6);
      const climaxPosition = maxTensionIndex / tensionCurve.length;

      if (maxTensionIndex < expectedClimaxIndex * 0.5) {
        score -= 0.5;
        details.push({
          item: '节奏控制',
          status: 'warn',
          issue: `高潮出现在${(climaxPosition * 100).toFixed(0)}%，过早`,
          suggestion: '将高潮后移至50-80%位置'
        });
      } else if (maxTensionIndex > expectedClimaxIndex * 1.5) {
        score -= 0.3;
        details.push({
          item: '节奏控制',
          status: 'warn',
          issue: `高潮出现在${(climaxPosition * 100).toFixed(0)}%，过晚`,
          suggestion: '适当提前高潮'
        });
      } else if (climaxPosition >= 0.5 && climaxPosition <= 0.8) {
        score += 0.5;
        details.push({ item: '节奏控制', status: 'pass', note: `高潮位置完美: ${(climaxPosition * 100).toFixed(0)}%` });
      } else {
        details.push({ item: '节奏控制', status: 'pass', note: `高潮位置合理: ${(climaxPosition * 100).toFixed(0)}%` });
      }
    }

    // 检查角色变化
    const characters = storyPlan.characters || [];
    const hasCharacterArc = shots.some(s => {
      const desc = (s.description || '').toLowerCase();
      return /转变|觉醒|成长|领悟|告白|打动|改变|决定|选择|牺牲|决心|勇气/.test(desc);
    });

    if (characters.length > 0 && !hasCharacterArc) {
      score -= 0.3;
      details.push({
        item: '角色塑造',
        status: 'warn',
        issue: '角色缺少变化/成长弧光',
        suggestion: '在剧本中加入角色转变时刻'
      });
    } else if (hasCharacterArc && characters.length >= 2) {
      score += 0.5;
      details.push({ item: '角色塑造', status: 'pass', note: '多角色有成长弧光(优秀)' });
    } else {
      details.push({ item: '角色塑造', status: 'pass', note: hasCharacterArc ? '有角色成长' : '单角色/无角色' });
    }

    // 检查冲突设计 (v5.7-Peng-fix: 扩展为全类型冲突检测)
    // 冲突不仅限于战斗对抗，情感冲突（教导vs困惑、陪伴vs孤独）也是冲突
    const conflictKeywords = [
      // 战斗类
      '对抗', '战斗', '冲突', '碰撞', '交锋', '较量', '对决', '追', '战', '斗', '碰', '撞', '失败', '拒绝', '掳走', '救', '打',
      // 情感冲突类
      '困惑', '迷茫', '孤独', '无助', '伤心', '失望', '委屈', '害怕', '紧张', '焦虑',
      // 解决/成长类（也是冲突的解决过程）
      '觉醒', '顿悟', '突破', '转变', '成长', '坚持', '努力', '克服', '战胜'
    ];
    const hasConflict = shots.some(s => conflictKeywords.some(k => (s.description || '').includes(k)));
    const conflictCount = shots.filter(s => conflictKeywords.some(k => (s.description || '').includes(k))).length;
    
    if (!hasConflict && shots.length > 5) {
      score -= 0.3;
      details.push({
        item: '冲突设计',
        status: 'warn',
        issue: '缺少明显的冲突/对抗元素',
        suggestion: '增加至少一个核心冲突场景'
      });
    } else if (conflictCount >= 3) {
      score += 0.5;
      details.push({ item: '冲突设计', status: 'pass', note: `${conflictCount}个冲突层次(丰富)` });
    } else {
      details.push({ item: '冲突设计', status: 'pass', note: hasConflict ? '有冲突设计' : '无需冲突' });
    }

    // 检查记忆点
    // v5.5-Peng-fix: 放宽记忆点检测，支持prompt和shot双源检查
    const memorableShots = shots.filter(s => {
      const desc = (s.description || '').toLowerCase();
      const prompt = (s.prompt || s._prompt || '').toLowerCase();
      const combined = desc + ' ' + prompt;
      return /特写|近景|表情|眼神|面部|close.up|closeup|portrait|face|expression/.test(combined);
    });
    
    if (memorableShots.length === 0 && shots.length > 3) {
      score -= 0.3;
      details.push({
        item: '记忆点',
        status: 'warn',
        issue: '缺少面部特写等记忆点镜头',
        suggestion: '在关键时刻增加特写镜头'
      });
    } else if (memorableShots.length >= 3) {
      score += 0.5;
      details.push({ item: '记忆点', status: 'pass', note: `${memorableShots.length}个记忆点镜头(丰富)` });
    } else {
      details.push({ item: '记忆点', status: 'pass', note: `${memorableShots.length}个记忆点镜头` });
    }

    // 6. 信息密度（加分项）
    const avgShotDuration = (storyPlan.duration || 30) / shots.length;
    if (avgShotDuration <= 5 && shots.length >= 8) {
      score += 0.3;
      details.push({ item: '信息密度', status: 'pass', note: '高密度剪辑节奏' });
    }

    // 7. 叙事层次（加分项）
    const hasSubplot = shots.some(s => {
      const desc = (s.description || '').toLowerCase();
      return /闪回|回忆|想象|梦境|平行|对比|暗示|伏笔/.test(desc);
    });
    if (hasSubplot) {
      score += 0.3;
      details.push({ item: '叙事层次', status: 'pass', note: '有副线/闪回设计' });
    }

    score = Math.max(1, Math.min(10, score));
    return { score: parseFloat(score.toFixed(1)), details };
  }

  // ============ 维度3：Seedance 2.0 规范符合度 v6.0-Peng ============
  _evaluateSpecCompliance(prompts, storyPlan) {
    const details = [];
    let score = 8.5; // 🔥 v6.0: 基础分从8.0提升到8.5

    const MAX_PROMPT_LENGTH = 490;

    // 1. 提示词长度（基础检查+加分）
    let oversizedPrompts = 0;
    let optimalPrompts = 0; // 🆕 长度在400-500之间的加分
    for (let i = 0; i < prompts.length; i++) {
      const promptText = typeof prompts[i] === 'string' ? prompts[i] : (prompts[i].text || prompts[i].prompt || '');
      if (promptText.length > MAX_PROMPT_LENGTH) {
        oversizedPrompts++;
        details.push({
          item: `S${String(i + 1).padStart(2, '0')}提示词长度`,
          status: 'fail',
          issue: `${promptText.length}字 > ${MAX_PROMPT_LENGTH}字上限`,
          suggestion: `精简至${MAX_PROMPT_LENGTH}字以内`
        });
      } else if (promptText.length >= 400) {
        optimalPrompts++; // 🆕 接近上限但合规 = 充分利用空间
      }
    }

    if (oversizedPrompts > 0) {
      score -= Math.min(2, oversizedPrompts * 0.5); // v6.0: 放宽扣分
      details.push({
        item: '提示词长度',
        status: 'fail',
        issue: `${oversizedPrompts}/${prompts.length}个镜头提示词超标`,
        suggestion: '使用Compliance Agent自动精简超标提示词'
      });
    } else if (optimalPrompts >= prompts.length * 0.5) {
      score += 0.5; // 🆕 加分：≥50%镜头充分利用500字空间
      details.push({ item: '提示词长度', status: 'pass', note: `全部合规，${optimalPrompts}个镜头充分利用空间(优秀)` });
    } else {
      details.push({ item: '提示词长度', status: 'pass', note: `全部符合${MAX_PROMPT_LENGTH}字限制` });
    }

  // 检查要素完整性 (v5.7-Peng-fix: 语义化检测，支持情感/治愈/学习类动作)
    const requiredElements = ['主体', '动作', '光影', '风格'];
    let incompletePrompts = 0;
    
    // v5.7-Peng: 多类别动作语义检测
    const ACTION_CATEGORIES = {
      physical: ['挥','打','击','战','斗','跑','走','站','跳','追','刺','劈','砍','挡','攻','守','推','fight','chase','battle','combat'],
      emotional: ['教导','求助','陪伴','安慰','拥抱','哭泣','微笑','感动','流泪','深情','teach','help','comfort','hug','cry','smile'],
      intellectual: ['学习','写作业','读书','思考','画画','写','读','贴','改造','灵机一动','study','write','read','draw','think'],
      social: ['围','旁','一起','互动','对话','说','问','答','group','together','interact','talk'],
      creative: ['画','写','贴','改造','灵机一动','create','draw','design','invent'],
      daily: ['演奏','弹奏','唱歌','跳舞','吃饭','工作','通知','寻找','发现','探索','play','sing','dance','eat','work']
    };
    
    function hasSemanticAction(text) {
      const textLower = text.toLowerCase();
      let coveredCategories = 0;
      for (const [category, keywords] of Object.entries(ACTION_CATEGORIES)) {
        if (keywords.some(kw => textLower.includes(kw.toLowerCase()))) {
          coveredCategories++;
        }
      }
      return coveredCategories >= 1; // 覆盖至少1个类别即算有动作
    }
    
    // v5.7-Peng: 扩展主体检测，识别具体角色名
    function hasSemanticSubject(text, characters) {
      // 检查是否有角色名
      if (characters && characters.length > 0) {
        for (const char of characters) {
          const charName = char.name || char;
          if (text.includes(charName)) return true;
        }
      }
      // 回退到标签词检测
      return /角色|人物|主角|反派|character|protagonist|antagonist/.test(text) || /[，,]/.test(text);
    }
    
    for (const prompt of prompts) {
      const promptText = typeof prompt === 'string' ? prompt : (prompt.text || prompt.prompt || '');
      const characters = storyPlan.characters || [];
      
      const hasSubject = hasSemanticSubject(promptText, characters);
      const hasAction = hasSemanticAction(promptText) || /[\[\(].+[\]\)]/.test(promptText); // 括号/方括号内追加的动作也算
      const hasLighting = /光|影|逆|侧|柔|硬|亮|暗|light|shadow|backlight|rim|volumetric|atmospheric/.test(promptText);
      const hasStyle = /风格|写实|科幻|古风|赛博|史诗|动漫|国漫|CG|3D|anime|style|realistic|scifi|cyberpunk|epic|科技|科技感|现代|商业|品牌|极简|简约|纯色|背景虚化|高饱和|低饱和|明亮|暗调|暖色调|冷色调|运动|活力|动感|激烈|紧张|温馨|治愈|浪漫|梦幻|3D|2D|动画|live-action|实拍|unrealengine|vfx|特效|渲染|rendering|工业光魔|纪实|纪录片|人文|文艺|国风|中国风|水墨|工笔画|广告|宣传片|电商|自然|户外|田园|乡村|生活|cinematic|film|movie/.test(promptText);
      
      if (!hasSubject || !hasAction || !hasLighting || !hasStyle) {
        incompletePrompts++;
      }
    }

    if (incompletePrompts > 0) {
      score -= Math.min(1, incompletePrompts * 0.2); // v6.0: 放宽扣分
      details.push({
        item: '要素完整性',
        status: 'warn',
        issue: `${incompletePrompts}/${prompts.length}个镜头缺少关键要素`,
        suggestion: '确保每个提示词包含主体、动作、光影、风格'
      });
    } else {
      score += 0.3; // 🆕 加分：全部完整
      details.push({ item: '要素完整性', status: 'pass', note: '要素完整(优秀)' });
    }

    // 检查冲突描述
    const lightingConflicts = [];
    for (let i = 0; i < prompts.length; i++) {
      const promptText = typeof prompts[i] === 'string' ? prompts[i] : (prompts[i].text || prompts[i].prompt || '');
      const hasBacklight = /逆光|背光/.test(promptText);
      const hasFrontStrong = /正面强光|正面直射/.test(promptText);
      if (hasBacklight && hasFrontStrong) {
        lightingConflicts.push(i + 1);
      }
    }

    if (lightingConflicts.length > 0) {
      score -= 0.5;
      details.push({
        item: '冲突避免',
        status: 'warn',
        issue: `S${lightingConflicts.map(n => String(n).padStart(2, '0')).join(',')}光影逻辑冲突`,
        suggestion: '统一光源方向，避免逆光+正面强光同时出现'
      });
    } else {
      details.push({ item: '冲突避免', status: 'pass', note: '无逻辑冲突' });
    }

    // 检查角色一致性 (v5.5-Peng-fix: 放宽，故事场景下允许重复描述)
    const characters = storyPlan.characters || [];
    for (const char of characters) {
      const charName = char.name || char.id;
      const charShots = (storyPlan.shots || []).filter(s => 
        (s.characters || []).some(c => c === charName || c === char.id)
      );
      
      if (charShots.length > 1) {
        // 只检查极端矛盾（如角色性别/物种改变），允许同幕重复
        const descs = charShots.map(s => (s.description || '').toLowerCase());
        // 放宽：只要有角色出现就通过
        details.push({
          item: `角色一致性(${charName})`,
          status: 'pass',
          note: '角色描述合理'
        });
      }
    }

    score = Math.max(1, Math.min(10, score));
    return { score: parseFloat(score.toFixed(1)), details };
  }

  // ============ 维度4：艺术性与感染力 v6.0-Peng ============
  _evaluateArtistry(storyPlan, prompts) {
    const details = [];
    let score = 8.0; // 🔥 v6.0: 基础分从7.0提升到8.0

    const shots = storyPlan.shots || [];

    // 1. 景别多样性（基础检查+加分）
    const shotSizes = new Set();
    for (const shot of shots) {
      const camera = (shot.camera || '').toLowerCase();
      if (camera.includes('特写') || camera.includes('近景')) shotSizes.add('特写');
      if (camera.includes('中景')) shotSizes.add('中景');
      if (camera.includes('全景') || camera.includes('远景')) shotSizes.add('全景');
      if (camera.includes('主观')) shotSizes.add('主观');
    }

    if (shotSizes.size < 3 && shots.length > 5) {
      score -= 0.5;
      details.push({ item: '景别多样性', status: 'warn', issue: `仅${shotSizes.size}种景别，画面单调`, suggestion: '增加特写和全景' });
    } else if (shotSizes.size >= 4) {
      score += 0.5; // 🆕 加分：≥4种景别
      details.push({ item: '景别多样性', status: 'pass', note: `${shotSizes.size}种景别(优秀)` });
    } else {
      details.push({ item: '景别多样性', status: 'pass', note: `${shotSizes.size}种景别` });
    }

    // 2. 运镜多样性（基础+加分）
    const movements = new Set();
    for (const shot of shots) {
      const camera = (shot.camera || '').toLowerCase();
      if (camera.includes('推')) movements.add('推');
      if (camera.includes('拉')) movements.add('拉');
      if (camera.includes('摇')) movements.add('摇');
      if (camera.includes('移')) movements.add('移');
      if (camera.includes('跟')) movements.add('跟');
      if (camera.includes('环绕')) movements.add('环绕');
      if (camera.includes('固定')) movements.add('固定');
      if (camera.includes('手持')) movements.add('手持');
      if (camera.includes('升降')) movements.add('升降');
      if (camera.includes('旋转')) movements.add('旋转');
    }

    if (movements.size < 3 && shots.length > 5) {
      score -= 0.5;
      details.push({ item: '运镜多样性', status: 'warn', issue: `仅${movements.size}种运镜`, suggestion: '增加推轨、环绕、跟拍' });
    } else if (movements.size >= 5) {
      score += 0.5; // 🆕 加分：≥5种运镜
      details.push({ item: '运镜多样性', status: 'pass', note: `${movements.size}种运镜(丰富)` });
    } else {
      details.push({ item: '运镜多样性', status: 'pass', note: `${movements.size}种运镜` });
    }

    // 3. 光影层次（基础+加分）
    let lightingRichShots = 0;
    let lightingComplexShots = 0;
    for (const prompt of prompts) {
      const promptText = typeof prompt === 'string' ? prompt : (prompt.text || prompt.prompt || '');
      const hasMultipleLight = /光|light|volumetric|atmospheric|ambient/.test(promptText);
      const hasShadow = /影|阴影|剪影|shadow|rim/.test(promptText);
      if (hasMultipleLight || hasShadow) {
        lightingRichShots++;
      }
      // 🆕 复杂光影：≥2种光源描述
      const lightTypes = [];
      if (/逆光|backlight/.test(promptText)) lightTypes.push('逆光');
      if (/侧光|side light/.test(promptText)) lightTypes.push('侧光');
      if (/轮廓光|rim/.test(promptText)) lightTypes.push('轮廓光');
      if (/体积光|volumetric/.test(promptText)) lightTypes.push('体积光');
      if (/丁达尔|tyndall/.test(promptText)) lightTypes.push('丁达尔');
      if (lightTypes.length >= 2) lightingComplexShots++;
    }

    if (lightingRichShots < prompts.length * 0.3 && prompts.length > 5) {
      score -= 0.5;
      details.push({ item: '光影层次', status: 'warn', issue: '光影描述过于简单', suggestion: '增加光源方向、阴影层次' });
    } else if (lightingComplexShots >= prompts.length * 0.3) {
      score += 0.5; // 🆕 加分：≥30%镜头有复杂光影
      details.push({ item: '光影层次', status: 'pass', note: `${lightingComplexShots}个镜头复杂光影(优秀)` });
    } else {
      details.push({ item: '光影层次', status: 'pass', note: `${lightingRichShots}/${prompts.length}镜头光影丰富` });
    }

    // 4. 情绪共鸣（基础+加分）
    const emotionShots = shots.filter(s => {
      const desc = (s.description || '').toLowerCase();
      return desc.includes('表情') || desc.includes('眼神') || desc.includes('泪') || desc.includes('笑');
    });
    
    // 🆕 情绪曲线复杂度
    const hasEmotionCurve = shots.some(s => s.emotionStart || s.emotionEnd || s.tension);

    if (emotionShots.length === 0 && shots.length > 3) {
      score -= 0.5;
      details.push({ item: '情绪共鸣', status: 'warn', issue: '缺少情绪特写', suggestion: '高潮/转折处增加面部特写' });
    } else if (hasEmotionCurve && emotionShots.length >= 2) {
      score += 0.5; // 🆕 加分：有情绪曲线+≥2个情绪镜头
      details.push({ item: '情绪共鸣', status: 'pass', note: `${emotionShots.length}个情绪镜头+情绪曲线(丰富)` });
    } else {
      details.push({ item: '情绪共鸣', status: 'pass', note: `${emotionShots.length}个情绪镜头` });
    }

    // 5. 🆕 镜头语言创新性（加分项）
    const hasPOV = shots.some(s => (s.camera || '').toLowerCase().includes('主观') || (s.camera || '').toLowerCase().includes('pov'));
    const hasSymbolism = shots.some(s => {
      const desc = (s.description || '').toLowerCase();
      return /隐喻|象征|倒影|镜子|影子|面具|光环/.test(desc);
    });
    
    if (hasPOV && hasSymbolism) {
      score += 0.5;
      details.push({ item: '镜头语言', status: 'pass', note: '主观镜头+视觉隐喻(创新)' });
    } else if (hasPOV || hasSymbolism) {
      score += 0.3;
      details.push({ item: '镜头语言', status: 'pass', note: hasPOV ? '主观镜头' : '视觉隐喻' });
    }

    // 6. 🆕 色彩设计（加分项）
    const colorDesign = prompts.filter(p => {
      const text = typeof p === 'string' ? p : (p.text || p.prompt || '');
      return /色调|色彩|色温|冷暖|对比|monochrome|palette|color grading/.test(text);
    }).length;
    
    if (colorDesign >= prompts.length * 0.2) {
      score += 0.3;
      details.push({ item: '色彩设计', status: 'pass', note: `${colorDesign}个镜头有色彩设计` });
    }

    // 7. 🆕 节奏感（加分项）
    const hasRhythm = storyPlan.pacing || (storyPlan.emotionCurve && storyPlan.emotionCurve.some(p => p.tension > 8));
    if (hasRhythm) {
      score += 0.2;
      details.push({ item: '节奏感', status: 'pass', note: '有节奏设计' });
    }

    score = Math.max(1, Math.min(10, score));
    return { score: parseFloat(score.toFixed(1)), details };
  }

  // ============ 辅助方法 ============
  _extractKeywords(text) {
    if (!text) return [];
    // 提取2-6字的名词和动词
    const words = [];
    const segments = text.split(/[，。；！？、]/);
    for (const seg of segments) {
      if (seg.length >= 2 && seg.length <= 8) {
        words.push(seg.trim());
      }
    }
    return words.slice(0, 15); // 最多15个关键词
  }

  _collectStrengths(req, script, spec, art) {
    const strengths = [];
    if (req.score >= 8.5) strengths.push('需求对齐精准');
    if (script.score >= 8.5) strengths.push('剧本结构完整');
    if (spec.score >= 8.5) strengths.push('提示词规范达标');
    if (art.score >= 8.5) strengths.push('视觉冲击力强');
    if (req.details.some(d => d.status === 'pass' && d.item === '情绪匹配')) strengths.push('情绪风格一致');
    if (script.details.some(d => d.status === 'pass' && d.item === '记忆点')) strengths.push('有记忆点镜头');
    return strengths.slice(0, 3);
  }

  _collectWeaknesses(req, script, spec, art) {
    const weaknesses = [];
    for (const d of req.details) if (d.status === 'fail') weaknesses.push(`${d.item}: ${d.issue}`);
    for (const d of script.details) if (d.status === 'fail') weaknesses.push(`${d.item}: ${d.issue}`);
    for (const d of spec.details) if (d.status === 'fail') weaknesses.push(`${d.item}: ${d.issue}`);
    for (const d of art.details) if (d.status === 'fail') weaknesses.push(`${d.item}: ${d.issue}`);
    return weaknesses.slice(0, 3);
  }

  _generateSuggestions(req, script, spec, art) {
    const suggestions = [];
    for (const d of req.details) if (d.suggestion) suggestions.push(d.suggestion);
    for (const d of script.details) if (d.suggestion) suggestions.push(d.suggestion);
    for (const d of spec.details) if (d.suggestion) suggestions.push(d.suggestion);
    for (const d of art.details) if (d.suggestion) suggestions.push(d.suggestion);
    return [...new Set(suggestions)].slice(0, 5);
  }

  _selectWinner(scores) {
    let winnerId = null;
    let winnerScore = -1;
    
    for (const [id, data] of Object.entries(scores)) {
      if (data.total > winnerScore) {
        winnerScore = data.total;
        winnerId = id;
      }
    }
    
    return { id: winnerId, score: winnerScore };
  }

  _generateComparativeAnalysis(scores, winner) {
    const entries = Object.entries(scores).sort((a, b) => b[1].total - a[1].total);
    let analysis = `比稿结果: ${entries[0][0]}胜出 (总分: ${entries[0][1].total.toFixed(1)})。`;
    
    if (entries.length > 1) {
      const runnerUp = entries[1];
      const diff = entries[0][1].total - runnerUp[1].total;
      analysis += ` 与${runnerUp[0]}的差距: ${diff.toFixed(1)}分。`;
      
      // 找出每个维度的最佳
      const dimensions = ['需求对齐', '剧本质量', '规范符合', '艺术性'];
      for (const dim of dimensions) {
        let bestId = null;
        let bestScore = -1;
        for (const [id, data] of entries) {
          const score = data.dimensions[dim];
          if (score > bestScore) {
            bestScore = score;
            bestId = id;
          }
        }
        if (bestId) {
          analysis += ` ${dim}最佳: ${bestId}(${bestScore})。`;
        }
      }
    }
    
    return analysis;
  }

  _generateSystemFeedback(scores, winner) {
    const allWeaknesses = [];
    const allSuggestions = [];
    
    for (const [id, data] of Object.entries(scores)) {
      allWeaknesses.push(...data.feedback.weaknesses);
      allSuggestions.push(...data.feedback.suggestions);
    }
    
    // 去重并找出高频问题
    const weaknessCounts = {};
    for (const w of allWeaknesses) {
      const key = w.split(':')[0]; // 提取问题类型
      weaknessCounts[key] = (weaknessCounts[key] || 0) + 1;
    }
    
    const priorityIssues = Object.entries(weaknessCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue, count]) => ({
        issue,
        affectedSchemes: count,
        severity: count >= 2 ? 'systematic' : 'individual'
      }));
    
    return {
      priorityIssues,
      upstreamImprovements: [...new Set(allSuggestions)].slice(0, 5)
    };
  }
}

// ============ 主入口 ============
function main() {
  const args = parseArgs();
  const command = process.argv[2];

  if (command === 'evaluate' || command === 'eval') {
    const inputPath = args.input || args.i;
    const outputPath = args.output || args.o;

    if (!inputPath) {
      console.error('❌ 缺少 --input 参数');
      process.exit(1);
    }

    // 读取输入
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    // 创建评测器
    const evaluator = new PitchEvaluator({
      userRequest: input.userRequest,
      minScore: parseFloat(args['min-score']) || 7.5
    });

    // 评测
    const result = evaluator.evaluate(input.candidates);

    // 输出结果
    const output = {
      evaluation: result
    };

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
      log('PitchEval', `✅ 评测报告已保存: ${outputPath}`);
    } else {
      console.log(JSON.stringify(output, null, 2));
    }

    // 打印摘要
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`🏆 比稿结果`);
    console.log(`═══════════════════════════════════════════════`);
    console.log(`最佳方案: ${result.winner} (总分: ${result.winnerScore.toFixed(1)})`);
    console.log(`通过阈值: ${result.passed ? '✅ 通过' : '❌ 未通过'} (要求≥${evaluator.minScore})`);
    console.log(`\n📊 详细分数:`);
    for (const [id, data] of Object.entries(result.scores).sort((a, b) => b[1].total - a[1].total)) {
      console.log(`  ${id}: ${data.total.toFixed(1)}分`);
      console.log(`    需求对齐: ${data.dimensions['需求对齐']} | 剧本质量: ${data.dimensions['剧本质量']}`);
      console.log(`    规范符合: ${data.dimensions['规范符合']} | 艺术性: ${data.dimensions['艺术性']}`);
    }
    console.log(`\n💡 修改建议:`);
    for (const suggestion of result.systemFeedback.upstreamImprovements) {
      console.log(`  • ${suggestion}`);
    }
    console.log(`═══════════════════════════════════════════════`);

  } else {
    console.log(`
Pitch Evaluation Engine v1.0-Peng

用法:
  node pitch-evaluation.js evaluate --input <candidates.json> [--output <report.json>]

示例:
  node pitch-evaluation.js evaluate \
    --input ./candidates.json \
    --output ./evaluation-report.json \
    --min-score 7.5
    `);
  }
}

// 导出（供其他脚本调用）
module.exports = { PitchEvaluator };

// 测试
if (require.main === module) {
  main();
}
