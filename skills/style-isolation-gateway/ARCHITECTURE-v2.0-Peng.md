# Global Style Isolation System v2.0-Peng — 架构设计文档

## 核心目标

建立与山海经系列**完全平行、零交叉**的写实风格工作流，用于科普/商业/宣传片视频制作。

**强制约束**：
- 科普/商业/宣传片 → **全部走写实风格**（背景、环境、人物、光影、色彩）
- 山海经/神话/剧情 → **走神话风格**（洪荒、水墨、东方美学）
- 两套系统**永不交叉、永不污染**

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│              项目配置 (Project Config)                        │
│              styleType: "documentary" | "drama"              │
│              一旦设定，全程不可更改                            │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Style Isolation Gateway v2.0-Peng                 │
│           风格隔离网关（系统唯一入口）                         │
├─────────────────────────────────────────────────────────────┤
│  1. 读取 styleType                                           │
│  2. 加载对应 Global Style Manifest                            │
│  3. 初始化完整工作流实例                                       │
│  4. 注册风格污染守卫                                           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
    ┌─────────────────────┐      ┌─────────────────────────┐
    │  Documentary Pipeline │      │  Shanhaijing Pipeline    │
    │  写实工作流             │      │  神话工作流               │
    │  (科普/商业/宣传片)      │      │  (山海经/剧情/神话)        │
    ├─────────────────────┤      ├─────────────────────────┤
    │ Character Engine     │      │ Character Manager        │
    │ 写实角色引擎            │      │ 神话角色管理器             │
    │ - 真实人类档案           │      │ - 神话人物/异兽档案         │
    │ - 写实服装/配饰          │      │ - 古风服装/神器            │
    │ - 皮肤毛孔/纹理          │      │ - 仙气/神兽特征            │
    ├─────────────────────┤      ├─────────────────────────┤
    │ Environment Renderer │      │ World Engine             │
    │ 写实环境渲染器          │      │ 洪荒世界引擎               │
    │ - 现代工作室/医疗空间     │      │ - 洪荒山水/浮空岛屿          │
    │ - 自然日光/专业灯光       │      │ - 水墨云雾/金色轮廓光        │
    │ - 真实材质反射          │      │ - 粒子效果/仙气流动          │
    ├─────────────────────┤      ├─────────────────────────┤
    │ Prompt Builder       │      │ Prompt Builder           │
    │ 写实Prompt构建器        │      │ 神话Prompt构建器           │
    │ - 8模块写实模板          │      │ - 8模块洪荒模板            │
    │ - 医疗白/浅蓝色彩系统     │      │ - 深海幽蓝/烈焰赤红          │
    │ - 34项写实负面防护        │      │ - 24项神话负面防护          │
    ├─────────────────────┤      ├─────────────────────────┤
    │ Shot Design          │      │ Shot Design              │
    │ 写实分镜设计            │      │ 神话分镜设计               │
    │ - 稳定三脚架/浅景深      │      │ - 甩镜硬切/极限密度          │
    │ - 柔和淡入淡出转场       │      │ - 水墨转场/粒子溶解          │
    ├─────────────────────┤      ├─────────────────────────┤
    │ Render Engine        │      │ Render Engine            │
    │ 写实渲染引擎            │      │ 神话渲染引擎               │
    │ - 角色参考图: reference_image│  │ - 角色参考图: reference_image│
    │ - 写实负面词自动注入       │      │ - 神话负面词自动注入          │
    ├─────────────────────┤      ├─────────────────────────┤
    │ Post-Production      │      │ Post-Production          │
    │ 写实后期制作            │      │ 神话后期制作               │
    │ - 自然色彩校正           │      │ - 水墨色调/金色增强          │
    │ - 清晰字幕/专业配音       │      │ - 古风字幕/史诗配乐          │
    └─────────────────────┘      └─────────────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                              ▼
              ┌─────────────────────────────┐
              │   Style Contamination Guard   │
              │   风格污染守卫（穿透所有Pipeline）│
              ├─────────────────────────────┤
              │ - 跨风格关键词实时检测          │
              │ - Prompt提交前强制校验          │
              │ - 检测到污染→自动拦截或修复      │
              │ - 记录污染日志，追溯责任        │
              └─────────────────────────────┘
```

---

## 风格宪法（Global Style Manifest）

### Documentary Style — 写实纪录片风格

#### 视觉基准
```javascript
visualBase: "CG cinematic, photorealistic, physically based rendering, hyper-detailed"
era: "modern contemporary, real-world setting, present day"
atmosphere: "clean, professional, educational, trustworthy, bright, naturalistic"
```

#### 光影系统
```javascript
lighting: "natural daylight 5600K from large left window, soft even illumination, no dead blacks, professional ring fill light, subtle warm accent from right, gentle shadows with full detail in dark areas"
```

#### 色彩系统
```javascript
colorPalette: [
  "医疗白 #FFFFFF",      // 主色调，干净专业
  "浅蓝 #E3F2FD",       // 辅助色，科技感
  "健康绿 #4CAF50",     // 安全/正常指标
  "警示橙 #FF9800",     // 警告/注意
  "暖木 #8D6E63",       // 环境温馨
  "深红 #D32F2F"        // 危险/异常
]
```

#### 材质与纹理
```javascript
texture: [
  "hyper-detailed skin pores and subsurface scattering visible",
  "natural skin texture with fine pores and subtle imperfections",
  "fabric weave texture on cotton uniforms",
  "realistic fur strand texture with natural gloss",
  "metal badge with oxidation marks and reflection",
  "wood grain texture on furniture",
  "glass refraction on laboratory equipment"
]
```

#### 运镜规范
```javascript
camera: [
  "stable tripod feel, smooth tracking",
  "shallow depth of field focusing on subject face",
  "eye-level camera angle, natural perspective",
  "medium shot for interaction scenes",
  "close-up for emotional moments",
  "wide shot for establishing environment",
  "soft fade in/out transitions between segments"
]
```

#### 角色规范（人类）
```javascript
humanCharacter: {
  skin: "realistic skin texture with visible pores, subsurface scattering, natural skin tone variations",
  hair: "natural hair strands with realistic texture, slight imperfections, natural color",
  eyes: "proportionally sized eyes with natural moisture, realistic iris texture, natural reflection",
  clothing: "professional modern attire with fabric texture, realistic folds and draping",
  expression: "natural human expressions, subtle emotional cues, no exaggerated theatrical poses"
}
```

#### 角色规范（CG生物/演示对象）
```javascript
creatureCharacter: {
  anatomy: "anatomically correct proportions, realistic musculature under skin/fur",
  fur: "realistic fur strand texture, natural gloss, individual strands visible",
  expression: "naturalistic animal expressions, alert but not anthropomorphized",
  movement: "natural animal locomotion, realistic physics, no cartoonish exaggeration"
}
```

#### 环境规范
```javascript
environment: {
  type: "modern professional studio, medical office, clean educational space",
  elements: [
    "white walls with subtle texture",
    "light wood floor or gray anti-slip mat",
    "large floor-to-ceiling windows with natural light",
    "medical equipment with realistic materials",
    "bookshelves with anatomy models and books",
    "whiteboard or LED display screen",
    "professional lighting fixtures"
  ],
  forbidden: [
    "ancient Chinese architecture",
    "floating islands or spiritual mist",
    "mythical landscape elements",
    "ink wash painting backgrounds",
    "fantasy lighting effects"
  ]
}
```

#### 负面防护词库（34项核心）
```
no cartoon, no anime, no 3D render look, no plastic skin, no wax skin,
no porcelain skin, no mannequin, no doll, no puppet, no fluffy, no cute,
no chibi, no kawaii, no big eyes, no exaggerated expression, no staged,
no artificial pose, no mascot, no disney, no pixar, no toon shading,
no toy-like, no figurine, no horror, no scary, no neon, no cyberpunk,
no oversaturated, no oversmoothed, no uncanny valley, no low quality,
no blurry, no watermark, no text overlay
```

---

### Drama Style — 山海经神话风格

#### 视觉基准
```javascript
visualBase: "CG cinematic, photorealistic, epic"
era: "Honghuang era, ancient Chinese mythology, primordial world"
atmosphere: "mystical, ancient, powerful, ink wash painting atmosphere, Song Dynasty landscape"
```

#### 光影系统
```javascript
lighting: "natural sunlight, golden hour, rim light, volumetric god rays, ink wash painting atmosphere, dramatic contrast between light and shadow"
```

#### 色彩系统
```javascript
colorPalette: [
  "深海幽蓝 #003B5C",   // 主色调
  "烈焰赤红 #D32F2F",   // 强调色
  "墨色 #1A1A1A",       // 水墨
  "宣纸黄 #F5F5DC",     // 古风
  "金色轮廓光"           // 神性
]
```

#### 材质与纹理
```javascript
texture: [
  "ink wash painting texture, Song Dynasty landscape style",
  "ancient stone texture with weathering marks",
  "mythical beast fur/scales with spiritual glow",
  "traditional silk fabric with embroidery",
  "jade and bronze artifacts with patina"
]
```

#### 运镜规范
```javascript
camera: [
  "dynamic whip pan for action sequences",
  "flash cuts for emotional beats",
  "extreme close-ups for dramatic moments",
  "epic wide shots for world establishing",
  "slow motion for mythical reveals",
  "particle dissolve transitions"
]
```

#### 角色规范（神话人物）
```javascript
mythCharacter: {
  skin: "ethereal skin with subtle glow, divine light from within",
  hair: "flowing hair with spiritual movement, subtle shimmer",
  eyes: "intense gaze with supernatural depth, glowing pupils",
  clothing: "traditional Chinese divine attire, flowing silk, jade ornaments",
  aura: "subtle golden rim light, particle effects around body"
}
```

#### 角色规范（神话异兽）
```javascript
beastCharacter: {
  anatomy: "mythical proportions from Shanhaijing, exaggerated but majestic",
  fur_scales: "mystical fur with spiritual glow, scales with iridescent sheen",
  expression: "powerful and ancient, conveying wisdom and otherworldliness",
  aura: "surrounded by natural elements - fire, water, wind, earth particles"
}
```

#### 环境规范
```javascript
environment: {
  type: "ancient Chinese mountains and rivers, primordial wilderness, floating islands",
  elements: [
    "floating islands in mist",
    "ancient trees with spiritual glow",
    "mystical light beams through clouds",
    "ink wash painting style mountains",
    "spiritual mist and particles",
    "jade and bronze ruins"
  ],
  forbidden: [
    "modern buildings or technology",
    "medical equipment or whiteboards",
    "contemporary clothing",
    "modern lighting fixtures"
  ]
}
```

#### 负面防护词库（24项核心）
```
no zombie, no wizard, no magic spell, no western dragon, no modern clothing,
no anime, no cartoon, no 3D render look, no plastic skin, no porcelain skin,
no wax skin, no mannequin, no doll, no puppet, no horror, no scary,
no neon, no cyberpunk, no oversaturated, no oversmoothed, no low quality,
no blurry, no watermark, no text overlay
```

---

## 风格污染防御系统

### 污染类型

| 类型 | 描述 | 示例 | 检测方式 |
|------|------|------|---------|
| Era污染 | 时代背景混入 | 写实Prompt中出现"Honghuang era" | 关键词匹配 |
| Atmosphere污染 | 氛围混入 | 写实Prompt中出现"mystical mist" | 关键词匹配 |
| Color污染 | 色彩系统混入 | 写实Prompt中出现"深海幽蓝" | HEX色值+关键词匹配 |
| Camera污染 | 运镜混入 | 写实Prompt中出现"whip pan" | 关键词匹配 |
| Character污染 | 角色描述混入 | 写实人物出现"divine glow" | 关键词匹配 |
| Environment污染 | 环境混入 | 写实场景出现"floating islands" | 关键词匹配 |
| Negative污染 | 负面词混入 | 写实Prompt缺少"no cartoon" | 完整性检查 |

### 检测规则

```javascript
CONTAMINATION_RULES = {
  documentary: {
    forbiddenKeywords: [
      // 神话时代关键词
      "Honghuang", "ancient Chinese mythology", "primordial",
      "Shanhaijing", "洪荒", "上古", "神话",
      // 神话氛围关键词
      "mystical", "spiritual mist", "god rays", "divine glow",
      "仙气", "神性", "水墨意境",
      // 神话色彩
      "深海幽蓝", "烈焰赤红", "宣纸黄",
      // 神话运镜
      "whip pan", "flash cuts", "particle dissolve",
      // 神话环境
      "floating islands", "ancient trees with spiritual glow",
      "浮空岛屿", "仙山"
    ],
    requiredKeywords: [
      "photorealistic",
      "natural",
      "modern"
    ],
    requiredNegatives: [
      "no cartoon", "no anime", "no 3D render look",
      "no plastic skin", "no wax skin"
    ]
  },
  
  drama: {
    forbiddenKeywords: [
      // 现代关键词
      "modern studio", "medical office", "whiteboard",
      "medical equipment", "laboratory",
      "现代医学", "实验室", "工作室",
      // 现代色彩
      "医疗白", "浅蓝", "健康绿",
      // 现代运镜
      "tripod feel", "stable tracking",
      // 现代角色
      "nurse uniform", "police badge", "medical manual"
    ],
    requiredKeywords: [
      "epic", "ancient", "mythology"
    ],
    requiredNegatives: [
      "no modern", "no contemporary", "no anime"
    ]
  }
}
```

### 防御流程

```
Prompt生成 → 风格污染检测 → [通过] → 提交渲染
                    ↓
              [检测到污染]
                    ↓
              自动修复尝试
                    ↓
         ┌─────────┴─────────┐
         ↓                   ↓
    [修复成功]            [修复失败]
         ↓                   ↓
    记录日志              拒绝提交
    继续渲染              报错通知
```

---

## 下游模块集成

### Shot Design 集成

```javascript
// shot-design.js
const { StyleIsolationGateway } = require('../style-isolation-gateway');

function generateShotPrompt(shotConfig) {
  const gateway = new StyleIsolationGateway();
  const style = gateway.getStyleManifest(); // 自动读取项目配置的 styleType
  
  if (style.type === 'documentary') {
    // 使用写实Prompt构建器
    return buildDocumentaryPrompt(shotConfig, style);
  } else {
    // 使用神话Prompt构建器
    return buildDramaPrompt(shotConfig, style);
  }
}
```

### Render Engine 集成

```javascript
// render-engine.js
const { StyleContaminationGuard } = require('../style-isolation-gateway');

async function submitRender(prompt, characterRefs) {
  const guard = new StyleContaminationGuard();
  
  // 强制风格检查
  const check = guard.validate(prompt);
  if (!check.passed) {
    console.error(`❌ 风格污染拦截: ${check.violations.map(v => v.message).join(', ')}`);
    throw new Error(`Style contamination detected: ${check.violations.length} violations`);
  }
  
  // 自动注入风格化负面防护
  const finalPrompt = guard.injectNegatives(prompt);
  
  // 提交渲染...
}
```

### Post-Production 集成

```javascript
// post-production.js
const { StyleIsolationGateway } = require('../style-isolation-gateway');

function buildPostProductionConfig() {
  const gateway = new StyleIsolationGateway();
  const style = gateway.getStyleManifest();
  
  return {
    colorGrading: style.postProduction.colorGrading,
    transitions: style.postProduction.transitions,
    subtitleStyle: style.postProduction.subtitleStyle,
    audioStyle: style.postProduction.audioStyle
  };
}
```

---

## 使用方式

### 1. 项目初始化

```javascript
const { StyleIsolationGateway } = require('./style-isolation-gateway');

// 科普视频项目
const project = new StyleIsolationGateway({
  styleType: 'documentary',  // ← 强制指定，一旦设定不可更改
  projectName: '健康小课堂-E01',
  category: 'health-education'
});

// 山海经项目
const project = new StyleIsolationGateway({
  styleType: 'drama',       // ← 强制指定，一旦设定不可更改
  projectName: '烛龙觉醒-E01',
  category: 'mythology-drama'
});
```

### 2. 全流程自动隔离

一旦初始化，所有下游模块自动应用对应风格：
- 角色描述 → 自动使用写实/神话角色规范
- 环境描述 → 自动使用现代/洪荒环境规范
- Prompt构建 → 自动使用对应模板和色彩系统
- 负面防护 → 自动注入对应禁用词库
- 后期调色 → 自动应用对应色彩校正

### 3. 风格污染自动拦截

所有Prompt在提交前自动通过 `StyleContaminationGuard` 检查：
- 检测到跨风格关键词 → 自动修复或拒绝
- 记录污染日志 → 方便追溯和调试
- 强制通过后才能提交渲染

---

## 文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| global-style-manifest.js | skills/style-isolation-gateway/ | 全局风格宪法，两种风格的完整规范 |
| style-isolation-gateway.js | skills/style-isolation-gateway/ | 风格隔离网关，系统入口 |
| documentary-prompt-builder.js | skills/style-isolation-gateway/ | 写实Prompt构建器 |
| style-contamination-guard.js | skills/style-isolation-gateway/ | 风格污染守卫 |
| SKILL.md | skills/style-isolation-gateway/ | 使用文档 |

---

## 版本信息

- **版本**: v2.0-Peng
- **发布时间**: 2026-05-20
- **设计目标**: 全局风格隔离，科普/商业/宣传片强制写实，山海经强制神话
- **兼容性**: 与现有shanhaijing-director系统完全平行，零交叉

---

## 下一步

1. 实现核心代码（global-style-manifest.js, style-isolation-gateway.js, documentary-prompt-builder.js, style-contamination-guard.js）
2. 集成到现有shanhaijing-director和documentary-director
3. 为健康小课堂E01项目启用documentary工作流
4. 端到端测试验证风格隔离效果