/**
 * dialogue-annotator.js
 * 对白标注层 - Stage 7.5 DialogueAnnotation 的本地 fallback 模块
 *
 * 职责（Phase 7 重构后）：
 * ✅ 从剧本中提取对白（解析自然语言格式）
 * ✅ 将对白分配到各镜头（就近分配策略）
 * ✅ 将对白注入到镜头 prompt
 *
 * 不负责（已分离到其他模块）：
 * ❌ LLM 对白生成（由 Stage 7.5 主流程直接调用 LLMReasoningLayer）
 * ❌ TTS 音频生成（由 tts-task-generator.js 负责）
 * ❌ 角色语音档案管理（由 character-voice-designer.js 负责）
 * ❌ 旁白清洗（由 pipeline._cleanVoiceover() 负责）
 *
 * Phase 7 重构 | v6.21-Peng
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 对白解析器 - 从剧本自然语言中提取对白
// ============================================================================

class DialogueParser {
  /**
   * 解析自然语言格式的剧本，提取所有对白
   * 支持格式：
   *   "对白内容" — 角色名（情绪）
   *   角色名："对白内容"
   *   [角色名] 对白内容
   */
  parseNaturalDialogue(script) {
    if (!script || typeof script !== 'string') return [];

    const dialogues = [];
    const lines = script.split('\n');

    // 正则匹配各种格式
    const patterns = [
      // "对白" — 角色（情绪）格式
      /["'"]([^"']{1,100})["']\s*[—\-–]\s*(\S+?)\s*(?:\（|\()([^）\)]*?)(?:\）|\))?/g,
      // 角色名："对白内容" 格式
      /^(\S+?)[\s:：]["'""']([^"']{1,100})["']/gm,
      // [角色名] 对白内容 格式
      /^\[(\S+?)\]\s*(.{1,100})$/gm,
    ];

    const seen = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

      // 格式1: "对白" — 角色（情绪）
      let match;
      while ((match = patterns[0].exec(trimmed)) !== null) {
        const text = match[1].trim();
        const speaker = match[2].trim();
        const emotion = (match[3] || 'neutral').trim();
        const key = `${speaker}:${text}`;
        if (text && speaker && !seen.has(key)) {
          seen.add(key);
          dialogues.push({ speaker, text, emotion });
        }
      }

      // 格式2: 角色名："对白"
      patterns[1].lastIndex = 0;
      while ((match = patterns[1].exec(trimmed)) !== null) {
        const speaker = match[1].trim();
        const text = match[2].trim();
        const key = `${speaker}:${text}`;
        if (text && speaker && !seen.has(key)) {
          seen.add(key);
          dialogues.push({ speaker, text, emotion: 'neutral' });
        }
      }

      // 格式3: [角色名] 对白
      patterns[2].lastIndex = 0;
      while ((match = patterns[2].exec(trimmed)) !== null) {
        const speaker = match[1].trim();
        const text = match[2].trim();
        const key = `${speaker}:${text}`;
        if (text && speaker && !seen.has(key)) {
          seen.add(key);
          dialogues.push({ speaker, text, emotion: 'neutral' });
        }
      }
    }

    return dialogues;
  }
}

// ============================================================================
// 对白注入器 - 将对白注入到镜头 prompt
// ============================================================================

class DialoguePromptInjector {
  constructor(voiceProfiles = {}) {
    this.profiles = voiceProfiles;
  }

  /**
   * 将对白注入到镜头 prompt
   * 格式：P0 Dialogue: - SPEAKER: 角色 | TYPE: 类型 | EMOTION: 情绪 | TEXT: "对白" | LIP_SYNC: YES | 口型情绪: 描述
   */
  injectDialogue(prompt, dialogues, voiceProfiles = {}) {
    if (!dialogues || dialogues.length === 0) return prompt;

    const profiles = { ...this.profiles, ...voiceProfiles };
    const injected = dialogues.map(d => {
      const profile = profiles[d.speaker] || {};
      const lipSyncNote = this._getLipSyncNote(d, profile);
      return `P0 Dialogue: - SPEAKER: ${d.speaker} | TYPE: ${d.type || 'dialogue'} | EMOTION: ${d.emotion || 'neutral'} | TEXT: "${d.text}" | LIP_SYNC: YES | 口型情绪: ${lipSyncNote}`;
    }).join('\n');

    // 追加到 prompt 末尾
    return prompt ? `${prompt}\n${injected}` : injected;
  }

  _getLipSyncNote(dialogue, profile) {
    const emotionMap = profile.emotionMap || {};
    const emotion = dialogue.emotion || 'neutral';
    const mapping = emotionMap[emotion];

    if (mapping) {
      const desc = mapping.desc || '';
      const pitchShift = mapping.pitchShift || '';
      const speedShift = mapping.speedShift || '';
      return `${desc} ${pitchShift} ${speedShift}`.trim();
    }

    // 默认口型描述
    const defaultNotes = {
      neutral: '正常语速，嘴型清晰',
      curious: '语调上扬，尾音带疑问感',
      amazed: '停顿+吸气声+惊叹',
      brave: '语速放缓，坚定有力',
      scared: '语速加快，声音微微颤抖',
      sad: '低沉，尾音下沉',
      happy: '轻快跳跃，带笑意'
    };

    return defaultNotes[emotion] || '正常语速，嘴型清晰';
  }
}

// ============================================================================
// 对白标注器 - 整合解析+分配+注入
// ============================================================================

class DialogueAnnotator {
  constructor(options = {}) {
    this.parser = new DialogueParser();
    this.injector = new DialoguePromptInjector(options.voiceProfiles || {});
    this.maxDialoguePerShot = options.maxDialoguePerShot || 2;
  }

  /**
   * 对白标注主方法
   * 输入：剧本字符串 + 镜头列表
   * 输出：带对白标注的镜头列表 + 对白数量
   *
   * 不生成 TTS 任务（由 tts-task-generator.js 负责）
   */
  annotate(script, shots) {
    // 1. 解析剧本中的对白
    const allDialogues = this.parser.parseNaturalDialogue(script);
    console.log(`  🎙️ [DialogueAnnotator] 发现 ${allDialogues.length} 句对白`);

    if (allDialogues.length === 0) {
      return { shots, dialogueCount: 0 };
    }

    // 2. 按镜头分配对白（就近均匀分配）
    const shotDialogues = this._assignDialoguesToShots(allDialogues, shots);

    // 3. 为每个镜头注入对白到 prompt
    const annotatedShots = shots.map((shot, index) => {
      const dialogues = shotDialogues[index] || [];

      if (dialogues.length === 0) return shot;

      const enhancedPrompt = this.injector.injectDialogue(
        shot.prompt || '',
        dialogues,
        shot.character ? { [shot.character]: this.injector.profiles[shot.character] } : {}
      );

      return {
        ...shot,
        prompt: enhancedPrompt,
        dialogues,
        hasDialogue: true
      };
    });

    return {
      shots: annotatedShots,
      allShots: annotatedShots,  // 🆕 v6.24-fix31: 兼容 result.allShots 访问（与 LLM 分支格式对齐）
      dialogueCount: allDialogues.length
    };
  }

  /**
   * 将对白均匀分配到各镜头
   */
  _assignDialoguesToShots(dialogues, shots) {
    const shotDialogues = {};
    const dialoguesPerShot = Math.ceil(dialogues.length / shots.length);

    shots.forEach((shot, index) => {
      const start = index * dialoguesPerShot;
      const end = Math.min(
        start + this.maxDialoguePerShot,
        (index + 1) * dialoguesPerShot
      );
      shotDialogues[index] = dialogues.slice(start, end);
    });

    return shotDialogues;
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  DialogueAnnotator,
  DialogueParser,
  DialoguePromptInjector
};
