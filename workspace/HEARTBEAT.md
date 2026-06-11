# HEARTBEAT.md

## 🔥 当前生产版本（2026-06-11）
**v6.34-Peng** | ShanhaiStory Forge v2.43-Peng | Pipeline `v6.34-Peng`
- 入口: `skills/shanhaijing-director/scripts/director-pipeline.js`
- 版本指针: `skills/shanhaijing-director/versions/LATEST.md`
- 发布记录: `skills/shanhaijing-director/RELEASE-v6.33-Peng.md`
- 核心变更: Phase 1 全14模块 LLM 化 — beastmind/compliance/duration/shot-sequence/quality-calibration/prompt-normalizer/shot-enhancer/prompt-repair/prompt-metrics/schema-validator/alignment-gate/task-router/dialogue-engine/narrative-rhythm 全部接入 LLMReasoningLayer

### 本次新增
- fix40: 字段二次注入根因修复（`_enforceSingleShotFields`始终从`shot._generatedPrompt`读取）
- 广告植入系统v1.0: 4 Phase，25文件（商品档案库/创意锚定/渲染保护/植入模式）
- AI视频提示词工程指南: Seedance 2.0规范系统化提炼

---

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
