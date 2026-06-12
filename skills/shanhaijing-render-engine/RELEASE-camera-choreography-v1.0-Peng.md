# 山海经运镜编排引擎 — Camera Choreography v1.0-Peng
## 发布日期: 2026-05-20

---

## 版本信息
- **模块**: shanhaijing-render-engine/camera-choreography.js
- **版本**: v1.0-Peng
- **基于**: Seedance 2.0 运镜方法论（大鹏提供）
- **适配**: Seedance 2.0 API 独立镜头生成模式（4-5秒/镜头）

---

## 核心实现

### 1. 六大基础运镜动作库
| 动作 | 变体数 | 示例 |
|------|--------|------|
| 推(Push) | 3 | 极其丝滑地缓慢推进 / 极速向前猛冲推进 / 微距特写极其丝滑地推向 |
| 拉(Pull) | 3 | 极速向后飞退 / 极其连贯地拉高拉远 / 极其丝滑地缓缓拉远揭示全景 |
| 平移(Truck) | 4 | 向左侧极速平移跟拍 / 甩镜极速横扫 / 极其丝滑地平移 |
| 升降(Crane) | 4 | 极其连贯地缓缓拉高 / 极速拉高变为俯视 / 从高空俯冲入画 |
| 环绕(Orbit) | 4 | 一百八十度极速动态环绕 / 绕着他横向旋转半圈 / 螺旋式急速环绕上升 |
| 跟拍(Track) | 4 | 后方俯视跟拍 / 侧前方特写跟拍 / 以超越他反冲飞行的速度绕着旋转 |
| 制动(Brake) | 4 | 猛然刹车悬停 / 甩尾急停 / 极其丝滑地缓缓定格 / 骤然静止画面定格 |

### 2. 景别层级系统（7级）
extreme_wide → wide → full_body → medium → close_up → extreme_closeup → insert

### 3. 空间位置坐标系（11个方位）
overhead / high_angle / eye_level / low_angle / worm_view / front / front_side / side / back_side / back / blind_spot

### 4. 速度-情绪映射（7级速度词）
极其丝滑地(优雅) → 缓缓(平静) → 平稳地(稳定) → 极其连贯地(流畅) → 极速(紧张) → 猛然(转折) → 骤然(极限)

### 5. 物理绑定策略（6种物理驱动）
爆炸冲击波 / 重力坠落 / 狂风 / 后坐力反冲 / 水流浪涌 / 强光爆发

### 6. 情绪峰值运镜模型（5幕结构）
建立(0-15%) → 上升(15-40%) → 蓄力(40-65%) → 爆发(65-85%) → 定格(85-100%)

---

## 技术约束说明

**重要**: Seedance 2.0 API 按镜头独立生成（每个镜头 4-5 秒短视频片段），真正的"一镜到底"在技术上由后期拼接实现。本引擎在 **Prompt 层面** 模拟一镜到底的运镜语言：
- 每个镜头内按时间轴分段描述运镜动作
- 多个独立片段后期拼接形成连续叙事节奏
- 运镜语言让每段画面运动更丰富、更具电影感

---

## Mock 测试结果

| 测试项 | 状态 | 详情 |
|--------|------|------|
| 运镜独立功能 | ✅ PASS | 6个镜头全部生成有效运镜描述 |
| 预算优化集成 | ✅ PASS | 与 PromptBudgetOptimizer v2.5 兼容，全部通过 980 限制 |
| 利用率分析 | ✅ PASS | 平均英文 803 字符 (81.9% 利用率) |
| 内容质量 | ✅ PASS | 无 undefined/null，含必需运镜元素 |
| 情绪覆盖 | ✅ PASS | 5 幕全部覆盖（establish/build/climax/rise/resolve） |
| 绑定多样性 | ✅ PASS | 3 种物理绑定（狂风/爆炸/强光） |

**综合: 6/6 全部通过 ✅**

---

## 集成方式

```javascript
const { CameraChoreographer } = require('./camera-choreography');

// 创建编排器
const choreographer = new CameraChoreographer({
  styleMode: 'honghuang',      // 'honghuang' | 'documentary'
  defaultDuration: 5           // 默认镜头时长(秒)
});

// 生成单镜头运镜
const cameraPrompt = choreographer.generateCameraPrompt({
  shotId: 'S01',
  duration: 5,
  type: 'establishing',
  emotionPhase: 'establish',   // 或自动推断
  characters: [{ name: '烛龙' }],
  scene: '钟山洞穴',
  action: '盘踞'
});

// 批量生成
const prompts = choreographer.generateBatch(shots);
```

---

## 文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| 运镜编排引擎 | `skills/shanhaijing-render-engine/camera-choreography.js` | 核心模块 |
| 集成测试 | `skills/shanhaijing-render-engine/camera-choreography-mock-test.js` | 6项Mock测试 |
| 发布文档 | `skills/shanhaijing-render-engine/RELEASE-camera-choreography-v1.0-Peng.md` | 本文件 |

---

## 后续集成计划

1. **orient-primordial-core.js**: 在 Prompt 构建流程中自动调用 CameraChoreographer 生成运镜段落
2. **render-engine.js**: 将生成的运镜文本注入 API 调用参数
3. **prompt-budget-optimizer.js**: 运镜文本纳入预算分配（当前已验证兼容）

---

*制作人: 小G | 版本: v1.0-Peng | 状态: 生产就绪*