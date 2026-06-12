# Seedance Video Production System — 架构师级审视报告
## 审视人：小G | 审视时间：2026-05-13 | 系统版本：v2.3.0-Peng

---

## 一、系统现状总览

**代码规模**：8482行JS，8个核心子系统，7阶段流水线
**架构模式**：中央指挥（director.js）+ 7阶段串行管线 + 3大独立子系统

### 当前阶段流水线
```
Phase 1: Story Engine → story-plan.json
Phase 2: Character Manager → 角色锚定 + 4视图 + injectPrompt
Phase 2.5: Dialogue Engine → 台词 + TTS音频
Phase 3: Shot Design → 镜头提示词（6步公式）
Phase 3.5: MicroMotion → 微动作增强
Phase 3.6: 合规优化闸机 → 提示词规范化
Phase 4: Seedance Wrapper → 渲染提交
Phase 5.5: Sound Design → 声音设计
Phase 6: Post Production → 后期合成
Phase 7: 汇总交付
```

---

## 二、架构级问题（按严重程度排序）

### 🔴 P0 — 镜头与提交的对齐逻辑缺失

**问题**：当前系统把"镜头"和"渲染提交"混为一谈。每个镜头固定11秒，一个镜头=一次API提交。

**正确逻辑**：
- 镜头是叙事单位，有自己的自然时长（3-20秒）
- API提交是平台限制（2-12秒/次）
- 两者不应1:1绑定

**影响**：
- 长镜头被强行截断，丢失叙事完整性
- 短镜头被拉长到11秒，浪费配额且画面拖沓
- 无法实现"多短镜头合并提交"或"长镜头拆分提交"

**建议方案**：
```
新增: LensScheduler（镜头调度器）
- 输入：镜头列表（每个镜头有自然时长）
- 输出：提交计划（哪些镜头合并、哪些拆分）
- 规则：
  - 镜头 ≤12秒 → 独立提交（duration=镜头时长）
  - 镜头 >12秒 → 拆成首帧+尾帧连续提交
  - 相邻短镜头 → 合并成1次提交（总时长≤12秒）
```

### 🔴 P0 — MicroMotion增强与6步公式的割裂

**问题**：MicroMotion的5个Agent（face/body/eye/breath/world）生成的cue是**直接追加在prompt末尾**，排在avoid后面。优化闸机把它们截掉了，导致MicroMotion增强效果**实际丢失**。

**根因**：MicroMotion子系统设计时，输出格式是"原始prompt + cue追加"，而不是融入6步公式内部。

**建议方案**：
```
改造: MicroMotion的输出应返回结构化增强数据
{
  subjectEnhancements: ["金色毛发微微飘动"],  // 融入主体段
  actionEnhancements: ["瞳孔微缩，呼吸起伏"],  // 融入动作段
  environmentEnhancements: ["薄雾缓缓流动"],   // 融入环境段
  cameraEnhancements: [],                       // 融入镜头段
  styleEnhancements: []                         // 融入风格段
}

然后 generateShotPrompt() 在组装6步公式时，将增强数据融入对应位置。
这样 avoid 约束永远在最后，微动作信息不会丢失。
```

### 🟡 P1 — 回调URL替代轮询

**问题**：当前轮询逻辑每30秒查询一次任务状态，429风险高，且浪费API配额。

**官方支持**：`callback_url` 参数，任务完成自动POST通知。

**建议方案**：
```
新增: CallbackServer（轻量HTTP服务）
- 启动时分配临时端口
- 收到回调后更新任务状态
- 超时未回调时降级为轮询（兜底）
- 优点：零轮询=零429风险+更快的任务完成感知
```

### 🟡 P1 — 尾帧连续生成

**问题**：当前每个镜头独立生成，镜头之间画面不连贯（角色位置/姿势/环境跳变）。

**官方支持**：`return_last_frame: true` 返回尾帧，下一个镜头用尾帧作首帧。

**建议方案**：
```
LensScheduler 调度时：
1. 第1个镜头：文生视频（纯文本提示词）
2. 后续镜头：图生视频（上一镜头尾帧作首帧 + 文本提示词）
3. 效果：画面连贯性质的飞跃
```

### 🟡 P1 — 错误恢复与断点续传

**问题**：如果渲染过程中断（网络/配额/崩溃），只能从头重跑。没有断点续传。

**建议方案**：
```
新增: Checkpoint机制
- 每个Phase完成后写入 checkpoint.json
- 重启时读取checkpoint，跳过已完成的Phase
- Phase4逐镜头提交时，已成功的镜头跳过
- 飞书通知：中断时自动通知owner
```

### 🔵 P2 — 数据流标准化

**问题**：各子系统之间的数据格式不统一：
- story-engine → JSON
- character-manager → JSON（但injectPrompt格式有bug）
- shot-design → Markdown文件
- MicroMotion → JSON（但enhanced字段是纯文本拼接）
- 各子系统对"shot"的理解不同（有的用id，有的用shotId）

**建议方案**：
```
定义: ShotContext 统一数据结构
{
  id: "S01",
  shotId: "S01",          // 统一
  duration: 8,            // 自然时长（非固定11秒）
  characters: [...],
  description: "...",
  environment: "...",     // 必填，不能为空
  camera: "...",
  handoff: "...",
  emotion: {...},
  prompt: {               // 结构化提示词
    subject: "...",
    action: "...",
    environment: "...",
    camera: "...",
    style: "...",
    constraints: "..."
  },
  microMotion: {          // MicroMotion增强（结构化）
    face: "...",
    body: "...",
    eye: "...",
    breath: "...",
    world: "..."
  },
  renderStatus: "pending" // 渲染状态追踪
}
```

### 🔵 P2 — 可观测性不足

**问题**：系统运行时缺乏实时监控：
- 无法看到当前在跑哪个Phase
- 无法看到每个镜头的渲染状态
- 无法看到API配额消耗
- 无法看到提示词优化前后的对比

**建议方案**：
```
新增: Dashboard页面（或飞书消息推送）
- Phase进度条
- 每个镜头状态（pending/rendering/done/failed）
- API配额消耗统计
- 提示词优化前后diff
- 预计完成时间
```

---

## 三、系统亮点（值得保留的）

1. **6步公式提示词结构** — 清晰、合规、易维护
2. **智能合规优化闸机** — 中文优先，5层递进压缩，100%信息保留
3. **MicroMotion子系统** — 5Agent + MotionStateBus + 融合权重，架构设计优秀
4. **角色锚定管线** — PersonaVault + 4视图 + injectPrompt，角色一致性保障
5. **串行提交策略** — 优先稳定性，429重试指数退避
6. **模型自动降级** — Pro→ProFast→Lite→Seedream兜底，零崩溃

---

## 四、优化优先级路线图

```
V2.3.0（当前）→ V2.4.0 → V2.5.0 → V3.0.0

V2.4.0（近期，1-2天）：
  1. [P0] MicroMotion融入6步公式（不再追加在avoid后）
  2. [P1] 回调URL替代轮询
  3. [P1] 尾帧连续生成
  4. [P1] 断点续传

V2.5.0（中期，3-5天）：
  1. [P0] LensScheduler镜头调度器（叙事时长 vs 平台限制）
  2. [P2] ShotContext统一数据结构
  3. [P2] 可观测性Dashboard

V3.0.0（远期）：
  1. 实时音视频预览
  2. A/B测试框架（同一镜头不同提示词对比）
  3. 用户反馈闭环（渲染效果评分→提示词优化）
```

---

## 五、总结

这套系统已经从"能跑"进化到"能用"，核心架构7阶段流水线+3大子系统的设计是合理的。当前最大的2个结构性问题是：

1. **镜头叙事逻辑被平台限制绑架** — 需要LensScheduler解耦
2. **MicroMotion增强效果被优化闸机截掉** — 需要改造为结构化融入

修复这两个问题后，系统将从"能用"跃升到"好用"。

---

*审视完毕。有问题随时问。—— 小G 🦞*
