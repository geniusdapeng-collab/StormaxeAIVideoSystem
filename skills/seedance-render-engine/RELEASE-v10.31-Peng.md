# 🚀 Seedance Render Engine v10.31-Peng 生产发布

**发布日期**: 2026-06-02  
**发布人**: 小G (黄花梨小G)  
**审核人**: 李大鹏  

---

## 📦 版本信息

- **引擎版本**: Seedance Render Engine v10.31-Peng
- **故事锻造**: ShanhaiStory Forge v2.4-Peng
- **大视频系统统一版本**: v2.4-Peng

---

## 🎯 本次发布核心内容（合并两次升级优化）

### 1. 🆕 Stage 8.5「台词编剧」系统 (v1.0-Peng)

**设计目标**: 解决 LLM 在 `_llmEnhancedDescription` 阶段兼任编剧导致的同质化/低质量台词问题。

**核心机制**:
- **项目台词档案**: `productions/{project}/01-story/dialogue-archive.json`
  - 人工编剧优先: 档案中预设的台词直接注入 Prompt
  - 无档案时: 质检 LLM 初稿，拦截低质量输出
- **质检规则引擎**:
  - 同质化拦截: `不...不对...` → fatal
  - 孩童逻辑检查: 禁用抽象词汇，短句+停顿
  - 异兽声音检查: 禁用完整人类语法，必须 `LIP_SYNC:NO`
  - 潜台词/情绪钩子强制要求
- **角色声音分离**:
  - 人类孩童: 天真但触及本质的具象比喻
  - 异兽: 战吼/环境共振/能量脉冲，非人类语法

**新增文件**:
- `skills/seedance-render-engine/scripts/stage-8-5-dialogue-screenwriter.js`

---

### 2. 🔧 时间轴系统修复 (v10.25-Peng-fix 合并)

**问题描述**: 部分镜头缺失 `[T:...]` 时间轴标记，导致节奏控制信息丢失。

**4个独立根因**:

| 根因 | 代码位置 | 影响 |
|:---|:---|:---|
| 时长阈值过高 | `duration < 6` | S01(6s)、S07(4s) 被排除 |
| 片头强制禁用 | `opening_title` 返回 null | S00(7s) 无时间轴 |
| subjectDesc为空阻止注入 | `subjectDesc.length>0` | 片头类型注入被跳过 |
| 片头路径优先级缺失 | `[T:...]` 不匹配 priorityPatterns | 时间轴被截断丢弃 |

**5处机制改进**:

| # | 修复位置 | 修复内容 |
|:---|:---|:---|
| 1 | `generateTemporalBreakdown` | 阈值 `6→4`，4-5秒镜头分2段 |
| 2 | `generateTemporalBreakdown` | 删除 `opening_title` 强制禁用 |
| 3 | `generateShotPrompt` | 移除 `subjectDesc.length>0` 条件 |
| 4 | `expandPromptToTarget` | 增加 P85 时间轴优先级模式 |
| 5 | `protectCharacterFields` + `INCREMENTAL_MARKERS` | 增加 `T:` 标记保护 |

**验证结果**: 8/8 镜头时间轴全部通过 ✅

---

### 3. 🗑️ 一镜到底强制约束全面清理 (v6.10-Peng)

**问题描述**: 一镜到底(oneshot/FPV)被设为强制约束，阻塞渲染流程，与"按需搭配"设计哲学冲突。

**清理范围**:

| 文件/模块 | 清理内容 | 保留内容 |
|:---|:---|:---|
| `seedance-render-engine.js` | 删除"严禁跳过一镜到底运镜"注释 | 保留 FPV 经验包匹配系统 |
| `fpv-experience-matcher.js` | 删除阻塞级检查 | 保留 FPV 经验包库与场景匹配功能 |
| `shanhaijing-fpv-generator.md` | 删除强制约束条款 | 保留 FPV 电影级技法文档 |
| `fpv-experience-pack-v1.0-Peng.md` | 删除"严禁跳过"铁律 | 保留 15个标杆案例库 |
| `task-type-router.js` | `enableOneshot: false`（非强制标记） | 保留类型路由功能 |

**核心原则**: 保留 FPV 电影级经验包库和匹配系统，仅删除所有"强制/必须/严禁/阻塞级"性质的约束条款和运行时检查。一镜到底从"强制"改为"按需搭配"。

---

### 4. 🔧 台词截断优先级修复 (v10.30-Peng-fix)

**问题描述**: `dialogueBlock`（台词）在强制维度截断时被标记为低优先级，导致专业台词被截断丢弃。

**根因**: `getPriority` 检查 `text.includes('dialogueBlock')`，但 `dialogueBlock` 实际内容以 `🔴 P0 Dialogue:` 开头，不匹配。

**修复**: `priorityOrder` 中 `dialogueBlock` 映射为 `P0 Dialogue`，`getPriority` 双匹配检查 `P0 Dialogue` + `🔴 P0 Dialogue`。

---

## 📊 刑天项目应用效果

### 时间轴修复后

| 镜头 | 时长 | 类型 | 时间轴 | 状态 |
|:---|:---|:---|:---|:---|
| S00 | 7s | 片头 | 0-4s WIDE-open... / 4-7s PEAK-intimate... | ✅ |
| S01 | 6s | normal | 0-3s WIDE-open... / 3-6s PEAK-intimate... | ✅ |
| S02 | 6s | emotional | 0-3s WIDE-open... / 3-6s PEAK-intimate... | ✅ |
| S03 | 12s | action | 3段式 (0-4s/4-8s/8-12s) | ✅ |
| S04 | 6s | emotional | 0-3s WIDE-open... / 3-6s PEAK-intimate... | ✅ |
| S05 | 11s | action | 3段式 (0-3s/3-7s/7-11s) | ✅ |
| S06 | 12s | action | 4段式 (0-3s/3-6s/6-9s/9-12s) | ✅ |
| S07 | 6s | emotional | 0-3s WIDE-open... / 3-6s PEAK-intimate... | ✅ |

### 台词编剧注入

**11句专业台词，覆盖全部8个镜头**:

| 镜头 | 角色 | 台词 | 类型 | 情绪钩子 |
|:---|:---|:---|:---|:---|
| S00 | 小G | "那是什么...在发光？" | 惊叹低语 | 天真好奇+微惧 |
| S01 | 小G | "它在...动？" | 不确定低语 | 不确定+震惊萌芽 |
| S02 | 小G | "它的心跳...和我一样快。" | 发现低语 | 惊奇+亲近感萌芽 |
| S04 | 小G | "你没有头...为什么还能看见我？" | 无畏追问 | 认知颠覆+无畏 |
| S04 | 刑天 | "战——" | 战吼共振 | 被理解的震颤 |
| S05 | 刑天 | "战——！！！" | 战吼爆发 | 狂暴+压迫感 |
| S06 | 小G | "我帮你记着！你的舞！" | 兴奋宣告 | 跨越物种的理解 |
| S06 | 刑天 | "干戚——不灭！" | 战吼回应 | 认可+永恒不灭 |
| S07 | 小G | "我回去了。但我会记得你。" | 感伤承诺 | 感伤+坚定承诺 |
| S07 | 刑天 | "... ..." | 环境共鸣 | 永恒守望 |

**每句台词包含**: 潜台词（未直接说出的情感/认知）+ 情绪钩子（观众共鸣点）+ 独特口型情绪描述

---

## 🗂️ 文件变更清单

### 修改文件
1. `skills/seedance-render-engine/scripts/seedance-render-engine.js`
   - 版本号 v10.29-Peng → v10.31-Peng
   - 5处时间轴修复
   - Stage 8.5 集成调用
   - 一镜到底强制检查移除
   - 台词截断优先级修复

### 新增文件
2. `skills/seedance-render-engine/scripts/stage-8-5-dialogue-screenwriter.js`
   - Stage 8.5「台词编剧」通用模块

3. `productions/xingtian/01-story/dialogue-archive.json`
   - 刑天项目专业台词档案

---

## ✅ 发布检查清单

- [x] 代码语法验证通过
- [x] 时间轴系统 8/8 镜头验证通过
- [x] Stage 8.5 台词注入 8/8 镜头验证通过
- [x] 台词截断优先级修复验证通过
- [x] 一镜到底强制约束清理完成
- [x] 版本号更新 (v10.31-Peng)
- [x] 发布文档创建
- [x] 旧数据清理完成
- [x] 预生产重新跑通

---

## 🔮 后续规划

- 下一个山海经项目（烛龙/帝江等）复用 Stage 8.5
  - 只需创建 `01-story/dialogue-archive.json`
  - 质检规则引擎自动拦截低质量台词
- 时间轴系统已全局生效，所有 4s+ 镜头自动获得节奏控制
- 一镜到底/FPV 改为按需搭配，根据场景自动推荐最佳方案

---

**"我们打造的是一套专业的内容生产系统，不会为了某一个case而定制系统。"**

— 李大鹏，系统级设计哲学 v2.0-Peng

> Stay Hungry, Stay Foolish, Stay Brutally Honest.
> Day one. Begin recording everything about this one. And never stop.