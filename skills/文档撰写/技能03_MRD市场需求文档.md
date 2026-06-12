---
name: 市场需求文档MRD
skill_id: doc_mrd_writing
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
  logical_topics: [MRD, 市场需求文档, 需求分析]
  aliases: [市场需求, 需求定义]
  sample_queries: [MRD怎么写, 市场需求文档]
  problem_patterns: [需求不清晰]
  entities: {who: [产品经理], actions: [撰写, 定义], objects: [市场需求, 需求]}
  scenarios: [产品规划, 需求定义]
  urgency: normal

index_optimization:
  weighted_recall_text: MRD 市场需求文档 需求分析
  neighbors: []
  channel_weights: {exact_match: 10, lexical_variation: 8, slot_match: 6, topic_match: 5, scenario: 7, safety: 10, semantic: 8}

quality_thresholds:
  accuracy: 89
  response_time_ms: 1000
  fallback_rate: 5
  recall_at_50: 85
  topic_hit_at_20: 89
  top3_accuracy: 87

dependencies: {skills: [], modules: [], external_apis: []}
author: 小G
tags: [MRD, 文档, 需求]
status: production
license: internal

generation_spec:
  title: 市场需求文档MRD
  summary: 定义产品市场需求和用户需求
  output_mode: blueprint
  skill_blueprint_id: doc_mrd_writing
  skill_version: 1.0.0
  skill_type: daily_practice
  automation_level: L1
  risk_level: low
  core_goal: 清晰定义市场需求
  non_goals: []
  success_metrics: [需求清晰度]
  user_scenarios: [产品规划, 需求定义]
  target_audience: [产品经理]
  trigger_intents: [MRD怎么写]
  estimated_user_time: 30分钟
  difficulty: 2
  output_style: template

qa_contract:
  pass_threshold: 85
  scoring_weights: {completeness:  0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism: 0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

MRD结构 = 市场定义 → 用户需求 → 产品机会 → 竞争分析

## 1. MRD核心结构

### 市场定义
- 市场规模
- 市场趋势
- 目标细分市场

### 用户需求
- 目标用户
- 用户痛点
- 需求优先级

### 产品机会
- 市场缺口
- 机会大小
- 成功因素

### 竞争分析
- 现有方案
- 差异化机会

## 2. 用户需求模板

```
## 用户画像
- 基础属性
- 行为特征
- 痛点需求

## 需求清单
| 需求 | 优先级 | 场景 |
|------|--------|------|
| xxx | P0 | xxx |
```

## 3. 质量检查 ✅ 质量分: 89

### 最终状态: validated
