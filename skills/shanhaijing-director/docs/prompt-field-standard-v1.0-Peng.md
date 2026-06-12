# 视频镜头Prompt标准字段结构 v1.0-Peng

## 一、字段总览（8个维度）

一个完整的Seedance视频镜头Prompt必须包含以下8个字段（按优先级排序）：

| 优先级 | 字段 | 英文标识 | 内容要求 | 建议字符数 | 精简策略 |
|:---|:---|:---|:---|:---|:---|
| 🔴 P0 | **音频叙事块** | AudioNarrativeBlock | 角色台词、声音表演、音效设计 | 80-120 | 绝不精简，只删语气词 |
| 🔴 P0 | **角色锚点** | Character | 外貌、服装、配饰、核心特征 | 100-150 | 绝不精简，只删冗余形容词 |
| 🟡 P1 | **场景环境** | Scene | 地点、地形、生态、大气、材质 | 150-200 | 删次要细节，保留核心场景 |
| 🟡 P1 | **情绪氛围** | Mood | 情绪关键词（3-5个） | 30-50 | 精简为关键词，删长句 |
| 🟢 P2 | **运镜控制** | Camera | 景别、运镜方式、镜头运动 | 100-150 | 删速度/质感修饰，保留核心运镜 |
| 🟢 P2 | **光影方案** | Lighting | 主光、辅光、光源方向、时间 | 80-120 | 删次要光源，保留核心光位 |
| 🔵 P3 | **环境风格** | EnvironmentStyle | 角色CG/背景实景分离声明 | 30-50 | 固定模板，极少变动 |
| 🔵 P3 | **导演风格** | DirectorStyle | 导演风格参数（1-2项） | 20-40 | 保留核心风格关键词 |

**总计建议字符数**：590-880字符（为Prompt其他内容留出空间，总目标950-990）

---

## 二、各字段详细规范

### 1. AudioNarrativeBlock（音频叙事块）— P0

**定位**：声音是视频的另一半，台词和音效决定情绪感染力。

**必须包含**：
- 角色台词（谁在说、说什么、情绪语气）
- 声音表演指令（音高、语速、共鸣、特效处理）
- 环境音效（如果影响画面）

**示例**：
```
AudioNarrativeBlock: deep resonant bass voice from compass depths: "Child... the star-forged compass awakens." Metallic undertone, slow cadence, chest resonance. Sub-bass rumble accompanies each word.
```

**精简保护**：
- 核心台词绝不删除
- 声音特效词可精简（保留前2个）
- 删除冗余语气词（"啊""呢""吧"）

---

### 2. Character（角色锚点）— P0

**定位**：角色一致性是生命线，必须精确锚定外貌特征。

**必须包含**：
- 种族/物种（8岁中国男孩/远古战神）
- 核心外貌（黄色冲锋衣/暗金色晶化金属躯体）
- 关键配饰（黄铜指南针/干戚武器）
- 面部表情/姿态（紧张/战斗姿态）

**示例**：
```
Character: 8-year-old Chinese boy, bright yellow technical mountaineering jacket with reinforced seams, blue jeans scuffed at knees, small fingers gripping brass compass with patina wear marks. Expression: nervous awe, eyes wide reflecting golden light.
```

**精简保护**：
- 核心外貌特征绝不删除（黄色冲锋衣、暗金晶化躯体）
- 配饰可精简描述长度，保留名称
- 表情可简化（"nervous awe"→"awed"）

---

### 3. Scene（场景环境）— P1

**定位**：场景是故事的舞台，必须提供可拍摄的视觉信息。

**必须包含**：
- 地点（Nirath暗金晶化峡谷）
- 地形（六边形祭坛/悬浮残骸）
- 生态元素（晶化雾霭/能量河流）
- 材质细节（粗糙火山岩/金属反光）

**示例**：
```
Scene: crystalline metallic canyon labyrinth, hexagonal volcanic rock fractures with iron oxide deposits forming ochre-red mineral veins, bioluminescent spore clouds drifting at ankle height, twin sunset casting 3200K purple-gold rim light across 70-meter-tall silhouette.
```

**精简策略**：
- 保留核心地点和3个关键地形元素
- 删除次要细节（"微风轻拂""远处鸟鸣"）
- 材质细节保留2-3个（影响光影交互的）

---

### 4. Mood（情绪氛围）— P1

**定位**：情绪是观众共鸣的桥梁，用关键词而非长句。

**必须包含**：
- 3-5个情绪关键词
- 避免长句描述（"氛围充满了神秘感和史诗般的敬畏"→"mysterious epic awe"）

**示例**：
```
Mood: mysterious, epic, awe, ancient awakening, destiny
```

**精简策略**：
- 直接精简为关键词列表
- 保留3个核心情绪词
- 删除解释性语句

---

### 5. Camera（运镜控制）— P2

**定位**：运镜是导演的签名，必须精确可执行。

**必须包含**：
- 景别（extreme close-up/medium shot/wide shot）
- 运镜方式（tracking/panning/crane/drone）
- 镜头运动（push in/pull out/sweeping）

**示例**：
```
Camera: 85mm macro tracking across compass glass surface, hidden cut at light-flare explosion transitions to 14mm ultrawide drone cable system descending toward energy vortex, speed: slow 0.3x for awe buildup.
```

**精简策略**：
- 保留景别和核心运镜词
- 删除速度修饰（"极慢速""0.3x"→"slow"）
- 删除设备细节（"cable system""mechanical arm"）

---

### 6. Lighting（光影方案）— P2

**定位**：光影是情绪的物质载体，必须明确光源和方向。

**必须包含**：
- 主光（方向、色温、强度）
- 辅光（环境反射、填充光）
- 特效光（能量发光、脉冲光源）

**示例**：
```
Lighting: twin sunset 3200K purple-gold rim light from behind silhouette, cool blue 6500K ambient fill from canyon walls, energy vortex emitting pulsing dark-gold light 2700K casting dynamic shadows.
```

**精简策略**：
- 保留主光方向+色温
- 删除具体数值（"3200K"→"warm rim light"）
- 保留1个特效光描述

---

### 7. EnvironmentStyle（环境风格）— P3

**定位**：声明角色CG超写实 vs 背景实景拍摄，防止风格漂移。

**固定模板**：
```
EnvironmentStyle: Character: CG hyper-realistic human, Chinese features. Background: real location filming, 4K UHD cinematic quality. NO CG background, NO digital painting.
```

**精简策略**：
- 固定模板，极少变动
- 只在角色种族变化时修改

---

### 8. DirectorStyle（导演风格）— P3

**定位**：确保镜头体现导演审美，维持全片一致性。

**必须包含**：
- 导演标识（Cameron史诗尺度/Anderson对称构图）
- 1-2项核心风格参数

**示例**：
```
DirectorStyle: Cameron-scale contrast, rim lighting emphasis
```

**精简策略**：
- 保留导演名+1个核心风格词
- 删除详细参数（合并到Camera/Lighting中）

---

## 三、精简优先级总表

| 优先级 | 字段 | 精简底线 | 可删除内容 | 不可删除内容 |
|:---|:---|:---|:---|:---|
| P0 | AudioNarrativeBlock | 保留核心台词+1个声音特效 | 语气词、次要音效 | 核心台词、角色声音标识 |
| P0 | Character | 保留核心外貌+配饰名称 | 冗余形容词、细节描述 | 种族、核心服装色、关键配饰 |
| P1 | Scene | 保留地点+3个关键元素 | 次要细节、氛围修饰 | 核心地形、材质细节（≥2种） |
| P1 | Mood | 保留3个关键词 | 解释性语句、长句 | 核心情绪词 |
| P2 | Camera | 保留景别+核心运镜 | 速度修饰、设备细节 | 景别、运镜方向 |
| P2 | Lighting | 保留主光方向+色温 | 具体数值、次要光源 | 主光方向、核心特效光 |
| P3 | EnvironmentStyle | 固定模板 | 无 | 角色CG声明、背景实景声明 |
| P3 | DirectorStyle | 保留导演名+1风格词 | 详细参数 | 导演标识 |

---

## 四、字段分隔规范

**标准分隔符**：`|`

```
AudioNarrativeBlock: ... | Character: ... | Scene: ... | Mood: ... | Camera: ... | Lighting: ... | EnvironmentStyle: ... | DirectorStyle: ...
```

**截断边界**：只能在 `|` 分隔符处截断，绝不在字段中间截断。

---

## 五、字符数分配建议

| 字段 | 最小字符数 | 标准字符数 | 最大字符数 |
|:---|:---|:---|:---|
| AudioNarrativeBlock | 60 | 100 | 150 |
| Character | 80 | 120 | 180 |
| Scene | 120 | 170 | 220 |
| Mood | 20 | 40 | 60 |
| Camera | 80 | 120 | 160 |
| Lighting | 60 | 100 | 140 |
| EnvironmentStyle | 20 | 40 | 60 |
| DirectorStyle | 15 | 30 | 50 |
| **总计** | **455** | **720** | **1000** |

**建议**：目标950-990字符，各字段按标准字符数分配，剩余230-270字符用于弹性调整。

---

## 六、审核检查清单

每个Prompt必须通过以下检查：

- [ ] 包含全部8个字段（AudioNarrativeBlock/Character/Scene/Mood/Camera/Lighting/EnvironmentStyle/DirectorStyle）
- [ ] 字符数在950-990之间
- [ ] AudioNarrativeBlock包含核心台词或声音表演指令
- [ ] Character包含种族+核心外貌+关键配饰
- [ ] Scene包含地点+≥2种材质细节
- [ ] Mood为3-5个关键词，非长句
- [ ] Camera包含景别+核心运镜词
- [ ] Lighting包含主光方向
- [ ] EnvironmentStyle声明角色CG+背景实景
- [ ] DirectorStyle包含导演标识

---

## 七、版本记录

| 版本 | 日期 | 变更 |
|:---|:---|:---|
| v1.0-Peng | 2026-05-31 | 初始版本，8字段标准 |

---

*标准制定：基于Seedance 2.0渲染引擎要求 + James Cameron导演风格 + Nirath世界观*
*适用范围：所有山海经/Nirath系列视频生成*