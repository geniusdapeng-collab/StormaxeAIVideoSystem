# AI 视频生成提示词工程方案

> 来源: MC文策 AI视频生成系统提示词工程方案 v1.0
> 存档: 2026-06-10
> 适用: Seedance / 即梦 / Runway / 可灵 等所有文生视频模型

---

## 核心原理

AI 生成的人物/场景呈现"塑料感"的根本原因：
- **人物**: 模型默认输出统计意义的"平均完美人脸"，无瑕疵、无毛孔、无层次
- **光影**: 笼统的"电影级光效"模型无法执行，需要具体灯光方案

---

## 第一部分：人物鲜活度增强

### 1.1 动作具象化

**核心法则**: 抽象情绪 → 肌肉动作 + 肢体行为的连续信号链

| 抽象（弱） | 具象（强） |
|---|---|
| "神兽威严" | "竖眼缓缓睁开，瞳孔从收缩到放大，蹄子踏出一步，地表震出裂纹" |
| "少年好奇" | "身体前倾，瞳孔轻微放大，脚步放慢，下意识抬手挡在眉前" |
| "震撼" | "脚步后退半步，喉咙滚动，手臂僵在半空" |

**山海经专用动作维度**:
- 竖眼：瞳孔收缩/放大/扫描/聚焦
- 三尾：火焰摇曳节奏/尾尖勾起/尾部分叉展开
- 蹄子：轻踏/重踏/踏出光纹/悬浮飘移
- 角（异兽）：转动方向/发光节奏

### 1.2 质感真实化

**核心法则**: 主动注入"不完美"打破 AI 完美陷阱

| 增强项 | 提示词写法 |
|---|---|
| 皮肤纹理 | "visible pores, natural skin texture,拒绝 porcelain ceramic skin" |
| 毛发细节 | "fur strands individually visible, slight natural oil sheen on fur" |
| 生物荧光 | "bioluminescent particles floating in the air, blue-green glow on creature" |
| 火焰质感 | "realistic fire with orange core, white-hot base, ember particles, not cartoon flame" |
| 尘土/雾气 | "dust particles in light beams, fine mist in valleys" |

### 1.3 情绪留白

**核心法则**: L2-L3 级别最真实（过程比爆发更动人）

山海经情绪分级示例：

| 情绪 | L2（含蓄） | L3（自然） |
|---|---|---|
| 白泽苏醒 | "竖眼光芒缓缓变亮，瞳孔从收缩到舒展" | "竖眼睁开，瞳孔缓慢对焦，周围空气似乎凝固了一瞬" |
| 小G敬畏 | "呼吸变浅，脚步变慢" | "喉咙滚动，后退半步，手无意识地攥紧衣角" |
| 接触时刻 | "手臂悬停，伸出手指" | "手指颤抖伸出，指尖接近神兽皮毛时骤然停住" |

### 1.4 运镜叙事化

| 情绪 | 推荐运镜 | 山海经适用场景 |
|---|---|---|
| 敬畏/神秘 | 缓慢推进 + 极特写 | 白泽竖眼睁开瞬间 |
| 震撼/孤独 | 希区柯克变焦 | 神兽现身画面从局部到全景 |
| 发现/惊喜 | 侧面横移 + 局部特写 | 小G发现光芒时刻 |
| 紧张/压迫 | 快速推进 + 特写 | 白泽蹄声逼近 |
| 接纳/温馨 | 缓慢拉远 + 远景 | 人兽相会后全景展开 |

---

## 第二部分：电影级光影系统

### 2.1 八大光效 × 山海经场景映射

| 光效 | 心理暗示 | 山海经适用场景 |
|---|---|---|
| **丁达尔光** | 神圣/梦幻/仙境 | 白泽现身：神兽从黑暗中浮现，光柱从岩壁裂缝透入 |
| **逆光/轮廓光** | 希望/离别/史诗 | 白泽三尾火焰：逆光勾勒神兽轮廓，金色边缘 |
| **伦勃朗光** | 沉稳/质感/故事 | 小G面部特写：神兽光芒映照下形成三角光斑 |
| **顶光** | 压迫/审判/神秘 | 绝壁深处：顶光强化岩壁纹理，营造压迫感 |
| **硬光** | 危险/硬朗/力量 | 白泽蹄踏：阴影边缘清晰，能量爆发瞬间 |
| **黄金时刻** | 温暖/治愈 | 人兽相会：暮光余晖下的接纳时刻 |
| **蓝调时刻** | 清冷/孤独/安静 | 小G等待：山脚夜色，天空呈淡蓝 |
| **黑色电影** | 悬疑/危险 | 黑暗裂缝：极暗背景，神兽眼睛发光 |

### 2.2 光效提示词模板

**丁达尔光 × 白泽现身（山海经定制版）**:
```
"Ancient cliff face emerges from absolute darkness. A shaft of golden-white light 
pierces through a crack in the rock wall, visible dust motes dancing in the beam. 
The divine beast's white fur catches the light, creating an ethereal glow. 
Volumetric god rays illuminate the creature from behind. 
Cinematic, photorealistic, 8K detail."
```

**逆光 × 三尾火焰**:
```
"Three-tails silhouetted against a molten sunset, each tail-tip burning with 
white-blue bioluminescent flame. Backlit by dual sunset light (purple-gold gradient 
and amber-orange glow), creating a halo rim around the beast. 
Fire particles drift on the wind. Epic scale, cinematic lighting."
```

---

## 第三部分：提示词构建标准

### 3.1 山海经镜头提示词结构（基于本方案优化）

```
【异兽/角色】
主体 + 物种特征 + 标志性动作 + 质感细节 + 情绪状态

【场景环境】
背景 + 地质纹理 + 天气/光线 + 氛围元素

【光影系统】
光源位置 + 光效类型 + 明暗对比 + 氛围情绪

【镜头规格】
景别 + 运镜方式 + 画面风格 + 负面约束
```

### 3.2 四大顶级指令（山海经版）

```javascript
const TOP_COMMANDS = {
  skinFur: "Individual fur strands visible, natural oil sheen, not cartoon fur, realistic fur texture",
  lightBeams: "Volumetric light rays visible in atmosphere, god rays through mist/dust",
  bioluminescence: "Blue-green bioluminescent particles, ethereal glow, supernatural light source",
  epicScale: "Wide angle establishing shot, creature fills 70% of frame, cinematic composition"
};
```

### 3.3 负面提示词（山海经版）

```javascript
const NEGATIVE_PROMPTS = {
  creature: [
    "cartoon beast, anime creature, 3D render, illustration style",
    "symmetrical perfect face, no scars, no texture variation",
    "rubber fur, plastic feathers, fake bioluminescence"
  ],
  scene: [
    "clean sterile background, flat lighting, no shadows",
    "modern building, car, person in modern clothing",
    "watermark, text overlay, frame border"
  ],
  quality: [
    "blurry, low resolution, compression artifacts",
    "over-smoothed, porcelain skin, doll face",
    "extra limbs, deformed anatomy"
  ]
};
```

---

## 第四部分：质量自检清单（山海经版）

### 异兽真实性检查
- [ ] 毛发/鳞片是否有层次感（而非平板色块）？
- [ ] 眼睛是否有多层结构（而非单一发光圆点）？
- [ ] 尾巴/角/蹄等特殊器官是否有质感？
- [ ] 火焰/生物光是否符合物理规律（颜色/粒子/阴影）？

### 光影逻辑检查
- [ ] 光源方向是否明确？
- [ ] 神兽轮廓光是否与背景分离？
- [ ] 阴影是否符合光源位置？
- [ ] 是否有体积光（丁达尔效应的光柱）？

### 情绪真实性检查
- [ ] 异兽情绪是否通过身体语言表达（而非单纯发光变强）？
- [ ] 人类角色是否有自然的微动作？
- [ ] 情绪强度是否在 L2-L3（而非爆发）？
