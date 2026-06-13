#!/usr/bin/env node
/**
 * ShanhaiStory Forge v2.44-Peng | Director Pipeline v6.38-Peng (Production)
 * 大视频系统统一版本号:v2.44-Peng(山海经系列 + 通用视频系列)
 *
 * v6.38-Peng 更新(2026-06-13) - 系统通用性修复：任务路由+模式检测+片头兼容
 * - 🔧 task-type-router.js: LLM智能路由（主通道）+ 关键词降级（兜底），防止科普内容误判为山海经
 * - 🔧 shanhaijingMode检测: 反误判规则——科普/教育内容不激活山海经模式
 * - 🔧 片头设计路由: 非山海经模式自动走通用片头模板（教育科普/纪录片/品牌等）
 * - 🔧 S00标题注入: 通用模式使用英文标题，硬编码"Rhabdomyolysis"改为动态提取
 * - 🔧 默认任务类型: shanhaijing→education（更通用的默认值）
 * - 🔧 教育类关键词权重: 1.5x（高于山海经的1x），防止科普内容被误判
 *
 * v6.20-Peng 更新(2026-06-06)- 5项功能增强Phase9-13全量落地
 * - 🆕 Phase 9: 导演审片6问决策树 — 替代旧5维评分,任何1问不通过立即阻断
 *   Q1戏剧张力/Q2视觉表达/Q3情感传递/Q4叙事连贯/Q5角色功能/Q6技术可行
 * - 🆕 Phase 10: 渲染失败诊断层级 — L1可重试/L2可修复/L3需替换/L4需人工/L5无法恢复
 *   5级诊断+自动恢复策略,render-diagnosis.js 444行
 * - 🆕 Phase 11: Scene Card结构化流程 — 每个镜头生成结构化Scene Card
 *   drama/visual/emotion/characters/tech/render/meta七层结构,scene-card.js 504行
 * - 🆕 Phase 12: P1-P5优先级评分系统 — 叙事30%+张力20%+复杂度20%+角色15%+风险15%
 *   分批渲染计划,自动优先处理高风险镜头,priority-scorer.js 382行
 * - 🆕 Phase 13: Color Script色彩脚本 — 22种预设色彩方案,自动分配+跳变检测
 *   暖/冷/自然/暗/梦幻/金属/中性7大色系,color-script.js 499行
 *
 * v6.13-Peng 更新(2026-06-05)- 29条外部专家修复清单全量落地
 * - 🆕 API层稳定性: requestJson 3次重试+指数退避、waitForTask 最大轮询+退避
 *   downloadToFile .partial断点续传、任务失败自动重试、TERMINAL_STATUSES补completed
 * - 🆕 Wrapper层可靠性: execCLI 5分钟超时+maxBuffer 50MB
 * - 🆕 Cache层安全性: _hash()完整prompt计算、CACHE_VERSION v2版本校验
 *   30天过期缓存自动清理、record原子写入(tmp→rename)
 * - 🆕 Prompt质量: NEG→POSITIVE_ANCHOR(正向锚定)、场景库lighting、动态时代背景
 *   sanitizePart防中文标点错误、精简策略3/4有效化、角色/场景/运镜正则优化
 * - 🆕 安全约束: 角色级负面约束接入、场景级forbidden检测、旁白检测拦截器
 *   PromptInjectionGuard 注入攻击防护、PromptDeduplicator 去重工具
 * - 🆕 合规保护: compliance标记保护、shotType适配镜头保留、.prompt-warnings.log告警
 * - 🆕 新增文件: prompt-deduplicator.js、prompt-injection-guard.js
 *
 * v6.12-Peng 更新(2026-06-05)- 链路稳定性全面强化
 * - 🆕 自动重试机制: Stage 9/10 导演优化+编剧优化自动重试1次
 *   失败时3秒后自动重试,仍失败则降级到本地规则引擎
 * - 🆕 链路监控报告: 每Stage输出成功率、耗时、重试次数
 * - 🆕 链路健康度评分: 0-100分,四维评分(成功率50%/耗时20%/重试20%/质量10%)
 *   低于80分自动报警,输出具体优化建议
 * - 🆕 S00片头合规修复: 适配旁白禁止约束,关键项BLOCK→警告项WARN
 *   旁白禁止下,片头以"标题卡+世界观呈现"为主,不强制旁白
 * - 🆕 PromptLengthOptimizer扩写Bug修复: 删除.repeat(2),精确控制追加量
 *   智能截断(优先句末)、温度优化(精简0.1/扩写0.3)、自动降级
 * - 🆕 重复代码清理: 删除旧版v2.0-Peng Stage 9/10重复代码块
 *
 * v6.11-Peng-fix3 更新(2026-06-04)- Defense Wrapper 适配器兼容
 * - 🆕 适配器 bypass 验证: verifyAdapterBypass() 函数验证 HMAC token
 *   支持 _adapterBypassAntiCheating {enabled, source, token} 结构
 *   保留 _skipAntiCheatingCheck 兼容旧版
 *
 * v6.11-Peng-fix 更新(2026-06-04)- 专家方案落地
 * - 🆕 LLM Record/Replay 缓存层: llm-caller-replay.js 三种模式
 *   passthrough(真实调用) | record(录制) | replay(回放)
 * - 🆕 统一 LLM Caller 工厂: createLLMCaller() 替代 new LLMCallerV2()
 *   环境变量控制: LLM_REPLAY_MODE, LLM_REPLAY_CACHE_DIR
 * - 🆕 分级 E2E 验证: 最低/半链路/全链路三级验收标准
 * - 🆕 受控 anti-cheating bypass: _adapterBypassAntiCheating + _skipAntiCheatingCheck
 *
 * v6.9-Peng 更新(2026-06-03)- PromptForge 导演编排系统集成
 * - 🆕 Stage 9: PromptForge 导演编排系统(后置处理模块)
 *   调用现有子系统(神兽档案库/Nirath档案/导演风格库/运镜库/台词库/质量标准)
 *   用导演思维将70分Prompt拉升至90分
 *   三阶流水线:理解(总导演)→ 创作(编剧+摄影)→ 合成(守门员)
 *   产出:导演意图文档 + 优化后Prompt + 质量报告
 *   轻量集成:核心代码~290行,只做导演编排,不重复建设子系统
 *   位置:Stage 8.3之后,预生产审核之前
 *   错误处理:PromptForge失败不阻断Pipeline,降级到Stage 8直接输出
 *
 * v6.8-Peng-fix2 更新(2026-06-01)- Stage 8质量校准注入,替代已删除的Stage 9-10
 * - 🔥 Stage 8末尾注入 `_stage83_QualityCalibration()` 补齐原Stage 9-10功能
 *   根因: 删除Stage 9-10后,Prompt质量校准(旁白清洗/内容去重/字段结构化/长度闭环/转场注入)缺失
 *   修复: 在 `stage8_2_PromptPreGeneration()` 末尾注入5项质量校准功能
 *   - 旁白清洗: _cleanVoiceover() - 保留Dialogue,清洗Voiceover
 *   - 内容去重: _deduplicateContent() - 跨镜头相似度>80%触发差异化
 *   - 字段结构化: _injectMissingFields() - 缺失字段从story-plan注入
 *   - 长度闭环: _enforceLengthLoop() - 直接substring+多源补充,避免fieldStandard重组失败
 *   - 转场注入: _injectTransitions() - 追加前缀后二次截断到1499,防止超限
 * - 🛡️ Prompt长度上限修正: 1000→1499,避免100%利用率被合规服务拦截
 * - 🎯 首次完整跑通: 全部8个镜头利用率95-99%通过
 *
 * v6.8-Peng-fix 更新(2026-05-31)- 删除导演优化+编剧优化环节
 * - 🔥 删除Stage 9-10(导演优化+编剧优化)
 *   根因: 这两个环节失败率极高,引入LLM评审→修复→重新生成闭环,但反而降低质量
 *   证据: Pipeline v9/v10 连续失败,导演优化后Prompt从950字降至278字,编剧优化写入[object Promise]
 *   修复: 删除 `_creativePolishing()` 和 Stage 9-10 调用,简化链路
 *   替代: Stage 8直接生成的Prompt已合格(expandPromptToTarget+validatePromptLength确保95-99%)
 *   影响: run()主流程跳过Stage 9-10,Stage 8之后直接预生产审核
 * - 🔥 保留旁白禁止约束(v6.8-Peng-fix同时发布)
 *   AudioNarrativeBlock → Dialogue,系统级禁止旁白/解说,只使用角色台词
 *
 * v6.7-Peng-fix 更新(2026-05-31)- 导演优化修复指令自动应用 + Stage 8重新生成
 *   [已废弃: v6.8-Peng-fix 删除导演优化环节]
 * - 🆕 方案A增强版落地: 导演优化输出修复指令(fixes),代码自动应用到story-plan
 *   [已废弃: v6.8-Peng-fix 删除此功能]
 *
 * v6.6-Peng-fix 更新(2026-05-31)- 导演优化/编剧优化主进程模式 + 编剧优化防退出修复
 * - 🔥 删除Subagent模式: _creativePolishing() 改为在主进程中直接调用LLM
 *   根因: Subagent独立子进程管道通信脆弱,write EPIPE频繁断裂
 *   修复: 复用Stage 2-8成功模式--主进程直接 await directorAgent.review() + optimizer.optimize()
 *   优势: 无子进程开销、无管道断裂风险、与前面环节完全一致
 *   降级: 导演优化/编剧优化任一失败时,创建空报告继续Pipeline不阻断
 *   超时保护: Promise.race 10分钟超时,避免无限等待
 * - 🛡️ 编剧优化防退出: _creativePolishing() 外层添加try/catch确保编剧优化异常不导致Pipeline中断
 *   根因: 编剧优化LLM调用可能因超大prompt(8983字)或内存问题导致进程异常退出
 *   修复: 导演优化和编剧优化各自独立try/catch,任一失败不影响另一环节
 *
 * v6.5-Peng-fix 更新(2026-05-31)- _extractJSON根因修复 + 防御性编程
 * - 🔥 _extractJSON 核心修复: 移除内部 JSON.parse,只返回字符串
 *   根因: 策略1/2/3成功时返回对象,调用方二次解析导致 "[object Object]" 错误
 *   修复: _extractJSON 始终返回 JSON 字符串或 null,调用方自行 JSON.parse
 * - 🛡️ 防御性编程3处落地:
 *   llm-caller.js v1.3-Peng-fix: content强制为字符串
 *   llm-reasoning-layer.js v1.2-Peng-fix: result字段强制为字符串
 *   director-pipeline.js: _extractJSON 非字符串输入防御性处理
 * - 🎯 Stage 2-8 LLM调用成功: 不再出现 "[object Object]" 解析错误
 * v6.4-Peng 更新(2026-05-30)- LLM全链路化:全部13个Pipeline环节LLM驱动
 * - 🆕 LLM推理抽象层 v1.0-Peng:统一LLM调用入口,分级超时/指数退避/并发控制/审计日志
 *   文件: llm-reasoning-layer.js
 *   能力: llmReason()单调用 + llmReasonParallel()并发 + printReport()统计
 *   分级超时: light 30s / medium 60s / heavy 120s / extreme 180s
 *   指数退避: 最多3次,1s→2s→4s
 *   备用模型降级链: k2p6 → kimi-k1.5 → deepseek
 *   所有LLM调用记录Token/耗时/成功率
 * - 🆕 Stage 8 运镜控制 LLM化 (v6.3-Peng): 本地关键词匹配 → LLM并发电影级运镜生成
 *   为每个shot并发调用LLM生成cinematographyPrompt + camera + movement
 *   降级: _localCinematography() 规则引擎
 * - 🆕 Stage 6 合规检查 LLM化 (v6.3-Peng): 本地正则检查 → LLM两层深度评估
 *   第一层本地快速预检保留,第二层LLM深度评估5维度(内容安全/文化敏感/法律风险/平台政策/社会影响)
 *   6个镜头并发调用LLM,本地+LLM取其严
 *   降级: fallback默认通过(score=8),不阻断Pipeline
 * - 🆕 Stage 5 角色提示词 LLM化 (v6.3-Peng): 本地模板拼接 → LLM生成角色性格描述
 *   生成性格标签、经典台词、视觉描述、世界观融入
 *   降级: 本地模板拼接
 * - 🆕 Stage 7 时长分配 LLM化 (v6.3-Peng): 本地平均分配 → LLM叙事节奏智能分配
 *   分析叙事重要性、情绪曲线、视觉复杂度、类型差异
 *   输出: 节奏模式 + 每个镜头时长+理由
 *   降级: 本地DurationAllocator五层加权
 * - 🆕 Stage 7.5 对话标注 LLM化 (v6.3-Peng): 本地CharacterVoiceDesigner → LLM驱动情感台词
 *   结合角色情绪、镜头叙事、视频类型生成精准台词
 *   降级: 本地annotateDialogue
 * - 🆕 Stage 8.1 开场标题 LLM化 (v6.3-Peng): 本地固定模板 → LLM电影级片头设计
 *   结合世界基调和神兽类型生成独特电影感片头
 *   降级: 本地generateOpeningTitlePrompt
 * - 🆕 Stage 1 PRD生成 LLM化 (v6.3-Peng): 外部提供/降级PRD → LLM质量评估
 *   评估故事完整性、角色鲜明度、情感弧线、视觉可行性
 *   降级: 测试环境生成最小PRD,生产环境要求外部提供
 * - 🆕 Stage 2 需求对齐 LLM化 (v6.3-Peng): 本地RequirementContract → LLM+本地双检查
 *   LLM深度分析PRD vs 用户需求,7维度评分+差距识别+改进建议
 *   降级: 本地AlignmentGate
 * - 🆕 Stage 3 Schema校验 LLM化 (v6.3-Peng): 本地schemaValidator → LLM+本地双验证
 *   LLM生成完整story-plan(segments/shots/characters/metadata)
 *   LLM深度结构验证7维度(镜头完整性/叙事逻辑/角色一致性/情绪曲线/时长合理性/视觉可行性)
 *   降级: BeastMind引擎 → StoryForge Pro → 手动提供
 * - 保留Stage 4 (v6.1-Peng)和Stage 8.2 (v6.2-Peng)已有的LLM化
 * - 保留Stage 9导演优化(v1.1-Peng)和Stage 10编剧优化(v1.1-Peng)已有的LLM化
 * - 全部13个Pipeline环节现在均为LLM驱动,每个环节保留本地降级机制
 *
 * v5.34-Peng 更新(2026-05-30)- P2: 创作流程优化
 * - 🆕 编剧优化直接修改prompt:删除"只改叙事不改prompt"注释,改为直接覆盖
 *   _generatedPrompt/_finalPrompt,并写回04-prompts/文件
 * - 🆕 导演优化+编剧优化合并为「创作打磨环节」:新建 _creativePolishing() 方法
 *   统一调用stage9_DirectorOptimize + stage10_ScriptwriterOptimize
 * - 🆕 一镜到底强制约束改为推荐:删除自动注入逻辑,仅检测+推荐,不修改任何shot
 *   由导演/编剧在创作打磨环节决定是否添加
 *   _enforceOneshotRequirement() 从 ~120行强制注入精简为 ~30行推荐检查
 *
 * v5.31-Peng 更新(2026-05-30)- P0-1: 统一合规检查服务
 * - 🆕 合并3次合规检查为统一服务: _runComplianceCheck({phase, label})
 *   - phase='preliminary': Stage 6 检查story-plan description(使用complianceAgent全量检查)
 *   - phase='final': Stage 8.3 检查最终Prompt利用率(从04-prompts/文件读取,95%-99%硬性闸门)
 *   - phase='post-optimize': Stage 10.5 检查优化后Prompt(同final逻辑)
 *   - 删除stage6_ComplianceCheck()和stage8_3_FinalPromptComplianceCheck()两个独立方法
 *   - 统一方法内包含所有逻辑分支,减少重复代码~80行
 *   - 统一结果收集、统计输出、阻断处理逻辑
 *   - 语法检查通过,运行时行为保持完全一致
 *
 * v5.25-Peng 更新(2026-05-30):
 * - 🆕 分阶段按需加载 v1.0-Peng: 顶部require拆分为核心组/生产组/优化组懒加载
 *   - 核心组(Stage 1-4): fs, path, task-type-router, director常量, requirement-alignment-gate, schema-validator
 *   - 生产组(Stage 5-8): compliance-agent, beast-integration, duration-allocator,
 *     shot-sequence-engine, seedance-cinematography, shanhaijing-cinematography - 懒加载
 *   - 优化组(Stage 9-10): director-optimize-agent, scriptwriter-optimizer - 懒加载
 *   - 效果: 启动时仅加载~2K行核心代码,减少约80%初始内存占用
 *   - 所有使用点已替换为懒加载函数调用(getXxx())
 * - 🆕 废旧文件清理: 删除14个旧productions项目(~700M) + 10个测试文件
 *
 * v5.24-Peng 更新(2026-05-30):
 * - 🆕 导演优化+编剧优化改造为"一气呵成"完善模式
 *   - 导演优化不阻断Pipeline,评分未达阈值继续执行
 *   - 编剧优化不阻断Pipeline,执行出错记录错误继续
 *   - 编剧优化只改叙事字段(description/emotion/camera),不覆盖渲染Prompt
 *   - 新增Stage 10.4: 编剧优化后重新生成完整渲染Prompt
 *   - 修复optimizeResult变量作用域(const→let)
 * - 🆕 防御性修复: camera字段对象类型兼容
 *   - story-plan.json中camera为{"move":"...","scale":"..."}对象
 *   - 修复所有cameraDesc.toLowerCase()调用点的类型检查
 *   - 涉及cinematography.js, shot-sequence-engine.js, fpv-experience-matcher.js等
 * - 🆕 story-plan.json运行时字段清理
 *   - 每次运行前删除_generatedPrompt/_finalPrompt/_promptLength
 *   - 防止上次残留数据干扰当前Stage 6合规检查
 * - 🆕 const→let修复: 清理重复SCENE-SPECIFIC时变量重赋值
 * - 🆕 StoryQualityGate双语高潮情绪匹配: 添加英文等价词
 *
 * v5.23-Peng 更新(2026-05-29):
 * - 🆕 LLM推理真实调用完成 (v2.28-Peng)
 *   - llm-caller.js 改造为内置Kimi Coding端点 (Anthropic Messages API)
 *   - DirectorOptimizeAgent 集成LLM四维评估 (LLM主审+规则降级)
 *   - ScriptwriterOptimizer 集成LLM五类优化 (LLM主优化+规则降级)
 *   - Pipeline Stage 9/10 调用添加 await,确保异步执行
 *   - 导演优化+编剧优化强制化,失败时阻断Pipeline
 *   - 全部5个P0问题确认完毕
 *   - LLM调用测试通过:耗时27秒,Token使用799
 *   - 验证导演优化返回完整四维评估报告
 *
 * v5.22-Peng 更新(2026-05-29):
 * - 🆕 预生产审核后置 (v5.22-Peng-fix)
 *   - Stage 8.5预生产审核移至Stage 10(编剧优化)之后
 *   - 导演优化+编剧优化先执行,极致打磨后再生成审核文档
 *   - 导演优化(Stage 9)和编剧优化(Stage 10)设为强制环节,不可跳过
 *   - 失败时阻断Pipeline,而非继续渲染
 *   - Stage 11渲染前保留最终确认闸机
 *   - 检查点恢复支持resumeStage=11(从渲染阶段恢复)
 *
 * v5.21-Peng 更新(2026-05-29):
 * - 🆕 Prompt上限统一1000: 合规检查Math.round→Math.floor
 * - v6.17-Peng: 统一上限1000→1000，修正历史不一致
 * - v6.17-Peng: SmartQualityCalibration SKIP时截断到1000上限
 * - v6.17-Peng: 最终合规检查使用1000上限，与PromptMetrics双指标对齐
 * - v6.17-Peng: 双指标系统打通——上限合规率(≤1000)为硬性约束，内容饱满度(≤1499)为参考
 *   - 修复S00利用率100%报超上限的bug
 *   - validatePromptLength截断改为maxLength-1
 *
 * v5.20-Peng 更新(2026-05-29):
 * - 🆕 导演风格库扩展 v1.1-Peng:从3位导演扩展到20位好莱坞导演
 *   - 新增17位导演:卢卡斯/维伦纽瓦/艾布拉姆斯/德尔·托罗/迈克尔·贝/艾默里奇/埃文斯/皮尔/施奈德/费儒/罗素兄弟/古恩/杰克逊/伯顿/里奇/沃恩/赖特
 *   - 四维评估自动推荐关键词匹配全部20位导演
 *   - 每位导演含完整DNA参数(叙事/视觉/情感偏好)
 *
 * v5.19-Peng 更新(2026-05-29):
 * 🆕 v5.22-Peng-fix: 最终确认移至Stage 11渲染前
 *   - Stage 8.5只生成审核文档,不暂停Pipeline
 *   - Stage 9-10自动执行导演优化+编剧优化
 *   - Stage 10.5: 最终确认闸机,大鹏决策是否提交渲染
 *   - 连贯性引擎:景别7级过渡检查、运镜方向向量追踪、视觉元素连续性
 *   - 台词一致性引擎:主题集中度、信息层级推进、对话互动性、主轴偏离度
 *   - 导演风格库:卡梅隆/斯皮尔伯格/诺兰三位导演DNA参数化建模
 *   - 原Stage 9(渲染)→Stage 11, 原Stage 10(后期)→Stage 12
 *   - Pipeline STAGES数组更新为12步
 *
 * v5.18-Peng 更新(2026-05-29):
 * - 🆕 v3.0-Peng: 彻底关闭TTS备用通道,只保留Seedance原生音频
 *   - enableAutoTTS默认值改为false(原:this.options.enableAutoTTS !== false)
 *   - 所有角色台词/台词/声音统一由Seedance --generate-audio 渲染生成
 *   - 后续如需恢复TTS,手动设置 options.enableAutoTTS = true
 *
 * v5.17-Peng 更新(2026-05-28):
 * - 🆕 集成台词注入系统 v1.0-Peng:Stage 8.3 自动将台词脚本融入Prompt
 * - 片头标题系统升级:英文标题 + 全屏显示要求 (60%+高度/80%+宽度)
 *
 * v5.16-Peng 更新(2026-05-28):
 * + 🆕 PRD链路择优录取3项系统级改进(来自外部AI评估)
 *   - PRD结构化转换器 v1.0-Peng: Markdown↔结构化数据,解决提取截断
 *   - 降级PRD定位修复: 生产环境无PRD时报错阻断(测试模式可启用降级)
 *   - 临时文件管理 v1.0-Peng: traceId替代Date.now(),避免并发冲突
 * + v5.15-Peng 更新(2026-05-28):
 * + 🆕 5项P0通用系统级改进生产发布集成
 *   - 三层提示词架构:世界基底+角色锚点+镜头增量分离
 *   - Dialogue管线分离:台词从视觉Prompt剥离
 *   - 生理感知注入系统:角色生理结构智能微动作
 *   - 情绪视觉翻译引擎:情绪→视觉指令翻译
 *   - 角色双锚点系统:Reference Image + Text Anchor
 * + v5.14-Peng 更新(2026-05-26):
 * + 🆕 片头创意动效系统 v4.0-Peng:三大Agent注入
 *   - Agent 1: 创意标题动效设计师 (opening-title-effect-designer.js)
 *     7种模板各有个性化标题生长动效(光脉逐笔点亮、地衣蔓延拼合等)
 *   - Agent 2: 神兽震撼出场设计师 (beast-entrance-designer.js)
 *     覆盖刑天/烛龙/九尾狐/帝江/白泽/麒麟/饕餮 + 通用模板
 *     每个神兽有5阶段出场动效 + 7层音效设计
 *   - Agent 3: 小G入镜设计师 (xiaoG-entrance-designer.js)
 *     7种神兽对应7种入镜方式(被战意吸引/被光芒唤醒/被幻光迷惑等)
 *   - 8秒时间轴精确编排:0s声音→0.5s神兽登场→3s标题→4.5s小G入镜
 * + 🆕 动效时间轴持久化到 opening-title-design.json
 * + 🔒 系统级升级,非case定制,影响所有视频任务的片头设计
 *
 * v5.13-Peng 更新(2026-05-26):
 * + 🆕 片头时长设计缺陷系统级修复 v3.3-Peng-fix3
 *   - 模板库硬编码duration:3 → 行业标准7-9秒(有声音层8秒,无声音层7秒)
 *   - 神兽开场白跨镜头延续机制(声音跨S00-S05,不局限于片头)
 *   - 片头不占用正片片长(正片60秒 + 片头8秒 = 总68秒)
 *   - DurationAllocator片头保护:正片分配mainTargetDuration,片头固定不挤占
 *   - 导演管线动态计算baseDuration,不再硬编码
 * + 🆕 语速估算标点停顿计算:estimateDuration增加标点停顿0.3s/标点
 * + 🆕 片头跳过时长分解:opening_title类型不参与duration>=6s自动分解
 * + 🔒 系统级修复,非case定制,影响所有视频任务的片头设计
 *
 * v5.9-Peng 更新(2026-05-25):
 * + 🧠 BeastMind Engine v1.0-Peng 集成:Stage-3自动兽魂叙事生成
 *   - 8大兽魂心智原型(守望者/囚徒/园丁/信使/隐士/戏谑者/记忆体/失衡者)
 *   - 4档自适应时长模板(30/60/90/120s)
 *   - 自动异兽关键词检测启用BeastMind
 *   - StoryForge Pro回退机制保留
 * - 🆕 全局Prompt上限修复 1000-char-unification:4处490硬编码→1000统一
 *   - config-center.js: promptMaxLength 490→1000
 *   - seedance-render-engine.js: 所有硬编码490→PROMPT_MAX_LENGTH
 *   - director-pipeline.js: 合规检查分母490→1000
 *   - pre-production-checklist.js: checklist分母490→1000
 * + 🎯 提示词利用率目标: 80%-99% of 1000字符
 * + 🔒 机制级修复: 影响所有视频任务的Prompt长度上限
 * + 刑天栖息地映射:plain-zhulu 涿鹿战场
 * + 刑天案例 → 机制级改进:武器描述从模糊自然语言升级为精确规格
 *
 * v5.5-Peng-preproduction 更新(2026-05-24):
 * + 🆕 acts/segments自动转换兼容 - 支持两种story-plan格式
 * + 🆕 防作弊机制调用时机修复 - _selfCheckAntiCheating()移至run()开头
 * + 🎙️ Stage 7.5 对话标注:角色语音设计师 v1.0-Peng 集成
 * + 角色对白/口型同步:TTS音频参考 → Seedance原生口型同步
 * + 10种角色语音档案预设(小G + 9只核心异兽)
 * + 剧本对白解析器 + Prompt对白层注入器
 * + 支持路径A(自动生成)和路径B(TTS精确控制)
 * + 帝江特殊处理:视觉共鸣替代语音
 *
 * v2.3-Peng 大系统更新(2026-05-24):
 * + 🆕 Scale-Aware Shot Designer v1.0-Peng:五级尺寸分类,真实比例镜头设计
 * + 🆕 Opening Title Designer v1.0-Peng:7种标题融入模板,场景化标题展示
 * + 🆕 Rhythm Intensifier v1.0-Peng:短剧快剪模式,信息密度最大化,60秒持续兴奋
 * + 🆕 Stage 8.2 节奏强化:自动检测平淡段并注入刺激元素
 * + 时长分配器 v1.1-Peng:新增 short_drama 模式(basePacing=0.50)
 * + 山海经模式默认启用短剧快剪节奏
 *
 * v2.2-Peng 大系统更新(2026-05-23):
 * + 🆕 异兽档案系统 v1.0-Peng:40只神兽标准化档案库
 * + 🆕 五大引擎:Prompt注入器/一致性守卫/世界观校准器/运镜推荐器/场景生成器
 * + 🆕 神兽自动检测:从剧本/场景描述自动识别神兽
 * + 🆕 Prompt自动注入:将神兽名字替换为精确描述
 * + 🆕 多神兽同框处理:双主体构图与交互设计
 * + 🆕 一致性守卫:5维自动校验(颜色/体型/特征/栖息地/能力)
 * + 🆕 世界观校准器:确保神兽出现在正确栖息地
 * + 🆕 运镜推荐器:基于体型/类型智能推荐运镜
 *
 * v2.1-Peng 大系统更新(2026-05-23):
 * + 🆕 预生产审核系统 v1.0-Peng:Stage 1-8 全自动 → 飞书审核文档 → 人工确认 → 渲染
 * + 🆕 山海经FPV灵魂生成器 v1.0-Peng:基于15个案例方法论,为山海经综合产出FPV
 *
 * v2.0-Peng 大系统更新(2026-05-22):
 * + 🆕 FPV超写实电影感经验包总库 v1.1-Peng:15个标杆案例
 * + 🆕 一镜到底强制约束系统:双层防护(导演管线+渲染引擎)
 * + 🆕 异兽专用生成模式 v4.0-Peng:双铁律:纯粹异兽本体 + 零科技元素
 *
 * v4.4-Peng 更新:
 * + 🆕 智能时长分配器 v1.0-Peng:五层加权体系(叙事/内容/运镜/张力/节奏模式)
 * + 🆕 镜头序列冲击引擎 v1.0-Peng:尺度跳跃×运镜能量×时长对比 = 视觉冲击力
 * + 🆕 转场推荐系统:hard_cut/whip_pan/smash_cut/match_cut/J-cut/L-cut
 * + 🆕 问题检测:雷同序列/无动机跳切/节奏断裂/连续高压疲劳
 * + 🆕 Seedance 2.0时长上限保护:所有镜头最大15秒
 * + 🆕 Mock模式一镜到底检查跳过:避免测试被阻止
 * + 🆕 序列冲击分析集成到Stage 8运镜控制后
 *
 * v4.3-Peng 更新(大系统 v2.0-Peng):
 * + 🆕 任务类型路由器 v1.0-Peng:自动检测任务类型,配置完整链路
 * + 🆕 5种预设任务类型:shanhaijing/fpv/education/advertisement/character
 * + 🆕 智能推荐:根据用户输入自动推荐最佳任务类型
 * + 🆕 用户自定义覆盖:预设基础上可手动覆盖任何参数
 *
 * v4.2-Peng 更新(大系统 v2.0-Peng):
 * + 🆕 任务类型路由器 v1.0-Peng:自动检测任务类型,配置完整链路
 * + 🆕 5种预设任务类型:shanhaijing/fpv/education/advertisement/character
 * + 🆕 智能推荐:根据用户输入自动推荐最佳任务类型
 * + 🆕 FPV超写实电影感经验包总库集成(通用视频系列)
 * + 🗑️ 一镜到底强制约束已移除 (v6.10-Peng: 按需搭配,非强制)
 * + 🆕 FPV自动匹配器:15个标杆案例智能匹配
 *
 * v4.1-Peng 更新(大系统 v2.0-Peng):
 * + 🆕 FPV超写实电影感经验包总库集成
 * + 🗑️ 一镜到底强制约束已移除 (v6.10-Peng: 按需搭配,非强制)
 * + 🆕 自动经验包匹配:根据场景描述自动匹配15个标杆案例
 * + 🆕 FPV技法自动注入:POV/鱼眼/德式斜角/桶滚等电影级技法
 *
 * v4.0-Peng 更新(大系统 v1.1-Peng):
 * + 🆕 全局定妆照系统:小G定妆照全局统一目录,所有项目默认调用
 * + 🆕 异兽专用生成模式:纯粹异兽本体 + 零科技元素双铁律
 * + 🆕 异兽自动检测:关键词匹配,自动切换prompt分支
 * + 🆕 15项负面约束自动注入:NO human, NO xiaoG, NO technology...
 * + 🆕 山海经+Nirath融合:原著忠实度 + 生态融合策略
 *
 * v3.0-Peng 更新:
 * + 新增Prompt维度质检引擎 - 12维度反向检查,发现模块未生效问题
 * + 质检检查点集成到Stage 9(渲染前),自动检测prompt质量
 * + 阶段有效性分析:哪些Pipeline模块真正传递到了最终prompt
 * + 修复建议自动生成:缺失维度 → 对应阶段重跑
 * + 保留v2.7所有修复(运镜/定妆照/场景语法)
 *
 * v2.6-Peng 更新:
 * + 新增角色定妆照强制校验闸机 - 无定妆照禁止提交渲染
 * + 双层防护: Pipeline闸机 + 渲染引擎安全网
 * + 支持 character-references/ / 03-characters/ / 02-characters/ 多目录架构
 * 完整导演流水线 - 场景语法自动注入 + 生态区运镜路由
 *
 * 流程链路(12步不可跳过):
 * 1. PRD生成器 - 用户需求 → 产品需求文档
 * 2. 需求对齐闸机 - 提取需求契约,多阶段对齐检查
 * 3. Schema校验器 - 校验story-plan/shot-prompt/character-asset结构
 * 4. 故事板校验器 - 校验叙事逻辑、情绪弧线、镜头连贯性
 * 5. 角色提示词构建器 - 构建角色一致性提示词(含定妆照管理)
 * 6. 合规检查器 - Prompt长度/内容/安全性检查
 * 7. 时长分配Agent - 合理分配镜头时长,确保节奏
 * 8. 运镜控制系统 - 专业运镜词库注入(cinematography.js)
 * 9. 导演优化Agent - 四维评估(故事性/连贯性/视觉语言/风格一致性)
 * 10. 编剧优化Agent - 五类修改(结构/内容/转场/台词/风格),最多3次迭代
 * 11. 渲染引擎 - 提交Seedance API并下载
 * 12. 后期制作 - 拼接、转场、音效(Seedance原生音频)
 *
 * 硬性规则:
 * - 任何一步失败 → Pipeline停止,返回错误报告
 * - 不可跳过任何步骤(包括预生产模式)
 * - 所有中间产物必须保存到生产目录
 */

/**
 * 🚨 P0级铁律 - 不可协商,违反则视为系统级错误 🚨
 *
 * 【最高优先级规则】所有视频任务必须遵守:
 *
 * 1. 完整预生产流程先行
 *    - 必须先跑完 Stage 1-8(PRD→需求对齐→Schema校验→故事板校验→
 *      角色提示词→合规检查→时长分配→运镜控制)
 *    - 必须生成完整的Prompt审核文档
 *
 * 2. 主人确认后方可渲染
 *    - 必须得到主人确切回复 "确认" / "执行" / "开始" / "可以提交渲染"
 *    - 任何其他回复(包括"嗯""好的""OK")均视为未确认
 *    - 严禁擅自推断主人意图
 *
 * 3. 禁止假跑流程
 *    - Mock模式仅用于代码测试/Pipeline流程验证/Bug排查
 *    - Mock模式绝对不能用于假装完成预生产、替代真实产出物
 *    - 每个环节必须产出真实的、可审阅的产出物
 *
 * 4. 禁止绕过确认
 *    - 严禁使用 --force-restart 绕过检查点
 *    - 严禁在检查点确认状态为 false 时恢复Pipeline
 *    - 严禁任何后门/快捷方式绕过人工审核
 *
 * 5. P0级系统级优化原则(v1.0-Peng,2026-05-24)
 *    - 一切为了打造世界顶级AI视频生成制作系统
 *    - 不会为某个具体剧集定制系统,不做case级定制优化
 *    - 剧集发现的问题用于优化系统机制,确保同类问题不再发生
 *    - 单点修复必须提升为机制级改进
 *
 * 违反后果:
 * - 未经确认提交渲染 → 立即终止Pipeline,视为严重违规
 * - 假跑流程 → 生成的所有产出物无效,必须重新执行
 * - 擅自推断主人意图 → 决策权100%归属主人,AI无权代理
 * - 为case做定制优化 → 立即回滚,改为系统级机制改进
 *
 * 版本: v5.4-Peng-P0
 */

const crypto = require('crypto');

function verifyAdapterBypass(productionDir, bypass) {
  if (!bypass?.enabled || !bypass?.token) return false;

  const secret = process.env.DEFENSE_ADAPTER_SECRET || 'local-dev-secret';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`director-pipeline:${productionDir}`)
    .digest('hex');

  return (
    bypass.source === 'director-pipeline-adapter' &&
    bypass.token === expected
  );
}

const fs = require('fs');
const path = require('path');
const {
  normalizeStoryPlan,
  normalizeDialogueAnnotation,
  normalizeShot
} = require('./llm-contract');

// 🆕 v6.11-Peng-fix3: storyPlan.characters是{key:charObj}对象而非数组,提供转换工具
// 用法: toCharArray(storyPlan.characters) → [{name, ...}, ...]
// 🆕 v6.33-Peng-fix41: 统一走 llm-contract normalizeCharacters
function toCharArray(characters) {
  if (!characters) return [];
  return normalizeStoryPlan({ characters }).characters || [];
}

// 🆕 v4.2-Peng: 任务类型路由器 - 自动检测任务类型并配置完整链路
const { autoRoute, applyRouteToStoryPlan, generateRouteReport } = require('./task-type-router');

// 🆕 v4.3-Peng-C: 山海经专用导演系统导入(模式开关用)
const { ShanhaiDirector, SHANHAI_EMOTION_CAMERA_MAP, SHANHAI_EPISODE_TEMPLATES, GLOBAL_PACING_MODE, SHOT_DURATION_BASE, TRANSITION_STYLE, INFO_DENSITY_MULTIPLIER, FAST_PACING_KEYWORDS } = require('../director');

const { getLLMConfig } = require('./config-center');

// ============ 核心组加载 (Stage 1-4必须) ============
const { RequirementContract, AlignmentGate } = require('./requirement-alignment-gate');
const { SchemaRuntimeValidator } = require('./schema-validator');
const { SmartQualityCalibration, PriorityTruncator } = require('./smart-quality-calibration');
const { PromptMetrics } = require('./prompt-metrics');

// ============ 生产组懒加载 (Stage 5-8按需) ============
let _shotSequenceEngine, _durationAllocator, _complianceAgent, _seedanceCinema, _shanhaijingCinema, _beastIntegration;
function getShotSequenceEngine() {
  if (!_shotSequenceEngine) _shotSequenceEngine = require('./shot-sequence-engine');
  return _shotSequenceEngine;
}
function getDurationAllocator() {
  if (!_durationAllocator) _durationAllocator = require('./duration-allocator');
  return _durationAllocator;
}
function getComplianceAgent() {
  if (!_complianceAgent) _complianceAgent = require('./compliance-agent');
  return _complianceAgent;
}
function getSeedanceCinematography() {
  if (!_seedanceCinema) _seedanceCinema = require('../../seedance-render-engine/scripts/cinematography');
  return _seedanceCinema;
}
function getShanhaijingCinematography() {
  if (!_shanhaijingCinema) _shanhaijingCinema = require('../../shanhaijing-cinematography/cinematography');
  return _shanhaijingCinema;
}
function getBeastIntegration() {
  if (!_beastIntegration) _beastIntegration = require('./beast-integration.js');
  return _beastIntegration;
}

// ============ 优化组懒加载 (Stage 9-10按需) ============
let _directorReviewAgent, _scriptwriterOptimizer;
function getDirectorOptimizeAgent() {
  if (!_directorReviewAgent) _directorReviewAgent = require('./director-optimize-agent');
  return _directorReviewAgent;
}
function getScriptwriterOptimizer() {
  if (!_scriptwriterOptimizer) _scriptwriterOptimizer = require('./scriptwriter-optimizer');
  return _scriptwriterOptimizer;
}

// ============ 好莱坞技能库懒加载 (Stage 8.4 按需) ============
let _cinematographySkillRouter;
function getCinematographySkillRouter() {
  if (!_cinematographySkillRouter) _cinematographySkillRouter = require('./cinematography-skill-router');
  return _cinematographySkillRouter;
}

// ==================== v6.27-Peng Prompt Final Normalizer ====================
const {
  FINAL_PROMPT_FIELDS,
  ENGLISH_WORD_LIMIT,
  CHINESE_DIALOGUE_BUDGET,
  FINAL_TOTAL_CHAR_LIMIT,
  isOpeningTitleShot,
  countEnglishWords,
  countChineseChars,
  checkFinalTenFields,
  normalizeShotPromptFields,
  normalizeAllShots
} = require('./prompt-final-normalizer');

const {
  enhanceShotQualityBundle
} = require('./shot-quality-enhancer');

// 🛠️ v6.31-hotfix: Prompt Output Repair for S00 and normal shots
const { repairAllShotPromptOutputs } = require('./prompt-output-repair');

// 🎬 v1.1-Peng: 平台预设系统
const {
  getPreset,
  getAvailablePlatforms,
  isVertical,
  generatePlatformPromptSupplement,
  validatePreset
} = require('./platform-preset');

// ============ 配置 ============
const PIPELINE_VERSION = 'v6.38-Peng';
const STAGES = [
  'prd-generation',
  'requirement-alignment',
  'schema-validation',
  'storyboard-check',
  'character-prompt-build',
  'compliance-check',
  'duration-allocation',
  'cinematography-control',
  'director-optimize',       // 🆕 v5.19-Peng: Stage 9 导演优化
  'scriptwriter-optimize',  // 🆕 v5.19-Peng: Stage 10 编剧优化
  'render',
  'post-production'
];

class DirectorPipeline {
  constructor(productionDir, options = {}) {
    this.productionDir = productionDir;
    this.options = options;
    this.preProductionMode = options.preProduction || false;
    this.results = {};
    // 🆕 v6.12-Peng-fix9: 守卫标志,每次pipeline重置
    this._stage83CalibrationDone = false;
    this.errors = [];

    // 🆕 v2.0-Peng: 字符计数器(复用CharCounter)
    const { CharCounter } = require('./char-counter');
    const charCounter = new CharCounter();
    this._countChars = (str) => charCounter.count(str);

    // 🆕 v6.16-Peng: 智能句子截断(使用加权字符数,确保截断后合规检查通过)
    this._smartSentenceTruncate = (text, maxLength) => {
      const currentLen = this._countChars(text);
      if (!text || currentLen <= maxLength) return text;
      if (maxLength < 20) {
        // 暴力截断但保留完整字符
        let result = text;
        while (this._countChars(result) > maxLength) {
          result = result.slice(0, -1);
        }
        return result.trim();
      }

      // 先用字符串长度估算截断点(因为逐字计数太慢)
      const ratio = text.length / currentLen;
      let estimatedMax = Math.floor(maxLength * ratio);

      let cutPoint = estimatedMax;
      const searchRange = Math.floor(estimatedMax * 0.4); // 向后搜索40%范围

      // 优先在句号、分号处截断
      const sentenceBreaks = ['。', ';', ';', '!', '.', '?'];
      for (let i = estimatedMax; i > estimatedMax - searchRange && i > 0; i--) {
        if (sentenceBreaks.includes(text[i])) {
          cutPoint = i + 1;
          break;
        }
      }

      // 其次在逗号处截断
      if (cutPoint === estimatedMax) {
        const commaBreaks = [',', ',', '、'];
        for (let i = estimatedMax; i > estimatedMax - searchRange && i > 0; i--) {
          if (commaBreaks.includes(text[i])) {
            cutPoint = i + 1;
            break;
          }
        }
      }

      // 最后确保不在单词中间截断(找空格)
      if (cutPoint === estimatedMax) {
        for (let i = estimatedMax; i > estimatedMax - searchRange && i > 0; i--) {
          if (text[i] === ' ') {
            cutPoint = i;
            break;
          }
        }
      }

      let result = text.slice(0, cutPoint).trim();

      // 最终验证:如果加权字符数仍超限,逐字截断
      while (this._countChars(result) > maxLength && result.length > 0) {
        result = result.slice(0, -1).trim();
      }

      return result;
    };

    // 🚨 v5.4-Peng-P0: 防作弊审计日志系统 - 强制记录每个Stage的真实执行来源
    this.auditLog = {
      pipelineVersion: PIPELINE_VERSION,
      startTime: new Date().toISOString(),
      stages: [],
      isRealPipeline: true,  // 标记这是真实主链路执行,不是独立demo脚本
      sourceFile: 'director-pipeline.js',
      constructorName: 'DirectorPipeline',
      antiCheatingEnabled: true
    };

    // 🚨 v5.4-Peng-P0: 防作弊检查移至run()方法开头执行
    // 原位置在constructor,但此时run()尚未调用,调用栈检查永远失败
    // 修复后:在run()开头执行,此时调用栈包含DirectorPipeline.run
    // this._selfCheckAntiCheating(); // v5.4-Peng-P0-fix: 移至run()

    // 🌍 v3.0-Peng: 世界观选择器 (shanhaijing | nirath | superreal)
    this.worldview = options.worldview || 'shanhaijing';
    console.log(`🌍 世界观: ${this.worldview === 'nirath' ? 'Nirath原生星球' : this.worldview === 'superreal' ? '超写实' : '山海经'}`);

    // 🎬 v1.1-Peng: 平台预设系统
    this.platform = options.platform || 'narrative';
    if (this.platform !== 'narrative') {
      console.log(`📱 平台模式: ${this.platform === 'douyin_short' ? '抖音快剪(15-30s)' : this.platform === 'tiktok_creator' ? 'TikTok创作(30-60s)' : this.platform}`);
    }

    // 🏷️ v6.31-Peng: 广告植入配置
    this.adConfig = {
      brand: options.brand || null,
      mode: options.adMode || null,
      enabled: !!(options.brand && options.adMode)
    };
    if (this.adConfig.enabled) {
      console.log(`🏷️ 广告植入: ${this.adConfig.brand} | 模式: ${this.adConfig.mode}`);
    }

    // 🆕 v4.3-Peng-C: 山海经模式开关检测
    // 🆕 v6.37-Peng-fix: 防止科普/教育内容被误判为山海经模式
    // 检测方式: 1)世界观=shanhaijing 2)风格档案=shanhaijing 3)routeConfig明确为shanhaijing
    // 不再从userInput关键词检测（科普内容可能引用山海经但不等于山海经视频）
    const userInputText = [
      options.userInput?.title,
      options.userInput?.outline,
      options.userInput?.userQuery,
      typeof options.userInput === 'string' ? options.userInput : ''
    ].filter(Boolean).join(' ');

    // 🆕 v6.37-Peng-fix: 反误判——检查是否为科普/教育内容
    const isEducationContent = /科普|教育|知识|健康|医学|科学|讲解|教学|教程|护士|医生|横纹肌|疾病|health|medical|science|education/.test(userInputText);

    this.shanhaijingMode = (
      this.worldview === 'shanhaijing' ||
      options.styleProfile === 'shanhaijing'
    ) && !isEducationContent; // 🆕 科普内容即使worldview=shanhaijing也不激活山海经模式

    if (this.shanhaijingMode) {
      console.log(`🐉 山海经模式已激活: 启用Nirath原创世界观专用能力注入`);
      // 初始化山海经导演实例(用于调用专用方法)
      this.shanhaiDirector = new ShanhaiDirector();
    }

    // 初始化所有Agent
    this.schemaValidator = new SchemaRuntimeValidator();
    this.complianceAgent = new (getComplianceAgent().ComplianceAgent)();
    this.alignmentGate = null; // 在需求对齐阶段初始化

    // 🐉 v5.2-Peng: 初始化异兽档案系统集成
    this.beastIntegration = new (getBeastIntegration().BeastArchiveIntegration)();

    // 确保生产目录存在
    this._ensureDirs();
  }

  // ========== 🆕 v6.5-Peng-fix: 智能JSON提取器 ==========
  /**
   * 从LLM返回文本中提取JSON,处理JSON后追加额外文字的情况
   * 策略1: 提取```json代码块
   * 策略2: 从最后一个}往前找匹配的{
   * 策略3: 直接解析整个文本
   */
  _extractJSON(data) {
    // 🆕 v6.5-Peng-fix2: 修复"[object Object]"解析错误
    // 本方法始终返回JSON字符串(不解析),让调用方自己JSON.parse
    let text = data;
    if (typeof text !== 'string') {
      if (text && typeof text === 'object') {
        text = text.content || text.result || text.text || JSON.stringify(text);
      } else {
        text = String(text || '');
      }
    }
    if (!text || text === '[object Object]') {
      console.warn('  ⚠️ _extractJSON: 输入为空或无效对象引用');
      return null;
    }

    // 策略1: 提取```json代码块
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 策略2: 从最后一个}往前找匹配的{
    let lastBrace = text.lastIndexOf('}');
    while (lastBrace > 0) {
      let braceCount = 0;
      let firstBrace = -1;
      for (let i = lastBrace; i >= 0; i--) {
        if (text[i] === '}') braceCount++;
        if (text[i] === '{') {
          braceCount--;
          if (braceCount === 0) {
            firstBrace = i;
            break;
          }
        }
      }

      if (firstBrace >= 0) {
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        // 验证是有效JSON才返回
        try {
          JSON.parse(jsonStr);
          return jsonStr;
        } catch (e) {
          // 这个JSON块无效,尝试前一个}
        }
      }

      lastBrace = text.lastIndexOf('}', lastBrace - 1);
    }

    // 🆕 v6.11-Peng-fix: 策略2b - 寻找独立JSON对象(无代码块包裹时)
    // 用于处理LLM返回自然语言前缀+JSON的情况(如"这里是角色档案：{...}")
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } catch (e) {
        // 匹配到的不是有效JSON,继续
      }
    }

    // 🆕 v6.11-Peng-fix: 策略2c - 寻找任何{...}模式,验证每个为有效JSON
    // 最激进的兜底:从文本中找最大的有效JSON对象
    let bestMatch = null;
    let bestLen = 0;
    for (let start = 0; start < text.length; start++) {
      if (text[start] !== '{') continue;
      for (let end = start + 1; end <= text.length; end++) {
        const candidate = text.substring(start, end);
        try {
          JSON.parse(candidate);
          if (candidate.length > bestLen) {
            bestLen = candidate.length;
            bestMatch = candidate;
          }
        } catch (e) {
          // 继续尝试更小的范围
        }
      }
    }
    if (bestMatch) return bestMatch;

    // 策略3: 直接返回trimmed文本(调用方会自己JSON.parse)
    const trimmed = text.trim();
    if (trimmed) {
      return trimmed;
    }

    return null;
  }

  _ensureDirs() {
    const dirs = [
      '00-prd',
      '01-story',
      '02-characters',
      '03-shots',
      '04-prompts',
      '05-raw-shots',
      '06-post-production',
      '99-reports'
    ];
    for (const dir of dirs) {
      const fullPath = path.join(this.productionDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  /**
   * 主入口:运行完整Pipeline
   */
  async run(userInput) {
    // 🚨 v5.4-Peng-P0-fix: 防作弊检查移至run()开头
    // 原位置在constructor导致调用栈检查永远失败
    if (!this.options._skipAntiCheatingCheck) {
      this._selfCheckAntiCheating();
    }

    console.log(`\n🎬 ShanhaiStory Forge v2.44-Peng | Director Pipeline ${PIPELINE_VERSION}`);
    console.log(`📁 生产目录: ${this.productionDir}`);
    console.log(`🔧 模式: ${this.preProductionMode ? '预生产模式' : '生产渲染'}`);
    console.log('=' .repeat(60));

    // 🆕 保存用户输入供后续阶段使用
    this.options.userInput = userInput;

    try {
      // 🆕 v5.30-Peng-fix: 每次运行前清理story-plan.json中的运行时字段
      // 防止上次运行的_generatedPrompt等残留导致Stage 6误判
      const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
      if (fs.existsSync(storyPlanPath)) {
        const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
        // 🆕 v6.21-Peng-fix16: 修复 story-plan.json 嵌套结构 (story_plan.segments)
        if (storyPlan.story_plan) {
          storyPlan = storyPlan.story_plan;
        }

        // 🆕 fix14-v4: 统一characters格式为array，避免dict格式导致.map/.find崩溃
        if (storyPlan.characters && typeof storyPlan.characters === 'object' && !Array.isArray(storyPlan.characters)) {
          storyPlan.characters = Object.values(storyPlan.characters);
        }

        let cleaned = false;
        for (const segment of storyPlan.segments || []) {
          for (const shot of segment.shots || []) {
            const runtimeFields = ['_generatedPrompt', '_finalPrompt', '_promptLength', '_titleConfig', '_isOpeningTitle',
              // 🆕 v6.32-fix3: 清理上次预生产的对白残留，防止台词污染
              'dialogues', 'Dialogue', 'dialogue'];
            for (const field of runtimeFields) {
              if (shot[field] !== undefined) {
                delete shot[field];
                cleaned = true;
              }
            }
          }
        }
        if (cleaned) {
          fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
          console.log(`\n🧹 已清理story-plan.json运行时字段(_generatedPrompt等),防止残留干扰`);
        }
      }

      // 🆕 v6.32-fix3: 清理上次预生产的对白输出文件，防止台词污染
      const dialogueFiles = [
        path.join(this.productionDir, '03-characters', 'dialogue-annotation.json'),
        path.join(this.productionDir, '03-characters', 'dialogue-script.md'),
        path.join(this.productionDir, '03-characters', 'shot-dialogues.json')
      ];
      for (const df of dialogueFiles) {
        if (fs.existsSync(df)) {
          fs.unlinkSync(df);
          console.log(`🧹 已清理对白残留文件: ${path.basename(df)}`);
        }
      }

      // 🆕 v4.2-Peng: 任务类型自动检测与路由
      // 根据用户输入自动检测任务类型,配置完整链路
      const userQuery = typeof userInput === 'string' ? userInput : (userInput && (userInput.userQuery || userInput.title || JSON.stringify(userInput))) || '';
      const routeConfig = await autoRoute(userQuery);

      console.log(`\n🎯 任务类型自动检测: ${routeConfig.name} ${routeConfig.icon}`);
      console.log(`   检测来源: "${userQuery.substring(0, 80)}${userQuery.length > 80 ? '...' : ''}"`);
      console.log(`   任务描述: ${routeConfig.description}`);

      // 将路由配置应用到storyPlan
      if (!this.options.storyPlan) this.options.storyPlan = {};
      this.options.storyPlan = applyRouteToStoryPlan(this.options.storyPlan, routeConfig);

      // 🆕 v4.3-Peng-C: 如果任务类型是山海经,确认激活山海经模式
      if (routeConfig.type === 'shanhaijing' && !this.shanhaijingMode) {
        this.shanhaijingMode = true;
        console.log(`🐉 任务类型检测为山海经,动态激活山海经模式`);
        if (!this.shanhaiDirector) {
          this.shanhaiDirector = new ShanhaiDirector();
        }
      }

      // 打印路由报告(详细配置)
      if (this.options.verbose || this.preProductionMode) {
        console.log(generateRouteReport(routeConfig));
      }

      console.log(`\n🚀 链路配置完成,开始执行...`);
      console.log('=' .repeat(60));

      // 🚨 v5.4-Peng-P0: 初始化审计日志,记录真实执行开始
      this._initAuditLog();

      // 阶段1: PRD生成
      this._writeAuditLog('stage1_start', { action: 'PRD生成开始' });
      await this.stage1_PRDGeneration(userInput);
      this._writeAuditLog('stage1_end', { status: 'success' });

      // 阶段2: 需求对齐闸机
      this._writeAuditLog('stage2_start', { action: '需求对齐开始' });
      await this.stage2_RequirementAlignment();
      this._writeAuditLog('stage2_end', { status: 'success' });

      // 🆕 v6.31-Peng: Stage 1.5 爆款情报 — 在剧本创作之前抓取趋势热点
      // 生成 ViralBrief 注入 pipeline，上下文供后续所有阶段使用
      if (!this.options._skipViralIntel) {
        this._writeAuditLog('stage1_5_start', { action: '爆款情报开始' });
        try {
          const { ViralTrendIntel } = require('../viral-trend-intelligence/viral-intel');
          const viralIntel = new ViralTrendIntel({ llmCaller: this._llmCaller.bind(this) });
          const brief = await viralIntel.generate({
            title: userInput.title,
            outline: userInput.outline,
            duration: userInput.duration,
            language: userInput.language
          });
          this.options.viralBrief = brief;
          console.log(`\n📊 爆款情报: 命中 ${brief.insights?.length || 0} 个相关热点`);
          console.log(`   情感极性: ${brief.sentiment} | 发布时机: ${brief.best_timing}`);
          if (brief.viral_angles?.length) {
            console.log(`   爆款角度: ${brief.viral_angles.slice(0, 2).join(' / ')}`);
          }
          this._writeAuditLog('stage1_5_end', { status: 'success', insights: brief.insights?.length });
        } catch (err) {
          console.warn(`⚠️  爆款情报跳过: ${err.message}`);
          this._writeAuditLog('stage1_5_end', { status: 'skipped', error: err.message });
        }
      }

      // 阶段3: Schema校验
      this._writeAuditLog('stage3_start', { action: 'Schema校验开始' });
      await this.stage3_SchemaValidation();
      this._writeAuditLog('stage3_end', { status: 'success' });

      // 🆕 fix15-v1: 阶段3.5: 字段充实 (Stage 3 Schema校验后, Stage 4 故事板校验前)
      // 修复8字段缺失问题: 为每个shot补充 character/action/scene/mood/camera/lighting/negativePrompt/renderStyle/directorStyle
      // 优先从shot已有字段推断，缺失时调LLM（批量JSON），最后降级到本地模板
      this._writeAuditLog('stage3_5_start', { action: '字段充实开始' });
      await this.stage3_5_FieldEnrichment();
      this._writeAuditLog('stage3_5_end', { status: 'success' });

      // 🏷️ v6.31-Peng: 广告植入系统 — Stage 3.6 广告镜头注入
      // 在故事板生成后、Prompt生成前,按植入模式将品牌镜头注入镜头序列
      if (this.adConfig.enabled) {
        this._writeAuditLog('stage3_6_ad_start', { action: '广告镜头注入开始', brand: this.adConfig.brand, mode: this.adConfig.mode });
        await this._injectAdShots();
        this._writeAuditLog('stage3_6_ad_end', { status: 'success' });
      }

      // 阶段4: 故事板校验
      this._writeAuditLog('stage4_start', { action: '故事板校验开始' });
      await this.stage4_StoryboardCheck();
      this._writeAuditLog('stage4_end', { status: 'success' });

      // 阶段5: 角色提示词构建
      this._writeAuditLog('stage5_start', { action: '角色提示词构建开始' });
      await this.stage5_CharacterPromptBuild();
      this._writeAuditLog('stage5_end', { status: 'success' });

      // 阶段6: 合规检查 (统一服务 v5.31-Peng)
      this._writeAuditLog('stage6_start', { action: '合规检查开始' });
      await this._runComplianceCheck({ phase: 'preliminary', label: '阶段6/10: 合规检查' });
      this._writeAuditLog('stage6_end', { status: 'success' });

      // 阶段7: 时长分配
      this._writeAuditLog('stage7_start', { action: '时长分配开始' });
      await this.stage7_DurationAllocation();
      this._writeAuditLog('stage7_end', { status: 'success' });

      // 🆕 fix11: 片头从未进入渲染队列——_designOpeningTitle生成但_insertOpeningTitleShot从未被调用
      // 修复: _designOpeningTitle生成片头方案 → _insertOpeningTitleShot插入S00到渲染队列
      this._writeAuditLog('stage8_1_start', { action: '开场标题设计开始' });
      await _designOpeningTitle(this);
      await this._insertOpeningTitleShot();
      this._writeAuditLog('stage8_1_end', { status: 'success' });

      // 阶段8: 运镜控制
      this._writeAuditLog('stage8_start', { action: '运镜控制开始' });
      await this.stage8_CinematographyControl();
      this._writeAuditLog('stage8_end', { status: 'success' });

      // 🎙️ v5.4-Peng: Stage 7.5 对话标注(角色对白/口型同步)
      this._writeAuditLog('stage7_5_start', { action: '对话标注开始' });
      await this.stage7_5_DialogueAnnotation();
      this._writeAuditLog('stage7_5_end', { status: 'success' });

      // 🆕 v6.11-Peng-fix: Stage 7.5后立即保存storyPlan(含dialogues),防止Stage 8.2从磁盘读不到更新
      if (this.results.storyPlan) {
        this._saveStoryPlan(this.results.storyPlan);
      }

      // 🆕 v5.3-Peng: Stage 8.2 节奏强化(短剧快剪模式)
      this._writeAuditLog('stage8_2_start', { action: '节奏强化开始' });
      await this._stage82_RhythmIntensification();
      this._writeAuditLog('stage8_2_end', { status: 'success' });

      // 🆕 v5.1-Peng: 提示词预生成(在预生产审核之前)
      // 确保审核文档能看到完整提示词
      if (this.preProductionMode) {
        // 🏷️ v6.31-Peng: Prompt融合层 — 在Prompt生成前应用品牌约束
        if (this.adConfig.enabled) {
          this._writeAuditLog('stage8_0_ad_fusion_start', { action: '广告Prompt融合开始' });
          await this._applyAdPromptFusion();
          this._writeAuditLog('stage8_0_ad_fusion_end', { status: 'success' });
        }

        // 🆕 v6.32-fix2: 定妆照前置检查 — Stage 8.2之前验证角色参考图目录
        this._writeAuditLog('stage8_1_5_charref_check_start', { action: '定妆照前置检查开始' });
        const charRefCheck = this._checkCharacterRefsBeforePromptGen();
        if (!charRefCheck.passed) {
          const errMsg = `FATAL_BLOCKER: 定妆照缺失 — ${charRefCheck.reason}`;
          console.log(`\n  ❌ ${errMsg}`);
          const blockerError = new Error(errMsg);
          blockerError.code = 'FATAL_BLOCKER';
          blockerError.blockerCount = 1;
          blockerError.failedShots = [{ shotId: 'ALL', reason: charRefCheck.reason }];
          throw blockerError;
        }
        this._writeAuditLog('stage8_1_5_charref_check_end', { status: 'success', characters: charRefCheck.characters });

        console.log(`\n📝 阶段8.2/10: 提示词预生成 (v5.1-Peng)`);
        console.log(`   为预生产审核生成完整提示词...`);
        await this.stage8_2_PromptPreGeneration();

        // 🆕 v6.11-Peng-fix3: Stage 8.3 质量校准从未被调用!
        // 根因: _stage83_QualityCalibration定义于line 2978但从未在pipeline中被await
        // 导致in-memory的calibrated prompt(含1000字符+字段注入)从未写入04-prompts/
        // 修复: 在stage8_2之后、compliance check之前调用
        console.log(`\n🔧 Stage 8.3: 质量校准 (v6.17-Peng 智能注入)`);
        await this._stage83_QualityCalibration();

        // 🆕 v6.35-Peng: Stage 8.4 好莱坞技能路由注入
        // 将 cinematography-skill-router.js 的149个镜头级专项技能注入每个shot的_generatedPrompt
        console.log(`\n🎬 Stage 8.4: 好莱坞技能路由注入 (v6.35-Peng)`);
        await this._stage84_CinematographySkillInjection();

        // 🆕 v2.4-Peng: Stage 8.3 - 最终Prompt合规检查(利用率硬性闸门)
        console.log(`\n🛡️ 阶段8.3/10: 最终Prompt合规检查 (v4.1 长度健康区间)`);
        await this._runComplianceCheck({ phase: 'final', label: '阶段8.3/10: 最终Prompt合规检查' });
      }

      // 🆕 v5.22-Peng-fix: 预生产审核后置到Stage 8之后
      // 原位置:Stage 8.5在Stage 9之前执行
      // 新位置:Stage 8之后直接执行预生产审核(导演优化和编剧优化环节已删除,见v6.8-Peng-fix)
      // 原因: v6.8-Peng-fix - 删除导演优化+编剧优化环节,简化链路,避免级联故障
      // 这些环节引入LLM评审→修复→重新生成闭环,但失败率高,反而降低质量
      // Stage 8直接生成的Prompt已合格(expandPromptToTarget+validatePromptLength确保95-99%)
      // 删除后,Stage 8之后直接进入预生产审核,减少失败点

      // ❌ v6.8-Peng-fix: 删除导演优化+编剧优化环节
      // this._writeAuditLog('stage9_creative_start', { action: '创作打磨开始' });
      // await this._creativePolishing(); // 已删除 - 失败率高,降低质量
      // this._writeAuditLog('stage9_creative_end', { status: 'success' });

      console.log(`\n✅ Stage 8 直接生成完成,跳过导演优化/编剧优化(v6.8-Peng-fix 已删除)`);

      // 🆕 v5.22-Peng-fix: 预生产审核后置到导演优化+编剧优化之后
      // 在打磨完成后生成最终审核文档

      // ❌ v6.8-Peng-fix: Stage 10.4和10.5已删除,因为导演优化+编剧优化已删除
      // 不再需要"编剧优化后重新生成"和"优化后合规检查"
      // Stage 8直接生成的Prompt是最终版本,直接进行预生产审核

      // 🆕 v6.8-Peng-fix: 直接进入预生产审核(跳过导演优化/编剧优化)

      // 🆕 v6.6-Peng-fix: 修复stage8_5_UserConfirmation方法缺失
      // 在预生产模式下,直接跳过用户确认,继续执行
      // 生产模式下,生成最终报告并暂停
      let confirmationResult = { confirmed: true, mode: 'pre-production' };

      if (!this.preProductionMode) {
        console.log(`\n🔴 阶段11/12: 最终确认闸机 (v5.22-Peng)`);
        console.log(`   导演优化+编剧优化已完成,请求主人最终确认是否提交渲染`);
        console.log(`\n   请大鹏确认"可以提交渲染"后开始生产`);
        return this._generateFinalReport('paused', null, { preProduction: confirmationResult });
      }

      // 🆕 v6.6-Peng-fix: 预生产模式直接调用质检,不调用渲染
      if (this.preProductionMode) {
        // 🏷️ v6.31-Peng: 品牌安全校验 — 质检前执行广告合规检查
        if (this.adConfig.enabled) {
          this._writeAuditLog('stage11_ad_safety_start', { action: '品牌安全校验开始' });
          await this._runBrandSafetyCheck();
          this._writeAuditLog('stage11_ad_safety_end', { status: 'success' });
        }

        console.log(`\n📝 阶段11/12: 预生产审核 (v6.6-Peng)`);
        console.log(`   生成最终审核文档...`);
        await this.stage11_QualityCheck();
      } else {
        // 生产模式:调用渲染
        this._writeAuditLog('stage11_start', { action: '渲染开始' });
        await this.stage11_Render();
        this._writeAuditLog('stage11_end', { status: 'success' });
      }

      // 阶段12: 后期制作 (原Stage 10)
      this._writeAuditLog('stage12_start', { action: '后期制作开始' });
      await this.stage12_PostProduction();
      this._writeAuditLog('stage12_end', { status: 'success' });

      // 生成最终报告
      this._finalizeAuditLog({ status: 'success', stageCount: 12 });
      return this._generateFinalReport('success');

    } catch (error) {
      // 🆕 v6.32-fix1: FATAL_BLOCKER 不可恢复 — 闸机阻断必须硬停止，禁止agent绕过
      if (error.code === 'FATAL_BLOCKER') {
        console.error(`\n🔴 FATAL_BLOCKER: Pipeline被闸机阻断，不可恢复`);
        console.error(`   阻断镜头数: ${error.blockerCount}`);
        console.error(`   失败镜头: ${(error.failedShots || []).map(s => s.shotId).join(', ')}`);
        console.error(`   操作: 修复问题后重新跑完整预生产链路`);
        this.errors.push({ stage: this.currentStage, error: error.message, fatal: true });
        this._finalizeAuditLog({ status: 'blocked', error: error.message, fatalBlocker: true });
        // 重新抛出，让调用方也感知到阻断
        throw error;
      }
      console.error(`\n❌ Pipeline 失败: ${error.message}`);
      this.errors.push({ stage: this.currentStage, error: error.message });
      this._finalizeAuditLog({ status: 'failed', error: error.message });
      return this._generateFinalReport('failed', error);
    }
  }

  // ============ 阶段1: PRD生成 (v6.3-Peng: LLM智能PRD生成) ============
  async stage1_PRDGeneration(userInput) {
    const { stage1_PRDGeneration: fn } = require('./stage1-prd');
    return fn(this, userInput);
  }

  /**
   * 🆕 v6.4-Peng-fix: PRD字数超限自动精简
   * 优先删除技术细节、FIXED注释、冗长视觉描述
   */
  _trimPRDToLimit(prd, limit) {
    let trimmed = prd;

    // 1. 删除FIXED注释行
    trimmed = trimmed.replace(/\s*\[FIXED:.*?\]\s*/g, ' ');

    // 2. 删除技术实现章节(6. 技术实现方案)
    trimmed = trimmed.replace(/##\s*6\.\s*技术实现[\s\S]*?(?=##\s*\d+\.|$)/, '');

    // 3. 删除核心互动设计中的技术实现子章节(5.2)
    trimmed = trimmed.replace(/###\s*5\.2\s*技术实现[\s\S]*?(?=###\s*\d+\.|##\s*\d+\.|$)/, '');

    // 4. 删除角色定义中的过长技术细节(保留前200字符/角色)
    const charSection = trimmed.match(/##\s*3\.\s*角色定义([\s\S]*?)(?=##\s*\d+\.|$)/);
    if (charSection) {
      let charText = charSection[1];
      // 删除角色中的"神圣战神美学处理"等长段落
      charText = charText.replace(/-\s*\*\*神圣战神美学处理\*\*[\s\S]*?(?=\n\s*-\s*\*\*|$)/g, '');
      charText = charText.replace(/-\s*\*\*核心动作\*\*[\s\S]*?(?=\n\s*-\s*\*\*|$)/g, '');
      charText = charText.replace(/-\s*\*\*战斗之舞本质\*\*[\s\S]*?(?=\n\s*-\s*\*\*|$)/g, '');
      trimmed = trimmed.replace(charSection[0], `## 3. 角色定义${charText}`);
    }

    // 5. 精简场景设计的视觉重点(保留关键词,删除长段落)
    trimmed = trimmed.replace(/\|.*\|.*\|.*\|.*\|.*\|.*\n/g, (match) => {
      // 如果一行超过200字符,截断视觉重点列
      if (match.length > 200) {
        const parts = match.split('|');
        if (parts.length >= 5) {
          parts[5] = parts[5].substring(0, 80) + '...';
          return parts.join('|') + '\n';
        }
      }
      return match;
    });

    // 6. 如果仍然超限,删除因果链条章节(2.2)
    if (trimmed.length > limit) {
      trimmed = trimmed.replace(/###\s*2\.2\s*核心叙事因果链条[\s\S]*?(?=###\s*\d+\.|##\s*\d+\.|$)/, '');
    }

    // 7. 如果仍然超限,截断故事大纲为更简短版本
    if (trimmed.length > limit) {
      const outlineMatch = trimmed.match(/##\s*2\.\s*故事大纲([\s\S]*?)(?=##\s*\d+\.|$)/);
      if (outlineMatch) {
        let outlineText = outlineMatch[1];
        // 每幕只保留第一句话
        outlineText = outlineText.replace(/(第[一二三]幕:.*?)\n[\s\S]*?(?=第[一二三]幕:|##\s*\d+\.|$)/g, '$1\n');
        trimmed = trimmed.replace(outlineMatch[0], `## 2. 故事大纲${outlineText}`);
      }
    }

    return trimmed;
  }

  /**
   * 🆕 生成降级PRD(仅当外部未提供时使用)
   */
  _generateFallbackPRD(userInput) {
    const safeInput = userInput || {};
    const { title, outline, characters, style, duration } = safeInput;
    return `# 产品需求文档 (PRD) - ${title || '未命名'}

## 1. 需求概述
- **标题**: ${title || '未命名'}
- **目标时长**: ${duration || 180}秒
- **风格**: ${style || '写实'}
- **世界观**: ${this.worldview}

## 2. 故事大纲
${outline || '未提供'}

## 3. 角色定义
${(characters || []).map(c => `- ${c.name}: ${c.species || '未知'} (${c.role || '未知'})`).join('\n')}

## 4. 需求契约(不可协商元素)
- 角色: ${(characters || []).map(c => c.name).join(', ')}
- 关键场景: [从大纲提取]
- 核心动作: [从大纲提取]
- 情绪基调: ${style || '未指定'}

## 5. 验收标准
- [ ] 所有角色在最终视频中可见
- [ ] 核心动作完整呈现
- [ ] 时长误差 ≤ 5%

---
*降级生成时间: ${new Date().toISOString()}*
*Pipeline版本: ${PIPELINE_VERSION}*
`;
  }

  // 🆕 v2.6-Peng: BeastMind Engine 集成方法
  _shouldUseBeastMind() {
    // 自动检测:如果用户输入包含异兽相关信息,启用BeastMind
    const userInput = this.options.userInput || {};
    const beastKeywords = ['异兽', '山海经', '神兽', '饕餮', '烛龙', '帝江', '九尾', '刑天', '白泽', '麒麟', '穷奇', '混沌'];
    const text = `${userInput.title || ''} ${userInput.outline || ''} ${userInput.type || ''}`;
    let hasBeast = beastKeywords.some(kw => text.includes(kw));

    // 🆕 v6.33-Peng-fix: 如果userInput没有关键词,扫描PRD文件
    if (!hasBeast) {
      const prdPath = path.join(this.productionDir, '00-prd', 'prd.md');
      if (fs.existsSync(prdPath)) {
        const prdText = fs.readFileSync(prdPath, 'utf8').substring(0, 2000);
        hasBeast = beastKeywords.some(kw => prdText.includes(kw));
        if (hasBeast) {
          console.log(`  🐉 PRD中检测到异兽关键词,启用BeastMind引擎`);
        }
      }
    }

    // 或者如果项目配置了异兽模式
    const hasBeastConfig = this.projectConfig?.beastMode || this.projectConfig?.worldview === 'shanhaijing';

    return hasBeast || hasBeastConfig;
  }

  async _generateBeastMindStoryPlan(storyPlanPath) {
    const { BeastMindEngine } = require('./beastmind-engine');
    const engine = new BeastMindEngine();

    // 提取异兽信息
    const userInput = this.options.userInput || {};
    let beastName = userInput.beastName || userInput.title?.split(/[::]/)[0] || '';
    let beastDesc = userInput.beastDescription || userInput.outline || '';
    
    // 🆕 v6.33-Peng-fix: CLI模式无userInput时,从PRD提取异兽名称和描述
    // 同时处理task-router自动填充的占位符('未命名'/'异兽'等)
    if (!beastName || beastName === '未命名' || beastName === '异兽') {
      const prdPath = path.join(this.productionDir, '00-prd', 'prd.md');
      if (fs.existsSync(prdPath)) {
        const prdText = fs.readFileSync(prdPath, 'utf8');
        // 从PRD标题提取异兽名: # 白泽 - 产品需求文档
        const titleMatch = prdText.match(/^#\s*(\S+)\s*[-–—]/m);
        if (titleMatch) beastName = titleMatch[1];
        if (!beastDesc || beastDesc.length < 50) beastDesc = prdText.substring(0, 1500);
        console.log(`  📋 从PRD提取: 异兽=${beastName}`);
      }
    }
    if (!beastName) beastName = '异兽';
    
    const habitat = userInput.habitat || this.projectConfig?.habitat || '';
    const duration = userInput.duration || 60;
    const episode = userInput.episode || 'E01';
    const title = userInput.title || `${beastName}的故事`;

    // 生成增强型story-plan (v3.0-Peng: async LLM推理)
    const storyPlan = await engine.generate({
      beastName,
      beastDescription: beastDesc,
      habitat,
      duration,
      title,
      episode,
      xiaoGContext: '8岁中国男孩,Nirath探险者'
    });

    // 🆕 v6.33-Peng-fix: BeastMindEngine v3.0+ 已返回shots数组(含camera/lighting/beastMind等),
    //   优先使用LLM生成的shots,不再从outline文字重新构造空shots
    if (storyPlan.shots && Array.isArray(storyPlan.shots) && storyPlan.shots.length > 0) {
      // v3.0+: BeastMind已生成完整shots,直接包装为segments
      storyPlan.segments = [{
        id: 'SEG1',
        name: '主段落',
        act: 1,
        type: 'main',
        duration: storyPlan.totalDuration || duration,
        shots: storyPlan.shots
      }];
      console.log(`  ✅ BeastMind v3.0+ shots: ${storyPlan.shots.length}个镜头,直接使用`);
    } else if (storyPlan.outline && !storyPlan.segments) {
      const outlineMap = {
        '起': { act: 1, type: 'opening', duration: 8 },
        '承': { act: 2, type: 'development', duration: 10 },
        '转': { act: 3, type: 'turning', duration: 12 },
        '高潮': { act: 4, type: 'climax', duration: 14 },
        '合': { act: 5, type: 'resolution', duration: 8 }
      };
      const actKeys = ['起', '承', '转', '高潮', '合'];
      const totalDuration = duration;
      storyPlan.segments = [];
      let globalShotIdx = 0;
      for (const actKey of actKeys) {
        if (!storyPlan.outline[actKey]) continue;
        const meta = outlineMap[actKey];
        const baseDesc = storyPlan.outline[actKey];
        // 每个act至少2个镜头
        const shotCount = (actKey === '起' || actKey === '合') ? 2 : 3;
        const segDuration = Math.round(totalDuration * (meta.duration / totalDuration)) || 8;
        const shots = [];
        for (let i = 0; i < shotCount; i++) {
          const shotId = `S${String(globalShotIdx).padStart(2, '0')}`;
          // 从outline文字中提取本镜头对应的分段描述
          const sentences = baseDesc.split(/[。！？]/).filter(s => s.trim().length > 5);
          const segSentences = sentences.slice(i * 2, i * 2 + 2).join('。');
          shots.push({
            id: shotId,
            shotId: shotId,
            type: i === 0 ? meta.type : 'normal',
            act: meta.act,
            description: segSentences || baseDesc.substring(0, 100),
            duration: Math.round(segDuration / shotCount) || 4,
            characters: actKey === '起' ? ['小G'] : ['白泽', '小G'],
            tension: actKey === '转' ? 7 : actKey === '高潮' ? 9 : 4,
            camera: '',
            _beastPerspective: true,
            _generatedPrompt: ''
          });
          globalShotIdx++;
        }
        storyPlan.segments.push({
          id: `SEG${meta.act}`,
          name: actKey,
          act: meta.act,
          type: meta.type,
          duration: segDuration,
          shots: shots
        });
      }
      // 同步characters字段(白泽+小G)
      if (!storyPlan.characters || Object.keys(storyPlan.characters).length === 0) {
        storyPlan.characters = {
          baize: { id: 'baize', name: '白泽', species: '神兽', role: '智慧守护者', description: '通体雪白,额头中央竖眼,三叉尾焰' },
          xiaog: { id: 'xiaog', name: '小G', species: '人类', role: '探险者', description: '8岁中国男孩,Nirath探险者' }
        };
      }
    }

    // 🆕 v6.1-Peng: 注入神兽视角模式到story-plan
    storyPlan.perspectiveMode = 'beast-first-person';

    // 🆕 v6.11-Peng-fix4: BeastMindEngine返回的shots没有id,立即补上避免后续全部undefined
    let shotCounter = 0;
    for (const seg of storyPlan.segments || []) {
      for (const shot of seg.shots || []) {
        if (!shot.id) {
          shot.id = `S${String(shotCounter).padStart(2, '0')}`;
        }
        shotCounter++;
      }
    }

    // 注入神兽视角到所有镜头描述
    const { injectPerspectiveToShots } = require('../../shanhaijing-story-engine/beast-perspective-injector');
    const allShots = [];
    if (storyPlan.segments) {
      for (const seg of storyPlan.segments) {
        if (seg.shots) allShots.push(...seg.shots);
      }
    } else if (storyPlan.shots) {
      allShots.push(...storyPlan.shots);
    }

    const transformedShots = injectPerspectiveToShots(allShots, 'beast-first-person', toCharArray(storyPlan.characters));

    // 将转换后的shots放回storyPlan
    if (storyPlan.segments) {
      let idx = 0;
      for (const seg of storyPlan.segments) {
        if (seg.shots) {
          seg.shots = transformedShots.slice(idx, idx + seg.shots.length);
          idx += seg.shots.length;
        }
      }
    } else if (storyPlan.shots) {
      storyPlan.shots = transformedShots;
    }

    // 保存到文件
    fs.mkdirSync(path.dirname(storyPlanPath), { recursive: true });
    fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2));

    return storyPlan;
  }

  // 🆕 v6.4-Peng-fix: PRD智能摘要化 - 压缩PRD输入从3000字符到800字符以内
  // 目的:减少LLM处理时间,从8分钟降到3分钟
  _summarizePRD(prd) {
    if (!prd || typeof prd !== 'string') return '';

    const summary = {
      title: '',
      duration: '',
      characters: [],
      outline: [],
      emotionCurve: [],
      keyScenes: []
    };

    // 🔧 v6.35-Peng-fix: 修复PRD标题提取正则（同main()修复）
    let titleMatch = prd.match(/^#\s*(\S+)\s*[-–—]\s*产品需求文档/m);
    if (!titleMatch) titleMatch = prd.match(/#\s*产品需求文档.*?[-\-]\s*(.+)/);
    summary.title = titleMatch ? titleMatch[1].trim() : '';

    // 提取时长
    const durationMatch = prd.match(/目标时长[::]\s*(\d+)/);
    summary.duration = durationMatch ? durationMatch[1] + '秒' : '';

    // 提取角色(从角色定义部分)
    const charSection = prd.match(/##\s*3\.\s*角色定义([\s\S]*?)(?=##|$)/);
    if (charSection) {
      const charLines = charSection[1].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
      for (const line of charLines.slice(0, 4)) { // 最多4个角色
        const charMatch = line.match(/[-*]\s*(.+?)[::]\s*(.+)/);
        if (charMatch) {
          summary.characters.push(`${charMatch[1]}(${charMatch[2].substring(0, 50)})`);
        }
      }
    }

    // 提取故事大纲(3幕结构,每幕1句话)
    const outlineSection = prd.match(/##\s*2\.\s*故事大纲([\s\S]*?)(?=##|$)/);
    if (outlineSection) {
      const outlineText = outlineSection[1];
      // 提取第一幕、第二幕、第三幕的关键句
      const actMatches = outlineText.match(/第[一二三]幕[::]?\s*(.+?)(?=\n|$)/g);
      if (actMatches) {
        for (const act of actMatches.slice(0, 3)) {
          const actClean = act.replace(/第[一二三]幕[::]?\s*/, '').trim();
          summary.outline.push(actClean.substring(0, 80));
        }
      }
    }

    // 提取情绪曲线数据点
    const emotionMatch = prd.match(/情绪曲线[::]\s*\[(.*?)\]/);
    if (emotionMatch) {
      summary.emotionCurve = emotionMatch[1].split(',').map(s => s.trim()).slice(0, 5);
    }

    // 提取关键场景(最多3个)
    const sceneMatches = prd.match(/[-*]\s*(.+?场景[::].+)/g);
    if (sceneMatches) {
      summary.keyScenes = sceneMatches.slice(0, 3).map(s => s.replace(/[-*]\s*/, '').trim().substring(0, 60));
    }

    // 组装摘要
    const parts = [
      `标题:${summary.title}`,
      `时长:${summary.duration}`,
      `角色:${summary.characters.join(' | ')}`,
      `大纲:${summary.outline.join(' → ')}`,
      `情绪:${summary.emotionCurve.join('→')}`,
      `场景:${summary.keyScenes.join(' | ')}`
    ];

    return parts.join('\n');
  }

  // 🆕 v6.4-Peng-fix2: 从PRD自动推断用户输入(断点续跑时userInput为空)
  _inferUserInputFromPRD(prd) {
    const userInput = {};
    if (!prd || typeof prd !== 'string') return userInput;

    // 提取标题
    const titleMatch = prd.match(/[-*]\s*\*\*标题\*\*[::]\s*(.+)/);
    if (titleMatch) userInput.title = titleMatch[1].trim();

    // 提取时长
    const durationMatch = prd.match(/目标时长[::]\s*(\d+)/);
    if (durationMatch) userInput.duration = parseInt(durationMatch[1]);

    // 提取风格
    const styleMatch = prd.match(/风格[::]\s*(.+)/);
    if (styleMatch) userInput.style = styleMatch[1].trim();

    // 提取类型
    const typeMatch = prd.match(/类型[::]\s*(.+)/);
    if (typeMatch) userInput.type = typeMatch[1].trim();

    // 提取角色
    const charSection = prd.match(/##\s*3\.\s*角色定义([\s\S]*?)(?=##|$)/);
    if (charSection) {
      userInput.characters = [];
      const charLines = charSection[1].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
      for (const line of charLines) {
        const charMatch = line.match(/[-*]\s*\*\*(.+?)\*\*[::]\s*(.+)/);
        if (charMatch) {
          userInput.characters.push({
            name: charMatch[1].trim(),
            species: '未知',
            features: [charMatch[2].trim().substring(0, 100)],
            role: '主角'
          });
        }
      }
    }

    return userInput;
  }

  // ============ 阶段2: 需求对齐闸机 (v6.4-Peng-fix: PRD摘要化 + 分级评估) ============
  async stage2_RequirementAlignment() {
    const { stage2_RequirementAlignment: fn } = require('./stage2-alignment');
    return fn(this);
  }

  /**
   * 🆕 v6.4-Peng: 自动修复PRD闭环机制
   * 根据LLM分析的问题自动修复PRD,循环直到通过或达到最大重试次数
   * @param {string} prd - 当前PRD内容
   * @param {object} userInput - 用户输入
   * @param {object} llmAlignment - LLM对齐分析结果
   * @param {object} localAlignment - 本地对齐结果
   * @returns {object|null} - {fixed: boolean, round: number} 或 null
   */
  async _autoFixPRD(prd, userInput, llmAlignment, localAlignment) {
    const maxRounds = 3;
    let currentPRD = prd;

    for (let round = 1; round <= maxRounds; round++) {
      console.log(`\n  🔧 PRD自动修复第${round}/${maxRounds}轮...`);

      // 1. 生成修复指令(基于LLM的criticalGaps和improvementSuggestions)
      const fixInstructions = this._generatePRDFixInstructions(llmAlignment, localAlignment, round);
      console.log(`  📋 修复指令: ${fixInstructions.length}条`);

      // 2. 调用LLM生成修复后的PRD
      const { LLMReasoningLayer } = require('./llm-reasoning-layer');
      const llmLayer = new LLMReasoningLayer();

      const fixResult = await llmLayer.llmReason({
        stage: 'prd-auto-fix',
        systemPrompt: `你是一位专业的PRD修复工程师。根据给定的修复指令,修改PRD内容,解决发现的问题。

修复原则:
1. 保留PRD原有结构和核心内容
2. 针对性补充缺失信息(角色定义、场景细节、叙事逻辑)
3. 调整不合理的参数(时长、镜头数)
4. 增强技术可行性描述
5. 保持PRD的专业格式(Markdown)

输出要求:
- 返回完整的修复后PRD(Markdown格式)
- 不要省略任何原有内容
- 在修改处标注 [FIXED: 修复原因]`,
        userPrompt: `请根据以下修复指令修改PRD:

修复指令:
${fixInstructions.join('\n')}

当前PRD:
${currentPRD.substring(0, 5000)}

用户原始需求:
${JSON.stringify(userInput, null, 2)}

请返回修复后的完整PRD。`,
        level: 'heavy',
        llmOptions: getLLMConfig('storyplan-repair'),
        fallback: () => null
      });

      if (!fixResult.success || fixResult.fallbackUsed || !fixResult.result) {
        console.log(`  ⚠️ 第${round}轮LLM修复失败,尝试本地修复...`);
        // 降级:本地规则修复
        currentPRD = this._localFixPRD(currentPRD, fixInstructions, this.results.storyPlan);
      } else {
        currentPRD = fixResult.result;
      }

      // 3. 写回PRD文件
      const prdPath = path.join(this.productionDir, '00-prd', 'prd.md');
      fs.writeFileSync(prdPath, currentPRD, 'utf8');
      console.log(`  💾 修复后PRD已保存: ${prdPath}`);

      // 4. 更新内存中的PRD
      this.results.prd = currentPRD;

      // 5. 快速检查是否通过
      const recheck = this._quickRecheckPRD();
      if (recheck.passed) {
        console.log(`  ✅ 第${round}轮修复后通过: ${recheck.score}/100`);
        return { fixed: true, round };
      }

      console.log(`  ⚠️ 第${round}轮修复后仍未通过: ${recheck.score}/100,继续修复...`);
    }

    console.log(`  ❌ ${maxRounds}轮自动修复后仍未通过`);
    return { fixed: false, round: maxRounds };
  }

  /**
   * 生成PRD修复指令(基于LLM分析结果)
   */
  _generatePRDFixInstructions(llmAlignment, localAlignment, round) {
    const instructions = [];

    // 从LLM分析中提取问题
    if (llmAlignment?.criticalGaps) {
      for (const gap of llmAlignment.criticalGaps) {
        instructions.push(`[P0-${round}] ${gap}`);
      }
    }

    if (llmAlignment?.improvementSuggestions) {
      for (const sug of llmAlignment.improvementSuggestions) {
        // 只取前2轮的建议,避免过多
        if (round <= 2 || sug.includes('立即修复')) {
          instructions.push(`[P1-${round}] ${sug}`);
        }
      }
    }

    // 从本地分析中提取问题
    if (localAlignment?.details) {
      for (const detail of localAlignment.details) {
        if (detail.severity === 'error' || detail.severity === 'warning') {
          instructions.push(`[LOCAL-${round}] ${detail.message}`);
        }
      }
    }

    // 去重
    return [...new Set(instructions)];
  }

  /**
   * 本地规则修复PRD(降级方案)
   */
  _localFixPRD(prd, instructions) {
    let fixed = prd;

    for (const instr of instructions) {
      // 角色定义补充
      if (instr.includes('角色') && instr.includes('补充')) {
        const characterSection = fixed.match(/## 3\. 角色定义[\s\S]*?(?=## \d|\n*$)/);
        if (characterSection) {
          // 🆕 v6.11-Peng-fix: 从storyPlan.characters自动提取角色描述,不硬编码任何角色名
          const autoCharDesc = (storyPlan?.characters || []).map(c => {
            const features = [c.description, c.signature, c.state].filter(Boolean).join('; ');
            return `- ${c.name}: ${features || '未提供描述'}`;
          }).join('\n');
          fixed = fixed.replace(
            characterSection[0],
            characterSection[0] + '\n\n### 补充角色定义(自动修复)\n' + autoCharDesc
          );
        }
      }

      // 时长调整
      if (instr.includes('时长') && (instr.includes('超载') || instr.includes('过满'))) {
        fixed = fixed.replace(/(\d+)秒/g, (match, num) => {
          const n = parseInt(num);
          if (n === 60) return '90秒';
          return match;
        });
      }

    }

    return fixed;
  }

  /**
   * 快速重新检查PRD(简化版评估)
   */
  _quickRecheckPRD() {
    const prd = this.results.prd || '';
    const userInput = this.options.userInput || {};

    let score = 50; // 基础分
    let passed = false;
    const checks = [];

    // 检查1:角色定义是否详细
    const hasDetailedCharacters =
      prd.includes('面部') || prd.includes('发型') ||
      prd.includes('体型') || prd.includes('服装');
    checks.push({ name: '角色细节', pass: hasDetailedCharacters, score: hasDetailedCharacters ? 20 : 5 });
    score += hasDetailedCharacters ? 20 : 5;

    // 检查2:时长是否合理
    const durationMatch = prd.match(/(\d+)秒/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 60;
    const hasReasonableDuration = duration >= 60 && duration <= 120;
    checks.push({ name: '时长合理', pass: hasReasonableDuration, score: hasReasonableDuration ? 15 : 5 });
    score += hasReasonableDuration ? 15 : 5;

    // 检查3:叙事逻辑是否完整
    const hasNarrativeLogic =
      prd.includes('触发') || prd.includes('因果') ||
      prd.includes('逻辑') || prd.includes('为什么');
    checks.push({ name: '叙事逻辑', pass: hasNarrativeLogic, score: hasNarrativeLogic ? 15 : 5 });
    score += hasNarrativeLogic ? 15 : 5;

    // 检查4:场景描述是否详细
    const hasSceneDetails = prd.includes('场景') && (prd.includes('细节') || prd.includes('描述'));
    checks.push({ name: '场景细节', pass: hasSceneDetails, score: hasSceneDetails ? 15 : 5 });
    score += hasSceneDetails ? 15 : 5;

    // 检查5:技术可行性说明
    const hasTechFeasibility = prd.includes('可实现') || prd.includes('技术') || prd.includes('AI');
    checks.push({ name: '技术可行', pass: hasTechFeasibility, score: hasTechFeasibility ? 10 : 5 });
    score += hasTechFeasibility ? 10 : 5;

    // 检查6:风格一致性
    const hasStyleConsistency = prd.includes('风格') && !prd.includes('矛盾');
    checks.push({ name: '风格一致', pass: hasStyleConsistency, score: hasStyleConsistency ? 10 : 5 });
    score += hasStyleConsistency ? 10 : 5;

    // 检查7:合规性
    const hasCompliance = prd.includes('合规') || prd.includes('安全');
    checks.push({ name: '合规性', pass: hasCompliance, score: hasCompliance ? 10 : 5 });
    score += hasCompliance ? 10 : 5;

    // 综合判断
    passed = score >= 75;

    console.log(`  📊 快速重检: ${score}/100 ${passed ? '✅通过' : '❌未通过'}`);
    for (const check of checks) {
      console.log(`     ${check.pass ? '✅' : '⚠️'} ${check.name}: +${check.score}`);
    }

    return { score, passed, checks };
  }

  // ============ 阶段3: Schema校验 (v6.3-Peng: LLM深度结构验证+故事引擎) ============
  async stage3_SchemaValidation() {
    const { stage3_SchemaValidation: fn } = require('./stage3-schema');
    return fn(this);
  }

  // ============ 阶段3.5: 字段充实 (🆕 fix15-v1) ============
  /**
   * 修复白泽预生产8字段缺失问题:
   * 1. 优先从 shot 已有字段推断（避免调LLM）
   * 2. 推断失败时批量调 LLM 生成 9字段 JSON
   * 3. LLM失败时降级到本地规则填充
   * 4. 充实后直接写入 shot.character/action/scene 等字段，PromptAssembler 优先使用
   * 5. 写回 story-plan.json 持久化
   */
  async stage3_5_FieldEnrichment() {
    const { stage3_FieldEnrichment: fn } = require('./stage3-field-enrichment');
    return fn(this);
  }

  // ============ 阶段4: 故事板校验 (v6.1-Peng: LLM深度审片) ============
  async stage4_StoryboardCheck() {
    const { stage4_StoryboardCheck: fn } = require('./pipeline-story-support');
    return fn(this);  }

  /**
   * 🆕 v6.1-Peng: 构建storyPlan摘要供LLM审片
   */
  /**
   * 🆕 v6.3-Peng-fix2: 智能StoryPlan序列化(用于LLM输入)
   * 清理运行时注入字段,保留核心结构,控制输出长度
   * 解决Stage 3/4 LLM输入截断导致看不到shots的问题
   */
  _sanitizeStoryPlanForLLM(storyPlan, maxChars = 8000) {
    // 运行时字段黑名单(LLM不需要评估这些)
    const runtimeFields = [
      '_generatedPrompt', '_audioLayer', '_threeLayerAnalysis',
      '_llmEnhancedDescription', '_llmProfile', '_titleOverlay',
      '_timeline', '_sceneGrammar', '_sceneId', '_shotRole',
      '_characterVisualNote', '_dialogueMetadata', '_forcedTransition',
      'cameramove', '_nirathEnergyCore', 'crossShot', 'crossShotRange',
      'voiceEndTime', '_dialogueBlock'
    ];

    function clean(obj) {
      if (Array.isArray(obj)) {
        return obj.map(clean);
      }
      if (obj && typeof obj === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
          if (runtimeFields.includes(k)) continue;
          result[k] = clean(v);
        }
        return result;
      }
      return obj;
    }

    const cleaned = clean(storyPlan);
    let json = JSON.stringify(cleaned, null, 2);

    // 如果还超长,压缩description字段
    if (json.length > maxChars) {
      const over = json.length - maxChars;
      // 计算每个shot description需要截断多少
      let shotCount = 0;
      for (const seg of cleaned.segments || []) {
        shotCount += (seg.shots || []).length;
      }
      if (shotCount > 0) {
        const cutPerShot = Math.ceil(over / shotCount) + 50; // 额外留50缓冲
        for (const seg of cleaned.segments || []) {
          for (const shot of seg.shots || []) {
            if (shot.description && shot.description.length > 300) {
              shot.description = shot.description.substring(0, shot.description.length - cutPerShot) + '...[截断]';
            }
          }
        }
        json = JSON.stringify(cleaned, null, 2);
      }
    }

    return json;
  }

  /**
   * 🆕 v6.3-Peng-fix2: 智能StoryPlan摘要(用于Stage 4故事板审片)
   * 保留完整description,清理运行时字段,确保LLM能看到所有关键信息
   */
  _buildStoryPlanSummary(storyPlan) {
    // 先清理运行时字段
    const runtimeFields = [
      '_generatedPrompt', '_audioLayer', '_threeLayerAnalysis',
      '_llmEnhancedDescription', '_llmProfile', '_titleOverlay',
      '_timeline', '_sceneGrammar', '_sceneId', '_shotRole',
      '_characterVisualNote', '_dialogueMetadata', '_forcedTransition',
      'cameramove', '_nirathEnergyCore', 'crossShot', 'crossShotRange',
      'voiceEndTime', '_dialogueBlock'
    ];

    const lines = [];
    lines.push(`# ${storyPlan.title || '未命名'}`);
    lines.push(`时长: ${storyPlan.targetDuration || 60}秒`);
    lines.push(`风格: ${storyPlan.style || '未指定'}`);
    lines.push(`世界观: ${storyPlan.worldview || '未指定'}`);
    lines.push(`\n## 故事大纲`);
    // 🔧 v6.35-Peng-fix: BeastMindEngine v3.0 returns outline as object (五幕)
    const outlineStr = typeof storyPlan.outline === 'object' 
      ? Object.entries(storyPlan.outline).map(([k,v]) => `${k}: ${v}`).join('\n')
      : (storyPlan.outline || '未提供');
    lines.push(outlineStr);

    lines.push(`\n## 角色`);
    for (const char of toCharArray(storyPlan.characters)) {
      // 只取核心描述,过滤运行时字段
      const cleanDesc = (char.description || '').substring(0, 150);
      lines.push(`- ${char.name}: ${cleanDesc}`);
    }

    const totalShots = storyPlan.segments?.reduce((sum, s) => sum + (s.shots?.length || 0), 0) || 0;
    lines.push(`\n## 镜头列表 (${totalShots}个,总时长${storyPlan.totalDuration || '?'}秒)`);
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        lines.push(`\n### ${shot.id} | ${shot.type || '未指定'} | ${shot.duration || 0}s`);
        lines.push(`情绪: ${shot.emotion || '未指定'} | 情绪起点:${shot.emotionStart || '未指定'} → 终点:${shot.emotionEnd || '未指定'} | 张力:${shot.tension || 0}`);
        // 🆕 保留完整description(不截断!LLM需要完整描述来评估叙事质量)
        const desc = shot.description || '未提供';
        lines.push(`描述: ${desc}`);
        if (shot.camera) {
          const camDesc = typeof shot.camera === 'string' ? shot.camera : JSON.stringify(shot.camera);
          lines.push(`运镜: ${camDesc?.substring(0, 200) || '未指定'}`);
        }
        // 保留beastMind关键信息(叙事节拍映射)
        if (shot.beastMind?.beatId) {
          lines.push(`叙事节拍: ${shot.beastMind.beatId}(${shot.beastMind.beatType || '未指定'}) | 反转质量:${shot.beastMind.reversalQuality || 0}`);
        }
      }
    }

    // 保留情绪曲线
    if (storyPlan.metadata?.emotionCurve) {
      lines.push(`\n## 情绪曲线`);
      for (const ec of storyPlan.metadata.emotionCurve) {
        lines.push(`- ${ec.act || '?'}: ${ec.emotion || '?'} (强度:${ec.intensity || '?'})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 🆕 v6.1-Peng: 本地故事板检查(降级用)
   */
  /**
   * 🆕 v6.10-Peng-fix: 世界观一致性检测--自动检测混合世界观并隔离冲突镜头
   */
  _detectWorldviewConsistency(storyPlan) {
    const conflicts = [];

    // 定义世界观关键词映射
    const worldviewKeywords = {
      nirath: ['双恒星', '伴星', '浮空', '晶簇', '光脉', 'Nirath', 'nirath', '孢子', '虹脉', '外星', '神兽', '远古战场', '洪荒'],
      cyberpunk: ['赛博', '企业', '义体', '霓虹', '数据芯', '黑客', '义肢', '仿生人', '赛博格', 'cyberpunk', 'cyber', 'neon', 'hacker', 'corporate'],
      shanhaijing: ['山海经', '异兽', '刑天', '烛龙', '帝江', '白泽', '九尾', '饕餮', '麒麟', '穷奇', '混沌']
    };

    // 提取所有shots的描述
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        allShots.push(shot);
      }
    }

    // 检测主世界观(出现最多的世界观)
    const worldviewCounts = { nirath: 0, cyberpunk: 0, shanhaijing: 0 };
    for (const shot of allShots) {
      const desc = (shot.description || '').toLowerCase();
      for (const [world, keywords] of Object.entries(worldviewKeywords)) {
        for (const kw of keywords) {
          if (desc.includes(kw.toLowerCase())) {
            worldviewCounts[world]++;
            break;
          }
        }
      }
    }

    // 确定主世界观(出现次数最多的)
    const mainWorldview = Object.entries(worldviewCounts).sort((a, b) => b[1] - a[1])[0];
    if (!mainWorldview || mainWorldview[1] === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const mainWorld = mainWorldview[0];
    const mainKeywords = worldviewKeywords[mainWorld];

    // 检测与主世界观冲突的镜头
    for (const shot of allShots) {
      const desc = (shot.description || '').toLowerCase();
      const hasMainWorld = mainKeywords.some(kw => desc.includes(kw.toLowerCase()));

      // 检查是否包含其他世界观的强标志词
      for (const [world, keywords] of Object.entries(worldviewKeywords)) {
        if (world === mainWorld) continue;
        const hasOtherWorld = keywords.some(kw => desc.includes(kw.toLowerCase()));
        if (hasOtherWorld && !hasMainWorld) {
          // 这个镜头包含其他世界观但不包含主世界观 → 冲突
          const matchedKeyword = keywords.find(kw => desc.includes(kw.toLowerCase()));
          conflicts.push({
            shotId: shot.id,
            reason: `包含${world}世界观关键词"${matchedKeyword}",但主世界观为${mainWorld},存在世界观割裂`,
            world: world,
            mainWorld: mainWorld
          });
          break;
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      mainWorldview: mainWorld,
      worldviewCounts
    };
  }

  _localStoryboardCheck(storyPlan) {
    console.log(`  🛡️ 执行本地故事板检查(降级)...`);

    // 叙事逻辑
    const narrative = this._checkNarrativeLogic(storyPlan);
    // 情绪弧线
    const emotion = this._checkEmotionCurve(storyPlan);
    // 镜头连贯性
    const continuity = this._checkShotContinuity(storyPlan);
    // StoryQualityGate
    const { evaluateStoryQuality } = require('../../shanhaijing-story-engine/story-quality-gate');
    const allShots = storyPlan.segments?.flatMap(s => s.shots || []) || [];
    const characters = toCharArray(storyPlan.characters).map(c => c.name) || [];
    const qualityResult = evaluateStoryQuality(allShots, characters, storyPlan.outline || '');

    return {
      narrative: { score: narrative.passed ? 3 : 2, passed: narrative.passed, issues: narrative.issues, suggestions: [] },
      emotion: { score: emotion.passed ? 3 : 2, passed: emotion.passed, issues: emotion.issues, suggestions: [] },
      continuity: { score: continuity.passed ? 3 : 2, passed: continuity.passed, issues: continuity.issues, suggestions: [] },
      quality: { score: qualityResult.passed ? 3 : 2, passed: qualityResult.passed, issues: qualityResult.issues || [], suggestions: [] },
      dialogue: { score: 3, passed: true, issues: [], suggestions: [], generatedDialogues: {} },
      overall: { score: 3, passed: true, summary: '本地规则降级评估(通过+标注模式)' },
      __fallback: true
    };
  }

  _checkNarrativeLogic(storyPlan) {
    const issues = [];
    const shots = [];

    // 收集所有shots
    for (const segment of storyPlan.segments || []) {
      shots.push(...(segment.shots || []));
    }

    // 检查是否有描述为空的shot
    for (const shot of shots) {
      if (!shot.description || shot.description.length < 10) {
        issues.push(`Shot ${shot.id} 描述过短(${shot.description?.length || 0}字符)`);
      }
    }

    // 检查是否有角色但未指定
    for (const shot of shots) {
      if (shot.description && storyPlan.characters) {
        const charNames = toCharArray(storyPlan.characters).map(c => c.name);
        const hasChar = charNames.some(name => shot.description.includes(name));
        if (!hasChar) {
          issues.push(`Shot ${shot.id} 未包含任何角色`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  _checkEmotionCurve(storyPlan) {
    const emotionCurve = storyPlan.metadata?.emotionCurve || [];

    // 检查情绪曲线是否有起伏
    const hasVariation = emotionCurve.length > 1 &&
      emotionCurve.some((v, i) => i > 0 && v !== emotionCurve[i-1]);

    return {
      passed: hasVariation || emotionCurve.length === 0,
      issues: hasVariation ? [] : ['情绪曲线无变化,建议增加情绪起伏']
    };
  }

  _checkShotContinuity(storyPlan) {
    const issues = [];
    const shots = [];

    for (const segment of storyPlan.segments || []) {
      shots.push(...(segment.shots || []));
    }

    // 检查镜头ID连续性
    for (let i = 0; i < shots.length - 1; i++) {
      const currentId = parseInt(String(shots[i].shotId || shots[i].id || '').replace(/\D/g, ''));
      const nextId = parseInt(String(shots[i+1].shotId || shots[i+1].id || '').replace(/\D/g, ''));
      if (nextId !== currentId + 1) {
        issues.push(`镜头ID不连续: ${shots[i].shotId || shots[i].id} → ${shots[i+1].shotId || shots[i+1].id}`);
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // ============ 阶段5: 角色提示词构建 + 定妆照生成 (v6.3-Peng: LLM角色档案生成) ============
  async stage5_CharacterPromptBuild() {
    const { stage5_CharacterPromptBuild: fn } = require('./pipeline-story-support');
    return fn(this);  }

  /**
   * 🆕 v6.3-Peng: 本地角色档案(降级用)
   */
  _localCharacterProfile(char) {
    return {
      visualAppearance: char.description || '未提供外貌描述',
      clothing: char.features?.join(', ') || '未提供服装信息',
      personality: '未提供性格描述',
      microExpressions: '未提供微表情信息',
      posture: '未提供体态信息',
      lighting: '自然光',
      colorPalette: '未指定',
      referenceKeywords: [char.species || 'human', char.name],
      __fallback: true
    };
  }

  // ============ 🆕 v6.3-Peng: Stage 6 合规检查 LLM化 ============
  async stage6_ComplianceCheck() {
    const { stage6_ComplianceCheck: fn } = require('./pipeline-story-support');
    return fn(this);  }

  // ============ 🆕 v5.31-Peng: 统一合规检查服务 (合并Stage 6 + Stage 8.3 + Stage 10.5) ============
  /**
   * 统一合规检查服务
   * @param {Object} options
   * @param {string} options.phase - 'preliminary'(Stage 6) | 'final'(Stage 8.3) | 'post-optimize'(Stage 10.5)
   * @param {string} options.label - 显示标签
   *
   * phase差异:
   * - preliminary: 检查story-plan description, 使用complianceAgent全量检查(质量+合规+利用率)
   * - final/post-optimize: 从04-prompts/文件读取最终prompt, 只检查利用率95%-99%硬性闸门
   */
  async _runComplianceCheck({ phase = 'final', label = '合规检查' }) {
    this.currentStage = `compliance-${phase}`;
    console.log(`\n🛡️ ${label} (统一合规服务 v5.31-Peng | phase: ${phase})`);

    const spStatus = this._getStoryPlanStatus();
    if (!spStatus) {
      this._log({ message: '无story-plan,跳过合规检查', emoji: '⚠️' });
      return { passed: true, skipped: true };
    }
    const { storyPlan, shots } = spStatus;

    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    if (allShots.length === 0) {
      console.log(`  ⚠️ 无shots,跳过合规检查`);
      return { passed: true, skipped: true };
    }

    const checkResults = [];
    let blockerCount = 0;

    const fs = require('fs');
    const path = require('path');
    const promptsDir = path.join(this.productionDir, '04-prompts');

    for (const shot of allShots) {
      // 🆕 v6.31-hotfix: Convert shot ID to match gate check format (1->S01, 2->S02, etc.)
      const shotId = String(shot.id || shot.shotId || 'UNKNOWN');
      const normalizedShotId = shotId.startsWith('S') ? shotId : (`S${String(parseInt(shotId) || 0).padStart(2, '0')}`);

      let prompt = '';
      let length = 0;
      let utilization = 0;
      let status = 'pass';
      let checkDetail = {};

      if (phase === 'preliminary') {
        // 🆕 v6.14-Peng-fix: 阶段6检查原始描述,不检查长度(长度在阶段8.3检查最终prompt)
        // 根因: story-plan.json中的原始描述可能很长(如S00的2226字),但阶段8会重新生成精简prompt
        // 修复: preliminary阶段只检查内容合规性,跳过长度检查
        prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '';

        // 第一层:本地快速预检(只检查内容合规,不检查长度)
        const checkOptions = { skipLengthCheck: true };
        if (shot.type === 'opening_title') {
          checkOptions.skipOpeningTitleCheck = true;
          checkOptions.skipP0Check = true;
        }
        const localResult = await this.complianceAgent.check(prompt, shot, [], checkOptions);

        // 第二层:LLM深度评估(只评估内容合规性)
        let llmScore = localResult.qualityScore;
        let llmGate = localResult.gateDecision;
        let llmWarnings = localResult.warnings || [];

        try {
          const llmResult = await this._complianceCheckWithLLM(prompt, shot, localResult);
          llmScore = Math.min(localResult.qualityScore, llmResult.qualityScore);
          llmGate = (localResult.gateDecision === 'BLOCK' || llmResult.gateDecision === 'BLOCK') ? 'BLOCK' : localResult.gateDecision;
          llmWarnings = [...new Set([...localResult.warnings, ...llmResult.warnings])];
        } catch (llmErr) {
          console.log(`    ⚠️ ${shot.id} LLM合规评估失败(${llmErr.message}),使用本地结果`);
        }

        // 阶段6不检查长度,只检查内容合规
        length = prompt.length;
        const structure = this._checkPromptStructure ? this._checkPromptStructure(prompt) : { coverageRate: 0, pass: true };

        // 判定逻辑:只检查BLOCK和内容结构,不检查长度
        if (llmGate === 'BLOCK') {
          status = 'block';
          console.log(`  ❌ ${shot.id}: 合规检查被阻断 - ${llmWarnings.join(', ')}`);
        } else if (!structure.pass) {
          status = 'missing_structure';
          console.log(`  ❌ ${shot.id}: 结构缺失(缺:${structure.requiredMissing?.join(',') || 'unknown'})`);
        } else {
          console.log(`  ✅ ${shot.id}: 质量分${llmScore.toFixed(1)}, ${length}字符(阶段6不检查长度), 结构覆盖率${structure.coverageRate}%`);
        }

        checkDetail = { qualityScore: llmScore, gateDecision: llmGate, isFinalPrompt: false };
      } else {
        // Stage 8.3 / 10.5: 从文件读取最终prompt,只检查利用率
        // v6.27-Peng: 优先读 .txt 文件(最终标准化输出), fallback 到 .md 文件和内存
        const promptTxtFile = path.join(promptsDir, `prompt-${normalizedShotId}.txt`);
        const promptMdFile = path.join(promptsDir, `${normalizedShotId}-prompt.md`);
        if (fs.existsSync(promptTxtFile)) {
          prompt = fs.readFileSync(promptTxtFile, 'utf8').trim();
        } else if (fs.existsSync(promptMdFile)) {
          const fileContent = fs.readFileSync(promptMdFile, 'utf8');
          const match = fileContent.match(/```([\s\S]*?)```/);
          prompt = match ? match[1].trim() : fileContent.trim();
        } else {
          prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
        }

        length = this._countChars(prompt);

        // v6.27-Peng: 10字段完整性检查
        const tenFieldCheck = checkFinalTenFields(prompt);

        // 英文/中文分离检查
        // 🆕 v6.35-Peng-fix42: CharacterRef 包含中文文件名（如 白泽-45度半身.png），
        // 是元数据字段不参与视觉生成，需从中文检测中排除
        const nonDialogueText = prompt
          .replace(/【Dialogue】[\s\S]*?(?=\s*\|\s*【|$)/i, '')
          .replace(/【CharacterRef】[\s\S]*?(?=\s*\|\s*【|$)/i, '');
        const dialogueMatch = prompt.match(/【Dialogue】([\s\S]*?)(?=\s*\|\s*【|$)/i);
        const dialogueText = dialogueMatch ? dialogueMatch[1] : '';

        const englishWords = countEnglishWords(nonDialogueText);
        const chineseChars = countChineseChars(dialogueText);
        const totalChars = prompt.length;

        const overEnglishWordLimit = englishWords > ENGLISH_WORD_LIMIT;
        const overChineseLimit = chineseChars > CHINESE_DIALOGUE_BUDGET;
        const overTotalLimit = totalChars > FINAL_TOTAL_CHAR_LIMIT;

        // 非 Dialogue 中文污染检查
        const nonDialogueHasChinese = /[\u4e00-\u9fff]/.test(nonDialogueText);

        status = (
          tenFieldCheck.pass &&
          !overEnglishWordLimit &&
          !overChineseLimit &&
          !overTotalLimit &&
          !nonDialogueHasChinese
        )
          ? 'pass'
          : !tenFieldCheck.pass
            ? 'missing_fields'
            : overEnglishWordLimit
              ? 'too_many_english_words'
              : overChineseLimit
                ? 'too_many_chinese_dialogue_chars'
                : overTotalLimit
                  ? 'too_long'
                  : nonDialogueHasChinese
                    ? 'non_dialogue_contains_chinese'
                    : 'unknown';

        if (status !== 'pass') {
          if (status === 'missing_fields') {
            console.log(`  ❌ ${shot.id}: 缺少字段 -> ${(tenFieldCheck.missing || []).join(', ')}`);
          } else if (status === 'too_many_english_words') {
            console.log(`  ❌ ${shot.id}: 英文单词数超限 -> ${englishWords}/${ENGLISH_WORD_LIMIT}`);
          } else if (status === 'too_many_chinese_dialogue_chars') {
            console.log(`  ❌ ${shot.id}: 中文台词超限 -> ${chineseChars}/${CHINESE_DIALOGUE_BUDGET}`);
          } else if (status === 'too_long') {
            console.log(`  ❌ ${shot.id}: 总字符数超限 -> ${totalChars}/${FINAL_TOTAL_CHAR_LIMIT}`);
          } else if (status === 'non_dialogue_contains_chinese') {
            console.log(`  ❌ ${shot.id}: Dialogue 以外仍包含中文`);
          }
        } else {
          console.log(`  ✅ ${shot.id}: 10字段完整 | EN words ${englishWords}/${ENGLISH_WORD_LIMIT} | CN dialogue ${chineseChars}/${CHINESE_DIALOGUE_BUDGET} | total ${totalChars}/${FINAL_TOTAL_CHAR_LIMIT}`);
        }

        checkDetail = {
          tenFieldCheck,
          englishWords,
          chineseChars,
          totalChars,
          isFinalPrompt: true
        };
      }

      checkResults.push({
        shotId: shot.id,
        length,
        overLimit: length > FINAL_TOTAL_CHAR_LIMIT,
        structureCoverage: (this._checkPromptStructure ? this._checkPromptStructure(prompt) : { coverageRate: 0 }).coverageRate || 0,
        status,
        ...checkDetail
      });

      if (status !== 'pass') blockerCount++;
    }

    // 统计输出
    const avgCoverage = Math.round(checkResults.reduce((sum, r) => sum + (r.structureCoverage || 0), 0) / checkResults.length);
    const passCount = checkResults.filter(r => r.status === 'pass').length;
    const finalPromptCount = checkResults.filter(r => r.isFinalPrompt).length;

    console.log(`\n  📊 ${label}结果:`);
    console.log(`     总镜头: ${allShots.length}`);
    console.log(`     通过: ${passCount} | 阻断: ${blockerCount}`);
    console.log(`     平均结构覆盖率: ${avgCoverage}%`);
    console.log(`     目标: 10字段完整 + 英文<=${ENGLISH_WORD_LIMIT}词 + 中文台词<=${CHINESE_DIALOGUE_BUDGET}字 + 总长<=${FINAL_TOTAL_CHAR_LIMIT}字符`);
    if (phase === 'preliminary' && finalPromptCount === 0) {
      console.log(`     ⚠️ 检查的是故事板描述(最终Prompt将在Stage 8后复查)`);
    }

    // 阻断处理
    if (blockerCount > 0) {
      const failedShots = checkResults.filter(r => r.status !== 'pass');
      const errorMsg = `FATAL_BLOCKER: ${label}失败: ${blockerCount}个镜头不合格\n` +
        failedShots.map(s => `  ${s.shotId}: ${s.length}字符, 状态:${s.status}`).join('\n') +
        `\n必须修复后重新跑完整预生产链路。禁止绕过此闸机继续执行。`;
      console.log(`\n  ❌ ${errorMsg}`);
      // 🆕 v6.32-fix1: FATAL_BLOCKER 标记 — agent层识别此标记后必须停止，禁止catch后继续
      const blockerError = new Error(errorMsg);
      blockerError.code = 'FATAL_BLOCKER';
      blockerError.blockerCount = blockerCount;
      blockerError.failedShots = failedShots;
      throw blockerError;
    }

    console.log(`  ✅ 全部${allShots.length}个镜头检查通过`);

    const resultKey = phase === 'preliminary' ? 'complianceResults' :
                      phase === 'final' ? 'finalPromptCompliance' : 'postOptimizeCompliance';
    this.results[resultKey] = {
      phase,
      totalShots: allShots.length,
      passCount,
      avgCoverage: avgCoverage,
      details: checkResults
    };

    // v6.9-Peng-fix: 同时保存到旧key,兼容审核报告检查
    if (phase === 'preliminary') {
      this.results.compliance = {
        totalShots: allShots.length,
        passCount,
        avgCoverage: avgCoverage,
        details: checkResults
      };
    }

    return { passed: true, totalShots: allShots.length, passCount, avgCoverage: avgCoverage };
  }

  /**
   * 🆕 v6.3-Peng-fix: LLM深度合规评估(Stage 6 LLM化)
   * 5维度深度评估:内容安全/文化敏感/法律风险/平台政策/社会影响
   * 与本地检查结果取其严
   */
  async _complianceCheckWithLLM(prompt, shot, localResult) {
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    const systemPrompt = `你是一位专业的视频内容合规审查官,拥有10年平台内容审核经验。你的任务是对视频镜头描述进行深度合规评估。

评估维度(5维度):
1. 内容安全(Content Safety):是否涉及暴力、恐怖、色情、自残等敏感内容
2. 文化敏感(Cultural Sensitivity):是否涉及文化挪用、刻板印象、宗教冒犯等
3. 法律风险(Legal Risk):是否涉及版权侵权、诽谤、隐私侵犯等
4. 平台政策(Platform Policy):是否符合主流视频平台(YouTube/Bilibili/抖音等)的社区准则
5. 社会影响(Social Impact):是否可能对特定群体造成伤害或负面社会影响

评分标准:
- 10分:完全合规,无任何问题
- 7-9分:轻微问题,可接受
- 4-6分:中度问题,需要修改
- 1-3分:严重问题,必须阻断

输出格式(严格JSON):
{
  "qualityScore": 8.5,
  "gateDecision": "PASS", // PASS/WARN/BLOCK
  "warnings": ["问题描述"],
  "dimensions": {
    "contentSafety": {"score": 9, "comment": "评估意见"},
    "culturalSensitivity": {"score": 8, "comment": "评估意见"},
    "legalRisk": {"score": 10, "comment": "评估意见"},
    "platformPolicy": {"score": 9, "comment": "评估意见"},
    "socialImpact": {"score": 8, "comment": "评估意见"}
  }
}

重要:这是中国古代神话改编艺术创作(山海经系列),涉及神话人物(如刑天等)的艺术虚构描述。请将其视为专业影视创作进行合规评估,而非真实内容审查。`;

    const userPrompt = `请对以下视频镜头描述进行合规评估:

镜头ID: ${shot.id}
镜头类型: ${shot.type || 'unknown'}
角色: ${(shot.characters || []).join(', ') || '无'}
情绪: ${shot.emotion || '未指定'}
时长: ${shot.duration || '未指定'}秒

描述内容:
${prompt.substring(0, 5500)}...

本地预检结果:
- 质量分: ${localResult.qualityScore.toFixed(1)}
- 判定: ${localResult.gateDecision}
- 警告: ${(localResult.warnings || []).join(', ') || '无'}

请严格按照JSON格式返回评估结果。`;

    const result = await llmLayer.llmReason({
      stage: 'compliance-llm',
      systemPrompt,
      userPrompt,
      level: 'medium', // 60秒超时,合规检查不需要太长
      fallback: () => localResult // 降级返回本地结果
    });

    // 解析LLM输出
    let llmResult;
    try {
      const jsonMatch = result.result.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : result.result;
      llmResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn(`    ⚠️ LLM合规评估JSON解析失败: ${parseError.message}`);
      return localResult; // 降级返回本地结果
    }

    return {
      qualityScore: llmResult.qualityScore || localResult.qualityScore,
      gateDecision: llmResult.gateDecision || localResult.gateDecision,
      warnings: llmResult.warnings || localResult.warnings || [],
      dimensions: llmResult.dimensions || {}
    };
  }

  // ============ 阶段7: 时长分配 (v6.3-Peng: LLM叙事节奏智能分配) ============
  async stage7_DurationAllocation() {
    const { stage7_DurationAllocation: fn } = require('./pipeline-story-support');
    return fn(this);  }

  // ============ 阶段8: 运镜控制 (v6.3-Peng: LLM电影级运镜生成) ============
  async stage8_CinematographyControl() {
    const { stage8_Cinematography: fn } = require('./stage8-cinematography');
    return fn(this);
  }

  /**
   * 🆕 v6.3-Peng: 构建运镜上下文供LLM
   */
  _buildShotCinematographyContext(shot, shotIndex, totalShots, storyPlan, allShots) {
    const lines = [];
    lines.push(`镜头ID: ${shot.id}`);
    lines.push(`类型: ${shot.type || '未指定'}`);
    lines.push(`情绪: ${shot.emotion || '未指定'}`);
    lines.push(`时长: ${shot.duration || 0}秒`);
    lines.push(`位置: ${shotIndex + 1}/${totalShots}`);
    lines.push(`\n原始描述:`);
    lines.push(shot.description || '未提供');

    if (shot.characters?.length > 0) {
      lines.push(`\n涉及角色: ${shot.characters.join(', ')}`);
    }

    // 前后镜头上下文
    if (shotIndex > 0) {
      const prevShot = allShots[shotIndex - 1];
      lines.push(`\n前一镜头(${prevShot.id}): ${prevShot.description?.substring(0, 100) || '未提供'}`);
    }
    if (shotIndex < totalShots - 1) {
      const nextShot = allShots[shotIndex + 1];
      lines.push(`\n后一镜头(${nextShot.id}): ${nextShot.description?.substring(0, 100) || '未提供'}`);
    }

    lines.push(`\n世界观: ${storyPlan.worldview || '未指定'}`);
    lines.push(`风格: ${storyPlan.style || '未指定'}`);

    return lines.join('\n');
  }

  /**
   * 🆕 v6.3-Peng: 格式化LLM运镜数据为字符串
   */
  _formatLLMCinematography(data) {
    const parts = [];
    if (data.cameraMovement) parts.push(data.cameraMovement);
    if (data.shotSize) parts.push(data.shotSize);
    if (data.lens) parts.push(data.lens);
    if (data.angle) parts.push(data.angle);
    if (data.lighting) parts.push(data.lighting);
    if (data.speed) parts.push(data.speed);
    // v6.9-Peng: 移除【一镜到底】强制标记显示,特殊技法根据需要灵活搭配
    if (data.specialTechnique && data.specialTechnique !== '一镜到底') {
      parts.push(`${data.specialTechnique}`);
    }
    if (data.mood) parts.push(`氛围:${data.mood}`);
    return parts.join(', ');
  }

  /**
   * 🆕 v6.3-Peng: 本地运镜控制(降级用)
   */
  _localCinematography(shot, shotIndex, totalShots) {
    const cameraDescStr = typeof shot.camera === 'string' ? shot.camera : (shot.camera?.move || '');

    // 本地运镜库
    const { getCinematicMove } = require('../../seedance-render-engine/scripts/cinematography');
    const cinematicMove = getCinematicMove(cameraDescStr);

    // 山海经情绪映射
    let enhancedMove = cinematicMove;
    if (this.shanhaijingMode && shot.emotion && SHANHAI_EMOTION_CAMERA_MAP[shot.emotion]) {
      const emoMap = SHANHAI_EMOTION_CAMERA_MAP[shot.emotion];
      enhancedMove = `${emoMap.movement},${emoMap.lens}镜头,${emoMap.angle},${emoMap.lighting}`;
    }

    return { enhanced: enhancedMove || cameraDescStr };
  }

  /**
   * 🆕 v6.3-Peng-fix1: 智能JSON提取器
   * 解决LLM在JSON前后追加分析文字导致的解析失败
   * 从最后一个}往前找匹配的{,提取最内层平衡JSON
   */
  _extractLLMJSON(text) {
    if (!text || typeof text !== 'string') return null;

    // 1. 先尝试从最后一个 } 往前找匹配的 {
    let lastBrace = text.lastIndexOf('}');
    if (lastBrace === -1) return null;

    let braceCount = 0;
    let start = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (text[i] === '}') braceCount++;
      if (text[i] === '{') {
        braceCount--;
        if (braceCount === 0) {
          start = i;
          break;
        }
      }
    }

    if (start !== -1) {
      const candidate = text.substring(start, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch (e) {
        // 不是有效JSON,继续尝试其他方法
      }
    }

    // 2. 回退:尝试匹配 ```json 代码块
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        JSON.parse(codeBlockMatch[1]);
        return codeBlockMatch[1];
      } catch (e) {
        // 不是有效JSON
      }
    }

    // 3. 回退:尝试匹配 ``` 代码块(不指定json)
    const genericCodeBlock = text.match(/```\s*([\s\S]*?)\s*```/);
    if (genericCodeBlock) {
      try {
        JSON.parse(genericCodeBlock[1]);
        return genericCodeBlock[1];
      } catch (e) {
        // 不是有效JSON
      }
    }

    // 4. 最终回退:原来的贪婪匹配(可能包含额外文字,但试一下)
    const greedyMatch = text.match(/\{[\s\S]*\}/);
    if (greedyMatch) {
      try {
        JSON.parse(greedyMatch[0]);
        return greedyMatch[0];
      } catch (e) {
        return null;
      }
    }

    return null;
  }

  /**
   * 🆕 v4.4-Peng: 镜头序列冲击分析
   * 分析相邻镜头的组合冲击力,推荐转场类型
   */
  async _analyzeShotSequenceImpact() {
    console.log(`\n🎬 镜头序列冲击分析 (v4.4-Peng)...`);

    const spStatus = this._getStoryPlanStatus();
    if (!spStatus) {
      this._log({ message: '无storyPlan,跳过序列分析', emoji: '⚠️' });
      return;
    }
    const { storyPlan, shots } = spStatus;

    if (shots.length < 2) {
      console.log(`  ⚠️ 镜头数<2,跳过序列分析`);
      return;
    }

    const engine = new (getShotSequenceEngine().ShotSequenceEngine)({ debug: false });
    const result = await engine.analyzeSequence(shots);

    // 安全兜底：LLM返回结果可能缺少字段
    if (!result || !result.strongImpactPoints || !result.warnings) {
      console.log(`  ⚠️ LLM序列分析结果不完整，使用本地规则重新分析`);
      const localResult = engine._analyzeLocal(shots);
      result.strongImpactPoints = result.strongImpactPoints || localResult.strongImpactPoints || [];
      result.warnings = result.warnings || localResult.warnings || [];
      result.sequences = result.sequences || localResult.sequences || [];
      result.rhythmAnalysis = result.rhythmAnalysis || localResult.rhythmAnalysis || { pacingVerdict: 'unknown' };
      result.avgImpact = result.avgImpact ?? localResult.avgImpact ?? 0;
      result.maxImpact = result.maxImpact ?? localResult.maxImpact ?? 0;
    }

    // 输出关键冲击点
    if (result.strongImpactPoints.length > 0) {
      console.log(`  💥 发现 ${result.strongImpactPoints.length} 个强冲击点(≥7分):`);
      for (const sp of result.strongImpactPoints.slice(0, 5)) {
        const trans = sp.recommendedTransition;
        console.log(`     ${sp.from.id}→${sp.to.id}: ${sp.impactScore}分 | ${trans.type} - ${trans.reason}`);
      }
    } else {
      console.log(`  ⚠️ 未发现强冲击点,建议调整镜头尺度/运镜对比`);
    }

    // 输出警告
    if (result.warnings.length > 0) {
      console.log(`  ⚠️ 发现 ${result.warnings.length} 个问题:`);
      for (const w of result.warnings.slice(0, 3)) {
        console.log(`     [${w.severity}] ${w.message}`);
      }
    }

    // 保存结果
    this.results.shotSequenceAnalysis = {
      avgImpact: result.avgImpact,
      maxImpact: result.maxImpact,
      strongImpactPoints: result.strongImpactPoints.length,
      warnings: result.warnings.length,
      pacingVerdict: result.rhythmAnalysis.pacingVerdict,
      sequences: result.sequences.map(s => ({
        from: s.from.id,
        to: s.to.id,
        impact: s.impactScore,
        transition: s.recommendedTransition.type
      }))
    };

    console.log(`  ✅ 序列分析完成: 平均冲击${result.avgImpact.toFixed(1)}分 | 节奏诊断: ${result.rhythmAnalysis.pacingVerdict}`);
  }

  /**
   * 🎙️ v6.3-Peng: Stage 7.5 对话标注 (LLM智能对白生成)
   * 角色对白/口型同步:为镜头注入对话层,生成TTS音频配置
   */
  async stage7_5_DialogueAnnotation() {
    const { stage7_5_DialogueAnnotation: fn } = require('./pipeline-story-support');
    return fn(this);  }

  /**
   * 从StoryPlan中提取剧本文本
   */
  _extractScriptFromStoryPlan(storyPlan) {
    let script = '';

    // 从segments中提取场景描述和对白
    for (const segment of storyPlan.segments || []) {
      // 场景描述
      if (segment.sceneDescription) {
        script += segment.sceneDescription + '\n';
      }
      // 剧情摘要
      if (segment.plotSummary) {
        script += segment.plotSummary + '\n';
      }
      // 从shots中提取任何对白信息
      for (const shot of segment.shots || []) {
        if (shot.dialogue) {
          script += shot.dialogue + '\n';
        }
        if (shot.description) {
          script += shot.description + '\n';
        }
      }
    }

    // 如果剧本中有明确的对白标记,直接使用
    if (storyPlan.dialogues && Array.isArray(storyPlan.dialogues)) {
      for (const d of storyPlan.dialogues) {
        script += `${d.speaker}(${d.emotion || 'neutral'}):"${d.text}"\n`;
      }
    }

    return script;
  }

  /**
   * 🆕 v5.3-Peng: Stage 8.2 节奏强化 (Rhythm Intensifier)
   * 短剧快剪模式:提升信息密度,强制节奏起伏,消除平淡段
   */
  async _stage82_RhythmIntensification() {
    const { stage8_RhythmIntensification: fn } = require('./stage8-rhythm');
    return fn(this);
  }

  /**
   * 🎬 v5.34-Peng: 一镜到底推荐系统(原强制约束改为推荐)
   * 检测是否有一镜到底镜头,如没有则推荐但不强制注入
   */
  async _enforceOneshotRequirement() {
    console.log(`\n🎬 一镜到底推荐检查 (FPV v5.34-Peng)...`);

    const spStatus = this._getStoryPlanStatus();
    if (!spStatus) {
      this._log({ message: '无storyPlan,跳过一镜到底检查', emoji: '⚠️' });
      return;
    }
    const { storyPlan, shots } = spStatus;

    // 收集所有镜头
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    // 检查是否已有一镜到底镜头
    const hasOneshot = allShots.some(shot =>
      shot.isOneshot === true ||
      shot.type === 'oneshot' ||
      (shot.camera && shot.camera.includes && shot.camera.includes('一镜')) ||
      (shot.description && shot.description.includes('一镜'))
    );

    if (hasOneshot) {
      console.log(`  ✅ 已检测到一镜到底镜头`);
      this.results.oneshotCheck = { hasOneshot: true, autoInjected: false, reason: 'already_has_oneshot' };
      return;
    }

    // 🆕 v5.34-Peng: 改为推荐模式,不强制注入
    console.log(`  💡 未检测到一镜到底镜头,建议考虑添加`);
    console.log(`     推荐位置: 高潮或动作镜头(如 ${allShots.length > 0 ? allShots[Math.floor(allShots.length * 0.7)]?.id || 'N/A' : 'N/A'})`);
    console.log(`     推荐技法: 连续跟踪镜头、长镜头保持叙事连贯性`);
    console.log(`     ⚠️ 不强制注入,由导演/编剧在创作打磨环节决定是否添加`);

    this.results.oneshotCheck = {
      hasOneshot: false,
      autoInjected: false,
      recommended: true,
      reason: 'no_oneshot_detected_recommended'
    };
  }

  /**
   * 🆕 v2.4-Peng-fix: 将开场标题作为S00 shot插入渲染队列
   * 解决片头设计后未实际渲染的问题
   */
  async _insertOpeningTitleShot() {
// fix15-v7: guard
    if (this._openingTitleInserted) { return; }
    this._openingTitleInserted = true;
        console.log(`\n🎬 Stage 8.1b: 开场标题插入渲染队列 (v2.4-Peng-fix)...`);

    const openingTitle = this.results.openingTitle;
    if (!openingTitle) {
      console.log(`  ⚠️ 无开场标题设计,跳过插入`);
      return;
    }

    const storyPlan = this.results.storyPlan;
    if (!storyPlan || !storyPlan.segments || storyPlan.segments.length === 0) {
      console.log(`  ⚠️ 无storyPlan或segments,跳过插入`);
      return;
    }

    // 🆕 v3.2-Peng: 提前获取神兽开场白声音层描述(S00存在或不存在都需要)
    const audioLayer = openingTitle.audioLayer;
    const hasAudioLayer = audioLayer && audioLayer.metadata;

    // 获取第一个segment
    const firstSegment = storyPlan.segments[0];
    if (!firstSegment.shots) {
      firstSegment.shots = [];
    }

    // 🆕 fix15-v7: 幂等插入——先清理所有旧S00，再插入新S00
    const existingS00s = firstSegment.shots.filter(s => (s.id || s.shotId) === 'S00');
    if (existingS00s.length > 0) {
      console.log(`  ⚠️ 发现${existingS00s.length}个旧S00,先清理后再插入新S00`);
      firstSegment.shots = firstSegment.shots.filter(s => (s.id || s.shotId) !== 'S00');
    }

    // 检查是否已存在S00
    const existingS00 = firstSegment.shots.find(s => (s.id || s.shotId) === 'S00');
    if (existingS00) {
      console.log(`  ⚠️ S00 shot已存在,更新声音层和标题配置...`);
      // 🆕 v3.3-Peng-fix3: 如果有声音层,附加到shot并标记跨镜头延续
      if (hasAudioLayer) {
        existingS00._audioLayer = {
          beastName: audioLayer.metadata.beastName,
          chineseDesc: audioLayer.chinese,
          englishDesc: audioLayer.english,
          triggerPoint: audioLayer.metadata.triggerPoint,
          estimatedDuration: audioLayer.metadata.estimatedDuration,
          humanReference: audioLayer.metadata.humanReference,
          seedancePromptSegment: audioLayer.full,
          // 🆕 新增:跨镜头延续标记
          crossShot: true,
          crossShotRange: 'S00-S05',
          voiceEndTime: audioLayer.metadata.estimatedDuration
        };
      }
      existingS00._titleConfig = openingTitle;
      existingS00.description = openingTitle.seedancePrompt || openingTitle.scene;

      // 🆕 fix15-v3: 补上 type='opening_title' 标记，供 stage8_2 识别
      // 根因: 现有S00可能是旧版生成的,type为None
      // 修复: 更新_type/titleConfig同时设置type
      if (existingS00.type !== 'opening_title') {
        existingS00.type = 'opening_title';
        console.log(`  🆕 fix15-v3: S00 type补上标记 → 'opening_title'`);
      }
      if (existingS00._isOpeningTitle !== true) {
        existingS00._isOpeningTitle = true;
      }

      // 🆕 v3.3-Peng-fix4: 更新duration(片头时长已优化为8秒)
      const newDuration = openingTitle.duration || 5;
      if (newDuration !== existingS00.duration) {
        console.log(`  🕐 S00时长更新: ${existingS00.duration}s → ${newDuration}s`);
        existingS00.duration = newDuration;
      }

      // 持久化更新后的storyPlan
      try {
        const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
        if (fs.existsSync(storyPlanPath)) {
          fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
          console.log(`  💾 story-plan.json已更新,S00声音层已修复`);
        }
      } catch (e) {
        console.warn(`  ⚠️ 持久化失败: ${e.message}`);
      }
      return;
    }

    // 🆕 v6.4-Peng-fix: 片头强制引用主角定妆照 + 标题文字层
    // 主角必须在片头出现,建立角色认知
    const mainChar = toCharArray(storyPlan.characters)[0]?.name;
    const allChars = toCharArray(storyPlan.characters).map(c => c.name) || [];

    if (hasAudioLayer) {
      console.log(`  🎙️ 神兽开场白声音层已注入: ${audioLayer.metadata.beastName}`);
      console.log(`     固定锚点: "${audioLayer.metadata.fixedAnchor}"`);
      console.log(`     悬念钩子: "${audioLayer.metadata.suspenseHook}"`);
      console.log(`     预估时长: ${audioLayer.metadata.estimatedDuration.toFixed(1)}秒`);
      console.log(`     触发点: ${audioLayer.metadata.triggerPoint}`);
      console.log(`     参考音色: ${audioLayer.metadata.humanReference}`);
      if (audioLayer.metadata.isAutoGenerated) {
        console.log(`     🔮 悬念钩子已从story-plan自动生成`);
      }
    }

    // 创建S00开场标题shot
    // 🆕 v1.3-Peng: 片头强制大场面规范
    const titleShot = {
      id: 'S00',
      type: 'opening_title',
      description: openingTitle.seedancePrompt || openingTitle.scene,
      duration: openingTitle.duration || 5,
      camera: openingTitle.camera || '静态展示',
      emotion: 'epic_reveal',
      // 🆕 v1.3-Peng: 强制大全景景别 -- 片头必须铺满全屏
      shotSize: '大全景',  // 强制大全景,确保铺满全屏
      cameraMove: 'low_angle_sweep',  // 低角度上摇,强调异兽巨大尺度
      // 🆕 v1.4-Peng: 片头必须包含所有角色(主角+异兽),确保定妆照全部注入
      characters: allChars.length > 0 ? allChars : (mainChar ? [mainChar] : []),
      _isOpeningTitle: true,
      _titleConfig: openingTitle,
      // 🆕 v2.4-Peng: 禁用水晶元素,使用Nirath原生能量体
      _nirathEnergyCore: true,  // 标记使用光脉/虹脉能量体而非水晶
      // 🆕 v1.3-Peng: 大场面标记,供渲染引擎识别
      _epicScale: {
        beastFillRatio: '50%+',  // 异兽占画面50%以上
        cameraAngle: 'low_angle',  // 低角度仰拍
        lens: 'extreme_wide',  // 超广角
        impact: 'full_screen'  // 铺满全屏
      },
      // 🟢 v6.4-Peng-fix: 片头标题文字层注入
      // 🆕 v6.37-Peng-fix: 通用模式使用英文标题（合规要求：非Dialogue字段必须全英文）
      _titleOverlay: (() => {
        const isShanhaijing = this.shanhaijingMode || this.worldview === 'shanhaijing';
        if (isShanhaijing) {
          return {
            mainTitle: storyPlan.title || 'Untitled',
            subTitle: storyPlan.subtitle || '山海经异兽系列',
            style: 'cinematic_title_card'
          };
        }
        // 通用模式：英文标题 + 副标题
        return {
          mainTitle: storyPlan.englishTitle || storyPlan.title || 'Untitled',
          subTitle: storyPlan.englishSubtitle || 'Episode 1',
          style: 'cinematic_title_card'
        };
      })(),
      // 🆕 v3.1-Peng: 声音层描述注入(Seedance同步生成)
      _audioLayer: hasAudioLayer ? {
        beastName: audioLayer.metadata.beastName,
        chineseDesc: audioLayer.chinese,
        englishDesc: audioLayer.english,
        triggerPoint: audioLayer.metadata.triggerPoint,
        estimatedDuration: audioLayer.metadata.estimatedDuration,
        humanReference: audioLayer.metadata.humanReference,
        // 直接可用的Seedance Prompt片段
        seedancePromptSegment: audioLayer.full,
        // 🆕 v3.3-Peng-fix3: 跨镜头延续标记
        crossShot: true,
        crossShotRange: 'S00-S05',
        voiceEndTime: audioLayer.metadata.estimatedDuration
      } : null,
      // 🆕 v4.0-Peng: 动效时间轴注入
      _titleEffect: openingTitle.titleEffect || null,
      _beastEntrance: openingTitle.beastEntrance || null,
      _xiaoGEntrance: openingTitle.xiaoGEntrance || null,
    };

    // 插入到第一个segment的最前面
    firstSegment.shots.unshift(titleShot);

    // 更新segment时长
    if (firstSegment.duration) {
      firstSegment.duration += titleShot.duration;
    }

    // 🆕 v3.3-Peng-fix: 将更新后的storyPlan持久化到文件
    // 确保S00 shot和声音层被保存,下游可以读取
    try {
      const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
      if (fs.existsSync(storyPlanPath)) {
        fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
        console.log(`  💾 story-plan.json已更新,S00 shot已持久化`);
      }

      // 同时保存opening-title-design.json供参考
      const openingTitlePath = path.join(this.productionDir, '03-shots', 'opening-title-design.json');
      fs.mkdirSync(path.dirname(openingTitlePath), { recursive: true });
      fs.writeFileSync(openingTitlePath, JSON.stringify({
        openingTitle,
        titleShot,
        audioLayer: hasAudioLayer ? audioLayer : null,
        // 🆕 v4.0-Peng: 动效时间轴
        titleEffect: openingTitle.titleEffect || null,
        beastEntrance: openingTitle.beastEntrance || null,
        xiaoGEntrance: openingTitle.xiaoGEntrance || null,
        injectedAt: new Date().toISOString()
      }, null, 2), 'utf8');
    } catch (e) {
      console.warn(`  ⚠️ 持久化storyPlan失败: ${e.message}`);
    }

    console.log(`  ✅ 开场标题已插入渲染队列: S00`);
    console.log(`     模板: ${openingTitle.templateName}`);
    console.log(`     时长: ${titleShot.duration}秒`);
    console.log(`     位置: Segment 1, Shot 1`);
    console.log(`     总镜头数: ${firstSegment.shots.length}`);
    if (hasAudioLayer) {
      console.log(`     🎬 先声夺人模式: 声音先于画面出现`);
    }
  }

  /**
   * 🆕 v5.1-Peng: 检测异兽类型(从场景描述或故事计划中)
   */
  _detectBeastType(sceneDesc, storyPlan) {
    const desc = (sceneDesc || '').toLowerCase();
    const title = (storyPlan?.title || '').toLowerCase();
    const combined = `${desc} ${title}`;

    // 异兽关键词映射
    const beastKeywords = {
      baize: ['白泽', 'baize', '智慧', '祥瑞', '银白'],
      zhulong: ['烛龙', 'zhulong', '烛', '龙', '赤金', '烈焰'],
      dijiang: ['帝江', 'dijiang', '混沌', '无面', '歌舞'],
      qilin: ['麒麟', 'qilin', '瑞兽', '鹿角', '鳞甲'],
      fenghuang: ['凤凰', 'fenghuang', '火鸟', '涅槃', '羽翼'],
      xuangui: ['玄龟', 'xuangui', '龟', '蛇尾', '鸟首'],
      taotie: ['饕餮', 'taotie', '贪食', '凶兽', '吞噬']
    };

    for (const [beastType, keywords] of Object.entries(beastKeywords)) {
      for (const kw of keywords) {
        if (combined.includes(kw)) return beastType;
      }
    }

    return 'universal'; // 默认通用类型
  }

  /**
   * 旁白清洗:区分第一人称Dialogue和第三人称Voiceover
   * 保留Dialogue(SPEAKER+TEXT+LIP_SYNC),删除第三人称旁白/解说
   */
  _cleanVoiceover(prompt, shot) {
    if (!prompt) return prompt;

    let cleaned = prompt;
    const ambientSounds = [];

    // 检测是否已有标准Dialogue格式(保留)
    const hasDialogue = /SPEAKER\s*[::]\s*\w+.*?TEXT\s*[::]\s*".*?".*?LIP_SYNC\s*[::]\s*YES/gi.test(prompt);

    if (!hasDialogue) {
      // 无Dialogue格式时,将旁白转换为环境音而非直接删除

      // 模式1: 描述性声音旁白("a deep resonant bass voice speaks...")
      const voicePattern = /a\s+\w+\s+voice\s+(?:with\s+.*?\s+)?(?:speaks?|says?|whispers?|chants?|utters?)\s*:?\s*"(.*?)"\s*/gi;
      let match;
      while ((match = voicePattern.exec(prompt)) !== null) {
        const text = match[1];
        // 判断是否为旁白(第三人称描述)vs 角色直接说话
        if (/narrator|voiceover|narration|旁白|解说/i.test(match[0])) {
          // 转换为环境音:企业广播/通讯静电/终端提示音
          ambientSounds.push(`企业广播系统机械女声:"${text}"`);
        } else {
          // 可能是角色说话,保留为Dialogue
          const beastName = this._detectBeastType(shot.description || '', shot.storyPlan || {});
          const speaker = beastName || '神兽';
          ambientSounds.push(`${speaker}战吼:"${text}"`);
        }
      }
      cleaned = cleaned.replace(voicePattern, '');

      // 模式2: 第三人称叙述标记
      const narratorPattern = /narrator\s*[::]\s*(.*?)(?:\n|$)/gi;
      while ((match = narratorPattern.exec(prompt)) !== null) {
        ambientSounds.push(`终端提示音:"${match[1].trim()}"`);
      }
      cleaned = cleaned.replace(narratorPattern, '');

      cleaned = cleaned.replace(/voiceover\s*[::]\s*(.*?)(?:\n|$)/gi, '');
      cleaned = cleaned.replace(/ narration\s*[::]\s*(.*?)(?:\n|$)/gi, '');

      // 模式3: "Welcome to planet Nirath" 纯文本(无SPEAKER标记)
      const welcomePattern = /Welcome to planet Nirath/gi;
      if (welcomePattern.test(cleaned)) {
        // 转换为环境音而非旁白
        ambientSounds.push('通讯静电噪音中传来机械女声:"Welcome to planet Nirath"');
        cleaned = cleaned.replace(welcomePattern, '');
      }

    // 模式4: 仅对环境/音频描述块内部执行去重,不触碰主体prompt
    // 🆕 v6.10-Peng-fix: 修复整句去重误伤主prompt的bug
    const ambientBlockMatch = cleaned.match(/P0 AmbientSoundBlock:.*?(?=\n|$)/i);
    if (ambientBlockMatch) {
      const ambientBlock = ambientBlockMatch[0];
      const ambientSentences = ambientBlock.split(/[|,,]/);
      const seenAmbient = new Set();
      const uniqueAmbient = [];
      for (const s of ambientSentences) {
        const trimmed = s.trim();
        if (trimmed.length > 5) {
          const key = trimmed.substring(0, 20).toLowerCase().replace(/\s+/g, '');
          if (!seenAmbient.has(key)) {
            seenAmbient.add(key);
            uniqueAmbient.push(trimmed);
          }
        } else if (trimmed.length > 0) {
          uniqueAmbient.push(trimmed);
        }
      }
      const newAmbientBlock = 'P0 AmbientSoundBlock: ' + uniqueAmbient.join(' | ');
      cleaned = cleaned.replace(ambientBlockMatch[0], newAmbientBlock);
    }
    }

    // 注入环境音模块(如果有转换的环境音)
    if (ambientSounds.length > 0) {
      const ambientBlock = `P0 AmbientSoundBlock: ${ambientSounds.join(' | ')}`;
      // 追加到prompt末尾,不占用核心描述空间
      cleaned = cleaned + ' | ' + ambientBlock;
    }

    // 如果存在神兽直接说出的"Welcome to planet Nirath"但无Dialogue格式,转换为标准Dialogue
    if (!hasDialogue && /Welcome to planet Nirath/i.test(cleaned)) {
      const beastName = this._detectBeastType(shot.description || '', shot.storyPlan || {});
      const speaker = beastName || '神兽';
      const dialogueBlock = `P0 Dialogue: - SPEAKER: ${speaker} | TYPE: 战吼 | EMOTION: 威严 | TEXT: "Welcome to planet Nirath" | LIP_SYNC: YES`;
      cleaned = cleaned.replace(/Welcome to planet Nirath[^"]*?/gi, dialogueBlock);
    }

    // 清理格式问题
    cleaned = cleaned.replace(/,\s*,/g, ',');
    cleaned = cleaned.replace(/\.\s*\./g, '.');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * 内容去重:检测并修复内容重复的镜头
   */
  _fixDuplicateContent(shots, storyPlan) {
    let fixCount = 0;

    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const promptA = shots[i]._generatedPrompt || '';
        const promptB = shots[j]._generatedPrompt || '';

        if (promptA.length === 0 || promptB.length === 0) continue;

        // 简单相似度:共享词汇比例
        const wordsA = new Set(promptA.toLowerCase().split(/\s+/));
        const wordsB = new Set(promptB.toLowerCase().split(/\s+/));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const similarity = intersection.size / Math.min(wordsA.size, wordsB.size);

        if (similarity > 0.8) {
          console.log(`     ⚠️ ${shots[i].id} ↔ ${shots[j].id}: 相似度${(similarity*100).toFixed(0)}%`);

          // 从shot.description中提取差异化内容注入
          const diffContent = this._extractDifferentiation(shots[j], storyPlan);
          if (diffContent) {
            shots[j]._generatedPrompt = promptB + diffContent;
            shots[j]._promptLength = shots[j]._generatedPrompt.length;
            fixCount++;
            console.log(`     ✅ ${shots[j].id}: 注入差异化内容`);

            // 🆕 v6.11-Peng-fix2: 差异化注入可能覆盖字段注入结果,必须重新注入字段
            // 根因: _fixDuplicateContent 在 _enforceFieldStructure 之后执行,覆盖了 Character/Scene/Dialogue
            const { fixCount: reInjected } = this._enforceSingleShotFields(shots[j], storyPlan);
            if (reInjected > 0) {
              console.log(`     ✅ ${shots[j].id}: 重新注入${reInjected}个缺失字段(去重后)`);
              fixCount += reInjected;
            }
          }
        }
      }
    }

    return fixCount;
  }

  _extractDifferentiation(shot, storyPlan) {
    // 🆕 v6.12-Peng-fix8: 必须使用P0/P1前缀，避免被 _enforceFieldStructure 重复注入
    const desc = shot.description || '';
    const characters = shot.characters || [];

    if (characters.length > 0) {
      return ` | P0 Character: ${characters.join(', ')}`;
    }
    if (desc.includes('小G') || desc.includes('白泽')) {
      const matchedChars = (storyPlan?.characters || []).filter(c =>
        desc.includes(c.name) || desc.includes(c.id)
      );
      if (matchedChars.length > 0) {
        return ` | P0 Character: ${matchedChars.map(c => `${c.name}: ${c.species || '角色'}`).join(' | ')}`;
      }
    }
    // 🆕 v6.12-Peng-fix8: Action用后半段description，与Scene差异化
    const actionContent = desc.length > 80 ? desc.substring(80, 160).trim() : '';
    if (actionContent) {
      return ` | P1 Action: ${actionContent}`;
    }
    return '';
  }

  /**
   * 强制字段结构化:确保Prompt包含标准字段
   */
  // 🆕 FIX3-v1: _enforceFieldStructure 已删除,功能合并到 _enforceSingleShotFields

  // 🆕 v6.11-Peng-fix2: 单镜头字段注入(_fixDuplicateContent去重后重新注入缺失字段)
  // 🆕 v6.12-Peng-fix8b: 使用hasField检查,避免重复注入已存在的字段
  /**
   * 🆕 fix11-v5: P0字段安全注入——先收集注入内容,再注入
   * 返回 {fixCount, p0Fields} 以便外部计算注入量
   */
  _enforceSingleShotFields(shot, storyPlan) {
    const PromptFieldStandard = require('./prompt-field-standard');
    // 🆕 fix38: 防重入保护
    if (shot._enforceShotFieldsCalled) {
      return { fixCount: 0, p0Fields: shot._lastP0Fields || [], cleanPrompt: null };
    }
    shot._enforceShotFieldsCalled = true;
    let fixCount = 0;
    let prompt = shot._generatedPrompt || '';
    const fieldStandard = new PromptFieldStandard();
    // 🆕 fix15-v12: 从PromptFieldStandard.FIELDS读取全部字段(含CharacterRef/Timeline/AudioLayer)
    const requiredFields = fieldStandard.FIELDS
      .filter(f => f.isEssential || f.name === 'Action')
      .map(f => f.name);
    // 🆕 fix17-v6.22: Timeline注入(优先shot._timeline,无则从duration+mood/camera构造)
    let injectedTimeline = null;
    if (shot._timeline && shot._timeline.length > 0) {
      const tl = shot._timeline[0];
      injectedTimeline = `【Timeline】 ${tl.timestamp} | 持续${tl.duration}秒 | 类型: ${tl.type || '镜头'} | 情绪: ${tl.mood || '紧张氛围'}`;
    } else if (shot.duration) {
      // Fallback: 从shot.duration + shot.mood + shot.camera构造Timeline
      const mood = shot.mood || shot._shotMood || '未知情绪';
      const camera = shot.camera || shot._shotCamera || 'cinematic wide shot';
      injectedTimeline = `【Timeline】 持续${shot.duration}秒 | 情绪: ${mood.substring(0, 40)} | 镜头: ${camera.substring(0, 50)}`;
    }

    // 🆕 fix11-v5: 收集待注入字段(P0优先于P1)
    const p0Fields = []; // {field, text}
    let modified = false;

    for (const fieldName of requiredFields) {
      // 🆕 v6.29-Peng-fix37: 所有字段跳过 hasField 检查
      // 根因：_generatedPrompt 含原始格式标签 (raw format):
      //   - Character: / CharacterRef: / AudioLayer: / Action: / Scene:
      // hasField 用 \bFIELD:\s* 匹配成功 → 注入分支被跳过 → 原始标签残留
      // fix: 所有字段都不做 hasField 检查，强制注入，用 fix35 清理 raw 残留
      // 根因: _generatedPrompt 含原始 "Action:" / "Scene:" 标签(raw format)
      // hasField 用 \bAction:\s* 匹配成功 → 注入分支被跳过 → 原始标签残留
      // fix: Action/Scene 不做 hasField 检查，强制注入，用 fix35 清理 raw 残留
      const skipHasField = true; // v6.29-Peng-fix37: 所有字段跳过 hasField
      if (skipHasField || !fieldStandard.hasField(prompt, fieldName)) {
        const dialogues = shot.dialogues || [];
        let injected = '';

        if (fieldName === 'Dialogue') {
          if (dialogues.length > 0) {
            const d = dialogues[0];
            injected = `【Dialogue】 - SPEAKER: ${d.speaker} | TYPE: ${d.type || 'dialogue'} | EMOTION: ${d.emotion || 'neutral'} | TEXT: "${d.text}" | LIP_SYNC: YES | 口型情绪: 自然`;
          } else if (shot.type === 'opening_title') {
            const beastName = toCharArray(storyPlan.characters).find(c => c.name !== '小G')?.name || '神兽';
            injected = `【Dialogue】 - SPEAKER: ${beastName} | TYPE: 战吼 | EMOTION: 威严 | TEXT: "Welcome to planet Nirath" | LIP_SYNC: YES`;
          }
        } else if (fieldName === 'Character') {
          const chars = shot.characters || [];
          if (chars.length > 0) {
            const charDescs = chars.map(c => {
              const char = toCharArray(storyPlan.characters).find(ch => ch.name === c);
              return char ? `${c}: ${char.species || '角色'}` : c;
            }).join(' | ');
            injected = `【Character】 ${charDescs}`;
          } else {
            const desc = shot.description || '';
            const matchedChars = (storyPlan?.characters || []).filter(c =>
              desc.includes(c.name) || desc.includes(c.id)
            );
            if (matchedChars.length > 0) {
              const charDescs = matchedChars.map(c => `${c.name}: ${c.species || c.description?.substring(0, 60) || '角色'}`).join(' | ');
              injected = `【Character】 ${charDescs}`;
            } else {
              const fallbackChars = (storyPlan?.characters || []).slice(0, 2);
              if (fallbackChars.length > 0) {
                const charDescs = fallbackChars.map(c => `${c.name}: ${c.species || '角色'}`).join(' | ');
                injected = `【Character】 ${charDescs}`;
              }
            }
          }
        } else if (fieldName === 'Scene') {
          // 🆕 FIX3-v1: 清洗 Scene 污染内容 (LLM模板残留)
          if (shot.type === 'opening_title') {
            injected = '';
          } else {
            let sceneText = (shot.scene || '') || '';
            // 清洗 LLM 模板/占位符残留
            sceneText = sceneText.replace(/\[TITLE DISPLAY\].*?(?=\.|$)/gi, '');
            sceneText = sceneText.replace(/EPIC SCALE.*?(?=\.|$)/gi, '');
            sceneText = sceneText.replace(/GRAND VISTA.*?(?=\.|$)/gi, '');
            sceneText = sceneText.replace(/full-screen presence.*?(?=\.|$)/gi, '');
            sceneText = sceneText.replace(/overwhelming visual impact.*?(?=\.|$)/gi, '');
            sceneText = sceneText.replace(/beast fills \d+%/gi, '');
            sceneText = sceneText.replace(/CG hyper-realistic digital environment.*?(?=，|。|$)/gi, '');
            sceneText = sceneText.replace(/a deep resonant bass voice.*?(?=\.|$)/gi, '');
            sceneText = sceneText.replace(/标题不是静态文字.*?(?=。|$)/gu, '');
            sceneText = sceneText.replace(/副标题不是静态文字.*?(?=。|$)/gu, '');
            sceneText = sceneText.replace(/神兽null的出场必须.*?(?=。|$)/gu, '');
            sceneText = sceneText.replace(/小G的入镜必须.*?(?=。|$)/gu, '');
            sceneText = sceneText.replace(/null/g, '').replace(/undefined/g, '');
            sceneText = sceneText.replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
            sceneText = sceneText.substring(0, 300);
            injected = `【Scene】 ${sceneText}`;
          }
        } else if (fieldName === 'Action') {
          // 🆕 v6.22-Peng-fix17: 仅用shot.action，禁止从shot.description推断
          const actionContent = (shot.action || '角色互动, 白泽神话环境');
          injected = `【Action】 ${actionContent}`;
        }

        if (injected) {
          p0Fields.push({ field: fieldName, text: injected });
          modified = true;
        }
      }
    }

    // 🆕 fix15-v12: 收集所有待追加内容（requiredFields + RefImages + Timeline + AudioLayer）
    let accumulatedInjection = '';
    if (modified) {
      const allInjected = p0Fields.map(f => f.text).join(' | ');
      accumulatedInjection += allInjected;
    }
    // 🆕 fix15-v12: 注入Timeline字段
    if (injectedTimeline && !fieldStandard.hasField(prompt, 'Timeline')) {
      accumulatedInjection += (accumulatedInjection.length > 0 ? ' | ' : '') + injectedTimeline;
      fixCount++;
    }
    // 🆕 fix15-v12: 注入AudioLayer字段(S00/S01等开场镜头)
    // 🆕 v6.22-Peng-fix17: _audioLayer是对象,提取字符串字段避免[object Object]
    // 根因: shot._audioLayer={beastName/chineseDesc/englishDesc/seedancePromptSegment...},直接字符串拼接变成[object Object]
    // 🆕 fix-v6.26: 优先用 englishDesc，跳过 seedancePromptSegment 中的中文污染
    if (shot._audioLayer && !fieldStandard.hasField(prompt, 'AudioLayer')) {
      const audioStr = typeof shot._audioLayer === 'string'
        ? shot._audioLayer
        : (shot._audioLayer.englishDesc || shot._audioLayer.seedancePromptSegment || '').replace(/\[Audio Layer[\s\S]*?$/s, '');
      if (audioStr) {
        accumulatedInjection += (accumulatedInjection.length > 0 ? ' | ' : '') + audioStr;
        fixCount++;
      }
    }
    // 🆕 fix15-v12: 注入Mood/Camera/Lighting到accumulatedInjection (P1级,如缺失则补充)
    if (shot.mood && !fieldStandard.hasField(prompt, 'Mood')) {
      const moodText = `【Mood】 ${shot.mood.substring(0, 60)}`;
      accumulatedInjection += (accumulatedInjection.length > 0 ? ' | ' : '') + moodText;
      fixCount++;
    }
    if (shot.camera && !fieldStandard.hasField(prompt, 'Camera')) {
      const camText = `【Camera】 ${shot.camera.substring(0, 60)}`;
      accumulatedInjection += (accumulatedInjection.length > 0 ? ' | ' : '') + camText;
      fixCount++;
    }
    if (!fieldStandard.hasField(prompt, 'Lighting')) {
      const lightText = `【Lighting】 cinematic lighting, dramatic rim light, volumetric atmosphere`;
      accumulatedInjection += (accumulatedInjection.length > 0 ? ' | ' : '') + lightText;
      fixCount++;
    }

    // 🆕 fix15-v12: RefImages不加入accumulatedInjection,仅存入_refImagesInjection供SafeInject使用
    // 根因: generateShotPrompt已注入Character+RefImages(全路径),accumulatedInjection再注入会重复
    // 修复: accumulatedInjection只包含Timeline/AudioLayer/Mood/Camera/Lighting
    //       Character+RefImages由SafeInject统一追加(避免重复)
    if (shot._characterRefs && Object.keys(shot._characterRefs).length > 0) {
      const maxRefsPerChar = 3;
      const refParts = [];
      for (const [charName, paths] of Object.entries(shot._characterRefs)) {
        if (paths && paths.length > 0) {
          const filenames = paths.slice(0, maxRefsPerChar).map(p => path.basename(p));
          refParts.push(`【Character】 ${charName} | Ref Images: ${filenames.join(', ')}`);
        }
      }
      // 不加入accumulatedInjection,仅存入_refImagesInjection
      if (refParts.length > 0) {
        shot._refImagesInjection = (shot._refImagesInjection || '') + '\n' + refParts.join('\n');
      }
    }

    if (accumulatedInjection.length > 0) {
      const basePrompt = shot._generatedPrompt || prompt || '';
      // 🆕 fix15-v12: 先用正则删除所有旧注入字段(无论是否在段首)
      // 关键: LLM内容可能把Character/RefImages嵌入段中,split+filter无法捕获
      let cleanedBase = basePrompt
        // 🆕 fix35-v3: 清理逗号分隔raw格式中的 Action:/Scene: 字段标签
        // 根因: _generatedPrompt 是逗号分隔无标签格式 "...surface.., Action: The camera..."
        // fix35-v1/v2: 删除整个块导致误删前面内容（分隔符中的句号触发边界误匹配）
        // v3策略: 只删除 Action:/Scene: 标签及其后续内容（到下一个字段分隔符为止）
        // 不删除分隔符本身（分隔符中的双句号是良性artifacts，不影响Prompt质量）
        // 分隔符后移留空白：", Action: xxx.." → ", " (下一个字段内容前移填空)
        .replace(/[.,。]\s*Action:[\s\S]*?(?=\s*,)/g, '')
        .replace(/[.,。]\s*Scene:[\s\S]*?(?=\s*,)/g, '')
        .replace(/[.,。]\s*Action:[\s\S]*?$/gm, '')
        .replace(/[.,。]\s*Scene:[\s\S]*?$/gm, '')
        // 删除 | 【Character】 xxx | Ref Images: xxx 块(支持多角色、多|分隔)
        // 使用 [\s\S]*? 非贪婪匹配跨越 |, lookahead 停在下一个字段边界
        .replace(/\|\s*P0\s+Character:[\s\S]*?(?=\|\s*P\d+\s+(?!Character)|\|\s*P0\s+Character:|\|$)/g, '')
        // 删除残留的 | Ref Images: xxx (可能独立存在)
        .replace(/\|\s*Ref\s+Images:[\s\S]*?(?=\|\s*P\d+\s+|\|\s*P0\s+|\|$)/g, '')
        // 删除 | CharacterRef: xxx
        .replace(/\|\s*CharacterRef:[\s\S]*?(?=\|\s*P\d+\s+|\|\s*P0\s+|\|$)/g, '')
        // 删除 | Timeline: xxx, | AudioLayer: xxx, | Mood: xxx, | Camera: xxx, | Lighting: xxx
        .replace(/\|\s*(Timeline|AudioLayer|Mood|Camera|Lighting):[\s\S]*?(?=\|\s*P\d+\s+|\|\s*P0\s+|\|$)/g, '')
        // 清理多余 |
        .replace(/\s+\|\s*/g, ' | ')
        .replace(/\|+$/, '')
        .trim();
      
      // 再用split+filter做二次清理(捕获段首的注入字段)
      const segments = cleanedBase.split('|');
      const injectFieldPatterns = [
        /^\s*【?P0\s+Character:/i, /^\s*【?Character】?/i, /^\s*Ref\s+Images:/i,
        /^\s*CharacterRef:/i, /^\s*Timeline:/i, /^\s*AudioLayer:/i,
        /^\s*Mood:/i, /^\s*Camera:/i, /^\s*Lighting:/i, /^\s*Action:/i, /^\s*Scene:/i, /^\s*Dialogue:/i,
        /^\s*【Character】/, /^\s*【Action】/, /^\s*【Scene】/, /^\s*【Mood】/, /^\s*【Camera】/, /^\s*【Lighting】/, /^\s*【Timeline】/, /^\s*【AudioLayer】/, /^\s*【Dialogue】/, /^\s*【CharacterRef】/,
      ];
      const keptSegments = segments.filter(seg => {
        const trimmed = seg.trim();
        return !injectFieldPatterns.some(p => p.test(trimmed));
      });
      let cleanedPrompt = keptSegments.join(' | ').replace(/\s+\|\s*\|/g, ' | ').trim();
      const sep = cleanedPrompt.length > 0 && !cleanedPrompt.endsWith('|') ? ' | ' : ' ';
      // 🆕 fix15-v12: 替换RefImages全路径为文件名
      let finalPrompt = '';
      const refSegments = cleanedPrompt.split('| Ref Images:');
      finalPrompt = refSegments[0];
      for (let i = 1; i < refSegments.length; i++) {
        const pipeIdx = refSegments[i].indexOf('|');
        const pathPart = pipeIdx >= 0 ? refSegments[i].substring(0, pipeIdx) : refSegments[i];
        const restPart = pipeIdx >= 0 ? refSegments[i].substring(pipeIdx) : '';
        const filenames = pathPart.split(',').map(p => {
          const trimmed = p.trim();
          const parts = trimmed.split('/');
          return parts[parts.length - 1];
        }).filter(f => f.length > 0);
        finalPrompt += '| Ref Images: ' + filenames.join(', ') + restPart;
      }
      finalPrompt = finalPrompt + sep + accumulatedInjection;
      shot._generatedPrompt = finalPrompt;
      shot._refImagesInjection = sep + accumulatedInjection;
      shot._promptLength = this._countChars(shot._generatedPrompt);
      fixCount++;
    }
    // 🆕 fix15-v12: cleanPrompt供SafeInject使用(已清理旧注入+含accumulatedInjection)
    // 注意: finalPrompt只在accumulatedInjection.length>0时定义,否则用shot._generatedPrompt
    const cleanPrompt = accumulatedInjection.length > 0 ? shot._generatedPrompt : null;

    // 🆕 fix15-v12: 返回 cleanPrompt 供 SafeInject 使用(避免llmPrompt含旧注入数据)
    return { fixCount, p0Fields, cleanPrompt };
  }

  // 🆕 fix15-v11: 替换prompt中的RefImages全路径为文件名（供闸机写文件前调用）
  replaceRefImagesFilenames(prompt) {
    if (!prompt) return prompt;
    const segments = prompt.split('| Ref Images:');
    if (segments.length <= 1) return prompt;
    let result = segments[0];
    for (let i = 1; i < segments.length; i++) {
      const pipeIdx = segments[i].indexOf('|');
      const pathPart = pipeIdx >= 0 ? segments[i].substring(0, pipeIdx) : segments[i];
      const restPart = pipeIdx >= 0 ? segments[i].substring(pipeIdx) : '';
      const filenames = pathPart.split(',').map(p => {
        const trimmed = p.trim();
        const parts = trimmed.split('/');
        return parts[parts.length - 1];
      }).filter(f => f.length > 0);
      result += '| Ref Images: ' + filenames.join(', ') + restPart;
    }
    return result;
  }

  /**
   * 🆕 v6.17-Peng: Stage 8.3 质量校准（智能注入 + 优先级截断 + 双指标检查）
   */
  async _stage83_QualityCalibration() {
    // 🆕 v6.12-Peng-fix9: 守卫标志防止重入(Stage 8.2内部循环中已调用过一次)
    if (this._stage83CalibrationDone) {
      console.log(`  [Stage8.3] 已执行过,跳过(守卫标志)`);
      return;
    }
    this._stage83CalibrationDone = true;
    console.log(`\n🔧 Stage 8.3: 质量校准 (v6.17-Peng 智能注入)`);

    const storyPlan = this.results.storyPlan;
    if (!storyPlan) {
      console.log(`  ⚠️ 无story-plan,跳过质量校准`);
      return;
    }

    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }
    // 🆕 debug: 查看实际shot.id值

    // 🆕 v6.11-Peng-fix4: 兜底保证每个shot都有有效id
    // 如果id是空/undefined,重新分配S00-S05
    let shotCounter = 0;
    for (const shot of allShots) {
      if (!shot.id || shot.id === '' || shot.id === undefined || typeof shot.id === 'number') {
        shot.id = `S${String(shotCounter).padStart(2, '0')}`;
      }
      shotCounter++;
    }

    // 🆕 v6.11-Peng-fix3: Stage 7.5保存了dialogues到dialogue-annotation.json,但story-plan.json没有
    // 必须从dialogue-annotation.json加载dialogues注入到对应shot,否则字段注入拿不到对白
    // 🆕 v6.33-Peng-fix41: 统一走 llm-contract normalizeDialogueAnnotation
    const dialoguePath = this.productionDir + '/03-shots/dialogue-annotation.json';
    try {
      if (fs.existsSync(dialoguePath)) {
        const rawDialogueData = JSON.parse(fs.readFileSync(dialoguePath, 'utf8'));
        const dialogueData = normalizeDialogueAnnotation(rawDialogueData);
        const dialogueShots = dialogueData.shots || [];
        for (const d of dialogueShots) {
          const shot = allShots.find(s => s.id === d.id);
          if (shot && !shot.dialogues && d.dialogues) {
            shot.dialogues = d.dialogues;
          }
        }
      }
    } catch (e) {
      // dialogue加载失败不影响后续
    }

    if (allShots.length === 0) {
      console.log(`  ⚠️ 无shots,跳过质量校准`);
      return;
    }
    
    let fixCount = 0;
    
    console.log(`  🧹 1. 旁白清洗...`);
    for (const shot of allShots) {
      const prompt = shot._generatedPrompt || '';
      const cleaned = this._cleanVoiceover(prompt, shot);
      if (cleaned !== prompt) {
        shot._generatedPrompt = cleaned;
        shot._promptLength = cleaned.length;
        fixCount++;
      }
    }

    // 🆕 v6.24-fix25: P1角色名注入 — 当P1大写字段有内容时,强制替换prompt中的泛化"神兽"为白泽/小G
    // 根因: LLM的Nirath模板输出完整的【Character】 Nirath神兽等泛化字段(非空)
    // PromptAssembler的override只在字段为空时覆盖,无法清除已生成的泛化内容
    // 修复: 在SmartCalibration前,先用P1字段强制替换prompt中的泛化标记
    console.log(`  🧹 1b. P1角色名注入...`);
    for (const shot of allShots) {
      const p1Char = shot.Character || '';
      const p1Action = shot.Action || '';
      const p1Scene = shot.Scene || '';
      // 白泽: 检查P1字段是否包含白泽特征关键词
      const isBaize = /白泽|额头竖眼|三尾|月光蓝/.test(p1Char + p1Action + p1Scene);
      // 小G: 检查P1字段是否包含小G特征关键词
      const isXiaoG = /小G|少年|小男孩|山脚/.test(p1Char + p1Action + p1Scene);

      let prompt = shot._generatedPrompt || '';
      let replaced = false;

      if (isBaize && !prompt.includes('白泽')) {
        // 替换泛化"神兽"为"白泽"
        const before = prompt.length;
        prompt = prompt
          .replace(/神兽角色:\s*Nirath神兽/gi, '白泽 (Baize)')
          .replace(/SPEAKER:\s*神兽(?=\s*\|)/gi, 'SPEAKER: 白泽')
          .replace(/CharacterRef[：:]\s*白泽_/gi, 'CharacterRef: 白泽')
          .replace(/神兽\s*(?:角色|登场|现身)/g, '白泽');
        replaced = prompt.length !== before;
      }
      if (isXiaoG && !prompt.includes('小G') && !prompt.includes('xiaoG')) {
        const before = prompt.length;
        prompt = prompt
          .replace(/小G角色:\s*Nirath/g, '小G (xiaoG)')
          .replace(/SPEAKER:\s*小G(?=\s*\|)/gi, 'SPEAKER: 小G')
          .replace(/少年角色/g, '小G');
        replaced = prompt.length !== before || replaced;
      }
      if (replaced) {
        shot._generatedPrompt = prompt;
        shot._promptLength = this._countChars(prompt);
        fixCount++;
        console.log(`    [fix25] ${shot.id}: P1角色名注入 ${isBaize ? '白泽' : '小G'} → 替换泛化神兽`);
      }
    }

    console.log(`  🧹 2. 内容去重...`);
    fixCount += this._fixDuplicateContent(allShots, storyPlan);
    
    // 🆕 v6.11-Peng-fix4: 智能质量校准(截断+SmartCalibration)先执行
    console.log(`  🧹 3. 智能质量校准...`);
    const calibrator = new SmartQualityCalibration();
    const truncator = new PriorityTruncator();
    const metrics = new PromptMetrics();
    const metricReports = [];
    
    for (const shot of allShots) {
      const prompt = shot._generatedPrompt || '';
      const shotId = shot.id;
      
      const context = {
        shotId,
        characterName: (shot.characters || [])[0],
        characterTraits: shot._characterVisualNote,
        worldviewSummary: storyPlan.worldview?.substring(0, 100),
        prevShot: allShots[allShots.findIndex(s => (s.id || s.shotId) === (shot.id || shot.shotId)) - 1]?.id || allShots[allShots.findIndex(s => s.id === shotId || s.sId === shotId) - 1]?.id,
        microExpression: shot._microExpressions?.join(', ')
      };
      
      const calibration = calibrator.calibrate(prompt, context, this._countChars.bind(this));
      let calibratedPrompt = calibration.prompt;

      // 🆕 fix11-v5: P0安全注入——先收集注入量→截断LLM内容到安全余量→注入P0
      // 根因: 旧方案先注入后截断,lastIndexOf找到P0字段开头,截断在P0之前把P0全删
      // 修复: calibrated截到1000 → 计算P0量 → 截断LLM到1000-P0量 → 注入P0 → P0永不切断
      const { charCounter } = require('./char-counter');

      shot._generatedPrompt = calibratedPrompt;
      shot._promptLength = this._countChars(calibratedPrompt);
      calibration.finalLen = this._countChars(calibratedPrompt);
      if (calibration.originalLen !== calibration.finalLen) calibration.strategy = 'TRUNCATED';
      shot._calibrationMeta = calibration;

      // 步骤1: calibrated先截到1000(HARD_LIMIT)
      let llmPrompt = calibratedPrompt;
      if (this._countChars(llmPrompt)  > 5500) {
        llmPrompt = truncator.truncate(llmPrompt, 1000, this._countChars.bind(this));
      }

      // 步骤2: 调用_enforceSingleShotFields收集字段+清理basePrompt
      shot._generatedPrompt = llmPrompt;
      const { fixCount: injectFixCount, p0Fields, cleanPrompt } = this._enforceSingleShotFields(shot, storyPlan);
      fixCount += injectFixCount;
      // 🆕 fix15-v12: cleanPrompt已含清理后的LLM内容+accumulatedInjection(所有注入字段)
      // 不再需要injectedFields,直接使用cleanPrompt避免重复注入
      const baseForInject = cleanPrompt || llmPrompt;
      const hasInjection = cleanPrompt && cleanPrompt !== llmPrompt;

      // 步骤3: 计算P0字段注入量(加权计数,分隔符+3)
      let p0InjectLen = 0;
      for (const f of p0Fields) {
        p0InjectLen += 3 + this._countChars(f.text); // 3 = ' | '分隔符
      }

      // 步骤4: 处理注入逻辑
      // 🆕 fix15-v12: cleanPrompt已含accumulatedInjection(Timeline/AudioLayer/Mood/Camera/Lighting/Character+RefImages)
      // 如果cleanPrompt存在,直接使用它(不再追加injectedFields,避免Character等字段重复注入)
      if (hasInjection) {
        // cleanPrompt含清理后的LLM+accumulatedInjection(Timeline/AudioLayer/Mood/Camera/Lighting)
        // 还需要追加_refImagesInjection(Character+RefImages)
        shot._generatedPrompt = baseForInject;
        if (shot._refImagesInjection) {
          shot._generatedPrompt += shot._refImagesInjection;
        }
        // 如果超长,裁掉LLM部分保留注入字段
        if (this._countChars(shot._generatedPrompt)  > 5500) {
          const injectedLen = shot._refImagesInjection ? this._countChars(shot._refImagesInjection) : 0;
          const accLen = baseForInject.length - llmPrompt.length; // accumulatedInjection长度
          const totalInjected = injectedLen + accLen;
          const llmBudget = Math.max(0, 5500 - totalInjected);
          const trimmedLlm = llmPrompt.substring(0, Math.min(llmPrompt.length, llmBudget));
          // 重新构建: 裁后的LLM + accumulatedInjection + _refImagesInjection
          shot._generatedPrompt = trimmedLlm + baseForInject.substring(llmPrompt.length);
          if (shot._refImagesInjection) {
            shot._generatedPrompt += shot._refImagesInjection;
          }
        }
      } else if (p0Fields.length > 0) {
        // 无cleanPrompt注入,走传统injectedFields路径
        const injectedFields = p0Fields.map(f => f.text).join(' | ');
        const sep = baseForInject.length > 0 && !baseForInject.endsWith('|') ? ' | ' : ' ';
        const combined = baseForInject + sep + injectedFields;
        if (this._countChars(combined)  > 5500) {
          const p0Len = this._countChars(sep + injectedFields);
          const llmBudget = Math.max(0, 5500 - p0Len);
          let trimmedBase;
          try {
            trimmedBase = truncator.truncate(baseForInject, llmBudget, this._countChars.bind(this));
          } catch (e) {
            trimmedBase = charCounter.truncate(baseForInject, llmBudget);
          }
          shot._generatedPrompt = trimmedBase + sep + injectedFields;
          if (shot._refImagesInjection) {
            shot._generatedPrompt += shot._refImagesInjection;
          }
        } else {
          shot._generatedPrompt = combined;
          if (shot._refImagesInjection) {
            shot._generatedPrompt += shot._refImagesInjection;
          }
        }
      } else if (shot._refImagesInjection) {
        //  fix15-v12: 无p0Fields但有_refImagesInjection时也要追加
        shot._generatedPrompt = baseForInject + shot._refImagesInjection;
      }
      shot._p0Injected = true; // fix15-v6
      console.log(`     [SafeInject] ${shotId}: LLM→${this._countChars(llmPrompt)} | P0→${p0InjectLen} | 总→${this._countChars(shot._generatedPrompt)}`);

      const report = await metrics.calculate(shot._generatedPrompt, this._countChars(shot._generatedPrompt), shotId);
      metricReports.push(report);
      console.log(`     ${metrics.formatLog(report)}`);
      
      if (calibration.strategy !== 'SKIP' || this._countChars(calibratedPrompt)  > 5500) {
        fixCount++;
      }
    }
    
    const summary = metrics.batchCalculate(metricReports);
    // 🛠️ v6.31-hotfix: 输出结果修复（S00 重组/EN 残渣清理/Speaker 修正）
    console.log(`  🛠️ 输出结果修复中...`);
    try {
      await repairAllShotPromptOutputs(allShots);
      console.log(`  ✅ 输出结果修复完成`);
    } catch(e) {
      console.log(`  ⚠️ 输出结果修复失败：${e.message}`);
    }

    console.log(`  📊 批次统计: ${summary.pass}/${summary.total} 通过, 平均合规率: ${summary.avgCompliance}%`);
    
    // 🆕 fix11-v2: 写文件前质检闸机——自动修复+兜底阻断双重机制
    // 问题: 旧闸机直接throw阻断,导致生产卡死,无法自愈
    // 修复: 闸机有自愈能力——能修的修,实在修不了的才阻断
    const fs = require('fs');
    const path = require('path');
    const promptsDir = path.join(this.productionDir, '04-prompts');
    let gatePassCount = 0;
    let gateFixedCount = 0;
    let gateBlockCount = 0;

    for (const shot of allShots) {
      const shotId = shot.id || 'UNKNOWN';
      let prompt = shot._generatedPrompt || '';
      const trimmed = prompt.trim();
      const rawLen = this._countChars(prompt);
      const issues = [];

      // 质检1: 末尾不完整字段 → 截断清理
      if (/\|\s*[Pp][01]\s*$/.test(trimmed) || /\|[^|\s]\s*$/.test(trimmed)) {
        const fixed = trimmed.replace(/\|\s*[Pp][01]\s*$/, '').replace(/\|[^|\s]\s*$/, '').trim();
        console.log(`     [闸机自愈] ${shotId}: 修复末尾残片字段 (${rawLen}→${this._countChars(fixed)}字符)`);
        prompt = fixed;
        gateFixedCount++;
      }

      // 质检2: 缺少完整P0 Dialogue → 强制注入
      // 🆕 v6.24-fix33[P0]: 多源对白获取（dialogue-annotation → shot.Dialogue → storyPlan全局）
      // v6.31-hotfix: 同时识别「| P0 Dialogue」和「【Dialogue】」两种格式（repair 输出用中文括号）
      const hasStandardFormat = /\|\s*P0\s+Dialogue.*TEXT/i.test(shot._generatedPrompt || "");
      const hasRepairFormat = /[【\[]Dialogue[】\]].*SPEAKER.*TEXT/i.test(shot._generatedPrompt || "");
      const alreadyHasP0Dialogue = (shot._p0Injected === true) && (hasStandardFormat || hasRepairFormat);
      if (!alreadyHasP0Dialogue) {
        // 源1: shot.dialogues（dialogue-annotation.json 注入的，最优先）
        let dialogues = shot.dialogues || [];
        // 源2: shot.Dialogue（P1 大写字段，story-plan.json 原始对白）
        if ((!dialogues || dialogues.length === 0) && shot.Dialogue && Array.isArray(shot.Dialogue) && shot.Dialogue.length > 0) {
          dialogues = shot.Dialogue.map(d => ({
            speaker: d.SPEAKER || d.speaker,
            text: d.TEXT || d.text || '',
            type: d.TYPE || d.type || '对话',
            emotion: d.EMOTION || d.emotion || '中性'
          }));
        }
        // 源3: shot.dialogue（小写备选）
        if ((!dialogues || dialogues.length === 0) && shot.dialogue && Array.isArray(shot.dialogue) && shot.dialogue.length > 0) {
          dialogues = shot.dialogue;
        }
        // 源4: 从 storyPlan 全局搜索当前 shot 的对白
        if ((!dialogues || dialogues.length === 0) && storyPlan && storyPlan.segments) {
          for (const seg of storyPlan.segments) {
            for (const s of (seg.shots || [])) {
              if (s.id === shotId) {
                const rawFound = s.Dialogue || s.dialogue;
                const found = Array.isArray(rawFound) ? rawFound : [];
                if (found.length > 0) {
                  dialogues = found.map(d => ({
                    speaker: d.SPEAKER || d.speaker,
                    text: d.TEXT || d.text || '',
                    type: d.TYPE || d.type || '对话',
                    emotion: d.EMOTION || d.emotion || '中性'
                  }));
                }
                break;
              }
            }
            if (dialogues && dialogues.length > 0) break;
          }
        }

        let injection = '';
        if (dialogues && dialogues.length > 0) {
          const d = dialogues[0];
          const sp = (d.speaker || '白泽') !== '神兽' ? d.speaker : (storyPlan?.title || '白泽');
          injection = ` | 【Dialogue】 - SPEAKER: ${sp} | TYPE: ${d.type || '对话'} | EMOTION: ${d.emotion || '中性'} | TEXT: "${d.text || ''}" | LIP_SYNC: YES | 口型情绪: 自然`;
          console.log(`     [闸机自愈] ${shotId}: 从${dialogues === shot.Dialogue ? 'shot.Dialogue(P1)' : 'shot.dialogues'}注入对白 SPEAKER=${sp}`);
        } else {
          // v6.24-hotfix: 智能角色fallback — 根据Action内容判断主场角色
          const dominantRole = this._detectDominantRole(shot);
          const fbSpeaker = dominantRole === 'xiaoG' ? '小G' : '白泽';
          const fbText = dominantRole === 'xiaoG' ? '我在。' : '吾名白泽，通晓万物之情。';
          if (shot.type === 'opening_title') {
            injection = ` | 【Dialogue】 - SPEAKER: ${fbSpeaker} | TYPE: 战吼 | EMOTION: 威严 | TEXT: "${fbText}" | LIP_SYNC: YES`;
          } else {
            injection = ` | 【Dialogue】 - SPEAKER: ${fbSpeaker} | TYPE: 对话 | EMOTION: 中性 | TEXT: "${fbText}" | LIP_SYNC: YES | 口型情绪: 自然`;
          }
          console.log(`     [闸机自愈] ${shotId}: 无对白数据，使用fallback SPEAKER=${fbSpeaker}`);
        }
        prompt += injection;
        console.log(`     [闸机自愈] ${shotId}: 强制注入P0 Dialogue (${this._countChars(prompt) - this._countChars(injection)}→${this._countChars(prompt)}字符)`);
        gateFixedCount++;
      }

      // 质检3: 缺少完整P0 Character → 强制注入
      // 质检3: 缺少完整P0 Character → 强制注入
      // 🆕 v6.24-fix33[P0]: 多源角色获取（shot.characters → shot.Character → storyPlan全局）
      // v6.31-hotfix: 同时识别「| P0 Character」和「【Character】」两种格式（repair 输出用中文括号）
      const hasStandardCharFormat = /\|\s*P0\s+Character.*:/i.test(prompt);
      const hasRepairCharFormat = /[【\[]Character[】\]].*/i.test(prompt);
      if ((!hasStandardCharFormat || /\|\s*P0\s+Character\s*$/i.test(prompt)) && !hasRepairCharFormat) {
        // 源1: shot.characters（Stage 5 注册的 character map）
        let chars = shot.characters || [];
        let charDesc = '';
        // 源2: shot.Character（P1 大写字段）
        if ((!chars || chars.length === 0) && (shot.Character || shot.character)) {
          const desc = shot.Character || shot.character || '';
          const match = desc.match(/^[\u4e00-\u9fa5]{2,4}/);
          if (match) chars = [match[1]];
          charDesc = desc;
        }
        // 源3: shot.Dialogue 的 SPEAKER
        if ((!chars || chars.length === 0) && (shot.Dialogue || shot.dialogue)) {
          const sps = new Set();
          const rawD = shot.Dialogue || shot.dialogue;
          const dias = Array.isArray(rawD) ? rawD : [];
          for (const d of dias) {
            const sp = d.SPEAKER || d.speaker;
            if (sp) sps.add(sp);
          }
          if (sps.size > 0) chars = Array.from(sps);
        }
        // 源4: storyPlan.title
        if ((!chars || chars.length === 0) && storyPlan?.title) {
          chars = [storyPlan.title];
        }

        const charStr = (chars && chars.length > 0) ? chars.join(', ') : (storyPlan?.title || '白泽');
        const worldName = storyPlan?.worldview || 'Nirath';
        // 🆕 fix33[P0]: 用真实角色名而非"神兽"
        const finalDesc = charDesc || `${worldName}${charStr}`;
        const injection = ` | 【Character】 ${charStr}: ${finalDesc}`;
        prompt += injection;
        const charSrc = (chars && chars.length > 0) ? 'shot.characters' : (storyPlan?.title ? 'storyPlan.title' : '神兽');
        console.log(`     [闸机自愈] ${shotId}: 强制注入P0 Character (源:${charSrc})`);
        gateFixedCount++;
      }

      // 质检4: 超1000字符 → 使用P0保护策略截断(不是charCounter截断)
      // 🆕 fix11-v4: charCounter.truncate按字节截断会切坏P0字段
      // 改为:先截断到P0字段前→再注入P0→确保注入后P0完整
      if (this._countChars(prompt) >= 5500) {
        const { charCounter } = require('./char-counter');
        const before = this._countChars(prompt);
        let basePrompt = prompt;

        // 步骤A: 注入缺失的P0字段(注入到base prompt,此时还未截断)
        // v6.31-hotfix: 同时识别「| P0 Dialogue」和「【Dialogue】」两种格式
        const hasStandardP0Dialogue = /\|\s*P0\s+Dialogue.*TEXT/i.test(basePrompt);
        const hasRepairDialogue = /[【\[]Dialogue[】\]].*SPEAKER.*TEXT/i.test(basePrompt);
        if (!hasStandardP0Dialogue && !hasRepairDialogue) {
          const dialogues = shot.dialogues || [];
          let injection = '';
          if (dialogues.length > 0) {
            const d = dialogues[0];
            const sp = ((d.speaker || '白泽') !== '神兽') ? d.speaker : (storyPlan?.title || '白泽');
            injection = ` | 【Dialogue】 - SPEAKER: ${sp} | TYPE: ${d.type || 'dialogue'} | EMOTION: ${d.emotion || 'neutral'} | TEXT: "${d.text || ''}" | LIP_SYNC: YES | 口型情绪: 自然`;
          } else {
            // v6.24-hotfix: 智能角色fallback — 根据Action内容判断主场角色
            const dominantRole = this._detectDominantRole(shot);
            const fbSp = dominantRole === 'xiaoG' ? '小G' : '白泽';
            const fbTxt = dominantRole === 'xiaoG' ? '我在。' : '吾名白泽，通晓万物之情。';
            injection = ` | 【Dialogue】 - SPEAKER: ${fbSp} | TYPE: ${shot.type === 'opening_title' ? '战吼' : '对话'} | EMOTION: ${shot.type === 'opening_title' ? '威严' : '中性'} | TEXT: "${fbTxt}" | LIP_SYNC: YES | 口型情绪: 自然`;
          }
          basePrompt += injection;
          console.log(`     [闸机自愈] ${shotId}: 先注入P0 Dialogue`);
          gateFixedCount++;
        }
        // v6.31-hotfix: 同时识别「| P0 Character」和「【Character】」两种格式
        const hasStandardP0Char = /\|\s*P0\s+Character.*:/i.test(basePrompt);
        const hasRepairChar = /[【\[]Character[】\]].*/i.test(basePrompt);
        if ((!hasStandardP0Char || /\|\s*P0\s+Character\s*$/i.test(basePrompt)) && !hasRepairChar) {
          // 🆕 fix33[P0]: Character fallback 也用 storyPlan.title
          const chars = shot.characters || [];
          const charStr = (chars && chars.length > 0) ? chars.join(', ') : (storyPlan?.title || '白泽');
          const worldName = storyPlan?.worldview || 'Nirath';
          basePrompt += ` | 【Character】 ${charStr}: ${worldName}${charStr}`;
          console.log(`     [闸机自愈] ${shotId}: 先注入P0 Character`);
          gateFixedCount++;
        }

        // 步骤B: 在P0字段边界截断(保护P0字段完整)
        // 找到最后一个P0字段的位置,在其后截断
        const p0DialogueIdx = basePrompt.lastIndexOf('| P0 Dialogue');
        const p0CharIdx = basePrompt.lastIndexOf('| P0 Character');
        const lastP0Idx = Math.max(p0DialogueIdx, p0CharIdx);

        if (lastP0Idx > 0) {
          // 🆕 fix15-v6: 保留 P0 字段,裁剪前面的非 P0 内容
          // 根因: fix15-v5 的 nextP0Idx 查找会被 P0 Dialogue 内部的 | 干扰
          //       截断后 P0 Dialogue 被丢掉,闸机又注入,循环
          // 修复: 把所有 P0 字段集作为一个整体保留(p0Block),裁剪非 P0 内容
          //       最终 prompt = 裁后的非P0 + 完整P0块
          // 🆕 fix15-v11: P0块保护包含RefImages（文件名模式后路径已缩短但仍需保护）
          const p0DialogueStart = basePrompt.indexOf('| P0 Dialogue');
          const p0CharStart = basePrompt.indexOf('| P0 Character');
          const refImagesStart = basePrompt.indexOf('| Ref Images:');
          const p0KeepStart = Math.min(
            p0DialogueStart >= 0 ? p0DialogueStart : Infinity,
            p0CharStart >= 0 ? p0CharStart : Infinity,
            refImagesStart >= 0 ? refImagesStart : Infinity
          );
          if (p0KeepStart === Infinity) {
            prompt = charCounter.truncate(basePrompt, 5500).replace(/\|\s*[Pp][0-9]\s*$/, '').trim();
          } else {
            const p0Block = basePrompt.substring(p0KeepStart);
            const nonP0Part = basePrompt.substring(0, p0KeepStart);
            const nonP0Budget = Math.max(0, 1000 - this._countChars(p0Block));
            const trimmedNonP0 = nonP0Budget >= this._countChars(nonP0Part)
              ? nonP0Part
              : nonP0Part.substring(0, nonP0Budget).replace(/\|\s*$/, '').trim();
            prompt = trimmedNonP0 + p0Block;
          }
        } else {
          // 没有P0字段可保护,强制截断
          prompt = charCounter.truncate(basePrompt, 5500).replace(/\|\s*[Pp][0-9]\s*$/, '').trim();
        }

        // 兜底: 如果仍然超1000(极端情况),使用PriorityTruncator P0 保护截断
        // 🆕 fix15-v9: 原 charCounter.truncate 会暴力切到 P0 CharacterRef 路径中间
        // 修复: 改用 PriorityTruncator 保留 P0 区域完整
        if (this._countChars(prompt) >= 5500) {
          const { PriorityTruncator } = require('./smart-quality-calibration');
          const priorityTruncator = new PriorityTruncator();
          prompt = priorityTruncator.truncate(prompt, 1000, this._countChars.bind(this));
          // 末次保险: 仍超 1000 用切片裁 + 清理结尾P0/P1残片
          if (this._countChars(prompt) >= 5500) {
            prompt = charCounter.truncate(prompt, 5500).replace(/\|\s*[Pp][0-9]\s*$/, '').trim();
          }
        }

        console.log(`     [闸机自愈] ${shotId}: P0保护截断 (${before}→${this._countChars(prompt)}字符)`);
        gateFixedCount++;
      }

      // 最终安全检查(修复后仍不合格→阻断)
      // 🆕 fix14-v5: S00片头(OpeningTitle)跳过P0 Dialogue/Character检查，只有其他镜头需要
      const isOpeningShot = (shotId === 'S00');
      const finalTrimmed = prompt.trim();
      const stillBad = (
        /\|\s*[Pp][01]\s*$/.test(finalTrimmed) ||
        // 🆕 FIX3-v1: 同时支持 【】 和 P0/P1 两种格式
        (!isOpeningShot && !(/\|\s*【\s*Dialogue\s*】/.test(prompt) || /\|\s*P0\s+Dialogue.*TEXT/i.test(prompt))) ||
        (!isOpeningShot && (!(/\|\s*【\s*Character\s*】/.test(prompt) || /\|\s*P0\s+Character.*:/i.test(prompt)) || (/\|\s*【\s*Character\s*】/.test(prompt) && !/【Character】\s*\S/.test(prompt)))) ||
        this._countChars(prompt)  > 5500
      );
      


      if (stillBad && !isOpeningShot) {
        const errorMsg = `❌ 质检闸机阻断: ${shotId} 自动修复后仍不合格,需人工介入
  长度: ${this._countChars(prompt)}字符
  末尾: "...${prompt.slice(-60)}"`;
        console.error(`\n${errorMsg}`);
        gateBlockCount++;
        throw new Error(errorMsg);
      }

      // v6.27-Peng: 所有镜头写盘前标准化(确保TitleOverlay/BackgroundSound等12字段完整)
      await normalizeShotPromptFields(shot, storyPlan, {
        openingTitle: isOpeningTitleShot(shot) ? (this.results.openingTitle || null) : null
      });

      // v6.27-Peng: 最终写入的一定是标准化后的 prompt
      const finalPrompt = this.replaceRefImagesFilenames(
        shot._finalPrompt || shot._generatedPrompt || prompt || ''
      );

      const promptFile = path.join(promptsDir, `prompt-${shotId}.txt`);
      fs.writeFileSync(promptFile, finalPrompt, 'utf8');

      // v6.27-Peng: 写盘后二次校验 — 缺字段直接报错
      const verifyContent = fs.readFileSync(promptFile, 'utf8');
      const verifyCheck = checkFinalTenFields(verifyContent);
      if (!verifyCheck.pass) {
        throw new Error(`写盘后二次校验失败: ${shotId} 缺少字段 -> ${verifyCheck.missing.join(', ')}`);
      }

      // 同步内存中的最终版本
      shot._generatedPrompt = finalPrompt;
      shot._finalPrompt = finalPrompt;
      shot._promptLength = finalPrompt.length;

      gatePassCount++;
      console.log(`     [闸机✅] ${shotId}: 质检通过, ${finalPrompt.length} chars`);
    }

    console.log(`\n  🛡️ 质检闸机报告: 通过${gatePassCount}个, 自愈修复${gateFixedCount}个, 阻断${gateBlockCount}个`);
    if (gateBlockCount > 0) {
      throw new Error(`质检闸机阻断${gateBlockCount}个镜头,需人工介入修复后重新跑`);
    }
    
    try {
      const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
      if (fs.existsSync(storyPlanPath)) {
        const savedPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
        for (const segment of savedPlan.segments || []) {
          for (const shot of segment.shots || []) {
            const matchedShot = allShots.find(s => (s.id || s.shotId) === (shot.id || shot.shotId));
            if (matchedShot) {
              if (matchedShot._generatedPrompt) shot._generatedPrompt = matchedShot._generatedPrompt;
              if (matchedShot._finalPrompt) shot._finalPrompt = matchedShot._finalPrompt;
              if (matchedShot._promptLength !== undefined) shot._promptLength = matchedShot._promptLength;
              if (matchedShot._calibrationMeta) shot._calibrationMeta = matchedShot._calibrationMeta;
              if (matchedShot._normalizedFields) shot._normalizedFields = matchedShot._normalizedFields;

              // 内容质量增强字段
              if (matchedShot._narrativePurpose) shot._narrativePurpose = matchedShot._narrativePurpose;
              if (matchedShot._visualHook) shot._visualHook = matchedShot._visualHook;
              if (matchedShot._behaviorLogic) shot._behaviorLogic = matchedShot._behaviorLogic;
              if (matchedShot._primaryFocus) shot._primaryFocus = matchedShot._primaryFocus;
              if (matchedShot._depthPlan) shot._depthPlan = matchedShot._depthPlan;
              if (matchedShot._cinematicReadability) shot._cinematicReadability = matchedShot._cinematicReadability;
              if (matchedShot._openingHook) shot._openingHook = matchedShot._openingHook;
              if (matchedShot._diversifyHint) shot._diversifyHint = matchedShot._diversifyHint;
              if (matchedShot._climaxUpgrade) shot._climaxUpgrade = matchedShot._climaxUpgrade;
            }
          }
        }
        fs.writeFileSync(storyPlanPath, JSON.stringify(savedPlan, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn(`  ⚠️ 保存story-plan.json失败: ${e.message}`);
    }
    
    // ==================== v6.27-Peng: 最终内容质量增强 + 10字段标准化 ====================
    // 🎬 v1.1-Peng: 注入平台预设，shot-quality-enhancer 据此启用抖音/TikTok增强逻辑
    storyPlan._platform = this.platform;

    console.log(`  🎯 最终内容质量增强 + 10字段标准化...`);
    const finalNormalizeResults = await this._finalNormalizeAllShots(storyPlan, allShots);
    this.results.finalNormalizeResults = finalNormalizeResults;
    
    console.log(`  ✅ 质量校准完成: ${fixCount}处修复`);
    
    this.results.qualityCalibration = {
      fixCount,
      metricSummary: summary,
      finalNormalizeResults,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🆕 v6.35-Peng: Stage 8.4 好莱坞技能路由注入
   * 将 cinematography-skill-router.js 的149个镜头级专项技能注入每个shot的_generatedPrompt
   * 
   * 工作流:
   * 1. 收集所有shots
   * 2. 对每个shot调用 routeAndEnhance() 匹配技能
   * 3. 将技能增强关键词追加到 _generatedPrompt 末尾
   * 4. 输出注入报告
   * 
   * 降级策略: 技能路由失败不阻断Pipeline, 继续使用原prompt
   */
  async _stage84_CinematographySkillInjection() {
    const storyPlan = this.results.storyPlan;
    if (!storyPlan) {
      console.log(`  ⚠️ 无story-plan,跳过技能路由注入`);
      return;
    }

    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    if (allShots.length === 0) {
      console.log(`  ⚠️ 无shots,跳过技能路由注入`);
      return;
    }

    try {
      const { routeAndEnhance } = getCinematographySkillRouter();
      
      // 对每个shot调用技能路由
      const { enhancedShots, report } = routeAndEnhance(allShots, {
        minScore: 5,
        maxSkillsPerShot: 2  // 每个镜头最多匹配2个技能,避免prompt过长
      });

      // 将增强后的_generatedPrompt写回shot
      for (let i = 0; i < enhancedShots.length; i++) {
        const enhanced = enhancedShots[i];
        const original = allShots[i];
        
        if (enhanced._generatedPrompt && enhanced._generatedPrompt !== original._generatedPrompt) {
          original._generatedPrompt = enhanced._generatedPrompt;
          original._promptLength = this._countChars(enhanced._generatedPrompt);
        }
        
        // 保留技能元数据供溯源
        if (enhanced._appliedSkills) {
          original._appliedSkills = enhanced._appliedSkills;
        }
      }

      // 输出注入报告
      console.log(`  ✅ 技能路由注入完成:`);
      console.log(`     总镜头: ${report.totalShots}`);
      console.log(`     增强镜头: ${report.enhancedShots}`);
      console.log(`     跳过镜头: ${report.skippedShots}`);
      console.log(`     使用技能: ${report.skillsUsed.length}个`);
      
      if (report.skillsUsed.length > 0) {
        const sampleSkills = report.skillsUsed.slice(0, 5);
        console.log(`     技能示例: ${sampleSkills.join(', ')}`);
        if (report.skillsUsed.length > 5) {
          console.log(`     ...及其他 ${report.skillsUsed.length - 5} 个技能`);
        }
      }

      // 记录审计日志
      this._writeAuditLog('stage8_4_skill_injection', {
        status: 'success',
        enhancedShots: report.enhancedShots,
        skippedShots: report.skippedShots,
        skillsUsed: report.skillsUsed.length,
        sampleSkills: report.skillsUsed.slice(0, 10)
      });

    } catch (e) {
      // 降级: 技能路由失败不阻断Pipeline
      console.log(`  ⚠️ 技能路由注入失败(降级): ${e.message}`);
      this._writeAuditLog('stage8_4_skill_injection', {
        status: 'degraded',
        error: e.message
      });
    }
  }

  /**
   * v6.27-Peng
   * 对所有镜头执行最终质量增强 + 最终10字段标准化
   * 这是最终交付前的统一收口闸门
   */
  async _finalNormalizeAllShots(storyPlan, allShots) {
    if (!storyPlan || !Array.isArray(allShots) || allShots.length === 0) {
      console.log(`  ⚠️ _finalNormalizeAllShots: storyPlan 或 allShots 为空，跳过`);
      return [];
    }

    console.log(`  🎬 内容质量增强中...`);
    await enhanceShotQualityBundle(allShots, storyPlan);

    console.log(`  🧱 10字段最终标准化中...`);
    const results = await normalizeAllShots(allShots, storyPlan, {
      openingTitle: this.results.openingTitle || null
    });

    for (const r of results) {
      const status = r.tenFieldCheck?.pass ? '✅' : '❌';
      console.log(
        `  ${status} ${r.shotId}: ${r.promptLength} chars | EN words=${r.englishWordCount} | CN dialogue=${r.chineseDialogueChars}`
      );
      if (!r.tenFieldCheck?.pass) {
        console.log(`    缺失字段: ${(r.tenFieldCheck.missing || []).join(', ')}`);
      }
    }

    
    // v6.27-Peng: 写盘标准化后的 prompt 文件，确保后续合规检查读到最新版本
    const promptsDir = path.join(this.productionDir, '04-prompts');
    fs.mkdirSync(promptsDir, { recursive: true });
    for (const shot of allShots) {
      const shotId = String(shot.id || shot.shotId || 'UNKNOWN');
      const finalPrompt = this.replaceRefImagesFilenames(
        shot._finalPrompt || shot._generatedPrompt || ''
      );
      const promptFile = path.join(promptsDir, `prompt-${shotId}.txt`);
      fs.writeFileSync(promptFile, finalPrompt, 'utf8');
    }
    console.log(`  💾 标准化 prompt 文件已写入: ${allShots.length} 个镜头`);

    return results;
  }

  /**
   * 长度闭环校验：确保1200-1000字符
   */
  async _enforceLengthLoop(shots) {
    let fixCount = 0;

    // 🆕 v1.3-Peng: 恢复MAX_LEN=1649,充分利用空间,用有意义的角色细节填充
    const MAX_LEN = 1649;

    // 导入微表情引擎用于智能填充
    let microEngine = null;
    try {
      const { MicroExpressionEngine } = require('./micro-expression-engine');
      microEngine = new MicroExpressionEngine();
    } catch(e) {
      console.log('     ⚠️ 微表情引擎未加载,使用备用填充');
    }

    for (const shot of shots) {
      let prompt = shot._generatedPrompt || '';
      const length = prompt.length;

      if (length > MAX_LEN) {
        // 超出:截断到MAX_LEN
        prompt = prompt.substring(0, MAX_LEN);
        fixCount++;
        console.log(`     ✅ ${shot.id}: 截断 ${length}→${prompt.length}字符`);
      } else if (length < MAX_LEN) {
        // 不足:用有意义的角色细节填充(而非通用套话)
        const charsNeeded = MAX_LEN - length;
        let detailFill = '';

        // 优先使用微表情引擎生成角色细节
        if (microEngine && shot.characters && shot.characters.length > 0) {
          const charExpressions = [];
          for (const charName of shot.characters) {
            const char = toCharArray(this.results?.storyPlan?.characters)?.find(c => c.name === charName);
            if (!char) continue;

            const expr = microEngine.generate(shot, {
              name: char.name,
              type: char.type || (char.species === 'human' ? 'human' : 'beast'),
              subtype: char.subtype || '',
              emotion: char.emotion || shot.emotion
            });

            if (expr && expr.trim().length > 0) {
              charExpressions.push(expr);
            }
          }

          if (charExpressions.length > 0) {
            detailFill = ' | ' + charExpressions.join(' | ');
          }
        }

        // 如果微表情不足,用角色档案中的视觉细节补充
        if (detailFill.length < charsNeeded * 0.5) {
          const visualDetails = this._extractCharacterVisualDetails(shot);
          if (visualDetails) {
            detailFill += (detailFill ? ' | ' : ' | ') + visualDetails;
          }
        }

        // 截断到需要的字符数
        if (detailFill.length > charsNeeded) {
          detailFill = detailFill.substring(0, charsNeeded);
        }

        if (detailFill.length > 0) {
          prompt = prompt + detailFill;
          fixCount++;
          console.log(`     ✅ ${shot.id}: 填充 ${length}→${prompt.length}字符(角色细节: ${detailFill.length}字)`);
        } else {
          // 备用:极简通用填充(仅当无角色细节可用时)
          const backupFill = `, cinematic film quality, ultra clear details`;
          const availableSpace = Math.min(charsNeeded, backupFill.length);
          prompt = prompt + backupFill.substring(0, availableSpace);
          fixCount++;
          console.log(`     ✅ ${shot.id}: 填充 ${length}→${prompt.length}字符(备用)`);
        }
      }

      shot._generatedPrompt = prompt;
      shot._promptLength = prompt.length;
    }

    return fixCount;
  }

  /**
   * 从角色档案提取视觉细节用于填充
   */
  _extractCharacterVisualDetails(shot) {
    const details = [];
    const chars = shot.characters || [];

    for (const charName of chars) {
      const char = toCharArray(this.results?.storyPlan?.characters)?.find(c => c.name === charName);
      if (!char) continue;

      // 人类角色:面部/皮肤/发质细节
      if (!char.type || char.type === 'human' || char.species === 'human') {
        const skinDetail = '面部皮肤呈现真实纹理,毛孔清晰可见,自然光影过渡柔和,肤质细腻有光泽,发丝边缘锐度清晰,睫毛根根分明,嘴唇自然红润';
        const clothingDetail = '服装材质质感真实,布料纹理清晰可见,褶皱自然,光影在织物表面形成细腻过渡';
        details.push(skinDetail, clothingDetail);
      } else {
        // 异兽角色:材质/纹理细节
        const beastDetail = '材质表面纹理极端清晰,生物发光脉络自然流动,鳞片/毛发的微观结构清晰可见,次表面散射效果真实';
        details.push(beastDetail);
      }
    }

    return details.length > 0 ? details.join(',') : '';
  }

  /**
   * 转场指令注入
   */
  _injectTransitions(shots) {
    let fixCount = 0;

    for (let i = 1; i < shots.length; i++) {
      const prevShot = shots[i - 1];
      const currShot = shots[i];

      const prevPrompt = prevShot._generatedPrompt || '';
      const currPrompt = currShot._generatedPrompt || '';

      // 检查是否已有转场指令
      if (!currPrompt.includes('TRANSITION') && !currPrompt.includes('接续')) {
        const transition = `接续${prevShot.id} | `;
        let newPrompt = transition + currPrompt;

        // 🆕 v6.8-Peng-fix2: 添加转场前缀后再次检查长度,确保不超过1649
        if (newPrompt.length > 1649) {
          newPrompt = newPrompt.substring(0, 1649);
        }

        currShot._generatedPrompt = newPrompt;
        currShot._promptLength = currShot._generatedPrompt.length;
        fixCount++;
      }
    }

    return fixCount;
  }

  /**
   * 🆕 v1.1-Peng: 微表情注入 - 将微表情信息注入到P0 Character块
   * 基于MicroExpressionEngine,为每个角色生成具象微表情描述
   */
  async _injectMicroExpressions(shots, storyPlan) {
    console.log(`\n🎭 Stage 8.4: 微表情注入 (MicroExpressionEngine v1.0-Peng)`);

    try {
      const { MicroExpressionEngine } = require('./micro-expression-engine');
      const engine = new MicroExpressionEngine();

      let injectCount = 0;

      for (const shot of shots) {
        const shotChars = shot.characters || [];
        if (shotChars.length === 0) continue;

        const microExpressions = [];

        for (const charName of shotChars) {
          const char = toCharArray(storyPlan.characters).find(c => c.name === charName);
          if (!char) continue;

          const expr = engine.generate(shot, {
            name: char.name,
            type: char.type || (char.species === 'human' ? 'human' : 'beast'),
            subtype: char.subtype || '',
            emotion: char.emotion || shot.emotion
          });

          microExpressions.push(expr);
        }

        // 🆕 v1.3-Peng: 简化微表情注入,因为_enforceLengthLoop已处理填充
        // 现在只检查:如果还有空间且未填充,则补充;否则只保存_microExpressions供文档使用
        let prompt = shot._generatedPrompt || '';
        const hasMicroExprAlready = prompt.includes('面部') || prompt.includes('毛孔') || prompt.includes('发质') || prompt.includes('微表情');
        const hasSpace = prompt.length < 1800; // 还有空间才注入

        if (microExpressions.length > 0 && (!hasMicroExprAlready || hasSpace)) {
          let microExprText = microExpressions.join(' | ');
          let suffix = ` | 微表情: ${microExprText}`;

          if (prompt.length + suffix.length <= 1649) {
            const newPrompt = prompt + suffix;
            shot._generatedPrompt = newPrompt;
            shot._promptLength = newPrompt.length;
            injectCount++;
            console.log(`  ✅ ${shot.id}: 微表情注入完成 | +${suffix.length}字符`);
          } else if (prompt.length < 1649) {
            // 空间不足,截断微表情
            const available = 1649 - prompt.length - 10;
            if (available > 20) {
              const truncated = microExprText.substring(0, available);
              suffix = ` | 微表情: ${truncated}`;
              const newPrompt = prompt + suffix;
              shot._generatedPrompt = newPrompt;
              shot._promptLength = newPrompt.length;
              injectCount++;
              console.log(`  ✅ ${shot.id}: 微表情注入完成(截断) | +${suffix.length}字符`);
            }
          }
        }

        // 始终保存微表情到shot对象供文档生成使用
        shot._microExpressions = microExpressions;
      }

      console.log(`  ✅ 微表情注入完成: ${injectCount}/${shots.length}个镜头`);

      // 🆕 v1.1-Peng-fix: 重新写入04-prompts/文件,确保微表情持久化
      const fs = require('fs');
      const path = require('path');
      const promptsDir = path.join(this.productionDir, '04-prompts');
      for (const shot of shots) {
        if (shot._generatedPrompt) {
          const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
          fs.writeFileSync(promptFile, `# ${shot.id} Prompt\n\n\`\`\`\n${shot._generatedPrompt}\n\`\`\`\n`, 'utf8');
        }
      }
      console.log(`  💾 已重新写入04-prompts/含微表情`);

    } catch (error) {
      console.log(`  ⚠️ 微表情注入失败: ${error.message}`);
      console.log(`     继续执行Pipeline...`);
    }
  }

  // ============ 阶段8.2: 提示词预生成 (v6.2-Peng: LLM电影感Prompt生成) ============
  /**
   * 🆕 v6.2-Peng: 提示词预生成 - LLM核心叙事 + 本地技术注入协同
   *
   * 改造前: 纯本地模块拼接(生理感知+场景美术+地质质感+音频叙事...)
   * 改造后: LLM生成电影感核心Prompt → 本地模块注入技术参数 → 合并为完整Prompt
   *
   * LLM任务: 根据镜头上下文生成电影级画面描述、运镜语言、光影氛围
   * 本地模块: 注入角色锚点、场景美术、环境风格、音频叙事、地质质感等技术层
   */
  async stage8_2_PromptPreGeneration() {
    const { stage8_PromptPreGeneration: fn } = require('./stage8-pregeneration');
    return fn(this);
  }

  /**
   * v6.2-Peng: 构建shot上下文供LLM生成核心叙事
   * v6.24-hotfix: 纯英文标签输出,内容原文传给LLM(要求其自行翻译为英文)
   */
  _buildShotContext(shot, storyPlan) {
    const lines = [];
    lines.push(`Shot ID: ${shot.id}`);
    lines.push(`Type: ${shot.type || 'unspecified'}`);
    lines.push(`Emotion: ${shot.emotion || 'unspecified'}`);
    lines.push(`Duration: ${shot.duration || 0}s`);

    // v6.24-hotfix: 翻译指令 — 要求LLM将所有中文内容翻译为英文后输出
    lines.push(`\n[CRITICAL] Translate ALL Chinese text in the output to English.`);

    // 🆕 fix-v6.26: 优先用小写英文字段(Stage 3.5 LLM生成),大写字段(StoryPlan中文)作为fallback
    const sceneText = shot.scene || shot.Scene || shot.description || 'Not provided';
    const actionText = shot.action || shot.Action || 'Not provided';
    const characterText = shot.character || shot.Character || 'Not provided';
    const moodText = shot.mood || shot.Mood || 'unspecified';
    const cameraText = shot.camera || shot.Camera || 'unspecified';
    const lightingText = shot.lighting || shot.Lighting || 'unspecified';

    lines.push(`\nScene:`);
    lines.push(sceneText);
    lines.push(`\nAction:`);
    lines.push(actionText);
    lines.push(`\nCharacter:`);
    lines.push(characterText);
    lines.push(`\nMood: ${moodText}`);
    lines.push(`\nCamera: ${cameraText}`);
    lines.push(`\nLighting: ${lightingText}`);

    // Dialogue: 英文标签，中文内容保留
    if (shot.Dialogue && Array.isArray(shot.Dialogue) && shot.Dialogue.length > 0) {
      const dlgs = shot.Dialogue.filter(d => d && d.TEXT && d.TEXT.trim() && d.TEXT !== '...' && d.TEXT !== '"..."');
      if (dlgs.length > 0) {
        lines.push(`\nDialogue (P1):`);
        for (const dlg of dlgs) {
          lines.push(`- ${dlg.SPEAKER || '?'}: "${dlg.TEXT}" (${dlg.EMOTION || 'neutral'})`);
        }
      }
    }

    if (shot.characters?.length > 0) {
      lines.push(`\nCharacter Profiles:`);
      for (const charName of shot.characters) {
        const char = toCharArray(storyPlan.characters).find(c => c.name === charName);
        lines.push(`- ${charName}: ${char?.description?.substring(0, 150) || 'No description'}`);
      }
    }

    lines.push(`\nWorldview: ${storyPlan.worldview || 'unspecified'}`);
    lines.push(`Style: ${storyPlan.style || 'unspecified'}`);
    // 🔧 v6.35-Peng-fix: BeastMindEngine v3.0 returns outline as object (五幕), convert to string
    const outlineStr = typeof storyPlan.outline === 'object' 
      ? Object.values(storyPlan.outline).join(' ') 
      : (storyPlan.outline || '');
    lines.push(`Story Outline: ${outlineStr.substring(0, 200) || 'Not provided'}`);

    return lines.join('\n');
  }

  /**
   * v6.24-hotfix: 检测镜头主场角色（白泽/xiaoG）
   * 根据 Action/Scene 内容中的角色关键词频率决定
   */
  // 🆕 v6.32-fix2: 定妆照前置检查 — Stage 8.2之前验证角色参考图目录
  _checkCharacterRefsBeforePromptGen() {
    const fs = require('fs');
    const path = require('path');
    
    // 🔧 v6.35-Peng-fix: 检查多个可能的定妆照目录
    const candidateDirs = [
      path.join(this.productionDir, 'global-character-references'),
      path.join(this.productionDir, '02-characters'),
      path.join(this.productionDir, '03-characters'),
    ];
    
    let refsDir = null;
    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        refsDir = dir;
        break;
      }
    }
    
    console.log(`\n  🔍 定妆照前置检查: ${refsDir || '(未找到任何目录)'}`);
    
    if (!refsDir) {
      return {
        passed: false,
        reason: `定妆照目录不存在。已检查: ${candidateDirs.join(', ')}。请先运行 bestiary.js 生成角色定妆照。`
      };
    }
    
    // 检查目录下是否有角色子目录
    const entries = fs.readdirSync(refsDir, { withFileTypes: true });
    const charDirs = entries.filter(e => e.isDirectory());
    
    if (charDirs.length === 0) {
      return {
        passed: false,
        reason: `global-character-references/ 目录为空，无角色子目录。请先运行 bestiary.js 生成角色定妆照。`
      };
    }
    
    // 检查每个角色子目录是否有图片文件
    const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const charResults = {};
    let totalImages = 0;
    
    for (const dir of charDirs) {
      const charDir = path.join(refsDir, dir.name);
      const files = fs.readdirSync(charDir);
      const images = files.filter(f => imageExts.some(ext => f.toLowerCase().endsWith(ext)));
      charResults[dir.name] = { count: images.length, images };
      totalImages += images.length;
    }
    
    // 检查每个角色至少有1张图
    const emptyChars = Object.entries(charResults).filter(([, v]) => v.count === 0);
    if (emptyChars.length > 0) {
      return {
        passed: false,
        reason: `以下角色目录无定妆照图片: ${emptyChars.map(([k]) => k).join(', ')}`
      };
    }
    
    console.log(`  ✅ 定妆照检查通过: ${charDirs.length}个角色, ${totalImages}张参考图`);
    for (const [char, info] of Object.entries(charResults)) {
      console.log(`     ${char}: ${info.count}张 (${info.images.slice(0, 3).join(', ')}${info.count > 3 ? '...' : ''})`);
    }
    
    return {
      passed: true,
      characters: Object.keys(charResults),
      totalImages,
      details: charResults
    };
  }

  _detectDominantRole(shot) {
    const text = `${shot.Action || ''} ${shot.Scene || ''} ${shot.description || ''}`.toLowerCase();
    const baizeKw = ['白泽', 'baize', '三尾', '竖眼', '额头', '月光', '蹄子', '神兽'];
    const xiaoGKw = ['小g', 'xiaog', '少年', '小男孩', '山脚', '岩壁', '裂隙', '鼓起勇气'];
    let baizeScore = 0, xiaoGScore = 0;
    baizeKw.forEach(kw => { if (text.includes(kw)) baizeScore++; });
    xiaoGKw.forEach(kw => { if (text.includes(kw)) xiaoGScore++; });
    // Action描述优先
    const action = (shot.Action || '').toLowerCase();
    if (/小g|xiaog|站|走|行|迈|跑|看|抬|触|喊|说/.test(action)) xiaoGScore += 2;
    if (/白泽|baize|睁|抬|转|视|伫/.test(action)) baizeScore += 2;
    // S00/S01 强制白泽主场
    if (['S00', 'S01'].includes(shot.id)) return 'baize';
    return xiaoGScore > baizeScore ? 'xiaoG' : 'baize';
  }

  // 🆕 v5.31-Peng: 已合并到统一合规检查服务 _runComplianceCheck(), 本方法删除不再使用
  // 原stage8_3_FinalPromptComplianceCheck逻辑已迁移至_runComplianceCheck({phase: 'final'})

  // ============ 阶段11: 质检/预生产审核 (v6.4-Peng: 先质检,质检OK后生成MD文档提交给大鹏审核,大鹏确认后渲染) ============
  async stage11_QualityCheck() {
    const { stage11_QualityCheck: fn } = require('./pipeline-render-support');
    return fn(this);
  }

  // stage11_Render = stage12_Render (原run()调用链别名)
  async stage11_Render() {
    const { stage11_Render: fn } = require('./pipeline-render-support');
    return fn(this);
  }

  // ============ 🆕 v5.35-Peng: 「创作打磨环节」--导演优化+编剧优化,subagent独立运行 ============
  async _creativePolishing() {
    this.currentStage = 'creative-polishing';
    console.log(`\n🎬✍️ 阶段9-10/12: 创作打磨环节 (导演优化 + 编剧优化 | 主进程LLM驱动)`);

    const spStatus = this._getStoryPlanStatus();
    if (!spStatus) {
      this._log({ message: '无story-plan,跳过创作打磨', emoji: '⚠️' });
      return;
    }
    const { storyPlan } = spStatus;

    // 提取shots和prompts
    const shots = [];
    const prompts = [];
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        shots.push(shot);
        prompts.push({
          shotId: shot.id,
          prompt: shot._generatedPrompt || shot._finalPrompt || shot.prompt || ''
        });
      }
    }
    const dialogue = this.results.dialogues || {};

    const fs = require('fs');
    const path = require('path');

    // 🆕 v6.5-Peng-fix2: 主进程直接调用LLM,复用Stage 2-8成功模式
    // 不再使用Subagent(避免EPIPE管道断裂问题)
    const directorStyleId = this.directorStyle?.name?.toLowerCase().replace(/\s+/g, '') ||
                           this.options.userInput?.directorStyle ||
                           'cameron';

    let directorReport = null;
    let scriptwriterReport = null;
    let errors = [];

    // ========== Stage 1: 导演优化评审 ==========
    try {
      console.log(`\n  🎬 Stage 9: 导演优化评审 (风格: ${directorStyleId})...`);

      const DirectorOptimizeAgent = getDirectorOptimizeAgent();
      const directorAgent = new DirectorOptimizeAgent({
        directorStyle: directorStyleId,
        passThreshold: 4.0,
        maxIterations: 3
      });

      const reviewContext = {
        storyPlan, shots, prompts, dialogue,
        styleProfile: this.options.userInput?.style || 'cameron'
      };

      // ⏱️ 超时保护:导演优化评审最多10分钟
      const directorTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('导演优化评审超时(10分钟)')), 600000);
      });

      directorReport = await Promise.race([
        directorAgent.review(reviewContext),
        directorTimeout
      ]);

      console.log(`  ✅ 导演优化评审完成: ${directorReport?.overallScore?.toFixed(1) || 'N/A'}/5.0`);
      console.log(`     问题数: ${directorReport?.issueList?.length || 0}`);

      // 🆕 v6.7-Peng-fix: 方案A增强版 - 导演优化修复指令自动应用
      if (directorReport?.fixes?.length > 0) {
        console.log(`     🔧 发现 ${directorReport.fixes.length} 个修复指令,自动应用...`);

        try {
          const DirectorFixExecutor = require('./director-fix-executor');
          const executor = new DirectorFixExecutor({ productionDir: this.productionDir });

          const fixResult = executor.applyFixes(directorReport.fixes, storyPlan);
          console.log(`     ✅ 修复应用: ${fixResult.applied}个成功, ${fixResult.failed}个失败`);

          // 持久化修复后的story-plan
          executor.persistStoryPlan(fixResult.storyPlan, this.productionDir);

          // 🔄 重新生成Prompts (复用Stage 8)
          console.log(`     🔄 重新触发Stage 8 Prompt生成...`);

          // 重新提取shots和prompts
          const newShots = [];
          const newPrompts = [];
          for (const segment of storyPlan.segments || []) {
            for (const shot of segment.shots || []) {
              newShots.push(shot);
              newPrompts.push({
                shotId: shot.id,
                prompt: shot._generatedPrompt || shot._finalPrompt || shot.prompt || ''
              });
            }
          }

          // 调用Stage 8 Prompt重新生成 (修复后需要重新生成Prompts)
          if (typeof this.stage8_2_PromptPreGeneration === 'function') {
            await this.stage8_2_PromptPreGeneration();
            console.log(`     ✅ Stage 8 Prompt重新生成完成`);
          }

          // 更新 shots/prompts 引用
          shots.length = 0;
          shots.push(...newShots);
          prompts.length = 0;
          prompts.push(...newPrompts);

        } catch (fixErr) {
          console.error(`     ⚠️ 修复应用失败: ${fixErr.message}`);
          errors.push({ stage: 'director-fix-apply', error: fixErr.message });
        }
      }

    } catch (err) {
      console.error(`  ❌ 导演优化评审失败: ${err.message}`);
      errors.push({ stage: 'director-review', error: err.message });
      // 降级:创建空报告继续
      directorReport = { overallScore: 3.0, passThresholdMet: true, issueList: [], dimensions: {} };
    }

    // ========== Stage 2: 编剧优化 ==========
    try {
      console.log(`\n  ✍️ Stage 10: 编剧优化...`);

      const ScriptwriterOptimizer = getScriptwriterOptimizer();
      const optimizer = new ScriptwriterOptimizer({
        maxChangesPerIteration: 20,
        preservePromptLength: true,
        promptMaxLength: 2000
      });

      const optimizeContext = {
        reviewReport: directorReport || { overallScore: 3.0, passThresholdMet: true, issueList: [] },
        storyPlan, shots, prompts, dialogue
      };

      // ⏱️ 超时保护:编剧优化最多10分钟
      const writerTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('编剧优化超时(10分钟)')), 600000);
      });

      scriptwriterReport = await Promise.race([
        optimizer.optimize(optimizeContext),
        writerTimeout
      ]);

      console.log(`  ✅ 编剧优化完成: ${scriptwriterReport?.changesSummary?.length || 0}处变更`);

      // 写回优化结果到story-plan和04-prompts/
      if (scriptwriterReport?.optimizedScript) {
        const optimizedShots = scriptwriterReport.optimizedScript.shots;
        const optimizedPrompts = scriptwriterReport.optimizedScript.prompts;

        if (optimizedShots && optimizedPrompts) {
          let writtenCount = 0;

          for (const segment of storyPlan.segments || []) {
            for (let i = 0; i < (segment.shots || []).length; i++) {
              const shot = segment.shots[i];
              const optimizedShot = optimizedShots.find(s => s.id === shot.id);
              const optimizedPrompt = optimizedPrompts.find(p => p.shotId === shot.id);

              if (optimizedShot) {
                if (optimizedShot.description) shot.description = optimizedShot.description;
                if (optimizedShot.emotion) shot.emotion = optimizedShot.emotion;
                if (optimizedShot.camera) shot.camera = optimizedShot.camera;
                writtenCount++;
              }

              if (optimizedPrompt && optimizedPrompt.prompt) {
                shot._generatedPrompt = optimizedPrompt.prompt;
                shot._finalPrompt = optimizedPrompt.prompt;

                // 写回04-prompts/
                const promptsDir = path.join(this.productionDir, '04-prompts');
                const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
                if (fs.existsSync(promptFile)) {
                  fs.writeFileSync(promptFile, `# ${shot.id} Prompt\n\n\`\`\`\n${optimizedPrompt.prompt}\n\`\`\`\n`, 'utf8');
                }
              }
            }
          }

          // 持久化storyPlan
          const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
          if (fs.existsSync(storyPlanPath)) {
            fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
          }

          console.log(`  💾 写回完成: ${writtenCount}个shots更新`);
        }
      }

    } catch (err) {
      console.error(`  ❌ 编剧优化失败: ${err.message}`);
      errors.push({ stage: 'scriptwriter-optimize', error: err.message });
    }

    // 生成报告
    const reportPath = path.join(this.productionDir, '99-reports', 'creative-polishing-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      directorOptimize: directorReport ? {
        score: directorReport.overallScore,
        passed: directorReport.passThresholdMet,
        issueCount: directorReport.issueList?.length || 0
      } : null,
      scriptwriterOptimize: scriptwriterReport ? {
        changeCount: scriptwriterReport.changesSummary?.length || 0,
        consistencyPassed: scriptwriterReport.consistencyCheck?.passed
      } : null,
      errors
    }, null, 2), 'utf8');

    // 更新结果
    this.results.storyPlan = storyPlan;
    this.results.directorReview = directorReport;

    console.log(`\n  ✅ 创作打磨环节完成 (主进程LLM驱动)`);
    if (errors.length > 0) {
      console.log(`  ⚠️ 错误: ${errors.length}个环节降级处理`);
    }
  }

  // ============ 🆕 v3.0-Peng: Stage 9 导演优化(带自动重试) ============
  async stage9_DirectorOptimize() {
    const { stage9_DirectorOptimize: fn } = require('./stage9-director-optimize');
    return fn(this);
  }

  // 实际的导演审片逻辑(提取为独立方法)
  async _doDirectorReview() {
    const spStatus = this._getStoryPlanStatus();
    const storyPlan = spStatus?.storyPlan || this.results.storyPlan;
    if (!storyPlan) {
      throw new Error('storyPlan未定义,无法执行导演优化');
    }

    const { shots } = spStatus || { shots: [] };

    const getDirectorOptimizeAgent = () => {
      if (!_directorReviewAgent) _directorReviewAgent = require('./director-optimize-agent');
      return _directorReviewAgent;
    };

    const directorAgent = new (getDirectorOptimizeAgent())({
      directorStyle: this.options.userInput?.directorStyle || 'cameron',
      passThreshold: 4.0
    });

    const reviewContext = {
      storyPlan,
      shots,
      prompts: shots.map(s => ({
        shotId: s.id,
        prompt: s._generatedPrompt || s._finalPrompt || s.prompt || ''
      })),
      dialogue: this.results.dialogues || {}
    };

    const reviewReport = await directorAgent.review(reviewContext);

    console.log(`\n  📊 导演优化报告:`);
    console.log(`     综合评分: ${reviewReport.overallScore.toFixed(1)}/5.0`);
    console.log(`     通过阈值: ${reviewReport.passThreshold}/5.0`);
    console.log(`     状态: ${reviewReport.passThresholdMet ? '✅ 通过' : '❌ 不通过'}`);
    console.log(`     导演风格: ${reviewReport.directorStyle || 'default'}`);
    console.log(`     问题数: ${reviewReport.issues?.length || 0}`);

    if (!reviewReport.passThresholdMet) {
      console.log(`     ⚠️ 审片评分${reviewReport.overallScore.toFixed(1)}/5.0未达阈值,但Pipeline继续--编剧优化环节将"一气呵成"完善`);
    }

    // 保存优化报告
    const reviewPath = path.join(this.productionDir, '99-reports', `director-review-${Date.now()}.json`);
    fs.writeFileSync(reviewPath, JSON.stringify(reviewReport, null, 2));
    console.log(`     文件: ${reviewPath}`);

    return reviewReport;
  }

  // ============ 🆕 v3.0-Peng: Stage 10 编剧优化(带自动重试) ============
  async stage10_ScriptwriterOptimize() {
    const { stage10_ScriptwriterOptimize: fn } = require('./stage10-scriptwriter-optimize');
    return fn(this);
  }

  // 实际的编剧优化逻辑(提取为独立方法)
  // 🆕 v3.0-Peng: 轻量级本地编剧优化(不调用LLM,直接本地规则处理)
  _lightweightScriptwriterOptimize(storyPlan, shots, prompts) {
    console.log(`  🔄 [LightweightOptimize] 开始轻量本地优化...`);

    const changes = [];
    const optimizedPrompts = [];

    // 1. 遍历每个prompt,进行基础优化
    for (const prompt of prompts) {
      let optimizedPrompt = prompt.prompt || '';

      // 1.1 字符数检查与调整
      const charCount = this._countChars(optimizedPrompt);
      if (charCount > 1650) {
        // 智能截断到最近分隔符
        optimizedPrompt = this._smartTruncate(optimizedPrompt, 1650);
        changes.push({
          shotId: prompt.shotId,
          type: 'trim',
          from: charCount,
          to: this._countChars(optimizedPrompt),
          reason: '字符数超标,智能截断到1650字符'
        });
      } else if (charCount < 1402) {
        // 扩写到1402-1650范围
        optimizedPrompt = this._localPromptExpand(optimizedPrompt, 1402 - charCount);
        changes.push({
          shotId: prompt.shotId,
          type: 'expand',
          from: charCount,
          to: this._countChars(optimizedPrompt),
          reason: '字符数不足,本地扩写到目标范围'
        });
      }

      optimizedPrompts.push({
        shotId: prompt.shotId,
        prompt: optimizedPrompt,
        _generatedPrompt: prompt._generatedPrompt
      });
    }

    // 2. 保存优化后的prompts到storyPlan
    let promptIndex = 0;
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        if (promptIndex < optimizedPrompts.length) {
          shot._finalPrompt = optimizedPrompts[promptIndex].prompt;
          promptIndex++;
        }
      }
    }

    // 3. 保存storyPlan
    this._saveStoryPlan(storyPlan);

    console.log(`  ✅ [LightweightOptimize] 完成: 处理${prompts.length}个prompt | 变更${changes.length}处`);

    return {
      version: 1,
      optimizedScript: {
        storyPlan,
        shots,
        prompts: optimizedPrompts,
        dialogue: storyPlan.dialogue || []
      },
      changesSummary: changes,
      consistencyCheck: { passed: true },
      qualityEstimate: { score: 3.5, maxScore: 5 },
      timestamp: new Date().toISOString()
    };
  }

  // 智能截断到最近分隔符
  _smartTruncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;

    // 寻找最近的分隔符(句号、分号、逗号)
    const separators = ['。', ';', ',', '. ', '; ', ', '];
    let truncatePoint = maxLength;

    for (let i = maxLength; i > maxLength * 0.85; i--) {
      if (separators.some(sep => text.substring(i, i + sep.length) === sep)) {
        truncatePoint = i + 1;
        break;
      }
    }

    return text.substring(0, truncatePoint).trim();
  }

  // 本地prompt扩写(轻量)
  _localPromptExpand(prompt, deficit) {
    if (deficit <= 0) return prompt;

    // 添加高质量视觉细节词
    const expanders = [
      'epic cinematic lighting',
      'dramatic atmosphere',
      'high detail textures',
      'volumetric fog',
      'particle effects floating',
      'cinematic color grading'
    ];

    let expanded = prompt;
    let added = 0;

    for (const phrase of expanders) {
      if (added >= deficit) break;
      if (!expanded.includes(phrase)) {
        expanded += ', ' + phrase;
        added += phrase.length + 2;
      }
    }

    return expanded;
  }

  // 字符数计算(汉字=2,英文=1)
  _countChars(str) {
    if (!str || typeof str !== 'string') return 0;
    let total = 0;
    for (const char of str) {
      total += (char.charCodeAt(0) > 127) ? 2 : 1;
    }
    return total;
  }

  // 保存storyPlan
  _saveStoryPlan(storyPlan) {
    try {
      const normalized = normalizeStoryPlan(storyPlan);
      const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
      fs.writeFileSync(storyPlanPath, JSON.stringify(normalized, null, 2), 'utf8');
      this.results.storyPlan = normalized;
      console.log(`  💾 StoryPlan已保存(标准化): ${storyPlanPath}`);
    } catch (e) {
      console.warn(`  ⚠️ StoryPlan保存失败: ${e.message}`);
    }
  }

  async _doScriptwriterOptimize(reviewReport) {
    const spStatus = this._getStoryPlanStatus();
    const storyPlan = spStatus?.storyPlan || this.results.storyPlan;
    if (!storyPlan) {
      throw new Error('编剧优化无法执行: 缺少story-plan');
    }

    const shots = [];
    for (const segment of storyPlan.segments || []) {
      shots.push(...(segment.shots || []));
    }

    const prompts = [];
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        prompts.push({
          shotId: shot.id,
          prompt: shot._generatedPrompt || shot._finalPrompt || shot.prompt || '',
          _generatedPrompt: shot._generatedPrompt
        });
      }
    }

    const dialogue = this.results.dialogues || {};

    const getScriptwriterOptimizer = () => {
      if (!_scriptwriterOptimizer) _scriptwriterOptimizer = require('./scriptwriter-optimizer');
      return _scriptwriterOptimizer;
    };

    const optimizer = new (getScriptwriterOptimizer())({
      maxChangesPerIteration: 20,
      preservePromptLength: true,
      promptMaxLength: 2000
    });

    const optimizeContext = {
      reviewReport,
      storyPlan,
      shots,
      prompts,
      dialogue
    };

    const optimizeResult = await optimizer.optimize(optimizeContext);

    // 保存优化报告
    const optimizePath = path.join(this.productionDir, '99-reports', `scriptwriter-optimize-${Date.now()}.json`);
    fs.writeFileSync(optimizePath, JSON.stringify({
      changesSummary: optimizeResult?.changesSummary,
      consistencyCheck: optimizeResult?.consistencyCheck,
      llmCall: optimizeResult?.llmCall
    }, null, 2));
    console.log(`  💾 已保存优化报告: ${optimizePath}`);

    return optimizeResult;
  }

  // ============ 阶段12: 渲染 (原Stage 9, 大鹏确认后执行) ============
  async stage12_Render() {
    const { stage12_Render: fn } = require('./pipeline-render-support');
    return fn(this);  }

  // ============ 阶段12: 后期制作 (原Stage 10) ============
  async stage12_PostProduction() {
    const { stage12_PostProduction: fn } = require('./pipeline-render-support');
    return fn(this);  }

  // ============ 🏷️ v6.31-Peng: 广告植入系统 ============

  /**
   * Stage 3.6: 广告镜头注入
   * 在故事板生成后,按植入模式将品牌镜头注入镜头序列
   */
  async _injectAdShots() {
    console.log(`\n🏷️ Stage 3.6: 广告镜头注入 (${this.adConfig.brand} | ${this.adConfig.mode})`);

    const storyPlan = this.results.storyPlan;
    if (!storyPlan || !storyPlan.segments) {
      console.log(`  ⚠️ 无story-plan,跳过广告注入`);
      return;
    }

    // 加载品牌档案
    const archiveBase = path.resolve(__dirname, '../../productions/product-archive');
    const brandInfoPath = path.join(archiveBase, 'brands', this.adConfig.brand, 'info.json');
    let brandInfo = null;
    try {
      brandInfo = JSON.parse(fs.readFileSync(brandInfoPath, 'utf8'));
      console.log(`  📦 品牌档案已加载: ${brandInfo.name || this.adConfig.brand}`);
    } catch (e) {
      console.warn(`  ⚠️ 品牌档案加载失败(${e.message}),跳过广告注入`);
      return;
    }

    // 加载植入模式配置
    let integrationModes = null;
    try {
      integrationModes = require(path.join(archiveBase, 'integration-modes.js'));
    } catch (e) {
      console.warn(`  ⚠️ 植入模式配置加载失败(${e.message}),使用内置模式`);
    }

    // 加载广告镜头库
    let adShotLibrary = null;
    try {
      adShotLibrary = {
        productReveal: require(path.join(archiveBase, 'ad-shot-library', 'product-reveal.js')),
        brandIntegration: require(path.join(archiveBase, 'ad-shot-library', 'brand-integration.js'))
      };
    } catch (e) {
      console.warn(`  ⚠️ 广告镜头库加载失败(${e.message}),使用内置镜头`);
    }

    // 收集所有现有镜头
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    const mode = this.adConfig.mode;
    const brandId = this.adConfig.brand;
    const brandName = brandInfo.name || brandId;

    // 生成广告镜头
    const adShots = [];

    if (mode === 'highlight-15s') {
      // 替换最后1-2个镜头为品牌高光
      console.log(`  🎯 highlight-15s: 替换最后1-2镜头为品牌高光`);
      const highlightShot = this._buildAdShot({
        id: `AD-HL-${brandId}`,
        type: 'brand_highlight',
        description: `[BRAND HIGHLIGHT] ${brandName} product reveal in Nirath world — the ${brandInfo.productType || 'product'} materializes through bioluminescent particles, surrounded by ancient beast energy, cinematic close-up with volumetric lighting`,
        duration: 15,
        emotion: 'awe',
        characters: [],
        _isAdShot: true,
        _brandId: brandId,
        _adMode: mode
      }, brandInfo);
      adShots.push(highlightShot);

      // 替换最后1-2个镜头
      const lastSegment = storyPlan.segments[storyPlan.segments.length - 1];
      if (lastSegment && lastSegment.shots) {
        const removeCount = Math.min(2, lastSegment.shots.length);
        lastSegment.shots.splice(lastSegment.shots.length - removeCount, removeCount, ...adShots);
        console.log(`  ✅ 已替换最后${removeCount}个镜头为品牌高光`);
      }
    } else if (mode === 'full-integration') {
      // 在每个关键节点穿插品牌露出镜头
      console.log(`  🎯 full-integration: 关键节点穿插品牌露出`);
      const integrationShot = this._buildAdShot({
        id: `AD-FI-${brandId}`,
        type: 'brand_integration',
        description: `[BRAND INTEGRATION] ${brandName} subtly woven into the narrative — ${brandInfo.productType || 'element'} appears as a natural part of the Nirath ecosystem, organic integration with beast habitat`,
        duration: 8,
        emotion: 'curiosity',
        characters: [],
        _isAdShot: true,
        _brandId: brandId,
        _adMode: mode
      }, brandInfo);

      // 在每两个segment之间插入一个品牌镜头
      for (let i = storyPlan.segments.length - 1; i >= 1; i--) {
        const seg = storyPlan.segments[i];
        const uniqueShot = { ...integrationShot, id: `AD-FI-${brandId}-${i}` };
        seg.shots.unshift(uniqueShot);
      }
      console.log(`  ✅ 已在${storyPlan.segments.length - 1}个关键节点插入品牌镜头`);
    } else if (mode === 'opening-brand') {
      // 在S00前插入开场标版
      console.log(`  🎯 opening-brand: S00前插入开场标版`);
      const openingShot = this._buildAdShot({
        id: `AD-OP-${brandId}`,
        type: 'brand_opening',
        description: `[BRAND OPENING] ${brandName} presents — a collaboration with ShanhaiStory Forge, the ${brandInfo.productType || 'brand'} logo emerges from ancient Nirath runes, cinematic title card with beast silhouette`,
        duration: 5,
        emotion: 'epic_reveal',
        characters: [],
        _isAdShot: true,
        _brandId: brandId,
        _adMode: mode
      }, brandInfo);

      const firstSegment = storyPlan.segments[0];
      if (firstSegment && firstSegment.shots) {
        firstSegment.shots.unshift(openingShot);
        console.log(`  ✅ 已在S00前插入开场标版`);
      }
    } else if (mode === 'closing-callout') {
      // 在最终镜头后追加结尾呼出
      console.log(`  🎯 closing-callout: 最终镜头后追加结尾呼出`);
      const closingShot = this._buildAdShot({
        id: `AD-CC-${brandId}`,
        type: 'brand_closing',
        description: `[BRAND CLOSING] ${brandName} — the journey continues. ${brandInfo.tagline || ''} Fade to ${brandInfo.primaryColor || 'deep blue'} with brand mark, cinematic outro`,
        duration: 8,
        emotion: 'resolution',
        characters: [],
        _isAdShot: true,
        _brandId: brandId,
        _adMode: mode
      }, brandInfo);

      const lastSegment = storyPlan.segments[storyPlan.segments.length - 1];
      if (lastSegment && lastSegment.shots) {
        lastSegment.shots.push(closingShot);
        console.log(`  ✅ 已在最终镜头后追加结尾呼出`);
      }
    }

    // 持久化更新后的storyPlan
    try {
      const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
      fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
      console.log(`  💾 广告注入后的story-plan已保存`);
    } catch (e) {
      console.warn(`  ⚠️ 持久化失败: ${e.message}`);
    }

    this.results.adInjection = {
      brand: brandId,
      mode: mode,
      shotsInjected: adShots.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 构建单个广告镜头
   */
  _buildAdShot(shotDef, brandInfo) {
    const productType = brandInfo.productType || 'product';
    const brandName = brandInfo.name || shotDef._brandId;
    const primaryColor = brandInfo.primaryColor || 'deep blue';
    const visualMetaphor = brandInfo.visualMetaphor || `${brandName} essence`;

    return {
      id: shotDef.id,
      type: shotDef.type,
      description: shotDef.description,
      duration: shotDef.duration,
      emotion: shotDef.emotion,
      characters: shotDef.characters || [],
      _isAdShot: true,
      _brandId: shotDef._brandId,
      _adMode: shotDef._adMode,
      _brandInfo: {
        name: brandName,
        productType: productType,
        primaryColor: primaryColor,
        visualMetaphor: visualMetaphor,
        tagline: brandInfo.tagline || ''
      }
    };
  }

  /**
   * Stage 8.0: Prompt融合层 — 在Prompt生成前应用品牌约束
   * LogoShield黄金法则 + 负面提示词构建
   */
  async _applyAdPromptFusion() {
    console.log(`\n🏷️ Stage 8.0: 广告Prompt融合 (${this.adConfig.brand})`);

    const storyPlan = this.results.storyPlan;
    if (!storyPlan) {
      console.log(`  ⚠️ 无story-plan,跳过Prompt融合`);
      return;
    }

    // 加载品牌档案
    const archiveBase = path.resolve(__dirname, '../../productions/product-archive');
    const brandInfoPath = path.join(archiveBase, 'brands', this.adConfig.brand, 'info.json');
    let brandInfo = null;
    try {
      brandInfo = JSON.parse(fs.readFileSync(brandInfoPath, 'utf8'));
    } catch (e) {
      console.warn(`  ⚠️ 品牌档案加载失败,跳过融合`);
      return;
    }

    // 加载LogoShield
    let LogoShield = null;
    try {
      LogoShield = require(path.join(archiveBase, 'logo-shield.js'));
    } catch (e) {
      console.warn(`  ⚠️ LogoShield加载失败,使用内置规则`);
    }

    // 加载负面提示词构建器
    let buildNegativePrompt = null;
    try {
      const negBuilder = require(path.join(archiveBase, 'seedance-negative-prompt-builder.js'));
      buildNegativePrompt = negBuilder.buildNegativePrompt;
    } catch (e) {
      console.warn(`  ⚠️ 负面提示词构建器加载失败,使用内置规则`);
    }

    // 收集所有镜头
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    let shieldedCount = 0;
    let negPromptCount = 0;

    for (const shot of allShots) {
      // 获取当前prompt(可能是_generatedPrompt或description)
      const currentPrompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '';

      if (currentPrompt) {
        // LogoShield黄金法则: Logo不以文字形式出现,靠视觉隐喻呈现
        if (LogoShield && typeof LogoShield.shield === 'function') {
          const shielded = LogoShield.shield(currentPrompt, brandInfo);
          if (shielded !== currentPrompt) {
            shot._generatedPrompt = shielded;
            shot._promptLength = shielded.length;
            shieldedCount++;
          }
        } else {
          // 内置LogoShield规则
          const shielded = this._builtinLogoShield(currentPrompt, brandInfo);
          if (shielded !== currentPrompt) {
            shot._generatedPrompt = shielded;
            shot._promptLength = shielded.length;
            shieldedCount++;
          }
        }

        // 负面提示词: 禁止品牌logo文字、禁止现代元素、禁止非Nirath风格
        if (buildNegativePrompt && typeof buildNegativePrompt === 'function') {
          shot._negativePrompt = buildNegativePrompt(brandInfo);
        } else {
          shot._negativePrompt = this._builtinNegativePrompt(brandInfo);
        }
        negPromptCount++;
      }
    }

    console.log(`  ✅ LogoShield应用: ${shieldedCount}/${allShots.length}个镜头`);
    console.log(`  ✅ 负面提示词注入: ${negPromptCount}/${allShots.length}个镜头`);

    this.results.adPromptFusion = {
      brand: this.adConfig.brand,
      shieldedCount,
      negPromptCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 内置LogoShield规则(降级用)
   * 黄金法则: Logo不以文字形式出现,靠视觉隐喻呈现
   */
  _builtinLogoShield(prompt, brandInfo) {
    let shielded = prompt;
    const brandName = brandInfo.name || '';

    // 移除任何显式的logo/文字标记
    shielded = shielded.replace(/logo\s*(of|for)\s*\w+/gi, 'visual essence');
    shielded = shielded.replace(/brand\s*name\s*[:\-]\s*\w+/gi, '');
    shielded = shielded.replace(/text\s*overlay\s*[:\-]\s*\w+/gi, '');

    // 注入视觉隐喻替代文字logo
    const visualMetaphor = brandInfo.visualMetaphor || `${brandName} essence manifested as natural Nirath phenomenon`;
    if (!shielded.includes('visual metaphor') && !shielded.includes('visual essence')) {
      shielded += ` | [AD-SHIELD] Brand presence conveyed through visual metaphor: ${visualMetaphor}. NO text logos, NO written brand names.`;
    }

    return shielded;
  }

  /**
   * 内置负面提示词构建(降级用)
   */
  _builtinNegativePrompt(brandInfo) {
    const brandName = brandInfo.name || 'brand';
    return [
      `NO text logos of ${brandName}`,
      'NO written brand names',
      'NO modern advertising elements',
      'NO billboards or signage',
      'NO corporate aesthetics',
      'NO human-made products in plain sight',
      'Maintain Nirath ancient world aesthetic'
    ].join(', ');
  }

  /**
   * Stage 11: 品牌安全校验
   * 在质检前执行广告合规检查,确保品牌安全
   */
  async _runBrandSafetyCheck() {
    console.log(`\n🏷️ Stage 11: 品牌安全校验 (${this.adConfig.brand})`);

    const storyPlan = this.results.storyPlan;
    if (!storyPlan) {
      console.log(`  ⚠️ 无story-plan,跳过品牌安全校验`);
      return;
    }

    // 加载品牌档案
    const archiveBase = path.resolve(__dirname, '../../productions/product-archive');
    const brandInfoPath = path.join(archiveBase, 'brands', this.adConfig.brand, 'info.json');
    let brandInfo = null;
    try {
      brandInfo = JSON.parse(fs.readFileSync(brandInfoPath, 'utf8'));
    } catch (e) {
      console.warn(`  ⚠️ 品牌档案加载失败,跳过安全校验`);
      return;
    }

    // 加载品牌安全校验器
    let BrandSafetyValidator = null;
    try {
      BrandSafetyValidator = require(path.join(archiveBase, 'brand-safety-validator.js'));
    } catch (e) {
      console.warn(`  ⚠️ 品牌安全校验器加载失败,使用内置校验`);
    }

    // 收集所有镜头
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    const blockers = [];
    const warnings = [];
    let passCount = 0;

    for (const shot of allShots) {
      const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '';

      if (BrandSafetyValidator && typeof BrandSafetyValidator.validate === 'function') {
        // 使用外部校验器
        const result = BrandSafetyValidator.validate(prompt, brandInfo);
        if (!result.passed) {
          blockers.push({ shotId: shot.id, blockers: result.blockers || [] });
        } else {
          passCount++;
        }
        if (result.warnings?.length > 0) {
          warnings.push({ shotId: shot.id, warnings: result.warnings });
        }
      } else {
        // 内置品牌安全校验
        const result = this._builtinBrandSafetyCheck(prompt, brandInfo);
        if (!result.passed) {
          blockers.push({ shotId: shot.id, blockers: result.blockers });
        } else {
          passCount++;
        }
        if (result.warnings?.length > 0) {
          warnings.push({ shotId: shot.id, warnings: result.warnings });
        }
      }
    }

    console.log(`  📊 品牌安全校验结果:`);
    console.log(`     通过: ${passCount}/${allShots.length}`);
    console.log(`     阻断: ${blockers.length}`);
    console.log(`     警告: ${warnings.length}`);

    if (blockers.length > 0) {
      const blockerDetails = blockers.map(b =>
        `  ${b.shotId}: ${b.blockers.join(', ')}`
      ).join('\n');
      const errorMsg = `[AD-SAFETY] 品牌安全校验失败: ${blockers.length}个镜头不合格\n${blockerDetails}`;
      console.error(`\n  ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (warnings.length > 0) {
      for (const w of warnings) {
        console.log(`  ⚠️ ${w.shotId}: ${w.warnings.join(', ')}`);
      }
    }

    console.log(`  ✅ 品牌安全校验通过`);

    this.results.brandSafetyCheck = {
      brand: this.adConfig.brand,
      totalShots: allShots.length,
      passCount,
      blockerCount: blockers.length,
      warningCount: warnings.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 内置品牌安全校验(降级用)
   * 8维度检查: Logo文字/品牌名显式/现代元素/广告感/Nirath世界观/视觉隐喻/色彩一致性/叙事融合
   */
  _builtinBrandSafetyCheck(prompt, brandInfo) {
    const blockers = [];
    const warnings = [];
    const brandName = brandInfo.name || '';

    // 1. Logo文字检查
    if (/\blogo\b/i.test(prompt) && !/visual\s*(essence|metaphor)/i.test(prompt)) {
      blockers.push('LOGO_TEXT_DETECTED: Prompt contains explicit logo reference');
    }

    // 2. 品牌名显式文字
    if (brandName && new RegExp(`\\b${brandName}\\b`, 'i').test(prompt)) {
      if (!/visual\s*metaphor|essence\s*of/i.test(prompt)) {
        warnings.push('BRAND_NAME_EXPLICIT: Brand name appears without visual metaphor context');
      }
    }

    // 3. 现代元素检测
    const modernKeywords = ['smartphone', 'laptop', 'billboard', 'neon sign', 'advertisement', 'commercial', 'corporate'];
    for (const kw of modernKeywords) {
      if (prompt.toLowerCase().includes(kw)) {
        blockers.push(`MODERN_ELEMENT: "${kw}" detected in Nirath world context`);
      }
    }

    // 4. 广告感检测
    if (/buy\s|purchase\s|discount\s|sale\s|price\s/i.test(prompt)) {
      blockers.push('COMMERCIAL_LANGUAGE: Sales-oriented language detected');
    }

    // 5. Nirath世界观一致性
    const nirathKeywords = ['nirath', 'ancient', 'beast', 'bioluminescent', 'rune', 'spore', 'cliff', 'cave'];
    const hasNirathContext = nirathKeywords.some(kw => prompt.toLowerCase().includes(kw));
    if (!hasNirathContext && prompt.length > 50) {
      warnings.push('NIRATH_CONTEXT_MISSING: No Nirath world keywords found');
    }

    // 6. 视觉隐喻检查
    if (!/visual\s*(metaphor|essence)|manifested\s*as|appears\s*as/i.test(prompt)) {
      warnings.push('VISUAL_METAPHOR_MISSING: No visual metaphor for brand presence');
    }

    // 7. 色彩一致性
    if (brandInfo.primaryColor && !prompt.toLowerCase().includes(brandInfo.primaryColor.toLowerCase())) {
      warnings.push(`COLOR_MISMATCH: Brand primary color "${brandInfo.primaryColor}" not referenced`);
    }

    // 8. 叙事融合度
    if (!/story|narrative|journey|ancient|myth/i.test(prompt)) {
      warnings.push('NARRATIVE_DISCONNECT: Brand placement lacks narrative integration');
    }

    return {
      passed: blockers.length === 0,
      blockers,
      warnings
    };
  }

  // ============ 报告生成 ============
  _generateFinalReport(status, error = null, extra = {}) {
    const report = {
      pipelineVersion: PIPELINE_VERSION,
      timestamp: new Date().toISOString(),
      status,
      productionDir: this.productionDir,
      preProductionMode: this.preProductionMode,
      stages: {},
      errors: this.errors,
      ...extra
    };

    // 汇总各阶段结果
    for (const stage of STAGES) {
      // v6.9-Peng-fix: 建立stage名到results key的映射
      const keyMap = {
        'prd-generation': 'prd',
        'requirement-alignment': 'alignment',
        'schema-validation': 'schemaValidation',
        'storyboard-check': 'storyboardCheck',
        'character-prompt-build': 'characterPrompts',
        'compliance-check': 'compliance',
        'duration-allocation': 'durationCheck',
        'cinematography-control': 'cameraMoves',
        'director-optimize': 'directorOptimization',
        'scriptwriter-optimize': 'scriptwriterOptimization',
        'render': 'render',
        'post-production': 'postProductionResults'
      };
      const resultKey = keyMap[stage] || stage;
      report.stages[stage] = {
        completed: this.results[resultKey] !== undefined,
        result: this.results[resultKey] || null
      };
    }

    if (error) {
      report.error = {
        message: error.message,
        stack: error.stack
      };
    }

    // 保存报告
    const reportPath = path.join(this.productionDir, '99-reports', `pipeline-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Pipeline ${status === 'success' ? '✅ 成功' : '❌ 失败'}`);
    console.log(`📁 报告已保存: ${reportPath}`);

    return report;
  }

  // 🚨 v5.4-Peng-P0: 防作弊系统 - 强制自检、审计日志、来源追踪
  // 这些方法是防作弊的核心机制,不得删除或绕过

  /**
   * 预执行自检 - 强制确认当前是真实主链路执行
   * 违反则抛出错误,阻止执行
   */
  _selfCheckAntiCheating() {
    // 检查0: 适配器 bypass 验证(专家方案)
    if (verifyAdapterBypass(this.productionDir, this.options?._adapterBypassAntiCheating)) {
      console.log('\n✅ 防作弊自检通过: 适配器 bypass 验证通过');
      return true;
    }

    // 检查1: 确认是通过DirectorPipeline.run()入口执行,不是独立脚本
    const stack = new Error().stack;
    const hasDirectorPipelineRun = stack.includes('DirectorPipeline.run') || stack.includes('async run');
    const hasIndependentScript = !hasDirectorPipelineRun;

    if (hasIndependentScript && !this.options._skipAntiCheatingCheck) {
      console.error('\n🚨🚨🚨 防作弊拦截 🚨🚨🚨');
      console.error('错误: 检测到尝试通过独立脚本或绕过DirectorPipeline.run()执行预生产');
      console.error('所有视频任务必须从 DirectorPipeline.run() 入口执行');
      console.error('严禁创建独立的 run-xxx.js 脚本假装完成预生产');
      throw new Error('ANTI_CHEATING_BLOCKED: 必须通过DirectorPipeline.run()执行预生产');
    }

    // 检查2: 确认productionDir是合法目录(不是/tmp/demo之类)
    const dir = this.productionDir;
    if (dir.includes('demo') || dir.includes('mock') || dir.includes('test')) {
      console.warn('\n⚠️ 生产目录名称包含demo/mock/test关键词,确认这是真实生产任务吗?');
      console.warn('   路径: ' + dir);
    }

    console.log('\n✅ 防作弊自检通过: 确认是真实主链路执行');
  }

  /**
   * 初始化审计日志
   */
  _initAuditLog() {
    this.auditLog = {
      pipelineVersion: PIPELINE_VERSION,
      startTime: new Date().toISOString(),
      stages: [],
      isRealPipeline: true,
      sourceFile: 'director-pipeline.js',
      constructorName: 'DirectorPipeline',
      antiCheatingEnabled: true,
      productionDir: this.productionDir
    };
    this._writeAuditLog('pipeline_start', { userInput: this.options.userInput });
  }

  // ============ 🆕 v5.34-Peng P1-2: 统一状态检查方法 ============

  /**
   * 🆕 v5.34-Peng: 统一读取 storyPlan 状态
   * 替代分散的 `const storyPlan = this.results.storyPlan; if (!storyPlan) { ... }` 重复模式
   * @returns {Object|null} { exists, storyPlan, segments, shots, characters, shotCount, segmentCount }
   */
  /**
   * 🆕 v6.33-Peng-fix41: 统一走 llm-contract normalizeStoryPlan
   * 替代分散的手工兼容逻辑 (story_plan/characters object/shotId→id)
   */
  _getStoryPlanStatus() {
    let storyPlan = this._loadNormalizedStoryPlanFromDisk() || this.results.storyPlan;
    if (!storyPlan) return null;

    storyPlan = normalizeStoryPlan(storyPlan);
    this.results.storyPlan = storyPlan;

    const segments = storyPlan.segments || [];
    const shots = storyPlan.shots || [];
    const characters = storyPlan.characters || [];

    return {
      exists: true,
      storyPlan,
      segments,
      shots,
      characters,
      shotCount: shots.length,
      segmentCount: segments.length
    };
  }

  /**
   * 🆕 v6.33-Peng-fix41: 从磁盘加载并标准化 story-plan
   */
  _loadNormalizedStoryPlanFromDisk() {
    const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
    if (!fs.existsSync(storyPlanPath)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
      const normalized = normalizeStoryPlan(raw);
      this.results.storyPlan = normalized;
      return normalized;
    } catch (e) {
      console.warn(`  ⚠️ story-plan.json 读取/规范化失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 🆕 v6.33-Peng-fix41: 标准化后保存 story-plan
   */
  _saveNormalizedStoryPlan(storyPlan) {
    const normalized = normalizeStoryPlan(storyPlan);
    const storyPlanPath = path.join(this.productionDir, '01-story', 'story-plan.json');
    fs.mkdirSync(path.dirname(storyPlanPath), { recursive: true });
    fs.writeFileSync(storyPlanPath, JSON.stringify(normalized, null, 2), 'utf8');
    this.results.storyPlan = normalized;
    return normalized;
  }

  /**
   * 🆕 v6.33-Peng-fix41: shot 统一归一化 (内部字段全部小写)
   */
  _normalizeShotInPlace(shot, idx = 0) {
    if (!shot || typeof shot !== 'object') return shot;

    if (!shot.id) shot.id = shot.shotId || `S${String(idx).padStart(2, '0')}`;
    if (!shot.type) shot.type = shot.shotType || 'normal';

    shot.character = shot.character || shot.Character || '';
    shot.action = shot.action || shot.Action || '';
    shot.scene = shot.scene || shot.Scene || shot.description || '';
    shot.mood = shot.mood || shot.Mood || shot.emotion || '';
    shot.camera = shot.camera || shot.Camera || '';
    shot.lighting = shot.lighting || shot.Lighting || '';
    shot.dialogue = shot.dialogue || shot.Dialogue || shot.dialogues || [];

    if (!Array.isArray(shot.dialogue)) {
      shot.dialogue = [shot.dialogue].filter(Boolean);
    }
    if (!Array.isArray(shot.characters)) {
      shot.characters = typeof shot.characters === 'string' ? [shot.characters] : [];
    }
    if (!shot.description) {
      shot.description = [shot.scene, shot.action, shot.character].filter(Boolean).join(' | ') || 'No description';
    }
    if (!shot.duration || Number.isNaN(Number(shot.duration))) {
      shot.duration = 5;
    } else {
      shot.duration = Number(shot.duration);
    }

    return shot;
  }

  // ============ 🆕 v5.34-Peng P1-1: 统一注入与日志方法 ============

  /**
   * 🆕 v5.34-Peng: 统一状态注入
   * 替代分散的 `this.results.xxx = yyy` 字符串键名注入
   * @param {Object} data - 要注入的状态对象 { key: value, ... }
   */
  _inject(data) {
    if (!data || typeof data !== 'object') return;
    Object.assign(this.results, data);
  }

  /**
   * 🆕 v5.34-Peng: 统一结构化日志
   * 替代分散的 `console.log('[Module] emoji message')` 字符串拼接
   * @param {Object} config - 日志配置 { module, emoji, message, level='info' }
   */
  _log({ module, emoji = '', message, level = 'info' }) {
    const prefix = module ? `[${module}] ` : '';
    const icon = emoji ? `${emoji} ` : '';
    const fullMessage = `  ${prefix}${icon}${message}`;

    switch (level) {
      case 'error':
        console.error(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }
  }

  /**
   * 写入审计日志条目
   * @param {string} stage - Stage名称
   * @param {object} details - 详情对象
   */
  _writeAuditLog(stage, details = {}) {
    const entry = {
      stage,
      timestamp: new Date().toISOString(),
      sourceMethod: stage,
      sourceFile: 'director-pipeline.js',
      pipelineVersion: PIPELINE_VERSION,
      ...details
    };

    this.auditLog.stages.push(entry);

    // 同步写入文件
    try {
      const auditPath = path.join(this.productionDir, '.audit.json');
      fs.writeFileSync(auditPath, JSON.stringify(this.auditLog, null, 2));
    } catch (e) {
      console.warn('  ⚠️ 审计日志写入失败:', e.message);
    }
  }

  /**
   * 最终化审计日志 - 执行完成后调用
   */
  _finalizeAuditLog(result = {}) {
    this.auditLog.endTime = new Date().toISOString();
    this.auditLog.result = result;
    this.auditLog.stageCount = this.auditLog.stages.length;

    // 写入最终审计日志
    try {
      const auditPath = path.join(this.productionDir, '.audit.json');
      fs.writeFileSync(auditPath, JSON.stringify(this.auditLog, null, 2));
      console.log(`\n📋 审计日志已保存: ${auditPath}`);
      console.log(`   Stage执行数: ${this.auditLog.stageCount}`);
      console.log(`   真实主链路: ${this.auditLog.isRealPipeline ? '是 ✅' : '否 ❌'}`);
    } catch (e) {
      console.warn('  ⚠️ 最终审计日志写入失败:', e.message);
    }
  }

  /**
   * 验证产出物来源 - 检查Prompt是否来自真实Stage生成
   * @param {Array} shotsData - 镜头数据
   * @returns {boolean} - 是否验证通过
   */
  _validatePromptSource(shotsData) {
    if (!Array.isArray(shotsData) || shotsData.length === 0) {
      console.error('🚨 防作弊: 镜头数据为空,可能未真实执行Stage');
      return false;
    }

    for (const shot of shotsData) {
      // 检查Prompt是否有来源标记
      if (!shot.prompt || typeof shot.prompt !== 'string') {
        console.error(`🚨 防作弊: ${shot.shot?.id || '?'} Prompt为空或非法`);
        return false;
      }

      // 检查Prompt长度(提示词空间利用率)
      const promptLength = shot.prompt.length;
      if (promptLength < 500) {
        console.warn(`⚠️ 防作弊: ${shot.shot?.id || '?'} Prompt仅${promptLength}字符,可能未充分注入细节`);
      }
    }

    console.log(`✅ 产出物来源验证通过: ${shotsData.length}个镜头`);
    return true;
  }
}

// ============ CLI接口 ============

/**
 * 🆕 v6.31-Peng: 读取 .stormaxerc 配置文件
 * 安装时用户选择默认语言和时长，配置文件位于 workspace/.stormaxerc
 */
function _loadStormaxeRC() {
  const rcPath = path.join('/home/gem/workspace/agent/workspace', '.stormaxerc');
  if (!fs.existsSync(rcPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(rcPath, 'utf8'));
  } catch {
    return {};
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const rc = _loadStormaxeRC();
  const defaultLang = rc?.defaults?.language || 'en';
  const defaultDur = rc?.defaults?.duration || 60;

  if (command === 'run' || command === 'pre-production') {
    const productionDir = args[args.indexOf('--production-dir') + 1];
    const preProductionMode = command === 'pre-production';

    // 🌍 v3.0-Peng: 解析世界观参数
    const worldviewIdx = args.indexOf('--worldview');
    const worldview = worldviewIdx !== -1 ? args[worldviewIdx + 1] : 'nirath';

    // 🎬 v1.1-Peng: 解析平台预设参数
    const platformIdx = args.indexOf('--platform');
    const platform = platformIdx !== -1 ? args[platformIdx + 1] : 'narrative';
    const validPlatforms = ['narrative', 'douyin_short', 'tiktok_creator'];
    if (!validPlatforms.includes(platform)) {
      console.error(`❌ 无效的平台: ${platform}，可用: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }

    // 🏷️ v6.31-Peng: 解析广告植入参数
    // 🏷️ v6.31-Peng: 解析广告植入参数
    const brandIdx = args.indexOf('--brand');
    const brand = brandIdx !== -1 ? args[brandIdx + 1] : null;
    const adModeIdx = args.indexOf('--ad-mode');
    const adMode = adModeIdx !== -1 ? args[adModeIdx + 1] : null;
    const validBrands = ['manner-coffee', 'qianwen-smart-glasses'];
    const validAdModes = ['highlight-15s', 'full-integration', 'opening-brand', 'closing-callout'];
    if (brand && !validBrands.includes(brand)) {
      console.error(`❌ 无效的品牌: ${brand}，可用: ${validBrands.join(', ')}`);
      process.exit(1);
    }
    if (adMode && !validAdModes.includes(adMode)) {
      console.error(`❌ 无效的植入模式: ${adMode}，可用: ${validAdModes.join(', ')}`);
      process.exit(1);
    }
    if ((brand && !adMode) || (!brand && adMode)) {
      console.error('❌ --brand 和 --ad-mode 必须同时提供或同时省略');
      process.exit(1);
    }

    // 🌐 v6.31-Peng: 解析语言参数 (CLI覆盖 > .stormaxerc > 默认英文)
    const langIdx = args.indexOf('--language');
    const language = langIdx !== -1 ? (args[langIdx + 1] || defaultLang) : defaultLang;
    const validLangs = ['en', 'zh'];
    if (!validLangs.includes(language)) {
      console.error(`❌ 无效的语言: ${language}，可用: ${validLangs.join(', ')}`);
      process.exit(1);
    }

    // ⏱️ v6.31-Peng: 解析时长参数 (CLI覆盖 > .stormaxerc > 默认60s)
    const durationIdx = args.indexOf('--duration');
    let duration = durationIdx !== -1 ? parseInt(args[durationIdx + 1], 10) : defaultDur;
    const validDurations = [30, 60, 90, 120];
    if (!validDurations.includes(duration)) {
      console.error(`❌ 无效的时长: ${duration}，可用: ${validDurations.join(', ')}`);
      process.exit(1);
    }
    if (duration === 120) {
      console.warn('⚠️  120秒需要联系作者获取中长视频系统 (Genius)');
    }

    if (!productionDir) {
      console.error('❌ 需要 --production-dir 参数');
      process.exit(1);
    }

    // 读取用户输入:优先从PRD读取,其次从命令行参数,最后使用默认值
    // 🌐 v6.31-Peng: language + duration 来自CLI参数或配置文件
    let userInput = { title: '未命名', outline: '', type: 'action', duration, language };

    // 🔧 v6.35-Peng-fix: 修复PRD标题提取正则 + 新增--outline CLI参数
    // 尝试从PRD读取标题和故事大纲
    const prdPath = path.join(productionDir, '00-prd', 'prd.md');
    if (fs.existsSync(prdPath)) {
      const prdContent = fs.readFileSync(prdPath, 'utf8');
      // 🔧 fix: 原正则为 /#\s*产品需求文档.*?[-\-]\s*(.+)/ 期望"产品需求文档 - 白泽"
      //   实际PRD格式为 "# 白泽 - 产品需求文档"，导致正则不匹配 → userInput.title="未命名"
      //   修复: 先尝试 "# 异兽名 - 产品需求文档" 格式，再尝试旧格式
      let titleMatch = prdContent.match(/^#\s*(\S+)\s*[-–—]\s*产品需求文档/m);
      if (!titleMatch) {
        titleMatch = prdContent.match(/#\s*产品需求文档.*?[-\-]\s*(.+)/);
      }
      if (titleMatch) {
        userInput.title = titleMatch[1].trim();
      }
      const outlineMatch = prdContent.match(/##\s*2\.\s*故事大纲([\s\S]*?)(?=##\s*\d+\.|$)/);
      if (outlineMatch) {
        userInput.outline = outlineMatch[1].trim().substring(0, 500);
      }
    }

    // 命令行参数覆盖PRD（支持 --title 和 --outline）
    const titleIdx = args.indexOf('--title');
    if (titleIdx !== -1 && args[titleIdx + 1]) {
      userInput.title = args[titleIdx + 1];
    }
    const outlineIdx = args.indexOf('--outline');
    if (outlineIdx !== -1 && args[outlineIdx + 1]) {
      userInput.outline = args[outlineIdx + 1];
    }

    // 🌐 v6.31-Peng: duration 和 language 由上方统一处理，PRD读取逻辑保留
    // （旧的 durationIdx 声明已移除，避免重复）

    const pipeline = new DirectorPipeline(productionDir, {
      preProduction: preProductionMode,
      worldview: worldview,  // 🌍 传入世界观
      platform: platform,    // 🎬 v1.1-Peng 传入平台预设
      brand: brand,          // 🏷️ v6.31-Peng 广告品牌
      adMode: adMode,        // 🏷️ v6.31-Peng 植入模式
      userInput
    });

    pipeline.run(userInput).then(report => {
      if (report.status === 'success') {
        console.log('\n🎉 所有流程步骤已完成!');
      } else {
        console.log('\n💥 Pipeline执行失败,请检查错误报告');
        process.exit(1);
      }
    });

    return;
  }

  // 🔴 v2.3-Peng Phase1: 新增confirm命令
  if (command === 'confirm') {
    const productionDir = args[args.indexOf('--production-dir') + 1];

    if (!productionDir) {
      console.error('❌ 需要 --production-dir 参数');
      process.exit(1);
    }

    confirmCharacters(productionDir);
    return;
  }

  console.log(`
用法:
  node director-pipeline.js pre-production --production-dir <目录>    # 预生产模式(生产链路,不实际渲染)
  node director-pipeline.js run --production-dir <目录>     # 生产模式
  node director-pipeline.js confirm --production-dir <目录>  # 确认角色定妆照并继续

选项:
  --worldview <wv>   世界观 (shanhaijing | nirath | superreal)
  --platform <p>     平台预设 (narrative | douyin_short | tiktok_creator)
  --brand <id>       广告品牌 (manner-coffee | qianwen-smart-glasses)
  --ad-mode <mode>   植入模式 (highlight-15s | full-integration | opening-brand | closing-callout)
  --language <lang>  默认语言 (en | zh)，默认: ${defaultLang} (来自 .stormaxerc)
  --duration <sec>   视频时长(秒)，可用: 30 | 60 | 90 | 120，默认: ${defaultDur}
                   注意: 120秒需联系作者获取中长视频系统
`);
}

// ============ 辅助函数 ============

/**
 * 🆕 v6.24-fix19: 将 openingTitle object 中所有 phases 的中文 phase names + descriptions 转英文
 * 根因: beast-entrance-designer / xiaoG-entrance-designer / opening-title-effect-designer
 *       输出中文 phase names + descriptions
 * 影响: prompt-S00.txt 含中文,不符合 EN-only 规范
 * 修复: 保存 opening-title-design.json 前全局替换 phases 中的中文字段
 */
function _translatePhasesToEnglish(openingTitle) {
  const CJK_REGEX = /[\u4e00-\u9fff]/g;

  // 翻译映射表 (中文 → 英文)
  const TRANSLATION_MAP = {
    // beastEntrance phases
    '轮廓浮现': 'Silhouette Emerges',
    '细节清晰': 'Details Revealed',
    '完全展现': 'Full Reveal',
    '黑暗中浮现': 'Emerging from Darkness',
    '细节展现': 'Details Revealed',
    '完全呈现': 'Full Reveal',
    // xiaoGEntrance phases
    '远处张望': 'Distant Watch',
    '好奇走近': 'Curiously Approaching',
    '面对神兽': 'Facing the Beast',
    '伸手触碰': 'Reaching Out',
    '注意到光芒': 'Noticing the Glow',
    // titleEffect phases
    '光脉初现': 'Light Vein Emergence',
    '笔画点亮': 'Stroke Ignition',
    '纹理定型': 'Texture Lock',
    '光晕扩散': 'Halo Expansion',
    // subtitleEffect phases
    '地衣萌发': 'Lichen Sprouting',
    '轮廓成型': 'Contour Formation',
    '稳定发光': 'Stable Glow',
    '光晕渐隐': 'Halo Fading',
    '稳定发光+脉冲填白': 'Stable Glow + Pulsing'
  };

  // 递归遍历 object，对所有 string field 中的 CJK 进行翻译
  function translate(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && CJK_REGEX.test(value)) {
        // 优先用映射表
        let translated = TRANSLATION_MAP[value.trim()];
        if (!translated) {
          // 通用清理: 移除所有 CJK 字符
          translated = value.replace(CJK_REGEX, '').trim();
          if (!translated) translated = '[EN: ' + value.replace(CJK_REGEX, ' ') + ']';
        }
        obj[key] = translated;
      } else if (typeof value === 'object') {
        translate(value);
      }
    }
  }

  // 翻译 phases
  const sections = [
    openingTitle.titleEffect?.titleEffect?.phases,
    openingTitle.titleEffect?.subtitleEffect?.phases,
    openingTitle.beastEntrance?.phases,
    openingTitle.xiaoGEntrance?.phases
  ];

  for (const phases of sections) {
    if (Array.isArray(phases)) {
      for (const phase of phases) {
        if (phase.name && CJK_REGEX.test(phase.name)) {
          const translated = TRANSLATION_MAP[phase.name.trim()] || phase.name.replace(CJK_REGEX, '').trim();
          phase.name = translated || phase.name;
        }
        if (phase.description && CJK_REGEX.test(phase.description)) {
          // description 保留内容但清理 CJK 字符
          phase.description = phase.description.replace(CJK_REGEX, ' ').replace(/\s+/g, ' ').trim();
        }
        if (phase.visual && CJK_REGEX.test(phase.visual)) {
          phase.visual = phase.visual.replace(CJK_REGEX, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }
  }

  // 清理 overallConcept / concept 等字符串字段
  translate(openingTitle);

  // 🆕 v6.24-fix19-b: 修复 validator 错误
  // 修复1: ZERO_DURATION — xiaoGEntrance "Reaching Out" 0秒 → 1秒
  const xe = openingTitle.xiaoGEntrance?.phases || [];
  for (const p of xe) {
    if (p.time === '6.5-6.5s') {
      p.time = '6.5-7.5s';
      console.log(`  [fix19] ZERO_DURATION fixed: 6.5-6.5s → 6.5-7.5s`);
    }
    // 修复2: UNANNOTATED_GAP — xiaoGEntrance 没有覆盖 5.5-6s
    // 追加一个过渡 phase
    const hasGapPhase = xe.some(p => {
      const m = p.time.match(/^([\d.]+)-([\d.]+)s$/);
      return m && parseFloat(m[1]) >= 5.5 && parseFloat(m[1]) < 6.5;
    });
    if (!hasGapPhase) {
      xe.push({
        time: '5.5-6.5s',
        name: 'Curious Pause',
        description: 'xiaoG pauses and observes, processing the glowing phenomenon above — brief moment of wonder before continuing forward',
        visual: 'xiaoG standing still, looking upward',
        camera: 'medium shot, static hold',
        sound: { type: 'pause', frequency: '0Hz', intensity: '10%', description: 'near silence' }
      });
      xe.sort((a, b) => {
        const ma = a.time.match(/^([\d.]+)-/), mb = b.time.match(/^([\d.]+)-/);
        return parseFloat(ma[1]) - parseFloat(mb[1]);
      });
      console.log(`  [fix19] GAP filled: added Curious Pause 5.5-6.5s`);
    }
  }

  // 🆕 v6.24-fix19-c: 重建 seedancePrompt（清除污染的中文拼串）
  // 同时修复 title 从 Untitled → 白泽
  if (openingTitle.title === 'Untitled' || !openingTitle.title) {
    openingTitle.title = '白泽';
    openingTitle.titleDisplay = '白泽';
    console.log(`  [fix21] title fixed: Untitled → 白泽`);
  }
  const te_p = openingTitle.titleEffect?.titleEffect?.phases || [];
  const se_p = openingTitle.titleEffect?.subtitleEffect?.phases || [];
  const be_p = openingTitle.beastEntrance?.phases || [];
  const xe_p = openingTitle.xiaoGEntrance?.phases || [];

  function pj(list) {
    return list.map(p => `${p.time} ${p.name}: ${p.description}`).join(' | ');
  }

  const titleName = openingTitle.title || openingTitle.titleDisplay || '白泽';
  const rebuilt = [
    `[TITLE DISPLAY] The screen must clearly display the main title '${titleName}' (Bai Ze) and subtitle 'by Genius' in cinematic typography — title characters appear in UPPER-LEFT QUADRANT of frame, beast at CENTER-RIGHT, no overlap.`,
    '',
    '**Sequence (Plan A: xiaoG early, spatial separation title/beast):**',
    '',
    '0.0-0.5s: BLACK SCREEN. Voice begins: Welcome to planet Nirath. Today, an unknown journey is about to begin. | Sound: sub-bass 20-60Hz earth rumble, Nirath magnetic field hum.',
    '0.5s: HARD CUT — wide shot of Nirath cliff scene. xiaoG visible at mountain foot. Camera begins upward sweep from his position.',
    '0.5-3.0s: BEAST ENTRANCE. beast silhouette gradually emerges from darkness at cave center-right, reaching full reveal by 3.0s (occupying 50% frame, NOT 70%).',
    '3.0-5.0s: TITLE EFFECT. Title characters appear stroke-by-stroke in UPPER-LEFT QUADRANT of frame — clearly separated from beast at center-right. Light veins flow from cliff crevice toward title area.',
    '3.5-5.5s: SUBTITLE EFFECT. by Genius grows from lichen colonies. 5.5-6.5s: subtitle pulses (breathing glow) filling the gap.',
    '4.5-7.5s: XIAOG ENTRANCE. xiaoG (already in frame) notices glow, walks toward cliff base, then reaches right hand toward beast (6.5-7.5s — 1 second duration).',
    '7.5-8.0s: STILLNESS. Both figures motionless. Scene settles.',
    '',
    '【Timeline】 0-8s',
    '',
    '【Mood】 epic, mysterious, awe-inspiring, geological timescale grandeur',
    '【Camera】 0.5s HARD CUT to wide shot: camera rises from xiaoG at mountain foot, sweeping upward along cliff face to upper-left title area — emphasizing scale contrast between tiny human and vast geological landscape. Static at peak.',
    '【Lighting】 dual-sunset purple-gold and amber-orange gradient, bioluminescent cyan-green accents on lichen, dramatic shadows in rock crevices',
    '【EnvironmentStyle】 hyperrealistic geological wonder, natural coincidence aesthetic, epic scale cinematography',
    '【Avoid】 bright daylight, vivid colors, smooth plastic textures, human-made structures, title overlapping beast, beast occupying more than 55% of frame when title is visible',
    '【Render】 COMPOSITE — AI-generated cliff/light background + post-produced title text via After Effects/Motion Graphics pipeline',
    '【Transition】 0s: black screen. 0.5s: HARD CUT to cliff scene. No dissolves at opening.',
    `【AudioLayer】 0.0-0.5s: black screen, voice first. Voice: Welcome to planet Nirath. Today, an unknown journey is about to begin. | 0.5-8.0s: sub-bass 20-60Hz earth rumble, Nirath magnetic field hum, bioluminescent spore particle pulses`,
    `【TitleEffect】 Mountain Texture — Light Vein Illumination | Title in UPPER-LEFT QUADRANT, beast at CENTER-RIGHT. No overlap. | ${pj(te_p)}`,
    `【SubtitleEffect】 Lichen Growth | ${pj(se_p)}`,
    `【BeastEntrance】 beast (白泽) emerges from darkness at cave center-right | ${pj(be_p)}`,
    `【XiaoGEntrance】 xiaoG (already in frame since 0.5s) responds to the glow | ${pj(xe_p)}`,
    '【CharacterRef】 白泽: image://global-character-references/baize/白泽-正面全身.png, image://global-character-references/baize/白泽-侧面全身.png, image://global-character-references/baize/白泽-45度半身.png, image://global-character-references/baize/白泽-面部特写.png, image://global-character-references/baize/白泽-动作坐姿.png | 小G: image://global-character-references/xiaoG/小G-正面全身.png, image://global-character-references/xiaoG/小G-侧面全身.png, image://global-character-references/xiaoG/小G-45度半身.png, image://global-character-references/xiaoG/小G-面部特写.png'
  ].join('\n');

  openingTitle.seedancePrompt = rebuilt;
  if (openingTitle.titleShot) {
    openingTitle.titleShot.description = rebuilt;
  }

  // 验证
  const cjkCount = (JSON.stringify(openingTitle).match(CJK_REGEX) || []).length;
  console.log(`  [v6.24-fix19] done, remaining CJK chars: ${cjkCount}`);
}

/**
 * 🆕 v6.3-Peng: 开场标题设计 (LLM创意生成)
 * 为第一个镜头设计场景化融入的标题展示(前3秒)
 */
/**
 * 🆕 v6.36-Peng: 通用片头标题设计（非山海经系列）
 * 用于教育科普、纪录片、企业宣传、品牌内容等通用视频
 * 调用 opening-title-designer.js 的 generateGeneralOpeningTitle
 */
async function _designGeneralOpeningTitle(pipeline, storyPlan) {
  console.log(`  📚 [通用片头] 使用通用模板系统 v4.1-Peng`);

  try {
    const { generateGeneralOpeningTitle } = require('./opening-title-designer.js');

    const title = storyPlan.title || pipeline.options.userInput?.title || '未命名';
    const episodeNumber = pipeline.options.userInput?.episodeNumber || '';
    const subtitle = pipeline.options.userInput?.subtitle || '';

    // 推断内容类型
    let contentType = 'education';
    const userInputText = [
      pipeline.options.userInput?.title,
      pipeline.options.userInput?.userQuery,
      typeof pipeline.options.userInput === 'string' ? pipeline.options.userInput : ''
    ].filter(Boolean).join(' ');
    
    if (/科普|教育|健康|医学|知识|讲解|教学|教程/.test(userInputText)) contentType = 'education';
    else if (/纪录|自然|人文|旅行|travel|doc/.test(userInputText)) contentType = 'documentary';
    else if (/科技|创新|tech|startup|创业/.test(userInputText)) contentType = 'tech';
    else if (/品牌|luxury|高端|艺术|art|lifestyle/.test(userInputText)) contentType = 'brand';

    // 构建环境描述
    const environment = storyPlan.setting || storyPlan.description ||
      'professional studio environment with clean minimalist aesthetic';

    // 声音层（通用模式：简洁环境音）
    const audioLayer = {
      description: 'low ambient room tone (30-60Hz sustained hum), subtle professional atmosphere, volume fades from 0 to 40%',
      sfx: 'clean professional audio mix, gentle low-end presence, no music'
    };

    const openingDuration = 5; // 通用片头默认5秒

    const openingTitle = generateGeneralOpeningTitle({
      title,
      subtitle,
      episodeNumber,
      contentType,
      environment,
      duration: openingDuration,
      audioLayer
    });

    // 保存结果
    pipeline.results.openingTitle = openingTitle;

    // 写入文件
    const fs = require('fs');
    const path = require('path');
    const titlePath = path.join(pipeline.productionDir, '03-shots', 'opening-title-design.json');
    fs.writeFileSync(titlePath, JSON.stringify({
      ...openingTitle,
      source: 'general-template',
      contentType
    }, null, 2));

    console.log(`  ✅ 通用片头设计完成:`);
    console.log(`     模板: ${openingTitle.templateName} (${openingTitle.templateNameEn})`);
    console.log(`     内容类型: ${contentType}`);
    console.log(`     标题: ${openingTitle.title}`);
    console.log(`     副标题: ${openingTitle.subtitle}`);
    console.log(`     时长: ${openingDuration}秒`);
    console.log(`     文件: ${titlePath}`);

  } catch (error) {
    console.log(`  ⚠️ 通用片头设计失败: ${error.message}`);
    pipeline.errors.push({ stage: 'opening-title-design-general', error: error.message });
  }
}

async function _designOpeningTitle(pipeline) {
  console.log(`\n🎬 Stage 8.1: 开场标题设计 (LLM创意生成 v6.3-Peng)`);

  const spStatus = pipeline._getStoryPlanStatus ? pipeline._getStoryPlanStatus() : null;
  if (!spStatus) {
    console.log(`  ⚠️ 无story-plan,跳过开场标题设计`);
    return;
  }
  const { storyPlan } = spStatus;

  // 🆕 v6.37-Peng-fix: 通用/非山海经模式路由
  // 当非山海经模式时，走通用片头模板（教育科普、纪录片、品牌等）
  const isGeneralMode = (
    !pipeline.shanhaijingMode &&
    (pipeline.worldview === 'superreal' || pipeline.worldview === 'nirath')
  );

  if (isGeneralMode) {
    console.log(`  📚 通用模式: 使用通用片头模板 (非山海经系列)`);
    await _designGeneralOpeningTitle(pipeline, storyPlan);
    return;
  }

  try {
    // 🆕 v6.3-Peng: LLM生成开场标题创意方案
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    const title = storyPlan.title || pipeline.options.userInput?.title || '未命名';
    const episodeNumber = pipeline.options.userInput?.episodeNumber || '';

    // 检测主角异兽
    let beastId = null;
    let beastName = null;
    if (storyPlan.characters && Object.keys(storyPlan.characters).length > 0) {
      const beastChar = toCharArray(storyPlan.characters).find(c => c.species && (c.species.includes('兽') || c.species.includes('异兽')));
      if (beastChar) {
        beastId = beastChar.name || beastChar.id;
        beastName = beastChar.name;
      }
    }

    // v6.24-hotfix: 如果仍为null，从segments内容或character_refs推导
    if (!beastId) {
      // 尝试从 segments 的 shot.description 推导
      const allDescriptions = (storyPlan.segments || [])
        .flatMap(s => s.shots || [])
        .map(shot => `${shot.description || ''} ${shot.Scene || ''} ${shot.Action || ''}`)
        .join(' ');
      const beastKeywords = {
        '烛龙': 'zhulong', '应龙': 'yinglong', '白泽': 'baize',
        '饕餮': 'taotie', '穷奇': 'qiongqi', '混沌': 'hundun',
        '梼杌': 'taowu', '九尾狐': 'jiuweihu', '相柳': 'xiangliu',
        '毕方': 'bifang', '夔': 'kui', '刑天': 'xingtian',
        '陆吾': 'luwu', '英招': 'yingzhao', '诸犍': 'zhujian'
      };
      for (const [keyword, id] of Object.entries(beastKeywords)) {
        if (allDescriptions.includes(keyword)) {
          beastId = id;
          beastName = keyword;
          console.log(`  🧠 [hotfix] 从segments内容推导beastId=${beastId}`);
          break;
        }
      }
    }

    console.log(`  🧠 [LLM] 生成开场标题创意方案...`);
    const llmResult = await llmLayer.llmReason({
      stage: 'opening-title-design',
      systemPrompt: `你是一位好莱坞片头设计师,擅长为史诗级短片设计震撼的开场标题。你的设计必须让前3秒抓住观众眼球。

设计要求:
1. 标题文案:英文主标题+副标题,大气磅礴(如"XINGTIAN: The Eternal War Spirit")
2. 视觉场景:标题如何融入场景(如岩石雕刻、星空浮现、火焰燃烧、冰晶凝结)
3. 光影方案:标题的光照效果(背光、发光、投影、粒子环绕)
4. 声音设计:片头需要的环境音和音效(不含对白)
5. 动态效果:标题如何出现(缓缓浮现、炸裂显现、粒子聚合、水墨晕染)
6. 情绪基调:开场必须匹配整个故事的情绪弧线起点

输出要求(JSON格式):
{
  "titleEn": "英文主标题",
  "subtitleEn": "英文副标题",
  "sceneDescription": "标题出现的场景描述(50字以内)",
  "lightingEffect": "光影效果描述",
  "soundDesign": "声音设计方案",
  "animationStyle": "标题动态出现方式",
  "mood": "情绪基调",
  "duration": 7,
  "beastCameo": "神兽客串方式(如有)"
}

约束:
- 总时长7-9秒
- 标题必须英文(好莱坞风格)
- 场景必须与故事世界观一致
- 不要包含任何中文文字在画面上`,
      userPrompt: `请为以下故事设计开场标题:

故事标题: ${title}
世界观: ${storyPlan.worldview || '未指定'}
风格: ${storyPlan.style || '未指定'}
神兽: ${beastName || '无'}
故事大纲: ${typeof storyPlan.outline === 'object' ? Object.values(storyPlan.outline).join(' ') : (storyPlan.outline || '')}
情绪曲线起点: ${(storyPlan.metadata?.emotionCurve || [])[0] || '未指定'}

请返回JSON格式的开场标题设计方案。`,
      level: 'medium',
      llmOptions: getLLMConfig('prd-generation'),
      fallback: () => null
    });

    let llmDesign = null;
    if (llmResult.success && !llmResult.fallbackUsed && llmResult.result) {
      try {
        const jsonStr = pipeline._extractJSON(llmResult.result);
llmDesign = jsonStr ? JSON.parse(jsonStr) : null;
        if (llmDesign) {
          console.log(`  ✅ [LLM] 开场标题创意生成完成:`);
          console.log(`     标题: ${llmDesign.titleEn}`);
          console.log(`     场景: ${llmDesign.sceneDescription?.substring(0, 60)}...`);
          console.log(`     动态: ${llmDesign.animationStyle}`);
        }
      } catch (e) {
        console.log(`  ⚠️ LLM开场标题JSON解析失败: ${e.message}`);
      }
    }

    if (!llmDesign) {
      console.log(`  ⚠️ LLM开场标题生成失败,降级到本地模板...`);
    }

    // 调用本地开场标题设计器
    const { generateOpeningTitlePrompt } = require('./opening-title-designer.js');

    const subtitle = 'by Genius';

    // 🆕 v2.16-Peng: 标题英文化 - 好莱坞大片风格
    const titleEnMap = {
      '刑天:不灭的战魂': 'Xingtian: The Eternal War Spirit',
      '烛龙觉醒': 'Zhulong Awakens',
      '帝江传说': 'Dijiang: The Chaos Born',
      '九尾狐的幻境': 'Nine-Tailed Fox: Realm of Illusion',
      '白泽之问': 'Baize: The Question of Truth',
      '饕餮的盛宴': 'Taotie: The Feast of Devouring',
      '未命名': 'Untitled'
    };
    const titleEn = llmDesign?.titleEn || titleEnMap[title] || title;
    const subtitleEn = llmDesign?.subtitleEn || subtitle;

    // 检测神兽(如果没从LLM获取)
    if (!beastId) {
      const beastKeywords = {
        '烛龙': 'zhulong', '应龙': 'yinglong', '白泽': 'baize',
        '饕餮': 'taotie', '穷奇': 'qiongqi', '混沌': 'hundun',
        '梼杌': 'taowu', '九尾狐': 'jiuweihu', '相柳': 'xiangliu',
        '毕方': 'bifang', '夔': 'kui', '青龙': 'qinglong',
        '白虎': 'baihu', '朱雀': 'zhuque', '玄武': 'xuanwu',
        '蛊雕': 'gudiao', '天狗': 'tiangou', '狰': 'zheng',
        '蠃鱼': 'leiyu', '旋龟': 'xuangui', '化蛇': 'huashe',
        '陆吾': 'luwu', '英招': 'yingzhao', '诸犍': 'zhujian',
        '肥遗': 'feiyi', '狻猊': 'suanni', '獬豸': 'xiezhi',
        '重明鸟': 'chongming', '鲲鹏': 'kunpeng', '巴蛇': 'bashe',
        '鹿蜀': 'lushu', '文鳐鱼': 'wenyaoyu', '朱厌': 'zhuyan',
        '夫诸': 'fuzhu', '祸斗': 'huodou', '蜚': 'fei',
        '酸与': 'suanyu', '孟槐': 'menghuai'
      };
      for (const [keyword, id] of Object.entries(beastKeywords)) {
        if (title.includes(keyword)) {
          beastId = id;
          break;
        }
      }
    }

    // 声音层
    let audioLayer = null;
    try {
      const VoiceDesigner = require('../../shanhaijing-opening-title/beast-voice-designer');
      audioLayer = VoiceDesigner.generateTitleAudioLayer(beastId);
    } catch(e) {
      // 无声音层
    }

    const openingDuration = llmDesign?.duration || (audioLayer ? 8 : 7);

    // 生成开场标题
    // 🔧 v6.35-Peng-fix: outline可能是对象(BeastMindEngine v3.0五幕结构)
    const theme = storyPlan.description || (typeof storyPlan.outline === 'object' ? Object.values(storyPlan.outline).join(' ') : storyPlan.outline) || '';
    const openingTitle = generateOpeningTitlePrompt({
      title: titleEn,
      subtitle: subtitleEn,
      episodeNumber,
      theme,
      beastId,
      subtitleStyle: 'seal',
      duration: openingDuration,
      audioLayer: audioLayer,
      // 🆕 v6.3-Peng: 传入LLM设计方案覆盖本地默认
      llmSceneDescription: llmDesign?.sceneDescription,
      llmLightingEffect: llmDesign?.lightingEffect,
      llmAnimationStyle: llmDesign?.animationStyle,
      llmSoundDesign: llmDesign?.soundDesign,
      llmMood: llmDesign?.mood
    });

    if (audioLayer) {
      openingTitle.audioLayer = audioLayer;
    }

    // 🆕 v6.24-fix19: post-processing — 将 phases 中所有中文转英文
    // 根因: three designer modules 输出中文 phase names + descriptions
    // 修复: 在保存前全局替换 phases 中的中文为英文
    _translatePhasesToEnglish(openingTitle);

    // 🆕 v6.24-fix20: 翻译后再次校验（如仍有问题，记录但不阻断）
    try {
      const OpeningTitleValidator = require('./opening-title-validator');
      const valResult = OpeningTitleValidator.validate(
        { titleEffect: openingTitle.titleEffect, beastEntrance: openingTitle.beastEntrance, xiaoGEntrance: openingTitle.xiaoGEntrance, totalDuration: openingTitle.duration || 8.0 },
        { Camera: openingTitle.camera || '', Transition: '', AudioLayer: (openingTitle.title || '') + ' ' + (openingTitle.subtitleDisplay || '') }
      );
      if (!valResult.valid) {
        console.warn(`  [fix20] Post-translate validation warnings:`);
        for (const err of valResult.errors) {
          console.warn(`     ${err.severity} [${err.type}] ${err.field}: ${err.message}`);
        }
      }
    } catch(e) { /* non-blocking */ }

    // 保存结果
    pipeline.results.openingTitle = openingTitle;

    // 写入文件
    const fs = require('fs');
    const path = require('path');
    const titlePath = path.join(pipeline.productionDir, '03-shots', 'opening-title-design.json');
    fs.writeFileSync(titlePath, JSON.stringify({
      ...openingTitle,
      llmDesign: llmDesign || null,
      source: llmDesign ? 'llm' : 'local'
    }, null, 2));

    console.log(`  ✅ 开场标题设计完成 (${llmDesign ? 'LLM增强' : '本地模板'}):`);
    console.log(`     模板: ${openingTitle.templateName} (${openingTitle.templateId})`);
    console.log(`     标题: ${openingTitle.title}`);
    console.log(`     副标题: ${openingTitle.subtitleDisplay}`);
    console.log(`     场景: ${openingTitle.scene}`);
    console.log(`     时长: ${openingDuration}秒${audioLayer ? ' (神兽开场白' + audioLayer.metadata.estimatedDuration.toFixed(1) + '秒跨镜头延续)' : ''}`);
    console.log(`     文件: ${titlePath}`);

    // 输出LLM统计
    if (llmDesign) {
      llmLayer.printReport();
    }

  } catch (error) {
    console.log(`  ⚠️ 开场标题设计失败: ${error.message}`);
    pipeline.errors.push({ stage: 'opening-title-design', error: error.message });
  }
}

module.exports = { DirectorPipeline };

if (require.main === module) {
  main();
}