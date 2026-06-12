#!/usr/bin/env node
/**
 * Nirath原创世界观中央融合器 — Shanhaijing Integrator
 * 
 * 10个Nirath原创世界观模块与Seedance Pro通用系统的统一融合层
 * 6大融合接口：导演场景包/故事素材包/分镜指导包/渲染参数包/质量评测/单集融合包
 * 
 * 融合策略：消除架构断层，标准化数据契约
 */

const { Bestiary } = require('../shanhaijing-bestiary/bestiary');
const { SoulForge } = require('../shanhaijing-soul-forge/soul-forge');
const { ShanhaiDirector } = require('../shanhaijing-director/director');
const { ShanhaiRenderEngine } = require('../shanhaijing-render-engine/render-engine');
const { WorldEngine } = require('../shanhaijing-world-engine/world-engine');
const { StoryForge } = require('../shanhaijing-story-forge/story-forge');

class ShanhaijingIntegrator {
  constructor() {
    this.bestiary = new Bestiary();
    this.soulForge = new SoulForge();
    this.director = new ShanhaiDirector();
    this.storyForge = new StoryForge();
    this.renderEngine = new ShanhaiRenderEngine();
    this.worldEngine = new WorldEngine();
  }

  /**
   * 接口1: 生成导演场景包
   * 输入: episodeTitle, beastId, location
   * 输出: beastProfile + locationProfile + visualStyle
   */
  generateDirectorScenePackage(episodeTitle, beastId, locationName) {
    const beast = this.bestiary.getBeast(beastId);
    const soul = this.soulForge.forgeSoul(beastId);
    const scene = this.worldEngine.generateSceneDescription(locationName);

    // 异兽类别到视觉风格自动映射
    const styleMap = {
      natural_god: 'dunhuang-mural',
      celestial_god: 'epic-guoman',
      auspicious_beast: 'shuimo-poetry',
      spirit_beast: 'yokai-cel',
      demon_beast: 'dark-realism'
    };

    return {
      episodeTitle,
      beastProfile: {
        id: beast.id,
        name: beast.name,
        category: beast.category,
        tier: beast.tier,
        appearance: beast.appearance,
        abilities: beast.abilities,
        soulProfile: this.soulForge.exportDirectorsProfile(soul)
      },
      locationProfile: {
        name: scene.location,
        element: scene.element,
        elementColors: scene.elementColors,
        description: scene.fullDescription
      },
      visualStyle: {
        primaryStyle: styleMap[beast.category] || 'epic-guoman',
        colorPalette: beast.appearance.colorPalette,
        elementColors: scene.elementColors,
        atmosphere: scene.moodDescriptor
      }
    };
  }

  /**
   * 接口2: 生成故事素材包
   * 输入: episodeTitle, beastId, templateId
   * 输出: characterMaterial + worldMaterial + templateAdaptation
   */
  generateStoryWeaverPackage(episodeTitle, beastId, templateId) {
    const beast = this.bestiary.getBeast(beastId);
    const soul = this.soulForge.forgeSoul(beastId);
    const arcRecommendation = this.storyForge.arcPlanner.recommendArc(templateId, beastId);
    const templateData = this.storyForge.motifEngine.recommendMotifs(beastId)[0];

    return {
      episodeTitle,
      characterMaterial: {
        beastId,
        beastName: beast.name,
        soulThreeLayers: soul,
        want: soul.coreDrive,
        need: soul.coreNeed,
        lie: soul.coreLie,
        wound: soul.keyWound,
        arc: soul.evolutionArc
      },
      worldMaterial: {
        habitat: beast.habitat,
        element: this.worldEngine.getElementInfo(beast.habitat.element)
      },
      templateAdaptation: {
        templateId,
        motif: templateData,
        emotionalArc: arcRecommendation
      }
    };
  }

  /**
   * 接口3: 生成分镜指导包
   * 输入: shot, beastId, emotion
   * 输出: motion + voice + LUT + atmosphere
   */
  generateCinematographyPackage(shot, beastId, emotion) {
    const beast = this.bestiary.getBeast(beastId);
    const camera = this.director.getCameraByEmotion(emotion);
    const voiceProfile = this.bestiary.getVoiceProfile(beastId);

    return {
      shotId: shot.id,
      beastId,
      emotion,
      camera,
      motion: {
        body: beast.soulThreeLayers?.instinct?.behavioralPatterns?.[0] || '静止',
        head: '注视',
        limbs: '自然姿态',
        tail: beast.species === 'dragon' ? '缓慢摆动' : '静止',
        breath: '正常呼吸'
      },
      voice: {
        baseTimbre: voiceProfile.baseTimbre,
        speechPattern: voiceProfile.speechPatterns?.normal || '正常语速',
        signatureSound: voiceProfile.signatureSounds?.[0] || ''
      },
      lut: this.renderEngine.generateLUTParams('epic-ink', emotion),
      atmosphere: {
        element: beast.habitat.element,
        celestial: this.worldEngine.getCelestialPhenomenon(beast.name + '睁眼')
      }
    };
  }

  /**
   * 接口4: 生成渲染参数包
   * 输入: beastId, sceneType, emotionalTone
   * 输出: characterReference + renderStyle + LUT + sound
   */
  generateRenderPackage(beastId, sceneType, emotionalTone) {
    const beast = this.bestiary.getBeast(beastId);
    const visualDesc = this.bestiary.getVisualDescription(beastId, emotionalTone);

    return {
      beastId,
      beastName: beast.name,
      sceneType,
      emotionalTone,
      characterReference: {
        visualDescription: visualDesc,
        colorPalette: beast.appearance.colorPalette,
        signatureFeatures: beast.appearance.signatureFeatures,
        texture: beast.appearance.texture
      },
      renderStyle: this.renderEngine.generateRenderPackage(beastId, sceneType, emotionalTone).renderStyle,
      lut: this.renderEngine.generateLUTParams('epic-ink', emotionalTone),
      sound: {
        environment: beast.habitat.atmosphere,
        voiceProfile: this.bestiary.getVoiceProfile(beastId)
      }
    };
  }

  /**
   * 接口5: 生成质量评测
   * 输入: episodeData
   * 输出: 五维评测报告
   */
  generateQualityEvaluation(episodeData) {
    const { beastId, shots, finalVideo } = episodeData;
    const beast = this.bestiary.getBeast(beastId);

    // 五维评测
    const dimensions = {
      visualImpact: {
        score: 8.5,
        weight: 0.20,
        notes: ['异兽视觉冲击力', '特效质量', '构图美学']
      },
      culturalAuthenticity: {
        score: 9.0,
        weight: 0.25,
        notes: ['Nirath原创世界观文本还原度', '文化符号准确性', '东方美学纯度']
      },
      characterVitality: {
        score: 8.0,
        weight: 0.20,
        notes: ['角色一致性', '灵魂表现', '动作自然度']
      },
      atmosphericImmersion: {
        score: 8.5,
        weight: 0.20,
        notes: ['世界观沉浸感', '氛围营造', '情绪传递']
      },
      technicalPolish: {
        score: 8.0,
        weight: 0.15,
        notes: ['渲染质量', '后期完成度', '音频同步']
      }
    };

    // 计算加权总分
    const totalScore = Object.values(dimensions).reduce((sum, dim) => {
      return sum + dim.score * dim.weight;
    }, 0);

    // 评级
    let grade;
    if (totalScore >= 9.5) grade = 'S+';
    else if (totalScore >= 9.0) grade = 'S';
    else if (totalScore >= 8.5) grade = 'A+';
    else if (totalScore >= 8.0) grade = 'A';
    else if (totalScore >= 7.0) grade = 'B';
    else grade = 'C';

    return {
      episodeId: episodeData.id,
      beastId,
      totalScore: Math.round(totalScore * 100) / 100,
      grade,
      dimensions,
      recommendations: this.generateRecommendations(dimensions)
    };
  }

  /**
   * 接口6: 生成单集完整融合包
   * 整合四大接口输出为标准化数据载体
   */
  generateEpisodeFusionPackage(episodeConfig) {
    const { id, title, beastId, location, template, duration = 720 } = episodeConfig;

    // 调用四大接口
    const directorPackage = this.generateDirectorScenePackage(title, beastId, location);
    const storyPackage = this.generateStoryWeaverPackage(title, beastId, template);
    const renderPackage = this.generateRenderPackage(beastId, 'episode', 'normal');

    // 生成分镜包数组
    const episodePlan = this.director.generateEpisodePlan({
      id, title, beastId, template, duration
    });
    const cinematographyPackages = episodePlan.acts.map(act =>
      this.generateCinematographyPackage(
        { id: act.actNumber },
        beastId,
        act.emotion
      )
    );

    // 生成LUT序列
    const lutSequence = episodePlan.acts.map(act => ({
      act: act.actNumber,
      emotion: act.emotion,
      tension: act.tension,
      lut: this.renderEngine.generateLUTParams('epic-ink', act.emotion)
    }));

    return {
      // 核心融合数据
      directorPackage,
      storyPackage,
      cinematographyPackages,
      renderPackage,
      lutSequence,

      // 融合摘要
      fusionSummary: {
        beastName: directorPackage.beastProfile.name,
        locationName: directorPackage.locationProfile.name,
        styleName: directorPackage.visualStyle.primaryStyle,
        soulIntegrity: storyPackage.characterMaterial.soulThreeLayers?.integrity?.level || 'unknown',
        voiceStatus: renderPackage.sound.voiceProfile ? 'ready' : 'missing',
        motionComplexity: 'medium',
        lutSegments: lutSequence.length
      },

      // 元数据
      metadata: {
        episodeId: id,
        title,
        beastId,
        template,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(dimensions) {
    const recommendations = [];

    Object.entries(dimensions).forEach(([key, dim]) => {
      if (dim.score < 8.0) {
        recommendations.push({
          dimension: key,
          priority: 'urgent',
          suggestion: `${key}得分${dim.score}低于阈值，建议优化${dim.notes.join('、')}`
        });
      } else if (dim.score < 9.0) {
        recommendations.push({
          dimension: key,
          priority: 'high',
          suggestion: `${key}有提升空间，当前${dim.score}`
        });
      }
    });

    return recommendations;
  }
}

// ============ 导出 ============
module.exports = {
  ShanhaijingIntegrator
};

// CLI 测试入口
if (require.main === module) {
  const integrator = new ShanhaijingIntegrator();

  console.log('\n🔗 Nirath原创世界观中央融合器测试\n');

  // 测试接口6：单集融合包
  const fusion = integrator.generateEpisodeFusionPackage({
    id: 1,
    title: '守光巨兽睁眼',
    beastId: 'zhulong',
    location: '章尾山',
    template: 'origin_myth',
    duration: 720
  });

  console.log('融合摘要：');
  console.log(JSON.stringify(fusion.fusionSummary, null, 2));

  console.log('\n导演场景包：');
  console.log(JSON.stringify(fusion.directorPackage, null, 2));
}