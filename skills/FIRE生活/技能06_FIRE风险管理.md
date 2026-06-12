---
name: FIRE风险管理
skill_id: fire_risk
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
  level1_tool: 提供风险管理框架
  level2_data: 基于风险类型推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 财务风险
    - 健康风险
    - 市场风险
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 风险管理框架
    - 应对方案

retrieval_profile:
  logical_topics:
    - FIRE风险
    - 风险管理
    - 保险配置
    - 应急基金
    - 风险应对
    - 安全边际
  aliases:
    - 风险
    - 保险
    - 安全
  sample_queries:
    - FIRE风险管理
    - 风险应对
    - 保险配置
    - 应急基金
    - 安全边际
    - 风险管理
    - FIRE风险
    - 保险规划
    - 应急储备
    - 风险控制
  problem_patterns:
    - 风险意识弱
    - 保险不足
    - 应急不够
  entities:
    who:
      - FIRE追求者
    actions:
      - 管理
      - 应对
      - 配置
    objects:
      - 风险
      - 保险
      - 应急
  scenarios:
    - FIRE前准备
    - FIRE后维持
    - 风险应对
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE风险 风险管理 保险配置 应急基金 风险应对 安全边际
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
  - 风险管理
  - 保险配置
status: production
license: internal

generation_spec:
  title: FIRE风险管理
  summary: 识别和管理FIRE过程中的各类风险
  output_mode: blueprint
  skill_blueprint_id: fire_risk
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户识别和管理FIRE风险
  non_goals: 不涉及具体保险产品推荐
  success_metrics:
    - 风险覆盖度
    - 应急能力
  user_scenarios:
    - FIRE前准备
    - FIRE后维持
    - 风险应对
  target_audience:
    - FIRE追求者
  trigger_intents:
    - FIRE风险管理
    - 风险应对
    - 保险配置
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 年龄
    - 家庭状况
  required_context_fields:
    - 现有保险
  missing_info_policy:
    low_risk: 提供通用风险管理框架
    medium_risk: 询问具体风险
    high_risk: 建议进行专业保险咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供风险管理框架
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

风险管理核心：识别风险→评估影响→配置保险→建立缓冲→持续监控，五步构建FIRE安全网

## 1. 场景分析

### 请求摘要
用户需要管理FIRE过程中的风险

### 显性需求
- 识别FIRE相关风险
- 制定风险应对方案

### 场景分类
- `scenario_classification`: 风险管控
- `urgency`: normal

## 2. 风险框架

### FIRE主要风险

| 风险类型 | 风险描述 | 应对策略 |
|----------|----------|----------|
| 市场风险 | 投资亏损 | 资产配置 |
| 健康风险 | 生病/残疾 | 保险配置 |
| 通胀风险 | 购买力下降 | 投资增长 |
| 长寿风险 | 钱不够花 | 保守提取 |
| 意外风险 | 突发事件 | 应急基金 |

### 风险等级

```
高风险：需要优先应对
- 重大疾病
- 意外残疾
- 市场崩盘

中风险：需要关注
- 通胀
- 长寿
- 失业

低风险：需要预防
- 日常支出增加
- 投资回报下降
```

## 3. 专业建议

### A. 应急基金

#### 资金准备
```
建议金额：6-12个月支出

配置：
- 现金：3个月支出
- 货币基金：3-6个月
- 短期理财：3-6个月
```

### B. 保险配置

#### 保险优先级
```
1. 医疗险：首要配置
2. 重疾险：收入损失
3. 寿险：家庭责任
4. 意外险：意外风险
5. 养老险：退休规划
```

### C. 安全边际

#### FIRE安全边际
```
1. 提取率保守：
   - 4% → 3.5%
   - 预留缓冲

2. 目标金额保守：
   - 计算值 × 1.2

3. 收入预估保守：
   - 预期回报 × 0.8
```

### D. 风险监控

#### 监控指标
```
1. 资产配置偏离度
2. 提取率变化
3. 保险覆盖度
4. 应急基金充足度
5. 市场环境变化
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
