# 预生产流程规范 v1.0-Peng — Pre-Production Flow
**强制级别**: 🔒 不可协商（违反则视为流程违规）
**适用**: 所有视频渲染任务
**版本**: v1.0-Peng
**制定**: 大鹏 | **执行**: 小G

---

## 什么是预生产

预生产是在正式提交Seedance渲染之前，必须完成的**全部准备环节**的总称。

**预生产不是**：
- ❌ Mock模式的"模拟通过"
- ❌ 只跑Pipeline报告不看产出物
- ❌ 跳过定妆照确认直接渲染
- ❌ 把Prompt藏在代码里不发给大鹏审阅

**预生产是**：
- ✅ 生成**可审阅的实际产出物**（定妆照图片、Prompt飞书文档）
- ✅ 每个环节**逐个执行**，不跳过任何一个
- ✅ 每个关键节点**获得大鹏确认**后才进入下一步
- ✅ 所有Prompt**做成飞书文档**发给大鹏

---

## 标准8步铁律

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 定妆照检查                                         │
│  ├── 判断：该主题/角色是否已有定妆照？                       │
│  ├── 有定妆照（≥8张）→ 进入 Step 2                          │
│  └── 无定妆照 → 生成8张定妆照 → 进入 Step 2                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 发定妆照给大鹏确认                                  │
│  ├── 发送定妆照图片给大鹏审阅                                │
│  ├── 大鹏确认"OK" → 进入 Step 3                            │
│  └── 大鹏确认"不OK" → 返回 Step 1 重新生成                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 执行主链路全部相关模块/环节（逐个执行，不跳过）     │
│  ├── Stage 1: PRD生成                                         │
│  ├── Stage 2: 需求对齐闸机                                    │
│  ├── Stage 3: Schema校验                                    │
│  ├── Stage 4: 故事板校验                                    │
│  ├── Stage 5: 角色提示词构建                                │
│  ├── Stage 6: 合规检查                                        │
│  ├── Stage 7: 时长分配                                        │
│  ├── Stage 7.5: 对话标注（如启用）                          │
│  ├── Stage 8: 运镜控制                                        │
│  └── Stage 8.2: 节奏强化（短剧快剪）                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 生成完整Prompt                                      │
│  ├── 每个镜头的完整Prompt                                     │
│  ├── 包含：角色描述、运镜、对白、Nirath栖息地、时长          │
│  └── 所有Prompt就绪后进入 Step 5                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 做成飞书文档发给大鹏                                │
│  ├── 汇总所有镜头完整Prompt                                   │
│  ├── 创建飞书文档                                             │
│  └── 发送大鹏审阅                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 6: 大鹏确认Prompt文档                                  │
│  ├── 大鹏确认"OK/可以提交" → 进入 Step 7                     │
│  └── 大鹏反馈问题 → 修改Prompt → 回到 Step 5 重新生成文档  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 7: 提交Seedance渲染                                    │
│  ├── 生产链路（真实执行，非模拟）                           │
│  ├── 实时跟踪渲染进度                                        │
│  └── 下载完成后进入 Step 8                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 8: 后期制作 + 发成片给大鹏                             │
│  ├── 拼接所有镜头                                             │
│  ├── 转场处理                                                │
│  ├── 输出双版本成片（版本1原声 + 版本2 TTS）                 │
│  └── 发送大鹏审阅最终成片                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 判断逻辑

### 定妆照检查
```javascript
function checkCharacterRef(characterName) {
  const refDir = `productions/global-character-references/${characterName}/`;
  const exists = fs.existsSync(refDir);
  const files = exists ? fs.readdirSync(refDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg')) : [];
  
  if (files.length >= 8) {
    return { ok: true, count: files.length };
  } else {
    return { ok: false, missing: 8 - files.length };
  }
}
```

### 大鹏确认检查
```javascript
function isPengConfirmed(reply) {
  const validConfirmations = ['确认', '执行', '开始', '可以提交渲染', 'GO', '提交吧'];
  return validConfirmations.includes(reply.trim());
}

function isInvalidReply(reply) {
  const invalidReplies = ['嗯', '好的', 'OK', '行', '发来看看', '我看一下', '随便', '你决定'];
  return invalidReplies.includes(reply.trim());
}
```

### 渲染提交检查
```javascript
function canSubmitRender() {
  return (
    preProductionCompleted &&        // 预生产完成
    feishuDocSent &&                 // 飞书文档已发送
    pengConfirmedExplicitly &&       // 大鹏明确确认
    !checkpoint.pending               // 无未确认检查点
  );
}
```

---

## 确认词定义

**有效确认词**（必须精确匹配）：
- "确认"
- "执行"
- "开始"
- "可以提交渲染"
- "GO"
- "提交吧"

**无效回复**（视为未确认，严禁推进）：
- "嗯"
- "好的"
- "OK"
- "行"
- "发来看看"
- "我看一下"
- "随便"
- "你决定"

---

## 严禁行为

| 严禁行为 | 后果 |
|---------|------|
| 跳过定妆照检查直接跑预生产 | 角色不一致风险，Pipeline终止 |
| 定妆照未确认就进入Stage 1-8 | 视为流程违规，必须回退 |
| 不写飞书文档直接提交渲染 | 无法审阅，禁止提交 |
| 大鹏未明确确认就擅自提交 | 严重违规，立即终止 |
| 使用Mock模式假装完成预生产 | 产出物无效，必须重跑 |
| 跳过对话标注（如启用） | 对白系统不完整 |
| 跳过节奏强化 | 叙事节奏平淡 |

---

## 系统集成

### 导演管线集成
```javascript
// director-pipeline.js v5.4-Peng
class DirectorPipeline {
  async run(userInput) {
    // Step 1: 定妆照检查
    const refCheck = await this.checkCharacterReferences();
    if (!refCheck.ok) {
      await this.generateCharacterRefs();
      await this.sendToPengForConfirmation();
      return { status: 'awaiting_confirmation', stage: 'character-ref' };
    }
    
    // Step 2: 等待大鹏确认定妆照
    // 这一步由外部触发（大鹏回复"确认"后恢复）
    
    // Step 3: 预生产流程
    await this.stage1_PRDGeneration();
    await this.stage2_RequirementAlignment();
    // ... Stage 3-8
    
    // Step 4: 生成完整Prompt
    const prompts = await this.generateAllPrompts();
    
    // Step 5: 飞书文档
    const doc = await this.generateFeishuDoc(prompts);
    await this.sendFeishuDoc(doc);
    
    // Step 6: 等待大鹏确认Prompt
    // 这一步由外部触发（大鹏回复"确认"后恢复）
    
    // Step 7: 渲染（大鹏确认后执行）
    // await this.stage9_Render();
    
    // Step 8: 后期制作
    // await this.stage10_PostProduction();
  }
}
```

### 检查点机制
```javascript
// .checkpoint.json
{
  "stage": "pre-production-review-pending",
  "confirmed": false,
  "timestamp": "2026-05-24T17:30:00+08:00",
  "productionDir": "/path/to/production",
  "resumeStage": 9,
  "pendingConfirmation": "prompt-review"
}
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0-Peng | 2026-05-24 | 初始版本，大鹏定义8步铁律 |

---

**制作人**: 小G | **审核**: 大鹏 👍
**文件位置**: `skills/shanhaijing-director/PREPRODUCTION-FLOW-v1.0-Peng.md`