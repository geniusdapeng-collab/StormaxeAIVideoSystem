# 山海经异兽定妆照生成技能（v1.0-Peng）

> **固化时间**: 2026-06-06  
> **固化原因**: 白泽定妆照生成跑偏——没用bestiary数据→没用seedream-wrapper→直接拍脑袋→形象错误（鹿而非狮子/云气）

---

## 核心原则

山海经异兽定妆照**必须**遵循"科学生成流程"，禁止拍脑袋。

> 山海经里的异兽，它跟别的不一样，它是要非常科学的去生成的，不能胡思乱想的，它是有一套非常严谨的科学的系统的。

---

## 正确流程（5步必须）

### Step 1: 从 bestiary.js 读取精确外观数据

```javascript
const { Bestiary } = require('./bestiary.js');
const bestiary = new Bestiary();
const beast = bestiary.getBeast('baize'); // 异兽ID

// 必读字段
beast.appearance.body        // 体型描述
beast.appearance.signatureFeatures  // 标志性特征（最重要！）
beast.appearance.colorPalette // 配色方案
beast.appearance.texture      // 材质/质感
beast.shanhaijingText         // 古籍原文（辅助）
```

**禁止跳过此步**。即使知道某个异兽的外观，也必须从 bestiary.js 读一次。

### Step 2: 从 lore-drama-adapter.js 读取叙事人格

```javascript
const { getBeastDramaProfile } = require('./lore-drama-adapter.js');
const dramaProfile = getBeastDramaProfile('baize');
// dramaProfile.mythTrait / emotionalArchetype / voiceTone
```

叙事人格影响姿态/表情提示词。

### Step 3: 组装精确提示词（基于bestiary数据）

**白泽示例**（正确）：
```
White mythical beast BAI ZE from Chinese mythology, majestic large white lion body, pure white fur glowing like moonlight, vertical third eye on forehead, three-forked tail with white flames at each tip, hooves leaving brief glowing footprints, golden vertical pupils, ethereal divine atmosphere, pure white background, no background elements, clean plain white void, Unreal Engine 5, 3D Chinese mythology art style, high detail
```

**白泽错误示例**（我犯的）：
```
白泽（中国神话异兽），通体雪白的神鹿形态...  ← 没用bestiary数据，凭空想成鹿
```

**提示词规则**：
- 必须包含 `signatureFeatures` 里的所有特征
- 必须使用 `colorPalette.primary` 作为主色调描述
- 必须加 `pure white background` 确保白底
- 必须加 `Unreal Engine 5, 3D Chinese mythology style`
- 禁止使用 bestiary.js 里没有的形态描述

### Step 4: 调用 seedream-wrapper 或 image_generate

**正式Pipeline**（Stage 5调用）：
```javascript
const { generateCharacterReference } = require('./seedream-wrapper.js');
// 注意：需要有效的 ARK API Key for image generation
```

**当前稳定方案**（ARK Key 不稳定时）：
```javascript
// 使用 image_generate 工具，但必须先完成 Step 1-3
// prompt 全部来自 bestiary.js 数据，禁止自己编造
```

### Step 5: 归档 + 发送用户确认

1. 下载到 `productions/{项目}/02-characters/{异兽}/`
2. 更新 `character-meta.json` 的 `referencePhotos`
3. 发送飞书用户确认（等确认后才能继续Pipeline）

---

## 已知异兽外观基准（从 bestiary.js）

| 异兽 | ID | 体型 | 标志性特征 |
|------|-----|------|------------|
| 白泽 | baize | 如大型狮子 | 竖眼+三尾+蹄印 |
| 烛龙 | zhulong | 人面蛇身赤龙 | 竖目+火球 |
| 帝江 | dijiang | 黄囊六足四翼 | 无面目+歌舞 |
| 刑天 | xingtian | 失首人形 | 乳目+干戚 |
| 夸父 | kuafu | 人形巨躯 | 逐日+化山 |
| 夔 | kui | 苍身一足牛 | 单足+雷声 |

> 更多异兽外观见 `bestiary.js` 的 `BESTIARY` 对象

---

## 绝对禁止

- ❌ 没用 bestiary.js 数据就生成
- ❌ 用人类常见动物（鹿/马/狗）套到异兽上
- ❌ 生成有复杂背景的图（抠图难，Seedance难识别）
- ❌ 不发用户确认就继续Pipeline
- ❌ 把图只发飞书不归档到项目目录

---

## 验证清单

生成定妆照前自检：
- [ ] 已从 bestiary.js 读取 `appearance.signatureFeatures`
- [ ] 已从 bestiary.js 读取 `appearance.colorPalette`
- [ ] prompt 包含所有 `signatureFeatures`
- [ ] prompt 包含 `pure white background`
- [ ] prompt 使用 bestiary 数据，未自己编造形态

---
