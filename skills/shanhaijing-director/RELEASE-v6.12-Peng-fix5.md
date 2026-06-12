# Release v6.12-Peng-fix5 — 白泽预生产全链路修复（第二轮）

**发布时间**: 2026-06-07 11:22 GMT+8
**commit**: `HEAD` (待提交)
**项目**: 白泽预生产

## 修复内容

### 1. Critical: Stage 8.3 字段注入顺序错误（P0 字段被截断切掉）
- **根因**: `_enforceFieldStructure` 在截断循环之前执行，先追加 P0 Dialogue/Character 字段到 prompt 末尾，然后 `PriorityTruncator` 从末尾截断到 980，刚注入的 P0 字段全部被切掉
- **症状**: prompt 有内容（1136-1404字节），但 S01 的 `P1 Scene:` 标题后跟 generic fill，实际字段值被截断；S05 有 `P0 Dialogue:` 但内容不完整
- **修复**: 截断 → 注入 P0 字段 → 注入后若超 980 则二次截断（`FieldInject+ReTrunc`）
- **文件**: `director-pipeline.js`

### 2. Critical: `BeastMindEngine.generate()` 返回 shots 无 id（空字符串 `""`）
- **根因**: 引擎自己返回的 segments+shots 有 id（S01-S05），但 pipeline 写盘后变成了空字符串。`stage3-schema.js` 调用两次引擎导致第二次覆盖，且 `_generateBeastMindStoryPlan` 中 outline→segments 转换覆盖了引擎原有 segments
- **症状**: DEBUG 输出 `shot ids: ,,,,,`（6 个空字符串）；所有 prompt 文件名为 `prompt-undefined.txt`
- **修复**: 在 `_stage83_QualityCalibration()` 开头兜底分配：若 `shot.id` 为空/undefined/空字符串，重新分配 `S00-S05`
- **文件**: `director-pipeline.js`

### 3. Critical: dialogues 数据源分离导致 Dialogue 字段为空
- **根因**: Stage 7.5 将 dialogues 存入 `dialogue-annotation.json`，但 Stage 8.3 从 `story-plan.json` 读取（无 dialogues），导致 `_enforceFieldStructure` 注入的 Dialogue 字段内容为空
- **修复**: Stage 8.3 开头从 `dialogue-annotation.json` 重新加载 dialogues 并合并到 allShots
- **文件**: `director-pipeline.js`

### 4. `allShots` 嵌套数组扁平化
- **根因**: `storyPlan.segments[].shots[]` 是嵌套结构，直接 `allShots.map()` 会把数组当元素，导致 shot id 读取异常
- **修复**: 用 `flatMap` 或显式遍历展平
- **文件**: `director-pipeline.js`

### 5. dialogue 路径 TDZ（暂时性死区）问题
- **根因**: 使用 `path.join(productionDir, '03-shots', 'dialogue-annotation.json')` 时 productionDir 尚未初始化
- **修复**: 改用模板字符串拼接路径

### 6. `PromptFieldStandard` 调用方式错误
- **根因**: `stage8-pregeneration.js` 顶部 `require('./prompt-field-standard')` 后，用 `new promptFieldStandard_1.default()` 调用，但导出是 `module.exports = PromptFieldStandard`（非 default）
- **修复**: 改用 `new PromptFieldStandard()`
- **文件**: `stage8-pregeneration.js`

## Pipeline 运行验证（第二轮）

**运行时间**: 2026-06-07 11:18 GMT+8
**版本**: v6.12-Peng-fix5

### Stage 8.3 DEBUG 输出
```
[DEBUG Stage83] allShots.length=6, shot ids: S00,S01,S02,S03,S04,S05 ✅
```

### 质量校准结果（第二轮 Stage 8.3）
| 镜头 | 截断前 | 截断后 | 注入后 | 二次截断 | 合规率 |
|------|--------|--------|--------|----------|--------|
| S00 | 1128 | 980 | - | 980 | 100% ✅ |
| S01 | 1123 | 980 | - | 980 | 100% ✅ |
| S02 | 1109 | 980 | - | 980 | 100% ✅ |
| S03 | 1123 | 980 | - | 980 | 100% ✅ |
| S04 | 1091 | 980 | - | 980 | 100% ✅ |
| S05 | 1238 | 980 | - | 980 | 100% ✅ |

### Stage 7.5 对话标注
- 4 句对白（S01/S02/S04/S05），白泽 2 句、小G 2 句
- 来源: LLM

### prompt 文件
- S00: 1136B（截断至980字符后写盘，显示1136字节含末尾截断内容）
- S01: 1080B、S02: 1132B、S03: 1094B、S04: 1226B、S05: 1404B
- 文件名: ✅ `prompt-S00.txt` ~ `prompt-S05.txt`（非 `prompt-undefined.txt`）

## 待优化项（v6.13 议程）

1. **字段注入仍不完整**: prompt 中 `P1 Scene` 后续跟 generic fill，Dialogue 字段内容被截断不完整
2. **prompt 内容质量**: 当前 prompt 世界基底/角色锚点为 0%，镜头增量为 100%，三层架构失衡
3. **8 标准字段缺失**: Action/Scene/Mood/Camera/Lighting/NegativePrompt/RenderStyle/DirectorStyle 均缺失
4. **双 Stage 8.3 调用**: pipeline 跑了两次 Stage 8.3（第一次来自 `stage8_2_PromptPreGeneration()` 末尾，第二次来自主流程 `_stage83_QualityCalibration()`）
5. **时长分配偏差 20%**: Stage 7 分配 48s vs 目标 60s
