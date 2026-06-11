# 提示词利用率问题诊断报告 v6.19

**日期**: 2026-06-06
**问题**: 提示词利用率长期停留在 67%，目标 90%+
**涉及项目**: 烛龙预生产（6个镜头）
**文件版本**: v6.19-Peng（含 fix1/fix2/fix3）

---

## 一、问题背景

### 1.1 业务目标
烛龙预生产需要为每个镜头生成高质量的 Seedance 视频渲染提示词。提示词有 **988 字符上限**（硬限制），目标是充分利用这个配额，让每个镜头的提示词长度尽可能接近 988 字符。

### 1.2 关键指标
- **目标利用率**: ≥90%（即 ≥889 字符）
- **合格线**: ≥85%（即 ≥840 字符）
- **当前实际**: 平均 67%（约 665 字符），差距达 224 字符

### 1.3 各镜头实测数据

| 镜头 | 实际字符 | 利用率 | 距目标差距 |
|------|---------|--------|-----------|
| S00 | 794 | 80.4% | -95字 |
| S01 | 673 | 68.1% | -216字 |
| S02 | 639 | 64.7% | -250字 |
| S03 | 675 | 68.3% | -214字 |
| S04 | 657 | 66.5% | -232字 |
| S05 | 691 | 70.0% | -198字 |
| **平均** | **665** | **67.3%** | **-224字** |

---

## 二、系统架构全链条分析

### 2.1 数据流（5个环节）

```
环节1: Stage 8.2 LLM 生成核心叙事
  输入: shot原始描述（中文，约150字）
  LLM调用: generateShotPrompt_v2() → 并发6个镜头
  LLM prompt: 要求输出10字段JSON（Character/Dialogue/Timeline/Camera等）
  输出: LLM返回JSON（英文散文，每字段10-15字，极简）
  ↓

环节2: generateShotPrompt() 本地组装
  输入: LLM JSON + shot.description + mandatoryDimensions
  处理: PromptAssembler解析字段 → 拼接各维度
  mandatoryDimensions包含:
    - environmentStyleBlock (full模式约180字)
    - 负面约束 (~60字)
    - 宽高比+场景 (~60字)
    - Nirath场景 (~35字)
    - perceptionNote (~40字)
    - dialogueBlock (~70字)
    合计约: 390字，占988的40%
  输出: _generatedPrompt (~557字，加权值)
  ↓

环节3: SmartQualityCalibration 智能校准
  文件: skills/shanhaijing-director/scripts/smart-quality-calibration.js
  输入: _generatedPrompt (~557字)
  策略选择:
    - FULL (prompt < 600字): worldview+characterDetail+microExpression+transition+negative
    - COMPACT (600-800字): worldviewCompact+characterDetailCompact+transition+negative
    - MINIMAL (800-920字): transition+negativeOnlyIfMissing
    - SKIP (>920字): 不注入
  注入量: worldview(~30字)+characterDetail(~35字)+microExpression(~40字)+transition(~15字)+negative(~60字) ≈ 180字
  输出: 加权值 826-859字（对应实际约 660-700字）
  ↓

环节4: PriorityTruncator 硬上限截断
  文件: skills/shanhaijing-director/scripts/director-pipeline.js:5174
  条件: if (_countChars(calibratedPrompt) > 988)
  当前值: 校准后加权 826-859，均 <988，不触发截断
  输出: 校准后prompt直接写入
  ↓

环节5: 04-prompts 文件落地
  文件: productions/烛龙预生产-xxx/04-prompts/S0X-prompt.md
  实测: 651-794字符（实际）
```

### 2.2 关键代码路径

```
director-pipeline.js
  └── stage8_2_PromptPreGeneration() (line 5501)
        ├── LLM并发调用: llmLayer.llmReasonParallel(llmConfigs)
        │     └── llmConfigs[].systemPrompt: 要求输出10字段JSON（400-600字约束）
        ├── JSON解析: JSON.parse(enhancedDescription)
        │     └── 成功注入: shot._characterRef, shot._timeline, shot._dialogueText 等
        └── generateShotPrompt() 调用
              └── seedance-render-engine.js: generateShotPrompt()
                    ├── 解析LLM JSON字段
                    ├── 拼接 mandatoryDimensions (390字)
                    ├── expandPromptToTarget() → 输出 _generatedPrompt
                    └── 返回 prompt 字符串

  └── stage8_Calibration() (line ~5165)
        ├── SmartQualityCalibration.calibrate()
        │     └── FULL策略注入 worldview+characterDetail+microExpression+negative
        ├── PriorityTruncator.truncate() [条件: > 988]
        └── shot._generatedPrompt = calibratedPrompt

  └── 写入04-prompts/
```

---

## 三、根因诊断

### 3.1 直接根因：LLM 输出内容过短

**证据**：
- 日志显示 LLM 核心叙事 `len=521~580`（加权值）
- 换算实际字数约 521/1.5≈347 字（中文按加权1.5计算）
- 10字段JSON，每字段仅10-15字英文散文
- SmartCalibration FULL策略注入后也只有 800-859 加权字

**根本原因**：LLM 被要求输出400-600字JSON，但实际产出远低于目标。

### 3.2 深层根因一：LLM Prompt 约束不够强

**当前 LLM System Prompt 约束**（director-pipeline.js:5555）：
```
【约束】:
- 只输出JSON，不要任何解释文字
- 所有10个字段必须全部包含
- 总JSON内容长度控制在400-600字  ← 目标太低
- CharacterRef: 从镜头内容判断...
- Dialogue: 若镜头无角色台词...
```

**问题**：只说"400-600字"，没说"每字段至少XX字"，LLM 可以用极简内容填充。

### 3.3 深层根因二：SmartCalibration 注入量不足

**FULL策略注入模板**（smart-quality-calibration.js:31）：
```javascript
INJECT_TEMPLATES: {
  worldview: (ctx) => `, Nirath bio-luminescent alien world, twin stars...`, // ~30字
  characterDetail: (ctx) => `, ${ctx.characterName}: distinctive physical traits...`, // ~35字
  microExpression: (ctx) => `, micro-expression: subtle muscle movement...`, // ~40字
  transition: (ctx) => `接续${prevShot} | `, // ~15字
  negative: () => `, no deformed anatomy, no extra limbs...`, // ~60字
}
// 总计约: 180字
```

**问题**：FULL策略全注也只有 ~180字，对557字的输入来说只增加32%，无法填满988。

### 3.4 深层根因三：加权计算与实际字符不匹配

**CharCounter 规则**（char-counter.js）：
```javascript
count(str) {
  for (const char of str) {
    if (this._isChineseChar(char)) {
      total += 2;  // 汉字 = 2字符（v6.19-fix3改为1.5）
    } else {
      total += 1;  // 英文 = 1字符
  }
}
```

**问题**：SmartCalibration 报告"加权826字"，实际写入文件只有665字。差距约161字，来自：
1. 中文"双恒星橙紫光芒交织..."等（约100字中文 × 0.5差值 = 50字）
2. 重复内容拼接损耗（Action和Scene字段内容相同）

### 3.5 深层根因四：LLM JSON 解析后的字段内容重复

**S01-prompt.md 实际内容分析**：
```
..., P1 Scene: 生态级航拍缓慢下降，双恒星橙紫光芒交织...
..., P1 Action: 生态级航拍缓慢下降，双恒星橙紫光芒交织...
```
Scene 和 Action 填入了完全相同的描述，浪费配额。

---

## 四、已尝试的修复（均未达标）

### fix1 (commit 668de22) — seedance-render-engine层
- SmartTruncator 禁用截断（minUtilization=0）
- environmentStyleBlock full→light（节省约100字）
- availableSpace 公式 980→988
- **结果**: 无效果（director层 HARD_LIMIT 980 未改）

### fix2 (commit c00f864) — director层 HARD_LIMIT 同步
- smart-quality-calibration.js HARD_LIMIT 980→988（3处）
- director-pipeline.js PriorityTruncator 980→988（4处）
- **结果**: 几乎无效果（69.7%→69.9%，误差范围内）

### fix3 (commit 57615c8) — 三处精准修复
- LLM prompt JSON内容下限 400-600→800-1000字
- SmartCalibration FULL阈值 600→700字
- CharCounter中文权重 2→1.5
- **结果**: 验证中（预计10-20分钟）

---

## 五、核心代码片段

### 5.1 Stage 8.2 LLM System Prompt

**文件**: `skills/shanhaijing-director/scripts/director-pipeline.js` (line ~5533)

```javascript
systemPrompt: `你是一位拥有15年经验的顶级电影摄影师和AI视频提示词工程师。你的任务是为以下镜头生成电影级的视频渲染提示词核心叙事部分。

【重要：必须严格按以下JSON格式输出，不要输出任何其他内容】
{
  "CharacterRef": "角色名: image://角色名-角度.png, ...",
  "Dialogue": "角色台词或环境音效描述",
  "Timeline": "[0:00-0:08] dur:8s type:normal mood:神秘",
  "Camera": "运镜控制（景别+运动方式+速度+节奏）",
  "Lighting": "光影方案（光源方向+色温+明暗对比）",
  "Character": "角色外貌锚点（种族+体型+服装+配饰+表情动作）",
  "Scene": "场景环境（地点+地形+生态元素+材质细节）",
  "Mood": "情绪关键词1, 情绪关键词2, 情绪关键词3",
  "EnvironmentStyle": "超写实CG/UnrealEngine5/原创世界观",
  "DirectorStyle": "导演风格1, 导演风格2"
}

【约束】:
- 只输出JSON，不要任何解释文字
- 所有10个字段必须全部包含，缺失任何一个都会导致渲染失败
- 总JSON内容长度控制在400-600字（v6.19-fix3改为800-1000字）
- Scene字段: 必须完整描述场景环境+相机运动+光线氛围+材质细节
- Action字段: 必须描述角色具体肢体动作和表情变化，不能与Scene重复
- Mood字段: 至少四个情绪关键词
- CharacterRef: 从镜头内容判断出现的角色，匹配定妆照路径
- Dialogue: 若镜头无角色台词，写"环境音主导，无声角色表演"
`,
```

### 5.2 SmartQualityCalibration 配置

**文件**: `skills/shanhaijing-director/scripts/smart-quality-calibration.js`

```javascript
const CALIBRATION_CONFIG = {
  HARD_LIMIT: 988,  // v6.19-fix2: 980→988

  STRATEGIES: {
    FULL: { maxPromptLen: 700, inject: ['worldview', 'characterDetail', 'microExpression', 'transition', 'negative', 'worldviewCompact'] },  // v6.19-fix3: 600→700
    COMPACT: { maxPromptLen: 800, inject: ['worldviewCompact', 'characterDetailCompact', 'transition', 'negative'] },
    MINIMAL: { maxPromptLen: 920, inject: ['transition', 'negativeOnlyIfMissing'] },
    SKIP: { maxPromptLen: 988, inject: [] }
  },

  INJECT_TEMPLATES: {
    worldview: (ctx) => `, Nirath bio-luminescent alien world, twin stars, volcanic terrain`,
    worldviewCompact: () => ', Nirath alien world',
    characterDetail: (ctx) => `, ${ctx.characterName || 'character'}: distinctive physical traits, detailed costume, unique features preserved`,
    characterDetailCompact: (ctx) => `, ${ctx.characterName || 'protagonist'} traits`,
    microExpression: (ctx) => `, micro-expression: ${ctx.microExpression || 'subtle muscle movement, breathing rhythm, natural facial tension'}`,
    transition: (ctx) => ctx.prevShot ? `接续${ctx.prevShot} | ` : '',
    negative: () => ', no deformed anatomy, no extra limbs, no modern objects, no text watermark, no cartoon style',
  }
};
```

### 5.3 PriorityTruncator 调用点

**文件**: `skills/shanhaijing-director/scripts/director-pipeline.js` (line ~5172)

```javascript
const calibration = calibrator.calibrate(prompt, context, this._countChars.bind(this));
let calibratedPrompt = calibration.prompt;

if (this._countChars(calibratedPrompt) > 988) {  // v6.19-fix2: 980→988
  // 截断逻辑...
  let truncated = truncator.truncate(calibratedPrompt, 988, this._countChars.bind(this));
  let iterations = 0;
  while (this._countChars(truncated) > 988 && iterations < 3) {
    const { charCounter } = require('./char-counter');
    truncated = charCounter.truncate(truncated, 988);
    iterations++;
  }
  console.log(`[PriorityTruncate] ${shotId}: ${this._countChars(calibratedPrompt)} -> ${this._countChars(truncated)} 截断到988 (iter=${iterations})`);
  calibratedPrompt = truncated;
}
```

### 5.4 CharCounter 加权计算

**文件**: `skills/shanhaijing-director/scripts/char-counter.js`

```javascript
class CharCounter {
  constructor() {
    this.TARGET_MAX = 988;  // v6.19-fix3: 980→988
    this.HARD_LIMIT = 1000;
    this.SAFETY_MARGIN = 10;
  }

  count(str) {
    if (!str || typeof str !== 'string') return 0;
    let total = 0;
    for (const char of str) {
      const code = char.charCodeAt(0);
      if (this._isChineseChar(char)) {
        total += 1.5;  // v6.19-fix3: 2→1.5（消除加权虚高）
      } else {
        total += 1;
      }
    }
    return total;
  }
}
```

### 5.5 generateShotPrompt mandatoryDimensions 构建

**文件**: `skills/seedance-render-engine/scripts/seedance-render-engine.js` (line ~1820)

```javascript
let mandatoryDimensions = [];

// 1. 免责声明（最高优先级）
const disclaimers = [];
if (!prompt.includes('fictional')) disclaimers.push('CG hyper-realistic digital character');
if (!prompt.includes('not real')) disclaimers.push('NOT a real person, completely fictional digital creation');
if (!prompt.includes('AI generated')) disclaimers.push('generated by AI for entertainment purpose');
if (disclaimers.length > 0) mandatoryDimensions.unshift('DISCLAIMER: ' + disclaimers.join(', ') + '.');

// 2. 暗黑风禁止约束
mandatoryDimensions.push('NO dark scene NO pitch black NO total darkness NO night time, bright vivid colors and strong textures required');

// 3. 环境风格（v6.19-fix1: full→light，节省约100字）
const environmentStyleBlock = getEnvironmentStyleBlock('light', shot);  // 约80字
mandatoryDimensions.unshift(environmentStyleBlock);

// 4. Scenography场景设计（上限80字）
const availableSpace = Math.max(100, 988 - _countChars(prompt) - 200);  // v6.19-fix1: 980→988
const sceneDesign = designSceneForShot(shot, plan, Math.min(availableSpace, 80));
if (sceneDesign) mandatoryDimensions.push(sceneDesign);

// 5. 负面约束精简（v6.19-fix1: 去除冗余eyes描述）
mandatoryDimensions.push('NO anime NO cartoon NO 3D Disney NO sci-fi NO glowing eyes');

// 6. 角色定妆照引用
// 7. 宽高比
mandatoryDimensions.push('widescreen 16:9 aspect ratio');

// 8. Nirath场景
mandatoryDimensions.push('Nirath dark gold crystallized epic environment');

// 9. 生理感知
if (perceptionNote) mandatoryDimensions.push(perceptionNote);

// 10. 台词模块
if (dialogueBlock) mandatoryDimensions.unshift(dialogueBlock);

// 合并
let mandatoryText = mandatoryDimensions.length > 0 ? mandatoryDimensions.join(',') + ',' : '';
```

---

## 六、日志证据

### 6.1 SmartCalibration 日志（v6.19-fix2）

```
[SmartCalibration] S00 strategy=FULL, injected=[worldview,characterDetail,microExpression,negative], len=557->826
     [PromptMetrics] S00: 加权826/980 | 合规率:84.3% [C] | 饱满度:55.7% | ⚠️ WARN
[SmartCalibration] S01 strategy=FULL, injected=[worldview,characterDetail,microExpression,transition,negative], len=566->845
     [PromptMetrics] S01: 加权845/980 | 合规率:86.2% [B] | 饱满度:46.4% | ✅ PASS
[SmartCalibration] S02 strategy=FULL, injected=[worldview,characterDetail,microExpression,transition,negative], len=521->800
     [PromptMetrics] S02: 加权800/980 | 合规率:81.6% [C] | 饱满度:44% | ⚠️ WARN
[SmartCalibration] S03 strategy=FULL, injected=[worldview,characterDetail,microExpression,transition,negative], len=569->848
     [PromptMetrics] S03: 加权848/980 | 合规率:86.5% [B] | 饱满度:46.6% | ✅ PASS
[SmartCalibration] S04 strategy=FULL, injected=[worldview,characterDetail,microExpression,transition,negative], len=580->859
     [PromptMetrics] S04: 加权859/980 | 合规率:87.7% [B] | 饱满度:47.5% | ✅ PASS
[SmartCalibration] S05 strategy=FULL, injected=[worldview,characterDetail,microExpression,transition,negative], len=534->813
     [PromptMetrics] S05: 加权813/980 | 合规率:83% [C] | 饱满度:46.8% | ⚠️ WARN
```

**解读**：
- 所有镜头都触发 FULL 策略
- 注入量约 280-300 字（符合预期）
- 但 LLM 原始内容只有 520-580 字，导致总长只有 800-859 字
- 800-859 字加权值 ÷ 1.5 ≈ 533-573 字实际内容，远低于 988 目标

### 6.2 04-prompts 实际内容示例（S01）

```markdown
# S01 Prompt

```
, cinematic composition with depth of field, epic scale with environmental storytelling details | P0 Character: 烛龙睁眼: 异兽 | 小G: 角色 | P1 Scene: 生态级航拍缓慢下降，双恒星橙紫光芒交织。烛龙睁眼的身体与Nirath环境的光脉/能量流同步脉动... | P1 Action: 生态级航拍缓慢下降，双恒星橙紫光芒交织...（与Scene重复）| nirath, 烛龙睁眼: distinctive physical traits... | micro-expression: subtle muscle movement... | 接续S00 | , no deformed anatomy, no extra limbs, no modern objects, no text watermark, no cartoon style
```

**实测**: 672字符（去除markdown wrapper后651字符）

---

## 七、核心问题总结

### 问题链条

```
1. LLM Prompt约束不够强（400-600字，无字段下限）→ LLM输出极简JSON（每字段10-15字）
    ↓
2. LLM原始内容过短（520-580加权字 = ~350实际字）→ SmartCalibration无法填满
    ↓
3. SmartCalibration FULL策略注入量有限（~280字）→ 总长只有800-859加权字
    ↓
4. 加权值与实际字符不匹配（826→665，差161字）→ 最终文件只有665字符
    ↓
5. 67%利用率，未达85%合格线
```

### 三类解决思路

**思路A：让LLM输出更丰富（治本）**
- 强化LLM Prompt：要求每字段至少50-80字，Scene/Action至少100字
- 验证LLM实际输出内容，不足则重试或降级到本地模板

**思路B：增强SmartCalibration注入（治标）**
- 追加更多注入模板（environmentStyle/lightingStyle/cameraStyle）
- 缩短FULL阈值（从700→500字）
- 增加多次注入循环

**思路C：修复加权计算差异（消除假象）**
- 统一加权规则，让日志数字和实际文件一致
- 考虑用纯字符数替代加权值

---

## 八、关键文件路径

| 文件 | 作用 |
|------|------|
| `skills/shanhaijing-director/scripts/director-pipeline.js` | Stage 8.2 LLM调用、PriorityTruncator |
| `skills/shanhaijing-director/scripts/smart-quality-calibration.js` | SmartCalibration 策略和注入模板 |
| `skills/shanhaijing-director/scripts/char-counter.js` | 加权字符计算 |
| `skills/seedance-render-engine/scripts/seedance-render-engine.js` | generateShotPrompt、mandatoryDimensions |
| `skills/seedance-render-engine/scripts/prompt-engine-v2.js` | PromptAssembler、SmartTruncator |
| `productions/烛龙预生产-xxx/04-prompts/` | 提示词文件输出目录 |

---

## 九、已提交的commits

```
57615c8 🔥 v6.19-Peng-fix3: 三处精准修复 — LLM内容下限+SmartCalibration强化+中文权重
c00f864 🔥 v6.19-Peng-fix2: director层HARD_LIMIT 980→988，终于打通最后一公里
668de22 🔥 v6.19-Peng: 三处联动修复 — 禁用截断 + 精简mandatoryText + 统一988基准
ed39d7d v6.18-Peng: 烛龙预生产v6.18完成 + 提示词清理 + RELEASE更新
```
