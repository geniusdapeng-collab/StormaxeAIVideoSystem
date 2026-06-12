# RELEASE-v10.34-Peng-fix6.md

## Seedance Render Engine v10.34-Peng-fix6 (2026-06-02)

### 修复内容: 彻底消除 Prompt 中 DISCLAIMER 残留

**根因定位**
- `mandatoryText` 在 `guard` 阶段被局部变量 `workingMandatory` 修改（移除 Disclaimer）
- 但后续所有拼接逻辑（`finalPrompt = mandatoryText + prompt`、`expanded = mandatoryText + expanded` 等 5 处）仍使用**原始的** `mandatoryText` 参数
- 导致 Disclaimer 被重新拼回，然后被 `_smartTruncate` 截断，`creation` 被截掉，正则无法匹配残留片段

**修复方案**
1. `expandPromptToTarget` 入口构建 `finalPrompt` 前，无条件清理 `mandatoryText` 中的 Disclaimer（整段移除，不依赖配额）
2. 全局替换：函数内所有使用 `mandatoryText` 的地方（5 处）全部替换为 `cleanMandatoryText`
3. 增加 `CLEAN-DISCLAIMER-OK` 成功日志确认

**验证结果**（S02 镜头）
- `promptBeforeExpand`：不含 DISCLAIMER ✓
- `入口移除Disclaimer`：107字已移除 ✓
- `expanded-before-supplements`：不含 DISCLAIMER ✓
- `CLEAN-DISCLAIMER-OK`：guard + 最终截断双通过 ✓
- `RETURN-DISCLAIMER`：**未触发** ✓

### 版本继承
- v10.34-Peng-fix6 ← v10.34-Peng-fix5（中间位置 Disclaimer 清理 + 正则修复）
- ← v10.34-Peng-fix4（逐字段 ALERT-part 追踪 + 双重 DISCLAIMER 发现）
- ← v10.34-Peng-fix（guard 阶段无条件丢弃 disclaimerBlock）
- ← v10.34-Peng（跨镜头台词污染检测）

### 关联系统
- ShanhaiStory Forge v2.4-Peng
- Director Pipeline v6.10-Peng