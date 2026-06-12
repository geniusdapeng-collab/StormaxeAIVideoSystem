---
name: PRD需求文档撰写
skill_id: doc_prd_writing
version: 1.0.0
last_updated: 2026-04-02

domain: 文档撰写
sub_domain: 产品文档
type: daily_practice
priority: P0

capabilities:
  tools: []
  data_sources: []
  output_formats: [markdown, 模板]

retrieval_profile:
  logical_topics: [PRD, 产品需求文档, 需求文档]
  aliases: [需求说明, 功能需求]
  sample_queries: [PRD怎么写, 需求文档模板]
  problem_patterns: [PRD不会写, 结构乱]
  entities: {who: [产品经理], actions: [撰写, 编写], objects: [PRD, 需求]}
  scenarios: [产品设计, 项目启动]
  urgency: high

index_optimization:
  weighted_recall_text: PRD 产品需求文档 需求文档 需求说明
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
tags: [PRD, 文档, 产品]
status: production
license: internal

generation_spec:
  title: PRD需求文档撰写
  summary: 撰写结构清晰、内容完整的产品需求文档
  output_mode: blueprint
  skill_blueprint_id: doc_prd_writing
  skill_version: 1.0.0
  skill_type: daily_practice
  automation_level: L1
  risk_level: low
  core_goal: 帮助产品经理高效撰写PRD
  non_goals: []
  success_metrics: [文档完整度]
  user_scenarios: [产品设计, 项目启动]
  target_audience: [产品经理]
  trigger_intents: [PRD怎么写]
  estimated_user_time: 60分钟
  difficulty: 2
  output_style: template

qa_contract:
  pass_threshold: 85
  scoring_weights: {completeness: 0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism: 0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

PRD结构 = 产品概述 → 功能需求 → 业务流程 → 非功能需求 → 附录

## 1. PRD核心结构

### 产品概述
- 产品背景
- 产品目标
- 目标用户

### 功能需求
- 功能列表
- 功能详情
- 功能优先级

### 业务流程
- 流程图
- 时序图

### 非功能需求
- 性能要求
- 安全要求
- 兼容性

### 附录
- 术语表
- 参考资料

## 2. 功能描述模板

```
## 功能名称
### 描述
### 前置条件
### 后置条件
### 业务流程
1. xxx
2. xxx
### 边界情况
### 字段说明
```

## 3. 质量检查 ✅ 质量分: 92

### 最终状态: validated
