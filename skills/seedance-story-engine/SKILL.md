#!/usr/bin/env node
/**
 * Seedance Render Engine v1.0-Peng
 * 从 Director v4.2-Peng Phase4 拆分独立的渲染引擎
 * 
 * 职责：将分镜片段批量提交到 Seedance API，处理 Multi-Shot / 单镜头策略，轮询下载，精确切分
 */

const fs = require('fs');
const path = require('path');
const { execAsync, shellQuote } = require('../../seedance-director/scripts/exec-utils');

// ============ 配置（v5.1-Peng: 接入配置中心） ============
let CONFIG, MODEL_PRIORITY, FALLBACK_ERRORS, MAX_CONCURRENT_DEFAULT, 
    RETRY_DELAY_MS, QUOTA_RETRY_DELAYS, BATCH_COOLDOWN_MS, 
    OUTPUT_ROOT, PROMPT_MAX_LENGTH, DEGRADATION_STEPS;

function initConfig() {
  const { CONFIG: cfg } = require('../../seedance-director/scripts/config-center');
  CONFIG = cfg;
  
  MODEL_PRIORITY = cfg.render.modelPriority.map((m, i) => ({ ...m, priority: i }));
  FALLBACK_ERRORS = ['400', '429', '500', '503', '模型不可用', 'service_tier', 
                     'insufficient_quota', 'rate_limit', 'model_not_found'];
  MAX_CONCURRENT_DEFAULT = cfg.render.maxConcurrent;
  RETRY_DELAY_MS = 5000;
  QUOTA_RETRY_DELAYS = cfg.render.retryDelays;
  BATCH_COOLDOWN_MS = cfg.render.batchCooldown;
  OUTPUT_ROOT = process.env.DIRECTOR_OUTPUT_ROOT || path.join(require('os').homedir(), '.openclaw/workspace/productions');
  PROMPT_MAX_LENGTH = cfg.render.promptMaxLength;
  DEGRADATION_STEPS = cfg.render.degradationSteps;
}

// 启动时初始化配置
initConfig();

// 查找 seedance-wrapper
const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');
const SEEDANCE_WRAPPER = path.join(WORKSPACE, 'skills/byted-ark-seedance-skill/scripts/seedance-wrapper.js');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function log(tag, msg, level = 'info') {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log(`[${ts}] [${tag}] ${msg}`);
}

// 🔴 v5.1-Peng: Prompt token估算（中文字符≈1token，英文≈1.5token）
function estimatePromptTokens(prompt) {
  if (!prompt) return 0;
  let tokens = 0;
  for (const char of prompt) {
    const code = char.charCodeAt(0);
    // CJK字符（中文/日文/韩文）≈1 token
    if (code >= 0x4e00 && code <= 0x9fff) tokens += 1;
    // ASCII字符
    else if (code < 128) tokens += 0.5;
    // 其他Unicode字符
    else tokens += 1;
  }
  // 英文单词额外计数（空格分隔的平均长度≈5字符≈1.5token）
  const englishWords = prompt.match(/[a-zA-Z]+/g) || [];
  tokens += englishWords.length * 0.3; // 已计数字符，额外单词开销
  
  return Math.ceil(tokens);
}

// 🔴 v5.1-Peng: Prompt长度安全检查
function validatePromptLength(prompt, maxLength = PROMPT_MAX_LENGTH) {
  const tokens = estimatePromptTokens(prompt);
  const length = prompt?.length || 0;
  
  if (length > maxLength) {
    log('RenderEngine', `⚠️ Prompt超长(${length}/${maxLength}字符, ~${tokens}tokens)，将截断`, 'warn');
    return { 
      valid: false, 
      prompt: prompt.substring(0, maxLength - 3) + '...', 
      originalLength: length,
      tokens 
    };
  }
  
  if (tokens > maxLength * 1.5) {
    log('RenderEngine', `⚠️ Prompt token估算偏高(~${tokens})，建议精简`, 'warn');
  }
  
  return { valid: true, prompt, length, tokens };
}

// 🔴 v5.1-Peng: 429降级策略 — 降低motionStrength + 缩短prompt
function applyDegradation(prompt, modelConfig, retryIndex) {
  const step = DEGRADATION_STEPS[Math.min(retryIndex, DEGRADATION_STEPS.length - 1)];
  if (!step) return { prompt, modelConfig };
  
  let degradedPrompt = prompt;
  let degradedModel = { ...modelConfig };
  
  // 缩短prompt
  if (step.promptTrim > 0 && degradedPrompt.length > step.promptTrim + 10) {
    degradedPrompt = degradedPrompt.substring(0, degradedPrompt.length - step.promptTrim) + '...';
    log('RenderEngine', `🔧 降级: prompt缩短${step.promptTrim}字符(${prompt.length}→${degradedPrompt.length})`, 'warn');
  }
  
  // 降低motionStrength
  if (step.motionStrength !== undefined) {
    degradedModel = { ...degradedModel, motionStrength: step.motionStrength };
    log('RenderEngine', `🔧 降级: motionStrength→${step.motionStrength}`, 'warn');
  }
  
  // 降低cfgScale
  if (step.cfgScale !== undefined) {
    degradedModel = { ...degradedModel, cfgScale: step.cfgScale };
    log('RenderEngine', `🔧 降级: cfgScale→${step.cfgScale}`, 'warn');
  }
  
  return { prompt: degradedPrompt, modelConfig: degradedModel };
}

// ============ 渲染片段合并算法 v4.1-Peng ============
function createRenderSegments(shots, plan) {
  const segments = [];
  let currentSegment = { shots: [], totalDuration: 0, id: '' };

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const shotDuration = shot.duration || 5;
    const isDialogueShot = shot.type?.includes('对白') || shot.description?.includes('对白');
    const isLongShot = shotDuration > 15;
    const actChange = currentSegment.shots.length > 0 &&
                       currentSegment.shots[currentSegment.shots.length - 1].act !== shot.act;
    const segmentFull = currentSegment.totalDuration + shotDuration > 15 ||
                        currentSegment.shots.length >= 6;

    if (currentSegment.shots.length > 0 && (segmentFull || actChange || isDialogueShot || isLongShot)) {
      if (currentSegment.totalDuration < 4 && !isLongShot && !isDialogueShot) {
        // 继续合并
      } else {
        currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
        segments.push(currentSegment);
        currentSegment = { shots: [], totalDuration: 0, id: '' };
      }
    }

    if (isLongShot || isDialogueShot) {
      if (currentSegment.shots.length > 0) {
        currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
        segments.push(currentSegment);
        currentSegment = { shots: [], totalDuration: 0, id: '' };
      }
      currentSegment.shots.push(shot);
      currentSegment.totalDuration = shotDuration;
      currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
      segments.push(currentSegment);
      currentSegment = { shots: [], totalDuration: 0, id: '' };
    } else {
      currentSegment.shots.push(shot);
      currentSegment.totalDuration += shotDuration;
    }
  }

  if (currentSegment.shots.length > 0) {
    currentSegment.id = `SEG${String(segments.length + 1).padStart(2, '0')}`;
    segments.push(currentSegment);
  }

  for (let i = 0; i < segments.length; i++) {
    if (segments[i].totalDuration < 4 && segments[i].shots.length < 6) {
      if (i + 1 < segments.length &&
          segments[i].shots[0].act === segments[i + 1].shots[0].act &&
          segments[i].totalDuration + segments[i + 1].totalDuration <= 15) {
        segments[i].shots.push(...segments[i + 1].shots);
        segments[i].totalDuration += segments[i + 1].totalDuration;
        segments.splice(i + 1, 1);
        i--;
      }
    }
  }

  for (const segment of segments) {
    segment.isMultiShot = shouldUseMultiShot(segment.shots);
  }

  log('RenderEngine', `🎬 渲染片段合并: ${shots.length}个镜头 → ${segments.length}个片段`, 'success');
  for (const seg of segments) {
    const shotIds = seg.shots.map(s => s.id).join('+');
    const mode = seg.isMultiShot ? '🎬[Multi-Shot]' : '📷[单镜头]';
    log('RenderEngine', `   ${seg.id}: ${seg.totalDuration}秒 ${mode} (${shotIds})`, 'info');
  }

  return segments;
}

function shouldUseMultiShot(shots) {
  if (shots.length <= 1) return false;
  const hasDialogue = shots.some(s => s.type?.includes('对白') || s.description?.includes('对白'));
  const hasSceneChange = shots.some((s, i) => i > 0 && s.act !== shots[i - 1].act);
  const hasComplexMultiChar = shots.some(s => (s.characters || []).length > 3);
  const hasVeryLongShot = shots.some(s => (s.duration || 5) > 12);
  return !hasDialogue && !hasSceneChange && !hasComplexMultiChar && !hasVeryLongShot;
}

// 生成多镜头片段提示词
function generateSegmentPrompt(segment, plan, refsMap, promptEnhancements) {
  const styleManifesto = plan?.styleManifesto || '写实风格';
  const lighting = plan?.lightingThreeLayer || '自然光';
  const styleNote = styleManifesto.length > 20 ? styleManifesto.split('，')[0] || styleManifesto.substring(0, 30) : styleManifesto;
  const lightingShort = lighting.split('，')[0] || lighting;
  
  let prompt = '';
  let currentTime = 0;
  
  for (let i = 0; i < segment.shots.length; i++) {
    const shot = segment.shots[i];
    const start = currentTime;
    const end = currentTime + (shot.duration || 5);
    const shotPrompt = generateShotPrompt(shot, plan, (refsMap || {})[shot.id] || [], (promptEnhancements || {})[shot.id] || '');
    if (i > 0) prompt += '；镜头切换：';
    prompt += `${start}-${end}s：${shotPrompt}`;
    currentTime = end;
  }
  
  prompt += `，${styleNote}，${lightingShort}光影，电影级运镜`;
  if (prompt.length > 380) prompt = prompt.replace(/；镜头切换：/g, '；');
  return prompt;
}

function generateShotPrompt(shot, plan, refs, dialogueEnhancement) {
  const styleManifesto = plan?.styleManifesto || '写实风格';
  const videoType = plan?.videoType || 'action';
  const styleNote = styleManifesto.length > 20 ? styleManifesto.split('，')[0] || styleManifesto.substring(0, 30) : styleManifesto;
  
  // 🔴 v5.1-Peng: 角色视觉签名注入
  let characterVisualNote = '';
  const shotChars = shot.characters || [];
  if (shotChars.length > 0 && plan?.characters) {
    const charDescriptions = [];
    for (const charName of shotChars) {
      const charData = plan.characters.find(c => c.name === charName);
      if (charData) {
        const parts = [];
        if (charData.species) parts.push(charData.species);
        if (charData.features && charData.features.length > 0) parts.push(charData.features.join('，'));
        if (charData.signature) parts.push(charData.signature);
        if (parts.length > 0) {
          charDescriptions.push(`${charName}(${parts.join('，')})`);
        }
      }
    }
    if (charDescriptions.length > 0) {
      characterVisualNote = `角色形象：${charDescriptions.join('；')}。`;
    }
  }
  
  let subjectDesc = shot.description || '';
  // 🔴 v5.3-Peng-fix: 彻底删除有缺陷的外貌过滤逻辑
  //    原逻辑把"手持""身穿"等战斗描述整句误删，导致 prompt 只剩"参考图+风格"
  //    参考图只作为角色一致性辅助，绝不替代文字描述
  if (subjectDesc.length > 100) subjectDesc = subjectDesc.substring(0, 100) + '...';
  
  const cameraDesc = shot.camera || '';
  const shotSize = cameraDesc.match(/(特写|近景|中景|全景|远景|大全景)/)?.[0] || '';
  const cameraMove = cameraDesc.match(/(推|拉|摇|移|跟|升|降|环绕|航拍|手持|固定)/)?.[0] || '';
  const lensNote = [shotSize, cameraMove].filter(Boolean).join('，');
  
  const lighting = plan?.lightingThreeLayer || '自然光';
  const lightingShort = lighting.split('，')[0] || lighting;
  
  let refNote = '';
  if ((refs || []).length > 0) refNote = `参考${refs.length}张角色图片，`;
  
  let dialogueNote = '';
  if (dialogueEnhancement) {
    const clean = dialogueEnhancement.startsWith('，') ? dialogueEnhancement.slice(1) : dialogueEnhancement;
    dialogueNote = clean.length > 50 ? clean.substring(0, 50) + '...' : clean;
  }
  
  const parts = [
    characterVisualNote,
    refNote, subjectDesc, lensNote ? `(${lensNote})` : '',
    dialogueNote ? `对白："${dialogueNote}"` : '',
    `${styleNote}，${lightingShort}光影`
  ].filter(Boolean);
  
  let prompt = parts.join('，').replace(/，{2,}/g, '，');
  if (prompt.length > 400) prompt = prompt.substring(0, 400) + '...';
  
  // 🔴 v5.1-Peng: Token安全验证
  const validation = validatePromptLength(prompt);
  return validation.prompt;
}

// 🔴 v5.1-Peng: 自动发现角色定妆照（Seedream生成）
function discoverCharacterRefs(productionDir, segment) {
  const charDir = path.join(productionDir, '03-characters');
  if (!fs.existsSync(charDir)) return [];
  
  const refs = [];
  const files = fs.readdirSync(charDir);
  
  for (const shot of segment.shots) {
    const shotChars = shot.characters || [];
    for (const charName of shotChars) {
      // 查找匹配角色名的图片文件（支持：角色名-全身.png、角色名-特写.png等）
      const matched = files.filter(f => {
        const base = path.basename(f, path.extname(f));
        return base.includes(charName) && /\.(png|jpg|jpeg|webp)$/i.test(f);
      });
      for (const m of matched) {
        const fullPath = path.join(charDir, m);
        if (!refs.includes(fullPath)) refs.push(fullPath);
      }
    }
  }
  
  return refs;
}

// ============ 主渲染函数 ============
async function render(segmentsData, options = {}) {
  const {
    productionDir,
    skipRender = false,
    seed = Math.floor(Math.random() * 2147483647),
    maxConcurrent = MAX_CONCURRENT_DEFAULT,
    generateAudio = true  // 🔴 v5.3-Peng-fix: 默认开启音频生成（原hasDialogueFn=null导致无声）
  } = options;
  
  const rawDir = path.join(productionDir, '05-raw-shots');
  ensureDir(rawDir);
  
  log('RenderEngine', `🎬 开始批量渲染: ${segmentsData.length}个片段...`, 'phase');
  log('RenderEngine', `🎲 统一风格种子: ${seed}`, 'info');
  
  if (!fs.existsSync(SEEDANCE_WRAPPER)) {
    throw new Error(`seedance-wrapper.js 未找到: ${SEEDANCE_WRAPPER}`);
  }
  
  if (skipRender) {
    log('RenderEngine', '⚠️ 跳过渲染模式，只生成命令', 'warn');
  }
  
  const tasks = [];
  for (let i = 0; i < segmentsData.length; i += maxConcurrent) {
    const batch = segmentsData.slice(i, i + maxConcurrent);
    log('RenderEngine', `批次 ${Math.floor(i/maxConcurrent)+1}/${Math.ceil(segmentsData.length/maxConcurrent)}`, 'progress');
    
    const batchPromises = batch.map(async ({ segment, prompt, refs }) => {
      let lastError = null;
      
      for (let modelIdx = 0; modelIdx < MODEL_PRIORITY.length; modelIdx++) {
        const modelConfig = MODEL_PRIORITY[modelIdx];
        const is2Point0 = modelConfig.id.includes('doubao-seedance-2-0');
        const cmdParts = [
          'node', SEEDANCE_WRAPPER, 'create',
          '--prompt', `"${(prompt || '').replace(/"/g, '\\"')}"`,
          '--model', `"${modelConfig.id}"`,
          '--seed', String(seed),
          '--ratio', '"16:9"'
        ];
        if (!is2Point0) cmdParts.push('--service-tier', '"flex"');
        cmdParts.push('--duration', String(segment.totalDuration || 5));
        
        const hasCameraMove = segment.shots.some(s => /(推|拉|摇|移|跟|升|降|环绕|航拍|变焦|甩镜)/.test(s.camera || ''));
        if (hasCameraMove) cmdParts.push('--camera-fixed', '"false"');
        
        // 🔴 v5.3-Peng-fix: 默认开启音频生成
        if (generateAudio) {
          cmdParts.push('--generate-audio');
        }
        
        const uniqueRefs = [...new Set(refs || [])];
        
        // 🔴 v5.1-Peng: 自动注入角色定妆照
        const charRefs = discoverCharacterRefs(productionDir, segment);
        for (const charRef of charRefs) {
          if (!uniqueRefs.includes(charRef)) uniqueRefs.push(charRef);
        }
        if (charRefs.length > 0) {
          log('RenderEngine', `🎭 ${segment.id} 注入${charRefs.length}张角色定妆照`, 'info');
        }
        
        for (const ref of uniqueRefs) cmdParts.push('--image-file', `"${ref}"`);
        
        const cmd = cmdParts.join(' ');
        
        if (skipRender) {
          const cmdFile = path.join(rawDir, `${segment.id}-command.sh`);
          fs.writeFileSync(cmdFile, `#!/bin/bash\n${cmd}\n`);
          log('RenderEngine', `📝 ${segment.id} 命令已保存`, 'info');
          return { segment, taskId: `DRY-RUN-${segment.id}`, status: 'dry-run', prompt, cmd };
        }
        
        try {
          // 🔴 v5.1-Peng: 应用降级策略（如果这不是第一次尝试）
          let currentPrompt = prompt;
          let currentModel = modelConfig;
          
          // 检查是否有之前的429重试记录
          const retryCount = segment._429RetryCount || 0;
          if (retryCount > 0) {
            const degraded = applyDegradation(currentPrompt, currentModel, retryCount - 1);
            currentPrompt = degraded.prompt;
            currentModel = degraded.modelConfig;
          }
          
          log('RenderEngine', `⏳ ${segment.id} 尝试 ${currentModel.name}...`, 'progress');
          const output = await execAsync(cmd, { encoding: 'utf8', timeout: 30000 });
          const match = output.match(/任务 ID:\s*(cgt-[a-z0-9-]+)/i);
          const taskId = match ? match[1] : null;
          
          if (taskId) {
            log('RenderEngine', `✅ ${segment.id} 已提交 (${taskId})`, 'success');
            return { segment, taskId, status: 'submitted', prompt: currentPrompt, model: currentModel.name };
          }
          throw new Error('未能提取任务ID');
        } catch (e) {
          lastError = e;
          const errorMsg = e.message || '';
          
          // 🔴 v5.1-Peng: 429配额超限 → 指数退避 + 降级重试
          if (errorMsg.includes('429') || errorMsg.includes('QuotaExceeded') || errorMsg.includes('TooManyRequests')) {
            const retryDelay = QUOTA_RETRY_DELAYS[Math.min(modelIdx, QUOTA_RETRY_DELAYS.length - 1)];
            const retryCount = segment._429RetryCount || 0;
            
            if (retryCount < DEGRADATION_STEPS.length) {
              segment._429RetryCount = retryCount + 1;
              log('RenderEngine', `⚠️ ${segment.id} 429配额超限(第${retryCount+1}次)，${retryDelay/1000}s后降级重试...`, 'warn');
              await sleep(retryDelay);
              // 不切换模型，应用降级后重试
              modelIdx--; // 抵消for循环的++
              continue;
            } else {
              log('RenderEngine', `❌ ${segment.id} 429重试耗尽(${retryCount}次)，切换模型...`, 'error');
            }
          }
          
          const matchedError = FALLBACK_ERRORS.find(errCode => errorMsg.includes(errCode));
          if (matchedError && modelIdx < MODEL_PRIORITY.length - 1) {
            log('RenderEngine', `⚠️ ${segment.id} ${modelConfig.name} 不可用，降级...`, 'warn');
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          break;
        }
      }
      
      log('RenderEngine', `❌ ${segment.id} 提交失败: ${lastError?.message}`, 'error');
      return { segment, taskId: null, status: 'failed', error: lastError?.message, prompt };
    });
    
    const batchResults = await Promise.all(batchPromises);
    tasks.push(...batchResults);
    if (i + maxConcurrent < segmentsData.length) await sleep(BATCH_COOLDOWN_MS);
  }
  
  // 轮询下载
  log('RenderEngine', '开始轮询...', 'progress');
  let completed = 0, failed = 0;
  let pending = tasks.filter(t => t.status === 'submitted');
  
  while (pending.length > 0) {
    log('RenderEngine', `轮询: 完成${completed} 失败${failed} 待处理${pending.length}`, 'progress');
    
    const checkPromises = pending.map(async (task) => {
      try {
        const output = await execAsync(`node ${SEEDANCE_WRAPPER} get --task-id ${task.taskId}`, { encoding: 'utf8', timeout: 10000 });
        
        if (output.includes('状态: 成功') || output.includes('✅')) {
          const urlMatch = output.match(/https:\/\/[^\s]+\.mp4[^\s]*/);
          const videoUrl = urlMatch ? urlMatch[0] : null;
          
          if (videoUrl) {
            const segmentFile = path.join(rawDir, `${task.segment.id}.mp4`);
            try {
              await execAsync(`curl -L -o ${shellQuote(segmentFile)} ${shellQuote(videoUrl)}`, { timeout: 60000 });
              let cutResults;
              
              // 🛡️ v5.1-Peng: 统一精确切分，无论MultiShot与否
              cutResults = await cutSegmentToShots(segmentFile, task.segment, rawDir);
              
              return { ...task, status: 'completed', videoUrl, localPath: segmentFile, cutResults };
            } catch (e) {
              return { ...task, status: 'failed', error: `下载或切分失败: ${e.message}` };
            }
          }
          return { ...task, status: 'completed', videoUrl };
        } else if (output.includes('失败') || output.includes('❌')) {
          return { ...task, status: 'failed', error: '渲染失败' };
        }
        return task;
      } catch (e) { return task; }
    });
    
    const results = await Promise.all(checkPromises);
    completed = results.filter(r => r.status === 'completed').length;
    failed = results.filter(r => r.status === 'failed').length;
    pending = results.filter(r => r.status === 'submitted');
    if (pending.length > 0) await sleep(30000);
  }
  
  log('RenderEngine', `✅ 渲染完成: ${completed}成功, ${failed}失败`, 'success');
  
  const report = tasks.map(t => ({
    segmentId: t.segment.id,
    shotIds: t.segment.shots.map(s => s.id),
    status: t.status,
    videoUrl: t.videoUrl,
    localPath: t.localPath,
    cutResults: t.cutResults || [],
    error: t.error
  }));
  
  fs.writeFileSync(path.join(rawDir, 'render-report.json'), JSON.stringify(report, null, 2));
  return report;
}

// 精确切分
async function cutSegmentToShots(segmentFile, segment, rawDir) {
  const results = [];
  let currentTime = 0;
  
  for (let i = 0; i < segment.shots.length; i++) {
    const shot = segment.shots[i];
    const shotDuration = shot.duration || 5;
    const startSec = currentTime;
    const shotFile = path.join(rawDir, `${shot.id}.mp4`);
    
    try {
      // 🛡️ v5.1-Peng: 精确切分 — -ss after -i + re-encode，避免copy模式的关键帧漂移
      const cmd = `ffmpeg -y -i ${shellQuote(segmentFile)} -ss ${startSec} -t ${shotDuration} -vf "scale=1280:720" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k ${shellQuote(shotFile)} 2>> /tmp/ffmpeg-cut.log`;
      // 🔴 v5.3-Peng-fix: 原-an丢弃音频轨道，改为保留音频（-c:a aac -b:a 192k）
      await execAsync(cmd, { timeout: 60000 });
      
      if (fs.existsSync(shotFile)) {
        const stats = fs.statSync(shotFile);
        log('RenderEngine', `✂️ ${shot.id} 切分完成`, 'success');
        results.push({ shotId: shot.id, segmentId: segment.id, start: startSec, duration: shotDuration, file: shotFile, size: stats.size });
      } else {
        throw new Error('切分后文件不存在');
      }
    } catch (e) {
      log('RenderEngine', `❌ ${shot.id} 切分失败: ${e.message}`, 'error');
      results.push({ shotId: shot.id, segmentId: segment.id, error: e.message });
    }
    
    currentTime += shotDuration;
  }
  
  return results;
}

// ============ CLI ============
function parseArgs() {
  const args = {};
  for (let i = 3; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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
    case 'render': {
      if (!args.productionDir && !args.segmentsJson) {
        console.error('❌ 需要 --production-dir 或 --segments-json');
        process.exit(1);
      }
      
      let segmentsData;
      if (args.segmentsJson) {
        const data = JSON.parse(fs.readFileSync(args.segmentsJson, 'utf8'));
        segmentsData = (data.segments || data).map(s => {
          const actualSegment = s.segment || s;
          return {
            segment: actualSegment,
            prompt: s.prompt || actualSegment.prompt || '',
            refs: s.refs || actualSegment.refs || []
          };
        });
      } else {
        // 从生产目录读取
        const promptsDir = path.join(args.productionDir, '04-prompts');
        const segmentsFile = path.join(args.productionDir, '04-segments.json');
        if (fs.existsSync(segmentsFile)) {
          const data = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
          segmentsData = (data.segments || data).map(s => {
          const actualSegment = s.segment || s;
          return {
            segment: actualSegment,
            prompt: s.prompt || actualSegment.prompt || '',
            refs: s.refs || actualSegment.refs || []
          };
        });
        } else {
          console.error('❌ 未找到片段定义文件');
          process.exit(1);
        }
      }
      
      const report = await render(segmentsData, {
        productionDir: args.productionDir || path.dirname(args.segmentsJson),
        skipRender: args.skipRender === true || args.skipRender === 'true',
        seed: parseInt(args.seed) || undefined,
        maxConcurrent: parseInt(args.maxConcurrent) || MAX_CONCURRENT_DEFAULT
      });
      
      console.log(`\n✅ 渲染完成: ${report.filter(t => t.status === 'completed').length}/${report.length}`);
      break;
    }
    
    case 'help':
    default:
      console.log(`
Seedance Render Engine v1.0-Peng

用法:
  node seedance-render-engine.js render --production-dir <dir> [options]
  node seedance-render-engine.js render --segments-json <file> [options]

选项:
  --production-dir   生产目录（读取 04-prompts/，输出到 05-raw-shots/）
  --segments-json    片段定义 JSON 文件
  --skip-render      跳过真实渲染（dry-run）
  --seed             统一风格种子
  --max-concurrent   最大并发数（默认1）
`);
  }
}

main().catch(e => {
  console.error(`\n❌ 错误: ${e.message}`);
  process.exit(1);
});
