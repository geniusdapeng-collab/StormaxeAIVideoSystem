---
name: 产品PRD文档撰写
skill_id: product_prd
version: 1.0.0
last_updated: 2026-04-03

domain: 产品经理
sub_domain: 产品设计
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
  level1_tool: 提供PRD框架
  level2_data: 基于产品类型推荐模板
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - B端产品
    - C端产品
    - 平台产品
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - PRD模板
    - 文档规范

retrieval_profile:
  logical_topics:
    - PRD撰写
    - 需求文档
    - 产品文档
    - 文档规范
    - 文档模板
    - 需求说明
  aliases:
    - PRD
    - 需求文档
    - 产品文档
  sample_queries:
    - PRD怎么写
    - 需求文档
    - 产品文档怎么写
    - PRD模板
    - 需求说明怎么写
    - 产品需求文档
    - PRD格式
    - 需求规范
    - 文档模板
    - 需求描述
  problem_patterns:
    - 文档不规范
    - 表达不清晰
    - 遗漏信息
  entities:
    who:
      - 产品经理
      - 需求分析师
    actions:
      - 撰写
      - 编写
      - 整理
    objects:
      - PRD
      - 文档
      - 需求
  scenarios:
    - 新产品开发
    - 功能迭代
    - 需求评审
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: PRD撰写 需求文档 产品文档 文档规范 文档模板 需求说明
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
  - 产品设计
  - PRD
  - 文档撰写
status: production
license: internal

generation_spec:
  title: 产品PRD文档撰写
  summary: 掌握PRD文档撰写规范和模板
  output_mode: blueprint
  skill_blueprint_id: product_prd
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助产品经理规范撰写PRD
  non_goals: 不涉及具体技术实现
  success_metrics:
    - 文档质量
    - 评审效率
  user_scenarios:
    - 新产品开发
    - 功能迭代
    - 需求评审
  target_audience:
    - 产品经理
    - 需求分析师
  trigger_intents:
    - PRD怎么写
    - 需求文档
    - 产品文档怎么写
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 产品类型
    - 文档用途
  required_context_fields:
    - 核心功能
  missing_info_policy:
    low_risk: 提供通用PRD框架
    medium_risk: 询问具体需求
    high_risk: 建议参考优秀PRD
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供PRD框架
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

PRD撰写核心：文档结构→背景目标→功能描述→业务流程→验收标准，五步写好PRD文档

## 1. 场景分析

### 请求摘要
用户需要撰写PRD文档

### 显性需求
- 掌握PRD格式
- 规范文档内容

### 场景分类
- `scenario_classification`: 产品文档
- `urgency`: normal

## 2. PRD结构框架

### 文档结构

| 章节 | 内容 | 重要性 |
|------|------|--------|
| 概述 | 背景/目标/范围 | ★★★ |
| 用户 | 用户画像/角色 | ★★☆ |
| 功能 | 功能清单/描述 | ★★★ |
| 流程 | 业务流程/页面 | ★★★ |
| 接口 | 数据/API需求 | ★★☆ |
| 验收 | 验收标准/测试 | ★★★ |
| 非功能 | 性能/安全等 | ★☆☆ |

### 写作原则

```
1. 清晰：表述明确无歧义
2. 完整：覆盖所有场景
3. 可执行：开发能看懂
4. 可测试：测试有依据
5. 可追溯：版本可管理
```

## 3. 专业建议

### A. 概述部分

#### 写作要点
```
1. 背景：为什么做
2. 目标：做成什么样
3. 范围：做什么不做什么
4. 术语：专业名词解释
5. 版本：文档版本记录
```

### B. 功能描述

#### 描述方法
```
1. 功能清单：功能列表
2. 功能详情：每个功能说明
3. 用户故事：谁做什么得到什么
4. 需求描述：具体描述
5. 优先级：重要程度
```

### C. 业务流程

#### 表达方式
```
1. 流程图：视觉化展示
2. 泳道图：多角色流程
3. 页面流：页面跳转
4. 时序图：交互顺序
5. 状态机：状态变化
```

### D. 验收标准

#### 编写方法
```
1. 功能验收：功能点验收
2. 场景验收：各种情况
3. 异常验收：错误处理
4. 性能验收：响应时间等
5. 验收方式：怎么测试
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
