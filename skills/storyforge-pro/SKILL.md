# StoryForge Pro v4.0-Peng — 剧本创作系统
# Seedance Pro 视频制作系统的上游剧本引擎

## 系统定位
StoryForge Pro 是 Seedance Pro 视频制作体系的**上游剧本创作引擎**，覆盖从创意构思到视频渲染对接的完整闭环。

v4.0-Peng 重大升级：新增 **Seedance 视频渲染 Pipeline 桥接**，剧本产出可直接对接 Seedance Director 完成视频渲染与后期制作。

## 核心架构
```
用户输入 → Fillers → Story Universe → Renderers → 多视图输出
                                    ↓
                         Seedance Bridge → Director → 视频渲染 → 后期成片
```

## 三种模式
- **原创模式**: 从零构建世界观和故事
- **IP重构模式**: 解析经典作品，提取精神内核
- **系列短剧模式**: 10-100集系列，含卡点/钩子/奇观

## 技能目录

### L1 概念层
- `theme-extractor` — 主题提炼引擎
- `world-builder` — 世界观架构
- `ip-deconstructor` — IP解析重构（M6）

### L2 叙事层
- `structure-engine` — 结构引擎
- `character-forge` — 角色锻造炉
- `plot-weaver` — 情节编织器

### L3 剧本层
- `scene-writer` — 场景书写器
- `dialogue-master` — 对白大师
- `cinematography-planner` — 镜头预规划器

### L4 生产层
- `continuity-checker` — 连续性检查器

### 增强模块
- `m1-vertical-engine` — 竖屏引擎
- `m2-paywall-engine` — 卡点工程
- `m3-hook-factory` — 钩子工厂
- `m4-series-arc` — 系列化架构
- `m5-spectacle-designer` — 奇观设计

### 嵌入式子系统
- **PersonaVault** v1.0-Peng — 角色灵魂铸造（6 Agent + State Bus）
- **VoiceCraft** v1.0-Peng — 声音铸造（6 Agent + Voice State Bus）

### 渲染器
- `script-renderer` — 剧本视图
- `video-renderer` — 视频视图
- `audio-renderer` — 音频视图

### Seedance Pipeline 桥接（v4.0-Peng 新增）
- `seedance-bridge.js` — StoryForge → Seedance Director 格式转换
  - 自动提取角色/大纲/风格/时长
  - 生成 Director 命令行参数
  - 一键调用渲染 Pipeline

## 命令
```bash
# 原创模式
node orchestrator.js create --title "作品名" --concept "概念"

# IP重构模式
node orchestrator.js adapt --source "西游记" --essence "反抗权威"

# 系列短剧模式
node orchestrator.js series --title "作品名" --episodes 10

# Seedance Pipeline（剧本→视频渲染）
node seedance-bridge.js --storyforge-dir "/tmp/round-1" --output-dir "/tmp/production"
```

## 完整 Pipeline
```
1. StoryForge Pro 生成剧本
   → story-universe.json / screenplay.json

2. Seedance Bridge 转换格式
   → 提取角色/大纲/风格/时长
   → 生成 director 输入参数

3. Seedance Director 渲染
   → story-engine → character-manager → shot-design → seedance-wrapper
   → 并行渲染所有镜头

4. Post-Production 后期
   → 拼接 / 调色 / 字幕 / 音画合成
   → 输出成片
```

## 依赖
- Node.js ≥ 18
- seedance-director ≥ v4.0-Peng
- byted-ark-seedance-skill ≥ v2.0.1
- seedance-post-production ≥ v4.0-Peng

---
*版本: v4.0-Peng*
*整合: ScreenplayCraft v2.0 + StoryForge Pro v4.0 + PersonaVault v1.0 + VoiceCraft v1.0*
*Seedance Pipeline: 剧本→渲染→成片 完整闭环*