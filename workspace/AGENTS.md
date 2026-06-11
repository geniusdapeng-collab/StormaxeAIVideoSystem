---

## 🔥 预生产执行规则 v3.0-Peng（Agent层差异化补充，2026-05-27）

**核心原则**：每次执行 = 全新执行，无视历史。旧数据可能过期，旧链路可能变更。

**版本调用**：必须使用当前最新版本的**主链路 + 所有模块**，版本号在 `versions/` 目录管理。

**Prompt提示词规范**：统一英文（台词Dialogue保留中文），1000英文词上限（约4000-5000字符，hard limit），目标950-990词，10个字段全部带上（CharacterRef、Timeline、Dialogue、AudioLayer、Character、Action、Scene、Mood、Camera、Lighting），检查环节强校验。

**执行标准**：
1. 清理旧输出（04-prompts/、99-reports/、.checkpoint.json等）
2. 跑完整链路 — 全部Stage全执行，不跳过
3. 全新数据 — 不读历史文件当输入，从源头重新生成
4. 当前版本 — 永远用最新代码，不引用旧版本逻辑
5. 严禁调用LLM推理 — 预生产/mock测试都必须真实调用LLM推理，只是不调用Seedance渲染

## 🚨 Agent行为铁律 v1.0-Peng（2026-06-11 固化）

**Pipeline产出即最终结果，Agent禁止越权**：
1. **禁止绕过Pipeline独立生成review文档** — Pipeline产出的审核报告是唯一权威版本，Agent不得在Pipeline完成后自行调用LLM生成替代性review/故事板/镜头方案
2. **禁止"补充"Pipeline产出** — 如果Pipeline产出6个镜头，Agent不得自行扩展为18个镜头或添加额外内容
3. **禁止修改Pipeline输出的任何文件** — 包括但不限于story-plan.json、prompt文件、审核报告
4. **闸机阻断必须停止** — 如果Pipeline抛出 `FATAL_BLOCKER` 错误，Agent必须停止并报告问题，禁止catch后继续
5. **定妆照缺失必须阻断** — 禁止在无定妆照的情况下继续生成Prompt

**违反后果**：Agent越权生成的内容视为无效，必须删除并重新跑Pipeline

**正确流程**：
```
Pipeline跑完 → 读取Pipeline产出文件 → 原样发送给大鹏审阅
（不补充、不重写、不扩展、不绕过）
```

**正确流程**：
```
队长说"跑"XX预生产 → 立即清理 → 完整链路 → 全新输出
（不解释、不确认、不犹豫）
```

**违反后果**：使用过期数据/链路 = 系统级错误，结果不可信

---

## 🔥 版本调用铁律 v6.31-Peng（2026-06-10 固化）

**所有预生产任务必须使用主链路最新版本，禁止调用任何旧版本。**

### 版本入口（从这里找最新版本）
- **当前版本**: `v6.34-Peng`（ShanhaiStory Forge v2.43-Peng）
- **入口文件**: `skills/shanhaijing-director/scripts/director-pipeline.js`
- **版本指针**: `skills/shanhaijing-director/versions/LATEST.md`
- **发布记录**: `skills/shanhaijing-director/RELEASE-v6.31-Peng.md`

### 调用方式（唯一正确方式）
```
node director-pipeline.js pre-production --production-dir <绝对路径> --worldview nirath
```

### 红线条款（违反=系统级错误）
1. **禁止指定版本号** — 不传 `--version` 参数，默认使用主链路最新版本
2. **禁止复用缓存** — 每次预生产必须用全新目录（`rm -rf` + `mkdir`）
3. **禁止跳过Stage** — 12阶段全执行，不跳过任何环节
4. **禁止使用旧文件** — 不读历史输出当输入，从 `00-prd/prd.md` 源头重新生成
5. **禁止跨版本混用** — 不引用旧版本文档、旧版 prompt 模板、旧版配置

### 版本升级流程
每次发布新版本时必须：
1. 修改 `director-pipeline.js` 中 `PIPELINE_VERSION` 常量
2. 更新 `versions/LATEST.md`（版本号+日期+核心变更）
3. 创建 `RELEASE-vX.XX.md` 发布记录
4. `git add` + `git commit` 提交
5. 更新本文件（AGENTS.md）和 SOUL.md 中的版本号

---

[继承: SOUL.md - 🏛️ 系统级设计哲学 v2.0-Peng（2026-05-27）]

> AGENTS.md 仅作为执行层引用，不做额外补充

---

---

## 🎬 渲染子流程铁律（2026-06-02 写入）

### 逐镜即时交付规则
每渲染成功一个镜头，**立即**下载视频 + 尾帧，**立即**发送给用户审阅。
- 不影响后期合成流程（全部渲染完后再统一合成）
- 目的：让用户提前看到镜头内容，及时反馈
- 执行优先级：渲染完成 → 下载 → 发送 → 继续下一镜头

### 镜头顺序强制规则
**严禁跳过镜头顺序执行**。
- 串行渲染必须严格按 S00→S01→S02→... 顺序
- 每个镜头必须使用前一镜头的尾帧作为首帧（首尾帧衔接）
- 若某镜头失败，必须修复或等待，不能跳过
- 严禁并行渲染导致帧衔接断裂

[继承: SOUL.md - 🎬 预生产流程铁律（v2.1-Peng，2026-05-25）]

> 实际 Pipeline 执行由 DirectorPipeline 负责
> 记忆固化：已同步写入所有子系统（Render Engine、Director Pipeline、seedance.js CLI）

[继承: SOUL.md - 🚨 防作弊行为约束（v1.0-Peng，2026-05-24）]

> 第6条 LLM推理强制调用（Agent层特有补充）
> 实际执行由 Director Pipeline 负责

[继承: SOUL.md - 🚨 P0级系统级优化原则（v1.0-Peng，2026-05-24）]

> 历史案例：Nirath栖息地标准化系统 v1.1-Peng、尾部注入拼接问题 v10.3-Peng-fix

[继承: SOUL.md - ### 绝对红线]

> Agent层执行清单：严禁绕过Pipeline、质检拦截时直接绕过、定妆照缺失时提交、PRD/故事板未确认时渲染、平均分配时长、Mock伪装预生产、本地模板替代LLM推理、Prompt不发MD确认就渲染、跳过定妆照确认。正确做法：质检拦截→修复→重走流程；定妆照缺失→生成8张→发大鹏确认；时长偏差→使用分配模块。

---

## 🐉 异兽视角叙事约束（系统级铁律，2026-05-31 写入）

[继承: SOUL.md - 🐉 异兽视角叙事约束（系统级铁律，2026-05-31 写入）]

> 记忆固化：已写入SOUL.md、AGENTS.md（引用）、PRD模板、StoryEngine规则、审片检查清单

---

## 🎙️ 旁白禁止约束（系统级铁律，2026-05-31 写入）

[继承: SOUL.md - 🎙️ 旁白禁止约束（系统级铁律，2026-05-31 写入）]

> 记忆固化：已写入SOUL.md、AGENTS.md（引用）、PRD模板、StoryEngine规则、PromptFieldStandard、审片检查清单

---

[继承: SOUL.md - 🎨 角色定妆照强制上传铁律（v1.0-Peng，2026-06-01 写入）]

> 实际渲染闸机由 Director Pipeline / Render Engine 执行
> 记忆固化：已同步写入所有子系统（Render Engine、Director Pipeline、seedance.js CLI）

<resource_constrained_tools>
### Browser tab 管理
Chrome tab 是沙箱里的**头号资源杀手**：在线上 OpenClaw 集群的 Mem Top10 里占 42%、CPU Top10 里占 70%。下面规则**全部**指 `browser` 工具自身的 action（不是别的 MCP），按"调用前 / 调用后 / 自查 / 兜底"四阶段顺序遵守，不要跳。
#### 调用 `browser action: "open"` 之前——必答两问
1. 我上一次 `open` 的 tab 是否还活着？活着 → 用 `action: "navigate"` + 它的 `targetId` 换 URL，**不要新开**。
2. 完成这次访问后，我下一步能不能立刻 `close`？不能 → 拆小任务，先不开。
#### 调用 `browser action: "open"` 之后——下一个 `browser` 工具调用必须是以下之一
- `action: "navigate"`（带 open 返回的 `targetId`）：复用此 tab 换 URL。
- `action: "close"`（带 open 返回的 `targetId`）：关闭此 tab，任务结束。
- `action: "snapshot"` / `"click"` / `"type"` 等：仅当**当前任务仍在这个 tab 上推进**时可用；任务做完仍必须显式 `close` 并传 `targetId`。
**严禁**下面这种序列（线上实测到的 chrome 内存 Top1 故障模式）：
    BAD:
      browser(open, url=A) → snapshot
      → browser(open, url=B) → snapshot
      → browser(open, url=C) → snapshot
      → …（任务结束未关）
      # 每次 open 都新建一个 tab；snapshot 不会关；chrome 堆栈式泄漏。
应该写成：
    GOOD:
      browser(open, url=A) → snapshot
      → browser(navigate, targetId=t1, url=B) → snapshot
      → … → browser(close, targetId=t1)
      # 始终复用同一个 tab；任务结束显式 close。
#### 异常时止损
发现 Chrome 卡顿、心跳延迟、沙箱负载升高：先 `close` 所有非活跃 tab；仍不行就让 shell 杀掉 chrome 进程（`pkill -INT chromium-browser` 或等价命令）让它按需重启，**不要**继续开新 tab。
### FFmpeg / 媒体编码使用限制
ffmpeg 默认吃满所有 CPU 核心，沙箱只有 1–2 vCPU，一次无约束转码就能拖垮心跳和 Browser。下面的规则**只针对 shell 直接调用的 `ffmpeg` / `ffprobe`**：
- **优先用 skill：** `skills/video-frames` 等媒体 skill 是已审查过的窄用例，跟着它们的写法走比自己手撸 ffmpeg 安全；只在 skill 不覆盖时才直接 shell `ffmpeg`。注意 `video-frames` 抽中后段帧用 `--time`（demuxer seek，几乎零 CPU）而非 `--index N`（会从头解码 N 帧）。
- **先 probe 再 encode：** 转码前先 `ffprobe -v error -threads 1 -show_streams -show_format -of json <input>` 拿到时长、码率、编码；能用 `-c copy` 流拷贝就绝不重编码；时长超 1200s 先 `-t` 截断或拒绝任务。
- **强制限线程：** 必须显式带 `-threads 1`（最多 `-threads 2`），滤镜链追加 `-filter_threads 1 -filter_complex_threads 1`。
- **软件编码必须 ultrafast：** x264/x265 统一 `-preset ultrafast`，禁止 `medium` 及以上预设；质量不够时降分辨率（`-vf scale=-2:720`）或降帧率（`-r 24`），不要靠提高 preset。
- **禁止并发 ffmpeg：** 同一沙箱内同时只允许一个 ffmpeg 进程，开下一个前用 `pgrep -x ffmpeg` 确认无残留；禁止 `xargs -P`、禁止循环里并行批处理。
- **必须前台 + 超时兜底：** 用 `timeout 45 ffmpeg -nostdin -hide_banner -loglevel error ...` 包一层（与上游 `MEDIA_FFMPEG_TIMEOUT_MS` 对齐，最多放宽到 `timeout 90`），ffprobe 用 `timeout 10`；禁止 `&` 后台、禁止 `nohup`，跑飞时必须能 Ctrl-C 打断。
- **中间产物即用即删：** 临时切片、调色板、`-pass 1` log 等，任务结束或失败时立即 `rm -f`，不要把 `/tmp/*.mp4`、`ffmpeg2pass-*.log` 留到下一个任务。
- **异常时硬停：** 沙箱变慢、心跳丢失、或 `frame=` 长时间不前进，立即 `pkill -INT ffmpeg`（不行就 `-KILL`）；**不要**重试相同命令，先降分辨率/preset 或改用流拷贝。
</resource_constrained_tools>
