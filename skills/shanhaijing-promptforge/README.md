# PromptForge 导演编排系统
## 定位：老系统的"导演大脑"，70分 → 90分

## 版本
v1.0-Peng (2026-06-03)

## 核心模块
- promptforge-orchestrator.js - 主编排器
- promptforge-director.js - 总导演（Stage 1: 理解）
- promptforge-writer.js - 首席编剧（Stage 2: 台词创作）
- promptforge-dp.js - 摄影指导（Stage 2: 镜头设计）
- promptforge-gatekeeper.js - 质量守门员（Stage 3: 质量检查）

## 调用子系统
- 神兽档案库: shanhaijing-beast-archive
- Nirath星球档案: shanhaijing-world-engine
- 导演风格库: style-selector
- 运镜库: shanhaijing-cinematography + fpv-cinematic-library
- 微表情库: shanhaijing-emotion-calculator
- 光影库: render-engine内部 / 待独立
- 台词库: shanhaijing-voice-craft
- 质量标准: shanhaijing-quality-oracle

## 集成方式
作为老系统Pipeline的后置处理模块，Stage 8之后插入Stage 9。