# 🎬 ShanhaiStory Forge — v6.30-Peng 发布记录

**发布日期**: 2026-06-10
**版本**: v6.30-Peng
**入口**: `skills/shanhaijing-director/scripts/director-pipeline.js`

---

## 本次发布：fix40 字段重复修复 + 广告植入系统 v1.0

### fix40 — 字段二次注入根因修复（v6.29-Peng-fix40）
**根因**: `normalizeShotPromptFields` 在两次 `_enforceSingleShotFields` 调用之间运行，将 `shot._generatedPrompt` 改成标准化格式，导致第二次调用时 `basePrompt` 与第一次不同，但清理后的 `cleanedBase` 里已有 `【】` 标签。

**方案**: `_enforceSingleShotFields` 始终从 `shot._generatedPrompt` 读取最新内容（而非维护累积的 `cleanedBase`），从根源消除状态残留。

**文件**: `director-pipeline.js`

---

## 新增：山海经广告植入系统 v1.0

**路径**: `productions/product-archive/`

### Phase 1：商品档案库 ✅
- 品牌入驻模板 + Manner 咖啡档案 + 千问眼镜档案
- 15 种产品揭示镜头（`product-reveal.js`）
- 20 种植入方式（`brand-integration.js`）

### Phase 2：创意锚定 ✅
- `narrative-adapter.js` — 产品卖点×故事节点最优映射
- `brand-story-prompt-generator.js` — 品牌→山海经叙事语言转化
- `integration-checklist.js` — 12 项质检清单
- `examples/example-baize-manner.js` — 白泽×Manner 融合示例

### Phase 3：渲染保护 ✅
- `render-guard.js` — 四大保护维度（Logo/竞品/色调/负面场景）
- `logo-shield.js` — Logo 黄金法则（永不直接描述品牌名）
- `brand-safety-validator.js` — 8 维度品牌安全校验
- `seedance-negative-prompt-builder.js` — 负面提示词构建器

### Phase 4：植入模式 ✅
- `integration-modes.js` — 四种标准化模式（15秒高光/全程植入/开场标版/结尾呼出）
- `mode-selector.js` — 6 维度智能决策树
- `ad-shot-library/mode-prompts.js` — 四种模式 Seedance Prompt 模板
- `ad-modes-catalog.json` — 模式目录

---

## 新增：AI 视频提示词工程指南
**路径**: `skills/shanhaijing-cinematography/ai-video-prompt-engineering-guide.md`

源自 Seedance 2.0 官方规范的系统化提炼，涵盖：
- 6 步公式（主体→动作→环境→镜头→风格→约束）
- 光线描述优先级最高原则
- 逆光×轮廓光系统
- 丁达尔光×绝壁裂缝方案
- 质感真实化（不完美注入打破 AI 色块感）

---

## 调用方式

```bash
# 默认叙事模式（30-120s，7镜，故事弧线）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath

# 广告植入模式
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath --brand manner-coffee --ad-mode highlight-15s
```
