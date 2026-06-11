/**
 * 需求对齐度评估器
 * 评估方案与用户原始需求的语义匹配度
 */

function evaluate(plan, userNeed) {
  if (!userNeed || !plan) {
    return { score: 0, feedback: ['无法评估：缺少方案或需求'], warnings: ['数据不完整'] };
  }

  const subScores = {};
  const feedback = [];
  const warnings = [];
  const strengths = [];

  // === 1.1 核心主题覆盖 ===
  const needKeywords = extractKeywords(userNeed);
  const planTitle = (plan.title || '').toLowerCase();
  const planOutline = (plan.outline || '').toLowerCase();
  const combined = planTitle + planOutline;

  let matchedKeywords = 0;
  let matchedList = [];
  for (const kw of needKeywords) {
    if (combined.includes(kw.toLowerCase())) {
      matchedKeywords++;
      matchedList.push(kw);
    }
  }
  const coverageRate = needKeywords.length > 0 ? matchedKeywords / needKeywords.length : 0.5;
  subScores.themeCoverage = Math.round(coverageRate * 100);

  if (coverageRate >= 0.7) {
    strengths.push(`核心主题覆盖良好：匹配关键词 [${matchedList.join(', ')}]`);
  } else if (coverageRate < 0.4) {
    const missing = needKeywords.filter(k => !combined.includes(k.toLowerCase()));
    feedback.push(`主题覆盖不足（${Math.round(coverageRate * 100)}%），未覆盖关键词：[${missing.join(', ')}]`);
  }

  // === 1.2 情感基调一致性 ===
  const toneMap = extractTone(userNeed);
  const planTone = detectPlanTone(plan);
  const toneMatch = calculateToneMatch(toneMap, planTone);
  subScores.toneAlignment = Math.round(toneMatch * 100);

  if (toneMatch >= 0.8) {
    strengths.push(`情感基调高度一致：${planTone.join('、')}`);
  } else if (toneMatch < 0.5) {
    feedback.push(`情感基调偏离：用户期望 ${toneMap.join('、')}，方案呈现 ${planTone.join('、')}`);
  }

  // === 1.3 关键场景覆盖 ===
  const planShots = plan.shots || [];
  const sceneKeywords = extractSceneKeywords(userNeed);
  const sceneMatches = sceneKeywords.filter(kw =>
    planShots.some(s => (s.description || '').includes(kw))
  );
  const sceneCoverage = sceneKeywords.length > 0 ? sceneMatches.length / sceneKeywords.length : 0.6;
  subScores.sceneCoverage = Math.round(sceneCoverage * 100);

  if (sceneCoverage >= 0.7) {
    strengths.push(`关键场景覆盖完整：${sceneMatches.join('、')}`);
  } else if (sceneKeywords.length > 0 && sceneCoverage < 0.5) {
    const missing = sceneKeywords.filter(k => !sceneMatches.includes(k));
    feedback.push(`关键场景缺失：[${missing.join(', ')}]`);
  }

  // === 1.4 角色设定一致性 ===
  const userChars = extractCharKeywords(userNeed);
  const planChars = (plan.characters || []).map(c => c.toLowerCase());
  const charMatches = userChars.filter(c => planChars.some(p => p.includes(c) || c.includes(p)));
  const charCoverage = userChars.length > 0 ? charMatches.length / userChars.length : 0.7;
  subScores.characterAlignment = Math.round(charCoverage * 100);

  if (charCoverage >= 0.8) {
    strengths.push(`角色设定一致：${charMatches.join('、')}`);
  } else if (userChars.length > 0 && charCoverage < 0.6) {
    feedback.push(`角色设定偏差：用户期望 ${userChars.join('、')}，方案包含 ${planChars.join('、')}`);
  }

  // === 1.5 时长/规格匹配 ===
  const planDuration = plan.totalDuration || 0;
  // 简单评估：如果用户提到时长，检查是否匹配
  const durationMatch = userNeed.includes(`${planDuration}`) || !extractDurationKeywords(userNeed).length ? 90 : 60;
  subScores.specMatch = durationMatch;

  // 加权总分
  const weights = { themeCoverage: 0.30, toneAlignment: 0.25, sceneCoverage: 0.20, characterAlignment: 0.15, specMatch: 0.10 };
  const score = Math.round(
    Object.entries(subScores).reduce((sum, [k, v]) => sum + v * (weights[k] || 0), 0)
  );

  if (warnings.length === 0 && feedback.length === 0) {
    feedback.push('需求对齐度整体良好，无重大偏离');
  }

  return { score, subScores, feedback, warnings, strengths };
}

// === 辅助函数 ===

function extractKeywords(text) {
  if (!text) return [];
  // 提取中文关键词：名词、动词、形容词
  const keywords = [];
  const patterns = [
    /[关于的的个一种讲述展示描绘传递展现表达呈现]+([\u4e00-\u9fa5]{2,6})/g,
    /([\u4e00-\u9fa5]{2,4})(短片|视频|广告|教程|纪录片|宣传片|故事)/g,
  ];
  // 简单分词：按长度 2-4 提取有意义的词
  const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const stopWords = ['一个', '一种', '关于', '讲述', '一个关于', '展示', '传递', '展现', '描绘'];
  keywords.push(...words.filter(w => !stopWords.includes(w)));
  return [...new Set(keywords)];
}

function extractTone(text) {
  const toneMap = {
    '治愈': ['治愈', '温暖', '温馨', '温情'],
    '紧张': ['紧张', '惊险', '危机', '危险'],
    '感动': ['感动', '感人', '催泪', '泪目'],
    '震撼': ['震撼', '壮观', '宏大', '史诗'],
    '幽默': ['幽默', '搞笑', '轻松', '欢乐'],
    '悲伤': ['悲伤', '伤感', '痛苦', '离别'],
    '励志': ['励志', '成长', '奋斗', '坚持'],
    '浪漫': ['浪漫', '爱情', '甜蜜', '唯美'],
  };
  const tones = [];
  for (const [tone, words] of Object.entries(toneMap)) {
    if (words.some(w => text.includes(w))) tones.push(tone);
  }
  return tones.length > 0 ? tones : ['中性'];
}

function detectPlanTone(plan) {
  const emotionCurve = plan.emotionCurve || [];
  const maxTension = Math.max(...emotionCurve.map(e => e.tension || 0), 0);
  const avgTension = emotionCurve.length > 0 ? emotionCurve.reduce((s, e) => s + (e.tension || 0), 0) / emotionCurve.length : 50;
  const shots = plan.shots || [];
  const desc = shots.map(s => s.description + s.emotionStart + s.emotionEnd).join('');

  const tones = [];
  if (maxTension > 80 && desc.includes('碰撞')) tones.push('紧张');
  if (avgTension > 40 && desc.includes('爆发')) tones.push('震撼');
  if (desc.includes('治愈') || desc.includes('温暖') || desc.includes('温柔')) tones.push('治愈');
  if (desc.includes('悲伤') || desc.includes('离别') || desc.includes('泪')) tones.push('悲伤');
  if (desc.includes('感动') || desc.includes('情感') || desc.includes('亲情')) tones.push('感动');
  if (avgTension < 30) tones.push('平静');
  return tones.length > 0 ? tones : ['中性'];
}

function calculateToneMatch(needTones, planTones) {
  if (needTones.length === 0 || planTones.length === 0) return 0.6;
  const matches = needTones.filter(t => planTones.includes(t)).length;
  return Math.min(1, matches / Math.min(needTones.length, planTones.length));
}

function extractSceneKeywords(text) {
  const scenePatterns = ['场景', '画面', '镜头', '片段'];
  // 简化：从文本中提取可能的场景关键词
  return [];
}

function extractCharKeywords(text) {
  const chars = [];
  // 匹配"XXX:"格式的角色定义
  const charMatches = text.match(/([^:，,]+)[:,]([^:，,]+)/g) || [];
  chars.push(...charMatches.map(c => c.split(/[:,]/)[0].trim()));
  return chars;
}

function extractDurationKeywords(text) {
  return text.match(/(\d+)\s*秒/g) || [];
}

module.exports = { evaluate };
