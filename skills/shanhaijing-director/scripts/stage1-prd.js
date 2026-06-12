/**
 * stage1-prd.js
 * Stage 1 PRD生成 - 从 director-pipeline.js 抽取
 * 调用: await stage1_PRDGeneration(pipeline, userInput)
 */
const path = require('path');
const { writeTextSafe, ensureDir } = require('./pipeline-helpers');

async function stage1_PRDGeneration(pipeline, userInput) {
  pipeline.currentStage = 'prd-generation';
  console.log(`\n📋 阶段1/12: PRD生成 (LLM智能PRD生成 v6.3-Peng)`);

  const prdPath = path.join(pipeline.productionDir, '00-prd', 'prd.md');
  const prdDir = path.join(pipeline.productionDir, '00-prd');
  ensureDir(prdDir);

  // 检查外部PRD有效性（不只是文件存在，还要内容有效）
  const fs = require('fs');
  if (fs.existsSync(prdPath)) {
    const existing = fs.readFileSync(prdPath, 'utf8');
    if (existing && existing.trim().length > 100) {
      // 🆕 fix-v6.25: 深度校验PRD质量，不接受"未命名"或问候语填充的伪PRD
      // 🔧 v6.35-Peng-fix: 修复PRD标题提取正则
      //   原正则为 /^#\s+.*?[-–]\s*(.+)/m 在"# 白泽 - 产品需求文档"上匹配到"产品需求文档"而非"白泽"
      let titleMatch = existing.match(/^#\s*(\S+)\s*[-–—]\s*产品需求文档/m);
      if (!titleMatch) titleMatch = existing.match(/^#\s+.*?[-–]\s*(.+)/m);
      const title = titleMatch ? titleMatch[1].trim() : '';
      const isFakePRD = /^#\s*[^#]*?(?:未命名|untitled|请告诉我|task|您好)/i.test(existing)
        || (existing.includes('请告诉我') && existing.includes('上下文'))
        || existing.trim().length < 500; // 低于500字符很可能是伪PRD
      if (!isFakePRD && title && title !== '未命名' && title !== 'Untitled') {
        pipeline._log({ message: `检测到有效PRD: ${title}，跳过生成`, emoji: '✅' });
        pipeline.results.prd = existing;
        pipeline._inject({ prdPath });
        return;
      } else {
        pipeline._log({ message: `发现无效PRD（"${title || '未命名'}"），将重新生成`, emoji: '⚠️' });
      }
    }
  }

  // 🔧 v6.35-Peng-fix: 强化PRD生成prompt，防止LLM返回通用回复
  const userQuery = typeof userInput === 'string' ? userInput
    : (userInput && (userInput.userQuery || userInput.title || JSON.stringify(userInput))) || '';

  const isShanhaijingMode = /山海经|异兽|神话|洪荒/.test(userQuery);
  const worldview = pipeline.worldview || '山海贼叙事';
  const directorStyle = pipeline.directorStyle || 'cinematic';

  // 智能PRD生成（fallback本地生成）
  let prdContent;
  try {
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llm = new LLMReasoningLayer();
    const result = await llm.llmReason(
      `你是一个视频产品经理。请为以下视频项目生成一份产品需求文档(PRD)，使用以下Markdown模板：

# {标题} - 产品需求文档

## 1. 需求概述
- **标题**: {标题}
- **目标时长**: {时长}秒
- **风格**: {风格}
- **世界观**: {世界观}

## 2. 故事大纲
{五幕故事大纲，每幕2-3句话}

## 3. 角色定义
- **{角色名}**: {物种}，{外貌特征}，{性格}

## 4. 需求契约
- 角色: {角色列表}
- 关键场景: {场景描述}
- 核心动作: {动作描述}
- 情绪基调: {情绪}

## 5. 验收标准
- [ ] 所有角色在最终视频中可见
- [ ] 核心动作完整呈现
- [ ] 时长误差 ≤ 5%

项目信息：
- 标题: ${userInput.title || userQuery}
- 故事大纲: ${userInput.outline || '山海经异兽白泽在Nirath星球被探险者小G发现的故事'}
- 时长: ${userInput.duration || 60}秒
- 世界观: ${worldview}
- 风格: ${directorStyle}
- 角色: ${(userInput.characters || []).map(c => c.name).join(', ') || '白泽(智慧神兽)、小G(8岁探险者)'}

请严格按照上述Markdown模板格式输出，不要添加问候语或额外说明。`,
      { role: 'product-manager', temperature: 0.7, timeout: 60000 }
    );
    prdContent = result?.result || null;
  } catch (e) {
    prdContent = null;
  }

  if (!prdContent) {
    prdContent = pipeline._generateFallbackPRD
      ? pipeline._generateFallbackPRD(userQuery, isShanhaijingMode)
      : `[PRD]\n标题: ${userQuery}\n世界观: ${worldview}\n类型: ${isShanhaijingMode ? '山海经异兽' : '标准叙事'}\n`;
  }

  // 截断
  if (prdContent.length > 3000 && pipeline._trimPRDToLimit) {
    prdContent = pipeline._trimPRDToLimit(prdContent, 3000);
  }

  writeTextSafe(prdPath, prdContent);
  pipeline._inject({ prd: prdContent, prdPath });
  // 🆕 v6.11-Peng-fix: 存储实际PRD内容字符串
  pipeline.results.prd = prdContent;

  console.log(`  ✅ PRD已保存: ${prdPath}`);
}

module.exports = { stage1_PRDGeneration };
