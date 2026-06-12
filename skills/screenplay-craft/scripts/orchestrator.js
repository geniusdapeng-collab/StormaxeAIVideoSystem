#!/usr/bin/env node
/**
 * ScreenplayCraft Orchestrator — 工作流编排引擎 v3.0
 * 
 * 编排 L1→L4 四层递进 + M1→M6 增强模块
 * 三种模式：original / ip-rebuild / series
 */

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, 'modules');
const ENHANCEMENTS_DIR = path.join(__dirname, 'v2-enhancements');

// ============ 工具函数 ============
function log(section, msg, level = 'info') {
  const ts = new Date().toISOString().slice(11, 19);
  const icon = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', phase: '🎬', progress: '⏳' }[level] || 'ℹ️';
  console.log(`${icon} [${ts}] [${section}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadModule(relativePath) {
  const fullPath = path.join(MODULES_DIR, relativePath);
  if (!fs.existsSync(fullPath + '.js')) return null;
  return require(fullPath + '.js');
}

function loadEnhancement(relativePath) {
  const fullPath = path.join(ENHANCEMENTS_DIR, relativePath);
  if (!fs.existsSync(fullPath + '.js')) return null;
  return require(fullPath + '.js');
}

// ============ 编排状态机 ============
function createPipelineState(mode) {
  return {
    mode: mode || 'original',
    l1: { world: null, theme: null, ipAnalysis: null },
    l2: { structure: null, characters: null, plot: null },
    l3: { scenes: null, dialogues: null, cinematography: null },
    l4: { screenplay: null, storyPlan: null, continuityReport: null },
    v2: { vertical: null, paywall: null, hooks: null, series: null, spectacles: null },
    status: { l1: 'pending', l2: 'pending', l3: 'pending', l4: 'pending' },
    errors: [],
    retryCount: 0
  };
}

// ============ 解析命令行参数 ============
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const raw = process.argv[i];
    if (!raw.startsWith('--')) {
      if (!args.command) args.command = raw;
      continue;
    }
    const key = raw.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = process.argv[i + 1];
    if (val && !val.startsWith('--')) { args[key] = val; i++; }
    else { args[key] = true; }
  }
  // 映射 command 到 mode
  if (args.command === 'ip' || args.command === 'reconstruct') args.mode = 'ip';
  if (args.command === 'series') args.mode = 'series';
  return args;
}

// ============ 模式 A：原创模式 ============
async function runOriginal(args, outputDir) {
  log('Orchestrator', '🎬 模式 A：原创模式启动', 'phase');
  const state = createPipelineState('original');
  
  // L1: theme-extractor → world-builder
  log('L1', '开始概念层处理...', 'phase');
  const themeExtractor = loadModule('l1-concept-layer/theme-extractor');
  if (themeExtractor && themeExtractor.run) {
    state.l1.theme = await themeExtractor.run({
      mode: 'original',
      sourceMaterial: args.outline || args.title || '',
      userIntent: args.intent || ''
    });
    log('L1', `主题提炼完成: ${state.l1.theme.coreTheme}`, 'success');
  }

  const worldBuilder = loadModule('l1-concept-layer/world-builder');
  if (worldBuilder && worldBuilder.run) {
    state.l1.world = await worldBuilder.run({
      mode: 'original',
      userPrompt: args.outline || args.title || '',
      themeManifesto: state.l1.theme?.coreTheme || '',
      styleHint: args.style || '写实电影质感,动态光影,电影级构图'
    });
    log('L1', `世界观构建完成: ${state.l1.world.worldName}`, 'success');
  }
  state.status.l1 = 'done';

  // L2: structure + character-forge + plot-weaver（串行，依赖 L1）
  log('L2', '开始叙事层处理...', 'phase');
  const structureEngine = loadModule('l2-narrative-layer/structure-engine');
  if (structureEngine && structureEngine.run) {
    state.l2.structure = await structureEngine.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      targetDuration: parseInt(args.duration) || 180,
      videoType: args.videoType || args.type || 'auto'
    });
    log('L2', `结构引擎完成: ${state.l2.structure.structureType}`, 'success');
  }

  const characterForge = loadModule('l2-narrative-layer/character-forge');
  if (characterForge && characterForge.run) {
    state.l2.characters = await characterForge.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      structureData: state.l2.structure,
      characterCount: args.characters ? args.characters.split(',').length : 2,
      protagonistHint: args.protagonist || '',
      antagonistHint: args.antagonist || '',
      ipAnalysis: state.l1.ipAnalysis,
      sourceTitle: args.source || '',
      videoType: args.videoType || args.type || 'auto' // 🆕 传入视频类型
    });
    log('L2', `角色锻造完成: ${state.l2.characters.characters?.length || 0} 个角色`, 'success');
  }

  // 🆕 PersonaVault — 角色灵魂铸造子系统（增强 character-forge）
  const skillsDir = path.dirname(path.dirname(__dirname));
  const personaVaultDir = path.join(skillsDir, 'persona-vault/scripts/orchestrator.js');
  if (fs.existsSync(personaVaultDir) && state.l2.characters?.characters?.length > 0) {
    log('PersonaVault', '🔮 启动角色灵魂铸造...', 'phase');
    // 调用各个 Agent
    const pvAgents = path.join(skillsDir, 'persona-vault/scripts/agents');
    const pvStateBus = require(path.join(skillsDir, 'persona-vault/scripts/utils/state-bus'));
    const pvProject = args.title || 'screenplay';
    const pvOutputDir = path.join(path.dirname(__dirname), 'persona-vault/outputs');
    if (!fs.existsSync(pvOutputDir)) fs.mkdirSync(pvOutputDir, { recursive: true });
    const pvStatePath = path.join(pvOutputDir, `${pvProject.replace(/[^\w\u4e00-\u9fa5-]/g, '_')}-state.json`);

    // 先注册所有角色到 PersonaVault
    let pvState = pvStateBus.loadState(pvStatePath);
    for (const char of (state.l2.characters.characters || [])) {
      const cf = char.seedanceCharFormat || char;
      pvState.characters[char.id] = {
        id: char.id, name: cf.name || char.name,
        role: char.role || 'protagonist',
        oneLiner: `${cf.species || ''}, ${cf.features || ''}, ${cf.signature || ''}`,
        worldContext: state.l1.world?.worldName || '',
        themeAnchor: state.l1.theme?.coreTheme || ''
      };
    }
    pvStateBus.saveState(pvStatePath, pvState);

    // 对每个角色执行伤口挖掘
    const woundMiner = require(path.join(pvAgents, 'wound-miner.js'));
    const evolutionTracker = require(path.join(pvAgents, 'evolution-tracker.js'));
    const gravityWeaver = require(path.join(pvAgents, 'gravity-weaver.js'));
    const empathyEngine = require(path.join(pvAgents, 'empathy-engine.js'));
    const mirrorEngine = require(path.join(pvAgents, 'mirror-engine.js'));
    const guardian = require(path.join(pvAgents, 'guardian.js'));

    const totalEpisodes = Math.max(1, Math.round((parseInt(args.duration) || 180) / 3));
    for (const char of (state.l2.characters.characters || [])) {
      const cf = char.seedanceCharFormat || char;
      const charId = char.id || `C01`;
      const role = char.role || 'protagonist';
      
      // Agent 1: Wound Miner
      woundMiner.run({ characterId: charId, characterName: cf.name || char.name, oneLiner: `${cf.species || ''} ${cf.features || ''}`, role, worldContext: state.l1.world?.worldName || '', themeAnchor: state.l1.theme?.coreTheme || '' }, pvStatePath);
      log('PersonaVault', `  💀 ${cf.name || char.name} 伤口挖掘完成`, 'info');

      // Agent 4: Evolution Tracker
      evolutionTracker.run({ characterId: charId, characterName: cf.name || char.name, totalEpisodes }, pvStatePath);
      log('PersonaVault', `  📈 ${cf.name || char.name} 成长弧线完成`, 'info');

      // Agent 3: Empathy Engine（反派）
      if (role === 'antagonist' || role === 'tragic-hero') {
        empathyEngine.run({ characterId: charId, characterName: cf.name || char.name, role }, pvStatePath);
        log('PersonaVault', `  💚 ${cf.name || char.name} 共情矩阵完成`, 'info');
      }
    }

    // Agent 2: Gravity Weaver（角色间引力）
    const chars = state.l2.characters.characters || [];
    if (chars.length >= 2) {
      for (const char of chars) {
        const others = chars.filter(c => c.id !== char.id);
        const cf = char.seedanceCharFormat || char;
        gravityWeaver.run({ sourceCharacter: { id: char.id, name: cf.name || char.name }, otherCharacters: others.map(o => ({ id: o.id, name: (o.seedanceCharFormat || o).name || o.name })) }, pvStatePath);
      }
      log('PersonaVault', `  🌐 引力场完成: ${chars.length} 个角色`, 'info');
    }

    // Agent 5: Mirror Engine
    if (chars.length >= 2) {
      const personaStates = {};
      for (const char of chars) personaStates[char.id] = pvStateBus.getCharacterPersona(pvStateBus.loadState(pvStatePath), char.id);
      mirrorEngine.run({ characters: chars.map(c => ({ id: c.id, name: (c.seedanceCharFormat || c).name || c.name })), personaStates }, pvStatePath);
      log('PersonaVault', `  🪞 镜像关系完成`, 'info');
    }

    // 读取 PersonaVault 增强数据注入到 state
    pvState = pvStateBus.loadState(pvStatePath);
    state.personaVault = { statePath: pvStatePath, wounds: pvState.wounds, gravity: pvState.gravity, empathy: pvState.empathy, evolution: pvState.evolution, mirrors: pvState.mirrors };
    log('PersonaVault', `🎉 角色灵魂铸造完成！${Object.keys(pvState.wounds).length} 个伤口档案, ${pvState.mirrors?.length || 0} 对镜像关系`, 'success');
  }

  const plotWeaver = loadModule('l2-narrative-layer/plot-weaver');
  if (plotWeaver && plotWeaver.run) {
    state.l2.plot = await plotWeaver.run({
      structureData: state.l2.structure,
      characterData: state.l2.characters,
      worldData: state.l1.world,
      themeData: state.l1.theme
    });
    log('L2', `情节编织完成: ${state.l2.plot.sceneBreakdown?.length || 0} 个场景`, 'success');
  }
  state.status.l2 = 'done';

  // L3: scene-writer + dialogue-master + cinematography-planner
  log('L3', '开始剧本层处理...', 'phase');
  const sceneWriter = loadModule('l3-script-layer/scene-writer');
  if (sceneWriter && sceneWriter.run) {
    state.l3.scenes = await sceneWriter.run({
      plotData: state.l2.plot,
      characterData: state.l2.characters,
      worldData: state.l1.world,
      targetFormat: 'shot-ready'
    });
    log('L3', `场景书写完成: ${state.l3.scenes.scenes?.length || 0} 个场景`, 'success');
  }

  const dialogueMaster = loadModule('l3-script-layer/dialogue-master');
  if (dialogueMaster && dialogueMaster.run) {
    state.l3.dialogues = await dialogueMaster.run({
      sceneData: state.l3.scenes,
      characterData: state.l2.characters,
      themeData: state.l1.theme,
      language: args.language || 'zh'
    });
    log('L3', `对白生成完成: ${state.l3.dialogues.dialogueScript?.length || 0} 场`, 'success');
  }

  // 🆕 VoiceCraft — 声音铸造系统（增强 dialogue-master）
  const vcSkillsDir = path.dirname(path.dirname(__dirname));
  const vcDir = path.join(vcSkillsDir, 'shanhaijing-voice-craft');
  if (fs.existsSync(vcDir) && state.l2.characters?.characters?.length > 0) {
    log('VoiceCraft', '🔮 启动声音铸造...', 'phase');
    const vcAgents = path.join(vcDir, 'agents');
    const vcBus = require(path.join(vcDir, 'voice-state-bus'));
    const voiceMiner = require(path.join(vcAgents, 'voice-miner.js'));
    const subtextWeaver = require(path.join(vcAgents, 'subtext-weaver.js'));
    const dialogueSmith = require(path.join(vcAgents, 'dialogue-smith.js'));
    const loseControlTrigger = require(path.join(vcAgents, 'lose-control-trigger.js'));
    const silenceArchitect = require(path.join(vcAgents, 'silence-architect.js'));
    const voiceGuardian = require(path.join(vcAgents, 'voice-guardian.js'));

    const vcProject = (args.title || 'screenplay').replace(/[^\w\u4e00-\u9fa5-]/g, '_');
    const vcOutputDir = path.join(vcDir, '..', 'outputs');
    if (!fs.existsSync(vcOutputDir)) fs.mkdirSync(vcOutputDir, { recursive: true });
    const vcStatePath = path.join(vcOutputDir, `${vcProject}-voice-state.json`);

    // Phase 1: Voice Miner — 为每个角色提取声纹
    const chars = state.l2.characters.characters || [];
    for (const char of chars) {
      const cf = char.seedanceCharFormat || char;
      voiceMiner.run({
        characterId: char.id || 'C01',
        characterName: cf.name || char.name || '角色',
        role: char.role || 'protagonist',
        personaData: state.personaVault?.wounds?.[char.id] || {}
      }, vcStatePath);
      log('VoiceCraft', `  🎤 ${cf.name || char.name} 声纹提取完成`, 'info');
    }

    // Phase 2-5: 为每个场景铺设潜台词→锻造对白→失控触发→沉默设计
    const scenes = state.l3.scenes?.scenes || state.l2.plot?.sceneBreakdown || [];
    const vcState = vcBus.loadState(vcStatePath);
    const totalScenes = Math.min(scenes.length, 3); // 前3个场景做完整声音铸造
    for (let si = 0; si < totalScenes; si++) {
      const scene = scenes[si];
      const sceneId = scene.id || `SC${String(si+1).padStart(2,'0')}`;
      const sceneChars = (scene.characters || chars.map(c=>c.id)).slice(0, 2);

      // Phase 2: Subtext Weaver
      const personaData = {};
      for (const cId of sceneChars) {
        personaData[cId] = { wound: { structure: state.personaVault?.wounds?.[cId]?.structure || {} } };
      }
      const subtext = subtextWeaver.run({
        sceneId, sceneContext: {
          setting: scene.description || scene.setting || '',
          emotionalState: sceneChars.reduce((acc, cId) => { acc[cId] = '中性'; return acc; }, {}),
          sceneGoal: scene.purpose || ''
        }, characters: sceneChars, personaData
      }, vcStatePath);

      // Phase 3: Dialogue Smith
      const currentState = vcBus.loadState(vcStatePath);
      const draft = dialogueSmith.run({
        sceneId, voiceSignatures: currentState.signatures, subtextMap: subtext,
        sceneRequirements: { dialogueCount: 6, totalDuration: 30 }
      }, vcStatePath);

      // Phase 4: LoseControl Trigger
      const woundTriggers = {};
      for (const cId of sceneChars) {
        woundTriggers[cId] = { triggers: state.personaVault?.wounds?.[cId]?.surface ? [state.personaVault.wounds[cId].surface.event || ''] : [] };
      }
      const final = loseControlTrigger.run({
        dialogueDraft: draft, characterWounds: woundTriggers, sceneIntensity: 0.8
      }, vcStatePath);

      // Phase 5: Silence Architect
      const { complete } = silenceArchitect.run({
        dialogueFinal: final, sceneEmotionCurve: [{ time: 0, intensity: 70 }, { time: 20, intensity: 85 }]
      }, vcStatePath);

      log('VoiceCraft', `  🎭 场景${sceneId} 声音铸造完成`, 'info');
    }

    // Phase 6: Voice Guardian — 全局校验
    const finalState = vcBus.loadState(vcStatePath);
    for (const sceneId of Object.keys(finalState.dialogues)) {
      const dg = finalState.dialogues[sceneId];
      if (dg.complete) {
        voiceGuardian.run({ dialogueComplete: dg.complete, voiceSignatures: finalState.signatures }, vcStatePath);
      }
    }

    // 注入 VoiceCraft 数据到主状态
    const vcFinalState = vcBus.loadState(vcStatePath);
    state.voiceCraft = {
      statePath: vcStatePath,
      signatures: vcFinalState.signatures,
      silences: vcFinalState.silences,
      consistencyLog: vcFinalState.consistencyLog
    };
    log('VoiceCraft', `🎉 声音铸造完成！${Object.keys(vcFinalState.signatures).length} 个声纹, ${Object.keys(vcFinalState.dialogues).length} 个场景, ${Object.keys(vcFinalState.silences).length} 处沉默`, 'success');
  }

  const cinematographyPlanner = loadModule('l3-script-layer/cinematography-planner');
  if (cinematographyPlanner && cinematographyPlanner.run) {
    state.l3.cinematography = await cinematographyPlanner.run({
      sceneData: state.l3.scenes,
      structureData: state.l2.structure,
      videoType: args.videoType || args.type || 'auto',
      visualStyle: args.style || state.l1.world?.atmosphereKeywords?.join(',') || '写实电影质感,动态光影,电影级构图',
      totalDuration: parseInt(args.duration) || 180
    });
    log('L3', `镜头预规划完成: ${state.l3.cinematography.shotPlan?.length || 0} 个镜头`, 'success');
  }
  state.status.l3 = 'done';

  // M1: 竖屏引擎（条件触发）
  if (args.aspect === '9:16') {
    log('M1', '竖屏引擎激活', 'phase');
    const verticalEngine = loadEnhancement('m1-vertical-engine/vertical-compositor');
    if (verticalEngine && verticalEngine.convert) {
      state.v2.vertical = await verticalEngine.convert(state.l3.cinematography, { aspectRatio: '9:16' });
      // 替换 cinematography 中的 shotPlan 为竖屏版本
      if (state.v2.vertical.shotPlan) {
        state.l3.cinematography.shotPlan = state.v2.vertical.shotPlan;
      }
      log('M1', '竖屏转换完成', 'success');
    }
  }

  // M5: 奇观设计器（条件触发）
  if (args.spectacle && args.spectacle !== 'minimal') {
    log('M5', `奇观设计器激活 (${args.spectacle})`, 'phase');
    const spectacleDesigner = loadEnhancement('m4-spectacle-designer/spectacle-planner');
    if (spectacleDesigner && spectacleDesigner.run) {
      state.v2.spectacles = await spectacleDesigner.run({
        cinematography: state.l3.cinematography,
        spectacleLevel: args.spectacle || 'standard',
        videoType: args.videoType || args.type || 'commercial'
      });
      log('M5', `奇观规划完成: ${state.v2.spectacles.spectacles?.length || 0} 个奇观`, 'success');
    }
  }

  // L4: continuity-checker → screenplay-exporter → seedance-adapter
  log('L4', '开始生产层处理...', 'phase');
  
  // 连续性检查先跑
  const continuityChecker = loadModule('l4-production-layer/continuity-checker');
  if (continuityChecker && continuityChecker.run) {
    state.l4.continuityReport = await continuityChecker.run({ state });
    log('L4', `连续性检查完成: ${state.l4.continuityReport.checksPassed}/${state.l4.continuityReport.totalChecks}`, 'success');
  }

  // 然后导出（包含 continuityReport）
  const screenplayExporter = loadModule('l4-production-layer/screenplay-exporter');
  if (screenplayExporter && screenplayExporter.run) {
    state.l4.screenplay = await screenplayExporter.run({
      state,
      outputDir,
      title: args.title || '未命名'
    });
    log('L4', `剧本导出完成: ${state.l4.screenplay.files?.length || 0} 个文件`, 'success');
  }

  const seedanceAdapter = require('./screenplaycraft-adapter');
  if (seedanceAdapter && seedanceAdapter.run) {
    state.l4.storyPlan = await seedanceAdapter.run({
      screenplayState: state,
      outputDir
    });
    log('L4', `Seedance 适配完成: ${state.l4.storyPlan.totalShots || 0} 个镜头`, 'success');
  }

  state.status.l4 = 'done';

  return state;
}

// ============ 模式 B：IP 重构模式 ============
async function runIPRebuild(args, outputDir) {
  log('Orchestrator', '🎬 模式 B：IP 重构模式启动', 'phase');
  const state = createPipelineState('ip-rebuild');

  // M6: ip-deconstructor
  log('M6', '开始 IP 解析...', 'phase');
  const ipDeconstructor = loadEnhancement('m5-ip-deconstructor/ip-parser');
  if (ipDeconstructor && ipDeconstructor.run) {
    state.l1.ipAnalysis = await ipDeconstructor.run({
      sourceType: args.sourceType || 'auto',
      sourceTitle: args.source || '',
      extractDepth: args.depth || 'medium',
      retentionRatio: parseFloat(args.retention) || 0.4,
      userCreativeDirection: args.outline || '',
      targetMedium: 'ai-short-drama'
    });
    log('M6', `IP 解析完成: ${state.l1.ipAnalysis.spiritualCore?.coreDNA || '未知'}`, 'success');
  }

  // L1: theme + world（基于 IP 解析结果重建）
  log('L1', '基于 IP 重建概念层...', 'phase');
  const themeExtractor = loadModule('l1-concept-layer/theme-extractor');
  if (themeExtractor && themeExtractor.run) {
    state.l1.theme = await themeExtractor.run({
      mode: 'ip-based',
      sourceMaterial: state.l1.ipAnalysis,
      userIntent: args.intent || ''
    });
    log('L1', `主题提炼完成: ${state.l1.theme.coreTheme}`, 'success');
  }

  const worldBuilder = loadModule('l1-concept-layer/world-builder');
  if (worldBuilder && worldBuilder.run) {
    state.l1.world = await worldBuilder.run({
      mode: 'ip-rebuild',
      userPrompt: args.outline || args.source || '',
      themeManifesto: state.l1.theme?.coreTheme || '',
      styleHint: args.style || '写实电影质感,动态光影,电影级构图',
      ipAnalysis: state.l1.ipAnalysis,
      retentionPlan: state.l1.ipAnalysis?.retentionPlan || null,
      sourceTitle: args.source || '' // 🆕 传入 IP 来源
    });
    log('L1', `世界观重建完成: ${state.l1.world.worldName}`, 'success');
  }
  state.status.l1 = 'done';

  // L2-L4 同模式 A
  state.status.l2 = 'pending';
  state.status.l3 = 'pending';
  state.status.l4 = 'pending';
  // 复用 original 的 L2-L4 流程
  const originalState = await _runL2toL4(state, args, outputDir);
  return originalState;
}

// ============ 模式 C：系列短剧模式 ============
async function runSeries(args, outputDir) {
  log('Orchestrator', '🎬 模式 C：系列短剧模式启动', 'phase');
  const totalEpisodes = parseInt(args.episodes) || 80;
  const state = createPipelineState('series');

  // [可选] M6: IP 解析
  if (args.source) {
    log('M6', `解析 IP: ${args.source}`, 'phase');
    const ipDeconstructor = loadEnhancement('m5-ip-deconstructor/ip-parser');
    if (ipDeconstructor && ipDeconstructor.run) {
      state.l1.ipAnalysis = await ipDeconstructor.run({
        sourceType: args.sourceType || 'auto',
        sourceTitle: args.source,
        extractDepth: args.depth || 'medium',
        retentionRatio: parseFloat(args.retention) || 0.4,
        targetMedium: 'ai-short-drama'
      });
    }
  }

  // L1
  log('L1', '概念层...', 'phase');
  const themeExtractor = loadModule('l1-concept-layer/theme-extractor');
  if (themeExtractor && themeExtractor.run) {
    state.l1.theme = await themeExtractor.run({
      mode: state.l1.ipAnalysis ? 'ip-based' : 'original',
      sourceMaterial: state.l1.ipAnalysis || args.outline || args.title || '',
      userIntent: args.intent || ''
    });
  }

  const worldBuilder = loadModule('l1-concept-layer/world-builder');
  if (worldBuilder && worldBuilder.run) {
    state.l1.world = await worldBuilder.run({
      mode: state.l1.ipAnalysis ? 'ip-rebuild' : 'original',
      userPrompt: args.outline || args.title || '',
      themeManifesto: state.l1.theme?.coreTheme || '',
      styleHint: args.style || '写实电影质感,动态光影,电影级构图',
      ipAnalysis: state.l1.ipAnalysis
    });
  }
  state.status.l1 = 'done';

  // M4: series-arc
  log('M4', '系列架构规划...', 'phase');
  const seriesArc = loadEnhancement('m3-series-arc/series-planner');
  if (seriesArc && seriesArc.run) {
    state.v2.series = await seriesArc.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      totalEpisodes,
      aspectRatio: args.aspect || '9:16'
    });
    log('M4', `系列规划完成: ${totalEpisodes}集`, 'success');
  }

  // L2: structure + M2 paywall
  log('L2', '叙事层...', 'phase');
  const structureEngine = loadModule('l2-narrative-layer/structure-engine');
  if (structureEngine && structureEngine.run) {
    state.l2.structure = await structureEngine.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      targetDuration: parseInt(args.duration) || 75,
      videoType: args.videoType || args.type || 'drama',
      seriesConfig: { mode: 'series', totalEpisodes }
    });
  }

  // M2: paywall-engine
  log('M2', '卡点节奏设计...', 'phase');
  const paywallEngine = loadEnhancement('m2-paywall-engine/paywall-planner');
  if (paywallEngine && paywallEngine.run) {
    state.v2.paywall = await paywallEngine.run({
      structureData: state.l2.structure,
      totalEpisodes,
      paywallPositions: args.paywall ? args.paywall.split(',').map(Number) : [10, 28, 58]
    });
    // 将卡点计划注入结构
    if (state.l2.structure && state.v2.paywall) {
      state.l2.structure.paywallPlan = state.v2.paywall;
    }
    log('M2', `卡点设计完成: 位置 ${state.v2.paywall.paywallPositions?.join(', ')}`, 'success');
  }

  const characterForge = loadModule('l2-narrative-layer/character-forge');
  if (characterForge && characterForge.run) {
    state.l2.characters = await characterForge.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      structureData: state.l2.structure,
      characterCount: 3,
      seriesMode: true,
      ipAnalysis: state.l1.ipAnalysis,
      sourceTitle: args.source || ''
    });
  }

  const plotWeaver = loadModule('l2-narrative-layer/plot-weaver');
  if (plotWeaver && plotWeaver.run) {
    state.l2.plot = await plotWeaver.run({
      structureData: state.l2.structure,
      characterData: state.l2.characters,
      worldData: state.l1.world,
      themeData: state.l1.theme,
      seriesConfig: { totalEpisodes, paywallPlan: state.v2.paywall }
    });
  }
  state.status.l2 = 'done';

  // L3
  log('L3', '剧本层...', 'phase');
  const sceneWriter = loadModule('l3-script-layer/scene-writer');
  if (sceneWriter && sceneWriter.run) {
    state.l3.scenes = await sceneWriter.run({
      plotData: state.l2.plot,
      characterData: state.l2.characters,
      worldData: state.l1.world,
      targetFormat: 'shot-ready',
      seriesMode: true
    });
  }

  const dialogueMaster = loadModule('l3-script-layer/dialogue-master');
  if (dialogueMaster && dialogueMaster.run) {
    state.l3.dialogues = await dialogueMaster.run({
      sceneData: state.l3.scenes,
      characterData: state.l2.characters,
      themeData: state.l1.theme,
      seriesMode: true,
      language: 'zh'
    });
  }

  const cinematographyPlanner = loadModule('l3-script-layer/cinematography-planner');
  if (cinematographyPlanner && cinematographyPlanner.run) {
    state.l3.cinematography = await cinematographyPlanner.run({
      sceneData: state.l3.scenes,
      structureData: state.l2.structure,
      videoType: args.videoType || 'drama',
      visualStyle: args.style || '写实电影质感,动态光影,电影级构图',
      totalDuration: parseInt(args.duration) || 75
    });
  }
  state.status.l3 = 'done';

  // M3: hook-factory
  log('M3', '钩子工厂...', 'phase');
  const hookFactory = loadEnhancement('m2-paywall-engine/hook-factory');
  if (hookFactory && hookFactory.run) {
    state.v2.hooks = await hookFactory.run({
      scenes: state.l3.scenes,
      paywallPlan: state.v2.paywall,
      totalEpisodes
    });
    log('M3', '钩子生成完成', 'success');
  }

  // M1: 竖屏
  if (args.aspect === '9:16') {
    const verticalEngine = loadEnhancement('m1-vertical-engine/vertical-compositor');
    if (verticalEngine && verticalEngine.convert) {
      state.v2.vertical = await verticalEngine.convert(state.l3.cinematography, { aspectRatio: '9:16' });
      if (state.v2.vertical.shotPlan) state.l3.cinematography.shotPlan = state.v2.vertical.shotPlan;
    }
  }

  // L4
  log('L4', '生产层...', 'phase');
  // 连续性检查先跑
  const continuityChecker = loadModule('l4-production-layer/continuity-checker');
  if (continuityChecker && continuityChecker.run) {
    state.l4.continuityReport = await continuityChecker.run({ state, seriesMode: true });
    log('L4', `检查完成: ${state.l4.continuityReport.checksPassed}/${state.l4.continuityReport.totalChecks}`, 'success');
  }

  const screenplayExporter = loadModule('l4-production-layer/screenplay-exporter');
  if (screenplayExporter && screenplayExporter.run) {
    state.l4.screenplay = await screenplayExporter.run({
      state, outputDir, title: args.title || '未命名', seriesMode: true
    });
  }

  const seedanceAdapter = require('./screenplaycraft-adapter');
  if (seedanceAdapter && seedanceAdapter.run) {
    state.l4.storyPlan = await seedanceAdapter.run({
      screenplayState: state, outputDir
    });
  }
  state.status.l4 = 'done';

  return state;
}

// ============ L2→L4 复用流程 ============
async function _runL2toL4(state, args, outputDir) {
  log('L2', '叙事层...', 'phase');
  const structureEngine = loadModule('l2-narrative-layer/structure-engine');
  if (structureEngine && structureEngine.run) {
    state.l2.structure = await structureEngine.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      targetDuration: parseInt(args.duration) || 180,
      videoType: args.videoType || args.type || 'auto'
    });
    log('L2', `结构完成: ${state.l2.structure.structureType}`, 'success');
  }

  const characterForge = loadModule('l2-narrative-layer/character-forge');
  if (characterForge && characterForge.run) {
    state.l2.characters = await characterForge.run({
      worldData: state.l1.world,
      themeData: state.l1.theme,
      structureData: state.l2.structure,
      characterCount: args.characters ? args.characters.split(',').length : 2,
      ipAnalysis: state.l1.ipAnalysis,
      sourceTitle: args.source || ''
    });
    log('L2', `角色完成: ${state.l2.characters.characters?.length || 0}个`, 'success');
  }

  const plotWeaver = loadModule('l2-narrative-layer/plot-weaver');
  if (plotWeaver && plotWeaver.run) {
    state.l2.plot = await plotWeaver.run({
      structureData: state.l2.structure,
      characterData: state.l2.characters,
      worldData: state.l1.world,
      themeData: state.l1.theme
    });
    log('L2', `情节完成: ${state.l2.plot.sceneBreakdown?.length || 0}个场景`, 'success');
  }
  state.status.l2 = 'done';

  log('L3', '剧本层...', 'phase');
  const sceneWriter = loadModule('l3-script-layer/scene-writer');
  if (sceneWriter && sceneWriter.run) {
    state.l3.scenes = await sceneWriter.run({
      plotData: state.l2.plot,
      characterData: state.l2.characters,
      worldData: state.l1.world,
      targetFormat: 'shot-ready'
    });
    log('L3', `场景完成: ${state.l3.scenes.scenes?.length || 0}个`, 'success');
  }

  const dialogueMaster = loadModule('l3-script-layer/dialogue-master');
  if (dialogueMaster && dialogueMaster.run) {
    state.l3.dialogues = await dialogueMaster.run({
      sceneData: state.l3.scenes,
      characterData: state.l2.characters,
      themeData: state.l1.theme,
      language: args.language || 'zh'
    });
    log('L3', `对白完成: ${state.l3.dialogues.dialogueScript?.length || 0}场`, 'success');
  }

  const cinematographyPlanner = loadModule('l3-script-layer/cinematography-planner');
  if (cinematographyPlanner && cinematographyPlanner.run) {
    state.l3.cinematography = await cinematographyPlanner.run({
      sceneData: state.l3.scenes,
      structureData: state.l2.structure,
      videoType: args.videoType || 'auto',
      visualStyle: args.style || state.l1.world?.atmosphereKeywords?.join(',') || '写实电影质感,动态光影,电影级构图',
      totalDuration: parseInt(args.duration) || 180
    });
    log('L3', `镜头完成: ${state.l3.cinematography.shotPlan?.length || 0}个`, 'success');
  }
  state.status.l3 = 'done';

  // M1 竖屏
  if (args.aspect === '9:16') {
    const verticalEngine = loadEnhancement('m1-vertical-engine/vertical-compositor');
    if (verticalEngine && verticalEngine.convert) {
      state.v2.vertical = await verticalEngine.convert(state.l3.cinematography, { aspectRatio: '9:16' });
      if (state.v2.vertical.shotPlan) state.l3.cinematography.shotPlan = state.v2.vertical.shotPlan;
    }
  }

  // M5 奇观
  if (args.spectacle && args.spectacle !== 'minimal') {
    const spectacleDesigner = loadEnhancement('m4-spectacle-designer/spectacle-planner');
    if (spectacleDesigner && spectacleDesigner.run) {
      state.v2.spectacles = await spectacleDesigner.run({
        cinematography: state.l3.cinematography,
        spectacleLevel: args.spectacle,
        videoType: args.videoType || 'commercial'
      });
    }
  }

  log('L4', '生产层...', 'phase');
  // 连续性检查先跑
  const continuityChecker = loadModule('l4-production-layer/continuity-checker');
  if (continuityChecker && continuityChecker.run) {
    state.l4.continuityReport = await continuityChecker.run({ state });
    log('L4', `检查完成: ${state.l4.continuityReport.checksPassed}/${state.l4.continuityReport.totalChecks}`, 'success');
  }

  const screenplayExporter = loadModule('l4-production-layer/screenplay-exporter');
  if (screenplayExporter && screenplayExporter.run) {
    state.l4.screenplay = await screenplayExporter.run({
      state, outputDir, title: args.title || '未命名'
    });
    log('L4', `导出完成: ${state.l4.screenplay.files?.length || 0}个文件`, 'success');
  }

  const seedanceAdapter = require('./screenplaycraft-adapter');
  if (seedanceAdapter && seedanceAdapter.run) {
    state.l4.storyPlan = await seedanceAdapter.run({
      screenplayState: state, outputDir
    });
    log('L4', `适配完成: ${state.l4.storyPlan.totalShots || 0}个镜头`, 'success');
  }

  state.status.l4 = 'done';

  return state;
}

// ============ 主入口 ============
async function main() {
  const args = parseArgs();
  const mode = args.mode || 'original';
  
  const outputDir = args.output || path.join(__dirname, '..', 'outputs', `${args.title || 'screenplay'}-${Date.now().toString().slice(-4)}`);
  ensureDir(outputDir);

  log('Orchestrator', `🎬 ScreenplayCraft v3.0 — 模式: ${mode}`, 'phase');
  log('Orchestrator', `📁 输出目录: ${outputDir}`, 'info');

  try {
    let state;
    switch (mode) {
      case 'ip':
      case 'ip-rebuild':
        state = await runIPRebuild(args, outputDir);
        break;
      case 'series':
        state = await runSeries(args, outputDir);
        break;
      case 'original':
      default:
        state = await runOriginal(args, outputDir);
        break;
    }

    // 汇总输出
    log('Orchestrator', '🎉 ScreenplayCraft 工作流完成！', 'success');
    log('Orchestrator', `📁 输出目录: ${outputDir}`, 'info');
    
    const files = [];
    if (state.l4?.screenplay?.files) files.push(...state.l4.screenplay.files);
    log('Orchestrator', `📄 生成文件: ${files.length} 个`, 'info');
    for (const f of files) {
      log('Orchestrator', `  ${f}`, 'info');
    }
    
    if (state.l4?.continuityReport) {
      const r = state.l4.continuityReport;
      log('Orchestrator', `🔍 连续性检查: ${r.checksPassed}/${r.totalChecks} 通过`, r.checksFailed > 0 ? 'warn' : 'success');
    }

    // 保存编排状态
    fs.writeFileSync(path.join(outputDir, 'pipeline-state.json'), JSON.stringify({
      mode: state.mode,
      status: state.status,
      errors: state.errors,
      summary: {
        title: args.title,
        duration: args.duration,
        videoType: args.videoType,
        shots: state.l4?.storyPlan?.totalShots || 0
      }
    }, null, 2));

  } catch (e) {
    log('Orchestrator', `❌ 工作流失败: ${e.message}`, 'error');
    fs.writeFileSync(path.join(outputDir, 'ERROR.txt'), `${e.message}\n\n${e.stack}`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error(`❌ 致命错误: ${e.message}`);
  process.exit(1);
});
