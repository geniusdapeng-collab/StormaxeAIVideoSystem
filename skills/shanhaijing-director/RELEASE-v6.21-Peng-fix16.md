# RELEASE v6.21-Peng-fix16 — 提示词英文统一 + 1000 词限制

**日期**: 2026-06-07
**类型**: 系统级规范统一（全链路）
**验证场景**: 白泽预生产

---

## 🔥 核心变更总览

| 类别 | 变更 | 影响范围 |
|------|------|----------|
| 字符限制 | 980/988/990 → 1000 | 10 个文件 |
| 语言统一 | 描述内容改英文，台词保留中文 | 全链路 |
| 字段名 | 10 个字段名全部英文 | 全链路 |
| 调试清理 | 移除 22 条 debug console.log | director-pipeline.js |

---

## 1. 字符限制统一为 1000

### 修改前

- `TARGET_MAX = 980`
- `targetLength = 988`
- `MAX_PROMPT_LENGTH = 990`
- 各模块分散定义，不一致

### 修改后

统一为 `1000`（英文词），10 个文件全部更新：

| 文件 | 修改参数 |
|------|----------|
| `char-counter.js` | `TARGET_MAX=1000`, `HARD_LIMIT=1000` |
| `compliance-agent.js` | `MAX_PROMPT_LENGTH=1000` |
| `config-center.js` | `promptMaxLength=1000` |
| `prompt-metrics.js` | `HARD_LIMIT=1000` |
| `prompt-field-standard.js` | `TARGET_MAX=1000` |
| `director-pipeline.js` | 所有 980/988/990 → 1000 |
| `seedance-render-engine.js` | `targetLength=1000`, `MIN_TARGET=1000`, `FINAL_MIN=1000` |
| `prompt-engine-v2.js` | `truncate default=1000`, `targetLength default=1000` |
| `prompt-optimizer.js` | `MAX_PROMPT_LENGTH=1000` |
| `smart-prompt-extractor-v6.12.js` | `promptMaxLength default=1000` |

### 根因

Seedance 官方建议：中文 ≤500 字，英文 ≤1000 词。
超长 prompt 不会报错，但模型注意力会分散，细节可能被忽略。
统一为 1000 英文词更合理，利用率更宽松。

---

## 2. 提示词内容英文统一

### 原则

- **10 个字段名**: 全部英文（CharacterRef, Timeline, Dialogue, AudioLayer, Character, Action, Scene, Mood, Camera, Lighting）
- **字段描述/示例**: 全部英文
- **LLM 系统提示词**: 全部英文
- **Dialogue 台词**: 保留中文（TEXT 字段内容）

### 修改文件

#### prompt-field-standard.js

| 字段 | 修改内容 |
|------|----------|
| description | 全部改英文（10 个字段） |
| examples | 全部改英文（Dialogue TEXT 保留中文） |
| mustContain | 全部改英文 |
| forbiddenActions | 全部改英文 |

#### serial-promptforge-v6.12.js

- LLM 系统提示词：电影摄影师提示词改英文
- 用户提示词：生成核心叙事改英文

#### prompt-length-optimizer.js

- 精简提示词系统提示词改英文
- 扩充提示词系统提示词改英文

#### scriptwriter-optimizer.js

- 编剧优化系统提示词改英文
- 视觉描述扩充系统提示词改英文

#### seedance-render-engine.js

- 情绪视觉翻译：`language: 'mixed'` → `language: 'english'`
- 角色双锚点：注释改英文

#### prompt-engine-v2.js

- JSON 映射：清理中文别名（如 `'角色'`, `'动作'`, `'场景'` 等）
- 规范化：`fields.scene = ${fields.mood}环境` → `${fields.mood} atmosphere, environmental mood`

---

## 3. 调试代码清理

### director-pipeline.js

- 移除 22 条 debug console.log
- 包括：`_enforceSingleShotFields`, `SafeInject`, `Gate Pre-Check`, `Gate Write`, `replaceRefImages`, `DEBUG Stage83`

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| char-counter.js | 参数修改 | TARGET_MAX, HARD_LIMIT → 1000 |
| compliance-agent.js | 参数修改 | MAX_PROMPT_LENGTH → 1000 |
| config-center.js | 参数修改 | promptMaxLength → 1000 |
| prompt-metrics.js | 参数修改 | HARD_LIMIT → 1000 |
| prompt-field-standard.js | 语言统一 | 字段描述/示例/规则改英文 |
| director-pipeline.js | 参数修改+清理 | 980/988/990 → 1000 + 移除 22 条 debug |
| seedance-render-engine.js | 参数修改+语言 | targetLength → 1000, language → english |
| prompt-engine-v2.js | 参数修改+清理 | default → 1000, 清理中文映射 |
| prompt-optimizer.js | 参数修改 | MAX_PROMPT_LENGTH → 1000 |
| smart-prompt-extractor-v6.12.js | 参数修改 | promptMaxLength → 1000 |
| serial-promptforge-v6.12.js | 语言统一 | LLM 系统提示词改英文 |
| prompt-length-optimizer.js | 语言统一 | LLM 系统提示词改英文 |
| scriptwriter-optimizer.js | 语言统一 | LLM 系统提示词改英文 |

**总计**: 13 个文件修改

---

## 向后兼容性

- 字符限制从 980 提升到 1000，更宽松，不会导致截断增加
- 英文统一不影响现有中文台词输出
- 字段名保持英文，与之前版本一致

---

## 验证方法

```bash
cd skills/shanhaijing-director
node scripts/director-pipeline.js produce \
  --production-dir <test-dir> \
  --skip-render
```

验证要点：
- 所有 prompt ≤1000 字符
- 10 个字段名全部英文
- Dialogue TEXT 保留中文台词
- 其他字段内容以英文为主
