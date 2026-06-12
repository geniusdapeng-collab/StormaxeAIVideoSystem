# Prompt Budget Optimizer v2.5-Peng 发布说明

**版本**: v2.5-Peng
**提交**: 9ef03b9
**状态**: 生产就绪 ✅
**Mock测试**: 4轮18项/18项 PASS (100%)

---

## 核心机制

**不是"不超过"，是"逼近上限"** —— 自动将Prompt空间利用率最大化

Seedance 2.0 两个独立限制：
- 中文上限 ≈490字（官方~590，buffer后490）
- 英文上限 ≈980字符（官方~1000，buffer后980）

---

## 系统机制（4大自动化）

### 1. 自动测量固定模块
```js
measureFixedModules() // 精确计算英文长度 + 中文长度，含分隔符
```
- 测量system_prefix、character_desc、honghuang_style等6个固定模块
- 自动加上逗号+空格分隔符（每模块间2字符）
- 返回：totalEn、totalCh、perModule、variableBudget、variableChineseBudget

### 2. 自动分配可变预算
- 中文：扣除固定模块中文后，留20字buffer
- 英文：扣除固定模块英文后，60%给en_supplement，40%给camera

### 3. 自动截断超长输入
- 中文：严格逐字截断，charCount > target时立即cut（不找句号，避免超预算）
- 英文：按单词截断，不截断在单词中间

### 4. 自动验证合规性
- 双重检查：中文≤490 && 英文≤980
- 返回isCompliant + utilization百分比

---

## 使用方法

```js
const { PromptBudgetOptimizer } = require('./prompt-budget-optimizer');

const optimizer = new PromptBudgetOptimizer();
optimizer.setFixedModules({
  system_prefix: 'CG cinematic photorealistic...',
  character_desc: 'Chinese boy XiaoG...',
  honghuang_style: 'Honghuang era...',
  lighting_quality: 'natural sunlight...',
  color_system: '深海幽蓝...',
  negative_guard: 'negative: zombie...',
});

const result = optimizer.generateShotPrompt({
  ch_scene: '清晨的薄雾笼罩着山坡...',
  en_supplement: 'morning mist dewdrops...',
  camera: 'wide establishing shot...',
});

// result.prompt, result.analysis, result.isCompliant
```

---

## Mock测试结果

| Round | 内容 | 通过/总 | 通过率 |
|-------|------|---------|--------|
| Round 1 | 基础功能测试 | 8/8 | 100% |
| Round 2 | 边界条件测试（超长/空输入） | 6/6 | 100% |
| Round 3 | 批量生成12镜头（精卫E01） | 2/2 | 100% |
| Round 4 | 不同主题适配（夸父追日） | 2/2 | 100% |
| **总计** | | **18/18** | **100%** |

### Round 3 详细数据（精卫12镜头）
- 英文平均利用率：**93.1%**（913/980字符）
- 中文平均利用率：**80%**（390/490字）
- 合规率：12/12（100%）

---

## Bug修复记录

### Bug 1：中文截断超预算
- **原因**：`_optimizeChineseLength` 找句号位置截断，导致实际字数超target
- **修复**：改为严格逐字截断，在charCount>target时立即cut
- **验证**：超长中文从474字降到470字 ✅

### Bug 2：固定模块含中文字符未扣除
- **原因**：`color_system` 模块含28个中文字符，占用中文预算但未被measure
- **修复**：`measureFixedModules()` 同时测量中文长度，生成时扣除固定模块中文

---

## 文件位置
- 模块：`skills/shanhaijing-render-engine/prompt-budget-optimizer.js`
- 测试：`/tmp/mock-test-prompt-optimizer-v25.js`

---

## 待办
- [ ] 集成到director.js渲染流程
- [ ] 接入prompt-rules-v24.js规则系统
- [ ] 导演引擎调用时自动注入

---

*生成时间: 2026-05-19* 
*版本: v2.5-Peng*