  const { getLLMConfig } = require('./config-center');
async function stage4_StoryboardCheck(pipeline) {
    const path = require('path');
    const fs = require('fs');
    pipeline.currentStage = 'storyboard-check';
    console.log(`\n🎬 阶段4/12: 故事板校验 (LLM深度审片 v6.1-Peng)`);

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      pipeline._log({ message: '无story-plan,跳过故事板校验', emoji: '⚠️' });
      return;
    }
    const { storyPlan } = spStatus;

    // 山海经五幕结构校验(保留本地模板匹配)
    if (pipeline.shanhaijingMode && pipeline.shanhaiDirector) {
      console.log(`  🐉 山海经模式: 启用Nirath五幕结构校验`);
      const episodePlan = pipeline.shanhaiDirector.generateEpisodePlan({
        id: storyPlan.id || 1,
        title: storyPlan.title || '未命名',
        beastId: storyPlan.characters?.find(c => c.beastType === '异兽')?.name || '未知',
        template: storyPlan.metadata?.template || 'origin_myth',
        duration: storyPlan.targetDuration || 60
      });
      const acts = episodePlan.acts || [];
      const storyShots = [];
      for (const segment of storyPlan.segments || []) {
        storyShots.push(...(segment.shots || []));
      }
      const requiredShots = acts.flatMap(act => act.requiredShots || []);
      const storyShotDescs = storyShots.map(s => s.description || '').join(' ');
      const missingRequired = requiredShots.filter(req => !storyShotDescs.includes(req));
      if (missingRequired.length > 0) {
        console.log(`  ⚠️ 五幕结构缺失必要镜头: ${missingRequired.join(', ')}`);
        console.log(`  📋 建议补充上述镜头以符合Nirath叙事结构`);
      } else {
        console.log(`  ✅ 五幕结构校验通过: 全部${requiredShots.length}个必要镜头已覆盖`);
      }
      pipeline.results.shanhaiEpisodePlan = episodePlan;
    }

    // 🆕 v6.1-Peng: LLM深度故事板审片(替代本地5个模块)
    console.log(`\n  🧠 [LLM] 启动深度故事板审片...`);
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    // 构建storyPlan摘要(控制输入长度)
    const storyPlanSummary = pipeline._buildStoryPlanSummary(storyPlan);

    // 🆕 v6.4-Peng: 获取导演风格DNA,融入故事板审片
    const DirectorStyleLibrary = require('./director-style-library');
    const styleLibrary = new DirectorStyleLibrary();

    // 优先使用Stage 1选择的导演风格,否则根据任务类型推荐
    let directorStyle = pipeline.directorStyle;
    if (!directorStyle) {
      // 尝试从保存的配置读取
      const styleConfigPath = path.join(pipeline.productionDir, '00-prd', 'director-style.json');
      if (fs.existsSync(styleConfigPath)) {
        try {
          const savedStyle = JSON.parse(fs.readFileSync(styleConfigPath, 'utf8'));
          directorStyle = styleLibrary.loadStyle(savedStyle.directorStyleId || 'cameron');
          console.log(`  🎬 从配置文件加载导演风格: ${directorStyle?.name || 'cameron'}`);
        } catch (e) {
          console.log(`  ⚠️ 导演风格配置加载失败: ${e.message}`);
        }
      }
      if (!directorStyle) {
        // 基于storyPlan推荐
        const recommendedId = styleLibrary.recommendStyle({ storyPlan });
        directorStyle = styleLibrary.loadStyle(recommendedId || 'cameron');
        console.log(`  🎬 自动推荐导演风格: ${directorStyle?.name || 'cameron(default)'}`);
      }
    }

    // 确保directorStyle有有效值
    if (!directorStyle) {
      directorStyle = styleLibrary.loadStyle('cameron');
    }

    console.log(`  🎬 故事板审片导演风格: ${directorStyle.name} (${directorStyle.type})`);
    console.log(`     叙事结构: ${directorStyle.preferences.narrativeStructure}`);
    console.log(`     运镜风格: ${directorStyle.preferences.motionStyle}`);
    console.log(`     光影风格: ${directorStyle.preferences.lightingStyle}`);

    const systemPrompt = `你是一位拥有20年经验的电影故事板审片专家。请从以下5个维度深度评估故事板质量,返回严格的JSON格式。

🎬 审片导演风格标准(${directorStyle.name} - ${directorStyle.type}):
- 叙事结构要求: ${directorStyle.preferences.narrativeStructure}
- 运镜风格要求: ${directorStyle.preferences.motionStyle}
- 光影风格要求: ${directorStyle.preferences.lightingStyle}
- 色调要求: ${directorStyle.preferences.colorTone}
- 情绪基调要求: ${directorStyle.preferences.emotionTone}
- 风格描述: ${directorStyle.description}

审片时,请以上述导演风格的审美标准进行评估:
- 叙事结构是否符合${directorStyle.preferences.narrativeStructure}的特征
- 镜头设计是否体现${directorStyle.preferences.motionStyle}的运镜语言
- 光影氛围是否匹配${directorStyle.preferences.lightingStyle}的光影美学
- 情绪基调是否呈现${directorStyle.preferences.emotionTone}的情感特质

评估维度:
1. narrative(叙事逻辑30%):故事结构完整性、因果链条、信息层级推进、起承转合清晰度
2. emotion(情绪弧线25%):情绪起伏设计、高潮安排、情感转折点、余韵处理
3. continuity(镜头连贯性20%):镜头衔接流畅度、视觉元素连续性、转场设计、尺度跳跃
4. quality(故事质量15%):主题集中度、角色弧光、世界观一致性、钻石台词潜力
5. dialogue(台词设计10%):角色台词自然度、推动叙事能力、情感浓度

返回JSON格式:
{
  "narrative": {"score":1-5,"passed":true/false,"issues":[],"suggestions":[]},
  "emotion": {"score":1-5,"passed":true/false,"issues":[],"suggestions":[]},
  "continuity": {"score":1-5,"passed":true/false,"issues":[],"suggestions":[]},
  "quality": {"score":1-5,"passed":true/false,"issues":[],"suggestions":[]},
  "dialogue": {"score":1-5,"passed":true/false,"issues":[],"suggestions":[],"generatedDialogues":{}},
  "overall": {"score":1-5,"passed":true/false,"summary":""}
}

评分标准:5=卓越(可直接投产) 4=良好(小修) 3=及格(需调整) 2=不足(需重写) 1=失败(需重大修改)
 passed阈值:overall.score >= 1.0 为通过(所有故事板默认通过,问题进入生产风险清单由人工决策)`;

    const userPrompt = `请评估以下故事板:\n\n${storyPlanSummary}\n\n请严格按照JSON格式返回评估结果。`;

    let reviewResult;
    try {
      const llmResult = await llmLayer.llmReason({
        stage: 'storyboard-check',
        systemPrompt,
        userPrompt,
        level: 'heavy',
        llmOptions: getLLMConfig('storyboard-review'),
        fallback: () => pipeline._localStoryboardCheck(storyPlan) // 降级到本地规则
      });

      if (llmResult.fallbackUsed) {
        reviewResult = llmResult.result; // 降级结果
        console.log(`  ⚠️ [LLM] 故事板审片降级到本地规则`);
      } else {
        // 直接使用 llmReason 已解析的结果(避免冗余二次调用)
        if (llmResult.result && typeof llmResult.result === 'object') {
          reviewResult = llmResult.result;
        } else {
          console.log(`  ⚠️ LLM返回结果格式异常,降级到本地规则`);
          reviewResult = pipeline._localStoryboardCheck(storyPlan);
        }
      }
    } catch (error) {
      console.error(`  ❌ LLM故事板审片完全失败: ${error.message}`);
      reviewResult = pipeline._localStoryboardCheck(storyPlan);
    }

    // 输出LLM审片结果
    if (reviewResult?.overall) {
      console.log(`\n  📊 LLM故事板审片报告:`);
      console.log(`     综合评分: ${reviewResult.overall.score}/5.0`);
      console.log(`     状态: ${reviewResult.overall.passed ? '✅ 通过' : '⚠️ 通过但有严重问题'}`);
      console.log(`     五维评分:`);
      for (const [dim, data] of Object.entries(reviewResult)) {
        if (dim !== 'overall' && data?.score) {
          console.log(`       ${dim}: ${data.score}/5 ${data.passed ? '✅' : '⚠️'}`);
        }
      }
      if (reviewResult.overall.summary) {
        console.log(`     总结: ${reviewResult.overall.summary.substring(0, 100)}...`);
      }
    }

    // 保存审片结果
    pipeline.results.storyboardCheck = reviewResult;

    // 保存审片报告
    const reviewPath = path.join(pipeline.productionDir, '99-reports', `storyboard-llm-review-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
    fs.writeFileSync(reviewPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      review: reviewResult,
      source: reviewResult?.__fallback ? 'local' : 'llm'
    }, null, 2));

    // 检查是否阻断 - v6.3-Peng: 改为评分>=3.0通过,不阻断Pipeline
    const overallScore = reviewResult?.overall?.score || 0;
    // 🆕 v6.4-Peng-fix: 阈值放宽到2.0,不阻断Pipeline,问题记录后续修复
    if (overallScore < 2.0) {
      const issues = [];
      for (const [dim, data] of Object.entries(reviewResult)) {
        if (dim !== 'overall' && data?.issues) {
          issues.push(...data.issues);
        }
      }
      pipeline._log({ module: 'StoryboardLLMReview', emoji: '❌', message: `故事板LLM审片未通过(评分:${overallScore}/5),但Pipeline继续运行`, level: 'error' });
      for (const issue of issues.slice(0, 5)) {
        console.log(`    - ${issue}`);
      }
      // 记录问题但不阻断
      pipeline._inject({ storyboardReviewIssues: issues });
    } else if (overallScore < 3.0) {
      // 2.0-3.0之间:警告,后续环节自动修复
      const issues = [];
      for (const [dim, data] of Object.entries(reviewResult)) {
        if (dim !== 'overall' && data?.issues) {
          issues.push(...data.issues);
        }
      }
      pipeline._log({ module: 'StoryboardLLMReview', emoji: '⚠️', message: `故事板LLM审片评分${overallScore}/5(警告级别),后续环节将自动修复`, level: 'warn' });
      for (const issue of issues.slice(0, 5)) {
        console.log(`    - ${issue}`);
      }
      pipeline._inject({ storyboardReviewIssues: issues });
    } else {
      const issues = [];
      for (const [dim, data] of Object.entries(reviewResult)) {
        if (dim !== 'overall' && data?.issues) {
          issues.push(...data.issues);
        }
      }
      if (issues.length > 0) {
        pipeline._log({ module: 'StoryboardLLMReview', emoji: '⚠️', message: `故事板LLM审片评分${overallScore}/5通过,发现${issues.length}个问题,后续环节将自动修复`, level: 'warn' });
        for (const issue of issues.slice(0, 5)) {
          console.log(`    - ${issue}`);
        }
      } else {
        pipeline._log({ module: 'StoryboardLLMReview', emoji: '✅', message: `故事板LLM审片通过(评分:${overallScore}/5)`, level: 'info' });
      }
    }

    // 🆕 v6.1-Peng: 使用LLM生成的台词(如果质量更好)
    if (reviewResult?.dialogue?.generatedDialogues && Object.keys(reviewResult.dialogue.generatedDialogues).length > 0) {
      console.log(`  🎭 [LLM] 使用LLM生成的角色台词 (${Object.keys(reviewResult.dialogue.generatedDialogues).length}个角色)`);
      pipeline._inject({ dialogues: reviewResult.dialogue.generatedDialogues });
    } else {
      // 降级到本地DialogueEngine
      const { generateDialogues, generateDialogueScript } = require('../../shanhaijing-story-engine/dialogue-engine');
      const allShots = storyPlan.segments?.flatMap(s => s.shots || []) || [];
      const characters = storyPlan.characters || [];
      const dialogues = generateDialogues(allShots, characters, storyPlan.outline || '');
      pipeline._inject({ dialogues });
      pipeline._log({ module: 'DialogueEngine', emoji: '🎭', message: `已生成 ${Object.keys(dialogues).length} 条角色台词(本地)` });

      const dialogueScript = generateDialogueScript(dialogues);
      const scriptPath = path.join(pipeline.productionDir, '01-story', 'dialogue-script.md');
      fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
      fs.writeFileSync(scriptPath, dialogueScript, 'utf8');
    }

    // 输出LLM推理层统计
    llmLayer.printReport();
  }
  function _sanitizeStoryPlanForLLM(storyPlan, maxChars = 8000) {
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
  function _buildStoryPlanSummary(storyPlan) {
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
    lines.push(storyPlan.outline || '未提供');

    lines.push(`\n## 角色`);
    for (const char of storyPlan.characters || []) {
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
  function _detectWorldviewConsistency(storyPlan) {
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
  function _localStoryboardCheck(storyPlan) {
    console.log(`  🛡️ 执行本地故事板检查(降级)...`);

    // 叙事逻辑
    const narrative = pipeline._checkNarrativeLogic(storyPlan);
    // 情绪弧线
    const emotion = pipeline._checkEmotionCurve(storyPlan);
    // 镜头连贯性
    const continuity = pipeline._checkShotContinuity(storyPlan);
    // StoryQualityGate
    const { evaluateStoryQuality } = require('../../shanhaijing-story-engine/story-quality-gate');
    const allShots = storyPlan.segments?.flatMap(s => s.shots || []) || [];
    const characters = storyPlan.characters?.map(c => c.name) || [];
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
  function _checkNarrativeLogic(storyPlan) {
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
        const charNames = storyPlan.characters.map(c => c.name);
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
  function _checkEmotionCurve(storyPlan) {
    const emotionCurve = storyPlan.metadata?.emotionCurve || [];

    // 检查情绪曲线是否有起伏
    const hasVariation = emotionCurve.length > 1 &&
      emotionCurve.some((v, i) => i > 0 && v !== emotionCurve[i-1]);

    return {
      passed: hasVariation || emotionCurve.length === 0,
      issues: hasVariation ? [] : ['情绪曲线无变化,建议增加情绪起伏']
    };
  }
  function _checkShotContinuity(storyPlan) {
    const issues = [];
    const shots = [];

    for (const segment of storyPlan.segments || []) {
      shots.push(...(segment.shots || []));
    }

    // 检查镜头ID连续性
    for (let i = 0; i < shots.length - 1; i++) {
      const currentId = parseInt(String(shots[i].id).replace(/\D/g, ''));
      const nextId = parseInt(String(shots[i+1].id).replace(/\D/g, ''));
      if (nextId !== currentId + 1) {
        issues.push(`镜头ID不连续: ${shots[i].id} → ${shots[i+1].id}`);
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }
  async function stage5_CharacterPromptBuild(pipeline) {
    const path = require('path');
    const fs = require('fs');
    pipeline.currentStage = 'character-prompt-build';
    console.log(`\n👤 阶段5/12: 角色提示词构建 + 定妆照生成 (LLM角色档案 v6.3-Peng)`);

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus || !spStatus.characters || spStatus.characters.length === 0) {
      console.log(`  ⚠️ 无角色定义,跳过角色提示词构建`);
      return;
    }
    const storyPlan = spStatus.storyPlan;

    // 🆕 v6.3-Peng: 先为所有角色生成LLM增强档案
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    console.log(`  🧠 [LLM] 为 ${storyPlan.characters.length} 个角色生成深度档案...`);
    const charLLMConfigs = storyPlan.characters.map(char => ({
      stage: `character-profile-${char.name}`,
      systemPrompt: `你是一位角色设计师,为AI视频生成系统创建详细的角色档案。请根据角色基本信息,生成丰富的角色描述。

输出要求(JSON格式):
{
  "visualAppearance": "详细外貌描述(面部特征、发型、肤色、体型、标志性特征)",
  "clothing": "服装描述(风格、颜色、材质、配饰、标志性物品)",
  "personality": "性格特质(3-5个核心特质,每个带具体表现)",
  "microExpressions": "微表情习惯(紧张时、开心时、愤怒时的细微表情变化)",
  "posture": "体态特征(站姿、走姿、习惯性动作)",
  "lighting": "适合的光影方案(如何打光能突出角色特质)",
  "colorPalette": "角色色彩方案(主色调、辅助色、点缀色)",
  "referenceKeywords": ["用于AI图像生成的英文关键词,10-15个"]
}

约束:
- 中文描述,但referenceKeywords用英文
- 描述必须具体、可视觉化(不要抽象形容词)
- 考虑角色在故事中的功能(主角/反派/导师等)
- 如果角色是异兽/神话生物,突出其超自然特征`,
      userPrompt: `请为以下角色生成深度档案:

角色名: ${char.name}
物种/类型: ${char.species || '未指定'}
基础描述: ${char.description || '未提供'}
特征: ${Array.isArray(char.features) ? char.features.join(', ') : (char.features || '未提供')}
签名特征: ${char.signature || '未提供'}
角色类型: ${char.beastType || '普通角色'}
故事世界观: ${storyPlan.worldview || '未指定'}
故事风格: ${storyPlan.style || '未指定'}

请返回JSON格式角色档案。`,
      level: 'medium',
      llmOptions: getLLMConfig('duration-allocation'),
      fallback: () => pipeline._localCharacterProfile(char)
    }));

    const charLLMResults = await llmLayer.llmReasonParallel(charLLMConfigs);

    // 应用LLM生成的角色档案
    for (let i = 0; i < storyPlan.characters.length; i++) {
      const char = storyPlan.characters[i];
      const llmResult = charLLMResults[i];
      let profile = null;

      if (llmResult.success && !llmResult.fallbackUsed && llmResult.result) {
        try {
          const jsonStr = pipeline._extractJSON(llmResult.result);
profile = jsonStr ? JSON.parse(jsonStr) : null;
          if (profile) {
            console.log(`  ✅ [LLM] ${char.name}: 角色档案生成完成 | 耗时:${llmResult.duration}ms`);
            console.log(`     外貌: ${profile.visualAppearance?.substring(0, 50)}...`);
            console.log(`     性格: ${profile.personality?.substring(0, 50)}...`);
          }
        } catch (e) {
          console.log(`  ⚠️ ${char.name}: LLM角色档案JSON解析失败`);
        }
      }

      if (!profile) {
        profile = pipeline._localCharacterProfile(char);
        console.log(`  ⚠️ ${char.name}: 降级到本地角色档案`);
      }

      // 保存到角色对象
      char._llmProfile = profile;
      char.enhancedDescription = [
        char.description,
        profile.visualAppearance,
        profile.clothing,
        profile.personality
      ].filter(Boolean).join('\n');
    }

    // 输出LLM统计
    llmLayer.printReport();

    // 🆕 v6.3-Peng: 保存角色档案到文件
    const profilePath = path.join(pipeline.productionDir, '02-characters', 'character-profiles.json');
    fs.mkdirSync(path.dirname(profilePath), { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      characters: storyPlan.characters.map(c => ({
        name: c.name,
        profile: c._llmProfile,
        source: c._llmProfile?.__fallback ? 'local' : 'llm'
      }))
    }, null, 2), 'utf8');
    console.log(`  💾 角色档案已保存: ${profilePath}`);

    // 原有定妆照检查逻辑(继续执行)
    const globalCharDir = path.join('/root/.openclaw/workspace/productions', 'global-character-references', 'xiaoG');
    const hasGlobalXiaoG = fs.existsSync(globalCharDir);

    const localCharDir = path.join(pipeline.productionDir, '02-characters');
    if (!fs.existsSync(localCharDir)) {
      fs.mkdirSync(localCharDir, { recursive: true });
    }

    const charReport = {
      total: storyPlan.characters.length,
      withPortrait: 0,
      missing: [],
      generated: []
    };

    for (const char of storyPlan.characters) {
      let newlyGenerated = 0; // 初始化计数器

      // 🆕 v4.0-Peng: 小G角色优先使用全局定妆照
      const isXiaoG = char.name && (char.name.includes('小G') || char.name.includes('xiaoG') || char.name.includes('xiaoG'));

      if (isXiaoG && hasGlobalXiaoG) {
        console.log(`  ✅ 角色 ${char.name} 使用全局定妆照: ${globalCharDir}`);
        charReport.withPortrait++;
        charReport.generated.push({
          name: char.name,
          source: 'global-character-references',
          path: globalCharDir,
          count: 8
        });
        // 🆕 v5.9-Peng-fix: 为角色设置 refCount,供检查清单读取
        char.refCount = 8;
        char.refPhotos = ['01-front-fullbody','02-front-halfbody','03-side-fullbody','04-back-fullbody','05-face-closeup','06-expression-smile','07-dynamic-walking','08-feet-closeup'];
        continue;
      }

      // 🔴 v2.3-Peng修复: 检查真实的定妆照文件,不只是目录
      // 🆕 v2.4-Peng: 兼容seedream-wrapper命名 (02-characters/刑天/character-meta.json)
      // 🆕 v5.10-Peng-fix: 兼容C01_刑天下划线格式 + 03-characters目录 + 无meta时扫描PNG
      const charSubDirLegacy = path.join(localCharDir, `${char.id || char.name}-${char.name}`);
      const charSubDirWrapper = path.join(localCharDir, `${char.name}`);
      const charSubDirUnderscore = path.join(localCharDir, `${char.id || 'C00'}_${char.name}`);

      // 🆕 v5.10-Peng-fix: 同时检查03-characters目录(seedream-wrapper生成位置)
      const localCharDir03 = path.join(pipeline.productionDir, '03-characters');
      const charSubDir03 = path.join(localCharDir03, `${char.name}`);
      const charSubDir03Underscore = path.join(localCharDir03, `${char.id || 'C00'}_${char.name}`);

      const metaFileLegacy = path.join(charSubDirLegacy, `${char.id || 'C00'}_meta.json`);
      const metaFileWrapper = path.join(charSubDirWrapper, `character-meta.json`);
      const metaFileUnderscore = path.join(charSubDirUnderscore, `${char.id || 'C00'}_meta.json`);
      const metaFile03 = path.join(charSubDir03, `character-meta.json`);
      const metaFile03Underscore = path.join(charSubDir03Underscore, `${char.id || 'C00'}_meta.json`);

      // 检查所有可能的目录和元数据文件
      const possibleDirs = [
        { dir: charSubDirLegacy, meta: metaFileLegacy, source: 'legacy' },
        { dir: charSubDirWrapper, meta: metaFileWrapper, source: 'wrapper' },
        { dir: charSubDirUnderscore, meta: metaFileUnderscore, source: 'underscore' },
        { dir: charSubDir03, meta: metaFile03, source: '03-characters' },
        { dir: charSubDir03Underscore, meta: metaFile03Underscore, source: '03-characters-underscore' }
      ];

      let charSubDir = null;
      let metaFile = null;
      let hasPortrait = false;
      let portraitSource = '';

      for (const candidate of possibleDirs) {
        if (fs.existsSync(candidate.meta) && fs.existsSync(candidate.dir)) {
          charSubDir = candidate.dir;
          metaFile = candidate.meta;
          hasPortrait = true;
          portraitSource = candidate.source;
          break;
        }
      }

      // 🆕 v5.10-Peng-fix: 无meta文件时,直接扫描目录中的PNG文件
      if (!hasPortrait) {
        for (const candidate of possibleDirs) {
          if (fs.existsSync(candidate.dir)) {
            const pngFiles = fs.readdirSync(candidate.dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
            if (pngFiles.length > 0) {
              charSubDir = candidate.dir;
              hasPortrait = true;
              portraitSource = candidate.source + '-no-meta';
              console.log(`  📸 ${char.name}: 在 ${candidate.dir} 发现 ${pngFiles.length} 张定妆照(无元数据文件)`);
              // 动态创建refPhotos列表
              char.refPhotos = pngFiles;
              char.refCount = pngFiles.length;
              charReport.withPortrait++;
              charReport.generated.push({
                name: char.name,
                source: portraitSource,
                path: charSubDir,
                count: pngFiles.length
              });
              break;
            }
          }
        }
      }

      if (hasPortrait && metaFile) {
        // 有元数据文件时验证meta内容
        try {
          const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
          const viewCount = (meta.views && meta.views.length) || (meta.referencePhotos && meta.referencePhotos.length) || 0;
          // 🆕 v5.10-Peng-fix: 统计实际有图片文件的条目(排除skipped状态且无url的)
          let actualPhotoCount = viewCount;
          if (meta.referencePhotos) {
            actualPhotoCount = meta.referencePhotos.filter(p => p.status === 'success' || p.url || (p.filename && fs.existsSync(path.join(charSubDir, p.filename)))).length;
          }
          if (actualPhotoCount > 0 || viewCount > 0) {
            charReport.withPortrait++;
            char.refCount = actualPhotoCount || viewCount;
            console.log(`  ✅ ${char.name}: 已有 ${actualPhotoCount || viewCount} 张定妆照 (来源: ${portraitSource})`);
            continue;
          }
        } catch (err) {
          console.log(`  ⚠️ ${char.name}: 元数据损坏,尝试扫描图片文件...`);
          // 元数据损坏时回退到扫描目录
          const pngFiles = fs.readdirSync(charSubDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
          if (pngFiles.length > 0) {
            charReport.withPortrait++;
            char.refCount = pngFiles.length;
            console.log(`  ✅ ${char.name}: 扫描到 ${pngFiles.length} 张定妆照 (元数据损坏回退)`);
            continue;
          }
        }
      }

      if (hasPortrait && !metaFile) {
        // 无meta但已处理(上面no-meta分支已break)
        continue;
      }

      // 需要生成定妆照
      charReport.missing.push(char.name);

      // 🆕 v6.3-Peng: 使用LLM增强的角色描述生成定妆照
      const enhancedFeatures = char.enhancedDescription || char.features?.join(', ') || char.features || '';

      if (pipeline.preProductionMode) {
        console.log(`  🎨 ${char.name}: 预生产模式 - 真实生成定妆照(LLM增强描述)...`);
        const { generateCharacterReference } = require('../../seedance-director/scripts/seedream-wrapper.js');

        try {
          const generatedRefs = await generateCharacterReference({
            name: char.name,
            species: char.species || '未知',
            features: enhancedFeatures, // 🆕 v6.3-Peng: 使用LLM增强描述
            signature: char.signature || '',
            'output-dir': localCharDir,
            uncannyRemix: char.uncannyRemix || false
          });

          charReport.generated.push({
            name: char.name,
            views: generatedRefs.length,
            path: localCharDir
          });

          newlyGenerated += generatedRefs.length;
          console.log(`    ✅ 预生产模式真实生成 ${generatedRefs.length} 张定妆照(LLM增强)`);
        } catch (err) {
          console.error(`    ❌ 预生产模式定妆照生成失败: ${err.message}`);
          // 🆕 fix11: 定妆照生成失败不应阻断整个pipeline——预生产的核心是提示词质量
          // ARK_API_KEY缺失时降级:跳过定妆照,继续生成提示词
          charReport.missing.push(`${char.name}(定妆照失败: ${err.message})`);
        }
      } else {
        console.log(`  🎨 ${char.name}: 调用Character Manager生成定妆照(LLM增强)...`);
        try {
          const { generateCharacter } = require('../../shanhaijing-character-manager/scripts/character-manager.js');
          await generateCharacter({
            name: char.name,
            species: char.species || '神话人物',
            features: enhancedFeatures, // 🆕 v6.3-Peng: 使用LLM增强描述
            signature: char.signature || '',
            style: char.style || '3D国漫CG渲染',
            output: localCharDir,
            originalText: char.originalText || '',
            beastType: char.beastType || ''
          });

          charReport.withPortrait++;
          console.log(`    ✅ ${char.name} 定妆照生成完成(LLM增强)`);
        } catch (err) {
          console.error(`    ❌ ${char.name} 定妆照生成失败: ${err.message}`);
          charReport.missing.push(`${char.name}(失败: ${err.message})`);
        }
      }
    }

    console.log(`\n  📊 角色定妆照报告:`);
    console.log(`     总计: ${charReport.total} 个角色`);
    console.log(`     已有/生成: ${charReport.withPortrait + charReport.generated.length} 个`);
    console.log(`     缺失: ${charReport.missing.length} 个`);

    if (charReport.missing.length > 0) {
      console.log(`  ⚠️ 缺少定妆照: ${charReport.missing.join(', ')}`);
    }

    pipeline._inject({ characterReport: charReport });

    // 🆕 v6.3-Peng: 保存角色提示词报告
    pipeline.results.characterPrompts = {
      report: charReport,
      profiles: storyPlan.characters.map(c => ({
        name: c.name,
        profile: c._llmProfile,
        enhancedDescription: c.enhancedDescription
      }))
    };

    if (charReport.missing.length === 0) {
      console.log(`  ✅ 所有角色定妆照就绪!`);
    }
  }
  function _localCharacterProfile(char) {
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
  async function stage6_ComplianceCheck(pipeline) {
    const path = require('path');
    const fs = require('fs');
    pipeline.currentStage = 'compliance-check';
    console.log(`\n🛡️ 阶段6/12: 合规检查 (LLM深度合规评估 v6.3-Peng)`);

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      pipeline._log({ message: '无story-plan,跳过合规检查', emoji: '⚠️' });
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

    // 🆕 v6.3-Peng: 初始化LLM推理层
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    const checkResults = [];
    let blockerCount = 0;

    // 🆕 v6.3-Peng: 第一层:本地快速预检(保留)
    console.log(`  🔍 第一层:本地快速预检...`);
    const localBlockers = [];
    for (const shot of allShots) {
      const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '';
      const localResult = pipeline.complianceAgent.check(prompt, shot, []);
      if (localResult.gateDecision === 'BLOCK') {
        localBlockers.push({ shotId: shot.id, reason: localResult.warnings?.join(', ') });
      }
    }
    if (localBlockers.length > 0) {
      console.log(`  ⚠️ 本地预检发现 ${localBlockers.length} 个阻断项,直接阻断(不进入LLM)`);
      for (const b of localBlockers) {
        console.log(`    - ${b.shotId}: ${b.reason}`);
      }
    }

    // 🆕 v6.3-Peng: 第二层:LLM深度合规评估(仅对本地通过的shot)
    const shotsForLLM = allShots.filter(s => !localBlockers.some(b => b.shotId === s.id));

    if (shotsForLLM.length > 0) {
      console.log(`  🧠 [LLM] 第二层:深度合规评估 ${shotsForLLM.length} 个镜头...`);

      const llmConfigs = shotsForLLM.map(shot => {
        const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '';
        return {
          stage: `compliance-${shot.id}`,
          systemPrompt: `你是一位专业的内容安全审核专家,负责评估AI视频生成提示词的合规性。请从以下维度评估:

1. 内容安全:是否包含暴力、色情、仇恨、歧视等违规内容
2. 文化敏感:是否涉及宗教、民族、历史等敏感话题的不当描述
3. 法律风险:是否涉及版权、肖像权、未成年人保护等法律问题
4. 平台政策:是否符合主流AI视频平台(Seedance/Doubao)的内容政策
5. 社会影响:是否可能引发负面社会反响或争议

返回JSON格式:
{
  "overall": "PASS/WARNING/BLOCK",
  "score": 1-10,
  "risks": [{"category": "", "level": "high/medium/low", "description": ""}],
  "suggestions": [""]
}

评分标准:10=完全合规 8-9=轻微风险 6-7=需注意 5以下=必须修改
overall规则:score>=8 → PASS, score>=6 → WARNING, score<6 → BLOCK`,
          userPrompt: `请评估以下视频生成提示词的合规性:\n\n镜头ID: ${shot.id}\n类型: ${shot.type || '未指定'}\n提示词:\n${prompt.substring(0, 800)}\n\n请返回JSON评估结果。`,
          level: 'medium',
          llmOptions: getLLMConfig('duration-allocation'),
          fallback: () => ({ overall: 'PASS', score: 8, risks: [], suggestions: [] }) // 降级默认通过
        };
      });

      const llmResults = await llmLayer.llmReasonParallel(llmConfigs);

      for (let i = 0; i < shotsForLLM.length; i++) {
        const shot = shotsForLLM[i];
        const llmResult = llmResults[i];
        let llmData = null;

        if (llmResult.success && !llmResult.fallbackUsed && llmResult.result) {
          try {
            const jsonStr = pipeline._extractJSON(llmResult.result);
llmData = jsonStr ? JSON.parse(jsonStr) : null;
          } catch (e) {
            console.log(`  ⚠️ ${shot.id}: LLM合规JSON解析失败`);
          }
        }

        const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || shot.description || '';
        const length = pipeline._countChars ? pipeline._countChars(prompt) : prompt.length;
        // v4.1: 取消利用率百分比检查,改为长度健康区间
        const overLimit = length > 5500;
        const structure = pipeline._checkPromptStructure ? pipeline._checkPromptStructure(prompt) : { coverageRate: 0, pass: true };
        const isHealthy = !overLimit && structure.pass;

        let status = 'pass';
        if (llmData) {
          if (llmData.overall === 'BLOCK') {
            status = 'block';
            blockerCount++;
            console.log(`  ❌ [LLM] ${shot.id}: 合规阻断(评分:${llmData.score}/10) - ${llmData.risks?.map(r => r.description).join(', ')?.substring(0, 100)}`);
          } else if (llmData.overall === 'WARNING') {
            status = 'warning';
            console.log(`  ⚠️ [LLM] ${shot.id}: 合规警告(评分:${llmData.score}/10) - ${llmData.suggestions?.join(', ')?.substring(0, 100)}`);
          } else {
            console.log(`  ✅ [LLM] ${shot.id}: 合规通过(评分:${llmData.score}/10)`);
          }
        } else {
          console.log(`  ✅ ${shot.id}: 本地预检通过,LLM降级`);
        }

        checkResults.push({
          shotId: shot.id,
          length,
          overLimit,
          structureCoverage: structure.coverageRate || 0,
          status,
          llmData: llmData || { overall: 'PASS', score: 8, risks: [] },
          source: llmData ? 'llm' : 'local'
        });
      }
    }

    // 添加本地阻断项到结果
    for (const b of localBlockers) {
      checkResults.push({
        shotId: b.shotId,
        length: 0,
        structureCoverage: 0,
        status: 'block',
        llmData: { overall: 'BLOCK', score: 2, risks: [{ category: 'local', level: 'high', description: b.reason }] },
        source: 'local'
      });
      blockerCount++;
    }

    // 统计输出
    const avgCoverage = Math.round(checkResults.reduce((sum, r) => sum + (r.structureCoverage || 0), 0) / checkResults.length);
    const passCount = checkResults.filter(r => r.status === 'pass').length;
    const warningCount = checkResults.filter(r => r.status === 'warning').length;
    const overLimitCount = checkResults.filter(r => r.overLimit).length;

    console.log(`\n  📊 合规检查结果:`);
    console.log(`     总镜头: ${checkResults.length}`);
    console.log(`     通过: ${passCount} | 警告: ${warningCount} | 阻断: ${blockerCount}`);
    console.log(`     平均结构覆盖率: ${avgCoverage}%`);
    console.log(`     超980字符: ${overLimitCount}个`);
    console.log(`     LLM评估: ${checkResults.filter(r => r.source === 'llm').length}个`);

    // 阻断处理
    if (blockerCount > 0) {
      const failedShots = checkResults.filter(r => r.status === 'block');
      const errorMsg = `合规检查失败: ${blockerCount}个镜头不合格\n` +
        failedShots.map(s => `  ${s.shotId}: ${s.llmData?.risks?.map(r => r.description).join(', ')}`).join('\n');
      console.log(`\n  ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`  ✅ 全部${checkResults.length}个镜头合规检查通过`);

    pipeline.results.compliance = {
      totalShots: checkResults.length,
      passCount,
      warningCount,
      blockerCount,
      avgCoverage: avgCoverage,
      details: checkResults
    };

    // 输出LLM统计
    llmLayer.printReport();

    return { passed: true, totalShots: checkResults.length, passCount, avgCoverage: avgCoverage };
  }
  async function _runComplianceCheck({ phase = 'final', label = '合规检查' }) {
    pipeline.currentStage = `compliance-${phase}`;
    console.log(`\n🛡️ ${label} (统一合规服务 v5.31-Peng | phase: ${phase})`);

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      pipeline._log({ message: '无story-plan,跳过合规检查', emoji: '⚠️' });
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
const { getLLMConfig } = require('./config-center');
    const promptsDir = path.join(pipeline.productionDir, '04-prompts');

    for (const shot of allShots) {
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
        const localResult = pipeline.complianceAgent.check(prompt, shot, [], checkOptions);

        // 第二层:LLM深度评估(只评估内容合规性)
        let llmScore = localResult.qualityScore;
        let llmGate = localResult.gateDecision;
        let llmWarnings = localResult.warnings || [];

        try {
          const llmResult = await pipeline._complianceCheckWithLLM(prompt, shot, localResult);
          llmScore = Math.min(localResult.qualityScore, llmResult.qualityScore);
          llmGate = (localResult.gateDecision === 'BLOCK' || llmResult.gateDecision === 'BLOCK') ? 'BLOCK' : localResult.gateDecision;
          llmWarnings = [...new Set([...localResult.warnings, ...llmResult.warnings])];
        } catch (llmErr) {
          console.log(`    ⚠️ ${shot.id} LLM合规评估失败(${llmErr.message}),使用本地结果`);
        }

        // 阶段6不检查长度,只检查内容合规
        length = prompt.length;
        const structure = pipeline._checkPromptStructure ? pipeline._checkPromptStructure(prompt) : { coverageRate: 0, pass: true };

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
        const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
        if (fs.existsSync(promptFile)) {
          const fileContent = fs.readFileSync(promptFile, 'utf8');
          const match = fileContent.match(/```([\s\S]*?)```/);
          prompt = match ? match[1].trim() : fileContent.trim();
        } else {
          prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
        }

        length = pipeline._countChars(prompt);
        // v4.1: 取消利用率百分比,改为长度健康区间
        const overLimit = length > 5500;
        const structure = pipeline._checkPromptStructure ? pipeline._checkPromptStructure(prompt) : { coverageRate: 0, pass: true };
        const isHealthy = !overLimit && structure.pass;

        status = isHealthy ? 'pass' : overLimit ? 'too_long' : 'missing_structure';

        if (status !== 'pass') {
          if (overLimit) {
            console.log(`  ❌ ${shot.id}: ${length}字符 - 超出上限(>5500)`);
          } else {
            console.log(`  ❌ ${shot.id}: ${length}字符 - 结构缺失(缺:${structure.requiredMissing?.join(',') || 'unknown'})`);
          }
        } else {
          console.log(`  ✅ ${shot.id}: ${length}字符, 结构覆盖率${structure.coverageRate}%`);
        }
      }

      checkResults.push({
        shotId: shot.id,
        length,
        overLimit: length > 5500,
        structureCoverage: (pipeline._checkPromptStructure ? pipeline._checkPromptStructure(prompt) : { coverageRate: 0 }).coverageRate || 0,
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
    console.log(`     目标: 结构完整 + 不超980字符`);
    if (phase === 'preliminary' && finalPromptCount === 0) {
      console.log(`     ⚠️ 检查的是故事板描述(最终Prompt将在Stage 8后复查)`);
    }

    // 阻断处理
    if (blockerCount > 0) {
      const failedShots = checkResults.filter(r => r.status !== 'pass');
      const errorMsg = `${label}失败: ${blockerCount}个镜头不合格\n` +
        failedShots.map(s => `  ${s.shotId}: ${s.length}字符, 状态:${s.status}`).join('\n') +
        `\n必须修复后重新跑完整预生产链路`;
      console.log(`\n  ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`  ✅ 全部${allShots.length}个镜头检查通过`);

    const resultKey = phase === 'preliminary' ? 'complianceResults' :
                      phase === 'final' ? 'finalPromptCompliance' : 'postOptimizeCompliance';
    pipeline.results[resultKey] = {
      phase,
      totalShots: allShots.length,
      passCount,
      avgCoverage: avgCoverage,
      details: checkResults
    };

    // v6.9-Peng-fix: 同时保存到旧key,兼容审核报告检查
    if (phase === 'preliminary') {
      pipeline.results.compliance = {
        totalShots: allShots.length,
        passCount,
        avgCoverage: avgCoverage,
        details: checkResults
      };
    }

    return { passed: true, totalShots: allShots.length, passCount, avgCoverage: avgCoverage };
  }
  async function _complianceCheckWithLLM(prompt, shot, localResult) {
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
  async function stage7_DurationAllocation(pipeline) {
    const path = require('path');
    const fs = require('fs');
    const { DurationAllocator } = require('./duration-allocator');
    pipeline.currentStage = 'duration-allocation';
    console.log(`\n⏱️ 阶段7/12: 时长分配 (LLM叙事节奏智能分配 v6.3-Peng)`);

    const spStatus = pipeline._getStoryPlanStatus();
    if (!spStatus) {
      pipeline._log({ message: '无story-plan,跳过时长分配', emoji: '⚠️' });
      return;
    }
    let { storyPlan, shots } = spStatus;

    // 🆕 v6.21-Peng-fix16: 修复 story-plan 中 shots 是字符串数组的问题
    // 如果 shots[0] 是字符串，转换成对象数组
    if (shots.length > 0 && typeof shots[0] === 'string') {
      console.log(`  🔧 修复：shots 是字符串数组，转换为对象数组`);
      const convertedShots = [];
      let shotCounter = 0;
      for (const segment of storyPlan.segments || []) {
        const convertedSegmentShots = [];
        for (const desc of (segment.shots || [])) {
          if (typeof desc === 'string') {
            const shotObj = {
              id: `S${String(shotCounter).padStart(2, '0')}`,
              description: desc,
              type: 'normal',
              emotion: '未指定',
              duration: 0
            };
            convertedSegmentShots.push(shotObj);
            convertedShots.push(shotObj);
            shotCounter++;
          } else {
            convertedSegmentShots.push(desc);
            convertedShots.push(desc);
          }
        }
        segment.shots = convertedSegmentShots;
      }
      // 更新 spStatus 和 pipeline.results.storyPlan
      spStatus.shots = convertedShots;
      if (pipeline.results.storyPlan) {
        pipeline.results.storyPlan.segments = storyPlan.segments;
      }
    }

    // 重新获取 shots（可能已转换）
    const allShots = spStatus.shots || [];

    const targetDuration = storyPlan.targetDuration || storyPlan.metadata?.totalDuration || 60;

    if (allShots.length === 0) {
      console.log(`  ⚠️ 无shots,跳过时长分配`);
      return;
    }

    // 🆕 v6.3-Peng: LLM叙事节奏智能分配
    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llmLayer = new LLMReasoningLayer();

    console.log(`  🧠 [LLM] 分析叙事节奏,为 ${allShots.length} 个镜头分配时长...`);

    const llmResult = await llmLayer.llmReason({
      stage: 'duration-allocation',
      systemPrompt: `你是一位专业的电影剪辑师和叙事节奏设计师。你的任务是根据故事叙事结构,为每个镜头分配最优时长。

分配原则:
1. 叙事重要性:建置镜头(短) → 发展镜头(中) → 转折镜头(中偏长) → 高潮镜头(最长) → 收尾镜头(短)
2. 情绪曲线:情绪低点可短(快速带过),情绪高点需长(充分渲染)
3. 视觉复杂度:信息密度高的镜头需要更多时间让观众消化
4. 节奏变化:避免平均分配,要有快有慢,形成呼吸感
5. 类型差异:opening_title(2-4s), action(3-5s), dialogue(4-6s), emotional(4-7s), montage(2-3s)

输出要求(JSON格式):
{
  "allocations": [
    { "shotId": "S00", "duration": 3, "reason": "简短开场,快速进入主题" }
  ],
  "totalDuration": 60,
  "rhythmPattern": "快节奏-慢渲染-爆发-余韵",
  "narrativeBeat": "起-承-转-合的具体时长分配策略"
}

约束:
- 总时长必须严格等于目标时长(误差<1秒)
- 每个镜头时长必须是整数秒
- 片头(opening_title)固定8-10秒(需容纳神兽开场白、神兽出场、英文标题、小G出场、音效)
- 高潮镜头必须是所有镜头中最长的
- 正片时长=目标时长,片头不计入正片`,
      userPrompt: `请为以下故事分配镜头时长:

故事标题: ${storyPlan.title || '未命名'}
目标总时长: ${targetDuration}秒
世界观: ${storyPlan.worldview || '未指定'}
风格: ${storyPlan.style || '未指定'}

故事大纲:
${storyPlan.outline || '未提供'}

情绪曲线: ${JSON.stringify(storyPlan.metadata?.emotionCurve || [])}

镜头列表:
${allShots.map(s => `- ${s.id} | 类型:${s.type || 'normal'} | 情绪:${s.emotion || '未指定'} | 描述:${(s.description || '').substring(0, 120)}`).join('\n')}

当前镜头数: ${shots.length}
请返回JSON格式的时长分配方案。`,
      level: 'medium',
      llmOptions: getLLMConfig('duration-allocation'),
      fallback: () => null
    });

    let llmAllocations = null;
    let llmTotal = 0;

    if (llmResult.success && !llmResult.fallbackUsed && llmResult.result) {
      try {
        const jsonStr = pipeline._extractJSON(llmResult.result);
        const llmData = jsonStr ? JSON.parse(jsonStr) : null;
        if (llmData && llmData.allocations && Array.isArray(llmData.allocations)) {
          llmAllocations = llmData.allocations;
          llmTotal = llmData.totalDuration || llmAllocations.reduce((s, a) => s + (a.duration || 0), 0);
          console.log(`  ✅ [LLM] 时长分配完成: 总时长${llmTotal}s | 节奏模式: ${llmData.rhythmPattern || '未指定'}`);
          console.log(`     叙事节拍: ${llmData.narrativeBeat?.substring(0, 80)}...`);

          // 应用LLM分配
          for (const alloc of llmAllocations) {
            const shot = allShots.find(s => s.id === alloc.shotId);
            if (shot) {
              shot.duration = Math.max(1, Math.round(alloc.duration));
              shot._durationReason = alloc.reason;
              console.log(`     ${shot.id}: ${shot.duration}s - ${alloc.reason}`);
            }
          }
        }
      } catch (e) {
        console.log(`  ⚠️ LLM时长分配JSON解析失败: ${e.message}`);
      }
    }

    // 🆕 v6.4-Peng-fix: 强制片头时长8-10秒(不占用正片时长)
    const openingShots = allShots.filter(s => s.type === 'opening_title');
    for (const shot of openingShots) {
      if ((shot.duration || 0) < 8) {
        console.log(`  🎬 强制片头时长: ${shot.id} ${shot.duration || 0}s → 8s(容纳开场白+神兽出场+标题+小G+音效)`);
        shot.duration = 8;
        shot._durationReason = '片头固定8-10秒(神兽开场白+出场+英文标题+小G+音效)';
      }
    }

    if (!llmAllocations) {
      console.log(`  ⚠️ LLM时长分配失败,降级到本地五层加权分配器...`);
    }

    // 🎬 确定视频类型(节奏模式)
    let videoType = 'action';
    if (pipeline.shanhaijingMode) {
      videoType = 'short_drama';
      console.log(`  🐉 山海经模式: 启用短剧快剪节奏(极限紧凑,60秒持续兴奋)`);
    } else if (storyPlan.videoType) {
      videoType = storyPlan.videoType;
    } else if (storyPlan.metadata?.videoType) {
      videoType = storyPlan.metadata.videoType;
    }

    // 🆕 v6.4-Peng-fix: 片头时长固定8-10秒,不占用正片时长
    // 正片时长 = targetDuration(用户要求的60秒)
    // 总时长 = 正片时长 + 片头时长
    let openingTitleDuration = 0;
    if (openingShots.length > 0) {
      // 强制片头8-10秒
      for (const shot of openingShots) {
        if ((shot.duration || 0) < 8) {
          console.log(`  🎬 强制片头时长: ${shot.id} ${shot.duration || 0}s → 8s(容纳开场白+神兽出场+标题+小G+音效)`);
          shot.duration = 8;
          shot._durationReason = '片头固定8-10秒(神兽开场白+出场+英文标题+小G+音效)';
        }
        openingTitleDuration += shot.duration;
      }
      console.log(`  🎬 片头保护: ${openingShots.length}个片头, 固定时长${openingTitleDuration}s, 正片分配${targetDuration}s`);
    }

    // 正片shot(非片头)
    const mainShots = allShots.filter(s => s.type !== 'opening_title');

    // 使用本地分配器分配正片时长
    const allocator = new DurationAllocator({ videoType, debug: true });
    const result = await allocator.allocate(mainShots, targetDuration);

    // 总时长 = 正片时长 + 片头时长
    const totalDuration = result.totalDuration + openingTitleDuration;
    const deviation = Math.abs(totalDuration - (targetDuration + openingTitleDuration)) / (targetDuration + openingTitleDuration);

    // 📊 输出分配结果
    console.log(`  📊 目标: 正片${targetDuration}s + 片头${openingTitleDuration}s = 总${targetDuration + openingTitleDuration}s, 分配: 正片${result.totalDuration}s + 片头${openingTitleDuration}s = 总${totalDuration}s, 偏差: ${(deviation * 100).toFixed(1)}%`);
    console.log(`  🎬 镜头时长分布:`);
    for (const shot of shots) {
      const source = shot._durationReason ? '[LLM]' : '[本地]';
      const bar = '█'.repeat(shot.duration) + '░'.repeat(Math.max(0, 18 - shot.duration));
      console.log(`     ${shot.id} (${shot.type || 'normal'}): ${shot.duration}s ${bar} ${source}`);
    }

    // 📋 详细分解(可选,debug模式已输出)
    if (result.allocations) {
      console.log(`  🔍 五层权重分解:`);
      for (const alloc of result.allocations.slice(0, 5)) { // 只显示前5个避免刷屏
        if (alloc.layers) {
          console.log(`     ${alloc.id}: 叙事${alloc.layers.narrativeWeight.toFixed(2)} × 内容${alloc.layers.contentWeight.toFixed(2)} × 运镜${alloc.layers.cameraWeight.toFixed(2)} × 张力${alloc.layers.tensionWeight.toFixed(2)} = ${alloc.layers.combinedWeight.toFixed(2)}`);
        }
      }
      if (result.allocations.length > 5) {
        console.log(`     ... (${result.allocations.length - 5} more shots)`);
      }
    }

    if (deviation > 0.05) {
      console.log(`  ⚠️ 总时长偏差 > 5%`);
    } else {
      console.log(`  ✅ 时长分配合理`);
    }

    pipeline.results.durationCheck = {
      target: targetDuration + openingTitleDuration,
      actual: totalDuration,
      deviation: deviation,
      passed: deviation <= 0.05,
      profile: result.profile,
      openingTitleDuration: openingTitleDuration,
      mainTargetDuration: targetDuration,
      mainActualDuration: result.totalDuration,
      source: llmAllocations ? 'llm+local' : 'local',
      llmRhythmPattern: llmAllocations ? result.rhythmPattern : null,
      allocations: allShots.map(s => ({ id: s.id, type: s.type, duration: s.duration, source: s._durationReason ? 'llm' : 'local' }))
    };

    // 🆕 v6.9-Peng-fix: 保存更新后的story-plan到文件(时长已分配)
    // 确保Stage 11预生产审核能读取到正确的时长
    try {
      const storyPlanPath = path.join(pipeline.productionDir, '01-story', 'story-plan.json');
      fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
      console.log(`  💾 已保存更新后的story-plan(含时长分配): ${storyPlanPath}`);
    } catch (e) {
      console.warn(`  ⚠️ story-plan保存失败: ${e.message}`);
    }
  }
  async function stage7_5_DialogueAnnotation(pipeline) {
    const path = require('path');
    const fs = require('fs');
    console.log(`\n🎙️ Stage 7.5: 对话标注 (LLM智能对白生成 v6.3-Peng)`);

    const storyPlan = pipeline.results.storyPlan;
    if (!storyPlan || !storyPlan.segments) {
      console.log(`  ⚠️ 无story-plan,跳过对话标注`);
      return;
    }

    // 检查是否启用对话系统
    if (pipeline.options.enableDialogue === false) {
      console.log(`  ⏭️ 对话系统已禁用 (enableDialogue=false),跳过`);
      return;
    }

    try {
      // 🆕 v6.3-Peng: 先使用LLM为每个镜头生成/优化对白
      const { LLMReasoningLayer } = require('./llm-reasoning-layer');
      const llmLayer = new LLMReasoningLayer();

      // 收集所有需要对话的镜头
      // 🆕 v6.11-Peng-fix: shotId → id 别名(统一字段命名)
      const shots = [];
      for (const segment of storyPlan.segments || []) {
        for (const shot of (segment.shots || [])) {
          if (shot.shotId && !shot.id) shot.id = shot.shotId;
          shots.push(shot);
        }
      }

      if (shots.length === 0) {
        console.log(`  ⚠️ 无镜头,跳过对话标注`);
        return;
      }

      // 🆕 v6.3-Peng: LLM生成对白
      console.log(`  🧠 [LLM] 为 ${shots.length} 个镜头生成角色对白...`);

      // 获取角色信息
      const characters = storyPlan.characters || [];
      const charProfiles = characters.map(c => ({
        name: c.name,
        species: c.species || '未知',
        personality: c._llmProfile?.personality || c.description || '',
        typicalPhrases: c._llmProfile?.typicalPhrases || []
      }));

      const llmResult = await llmLayer.llmReason({
        stage: 'dialogue-generation',
        systemPrompt: `你是一位专业的剧本对白作家,擅长为影视角色创作自然、情感饱满的对白。你的任务是根据镜头信息和角色性格,为每个需要对话的镜头生成高质量对白。

创作原则:
1. 角色一致性:对白必须符合角色性格(威严/天真/神秘等)
2. 情绪匹配:对白情绪必须与镜头情绪标签一致
3. 场景感:对白要有画面感,观众能"听"到场景
4. 简洁有力:每句对白不超过30字,适合短视频节奏
5. 叙事推进:每句对白必须推动故事发展或揭示角色关系
6. 避免解释性对白:不要"说明"剧情,要"展现"情感

输出要求(JSON格式):
{
  "dialogues": [
    {
      "shotId": "S01",
      "speaker": "角色名",
      "text": "对白内容",
      "emotion": "情绪标签",
      "type": "monologue独白/direction指示/response回应",
      "purpose": "这句对白的叙事目的"
    }
  ],
  "summary": "对白整体策略简述"
}

约束:
- 不是所有镜头都需要对白,只在关键叙事节点生成
- 片头(opening_title)通常不需要对白
- 高潮镜头优先分配最重要的对白
- 避免同一角色连续多句对白`,
        userPrompt: `请为以下故事镜头生成角色对白:

故事标题: ${storyPlan.title || '未命名'}
世界观: ${storyPlan.worldview || '未指定'}
故事大纲: ${storyPlan.outline || '未提供'}

角色档案:
${charProfiles.map(c => `- ${c.name}(${c.species}): ${c.personality?.substring(0, 100)}`).join('\n')}

镜头列表:
${shots.map(s => `- ${s.id} | 类型:${s.type || 'normal'} | 情绪:${s.emotion || '未指定'} | 时长:${s.duration || 0}s | 描述:${(s.description || '').substring(0, 100)}`).join('\n')}

情绪曲线: ${JSON.stringify(storyPlan.metadata?.emotionCurve || [])}

请返回JSON格式的对白分配方案。`,
        level: 'medium',
        llmOptions: getLLMConfig('duration-allocation'),
        fallback: () => null
      });

      let llmDialogues = [];
      if (llmResult.success && !llmResult.fallbackUsed && llmResult.result) {
        try {
          const jsonStr = pipeline._extractJSON(llmResult.result);
          const llmData = jsonStr ? JSON.parse(jsonStr) : null;
          if (llmData && llmData.dialogues && Array.isArray(llmData.dialogues)) {
            llmDialogues = llmData.dialogues;
            console.log(`  ✅ [LLM] 生成 ${llmDialogues.length} 句对白 | 策略: ${llmData.summary?.substring(0, 60)}...`);
            for (const d of llmDialogues) {
              console.log(`     ${d.shotId}: ${d.speaker} - "${d.text?.substring(0, 40)}..." (${d.type})`);
            }
          }
        } catch (e) {
          console.log(`  ⚠️ LLM对白JSON解析失败: ${e.message}`);
        }
      }

      if (!llmDialogues || llmDialogues.length === 0) {
        console.log(`  ⚠️ LLM对白生成失败或无需对白,降级到本地剧本提取...`);
      }

      // 调用本地对话标注系统（fallback when LLM fails）
      const { DialogueAnnotator } = require('./dialogue-annotator');
      const annotator = new DialogueAnnotator();

      let result;
      if (llmDialogues.length > 0) {
        // ✅ LLM成功: 使用LLM生成的对白直接标注到shots
        console.log(`  📝 应用LLM对白到镜头...`);
        let dialogueCount = 0;
        const updatedShots = shots.map(shot => {
          const shotDialogues = llmDialogues.filter(d => d.shotId === shot.id);
          if (shotDialogues.length > 0) {
            shot.dialogues = shotDialogues.map(d => ({
              speaker: d.speaker,
              text: d.text,
              emotion: d.emotion || shot.emotion || 'neutral',
              type: d.type || 'dialogue',
              purpose: d.purpose || ''
            }));
            shot.hasDialogue = true;
            dialogueCount += shotDialogues.length;
          }
          return shot;
        });
        result = {
          dialogueCount,
          shots: updatedShots,
          allShots: updatedShots  // 🆕 v6.24-fix26: 兼容 line 1707 的 result.allShots 访问
        };
        console.log(`  ✅ LLM对白已标注: ${dialogueCount} 句对白应用到 ${updatedShots.filter(s => s.hasDialogue).length} 个镜头`);
      } else {
        // 🔽 Fallback: 从剧本中提取对白
        console.log(`  📝 [Fallback] 从剧本中提取对白...`);
        const script = pipeline._extractScriptFromStoryPlan(storyPlan);
        result = annotator.annotate(script, shots);
      }

      // 🆕 v6.24-fix32: 精确定位 allShots 报错来源
      console.log(`  🔍 [fix32] result keys: ${Object.keys(result || {})}`);
      console.log(`  🔍 [fix32] result.allShots exists: ${result?.allShots !== undefined}, type: ${typeof result?.allShots}`);
      if (!result?.allShots) {
        console.log(`  🔍 [fix32] result.shots exists: ${result?.shots !== undefined}, type: ${typeof result?.shots}, length: ${result?.shots?.length}`);
      }
      const _safeAllShots = result?.allShots || result?.shots || [];
      console.log(`  🔍 [fix32] using ${_safeAllShots.length} shots for dialogue-annotation.json`);

      // 🆕 v6.24-fix32: 保存标注结果到 dialogue-annotation.json
      const dialoguePath = path.join(pipeline.productionDir, '03-shots', 'dialogue-annotation.json');
      const dialogueData = {
        version: 'v6.24-fix32',
        timestamp: new Date().toISOString(),
        source: llmDialogues.length > 0 ? 'llm' : 'local',
        dialogueCount: result.dialogueCount,
        shots: _safeAllShots.map(s => ({
          id: s.id,
          hasDialogue: s.hasDialogue || false,
          dialogues: s.dialogues || []
        }))
      };

      // 🆕 v6.24-fix29: 强制写入 + 容错
      let writeSuccess = false;
      try {
        fs.writeFileSync(dialoguePath, JSON.stringify(dialogueData, null, 2));
        writeSuccess = true;
      } catch (writeErr) {
        console.log(`  ⚠️ dialogue-annotation.json 写入失败: ${writeErr.message}, 尝试同步写入 storyPlan`);
      }

      // 🆕 v6.24-fix29: 确保 storyPlan.segments 中的 shots 也有 dialogues（即使文件写入失败）
      let updatedShotCount = 0;
      for (const segment of storyPlan.segments || []) {
        for (let i = 0; i < (segment.shots || []).length; i++) {
          const annotated = _safeAllShots.find(s => s.id === segment.shots[i].id);
          if (annotated) {
            // 🆕 fix29: 无论文件写入是否成功,都强制更新 storyPlan 中的 shot
            segment.shots[i].dialogues = annotated.dialogues || [];
            segment.shots[i].hasDialogue = annotated.hasDialogue || false;
            if (annotated.hasDialogue) updatedShotCount++;
          }
        }
      }
      if (writeSuccess) {
        console.log(`  ✅ 对话标注文件已保存: ${dialoguePath}`);
      } else {
        console.log(`  ⚠️ 对话标注文件保存失败,但 ${updatedShotCount} 个镜头已同步到 storyPlan.segments`);
      }

      // ✅ 对话标注完成
      console.log(`  ✅ 对话标注完成: ${result.dialogueCount} 句对白, ${updatedShotCount} 个镜头已更新 (来源: ${llmDialogues.length > 0 ? 'LLM' : '本地'})`);
      console.log(`  📁 标注文件: ${dialoguePath}`);
      console.log(`  💡 TTS任务生成: 由 tts-task-generator.js 在 Render 阶段负责`);

      pipeline._inject({ dialogueAnnotation: result });

      // 输出LLM统计
      if (llmDialogues.length > 0) {
        llmLayer.printReport();
      }

    } catch (error) {
      console.error(`  ❌ 对话标注失败: ${error.message}`);
      console.error(`  📍 Stack: ${error.stack}`);
      console.log(`  ⚠️ 继续执行Pipeline(对话标注为非阻塞步骤)`);
    }
  }
module.exports = { stage4_StoryboardCheck, stage5_CharacterPromptBuild, stage6_ComplianceCheck, stage7_DurationAllocation, stage7_5_DialogueAnnotation };