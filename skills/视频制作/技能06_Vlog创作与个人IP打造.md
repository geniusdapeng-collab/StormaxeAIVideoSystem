---
name: Vlog创作与个人IP打造
skill_id: videomaking_vlog
version: 1.0.0
last_updated: 2026-04-03

domain: 内容创作
sub_domain: 视频制作
type: creative_skill
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
  level1_tool: 提供Vlog框架
  level2_data: 基于类型推荐方法
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 生活Vlog
    - 知识Vlog
    - 旅行Vlog
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 创作框架
    - IP打造方案

retrieval_profile:
  logical_topics:
    - Vlog创作
    - 个人IP
    - 人设打造
    - 内容定位
    - 风格塑造
    - 记忆点
  aliases:
    - Vlog
    - 个人品牌
    - 人设
  sample_queries:
    - Vlog怎么拍
    - 个人IP怎么打造
    - 人设怎么设计
    - 内容定位
    - 风格塑造
    - 记忆点
    - 博主养成
    - 身份设定
    - 特色打造
    - 差异化
  problem_patterns:
    - 没有特色
    - 人设模糊
    - 不够真实
  entities:
    who:
      - Vlogger
      - 个人博主
    actions:
      - 创作
      - 打造
      - 塑造
    objects:
      - Vlog
      - IP
      - 人设
  scenarios:
    - 新账号起步
    - 内容转型
    - IP升级
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: Vlog创作 个人IP 人设打造 内容定位 风格塑造 记忆点
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
  - 视频制作
  - Vlog创作
  - 个人IP
status: production
license: internal

generation_spec:
  title: Vlog创作与个人IP打造
  summary: 掌握Vlog创作方法，打造有影响力的个人IP
  output_mode: blueprint
  skill_blueprint_id: videomaking_vlog
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: creative_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助创作者打造个人IP
  non_goals: 不涉及虚假包装
  success_metrics:
    - 粉丝增长
    - IP认知度
  user_scenarios:
    - 新账号起步
    - 内容转型
    - IP升级
  target_audience:
    - Vlogger
    - 个人博主
  trigger_intents:
    - Vlog怎么拍
    - 个人IP怎么打造
    - 人设怎么设计
  estimated_user_time: 2-3小时
  estimated_system_time: <3秒
  difficulty: 3
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 内容类型
    - 目标受众
  required_context_fields:
    - 个人特点
  missing_info_policy:
    low_risk: 提供通用创作框架
    medium_risk: 询问具体定位
    high_risk: 建议进行专业咨询
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供创作框架
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

IP打造核心：人设定位→内容规划→风格统一→记忆点强化，四步建立独特IP

## 1. 场景分析

### 请求摘要
用户需要打造个人IP和Vlog

### 显性需求
- 掌握IP打造方法
- 获得可执行的Vlog方案

### 场景分类
- `scenario_classification`: 个人品牌
- `urgency`: normal

## 2. IP打造框架

### 人设定位

```
人设要素：
1. 身份标签：你是谁
2. 专业领域：做什么
3. 性格特点：什么风格
4. 价值主张：传递什么
5. 差异化：有什么不同
```

### 内容支柱

```
内容金字塔：
- 底层：日常内容（接地气）
- 中层：专业内容（有价值）
- 顶层：人设内容（建立连接）
```

## 3. 专业建议

### A. 人设设计

#### 人设公式
```
人设 = 身份 + 性格 + 特色 + 价值

示例：
程序员 + 幽默 + 接地气 + 分享编程干货
```

#### 真实原则
```
1. 基于真实人设
2. 放大特点
3. 保持一致性
4. 持续强化
```

### B. Vlog结构

#### 常见结构
```
1. 开头：吸引注意力
2. 铺垫：建立情境
3. 主体：核心内容
4. 结尾：互动引导
```

### C. 记忆点打造

#### 记忆点类型
```
1. 语言：口头禅/金句
2. 视觉：标志动作/元素
3. 内容：固定栏目
4. 风格：独特风格
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
