# Documentary Director System v1.0-Peng

## 写实纪录片导演系统 — 完整生产流水线

基于底层四个模块（风格宪法/网关/构建器/守卫）构建的上层导演系统。

---

## 系统架构

```
用户输入主题+角色 → DocumentaryDirector.produce() → 一键出片
                      ├── CharacterManager（写实角色档案）
                      ├── CharacterGenerator（定妆照生成 — 7维分析+合规+Prompt）
                      ├── SceneLibrary（写实场景模板）
                      ├── ShotEngine（分镜模板）
                      ├── PromptBuilder（自动注入写实风格）
                      ├── Guard（风格拦截）
                      ├── RenderEngine（提交Seedance）
                      ├── SubtitleEngine（字幕+TTS）
                      └── PostEngine（调色+合成）
```

---

## 核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 导演调度器 | `documentary-director.js` | 一键生产，完整10步流程 |
| 角色管理器 | `documentary-character-manager.js` | 写实角色档案，自动引用定妆照 |
| **定妆照生成器** | `documentary-character-generator.js` | 主调度器：7维分析→合规→Prompt |
| **角色分析器** | `character-analyzer.js` | 7维分析模型，结构化角色描述 |
| **合规守卫** | `compliance-guard.js` | 三级合规检测（L1/L2/L3） |
| **提示词架构师** | `prompt-architect.js` | 6层Prompt构建（主体→服装→配饰→表情→环境→技术） |
| 场景库 | `documentary-scene-library.js` | 写实场景模板，自动注入环境/光影/色彩 |

---

## 快速使用

### 方式一：一键生产（全自动）

```javascript
const { DocumentaryDirector } = require('./documentary-director');

const director = new DocumentaryDirector({
  projectName: 'health-e01-rhabdomyolysis',
  category: 'health-education'
});

const result = await director.produce({
  title: '什么是横纹肌溶解',
  duration: 59,
  characters: ['chen-nurse', 'xiaog-boy'],
  sceneType: 'medical-studio',
  scriptContent: {
    intro: '小朋友们，今天我们来认识一个很重要的健康知识',
    body: [
      '横纹肌溶解是指肌肉细胞受损后内容物释放到血液里',
      '常见原因包括过度运动、外伤或某些药物',
      '如果发现肌肉疼痛或尿液颜色变深，一定要及时就医'
    ],
    conclusion: '记住，适度运动，多喝水，保护好自己的身体'
  }
});

console.log('成片:', result.finalVideo);
console.log('定妆照方案:', result.characterPhotoPlans);
```

### 方式二：仅生成定妆照

```javascript
const { DocumentaryCharacterGenerator } = require('./documentary-character-generator');

const generator = new DocumentaryCharacterGenerator();

const plan = generator.generatePlan({
  name: '陈女士',
  description: '25-28岁东亚女性护士，穿藏青色护士制服，佩戴红十字徽章',
  age: 26,
  profession: 'nurse'
}, {
  shotType: 'portrait',
  generateRefAngles: ['front-full', 'front-closeup', 'profile-left']
});

console.log('正向Prompt:', plan.generation.positivePrompt);
console.log('负面Prompt:', plan.generation.negativePrompt);
console.log('合规审核:', plan.compliance.reviewReport);
```

---

## 内置角色

| 角色ID | 名称 | 定妆照角度 | 适用场景 |
|--------|------|-----------|---------|
| `chen-nurse` | 穿警服的护士陈女士 | front-full, front-closeup, profile-left, profile-right, action-seated, action-walking | 健康科普、医疗教育 |
| `xiaog-boy` | 8岁小男孩小G | front-full, front-closeup, profile-left, sitting, standing, curious | 儿童科普、家庭场景 |
| `product-model` | 产品展示模特 | front-full, front-closeup, hands-product, profile | 产品营销、商业宣传 |

---

## 内置场景

| 场景ID | 名称 | 类别 | 适用场景 |
|--------|------|------|---------|
| `medical-studio` | 医疗教育工作室 | health-education | 健康科普、医学教育 |
| `product-showcase` | 产品展示空间 | commercial-promotion | 产品介绍、电商展示 |
| `corporate-office` | 现代企业办公室 | corporate-promotion | 商业宣传、企业介绍 |
| `kitchen-lifestyle` | 现代家居厨房 | lifestyle | 生活方式、美食内容 |

---

## Prompt字符控制

- **上限**: 980字符（Seedance 2.0限制）
- **当前控制**: 平均960字符，最长972字符
- **策略**: 极简角色描述(60-100字符) + 极简场景(80-100字符) + 极简光影(40字符) + 34项核心负面防护(170字符)

---

## 与山海经系统的关系

两套系统完全平行、零交叉：
- **角色档案隔离**: `documentary-characters/` vs `shanhaijing-characters/`
- **场景模板隔离**: 医疗工作室 vs 洪荒山水
- **Prompt模板隔离**: 5600K日光 vs golden hour rim light
- **风格宪法隔离**: Documentary Manifest vs Drama Manifest

---

## 下一步（Phase 2）

- `documentary-shot-engine.js` — 更丰富的分镜模板
- `documentary-post-engine.js` — FFmpeg后期合成
- 端到端测试 — 用《健康小课堂-E01》完整跑通

### 定妆照生成器 (documentary-character-generator.js)

**借鉴自**：Character Photo Generator Skill（定妆照生成专家）

**核心机制**：

| 子模块 | 文件 | 职责 | 借鉴点 |
|--------|------|------|--------|
| 7维分析器 | `character-analyzer.js` | 年龄/性别/体型/面部/职业/气质/剧情 | 7维分析模型 |
| 合规守卫 | `compliance-guard.js` | L1高危/L2中危/L3低危三级检测 | 三级合规系统 |
| 提示词架构师 | `prompt-architect.js` | 6层Prompt构建 | 6层结构模型 |

**三级合规系统**：
- **L1 高危**（绝对禁止）：儿童不当内容、恐怖主义、仇恨符号、极端政治
- **L2 中危**（需处理）：警察标识模糊化、军事标识虚构化、医护铭牌模糊化、品牌移除
- **L3 低危**（需注意）：武器道具、文字元素、年代穿帮

**6层Prompt结构**：
1. **Layer 1 主体**：种族+性别+年龄+体型+面部特征+特殊标记
2. **Layer 2 服装**：上装+下装+鞋履+整体风格（按职业自动匹配）
3. **Layer 3 配饰**：头部/颈部/手部/腰部/耳部/其他（含合规修改器）
4. **Layer 4 表情姿态**：气质+表情+眼神+姿态
5. **Layer 5 环境光线**：背景+光线+氛围
6. **Layer 6 技术规格**：镜头+构图+画质修饰

**输出包含**：
- 正向Prompt（控制在980字符以内）
- 负面Prompt（自动按职业/年龄/合规添加）
- 合规审核报告（Markdown格式）
- 参考角度计划（front-full/front-closeup/profile等）
- 质量检查清单

- **版本**: v1.0-Peng
- **发布时间**: 2026-05-20
- **依赖**: style-isolation-gateway v2.0-Peng