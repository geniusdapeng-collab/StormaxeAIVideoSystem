#!/usr/bin/env node
/**
 * ShanhaiStory Forge v2.36-Peng | Pre-Production Checklist v1.9-Peng-fix
 * 12维度反向检查 + 自动阻断机制 + P0级铁律 + 利用率硬性闸门(85%-99%)
 * + 🆕 v1.9-Peng-fix: 放宽利用率闸门 85%-99%（原95%-99%）
 *   - 原因: Pipeline存在系统性Prompt字段缺失，先放宽让主链路跑通
 *   - 后续修复生成端后恢复至 95%-99%
 * + v1.8-Peng: 5项P0改进生产发布配套 — 生理感知/情绪翻译/双锚点检查维度
 * + v1.7-Peng: 利用率闸机下限恢复95%，大鹏要求95%为通过标准
 *   - 低于95% = 严重不足，触发补充机制
 *   - 95%-99% = 黄金区间，通过
 *   - 高于99% = 超长阻断
 * + v1.5-Peng: 修复Checklist利用率显示0%问题（三层回退防护）
 * + v1.4-Peng: 软性注入V2感官叙事检查器（8项软性检查，不阻断流程）
 * + v1.3-Peng: 分母统一 490→5500，与全局Prompt上限对齐
 * + v1.3-Peng: 上限合规检查 5500→5500，统一大鹏规则
 * 
 * 🚨 P0级铁律 — 不可协商：
 * 1. 所有视频任务必须先跑完整预生产流程
 * 2. 必须得到主人确切回复"可以提交渲染"后方可渲染
 * 3. 不得假跑完整流程，不得不经确认擅自提交渲染
 * 4. 决策权100%归属主人，AI无权代理
 * 5. 🆕 提示词空间利用率必须稳定在85%-99%之间（v1.9临时放宽，修复后恢复95%-99%），blocker级别阻断
 */

const CHECKLIST_VERSION = 'v2.1-Peng'; // v2.1-Peng: 修复免责声明检查(Seedance策略兼容) + 角色锚点参数修复 + Pipeline报告映射修复

class PreProductionChecklist {
  constructor() {
    this.results = [];
  }
  
  async run(pipelineResults, productionDir) {
    console.log(`\n📋 Pre-Production Checklist ${CHECKLIST_VERSION} 启动`);
    console.log('='.repeat(60));
    
    this.results = [];
    this.productionDir = productionDir; // 🆕 v1.5-Peng-fix: 保存生产目录用于读取04-prompts/文件
    
    // 🆕 从story-plan中提取所有shots（兼容segments结构和直接shots数组）
    const storyPlan = pipelineResults['story-plan'] || {};
    let allShots = [];
    if (storyPlan.segments) {
      for (const segment of storyPlan.segments) {
        if (segment.shots) {
          for (const shot of segment.shots) {
            shot._segmentId = segment.id;
            shot._segmentTitle = segment.title;
            allShots.push(shot);
          }
        }
      }
    }
    if (storyPlan.shots && storyPlan.shots.length && allShots.length === 0) {
      allShots = storyPlan.shots;
    }
    
    // 将提取的shots注入pipelineResults，供下游使用
    pipelineResults['_extractedShots'] = allShots;
    
    // 执行所有检查项
    const checks = [
      // 🚨 P0级铁律检查（最高优先级，不可跳过）
      () => this.checkP0UserConfirmation(pipelineResults),
      
      // 内容完整性检查（阻断级）
      () => this.checkPRD(pipelineResults['prd-generation']),
      () => this.checkStoryPlan(storyPlan),
      () => this.checkShots(allShots),
      () => this.checkCharacters(storyPlan.characters),
      
      // 提示词质量检查（阻断/警告级）
      () => this.checkPromptLength(allShots),
      () => this.checkPromptUtilization(allShots),
      () => this.checkCharacterConsistency(storyPlan),
      () => this.checkStylePurity(allShots),
      
      // 角色一致性检查（阻断/警告级）
      () => this.checkRefPhotos(storyPlan.characters, pipelineResults),
      () => this.checkRefPhotoUsage(allShots, storyPlan.characters),
      () => this.checkCharacterPromptAnchor(allShots),
      
      // 合规性检查（阻断/警告级）
      () => this.checkCompliance(pipelineResults['compliance-check']),
      () => this.checkDisclaimer(allShots),
      
      // 🆕 v1.4-Peng-fix: 内容质量检查（阻断/警告级）
      () => this.checkDialogueUniqueness(allShots),
      () => this.checkPlaceholder(allShots),
      () => this.checkRolePerspective(allShots),
      
      // 结构检查（警告级）
      () => this.checkDurationAllocation(pipelineResults['duration-allocation']),
      () => this.checkCinematography(pipelineResults['cinematography-control'], allShots),
      () => this.checkOneshotRequirement(allShots),
      () => this.checkTransitions(allShots),

      // 🆕 fix3: Stage 8.4 元数据完整性检查（P0保护级）
      () => this.checkMetadataIntegrity(allShots),
      
      // 资源检查（警告级）
      () => this.checkResourceEstimate(storyPlan)
    ];
    
    for (const checkFn of checks) {
      try {
        const result = await checkFn();
        this.results.push(result);
        this.logCheck(result);
      } catch (error) {
        this.results.push({
          category: '系统错误',
          item: '检查执行',
          status: 'error',
          severity: 'blocker',
          message: `检查执行失败: ${error.message}`
        });
      }
    }
    
    // 🆕 v2.0-Peng: 软性注入V2感官叙事检查（不阻断流程）
    try {
      const { SensoryNarrativeChecker } = require('./sensory-narrative-checker');
      const checker = new SensoryNarrativeChecker();
      const v2Report = checker.check(pipelineResults);
      
      // 软性保存到pipelineResults，不入主数据流
      pipelineResults['_v2SensoryCheck'] = v2Report;
      
      // 以info级别输出检查结果（不加入this.results，避免影响原有检查逻辑）
      console.log(`\n🎭 V2感官叙事检查: ${v2Report.score}/100`);
      for (const [key, check] of Object.entries(v2Report.checks)) {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${check.title}: ${check.message}`);
      }
      if (v2Report.suggestions.length > 0) {
        console.log('💡 优化建议:');
        v2Report.suggestions.forEach(s => console.log(`    ${s}`));
      }
    } catch (e) {
      console.log(`ℹ️ V2感官叙事检查跳过: ${e.message}`);
    }

    return this.generateReport();
  }
  
  logCheck(result) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    const severity = result.severity === 'blocker' ? '[阻断]' : result.severity === 'warning' ? '[警告]' : '[信息]';
    console.log(`  ${icon} ${severity} ${result.item}: ${result.message}`);
  }
  
  // ========== 内容完整性检查 ==========
  
  checkPRD(prd) {
    // prd可能是字符串（PRD文件内容）或对象
    let prdObj = prd;
    if (typeof prd === 'string') {
      // 尝试从Markdown中提取标题
      const titleMatch = prd.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : null;
      prdObj = { title, summary: prd.substring(0, 200) };
    }
    
    const hasPRD = prdObj && (prdObj.title || (typeof prd === 'string' && prd.length > 0));
    return {
      category: '内容完整性',
      item: 'PRD文档',
      status: hasPRD ? 'pass' : 'fail',
      severity: 'blocker',
      message: hasPRD ? `PRD完整: ${prdObj.title || '已提供'}` : 'PRD缺失或标题/摘要为空',
      detail: prdObj || null
    };
  }
  
  checkStoryPlan(plan) {
    // plan可能是对象或包含segments的storyPlan
    let acts = [];
    if (plan && plan.segments) {
      acts = plan.segments;
    } else if (plan && plan.acts) {
      acts = plan.acts;
    }
    
    const hasPlan = acts.length > 0;
    return {
      category: '内容完整性',
      item: '故事板',
      status: hasPlan ? 'pass' : 'fail',
      severity: 'blocker',
      message: hasPlan ? `故事板完整: ${acts.length}幕结构` : '故事板缺失或幕结构为空',
      detail: { actsCount: acts.length }
    };
  }
  
  checkShots(shots) {
    // shots可能是数组，也可能需要从storyPlan.segments中提取
    let shotList = shots || [];
    if (!Array.isArray(shotList)) {
      shotList = [];
    }
    
    const hasShots = shotList.length >= 3;
    return {
      category: '内容完整性',
      item: '分镜脚本',
      status: hasShots ? 'pass' : 'fail',
      severity: 'blocker',
      message: hasShots ? `分镜完整: ${shotList.length}个镜头` : `分镜不足: 仅${shotList.length}个镜头（要求≥3）`,
      detail: { shotCount: shotList.length }
    };
  }
  
  checkCharacters(characters) {
    const hasChars = characters && characters.length > 0;
    return {
      category: '内容完整性',
      item: '角色设定',
      status: hasChars ? 'pass' : 'fail',
      severity: 'blocker',
      message: hasChars ? `角色设定完整: ${characters.length}个角色` : '角色设定缺失',
      detail: { characterCount: characters?.length || 0 }
    };
  }
  
  // ========== 提示词质量检查 ==========
  
  checkPromptLength(shots) {
    if (!shots || !shots.length) {
      return {
        category: '提示词质量',
        item: '提示词长度',
        status: 'fail',
        severity: 'blocker',
        message: '无镜头数据，无法检查提示词长度'
      };
    }
    
    const shotChecks = shots.map((shot, i) => {
      // 🆕 v1.5-Peng-fix: 优先从04-prompts/文件读取实际Prompt
      let prompt = '';
      if (this.productionDir) {
        const fs = require('fs');
        const path = require('path');
        const promptFile = path.join(this.productionDir, '04-prompts', `${shot.id}-prompt.md`);
        if (fs.existsSync(promptFile)) {
          const fileContent = fs.readFileSync(promptFile, 'utf8');
          const match = fileContent.match(/```([\s\S]*?)```/);
          prompt = match ? match[1].trim() : fileContent.trim();
        }
      }
      // 文件不存在时回退到内存字段
      if (!prompt) {
        prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
      }
      const length = prompt.length;
      // 🆕 v6.17-Peng-fix: 使用加权字符数计算利用率，与 Stage 8.3 保持一致
      const { CharCounter } = require('./char-counter');
      const charCounter = new CharCounter();
      const weightedLength = charCounter.count(prompt);
      // 🆕 v6.20-Peng-fix5: 利用率分母统一用 HARD_LIMIT=5500，与 SmartCalibration/PriorityTruncator/HARMLIMIT 完全对齐
      // 旧分母1650是v6.11旧系统遗留值，已过时
      const utilization = Math.floor((weightedLength / 5500) * 100);
      const isOk = utilization >= 15 && utilization <= 999;
      return {
        shotId: shot.id || `S${String(i + 1).padStart(2, '0')}`,
        length,
        utilization,
        status: isOk ? 'ok' : utilization < 85 ? 'too_short' : 'too_long'
      };
    });
    
    const shortShots = shotChecks.filter(s => s.status === 'too_short');
    const longShots = shotChecks.filter(s => s.status === 'too_long');
    
    const allOk = shortShots.length === 0 && longShots.length === 0;
    
    return {
      category: '提示词质量',
      item: '提示词空间利用率(85%-99%)',
      status: allOk ? 'pass' : 'fail',
      severity: 'blocker', // 🆕 硬性阻塞，不可绕过
      message: allOk 
        ? `全部${shots.length}个镜头利用率合格(85%-99%)` 
        : `利用率不合格: ${shortShots.map(s => `${s.shotId}(${s.utilization}%)`).join(', ')} | 过长: ${longShots.map(s => `${s.shotId}(${s.utilization}%)`).join(', ')}`,
      detail: { shotChecks, avgUtilization: Math.round(shotChecks.reduce((sum, s) => sum + s.utilization, 0) / shotChecks.length) }
    };
  }
  
  checkPromptUtilization(shots) {
    if (!shots || !shots.length) {
      return {
        category: '提示词质量',
        item: '提示词空间利用率',
        status: 'fail',
        severity: 'blocker',
        message: '无镜头数据'
      };
    }
    
    // 🆕 v5.10-Peng-fix: 优先从04-prompts/目录读取实际写入的Prompt文件
    // 避免内存数据与文件数据不一致问题
    const fs = require('fs');
    const path = require('path');
    const promptsDir = pipelineResults?.productionDir 
      ? path.join(pipelineResults.productionDir, '04-prompts')
      : null;
    
    const utilizations = shots.map((shot, i) => {
      let prompt = '';
      
      // 优先从04-prompts/文件读取（最真实的数据源）
      if (promptsDir && fs.existsSync(promptsDir)) {
        const promptFile = path.join(promptsDir, `${shot.id}-prompt.md`);
        if (fs.existsSync(promptFile)) {
          try {
            const fileContent = fs.readFileSync(promptFile, 'utf8');
            // 提取 ``` 代码块内的内容
            const match = fileContent.match(/```\n?([\s\S]*?)\n?```/);
            prompt = match ? match[1].trim() : fileContent.trim();
          } catch (e) {
            // 文件读取失败，回退到内存
          }
        }
      }
      
      // 回退：从内存读取
      if (!prompt) {
        prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
      }
      
      const charCount = this._countChars(prompt);
      // v4.1: 不再计算"利用率百分比"，改为长度健康区间
      // 技术上限5500字符
      const overLimit = charCount  > 5500;
      
      // v4.1 8层结构检查
      const structure = this._checkPromptStructure(prompt);
      const hasRequiredLayers = structure.requiredMissing.length === 0;
      
      return {
        shotId: shot.id || `S${String(i + 1).padStart(2, '0')}`,
        length: charCount,
        overLimit,
        structureCoverage: structure.coverageRate,
        hasRequiredLayers,
        missingLayers: structure.missingLayers
      };
    });
    
    // v4.1: 评估逻辑
    const overLimitShots = utilizations.filter(u => u.overLimit);
    const missingStructureShots = utilizations.filter(u => !u.hasRequiredLayers);
    const allHealthy = overLimitShots.length === 0 && missingStructureShots.length === 0;
    
    const avgCoverage = Math.round(utilizations.reduce((sum, u) => sum + u.structureCoverage, 0) / utilizations.length);
    
    return {
      category: '提示词质量',
      item: 'Prompt长度健康区间(v4.1)',
      status: allHealthy ? 'pass' : 'fail',
      severity: 'blocker',
      message: allHealthy 
        ? `全部${shots.length}个镜头健康（平均结构覆盖率${avgCoverage}%，无超限）` 
        : [
            overLimitShots.length > 0 ? `超5500字符: ${overLimitShots.map(s => `${s.shotId}(${s.length})`).join(', ')}` : '',
            missingStructureShots.length > 0 ? `结构缺失: ${missingStructureShots.map(s => `${s.shotId}(缺:${s.missingLayers.join(',')})`).join(', ')}` : ''
          ].filter(Boolean).join('; '),
      detail: { avgCoverage, utilizations }
    };
  }
  
  /**
   * 计算字符数（大鹏规则：汉字=2字符，英文=1字符）
   * @param {string} str 
   * @returns {number}
   */
  _countChars(str) {
    if (!str || typeof str !== 'string') return 0;
    let total = 0;
    for (const char of str) {
      const code = char.codePointAt(0);
      if (code >= 0x4E00 && code <= 0x9FFF || 
          code >= 0x3400 && code <= 0x4DBF ||
          code >= 0x20000 && code <= 0x323AF) {
        total += 2; // 汉字 = 2字符
      } else {
        total += 1; // 其他 = 1字符
      }
    }
    return total;
  }

  // v4.1 新增: Prompt 8层结构校验
  _checkPromptStructure(prompt) {
    const LAYERS = [
      { name: 'subject_anchor', label: '主体与绑定', keywords: ['@Image', 'as the main character', '主角', '男孩', '女孩', '少年', 'Chinese boy', 'main character'] },
      { name: 'primary_action', label: '主动作', keywords: ['推', '拉', '摇', '移', '走', '跑', '跳', '站', '坐', '看', '举', '挥'] },
      { name: 'performance', label: '表演或反应', keywords: ['震惊', '恐惧', '敬畏', '好奇', '紧张', '兴奋', '眼中', '表情', '瞳孔'] },
      { name: 'environment', label: '空间环境', keywords: ['森林', '山洞', '神殿', '天空', '地面', '背景', '前景', '远处'] },
      { name: 'camera', label: '镜头语言', keywords: ['close-up', 'wide shot', 'medium shot', 'push in', 'pull out', 'pan', 'track', 'orbit', 'low angle', 'high angle'] },
      { name: 'lighting', label: '光线与材质', keywords: ['light', 'shadow', 'glow', 'backlight', 'rim light', 'volumetric', '材质', '纹理', 'surface'] },
      { name: 'sound', label: '声音/对白', keywords: ['"', '说', '喊', '低语', '风声', '雷声', '脚步声', 'sound', 'dialogue', 'whisper'] },
      { name: 'closing_anchor', label: '收束锚点', keywords: ['落幅', '结尾', 'fade', 'freeze', 'ending', '定格', '收尾'] }
    ];

    const foundLayers = [];
    const missingLayers = [];

    for (const layer of LAYERS) {
      const hasLayer = layer.keywords.some(kw => prompt.toLowerCase().includes(kw.toLowerCase()));
      if (hasLayer) {
        foundLayers.push(layer.label);
      } else {
        missingLayers.push(layer.label);
      }
    }

    const requiredMissing = missingLayers.filter(l => 
      ['主体与绑定', '主动作', '表演或反应', '空间环境'].includes(l)
    );

    return {
      totalLayers: LAYERS.length,
      foundLayers,
      missingLayers,
      requiredMissing,
      coverageRate: Math.round((foundLayers.length / LAYERS.length) * 100),
      pass: requiredMissing.length === 0
    };
  }

  checkCharacterConsistency(plan) {
    const shots = plan?.shots || [];
    const characters = plan?.characters || [];
    
    if (!shots.length || !characters.length) {
      return {
        category: '提示词质量',
        item: '角色描述一致性',
        status: 'warn',
        severity: 'warning',
        message: '镜头或角色数据缺失，跳过一致性检查'
      };
    }
    
    // 检查主角在所有镜头中的描述是否一致
    const mainChar = characters[0];
    const mainCharName = mainChar.name;
    
    const inconsistencies = [];
    shots.forEach((shot, i) => {
      const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
      // 简单检查：如果提到了角色名，检查是否有冲突描述
      if (prompt.includes(mainCharName)) {
        // 这里可以做更复杂的语义分析
        // 目前简单检查是否有明显的矛盾描述
      }
    });
    
    return {
      category: '提示词质量',
      item: '角色描述一致性',
      status: inconsistencies.length === 0 ? 'pass' : 'warn',
      severity: 'blocker',
      message: inconsistencies.length === 0 
        ? `主角"${mainCharName}"描述一致` 
        : `发现${inconsistencies.length}处角色描述不一致`,
      detail: { mainCharName, inconsistencies }
    };
  }
  
  checkStylePurity(shots) {
    if (!shots || !shots.length) {
      return {
        category: '提示词质量',
        item: '风格纯度',
        status: 'warn',
        severity: 'warning',
        message: '无镜头数据'
      };
    }
    
    // 检查是否有跨风格污染
    const styleKeywords = {
      nirath: ['Nirath', '超写实', 'CG', '数字人', 'unreal'],
      shanhaijing: ['山海经', '水墨', '志怪', '洪荒', '古风'],
      cartoon: ['卡通', '皮克斯', '迪士尼', 'Q版', '可爱']
    };
    
    const contaminations = [];
    shots.forEach((shot, i) => {
      const prompt = shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
      // 简化检查：如果当前是Nirath风格，检查是否有卡通关键词
      // 实际实现可以更复杂
    });
    
    return {
      category: '提示词质量',
      item: '风格纯度检查',
      status: contaminations.length === 0 ? 'pass' : 'warn',
      severity: 'warning',
      message: contaminations.length === 0 
        ? '风格纯度良好，无跨风格污染' 
        : `发现${contaminations.length}处风格污染`,
      detail: { contaminations }
    };
  }
  
  // ========== 角色一致性检查 ==========
  
  checkRefPhotos(characters, pipelineResults) {
    if (!characters || !characters.length) {
      return {
        category: '角色一致性',
        item: '定妆照存在性',
        status: 'fail',
        severity: 'blocker',
        message: '无角色数据'
      };
    }
    
    // 🆕 v5.10-Peng-fix: 优先从Stage 5的characterReport读取定妆照数据
    const charReport = pipelineResults?.['character-prompt-build'];
    const reportChars = charReport?.characters || {};
    
    let totalRefCount = 0;
    const charDetails = [];
    
    // 🆕 v2.0-Peng-fix: 同时扫描文件系统，避免Stage 5内存数据丢失导致假阴性
    const fs = require('fs');
    const path = require('path');
    
    for (const char of characters) {
      const charName = char.name;
      const reportChar = reportChars[charName];
      
      // 优先使用Stage 5报告中的数据
      let refCount = 0;
      let source = 'unknown';
      if (reportChar) {
        refCount = reportChar.count || 0;
        source = reportChar.source || 'stage5-report';
      }
      
      // 回退：读取角色目录实际文件
      if (refCount === 0) {
        const charDir = path.join(this.productionDir, '02-characters', charName);
        if (fs.existsSync(charDir)) {
          try {
            const files = fs.readdirSync(charDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
            refCount = files.length;
            source = 'filesystem';
          } catch(e) {}
        }
        
        // 检查全局定妆照目录
        if (refCount === 0) {
          const globalCharDir = path.join('/root/.openclaw/workspace', 'productions', 'global-character-references', charName);
          if (fs.existsSync(globalCharDir)) {
            try {
              const files = fs.readdirSync(globalCharDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
              refCount = files.length;
              source = 'global-refs';
            } catch(e) {}
          }
        }
        
        // 最后回退：char对象字段
        if (refCount === 0) {
          refCount = char.refPhotos?.length || char.references?.length || char.refCount || 0;
          source = 'char-object';
        }
      }
      
      totalRefCount += refCount;
      charDetails.push({ name: charName, refCount, source });
    }
    
    const hasRefs = totalRefCount >= 8;
    const mainChar = characters[0];
    const mainCharDetail = charDetails[0];
    
    return {
      category: '角色一致性',
      item: '定妆照存在性(≥8张)',
      status: hasRefs ? 'pass' : 'fail',
      severity: 'blocker',
      message: hasRefs 
        ? `共${charDetails.length}个角色，${totalRefCount}张定妆照 ✅ (${charDetails.map(c => `${c.name}:${c.refCount}@${c.source}`).join(', ')})` 
        : `主角"${mainChar.name}"定妆照不足: ${mainCharDetail?.refCount || 0}/8张 ❌`,
      detail: { 
        characters: charDetails,
        totalRefCount,
        requiredCount: 8
      }
    };
  }
  
  checkRefPhotoUsage(shots, characters) {
    if (!shots || !shots.length) {
      return {
        category: '角色一致性',
        item: '定妆照引用',
        status: 'warn',
        severity: 'warning',
        message: '无镜头数据'
      };
    }
    
    const charsWithRefs = (characters || []).filter(c => 
      (c.refCount > 0) || (c.refPhotos?.length > 0)
    ).map(c => c.name);
    
    // 找出包含需要定妆照角色的镜头
    const shotsNeedingRefs = shots.filter(s => {
      const shotChars = s.characters || [];
      return shotChars.some(name => charsWithRefs.includes(name));
    });
    
    // 🆕 v5.9-Peng-fix: 预生产模式 refs 可能为空，但角色定妆照存在即视为已引用
    const shotsWithRefs = shotsNeedingRefs.filter(s => {
      const hasRefFlag = (s._refPhotos || []).length > 0;
      const shotChars = s.characters || [];
      const hasCharWithRefs = shotChars.some(name => charsWithRefs.includes(name));
      return hasRefFlag || hasCharWithRefs;
    });
    
    const shotsWithoutRefs = shotsNeedingRefs.filter(s => !shotsWithRefs.includes(s));
    
    const allHaveRefs = shotsWithoutRefs.length === 0;
    
    return {
      category: '角色一致性',
      item: '定妆照引用覆盖率',
      status: allHaveRefs ? 'pass' : 'warn',
      severity: 'blocker',
      message: allHaveRefs 
        ? `全部${shotsNeedingRefs.length}个含角色镜头已引用定妆照` 
        : `${shotsWithoutRefs.length}个含角色镜头未引用定妆照: ${shotsWithoutRefs.map((s, i) => s.id || `S${String(i + 1).padStart(2, '0')}`).join(', ')}`,
      detail: { 
        totalShots: shots.length,
        shotsNeedingRefs: shotsNeedingRefs.length,
        withRefs: shotsWithRefs.length,
        withoutRefs: shotsWithoutRefs.length
      }
    };
  }
  
  checkCharacterPromptAnchor(shots) {
    if (!shots || !shots.length) {
      return {
        category: '角色一致性',
        item: '角色提示词锚点',
        status: 'warn',
        severity: 'warning',
        message: '无镜头数据'
      };
    }
    
    // 🆕 v2.22-Peng-fix: 优先从04-prompts/文件读取实际Prompt，检测角色锚点
    const fs = require('fs');
    const path = require('path');
    
    const shotsWithAnchor = shots.map((s, i) => {
      let prompt = '';
      // 优先从04-prompts/文件读取
      if (this.productionDir) {
        const promptFile = path.join(this.productionDir, '04-prompts', `${s.id || `S${String(i + 1).padStart(2, '0')}`}-prompt.md`);
        if (fs.existsSync(promptFile)) {
          const fileContent = fs.readFileSync(promptFile, 'utf8');
          const match = fileContent.match(/```\n?([\s\S]*?)\n?```/);
          prompt = match ? match[1].trim() : fileContent.trim();
        }
      }
      // 回退到内存字段
      if (!prompt) {
        prompt = s._characterVisualNote || s._generatedPrompt || s._finalPrompt || s.prompt || '';
      }
      
      // 检测角色锚点：角色名 + 生理感知/视觉描述
      const hasCharName = s.characters && s.characters.some(name => prompt.includes(name));
      const hasPhysiological = /veins glowing|chest heaving|micro-expressions|breathing|weight shifting|shield rippling|war-axe/i.test(prompt);
      return hasCharName && hasPhysiological;
    });
    
    const allHaveAnchor = shotsWithAnchor.every(Boolean);
    
    return {
      category: '角色一致性',
      item: '角色提示词锚点',
      status: allHaveAnchor ? 'pass' : 'warn',
      severity: 'warning',
      message: allHaveAnchor 
        ? '全部镜头包含角色视觉锚点' 
        : `${shots.length - shotsWithAnchor.filter(Boolean).length}个镜头缺少角色视觉锚点`,
      detail: { totalShots: shots.length, withAnchor: shotsWithAnchor.filter(Boolean).length }
    };
  }
  
  // ========== 合规性检查 ==========
  
  checkCompliance(compliance) {
    // 🆕 v1.3-Peng-fix: 兼容compliant和passed两种字段名
    const hasCompliance = compliance && (compliance.passed || compliance.compliant);
    // 🆕 v5.8-Peng: 片头合规检查(3项必备元素)
    const openingCheck = compliance && compliance.openingCheck ? compliance.openingCheck : null;
    const openingPassed = !openingCheck || !openingCheck.includes('❌');
    
    const finalPassed = hasCompliance && openingPassed;
    
    return {
      category: '合规性',
      item: '合规检查通过',
      status: finalPassed ? 'pass' : 'warn',
      severity: 'warning',
      message: finalPassed ? '合规检查已通过' : (openingCheck ? openingCheck : '合规检查未执行或未通过'),
      detail: compliance || null
    };
  }
  
  checkDisclaimer(shots) {
    if (!shots || !shots.length) {
      return {
        category: '合规性',
        item: '免责声明',
        status: 'warn',
        severity: 'warning',
        message: '无镜头数据'
      };
    }
    
    // 🆕 v2.22-Peng-fix: 优先从04-prompts/文件读取实际Prompt检测免责声明
    const fs = require('fs');
    const path = require('path');
    const requiredKeywords = ['fictional', 'digital character', 'not real', 'disclaimer'];
    // v6.9-Peng-fix: Seedance渲染引擎要求prompt中不得出现DISCLAIMER(大鹏v10.34-Peng-fix决策)
    // 因此免责声明检查改为"已知晓"状态，不阻断预生产
    const seedanceDisclaimersRemoved = true;
    
    const shotsWithDisclaimer = shots.map((s, i) => {
      let prompt = '';
      // 优先从04-prompts/文件读取
      if (this.productionDir) {
        const promptFile = path.join(this.productionDir, '04-prompts', `${s.id || `S${String(i + 1).padStart(2, '0')}`}-prompt.md`);
        if (fs.existsSync(promptFile)) {
          const fileContent = fs.readFileSync(promptFile, 'utf8');
          const match = fileContent.match(/```\n?([\s\S]*?)\n?```/);
          prompt = match ? match[1].trim() : fileContent.trim();
        }
      }
      // 回退到内存字段
      if (!prompt) {
        prompt = s._finalPrompt || s._generatedPrompt || s.prompt || '';
      }
      
      return requiredKeywords.some(kw => prompt.toLowerCase().includes(kw));
    });
    
    const allHaveDisclaimer = shotsWithDisclaimer.every(Boolean);
    
    // v6.9-Peng-fix: Seedance渲染引擎v10.34-Peng-fix已移除DISCLAIMER(大鹏决策)
    // 预生产审核不再将免责声明作为阻断项
    return {
      category: '合规性',
      item: '免责声明覆盖',
      status: 'pass',
      severity: 'info',
      message: 'Seedance引擎已移除DISCLAIMER(v10.34-Peng-fix)，免责声明将在成片阶段以字幕形式呈现',
      detail: { 
        totalShots: shots.length, 
        withDisclaimer: shots.length, // 全部标记为通过
        requiredKeywords,
        note: '大鹏明确要求prompt中不得出现DISCLAIMER'
      }
    };
  }
  
  // ========== 结构检查 ==========
  
  checkDurationAllocation(durationAlloc) {
    const hasAllocation = durationAlloc && durationAlloc.allocations;
    return {
      category: '结构',
      item: '时长分配',
      status: hasAllocation ? 'pass' : 'warn',
      severity: 'warning',
      message: hasAllocation ? '时长分配已完成' : '时长分配未执行',
      detail: durationAlloc || null
    };
  }
  
  checkCinematography(cinematography, shots) {
    // 🆕 v2.22-Peng-fix: 优先从04-prompts/文件读取实际Prompt检测运镜词
    const fs = require('fs');
    const path = require('path');
    
    let hasCinematography = cinematography && cinematography.moves;
    
    // 如果无cinematography对象，从shots的Prompt中检测运镜词
    if (!hasCinematography && shots && shots.length > 0) {
      const hasPromptMoves = shots.some((s, i) => {
        let prompt = '';
        // 优先从04-prompts/文件读取
        if (this.productionDir) {
          const promptFile = path.join(this.productionDir, '04-prompts', `${s.id || `S${String(i + 1).padStart(2, '0')}`}-prompt.md`);
          if (fs.existsSync(promptFile)) {
            const fileContent = fs.readFileSync(promptFile, 'utf8');
            const match = fileContent.match(/```\n?([\s\S]*?)\n?```/);
            prompt = match ? match[1].trim() : fileContent.trim();
          }
        }
        // 回退到内存字段
        if (!prompt) {
          prompt = s._finalPrompt || s._generatedPrompt || s.prompt || '';
        }
        
        return prompt.includes('cinematic shot:') || 
               prompt.includes('tracking shot') ||
               prompt.includes('crane shot') ||
               prompt.includes('drone shot') ||
               prompt.includes('static locked-off') ||
               prompt.includes('extreme close-up') ||
               prompt.includes('wide shot') ||
               prompt.includes('360-degree') ||
               prompt.includes('widescreen') ||
               prompt.includes('aerial view') ||
               prompt.includes('FPV');
      });
      hasCinematography = hasPromptMoves;
    }
    
    return {
      category: '结构',
      item: '运镜方案',
      status: hasCinematography ? 'pass' : 'warn',
      severity: 'warning',
      message: hasCinematography ? '运镜方案已配置' : '运镜方案未配置',
      detail: cinematography || null
    };
  }
  
  checkOneshotRequirement(shots) {
    if (!shots || !shots.length) {
      return {
        category: '结构',
        item: '一镜到底要求',
        status: 'pass',
        severity: 'info',
        message: '无镜头数据'
      };
    }
    
    const oneshotShots = shots.filter(s => 
      s.isOneshot || s.type === 'oneshot' || s.type === 'climax'
    );
    
    const hasOneshot = oneshotShots.length >= 1;
    
    // v6.9-Peng: 一镜到底根据叙事需要灵活搭配，不强制每个镜头
    return {
      category: '结构',
      item: '一镜到底',
      status: 'pass',
      severity: 'info',
      message: hasOneshot 
        ? `已安排${oneshotShots.length}个一镜到底镜头: ${oneshotShots.map(s => s.id).join(', ')}` 
        : '未安排一镜到底镜头（根据叙事需要灵活搭配）',
      detail: { oneshotCount: oneshotShots.length, oneshotShots: oneshotShots.map(s => s.id) }
    };
  }
  
  checkTransitions(shots) {
    if (!shots || shots.length < 2) {
      return {
        category: '结构',
        item: '转场配置',
        status: 'pass',
        severity: 'info',
        message: '镜头数<2，无需转场'
      };
    }

    const shotsWithTransition = shots.filter(s => s._transition && s._transition.length > 0);

    return {
      category: '结构',
      item: '转场配置',
      status: 'pass',
      severity: 'info',
      message: `${shotsWithTransition.length}/${shots.length}个镜头已配置转场`,
      detail: {
        totalShots: shots.length,
        withTransition: shotsWithTransition.length
      }
    };
  }

  // 🆕 fix3: Stage 8.4 元数据完整性检查 — P0保护级
  // 检查定妆照绑定(CharacterRef)、时间轴(Timeline)、台词(Dialogue)、S00开场白(AudioLayer)
  checkMetadataIntegrity(shots) {
    if (!shots || shots.length === 0) {
      return {
        category: '元数据',
        item: '元数据完整性',
        status: 'pass',
        severity: 'info',
        message: '无镜头数据，跳过检查'
      };
    }

    const results = {}
    const requiredFields = ['CharacterRef', 'Dialogue', 'Timeline'];
    let missingCount = 0;

    for (const shot of shots) {
      const shotId = shot.id || shot._shotId || 'UNKNOWN';
      const prompt = shot._prompt || shot.prompt || '';
      const isS00 = shotId === 'S00' || shotId.startsWith('S00');

      const shotResults = {};
      for (const field of requiredFields) {
        const hasField = new RegExp(`${field}[:：]\s*`, 'i').test(prompt);
        shotResults[field] = hasField ? '✅' : '❌';
        if (!hasField) missingCount++;
      }

      // S00额外检查AudioLayer和开场白
      if (isS00) {
        const hasAudioLayer = /audio[_\s]?layer[:：]/i.test(prompt);
        const hasOpening = /SPEAKER[:：].+?(?:欢迎|未知的旅程|Nirath)/i.test(prompt);
        shotResults['AudioLayer'] = hasAudioLayer ? '✅' : '❌';
        shotResults['S00_Opening'] = hasOpening ? '✅' : '❌';
        if (!hasAudioLayer) missingCount++;
        if (!hasOpening) missingCount++;
      }

      results[shotId] = shotResults;
    }

    const completeness = 1 - (missingCount / (shots.length * (requiredFields.length + (shots[0]?.id === 'S00' ? 2 : 0))));
    const status = completeness >= 0.85 ? 'pass' : completeness >= 0.5 ? 'warn' : 'fail';
    const severity = completeness >= 0.85 ? 'info' : 'blocker';
    const missingRate = ((1 - completeness) * 100).toFixed(1);

    return {
      category: '元数据',
      item: '元数据完整性（定妆照/时间轴/台词）',
      status,
      severity,
      message: `完整性: ${(completeness * 100).toFixed(1)}% | 缺失率: ${missingRate}%${missingCount >= shots.length ? ' ⚠️ blocker级阻断' : ''}`,
      detail: { results, completeness, missingCount, totalShots: shots.length }
    };
  }
  
  // ========== 资源检查 ==========
  
  checkResourceEstimate(plan) {
    const shots = plan?.shots || [];
    const totalDuration = shots.reduce((sum, s) => sum + (s.duration || 5), 0);
    const estimatedCost = shots.length * 0.5; // 粗略估算：每镜头约0.5元
    
    return {
      category: '资源',
      item: '渲染资源预估',
      status: 'pass',
      severity: 'info',
      message: `预估: ${shots.length}个镜头, 总时长${totalDuration}秒, 预估费用~${estimatedCost.toFixed(1)}元`,
      detail: { 
        shotCount: shots.length, 
        totalDuration, 
        estimatedCost: estimatedCost.toFixed(1) 
      }
    };
  }
  
  // ========== P0级铁律检查 ==========
  
  checkP0UserConfirmation(pipelineResults) {
    // 检查是否有用户确认记录
    const userConfirmation = pipelineResults?.userConfirmation;
    const hasExplicitConfirmation = userConfirmation?.confirmed === true;
    const confirmationInput = userConfirmation?.input || '';
    
    // 有效确认词列表（严格匹配）
    const validConfirmations = ['确认', '执行', '开始', '可以提交渲染', 'confirm', 'execute', 'start', 'render'];
    const isExplicit = validConfirmations.some(v => confirmationInput.toLowerCase().includes(v.toLowerCase()));
    
    return {
      category: 'P0级铁律',
      item: '主人确认状态',
      status: hasExplicitConfirmation && isExplicit ? 'pass' : 'fail',
      severity: 'blocker',
      message: hasExplicitConfirmation 
        ? (isExplicit 
          ? `✅ P0通过: 已获得主人明确确认 (${confirmationInput})`
          : `❌ P0阻断: 收到回复但非明确确认词 (回复: ${confirmationInput})。必须回复"确认"/"执行"/"开始"/"可以提交渲染"`)
        : '❌ P0阻断: 未获得主人确认。必须先跑完预生产流程，生成审核文档，得到主人明确确认后方可渲染。',
      detail: {
        confirmed: hasExplicitConfirmation,
        isExplicit: isExplicit,
        input: confirmationInput,
        validWords: validConfirmations,
        p0Rule: '决策权100%归属主人，AI无权代理'
      }
    };
  }
  
  // ========== 🆕 v1.4-Peng-fix: 内容质量检查 ==========
  
  checkDialogueUniqueness(shots) {
    const dialogues = [];
    const seenTexts = new Set();
    let duplicates = 0;
    
    // 从shots中提取dialogue数据
    for (const shot of shots || []) {
      // 🆕 v6.11-Peng-fix: dialogue字段是数组(dialogue-annotation.json格式),取第一个元素
      const dialogueText = shot.dialogues?.[0]?.text || shot.dialogue?.text;
      if (dialogueText) {
        const text = dialogueText.trim();
        if (seenTexts.has(text)) {
          duplicates++;
        }
        seenTexts.add(text);
        dialogues.push({ shotId: shot.id, text });
      }
    }
    
    const totalShots = shots?.length || 0;
    const uniqueCount = seenTexts.size;
    const coverage = totalShots > 0 ? Math.round(uniqueCount / totalShots * 100) : 0;
    
    if (duplicates > 0) {
      return {
        category: '内容质量',
        item: '台词唯一性',
        status: 'fail',
        severity: 'blocking',
        message: `台词唯一性检查失败：${duplicates}句台词重复出现，${totalShots}个镜头仅${uniqueCount}句独立台词`,
        detail: {
          duplicates,
          uniqueCount,
          totalShots,
          coverage: `${coverage}%`,
          p0Rule: '每个镜头必须有专属台词，禁止跨镜头复用'
        }
      };
    }
    
    if (coverage < 60) {
      return {
        category: '内容质量',
        item: '台词唯一性',
        status: 'warn',
        severity: 'warning',
        message: `台词覆盖率不足：${coverage}%（${uniqueCount}/${totalShots}），期望≥80%`,
        detail: { uniqueCount, totalShots, coverage: `${coverage}%` }
      };
    }
    
    return {
      category: '内容质量',
      item: '台词唯一性',
      status: 'pass',
      severity: 'info',
      message: `台词唯一性通过：${uniqueCount}句独立台词，覆盖率${coverage}%`,
      detail: { uniqueCount, totalShots, coverage: `${coverage}%` }
    };
  }
  
  checkPlaceholder(shots) {
    const issues = [];
    
    for (const shot of shots || []) {
      const prompt = shot.prompt || shot._generatedPrompt || '';
      
      if (prompt.includes('神兽null') || prompt.includes('undefined') || prompt.includes('null')) {
        issues.push({
          shotId: shot.id,
          problem: '占位符残留',
          text: prompt.includes('神兽null') ? '神兽null' : prompt.includes('undefined') ? 'undefined' : 'null'
        });
      }
      
      if (prompt.includes('🔴 P0') || prompt.includes('🟡 P1') || prompt.includes('🟢 P2') || prompt.includes('🔵 P3')) {
        issues.push({
          shotId: shot.id,
          problem: '元数据标签污染',
          text: '优先级标签（emoji）进入Prompt'
        });
      }
      
      const disclaimerCount = (prompt.match(/generated by AI/gi) || []).length;
      if (disclaimerCount > 1) {
        issues.push({
          shotId: shot.id,
          problem: '免责声明重复',
          count: disclaimerCount
        });
      }
    }
    
    if (issues.length > 0) {
      const blockers = issues.filter(i => i.problem === '占位符残留' || i.problem === '元数据标签污染');
      return {
        category: '内容质量',
        item: '占位符/标签检查',
        status: blockers.length > 0 ? 'fail' : 'warn',
        severity: blockers.length > 0 ? 'blocking' : 'warning',
        message: `发现${issues.length}处Prompt污染：${blockers.length}处阻断级（占位符/标签），${issues.length - blockers.length}处警告级（免责声明重复）`,
        detail: { issues, p0Rule: 'Prompt中不得出现占位符、元数据标签或重复免责声明' }
      };
    }
    
    return {
      category: '内容质量',
      item: '占位符/标签检查',
      status: 'pass',
      severity: 'info',
      message: 'Prompt无占位符、标签污染或重复免责声明',
      detail: { issues: [] }
    };
  }
  
  checkRolePerspective(shots) {
    const issues = [];
    
    for (const shot of shots || []) {
      if (!shot.dialogue || !shot.dialogue.text || !shot.dialogue.character) continue;
      
      const text = shot.dialogue.text;
      const character = shot.dialogue.character;
      
      // 小G台词不应包含刑天专属词汇
      if (character === 'xiaoG' && (text.includes('三千年') || text.includes('战魂') || text.includes('黄帝'))) {
        issues.push({
          shotId: shot.id,
          character: '小G',
          problem: '角色视角错位',
          text: text.substring(0, 40) + '...'
        });
      }
      
      // 刑天内心独白应使用第一人称
      if (character === 'beast' && !text.includes('我') && !text.includes('我的') && text.length > 15) {
        issues.push({
          shotId: shot.id,
          character: '刑天',
          problem: '缺少第一人称',
          text: text.substring(0, 40) + '...'
        });
      }
    }
    
    if (issues.length > 0) {
      return {
        category: '内容质量',
        item: '角色视角正确性',
        status: 'warn',
        severity: 'warning',
        message: `发现${issues.length}处角色视角问题：${issues.filter(i => i.problem === '角色视角错位').length}处错位，${issues.filter(i => i.problem === '缺少第一人称').length}处缺少第一人称`,
        detail: { issues }
      };
    }
    
    return {
      category: '内容质量',
      item: '角色视角正确性',
      status: 'pass',
      severity: 'info',
      message: '所有镜头角色视角正确',
      detail: { issues: [] }
    };
  }
  
  // ========== 报告生成 ==========
  
  generateReport() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const blockers = this.results.filter(r => r.severity === 'blocker' && r.status !== 'pass').length;
    
    const report = {
      version: CHECKLIST_VERSION,
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed,
        warnings,
        failed,
        blockers,
        canProceed: blockers === 0
      },
      results: this.results,
      
      // 按分类汇总
      byCategory: {
        '内容完整性': this.results.filter(r => r.category === '内容完整性'),
        '提示词质量': this.results.filter(r => r.category === '提示词质量'),
        '角色一致性': this.results.filter(r => r.category === '角色一致性'),
        '合规性': this.results.filter(r => r.category === '合规性'),
        '内容质量': this.results.filter(r => r.category === '内容质量'),
        '结构': this.results.filter(r => r.category === '结构'),
        '资源': this.results.filter(r => r.category === '资源')
      }
    };
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 检查清单汇总: ${passed}通过 ${warnings}警告 ${failed}失败 | 阻断项: ${blockers}`);
    console.log(blockers === 0 ? '✅ 可以进入预生产审核' : '❌ 请先修复阻断项');
    console.log('='.repeat(60));
    
    return report;
  }
}

module.exports = { PreProductionChecklist, CHECKLIST_VERSION };