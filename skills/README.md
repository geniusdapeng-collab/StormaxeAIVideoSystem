# Seedance Video Production System

> 从一句话到成片的全链路 AI 视频生产系统

**当前版本：v2.2.0-Peng** | 发布日期：2026-05-13

---

## 系统架构

```
输入：标题 + 大纲 + 时长 + 风格 + 视频类型
  │
  ▼
┌─────────────────────────────────────────────────┐
│  Phase 1  故事规划                                │
│  ├─ story-engine（5种视频类型模板）                 │
│  └─ screenplay-craft（4层架构剧本引擎）             │
│      ├─ L2: PersonaVault 角色灵魂铸造              │
│      └─ L3: VoiceCraft 声音铸造                   │
├─────────────────────────────────────────────────┤
│  Phase 2   角色锚定（character-manager）           │
├─────────────────────────────────────────────────┤
│  Phase 2.5 台词对白（dialogue-engine + TTS）      │
├─────────────────────────────────────────────────┤
│  Phase 3   分镜生成（shot-design）                 │
├─────────────────────────────────────────────────┤
│  Phase 3.5 微动作增强（MicroMotion）← 新增!        │
│  ├─ Face Sculptor  面部微表情                     │
│  ├─ Body Language  身体微动作                     │
│  ├─ Eye Director   眼神设计                       │
│  ├─ Breath Engine  呼吸节奏                       │
│  ├─ World Breath   环境呼吸                       │
│  └─ Merge          融合官                         │
├─────────────────────────────────────────────────┤
│  Phase 4   批量渲染（seedance-wrapper）            │
├─────────────────────────────────────────────────┤
│  Phase 5.5 声音设计（sound-design）               │
├─────────────────────────────────────────────────┤
│  Phase 6   后期合成（post-production）             │
├─────────────────────────────────────────────────┤
│  Phase 7   汇总交付                               │
└─────────────────────────────────────────────────┘
  │
  ▼
输出：完整视频 + 分镜脚本 + 声音方案 + 生产报告
```

## 三大子系统

### PersonaVault — 角色灵魂铸造（v1.0.0）
嵌入 ScreenplayCraft L2 叙事层，在 character-forge 之后运行。

- **Wound Miner** — 伤疤矿工：从角色背景提取创伤
- **Gravity Weaver** — 引力编织者：构建角色间引力关系
- **Empathy Engine** — 共情引擎：建立观众共情锚点
- **Evolution Tracker** — 演变追踪器：跟踪角色弧线
- **Mirror Engine** — 镜像引擎：角色互为镜像
- **Guardian** — 守护者：一致性校验

### VoiceCraft — 声音铸造（v1.0.0）
嵌入 ScreenplayCraft L3 剧本层，Voice State Bus 驱动。

- **Voice Miner** — 声音矿工：提取角色声纹
- **Subtext Weaver** — 潜台词编织者：字面之下
- **Dialogue Smith** — 台词铁匠：锻造对白
- **Lose Control Trigger** — 失控触发器：情绪爆发
- **Silence Architect** — 沉默建筑师：留白设计
- **Voice Guardian** — 声音守护者：一致性校验

### MicroMotion — 微动作增强渲染（v1.1.0）
嵌入 Director Phase3.5，在分镜生成后、渲染前运行。

- **Face Sculptor** — 面部雕塑师：7 种情绪 FACS 微表情
- **Body Language** — 身体语言：6 种姿态微动作
- **Eye Director** — 眼神导演：7 种眼神模式
- **Breath Engine** — 呼吸引擎：5 种呼吸节奏
- **World Breath** — 世界呼吸：9 种场景环境元素
- **Merge** — 融合官：景别权重分配 + 提示词合并

## 支持的视频类型

| 类型 | 说明 | 角色模板 |
|------|------|----------|
| action | 动作/战斗 | 战士/对手 |
| drama | 剧情/情感 | 主角/配角 |
| educational | 科普/教学 | 讲师/助手 |
| commercial | 商业/广告 | 主角/对手 |
| documentary | 纪录片 | 叙述者/专家 |

## 支持的运行模式

| 模式 | 说明 |
|------|------|
| story-engine | 快速模式，直接生成故事规划 |
| screenplay-craft | 剧本模式，4 层架构 + PersonaVault + VoiceCraft |

## 快速开始

```bash
# 基础用法
node director.js produce \
  --title "短片名" \
  --outline "故事大纲" \
  --duration 30 \
  --video-type action \
  --skip-render

# ScreenplayCraft 模式
node director.js produce \
  --title "短片名" \
  --outline "故事大纲" \
  --duration 60 \
  --video-type drama \
  --screenplay \
  --skip-render

# 真实渲染（去掉 --skip-render）
node director.js produce \
  --title "短片名" \
  --outline "故事大纲" \
  --duration 30 \
  --video-type action
```

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| --title | 是 | 短片标题 |
| --outline | 是 | 故事大纲 |
| --duration | 否 | 目标时长（秒），默认 30 |
| --video-type | 否 | 视频类型：action/drama/educational/commercial/documentary |
| --style | 否 | 视觉风格描述 |
| --characters | 否 | 角色列表（逗号分隔） |
| --screenplay | 否 | 启用 ScreenplayCraft 模式 |
| --skip-render | 否 | Mock 模式，不提交 Seedance 渲染 |

## 模块清单（10 个模块，41+ 脚本）

| # | 模块 | 版本 | 职责 |
|---|------|------|------|
| 1 | seedance-director | v2.2.0-Peng | 8 阶段流水线总指挥 |
| 2 | screenplay-craft | v3.0 | 4 层架构剧本引擎 |
| 3 | persona-vault | v1.0.0 | 角色灵魂铸造 |
| 4 | voice-craft | v1.0.0 | 声音铸造 |
| 5 | micro-motion | v1.1.0 | 微动作增强渲染 |
| 6 | seedance-story-engine | v2.1.0-Peng | 故事规划 |
| 7 | seedance-dialogue-engine | v2.0.0-Peng | 台词对白 + TTS |
| 8 | seedance-character-manager | v2.1.0-Peng | 角色锚定 |
| 9 | seedance-sound-design | v1.0.0 | 声音设计 |
| 10 | seedance-post-production | v1.1.0 | 后期合成 |

## Bug 修复记录

共 11 个 Bug 已修复，详见 `system-version.json` 的 `bugFixes` 字段。

## 测试覆盖

- 5 轮子系统独立 Mock 测试（MicroMotion）
- 5 轮集成 Mock 测试（全链路 + ScreenplayCraft）
- 合计 67+ 镜头零崩溃
