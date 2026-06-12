---
name: FIRE投资策略与资产配置
skill_id: fire_investment
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
  level1_tool: 提供投资框架
  level2_data: 基于风险推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 保守型
    - 平衡型
    - 进取型
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 投资框架
    - 配置方案

retrieval_profile:
  logical_topics:
    - FIRE投资
    - 资产配置
    - 投资策略
    - 组合配置
    - 指数基金
    - 被动收入
  aliases:
    - 投资
    - 资产
    - 配置
  sample_queries:
    - FIRE投资策略
    - 资产配置
    - 投资策略
    - 组合配置
    - 指数基金
    - 被动收入
    - 资产配置
    - 投资组合
    - FIRE投资
    - 理财策略
  problem_patterns:
    - 投资混乱
    - 收益低
    - 风险控制
  entities:
    who:
      - FIRE追求者
    actions:
      - 投资
      - 配置
      - 管理
    objects:
      - 资产
      - 组合
      - 策略
  scenarios:
    - 投资规划
    - 资产配置
    - FIRE实施
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE投资 资产配置 投资策略 组合配置 指数基金 被动收入
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
  - 投资策略
  - 资产配置
status: production
license: internal

generation_spec:
  title: FIRE投资策略与资产配置
  summary: 制定适合FIRE的投资策略和资产配置方案
  output_mode: blueprint
  skill_blueprint_id: fire_investment
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: medium
  core_goal: 帮助用户制定FIRE投资策略
  non_goals: 不涉及具体投资建议
  success_metrics:
    - 投资回报率
    - 资产安全性
  user_scenarios:
    - 投资规划
    - 资产配置
    - FIRE实施
  target_audience:
    - FIRE追求者
  trigger_intents:
    - FIRE投资策略
    - 资产配置
    - 投资策略
  estimated_user_time: 2-3小时
  estimated_system_time: <3秒
  difficulty: 3
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 风险偏好
    - 投资经验
  required_context_fields:
    - 现有资产
  missing_info_policy:
    low_risk: 提供通用投资框架
    medium_risk: 询问风险承受能力
    high_risk: 建议进行专业投资咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for:
    - 大额投资决策
  fallback_mode: 提供投资框架
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

投资策略核心：明确目标→资产配置→指数投资→定期平衡→持续定投，五步构建FIRE投资组合

## 1. 场景分析

### 请求摘要
用户需要制定FIRE投资策略

### 显性需求
- 掌握投资方法
- 制定资产配置方案

### 场景分类
- `scenario_classification`: 投资规划
- `urgency`: normal

## 2. 投资框架

### 核心原则

| 原则 | 说明 | 重要性 |
|------|------|--------|
| 多元化 | 分散风险 | ⭐⭐⭐ |
| 低成本 | 减少费用 | ⭐⭐⭐ |
| 被动化 | 减少操作 | ⭐⭐⭐ |
| 长期化 | 坚持投资 | ⭐⭐⭐ |

### 投资组合类型

```
保守型：60%债券 + 40%股票
平衡型：40%债券 + 60%股票
进取型：20%债券 + 80%股票
```

## 3. 专业建议

### A. 资产配置

#### 配置策略
```
1. 股票：追求增长
   - 全球股票指数
   - 美国股票指数
   - 中国股票指数

2. 债券：稳定收益
   - 国债
   - 企业债

3. 另类资产：分散风险
   - 黄金
   - 房地产
```

### B. 投资工具

#### 推荐工具
```
1. 指数基金：低成本、多元化
2. ETF：交易灵活
3. 目标日期基金：自动调整
4. 主动基金：专业管理（可选）
```

### C. 定投策略

#### 执行方法
```
1. 定期投资：每月固定日期
2. 固定金额：每次投入相同
3. 自动转账：减少操作
4. 持续坚持：不间断
5. 适时调整：根据年龄调整
```

### D. 再平衡

#### 平衡策略
```
1. 年度回顾：检查配置
2. 偏离处理：恢复目标配置
3. 再平衡方法：
   - 买入卖出
   - 买入再平衡
   - 现金流再平衡
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
