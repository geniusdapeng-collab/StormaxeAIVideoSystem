/**
 * 60秒节拍表生成器 — 软性工具 (v2.0-Peng)
 * 
 * 功能：基于现有storyPlan生成60秒节拍建议
 * 原则：不改任何数据结构，只生成软性建议
 */

const fs = require('fs');
const path = require('path');

class BeatSheetGenerator {
  constructor() {
    this.templates = this._loadTemplates();
  }

  _loadTemplates() {
    const configPath = path.join(__dirname, '../shanhaijing-story-engine/config/narrative-templates.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return null;
  }

  /**
   * 生成60秒节拍表
   * 输入：storyPlan（现有数据结构，不改）
   * 输出：beatSheet（软性建议，不入主数据流）
   */
  generateBeatSheet(storyPlan) {
    const shots = storyPlan.segments?.[0]?.shots || [];
    const totalDuration = shots.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // 如果总时长不是60秒，给出警告但继续
    const warnings = [];
    if (totalDuration !== 60) {
      warnings.push(`总时长${totalDuration}秒，建议调整为60秒`);
    }

    // 按时间分配节拍
    const beats = this._allocateBeats(shots);
    
    // 软性检查项
    const checks = {
      silenceBudget: this._calculateSilence(shots),
      diamondLines: this._countDiamondLines(shots),
      humanLines: this._countHumanLines(shots),
      coreImageryPlanted: this._checkImagerySeeds(shots),
      sensoryPurity: this._checkSensoryPurity(shots),
      beatDensity: this._calculateBeatDensity(beats),
      emotionalArc: this._extractEmotionalArc(beats)
    };

    // 生成建议
    const suggestions = this._generateSuggestions(checks);

    return {
      _description: '60秒节拍表 — 软性建议（不入库）',
      totalDuration,
      warnings,
      acts: {
        act1: { time: '0-12s', beats: beats.act1 },
        act2: { time: '12-40s', beats: beats.act2 },
        act3: { time: '40-60s', beats: beats.act3 }
      },
      checks,
      suggestions,
      // 软性评分
      scores: {
        narrativeStructure: this._scoreStructure(beats),
        sensoryPurity: this._scoreSensoryPurity(checks),
        emotionalDepth: this._scoreEmotionalDepth(checks),
        overall: this._calculateOverallScore(checks)
      }
    };
  }

  /**
   * 分配节拍到三幕
   */
  _allocateBeats(shots) {
    const act1 = [];
    const act2 = [];
    const act3 = [];

    let currentTime = 0;
    
    for (const shot of shots) {
      const endTime = currentTime + (shot.duration || 0);
      
      // 确定属于哪一幕
      if (endTime <= 12) {
        act1.push({
          shotId: shot.id,
          timeRange: `${currentTime}-${endTime}s`,
          type: shot.type,
          beatName: this._inferBeatName(shot, 'act1'),
          emotionalValue: shot.emotionalTarget?.emotion || '未知'
        });
      } else if (endTime <= 40) {
        act2.push({
          shotId: shot.id,
          timeRange: `${currentTime}-${endTime}s`,
          type: shot.type,
          beatName: this._inferBeatName(shot, 'act2'),
          emotionalValue: shot.emotionalTarget?.emotion || '未知'
        });
      } else {
        act3.push({
          shotId: shot.id,
          timeRange: `${currentTime}-${endTime}s`,
          type: shot.type,
          beatName: this._inferBeatName(shot, 'act3'),
          emotionalValue: shot.emotionalTarget?.emotion || '未知'
        });
      }
      
      currentTime = endTime;
    }

    return { act1, act2, act3 };
  }

  /**
   * 推断节拍名称
   */
  _inferBeatName(shot, act) {
    const typeMap = {
      'act1': {
        'establishing': '感知炸弹',
        'atmosphere': '世界规则',
        'transition': '入侵信号'
      },
      'act2': {
        'interaction': '抵抗',
        'dialogue': '震颤',
        'intimate': '沦陷',
        'action': '抵抗',
        'crisis': '退缩'
      },
      'act3': {
        'resolution': '转变',
        'climax': '意志传递',
        'aftermath': '余震',
        'ending': '余震'
      }
    };
    
    return typeMap[act]?.[shot.type] || '未知节拍';
  }

  /**
   * 计算静默时长
   */
  _calculateSilence(shots) {
    // 检查最后几个镜头是否有静默设计
    const lastShots = shots.slice(-2);
    const silenceDuration = lastShots.reduce((sum, s) => {
      // 如果镜头描述包含"静默"、"无声"等关键词
      const hasSilence = (s.description || '').match(/静默|无声|沉默|空镜头|空镜/i);
      return sum + (hasSilence ? (s.duration || 0) : 0);
    }, 0);
    
    return {
      actual: silenceDuration,
      target: 8,
      status: silenceDuration >= 8 ? 'pass' : 'warning',
      message: silenceDuration >= 8 
        ? `静默时长${silenceDuration}秒，达标` 
        : `静默时长${silenceDuration}秒，建议增加到8秒以上`
    };
  }

  /**
   * 统计钻石台词数量
   */
  _countDiamondLines(shots) {
    let count = 0;
    const diamondLines = [];
    
    for (const shot of shots) {
      // 检查镜头是否有异兽台词
      const beastDialogue = shot.dialogue?.beast || shot.beastDialogue || '';
      if (beastDialogue) {
        count++;
        diamondLines.push({
          shotId: shot.id,
          line: beastDialogue,
          chars: beastDialogue.length
        });
      }
    }
    
    return {
      count,
      target: 3,
      status: count <= 3 ? 'pass' : 'warning',
      lines: diamondLines,
      message: count <= 3 
        ? `异兽台词${count}句，符合≤3句标准` 
        : `异兽台词${count}句，建议精简到3句以内`
    };
  }

  /**
   * 统计人类台词
   */
  _countHumanLines(shots) {
    let count = 0;
    
    for (const shot of shots) {
      const humanDialogue = shot.dialogue?.human || shot.humanDialogue || '';
      if (humanDialogue) {
        count++;
      }
    }
    
    return {
      count,
      target: 0,
      status: count === 0 ? 'ideal' : (count <= 1 ? 'acceptable' : 'warning'),
      message: count === 0 
        ? '理想状态：无人类台词' 
        : `人类台词${count}句，建议尽可能减少`
    };
  }

  /**
   * 检查核心意象预埋
   */
  _checkImagerySeeds(shots) {
    const descriptions = shots.map(s => s.description || '').join(' ');
    
    // 检查常见意象预埋词
    const seedPatterns = [
      { name: '光/暗变化', pattern: /光|暗|亮|灭|暗淡|发光/i },
      { name: '温度隐喻', pattern: /温度|温暖|冷|热|冰|火/i },
      { name: '消散/凝聚', pattern: /消散|凝聚|散去|汇聚|消失|出现/i },
      { name: '频率/波动', pattern: /频率|波动|震动|振动|共振/i }
    ];
    
    const planted = [];
    for (const seed of seedPatterns) {
      if (seed.pattern.test(descriptions)) {
        planted.push(seed.name);
      }
    }
    
    return {
      planted,
      status: planted.length >= 2 ? 'pass' : 'warning',
      message: planted.length >= 2 
        ? `已预埋${planted.length}类意象线索：${planted.join('、')}` 
        : `仅预埋${planted.length}类意象线索，建议增加预埋`
    };
  }

  /**
   * 检查感官纯度
   */
  _checkSensoryPurity(shots) {
    const descriptions = shots.map(s => s.description || '').join(' ');
    
    // 检查人类中心视角词汇
    const humanCentricPatterns = [
      /孩子.*看到/, /孩子.*走进/, /孩子.*抬头/, /孩子.*伸手/,
      /人类.*看到/, /男孩.*看到/, /男孩.*走进/
    ];
    
    let humanCentricCount = 0;
    for (const pattern of humanCentricPatterns) {
      if (pattern.test(descriptions)) {
        humanCentricCount++;
      }
    }
    
    // 检查感官词汇
    const sensoryPatterns = [
      /频率|波动|震动|振动|共振/,
      /能量|地脉|战意|气息/,
      /感知|扫描|解码|共鸣/
    ];
    
    let sensoryCount = 0;
    for (const pattern of sensoryPatterns) {
      if (pattern.test(descriptions)) {
        sensoryCount++;
      }
    }
    
    return {
      humanCentricCount,
      sensoryCount,
      status: humanCentricCount === 0 && sensoryCount >= 3 ? 'pass' : 'warning',
      message: humanCentricCount === 0 
        ? `感官纯度达标，发现${sensoryCount}类感官词汇` 
        : `发现${humanCentricCount}处人类中心视角描述，建议改为异兽感官视角`
    };
  }

  /**
   * 计算节拍密度
   */
  _calculateBeatDensity(beats) {
    const totalBeats = beats.act1.length + beats.act2.length + beats.act3.length;
    return {
      total: totalBeats,
      act1: beats.act1.length,
      act2: beats.act2.length,
      act3: beats.act3.length,
      target: { min: 8, max: 12 },
      status: totalBeats >= 8 && totalBeats <= 12 ? 'pass' : 'warning'
    };
  }

  /**
   * 提取情感弧线
   */
  _extractEmotionalArc(beats) {
    const allBeats = [...beats.act1, ...beats.act2, ...beats.act3];
    const emotions = allBeats.map(b => b.emotionalValue);
    
    return {
      sequence: emotions,
      arc: this._analyzeArc(emotions),
      turningPoints: this._findTurningPoints(emotions)
    };
  }

  /**
   * 分析情感弧线类型
   */
  _analyzeArc(emotions) {
    // 简化的弧线分析
    const hasFear = emotions.some(e => /恐惧|害怕|不安/.test(e));
    const hasPeace = emotions.some(e => /平静|宁静|安详/.test(e));
    const hasTransformation = emotions.some(e => /转变|蜕变|觉醒/.test(e));
    
    if (hasFear && hasTransformation && hasPeace) {
      return '恐惧→转变→平静（完整弧光）';
    } else if (hasFear && hasPeace) {
      return '恐惧→平静（基础弧光）';
    } else {
      return '待完善（建议增加情感转折）';
    }
  }

  /**
   * 找到情感转折点
   */
  _findTurningPoints(emotions) {
    const points = [];
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i] !== emotions[i-1]) {
        points.push({ index: i, from: emotions[i-1], to: emotions[i] });
      }
    }
    return points;
  }

  /**
   * 生成建议
   */
  _generateSuggestions(checks) {
    const suggestions = [];
    
    if (checks.silenceBudget.status !== 'pass') {
      suggestions.push('💡 最后8秒增加静默设计：空镜头、环境音渐弱、地脉微光');
    }
    
    if (checks.diamondLines.status !== 'pass') {
      suggestions.push('💡 精简异兽台词至3句以内，每句需满足钻石标准（多层含义/不可替代/声音签名）');
    }
    
    if (checks.humanLines.status === 'warning') {
      suggestions.push('💡 减少人类台词，理想状态为0句，让故事完全从异兽感知中呈现');
    }
    
    if (checks.coreImageryPlanted.status !== 'pass') {
      suggestions.push('💡 增加核心意象的预埋线索：光暗变化、温度隐喻、消散/凝聚对比');
    }
    
    if (checks.sensoryPurity.status !== 'pass') {
      suggestions.push('💡 修正人类中心视角描述，改为异兽感官语言：频率/波动/能量/共鸣');
    }
    
    if (checks.beatDensity.status !== 'pass') {
      suggestions.push('💡 调整镜头数量，使总节拍数在8-12个之间，确保叙事密度');
    }
    
    return suggestions;
  }

  /**
   * 评分系统
   */
  _scoreStructure(beats) {
    const total = beats.act1.length + beats.act2.length + beats.act3.length;
    if (total >= 8 && total <= 12) return 90;
    if (total >= 6) return 70;
    return 50;
  }

  _scoreSensoryPurity(checks) {
    return checks.sensoryPurity.status === 'pass' ? 95 : 60;
  }

  _scoreEmotionalDepth(checks) {
    let score = 70;
    if (checks.coreImageryPlanted.status === 'pass') score += 15;
    if (checks.diamondLines.status === 'pass') score += 15;
    return score;
  }

  _calculateOverallScore(checks) {
    const structure = this._scoreStructure({ act1: [], act2: [], act3: [] }); // 简化
    const sensory = this._scoreSensoryPurity(checks);
    const emotional = this._scoreEmotionalDepth(checks);
    return Math.round((structure + sensory + emotional) / 3);
  }

  /**
   * 导出为Markdown格式（用于审核文档）
   */
  toMarkdown(beatSheet) {
    let md = `## 🎬 60秒节拍表分析\n\n`;
    md += `**总时长**: ${beatSheet.totalDuration}秒  \n`;
    md += `**综合评分**: ${beatSheet.scores.overall}/100  \n\n`;
    
    if (beatSheet.warnings.length > 0) {
      md += `**⚠️ 警告**: ${beatSheet.warnings.join('；')}  \n\n`;
    }
    
    // 三幕结构
    for (const [act, data] of Object.entries(beatSheet.acts)) {
      md += `### ${act === 'act1' ? '第一幕：入侵' : act === 'act2' ? '第二幕：震颤' : '第三幕：蜕变'} (${data.time})\n\n`;
      md += `| 镜头 | 时间 | 节拍 | 情感 |\n`;
      md += `|------|------|------|------|\n`;
      for (const beat of data.beats) {
        md += `| ${beat.shotId} | ${beat.timeRange} | ${beat.beatName} | ${beat.emotionalValue} |\n`;
      }
      md += `\n`;
    }
    
    // 检查项
    md += `## 📋 感官叙事检查（V2标准）\n\n`;
    md += `- **静默时长**: ${beatSheet.checks.silenceBudget.message}\n`;
    md += `- **钻石台词**: ${beatSheet.checks.diamondLines.message}\n`;
    md += `- **人类台词**: ${beatSheet.checks.humanLines.message}\n`;
    md += `- **核心意象预埋**: ${beatSheet.checks.coreImageryPlanted.message}\n`;
    md += `- **感官纯度**: ${beatSheet.checks.sensoryPurity.message}\n\n`;
    
    // 建议
    if (beatSheet.suggestions.length > 0) {
      md += `## 💡 优化建议\n\n`;
      for (const suggestion of beatSheet.suggestions) {
        md += `- ${suggestion}\n`;
      }
      md += `\n`;
    }
    
    return md;
  }
}

module.exports = { BeatSheetGenerator };