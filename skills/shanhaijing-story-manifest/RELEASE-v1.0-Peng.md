# Story Manifest Calibrator v1.0-Peng 发布说明

**发布时间**: 2026-05-19 09:35 UTC+8
**触发**: 大鹏架构指令 — "做一个公共模块，各环节索引校准需求"

---

## 🎯 核心设计

### 1. Story Manifest（故事宪法）
**单一事实来源（Single Source of Truth）**

结构：
```
story-manifest-template.js
├── metadata — 项目/版本/状态
├── story — 完整故事/主题/四幕结构（含预期叙事节拍）
├── characters — 角色宪法（人种/服饰/性格/行为/情感弧线）
├── visual_style — 视觉风格宪法（色彩/光影/材质/电影质感）
├── worldview_rules — 世界观规则（必须存在/绝对禁止）
├── narrative_rules — 叙事规则（每镜头要求/禁止模式/主题关键词）
└── technical — 技术规格（时长/镜头数/分辨率）
```

### 2. StoryManifestCalibrator（校准器）
**6大下游环节全覆盖**

| 阶段 | 校准内容 | 检测项 |
|------|----------|--------|
| `story_engine` | 故事大纲 | 四幕完整性、角色一致性、主题关键词、叙事节拍 |
| `shot_design` | 分镜设计 | 角色动作、情绪变化、因果链连续性 |
| `prompt_generation` | Prompt生成 | 世界观污染（中英文）、人种特征、视觉风格 |
| `render_engine` | 渲染输出 | 时长偏差、metadata完整性 |
| `pitch_evaluation` | 比稿评测 | 是否引用宪法作为参照 |
| `post_production` | 后期合成 | 角色出场完整性 |

### 3. 校准报告输出
```json
{
  "stage": "story_engine",
  "passed": false,
  "summary": { "critical": 2, "errors": 1, "warnings": 2 },
  "violations": [...],
  "warnings": [...],
  "fix_instructions": "❌ [critical] 四幕结构缺失...\n❌ [error] 主题缺失...",
  "downstream_advice": ["⚠️ 下游Prompt生成: 角色描述可能与宪法不一致..."]
}
```

---

## 🧪 Mock测试结果（全部通过）

| 测试 | 输入 | 预期 | 结果 |
|------|------|------|------|
| 宪法加载 | 精卫宪法 | 成功加载 | ✅ |
| 合法大纲 | 完整四幕+角色+主题 | 通过 | ✅ (0严重/0错误) |
| 非法大纲 | 缺少转幕+角色错误+无主题 | 不通过 | ❌ (2严重/1错误) |
| Prompt污染 | zombie/wizard/cyberpunk | 检测7项 | ❌ (7违规) |
| 因果链断裂 | 无共享角色+无因果词 | 检测4项 | ❌ (4违规) |
| 便捷方法 | getCharacterDefinition | 返回角色定义 | ✅ |

---

## 📁 文件清单

| 文件 | 说明 |
|------|------|
| `skills/shanhaijing-story-manifest/story-manifest-template.js` | 精卫E01故事宪法模板 |
| `skills/shanhaijing-story-manifest/story-manifest-calibrator.js` | 校准器核心模块 |

---

## 🔧 使用方式

### 1. 定义故事宪法（每个新项目一份）
```javascript
const manifest = {
  metadata: { project: "精卫", version: "v1.0" },
  story: { logline: "...", theme: {...}, structure: {...} },
  characters: { xiaog: {...}, jingwei: {...} },
  visual_style: { color_system: {...}, lighting: {...} },
  worldview_rules: { must_not_have: [...] },
  narrative_rules: { per_shot_minimum: {...} }
};
```

### 2. 下游环节调用校准
```javascript
const { StoryManifestCalibrator } = require('./story-manifest-calibrator.js');
const calibrator = new StoryManifestCalibrator('./story-manifest.js');

// 故事引擎生成后校准
const report = calibrator.calibrate(storyPlan, 'story_engine');
if (!report.passed) {
  console.log(report.fix_instructions); // 输出修正指令
  // 打回重生成
}

// Prompt生成后校准
const report2 = calibrator.calibrate(prompts, 'prompt_generation');
if (!report2.passed) {
  console.log(report2.violations); // 输出世界观污染项
  // 修正Prompt
}
```

### 3. 集成到现有Pipeline
```
故事引擎 → 【校准器:story_engine】 → 不通过则重生成
    ↓ 通过
分镜设计 → 【校准器:shot_design】 → 不通过则修正分镜
    ↓ 通过
Prompt生成 → 【校准器:prompt_generation】 → 不通过则修正Prompt
    ↓ 通过
渲染引擎 → 【校准器:render_engine】 → 不通过则重新渲染
    ↓ 通过
后期合成 → 【校准器:post_production】 → 不通过则修正合成
```

---

## 🎁 附加价值

1. **角色定义中心** — 所有Prompt的角色描述从`manifest.characters`读取，保证一致性
2. **视觉风格中心** — 所有Prompt的风格描述从`manifest.visual_style`读取，保证统一
3. **世界观防火墙** — 24项禁止词中英文混合检测，防止任何污染
4. **叙事节拍模板** — 四幕结构的预期beats作为"正确答案"，校准故事引擎输出

---

## 🚀 下一步

1. 将校准器集成到现有Pipeline各阶段
2. 每个新项目生成专属Story Manifest
3. 故事宪法版本化管理（每次修改生成v1.1/v1.2...）

---

*大鹏指令: "做一个公共的模块，这个模块可以被各环节索引到。"*