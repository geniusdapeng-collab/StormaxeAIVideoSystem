#!/usr/bin/env node
/**
 * MicroMotion — 微动作增强渲染系统 v1.0-Peng
 * 主控制脚本 (CLI入口)
 * 
 * 命令:
 *   mm enhance --shot S01 --input prompt.json --output enhanced.json
 *   mm face --shot S01 --emotion anger --intensity 4
 *   mm body --shot S01 --stance defensive
 *   mm eye --shot S01 --direction lock
 *   mm breath --shot S01 --pattern angry
 *   mm world --shot S01 --scene 诀别场景
 *   mm batch --input prompts.json --output enhanced/
 *   mm diff --shot S01
 *   mm state
 * 
 * 接入点: seedance-adapter 之后 → Seedance API 之前
 */

const fs = require('fs');
const path = require('path');

const { FaceSculptorAgent } = require('../agents/face-sculptor');
const { BodyLanguageAgent } = require('../agents/body-language');
const { EyeDirectorAgent } = require('../agents/eye-director');
const { BreathEngineAgent } = require('../agents/breath-engine');
const { WorldBreathAgent } = require('../agents/world-breath');
const { MergeAgent } = require('../agents/merge');

// ============ 配置 ============
const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');
const DEFAULT_OUTPUT_DIR = path.join(WORKSPACE, 'micromotion-output');

// ============ 工具函数 ============
function log(section, msg, level = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const icon = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', phase: '🎬', progress: '⏳' }[level] || 'ℹ️';
  console.log(`${icon} [${timestamp}] [${section}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`文件不存在: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ============ 核心类 ============
class MicroMotionSystem {
  constructor(options = {}) {
    this.outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
    this.faceAgent = new FaceSculptorAgent();
    this.bodyAgent = new BodyLanguageAgent();
    this.eyeAgent = new EyeDirectorAgent();
    this.breathAgent = new BreathEngineAgent();
    this.worldAgent = new WorldBreathAgent();
    this.mergeAgent = new MergeAgent();
    
    ensureDir(this.outputDir);
  }

  /**
   * 增强单个镜头
   */
  enhanceShot(shot, context = {}) {
    log('MicroMotion', `开始增强镜头 ${shot.shotId}`, 'phase');
    
    // 五路Agent并行增强
    const faceResult = this.faceAgent.enhance(shot, context);
    const bodyResult = this.bodyAgent.enhance(shot, context);
    const eyeResult = this.eyeAgent.enhance(shot, context);
    const breathResult = this.breathAgent.enhance(shot, context);
    const worldResult = this.worldAgent.enhance(shot, context);
    
    log('MicroMotion', `  Face: ${faceResult.emotion}(${faceResult.intensity})`, 'success');
    log('MicroMotion', `  Body: ${bodyResult.stance}`, 'success');
    log('MicroMotion', `  Eye: ${eyeResult.eyeType}(${eyeResult.direction})`, 'success');
    log('MicroMotion', `  Breath: ${breathResult.pattern}`, 'success');
    log('MicroMotion', `  World: ${worldResult.sceneType || context.sceneType || '通用场景'}`, 'success');
    
    // Merge融合
    const merged = this.mergeAgent.merge(shot, {
      face: faceResult,
      body: bodyResult,
      eye: eyeResult,
      breath: breathResult,
      world: worldResult
    });
    
    log('MicroMotion', `  Merge: ${merged.enhancementSummary}`, 'success');
    
    const result = {
      shotId: shot.shotId,
      original: merged.original,
      enhanced: merged.enhanced,
      mood: merged.mood,
      camera: merged.camera,
      transition: merged.transition,
      dialogueCue: merged.dialogueCue,
      specialEffects: merged.specialEffects,
      agents: {
        face: faceResult,
        body: bodyResult,
        eye: eyeResult,
        breath: breathResult,
        world: worldResult
      },
      merge: merged,
      seedanceCompatible: true
    };
    
    // 保存到状态总线（追加模式）
    this._saveShotToStateBus(result, context);
    
    return result;
  }

  /**
   * 将单个镜头结果追加到状态总线文件
   */
  _saveShotToStateBus(result, context = {}) {
    const statePath = path.join(this.outputDir, 'motion-state.json');
    let stateBus;
    
    if (fs.existsSync(statePath)) {
      stateBus = loadJson(statePath);
    } else {
      stateBus = {
        version: '1.0-Peng',
        project: context.project || 'untitled',
        lastUpdated: new Date().toISOString(),
        faceEnhancements: {},
        bodyEnhancements: {},
        eyeEnhancements: {},
        breathEnhancements: {},
        worldBreathElements: {},
        mergedPrompts: {}
      };
    }
    
    const shotId = result.shotId;
    stateBus.lastUpdated = new Date().toISOString();
    
    stateBus.faceEnhancements[shotId] = {
      emotion: result.agents.face.emotion,
      intensity: result.agents.face.intensity,
      microActions: result.agents.face.microActions,
      seedancePrompt: result.agents.face.seedancePrompt
    };
    stateBus.bodyEnhancements[shotId] = {
      stance: result.agents.body.stance,
      microMovements: result.agents.body.microDescriptions,
      seedancePrompt: result.agents.body.seedancePrompt
    };
    stateBus.eyeEnhancements[shotId] = {
      direction: result.agents.eye.eyeType,
      movement: result.agents.eye.direction,
      seedancePrompt: result.agents.eye.seedancePrompt
    };
    stateBus.breathEnhancements[shotId] = {
      pattern: result.agents.breath.pattern,
      rate: result.agents.breath.rate,
      seedancePrompt: result.agents.breath.seedancePrompt
    };
    stateBus.worldBreathElements[shotId] = {
      elements: result.agents.world.elements,
      seedancePrompt: result.agents.world.seedancePrompt
    };
    stateBus.mergedPrompts[shotId] = {
      original: result.original,
      enhanced: result.enhanced
    };
    
    saveJson(statePath, stateBus);
  }

  /**
   * 批量增强多个镜头
   */
  enhanceBatch(shots, context = {}) {
    log('MicroMotion', `批量增强 ${shots.length} 个镜头`, 'phase');
    
    const results = [];
    
    for (const shot of shots) {
      const result = this.enhanceShot(shot, context);
      results.push(result);
    }
    
    // 从文件读取权威状态总线（enhanceShot 已保存）
    const statePath = path.join(this.outputDir, 'motion-state.json');
    let stateBus;
    if (fs.existsSync(statePath)) {
      stateBus = loadJson(statePath);
    } else {
      stateBus = {
        version: '1.0-Peng',
        project: context.project || 'untitled',
        lastUpdated: new Date().toISOString(),
        faceEnhancements: {},
        bodyEnhancements: {},
        eyeEnhancements: {},
        breathEnhancements: {},
        worldBreathElements: {},
        mergedPrompts: {}
      };
    }
    
    // 添加报告字段到内存中的 stateBus 供返回
    stateBus.totalShots = results.length;
    stateBus.totalEnhanced = results.length;
    stateBus.shots = results.map(r => ({
      shotId: r.shotId,
      originalLength: r.original.length,
      enhancedLength: r.enhanced.length,
      additions: r.enhanced.length - r.original.length
    }));
    
    log('MicroMotion', `状态总线已保存: ${statePath}`, 'success');
    
    return { results, stateBus };
  }

  /**
   * 从文件批量处理
   */
  enhanceFromFile(inputPath, outputDir) {
    const data = loadJson(inputPath);
    const shots = data.shots || data.prompts || [data];
    const context = data.context || {};
    
    const { results, stateBus } = this.enhanceBatch(shots, context);
    
    // 保存增强后的提示词
    const enhancedPath = path.join(outputDir || this.outputDir, 'seedance-prompt-enhanced.json');
    saveJson(enhancedPath, {
      version: 'v1.0-Peng',
      totalShots: results.length,
      shots: results.map(r => ({
        shotId: r.shotId,
        original: r.original,
        enhanced: r.enhanced,
        mood: r.mood,
        specialEffects: r.specialEffects
      }))
    });
    log('MicroMotion', `增强提示词已保存: ${enhancedPath}`, 'success');
    
    // 保存增强报告
    const reportPath = path.join(outputDir || this.outputDir, 'enhancement-report.json');
    saveJson(reportPath, {
      version: 'v1.0-Peng',
      totalShots: results.length,
      agents: ['FaceSculptor', 'BodyLanguage', 'EyeDirector', 'BreathEngine', 'WorldBreath'],
      summary: results.map(r => ({
        shotId: r.shotId,
        enhancements: r.merge.enhancementSummary,
        promptLength: { original: r.original.length, enhanced: r.enhanced.length }
      }))
    });
    log('MicroMotion', `增强报告已保存: ${reportPath}`, 'success');
    
    return { results, stateBus, enhancedPath, reportPath };
  }

  /**
   * 对比增强前后
   */
  diff(shotId, stateBusPath) {
    const stateBus = loadJson(stateBusPath);
    const merged = stateBus.mergedPrompts[shotId];
    
    if (!merged) {
      log('Diff', `镜头 ${shotId} 未找到`, 'error');
      return null;
    }
    
    return {
      shotId,
      original: merged.original,
      enhanced: merged.enhanced,
      additions: merged.enhanced.length - merged.original.length,
      face: stateBus.faceEnhancements[shotId] || {},
      body: stateBus.bodyEnhancements[shotId] || {},
      eye: stateBus.eyeEnhancements[shotId] || {},
      breath: stateBus.breathEnhancements[shotId] || {},
      world: stateBus.worldBreathElements[shotId] || {}
    };
  }
}

// ============ CLI 入口 ============
function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const options = {};
  
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const val = args[i + 1];
    if (key && val) options[key] = val;
  }
  
  return { cmd, options };
}

async function main() {
  const { cmd, options } = parseArgs();
  const system = new MicroMotionSystem({ outputDir: options.output || DEFAULT_OUTPUT_DIR });
  
  try {
    switch (cmd) {
      case 'enhance': {
        // 增强单个镜头
        const shot = {
          shotId: options.shot || 'S01',
          character: options.character,
          emotion: options.emotion,
          emotionIntensity: options.intensity ? parseInt(options.intensity) : 3,
          cameraDistance: options.camera || 'medium',
          duration: options.duration ? parseFloat(options.duration) : 5,
          originalPrompt: options.prompt || ''
        };
        const result = system.enhanceShot(shot);
        console.log('\n=== 增强结果 ===');
        console.log(`原始: ${result.original}`);
        console.log(`增强: ${result.enhanced}`);
        console.log(`情绪: ${result.mood}`);
        console.log(`特效: ${result.specialEffects}`);
        break;
      }
      
      case 'batch': {
        // 批量增强
        const inputPath = options.input;
        if (!inputPath) {
          console.error('用法: mm batch --input <prompts.json> --output <dir>');
          process.exit(1);
        }
        const result = system.enhanceFromFile(inputPath, options.output);
        console.log(`\n✅ 批量增强完成: ${result.results.length} 个镜头`);
        console.log(`   输出: ${result.enhancedPath}`);
        break;
      }
      
      case 'diff': {
        // 对比增强前后
        const statePath = options.state || path.join(system.outputDir, 'motion-state.json');
        const diff = system.diff(options.shot || 'S01', statePath);
        if (diff) {
          console.log('\n=== 增强对比 ===');
          console.log(`镜头: ${diff.shotId}`);
          console.log(`原始: ${diff.original}`);
          console.log(`增强: ${diff.enhanced}`);
          console.log(`新增字符: ${diff.additions}`);
        }
        break;
      }
      
      case 'state': {
        // 查看状态总线
        const statePath = path.join(system.outputDir, 'motion-state.json');
        if (fs.existsSync(statePath)) {
          const state = loadJson(statePath);
          console.log('\n=== Motion State Bus ===');
          console.log(`项目: ${state.project}`);
          console.log(`更新时间: ${state.lastUpdated}`);
          console.log(`镜头数: ${Object.keys(state.mergedPrompts).length}`);
          if (options.shot) {
            const merged = state.mergedPrompts[options.shot];
            if (merged) {
              console.log(`\n[${options.shot}]`);
              console.log(`  原始: ${merged.original.substring(0, 80)}...`);
              console.log(`  增强: ${merged.enhanced.substring(0, 80)}...`);
            }
          }
        } else {
          console.log('状态总线未找到');
        }
        break;
      }
      
      default: {
        console.log(`
MicroMotion — 微动作增强渲染系统 v1.0-Peng

用法:
  mm enhance --shot S01 --emotion anger --intensity 4 --prompt "原始提示词"
  mm batch --input prompts.json --output ./output
  mm diff --shot S01 --state motion-state.json
  mm state --shot S01

命令:
  enhance  增强单个镜头
  batch    批量增强
  diff     对比增强前后
  state    查看状态总线
`);
      }
    }
  } catch (e) {
    log('Error', e.message, 'error');
    console.error(e.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MicroMotionSystem };
