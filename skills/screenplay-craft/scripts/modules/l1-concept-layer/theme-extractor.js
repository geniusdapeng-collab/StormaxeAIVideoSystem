#!/usr/bin/env node
/**
 * Theme Extractor — 主题提炼引擎 (L1)
 * 提取/定义作品的精神内核、主题矩阵、情感配方
 */

function run(input) {
  const mode = input.mode || 'original';
  const source = input.sourceMaterial || '';
  const userIntent = input.userIntent || '';

  // 从 source 提取关键词用于主题推断
  const themes = {
    action: {
      core: '勇气与成长',
      surface: '战斗与冒险',
      underlying: '自我超越与信念的力量',
      universal: '正义战胜邪恶的永恒叙事'
    },
    drama: {
      core: '爱与救赎',
      surface: '人际关系与情感纠葛',
      underlying: '人性的脆弱与坚韧',
      universal: '连接与理解是治愈一切的良药'
    },
    educational: {
      core: '知识与 empowerment',
      surface: '技能学习与实践',
      underlying: '每个人都能掌握改变生活的能力',
      universal: '教育是最强大的武器'
    },
    commercial: {
      core: '更好的生活',
      surface: '产品功能展示',
      underlying: '科技让日常变得不凡',
      universal: '每个人都值得拥有优质的体验'
    },
    documentary: {
      core: '真实与记录',
      surface: '人物与事件呈现',
      underlying: '每个平凡背后都有不平凡的故事',
      universal: '理解他人就是理解自己'
    }
  };

  // 自动检测主题类型
  let detectedType = 'action';
  const src = typeof source === 'string' ? source.toLowerCase() : JSON.stringify(source).toLowerCase();
  if (src.includes('爱') || src.includes('情感') || src.includes('家庭') || src.includes('成长')) detectedType = 'drama';
  else if (src.includes('教') || src.includes('学') || src.includes('科普') || src.includes('演示')) detectedType = 'educational';
  else if (src.includes('产品') || src.includes('推广') || src.includes('品牌')) detectedType = 'commercial';
  else if (src.includes('纪') || src.includes('实') || src.includes('记录') || src.includes('人文')) detectedType = 'documentary';

  const t = themes[detectedType];

  return {
    coreTheme: userIntent || t.core,
    themeMatrix: {
      surface: t.surface,
      underlying: t.underlying,
      universal: t.universal
    },
    emotionalFormula: {
      primaryEmotion: detectedType === 'action' ? '热血' : detectedType === 'drama' ? '感动' : detectedType === 'educational' ? '收获' : detectedType === 'commercial' ? '惊喜' : '共鸣',
      emotionalArc: mode === 'ip-based' ? '传承与新生' : '发现→成长→蜕变',
      resonancePoints: ['身份认同', '情感共鸣', '视觉震撼']
    },
    motifs: detectedType === 'action' ? ['光芒', '破晓', '觉醒'] : detectedType === 'drama' ? ['回望', '牵手', '告别'] : ['发现', '突破', '收获'],
    thematicQuestions: [mode === 'ip-based' ? '经典精神如何在新时代延续？' : '什么力量驱动主角做出选择？'],
    philosophicalAnchor: mode === 'ip-based' ? '传统的现代诠释' : '平凡中的不凡',
    culturalDNA: mode === 'ip-based' ? '经典文化基因 + 现代审美' : '东方美学 + 世界叙事'
  };
}

module.exports = { run };
