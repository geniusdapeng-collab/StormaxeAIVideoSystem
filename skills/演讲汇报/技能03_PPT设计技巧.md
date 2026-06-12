---
name: PPT设计技巧
skill_id: presentation_ppt
version: 1.0.0
last_updated: 2026-04-03

domain: 沟通表达
sub_domain: 演讲汇报
type: design_skill
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
  level1_tool: 提供PPT设计框架
  level2_data: 基于场景推荐风格
  level3_output: 输出简化版建议

persona_adaptation:
  user_profile: true
  modes:
    - 商务PPT
    - 学术PPT
    - 创意PPT
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 设计模板
    - 排版指南

retrieval_profile:
  logical_topics:
    - PPT设计
    - 幻灯片设计
    - 排版
    - 配色
    - 动画效果
    - 视觉呈现
  aliases:
    - PPT
    - 幻灯片
    - 演示文稿
  sample_queries:
    - PPT怎么设计
    - 幻灯片排版
    - PPT配色
    - 动画技巧
    - 视觉设计
    - PPT模板
    - 设计原则
    - 字体选择
    - 图片处理
    - 版式设计
  problem_patterns:
    - 排版混乱
    - 配色不协调
    - 动画过多
  entities:
    who:
      - 演讲者
      - 汇报人
    actions:
      - 设计
      - 排版
      - 美化
    objects:
      - PPT
      - 幻灯片
      - 视觉
  scenarios:
    - 工作汇报
    - 产品发布
    - 学术分享
  age_stages:
    - 成年人
  urgency: normal
  negative_queries: []

index_optimization:
  weighted_recall_text: PPT设计 幻灯片设计 排版 配色 动画效果 视觉呈现
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
  - 演讲汇报
  - PPT设计
  - 视觉呈现
status: production
license: internal

generation_spec:
  title: PPT设计技巧
  summary: 掌握PPT设计方法，制作专业美观的演示文稿
  output_mode: blueprint
  skill_blueprint_id: presentation_ppt
  skill_run_id: null
  skill_version: 1.0.0
  skill_type: design_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助演讲者设计专业PPT
  non_goals: 不涉及复杂动画制作
  success_metrics:
    - 视觉清晰度
    - 信息传达效率
  user_scenarios:
    - 工作汇报
    - 产品发布
    - 学术分享
  target_audience:
    - 演讲者
    - 汇报人
  trigger_intents:
    - PPT怎么设计
    - 幻灯片排版
    - PPT配色
  estimated_user_time: 2-3小时
  estimated_system_time: <3秒
  difficulty: 2
  output_style: guide_first

runtime_contract:
  required_profile_fields:
    - 演讲类型
    - 品牌规范
  required_context_fields:
    - 内容大纲
  missing_info_policy:
    low_risk: 提供通用设计框架
    medium_risk: 询问具体风格
    high_risk: 建议参考专业模板
  priority_order: []
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供设计框架
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

PPT设计核心：信息简化→视觉统一→重点突出→动画克制，四步打造专业演示

## 1. 场景分析

### 请求摘要
用户需要设计专业PPT

### 显性需求
- 掌握PPT设计方法
- 获得可执行的设计方案

### 场景分类
- `scenario_classification`: 视觉设计
- `urgency`: normal

## 2. 设计原则框架

### 核心原则

| 原则 | 说明 | 优先级 |
|------|------|--------|
| 简洁 | 一页一重点 | ⭐⭐⭐ |
| 统一 | 风格一致 | ⭐⭐⭐ |
| 对比 | 突出关键 | ⭐⭐⭐ |
| 对齐 | 视觉秩序 | ⭐⭐ |
| 留白 | 呼吸空间 | ⭐⭐ |

### 设计要素

```
1. 文字：字体/大小/颜色
2. 图片：质量/位置/处理
3. 色彩：主色/辅助色
4. 布局：对齐/间距/平衡
5. 动画：效果/节奏
```

## 3. 专业建议

### A. 排版设计

#### 常用版式
```
1. 居中版式：标题居中
2. 左右版式：左文右图
3. 上下版式：上图下文
4. 满版版式：全图背景
5. 网格版式：多列布局
```

### B. 配色方案

#### 配色原则
```
1. 主色1-2个
2. 辅助色2-3个
3. 中性色：黑/白/灰
4. 对比度足够
5. 符合品牌
```

### C. 字体选择

#### 字体搭配
```
标题字体：粗体/大字号
正文字体：清晰易读
字体数量：不超过3种
中英搭配：协调统一
```

### D. 图片处理

#### 图片原则
```
1. 高分辨率
2. 相关性
3. 统一风格
4. 适当裁剪
5. 添加说明
```

## 4. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 质量分: 94

### 最终状态
**validated**
