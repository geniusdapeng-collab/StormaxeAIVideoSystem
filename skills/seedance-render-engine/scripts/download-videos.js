#!/usr/bin/env node
/**
 * 视频下载修复脚本
 * 基于已完成的渲染任务ID，下载视频文件
 */

const fs = require('fs');
const path = require('path');
const { execAsync } = require('../../seedance-director/scripts/exec-utils');

const PRODUCTION_DIR = process.argv[2] || '/root/.openclaw/workspace/productions/kuafu-v23-20260521-133612';
const RAW_DIR = path.join(PRODUCTION_DIR, '05-raw-shots');
const SEEDANCE_SCRIPT = path.join(__dirname, '..', '..', 'byted-ark-seedance-skill', 'scripts', 'seedance.js');

// 已知的taskId列表（从日志中提取）
const TASK_IDS = [
  { shotId: 'S01-01', taskId: 'cgt-20260521134437-7lpqr' },
  { shotId: 'S02-01', taskId: 'cgt-20260521134945-9887p' },
  { shotId: 'S03-01', taskId: 'cgt-20260521135656-5c7ht' },
  { shotId: 'S04-01', taskId: 'cgt-20260521140331-p47t7' },
  { shotId: 'S05-01', taskId: 'cgt-20260521141204-kbrgv' },
  { shotId: 'S06-01', taskId: 'cgt-20260521141926-qjnwc' },
  { shotId: 'S07-01', taskId: 'cgt-20260521142551-fj6hw' },
  { shotId: 'S08-01', taskId: 'cgt-20260521143424-vg9wk' },
  { shotId: 'S09-01', taskId: 'cgt-20260521144120-p52z2' }
];

async function downloadVideo(videoUrl, shotId) {
  const https = require('https');
  const tmpPath = path.join(RAW_DIR, `${shotId}.mp4`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tmpPath);
    https.get(videoUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ ${shotId} 视频已下载: ${tmpPath}`);
        resolve(tmpPath);
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

async function getTaskVideoUrl(taskId) {
  try {
    const output = await execAsync(
      `node "${SEEDANCE_SCRIPT}" get --task-id "${taskId}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    const task = JSON.parse(output);
    return task.content?.video_url || null;
  } catch (e) {
    console.error(`❌ 获取任务 ${taskId} 失败: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('🎬 开始下载视频文件...\n');
  
  for (const { shotId, taskId } of TASK_IDS) {
    const videoPath = path.join(RAW_DIR, `${shotId}.mp4`);
    if (fs.existsSync(videoPath)) {
      console.log(`✅ ${shotId} 视频已存在，跳过`);
      continue;
    }
    
    console.log(`⏳ ${shotId} 获取视频URL...`);
    const videoUrl = await getTaskVideoUrl(taskId);
    
    if (videoUrl) {
      console.log(`⏳ ${shotId} 下载视频...`);
      try {
        await downloadVideo(videoUrl, shotId);
      } catch (e) {
        console.error(`❌ ${shotId} 下载失败: ${e.message}`);
      }
    } else {
      console.error(`❌ ${shotId} 无视频URL`);
    }
  }
  
  console.log('\n🎉 下载完成！');
}

main().catch(console.error);