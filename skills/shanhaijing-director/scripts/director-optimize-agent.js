#!/usr/bin/env node
/**
 * 导演优化Agent v1.3-Peng-fix1 (ShanhaiStory Forge)
 * 
 * v1.3-Peng-fix1 更新（2026-05-31）：
 * - 🆕 非字符串防御: _serializeShots/_serializePrompts/_serializeDialogue 添加 String() 强制转换
 *   修复 text.substring is not a function 崩溃（LLM返回对象/undefined时序列化失败）
 * 
 * v1.3-Peng 更新（2026-05-31）：
 * - 🆕 问题分类与自动修复指令：审片发现问题后自动分类为6种修复类型，生成自动修复指令传递给编剧Agent
 * - 自动修复类型：duration_adjust(时长调整)、dialogue_reconstruct(台词重构)、transition_design(转场设计)、style_calibrate(风格统一)、structure_reorder(结构重组)、prompt_enhance(提示词增强)
 * - 新增方法：_classifyIssuesForAutoFix、_generateAutoFixInstructions
 * 
 * v1.2-Peng 更新（2026-05-31）：
 * - maxTokens解除: 4096→128000，匹配百万级上下文模型
 * - 评审模式明确: review()只做评审不修改，修复交给编剧Agent：
 * - 🆕 LLM真实调用集成完成
 *   - 引入 LLMCaller，调用内置Kimi Coding端点进行四维评估
 *   - review() 改为 async，先尝试 _reviewWithLLM(context)，失败降级到 _reviewWithRules(context)
 *   - 新增 _reviewWithLLM：构造导演优化系统提示词（20年经验导演，四维评估框架）
 *   - 系统提示词：故事30%/连贯25%/视觉25%/风格20%
 *   - 要求严格JSON输出，解析后兼容原有报告格式
 *   - 新增6个LLM辅助方法：序列化shots/prompts/dialogue + 解析fallback + 评分计算 + 问题推断
 *   - 数据格式兼容：支持dialogue数组和对象（场景号索引）格式
 *   - 测试验证：LLM调用成功，返回完整四维评估报告
 *   - 降级保护：LLM调用失败时自动降级到规则引擎，不阻断Pipeline
 * 
 * v1.0-Peng 原始功能：
 * - 输入：完整镜头脚本（shots + prompts + story-plan + dialogue）
 * - 输出：结构化优化报告（四维评分 + 问题清单 + 优化建议）
 * - 评估与执行分离：只评估不修改，修改交给编剧Agent
 * - 完整故事视角：所有评估基于全剧本，不孤立看单个镜头
 * 
 * 四维评估框架：
 * 1. 故事性(30%)：叙事结构、角色动机、情绪弧线
 * 2. 连贯性(25%)：景别过渡、运镜方向、视觉元素连续性
 * 3. 视觉语言(25%)：运镜-叙事匹配、构图情感
 * 4. 风格一致性(20%)：全片运镜/光影/情绪统一度
 * 
 * 版本: v1.3-Peng-fix1 | 2026-05-31
 * 所属系统: ShanhaiStory Forge v2.36-Peng-fix
 */

const ContinuityEngine = require('./continuity-engine');
const DialogueConsistencyEngine = require('./dialogue-consistency-engine');
const DirectorStyleLibrary = require('./director-style-library');
const { createLLMCaller } = require('./llm-caller');

class DirectorOptimizeAgent {
  constructor(options = {}) {
    this.version = '1.0-Peng';
    this.options = {
      passThreshold: 4.0,      // 通过阈值 4.0/5.0
      maxIterations: 3,        // 最大迭代次数
      directorStyle: options.directorStyle || 'cameron', // 默认卡梅隆风格
      weights: options.weights || { story: 0.30, continuity: 0.25, visual: 0.25, style: 0.20 },
      ...options
    };
    
    // 子引擎实例
    this.continuityEngine = new ContinuityEngine();
    this.dialogueEngine = new DialogueConsistencyEngine();
    this.styleLibrary = new DirectorStyleLibrary();
    
    // LLM调用器（真实推理）
    this.llmCaller = createLLMCaller({
      temperature: 0.3,  // 低温度，审片需要稳定
      maxTokens: 128000,
      timeout: 600000  // 🆕 v6.3-Peng-fix: 10分钟超长超时，导演优化需要重度推理
    });
    
    // 导演风格配置（动态加载）
    this.styleConfig = this.styleLibrary.loadStyle(this.options.directorStyle);
  }

  /**
   * 主入口：执行导演优化
   * v1.1-Peng: 集成LLM真实推理，失败时降级到规则引擎
   * @param {Object} context - 包含 storyPlan, shots, prompts, dialogue
   * @returns {Object} 审片报告
   */
  async review(context) {
    const { storyPlan, shots, prompts, dialogue, styleProfile } = context;
    
    console.log(`[DirectorOptimize v${this.version}] 开始优化：${storyPlan?.title || 'Untitled'} | 风格：${this.options.directorStyle}`);
    
    // 1. 加载风格配置（如果context指定了风格）
    if (styleProfile && styleProfile !== this.options.directorStyle) {
      this.styleConfig = this.styleLibrary.loadStyle(styleProfile);
      this.options.directorStyle = styleProfile;
    }
    
    // 🆕 v1.1-Peng: 优先使用LLM真实推理
    try {
      console.log(`[DirectorOptimize] 🧠 调用LLM进行真实推理优化...`);
      const llmReport = await this._reviewWithLLM(context);
      console.log(`[DirectorOptimize] ✅ LLM优化完成：${llmReport.overallScore.toFixed(1)}/5.0`);
      
      // 🆕 v1.3-Peng-fix: 导演Agent发现问题后，分类问题类型并附加修复指令
      // 编剧Agent接收后，根据问题类型自动执行修复（非人工干预）
      const classifiedIssues = this._classifyIssuesForAutoFix(llmReport.issueList || []);
      llmReport.classifiedIssues = classifiedIssues;
      llmReport.autoFixInstructions = this._generateAutoFixInstructions(classifiedIssues);
      
      console.log(`[DirectorOptimize] 📋 问题分类: ${classifiedIssues.length}类, 自动修复指令: ${llmReport.autoFixInstructions.length}条`);
      
      return llmReport;
    } catch (error) {
      console.warn(`[DirectorOptimize] ⚠️ LLM优化失败(${error.message})，降级到规则引擎...`);
      return this._reviewWithRules(context);
    }
  }
  
  /**
   * LLM真实推理审片
   */
  async _reviewWithLLM(context) {
    const { storyPlan, shots, prompts, dialogue } = context;
    
    const systemPrompt = `你是一位拥有20年经验的电影导演优化专家。你的任务是对视频镜头脚本进行专业评估，并输出可直接自动应用的修复指令。

🎬 导演风格DNA（${this.styleConfig.name} - ${this.styleConfig.type}）：
- 叙事结构: ${this.styleConfig.preferences.narrativeStructure}
- 运镜风格: ${this.styleConfig.preferences.motionStyle}
- 光影风格: ${this.styleConfig.preferences.lightingStyle}
- 色调偏好: ${this.styleConfig.preferences.colorTone}
- 情绪基调: ${this.styleConfig.preferences.emotionTone}
- 风格描述: ${this.styleConfig.description}

四维评估框架（以${this.styleConfig.name}风格标准执行）：
1. 故事性(30%)：叙事结构完整性、角色动机清晰度、情绪弧线平滑度、信息层级递进
2. 连贯性(25%)：景别过渡合理性（禁止≥3级跳跃）、运镜方向连续性、视觉元素一致性
3. 视觉语言(25%)：运镜-叙事匹配度（运镜必须服务于情感）、构图情感表达、光影情绪一致性
4. 风格一致性(20%)：全片运镜风格统一（≤3种）、光影色调连贯、情绪基调稳定

评分标准：0-5分，5分为完美。issue严重度：fatal(阻断渲染)/severe(严重)/moderate(中等)/minor(轻微)

🔥 关键要求：你不仅要发现问题，还要输出【修复指令(fixes)】。每个fix必须精确指定：
- shotId: 镜头ID（如"S03"）或"ALL"（所有镜头）
- field: 要修改的字段路径（如"cinematography.description"）
- action: "set"（替换）/ "append"（追加）/ "delete"（删除）
- value: 修复后的值
- reason: 为什么需要这个修复

你必须返回严格的JSON格式：
{
  "dimensions": {
    "story": {"score": 4.5, "issues": [{"severity":"severe","description":"...","suggestion":"..."}]},
    "continuity": {"score": 4.0, "issues": [...]},
    "visual": {"score": 3.5, "issues": [...]},
    "style": {"score": 4.0, "issues": [...]}
  },
  "totalScore": 4.0,
  "fixes": [
    {"shotId":"S03","field":"cinematography.description","action":"set","value":"dolly zoom into face, 120° swing","reason":"全景镜头缺少运镜方案"},
    {"shotId":"ALL","field":"oneshot","action":"set","value":true,"reason":"动作类型必须一镜到底"}
  ]
}`;

    // 构建用户提示词（序列化核心数据）
    const userPrompt = `请对以下视频镜头脚本进行导演优化评估：\n\n## 故事方案\n标题：${storyPlan?.title || 'Untitled'}\n时长：${storyPlan?.duration || 60}秒\n风格：${this.options.directorStyle}\n\n## 镜头列表\n${this._serializeShots(shots)}\n\n## 完整Prompt（供视觉语言评估）\n${this._serializePrompts(prompts)}\n\n## 台词/角色台词\n${this._serializeDialogue(dialogue)}\n\n请严格按照JSON格式返回四维评估结果。`;

    const result = await this.llmCaller.callJSON(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 128000
    });

    // 解析LLM输出的JSON
    let llmResult;
    try {
      if (result.parsedJSON) {
        llmResult = result.parsedJSON;
      } else {
        throw new Error(result.parseError || 'JSON解析失败');
      }
    } catch (parseError) {
      console.warn(`[DirectorOptimize] LLM输出JSON解析失败，尝试容错解析: ${parseError.message}`);
      llmResult = this._fallbackParseLLMOutput(result.result || result.content || '');
    }

    // 组装报告（兼容原有格式）
    const dimensions = llmResult.dimensions || llmResult;
    const totalScore = llmResult.totalScore || this._calculateLLMTotalScore(dimensions);
    
    const allIssues = [
      ...(dimensions.story?.issues || []),
      ...(dimensions.continuity?.issues || []),
      ...(dimensions.visual?.issues || []),
      ...(dimensions.style?.issues || [])
    ].map((issue, idx) => ({
      id: `llm-${idx}`,
      type: issue.type || this._inferIssueType(issue.description),
      severity: issue.severity || 'moderate',
      description: issue.description || issue.reason || '未描述',
      suggestion: issue.suggestion || issue.fix || '需优化',
      relatedShots: issue.relatedShots || []
    }));

    return {
      version: `${this.version}-llm`,
      directorStyle: this.options.directorStyle,
      overallScore: totalScore,
      passThreshold: this.options.passThreshold,
      passThresholdMet: totalScore >= this.options.passThreshold,
      hasCriticalIssues: allIssues.some(i => i.severity === 'fatal'),
      dimensions: {
        story: { score: dimensions.story?.score || 3, max: 5, issues: dimensions.story?.issues || [] },
        continuity: { score: dimensions.continuity?.score || 3, max: 5, issues: dimensions.continuity?.issues || [] },
        visual: { score: dimensions.visual?.score || 3, max: 5, issues: dimensions.visual?.issues || [] },
        style: { score: dimensions.style?.score || 3, max: 5, issues: dimensions.style?.issues || [] }
      },
      issueList: allIssues,
      fixes: llmResult.fixes || [],
      recommendations: llmResult.recommendations || this._generateRecommendations(allIssues, totalScore),
      improvementDirection: this._determineDirection(allIssues),
      timestamp: new Date().toISOString(),
      llmCall: {
        duration: result.duration,
        tokenUsage: result.tokenUsage,
        callId: result.callId
      }
    };
  }

  /**
   * 规则引擎审片（降级方案）
   */
  _reviewWithRules(context) {
    const { storyPlan, shots, prompts, dialogue, styleProfile } = context;
    
    // 1. 加载风格配置（如果context指定了风格）
    if (styleProfile && styleProfile !== this.options.directorStyle) {
      this.styleConfig = this.styleLibrary.loadStyle(styleProfile);
      this.options.directorStyle = styleProfile;
    }
    
    // 2. 四维评估（串行执行，每个维度依赖前一个的部分结果）
    const storyScore = this._evaluateStory(storyPlan, shots, dialogue);
    const continuityScore = this._evaluateContinuity(shots, prompts);
    const visualScore = this._evaluateVisualLanguage(shots, prompts);
    const styleScore = this._evaluateStyleConsistency(shots, prompts);
    
    // 3. 综合评分
    const totalScore = this._calculateTotalScore(storyScore, continuityScore, visualScore, styleScore);
    
    // 4. 问题整合（引擎提候选 + 导演独立发现）
    const issues = this._collectIssues(storyScore, continuityScore, visualScore, styleScore);
    
    // 🆕 v1.4-Peng-fix: 新增导演优化检查项（台词唯一性/角色视角/占位符）
    const additionalIssues = this._performAdditionalChecks(context);
    if (additionalIssues.length > 0) {
      issues.push(...additionalIssues);
    }
    
    // 重新按严重度排序
    const severityOrder = { fatal: 0, severe: 1, moderate: 2, minor: 3 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    // 5. 优化建议
    const recommendations = this._generateRecommendations(issues, totalScore);
    
    // 6. 生成报告
    const report = {
      version: this.version,
      directorStyle: this.options.directorStyle,
      overallScore: totalScore,
      passThreshold: this.options.passThreshold,
      passThresholdMet: totalScore >= this.options.passThreshold,
      hasCriticalIssues: issues.some(i => i.severity === 'fatal'),
      dimensions: {
        story: { score: storyScore.score, max: 5, issues: storyScore.issues },
        continuity: { score: continuityScore.score, max: 5, issues: continuityScore.issues },
        visual: { score: visualScore.score, max: 5, issues: visualScore.issues },
        style: { score: styleScore.score, max: 5, issues: styleScore.issues }
      },
      issueList: issues,
      recommendations: recommendations,
      improvementDirection: this._determineDirection(issues),
      timestamp: new Date().toISOString()
    };
    
    console.log(`[DirectorOptimize] 优化完成：综合评分 ${totalScore.toFixed(1)}/5.0 | 状态：${report.passThresholdMet ? '通过' : '不通过'} | 问题数：${issues.length}`);
    
    return report;
  }

  // ====== 维度1：故事性评估 ======
  _evaluateStory(storyPlan, shots, dialogue) {
    const issues = [];
    let score = 5;
    
    // 1.1 检查情绪弧线是否锯齿状
    if (storyPlan && storyPlan.shots) {
      const emotions = storyPlan.shots.map(s => s.emotion).filter(Boolean);
      const hasSawtooth = this._detectSawtoothEmotion(emotions);
      if (hasSawtooth) {
        score -= 1;
        issues.push({
          type: 'story',
          severity: 'severe',
          description: '情绪弧线呈锯齿状，相邻镜头情绪跳变过大，缺乏过渡铺垫',
          relatedShots: this._findEmotionJumps(storyPlan.shots),
          suggestion: '在情绪跳变镜头之间插入过渡镜头或调整情绪标签，确保情绪弧线平滑递进'
        });
      }
    }
    
    // 1.2 检查台词一致性（调用台词引擎）
    const dialogueAnalysis = this.dialogueEngine.analyze(shots, dialogue);
    if (dialogueAnalysis.themeDeviation > 0.4) {
      score -= 0.5;
      issues.push({
        type: 'story',
        severity: 'severe',
        description: `台词主题偏离度过高(${dialogueAnalysis.themeDeviation.toFixed(2)})，部分镜头台词与核心主题无关`,
        relatedShots: dialogueAnalysis.deviatedShots,
        suggestion: '重构台词为跨镜头对话回合结构，确保每句台词服务于核心故事推进'
      });
    }
    
    if (dialogueAnalysis.interactivityScore < 0.5) {
      score -= 0.5;
      issues.push({
        type: 'story',
        severity: 'severe',
        description: `台词对话互动性不足(${dialogueAnalysis.interactivityScore.toFixed(2)})，独白过多缺乏回应关系`,
        relatedShots: dialogueAnalysis.monologueShots,
        suggestion: '将独白重构为问-答对话回合，建立跨镜头台词关联'
      });
    }
    
    // 1.3 检查信息层级推进
    if (dialogueAnalysis.infoHierarchy === 'flat') {
      score -= 0.5;
      issues.push({
        type: 'story',
        severity: 'moderate',
        description: '信息层级扁平，全片台词在同一平面上重复，缺乏背景→情节→情感的递进',
        relatedShots: dialogueAnalysis.redundantShots,
        suggestion: '按L1(背景)→L2(情节)→L3(情感)三级结构重构台词信息层级'
      });
    }
    
    // 1.4 导演风格特别关注（故事性维度）
    if (this.styleConfig?.specialFocus?.storytelling) {
      const storyCheck = this.styleConfig.specialFocus.storytelling(storyPlan, shots);
      if (storyCheck.issues) {
        score -= storyCheck.penalty || 0;
        issues.push(...storyCheck.issues);
      }
    }
    
    score = Math.max(1, Math.min(5, score));
    return { score, issues };
  }

  // ====== 维度2：连贯性评估 ======
  _evaluateContinuity(shots, prompts) {
    const issues = [];
    let score = 5;
    
    // 调用连贯性引擎分析所有相邻镜头对
    const continuityAnalysis = this.continuityEngine.analyze(shots, prompts);
    
    // 2.1 景别跳跃检查
    const illegalScaleJumps = continuityAnalysis.scaleIssues.filter(i => i.severity === 'fatal');
    if (illegalScaleJumps.length > 0) {
      score -= Math.min(2, illegalScaleJumps.length * 0.5);
      issues.push(...illegalScaleJumps.map(jump => ({
        type: 'continuity',
        severity: 'fatal',
        description: `景别非法跳跃：${jump.shotA}(${jump.scaleA}) → ${jump.shotB}(${jump.scaleB})，跨度${jump.delta}级，远超阈值(≥3级非法)`,
        relatedShots: [jump.shotA, jump.shotB],
        suggestion: `插入过渡镜头或使用叠化/淡入淡出，将景别梯度控制在≤2级`
      })));
    }
    
    const conditionalScaleJumps = continuityAnalysis.scaleIssues.filter(i => i.severity === 'severe');
    if (conditionalScaleJumps.length > 0) {
      score -= Math.min(1, conditionalScaleJumps.length * 0.3);
      issues.push(...conditionalScaleJumps.map(jump => ({
        type: 'continuity',
        severity: 'severe',
        description: `景别条件跳跃：${jump.shotA}(${jump.scaleA}) → ${jump.shotB}(${jump.scaleB})，跨度${jump.delta}级，需叠化过渡`,
        relatedShots: [jump.shotA, jump.shotB],
        suggestion: `强制使用叠化或淡入淡出过渡，避免硬切`
      })));
    }
    
    // 2.2 运镜方向冲突
    const motionConflicts = continuityAnalysis.motionIssues.filter(i => i.severity === 'severe');
    if (motionConflicts.length > 0) {
      score -= Math.min(1.5, motionConflicts.length * 0.5);
      issues.push(...motionConflicts.map(conflict => ({
        type: 'continuity',
        severity: 'severe',
        description: `运镜方向冲突：${conflict.shotA} → ${conflict.shotB}，向量夹角${conflict.angle.toFixed(0)}°，速度差异${(conflict.speedDelta * 100).toFixed(0)}%`,
        relatedShots: [conflict.shotA, conflict.shotB],
        suggestion: `使用叠化过渡或统一运镜速度层级，避免${conflict.conflictType}`
      })));
    }
    
    // 2.3 视觉元素断裂
    const visualBreaks = continuityAnalysis.visualIssues.filter(i => i.severity === 'severe');
    if (visualBreaks.length > 0) {
      score -= Math.min(1, visualBreaks.length * 0.3);
      issues.push(...visualBreaks.map(break_ => ({
        type: 'continuity',
        severity: 'severe',
        description: `视觉元素断裂：${break_.element}在${break_.shotA}→${break_.shotB}间不可解释突变`,
        relatedShots: [break_.shotA, break_.shotB],
        suggestion: `保持关键道具/光影特征在跨镜头中的一致性，或设定时间流逝叙事功能`
      })));
    }
    
    score = Math.max(1, Math.min(5, score));
    return { score, issues };
  }

  // ====== 维度3：视觉语言评估 ======
  _evaluateVisualLanguage(shots, prompts) {
    const issues = [];
    let score = 5;
    
    // 3.1 运镜-叙事匹配度检查
    if (shots) {
      shots.forEach((shot, idx) => {
        const cameraMove = shot.camera?.move || shot.cameramove || '';
        const emotion = shot.emotion || '';
        const type = shot.type || '';
        
        // 检查运镜是否与情绪错配
        const mismatch = this._checkCameraEmotionMismatch(cameraMove, emotion, type);
        if (mismatch) {
          score -= 0.3;
          issues.push({
            type: 'visual',
            severity: 'moderate',
            description: `运镜-叙事错配：${shot.id} 使用"${cameraMove}"配合"${emotion}"情绪，${mismatch.reason}`,
            relatedShots: [shot.id],
            suggestion: mismatch.suggestion
          });
        }
      });
    }
    
    // 3.2 检查是否有镜头运镜完全脱离叙事
    if (prompts) {
      const detachedMoves = prompts.filter(p => {
        const prompt = p.prompt || p._generatedPrompt || '';
        // 检查是否包含纯技术性运镜描述但无叙事目的
        return /cinematic shot|tracking|panning|dolly|crane/i.test(prompt) && 
               !/subject|character|action|interaction|reaction/i.test(prompt);
      });
      if (detachedMoves.length > 0) {
        score -= 0.5;
        issues.push({
          type: 'visual',
          severity: 'moderate',
          description: `${detachedMoves.length}个镜头运镜描述缺乏叙事目的，纯技术动作未服务于情感表达`,
          relatedShots: detachedMoves.map(p => p.shotId || p.id),
          suggestion: '为每个运镜添加叙事动机：这个镜头想表达什么情感？角色在经历什么？'
        });
      }
    }
    
    // 3.3 导演风格特别关注（视觉维度）
    if (this.styleConfig?.specialFocus?.visual) {
      const visualCheck = this.styleConfig.specialFocus.visual(shots, prompts);
      if (visualCheck.issues) {
        score -= visualCheck.penalty || 0;
        issues.push(...visualCheck.issues);
      }
    }
    
    score = Math.max(1, Math.min(5, score));
    return { score, issues };
  }

  // ====== 维度4：风格一致性评估 ======
  _evaluateStyleConsistency(shots, prompts) {
    const issues = [];
    let score = 5;
    
    // 4.1 检查运镜风格漂移
    if (shots && shots.length > 2) {
      const cameraStyles = shots.map(s => this._classifyCameraStyle(s.camera?.move || s.cameramove || ''));
      const uniqueStyles = new Set(cameraStyles.filter(Boolean));
      if (uniqueStyles.size > 3) {
        score -= 1;
        issues.push({
          type: 'style',
          severity: 'severe',
          description: `运镜风格漂移严重：全片出现${uniqueStyles.size}种不同运镜美学（${Array.from(uniqueStyles).join('/') }），微观漂移密集`,
          relatedShots: shots.map(s => s.id),
          suggestion: '统一全片运镜风格，建议控制在2-3种以内，保持视觉连贯性'
        });
      }
    }
    
    // 4.2 检查光影色调漂移（通过关键词检测）
    if (prompts) {
      const lightings = prompts.map(p => {
        const prompt = p.prompt || p._generatedPrompt || '';
        return this._extractLightingTone(prompt);
      }).filter(Boolean);
      
      if (lightings.length > 2) {
        const uniqueLightings = new Set(lightings);
        if (uniqueLightings.size > 3) {
          score -= 0.5;
          issues.push({
            type: 'style',
            severity: 'moderate',
            description: `光影色调漂移：全片出现${uniqueLightings.size}种不同光影基调，时间感不可预测`,
            relatedShots: prompts.map((p, i) => p.shotId || p.id || `S${String(i).padStart(2, '0')}`),
            suggestion: '统一光源逻辑或设定明确的时间流逝叙事功能，保持光影基调一致'
          });
        }
      }
    }
    
    // 4.3 导演风格特别关注（风格维度）
    if (this.styleConfig?.specialFocus?.style) {
      const styleCheck = this.styleConfig.specialFocus.style(shots, prompts);
      if (styleCheck.issues) {
        score -= styleCheck.penalty || 0;
        issues.push(...styleCheck.issues);
      }
    }
    
    score = Math.max(1, Math.min(5, score));
    return { score, issues };
  }

  // ====== 辅助方法 ======
  
  _detectSawtoothEmotion(emotions) {
    if (!emotions || emotions.length < 3) return false;
    let jumps = 0;
    for (let i = 1; i < emotions.length; i++) {
      const prev = this._emotionIntensity(emotions[i - 1]);
      const curr = this._emotionIntensity(emotions[i]);
      if (Math.abs(curr - prev) > 2) jumps++;
    }
    return jumps >= 2; // 2次以上跳变视为锯齿
  }
  
  _findEmotionJumps(shots) {
    const jumps = [];
    for (let i = 1; i < shots.length; i++) {
      const prev = this._emotionIntensity(shots[i - 1].emotion);
      const curr = this._emotionIntensity(shots[i].emotion);
      if (Math.abs(curr - prev) > 2) {
        jumps.push(`${shots[i - 1].id || i}→${shots[i].id || (i+1)}`);
      }
    }
    return jumps;
  }
  
  _emotionIntensity(emotion) {
    const map = {
      'peaceful': 1, 'calm': 1, 'serene': 1,
      'curious': 2, 'wonder': 2, 'intrigued': 2,
      'uneasy': 3, 'tense': 3, 'anxious': 3, 'fear': 3,
      'confused': 4, 'conflict': 4, 'frustrated': 4,
      'epic_reveal': 5, 'climax': 5, 'triumphant': 5,
      'sad': 2, 'melancholy': 2, 'lonely': 2,
      'angry': 4, 'furious': 5, 'rage': 5,
      'joy': 4, 'happy': 4, 'excited': 5
    };
    return map[emotion?.toLowerCase()] || 3;
  }
  
  _checkCameraEmotionMismatch(cameraMove, emotion, type) {
    const move = (cameraMove || '').toLowerCase();
    const emo = (emotion || '').toLowerCase();
    
    // 快速激烈运镜 + 平静情绪 = 错配
    if (/crash|rapid|fast|shake|jerk/i.test(move) && /peaceful|calm|serene|sad|melancholy/i.test(emo)) {
      return {
        reason: '快速激烈运镜与平静情绪不匹配，造成感官冲突',
        suggestion: '平静情绪使用缓慢稳定运镜（slow pan/tracking），或改为渐进式情绪升级'
      };
    }
    
    // 极慢运镜 + 紧张/高潮情绪 = 错配
    if (/static|lock|fixed|slow/i.test(move) && /climax|tense|fear|epic_reveal/i.test(emo)) {
      return {
        reason: '静止/极慢运镜与紧张高潮情绪不匹配，节奏拖沓',
        suggestion: '高潮情绪配合动态运镜（push in/tracking/orbit），增强紧迫感'
      };
    }
    
    return null;
  }
  
  _classifyCameraStyle(move) {
    const m = (move || '').toLowerCase();
    if (/handheld|shake|run|jerk/i.test(m)) return 'handheld';
    if (/drone|aerial|orbit|flyover|helicopter/i.test(m)) return 'aerial';
    if (/push|pull|dolly|track|follow/i.test(m)) return 'tracking';
    if (/pan|tilt|crane|boom/i.test(m)) return 'classical';
    if (/static|lock|fixed/i.test(m)) return 'static';
    return 'mixed';
  }
  
  _extractLightingTone(prompt) {
    if (!prompt) return null;
    const p = prompt.toLowerCase();
    if (/warm|golden|sunset|orange|amber|firelight|torch/i.test(p)) return 'warm';
    if (/cool|cold|blue|moonlight|night|twilight|dusk/i.test(p)) return 'cool';
    if (/harsh|high.contrast|dramatic|chiaroscuro|spotlight/i.test(p)) return 'dramatic';
    if (/soft|diffuse|even|flat|overcast|cloudy/i.test(p)) return 'soft';
    if (/dark|pitch|black|shadow|noir/i.test(p)) return 'dark';
    return 'neutral';
  }
  
  _calculateTotalScore(story, continuity, visual, style) {
    const w = this.options.weights;
    return (w.story * story.score + w.continuity * continuity.score + 
            w.visual * visual.score + w.style * style.score);
  }
  
  _collectIssues(story, continuity, visual, style) {
    const all = [
      ...story.issues,
      ...continuity.issues,
      ...visual.issues,
      ...style.issues
    ];
    
    // 按严重度排序：fatal > severe > moderate > minor
    const severityOrder = { fatal: 0, severe: 1, moderate: 2, minor: 3 };
    return all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }
  
  _performAdditionalChecks(context) {
    const { shots, prompts, dialogue } = context;
    const issues = [];
    
    // 🆕 v1.4-Peng-fix: 检查1 - 台词唯一性
    // 统计所有台词，去重后比较
    if (dialogue && typeof dialogue === 'object') {
      const allTexts = [];
      const seenTexts = new Set();
      let duplicateCount = 0;
      
      for (const [shotId, d] of Object.entries(dialogue)) {
        if (!d || !d.text) continue;
        const text = d.text.trim();
        if (seenTexts.has(text)) {
          duplicateCount++;
          issues.push({
            type: 'story',
            severity: 'severe',
            description: `台词重复：${shotId} 的台词 "${text.substring(0, 30)}..." 在多个镜头中出现`,
            relatedShots: [shotId],
            suggestion: '每个镜头必须有专属台词，禁止跨镜头复用同一句台词'
          });
        } else {
          seenTexts.add(text);
          allTexts.push({ shotId, text });
        }
      }
      
      // 如果重复台词数 > 0，额外提一个总览问题
      if (duplicateCount > 0) {
        issues.push({
          type: 'story',
          severity: 'fatal',
          description: `台词唯一性检查失败：${duplicateCount}句台词在多个镜头重复出现，违反跨镜头台词唯一性原则`,
          relatedShots: allTexts.map(t => t.shotId),
          suggestion: '为每个镜头重新撰写专属台词，确保8个镜头全部有独立不重复的台词'
        });
      }
      
      // 检查台词总数（8镜头应有至少6句台词）
      const uniqueCount = seenTexts.size;
      const totalShots = shots?.length || 0;
      if (uniqueCount < totalShots * 0.6) {
        issues.push({
          type: 'story',
          severity: 'severe',
          description: `台词覆盖率不足：${totalShots}个镜头仅有${uniqueCount}句独立台词，覆盖率${Math.round(uniqueCount/totalShots*100)}%（期望≥80%）`,
          relatedShots: shots?.map(s => s.id) || [],
          suggestion: '增加更多台词，每个镜头至少有一句独立台词'
        });
      }
    }
    
    // 🆕 v1.4-Peng-fix: 检查2 - 占位符/变量替换失败
    if (prompts && Array.isArray(prompts)) {
      for (const prompt of prompts) {
        const text = prompt.prompt || prompt._generatedPrompt || '';
        // 检查 null/undefined/神兽null 等占位符残留
        if (text.includes('神兽null') || text.includes('undefined') || text.includes('null')) {
          issues.push({
            type: 'visual',
            severity: 'fatal',
            description: `Prompt中存在占位符残留：${prompt.id || 'unknown'} 包含 "${text.includes('神兽null') ? '神兽null' : text.includes('undefined') ? 'undefined' : 'null'}"，变量替换失败`,
            relatedShots: [prompt.id || 'unknown'],
            suggestion: '检查角色名称变量替换逻辑，确保所有占位符在Prompt生成前被替换为实际角色名'
          });
        }
        
        // 检查标签系统残留（emoji标签不应出现在Prompt中）
        if (text.includes('🔴 P0') || text.includes('🟡 P1') || text.includes('🟢 P2') || text.includes('🔵 P3')) {
          issues.push({
            type: 'visual',
            severity: 'severe',
            description: `Prompt中存在元数据标签污染：${prompt.id || 'unknown'} 包含优先级标签（如"🔴 P0"），标签系统不应进入Prompt文本`,
            relatedShots: [prompt.id || 'unknown'],
            suggestion: '清理Prompt组装阶段的标签注入逻辑，确保元数据标签只存在于审核报告中，不进入实际渲染提示词'
          });
        }
        
        // 检查重复免责声明
        const disclaimerCount = (text.match(/generated by AI/gi) || []).length;
        if (disclaimerCount > 1) {
          issues.push({
            type: 'visual',
            severity: 'moderate',
            description: `Prompt中免责声明重复${disclaimerCount}次，浪费${disclaimerCount * 40}字符空间`,
            relatedShots: [prompt.id || 'unknown'],
            suggestion: '移除Prompt内重复的免责声明，仅在成片阶段以字幕形式统一呈现'
          });
        }
      }
    }
    
    // 🆕 v1.4-Peng-fix: 检查3 - 角色视角正确性
    if (dialogue && typeof dialogue === 'object') {
      for (const [shotId, d] of Object.entries(dialogue)) {
        if (!d || !d.text || !d.character) continue;
        
        const text = d.text;
        const character = d.character;
        const characterName = d.characterName || '';
        
        // 检查说话人身份与台词内容是否匹配
        // 例如：小G的台词中不应该出现"三千年""战魂"等刑天专属词汇
        if (character === 'xiaoG' && (text.includes('三千年') || text.includes('战魂') || text.includes('黄帝'))) {
          issues.push({
            type: 'story',
            severity: 'moderate',
            description: `角色视角不匹配：${shotId} 中小G的台词 "${text.substring(0, 30)}..." 包含刑天专属词汇（如"三千年""战魂"），不符合小G的身份认知`,
            relatedShots: [shotId],
            suggestion: '小G的台词应体现儿童视角（天真、好奇、恐惧），避免使用神兽的历史/神话专属词汇'
          });
        }
        
        // 检查刑天台词是否使用第一人称（内心独白）
        if (character === 'beast' && !text.includes('我') && !text.includes('我的') && text.length > 10) {
          issues.push({
            type: 'story',
            severity: 'minor',
            description: `刑天内心独白可能缺少第一人称：${shotId} 台词 "${text.substring(0, 30)}..." 未使用"我""我的"，可能不像内心独白`,
            relatedShots: [shotId],
            suggestion: '刑天视角的内心独白应使用第一人称（"我""我的"）以增强代入感'
          });
        }
      }
    }
    
    return issues;
  }
  
  _generateRecommendations(issues, totalScore) {
    const recommendations = [];
    
    // 按优先级分组
    const fatal = issues.filter(i => i.severity === 'fatal');
    const severe = issues.filter(i => i.severity === 'severe');
    const moderate = issues.filter(i => i.severity === 'moderate');
    
    if (fatal.length > 0) {
      recommendations.push({
        priority: 'P0-致命优先',
        description: `修复${fatal.length}处致命问题：${fatal.map(i => i.description).slice(0, 2).join('；')}${fatal.length > 2 ? '...' : ''}`,
        operations: ['结构调整', '转场设计']
      });
    }
    
    if (severe.length > 0) {
      recommendations.push({
        priority: 'P1-严重修复',
        description: `修复${severe.length}处严重问题：${severe.map(i => i.description).slice(0, 2).join('；')}${severe.length > 2 ? '...' : ''}`,
        operations: ['内容改写', '台词重构', '风格校准']
      });
    }
    
    if (moderate.length > 0) {
      recommendations.push({
        priority: 'P2-轻微优化',
        description: `优化${moderate.length}处轻微问题`,
        operations: ['风格校准', '内容改写']
      });
    }
    
    if (totalScore < this.options.passThreshold) {
      recommendations.push({
        priority: 'P3-整体提升',
        description: `综合评分${totalScore.toFixed(1)}低于阈值${this.options.passThreshold}，需整体提升故事统一性`,
        operations: ['结构调整', '台词重构', '风格校准']
      });
    }
    
    return recommendations;
  }
  
  _determineDirection(issues) {
    const hasContinuity = issues.some(i => i.type === 'continuity');
    const hasStory = issues.some(i => i.type === 'story');
    const hasVisual = issues.some(i => i.type === 'visual');
    const hasStyle = issues.some(i => i.type === 'style');
    
    const directions = [];
    if (hasStory) directions.push('强化叙事连贯性，重构跨镜头台词关联');
    if (hasContinuity) directions.push('严控景别过渡与运镜方向，消除转场断裂');
    if (hasVisual) directions.push('校准运镜-叙事匹配，确保每个镜头服务于情感表达');
    if (hasStyle) directions.push('统一全片视觉风格，消除微观/宏观漂移');
    
    return directions;
  }
  
  // ====== LLM辅助方法 ======
  
  _serializeShots(shots) {
    if (!shots || shots.length === 0) return '无镜头数据';
    return shots.map((s, i) => {
      const id = s.id || `S${String(i).padStart(2, '0')}`;
      const type = s.type || s.shotType || 'unknown';
      const emotion = s.emotion || '未指定';
      const duration = s.duration || s.shotDuration || '未指定';
      const camera = s.camera?.move || s.cameramove || s.camera || '未指定';
      const desc = s.description || s.scene || s.content || '';
      return `[${id}] 类型:${type} | 情绪:${emotion} | 时长:${duration}s | 运镜:${camera}\n    描述:${String(desc).substring(0, 120)}${String(desc).length > 120 ? '...' : ''}`;
    }).join('\n\n');
  }
  
  _serializePrompts(prompts) {
    if (!prompts || prompts.length === 0) return '无Prompt数据';
    return prompts.map((p, i) => {
      const id = p.shotId || p.id || `S${String(i).padStart(2, '0')}`;
      const text = p.prompt || p._generatedPrompt || p.text || '';
      return `[${id}] ${String(text).substring(0, 200)}${String(text).length > 200 ? '...' : ''}`;
    }).join('\n\n');
  }
  
  _serializeDialogue(dialogue) {
    if (!dialogue) return '无台词数据';
    if (typeof dialogue === 'string') return dialogue.substring(0, 500);
    if (Array.isArray(dialogue)) {
      return dialogue.map((d, i) => {
        const speaker = d.speaker || d.character || '未知';
        const text = d.text || d.content || d.line || '';
        return `[${speaker}] ${text}`;
      }).join('\n');
    }
    // 对象格式（如 {S01: [...], S02: [...]}）
    if (typeof dialogue === 'object') {
      return Object.entries(dialogue).map(([key, val]) => {
        if (Array.isArray(val)) {
          return `[${key}]\n${val.map(d => `  [${d.speaker||d.character||'未知'}] ${d.text||d.content||d.line||''}`).join('\n')}`;
        }
        return `[${key}] ${typeof val === 'string' ? val : JSON.stringify(val).substring(0, 100)}`;
      }).join('\n\n');
    }
    return String(dialogue).substring(0, 200);
  }
  
  _fallbackParseLLMOutput(content) {
    // 容错解析：从文本中提取评分和issue
    const result = {
      dimensions: { story: { score: 3, issues: [] }, continuity: { score: 3, issues: [] }, visual: { score: 3, issues: [] }, style: { score: 3, issues: [] } },
      totalScore: 3,
      recommendations: []
    };
    
    // 尝试匹配评分
    const scoreMatches = content.match(/(?:story|故事性).*?(\d\.?\d*)/i);
    if (scoreMatches) result.dimensions.story.score = parseFloat(scoreMatches[1]);
    
    const contMatches = content.match(/(?:continuity|连贯性).*?(\d\.?\d*)/i);
    if (contMatches) result.dimensions.continuity.score = parseFloat(contMatches[1]);
    
    const visualMatches = content.match(/(?:visual|视觉).*?(\d\.?\d*)/i);
    if (visualMatches) result.dimensions.visual.score = parseFloat(visualMatches[1]);
    
    const styleMatches = content.match(/(?:style|风格).*?(\d\.?\d*)/i);
    if (styleMatches) result.dimensions.style.score = parseFloat(styleMatches[1]);
    
    // 计算总分
    result.totalScore = this._calculateLLMTotalScore(result.dimensions);
    
    // 提取所有提到的问题作为通用issue
    const issueMatches = content.match(/(?:issue|问题|缺陷|不足).*?(?:\n|$)/gi);
    if (issueMatches) {
      const genericIssues = issueMatches.map(m => ({
        severity: 'moderate',
        description: m.replace(/^(issue|问题|缺陷|不足)[:：]?\s*/i, '').trim(),
        suggestion: '需根据具体问题优化'
      }));
      result.dimensions.story.issues = genericIssues.slice(0, 2);
      result.dimensions.continuity.issues = genericIssues.slice(2, 4);
      result.dimensions.visual.issues = genericIssues.slice(4, 6);
      result.dimensions.style.issues = genericIssues.slice(6, 8);
    }
    
    return result;
  }
  
  _calculateLLMTotalScore(dimensions) {
    const w = this.options.weights;
    const story = dimensions.story?.score || 3;
    const continuity = dimensions.continuity?.score || 3;
    const visual = dimensions.visual?.score || 3;
    const style = dimensions.style?.score || 3;
    return Math.round((w.story * story + w.continuity * continuity + w.visual * visual + w.style * style) * 10) / 10;
  }
  
  _inferIssueType(description) {
    const d = (description || '').toLowerCase();
    if (/emotion|feeling|mood|arc|narrative|story|plot|character/i.test(d)) return 'story';
    if (/transition|continuity|scale|jump|match|cut/i.test(d)) return 'continuity';
    if (/camera|shot|frame|composition|lighting|visual|color/i.test(d)) return 'visual';
    if (/style|consistent|uniform|tone|drift/i.test(d)) return 'style';
    return 'story';
  }

  /**
   * 🆕 v1.3-Peng-fix: 问题分类器 - 将审片问题分类为自动修复类型
   */
  _classifyIssuesForAutoFix(issues) {
    const classified = [];
    for (const issue of issues) {
      const desc = (issue.description || issue.suggestion || '').toLowerCase();
      let fixType = 'content_rewrite'; // 默认：内容改写
      let priority = 'P2';

      if (/duration|时长|长度|太短|不够|时间/i.test(desc)) {
        fixType = 'duration_adjust';
        priority = 'P1';
      } else if (/dialogue|台词|对白|独白|说话/i.test(desc)) {
        fixType = 'dialogue_reconstruct';
        priority = 'P1';
      } else if (/transition|转场|衔接|跳跃|割裂/i.test(desc)) {
        fixType = 'transition_design';
        priority = 'P0';
      } else if (/style|风格|色调|光影|统一|漂移/i.test(desc)) {
        fixType = 'style_calibrate';
        priority = 'P1';
      } else if (/structure|结构|顺序|重组|叙事/i.test(desc)) {
        fixType = 'structure_reorder';
        priority = 'P0';
      } else if (/prompt|提示词|描述|画面|镜头/i.test(desc)) {
        fixType = 'prompt_enhance';
        priority = 'P1';
      }

      classified.push({
        originalIssue: issue,
        fixType,
        priority,
        autoFixable: ['content_rewrite', 'prompt_enhance', 'dialogue_reconstruct', 'style_calibrate', 'duration_adjust'].includes(fixType)
      });
    }

    // 按优先级排序
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2 };
    classified.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return classified;
  }

  /**
   * 🆕 v1.3-Peng-fix: 生成自动修复指令
   */
  _generateAutoFixInstructions(classifiedIssues) {
    const instructions = [];
    for (const item of classifiedIssues) {
      if (!item.autoFixable) continue;

      const { fixType, originalIssue } = item;
      const shotIds = originalIssue.relatedShots || [];

      switch (fixType) {
        case 'prompt_enhance':
          instructions.push({
            type: 'expand_prompt',
            target: shotIds,
            reason: originalIssue.description,
            strategy: 'add_visual_details',
            params: { minLength: 4500, maxLength: 5500 }
          });
          break;
        case 'dialogue_reconstruct':
          instructions.push({
            type: 'rebuild_dialogue',
            target: shotIds,
            reason: originalIssue.description,
            strategy: 'convert_monologue_to_dialogue',
            params: { maxLines: 3 }
          });
          break;
        case 'style_calibrate':
          instructions.push({
            type: 'unify_style',
            target: 'all',
            reason: originalIssue.description,
            strategy: 'extract_dominant_tone_and_apply',
            params: { toneKeywords: ['warm', 'cool', 'dramatic', 'soft'] }
          });
          break;
        case 'duration_adjust':
          instructions.push({
            type: 'reallocate_duration',
            target: 'all',
            reason: originalIssue.description,
            strategy: 'scale_to_target_total',
            params: { targetTotal: 60 }
          });
          break;
      }
    }

    return instructions;
  }
}

module.exports = DirectorOptimizeAgent;