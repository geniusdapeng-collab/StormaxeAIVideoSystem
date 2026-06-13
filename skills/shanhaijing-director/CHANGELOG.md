# Director Pipeline 版本历史

ShanhaiStory Forge v2.44-Peng | Director Pipeline v6.38-Peng-fix (Production)
大视频系统统一版本号:v2.44-Peng(山海经系列 + 通用视频系列)
 *
v6.38-Peng-fix 更新(2026-06-13)- 通用内容系统级修复(3项根因修复)
- 🔧 Fix 1: 内容类型感知的情绪默认值注入
  根因: 非山海经内容(教育/科普/医疗)的shot.emotion/mood为空时,LLM自由发挥会跑偏到悬疑/惊悚
  修复: stage8-support.js 新增 _detectContentMood() — 根据storyPlan.videoType/style推断内容类型
  教育/科普/医疗 → "warm, professional, educational, trustworthy, approachable"
  纪录片 → "cinematic, authentic, immersive, observational, natural"
  科技 → "modern, innovative, dynamic, polished, forward-looking"
  品牌 → "elegant, refined, sophisticated, timeless, premium"
  director-pipeline.js _normalizeShotInPlace 接入 contentMood 作为 shot.mood 默认值
- 🔧 Fix 2: 通用角色识别 — detectDominantRole() 不再硬编码白泽/小G
  根因: 非山海经内容的speaker可能是陈卓/医生/讲师等通用角色,旧逻辑只认白泽/小G
  修复: prompt-final-normalizer.js detectDominantRole() 三层优先级
  L1: shot.dialogues 显式 speaker → L2: storyPlan.characters 非山海经角色 → L3: 山海经关键词匹配
  fallback台词Map不再硬编码白泽/小G,通用角色使用"..."占位
- 🔧 Fix 3: 通用片头内容类型扩展
  opening-title-designer.js selectGeneralTemplate 新增 medical/医疗 关键词匹配
  director-pipeline.js _designGeneralOpeningTitle 新增 医疗/横纹肌/护士/医生 关键词检测
  确保医疗健康类内容自动路由到 clean_typography 模板(干净排版+专业氛围)
- 📝 影响范围: stage8-support.js, prompt-final-normalizer.js, director-pipeline.js, opening-title-designer.js
- ✅ 语法检查: 4/4 文件通过
 *
v6.20-Peng 更新(2026-06-06)- 5项功能增强Phase9-13全量落地
- 🆕 Phase 9: 导演审片6问决策树 — 替代旧5维评分,任何1问不通过立即阻断
  Q1戏剧张力/Q2视觉表达/Q3情感传递/Q4叙事连贯/Q5角色功能/Q6技术可行
- 🆕 Phase 10: 渲染失败诊断层级 — L1可重试/L2可修复/L3需替换/L4需人工/L5无法恢复
  5级诊断+自动恢复策略,render-diagnosis.js 444行
- 🆕 Phase 11: Scene Card结构化流程 — 每个镜头生成结构化Scene Card
  drama/visual/emotion/characters/tech/render/meta七层结构,scene-card.js 504行
- 🆕 Phase 12: P1-P5优先级评分系统 — 叙事30%+张力20%+复杂度20%+角色15%+风险15%
  分批渲染计划,自动优先处理高风险镜头,priority-scorer.js 382行
- 🆕 Phase 13: Color Script色彩脚本 — 22种预设色彩方案,自动分配+跳变检测
  暖/冷/自然/暗/梦幻/金属/中性7大色系,color-script.js 499行
 *
v6.13-Peng 更新(2026-06-05)- 29条外部专家修复清单全量落地
- 🆕 API层稳定性: requestJson 3次重试+指数退避、waitForTask 最大轮询+退避
  downloadToFile .partial断点续传、任务失败自动重试、TERMINAL_STATUSES补completed
- 🆕 Wrapper层可靠性: execCLI 5分钟超时+maxBuffer 50MB
- 🆕 Cache层安全性: _hash()完整prompt计算、CACHE_VERSION v2版本校验
  30天过期缓存自动清理、record原子写入(tmp→rename)
- 🆕 Prompt质量: NEG→POSITIVE_ANCHOR(正向锚定)、场景库lighting、动态时代背景
  sanitizePart防中文标点错误、精简策略3/4有效化、角色/场景/运镜正则优化
- 🆕 安全约束: 角色级负面约束接入、场景级forbidden检测、旁白检测拦截器
  PromptInjectionGuard 注入攻击防护、PromptDeduplicator 去重工具
- 🆕 合规保护: compliance标记保护、shotType适配镜头保留、.prompt-warnings.log告警
- 🆕 新增文件: prompt-deduplicator.js、prompt-injection-guard.js
 *
v6.12-Peng 更新(2026-06-05)- 链路稳定性全面强化
- 🆕 自动重试机制: Stage 9/10 导演优化+编剧优化自动重试1次
  失败时3秒后自动重试,仍失败则降级到本地规则引擎
- 🆕 链路监控报告: 每Stage输出成功率、耗时、重试次数
- 🆕 链路健康度评分: 0-100分,四维评分(成功率50%/耗时20%/重试20%/质量10%)
  低于80分自动报警,输出具体优化建议
- 🆕 S00片头合规修复: 适配旁白禁止约束,关键项BLOCK→警告项WARN
  旁白禁止下,片头以"标题卡+世界观呈现"为主,不强制旁白
- 🆕 PromptLengthOptimizer扩写Bug修复: 删除.repeat(2),精确控制追加量
  智能截断(优先句末)、温度优化(精简0.1/扩写0.3)、自动降级
- 🆕 重复代码清理: 删除旧版v2.0-Peng Stage 9/10重复代码块
 *
v6.11-Peng-fix3 更新(2026-06-04)- Defense Wrapper 适配器兼容
- 🆕 适配器 bypass 验证: verifyAdapterBypass() 函数验证 HMAC token
  支持 _adapterBypassAntiCheating {enabled, source, token} 结构
  保留 _skipAntiCheatingCheck 兼容旧版
 *
v6.11-Peng-fix 更新(2026-06-04)- 专家方案落地
- 🆕 LLM Record/Replay 缓存层: llm-caller-replay.js 三种模式
  passthrough(真实调用) | record(录制) | replay(回放)
- 🆕 统一 LLM Caller 工厂: createLLMCaller() 替代 new LLMCallerV2()
  环境变量控制: LLM_REPLAY_MODE, LLM_REPLAY_CACHE_DIR
- 🆕 分级 E2E 验证: 最低/半链路/全链路三级验收标准
- 🆕 受控 anti-cheating bypass: _adapterBypassAntiCheating + _skipAntiCheatingCheck
 *
v6.9-Peng 更新(2026-06-03)- PromptForge 导演编排系统集成
- 🆕 Stage 9: PromptForge 导演编排系统(后置处理模块)
  调用现有子系统(神兽档案库/Nirath档案/导演风格库/运镜库/台词库/质量标准)
  用导演思维将70分Prompt拉升至90分
  三阶流水线:理解(总导演)→ 创作(编剧+摄影)→ 合成(守门员)
  产出:导演意图文档 + 优化后Prompt + 质量报告
  轻量集成:核心代码~290行,只做导演编排,不重复建设子系统
  位置:Stage 8.3之后,预生产审核之前
  错误处理:PromptForge失败不阻断Pipeline,降级到Stage 8直接输出
 *
v6.8-Peng-fix2 更新(2026-06-01)- Stage 8质量校准注入,替代已删除的Stage 9-10
- 🔥 Stage 8末尾注入 `_stage83_QualityCalibration()` 补齐原Stage 9-10功能
  根因: 删除Stage 9-10后,Prompt质量校准(旁白清洗/内容去重/字段结构化/长度闭环/转场注入)缺失
  修复: 在 `stage8_2_PromptPreGeneration()` 末尾注入5项质量校准功能
  - 旁白清洗: _cleanVoiceover() - 保留Dialogue,清洗Voiceover
  - 内容去重: _deduplicateContent() - 跨镜头相似度>80%触发差异化
  - 字段结构化: _injectMissingFields() - 缺失字段从story-plan注入
  - 长度闭环: _enforceLengthLoop() - 直接substring+多源补充,避免fieldStandard重组失败
  - 转场注入: _injectTransitions() - 追加前缀后二次截断到1499,防止超限
- 🛡️ Prompt长度上限修正: 1000→1499,避免100%利用率被合规服务拦截
- 🎯 首次完整跑通: 全部8个镜头利用率95-99%通过
 *
v6.8-Peng-fix 更新(2026-05-31)- 删除导演优化+编剧优化环节
- 🔥 删除Stage 9-10(导演优化+编剧优化)
  根因: 这两个环节失败率极高,引入LLM评审→修复→重新生成闭环,但反而降低质量
  证据: Pipeline v9/v10 连续失败,导演优化后Prompt从950字降至278字,编剧优化写入[object Promise]
  修复: 删除 `_creativePolishing()` 和 Stage 9-10 调用,简化链路
  替代: Stage 8直接生成的Prompt已合格(expandPromptToTarget+validatePromptLength确保95-99%)
  影响: run()主流程跳过Stage 9-10,Stage 8之后直接预生产审核
- 🔥 保留旁白禁止约束(v6.8-Peng-fix同时发布)
  AudioNarrativeBlock → Dialogue,系统级禁止旁白/解说,只使用角色台词
 *
v6.7-Peng-fix 更新(2026-05-31)- 导演优化修复指令自动应用 + Stage 8重新生成
  [已废弃: v6.8-Peng-fix 删除导演优化环节]
- 🆕 方案A增强版落地: 导演优化输出修复指令(fixes),代码自动应用到story-plan
  [已废弃: v6.8-Peng-fix 删除此功能]
 *
v6.6-Peng-fix 更新(2026-05-31)- 导演优化/编剧优化主进程模式 + 编剧优化防退出修复
- 🔥 删除Subagent模式: _creativePolishing() 改为在主进程中直接调用LLM
  根因: Subagent独立子进程管道通信脆弱,write EPIPE频繁断裂
  修复: 复用Stage 2-8成功模式--主进程直接 await directorAgent.review() + optimizer.optimize()
  优势: 无子进程开销、无管道断裂风险、与前面环节完全一致
  降级: 导演优化/编剧优化任一失败时,创建空报告继续Pipeline不阻断
  超时保护: Promise.race 10分钟超时,避免无限等待
- 🛡️ 编剧优化防退出: _creativePolishing() 外层添加try/catch确保编剧优化异常不导致Pipeline中断
  根因: 编剧优化LLM调用可能因超大prompt(8983字)或内存问题导致进程异常退出
  修复: 导演优化和编剧优化各自独立try/catch,任一失败不影响另一环节
 *
v6.5-Peng-fix 更新(2026-05-31)- _extractJSON根因修复 + 防御性编程
- 🔥 _extractJSON 核心修复: 移除内部 JSON.parse,只返回字符串
  根因: 策略1/2/3成功时返回对象,调用方二次解析导致 "[object Object]" 错误
  修复: _extractJSON 始终返回 JSON 字符串或 null,调用方自行 JSON.parse
- 🛡️ 防御性编程3处落地:
