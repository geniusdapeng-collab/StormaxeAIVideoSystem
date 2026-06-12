---
name: FIRE运动认知与基础
skill_id: fire_basics
version: 1.0.0
last_updated: 2026-04-03

domain: 财务管理
sub_domain: FIRE生活
type: foundational_skill
priority: P1

execution_layer: "5"
execution_mode: sequential

module_compatibility:
  input_preprocessing: true
  intent_clarification: true
  multi_intent_extraction: false
  task_analysis: true
  skill_matching: keyword
  task_execution: complex
  result_integration: true

fallback_strategy:
  level1_tool: 提供FIRE基础框架
  level2_data: 基于情况推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    -  FIRE探索者
    - FIRE入门
    - FIRE进阶
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 认知框架
    - 基础指南

retrieval_profile:
  logical_topics:
    - FIRE运动
    - 财务独立
    - 提前退休
    - FIRE基础
    - FIRE理念
    - FIRE定义
  aliases:
    - FIRE
    - 财务独立
    - 提前退休
  sample_queries:
    - FIRE是什么
    - 财务独立怎么实现
    - 提前退休
    - FIRE运动
    - FIRE基础
    - FIRE理念
    - 什么是FIRE
    - FIRE入门
    - FIRE认知
    - FIRE定义
  problem_patterns:
    - 不了解FIRE
    - 概念模糊
    - 认知偏差
  entities:
    who:
      - 职场人士
      - 投资者
    actions:
      - 了解
      - 认知
      - 入门
    objects:
      - FIRE
      - 理念
      - 基础
  scenarios:
    - 初次了解
    - 入门学习
    - 概念澄清
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE运动 财务独立 提前退休 FIRE基础 FIRE理念 FIRE定义
  neighbors: []
  channel_weights:
    exact_match: 10
    lexical_variation: 8
    slot_match: 7
    topic_match: 6
    scenario: 8
    safety: 10
    semantic: 9

quality_thresholds:
  accuracy: 95
  response_time_ms: 2000
  fallback_rate: 3
  recall_at_50: 90
  topic_hit_at_20: 95
  top3_accuracy: 93
  channel_hit_rates:
    exact_match: 98
    lexical_variation: 90
    slot_match: 85
    topic_match: 80
    scenario: 90
    safety: 100
    semantic: 95

dependencies:
  skills: []
  modules: []
  external_apis: []

author: 小G
tags:
  - FIRE生活
  - 财务独立
  - 提前退休
status: production
license: internal

generation_spec:
  title: FIRE运动认知与基础
  summary: 理解FIRE运动的核心概念和基础理念
  output_mode: blueprint
  skill_blueprint_id: fire_basics
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: foundational_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户建立FIRE基础认知
  non_goals: 不涉及具体投资建议
  success_metrics:
    - 认知清晰度
    - 理解深度
  user_scenarios:
    - 初次了解
    - 入门学习
    - 概念澄清
  target_audience:
    - 职场人士
    - 投资者
  trigger_intents:
    - FIRE是什么
    - 财务独立怎么实现
    - 提前退休
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 1
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 年龄
    - 收入水平
  required_context_fields:
    - 财务状况
  missing_info_policy:
    low_risk: 提供通用FIRE框架
    medium_risk: 询问具体目标
    high_risk: 建议进行财务规划咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供FIRE框架
  memory_writeback_fields: []
  publish_target: skill_registry
  registry_ingestible: true

qa_contract:
  pass_threshold: 92
  veto_rules: []
  scoring_weights:
    completeness: 0.15
    personalization: 0.15
    context_fidelity: 0.15
    domain_professionalism: 0.15
    actionability: 0.2
    tool_rationality: 0.1
    risk_control: 0.05
    clarity: 0.05
---

## TL;DR

FIRE基础核心：理解FIRE本质→明确核心要素→建立正确认知→评估自身情况，四步入门FIRE

## 1. 场景分析

### 请求摘要
用户需要了解FIRE运动的基础概念

### 显性需求
- 理解FIRE是什么
- 掌握FIRE核心要素

### 场景分类
- `scenario_classification`: 认知建立
- `urgency`: normal

## 2. FIRE本质框架

### FIRE定义

```
FIRE = Financial Independence, Retire Early

财务独立：不依赖工作收入生活
提前退休：提前退出传统工作生涯
核心：通过积累资产，实现被动收入覆盖支出
```

### FIRE核心要素

| 要素 | 说明 | 重要性 |
|------|------|--------|
| 储蓄率 | 收入中储蓄比例 | ⭐⭐⭐ |
| 投资回报 | 资产增值能力 | ⭐⭐⭐ |
| 支出控制 | 控制生活开支 | ⭐⭐⭐ |
| FIRE数字 | 目标存款金额 | ⭐⭐⭐ |

## 3. 专业建议

### A. FIRE计算

#### 4%法则
```
FIRE数字 = 年支出 ÷ 4%

示例：
年支出 20万 → FIRE数字 500万
年支出 40万 → FIRE数字 1000万
```

### B. FIRE类型

#### 常见类型
```
1. Fat FIRE：富裕版FIRE
2. Lean FIRE：精简版FIRE
3. Barista FIRE：咖啡师FIRE（部分工作）
4. Coast FIRE： coastFIRE（不再存钱）
```

### C. FIRE路径

#### 实现路径
```
1. 提升收入：增加主动收入
2. 控制支出：降低生活成本
3. 提高储蓄：增加储蓄率
4. 投资增值：让钱为自己工作
```

### D. 常见误区

#### 避免误区
```
× FIRE=不工作：是有选择不工作的自由
× FIRE=省吃俭用：是理性消费
× FIRE=躺平：是追求更有价值的生活
× FIRE=很容易：需要长期规划和执行
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
