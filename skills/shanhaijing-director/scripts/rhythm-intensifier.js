/**
 * Rhythm Intensifier v1.3-Peng — 节奏强化器
 * 
 * v1.3-Peng-fix (2026-05-25):
 * + 🆕 resolution类型过滤: 收尾镜头不注入异兽动作模板
 * + 修复: 收尾镜头被注入"小G逃跑"破坏史诗感
 * 
 * v1.2-Peng-fix (2026-05-25):
 * + 🆕 镜头类型过滤: opening_title/establishing/closeup/reveal 不注入异兽动作模板
 * + 修复: 片头镜头被污染成动作戏、航拍镜头被注入"小G逃跑"、面部特写出现防御动作
 * 
 * v1.1-Peng: ...
 * v1.0-Peng: 初始版本
 * 
 * 核心目标：将剧集节奏提升到短剧/抖音级别
 * - 60秒内持续兴奋，无平淡段
 * - 每镜头信息密度最大化
 * - 强制尺度跳跃 + 强制转场冲击
 * - 3秒钩子 + 5秒转折规则
 * 
 * 集成点：导演管线 Stage 8.2（在运镜控制之后）
 * 
 * 工作原理：
 * 1. 信息密度检查 — 每个镜头必须有≥3个元素（剧情+视觉+情绪）
 * 2. 节奏平淡检测 — 连续低冲击段自动注入刺激元素
 * 3. 强制尺度跳跃 — 每3个镜头必须有1次≥5级尺度跳跃
 * 4. 情绪波浪设计 — 冲击曲线必须是波浪形（高低交替），不能平坦
 * 5. 短剧快剪模式 — 比action更激进的时长压缩
 */

'use strict';

// ============ 信息密度标准 ============
const DENSITY_STANDARDS = {
  // 每个镜头至少包含的元素类型数
  minElementsPerShot: 3,
  
  // 元素类型定义
  elementTypes: {
    'plot': '剧情推进（发生了什么）',
    'visual': '视觉奇观（看到什么震撼画面）',
    'emotion': '情绪触发（感受到什么）',
    'action': '动作元素（谁在动，怎么动）',
    'scale': '尺度对比（大小对比带来的冲击）',
    'transition': '转场能量（切换的冲击力）',
    'sound_hint': '声音暗示（虽然Seedance无声，但Prompt中可暗示）'
  },
  
  // 密度等级
  levels: {
    'sparse': { min: 0, max: 1, label: '稀疏', action: '必须增强' },
    'thin': { min: 2, max: 2, label: '单薄', action: '建议增强' },
    'adequate': { min: 3, max: 4, label: '达标', action: '保持' },
    'rich': { min: 5, max: 7, label: '丰富', action: '优秀' }
  }
};

// ============ 节奏强化规则 ============
const INTENSIFICATION_RULES = {
  // 规则1: 平淡段检测 — 连续N个低冲击镜头 = 平淡段
  flatSegmentThreshold: 3,  // 连续3个低冲击
  flatSegmentImpactMax: 4,   // 低于4分算低冲击
  
  // 规则2: 强制尺度跳跃 — 每N个镜头必须有1次大跳跃
  mandatoryScaleJumpInterval: 3,  // 每3个镜头
  mandatoryScaleJumpMin: 4,       // 至少4级尺度差
  
  // 规则3: 情绪波浪 — 冲击曲线必须起伏
  waveMinAmplitude: 3,  // 起伏幅度至少3分
  maxFlatStreak: 2,     // 最多连续2个同水平冲击
  
  // 规则4: 3秒钩子 — 前3秒必须有强吸引
  hookRequirement: {
    first3SecondsMustHave: 'strong_visual_hook',  // 强烈视觉钩子
    impactThreshold: 7  // 前3秒的镜头冲击必须≥7
  },
  
  // 规则5: 5秒转折 — 每5秒必须有转折
  turnInterval: 5,  // 每5秒
  turnTypes: ['scale_jump', 'emotion_shift', 'action_peak', 'reveal']
};

// ============ 短剧快剪模式 ============
const SHORT_DRAMA_PROFILE = {
  name: '短剧快剪',
  basePacing: 0.50,        // 比action(0.85)快40%
  tensionBoost: 1.5,       // 高张力时更激进延长
  lowTensionCompress: 0.5, // 低张力时更激进压缩
  minShot: 1.5,            // 最短1.5秒
  maxShot: 8,              // 最长8秒（绝不允许长镜头）
  oneshotMin: 5,           // 一镜到底最短5秒
  oneshotMax: 8,           // 一镜到底最长8秒
  climaxMin: 4,            // 高潮最短4秒
  climaxMax: 8,            // 高潮最长8秒
  
  // 强制信息密度
  densityRequirement: 3,     // 每个镜头至少3个元素
  
  // 转场偏好
  preferredTransitions: ['hard_cut', 'whip_pan_transition', 'smash_cut'],
  bannedTransitions: ['fade_in', 'fade_out', 'dissolve'],  // 禁止慢转场
  
  // 尺度跳跃偏好
  preferredScaleJumps: ['extreme_wide_to_close_up', 'close_up_to_extreme_wide'],
  
  // 情绪曲线设计
  emotionCurvePattern: 'wave_ascending',  // 波浪上升：低→高→低→更高
  
  // 节奏指令
  rhythmCommands: {
    'no_static_longer_than_3s': true,  // 静止镜头不超过3秒
    'force_scale_jump_every_2_shots': true,  // 每2镜头强制尺度跳跃
    'alternate_energy': true,  // 高低能量交替
    'never_two_similar_shots': true  // 绝不允许两个相似镜头连续
  }
};

// ============ 信息密度分析器 ============
class DensityAnalyzer {
  constructor(options = {}) {
    this.minElements = options.minElements || DENSITY_STANDARDS.minElementsPerShot;
    this.debug = options.debug || false;
  }

  /**
   * 分析单个镜头的信息密度
   */
  analyzeShot(shot) {
    const elements = [];
    const desc = (shot.description || '').toLowerCase();
    const camera = typeof shot.camera === 'string' ? shot.camera.toLowerCase() : ((shot.camera?.move || '') + ' ' + (shot.camera?.scale || '')).toLowerCase();
    const type = shot.type || 'normal';
    
    // 检查剧情元素
    if (type === 'climax' || type === 'action' || type === 'reveal' || 
        desc.includes('觉醒') || desc.includes('爆发') || desc.includes('发现')) {
      elements.push('plot');
    }
    
    // 检查视觉奇观
    if (desc.includes('巨大') || desc.includes('震撼') || desc.includes('壮观') ||
        desc.includes('光芒') || desc.includes('爆发') || desc.includes('变身') ||
        camera.includes('航拍') || camera.includes('俯冲') || camera.includes('环绕')) {
      elements.push('visual');
    }
    
    // 检查情绪触发
    if (type === 'emotional_peak' || type === 'climax' ||
        desc.includes('恐惧') || desc.includes('敬畏') || desc.includes('震撼') ||
        desc.includes('兴奋') || desc.includes('紧张')) {
      elements.push('emotion');
    }
    
    // 检查动作元素
    if (type === 'action' || desc.includes('奔跑') || desc.includes('飞跃') ||
        desc.includes('攻击') || desc.includes('追逐') || desc.includes('震动') ||
        camera.includes('跟拍') || camera.includes('手持')) {
      elements.push('action');
    }
    
    // 检查尺度对比
    if (desc.includes('渺小') || desc.includes('巨大') || desc.includes('对比') ||
        desc.includes('参照') || shot._scaleStrategy) {
      elements.push('scale');
    }
    
    // 检查转场能量
    if (camera.includes('甩') || camera.includes('急') || camera.includes('猛') ||
        camera.includes('冲')) {
      elements.push('transition');
    }
    
    // 密度评级
    const density = elements.length;
    let level = 'sparse';
    let action = '必须增强';
    
    for (const [key, val] of Object.entries(DENSITY_STANDARDS.levels)) {
      if (density >= val.min && density <= val.max) {
        level = key;
        action = val.action;
        break;
      }
      if (density > val.max) {
        level = key;
        action = val.action;
      }
    }
    
    return {
      shotId: shot.id,
      density,
      elements,
      level,
      action,
      isAdequate: density >= this.minElements
    };
  }

  /**
   * 分析所有镜头
   */
  analyzeSequence(shots) {
    const results = shots.map(s => this.analyzeShot(s));
    const inadequate = results.filter(r => !r.isAdequate);
    
    return {
      shots: results,
      totalShots: shots.length,
      adequateCount: results.filter(r => r.isAdequate).length,
      inadequateCount: inadequate.length,
      averageDensity: results.reduce((sum, r) => sum + r.density, 0) / results.length,
      inadequateShots: inadequate.map(r => ({ id: r.shotId, density: r.density, elements: r.elements })),
      passed: inadequate.length === 0
    };
  }
}

// ============ 节奏强化引擎 ============
class RhythmIntensifier {
  constructor(options = {}) {
    this.profile = options.profile || SHORT_DRAMA_PROFILE;
    this.debug = options.debug || false;
    this.rules = { ...INTENSIFICATION_RULES, ...(options.rules || {}) };
  }

  /**
   * 主入口：强化整个镜头序列
   */
  intensify(shots, targetDuration = 60) {
    if (!shots || shots.length === 0) {
      return { shots: [], report: '无镜头可强化' };
    }

    const report = {
      originalShotCount: shots.length,
      enhancements: [],
      issues: [],
      fixes: []
    };

    // Step 1: 信息密度检查与增强
    const densityResult = this._checkAndEnhanceDensity(shots);
    report.enhancements.push(...densityResult.enhancements);
    report.issues.push(...densityResult.issues);

    // Step 2: 节奏平淡检测与修复
    const rhythmResult = this._fixFlatRhythm(shots);
    report.fixes.push(...rhythmResult.fixes);
    report.issues.push(...rhythmResult.issues);

    // Step 3: 强制尺度跳跃注入
    const scaleResult = this._injectMandatoryScaleJumps(shots);
    report.fixes.push(...scaleResult.fixes);

    // Step 4: 情绪波浪设计
    const waveResult = this._designEmotionWave(shots);
    report.fixes.push(...waveResult.fixes);

    // Step 5: 短剧快剪时长压缩
    const durationResult = this._applyShortDramaPacing(shots, targetDuration);
    report.fixes.push(...durationResult.fixes);

    // Step 6: 转场强化
    const transitionResult = this._enhanceTransitions(shots);
    report.fixes.push(...transitionResult.fixes);

    // 生成报告
    return {
      shots,
      report: this._generateReport(report),
      densityCheck: densityResult,
      rhythmCheck: rhythmResult,
      scaleCheck: scaleResult,
      waveCheck: waveResult,
      durationCheck: durationResult,
      transitionCheck: transitionResult,
      intensified: true
    };
  }

  /**
   * Step 1: 信息密度检查与增强
   */
  _checkAndEnhanceDensity(shots) {
    const analyzer = new DensityAnalyzer({ minElements: this.profile.densityRequirement });
    const analysis = analyzer.analyzeSequence(shots);
    
    const enhancements = [];
    const issues = [];
    
    // 为密度不足的镜头增强Prompt
    for (const inadequate of analysis.inadequateShots || []) {
      const shot = shots.find(s => s.id === inadequate.id);
      if (!shot) continue;
      
      const missingElements = [];
      if (!inadequate.elements.includes('visual')) missingElements.push('视觉奇观');
      if (!inadequate.elements.includes('emotion')) missingElements.push('情绪触发');
      if (!inadequate.elements.includes('action')) missingElements.push('动作元素');
      if (!inadequate.elements.includes('scale')) missingElements.push('尺度对比');
      
      // 🆕 v1.4-Peng-fix13: 根因修复——污染增强不再追加到story-plan.description
      // 而是注入到专用字段 _rhythmEnhancement，供后续Stage提取，不污染story-plan原始description
      const enhancement = this._generateDensityEnhancement(shot, missingElements);
      if (enhancement) {
        shot._rhythmEnhancement = (shot._rhythmEnhancement || '') + enhancement;
      }
      
      enhancements.push({
        shotId: shot.id,
        originalDensity: inadequate.density,
        addedElements: missingElements,
        enhancement: enhancement.substring(0, 100) + '...'
      });
    }
    
    if (analysis.inadequateCount > 0) {
      issues.push(`${analysis.inadequateCount}/${analysis.totalShots}个镜头信息密度不足（<${this.profile.densityRequirement}元素）`);
    }
    
    // 🆕 v5.9-Peng-fix: 扁平化返回，兼容 director-pipeline.js 的直接访问
    return { 
      enhancements, 
      issues, 
      // 直接暴露 analysis 的字段
      shots: analysis.shots,
      totalShots: analysis.totalShots,
      adequateCount: analysis.adequateCount,
      inadequateCount: analysis.inadequateCount,
      averageDensity: analysis.averageDensity,
      inadequateShots: analysis.inadequateShots,
      passed: analysis.passed
    };
  }

  /**
   * 生成信息密度增强文本
   * 🆕 v1.2-Peng-fix: 片头/建置/特写镜头不注入动作逃跑模板，避免内容污染
   */
  _generateDensityEnhancement(shot, missingElements) {
    const enhancements = [];
    const shotType = shot.type || 'normal';
    const isOpeningTitle = shotType === 'opening_title';
    const isEstablishing = shotType === 'establishing';
    const isCloseup = shotType === 'closeup';
    const isReveal = shotType === 'reveal';
    const isResolution = shotType === 'resolution';
    
    for (const element of missingElements) {
      switch (element) {
        case '视觉奇观':
          // 建置/片头/收尾镜头不强制注入异兽奇观
          if (!isEstablishing && !isOpeningTitle && !isResolution) {
            enhancements.push(`画面中突然出现强烈的光影变化，环境因异兽出现而产生视觉奇观`);
          }
          break;
        case '情绪触发':
          // 特写/片头/收尾镜头已有情绪，不重复注入
          if (!isCloseup && !isOpeningTitle && !isResolution) {
            enhancements.push(`小G的表情从平静转为震惊/恐惧/敬畏，情绪瞬间爆发`);
          }
          break;
        case '动作元素':
          // 片头/建置/特写/揭示/收尾不注入逃跑/防御动作（避免内容错乱）
          if (!isOpeningTitle && !isEstablishing && !isCloseup && !isReveal && !isResolution) {
            enhancements.push(`小G本能地后退/逃跑/做出防御动作，身体动态充满张力`);
          }
          break;
        case '尺度对比':
          // 建置/片头/收尾镜头本身有尺度感，不强制注入
          if (!isEstablishing && !isOpeningTitle && !isResolution) {
            enhancements.push(`通过小G的渺小身影与异兽的巨大体型形成强烈尺度对比`);
          }
          break;
      }
    }
    
    if (enhancements.length === 0) return '';
    return '。同时，' + enhancements.join('，');
  }

  /**
   * Step 2: 节奏平淡检测与修复
   */
  _fixFlatRhythm(shots) {
    const fixes = [];
    const issues = [];
    
    // 检测连续低冲击段
    let flatStreak = 0;
    let flatStart = -1;
    
    for (let i = 0; i < shots.length; i++) {
      const impact = this._estimateShotImpact(shots[i]);
      
      if (impact <= this.rules.flatSegmentImpactMax) {
        if (flatStreak === 0) flatStart = i;
        flatStreak++;
      } else {
        if (flatStreak >= this.rules.flatSegmentThreshold) {
          // 发现平淡段，需要修复
          const fix = this._injectExcitement(shots, flatStart, flatStreak);
          fixes.push({
            type: 'flat_segment_fix',
            position: `${flatStart}-${flatStart + flatStreak - 1}`,
            description: `连续${flatStreak}个低冲击镜头，注入刺激元素`,
            action: fix
          });
          issues.push(`发现平淡段: 镜头${flatStart}-${flatStart + flatStreak - 1}，已强制注入刺激元素`);
        }
        flatStreak = 0;
      }
    }
    
    // 检查末尾
    if (flatStreak >= this.rules.flatSegmentThreshold) {
      const fix = this._injectExcitement(shots, flatStart, flatStreak);
      fixes.push({
        type: 'flat_segment_fix',
        position: `${flatStart}-${flatStart + flatStreak - 1}`,
        description: `末尾连续${flatStreak}个低冲击镜头，注入刺激元素`,
        action: fix
      });
    }
    
    return { fixes, issues };
  }

  /**
   * 估计单个镜头的冲击分数
   */
  _estimateShotImpact(shot) {
    let impact = 5; // 基准
    
    const type = shot.type || 'normal';
    if (type === 'climax') impact += 3;
    if (type === 'action') impact += 2;
    if (type === 'reveal') impact += 2;
    if (type === 'transition') impact -= 2;
    if (type === 'establishing') impact -= 1;
    
    const camera = typeof shot.camera === 'string' ? shot.camera.toLowerCase() : ((shot.camera?.move || '') + ' ' + (shot.camera?.scale || '')).toLowerCase();
    if (camera.includes('甩') || camera.includes('急')) impact += 2;
    if (camera.includes('航') || camera.includes('俯冲')) impact += 1;
    if (camera.includes('缓') || camera.includes('固定')) impact -= 2;
    
    const desc = (shot.description || '').toLowerCase();
    if (desc.includes('巨大') || desc.includes('震撼')) impact += 1;
    if (desc.includes('爆炸') || desc.includes('冲击')) impact += 2;
    
    return Math.min(10, Math.max(1, impact));
  }

  /**
   * 向平淡段注入刺激元素
   */
  _injectExcitement(shots, start, length) {
    const actions = [];
    
    // 策略1: 改变中间镜头的运镜为高能量
    const middleIndex = start + Math.floor(length / 2);
    if (middleIndex < shots.length) {
      const shot = shots[middleIndex];
      shot.camera = (shot.camera || '') + '，突然急推/甩镜切换';
      shot._rhythmEnhanced = true;
      actions.push(`镜头${shot.id}: 运镜增强为急推/甩镜`);
    }
    
    // 策略2: 改变第一个镜头的尺度（如果可能）
    if (start < shots.length && shots[start].scale === shots[start + 1]?.scale) {
      const scales = ['extreme_wide', 'wide', 'medium', 'close_up', 'extreme_close'];
      const currentScale = shots[start].scale || 'medium';
      const newScale = scales[(scales.indexOf(currentScale) + 2) % scales.length];
      shots[start].scale = newScale;
      actions.push(`镜头${shots[start].id}: 尺度强制跳跃至${newScale}`);
    }
    
    return actions;
  }

  /**
   * Step 3: 强制尺度跳跃注入
   */
  _injectMandatoryScaleJumps(shots) {
    const fixes = [];
    
    for (let i = 0; i < shots.length - 1; i++) {
      if (i % this.rules.mandatoryScaleJumpInterval === 0 && i > 0) {
        const current = shots[i];
        const next = shots[i + 1];
        
        if (!current.scale || !next.scale) continue;
        
        const scaleDiff = Math.abs(
          (this._getScaleValue(current.scale) || 4) - 
          (this._getScaleValue(next.scale) || 4)
        );
        
        if (scaleDiff < this.rules.mandatoryScaleJumpMin) {
          // 强制改变下一个镜头的尺度
          const scales = ['extreme_wide', 'wide', 'medium', 'close_up', 'extreme_close'];
          const currentVal = this._getScaleValue(current.scale) || 4;
          const targetVal = currentVal >= 4 ? 1 : 7; // 大跳跃
          const newScale = scales[targetVal - 1];
          
          next.scale = newScale;
          next._scaleForced = true;
          
          fixes.push({
            type: 'forced_scale_jump',
            position: `${current.id}→${next.id}`,
            originalDiff: scaleDiff,
            newScale: newScale,
            reason: '强制尺度跳跃规则触发'
          });
        }
      }
    }
    
    return { fixes };
  }

  /**
   * 获取尺度数值
   */
  _getScaleValue(scale) {
    const map = {
      'extreme_wide': 1, 'wide': 2, 'medium_wide': 3,
      'medium': 4, 'medium_close': 5, 'close_up': 6, 'extreme_close': 7
    };
    return map[scale] || 4;
  }

  /**
   * Step 4: 情绪波浪设计
   */
  _designEmotionWave(shots) {
    const fixes = [];
    
    // 理想的波浪模式: 低→中→高→低→中→更高
    const idealWave = [3, 5, 8, 4, 6, 9, 3, 5, 8, 2]; // 循环
    
    for (let i = 0; i < shots.length; i++) {
      const ideal = idealWave[i % idealWave.length];
      const current = this._estimateShotImpact(shots[i]);
      const diff = Math.abs(current - ideal);
      
      if (diff > 2) {
        // 偏离太大，调整
        if (current < ideal) {
          // 需要增强
          shots[i]._targetImpact = ideal;
          shots[i].description = (shots[i].description || '') + 
            `。情绪冲击指数:${ideal}/10`;
          fixes.push({
            type: 'emotion_wave_adjust',
            shotId: shots[i].id,
            from: current,
            to: ideal,
            reason: '情绪波浪设计'
          });
        }
      }
    }
    
    return { fixes };
  }

  /**
   * Step 5: 短剧快剪时长压缩
   */
  _applyShortDramaPacing(shots, targetDuration) {
    const fixes = [];
    const profile = this.profile;
    
    let totalDuration = 0;
    for (const shot of shots) {
      totalDuration += (shot.duration || 3);
    }
    
    // 如果总时长超过目标，压缩
    if (totalDuration > targetDuration) {
      const ratio = targetDuration / totalDuration;
      
      for (const shot of shots) {
        const original = shot.duration || 3;
        const compressed = Math.max(
          profile.minShot,
          Math.min(profile.maxShot, Math.round(original * ratio))
        );
        
        if (compressed !== original) {
          fixes.push({
            type: 'duration_compression',
            shotId: shot.id,
            from: original,
            to: compressed,
            reason: '短剧快剪模式压缩'
          });
        }
        
        shot.duration = compressed;
      }
    }
    
    // 检查是否有超长镜头
    for (const shot of shots) {
      if ((shot.duration || 0) > profile.maxShot) {
        const original = shot.duration;
        shot.duration = profile.maxShot;
        fixes.push({
          type: 'duration_cap',
          shotId: shot.id,
          from: original,
          to: profile.maxShot,
          reason: '超过短剧快剪最大时长限制'
        });
      }
    }
    
    return { fixes };
  }

  /**
   * Step 6: 转场强化
   */
  _enhanceTransitions(shots) {
    const fixes = [];
    
    for (let i = 0; i < shots.length - 1; i++) {
      const current = shots[i];
      const next = shots[i + 1];
      
      // 禁止慢转场
      const currentCamera = typeof current.camera === 'string' ? current.camera.toLowerCase() : ((current.camera?.move || '') + ' ' + (current.camera?.scale || '')).toLowerCase();
      if (currentCamera.includes('淡入') || currentCamera.includes('淡出') || currentCamera.includes('叠化')) {
        current.camera = currentCamera.replace(/淡入|淡出|叠化/g, '硬切');
        fixes.push({
          type: 'transition_ban',
          position: `${current.id}→${next.id}`,
          banned: '淡入/淡出/叠化',
          replacement: '硬切',
          reason: '短剧快剪模式禁止慢转场'
        });
      }
      
      // 强制高冲击转场
      if (i % 2 === 0) { // 每2个镜头
        const impact = this._estimateShotImpact(current);
        const nextImpact = this._estimateShotImpact(next);
        
        if (Math.abs(impact - nextImpact) < 3) {
          // 冲击差太小，增强
          next._forcedTransition = 'hard_cut_boosted';
          fixes.push({
            type: 'transition_boost',
            position: `${current.id}→${next.id}`,
            originalDiff: Math.abs(impact - nextImpact),
            reason: '强制增强转场冲击'
          });
        }
      }
    }
    
    return { fixes };
  }

  /**
   * 生成强化报告
   */
  _generateReport(report) {
    let text = `\n🎵 节奏强化报告 v1.0-Peng\n`;
    text += `=${'='.repeat(50)}\n`;
    
    text += `📊 原始镜头数: ${report.originalShotCount}\n`;
    
    if (report.enhancements.length > 0) {
      text += `\n💪 信息密度增强: ${report.enhancements.length}个镜头\n`;
      for (const e of report.enhancements.slice(0, 5)) {
        text += `  ${e.shotId}: +${e.addedElements.join('+')} (${e.originalDensity}→${e.originalDensity + e.addedElements.length}元素)\n`;
      }
    }
    
    if (report.fixes.length > 0) {
      text += `\n🔧 节奏修复: ${report.fixes.length}处\n`;
      const fixTypes = {};
      for (const f of report.fixes) {
        fixTypes[f.type] = (fixTypes[f.type] || 0) + 1;
      }
      for (const [type, count] of Object.entries(fixTypes)) {
        text += `  ${type}: ${count}处\n`;
      }
    }
    
    if (report.issues.length > 0) {
      text += `\n⚠️ 发现的问题:\n`;
      for (const issue of report.issues) {
        text += `  • ${issue}\n`;
      }
    }
    
    text += `\n🎯 强化完成！节奏模式: ${this.profile.name}\n`;
    
    return text;
  }
}

// ============ 便捷函数 ============

/**
 * 快速强化镜头序列
 */
function intensifyRhythm(shots, options = {}) {
  const intensifier = new RhythmIntensifier(options);
  return intensifier.intensify(shots, options.targetDuration || 60);
}

/**
 * 检查信息密度
 */
function checkDensity(shots, options = {}) {
  const analyzer = new DensityAnalyzer(options);
  return analyzer.analyzeSequence(shots);
}

module.exports = {
  RhythmIntensifier,
  DensityAnalyzer,
  SHORT_DRAMA_PROFILE,
  DENSITY_STANDARDS,
  INTENSIFICATION_RULES,
  intensifyRhythm,
  checkDensity
};

// 如果直接运行，执行测试
if (require.main === module) {
  // 测试用例
  const testShots = [
    { id: 'S01', type: 'establishing', scale: 'extreme_wide', duration: 5, camera: '航拍缓慢推进', description: 'Nirath山脉全景，双日暮光' },
    { id: 'S02', type: 'character', scale: 'medium', duration: 4, camera: '固定机位', description: '小G站在山脚下，望向远方' },
    { id: 'S03', type: 'transition', scale: 'wide', duration: 3, camera: '缓推', description: '镜头推向山腰' },
    { id: 'S04', type: 'climax', scale: 'close_up', duration: 6, camera: '急推', description: '烛龙睁眼，金色竖瞳' },
    { id: 'S05', type: 'action', scale: 'medium', duration: 5, camera: '跟拍', description: '小G转身逃跑' },
    { id: 'S06', type: 'reflection', scale: 'medium', duration: 4, camera: '固定', description: '小G喘息，回望' },
    { id: 'S07', type: 'action', scale: 'wide', duration: 5, camera: '航拍', description: '烛龙全身显现' },
    { id: 'S08', type: 'ending', scale: 'extreme_wide', duration: 6, camera: '缓缓拉远', description: '小G身影消失在山脉中' }
  ];
  
  console.log('\n=== Rhythm Intensifier v1.0-Peng 测试 ===\n');
  
  // 测试1: 信息密度检查
  console.log('--- 测试1: 信息密度检查 ---');
  const density = checkDensity(testShots);
  console.log(`总镜头: ${density.totalShots}, 达标: ${density.adequateCount}, 不足: ${density.inadequateCount}`);
  console.log(`平均密度: ${density.averageDensity.toFixed(1)}元素/镜头`);
  if (density.inadequateShots.length > 0) {
    console.log('密度不足镜头:', density.inadequateShots.map(s => s.id).join(', '));
  }
  
  // 测试2: 节奏强化
  console.log('\n--- 测试2: 节奏强化 ---');
  const result = intensifyRhythm(testShots, { targetDuration: 60, debug: true });
  console.log(result.report);
  
  // 测试3: 强化后时长
  const totalDuration = result.shots.reduce((sum, s) => sum + (s.duration || 0), 0);
  console.log(`\n强化后总时长: ${totalDuration}秒`);
  console.log('镜头时长分布:');
  result.shots.forEach(s => {
    console.log(`  ${s.id}: ${s.duration}s | ${s.type} | ${s.scale} | ${(s.description || '').substring(0, 40)}...`);
  });
}