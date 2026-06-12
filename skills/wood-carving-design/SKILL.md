# 木雕圆雕设计图生成技能 (Wood Carving Design Generator)

**版本：** V1.0
**创建日期：** 2026-04-14
**触发词：** 木雕设计图、圆雕三视图、雕刻参考图、木雕设计、木雕图纸

---

## 用途

根据用户描述的木雕圆雕主题，生成可直接用于雕刻施工的设计参考图，包括：
- **三视图线稿**（正面/侧面/背面）
- **细节特写图**（关键部位多角度）
- **木雕成品效果预览图**（材质+质感参考）

---

## 工作流

### 第一步：确认需求

向用户确认以下信息：
1. **雕刻主题**（如：胖婴儿、动物、人物等）
2. **核心特征**（需要重点突出的部位，如"肥美小腿腿"）
3. **姿势要求**（坐姿/站姿/趴姿/特殊动作）
4. **风格偏好**（写实/卡通/Q版/传统）
5. **木材类型**（樱桃木/核桃木/松木等，影响成品预览图色调）

如果用户已给出足够信息，直接跳过确认进入第二步。

### 第二步：生成三视图线稿

使用 `image_generate` 生成三视图设计图，prompt 必须包含：

**必选要素：**
- `Three-view orthographic projection` 或 `front view, side view, back view`
- `Clean technical drawing style on white background`
- `Professional woodcarving pattern template`
- `Line art with proportion guides` 或 `dimension indicators`
- `Black ink on white paper` 或 `pencil sketch style`

**主题要素：**
- 描述完整造型（全身/局部）
- 突出用户要求的核心特征
- 如果是人物/动物，必须明确 `Each foot has EXACTLY 5 toes`

**示例 prompt 模板：**
```
A detailed woodworking reference drawing of [主题描述] with [核心特征]. Three-view orthographic projection: front view, side view, back view. Clean technical drawing style on white background. Shows proportions of [身体部位], [特征描述]. Each foot has EXACTLY 5 toes clearly visible. Professional woodcarving pattern template. Line art with clear structural lines and proportion guides. Black ink on white paper, 1:1
```

### 第三步：生成细节特写图

针对核心部位生成多角度细节图：

**必选要素：**
- 多角度（正面/侧面/背面/底面）
- 关键结构标注暗示（fat rolls, creases, muscle lines等）
- `Professional woodcarving pattern template for [部位] carving`
- `Line art with measurement guides`

**示例 prompt 模板：**
```
A detailed woodworking reference drawing showing close-up of [部位] from multiple angles. Front view, side view, back view, bottom view. Clean technical drawing style on white background. Shows extreme detail of [结构特征]. Professional woodcarving pattern template. Line art with dimension guides. Black ink on white paper, 1:1
```

### 第四步：生成成品效果预览图

生成1-3张木雕成品效果预览图，让用户预知最终效果：

**必选要素：**
- `Realistic [木材类型] wood carving reference photo`
- `Warm natural wood tones, actual wood grain visible`
- `Professional woodcarving sample`
- `Warm lighting, clean background`
- `Realistic photograph style`

**示例 prompt 模板：**
```
A realistic [木材] wood carving reference photo of [主题描述]. Warm natural wood tones, actual wood grain visible. [特征描述]. Each foot has EXACTLY 5 toes. Professional woodcarving sample. Warm lighting, clean background. Shows what the finished carved piece should look like. Realistic photograph style, 1:1
```

### 第五步：检查验证

**必须步骤！** 在发送给用户之前：

1. 使用 `exec` 找到最新生成的图片路径：
   ```
   ls -lt /home/gem/workspace/agent/media/tool-image-generation/ | head -10
   ```

2. 使用 `image` 工具检查每张图片：
   - 脚趾/手指数量是否正确（每只脚5个、每只手5根）
   - 三视图是否完整（至少2个视角）
   - 核心特征是否突出

3. **只有通过检查的图才能发送**。不合格的重新生成。

### 第六步：发送给用户

按类别分批发送，每张图附带简短说明：
- 📐 三视图线稿
- 🔍 细节特写
- 🪵 成品预览

最后附上雕刻建议和使用说明。

---

## 关键规范

### 解剖正确性（铁律）
- **每只脚必须5个脚趾**，生成后必须用 image 工具检查确认
- **每只手必须5根手指**（如果手部可见）
- 不符合要求的图必须重做，不得发送

### 图纸专业性
- 三视图必须包含至少2个视角（正面+侧面是最低要求）
- 必须带有比例网格或尺寸标注
- 线条必须清晰，背景必须干净（白色/浅色）
- 核心特征必须在各视图中都能观察到

### 成品预览
- 必须指定木材类型（默认樱桃木 cherry wood）
- 必须展示真实木纹质感
- 光照要温暖自然，背景干净

---

## 常用木材色调用词

| 木材 | prompt 用词 |
|------|------------|
| 樱桃木 | cherry wood, warm reddish-brown tones |
| 核桃木 | walnut wood, dark brown tones |
| 松木 | pine wood, light yellow tones |
| 榉木 | beech wood, pale cream tones |
| 桧木 | hinoki cypress, very light warm white tones |
| 柚木 | teak wood, golden brown tones |

---

## 常见姿势模板

### 坐姿伸腿
- 适用：展示小腿、脚部细节
- 特点：正面视角最直观

### 青蛙腿（M型）
- 适用：最大化展示大腿和小腿肉感
- 特点：M型展开，肉褶最明显

### 仰卧抬腿
- 适用：动态感、可爱感
- 特点：双腿朝上，全身比例清晰

### 盘腿交叉
- 适用：紧凑造型、小件雕刻
- 特点：交叉处肉感挤压

### 站立举手
- 适用：立体摆件、全尺寸展示
- 特点：全身比例，动态活泼

### 爬行
- 适用：动态造型、故事感
- 特点：四足着地，小腿侧面展示

---

## 交付格式

发送完成后，附上：
1. 图纸清单（编号+类型+说明）
2. 建议雕刻顺序
3. 注意事项（比例、细节难点等）

---

## 版本记录

- **V1.0 (2026-04-14)**：初始版本。基于"肥美小腿腿"木雕设计项目经验固化。核心能力：三视图线稿+细节特写+成品预览，强制5趾检查。
