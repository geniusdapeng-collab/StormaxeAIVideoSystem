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
      { id: 'doubao-seedance-2-0-260128', type: 'standard' },
      { id: 'doubao-seedance-2-0-260128', type: 'fast' },
      { id: 'doubao-seedance-1-5-pro-260128', type: 'standard' }
    ],
    maxConcurrent: 1,
    retryDelayMs: 2000,
    retryDelays: [60000, 120000, 300000],
    batchCooldown: 10000,
    batchCooldownMs: 3000,
    promptMaxLength: 1650,
    // 🆕 v6.11-Peng-fix3: 从990放宽至1650，与Prompt自然长度1541-1585匹配
    // 使利用率合规检查(85%-99% of 1650 = 1402-1633)与实际生成长度对齐
    degradationSteps: [
      { promptTrim: 30 },
      { promptTrim: 60 },
      { promptTrim: 100 }
    ],
    outputDir: path.join(WORKSPACE, 'productions')
  },
  
  postProduction: {
    enabled: true,
    ffmpegOptions: '-c copy',
    tts: {
      enabled: false,  // v1.3-Peng: 山海经系列默认禁用TTS配音（保留原始音效）
      voice: 'default'
    },
    // v1.3-Peng: 转场阈值配置
    transition: {
      thresholds: {
        dissolve: 0.2,      // 情绪差<0.2时， dissolve渐变
        fadeBlack: 0.5,     // 情绪差<0.5时， 黑场渐变
        hardCut: 1.0,       // 情绪差<1.0时， 硬切
        maxDuration: 1.0    // 最大转场时长
      },
      fadeDuration: 0.5
    }
  },
  
  compliance: {
    maxLength: 490,
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

module.exports = { CONFIG, getConfig, getConfigPath, getModelConfig, loadConfigFromFile, startConfigWatcher, onConfigChange, offConfigChange, CONFIG_VERSION };