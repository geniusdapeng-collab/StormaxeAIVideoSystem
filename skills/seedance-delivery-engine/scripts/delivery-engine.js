#!/usr/bin/env node
/**
 * Seedance Delivery Engine v1.0-Peng
 * 第4板块：交付引擎 — 后期制作 + 报告生成 + 飞书通知
 * 
 * 职责：调用底层 post-production.js 完成后期，生成最终交付物
 */

const fs = require('fs');
const path = require('path');
const { execAsync } = require('../../seedance-director/scripts/exec-utils');

const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');
const POST_PROD_SCRIPT = path.join(WORKSPACE, 'seedance-post-production/scripts/post-production.js');

function log(tag, msg) {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log(`[${ts}] [${tag}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ============ 生产报告合并 ============
function mergeProductionReport(productionDir, postProdResult) {
  const reportPath = path.join(productionDir, '06-production-report.json');
  let report = {};
  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  }
  
  report.postProduction = {
    status: postProdResult.status,
    finalVideo: postProdResult.finalVideo,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return report;
}

// ============ 飞书通知生成 ============
function generateFeishuMessage(report, productionDir) {
  const hasFinal = report.postProduction?.status === 'completed' && report.postProduction?.finalVideo;
  const completedShots = report.completedShots || 0;
  const totalShots = report.totalShots || 0;
  const duration = report.productionTime || 0;
  const title = report.title || '未命名短片';
  
  const feishuMsg = `🎬 ${title} — 交付完成\n\n` +
    `✅ 渲染: ${completedShots}/${totalShots}\n` +
    `⏱️ 耗时: ${Math.floor(duration/60)}分${duration%60}秒\n\n` +
    (hasFinal ? `🎞️ **成片已生成** ✅\n📁 ${report.postProduction.finalVideo}\n\n` : `⚠️ 成片未生成\n\n`) +
    `📁 生产包: ${productionDir}\n` +
    `📋 分镜表: ${path.join(productionDir, '02-shot-list.md')}\n\n` +
    (hasFinal ? `🎉 **直接观看成片** 或下载分轨素材包进行二次剪辑。` : `下一步: 检查渲染片段完整性后重新运行后期制作。`);
  
  const notifyFile = path.join(productionDir, '07-feishu-message.txt');
  fs.writeFileSync(notifyFile, feishuMsg);
  log('Delivery', `✅ 飞书通知已生成: ${notifyFile}`);
  return feishuMsg;
}

// ============ 主生产流程 ============
async function produce(options) {
  const { productionDir, soundDir, transition = 'auto', addTitles = true, colorGrade = true, filmGrain = false } = options;
  
  log('Delivery', `🎬 交付引擎启动: ${productionDir}`, 'phase');
  
  // 检查底层脚本
  if (!fs.existsSync(POST_PROD_SCRIPT)) {
    log('Delivery', `❌ post-production.js 未找到: ${POST_PROD_SCRIPT}`, 'error');
    return { status: 'failed', error: '后期制作脚本未安装' };
  }
  
  // 检查 ffmpeg
  try {
    await execAsync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    log('Delivery', '❌ ffmpeg 未安装，后期制作需要 ffmpeg', 'error');
    return { status: 'failed', error: 'ffmpeg 未安装' };
  }
  
  // 调用底层后期制作脚本
  const cmdParts = ['node', `"${POST_PROD_SCRIPT}"`, 'assemble', '--production-dir', `"${productionDir}"`];
  if (soundDir) cmdParts.push('--sound-dir', `"${soundDir}"`);
  if (transition) cmdParts.push('--transition', `"${transition}"`);
  if (!addTitles) cmdParts.push('--add-titles', 'false');
  if (!colorGrade) cmdParts.push('--color-grade', 'false');
  if (filmGrain) cmdParts.push('--film-grain', 'true');
  
  const cmd = cmdParts.join(' ');
  log('Delivery', `执行: ${cmd}`, 'info');
  
  try {
    await execAsync(cmd, { stdio: 'inherit', timeout: 300000 });
  } catch (e) {
    log('Delivery', `⚠️ 后期制作脚本报错: ${e.message}`, 'warn');
  }
  
  // 检测成片是否生成
  const storyPlanPath = path.join(productionDir, '01-story-plan.json');
  let title = '未命名';
  if (fs.existsSync(storyPlanPath)) {
    const plan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
    title = plan.title || '未命名';
  }
  
  const finalVideo = path.join(productionDir, `成片-${title}.mp4`);
  const hasFinal = fs.existsSync(finalVideo);
  
  const postProdResult = {
    status: hasFinal ? 'completed' : 'failed',
    finalVideo: hasFinal ? finalVideo : null
  };
  
  // 合并生产报告
  const report = mergeProductionReport(productionDir, postProdResult);
  
  // 生成飞书通知
  const feishuMsg = generateFeishuMessage(report, productionDir);
  
  if (hasFinal) {
    log('Delivery', `✅ 交付完成: ${finalVideo}`, 'success');
  } else {
    log('Delivery', `⚠️ 成片未检测到，请检查 05-raw-shots/ 素材完整性`, 'warn');
  }
  
  return { status: postProdResult.status, finalVideo: postProdResult.finalVideo, report, feishuMsg };
}

// ============ CLI ============
function parseArgs() {
  const args = {};
  for (let i = 3; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '').replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    const value = process.argv[i + 1];
    if (value !== undefined && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

async function main() {
  const command = process.argv[2];
  const args = parseArgs();
  
  switch (command) {
    case 'produce': {
      if (!args.productionDir) {
        console.error('❌ 需要 --production-dir');
        process.exit(1);
      }
      const result = await produce({
        productionDir: args.productionDir,
        soundDir: args.soundDir,
        transition: args.transition || 'auto',
        addTitles: args.addTitles !== 'false' && args.noTitles !== true,
        colorGrade: args.colorGrade !== 'false' && args.noColorGrade !== true,
        filmGrain: args.filmGrain === true || args.filmGrain === 'true'
      });
      console.log(`\n${result.status === 'completed' ? '✅' : '⚠️'} 交付状态: ${result.status}`);
      if (result.finalVideo) console.log(`🎞️ 成片: ${result.finalVideo}`);
      break;
    }
    case 'help':
    default:
      console.log(`
Seedance Delivery Engine v1.0-Peng — 第4板块：交付引擎

用法:
  node delivery-engine.js produce --production-dir <dir> [options]

选项:
  --production-dir   生产目录（必须）
  --sound-dir        声音资产目录（可选）
  --transition       转场类型（auto|fade|flash|hard，默认auto）
  --no-titles        跳过片头片尾
  --no-color-grade   跳过调色
  --film-grain       添加胶片颗粒
`);
  }
}

main().catch(e => {
  console.error(`\n❌ 错误: ${e.message}`);
  process.exit(1);
});