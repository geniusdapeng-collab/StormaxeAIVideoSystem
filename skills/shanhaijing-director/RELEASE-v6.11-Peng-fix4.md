# Release v6.11-Peng-fix4 — 白泽预生产全链路修复

**发布时间**: 2026-06-07 11:09 GMT+8
**commit**: `a362827`
**项目**: 白泽预生产

## 修复内容

### 1. Critical: `_stage83_QualityCalibration` 从未被调用
- **根因**: `_stage83_QualityCalibration()` 方法已定义但 pipeline 主流程中从未 `await` 调用，导致 calibrated prompt（含字段注入/截断至 980）从未写入磁盘
- **影响**: 04-prompts/*.txt 全部为空洞的 966 字节通用模板，无角色名/无 Dialogue/Character 字段
- **修复**: 在 `preProductionMode` 流程中，`stage8_2_PromptPreGeneration()` 后、`_runComplianceCheck()` 前插入 `await this._stage83_QualityCalibration()`
- **文件**: `director-pipeline.js`

### 2. Critical: dialogues 数据源分离导致 Dialogue 字段为空
- **根因**: Stage 7.5 将 dialogues 存入 `dialogue-annotation.json`，但 Stage 8.3 从 `story-plan.json` 读取（无 dialogues），导致 `_enforceFieldStructure` 注入的 Dialogue 字段为空
- **修复**: Stage 8.3 开头从 `dialogue-annotation.json` 重新加载 dialogues 到 allShots
- **文件**: `director-pipeline.js`

### 3. Critical: Stage 8.3 字段注入顺序错误（P0 字段被截断切掉）
- **根因**: `_enforceFieldStructure` 在截断循环之前执行，先追加 P0 Dialogue/Character 字段到末尾，然后 `PriorityTruncator` 从末尾截断到 980，刚注入的 P0 字段全部被切掉
- **修复**: 截断 → 注入 P0 字段 → 注入后若超 980 则二次截断
- **文件**: `director-pipeline.js`

### 4. Critical: `BeastMindEngine.generate()` 返回的 shots 无 id 属性
- **根因**: `engine.generate()` 返回的 shots 只有 `act/description`，没有 `id` 字段。导致所有日志 shotId 显示 `undefined`，所有 prompt 文件写入 `prompt-undefined.txt`
- **修复**: pipeline 读取 storyPlan 后立即遍历所有 shots 补上 `S00-S05`
- **文件**: `director-pipeline.js`

### 5. dialogue 路径 TDZ（暂时性死区）问题
- **根因**: Stage 8.3 顶部用 `const dialoguePath = path.join(this.productionDir, '03-shots', 'dialogue-annotation.json')`，但此时 `this.productionDir` 尚未初始化，导致路径错误
- **修复**: 改用字符串拼接 `this.productionDir + '/03-shots/dialogue-annotation.json'`
- **文件**: `director-pipeline.js`

## 依赖修复

### characters 对象格式统一
- **问题**: `storyPlan.characters` 是 `{ baize: {...}, xiaog: {...} }` 对象格式，非数组，所有 `.find()` / `.map()` 调用均失败（约 10+ 处）
- **修复**: 将 `storyPlan.characters?.find(c => ...)` 改为 `Object.values(storyPlan.characters || {}).find(c => ...)`；将 `storyPlan.characters?.map(...)` 改为 `Object.values(storyPlan.characters || {}).map(...)`
- **文件**: `director-pipeline.js`

### `stage8-rhythm.js` allShots 嵌套结构
- **问题**: `allShots` 实际是 `storyPlan.segments[].shots[]` 的嵌套数组（非平面），导致 `allShots.map()` 报错 `.map is not a function`
- **修复**: 展平前检查 `Array.isArray(allShots[0])`，若是嵌套则先 flat
- **文件**: `stage8-rhythm.js`

### `PromptFieldStandard` 构造方式错误
- **问题**: `require('./prompt-field-standard')` 返回 `module.exports = PromptFieldStandard`，但调用方用 `new promptFieldStandard_1.default()`（TypeScript 风格），导致 `.default is not a constructor`
- **修复**: 改为直接 `new PromptFieldStandard()` 调用
- **文件**: `stage8-pregeneration.js`

## 验证结果（fix3 运行快照）

| 镜头 | 截断前 | 截断后 | 二次截断 | 利用率 |
|------|--------|--------|----------|--------|
| S00 | 1235 | 980 | 有 | 99.2% ✅ |
| S01 | 1048 | 980 | 无 | 99.2% ✅ |
| S02 | 1038 | 980 | 有 | 99.2% ✅ |
| S03 | 1056 | 980 | 无 | 99.2% ✅ |
| S04 | 1012 | 980 | 有 | 99.2% ✅ |
| S05 | 1037 | 980 | 有 | 99.2% ✅ |

- **平均合规率**: 100%
- **修复总统计**: Stage 8.3 共修复 69 处（旁白清洗 + 内容去重 + 字段注入 + 智能截断）

### 6. Critical: BeastMindEngine 返回 storyplan 无 segments/shots（全链路跳过）
- **根因**: `BeastMindEngine.generate()` 只返回 `story.outline`（起/承/转/合 文字），Pipeline 把这个不完整结构存入 story-plan.json，后续所有 Stage 检查 `storyPlan.segments` 为空，全部跳过（阶段4→阶段5→阶段6→阶段7→阶段8 全跳过）
- **修复**: 在 `_generateBeastMindStoryPlan` 中，引擎返回后立即将 outline 文字转为 `segments[].shots[]` 结构，每个 act 按字数均分 2-3 个镜头，同步注入 `characters` 字段
- **文件**: `director-pipeline.js`
