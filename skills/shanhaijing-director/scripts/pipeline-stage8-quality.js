  async function _stage83_QualityCalibration(pipeline) {
    const { SmartQualityCalibration, PriorityTruncator } = require('./smart-quality-calibration');
    const { PromptMetrics } = require('./prompt-metrics');
    const { normalizeAllShots } = require('./prompt-final-normalizer');
    console.log(`\n🔧 Stage 8.3: 质量校准 (v6.17-Peng 智能注入)`);
    
    const storyPlan = pipeline.results.storyPlan;
    if (!storyPlan) {
      console.log(`  ⚠️ 无story-plan,跳过质量校准`);
      return;
    }
    
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }
    
    if (allShots.length === 0) {
      console.log(`  ⚠️ 无shots,跳过质量校准`);
      return;
    }
    
    let fixCount = 0;
    
    // v6.31-Peng-fix: 直接对每个shot调用normalizeShotPromptFields构建10字段结构
    const { normalizeShotPromptFields } = require('./prompt-final-normalizer');
    console.log('  🏗️ 0. 规范化10字段结构...');
    let normCount = 0;
    const { path: pathModule, } = require('path');
    const fsNorm = require('fs');
    for (const shot of allShots) {
      const result = normalizeShotPromptFields(shot, storyPlan, {});
      console.log('NORM_DEBUG S01:', shot.id, 'normalizedLength:', (result||'').length, 'first200:', (result||'').slice(0,200)); if(shot.id==='S01'){ fs.writeFileSync('/tmp/norm_s01.txt', result||'', 'utf8'); }
      if (result) {
        shot._generatedPrompt = result;
        shot._promptLength = result.length;
        normCount++;
        // v6.31-Peng-fix2: 立即写.txt（Stage 8.3从.txt读取校验）
        const txtFile = pathModule.join(pipeline.productionDir, '04-prompts', 'prompt-' + shot.id + '.txt');
        fsNorm.writeFileSync(txtFile, result, 'utf8');
      }
    }
    console.log('  ✅ 规范化完成: ' + normCount + '/' + allShots.length + ' shots');
    
    console.log(`  🧹 1. 旁白清洗...`);
    for (const shot of allShots) {
      const prompt = shot._generatedPrompt || '';
      const cleaned = pipeline._cleanVoiceover(prompt, shot);
      if (cleaned !== prompt) {
        shot._generatedPrompt = cleaned;
        shot._promptLength = cleaned.length;
        fixCount++;
      }
    }
    
    console.log(`  🧹 2. 内容去重...`);
    fixCount += pipeline._fixDuplicateContent(allShots);
    
    console.log(`  🧹 3. 字段结构化...`);
    fixCount += pipeline._enforceFieldStructure(allShots, storyPlan);
    
    console.log(`  🧹 4. 智能质量校准...`);
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
        prevShot: allShots[allShots.findIndex(s => s.id === shotId) - 1]?.id,
        microExpression: shot._microExpressions?.join(', ')
      };
      
      const calibration = calibrator.calibrate(prompt, context, pipeline._countChars.bind(this));
      let calibratedPrompt = calibration.prompt;
      
      if (pipeline._countChars(calibratedPrompt)  > 5500) {
        // v6.17-Peng-fix: 所有策略都截断到980，确保最终合规
        let truncated = truncator.truncate(calibratedPrompt, 5500, pipeline._countChars.bind(this));
        let iterations = 0;
        // 🆕 fix15-v9: 不再用 charCounter.brutal.truncate 暴力截断
        // 原 while 循环会在 PriorityTruncator 未达到 980 时调用 charCounter.truncate (chars.slice(0, max).join(''))
        // 暴力截断会切断 P0 CharacterRef 路径(如 ...半身..png) — 正是 fix15-v9 要保护的现象
        // 修复: 使用 PriorityTruncator 重试 (P0 保护内置在 PriorityTruncator._safeTruncateAroundP0)
        //   允许连续多次 PriorityTruncator 调用让其逐渐压缩低优先级字段以腾出预算
        //   最多 5 次重试后实在超长才接受 P0 受压
        const { charCounter } = require('./char-counter');
        while (pipeline._countChars(truncated)  > 5500 && iterations < 5) {
          // 降级调用 — PriorityTruncator 本身已经 P0 保护
          truncated = truncator.truncate(truncated, 5500, pipeline._countChars.bind(this));
          iterations++;
        }
        // 末次保险: 仍然超长时退化为暴力截断 (以不超过 5500 为安全上限)
        if (pipeline._countChars(truncated) > 5500) {
          truncated = charCounter.truncate(truncated, 5500);
          iterations++;
        }
        console.log(`     [PriorityTruncate] ${shotId}: ${pipeline._countChars(calibratedPrompt)} -> ${pipeline._countChars(truncated)} 截断到980 (iter=${iterations})`);
        calibratedPrompt = truncated;
      }
      
      // 🆕 v6.17-Peng-fix: 确保最低利用率85%（1402加权字符）—— 已取消，与980上限冲突
      // 大鹏规则：硬性上限980，不追求1402-1633饱满度
      // if (pipeline._countChars(calibratedPrompt) < 1402) {
      //   console.log(`     ⚠️ ${shotId}: 加权字符数${pipeline._countChars(calibratedPrompt)}低于1402，尝试扩展...`);
      //   const expansion = `, ${context.worldviewSummary || 'Nirath alien world'}${context.characterName ? `, ${context.characterName} detailed features preserved` : ''}`;
      //   const expanded = calibratedPrompt + expansion;
      //   if (pipeline._countChars(expanded) <= 980) {
      //     calibratedPrompt = expanded;
      //     console.log(`     ✅ ${shotId}: 扩展至${pipeline._countChars(calibratedPrompt)}加权字符`);
      //   }
      // }
      
      if (shot.id === 'S01') { console.log('S01_CALIBRATE_START promptLen=' + (shot._generatedPrompt||'').length + ' first300=' + (shot._generatedPrompt||'').slice(0,300)); fs.writeFileSync('/tmp/s01_at_calibrate_start.txt', shot._generatedPrompt||'', 'utf8'); }
            // v6.31-Peng-fix: 追加技能关键词块（normalizeAllShots 已构建10字段，追加不在结构内）
      if (shot._appliedSkills && shot._appliedSkills.length > 0) {
        const skillTag = `[CINEMATIC_SKILL] ${shot._appliedSkills.map(s => s.type + '_' + s.director + '_' + s.emotion).join(' | ')}`;
        calibratedPrompt = calibratedPrompt.trimEnd() + '\n' + skillTag;
      }

      shot._generatedPrompt = calibratedPrompt;
      shot._promptLength = pipeline._countChars(calibratedPrompt);
      // 🆕 v6.17-Peng-fix: 更新 calibrationMeta 反映截断后的实际长度
      calibration.finalLen = pipeline._countChars(calibratedPrompt);
      if (calibration.originalLen !== calibration.finalLen) {
        calibration.strategy = 'TRUNCATED';
      }
      shot._calibrationMeta = calibration;
      
      const report = metrics.calculate(calibratedPrompt, pipeline._countChars(calibratedPrompt), shotId);
      metricReports.push(report);
      console.log(`     ${metrics.formatLog(report)}`);
      
      if (calibration.strategy !== 'SKIP' || pipeline._countChars(calibratedPrompt)  > 5500) {
        fixCount++;
      }
    }
    
    const summary = metrics.batchCalculate(metricReports);
    console.log(`  📊 批次统计: ${summary.pass}/${summary.total} 通过, 平均合规率: ${summary.avgCompliance}%`);
    
    const fs = require('fs');
    const path = require('path');
    const promptsDir = path.join(pipeline.productionDir, '04-prompts');
    for (const shot of allShots) {
      const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
      fs.writeFileSync(promptFile, `# ${shot.id} Prompt\n\n\`\`\`\n${shot._generatedPrompt || ''}\n\`\`\`\n`, 'utf8');
      // v6.31-Peng-fix: 同步写.txt文件（Stage 8.3从.txt读取校验）
      const txtFile = path.join(promptsDir, `prompt-${shot.id}.txt`);
      fs.writeFileSync(txtFile, shot._generatedPrompt || '', 'utf8');
    }
    
    try {
      const storyPlanPath = path.join(pipeline.productionDir, '01-story', 'story-plan.json');
      if (fs.existsSync(storyPlanPath)) {
        const savedPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
        for (const segment of savedPlan.segments || []) {
          for (const shot of segment.shots || []) {
            const matchedShot = allShots.find(s => s.id === shot.id);
            if (matchedShot && matchedShot._generatedPrompt) {
              shot._generatedPrompt = matchedShot._generatedPrompt;
              shot._promptLength = matchedShot._promptLength;
              shot._calibrationMeta = matchedShot._calibrationMeta;
            }
          }
        }
        fs.writeFileSync(storyPlanPath, JSON.stringify(savedPlan, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn(`  ⚠️ 保存story-plan.json失败: ${e.message}`);
    }
    
    console.log(`  ✅ 质量校准完成: ${fixCount}处修复`);
    
    pipeline.results.qualityCalibration = {
      fixCount,
      metricSummary: summary,
      timestamp: new Date().toISOString()
    };
  }
  async function _enforceLengthLoop(shots) {
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
            const char = pipeline.results?.storyPlan?.characters?.find(c => c.name === charName);
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
          const visualDetails = pipeline._extractCharacterVisualDetails(shot);
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
  function _extractCharacterVisualDetails(shot) {
    const details = [];
    const chars = shot.characters || [];

    for (const charName of chars) {
      const char = pipeline.results?.storyPlan?.characters?.find(c => c.name === charName);
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
  function _injectTransitions(shots) {
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
  async function _injectMicroExpressions(shots, storyPlan) {
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
          const char = storyPlan.characters?.find(c => c.name === charName);
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
      const promptsDir = path.join(pipeline.productionDir, '04-prompts');
      for (const shot of shots) {
        if (shot._generatedPrompt) {
          const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
          fs.writeFileSync(promptFile, `# ${shot.id} Prompt\n\n\`\`\`\n${shot._generatedPrompt}\n\`\`\`\n`, 'utf8');
          // v6.31-Peng-fix: 同步写.txt文件（Stage 8.3从.txt读取校验）
          const txtFile = path.join(promptsDir, `prompt-${shot.id}.txt`);
          fs.writeFileSync(txtFile, shot._generatedPrompt, 'utf8');
        }
      }
      console.log(`  💾 已重新写入04-prompts/含微表情`);

    } catch (error) {
      console.log(`  ⚠️ 微表情注入失败: ${error.message}`);
      console.log(`     继续执行Pipeline...`);
    }
  }
module.exports = { _stage83_QualityCalibration };