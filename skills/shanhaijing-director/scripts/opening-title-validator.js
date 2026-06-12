/**
 * 🎬 开场标题结构校验器 - Opening Title Validator v1.0-Peng
 *
 * 在 opening-title-designer.js 生成 phases 后自动调用
 * 拦截6类结构矛盾：
 * 1. 时态互斥检测（同一角色不能有两个互斥的"首次出现"时间）
 * 2. 空间重叠检测（BeastEntrance Full Reveal 占比 vs TitleEffect 位置）
 * 3. 零时长检测（duration 必须 > 0）
 * 4. 空白间隔检测（相邻 phases 之间不能有未标注的 gap > 0.3s）
 * 5. 旁白与画面时序检测（voice-first 时 Transition 不能是 hard cut from scene）
 * 6. 镜头语言一致性检测（Camera 描述中的角色位置必须与 Entrance 时序一致）
 *
 * 输出：{ valid: boolean, errors: [{ type, severity, message, field }] }
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析时间字符串 "3.0-5.5s" → { start: 3.0, end: 5.5 }
 */
function parseTimeRange(str) {
  const m = str.trim().match(/^([\d.]+)\s*-\s*([\d.]+)\s*s$/);
  if (!m) return null;
  return { start: parseFloat(m[1]), end: parseFloat(m[2]) };
}

/**
 * 主校验函数
 * @param {Object} designData - opening-title-designer.js 输出的完整设计数据
 * @param {Object} options
 * @param {string} options.cameraDescription - Camera 字段描述（用于检测角色位置一致性）
 * @param {string} options.transitionDescription - Transition 字段描述
 * @param {string} options.audioLayerDescription - AudioLayer 字段描述
 * @returns {{ valid: boolean, errors: Array, warnings: Array }}
 */
function validateOpeningTitle(designData, options = {}) {
  const errors = [];
  const warnings = [];

  const {
    cameraDescription = '',
    transitionDescription = '',
    audioLayerDescription = ''
  } = options;

  // ===== 1. 零时长检测（所有 phases） =====
  const allPhases = [
    ...(designData.beastEntrance?.phases || []),
    ...(designData.xiaoGEntrance?.phases || []),
    ...(designData.titleEffect?.titleEffect?.phases || []),
    ...(designData.titleEffect?.subtitleEffect?.phases || [])
  ];

  for (const phase of allPhases) {
    if (!phase.time) continue;
    const range = parseTimeRange(phase.time);
    if (!range) {
      errors.push({
        type: 'INVALID_TIME_FORMAT',
        severity: '🔴',
        field: phase.name || 'unknown',
        message: `Phase "${phase.name}" has invalid time format: "${phase.time}". Expected "X.X-Y.Ys"`
      });
      continue;
    }
    const duration = range.end - range.start;
    if (duration <= 0) {
      errors.push({
        type: 'ZERO_DURATION',
        severity: '🔴',
        field: phase.name,
        message: `Phase "${phase.name}" has ZERO duration (${phase.time}). Duration must be > 0. Suggested: ${range.start}-${(range.end + 0.5).toFixed(1)}s`
      });
    } else if (duration < 0.3) {
      warnings.push({
        type: 'SHORT_DURATION',
        severity: '🟡',
        field: phase.name,
        message: `Phase "${phase.name}" duration ${duration}s is very short (<0.3s). Consider expanding for visual clarity.`
      });
    }
  }

  // ===== 2. 空白间隔检测 =====
  const gaps = _detectGaps(allPhases, designData.totalDuration || 8.0);
  for (const gap of gaps) {
    errors.push({
      type: 'UNANNOTATED_GAP',
      severity: '🔴',
      field: 'Timeline',
      message: `Gap of ${gap.duration}s (${gap.start}s-${gap.end}s) has no phase annotation. Add a phase or gap-fill annotation.`
    });
  }

  // ===== 3. 时态互斥检测 =====
  const xiaoGFirstAppearance = _getFirstAppearance(allPhases, 'xiaoG', ['xiaoGEntrance', 'XiaoGEntrance']);
  const xiaoGCameraMention = _getCameraMention(cameraDescription, 'xiaoG');

  if (xiaoGFirstAppearance && xiaoGCameraMention) {
    const camTime = xiaoGCameraMention.time || 0;
    const gap = Math.abs(xiaoGFirstAppearance - camTime);
    if (gap > 1.0) {
      errors.push({
        type: 'TEMPORAL_CONFLICT',
        severity: '🔴',
        field: 'xiaoGEntrance',
        message: `xiaoG temporal conflict: Camera describes xiaoG at ${camTime}s but xiaoGEntrance first appears at ${xiaoGFirstAppearance}s (gap: ${gap.toFixed(1)}s). Solution: Either (A) set xiaoGEntrance first phase time <= camera time, or (B) remove "xiaoG" from Camera description and use "from mountain foot" instead.`
      });
    }
  }

  // ===== 4. 空间重叠检测 =====
  const beastReveal = (designData.beastEntrance?.phases || [])
    .find(p => p.name === 'Full Reveal' || p.name === '完全呈现');
  const titlePhases = designData.titleEffect?.titleEffect?.phases || [];

  if (beastReveal) {
    const beastRange = parseTimeRange(beastReveal.time);
    const titleStart = designData.titleEffect?.titleEffect?.start ||
                       (titlePhases[0] ? parseTimeRange(titlePhases[0].time)?.start : null);

    if (beastRange && titleStart !== null && titleStart !== undefined) {
      // 重叠窗口
      const overlapStart = Math.max(beastRange.start, titleStart);
      const beastEnd = beastRange.end;
      const titleEnd = titlePhases.length > 0
        ? parseTimeRange(titlePhases[titlePhases.length - 1].time)?.end || titleStart + 2
        : titleStart + 2;

      if (overlapStart < Math.min(beastEnd, titleEnd)) {
        // 有时间重叠，检查空间描述
        const beastDesc = (beastReveal.description || '').toLowerCase();
        const beastOccupancy = _extractPercentage(beastDesc);
        const hasPositioning = beastDesc.includes('center') ||
                              beastDesc.includes('left') ||
                              beastDesc.includes('right') ||
                              beastDesc.includes('quadrant');

        if (beastOccupancy && beastOccupancy >= 70 && !hasPositioning) {
          errors.push({
            type: 'SPATIAL_CONFLICT',
            severity: '🔴',
            field: 'BeastEntrance / TitleEffect',
            message: `Beast Full Reveal occupies ${beastOccupancy}% frame at same time as Title (${overlapStart}s overlap). Risk: title overlaps beast. Fix: reduce beast occupancy to <=55% OR add spatial positioning (e.g., "center-right") to BeastEntrance AND add "UPPER-LEFT" to TitleEffect phases.`
          });
        }
      }
    }
  }

  // ===== 5. 旁白与画面时序检测 =====
  const hasVoiceFirst = /screen dark|black screen|voice first|音先|黑屏/i.test(audioLayerDescription);
  const hasHardCutFromScene = /hard cut.*scene|hard cut from/i.test(transitionDescription.toLowerCase());

  if (hasVoiceFirst && hasHardCutFromScene) {
    errors.push({
      type: 'TRANSITION_CONFLICT',
      severity: '🔴',
      field: 'Transition / AudioLayer',
      message: `Transition says "HARD CUT from [scene]" but AudioLayer says "voice first / screen dark" — mutually exclusive. If voice starts at 0s with black screen, Transition must be "HARD CUT from black screen", not "from scene".`
    });
  }

  // ===== 6. Camera 角色时态一致性（更细粒度）=====
  // 检测 Camera 描述中引用的角色是否在对应时间才出现在 Entrance phases
  const cameraRefs = _extractCharacterRefs(cameraDescription);
  for (const [char, refTime] of Object.entries(cameraRefs)) {
    const entrancePhases = allPhases.filter(p =>
      (p.name || '').toLowerCase().includes(char.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(char.toLowerCase())
    );
    if (entrancePhases.length === 0) continue; // Camera 没提这个角色，跳过

    const firstAppear = _getFirstAppearance(allPhases, char, []);
    if (firstAppear !== null && refTime !== null && refTime < firstAppear - 0.5) {
      errors.push({
        type: 'CAMERA_ENTRANCE_MISMATCH',
        severity: '🔴',
        field: 'Camera',
        message: `Camera describes "${char}" at ${refTime}s but ${char}'s entrance phases start at ${firstAppear}s. Camera cannot reference a character before they appear. Fix: change Camera time to >= ${firstAppear}s or delay ${char}'s entrance to <= ${refTime}s.`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      checksPassed: 6 - (errors.length > 0 ? 1 : 0) // approximate
    }
  };
}

// ===== 辅助函数 =====

function _detectGaps(phases, totalDuration) {
  const gaps = [];
  // 按 start 时间排序
  const sorted = phases
    .map(p => ({ time: p.time, range: parseTimeRange(p.time) }))
    .filter(p => p.range)
    .sort((a, b) => a.range.start - b.range.start);

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].range.end;
    const gapEnd = sorted[i + 1].range.start;
    if (gapEnd - gapStart > 0.3) {
      gaps.push({ start: gapStart, end: gapEnd, duration: gapEnd - gapStart });
    }
  }

  // 检查末尾到 totalDuration
  if (sorted.length > 0) {
    const lastEnd = sorted[sorted.length - 1].range.end;
    if (totalDuration - lastEnd > 0.3) {
      gaps.push({ start: lastEnd, end: totalDuration, duration: totalDuration - lastEnd });
    }
  }

  return gaps;
}

function _getFirstAppearance(phases, charName, sections) {
  const relevant = phases.filter(p => {
    const inName = (p.name || '').toLowerCase().includes(charName.toLowerCase());
    const inDesc = (p.description || '').toLowerCase().includes(charName.toLowerCase());
    return inName || inDesc;
  });
  if (relevant.length === 0) return null;
  const ranges = relevant.map(p => parseTimeRange(p.time)).filter(Boolean).sort((a, b) => a.start - b.start);
  return ranges[0]?.start ?? null;
}

function _getCameraMention(cameraDesc, charName) {
  // 简单匹配：camera 描述中提到 "xiaoG" 或 "小G" 在 "X s" 的时间点
  const lower = cameraDesc.toLowerCase();
  const charLower = charName.toLowerCase();
  if (!lower.includes(charLower)) return { time: null };
  // 尝试匹配 "at Xs" 或 "from Xs"
  const m = cameraDesc.match(/(\d+\.?\d*)\s*s/);
  return { time: m ? parseFloat(m[1]) : 0 };
}

function _extractPercentage(desc) {
  const m = desc.match(/(\d+)\s*%/);
  return m ? parseInt(m[1]) : null;
}

function _extractCharacterRefs(cameraDesc) {
  const refs = {};
  // 匹配 camera 描述中的角色名
  const charPatterns = ['xiaoG', '小G', '白泽', 'baize', 'Baize'];
  for (const char of charPatterns) {
    if (cameraDesc.toLowerCase().includes(char.toLowerCase())) {
      const m = cameraDesc.match(/(\d+\.?\d*)\s*s/);
      refs[char] = m ? parseFloat(m[1]) : 0;
    }
  }
  return refs;
}

/**
 * 便捷封装：在 opening-title-designer.js 中生成 phases 后调用此函数
 * @param {Object} designData - 完整设计数据
 * @param {Object} promptFields - 提示词各字段（用于校验）
 */
function validate(designData, promptFields = {}) {
  const result = validateOpeningTitle(designData, {
    cameraDescription: promptFields.Camera || promptFields.camera || '',
    transitionDescription: promptFields.Transition || promptFields.transition || '',
    audioLayerDescription: promptFields.AudioLayer || promptFields.audioLayer || ''
  });

  if (!result.valid) {
    console.error('\n🔴 [OpeningTitleValidator] STRUCTURAL ERRORS DETECTED:');
    for (const err of result.errors) {
      console.error(`   ${err.severity} [${err.type}] ${err.field}: ${err.message}`);
    }
  }

  if (result.warnings.length > 0) {
    console.warn('\n🟡 [OpeningTitleValidator] WARNINGS:');
    for (const w of result.warnings) {
      console.warn(`   ${w.severity} [${w.type}] ${w.field}: ${w.message}`);
    }
  }

  if (result.valid) {
    console.log('✅ [OpeningTitleValidator] All checks passed.');
  }

  return result;
}

module.exports = { validate, validateOpeningTitle };
