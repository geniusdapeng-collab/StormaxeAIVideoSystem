#!/usr/bin/env node
/**
 * Seedance Post-Production — 后期制作流水线
 * 版本: v13.1-Peng
 *
 * v13.1-Peng 更新（2026-05-24）：
 * + 🆕 双版本输出系统：
 *   - 版本1 (原声版): 保留原视频音效，无字幕，无TTS
 *   - 版本2 (TTS版): 原视频音效 + TTS叠加，无字幕
 * + 🆕 跳过字幕合成 (大鹏要求双版本均不加字幕)
 * + 🆕 amix混音模式: [0:a][1:a]amix=inputs=2 保留原声+叠加TTS
 * + 旧版单输出模式已废弃
 *
 * 用法:
 *   node post-production.js assemble --production-dir <dir> [--sound-dir <dir>] [--output <file>]
 *   node post-production.js info --production-dir <dir>
 *   node post-production.js check --ffmpeg
 */

const fs = require('fs');
const path = require('path');
const { execAsync, execSyncSafe, shellQuote } = require('../../seedance-director/scripts/exec-utils');

// v13.1-Peng: 引入TTS引擎（双版本音画合成：原声版+TTS叠加版）
const { TTSEngine } = require('../../shanhaijing-render-engine/tts-engine.js');
const ttsEngine = new TTSEngine();

// 🔴 v5.1-Peng: 接入配置中心
let CONFIG;
function initConfig() {
  const { CONFIG: cfg } = require('../../seedance-director/scripts/config-center');
  CONFIG = cfg;
}
initConfig();

// ============ CLI解析 ============
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '');
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

// ============ 日志 ============
function log(tag, msg) {
  const time = new Date().toLocaleString('zh-CN', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

// ============ ffmpeg路径解析 ============
async function getFfmpegPath() {
  // 1. 检查系统ffmpeg
  try {
    execSyncSafe('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {}

  // 2. 检查项目内ffmpeg-static
  const staticPath = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg');
  if (fs.existsSync(staticPath)) {
    return staticPath;
  }

  // 3. 检查其他可能位置
  const altPaths = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/ffmpeg/ffmpeg',
  ];
  for (const p of altPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

// 全局ffmpeg路径(延迟初始化)
let FFMPEG = 'ffmpeg';
async function initFfmpeg() {
  FFMPEG = await getFfmpegPath() || 'ffmpeg';
}

// ============ 动态转场选择(v5.1-Peng) ============
function resolveDynamicTransitions(matched, storyPlan) {
  const perShot = [];
  const shots = matched.map(m => m.shot);
  const emotionCurve = storyPlan?.metadata?.emotionCurve || [];

  for (let i = 0; i < shots.length; i++) {
    const currentShot = shots[i];
    const nextShot = shots[i + 1];

    if (!nextShot) {
      perShot.push({ type: 'hard', duration: 0, reason: '最后镜头' });
      continue;
    }

    // 获取情绪值(优先用emotionCurve,其次用shot.emotion)
    const currentEmotion = emotionCurve[i] ?? parseEmotionValue(currentShot.emotion) ?? 50;
    const nextEmotion = emotionCurve[i + 1] ?? parseEmotionValue(nextShot.emotion) ?? 50;
    const emotionDelta = Math.abs(nextEmotion - currentEmotion);

    // 场景变化检测
    const sceneChange = currentShot.sceneId !== nextShot.sceneId && currentShot.sceneId && nextShot.sceneId;

    // 角色变化检测
    const currentChars = new Set(currentShot.characters || []);
    const nextChars = new Set(nextShot.characters || []);
    const charChange = !setsEqual(currentChars, nextChars);

    // 转场决策(使用配置中心阈值)
    const thresholds = CONFIG.postProduction.transition.thresholds;
    let type = 'hard';
    let duration = 0;
    let reason = '';

    if (sceneChange) {
      type = 'fade_black';
      duration = CONFIG.postProduction.transition.sceneChangeDuration;
      reason = '场景切换';
    } else if (emotionDelta > thresholds.fadeBlack) {
      type = 'fade_black';
      duration = CONFIG.postProduction.transition.blackFadeDuration;
      reason = `情绪剧变(${emotionDelta.toFixed(0)})`;
    } else if (emotionDelta > thresholds.hardCut) {
      type = 'crossfade';
      duration = Math.min(
        CONFIG.postProduction.transition.fadeDuration + (emotionDelta - thresholds.hardCut) * 0.02,
        thresholds.maxDuration
      );
      reason = `情绪渐变(${emotionDelta.toFixed(0)})`;
    } else if (charChange && currentChars.size > 0 && nextChars.size > 0) {
      type = 'wipe';
      duration = CONFIG.postProduction.transition.wipeDuration;
      reason = '角色切换';
    } else {
      type = 'hard';
      duration = 0;
      reason = `情绪连续(${emotionDelta.toFixed(0)})`;
    }

    perShot.push({ type, duration, reason, emotionDelta, sceneChange, charChange });
  }

  // 统计各转场类型数量,决定overallType
  const typeCounts = {};
  for (const p of perShot) {
    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
  }
  const overallType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'hard';

  return { overallType, perShot, reason: `情绪分析完成,${perShot.filter(p => p.type !== 'hard').length}处非硬切` };
}

function parseEmotionValue(emotionStr) {
  if (!emotionStr) return null;
  // 尝试解析数字
  const num = parseFloat(emotionStr);
  if (!isNaN(num)) return num;
  // 情绪关键词映射(使用配置中心)
  const map = CONFIG.story.emotionMap;
  for (const [key, val] of Object.entries(map)) {
    if (emotionStr.includes(key)) return val;
  }
  return null;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

// ============ ffmpeg检测 ============
async function checkFfmpeg() {
  const ffmpegPath = await getFfmpegPath();

  if (ffmpegPath) {
    try {
      const version = (await execAsync(`${shellQuote(ffmpegPath)} -version 2>/dev/null | head -1`, { encoding: 'utf8' })).trim();
      log('Check', `✅ ffmpeg已就绪: ${version}`);
      return ffmpegPath;
    } catch {
      // 静默失败,继续检查
    }
  }

  log('Check', '❌ ffmpeg未安装');
  console.log(`
═══════════════════════════════════════════════════════
❌ ffmpeg未安装 - 后期制作核心工具缺失

自动安装(推荐):
  cd ~/.openclaw/workspace/skills/seedance-post-production
  npm install ffmpeg-static

手动安装(Ubuntu/Debian):
  sudo apt-get update && sudo apt-get install -y ffmpeg

手动安装(macOS):
  brew install ffmpeg

Windows:
  https://ffmpeg.org/download.html
═══════════════════════════════════════════════════════
  `);
  return null;
}

// ============ 素材校验 ============
function validateProduction(dir) {
  log('Stage1', '📁 校验素材...');

  const storyPlanPath = path.join(dir, '01-story-plan.json');
  const shotsDir = path.join(dir, '05-raw-shots');

  if (!fs.existsSync(storyPlanPath)) {
    throw new Error(`❌ 缺少story-plan.json: ${storyPlanPath}`);
  }

  const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
  const shots = storyPlan.shots || [];

  log('Stage1', `📋 故事板: ${storyPlan.title}, ${shots.length}个镜头`);

  // 🟢 v5.7-Peng-fix-C: 当素材目录不存在时,返回空 matched(优雅降级)
  if (!fs.existsSync(shotsDir)) {

    const rendersDir = path.join(dir, 'renders');
    if (fs.existsSync(rendersDir)) {
      log('Stage1', `📁 发现 renders/ 目录，使用为素材目录`);
      return scanShotsDir(dir, storyPlan, rendersDir);
    }
    log('Stage1', '⚠️ 视频片段目录不存在(可能使用了 --skip-render 或渲染未完成),返回空素材列表', 'warn');
    return { storyPlan, matched: [], missing: shots.map(s => s.id), shotsDir };
  }

  return scanShotsDir(dir, storyPlan, shotsDir);
}

function scanShotsDir(dir, storyPlan, shotsDir) {
  const shots = storyPlan.shots || [];
  
  // 扫描实际存在的视频文件
  const rawFiles = fs.readdirSync(shotsDir).filter(f =>
    f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.avi')
  );

  log('Stage1', `📹 实际素材: ${rawFiles.length}个视频文件`);

  // 匹配story-plan中的镜头与实际文件
  const matched = [];
  const missing = [];

  for (const shot of shots) {
    // 尝试多种命名方式匹配
    const possibleNames = [
      `${shot.id}.mp4`,
      `${shot.id}-视频片段.mp4`,
      `${shot.id}_content.video_url.mp4`,
      `${shot.id}_content.mp4`,
      `content.video_url.mp4`, // seedance-wrapper的默认输出名
    ];

    let found = false;
    for (const name of possibleNames) {
      const fullPath = path.join(shotsDir, name);
      if (fs.existsSync(fullPath)) {
        matched.push({ shot, filePath: fullPath, fileName: name });
        found = true;
        break;
      }
    }

    if (!found) {
      // 尝试模糊匹配(以shot.id开头的文件)
      const fuzzyMatch = rawFiles.find(f => f.startsWith(shot.id) || f.includes(shot.id.toLowerCase()));
      if (fuzzyMatch) {
        matched.push({ shot, filePath: path.join(shotsDir, fuzzyMatch), fileName: fuzzyMatch });
        found = true;
      }
    }

    if (!found) {
      missing.push(shot.id);
    }
  }

  log('Stage1', `✅ 匹配成功: ${matched.length}个, ❌ 缺失: ${missing.length}个`);
  if (missing.length > 0) {
    log('Stage1', `⚠️ 缺失镜头: ${missing.join(', ')}`);
  }

  return { storyPlan, matched, missing, shotsDir };
}

// ============ 视频信息提取 ============
async function getVideoInfo(filePath) {
  try {
    const info = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate,duration -of json ${shellQuote(filePath)}`, { encoding: 'utf8' });
    const data = JSON.parse(info);
    const stream = data.streams?.[0] || {};
    return {
      width: stream.width || 0,
      height: stream.height || 0,
      fps: eval(stream.avg_frame_rate || '0'), // e.g. "30/1" -> 30
      duration: parseFloat(stream.duration || 0),
    };
  } catch {
    return { width: 0, height: 0, fps: 0, duration: 0 };
  }
}

// ============ Stage 2: 拼接+转场 ============
async function stage2Concat(matched, storyPlan, outputDir, options = {}) {
  log('Stage2', '🎞️ 拼接镜头...');

  const transitionType = options.transition || 'auto';
  const tempListFile = path.join(outputDir, '.concat-list.txt');

  // 自动选择转场类型
  let effectiveTransition = transitionType;
  if (transitionType === 'auto') {
    // 🔴 v5.1-Peng: 基于情绪变化的动态转场选择
    const transitions = resolveDynamicTransitions(matched, storyPlan);
    effectiveTransition = transitions.overallType || 'hard';
    log('Stage2', `🎯 动态转场: ${effectiveTransition} (基于${transitions.reason})`);

    // 打印每个镜头的转场决策
    for (let i = 0; i < transitions.perShot.length; i++) {
      const p = transitions.perShot[i];
      if (p.type !== 'hard') {
        const fromId = matched[i]?.shot?.id || `S${i+1}`;
        const toId = matched[i+1]?.shot?.id || 'END';
        log('Stage2', `   ${fromId} → ${toId}: ${p.type}(${p.duration}s) - ${p.reason}`);
      }
    }

    // 保存每个镜头的转场类型供后续使用
    matched.forEach((m, i) => {
      m.transitionType = transitions.perShot[i]?.type || 'hard';
      m.transitionDuration = transitions.perShot[i]?.duration || 0;
    });
  } else {
    log('Stage2', `🎯 手动指定转场: ${effectiveTransition}`);
    matched.forEach(m => {
      m.transitionType = effectiveTransition;
      m.transitionDuration = effectiveTransition === 'hard' ? 0 : 0.5;
    });
  }

  // 统一格式:先转码所有片段为相同格式
  const normalizedDir = path.join(outputDir, '.normalized');
  if (!fs.existsSync(normalizedDir)) fs.mkdirSync(normalizedDir, { recursive: true });

  let maxWidth = 0, maxHeight = 0, maxFps = 0;

  // 先扫描所有视频获取最高标准
  for (const { filePath } of matched) {
    const info = await getVideoInfo(filePath);
    maxWidth = Math.max(maxWidth, info.width);
    maxHeight = Math.max(maxHeight, info.height);
    maxFps = Math.max(maxFps, info.fps);
  }

  log('Stage2', `📐 统一标准: ${maxWidth}x${maxHeight} @ ${maxFps}fps`);

  const normalizedFiles = [];
  for (let i = 0; i < matched.length; i++) {
    const { shot, filePath } = matched[i];
    const outFile = path.join(normalizedDir, `S${String(i+1).padStart(2,'0')}_norm.mp4`);

    // 转码+缩放+标准化(保留音频!)
    const cmd = `${FFMPEG} -y -i ${shellQuote(filePath)} -vf "scale=${maxWidth}:${maxHeight}:force_original_aspect_ratio=decrease,pad=${maxWidth}:${maxHeight}:(ow-iw)/2:(oh-ih)/2,fps=${maxFps || 30}" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -pix_fmt yuv420p ${shellQuote(outFile)} 2>&1`;

    log('Stage2', `🔄 转码 ${shot.id}...`);
    try {
      await execAsync(cmd, { stdio: 'pipe' });
      normalizedFiles.push({ shot, file: outFile, index: i });
    } catch (e) {
      log('Stage2', `❌ ${shot.id} 转码失败: ${e.message}`);
    }
  }

  if (normalizedFiles.length === 0) {
    throw new Error('❌ 所有片段转码失败');
  }

  let concatOutput;

  // 根据转场类型选择拼接方式
  if ((effectiveTransition === 'fade' || effectiveTransition === 'crossfade' || effectiveTransition === 'fade_black') && normalizedFiles.length > 1) {
    // 叠化/渐变转场:使用xfade filter
    log('Stage2', `🌟 应用${effectiveTransition}转场...`);
    concatOutput = await applyFadeTransitions(normalizedFiles, outputDir, maxWidth, maxHeight, maxFps);
  } else if (effectiveTransition === 'flash' && normalizedFiles.length > 1) {
    // 闪白转场
    log('Stage2', '⚡ 应用闪白转场...');
    concatOutput = await applyFlashTransitions(normalizedFiles, outputDir, maxWidth, maxHeight, maxFps);
  } else {
    // 硬切(默认)
    const listContent = normalizedFiles.map(({ file }) => `file '${file.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(tempListFile, listContent);

    concatOutput = path.join(outputDir, '.stage2-concat.mp4');
    const concatCmd = `${FFMPEG} -y -f concat -safe 0 -i ${shellQuote(tempListFile)} -c copy ${shellQuote(concatOutput)} 2>&1`;

    log('Stage2', `🎬 硬切拼接 ${normalizedFiles.length}个片段...`);
    await execAsync(concatCmd, { stdio: 'pipe' });
  }

  log('Stage2', `✅ 拼接完成: ${concatOutput}`);
  return concatOutput;
}

// 叠化转场实现(支持per-shot时长)
async function applyFadeTransitions(files, outputDir, width, height, fps) {
  const output = path.join(outputDir, '.stage2-fade.mp4');

  if (files.length === 2) {
    const fadeDuration = files[0].transitionDuration || 0.5;
    const info0 = await getVideoInfo(files[0].file);
    const cmd = `${FFMPEG} -y -i ${shellQuote(files[0].file)} -i ${shellQuote(files[1].file)} -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${fadeDuration}:offset=${info0.duration - fadeDuration}[v];[0:a][1:a]acrossfade=d=${fadeDuration}[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -pix_fmt yuv420p ${shellQuote(output)} 2>&1`;
    await execAsync(cmd, { stdio: 'pipe' });
  } else {
    // 多段视频:逐步叠加(每步用per-shot duration)
    let current = files[0].file;
    for (let i = 1; i < files.length; i++) {
      const fadeDuration = files[i - 1].transitionDuration || 0.5;
      const info0 = await getVideoInfo(current);
      const tempOutput = path.join(outputDir, `.stage2-fade-step${i}.mp4`);
      const cmd = `${FFMPEG} -y -i ${shellQuote(current)} -i ${shellQuote(files[i].file)} -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${fadeDuration}:offset=${info0.duration - fadeDuration}[v];[0:a][1:a]acrossfade=d=${fadeDuration}[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -pix_fmt yuv420p ${shellQuote(tempOutput)} 2>&1`;
      await execAsync(cmd, { stdio: 'pipe' });
      current = tempOutput;
    }
    // 最终复制到输出路径
    fs.copyFileSync(current, output);
  }

  return output;
}

// 闪白转场实现
async function applyFlashTransitions(files, outputDir, width, height, fps) {
  const output = path.join(outputDir, '.stage2-flash.mp4');

  // 闪白转场:在片段间插入白帧
  const listFile = path.join(outputDir, '.flash-list.txt');
  const whiteFrame = path.join(outputDir, '.white-frame.mp4');

  // 生成1秒白帧
  const whiteCmd = `${FFMPEG} -y -f lavfi -i color=c=white:s=${width}x${height}:d=1 -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -pix_fmt yuv420p ${shellQuote(whiteFrame)} 2>&1`;
  await execAsync(whiteCmd, { stdio: 'pipe' });

  // 构建列表:片段1 + 白帧 + 片段2 + 白帧 + ...
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    parts.push(files[i].file);
    if (i < files.length - 1) {
      parts.push(whiteFrame);
    }
  }

  const listContent = parts.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(listFile, listContent);

  const cmd = `${FFMPEG} -y -f concat -safe 0 -i ${shellQuote(listFile)} -c copy ${shellQuote(output)} 2>&1`;
  await execAsync(cmd, { stdio: 'pipe' });

  return output;
}

// ============ Stage 3: 调色(Nirath双恒星色谱系统) ============
async function stage3ColorGrade(inputFile, storyPlan, outputDir, options = {}) {
  log('Stage3', '🎨 Nirath调色系统...');

  const lighting = storyPlan.lightingThreeLayer || '';
  const style = storyPlan.styleManifesto || '';
  const sceneType = storyPlan.sceneType || ''; // Nirath场景类型

  // Nirath双恒星色谱LUT系统
  let filterChain = 'eq=brightness=0.02:contrast=1.05:saturation=1.02';
  let lutName = 'default';

  // 根据Nirath场景类型+光影描述匹配调色方案
  if (sceneType.includes('abyssal') || sceneType.includes('luminara') || lighting.includes('深海') || lighting.includes('青绿')) {
    // 深海青绿: 归墟之海/幽冥地下海 — 青绿主调+玫瑰金暮光
    filterChain += ',colorbalance=rs=-.05:gs=.10:bs=.05,eq=saturation=1.15:contrast=1.1';
    lutName = 'abyssal_teal';
    log('Stage3', '🌊 应用深海青绿调色 (Abyssal Teal LUT) — 归墟之海/幽冥地下海');
  } else if (sceneType.includes('solar') || sceneType.includes('cradle') || sceneType.includes('fusang') || lighting.includes('天光') || lighting.includes('金色')) {
    // 天光金粉: 汤谷扶桑/昆仑悬境 — 琥珀橙主光+紫罗兰填充
    filterChain += ',colorbalance=rs=.12:gs=.02:bs=-.06,eq=saturation=1.1:contrast=1.05';
    lutName = 'twilight_gold';
    log('Stage3', '🌅 应用天光金粉调色 (Twilight Gold LUT) — 汤谷扶桑/昆仑悬境');
  } else if (sceneType.includes('broken') || sceneType.includes('axis') || sceneType.includes('zhulu') || lighting.includes('地热') || lighting.includes('橙红')) {
    // 地热橙红: 不周山脉/涿鹿战场 — 裂缝岩浆光+黑曜石剪影
    filterChain += ',colorbalance=rs=.15:gs=-.02:bs=-.10,eq=saturation=1.2:contrast=1.15';
    lutName = 'geothermal_red';
    log('Stage3', '🔥 应用地热橙红调色 (Geothermal Red LUT) — 不周山脉/涿鹿战场');
  } else if (sceneType.includes('astrop') || sceneType.includes('nexus') || sceneType.includes('penglai') || lighting.includes('超导') || lighting.includes('电蓝')) {
    // 超导电蓝: 星门祭坛/蓬莱迷雾 — 能量脉冲+光谱折射
    filterChain += ',colorbalance=rs=-.08:gs=-.02:bs=.15,eq=saturation=1.25:contrast=1.1';
    lutName = 'superconductor_blue';
    log('Stage3', '⚡ 应用超导电蓝调色 (Superconductor Blue LUT) — 星门祭坛/蓬莱迷雾');
  } else if (sceneType.includes('spine') || sceneType.includes('pangu') || lighting.includes('黑曜石') || lighting.includes('暗')) {
    // 黑曜石暗: 盘古之脊/虚空场景 — 半透明折射+暗红地幔光
    filterChain += ',colorbalance=rs=.05:gs=-.05:bs=-.05,eq=saturation=0.85:contrast=1.2:brightness=-0.03';
    lutName = 'obsidian_dark';
    log('Stage3', '🖤 应用黑曜石暗调色 (Obsidian Dark LUT) — 盘古之脊/虚空');
  } else if (sceneType.includes('azure') || sceneType.includes('hills') || lighting.includes('灵原') || lighting.includes('翠绿')) {
    // 灵原翠绿: 青丘灵原 — 蓝绿植被+孢子水母粉金
    filterChain += ',colorbalance=rs=-.03:gs=.12:bs=-.02,eq=saturation=1.2:contrast=1.05';
    lutName = 'spirit_green';
    log('Stage3', '🌿 应用灵原翠绿调色 (Spirit Green LUT) — 青丘灵原');
  } else if (style.includes('黑白') || style.includes('noir')) {
    // 保留黑白选项（艺术片）
    filterChain = 'hue=s=0,eq=contrast=1.3:brightness=-0.02,curves=all=' +
      '"0/0 0.2/0.1 0.5/0.5 0.8/0.9 1/1"';
    lutName = 'noir';
    log('Stage3', '⚫ 应用黑白电影调色 (Noir LUT)');
  } else if (style.includes('自然') || style.includes('纪录')) {
    // 保留自然纪录片选项（科普片）
    filterChain = 'eq=brightness=0.01:contrast=1.02:saturation=1.05';
    lutName = 'natural';
    log('Stage3', '🟢 应用自然纪录片调色 (Natural LUT)');
  } else {
    // 默认：双恒星永恒黄昏标准调色
    filterChain += ',colorbalance=rs=.05:gs=.01:bs=-.03';
    lutName = 'nirath_standard';
    log('Stage3', '🌟 应用Nirath标准调色 (Dual-Star Twilight LUT)');
  }

  // 添加双恒星体积光效果(可选)
  if (options.volumetricLight || sceneType.includes('volumetric') || lighting.includes('体积光')) {
    filterChain += ',glow=radius=20:strength=0.3';
    log('Stage3', '✨ 添加双恒星体积光效果');
  }

  // 添加生物发光增强(可选)
  if (options.bioluminescence || sceneType.includes('bioluminescent')) {
    filterChain += ',eq=saturation=1.3:brightness=0.03';
    log('Stage3', '🔮 添加生物发光增强');
  }

  // 添加胶片颗粒效果(可选)
  if (options.filmGrain || style.includes('胶片') || style.includes('grain')) {
    filterChain += ',noise=c0s=3:c0f=t+u';
    log('Stage3', '🎞️ 添加胶片颗粒效果');
  }

  const output = path.join(outputDir, `.stage3-graded-${lutName}.mp4`);
  const cmd = `${FFMPEG} -y -i ${shellQuote(inputFile)} -vf "${filterChain}" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -pix_fmt yuv420p ${shellQuote(output)} 2>&1`;

  await execAsync(cmd, { stdio: "pipe" });
  log('Stage3', `✅ 调色完成: ${output}`);
  return output;
}

// ============ Stage 4: 字幕 ============
async function stage4Titles(inputFile, storyPlan, outputDir, options = {}) {
  log('Stage4', '📝 添加字幕...');

  const title = storyPlan.title || '未命名短片';
  const addTitles = options.addTitles !== false;

  if (!addTitles) {
    log('Stage4', '⏭️ 跳过字幕(用户指定)');
    return inputFile;
  }

  // 片头3秒 + 内容 + 片尾5秒
  const titleCard = path.join(outputDir, '.title-card.mp4');
  const endCard = path.join(outputDir, '.end-card.mp4');

  // 生成片头(黑底白字)
  const titleSafe = (title || '').replace(/[\"]/g, '');
  const titleCmd = `${FFMPEG} -y -f lavfi -i color=c=black:s=1920x1080:d=3 -vf "drawtext=text='${titleSafe}':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,drawtext=text='A Seedance Production':fontsize=24:fontcolor=white@0.7:x=(w-text_w)/2:y=(h-text_h)/2+80" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k ${shellQuote(titleCard)} 2>&1`;

  // 生成片尾
  const endCmd = `${FFMPEG} -y -f lavfi -i color=c=black:s=1920x1080:d=5 -vf "drawtext=text='THE END':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k ${shellQuote(endCard)} 2>&1`;

  try { await execAsync(titleCmd, { stdio: 'pipe' }); } catch(e) { log('Stage4', `⚠️ 片头生成失败: ${e.message}`); }
  try { await execAsync(endCmd, { stdio: 'pipe' }); } catch(e) { log('Stage4', `⚠️ 片尾生成失败: ${e.message}`); }

  // 拼接片头+内容+片尾
  const finalWithTitles = path.join(outputDir, '.stage4-titles.mp4');
  const parts = [];
  if (fs.existsSync(titleCard)) parts.push(titleCard);
  parts.push(inputFile);
  if (fs.existsSync(endCard)) parts.push(endCard);

  const listFile = path.join(outputDir, '.title-list.txt');
  fs.writeFileSync(listFile, parts.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));

  const concatCmd = `${FFMPEG} -y -f concat -safe 0 -i ${shellQuote(listFile)} -c copy ${shellQuote(finalWithTitles)} 2>&1`;
  await execAsync(concatCmd, { stdio: "pipe" });

  log('Stage4', `✅ 字幕完成: ${finalWithTitles}`);
  return finalWithTitles;
}

// ============ Stage 4.5: TTS台词生成（v13.1-Peng：双版本系统） ============
async function stage45GenerateTTS(videoFile, storyPlan, outputDir) {
  log('Stage4.5', '🎙️ 生成TTS台词...');

  const narrationScript = storyPlan.narrationScript || storyPlan.narration || '';
  if (!narrationScript) {
    log('Stage4.5', '⚠️ 未找到台词脚本，跳过TTS生成');
    return null;
  }

  const ttsOutputPath = path.join(outputDir, '.stage4_5-narration.mp3');
  
  // 使用默认音色（云扬 zh-CN-YunyangNeural）
  const result = await ttsEngine.generateTTS(narrationScript, ttsOutputPath);
  
  if (result.success) {
    log('Stage4.5', `✅ TTS台词生成成功: ${ttsOutputPath} (${(result.size / 1024).toFixed(1)} KB)`);
    return ttsOutputPath;
  } else {
    log('Stage4.5', `❌ TTS生成失败: ${result.error}`, 'error');
    return null;
  }
}

// ============ Stage 5: 音画合成（v13.1-Peng：双版本输出 — 原声版+TTS叠加版） ============
function stage5AudioMix(videoFile, soundDir, storyPlan, outputDir, ttsAudioPath = null, mode = 'replace') {
  log('Stage5', `🔊 音画合成 (模式: ${mode === 'mix' ? '原声+TTS叠加' : 'TTS替换'})...`);

  // 版本2: 原声+TTS叠加模式
  if (mode === 'mix' && ttsAudioPath && fs.existsSync(ttsAudioPath)) {
    const finalOutput = path.join(outputDir, `成片-${storyPlan.title || '未命名'}-v2-TTS版.mp4`);
    
    log('Stage5', `🎙️ 叠加TTS台词到原视频音频...`);
    
    try {
      // ffmpeg amix: 将原视频音频和TTS音频叠加混合
      // [0:a] = 原视频音频, [1:a] = TTS音频, 混合后输出
      const cmd = `${FFMPEG} -y -i ${shellQuote(videoFile)} -i ${shellQuote(ttsAudioPath)} -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0.5[aout]" -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest ${shellQuote(finalOutput)} 2>&1`;
      
      execSync(cmd, { stdio: 'pipe', timeout: 300000 });
      
      if (fs.existsSync(finalOutput)) {
        log('Stage5', `✅ 音画合成完成(原声+TTS): ${finalOutput}`);
        return { finalVideo: finalOutput, hasAudio: true, ttsAudio: ttsAudioPath, mode: 'mix' };
      }
    } catch (e) {
      log('Stage5', `⚠️ TTS叠加失败: ${e.message}，回退到替换模式`, 'warn');
    }
  }
  
  // 默认: TTS替换原音频模式 (旧逻辑)
  if (ttsAudioPath && fs.existsSync(ttsAudioPath)) {
    const finalOutput = path.join(outputDir, `成片-${storyPlan.title || '未命名'}.mp4`);
    log('Stage5', `🎙️ 合成TTS台词到视频(替换原音频)...`);
    
    const success = ttsEngine.mixNarrationToVideo(videoFile, ttsAudioPath, finalOutput);
    if (success) {
      log('Stage5', `✅ 音画合成完成(TTS替换): ${finalOutput}`);
      return { finalVideo: finalOutput, hasAudio: true, ttsAudio: ttsAudioPath, mode: 'replace' };
    } else {
      log('Stage5', `⚠️ TTS合成失败，回退到素材包模式`, 'warn');
    }
  }

  // 回退：无TTS且无声效资产 = 直接复制视频
  const finalOutput = path.join(outputDir, `成片-${storyPlan.title || '未命名'}.mp4`);
  fs.copyFileSync(videoFile, finalOutput);
  log('Stage5', `⚠️ 无TTS音频且无声音资产，输出原视频副本: ${finalOutput}`);
  return { finalVideo: finalOutput, hasAudio: false, mode: 'original' };
}

// ============ Stage 6: 输出报告 (v13.1-Peng: 双版本报告) ============
function stage6Report(productionDir, storyPlan, matched, missing, versions) {
  log('Stage6', '📋 生成双版本报告...');

  const outputDir = productionDir;
  const reportPath = path.join(outputDir, '后期制作报告.md');

  const totalShots = (storyPlan.shots || []).length;
  const successShots = matched.length;
  const missingShots = missing.length;

  const version1 = versions?.version1;
  const version2 = versions?.version2;
  const ttsAudio = versions?.ttsAudio;
  
  const hasV1 = version1 && fs.existsSync(version1);
  const hasV2 = version2 && fs.existsSync(version2);

  let duration1 = 0, duration2 = 0;
  if (hasV1) {
    try { duration1 = getVideoInfo(version1).duration; } catch {}
  }
  if (hasV2) {
    try { duration2 = getVideoInfo(version2).duration; } catch {}
  }

  const report = `# 后期制作报告 (双版本)

## 项目信息
- **标题**: ${storyPlan.title || '未命名'}
- **总时长**: ${storyPlan.totalDuration || '?'}秒(设计)
- **总镜头**: ${totalShots}
- **成功渲染**: ${successShots}
- **缺失镜头**: ${missingShots} (${missing.join(', ') || '无'})

## 后期流程
| 阶段 | 状态 | 说明 |
|------|------|------|
| Stage 1 素材校验 | ✅ | ${successShots}/${totalShots} 镜头匹配 |
| Stage 2 拼接 | ✅ | 硬切拼接完成，保留原视频音频 |
| Stage 3 调色 | ✅ | 基于光影描述自动调色 |
| Stage 4 字幕 | ⏭️ | **已跳过** (大鹏要求双版本均不加字幕) |
| Stage 4.5 TTS台词 | ${ttsAudio ? '✅' : '⚠️'} | ${ttsAudio ? 'TTS已生成' : '无旁白脚本或TTS失败'} |
| Stage 5 音画合成 | ✅ | 双版本已输出 |
| Stage 6 输出 | ✅ | 报告已生成 |

## 双版本输出

### 版本1: 原声版 ✅
- **描述**: 保留原视频自带音效，无字幕，无TTS
- **文件**: \`${version1 || '未生成'}\`
- **时长**: ${duration1 ? Math.round(duration1) : '?'}秒
- **适用场景**: 展示Seedance原生渲染效果，保留AI视频原始音频

### 版本2: TTS版 ${hasV2 ? '✅' : '❌'}
- **描述**: 原视频音效 + TTS台词叠加，无字幕
- **文件**: \`${version2 || '未生成'}\`
- **时长**: ${duration2 ? Math.round(duration2) : '?'}秒
- **TTS音频**: \`${ttsAudio || '未生成'}\`
- **混音模式**: amix叠加 (原声+TTS同时存在)
- **适用场景**: 需要角色台词的版本，适合叙事类短片

## 文件清单
${hasV1 ? `- **版本1 (原声版)**: \`${version1}\`` : '- ❌ 版本1未生成'}
${hasV2 ? `- **版本2 (TTS版)**: \`${version2}\`` : '- ❌ 版本2未生成'}
${ttsAudio ? `- **TTS台词音频**: \`${ttsAudio}\`` : ''}
- **分轨素材**: \`${path.join(outputDir, '分轨素材包')}\`

## 技术说明

### 版本1 (原声版)
- 直接使用拼接+调色后的视频
- 保留Seedance渲染时生成的原始音频
- 无字幕叠加
- 无TTS台词

### 版本2 (TTS版)
- 使用 ffmpeg amix 将TTS台词叠加到原视频音频上
- 混音参数: inputs=2, duration=first, dropout_transition=0.5
- 原视频音频和TTS音频同时存在，音量平衡
- 无字幕叠加

## 下一步建议
${missingShots > 0 ? `- [ ] 补拍缺失镜头: ${missing.join(', ')}` : ''}
- [ ] 审片: 对比两个版本，确认原声效果和TTS叠加效果
- [ ] 如TTS音量不合适，可调整 amix 的权重参数
- [ ] 如需进一步调色，可使用DaVinci Resolve导入原声版

---
*后期制作: seedance-post-production v13.1-Peng (双版本)*
*时间: ${new Date().toLocaleString('zh-CN')}*
`;

  fs.writeFileSync(reportPath, report);
  log('Stage6', `✅ 双版本报告已生成: ${reportPath}`);
  return reportPath;
}

// ============ 主组装流程 ============
async function assemble(args) {
  const productionDir = args['production-dir'] || args.productionDir;
  const soundDir = args['sound-dir'] || args.soundDir;
  const outputFile = args.output;
  const addTitles = args['add-titles'] !== 'false' && args.addTitles !== 'false';

  if (!productionDir) {
    console.error('❌ 缺少 --production-dir 参数');
    process.exit(1);
  }

  log('Director', `🎬 开始后期制作: ${productionDir}`);

  // 检查ffmpeg
  const ffmpegPath = await checkFfmpeg();
  if (!ffmpegPath) {
    process.exit(1);
  }
  FFMPEG = ffmpegPath;

  // Stage 1: 素材校验
  const { storyPlan, matched, missing, shotsDir } = validateProduction(productionDir);

  // 🟢 v5.7-Peng-fix-C: 素材缺失时优雅降级
  if (matched.length === 0) {
    log('Director', '⚠️ 没有可合成的素材(跳过Stage2-5),生成素材缺失报告...', 'warn');
    const reportPath = stage6Report(productionDir, storyPlan, matched, missing, null);
    log('Director', '📋 后期制作完成(素材缺失模式)');
    console.log(`
═══════════════════════════════════════════════════════
⚠️ 后期制作 - 素材缺失模式

成片: 未生成(缺少渲染素材)
后期报告: ${reportPath}

说明:
- 生产目录使用了 --skip-render 模式,或渲染阶段未成功产出视频
- 如需合成成片,请先完成渲染后再运行后期制作
- 报告已生成,包含完整的镜头清单和缺失分析
═══════════════════════════════════════════════════════
  `);
    return { version1: null, version2: null, reportPath };
  }

  if (missing.length > matched.length) {
    log('Director', `⚠️ 超过50%镜头缺失,建议补拍后再合成`);
  }

  const outputDir = productionDir;

  // ==================== 公共部分：拼接 + 调色 ====================
  // Stage 2: 拼接 (保留原视频音频)
  const concatFile = await stage2Concat(matched, storyPlan, outputDir, { transition: args['transition'] || args.transition });

  // Stage 3: 调色 (保留原视频音频)
  const gradedFile = await stage3ColorGrade(concatFile, storyPlan, outputDir, { filmGrain: args['film-grain'] || args.filmGrain });
  
  log('Director', `🎬 公共部分完成: 拼接+调色 (${gradedFile})`);

  // ==================== 版本1: 原声版 (保留原视频音效，无字幕，无TTS) ====================
  log('Director', `\n🎬 [版本1/2] 生成原声版...`);
  const version1Path = path.join(outputDir, `成片-${storyPlan.title || '未命名'}-v1-原声版.mp4`);
  
  // 原声版 = 拼接+调色后的视频，跳过字幕和TTS，直接复制
  fs.copyFileSync(gradedFile, version1Path);
  log('Director', `✅ 版本1完成: 原声版 (保留原视频自带音效，无字幕，无TTS)`);
  log('Director', `   输出: ${version1Path}`);

  // ==================== 版本2: TTS版 (原视频音效 + TTS叠加，无字幕) ====================
  log('Director', `\n🎬 [版本2/2] 生成TTS版...`);
  
  // Stage 4.5: 生成TTS台词 (使用调色后的视频作为基础，不加字幕)
  const ttsAudioPath = await stage45GenerateTTS(gradedFile, storyPlan, outputDir);
  
  let version2Path = null;
  if (ttsAudioPath && fs.existsSync(ttsAudioPath)) {
    // Stage 5: 叠加TTS到原音频 (mix模式 = 保留原声+叠加TTS)
    const mixResult = stage5AudioMix(gradedFile, soundDir, storyPlan, outputDir, ttsAudioPath, 'mix');
    version2Path = mixResult.finalVideo;
    log('Director', `✅ 版本2完成: TTS版 (原声+TTS叠加，无字幕)`);
    log('Director', `   输出: ${version2Path}`);
  } else {
    // TTS生成失败，版本2 = 复制版本1
    version2Path = path.join(outputDir, `成片-${storyPlan.title || '未命名'}-v2-TTS版.mp4`);
    fs.copyFileSync(version1Path, version2Path);
    log('Director', `⚠️ TTS生成失败，版本2复制版本1`);
  }

  // Stage 6: 报告 (双版本)
  const reportPath = stage6Report(productionDir, storyPlan, matched, missing, {
    version1: version1Path,
    version2: version2Path,
    ttsAudio: ttsAudioPath
  });

  log('Director', '🎉 后期制作完成! 双版本输出');
  console.log(`
═══════════════════════════════════════════════════════
🎬 成片输出 (双版本)

[版本1] 原声版 (保留原视频音效，无字幕，无TTS)
  → ${version1Path}

[版本2] TTS版 (原视频音效 + TTS叠加，无字幕)
  → ${version2Path}

后期报告: ${reportPath}
分轨素材: ${path.join(outputDir, '分轨素材包')}

下一步:
1. 审片检查两个版本
2. 如需配乐,使用分轨素材包
3. 如需修改,调整源素材后重新运行 assemble
═══════════════════════════════════════════════════════
  `);

  return { version1: version1Path, version2: version2Path, reportPath };
}

// ============ 信息查询 ============
function info(args) {
  const productionDir = args['production-dir'] || args.productionDir;
  if (!productionDir) {
    console.error('❌ 缺少 --production-dir 参数');
    process.exit(1);
  }

  try {
    const { storyPlan, matched, missing } = validateProduction(productionDir);
    console.log(`
📋 生产项目信息
================
标题: ${storyPlan.title}
设计时长: ${storyPlan.totalDuration}秒
设计镜头: ${storyPlan.shots?.length || 0}个
匹配素材: ${matched.length}个
缺失素材: ${missing.length}个 (${missing.join(', ') || '无'})
    `);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

// ============ 主入口 ============
async function main() {
  const command = process.argv[2];
  const args = parseArgs();

  switch (command) {
    case 'assemble':
      try {
        await assemble(args);
      } catch (e) {
        console.error(`❌ 后期制作失败: ${e.message}`);
        process.exit(1);
      }
      break;
    case 'info':
      info(args);
      break;
    case 'check':
      checkFfmpeg();
      break;
    case 'help':
    default:
      console.log(`
Seedance Post-Production - 后期制作流水线

用法:
  node post-production.js assemble --production-dir <dir> [options]
  node post-production.js info --production-dir <dir>
  node post-production.js check

assemble 选项:
  --production-dir    生产目录(必须,包含01-story-plan.json和05-raw-shots/)
  --sound-dir         声音资产目录(可选)
  --output            输出文件路径(可选)
  --add-titles        是否添加片头片尾(默认true)
  --color-grade       是否自动调色(默认true)
  --transition        转场类型(默认auto)

示例:
  node post-production.js assemble --production-dir ./productions/我的短片-20260512
      `);
  }
}

main();}
