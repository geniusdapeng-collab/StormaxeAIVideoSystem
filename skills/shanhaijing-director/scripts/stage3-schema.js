/**
 * stage3-schema.js
 * Stage 3 Schema校验 - 从 director-pipeline.js 抽取
 * 调用: await stage3_SchemaValidation(pipeline)
 */
const path = require('path');
const { logInfo, logWarn, logError } = require('./pipeline-logger');
const { extractBalancedJSON } = require('./pipeline-helpers');

async function stage3_SchemaValidation(pipeline) {
  pipeline.currentStage = 'schema-validation';
  console.log(`\n📐 阶段3/12: Schema校验 (LLM深度结构验证 v6.3-Peng)`);

  const storyPlanPath = path.join(pipeline.productionDir, '01-story', 'story-plan.json');
  const fs = require('fs');

  if (!fs.existsSync(storyPlanPath)) {
    console.log(`  ⚠️ story-plan.json不存在,调用系统故事引擎生成...`);

    const { LLMReasoningLayer } = require('./llm-reasoning-layer');
    const llm = new LLMReasoningLayer();

    const prdPath = path.join(pipeline.productionDir, '00-prd', 'prd.md');
    const prd = fs.existsSync(prdPath) ? fs.readFileSync(prdPath, 'utf8') : '';

    const beastMindEnabled = pipeline._shouldUseBeastMind ? pipeline._shouldUseBeastMind() : false;

    if (beastMindEnabled) {
      console.log(`  🐉 启用异兽叙事引擎...`);
      const storyPlan = pipeline._generateBeastMindStoryPlan
        ? await pipeline._generateBeastMindStoryPlan(storyPlanPath)
        : null;
      if (storyPlan) {
        pipeline._inject({ storyPlan });
        pipeline.results.storyPlan = storyPlan;
      }
    }

    // LLM生成story-plan作为fallback
    if (!pipeline.results.storyPlan) {
      const worldview = pipeline.worldview || '山海贼叙事';
      const result = await llm.llmReason({
        stage: 'schema-check',
        userPrompt: `根据PRD生成故事计划JSON:\n${prd.slice(0, 2000)}\n\n世界观:${worldview}\n输出格式:JSON包含segments数组,每个segment有name/shots数组`,
        level: 'medium'
      });
      if (result?.result) {
        const rawResult = typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
        const json = extractBalancedJSON(rawResult);
        if (!json) {
          // 🆕 fix-v6.25: 增加extractBalancedJSON失败日志
          logWarn(`StoryPlan提取失败，原始结果前200字符: ${rawResult.substring(0, 200)}`);
        }
        if (json) {
          try {
            const storyPlan = JSON.parse(json);
            // 🆕 v6.22-Peng-fix17: 修复shot id=null问题
            // 根因: LLM返回的JSON中部分shot缺少id字段,导致后续Stage全部undefined
            // 修复: 生成后立即为所有shot分配连续ID(S00, S01, ...)
            let globalShotIdx = 0;
            for (const seg of storyPlan.segments || []) {
              for (const shot of seg.shots || []) {
                if (!shot.id) {
                  shot.id = `S${String(globalShotIdx).padStart(2, '0')}`;
                }
                globalShotIdx++;
              }
            }
            pipeline._inject({ storyPlan });
            pipeline.results.storyPlan = storyPlan;
            const { saveStoryPlan } = require('./story-plan-service');
            saveStoryPlan(pipeline.productionDir, storyPlan);
            // 🆕 fix-v6.25: LLM生成的StoryPlan可能结构不符合预期(如只有project无segments)
            // 增加结构有效性校验,无效时触发本地fallback生成器
            const segCount = (storyPlan.segments || []).length;
            const shotCount = (storyPlan.segments || []).reduce((n, s) => n + (s.shots || []).length, 0);
            // 🆕 fix-v6.25-b: 校验镜头数是否与PRD承诺一致,偏差>50%也触发fallback
            const prdShotCountMatch = (prd || '').match(/(\d)\s*个?镜?头/);
            const expectedShotCount = prdShotCountMatch ? parseInt(prdShotCountMatch[1]) : 7;
            const shotCountValid = shotCount >= expectedShotCount * 0.5; // 镜头数偏差不超过50%
            if (segCount === 0 || shotCount === 0 || !shotCountValid) {
              logWarn(`StoryPlan结构无效(${segCount}幕/${shotCount}镜头,期望${expectedShotCount}),触发本地fallback生成器`);
              const { generateFallbackStoryPlan } = require('./story-plan-fallback-generator');
              const fallbackPlan = generateFallbackStoryPlan(prd, pipeline.worldview || 'nirath');
              if (fallbackPlan) {
                pipeline._inject({ storyPlan: fallbackPlan });
                pipeline.results.storyPlan = fallbackPlan;
                saveStoryPlan(pipeline.productionDir, fallbackPlan);
                console.log(`  ✅ Fallback生成成功: ${(fallbackPlan.segments||[]).length}幕, ${shotCount || (fallbackPlan.segments||[]).reduce((n,s)=>n+(s.shots||[]).length,0)}个镜头`);
              }
            } else {
              console.log(`  ✅ StoryPlan生成成功: ${segCount}幕, ${shotCount}个镜头`);
            }
          } catch (e) {
            logWarn(`StoryPlan JSON解析失败: ${e.message}`);
          }
        }
      } else {
        logWarn(`StoryPlan LLM生成返回空结果`);
      }
    }
  } else {
    // 已有story-plan,加载并校验
    const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
    pipeline.results.storyPlan = storyPlan;
    pipeline._inject({ storyPlan });

    // 世界观一致性检查
    if (pipeline._detectWorldviewConsistency) {
      const check = pipeline._detectWorldviewConsistency(storyPlan);
      if (!check?.consistent) {
        logWarn(`世界观一致性警告: ${check?.message || '检测到不一致'}`);
      }
    }

    // Schema验证器检查
    if (pipeline.schemaValidator) {
      const valid = pipeline.schemaValidator.validate(storyPlan);
      if (!valid) {
        logWarn(`Schema验证未通过,继续但记录问题`);
      }
    }
  }

  // LLM深度验证
  if (pipeline.results.storyPlan) {
    const { LLMValidateLayer } = require('./llm-validate-layer');
    const llmValidateLayer = new LLMValidateLayer({ verbose: pipeline.options.verbose });
    const llmValidation = await llmValidateLayer.validateStoryPlan(pipeline.results.storyPlan);

    pipeline.results.schemaValidation = {
      passed: llmValidation?.valid !== false,
      score: llmValidation?.score,
      llmScore: llmValidation?.score,
      llmValid: llmValidation?.valid,
      issues: llmValidation?.issues || [],
      summary: llmValidation?.summary || ''
    };

    if (llmValidation) llmValidateLayer.printReport();
  }

  logInfo('Schema校验完成');
  console.log(`  ✅ Stage 3 Schema校验完成`);
}

module.exports = { stage3_SchemaValidation };
