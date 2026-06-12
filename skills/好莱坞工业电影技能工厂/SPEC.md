# 好莱坞工业电影技能工厂 / HOLLYWOOD SKILL FACTORY
## Hyperreal Studios — Professional Film Production Skills System

---

## 系统定位

本系统是**超现实工业公司（Hyperreal Studios）**的核心基础设施之一，定位为：
- **技能即专业人员**：每个技能等同于好莱坞某个工会岗位的虚拟专业人员
- **按需定制专项装备**：当遇到新问题，系统自动生成新技能（如卡梅隆为泰坦尼克号创制深海潜水器）
- **分支链路集成**：技能输出通过分支链路与主链路融合，保持主链路稳定性的同时扩展能力边界

---

## 核心架构

### 整体架构

```
用户输入（自然语言）
        ↓
  Skill Router（技能路由Agent）
        ↓
┌─────────────────────────────────────────┐
│           技能分支链路（Branch）         │
│                                         │
│  技能A输出 → 技能B输出 → 融合层         │
│  （专业中间产物）                         │
│  · Scene Card草案                        │
│  · Shot Card草案                         │
│  · 光影参数（Light Tier）                │
│  · 表演设计（微表情/走位）               │
│  · 色彩方案（Color Script）              │
│  · 声音事件表                           │
└─────────────────────────────────────────┘
        ↓ 融合
┌─────────────────────────────────────────┐
│          主链路（Main Pipeline）          │
│  27 Stage标准流程，稳定高效               │
│  不直接挂载技能，保持核心稳定性           │
└─────────────────────────────────────────┘
        ↓
   视频生成（Seedance）
```

### 技能×约束×分支集成方式

每个技能的输出是**专业中间产物**，不是直接Prompt：

| 技能 | 输出中间产物 | 对接主链路Stage |
|------|------------|----------------|
| DP-摄影指导 | Shot Card（镜头执行卡） | Stage 5→8 |
| Gaffer-灯光师 | Light Tier方案+光源参数 | Stage 8光影段 |
| Screenwriter-编剧 | Scene Card+剧本 | Stage 3→4 |
| Acting-Coach-表演指导 | 表演设计+微表情指令 | Stage 8表演段 |
| Colorist-调色师 | Color Script+ LUT方案 | Stage 14后期 |
| Sound-Designer | 声音事件表+混音策略 | Stage 14声音 |
| Character-Analysis | 7维角色分析报告 | Stage 6定妆照 |
| Director-Final-Review | 四维评估报告 | Stage 10审片 |

---

## 技能优先队列（50个核心技能）

### P0 — 立即构建（20个）

| 序号 | 技能ID | 名称 | 对应工会 | 核心输出 |
|------|--------|------|---------|---------|
| 01 | skill_dga_director | 导演 | DGA | 创意决策、Final Cut Authority |
| 02 | skill_dga_upm | 制片主任 | DGA | 预算管理、资源优化 |
| 03 | skill_dga_1st_ad | 第一副导演 | DGA | 27 Stage执行调度、拓扑排序 |
| 04 | skill_dga_2nd_ad | 第二副导演 | DGA | 角色数据库、道具追踪、连续性 |
| 05 | skill_wga_showrunner | 系列总监 | WGA | 跨集一致性、系列圣经 |
| 06 | skill_wga_screenwriter | 编剧 | WGA | StoryCraft三幕引擎 |
| 07 | skill_wga_story_editor | 故事编辑 | WGA | 概念→Logline→角色弧线 |
| 08 | skill_wga_polish | 对白润色 | WGA | 潜台词+韵律+口癖 |
| 09 | skill_sag_character_analysis | 角色分析 | SAG-AFTRA | 7维CT、表演蓝图 |
| 10 | skill_sag_acting_coach | 表演指导 | SAG-AFTRA | 情绪设计、微表情、走位 |
| 11 | skill_sag_portrait_guard | 定妆照守卫 | SAG-AFTRA | 4角度一致性验证 |
| 12 | skill_iatse_600_dp | 摄影指导 | IATSE 600 | 镜头语言、15种运镜原子 |
| 13 | skill_iatse_728_gaffer | 灯光师 | IATSE 728 | 30种光源、情绪-光源矩阵 |
| 14 | skill_iatse_700_editor | 剪辑师 | IATSE 700 | 节奏控制、匹配剪辑 |
| 15 | skill_iatse_695_sound | 声音设计 | IATSE 695 | 音景、Foley、配乐 |
| 16 | skill_iatse_800_production_designer | 美术指导 | IATSE 800 | 场景空间、色彩方案 |
| 17 | skill_colorist | 调色师 | 跨工会 | LUT管理、色彩和谐 |
| 18 | skill_vfx_supervisor | 特效总监 | IATSE | 粒子系统、场景延伸 |
| 19 | skill_qa_director_review | 导演终审 | 质量门控 | 四维评估75分生死线 |
| 20 | skill_creative_director | 创意总监 | 支撑系统 | 自然语言→参数翻译 |

### P1 — 第二批（20个）

| 序号 | 技能ID | 名称 | 对应 |
|------|--------|------|------|
| 21 | skill_iatse_80_grip | 摄影棚场工 | Local 80 |
| 22 | skill_sound_recorder | 现场录音 | IATSE 695分支 |
| 23 | skill_costume_designer | 服装设计 | IATSE 705 |
| 24 | skill_props_master | 道具师 | IATSE 44 |
| 25 | skill_art_director | 艺术指导 | IATSE 800分支 |
| 26 | skill_script_supervisor | 场记 | 跨工会 |
| 27 | skill_foley_artist | 拟音师 | 声音分支 |
| 28 | skill_music_composer | 配乐作曲 | 声音分支 |
| 29 | skill_stunt_coordinator | 特技协调 | SAG分支 |
| 30 | skill_casting_director | 选角指导 | SAG分支 |
| 31 | skill_location_manager | 外景经理 | DGA分支 |
| 32 | skill_continuity_clerk | 连续性管理员 | 剪辑分支 |
| 33 | skill_di_technician | 数字中间片技师 | 调色分支 |
| 34 | skill_compositor | 合成师 | VFX分支 |
| 35 | skill_motion_graphics | 动态图形 | 后期分支 |
| 36 | skill_color_correction | 色彩校正 | 调色分支 |
| 37 | skill_qa_mpaa_rating | MPAA分级审查 | 质量门控 |
| 38 | skill_qa_compliance | 合规审查 | 质量门控 |
| 39 | skill_skill_router | 技能路由 | 支撑系统 |
| 40 | skill_intent_parser | 意图解析 | 支撑系统 |

### P2 — 第三批（10个）

| 序号 | 技能ID | 名称 | 对应 |
|------|--------|------|------|
| 41 | skill_makeup_artist | 特效化妆 | SAG-AFTRA 706 |
| 42 | skill_hair_stylist | 发型设计 | SAG-AFTRA 706 |
| 43 | skill_set_decorator | 布景装饰 | IATSE 44 |
| 44 | skill_sfx_supervisor | 特效总监 | IATSE |
| 45 | skill_stunt_performer | 特技表演 | SAG-AFTRA |
| 46 | skill_adr_engineer | 自动对白替换 | 声音分支 |
| 47 | skill_boom_operator | 话筒员 | IATSE 695 |
| 48 | skill_focus_puller | 调焦员 | IATSE 600 |
| 49 | skill_data_wrangler | 数据管理员 | 技术支撑 |
| 50 | skill_render_engineer | 渲染工程师 | 技术支撑 |

---

## 按需定制工作流（On-Demand Skill Generation）

```
用户新问题输入
        ↓
  技能缺失识别（Skill Router检测）
        ↓
  Skill Forge（技能锻造引擎）
    输入：
      - 问题描述
      - v4.1规范约束包
      - 已有技能模板
    过程：
      - 问题域分解
      - 专业知识注入
      - 约束合规验证
    输出：
      - 新技能MD文件（V9.0标准）
        ↓
  分支验证（test-render）
        ↓
  评估通过？
   ↙      ↘
  是        否→退回重锻造→Skill Forge
  ↓
  技能库注册（Skill Router更新声明式描述）
        ↓
  纳入主链路使用
```

---

## 约束体系（v4.1规范）

所有技能必须遵守SHANHAISTORY FORGE v4.1规范：

### Scene Card规范
- 场次编号、功能、目标、情绪曲线必填
- 场次光线总策略（Light Tier A/B/C/D）
- 场次色彩策略（Color Script）
- 轴线设定与屏幕方向规则

### Shot Card规范
- 叙事目的必须单一
- 第一视觉重点唯一
- 起幅锚点(OFA)和落幅锚点(EFA)必填
- 连续性模式：strict/soft/none

### Prompt规范
- 主体与绑定前置
- 关键信息80-120字内
- 遵循「主体→动作→环境→镜头→风格→约束」结构
- 长度控制：简单镜120-220字符，标准镜220-420字符，Hero Shot 320-520字符

### 质量门控
- 四维评估：运镜(20)/光影(20)/空间(25)/情绪(25)
- 75分生死线
- 五维成片评分：可读性25%/可控性20%/可剪性20%/情绪命中率20%/记忆点15%

---

## 分支链路集成规范

### 融合层工作流

```
分支技能输出（中间产物）
        ↓
  格式标准化（统一为中间产物Schema）
        ↓
  冲突检测（与主链路已有内容）
        ↓
  融合决策
  - 无冲突：直接合并
  - 有冲突：提给Creative Director裁定
        ↓
  主链路输入适配（转换为主链路Stage格式）
        ↓
  注入主链路（Stage 5/8/14等接入点）
```

### 主链路保护原则
- 主链路27 Stage永不直接挂载技能
- 分支验证失败的技能不影响主链路
- 融合层保证主链路产出稳定性

---

## 技能文件格式（V9.0标准）

```yaml
---
name: 技能名称
skill_id: skill_xxx_xxx
version: 1.0.0
last_updated: YYYY-MM-DD

## 技能概述
[角色定位、解决的问题]

## 核心能力
1. [能力1]
2. [能力2]
3. [能力3]

## 专业知识库
[该技能掌握的专业知识、数据、表格、规则]

## 决策逻辑
[在什么情况下做什么决策的规则]

## 输出中间产物
[输出的格式、内容、标准]

## 与主链路对接
[对接哪个Stage、输出什么格式]

## v4.1约束遵循
[必须遵循的规范条目]

## 版本历史
- 1.0.0 (YYYY-MM-DD): 初始版本
```

---

## 与Seedance视频系统集成

### 集成方式
技能输出 → 融合层 → 主链路Stage → Seedance Prompt

### Prompt工程阶段注入
- DP技能输出 → 镜头语言段
- Gaffer技能输出 → 光影段
- Acting Coach技能输出 → 表演设计段
- Screenwriter技能输出 → 叙事结构段

### 专业预处理
- Scene Card在Stage 3输出
- Shot Card在Stage 5输出
- Color Script在Stage 14前输出
- 声音事件表在Stage 14使用

---

## 核心文件清单

```
好莱坞工业电影技能工厂/
├── SPEC.md                          # 本文件
├── SKILL.md                         # 技能包总览
├── README.md                        # 使用说明
├── v4.1规范摘要.md                  # SHANHAISTORY FORGE v4.1核心规范摘要
├── 按需定制流程.md                  # Skill Forge工作流说明
├── 融合层设计.md                    # 分支链路与主链路融合规范
├── 技能系列/
│   ├── DGA导演工会系列/             # 4个技能
│   │   ├── 技能01_导演.md
│   │   ├── 技能02_制片主任.md
│   │   ├── 技能03_第一副导演.md
│   │   └── 技能04_第二副导演.md
│   ├── WGA编剧工会系列/             # 4个技能
│   ├── SAG-AFTRA演员工会系列/       # 3个技能
│   ├── IATSE技术工会系列/           # 7个技能
│   ├── 质量门控系列/                # 3个技能
│   └── 支撑系统系列/                # 3个技能
└── 工具/
    ├── skill_forge.py               # 技能锻造引擎
    ├── skill_router.py              # 技能路由
    └── fusion_layer.py              # 融合层
```

---

**编制日期**：2026-06-04
**版本**：v1.0.0
**依据**：超现实工业公司融合蓝图v4.0 + SHANHAISTORY FORGE v4.1
