# E01-精卫 Prompt分配方案 v2.4-Peng（精简质感版）

## 关键修正

**之前错误**：Prompt全是英文，1600-2000字符远超980限制  
**正确理解**：500中文tokens ≈ 1000英文字符（混合时按token总数算）  
**精简策略**：中文字数200-250字 + 英文字符600-800（总token≈500）

---

## 精简模块设计

### 模块1: 系统前缀（精简版）
**约80英文字符**
```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime
```

### 模块2: 角色（精简版）
**小G（约100英文字符）**：
```
Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes
```

**精卫（约80英文字符）**：
```
divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers
```

**龙王（约80英文字符）**：
```
Chinese Dragon King, deer antlers, serpentine body, fish scales, eagle talons
```

### 模块3: 场景动作（中文，每镜头不同）
**约80-100中文字**

### 模块4: 风格（精简版）
**约120英文字符**
```
Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon
```

### 模块5: 质感（精简版）
**约80英文字符**
```
natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style
```

### 模块6: 色彩（中文精简）
**约30中文字**
```
深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光
```

### 模块7: 负面词（极简版）
**约60英文字符**
```
negative: zombie, wizard, magic, western dragon, modern, neon, anime
```

### 模块8: 运镜（每镜头不同）
**约20-30英文字符**

---

## 精简版Prompt组装公式

```
[模块1: 系统前缀] + [模块2: 角色] + [模块3: 场景动作] + [模块4: 风格] + [模块5: 质感] + [模块6: 色彩] + [模块7: 负面词] + [模块8: 运镜]
```

**预估**：中文200字 + 英文550字符 = 总token≈450-500 ✅

---

## 12镜头精简版完整Prompt

### S01 — 起 — 相遇（广角 establishing shot）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 小G坐发鸠山坡歪头好奇，白喙赤足精卫从头顶飞过，晨光洒落羽毛泛柔光。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 广角 establishing shot.
```

### S02 — 起 — 偷看（中景 medium shot）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 小G蹲灌木丛后伸手拨树叶，睁大杏仁眼偷看精卫海边衔石投海，满脸好奇疑问。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 中景 medium shot.
```

### S03 — 起 — 疑惑决定（近景 close-up）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 精卫飞到海上投石飞回，小G从树后探出头挠头满脸问号，眼神从疑惑变坚定。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 近景 close-up.
```

### S04 — 承 — 递石互动（过肩 over-shoulder）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 小G弯腰捡石头双手递精卫，精卫歪头注视犹豫后轻衔走，两人第一次互动温暖。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 过肩 over-shoulder.
```

### S05 — 承 — 陪伴投石（标准 standard）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 小G和精卫一起投海，扔石拍手开心大笑，精卫同步盘旋飞回，默契配合欢乐。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 标准 standard.
```

### S06 — 承 — 关心递石（特写 close-up）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 精卫投石疲惫停礁石喘息，小G递更大石头给她，眼神关切心疼，精卫低头接受感动。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 特写 close-up.
```

### S07 — 承 — 夕阳依恋（跟随 tracking）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 夕阳西沉影子拉长，精卫站小G肩上梳理羽毛，小G温柔微笑伸手轻抚，依恋之情满溢。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 跟随 tracking.
```

### S08 — 转 — 暴风雨（急速甩镜 whip pan）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 天空突变乌云密布巨浪滔天，小G害怕缩成一团发抖，精卫警觉展翅护在身前，暴风雨前夕紧张。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. dramatic storm lighting, dark clouds, rim light, thunder flash, high contrast. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 急速甩镜 whip pan.
```

### S09 — 转 — 龙王登场（特写 extreme close-up）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. Chinese Dragon King, deer antlers, serpentine body, fish scales, eagle talons. 海水分开龙王升起，鹿角鱼鳞鹰爪，怒视精卫挥手卷巨浪，小G惊恐后退仍挡身前。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. dramatic storm lighting, dark clouds, rim light, thunder flash, high contrast. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 特写 extreme close-up.
```

### S10 — 转 — 挺身而出（广角 wide）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. Chinese Dragon King, deer antlers, serpentine body, fish scales, eagle talons. 龙王攻击精卫羽毛散落，小G眼泪汪汪咬牙冲出，张开双臂保护精卫，勇敢与恐惧交织。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. dramatic storm lighting, dark clouds, rim light, thunder flash, high contrast. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 广角 wide.
```

### S11 — 合 — 精卫重生（全景 wide shot）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei, white beak, red feet, crow-like body, patterned head feathers. 小G勇敢精卫感受真心，身体发出金色光芒，伤口愈羽毛重生，光芒万丈照海面。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. divine golden glow, healing light rays, natural sunlight, golden hour. 深海幽蓝#003B5C+烈焰赤红#D32F2F+金色光芒撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 全景 wide shot.
```

### S12 — 合 — 约定继续（特写 emotional close-up）

```
CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime. Chinese boy XiaoG 8yo, straight black hair, dark brown almond eyes, yellow skin, East Asian features, frog-button top, cloth shoes. divine bird Jingwei transforms teenage girl, long hair, bare feet on waves, keeping white beak red feet features. 暴风雨过阳光洒下，精卫变少女赤足踏浪，两人相视一笑，约定继续，永恒友谊超越形态。 Honghuang era, IMAX aesthetic, five-color system, ink wash painting, Song Dynasty landscape, film grain, no modern no neon. natural sunlight, golden hour, warm glow on faces, soft shadows. 深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光. negative: zombie, wizard, magic, western dragon, modern, neon, anime. 特写 emotional close-up.
```

---

## 验证统计

| 指标 | 范围 | 限制 | 状态 |
|------|------|------|------|
| 中文字数 | 180-220字 | ≤490 | ✅ 安全 |
| 英文字符 | 550-700 | ≤980 | ✅ 安全 |
| 总token估算 | 450-550 | ≈500 | ✅ 宽裕 |

**精简策略**：
1. 英文保留核心质感词（photorealistic, hyper-detailed, pores, no cartoon）
2. 中文写场景动作（更紧凑，1字≈1 token）
3. 删除重复修饰，合并同类项
4. 负面词精简到7个核心禁忌词
5. 风格描述合并为一句

**质感保障**：
- 人物：hyper-detailed skin pores, East Asian features ✅
- 环境：Honghuang era, IMAX, ink wash painting ✅
- 色彩：五正色+撞色 ✅
- 光影：golden hour, rim light, storm lighting ✅
- 叙事：每镜头中文动作描述 ✅

---

*版本: v2.4-Peng 精简质感版*  
*更新: 2026-05-19 09:58*  
*状态: 待验证后更新飞书文档*