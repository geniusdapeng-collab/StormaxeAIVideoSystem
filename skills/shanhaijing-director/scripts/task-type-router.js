#!/usr/bin/env node
/**
 * ShanhaiStory Forge v2.25-Peng | Task Type Router v1.1-Peng
 * 大视频系统统一版本号：v2.25-Peng（山海经系列 + 通用视频系列）
 * 
 * 🆕 v1.1-Peng 更新（2026-05-29，大系统 v2.25-Peng）：
 * + 所有任务类型统一 Seedance 原生音频（科普/广告 enableTTS→false）
 * + 新增 audioRenderMode: 'seedance-native' 标识
 * + 新增 dialogueBlock: true 开关
 * 
 * 🆕 v1.0-Peng 更新（大系统 v2.0-Peng）：
 * + 🆕 顶层任务类型路由器 — 集中所有链路路由逻辑
 * + 🆕 5种预设任务类型：shanhaijing/fpv/education/advertisement/character
 * + 🆕 自动链路配置：一键选择任务类型，系统自动配置全部参数
 * + 🆕 用户自定义覆盖：预设基础上可手动覆盖任何参数
 * + 🆕 智能推荐：根据用户输入内容自动推荐最佳任务类型
 * 
 * 设计理念：
 * - 用户只需声明"我要做一个山海经视频"，系统自动配置：
 *   → Nirath超写实风格（双恒星/生物发光/46亿年原始地球）
 *   → 异兽模式（自动检测+双铁律）
 *   → 一镜到底（强制约束+FPV匹配）
 *   → 角色链路（全局定妆照+小G锚点）
 *   → 渲染参数（Seedance 2.0 + 合规声明）
 *   → 核心铁律：禁水墨/禁卡通/禁科幻霓虹
 */

const path = require('path');
const fs = require('fs');

// ========== 任务类型定义 ==========
const TASK_TYPES = {
  /**
   * 山海经神话系列
   * 适用：山海经异兽、神话故事、Nirath生态冒险
   */
  shanhaijing: {
    name: '山海经神话系列（Nirath生态）',
    description: '山海经异兽故事 + Nirath超写实原生星球生态（非水墨/非卡通）',
    icon: '🐉',
    
    // 风格配置 — Nirath超写实生态，禁用水墨/卡通
    styleProfile: 'superreal',            // CG超写实数字人风格
    worldview: 'nirath',                // Nirath原生星球（双恒星/生物发光/46亿年原始地球）
    
    // 视觉约束 — 核心铁律
    visualConstraints: {
      allowed: ['CG超写实', '生物发光', '双恒星光照', 'Nirath生态'],
      forbidden: ['水墨', 'ink-wash', '卡通', 'cartoon', 'anime', 'Disney', 'Pixar', '科幻霓虹', 'cyberpunk']
    },
    
    // 角色链路
    characterMode: 'auto',              // 自动检测（人类/异兽）
    enableGlobalRefs: true,             // 启用全局定妆照
    enableBeastMode: true,              // 启用异兽专用模式
    beastNegativeConstraints: true,     // 启用15项负面约束
    
    // 一镜到底
    enableOneshot: true,                // 启用一镜到底
    oneshotMandatory: true,             // 强制要求
    fpvExperienceMatch: true,           // FPV经验包匹配
    
    // 渲染配置
    renderEngine: 'seedance-2.0',       // Seedance 2.0
    complianceMode: 'cg-digital-human', // CG数字人合规模式
    enableTTS: false,                   // 不启用TTS台词
    enableSubtitles: false,             // 不启用字幕
    
    // 后期制作
    postProduction: 'standard',         // 标准后期（拼接+调色）
    enableVoiceOver: false,             // 无解说
    
    // 输出格式
    aspectRatio: '16:9',                // 横屏
    resolution: '1080p',                // 1080p
    durationTarget: '60s',              // 目标60秒
    
    // 质量检查
    qualityChecks: [
      'character-consistency',           // 角色一致性
      'oneshot-presence',                // 一镜到底存在性
      'beast-purity',                    // 异兽纯粹度
      'nirath-visual-coherence',         // Nirath视觉连贯性（双恒星/生物发光/生态一致性）
      'nirath-ecosystem-consistency'       // Nirath生态一致性（黑曜石/超导晶体/生物组织材质区分）
    ]
  },

  /**
   * FPV超写实电影感系列
   * 适用：极限运动、灾难风暴、科幻穿越、微观巨物、荒诞喜剧
   */
  fpv: {
    name: 'FPV超写实电影感系列',
    description: 'FPV第一人称视角+超写实CG+电影级运镜技法',
    icon: '🎬',
    
    // 风格配置
    styleProfile: 'superreal',          // 纯超写实CG
    worldview: 'nirath',              // Nirath原生星球（真实感强）
    
    // 角色链路
    characterMode: 'human',             // 默认人类角色
    enableGlobalRefs: true,             // 启用全局定妆照
    enableBeastMode: false,             // 不启用异兽模式
    beastNegativeConstraints: false,    // 不禁用科技元素
    
    // 一镜到底（FPV核心）
    enableOneshot: true,                // 启用一镜到底
    oneshotMandatory: true,             // 强制要求
    fpvExperienceMatch: true,           // FPV经验包匹配（重点）
    fpvPriority: 'high',                // FPV优先级高
    
    // 渲染配置
    renderEngine: 'seedance-2.0',
    complianceMode: 'cg-digital-human',
    enableTTS: false,
    enableSubtitles: false,
    
    // 后期制作
    postProduction: 'cinematic',        // 电影级后期
    enableVoiceOver: false,
    
    // 输出格式
    aspectRatio: '16:9',
    resolution: '1080p',
    durationTarget: '60s',
    
    // 质量检查
    qualityChecks: [
      'oneshot-presence',                // 一镜到底存在性（核心）
      'fpv-technique-quality',           // FPV技法质量
      'camera-movement-fluidity',          // 运镜流畅度
      'pacing-rhythm',                    // 节奏感
      'visual-impact'                     // 视觉冲击力
    ]
  },

  /**
   * 科普教育系列
   * 适用：健康知识、科学原理、历史人文、生活常识
   */
  education: {
    name: '科普教育系列',
    description: '超写实CG+详细字幕+TTS解说+知识点可视化',
    icon: '📚',
    
    // 风格配置
    styleProfile: 'superreal',          // 纯超写实CG
    worldview: 'superreal',             // 超写实世界观
    
    // 角色链路
    characterMode: 'human',             // 人类角色（护士Chen/讲解员）
    enableGlobalRefs: true,             // 启用全局定妆照
    enableBeastMode: false,             // 不启用异兽模式
    beastNegativeConstraints: false,
    
    // 一镜到底
    enableOneshot: false,               // 不强制一镜到底
    oneshotMandatory: false,            // 非强制
    fpvExperienceMatch: false,          // 不匹配FPV
    
    // 渲染配置
    renderEngine: 'seedance-2.0',
    complianceMode: 'cg-digital-human',
    enableTTS: false,                    // ❌ 禁用TTS，全部走Seedance原生音频
    enableSubtitles: true,              // ✅ 启用详细字幕
    subtitleStyle: 'education',         // 教育风格字幕
    
    // 音频策略：Seedance原生渲染（2026-05-29 v3.0-Peng）
    audioRenderMode: 'seedance-native', // 所有台词/台词由Seedance生成
    dialogueBlock: true,          // 启用独立角色台词字段模块
    
    // 输出格式
    aspectRatio: '16:9',
    resolution: '1080p',
    durationTarget: '59s',              // 59秒（短视频平台优化）
    
    // 质量检查
    qualityChecks: [
      'subtitle-accuracy',               // 字幕准确性
      'tts-clarity',                     // TTS清晰度
      'knowledge-density',               // 知识密度
      'visual-clarity',                  // 画面清晰度
      'pacing-education'                 // 教学节奏
    ]
  },

  /**
   * 产品广告系列
   * 适用：产品展示、品牌宣传、功能演示、电商带货
   */
  advertisement: {
    name: '产品广告系列',
    description: '品牌元素锁定+产品特写+高光材质+购买引导',
    icon: '📢',
    
    // 风格配置
    styleProfile: 'superreal',          // 纯超写实CG
    worldview: 'superreal',
    
    // 角色链路
    characterMode: 'human',             // 人类角色
    enableGlobalRefs: true,
    enableBeastMode: false,
    beastNegativeConstraints: false,
    
    // 一镜到底
    enableOneshot: true,                // 启用一镜到底（增强冲击力）
    oneshotMandatory: false,            // 非强制
    fpvExperienceMatch: true,           // 适度匹配FPV
    fpvPriority: 'medium',
    
    // 渲染配置
    renderEngine: 'seedance-2.0',
    complianceMode: 'cg-digital-human',
    enableTTS: false,                    // ❌ 禁用TTS，全部走Seedance原生音频
    enableSubtitles: true,              // 启用字幕（产品卖点）
    subtitleStyle: 'advertisement',
    
    // 音频策略：Seedance原生渲染（2026-05-29 v3.0-Peng）
    audioRenderMode: 'seedance-native', // 所有台词/台词由Seedance生成
    dialogueBlock: true,          // 启用独立角色台词字段模块
    
    // 品牌锁定
    brandLock: true,                    // 品牌元素锁定
    productHighlight: true,             // 产品高亮
    logoOverlay: true,                 // Logo叠加
    
    // 后期制作
    postProduction: 'advertisement',    // 广告专用后期
    enableVoiceOver: true,
    voiceOverScript: 'brand-slogan',    // 品牌口号
    
    // 输出格式
    aspectRatio: '9:16',                // 竖屏（短视频平台）
    resolution: '1080p',
    durationTarget: '30s',              // 30秒（广告黄金时长）
    
    // 质量检查
    qualityChecks: [
      'brand-presence',                  // 品牌露出
      'product-clarity',                 // 产品清晰度
      'call-to-action',                  // 行动号召
      'visual-appeal',                   // 视觉吸引力
      'conversion-optimization'          // 转化优化
    ]
  },

  /**
   * 角色定妆照系列
   * 适用：新角色创建、多角度定妆照、角色一致性保障
   */
  character: {
    name: '角色定妆照系列',
    description: '多角度一致性定妆照+角色档案+全局入库',
    icon: '👤',
    
    // 风格配置
    styleProfile: 'superreal',
    worldview: 'superreal',
    
    // 角色链路
    characterMode: 'auto',              // 自动检测
    enableGlobalRefs: true,
    enableBeastMode: true,              // 支持异兽定妆照
    beastNegativeConstraints: true,
    
    // 一镜到底
    enableOneshot: false,
    oneshotMandatory: false,
    fpvExperienceMatch: false,
    
    // 渲染配置（定妆照用图片生成）
    renderEngine: 'seedream-5.0',       // Seedream图片生成
    outputFormat: 'image',              // 图片输出
    imageCount: 8,                     // 8张多角度
    imageAngles: [
      'front-fullbody',                  // 正面全身
      'side-fullbody',                   // 侧面全身
      'back-fullbody',                   // 背面全身
      'three-quarter-bust',             // 45度半身
      'face-closeup',                   // 面部特写
      'action-running',                 // 动作奔跑
      'action-sitting',                 // 动作坐姿
      'limb-detail'                     // 肢体特写
    ],
    
    // 不启用视频相关功能
    enableTTS: false,
    enableSubtitles: false,
    postProduction: 'none',
    
    // 输出格式
    aspectRatio: '1:1',                 // 方形（定妆照）
    resolution: '2048x2048',            // 2K
    
    // 质量检查
    qualityChecks: [
      'character-consistency',           // 角色一致性
      'angle-coverage',                  // 角度覆盖度
      'detail-clarity',                  // 细节清晰度
      'style-uniformity'                 // 风格统一性
    ]
  }
};

// ========== 任务类型检测器 ==========
/**
 * 根据用户输入自动推荐最佳任务类型
 * @param {string} userInput - 用户自然语言描述
 * @returns {string} 推荐的任务类型key
 */
function detectTaskType(userInput) {
  const input = userInput.toLowerCase();
  
  // 山海经关键词（通用，不含具体角色名）
  const shanhaijingKeywords = [
    '山海经', '异兽', '神话', '神兽', '志怪', '洪荒', '大荒',
    'shanh', 'myth', 'beast', 'dragon', 'phoenix', 'fox', 'creature', 'legendary'
  ];
  
  // FPV关键词
  const fpvKeywords = [
    'fpv', '一镜到底', '电影感', '极限运动', '滑雪', '飞行', '冲浪', '潜水',
    '灾难', '风暴', '海啸', '科幻', '太空', '穿越', '微观', '巨物',
    'cinematic', 'oneshot', 'extreme', 'sport', 'film', 'movie'
  ];
  
  // 科普关键词
  const educationKeywords = [
    '科普', '教育', '知识', '健康', '医学', '科学', '历史', '人文',
    '讲解', '教学', '教程', '护士', '医生', '横纹肌', '疾病',
    'education', 'science', 'health', 'medical', 'knowledge'
  ];
  
  // 广告关键词
  const adKeywords = [
    '广告', '宣传', '产品', '品牌', '带货', '电商', '推广', '营销',
    '卖', '买', '优惠', '折扣', '新品', '上市',
    'advertisement', 'ad', 'product', 'brand', 'marketing'
  ];
  
  // 定妆照关键词
  const characterKeywords = [
    '定妆照', '角色', '人设', '形象', '照片', '定妆', 'reference',
    'character', 'portrait', 'avatar', 'profile'
  ];
  
  // 计分
  const scores = {
    shanhaijing: 0,
    fpv: 0,
    education: 0,
    advertisement: 0,
    character: 0
  };
  
  for (const kw of shanhaijingKeywords) if (input.includes(kw)) scores.shanhaijing += 1;
  for (const kw of fpvKeywords) if (input.includes(kw)) scores.fpv += 1;
  for (const kw of educationKeywords) if (input.includes(kw)) scores.education += 1;
  for (const kw of adKeywords) if (input.includes(kw)) scores.advertisement += 1;
  for (const kw of characterKeywords) if (input.includes(kw)) scores.character += 1;
  
  // 找到最高分
  let bestType = 'shanhaijing'; // 默认山海经
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  
  return bestType;
}

// ========== 路由器核心 ==========
/**
 * 任务类型路由器 — 根据任务类型自动配置完整链路
 * @param {string} taskType - 任务类型（shanhaijing/fpv/education/advertisement/character）
 * @param {Object} userOverrides - 用户自定义覆盖参数（可选）
 * @returns {Object} 完整链路配置
 */
function routeTaskType(taskType, userOverrides = {}) {
  // 获取预设配置
  const preset = TASK_TYPES[taskType];
  if (!preset) {
    throw new Error(`未知任务类型: ${taskType}。可选: ${Object.keys(TASK_TYPES).join(', ')}`);
  }
  
  // 合并用户覆盖
  const config = {
    ...preset,
    taskType,
    routed: true,
    routedAt: new Date().toISOString(),
    
    // 允许用户覆盖任何参数
    ...userOverrides,
    
    // 保留原始预设（用于调试）
    _preset: preset
  };
  
  return config;
}

/**
 * 智能路由 — 自动检测任务类型并配置链路
 * @param {string} userInput - 用户自然语言描述
 * @param {Object} userOverrides - 用户自定义覆盖参数
 * @returns {Object} 完整链路配置
 */
function autoRoute(userInput, userOverrides = {}) {
  const detectedType = detectTaskType(userInput);
  const config = routeTaskType(detectedType, userOverrides);
  
  config.autoDetected = true;
  config.autoDetectedFrom = userInput;
  
  return config;
}

// ========== 与导演管线集成 ==========
/**
 * 将路由配置应用到导演管线的storyPlan
 * @param {Object} storyPlan - 原始storyPlan
 * @param {Object} routeConfig - 路由配置
 * @returns {Object} 增强后的storyPlan
 */
function applyRouteToStoryPlan(storyPlan, routeConfig) {
  return {
    ...storyPlan,
    
    // 任务类型
    taskType: routeConfig.taskType,
    
    // 风格档案
    styleProfile: routeConfig.styleProfile,
    worldview: routeConfig.worldview,
    
    // 角色配置
    characterMode: routeConfig.characterMode,
    enableGlobalRefs: routeConfig.enableGlobalRefs,
    enableBeastMode: routeConfig.enableBeastMode,
    beastNegativeConstraints: routeConfig.beastNegativeConstraints,
    
    // 一镜到底配置
    autoInjectOneshot: routeConfig.enableOneshot,
    oneshotMandatory: routeConfig.oneshotMandatory,
    fpvExperienceMatch: routeConfig.fpvExperienceMatch,
    fpvPriority: routeConfig.fpvPriority || 'medium',
    
    // 渲染配置
    renderEngine: routeConfig.renderEngine,
    complianceMode: routeConfig.complianceMode,
    
    // TTS/字幕
    enableTTS: routeConfig.enableTTS,
    enableSubtitles: routeConfig.enableSubtitles,
    subtitleStyle: routeConfig.subtitleStyle,
    
    // 后期制作
    postProduction: routeConfig.postProduction,
    enableVoiceOver: routeConfig.enableVoiceOver,
    voiceOverScript: routeConfig.voiceOverScript,
    
    // 输出格式
    aspectRatio: routeConfig.aspectRatio,
    resolution: routeConfig.resolution,
    durationTarget: routeConfig.durationTarget,
    
    // 品牌（广告专用）
    brandLock: routeConfig.brandLock,
    productHighlight: routeConfig.productHighlight,
    logoOverlay: routeConfig.logoOverlay,
    
    // 质量检查
    qualityChecks: routeConfig.qualityChecks,
    
    // 路由元数据
    _routeConfig: routeConfig
  };
}

// ========== 路由报告 ==========
/**
 * 生成路由决策报告（人类可读）
 * @param {Object} config - 路由配置
 * @returns {string} 报告文本
 */
function generateRouteReport(config) {
  const lines = [];
  lines.push(`\n🎯 任务类型路由报告 — ShanhaiStory Forge v2.0-Peng`);
  lines.push(`=` .repeat(50));
  lines.push(`📋 任务类型: ${config.name} ${config.icon}`);
  lines.push(`📝 类型描述: ${config.description}`);
  lines.push(`🕐 路由时间: ${config.routedAt}`);
  if (config.autoDetected) {
    lines.push(`🔍 检测来源: "${config.autoDetectedFrom}"`);
  }
  lines.push(`—` .repeat(50));
  
  lines.push(`🎨 风格配置:`);
  lines.push(`  • 风格档案: ${config.styleProfile}`);
  lines.push(`  • 世界观: ${config.worldview}`);
  lines.push(`—` .repeat(50));
  
  lines.push(`👤 角色链路:`);
  lines.push(`  • 角色模式: ${config.characterMode}`);
  lines.push(`  • 全局定妆照: ${config.enableGlobalRefs ? '✅ 启用' : '❌ 禁用'}`);
  lines.push(`  • 异兽模式: ${config.enableBeastMode ? '✅ 启用' : '❌ 禁用'}`);
  if (config.enableBeastMode) {
    lines.push(`  • 异兽负面约束: ${config.beastNegativeConstraints ? '✅ 15项' : '❌ 无'}`);
  }
  lines.push(`—` .repeat(50));
  
  lines.push(`🎬 一镜到底:`);
  lines.push(`  • 启用状态: ${config.enableOneshot ? '✅ 启用' : '❌ 禁用'}`);
  lines.push(`  • 强制要求: ${config.oneshotMandatory ? '🔒 强制' : '⚪ 非强制'}`);
  lines.push(`  • FPV匹配: ${config.fpvExperienceMatch ? '✅ 启用' : '❌ 禁用'}`);
  if (config.fpvPriority) {
    lines.push(`  • FPV优先级: ${config.fpvPriority}`);
  }
  lines.push(`—` .repeat(50));
  
  lines.push(`🎥 渲染配置:`);
  lines.push(`  • 渲染引擎: ${config.renderEngine}`);
  lines.push(`  • 合规模式: ${config.complianceMode}`);
  lines.push(`  • TTS台词: ${config.enableTTS ? '✅ 启用' : '❌ 禁用'}`);
  lines.push(`  • 字幕: ${config.enableSubtitles ? '✅ 启用' : '❌ 禁用'}`);
  lines.push(`—` .repeat(50));
  
  lines.push(`📐 输出格式:`);
  lines.push(`  • 画幅: ${config.aspectRatio}`);
  lines.push(`  • 分辨率: ${config.resolution}`);
  lines.push(`  • 目标时长: ${config.durationTarget}`);
  lines.push(`—` .repeat(50));
  
  lines.push(`✅ 质量检查项:`);
  for (const check of config.qualityChecks || []) {
    lines.push(`  • ${check}`);
  }
  lines.push(`=` .repeat(50));
  
  return lines.join('\n');
}

// ========== 导出 ==========
module.exports = {
  TASK_TYPES,
  detectTaskType,
  routeTaskType,
  autoRoute,
  applyRouteToStoryPlan,
  generateRouteReport
};

// CLI测试
if (require.main === module) {
  const testInput = process.argv[2] || '帮我做一个山海经烛龙觉醒的视频';
  
  console.log('\n🔍 测试自动检测...');
  console.log(`输入: "${testInput}"`);
  
  const detected = detectTaskType(testInput);
  console.log(`检测类型: ${detected}`);
  
  const config = routeTaskType(detected);
  console.log(generateRouteReport(config));
}