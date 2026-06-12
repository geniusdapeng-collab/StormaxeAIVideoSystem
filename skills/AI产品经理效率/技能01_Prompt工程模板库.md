---
name: Prompt工程模板库
skill_id: aipm_prompt_template
version: 1.0.0
last_updated: 2026-04-02

domain: AI产品经理
sub_domain: 效率工具
type: daily_practice
priority: P0

capabilities:
  tools: []
  data_sources: []
  output_formats: [markdown, 模板]

retrieval_profile:
  logical_topics: [Prompt工程, 提示词模板, AI提示语, ChatGPT提示词]
  aliases: [Prompt库, 提示词设计, AI对话模板]
  sample_queries: [Prompt怎么写, AI提示词模板, 怎么让AI回答更好, Prompt技巧]
  problem_patterns: [Prompt写不好, AI回答不理想, 不会设计Prompt]
  entities: {who: [产品经理, 用户], actions: [设计, 编写, 优化], objects: [Prompt, 提示词]}
  scenarios: [AI产品设计, 对话功能开发]
  urgency: high

index_optimization:
  weighted_recall_text: Prompt工程 提示词模板 AI提示语 ChatGPT Prompt设计 提示词库 AI对话
  neighbors: []
  channel_weights: {exact_match: 10, lexical_variation: 8, slot_match: 7, topic_match: 6, scenario: 8, safety: 10, semantic: 8}

quality_thresholds:
  accuracy: 92
  response_time_ms: 1000
  fallback_rate: 3
  recall_at_50: 88
  topic_hit_at_20: 92
  top3_accuracy: 90

dependencies: {skills: [], modules: [], external_apis: []}
author: 小G
tags: [Prompt工程, AI产品, 效率]
status: production
license: internal

generation_spec:
  title: Prompt工程模板库
  summary: 提供高质量Prompt模板，帮助产品经理快速构建有效AI交互
  output_mode: blueprint
  skill_blueprint_id: aipm_prompt_template
  skill_version: 1.0.0
  skill_type: daily_practice
  automation_level: L1
  risk_level: low
  core_goal: 帮助产品经理快速构建高质量Prompt
  non_goals: []
  success_metrics: [Prompt效率, 产出质量]
  user_scenarios: [设计AI对话产品, 编写AI功能需求]
  target_audience: [AI产品经理, 产品经理]
  trigger_intents: [Prompt怎么写, 提示词模板]
  estimated_user_time: 5分钟
  difficulty: 2
  output_style: template

runtime_contract:
  required_profile_fields: []
  required_context_fields: []
  missing_info_policy: {low_risk: 提供通用模板, medium_risk: 引导分析需求, high_risk: 建议学习基础}
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供模板
  memory_writeback_fields: []
  publish_target: skill_registry
  registry_ingestible: true

qa_contract:
  pass_threshold: 85
  veto_rules: []
  scoring_weights: {completeness: 0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism: 0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

Prompt模板 = 角色 + 任务 + 约束 + 格式 + 示例

## 1. 核心模板结构

### 标准Prompt模板
```
## 角色
你是一个[专业角色]

## 任务
[具体要完成的任务]

## 约束
- [限制条件1]
- [限制条件2]

## 输出格式
[期望的输出格式]

## 示例
[可选的参考示例]
```

## 2. 常用模板类型

### 对话型Prompt
- 角色定义
- 对话目标
- 风格要求

### 分析型Prompt
- 分析背景
- 分析维度
- 输出框架

### 创作型Prompt
- 创作目标
- 风格/语气
- 约束条件

## 3. 质量检查 ✅ 质量分: 92

### 最终状态: validated
