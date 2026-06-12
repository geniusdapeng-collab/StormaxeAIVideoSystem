# RELEASE v6.26-Peng — 提示词全英文 + 片头清理 + 字段优先级修复

**日期**: 2026-06-09
**类型**: P0级质量修复（提示词语言/片头污染/字段优先级）
**验证场景**: 白泽预生产 v6.26d

---

## 🔥 核心变更总览

| 类别 | 变更 | 影响范围 |
|------|------|----------|
| 语言统一 | Stage 3.5 LLM prompt 模板改为英文输出，所有 P1 字段改为英文 | 全链路 |
| S00 片头 | 修复中文污染，AudioLayer 优先用 englishDesc | 片头系统 |
| 字段优先级 | 小写英文字段 > 大写中文字段 | 全链路 |
| Bug 修复 | 修复 `.slice is not a function`（visualAppearance 是对象） | Stage 3.5 |

---

## 修复清单

### 1. stage3-field-enrichment.js

**① LLM prompt 模板改为英文输出**
- `buildEnrichmentPrompt()`: 从中文提示词改为英文（"You are a cinematic storyboard expert..."）
- 要求 LLM 输出英文内容（除 Dialogue 保留中文）
- `DEFAULT_FIELDS` 全部改为英文占位符

**② 修复 `.slice is not a function` bug**
- `c.profile?.visualAppearance` 可能是对象而非字符串
- 修复：先 `typeof va === 'string'` 判断，再 `.slice(0, 200)`

**③ systemPrompt 改为英文**
- 从"你是视频分镜脚本专家"改为 "You are a cinematic storyboard expert..."

### 2. director-pipeline.js

**① `_buildShotContext` 字段优先级反转**
```
变更前: shot.Scene || shot.description || shot.scene
变更后: shot.scene || shot.Scene || shot.description
```
- 优先用 Stage 3.5 LLM 生成的小写英文字段，大写中文字段作为 fallback

**② AudioLayer 注入修复**
- 优先用 `shot._audioLayer.englishDesc` 而非 `seedancePromptSegment`
- 防止中文污染内容进入 prompt

### 3. stage8-pregeneration.js

- P1 字段读取优先用小写英文：`shot.scene || shot.Scene`
- `shot.action || shot.Action`
- `shot.character || shot.Character`

### 4. prompt-engine-v2.js

- **字段优先级全面反转**：小写英文 > 大写中文
- `sceneContent = shot.scene || shot.Scene`
- `actionContent = shot.action || shot.Action`
- `shotFieldOverrides` 全部改为 `shot.character || shot.Character`

---

## 验证结果

| 检查项 | v6.25 | v6.26 | 状态 |
|--------|-------|-------|------|
| 片头 S00 语言 | 中文污染 | ✅ 纯英文 | 修复 |
| S01 提示词语言 | 中文 | ✅ 英文主体+中文台词 | 修复 |
| 10字段注入 | 7/10 | ✅ 7/10（CharacterRef需定妆照） | 不变 |
| 提示词利用率 | ~30% | ✅ 92.8%-99.2% | 达标 |
| 质检通过率 | 7/7 | ✅ 7/7 PASS | 达标 |
| 字段完整性 | 9/9 | ✅ 9/9 | 达标 |

---

## 注意事项

- **CharacterRef 字段仍缺失**：需要配置 ARK_API_KEY 才能生成定妆照
- **AudioLayer 是 S00 专用**：S01-S06 不需要此字段
- **Scene 内容已存在于 prompt**：只是没有单独加 【Scene】标签（内容在 prompt 头部）
