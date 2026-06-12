# ScreenplayCraft — AI 短剧与 IP 剧本创作工作流系统

> **系统定位**：ScreenplayCraft 是 Seedance Pro 视频制作系统的上游剧本创作引擎，覆盖从概念构思到生产对接的全流程。支持竖屏 AI 短剧（9:16）、横屏短片（16:9）的创作，兼容原创 IP 构建与经典 IP 深度解析重构两种模式。
>
> **版本**：v1.0.0
> **对接版本**：Seedance Pro v1.3.0-Peng

## 快速开始

```bash
# 模式 A：原创
node orchestrator.js plan --title "大圣战机甲" --duration 180 --style "3D国漫CG,UnrealEngine5" --video-type action

# 模式 B：IP 重构
node orchestrator.js plan --mode ip --title "悟空前传" --source "西游记" --depth medium

# 模式 C：系列短剧
node orchestrator.js plan --mode series --title "九尾狐" --episodes 60 --aspect 9:16
```

## 架构

L1 概念层 → L2 叙事层 → L3 剧本层 → L4 生产层，配合 M1-M6 增强模块。

详见 `/home/gem/workspace/agent/skills/screenplay-craft/SKILL.md` 完整文档。
