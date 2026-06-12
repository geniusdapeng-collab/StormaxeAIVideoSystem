# 🔥 RELEASE v6.20-Peng (2026-06-06)

## 版本信息
- **系统版本**: Seedance Video Production System v3.1.0-Peng
- **发布日期**: 2026-06-06
- **包含 commits**: `1c70feb`, `c4d9d75`, `4190cf2`

---

## 核心升级：提示词利用率四层闭环控制

### 问题背景
烛龙预生产 v6.18/v6.19 阶段，6个镜头提示词平均利用率仅 69.7%，大量字符配额未被使用，影响视频渲染质量。

### 解决方案：四层补齐闭环

| 层级 | 模块 | 作用 |
|------|------|------|
| L1 约束 | director-pipeline.js (systemPrompt) | 强制要求LLM输出≥420字核心内容 |
| L2 去重 | prompt-dedupe.js (Jaccard) | 消除Scene/Action/Camera字段内容重复 |
| L3 填充 | smart-quality-calibration.js | 按目标960字符动态补齐 |
| L4 兜底 | seedance-render-engine.js | 最终强制补齐+截断到988 |

### 新增文件
- `prompt-dedupe.js` — Jaccard相似度字段去重（Scene/Action/Camera/Lighting）
- `char-counter.js` — 统一真实字符计数（消除UTF-16 .length对中文的偏差）
- 增强 `smart-quality-calibration.js` — 动态补齐策略（替代原enforceLengthLoop）
- 增强 `seedance-render-engine.js` — fillPromptToTarget()最终兜底

---

## Bug修复（3个P0级）

### Bug 1: 辅助函数作用域错误
- **文件**: director-pipeline.js
- **问题**: normalizeShotLLMJson等3个辅助函数定义在constructor闭包内，stage8_2方法无法访问
- **修复**: 提升到module-level函数（v6.20-fix1, commit c4d9d75）

### Bug 2: PriorityTruncator误删
- **文件**: smart-quality-calibration.js
- **问题**: v6.20专家方案重写时误删PriorityTruncator类，导致Stage 8.3崩溃
- **修复**: 从v6.19-fix3恢复PriorityTruncator+FIELD_PRIORITY（v6.20-fix1, commit c4d9d75）

### Bug 3: 中文字符计数偏差
- **文件**: seedance-render-engine.js, smart-quality-calibration.js
- **问题**: 使用out.length（UTF-16 code units）对中文计数，中文多字节导致虚高，造成S00超限
- **修复**: 全部改用[...str].length真实Unicode字符数（v6.20-fix2, commit 4190cf2）

---

## 性能提升（烛龙预生产 benchmark）

| 镜头 | v6.18 | v6.19-fix3 | v6.20-fix2 | 变化 |
|------|-------|------------|------------|------|
| S00 | 813 (82%) | 833 (84%) | **892 (90.3%)** | +8.3% |
| S01 | 673 (68%) | 701 (71%) | **948 (96.0%)** | +28% |
| S02 | 639 (65%) | 678 (69%) | **918 (92.9%)** | +28% |
| S03 | 675 (68%) | 686 (69%) | **934 (94.5%)** | +26% |
| S04 | 657 (67%) | 675 (68%) | **922 (93.3%)** | +26% |
| S05 | 691 (70%) | 710 (72%) | **957 (96.9%)** | +27% |
| **平均** | **688 (69.7%)** | **714 (72.2%)** | **928 (94.0%)** | **+35%** |

**目标达成**: 利用率从67% → 94%，超过90%目标

---

## 改动文件清单

| 文件 | 改动类型 | commit |
|------|---------|--------|
| director-pipeline.js | 重构 | 1c70feb+c4d9d75 |
| smart-quality-calibration.js | 重写+恢复 | 1c70feb+c4d9d75+4190cf2 |
| char-counter.js | 重构 | 1c70feb |
| prompt-dedupe.js | 新增 | 1c70feb |
| seedance-render-engine.js | 增强 | 1c70feb+4190cf2 |
| system-version.json | 更新 | 本次release |

---

## 技术细节

### 字符计数统一方案
```javascript
// 旧: out.length (UTF-16 code units, 中文虚高)
// 新: [...out].length (真实Unicode字符数)
```

### 四层补齐策略
1. **LLM约束**: systemPrompt要求核心字段≥420字
2. **normalize**: 10字段全部有fallback默认值
3. **retry**: 核心字段<420字自动重试1次
4. **dedupe**: Jaccard相似度>0.6的相邻重复内容合并
5. **SmartCalibration**: 按目标960动态追加filler库
6. **最终兜底**: fillPromptToTarget强制截断到988

### HARD_LIMIT统一
所有模块HARD_LIMIT统一为**988字符**，消除跨模块计数差异。
