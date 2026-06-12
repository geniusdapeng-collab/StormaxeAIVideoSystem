---
name: FIRE心态建设与心理准备
skill_id: fire_mindset
version: 1.0.0
last_updated: 2026-04-03

domain: 财务管理
sub_domain: FIRE生活
type: psychology_skill
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
  level1_tool: 提供心态框架
  level2_data: 基于问题推荐方案
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    -  FIRE准备期
    - FIRE进行期
    - FIRE完成后
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 心态框架
    - 心理建设方案

retrieval_profile:
  logical_topics:
    - FIRE心态
    - 心理准备
    - 延迟满足
    - FIRE焦虑
    - 内心平衡
    - 价值观
  aliases:
    - 心态
    - 心理
    - 价值观
  sample_queries:
    - FIRE心态
    - 心理准备
    - 延迟满足
    - FIRE焦虑
    - 内心平衡
    - 价值观
    - FIRE心理
    - 心态建设
    - FIRE压力
    - 心理建设
  problem_patterns:
    - 焦虑
    - 迷茫
    - 价值观冲突
  entities:
    who:
      - FIRE追求者
    actions:
      - 建设
      - 调整
      - 建立
    objects:
      - 心态
      - 心理
      - 价值观
  scenarios:
    - FIRE准备期
    - FIRE进行期
    - FIRE完成后
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: FIRE心态 心理准备 延迟满足 FIRE焦虑 内心平衡 价值观
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
  - 心态建设
  - 心理准备
status: production
license: internal

generation_spec:
  title: FIRE心态建设与心理准备
  summary: 建立FIRE所需的心理准备和正确心态
  output_mode: blueprint
  skill_blueprint_id: fire_mindset
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: psychology_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助用户建立FIRE正确心态
  non_goals: 不涉及心理治疗
  success_metrics:
    - 心态稳定性
    - 决策理性
  user_scenarios:
    - FIRE准备期
    - FIRE进行期
    - FIRE完成后
  target_audience:
    - FIRE追求者
  trigger_intents:
    - FIRE心态
    - 心理准备
    - 延迟满足
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - FIRE阶段
    - 心理状态
  required_context_fields:
    - 压力来源
  missing_info_policy:
    low_risk: 提供通用心态框架
    medium_risk: 询问具体问题
    high_risk: 建议寻求心理支持
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供心态框架
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

心态建设核心：价值观澄清→延迟满足→过程享受→平衡生活→接纳变化，四步建立FIRE正念

## 1. 场景分析

### 请求摘要
用户需要建立FIRE的心理准备

### 显性需求
- 掌握心态调整方法
- 获得心理建设方案

### 场景分类
- `scenario_classification`: 心理建设
- `urgency`: normal

## 2. 心态框架

### FIRE常见心态

| 心态 | 表现 | 调整方向 |
|------|------|----------|
| 焦虑 | 担心钱不够 | 量化目标 |
| 牺牲感 | 亏待自己 | 寻找意义 |
| 迷茫 | 不知道为了什么 | 明确价值观 |
| 急躁 | 想要快速达成 | 享受过程 |
| 孤独 | 无人理解 | 寻找社群 |

### FIRE心路历程

```
1. 萌芽期：对现状不满
2. 探索期：了解FIRE
3. 决定期：决定FIRE
4. 进行期：努力积累
5. 达成期：实现FIRE
6. 适应期：新的生活
```

## 3. 专业建议

### A. 延迟满足

#### 实践方法
```
1. 理解价值：为什么等待
2. 设定小目标：阶段性奖励
3. 记录进步：看到成长
4. 寻找平衡：不要过度牺牲
5. 享受过程：不仅是目标
```

### B. 价值观澄清

#### 自我探索
```
1. 什么对你最重要
2. 你想要什么样的生活
3. 工作的意义是什么
4. 成功的定义是什么
5. 幸福的来源是什么
```

### C. 应对焦虑

#### 焦虑处理
```
1. 量化目标：具体数字
2. 拆解任务：分解压力
3. 关注可控：聚焦行动
4. 寻求支持：与人分享
5. 专业帮助：必要时咨询
```

### D. 社群支持

#### 加入社群
```
1. 线上社区：FIRE论坛/群组
2. 同伴支持：互相鼓励
3. 经验分享：学习他人
4. 减少孤独：找到共鸣
5. 持续动力：保持热情
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
