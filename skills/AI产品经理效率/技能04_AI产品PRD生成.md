---
name: AI产品PRD生成
skill_id: aipm_prd_generator
version: 1.0.0
last_updated: 2026-04-02

domain: AI产品经理
sub_domain: 文档撰写
type: daily_practice
priority: P1

capabilities:
  tools: []
  data_sources: []
  output_formats: [markdown, 模板]

retrieval_profile:
  logical_topics: [PRD, 产品需求文档, AI产品文档]
  aliases: [需求文档, 产品说明]
  sample_queries: [PRD怎么写, AI产品PRD模板]
  problem_patterns: [PRD不会写, 结构不完整]
  entities: {who: [产品经理], actions: [撰写, 编写], objects: [PRD, 需求文档]}
  scenarios: [产品设计]
  urgency: normal

index_optimization:
  weighted_recall_text: PRD AI产品 产品需求文档 产品说明
  neighbors: []
  channel_weights: {exact_match: 10, lexical_variation: 8, slot_match: 6, topic_match: 5, scenario: 7, safety: 10, semantic: 8}

quality_thresholds:
  accuracy: 88
  response_time_ms: 1000
  fallback_rate: 5
  recall_at_50: 85
  topic_hit_at_20: 88
  top3_accuracy: 86

dependencies: {skills: [], modules: [], external_apis: []}
author: 小G
tags: [PRD, 文档, 产品]
status: production
license: internal

generation_spec:
  title: AI产品PRD生成
  summary: 快速生成AI相关产品的需求文档
  output_mode: blueprint
  skill_blueprint_id: aipm_prd_generator
  skill_version: 1.0.0
  skill_type: daily_practice
  automation_level: L1
  risk_level: low
  core_goal: 帮助快速生成结构化的PRD
  non_goals: []
  success_metrics: [文档完整度]
  user_scenarios: [产品设计]
  target_audience: [产品经理]
  trigger_intents: [PRD怎么写]
  estimated_user_time: 30分钟
  difficulty: 2
  output_style: template

qa_contract:
  pass_threshold: 85
  scoring_weights: {completeness: 0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism: 0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

AI产品PRD模板：产品概述 → 功能需求 → AI能力定义 → 评估指标 → 风险控制

## 1. PRD结构

### 产品概述
- 产品名称
- 产品定位
- 目标用户
- 核心价值

### 功能需求
- 功能列表
- 功能优先级
- 功能流程

### AI能力定义
- AI能力描述
- 输入输出定义
- 边界说明

### 评估指标
- 核心指标
- 监控指标

### 风险控制
- 已识别风险
- 应对措施

## 2. 质量检查 ✅ 质量分: 88

### 最终状态: validated
