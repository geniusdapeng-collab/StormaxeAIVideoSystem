'use strict';

/**
 * Prompt Output Repair v1.0-Peng
 * 专门修复生成结果里暴露的输出问题：
 * 1. S00 扩展字段污染
 * 2. [EN: ] 占位符残留
 * 3. 中文标点残渣
 * 4. 旁白/人物 SPEAKER 不规范
 * 5. CharacterRef 路径过长
 */

const FINAL_FIELDS = [
  'CharacterRef', 'Timeline', 'Dialogue', 'AudioLayer',
  'Character', 'Action', 'Scene', 'Mood', 'Camera', 'Lighting'
];

function safeString(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch (e) { return String(v); }
}

function cleanupBrokenEnglish(text) {
  let s = safeString(text);
  s = s.replace(/\[EN:\s*\]/g, '');
  s = s.replace(/\[EN:[^\]]*\]/g, '');
  s = s.replace(/[，。；：？！、】【（）]/g, ' ');
  s = s.replace(/[—–]{2,}/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function shortenCharacterRef(text) {
  const raw = safeString(text);
  if (!raw) return 'No external reference images.';
  const chunks = raw.split('|').map(s => s.trim()).filter(Boolean);
  const results = [];
  for (const chunk of chunks) {
    const parts = chunk.split(':');
    if (parts.length < 2) continue;
    const charName = parts[0].trim();
    const refsPart = parts.slice(1).join(':');
    const filenames = refsPart.split(',')
      .map(s => s.trim())
      .map(p => { const segs = p.split('/'); return segs[segs.length - 1]; })
      .filter(Boolean)
      .slice(0, 3);
    if (filenames.length > 0) results.push(`${charName}: ${filenames.join(', ')}`);
  }
  return results.length > 0 ? results.join(' | ') : 'No external reference images.';
}

function detectDominantSpeaker(shot) {
  const action = `${shot.Action || ''} ${shot.action || ''} ${shot.description || ''}`.toLowerCase();
  if (/小g|xiaog|少年|男孩/.test(action)) return '小G';
  if (/白泽|baize|神兽/.test(action)) return '白泽';
  if (shot.id === 'S00' || shot.id === 'S01') return '白泽';
  return '白泽';
}

function normalizeDialogueField(dialogueText, shot) {
  let text = safeString(dialogueText).trim();
  if (!text) {
    const speaker = detectDominantSpeaker(shot);
    const fallbackText = speaker === '小G' ? '我在。' : '吾名白泽，通晓万物之情。';
    return `SPEAKER: ${speaker} | TYPE: dialogue | EMOTION: neutral | TEXT: "${fallbackText}" | LIP_SYNC: YES`;
  }
  const speakerMatch = text.match(/SPEAKER:\s*([^|]+)/i);
  const typeMatch = text.match(/TYPE:\s*([^|]+)/i);
  const emotionMatch = text.match(/EMOTION:\s*([^|]+)/i);
  const textMatch = text.match(/TEXT:\s*"([^"]*)"/i);
  let speaker = speakerMatch ? speakerMatch[1].trim() : '';
  if (!speaker || speaker === '旁白' || speaker === '人物' || /narrator/i.test(speaker)) {
    speaker = detectDominantSpeaker(shot);
  }
  const type = typeMatch ? typeMatch[1].trim() : 'dialogue';
  const emotion = emotionMatch ? emotionMatch[1].trim() : 'neutral';
  const speech = textMatch ? textMatch[1].trim() : '...';
  return `SPEAKER: ${speaker} | TYPE: ${type} | EMOTION: ${emotion} | TEXT: "${speech}" | LIP_SYNC: YES`;
}

function extractField(prompt, fieldName) {
  const text = safeString(prompt);
  const re = new RegExp(`【${fieldName}】\\s*([\\s\\S]*?)(?=\\s*\\|\\s*【|$)`, 'i');
  const m = text.match(re);
  return m && m[1] ? m[1].trim() : '';
}

function rebuildS00AsFinal10Fields(shot) {
  const prompt = safeString(shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '');
  const characterRef = shortenCharacterRef(extractField(prompt, 'CharacterRef'));
  const dialogue = normalizeDialogueField(extractField(prompt, 'Dialogue'), shot);
  const timeline = extractField(prompt, 'Timeline') || `Duration ${shot.duration || 8} seconds opening title sequence.`;
  const sceneBase = [
    extractField(prompt, 'Scene'),
    extractField(prompt, 'TitleEffect'),
    extractField(prompt, 'BeastEntrance'),
    extractField(prompt, 'XiaoGEntrance')
  ].filter(Boolean).join(' | ');
  const scene = cleanupBrokenEnglish(sceneBase) || 'Epic opening title scene on Nirath cliff with separated title area, beast reveal, and xiaoG response.';
  const action = cleanupBrokenEnglish(
    `${extractField(prompt, 'Action')} ${extractField(prompt, 'TitleEffect')} ${extractField(prompt, 'BeastEntrance')} ${extractField(prompt, 'XiaoGEntrance')}`
  ) || 'Opening reveal, title manifestation, beast emergence, and xiaoG visual response.';
  const mood = cleanupBrokenEnglish(extractField(prompt, 'Mood')) || 'epic, mysterious, awe-inspiring, cinematic, primordial.';
  const camera = cleanupBrokenEnglish(extractField(prompt, 'Camera')) || 'wide-angle low-angle cinematic sweep emphasizing scale contrast and title readability.';
  const lighting = cleanupBrokenEnglish(extractField(prompt, 'Lighting')) || 'dual-sunset purple-gold light, bioluminescent cyan accents, dramatic rim lighting.';
  const audioLayer = cleanupBrokenEnglish(
    `${extractField(prompt, 'AudioLayer')} ${extractField(prompt, 'Transition')}`
  ) || 'sub-bass earth rumble, magnetic field hum, cinematic opening ambience.';
  const character = cleanupBrokenEnglish(extractField(prompt, 'Character')) || '白泽, 小G';
  return composeFinalFields({ CharacterRef: characterRef, Timeline: timeline, Dialogue: dialogue, AudioLayer: audioLayer, Character: character, Action: action, Scene: scene, Mood: mood, Camera: camera, Lighting: lighting });
}

function repairNormalShot(shot) {
  const prompt = safeString(shot._generatedPrompt || shot._finalPrompt || shot.prompt || '');
  const characterRef = shortenCharacterRef(extractField(prompt, 'CharacterRef'));
  const timeline = extractField(prompt, 'Timeline') || `Duration ${shot.duration || 8} seconds.`;
  const dialogue = normalizeDialogueField(extractField(prompt, 'Dialogue'), shot);
  const audioLayer = cleanupBrokenEnglish(extractField(prompt, 'AudioLayer')) || 'Natural ambient sound design.';
  const character = cleanupBrokenEnglish(extractField(prompt, 'Character')) || 'Primary character in frame.';
  const action = cleanupBrokenEnglish(extractField(prompt, 'Action')) || 'Primary action unfolds clearly on screen.';
  const scene = cleanupBrokenEnglish(extractField(prompt, 'Scene')) || 'Cinematic environment with readable spatial depth.';
  const mood = cleanupBrokenEnglish(extractField(prompt, 'Mood')) || 'cinematic, emotionally focused.';
  const camera = cleanupBrokenEnglish(extractField(prompt, 'Camera')) || 'cinematic readable framing.';
  const lighting = cleanupBrokenEnglish(extractField(prompt, 'Lighting')) || 'motivated cinematic lighting with readable contrast.';
  return composeFinalFields({ CharacterRef: characterRef, Timeline: timeline, Dialogue: dialogue, AudioLayer: audioLayer, Character: character, Action: action, Scene: scene, Mood: mood, Camera: camera, Lighting: lighting });
}

function composeFinalFields(fields) {
  return FINAL_FIELDS.map(name => `【${name}】 ${safeString(fields[name] || '').trim()}`).join(' | ');
}

function repairShotPromptOutput(shot) {
  if (!shot) return '';
  let finalPrompt = '';
  if (shot.id === 'S00' || shot.type === 'opening_title' || shot._isOpeningTitle) {
    finalPrompt = rebuildS00AsFinal10Fields(shot);
  } else {
    finalPrompt = repairNormalShot(shot);
  }
  shot._generatedPrompt = finalPrompt;
  shot._finalPrompt = finalPrompt;
  shot._promptLength = finalPrompt.length;
  // v1.4-Peng: 标记P0已注入，阻止后续闸机重复注入导致截断破坏字段
  shot._p0Injected = true;
  return finalPrompt;
}

function repairAllShotPromptOutputs(shots) {
  const results = [];
  for (const shot of shots || []) {
    results.push({ shotId: shot.id || 'UNKNOWN', prompt: repairShotPromptOutput(shot) });
  }
  return results;
}

module.exports = {
  cleanupBrokenEnglish, shortenCharacterRef, normalizeDialogueField,
  detectDominantSpeaker, extractField, rebuildS00AsFinal10Fields,
  repairNormalShot, composeFinalFields, repairShotPromptOutput, repairAllShotPromptOutputs
};
