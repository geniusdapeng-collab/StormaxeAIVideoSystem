#!/usr/bin/env node
/**
 * 台词一致性引擎 v1.0-Peng (ShanhaiStory Forge)
 *
 * 核心设计：
 * - 四个子模块：主题集中度分析器、信息层级推进检查器、对话互动性验证器、故事主轴偏离度计算器
 * - 输入：shots + dialogue
 * - 输出：台词一致性分析报告
 *
 * 版本: v1.0-Peng | 2026-05-29
 * 所属系统: ShanhaiStory Forge v2.26-Peng
 */

class DialogueConsistencyEngine {
  constructor() {
    this.version = '1.0-Peng';
    
    // 主题关键词库（可扩展）
    this.DEFAULT_KEYWORDS = [
      'war', 'battle', 'spirit', 'soul', 'courage', 'legacy', 'destiny',
      'child', 'boy', 'curiosity', 'adventure', 'journey', 'discovery',
      'mythical', 'creature', 'beast', 'ancient', 'mystery',
      'Nirath', 'planet', 'world', 'universe',
      'fire', 'light', 'dark', 'shadow', 'storm',
      'voice', 'whisper', 'echo', 'song', 'chant',
      '力量', '勇气', '灵魂', '传承', '命运',
      '孩子', '少年', '好奇心', '冒险', '探索',
      '神兽', '异兽', '远古', '神秘',
      '声音', '低语', '回响', '歌声'
    ];
  }

  /**
   * 主入口：分析台词一致性
   * @param {Array} shots - 镜头列表
   * @param {Object} dialogue - 台词对象
   * @returns {Object} 台词一致性分析结果
   */
  analyze(shots, dialogue) {
    console.log(`[DialogueConsistencyEngine v${this.version}] 开始分析台词一致性`);
    
    // 1. 提取台词文本
    const lines = this._extractLines(shots, dialogue);
    if (lines.length === 0) {
      return {
        score: 1.0,
        themeDeviation: 0,
        interactivityScore: 0,
        infoHierarchy: 'none',
        deviations: [],
        monologueShots: [],
        redundantShots: []
      };
    }
    
    // 2. 主题集中度分析
    const themeAnalysis = this._analyzeThemeConcentration(lines);
    
    // 3. 信息层级推进检查
    const hierarchyAnalysis = this._analyzeInformationHierarchy(lines, shots);
    
    // 4. 对话互动性验证
    const interactivityAnalysis = this._analyzeInteractivity(lines, shots);
    
    // 5. 故事主轴偏离度计算
    const deviationAnalysis = this._calculateStoryAxisDeviation(lines, themeAnalysis, hierarchyAnalysis, interactivityAnalysis);
    
    // 6. 综合评分
    const score = this._calculateScore(themeAnalysis, hierarchyAnalysis, interactivityAnalysis, deviationAnalysis);
    
    const result = {
      score,
      themeDeviation: themeAnalysis.averageDeviation,
      interactivityScore: interactivityAnalysis.score,
      infoHierarchy: hierarchyAnalysis.hierarchy,
      deviatedShots: themeAnalysis.deviatedShots,
      monologueShots: interactivityAnalysis.monologueShots,
      redundantShots: hierarchyAnalysis.redundantShots,
      details: {
        theme: themeAnalysis,
        hierarchy: hierarchyAnalysis,
        interactivity: interactivityAnalysis,
        deviation: deviationAnalysis
      }
    };
    
    console.log(`[DialogueConsistencyEngine] 分析完成：主题偏离度 ${result.themeDeviation.toFixed(2)} | 互动性 ${result.interactivityScore.toFixed(2)} | 层级 ${result.infoHierarchy}`);
    
    return result;
  }

  // ====== 子模块1：主题集中度分析器 ======
  _analyzeThemeConcentration(lines) {
    // 提取核心主题关键词
    const keywords = this._extractKeywords(lines);
    
    // 计算每行台词的主题偏离度
    const deviations = [];
    let totalDeviation = 0;
    
    lines.forEach((line, idx) => {
      const text = line.text || line.line || line.content || '';
      const deviation = this._calculateTextDeviation(text, keywords);
      totalDeviation += deviation;
      
      if (deviation > 0.4) {
        deviations.push({
          shotId: line.shotId || `S${String(idx).padStart(2, '0')}`,
          text: text.substring(0, 100),
          deviation,
          reason: '台词内容与核心主题偏离度超过阈值(0.4)'
        });
      }
    });
    
    const averageDeviation = lines.length > 0 ? totalDeviation / lines.length : 0;
    const concentration = 1 - averageDeviation;
    
    return {
      keywords,
      averageDeviation,
      concentration,
      deviatedShots: deviations.map(d => d.shotId),
      deviations
    };
  }
  
  _extractKeywords(lines) {
    // 合并所有文本
    const allText = lines.map(l => l.text || l.line || l.content || '').join(' ');
    
    // 统计词频（简化版：按空格分词）
    const words = allText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });
    
    // 合并默认关键词和动态提取的关键词
    const dynamicKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
    
    return [...new Set([...this.DEFAULT_KEYWORDS, ...dynamicKeywords])];
  }
  
  _calculateTextDeviation(text, keywords) {
    if (!text) return 1;
    
    const lowerText = text.toLowerCase();
    let maxSimilarity = 0;
    
    keywords.forEach(kw => {
      if (lowerText.includes(kw.toLowerCase())) {
        maxSimilarity = Math.max(maxSimilarity, 0.8);
      }
      
      // 简单模糊匹配
      if (this._levenshteinDistance(lowerText, kw.toLowerCase()) <= 3) {
        maxSimilarity = Math.max(maxSimilarity, 0.5);
      }
    });
    
    return 1 - maxSimilarity;
  }
  
  _levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // ====== 子模块2：信息层级推进检查器 ======
  _analyzeInformationHierarchy(lines, shots) {
    const layers = [];
    const redundant = [];
    
    lines.forEach((line, idx) => {
      const text = line.text || line.line || line.content || '';
      const layer = this._classifyLayer(text, idx, lines.length);
      layers.push({ shotId: line.shotId || `S${String(idx).padStart(2, '0')}`, layer, text: text.substring(0, 50) });
    });
    
    // 检查层级推进
    let progression = true;
    let currentLayer = 0; // L0 = none
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i].layer;
      const layerNum = { 'L0': 0, 'L1': 1, 'L2': 2, 'L3': 3 }[layer] || 0;
      
      // 检查是否回退（L3→L1不合理）
      if (layerNum < currentLayer - 1) {
        progression = false;
      }
      
      currentLayer = Math.max(currentLayer, layerNum);
      
      // 检查同层级冗余（简化：连续3个L1视为冗余）
      if (i >= 2 && layers[i].layer === 'L1' && layers[i-1].layer === 'L1' && layers[i-2].layer === 'L1') {
        redundant.push(layers[i].shotId);
      }
    }
    
    // 判断整体层级结构
    const uniqueLayers = [...new Set(layers.map(l => l.layer))].filter(l => l !== 'L0');
    let hierarchy = 'flat';
    if (uniqueLayers.includes('L1') && uniqueLayers.includes('L2') && uniqueLayers.includes('L3')) {
      hierarchy = progression ? 'progressive' : 'regressive';
    } else if (uniqueLayers.length >= 2) {
      hierarchy = 'partial';
    }
    
    return {
      layers,
      hierarchy,
      progression,
      redundantShots: redundant,
      layerDistribution: {
        L0: layers.filter(l => l.layer === 'L0').length,
        L1: layers.filter(l => l.layer === 'L1').length,
        L2: layers.filter(l => l.layer === 'L2').length,
        L3: layers.filter(l => l.layer === 'L3').length
      }
    };
  }
  
  _classifyLayer(text, index, total) {
    if (!text) return 'L0';
    const lower = text.toLowerCase();
    
    // L1: 背景层 - 设定、介绍、描述
    if (/^(in|on|at|this|the|there|here|once|long ago|in ancient|world|planet|land)/i.test(text) ||
        /describe|setting|background|introduce|meet|is a|was a/i.test(lower)) {
      return 'L1';
    }
    
    // L3: 情感层 - 情绪、感叹、内心独白
    if (/feel|feeling|heart|soul|emotion|sad|happy|angry|fear|love|hate|wonder|awe/i.test(lower) ||
        /!$|[!！]{2,}/.test(text) ||
        /^(oh|ah|wow|alas|truly|indeed)/i.test(text)) {
      return 'L3';
    }
    
    // L2: 情节层 - 动作、事件、推进
    if (/go|went|run|running|fight|fighting|find|found|search|discover|attack|defend|move|moving|act|action/i.test(lower) ||
        /then|suddenly|next|after|before|when|while|because/i.test(lower)) {
      return 'L2';
    }
    
    return 'L0';
  }

  // ====== 子模块3：对话互动性验证器 ======
  _analyzeInteractivity(lines, shots) {
    const interactions = [];
    const monologues = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = line.text || line.line || line.content || '';
      const speaker = line.speaker || '';
      
      // 识别语用功能
      const pragmatics = this._classifyPragmatics(text);
      
      // 检查与前序台词的互动关系
      let hasResponse = false;
      if (i > 0) {
        const prevText = lines[i-1].text || lines[i-1].line || lines[i-1].content || '';
        const prevPragmatics = this._classifyPragmatics(prevText);
        
        // 检查回应关系
        if (this._isResponse(pragmatics, prevPragmatics, text, prevText)) {
          hasResponse = true;
        }
      }
      
      interactions.push({
        shotId: line.shotId || `S${String(i).padStart(2, '0')}`,
        pragmatics,
        hasResponse,
        isMonologue: !hasResponse && pragmatics === 'statement'
      });
      
      if (!hasResponse && pragmatics === 'statement') {
        monologues.push(line.shotId || `S${String(i).padStart(2, '0')}`);
      }
    }
    
    // 检测连续独白序列（3句以上）
    const monologueSequences = [];
    let currentSeq = [];
    
    interactions.forEach((item, idx) => {
      if (item.isMonologue) {
        currentSeq.push(item.shotId);
      } else {
        if (currentSeq.length >= 3) {
          monologueSequences.push([...currentSeq]);
        }
        currentSeq = [];
      }
    });
    
    if (currentSeq.length >= 3) {
      monologueSequences.push(currentSeq);
    }
    
    // 计算互动性分数
    const responseCount = interactions.filter(i => i.hasResponse).length;
    const score = lines.length > 0 ? responseCount / lines.length : 0;
    
    return {
      interactions,
      score,
      monologueShots: monologueSequences.flat(),
      monologueSequences,
      responseCount,
      totalLines: lines.length
    };
  }
  
  _classifyPragmatics(text) {
    if (!text) return 'statement';
    const lower = text.toLowerCase().trim();
    
    // 问句
    if (/\?$|？$|^(what|who|where|when|why|how|is|are|can|could|would|will|do|does|did|have|has|am)/i.test(lower)) {
      return 'question';
    }
    
    // 请求/命令
    if (/^(please|help|let|need|want|must|should|go|stop|wait|come|follow|lead|take|bring)/i.test(lower) ||
        /!$|！$/.test(lower)) {
      return 'request';
    }
    
    // 承诺/保证
    if (/^(i will|i promise|i swear|trust me|believe me|you can count|i shall)/i.test(lower)) {
      return 'promise';
    }
    
    // 评价/回应
    if (/^(yes|no|true|false|right|wrong|correct|indeed|exactly|absolutely|definitely|certainly|perhaps|maybe|i think|i believe|in my opinion)/i.test(lower)) {
      return 'evaluation';
    }
    
    // 陈述（默认）
    return 'statement';
  }
  
  _isResponse(currentPrag, prevPrag, currentText, prevText) {
    // 问-答对
    if (prevPrag === 'question' && (currentPrag === 'statement' || currentPrag === 'evaluation')) {
      return true;
    }
    
    // 陈述-评价对
    if (prevPrag === 'statement' && currentPrag === 'evaluation') {
      return true;
    }
    
    // 请求-承诺对
    if (prevPrag === 'request' && currentPrag === 'promise') {
      return true;
    }
    
    // 关键词回应检测
    const prevLower = prevText.toLowerCase();
    const currLower = currentText.toLowerCase();
    
    // 提取关键词并检查是否有重叠
    const prevWords = prevLower.split(/\s+/).filter(w => w.length > 3);
    const currWords = currLower.split(/\s+/).filter(w => w.length > 3);
    const overlap = prevWords.filter(w => currWords.includes(w));
    
    if (overlap.length > 0) {
      return true;
    }
    
    return false;
  }

  // ====== 子模块4：故事主轴偏离度计算器 ======
  _calculateStoryAxisDeviation(lines, themeAnalysis, hierarchyAnalysis, interactivityAnalysis) {
    const deviations = [];
    
    lines.forEach((line, idx) => {
      const text = line.text || line.line || line.content || '';
      
      // 计算三个因子
      const themeFactor = 1 - (themeAnalysis.deviations.find(d => d.shotId === (line.shotId || `S${String(idx).padStart(2, '0')}`))?.deviation || 0);
      
      const layer = hierarchyAnalysis.layers[idx];
      const layerFactor = layer ? ({ 'L0': 0.3, 'L1': 0.5, 'L2': 0.8, 'L3': 1.0 }[layer.layer] || 0.3) : 0.3;
      
      const interaction = interactivityAnalysis.interactions[idx];
      const interactionFactor = interaction ? (interaction.hasResponse ? 1.0 : 0.3) : 0.3;
      
      // 综合贡献度
      const contribution = 0.4 * themeFactor + 0.3 * layerFactor + 0.3 * interactionFactor;
      
      const shotId = line.shotId || `S${String(idx).padStart(2, '0')}`;
      
      deviations.push({
        shotId,
        contribution,
        themeFactor,
        layerFactor,
        interactionFactor,
        isDeviated: contribution < 0.35
      });
    });
    
    const averageContribution = deviations.length > 0 
      ? deviations.reduce((sum, d) => sum + d.contribution, 0) / deviations.length 
      : 0;
    
    const deviatedShots = deviations.filter(d => d.isDeviated).map(d => d.shotId);
    
    return {
      deviations,
      averageContribution,
      deviatedShots,
      deviationRate: deviations.length > 0 ? deviatedShots.length / deviations.length : 0
    };
  }

  // ====== 综合评分 ======
  _calculateScore(themeAnalysis, hierarchyAnalysis, interactivityAnalysis, deviationAnalysis) {
    // 主题集中度评分 (30%)
    const themeScore = themeAnalysis.concentration;
    
    // 信息层级评分 (25%)
    const hierarchyScore = {
      'progressive': 1.0,
      'partial': 0.7,
      'flat': 0.4,
      'regressive': 0.2,
      'none': 0
    }[hierarchyAnalysis.hierarchy] || 0.5;
    
    // 互动性评分 (25%)
    const interactivityScore = interactivityAnalysis.score;
    
    // 主轴偏离评分 (20%)
    const axisScore = 1 - deviationAnalysis.deviationRate;
    
    // 加权综合
    return 0.30 * themeScore + 0.25 * hierarchyScore + 0.25 * interactivityScore + 0.20 * axisScore;
  }

  // ====== 辅助方法 ======
  _extractLines(shots, dialogue) {
    const lines = [];
    
    // 从dialogue.script提取
    if (dialogue && dialogue.script && Array.isArray(dialogue.script)) {
      dialogue.script.forEach((item, idx) => {
        if (typeof item === 'string') {
          lines.push({ text: item, shotId: `S${String(idx).padStart(2, '0')}` });
        } else if (typeof item === 'object') {
          lines.push({
            text: item.text || item.line || item.content || '',
            speaker: item.speaker || item.character || '',
            shotId: item.shotId || `S${String(idx).padStart(2, '0')}`
          });
        }
      });
    }
    
    // 从shots._dialogueMetadata提取
    if (shots && Array.isArray(shots)) {
      shots.forEach((shot, idx) => {
        if (shot._dialogueMetadata && shot._dialogueMetadata.text) {
          // 去重：检查是否已存在
          const existing = lines.find(l => l.shotId === shot.id);
          if (!existing) {
            lines.push({
              text: shot._dialogueMetadata.text,
              speaker: shot._dialogueMetadata.speaker || '',
              shotId: shot.id || `S${String(idx).padStart(2, '0')}`
            });
          }
        }
      });
    }
    
    return lines.filter(l => l.text && l.text.trim().length > 0);
  }
}

module.exports = DialogueConsistencyEngine;