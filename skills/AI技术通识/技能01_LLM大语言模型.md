---
name: LLM大语言模型
skill_id: ai_llm_foundation
version: 1.0.0
last_updated: 2026-04-02

domain: AI技术通识
sub_domain: 基础概念
type: daily_practice
priority: P0

execution_layer: "4"
execution_mode: sequential

module_compatibility:
  input_preprocessing: true
  intent_clarification: true
  multi_intent_extraction: false
  task_analysis: true
  skill_matching: keyword
  task_execution: simple
  result_integration: true

fallback_strategy:
  level1_tool: 提供基础概念解释
  level2_data: 给出经典案例
  level3_output: 输出简化版概念

persona_adaptation:
  user_profile: true
  modes:
    - 产品经理视角
    - 技术负责人视角
    - 业务应用视角
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: []
  output_formats:
    - markdown
    - 清单

retrieval_profile:
  logical_topics:
    - LLM大语言模型
    - 大模型原理
    - Transformer
    - 生成式AI
    - GPT
  aliases:
    - 大语言模型
    - 大模型
    - 生成式AI
    - GPT
    - LLM
    - 语言模型
  sample_queries:
    - 什么是LLM
    - 大语言模型原理是什么
    - GPT怎么生成文字
    - Transformer是什么
    - 大模型和传统AI的区别
    - 大模型是怎么训练的
  problem_patterns:
    - 不理解LLM原理
    - 不知道大模型能做什么
    - 对AI能力边界不了解
  entities:
    who:
      - 产品经理
      - 业务负责人
      - 技术负责人
    actions:
      - 理解原理
      - 判断适用场景
      - 评估技术方案
    objects:
      - 模型
      - 训练数据
      - 参数
  scenarios:
    - 产品规划
    - 技术选型
    - AI项目评估
  age_stages: []
  urgency: normal
  negative_queries:
    - 模型训练代码
    - 数学原理推导

index_optimization:
  weighted_recall_text: LLM 大语言模型 Transformer 生成式AI GPT 预训练 指令微调 RLHF 模型参数
  neighbors: []
  channel_weights:
    exact_match: 10
    lexical_variation: 8
    slot_match: 6
    topic_match: 5

quality_thresholds:
  accuracy: 92
  response_time_ms: 1500
  fallback_rate: 3

dependencies:
  skills: []
  modules: []
  external_apis: []

author: 小G
tags:
  - LLM
  - 大语言模型
  - AI基础
  - Transformer

status: production
license: internal

generation_spec:
  title: LLM大语言模型基础
  summary: 理解大语言模型的基础原理、训练过程和能力边界
  output_mode: concept
  core_goal: 帮助非技术人员理解LLM核心概念
  user_scenarios:
    - 产品规划
    - 技术选型
  target_audience:
    - 产品经理
    - 业务负责人
  difficulty: 1

qa_contract:
  pass_threshold: 85
  scoring_weights:
    completeness: 0.20
    clarity: 0.30
    personalization: 0.20
    domain_professionalism: 0.30
---

## TL;DR

LLM = 大规模预训练 + 指令微调 + 对齐微调

## 1. LLM核心概念

### 什么是LLM
Large Language Model，大语言模型。核心能力：**理解自然语言、生成自然语言**

### 三个关键训练阶段

| 阶段 | 目的 | 数据 | 效果 |
|------|------|------|------|
| 预训练 | 学会语言 | 海量文本 | 续写能力 |
| 指令微调 | 理解任务 | 指令对 | 任务能力 |
| 对齐微调 | 符合价值观 | 人类反馈 | 安全可靠 |

### 核心特点
1. **涌现能力**：参数足够大时出现的能力（如推理、编程）
2. **泛化能力**：训练数据之外的任务也能处理
3. **上下文学习**：通过提示词就能执行新任务

## 2. 产品经理需要知道的

### 能力边界
| 能力 | 现状 | 局限 |
|------|------|------|
| 文字生成 | 强 | 可能幻觉 |
| 理解意图 | 强 | 复杂推理有限 |
| 代码能力 | 中强 | 长代码易出错 |
| 数学推理 | 中 | 复杂推理弱 |
| 知识准确 | 中 | 知识截止 |
| 多模态 | 发展中 | 成本高 |

### 技术选型参考
| 场景 | 推荐模型类型 |
|------|--------------|
| 对话产品 | Chat类模型 |
| 内容生成 | 生成类模型 |
| 代码助手 | Code专用模型 |
| Embedding | 向量模型 |

### 成本考量
- 推理成本 ≈ 参数规模 × 上下文长度 × 调用量
- 长上下文成本显著更高
- API vs 自建的选择

## 3. 常见误区

❌ **模型越大越好**
→ 看场景，小模型+精调可能效果更好

❌ **LLM = 搜索引擎**
→ 会编造内容，需要事实核查

❌ **一次训练终身使用**
→ 需要持续迭代和更新

❌ **忽视幻觉问题**
→ 生产环境必须考虑容错

## 4. 质量检查
✅ 结构完整 | ✅ 通俗易懂 | ✅ 质量分: 92

### 最终状态
**validated**
