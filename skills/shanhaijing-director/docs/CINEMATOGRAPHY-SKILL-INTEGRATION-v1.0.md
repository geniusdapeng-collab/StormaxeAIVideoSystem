# 好莱坞技能工厂 × 主链路集成方案 v1.0

> **日期**: 2026-06-10
> **版本**: v1.0-Peng
> **状态**: 已实现 `cinematography-skill-router.js`

---

## 一、现状问题

**问题**：149个好莱坞专业技能（镜头级）躺在 `skills/好莱坞工业电影技能工厂/技能系列/镜头级专项/` 里，但主链路（director-pipeline.js）在生成每个镜头的提示词时，**完全依赖 LLM 的随机发挥**，没有调用这些专业技能。

**结果**：LLM 生成的提示词缺乏导演级专业性，例如：
- 不知道"维伦纽瓦的 IMAX 航拍 = 极长停留 + 沉默 + 宿命论"
- 不知道"雨夜手持 = 低光源 + 湿地面反射 + 紧张斯坦尼康"
- 不知道具体的技术参数（焦距/光圈/航拍高度/斯坦尼康运动轨迹）

---

## 二、解决方案：技能路由集成层

### 架构图

```
director-pipeline.js (Stage 8 Shot Design 之后)
       │
       ▼
┌──────────────────────────────────────┐
│  cinematography-skill-router.js      │
│  ─────────────────────────────────   │
│  输入：shot 元数据                    │
│  ├── type      (剧情/科幻/战争/恐怖)  │
│  ├── director  (维伦纽瓦/诺兰/卡梅隆) │
│  ├── emotion   (史诗/孤独/紧张/舞蹈)  │
│  ├── shotType  (航拍/斯坦尼康/手持)   │
│  ├── lighting  (晨光/雨夜/IMAX)      │
│  └── tech      (IMAX/VR/3D)          │
│         │                              │
│         ▼                              │
│  匹配：score 排名 top-N 技能           │
│  输出：增强后的 shot (字段注入)         │
└──────────────────────────────────────┘
       │
       ▼
  Seedance Prompt (各字段已增强)
```

### 技术突破

**突破1：复合情绪词解析**
- `史诗航拍_IMAX` → emotion=史诗, shotType=航拍, tech=IMAX
- `紧张斯坦尼康` → emotion=紧张, shotType=斯坦尼康
- `紧张追逐_斯坦尼康` → emotion=紧张追逐, shotType=斯坦尼康

**突破2：多维索引 + 加权评分**
- 类型+导演+情绪 = 30分（最精确）
- 类型+导演 = 20分
- 类型+情绪 = 15分
- 类型+导演+镜头类型 = 35分
- 类型+导演+IMAX技术标签 = 40分（最高优先级）
- 雨夜/航拍/舞蹈特殊处理 = +20~25分

---

## 三、集成点

### 集成位置（待接入主链路）

**推荐接入点**：Stage 8（Shot Design）之后，Stage 8.3（Quality Calibration）之前

```
Stage 8:  Shot Design（LLM生成各字段）
     │
     ▼
Stage 8.1: Skill Routing（新增：技能路由注入）← 这里接入
     │
     ▼
Stage 8.3: Quality Calibration（原末尾质检）
```

### 接入代码（伪代码）

```javascript
// director-pipeline.js Stage 8 之后插入
const { routeAndEnhance } = require('./scripts/cinematography-skill-router');

// 对每个 shot 应用技能路由
const skillRouter = require('./scripts/cinematography-skill-router');
const { enhancedShots, report } = skillRouter.routeAndEnhance(shots, {
  minScore: 30,    // 只注入高置信度的匹配
  maxSkillsPerShot: 2  // 最多2个技能
});

// 记录报告（供人工审核）
console.log(`[SkillRouter] ${report.enhancedShots}/${report.totalShots} shots enhanced`);
console.log(`[SkillRouter] Skills used: ${report.skillsUsed.join(', ')}`);

// 继续 Stage 8.3...
```

---

## 四、技能库索引（149个镜头级专项）

### 按类型分布

| 类型 | 数量 | 导演覆盖 |
|------|------|---------|
| 剧情 | 36 | 卢卡斯/库布里克/斯皮尔伯格/维伦纽瓦/诺兰/斯科塞斯/昆汀/达米恩/韦斯安德森/索金 |
| 科幻 | 17 | 维伦纽瓦/卡梅隆/卢卡斯/库布里克/斯皮尔伯格/诺兰 |
| 战争 | 16 | 卡梅隆/卢卡斯/库布里克/斯皮尔伯格/维伦纽瓦/诺兰 |
| 喜剧 | 17 | 卡梅隆/卢卡斯/库布里克/斯皮尔伯格/维伦纽瓦/诺兰 |
| 恐怖 | 5 | 库布里克/维伦纽瓦/诺兰 |
| 悬疑 | 1 | 希区柯克 |
| 惊悚 | 3 | 大卫林奇/斯科塞斯/芬奇 |
| 孤独 | 3 | 午夜独醒/热闹中的寂静/镜子里的陌生人 |
| 微表情 | 34 | 德尼罗/卡萨维茨/曼/斯派克琼斯/斯科塞斯/芬奇/黑泽明 |

### 高价值技能（建议优先体验）

| 技能文件 | 适用场景 | 增强价值 |
|---------|---------|---------|
| `科幻_维伦纽瓦_史诗航拍_IMAX.md` | 科幻史诗航拍 | IMAX全画幅+宿命论+沉默美学 |
| `战争_诺兰_史诗斯坦尼康.md` | 战争史诗 | 敦刻尔克式长斯坦尼康+低频配乐 |
| `剧情_诺兰_雨夜手持.md` | 雨夜紧张 | 低光源+湿地面反射+斯坦尼康 |
| `微表情_德尼罗_方法演技.md` | 角色特写 | 方法演技式微表情控制 |
| `科幻_诺兰_浪漫斯坦尼康.md` | 科幻浪漫 |星际穿越式斯坦尼康+宇宙孤独 |
| `战争_库布里克_情感斯坦尼康.md` | 战争情感 | 全金属外壳式斯坦尼康+压抑 |
| `恐怖_库布里克_恐怖斯坦尼康.md` | 恐怖场景 | 闪灵式斯坦尼康+压抑+对称构图 |
| `孤独_镜子里的陌生人.md` | 孤独特写 | 身份认知+镜像反射+无声表演 |

---

## 五、增强注入规则

### 各字段增强策略

| 目标字段 | 注入内容 | 注入方式 |
|---------|---------|---------|
| `NegativePrompt` | 禁止词清单 | 追加到末尾 |
| `Camera` | 镜头类型/焦距/运动轨迹 | 追加到末尾 |
| `Mood` | 情绪设计/氛围词 | 追加到末尾 |
| `Lighting` | 光线设计方案 | 追加到末尾 |
| `_appliedSkills` | 已应用的技能元数据 | 新增字段（供溯源） |

### 注入示例

**原始 shot**：
```json
{
  "camera": "aerial shot, helicopter",
  "mood": "epic, destiny",
  "negativePrompt": "cartoon, anime style"
}
```

**匹配技能**：`科幻_维伦纽瓦_史诗航拍_IMAX.md` (score=145)

**增强后**：
```json
{
  "camera": "aerial shot, helicopter\n[CINEMATOGRAPHY_SKILL]\naerial: extreme wide (15mm IMAX), 500-1500ft altitude, meditative pace, arc trajectory approaching subject",
  "mood": "epic, destiny\n[EMOTION_SKILL]\nLayer 1: IMAX full frame endless vertical scale\nLayer 2: 30+ second holds, no escape for viewer\nLayer 3: silence or minimal low-frequency ambient",
  "negativePrompt": "cartoon, anime style\n[FORBIDDEN]\n❌ fast cuts during aerial shots\n❌ triumphant orchestral music during aerial\n❌ excited/energetic camera movement",
  "_appliedSkills": [{
    "file": "科幻_维伦纽瓦_史诗航拍_IMAX.md",
    "score": 145,
    "type": "科幻",
    "director": "维伦纽瓦",
    "emotion": "史诗"
  }]
}
```

---

## 六、置信度控制

### minScore 参数

- `minScore ≥ 40`：高置信度，精确匹配（类型+导演+情绪，或类型+导演+镜头）
- `minScore ≥ 30`：中高置信度，类型+导演 或 类型+情绪+镜头
- `minScore ≥ 15`：低置信度，仅类型匹配

**建议**：首次使用设置 `minScore=30`，确保只有高质量匹配才注入。

### 人工审核模式（dryRun）

```javascript
// 人工审核模式：不实际注入，只输出匹配报告
const { enhancedShots, report } = routeAndEnhance(shots, {
  dryRun: true,  // 不修改shots，只输出报告
  minScore: 30,
  maxSkillsPerShot: 3
});

// 人工确认后再执行注入
const { enhancedShots } = routeAndEnhance(shots, {
  dryRun: false,
  minScore: 30
});
```

---

## 七、后续扩展方向

### 扩展1：多技能叠加（跨维度组合）
- 同一镜头调用多个技能（如：诺兰式紧张 + 雨夜手持）
- 需要解决冲突检测（同字段不同值）

### 扩展2：微观表情专项集成
- 34个微表情技能接入 character-consistency-engine
- 在角色定妆照环节注入微表情表演规范

### 扩展3：导演风格迁移
- 用户可指定"本片整体风格 = 维伦纽瓦"
- 全片镜头统一应用维伦纽瓦评分加权

### 扩展4：动态场景适配
- 技能库接入场景类型适配（narrative-rhythm-engine 输出）
- 自动识别当前镜头在故事弧中的位置，选择合适的情绪节奏技能

---

## 八、文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| `cinematography-skill-router.js` | `skills/shanhaijing-director/scripts/` | 技能路由核心模块 |
| `好莱坞工业电影技能工厂/` | `skills/` | 149个镜头级技能（源数据） |
| `CINEMATOGRAPHY-SKILL-INTEGRATION-v1.0.md` | `skills/shanhaijing-director/docs/` | 本规格文档 |

---

## 九、验证结果

```
测试场景：sci-fi维伦纽瓦IMAX航拍镜头
匹配结果：科幻_维伦纽瓦_史诗航拍_IMAX.md (score=145分)
次选技能：科幻_维伦纽瓦_悬疑手持.md (45分), 科幻_维伦纽瓦_悬疑斯坦尼康.md (45分)

测试场景：雨夜手持跟拍
匹配结果：剧情_卢卡斯_雨夜斯坦尼康.md (35分)
次选技能：剧情_库布里克_雨夜手持.md (35分)

测试场景：舞蹈斯坦尼康
匹配结果：剧情_斯科塞斯_舞蹈斯坦尼康.md (40分)
次选技能：剧情_昆汀_舞蹈手持.md (40分)
```
