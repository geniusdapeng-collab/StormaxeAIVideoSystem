# RELEASE-v6.37-Peng.md

**版本**: v6.37-Peng
**发布日期**: 2026-06-12
**Pipeline**: ShanhaiStory Forge v2.44-Peng

## 核心变更

### 🎵 背景音效生成器 — 通用化重构 v1.0-Peng

**背景**: `_buildBackgroundSoundLocal` 硬编码了 Nirath/山海经/异兽/光脉等世界特定关键词，LLM prompt 也写死了 "ShanhaiStory Forge set on planet Nirath"。StormaxeAIVideoSystem 是通用视频制作系统，音效模块不应绑定单一世界观。

**重构方案**: 新建 `background-sound-designer.js`（通用核心），原 `prompt-final-normalizer.js` 改为薄适配层。

#### 新模块引入的专业框架

| 框架层 | 内容 |
|------|------|
| Murch 音效层次 | Dialogue > SFX > Music，区分 diegetic/non-diegetic |
| 频率分离 | 低频 20-200Hz（重量/威胁）、中频 200-2kHz（纹理/空间）、高频 2k-20kHz（细节/紧张） |
| 叙事功能 | establishing / transitional / emotional / tension / action_climax / release — 每种有独立强度曲线 |
| 镜头衔接连续性 | audio bridge / crossfade / hard cut，支持 prevShotSound/nextShotSound 参数 |
| 类型调色板 | 10 种 genre（fantasy/scifi/horror/noir/action/drama/documentary/comedy/romance/thriller），每种有 signature/low/mid/high/avoid |
| 环境音库 | 11 种环境（forest/mountain/urban/underwater/desert/cave/arctic/space/indoor/battlefield/coastal），每种有 3 层音效 + 空间设计 + 频率配置 |

#### 输出格式升级

```
旧: AMBIENT: ... | SPATIAL: ... | INTENSITY: ...
新: AMBIENT: ... | SPATIAL: ... | INTENSITY: ... | FREQUENCY: low/mid/high | FUNCTION: narrative purpose
```

#### 向后兼容

- `buildBackgroundSound(shot, storyPlan, shotType)` — 完全兼容，内部委托给新模块
- `_buildBackgroundSoundLocal(shot, storyPlan, shotType)` — 保留，`director-pipeline.js` 的安全网继续工作
- 山海经场景自动映射到 `genre: fantasy`，Nirath 世界观通过 `worldContext` 参数注入

#### 测试结果

4 个场景全部通过：山海经/刑天（fantasy/mountain）、太空站逃生（scifi/space）、黑色电影暗巷（noir/urban）、维多利亚鬼宅（horror/indoor）。LLM 输出质量显著提升——每个场景都有 5 层音效 + 频率分配 + 叙事功能描述。

### 文件变更

| 文件 | 变更 |
|------|------|
| `background-sound-designer.js` | **新增** — 582行通用背景音效设计核心模块 |
| `prompt-final-normalizer.js` | **重构** — 145行变更（+51/-94），委托给通用模块 |

## 历史版本

### v6.36-Peng — 三大根因修复
场景幻觉 + CharacterRef损坏 + S00过长修复

### v6.35-Peng — userInput 空值根因修复
PRD 标题提取正则修复 + --outline CLI 参数

### v6.34-Peng — LLM Contract Layer 统一契约层
14 模块 LLM 化统一 JSON 契约层

## 调用方式
```bash
node director-pipeline.js pre-production --production-dir <绝对路径> --worldview nirath
```
