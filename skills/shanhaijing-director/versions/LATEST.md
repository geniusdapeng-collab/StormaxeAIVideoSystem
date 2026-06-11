# LATEST.md — ShanhaiStory Director Pipeline
**当前版本**: v6.34-Peng
**发布日期**: 2026-06-11
**入口文件**: scripts/director-pipeline.js

## 核心变更 (v6.34-Peng)

### 🏗️ LLM Contract Layer 统一契约层 (v6.34-Peng)

**根因**: v6.32 把 14 个模块全 LLM 化但没有统一 JSON 契约层，各模块各自解析 LLM 输出，字段名混用（Scene/scene、Action/action、Dialogue/dialogues）。

**方案**: 新增 `llm-contract.js` (330行) 作为统一契约层，提供：
- `extractJSONObject()` — 4层策略稳健提取 JSON（```json → ``` → 平衡括号 → 直接本体）
- `safeParseJSON()` — 容错 parse（自动修复 trailing comma）
- `normalizeStoryPlan()` — story-plan 标准化（story_plan展开、characters→数组、shotId→id、字段小写）
- `normalizeDialogueAnnotation()` — 对白标注标准化
- `normalizeShot()` / `normalizeCharacters()` / `normalizePromptFields()`
- `parseLLMContract()` — 模块级统一入口

**接入模块**:
1. `beastmind-engine.js` — 版本号 v2.0→v3.0，LLM/本地输出都走 normalizeStoryPlan
2. `director-pipeline.js` — toCharArray→normalizeCharacters，_getStoryPlanStatus→normalizeStoryPlan，对白读取→normalizeDialogueAnnotation，删除重复 _shouldUseBeastMind()
3. `llm-caller.js` — 新增 callContractJSON() 统一入口
4. `stage3-field-enrichment.js` — 入口处 normalize story-plan

**设计原则**: LLM 输出不是可信输入，全部进入 Contract Layer → 字段别名归一化 → 缺省值补齐 → 下游唯一认可的标准结构。内部字段统一小写。

## 历史版本

### v6.33-Peng — 四项链路修复落地
1. FATAL_BLOCKER硬停止
2. 定妆照前置检查
3. 台词污染修复
4. Agent行为约束

## 调用方式
```bash
node director-pipeline.js pre-production --production-dir <绝对路径> --worldview nirath
```
