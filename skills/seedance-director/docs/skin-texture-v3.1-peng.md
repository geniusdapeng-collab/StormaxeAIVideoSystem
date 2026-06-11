# 真人皮肤质感 — V3.1-Peng 注入规范

> **问题**：AI 生成的人物皮肤太光滑、太完美，有"磨皮感"，一眼 AI 假。
> **解决**：在全工作流 4 个环节注入真人皮肤纹理描述，禁止 AI 塑料感皮肤。
> **生效范围**：drama / documentary / educational / commercial 四种写实类型。

## 注入环节

### 1. Phase 0：角色定妆照（seedream-wrapper.js）
- 特写镜头 prompt 增加皮肤纹理描述
- 关键词：`皮肤纹理真实可见，毛孔清晰，轻微肤色不均，拒绝磨皮光滑感，拒绝塑料感皮肤，拒绝AI磨皮滤镜`

### 2. Phase 2：角色锚定（character-manager.js）
- `buildAnchorKeywords()` 中检测类人角色，自动注入皮肤纹理到 summary 和 injectPrompt
- 判断条件：species 不含"机械"/"兽形"/"四足"
- 注入内容：`皮肤质感：真实皮肤纹理可见，毛孔清晰，轻微肤色不均，拒绝磨皮光滑感，拒绝AI塑料感皮肤`

### 3. Phase 3：分镜提示词（director.js — generateShotPrompt）
- **主体段注入**：写实类视频类型在 subject 段追加 `真实皮肤纹理可见，毛孔清晰，轻微肤色不均，拒绝磨皮光滑感`
- **负面约束注入**：avoidClause 追加 `, avoid plastic skin, avoid airbrushed skin, avoid overly smooth skin, avoid CGI perfect skin`

### 4. 合规优化保护（optimizePromptForSeedance）
- 皮肤纹理关键词不在 fluffPatterns 中（不会被当废话删除）
- 不在 compressions 精简列表中（不会被同义缩短）
- avoid 子句整体保护（截断时保留完整 avoid 内容）

## 设计原则

1. **正面描述 + 负面约束双保险**：既说"要什么"，也说"不要什么"
2. **类人角色区分**：机械/兽形角色不注入（它们本来就不是真人皮肤）
3. **视频类型区分**：动作片（action）不强制注入（打斗场景可能不需要皮肤细节），写实类必须注入
4. **中英文混合**：主体描述用中文（融入人物外貌），avoid 用英文（API 原生约束格式）

## 关键词库

| 类型 | 关键词 |
|------|--------|
| 正面-纹理 | 皮肤纹理真实可见、毛孔清晰、细微纹理自然 |
| 正面-瑕疵 | 轻微肤色不均、自然瑕疵、不对称细节 |
| 正面-质感 | 真实肤质、非CGI皮肤、非磨皮处理 |
| 负面-禁止 | avoid plastic skin、avoid airbrushed skin、avoid overly smooth skin、avoid CGI perfect skin、拒绝磨皮光滑感、拒绝AI塑料感皮肤 |
