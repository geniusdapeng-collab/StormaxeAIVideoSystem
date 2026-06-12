# RELEASE v6.34-Peng — LLM Contract Layer 统一契约层

**发布日期**: 2026-06-11
**基于**: v6.33-Peng
**入口**: `scripts/director-pipeline.js`

---

## 🏗️ 核心变更

### 新增: `llm-contract.js` (330行)

统一 LLM 输出 JSON 契约层。根因是 v6.32 把 14 个模块全 LLM 化但没有统一 JSON 契约层，各模块各自解析 LLM 输出，字段名混用（Scene/scene、Action/action、Dialogue/dialogues）。

**提供的 API**:
| 函数 | 职责 |
|------|------|
| `extractJSONObject()` | 4层策略稳健提取 JSON |
| `safeParseJSON()` | 容错 parse（自动修复 trailing comma） |
| `normalizeStoryPlan()` | story-plan 标准化 |
| `normalizeDialogueAnnotation()` | 对白标注标准化 |
| `normalizeShot()` | 单镜头标准化 |
| `normalizeCharacters()` | 角色数组标准化 |
| `normalizePromptFields()` | Prompt字段标准化 |
| `parseLLMContract()` | 模块级统一入口 |

### 接入的模块

| 文件 | 改动 |
|------|------|
| `beastmind-engine.js` | 版本号 v2.0→v3.0，LLM/本地输出都走 normalizeStoryPlan |
| `director-pipeline.js` | toCharArray→normalizeCharacters，_getStoryPlanStatus→normalizeStoryPlan，对白读取→normalizeDialogueAnnotation，删除重复 _shouldUseBeastMind() |
| `llm-caller.js` | 新增 callContractJSON() 统一入口 |
| `stage3-field-enrichment.js` | 入口处 normalize story-plan |

### 设计原则

LLM 输出不是可信输入，全部进入 Contract Layer → 字段别名归一化 → 缺省值补齐 → 下游唯一认可的标准结构。内部字段统一小写。

---

## 文件清单

```
新增: skills/shanhaijing-director/scripts/llm-contract.js
修改: skills/shanhaijing-director/scripts/beastmind-engine.js
修改: skills/shanhaijing-director/scripts/director-pipeline.js
修改: skills/shanhaijing-director/scripts/llm-caller.js
修改: skills/shanhaijing-director/scripts/stage3-field-enrichment.js
修改: skills/shanhaijing-director/versions/LATEST.md
修改: workspace/HEARTBEAT.md
```

## 版本历史

- v6.33-Peng: 四项链路修复落地
- v6.32-Peng: Phase 1 全14模块 LLM 化
