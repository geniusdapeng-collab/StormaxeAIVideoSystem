/**
 * 🏗️ Prompt Three-Layer Architecture v1.0-Peng
 * 系统级模块：将Prompt重构为三层架构
 * 
 * 设计哲学：
 * - 世界基底(World Base) → 通过Seedance Style Reference/外部机制注入
 * - 角色锚点(Character Anchor) → 通过Character Reference注入
 * - 镜头增量(Shot Delta) → 100%用于该镜头独有叙事
 * 
 * 当前实现：在Prompt生成阶段将Prompt分为三层，为未来的API参数分离做准备
 * 适用：所有视频生成项目
 */

const fs = require('fs');
const path = require('path');

/**
 * 三层架构类
 */
class PromptThreeLayerBuilder {
  constructor(options = {}) {
    this.worldBase = {
      styleProfile: options.styleProfile || 'nirath',
      worldDescription: '',
      atmosphere: '',
      lighting: '',
      negativePrompts: '',
      disclaimers: '',
      // 这些字段用于记录，实际通过API参数注入
    };
    
    this.characterAnchor = {
      visualSignature: '',
      coreFeatures: '',
      costume: '',
      accessories: '',
      // 这些字段用于记录，实际通过Character Reference注入
    };
    
    this.shotDelta = {
      narrative: '',
      camera: '',
      emotion: '',
      temporal: '',
      sound: '',
      // 这些字段实际进入Prompt文本
    };
  }

  /**
   * 从已有Prompt中提取三层
   */
  extractLayers(prompt, shot, plan, refs) {
    // 识别世界基底元素
    const worldPatterns = [
      /NO anime.*?NO cartoon.*?NO 3D Disney.*?NO sci-fi/,
      /Nirath dark gold crystallized epic environment/,
      /widescreen 16:9 aspect ratio/,
      /DISCLAIMER:.*?fictional.*?digital creation/,
      /CG hyper-realistic digital character/,
      /NO dark scene NO pitch black.*?bright vivid colors/
    ];
    
    // 识别角色锚点元素
    const characterPatterns = [
      /角色形象:.*?\)/,
      /character reference image locked/,
      /headless titanic torso.*?luminous breast-eyes/
    ];
    
    // 识别镜头独有叙事
    const shotPatterns = [
      /cinematic shot:.*?\./,
      /\[T:.*?\]/, // 时间线分解
      /Dialogue: "(.*?)"/,
      /Beast Opening:.*?Voice/
    ];
    
    // 提取世界基底
    let worldBaseText = '';
    for (const pattern of worldPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        worldBaseText += match[0] + ', ';
      }
    }
    this.worldBase.combined = worldBaseText.replace(/,\s*$/, '');
    
    // 提取角色锚点
    let charAnchorText = '';
    for (const pattern of characterPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        charAnchorText += match[0] + ', ';
      }
    }
    this.characterAnchor.combined = charAnchorText.replace(/,\s*$/, '');
    
    // 剩余内容 = 镜头增量
    let delta = prompt;
    for (const pattern of worldPatterns) {
      delta = delta.replace(pattern, '');
    }
    for (const pattern of characterPatterns) {
      delta = delta.replace(pattern, '');
    }
    // 清理多余逗号和空格
    delta = delta.replace(/,{2,}/g, ',').replace(/^,|,$/g, '').trim();
    this.shotDelta.combined = delta;
    
    return this;
  }

  /**
   * 计算镜头增量占比
   */
  getDeltaRatio() {
    const total = (this.worldBase.combined?.length || 0) + 
                  (this.characterAnchor.combined?.length || 0) + 
                  (this.shotDelta.combined?.length || 0);
    if (total === 0) return 0;
    return ((this.shotDelta.combined?.length || 0) / total) * 100;
  }

  /**
   * 获取三层分析报告
   */
  getAnalysisReport() {
    return {
      worldBaseLength: this.worldBase.combined?.length || 0,
      characterAnchorLength: this.characterAnchor.combined?.length || 0,
      shotDeltaLength: this.shotDelta.combined?.length || 0,
      deltaRatio: this.getDeltaRatio(),
      worldBase: this.worldBase.combined,
      characterAnchor: this.characterAnchor.combined,
      shotDelta: this.shotDelta.combined
    };
  }

  /**
   * 打印三层分析（用于调试）
   */
  printAnalysis() {
    const report = this.getAnalysisReport();
    console.log('🏗️ Prompt三层架构分析:');
    console.log(`  世界基底: ${report.worldBaseLength}字 (${((report.worldBaseLength / (report.worldBaseLength + report.characterAnchorLength + report.shotDeltaLength)) * 100).toFixed(1)}%)`);
    console.log(`  角色锚点: ${report.characterAnchorLength}字 (${((report.characterAnchorLength / (report.worldBaseLength + report.characterAnchorLength + report.shotDeltaLength)) * 100).toFixed(1)}%)`);
    console.log(`  镜头增量: ${report.shotDeltaLength}字 (${report.deltaRatio.toFixed(1)}%)`);
    console.log(`  目标: 镜头增量 ≥ 50%`);
    
    if (report.deltaRatio < 50) {
      console.log(`  ⚠️ 镜头增量占比不足！需要精简世界基底和角色锚点`);
    } else {
      console.log(`  ✅ 镜头增量占比达标`);
    }
  }
}

/**
 * 分析一批镜头的Prompt三层结构
 */
function analyzeShotPrompts(shots, prompts, refsMap = {}) {
  const results = {};
  
  for (const shot of shots) {
    const prompt = prompts[shot.id];
    if (!prompt) continue;
    
    const builder = new PromptThreeLayerBuilder();
    builder.extractLayers(prompt, shot, null, refsMap[shot.id] || []);
    
    results[shot.id] = builder.getAnalysisReport();
    
    console.log(`\n📸 ${shot.id} 三层分析:`);
    builder.printAnalysis();
  }
  
  // 计算平均值
  const totalDeltaRatio = Object.values(results).reduce((sum, r) => sum + r.deltaRatio, 0);
  const avgDeltaRatio = totalDeltaRatio / Object.keys(results).length;
  
  console.log(`\n📊 全局平均镜头增量占比: ${avgDeltaRatio.toFixed(1)}%`);
  
  return { perShot: results, averageDeltaRatio: avgDeltaRatio };
}

/**
 * 为单个镜头生成"精简世界基底"的Prompt
 * 用于：当API支持world_base参数时，镜头Prompt只包含增量
 */
function generateMinimalPrompt(shot, plan, refs, options = {}) {
  const { 
    includeCharacter = true, // 是否包含角色锚点（当无Character Reference时）
    includeWorld = false,     // 是否包含世界基底（当无Style Reference时）
    maxLength = 490
  } = options;
  
  let prompt = '';
  
  // 角色锚点（文字版，当无图片引用时）
  if (includeCharacter && refs.length === 0) {
    const charDesc = _buildCharacterAnchor(shot, plan);
    if (charDesc) prompt += charDesc + ',';
  }
  
  // 镜头增量（核心叙事）
  const narrative = _buildShotNarrative(shot, plan);
  if (narrative) prompt += narrative;
  
  // 世界基底（当无外部注入时，保留最小化版本）
  if (includeWorld) {
    prompt += ',NO anime NO cartoon';
  }
  
  return prompt.substring(0, maxLength);
}

/**
 * 构建角色锚点描述
 */
function _buildCharacterAnchor(shot, plan) {
  const chars = shot.characters || [];
  const parts = [];
  
  for (const charName of chars) {
    const charData = plan?.characters?.find(c => c.name === charName);
    if (charData) {
      const anchor = [];
      if (charData.species) anchor.push(charData.species);
      if (charData.signature) anchor.push(charData.signature);
      if (anchor.length > 0) {
        parts.push(`${charName}(${anchor.join(',')})`);
      }
    }
  }
  
  return parts.length > 0 ? `角色形象:${parts.join(';')}` : '';
}

/**
 * 构建镜头叙事
 */
function _buildShotNarrative(shot, plan) {
  const parts = [];
  
  if (shot.description) parts.push(shot.description);
  if (shot.camera) parts.push(`cinematic shot: ${shot.camera}`);
  if (shot.emotion) parts.push(shot.emotion);
  
  return parts.join(',');
}

module.exports = {
  PromptThreeLayerBuilder,
  analyzeShotPrompts,
  generateMinimalPrompt,
  PHYSIO_TYPES: require('./physiological-perception-injector').PHYSIO_TYPES
};