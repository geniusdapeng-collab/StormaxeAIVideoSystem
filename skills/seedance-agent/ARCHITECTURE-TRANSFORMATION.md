# Seedance → Claude Code 架构改造蓝图

> **目标**：将 Seedance v6.0-Peng 从「流水线脚本系统」升级为「Agent 驱动的视频生成工作流系统」——视频生成行业的 Claude Code。
>
> **原则**：渐进改造，保持现有核心能力不变，先注入 Agent 灵魂，再逐步替换。

---

## 一、现有架构诊断

### Seedance v6.0-Peng 现状