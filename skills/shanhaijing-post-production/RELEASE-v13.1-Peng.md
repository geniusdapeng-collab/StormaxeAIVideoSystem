# v13.1-Peng 生产发布说明

**发布日期**: 2026-05-24
**发布人**: 小G
**审核人**: 大鹏

---

## 核心升级：双版本后期合成系统

### 问题背景
大鹏需求：
> "后期合成的时候，一次生成两个版本：
> 1. 只保留原视频自带音效的，不加字幕，也不加TTS
> 2. 原视频的音效，再加TTS，但不要字幕"

### 旧版问题 (v13.0-Peng)
- 单版本输出：TTS替换原音频，原视频音效丢失
- 强制加字幕（片头+片尾黑底白字）
- 无TTS叠加混音能力

---

## v13.1-Peng 新特性

### 🆕 双版本输出

| 版本 | 文件名 | 字幕 | TTS | 原音频 | 适用场景 |
|------|--------|------|-----|--------|---------|
| **版本1** | `成片-{标题}-v1-原声版.mp4` | ❌ 无 | ❌ 无 | ✅ 保留 | 展示Seedance原生效果 |
| **版本2** | `成片-{标题}-v2-TTS版.mp4` | ❌ 无 | ✅ 叠加 | ✅ 保留 | 需要旁白解说的叙事片 |

### 🆕 核心技术：amix叠加混音

旧版（v13.0）—— TTS替换原音频：
```bash
ffmpeg -i video.mp4 -i tts.mp3 \
  -map 0:v:0 -map 1:a:0  # ❌ 替换原音频
  -c:v copy -c:a aac output.mp4
```

新版（v13.1）—— amix叠加保留原声：
```bash
ffmpeg -i video.mp4 -i tts.mp3 \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0.5[aout]" \
  -map 0:v:0 -map "[aout]"  # ✅ 原声+TTS同时存在
  -c:v copy -c:a aac -shortest output.mp4
```

### 🆕 跳过字幕合成
- 旧版：强制添加片头3秒+片尾5秒黑底白字
- 新版：Stage 4 字幕模块被跳过（双版本均不加字幕）

---

## 流程变更

### 旧版流程 (v13.0)
```
Stage 2 拼接 → Stage 3 调色 → Stage 4 字幕(+片头片尾) → Stage 4.5 TTS → Stage 5 音画合成(TTS替换)
     ↓
单片输出: 成片-{标题}.mp4 (TTS替换原音频，有字幕)
```

### 新版流程 (v13.1)
```
公共部分:
  Stage 2 拼接(保留原音频) → Stage 3 调色(保留原音频)

版本1 (原声版):
  跳过 Stage 4 字幕
  跳过 Stage 4.5 TTS
  直接复制 → 成片-{标题}-v1-原声版.mp4

版本2 (TTS版):
  跳过 Stage 4 字幕
  Stage 4.5 TTS生成
  Stage 5 amix叠加(原声+TTS) → 成片-{标题}-v2-TTS版.mp4
```

---

## 文件清单

| 文件 | 版本 | 变更 |
|------|------|------|
| `post-production.js` | v13.0-Peng → **v13.1-Peng** | 双版本assemble流程 + amix混音 |
| `RELEASE-v13.1-Peng.md` | — | 新增本文件 |

---

## 测试验证

```bash
cd skills/shanhaijing-post-production/scripts
node -c post-production.js  # ✅ 语法检查通过
```

---

## 输出示例

```
productions/烛龙觉醒-20260524/
├── 成片-烛龙觉醒-v1-原声版.mp4      ← 版本1: Seedance原生效果
├── 成片-烛龙觉醒-v2-TTS版.mp4       ← 版本2: 原声+TTS旁白
├── .stage4_5-narration.mp3          ← TTS音频（中间文件）
├── 后期制作报告.md                   ← 双版本详细报告
└── 分轨素材包/                       ← 备用音轨（向后兼容）
```

---

## 向后兼容

- 旧版 `--add-titles` 参数仍然有效（如用户手动指定）
- 分轨素材包仍然生成（即使在新版中不直接使用）
- TTS引擎接口不变

---

## 制作人

- **技术实现**: 小G
- **需求提出**: 大鹏
- **版本**: v13.1-Peng
- **日期**: 2026-05-24

---

*v13.1-Peng — 一次渲染，两个版本，原声与TTS自由切换*