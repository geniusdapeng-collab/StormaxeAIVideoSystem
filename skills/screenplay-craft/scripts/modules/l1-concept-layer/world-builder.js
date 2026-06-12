#!/usr/bin/env node
/**
 * World Builder — 世界观架构师 (L1)
 * 从零构建完整的世界观体系，或基于 IP 解析结果重建
 */

function run(input) {
  const mode = input.mode || 'original';
  const prompt = input.userPrompt || '';
  const theme = input.themeManifesto || '';
  const styleHint = input.styleHint || '写实电影质感,动态光影,电影级构图';
  const ipAnalysis = input.ipAnalysis || null;

  // 自动检测世界观方向
  const src = prompt.toLowerCase();
  let worldName, era, geography, powerSystem, coreConflicts;

  if (ipAnalysis && mode === 'ip-rebuild') {
    // 🆕 根据 IP 来源生成合适的世界名
    const sourceTitle = input.sourceTitle || '';
    if (sourceTitle.includes('西游记')) {
      worldName = '灵域天界';
      era = '神话新纪元';
    } else if (sourceTitle.includes('山海经')) {
      worldName = '山海秘境';
      era = '远古洪荒';
    } else if (sourceTitle.includes('封神')) {
      worldName = '封神新域';
      era = '仙魔乱世';
    } else {
      worldName = `${ipAnalysis.worldviewRebuild?.recommendedGenre || '新'}世界`;
      era = ipAnalysis.worldviewRebuild?.recommendedGenre || '架空时代';
    }
  } else if (src.includes('科幻') || src.includes('机甲') || src.includes('太空')) {
    worldName = '赛博纪元'; era = '近未来';
    powerSystem = '科技与灵能的融合'; coreConflicts = ['人类与AI的边界', '旧秩序与新技术的碰撞'];
  } else if (src.includes('神话') || src.includes('西游') || src.includes('仙侠') || src.includes('大圣')) {
    worldName = '灵域大陆'; era = '神话纪元';
    powerSystem = '灵气修炼与法宝体系'; coreConflicts = ['神界与人间的秩序冲突', '正邪势力的永恒对抗'];
  } else if (src.includes('都市') || src.includes('现代') || src.includes('职场')) {
    worldName = '霓虹都市'; era = '当代';
    powerSystem = '社会资源与人脉网络'; coreConflicts = ['理想与现实的碰撞', '个人价值与社会期待的冲突'];
  } else {
    worldName = '幻境大陆'; era = '架空时代';
    powerSystem = '元素之力与意志'; coreConflicts = ['秩序与混沌的永恒斗争'];
  }

  return {
    worldName,
    worldTagline: theme || '一个充满可能性的世界',
    era,
    geography: ipAnalysis?.worldviewRebuild?.visualDirection || '多层次空间结构，从繁华都市到荒野秘境',
    socialStructure: mode === 'ip-rebuild' ? '保留原作社会层级，融入新秩序' : '金字塔式权力结构，暗藏反抗力量',
    powerSystem,
    coreConflicts,
    atmosphereKeywords: styleHint.split(',').map(s => s.trim()),
    visualMotifs: ['光与影的对立统一', '宏大与细腻的并置', '动态与静止的节奏交替'],
    referenceImages: [`${worldName}全景概念图`, '核心场景氛围图', '角色群体剪影'],
    loreEntries: [
      { title: '世界起源', content: `${worldName}的诞生源于${era}的一场巨变...`, importance: 3 },
      { title: '力量规则', content: powerSystem, importance: 2 }
    ]
  };
}

module.exports = { run };
