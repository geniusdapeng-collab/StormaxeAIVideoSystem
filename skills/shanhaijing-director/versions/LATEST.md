# LATEST.md — ShanhaiStory Director Pipeline
**当前版本**: v6.36-Peng
**发布日期**: 2026-06-12
**入口文件**: scripts/director-pipeline.js

## 核心变更 (v6.36-Peng)

### 🔧 三大根因修复：场景幻觉 + CharacterRef损坏 + S00过长

**背景**: 白泽预生产中 Pipeline 全链路通过，但 3 个深层 Bug 导致输出质量严重下降：
1. S01-S05 场景全是"实验室/走廊/控制室"（应为 Nirath 光脉峡谷）
2. CharacterRef 角色名和文件名全部损坏（"白泽-45度半身.png" → "-45.png"）
3. S00 开场白过长 + 台词是品牌文案而非故事内容

#### Fix 1: Stage 3.5 字段充实 — 场景幻觉根因修复

**根因**: `stage3-field-enrichment.js` 的 `buildEnrichmentPrompt()` 用 `storyPlan.synopsis || storyPlan.description` 给 LLM 提供故事背景，但 `BeastMindEngine._convertToStoryPlan()` 从未设置这两个字段。LLM 拿到空的故事背景，只能瞎编通用科幻场景。

**修复**: 从 `storyPlan.outline` + `shot.description` + `beastMind` + `worldview` 构建完整故事上下文，注入 LLM prompt：
- 世界观描述（Nirath 双日、光脉、生物荧光生态）
- 故事大纲（起承转合）
- 异兽信息（archetype、burden）
- 当前镜头描述（BeastMind 生态级描述）
- 禁止 Earth-like 场景

**影响范围**: `stage3-field-enrichment.js`

#### Fix 2: prompt-final-normalizer — CharacterRef 中文损坏修复

**根因**: `enforceEnglishOutsideDialogue()` 对所有非 Dialogue 字段调用 `stripChinese()`，但 CharacterRef 包含中文文件名（如 `白泽-正面全身.png`）。中文被 strip 后变成 `- .png`，角色名 `白泽` 变空，`小G` 变 `G`。

**修复**: CharacterRef 加入 `CHINESE_SAFE_FIELDS` 豁免集合，与 Dialogue 同等待遇。CharacterRef 是元数据字段不参与 Seedance 视觉生成，保留中文不影响渲染。

**影响范围**: `prompt-final-normalizer.js`

#### Fix 3: S00 过长 + 台词修复

**根因**: 
- S00 Scene 字段用 `stripChinese(titlePrompt).slice(0, 1500)`，1500 字符上限过大
- Dialogue 硬编码为 "Welcome to planet Nirath. I am Baize..." 品牌文案

**修复**:
- Scene 截断上限从 1500 → 300 字符
- Dialogue 从故事大纲 `outline['起']` 提取，fallback 为 `"吾名${beastName}，通晓万物之情。"`

**影响范围**: `prompt-final-normalizer.js`

#### Fix 4: director-pipeline — 合规检查豁免 CharacterRef 中文

**根因**: 合规检查器的中文检测未排除 CharacterRef 字段，修复 Fix 2 后 CharacterRef 保留中文导致合规阻断。

**修复**: 中文检测正则新增 CharacterRef 排除，与 Dialogue 排除并列。

**影响范围**: `director-pipeline.js`

#### Fix 5: beastmind-engine — segments.shots 重分配 Bug 修复

**根因**: `_convertToStoryPlan` 已将 shots 正确放入 `segments[0].shots`，但后续 `segments.map(seg => ({ ...seg, shots: storyPlan.shots.filter(s => s.act === seg.id?.replace('SEG','') || s.segmentId === seg.id) }))` 用 act 名（如 '起/Setup'）匹配 segment ID（如 'act1'），导致所有 shots 被过滤掉。

**修复**: 删除错误的重分配逻辑，信任 `_convertToStoryPlan` 的输出。

**影响范围**: `beastmind-engine.js`

### 验证结果

白泽预生产全链路通过（6/6 镜头合规）：
| 镜头 | 修复前场景 | 修复后场景 |
|------|----------|----------|
| S01 | "dimly lit laboratory" ❌ | "Nirath canyon at dual-sunset, purple-gold light" ✅ |
| S02 | "metallic corridor" ❌ | "Nirath canyon, bioluminescent light veins" ✅ |
| S03 | "dimly lit control room" ❌ | "narrow canyon of Nirath, purple-gold light" ✅ |
| S04 | "floating islands" ❌ | "Nirath light vein fissure canyon under dual-sunset" ✅ |
| S05 | "dimly lit laboratory" ❌ | "vast canyon on Nirath with pulsating light veins" ✅ |

CharacterRef 修复前后对比：
```
修复前: 【CharacterRef】 : -45 .png, - .png, - .png | G: G-45 .png
修复后: 【CharacterRef】 白泽: 白泽-45度半身.png, 白泽-侧面全身.png, 白泽-动作坐姿.png | 小G: 小G-45度半身.png, 小G-侧面全身.png, 小G-动作坐姿.png
```

## 历史版本

### v6.35-Peng — userInput 空值根因修复
PRD 标题提取正则修复 + --outline CLI 参数 + PRD outline 上限提升

### v6.34-Peng — LLM Contract Layer 统一契约层
14 模块 LLM 化统一 JSON 契约层，字段别名归一化

### v6.33-Peng — 四项链路修复落地
FATAL_BLOCKER 硬停止 + 定妆照前置检查 + 台词污染修复 + Agent 行为约束

## 调用方式
```bash
node director-pipeline.js pre-production --production-dir <绝对路径> --worldview nirath
```
