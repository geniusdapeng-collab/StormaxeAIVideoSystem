---
name: Embedding向量检索
skill_id: ai_embedding
version: 1.0.0
last_updated: 2026-04-02

domain: AI技术通识
sub_domain: 技术基础
type: daily_practice
priority: P1

capabilities:
  tools: []
  output_formats:
    - markdown
    - 清单

retrieval_profile:
  logical_topics:
    - Embedding
    - 向量检索
    - 语义搜索
    - RAG
  aliases:
    - 向量
    - 语义检索
    - 知识库
  sample_queries:
    - Embedding是什么
    - 向量检索怎么用
    - RAG怎么实现

index_optimization:
  weighted_recall_text: Embedding 向量检索 语义搜索 RAG 知识库

quality_thresholds:
  accuracy: 89

author: 小G
tags:
  - Embedding
  - 向量检索
  - RAG

status: production

generation_spec:
  title: Embedding向量检索
  summary: 理解Embedding和向量检索技术原理
  core_goal: 应用于知识库和搜索
  difficulty: 2

qa_contract:
  pass_threshold: 85
---

## TL;DR

Embedding = 把文本转为向量 → 向量相似度 → 语义搜索

## 1. 核心概念

### Embedding
把文字/图片转为数字向量，让语义相似的内容在向量空间中也相近。

### 向量检索
在向量空间中找"最近"的内容，實現语义搜索。

### RAG
检索增强生成，结合知识库提升AI回答准确性。

## 2. 应用场景

| 场景 | 说明 |
|------|------|
| 知识库问答 | 让AI基于私有知识回答 |
| 语义搜索 | 更精准的搜索体验 |
| 推荐系统 | 基于内容相似推荐 |

## 3. 质量检查
✅ 质量分: 89

### 最终状态
**validated**
