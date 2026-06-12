---
name: seedance-dialogue-engine
license: MIT
description: 台词对白引擎。为视频生成系统提供角色台词设计、TTS 语音生成、音频参考注入能力。当用户需要"加台词"、"生成对白"、"角色说话"、"旁白"、"语音合成"、"台词设计"时激活。支持 5 种视频类型（动作/剧情/教育/广告/纪录片）的自动台词模板，edge-tts 语音合成，Seedance 音频参考注入。
compatibility: Requires Node.js 18+, edge-tts Python package, ffmpeg.
metadata:
  author: openclaw
  version: "1.0.0-Peng"
  category: ai/video-production
---

# Seedance Dialogue Engine — 台词对白引擎

## 概述

**台词和对白是剧情的灵魂。**

`seedance-dialogue-engine` 为视频制作系统提供完整的台词能力：

```
story-plan.json
    ↓
dialogue-engine design → 台词脚本（JSON + Markdown）
    ↓
dialogue-engine tts → 角色语音文件（MP3）
    ↓
dialogue-engine prepare → Seedance 音频参考
    ↓
Seedance 渲染（带 --audio-file）
    ↓
成片包含角色对白
```

## 触发条件

**用户说以下关键词时自动激活：**
- 加台词、生成对白、角色说话、旁白
- 语音合成、台词设计、对白生成
- dialogue、voice、narration

## 核心能力

### 1. 台词设计（design）

根据视频类型和镜头规划自动生成台词：

| 视频类型 | 台词风格 |
|---------|---------|
| action | 热血对白 + 战斗呐喊 + 旁白 |
| drama | 情感对白 + 心理独白 + 留白 |
| educational | 讲师讲解 + 学生互动 |
| commercial | 用户感叹 + 旁白介绍 |
| documentary | 旁白叙述 + 受访者口述 |

### 2. TTS 语音生成（tts）

使用 edge-tts 为每个角色生成专属语音：

| 角色类型 | 默认音色 | 说明 |
|---------|---------|------|
| 男主（热血） | zh-CN-YunxiNeural | 活泼男声 |
| 女主（温暖） | zh-CN-XiaoxiaoNeural | 温暖女声 |
| 反派（霸气） | zh-CN-YunjianNeural | 激情男声 |
| 旁白 | zh-CN-YunyangNeural | 专业男声 |

### 3. Seedance 音频注入

将生成的对白音频作为参考传入 Seedance：
```bash
node seedance-wrapper.js create \
  --prompt "..." \
  --audio-file "./06-dialogue-audio/S01/line1.mp3"
```

## 使用方法

### 完整流程
```bash
node dialogue-engine.js full --story-plan "./01-story-plan.json"
```

### 仅设计台词
```bash
node dialogue-engine.js design --story-plan "./01-story-plan.json"
```

### 仅生成语音
```bash
node dialogue-engine.js tts --story-plan "./01-story-plan.json" --dialogue-file "./dialogue-script.json"
```

## 输出文件

```
production-dir/
├── dialogue-script.json     # 台词脚本（JSON）
├── dialogue-script.md       # 台词本（Markdown，可读）
├── voice-config.json        # 角色音色配置
├── tts-manifest.json        # TTS 音频清单
├── 06-dialogue-audio/       # Seedance 音频参考目录
│   ├── S01/
│   │   ├── S01_line01_Xiaoxiao.mp3
│   │   └── S01_line02_Yunxi.mp3
│   └── S02/
│       └── S02_line01_Xiaoxiao.mp3
├── dialogue/                # 对白音频
│   └── S01/
│       ├── S01_line01_Xiaoxiao.mp3
│       └── S01_line02_Yunxi.mp3
└── narration/               # 旁白音频
    └── S01_line03_Yunyang.mp3
```

## 依赖

- **edge-tts** (Python): `pip3 install edge-tts`
- **ffmpeg**: 系统安装
- **Node.js 18+**
