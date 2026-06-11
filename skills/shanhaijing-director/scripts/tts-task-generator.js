/**
 * tts-task-generator.js
 * TTS 任务生成层 - 为 Seedance 渲染引擎生成 TTS 配置
 *
 * 职责（Phase 7 重构后）：
 * ✅ 读取 dialogue-annotation.json
 * ✅ 根据对白生成 TTS 任务配置（voiceId、pitch、speed、effect）
 * ✅ 生成 Seedance API 请求格式的音频参考片段
 *
 * 不负责（已分离到其他模块）：
 * ❌ LLM 对白生成（由 Stage 7.5 主流程调用 LLMReasoningLayer）
 * ❌ 对白标注（由 dialogue-annotator.js 负责）
 * ❌ 角色语音档案管理（由 character-voice-designer.js 负责）
 * ❌ 音频文件生成/上传（由 seedance-render-engine 负责）
 *
 * Phase 7 重构 | v6.21-Peng
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// TTS 任务生成器
// ============================================================================

class TTSAudioGenerator {
  /**
   * 根据对白列表生成 TTS 任务配置
   * 返回可供 Seedance API 使用的音频参考片段配置
   *
   * 注意：实际音频生成由 seedance-render-engine 调用外部 TTS 服务完成
   * 此模块只生成任务配置（不含音频文件本身）
   */
  generateTTSConfig(dialogues) {
    if (!dialogues || dialogues.length === 0) return [];

    return dialogues.map(d => {
      const profile = this._getVoiceProfile(d.speaker);
      return {
        speaker: d.speaker,
        text: d.text,
        emotion: d.emotion || 'neutral',
        // TTS 配置参数
        voiceId: profile.voiceId || 'zh-CN-XiaoxiaoNeural',
        pitchShift: profile.pitchShift || '0%',
        speedShift: profile.speedShift || '100%',
        effects: profile.effects || [],
        // 估算时长（字/5 = 秒）
        estimatedDuration: Math.ceil((d.text || '').length / 5),
        // 情绪映射
        emotionConfig: profile.emotionMap?.[d.emotion] || null
      };
    });
  }

  /**
   * 获取角色的 TTS 配置
   */
  _getVoiceProfile(speaker) {
    const profiles = {
      // 默认配置
      default: {
        voiceId: 'zh-CN-XiaoxiaoNeural',
        pitchShift: '0%',
        speedShift: '100%',
        effects: []
      },
      // 神话异兽配置（示例，可扩展）
      zhulong: {
        voiceId: 'zh-CN-YunxiNeural',
        pitchShift: '-20%',
        speedShift: '80%',
        effects: ['reverb:large_hall'],
        emotionMap: {
          neutral: { pitchShift: '-20%', speedShift: '80%', effects: ['reverb:large_hall'] },
          authoritative: { pitchShift: '-30%', speedShift: '70%', effects: ['reverb:cathedral'] },
          roar: { pitchShift: '-40%', speedShift: '60%', effects: ['distortion:light'] }
        }
      },
     xiaog: {
        voiceId: 'zh-CN-XiaoxiaoNeural',
        pitchShift: '+10%',
        speedShift: '110%',
        effects: [],
        emotionMap: {
          curious: { pitchShift: '+15%', speedShift: '120%', effects: [] },
          scared: { pitchShift: '+20%', speedShift: '130%', effects: [] },
          amazed: { pitchShift: '+25%', speedShift: '90%', effects: [] },
          brave: { pitchShift: '-5%', speedShift: '95%', effects: [] },
          happy: { pitchShift: '+15%', speedShift: '115%', effects: [] },
          sad: { pitchShift: '-15%', speedShift: '85%', effects: [] }
        }
      }
    };

    return profiles[speaker.toLowerCase()] || profiles.default;
  }
}

// ============================================================================
// TTS 任务管理器 - 从 dialogue-annotation.json 读取并生成任务
// ============================================================================

class TTSTaskManager {
  constructor(options = {}) {
    this.ttsGenerator = new TTSAudioGenerator();
    this.productionDir = options.productionDir || process.cwd();
  }

  /**
   * 从 dialogue-annotation.json 生成 TTS 任务
   * 返回符合 Seedance API 格式的音频参考片段列表
   */
  async generateTasks() {
    const annotationPath = path.join(this.productionDir, '03-shots', 'dialogue-annotation.json');

    if (!fs.existsSync(annotationPath)) {
      console.log(`  ⚠️ [TTSTaskManager] 无 dialogue-annotation.json，跳过 TTS 任务生成`);
      return [];
    }

    let annotation;
    try {
      annotation = JSON.parse(fs.readFileSync(annotationPath, 'utf8'));
    } catch (e) {
      console.log(`  ⚠️ [TTSTaskManager] dialogue-annotation.json 解析失败: ${e.message}`);
      return [];
    }

    // 收集所有对白
    const allDialogues = [];
    for (const shot of annotation.shots || []) {
      if (shot.dialogues && shot.dialogues.length > 0) {
        for (const d of shot.dialogues) {
          allDialogues.push({ ...d, shotId: shot.id });
        }
      }
    }

    if (allDialogues.length === 0) {
      console.log(`  ⚠️ [TTSTaskManager] 无有效对白，跳过 TTS 任务生成`);
      return [];
    }

    const tasks = this.ttsGenerator.generateTTSConfig(allDialogues);
    console.log(`  🔊 [TTSTaskManager] 生成 ${tasks.length} 个 TTS 任务`);

    return tasks;
  }

  /**
   * 生成 Seedance API 音频参考片段格式
   * 注意：音频文件 URL 需由外部 TTS 服务生成后填充
   */
  generateSeedanceAudioRefs(tasks) {
    return tasks.map(t => ({
      type: 'audio_url',
      audio_url: {
        url: '', // 填充：TTS 服务生成的音频 URL
        duration: t.estimatedDuration,
        speaker: t.speaker,
        emotion: t.emotion
      },
      role: 'reference_audio'
    }));
  }

  /**
   * 保存 TTS 任务配置到文件
   */
  saveTTSConfig(tasks) {
    const configPath = path.join(this.productionDir, '03-shots', 'tts-tasks.json');
    fs.writeFileSync(configPath, JSON.stringify({
      version: 'v6.21-Peng',
      timestamp: new Date().toISOString(),
      taskCount: tasks.length,
      tasks
    }, null, 2));
    console.log(`  📁 [TTSTaskManager] TTS 任务配置已保存: ${configPath}`);
    return configPath;
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  TTSAudioGenerator,
  TTSTaskManager
};
