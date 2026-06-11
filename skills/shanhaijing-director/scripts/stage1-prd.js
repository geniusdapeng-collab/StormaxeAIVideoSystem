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
      const titleMatch = existing.match(/^#\s+.*?[-–]\s*(.+)/m);
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
      `生成产品需求文档,主题: ${userQuery}\n世界观: ${worldview}\n风格: ${directorStyle}\n要求:山海经异兽题材:${isShanhaijingMode ? '是' : '否'}`,
      { role: 'product-manager', temperature: 0.7, timeout: 30000 }
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
