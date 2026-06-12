# Nirath栖息地标准化系统 v1.1-Peng 发布文档

**发布时间**: 2026-05-24 00:50  
**大系统版本**: ShanhaiStory Forge v2.2-Peng  
**版本号**: Beast Archive v1.1-Peng / Beast Engine v1.1-Peng / Beast Integration v1.1-Peng

---

## 发布动机

大鹏指令："这不是要把这个case修好，而是机制上的薄弱环节需要优化强化。"

**问题根因**：
- 九尾狐Prompt使用通用模板（浮空晶簇+流光虹脉河）
- 而非Nirath Bible的S03青丘灵原专属描述（蓝绿色高草/孢子水母/银汞湖泊）

**诊断发现**：
1. 40只神兽都有 `nirath.habitat`，但Prompt注入器未调用
2. 很多神兽 `location` 为空或描述性文字，无法关键词匹配
3. 档案数据与Nirath Bible十大生态区**没有建立映射关系**
4. 新增神兽时**不会自动关联**Nirath环境

---

## 核心设计：多路召回机制

```
神兽名称 → 路1标准化系统 → 路2档案字段 → 路3知识库推断 → 路4通用回退
```

**路1（最高优先级）**: `beast-habitat-standardizer.js` — 40只神兽→十大生态区映射  
**路2（辅助参考）**: `archive.autoHabitat` — 档案中的自动推断字段（可选）  
**路3（向后兼容）**: `archive.nirath.habitat` — 档案原有字段（描述推断）  
**路4（保底）**: 通用Nirath描述（所有神兽保底）

**关键约束**：
- 档案中有栖息地，就拿来做辅助参考 ✅
- 没有也无所谓，标准化系统会兜底 ✅
- 新增非山海经神兽，知识库自动推断 ✅
- 完全开放式的能力，不依赖任何固定字段 ✅

---

## 新增文件

### 1. `beast-habitat-standardizer.js` — 栖息地标准化系统

**功能**：
- 40只神兽 → Nirath十大生态区完整映射
- 每个生态区有紧凑版Prompt（60-80字）
- 基于神兽种类知识映射（九尾狐→青丘，烛龙→汤谷）
- 新增神兽自动从知识库匹配

**十大生态区**：
| 生态区ID | 名称 | 代表神兽 |
|---------|------|---------|
| azure-hills-spirit-plain | 青丘灵原 | 九尾狐、鹿蜀 |
| abyssal-luminara | 归墟之海 | 鲲鹏、文鳐鱼 |
| broken-axis-peaks | 不周山脉 | 饕餮、梼杌 |
| subterranean-styx | 幽冥地下海 | 混沌 |
| solar-cradle-fusang | 汤谷扶桑 | 烛龙、应龙 |
| kunlun-sky-continent | 昆仑悬境 | — |
| plain-zhulu | 涿鹿战场 | 穷奇 |
| archipelago-penglai | 蓬莱迷雾 | — |
| astrop-gate-nexus | 星门祭坛 | — |
| spine-pangu | 盘古之脊 | — |

### 2. `jiuweihu-standard-prompt-v2.2-Peng.md` — 九尾狐标准Prompt

**Prompt示例**（105字）：
> 九尾狐的外形以狐狸为基础，却又处处彰显着超越凡俗的神性，Nirath青丘灵原，蓝绿色高草如海浪起伏，边缘泛着生物荧光青，丘陵覆盖青玉苔地衣发蓝白色辉光，天空漂浮孢子水母粉金色触须摇曳，银汞湖泊如液态镜面倒映双月

---

## 修改文件

### 1. `beast-engine.js` — Prompt注入器（v1.0→v1.1）

**修改**：
- `_buildPrompt()`: 多路召回机制（4路优先级）
- 新增 `_inferHabitatFromDescription()`: 从描述文字推断栖息地
- 自动兼容不同档案结构（summary/fullDescription/body+head+eyes）

**向后兼容**：
- 旧档案无 `autoHabitat` → 标准化系统兜底
- 旧档案无 `nirath.habitat` → 知识库推断
- 完全不影响现有40只神兽的使用

### 2. `beast-integration.js` — 导演管线集成（v1.0→v1.1）

**修改**：
- 启动时自动检查未映射神兽并告警
- 提供 `registerNewBeastHabitat()` 用于动态扩展
- 完整性校验：无映射自动提示

---

## 批量验证结果

```
神兽总数: 40
Prompt生成成功: 40 (100%)
Prompt生成失败: 0
未映射栖息地: 0
成功率: 100.0%
Prompt长度范围: 98-144字（全部低于490字上限）
```

**九尾狐**：
- S03 Azure Hills Spirit Plain ✅
- 蓝绿色高草（类视紫红质光合作用）✅
- 青玉苔地衣（蓝白色辉光）✅
- 漂浮孢子水母（粉金色内部器官）✅
- 银汞湖泊（液态金属镜面）✅

**烛龙**：
- S05 Solar Cradle Fusang ✅
- 800km陨石撞击盆地 ✅
- 扶桑3000米晶体柱 ✅
- 永恒金色时刻氛围 ✅

---

## 神兽总量与自动匹配

**山海经神兽总量**：约128只
- 已入库：40只
- 未入库：约88只（精卫、夸父、帝江、刑天、蛊雕、灌灌、赤鱬、当康、猰貐、貔貅等）

**自动匹配能力**：
```
神兽名称 → 山海经原文知识库查询 → 栖息地推断 → Nirath生态区映射
```

**示例**：
- 精卫 → "溺于东海" → S01归墟之海
- 夸父 → "逐日，杖化邓林" → S05汤谷扶桑
- 帝江 → "天山，浑敦无面目" → S10盘古之脊
- 刑天 → "与天帝争神" → S07涿鹿战场

---

## 开放式能力保障

**对于非山海经神兽**（如原创生物、其他神话体系）：
1. 标准化系统无映射 → 自动走知识库推断
2. 知识库无匹配 → 通用Nirath描述保底
3. 完全不需要预定义字段

**对于新增山海经神兽**：
1. 自动从山海经原文推断栖息地
2. 推断失败 → 可手动添加 `autoHabitat` 字段（可选）
3. 无需修改标准化系统映射表

---

## 系统文件清单

| 文件 | 作用 | 版本 |
|------|------|------|
| `beast-habitat-standardizer.js` | 栖息地标准化映射 | v1.0-Peng |
| `beast-engine.js` | Prompt注入器 | v1.1-Peng |
| `beast-integration.js` | 导演管线集成 | v1.1-Peng |
| `beast-index.js` | 神兽索引 | v1.0-Peng |
| `jiuweihu-standard-prompt-v2.2-Peng.md` | 九尾狐标准Prompt | v2.2-Peng |

---

## 版本号更新

- **Beast Archive**: v1.0-Peng → **v1.1-Peng**
- **Beast Engine**: v1.0-Peng → **v1.1-Peng**
- **Beast Integration**: v1.0-Peng → **v1.1-Peng**
- **Director Pipeline**: v5.2-Peng（不变，已集成）
- **大系统**: ShanhaiStory Forge **v2.2-Peng**（不变）

---

## 制作人

**制作人**: 小G | **审核**: 大鹏 👍  
**设计思路**: 多路召回 + 开放式能力 + 知识库推断

---

*"流程的每一个环节，都是曾经踩过的坑、犯过的错换来的。绕过流程，就是重蹈覆辙。"*