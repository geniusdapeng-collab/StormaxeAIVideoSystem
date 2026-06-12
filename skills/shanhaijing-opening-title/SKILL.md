# 片头制作系统 v3.0-Peng — SKILL.md

**系统名称**: 山海经片头制作系统（Shanhaijing Opening Title System）
**版本**: v3.0-Peng
**适用平台**: ShanhaiStory Forge v2.3-Peng+
**适用范围**: 山海经系列 / 通用视频系列 片头制作

---

## 触发条件

当用户需要以下功能时激活本技能：
- "片头" / "opening title" / "标题"
- "片头制作" / "开场"
- "标题动画" / "title animation"
- 剧集需要片头镜头（如九尾狐片头、烛龙片头等）

---

## 系统概述

### 设计目标

打造**超越参考方案**的片头制作能力：

- **Nirath深度适配** — 所有材质/场景与Nirath原创世界观绑定
- **角色一致性保障** — 强制注入小G定妆照锚定
- **合规自动注入** — CG声明自动附加
- **异兽档案联动** — 从档案自动读取外观/栖息地
- **导演管线集成** — Stage 0 自动调用

### 核心能力

| 模块 | 功能 | 数量 |
|------|------|------|
| Nirath材质适配器 | 物理材质约束 | 7种 |
| 动效库 | 标题呈现方式 | 6大类20种 |
| 出品人模块 | 出品人信息显示 | 7种 |

### 设计哲学

**站在巨人肩膀，成为新的巨人**：
1. 吸收参考方案「质感引擎+动效库+出品人模块」框架
2. 注入Nirath世界观专属参数
3. 强制角色一致性 + 合规声明
4. 与导演管线深度集成

---

## 系统架构

```
skills/shanhaijing-opening-title/
├── opening-title-system-v3.js      # 集成模块（入口）
├── nirath-material-adapter.js      # Nirath材质适配器
├── title-animation-library-v3.js   # 动效库（增强版）
├── title-producer-module-v3.js     # 出品人模块（增强版）
├── SKILL.md                          # 本文档
└── ANALYSIS-v3.0-Peng.md            # 分析报告
```

---

## 快速使用

### 方式1：导演管线自动调用（推荐）

```javascript
// 在 DirectorPipeline.run() 中自动调用 Stage 0
const pipeline = new DirectorPipeline({
  includeOpeningTitle: true,  // 自动启用片头
  beastId: 'jiuweihu',
  titleText: 'THE NINE-TAILED FOX: LABYRINTH'
});
```

### 方式2：独立调用

```javascript
const { generateOpeningForBeast } = require('./opening-title-system-v3');

// 一键生成
const result = generateOpeningForBeast('jiuweihu', 'THE NINE-TAILED FOX', {
  duration: 9,
  hasXiaoG: true,
  producerText: 'by genius'
});

console.log(result.prompt);        // 完整Prompt
console.log(result.lengthCheck);   // 字数检查
console.log(result.auditInfo);     // 审计信息
```

### 方式3：高级自定义

```javascript
const { generateTitlePrompt } = require('./opening-title-system-v3');

const result = generateTitlePrompt({
  titleText: 'THE NINE-TAILED FOX: LABYRINTH',
  producerText: 'by genius',
  animationType: 'beastInteraction',
  animationVariant: 'beast_run_through',
  producerMode: 'waterReflection',
  materials: [
    { type: 'fur', variant: 'nineTailedFox' },
    { type: 'flame', variant: 'nineTailedFlame' },
    { type: 'water', variant: 'waterfall' },
    { type: 'bioluminescent', variant: 'moss' },
    { type: 'rock', variant: 'basalt' }
  ],
  scene: '九座悬浮岛屿青丘群岛...',  // 或留空自动从异兽ID生成
  beastId: 'jiuweihu',               // 自动推荐材质和动效
  duration: 9,
  hasXiaoG: true
});
```

---

## API参考

### `generateTitlePrompt(config)`

生成完整片头Prompt。

**参数**:
- `titleText` (string): 英文标题
- `producerText` (string): 出品人文字
- `animationType` (string): 动效类型
- `animationVariant` (string): 动效变体
- `producerMode` (string): 出品人显示方式
- `materials` (Array): 材质列表 `[{type, variant}]`
- `scene` (string): 场景描述（可选，会自动生成）
- `beastId` (string): 异兽ID（用于自动推荐）
- `duration` (number): 片头时长（秒）
- `hasXiaoG` (boolean): 是否包含小G角色

**返回**:
- `prompt` (string): 完整Prompt
- `lengthCheck` (Object): 字数检查 `{current, target, max, status}`
- `modules` (Object): 模块状态 `{material, animation, producer}`
- `auditInfo` (Object): 审计信息

### `generateOpeningForBeast(beastId, titleText, options)`

一键生成片头（基于异兽ID）。

**参数**:
- `beastId` (string): 异兽ID
- `titleText` (string): 英文标题
- `options` (Object): 可选配置

**返回**: 同 `generateTitlePrompt`

### `getSystemCapabilities()`

获取系统能力概览。

---

## 材质类型

| 类型 | Nirath专属名称 | 适用场景 |
|------|---------------|---------|
| fur | 极光毛发 | 九尾狐、白泽 |
| flame | 磁场等离子体火焰 | 烛龙、九尾狐 |
| water | 流光虹脉水体 | 虹脉瀑布、银汞湖泊 |
| rock | Nirath地质 | 浮空晶簇、黑曜石柱 |
| bioluminescent | Nirath原生荧光 | 光脉苔藓、虹彩孢子 |
| metal | Nirath生物金属 | 银色树木、陨铁 |
| atmosphere | Nirath体积大气 | 双星晨雾、极光 |

---

## 动效类型

| 类型 | 说明 | 变体数 |
|------|------|--------|
| beastInteraction | 异兽互动型 | 3种 |
| environmentFusion | 环境融合型 | 5种 |
| physicalDestruction | 物理破坏型 | 2种 |
| lightMagic | 光影魔术型 | 2种 |
| magneticEffect | Nirath磁场动效 | 2种 |
| xiaoGInteraction | 小G角色互动型 | 2种 |

---

## 出品人方式

| 方式 | 说明 | Nirath增强 |
|------|------|-----------|
| waterReflection | 虹脉水面倒影 | 虹彩边缘 |
| rockCarving | 浮空岩石刻痕 | 荧光闪烁 |
| lightParticles | 虹彩光粒子排列 | 磁场螺旋轨迹 |
| mistFormation | 双星雾气形成 | 丁达尔效应 |
| metalPlate | 生物金属铭牌 | 独特纹理 |
| xiaoGHandwriting | 小G探险者笔记 | Nirath地图 |
| magneticPlate | 磁场能量铭牌 | 能量流动 |

---

## 与导演管线集成

片头系统作为 **Stage 0** 集成到导演管线：

```
Stage 0: 片头设计（新增）
  └── 生成片头Prompt
  └── 保存到 00-opening/
  └── 审计日志记录

Stage 1: PRD生成
Stage 2: 需求对齐
...
```

集成方式:
```javascript
// 在 director-pipeline.js 中
async stage0_OpeningTitleDesign() {
  const { stage0_OpeningTitleDesign } = require('../shanhaijing-opening-title/opening-title-system-v3');
  const result = await stage0_OpeningTitleDesign({
    beastId: this.beastId,
    titleText: this.titleText,
    openingDuration: this.options.openingDuration || 9
  });
  
  this.results.openingTitle = result;
  this._writeAuditLog('stage0_complete', { promptLength: result.lengthCheck.current });
}
```

---

## 升级记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-05-24 | 基础片头模板（参考方案） |
| v2.0 | 2026-05-24 | 质感引擎+动效库+出品人模块（参考方案） |
| v3.0-Peng | 2026-05-24 | **历史性升级**：Nirath适配+角色锚定+合规注入+异兽联动+导演集成 |

---

## 联系与反馈

**系统作者**: 小G（AI助手）
**审核人**: 队长（李大鹏）
**所属项目**: ShanhaiStory Forge v2.3-Peng+

---

*文档版本: v3.0-Peng*
*生成时间: 2026-05-24*