# RELEASE v6.20-Peng — 5项功能增强Phase9-13全量落地

**日期**: 2026-06-06
**类型**: 功能增强（全部为Stage 4后处理链路）
**验证场景**: 烛龙预生产

---

## 🔥 核心变更总览

| Phase | 功能 | 行数 | 接入位置 |
|-------|------|------|----------|
| Phase 9 | 导演审片6问决策树 | 343行 | Stage 4 故事板审片 |
| Phase 10 | 渲染失败诊断层级 | 444行 | pipeline-render-support.js |
| Phase 11 | Scene Card结构化流程 | 504行 | Stage 4 审片后 |
| Phase 12 | P1-P5优先级评分系统 | 382行 | Phase 11后 |
| Phase 13 | Color Script色彩脚本 | 499行 | Phase 12后 |

---

## Phase 9: 导演审片6问决策树

**文件**: `scripts/phase9-director-review-6q.js` (343行)

### 问题

旧的5维评分（叙事/情绪/连贯/质量/台词）一次性输出，互相干扰，无法聚焦具体问题。

### 解决方案

6个独立问题串行LLM调用，任意1个不通过立即阻断：

| # | 问题 | 权重 | 阈值 |
|---|------|------|------|
| Q1 | 戏剧张力 | 25% | ≥3.0 |
| Q2 | 视觉表达 | 20% | ≥3.0 |
| Q3 | 情感传递 | 20% | ≥3.0 |
| Q4 | 叙事连贯 | 15% | ≥3.0 |
| Q5 | 角色功能 | 10% | ≥2.5 |
| Q6 | 技术可行 | 10% | ≥2.5 |

### 阻断逻辑

- 任意Q评分 < 阈值 → 立即阻断，不继续下一问
- 全部通过 → 计算加权总分 → 进入生产风险清单
- 通过 `pipeline.options.enable6QReview=false` 可回退到旧5维评分

### 新增导出

```javascript
directorReview6Q(pipeline, options)  // 核心函数
```

---

## Phase 10: 渲染失败诊断层级

**文件**: `scripts/phase10-render-diagnosis.js` (444行)

### 5级诊断体系

| 层级 | 标签 | 含义 | 自动恢复 |
|------|------|------|----------|
| L1 | 可重试 | 网络/超时/503/限流 | 等1-3-8-15-30s后重试 |
| L2 | 可修复 | prompt超长/400/quota | 截断/刷新token后重试 |
| L3 | 需替换 | 定妆照缺失/文件不存在 | 替换资源后重试 |
| L4 | 需人工 | 合规/版权/NSFW/名人 | 阻断，提示人工介入 |
| L5 | 无法恢复 | 500/系统崩溃/内存 | 跳过，记录报告 |

### 新增导出

```javascript
diagnoseRenderError(err, context)       // 核心诊断
decideRenderAction(diagnosis, options)  // 操作决策
diagnoseRenderBatch(results, context)   // 批量诊断
withRenderDiagnosis(renderFn, options)   // 包装器
```

### 接入方式

在 `pipeline-render-support.js` 的 `render()` 函数中调用 `withRenderDiagnosis()` 包装。

---

## Phase 11: Scene Card结构化流程

**文件**: `scripts/phase11-scene-card.js` (504行)

### 问题

镜头字段散乱（shot.description/shot.emotion/shot.tension等），无统一结构，难于管理。

### 解决方案

每个镜头生成结构化Scene Card：

```javascript
{
  id: 'shot-1',
  index: 1,
  segment: '第一幕：起源',
  type: 'establishing',
  duration: 5,

  drama: {
    purpose: string,    // 叙事目的（一句话）
    function: string,  // 推进/揭示/转折/收束
    relation: string,   // 与前后镜头关系
  },
  visual: {
    composition, cameraMove, lens, lighting, color, mood
  },
  emotion: {
    start, end, curve, tension, key
  },
  characters: [{
    id, name, role, action, expression
  }],
  tech: {
    complexity, riskPoints, promptAnchor
  },
  render: {
    status, prompt, result, attemptCount
  },
  meta: {
    priority, colorScript, approved, notes
  }
}
```

### 新增导出

```javascript
generateSceneCard(shot, index, context)      // 单镜头
generateSceneCardsFromStoryPlan(plan, opts) // 批量
exportSceneCardsToJSON(cards, path)         // JSON文件
exportSceneCardsToMarkdown(cards, sum, path) // Markdown表格
syncSceneCardsToStoryPlan(plan, cards)      // 反向同步
```

### 接入方式

Stage 4 故事板审片后（Phase 9之后）自动调用，生成：
- `pipeline.results.sceneCards` — Scene Card数组
- `pipeline.results.sceneCardsSummary` — 统计摘要
- `01-story/scene-cards.json`
- `01-story/scene-cards.md`

---

## Phase 12: P1-P5优先级评分系统

**文件**: `scripts/phase12-priority-scorer.js` (382行)

### 5维度加权评分

| 维度 | 权重 | 说明 |
|------|------|------|
| 叙事位置 | 30% | 高潮/揭示/转折 > 推进 > 铺垫 > 过场 |
| 情绪张力 | 20% | 张力值0-10 → 0-100分 |
| 技术复杂度 | 20% | 1-5级 → 越难越优先 |
| 角色重要性 | 15% | 主角 > 反派 > 配角 > 背景 |
| 渲染风险 | 15% | 水火毛发特效高风险；定妆照缺失+20分 |

### 优先级定义

| 优先级 | 分数 | 含义 |
|--------|------|------|
| P1 | ≥80 | 必须优先渲染 |
| P2 | 65-79 | 高优先级 |
| P3 | 50-64 | 正常优先级 |
| P4 | 35-49 | 低优先级 |
| P5 | <35 | 可跳过 |

### 新增导出

```javascript
scoreShotPriority(card)              // 单镜头评分
scoreAllShots(plan, options)         // 批量评分
buildRenderBatches(cards, options)   // 分批渲染计划
applyPriorityToSceneCards(cards)     // 更新sceneCards
```

### 接入方式

Phase 11之后自动调用，生成：
- `pipeline.results.sceneCards` — 每个card新增 priority/score/scoreBreakdown字段
- `pipeline.results.prioritySummary` — 统计摘要
- `pipeline.results.renderBatches` — 分批渲染计划
- `01-story/priority-report.json`

---

## Phase 13: Color Script色彩脚本

**文件**: `scripts/phase13-color-script.js` (499行)

### 22种预设色彩方案

| 色系 | 方案数 | 代表色 |
|------|--------|--------|
| 暖色系 | 4 | 英雄金、烈焰红、琥珀暖、落日余晖 |
| 冷色系 | 3 | 深海蓝、寒冰白、暮光蓝 |
| 自然色 | 3 | 森林绿、大地赭、秋实金 |
| 暗色系 | 3 | 虚空黑、暗血红、暗夜紫 |
| 梦幻色 | 3 | 虹彩梦、幻樱粉、天界金 |
| 金属色 | 3 | 古铜色、翡翠绿、银月白 |
| 中性色 | 2 | 中性灰、电影蓝 |

### 分配逻辑（4优先级）

1. 明确色彩指示 → 直接匹配 `visual.color` 字段
2. 描述关键词 → 从description提取"火""海""金"等
3. 情绪+张力 → 高潮→金/虹，低张力→寒/深
4. 幕位置 → 第一幕→古铜，高潮→天界金

### 跳变检测

暖↔冷 大跳变时在prompt中标记 `[COLOR_TRANSITION: 渐变过渡]`，供渲染端做平滑过渡。

### 新增导出

```javascript
selectPaletteForShot(card, context)     // 单镜头选色
detectColorTransition(prev, next)        // 跳变检测
generateColorScript(cards, options)      // 批量生成
exportColorTimelineJSON(script, path)    // JSON文件
exportColorTimelineASCII(script)         // 终端预览
```

### 接入方式

Phase 12之后自动调用，生成：
- `pipeline.results.colorScript` — 完整色彩时间轴
- `pipeline.results.colorSummary` — 统计摘要
- `01-story/color-script.json`

---

## Stage 4 后处理链路（全5 Phase串联）

```
Stage 4 故事板审片
    ↓
Phase 9: 导演6问决策树 → 阻断/通过
    ↓
Phase 11: Scene Cards 生成（504行）
    ↓
Phase 12: P1-P5 优先级评分（382行）
    ↓
Phase 13: Color Script 色彩脚本（499行）
    ↓
→ 进入 Stage 5 角色提示词构建
```

---

## 文件变更清单

| 文件 | 变更 | 行数 |
|------|------|------|
| director-pipeline.js | 版本头更新 | 4333行 |
| pipeline-story-support.js | Phase 11-13接入 | 1912行 (+80) |
| pipeline-render-support.js | Phase 10接入 | 657行 |
| phase9-director-review-6q.js | 新增 | 343行 |
| phase10-render-diagnosis.js | 新增 | 444行 |
| phase11-scene-card.js | 新增 | 504行 |
| phase12-priority-scorer.js | 新增 | 382行 |
| phase13-color-script.js | 新增 | 499行 |

**新增代码量**: 2172行
**修改代码量**: +80行

---

## 向后兼容性

- Phase 9可通过 `pipeline.options.enable6QReview=false` 回退到旧5维评分
- Phase 11-13为Stage 4后处理，不影响原有Pipeline阶段执行
- Phase 10接入render层，已包含try-catch隔离，失败不影响主流程

---

## 验证方法

```bash
cd skills/shanhaijing-director
node scripts/director-pipeline.js produce \
  --production-dir <test-dir> \
  --skip-render
```

预期输出：
- Stage 4结束后显示Phase 11/12/13执行日志
- `01-story/` 目录生成 scene-cards.json, scene-cards.md, priority-report.json, color-script.json
