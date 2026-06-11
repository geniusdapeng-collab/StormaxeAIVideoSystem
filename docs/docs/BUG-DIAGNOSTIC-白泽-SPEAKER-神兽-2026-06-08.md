# 🔍 Bug 诊断报告：白泽预生产 SPEAKER/Character 字段硬编码问题

**日期**：2026-06-08
**版本**：v6.24-fix30
**问题等级**：P0 — 核心角色名缺失
**影响**：S01-S06 全部 6 个 prompt 文件的 SPEAKER="神兽"、Character="神兽角色: Nirath神兽"

---

## 一、期望结果 vs 实际结果

### 期望
- SPEAKER 字段：`白泽` 或 `小G`（取决于角色）
- Character 字段：`白泽` 或 `小G` 的具体描述
- Dialogue TEXT：中文对白（如"吾名白泽，通晓万物之情。"）

### 实际（S01 为例）
```
【Dialogue】 - SPEAKER: 神兽 | TYPE: 对话 | EMOTION: 中性 | TEXT: "..." | LIP_SYNC: YES | 口型情绪: 自然
【Character】 神兽角色: Nirath神兽
```

### 实际（Action 字段中的白泽）
```
【Action】 白泽从黑暗深处缓缓向前迈步，身体从模糊到清晰，竖眼微睁...
```
- "白泽" 仅出现在 Action 描述中（偶然提及），而非角色定义区
- "小G" 在 S01-S04 全部 4 个文件中均未出现

---

## 二、完整数据流分析

```
PRD（beastId: baize, title: 白泽）
  ↓
Stage 2: 需求对齐
  → story-plan.json 生成，但 beastId=null, title=null（❌ 提取失败）
  ↓
Stage 5: character-prompt-build
  → beastId=null → 跳过（⚠️ completed: false）
  → 无 character map 注册
  ↓
Stage 7.5: 对话标注
  → LLM 生成正确对白（SPEAKER: 白泽/小G）✅
  → 应用阶段报错: allShots is not defined ❌
  → dialogue-annotation.json 未写入 ❌
  ↓
Stage 8.2: Prompt 预生成
  → _generatedPrompt 使用 Nirath 神兽模板（SPEAKER: 神兽）
  → 无对白注入（dialogue-annotation.json 不存在）
  ↓
Stage 8.3: 质量校准
  → 旁白清洗失败（无 dialogues）
  → 闸机自愈注入 fallback 硬编码（SPEAKER: 神兽）❌
  ↓
04-prompts/prompt-S0X.txt
  → SPEAKER: 神兽，Character: Nirath神兽 ❌
```

---

## 三、两个独立根因

### 根因 A：dialogue-annotation.json 未生成（导致无对白可注入）

**现象**：03-shots/ 目录下无 dialogue-annotation.json 文件

**报错**：`❌ 对话标注失败: allShots is not defined`

**涉及文件**：
- `pipeline-story-support.js` 第 1709 行
- `dialogue-annotator.js`（fallback 模块）

**报错代码段**（pipeline-story-support.js）：
```javascript
// 第 1697 行：调用 DialogueAnnotator fallback
result = annotator.annotate(script, shots);

// fix26 的 normalize 代码：
if (!result.allShots) result.allShots = result.shots;  // ← 此行存在

// 第 1709 行：直接使用 result.allShots（若无 normalize 则崩溃）
shots: result.allShots.map(s => ({   // ← ReferenceError: allShots is not defined
  id: s.id,
  hasDialogue: s.hasDialogue || false,
  dialogues: s.dialogues || []
}))
```

**根因分析**：
1. LLM 对话生成成功（生成 5 句含白泽/小G的对白）
2. 应用对白到 shots 时，报错 `allShots is not defined`
3. try-catch 捕获了错误，但 dialogue-annotation.json 写入被跳过
4. Stage 8.2/8.3 读不到文件，使用硬编码 fallback

**fix26/29/30 修复内容**：
```javascript
// 在使用 result.allShots 之前加防御性检查：
const _allShots = (result.allShots || result.shots || []);
if (!result.allShots) {
  console.log(`⚠️ [fix30] result.allShots undefined, 使用 result.shots (${_allShots.length}个镜头)`);
}
shots: _allShots.map(s => ({ ... }))
```

---

### 根因 B：SPEAKER/Character 硬编码（即使对白正确也不注入）

**文件**：`director-pipeline.js` 第 3497-3499、3532-3534 行

**Fallback 硬编码**：
```javascript
// 第 3497 行（S00 开口fallback）
injection = ` | 【Dialogue】 - SPEAKER: 神兽 | TYPE: 战吼 | EMOTION: 威严 | TEXT: "Welcome to planet Nirath" | LIP_SYNC: YES`;

// 第 3499 行（普通镜头 fallback）
injection = ` | 【Dialogue】 - SPEAKER: 神兽 | TYPE: 对话 | EMOTION: 中性 | TEXT: "..." | LIP_SYNC: YES | 口型情绪: 自然`;

// 第 3513 行（Character fallback）
const charStr = chars.length > 0 ? chars.join(', ') : '神兽角色';
const injection = ` | 【Character】 ${charStr}: Nirath神兽`;
```

**闸机自愈逻辑**（第 3488 行）：
```javascript
// 质检2: 缺少完整P0 Dialogue → 强制注入
if (!alreadyHasP0Dialogue) {
  const dialogues = shot.dialogues || [];  // ← shot.dialogues 为空！因为 dialogue-annotation.json 不存在
  let injection = '';
  if (dialogues.length > 0) {
    // 有对白时注入真实对白 ✅
    const d = dialogues[0];
    injection = ` | 【Dialogue】 - SPEAKER: ${d.speaker} | ...`;
  } else {
    // 无对白时注入硬编码 ❌ ← 当前走的是这条路
    injection = ` | 【Dialogue】 - SPEAKER: 神兽 | TYPE: 对话 | ...`;
  }
}
```

**真实数据存在于 story-plan.json**：
```json
{
  "segments": [{
    "shots": [{
      "id": "S01",
      "Dialogue": [{
        "SPEAKER": "白泽",
        "TYPE": "独白",
        "EMOTION": "低沉、悠远、威严",
        "TEXT": "吾名白泽，通晓万物之情。",
        "LIP_SYNC": true
      }]
    }]
  }]
}
```

**根因 B 的根因**：Stage 5（character-prompt-build）因 `beastId=null` 跳过 → 无 character map → `shot.characters` 为空 → Stage 8.3 走到 `chars.length > 0 ? chars.join(', ') : '神兽角色'` 的 else 分支

---

## 四、Stage 8.2 PromptAssembler 数据流

### Stage 8.2 的 generate() 调用链

```
director-pipeline._stage82_PromptPreGeneration()
  → PromptAssembler.generate(shot)
    → _generatePrompt() [第一路径: LLM 同步]
      → sceneContent = shot.Scene || shot.scene || ...
      → actionContent = shot.Action || shot.action || ...
      → characterContent = shot.Character || shot.character || ...
      → dialogueContent = shot.Dialogue || shot.dialogue || ...
      → LLM 生成完整 prompt（含 Nirath 神兽模板）
      → _generatedPrompt = llmResult.output（硬编码 "神兽"）
      → return _generatedPrompt（第一路径直接返回）
    → _applyOverrides() [不修改 _generatedPrompt]
    → _applyCharacterRefs() [注入 character_refs]
```

**关键**：第一路径 LLM 生成的 `_generatedPrompt` 直接返回，`shotFieldOverrides` 和 `_applyOverrides()` 不会修改已生成的 prompt 内容。

### Stage 8.3 的旁白清洗逻辑

```
director-pipeline._stage83_QualityCalibration()
  → _cleanVoiceover()
    → shot.dialogues 存在？
      → 是：从 dialogues[0] 提取 SPEAKER/TEXT 重新注入 ✅
      → 否：使用硬编码 SPEAKER: 神兽 ❌
  → 闸机自愈：强制注入 P0 Dialogue
    → dialogues.length > 0？→ 真实对白 ✅
    → dialogues.length === 0？→ 硬编码 fallback ❌
```

---

## 五、story-plan.json 关键数据

### beastId / title 为 null
```json
{
  "beastId": null,
  "title": null,
  "worldview": null,
  "characters": []
}
```

### segments 数据（含正确 Dialogue）
```json
{
  "segments": [
    {
      "shots": [
        {
          "id": "S01",
          "emotion": null,
          "type": null,
          "Scene": "深邃山洞入口，背景是完全的黑暗，唯有白泽身体散发的微光照亮周围3米范围岩壁，神秘而神圣",
          "Action": "白泽从黑暗深处缓缓向前迈步，身体从模糊到清晰，竖眼微睁，白色火焰尾端有节奏跳动，占据画面70%",
          "Character": "白泽，通体纯白如大型狮子，额中央有竖眼，三尾，每尾末端有白色火焰，踏过留发光足迹。性格威严、神秘、智慧。",
          "Dialogue": [{
            "SPEAKER": "白泽",
            "TYPE": "独白",
            "EMOTION": "低沉、悠远、威严",
            "TEXT": "吾名白泽，通晓万物之情。",
            "LIP_SYNC": true
          }]
        },
        {
          "id": "S02",
          "Dialogue": []   ← 空
        },
        {
          "id": "S06",
          "Dialogue": [{
            "SPEAKER": "白泽",
            "TEXT": "去吧，去看这个世界。"
          }]
        }
      ]
    }
  ]
}
```

### character_refs 数据
```json
{
  "character_refs": {
    "白泽": {
      "name": "白泽",
      "type": "main",
      "appearance": {...},
      "colorPalette": {...}
    },
    "小G": {
      "name": "小G",
      "type": "witness",
      "appearance": {...}
    }
  }
}
```

---

## 六、已尝试的 Fix 版本

| 版本 | 修复内容 | 结果 |
|------|---------|------|
| fix21 | OpeningTitleDesigner + _buildShotContext | ❌ 同 Bug |
| fix22 | OpeningTitleDesigner 修复 | ❌ 同 Bug |
| fix23 | Stage 7.5 allShots 错误 + 合规检查 | ❌ 同 Bug |
| fix24 | prompt-engine-v2.js P1→P2 字段映射 | ❌ 同 Bug |
| fix25 | _stage83 P1 角色名注入 | ❌ 同 Bug |
| fix26 | result.allShots normalize + P1 角色名双轨 | ❌ 同 Bug |
| fix27 | shot.Scene 优先 shot.scene（P1 大写） | ❌ 同 Bug |
| fix28 | sceneContent 优先 P1 + shot.scene 预填充 | ❌ 同 Bug |
| fix29 | 强制写入 dialogue-annotation.json + 防御性检查 | ❌ 同 Bug（fix26 normalize 未生效） |
| fix30 | 语法错误修复 + 防御性 _allShots | ⏳ 等待结果 |

---

## 七、核心代码片段

### 1. dialogue-annotator.js 返回值（无 allShots）
```javascript
// dialogue-annotator.js 第 200-206 行
annotate(script, shots) {
  // ...
  return {
    shots: annotatedShots,      // ← 只有 shots，无 allShots
    dialogueCount: allDialogues.length
  };
}
```

### 2. fix26 normalize 代码（在 dialogue-annotator fallback 后）
```javascript
// pipeline-story-support.js 第 1697-1699 行
result = annotator.annotate(script, shots);
// 🆕 v6.24-fix26: normalize
if (!result.allShots) result.allShots = result.shots;
```

### 3. 闸机自愈 fallback（SPEAKER: 神兽 根源）
```javascript
// director-pipeline.js 第 3488-3500 行
if (!alreadyHasP0Dialogue) {
  const dialogues = shot.dialogues || [];  // shot.dialogues 为空！
  let injection = '';
  if (dialogues.length > 0) {
    const d = dialogues[0];
    injection = ` | 【Dialogue】 - SPEAKER: ${d.speaker} | ...`;
  } else {
    // ❌ 走这里：无对白时注入硬编码
    injection = ` | 【Dialogue】 - SPEAKER: 神兽 | TYPE: 对话 | EMOTION: 中性 | TEXT: "..." | LIP_SYNC: YES | 口型情绪: 自然`;
  }
}
```

### 4. Character fallback
```javascript
// director-pipeline.js 第 3511-3514 行
const chars = shot.characters || [];  // shot.characters 为空！
const charStr = chars.length > 0 ? chars.join(', ') : '神兽角色';  // ← else: '神兽角色'
const injection = ` | 【Character】 ${charStr}: Nirath神兽`;  // ❌ "神兽角色: Nirath神兽"
```

---

## 八、修复方向建议（供外部专家参考）

### 方向一（推荐）：修复根因 A + B 的上游触发链

1. 修复 Stage 2 PRD 解析：正确从 PRD 提取 `beastId`（应为 "baize"）和 `title`（应为 "白泽"）
2. 确保 Stage 5 完成，character map 正确注册
3. 确保 dialogue-annotation.json 正确写入（fix30 正在验证）
4. 确保 Stage 8.3 闸机自愈使用真实对白而非 fallback

**优点**：彻底解决，从源头恢复数据流
**难点**：Stage 2 的 PRD 解析逻辑需要审查

### 方向二：旁路绕过（不改 Stage 2/5）

在 Stage 8.3 闸机自愈逻辑中，当 `dialogues.length === 0` 时：
1. 从 `shot.Dialogue`（P1 大写字段）直接读取 SPEAKER/TEXT
2. 如果 `shot.Dialogue` 有内容，优先使用

**优点**：改动小，不影响其他流程
**难点**：只是表面修复，`dialogues.length === 0` 的根因未解决

### 方向三：Stage 8.2 阶段注入 Dialogue

在 `_generatedPrompt` 生成后、返回前，检查 `shot.Dialogue` 是否有内容：
- 有：重新注入 `_generatedPrompt` 中的 SPEAKER 字段
- 无：保持现有 fallback

**优点**：不影响 Stage 8.3 逻辑
**难点**：需要改 PromptAssembler 流程

---

## 九、关键文件路径索引

| 文件 | 作用 |
|------|------|
| `productions/白泽预生产-20260607010109-baize/01-story/story-plan.json` | 故事数据（含正确 Dialogue） |
| `productions/白泽预生产-20260607010109-baize/03-shots/dialogue-annotation.json` | 对白标注文件（❌ 未生成） |
| `productions/白泽预生产-20260607010109-baize/04-prompts/prompt-S0X.txt` | 最终 prompt 文件（❌ 含硬编码） |
| `skills/shanhaijing-director/scripts/pipeline-story-support.js` | Stage 7.5 对话标注逻辑 |
| `skills/shanhaijing-director/scripts/dialogue-annotator.js` | 本地 fallback 对白标注器 |
| `skills/shanhaijing-director/scripts/director-pipeline.js` | Stage 8.2/8.3 + 闸机自愈逻辑 |
| `skills/shanhaijing-director/scripts/stage8-pregeneration.js` | Stage 8.2 PromptAssembler |
| `skills/shanhaijing-director/scripts/prompt-engine-v2.js` | Prompt 引擎（字段映射） |

---

## 十、飞书消息上下文

- 当前 fix30 子 agent session: `agent:main:subagent:14d5b12b-5331-4834-8c17-69364e176c6c`
- 白泽 PRD ID: `白泽预生产-20260607010109-baize`
- 最近报告: `pipeline-report-1780928595637.json`（fix30）
