# Style Isolation Gateway v2.0-Peng

## 全局风格隔离系统

为科普/商业/宣传片视频与山海经神话视频提供**完全平行、零交叉**的风格工作流。

---

## 核心原理

```
项目配置 → Style Isolation Gateway → 自动路由到正确的工作流
                                    ├── Documentary Pipeline（写实）
                                    └── Drama Pipeline（神话）
```

- **风格宪法（Global Style Manifest）**：两种风格的完整规范定义
- **风格隔离网关（Style Isolation Gateway）**：系统唯一入口，锁定风格后不可切换
- **写实Prompt构建器（Documentary Prompt Builder）**：独立构建写实Prompt
- **风格污染守卫（Style Contamination Guard）**：穿透所有Pipeline的防御层

---

## 文件清单

| 文件 | 说明 |
|------|------|
| `global-style-manifest.js` | 全局风格宪法，定义documentary和drama两种风格的完整规范 |
| `style-isolation-gateway.js` | 风格隔离网关，项目初始化入口，锁定风格 |
| `documentary-prompt-builder.js` | 写实Prompt构建器，独立构建符合写实风格的Prompt |
| `style-contamination-guard.js` | 风格污染守卫，检测并拦截跨风格关键词 |

---

## 快速使用

### 1. 初始化项目（科普/商业/宣传片）

```javascript
const { StyleIsolationGateway } = require('./style-isolation-gateway');

const gateway = new StyleIsolationGateway({
  styleType: 'documentary',      // ← 强制指定，一旦设定不可更改
  projectName: '健康小课堂-E01',
  category: 'health-education'
});

gateway.printSummary();          // 打印风格配置摘要
```

### 2. 获取风格配置

```javascript
// 光影系统
gateway.getLighting();

// 色彩系统
gateway.getColorPalette();

// 负面词列表
gateway.getNegativeList();

// 角色规范
gateway.getCharacterSpec('human');      // 人类角色
gateway.getCharacterSpec('creature');   // CG生物角色

// 环境规范
gateway.getEnvironmentType();
gateway.getEnvironmentElements();
gateway.getForbiddenEnvironmentElements();

// 后期制作规范
gateway.getPostProductionConfig();
```

### 3. 构建写实Prompt

```javascript
const { DocumentaryPromptBuilder } = require('./documentary-prompt-builder');

const builder = new DocumentaryPromptBuilder(gateway);

const shot = {
  id: 'S01',
  name: '开场建置',
  duration: 5,
  characters: [
    { name: 'chen', type: 'human', role: 'nurse', action: 'standing in front of whiteboard explaining' },
    { name: 'xiaog', type: 'human', role: 'boy', action: 'sitting on stool looking up' }
  ],
  environment: 'bright modern health education studio',
  camera: 'medium shot eye-level',
  medicalDetail: 'whiteboard with muscle anatomy diagram'
};

const prompt = builder.buildPrompt(shot);
console.log(`Prompt长度: ${prompt.length}字符`);
```

### 4. 风格污染检测

```javascript
const { StyleContaminationGuard } = require('./style-contamination-guard');

const guard = new StyleContaminationGuard(gateway);

// 全面检查
const result = guard.validate(promptText);
if (!result.passed) {
  console.error('❌ Prompt未通过风格检查');
  result.allViolations.forEach(v => {
    console.log(`${v.level === 'critical' ? '❌' : '⚠️'} ${v.message}`);
  });
}

// 快速检查（仅检测CRITICAL级别）
if (!guard.quickCheck(promptText)) {
  console.error('❌ 检测到严重风格污染');
}

// 自动修复
const fixResult = guard.validate(contaminatedPrompt, { autoFix: true });
if (fixResult.fixedPrompt) {
  console.log('✅ 已自动修复:', fixResult.fixedPrompt);
}
```

### 5. 提交渲染前的强制检查

```javascript
// 在render-engine.js中集成
const guard = new StyleContaminationGuard(gateway);

async function submitRender(prompt, characterRefs) {
  const check = guard.validate(prompt);
  if (!check.passed) {
    throw new Error(`风格污染拦截: ${check.violations.map(v => v.message).join(', ')}`);
  }
  
  // 自动注入负面防护
  const finalPrompt = gateway.injectNegatives(prompt);
  
  // 提交渲染...
}
```

---

## 两种风格对比

| 维度 | Documentary（写实） | Drama（山海经） |
|------|-------------------|----------------|
| **视觉基准** | CG cinematic photorealistic | CG cinematic epic ancient Chinese mythology |
| **时代背景** | modern contemporary, present day | Honghuang era, primordial world |
| **光影系统** | natural daylight 5600K, soft even | golden hour, rim light, god rays |
| **色彩系统** | 医疗白#FFFFFF, 浅蓝#E3F2FD, 健康绿#4CAF50 | 深海幽蓝#003B5C, 烈焰赤红#D32F2F, 宣纸黄#F5F5DC |
| **运镜** | stable tripod, shallow DOF, fade transitions | whip pan, flash cuts, particle dissolve |
| **环境** | 现代工作室, 医疗空间, 白色墙壁 | 洪荒山水, 浮空岛屿,  spiritual mist |
| **角色** | 毛孔/纹理/真实服装 | 仙气/神性/ flowing silk robes |
| **负面词** | 40项（禁用卡通/塑料/恐怖） | 28项（禁用现代/当代/技术） |

---

## 风格污染检测

### Documentary项目禁用词（55项）

- **时代背景**: Honghuang, 洪荒, 上古, 神话, 仙侠, 修仙, Shanhaijing, 山海经风格
- **氛围**: mystical, spiritual mist, god rays, divine glow, 仙气, 神性, 水墨意境
- **色彩**: 深海幽蓝, 烈焰赤红, 宣纸黄, 金色轮廓光
- **运镜**: whip pan, flash cuts, particle dissolve
- **环境**: floating islands, 浮空岛屿, 仙山, 洞天福地
- **角色**: divine attire, flowing silk robes, jade ornaments, ethereal skin, 仙气缭绕
- **材质**: ink wash painting texture, Song Dynasty landscape

### Drama项目禁用词（37项）

- **现代环境**: modern studio, medical office, whiteboard, laboratory, 现代医学, 实验室, 工作室
- **现代色彩**: 医疗白, 浅蓝, 健康绿, 警示橙, 暖木
- **现代运镜**: tripod feel, stable tracking, soft fade in
- **现代角色**: nurse uniform, police badge, medical manual, white nurse shoes
- **现代材质**: professional ring fill light, shadowless lamp, LED display screen

---

## 下游模块集成

### Shot Design 集成

```javascript
const { StyleIsolationGateway } = require('./style-isolation-gateway');

function generateShot(shotConfig, projectConfig) {
  const gateway = new StyleIsolationGateway(projectConfig);
  const manifest = gateway.getManifest();
  
  // 自动应用对应风格的分镜模板
  return {
    ...shotConfig,
    style: manifest.id,
    visual: manifest.visual,
    character: gateway.getCharacterSpec(shotConfig.characterType),
    environment: gateway.getEnvironmentType(),
    negative: gateway.getNegativeList()
  };
}
```

### Render Engine 集成

```javascript
const { StyleContaminationGuard } = require('./style-contamination-guard');

async function render(shot) {
  const guard = new StyleContaminationGuard(gateway);
  
  const check = guard.validate(shot.prompt);
  if (!check.passed) {
    throw new Error(`渲染被拦截: ${check.level}级别污染`);
  }
  
  const finalPrompt = gateway.injectNegatives(shot.prompt);
  return await seedanceAPI.submit({ prompt: finalPrompt, refs: shot.characterRefs });
}
```

### Post-Production 集成

```javascript
function buildPostConfig(gateway) {
  const pp = gateway.getPostProductionConfig();
  return {
    colorGrading: pp.colorGrading,
    transitions: pp.transitions,
    subtitleStyle: pp.subtitleStyle,
    audioStyle: pp.audioStyle
  };
}
```

---

## 自动风格检测

```javascript
const { StyleIsolationGateway } = require('./style-isolation-gateway');

// 根据项目类别自动检测
const styleType = StyleIsolationGateway.autoDetectStyleType('health-education');
// → 'documentary'

const styleType2 = StyleIsolationGateway.autoDetectStyleType('mythology-epic');
// → 'drama'
```

自动检测规则：
- **写实类关键词**: health, education, documentary, commercial, product, promotion, science, medical, 科普, 宣传片, 产品介绍, 教育, 健康, 医疗, 营销, 广告, 商业
- **神话类关键词**: drama, mythology, fantasy, Shanhaijing, story, epic, narrative, 神话, 山海经, 剧情, 史诗, 玄幻, 洪荒, 志怪, 传说
- **默认**: documentary（安全默认）

---

## 版本信息

- **版本**: v2.0-Peng
- **发布时间**: 2026-05-20
- **设计目标**: 全局风格隔离，两套工作流零交叉
- **兼容性**: 与现有shanhaijing-director系统完全平行，零干扰

---

## 架构文档

详见 `ARCHITECTURE-v2.0-Peng.md`