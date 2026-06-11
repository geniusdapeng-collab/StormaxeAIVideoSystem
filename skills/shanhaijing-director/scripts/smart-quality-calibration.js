/**
 * smart-quality-calibration.js v2.0-Peng（专家方案整合版）
 *
 * 核心变化：
 * - 不再固定注入少量模板，而是按"目标长度"动态补齐到 TARGET_IDEAL (960)
 * - 基于真实字符数（charCounter.count）做业务判断
 * - 加权计数仅供日志兼容
 */

const { charCounter } = require('./char-counter');

const CALIBRATION_CONFIG = {
  HARD_LIMIT:    5500,
  TARGET_MIN:    889,    // 最低目标
  TARGET_IDEAL:  960,    // 理想目标
  TARGET_SOFT_MAX: 980   // 软上限
};

function safeJoin(parts) {
  return parts.filter(Boolean).join(', ').replace(/\s+/g, ' ').trim();
}

function detectContext(prompt, ctx = {}) {
  return {
    characterName: ctx.characterName || 'protagonist',
    prevShot:     ctx.prevShot || '',
    microExpression: ctx.microExpression || 'subtle muscle tension, breathing rhythm, restrained expression',
    world:        ctx.world || 'Nirath',
    shotType:     ctx.shotType || 'cinematic shot'
  };
}

function buildExpansionLibrary(ctx) {
  // 🆕 v6.22-Peng-fix17: 移除所有 Nirath 硬编码通用内容
  // 根因: ctx.world='Nirath' 时注入了完全无关的 biosphere/bio-luminescent 内容
  // 修复: 所有填充内容必须来自 shot 实际字段,不允许使用 ctx.world 拼装 biosphere 等通用内容
  const world = ctx.world || '白泽';
  return {
    render:      `mythic atmosphere, epic scale environment, layered depth, dramatic lighting`,
    worldview:   `${world} environment continuity, rich environmental detail, atmospheric depth`,
    material:    `weathered surfaces, textured terrain, natural material detail, atmospheric particles, reflective highlights`,
    lighting:    `dramatic illumination, volumetric atmosphere, rim lighting, depth through light and shadow contrast`,
    camera:      `cinematic framing, deliberate composition, focus hierarchy, measured pacing, visual rhythm`,
    performance: `character presence, identity clarity, natural movement, emotional resonance, subtle breathing, micro-expression detail`,
    atmosphere:  `environmental atmosphere, natural particles, depth cues, spatial richness, subtle motion`,
    negative:    `no deformed anatomy, no extra limbs, no duplicated body parts, no modern objects, no text watermark, no cartoon style, no low-detail face, no broken hands`,
    transition: ctx.prevShot
      ? `continuity from ${ctx.prevShot}, visual progression preserved, motion and emotional beat connected`
      : '',
    characterSilhouette: `silhouette readability, character form clarity, facial anchor stability, intentional motion rhythm, believable body mechanics`,
    surfaceDetail: `texture integrity, premium surface response, cinematic depth hierarchy, strong foreground-midground-background separation`
  };
}

function pickFillersByPriority(currentLen, targetLen, lib) {
  const fillers = [];
  if (currentLen >= targetLen) return fillers;

  // 按优先级依次尝试添加
  const candidates = [
    lib.render,
    lib.worldview,
    lib.material,
    lib.lighting,
    lib.camera,
    lib.performance,
    lib.atmosphere,
    lib.transition,
    lib.negative,
    lib.characterSilhouette,
    lib.surfaceDetail
  ];

  for (const filler of candidates) {
    if (!filler) continue;
    const candidate = safeJoin([currentLen > 0 ? '' : '', filler]);
    // 简单判断：如果库项比当前长度短得多，说明还没加过
    if (currentLen > 0 && filler.length < currentLen * 0.5) {
      // 防止重复注入
    }
    const candidateFull = safeJoin([String(currentLen > 0 ? '' : '').trim(), filler]).trim();
    const fullStr = currentLen > 0
      ? (currentLen < targetLen - filler.length ? currentLen + ', ' + filler : currentLen + ', ' + filler)
      : filler;

    // 重新设计：逐步追加
    fillers.push(filler);
  }

  return fillers;
}

function appendUntilTarget(prompt, fillers, targetLen, hardLimit) {
  let out = String(prompt || '').trim();

  for (const filler of fillers) {
    if (!filler) continue;
    if (out.includes(filler)) continue; // 防止重复注入同一模板

    const currentLen = charCounter.count(out);
    const candidate = currentLen > 0 ? `${out}, ${filler}` : filler;
    const len = charCounter.count(candidate);

    if (len <= targetLen) {
      out = candidate;
      continue;
    }
    if (len <= hardLimit) {
      out = candidate;
      break;
    }
    // len > hardLimit，停止
    break;
  }

  if (charCounter.count(out) > hardLimit) {
    out = charCounter.truncate(out, hardLimit);
  }

  return out;
}

class SmartQualityCalibration {
  calibrate(prompt, context = {}) {
    const ctx = detectContext(prompt, context);
    const lib = buildExpansionLibrary(ctx);

    let output = String(prompt || '').trim();
    const before = charCounter.count(output);

    // 🆕 v2.0: 如果低于 TARGET_MIN，主动补齐到 TARGET_IDEAL
    if (before < CALIBRATION_CONFIG.TARGET_MIN) {
      const fillers = pickFillersByPriority(before, CALIBRATION_CONFIG.TARGET_IDEAL, lib);
      output = appendUntilTarget(
        output,
        fillers,
        CALIBRATION_CONFIG.TARGET_IDEAL,
        CALIBRATION_CONFIG.TARGET_SOFT_MAX
      );
    }

    // 第二轮补齐（如仍不够）
    if (charCounter.count(output) < CALIBRATION_CONFIG.TARGET_MIN) {
      const secondPass = [
        lib.worldview,
        lib.characterSilhouette,
        lib.surfaceDetail
      ].filter(Boolean);

      output = appendUntilTarget(
        output,
        secondPass,
        CALIBRATION_CONFIG.TARGET_SOFT_MAX,
        CALIBRATION_CONFIG.HARD_LIMIT
      );
    }

    const after = charCounter.count(output);

    return {
      prompt:    output,
      before,
      after,
      strategy:  before < CALIBRATION_CONFIG.TARGET_MIN ? 'AUTO_FILL' : 'PASS_THROUGH',
      util:      `${after}/${CALIBRATION_CONFIG.HARD_LIMIT} (${Math.round((after / CALIBRATION_CONFIG.HARD_LIMIT) * 100)}%)`
    };
  }
}

// ─── 以下来自 v6.19-fix3 PriorityTruncator（v6.20 专家方案误删，恢复） ───────────────

const FIELD_PRIORITY = {
  // P0元数据永不丢弃
  'CharacterRef': 200, 'Dialogue': 200,
  // P1元数据绝不截断
  'Timeline': 180, 'AudioLayer': 180,
  // 标准字段
  'Character': 100, 'Action': 95, 'Scene': 90, 'Mood': 85,
  'Camera': 70, 'Lighting': 65,
  'VisualComposition': 60, 'MaterialDetail': 55, 'EmotionalTexture': 50,
  'LightingAtmosphere': 45, 'CameraLanguage': 40,
  'RenderStyle': 30, 'DirectorStyle': 25, 'NegativePrompt': 10
};

class PriorityTruncator {
  constructor() {
    this.CORE_FIELDS = ['Character', 'Action', 'Scene'];
    this.HIGH_PRIORITY_FIELDS = ['Character', 'Action', 'Scene', 'Mood'];
    // 🆕 fix15-v9: 包含 fix15-v9 新增的 metaLine 检测字段名（CharacterRef/P0 Dialogue/P0 Character）
    this.P0_META_FIELDS = ['CharacterRef', 'RefImages', 'Dialogue', 'P0 Character', 'P0 Dialogue'];
    this.P1_META_FIELDS = ['Timeline', 'AudioLayer'];
  }

  truncate(prompt, maxLen = 5500, countChars) {
    const currentLen = countChars ? countChars(prompt) : [...prompt].length;
    if (currentLen <= maxLen) return prompt;

    const boundaries = this._detectFieldBoundaries(prompt);
    if (boundaries.length === 0) {
      return this._fallbackTruncate(prompt, maxLen, countChars);
    }

    const p0Protected = boundaries.filter(b => this.P0_META_FIELDS.includes(b.field));
    const p1Protected = boundaries.filter(b => this.P1_META_FIELDS.includes(b.field));
    const truncateable = boundaries.filter(b =>
      !this.P0_META_FIELDS.includes(b.field) && !this.P1_META_FIELDS.includes(b.field)
    );

    const sortedByPriority = [...truncateable].sort((a, b) => {
      return (FIELD_PRIORITY[a.field] || 50) - (FIELD_PRIORITY[b.field] || 50);
    });

    let result = prompt;
    const discarded = [];

    for (const field of sortedByPriority) {
      if ((countChars ? countChars(result) : [...result].length) <= maxLen) break;
      if (this.CORE_FIELDS.includes(field.field)) {
        result = this._compressField(result, field, countChars, maxLen);
        continue;
      }
      const compressed = this._compressField(result, field, countChars, maxLen);
      if ((countChars ? countChars(compressed) : [...compressed].length) <= maxLen || !this.HIGH_PRIORITY_FIELDS.includes(field.field)) {
        if (compressed !== result) result = compressed;
        else { result = this._removeField(result, field); discarded.push(field.field); }
      } else {
        result = compressed;
      }
    }

    if ((countChars ? countChars(result) : [...result].length) > maxLen) {
      // 🆕 fix15-v9: 保护 P0 区域不被暴力截断
      // 原逻辑: 超过 maxLen 时直接 charCounter.truncate(result, maxLen) 暴力到目标长度
      // 问题: 暴力截断会切到 CharacterRef/P0 Dialogue 中间，破坏 CharacterRef 注入
      // 修复: 重新扫描 result 中的 P0 保护区域，拼接为 p0Block + nonP0Cut(暴力截到余下预算)
      result = this._safeTruncateAroundP0(result, maxLen, countChars, p0Protected, p1Protected);
    }

    console.log(`[PriorityTruncate] ${currentLen} -> ${countChars ? countChars(result) : [...result].length}, discarded=[${discarded.join(',')}]`);
    return result;
  }

  // 🆕 fix15-v9: 安全截断 — P0/P1 区域完整保留, 只截断中间的非保护内容
  _safeTruncateAroundP0(prompt, maxLen, countChars, p0Protected, p1Protected) {
    const cc = countChars || (s => [...s].length);
    const protectedRanges = [
      ...p0Protected.map(b => ({ start: b.start, end: b.end, field: b.field, level: 'P0' })),
      ...p1Protected.map(b => ({ start: b.start, end: b.end, field: b.field, level: 'P1' }))
    ].sort((a, b) => a.start - b.start);

    // 如果没有 P0 保护区域 → 安全退化为暴力截断
    if (protectedRanges.length === 0) {
      const { charCounter } = require('./char-counter');
      return charCounter.truncate(prompt, maxLen);
    }

    // 计算 P0 保护区域总长度
    let protectedTotal = 0;
    for (const r of protectedRanges) protectedTotal += (r.end - r.start);

    // 如果 P0 区域本身就超 maxLen → P0 单行超出预算，必须从 P0 内部路径截断
    // (这是极端情况 — 提示词预算不足以装下 CharacterRef)
    if (protectedTotal >= maxLen) {
      // 退而求其次: 保留 P0 区域原状 + 去掉中间非 P0 内容
      const firstStart = protectedRanges[0].start;
      const lastEnd = protectedRanges[protectedRanges.length - 1].end;
      // 只保留 P0 区域拼接
      return protectedRanges.map(r => prompt.substring(r.start, r.end)).join(' ').substring(0, maxLen);
    }

    // 正常路径: P0 区域完整保留 + 中间内容截到 maxLen - protectedTotal 预算
    const remainingBudget = maxLen - protectedTotal;
    // 收集非保护区间
    const segments = [];
    let cursor = 0;
    for (const r of protectedRanges) {
      if (r.start > cursor) {
        segments.push({ text: prompt.substring(cursor, r.start), isProtected: false });
      }
      segments.push({ text: prompt.substring(r.start, r.end), isProtected: true });
      cursor = r.end;
    }
    if (cursor < prompt.length) {
      segments.push({ text: prompt.substring(cursor), isProtected: false });
    }

    // 计算非保护总长度
    let nonProtectedLen = 0;
    for (const s of segments) if (!s.isProtected) nonProtectedLen += s.text.length;

    // 拼接: 保护区域原样, 非保护区域按预算分配
    let result = '';
    if (nonProtectedLen > 0 && remainingBudget > 0) {
      // 按比例缩放非保护内容
      const ratio = Math.min(1, remainingBudget / nonProtectedLen);
      for (const s of segments) {
        if (s.isProtected) {
          result += s.text;
        } else {
          if (ratio >= 1) {
            result += s.text;
          } else {
            // 按比例缩放
            const target = Math.floor(s.text.length * ratio);
            // 尝试在分隔符处断句
            let cut = target;
            const lastSep = Math.max(
              s.text.lastIndexOf('. ', target),
              s.text.lastIndexOf(', ', target),
              s.text.lastIndexOf('; ', target),
              s.text.lastIndexOf(' ', target)
            );
            if (lastSep > target * 0.5) cut = lastSep + 1;
            result += s.text.substring(0, cut);
          }
        }
      }
    } else if (remainingBudget <= 0) {
      // 预算被 P0 吃光, 只拼接 P0
      for (const s of segments) if (s.isProtected) result += s.text;
    } else {
      // 没有非保护内容, 原样返回
      result = prompt;
    }

    // 末次保险: 如果仍超 maxLen, 从末尾狠截
    if (cc(result) > maxLen) {
      result = result.substring(0, maxLen);
    }

    return result;
  }

  _detectFieldBoundaries(prompt) {
    const boundaries = [];
    const fieldPatterns = [
      // 🆕 fix15-v9: 高优先级保护 — 整行识别 P0 注入行
      // 策略: 先用一行一个整行扫掠 — 识别连续的 | ... | ... | 形式的元数据行
      // 起始位置遇到 | 时，判断是否为元数据行（包含关键字）
      // 整行的 end 为下一个 | 的位置或行末
      { field: 'CharacterRef', regex: /\|[^|\n]*(?:CharacterRef|Ref Images|character reference|character reference image)[^|\n]*/gi, metaLine: true },
      { field: 'P0 Dialogue',  regex: /\|[^|\n]*P0\s+Dialogue[^|\n]*/gi, metaLine: true },
      { field: 'P0 Character', regex: /\|[^|\n]*P0\s+Character[^|\n]*/gi, metaLine: true },
      { field: 'Timeline',     regex: /\|[^|\n]*Timeline[^|\n]*/gi, metaLine: true },
      { field: 'AudioLayer',   regex: /\|[^|\n]*AudioLayer[^|\n]*/gi, metaLine: true },
      { field: 'NegativePrompt', regex: /(?:^|,?\s*)(no\s+deformed|no\s+extra\s+limbs|no\s+modern|no\s+cartoon|no\s+text)/gi },
      { field: 'DirectorStyle', regex: /(?:^|,?\s*)(Villeneuve|Kubrick|Nolan|director|cinematic)/gi },
      { field: 'Camera', regex: /(?:^|,?\s*)(steadicam|dolly|tracking|pan|tilt|zoom|close-up|wide\s+shot|depth\s+of\s+field)/gi },
      { field: 'Lighting', regex: /(?:^|,?\s*)(\d+K|kelvin|backlight|rim\s+light|key\s+light|volumetric)/gi },
      { field: 'Mood', regex: /(?:^|,?\s*)(tragic|epic|somber|melancholy|tense|serene|haunting|ethereal)/gi },
      { field: 'Scene', regex: /(?:^|,?\s*)(mountain|ruin|forest|interior|sky|Nirath|crystalline|canyon|volcanic)/gi },
      { field: 'Action', regex: /(?:^|,?\s*)(torso|head|arm|hand|eye|face|body|standing|walking|turning|raising|rotating|leap)/gi },
      // 🆕 fix15-v9: 排除 'CharacterRef' 误匹配 (用 negative lookahead)
      { field: 'Character', regex: /(?:^|\s|,?\s*)\b(warrior|armor|robe|creature|figure|humanoid|beast|character)\b(?!s|Ref|Name|:)/gi }
    ];

    const allMatches = [];
    for (const { field, regex, metaLine } of fieldPatterns) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(prompt)) !== null) {
        if (match.index === regex.lastIndex) { regex.lastIndex++; continue; }
        allMatches.push({ field, start: match.index, text: match[0], metaLine: !!metaLine });
      }
    }

    // 🆕 fix15-v9: metaLine 之间会重叠（同一行同时含 CharacterRef + Ref Images + P0 Dialogue）
    // 解决: 对 metaLine 进行合并 — 多个相邻 metaLine 合并为一个 boundary，field 取最优先（P0 > P1 > P3）
    // 排序: 先按 start 升序
    allMatches.sort((a, b) => a.start - b.start);

    // 合并连续的 metaLine
    const merged = [];
    let i = 0;
    while (i < allMatches.length) {
      const cur = allMatches[i];
      if (!cur.metaLine) { merged.push(cur); i++; continue; }
      // 尝试合并连续 metaLine
      let blockStart = cur.start;
      let blockEnd = cur.start + cur.text.length;
      let blockField = cur.field;
      let blockFieldPriority = this._fieldProtectionPriority(cur.field);
      let j = i + 1;
      while (j < allMatches.length && allMatches[j].metaLine && allMatches[j].start <= blockEnd) {
        const nxt = allMatches[j];
        const nxtEnd = nxt.start + nxt.text.length;
        if (nxtEnd > blockEnd) blockEnd = nxtEnd;
        const nxtPrio = this._fieldProtectionPriority(nxt.field);
        if (nxtPrio > blockFieldPriority) {
          blockField = nxt.field;
          blockFieldPriority = nxtPrio;
        }
        j++;
      }
      merged.push({
        field: blockField,
        start: blockStart,
        end: blockEnd,
        text: prompt.substring(blockStart, blockEnd),
        metaLine: true
      });
      i = j;
    }

    const seen = new Set();
    for (const match of merged) {
      if (seen.has(match.start)) continue;
      seen.add(match.start);
      let end = match.end;
      if (!match.metaLine) {
        // 🆕 fix15-v9: 非 metaLine 字段 — 边界算到下一个 boundary 起始位置之前
        for (const next of merged) {
          if (next.start > match.start && next.field !== match.field && Number.isFinite(next.start)) {
            end = Math.min(end, next.start);
          }
        }
        if (!Number.isFinite(end)) end = prompt.length;
      }
      boundaries.push({ field: match.field, start: match.start, end, text: prompt.substring(match.start, end) });
    }
    return boundaries;
  }

  // 🆕 fix15-v9: 辅助 — 字段保护优先级
  _fieldProtectionPriority(field) {
    if (this.P0_META_FIELDS.includes(field)) return 3;
    if (this.P1_META_FIELDS.includes(field)) return 2;
    if (this.CORE_FIELDS.includes(field))   return 1;
    return 0;
  }

  _compressField(prompt, field, countChars, maxLen) {
    const text = field.text;
    const currentLen = countChars ? countChars(prompt) : [...prompt].length;
    if (currentLen <= maxLen) return prompt;
    const excess = Math.max(0, currentLen - maxLen);
    const keepRatio = Math.max(0.5, 1 - (excess / (countChars ? countChars(text) : text.length)) * 0.3);
    const keepLen = Math.floor(text.length * keepRatio);
    let result = prompt.substring(0, field.start) + text.substring(0, keepLen) + prompt.substring(field.end);
    result = result.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
    return result;
  }

  _removeField(prompt, field) {
    let result = prompt.substring(0, field.start) + prompt.substring(field.end);
    return result.replace(/^,\s*|,\s*,|,\s*$/g, '').trim();
  }

  _fallbackTruncate(prompt, maxLen, countChars) {
    const len = countChars ? countChars(prompt) : [...prompt].length;
    const ratio = prompt.length / Math.max(1, len);
    const targetLen = Math.floor(maxLen * ratio);
    const sentenceEndings = ['. ', ', ', '; ', ' '];
    for (const ending of sentenceEndings) {
      const idx = prompt.lastIndexOf(ending, targetLen);
      if (idx > targetLen * 0.7) {
        return prompt.substring(0, idx + (ending === ' ' ? 0 : ending.length)).trim();
      }
    }
    return prompt.substring(0, targetLen);
  }
}

module.exports = { SmartQualityCalibration, PriorityTruncator };
