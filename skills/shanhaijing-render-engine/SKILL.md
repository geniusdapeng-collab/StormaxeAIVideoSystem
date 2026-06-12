# Seedance Render Engine — AI 视频渲染引擎

---
name: seedance-render-engine
license: MIT
description: Seedance视频渲染引擎。当用户需要"渲染视频""批量渲染镜头""AI视频生成""视频片段渲染""多镜头渲染"时激活。自动将分镜片段提交到 Seedance 2.0 API 进行渲染，支持 Multi-Shot 策略和单镜头切分，智能处理模型降级和配额管理。
compatibility: Requires Node.js 18+ and byted-ark-seedance-skill v2.0.1+.
metadata:
  author: volcengine/agentplan
  version: "9.2.0-Peng"
  status: "production-ready"
  releaseDate: "2026-05-14"
  changelog: "v5.3-Peng: P0级Bug修复 — 默认开启音频生成 + ffmpeg保留音频 + 删除外貌过滤逻辑"