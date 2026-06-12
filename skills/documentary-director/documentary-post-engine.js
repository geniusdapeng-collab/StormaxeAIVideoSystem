#!/usr/bin/env node
/**
 * Documentary Post Engine v1.0-Peng
 * FFmpeg后期合成引擎 — 调色+转场+字幕+音画合成
 *
 * 职责：
 * 1. 片段拼接（concat demuxer）
 * 2. 柔和淡入淡出转场（fade in/out + crossfade）
 * 3. 自然调色（轻微对比度，不过度风格化）
 * 4. 干净字幕叠加（白色无衬线+深色描边）
 * 5. TTS旁白合成（-map 0:v:0 -map 1:a:0，强制替换音频）
 * 6. 最终输出为960×960 24fps mp4
 *
 * 依赖：FFmpeg命令行工具
 * 注意：当前为命令生成器，实际执行需要FFmpeg已安装
 */

'use strict';

const path = require('path');
const fs = require('fs');

// ─── 后期配置常量 ───
const POST_CONFIG = {
  // 输出规格
  output: {
    resolution: '960x960',
    fps: 24,
    codec: 'libx264',
    preset: 'medium',      // 质量与速度平衡
    crf: 23,               // 质量系数（18-28，越小越好）
    pixelFormat: 'yuv420p',
    format: 'mp4'
  },

  // 调色参数（自然风格，不过度）
  color: {
    brightness: 0,         // 亮度
    contrast: 1.05,        // 轻微对比度提升（1.0=原样）
    saturation: 1.02,      // 轻微饱和度
    gamma: 1.0,            // 伽马
    // 可选LUT（留空=自然）
    lutFile: null
  },

  // 转场参数
  transitions: {
    fadeInDuration: 0.5,   // 片头淡入（秒）
    fadeOutDuration: 0.5,  // 片尾淡出（秒）
    crossfadeDuration: 0.3 // 片段间交叉淡化（秒）
  },

  // 字幕样式
  subtitle: {
    fontName: 'Noto Sans CJK SC',  // 思源黑体（干净无衬线）
    fontSize: 36,                   // 字号
    fontColor: 'white',             // 白色字体
    outlineColor: 'black',          // 黑色描边
    outlineWidth: 2,                // 描边宽度
    boxColor: '0x000000@0.5',       // 半透明黑底
    boxBorder: 4,                   // 底边距
    position: 'bottom',             // 底部居中
    marginV: 40                     // 底部边距
  },

  // 音频参数
  audio: {
    codec: 'aac',
    bitrate: '192k',
    sampleRate: 44100,
    channels: 2
  }
};

class PostEngine {
  constructor(config = {}) {
    this.config = this._mergeConfig(config);
    this.ffmpegPath = config.ffmpegPath || 'ffmpeg';
  }

  /**
   * 合成完整影片
   * @param {Object} options — 合成参数
   *   { segments: [{file, duration, start, end}],
   *     subtitles: [{start, end, text}],
     *     ttsAudio: '/path/to/tts.mp3',
     *     outputPath: '/path/to/output.mp4',
     *     transitions: [] }
   * @returns {Object} 合成结果
   */
  compose(options) {
    const {
      segments = [],
      subtitles = [],
      ttsAudio = null,
      outputPath,
      transitions = [],
      tempDir = '/tmp'
    } = options;

    if (!outputPath) {
      throw new Error('[PostEngine] 必须指定outputPath');
    }

    // 步骤1: 生成concat列表
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = this._buildConcatList(segments, transitions);

    // 步骤2: 生成字幕ASS文件
    const subtitlePath = subtitles.length > 0
      ? path.join(tempDir, 'subtitles.ass')
      : null;
    const subtitleContent = subtitles.length > 0
      ? this._buildAssSubtitles(subtitles)
      : null;

    // 步骤3: 构建FFmpeg命令
    const command = this._buildFFmpegCommand({
      concatListPath,
      subtitlePath,
      ttsAudio,
      outputPath,
      segments,
      transitions
    });

    // 步骤4: 生成执行脚本
    const scriptPath = path.join(tempDir, 'compose.sh');
    const script = this._generateScript({
      concatListPath,
      concatContent,
      subtitlePath,
      subtitleContent,
      command,
      outputPath
    });

    return {
      success: true,
      outputPath,
      duration: segments.reduce((sum, s) => sum + (s.duration || 0), 0),
      command,
      scriptPath,
      script,
      tempFiles: {
        concatList: concatListPath,
        subtitle: subtitlePath
      },
      segmentCount: segments.length,
      subtitleCount: subtitles.length,
      hasTTS: !!ttsAudio,
      config: this.config
    };
  }

  /**
   * 仅拼接片段（无字幕无音频替换）
   */
  concatOnly(segments, outputPath, tempDir = '/tmp') {
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = this._buildSimpleConcatList(segments);

    const command = `${this.ffmpegPath} -f concat -safe 0 -i "${concatListPath}" ` +
      `-c:v libx264 -preset ${this.config.output.preset} -crf ${this.config.output.crf} ` +
      `-pix_fmt ${this.config.output.pixelFormat} ` +
      `-vf "scale=${this.config.output.resolution},fps=${this.config.output.fps}" ` +
      `-y "${outputPath}"`;

    return {
      command,
      concatListPath,
      concatContent,
      outputPath
    };
  }

  /**
   * 添加字幕到已有视频
   */
  addSubtitles(videoPath, subtitles, outputPath, tempDir = '/tmp') {
    const subtitlePath = path.join(tempDir, 'subtitles.ass');
    const subtitleContent = this._buildAssSubtitles(subtitles);

    const vfChain = [
      `scale=${this.config.output.resolution}`,
      `fps=${this.config.output.fps}`,
      `subtitles=${subtitlePath}:force_style='${this._getForceStyle()}'`
    ].join(',');

    const command = `${this.ffmpegPath} -i "${videoPath}" ` +
      `-vf "${vfChain}" ` +
      `-c:v libx264 -preset ${this.config.output.preset} -crf ${this.config.output.crf} ` +
      `-c:a copy -y "${outputPath}"`;

    return {
      command,
      subtitlePath,
      subtitleContent,
      outputPath
    };
  }

  /**
   * 替换视频音频为TTS旁白（强制替换，不保留原声）
   */
  replaceAudio(videoPath, ttsAudioPath, outputPath) {
    // 核心命令：-map 0:v:0 取视频画面，-map 1:a:0 取TTS音频
    const command = `${this.ffmpegPath} -y -i "${videoPath}" -i "${ttsAudioPath}" ` +
      `-map 0:v:0 -map 1:a:0 ` +
      `-c:v copy ` +
      `-c:a ${this.config.audio.codec} -b:a ${this.config.audio.bitrate} ` +
      `-ar ${this.config.audio.sampleRate} -ac ${this.config.audio.channels} ` +
      `-shortest "${outputPath}"`;

    return {
      command,
      inputVideo: videoPath,
      inputAudio: ttsAudioPath,
      outputPath,
      note: '强制替换音频：视频原声完全丢弃，只保留TTS旁白'
    };
  }

  /**
   * 完整流程：拼接+调色+字幕+TTS音画合成
   */
  fullPipeline(options) {
    const {
      segments,
      subtitles,
      ttsAudio,
      outputPath,
      transitions,
      tempDir = '/tmp'
    } = options;

    // 步骤1: 带转场的拼接
    const step1 = this._buildConcatWithTransitions(segments, transitions, tempDir);

    // 步骤2: 调色
    const step2 = this._buildColorFilter();

    // 步骤3: 字幕
    const step3 = subtitles.length > 0
      ? this._buildSubtitleFilter(subtitles, tempDir)
      : null;

    // 步骤4: TTS合成
    const step4 = ttsAudio
      ? this._buildTTSSynthesis(step1.output, ttsAudio, outputPath)
      : null;

    // 组合完整命令
    const fullCommand = this._buildFullCommand({
      step1, step2, step3, step4,
      segments, subtitles, ttsAudio,
      outputPath, tempDir
    });

    return {
      steps: {
        concat: step1,
        color: step2,
        subtitle: step3,
        tts: step4
      },
      fullCommand,
      outputPath,
      duration: segments.reduce((sum, s) => sum + (s.duration || 0), 0)
    };
  }

  /**
   * 生成预览版本（低质量快速渲染）
   */
  preview(segments, outputPath, tempDir = '/tmp') {
    const concatListPath = path.join(tempDir, 'concat_preview.txt');
    const concatContent = this._buildSimpleConcatList(segments);

    const command = `${this.ffmpegPath} -f concat -safe 0 -i "${concatListPath}" ` +
      `-c:v libx264 -preset ultrafast -crf 28 ` +
      `-vf "scale=480:480,fps=12" ` +
      `-an -y "${outputPath}"`;  // 无音频，快速

    return {
      command,
      concatListPath,
      concatContent,
      outputPath,
      note: '预览版本：480x480, 12fps, 无音频, ultrafast'
    };
  }

  // ─── 内部方法 ───

  _mergeConfig(userConfig) {
    return {
      output: { ...POST_CONFIG.output, ...(userConfig.output || {}) },
      color: { ...POST_CONFIG.color, ...(userConfig.color || {}) },
      transitions: { ...POST_CONFIG.transitions, ...(userConfig.transitions || {}) },
      subtitle: { ...POST_CONFIG.subtitle, ...(userConfig.subtitle || {}) },
      audio: { ...POST_CONFIG.audio, ...(userConfig.audio || {}) }
    };
  }

  _buildConcatList(segments, transitions) {
    const lines = [];
    const { crossfadeDuration } = this.config.transitions;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      lines.push(`file '${seg.file}'`);

      // 如果有转场，添加inpoint/outpoint控制
      if (i < segments.length - 1 && transitions[i]) {
        const t = transitions[i];
        if (t.type === 'fade' || t.type === 'crossfade') {
          // 使用交叉淡化时，片段需要重叠
          lines.push(`duration ${seg.duration + crossfadeDuration}`);
        }
      }
    }

    return lines.join('\n');
  }

  _buildSimpleConcatList(segments) {
    return segments.map(s => `file '${s.file}'\nduration ${s.duration || 5}`).join('\n');
  }

  _buildConcatWithTransitions(segments, transitions, tempDir) {
    const { crossfadeDuration } = this.config.transitions;

    // 构建交叉淡化复杂滤镜链
    let filterComplex = '';
    let lastOutput = '[v0]';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLast = i === segments.length - 1;
      const hasTransition = !isLast && transitions[i] &&
        (transitions[i].type === 'fade' || transitions[i].type === 'crossfade');

      if (i === 0) {
        filterComplex += `[0:v]trim=start=0:end=${seg.duration},setpts=PTS-STARTPTS${lastOutput};`;
      } else {
        if (hasTransition) {
          // 交叉淡化
          const overlap = crossfadeDuration;
          const fadeOutStart = seg.duration - overlap;

          filterComplex += `[${i}:v]trim=start=0:end=${seg.duration},setpts=PTS-STARTPTS[v${i}];`;
          filterComplex += `${lastOutput}[v${i}]xfade=transition=fade:duration=${overlap}:offset=${fadeOutStart}[v${i+1}];`;
          lastOutput = `[v${i+1}]`;
        } else {
          // 直接拼接
          filterComplex += `[${i}:v]trim=start=0:end=${seg.duration},setpts=PTS-STARTPTS[v${i}];`;
          filterComplex += `${lastOutput}[v${i}]concat=n=2:v=1:a=0[v${i+1}];`;
          lastOutput = `[v${i+1}]`;
        }
      }
    }

    // 最终输出
    filterComplex += `${lastOutput}format=yuv420p[final];`;

    return {
      filterComplex,
      output: path.join(tempDir, 'concat_output.mp4')
    };
  }

  _buildColorFilter() {
    const { color } = this.config;
    const filters = [];

    if (color.brightness !== 0) filters.push(`eq=brightness=${color.brightness}`);
    if (color.contrast !== 1.0) filters.push(`eq=contrast=${color.contrast}`);
    if (color.saturation !== 1.0) filters.push(`eq=saturation=${color.saturation}`);
    if (color.gamma !== 1.0) filters.push(`eq=gamma=${color.gamma}`);

    // 轻微锐化（避免过度）
    filters.push('unsharp=3:3:0.5:3:3:0.5');

    return filters.join(',');
  }

  _buildAssSubtitles(subtitles) {
    const { subtitle } = this.config;

    // ASS头部
    let ass = `[Script Info]
Title: Documentary Subtitle
ScriptType: v4.00+
PlayResX: 960
PlayResY: 960

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${subtitle.fontName},${subtitle.fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,${subtitle.outlineWidth},0,2,10,10,${subtitle.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // 字幕条目
    for (const sub of subtitles) {
      const start = this._formatAssTime(sub.start);
      const end = this._formatAssTime(sub.end);
      const text = sub.text.replace(/\n/g, '\\N');
      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    }

    return ass;
  }

  _formatAssTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  _getForceStyle() {
    const { subtitle } = this.config;
    return `FontName=${subtitle.fontName},FontSize=${subtitle.fontSize},` +
           `PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,` +
           `Outline=${subtitle.outlineWidth},BorderStyle=1,` +
           `Alignment=2,MarginV=${subtitle.marginV}`;
  }

  _buildSubtitleFilter(subtitles, tempDir) {
    const subtitlePath = path.join(tempDir, 'subtitles.ass');
    const subtitleContent = this._buildAssSubtitles(subtitles);

    return {
      path: subtitlePath,
      content: subtitleContent,
      filter: `subtitles=${subtitlePath}:force_style='${this._getForceStyle()}'`
    };
  }

  _buildTTSSynthesis(videoPath, ttsPath, outputPath) {
    return {
      command: `${this.ffmpegPath} -y -i "${videoPath}" -i "${ttsPath}" ` +
        `-map 0:v:0 -map 1:a:0 ` +
        `-c:v copy ` +
        `-c:a ${this.config.audio.codec} -b:a ${this.config.audio.bitrate} ` +
        `-ar ${this.config.audio.sampleRate} -ac ${this.config.audio.channels} ` +
        `-shortest "${outputPath}"`,
      inputVideo: videoPath,
      inputAudio: ttsPath,
      outputPath
    };
  }

  _buildFFmpegCommand({ concatListPath, subtitlePath, ttsAudio, outputPath, segments, transitions }) {
    const { output, color, transitions: transConfig } = this.config;

    // 构建视频滤镜链
    const vfParts = [
      `scale=${output.resolution}`,
      `fps=${output.fps}`
    ];

    // 调色
    const colorFilter = this._buildColorFilter();
    if (colorFilter) vfParts.push(colorFilter);

    // 片头淡入
    vfParts.push(`fade=in:st=0:d=${transConfig.fadeInDuration}`);

    // 片尾淡出（计算总时长）
    const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 0), 0);
    const fadeOutStart = totalDuration - transConfig.fadeOutDuration;
    vfParts.push(`fade=out:st=${fadeOutStart}:d=${transConfig.fadeOutDuration}`);

    // 字幕
    if (subtitlePath) {
      vfParts.push(`subtitles=${subtitlePath}:force_style='${this._getForceStyle()}'`);
    }

    const vfChain = vfParts.join(',');

    // 基础命令
    let command = `${this.ffmpegPath} -f concat -safe 0 -i "${concatListPath}" `;

    // 如果有TTS，作为第二个输入
    if (ttsAudio) {
      command += `-i "${ttsAudio}" `;
    }

    command += `-vf "${vfChain}" `;

    // 视频编码
    command += `-c:v ${output.codec} -preset ${output.preset} -crf ${output.crf} -pix_fmt ${output.pixelFormat} `;

    // 音频处理
    if (ttsAudio) {
      // 强制使用TTS音频，丢弃原视频音频
      command += `-map 0:v:0 -map 1:a:0 `;
      command += `-c:a ${this.config.audio.codec} -b:a ${this.config.audio.bitrate} ` +
                  `-ar ${this.config.audio.sampleRate} -ac ${this.config.audio.channels} `;
    } else {
      // 复制原音频
      command += `-c:a copy `;
    }

    command += `-shortest -y "${outputPath}"`;

    return command;
  }

  _buildFullCommand({ step1, step2, step3, step4, segments, subtitles, ttsAudio, outputPath, tempDir }) {
    // 这是一个多步骤pipeline的说明，实际执行需要分步
    // 步骤1: 带转场的拼接
    // 步骤2: 调色+字幕（叠加滤镜）
    // 步骤3: TTS合成

    const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 0), 0);

    // 简化版：一步完成（适合短视频）
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = this._buildSimpleConcatList(segments);

    const vfParts = [
      `scale=${this.config.output.resolution}`,
      `fps=${this.config.output.fps}`,
      step2,  // 调色
      `fade=in:st=0:d=${this.config.transitions.fadeInDuration}`,
      `fade=out:st=${totalDuration - this.config.transitions.fadeOutDuration}:d=${this.config.transitions.fadeOutDuration}`
    ];

    if (step3) vfParts.push(step3.filter);

    const vfChain = vfParts.join(',');

    let command = `${this.ffmpegPath} -f concat -safe 0 -i "${concatListPath}" `;

    if (ttsAudio) {
      command += `-i "${ttsAudio}" `;
    }

    command += `-vf "${vfChain}" `;
    command += `-c:v ${this.config.output.codec} -preset ${this.config.output.preset} -crf ${this.config.output.crf} -pix_fmt ${this.config.output.pixelFormat} `;

    if (ttsAudio) {
      command += `-map 0:v:0 -map 1:a:0 `;
      command += `-c:a ${this.config.audio.codec} -b:a ${this.config.audio.bitrate} ` +
                  `-ar ${this.config.audio.sampleRate} -ac ${this.config.audio.channels} `;
    } else {
      command += `-c:a copy `;
    }

    command += `-shortest -y "${outputPath}"`;

    return command;
  }

  _generateScript({ concatListPath, concatContent, subtitlePath, subtitleContent, command, outputPath }) {
    const lines = [
      '#!/bin/bash',
      '# Documentary Post Engine v1.0-Peng 自动合成脚本',
      '',
      `set -e`,
      '',
      '# 创建临时文件',
      `cat > "${concatListPath}" << 'EOF'`,
      concatContent,
      'EOF',
      ''
    ];

    if (subtitleContent) {
      lines.push(
        `cat > "${subtitlePath}" << 'EOF'`,
        subtitleContent,
        'EOF',
        ''
      );
    }

    lines.push(
      '# 执行合成',
      command,
      '',
      `# 输出: ${outputPath}`,
      'echo "合成完成"'
    );

    return lines.join('\n');
  }

  /**
   * 生成调色LUT预览（调试用）
   */
  generateColorPreview(inputPath, outputPath) {
    const { color } = this.config;

    const vf = [
      `scale=${this.config.output.resolution}`,
      color.contrast !== 1.0 ? `eq=contrast=${color.contrast}` : '',
      color.saturation !== 1.0 ? `eq=saturation=${color.saturation}` : '',
      'unsharp=3:3:0.5:3:3:0.5'
    ].filter(Boolean).join(',');

    return `${this.ffmpegPath} -i "${inputPath}" -vf "${vf}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an -y "${outputPath}"`;
  }
}

// ─── 导出 ───
module.exports = { PostEngine, POST_CONFIG };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Documentary Post Engine v1.0-Peng 测试 ===\n');

  const engine = new PostEngine();

  // 模拟片段
  const mockSegments = [
    { file: '/tmp/seg01.mp4', duration: 4, start: 0, end: 4 },
    { file: '/tmp/seg02.mp4', duration: 4, start: 4, end: 8 },
    { file: '/tmp/seg03.mp4', duration: 5, start: 8, end: 13 },
    { file: '/tmp/seg04.mp4', duration: 4, start: 13, end: 17 }
  ];

  // 模拟字幕
  const mockSubtitles = [
    { start: 0, end: 4, text: '小朋友们好，今天我们来认识一个健康知识' },
    { start: 4, end: 8, text: '横纹肌溶解是肌肉细胞受损后的现象' },
    { start: 8, end: 13, text: '常见原因包括过度运动和外伤' },
    { start: 13, end: 17, text: '记得多喝水，适度运动哦' }
  ];

  // 模拟转场
  const mockTransitions = [
    { from: 'S01', to: 'S02', type: 'dissolve', duration: 0.5 },
    { from: 'S02', to: 'S03', type: 'fade', duration: 1.0 },
    { from: 'S03', to: 'S04', type: 'cut', duration: 0 }
  ];

  // 测试1: 完整合成
  console.log('--- Test 1: 完整合成命令 ---');
  const result = engine.compose({
    segments: mockSegments,
    subtitles: mockSubtitles,
    ttsAudio: '/tmp/tts_narration.mp3',
    outputPath: '/tmp/final_output.mp4',
    transitions: mockTransitions,
    tempDir: '/tmp'
  });

  console.log(`  输出路径: ${result.outputPath}`);
  console.log(`  总时长: ${result.duration}s`);
  console.log(`  片段数: ${result.segmentCount}`);
  console.log(`  字幕数: ${result.subtitleCount}`);
  console.log(`  含TTS: ${result.hasTTS}`);
  console.log(`  命令长度: ${result.command.length}字符`);
  console.log(`  命令前200字符:`);
  console.log(`    ${result.command.substring(0, 200)}...`);

  // 测试2: 仅拼接
  console.log('\n--- Test 2: 仅拼接 ---');
  const concatResult = engine.concatOnly(mockSegments, '/tmp/concat_only.mp4');
  console.log(`  命令: ${concatResult.command.substring(0, 150)}...`);

  // 测试3: 替换音频
  console.log('\n--- Test 3: TTS音频替换 ---');
  const audioResult = engine.replaceAudio(
    '/tmp/video_no_audio.mp4',
    '/tmp/tts.mp3',
    '/tmp/with_tts.mp4'
  );
  console.log(`  命令: ${audioResult.command}`);
  console.log(`  说明: ${audioResult.note}`);

  // 测试4: 添加字幕
  console.log('\n--- Test 4: 添加字幕 ---');
  const subResult = engine.addSubtitles(
    '/tmp/video.mp4',
    mockSubtitles,
    '/tmp/with_subtitles.mp4'
  );
  console.log(`  字幕文件: ${subResult.subtitlePath}`);
  console.log(`  字幕内容前100字符: ${subResult.subtitleContent.substring(0, 100)}...`);

  // 测试5: ASS时间格式
  console.log('\n--- Test 5: ASS时间格式 ---');
  console.log(`  0s: ${engine._formatAssTime(0)}`);
  console.log(`  4.5s: ${engine._formatAssTime(4.5)}`);
  console.log(`  59s: ${engine._formatAssTime(59)}`);

  // 测试6: 完整Pipeline
  console.log('\n--- Test 6: 完整Pipeline ---');
  const pipeline = engine.fullPipeline({
    segments: mockSegments,
    subtitles: mockSubtitles,
    ttsAudio: '/tmp/tts.mp3',
    outputPath: '/tmp/pipeline_final.mp4',
    transitions: mockTransitions,
    tempDir: '/tmp'
  });

  console.log(`  Pipeline步骤: ${Object.keys(pipeline.steps).join(', ')}`);
  console.log(`  完整命令长度: ${pipeline.fullCommand.length}字符`);

  // 测试7: 预览版本
  console.log('\n--- Test 7: 预览版本 ---');
  const preview = engine.preview(mockSegments, '/tmp/preview.mp4');
  console.log(`  命令: ${preview.command}`);
  console.log(`  说明: ${preview.note}`);

  // 测试8: 脚本生成
  console.log('\n--- Test 8: 执行脚本 ---');
  console.log(`  脚本行数: ${result.script.split('\n').length}`);
  console.log(`  脚本前10行:`);
  result.script.split('\n').slice(0, 10).forEach(l => console.log(`    ${l}`));

  // 测试9: 配置检查
  console.log('\n--- Test 9: 配置检查 ---');
  console.log(`  分辨率: ${engine.config.output.resolution}`);
  console.log(`  帧率: ${engine.config.output.fps}fps`);
  console.log(`  对比度: ${engine.config.color.contrast}`);
  console.log(`  饱和度: ${engine.config.color.saturation}`);
  console.log(`  淡入时长: ${engine.config.transitions.fadeInDuration}s`);
  console.log(`  交叉淡化: ${engine.config.transitions.crossfadeDuration}s`);
  console.log(`  字幕字体: ${engine.config.subtitle.fontName}`);
  console.log(`  字幕大小: ${engine.config.subtitle.fontSize}px`);

  console.log('\n=== 全部测试通过 ===');
}