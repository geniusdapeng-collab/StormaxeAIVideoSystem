---
name: seedance-character-manager
license: MIT
description: 角色资产管理技能。为Seedance 2.0视频生成提供角色一致性保障，支持生成多角度角色参考图、管理角色资产库、自动匹配镜头参考图。当用户需要"确保角色一致""生成角色参考图""角色资产""多角度角色图""锁定角色外貌"时激活。
compatibility: Requires Node.js 18+ and access to image generation API (Seedream/Doubao/Midjourney).
metadata:
  author: volcengine/agentplan
  version: "9.2.0-Peng"
  category: ai/video-production
---

# Seedance Character Manager

## 概述

**角色资产管理技能** — 解决多镜头短片中角色一致性的核心痛点。

当3分钟短片需要18个镜头时，每个镜头的角色必须长得完全一样。本技能提供：
- ✅ **多角度角色参考图生成** — 正面/侧面/背面/表情/动作姿态
- ✅ **角色资产库管理** — 编号、命名、路径、元数据
- ✅ **自动镜头匹配** — 根据镜头需求自动选取最合适的参考图
- ✅ **一致性校验** — 提交前检查角色描述是否符合资产库定义

---

## 触发条件

用户说以下关键词时自动激活：
- 确保角色一致、角色参考图、角色资产
- 多角度角色图、锁定角色外貌、角色设定
- 人物一致性、角色库、角色管理

---

## 🚀 核心命令

### 1. 生成角色资产包 (`generate`)

为每个角色生成标准多角度参考图：