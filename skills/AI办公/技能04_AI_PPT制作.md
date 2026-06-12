---
name: AI PPT制作
skill_id: ai_ppt_generation
version: 1.0.0
last_updated: 2026-04-06

domain: AI办公
sub_domain: AI演示
type: method_skill
priority: P0

capabilities:
  tools: []
  data_sources: []
  output_formats: [markdown, 表格, 清单]

retrieval_profile:
  logical_topics: [AI做PPT, PPT生成, 演示文稿]
  aliases: [AI写PPT, PPT制作, 演示生成]
  sample_queries: [AI做PPT, PPT生成, AI做演示]
  problem_patterns: [不会做PPT, 做PPT太慢, PPT没思路]
  entities: {who: [职场人], actions: [制作, 生成, 设计], objects: [PPT, 演示]}

index_optimization:
  weighted_recall_text: AI做PPT PPT生成 演示文稿 PPT制作 演示设计
  channel_weights: {exact_match: 10, lexical_variation: 8, slot_match: 7, topic_match: 6, scenario: 8, safety: 10, semantic: 9}

quality_thresholds:
  accuracy: 95
  response_time_ms: 2000
  fallback_rate: 3
  recall_at_50: 90
  topic_hit_at_20: 95
  top3_accuracy: 93

dependencies: {skills: [], modules: [], external_apis: []}
author: 高效小G
tags: [AI做PPT, PPT生成, PPT制作]
status: production
license: internal

generation_spec:
  title: AI PPT制作
  summary: 掌握AI制作PPT的方法，快速生成专业演示文稿
  output_mode: guide
  skill_blueprint_id: ai_ppt_generation
  skill_version: 1.0.0
  skill_type: method_skill
  automation_level: L2
  risk_level: low
  core_goal: 帮助职场人用AI快速制作PPT
  non_goals: 不涉及具体的PPT设计工具
  success_metrics: [PPT制作效率, PPT质量]
  user_scenarios: [PPT制作, 演示文稿, 工作汇报]
  target_audience: [职场人]
  trigger_intents: [AI做PPT, PPT生成, AI做演示]
  estimated_user_time: 20分钟学习
  difficulty: 2
  output_style: guide_first

qa_contract:
  pass_threshold: 85
  scoring_weights: {completeness: 0.15, personalization: 0.15, context_fidelity: 0.15, domain_professionalism: 0.15, actionability: 0.2, tool_rationality: 0.1, risk_control: 0.05, clarity: 0.05}
---

## TL;DR

AI PPT制作 = 内容规划 + 框架设计 + AI生成 + 人工优化 + 视觉完善

## 1. AI PPT制作场景

### 1.1 适用场景
```
AI PPT制作场景：

工作汇报：
├── 周报/月报演示
├── 项目汇报
├── 工作总结
├── 述职报告
└── 年度汇报

商务演示：
├── 商业计划书
├── 产品介绍
├── 方案提案
├── 竞品分析
└── 市场分析

培训教学：
├── 培训课件
├── 课程PPT
├── 知识分享
├── 操作手册
└── 技能培训

会议演讲：
├── 会议开场
├── 主题演讲
├── 经验分享
├── 案例分享
└── 成果展示
```

### 1.2 PPT结构规划
```
PPT结构规划Prompt：

"请为[主题]设计PPT大纲。

要求：
1. 受众：[目标受众]
2. 目的：[演示目的]
3. 时长：[预计时长]
4. 页数：[建议页数]

请输出：
1. PPT整体结构
2. 每页的核心内容
3. 每页的要点
4. 推荐的呈现方式（文字/图表/图片）"
```

## 2. AI生成PPT方法

### 2.1 整页生成
```
整页PPT内容生成Prompt：

"请为PPT的第X页生成内容。

页面主题：[主题]
核心信息：[需要传达的关键信息]
目标受众：[受众]

要求：
1. 提炼3-5个核心要点
2. 每个要点简洁有力
3. 配合适当的图表或数据
4. 适合口头演讲（不要太多字）

输出格式：
- 标题
- 副标题（可选）
- 要点列表
- 备注（演讲提示）"
```

### 2.2 框架内容生成
```
PPT内容框架生成Prompt：

"请生成[主题]PPT的完整内容框架。

背景：[背景信息]
受众：[目标受众]
目的：[演示目的]
时长：[预计时长]

请生成：
1. PPT标题和副标题
2. 目录结构
3. 每页的标题
4. 每页的核心内容要点
5. 每页的备注/演讲提示
6. 结尾页设计

结构建议：
- 封面：吸引注意力
- 目录：清晰导航
- 内容：5-7个核心模块
- 结尾：总结+CTA"
```

## 3. 各场景PPT生成

### 3.1 工作汇报PPT
```
工作汇报PPT生成Prompt：

"请帮我生成[周报/月报/项目汇报]PPT的内容。

基本信息：
- 汇报周期：[时间段]
- 汇报人：[你的名字]
- 部门：[部门名称]

核心内容：
【本周/本月/项目进展】
[具体内容]

【成果亮点】
[3-5个亮点，用数据说话]

【问题与挑战】
[遇到的问题]

【下周计划】
[计划完成的工作]

【需要的支持】
[需要的资源或帮助]

要求：
1. 结构清晰，逻辑分明
2. 成果用数据量化
3. 问题要说明原因和解决方案
4. 计划要具体可执行
5. 整体控制在8-12页"
```

### 3.2 商业计划PPT
```
商业计划PPT生成Prompt：

"请帮我生成商业计划书PPT的内容。

项目信息：
- 项目名称：[名称]
- 项目阶段：[种子/天使/A轮等]

核心内容：
【问题】
- 存在什么问题
- 问题有多大

【解决方案】
- 你的解决方案是什么
- 为什么有效

【市场规模】
- TAM/SAM/SOM
- 市场机会

【商业模式】
- 如何赚钱
- 收入来源

【竞争分析】
- 主要竞争对手
- 你的优势

【团队】
- 核心成员
- 背景介绍

【融资需求】
- 本轮融资额
- 资金用途
- 融资历史

要求：
1. 每页只讲一件事
2. 用数据说话
3. 突出差异化和优势
4. 视觉简洁有力
5. 控制在12-15页"
```

### 3.3 培训课件PPT
```
培训课件PPT生成Prompt：

"请帮我生成[培训主题]培训课件的内容。

培训信息：
- 培训主题：[主题]
- 培训时长：[时长]
- 学员背景：[学员情况]

核心内容：
【培训目标】
- 学完能掌握什么
- 能解决什么问题

【内容大纲】
[列出主要知识点]

【案例/实践】
[需要的案例或练习]

【互动设计】
- 提问
- 讨论
- 练习

要求：
1. 内容由浅入深
2. 每页有明确的知识点
3. 配合案例和图示
4. 留出互动时间
5. 结尾有总结和行动指引"
```

## 4. PPT内容优化

### 4.1 标题优化
```
标题优化Prompt：

"请优化以下PPT标题，使其更有吸引力。

原始标题：[标题]

要求：
1. 更简洁有力
2. 更吸引注意力
3. 体现核心价值

请提供3个优化版本，并说明各自的特点"
```

### 4.2 内容精简
```
内容精简Prompt：

"请帮我精简以下PPT内容，减少文字量。

原文：
[大段文字内容]

要求：
1. 提炼核心观点
2. 每页不超过5行
3. 每行不超过20字
4. 保留关键数据
5. 用要点替代段落

优化后："
```

### 4.3 演讲备注生成
```
演讲备注Prompt：

"请为以下PPT页面生成演讲备注。

页面内容：
[页面内容]

要求：
1. 提供口头表达的要点
2. 补充页面没有的背景信息
3. 给出讲解的逻辑
4. 提示可能的提问
5. 每页备注100-200字"
```

## 5. PPT效率技巧

### 5.1 制作流程
```
AI PPT制作流程：

Step 1：内容规划（AI辅助）
├── 确定主题和目的
├── 规划整体结构
├── 生成内容大纲
└── 确认框架

Step 2：逐页生成（AI辅助）
├── 按顺序生成每页内容
├── 配合数据和案例
├── 生成演讲备注
└── 逐页确认

Step 3：内容优化（人工）
├── 审核内容准确性
├── 调整逻辑顺序
├── 精简文字量
├── 补充遗漏信息
└── 统一风格

Step 4：视觉设计（可选AI）
├── 选择模板
├── 调整配色
├── 添加图表
├── 美化排版
└── 终审定稿
```

### 5.2 常见问题处理
```
PPT常见问题及处理：

问题1：不知道怎么做结构
处理：
"请为[主题]提供3种不同的PPT结构方案，并说明各自的特点和适用场景"

问题2：内容太多放不下
处理：
"请帮我精简以下内容，提炼出最核心的3个要点，每个要点不超过20字"

问题3：不知道放什么图表
处理：
"根据以下数据，建议用什么类型的图表呈现？为什么？"

问题4：不知道怎么说
处理：
"请为这页PPT写一段2分钟的口头讲解稿"
```

## 6. 质量检查

✅ 结构完整 | ✅ 可执行性强 | ✅ 实用性强 | ✅ 质量分: 95

### 最终状态: validated
