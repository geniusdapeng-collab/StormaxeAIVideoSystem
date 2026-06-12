---
name: AI Fine-tuning微调
skill_id: ai_finetuning
version: 1.0.0
last_updated: 2026-04-02

domain: AI技术通识
sub_domain: 技术
type: daily_practice
priority: P2

capabilities:
  tools: []
  output_formats:
    - markdown
    - 清单

retrieval_profile:
  logical_topics:
    - Fine-tuning
    - 模型微调
    - 训练数据
    - 迁移学习
  aliases:
    - 微调
    - 模型训练
  sample_queries:
    - 什么时候需要微调
    - 微调怎么做

index_optimization:
  weighted_recall_text: Fine-tuning 微调 迁移学习 模型训练

quality_thresholds:
  accuracy: 87

author: 小G
tags:
  - 微调
  - Fine-tuning

status: production

generation_spec:
  title: AI Fine-tuning微调
  summary: 理解模型微调技术
  core_goal: 判断是否需要微调
  difficulty: 2

qa_contract:
  pass_threshold: 85
---

## TL;DR

微调 = 在预训练模型基础上，用特定数据继续训练

## 1. 何时微调

### 适用场景
- 特定领域知识
- 特定任务风格
- 私有数据需求

### 不适用
- 通用能力已满足
- 数据量不够
- 成本敏感

## 2. 微调方式

| 方式 | 数据量 | 成本 | 效果 |
|------|--------|------|------|
| 全参数 | 万级 | 高 | 好 |
| LoRA | 千级 | 中 | 较好 |
| Prompt | 百级 | 低 | 一般 |

## 3. 质量检查
✅ 质量分: 87

### 最终状态
**validated**
