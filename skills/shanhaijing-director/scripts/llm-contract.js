'use strict';

/**
 * LLM Contract Layer v1.0-Peng-fix
 * 统一 LLM 输出 JSON 契约层
 *
 * 职责：
 * 1. 从 LLM 文本中稳健提取 JSON
 * 2. 容错 JSON.parse
 * 3. 字段别名统一
 * 4. story-plan / dialogue / shot / prompt-fields 标准化
 *
 * 设计原则：
 * - LLM 输出不是可信输入，必须视为不可信文本
 * - 内部字段统一小写
 * - 所有持久化前必须 normalize
 * - 所有最终 Prompt 组装只从标准字段取值
 */

class LLMContractError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'LLMContractError';
    this.details = details;
  }
}

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function ensureArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

/**
 * 从任意 LLM 输出中提取最大合法 JSON
 */
function extractJSONObject(text) {
  if (text == null) return null;

  if (isObject(text) || Array.isArray(text)) {
    return JSON.stringify(text);
  }

  text = String(text).trim();
  if (!text) return null;

  // 1) ```json ... ```
  const jsonBlock = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlock) return jsonBlock[1].trim();

  // 2) ``` ... ```
  const block = text.match(/```\s*([\s\S]*?)\s*```/);
  if (block) {
    const inner = block[1].trim();
    if (inner.startsWith('{') || inner.startsWith('[')) {
      try { JSON.parse(inner); return inner; } catch (_) {}
    }
  }

  // 3) 平衡括号提取候选
  const candidates = [];

  function collectBalanced(openChar, closeChar) {
    for (let start = 0; start < text.length; start++) {
      if (text[start] !== openChar) continue;
      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = start; i < text.length; i++) {
        const ch = text[i];

        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;

        if (ch === openChar) depth++;
        if (ch === closeChar) depth--;

        if (depth === 0) {
          candidates.push(text.slice(start, i + 1));
          break;
        }
      }
    }
  }

  collectBalanced('{', '}');
  collectBalanced('[', ']');

  candidates.sort((a, b) => b.length - a.length);

  for (const c of candidates) {
    try { JSON.parse(c); return c; } catch (_) {}
  }

  // 4) 如果本体就是 JSON
  if (text.startsWith('{') || text.startsWith('[')) {
    try { JSON.parse(text); return text; } catch (_) {}
  }

  return null;
}

/**
 * 容错 JSON.parse
 */
function safeParseJSON(input, fallback = null) {
  try {
    if (input == null) return fallback;
    if (isObject(input) || Array.isArray(input)) return input;
    return JSON.parse(input);
  } catch (_) {
    try {
      const fixed = String(input)
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(fixed);
    } catch (_) {
      return fallback;
    }
  }
}

/**
 * 字段 alias 归一化
 */
function normalizeAliases(obj, aliasMap) {
  if (!isObject(obj)) return obj;
  const out = deepClone(obj);

  for (const [target, aliases] of Object.entries(aliasMap || {})) {
    if (out[target] !== undefined) continue;
    for (const alias of aliases) {
      if (out[alias] !== undefined) {
        out[target] = out[alias];
        break;
      }
    }
  }
  return out;
}

/**
 * 统一角色数组
 */
function normalizeCharacters(rawCharacters) {
  if (!rawCharacters) return [];

  const arr = Array.isArray(rawCharacters)
    ? rawCharacters
    : Object.values(rawCharacters);

  return arr.map((raw, idx) => {
    const c = normalizeAliases(raw || {}, {
      id: ['charId', 'characterId'],
      name: ['charName', 'characterName', '角色名'],
      description: ['desc', 'visualAppearance', '角色描述'],
      species: ['type', 'speciesName', '物种'],
      role: ['角色', 'identity']
    });

    if (!c.id) c.id = `char_${idx}`;
    if (!c.name) c.name = `角色${idx + 1}`;
    if (!c.description) c.description = '';
    if (!c.species) c.species = 'unknown';
    if (!c.role) c.role = 'unknown';

    return c;
  });
}

/**
 * 统一单镜头结构
 */
function normalizeShot(rawShot, idx = 0) {
  let shot = normalizeAliases(rawShot || {}, {
    id: ['shotId', 'shot_id'],
    type: ['shotType', 'shot_type'],
    scene: ['Scene', '场景'],
    action: ['Action', '动作'],
    character: ['Character', '角色'],
    mood: ['Mood', '情绪'],
    camera: ['Camera', '运镜'],
    lighting: ['Lighting', '光线'],
    dialogue: ['Dialogue', 'dialogues', '对白']
  });

  if (!shot.id || String(shot.id).trim() === '') {
    shot.id = `S${String(idx).padStart(2, '0')}`;
  }
  shot.id = String(shot.id);

  if (!shot.type) shot.type = 'normal';
  shot.type = String(shot.type);

  shot.duration = Number(shot.duration || 5);
  if (Number.isNaN(shot.duration) || shot.duration <= 0) shot.duration = 5;

  if (!shot.scene) shot.scene = '';
  if (!shot.action) shot.action = '';
  if (!shot.character) shot.character = '';
  if (!shot.mood) shot.mood = shot.emotion || '';
  if (!shot.camera) shot.camera = '';
  if (!shot.lighting) shot.lighting = '';

  if (!shot.description) {
    shot.description = [
      shot.scene,
      shot.action,
      shot.character
    ].filter(Boolean).join(' | ') || 'No description';
  }

  if (!Array.isArray(shot.characters)) {
    if (typeof shot.characters === 'string' && shot.characters.trim()) {
      shot.characters = [shot.characters.trim()];
    } else {
      shot.characters = [];
    }
  }

  shot.dialogue = ensureArray(shot.dialogue).filter(Boolean);

  return shot;
}

/**
 * 统一 story-plan
 */
function normalizeStoryPlan(raw) {
  let data = raw;

  if (data && data.story_plan) data = data.story_plan;

  data = normalizeAliases(data || {}, {
    title: ['name', 'storyTitle'],
    outline: ['summary', 'storyOutline'],
    segments: ['acts', 'Scenes'],
    shots: ['shotList']
  });

  data.characters = normalizeCharacters(data.characters);

  if (Array.isArray(data.shots) && (!data.segments || data.segments.length === 0)) {
    data.segments = [{
      id: 'SEG1',
      name: 'Main Segment',
      shots: data.shots
    }];
  }

  if (!Array.isArray(data.segments)) data.segments = [];

  let flatShots = [];

  data.segments = data.segments.map((rawSeg, segIdx) => {
    let seg = normalizeAliases(rawSeg || {}, {
      id: ['segmentId'],
      name: ['title', 'segmentName'],
      shots: ['shotList']
    });

    if (!seg.id) seg.id = `SEG${segIdx + 1}`;
    if (!seg.name) seg.name = `Segment ${segIdx + 1}`;
    if (!Array.isArray(seg.shots)) seg.shots = [];

    seg.shots = seg.shots.map((rawShot, shotIdx) => {
      const shot = normalizeShot(rawShot, flatShots.length + shotIdx);
      shot.segmentId = seg.id;
      return shot;
    });

    flatShots.push(...seg.shots);
    return seg;
  });

  data.shots = flatShots;

  if (!data.title) data.title = 'Untitled';
  if (!data.outline) data.outline = '';
  if (!data.totalDuration) {
    data.totalDuration = flatShots.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  }
  if (!data.targetDuration) data.targetDuration = data.totalDuration || 60;
  if (!data.totalShots) data.totalShots = flatShots.length;

  return data;
}

/**
 * 统一 dialogue annotation
 */
function normalizeDialogueAnnotation(raw) {
  const data = normalizeAliases(raw || {}, {
    shots: ['dialogues', 'items']
  });

  const shots = Array.isArray(data.shots) ? data.shots : [];
  data.shots = shots.map((rawItem, idx) => {
    const item = normalizeAliases(rawItem || {}, {
      id: ['shotId'],
      dialogues: ['Dialogue', 'dialogue']
    });

    if (!item.id) item.id = `S${String(idx).padStart(2, '0')}`;
    item.id = String(item.id);

    item.dialogues = ensureArray(item.dialogues).map((rawD) => {
      const d = normalizeAliases(rawD || {}, {
        speaker: ['SPEAKER', 'character'],
        text: ['TEXT', 'content'],
        emotion: ['EMOTION', 'mood'],
        type: ['TYPE']
      });

      if (!d.speaker) d.speaker = '未知角色';
      if (!d.text) d.text = '';
      if (!d.emotion) d.emotion = 'neutral';
      if (!d.type) d.type = 'dialogue';

      return d;
    });

    return item;
  });

  return data;
}

/**
 * 统一 prompt fields
 */
function normalizePromptFields(raw) {
  const data = normalizeAliases(raw || {}, {
    characterRef: ['CharacterRef', 'character_ref'],
    timeline: ['Timeline'],
    dialogue: ['Dialogue'],
    audioLayer: ['AudioLayer'],
    character: ['Character'],
    action: ['Action'],
    scene: ['Scene'],
    mood: ['Mood'],
    camera: ['Camera'],
    lighting: ['Lighting']
  });

  return {
    characterRef: data.characterRef || '',
    timeline: data.timeline || '',
    dialogue: data.dialogue || '',
    audioLayer: data.audioLayer || '',
    character: data.character || '',
    action: data.action || '',
    scene: data.scene || '',
    mood: data.mood || '',
    camera: data.camera || '',
    lighting: data.lighting || ''
  };
}

/**
 * 模块级 contract parse 入口
 */
function parseLLMContract(moduleName, rawOutput) {
  const jsonText = extractJSONObject(rawOutput);
  if (!jsonText) {
    throw new LLMContractError(`No valid JSON extracted for module: ${moduleName}`, {
      moduleName,
      preview: String(rawOutput || '').slice(0, 500)
    });
  }

  const parsed = safeParseJSON(jsonText);
  if (!parsed) {
    throw new LLMContractError(`JSON parse failed for module: ${moduleName}`, {
      moduleName,
      preview: jsonText.slice(0, 500)
    });
  }

  switch (moduleName) {
    case 'story-plan':
    case 'beastmind-story-plan':
    case 'schema-story-plan':
      return normalizeStoryPlan(parsed);

    case 'dialogue-annotation':
      return normalizeDialogueAnnotation(parsed);

    case 'prompt-fields':
    case 'prompt-normalizer':
      return normalizePromptFields(parsed);

    default:
      return parsed;
  }
}

module.exports = {
  LLMContractError,
  extractJSONObject,
  safeParseJSON,
  normalizeAliases,
  normalizeCharacters,
  normalizeShot,
  normalizeStoryPlan,
  normalizeDialogueAnnotation,
  normalizePromptFields,
  parseLLMContract
};
