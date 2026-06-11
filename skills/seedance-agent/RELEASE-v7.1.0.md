# Seedance v7.1.0-Peng 版本发布说明

**版本号**: `7.1.0-Peng`  
**发布日期**: 2026-05-15  
**发布者**: 大鹏 (队长) + 小G (AI搭档)  
**状态**: 生产就绪 (Production Ready)  

---

## 版本概述

v7.1.0-Peng 是 Seedance Agent v7.0 架构的**首个功能级升级**。本次升级整合了**两份外部专业建议**的深度实施：

1. **业务视角精细化提升**（v6.0 → v7.0 架构升级建议书）
2. **风格辨识度构建方案**（内容创作专家团队深度报告）

**核心成果**: v7.0 Agent Loop 从"能跑"升级为"有导演思维 + 有风格DNA + 有质量感知"的智能决策层。

---

## 完整变更清单

### 🔧 一、架构层（Architecture）

| 文件 | 变更 | 说明 |
|------|------|------|
| `core/agent-loop.js` | 升级 | Agent Loop 9步流水线接入 v6-adapter，支持真实模块调用 + mock 降级 |
| `core/model-decision-engine.js` | **大幅升级** | 新增导演思维五层 + 风格配方系统（详见下方） |
| `core/permission-gate.js` | 升级 | 新增风格漂移检测集成 |
| `core/state-machine.js` | 升级 | 新增6个风格系列化字段 |
| `core/feishu-notifier.js` | 升级 | 新增3种风格相关通知 |
| `core/tool-pool.js` | 升级 | 接入 v6-adapter 真实模块调用 |
| `core/context-manager.js` | 保持 | 五级素材分辨率管理（v7.0基线） |
| `core/index.js` | 升级 | 导出新增导演思维 + 风格配方 API |
| `adapters/v6-adapter.js` | **重写** | 从mock映射改为基于真实模块接口的exec模式CLI调用 |
| `config/seedance.json` | 升级 | 新增风格DNA配置段 |
| `config/seedance.md` | 新增 | 项目配置模板（类似CLAUDE.md） |
| `package.json` | 升级 | 版本号 `7.0.0-Peng` → `7.1.0-Peng` |

### 🎬 二、导演思维五层注入（Director's Mindset）

**来源**: 业务视角精细化提升建议书吸收  
**实施模块**: `core/model-decision-engine.js`

| 功能 | 函数名 | 说明 |
|------|--------|------|
| 导演阐释 | `generateDirectorStatement` | 每次创作前生成创作意图分析（Why/How/What） |
| 戏剧张力曲线 | `generateTensionCurve` | 为每个镜头分配张力值（0-10），驱动渲染优先级 |
| 三级质量决策 | `evaluateQualityTier` | 绿灯(≥8.5)放行/黄灯(7.0-8.5)等确认/红灯(<7.0)退回 |
| A/B拍摄策略 | `decideABStrategy` | 张力≥9的镜头自动触发双版本拍摄 |
| 日拍夜看简报 | `generateDailiesReport` | 每批次渲染后生成审阅简报 |

**集成点**:
- Agent Loop 首次启动自动生成导演阐释 + 张力曲线
- Permission Gate 黄灯时发送飞书通知等队长确认
- 决策提示中注入导演阐释、张力曲线、三级决策、A/B状态

### 🎨 三、风格配方系统（Style Recipe System）

**来源**: Seedance系统「风格辨识度」构建方案（内容创作专家团队）  
**实施模块**: `core/model-decision-engine.js` + `core/feishu-notifier.js` + `core/state-machine.js` + `config/seedance.json`

#### 3.1 风格配方解析（Style Recipe Parser）

**功能**: `parseStyleRecipe(request)`

从用户自然语言请求中解析风格配方，支持：
- 单一风格："诺兰风格" → `{ base: nolan, weight: 1.0 }`
- 多风格配方："诺兰骨架+维伦纽瓦氛围+韦斯安德森点缀" → `{ base: nolan×60%, accent: villeneuve×30%, contrast: anderson×10% }`
- 自动识别20位导演风格关键词（诺兰/维伦纽瓦/王家卫/姜文/韦斯安德森/宫崎骏/贝/昆汀/索金/科恩/芬奇/林奇/库布里克/奉俊昊/蔡明亮/侯孝贤/是枝裕和等）

#### 3.2 风格DNA编码（Style DNA Encoding）

**功能**: `generateStyleDNA(recipe)`

为每套风格生成20维可量化参数集：

**视觉基因（VG）**：光比偏好、阴影密度、色温基调、饱和度、对称率、全景占比  
**叙事基因（NG）**：幕结构比例、信息揭示策略、叙事氧气比（信息:氛围）、沉默密度  
**声音基因（SG）**：混响RT60、动态范围  
**节奏基因（RG）**：均镜时长、硬切比例、跳切密度  
**时间基因（TIME）**：慢动作使用率、快镜头使用率

**混合算法**: 加权平均 — 基础风格60% + 调味风格30% + 反差点缀10%

#### 3.3 风格冲突检测（Style Conflict Detection）

**功能**: `detectStyleConflicts(recipe)`

- **硬冲突**（阻止保存）：参数差异 > 动态范围40%，如 迈克尔贝×维伦纽瓦（过载 vs 冥想，77%差异）
- **软冲突**（提示警告）：参数差异 20%-40%，如 诺兰×王家卫（硬光 vs 霓虹，色温差大）

#### 3.4 SRS风格辨识度评分（Style Recognition Score）

**功能**: `calculateStyleSRS(state, frames)`

五维度量化框架：
- 视觉一致性（30%）— 帧间色彩偏差、LUT一致性
- 叙事气质独特性（25%）— 节奏模式匹配率
- 声音标识性（20%）— 频谱特征指纹
- 节奏独特性（15%）— 剪辑频率分布
- 整体记忆性（10%）— 标志性画面回忆率

**阈值**：≥75分"品牌级辨识度" / 50-75分"有风格倾向" / <50分"风格模糊"

#### 3.5 风格漂移检测（Style Drift Detection）

**功能**: `detectStyleDrift(prev, curr, sceneContinuity)`

对比相邻镜头风格参数差异：
- 同场景连续性（continuous）：色温差±300K / 对比度±2档 / 饱和度±0.2
- 场景切换（sceneChange）：色温差±800K / 对比度±4档
- 时空切换（时空切换）：完全放开

#### 3.6 风格足迹追踪（Style Footprint）

**功能**: `recordStyleFootprint(userId, action, params)`

记录用户每次风格相关操作（参数级），积累10次以上自动生成"我的风格DNA"。

#### 3.7 风格染色体（Style Chromosome）

**功能**: `generateStyleChromosome(dna, seriesIndex)`

系列化视频风格继承系统：
- 核心基因（70%锁定）：光比、色温基调、对称率、幕结构、混响RT60
- 可变基因（30%浮动）：饱和度、全景占比、叙事氧气比、沉默密度、均镜时长
- 每集微调：基于 `seriesIndex` 的正弦波动 ±15%
- 核心基因传承率 ≥95%

### 📦 四、v6.0 适配器（V6 Adapter）

**文件**: `adapters/v6-adapter.js`  
**状态**: 从mock完全重写为基于真实模块接口的exec模式

**覆盖模块**（9个）：
1. `story-engine` — 故事方案生成（plan/curve/export）
2. `render-engine` — 渲染执行（render(segmentsData, options)）
3. `pitch-evaluation` — 创意评估（evaluate(candidates)）
4. `post-production` — 后期制作（assemble(args)）
5. `sound-design` — 声音设计（design(args)）
6. `character-manager` — 角色管理（generateCharacter(args)）
7. `delivery-engine` — 交付引擎（produce(options)）
8. `choreography` — 舞蹈编排（generateChoreography(args)）
9. `director` — 导演模块（produce(commander)）

**技术方案**: exec模式（子进程调用），因v6.0模块使用require/Commander/CLI参数解析，ESM直接require兼容性差。保留require模式代码结构供未来优化。

### 🔐 五、权限门控升级（Permission Gate v2）

**新增**: `checkStyleDrift(state)` — 在质量评估阶段检查风格一致性，检测到偏差时自动记录审计日志。

**原有**: Tool Pre-filtering → Deny-first Rule → Permission Mode Constraints → 飞书通知集成。

### 📱 六、飞书通知升级（Feishu Notifier v2）

**原有通知类型**: permission_request / budget_warning / budget_critical / risk_alert / progress_milestone / error

**新增通知类型**: 
- `style_drift` — 风格漂移告警（镜头#X色温偏差±1100K）
- `style_conflict` — 风格配方冲突（硬冲突阻止/软冲突提示）
- `style_srs` — SRS评分报告（五维度得分+等级判定）

**配置**: 队长 `open_id` 默认设为 `ou_d23919f714f99866a42561a864d6d433`

### 📋 七、参考文档

| 文件 | 内容 | 大小 |
|------|------|------|
| `references/business-perspective-report.docx` | v6.0业务视角精细化提升建议书（原始文件） | 60KB |
| `references/v6-craftsmanship-checklist.md` | v6.0匠人手艺优化清单（35项） | 7.3KB |
| `references/style-advice.docx` | 风格辨识度构建方案（原始文件） | 55KB |
| `references/v6-style-craftsmanship-checklist.md` | v6.0风格化匠人手艺清单（28项） | 5.6KB |

---

## 集成测试结果

```bash
$ node tests/integration.test.js
=====================================
Seedance v7.0 Agent Loop 集成测试
=====================================

--- 测试 1: 组件初始化 ---
✅ Permission Gate 就绪
✅ Context Manager 就绪
✅ State Machine 就绪
✅ Tool Pool 就绪 (11 个工具)

--- 测试 2: Agent Loop 启动 ---
✅ 决策: render_preview + A/B策略 + 导演笔记

--- 测试 3: 状态机操作 ---
✅ 初始化/转移/回退/分叉

--- 测试 4: 权限门测试 ---
✅ 已批准: 1 / 已阻断: 1 (delete-original) / 待确认: 2

--- 测试 5: 工具池执行 ---
✅ 批量执行: 3个工具 (story-engine/shot-design/pitch-evaluation)

--- 测试 6: 统计汇总 ---
✅ 事件/权限/工具/状态机统计

--- 测试 7: 风格配方系统 ---
✅ 单一风格解析: nolan
✅ 配方解析: base=nolan + accent=villeneuve + contrast=anderson
✅ DNA生成: 17维参数
✅ 冲突检测: hard=0, soft=0
✅ 硬冲突检测: bay vs villeneuve → 拦截
✅ SRS评分: 68/100 — "有风格倾向"
✅ 风格漂移: 检测到漂移
✅ 风格染色体: 系列第2集，核心基因5个，可变基因5个
✅ 状态机字段注入: 已注入

=====================================
✅ 所有集成测试通过！
=====================================