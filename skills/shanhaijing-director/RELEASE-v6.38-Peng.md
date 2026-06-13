# Release v6.38-Peng — 系统通用性修复

**日期**: 2026-06-13  
**版本**: Director Pipeline v6.38-Peng | Task Type Router v2.1-Peng  
**类型**: 生产版本 — 系统级通用性修复

---

## 修复背景

在《横纹肌溶解·第一集》预生产过程中发现以下系统级问题：

1. **任务类型误判**: 科普教育内容（横纹肌溶解健康科普）被关键词匹配误判为"山海经"模式，触发异兽引擎
2. **片头模板不兼容**: 非山海经内容走山海经片头模板，导致中文标题、神兽出场等不适配
3. **模式检测脆弱**: `shanhaijingMode` 仅靠关键词匹配，科普内容中引用"山海经"等词汇会误触发

## 修复内容

### 1. task-type-router.js — LLM智能路由（主通道）+ 关键词降级

**问题**: `detectTaskType()` 纯关键词匹配，科普内容中的"山海经"关键词会触发异兽模式

**修复**:
- 新增 `detectTaskTypeLLM()` — LLM语义理解作为主通道，理解用户真实意图
- 保留 `detectTaskTypeKeywords()` 作为降级通道
- 降级通道新增反误判规则：教育类关键词权重 1.5x（高于山海经的 1x）
- 同时命中山海经+教育关键词时，优先教育
- 默认类型从 `shanhaijing` 改为 `education`（更通用）

### 2. director-pipeline.js — shanhaijingMode 反误判

**问题**: `shanhaijingMode` 通过 `userInputText` 关键词检测，科普内容引用"山海经"会误激活

**修复**:
- 移除 `userInputText` 关键词检测通道
- 仅通过 `worldview` 和 `styleProfile` 显式配置激活
- 新增 `isEducationContent` 反误判：科普内容即使 `worldview=shanhaijing` 也不激活

### 3. director-pipeline.js — 片头设计路由

**问题**: 非山海经内容走山海经片头模板（中文标题、神兽出场设计）

**修复**:
- `_designOpeningTitle()` 路由条件放宽：`!shanhaijingMode && (worldview===superreal || worldview===nirath)` → 通用模板
- 通用模板通过 `_designGeneralOpeningTitle()` 调用 `generateGeneralOpeningTitle()`
- 内容类型优先从 `routeConfig.taskType` 推断（更准确）

### 4. director-pipeline.js — S00 标题注入

**问题**: 非山海经模式硬编码 `englishTitle: 'Rhabdomyolysis'`

**修复**:
- 通用模式动态提取 `storyPlan.englishTitle || storyPlan.title`
- 副标题动态提取 `storyPlan.englishSubtitle || 'Episode 1'`
- 山海经模式保持原有逻辑不变

## 影响范围

| 模块 | 影响 | 兼容性 |
|------|------|--------|
| task-type-router.js | LLM路由+关键词降级双通道 | ✅ 向后兼容，旧调用方式不变 |
| director-pipeline.js | shanhaijingMode检测逻辑 | ✅ 山海经系列行为不变 |
| director-pipeline.js | 片头设计路由 | ✅ 山海经系列走原有模板 |
| director-pipeline.js | S00标题注入 | ✅ 山海经系列逻辑不变 |

## 测试建议

1. **科普内容测试**: 输入"横纹肌溶解健康科普" → 应路由到 `education`，不激活山海经模式
2. **山海经内容测试**: 输入"白泽的神话故事" → 应路由到 `shanhaijing`，正常激活异兽模式
3. **混合内容测试**: 输入"从山海经角度看健康养生" → 应路由到 `education`（反误判）
4. **关键词降级测试**: LLM不可用时 → 关键词降级正常工作

## 文件变更

```
skills/shanhaijing-director/scripts/
├── director-pipeline.js    (v6.37→v6.38)
├── task-type-router.js     (v2.0→v2.1)
└── RELEASE-v6.38-Peng.md   (新增)
```
