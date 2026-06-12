---
name: byted-ark-seedance-skill
license: MIT
description: 豆包 Seedance AI 视频生成 Skill。支持文生视频、图生视频、参考视频/音频生成、首尾帧控制。当用户说"生视频"、"生成视频"、"seedance"、"做个视频"时激活。火山方舟 Agent Plan 专属版本。
compatibility: Requires Node.js 18+ and network access to VolcEngine Ark API.
metadata:
  author: volcengine/agentplan
  version: "2.0.1"
  category: ai/video-generation
---

# Ark AgentPlan Seedance Skill

## 概述

豆包 Seedance AI 视频生成 Skill - **火山方舟 Agent Plan 专属版本**。

✨ **核心优势：**
- ✅ **零依赖可用** - 无需安装 SQLite 等第三方包，自动检测平台配置获取 API Key。
- ✅ **调用原生接口** - 使用 `/api/plan/v3` 网关，与语言模型共用服务入口。
- ✅ **智能意图识别** - 自动根据 prompt 分配 `2.0`, `2.0 fast`, `1.5 pro` 模型。
- ✅ **原生异步推送** - 结合 `.pending-tasks.json` 与 Agent 框架 Cron 机制实现完成后主动通知。

## 触发条件

用户说以下关键词时自动激活：
- 生视频、生成视频、视频生成
- seedance
- 给我做个视频、做个视频

---

## 🚀 核心命令与用法

### 1. 提交视频任务 (`create`)

在对话中识别到生成需求时，调用此命令（命令瞬间返回，不阻塞对话）：