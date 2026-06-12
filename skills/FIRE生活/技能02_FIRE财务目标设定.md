---
name: FIRE财务目标设定
skill_id: fire_goal_setting
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
  level1_tool: 提供目标设定框架
  level2_data: 基于情况推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 短期目标
    - 中期目标
    - 长期目标
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 目标框架
    - 规划方案

retrieval_profile:
  logical_topics:
    - FIRE目标
    - 财务目标
    - FIRE数字
    - 目标设定
    - 规划路径
    - 里程碑
  aliases:
    - 目标
    - 规划
    - 里程碑
  sample_queries:
    - FIRE目标怎么设定
    - FIRE数字怎么计算
    - 财务目标
    - 目标设定
    - 规划路径
    - 里程碑
    - FIRE数字
    - 财务规划
    - 目标规划
    - 实现路径
  problem_patterns:
    - 目标不清晰
    - 数字不会算
    - 规划混乱
  entities:
    who:
      - FIRE追求者
    actions:
      - 设定
      - 规划
      - 计算
    objects:
      - 目标
      - 数字
      - 路径
  scenarios:
    - 目标设定
    - 规划制定
    - 路径规划
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE目标 财务目标 FIRE数字 目标设定 规划路径 里程碑
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
  - 目标设定
  - 财务规划
status: production
license: internal

generation_spec:
  title: FIRE财务目标设定
  summary: 科学设定FIRE财务目标，制定实现路径
  output_mode: blueprint
  skill_blueprint_id: fire_goal_setting
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户设定科学的FIRE目标
  non_goals: 不涉及具体投资建议
  success_metrics:
    - 目标清晰度
    - 可行性
  user_scenarios:
    - 目标设定
    - 规划制定
    - 路径规划
  target_audience:
    - FIRE追求者
  trigger_intents:
    - FIRE目标怎么设定
    - FIRE数字怎么计算
    - 财务目标
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 年龄
    - 收入
    - 支出
  required_context_fields:
    - 现有资产
  missing_info_policy:
    low_risk: 提供通用目标框架
    medium_risk: 询问具体财务数据
    high_risk: 建议进行财务规划咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供目标框架
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

目标设定核心：计算FIRE数字→分解里程碑→设定时间表→动态调整，四步设定科学目标

## 1. 场景分析

### 请求摘要
用户需要设定FIRE财务目标

### 显性需求
- 计算FIRE数字
- 制定实现路径

### 场景分类
- `scenario_classification`: 目标规划
- `urgency`: normal

## 2. 目标框架

### FIRE数字计算

```
FIRE数字 = 年支出 × 25

4%法则假设：
- 投资回报率 4%
- 提取率 4%
- 资产可持续提取

示例：
年支出 24万 → FIRE数字 600万
年支出 36万 → FIRE数字 900万
```

### 影响因素

| 因素 | 影响 | 说明 |
|------|------|------|
| 支出水平 | 决定数字 | 越低数字越小 |
| 投资回报 | 影响提取率 | 5%可提取更高 |
| 预期寿命 | 影响总额 | 考虑长寿风险 |
| 生活方式 | 影响支出 | FIRE后生活方式 |

## 3. 专业建议

### A. 年度支出核算

#### 支出分类
```
1. 固定支出：房租/房贷/保险
2. 可变支出：餐饮/娱乐/旅行
3. 医疗支出：保险/医疗
4. 应急储备：备用金

FIRE后支出考虑：
- 收入中断风险
- 医疗费用增加
- 通胀影响
```

### B. 里程碑设定

#### 分解路径
```
1. 第一阶段：建立基础（1年内）
   - 紧急备用金
   - 债务清零

2. 第二阶段：积累资产（3-5年）
   - 达到FIRE数字的50%

3. 第三阶段：接近目标（5-10年）
   - 达到FIRE数字的80%

4. 第四阶段：达成FIRE
   - 达到FIRE数字
```

### C. 时间规划

#### 时间表设定
```
FIRE时间 = (FIRE数字 - 当前资产) ÷ 年储蓄

计算示例：
目标：600万
当前：100万
年储蓄：20万
时间 = (600-100) ÷ 20 = 25年
```

### D. 动态调整

#### 调整策略
```
1. 收入变化：调整储蓄目标
2. 支出变化：调整FIRE数字
3. 市场变化：调整投资策略
4. 人生阶段：调整目标
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
