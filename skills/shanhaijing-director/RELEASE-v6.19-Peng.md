# RELEASE v6.19-Peng — 三处联动修复：禁用截断 + 精简mandatoryText + 统一988基准

**日期**: 2026-06-06
**类型**: 系统级优化（通用全量生效）
**验证场景**: 烛龙预生产

---

## 🔥 核心变更（三处联动）

### Fix 1: SmartTruncator 禁用中间截断

**文件**: `skills/seedance-render-engine/scripts/prompt-engine-v2.js`

**问题**: `PromptAssembler.generate()` 内部先触发 `SmartTruncator.truncate()` 将内容截到 980×85%=833 字，然后 `expandPromptToTarget()` 再截断一遍。双重截断浪费 15%+ 空间。

**修复**:
- `minUtilization` 显式传参 `0`（使用 `??` nullish coalescing，0 值不被当假值）
- `SmartTruncator.truncate()` 增加 `minUtilization <= 0` 判断，直接透传完整内容
- 由 `expandPromptToTarget()` 一次性决策截断位置

```javascript
// prompt-engine-v2.js
static truncate(fields, targetLength = 988, options = {}) {
  const minUtilization = options.minUtilization ?? 0.85;
  if (minUtilization <= 0) {
    const allParts = Object.entries(fields)
      .filter(([, v]) => v && typeof v === 'string' && v.trim().length > 0)
      .map(([, v]) => v.trim())
      .join(', ');
    console.log(`  [SmartTruncator] 🆕 v6.19-Peng: 禁用截断模式，原始长度${allParts.length}字，直接透传`);
    return allParts;
  }
  // ... 原有截断逻辑
}

// generateShotPrompt_v2 中显式传参
const assembler = new PromptAssembler({
  targetLength: options.targetLength || 988,
  minUtilization: 0,  // 🆕 禁用截断
  ...options
});
```

### Fix 2: environmentStyleBlock full→light 模式

**文件**: `skills/seedance-render-engine/scripts/seedance-render-engine.js`

**问题**: `getEnvironmentStyleBlock('full', shot)` 输出约 180 字固定内容（含 color/texture/cinematic 描述），占 988 配额的 18%，挤压镜头专属内容空间。

**修复**: 改为 `mode='light'`，仅保留 core 风格 + timeLighting（~80 字），节省约 100 字。

```javascript
// seedance-render-engine.js (generateShotPrompt)
const environmentStyleBlock = getEnvironmentStyleBlock('light', shot);  // full→light
```

### Fix 3: mandatoryText 精算 + availableSpace 基准统一

**文件**: `skills/seedance-render-engine/scripts/seedance-render-engine.js`

**问题**:
- `availableSpace` 公式使用 `980` 而非新版 `988`
- 负面约束包含冗余描述（red/blue/yellow eyes）

**修复**:
- `availableSpace` 基准从 `980` 改为 `988`，多留 100 字给 scenography
- 负面约束精简：`NO anime NO cartoon NO 3D Disney NO sci-fi NO glowing eyes`（去掉 red/blue/yellow eyes 重复描述）

```javascript
const availableSpace = Math.max(100, 988 - _countChars(prompt) - 200);
mandatoryDimensions.push('NO anime NO cartoon NO 3D Disney NO sci-fi NO glowing eyes');
```

---

## 📊 预期效果

| 镜头 | v6.18 | v6.19 预期 |
|------|-------|-----------|
| S00 | 813字符 / 82% | 900+ / 90%+ |
| S01 | 671字符 / 68% | 850+ / 86%+ |
| S02 | 661字符 / 67% | 850+ / 86%+ |
| S03 | 685字符 / 69% | 870+ / 88%+ |
| S04 | 669字符 / 68% | 850+ / 86%+ |
| S05 | 668字符 / 68% | 850+ / 86%+ |

**目标**: 利用率从 67% 提升至 86%+

---

## 🗂️ 涉及文件

- `skills/seedance-render-engine/scripts/prompt-engine-v2.js` (+21/-3)
- `skills/seedance-render-engine/scripts/seedance-render-engine.js` (+61/-12)
- `skills/shanhaijing-director/scripts/director-pipeline.js` (无变更，本次未动)

---

## ✅ 验证方法

1. 清理旧产物：`rm -rf productions/烛龙预生产-20260606123924-zhulong/04-prompts`
2. 运行预生产：`pre-production` 命令
3. 检查 `04-prompts/` 下每个文件的字符数
4. 计算利用率：`字符数 / 988 × 100%`
5. 目标：S01-S05 均达到 85%+

---

## 📝 历史版本

- v6.18-Peng: 烛龙预生产v6.18完成 + 提示词清理 + RELEASE更新
- v6.17-Peng-fix4: 980上限统一修复 + PriorityTruncator过度压缩修复
- v6.13-Peng: 29条外部专家修复清单全量落地
- v6.12-Peng: 链路稳定性全面强化
