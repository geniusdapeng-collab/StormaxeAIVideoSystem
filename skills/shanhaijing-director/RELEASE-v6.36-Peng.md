# RELEASE-v6.36-Peng.md

**版本**: v6.36-Peng
**发布日期**: 2026-06-12
**Pipeline**: ShanhaiStory Forge v2.43-Peng

## 核心变更

### 三大根因修复：场景幻觉 + CharacterRef损坏 + S00过长

白泽预生产中 Pipeline 全链路通过，但 3 个深层 Bug 导致输出质量严重下降。本次发布一次性修复全部根因。

---

### Fix 1: Stage 3.5 场景幻觉修复

**根因**: `stage3-field-enrichment.js` 的 LLM prompt 缺少故事背景（`storyPlan.synopsis/description` 为空），LLM 只能瞎编通用科幻场景（实验室/走廊/控制室）。

**修复**: 从 `outline` + `shot.description` + `beastMind` + `worldview` 构建完整上下文注入 prompt，禁止 Earth-like 场景。

**文件**: `stage3-field-enrichment.js`

### Fix 2: CharacterRef 中文损坏修复

**根因**: `enforceEnglishOutsideDialogue()` 对所有非 Dialogue 字段 stripChinese()，CharacterRef 中文文件名被破坏。

**修复**: CharacterRef 加入 CHINESE_SAFE_FIELDS 豁免集合。

**文件**: `prompt-final-normalizer.js`

### Fix 3: S00 过长 + 台词修复

**根因**: Scene 截断 1500 字符过大；Dialogue 硬编码品牌文案。

**修复**: Scene → 300 字符；Dialogue 从 outline['起'] 提取。

**文件**: `prompt-final-normalizer.js`

### Fix 4: 合规检查豁免 CharacterRef

**根因**: 合规检查中文检测未排除 CharacterRef，Fix 2 后触发阻断。

**修复**: 中文检测正则新增 CharacterRef 排除。

**文件**: `director-pipeline.js`

### Fix 5: segments.shots 重分配 Bug

**根因**: act 名匹配 segment ID 导致所有 shots 被过滤。

**修复**: 删除错误的重分配逻辑。

**文件**: `beastmind-engine.js`

---

## 修改文件清单

| 文件 | 修改类型 |
|------|---------|
| `stage3-field-enrichment.js` | LLM prompt 注入完整故事上下文 |
| `prompt-final-normalizer.js` | CharacterRef 豁免 + S00 Scene/Dialogue 修复 |
| `director-pipeline.js` | 合规检查豁免 CharacterRef + 版本号 |
| `beastmind-engine.js` | 删除错误 segments.shots 重分配 |
| `versions/LATEST.md` | 版本更新 |
| `AGENTS.md` | 版本号更新 |
| `HEARTBEAT.md` | 版本号更新 |

---

## 验证

白泽预生产全链路通过（6/6 镜头合规）：
- S01-S05 场景全部正确（Nirath 光脉峡谷）
- CharacterRef 角色名和文件名完整保留
- S00 Scene 截断至 300 字符，Dialogue 使用故事大纲
