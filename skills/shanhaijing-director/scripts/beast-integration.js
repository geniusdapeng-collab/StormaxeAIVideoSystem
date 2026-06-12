/**
 * 异兽档案系统 - 导演管线集成 v1.1-Peng
 * 
 * v1.1-Peng 更新：
 * + 🆕 Nirath栖息地标准化系统集成
 * + 🆕 自动栖息地映射（40只神兽 → 十大生态区）
 * + 🆕 完整性校验：无栖息地映射自动告警
 * + 🆕 新增神兽自动适配：从知识库匹配生态区
 */

const {
  detectBeasts,
  loadBeastArchive,
  PromptInjector,
  ConsistencyGuard,
  WorldviewCalibrator,
  CinemaRecommender,
  SceneGenerator
} = require('../../shanhaijing-beast-archive/beast-engine.js');

// 🆕 v1.1-Peng: 引入栖息地标准化系统
const { hasValidHabitat, getUnmappedBeasts, registerBeastHabitat } = require('../../shanhaijing-beast-archive/beast-habitat-standardizer.js');

class BeastArchiveIntegration {
  constructor() {
    this.injector = new PromptInjector();
    this.guard = new ConsistencyGuard();
    this.calibrator = new WorldviewCalibrator();
    this.recommender = new CinemaRecommender();
    this.sceneGen = new SceneGenerator();
    this.enabled = true;
    
    // 🆕 v1.1-Peng: 启动时检查未映射神兽
    this._checkUnmappedBeasts();
  }
  
  /**
   * 🆕 v1.1-Peng: 检查未映射的神兽
   */
  _checkUnmappedBeasts() {
    const unmapped = getUnmappedBeasts();
    if (unmapped.length > 0) {
      console.warn(`⚠️ [BeastArchiveIntegration] 发现 ${unmapped.length} 只神兽未映射到Nirath生态区:`);
      console.warn(`   ${unmapped.join(', ')}`);
      console.warn(`   这些神兽将使用通用Nirath描述，建议尽快补充映射`);
    }
  }
  
  /**
   * 🆕 v1.1-Peng: 注册新神兽栖息地（用于动态扩展）
   */
  registerNewBeastHabitat(beastId, zoneId) {
    try {
      registerBeastHabitat(beastId, zoneId);
      console.log(`✅ [BeastArchiveIntegration] 已注册 ${beastId} → ${zoneId}`);
    } catch (err) {
      console.error(`❌ 注册失败: ${err.message}`);
    }
  }
  
  /**
   * 处理故事计划中的神兽
   * @param {Object} storyPlan - 故事计划
   * @returns {Object} - 处理结果
   */
  processStoryPlan(storyPlan) {
    if (!this.enabled) return { modified: false };
    
    const results = {
      modified: false,
      beasts: [],
      injections: [],
      validations: [],
      recommendations: []
    };
    
    // 1. 检测所有神兽
    const text = JSON.stringify(storyPlan);
    const beasts = detectBeasts(text);
    results.beasts = beasts;
    
    if (beasts.length === 0) return results;
    
    results.modified = true;
    
    // 2. 处理每个镜头
    for (const shot of storyPlan.shots || []) {
      // 注入Prompt
      if (shot.description) {
        const injected = this.injector.inject(shot.description, 'compact');
        if (injected !== shot.description) {
          results.injections.push({
            shotId: shot.id,
            original: shot.description,
            injected
          });
          shot.description = injected;
        }
      }
      
      // 校验一致性
      for (const beast of beasts) {
        const validation = this.guard.validate(shot, beast.id);
        if (!validation.passed) {
          results.validations.push({
            shotId: shot.id,
            beastId: beast.id,
            ...validation
          });
        }
      }
      
      // 推荐运镜
      for (const beast of beasts) {
        const cinema = this.recommender.recommend(beast.id, shot.emotion);
        if (cinema) {
          results.recommendations.push({
            shotId: shot.id,
            beastId: beast.id,
            ...cinema
          });
          
          // 将推荐运镜注入shot
          if (!shot.cinema) shot.cinema = {};
          shot.cinema.beastRecommendations = cinema.recommended;
        }
      }
    }
    
    return results;
  }
  
  /**
   * 生成神兽场景
   * @param {string} beastId - 神兽ID
   * @param {string} sceneType - 场景类型
   * @returns {string} - 场景描述
   */
  generateScene(beastId, sceneType = 'encounter') {
    return this.sceneGen.generate(beastId, sceneType);
  }
  
  /**
   * 获取神兽完整档案
   * @param {string} beastId - 神兽ID
   * @returns {Object|null} - 档案对象
   */
  getArchive(beastId) {
    return loadBeastArchive(beastId);
  }
}

module.exports = { BeastArchiveIntegration };