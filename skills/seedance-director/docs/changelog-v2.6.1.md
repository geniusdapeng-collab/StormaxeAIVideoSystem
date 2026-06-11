# Changelog v2.6.1-Peng

**发布日期**: 2026-05-14
**代号**: CinePrompt V2 — 数据流转修复版

## 5个数据流转断点修复

### 🔴 P0：比稿 Winner Prompts 未重新生成
- **位置**: `director.js` `produce()` 函数
- **问题**: 比稿选出 winner plan 后只替换了 `finalPlan`，`finalPrompts` 仍是原始 plan 的 prompts，导致比稿白做
- **修复**: winner plan 替换后重新调用 `phase3ShotDesign()` 生成新 prompts，再应用合规优化

### 🟡 P1：BidEval 评估维度未覆盖 Prompt 实际质量
- **位置**: `bid-eval.js` + 新增 `evaluators/prompt-quality.js`
- **问题**: 4个评估维度只看 plan 结构，不评估最终 prompts 内容
- **修复**: 新增 `promptQuality` 维度(15%权重)，检查角色名覆盖率(40%)、动作描述覆盖率(40%)、6步公式合规性(20%)
- **权重调整**: needAlignment(0.25) / scriptQuality(0.20) / seedanceCompliance(0.20) / artisticImpact(0.20) / promptQuality(0.15)

### 🟡 P2：distributeCharacters 配角轮询频率过低
- **位置**: `story-engine.js` `distributeCharacters()`
- **问题**: 配角每3个镜头才出现一次，action 片大量镜头缺少对手
- **修复**: 按幕结构智能分配——起步建置独角(前2镜) → 承幕双角(主角+对手) → 转幕全员(最多3角色) → 合幕主角收尾

### 🟡 P3：optimizePromptForSeedance 压缩误伤动作词
- **位置**: `director.js` `optimizePromptForSeedance()` 策略5
- **问题**: 3条压缩规则丢失核心动作修饰——"画面趋于静止"→"静止"、"高速交手"→"交手"、"碰撞产生冲击波"→"碰撞生冲击波"
- **修复**: 删除3条有害规则，保留 MicroMotion 和环境精简等安全压缩

### 🔵 P4：AlignmentGate pre-render 检查不阻断
- **位置**: `director.js` `phase4BatchRender()` 
- **问题**: 闸机评分<40时只打 warning 不阻断，对齐失败的视频仍被渲染
- **修复**: 评分<40 默认 throw Error 阻断渲染，支持 `--force-continue=true` 强制继续，保存 `alignment-report.json` 供审查

## 修改文件清单

| 文件 | 变更类型 |
|------|---------|
| `seedance-director/scripts/director.js` | P0修复 + P3修复 + P4修复 + 版本号 |
| `seedance-story-engine/scripts/story-engine.js` | P2修复 |
| `seedance-bid-eval/scripts/bid-eval.js` | P1修复(权重调整) |
| `seedance-bid-eval/scripts/evaluators/prompt-quality.js` | P1新增 |
| `seedance-director/system-version.json` | 版本号+变更记录 |
| `seedance-director/README.md` | 版本号+新功能说明 |
