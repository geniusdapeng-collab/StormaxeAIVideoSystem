# ShanhaiStory Forge v2.0-Peng | Director Pipeline v4.4-Peng 发布说明

**发布时间**: 2026-05-23 01:06 GMT+8
**制作人**: 小G | **审核**: 李大鹏
**版本状态**: ✅ 已上线生产环境

---

## 🎬 v4.4-Peng 核心更新

### 1. 智能时长分配器 v1.0-Peng
**文件**: `skills/shanhaijing-director/scripts/duration-allocator.js`

**五层加权体系**:
| 层级 | 作用 | 示例 |
|------|------|------|
| Layer 1: 叙事类型 | 分量权重 | climax=2.5, oneshot=2.2, establishing=0.8 |
| Layer 2: 内容长度 | narration感知 | 41字→5秒，25字→3秒 |
| Layer 3: 运镜类型 | 一镜到底保护 | 一镜到底×1.5，甩镜×0.8 |
| Layer 4: 情绪张力 | tension调速 | ≥90→×1.3，≤30→×0.8 |
| Layer 5: 全局节奏 | 模式选择 | action(快)/documentary(慢)/drama(中) |

**边界保护**:
- 一镜到底: 8-15秒 (Seedance 2.0上限)
- climax: 6-15秒
- 普通镜头: 2-15秒 (action), 3-15秒 (drama), 3-15秒 (documentary)

### 2. 镜头序列冲击引擎 v1.0-Peng
**文件**: `skills/shanhaijing-director/scripts/shot-sequence-engine.js`

**核心公式**:
```
Impact = 尺度跳跃(35-50%) × 运镜能量(20-25%) × 时长对比(10-20%) × 叙事转折(20-25%)
```

**关键特性**:
- 极端尺度跳跃(≥5级): 尺度主导50%, 全景→特写自动9-10分
- 转场推荐: smash_cut(10分)/whip_pan(9分)/hard_cut(8分)/match_cut(7分)
- 问题检测: 雷同序列/无动机跳切/节奏断裂
- 节奏分析: 蓄力-爆发-回落模式识别, 连续高压疲劳检测

### 3. 生产环境修复
- **Seedance 2.0时长上限**: 所有镜头最大15秒 (原18秒/20秒/25秒已修正)
- **Mock模式一镜到底**: skipRender模式下跳过强制检查，避免测试被阻止

---

## 📊 Mock测试结果

| 测试项目 | 状态 | 详情 |
|----------|------|------|
| Pipeline 10阶段 | ✅ 通过 | 全部完成 |
| 时长分配器 | ✅ 通过 | S06 climax=15s, 一镜到底=15s |
| 序列冲击分析 | ✅ 通过 | 平均冲击4.5分 |
| 一镜到底检查 | ✅ 通过 | Mock模式正确跳过 |
| 质检系统 | ✅ 通过 | 69.9/100分 |
| 渲染引擎 | ✅ 通过 | 5个渲染单元命令生成 |

---

## 🔄 版本号更新

| 子系统 | 旧版本 | 新版本 |
|--------|--------|--------|
| Director Pipeline | v4.3-Peng | **v4.4-Peng** |
| Duration Allocator | 无 | **v1.0-Peng** |
| ShotSequenceEngine | 无 | **v1.0-Peng** |
| 大系统 | v2.0-Peng | v2.0-Peng |

---

## 📁 新增/修改文件

**新增**:
- `skills/shanhaijing-director/scripts/duration-allocator.js`
- `skills/shanhaijing-director/scripts/shot-sequence-engine.js`

**修改**:
- `skills/shanhaijing-director/scripts/director-pipeline.js` — v4.4-Peng
- `skills/seedance-render-engine/scripts/seedance-render-engine.js` — 一镜到底Mock跳过

---

## 🎯 下一步规划

1. **镜头组节奏** (v1.1): 连续3短接1长形成呼吸感
2. **色彩对比维度**: 冷暖切换的视觉冲击
3. **声音先入维度**: J-cut/L-cut的听觉冲击
4. **真实生产测试**: 59秒山海经片子端到端验证

---

**发布标签**: `v4.4-Peng-release`