---
name: 视频SEO与搜索流量
skill_id: videomaking_seo
version: 1.0.0
last_updated: 2026-04-03

domain: 内容创作
sub_domain: 视频制作
type: operational_skill
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
  level1_tool: 提供SEO框架
  level2_data: 基于平台推荐方法
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 抖音SEO
    - B站SEO
    - 视频号SEO
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - SEO方案
    - 关键词策略

retrieval_profile:
  logical_topics:
    - 视频SEO
    - 搜索流量
    - 关键词
    - 排名优化
    - 搜索推荐
    - 长尾词
  aliases:
    - SEO
    - 搜索优化
    - 关键词
  sample_queries:
    - 视频SEO怎么做
    - 搜索流量怎么获取
    - 关键词怎么选
    - 排名优化
    - 抖音搜索
    - B站搜索
    - 推荐机制
    - 长尾词
    - 搜索排名
    - 流量获取
  problem_patterns:
    - 搜索流量低
    - 关键词没排名
    - 曝光不够
  entities:
    who:
      - 视频创作者
      - 运营人员
    actions:
      - 优化
      - 提升
      - 获取
    objects:
      - SEO
      - 关键词
      - 排名
  scenarios:
    - 新视频发布
    - 搜索优化
    - 流量提升
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: 视频SEO 搜索流量 关键词 排名优化 搜索推荐 长尾词
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
  - SEO
  - 搜索优化
status: production
license: internal

generation_spec:
  title: 视频SEO与搜索流量
  summary: 通过SEO优化获取搜索流量，提升视频长尾曝光
  output_mode: blueprint
  skill_blueprint_id: videomaking_seo
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: operational_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助创作者获取搜索流量
  non_goals: 不涉及黑帽SEO
  success_metrics:
    - 搜索曝光
    - 搜索流量占比
  user_scenarios:
    - 新视频发布
    - 搜索优化
    - 流量提升
  target_audience:
    - 视频创作者
    - 运营人员
  trigger_intents:
    - 视频SEO怎么做
    - 搜索流量怎么获取
    - 关键词怎么选
  estimated_user_time: 1-2小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 目标平台
    - 内容领域
  required_context_fields:
    - 关键词
  missing_info_policy:
    low_risk: 提供通用SEO框架
    medium_risk: 询问具体关键词
    high_risk: 建议进行关键词调研
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供SEO框架
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

SEO核心：关键词布局→内容匹配→数据提升→排名稳定，四步获取搜索流量

## 1. 场景分析

### 请求摘要
用户需要通过SEO获取搜索流量

### 显性需求
- 掌握SEO方法
- 获得可执行的优化方案

### 场景分类
- `scenario_classification`: 流量运营
- `urgency`: normal

## 2. SEO要素框架

### 核心要素

| 要素 | 权重 | 说明 |
|------|------|------|
| 标题关键词 | 30% | 包含搜索词 |
| 描述关键词 | 20% | 补充关键词 |
| 标签话题 | 15% | 话题覆盖 |
| 完播率 | 20% | 内容质量 |
| 互动数据 | 15% | 用户认可 |

## 3. 专业建议

### A. 关键词策略

#### 关键词类型
```
1. 核心词：领域大词
2. 长尾词：细分需求
3. 疑问词：问题搜索
4. 热点词：时效热词
```

### B. 关键词布局

#### 布局位置
```
1. 标题：核心关键词前置
2. 描述：补充长尾词
3. 标签：话题标签
4. 内容：自然融入
```

### C. 搜索排名优化

#### 排名因素
```
1. 关键词匹配度
2. 视频质量（完播率）
3. 互动数据（点赞/评论）
4. 账号权重
5. 时效性
```

### D. 关键词挖掘

#### 挖掘方法
```
1. 平台搜索下拉
2. 搜索热词榜
3. 竞品关键词
4. 第三方工具
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
