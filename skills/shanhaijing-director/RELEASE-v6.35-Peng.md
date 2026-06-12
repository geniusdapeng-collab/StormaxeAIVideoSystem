# RELEASE v6.35-Peng — userInput 空值根因修复

**发布日期**: 2026-06-11
**版本**: v6.35-Peng
**入口**: `scripts/director-pipeline.js`

## 🔧 修复内容

### 根因
Pipeline CLI `main()` 中 PRD 标题提取正则 `/^#\s*产品需求文档.*?[-\-]\s*(.+)/` 期望格式 "产品需求文档 - 白泽"，但实际 PRD 格式为 "# 白泽 - 产品需求文档"，导致正则不匹配 → `userInput.title` 保持默认值 "未命名" → BeastMindEngine 从 `userInput.title` 取异兽名拿到 "未命名" → LLM 放飞自我生成通用奇幻故事。

### 修复清单

| # | 文件 | 修复内容 |
|---|------|---------|
| 1 | `director-pipeline.js` main() | PRD 标题提取：新增 `# 异兽名 - 产品需求文档` 格式正则，优先匹配，失败回退旧格式 |
| 2 | `director-pipeline.js` _summarizePRD() | 同上修复 |
| 3 | `stage1-prd.js` | PRD 有效性校验标题提取正则修复（之前误判有效 PRD 为无效） |
| 4 | `director-pipeline.js` main() | 新增 `--outline` CLI 参数支持 |
| 5 | `director-pipeline.js` main() | PRD outline 提取上限 200→500 字符 |

### 版本号
- `PIPELINE_VERSION`: v6.34-Peng → v6.35-Peng
- `versions/LATEST.md`: 更新
- `AGENTS.md`: 更新
- `HEARTBEAT.md`: 更新

### 影响范围
- `director-pipeline.js` (3处)
- `stage1-prd.js` (1处)
- 4个文档文件
