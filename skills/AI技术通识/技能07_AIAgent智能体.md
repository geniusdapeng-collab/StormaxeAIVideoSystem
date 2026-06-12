---
name: AI Agent智能体
skill_id: ai_agent
version: 1.0.0
last_updated: 2026-04-02

domain: AI技术通识
sub_domain: 应用
type: daily_practice
priority: P1

capabilities:
  tools: []
  output_formats:
    - markdown
    - 清单

retrieval_profile:
  logical_topics:
    - AI Agent
    - 智能体
    - Agent架构
    - 自主行动
  aliases:
    - AI Agent
    - 智能代理
  sample_queries:
    - 什么是AI Agent
    - Agent怎么设计

index_optimization:
  weighted_recall_text: AI Agent 智能体 Agent架构 自主行动 工具调用

quality_thresholds:
  accuracy: 88

author: 小G
tags:
  - AI Agent
  - 智能体

status: production

generation_spec:
  title: AI Agent智能体
  summary: 理解AI Agent的设计原理
  core_goal: 设计Agent产品
  difficulty: 2

qa_contract:
  pass_threshold: 85
---

## TL;DR

Agent = LLM + 工具 + 记忆 + 规划

## 1. Agent核心组成

| 组件 | 作用 |
|------|------|
| LLM | 理解+推理+决策 |
| 工具 | 扩展能力边界 |
| 记忆 | 保持上下文 |
| 规划 | 分解复杂任务 |

## 2. Agent类型

### 反应式
根据当前输入直接响应

### 规划式
先规划再执行

### 反思式
执行后反思改进

## 3. 质量检查
✅ 质量分: 88

### 最终状态
**validated**
