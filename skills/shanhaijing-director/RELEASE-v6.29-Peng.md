# 🎬 ShanhaiStory Forge — v6.29-Peng 发布记录

**发布日期**: 2026-06-10
**版本**: v6.29-Peng
**入口**: `skills/shanhaijing-director/scripts/director-pipeline.js`

---

## 核心修复：字段重复问题 + 质量校准增强

本次版本修复了 Stage 8.3 质量校准环节的字段重复注入问题，以及 `normalizeShotPromptFields` 覆盖不全导致的部分镜头写盘后缺失字段问题。

---

## 修复清单

### fix37 — 所有字段跳过 hasField 检查（强制注入）
**根因**: 部分字段（如 CharacterRef、AudioLayer）未写入 `shot._characterRefs`，导致 `hasField` 检查返回 false，字段被跳过不注入。

**方案**: 新增 `const skipHasField = true`（v6.29-Peng-fix37），所有字段强制注入，不再依赖 hasField 检查。

**文件**: `director-pipeline.js` line ~3111

---

### fix38 — 防重入保护 + normalizeShotPromptFields 扩展至全镜头
**根因**: `_enforceSingleShotFields` 在 Stage 8.3 主流程中被调用两次（正常主流程 + `_fixDuplicateContent` 内部），导致字段在 `shot._generatedPrompt` 中重复注入。另外，`normalizeShotPromptFields` 仅处理 S00，导致其他镜头写盘后缺失字段。

**方案**:
1. 新增 `_enforceShotFieldsCalled` 防重入标记，同一 shot 只注入一次
2. `normalizeShotPromptFields` 从仅 S00 扩展至所有镜头

**文件**: `director-pipeline.js` lines ~3075-3080

---

## 质量数据（白泽预生产）

| 指标 | 值 |
|------|-----|
| 总镜头 | 7 (S00-S06) |
| Stage 8.3 通过率 | 7/7 (100%) |
| 10字段完整性 | 7/7 (100%) |
| Prompt 字段重复 | 0 |
| 闸机自愈 | 14 处 |
| 闸机阻断 | 0 |

---

## 调用方式

```bash
# 默认叙事模式（30-120s，7镜，故事弧线）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath

# 抖音快剪模式（15-30s，10镜，钩子先行）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath --platform douyin_short

# TikTok创作模式（30-60s，12镜，BGM卡点）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath --platform tiktok_creator
```

---

## 版本历史

| 版本 | 日期 | 核心变更 |
|------|------|---------|
| v6.28-Peng | 2026-06-09 | 肾上腺镜头库 + 抖音/TikTok快剪模式 |
| v6.29-Peng | 2026-06-10 | fix37+fix38: 全字段跳过hasField检查+防重入保护+normalize扩展至全镜头 |
