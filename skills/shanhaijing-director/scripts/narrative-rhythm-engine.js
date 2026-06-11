/**
 * Narrative Rhythm Engine v1.0-Peng
 * 基于《AI视频生成提示词工程方法论》叙事节奏引擎
 * 
 * 定位：提示词构建的叙事节奏增强层
 * 被引用：story-engine.js 组装流水线、prompt-field-standard.js
 * 作用：为 Action/Scene 字段注入叙事节奏、情绪曲线、节拍设计
 */

class NarrativeRhythmEngine {
  constructor() {
    this.version = 'v1.0-Peng';
    
    // ========== 三幕式微叙事模板（适用于 4-10秒） ==========
    this.THREE_ACT_TEMPLATE = {
      setup: {
        range: [0, 0.4],  // 占片长时间 0-40%
        name: 'SETUP',
        description: '建立空间、引入主体、设定基调',
        actionIntensity: 'low',
        pace: 'slow or static',
        purpose: 'establish, accumulate, introduce'
      },
      development: {
        range: [0.3, 0.7],
        name: 'DEVELOPMENT',
        description: '动作展开、冲突/穿越、张力累积',
        actionIntensity: 'medium to high',
        pace: 'accelerating',
        purpose: 'develop, escalate, conflict'
      },
      climax: {
        range: [0.6, 1.0],
        name: 'CLIMAX/RESOLUTION',
        description: '高潮揭示、情绪释放、定格收束',
        actionIntensity: 'peak then freeze',
        pace: 'peak → solidify',
        purpose: 'climax, release, resolve'
      }
    };
    
    // ========== 情绪曲线模板（6阶段） ==========
    this.EMOTION_CURVES = {
      build: {
        stages: [
          { pos: 0, intensity: 'low', label: '建立，安静进入' },
          { pos: 0.1, intensity: 'low-mid', label: '发展，信息积累' },
          { pos: 0.3, intensity: 'mid', label: '转折，节奏变化' },
          { pos: 0.5, intensity: 'mid-high', label: '加速，张力上升' },
          { pos: 0.7, intensity: 'high', label: '高潮，峰值体验' },
          { pos: 0.9, intensity: 'frozen', label: '定格，余韵' }
        ]
      },
      release: {
        stages: [
          { pos: 0, intensity: 'high', label: '冲击开场' },
          { pos: 0.2, intensity: 'high-mid', label: '维持张力' },
          { pos: 0.4, intensity: 'mid', label: '释放' },
          { pos: 0.6, intensity: 'mid-low', label: '回落' },
          { pos: 0.8, intensity: 'low', label: '平静' },
          { pos: 1.0, intensity: 'low', label: '余韵' }
        ]
      },
      wave: {
        stages: [
          { pos: 0, intensity: 'low', label: '平缓' },
          { pos: 0.25, intensity: 'mid', label: '第一次波动' },
          { pos: 0.5, intensity: 'low', label: '回落' },
          { pos: 0.75, intensity: 'high', label: '第二次波动（更高）' },
          { pos: 0.9, intensity: 'peak', label: '峰值' },
          { pos: 1.0, intensity: 'frozen', label: '定格' }
        ]
      },
      collapse: {
        stages: [
          { pos: 0, intensity: 'peak', label: '冲击开始' },
          { pos: 0.15, intensity: 'high', label: '维持' },
          { pos: 0.3, intensity: 'mid', label: '开始崩塌' },
          { pos: 0.5, intensity: 'low', label: '加速下落' },
          { pos: 0.75, intensity: 'low', label: '触底' },
          { pos: 1.0, intensity: 'frozen', label: '凝固' }
        ]
      }
    };
    
    // ========== 节拍类型定义 ==========
    this.BEAT_TYPES = {
      camera: {
        name: '机位节拍',
        description: '镜头运动或切换',
        examples: ['从水下到破出水面', '推进到角色面部', '环绕 360°']
      },
      action: {
        name: '动作节拍',
        description: '主体或环境的新动作',
        examples: ['浪从涌起到破碎', '角色开始奔跑', '门突然打开']
      },
      lighting: {
        name: '光影节拍',
        description: '光线的显著变化',
        examples: ['从暗到亮', '轮廓光出现', '闪电照亮场景']
      },
      reveal: {
        name: '揭示节拍',
        description: '新信息的展现',
        examples: ['人物从黑暗中显现', '镜头揭示全貌', '关键道具出现']
      },
      emotion: {
        name: '情绪节拍',
        description: '情绪基调的转换',
        examples: ['从紧张到宁静', '希望出现', '绝望加深']
      }
    };
    
    // ========== 动静对比设计（6种模式） ==========
    this.DYNAMIC_MODES = {
      movingSubject_staticEnv: {
        name: '动主体+静环境',
        effect: '主体突出，孤独感',
        terms: ['person running through still landscape', 'figure walking in empty space', 'solo dancer against static backdrop']
      },
      staticSubject_movingEnv: {
        name: '静主体+动环境',
        effect: '环境力量，主体脆弱',
        terms: ['person standing still in raging storm', 'character facing advancing flames', 'warrior holding ground against tide']
      },
      sync: {
        name: '动+动同步',
        effect: '和谐，融入',
        terms: ['dancer moving with flowing water', 'runner matching pace with wind', 'surfer riding wave in harmony']
      },
      conflict: {
        name: '动+动对抗',
        effect: '冲突，张力',
        terms: ['person running against strong wind', 'swimmer battling current', 'soldier advancing under fire']
      },
      allMotion: {
        name: '全动',
        effect: '混乱，失控',
        terms: ['everything in motion, chaotic scene', 'storm raging, debris flying, waves crashing', 'crowd surging forward']
      },
      allStatic: {
        name: '全静',
        effect: '凝固，永恒',
        terms: ['completely still, frozen in time', 'scene locked in moment of silence', 'everything suspended']
      }
    };
  }

  // ========== 核心方法 ==========

  /**
   * 获取指定情绪曲线
   * @param {string} curveType - 曲线类型
   * @returns {Object} 情绪曲线对象
   */
  getEmotionCurve(curveType) {
    return this.EMOTION_CURVES[curveType] || this.EMOTION_CURVES.build;
  }

  /**
   * 构建情绪曲线描述
   * @param {string} curveType - 曲线类型
   * @param {number} totalDuration - 总时长（秒）
   * @returns {string} 情绪曲线描述
   */
  buildEmotionCurve(curveType, totalDuration = 10) {
    const curve = this.getEmotionCurve(curveType);
    const stages = curve.stages;
    
    let parts = [];
    stages.forEach(stage => {
      const time = Math.round(stage.pos * totalDuration);
      parts.push(`[${time}s] ${stage.label}`);
    });
    
    return `emotion arc: ${curveType} | ${parts.join(' → ')}`;
  }

  /**
   * 构建三幕结构描述
   * @param {number} totalDuration - 总时长（秒）
   * @returns {Object} 三幕结构 { setup, development, climax }
   */
  buildThreeActStructure(totalDuration = 10) {
    const result = {};
    
    for (const [key, act] of Object.entries(this.THREE_ACT_TEMPLATE)) {
      const start = Math.round(act.range[0] * totalDuration);
      const end = Math.round(act.range[1] * totalDuration);
      result[key] = {
        name: act.name,
        timeRange: `[${start}s-${end}s]`,
        description: act.description,
        intensity: act.actionIntensity,
        pace: act.pace
      };
    }
    
    return result;
  }

  /**
   * 构建节拍设计
   * @param {number} totalDuration - 总时长（秒）
   * @param {number} beatInterval - 节拍间隔（秒，默认2-3）
   * @param {string[]} beatTypes - 节拍类型数组
   * @returns {string} 节拍描述
   */
  buildBeats(totalDuration = 10, beatInterval = 2.5, beatTypes = ['action', 'camera']) {
    let beats = [];
    let currentTime = 0;
    let beatIndex = 0;
    
    while (currentTime < totalDuration) {
      const beatType = beatTypes[beatIndex % beatTypes.length];
      const beatDef = this.BEAT_TYPES[beatType];
      const example = beatDef.examples[Math.floor(Math.random() * beatDef.examples.length)];
      
      beats.push(`[${Math.round(currentTime)}s] ${beatDef.name}: ${example}`);
      
      currentTime += beatInterval + (Math.random() * 1 - 0.5); // ±0.5s 随机
      beatIndex++;
    }
    
    return beats.join(' | ');
  }

  /**
   * 获取动静对比模式
   * @param {string} modeKey - 模式键
   * @returns {string} 动静对比描述
   */
  getDynamicMode(modeKey) {
    const mode = this.DYNAMIC_MODES[modeKey];
    if (!mode) return '';
    
    const term = mode.terms[Math.floor(Math.random() * mode.terms.length)];
    return `${mode.name} | ${mode.effect} | ${term}`;
  }

  /**
   * 构建完整叙事节奏字段
   * @param {Object} config - 配置对象
   * @param {string} config.curveType - 情绪曲线类型
   * @param {number} config.duration - 总时长（秒）
   * @param {string} config.dynamicMode - 动静对比模式
   * @param {number} config.beatInterval - 节拍间隔（秒）
   * @returns {string} 完整叙事节奏描述
   */
  build(config = {}) {
    const {
      curveType = 'build',
      duration = 10,
      dynamicMode = '',
      beatInterval = 2.5
    } = config;
    
    let parts = [];
    
    // 情绪曲线
    parts.push(this.buildEmotionCurve(curveType, duration));
    
    // 三幕结构
    const threeAct = this.buildThreeActStructure(duration);
    parts.push(`narrative structure: SETUP[${threeAct.setup.timeRange}] ${threeAct.setup.intensity} → ` +
                `DEVELOP[${threeAct.development.timeRange}] ${threeAct.development.intensity} → ` +
                `CLIMAX[${threeAct.climax.timeRange}] ${threeAct.climax.intensity}`);
    
    // 动静对比
    if (dynamicMode && this.DYNAMIC_MODES[dynamicMode]) {
      const mode = this.DYNAMIC_MODES[dynamicMode];
      parts.push(`dynamic contrast: ${mode.name} — ${mode.effect}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * 根据时长自动选择节拍间隔
   * @param {number} duration - 总时长（秒）
   * @returns {number} 推荐节拍间隔
   */
  getRecommendedBeatInterval(duration) {
    if (duration <= 5) return 1.5;
    if (duration <= 10) return 2.5;
    if (duration <= 15) return 3;
    return 4;
  }

  /**
   * 获取所有可用情绪曲线类型
   * @returns {string[]} 类型名称数组
   */
  listEmotionCurves() {
    return Object.keys(this.EMOTION_CURVES);
  }

  /**
   * 获取所有动静对比模式
   * @returns {string[]} 模式键数组
   */
  listDynamicModes() {
    return Object.keys(this.DYNAMIC_MODES);
  }
}

module.exports = new NarrativeRhythmEngine();
