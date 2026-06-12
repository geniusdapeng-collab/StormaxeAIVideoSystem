#!/usr/bin/env node
/**
 * IP Deconstructor v3.6-Peng
 * L1 概念层 — IP解析重构引擎
 * 
 * 五步解析法：摄入 → 解剖 → 萃取 → 重建 → 验证
 */

const fs = require('fs');

const IP_DATABASE = {
  '西游记': {
    structurePattern: '英雄之旅 + 团队成长',
    rhythmTemplate: '冒险 → 危机 → 突破 → 新冒险',
    suspensionMechanism: '妖怪的威胁 + 取经的时限',
    pacingSignature: '快节奏战斗 + 慢节奏悟道',
    relationshipTopology: '唐僧-悟空（师徒/矛盾），悟空-八戒（兄弟/竞争），团队-外部（对抗）',
    archetypeMapping: { '孙悟空': '叛逆英雄', '唐僧': '理想主义者', '猪八戒': '欲望化身', '沙僧': '忠诚追随者' },
    conflictMatrix: ['自由 vs 约束', '欲望 vs 修行', '个体 vs 团队'],
    characterArchetypes: ['英雄', '导师', '变形者', '守门人'],
    coreDNA: '反抗权威的个体在规则中寻找自由',
    irreducibleElements: ['紧箍咒', '七十二变', '取经使命', '妖魔鬼怪'],
    emotionalSignature: '从叛逆到担当的成长阵痛',
    culturalResonance: '中国人对自由的永恒渴望',
    philosophicalAnchor: '佛学因果 + 道家自然',
    recommendedGenre: '神话科幻',
    visualDirection: '东方神话 + 未来科技融合',
    newSettingSuggestion: '天庭→AI公司，取经→数据收集任务',
    adaptationNotes: '紧箍咒可转化为情感抑制程序',
    elementsToKeep: ['角色功能定位', '成长弧光', '团队动态'],
    elementsToTransform: ['取经→现代任务', '妖怪→系统障碍'],
    elementsToDiscard: ['佛教色彩过重'],
    original: { setting: '古代神话世界', tone: '荒诞+哲理', protagonist: '叛逆石猴' },
    rebuild: { setting: '赛博朋克未来', tone: '科幻+东方', protagonist: '觉醒AI' }
  }
};

function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  
  const ipAnalysis = deconstructIP(input);
  
  const output = {
    version: '3.5-Peng',
    filler: 'ip-deconstructor',
    output: ipAnalysis
  };
  
  fs.writeFileSync(args.output, JSON.stringify(output, null, 2));
  console.log(`✅ IP Deconstructor: ${ipAnalysis.spiritualCore.coreDNA}`);
}

function deconstructIP(input) {
  const source = input.source || '未知作品';
  const depth = input.extractDepth || 'medium';
  
  // 查找数据库
  const dbEntry = IP_DATABASE[source];
  
  if (!dbEntry) {
    // 通用解析（简化版）
    return generateGenericAnalysis(source, input);
  }
  
  // 应用保留比例
  const retention = input.retentionRatio || 0.4;
  
  return {
    sourceAnalysis: {
      structurePattern: dbEntry.structurePattern,
      rhythmTemplate: dbEntry.rhythmTemplate,
      suspensionMechanism: dbEntry.suspensionMechanism,
      pacingSignature: dbEntry.pacingSignature
    },
    characterMatrix: {
      relationshipTopology: dbEntry.relationshipTopology,
      archetypeMapping: dbEntry.archetypeMapping,
      conflictMatrix: dbEntry.conflictMatrix,
      characterArchetypes: dbEntry.characterArchetypes
    },
    spiritualCore: {
      coreDNA: dbEntry.coreDNA,
      irreducibleElements: dbEntry.irreducibleElements.slice(0, Math.ceil(dbEntry.irreducibleElements.length * retention)),
      emotionalSignature: dbEntry.emotionalSignature,
      culturalResonance: dbEntry.culturalResonance,
      philosophicalAnchor: dbEntry.philosophicalAnchor
    },
    worldviewRebuild: {
      recommendedGenre: dbEntry.recommendedGenre,
      visualDirection: dbEntry.visualDirection,
      newSettingSuggestion: dbEntry.newSettingSuggestion,
      adaptationNotes: dbEntry.adaptationNotes
    },
    retentionPlan: {
      elementsToKeep: dbEntry.elementsToKeep,
      elementsToTransform: dbEntry.elementsToTransform,
      elementsToDiscard: dbEntry.elementsToDiscard
    },
    riskWarnings: ['避免简单复制', '保持精神内核'],
    comparisonMatrix: {
      original: dbEntry.original,
      rebuild: dbEntry.rebuild
    },
    metadata: {
      source,
      depth,
      retention,
      generatedAt: new Date().toISOString()
    }
  };
}

function generateGenericAnalysis(source, input) {
  return {
    sourceAnalysis: {
      structurePattern: '未知，需要深入分析',
      rhythmTemplate: '待解析',
      suspensionMechanism: '待解析',
      pacingSignature: '待解析'
    },
    spiritualCore: {
      coreDNA: `${source}的精神内核待提取`,
      irreducibleElements: ['待分析'],
      emotionalSignature: '待解析',
      culturalResonance: '待解析',
      philosophicalAnchor: '待解析'
    },
    retentionPlan: {
      elementsToKeep: ['核心角色功能', '情感曲线'],
      elementsToTransform: ['时代背景', '具体事件'],
      elementsToDiscard: ['过时的文化元素']
    },
    metadata: {
      source,
      note: '该作品不在预置数据库中，需要手动分析或提供详细内容',
      generatedAt: new Date().toISOString()
    }
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input') args.input = argv[++i];
    if (argv[i] === '--output') args.output = argv[++i];
  }
  return args;
}

main();