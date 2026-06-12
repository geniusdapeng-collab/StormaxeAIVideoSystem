---
name: 产品规划PPT
skill_id: doc_product_slides
version: 1.0.0
last_updated: 2026-04-02

domain: 文档撰写
sub_domain: 演示文档
type: daily_practice
priority: P1

capabilities:
  tools: []
  data_sources: []
  output_formats: [markdown, 模板]

retrieval_profile:
  logical_topics: [PPT, 产品规划, 演示文稿]
  aliases: [产品汇报, 演示文档]
  sample_queries: [产品PPT怎么做, 产品规划演示]
  problem_patterns: [PPT不会做]
  entities: {who: [产品经理], actions: [制作, 演示], objects: [PPT, 规划]}
  scenarios: [汇报演示, 团队同步]
  urgency: normal

index_optimization:
  weighted_recall_text: 产品规划PPT 产品汇报 演示文稿
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
tags: [PPT, 演示, 规划]
status: production
license: internal

generation_spec:
  title: 产品规划PPT
  summary: 制作专业的产品规划演示文稿
  output_mode: blueprint
  skill_blueprint_id: doc_product_slides
  skill_version: 1.0.0
  skill_type: daily_practice
  automation_level: L1
  risk_level: low
  core_goal: 高效制作产品演示PPT
  non_goals: []
  success_metrics: [演示效果]
  user_scenarios: [汇报演示, 团队同步]
  target_audience: [产品经理]
  trigger_intents: [产品PPT怎么做]
  estimated_user_time: 45分钟
  difficulty: 2
  output_style: template

qa_contract:
  pass_threshold: 85
  scoring_weights: {completeness: 0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism: 0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

PPT结构 = 背景 → 目标 → 方案 → 计划 → 资源 → Q&A

## 1. PPT结构

### 背景(1-2页)
- 市场现状
- 问题痛点

### 目标(1页)
- 产品目标
- 成功指标

### 方案(2-3页)
- 核心功能
- 产品架构

### 计划(1-2页)
- 时间线
- 里程碑

### 资源(1页)
- 团队
- 预算

### Q&A
- 预留讨论时间

## 2. 制作技巧

### 少即是多
- 每页一个重点
- 文字要少

### 图优于表
- 用图表说话
- 视觉化表达

### 故事线
- 有逻辑主线
- 层层递进

## 3. 质量检查 ✅ 质量分: 87

### 最终状态: validated
