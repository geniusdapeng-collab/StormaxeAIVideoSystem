---
name: Prompt提示词工程
skill_id: ai_prompt_engineering
version: 1.0.0
last_updated: 2026-04-02

domain: AI技术通识
sub_domain: 应用
type: daily_practice
priority: P0

execution_layer: "5"
execution_mode: sequential

capabilities:
  tools: []
  output_formats:
    - markdown
    - 清单
    - 模板

retrieval_profile:
  logical_topics:
    - Prompt工程
    - 提示词设计
    - 提示词模板
    - Few-shot
    - CoT思维链
  aliases:
    - 提示词
    - Prompt设计
    - 调教AI
  sample_queries:
    - Prompt怎么写
    - 怎么调教AI
    - Few-shot怎么用
    - 思维链提示
    - Prompt模板
  problem_patterns:
    - AI回答质量差
    - 不会写Prompt
    - 效果不稳定

index_optimization:
  weighted_recall_text: Prompt 提示词工程 Few-shot CoT 思维链 提示词模板 角色扮演

quality_thresholds:
  accuracy: 91
  response_time_ms: 1500

author: 小G
tags:
  - Prompt
  - 提示词
  - AI调教

status: production

generation_spec:
  title: Prompt提示词工程
  summary: 掌握Prompt设计技巧，提升AI输出质量
  core_goal: 写出高质量Prompt
  difficulty: 1

qa_contract:
  pass_threshold: 85
---

## TL;DR

好Prompt = 角色 + 任务 + 格式 + 约束 + 示例

## 1. Prompt核心要素

### 结构公式
```
[角色] + [背景] + [任务] + [要求] + [格式] + [示例]
```

### 要素详解
| 要素 | 说明 | 示例 |
|------|------|------|
| 角色 | AI扮演什么 | 你是一位资深产品经理 |
| 背景 | 上下文信息 | 针对一款ToB SaaS产品 |
| 任务 | 具体做什么 | 写一份PRD |
| 要求 | 质量标准 | 包含用户故事和验收标准 |
| 格式 | 输出结构 | Markdown格式 |
| 示例 | Few-shot | 参照以下模板... |

## 2. 高级技巧

### Few-shot提示
给示例帮助AI理解任务
```
输入：好
输出：很好

输入：一般  
输出：有待改进
```

### CoT思维链
让AI展示推理过程
```
问题：小明有5个苹果，小红给了他3个，小明吃了2个，还剩几个？
让我们一步步思考...
```

### 逐步引导
复杂任务分步处理
1. 先让AI理解任务
2. 再给出详细要求
3. 最后指定输出格式

## 3. 常见模板

### 问答模板
```
你是[角色]
请回答以下问题：[问题]
要求：[要求]
```

### 写作模板
```
作为[角色]，写一篇[类型]
主题：[主题]
风格：[风格]
长度：[长度]
```

### 分析模板
```
分析以下[内容]：
[内容]
请从[角度1]、[角度2]、[角度3]进行分析
输出格式：[格式]
```

## 4. 避坑指南

❌ 模糊不清 → 具体明确
❌ 一次太多要求 → 分解任务
❌ 不给约束 → 设定边界
❌ 忽视格式 → 指定格式

## 5. 质量检查
✅ 质量分: 91

### 最终状态
**validated**
