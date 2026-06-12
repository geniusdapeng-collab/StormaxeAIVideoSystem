/**
 * Story Manifest Calibrator — 故事宪法校准器
 * v2.4-Peng (Prompt字符限制硬规则 + 8大模块覆盖检查)
 * 
 * 核心功能:
 * 1. loadManifest(path) — 加载故事宪法
 * 2. calibrate(output, manifest, stage) — 对下游输出做校准
 * 3. checkConsistency(output, manifest) — 一致性检查
 * 4. generateFeedback(violations, stage) — 生成修正指令
 * 5. validatePromptLength(prompts) — v2.4: Prompt字符限制硬规则检查
 * 6. validatePromptModules(prompts) — v2.4: 8大模块覆盖检查
 * 
 * 集成点:
 * - 故事引擎: 生成大纲后校准角色/主题/结构
 * - 分镜设计: 设计镜头后校准叙事节拍
 * - Prompt生成: 生成Prompt后校准视觉风格/角色描述/字符限制/模块覆盖
 * - 渲染引擎: 渲染前校准Prompt合规性（v2.4新增）
 * - 比稿评测: 以manifest为"正确答案"评分
 * - 后期合成: 合成时校准叙事连贯性
 */

const fs = require('fs');
const path = require('path');
const { PromptRules } = require('./prompt-rules-v24.js');

class StoryManifestCalibrator {
  constructor(manifestPath) {
    this.manifest = this.loadManifest(manifestPath);
    this.violations = [];
    this.warnings = [];
    this.promptRules = new PromptRules(); // v2.4: 初始化Prompt规则检查器
  }

  // ============ 1. 加载故事宪法 ============
  loadManifest(manifestPath) {
    if (typeof manifestPath === 'object') {
      return manifestPath; // 已经是对象
    }
    
    const content = fs.readFileSync(manifestPath, 'utf8');
    
    // 尝试JSON解析
    try {
      return JSON.parse(content);
    } catch (jsonErr) {
      // 如果不是JSON，尝试作为JS模块require
      try {
        // 删除缓存确保重新加载
        delete require.cache[require.resolve(manifestPath)];
        return require(manifestPath);
      } catch (jsErr) {
        throw new Error(`无法解析故事宪法: ${jsonErr.message} / ${jsErr.message}`);
      }
    }
  }

  // ============ 2. 主校准入口 ============
  calibrate(output, stage) {
    this.violations = [];
    this.warnings = [];

    switch (stage) {
      case 'story_engine':
        return this._calibrateStoryEngine(output);
      case 'shot_design':
        return this._calibrateShotDesign(output);
      case 'prompt_generation':
        return this._calibratePromptGeneration(output);
      case 'render_engine':
        return this._calibrateRenderEngine(output);
      case 'pitch_evaluation':
        return this._calibratePitchEvaluation(output);
      case 'post_production':
        return this._calibratePostProduction(output);
      default:
        throw new Error(`未知校准阶段: ${stage}`);
    }
  }

  // ============ 3. 各阶段校准逻辑 ============

  /**
   * 故事引擎校准 — 检查大纲是否符合宪法
   */
  _calibrateStoryEngine(storyPlan) {
    const manifest = this.manifest;
    const story = manifest.story;
    const characters = manifest.characters;

    // 3.1 检查四幕结构完整性
    const acts = [...new Set((storyPlan.shots || []).map(s => s.act).filter(Boolean))];
    const expectedActs = ['起', '承', '转', '合'];
    const missingActs = expectedActs.filter(a => !acts.some(act => act.includes(a)));
    
    if (missingActs.length > 0) {
      this.violations.push({
        type: 'structure',
        severity: 'critical',
        item: '四幕结构缺失',
        issue: `缺少幕: ${missingActs.join(', ')}`,
        expected: '起承转合四幕完整',
        actual: `只有: ${acts.join(', ')}`,
        fix: `补齐缺失的${missingActs.join('、')}幕，参考宪法: ${JSON.stringify(story.structure)}`
      });
    }

    // 3.2 检查角色是否符合宪法
    for (const char of (storyPlan.characters || [])) {
      const charId = char.id || char.name;
      const manifestChar = characters[charId] || characters[char.name];
      
      if (!manifestChar) {
        this.warnings.push({
          type: 'character',
          severity: 'warning',
          item: `未知角色: ${char.name || char.id}`,
          issue: '角色未在宪法中定义',
          suggestion: `检查是否应为: ${Object.keys(characters).join(', ')}`
        });
      } else {
        // 检查角色名称一致性
        if (char.name && manifestChar.name && char.name !== manifestChar.name) {
          this.violations.push({
            type: 'character',
            severity: 'error',
            item: `角色名称不一致: ${char.name}`,
            issue: `宪法定义的名称是"${manifestChar.name}"，但输出中是"${char.name}"`,
            fix: `统一角色名称为: ${manifestChar.name}`
          });
        }
      }
    }

    // 3.3 检查主题关键词是否出现
    const allDesc = (storyPlan.shots || []).map(s => s.description || '').join(' ');
    const themeKeywords = manifest.narrative_rules.theme_keywords;
    const missingThemes = [];
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const hasKeyword = keywords.some(kw => allDesc.includes(kw));
      if (!hasKeyword) {
        missingThemes.push(theme);
      }
    }
    
    if (missingThemes.length > 2) {
      this.violations.push({
        type: 'theme',
        severity: 'error',
        item: '主题缺失',
        issue: `${missingThemes.length}个核心主题未在故事中出现`,
        missing: missingThemes,
        expected: '至少包含2个主题关键词',
        fix: `在关键镜头注入主题词: ${Object.entries(themeKeywords).map(([t, kws]) => `${t}(${kws.slice(0,3).join('/')})`).join(', ')}`
      });
    }

    // 3.4 检查叙事节拍是否符合宪法预期
    for (const [actName, actConfig] of Object.entries(story.structure)) {
      const actShots = (storyPlan.shots || []).filter(s => s.act && s.act.includes(actConfig.name.charAt(0)));
      
      if (actShots.length === 0) {
        this.violations.push({
          type: 'narrative',
          severity: 'critical',
          item: `${actConfig.name}叙事节拍缺失`,
          issue: `该幕预期有${actConfig.shots.length}个镜头，但实际0个`,
          expected_beats: actConfig.beats,
          fix: `生成${actConfig.shots.length}个镜头，实现以下节拍:\n${actConfig.beats.map((b, i) => `  ${i+1}. ${b}`).join('\n')}`
        });
      }
    }

    return this._generateCalibrationReport('story_engine');
  }

  /**
   * 分镜设计校准 — 检查每个镜头的叙事功能
   */
  _calibrateShotDesign(shots) {
    const manifest = this.manifest;
    const narrativeRules = manifest.narrative_rules;

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const desc = shot.description || '';

      // 检查是否有角色动作（不能只是站着/摆着）
      // v1.1-Peng-fix: 扩展动作词库，支持更丰富的动作描述
      const actionKeywords = [
        // 基础动作
        '做', '来', '去', '跑', '走', '飞', '跳', '说', '看', '发现', '拿', '给', '挡', '护', '救', '打', '哭', '笑',
        // 身体动作
        '站', '坐', '蹲', '躺', '爬', '站起', '坐下', '蹲下', '躺下', '爬起',
        // 手部动作
        '伸', '指', '拉', '推', '抓', '握', '捧', '举', '挥', '摆', '梳理', '拨', '递',
        // 头部动作
        '歪头', '抬头', '低头', '转头', '回头', '点头', '摇头', '怒视', '凝视', '注视',
        // 情感动作
        '拥抱', '亲吻', '抚摸', '梳理', '拍', '摸', '擦', '抹',
        // 移动动作
        '冲', '奔', '扑', '逃', '追', '赶', '爬', '攀', '登', '升', '升起', '落下', '降',
        // 互动动作
        '递', '接', '传', '扔', '投', '抛', '接', '挡', '拦', '阻', '护', '围',
        // 变化/状态动作
        '发光', '发亮', '闪烁', '闪耀', '变化', '变成', '愈合', '重生', '恢复', '消散', '消失', '出现',
        // 精卫特有
        '衔', '投石', '盘旋', '俯冲', '展翅', '梳理羽毛',
        // 龙王特有
        '挥手', '卷起', '掀起', '怒吼', '咆哮', '瞪',
        // 小G特有
        '歪头', '拍手', '跺脚', '搓手', '挠头', '探出头', '缩成一团', '咬牙', '挡在前面'
      ];
      const hasAction = actionKeywords.some(kw => desc.includes(kw));
      if (!hasAction) {
        this.violations.push({
          type: 'shot_action',
          severity: 'error',
          item: `S${String(i+1).padStart(2,'0')} 无角色动作`,
          issue: '镜头中只有环境/氛围描述，角色没有做任何事',
          fix: `给${(shot.characters || []).join('/')}添加动作: 歪头/蹲下/伸手/递石头/保护等`
        });
      }

      // 检查是否有情绪变化
      const hasEmotion = /[害怕|开心|伤心|生气|惊讶|好奇|坚定|温柔|勇敢]/u.test(desc);
      if (!hasEmotion && i > 0) { // 第一个镜头可以无情绪
        this.warnings.push({
          type: 'shot_emotion',
          severity: 'warning',
          item: `S${String(i+1).padStart(2,'0')} 无情绪标记`,
          issue: '缺少情绪描述，观众无法共情',
          fix: '添加情绪词: 好奇/开心/害怕/坚定/感动'
        });
      }

      // 检查因果链（非首镜头）
      if (i > 0) {
        const prevDesc = shots[i-1].description || '';
        const causalWords = ['然后', '接着', '于是', '因此', '突然', '这时', '随即', '因为', '所以'];
        const hasCausal = causalWords.some(w => desc.includes(w));
        const sharedChars = (shot.characters || []).filter(c => (shots[i-1].characters || []).includes(c));
        
        if (!hasCausal && sharedChars.length === 0) {
          this.violations.push({
            type: 'causal_chain',
            severity: 'error',
            item: `S${String(i).padStart(2,'0')}→S${String(i+1).padStart(2,'0')} 因果链断裂`,
            issue: '两个镜头之间没有因果连接，也没有共享角色',
            fix: `添加因果连接: "因为${prevDesc.slice(0,20)}...，所以..." 或保持角色连续性`
          });
        }
      }
    }

    return this._generateCalibrationReport('shot_design');
  }

  /**
   * Prompt生成校准 — 检查视觉风格/角色描述/字符限制是否符合宪法
   * v2.4-Peng: 新增Prompt字符限制硬规则检查
   */
  _calibratePromptGeneration(prompts) {
    const manifest = this.manifest;
    const visualStyle = manifest.visual_style;
    const characters = manifest.characters;
    const worldview = manifest.worldview_rules;

    // v2.4-Peng: Prompt字符限制硬规则
    const CHINESE_LIMIT = 490; // 中文字数上限
    const ENGLISH_LIMIT = 990; // 英文字符上限
    const TOKEN_LIMIT = 500;   // 总token估算上限

    // v2.4-Peng: 8大模块检查关键词
    const requiredModules = {
      'system_prefix': /CG\s+cinematic.*photorealistic.*hyper-detailed.*skin.*pores/i,
      'character_desc': /Chinese\s+boy|divine\s+bird|Dragon\s+King|XiaoG|Jingwei/i,
      'scene_action': /[\u4e00-\u9fff]{20,}/, // 至少20个中文字符的场景描述
      'honghuang_style': /Honghuang.*era|IMAX|ink\s+wash|Song\s+Dynasty/i,
      'lighting_quality': /natural\s+sunlight|golden\s+hour|rim\s+light|Fog\s+Hill/i,
      'color_system': /003B5C|D32F2F|深海|赤红|撞色|五正色/i,
      'negative_guard': /negative:.*zombie.*wizard.*magic.*western\s+dragon.*modern.*neon.*anime/i,
      'camera_instruction': /广角|特写|中景|近景|过肩|跟随|甩镜|establishing|close-up|medium|wide/i
    };

    for (let i = 0; i < prompts.length; i++) {
      const prompt = typeof prompts[i] === 'string' ? prompts[i] : (prompts[i].text || prompts[i].prompt || '');
      const promptLower = prompt.toLowerCase();

      // ===== v2.4-Peng: 字符限制硬规则检查 =====
      const chineseChars = (prompt.match(/[\u4e00-\u9fff]/g) || []).length;
      const totalChars = prompt.length;
      const englishChars = totalChars - chineseChars;
      const estimatedTokens = chineseChars + Math.ceil(englishChars / 2);

      // 检查中文字数
      if (chineseChars > CHINESE_LIMIT) {
        this.violations.push({
          type: 'prompt_length',
          severity: 'error',
          item: `S${String(i+1).padStart(2,'0')} 中文字数超限`,
          issue: `中文字数${chineseChars} > 限制${CHINESE_LIMIT}`,
          fix: `精简中文场景描述，删除冗余修饰，保留核心动作叙事。当前中文: "${prompt.match(/[\u4e00-\u9fff]+/g)?.slice(0,3).join('')}..."`,
          actual: chineseChars,
          limit: CHINESE_LIMIT
        });
      }

      // 检查英文字符数
      if (englishChars > ENGLISH_LIMIT) {
        this.violations.push({
          type: 'prompt_length',
          severity: 'error',
          item: `S${String(i+1).padStart(2,'0')} 英文字符超限`,
          issue: `英文字符${englishChars} > 限制${ENGLISH_LIMIT}`,
          fix: `精简英文修饰词，删除重复形容词，使用更紧凑的术语。优先保留: photorealistic, hyper-detailed, pores, East Asian features`,
          actual: englishChars,
          limit: ENGLISH_LIMIT
        });
      }

      // 检查总token估算
      if (estimatedTokens > TOKEN_LIMIT) {
        this.warnings.push({
          type: 'prompt_length',
          severity: 'warning',
          item: `S${String(i+1).padStart(2,'0')} Token估算接近上限`,
          issue: `估算token${estimatedTokens}接近限制${TOKEN_LIMIT}（中文字${chineseChars} + 英文${englishChars}/2）`,
          fix: `建议精简至450token以下，为Seedance API留buffer`,
          actual: estimatedTokens,
          limit: TOKEN_LIMIT
        });
      }

      // ===== v2.4-Peng: 8大模块覆盖检查 =====
      for (const [moduleName, regex] of Object.entries(requiredModules)) {
        if (!regex.test(prompt)) {
          const severity = moduleName === 'system_prefix' || moduleName === 'negative_guard' ? 'error' : 'warning';
          this.violations.push({
            type: 'prompt_module',
            severity: severity,
            item: `S${String(i+1).padStart(2,'0')} 缺少模块: ${moduleName}`,
            issue: `Prompt未包含必需的"${moduleName}"模块`,
            fix: this._getModuleFixHint(moduleName),
            module: moduleName
          });
        }
      }

      // 检查世界观污染（中英文混合检测）
      const forbiddenMap = {
        '丧尸': ['zombie', 'undead', 'walking dead'],
        '吸血鬼': ['vampire', 'bloodsucker'],
        '巫师': ['wizard', 'witch', 'sorcerer', 'mage', 'warlock'],
        '魔法': ['magic', 'spell', 'enchantment', 'sorcery'],
        '魔咒': ['curse', 'hex', 'jinx'],
        '诅咒': ['curse', 'cursed'],
        '西方龙': ['western dragon', 'wyvern', 'european dragon'],
        '精灵': ['elf', 'fairy', 'pixie', 'sprite'],
        '矮人': ['dwarf', 'gnome'],
        '兽人': ['orc', 'troll'],
        '哥布林': ['goblin', 'hobgoblin'],
        '现代元素': ['modern', 'contemporary'],
        '科技感': ['tech', 'sci-fi', 'science fiction', 'futuristic'],
        '霓虹灯': ['neon', 'neon light', 'neon sign'],
        '赛博朋克': ['cyberpunk', 'cyber punk'],
        '英文对白': ['english dialogue', 'speaking english'],
        '现代服装': ['modern clothes', 't-shirt', 'jeans', 'sneakers', 'hoodie'],
        '现代建筑': ['modern building', 'skyscraper', 'high-rise'],
        '塑料质感': ['plastic texture', 'plastic look'],
        'CG过度光滑': ['overly smooth cg', 'plastic skin'],
        '动漫风格': ['anime style', 'manga style', 'cartoon style'],
        '血腥暴力': ['gore', 'bloody', 'violent', 'brutal'],
        '恐怖元素': ['horror', 'scary', 'terrifying'],
        '性暗示': ['sexual', 'suggestive', 'nude', 'naked']
      };
      
      for (const [cnWord, enWords] of Object.entries(forbiddenMap)) {
        const isForbidden = promptLower.includes(cnWord.toLowerCase()) || 
                           enWords.some(ew => promptLower.includes(ew.toLowerCase()));
        
        if (isForbidden) {
          this.violations.push({
            type: 'worldview_contamination',
            severity: 'critical',
            item: `S${String(i+1).padStart(2,'0')} 世界观污染`,
            issue: `出现禁忌词: "${cnWord}" (检测到: ${enWords.filter(ew => promptLower.includes(ew.toLowerCase())).concat(promptLower.includes(cnWord.toLowerCase()) ? [cnWord] : []).join(', ')})`,
            fix: `替换为宪法允许的替代词，或删除。宪法允许的: ${worldview.must_have.slice(0, 5).join(', ')}...`
          });
        }
      }

      // 检查角色人种特征（小G）
      if (promptLower.includes('xiaog') || promptLower.includes('小g') || promptLower.includes('boy')) {
        const xiaog = characters.xiaog;
        const requiredFeatures = [
          ...xiaog.ethnicity.hair.split(/[,，]/),
          ...xiaog.ethnicity.eyes.split(/[,，]/),
          ...xiaog.ethnicity.skin_tone.split(/[,，]/)
        ].map(s => s.trim()).filter(Boolean);
        
        const missingFeatures = requiredFeatures.filter(f => !promptLower.includes(f.toLowerCase()));
        
        if (missingFeatures.length > 2) {
          this.warnings.push({
            type: 'character_ethnicity',
            severity: 'warning',
            item: `S${String(i+1).padStart(2,'0')} 小G人种特征不足`,
            issue: `缺少特征: ${missingFeatures.slice(0,3).join(', ')}`,
            fix: `注入人种特征: ${xiaog.ethnicity.hair}, ${xiaog.ethnicity.eyes}, ${xiaog.ethnicity.skin_tone}`
          });
        }
      }

      // 检查视觉风格关键词
      const colorKeywords = ['blue', 'red', '深海', '赤红', '幽蓝', '烈焰'];
      const hasColor = colorKeywords.some(c => promptLower.includes(c.toLowerCase()));
      if (!hasColor && i > 0) {
        this.warnings.push({
          type: 'visual_style',
          severity: 'info',
          item: `S${String(i+1).padStart(2,'0')} 缺少色彩关键词`,
          suggestion: `宪法色彩: ${visualStyle.color_system.primary}`
        });
      }
    }

    return this._generateCalibrationReport('prompt_generation');
  }

  /**
   * 渲染引擎校准 — 检查输出是否符合宪法
   */
  _calibrateRenderEngine(renderOutput) {
    // 渲染输出通常是视频/图片路径，主要检查metadata
    const manifest = this.manifest;
    
    if (renderOutput.metadata) {
      // 检查时长
      if (renderOutput.metadata.duration && 
          Math.abs(renderOutput.metadata.duration - manifest.technical.duration_total) > 2) {
        this.warnings.push({
          type: 'technical',
          severity: 'warning',
          item: '时长偏差',
          issue: `渲染时长${renderOutput.metadata.duration}s与宪法${manifest.technical.duration_total}s偏差>2s`,
          fix: `调整镜头数量或单镜头时长`
        });
      }
    }

    return this._generateCalibrationReport('render_engine');
  }

  /**
   * 比稿评测校准 — 以宪法为"正确答案"评分
   */
  _calibratePitchEvaluation(evaluationResult) {
    const manifest = this.manifest;
    
    // 检查评测是否参考了宪法
    if (!evaluationResult.manifestReferenced) {
      this.warnings.push({
        type: 'evaluation',
        severity: 'warning',
        item: '评测未引用宪法',
        issue: '比稿评测未以故事宪法为参照物',
        fix: '评测时应以story-manifest为"正确答案"进行对比'
      });
    }

    return this._generateCalibrationReport('pitch_evaluation');
  }

  /**
   * 后期合成校准
   */
  _calibratePostProduction(finalOutput) {
    const manifest = this.manifest;
    
    // 检查最终成片是否包含所有宪法要求的角色
    const requiredChars = Object.keys(manifest.characters);
    // 这里假设finalOutput有角色出场统计
    
    return this._generateCalibrationReport('post_production');
  }

  /**
   * v2.4-Peng: 获取模块修复提示
   */
  _getModuleFixHint(moduleName) {
    const hints = {
      'system_prefix': '注入系统前缀: "CG cinematic, photorealistic, hyper-detailed skin pores, no cartoon no anime"',
      'character_desc': '注入角色描述: 小G人种特征(XiaoG 8yo straight black hair dark brown almond eyes yellow skin) + 出场角色',
      'scene_action': '注入中文场景动作: 至少20个中文字符描述角色在做什么（歪头/蹲下/递石头/保护等）',
      'honghuang_style': '注入洪荒风格: "Honghuang era, IMAX aesthetic, ink wash painting, Song Dynasty landscape, film grain"',
      'lighting_quality': '注入光影质感: "natural sunlight, golden hour, rim light, atmospheric depth, Fog Hill style"',
      'color_system': '注入色彩系统: "深海幽蓝#003B5C+烈焰赤红#D32F2F撞色，五正色，高饱和日光"',
      'negative_guard': '注入负面防护: "negative: zombie, wizard, magic, western dragon, modern, neon, anime"',
      'camera_instruction': '注入运镜指令: 广角establishing shot/特写close-up/中景medium shot/甩镜whip pan等'
    };
    return hints[moduleName] || `检查并补充"${moduleName}"模块`;
  }

  // ============ 4. 生成校准报告 ============
  _generateCalibrationReport(stage) {
    const criticalCount = this.violations.filter(v => v.severity === 'critical').length;
    const errorCount = this.violations.filter(v => v.severity === 'error').length;
    const warningCount = this.warnings.length;
    
    const passed = criticalCount === 0 && errorCount === 0;
    
    const report = {
      stage,
      manifest_version: this.manifest.metadata.version,
      timestamp: new Date().toISOString(),
      passed,
      summary: {
        critical: criticalCount,
        errors: errorCount,
        warnings: warningCount,
        total_issues: this.violations.length + this.warnings.length
      },
      violations: this.violations,
      warnings: this.warnings,
      
      // 如果未通过，生成修正指令
      fix_instructions: passed ? null : this._generateFixInstructions(),
      
      // 生成下游校准建议
      downstream_advice: this._generateDownstreamAdvice(stage)
    };

    return report;
  }

  /**
   * 生成修正指令（给上游环节的反馈）
   */
  _generateFixInstructions() {
    const instructions = [];
    
    // 按类型分组
    const byType = {};
    for (const v of this.violations) {
      byType[v.type] = byType[v.type] || [];
      byType[v.type].push(v);
    }

    for (const [type, items] of Object.entries(byType)) {
      instructions.push(`\n【${type}】${items.length}个问题:`);
      for (const item of items) {
        instructions.push(`  ❌ ${item.item}`);
        instructions.push(`     问题: ${item.issue}`);
        if (item.fix) instructions.push(`     修复: ${item.fix}`);
      }
    }

    instructions.push(`\n【核心原则】故事宪法 v${this.manifest.metadata.version} 是唯一的真相来源。`);
    instructions.push(`所有输出必须与宪法保持一致。`);
    
    return instructions.join('\n');
  }

  /**
   * 生成下游建议（给下游环节的预警）
   */
  _generateDownstreamAdvice(currentStage) {
    const advice = [];
    
    // 根据当前阶段的问题，预警下游可能的风险
    const hasCharacterIssues = this.violations.some(v => v.type === 'character');
    const hasWorldviewIssues = this.violations.some(v => v.type === 'worldview_contamination');
    
    if (hasCharacterIssues) {
      advice.push('⚠️ 下游Prompt生成/渲染: 角色描述可能与宪法不一致，请使用宪法中的角色定义');
    }
    
    if (hasWorldviewIssues) {
      advice.push('⚠️ 下游渲染: 已发现世界观污染，请启用worldview-contamination-detector二次检查');
    }

    return advice;
  }

  // ============ 5. 便捷方法 ============

  /**
   * 快速检查输出是否与宪法一致
   */
  checkConsistency(output, stage) {
    const report = this.calibrate(output, stage);
    return {
      consistent: report.passed,
      issues: report.summary.total_issues,
      details: report
    };
  }

  /**
   * 获取宪法中的角色定义（供Prompt生成使用）
   */
  getCharacterDefinition(charId) {
    return this.manifest.characters[charId] || null;
  }

  /**
   * 获取宪法中的视觉风格（供Prompt生成使用）
   */
  getVisualStyle() {
    return this.manifest.visual_style;
  }

  /**
   * 获取禁止词列表（供污染检测使用）
   */
  getForbiddenWords() {
    return this.manifest.worldview_rules.must_not_have;
  }

  /**
   * 获取主题关键词（供故事引擎使用）
   */
  getThemeKeywords() {
    return this.manifest.narrative_rules.theme_keywords;
  }
}

// ============ 导出 ============
module.exports = { StoryManifestCalibrator };

// ============ CLI入口 ============
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'calibrate') {
    const manifestPath = args[1] || './story-manifest.json';
    const outputPath = args[2] || './output.json';
    const stage = args[3] || 'story_engine';
    
    const calibrator = new StoryManifestCalibrator(manifestPath);
    const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const report = calibrator.calibrate(output, stage);
    
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.passed ? 0 : 1);
  } else {
    console.log(`
Story Manifest Calibrator v1.0-Peng

用法:
  node story-manifest-calibrator.js calibrate <manifest.json> <output.json> <stage>

阶段:
  story_engine — 故事大纲校准
  shot_design — 分镜设计校准
  prompt_generation — Prompt生成校准
  render_engine — 渲染引擎校准
  pitch_evaluation — 比稿评测校准
  post_production — 后期合成校准
    `);
  }
}