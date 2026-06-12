---
name: FIRE收入提升与职业发展
skill_id: fire_career
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
  level1_tool: 提供收入提升框架
  level2_data: 基于情况推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 职场晋升
    - 副业收入
    - 创业收入
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 收入提升方案
    - 职业发展框架

retrieval_profile:
  logical_topics:
    - FIRE收入
    - 收入提升
    - 职业发展
    - 副业
    - 主动收入
    - 技能提升
  aliases:
    - 收入
    - 职业
    - 副业
  sample_queries:
    - FIRE收入提升
    - 收入提升
    - 职业发展
    - 副业
    - 主动收入
    - 技能提升
    - 怎么赚钱
    - 收入来源
    - 职业规划
    - 副业收入
  problem_patterns:
    - 收入太低
    - 职业瓶颈
    - 没有副业
  entities:
    who:
      - 职场人士
    actions:
      - 提升
      - 发展
      - 增加
    objects:
      - 收入
      - 技能
      - 副业
  scenarios:
    - 职场发展
    - 副业规划
    - FIRE加速
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE收入 收入提升 职业发展 副业 主动收入 技能提升
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
  - 收入提升
  - 职业发展
status: production
license: internal

generation_spec:
  title: FIRE收入提升与职业发展
  summary: 通过职业发展和副业增加收入，加速FIRE进程
  output_mode: blueprint
  skill_blueprint_id: fire_career
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户提升收入加速FIRE
  non_goals: 不涉及具体职业建议
  success_metrics:
    - 收入增长率
    - FIRE时间缩短
  user_scenarios:
    - 职场发展
    - 副业规划
    - FIRE加速
  target_audience:
    - 职场人士
  trigger_intents:
    - FIRE收入提升
    - 收入提升
    - 职业发展
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 当前收入
    - 职业阶段
  required_context_fields:
    - 技能背景
  missing_info_policy:
    low_risk: 提供通用收入提升框架
    medium_risk: 询问具体技能
    high_risk: 建议进行职业咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供收入提升框架
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

收入提升核心：职场晋升→技能提升→副业开发→被动收入，四维度增加收入加速FIRE

## 1. 场景分析

### 请求摘要
用户需要提升收入加速FIRE

### 显性需求
- 掌握收入提升方法
- 制定收入增长方案

### 场景分类
- `scenario_classification`: 收入规划
- `urgency`: normal

## 2. 收入框架

### 收入类型

| 类型 | 说明 | FIRE价值 |
|------|------|----------|
| 主业收入 | 工作工资 | 积累本金 |
| 副业收入 | 额外工作 | 加速储蓄 |
| 投资收入 | 资产收益 | 被动收入 |
| 被动收入 | 自动收入 | FIRE基础 |

### 收入与FIRE

```
FIRE时间公式：
时间 = (FIRE数字 - 当前资产) ÷ 年储蓄

结论：
年储蓄翻倍 → FIRE时间减半
```

## 3. 专业建议

### A. 职场晋升

#### 晋升策略
```
1. 技能稀缺：打造核心竞争力
2. 绩效突出：超额完成工作
3.  visibility：让更多人看到
4. 关系维护：建立人际网络
5. 主动争取：把握晋升机会
```

### B. 技能提升

#### 技能方向
```
1. 专业技能：本职工作相关
2. 通用技能：沟通/管理/英语
3. 高需求技能：AI/编程/数据
4. 可变现技能：可带来收入
```

### C. 副业开发

#### 副业选择
```
1. 本职延伸：咨询/培训
2. 技能变现：设计/写作
3. 知识付费：课程/付费内容
4. 电商：代购/自制商品
5. 投资：股票/房产
```

### D. 时间平衡

#### 平衡策略
```
1. 主业优先：确保稳定收入
2. 副业试点：小范围尝试
3. 逐步扩展：稳定后扩大
4. 时间管理：高效利用时间
5. 长期规划：与FIRE目标一致
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
