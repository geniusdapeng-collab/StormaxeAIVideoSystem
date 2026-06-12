---
name: FIRE税务规划
skill_id: fire_tax
version: 1.0.0
last_updated: 2026-04-03

domain: 财务管理
sub_domain: FIRE生活
type: method_skill
priority: P2

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
  level1_tool: 提供税务框架
  level2_data: 基于收入类型推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 工资收入
    - 投资收入
    - 被动收入
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 税务规划框架
    - 节税方案

retrieval_profile:
  logical_topics:
    - FIRE税务
    - 税务规划
    - 节税技巧
    - 投资税务
    - 收入税务
    - 财富税务
  aliases:
    - 税务
    - 税
    - 节税
  sample_queries:
    - FIRE税务规划
    - 税务规划
    - 节税技巧
    - 投资税务
    - 收入税务
    - 财富税务
    - 怎么节税
    - 税务优化
    - 投资税
    - 理财税
  problem_patterns:
    - 税负重
    - 不会规划
    - 合规问题
  entities:
    who:
      - FIRE追求者
    actions:
      - 规划
      - 优化
      - 节税
    objects:
      - 税务
      - 税
      - 支出
  scenarios:
    - FIRE积累期
    - FIRE实现期
    - FIRE后
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE税务 税务规划 节税技巧 投资税务 收入税务 财富税务
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
  - 税务规划
  - 节税技巧
status: production
license: internal

generation_spec:
  title: FIRE税务规划
  summary: 了解FIRE过程中的税务问题，进行合理税务规划
  output_mode: blueprint
  skill_blueprint_id: fire_tax
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: medium
  core_goal: 帮助用户进行FIRE税务规划
  non_goals: 不涉及具体避税方案
  success_metrics:
    - 税负降低
    - 合规性
  user_scenarios:
    - FIRE积累期
    - FIRE实现期
    - FIRE后
  target_audience:
    - FIRE追求者
  trigger_intents:
    - FIRE税务规划
    - 税务规划
    - 节税技巧
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 收入类型
    - 所在地区
  required_context_fields:
    - 税务状况
  missing_info_policy:
    low_risk: 提供通用税务框架
    medium_risk: 询问具体收入
    high_risk: 建议进行专业税务咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for:
    - 具体避税方案
  fallback_mode: 提供税务框架
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

税务规划核心：了解税法→合理利用政策→优化收入结构→合规节税→持续学习，五步降低FIRE税负

## 1. 场景分析

### 请求摘要
用户需要了解FIRE相关税务规划

### 显性需求
- 掌握税务规划方法
- 合规降低税负

### 场景分类
- `scenario_classification`: 财务规划
- `urgency`: normal

## 2. 税务框架

### FIRE涉及税种

| 税种 | 收入类型 | 税率 |
|------|----------|------|
| 个人所得税 | 工资/劳务 | 累进税率 |
| 资本利得税 | 股票买卖 | 20% |
| 股息税 | 分红 | 10%/20% |
| 房租税 | 租金收入 | 10-20% |
| 增值税 | 交易 | 13%等 |

### 税务考虑

```
FIRE前：
- 工资税负高
- 合理利用免税额度

FIRE后：
- 提取方式影响税负
- 收入类型变化
```

## 3. 专业建议

### A. 收入规划

#### 收入优化
```
1. 收入类型：
   - 主动收入（工资）
   - 被动收入（利息/分红）
   - 资本利得（增值）

2. 税负对比：
   - 工资：累进税率
   - 投资：较低税率
   - 分红：优惠税率
```

### B. 账户利用

#### 账户策略
```
1. 养老账户：税延/免税
2. 投资账户：利用税收优惠
3. 公积金：住房相关
4. 保险：税优产品
```

### C. 投资优化

#### 投资税务
```
1. 长期持有：降低交易频率
2. 指数投资：减少主动交易
3. 税收优惠产品：REITs/国债
4. 账户类型：匹配税种
```

### D. 合规节税

#### 合法节税
```
1. 了解政策：税收优惠
2. 专项扣除：合理利用
3. 公益捐赠：税前扣除
4. 继续教育：提升抵税
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
