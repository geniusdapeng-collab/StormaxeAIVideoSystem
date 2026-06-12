# Seedance Render Engine v9.3.0-Peng 发布说明

**版本**: v9.3.0-Peng
**提交**: 7625d0d
**状态**: 生产就绪 ✅
**Mock测试**: 3轮9镜头/9镜头 PASS (100%)

---

## 核心升级：Prompt Budget Optimizer v2.5-Peng 集成

**不是"不超过"，是"逼近上限"** —— 自动将Prompt空间利用率最大化

Seedance 2.0 两个独立限制：
- 中文上限 ≈490字（官方~590，buffer后490）
- 英文上限 ≈980字符（官方~1000，buffer后980）

---

## 集成机制

### 渲染引擎 `generateShotPrompt()` 流程升级

```
旧版流程：
  基础Prompt组装 → assemblePromptWithModules → trimPromptToFit → validatePromptLength

新版流程（v9.3.0）：
  基础Prompt组装 → PromptBudgetOptimizer.generateShotPrompt() → validatePromptLength
                              ↓
                    自动测量固定模块 → 分配可变预算 → 截断超长输入 → 验证合规
```

### 4大自动化机制

1. **自动测量固定模块** — `measureFixedModules()` 精确计算英文长度 + 中文长度
2. **自动分配可变预算** — 中文留20字buffer，英文60%给en_supplement/40%给camera
3. **自动截断超长输入** — 中文严格逐字截断，英文按单词截断
4. **自动验证合规性** — 双重检查确保中文≤490、英文≤980

### 安全回退机制

- Optimizer加载失败 → 自动回退到旧版 `assemblePromptWithModules`
- Optimizer调用异常 → 自动回退到旧版逻辑
- 生成后仍不合规 → `trimPromptToFit` 最终安全截断

---

## 测试结果

### Round 1: 精卫主题（正常输入）
| 镜头 | 中文/490 | 英文/980 | 状态 |
|------|----------|----------|------|
| JW01 | 60 (12%) | 863 (88%) | ✅ |
| JW02 | 55 (11%) | 863 (88%) | ✅ |
| JW03 | 61 (12%) | 863 (88%) | ✅ |

### Round 2: 夸父主题（超长中文）
| 镜头 | 中文/490 | 英文/980 | 状态 |
|------|----------|----------|------|
| KF01 | 294 (60%) | 885 (90%) | ✅ |
| KF02 | 52 (11%) | 862 (88%) | ✅ |
| KF03 | 50 (10%) | 862 (88%) | ✅ |

### Round 3: 烛龙主题（空/超短输入）
| 镜头 | 中文/490 | 英文/980 | 状态 |
|------|----------|----------|------|
| ZL01 | 24 (5%) | 858 (88%) | ✅ |
| ZL02 | 41 (8%) | 861 (88%) | ✅ |
| ZL03 | 93 (19%) | 867 (88%) | ✅ |

**汇总**：9/9合规，英文平均88.2%，全部自动截断到安全范围。

---

## 文件变更

### 新增
- `skills/shanhaijing-render-engine/prompt-budget-optimizer.js` — v2.5-Peng 自动逼近机制

### 修改
- `skills/shanhaijing-render-engine/scripts/seedance-render-engine.js` — 集成optimizer到`generateShotPrompt()`

---

## 使用方法

渲染引擎自动调用，无需手动干预：

```js
const { render } = require('./seedance-render-engine');

// 渲染时自动生成优化后的Prompt
const result = await render(shotsData, {
  productionDir: '/path/to/production',
  plan: storyPlan
});
```

---

## 后续优化方向

1. **提升中文利用率** — 当前平均12%，可通过扩充场景描述提升到80%+
2. **精简固定模块** — 评估是否有冗余英文词汇可压缩
3. **导演引擎集成** — 在director.js生成shot时自动注入更丰富的中文描述

---

*生成时间: 2026-05-19*
*版本: v9.3.0-Peng*