# PromptForge 导演编排系统

## 版本
v1.0-Peng (2026-06-03)

## 定位
老系统的"导演大脑"，将70分初稿拉升至90分。

作为Pipeline的后置处理模块（Stage 9），调用现有业务子系统，用导演思维进行创作提升。

## 核心模块

### 1. promptforge-orchestrator.js - 主编排器
- 三阶流水线编排：理解 → 创作 → 合成
- 调用各角色模块，整合输出

### 2. promptforge-director.js - 总导演（Stage 1: 理解）
- 建立全片创作意图
- 调用：神兽档案库 + Nirath星球档案 + 导演风格库
- 产出：《导演创作意图文档》

### 3. promptforge-writer.js - 首席编剧（Stage 2: 台词创作）
- 为每个镜头创作有深度的台词
- 调用：神兽档案库 + 台词库
- 产出：台词 + 创作说明

### 4. promptforge-dp.js - 摄影指导（Stage 2: 镜头设计）
- 为每个镜头设计电影级镜头语言
- 调用：运镜库 + 光影库 + Nirath档案 + 微表情库
- 产出：运镜 + 光影 + Nirath元素

### 5. promptforge-gatekeeper.js - 质量守门员（Stage 3: 质量检查）
- 最终检查Prompt是否符合质量标准
- 调用：提示词生成质量标准
- 产出：质量报告（通过/不通过 + 偏差项）

## 调用子系统

| 子系统 | 位置 | 状态 |
|--------|------|------|
| 神兽档案库 | shanhaijing-beast-archive | ✅ 完善 |
| Nirath星球档案 | shanhaijing-world-engine | ✅ 存在 |
| 导演风格库 | style-selector | ✅ 存在 |
| 运镜库 | shanhaijing-cinematography + fpv-cinematic-library | ✅ 存在 |
| 微表情库 | shanhaijing-emotion-calculator | ✅ 存在 |
| 光影库 | 嵌入render-engine / 待独立 | ⚠️ 需确认 |
| 台词库 | shanhaijing-voice-craft | ✅ 存在 |
| 质量标准 | shanhaijing-quality-oracle | ✅ 完善 |

## 集成方式

```
老系统Pipeline:
  [Stage 8: 初稿生成] → [Stage 9: PromptForge] → [Stage 10: 送渲染]
                           ↑
                    调用各业务子系统
```

## 使用方法

```javascript
const PromptForge = require('./promptforge-orchestrator');

const forge = new PromptForgeOrchestrator({
  projectDir: '/path/to/project',
  beastId: 'xingtian',
  projectName: '刑天觉醒'
});

const result = await forge.run(rawShots, storyPlan, projectConfig);
// result.shots: 优化后的镜头
// result.directorIntent: 导演创作意图
// result.qualityReport: 质量报告
```

## 质量标准检查维度

1. 结构完整性 - Prompt包含所有必需字段
2. 台词深度 - ≥ L3（人格型）
3. 运镜可执行性 - 描述清晰，参数合理
4. Nirath元素注入 - ≥ 2个专属元素/镜头
5. 角色一致性 - 符合神兽档案设定
6. 情绪弧线连贯性 - 有递进，无断裂
7. 视觉丰富度 - 充分调用视觉元素
8. 导演风格落地 - 体现选定导演特征

## 核心优势

- 调用老系统资产，不重复建设
- 导演级创作，产出有灵魂的作品
- 引用质量标准，最终检查严格
- 简洁轻量，核心代码~290行
- 通用可扩展，新神兽=新配置+调用档案库
- 70→90分，质量飞跃

## 版本历史

- v1.0-Peng (2026-06-03): 初始版本，Phase 1实施完成