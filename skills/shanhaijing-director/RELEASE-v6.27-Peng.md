# 🎬 ShanhaiStory Forge — v6.27-Peng 发布记录

**发布日期**: 2026-06-09
**版本**: v6.27-Peng
**入口**: `skills/shanhaijing-director/scripts/director-pipeline.js`

---

## 核心升级：最终标准化闸门 + 内容质量增强

本次版本基于 v6.26-Peng，引入两个全新核心模块，形成「增强→标准化→写盘→校验」四级交付闸门。

---

## 新增文件

### 1. `prompt-final-normalizer.js`（核心新模块）
**职责**：10字段最终标准化 + 片头统一识别 + 非 Dialogue 字段英文化

**导出函数**：
- `normalizeShotPromptFields(shot, storyPlan, opts)` — 单镜头标准化
- `normalizeAllShots(allShots, storyPlan, opts)` — 全量镜头批量标准化
- `isOpeningTitleShot(shot)` — **统一片头识别**（替代分散的4重判断条件）
- `stripChinese(shot)` — 非 Dialogue 字段中文清洗
- `FINAL_PROMPT_FIELDS` — 10个固定字段常量
- `FINAL_TOTAL_CHAR_LIMIT = 6500` — 总字符硬限制
- `ENGLISH_WORD_LIMIT = 1000` — 英文词数上限
- `CHINESE_DIALOGUE_BUDGET = 500` — 中文台词上限

**标准化规则**：
- 10字段强制顺序：CharacterRef / Timeline / Dialogue / AudioLayer / Character / Action / Scene / Mood / Camera / Lighting
- Dialogue 字段保留中文台词，其他字段全部英文
- 片头 shot 完全跳过 LLM 生成，直接使用 `_titleConfig.seedancePrompt`
- 写盘前再次调用 `normalizeShotPromptFields` 保护 S00

---

### 2. `shot-quality-enhancer.js`（核心新模块）
**职责**：10项内容质量增强，Stage 8.3 统一入口

**10项增强**：
1. 叙事目的注入（narrative purpose）
2. 视觉钩子标签（visual hook）
3. 相邻镜头差异化（diversify adjacent）
4. 角色行为逻辑（behavior logic）
5. 高潮镜头升级（climax upgrade）
6. 片头钩子强化（opening hook）
7. 前景/中景/背景层次（depth plan）
8. 第一视觉重点（primary focus）
9. 可拍摄化约束（cinematic readability）
10. 统一入口 `enhanceShotQualityBundle(allShots, storyPlan)`

---

## director-pipeline.js 改动

### Stage 8.3 重写（`_stage83_QualityCalibration`）
**新增4大能力**：
1. 调用 `enhanceShotQualityBundle()` 内容质量增强
2. 调用 `_finalNormalizeAllShots()` 最终标准化
3. S00 片头 shot 写盘前再次标准化
4. 写盘后二次校验 Throw-If-Missing（缺字段直接报错阻断）

### `_finalNormalizeAllShots()` 新方法
- 位置：Stage 8.3 内部，Stage 8.2 写盘之前
- 顺序：enhanceShotQualityBundle() → normalizeAllShots() → 每镜头中文清洗
- 结果存入 `this.results.finalNormalizeResults`

### 合规检查增强（`_runComplianceCheck`）
新增检查项（全部在 `director-pipeline.js:2125-2165`）：
- 10字段完整性（`checkFinalTenFields`）
- 英文词数 ≤ 1000（`countEnglishWords`）
- 中文台词 ≤ 500（`countChineseChars`）
- 总字符 ≤ 6500
- 非 Dialogue 字段含中文报错

### 顶部 require 语句（537-551行）
新增统一导入：
```javascript
const { normalizeShotPromptFields, normalizeAllShots, isOpeningTitleShot,
      stripChinese, FINAL_PROMPT_FIELDS, FINAL_TOTAL_CHAR_LIMIT,
      ENGLISH_WORD_LIMIT, CHINESE_DIALOGUE_BUDGET,
      countEnglishWords, countChineseChars, checkFinalTenFields } = require('./prompt-final-normalizer');

const { enhanceShotQualityBundle } = require('./shot-quality-enhancer');
```

---

## char-counter.js 改动

| 改动项 | 原值 | 新值 |
|--------|------|------|
| HARD_LIMIT | 5500 | **6500** |
| 新增方法 | — | `countEnglishWords(str)` |
| 新增方法 | — | `countChineseChars(str)` |

---

## stage8-pregeneration.js 改动

- S00 片头识别：本地分散条件 → 统一调用 `isOpeningTitleShot(shot)`
- 修复重复 `if (isOpeningTitleShot(shot)) {` 语法错误

---

## 版本历史

| 版本 | 日期 | 核心变更 |
|------|------|---------|
| v6.27-Peng | 2026-06-09 | 最终标准化闸门 + 内容质量增强 + S00片头保护 |
| v6.26-Peng | 2026-06-09 | 提示词全英文+片头清理+字段优先级反转 |
| v6.25 | 2026-06-09 | PRD质量校验+StoryPlan fallback+dias iter修复 |
| v6.24-fix31 | 2026-06-08 | 对话标注+角色绑定修复 |
| v6.22-fix17 | 2026-06-08 | 字段格式统一+语言全英文+片头修复 |
