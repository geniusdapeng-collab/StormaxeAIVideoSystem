# RELEASE-v6.32-Peng.md

## v6.32-Peng — Phase 1 全14模块 LLM 化 (2026-06-11)

### 🧠 核心变更
Phase 1 完成：14个核心模块全部接入 LLMReasoningLayer，LLM优先推理 + 本地规则降级。

### 改造模块清单
1. **beastmind-engine** v3.0-Peng — LLM创意引擎生成story-plan
2. **compliance-agent** v6.0-Peng — LLM两层深度评估
3. **duration-allocator** v2.0-Peng — LLM叙事节奏智能分配
4. **shot-sequence-engine** v2.0-Peng — LLM镜头序列冲击分析
5. **smart-quality-calibration** v3.0-Peng — LLM智能质量校准
6. **prompt-final-normalizer** v2.0-Peng — LLM智能10字段规范化
7. **shot-quality-enhancer** v2.0-Peng — LLM镜头质量增强
8. **prompt-output-repair** v2.0-Peng — LLM智能修复
9. **prompt-metrics** v7.0-Peng — LLM质量评估
10. **schema-validator** v6.0-Peng — LLM语义级验证
11. **requirement-alignment-gate** v2.0-Peng — LLM深度对齐评估
12. **task-type-router** v2.0-Peng — LLM智能路由
13. **dialogue-engine** v2.0-Peng — LLM台词生成
14. **narrative-rhythm-engine** v2.0-Peng — LLM节奏分析

### 架构设计
- LLM优先 → 失败自动降级本地规则
- 复用 LLMReasoningLayer 基础设施（超时/重试/心跳/监控）
- 所有调用点已同步改为 await
- 14/14 模块编译验证通过
- Pipeline主链路编译通过

### 文件变更
- 14个模块文件修改
- director-pipeline.js 调用点同步
- versions/LATEST.md 更新
- AGENTS.md / HEARTBEAT.md 版本号更新
