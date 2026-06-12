---
name: wood-design-blueprint
version: 1.0.0
skill_id: wood-design-blueprint-v1
description: "AI 木工设计图生成技能。为手工木雕器物生成设计参考图，支持多视角展示、尺寸标注、材质表现。涵盖餐具类、把件类、节气类、成长类、装饰类等木器设计。"
tags: [木工, 设计图, AI生图, 参考图, 器物设计, 木雕, 木勺, 木碗]
category: productivity
type: content-generation
domain: 手工艺
sub_domain: 木工设计
author: 高效小G
metadata: 
  quality_score: 98
  priority: high
  status: active
  published_date: 2026-04-13
  last_updated: 2026-04-13
  production_ready: true
---

# 木工器物设计图生成技能

## 概述

使用 AI 图像生成能力，为手工木雕器物生成设计图/参考图。生成的设计图可用于实际木工制作的视觉参考，帮助制作者理解器物的造型、比例、尺寸和细节。

## 支持的器物类型

### 餐具类
- 木勺（成长系列、情感信物系列、节气系列）
- 木碗（成长系列、节气系列、"无用"系列）
- 木盘、木杯

### 把件类
- 小动物（小猫、小狗、小兔子、小鸟）
- 水果造型（苹果、桃子、草莓）
- 星座牌牌

### 节气类
- 二十四节气木牌（每个节气一个设计）
- 四季餐具（春勺、夏碗、秋盘、冬杯）

### 成长类
- 成长勺子（1岁、3岁、5岁不同尺寸）
- 成长木碗（按年龄段）
- 成长木牌（年度纪念牌）

### 装饰类（"无用"之美系列）
- 不能盛的碗（有缺口或歪斜的艺术碗）
- 不能用的勺子（超大或超小的艺术勺）
- 不会转的陀螺（外形精美但不能转）

## 使用方法

### 基本用法

用户只需输入想要制作的器物描述，技能自动生成设计图：

```
生成设计图：给1岁宝宝做的小木勺
生成设计图：二十四节气立春木牌
生成设计图：小猫造型木把件
```

### 高级用法（指定参数）

可以指定材质、尺寸、风格等参数：

```
生成设计图：给3岁宝宝做的成长木勺，樱桃木，长度12cm
生成设计图：荷叶造型木碗，夏天用，直径15cm，榉木
生成设计图：爸爸手造型木勺，勺柄是手掌形状，紫檀木
```

### 批量生成

一次生成多个相关设计图：

```
批量生成设计图：成长勺子系列（1岁、3岁、5岁）
批量生成设计图：春夏秋冬四季餐具
批量生成设计图：十二星座牌牌
```

## 设计图生成规则

### 设计图风格选择

根据器物类型自动选择最合适的设计风格：

| 器物类型 | 设计风格 | 视觉特点 |
|----------|---------|---------|
| 餐具类 | 技术图纸风格 | 清晰展示尺寸、比例、角度，适合制作参考 |
| 把件类 | 3D渲染风格 | 展示立体造型和细节，适合理解形态 |
| 节气类 | 文艺手绘风格 | 结合节气元素的创意设计，适合审美参考 |
| 成长类 | 温馨插画风格 | 体现成长记录的温情，适合情感表达 |
| 装饰类 | 艺术概念风格 | 突出"无用之美"的审美，适合艺术创作 |

### 设计图内容要求

每张设计图应包含：

1. **多视角展示**：正面、侧面、俯视图（至少两个视角）
2. **尺寸参考**：关键尺寸标注或比例参考（与实际物体对比）
3. **材质表现**：木纹和颜色表现，帮助选择合适木料
4. **细节标注**：雕刻细节、边缘处理、弧度等（如适用）
5. **使用场景**：器物在实际使用中的状态（如适用）

### 图像规格

- 分辨率：1024x1024（标准）或 1792x1024（宽幅，适合多角度展示）
- 格式：PNG
- 风格：清晰、专业、易于理解，适合作为制作参考

## 设计图 Prompt 模板

### 餐具类 Prompt 模板

```
Technical drawing of a handcrafted wooden [器物类型], 
multiple views (front view, side view, top view), 
with dimension annotations, 
showing wood grain texture, 
clean technical illustration style, 
white background, 
professional woodworking reference drawing, 
dimensions: [尺寸], 
material: [木料类型]
```

### 把件类 Prompt 模板

```
3D rendered design reference of a handcrafted wooden [器物类型], 
multiple angles (front, side, back, top), 
showing detailed carving details, 
wood grain texture visible, 
clean product design reference style, 
white background, 
professional woodworking guide, 
dimensions suitable for [使用场景], 
material: [木料类型]
```

### 节气类 Prompt 模板

```
Artistic design illustration of a handcrafted wooden [节气名称] themed [器物类型], 
showing seasonal elements ([节气元素]), 
multiple views, 
wood grain texture, 
elegant Chinese aesthetic, 
clean design reference style, 
white background, 
professional woodworking reference, 
material: [木料类型]
```

### 成长类 Prompt 模板

```
Warm illustrated design of a handcrafted wooden [器物类型] for [年龄] year old child, 
showing growth milestone concept, 
multiple views, 
wood grain texture, 
gentle warm color palette, 
clean design reference style, 
white background, 
professional woodworking reference, 
dimensions appropriate for child, 
material: [木料类型]
```

### 装饰类 Prompt 模板

```
Artistic concept design of a handcrafted wooden [器物类型] with intentional imperfection, 
wabi-sabi aesthetic, 
showing the beauty of "uselessness", 
multiple views, 
wood grain texture, 
zen atmosphere, 
clean design reference style, 
white background, 
professional woodworking reference, 
material: [木料类型]
```

## 常见器物设计参数参考

### 木勺尺寸参考

| 年龄段 | 总长度 | 勺头宽度 | 勺头深度 | 勺柄直径 |
|--------|--------|---------|---------|---------|
| 1岁 | 10-12cm | 2-2.5cm | 0.5-0.8cm | 0.8-1cm |
| 3岁 | 13-15cm | 2.5-3cm | 0.8-1cm | 1-1.2cm |
| 5岁 | 16-18cm | 3-3.5cm | 1-1.2cm | 1.2-1.5cm |
| 成人 | 20-25cm | 3.5-4.5cm | 1.2-1.5cm | 1.5-2cm |

### 木碗尺寸参考

| 年龄段 | 碗口直径 | 碗深 | 碗底直径 | 壁厚 |
|--------|---------|------|---------|------|
| 1岁 | 8-10cm | 3-4cm | 5-6cm | 0.5-0.8cm |
| 3岁 | 10-12cm | 4-5cm | 6-7cm | 0.6-0.8cm |
| 5岁 | 12-14cm | 5-6cm | 7-8cm | 0.7-1cm |
| 成人 | 15-18cm | 6-8cm | 9-11cm | 0.8-1.2cm |

### 木牌尺寸参考

| 类型 | 长度 | 宽度 | 厚度 | 孔径 |
|------|------|------|------|------|
| 节气牌 | 6-8cm | 4-5cm | 0.5-0.8cm | 0.3-0.5cm |
| 成长牌 | 8-10cm | 5-6cm | 0.6-0.8cm | 0.3-0.5cm |
| 星座牌 | 6-8cm | 6-8cm | 0.5-0.8cm | 0.3-0.5cm |

## 输出示例

### 示例 1：木勺设计图

**输入**：生成设计图：给1岁宝宝做的小木勺，樱桃木

**输出**：生成一张木勺设计图，包含：
- 正面视图：展示勺子整体造型和比例
- 侧面视图：展示勺柄弧度和勺头深度
- 尺寸标注：总长度10-12cm、勺头宽度2-2.5cm、勺头深度0.5-0.8cm
- 材质表现：樱桃木纹理和色泽

### 示例 2：节气木牌设计图

**输入**：生成设计图：立春木牌，黄杨木

**输出**：生成一张立春木牌设计图，包含：
- 正面视图：展示木牌造型和立春元素（嫩芽、春风）
- 背面视图：可刻日期和文字的区域
- 尺寸标注：木牌长6-8cm、宽4-5cm、厚0.5-0.8cm
- 材质表现：黄杨木纹理

### 示例 3：小动物把件设计图

**输入**：生成设计图：小猫木把件，榉木

**输出**：生成一张小猫木把件设计图，包含：
- 多角度视图：正面、侧面、背面、顶部
- 尺寸标注：适合小手握持的尺寸（约5-6cm）
- 细节展示：耳朵、眼睛、尾巴等细节
- 材质表现：榉木纹理

## 注意事项

1. **参考性质**：AI 生成的设计图是参考图，实际制作时需要根据木料特性、工具条件和个人技艺进行调整
2. **安全标准**：儿童使用的器物需特别注意尺寸安全（避免过小零件防吞咽），所有接触食物的部分必须使用食品级木料和食品级木蜡油处理
3. **木料选择**：设计图展示的木料纹理和颜色仅供参考，实际木料可能有所不同
4. **尺寸灵活**：标注尺寸为参考值，实际制作时可根据具体情况调整
5. **技艺要求**：设计图展示的是理想效果，实际制作效果取决于木工技艺水平

## 与"无用之用"器物创作方向的结合

本技能支持"无用之用"器物创作方向中的所有器物类型，包括：

- **成长记录系列**：成长勺子、成长木碗、成长木牌
- **节气系列**：二十四节气小牌、四季餐具
- **象形系列**：小动物把件、水果造型、星座牌牌
- **情感信物系列**：爸爸的手、家的形状、妈妈的香味
- **"无用"之美系列**：不能盛的碗、不能用的勺子、不会转的陀螺

每个器物类型都有对应的设计图生成模板，可以快速生成制作参考图。

## 扩展方向

未来可以扩展的功能：
- 支持更多器物类型
- 支持自定义尺寸输入
- 支持多木料组合设计
- 支持雕刻图案定制
- 支持生成制作步骤图解
- 支持生成工具清单
- 支持生成材料清单
