---
name: 宝妈全方位健康管理
version: 1.0.0
last_updated: 2026-06-03

domain: 宝妈健康管理
sub_domain: 综合健康
type: skill_pack
priority: P0

capabilities:
  tools: []
  data_sources: [deep_research_gdm_report_v1]
  output_formats: [markdown]

retrieval_profile:
  logical_topics:
    - 宝妈健康
    - 妊娠糖尿病
    - 血糖管理
    - 健康调理
    - 哺乳期
    - 2型糖尿病
    - 产后恢复
  aliases:
    - 香香妈妈
    - 糖妈妈
    - 产后健康
    - 哺乳期健康
  sample_queries:
    - 血糖高了怎么办
    - 哺乳期怎么吃
    - 产后能运动吗
    - 宝宝妈妈健康
  problem_patterns:
    - 血糖控制不好
    - 不知道吃什么
    - 哺乳期不知道能不能运动
    - 不知道怎么复查
  entities:
    who: [糖妈妈, 产后妈妈]
    actions: [健康, 管理, 咨询]
    objects: [血糖, 饮食, 运动, 用药, 复查]
  scenarios:
    - 日常健康咨询
    - 血糖异常处理
    - 复查准备
  urgency: high

index_optimization:
  weighted_recall_text: 宝妈健康 妊娠糖尿病 血糖管理 健康调理 哺乳期 2型糖尿病 产后恢复
  neighbors: []
  channel_weights:
    exact_match: 10
    lexical_variation: 8
    slot_match: 9
    topic_match: 8
    scenario: 7
    safety: 10
    semantic: 8

quality_thresholds:
  accuracy: 93
  response_time_ms: 5000
  fallback_rate: 3
  recall_at_50: 88
  topic_hit_at_20: 90
  top3_accuracy: 88

dependencies:
  skills: []
  modules: []
  external_apis: []

author: 高效小G
tags: [宝妈健康, 妊娠糖尿病, 血糖管理, 健康调理, V9标准, 哺乳期]
status: production
license: internal

generation_spec:
  title: 宝妈全方位健康管理
  summary: 面向产后7个月哺乳期糖妈妈的全方位健康管理技能包，包含10个维度技能。V9标准版。
  output_mode: skill_pack
  skill_blueprint_id: baomom_health_management_pack
  skill_version: 1.0.0
  skill_type: skill_pack
  automation_level: L2
  risk_level: low
  core_goal: 全方位守护糖妈妈健康，涵盖血糖/饮食/运动/睡眠/心理/用药/并发症/哺乳/家庭/复查十大维度
  non_goals: [不替代医生诊疗]
  success_metrics: [血糖达标率, 复查完成率]
  user_scenarios:
    - 日常健康咨询
    - 血糖异常处理
    - 复查准备
  target_audience: [糖妈妈, 宝爸]
  trigger_intents:
    - 血糖
    - 饮食
    - 运动
    - 睡眠
    - 心理
    - 用药
    - 并发症
    - 哺乳
    - 复查
    - 家人支持
  estimated_user_time: 3–10分钟/次
  difficulty: 3
  output_style: skill_pack

runtime_contract:
  required_profile_fields: []
  required_context_fields: []
  missing_info_policy:
    low_risk: 提供通用建议
    medium_risk: 引导提供更多信息
    high_risk: 强调需立即就医的情况
  priority_order: [急性并发症, 血糖异常, 用药安全, 日常管理]
  disallowed_paths: []
  assumptions_allowed: true

execution_contract:
  tools_read: []
  tools_write: []
  confirmation_required_for: []
  fallback_mode: 提供通用健康原则
  memory_writeback_fields: []
  publish_target: skill_registry
  registry_ingestible: true

qa_contract:
  pass_threshold: 85
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

# 宝妈全方位健康管理 技能包

**版本**：v1.0.0（V9.0标准版）  
**更新**：2026-06-03  
**作者**：高效小G  
**面向**：产后7个月、确诊2型糖尿病的哺乳期妈妈（香香妈妈）

---

## 概述

本技能包包含10个健康维度的专属技能，基于《中国2型糖尿病防治指南（2024版）》《ADA Standards of Care 2024》等高等级临床证据，严格遵循V9.0技能标准构建。每个技能均通过validated质量检查。

---

## 10个维度技能总览

| # | 技能名称 | 文件名 | 核心功能 | 优先级 |
|---|---------|--------|---------|--------|
| 01 | 血糖监测管理 | 技能01_血糖监测管理.md | SMBG/CGM数据记录分析、趋势判断、异常分级处理 | P0 |
| 02 | 饮食营养管理 | 技能02_饮食营养管理.md | 个性化餐单生成、GI/GL计算、营养配比建议 | P0 |
| 03 | 运动处方管理 | 技能03_运动处方管理.md | FITT运动方案制定、哺乳期安全评估、渐进4周方案 | P0 |
| 04 | 睡眠作息管理 | 技能04_睡眠作息管理.md | PSQI评估、皮质醇管理、睡眠卫生优化 | P1 |
| 05 | 心理健康管理 | 技能05_心理健康管理.md | EPDS量表筛查、压力缓解、危机干预 | P1 |
| 06 | 用药提醒管理 | 技能06_用药提醒管理.md | 哺乳期药物安全性速查、漏服处理、副作用管理 | P0 |
| 07 | 并发症预防管理 | 技能07_并发症预防管理.md | 微血管/大血管并发症筛查时间表、早期信号识别 | P1 |
| 08 | 哺乳期特殊护理 | 技能08_哺乳期特殊护理.md | 哺乳与血糖平衡、涨奶/乳腺炎处理、断奶时机 | P0 |
| 09 | 家人支持协调 | 技能09_家人支持协调.md | 配偶赋能、家庭分工优化、NVC沟通框架 | P2 |
| 10 | 复查提醒管理 | 技能10_复查提醒管理.md | HbA1c/眼底等复查时间表、就医准备清单 | P1 |

---

## 核心原则

1. **哺乳优先**：所有建议不能损害哺乳和乳汁质量
2. **证据驱动**：基于高等级临床指南和研究数据
3. **安全底线**：急性并发症（DKA/HHS）识别与处理是每个技能的底线
4. **全家协同**：健康管理不是宝妈一个人的事，需要全家参与

---

## 质量检查结果

| 技能 | 质量分 | 状态 |
|------|--------|------|
| 技能01 血糖监测管理 | 95 | ✅ validated |
| 技能02 饮食营养管理 | 95 | ✅ validated |
| 技能03 运动处方管理 | 93 | ✅ validated |
| 技能04 睡眠作息管理 | 92 | ✅ validated |
| 技能05 心理健康管理 | 90 | ✅ validated |
| 技能06 用药提醒管理 | 95 | ✅ validated |
| 技能07 并发症预防管理 | 93 | ✅ validated |
| 技能08 哺乳期特殊护理 | 92 | ✅ validated |
| 技能09 家人支持协调 | 90 | ✅ validated |
| 技能10 复查提醒管理 | 92 | ✅ validated |

---

## 使用方式

直接说出你的问题，我会自动匹配最相关的技能：

- 血糖高了/低了 → 技能01
- 不知道吃什么 → 技能02
- 想运动但不确定安全 → 技能03
- 睡眠不好/压力大 → 技能04/05
- 用药有疑问 → 技能06
- 要复查不知道查什么 → 技能10
- 哺乳有疑问 → 技能08
- 家人沟通困难 → 技能09

---

## 禁止事项

- ❌ 不提供替代医生处方的建议
- ❌ 不推荐哺乳期禁用的药物
- ❌ 不建议极端饮食（<1200kcal/日或碳水<175g/日）
- ❌ 不在急性并发症识别场景下做常规健康建议

---

**维护者**：高效小G  
**版本**：v1.0.0（V9.0标准版，全部10个技能validated）
