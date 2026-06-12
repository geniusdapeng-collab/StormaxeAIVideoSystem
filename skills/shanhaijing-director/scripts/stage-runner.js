#!/usr/bin/env node
/**
 * 分Stage运行器 - StageRunner v1.0-Peng
 * 
 * 解决SIGKILL问题：不再一次性跑12个Stage，改为逐个Stage运行
 * 每完成一个Stage，汇报进度，然后继续下一个Stage
 * 
 * 用法：node stage-runner.js <productionDir> [startStage] [endStage]
 * 示例：node stage-runner.js ./productions/xingtian 1 3
 * 
 * 适用：LLM重度调用场景（导演审片/编剧优化需要长时间推理）
 */

const path = require('path');
const fs = require('fs');

const STAGE_LIST = [
  { num: 1, name: 'Stage 1: PRD生成', method: 'stage1_PRDGeneration', batch: 1 },
  { num: 2, name: 'Stage 2: 需求对齐', method: 'stage2_RequirementAlignment', batch: 1 },
  { num: 3, name: 'Stage 3: Schema校验', method: 'stage3_SchemaValidation', batch: 1 },
  { num: 4, name: 'Stage 4: 故事板审片', method: 'stage4_StoryboardCheck', batch: 2 },
  { num: 5, name: 'Stage 5: 角色定妆', method: 'stage5_CharacterPromptBuild', batch: 2 },
  { num: 6, name: 'Stage 6: 合规检查', method: 'stage6_ComplianceCheck', batch: 2 },
  { num: 7, name: 'Stage 7: 时长分配', method: 'stage7_DurationAllocation', batch: 3 },
  { num: 8, name: 'Stage 8: 运镜控制', method: 'stage8_CinematographyControl', batch: 3 },
  { num: 9, name: 'Stage 9: 导演优化', method: 'stage9_DirectorOptimize', batch: 3 },
  { num: 10, name: 'Stage 10: 编剧优化', method: 'stage10_ScriptwriterOptimize', batch: 4 },
  { num: 11, name: 'Stage 11: 质检/预生产审核', method: 'stage11_QualityCheck', batch: 4 },
  { num: 12, name: 'Stage 12: 渲染', method: 'stage12_Render', batch: 4 },
  { num: 13, name: 'Stage 13: 后期制作', method: 'stage12_PostProduction', batch: 4 }
];

  // 🆕 v3.0-Peng: 自动重试机制
async function runStageWithRetry(pipeline, stage, checkpoint, checkpointPath, maxRetries = 1) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    
    try {
      if (attempt > 0) {
        console.log(`\n[StageRunner] 🔄 重试 ${stage.name} (${attempt}/${maxRetries})...`);
      }
      
      // 执行Stage
      if (stage.num === 1) {
        await pipeline[stage.method](null);
      } else {
        await pipeline[stage.method]();
      }
      
      const duration = Date.now() - startTime;
      
      // 记录成功
      checkpoint.completedStages.push(stage.method);
      checkpoint.lastStage = stage.method;
      checkpoint.batchProgress[stage.batch] = stage.num;
      checkpoint.stageStats = checkpoint.stageStats || {};
      checkpoint.stageStats[stage.method] = {
        status: 'success',
        duration,
        attempts: attempt + 1,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
      
      console.log(`[StageRunner] ✅ ${stage.name} 完成${attempt > 0 ? ' (重试成功)' : ''} | 耗时${duration}ms`);
      return { success: true, duration, attempts: attempt + 1 };
      
    } catch (error) {
      lastError = error;
      const duration = Date.now() - startTime;
      
      // 记录失败
      checkpoint.stageStats = checkpoint.stageStats || {};
      checkpoint.stageStats[stage.method] = {
        status: 'failed',
        duration,
        attempts: attempt + 1,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
      
      console.error(`[StageRunner] ❌ ${stage.name} 失败 (尝试${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`[StageRunner] ⏳ 等待3秒后自动重试...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  // 所有重试都失败
  return { success: false, error: lastError, attempts: maxRetries + 1 };
}

  // 🆕 v3.0-Peng: 计算链路健康度评分（0-100分）
  function calculateLinkHealth(stats) {
    const { successCount, failCount, totalStages, retryCount, totalDuration, stageDetails } = stats;
    
    // 1. 成功率得分 (50%权重)
    const successRate = successCount / totalStages;
    const successScore = successRate * 50;
    
    // 2. 平均耗时得分 (20%权重) - 理想平均耗时 < 60秒/Stage
    const avgDuration = totalDuration / (successCount || 1);
    const avgDurationSec = avgDuration / 1000;
    const durationScore = Math.max(0, 20 - (avgDurationSec / 60) * 20);
    
    // 3. 重试次数得分 (20%权重) - 无重试得满分，每次重试扣5分
    const retryScore = Math.max(0, 20 - retryCount * 5);
    
    // 4. 质量达标得分 (10%权重) - 检查导演评分是否达标
    let qualityScore = 10;
    const directorStage = stageDetails.find(d => d.name.includes('导演'));
    if (directorStage && directorStage.score < 3.0) {
      qualityScore = 5; // 评分低于3.0扣一半
    }
    
    const totalScore = Math.round(successScore + durationScore + retryScore + qualityScore);
    
    return {
      total: totalScore,
      breakdown: {
        success: { raw: successRate, score: Math.round(successScore), weight: '50%' },
        duration: { raw: avgDurationSec, score: Math.round(durationScore), weight: '20%' },
        retry: { raw: retryCount, score: Math.round(retryScore), weight: '20%' },
        quality: { raw: directorStage?.score || 'N/A', score: qualityScore, weight: '10%' }
      }
    };
  }

async function runStageByStage(productionDir, startStage = 1, endStage = 12) {
  const pipelinePath = path.join(__dirname, 'director-pipeline.js');
  const { DirectorPipeline } = require(pipelinePath);
  
  const checkpointPath = path.join(productionDir, '.checkpoint-stage.json');
  let checkpoint = { completedStages: [], lastStage: null, startTime: Date.now(), batchProgress: {}, stageStats: {} };
  
  // 读取已有checkpoint
  if (fs.existsSync(checkpointPath)) {
    try {
      checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
      console.log(`[StageRunner] 从checkpoint恢复: ${checkpoint.completedStages.length} 个Stage已完成`);
    } catch (e) {
      console.warn(`[StageRunner] ⚠️ checkpoint解析失败，创建新的: ${e.message}`);
      checkpoint = { completedStages: [], lastStage: null, startTime: Date.now(), batchProgress: {}, stageStats: {} };
    }
  }
  
  const pipeline = new DirectorPipeline(productionDir, {
    preProduction: true,
    enableAutoTTS: false
  });
  
  // 获取需要运行的Stage范围
  const stagesToRun = STAGE_LIST.filter(s => s.num >= startStage && s.num <= endStage);
  
  // 🆕 v3.0-Peng: 链路监控统计
  const linkStats = {
    totalStages: stagesToRun.length,
    successCount: 0,
    failCount: 0,
    retryCount: 0,
    totalDuration: 0,
    stageDetails: []
  };
  
  for (const stage of stagesToRun) {
    // 检查是否已经完成
    if (checkpoint.completedStages.includes(stage.method)) {
      console.log(`[StageRunner] 跳过 ${stage.name} (已完成)`);
      linkStats.successCount++;
      continue;
    }
    
    console.log(`\n[StageRunner] ====== ${stage.name} (${stage.num}/${STAGE_LIST.length}) ======`);
    
    const stageStart = Date.now();
    const result = await runStageWithRetry(pipeline, stage, checkpoint, checkpointPath, 1); // 最多重试1次
    const stageDuration = Date.now() - stageStart;
    
    if (result.success) {
      linkStats.successCount++;
      linkStats.totalDuration += stageDuration;
      if (result.attempts > 1) linkStats.retryCount++;
      linkStats.stageDetails.push({
        name: stage.name,
        status: 'success',
        duration: stageDuration,
        attempts: result.attempts
      });
      
      // 🆕 v3.0-Peng: 每完成一个batch，输出进度汇报
      const batchStages = STAGE_LIST.filter(s => s.batch === stage.batch);
      const batchCompleted = batchStages.filter(s => checkpoint.completedStages.includes(s.method));
      if (batchCompleted.length === batchStages.length) {
        console.log(`\n[StageRunner] 🎉 Batch ${stage.batch} 完成: ${batchStages.map(s=>s.num).join('-')} | 进度: ${checkpoint.completedStages.length}/${STAGE_LIST.length}`);
      } else {
        console.log(`[StageRunner] 进度: ${checkpoint.completedStages.length}/${STAGE_LIST.length} Stage完成`);
      }
    } else {
      linkStats.failCount++;
      linkStats.stageDetails.push({
        name: stage.name,
        status: 'failed',
        duration: stageDuration,
        attempts: result.attempts,
        error: result.error?.message
      });
      break; // 失败后停止（后续Stage依赖此Stage）
    }
  }
  
  // 🆕 v3.0-Peng: 输出链路监控报告 + 健康度评分
  const elapsed = (Date.now() - checkpoint.startTime) / 1000;
  const successRate = (linkStats.successCount / linkStats.totalStages * 100).toFixed(1);
  
  // 计算健康度评分
  const health = calculateLinkHealth(linkStats);
  
  console.log(`\n========== 链路监控报告 ==========`);
  console.log(`总Stage: ${linkStats.totalStages} | 成功: ${linkStats.successCount} | 失败: ${linkStats.failCount}`);
  console.log(`成功率: ${successRate}% | 重试次数: ${linkStats.retryCount}`);
  console.log(`总耗时: ${elapsed.toFixed(0)}秒 | 平均Stage耗时: ${(linkStats.totalDuration / linkStats.successCount / 1000).toFixed(1)}秒`);
  console.log(`\n🩺 链路健康度评分: ${health.total}/100`);
  console.log(`  📊 得分构成:`);
  console.log(`     成功率: ${health.breakdown.success.score}/50 (实际${(health.breakdown.success.raw * 100).toFixed(1)}%)`);
  console.log(`     耗时: ${health.breakdown.duration.score}/20 (平均${health.breakdown.duration.raw.toFixed(1)}s/Stage)`);
  console.log(`     重试: ${health.breakdown.retry.score}/20 (重试${health.breakdown.retry.raw}次)`);
  console.log(`     质量: ${health.breakdown.quality.score}/10 (导演评分${health.breakdown.quality.raw})`);
  
  if (health.total < 80) {
    console.log(`\n⚠️ 健康度低于80分，建议检查:`);
    if (health.breakdown.success.score < 45) console.log(`  - 成功率偏低，某Stage可能不稳定`);
    if (health.breakdown.duration.score < 15) console.log(`  - 平均耗时过长，建议优化慢速Stage`);
    if (health.breakdown.retry.score < 15) console.log(`  - 重试次数过多，建议检查Stage可靠性`);
  } else {
    console.log(`\n✅ 链路健康度良好 (>=80分)`);
  }
  
  console.log(`\n各Stage详情:`);
  linkStats.stageDetails.forEach(d => {
    const status = d.status === 'success' ? '✅' : '❌';
    const retry = d.attempts > 1 ? ` (重试${d.attempts-1}次)` : '';
    console.log(`  ${status} ${d.name}: ${(d.duration/1000).toFixed(1)}s${retry}`);
  });
  console.log(`===================================`);
  
  console.log(`\n[StageRunner] 运行完成: ${checkpoint.completedStages.length}/${STAGE_LIST.length} 个Stage | 耗时 ${elapsed.toFixed(0)}秒`);
  return checkpoint;
}

// 🆕 v6.4-Peng-fix: 分段执行入口 - 每次只跑一个batch
async function runBatch(productionDir, batchNum) {
  const batchStages = STAGE_LIST.filter(s => s.batch === batchNum);
  if (batchStages.length === 0) {
    console.error(`[StageRunner] 无效的batch: ${batchNum}`);
    return null;
  }
  
  const startStage = batchStages[0].num;
  const endStage = batchStages[batchStages.length - 1].num;
  
  console.log(`\n[StageRunner] 🚀 运行Batch ${batchNum}: Stage ${startStage}-${endStage}`);
  return await runStageByStage(productionDir, startStage, endStage);
}

// 主入口
if (require.main === module) {
  // 🆕 支持 --production <dir> 和 --record 标志
  let productionDir = './productions/xingtian';
  let startStage = 1;
  let endStage = 13;
  let recordMode = false;
  let startStageSet = false; // 🆕 v3.0-Peng-fix: 标记 startStage 是否已显式设置
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--production' && i + 1 < process.argv.length) {
      productionDir = process.argv[++i];
    } else if (arg === '--record') {
      recordMode = true;
    } else if (!isNaN(parseInt(arg)) && parseInt(arg) > 0) {
      // 数字参数：第一个数字是startStage，第二个是endStage
      if (!startStageSet) {
        startStage = parseInt(arg);
        startStageSet = true;
      } else {
        endStage = parseInt(arg);
      }
    }
  }
  
  if (recordMode) {
    console.log(`[StageRunner] 🎬 记录模式已启用: LLM调用将被缓存`);
  }
  
  const mode = process.argv.find((a, i) => i > 2 && a === 'batch') ? 'batch' : 'full';
  
  if (mode === 'batch') {
    // 分段模式：每次跑一个batch
    const batchNum = parseInt(process.argv.find(a => !isNaN(parseInt(a)) && parseInt(a) > 0)) || 1;
    runBatch(productionDir, batchNum).then(checkpoint => {
      console.log(`[StageRunner] Batch ${batchNum} 最终状态: ${JSON.stringify(checkpoint, null, 2)}`);
    }).catch(err => {
      console.error('[StageRunner] 运行器异常:', err);
      process.exit(1);
    });
  } else {
    // 全量模式（兼容旧用法）
    runStageByStage(productionDir, startStage, endStage).then(checkpoint => {
      console.log(`[StageRunner] 最终状态: ${JSON.stringify(checkpoint, null, 2)}`);
    }).catch(err => {
      console.error('[StageRunner] 运行器异常:', err);
      process.exit(1);
    });
  }
}

module.exports = { runStageByStage, runBatch };