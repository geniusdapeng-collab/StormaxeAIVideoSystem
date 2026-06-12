/**
 * Config Center — 配置集中管理 (P2-6.1: 配置热重载)

 */

const path = require('path');
const fs = require('fs');

const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');
const SKILLS_DIR = path.join(WORKSPACE, 'skills');
const CONFIG_FILE = path.join(WORKSPACE, 'config', 'seedance.json');

// 配置版本（用于兼容性校验）
const CONFIG_VERSION = 'v9.2-Peng';

// 默认配置（硬编码兜底）
const DEFAULT_CONFIG = {
  version: CONFIG_VERSION,
  
  // 统一技能路径管理
  SKILL_PATHS: {
    seedanceWrapper: path.join(SKILLS_DIR, 'byted-ark-seedance-skill/scripts/seedance-wrapper.js'),
    seedanceMain: path.join(SKILLS_DIR, 'byted-ark-seedance-skill/scripts/seedance.js'),
    storyEngine: path.join(SKILLS_DIR, 'seedance-story-engine/scripts/story-engine.js'),
    renderEngine: path.join(SKILLS_DIR, 'seedance-render-engine/scripts/seedance-render-engine.js'),
    postProduction: path.join(SKILLS_DIR, 'seedance-post-production/scripts/post-production.js'),
    soundDesign: path.join(SKILLS_DIR, 'seedance-sound-design/scripts/sound-design.js'),
    characterManager: path.join(SKILLS_DIR, 'seedance-character-manager/scripts/character-manager.js'),
    storyboardGenerator: path.join(SKILLS_DIR, 'seedance2-storyboard-generator/scripts/storyboard-generator.js')
  },
  
  render: {
    modelPriority: [
      { id: 'doubao-seedance-2.0', type: 'standard' },
      { id: 'doubao-seedance-2.0-fast', type: 'fast' },
      { id: 'doubao-seedance-1.5-pro', type: 'standard' }
    ],
    maxConcurrent: 1,
    retryDelayMs: 2000,
    retryDelays: [60000, 120000, 300000],
    batchCooldown: 10000,
    batchCooldownMs: 3000,
    promptMaxLength: 5500,
    safetyMargin: 10,
    degradationSteps: [
      { promptTrim: 30 },
      { promptTrim: 60 },
      { promptTrim: 100 }
    ],
    outputDir: path.join(WORKSPACE, 'productions')
  },
  
  // P2-6.1: 风格档案选择器（新增 v1.3-Peng）
  styleProfile: 'shanhai',  // 'shanhai' | 'hyperrealistic' | 自定义
  
  postProduction: {
    enabled: true,
    ffmpegOptions: '-c copy'
  },
  
  compliance: {
    maxLength: 5500,
    alignmentThreshold: 40,
    pitchMinScore: 7.5
  },
  
  promptGen: {
    maxTokens: 80,
    filenameMaxChars: 50
  },
  
  timeouts: {
    taskPoll: 10000,
    videoDownload: 60000,
    ffmpeg: 300000
  },
  
  // P2-4.2: 预算硬锁
  budget: {
    renderBudgetUSD: 10.0,
    hardLimit: true  // true=超预算时拒绝新渲染，false=仅警告
  },

  // ============================================================================
  // Phase 8: LLM 配置集中管理
  // ============================================================================
  llm: {
    // 默认模型
    defaultModel: 'deepseek-chat',
    
    // 模型降级链（按优先级）
    fallbackChain: [
      'deepseek/deepseek-v4-pro',
      'bailian/kimi-k2.5',
      'bailian/qwen3.5-plus'
    ],

    // 各阶段 LLM 参数配置
    // temperature: 0.0=确定性输出, 0.3=保守, 0.5=平衡, 0.7=创意, 1.0=高随机
    // maxTokens: 生成上限，-1=模型默认
    stages: {
      // Stage 1: PRD 生成 — 需要创意和结构
      'prd-generation':        { temperature: 0.7, maxTokens: 8192,  timeout: 30000,  description: '产品需求文档生成' },
      // Stage 2: 需求对齐 — 保守分析
      'requirement-alignment': { temperature: 0.3, maxTokens: 4096,  timeout: 30000,  description: '需求与PRD对齐校验' },
      // Stage 3: Schema 生成 — 需要创意结构
      'schema-generation':      { temperature: 0.7, maxTokens: 8192,  timeout: 60000,  description: '故事Schema生成' },
      // Stage 4: 故事板审片 — 严格评估
      'storyboard-review':     { temperature: 0.4, maxTokens: 2048,  timeout: 30000,  description: '故事板审片评估' },
      // Stage 5: 角色定妆照 — 需要精确
      'character-lookup':      { temperature: 0.5, maxTokens: 4096,  timeout: 60000,  description: '角色定妆照描述生成' },
      // Stage 6: 合规检查 — 严格规则
      'compliance-check':       { temperature: 0.2, maxTokens: 2048,  timeout: 30000,  description: '合规检查评估' },
      // Stage 7: 时长分配 — 精确计算
      'duration-allocation':   { temperature: 0.3, maxTokens: 4096,  timeout: 30000,  description: '镜头时长分配' },
      // Stage 7.5: 对白生成 — 需要创意
      'dialogue-generation':    { temperature: 0.7, maxTokens: 4096,  timeout: 30000,  description: '角色对白生成' },
      // Stage 8: 运镜控制 — 精确指令
      'cinematography':        { temperature: 0.4, maxTokens: 2048,  timeout: 30000,  description: '运镜控制生成' },
      // Stage 9: 导演优化 — 保守微调
      'director-optimize':      { temperature: 0.3, maxTokens: 128000, timeout: 60000,  description: '导演风格优化' },
      // Stage 10: 脚本写实 — 精确指令
      'scriptwriter':           { temperature: 0.4, maxTokens: 128000, timeout: 60000,  description: '脚本写实优化' },
      // Stage 11: Prompt预生成 — 平衡
      'prompt-pregeneration':   { temperature: 0.5, maxTokens: 4096,  timeout: 30000,  description: 'Prompt预生成' },
      // Stage 12: 质量检查 — 严格评估
      'quality-check':          { temperature: 0.2, maxTokens: 2048,  timeout: 30000,  description: '质量检查评估' },
      // Story plan repair — 保守修复
      'storyplan-repair':      { temperature: 0.2, maxTokens: 4096,  timeout: 30000,  description: '故事计划修复' },
      // 默认兜底
      'default':               { temperature: 0.5, maxTokens: 4096,  timeout: 30000,  description: '默认LLM配置' }
    }
  }
};

// 运行时配置（可变）
let CONFIG = { ...DEFAULT_CONFIG };
let configWatchers = [];
let isWatching = false;

/**
 * 从文件加载配置
 */
function loadConfigFromFile() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`[ConfigCenter] 配置文件不存在，使用默认配置: ${CONFIG_FILE}`);
    return DEFAULT_CONFIG;
  }
  
  try {
    const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const fileConfig = JSON.parse(fileContent);
    
    // 版本兼容性校验
    if (!validateConfigVersion(fileConfig)) {
      console.warn(`[ConfigCenter] 配置版本不兼容，使用默认配置`);
      return DEFAULT_CONFIG;
    }
    
    // 深度合并（文件配置覆盖默认）
    const merged = deepMerge(DEFAULT_CONFIG, fileConfig);
    console.log(`[ConfigCenter] 配置已加载: ${CONFIG_FILE}`);
    return merged;
  } catch (err) {
    console.error(`[ConfigCenter] 配置加载失败: ${err.message}，使用默认配置`);
    return DEFAULT_CONFIG;
  }
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * 配置版本兼容性校验
 */
function validateConfigVersion(config) {
  if (!config.version) return true; // 无版本视为兼容
  
  // 提取主版本号（v9.2-Peng → v9）
  const fileMajor = config.version.match(/^v(\d+)/)?.[1];
  const currentMajor = CONFIG_VERSION.match(/^v(\d+)/)?.[1];
  
  if (fileMajor && currentMajor && fileMajor !== currentMajor) {
    console.error(`[ConfigCenter] 配置版本不兼容: 文件=${config.version}, 当前=${CONFIG_VERSION}`);
    return false;
  }
  
  return true;
}

/**
 * 启动配置热重载监听（P2-6.1）
 */
function startConfigWatcher() {
  if (isWatching || !fs.existsSync(CONFIG_FILE)) return;
  
  isWatching = true;
  const watcher = fs.watch(CONFIG_FILE, (eventType) => {
    if (eventType === 'change') {
      console.log(`[ConfigCenter] 配置文件变更，重新加载...`);
      const newConfig = loadConfigFromFile();
      if (validateConfigVersion(newConfig)) {
        CONFIG = newConfig;
        // 通知所有监听器
        configWatchers.forEach(cb => {
          try { cb(CONFIG); } catch (e) { console.error(e); }
        });
        console.log(`[ConfigCenter] 配置热重载完成`);
      }
    }
  });
  
  console.log(`[ConfigCenter] 配置热重载监听已启动: ${CONFIG_FILE}`);
  return watcher;
}

/**
 * 注册配置变更回调
 */
function onConfigChange(callback) {
  configWatchers.push(callback);
}

/**
 * 移除配置变更回调
 */
function offConfigChange(callback) {
  configWatchers = configWatchers.filter(cb => cb !== callback);
}

// 初始化：加载配置
CONFIG = loadConfigFromFile();

// 自动启动热重载监听（如果配置文件存在）
if (fs.existsSync(CONFIG_FILE)) {
  startConfigWatcher();
}

function getConfig() {
  return CONFIG;
}

function getConfigPath() {
  return path.join(__dirname, '../config');
}

function getModelConfig(modelId) {
  return CONFIG.render.modelPriority.find(m => m.id === modelId);
}

/**
 * Phase 8: 获取指定阶段的 LLM 配置
 * @param {string} stage - 阶段标识（如 'dialogue-generation', 'cinematography'）
 * @param {Object} overrides - 运行时覆盖参数 { temperature?, maxTokens?, model? }
 * @returns {Object} { model, temperature, maxTokens, timeout }
 */
function getLLMConfig(stage, overrides = {}) {
  const stageConfig = CONFIG.llm?.stages?.[stage] || CONFIG.llm?.stages?.['default'];
  return {
    model: overrides.model || CONFIG.llm.defaultModel,
    temperature: overrides.temperature ?? stageConfig.temperature ?? 0.5,
    maxTokens: overrides.maxTokens ?? stageConfig.maxTokens ?? 4096,
    timeout: overrides.timeout ?? stageConfig.timeout ?? 30000
  };
}

/**
 * Phase 8: 获取模型降级链
 */
function getLLMFallbackChain() {
  return CONFIG.llm?.fallbackChain || [];
}

module.exports = {
  CONFIG,
  getConfig,
  getConfigPath,
  getModelConfig,
  getLLMConfig,
  getLLMFallbackChain,
  loadConfigFromFile,
  startConfigWatcher,
  onConfigChange,
  offConfigChange,
  CONFIG_VERSION
};

