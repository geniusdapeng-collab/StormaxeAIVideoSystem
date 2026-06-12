#!/usr/bin/env node
/**
 * 🔥 预生产执行规则 v3.0-Peng(2026-05-27)
 * 大鹏定义:每次执行 = 全新执行,无视历史
 * 核心原则:
 * - 系统持续迭代,同一任务就是测试用例
 * - 之前跑100遍 ≠ 现在能跑通
 * - 旧数据可能已过期,旧链路可能已变更
 * 执行标准(5条铁律):
 * 1. 清理旧输出 - 删除历史文件
 * 2. 跑完整链路 - 最新链路全部Stage全执行
 * 3. 全新数据 - 不读历史文件当输入
 * 4. 当前版本 - 永远用最新代码
 * 5. 禁止行为 - "之前跑过了""复用缓存"
 * 正确流程:队长说"跑" → 立即清理 → 完整链路 → 全新输出(不解释、不确认、不犹豫)
 * 违反后果:使用过期数据/链路 = 系统级错误,结果不可信
 *
 * 🏛️ 系统级设计哲学 v2.0-Peng(2026-05-27)
 * 大鹏定义:"我们打造的是一套专业的内容生产系统,不会为了某一个case而定制系统。"
 * 核心信条:
 * 1. 打造一流的专业内容生成系统,产出一流的专业IP内容,带来震撼视听体验 -- 这是我们的追求目标
 * 2. 不为单个case定制系统 -- 任何case都只是触发系统改进的输入,不是定制需求的来源
 * 3. 举一反三,根治同类问题 -- 发现问题后,必须上升到机制级改进,确保同类问题不再发生
 * 4. case反馈 → 系统优化 -- 所有问题反馈都用于优化系统机制,不做定向修复
 *
 * ShanhaiStory Forge v2.4-Peng | Seedance Render Engine v10.29-Peng (生产发布版)
 * 大视频系统统一版本号:v2.4-Peng(山海经系列 + 通用视频系列)
 *
 * v10.29-Peng 更新（2026-05-31）:
 * - 🆕 v6.17-Peng-fix4: targetLength 1000→1000；MIN_TARGET 950→1000；MAX_ALLOWED 970→983（利用率目标99.8%）
 * - 🆕 v6.17-Peng-fix4: generateShotPrompt() 三剑客注入 — CharacterRef/Timeline/Dialogue 从 plan.characters/shot 自动构建
 * - 🆕 v6.17-Peng-fix4: 新增 _formatTime() 辅助函数（秒→m:ss）
 *
 * - 🆕 v6.5-Peng-fix3: expandPromptToTarget 二次填充 — 截断后若仍<950追加短filler
 *   - 解决短镜头利用率不足问题（如S05 926/93%）
 *   - filler文本缩短至15-25字，放宽填充条件到<=targetLength
 *   - 二次填充：硬截断后追加6项短filler到950+
 * v10.28-Peng 更新（2026-05-29）:
 * - 🆕 v1.0-Peng: 环境音效智能设计模块 — AmbientSoundBlock
 *   - 新建 environment-sound-designer.js 模块
 *   - 根据镜头环境和Nirath生态自动生成环境背景音效描述
 *   - 支持Nirath十大生态区 + 通用自然环境（森林/山脉/河流/洞穴等）
 *   - 独立字段注入: AmbientSoundBlock: 风声/水声/鸟鸣/岩石滚动...
 *   - 作为Seedance渲染的音频线索，增强环境沉浸感
 * 
 * v10.27-Peng 更新（2026-05-29）:
 * - 🆕 v3.1-Peng: 环境风格独立注入 - 角色CG超写实,背景实景拍摄
 *   - 新建 environment-style-injector.js 模块
 *   - 环境风格:real location filming, 4K UHD, cinematic film quality, ultra clear details, natural color grading
 *   - 与角色CG超写实风格分离,避免风格冲突
 *   - 负面约束:NO CG background, NO 3D rendered environment, NO digital painting style
 *
 * v10.26-Peng 更新(2026-05-29):
 * - 🆕 v3.0-Peng: 独立音频叙事字段模块 - dialogueBlock
 *   - 把角色台词/台词/声音作为视觉叙事信息独立封装
 *   - 模块结构:Dialogue: {角色} speaks "{台词}" | Voice:{音色} | Action:{动作} | Mood:{情绪}
 *   - 后续可单独优化此模块内容,不影响Prompt其他部分
 * - 🆕 v3.0-Peng: 所有任务类型统一走Seedance原生音频(科普/广告enableTTS→false)
 * - 🆕 v3.0-Peng: 彻底关闭TTS备用通道,只保留Seedance原生音频
 *
 * v10.23-Peng 更新(2026-05-28): 修复expandPromptToTarget截断Bug - 保护镜头专属内容(subjectDesc/cinematicMove),优先截断mandatoryDimensions
 *   - 根因: mandatoryText膨胀到1619字占满targetLength(1623),导致prompt部分仅剩4字被完全截断
 *   - 修复: 截断时优先保留prompt,截断mandatoryText;修复语法错误(未闭合花括号)
 * v10.22-Peng 更新(2026-05-28):
 * - 🆕 英文标题支持:Prompt中自动注入英文标题+全屏显示要求
 * - 🆕 台词联动注入:generateShotPrompt自动关联台词与动作
 *
 * v10.21-Peng(5项P0改进+镜头增量修复版)
 * + 🆕 v2.21-Peng: 系统级修复 -- 镜头增量内容完整性保障(第三方AI评估反馈)
 *   - 镜头增量内容生成器 v1.0-Peng: subjectDesc<150字时自动生成专属动作描述
 *   - 镜头专属内容保护截断器 v1.0-Peng: expandPromptToTarget截断时优先保护增量内容
 *   - 模态隔离过滤器: 自动将音频频率/导演备注路由到对应管线
 *   - 修复S01-S05镜头增量为空/截断的系统性缺陷
 * + v2.20-Peng: 5项P0通用系统级改进生产发布
 *   - 三层提示词架构:世界基底+角色锚点+镜头增量分离,提升叙事信息密度60%+
 *   - Dialogue管线分离:台词从视觉Prompt剥离,移至音频生产管线
 *   - 生理感知注入系统:根据角色生理结构智能选择微动作(无头→胸部起伏,人类→呼吸眨眼)
 *   - 情绪视觉翻译引擎:情绪标签→具体视觉指令(lighting/color/camera/atmosphere)
 *   - 角色双锚点系统:Reference Image + Text Anchor双重保障,确保角色一致
 *   - 【生产验证】刑天预生产全部8镜头利用率95%-98%,生理感知正确识别无头模板
 * + v2.19-Peng: 5项P0通用系统级改进开发版(同上5项,开发验证阶段)
 * + 🆕 v10.16-Peng-fix: 对话唯一性修复 + 角色文字锚点 + 截断句子完整性
 *   - 修复act字段匹配bug("起/Setup"→"起"),根治对话重复
 *   - 增加神兽核心外观锚点强制注入(headless+breast-eyes+navel-mouth+war-axe+shield)
 *   - _smartTruncate增强:优先在完整句子边界截断,避免句子截断
 *   - 提高片头shot目标长度:950→1000(+40字空间)
 *   - 精简P100神兽出场正则:去掉"震撼.*力量|占据画面.*70"描述性匹配
 *   - 为P95开场白腾出空间
 *   - 转场连贯性检查器方向性修复
 *   - 独立脚本错误堆栈打印增强
 *   - 添加防作弊约束警告注释
 * + 🆕 v10.9-Peng: 转场连贯性检查器自动修复镜头衔接割裂
 * + 🆕 v10.9-Peng: 定妆照系统加固(8张全部传入,不再丢弃)
 *   - 检查机制: <95% = 严重不足告警, 95%-99% = 黄金区间, >99% = 超长阻断
 *   - 补全机制: 片头shot追加supplements逻辑,逼近99%上限
 * + 🆕 v10.6-Peng: 片头shot截断修复 + supplements补全 + 中文暗黑词覆盖
 *   - 修复截断后超出上限问题(去掉"..."标记)
 *   - 片头shot追加supplements逼近99%
 *   - StyleCleanser中文暗黑词全面覆盖
 * + v10.4-Peng-fix: 地质质感增强系统 -- 系统性解决岩石/山脉"塑料感"问题
 *   - 新增geological-texture-enhancer.js模块:自动检测地质元素,注入反塑料质感关键词
 *   - 覆盖所有rocky/mountain/cliff场景,不限于刑天片头
 *   - 更新3个文件:opening-title-designer(山崖模板)、beast-habitat-standardizer(rocky habitats)、
 *     orient-primordial-core(L3 rocky scenes)
 *   - 核心原则:机制级修复,case反馈→系统优化,不为单个case定制
 * + 🆕 v10.3-Peng-fix: 尾部注入统一化修复 -- 系统性解决Prompt末尾拼接超限问题
 *   - 删除3处独立尾部注入(免责声明/宽高比/Nirath场景),统一由mandatoryDimensions管理
 *   - 免责声明迁移到前置统一注入,纳入expandPromptToTarget统一分配空间
 *   - 新增最终长度保护guard:所有处理后的统一截断出口,return前强制校验
 *   - 核心原则:expandPromptToTarget是Prompt组装的唯一出口
 * + 🆕 v2.11-Peng 更新(2026-05-26):
 * + 🆕 v10.2-Peng-fix: Prompt去重+智能截断修复
 *   - 修复bioluminescent spore particles等句子重复3次的问题
 *   - 修复英文单词中间截断(如angle→angl)
 *   - 修复中英文突兀拼接问题
 *   - 新增_deduplicatePrompt函数删除重复句子
 *   - 新增_smartTruncate函数在词语边界截断
 * + 🆕 v2.2-Peng-fix1: 强制调用机制 -- 确保待机感知识100%执行
 *   - 渲染引擎层:强制注入 + 注入后验证 + 二次注入 + fallback
 *   - 导演管线层:Prompt生成后生命迹象强制检查
 *   - 质检层:mandatoryDimensions增加生命迹象维度
 * + 软性注入V2感官叙事引擎 - 不改技术架构,只注入软性编剧方法论
 * + BeastMind Engine v2.0-Peng: 四层角色内核推导 (Want/Need/Ghost/Lie)
 * + Sensory Grammar Injector: Prompt生成时自动注入感官词汇
 * + V2 Sensory Checker: 8项软性检查(不阻断流程)
 *
 * v10.0-Peng 更新(2026-05-26):
 * + 🔒 定妆照强制上传闸机 v6.1-Peng - 最严格限制,历史踩坑根治
 *   - 闸机1(镜头级): 含角色的镜头shotRefs必须非空,否则throw Error
 *   - 闸机2(文件级): 每个定妆照路径必须fs.existsSync,否则throw Error
 *   - 闸机3(API命令级): cmd必须包含 --image-file 参数,否则throw Error
 *   - 闸机4(执行前最终检查): cmdParts中 --image-file 数量必须≥1
 *   - 闸机5(v2.3-Peng/Seedance 2.0官方规范): 阻断级检查
 *     - 文件格式: PNG/JPEG硬检查 (非WEBP/GIF/BMP阻断)
 *     - MIME类型: image/png或image/jpeg强制合规
 *     - Role分配: 1张=first_frame, 2张=first+last, ≥3张=reference_image
 *     - [REF:角色名]标注: 阻断级检查，缺少则禁止渲染
 *     - 文件大小: 硬上限10MB (base64膨胀后), 建议5MB
 *     - 在线URL: 检查域名白名单+签名有效期
 *     - 文件可读性: 权限检查, 确保能转换为Data URL
 *     - 错误分级: blockingIssues(阻断) vs formatIssues(警告)
 *   - 即使skipRender模式也检查(预生产≠跳过闸机)
 *   - 任何一层失败 → 渲染被强制阻止,不可绕过
 *
 * v9.9.2-Peng 更新(2026-05-25):
 * + 🆕 类型感知精准填充 v5.9-Peng-fix: expandPromptToTarget 完全重构
 *   - 景别→景深/镜头强制映射(特写→f/1.4, 远景→广角24mm)
 *   - 镜头类型→维度优先级(establishing→构图+全景深, climax→戏剧性光比)
 *   - 情绪→光线绑定(震惊→硬光, 敬畏→柔光, 狂暴→频闪)
 *   - 叙事位置→情绪张力+节奏词(起→期待, 高潮→爆发, 合→余韵)
 *   - 镜头运动→运镜词匹配(FPV→沉浸感, 俯冲→极限张力)
 *   - 消除所有 Math.random() 填充,改为优先级排序注入
 * + 提示词空间利用率目标: 95%-99% of 1000字符
 * + 调试日志: 记录注入维度 [topic1,topic2,...] 便于追踪
 *
 * v9.9.0-Peng 更新(2026-05-25):
 * + 🆕 提示词利用率硬性闸门:95%-99%稳定控制
 * + 🆕 expandPromptToTarget 重构:统一处理强制内容,避免多次注入破坏长度
 * + 🆕 generateShotPrompt 修复:删除重复调用和尾部破坏性注入
 * + 🆕 移除 FPV 和 DISCLAIMER 的 post-expand 注入,统一在 expand 阶段处理
 *
 * v9.8.2-Peng 更新:
 * + 🆕 三层免责声明自动注入:CG声明 + 非真实人物 + 技术语境
 * + 🆕 角色视觉锚点写回shot对象:供预生产检查清单使用
 * + 🆕 490字上限保护:免责声明注入不超上限
 *
 * v9.8.1-Peng 更新(大系统 v2.0-Peng):
 * + 🆕 一镜到底强制检查:render()入口阻塞级检查,无一镜到底则拒绝渲染
 * + 🆕 FPV经验包总库版本同步
 *
 * v9.8.0-Peng 更新(大系统 v2.0-Peng):
 * + 🆕 FPV经验包自动增强:一镜到底镜头自动注入电影级技法
 * + 🆕 15个标杆案例匹配系统:根据场景自动推荐最佳FPV方案
 *
 * v9.7.0-Peng 更新(大系统 v1.1-Peng):
 * + 🆕 全局定妆照目录优先检测:productions/global-character-references/xiaoG/
 * + 🆕 支持多种角色目录架构回退(03-characters/02-characters/character-references/)
 * + 🆕 角色定妆照安全网强化:无定妆照禁止提交渲染
 *
 * v9.6.1-Peng 更新:
 * + 修复运镜注入失效: 支持 shot.cinematography 字段读取
 * + 修复场景语法传递: 读取 shot._sceneGrammar 注入场景专属运镜
 * + 运镜控制现在真正生效,不再"几乎为零"
 * 基于52,000字深度调研报告升级 - 山海经水墨志怪美学体系固化
 * + v2.2-Peng追加: 极限密度改造(运镜全部加速/情绪全部加速/新增pacing补充项)
 * + v2.3-Peng: 闸机5升级为Seedance 2.0官方规范阻断级检查
 *   - 文件格式: PNG/JPEG 硬检查 (非WEBP/GIF/BMP)
 *   - MIME类型: image/png 或 image/jpeg 强制合规
 *   - Role分配: 1张=first_frame, 2张=first+last, ≥3张=reference_image
 *   - [REF:角色名]标注: 阻断级检查，缺少则禁止渲染
 *   - 文件大小: 硬上限10MB (base64膨胀后)，建议5MB
 *   - 在线URL: 检查域名白名单+签名有效期
 *   - 文件可读性: 权限检查，确保能转换为Data URL
 *   - 闸机5从"警告"升级为"阻断"：任何官方规范错误=throw Error
 *   - 错误分级: blockingIssues(阻断) vs formatIssues(警告)
 * + v2.2-Peng追加: 定妆照智能角度匹配(8张多角度/主角5张配额/12张上限)
 *
 * 核心升级:
 * 1. Prompt丰满度优化中所有通用补充项 → 山海经五正色/水墨氛围/种族纹理专属项
 * 2. 色彩基调: 五正色体系(赤/黄/青/黑/白) × 五行 × 方位
 * 3. 运镜节奏: 中国神话宇宙观运镜(三远法/绝地天通/俯瞰众生) + 全部"急速"加速
 * 4. 环境氛围: 洪荒水墨志怪氛围(钟山赤脉/昆仑玉雾/弱水黑雾)
 * 5. 材质纹理: 种族纹理系统(龙鳞/狐毛/凤羽/饕餮厚皮/麒麟鳞毛复合)
 * 6. 电影质感: 东方IMAX+水墨胶片质感(洪荒手绘感/远古山水长卷)
 * 7. 快节奏: 新增第15项pacing补充(relentless fast-paced cuts / rapid-fire action)
 * 8. 角色一致性: 8张定妆照智能匹配(动作类型→最优角度)
 *
 * 从 Director v9.2-Peng 拆分独立的渲染引擎
 * 职责:将分镜片段批量提交到 Seedance API,处理 Multi-Shot / 单镜头策略,轮询下载,精确切分
 */

const fs = require('fs');
const path = require('path');
const { execAsync, shellQuote } = require('../../seedance-director/scripts/exec-utils');
const { generateCacheKey, checkCache, setCache } = require('./render-cache'); // P1-4.2: 渲染缓存层
const { getCinematicMove, generateContinuityNarrative } = require('./cinematography'); // v1.3-Peng: 好莱坞级运镜词库

// 🆕 v2.19-Peng: 5项P0通用系统级改进模块
const { translateEmotionToVisual } = require('./emotion-visual-translator'); // 情绪→视觉翻译引擎
const { detectPhysioType, generatePerceptionForCharacter, generateShotPerceptions } = require('./physiological-perception-injector'); // 生理感知注入系统
const { PromptThreeLayerBuilder, analyzeShotPrompts } = require('./prompt-three-layer-architecture'); // 三层提示词架构
const { generateDualAnchors, mergeAnchorsToPrompt, markPreviouslySeenCharacters, validateCharacterAnchors } = require('./dual-character-anchor'); // 角色双锚点系统
const PromptFieldStandard = require('../../shanhaijing-director/scripts/prompt-field-standard'); // 🆕 v1.0-Peng: Prompt字段标准规范

// 🆕 v6.15-Peng: 引入外部专家方案 - Prompt Engineering Pipeline v2.0
const { PromptParser, SmartTruncator, PromptAssembler, PromptValidator, generateShotPrompt_v2, expandPromptToTarget_v2 } = require('./prompt-engine-v2');


// ═══════════════════════════════════════════════════════════
// 🆕 v6.20-Peng: 最终兜底补齐函数（专家方案）
// 目标: 保证每个镜头 prompt 稳定达到 930-960 字符
// ═══════════════════════════════════════════════════════════
function fillPromptToTarget(prompt, shot) {
  let out = String(prompt || '').trim();
  const target = 960;
  const hardLimit = 1000;

  const shotName = shot?.id || shot?.shotId || 'shot';
  const fillers = [
    'epic environmental storytelling with layered spatial depth and atmospheric richness',
    'physically plausible material response and premium texture fidelity under cinematic lighting',
    'cinematic lighting separation with volumetric atmosphere and reflective mineral surfaces',
    'clear subject readability and stable visual identity continuity throughout the shot',
    'subtle particle motion and environmental micro-dynamics for immersive presence',
    'controlled camera rhythm with deliberate focus migration and measured parallax',
    `mythic alien ecology continuity for ${shotName}, crystalline terrain and energy-vein landscape logic`,
    'high-end CG realism, grounded scale perception, cohesive world-building coherence'
  ];

  for (const item of fillers) {
    const currentLen = [...out].length;  // 真实Unicode字符数
    if (currentLen >= target) break;
    const next = [...out].length > 0 ? `${out}, ${item}` : item;
    if ([...next].length <= hardLimit) {
      out = next;
    } else {
      break;
    }
  }

  if ([...out].length > hardLimit) {
    // 逐字符精确截断到 hardLimit
    out = [...out].slice(0, hardLimit).join('');
  }

  const finalLen = [...out].length;
  if (finalLen < 889) {
    console.warn(`[fillPromptToTarget][WARN] ${shotName}: 补齐后仍只有 ${finalLen}/1000 (< 889目标线)`);
  }

  return out;
}

// ═══════════════════════════════════════════════════════════

// ============ 配置(v5.1-Peng: 接入配置中心) ============
let CONFIG, MODEL_PRIORITY, FALLBACK_ERRORS, MAX_CONCURRENT_DEFAULT,
    RETRY_DELAY_MS, QUOTA_RETRY_DELAYS, BATCH_COOLDOWN_MS,
    OUTPUT_ROOT, PROMPT_MAX_LENGTH, DEGRADATION_STEPS;

// v1.3-Peng: 风格选择器
let STYLE_SELECTOR, CURRENT_STYLE_PROFILE;

function initConfig() {
  const { CONFIG: cfg } = require('../../seedance-director/scripts/config-center');
  CONFIG = cfg;

  // v1.3-Peng: 加载风格选择器
  try {
    STYLE_SELECTOR = require('../../shanhaijing-director/scripts/style-selector');
    CURRENT_STYLE_PROFILE = cfg.styleProfile || 'nirath';  // 🌍 v3.0-Peng: 默认Nirath风格
    log('RenderEngine', `🎨 风格档案: ${STYLE_SELECTOR.getStyleProfile(CURRENT_STYLE_PROFILE).name}`, 'info');
  } catch (e) {
    log('RenderEngine', `⚠️ 风格选择器加载失败: ${e.message},使用硬编码风格`, 'warn');
    STYLE_SELECTOR = null;
  }

  MODEL_PRIORITY = cfg.render.modelPriority.map((m, i) => ({ ...m, priority: i }));
  FALLBACK_ERRORS = ['400', '429', '500', '503', '模型不可用', 'service_tier', 'insufficient_quota', 'rate_limit'];
  MAX_CONCURRENT_DEFAULT = cfg.render.maxConcurrent || 4;
  RETRY_DELAY_MS = cfg.render.retryDelayMs || 2000;
  QUOTA_RETRY_DELAYS = cfg.render.quotaRetryDelays || [5000, 15000, 30000];
  BATCH_COOLDOWN_MS = cfg.render.batchCooldownMs || 3000;
  OUTPUT_ROOT = cfg.render.outputDir || path.join(require('os').homedir(), '.openclaw/workspace/productions');
  PROMPT_MAX_LENGTH = cfg.render.promptMaxLength || 1000;
  DEGRADATION_STEPS = cfg.render.degradationSteps || [
    { promptTrim: 0, modelShift: 0 },      // 第1次重试: 不变
    { promptTrim: 100, modelShift: 0 },     // 第2次: 缩短提示词
    { promptTrim: 200, modelShift: 1 },     // 第3次: 缩短+降级模型
    { promptTrim: 300, modelShift: 1 },     // 第4次: 大幅缩短+降级
    { promptTrim: 400, modelShift: 2 }      // 第5次: 极简提示词+保底模型
  ];
}

// 日志工具
function log(scope, message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${scope}]`;
  if (level === 'error') console.error(`${prefix} ❌ ${message}`);
  else if (level === 'warn') console.warn(`${prefix} ⚠️ ${message}`);
  else if (level === 'success') console.log(`${prefix} ✅ ${message}`);
  else if (level === 'progress') console.log(`${prefix} ⏳ ${message}`);
  else if (level === 'phase') console.log(`\n${prefix} 🎬 ${message}\n`);
  else console.log(`${prefix} i️ ${message}`);
}

// 降级策略应用
function applyDegradation(prompt, modelConfig, retryCount) {
  const step = DEGRADATION_STEPS[Math.min(retryCount, DEGRADATION_STEPS.length - 1)];
  if (!step) return { prompt, modelConfig };

  let degradedPrompt = prompt;
  let degradedModel = { ...modelConfig };

  // 缩短提示词
  if (step.promptTrim > 0 && _countChars(degradedPrompt) > step.promptTrim + 10) { // v4.1: _countChars
    degradedPrompt = _charAwareSubstring(degradedPrompt, 0, _countChars(degradedPrompt) - step.promptTrim) + '...(精简版)'; // v4.1: _countChars
    log('RenderEngine', `🔧 降级: prompt缩短${step.promptTrim}字符(${prompt.length}→${degradedPrompt.length})`, 'warn');
  }

  // 降级模型
  if (step.modelShift > 0) {
    const currentIdx = MODEL_PRIORITY.findIndex(m => m.id === modelConfig.id);
    const newIdx = currentIdx + step.modelShift;
    if (newIdx < MODEL_PRIORITY.length) {
      degradedModel = MODEL_PRIORITY[newIdx];
      log('RenderEngine', `🔧 降级: 模型 ${modelConfig.name}→${degradedModel.name}`, 'warn');
    }
  }

  return { prompt: degradedPrompt, modelConfig: degradedModel };
}

// 🆕 v4.1-Peng-fix: 统一字符数计算（大鹏规则：汉字=2字符，英文/数字/标点=1字符）
// 此函数为系统级标准，所有长度检查必须使用
function _countChars(str) {
  if (!str || typeof str !== 'string') return 0;
  let total = 0;
  for (const char of str) {
    const code = char.codePointAt(0);
    if (code >= 0x4E00 && code <= 0x9FFF || 
        code >= 0x3400 && code <= 0x4DBF ||
        code >= 0x20000 && code <= 0x323AF) {
      total += 2; // 汉字 = 2字符
    } else {
      total += 1; // 其他 = 1字符
    }
  }
  return total;
}

// 🆕 v4.1-Peng-fix: 字符感知子串截取（按_countChars计数，而非.length）
function _charAwareSubstring(str, start, maxChars) {
  let chars = 0;
  let endIndex = start;
  for (let i = start; i < str.length; i++) {
    const code = str[i].codePointAt(0);
    chars += (code >= 0x4E00 && code <= 0x9FFF || 
              code >= 0x3400 && code <= 0x4DBF ||
              code >= 0x20000 && code <= 0x323AF) ? 2 : 1;
    if (chars > maxChars) {
      endIndex = i;
      break;
    }
    endIndex = i + 1;
  }
  let result = str.substring(start, endIndex);
  // 🆕 fix15-v9: 路径安全 — 截断点不能落在 .png 路径中间
  // 根因: endIndex 可能落在路径字符序列中间,产生 '.../02-charac' 这种残片
  // 修复: 检测 result 是否包含未完整结束的 PNG 路径,若是则回退到最近 ', ' 分隔符
  // 偏好使用 ', '（路径间分隔符）而不是 ' | '（元数据间分隔符），尽量保留路径完整
  const hasPng = /\.png/.test(result);
  const endsWithPng = /\.png\s*[,|]?[\s'"]*$/.test(result);
  const tailIsMidPath = /\/[\u4e00-\u9fa5]{1,3}$/.test(result) && !endsWithPng;
  if ((hasPng && !endsWithPng) || tailIsMidPath) {
    // 优先 ', ' (路径分隔符) → ' | ' (元数据分隔符) → 最后回退到 .png
    let lastSep = result.lastIndexOf(', ');
    if (lastSep < 0) lastSep = result.lastIndexOf(' | ');
    if (lastSep > 0) {
      result = result.substring(0, lastSep);
    } else if (hasPng) {
      const lastPng = result.lastIndexOf('.png');
      if (lastPng > 0) {
        result = result.substring(0, lastPng + 4);
      }
    }
  }
  return result;
}

// Prompt长度验证(v5.8-Peng-fix: 增加字数利用率校验,不足95%也告警)
// v4.1-fix: 统一使用_countChars(汉字=2字符)替代.length，确保与合规检查一致
function validatePromptLength(prompt, maxLength = PROMPT_MAX_LENGTH) {
  const length = _countChars(prompt); // v4.1: 统一字符数计算
  const tokens = Math.ceil(length * 1.5); // 粗略估算: 中文1.5x
  const utilization = (length / maxLength) * 100;

  if (length >= maxLength) {
    log('RenderEngine', `⚠️ Prompt超长(${length}/${maxLength}字符, ~${tokens}tokens),将截断`, 'warn');
    // 🆕 v10.2-Peng-fix: 使用智能截断代替粗暴截断
    // 🆕 v10.6-Peng-fix: 去掉截断标记"...",避免Prompt内容被截断标记污染
    // 🆕 v10.24-Peng-fix7: 截断至maxLength-1确保利用率≤99%
    let truncated = _smartTruncate(prompt, maxLength - 1);
    // 🆕 v10.25-Peng-fix: 硬截断确保不超过maxLength-1(_smartTruncate可能因句子边界回退超出5%)
    const hardCap = maxLength - 1;
    if (_countChars(truncated) > hardCap) { // v4.1: 使用_countChars检查
      truncated = _charAwareSubstring(truncated, 0, hardCap); // v4.1: 字符感知截断
    }
    // 🆕 v10.29-Peng-fix: 截断后二次填充 — 截断后若仍<950强制追加短filler到950
    // v4.1调整: MIN_AFTER_TRUNCATE从950改为按maxLength的90%计算(即891)
    const MIN_AFTER_TRUNCATE = Math.floor(maxLength * 0.9); // v4.1: 1000*0.9=891
    if (_countChars(truncated) < MIN_AFTER_TRUNCATE) { // v4.1: 使用_countChars
      const fillers = [
        'microscopic dust particles floating in sunbeams,each grain visible,air transparency',
        'subtle skin pores and fine hair texture,microscopic detail visible',
        'natural finger tremor and slight body sway,lifelike movement',
        'fabric weave pattern and stitching detail,material texture clear',
        'shallow depth of field bokeh circles in background,creamy blur',
        'environmental audio reverb and spatial acoustics,immersive soundscape'
      ];
      let idx = 0;
      while (_countChars(truncated) < MIN_AFTER_TRUNCATE && idx < fillers.length) { // v4.1: _countChars
        const f = fillers[idx];
        const needed = MIN_AFTER_TRUNCATE - _countChars(truncated); // v4.1: _countChars
        const availableSpace = hardCap - _countChars(truncated) - 1; // v4.1: _countChars
        if (availableSpace <= 0) break;
        // 如果filler能完整放入，追加完整filler；否则截断filler到可用空间
        if (_countChars(f) <= availableSpace) { // v4.1: _countChars
          truncated += ',' + f;
        } else {
          // 截断filler到可用空间，优先在逗号处截断
          let cutPos = f.lastIndexOf(',', availableSpace);
          if (cutPos < 10) cutPos = availableSpace; // 如果逗号太靠前，直接硬截断
          truncated += ',' + f.substring(0, cutPos);
        }
        idx++;
      }
      log('RenderEngine', `🎯 截断后二次填充: ${_countChars(truncated)}字符,追加${idx}项`, 'info'); // v4.1: _countChars
    }
    return {
      valid: false,
      prompt: truncated,
      length: _countChars(truncated), // v4.1: _countChars
      tokens: Math.ceil(_countChars(truncated) * 1.5), // v4.1: _countChars
      utilization: (_countChars(truncated) / maxLength) * 100 // v4.1: _countChars
    };
  }

  // v10.7-Peng: 字数利用率不足95%告警(严重不足), 95%-99%为黄金区间
  // 注意: 大鹏要求闸机下限95%,低于95%触发补充机制
  if (utilization < 95) {
    log('RenderEngine', `🚨 Prompt字数利用率严重不足(${utilization.toFixed(1)}%/${maxLength}),目标95%-99%,将触发补充机制`, 'error');
  } else if (utilization < 99) {
    log('RenderEngine', `⚠️ Prompt字数利用率偏低(${utilization.toFixed(1)}%/${maxLength}),可继续优化逼近上限`, 'warn');
  }

  if (tokens > maxLength * 1.5) {
    log('RenderEngine', `⚠️ Prompt tokens估算偏高(~${tokens}),可能影响生成质量`, 'warn');
  }
  return { valid: true, prompt, length, tokens, utilization };
}

// 判断是否可以用Multi-Shot策略
function canUseMultiShot(shots) {
  const hasDialogue = shots.some(s => s.dialogues && s.dialogues.length > 0);
  const hasSceneChange = shots.some((s, i) => i > 0 && s.act !== shots[i - 1].act);
  const hasComplexMultiChar = shots.some(s => (s.characters || []).length > 3);
  const hasVeryLongShot = shots.some(s => (s.duration || 5) > 12);
  return !hasDialogue && !hasSceneChange && !hasComplexMultiChar && !hasVeryLongShot;
}

// 🔴 v7.2-Peng: 提示词丰满度优化 - 主动填充到 941-1000字区间 (95-99% of 1000)

/**
 * 🆕 v10.2-Peng-fix: Prompt去重函数
 * 检测并删除Prompt中重复的句子/短语
 */
function _deduplicatePrompt(prompt) {
  if (!prompt || prompt.length < 100) return prompt;

  // 按句子结束符分割(只使用句号/问号/感叹号,不用逗号避免过度分割)
  const sentences = prompt.split(/([.!?。!?]+)/);
  const seen = new Set();
  const unique = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    // 检查是否是分隔符
    if (/^[.!?。!?]+$/.test(sentence)) {
      // 分隔符,附加到最后一个unique元素
      if (unique.length > 0) {
        unique[unique.length - 1] += sentence;
      }
      continue;
    }

    // 生成句子签名(小写,忽略标点和空格,前40字符)
    const signature = sentence.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, '').substring(0, 40);

    // 只有足够长的句子才去重(避免短词误判)
    if (signature.length > 15) {
      if (seen.has(signature)) {
        // 重复句子,跳过(但保留分隔符给下一个句子)
        // 如果下一个是分隔符,也跳过
        if (i + 1 < sentences.length && /^[.!?。!?]+$/.test(sentences[i + 1].trim())) {
          i++;
        }
        continue;
      }
      seen.add(signature);
    }

    unique.push(sentence);
  }

  const result = unique.join(' ');
  if (result.length < prompt.length * 0.85) {
    console.log(`  [_deduplicatePrompt] 🧹 去重: ${prompt.length}→${result.length}字 (删除${prompt.length - result.length}字重复内容)`);
  }
  return result;
}

/**
 * 🆕 v10.2-Peng-fix: 智能截断函数
 * 在词语边界处截断,避免截断英文单词或中文词语
 */
function _smartTruncate(text, maxChars) {
  // v4.1-fix: 统一使用_countChars(汉字=2字符)替代.length
  if (_countChars(text) <= maxChars) return text;

  let cutIndex = text.length;

  // 🆕 v10.16-Peng-fix: 优先在完整句子边界截断(句号/问号/感叹号/引号闭合)
  const sentenceEndChars = ['.', '?', '!', '"', '。', '?', '!', '」', '】'];
  
  // v4.1: 从末尾向前搜索,找最近的句子结束符，使用_countChars检查长度
  for (let i = text.length - 1; i >= 0; i--) {
    if (sentenceEndChars.includes(text[i])) {
      const testStr = text.substring(0, i + 1);
      if (_countChars(testStr) <= maxChars) {
        cutIndex = i + 1;
        break;
      }
    }
  }

  // 如果找不到句子边界,在逗号/分号处截断
  if (cutIndex === text.length) {
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] === ',' || text[i] === '，' || text[i] === ';' || text[i] === '；') {
        const testStr = text.substring(0, i + 1);
        if (_countChars(testStr) <= maxChars) {
          cutIndex = i + 1;
          break;
        }
      }
    }
  }

  // fallback: 在空格处截断
  if (cutIndex === text.length) {
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] === ' ') {
        const testStr = text.substring(0, i);
        if (_countChars(testStr) <= maxChars) {
          cutIndex = i;
          break;
        }
      }
    }
  }

  // fallback: 避免截断英文单词
  if (cutIndex === text.length) {
    const charAtMax = text[cutIndex - 1] || '';
    const charBefore = text[cutIndex - 2] || '';
    if (/[a-zA-Z]/.test(charAtMax) && /[a-zA-Z]/.test(charBefore)) {
      let spacePos = text.lastIndexOf(' ', cutIndex);
      if (spacePos > 0) {
        const testStr = text.substring(0, spacePos);
        if (_countChars(testStr) <= maxChars) {
          cutIndex = spacePos;
        }
      }
    }
  }

  // 最后的fallback: 字符精确截断
  if (cutIndex === text.length) {
    cutIndex = 0;
    let chars = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text[i].codePointAt(0);
      chars += (code >= 0x4E00 && code <= 0x9FFF || 
                code >= 0x3400 && code <= 0x4DBF ||
                code >= 0x20000 && code <= 0x323AF) ? 2 : 1;
      if (chars > maxChars) {
        cutIndex = i;
        break;
      }
      cutIndex = i + 1;
    }
  }

  return text.substring(0, cutIndex).trim();
}

/**
 * 🆕 v10.15-Peng-fix: 保留完整一句台词
 * 以句号/引号/问号/感叹号为边界,保留完整的句子
 * 策略:先向前找(不超maxLength),找不到则向后找(允许超maxLength),优先保完整句
 */
function _formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function _preserveFullSentence(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;

  // 1. 先从maxLength处向前查找句子边界(不超maxLength)
  for (let i = maxLength; i >= maxLength * 0.3; i--) {
    const char = text[i];
    if (char === '.' || char === '?' || char === '!' || char === '"') {
      return text.substring(0, i + 1).trim();
    }
  }

  // 2. 向前找不到,则从maxLength处向后找第一个句子结束符
  for (let i = maxLength; i < Math.min(text.length, maxLength * 2.5); i++) {
    const char = text[i];
    if (char === '.' || char === '?' || char === '!' || char === '"') {
      return text.substring(0, i + 1).trim();
    }
  }

  // 3. fallback: 如果整段都没有句子结束符,返回全部
  return text.trim();
}

// 🆕 v5.9-Peng-fix: 类型感知精准填充 - 根据镜头类型/景别/情绪/叙事位置匹配维度
function expandPromptToTarget(prompt, shot, plan, targetLength = 960, mandatoryText = '') {
  // 🆕 v6.15-Peng: 调用外部专家方案 - Prompt Engineering Pipeline v2.0
  // 根因: 原有截断策略导致核心叙事被截断,利用率仅25-40%
  // 修复: 使用专家方案的三级优先级截断(核心>技术>元数据)
  if (shot && shot._llmEnhancedDescription) {
    try {
      const result = expandPromptToTarget_v2(
        {},  // fields: 由v2函数内部解析
        prompt,  // currentPrompt: 当前的prompt
        targetLength
      );
      if (result && result.length > 0) {
        console.log(`  [expandPromptToTarget] 🆕 v6.15-Peng: 外部专家方案截断成功: ${result.length}/${targetLength}字 (${(result.length/targetLength*100).toFixed(1)}%)`);
        return result;
      }
    } catch (err) {
      console.log(`  [expandPromptToTarget] ⚠️ 外部专家方案失败: ${err.message}, 回退到原有策略`);
    }
  }

  // 🆕 v2.4-Peng: 如果有强制内容,预留空间并前置
  let finalPrompt = _deduplicatePrompt(prompt);
  let effectiveTarget = targetLength;

  // 🆕 v2.2-Peng-fix2: 系统级修复 -- 为生命迹象预留不可压缩空间
  // 无论镜头类型如何,必须保证生命迹象有注入空间
  // 这是机制级改进: 生命迹象优先级高于部分运镜/氛围描述
  const LIFE_SIGN_MIN_SPACE = 45; // 最小生命迹象空间: "breathing blinking micro-movements"
  const hasLifeSignsInMandatory = mandatoryText &&
    ['blinking', 'breathing', 'micro-movements', 'unconscious'].some(kw =>
      mandatoryText.toLowerCase().includes(kw)
    );

  // 如果mandatoryText中还没有生命迹象,预留空间
  const lifeSignReservedSpace = hasLifeSignsInMandatory ? 0 : LIFE_SIGN_MIN_SPACE;

  // 🆕 v10.2-Peng-fix: 片头shot特殊处理 -- 优先保留三大Agent核心内容
  const isOpeningTitle = shot?.type === 'opening_title';
  const hasFullSeedancePrompt = isOpeningTitle && shot._titleConfig?.seedancePrompt && shot._titleConfig.seedancePrompt.length > 500;

  if (mandatoryText && mandatoryText.length > 0) {
    const reservedSpace = mandatoryText.length + 2 + lifeSignReservedSpace; // +2 for ','
    effectiveTarget = targetLength - reservedSpace;

    if (hasFullSeedancePrompt) {
      // 🆕 v10.7-Peng-fix2: 片头shot -- 结构化保留核心内容,而非简单截断
      // 根因: _smartTruncate简单截断只保留前940字场景描述,丢掉后面的开场白/标题动效/神兽出场/小G入镜
      // 修复: 按内容优先级分段提取,确保关键元素不被截断
      const safeTarget = targetLength - (mandatoryText ? mandatoryText.length + 2 : 0); // +2 for ','
      console.log(`  [expandPromptToTarget] 🎬 片头shot结构化提取: seedancePrompt(${finalPrompt.length}字),目标${safeTarget}字`);

      // 定义段落优先级(高优先级=必保内容)
      const priorityPatterns = [
        // 🆕 v2.16-Peng-fix3: 标题显示指令独立最高优先级(P101),确保必须保留
        { pattern: /\[TITLE DISPLAY\]|The screen must clearly display.*main title/, priority: 101, name: '标题显示指令' },
        // 🆕 v2.16-Peng: 支持中英文标题显示指令(旧兼容)
        { pattern: /【标题显示】|画面必须清晰呈现文字/, priority: 100, name: '标题显示指令旧' },
        { pattern: /神兽.*出场|地底震动|战斧劈岩|巨躯升起|盾牌撞击|战魂屹立/, priority: 100, name: '神兽出场' },
        // 🆕 v2.16-Peng: 支持中英文开场白
        { pattern: /Welcome to|I am .*the eternal|Today.*will awaken|a child's curiosity/, priority: 100, name: '开场白' },
        { pattern: /标题不是静态文字|光脉矿脉被唤醒|地衣.*生长拼合|subtitle.*growing|lichen.*growing/, priority: 90, name: '标题动效' },
        // 🆕 v10.15-Peng-fix: 台词/对白高优先级匹配,确保英文台词保留
        { pattern: /对白:|Dialogue:|dialogue:|台词:|"[^"]{10,80}"/, priority: 88, name: '台词对白' },
        { pattern: /小G的入镜|小G.*走近|抬头仰望|伸手触碰|xiaoG.*walks|curious.*approach/, priority: 80, name: '小G入镜' },
        { pattern: /EPIC SCALE|GRAND VISTA|full-screen presence/, priority: 70, name: '视觉规模' },
        { pattern: /CG hyper-realistic|Nirath alien|bioluminescent ecosystem/, priority: 60, name: '技术标签' },
        { pattern: /sub-bass|earth rumble|magnetic field|bioluminescent spore/, priority: 50, name: '音效描述' },
        { pattern: /Nirath断裂山脉|粗糙多孔|风化裂缝|铁氧化物|玄武岩/, priority: 30, name: '场景描述' },
      ];

      // 将seedancePrompt按句号分段
      const segments = finalPrompt.split(/(?<=。)|(?<=\.)\s+/).filter(s => s.trim().length > 0);

      // 为每段计算优先级
      const scoredSegments = segments.map(seg => {
        let maxPriority = 0;
        let matchedName = '场景描述';
        for (const p of priorityPatterns) {
          if (!p || !p.pattern) continue;
          if (p.pattern.test(seg) && p.priority > maxPriority) {
            maxPriority = p.priority;
            matchedName = p.name;
          }
        }
        return { text: seg.trim(), priority: maxPriority, name: matchedName, length: seg.length };
      });

      // 按优先级降序排序,同优先级保持原文顺序
      scoredSegments.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return segments.indexOf(a.text) - segments.indexOf(b.text);
      });

      // 🆕 v10.7-Peng-fix2: 改为贪心选择--保持原文顺序,只跳过低优先级段落
      // 根因: 排序后重新拼接打乱了内容逻辑顺序
      // 修复: 按原文顺序遍历,优先保留高优先级段落,跳过低优先级以控制总长度
      // 🆕 v2.16-Peng-fix: 同优先级内按长度升序排列(短的优先),最大化保留数量
      // 🆕 v2.16-Peng-fix2: P101标题显示指令强制保留,P100神兽出场按长度升序保留核心短段落
      let accumulated = '';
      const includedNames = [];
      // 先按优先级分组
      const p101Segments = scoredSegments.filter(s => s.priority === 101);
      const p100Segments = scoredSegments.filter(s => s.priority === 100);
      const highPriority = scoredSegments.filter(s => s.priority >= 80 && s.priority < 100);
      const midPriority = scoredSegments.filter(s => s.priority >= 50 && s.priority < 80);
      const lowPriority = scoredSegments.filter(s => s.priority < 50);

      // P101最高优先级:标题显示指令,强制保留
      for (const seg of p101Segments) {
        if (accumulated.length + seg.length + 2 <= safeTarget) {
          accumulated += (accumulated ? '。' : '') + seg.text;
          includedNames.push(seg.name);
        }
      }

      // P100神兽出场:按长度升序排序,保留核心短段落,跳过长的音效/细节描述
      p100Segments.sort((a, b) => a.length - b.length);
      for (const seg of p100Segments) {
        if (accumulated.length + seg.length + 2 <= safeTarget) {
          accumulated += '。' + seg.text;
          includedNames.push(seg.name);
        }
      }

      // 其他高优先级(P80-P95):按长度升序
      highPriority.sort((a, b) => a.length - b.length);
      midPriority.sort((a, b) => a.length - b.length);
      lowPriority.sort((a, b) => a.length - b.length);

      // 高优先级
      for (const seg of highPriority) {
        if (accumulated.length + seg.length + 2 <= safeTarget) {
          accumulated += '。' + seg.text;
          includedNames.push(seg.name);
        }
      }
      // 再尝试中优先级
      for (const seg of midPriority) {
        if (accumulated.length + seg.length + 2 <= safeTarget) {
          accumulated += '。' + seg.text;
          includedNames.push(seg.name);
        }
      }
      // 最后填充低优先级(剩余空间)
      for (const seg of lowPriority) {
        if (accumulated.length + seg.length + 2 <= safeTarget) {
          accumulated += '。' + seg.text;
          includedNames.push(seg.name);
        }
      }

      finalPrompt = accumulated || _smartTruncate(finalPrompt, safeTarget); // fallback
      console.log(`  [expandPromptToTarget] 🎬 片头结构化提取完成: ${finalPrompt.length}字,保留内容: ${[...new Set(includedNames)].join(', ')}`);
      // 前置强制内容
      if (mandatoryText) {
        finalPrompt = mandatoryText + ',' + finalPrompt;
      }
      // 🆕 v10.6-Peng-fix: 片头shot追加关键supplements逼近上限
      // 根因: 片头shot跳过supplements导致利用率仅96%(950/1000)
      // 修复: 在seedancePrompt截断后,追加片头专用高优先级维度填充剩余空间
      const remainingSpace = targetLength - _countChars(finalPrompt) - 2; // v4.1: 使用_countChars, -2 for potential ','
      if (remainingSpace > 30) {
        const openingSupplements = [
          { text: 'EPIC GRAND VISTA, beast fills 50%+ of frame, overwhelming scale, low angle camera, full-screen visual impact', topic: 'epic_scale', priority: 11 },
          { text: 'volumetric light贯穿全场景,光束穿透浮尘,神圣感弥漫', topic: 'volumetric_light', priority: 9 },
          { text: '双星永恒暮光,双日交织的魔幻光效,宇宙级视觉奇观', topic: 'twin_sun_miracle', priority: 8 }
        ];
        for (const sup of openingSupplements) {
          if (remainingSpace > sup.text.length + 2 && !finalPrompt.includes(sup.text.substring(0, 10))) {
            finalPrompt += ',' + sup.text;
            console.log(`  [expandPromptToTarget] 🎨 片头supplement追加: ${sup.topic} (${sup.text.length}字)`);
          }
        }
      }
      // 🆕 v10.6-Peng-fix: 最终guard确保不超过targetLength*0.99(99%利用率上限)
      const maxAllowed = Math.floor(targetLength * 0.995);  // v6.17-Peng-fix4: 0.99→0.995,上限970→983
      if (_countChars(finalPrompt) > maxAllowed) { // v4.1: 使用_countChars
        console.log(`  [expandPromptToTarget] ⚠️ 片头shot最终长度${_countChars(finalPrompt)}超出99%上限${maxAllowed},二次截断`);
        // 🆕 v10.24-Peng-fix7: 片头shot硬截断至maxAllowed,避免_smartTruncate因句子边界回退导致利用率跌破95%
        finalPrompt = _charAwareSubstring(finalPrompt, 0, maxAllowed); // v4.1: 字符感知截断
      }
      const finalUtilization = (_countChars(finalPrompt) / targetLength) * 100; // v4.1: _countChars
      log('RenderEngine', `📊 Prompt字数利用率: ${finalUtilization.toFixed(1)}% (${_countChars(finalPrompt)}/${targetLength})`, finalUtilization >= 95 ? 'info' : 'warn'); // v4.1: _countChars
      return finalPrompt;
    }

  // 🆕 v10.21-Peng-fix: 系统级修复 -- 镜头专属内容保护截断器
  // 根因:_smartTruncate可能截断镜头专属描述,导致内容空洞
  // 修复:截断时优先保护镜头专属内容(subjectDesc部分),截断通用模板
  // 识别镜头专属内容标记:从parts数组中注入的emotionVisualNote/perceptionNote/cinematicMove等
  const INCREMENTAL_MARKERS = [
    'cinematic shot:', 'cinematic composition', 'key actions:', 'slow majestic', 'steady narrative',
    'tension rising', 'maximum intensity', 'emotional settling', 'drone shot', 'macro shot',
    'close-up capturing', 'high angle', 'orbiting camera', 'smooth tracking',
    'cold blue rim light', 'harsh top-down lighting', 'dappled fractured light',
    'golden hour backlighting', 'vast negative space', 'subject showing', 'subject reacting',
    'subject tilting', 'subject against', 'veins glowing', 'chest heaving',
    'shield surface', 'war-axe shaft'
  ];

  function protectIncrementalContent(text, maxLen) {
    if (text.length <= maxLen) return text;

    const incrementalStarts = [];
    for (const marker of INCREMENTAL_MARKERS) {
      const idx = text.indexOf(marker);
      if (idx !== -1) {
        incrementalStarts.push(idx);
      }
    }

    if (incrementalStarts.length === 0) {
      return _smartTruncate(text, maxLen);
    }

    const earliestIncremental = Math.min(...incrementalStarts);

    // 如果增量内容开始得晚(超过50%),直接截断前面保留增量
    if (earliestIncremental >= maxLen * 0.5) {
      return _smartTruncate(text.substring(earliestIncremental), maxLen);
    }

    const prefix = text.substring(0, earliestIncremental);
    const suffix = text.substring(earliestIncremental);

    // 优先保证suffix不超过maxLen
    if (suffix.length >= maxLen) {
      return _smartTruncate(suffix, maxLen);
    }

    // prefix + suffix > maxLen,截断prefix
    const maxPrefix = maxLen - suffix.length;
    if (maxPrefix > 50) {
      const truncatedPrefix = _smartTruncate(prefix, maxPrefix);
      return truncatedPrefix + suffix;
    } else {
      return _smartTruncate(suffix, maxLen);
    }
  }

  // 🆕 v10.23-Peng-fix: 修复截断逻辑 -- 保护镜头专属内容,优先截断强制维度
  // 历史bug: mandatoryText前置后,截断finalPrompt会保留mandatoryText而丢弃prompt
  // 修复: 截断时优先截断mandatoryText中冗余部分,确保prompt(镜头专属内容)完整保留
  if (_countChars(finalPrompt) > effectiveTarget) { // v4.1: 使用_countChars
    const excess = _countChars(finalPrompt) - effectiveTarget; // v4.1: _countChars
    console.log(`  [expandPromptToTarget] ⚠️ 总长度超出上限: ${_countChars(finalPrompt)}→${effectiveTarget}(截断${excess}字)`);

    // 保护prompt部分,从mandatoryText末尾开始截断
    const promptContent = prompt || '';
    const mandatoryContent = mandatoryText || '';
    const maxMandatory = effectiveTarget - _countChars(promptContent); // v4.1: _countChars

    if (maxMandatory > 50) {
      // 保留prompt完整,截断mandatoryText
      const truncatedMandatory = _smartTruncate(mandatoryContent, maxMandatory);
      finalPrompt = truncatedMandatory + promptContent;
      console.log(`  [expandPromptToTarget] ✅ 保护prompt(${promptContent.length}字),截断mandatory至${_countChars(truncatedMandatory)}字`); // v4.1: _countChars
    } else {
      // 🆕 v6.14-Peng-fix: 核心叙事内容保护截断
      // 根因: prompt超长时只保留50%内容,导致核心叙事字段被截断
      // 修复: 检测是否有LLM生成的结构化增强描述,提高保留比例到75%
      const hasEnhancedDesc = shot?._llmEnhancedDescription && shot._llmEnhancedDescription.length > 100;
      const minPromptRatio = hasEnhancedDesc ? 0.75 : 0.5;
      const minPrompt = Math.floor(_countChars(promptContent) * minPromptRatio); // v4.1: _countChars
      const maxPrompt = effectiveTarget - 50; // 保留50字给mandatoryText
      const targetForPrompt = Math.max(minPrompt, maxPrompt);

      // 🆕 v6.14-Peng-fix: 字段感知截断 -- 优先保护核心叙事标记
      // 识别prompt中的核心字段标记,确保截断后保留
      const coreMarkers = ['character:', 'action:', 'scene:', 'mood:', 'cinematic shot:'];
      let protectedPrompt = promptContent;
      const foundFields = [];
      for (const marker of coreMarkers) {
        const idx = protectedPrompt.toLowerCase().indexOf(marker);
        if (idx !== -1) {
          // 找到字段结束位置(下一个逗号或字段标记)
          let endIdx = protectedPrompt.length;
          for (const other of coreMarkers) {
            const otherIdx = protectedPrompt.toLowerCase().indexOf(other, idx + marker.length);
            if (otherIdx !== -1 && otherIdx < endIdx) {
              endIdx = otherIdx;
            }
          }
          const fieldText = protectedPrompt.substring(idx, endIdx).trim();
          if (fieldText.length > 0) {
            foundFields.push({ name: marker.replace(':', ''), length: fieldText.length });
          }
        }
      }
      if (foundFields.length > 0) {
        console.log(`  [expandPromptToTarget] 🆕 v6.14-Peng-fix: 检测到核心叙事字段: ${foundFields.map(f => f.name).join(', ')}`);
      }

      const truncatedPrompt = _smartTruncate(protectedPrompt, targetForPrompt);
      const truncatedMandatory = _smartTruncate(mandatoryContent, effectiveTarget - _countChars(truncatedPrompt)); // v4.1: _countChars
      finalPrompt = truncatedMandatory + truncatedPrompt;
      console.log(`  [expandPromptToTarget] ⚠️ prompt超长,截断至${_countChars(truncatedPrompt)}字(保留${minPromptRatio * 100}%)`); // v4.1: _countChars
    }
  }

  const supplements = [];
  const usedTopics = new Set();

  function addSupplement(text, topic, priority = 0) {
    if (!usedTopics.has(topic) && !finalPrompt.includes(text.substring(0, 6))) {
      supplements.push({ text, topic, priority });
      usedTopics.add(topic);
    }
  }

  // ========== 🎯 类型感知维度选择器 (v5.9-Peng) ==========

  // 1. 解析镜头特征
  const shotType = shot?.type || shot?.shotType || 'action';
  const cameraDesc = shot?.camera || '';
  const cameraDescStr = typeof cameraDesc === 'string' ? cameraDesc : ((cameraDesc?.move || '') + ' ' + (cameraDesc?.scale || ''));
  const shotSize = cameraDescStr.match(/(特写|近景|中景|全景|远景|大全景)/)?.[0] || '中景';
  const emotion = shot?.emotion || '';
  const act = shot?.act || '';
  const isClimax = shotType === 'climax' || act === '高潮';
  const isReveal = shotType === 'reveal';
  const isCloseup = shotType === 'closeup' || shotSize === '特写' || shotSize === '近景';
  const isWide = shotSize === '远景' || shotSize === '大全景' || shotSize === '全景';
  const isAction = shotType === 'action';
  const isOpening = shotType === 'opening_title';

  // 2. 景别→景深/镜头强制映射 (不再随机)
  const depthOfFieldMap = {
    '特写': { text: '浅景深 f/1.4,背景虚化如奶油般化开,主体突出,焦点锐利,细节纤毫毕现', priority: 10 },
    '近景': { text: '浅景深 f/2.8,前景清晰后景柔和虚化,主体突出,层次感分明', priority: 9 },
    '中景': { text: '标准 50mm 接近人眼自然视角,真实亲切无变形,最自然的观感,人物与环境比例协调', priority: 7 },
    '全景': { text: '全景深 f/8,前后景皆清晰交代环境,信息量丰富,细节一览无余,空间格局完整', priority: 8 },
    '远景': { text: '广角 24mm 透视夸张,前景放大后景收小,纵深感强,空间开阔,视觉冲击', priority: 9 },
    '大全景': { text: '长焦 85mm 压缩空间,背景拉近与主体几乎在同一平面,压缩感强烈,史诗格局', priority: 8 }
  };
  if (depthOfFieldMap[shotSize]) {
    addSupplement(depthOfFieldMap[shotSize].text, 'depth', depthOfFieldMap[shotSize].priority);
  }

  // 3. 镜头类型→维度优先级 (核心维度强制注入)
  const typePriorityMap = {
    'opening_title': {
      composition: '中心构图,主体占据视觉焦点,双星压迫感与异世界神性并存,画面庄重史诗',
      lighting: 'volumetric light贯穿全场景,光束穿透浮尘,神圣感弥漫',
      atmosphere: 'Nirath双星永恒暮光,双日交织的魔幻光效,宇宙级视觉奇观',
      // 🆕 v1.3-Peng: 片头大场面强制规范
      epicScale: 'EPIC GRAND VISTA, beast fills 50%+ of frame, overwhelming scale, low angle camera, full-screen visual impact, cinematic grandeur, shockwave visible, debris particles fill air, extreme wide angle lens distortion',
      priority: 10
    },
    'establishing': {
      composition: '三分法构图,主体位于视觉黄金点,双恒星之一作为背景光,画面平衡自然,空间层次丰富',
      lighting: '双日暮光主光源光影,自然光柔和均匀,环境光真实',
      atmosphere: 'Nirath alien planet, twin sun eternal twilight, bioluminescent ecosystem, 异世界原生生态',
      priority: 9
    },
    'reveal': {
      composition: '对称构图,利用外星地貌对称性,画面庄重神秘,Nirath祭坛式平衡,视觉稳定',
      lighting: 'obsidian rim light黑曜石边缘光,主体从暗部浮现,戏剧性揭示',
      atmosphere: '神秘氛围,能量粒子漂浮,空气微微扭曲,超自然力量显现前的静默',
      priority: 10
    },
    'closeup': {
      composition: '中心构图,主体占据视觉焦点,面部纹理清晰可见,情绪直达观众',
      lighting: 'god rays through alien canopy,光线穿透外星植被,神圣而神秘',
      atmosphere: '微距世界的震撼,皮肤纹理、瞳孔细节、能量微光,极致微观美学',
      priority: 10
    },
    'action': {
      composition: '动态构图,主体运动方向留白,速度感强烈,画面充满动能与张力',
      lighting: '运动光效,能量拖尾,速度线,动作张力视觉化',
      atmosphere: '高速运动感,空气被撕裂的视觉效果,动能与力量美学',
      priority: 9
    },
    'climax': {
      composition: '中心构图,主体占据视觉焦点,双星压迫感与异世界神性并存,画面充满爆发力',
      lighting: '极端光比,明暗对比强烈,戏剧性突出,立体感分明,高光炸裂',
      atmosphere: '终极力量感,能量漩涡达到最高速,空间扭曲,视觉巅峰体验',
      priority: 10
    },
    'resolution': {
      composition: '三分法构图,主体位于视觉黄金点,画面平衡自然,余韵悠长,静默中力量沉淀,空间格局史诗收尾',
      lighting: '柔和暮光,能量缓缓收敛,暖色调回归平静,治愈感光线,双星光芒交织成神圣光柱',
      atmosphere: '史诗余韵,不灭的战魂铭刻于大地,永恒铭记的庄重氛围,战魂能量余辉在空气中脉动,苍凉而神圣',
      priority: 8
    }
  };

  if (typePriorityMap[shotType]) {
    const cfg = typePriorityMap[shotType];
    addSupplement(cfg.composition, 'composition_type', cfg.priority);
    addSupplement(cfg.lighting, 'lighting_type', cfg.priority - 1);
    addSupplement(cfg.atmosphere, 'atmosphere_type', cfg.priority - 2);
    // 🆕 v1.3-Peng: 片头大场面强制注入
    if (cfg.epicScale) {
      addSupplement(cfg.epicScale, 'epic_scale', cfg.priority + 1); // 最高优先级
    }
  }

  // 4. 情绪→光线/节奏绑定 (不再随机)
  const emotionLightingMap = {
    '震惊': '硬光高对比,冷色调主导,阴影锋利如刀,不安感强烈',
    '恐惧': '底光向上照射,面部阴影狰狞,恐怖氛围,未知威胁感',
    '敬畏': '顶光洒落,神圣光芒,暖金色调,庄严神圣感',
    '神秘': '侧光勾勒轮廓,半明半暗,神秘感强烈,信息被刻意隐藏',
    '狂暴': '频闪效果,光影快速变化,视觉混乱感,失控与毁灭',
    '庄严': '柔和均匀光,低对比,暖色调,时间凝固的庄重',
    '感动': '逆光剪影,轮廓发光,情感升华,温暖包裹',
    '好奇': '侧逆光,主体边缘发光,探索感,未知领域的召唤',
    '平静': '柔光箱效果,无阴影,宁静安详,内心平和',
    '紧张': '窄光光束,局部照明,余光未知,悬念强烈'
  };

  // 情绪词匹配
  for (const [emoKey, lightingDesc] of Object.entries(emotionLightingMap)) {
    if (emotion.includes(emoKey) || shot.description?.includes(emoKey)) {
      addSupplement(lightingDesc, 'emotion_lighting', 8);
      break; // 只匹配第一个命中的情绪
    }
  }

  // 5. 叙事位置(起承转合)→情绪张力词 (精准映射,不再随机)
  const actTensionMap = {
    '起': {
      text: '情绪缓缓铺陈,伏笔暗埋,观众被悄然引入,期待感建立,第一幕的宁静表面下暗流涌动',
      rhythm: 'slow majestic pace, 沉稳开场,信息逐步释放',
      priority: 7
    },
    '承': {
      text: '情绪平稳推进,信息层递叠加,节奏有条不紊,铺垫扎实,第二幕的稳步上升',
      rhythm: 'steady tracking, 稳定跟随,叙事推进不疾不徐',
      priority: 6
    },
    '转': {
      text: '情绪暗流涌动,转折一触即发,紧张感攀升,临界点迫近,第三幕的质变前兆',
      rhythm: 'accelerating pace, 节奏加速,剪辑频率提升,山雨欲来',
      priority: 8
    },
    '高潮': {
      text: '情绪达到顶点,肾上腺素飙升,高潮炸裂,爆发力极强,全片最强视觉与情感冲击',
      rhythm: 'fast cut, 快速剪辑,跳切密集,信息轰炸,不留喘息',
      priority: 10
    },
    '合': {
      text: '情绪归于平静,余韵悠长,回味无穷,满足感与释然感,结尾的诗意留白',
      rhythm: 'slowing down, 节奏放缓,长镜头停留,情绪沉淀,余音绕梁',
      priority: 7
    }
  };

  if (actTensionMap[act]) {
    addSupplement(actTensionMap[act].text, 'act_tension', actTensionMap[act].priority);
    addSupplement(actTensionMap[act].rhythm, 'act_rhythm', actTensionMap[act].priority - 1);
  } else if (isClimax) {
    addSupplement(actTensionMap['高潮'].text, 'climax_tension', 10);
    addSupplement(actTensionMap['高潮'].rhythm, 'climax_rhythm', 9);
  }

  // 6. 镜头运动类型→运镜词匹配 (基于camera字段)
  const cameraMoveMap = {
    'FPV': { text: '第一人称视角,身临其境的沉浸感,主观镜头张力,观众成为参与者', priority: 8 },
    '航拍': { text: '上帝视角俯瞰,格局宏大,空间关系一目了然,史诗级视野', priority: 8 },
    '斯坦尼康': { text: '平滑流畅的跟随运动,呼吸感镜头,亲密而真实,纪录片质感', priority: 7 },
    '微距': { text: '微观世界探索,细节放大到极致,纹理清晰可见,隐秘之美', priority: 9 },
    '环绕': { text: '360度环绕揭示,全方位信息展示,空间环绕感,主体与环境关系', priority: 7 },
    '俯冲': { text: '高速俯冲视角,自由落体感,肾上腺素飙升,极限运动张力', priority: 9 },
    '贴地': { text: '贴地飞行视角,超低角度贴地,速度感极致,地面细节飞驰', priority: 8 },
    '特写': { text: '面部微表情捕捉,眼神光,皮肤质感,情绪直达', priority: 9 }
  };

  for (const [moveKey, moveDesc] of Object.entries(cameraMoveMap)) {
    const cameraDescStr = typeof cameraDesc === 'string' ? cameraDesc : ((cameraDesc?.move || '') + ' ' + (cameraDesc?.scale || ''));
    if (cameraDescStr.includes(moveKey) || shot.description?.includes(moveKey)) {
      addSupplement(moveDesc.text, 'camera_move_' + moveKey, moveDesc.priority);
      break;
    }
  }

  // 7. 风格DNA维度 (如果存在,高优先级)
  if (plan?.styleDNA) {
    const dna = plan.styleDNA;
    const dnaParts = [];

    if (dna['VG01光比偏好']) {
      const ratio = dna['VG01光比偏好'].match(/[混合]*s*(.+?)s*×/)?.[1] || '8:1';
      dnaParts.push({ text: '光比 ' + ratio + ',明暗对比强烈,戏剧性突出,立体感分明', priority: 7 });
    }
    if (dna['VG03色温基调']) {
      const temp = dna['VG03色温基调'].match(/(\d+)K/)?.[1] || '5600';
      dnaParts.push({ text: '色温 ' + temp + 'K,冷暖情绪明确,色调统一', priority: 6 });
    }
    if (dna['VG04饱和度']) {
      const sat = dna['VG04饱和度'].match(/[混合]*s*([\d.]+)/)?.[1] || '0.9';
      dnaParts.push({ text: '饱和度 ' + sat + ',色彩情绪精准,视觉调性统一', priority: 5 });
    }

    // DNA维度按优先级排序,只取前2个
    dnaParts.sort((a, b) => b.priority - a.priority);
    for (const part of dnaParts.slice(0, 2)) {
      addSupplement(part.text, 'dna_' + part.text.substring(0, 5), part.priority);
    }
  }

  // 8. 通用兜底维度 (低优先级,用于补充剩余空间)
  const fallbackDimensions = [
    { text: STYLE_SELECTOR ? STYLE_SELECTOR.getTextureDescription(CURRENT_STYLE_PROFILE) : 'natural material texture, realistic surface detail', topic: 'texture', priority: 3 },
    { text: STYLE_SELECTOR ? STYLE_SELECTOR.getColorDescription(CURRENT_STYLE_PROFILE) : 'Nirath alien ecosystem color palette, bioluminescent tones', topic: 'color', priority: 4 },
    { text: 'subsurface scattering on living organisms,次表面散射,皮肤半透明质感,生命感真实', topic: 'sss', priority: 3 },
    { text: 'atmospheric perspective远景偏蓝紫,空气透视,空间深度自然,远景朦胧层次', topic: 'atmosphere_perspective', priority: 4 },
    { text: 'lens flare光晕恰到好处,不遮挡主体,增加画面电影感,光学质感真实', topic: 'lens_flare', priority: 2 },
    { text: 'chromatic aberration轻微色差,镜头边缘色散,增加光学真实感,专业镜头特征', topic: 'chromatic', priority: 2 },
    { text: 'film grain细腻胶片颗粒,16mm质感,怀旧而真实,电影工业标准', topic: 'grain', priority: 2 },
    { text: 'bokeh散景形状优美,圆形光斑奶油般化开,焦外如梦境般柔美', topic: 'bokeh', priority: 3 },
    { text: 'vignette轻微暗角,画面边缘自然衰减,聚焦视线向中心,经典电影感', topic: 'vignette', priority: 2 },
    { text: 'color grading调色精准,高光暖调阴影冷调,色彩层次丰富,情绪色彩科学', topic: 'color_grading', priority: 3 },
    { text: 'motion blur运动模糊真实,速度感视觉化,动态模糊方向一致,物理真实', topic: 'motion_blur', priority: 3 },
    { text: 'caustics焦散光斑,透明材质折射光纹,水面光斑闪烁,光影细节丰富', topic: 'caustics', priority: 2 },
    { text: 'bloom泛光效果,高光轻微溢出,柔化硬边,梦幻氛围,视觉舒适度', topic: 'bloom', priority: 2 },
    { text: 'anamorphic squeeze变形宽银幕压缩感,2.39:1电影画幅,水平光拉丝', topic: 'anamorphic', priority: 2 }
  ];

  // 9. 按优先级排序,高优先级优先填充
  supplements.sort((a, b) => b.priority - a.priority);

  // 10. 填充逻辑:优先填充高优先级维度,直到接近上限
  let expanded = finalPrompt;
  for (const sup of supplements) {
    if (expanded.length + sup.text.length + 1 <= effectiveTarget) {
      expanded += ',' + sup.text;
    } else if (expanded.length < effectiveTarget) {
      const remaining = effectiveTarget - expanded.length - 1;
      if (remaining > 10) {
        expanded += ',' + sup.text.substring(0, remaining);
      }
      break;
    } else {
      break;
    }
  }

  // 如果还有剩余空间,尝试兜底维度
  for (const fallback of fallbackDimensions) {
    if (expanded.length + fallback.text.length + 1 <= effectiveTarget && !usedTopics.has(fallback.topic)) {
      expanded += ',' + fallback.text;
      usedTopics.add(fallback.topic);
    }
  }

  // 🆕 v6.5-Peng-fix: 利用率不足填充 -- 当长度<950时追加通用描述
  const MIN_TARGET = 1000; // v6.17-Peng-fix4: 950→1000, 底线=上限(1000),利用率目标99.9%,无限接近底线1000
  if (expanded.length < MIN_TARGET) {
    const shortfall = MIN_TARGET - expanded.length;
    const fillerTexts = [
      'microscopic dust particles floating in sunbeams,each grain visible,air transparency',
      'subtle skin pores and fine hair texture,microscopic detail visible',
      'natural finger tremor and slight body sway,lifelike movement',
      'fabric weave pattern and stitching detail,material texture clear',
      'shallow depth of field bokeh circles in background,creamy blur',
      'environmental audio reverb and spatial acoustics,immersive soundscape'
    ];
    let fillerIdx = 0;
    // 🆕 v6.5-Peng-fix2: 强制填充到MIN_TARGET，允许接近targetLength
    while (expanded.length < MIN_TARGET && fillerIdx < fillerTexts.length) {
      const text = fillerTexts[fillerIdx];
      const needed = MIN_TARGET - expanded.length;
      const availableSpace = targetLength - expanded.length - 1;
      if (availableSpace <= 0) break;
      // 如果filler能完整放入，追加完整filler；否则截断filler到可用空间
      if (text.length <= availableSpace) {
        expanded += ',' + text;
      } else {
        // 截断filler到可用空间，优先在逗号处截断
        let cutPos = text.lastIndexOf(',', availableSpace);
        if (cutPos < 10) cutPos = availableSpace; // 如果逗号太靠前，直接硬截断
        expanded += ',' + text.substring(0, cutPos);
      }
      fillerIdx++;
    }
    console.log(`  [expandPromptToTarget] 🎯 利用率不足填充: 追加${fillerIdx}项, ${expanded.length - (MIN_TARGET - shortfall)}→${expanded.length}字`);
  }

  // 🆕 v2.4-Peng: 前置强制内容
  if (mandatoryText) {
    expanded = mandatoryText + expanded;
  }

  // 🆕 v10.21-Peng-fix: 最终长度保护guard -- 确保不超过targetLength
  // 根因:mandatoryText + supplements组合可能超出targetLength
  // 修复:返回前强制截断到targetLength,但优先保留镜头专属内容(expanded部分)
  if (_countChars(expanded) > targetLength) {
    const excess = _countChars(expanded) - targetLength;
    console.log(`  [expandPromptToTarget] ⚠️ 最终长度保护guard触发: ${_countChars(expanded)}→${targetLength}(截断${excess}字)`);

    // 🆕 v10.24-Peng-fix: 优先保留prompt(expanded部分),截断mandatoryText
    // 历史bug: _smartTruncate保留开头(mandatoryText)而截断末尾(prompt)
    // 修复: 如果mandatoryText存在且超长,从mandatoryText末尾截断,保留完整prompt
    if (mandatoryText && expanded.startsWith(mandatoryText)) {
      const promptPart = expanded.substring(mandatoryText.length);
      if (promptPart.length > 0) {
        // 保留完整prompt,截断mandatoryText
        const maxMandatory = targetLength - _countChars(promptPart);
        if (maxMandatory > 50) {
          const truncatedMandatory = _smartTruncate(mandatoryText, maxMandatory);
          expanded = truncatedMandatory + promptPart;
          console.log(`  [expandPromptToTarget] ✅ 保护prompt(${promptPart.length}字),截断mandatory至${truncatedMandatory.length}字`);
        } else {
          // prompt本身超长,按比例截断
          const minPrompt = Math.floor(_countChars(promptPart) * 0.6); // 保留至少60% prompt
          const truncatedPrompt = _smartTruncate(promptPart, Math.max(minPrompt, targetLength - 50));
          const truncatedMandatory = _smartTruncate(mandatoryText, targetLength - _countChars(truncatedPrompt));
          expanded = truncatedMandatory + truncatedPrompt;
          console.log(`  [expandPromptToTarget] ⚠️ prompt超长,保留${_countChars(truncatedPrompt)}字,截断mandatory至${_countChars(truncatedMandatory)}字`);
        }
      } else {
        expanded = _smartTruncate(expanded, targetLength);
      }
    } else {
      expanded = _smartTruncate(expanded, targetLength);
    }
  }

  // 最终利用率校验
  // Hard cap: never exceed targetLength - 1 to ensure compliance (≤99% for 1000 limit)
  const hardCap = targetLength - 1;
  if (_countChars(expanded) > hardCap) {
    console.log(`  [expandPromptToTarget] ✂️ 硬截断至合规上限: ${_countChars(expanded)}→${hardCap}字`);
    expanded = _smartTruncate(expanded, hardCap);
  }

  // 🆕 v6.5-Peng-fix3: 二次填充 — 截断后若仍<950,追加短filler到targetLength-1
  const FINAL_MIN = 1000;  // v6.17-Peng-fix4: 950→1000, 二次填充底线=目标长度,无限接近底线1000
  if (expanded.length < FINAL_MIN) {
    const shortfiller = [
      'micro dust,air particles',
      'pore detail,skin texture',
      'subtle sway,natural motion',
      'thread detail,fabric texture',
      'soft bokeh,background blur',
      'reverb tail,space depth'
    ];
    let sfIdx = 0;
    while (expanded.length < FINAL_MIN && sfIdx < shortfiller.length) {
      const txt = shortfiller[sfIdx];
      if (expanded.length + txt.length + 1 <= hardCap) {
        expanded += ',' + txt;
      }
      sfIdx++;
    }
    console.log(`  [expandPromptToTarget] 🎯 二次填充: ${expanded.length}字,追加${sfIdx}项`);
  }

  const finalUtilization = (expanded.length / targetLength) * 100;
  log('RenderEngine', `📊 Prompt字数利用率: ${finalUtilization.toFixed(1)}% (${expanded.length}/${targetLength})`, finalUtilization >= 95 ? 'info' : 'warn');

  // 🆕 v5.9-Peng: 记录使用的维度(用于调试和优化)
  log('RenderEngine', `🎯 类型感知填充: 景别=${shotSize}, 类型=${shotType}, 情绪=${emotion || '无'}, 幕=${act || '无'}, 注入维度=[${supplements.slice(0, 5).map(s => s.topic).join(',')}]`, 'info');

  return expanded;
}
}
// 生成单镜头提示词
function generateShotPrompt(shot, plan, refs, dialogueEnhancement, isMultiShot = false, shotIndex = 0, previousShot = null) {
  // 🆕 v6.12-Peng-fix6: 永远走 v2 路径 —— _llmEnhancedDescription 由 serial-promptforge-v6.12.js 设置但从未被 pipeline 导入，导致永远为 undefined，走旧路径产生负数截断（474→-42）和乱码
  // 修复: 移除 _llmEnhancedDescription 条件，直接调用 generateShotPrompt_v2（内部使用 SmartTruncator 正确处理字段优先级）
  if (shot) {
    try {
      const result = generateShotPrompt_v2(shot, { targetLength: isMultiShot ? 280 : 1000 });
      if (result && result.prompt && result.prompt.length > 0) {
        console.log(`  [generateShotPrompt] 🆕 v6.12-Peng-fix6: v2生成成功: ${result.prompt.length}字, 利用率${result.utilization}%`);
        console.log(`  [generateShotPrompt] 🆕 v6.12-Peng-fix6: 字段完整性: ${result.validation?.fieldCompleteness?.present || 0}/${result.validation?.fieldCompleteness?.total || 10}`);
        shot._prompt = result.prompt;
        shot._promptFields = result.fields;
        shot._promptValidation = result.validation;
        return result.prompt;
      }
    } catch (err) {
      console.log(`  [generateShotPrompt] ⚠️ v2生成失败: ${err.message}, 回退到原有策略`);
    }
  }

  // v5.6-Peng-fix: 确保配置已初始化,否则PROMPT_MAX_LENGTH为undefined导致验证失效
  if (!CONFIG) initConfig();

  // v1.3-Peng: 从风格选择器获取风格签名
  let styleSignature = '写实风格';
  if (STYLE_SELECTOR) {
    styleSignature = STYLE_SELECTOR.buildStyleSignature(CURRENT_STYLE_PROFILE);
  }
  const styleNote = styleSignature.length > 60 ? styleSignature.split(',').slice(0, 3).join(',') : styleSignature;

  const videoType = plan?.videoType || 'action';

  // 🆕 v2.19-Peng: 5项P0改进集成 - 情绪视觉翻译引擎
  let emotionVisualNote = '';
  if (shot.emotion) {
    emotionVisualNote = translateEmotionToVisual(shot.emotion, {
      language: 'english',
      dimensions: ['lighting', 'color', 'camera'],
      maxLength: 180
    });
    if (emotionVisualNote) {
      console.log(`  [generateShotPrompt] 🎨 情绪视觉翻译: "${shot.emotion}" → "${emotionVisualNote.substring(0, 50)}..."`);
    }
  }

  // 🆕 v2.19-Peng: 5项P0改进集成 - 角色双锚点系统(替换原有角色视觉签名注入)
  // v1.1-Peng-fix: 极简ID模式(format='id-only')，省出150-200字给Dialogue/Scene/Camera
  let characterVisualNote = '';
  const shotChars = shot.characters || [];
  const hasRefs = (refs || []).length > 0;

  if (shotChars.length > 0 && plan?.characters) {
    // 使用双锚点系统生成角色描述
    const dualAnchors = generateDualAnchors(shot, plan, refs);
    characterVisualNote = mergeAnchorsToPrompt(dualAnchors, {
      maxLength: 30,  // 🆕 v1.1-Peng: 极简模式，从250降到30
      includeRefNote: hasRefs,
      format: 'id-only'  // Minimal ID mode: name + ref image ID only
    });

    // 记录双锚点分析
    if (Object.keys(dualAnchors).length > 0) {
      console.log(`  [generateShotPrompt] 🔗 双锚点系统: ${Object.keys(dualAnchors).join(', ')} (strength: ${Object.values(dualAnchors)[0]?.strength || 'unknown'})`);
    }
  }

  // 🆕 v2.19-Peng: 5项P0改进集成 - 生理感知注入系统
  let perceptionNote = '';
  if (shotChars.length > 0 && plan?.characters) {
    perceptionNote = generateShotPerceptions(shot, plan);
    if (perceptionNote) {
      console.log(`  [generateShotPrompt] 🫀 生理感知注入: ${perceptionNote.substring(0, 60)}...`);
    }
  }

  // 🆕 v2.19-Peng: 5项P0改进集成 - Dialogue管线保留
  // v10.24-Peng-fix4: 所有对白/角色台词/声音全部保留在视觉Prompt中,由Seedance直接生成
  // 不走后续单独音频通道配音,音频管线仅作备用记录
  let dialogueMetadata = null;

  // 🆕 v3.0-Peng (2026-05-29): 独立音频叙事字段模块 - dialogueBlock
  // 把角色台词/台词/声音作为视觉叙事信息独立封装,后续可单独优化此模块内容
  let dialogueBlock = '';

  if (dialogueEnhancement) {
    const clean = dialogueEnhancement.startsWith(',') ? dialogueEnhancement.slice(1) : dialogueEnhancement;

    // 所有镜头:台词保留在视觉Prompt中,让Seedance生成声音视觉化效果
    // 同时记录到音频管线作为备用
    // v10.24-Peng-fix5: 台词保留长度恢复200,括号动作描述作为肢体语言线索
    dialogueMetadata = {
      text: _preserveFullSentence(clean, 200),
      shotId: shot.id,
      characters: shotChars,
      timestamp: new Date().toISOString(),
      renderBy: 'seedance' // 标记由Seedance渲染,不走TTS
    };
    shot._dialogueMetadata = dialogueMetadata;
    console.log(`  [generateShotPrompt] 🎭 台词保留注入视觉Prompt (Seedance生成): ${clean.substring(0, 60)}...`);
  }

  // v5.1-Peng-fix: 将角色视觉锚点写回shot对象,供预生产检查清单使用
  shot._characterVisualNote = characterVisualNote;

  // v5.9-Peng-fix: 记录定妆照引用,供检查清单验证
  if (refs && refs.length > 0) {
    shot._refPhotos = refs;
  }

  // 🆕 v6.14-Peng-fix: 解析_llmEnhancedDescription中的结构化字段
  // 根因: LLM生成的8字段被当作纯文本直接塞进prompt，截断时破坏结构
  // 🆕 v6.19-Peng: 升级支持JSON格式和中文/英文冒号格式，使用简单行拆分解析
  let enhancedFields = {};
  const llmText = shot._llmEnhancedDescription || '';
  if (llmText.length > 50) {
    // 尝试JSON格式解析
    if (llmText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(llmText);
        const fieldMap = {
          'Character': 'character', 'Camera': 'camera', 'Lighting': 'lighting',
          'Scene': 'scene', 'Mood': 'mood', 'Action': 'action',
          'EnvironmentStyle': 'environmentstyle', 'DirectorStyle': 'directorstyle',
          'CharacterRef': 'characterref', 'Dialogue': 'dialogue', 'Timeline': 'timeline'
        };
        let parsedCount = 0;
        for (const [jsonKey, localKey] of Object.entries(fieldMap)) {
          if (parsed[jsonKey] && typeof parsed[jsonKey] === 'string' && parsed[jsonKey].length > 5) {
            enhancedFields[localKey] = parsed[jsonKey];
            parsedCount++;
          }
        }
        if (parsedCount >= 3) {
          console.log('  [generateShotPrompt] 🆕 v6.19-Peng: JSON字段解析成功(' + parsedCount + '字段): ' + Object.keys(enhancedFields).join(', '));
        }
      } catch (e) { /* JSON失败，尝试行拆分格式 */ }
    }
    // 冒号格式兜底: 按换行拆分，每行 "字段名: 内容" 格式
    if (Object.keys(enhancedFields).length < 3) {
      const lines = llmText.indexOf(10) >= 0 ? llmText.split('\n') : [llmText];
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < line.length - 1) {
          const fieldName = line.substring(0, colonIdx).trim().toLowerCase();
          const value = line.substring(colonIdx + 1).trim();
          if (value.length > 5 && !enhancedFields[fieldName]) {
            enhancedFields[fieldName] = value;
          }
        }
      }
      if (Object.keys(enhancedFields).length >= 3) {
        console.log('  [generateShotPrompt] 🆕 v6.14-Peng-fix: 冒号格式解析成功(' + Object.keys(enhancedFields).length + '字段): ' + Object.keys(enhancedFields).join(', '));
      }
    }
  }

  let subjectDesc = shot._llmEnhancedDescription || shot.description || '';

  // 🆕 v6.14-Peng-fix: 用结构化字段替换/增强prompt各部分
  // 1. Character → 替换极简ID模式的角色锚点(30字→完整描述)
  if (enhancedFields.character && enhancedFields.character.length > 10) {
    const charDesc = enhancedFields.character;
    // 保留参考图标记,替换角色描述内容
    if (hasRefs) {
      characterVisualNote = `character: ${charDesc}, reference image locked`;
    } else {
      characterVisualNote = `character: ${charDesc}`;
    }
    console.log(`  [generateShotPrompt] 🆕 v6.14-Peng-fix: Character字段替换极简锚点: ${charDesc.length}字`);
  }

  // 2. Action + Scene + Mood → 作为主体描述(不再塞整个_llmEnhancedDescription)
  // 🆕 v6.14-Peng-fix: 预声明cinematicMove和lightingThreeLayer,避免暂时性死区
  let cinematicMove = shot._cinematicMove || shot.cinematicMove || '';
  let lightingThreeLayer = shot._lightingThreeLayer || shot.lightingThreeLayer || '';

  if (enhancedFields.action || enhancedFields.scene || enhancedFields.mood) {
    const coreParts = [];
    if (enhancedFields.action) coreParts.push(enhancedFields.action);
    if (enhancedFields.scene) coreParts.push(enhancedFields.scene);
    if (enhancedFields.mood) coreParts.push(enhancedFields.mood);
    if (coreParts.length > 0) {
      subjectDesc = coreParts.join(', ');
      console.log(`  [generateShotPrompt] 🆕 v6.14-Peng-fix: 使用结构化字段构建主体描述: ${subjectDesc.length}字 (Action+Scene+Mood)`);
    }
  }

  // 3. Camera → 增强运镜描述
  if (enhancedFields.camera && enhancedFields.camera.length > 10) {
    if (cinematicMove && cinematicMove.length > 0) {
      cinematicMove = `${cinematicMove} | ${enhancedFields.camera}`;
    } else {
      cinematicMove = enhancedFields.camera;
    }
    console.log(`  [generateShotPrompt] 🆕 v6.14-Peng-fix: Camera字段增强运镜: ${enhancedFields.camera.length}字`);
  }

  // 4. Lighting → 加入光照描述(如果plan没有lightingThreeLayer)
  if (enhancedFields.lighting && enhancedFields.lighting.length > 10) {
    if (!plan?.lightingThreeLayer || plan.lightingThreeLayer.length < 10) {
      plan = plan || {};
      plan.lightingThreeLayer = enhancedFields.lighting;
      console.log(`  [generateShotPrompt] 🆕 v6.14-Peng-fix: Lighting字段注入光照: ${enhancedFields.lighting.length}字`);
    }
  }

  // 🆕 v10.21-Peng-fix: 系统级修复 -- 镜头专属内容完整性保障
  // 根因:shot.description可能为空或极短,导致镜头增量内容缺失
  // 修复:如果subjectDesc < 150字,从shot的camera/emotion/type/narrative等字段自动生成补充描述
  if (subjectDesc.length < 150) {
    const incrementalParts = [];

    // 从镜头类型推导动作
    const shotType = shot.type || 'action';
    const act = shot.act || '';
    const emotion = shot.emotion || '';
    let camera = shot.camera || shot.cinematography || '';
    // 🆕 v5.30-Peng-fix: camera字段可能是对象,提取字符串
    if (typeof camera === 'object' && camera !== null) {
      camera = camera.move || camera.description || JSON.stringify(camera);
    }

    // 类型专属动作模板
    const typeActionMap = {
      'opening_title': 'epic scale reveal, camera slowly ascending from ground level to reveal massive scale, title emerging from natural textures',
      'establishing': 'wide establishing shot, subject entering frame from natural direction, scale relationship between characters and environment revealed',
      'action': 'dynamic movement, subject performing key action with clear motion direction, energy and tension visible in body language',
      'reveal': 'dramatic reveal, hidden subject emerging into light, camera focusing on critical detail, sense of discovery',
      'climax': 'peak moment captured, subject at maximum emotional/physical intensity, decisive action frozen in time, surrounding reacting to the moment',
      'closeup': 'extreme close-up on critical detail, texture and emotion magnified, micro-movements telling the story',
      'resolution': 'final moment of calm after climax, subject in resting state but carrying the weight of what happened, lingering emotional resonance'
    };

    if (typeActionMap[shotType]) {
      incrementalParts.push(typeActionMap[shotType]);
    }

    // 从幕位推导节奏
    const actRhythmMap = {
      '起': 'slow majestic opening pace, information gradually unfolding, building anticipation',
      '承': 'steady narrative progression, layers of information stacking, maintaining engagement',
      '转': 'tension rising, approaching turning point, emotional undercurrent surging',
      '高潮': 'maximum intensity, adrenaline peak, visual and emotional climax, decisive moment',
      '合': 'emotional settling, poetic lingering, quiet aftermath carrying profound weight'
    };

    if (actRhythmMap[act]) {
      incrementalParts.push(actRhythmMap[act]);
    }

    // 从情绪推导视觉焦点
    const emotionFocusMap = {
      '不安': 'subject showing subtle unease, slight tension in posture, eyes scanning cautiously',
      '恐惧': 'subject reacting to threat, defensive body language, environment amplifying dread',
      '困惑': 'subject tilting head, eyes narrowing in contemplation, moment of realization dawning',
      '悲悯': 'subject showing profound compassion, gentle gesture of connection, warmth piercing through hardship',
      '苍凉': 'subject against vast empty landscape, solitary figure carrying timeless weight, distant horizon emphasizing solitude'
    };

    if (emotionFocusMap[emotion]) {
      incrementalParts.push(emotionFocusMap[emotion]);
    }

    // 从运镜推导摄影机语言
    if (camera) {
      const cameraLangMap = {
        '航拍': 'drone shot descending through atmosphere, revealing scale and spatial relationships',
        '微距': 'macro shot exploring microscopic details, texture and intimacy amplified',
        '特写': 'close-up capturing micro-expressions, eyes telling the unspoken story',
        '俯冲': 'high angle rapid descent, vertigo-inducing perspective, adrenaline-pumping framing',
        '环绕': 'orbiting camera revealing 360-degree environment, spatial immersion',
        '斯坦尼康': 'smooth tracking shot following subject movement, intimate documentary feel'
      };

      for (const [camKey, camDesc] of Object.entries(cameraLangMap)) {
        if (camera.includes(camKey)) {
          incrementalParts.push(camDesc);
          break;
        }
      }
    }

    // 如果还不够,从shot.description中的关键词提取
    if (shot.description && shot.description.length > 10) {
      // 提取description中的动词和动作
      const actionKeywords = shot.description.match(/[\u4e00-\u9fa5]{2,}(?:着|了|过|到|向|往|来|去|出|入|上|下|进|退|走|跑|飞|跳|站|坐|躺|举|握|挥|舞|劈|砍|击|撞|震|摇|晃|转|旋|绕|环|升|降|沉|浮|亮|暗|醒|睡|看|望|盯|瞪|闭|睁|笑|哭|怒|怕|惊|喜|悲|思|想|听|闻|说|喊|叫|吟|唱|呼|吸)/g);
      if (actionKeywords && actionKeywords.length > 0) {
        incrementalParts.push(`key actions: ${actionKeywords.slice(0, 3).join(', ')}`);
      }
    }

    // 生成增量描述
    if (incrementalParts.length > 0) {
      const incrementalDesc = incrementalParts.join(', ');
      subjectDesc += (subjectDesc.length > 0 ? ', ' : '') + incrementalDesc;
      console.log(`  [generateShotPrompt] 🆕 镜头增量内容生成器 v1.0-Peng: ${shot.id} 补充${incrementalDesc.length}字专属内容`);
    }
  }

  // 🆕 v10.21-Peng-fix: 系统级修复 -- 镜头专属内容最低长度保障
  // 如果仍然不足150字,追加兜底描述
  if (subjectDesc.length < 150) {
    const fallbackDesc = `cinematic composition with clear visual hierarchy, subject positioned for maximum emotional impact, lighting and atmosphere supporting the narrative moment of ${shot.act || 'this scene'}`;
    subjectDesc += (subjectDesc.length > 0 ? ', ' : '') + fallbackDesc;
    console.log(`  [generateShotPrompt] 🆕 镜头增量兜底注入: ${shot.id} 追加兜底描述`);
  }

  // 🆕 v5.6-Peng-fix: 将shot.emotion注入主体描述,增强情绪氛围传递
  // 质检引擎检测"情绪氛围"维度,需要将情绪词显性化
  if (shot.emotion && shot.emotion.length > 0) {
    const emotionKeywords = {
      '好奇探索': '充满好奇的探索目光',
      '震惊敬畏': '震惊而敬畏的神情',
      '神秘苏醒': '神秘而庄严的苏醒氛围',
      '力量觉醒': '力量觉醒的震撼瞬间',
      '狂暴战斗': '狂暴而激烈的战斗情绪',
      '震撼压迫': '令人窒息的压迫感',
      '终极力量': '终极力量爆发的巅峰时刻',
      '敬畏感动': '敬畏与感动交织的情绪',
      '永恒铭记': '永恒铭记的庄重氛围'
    };
    const emotionEnhancement = emotionKeywords[shot.emotion] || `情绪:${shot.emotion}`;
    if (!subjectDesc.includes(shot.emotion) && !subjectDesc.includes(emotionEnhancement)) {
      subjectDesc += `,${emotionEnhancement}`;
    }
  }

  // v1.3-Peng: 为第2+镜头添加承接叙事(延续上一镜头动作)
  if (shotIndex > 0 && previousShot) {
    subjectDesc = generateContinuityNarrative(shotIndex, previousShot.description || '', subjectDesc);
  }

  // 如果描述较短(<80字),自动扩充增加细节维度
  if (subjectDesc.length > 0 && subjectDesc.length < 80) {
    const expansions = [
      ',周围环境细节丰富,氛围感强烈',
      ',人物表情细腻,情绪层次递进',
      ',光影变化自然,质感真实',
      ',画面构图精致,视觉焦点突出',
      ',动作流畅自然,节奏感恰到好处',
      ',环境氛围浓厚,沉浸感强',
      ',色彩层次丰富,视觉冲击力',
      ',空间纵深感强,画面立体'
    ];
    const expansion = expansions[Math.floor(Math.random() * expansions.length)];
    if (!subjectDesc.includes(expansion.substring(1, 5))) {
      subjectDesc += expansion;
    }
  }

  // 🆕 v5.8-Peng: 单镜头时间线分解注入 - 高密度节奏控制
  // 对 duration >= 6s 的镜头,自动分解为子时段,每段包含场景+运镜+灯光+音效视觉化
  // 🆕 v5.8-Peng: 单镜头高密度时间线分解引擎 - 6维度节奏控制
  // 对 duration >= 6s 的镜头,自动分解为子时段:场景递进+角色动作/表情+运镜+灯光+转场+音效视觉化
  const temporalBreakdown = generateTemporalBreakdown(shot, plan);
  if (temporalBreakdown) {
    const timelineText = buildCompactTimelineText(temporalBreakdown);
    if (timelineText && subjectDesc.length > 0) {
      // 用 [T:...] 极度紧凑标记,节省Prompt空间
      subjectDesc += ` [T:${timelineText}]`;
    }
  }

  let cameraDesc = shot.camera || shot.cinematography || '';
  const cameraDescStr = typeof cameraDesc === 'string' ? cameraDesc : ((cameraDesc?.move || '') + ' ' + (cameraDesc?.scale || ''));
  // v1.3-Peng: 使用好莱坞级英文运镜词替换中文简写
  // 🎬 v2.7-Peng: 传入镜头描述和情绪,支持智能运镜推荐
  
  // 🚨 v5.24-Peng-fix: 数据污染清理 — 防止上游重复注入SCENE-SPECIFIC
  // 根因: story-plan.json 中 camera 字段可能被重复粘贴多次
  // 修复: 清理 cameraDesc 中重复的 SCENE-SPECIFIC 段落,只保留第一个
  if (cameraDescStr && cameraDescStr.includes('SCENE-SPECIFIC')) {
    const firstSceneSpecific = cameraDescStr.indexOf('SCENE-SPECIFIC');
    const nextSceneSpecific = cameraDescStr.indexOf('SCENE-SPECIFIC', firstSceneSpecific + 1);
    if (nextSceneSpecific !== -1) {
      // 检测到重复注入,只保留到第一个SCENE-SPECIFIC结束(或整个字符串)
      const cleaned = cameraDescStr.substring(0, nextSceneSpecific).trim();
      // 去掉末尾的 "|" 分隔符
      const cleanedFinal = cleaned.replace(/\s*\|\s*$/, '');
      console.log(`  [generateShotPrompt] 🧹 清理数据污染: cameraDesc 从 ${cameraDescStr.length} 字截断至 ${cleanedFinal.length} 字,移除 ${Math.floor((cameraDescStr.length - cleanedFinal.length) / 120)} 个重复SCENE-SPECIFIC`);
      cameraDesc = cleanedFinal;
    }
  }

  // 🆕 v10.28-Peng-fix4: 运镜风格约束 — 防止风格超标导致认知混乱
  // 根因: 导演审片指出全片使用≥8种风格，每次切换都是重新学习
  // 修复: 每个镜头限制≤3个风格词，优先保留高优先级族
  try {
    const { checkStyleConstraint, constrainCameraStyle } = require('./camera-style-constraint');
    const styleResult = checkStyleConstraint(cameraDesc);
    if (!styleResult.isValid) {
      const constrained = constrainCameraStyle(cameraDesc, shot.type);
      console.log(`  [generateShotPrompt] 🎬 运镜风格约束: ${shot.id} 从 ${styleResult.totalKeywords}个风格词精简至≤3个`);
      cameraDesc = constrained;
    }
  } catch (err) {
    console.log(`  [generateShotPrompt] ⚠️ 风格约束模块加载失败(非阻断): ${err.message}`);
  }

  // 🆕 v6.14-Peng-fix: 初始化cinematicMove(如果尚未被结构化字段赋值)
  if (!cinematicMove || cinematicMove.length === 0) {
    cinematicMove = getCinematicMove(cameraDesc, subjectDesc, shot.emotion || '');
  }

  // 🎬 v3.1-Peng: 如果存在场景专属运镜语法,合并到运镜描述
  if (shot._sceneGrammar) {
    const sg = shot._sceneGrammar;
    const sceneMove = `${sg.technique} - ${sg.name}. ${sg.description} (${sg.duration}, ${sg.lens || 'standard lens'}, mood: ${sg.mood})`;
    cinematicMove = cinematicMove
      ? `${cinematicMove} | SCENE-SPECIFIC: ${sceneMove}`
      : sceneMove;
  }

  // 🎬 v3.1-Peng: 如果存在场景ID和镜头角色,也注入到运镜
  if (shot._sceneId && shot._shotRole && !shot._sceneGrammar) {
    const sceneExtra = `[${shot._sceneId} → ${shot._shotRole}]`;
    cinematicMove = cinematicMove
      ? `${cinematicMove} ${sceneExtra}`
      : sceneExtra;
  }

  const refNote = (refs || []).length > 0 ? `参考${refs.length}张角色图片` : '';

  // v10.24-Peng-fix4: 所有对白/角色台词/声音保留在视觉Prompt中,由Seedance生成
  // 不走后续单独音频通道配音
  let dialogueNote = dialogueEnhancement || '';
  if (dialogueNote) {
    const clean = dialogueNote.startsWith(',') ? dialogueNote.slice(1) : dialogueNote;
    // v10.24-Peng-fix5: 台词保留长度恢复200,括号动作描述作为肢体语言线索
    dialogueNote = _preserveFullSentence(clean, 200);
    console.log(`  [generateShotPrompt] 🎭 台词保留注入视觉Prompt (Seedance生成): ${dialogueNote.substring(0, 60)}...`);
  }

  let soundDesc = ''; // 🆕 v10.2-Peng-fix: 声明声音描述变量

  // 🆕 v3.3-Peng-fix2: 神兽开场白声音层注入(opening_title类型)
  // 🆕 v10.2-Peng-fix: 如果shot._titleConfig.seedancePrompt已包含完整声音描述,跳过重复注入
  let audioNote = '';
  const hasFullSeedancePrompt = shot._isOpeningTitle && shot._titleConfig?.seedancePrompt && shot._titleConfig.seedancePrompt.length > 500;

  if (shot.type === 'opening_title' && shot._audioLayer && !hasFullSeedancePrompt) {
    const al = shot._audioLayer;
    // 提取固定锚点和悬念钩子(从seedancePromptSegment或chineseDesc中解析)
    const fullText = al.seedancePromptSegment || al.chineseDesc || '';
    const anchorMatch = fullText.match(/固定锚点.*?「(.+?)」/);
    const hookMatch = fullText.match(/悬念钩子.*?「(.+?)」/);
    const timbreMatch = fullText.match(/音色特征:(.+)/);
    const paceMatch = fullText.match(/语速节奏:(.+)/);
    const emotionMatch = fullText.match(/情绪色彩:(.+)/);

    const anchor = anchorMatch ? anchorMatch[1] : '';
    const hook = hookMatch ? hookMatch[1] : '';
    const timbre = timbreMatch ? timbreMatch[1] : '低沉浑厚';
    const pace = paceMatch ? paceMatch[1] : '缓慢坚定';
    const emotion = emotionMatch ? emotionMatch[1] : '威严沧桑';

    const fullLine = [anchor, hook].filter(Boolean).join(' ');
    audioNote = `Beast Opening: "${fullLine}". Voice:${timbre}|Pace:${pace}|Emotion:${emotion}.`;
  } else if (hasFullSeedancePrompt) {
    console.log('  [generateShotPrompt] i️ 片头shot已有完整seedancePrompt(' + shot._titleConfig.seedancePrompt.length + '字),跳过audioNote重复注入');
  }

  // 🆕 v1.0-Peng (2026-05-29): 环境音效智能设计模块 - AmbientSoundBlock
  // 根据镜头环境和Nirath生态自动生成环境背景音效描述
  const { generateAmbientSoundBlock } = require('./environment-sound-designer');
  const ambientSoundResult = generateAmbientSoundBlock(shot, plan, { soundCount: 3 });

  // 🆕 v3.0-Peng (2026-05-29): 构建独立音频叙事字段模块 - dialogueBlock
  // 将角色台词/台词/声音作为视觉叙事信息统一封装,后续可单独优化此模块内容
  // 模块结构:Dialogue: {角色} speaks "{台词}" | Voice:{音色} | Action:{动作} | Mood:{情绪}
  const audioNarrativeParts = [];
  if (dialogueNote) {
    const speakerRole = shotChars.length > 0 ? shotChars[0] : 'Role';
    audioNarrativeParts.push(`${speakerRole} speaks: "${dialogueNote}"`);
  }
  if (audioNote) {
    audioNarrativeParts.push(audioNote);
  }
  // 从台词中提取动作描述(括号内)作为肢体线索
  if (dialogueNote) {
    const actionMatches = dialogueNote.match(/\(([^)]+)\)/g);
    if (actionMatches) {
      const actionDesc = actionMatches.map(m => m.slice(1, -1)).join(', ');
      audioNarrativeParts.push(`Action: ${actionDesc}`);
    }
  }
  if (audioNarrativeParts.length > 0) {
    dialogueBlock = `Dialogue: ${audioNarrativeParts.join(' | ')}`;
    console.log(`  [generateShotPrompt] 🔊 台词模块构建: ${dialogueBlock.substring(0, 80)}...`);
  }

  // v1.3-Peng: 将专业运镜词融入prompt(英文部分)
  // 🆕 v2.19-Peng: 5项P0改进集成 - 加入情绪视觉翻译 + 生理感知注入
  // v10.24-Peng-fix4: 所有台词保留在视觉Prompt中,由Seedance生成声音视觉化效果
  const parts = [
    characterVisualNote,   // 角色视觉锚点(CG超写实)
    refNote,               // 参考图片
    subjectDesc,           // 主体描述
    emotionVisualNote,     // 🆕 情绪视觉翻译结果
    perceptionNote,        // 🆕 生理感知注入结果
    // 🆕 v3.1-Peng: EnvironmentStyle已移至mandatoryDimensions强制注入,避免重复
    // 角色: CG超写实 | 环境: 实景拍摄,4K高清,电影质感,细节清晰,色彩自然
    // 🆕 v3.0-Peng: audioNote已从parts移入dialogueBlock独立模块,避免重复注入
    // audioNote已打包至mandatoryDimensions中的dialogueBlock字段
    cinematicMove ? `cinematic shot: ${cinematicMove}` : '',
    `${styleNote},${(plan?.lightingThreeLayer || '自然光').split(',')[0]}光影`
  ].filter(Boolean);

  let prompt = parts.join(',').replace(/,{2,}/g, ',');

  // 🆕 v10.15-Peng-fix-debug: 调试用日志
  if (dialogueBlock) {
    console.log(`  [generateShotPrompt] 🎭 台词模块已注入: ${dialogueBlock.substring(0, 60)}...`);
  }

  // 🆕 v10.3-Peng-fix: 尾部注入全部删除,统一由mandatoryDimensions + expandPromptToTarget处理
  // 历史问题:此处有3处独立尾部注入(免责声明/宽高比/Nirath),各自做简单长度检查后就追加,
  // 与后续expandPromptToTarget内的mandatoryDimensions重复,导致:
  // 1) 长度控制混乱(先追加后expand,expand的effectiveTarget计算失效)
  // 2) 内容重复(宽高比/Nirath既在尾部追加又进mandatoryText前置)
  // 3) 截断位置不可控(尾部注入不经过_smartTruncate)
  // 系统性修复:所有强制维度统一在mandatoryDimensions中管理,expandPromptToTarget是Prompt组装的唯一出口。

  // 🆕 v2.5-Peng-fix: 开场标题特殊处理 - 标题文案较长,预留更多空间
  // isOpeningTitle已在函数顶部声明(第479行),此处直接使用
  // 🆕 v1.3-Peng: 片头类型增加目标长度,容纳大场面描述
  const targetLength = isMultiShot ? 280 : 1000;  // v6.17-Peng-fix4: 底线1000字符,max=1000留2字符缓冲

  // 🎬 v5.5-Peng-fix: 质检强制修复 - 注入缺失的关键维度
  // 预生产=生产链路,所有Prompt必须包含4个强制维度
  // 🆕 v2.4-Peng: 统一在expandPromptToTarget内部处理,避免破坏长度控制
  // 🆕 v10.2-Peng-fix: 片头shot特殊处理 -- 已有完整seedancePrompt时,跳过独立mandatoryDimensions
  // 注意: hasFullSeedancePrompt已在audioNote部分声明

  let mandatoryDimensions = [];

  // 🆕 v10.24-Peng-fix2: 免责声明最高优先级 - 截断时优先保留
  // 历史bug: mandatoryText被截断时免责声明丢失,导致合规检查失败
  // 修复: 免责声明作为第1个强制维度注入,确保_expandPromptToTarget截断时从末尾开始,保留免责声明
  const disclaimers = [];
  if (!prompt.includes('fictional') && !prompt.includes('digital character')) {
    disclaimers.push('CG hyper-realistic digital character');
  }
  if (!prompt.includes('not real') && !prompt.includes('NOT a real')) {
    disclaimers.push('NOT a real person, completely fictional digital creation');
  }
  if (!prompt.includes('AI generated') && !prompt.includes('generated by AI')) {
    disclaimers.push('generated by AI for entertainment purpose');
  }
  if (disclaimers.length > 0) {
    mandatoryDimensions.unshift('DISCLAIMER: ' + disclaimers.join(', ') + '.');
  }

  // 🆕 v10.5-Peng: 全局暗黑风禁止约束(大鹏强约束)
  // 位置:必须在hasFullSeedancePrompt判断之前,确保所有镜头生效
  // 要求:明亮、多色彩、强质感,禁止乌漆嘛黑/晚上风格
  mandatoryDimensions.push('NO dark scene NO pitch black NO total darkness NO night time NO midnight atmosphere, bright vivid colors and strong textures required');

  // 🆕 v1.0-Peng-release: Scenography Designer - 场景美术设计引擎
  // 为每个镜头设计完整的背景环境美术(地形、大气、生态、光影、纹理)
  // 长度感知:根据当前prompt剩余空间自动选择完整/精简模式
  const { designSceneForShot } = require('../../shanhaijing-render-engine/scenography-designer');
  // 🆕 v10.24-Peng-fix: 限制Scenography Designer输出长度,避免挤占prompt空间
  // 历史bug: Scenography输出162字,mandatoryText膨胀到1619字,prompt被完全截断
  // 修复: 限制Scenography最大输出80字,确保总mandatoryText不超过350字
  const availableSpace = Math.max(100, 1000 - _countChars(prompt) - 200);  // 🆕 v6.19-Peng: 1000基准,环境风格改light后mandatoryText减少,多留100字给scenography // v4.1: 使用_countChars计算剩余空间
  const sceneDesign = designSceneForShot(shot, plan, Math.min(availableSpace, 80));
  if (sceneDesign && sceneDesign.length > 0) {
    // 场景美术描述作为高优先级内容注入
    // 后续由expandPromptToTarget统一处理长度分配
    mandatoryDimensions.push(sceneDesign);
    console.log(`  [generateShotPrompt] 🎨 Scenography场景美术设计已注入: ${shot.id} (${sceneDesign.length}字, 上限80字)`);
  }

  // 🆕 v10.23-Peng-fix: 环境音效注入移至mandatoryDimensions声明后
  // 🆕 v10.24-Peng-fix6: 片头shot跳过环境音效注入，seedancePrompt已自包含
  if (!hasFullSeedancePrompt && ambientSoundResult && ambientSoundResult.block) {
    mandatoryDimensions.unshift(ambientSoundResult.block);
    console.log(`  [generateShotPrompt] 🎵 AmbientSoundBlock注入: ${ambientSoundResult.zone}生态区 (${ambientSoundResult.length}字)`);
  }

  // 🆕 v6.17-Peng-fix3: 注入10字段缺失的三剑客 — CharacterRef + Dialogue + Timeline + LLM扩展字段
  // 🆕 v6.17-Peng-fix4: 优先使用LLM解析的字段，其次自动构建
  if (!hasFullSeedancePrompt) {
    // CharacterRef: 优先用LLM解析的，其次从plan.characters自动构建
    if (shot._characterRef) {
      mandatoryDimensions.push('CharacterRef: ' + shot._characterRef);
      console.log(`  [generateShotPrompt] 🖼️ CharacterRef注入(LLM): ${shot._characterRef.substring(0, 80)}...`);
    } else if (plan?.characters) {
      // 自动从character-meta构建
      const shotChars = shot.characters || [];
      const refParts = [];
      for (const charName of shotChars) {
        const charData = plan.characters[charName];
        if (charData?.referencePhotos && charData.referencePhotos.length > 0) {
          for (const ref of charData.referencePhotos) {
            const angle = ref.angle || ref.filename?.replace(/^.+-([^-]+)\.png$/, '$1') || 'default';
            refParts.push(`${charName}: image://${charName}-${angle}.png`);
          }
        }
      }
      if (refParts.length > 0) {
        const charRefStr = 'CharacterRef: ' + refParts.join(', ');
        mandatoryDimensions.push(charRefStr);
        console.log(`  [generateShotPrompt] 🖼️ CharacterRef注入(自动): ${charRefStr.substring(0, 80)}...`);
      }
    }

    // Timeline: 优先用LLM解析的，其次自动构建
    if (shot._timeline) {
      mandatoryDimensions.push('Timeline: ' + shot._timeline);
      console.log(`  [generateShotPrompt] ⏱️ Timeline注入(LLM): ${shot._timeline}`);
    } else if (shot.startTime !== undefined || shot.duration) {
      const start = shot.startTime || 0;
      const dur = shot.duration || 0;
      const end = start + dur;
      const typeLabel = shot.type || 'normal';
      const moodLabel = shot.emotion || 'neutral';
      const timelineStr = `[${_formatTime(start)}-${_formatTime(end)}] dur:${dur}s type:${typeLabel} mood:${moodLabel}`;
      mandatoryDimensions.push('Timeline: ' + timelineStr);
      console.log(`  [generateShotPrompt] ⏱️ Timeline注入(自动): ${timelineStr}`);
    }

    // Camera/Lighting/Mood/EnvironmentStyle/DirectorStyle: 优先用LLM解析的
    if (shot._camera) { mandatoryDimensions.push('Camera: ' + shot._camera); console.log(`  [generateShotPrompt] 📷 Camera注入(LLM): ${shot._camera.substring(0,60)}...`); }
    if (shot._lighting) { mandatoryDimensions.push('Lighting: ' + shot._lighting); console.log(`  [generateShotPrompt] 💡 Lighting注入(LLM): ${shot._lighting.substring(0,60)}...`); }
    if (shot._mood) { mandatoryDimensions.push('Mood: ' + shot._mood); console.log(`  [generateShotPrompt] 🎭 Mood注入(LLM): ${shot._mood}`); }
    if (shot._envStyle) { mandatoryDimensions.push('EnvironmentStyle: ' + shot._envStyle); console.log(`  [generateShotPrompt] 🌍 EnvironmentStyle注入(LLM): ${shot._envStyle}`); }
    if (shot._directorStyle) { mandatoryDimensions.push('DirectorStyle: ' + shot._directorStyle); console.log(`  [generateShotPrompt] 🎬 DirectorStyle注入(LLM): ${shot._directorStyle}`); }

    // Dialogue: 角色台词（仅当 dialogueEnhancement 为空时注入，避免重复）
    const dialogueContent = (!dialogueEnhancement && !dialogueNote) ? (shot._dialogueText || shot._dialogue?.text || '') : '';
    if (dialogueContent) {
      const cleanDialogue = dialogueContent.startsWith(',') ? dialogueContent.slice(1) : dialogueContent;
      const speaker = (shot.characters || [])[0] || 'Character';
      const dialogueStr = `Dialogue: ${speaker} | ${_preserveFullSentence(cleanDialogue, 120)}`;
      mandatoryDimensions.push(dialogueStr);
      console.log(`  [generateShotPrompt] 🎭 Dialogue注入: ${dialogueStr.substring(0, 80)}...`);
    } else if (!dialogueEnhancement && !dialogueNote && !hasFullSeedancePrompt) {
      mandatoryDimensions.push('Dialogue: 环境音主导,无声角色表演');
    }

    // 角色定妆照引用兜底（无CharacterRef时）
    if (!shot._characterRef && (refs || []).length > 0 && !prompt.includes('character reference') && !prompt.includes('reference image')) {
      mandatoryDimensions.push('character reference image locked');
    }

    // 🆕 fix15-v2: 注入实际定妆照路径（从 shot._characterRefs 读取）
    // 修复: 之前只有 "character reference image locked" 文字提示，没有实际路径
    // 现在按角色注入 "CharacterRef: <角色名> | Ref Images: <路径1>, <路径2>, ..."
    // 每个角色最多 3 张参考图（避免prompt超长）
    if (shot._characterRefs && Object.keys(shot._characterRefs).length > 0) {
      const maxRefsPerChar = 3;
      for (const [charName, paths] of Object.entries(shot._characterRefs)) {
        if (!paths || paths.length === 0) continue;
        const trimmedPaths = paths.slice(0, maxRefsPerChar);
        const refStr = `CharacterRef: ${charName} | Ref Images: ${trimmedPaths.join(', ')}`;
        mandatoryDimensions.push(refStr);
        console.log(`  [generateShotPrompt] 🆕 fix15-v2: 定妆照路径注入(${charName}, ${trimmedPaths.length}张): ${path.basename(trimmedPaths[0])}`);
      }
    } else if (refs && refs.length > 0 && !prompt.includes('reference image') && !prompt.includes('CharacterRef:')) {
      // 兜底: shot 没有 _characterRefs 但有 refs 参数,使用 refs 注入
      const trimmedPaths = refs.slice(0, 3);
      const refStr = `CharacterRef: Ref Images: ${trimmedPaths.join(', ')}`;
      mandatoryDimensions.push(refStr);
      console.log(`  [generateShotPrompt] 🆕 fix15-v2: 定妆照路径注入(从refs参数, ${trimmedPaths.length}张)`);
    }

    // 2. 负面防护词强制注入
    if (!prompt.includes('NO anime') && !prompt.includes('NO cartoon')) {
      mandatoryDimensions.push('NO anime NO cartoon NO 3D Disney NO sci-fi NO glowing eyes');  // 🆕 v6.19-Peng: 精简负面约束
    }

    // 3. 宽高比参数声明
    if (!prompt.includes('16:9') && !prompt.includes('aspect ratio')) {
      mandatoryDimensions.push('widescreen 16:9 aspect ratio');
    }

    // 4. Nirath场景专属描述(Nirath风格下)
    if (!prompt.includes('Nirath') && (CURRENT_STYLE_PROFILE === 'nirath' || !CURRENT_STYLE_PROFILE)) {
      mandatoryDimensions.push('Nirath dark gold crystallized epic environment');
    }

    // 🆕 v2.19-Peng: 生理感知注入系统(替换原有通用生命迹象)
    // 根据角色生理结构自动选择微动作描述,避免语义错误(如无头角色注入blink)
    if (perceptionNote && perceptionNote.length > 0) {
      // perceptionNote已由生理感知注入系统生成,直接加入强制维度
      mandatoryDimensions.push(perceptionNote);
    } else {
      // fallback: 当无角色或感知注入失败时,使用通用生命迹象
      const lifeSignKeywords = [
        'blinking', 'breathing', 'gaze', 'pupil', 'unconsciously', 'subtly',
        'fidgeting', 'tapping', 'shifting', 'micro', 'instinctively',
        'idle', 'waiting', '走神', '呼吸', '眨眼', '无意识', '微动'
      ];
      const hasLifeSigns = lifeSignKeywords.some(kw => prompt.toLowerCase().includes(kw.toLowerCase()));
      if (!hasLifeSigns) {
        mandatoryDimensions.push('breathing blinking micro-movements');
      }
    }
  } else {
    console.log('  [generateShotPrompt] 🎬 片头shot已有完整seedancePrompt,跳过独立mandatoryDimensions构造');
  }

  // 🆕 v1.4-Peng: 提取声音描述作为强制保留内容
  // Seedance --generate-audio 依赖Prompt中的声音描述生成音频
  // 🆕 v10.2-Peng-fix: 片头shot已有完整seedancePrompt时,跳过声音描述提取(已包含)
  if (!hasFullSeedancePrompt && shot.description) {
    const soundPatterns = [
      /a deep resonant bass voice.*?\./,
      /sub-bass earth rumble.*?\./,
      /massive axe swoosh.*?\./,
      /shield clang.*?\./,
      /ancient war drum.*?\./,
      /Nirath magnetic field humming.*?\./,
      /bioluminescent spore particles pulsing.*?\./
    ];
    const soundMatches = [];
    for (const pattern of soundPatterns) {
      const match = shot.description.match(pattern);
      if (match) soundMatches.push(match[0]);
    }
    if (soundMatches.length > 0) {
      soundDesc = soundMatches.join('. ');
      console.log(`  [SoundInjection] 🔊 从description提取声音描述: ${soundDesc.length}字`);
    }
  }

  // 🆕 v10.24-Peng-fix5: 台词视觉化增强(零长度增加策略)
  // 台词不只是文本标注,要通过角色"说出来",配合肢体动作和环境响应
  // 策略:仅在台词长度+视觉后缀≤200字时追加,避免截断连锁反应
  // 🆕 v10.15-Peng-fix: 台词已放入强制维度最前面优先保留
  // v10.24-Peng-fix5: 前缀 "Role speaks" 明确告诉Seedance这是角色在说话时的视觉表演
  // 台词中已包含括号动作描述(navel vibrates, war spirit trembles, shudders等)
  // 作为Seedance生成角色肢体语言+口型同步的视觉线索
  // 视觉化后缀实验失败:增加后缀导致利用率波动(S02↓94%, S05↑100%),回退到稳定方案
  // 🆕 v3.0-Peng (2026-05-29): 使用独立音频叙事字段模块替代零散台词注入
  // 🆕 v10.24-Peng-fix6: 片头shot跳过音频叙事注入，seedancePrompt已自包含音频层
  if (!hasFullSeedancePrompt && dialogueBlock) {
    mandatoryDimensions.unshift(dialogueBlock);
  }

  // 🆕 v3.1-Peng (2026-05-29): 环境风格强制注入 - 角色CG超写实,背景实景拍摄
  // 🆕 v10.28-Peng-fix3: 升级为时间感知光照系统，根据shot.actIndex自动推断时间阶段
  // 解决导演审片问题: "光影系统完全同质化，所有镜头统一golden hour"
  if (!hasFullSeedancePrompt) {
    const { getEnvironmentStyleBlock } = require('./environment-style-injector');
    const environmentStyleBlock = getEnvironmentStyleBlock('light', shot);  // 🆕 v6.19-Peng: light模式节省~100字
    mandatoryDimensions.unshift(environmentStyleBlock);
    console.log(`  [generateShotPrompt] 🌍 环境风格强制注入(时间感知): ${environmentStyleBlock.substring(0, 60)}...`);
  }

  // 🆕 v2.4-Peng: 计算强制内容总长度
  let mandatoryText = mandatoryDimensions.length > 0 ? mandatoryDimensions.join(',') + ',' : '';
  if (soundDesc) {
    mandatoryText = soundDesc + ',' + mandatoryText;
  }

  // 🆕 v1.5-Peng: 地质质感增强注入(系统级修复,非case定制)
  // 根因:AI视频生成中岩石/山脉默认呈现"塑料感"/"3D渲染光滑感"
  // 修复:自动检测地质元素,注入微观纹理+材质细节+风化痕迹+光照交互
  // 覆盖:所有含山/岩壁/悬崖/断层/地质的场景,不限于刑天片头
  const { detectGeologicalTextureNeed, injectGeologicalTexture } = require('../../shanhaijing-render-engine/geological-texture-enhancer');
  const geoTextureFragment = detectGeologicalTextureNeed(prompt);
  if (geoTextureFragment) {
    // 地质质感作为高优先级内容,在expandPromptToTarget之前注入
    // 由expandPromptToTarget统一处理长度分配
    prompt = injectGeologicalTexture(prompt, 'Nirath');
    console.log(`  [generateShotPrompt] 🪨 地质质感增强已注入: ${shot.id} (反塑料质感)`);
  }

  // 🆕 v2.4-Peng: 传入强制内容,统一在目标长度内分配空间
  prompt = expandPromptToTarget(prompt, shot, plan, targetLength, mandatoryText);

  // v5.1-Peng: Token安全验证(截断后可能丢失维度,需要重新校验)
  const validation = validatePromptLength(prompt);

  // 如果截断后丢失维度,重新注入(但不超过490字上限)
  if (!validation.valid && validation.prompt !== prompt) {
    const truncatedPrompt = validation.prompt;
    // 检查截断后的Prompt是否仍包含关键维度
    const hasCharRef = truncatedPrompt.includes('character reference');
    const hasNegative = truncatedPrompt.includes('NO anime');
    const hasRatio = truncatedPrompt.includes('16:9');
    const hasNirath = truncatedPrompt.includes('Nirath');

    if (!hasCharRef || !hasNegative || !hasRatio || !hasNirath) {
      // 截断丢失了维度,需要重新构建:保留核心维度 + 主体描述
      const dims = [];
      if (!hasCharRef && (refs || []).length > 0) dims.push('character reference image locked');
      if (!hasNegative) dims.push('NO anime NO cartoon NO 3D Disney NO sci-fi');
      if (!hasRatio) dims.push('widescreen 16:9 aspect ratio');
      if (!hasNirath && (CURRENT_STYLE_PROFILE === 'nirath' || !CURRENT_STYLE_PROFILE)) dims.push('Nirath dark gold crystallized epic environment');

      const dimText = dims.join(',');
      // 计算剩余空间给主体描述
      const remainingSpace = PROMPT_MAX_LENGTH - dimText.length - 3;
      const truncatedCore = prompt.substring(0, remainingSpace);
      prompt = dimText + ',' + truncatedCore;
    } else {
      prompt = truncatedPrompt;
    }
  } else {
    prompt = validation.prompt;
  }

  // 🆕 v2.4-Peng: 移除 FPV 经验包增强后的额外注入,避免破坏长度控制
  // FPV增强应在 expandPromptToTarget 内部完成

  // 🆕 v2.4-Peng: 移除 DISCLAIMER 尾部注入,避免破坏长度控制
  // 免责声明应在 expandPromptToTarget 内部统一处理

  // 🆕 v2.4-Peng: Nirath原生能量体转换 - 禁用水晶元素
  const { applyNirathEnergyConversion } = require('../../shanhaijing-render-engine/scripts/nirath-crystal-converter');
  const nirathPrompt = applyNirathEnergyConversion(validation.prompt);

  if (nirathPrompt !== validation.prompt) {
    console.log(`  [generateShotPrompt] 🔄 Nirath能量体转换: ${shot.id} 水晶→光脉/虹脉`);
  }

  // 🆕 v6.0-Peng-fix: 风格纯净度清洗 - 自动拦截暗黑风格关键词
  const { cleanseDarkStyle } = require('../../shanhaijing-render-engine/style-cleanser');
  const cleansedPrompt = cleanseDarkStyle(nirathPrompt);

  if (cleansedPrompt !== nirathPrompt) {
    console.log(`  [generateShotPrompt] 🚫 暗黑风格清洗已应用: ${shot.id}`);
  }

  // 🆕 v6.1-Peng: 神兽视角质感注入 - 把叙事视角变成视觉语言
  const perspectiveMode = plan?.perspectiveMode || 'third-person-objective';
  let finalPrompt = cleansedPrompt;
  if (perspectiveMode === 'beast-first-person') {
    const { injectPerspectiveToPrompt } = require('../../shanhaijing-story-engine/beast-perspective-injector');
    finalPrompt = injectPerspectiveToPrompt(cleansedPrompt, shot.act || '起');
    if (finalPrompt !== cleansedPrompt) {
      console.log(`  [generateShotPrompt] 👁️ 神兽视角质感已注入: ${shot.id}`);
    }
  }

  // 🆕 v2.2-Peng: 数字人显假问题软性注入 - 待机感与生命细节
  // 🆕 v2.2-Peng-fix1: 强制调用机制 -- 确保注入的知识100%执行
  // 核心原则:无论beastMind是否存在,都强制注入生命迹象
  try {
    const { SensoryGrammarInjector } = require('../../shanhaijing-render-engine/sensory-grammar-injector');
    const injector = new SensoryGrammarInjector();

    // 🆕 v2.2-Peng-fix1: 智能检测角色类型并创建对应的beastMind
    let effectiveBeastMind = shot.beastMind || {};
    const shotChars = shot.characters || [];
    const charNames = shotChars.map(c => typeof c === 'string' ? c : c.name || '').join(' ').toLowerCase();

    // 检测人类角色(小G/小男孩/孩子/人类等)
    const humanKeywords = ['xiaog', '小g', '小男孩', '男孩', '孩子', '人类', 'child', 'human', 'boy', 'explorer'];
    const hasHumanChar = humanKeywords.some(kw => charNames.includes(kw.toLowerCase()));

    // 如果检测到人类角色且没有有效的beastMind,创建人类专用心智模型
    if (hasHumanChar && (!effectiveBeastMind.archetype || effectiveBeastMind.archetype === 'beast')) {
      effectiveBeastMind = {
        ...effectiveBeastMind,
        archetype: 'human_child',
        species: 'human_child',
        isHuman: true
      };
      console.log(`  [SensoryGrammar] 🧒 检测到人类角色,强制注入human_child待机感: ${shot.id}`);
    }

    const injectedPrompt = injector.inject(finalPrompt, shot, effectiveBeastMind);

    if (injectedPrompt !== finalPrompt) {
      console.log(`  [generateShotPrompt] 🎭 感官叙事语法已注入: ${shot.id}`);
      finalPrompt = injectedPrompt;

      // 🆕 v2.2-Peng-fix1: 注入后验证 -- 检查是否真正包含生命迹象
      const lifeSignKeywords = [
        'blinking', 'breathing', 'gaze', 'pupil', 'unconsciously', 'subtly',
        'fidgeting', 'tapping', 'shifting', 'micro', 'sloppy', 'messy', 'disheveled',
        'instinctively', 'idle', 'waiting', '走神', '呼吸', '眨眼', '无意识'
      ];
      const hasLifeSigns = lifeSignKeywords.some(kw => finalPrompt.toLowerCase().includes(kw.toLowerCase()));

      if (!hasLifeSigns) {
        console.log(`  [generateShotPrompt] ⚠️ 注入后验证失败: 未检测到生命迹象关键词,触发二次注入: ${shot.id}`);
        // 强制追加默认生命迹象描述
        const forcedLifeSign = `, natural blinking 15-20 times per minute, breathing visible as subtle chest rise and fall, gaze drifting naturally every few seconds, unconscious micro-movements of fingers`;
        if (_countChars(finalPrompt + forcedLifeSign) <= 1000 - 10) { // v4.1: 使用_countChars
          finalPrompt += forcedLifeSign;
          console.log(`  [generateShotPrompt] ✅ 二次生命迹象注入完成: ${shot.id}`);
        }
      } else {
        console.log(`  [generateShotPrompt] ✅ 注入后验证通过: 检测到生命迹象: ${shot.id}`);
      }
    }
  } catch (e) {
    // 🆕 v2.2-Peng-fix1: 软性注入失败不阻断,但记录详细日志
    console.log(`  [generateShotPrompt] ⚠️ 感官叙事注入异常: ${e.message}`);
    // 即使失败,也尝试追加最小生命迹象
    try {
      const fallbackSign = `, natural breathing and blinking, subtle unconscious movements`;
      if (_countChars(finalPrompt + fallbackSign) <= 1000 - 10) { // v4.1: 使用_countChars
        finalPrompt += fallbackSign;
        console.log(`  [generateShotPrompt] ✅ 最小生命迹象fallback注入完成: ${shot.id}`);
      }
    } catch (fallbackErr) {
      console.log(`  [generateShotPrompt] ❌ fallback注入也失败: ${fallbackErr.message}`);
    }
  }

  // 🆕 v10.3-Peng-fix: 最终长度保护 -- 所有处理后的统一截断出口
  // 历史问题:expandPromptToTarget之后的处理(Nirath转换/暗黑清洗/视角注入/感官语法)
  // 可能增加prompt长度,但此前没有任何最终guard,导致Prompt可能超出1000上限。
  // 系统性修复:无论中间经过多少处理,return前必须通过统一长度校验。
  const finalValidation = validatePromptLength(finalPrompt);
  if (!finalValidation.valid || finalValidation.prompt !== finalPrompt) {
    finalPrompt = finalValidation.prompt;
    console.log(`  [generateShotPrompt] ✂️ 最终截断保护: ${shot.id} 超出${PROMPT_MAX_LENGTH}上限,智能截断至${finalPrompt.length}字`);
  }

  // 🆕 v2.19-Peng: 三层提示词架构分析
  const threeLayer = new PromptThreeLayerBuilder();
  threeLayer.extractLayers(finalPrompt, shot, plan, refs);
  threeLayer.printAnalysis();
  shot._threeLayerAnalysis = threeLayer.getAnalysisReport();

  // 🆕 v1.0-Peng: Prompt字段标准校验
  const fieldStandard = new PromptFieldStandard();
  const fieldValidation = fieldStandard.validate(finalPrompt);
  if (!fieldValidation.valid) {
    console.warn(`  [generateShotPrompt] ⚠️ Prompt字段标准校验未通过(${shot.id}): ${fieldValidation.errors.join('; ')}`);
    console.warn(`  [generateShotPrompt] 📊 字段分析: 存在${fieldValidation.analysis.present.length}/8, 缺失${fieldValidation.analysis.missing.join(', ')}`);
  } else {
    console.log(`  [generateShotPrompt] ✅ Prompt字段标准校验通过: ${fieldValidation.analysis.present.length}/8字段完整, 利用率${fieldValidation.utilization}`);
  }

  // 🆕 v6.20-Peng: 最终兜底补齐（专家方案）
  // 所有处理链完成后，确保 prompt 达到 930-960 字符目标
  finalPrompt = fillPromptToTarget(finalPrompt, shot);

  const _finalLen = [...finalPrompt].length;
  const _utilPct = ((_finalLen / 1000) * 100).toFixed(1);
  console.log(`[generateShotPrompt] 🎯 最终补齐后: ${shot.id} ${_finalLen}/1000 (${_utilPct}%)`);

  return finalPrompt;
}

// ============ v5.8-Peng-2: 单镜头高密度时间线分解引擎 - 6维度节奏控制 ============

/**
 * 🆕 v5.8-Peng-2: 单镜头高密度时间线分解引擎 - 6维度节奏控制
 *
 * 对 duration >= 6s 的镜头自动分解为子时段,每段包含6维度:
 * 1. 场景递进(sceneShift) - 景别+空间定位
 * 2. 角色动作/表情(charAction) - 谁在做什么+表情递进
 * 3. 运镜变化(cameraMove) - 镜头运动方式
 * 4. 灯光变化(lightingShift) - 光影情绪递进
 * 5. 转场标记(transition) - 阶段切换方式(→push/→orbit/→zoom/→whip)
 * 6. 音效视觉化(soundVisualCue) - 声波/震动/粒子的可见化
 *
 * 输出极度紧凑,适配490字符Prompt上限
 */
function generateTemporalBreakdown(shot, plan) {
  const duration = shot.duration || 5;
  if (duration < 6) return null;

  // 🆕 v3.3-Peng-fix2: 片头镜头不参与时长分解
  // 片头需要保持声音叙事的连贯性,不能被切分成多段
  if (shot.type === 'opening_title') {
    return null;
  }

  // === 分段策略 ===
  let segments;
  if (duration <= 8) {
    const mid = Math.floor(duration * 0.5);
    segments = [{ s: 0, e: mid }, { s: mid, e: duration }];
  } else if (duration <= 11) {
    const p1 = Math.floor(duration * 0.35);
    const p2 = Math.floor(duration * 0.7);
    segments = [{ s: 0, e: p1 }, { s: p1, e: p2 }, { s: p2, e: duration }];
  } else {
    const p1 = Math.floor(duration * 0.25);
    const p2 = Math.floor(duration * 0.5);
    const p3 = Math.floor(duration * 0.75);
    segments = [{ s: 0, e: p1 }, { s: p1, e: p2 }, { s: p2, e: p3 }, { s: p3, e: duration }];
  }

  const segCount = segments.length;
  const emotion = shot.emotion || '';
  const cameraBase = shot.camera || shot.cinematography || '';
  const chars = shot.characters || [];

  // === 运镜递进库(极短标记) ===
  const camLib = {
    2: ['WIDE-push', 'MED-orbit'],
    3: ['WIDE-descend', 'MED-track', 'ECU-lock'],
    4: ['WIDE-drift', 'MED-push', 'CLOSE-orbit', 'ECU-freeze']
  };

  // === 灯光递进库(极短标记) ===
  const lightLib = {
    2: ['soft-warm', 'hard-contrast'],
    3: ['soft-natural', 'amber-build', 'hard-spot'],
    4: ['soft-glow', 'warm-rise', 'amber-red', 'hard-rim']
  };

  // === 音效视觉化库(情绪→可见声波/震动/粒子,极短标记) ===
  const audLib = {
    '好奇探索': ['dust-drift-breeze', 'footstep-ripple', 'leaf-rustle-rhythm'],
    '震惊敬畏': ['air-ripple-hum', 'dust-suspend-silence', 'shockwave-bend-light'],
    '神秘苏醒': ['light-pulse-echo', 'breath-fog-crystal', 'chord-glass-vibration'],
    '力量觉醒': ['vein-glow-pulse', 'ground-crack-fissure', 'shockwave-blast-radial'],
    '狂暴战斗': ['weapon-spark-glitter', 'cry-pressure-wave', 'impact-debris-freeze'],
    '震撼压迫': ['footstep-dust-cascade', 'pressure-bend-light', 'silence-dust-settle'],
    '终极力量': ['energy-compress-glow', 'beam-pierce-mist', 'explosion-ring-shock'],
    '敬畏感动': ['tear-slow-suspend', 'warm-embrace-glow', 'glow-fade-backlit'],
    '永恒铭记': ['golden-dust-motes', 'time-ripple-wave', 'light-ray-fade-dark']
  };

  // === 角色动作/表情递进生成 ===
  const charProgression = buildCharacterProgression(chars, emotion, segCount);

  // === 转场标记库(段间切换方式) ===
  const transLib = {
    2: ['→push', '→hold'],
    3: ['→push', '→orbit', '→zoom'],
    4: ['→drift', '→push', '→orbit', '→freeze']
  };

  const cameras = camLib[segCount] || camLib[2];
  const lights = lightLib[segCount] || lightLib[2];
  const sounds = audLib[emotion] || ['ambient-deepen', 'tension-bass', 'climax-flash'];
  const transitions = transLib[segCount] || transLib[2];

  return segments.map((seg, idx) => {
    const isLast = idx === segCount - 1;
    const isFirst = idx === 0;

    // 场景递进(极短)
    let sceneShift = '';
    if (segCount === 2) {
      sceneShift = isFirst ? 'WIDE-open' : 'PEAK-intimate';
    } else if (segCount === 3) {
      sceneShift = isFirst ? 'WIDE-grand' : idx === 1 ? 'TENSION-rise' : 'CLIMAX-peak';
    } else {
      sceneShift = isFirst ? 'WIDE-grand' : idx === 1 ? 'PUSH-closer' : idx === 2 ? 'EXTREME-tension' : 'FREEZE-impact';
    }
    if (/全景|wide|establishing|aerial|航拍/i.test(cameraBase) && isFirst) sceneShift = 'ENV-establish';
    if (/特写|close-up|extreme|微距/i.test(cameraBase) && isLast) sceneShift = 'FACE-peak';

    const charAction = charProgression[idx] || (chars.length > 0 ? chars[0] + '-action' : '');

    return {
      timeRange: `${seg.s}-${seg.e}s`,
      sceneShift,
      charAction,
      cameraMove: cameras[idx] || cameras[cameras.length - 1],
      lightingShift: lights[idx] || lights[lights.length - 1],
      transition: transitions[idx] || (isLast ? '→hold' : '→push'),
      soundVisualCue: sounds[idx] || sounds[sounds.length - 1] || 'ambient-deepen'
    };
  });
}

/**
 * 根据角色列表、情绪、段数,生成每段的角色动作/表情递进
 * 返回数组,每元素为紧凑字符串如"小G好奇张望 刑天沉睡静立"
 */
function buildCharacterProgression(chars, emotion, segCount) {
  if (!chars || chars.length === 0) return [];

  const emotionArc = {
    '好奇探索': { 2: ['好奇张望', '驻足震惊'], 3: ['好奇张望', '驻足震惊', '后退惊叹'], 4: ['好奇张望', '放慢脚步', '驻足震惊', '后退惊叹'] },
    '震惊敬畏': { 2: ['瞠目呆立', '跪地仰望'], 3: ['瞠目呆立', '后退半步', '跪地仰望'], 4: ['瞠目呆立', '后退半步', '抬手遮光', '跪地仰望'] },
    '神秘苏醒': { 2: ['沉睡静立', '睁眼凝视'], 3: ['沉睡静立', '身体微颤', '睁眼凝视'], 4: ['沉睡静立', '睫毛颤动', '身体微颤', '睁眼凝视'] },
    '力量觉醒': { 2: ['握拳蓄力', '仰天怒吼'], 3: ['握拳蓄力', '全身发光', '仰天怒吼'], 4: ['握拳蓄力', '青筋暴起', '全身发光', '仰天怒吼'] },
    '狂暴战斗': { 2: ['挥斧冲锋', '跳劈怒吼'], 3: ['挥斧冲锋', '格挡火花', '跳劈怒吼'], 4: ['挥斧冲锋', '旋身横扫', '格挡火花', '跳劈怒吼'] },
    '震撼压迫': { 2: ['缓慢逼近', '俯视威慑'], 3: ['缓慢逼近', '踏地震动', '俯视威慑'], 4: ['缓慢逼近', '踏地震动', '仰天咆哮', '俯视威慑'] },
    '终极力量': { 2: ['双手聚能', '能量爆发'], 3: ['双手聚能', '能量球膨胀', '能量爆发'], 4: ['双手聚能', '能量球膨胀', '光束射出', '能量爆发'] },
    '敬畏感动': { 2: ['含泪微笑', '伸手触摸'], 3: ['含泪微笑', '泪水滑落', '伸手触摸'], 4: ['含泪微笑', '泪水滑落', '抬手遮泪', '伸手触摸'] },
    '永恒铭记': { 2: ['回望凝视', '转身离去'], 3: ['回望凝视', '低头铭记', '转身离去'], 4: ['回望凝视', '低头铭记', '轻抚印记', '转身离去'] }
  };

  const arc = emotionArc[emotion];
  if (!arc) {
    return Array.from({ length: segCount }, (_, i) => chars.map(c => `${c}-action${i + 1}`).join(' '));
  }

  const segArc = arc[segCount] || arc[3] || arc[2];
  if (!segArc) return [];

  return segArc.map((action, idx) => {
    if (chars.length === 1) return `${chars[0]}${action}`;
    const reactions = ['静立旁观', '后退半步', '抬手防御', '跪地仰望', '震惊呆立', '侧身闪避'];
    const otherParts = chars.slice(1).map((c, ci) => `${c}${reactions[(idx + ci) % reactions.length]}`);
    return [`${chars[0]}${action}`, ...otherParts].join(' ');
  });
}

/**
 * 将时间线分解压缩为极度紧凑的文本,嵌入Prompt
 * 格式: 0-3s WIDE-open 小G好奇张望 push soft-glow dust-drift→;3-7s TENSION-rise 刑天沉睡静立 orbit amber shockwave→
 * 每段仅保留最关键token,总长度控制在120-160字符以内(3段)
 */
function buildCompactTimelineText(breakdown) {
  if (!breakdown || !breakdown.length) return '';
  const parts = breakdown.map((b, idx) => {
    const tokens = [b.timeRange, b.sceneShift];
    if (b.charAction) tokens.push(b.charAction);
    tokens.push(b.cameraMove, b.lightingShift, b.soundVisualCue);
    if (idx < breakdown.length - 1 && b.transition) tokens.push(b.transition);
    return tokens.join(' ');
  });
  return parts.join('; ');
}

// 生成多镜头片段提示词
function generateSegmentPrompt(segment, plan, refsMap, promptEnhancements) {
  const styleManifesto = plan?.styleManifesto || '写实风格';
  const lighting = plan?.lightingThreeLayer || '自然光';
  const styleNote = styleManifesto.length > 20 ? styleManifesto.split(',')[0] || styleManifesto.substring(0, 30) : styleManifesto;
  const lightingShort = lighting.split(',')[0] || lighting;

  let prompt = '';
  let currentTime = 0;

  for (let i = 0; i < segment.shots.length; i++) {
    const shot = segment.shots[i];
    const start = currentTime;
    const end = currentTime + (shot.duration || 5);
    const isMulti = segment.shots.length > 1;
    const shotPrompt = generateShotPrompt(shot, plan, (refsMap || {})[shot.id] || [], (promptEnhancements || {})[shot.id] || '', isMulti);
    if (i > 0) prompt += ';镜头切换:';
    prompt += `${start}-${end}s:${shotPrompt}`;
    currentTime = end;
  }

  prompt += `,${styleNote},${lightingShort}光影,电影级运镜`;

  if (_countChars(prompt) > PROMPT_MAX_LENGTH) prompt = prompt.replace(/;镜头切换:/g, ';'); // v4.1: 使用_countChars
  return prompt;
}

// 🌍 v5.5-Peng: 小G定妆照硬编码预设 - 大鹏要求"直接把种子图片预设进去"
// 🆕 v6.1-Peng-fix-B: 动态路径检测 + fallback扫描,防止硬编码路径失效
function getXiaoGHardcodedRefs() {
  // 尝试多个可能的基础路径(按优先级)
  const possibleBasePaths = [
    '/home/gem/workspace/agent/productions/global-character-references/xiaoG',
    '/root/.openclaw/workspace/productions/global-character-references/xiaoG',
    path.join(require('os').homedir(), '.openclaw/workspace/productions/global-character-references/xiaoG'),
    path.join(process.cwd(), 'productions/global-character-references/xiaoG'),
    path.join(__dirname, '../../../productions/global-character-references/xiaoG')
  ];

  let baseDir = null;
  for (const tryPath of possibleBasePaths) {
    if (fs.existsSync(tryPath)) {
      baseDir = tryPath;
      break;
    }
  }

  // 如果所有硬编码路径都失效,fallback到全局扫描
  if (!baseDir) {
    console.warn('[discoverCharacterRefs] ⚠️ 小G硬编码路径全部失效,尝试全局扫描...');
    // 尝试在 productions/ 任何子目录中找到 xiaoG 目录
    const productionsDir = path.join(require('os').homedir(), '.openclaw/workspace/productions');
    if (fs.existsSync(productionsDir)) {
      const entries = fs.readdirSync(productionsDir);
      for (const entry of entries) {
        const xiaoGPath = path.join(productionsDir, entry, 'xiaoG');
        if (fs.existsSync(xiaoGPath)) {
          baseDir = xiaoGPath;
          console.log(`[discoverCharacterRefs] ✅ Fallback扫描发现小G目录: ${baseDir}`);
          break;
        }
      }
    }
  }

  // 如果还是找不到,返回空对象(后续闸机会阻断并给出清晰错误)
  if (!baseDir) {
    console.error('[discoverCharacterRefs] ❌ 小G定妆照目录完全找不到!路径尝试:');
    possibleBasePaths.forEach(p => console.error(`    ${p} → ${fs.existsSync(p) ? '存在' : '不存在'}`));
    return {};
  }

  return {
    '正面全身': path.join(baseDir, '01-front-fullbody-正面全身.png'),
    '正面半身': path.join(baseDir, '02-front-halfbody-正面半身.png'),
    '侧面全身': path.join(baseDir, '03-side-fullbody-侧面全身.png'),
    '背面全身': path.join(baseDir, '04-back-fullbody-背面全身.png'),
    '面部特写': path.join(baseDir, '05-face-closeup-面部特写.png'),
    '微笑表情': path.join(baseDir, '06-expression-smile-微笑表情.png'),
    '动态探索': path.join(baseDir, '07-dynamic-walking-动态探索.png'),
    '鞋子特写': path.join(baseDir, '08-feet-closeup-鞋子特写.png'),
  };
}

// 兼容性保留:旧的 XIAOG_HARDCODED_REFS 改为运行时获取
const XIAOG_HARDCODED_REFS = getXiaoGHardcodedRefs();

// 🔴 v1.3-Peng: 角色一致性修复 - 只返回1张最佳定妆照作为 first_frame 强制锁定
// 之前的逻辑返回3-5张导致全部被标记为 reference_image(自由发挥),这是角色不一致的根因
function discoverCharacterRefs(productionDir, segment, plan = null) {
  const shots = segment.shots || [];
  const charRefs = [];

  // 🆕 fix15-v2: 按角色名分组的路径映射，key=角色名，value=路径数组
  // 供每个 shot 写入 shot._characterRefs[角色名] = 路径数组
  const perCharRefMap = {};

  for (const shot of shots) {
    // 兼容 shot.characters 是 array-of-string 或 array-of-object
    const shotCharsRaw = shot.characters || [];
    const shotChars = shotCharsRaw.map(n => typeof n === 'string' ? n : (n.name || n.characterName || '')).filter(Boolean);

    for (const charName of shotChars) {
      const charNameLower = charName.toLowerCase();

      // 🌍 v5.5-Peng: 小G角色硬编码预设 - 直接返回预定义路径,不再扫描目录
      // 🆕 v6.1-Peng-fix-B: 使用动态路径检测,失效时fallback到扫描逻辑
      if (charNameLower.includes('xiaog') || charNameLower.includes('小g')) {
        const dynamicRefs = getXiaoGHardcodedRefs();
        // 默认返回正面全身照(最佳 first_frame 锁定效果)
        const defaultRef = dynamicRefs['正面全身'];
        if (defaultRef && fs.existsSync(defaultRef)) {
          charRefs.push(defaultRef);
          perCharRefMap[charName] = perCharRefMap[charName] || [];
          perCharRefMap[charName].push(defaultRef);
          console.log(`[discoverCharacterRefs] 🎯 小G动态路径预设: ${defaultRef}`);
          continue;
        } else {
          // Fallback: 尝试扫描任何可用的小G定妆照
          console.warn(`[discoverCharacterRefs] ⚠️ 小G动态路径失效,尝试fallback扫描...`);
        }
      }

      // 其他角色保持原有扫描逻辑(向后兼容)
      // 🌍 v3.0-Peng: 角色定妆照目录智能检测
      let charDir = null;
      const possibleDirs = [
        // 🆕 v6.11-Peng-fix4: 全局角色定妆照库(大鹏确认后入库)
        path.join(__dirname, '../../../../productions/global-character-references', charName),
        path.join(process.cwd(), 'productions/global-character-references', charName),
        path.join(productionDir, '03-characters', charName),
        path.join(productionDir, '02-characters', charName),
        path.join(productionDir, 'character-references', charName),
        path.join(productionDir, '03-characters'),
        path.join(productionDir, '02-characters')
      ];

      for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
          if (files.length > 0) {
            charDir = dir;
            break;
          }
        }
      }

      if (charDir) {
        const charFiles = fs.readdirSync(charDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        if (charFiles.length > 0) {
          // 🆕 fix15-v2: 收集该角色下的所有定妆照路径，不只是第一个
          // 供 prompt 注入 multi-angle reference（提升角色一致性）
          const charPaths = charFiles.map(f => path.join(charDir, f));
          for (const p of charPaths) {
            if (!charRefs.includes(p)) charRefs.push(p);
          }
          perCharRefMap[charName] = perCharRefMap[charName] || [];
          for (const p of charPaths) {
            if (!perCharRefMap[charName].includes(p)) perCharRefMap[charName].push(p);
          }
          console.log(`[discoverCharacterRefs] 📸 角色定妆照: ${charName} -> ${charPaths.length}张(选中首张 ${path.basename(charFiles[0])})`);
        }
      }
    }

    // 🆕 fix15-v2: 将角色引用写入 shot 上，供 generateShotPrompt 读取
    // 约定: shot._characterRefs = { 角色名: [路径数组] }
    shot._characterRefs = shot._characterRefs || {};
    for (const [charName, paths] of Object.entries(perCharRefMap)) {
      if (shotChars.includes(charName) && paths && paths.length > 0) {
        shot._characterRefs[charName] = paths;
      }
    }
  }

  // 返回所有匹配角色的定妆照(多角色镜头支持)
  return charRefs.length > 0 ? charRefs : [];
}

// ============ 主渲染函数 ============
//   - 输入从 segmentsData 改为 shotsData
//   - 每个 shot 独立生成提示词、独立调用 API
//   - 首尾帧衔接粒度从 segment 降到 shot
//   - 超长 shot 自动拆分(API 上限 10s)
//   - 默认串行(质量优先),提供 --fast 并行选项
async function render(shotsData, options = {}) {

  if (!CONFIG) initConfig();
  const {
    productionDir,
    skipRender = false,
    seed = Math.floor(Math.random() * 2147483647),
    maxConcurrent = 1,
    generateAudio = true,
    enableFrameContinuity = true,
    plan = null,
    fast = false,
    styleProfile = null,  // 🌍 v3.0-Peng: 支持外部传入风格档案
    // P2-4.2: 预算硬锁参数
    budgetLimitUSD = Infinity,
    budgetUsedUSD = 0,
    budgetCallback = null                   // 预算更新回调
  } = options;

  // 🌍 v3.0-Peng: 应用外部传入的风格档案
  if (styleProfile && STYLE_SELECTOR) {
    const profile = STYLE_SELECTOR.getStyleProfile(styleProfile);
    if (profile) {
      CURRENT_STYLE_PROFILE = styleProfile;
      log('RenderEngine', `🎨 应用外部风格档案: ${profile.name}`, 'info');
    }
  }

  // P2-4.2: 预算硬锁 - 已耗尽时拒绝新渲染
  if (budgetUsedUSD >= budgetLimitUSD) {
    log('RenderEngine', `💰 预算已耗尽 (${budgetUsedUSD}/${budgetLimitUSD} USD),拒绝新渲染请求`, 'error');
    return expandedShots.map(item => ({
      shot: item.shot,
      status: 'budget_exhausted',
      error: `Budget exceeded: ${budgetUsedUSD} >= ${budgetLimitUSD} USD`,
      budgetUsed: budgetUsedUSD,
      budgetLimit: budgetLimitUSD
    }));
  }

  // 🌍 v3.1-Peng-fix: 角色定妆照强制校验(安全网)- 无定妆照禁止提交渲染
  // 即使绕过 director-pipeline 直接调用 render(),此校验也会生效
  // 🆕 fix15-v2: 增强闸机: 也检查每个 shot._characterRefs 是否充分绑定
  if (productionDir) {
    // v7.1-Peng-fix: 修复循环依赖bug - 直接使用本模块内的discoverCharacterRefs函数,不再require自己
    const allCharacters = new Set();
    for (const item of shotsData) {
      for (const char of item.shot?.characters || item.characters || []) {
        allCharacters.add(char);
      }
    }
    const missingRefs = [];
    for (const charName of allCharacters) {
      const charRefs = discoverCharacterRefs(productionDir, {
        shots: [{ id: 'safety-check', characters: [charName] }]
      }, plan);
      if (charRefs.length === 0) missingRefs.push(charName);
    }
    if (missingRefs.length > 0) {
      const errMsg = `❌ [渲染引擎安全网] 角色定妆照缺失,渲染被强制阻止!\n缺失角色: ${missingRefs.join(', ')}\n请在以下路径放置角色定妆照:\n  ${path.join(productionDir, 'character-references/')}\n  或 ${path.join(productionDir, '03-characters/')}\n  或 ${path.join(productionDir, '02-characters/')}`;
      log('RenderEngine', errMsg, 'error');
      throw new Error(errMsg);
    }
    log('RenderEngine', `✅ 角色定妆照安全网校验通过 (${allCharacters.size}个角色)`, 'info');
  }

  // 🆕 fix15-v2: 定妆照绑定质检闸机 - 每个含角色的镜头都必须有 _characterRefs 绑定
  // 防止Stage 8.2生成的prompt中"CharacterRef"字段为空
  // 闸机：含角色的镜头（characters.length > 0）→ _characterRefs必须非空且覆盖所有角色
  // 倒外：skipRender模式跳过（避免被测/预生产测试被阻止）
  if (!skipRender && productionDir) {
    const bindingIssues = [];
    for (const item of shotsData) {
      const shot = item.shot || item;
      const shotChars = (shot.characters || []).map(n => typeof n === 'string' ? n : (n.name || n.characterName || '')).filter(Boolean);
      if (shotChars.length === 0) continue;  // 无角色的镜头跳过
      if (!shot._characterRefs || Object.keys(shot._characterRefs).length === 0) {
        bindingIssues.push(`  - ${shot.id || 'unknown'}: 含角色[${shotChars.join(',')}]但无 _characterRefs 绑定`);
        continue;
      }
      for (const charName of shotChars) {
        if (!shot._characterRefs[charName] || shot._characterRefs[charName].length === 0) {
          bindingIssues.push(`  - ${shot.id || 'unknown'}: 角色[${charName}]在 _characterRefs 中未绑定路径`);
        }
      }
    }
    if (bindingIssues.length > 0) {
      const errMsg = `❌ [定妆照绑定闸机 - fix15-v2] 渲染被阻止!\n以下镜头未正确绑定定妆照:\n${bindingIssues.join('\n')}\n\n解决方法:\n1. 调用 stage8_2_PromptPreGeneration 之前需先调用 discoverCharacterRefs(productionDir, {shots}, plan)\n2. 或手动在 shot._characterRefs[charName] = [路径数组] 注入\n3. 或在 productionDir/02-characters/{charName}/ 放置定妆照`;
      log('RenderEngine', errMsg, 'error');
      throw new Error(`[定妆照绑定闸机] ${bindingIssues.length}个镜头未绑定定妆照,渲染被阻止`);
    }
    log('RenderEngine', `✅ 定妆照绑定闸机校验通过 (${shotsData.length}个镜头全绑定)`, 'info');
  }

  // 🎬 v4.1-Peng: 一镜到底强制检查 - 每个片子必须包含至少一个一镜到底镜头
  // 🆕 v4.4-Peng-fix: Mock/skipRender模式下跳过此检查(避免测试被阻止)
  if (!skipRender) {
    const oneshotShots = [];
    for (const item of shotsData) {
      const shot = item.shot || item;
      const isOneshot =
        shot.isOneshot === true ||
        shot.type === 'oneshot' ||
        shot.type === 'climax' ||
        (typeof shot.camera === 'string' && shot.camera.includes('一镜')) ||
        (shot.description && shot.description.includes('一镜')) ||
        (typeof shot.camera === 'string' && shot.camera.toLowerCase().includes('oneshot'));
      if (isOneshot) {
        oneshotShots.push(shot.id || 'unknown');
      }
    }

    if (oneshotShots.length === 0) {
      const errMsg = `\n🎬 [一镜到底强制检查 - v4.1-Peng] 渲染被阻止!\n当前片子 (${shotsData.length}个镜头) 中没有任何镜头标记为"一镜到底"。\n系统铁律:每个片子必须包含至少一个一镜到底镜头。\n\n解决方法(三选一):\n1. 在导演管线中启用自动注入:storyPlan.autoInjectOneshot = true\n2. 手动标记某个高潮/追逐镜头:shot.type = 'climax' 或 shot.isOneshot = true\n3. 在镜头描述中加入"一镜到底"关键词\n`;
      log('RenderEngine', errMsg, 'error');
      throw new Error('[一镜到底强制检查] 当前片子缺少一镜到底镜头,渲染被阻止。请按上述方法修复后重试。');
    } else {
      log('RenderEngine', `🎬 一镜到底检查通过: ${oneshotShots.length}个镜头 (${oneshotShots.join(', ')})`, 'info');
    }
  } else {
    log('RenderEngine', `🎬 一镜到底检查跳过 (skipRender/mock模式)`, 'info');
  }

  const expandedShots = expandLongShots(shotsData, productionDir, plan);
  log('RenderEngine', `🎬 开始 Shot 级渲染: ${shotsData.length}个镜头 → 展开为 ${expandedShots.length}个渲染单元`, 'phase');
  log('RenderEngine', `🎲 统一风格种子: ${seed}`, 'info');

  // 🆕 v10.9-Peng: 转场连贯性检查 - 系统级修复镜头衔接割裂问题
  try {
    const { fixTransitionIssues } = require('./transition-coherence-checker');
    const shotsForCheck = shotsData.map(item => item.shot || item);
    const { issues, fixCount } = fixTransitionIssues(shotsForCheck);
    if (issues.length > 0) {
      log('RenderEngine', `🎬 转场连贯性检查: 发现 ${issues.length} 个问题`, 'warn');
      for (const issue of issues) {
        const typeLabel = issue.type === 'scale_jump' ? '景别跳跃' : '运动跳跃';
        log('RenderEngine', `  ⚠️ ${issue.from}→${issue.to}: ${typeLabel} ${issue.diff}级 (${issue.severity})`, 'warn');
      }
      if (fixCount > 0) {
        log('RenderEngine', `✅ 已自动修复 ${fixCount} 个镜头的过渡运镜`, 'info');
        // 将修复后的 camera 写回 shotsData
        for (let i = 0; i < shotsData.length; i++) {
          const fixedShot = shotsForCheck[i];
          if (fixedShot._transitionFixed) {
            const item = shotsData[i];
            const shot = item.shot || item;
            shot.camera = fixedShot.camera;
            delete fixedShot._transitionFixed; // 清理标记
          }
        }
      }
    } else {
      log('RenderEngine', `🎬 转场连贯性检查: 全部通过 ✅`, 'info');
    }
  } catch (err) {
    log('RenderEngine', `⚠️ 转场连贯性检查模块加载失败(非阻断): ${err.message}`, 'warn');
  }


  if (fast) {
    log('RenderEngine', `⚡ 快速模式: 并行渲染(禁用首尾帧衔接)`, 'warn');
  } else if (enableFrameContinuity) {
    log('RenderEngine', `🔗 首尾帧衔接模式: 启用(串行处理,shot 级尾帧接力)`, 'info');
  }

  if (!fs.existsSync(SEEDANCE_WRAPPER)) {
    throw new Error(`seedance-wrapper.js 未找到: ${SEEDANCE_WRAPPER}`);
  }

  if (skipRender) {
    log('RenderEngine', '⚠️ 跳过渲染模式,只生成命令', 'warn');
  }

  const rawDir = path.join(productionDir, '05-raw-shots');
  ensureDir(rawDir);

  const tasks = [];
  let previousLastFrame = null;

  const effectiveMaxConcurrent = fast ? (options.maxConcurrent || MAX_CONCURRENT_DEFAULT) : 1;

  for (let i = 0; i < expandedShots.length; i += effectiveMaxConcurrent) {
    const batch = expandedShots.slice(i, i + effectiveMaxConcurrent);

    if (effectiveMaxConcurrent === 1) {
      log('RenderEngine', `⏳ Shot ${i+1}/${expandedShots.length}(串行,首尾帧衔接)`, 'progress');
    } else {
      log('RenderEngine', `⏳ 批次 ${Math.floor(i/effectiveMaxConcurrent)+1}/${Math.ceil(expandedShots.length/effectiveMaxConcurrent)}(并行×${effectiveMaxConcurrent})`, 'progress');
    }

    const batchPromises = batch.map(async ({ shot, prompt, refs, isSplit, originalShot }) => {
      let lastError = null;

      let shotRefs = [...(refs || [])];

      // 🔴 v6.1-Peng: 定妆照强制上传闸机 - 不传定妆照=禁止提交渲染(最严格限制)
      // 历史踩坑:多次发生定妆照未实际上传导致角色不一致
      // 机制:4层闸机,任何一层失败直接 throw Error 阻止渲染

      // 闸机1: 镜头级 - 每个含角色的镜头必须有定妆照
      const shotChars = shot.characters || [];
      if (shotChars.length > 0 && shotRefs.length === 0) {
        const errMsg = `🚨 [定妆照闸机阻断] ${shot.id} 涉及角色[${shotChars.join(',')}]但shotRefs为空。` +
          `定妆照未传入render函数。必须修复后才能渲染。`;
        log('RenderEngine', errMsg, 'error');
        throw new Error(errMsg);
      }

      // 🆕 v6.1-Peng-fix-A: 多角色定妆照配额分配 - 每个角色至少保留1张最佳定妆照
      // 原方案: shotRefs.slice(0,9) 简单截断,可能导致某些角色定妆照全部被截掉
      // 新方案: 按角色名精确分组,每个角色至少保留1张,剩余配额按角色数均分
      if (shotChars.length > 1 && shotRefs.length > 9) {
        // 按角色名精确分组定妆照(支持中英文别名)
        const refsByChar = {};
        for (const charName of shotChars) {
          const charNameLower = charName.toLowerCase();
          refsByChar[charName] = shotRefs.filter(ref => {
            const refLower = ref.toLowerCase();
            // 精确匹配角色名
            if (refLower.includes(charNameLower)) return true;
            // 别名映射
            const aliases = {
              'xiaog': ['xiaog', '小g'],
              '小g': ['xiaog', '小g'],
              'xingtian': ['xingtian', '刑天'],
              '刑天': ['xingtian', '刑天']
            };
            const charAliases = aliases[charNameLower] || [charNameLower];
            return charAliases.some(alias => refLower.includes(alias));
          });
        }

        // 每个角色至少取1张(优先取第1张作为 first_frame 锁定)
        let quotaRefs = [];
        for (const charName of shotChars) {
          const charRefs = refsByChar[charName] || [];
          if (charRefs.length > 0) {
            quotaRefs.push(charRefs[0]); // 每个角色至少1张
          }
        }

        // 如果某些角色分不到定妆照,fallback到轮流分配
        const missingChars = shotChars.filter(c => !quotaRefs.some(ref => {
          const refLower = ref.toLowerCase();
          const cLower = c.toLowerCase();
          return refLower.includes(cLower) || (aliases[cLower] || []).some(a => refLower.includes(a));
        }));
        if (missingChars.length > 0) {
          log('RenderEngine', `⚠️ 角色[${missingChars.join(',')}]未找到专属定妆照,尝试轮流分配...`, 'warn');
          // 轮流从未分配的定妆照中补充
          const unassigned = shotRefs.filter(ref => !quotaRefs.includes(ref));
          for (let i = 0; i < missingChars.length && i < unassigned.length; i++) {
            quotaRefs.push(unassigned[i]);
          }
        }

        // 剩余配额按角色均分(优先给定妆照少的角色)
        const remainingSlots = 9 - quotaRefs.length;
        if (remainingSlots > 0) {
          const unassigned = shotRefs.filter(ref => !quotaRefs.includes(ref));
          quotaRefs.push(...unassigned.slice(0, remainingSlots));
        }

        shotRefs = quotaRefs.slice(0, 9);
        log('RenderEngine', `🎯 多角色配额分配: ${shotChars.length}角色 → ${shotRefs.length}张定妆照(每角色至少1张)`, 'info');
      } else {
        // 单角色或总定妆照≤9张:保持原有逻辑
        shotRefs = shotRefs.slice(0, 9);
      }

      // 闸机2: 文件级 - 每个定妆照路径必须真实存在且可读
      if (shotRefs.length > 0) {
        const missingFiles = shotRefs.filter(ref => !fs.existsSync(ref));
        if (missingFiles.length > 0) {
          const errMsg = `🚨 [定妆照闸机阻断] ${shot.id} 定妆照文件不存在:\n` +
            missingFiles.map(f => `  ❌ ${f}`).join('\n') +
            `\n必须先重新生成定妆照,或修复路径后再渲染。`;
          log('RenderEngine', errMsg, 'error');
          throw new Error(errMsg);
        }
      }

      // v1.3-Peng修复: 尾帧衔接 + 多张定妆照保留
      // Seedance API逻辑: 1张图→first_frame; 2张图→第1张first_frame,第2张last_frame; ≥3张图→全部reference_image
      // v7.0-Peng修复: 不再为了触发first_frame/last_frame而丢弃定妆照。角色一致性优先:保留所有定妆照作为reference_image,尾帧追加到最后。
      // seedance 2.0 支持多张reference_image,8张定妆照+1张尾帧可同时保证角色一致性和转场连贯性
      if (!fast && previousLastFrame && fs.existsSync(previousLastFrame)) {
        if (shotRefs.length === 0) {
          log('RenderEngine', `⚠️ ${shot.id} 无定妆照,跳过尾帧衔接`, 'warn');
        } else {
          // 保留所有定妆照 + 追加尾帧(限制最多9张)
          shotRefs = [...shotRefs, previousLastFrame].slice(0, 9);
          log('RenderEngine', `🔗 ${shot.id} 尾帧衔接: ${shotRefs.length - 1}张定妆照(reference_image) + 1张尾帧`, 'info');
        }
      }

      let finalPrompt = prompt;
      if (isSplit && shot.chunkIndex > 0) {
        finalPrompt = `${prompt}(动作延续,承接上一段)`;
      }

      for (let modelIdx = 0; modelIdx < MODEL_PRIORITY.length; modelIdx++) {
        const modelConfig = MODEL_PRIORITY[modelIdx];
        const is2Point0 = modelConfig.id.includes('doubao-seedance-2-0');

        // 构建 API 命令
        const cmdParts = [
          'node', SEEDANCE_WRAPPER, 'create',
          '--prompt', shellQuote((finalPrompt || '').replace(/"/g, '\\"')),
          '--model', shellQuote(modelConfig.id),
          '--seed', String(seed),
          '--ratio', shellQuote('16:9'),
          '--resolution', shellQuote('1080p'),
          '--duration', String(shot.duration || 5)
        ];

        // 注入参考图（本地文件）
        const finalRefs = shotRefs.slice(0, 9);
        if (finalRefs.length > 0) {
          for (const refPath of finalRefs) {
            if (fs.existsSync(refPath)) {
              cmdParts.push('--image-file', shellQuote(refPath));
            }
          }
          log('RenderEngine', `🖼️ ${shot.id} 注入 ${Math.min(finalRefs.length, 9)} 张参考图`, 'info');
        }

        // 请求尾帧(shot 级衔接)
        if (enableFrameContinuity && !fast) {
          cmdParts.push('--return-last-frame');
        }

        if (!is2Point0) cmdParts.push('--service-tier', shellQuote('flex'));

        // 运镜控制
        if (/(推|拉|摇|移|跟|升|降|环绕|航拍|变焦|甩镜)/.test(shot.camera || '')) {
          cmdParts.push('--camera-fixed', shellQuote('false'));
        }

        // 音频生成
        if (generateAudio) {
          cmdParts.push('--generate-audio');
        }

        const cmd = cmdParts.join(' ');

        // 🔴 v6.0-Peng: 定妆照强制上传闸机 - 不传定妆照=禁止提交渲染
        // 闸机3: API命令级 - 构建的cmd必须包含 --image-file 参数
        // 闸机4: 执行前最终检查 - cmdParts中 --image-file 数量必须≥1
        // 🆕 v2.2-Peng: 增加Seedance 2.0规范检查 - 确保角色绑定格式正确
        const imageFileCount = cmdParts.filter(p => p === '--image-file').length;
        if (shotChars.length > 0 && imageFileCount === 0) {
          const errMsg = `🚨 [定妆照闸机阻断] ${shot.id} API命令中未包含 --image-file 参数。` +
            `角色[${shotChars.join(',')}]的定妆照未能注入渲染命令。` +
            `这是系统级错误,禁止继续渲染。`;
          log('RenderEngine', errMsg, 'error');
          throw new Error(errMsg);
        }

        // 🆕 v2.3-Peng 闸机5: Seedance 2.0 官方规范验证 (阻断级)
        // 规范来源: 字节方舟 Seedance 2.0 API 官方文档
        // 核心要求: content数组 + role分配 + 数据格式 必须100%合规
        if (finalRefs.length > 0) {
          const formatIssues = [];
          const blockingIssues = []; // 阻断级错误
          
          // ─────────────────────────────────────────
          // 5.1 文件格式检查 (阻断)
          // 官方规范: 只接受 PNG/JPEG, 不接受 WEBP/GIF/BMP
          // ─────────────────────────────────────────
          for (const refPath of finalRefs) {
            const ext = path.extname(refPath).toLowerCase();
            if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
              blockingIssues.push(`❌ ${path.basename(refPath)}: 格式${ext}不合规。Seedance 2.0 只接受 PNG/JPEG (官方规范)`);
            }
          }
          
          // ─────────────────────────────────────────
          // 5.2 文件存在性 + 可读性检查 (阻断)
          // ─────────────────────────────────────────
          for (const refPath of finalRefs) {
            if (!fs.existsSync(refPath)) {
              blockingIssues.push(`❌ ${path.basename(refPath)}: 文件不存在，无法读取为 Data URL`);
            } else {
              try {
                fs.accessSync(refPath, fs.constants.R_OK);
              } catch (e) {
                blockingIssues.push(`❌ ${path.basename(refPath)}: 文件不可读 (权限不足)`);
              }
            }
          }
          
          // ─────────────────────────────────────────
          // 5.3 文件大小检查 (警告→阻断阈值)
          // 官方规范: 单文件建议 < 5MB, 硬上限 10MB (base64编码后膨胀~33%)
          // ─────────────────────────────────────────
          for (const refPath of finalRefs) {
            if (fs.existsSync(refPath)) {
              const stats = fs.statSync(refPath);
              const sizeMB = stats.size / (1024 * 1024);
              if (stats.size > 10 * 1024 * 1024) {
                blockingIssues.push(`❌ ${path.basename(refPath)}: ${sizeMB.toFixed(1)}MB 超过硬上限10MB，API会拒绝`);
              } else if (stats.size > 5 * 1024 * 1024) {
                formatIssues.push(`⚠️ ${path.basename(refPath)}: ${sizeMB.toFixed(1)}MB 超过5MB建议值，可能影响上传稳定性`);
              }
            }
          }
          
          // ─────────────────────────────────────────
          // 5.4 MIME 类型合规检查 (阻断)
          // 官方规范: image/png 或 image/jpeg, 不能是 image/webp 等
          // ─────────────────────────────────────────
          for (const refPath of finalRefs) {
            const ext = path.extname(refPath).toLowerCase();
            const validMime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
            if (ext && !validMime[ext]) {
              blockingIssues.push(`❌ ${path.basename(refPath)}: MIME类型不合规。Seedance 2.0 要求 image/png 或 image/jpeg`);
            }
          }
          
          // ─────────────────────────────────────────
          // 5.5 Role 分配正确性检查 (阻断)
          // 官方规范: 
          //   1张图 → role = first_frame (动作锁定)
          //   2张图 → 第1张 first_frame, 第2张 last_frame
          //   ≥3张图 → 全部 reference_image (风格参考，不锁动作)
          // ─────────────────────────────────────────
          const totalImages = finalRefs.length + (enableFrameContinuity && lastFramePath ? 1 : 0);
          if (totalImages === 1) {
            // 1张图必须是 first_frame
            const expectedRole = 'first_frame';
            // 实际验证：检查CLI命令中是否只有1张 --image-file
            if (imageFileCount !== 1) {
              blockingIssues.push(`❌ Role分配错误: 共${totalImages}张图，但命令中有${imageFileCount}张 --image-file。Seedance 2.0 规范: 1张图 = first_frame`);
            }
          } else if (totalImages === 2) {
            // 2张图：第1张 first_frame, 第2张 last_frame
            // 通过CLI的 --image-file 顺序来验证
            if (imageFileCount !== 2) {
              blockingIssues.push(`❌ Role分配错误: 共${totalImages}张图，但命令中有${imageFileCount}张 --image-file。Seedance 2.0 规范: 2张图 = first_frame + last_frame`);
            }
          } else if (totalImages >= 3) {
            // ≥3张图：全部 reference_image
            // 验证：没有错误的 first_frame/last_frame 分配
            if (imageFileCount < 3) {
              blockingIssues.push(`❌ Role分配错误: 共${totalImages}张图，但命令中只有${imageFileCount}张 --image-file。Seedance 2.0 规范: ≥3张图 = 全部 reference_image`);
            }
          }
          
          // ─────────────────────────────────────────
          // 5.6 提示词 [REF:角色名] 标注检查 (阻断)
          // v2.2-Peng 规范: 每个角色必须在提示词中有 [REF:角色名] 标注
          // 目的: 确保 Seedance 2.0 能正确识别角色并绑定 reference_image
          // ─────────────────────────────────────────
          const hasRefMarkers = shotChars.every(char => {
            const refMarker = `[REF:${char}]`;
            return finalPrompt.includes(refMarker) || 
                   (char === '小G' && finalPrompt.includes('[REF:小G]')) ||
                   (char === '刑天' && finalPrompt.includes('[REF:刑天]'));
          });
          
          if (!hasRefMarkers && shotChars.length > 0) {
            blockingIssues.push(`❌ 提示词缺少 [REF:角色名] 标注。v2.2-Peng 规范要求每个角色必须有 REF 标注，否则 Seedance 2.0 无法正确识别角色绑定`);
          }
          
          // ─────────────────────────────────────────
          // 5.7 角色标注一致性检查 (警告)
          // 文件名应包含角色名，便于运维排查
          // ─────────────────────────────────────────
          for (const refPath of finalRefs) {
            const refBasename = path.basename(refPath).toLowerCase();
            const hasCharMatch = shotChars.some(char => {
              const charLower = char.toLowerCase();
              return refBasename.includes(charLower) || 
                     (charLower === '小g' && refBasename.includes('xiaog')) ||
                     (charLower === '刑天' && refBasename.includes('xingtian'));
            });
            if (!hasCharMatch) {
              formatIssues.push(`⚠️ ${path.basename(refPath)}: 文件名未包含角色名，运维排查困难`);
            }
          }
          
          // ─────────────────────────────────────────
          // 5.8 在线 URL 可访问性检查 (阻断，如果适用)
          // 如果 finalRefs 包含 http:// 或 https:// 开头的URL，检查可访问性
          // ─────────────────────────────────────────
          for (const refPath of finalRefs) {
            if (refPath.startsWith('http://') || refPath.startsWith('https://')) {
              // 在线URL：检查是否包含 TOS 签名或有效域名
              if (!refPath.includes('tos-cn') && !refPath.includes('volces.com') && !refPath.includes('aliyun')) {
                formatIssues.push(`⚠️ ${refPath.substring(0,50)}...: 非火山引擎/阿里云域名，可能不可访问`);
              }
              // 检查 URL 是否包含过期签名
              if (refPath.includes('X-Tos-Expires=')) {
                const match = refPath.match(/X-Tos-Expires=(\d+)/);
                if (match) {
                  const expiresIn = parseInt(match[1]);
                  if (expiresIn < 3600) {
                    formatIssues.push(`⚠️ URL签名有效期仅${expiresIn}秒，可能渲染前过期`);
                  }
                }
              }
            }
          }
          
          // ─────────────────────────────────────────
          // 闸机5结果判定
          // 阻断级错误 → 直接 throw Error 阻止渲染
          // 警告级问题 → 记录日志，继续渲染
          // ─────────────────────────────────────────
          if (blockingIssues.length > 0) {
            const errMsg = `🚨 [Seedance 2.0 闸机5阻断] ${shot.id} 官方规范检查未通过，渲染被强制阻止!\n\n` +
              `阻断级错误 (${blockingIssues.length}个):\n${blockingIssues.join('\n')}` +
              (formatIssues.length > 0 ? `\n\n警告级问题 (${formatIssues.length}个):\n${formatIssues.join('\n')}` : '');
            log('RenderEngine', errMsg, 'error');
            throw new Error(errMsg);
          }
          
          if (formatIssues.length > 0) {
            log('RenderEngine', `⚠️ [Seedance 2.0 规范检查] ${shot.id} 警告级问题:\n${formatIssues.join('\n')}`, 'warn');
          }
          
          log('RenderEngine', `✅ [Seedance 2.0 闸机5] ${shot.id} 全部规范检查通过 (${finalRefs.length}张定妆照, ${shotChars.length}个角色)`, 'success');
        }

        // ✅ 闸机通过:记录定妆照实际上传状态
        if (imageFileCount > 0) {
          log('RenderEngine', `🔒 ${shot.id} 定妆照闸机通过:${imageFileCount}张定妆照将实际上传 (Seedance 2.0 reference_image 格式)`, 'success');
        }

        if (skipRender) {
          const cmdFile = path.join(rawDir, `${shot.id}-command.sh`);
          fs.writeFileSync(cmdFile, `#!/bin/bash\n${cmd}\n`);
          log('RenderEngine', `📝 ${shot.id} 命令已保存`, 'info');
          return { shot, taskId: `DRY-RUN-${shot.id}`, status: 'dry-run', prompt: finalPrompt, cmd };
        }

        // P1-4.2: 渲染缓存检查
        const cacheKey = generateCacheKey(finalPrompt, modelConfig.id, seed, shot.duration || 5, '16:9');
        const cacheResult = checkCache(cacheKey);
        if (cacheResult.hit) {
          log('RenderEngine', `💾 ${shot.id} 缓存命中 (${cacheResult.source}),跳过渲染`, 'success');
          const cachedVideoPath = cacheResult.videoPath;
          if (fs.existsSync(cachedVideoPath)) {
            const targetPath = path.join(rawDir, `${shot.id}-cached.mp4`);
            fs.copyFileSync(cachedVideoPath, targetPath);
            results.push({ shot, taskId: `CACHE-${cacheKey}`, videoPath: targetPath, status: 'cached', prompt: finalPrompt, cacheHit: true });
            continue;
          }
        }

        try {
          let currentPrompt = finalPrompt;
          let currentModel = modelConfig;

          const retryCount = shot._429RetryCount || 0;
          if (retryCount > 0) {
            const degraded = applyDegradation(currentPrompt, currentModel, retryCount - 1);
            currentPrompt = degraded.prompt;
            currentModel = degraded.modelConfig;
          }

          log('RenderEngine', `⏳ ${shot.id} 尝试 ${currentModel.name}...`, 'progress');
          const output = await execAsync(cmd, { encoding: 'utf8', timeout: 30000 });
          const match = output.match(/任务 ID:\s*(cgt-[a-z0-9-]+)/i);
          const taskId = match ? match[1] : null;

          if (taskId) {
            log('RenderEngine', `✅ ${shot.id} 已提交 (${taskId})`, 'success');

            let lastFramePath = null;
            let videoPath = null;
            if (enableFrameContinuity && !fast) {
              log('RenderEngine', `⏳ ${shot.id} 轮询等待完成获取尾帧和视频...`, 'progress');
              const pollResult = await pollTaskForLastFrame(taskId, { timeoutMs: 20 * 60 * 1000 });
              if (pollResult.success) {
                if (pollResult.lastFrameUrl) {
                  lastFramePath = await downloadLastFrame(pollResult.lastFrameUrl, shot.id, rawDir);
                }
                if (pollResult.videoUrl) {
                  videoPath = await downloadVideo(pollResult.videoUrl, shot.id, rawDir);
                }
              } else {
                log('RenderEngine', `⚠️ ${shot.id} 未获取到尾帧: ${pollResult.error || 'unknown'}`, 'warn');
              }
            }

            return { shot, taskId, status: 'submitted', prompt: currentPrompt, model: currentModel.name, lastFramePath, videoPath };
          }
          throw new Error('未能提取任务ID');
        } catch (e) {
          lastError = e;
          const errorMsg = e.message || '';

          const shouldRetry = FALLBACK_ERRORS.some(err => errorMsg.includes(err));
          if (shouldRetry && modelIdx < MODEL_PRIORITY.length - 1) {
            log('RenderEngine', `⚠️ ${shot.id} ${modelConfig.name} 失败,降级到下一模型...`, 'warn');
            if (errorMsg.includes('429') || errorMsg.includes('rate_limit') || errorMsg.includes('insufficient_quota')) {
              shot._429RetryCount = (shot._429RetryCount || 0) + 1;
            }
            continue;
          }

          log('RenderEngine', `❌ ${shot.id} 所有模型均失败: ${errorMsg}`, 'error');
          return { shot, error: errorMsg, status: 'failed', prompt: finalPrompt };
        }
      }

      return { shot, error: lastError?.message || '未知错误', status: 'failed', prompt: finalPrompt };
    });

    const batchResults = await Promise.all(batchPromises);
    tasks.push(...batchResults);

    if (!fast && enableFrameContinuity && batchResults.length > 0) {
      const lastResult = batchResults[batchResults.length - 1];
      if (lastResult.lastFramePath && fs.existsSync(lastResult.lastFramePath)) {
        previousLastFrame = lastResult.lastFramePath;
        log('RenderEngine', `🔗 尾帧接力: ${lastResult.shot.id} → 下一镜头`, 'info');
      }
    } else if (fast && i + effectiveMaxConcurrent < expandedShots.length) {
      // 快速模式批次冷却
      log('RenderEngine', `⏱️ 批次冷却 ${BATCH_COOLDOWN_MS}ms...`, 'info');
      await new Promise(r => setTimeout(r, BATCH_COOLDOWN_MS));
    }
  }

  return tasks;
}

// 策略:greedy 拆分,每段尽可能取 maxDuration,最后一段取剩余
function expandLongShots(shotsData, productionDir, plan) {
  const MAX_DURATION = 15;
  const expanded = [];

  for (const item of shotsData) {
    const { shot, prompt, refs } = item;
    const duration = shot.duration || 5;

    if (duration <= MAX_DURATION) {
      expanded.push({ shot, prompt, refs, isSplit: false });
      continue;
    }

    // Greedy 拆分:每段尽可能取 MAX_DURATION
    let remaining = duration;
    let chunkIdx = 0;

    log('RenderEngine', `⚠️ ${shot.id} 时长 ${duration}s 超过 API 上限 ${MAX_DURATION}s,开始拆分`, 'warn');

    while (remaining > 0) {
      const chunkDuration = Math.min(remaining, MAX_DURATION);
      const subShot = {
        ...shot,
        id: `${shot.id}-${String.fromCharCode(65 + chunkIdx)}`,  // S03 → S03-A, S03-B
        duration: chunkDuration,
        originalShot: shot.id,
        chunkIndex: chunkIdx,
        totalChunks: Math.ceil(duration / MAX_DURATION)
      };

      // 后续 chunk 提示词注入动作延续
      const adjustedPrompt = chunkIdx === 0
        ? prompt
        : `${prompt}(动作延续,承接上一段,保持画面连贯)`;

      expanded.push({
        shot: subShot,
        prompt: adjustedPrompt,
        refs,
        isSplit: true,
        originalShot: shot.id
      });

      remaining -= chunkDuration;
      chunkIdx++;
    }
  }

  return expanded;
}

async function pollTaskForLastFrame(taskId, options = {}) {
  const timeoutMs = options.timeoutMs || 20 * 60 * 1000; // 20分钟
  const intervalMs = options.intervalMs || 5000; // 5秒轮询
  const startedAt = Date.now();
  const SEEDANCE_SCRIPT = path.join(__dirname, '..', '..', 'byted-ark-seedance-skill', 'scripts', 'seedance.js');

  while (true) {
    try {
      const output = await execAsync(
        `node "${SEEDANCE_SCRIPT}" get --task-id "${taskId}"`,
        { encoding: 'utf8', timeout: 30000 }
      );
      const task = JSON.parse(output);
      const status = String(task.status || '').toLowerCase();

      if (status === 'succeeded') {
        const lastFrameUrl = task.content?.last_frame_url || task.content?.video_url;
        return { success: true, lastFrameUrl, videoUrl: task.content?.video_url };
      }
      if (status === 'failed' || status === 'expired' || status === 'cancelled') {
        return { success: false, error: task.error?.message || `Task ${status}` };
      }
    } catch (e) {
      // 轮询出错继续
    }

    if (Date.now() - startedAt > timeoutMs) {
      return { success: false, error: 'Polling timeout' };
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function downloadVideo(videoUrl, shotId, rawDir) {
  if (!videoUrl) return null;
  try {
    const https = require('https');
    const tmpPath = path.join(rawDir, `${shotId}.mp4`);

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tmpPath);
      https.get(videoUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    });

    log('RenderEngine', `🎬 ${shotId} 视频已下载: ${tmpPath}`, 'info');
    return tmpPath;
  } catch (e) {
    log('RenderEngine', `⚠️ 视频下载失败: ${e.message}`, 'warn');
    return null;
  }
}

async function downloadLastFrame(lastFrameUrl, segmentId, rawDir) {
  if (!lastFrameUrl) return null;
  try {
    const https = require('https');
    const tmpPath = path.join(rawDir, `${segmentId}_last_frame.png`);

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tmpPath);
      https.get(lastFrameUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    });

    log('RenderEngine', `📸 ${segmentId} 尾帧已下载: ${tmpPath}`, 'info');
    return tmpPath;
  } catch (e) {
    log('RenderEngine', `⚠️ 尾帧下载失败: ${e.message}`, 'warn');
    return null;
  }
}
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ============ CLI 入口 ============

const SEEDANCE_WRAPPER = path.join(__dirname, '..', '..', 'byted-ark-seedance-skill', 'scripts', 'seedance-wrapper.js');

async function main() {
  initConfig();

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'render') {
    const productionDir = args.find(a => a.startsWith('--production-dir='))?.split('=')[1];
    const shotsFile = args.find(a => a.startsWith('--shots='))?.split('=')[1];
    const segmentsFile = args.find(a => a.startsWith('--segments='))?.split('=')[1];
    const skipRender = args.includes('--dry-run');
    const fast = args.includes('--fast');
    const planFile = args.find(a => a.startsWith('--plan='))?.split('=')[1];

    if (!productionDir) {
      console.error('用法: node seedance-render-engine.js render --production-dir=DIR [--shots=FILE | --segments=FILE] [--dry-run] [--fast] [--plan=FILE]');
      process.exit(1);
    }

    let plan = null;
    if (planFile) {
      try {
        plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
      } catch (err) {
        console.error(`❌ 计划文件解析失败: ${planFile} - ${err.message}`);
        process.exit(1);
      }
    }

    let shotsData;

    if (shotsFile) {
      try {
        shotsData = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));
      } catch (err) {
        console.error(`❌ Shots文件解析失败: ${shotsFile} - ${err.message}`);
        process.exit(1);
      }
      log('RenderEngine', `📂 Shot 级渲染: ${shotsData.length}个镜头`, 'info');
    }
    // 向后兼容:读取 segments 文件(segment 级,自动转换)
    else if (segmentsFile) {
      let segmentsData;
      try {
        segmentsData = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
      } catch (err) {
        console.error(`❌ Segments文件解析失败: ${segmentsFile} - ${err.message}`);
        process.exit(1);
      }
      log('RenderEngine', `📂 Segment 级输入(自动转换为 Shot 级): ${segmentsData.length}个片段`, 'info');

      // 自动转换 segment → shots
      shotsData = [];
      for (const { segment, prompt, refs } of segmentsData) {
        for (const shot of segment.shots || []) {
          shotsData.push({
            shot,
            prompt: generateShotPrompt(shot, plan, refs, '', false),  // 单镜头提示词
            refs: discoverCharacterRefs(productionDir, { shots: [shot] }, plan)
          });
        }
      }
    }
    // 默认读取 story-plan.json
    else {
      const storyPlanPath = path.join(productionDir, '01-story-plan.json');
      if (!fs.existsSync(storyPlanPath)) {
        console.error(`❌ 未找到 story-plan.json: ${storyPlanPath}`);
        process.exit(1);
      }
      try {
        plan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
      } catch (err) {
        console.error(`❌ story-plan.json解析失败: ${storyPlanPath} - ${err.message}`);
        process.exit(1);
      }
      log('RenderEngine', `📂 从 story-plan.json 提取: ${plan.shots?.length || 0}个镜头`, 'info');

      shotsData = (plan.shots || []).map(shot => ({
        shot,
        prompt: generateShotPrompt(shot, plan, discoverCharacterRefs(productionDir, { shots: [shot] }, plan), '', false),
        refs: discoverCharacterRefs(productionDir, { shots: [shot] }, plan)
      }));
    }

    const results = await render(shotsData, { productionDir, skipRender, fast, plan });

    // 保存结果
    const resultFile = path.join(productionDir, '04-prompts', '04-render-results.json');
    ensureDir(path.dirname(resultFile));
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));

    log('RenderEngine', `🎬 渲染完成: ${results.length}个渲染单元`, 'phase');
    const success = results.filter(r => r.status === 'submitted').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const split = results.filter(r => r.shot?.originalShot).length;
    log('RenderEngine', `✅ 成功: ${success} | ❌ 失败: ${failed} | 🔀 自动拆分: ${split}`, 'info');
  } else {
    console.log('ShanhaiStory Forge v2.0-Peng | Seedance Render Engine v9.8.1-Peng');
    console.log('用法:');
    console.log('  Shot 级: render --production-dir=DIR --shots=FILE [--dry-run] [--fast] [--plan=FILE]');
    console.log('  Segment 级(兼容): render --production-dir=DIR --segments=FILE [--dry-run] [--fast]');
    console.log('  自动提取: render --production-dir=DIR [--dry-run] [--fast] [--plan=FILE]');
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error('致命错误:', e);
    process.exit(1);
  });
}

module.exports = { render, generateShotPrompt, generateSegmentPrompt, validatePromptLength, canUseMultiShot, applyDegradation, expandPromptToTarget, expandLongShots, discoverCharacterRefs };

/**
 * 🎨 角色定妆照强制上传铁律（v1.0-Peng，2026-06-01）
 * 所有镜头渲染必须上传定妆照，包括镜头中提到的所有角色
 * 小G: --image-file 本地文件 | 异兽: --image-url 在线URL
 * 4道闸机：角色检测→文件存在→命令构建→执行前检查
 * 严禁用独立脚本绕过闸机直接提交API
 * 违反=系统级错误，成片必须返工重渲染
 */