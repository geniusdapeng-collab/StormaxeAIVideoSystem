/**
 * 山海经异兽档案系统 - 核心模块 v1.2-Peng
 * 
 * v1.2-Peng 更新：
 * + 🆕 Scale-Aware 注入 — 自动读取异兽尺度信息并注入Prompt
 * + 中文尺度词解析（丈/尺/米/千里）
 * + 6级尺度分类体系（微型→神话级）
 * 
 * 五大引擎：
 * 1. Prompt注入器 (PromptInjector) - 自动将神兽名字替换为精确Prompt
 * 2. 一致性守卫 (ConsistencyGuard) - 5维自动校验拦截
 * 3. 世界观校准器 (WorldviewCalibrator) - 确保神兽出现在正确栖息地
 * 4. 运镜推荐器 (CinemaRecommender) - 基于体型/类型智能推荐运镜
 * 5. 场景生成器 (SceneGenerator) - 生成匹配的场景描述
 */

const fs = require('fs');
const path = require('path');
const { BEAST_INDEX } = require('./beast-index.js');
// 🆕 v1.1-Peng: 引入Nirath栖息地标准化系统
const { generateNirathHabitatPrompt, hasValidHabitat } = require('./beast-habitat-standardizer.js');

// 档案目录
const ARCHIVE_DIR = path.join(__dirname, 'beasts');

/**
 * 加载神兽档案
 * @param {string} beastId - 神兽ID
 * @returns {Object|null} - 神兽档案对象
 */
function loadBeastArchive(beastId) {
  try {
    const filePath = path.join(ARCHIVE_DIR, `${beastId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`加载神兽档案失败: ${beastId}`, err.message);
    return null;
  }
}

/**
 * 检测文本中提到的神兽
 * @param {string} text - 要分析的文本
 * @returns {Array} - 检测到的神兽对象列表
 */
function detectBeasts(text) {
  if (!text) return [];
  
  const detected = [];
  for (const beast of BEAST_INDEX) {
    const keywords = beast.keywords || [beast.name];
    const found = keywords.some(kw => text.includes(kw));
    if (found) {
      detected.push(beast);
    }
  }
  return detected;
}

/**
 * Prompt注入器 - 将神兽名字替换为精确Prompt描述
 */
class PromptInjector {
  /**
   * 注入Prompt
   * @param {string} text - 原始文本
   * @param {string} mode - 模式: compact(40-60字) | detailed(100-120字)
   * @returns {string} - 注入后的文本
   */
  inject(text, mode = 'compact') {
    const beasts = detectBeasts(text);
    if (beasts.length === 0) return text;
    
    let result = text;
    
    for (const beast of beasts) {
      const archive = loadBeastArchive(beast.id);
      if (!archive) continue;
      
      const prompt = this._buildPrompt(archive, mode);
      // 替换神兽名称为Prompt描述
      const regex = new RegExp(beast.name, 'g');
      result = result.replace(regex, prompt);
    }
    
    return result;
  }
  
  /**
   * 多神兽同框处理
   * @param {Array} beastIds - 神兽ID列表
   * @param {string} sceneType - 场景类型: confrontation(对峙) | coexistence(共存) | battle(战斗)
   * @returns {string} - 同框Prompt
   */
  multiBeastPrompt(beastIds, sceneType = 'confrontation') {
    const archives = beastIds.map(id => loadBeastArchive(id)).filter(Boolean);
    if (archives.length < 2) return '';
    
    const prompts = archives.map(a => this._buildPrompt(a, 'compact'));
    
    const sceneConfigs = {
      confrontation: {
        layout: '双主体对称构图，各占画面1/2',
        interaction: '能量碰撞形成彩虹电弧',
        tension: '紧张对峙，气势交锋'
      },
      coexistence: {
        layout: '主次分明，主兽占画面2/3',
        interaction: '和谐共存，气场交融',
        tension: '祥和宁静，互不争斗'
      },
      battle: {
        layout: '动态交错，肢体碰撞',
        interaction: '爪牙相向，能量爆裂',
        tension: '激烈战斗，生死相搏'
      }
    };
    
    const config = sceneConfigs[sceneType] || sceneConfigs.confrontation;
    
    return `${prompts.join(' [vs] ')}\n构图: ${config.layout}\n交互: ${config.interaction}\n氛围: ${config.tension}`;
  }
  
  _buildPrompt(archive, mode, shotType = 'medium') {
    const app = archive.appearance;
    
    // 🆕 v1.2-Peng: Scale-Aware 注入 — 读取异兽尺度信息
    const scaleText = archive.bodyParts?.scale || archive.cinema?.scale || '大型';
    const { parseBeastScale, generateScalePrompt, getVisualRatioDescription } = require('./scale-aware-shot-designer.js');
    const meters = parseBeastScale(scaleText);
    const scalePrompt = generateScalePrompt(meters, shotType);
    const ratioDesc = getVisualRatioDescription(meters);
    
    // 🆕 v1.1-Peng: 多路召回 — 优先标准化系统，其次档案字段，最后知识库推断
    let nirathHabitat = '';
    
    // 路1: 标准化系统映射（最高优先级，基于神兽ID）
    const standardizedHabitat = generateNirathHabitatPrompt(archive.id);
    if (standardizedHabitat && !standardizedHabitat.includes('bioluminescent ecosystem with dual-sunset lighting')) {
      nirathHabitat = standardizedHabitat;
    }
    
    // 路2: 档案中的autoHabitat字段（辅助参考，存在则用）
    if (!nirathHabitat && archive.autoHabitat) {
      nirathHabitat = archive.autoHabitat;
    }
    
    // 路3: 档案中的nirath.habitat（向后兼容）
    if (!nirathHabitat && archive.nirath?.habitat?.location) {
      nirathHabitat = this._inferHabitatFromDescription(archive.nirath.habitat.location);
    }
    
    // 路4: 通用回退（所有神兽保底）
    if (!nirathHabitat) {
      nirathHabitat = "Nirath原生星球，双日暮光，生物荧光生态系统";
    }
    
    if (mode === 'compact') {
      // 40-60字精简模式
      const base = summary || (body && head && eyes ? `${body}，${head}，${eyes}` : '');
      if (!base) {
        console.warn(`⚠️ 神兽 ${archive.id} 缺少appearance.summary/body/head/eyes，使用fullDescription前50字`);
        const fallback = app.fullDescription ? app.fullDescription.substring(0, 50) : archive.name;
        return `${fallback}，${nirathHabitat}。【尺度】${archive.name}(${meters}米，${ratioDesc})。${scalePrompt}`;
      }
      return `${base}，${nirathHabitat}。【尺度】${archive.name}(${meters}米，${ratioDesc})。${scalePrompt}`;
    } else {
      let base = '';
      if (body && head && eyes) {
        base = `${body}，${head}，${eyes}${skin ? `，${skin}` : ''}${special ? `，${special}` : ''}`;
      } else if (app.summary) {
        base = app.summary;
      } else if (app.fullDescription) {
        base = app.fullDescription.substring(0, 100);
      } else {
        base = archive.name || '神兽';
      }
      
      return `${base}，${nirathHabitat}。【尺度】${archive.name}(${meters}米，${ratioDesc})。${scalePrompt}`;
    }
  }
  
  /**
   * 🆕 v1.1-Peng: 从描述文字推断栖息地（知识库匹配）
   */
  _inferHabitatFromDescription(description) {
    if (!description) return '';
    const desc = description.toLowerCase();
    
    const habitatPatterns = {
      'azure-hills-spirit-plain': ['青丘','草原','丘陵','灵原','草甸','grassland','plain'],
      'abyssal-luminara': ['海','洋','水','深渊','ocean','sea','abyss'],
      'broken-axis-peaks': ['山','火山','岩浆','山脉','mountain','volcano'],
      'subterranean-styx': ['地下','幽冥','洞穴','黄泉','underground','cave'],
      'solar-cradle-fusang': ['日','太阳','光','恒星','sun','solar','light'],
      'kunlun-sky-continent': ['天','悬浮','空','瀑布','sky','float','levitate'],
      'plain-zhulu': ['平原','战场','荒原','龟裂','plain','battle','wasteland'],
      'archipelago-penglai': ['岛','群岛','迷雾','island','archipelago','mist'],
      'astrop-gate-nexus': ['祭坛','星门','晶体','altar','gate','nexus','crystal'],
      'spine-pangu': ['脊','裂谷','山脉','rift','spine','ridge']
    };
    
    for (const [zone, keywords] of Object.entries(habitatPatterns)) {
      if (keywords.some(kw => desc.includes(kw))) {
        return generateNirathHabitatPrompt(zone);
      }
    }
    return '';
  }
}

/**
 * 一致性守卫 - 5维自动校验拦截
 */
class ConsistencyGuard {
  /**
   * 校验神兽一致性
   * @param {Object} shot - 镜头对象
   * @param {string} beastId - 神兽ID
   * @returns {Object} - 校验结果
   */
  validate(shot, beastId) {
    const archive = loadBeastArchive(beastId);
    if (!archive) return { passed: false, reason: '档案缺失' };
    
    const checks = {
      // 1. 颜色一致性
      color: this._checkColor(shot, archive),
      // 2. 体型一致性
      scale: this._checkScale(shot, archive),
      // 3. 特征部位一致性
      features: this._checkFeatures(shot, archive),
      // 4. 栖息地一致性
      habitat: this._checkHabitat(shot, archive),
      // 5. 能力表现一致性
      abilities: this._checkAbilities(shot, archive)
    };
    
    const passed = Object.values(checks).every(c => c.passed);
    const failed = Object.entries(checks)
      .filter(([_, c]) => !c.passed)
      .map(([k, c]) => ({ check: k, reason: c.reason }));
    
    return {
      passed,
      failed,
      details: checks,
      beastName: archive.name
    };
  }
  
  _checkColor(shot, archive) {
    const prompt = shot.prompt || '';
    const expectedColors = this._extractColors(archive.appearance);
    const hasCorrectColor = expectedColors.some(c => prompt.includes(c));
    
    return {
      passed: hasCorrectColor,
      reason: hasCorrectColor ? '' : `颜色不匹配，应为: ${expectedColors.join('/')}`
    };
  }
  
  _checkScale(shot, archive) {
    const prompt = shot.prompt || '';
    const scale = archive.cinema?.scale || '大型';
    const scaleKeywords = this._getScaleKeywords(scale);
    const hasScale = scaleKeywords.some(k => prompt.includes(k));
    
    return {
      passed: hasScale,
      reason: hasScale ? '' : `体型暗示不足，应为: ${scale}`
    };
  }
  
  _checkFeatures(shot, archive) {
    const prompt = shot.prompt || '';
    const keyFeatures = this._extractKeyFeatures(archive.appearance);
    const missingFeatures = keyFeatures.filter(f => !prompt.includes(f));
    
    // 至少要有50%的关键特征
    const passed = missingFeatures.length <= keyFeatures.length / 2;
    
    return {
      passed,
      reason: passed ? '' : `缺失关键特征: ${missingFeatures.join(', ')}`
    };
  }
  
  _checkHabitat(shot, archive) {
    const prompt = shot.prompt || '';
    const habitat = archive.habitat;
    if (!habitat) return { passed: true, reason: '' };
    
    const habitatKeywords = [habitat.location, habitat.climate].filter(Boolean);
    const inCorrectHabitat = habitatKeywords.some(k => prompt.includes(k));
    
    return {
      passed: inCorrectHabitat,
      reason: inCorrectHabitat ? '' : `栖息地不匹配，应在: ${habitat.location}`
    };
  }
  
  _checkAbilities(shot, archive) {
    const prompt = shot.prompt || '';
    const abilities = archive.abilities || [];
    // 至少有一项能力被暗示
    const hasAbilityHint = abilities.some(a => {
      const keyAbility = a.split('：')[0];
      return prompt.includes(keyAbility) || prompt.includes(a);
    });
    
    return {
      passed: hasAbilityHint,
      reason: hasAbilityHint ? '' : '未体现神兽能力特征'
    };
  }
  
  _extractColors(appearance) {
    const colors = [];
    const text = JSON.stringify(appearance);
    const colorMap = {
      '赤': ['赤', '红', '朱'],
      '青': ['青', '蓝', '翠'],
      '白': ['白', '银', '雪'],
      '黑': ['黑', '墨', '玄'],
      '黄': ['黄', '金', '橙'],
      '紫': ['紫', '绛']
    };
    
    for (const [main, variants] of Object.entries(colorMap)) {
      if (variants.some(v => text.includes(v))) {
        colors.push(main);
      }
    }
    return colors;
  }
  
  _getScaleKeywords(scale) {
    const scaleMap = {
      '超巨型（千里级）': ['千里', '绵延', '巨大', '山脉'],
      '巨型（百米级）': ['百米', '庞大', '巨兽', '如山'],
      '大型（十米级）': ['十米', '巨大', '庞大'],
      '中型（米级）': ['大', '巨'],
      '小型': ['小', '幼']
    };
    return scaleMap[scale] || ['大'];
  }
  
  _extractKeyFeatures(appearance) {
    const features = [];
    if (appearance.head) features.push(appearance.head.split('，')[0]);
    if (appearance.eyes) features.push(appearance.eyes.split('，')[0]);
    if (appearance.special) features.push(appearance.special.split('，')[0]);
    return features.filter(Boolean);
  }
}

/**
 * 世界观校准器 - 确保神兽出现在正确的栖息地
 */
class WorldviewCalibrator {
  /**
   * 校准场景描述
   * @param {string} sceneDesc - 场景描述
   * @param {string} beastId - 神兽ID
   * @returns {Object} - 校准结果
   */
  calibrate(sceneDesc, beastId) {
    const archive = loadBeastArchive(beastId);
    if (!archive) return { passed: false, reason: '档案缺失' };
    
    // 优先读取 nirath.habitat，其次读取 habitat
    const habitat = archive.nirath?.habitat || archive.habitat;
    if (!habitat) return { passed: true, calibrated: sceneDesc };
    
    // 检查场景是否包含正确的栖息地关键词
    const locationMatch = sceneDesc.includes(habitat.location) || 
                         sceneDesc.includes(habitat.climate);
    
    if (locationMatch) {
      return { passed: true, calibrated: sceneDesc };
    }
    
    // 自动修正场景描述
    const calibrated = this._injectHabitat(sceneDesc, habitat);
    
    return {
      passed: false,
      original: sceneDesc,
      calibrated,
      reason: `场景不匹配${archive.name}栖息地，已自动修正`
    };
  }
  
  _injectHabitat(sceneDesc, habitat) {
    // 在场景描述中注入栖息地信息
    const habitatDesc = `${habitat.location}，${habitat.climate}`;
    
    // 如果场景描述较短，直接追加
    if (sceneDesc.length < 50) {
      return `${sceneDesc}，位于${habitatDesc}`;
    }
    
    // 否则在中间插入
    const mid = Math.floor(sceneDesc.length / 2);
    return `${sceneDesc.slice(0, mid)}，此地正是${habitatDesc}${sceneDesc.slice(mid)}`;
  }
}

/**
 * 运镜推荐器 - 基于体型/类型智能推荐运镜
 */
class CinemaRecommender {
  /**
   * 推荐运镜方案
   * @param {string} beastId - 神兽ID
   * @param {string} emotion - 情绪
   * @returns {Object} - 运镜方案
   */
  recommend(beastId, emotion = 'majestic') {
    const archive = loadBeastArchive(beastId);
    if (!archive) return null;
    
    const cinema = archive.cinema || {};
    const scale = cinema.scale || '大型';
    
    // 基于体型推荐基础运镜
    const baseShots = this._getBaseShots(scale);
    
    // 基于情绪推荐运镜风格
    const emotionShots = this._getEmotionShots(emotion);
    
    // 基于神兽类型推荐特殊运镜
    const specialShots = cinema.recommendedShots || [];
    
    return {
      beastName: archive.name,
      scale,
      baseShots,
      emotionShots,
      specialShots,
      lighting: cinema.lighting || '自然光',
      effects: cinema.effects || '',
      recommended: [...new Set([...specialShots, ...baseShots, ...emotionShots])]
    };
  }
  
  _getBaseShots(scale) {
    const scaleShots = {
      '超巨型（千里级）': ['extreme_wide', 'aerial', 'worm_view', 'drone_shot'],
      '巨型（百米级）': ['wide', 'aerial', 'low_angle', 'tracking'],
      '大型（十米级）': ['medium_wide', 'low_angle', 'tracking'],
      '中型（米级）': ['medium', 'close_up', 'tracking'],
      '小型': ['close_up', 'macro', 'intimate']
    };
    return scaleShots[scale] || ['medium'];
  }
  
  _getEmotionShots(emotion) {
    const emotionMap = {
      'majestic': ['low_angle', 'slow_motion', 'epic_wide'],
      'mysterious': ['shadow_play', 'silhouette', 'fog_shot'],
      'ominous': ['dutch_angle', 'high_contrast', 'dark_lighting'],
      'awe': ['extreme_wide', 'slow_zoom', 'reveal'],
      'fear': ['shaky_cam', 'rapid_cut', 'close_up'],
      'peaceful': ['smooth_pan', 'golden_hour', 'wide']
    };
    return emotionMap[emotion] || ['medium'];
  }
}

/**
 * 场景生成器 - 生成匹配的场景描述
 */
class SceneGenerator {
  /**
   * 生成场景描述
   * @param {string} beastId - 神兽ID
   * @param {string} sceneType - 场景类型
   * @returns {string} - 场景描述
   */
  generate(beastId, sceneType = 'encounter') {
    const archive = loadBeastArchive(beastId);
    if (!archive) return '';
    
    // 优先读取 nirath.habitat，其次读取 habitat
    const habitat = archive.nirath?.habitat || archive.habitat || {};
    const appearance = archive.appearance || {};
    
    const sceneTemplates = {
      encounter: `${habitat.location || '神秘之地'}，${habitat.climate || '雾气弥漫'}。${archive.name}缓缓现身，${appearance.summary || ''}`,
      battle: `${habitat.location || '战场'}风云变色，${archive.name}怒目而视，${archive.abilities?.[0]?.name || '神力涌动'}`,
      sacred: `${habitat.location || '圣地'}光芒万丈，${archive.name}庄严伫立，${appearance.special || '神性光辉'}`,
      hidden: `${habitat.location || '秘境'}深处，${archive.name}隐匿于${appearance.skin?.split('，')[0] || '暗影'}之中`
    };
    
    return sceneTemplates[sceneType] || sceneTemplates.encounter;
  }
}

module.exports = {
  loadBeastArchive,
  detectBeasts,
  PromptInjector,
  ConsistencyGuard,
  WorldviewCalibrator,
  CinemaRecommender,
  SceneGenerator
};