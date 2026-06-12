/**
 * PromptForge 质量守门员 v1.0-Peng
 * 
 * Stage 3: 质量检查
 * 调用质量标准，逐项检查Prompt质量
 */

const fs = require('fs');
const path = require('path');

class PromptForgeGatekeeper {
  constructor(options = {}) {
    this.projectDir = options.projectDir || process.cwd();
    this.verbose = options.verbose !== false;
    
    // 质量检查维度
    this.dimensions = [
      '结构完整性',
      '台词深度',
      '运镜可执行性',
      'Nirath元素注入',
      '角色一致性',
      '情绪弧线连贯性',
      '视觉丰富度',
      '导演风格落地'
    ];
  }

  /**
   * 执行质量检查
   */
  async check(optimizedShots, directorIntent) {
    const results = {
      passed: true,
      score: 0,
      maxScore: 100,
      dimensions: {},
      issues: [],
      improvements: []
    };
    
    // 逐项检查
    for (const dimension of this.dimensions) {
      const checkResult = this._checkDimension(dimension, optimizedShots, directorIntent);
      results.dimensions[dimension] = checkResult;
      
      if (!checkResult.passed) {
        results.passed = false;
        results.issues.push(`${dimension}: ${checkResult.issue}`);
      }
      
      if (checkResult.improvement) {
        results.improvements.push(`${dimension}: ${checkResult.improvement}`);
      }
    }
    
    // 计算总分
    results.score = this._calculateScore(results.dimensions);
    
    // 检查是否达到90分
    if (results.score < 90) {
      results.passed = false;
      results.issues.push(`总分未达标: ${results.score}/100 (目标90+)`);
    }
    
    return results;
  }

  /**
   * 检查单个维度
   */
  _checkDimension(dimension, shots, directorIntent) {
    switch (dimension) {
      case '结构完整性':
        return this._checkStructure(shots);
      case '台词深度':
        return this._checkDialogueDepth(shots);
      case '运镜可执行性':
        return this._checkCameraExecutability(shots);
      case 'Nirath元素注入':
        return this._checkNirathElements(shots);
      case '角色一致性':
        return this._checkCharacterConsistency(shots, directorIntent);
      case '情绪弧线连贯性':
        return this._checkEmotionArc(shots, directorIntent);
      case '视觉丰富度':
        return this._checkVisualRichness(shots);
      case '导演风格落地':
        return this._checkDirectorStyle(shots, directorIntent);
      default:
        return { passed: true, score: 10, issue: null, improvement: null };
    }
  }

  /**
   * 检查结构完整性
   */
  _checkStructure(shots) {
    let passed = true;
    let issues = [];
    
    for (const shot of shots) {
      // 检查是否有PromptForge优化标记
      if (!shot._promptForgeOptimized) {
        passed = false;
        issues.push(`${shot.id} 未经过PromptForge优化`);
      }
      
      // 检查关键字段
      if (!shot._promptForgeDialogue && !shot._promptForgeCamera) {
        passed = false;
        issues.push(`${shot.id} 缺少优化内容`);
      }
    }
    
    return {
      passed: passed,
      score: passed ? 15 : 10,
      issue: issues.length > 0 ? issues.join('; ') : null,
      improvement: passed ? null : '确保所有镜头经过PromptForge优化'
    };
  }

  /**
   * 检查台词深度
   */
  _checkDialogueDepth(shots) {
    let totalDepth = 0;
    let dialogueCount = 0;
    
    for (const shot of shots) {
      if (shot._promptForgeDialogue) {
        dialogueCount++;
        const text = shot._promptForgeDialogue;
        
        // 深度评估：L1=描述型, L2=情感型, L3=人格型
        let depth = 1;
        
        // L2: 包含情感表达
        if (text.includes('(') || text.includes(')') || 
            /情感|情绪|感受|感觉/.test(text)) {
          depth = 2;
        }
        
        // L3: 包含人格特征/哲学思考
        if (/三千年|永恒|stone|wind|vein|地脉|回响|共鸣/.test(text)) {
          depth = 3;
        }
        
        totalDepth += depth;
      }
    }
    
    const avgDepth = dialogueCount > 0 ? totalDepth / dialogueCount : 0;
    const passed = avgDepth >= 2.5; // 要求平均L2.5+
    
    return {
      passed: passed,
      score: passed ? 15 : 10,
      issue: passed ? null : `台词深度不足: ${avgDepth.toFixed(1)}/3.0 (目标≥2.5)`,
      improvement: passed ? null : '增加隐喻、时间尺度、自然元素引用'
    };
  }

  /**
   * 检查运镜可执行性
   */
  _checkCameraExecutability(shots) {
    let passed = true;
    let issues = [];
    
    const executableKeywords = [
      '推镜', '拉镜', '摇镜', '跟镜', '升镜', '降镜',
      '航拍', '环绕', '斯坦尼康', '轨道', '稳定器',
      '特写', '中景', '全景', '远景', '大全景',
      'f/', 'mm', '度', '秒', 'm/s'
    ];
    
    for (const shot of shots) {
      if (shot._promptForgeCamera) {
        const hasExecutable = executableKeywords.some(kw => 
          shot._promptForgeCamera.includes(kw)
        );
        
        if (!hasExecutable) {
          passed = false;
          issues.push(`${shot.id} 运镜描述缺乏可执行参数`);
        }
      }
    }
    
    return {
      passed: passed,
      score: passed ? 10 : 5,
      issue: issues.length > 0 ? issues.join('; ') : null,
      improvement: passed ? null : '增加具体镜头参数（焦距、速度、角度）'
    };
  }

  /**
   * 检查Nirath元素注入
   */
  _checkNirathElements(shots) {
    let totalElements = 0;
    const minElements = 2; // 每个镜头至少2个Nirath元素
    
    const nirathKeywords = [
      '双日', '暮光', '能量河流', '光脉', '孢子', '硅基',
      'Nirath', '断裂山脉', '不周山', '能量结晶', '玛瑙质',
      '虹彩', '地脉', '生物荧光', '光脉网络'
    ];
    
    for (const shot of shots) {
      let count = 0;
      const text = [
        shot._promptForgeNirath || '',
        shot._promptForgeCamera || '',
        shot._promptForgeLighting || ''
      ].join(' ');
      
      for (const kw of nirathKeywords) {
        if (text.includes(kw)) count++;
      }
      
      totalElements += count;
    }
    
    const avgElements = totalElements / shots.length;
    const passed = avgElements >= minElements;
    
    return {
      passed: passed,
      score: passed ? 10 : 5,
      issue: passed ? null : `Nirath元素不足: ${avgElements.toFixed(1)}/${minElements} 每镜头`,
      improvement: passed ? null : '增加Nirath专属元素（双日、光脉、孢子、硅基植物）'
    };
  }

  /**
   * 检查角色一致性
   */
  _checkCharacterConsistency(shots, directorIntent) {
    const beastProfile = directorIntent.beastProfile || {};
    const beastName = beastProfile.name || '未知';
    
    let passed = true;
    let issues = [];
    
    // 检查异兽角色是否保持设定
    for (const shot of shots) {
      const chars = shot.characters || [];
      
      for (const char of chars) {
        const charName = typeof char === 'string' ? char : char.name;
        
        if (this._isBeast(charName)) {
          // 检查是否违反异兽设定
          const text = shot._promptForgeDialogue || '';
          
          // 异兽不应该说过于人类口语化的话
          if (/你好|谢谢|再见|对不起|没关系/.test(text)) {
            passed = false;
            issues.push(`${shot.id} 异兽台词过于口语化`);
          }
        }
      }
    }
    
    return {
      passed: passed,
      score: passed ? 10 : 5,
      issue: issues.length > 0 ? issues.join('; ') : null,
      improvement: passed ? null : '异兽台词应使用隐喻、自然元素、时间尺度表达'
    };
  }

  /**
   * 检查情绪弧线连贯性
   */
  _checkEmotionArc(shots, directorIntent) {
    const expectedArc = directorIntent.emotionArc || [];
    const actualEmotions = shots.map(s => s.emotion || 'unknown');
    
    // 简单检查：情绪是否有递进，不是随机跳跃
    let passed = true;
    let issue = null;
    
    if (actualEmotions.length >= 2) {
      // 检查是否有明显断裂（从tense直接跳到transcendence）
      for (let i = 1; i < actualEmotions.length; i++) {
        const prev = actualEmotions[i-1];
        const curr = actualEmotions[i];
        
        // 定义情绪递进关系
        const validTransitions = {
          'mysterious': ['tense', 'curious', 'awe'],
          'tense': ['awe', 'fury', 'shock'],
          'awe': ['fury', 'climax', 'brave'],
          'fury': ['climax', 'transcendence'],
          'climax': ['transcendence', 'resolution'],
          'transcendence': ['resolution']
        };
        
        const validNext = validTransitions[prev] || [];
        if (!validNext.includes(curr) && prev !== curr) {
          // 允许一些跳跃，但记录
          console.log(`  [Gatekeeper] ℹ️ 情绪跳转: ${prev} → ${curr}`);
        }
      }
    }
    
    return {
      passed: passed,
      score: 10,
      issue: issue,
      improvement: null
    };
  }

  /**
   * 检查视觉丰富度
   */
  _checkVisualRichness(shots) {
    let totalVisualElements = 0;
    
    for (const shot of shots) {
      const text = [
        shot._promptForgeCamera || '',
        shot._promptForgeLighting || '',
        shot._promptForgeNirath || ''
      ].join(' ');
      
      // 统计视觉元素密度
      const visualKeywords = [
        '光', '影', '色', '纹', '质', '体', '形', '线',
        '粒子', '光束', '光晕', '反射', '折射', '透明',
        '发光', '荧光', '磷光', '虹彩', '渐变'
      ];
      
      let count = 0;
      for (const kw of visualKeywords) {
        if (text.includes(kw)) count++;
      }
      
      totalVisualElements += count;
    }
    
    const avgVisual = totalVisualElements / shots.length;
    const passed = avgVisual >= 5; // 每个镜头至少5个视觉元素
    
    return {
      passed: passed,
      score: passed ? 10 : 5,
      issue: passed ? null : `视觉元素不足: ${avgVisual.toFixed(1)}/5 每镜头`,
      improvement: passed ? null : '增加光影、纹理、色彩、粒子等视觉细节'
    };
  }

  /**
   * 检查导演风格落地
   */
  _checkDirectorStyle(shots, directorIntent) {
    const style = directorIntent.styleChoices[0]?.name || '维伦纽瓦';
    
    const styleKeywords = {
      '维伦纽瓦': ['缓慢', '巨物', '敬畏', '史诗', '推镜', '景深'],
      '塔可夫斯基': ['长镜头', '时间', '诗性', '水面', '倒影', '叠化'],
      '宫崎骏': ['温柔', '生机', '动画', '流畅', '光晕', '俯瞰'],
      '诺兰': ['紧迫', '时间', '张力', '剪辑', '信息', '结构'],
      '斯皮尔伯格': ['奇迹', '平民', '日常', '超自然', '温暖', '显现']
    };
    
    const keywords = styleKeywords[style] || styleKeywords['维伦纽瓦'];
    let foundCount = 0;
    
    for (const shot of shots) {
      const text = shot._promptForgeCamera || '';
      for (const kw of keywords) {
        if (text.includes(kw)) foundCount++;
      }
    }
    
    const avgStyle = foundCount / shots.length;
    const passed = avgStyle >= 1; // 每个镜头至少1个风格关键词
    
    return {
      passed: passed,
      score: passed ? 10 : 5,
      issue: passed ? null : `导演风格落地不足: ${style} 风格仅 ${avgStyle.toFixed(1)}/镜头`,
      improvement: passed ? null : `增加${style}标志性运镜语言`
    };
  }

  /**
   * 计算总分
   */
  _calculateScore(dimensions) {
    let total = 0;
    
    for (const dim of Object.values(dimensions)) {
      total += dim.score || 0;
    }
    
    // 调整至100分制
    return Math.min(100, Math.round(total * 1.25));
  }

  /**
   * 判断是否为异兽角色
   */
  _isBeast(charName) {
    const beastKeywords = ['刑天', '烛龙', '帝江', '九尾狐', '白泽', '饕餮', '穷奇', '混沌', '梼杌', '相柳', '毕方', '夔'];
    return beastKeywords.some(kw => charName.includes(kw));
  }
}

module.exports = PromptForgeGatekeeper;