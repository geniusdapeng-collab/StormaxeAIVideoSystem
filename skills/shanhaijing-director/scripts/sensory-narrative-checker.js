/**
 * 感官叙事V2检查模块 — 软性检查项 (v2.0-Peng)
 * 
 * 功能：为PreProductionChecklist新增V2感官叙事检查
 * 原则：不改现有检查逻辑，只追加软性报告
 */

const fs = require('fs');
const path = require('path');

class SensoryNarrativeChecker {
  constructor() {
    this.vocabulary = this._loadVocabulary();
  }

  _loadVocabulary() {
    const vocabPath = path.join(__dirname, '../../shanhaijing-beast-archive/sensory-vocabulary.json');
    if (fs.existsSync(vocabPath)) {
      return JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    }
    return null;
  }

  /**
   * 主检查方法
   * 输入：pipelineResults（现有数据结构）
   * 输出：V2检查报告（软性，不阻断流程）
   */
  check(pipelineResults) {
    const storyPlan = pipelineResults?.storyPlan;
    const shots = storyPlan?.segments?.[0]?.shots || [];
    
    const report = {
      _version: 'v2.0-Peng',
      _type: 'sensory-narrative-soft-check',
      summary: {
        status: 'info',
        message: 'V2感官叙事软性检查（不阻断流程）'
      },
      checks: {}
    };

    // 1. 感知锚点检查
    report.checks.sensoryAnchor = this._checkSensoryAnchor(shots);
    
    // 2. 情感曲线检查
    report.checks.emotionalArc = this._checkEmotionalArc(shots);
    
    // 3. 角色弧光检查
    report.checks.characterArc = this._checkCharacterArc(shots);
    
    // 4. 核心意象检查
    report.checks.coreImagery = this._checkCoreImagery(shots);
    
    // 5. 钻石台词检查
    report.checks.diamondLines = this._checkDiamondLines(shots);
    
    // 6. 静默设计检查
    report.checks.silenceDesign = this._checkSilenceDesign(shots);
    
    // 7. 伪视角排除检查
    report.checks.pseudoPerspective = this._checkPseudoPerspective(shots);
    
    // 8. 感官蒙太奇检查
    report.checks.sensoryMontage = this._checkSensoryMontage(shots);

    // 生成综合评分
    report.score = this._calculateScore(report.checks);
    
    // 生成建议
    report.suggestions = this._generateSuggestions(report.checks);

    return report;
  }

  /**
   * 1. 感知锚点检查
   * 检查每个镜头是否使用异兽的主要感官+超敏区
   */
  _checkSensoryAnchor(shots) {
    const results = [];
    let passCount = 0;
    
    for (const shot of shots) {
      const description = shot.description || '';
      
      // 检查是否包含感官词汇
      const hasSensoryVocab = /频率|波动|震动|振动|共振|能量|地脉|战意|气息|感知|扫描|解码|共鸣|色晕|气味|热成像|时间流速|整体场域/.test(description);
      
      // 检查是否包含人类中心视角
      const hasHumanCentric = /孩子.*看到|孩子.*走进|孩子.*抬头|孩子.*伸手|人类.*看到|男孩.*看到|男孩.*走进/.test(description);
      
      const status = hasSensoryVocab && !hasHumanCentric ? 'pass' : 'warning';
      if (status === 'pass') passCount++;
      
      results.push({
        shotId: shot.id,
        status,
        hasSensoryVocab,
        hasHumanCentric,
        suggestion: status === 'warning' 
          ? '建议改为异兽感官视角：频率/波动/能量/共鸣'
          : null
      });
    }
    
    return {
      title: '感知锚点检查',
      total: shots.length,
      pass: passCount,
      status: passCount >= shots.length * 0.7 ? 'pass' : 'warning',
      details: results,
      message: `${passCount}/${shots.length}个镜头使用异兽感官视角`
    };
  }

  /**
   * 2. 情感曲线检查
   * 检查是否有至少3个情感转折点
   */
  _checkEmotionalArc(shots) {
    const emotions = shots.map(s => s.emotionalTarget?.emotion || '未知');
    const turningPoints = [];
    
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i] !== emotions[i-1]) {
        turningPoints.push({
          index: i,
          from: emotions[i-1],
          to: emotions[i]
        });
      }
    }
    
    return {
      title: '情感曲线检查',
      emotions,
      turningPoints,
      turningCount: turningPoints.length,
      status: turningPoints.length >= 3 ? 'pass' : 'warning',
      message: `发现${turningPoints.length}个情感转折，${turningPoints.length >= 3 ? '达标' : '建议增加到3个以上'}`
    };
  }

  /**
   * 3. 角色弧光检查
   * 检查异兽的Need是否在结尾被满足或悲剧性落空
   */
  _checkCharacterArc(shots) {
    // 检查最后几个镜头的情感走向
    const lastShots = shots.slice(-3);
    const lastEmotions = lastShots.map(s => s.emotionalTarget?.emotion || '');
    
    // 检查是否有"转变"或"完成"的迹象
    const hasResolution = lastEmotions.some(e => 
      /平静|宁静|安详|释然|传承|满足/.test(e)
    );
    
    return {
      title: '角色弧光检查',
      lastEmotions,
      hasResolution,
      status: hasResolution ? 'pass' : 'warning',
      message: hasResolution 
        ? '结尾有情感解决迹象，角色弧光完成'
        : '结尾缺少情感解决，建议增加转变或传承意象'
    };
  }

  /**
   * 4. 核心意象检查
   * 检查是否有核心意象在最后10秒绽放
   */
  _checkCoreImagery(shots) {
    const descriptions = shots.map(s => s.description || '').join(' ');
    
    // 检查预埋线索
    const seedPatterns = [
      { name: '光暗变化', pattern: /光|暗|亮|灭|暗淡|发光|微光/ },
      { name: '温度隐喻', pattern: /温度|温暖|冷|热|冰|火|温热/ },
      { name: '消散凝聚', pattern: /消散|凝聚|散去|汇聚|消失|出现|消散/ },
      { name: '频率波动', pattern: /频率|波动|震动|振动|共振|律动/ }
    ];
    
    const planted = [];
    for (const seed of seedPatterns) {
      if (seed.pattern.test(descriptions)) {
        planted.push(seed.name);
      }
    }
    
    // 检查最后镜头是否有绽放
    const lastShot = shots[shots.length - 1];
    const lastDescription = lastShot?.description || '';
    const hasBloom = /静默|无声|空镜|呼吸|余韵|余震|消散|融合/.test(lastDescription);
    
    return {
      title: '核心意象检查',
      planted,
      plantedCount: planted.length,
      hasBloom,
      status: planted.length >= 2 && hasBloom ? 'pass' : 'warning',
      message: planted.length >= 2 && hasBloom
        ? `已预埋${planted.length}类线索，结尾有绽放意象`
        : `预埋线索${planted.length}类，${hasBloom ? '' : '结尾缺少绽放意象'}`
    };
  }

  /**
   * 5. 钻石台词检查
   * 检查异兽台词是否≤3句，每句是否满足钻石标准
   */
  _checkDiamondLines(shots) {
    let count = 0;
    const lines = [];
    
    for (const shot of shots) {
      const dialogue = shot.dialogue?.beast || shot.beastDialogue || '';
      if (dialogue) {
        count++;
        
        // 钻石标准检查
        const hasMultiLayer = dialogue.length <= 15; // 简短 = 可能多层含义
        const isIrreplaceable = true; // 简化判断
        const hasVoiceSignature = /战魂|低语|岩石|地脉/.test(dialogue); // 异兽声音签名
        
        lines.push({
          shotId: shot.id,
          line: dialogue,
          chars: dialogue.length,
          diamondScore: [hasMultiLayer, isIrreplaceable, hasVoiceSignature].filter(Boolean).length
        });
      }
    }
    
    return {
      title: '钻石台词检查',
      count,
      target: 3,
      status: count <= 3 ? 'pass' : 'warning',
      lines,
      message: count <= 3 
        ? `异兽台词${count}句，符合≤3句标准`
        : `异兽台词${count}句，建议精简到3句以内`
    };
  }

  /**
   * 6. 静默设计检查
   * 检查最后8-12秒是否有绝对静默段落
   */
  _checkSilenceDesign(shots) {
    let silenceDuration = 0;
    const silenceShots = [];
    
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      const desc = shot.description || '';
      
      // 检查是否静默设计
      const isSilence = /静默|无声|沉默|空镜头|空镜|纯画面|无对白/.test(desc);
      
      if (isSilence) {
        silenceDuration += shot.duration || 0;
        silenceShots.push(shot.id);
      }
    }
    
    return {
      title: '静默设计检查',
      silenceDuration,
      target: 8,
      silenceShots,
      status: silenceDuration >= 8 ? 'pass' : 'warning',
      message: silenceDuration >= 8
        ? `静默时长${silenceDuration}秒，达标`
        : `静默时长${silenceDuration}秒，建议增加到8秒以上`
    };
  }

  /**
   * 7. 伪视角排除检查
   * 检查是否存在人类中心视角的描述
   */
  _checkPseudoPerspective(shots) {
    let pseudoCount = 0;
    const issues = [];
    
    for (const shot of shots) {
      const desc = shot.description || '';
      
      // 伪视角模式
      const pseudoPatterns = [
        { pattern: /孩子.*看到/, example: '孩子看到刑天' },
        { pattern: /孩子.*走进/, example: '孩子走进峡谷' },
        { pattern: /孩子.*抬头/, example: '孩子抬头看到' },
        { pattern: /孩子.*伸手/, example: '孩子伸出手' },
        { pattern: /男孩.*看到/, example: '男孩看到' },
        { pattern: /人类.*看到/, example: '人类看到' }
      ];
      
      for (const pseudo of pseudoPatterns) {
        if (pseudo.pattern.test(desc)) {
          pseudoCount++;
          issues.push({
            shotId: shot.id,
            issue: pseudo.example,
            suggestion: `改为异兽感知视角："从战魂的感知中，一个${pseudo.example.replace(/.*看到/, '').replace(/.*走进/, '')}"`
          });
        }
      }
    }
    
    return {
      title: '伪视角排除检查',
      pseudoCount,
      issues,
      status: pseudoCount === 0 ? 'pass' : 'warning',
      message: pseudoCount === 0
        ? '未发现伪视角描述，感官纯度达标'
        : `发现${pseudoCount}处伪视角描述，建议改为异兽感官视角`
    };
  }

  /**
   * 8. 感官蒙太奇检查
   * 检查是否有交叉剪辑不同感知维度的设计
   */
  _checkSensoryMontage(shots) {
    const descriptions = shots.map(s => s.description || '').join(' ');
    
    // 检查是否有多种感知维度
    const visual = /看到|画面|视觉|光|色/.test(descriptions);
    const auditory = /听到|声音|音|声/.test(descriptions);
    const tactile = /触摸|触感|感觉/.test(descriptions);
    
    const dimensions = [visual, auditory, tactile].filter(Boolean).length;
    
    return {
      title: '感官蒙太奇检查',
      dimensions: {
        visual,
        auditory,
        tactile
      },
      dimensionCount: dimensions,
      status: dimensions >= 2 ? 'pass' : 'info',
      message: dimensions >= 2
        ? `发现${dimensions}种感知维度，建议交叉剪辑`
        : `仅${dimensions}种感知维度，建议增加感官蒙太奇设计`
    };
  }

  /**
   * 综合评分
   */
  _calculateScore(checks) {
    const weights = {
      sensoryAnchor: 20,
      emotionalArc: 15,
      characterArc: 15,
      coreImagery: 15,
      diamondLines: 10,
      silenceDesign: 10,
      pseudoPerspective: 10,
      sensoryMontage: 5
    };
    
    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      if (checks[key]?.status === 'pass') {
        score += weight;
      } else if (checks[key]?.status === 'info') {
        score += weight * 0.5;
      }
    }
    
    return Math.round(score);
  }

  /**
   * 生成建议
   */
  _generateSuggestions(checks) {
    const suggestions = [];
    
    if (checks.sensoryAnchor?.status !== 'pass') {
      suggestions.push('🎭 感知锚点：将镜头描述改为异兽感官视角，使用频率/波动/能量/共鸣等词汇');
    }
    
    if (checks.emotionalArc?.status !== 'pass') {
      suggestions.push('📈 情感曲线：增加情感转折，建议包含恐惧→好奇→震颤→退缩→沦陷→转变→余震');
    }
    
    if (checks.characterArc?.status !== 'pass') {
      suggestions.push('🎬 角色弧光：结尾需有情感解决，建议增加传承/释然/平静的意象');
    }
    
    if (checks.coreImagery?.status !== 'pass') {
      suggestions.push('🎯 核心意象：预埋光暗变化、温度隐喻、消散/凝聚对比，最后10秒静默绽放');
    }
    
    if (checks.diamondLines?.status !== 'pass') {
      suggestions.push('💎 钻石台词：精简至3句以内，每句需多层含义、不可替代、声音签名');
    }
    
    if (checks.silenceDesign?.status !== 'pass') {
      suggestions.push('🤫 静默设计：最后8-12秒绝对静默，用空镜头+环境音渐弱+地脉微光');
    }
    
    if (checks.pseudoPerspective?.status !== 'pass') {
      suggestions.push('👁️ 伪视角排除：移除"孩子看到/走进/抬头"等描述，改为"从战魂的感知中..."');
    }
    
    if (checks.sensoryMontage?.status !== 'pass') {
      suggestions.push('🎞️ 感官蒙太奇：交叉剪辑能量视觉+地脉听觉+战意触觉，创造多维感知流');
    }
    
    return suggestions;
  }

  /**
   * 导出Markdown格式
   */
  toMarkdown(report) {
    let md = `## 🎭 V2感官叙事检查报告\n\n`;
    md += `**检查版本**: ${report._version}  \n`;
    md += `**综合评分**: ${report.score}/100  \n`;
    md += `**类型**: ${report.summary.message}  \n\n`;
    
    // 各项检查
    md += `### 详细检查项\n\n`;
    for (const [key, check] of Object.entries(report.checks)) {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : 'ℹ️';
      md += `${icon} **${check.title}**: ${check.message}\n`;
    }
    md += `\n`;
    
    // 建议
    if (report.suggestions.length > 0) {
      md += `### 💡 优化建议\n\n`;
      for (const suggestion of report.suggestions) {
        md += `- ${suggestion}\n`;
      }
      md += `\n`;
    }
    
    return md;
  }
}

module.exports = { SensoryNarrativeChecker };