/**
 * stage8-pregeneration.js
 * Stage 8.2 Prompt预生成 - 从 director-pipeline.js 抽取
 * 调用: await stage8_PromptPreGeneration(pipeline)
 */
const path = require('path');
const { getStoryPlanStatus, saveStoryPlan } = require('./story-plan-service');
const { ensureDir, writeTextSafe } = require('./pipeline-helpers');
const { buildShotContext } = require('./stage8-support');
const { _stage83_QualityCalibration } = require('./pipeline-stage8-quality');
// v6.27-Peng: 统一S00识别函数（替代本地分散条件）
const { isOpeningTitleShot } = require('./prompt-final-normalizer');

async function stage8_PromptPreGeneration(pipeline) {
  pipeline.currentStage = 'prompt-pre-generation';
  console.log(`\n📝 阶段8.2/12: 提示词预生成 (LLM电影感生成 v6.2-Peng)`);

  const spStatus = getStoryPlanStatus(pipeline.productionDir, pipeline.results.storyPlan);
  if (!spStatus) {
    pipeline._log({ message: '无storyPlan,跳过提示词预生成', emoji: '⚠️' });
    return;
  }
  const { storyPlan } = spStatus;

  const { generateShotPrompt, PROMPT_MAX_LENGTH } = require('../../seedance-render-engine/scripts/seedance-render-engine');

  const shots = [];
  for (const seg of storyPlan.segments || []) {
    for (const shot of (seg.shots || [])) {
      // 🆕 fix15-v6: 统一 shot.id (beat-sheet-generated shots 只有 name,没有 id)
      if (!shot.id && shot.name) {
        shot.id = shot.name;
      }
      shots.push(shot);
    }
  }

  // 并发生成每个镜头的Prompt
  const promptResults = [];
  const batchSize = 3;

  // 🆕 fix15-v4: 预绑定所有shot的角色定妆照引用
  // 根因: 生成shot prompt时需要 _characterRefs 注入实际路径
  // 但 discoverCharacterRefs 只在 render() 阶段才被调用，导致stage8.2看不到路径
  // 修复: stage8_2 开始前调用一次 discoverCharacterRefs,为所有shot写入 _characterRefs
  try {
    const { discoverCharacterRefs } = require('../../seedance-render-engine/scripts/seedance-render-engine');
    const allShots = discoverCharacterRefs(pipeline.productionDir, { shots }, storyPlan);
    // 调试: 验证 shot._characterRefs 已被设置
    let boundCount = 0;
    for (const s of shots) {
      if (s._characterRefs && Object.keys(s._characterRefs).length > 0) boundCount++;
    }
    console.log(`  [Stage8.2] 🆕 fix15-v4: 预绑定定妆照路径 (发现 ${allShots.length} 张, ${boundCount}/${shots.length} shots绑定)`);
  } catch (e) {
    console.warn(`  [Stage8.2] ⚠️ fix15-v4: 预绑定定妆照失败: ${e.message}`);
  }

  for (let i = 0; i < shots.length; i += batchSize) {
    const batch = shots.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (shot, batchIdx) => {
        const globalIdx = i + batchIdx;
        // 🆕 fix-v6.26: 优先用小写英文字段(Stage 3.5 LLM生成),不用大写中文P1字段
        const p1Scene = shot.scene || shot.Scene || '';
        const p1Action = shot.action || shot.Action || '';
        const p1Char = shot.character || shot.Character || '';
        if ((p1Scene.length > 30 || p1Action.length > 30) && p1Scene !== shot.scene) {
          if (!shot._p2_description) shot._p2_description = shot.description || '';
          const enrichedLines = [];
          if (p1Scene) enrichedLines.push(`Scene: ${p1Scene}`);
          if (p1Action) enrichedLines.push(`Action: ${p1Action}`);
          if (p1Char) enrichedLines.push(`Character: ${p1Char}`);
          shot._enrichedContext = enrichedLines.join(' | ');
          console.log(`  [hotfix] ${shot.id}: P1 enriched context stored (${enrichedLines.length} fields)`);
        }
        const shotContext = buildShotContext(shot, storyPlan);
        const dialogueEnhancement = pipeline.results.dialogues?.[shot.id]?.text || '';

        // v6.27-Peng: 统一片头识别 — 使用 prompt-final-normalizer 的 isOpeningTitleShot()
        // 片头shot完全跳过generateShotPrompt调用,直接使用_titleConfig.seedancePrompt
        if (isOpeningTitleShot(shot)) {
          const openingPrompt = shot._titleConfig?.seedancePrompt
            || shot._titleConfig?.scene
            || (shot.description ? `opening_title: ${shot.description}` : '');
          if (openingPrompt) {
            shot._generatedPrompt = openingPrompt;
            console.log(`  [Stage8.2] ⏭️ ${shot.id} 片头shot: 直接使用opening-title-design.json的seedancePrompt(${openingPrompt.length}字),跳过LLM生成`);
            return { shotId: shot.id, result: openingPrompt, index: globalIdx, skipped: 'opening_title' };
          } else {
            console.warn(`  [Stage8.2] ⚠️ ${shot.id} 片头shot但 _titleConfig.seedancePrompt 为空,继续走LLM生成`);
          }
        }

        try {
          // 🆕 v6.12-Peng-fix7: generateShotPrompt(shot, plan, refs, dialogueEnhancement, ...)
          // shot是正则参数1(shot对象本身), plan是参数2, refs是参数3
          // 🆕 fix15-v4: refs 从 shot._characterRefs 读取实际路径
          let refsForShot = [];
          if (shot._characterRefs) {
            for (const paths of Object.values(shot._characterRefs)) {
              refsForShot.push(...paths);
            }
          }
          const result = await generateShotPrompt(
            shot,                                    // shot对象(含.id)
            storyPlan,                               // plan/storyPlan
            { characterProfiles: storyPlan.characters, context: shotContext, refPaths: refsForShot }, // refs
            dialogueEnhancement,                      // 对白增强
            false,                                   // isMultiShot
            globalIdx                                // shotIndex
          );
          // 🆕 v6.11-Peng-fix2: generateShotPrompt返回string,同时设置shot._generatedPrompt
          // 根因: _stage83_QualityCalibration读取shot._generatedPrompt,但此处只返回result字符串未同步
          // 修复: 设置shot._generatedPrompt=result,这样calibration修改的是同一个字符串对象
          // File写入在calibration之后,从shot._generatedPrompt读,确保拿到最新校准后的内容
          shot._generatedPrompt = result;
          return { shotId: shot.id, result, index: globalIdx };
        } catch (e) {
          return { shotId: shot.id, result: null, error: e.message, index: globalIdx };
        }
      })
    );
    promptResults.push(...batchResults);
    console.log(`  批次${Math.floor(i / batchSize) + 1}: ${batch.length}个镜头完成`);
  }

  // 🆕 fix11-v6: early-gate检查——只警告不阻断,让SmartCalibration处理短prompt扩展
  // 策略: stage8_2产出<100字符时记录警告,进入stage83由SmartCalibration扩展,闸机检查最终质量
  // 真正的阻断只在stage83质检闸机(6个镜头全不合格才阻断pipeline)
  let earlyGateWarnings = 0;
  for (const pr of promptResults) {
    if (!pr.result) continue;
    const prompt = pr.result;
    const rawLen = (prompt || '').length;
    const shot = shots.find(s => s.id === pr.shotId);

    if (shot && shot.type === 'opening_title') {
      // S00片头:用开场标题seedancePrompt作为fallback
      if (rawLen < 50) {
        const fallbackPrompt = shot._titleConfig?.seedancePrompt ||
                              shot._titleConfig?.scene ||
                              prompt;
        pr.result = fallbackPrompt;
        console.warn(`  [EarlyGate] ⚠️ ${pr.shotId}: 片头LLM仅${rawLen}字符 → 使用开场标题fallback(${fallbackPrompt.length}字符)`);
        earlyGateWarnings++;
      }
    } else {
      // 非片头:短prompt只警告不阻断,让SmartCalibration扩展
      if (rawLen < 100) {
        console.warn(`  [EarlyGate] ⚠️ ${pr.shotId}: LLM产出${rawLen}字符 < 100,进入stage83 SmartCalibration扩展`);
        earlyGateWarnings++;
      }
      // 末尾残片字段:只警告不阻断
      if (/\|\s*[Pp][0-9]\s*$/.test(prompt.trim())) {
        console.warn(`  [EarlyGate] ⚠️ ${pr.shotId}: LLM产出末尾残片(${rawLen}字符),进入stage83清理`);
        earlyGateWarnings++;
      }
    }
  }
  if (earlyGateWarnings > 0) {
    console.warn(`  [EarlyGate] ⚠️ 共${earlyGateWarnings}个镜头LLM产出异常,进入stage83处理`);
  }

  // 🆕 fix11-v6: 不在这里写文件——文件由_stage83质检闸机在检查通过后统一写入

  pipeline.results.promptPreGeneration = {
    applied: true,
    totalShots: shots.length,
    successCount: promptResults.filter(p => p.result).length,
    // 🆕 fix11-v6: 文件由stage83闸机统一写入,不在这里写
  };

  // 同步回 story-plan.json
  saveStoryPlan(pipeline.productionDir, storyPlan);

  // 🆕 v6.12-Peng-fix9: 移除内部调用_stage83_QualityCalibration
  // 根因: stage8_PromptPreGeneration末尾调用_stage83_QualityCalibration,
  //       主pipeline在stage8_2之后也调用一次_stage83_QualityCalibration,
  //       导致双重执行 → 重复字段注入 → PriorityTruncator二次截断 → S05乱码
  // 修复: Stage 8.3 统一由主pipeline在 stage8_2 之后调用,此处不再调用

  if (pipeline.preProductionMode) {
    console.log(`  预生产模式: Stage 8 完成(${shots.length}个镜头)`);

    try {
      // 🆕 v6.11-Peng-fix: render-integration 已移除,报告生成由 Stage 11 Pre-Production Agent 负责
    } catch (e) {
      console.warn(`  预生产报告生成失败: ${e.message}`);
    }
  }

  if (pipeline._writeAuditLog) {
    pipeline._writeAuditLog('stage8_prompt_pregeneration', {
      totalShots: shots.length,
      successCount: promptResults.filter(p => p.result).length
    });
  }

  console.log(`  ✅ Stage 8.2 Prompt预生成完成: ${promptResults.filter(p => p.result).length}/${shots.length}个镜头`);
}

module.exports = { stage8_PromptPreGeneration, _stage83_QualityCalibration };
