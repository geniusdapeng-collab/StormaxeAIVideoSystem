#!/usr/bin/env node
/**
 * Nirath原创世界观生产管线 — Shanhaijing Pipeline
 *
 * 四阶段状态机（idle→preproduction→production→postproduction→delivery）
 * 整季10集标准化生产 + SOP标准化流程 + 质量门控
 *
 * 融合策略：管线升级，shanhai-pipeline为顶层编排
 */

const { QualityOracle } = require('../shanhaijing-quality-oracle/quality-oracle');

// ============ 四阶段状态机 ============
const PIPELINE_STATES = {
  idle: {
    name: '待机',
    allowedTransitions: ['preproduction'],
    description: '等待制片指令'
  },
  preproduction: {
    name: '前期制作',
    allowedTransitions: ['production', 'error'],
    description: '剧本确认、角色定妆、分镜设计',
    checkpoints: ['剧本锁定', '角色定妆完成', '分镜审核通过']
  },
  production: {
    name: '生产制作',
    allowedTransitions: ['postproduction', 'error'],
    description: '镜头渲染、动作生成、音频录制',
    checkpoints: ['渲染完成率100%', '动作审核通过', '音频同步']
  },
  postproduction: {
    name: '后期制作',
    allowedTransitions: ['delivery', 'error'],
    description: '合成剪辑、调色、特效',
    checkpoints: ['剪辑锁定', '调色完成', '特效合成']
  },
  delivery: {
    name: '交付',
    allowedTransitions: ['idle'],
    description: '质量门控、输出、分发',
    checkpoints: ['质量评级≥A', '格式输出完成', '元数据完整']
  },
  error: {
    name: '错误',
    allowedTransitions: ['idle', 'preproduction'],
    description: '生产中断，需人工介入或自动重试'
  }
};

// ============ 整季10集配置模板 ============
const SEASON_CONFIG = {
  seasonId: 'shanhai-s1',
  name: 'Nirath原创世界观：异兽志 第一季',
  totalEpisodes: 10,
  episodes: [
    { id: 1, title: '守光巨兽睁眼', beastId: 'zhulong', location: '章尾山', template: 'origin_myth', duration: 720 },
    { id: 2, title: '九尾的赌局', beastId: 'jiuweihu', location: '青丘', template: 'encounter_fable', duration: 720 },
    { id: 3, title: '晶齿萌兽盛宴', beastId: 'taotie', location: '虹脉深渊', template: 'encounter_fable', duration: 720 },
    { id: 4, title: '光翼游天兽之翼', beastId: 'yinglong', location: '浮空晶簇山山', template: 'divine_conflict', duration: 720 },
    { id: 5, title: '虹羽焰灵涅槃', beastId: 'fenghuang', location: '蓬莱', template: 'transformation_journey', duration: 720 },
    { id: 6, title: '麒麟降世', beastId: 'qilin', location: '大荒东经', template: 'chorus_harmony', duration: 720 },
    { id: 7, title: '猬毛凶兽之怒', beastId: 'qiongqi', location: '大荒西经', template: 'divine_conflict', duration: 720 },
    { id: 8, title: '雪白智兽解惑', beastId: 'baize', location: '浮空晶簇山山', template: 'encounter_fable', duration: 720 },
    { id: 9, title: '鲲化鹏', beastId: 'kun_peng', location: '北海', template: 'transformation_journey', duration: 720 },
    { id: 10, title: '山海一岁', beastId: 'zhulong', location: '章尾山', template: 'chorus_harmony', duration: 720 }
  ]
};

// ============ 生产管线核心类 ============
class ShanhaiPipeline {
  constructor(seasonConfig = SEASON_CONFIG) {
    this.season = seasonConfig;
    this.state = 'idle';
    this.currentEpisode = null;
    this.episodeStates = {};
    this.qualityOracle = new QualityOracle();
    this.history = [];
  }

  /**
   * 启动整季生产
   */
  startSeasonProduction() {
    this.state = 'preproduction';
    this.log('Season production started', { seasonId: this.season.seasonId });

    // 初始化每集状态
    this.season.episodes.forEach(ep => {
      this.episodeStates[ep.id] = {
        episode: ep,
        state: 'idle',
        progress: 0,
        checkpoints: [],
        quality: null,
        startTime: null,
        endTime: null
      };
    });

    return {
      seasonId: this.season.seasonId,
      totalEpisodes: this.season.totalEpisodes,
      state: this.state,
      episodes: this.season.episodes
    };
  }

  /**
   * 开始单集制作
   */
  startEpisode(episodeId) {
    const epState = this.episodeStates[episodeId];
    if (!epState) {
      throw new Error(`[Pipeline] 未知剧集: ${episodeId}`);
    }

    // 检查是否已在制作中
    if (epState.state !== 'idle' && epState.state !== 'error') {
      console.warn(`[Pipeline] 警告: 剧集 ${episodeId} 已在 ${epState.state} 状态，重复启动`);
    }

    epState.state = 'preproduction';
    epState.startTime = Date.now();
    epState.checkpoints = [];
    this.currentEpisode = episodeId;

    this.log('Episode started', { episodeId, title: epState.episode.title });

    return {
      episodeId,
      state: epState.state,
      title: epState.episode.title,
      checkpoints: PIPELINE_STATES.preproduction.checkpoints
    };
  }

  /**
   * 完成当前阶段，推进到下一阶段
   */
  advanceStage(episodeId, checkpointResults = {}) {
    const epState = this.episodeStates[episodeId];
    const currentStateDef = PIPELINE_STATES[epState.state];
    const requiredChecks = currentStateDef.checkpoints || [];

    // 严格验证：传入的检查点必须与当前阶段匹配
    const validCheckpointNames = Object.keys(checkpointResults).filter(name => requiredChecks.includes(name));
    if (validCheckpointNames.length === 0 && Object.keys(checkpointResults).length > 0) {
      throw new Error(
        `[Pipeline] 非法状态转换: 传入的检查点 [${Object.keys(checkpointResults).join(', ')}] ` +
        `不属于当前阶段 "${currentStateDef.name}" 的必需检查点 [${requiredChecks.join(', ')}]`
      );
    }

    // 验证检查点 — 只计算requiredChecks中存在的检查点
    const passedChecks = Object.entries(checkpointResults)
      .filter(([name, passed]) => passed && requiredChecks.includes(name))
      .map(([name]) => name);

    // 记录检查点
    epState.checkpoints.push(...passedChecks);

    // 确定下一状态
    let nextState;
    if (passedChecks.length >= requiredChecks.length * 0.8) {
      // 80%检查点通过即可推进
      const currentIndex = currentStateDef.allowedTransitions.indexOf(
        currentStateDef.allowedTransitions.find(s => s !== 'error')
      );
      nextState = currentStateDef.allowedTransitions.find(s => s !== 'error');
    } else {
      nextState = 'error';
    }
    epState.state = nextState;
    epState.progress = this.calculateProgress(nextState);

    this.log('Stage advanced', {
      episodeId,
      from: currentStateDef.name,
      to: nextState,
      passedChecks: passedChecks.length,
      totalChecks: requiredChecks.length
    });

    return {
      episodeId,
      state: nextState,
      stateName: PIPELINE_STATES[nextState]?.name || nextState,
      progress: epState.progress,
      checkpoints: epState.checkpoints
    };
  }

  /**
   * 【火山引擎Seedance集成】渲染单集镜头
   * 在production阶段调用，提交所有镜头到Seedance API
   * @param {string} episodeId - 集ID
   * @param {Array} shots - 镜头列表
   * @param {Object} options - 渲染选项
   * @returns {Promise<Object>} 渲染提交结果
   */
  async renderEpisode(episodeId, shots, options = {}) {
    const epState = this.episodeStates[episodeId];
    if (!epState) {
      throw new Error(`[Pipeline] 集不存在: ${episodeId}`);
    }

    // 延迟加载渲染引擎（避免循环依赖）
    const { ShanhaiRenderEngine } = require('../shanhaijing-render-engine/render-engine');
    const renderEngine = new ShanhaiRenderEngine({
      apiKey: options.apiKey || process.env.VOLCENGINE_ARK_API_KEY,
      debug: options.debug || false
    });

    console.log(`🎬 [Pipeline] 开始渲染集 ${episodeId}: ${shots.length} 个镜头`);
    epState.renderEngine = renderEngine;

    try {
      // 批量提交渲染任务
      const renderResults = await renderEngine.renderShots(shots, {
        fast: options.fast || false,
        delayBetweenShots: options.delayBetweenShots || 2000
      });

      // 记录渲染任务
      epState.renderTasks = renderResults;
      epState.renderSubmittedAt = new Date().toISOString();

      console.log(`✅ [Pipeline] 集 ${episodeId} 渲染任务已提交: ${renderResults.length} 个`);

      return {
        episodeId,
        submitted: renderResults.length,
        tasks: renderResults
      };

    } catch (err) {
      console.error(`❌ [Pipeline] 集 ${episodeId} 渲染提交失败:`, err.message);
      epState.state = 'error';
      throw err;
    }
  }

  /**
   * 【火山引擎Seedance集成】等待渲染完成并收集结果
   * @param {string} episodeId - 集ID
   * @param {Object} options - 轮询选项
   * @returns {Promise<Object>} 渲染完成结果
   */
  async collectRenders(episodeId, options = {}) {
    const epState = this.episodeStates[episodeId];
    if (!epState || !epState.renderEngine) {
      throw new Error(`[Pipeline] 集 ${episodeId} 未提交渲染任务`);
    }

    console.log(`⏳ [Pipeline] 等待集 ${episodeId} 渲染完成...`);

    const completed = await epState.renderEngine.waitForRenders(
      epState.renderTasks,
      options
    );

    const successCount = completed.filter(c => c.success).length;
    const failCount = completed.length - successCount;
    if (successCount === completed.length) {
      epState.checkpoints.push('渲染完成率100%');
    }

    console.log(`✅ [Pipeline] 集 ${episodeId} 渲染完成: ${successCount}/${completed.length}`);

    return {
      episodeId,
      completed: successCount,
      failed: failCount,
      total: completed.length,
      videos: completed.filter(c => c.success).map(c => ({
        shotId: c.shotId,
        videoUrl: c.videoUrl
      }))
    };
  }

  /**
   * 【火山引擎Seedream集成】生成角色定妆照
   * @param {string} episodeId - 集ID
   * @param {Array} characters - 角色列表
   * @param {Object} options - 生成选项
   * @returns {Promise<Array>} 定妆照结果
   */
  async generatePortraits(episodeId, characters, options = {}) {
    const epState = this.episodeStates[episodeId];
    if (!epState) {
      throw new Error(`[Pipeline] 集不存在: ${episodeId}`);
    }

    const { ShanhaiRenderEngine } = require('../shanhaijing-render-engine/render-engine');
    const renderEngine = new ShanhaiRenderEngine({
      apiKey: options.apiKey || process.env.VOLCENGINE_ARK_API_KEY
    });

    console.log(`📸 [Pipeline] 生成集 ${episodeId} 角色定妆照: ${characters.length} 个角色`);

    const portraits = [];
    for (const character of characters) {
      try {
        const portrait = await renderEngine.generatePortrait(character);
        portraits.push(portrait);
      } catch (err) {
        console.error(`❌ [Pipeline] 定妆照生成失败 ${character.name}:`, err.message);
      }
    }

    epState.portraits = portraits;
    
    // 检查点: 角色定妆完成
    if (portraits.length > 0) {
      epState.checkpoints.push('角色定妆完成');
    }

    console.log(`✅ [Pipeline] 定妆照完成: ${portraits.length}/${characters.length}`);

    return portraits;
  }

  /**
   * 质量门控检查
    const epState = this.episodeStates[episodeId];

    // 单集质量评测
    const quality = this.qualityOracle.evaluateEpisode({
      id: episodeId,
      ...episodeData
    });

    epState.quality = quality;

    // 根据评级决定
    const passed = quality.grade >= 'A';

    this.log('Quality gate', {
      episodeId,
      grade: quality.grade,
      score: quality.totalScore,
      passed
    });

    return {
      episodeId,
      quality,
      passed,
      canDeliver: quality.grade >= 'A',
      needsRevision: quality.grade < 'A'
    };
  }

  /**
   * 完成单集
   */
  finishEpisode(episodeId) {
    const epState = this.episodeStates[episodeId];
    epState.state = 'delivery';
    epState.endTime = Date.now();
    epState.progress = 100;

    const duration = epState.endTime - epState.startTime;

    this.log('Episode finished', {
      episodeId,
      duration: Math.floor(duration / 1000 / 60) + ' minutes',
      quality: epState.quality?.grade || 'N/A'
    });

    return {
      episodeId,
      state: 'delivery',
      progress: 100,
      duration,
      quality: epState.quality
    };
  }

  /**
   * 获取整季进度
   */
  getSeasonProgress() {
    const episodes = Object.values(this.episodeStates);
    const completed = episodes.filter(e => e.state === 'delivery').length;
    const inProgress = episodes.filter(e => ['preproduction', 'production', 'postproduction'].includes(e.state)).length;
    const pending = episodes.filter(e => e.state === 'idle').length;
    const errors = episodes.filter(e => e.state === 'error').length;

    // 计算平均质量
    const qualities = episodes
      .filter(e => e.quality)
      .map(e => e.quality.totalScore);
    const avgQuality = qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0;

    return {
      seasonId: this.season.seasonId,
      totalEpisodes: this.season.totalEpisodes,
      completed,
      inProgress,
      pending,
      errors,
      avgQuality: Math.round(avgQuality * 100) / 100,
      episodes: episodes.map(e => ({
        id: e.episode.id,
        title: e.episode.title,
        state: e.state,
        progress: e.progress,
        quality: e.quality?.grade || null
      }))
    };
  }

  calculateProgress(state) {
    const progressMap = {
      idle: 0,
      preproduction: 25,
      production: 50,
      postproduction: 75,
      delivery: 100,
      error: 0
    };
    return progressMap[state] || 0;
  }

  log(event, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };
    this.history.push(entry);
    console.log(`[Pipeline] ${event}`, JSON.stringify(data));
  }

  /**
   * 【世界模拟引擎融入】创建新项目（系列管理）
   * @param {string} projectName - 项目名称
   * @param {Object} options - 选项
   * @returns {Object} 项目注册信息
   */
  createProject(projectName, options = {}) {
    const projectId = `PRJ_${Date.now()}`;
    const project = {
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      episodes: [],
      foreshadowingEngine: null,
      ...options
    };
    this.projects = this.projects || new Map();
    this.projects.set(projectId, project);
    console.log(`🎬 新项目创建: ${projectName} (${projectId})`);
    return project;
  }

  /**
   * 【世界模拟引擎融入】注册集到项目
   * @param {string} projectId - 项目ID
   * @param {Object} episodeConfig - 集配置
   * @returns {Object} 更新后的项目
   */
  registerEpisode(projectId, episodeConfig) {
    const project = this.projects?.get(projectId);
    if (!project) {
      console.error(`❌ 项目不存在: ${projectId}`);
      return null;
    }

    const episode = {
      id: episodeConfig.id || `EP_${String(project.episodes.length + 1).padStart(2, '0')}`,
      beastId: episodeConfig.beastId,
      title: episodeConfig.title || '',
      theme: episodeConfig.theme || '',
      status: 'registered',
      registeredAt: new Date().toISOString(),
      ...episodeConfig
    };

    project.episodes.push(episode);
    console.log(`📺 集已注册: ${episode.id} (${episode.beastId}) → ${project.name}`);
    return project;
  }

  /**
   * 【世界模拟引擎融入】获取项目状态
   * @param {string} projectId - 项目ID
   * @returns {Object} 项目状态
   */
  getProjectStatus(projectId) {
    const project = this.projects?.get(projectId);
    if (!project) return null;

    return {
      ...project,
      episodeCount: project.episodes.length,
      episodeList: project.episodes.map(ep => ({
        id: ep.id,
        beastId: ep.beastId,
        title: ep.title,
        status: ep.status
      }))
    };
  }

  /**
   * 【世界模拟引擎融入】获取所有项目列表
   * @returns {Array} 项目列表
   */
  listProjects() {
    if (!this.projects) return [];
    return Array.from(this.projects.values()).map(p => ({
      id: p.id,
      name: p.name,
      episodeCount: p.episodes.length,
      createdAt: p.createdAt
    }));
  }

  /**
   * 【世界模拟引擎融入】跨集伏笔链接
   * 在当前集生产过程中，检查并链接到之前集的伏笔
   * @param {string} projectId - 项目ID
   * @param {string} currentEpisodeId - 当前集ID
   * @param {Object} foreshadowingEngine - 伏笔引擎实例
   * @returns {Array} 需要链接的伏笔列表
   */
  linkForeshadowings(projectId, currentEpisodeId, foreshadowingEngine) {
    if (!foreshadowingEngine) return [];

    const project = this.projects?.get(projectId);
    if (!project) return [];

    const currentNum = parseInt(currentEpisodeId.replace('EP', '').replace('E', ''));
    const unresolved = foreshadowingEngine.getUnresolved();

    // 找出适合当前集回收的伏笔（设置后2-4集回收效果最佳）
    const linkable = unresolved.filter(fs => {
      const plantedNum = parseInt(fs.episodeId.replace('EP', '').replace('E', ''));
      const age = currentNum - plantedNum;
      // 最佳回收窗口: 2-4集后
      return age >= 2 && age <= 4;
    });

    console.log(`🔗 跨集伏笔链接: ${currentEpisodeId} 发现 ${linkable.length} 个可回收伏笔`);
    return linkable;
  }

  /**
   * 【世界模拟引擎融入】信息释放控制
   * 检查当前幕的信息释放比例，确保符合三幕策略
   * @param {string} act - 幕标识: act1 | act2 | act3
   * @param {number} newInfoCount - 当前幕新信息数
   * @param {number} totalInfoCount - 总计划信息数
   * @returns {Object} 释放控制结果
   */
  controlInfoRelease(act, newInfoCount, totalInfoCount) {
    const STRATEGY = {
      act1: { maxRatio: 0.125, name: '起幕', focus: '人物关系' },
      act2: { maxRatio: 0.25, name: '承幕', focus: '世界建构' },
      act3: { maxRatio: 0.625, name: '转/高潮/合幕', focus: '神话揭示' }
    };

    const strategy = STRATEGY[act];
    if (!strategy) {
      return { allowed: false, error: `未知幕: ${act}` };
    }

    const targetMax = Math.round(totalInfoCount * strategy.maxRatio);
    const currentRatio = totalInfoCount > 0 ? newInfoCount / totalInfoCount : 0;
    const allowed = newInfoCount < targetMax;

    return {
      act,
      actName: strategy.name,
      focus: strategy.focus,
      maxRatio: strategy.maxRatio,
      targetMax,
      newInfoCount,
      currentRatio: Math.round(currentRatio * 1000) / 10,
      allowed,
      warning: allowed ? null : `${strategy.name}新信息已达上限(${targetMax}条, ${strategy.maxRatio * 100}%)，建议复用旧信息`
    };
  }

  /**
   * 【世界模拟引擎融入】系列状态快照
   * 导出整个系列（项目）的完整状态
   * @param {string} projectId - 项目ID
   * @returns {Object} 系列快照
   */
  exportSeriesSnapshot(projectId) {
    const project = this.projects?.get(projectId);
    if (!project) return null;

    return {
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        episodeCount: project.episodes.length
      },
      episodes: project.episodes.map(ep => ({
        id: ep.id,
        beastId: ep.beastId,
        title: ep.title,
        theme: ep.theme,
        status: ep.status,
        pipelineState: this.state,
        checkpoint: this.checkpoint
      })),
      exportedAt: new Date().toISOString()
    };
  }
}

// ============ 导出 ============
module.exports = {
  ShanhaiPipeline,
  PIPELINE_STATES,
  SEASON_CONFIG
};

// CLI 测试
if (require.main === module) {
  const pipeline = new ShanhaiPipeline();

  console.log('\n🏭 Nirath原创世界观生产管线测试\n');

  // 启动整季
  const season = pipeline.startSeasonProduction();
  console.log(`季节: ${season.name}, 总集数: ${season.totalEpisodes}`);

  // 开始第一集
  const ep1 = pipeline.startEpisode(1);
  console.log(`\n开始制作: ${ep1.title}`);
  console.log(`阶段: ${ep1.state}, 检查点: ${ep1.checkpoints.join(', ')}`);

  // 推进各阶段
  pipeline.advanceStage(1, { '剧本锁定': true, '角色定妆完成': true, '分镜审核通过': true });
  console.log('推进到生产阶段');

  pipeline.advanceStage(1, { '渲染完成率100%': true, '动作审核通过': true, '音频同步': true });
  console.log('推进到后期阶段');

  pipeline.advanceStage(1, { '剪辑锁定': true, '调色完成': true, '特效合成': true });
  console.log('推进到交付阶段');

  // 完成
  const finished = pipeline.finishEpisode(1);
  console.log(`\n第一集完成！进度: ${finished.progress}%`);

  // 查看整季进度
  const progress = pipeline.getSeasonProgress();
  console.log(`\n整季进度: ${progress.completed}/${progress.totalEpisodes} 集完成`);
}