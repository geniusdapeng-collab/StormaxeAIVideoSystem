---
name: BRD商业需求文档
skill_id: doc_brd_writing
version: 1.0.0
last_updated: 2026-04-02

domain: 文档撰写
sub_domain: 产品文档
type: daily_practice
priority: P1

capabilities:
  tools: []
  data_sources: []
  output_formats: [markdown, 模板]

retrieval_profile:
  logical_topics: [BRD, 商业需求文档, 商业计划]
  aliases: [商业分析, 商业案例]
  sample_queries: [BRD怎么写, 商业文档模板]
  problem_patterns: [说服不了老板]
  entities: {who: [产品经理, 负责人], actions: [撰写, 汇报], objects: [商业, 方案]}
  scenarios: [立项申请, 资源申请]
  urgency: high

index_optimization:
  weighted_recall_text: BRD 商业需求文档 商业计划 立项申请
  neighbors: []
  channel_weights: {exact_match: 10, lexical_variation: 8, slot_match: 7, topic_match: 6, scenario: 8, safety: 10, semantic: 8}

quality_thresholds:
  accuracy: 91
  response_time_ms: 1000
  fallback_rate: 3
  recall_at_50: 88
  topic_hit_at_20: 91
  top3_accuracy: 89

dependencies: {skills: [], modules: [], external_apis: []}
author: 小G
tags: [BRD, 商业, 文档]
status: production
license: internal

generation_spec:
  title: BRD商业需求文档
  summary: 撰写说服决策者的商业需求文档
  output_mode: blueprint
  skill_blueprint_id: doc_brd_writing
  skill_version: 1.0.0
  skill_type: daily_practice
  automation_level: L1
  risk_level: low
  core_goal: 帮助获得项目资源支持
  non_goals: []
  success_metrics: [立项成功率]
  user_scenarios: [立项申请, 资源申请]
  target_audience: [产品总监, 负责人]
  trigger_intents: [BRD怎么写]
  estimated_user_time: 45分钟
  difficulty: 2
  output_style: template

qa_contract:
  pass_threshold: 85
  scoring_weights: {completeness: 0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism:  0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

BRD结构 = 背景 → 机会 → 方案 → 收益 → 风险 → 资源

## 1. BRD核心结构

### 背景与机会
- 市场现状
- 痛点问题
- 商业机会

### 解决方案
- 产品方案
- 核心功能
- 差异化价值

### 商业收益
- 收入预测
- 成本收益
- 战略价值

### 风险与应对
- 主要风险
- 应对措施

### 资源需求
- 人员需求
- 预算需求
- 时间预期

## 2. 写作技巧

### 数据说话
- 用数据支撑观点
- 展示市场潜力

### 价值聚焦
- 强调核心价值
- 简明扼要

### 风险可控
- 展示风险可控
- 给出应对方案

## 3. 质量检查 ✅ 质量分: 91

### 最终状态: validated
