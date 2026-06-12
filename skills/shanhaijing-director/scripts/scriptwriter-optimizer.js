#!/usr/bin/env node
/**
 * 编剧优化Agent v1.3-Peng (ShanhaiStory Forge)
 *
 * v1.3-Peng 更新（2026-05-31）- 系统级机制，非单次补丁：
 * - 🆕 Prompt长度闭环校验机制: 编剧Agent输出后自动校验字符数，不足1200自动LLM扩写/本地扩写，超过1500智能截断
 * - 循环最多3次，仍不达标报告制片人决策
 * - 适用所有主题（刑天/烛龙/帝江/任何新主题），通用机制
 * - 扩写策略: LLM优先补充高质量视觉细节(材质/光影/微粒)，降级到本地地质质感词库
 * - 截断策略: 删除冗余形容词→删除重复空格→截断到最近分隔符，保留6层字段结构
 * 
 * v1.2-Peng 更新（2026-05-31）：
 * - 字段结构保留: systemPrompt新增7条约束，强制保留Dialogue/Character/Scene/Mood/Camera/Lighting分层
 * - 字符数硬性约束: 1200-1500字符，利用率80%-99%
 * - 反垃圾填充: 禁止无意义重复词汇，每个词必须服务视觉叙事
 * - maxTokens解除: 8192→128000，匹配百万级上下文模型
 * 
 * v1.1-Peng 更新（2026-05-29）：
 * - 🆕 LLM真实调用集成完成
 *   - 引入 LLMCaller，temperature 0.4（略高于审片0.3，优化需要创造力）
 *   - optimize() 改为 async，先尝试 _optimizeWithLLM(context)，失败降级到 _optimizeWithRules(context)
 *   - 新增 _optimizeWithLLM：编剧优化系统提示词（资深电影编剧，五类修改）
 *   - 五类修改：结构/内容/转场/台词/风格，要求严格JSON输出
 *   - 输出格式：optimizedShots/optimizedPrompts/optimizedDialogue/changes/consistencyPassed
 *   - 新增4个LLM辅助序列化方法：_serializeIssues/_serializeShots/_serializePrompts/_serializeDialogue
 *   - 数据格式兼容：支持dialogue数组和对象（场景号索引）格式
 *   - 降级保护：LLM调用失败时自动降级到规则引擎
 * 
 * v1.0-Peng 原始功能：
 * - 输入:审片报告 + 原始剧本 + 参考档案
 * - 输出:优化后完整剧本 + 变更摘要
 * - 只优化不决策:优化方向完全由审片报告确定
 * - 一体化修改协议:始终以完整剧本为对象,局部修改后立即全局一致性检查
 *
 * 五类修改操作:
 * 1. 结构调整:镜头顺序重组、节奏控制
 * 2. 内容改写:单镜头描述重写
 * 3. 转场设计:相邻镜头过渡方案
 * 4. 台词重构:跨镜头台词关联重建
 * 5. 风格校准:全片运镜/光影/情绪统一
 *
 * 版本: v1.3-Peng-fix1 | 2026-05-31
 * 所属系统: ShanhaiStory Forge v2.36-Peng-fix
 */

const { createLLMCaller } = require('./llm-caller');
const PromptLengthOptimizer = require('./prompt-length-optimizer');
const PromptFieldStandard = require('./prompt-field-standard');

class ScriptwriterOptimizer {
  constructor(options = {}) {
    this.version = '1.3-Peng';
    this.options = {
      maxChangesPerIteration: 20,  // 每轮最多修改点位数
      preservePromptLength: true,  // 保持提示词长度在限制内
      promptMaxLength: 980,        // v6.11-Peng-fix4: 从1650改为980字符（大鹏规则）
      ...options
    };

    // LLM调用器(真实推理)
    this.llmCaller = createLLMCaller({
      temperature: 0.4,  // 略高于审片,优化需要一定创造力
      maxTokens: 128000,
      timeout: 600000  // 🆕 v6.3-Peng-fix: 10分钟超长超时，编剧优化需要重度推理
    });

    // 变更追踪
    this.changeLog = [];
    this.version = 0;
  }

  /**
   * 主入口:执行编剧优化
   * v1.1-Peng: 集成LLM真实推理,失败时降级到规则引擎
   * @param {Object} context - 包含 reviewReport, storyPlan, shots, prompts, dialogue
   * @returns {Object} 优化结果
   */
  async optimize(context) {
    const { reviewReport, storyPlan, shots, prompts, dialogue } = context;

    console.log(`[ScriptwriterOptimizer v${this.version}] 开始优化:${storyPlan?.title || 'Untitled'}`);
    console.log(`[ScriptwriterOptimizer] 审片评分:${reviewReport?.overallScore?.toFixed(1) || 'N/A'}/5.0 | 问题数:${reviewReport?.issueList?.length || 0}`);

    // 重置变更日志
    this.changeLog = [];
    this.version++;

    // 🆕 v1.1-Peng: 优先使用LLM真实推理进行编剧优化
    try {
      console.log(`[ScriptwriterOptimizer] 🧠 调用LLM进行真实推理优化...`);
      const llmResult = await this._optimizeWithLLM(context);
      console.log(`[ScriptwriterOptimizer] ✅ LLM优化完成:变更数${llmResult.changesSummary?.length || 0}`);
      return llmResult;
    } catch (error) {
      console.warn(`[ScriptwriterOptimizer] ⚠️ LLM优化失败(${error.message}),降级到规则引擎...`);
      return this._optimizeWithRules(context);
    }
  }

  /**
   * LLM真实推理优化
   */
  async _optimizeWithLLM(context) {
    const { reviewReport, storyPlan, shots, prompts, dialogue } = context;

    const systemPrompt = `你是一位资深电影编剧，拥有15年剧本修改经验。你的任务是根据导演优化报告，对视频镜头脚本进行专业优化。

🎬 导演风格DNA（${reviewReport?.directorStyle || 'cameron'}）：
${(() => {
  const styleLib = require('./director-style-library');
  const lib = new styleLib();
  const style = lib.loadStyle(reviewReport?.directorStyle || 'cameron');
  return `- 叙事结构: ${style.preferences.narrativeStructure}
- 运镜风格: ${style.preferences.motionStyle}
- 光影风格: ${style.preferences.lightingStyle}
- 色调偏好: ${style.preferences.colorTone}
- 情绪基调: ${style.preferences.emotionTone}
- 风格描述: ${style.description}`;
})()}

在优化镜头脚本时，请严格遵循以上导演风格的审美标准。

关键约束（不可违反）：
1. 字段结构保留：每个镜头的Prompt必须保留原有字段分层结构，包含以下字段（按顺序）：
   - Dialogue: 角色台词与声音表演（最高优先级保留）
   - Character: 角色外貌、服装、配饰锚点描述
   - Scene: 场景环境、地形、生态、大气描述
   - Mood: 情绪氛围关键词（精简为3-5个关键词，避免长句）
   - Camera: 运镜方式、景别、镜头运动（保留核心运镜词，删除速度修饰）
   - Lighting: 光影方案、时间阶段、光照方向（保留核心光位，删除修饰词）
   禁止将所有字段合并为一个混乱的段落。
2. 字符数严格控制：每个镜头的Prompt长度必须在900-990字符之间（利用率90%-99%，v6.11-Peng-fix4统一大鹏字符数规则）。
   - 生成时主动控制字数，每个字段分配合理长度：
     - Dialogue: ≤90字符
     - Character: ≤90字符
     - Scene: ≤120字符
     - Mood: ≤40字符（关键词形式）
     - Camera: ≤90字符
     - Lighting: ≤60字符
   - 如果原始Prompt长度在此范围内，保持长度不变，只做质量优化。
   - 如果原始Prompt长度不足900字符，通过增加高质量视觉细节扩充到900+。
   - 绝对禁止超过990字符。
   - 生成完成后自行检查字数，如果超出则精简Mood和Lighting字段，保留Dialogue/Character/Scene。
3. 禁止垃圾填充：禁止为了凑字数添加无意义的重复词汇（如"very very beautiful"、"extremely extremely detailed"）。
   每个新增词汇必须服务于视觉叙事——提供具体的可拍摄信息（动作、光影、材质、构图）。
4. 一体化修改：始终以完整剧本为对象，局部修改后立即全局一致性检查。
5. 只优化不决策：优化方向完全由审片报告确定，不擅自改变故事主题。
6. 五类修改操作：结构调整、内容改写、转场设计、台词重构、风格校准。
7. 每次修改必须记录变更点(change log)。

字数控制技巧：
- 用具体名词替代形容词（如"粗糙多孔的火山岩"替代"非常粗糙的岩石"）
- 用关键词列表替代长句（Mood字段用"神秘、史诗、敬畏"替代"氛围充满了神秘感和史诗般的敬畏"）
- 删除冗余修饰词（如"极其"、"非常"、"绝对"等）
- 保留核心视觉信息，删除抽象描述

输出格式：必须返回严格的JSON
{
  "optimizedShots": [...],
  "optimizedPrompts": [
    {
      "shotId": "S00",
      "prompt": "字段化Prompt文本，长度900-990字符，保留Dialogue/Character/Scene/Mood/Camera/Lighting结构"
    }
  ],
  "optimizedDialogue": [...],
  "changes": [...],
  "consistencyPassed": true
}`
    const userPrompt = `请根据以下导演优化报告，优化镜头脚本。\n\n## 审片报告\n评分:${reviewReport?.overallScore?.toFixed(1) || 'N/A'}/5.0\n问题数:${reviewReport?.issueList?.length || 0}\n\n问题清单:\n${this._serializeIssues(reviewReport?.issueList)}\n\n## 原始剧本\n标题:${storyPlan?.title || 'Untitled'}\n\n### 镜头列表\n${this._serializeShots(shots)}\n\n### 完整Prompt（含字段结构：Dialogue | Character | Scene | Mood | Camera | Lighting）\n${this._serializePrompts(prompts)}\n\n### 台词/角色台词\n${this._serializeDialogue(dialogue)}\n\n## 优化要求\n1. 每个镜头的Prompt必须保留字段结构（Dialogue/Character/Scene/Mood/Camera/Lighting），禁止扁平化合并\n2. 每个Prompt长度严格控制在900-990字符，利用率90%-99%（v6.11-Peng-fix4统一大鹏字符数规则）\n3. 禁止垃圾填充，每个词必须提供具体视觉信息\n4. 基于导演报告的问题进行针对性优化\n\n请严格按照JSON格式返回优化后的完整剧本。`

    const result = await this.llmCaller.callJSON(systemPrompt, userPrompt, {
      temperature: 0.4,
      maxTokens: 128000
    });

    // 解析LLM输出
    let llmResult;
    try {
      if (result.parsedJSON) {
        llmResult = result.parsedJSON;
      } else {
        throw new Error(result.parseError || 'JSON解析失败');
      }
    } catch (parseError) {
      console.warn(`[ScriptwriterOptimizer] LLM输出JSON解析失败,降级到规则引擎: ${parseError.message}`);
      throw parseError; // 抛出让外层降级
    }

    // 组装结果(兼容原有格式)
    const optimized = {
      storyPlan: storyPlan, // 保持原storyPlan(LLM不修改故事大纲)
      shots: llmResult.optimizedShots || shots,
      prompts: llmResult.optimizedPrompts || prompts,
      dialogue: llmResult.optimizedDialogue || dialogue
    };

    // 🆕 v1.3-Peng: Prompt长度闭环校验机制
    // 编剧Agent输出后，自动校验每个Prompt字符数，不达标则自动扩写/截断
    // 循环最多3次，仍不达标则报告给制片人决策
    const lengthCheck = await this._enforcePromptLengthLoop(optimized.prompts);
    if (!lengthCheck.allPassed) {
      console.warn(`[ScriptwriterOptimizer] ⚠️ 长度闭环校验: ${lengthCheck.summary.fail}个Prompt未达标，已尽力修复`);
    }

    // 🆕 v1.3-Peng-fix: 持久化优化后的Prompt到04-prompts/，确保下游Stage读取最新数据
    if (context.productionDir) {
      await this.persistOptimizedPrompts(optimized.prompts, context.productionDir);
    }

    // 将LLM changes转换为changeLog格式
    this.changeLog = (llmResult.changes || []).map((c, i) => ({
      id: `llm-${i}`,
      type: c.type || '内容改写',
      description: c.description || '未描述',
      reason: c.reason || '审片问题驱动',
      severity: c.severity || 'moderate',
      before: c.before || '原始版本',
      after: c.after || '优化版本'
    }));

    return {
      version: this.version,
      optimizedScript: optimized,
      changesSummary: this.changeLog,
      consistencyCheck: { passed: llmResult.consistencyPassed !== false, issues: [] },
      qualityEstimate: this._estimateQuality(reviewReport, { passed: llmResult.consistencyPassed !== false }),
      timestamp: new Date().toISOString(),
      llmCall: {
        duration: result.duration,
        tokenUsage: result.tokenUsage,
        callId: result.callId
      }
    };
  }

  /**
   * 🆕 v1.3-Peng-fix: 持久化优化后的Prompt到04-prompts/
   * 编剧Agent修改后的Prompt必须写回文件，否则下游Stage读取旧数据
   */
  async persistOptimizedPrompts(prompts, productionDir) {
    if (!prompts || !productionDir) {
      console.warn('[ScriptwriterOptimizer] ⚠️ 无法持久化:缺少prompts或productionDir');
      return false;
    }

    const fs = require('fs');
    const path = require('path');
    const promptsDir = path.join(productionDir, '04-prompts');
    
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }

    let writeCount = 0;
    for (const prompt of prompts) {
      const shotId = prompt.shotId || prompt.id;
      if (!shotId) continue;
      
      const promptText = prompt.prompt || prompt._generatedPrompt || '';
      if (!promptText) continue;

      const filePath = path.join(promptsDir, `${shotId}-prompt.md`);
      const content = `# ${shotId} Prompt\n\n\`\`\`\n${promptText}\n\`\`\`\n`;
      
      fs.writeFileSync(filePath, content, 'utf8');
      writeCount++;
    }

    console.log(`[ScriptwriterOptimizer] 💾 已持久化 ${writeCount}/${prompts.length} 个Prompt到 ${promptsDir}`);
    return writeCount > 0;
  }

  /**
   * 规则引擎优化(降级方案)
   */
  _optimizeWithRules(context) {
    const { reviewReport, storyPlan, shots, prompts, dialogue } = context;

    // 重置变更日志
    this.changeLog = [];
    this.version++;

    // 1. 解析问题并排序
    const issues = this._parseIssues(reviewReport);

    // 2. 按优先级分层执行:叙事层 → 台词层 → 分镜层 → 风格层
    let optimized = { storyPlan, shots, prompts, dialogue };

    // 2.1 叙事层修复(P0致命 + P1严重中的结构问题)
    const structuralIssues = issues.filter(i =>
      i.severity === 'fatal' ||
      (i.severity === 'severe' && i.operations?.includes('结构调整'))
    );
    if (structuralIssues.length > 0) {
      optimized = this._fixStructure(optimized, structuralIssues);
    }

    // 2.2 台词层重构(台词发散问题)
    const dialogueIssues = issues.filter(i =>
      i.type === 'story' && i.operations?.includes('台词重构')
    );
    if (dialogueIssues.length > 0) {
      optimized = this._reconstructDialogue(optimized, dialogueIssues);
    }

    // 2.3 转场层设计(转场断裂问题)
    const transitionIssues = issues.filter(i =>
      i.type === 'continuity' && i.operations?.includes('转场设计')
    );
    if (transitionIssues.length > 0) {
      optimized = this._designTransitions(optimized, transitionIssues);
    }

    // 2.4 分镜层优化(内容改写)
    const contentIssues = issues.filter(i =>
      i.operations?.includes('内容改写')
    );
    if (contentIssues.length > 0) {
      optimized = this._rewriteContent(optimized, contentIssues);
    }

    // 2.5 风格层校准(风格漂移问题)
    const styleIssues = issues.filter(i =>
      i.type === 'style' || i.operations?.includes('风格校准')
    );
    if (styleIssues.length > 0) {
      optimized = this._calibrateStyle(optimized, styleIssues);
    }

    // 3. 全剧本一致性检查
    const consistencyCheck = this._checkConsistency(optimized, reviewReport);

    // 4. 生成输出
    const result = {
      version: this.version,
      optimizedScript: optimized,
      changesSummary: this._generateChangesSummary(),
      consistencyCheck: consistencyCheck,
      qualityEstimate: this._estimateQuality(reviewReport, consistencyCheck),
      timestamp: new Date().toISOString()
    };

    console.log(`[ScriptwriterOptimizer] 优化完成:变更数${this.changeLog.length} | 一致性检查:${consistencyCheck.passed ? '通过' : '未通过'}`);

    return result;
  }

  // ====== 修改操作1:结构调整 ======
  _fixStructure(optimized, issues) {
    const { shots, prompts } = optimized;

    issues.forEach(issue => {
      if (issue.type === 'continuity' && issue.description.includes('景别')) {
        // 景别跳跃问题:尝试插入过渡镜头或调整顺序
        const related = issue.relatedShots || [];
        if (related.length >= 2) {
          const shotA = shots.find(s => s.id === related[0]);
          const shotB = shots.find(s => s.id === related[1]);

          if (shotA && shotB) {
            // 在shotA和shotB之间插入一个过渡镜头描述
            const transitionPrompt = this._generateTransitionPrompt(shotA, shotB);

            // 创建过渡镜头
            const transitionShot = {
              id: `${related[0]}_${related[1]}_bridge`,
              type: 'transition',
              duration: 3, // 过渡镜头3秒
              camera: { move: 'slow_push', scale: this._intermediateScale(shotA, shotB) },
              emotion: 'neutral',
              description: transitionPrompt,
              isGenerated: true // 标记为自动生成
            };

            // 插入到shots数组中
            const idxA = shots.indexOf(shotA);
            if (idxA >= 0) {
              shots.splice(idxA + 1, 0, transitionShot);
              this._logChange('结构调整', `插入过渡镜头 ${transitionShot.id} 在 ${related[0]}→${related[1]} 之间`, [related[0], related[1]]);
            }
          }
        }
      }
    });

    return optimized;
  }

  // ====== 修改操作2:台词重构 ======
  _reconstructDialogue(optimized, issues) {
    const { shots, dialogue } = optimized;

    // 重构策略:将独白转换为问-答对话回合
    if (dialogue && dialogue.script) {
      const lines = dialogue.script;

      // 检测独白序列(连续3句以上无回应关系)
      let monologueStart = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const hasResponse = this._hasResponseRelation(line, lines.slice(0, i));

        if (!hasResponse && monologueStart === -1) {
          monologueStart = i;
        } else if (hasResponse && monologueStart !== -1) {
          // 结束独白序列,重构为对话
          if (i - monologueStart >= 2) {
            this._convertMonologueToDialogue(lines, monologueStart, i - 1);
            this._logChange('台词重构', `将独白序列(${monologueStart}-${i-1})重构为对话回合`, lines.slice(monologueStart, i).map(l => l.shotId));
          }
          monologueStart = -1;
        }
      }
    }

    // 为每个镜头注入关联性台词提示
    shots.forEach((shot, idx) => {
      if (idx > 0 && shot._dialogueMetadata) {
        const prevShot = shots[idx - 1];
        const prevDialogue = prevShot?._dialogueMetadata;

        if (prevDialogue && shot._dialogueMetadata) {
          // 添加"回应前镜"的元数据标记
          shot._dialogueMetadata.continuityNote = `Responds to ${prevShot.id}: ${prevDialogue.speaker} said "${prevDialogue.text?.substring(0, 50)}..."`;
          this._logChange('台词重构', `为 ${shot.id} 添加跨镜头台词关联标记`, [shot.id]);
        }
      }
    });

    return optimized;
  }

  // ====== 修改操作3:转场设计 ======
  _designTransitions(optimized, issues) {
    const { shots, prompts } = optimized;

    issues.forEach(issue => {
      if (issue.relatedShots && issue.relatedShots.length >= 2) {
        const shotA = shots.find(s => s.id === issue.relatedShots[0]);
        const shotB = shots.find(s => s.id === issue.relatedShots[1]);

        if (shotA && shotB) {
          // 在prompt中注入过渡指令
          const promptA = prompts.find(p => p.shotId === shotA.id || p.id === shotA.id);
          const promptB = prompts.find(p => p.shotId === shotB.id || p.id === shotB.id);

          if (promptB) {
            const transitionInstruction = this._generateTransitionInstruction(shotA, shotB, issue);
            const originalPrompt = promptB.prompt || promptB._generatedPrompt || '';

            // 在prompt开头添加过渡指令(确保被保留)
            promptB.prompt = `[TRANSITION: ${transitionInstruction}] ${originalPrompt}`;
            promptB._generatedPrompt = promptB.prompt;

            this._logChange('转场设计', `为 ${shotB.id} 添加过渡指令:${transitionInstruction}`, [shotA.id, shotB.id]);
          }
        }
      }
    });

    return optimized;
  }

  // ====== 修改操作4:内容改写 ======
  _rewriteContent(optimized, issues) {
    const { shots, prompts } = optimized;

    issues.forEach(issue => {
      const shotIds = issue.relatedShots || [];
      shotIds.forEach(shotId => {
        const prompt = prompts.find(p => p.shotId === shotId || p.id === shotId);
        if (prompt) {
          const originalPrompt = prompt.prompt || prompt._generatedPrompt || '';

          // 根据问题类型注入修正内容
          let modifiedPrompt = originalPrompt;

          if (issue.description.includes('运镜-叙事错配')) {
            // 添加叙事动机描述
            modifiedPrompt = this._injectNarrativeMotivation(modifiedPrompt, issue);
          }

          if (issue.description.includes('脱离叙事')) {
            // 添加角色动作与情感反应
            modifiedPrompt = this._injectCharacterAction(modifiedPrompt, issue);
          }

          if (modifiedPrompt !== originalPrompt) {
            prompt.prompt = modifiedPrompt;
            prompt._generatedPrompt = modifiedPrompt;
            this._logChange('内容改写', `修改 ${shotId} 的prompt内容:${issue.description.substring(0, 50)}...`, [shotId]);
          }
        }
      });
    });

    return optimized;
  }

  // ====== 修改操作5:风格校准 ======
  _calibrateStyle(optimized, issues) {
    const { shots, prompts } = optimized;

    // 确定统一的运镜风格(取占比最高的风格)
    const styles = shots.map(s => this._classifyCameraStyle(s.camera?.move || s.cameramove || '')).filter(Boolean);
    const styleCounts = {};
    styles.forEach(s => { styleCounts[s] = (styleCounts[s] || 0) + 1; });
    const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'tracking';

    // 统一所有镜头到主导风格(只改漂移严重的镜头)
    issues.filter(i => i.type === 'style').forEach(issue => {
      const shotIds = issue.relatedShots || [];
      shotIds.forEach(shotId => {
        const shot = shots.find(s => s.id === shotId);
        const prompt = prompts.find(p => p.shotId === shotId || p.id === shotId);

        if (shot && prompt) {
          const currentStyle = this._classifyCameraStyle(shot.camera?.move || shot.cameramove || '');
          if (currentStyle !== dominantStyle && currentStyle !== 'mixed') {
            // 将运镜风格统一化
            const unifiedMove = this._unifyCameraMove(shot.camera?.move || shot.cameramove || '', dominantStyle);
            shot.camera = { ...shot.camera, move: unifiedMove };
            shot.cameramove = unifiedMove;

            // 在prompt中替换运镜关键词
            const originalPrompt = prompt.prompt || prompt._generatedPrompt || '';
            const unifiedPrompt = this._replaceCameraMoveInPrompt(originalPrompt, unifiedMove);
            prompt.prompt = unifiedPrompt;
            prompt._generatedPrompt = unifiedPrompt;

            this._logChange('风格校准', `将 ${shotId} 的运镜统一为 ${dominantStyle} 风格:${unifiedMove}`, [shotId]);
          }
        }
      });
    });

    // 统一光影色调
    const lightingIssues = issues.filter(i => i.description.includes('光影色调'));
    if (lightingIssues.length > 0) {
      // 提取主光源色调(取第一个镜头的色调作为基准)
      const basePrompt = prompts[0]?.prompt || prompts[0]?._generatedPrompt || '';
      const baseTone = this._extractLightingTone(basePrompt);

      if (baseTone) {
        prompts.forEach((prompt, idx) => {
          const originalPrompt = prompt.prompt || prompt._generatedPrompt || '';
          const currentTone = this._extractLightingTone(originalPrompt);

          if (currentTone && currentTone !== baseTone && idx > 0) {
            // 添加色调统一标记
            const toneInstruction = `consistent ${baseTone} lighting tone with previous scene,`;
            prompt.prompt = this._injectAfterDimension(originalPrompt, toneInstruction);
            prompt._generatedPrompt = prompt.prompt;
            this._logChange('风格校准', `统一 ${prompt.shotId || prompt.id} 的光影色调为 ${baseTone}`, [prompt.shotId || prompt.id]);
          }
        });
      }
    }

    return optimized;
  }

  // ====== 全剧本一致性检查 ======
  _checkConsistency(optimized, reviewReport) {
    const { shots, prompts } = optimized;
    const errors = [];

    // 1. 检查镜头顺序是否仍然合理(起承转合)
    if (shots && shots.length > 0) {
      const firstShot = shots[0];
      const lastShot = shots[shots.length - 1];

      if (!firstShot.type || firstShot.type !== 'opening_title') {
        // 检查第一个镜头是否为开场
        if (!firstShot.emotion || !['epic_reveal', 'peaceful', 'curious'].includes(firstShot.emotion)) {
          errors.push('首镜头情绪不是开场型,叙事起点可能不当');
        }
      }
    }

    // 2. 检查提示词长度是否超限
    if (prompts) {
      prompts.forEach(p => {
        const prompt = p.prompt || p._generatedPrompt || '';
        const charCount = this._countChars(prompt);
        if (charCount > this.options.promptMaxLength) {
          errors.push(`${p.shotId || p.id} 的提示词长度(${charCount}字符)超过上限(${this.options.promptMaxLength})`);
        }
      });
    }

    // 3. 检查是否有新增镜头缺少必要字段
    if (shots) {
      shots.forEach(s => {
        if (s.isGenerated) {
          if (!s.duration || !s.camera) {
            errors.push(`${s.id} 为自动生成的过渡镜头,但缺少duration或camera字段`);
          }
        }
      });
    }

    // 4. 检查台词关联是否建立
    if (shots) {
      const dialogueShots = shots.filter(s => s._dialogueMetadata);
      const unlinkedShots = dialogueShots.filter(s => !s._dialogueMetadata?.continuityNote);
      if (unlinkedShots.length > 0 && dialogueShots.length > 2) {
        errors.push(`${unlinkedShots.length}个镜头台词未建立跨镜头关联`);
      }
    }

    return {
      passed: errors.length === 0,
      errors: errors,
      errorCount: errors.length
    };
  }

  // ====== 辅助方法 ======

  _parseIssues(reviewReport) {
    if (!reviewReport || !reviewReport.issueList) return [];

    return reviewReport.issueList.map(issue => ({
      ...issue,
      operations: issue.suggestion ? this._inferOperations(issue) : []
    }));
  }

  _inferOperations(issue) {
    const ops = [];
    const desc = (issue.description || '').toLowerCase();
    const suggestion = (issue.suggestion || '').toLowerCase();

    if (desc.includes('景别') || desc.includes('转场') || suggestion.includes('过渡')) {
      ops.push('结构调整', '转场设计');
    }
    if (desc.includes('台词') || desc.includes('独白') || suggestion.includes('对话')) {
      ops.push('台词重构');
    }
    if (desc.includes('运镜') || desc.includes('风格') || suggestion.includes('统一')) {
      ops.push('风格校准', '内容改写');
    }
    if (desc.includes('叙事') || desc.includes('情节') || desc.includes('情绪')) {
      ops.push('结构调整', '内容改写');
    }
    if (desc.includes('镜头') || desc.includes('prompt') || desc.includes('画面')) {
      ops.push('内容改写');
    }

    return ops.length > 0 ? ops : ['内容改写'];
  }

  _generateTransitionPrompt(shotA, shotB) {
    const scaleA = shotA.camera?.scale || 'medium';
    const scaleB = shotB.camera?.scale || 'medium';
    return `Smooth transition from ${scaleA} to ${scaleB}, maintaining visual continuity and spatial logic`;
  }

  _intermediateScale(shotA, shotB) {
    const scaleMap = { 'ECU': 1, 'CU': 2, 'MCU': 3, 'MS': 4, 'FS': 5, 'LS': 6, 'ELS': 7 };
    const a = scaleMap[shotA.camera?.scale] || 4;
    const b = scaleMap[shotB.camera?.scale] || 4;
    const mid = Math.round((a + b) / 2);
    const reverseMap = { 1: 'ECU', 2: 'CU', 3: 'MCU', 4: 'MS', 5: 'FS', 6: 'LS', 7: 'ELS' };
    return reverseMap[mid] || 'MS';
  }

  _hasResponseRelation(currentLine, previousLines) {
    if (!currentLine || !previousLines || previousLines.length === 0) return false;

    const currentText = (currentLine.text || currentLine.line || '').toLowerCase();
    const prevText = (previousLines[previousLines.length - 1].text || previousLines[previousLines.length - 1].line || '').toLowerCase();

    // 简单启发式:问句后接陈述句 = 可能回应
    if (/\?$/i.test(prevText) && !/\?$/i.test(currentText)) return true;

    // 包含回应词
    const responseWords = ['yes', 'no', 'but', 'however', 'because', '回应', '回答', '可是', '但是', '因为', '所以'];
    if (responseWords.some(w => currentText.includes(w))) return true;

    return false;
  }

  _convertMonologueToDialogue(lines, start, end) {
    // 简化实现:在独白序列中标记为需要重构
    for (let i = start; i <= end; i++) {
      if (lines[i]) {
        lines[i]._needsDialogueRestructure = true;
        lines[i]._dialogueRole = (i % 2 === 0) ? 'question' : 'answer';
      }
    }
  }

  _generateTransitionInstruction(shotA, shotB, issue) {
    const desc = issue.description || '';

    if (desc.includes('叠化') || desc.includes('dissolve')) {
      return `Use dissolve transition from ${shotA.id} to ${shotB.id}, overlapping visual elements`;
    }
    if (desc.includes('淡入淡出') || desc.includes('fade')) {
      return `Use fade transition from ${shotA.id} to ${shotB.id}, gentle time/space shift`;
    }
    if (desc.includes('推') || desc.includes('push')) {
      return `Gradual push-in transition maintaining subject continuity`;
    }

    return `Smooth transition maintaining spatial and temporal continuity`;
  }

  _injectNarrativeMotivation(prompt, issue) {
    // 在prompt中添加叙事动机描述
    const motivation = `The camera movement serves the emotional narrative: `;
    return prompt + `, ${motivation}`;
  }

  _injectCharacterAction(prompt, issue) {
    // 注入角色动作与情感反应
    const action = `character reacts with natural micro-expressions and body language`;
    return prompt + `, ${action}`;
  }

  _classifyCameraStyle(move) {
    const m = (move || '').toLowerCase();
    if (/handheld|shake|run|jerk/i.test(m)) return 'handheld';
    if (/drone|aerial|orbit|flyover/i.test(m)) return 'aerial';
    if (/push|pull|dolly|track|follow/i.test(m)) return 'tracking';
    if (/pan|tilt|crane|boom/i.test(m)) return 'classical';
    if (/static|lock|fixed/i.test(m)) return 'static';
    return 'mixed';
  }

  _unifyCameraMove(move, targetStyle) {
    const m = (move || '').toLowerCase();

    const styleMap = {
      'tracking': ['tracking shot', 'push in', 'pull out', 'dolly'],
      'handheld': ['handheld follow', 'shaky cam', 'running camera'],
      'aerial': ['aerial orbit', 'drone shot', 'flyover'],
      'classical': ['slow pan', 'tilt', 'crane up'],
      'static': ['static shot', 'fixed camera', 'lock-off']
    };

    const moves = styleMap[targetStyle];
    if (moves) {
      // 找到最接近的映射
      if (/push|in|close/i.test(m)) return moves[1] || moves[0];
      if (/pull|out|away/i.test(m)) return moves[2] || moves[0];
      return moves[0];
    }

    return move;
  }

  _replaceCameraMoveInPrompt(prompt, newMove) {
    if (!prompt) return prompt;

    // 替换常见的运镜关键词
    const moves = ['tracking', 'panning', 'dolly', 'crane', 'push', 'pull', 'orbit', 'handheld', 'static', 'aerial'];
    let result = prompt;

    moves.forEach(m => {
      const regex = new RegExp(`\\b${m}\\w*`, 'gi');
      result = result.replace(regex, newMove);
    });

    return result;
  }

  _extractLightingTone(prompt) {
    if (!prompt) return null;
    const p = prompt.toLowerCase();
    if (/warm|golden|sunset|orange|amber|firelight|torch/i.test(p)) return 'warm';
    if (/cool|cold|blue|moonlight|twilight|dusk/i.test(p)) return 'cool';
    if (/harsh|high.contrast|dramatic|chiaroscuro|spotlight/i.test(p)) return 'dramatic';
    if (/soft|diffuse|even|flat|overcast|cloudy/i.test(p)) return 'soft';
    return 'neutral';
  }

  _injectAfterDimension(prompt, text) {
    if (!prompt) return text;

    // 在prompt的适当位置插入(尽量在场景描述之后)
    const sentences = prompt.split(/[.!?。!?]/);
    if (sentences.length > 2) {
      // 在第2句之后插入
      sentences.splice(2, 0, text);
      return sentences.join('. ');
    }

    return prompt + ', ' + text;
  }

  _logChange(type, description, relatedShots) {
    this.changeLog.push({
      type,
      description,
      relatedShots: Array.isArray(relatedShots) ? relatedShots : [relatedShots],
      timestamp: new Date().toISOString()
    });
  }

  _generateChangesSummary() {
    const summary = {
      totalChanges: this.changeLog.length,
      typeDistribution: {},
      affectedShots: new Set(),
      changes: this.changeLog
    };

    this.changeLog.forEach(c => {
      summary.typeDistribution[c.type] = (summary.typeDistribution[c.type] || 0) + 1;
      c.relatedShots.forEach(s => summary.affectedShots.add(s));
    });

    summary.affectedShots = Array.from(summary.affectedShots);
    summary.narrativeImpact = summary.affectedShots.length > 3 ? 'global' :
                              summary.affectedShots.length > 1 ? 'chapter' : 'local';

    return summary;
  }

  _estimateQuality(reviewReport, consistencyCheck) {
    if (!reviewReport) return { estimatedScore: 0, confidence: 0 };

    const baseScore = reviewReport.overallScore || 0;
    const improvement = this.changeLog.length * 0.1; // 每个变更约提升0.1分
    const consistencyBonus = consistencyCheck.passed ? 0.5 : 0;

    const estimated = Math.min(5, baseScore + improvement + consistencyBonus);
    const confidence = Math.min(1, 0.6 + (this.changeLog.length * 0.02));
    
    return { estimatedScore: estimated, confidence };
  }
  
  // ====== LLM辅助方法 ======

  _serializeIssues(issues) {
    if (!issues || issues.length === 0) return '无问题数据';
    return issues.slice(0, 20).map((issue, i) => {
      const severity = issue.severity || 'moderate';
      const type = issue.type || 'story';
      const desc = String(issue.description || issue.reason || '未描述');
      const suggest = String(issue.suggestion || issue.fix || '需优化');
      return `[${i+1}] [${severity}] ${type}: ${desc}\n    建议: ${suggest}`;
    }).join('\n\n');
  }

  _serializeShots(shots) {
    if (!shots || shots.length === 0) return '无镜头数据';
    return shots.map((s, i) => {
      const id = s.id || `S${String(i).padStart(2, '0')}`;
      const type = s.type || s.shotType || 'unknown';
      const emotion = s.emotion || '未指定';
      const duration = s.duration || s.shotDuration || '未指定';
      const camera = s.camera?.move || s.cameramove || s.camera || '未指定';
      const desc = String(s.description || s.scene || s.content || '');
      return `[${id}] 类型:${type} | 情绪:${emotion} | 时长:${duration}s | 运镜:${camera}\n    描述:${desc.substring(0, 100)}${desc.length > 100 ? '...' : ''}`;
    }).join('\n\n');
  }

  _serializePrompts(prompts) {
    if (!prompts || prompts.length === 0) return '无Prompt数据';
    return prompts.map((p, i) => {
      const id = p.shotId || p.id || `S${String(i).padStart(2, '0')}`;
      const text = String(p.prompt || p._generatedPrompt || p.text || '');
      return `[${id}] ${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`;
    }).join('\n\n');
  }

  _serializeDialogue(dialogue) {
    if (!dialogue) return '无台词数据';
    if (typeof dialogue === 'string') return dialogue.substring(0, 500);
    if (Array.isArray(dialogue)) {
      return dialogue.map((d, i) => {
        const speaker = d.speaker || d.character || '未知';
        const text = String(d.text || d.content || d.line || '');
        return `[${speaker}] ${text}`;
      }).join('\n');
    }
    // 对象格式（如 {S01: [...], S02: [...]}）
    if (typeof dialogue === 'object') {
      return Object.entries(dialogue).map(([key, val]) => {
        if (Array.isArray(val)) {
          return `[${key}]\n${val.map(d => `  [${d.speaker || d.character || '未知'}] ${String(d.text || d.content || d.line || '')}`).join('\n')}`;
        }
        return `[${key}] ${typeof val === 'string' ? val : JSON.stringify(val).substring(0, 100)}`;
      }).join('\n\n');
    }
    return String(dialogue).substring(0, 200);
  }

  // ====== 🆕 v1.3-Peng: Prompt长度闭环校验机制 ======
  // 编剧Agent输出后，自动校验每个Prompt字符数，不达标则自动扩写/截断
  // 循环最多3次，仍不达标则报告给制片人决策
  // 适用所有主题（刑天/烛龙/帝江/任何新主题），通用机制非单次补丁

  async _enforcePromptLengthLoop(prompts, maxRetries = 3) {
    console.log(`[ScriptwriterOptimizer] 调用PromptLengthOptimizer进行字数优化...`);
    
    // 使用独立的PromptLengthOptimizer处理字数约束
    const lengthOptimizer = new PromptLengthOptimizer({
      llmCaller: this.llmCaller,
      directorStyle: this.directorStyle,
      prdConstraints: '异兽视角叙事，James Cameron风格'
    });
    
    try {
      // 设置超时保护：如果60秒内未完成，降级到本地处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PromptLengthOptimizer超时(60s)，降级到本地处理')), 60000);
      });
      
      const optimizePromise = lengthOptimizer.optimize(prompts);
      
      // 竞速：LLM优化 vs 超时降级
      const result = await Promise.race([optimizePromise, timeoutPromise]).catch(err => {
        console.warn(`[ScriptwriterOptimizer] ${err.message}`);
        return null;
      });
      
      if (result && result.allPassed) {
        console.log(`[ScriptwriterOptimizer] PromptLengthOptimizer完成: ${result.prompts.length}/${result.prompts.length}通过`);
        return {
          results: result.prompts,
          allPassed: true,
          summary: { pass: result.prompts.length, acceptable: 0, fail: 0 }
        };
      }
      
      // 降级到本地处理（原有的_autoTrimPrompt/_autoExpandPrompt）
      console.warn(`[ScriptwriterOptimizer] PromptLengthOptimizer失败或未完全通过，降级到本地处理`);
      return this._legacyEnforcePromptLengthLoop(prompts, maxRetries);
      
    } catch (err) {
      console.error(`[ScriptwriterOptimizer] PromptLengthOptimizer异常: ${err.message}，降级到本地处理`);
      return this._legacyEnforcePromptLengthLoop(prompts, maxRetries);
    }
  }

  /**
   * 🆕 保留原有本地精简/扩写逻辑作为降级方案
   */
  async _legacyEnforcePromptLengthLoop(prompts, maxRetries = 3) {
    console.log(`[ScriptwriterOptimizer] 使用本地精简/扩写逻辑...`);
    const TARGET_MIN = 900;  // v6.11-Peng-fix4: 90% of 980
    const TARGET_MAX = 980;  // v6.11-Peng-fix4: 统一大鹏字符数规则上限
    
    for (const prompt of prompts) {
      const text = prompt.prompt || prompt._generatedPrompt || '';
      let current = text;
      let retry = 0;
      let status = 'pending';
      
      while (retry < maxRetries) {
        const len = this._countChars(current);
        
        if (len >= TARGET_MIN && len <= TARGET_MAX) {
          status = 'pass';
          break;
        }
        
        if (len < TARGET_MIN) {
          console.log(`[ScriptwriterOptimizer] ${prompt.shotId || prompt.id} 长度${len}字符不足${TARGET_MIN}，本地扩写(第${retry+1}次)...`);
          current = this._autoExpandPrompt(current, TARGET_MIN, prompt);
        } else if (len > TARGET_MAX) {
          console.log(`[ScriptwriterOptimizer] ${prompt.shotId || prompt.id} 长度${len}字符超过${TARGET_MAX}，本地截断(第${retry+1}次)...`);
          current = this._autoTrimPrompt(current, TARGET_MAX);
        }
        
        retry++;
      }
      
      prompt.prompt = current;
      prompt._generatedPrompt = current;
      
      results.push({
        shotId: prompt.shotId || prompt.id,
        originalLength: this._countChars(text),
        finalLength: this._countChars(current),
        retries: retry,
        status: status === 'pass' ? 'pass' : (this._countChars(current) >= TARGET_MIN ? 'acceptable' : 'fail'),
        action: this._countChars(current) < TARGET_MIN ? 'expanded' : (this._countChars(current) > TARGET_MAX ? 'trimmed' : 'unchanged')
      });
    }
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    
    console.log(`[ScriptwriterOptimizer] 本地长度闭环校验完成: ${passCount}/${results.length}通过, ${failCount}个失败`);
    
    return {
      results,
      allPassed: failCount === 0,
      summary: { pass: passCount, acceptable: results.filter(r => r.status === 'acceptable').length, fail: failCount }
    };
  }

  async _autoExpandPrompt(prompt, targetMin, promptObj) {
    // 使用LLM扩写，补充高质量视觉细节
    const systemPrompt = `你是一位专业电影视觉描述师。任务：在保留原有所有内容的前提下，为以下镜头Prompt扩充高质量视觉细节，使其字符数达到至少${targetMin}。
  
规则：
1. 绝对保留原有的Dialogue/Character/Scene/Mood/Camera/Lighting字段结构
2. 在Scene或Camera字段中补充：材质细节（岩石纹理、金属反光、纤维质感）、光影变化（高光移动、阴影渐变）、环境微粒（尘埃、孢子、能量粒子）
3. 禁止添加无意义的重复形容词（如"very very beautiful"、"extremely extremely detailed"）
4. 每个新增词汇必须提供具体的可拍摄信息
5. 禁止改变原始叙事内容和角色设定`;

    const userPrompt = `请扩充以下Prompt（当前${prompt.length}字符，目标≥${targetMin}字符）：\n\n${prompt}\n\n请返回扩充后的完整Prompt，保留所有字段结构。只返回Prompt文本，不要解释。`;

    try {
      const result = await this.llmCaller.call(systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 128000
      });
      
      const expanded = (result?.result || result?.content || '').trim();
      // 如果LLM返回的仍然不够，添加本地补充
      if (expanded.length < targetMin) {
        return this._localExpandPrompt(expanded || prompt, targetMin);
      }
      return expanded;
    } catch (error) {
      console.warn(`[ScriptwriterOptimizer] LLM扩写失败(${error.message})，使用本地扩写`);
      return this._localExpandPrompt(prompt, targetMin);
    }
  }

  _localExpandPrompt(prompt, targetMin) {
    // 本地扩写策略：添加通用高质量视觉细节（地质质感增强词库）
    const expansions = [
      '，光脉化尘埃在斜射光中显现为金色游丝轨迹',
      '，玄武岩柱状节理在阴影边缘清晰可见呈六边形垂直排列',
      '，岩石表面风化剥蚀形成的蜂窝状孔洞与垂直凹槽增加表面复杂度',
      '，微量石英与长石矿物结晶在裂缝中闪烁微弱反光',
      '，斜射光在凹凸表面形成明亮光影池与高光脊对比强烈',
      '，蓝绿色地衣与灰白微型苔藓在岩缝间点缀亮色',
      '，铁氧化物沉积形成赭红色矿脉纹理沿岩壁蜿蜒',
      '，沉积层理在流水侵蚀作用下裸露分层如翻开的地质史书'
    ];
    
    let current = prompt;
    let idx = 0;
    while (this._countChars(current) < targetMin && idx < expansions.length) {
      if (!current.includes(expansions[idx].substring(1, 20))) {
        current += expansions[idx];
      }
      idx++;
    }
    
    return current;
  }

  _autoTrimPrompt(prompt, targetMax) {
    // 🆕 v1.4-Peng-fix: 智能字段感知截断 — 保留核心字段结构，优先删除低优先级修饰语
    // 字段优先级（从高到低）：Dialogue > Character > Scene > Mood > Camera > Lighting
    // 截断策略：先删除冗余形容词→再精简Mood/Camera描述→最后截断Lighting
    
    let trimmed = prompt;
    
    // 策略1: 删除重复的空格和标点（无损）
    trimmed = trimmed.replace(/\s{2,}/g, ' ');
    
    // 策略2: 删除常见的冗余形容词短语（保留核心信息）
    if (this._countChars(trimmed) > targetMax) {
      const redundancyPatterns = [
        /\bvery\s+\w+/gi,
        /\bextremely\s+\w+/gi,
        /\babsolutely\s+\w+/gi,
        /\bdefinitely\s+\w+/gi,
        /\bquite\s+\w+/gi,
        /\breally\s+\w+/gi,
        /\bincredibly\s+\w+/gi
      ];
      
      redundancyPatterns.forEach(pattern => {
        trimmed = trimmed.replace(pattern, (match) => match.split(' ')[1]);
      });
    }
    
    // 策略3: 精简Mood字段（情绪词从长句精简为关键词）
    if (this._countChars(trimmed) > targetMax) {
      // 匹配"Mood: ..."或"情绪: ..."后的长描述，保留前30字符
      trimmed = trimmed.replace(/(Mood[:：]\s*.{30}).{50,}/i, '$1');
      trimmed = trimmed.replace(/(情绪[:：]\s*.{30}).{50,}/i, '$1');
    }
    
    // 策略4: 精简Camera字段（保留核心运镜词，删除修饰性描述）
    if (this._countChars(trimmed) > targetMax) {
      // 删除Camera中的速度/质感修饰词（如"极慢速"、"精密"等），保留核心运镜方式
      trimmed = trimmed.replace(/(\b(?:极慢|慢速|匀速|快速|急速|迅猛|精密|平滑|流畅|缓缓|猛烈|剧烈|细微|微妙)\w*\s*)/g, '');
    }
    
    // 策略5: 截断Lighting字段（如果存在，保留前30-50字符，绝不删除）
    if (this._countChars(trimmed) > targetMax) {
      const lightingMatch = trimmed.match(/Lighting[:：]\s*(.{30,50})/i);
      if (lightingMatch) {
        // 保留Lighting字段+30-50字符内容，不删除
        const lightingContent = lightingMatch[1].substring(0, 50);
        trimmed = trimmed.replace(/Lighting[:：]\s*.+/i, `Lighting: ${lightingContent}...`);
        
        // 如果截断Lighting后仍然超长，不再继续截断Lighting（保护字段）
        // 而是直接跳到策略6（字段边界截断），在其他字段处理
      }
    }
    
    // 策略5b: 如果仍然超长，截断Camera字段（保留核心运镜词，删除修饰词）
    if (this._countChars(trimmed) > targetMax) {
      const cameraMatch = trimmed.match(/Camera[:：]\s*(.{30,50})/i);
      if (cameraMatch) {
        const cameraContent = cameraMatch[1].substring(0, 50);
        trimmed = trimmed.replace(/Camera[:：]\s*.+/i, `Camera: ${cameraContent}...`);
      }
    }
    
    // 策略5c: 如果仍然超长，截断Mood字段（保留关键词）
    if (this._countChars(trimmed) > targetMax) {
      const moodMatch = trimmed.match(/Mood[:：]\s*(.{20,30})/i);
      if (moodMatch) {
        const moodContent = moodMatch[1].substring(0, 30);
        trimmed = trimmed.replace(/Mood[:：]\s*.+/i, `Mood: ${moodContent}...`);
      }
    }
    
    // 策略5d: 如果仍然超长，截断Scene字段（保留核心场景描述）
    if (this._countChars(trimmed) > targetMax) {
      const sceneMatch = trimmed.match(/Scene[:：]\s*(.{50,80})/i);
      if (sceneMatch) {
        const sceneContent = sceneMatch[1].substring(0, 80);
        trimmed = trimmed.replace(/Scene[:：]\s*.+/i, `Scene: ${sceneContent}...`);
      }
    }
    
    // 策略6: 如果仍然超长，在字段边界处截断（不在字段中间截断）
    if (this._countChars(trimmed) > targetMax) {
      // 识别字段边界（| 或 . 或 换行）
      const fieldBoundaries = [];
      const fieldMarkers = ['Dialogue', 'Character', 'Scene', 'Mood', 'Camera', 'Lighting', 'EnvironmentStyle'];
      
      for (const marker of fieldMarkers) {
        const regex = new RegExp(`\\b${marker}[:：]`, 'i');
        const match = trimmed.match(regex);
        if (match) {
          fieldBoundaries.push({
            marker: marker,
            index: match.index
          });
        }
      }
      
      // 从targetMax位置向前找最近的字段边界
      let truncatePoint = targetMax;
      for (let i = targetMax; i >= targetMax - 200; i--) {
        if (i < 0) break;
        // 如果在字段边界附近，截断到前一个字段的末尾
        const nearBoundary = fieldBoundaries.find(b => Math.abs(i - b.index) < 10);
        if (nearBoundary) {
          // 如果截断点会删除Lighting字段，保留Lighting（保护最低优先级字段）
          if (nearBoundary.marker === 'Lighting') {
            // 找到Lighting前面的字段边界
            const prevBoundary = fieldBoundaries
              .filter(b => b.index < nearBoundary.index)
              .sort((a, b) => b.index - a.index)[0];
            if (prevBoundary) {
              truncatePoint = prevBoundary.index + 100; // 保留前一个字段+100字符
            }
          } else {
            truncatePoint = i;
          }
          break;
        }
      }
      
      trimmed = trimmed.substring(0, truncatePoint).trim();
    }
    
    return trimmed;
  }

  _findNearestBreak(text, targetPos) {
    // 从targetPos向前找最近的分隔符
    for (let i = targetPos; i >= targetPos - 50; i--) {
      if (i < 0) break;
      if (/[，。！？；,.!?;]/.test(text[i])) {
        return i + 1;
      }
    }
    return targetPos;
  }

  _validatePromptLength(prompts) {
    // 快速校验：返回每个prompt的长度状态（v6.11-Peng-fix4: 统一大鹏字符数规则）
    const TARGET_MIN = 900;   // 90% of 980
    const TARGET_MAX = 980;   // 统一大鹏字符数规则上限
    
    return (prompts || []).map(p => {
      const text = p.prompt || p._generatedPrompt || '';
      const len = this._countChars(text);
      return {
        shotId: p.shotId || p.id,
        length: len,
        status: len >= TARGET_MIN && len <= TARGET_MAX ? 'pass' : (len < TARGET_MIN ? 'too_short' : 'too_long'),
        utilization: Math.round((len / 5500) * 100)
      };
    });
  }

  /**
   * 计算字符数（大鹏规则：汉字=2字符，英文=1字符）
   * @param {string} str 
   * @returns {number}
   */
  _countChars(str) {
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

}

module.exports = ScriptwriterOptimizer;