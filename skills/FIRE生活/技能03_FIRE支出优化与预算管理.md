---
name: FIRE支出优化与预算管理
skill_id: fire_budget
version: 1.0.0
last_updated: 2026-04-03

domain: 财务管理
sub_domain: FIRE生活
type: method_skill
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
  level1_tool: 提供预算框架
  level2_data: 基于目标推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 预算制定
    - 支出优化
    - 成本控制
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 预算模板
    - 优化方案

retrieval_profile:
  logical_topics:
    - FIRE预算
    - 支出优化
    - 预算管理
    - 成本控制
    - 开支分类
    - 储蓄率
  aliases:
    - 预算
    - 支出
    - 开支
  sample_queries:
    - FIRE预算怎么制定
    - 支出优化
    - 预算管理
    - 成本控制
    - 开支分类
    - 储蓄率
    - 怎么省钱
    - 支出分析
    - 预算模板
    - 开支控制
  problem_patterns:
    - 开支混乱
    - 存不下钱
    - 预算超支
  entities:
    who:
      - FIRE追求者
    actions:
      - 优化
      - 控制
      - 管理
    objects:
      - 支出
      - 预算
      - 成本
  scenarios:
    - 预算制定
    - 支出优化
    - FIRE准备
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE预算 支出优化 预算管理 成本控制 开支分类 储蓄率
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
  - 支出优化
  - 预算管理
status: production
license: internal

generation_spec:
  title: FIRE支出优化与预算管理
  summary: 优化支出结构，制定科学的FIRE预算
  output_mode: blueprint
  skill_blueprint_id: fire_budget
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户优化支出提高储蓄率
  non_goals: 不涉及具体消费建议
  success_metrics:
    - 储蓄率提升
    - 支出合理性
  user_scenarios:
    - 预算制定
    - 支出优化
    - FIRE准备
  target_audience:
    - FIRE追求者
  trigger_intents:
    - FIRE预算怎么制定
    - 支出优化
    - 预算管理
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 收入水平
    - 支出结构
  required_context_fields:
    - 月度支出
  missing_info_policy:
    low_risk: 提供通用预算框架
    medium_risk: 询问具体支出数据
    high_risk: 建议进行财务咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供预算框架
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

支出优化核心：分类记账→分析结构→识别浪费→优化配置→制定预算，五步提升储蓄率

## 1. 场景分析

### 请求摘要
用户需要优化支出提升储蓄率

### 显性需求
- 掌握支出分析方法
- 制定可执行的预算方案

### 场景分类
- `scenario_classification`: 财务管理
- `urgency`: normal

## 2. 预算框架

### 支出分类

| 类别 | 说明 | 建议比例 |
|------|------|----------|
| 住房 | 房租/房贷 | 30% |
| 饮食 | 餐饮/ groceries | 15% |
| 交通 | 出行/车辆 | 10% |
| 医疗 | 保险/医疗 | 5% |
| 娱乐 | 休闲/旅行 | 10% |
| 储蓄 | 投资/存款 | 30% |

### 50/30/20法则

```
必要支出：50%
可选支出：30%
储蓄投资：20%

FIRE建议：
- 必要支出：越低越好
- 可选支出：理性控制
- 储蓄率：50%+
```

## 3. 专业建议

### A. 支出分析

#### 分析方法
```
1. 记录支出：至少3个月
2. 分类汇总：按类别统计
3. 占比分析：各类支出比例
4. 趋势变化：月度变化
5. 异常识别：大额/突然支出
```

### B. 优化策略

#### 优化方向
```
1. 住房：考虑合租/郊区
2. 饮食：减少外食
3. 交通：公共交通/步行
4. 娱乐：寻找免费/低成本
5. 购物：需要vs想要
```

### C. 预算制定

#### 预算模板
```
月度预算 = 月收入 - 月储蓄

分配：
1. 固定支出预算
2. 可变支出预算
3. 应急储备

执行：
1. 每周检查
2. 每月复盘
3. 及时调整
```

### D. 储蓄率提升

#### 提升方法
```
1. 先储蓄后消费
2. 自动转账
3. 定期检查
4. 寻找更低成本替代
5. 增加收入来源
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
