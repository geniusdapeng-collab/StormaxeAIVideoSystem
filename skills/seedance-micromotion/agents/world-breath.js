/**
 * World Breath Agent v1.0-Peng
 * 世界呼吸 — 为环境元素注入生命
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MOTION_LIBRARY = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'motion-library.json'), 'utf8'));

class WorldBreathAgent {
  constructor() {
    this.library = MOTION_LIBRARY.worldBreathElements;
    this.recipes = MOTION_LIBRARY.sceneAtmosphereRecipes;
  }

  /**
   * 为单个镜头生成环境呼吸增强
   */
  enhance(shot, context = {}) {
    const sceneType = this._resolveSceneType(shot, context);
    const elements = this._resolveElements(shot, context, sceneType);
    
    // 构建环境描述
    const microDescriptions = this._buildMicroDescriptions(elements);
    
    // 生成增强提示词
    const seedancePrompt = this._buildSeedancePrompt(shot, elements, sceneType);
    
    return {
      shotId: shot.shotId,
      agent: 'WorldBreath',
      sceneType: sceneType,
      elements: elements,
      microDescriptions: microDescriptions,
      seedancePrompt: seedancePrompt,
      seedanceCompatible: true
    };
  }

  _resolveSceneType(shot, context) {
    if (shot.sceneType) return shot.sceneType;
    if (context.sceneType) return context.sceneType;
    if (shot.scene) return shot.scene;
    
    const emotion = (shot.emotion || context.emotion || '').toLowerCase();
    const sceneMap = {
      'anger': '战斗场景',
      'fear': '黑暗场景',
      'sadness': '诀别场景',
      'sad': '诀别场景',
      'joy': '清晨独处',
      'disgust': '阴暗场景',
      'contempt': '室内场景',
      'surprise': '开放场景'
    };
    
    return sceneMap[emotion] || '通用场景';
  }

  _resolveElements(shot, context, sceneType) {
    // 从配方中查找场景元素
    const recipe = this.recipes[sceneType];
    if (recipe && recipe.elements) {
      return recipe.elements;
    }
    
    // 从shot/ context 中直接指定
    if (shot.worldElements) return shot.worldElements;
    if (context.worldElements) return context.worldElements;
    
    // 默认元素
    return ['dustMotes'];
  }

  _buildMicroDescriptions(elements) {
    const descriptions = [];
    
    elements.forEach(elemKey => {
      const [category, key] = this._resolveElementKey(elemKey);
      if (category && key && this.library[category] && this.library[category][key]) {
        const elem = this.library[category][key];
        descriptions.push(`${elem.description || key}:${elem.seedanceCue || ''}`);
      }
    });
    
    return descriptions;
  }

  _resolveElementKey(elemKey) {
    // 解析 "temperatureEffects.coldBreath" 或 "coldBreath"
    if (elemKey.includes('.')) {
      return elemKey.split('.');
    }
    
    // 在库中查找
    for (const [category, items] of Object.entries(this.library)) {
      if (items[elemKey]) return [category, elemKey];
    }
    
    return [null, elemKey];
  }

  _buildSeedancePrompt(shot, elements, sceneType) {
    const originalPrompt = shot.originalPrompt || shot.description || '';
    
    // 从配方获取完整提示词
    const recipe = this.recipes[sceneType];
    let envPrompt = '';
    
    if (recipe && recipe.seedancePrompt) {
      envPrompt = recipe.seedancePrompt;
    } else {
      // 从元素库组装
      const cues = [];
      elements.forEach(elemKey => {
        const [category, key] = this._resolveElementKey(elemKey);
        if (category && key && this.library[category][key]) {
          cues.push(this.library[category][key].seedanceCue);
        }
      });
      envPrompt = cues.filter(Boolean).join(', ');
    }
    
    return {
      original: originalPrompt,
      enhanced: envPrompt,
      fullPrompt: envPrompt ? `${originalPrompt}, ${envPrompt}` : originalPrompt
    };
  }
}

module.exports = { WorldBreathAgent };
