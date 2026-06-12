# 异兽定妆照生成系统规范 v4.0-Peng

## 核心原则

《山海经：异兽志》的核心故事围绕Nirath星球的异兽展开。异兽定妆照必须遵循以下两大铁律：

### 铁律一：纯粹异兽本体
**生成的异兽图中，只能有该异兽本身，绝对不能出现小G或任何其他人类角色。**

- 画面主体必须是异兽本体占100%
- 禁止出现人类角色（包括小G）作为对比、骑乘、陪伴
- 禁止出现人类建筑、人类物品作为环境元素
- 环境必须是Nirath原生生态或山海经古典自然环境

### 铁律二：零科技元素
**异兽形象和环境中，不能有任何科技、科幻、现代元素。**

- 禁止机械部件、金属装甲、电子元件
- 禁止赛博朋克风格、发光人工灯光
- 禁止塑料、合成材料
- 禁止科幻武器、能量核心、科技装置
- 允许：生物发光、自然元素（火/水/土/风）、原始材质（石/木/骨/皮）

---

## 技术实现

### 自动检测机制

系统通过以下方式自动识别异兽角色：

```javascript
// 关键词检测
const beastKeywords = [
  '兽', '龙', '鸟', '鱼', '蛇', '狐', '虎', '豹', '狼', '熊', 
  '凤', '凰', '麒麟', '饕餮', '帝江', '烛龙', '九尾', '精卫',
  'beast', 'dragon', 'phoenix', 'fox', 'serpent', 'creature'
];
```

当角色名称或物种包含上述关键词时，自动启用**异兽专用生成模式**。

### Prompt双分支结构

#### 人类角色分支（小G等）
- 保留：儿童特征、中国人特征、服装配饰
- 保留：纯黑背景、工作室布光
- 风格：超写实真人风格

#### 异兽角色分支（帝江、烛龙等）
- 替换为：Nirath原生生态背景
- 替换为：山海经古典志怪美学
- 风格：纯异兽本体，超写实CG渲染

### 负面约束强化

异兽专用负面约束（自动追加到所有异兽prompt）：

```
NO human characters, NO child, NO boy, NO girl, NO person, 
NO human face, NO xiaoG, NO technology, NO sci-fi, 
NO modern elements, NO mechanical parts, NO robots, 
NO cyberpunk, NO metal armor, NO electronic devices, 
NO glowing artificial lights, NO plastic, NO synthetic materials
```

---

## 山海经 + Nirath 融合策略

### 原著忠实度

每只异兽的prompt必须包含：

1. **山海经原文引用**：直接引用《山海经》原著对该异兽的描述
2. **形态约束**：严格遵循原著记载的身体结构、颜色、特征
3. **禁止偏离**：不得添加原著未记载的元素

### Nirath生态融合

在忠实原著的基础上，融入Nirath星球生态：

1. **生物发光**：原著中的“光”可表现为Nirath生物发光
2. **双恒星光照**：永恒黄昏的琥珀+紫罗兰光照
3. **原始野性**：Nirath原生环境的原始质感
4. **生态背景**：Nirath十大场景作为自然环境

---

## 8角度定妆照规范（异兽专用）

| 角度 | 拍摄要求 | 画面内容 |
|------|---------|---------|
| 正面全身 | 异兽本体占画面100% | 完整正面形态，山海经原著特征 |
| 侧面全身 | 90度侧面轮廓 | 体型比例，侧面特征 |
| 背面全身 | 背面朝向镜头 | 背部纹理，尾部/背部特征 |
| 45度半身 | 头部和上半身主体 | 面部/头部特写级清晰度 |
| 面部特写 | 面部占画面主体 | 五官/头部特征，眼神 |
| 动作奔跑 | 自然运动姿态 | 奔跑/飞行动态 |
| 动作坐姿 | 栖息/盘踞姿态 | 自然栖息状态 |
| 肢体特写 | 爪/翼/鳞片细节 | 皮肤/鳞片/毛发纹理 |

---

## 系统文件更新清单

1. ✅ `skills/seedance-director/scripts/seedream-wrapper.js`
   - 新增 `isBeastCharacter()` 检测函数
   - 新增 `BEAST_NEGATIVE_CONSTRAINTS` 负面约束
   - 新增 `BEAST_BASE_STYLE` 异兽风格
   - 人类/异兽双分支prompt生成

2. ✅ `skills/shanhaijing-character-manager/character-archive/character-archive.json`
   - 新增 `beastGenerationRules` 配置节
   - 定义15项负面约束清单
   - 定义异兽风格指南

3. ✅ `skills/shanhaijing-render-engine/orient-primordial-core.js`
   - 更新异兽表情增强模块
   - 移除所有科技元素暗示
   - 强化纯粹神话生物描述

---

## 示例：帝江（光囊母兽）定妆照Prompt

**正面全身：**
```
帝江正面全身纯本体展示，光囊母兽，黄囊状身躯赤如光焰六足四翼无面目，
纯异兽本体，超写实CG渲染，Nirath原生星球生态融合山海经古典志怪美学，
原始野性，生物发光，无人类，无科技元素，非机械，非科幻，纯粹神话生物，
Nirath原生星球环境，山海经古典志怪氛围，原始野性自然环境，生物发光生态，
无人类痕迹，无科技痕迹，正面朝向镜头，完整展示帝江的全部身体特征，
山海经原著形态忠实还原：天山有神焉其状如黄囊赤如光焰六足四翼浑敦无面目，
Nirath生态融合，纯异兽主体占画面100%，无人类角色，无小G，无科技元素，
NO human characters, NO child, NO boy, NO girl, NO person, NO human face, 
NO xiaoG, NO technology, NO sci-fi, NO modern elements, NO mechanical parts, 
NO robots, NO cyberpunk, NO metal armor, NO electronic devices, 
NO glowing artificial lights, NO plastic, NO synthetic materials
```

---

## 版本记录

- v4.0-Peng (2026-05-22): 异兽专用生成模式，纯粹异兽本体+零科技元素
- v3.0-Peng (2026-05-22): 小G定妆照全局统一，服装配饰精确规范
- v2.2-Peng (2026-05-20): 8角度定妆照，原著约束，多角度覆盖
- v1.0-Peng (2026-05-15): 基础定妆照生成