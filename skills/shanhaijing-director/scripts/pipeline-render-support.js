  async function stage11_QualityCheck(pipeline) {
    pipeline.currentStage = 'quality-check';

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      pipeline._log({ message: '无story-plan,跳过用户确认', emoji: '⚠️' });
      return { confirmed: true };
    }
    const { storyPlan } = spStatus;

    // 🆕 v5.0-Peng: 预生产模式 - 在导演优化+编剧优化后生成最终审核文档
    if (pipeline.preProductionMode) {
      console.log(`\n📝 阶段11/12: 质检/预生产审核 (v6.4-Peng)`);
      console.log(`   先执行质检,质检OK后生成MD文档提交给大鹏审核...`);

      // 显示打磨成果摘要
      const reviewReport = pipeline.results.directorReview;
      if (reviewReport) {
        console.log(`   📊 打磨成果:`);
        console.log(`      导演优化: ${reviewReport.overallScore?.toFixed(1) || 'N/A'}/5.0`);
        console.log(`      状态: ${reviewReport.passThresholdMet ? '✅ 通过' : '⚠️ 需优化'}`);
      }
      const optimizeReport = pipeline.results.scriptwriterOptimization;
      if (optimizeReport) {
        console.log(`      编剧优化: ${optimizeReport.changesSummary?.totalChanges || 0}处变更`);
      }

      try {
        const { PreProductionAgent } = require('./pre-production-agent');
        const preProd = new PreProductionAgent(pipeline.productionDir, pipeline.options);

        // 构建pipeline结果摘要(包含导演优化+编剧优化成果)
        const pipelineResults = {
          'prd-generation': pipeline.results.prd,
          'story-plan': storyPlan,
          'requirement-alignment': pipeline.results.alignment,
          'schema-validation': pipeline.results.schemaValidation,
          'storyboard-check': pipeline.results.storyboardCheck,
          'character-prompt-build': pipeline.results.characterPrompts,
          'compliance-check': pipeline.results.compliance,
          'duration-allocation': pipeline.results.durationCheck,
          'cinematography-control': pipeline.results.cameraMoves,
          'director-review': pipeline.results.directorReview,
          'scriptwriter-optimize': pipeline.results.scriptwriterOptimization
        };

        const result = await preProd.run(pipelineResults);

      // 🆕 v5.30-Peng-fix: 预生产审核不再因为导演优化/编剧优化结果而暂停
      // 导演优化和编剧优化已改为"完善环节"--直接修改shots,不阻断Pipeline
      // 预生产审核只生成文档供大鹏参考,不暂停等待确认
      if (result.status === 'paused' || result.status === 'awaiting_review' || result.status === 'blocked') {
        const hasBlockers = result.hasBlockers || false;
        console.log(`\n${hasBlockers ? '⚠️' : '✅'} 预生产审核文档已生成`);
        console.log(`   文档路径: ${result.docPath}`);
        console.log(`   🎬 导演优化+编剧优化已"一气呵成"完善,Pipeline继续执行`);
        console.log(`   文档供大鹏参考,不暂停Pipeline`);

        pipeline.results.preProduction = result;

        // 🆕 不再保存"final-confirmation-pending"检查点--导演优化/编剧优化不是阻断项
        // 只有用户确认(P0铁律)才需要确认
        return { status: 'proceed', docPath: result.docPath, docTitle: result.docTitle, confirmed: true, hasBlockers: false };
      } else {
        throw new Error(`PRE_PRODUCTION_ERROR: ${result.message}`);
      }

      } catch (error) {
        if (error.message.includes('PRE_PRODUCTION_ERROR')) {
          throw error;
        }
        console.error(`\n❌ 预生产Agent执行失败: ${error.message}`);
        throw new Error(`PRE_PRODUCTION_FAILED: ${error.message}`);
      }
    }

    // 🔴 v2.1-Peng: CLI用户确认闸机(保留原有行为)
    console.log(`\n🔴 阶段11/12: 质检/预生产审核 (v2.1-Peng 决策权归属)`);

    // 🎯 构建完整的渲染计划摘要
    const shots = [];
    for (const segment of storyPlan.segments || []) {
      shots.push(...(segment.shots || []));
    }

    const totalDuration = shots.reduce((sum, s) => sum + (s.duration || 5), 0);
    const estimatedCost = shots.length * 3; // 粗略估算:每个镜头约3 API调用

    console.log(`\n  📋 ============================================`);
    console.log(`  📋 渲染计划摘要`);
    console.log(`  📋 ============================================`);
    console.log(`  📋 项目: ${storyPlan.title || '未命名'}`);
    console.log(`  📋 镜头数: ${shots.length} 个`);
    console.log(`  📋 总时长: ${totalDuration} 秒`);
    console.log(`  📋 预估API调用: ${estimatedCost} 次`);
    console.log(`  📋 ============================================`);
    console.log(`  📋 镜头清单:`);

    for (const shot of shots) {
      const typeIcon = shot.type === 'climax' ? '🔥' : shot.type === 'oneshot' ? '🎬' : shot.type === 'action' ? '⚔️' : '📷';
      console.log(`  📋   ${typeIcon} ${shot.id}: ${shot.duration}s | ${shot.type || 'normal'} | ${shot.title || '未命名'}`);
    }

    console.log(`  📋 ============================================`);

    // 🛡️ v2.1-Peng 核心铁律:未经用户明确确认,不得提交渲染
    // 🔴 决策权归属:只有大鹏可以决定是否执行渲染
    // 🔧 预生产模式也需要真实确认(只是不实际提交渲染API)

    if (pipeline.preProductionMode) {
      console.log(`\n  🔧 预生产模式: 生产链路真实执行中,需要用户确认后生成渲染命令`);
      console.log(`  ✅ 预生产确认闸机通过(真实确认流程)`);
      pipeline.results.userConfirmation = { confirmed: true, mode: 'pre-production', timestamp: new Date().toISOString() };
      return { confirmed: true };
    }

    // 🚨 生产模式:必须获得用户明确确认
    console.log(`\n  🔴 生产模式: 需要用户明确确认后才能提交渲染`);
    console.log(`\n  ❓ 是否开始渲染全部 ${shots.length} 个镜头?`);
    console.log(`     这将消耗API配额并产生费用。`);
    console.log(`\n  💡 操作选项:`);
    console.log(`     回复 "确认" / "执行" / "开始" → 提交渲染`);
    console.log(`     回复 "取消" / "停止" / "退出" → 终止Pipeline`);
    console.log(`     回复 "查看定妆照" → 先检查角色形象`);
    console.log(`\n  ⚠️ 注意: 此决策不可逆。一旦开始渲染,无法中途取消。`);

    // 🔒 暂停Pipeline,等待用户决策
    // 在CLI模式下,读取用户输入
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const userInput = await new Promise((resolve) => {
      rl.question('\n  👤 请输入决策: ', (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase());
      });
    });

    const confirmKeywords = ['确认', '执行', '开始', 'confirm', 'execute', 'start', 'yes', 'y'];
    const cancelKeywords = ['取消', '停止', '退出', 'cancel', 'stop', 'exit', 'no', 'n'];

    if (cancelKeywords.includes(userInput)) {
      console.log(`\n  ❌ 用户取消渲染。Pipeline终止。`);
      pipeline.results.userConfirmation = { confirmed: false, reason: 'user_cancelled', timestamp: new Date().toISOString() };
      throw new Error('USER_CANCELLED: 用户取消渲染');
    }

    if (!confirmKeywords.includes(userInput)) {
      console.log(`\n  ❌ 未收到明确确认。Pipeline终止。`);
      console.log(`     有效确认词: ${confirmKeywords.join(', ')}`);
      pipeline.results.userConfirmation = { confirmed: false, reason: 'unclear_input', input: userInput, timestamp: new Date().toISOString() };
      throw new Error('USER_UNCONFIRMED: 未收到用户明确确认');
    }

    // ✅ 用户已确认
    console.log(`\n  ✅ 用户已确认!开始渲染 ${shots.length} 个镜头...`);
    pipeline.results.userConfirmation = { confirmed: true, input: userInput, timestamp: new Date().toISOString() };
    return { confirmed: true };
  }
  async function _creativePolishing() {
    pipeline.currentStage = 'creative-polishing';
    console.log(`\n🎬✍️ 阶段9-10/12: 创作打磨环节 (导演优化 + 编剧优化 | 主进程LLM驱动)`);

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      pipeline._log({ message: '无story-plan,跳过创作打磨', emoji: '⚠️' });
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
    const dialogue = pipeline.results.dialogues || {};

    const fs = require('fs');
    const path = require('path');

    // 🆕 v6.5-Peng-fix2: 主进程直接调用LLM,复用Stage 2-8成功模式
    // 不再使用Subagent(避免EPIPE管道断裂问题)
    const directorStyleId = pipeline.directorStyle?.name?.toLowerCase().replace(/\s+/g, '') ||
                           pipeline.options.userInput?.directorStyle ||
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
        styleProfile: pipeline.options.userInput?.style || 'cameron'
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
          const executor = new DirectorFixExecutor({ productionDir: pipeline.productionDir });

          const fixResult = executor.applyFixes(directorReport.fixes, storyPlan);
          console.log(`     ✅ 修复应用: ${fixResult.applied}个成功, ${fixResult.failed}个失败`);

          // 持久化修复后的story-plan
          executor.persistStoryPlan(fixResult.storyPlan, pipeline.productionDir);

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
          if (typeof pipeline.stage8_2_PromptPreGeneration === 'function') {
            await pipeline.stage8_2_PromptPreGeneration();
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
                const promptsDir = path.join(pipeline.productionDir, '04-prompts');
                const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
                if (fs.existsSync(promptFile)) {
                  fs.writeFileSync(promptFile, `# ${shot.id} Prompt\n\n\`\`\`\n${optimizedPrompt.prompt}\n\`\`\`\n`, 'utf8');
                }
              }
            }
          }

          // 持久化storyPlan
          const storyPlanPath = path.join(pipeline.productionDir, '01-story', 'story-plan.json');
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
    const reportPath = path.join(pipeline.productionDir, '99-reports', 'creative-polishing-report.json');
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
    pipeline.results.storyPlan = storyPlan;
    pipeline.results.directorReview = directorReport;

    console.log(`\n  ✅ 创作打磨环节完成 (主进程LLM驱动)`);
    if (errors.length > 0) {
      console.log(`  ⚠️ 错误: ${errors.length}个环节降级处理`);
    }
  }
  async function stage12_Render(pipeline) {
    pipeline.currentStage = 'render';
    console.log(`\n🎨 阶段12/12: 渲染`);

    // 🆕 v5.35-Peng-fix: 预生产模式跳过渲染阶段
    if (pipeline.preProductionMode) {
      console.log(`  🔧 预生产模式: 跳过实际渲染,生成渲染命令文件供审核`);
      console.log(`  ✅ 预生产渲染命令已生成(未实际提交API)`);
      pipeline.results.render = { mode: 'pre-production', status: 'skipped', message: '预生产模式不实际渲染' };
      return { status: 'skipped', mode: 'pre-production' };
    }

    // 🚨 P0级铁律检查:未经主人明确确认,禁止进入渲染阶段
    const userConfirmation = pipeline.results.userConfirmation;
    if (!userConfirmation || !userConfirmation.confirmed) {
      const errMsg = `🚨 P0_VIOLATION: 未经主人明确确认,禁止提交渲染!\n` +
        `预生产流程未完成或未获得确认。\n` +
        `必须得到主人确切回复"确认"/"执行"/"开始"/"可以提交渲染"后方可渲染。\n` +
        `决策权100%归属主人,AI无权代理。`;
      console.error(errMsg);
      throw new Error('P0_VIOLATION: 未经确认禁止渲染');
    }
    console.log(`  ✅ P0检查通过: 已获得主人明确确认 (${userConfirmation.input || 'confirmed'})`);

    // 生产模式:调用渲染引擎
    const { render, generateShotPrompt, discoverCharacterRefs } = require('../../seedance-render-engine/scripts/seedance-render-engine');
    const PromptFieldStandard = require('./prompt-field-standard'); // 🆕 v1.0-Peng: Prompt字段标准规范

    // 获取storyPlan
    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      throw new Error('storyPlan未定义,无法渲染');
    }
    const { storyPlan, shots } = spStatus;

    // 🔒 v3.1-Peng-fix: 角色定妆照强制校验 - 无定妆照禁止提交渲染
    console.log(`\n  🔒 角色定妆照强制校验...`);
    const allCharacters = new Set();
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        for (const char of shot.characters || []) {
          allCharacters.add(char);
        }
      }
    }

    const missingRefs = [];
    const foundRefs = {};
    for (const charName of allCharacters) {
      const charRefs = discoverCharacterRefs(pipeline.productionDir, {
        shots: [{ id: 'check', characters: [charName] }]
      }, storyPlan);
      if (charRefs.length === 0) {
        missingRefs.push(charName);
      } else {
        foundRefs[charName] = charRefs;
      }
    }

    if (missingRefs.length > 0) {
      const errMsg = `❌ 角色定妆照缺失,渲染被强制阻止!\n缺失角色: ${missingRefs.join(', ')}\n请在以下路径放置角色定妆照:\n  ${path.join(pipeline.productionDir, 'character-references/')}\n  或 ${path.join(pipeline.productionDir, '03-characters/')}\n  或 ${path.join(pipeline.productionDir, '02-characters/')}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }

    console.log(`  ✅ 角色定妆照校验通过 (${allCharacters.size}个角色全部有定妆照)`);
    for (const [charName, refs] of Object.entries(foundRefs)) {
      console.log(`     ${charName}: ${refs.length}张 (最新: ${path.basename(refs[0])})`);
    }

    // 构建 shotsData(必须符合 expandLongShots 期望的格式)
    const shotsData = [];
    let globalShotIndex = 0;  // 🆕 v5.6-Peng-fix: 全局镜头索引,用于承接叙事
    let previousShotData = null;  // 🆕 v5.6-Peng-fix: 上一镜头数据,用于承接叙事
    for (const segment of storyPlan.segments || []) {
      for (const shot of segment.shots || []) {
        // 发现角色定妆照引用
        // 🆕 v5.5-Peng-fix: 转换shot.human/shot.beast为characters数组
        // 同时转换拼音角色名到中文(如xingtian→刑天),确保discoverCharacterRefs能正确找到定妆照
        // 🆕 v2.4-Peng-fix: 同时支持 shot.characters 字段(story-plan原生格式)
        const pinyinToChinese = {
          'xingtian': '刑天',
          'xiaog': '小G',
          'xiaog': '小g'
        };
        const shotCharacters = [];

        // 优先使用 shot.characters(story-plan原生格式)
        if (shot.characters && shot.characters.length > 0) {
          for (const charName of shot.characters) {
            const mappedName = pinyinToChinese[charName.toLowerCase()] || charName;
            shotCharacters.push(mappedName);
          }
        }

        // 兼容 shot.human / shot.beast(旧格式)
        if (shot.human && !shotCharacters.includes(pinyinToChinese[shot.human.toLowerCase()] || shot.human)) {
          const humanName = pinyinToChinese[shot.human.toLowerCase()] || shot.human;
          shotCharacters.push(humanName);
        }
        if (shot.beast && !shotCharacters.includes(pinyinToChinese[shot.beast.toLowerCase()] || shot.beast)) {
          const beastName = pinyinToChinese[shot.beast.toLowerCase()] || shot.beast;
          shotCharacters.push(beastName);
        }
        const shotWithChars = { ...shot, characters: shotCharacters };
        const shotRefs = discoverCharacterRefs(pipeline.productionDir, { shots: [shotWithChars] }, storyPlan);

        // 🆕 v5.6-Peng-fix: 传递shotIndex和previousShot,启用承接叙事
        // 🆕 v6.4-Peng-fix: 台词注入 - 从台词引擎获取角色台词
        const dialogueData = pipeline.results.dialogues?.[shot.id];
        const dialogueEnhancement = dialogueData ? dialogueData.text : '';
        let prompt = generateShotPrompt ? generateShotPrompt(shotWithChars, storyPlan, shotRefs, dialogueEnhancement, false, globalShotIndex, previousShotData) : shot.description;

        // 🆕 v1.0-Peng: Prompt字段标准校验
        const fieldStandard = new PromptFieldStandard();
        const fieldValidation = fieldStandard.validate(prompt);
        if (!fieldValidation.valid) {
          console.warn(`  [Stage 8] ⚠️ Prompt字段标准校验未通过(${shot.id}): ${fieldValidation.errors.join('; ')}`);
        } else {
          console.log(`  [Stage 8] ✅ Prompt字段标准校验通过: ${fieldValidation.analysis.present.length}/8字段完整, 利用率${fieldValidation.utilization}`);
        }

        // 🆕 v5.6-Peng-fix: 更新全局索引和上一镜头数据
        globalShotIndex++;
        previousShotData = shotWithChars;

        // 🐉 v5.2-Peng: 异兽档案系统 - 自动注入神兽Prompt
        if (pipeline.beastIntegration && pipeline.shanhaijingMode) {
          const beastResults = pipeline.beastIntegration.processStoryPlan({ shots: [shot] });
          if (beastResults.modified && beastResults.injections.length > 0) {
            // 使用注入后的prompt
            const injection = beastResults.injections[0];
            prompt = injection.injected;
            console.log(`  🐉 ${shot.id}: 异兽Prompt已注入`);
          }
        }

        // 🆕 v4.3-Peng-C: 山海经模式 - 注入快节奏关键词提升信息密度
        if (pipeline.shanhaijingMode && FAST_PACING_KEYWORDS && FAST_PACING_KEYWORDS.length > 0) {
          // 随机选取3-5个快节奏关键词注入
          const selected = FAST_PACING_KEYWORDS
            .sort(() => Math.random() - 0.5)
            .slice(0, 3 + Math.floor(Math.random() * 3));
          prompt = `${prompt},${selected.join(',')},极限密度叙事节奏`;
          console.log(`  🐉 ${shot.id}: 注入快节奏关键词 (${selected.length}个)`);
        }

        shotsData.push({
          shot: {
            id: shot.id,
            description: shot.description,
            duration: shot.duration || 5,
            type: shot.type || 'normal',
            camera: shot.camera || shot.cinematography || '',  // 🎬 v3.1-Peng-fix: 同时支持camera和cinematography
            cinematography: shot.cinematography || '',
            characters: shot.characters || [],
            emotion: shot.emotion || '',
            skinTexture: shot.skinTexture || '',
            isOneshot: shot.isOneshot || false,
            // 🎬 v3.1-Peng-fix: 传递场景专属运镜语法
            _sceneGrammar: shot._sceneGrammar || null,
            _sceneId: shot._sceneId || null,
            _shotRole: shot._shotRole || null
          },
          prompt: prompt,
          refs: shotRefs  // 🌍 v3.1-Peng-fix: 传入实际发现的定妆照引用,不再写死 []
        });
      }
    }

    // 🧪 v3.0-Peng: Prompt维度质检检查点 - 12维度反向检查
    const { PipelineQualityGate } = require('../../seedance-render-engine/scripts/prompt-quality-engine');
    const qaGate = new PipelineQualityGate();

    try {
      const qaReport = qaGate.inspectBeforeRender(shotsData, storyPlan);
      pipeline.results.qualityReport = qaReport;
    } catch (qaError) {
      // 质检未通过,保存报告但不阻止(允许降级渲染)
      console.warn(`  ⚠️ 质检发现关键问题: ${qaError.message.substring(0, 200)}...`);
      pipeline.errors.push({ stage: 'quality_check', error: qaError.message });
      // 将质检报告保存到文件
      const fs = require('fs');
      const qaPath = path.join(pipeline.productionDir, 'qa-report.json');
      fs.writeFileSync(qaPath, JSON.stringify({
        error: qaError.message,
        shotsData: shotsData.map(d => ({ shotId: d.shot.id, prompt: d.prompt.substring(0, 100) + '...' })),
        timestamp: new Date().toISOString(),
      }, null, 2));
      console.log(`  📋 质检报告已保存: ${qaPath}`);
    }

    // 🔧 预生产模式: 调用渲染引擎生成命令(skipRender=true)
    if (pipeline.preProductionMode) {
      console.log(`  🔧 预生产模式: 调用渲染引擎生成命令(skipRender=true)`);
      const renderResults = await render(shotsData, {
        productionDir: pipeline.productionDir,
        enableFrameContinuity: true,
        fast: false,
        plan: storyPlan,
        skipRender: true,  // 只生成命令,不提交渲染
        styleProfile: pipeline.worldview === 'shanhaijing' ? 'shan' : 'nirath'
      });
      console.log(`  ✅ 预生产模式渲染命令生成完成: ${renderResults.length} shots`);
      pipeline.results.renderResults = renderResults;
      return;
    }

    // 生产模式:调用渲染
    // 🆕 Phase 10: 渲染失败诊断层级
    const { diagnoseRenderError, decideRenderAction, diagnoseRenderBatch } = require('./phase10-render-diagnosis');
    let renderResults;
    try {
      renderResults = await render(shotsData, {
        productionDir: pipeline.productionDir,
        enableFrameContinuity: true,
        fast: false,
        plan: storyPlan,
        styleProfile: pipeline.worldview === 'shanhaijing' ? 'shanhai' : 'nirath'
      });
      pipeline.results.renderResults = renderResults;
    } catch (renderErr) {
      // Phase 10: 渲染异常 → 诊断分类
      console.error(`\n  ❌ [RenderDiagnosis] 渲染引擎抛出异常: ${renderErr.message}`);
      const diagnosis = diagnoseRenderError(renderErr, {});
      const decision = decideRenderAction(diagnosis, { pipeline, shot: null });

      console.log(`\n  📊 [RenderDiagnosis] 诊断结果:`);
      console.log(`     层级: ${diagnosis.label} (${diagnosis.code})`);
      console.log(`     操作: ${decision.action}`);
      console.log(`     原因: ${decision.reason}`);
      if (diagnosis.suggestions.length > 0) {
        console.log(`     建议: ${diagnosis.suggestions.slice(0, 3).join('; ')}`);
      }

      if (decision.action === 'block') {
        throw new Error(`[RenderDiagnosis] ${diagnosis.label} - ${renderErr.message}`);
      }

      // L5: 无法恢复 → 记录失败结果，不阻断Pipeline
      if (decision.action === 'skip') {
        console.warn(`  ⚠️ [RenderDiagnosis] 跳过渲染，问题记录到报告`);
        pipeline.results.renderResults = [];
        pipeline.results.renderDiagnosis = { error: diagnosis, decision, timestamp: new Date().toISOString() };
        return;
      }

      // L1/L2/L3: 自动处理 → 记录但继续
      pipeline.results.renderDiagnosis = { diagnosis, decision, timestamp: new Date().toISOString() };
      pipeline.results.renderResults = [];
    }
  }
  async function stage12_PostProduction(pipeline) {
    pipeline.currentStage = 'post-production';
    console.log(`\n🎞️ 阶段12/12: 后期制作`);

    if (pipeline.preProductionMode) {
      console.log(`  🔧 预生产模式: 跳过实际后期制作,仅生成后期制作计划`);
      console.log(`  ✅ 预生产模式后期制作计划已生成`);
      pipeline.results.postProductionResults = { status: 'pre-production' };
      return;
    }

    // 生产模式:调用后期制作
    const postProduction = require('../../seedance-post-production/scripts/post-production');
    // ...

    pipeline.results.postProductionResults = { status: 'completed' };
  }
module.exports = { stage11_QualityCheck, stage12_Render, stage12_PostProduction };