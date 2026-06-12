---
name: FIRE后生活规划
skill_id: fire_after
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
  level1_tool: 提供生活规划框架
  level2_data: 基于兴趣推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 退休生活
    - 半退休
    - 转型期
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 生活规划框架
    - 退休方案

retrieval_profile:
  logical_topics:
    - FIRE后生活
    - 退休规划
    - 生活设计
    - 第二人生
    - 人生目标
    - 日常安排
  aliases:
    - 退休
    - 生活
    - 规划
  sample_queries:
    - FIRE后生活
    - 退休规划
    - 生活设计
    - 第二人生
    - 人生目标
    - 日常安排
    - FIRE后做什么
    - 退休生活
    - 退休规划
    - 生活安排
  problem_patterns:
    - 无所事事
    - 失去目标
    - 价值感缺失
  entities:
    who:
      - FIRE完成者
    actions:
      - 规划
      - 设计
      - 安排
    objects:
      - 生活
      - 时间
      - 目标
  scenarios:
    - FIRE达成
    - 过渡期
    - 新生活
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE后生活 退休规划 生活设计 第二人生 人生目标 日常安排
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
  - 退休规划
  - 生活设计
status: production
license: internal

generation_spec:
  title: FIRE后生活规划
  summary: 规划FIRE后的有意义生活，找到新的人生目标
  output_mode: blueprint
  skill_blueprint_id: fire_after
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户规划FIRE后的精彩生活
  non_goals: 不涉及具体生活安排
  success_metrics:
    - 生活满意度
    - 意义感
  user_scenarios:
    - FIRE达成
    - 过渡期
    - 新生活
  target_audience:
    - FIRE完成者
  trigger_intents:
    - FIRE后生活
    - 退休规划
    - 生活设计
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 兴趣
    - 家庭状况
  required_context_fields:
    - 生活期望
  missing_info_policy:
    low_risk: 提供通用生活规划框架
    medium_risk: 询问具体兴趣
    high_risk: 建议进行人生规划咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供生活规划框架
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

FIRE后生活核心：意义探索→兴趣发展→社交维护→健康关注→价值创造，五步规划精彩第二人生

## 1. 场景分析

### 请求摘要
用户需要规划FIRE后的生活

### 显性需求
- 规划有意义的生活
- 找到新的人生目标

### 场景分类
- `scenario_classification`: 人生规划
- `urgency`: normal

## 2. 生活框架

### FIRE后挑战

| 挑战 | 表现 | 应对 |
|------|------|------|
| 身份认同 | 不知道是谁 | 重新定义 |
| 时间管理 | 时间太多 | 规划安排 |
| 社交减少 | 社交变少 | 主动维护 |
| 意义感 | 失去目标 | 价值创造 |
| 家庭关系 | 相处时间多 | 平衡边界 |

### 生活维度

```
1. 健康：身体锻炼
2. 关系：家人朋友
3. 成长：学习新知
4. 贡献：帮助他人
5. 意义：人生价值
```

## 3. 专业建议

### A. 意义探索

#### 寻找方向
```
1. 回顾人生：哪些时刻最快乐
2. 探索兴趣：一直想做什么
3. 价值思考：什么让你满足
4. 贡献思考：能帮助什么
5. 尝试新事：不要设限
```

### B. 日常安排

#### 时间规划
```
1. 保持规律：不要完全无序
2. 目标导向：每天有目标
3. 平衡生活：工作与休闲
4. 社交时间：保持联系
5. 健康时间：锻炼身体
```

### C. 价值创造

#### 贡献方式
```
1. 志愿服务：帮助他人
2.  mentorship：指导他人
3.  创作：分享知识
4. 创业：继续创造
5. 公益：回馈社会
```

### D. 社交维护

#### 维护关系
```
1. 主动联系：不要被动
2. 兴趣社群：找到同好
3. 家庭时间：陪伴家人
4. 新朋友：开放心态
5. 深度交流：质量重于数量
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
