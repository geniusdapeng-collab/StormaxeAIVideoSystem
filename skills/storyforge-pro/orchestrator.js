#!/usr/bin/env node
/**
 * StoryForge Pro v3.6-Peng — 整合编排器
 * 支持三种模式：原创 / IP重构 / 系列短剧
 * 
 * 整合 ScreenplayCraft 精华：
 * - IP解析五步法
 * - 系列化卡点设计
 * - 竖屏镜头语言
 * - 钩子工厂
 * - 奇观设计
 */

const fs = require('fs');
const path = require('path');
const PersonaVaultBridge = require('./persona-vault-bridge.js');
const VoiceCraftBridge = require('./voice-craft-bridge.js');
const { execAsync } = require('../seedance-director/scripts/exec-utils');

// ============ 配置 ============
const SKILLS_DIR = path.join(__dirname, 'fillers');
const ENHANCERS_DIR = path.join(__dirname, 'enhancers');
const RENDERERS_DIR = path.join(__dirname, 'renderers');
const UNIVERSE_DIR = path.join(__dirname, 'universe');

// ============ 主入口 ============
async function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  
  console.log('\n🎬 StoryForge Pro v3.6-Peng');
  console.log('   专业剧本创作系统（ScreenplayCraft整合版）\n');
  
  switch (command) {
    case 'create':
      await runOriginalMode(args);
      break;
    case 'adapt':
      await runIPReconstructionMode(args);
      break;
    case 'series':
      await runSeriesMode(args);
      break;
    case 'render':
      await runRenderOnly(args);
      break;
    default:
      printHelp();
  }
}

// ============ 模式 A: 原创 ============
async function runOriginalMode(args) {
  console.log('📖 模式: 原创\n');
  
  const outputDir = args.output || './storyforge-output';
  ensureDir(outputDir);
  
  // Step 1: 主题提炼
  console.log('▶️ Step 1: 主题提炼...');
  const theme = await runFiller('l1-concept/theme-extractor.js', {
    mode: 'original',
    concept: args.concept,
    userIntent: args.userIntent || args.concept
  });
  
  // Step 2: 世界观构建
  console.log('▶️ Step 2: 世界观构建...');
  const world = await runFiller('l1-concept/world-builder.js', {
    mode: 'original',
    theme: theme,
    styleHint: args.style
  });
  
  // Step 3: 并行构建叙事层
  console.log('▶️ Step 3: 叙事层（并行）...');
  // v5.5-Peng-CinePrompt: 检测用户大纲是否包含高潮段落，决定是否使用五幕结构
  const hasClimaxInOutline = /高潮[：:]|高潮幕|climax[：:]/i.test(args.concept || '');
  const structurePreference = hasClimaxInOutline ? 'five-act' : 'kishotenketsu';
  console.log(`   📐 结构偏好: ${structurePreference} (${hasClimaxInOutline ? '大纲含高潮段落' : '默认四幕'})`);
  
  const [structure, characters] = await Promise.all([
    runFiller('l2-narrative/structure-engine.js', { theme, world, duration: args.duration, videoType: args.videoType, structurePreference }),
    runFiller('l2-narrative/character-forge.js', { theme, world, characterCount: args.characterCount || 3 })
  ]);
  
  // Step 3.5: PersonaVault 角色灵魂铸造
  const pvBridge = new PersonaVaultBridge(outputDir);
  const forgedCharacters = await pvBridge.forgeCharacters(characters, theme, world);
  
  // Step 3.6: VoiceCraft 声纹提取
  const vcBridge = new VoiceCraftBridge(outputDir + '/voice-craft', outputDir);
  const voiceSignatures = await vcBridge.forgeVoiceSignatures(forgedCharacters.characters || characters);
  
  // Step 4: 情节编织（需要structure和characters）
  console.log('▶️ Step 4: 情节编织...');
  const plot = await runFiller('l2-narrative/plot-weaver.js', { 
    theme, world, structure, characterData: { characters: forgedCharacters.characters || characters }, videoType: args.videoType 
  });
  
  // Step 5: 并行构建剧本层
  console.log('▶️ Step 5: 剧本层（并行）...');
  const [scenes, dialogues, cinematography] = await Promise.all([
    runFiller('l3-script/scene-writer.js', { plot, characterData: { characters: forgedCharacters.characters || characters }, world }),
    runFiller('l3-script/dialogue-master.js', { plot, characterData: { characters: forgedCharacters.characters || characters }, world }),
    runFiller('l3-script/cinematography-planner.js', { plot, world, visualStyle: args.style, duration: args.duration, videoType: args.videoType })
  ]);
  
  // Step 5.5: PersonaVault 场景张力增强
  await pvBridge.enhanceScenes(scenes, forgedCharacters.characters || characters);
  
  // Step 5.6: VoiceCraft 声音注入（潜台词+对白+失控+沉默+校验）
  await vcBridge.enhanceScenes(scenes, forgedCharacters.characters || characters, {
    characterWounds: extractWounds(forgedCharacters.characters || characters)
  });
  
  // Step 6: 组装 Story Universe
  console.log('▶️ Step 6: 组装 Story Universe...');
  const universe = buildUniverse({ theme, world, structure, characters, plot, scenes, dialogues, cinematography, metadata: { title: args.title, concept: args.concept, duration: args.duration, mode: 'create', style: args.style, videoType: args.videoType } });
  
  // Step 7: 条件增强
  if (args.aspect === '9:16') {
    console.log('▶️ Step 7: 竖屏转换...');
    const verticalResult = await runEnhancer('m1-vertical-engine.js', universe.scenes);
    if (verticalResult && verticalResult.shots) universe.scenes = verticalResult;
  }
  
  if (args.spectacle !== 'minimal') {
    console.log('▶️ Step 8: 奇观设计...');
    const spectacleResult = await runEnhancer('m5-spectacle-designer.js', { scenes: universe.scenes, level: args.spectacle });
    if (spectacleResult && Array.isArray(spectacleResult.scenes)) {
      universe.scenes = spectacleResult.scenes;
    }
  }
  
  // Step 8: 保存 Universe
  const universePath = path.join(outputDir, 'story-universe.json');
  fs.writeFileSync(universePath, JSON.stringify(universe, null, 2));
  console.log(`✅ Universe 已保存: ${universePath}`);
  
  // Step 9: 渲染输出
  await renderAll(universe, outputDir, args);
  
  // Step 9.5: PersonaVault 生成角色报告
  await pvBridge.generateReport('md');
  
  // Step 9.6: VoiceCraft 生成声音报告
  const voiceReport = vcBridge.generateReport({ scenes, number: 1 }, 'md');
  fs.writeFileSync(path.join(outputDir, 'voice-report.md'), voiceReport);
  console.log('   ✅ voice-report.md');
  
  console.log('\n✅ 原创模式完成！');
  console.log(`   输出目录: ${outputDir}`);
}

// ============ 模式 B: IP重构 ============
async function runIPReconstructionMode(args) {
  console.log('📚 模式: IP 重构\n');
  
  const outputDir = args.output || './storyforge-output';
  ensureDir(outputDir);
  
  // Step 1: IP解析（五步解析法）
  console.log('▶️ Step 1: IP 解析...');
  const ipAnalysis = await runFiller('l1-concept/ip-deconstructor.js', {
    source: args.source,
    sourceType: args.sourceType || 'auto',
    extractDepth: args.depth || 'medium',
    retentionRatio: args.retention || 0.4,
    userCreativeDirection: args.essence || args.setting
  });
  
  // Step 2-8: 同原创模式，但从IP分析开始
  const theme = await runFiller('l1-concept/theme-extractor.js', { mode: 'ip-based', ipAnalysis });
  const world = await runFiller('l1-concept/world-builder.js', { mode: 'ip-rebuild', theme, ipAnalysis });
  
  // Step 3: 并行构建叙事层
  const [structure, characters] = await Promise.all([
    runFiller('l2-narrative/structure-engine.js', { theme, world }),
    runFiller('l2-narrative/character-forge.js', { theme, world, ipCharacterMapping: ipAnalysis.characterMatrix })
  ]);
  
  // Step 3.5: PersonaVault 角色灵魂铸造
  const pvBridge = new PersonaVaultBridge(outputDir);
  const forgedCharacters = await pvBridge.forgeCharacters(characters, theme, world);
  
  // Step 3.6: VoiceCraft 声纹提取
  const vcBridge = new VoiceCraftBridge(outputDir + '/voice-craft', outputDir);
  const voiceSignatures = await vcBridge.forgeVoiceSignatures(forgedCharacters.characters || characters);
  
  // Step 4: 情节编织
  const plot = await runFiller('l2-narrative/plot-weaver.js', { 
    theme, world, structure, characterData: { characters: forgedCharacters.characters || characters }, videoType: args.videoType 
  });
  
  // Step 5: 剧本层
  const [scenes, dialogues, cinematography] = await Promise.all([
    runFiller('l3-script/scene-writer.js', { plot, characterData: { characters: forgedCharacters.characters || characters }, world }),
    runFiller('l3-script/dialogue-master.js', { plot, characterData: { characters: forgedCharacters.characters || characters }, world }),
    runFiller('l3-script/cinematography-planner.js', { plot, world, visualStyle: args.style, duration: args.duration, videoType: args.videoType })
  ]);
  
  // Step 5.5: PersonaVault 场景张力增强
  await pvBridge.enhanceScenes(scenes, forgedCharacters.characters || characters);
  
  // Step 5.6: VoiceCraft 声音注入
  await vcBridge.enhanceScenes(scenes, forgedCharacters.characters || characters, {
    characterWounds: extractWounds(forgedCharacters.characters || characters)
  });
  
  const universe = buildUniverse({ theme, world, structure, characters, plot, scenes, dialogues, cinematography, ipAnalysis, metadata: { title: args.title, source: args.source, essence: args.essence, setting: args.setting, duration: args.duration, mode: 'adapt', style: args.style, videoType: args.videoType } });
  
  // 保存 Universe
  const universePath = path.join(outputDir, 'story-universe.json');
  fs.writeFileSync(universePath, JSON.stringify(universe, null, 2));
  
  // 额外输出 IP 分析报告
  fs.writeFileSync(path.join(outputDir, 'ip-analysis-report.md'), generateIPReport(ipAnalysis));
  
  // 渲染
  await renderAll(universe, outputDir, args);
  
  // Step 9.5: PersonaVault 生成角色报告
  await pvBridge.generateReport('md');
  
  // Step 9.6: VoiceCraft 生成声音报告
  const voiceReport = vcBridge.generateReport({ scenes, number: 1 }, 'md');
  fs.writeFileSync(path.join(outputDir, 'voice-report.md'), voiceReport);
  console.log('   ✅ voice-report.md');
  
  console.log('\n✅ IP 重构模式完成！');
  console.log(`   输出目录: ${outputDir}`);
  console.log(`   IP报告: ${path.join(outputDir, 'ip-analysis-report.md')}`);
}

// ============ 模式 C: 系列短剧 ============
async function runSeriesMode(args) {
  console.log('📺 模式: 系列短剧\n');
  
  const outputDir = args.output || './storyforge-output';
  ensureDir(outputDir);
  
  // Step 1-3: 同原创/IP模式
  const ipAnalysis = args.source ? await runFiller('l1-concept/ip-deconstructor.js', { source: args.source }) : null;
  const theme = await runFiller('l1-concept/theme-extractor.js', { mode: ipAnalysis ? 'ip-based' : 'original', ipAnalysis });
  const world = await runFiller('l1-concept/world-builder.js', { theme, ipAnalysis });
  
  // Step 4: 系列化架构（M4）
  console.log('▶️ Step 4: 系列化架构...');
  const seriesPlan = await runEnhancer('m4-series-arc.js', {
    world, theme,
    totalEpisodes: parseInt(args.episodes) || 10,
    worldRevealingPlan: { layer1: '1-10', layer2: '11-40', layer3: '41-80' }
  });
  
  // Step 5: 结构 + 卡点（M2）
  console.log('▶️ Step 5: 结构设计 + 卡点...');
  let structure = await runFiller('l2-narrative/structure-engine.js', { theme, world, seriesConfig: seriesPlan });
  structure = await runEnhancer('m2-paywall-engine.js', { structure, paywallPositions: args.paywallPositions || '10,28,58' });
  
  // Step 6: 角色生成
  const characters = await runFiller('l2-narrative/character-forge.js', { theme, world });
  
  // Step 6.5: PersonaVault 角色灵魂铸造
  const pvBridge = new PersonaVaultBridge(outputDir);
  const forgedCharacters = await pvBridge.forgeCharacters(characters, theme, world);
  
  // Step 6.6: VoiceCraft 声纹提取
  const vcBridge = new VoiceCraftBridge(outputDir + '/voice-craft', outputDir);
  const voiceSignatures = await vcBridge.forgeVoiceSignatures(forgedCharacters.characters || characters);
  
  // Step 7: 情节编织
  const plot = await runFiller('l2-narrative/plot-weaver.js', { 
    theme, world, structure, seriesConfig: seriesPlan,
    characterData: { characters: forgedCharacters.characters || characters }
  });
  
  // Step 8: 剧本层 + 钩子（M3）
  let [scenes, dialogues, cinematography] = await Promise.all([
    runFiller('l3-script/scene-writer.js', { plot, characterData: { characters: forgedCharacters.characters || characters }, world }),
    runFiller('l3-script/dialogue-master.js', { plot, characterData: { characters: forgedCharacters.characters || characters }, world, seriesMode: true }),
    runFiller('l3-script/cinematography-planner.js', { plot, world, duration: args.duration, videoType: args.videoType })
  ]);
  
  // 注入钩子
  scenes = await runEnhancer('m3-hook-factory.js', { scenes, hookDensity: 'high' });
  
  // Step 8.5: PersonaVault 场景张力增强
  await pvBridge.enhanceScenes(scenes, forgedCharacters.characters || characters);
  
  // Step 8.6: VoiceCraft 声音注入
  await vcBridge.enhanceScenes(scenes, forgedCharacters.characters || characters, {
    characterWounds: extractWounds(forgedCharacters.characters || characters)
  });
  
  // Step 9: 奇观（M5）
  scenes = await runEnhancer('m5-spectacle-designer.js', { scenes, level: 'standard' });
  
  // Step 10: 竖屏（M1）
  if (args.aspect === '9:16' || !args.aspect) {
    scenes = await runEnhancer('m1-vertical-engine.js', scenes);
  }
  
  // Step 11: 组装 Universe
  const universe = buildUniverse({ theme, world, structure, characters, plot, scenes, dialogues, cinematography, seriesPlan, metadata: { title: args.title, concept: args.concept, episodes: parseInt(args.episodes) || 10, duration: args.duration, mode: 'series', style: args.style, videoType: args.videoType, aspect: args.aspect } });
  
  // Step 12: 分集生成
  console.log('▶️ Step 12: 分集生成...');
  const episodes = generateEpisodes(universe, seriesPlan);
  
  // 保存
  fs.writeFileSync(path.join(outputDir, 'story-universe.json'), JSON.stringify(universe, null, 2));
  fs.writeFileSync(path.join(outputDir, 'series-plan.json'), JSON.stringify(seriesPlan, null, 2));
  
  // 分集保存
  const episodesDir = path.join(outputDir, 'episodes');
  ensureDir(episodesDir);
  for (const ep of episodes) {
    const epDir = path.join(episodesDir, `E${String(ep.number).padStart(3, '0')}`);
    ensureDir(epDir);
    fs.writeFileSync(path.join(epDir, 'screenplay.json'), JSON.stringify(ep.screenplay, null, 2));
    fs.writeFileSync(path.join(epDir, 'story-plan.json'), JSON.stringify(ep.storyPlan, null, 2));
  }
  
  // Step 13: PersonaVault 生成角色报告
  await pvBridge.generateReport('md');
  
  // Step 14: VoiceCraft 生成声音报告
  const voiceReport = vcBridge.generateReport({ scenes, number: 1 }, 'md');
  fs.writeFileSync(path.join(outputDir, 'voice-report.md'), voiceReport);
  console.log('   ✅ voice-report.md');
  
  console.log('\n✅ 系列短剧模式完成！');
  console.log(`   输出目录: ${outputDir}`);
  console.log(`   分集数: ${episodes.length}`);
}

// ============ 工具函数 ============
async function runFiller(scriptPath, input) {
  const fullPath = path.join(SKILLS_DIR, scriptPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️ Filler未实现: ${scriptPath}`);
    return generateMockOutput(path.basename(scriptPath, '.js'), input);
  }
  
  // 🆕 v1.0-Peng: 使用traceId-based临时文件管理
  const tmpManager = new TempFileManager(`filler-${path.basename(scriptPath, '.js')}`);
  const inputPath = tmpManager.createPath('input');
  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));
  
  const outputPath = tmpManager.createPath('output');
  
  try {
    
    await execAsync(`node "${fullPath}" --input "${inputPath}" --output "${outputPath}"`, { 
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    if (fs.existsSync(outputPath)) {
      const raw = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      // filler输出格式: { output: { ... } }
      return raw.output || raw;
    }
    return generateMockOutput(path.basename(scriptPath, '.js'), input);
  } catch (e) {
    console.log(`   ⚠️ Filler执行失败: ${e.message}`);
    return generateMockOutput(path.basename(scriptPath, '.js'), input);
  } finally {
    // 清理临时文件
    await tmpManager.cleanup();
  }
}

async function runEnhancer(scriptPath, input) {
  const fullPath = path.join(ENHANCERS_DIR, scriptPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️ Enhancer未实现: ${scriptPath}`);
    return input;
  }
  
  // 🆕 v1.0-Peng: 使用traceId-based临时文件管理
  const tmpManager = new TempFileManager(`enhancer-${path.basename(scriptPath, '.js')}`);
  const inputPath = tmpManager.createPath('enhancer-input');
  const outputPath = tmpManager.createPath('enhancer-output');
  
  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));
  
  try {
    
    await execAsync(`node "${fullPath}" --input "${inputPath}" --output "${outputPath}"`, {
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    if (fs.existsSync(outputPath)) {
      const raw = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      return raw.output || raw;
    }
    return input;
  } catch (e) {
    console.log(`   ⚠️ Enhancer执行失败: ${e.message}`);
    return input;
  } finally {
    // 清理临时文件
    await tmpManager.cleanup();
  }
}

function buildUniverse(data) {
  return {
    version: '3.5-Peng',
    createdAt: new Date().toISOString(),
    metadata: data.metadata || null,
    theme: data.theme,
    world: data.world,
    plot: data.structure || data.plot,
    characters: data.characters?.characters || data.characters,
    scenes: data.scenes,
    dialogues: data.dialogues,
    cinematography: data.cinematography,
    ipAnalysis: data.ipAnalysis || null,
    seriesPlan: data.seriesPlan || null
  };
}

async function renderAll(universe, outputDir, args) {
  console.log('▶️ 渲染输出...');
  
  // 剧本视图
  const scriptRenderer = path.join(RENDERERS_DIR, 'script-renderer.js');
  if (fs.existsSync(scriptRenderer)) {
    const { ScriptRenderer } = require(scriptRenderer);
    const renderer = new ScriptRenderer();
    const script = renderer.render(universe);
    fs.writeFileSync(path.join(outputDir, 'screenplay.md'), script);
    console.log('   ✅ screenplay.md');
  }
  
  // 视频视图（对接Seedance）
  const videoRenderer = path.join(RENDERERS_DIR, 'video-renderer.js');
  if (fs.existsSync(videoRenderer)) {
    const { VideoViewRenderer } = require(videoRenderer);
    const renderer = new VideoViewRenderer();
    const videoView = renderer.render(universe);
    fs.writeFileSync(path.join(outputDir, 'video-view.json'), JSON.stringify(videoView, null, 2));
    
    // 导演适配
    const adapter = path.join(RENDERERS_DIR, 'director-adapter.js');
    if (fs.existsSync(adapter)) {
      const { DirectorAdapter } = require(adapter);
      new DirectorAdapter().generateFilesFromView(videoView, outputDir);
      console.log('   ✅ story-plan.json (Seedance对接)');
    }
  }
  
  // 音频视图
  const audioRenderer = path.join(RENDERERS_DIR, 'audio-renderer.js');
  if (fs.existsSync(audioRenderer)) {
    const { AudioRenderer } = require(audioRenderer);
    const renderer = new AudioRenderer();
    const audioView = renderer.render(universe);
    fs.writeFileSync(path.join(outputDir, 'audio-view.json'), JSON.stringify(audioView, null, 2));
    console.log('   ✅ audio-view.json');
  }
}

function generateIPReport(ipAnalysis) {
  return `# IP 解析报告

## 精神内核 DNA
${ipAnalysis.spiritualCore?.coreDNA || '未提取'}

## 不可简化元素
${(ipAnalysis.spiritualCore?.irreducibleElements || []).map(e => `- ${e}`).join('\n')}

## 保留/转化/舍弃计划
### 保留
${(ipAnalysis.retentionPlan?.elementsToKeep || []).map(e => `- ${e}`).join('\n')}

### 转化
${(ipAnalysis.retentionPlan?.elementsToTransform || []).map(e => `- ${e}`).join('\n')}

### 舍弃
${(ipAnalysis.retentionPlan?.elementsToDiscard || []).map(e => `- ${e}`).join('\n')}

## 对比矩阵
| 维度 | 原作 | 新创作 |
|------|------|--------|
| 设定 | ${ipAnalysis.comparisonMatrix?.original?.setting || '-'} | ${ipAnalysis.comparisonMatrix?.rebuild?.setting || '-'} |
| 基调 | ${ipAnalysis.comparisonMatrix?.original?.tone || '-'} | ${ipAnalysis.comparisonMatrix?.rebuild?.tone || '-'} |
| 主角 | ${ipAnalysis.comparisonMatrix?.original?.protagonist || '-'} | ${ipAnalysis.comparisonMatrix?.rebuild?.protagonist || '-'} |
`;
}

function generateEpisodes(universe, seriesPlan) {
  // 简化：为每集提取相关场景
  const episodes = [];
  const totalEpisodes = seriesPlan.totalEpisodes || 80;
  
  for (let i = 1; i <= totalEpisodes; i++) {
    episodes.push({
      number: i,
      title: `第${i}集`,
      screenplay: { scenes: [] },
      storyPlan: {}
    });
  }
  
  return episodes;
}

function extractWounds(characters) {
  const wounds = {};
  // v5.1-Peng: 防御式编程，确保characters是数组
  const charArray = Array.isArray(characters) ? characters : (characters ? [characters] : []);
  for (const char of charArray) {
    const id = char.id || char.characterId;
    if (id) {
      wounds[id] = {
        triggers: char.wound?.triggers || [char.wound?.surface || ''].filter(Boolean)
      };
    }
  }
  return wounds;
}

function generateMockOutput(name, input) {
  // 简化的Mock输出
  return { mock: true, filler: name, inputKeys: Object.keys(input) };
}

// ============ 新增: 临时文件管理器 v1.0-Peng ============
class TempFileManager {
  constructor(traceId, baseDir = '/tmp/storyforge-pro') {
    this.traceId = traceId || `tf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.counter = 0;
    this.createdFiles = [];
    this.baseDir = path.join(baseDir, this.traceId);
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  createPath(prefix, extension = 'json') {
    const filename = `${prefix}-${this.traceId}-${++this.counter}.${extension}`;
    const filepath = path.join(this.baseDir, filename);
    this.createdFiles.push(filepath);
    return filepath;
  }

  async cleanup() {
    for (const file of this.createdFiles) {
      try { fs.unlinkSync(file); } catch (e) { /* ignore */ }
    }
    try { fs.rmdirSync(this.baseDir); } catch (e) { /* ignore */ }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].replace(/^--/, '');
      const value = argv[i + 1];
      if (value && !value.startsWith('--')) {
        args[key] = value;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function printHelp() {
  console.log(`
用法:
  node storyforge-pro.js create --title "作品名" --concept "概念" [options]
  node storyforge-pro.js adapt --source "西游记" --essence "反抗权威" [options]
  node storyforge-pro.js series --title "作品名" --episodes 80 [options]

选项:
  --title          作品标题
  --concept        核心概念（原创模式）
  --source         IP来源（改编模式）
  --essence        保留的精神内核
  --setting        新背景设定
  --genre          类型
  --duration       时长（秒）
  --aspect         画幅（16:9 或 9:16）
  --episodes       集数（系列模式）
  --spectacle      奇观级别（minimal/standard/maximum）
  --output         输出目录
  --help           显示帮助
`);
}

main().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});