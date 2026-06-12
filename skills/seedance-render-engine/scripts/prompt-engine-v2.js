/**
 * Seedance Prompt Engineering Pipeline v2.0
 * 解决提示词利用率不足问题（25-40% → 85-99%）
 * 外部专家方案 - 2026-06-05
 */

// ============================================================================
// 模块1: 鲁棒字段解析器
// ============================================================================
class PromptParser {
  /**
   * 主入口：自动检测格式并解析
   * 支持: "Key: Value" 格式 / JSON格式 / 自由文本格式
   */
  static parse(llmOutput) {
    if (!llmOutput || typeof llmOutput !== 'string') {
      return this.getEmptyFields();
    }

    // 尝试按优先级解析
    let result = this.parseKeyValueFormat(llmOutput);

    // 验证解析质量：如果核心字段覆盖率<50%，尝试其他格式
    const coreCoverage = this.calculateCoreCoverage(result);
    if (coreCoverage < 0.5) {
      const jsonResult = this.parseJSONFormat(llmOutput);
      if (this.calculateCoreCoverage(jsonResult) > coreCoverage) {
        result = jsonResult;
      }
    }

    // 清理并规范化
    return this.normalizeFields(result);
  }

  /**
   * 解析 "Key: Value" 格式（LLM最常用的输出格式）
   * 兼容: "Key:", "Key：", "**Key**: Value", "- Key: Value" 等变体
   */
  static parseKeyValueFormat(text) {
    const fields = this.getEmptyFields();
    
    // 🆕 v6.15-Peng-fix: 支持两种字段分隔格式：换行分隔和管道符(|)分隔
    // 根因: LLM输出有时每行一个Key-Value(换行分隔)，有时所有字段在同一行用|分隔
    const patterns = [
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*Character\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'character' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*Action\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'action' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*Scene\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'scene' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*Mood\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'mood' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*Camera\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'camera' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*Lighting\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'lighting' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*NegativePrompt\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'negativePrompt' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*RenderStyle\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'renderStyle' },
      { regex: /(?:^|\n|\s*\|\s*)\s*[*\-]*\s*DirectorStyle\s*[:：]\s*(.+?)(?=(?:\n|\r|\s*\|\s*)\s*[*\-]*\s*\w+\s*[:：]|$)/ims, key: 'directorStyle' },
    ];

    for (const { regex, key } of patterns) {
      regex.lastIndex = 0; // 重置正则
      const match = text.match(regex);
      if (match && match[1]) {
        fields[key] = this.cleanValue(match[1]);
      }
    }

    return fields;
  }

  /**
   * 解析JSON格式输出
   */
  static parseJSONFormat(text) {
    const fields = this.getEmptyFields();
    try {
      // 尝试提取JSON块
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);

        // 映射可能的字段名变体
        const mapping = {
          character: ['character', 'Character', 'char', 'subject'],
          action: ['action', 'Action', 'movement', 'pose'],
          scene: ['scene', 'Scene', 'environment', 'setting', 'background'],
          mood: ['mood', 'Mood', 'atmosphere', 'emotion', 'tone'],
          camera: ['camera', 'Camera', 'cinematography', 'shot', 'framing'],
          lighting: ['lighting', 'Lighting', 'light'],
          negativePrompt: ['negativePrompt', 'NegativePrompt', 'negative', 'exclude'],
          renderStyle: ['renderStyle', 'RenderStyle', 'style', 'render', 'quality'],
          directorStyle: ['directorStyle', 'DirectorStyle', 'director', 'cinematicStyle'],
        };

        for (const [standardKey, aliases] of Object.entries(mapping)) {
          for (const alias of aliases) {
            if (data[alias] && typeof data[alias] === 'string') {
              fields[standardKey] = this.cleanValue(data[alias]);
              break;
            }
          }
        }
      }
    } catch (e) {
      // JSON解析失败，返回空字段
    }

    return fields;
  }

  /**
   * 计算核心字段覆盖率（Character/Action/Scene/Mood）
   */
  static calculateCoreCoverage(fields) {
    const coreKeys = ['character', 'action', 'scene', 'mood'];
    const filled = coreKeys.filter(k => fields[k] && fields[k].length > 5);
    return filled.length / coreKeys.length;
  }

  /**
   * 清理字段值
   */
  static cleanValue(val) {
    return val
      .replace(/[\n\r\t]+/g, ' ')  // 换行转空格
      .replace(/\s{2,}/g, ' ')      // 多余空格合并
      .replace(/[#_`]/g, '')       // 移除markdown标记
      .trim();
  }

  /**
   * 规范化字段：智能推断缺失的核心字段
   */
  static normalizeFields(fields) {
    // 如果Character为空但Action中包含主体描述，提取之
    if (!fields.character && fields.action) {
      const subjectMatch = fields.action.match(/^([^,，]{2,20})/);
      if (subjectMatch) fields.character = subjectMatch[1];
    }
    // 如果Scene为空但有Mood，用Mood推断场景氛围词
    if (!fields.scene && fields.mood) {
      fields.scene = `${fields.mood} atmosphere, environmental mood`;
    }

    return fields;
  }

  static getEmptyFields() {
    return {
      character: '',
      action: '',
      scene: '',
      mood: '',
      camera: '',
      lighting: '',
      negativePrompt: '',
      renderStyle: '',
      directorStyle: '',
    };
  }
}

// ============================================================================
// 模块2: 优先级截断器（核心：绝不截断核心叙事）
// ============================================================================
class SmartTruncator {
  /**
   * 主截断方法：按优先级保留内容
   * @param {Object} fields - 解析后的字段
   * @param {number} targetLength - 目标长度（默认1000）
   * @param {Object} options - 配置选项
   */
  // 🆕 v6.19-Peng: 当 minUtilization=0 时，禁用截断，让完整内容进入 expandPromptToTarget 一次性决策
  static truncate(fields, targetLength = 1000, options = {}) {
    // 🆕 v6.19-Peng: 兼容模式 — 如果外部传入 minUtilization=0（即禁用截断），直接拼接所有字段
    const minUtilization = options.minUtilization ?? 0.85;
    if (minUtilization <= 0) {
      // 禁用截断模式：拼接所有非空字段，完整传递给 expandPromptToTarget
      const allParts = Object.entries(fields)
        .filter(([, v]) => v && typeof v === 'string' && v.trim().length > 0)
        .map(([, v]) => v.trim())
        .filter(v => v.length > 0)
        .join(', ');
      console.log(`  [SmartTruncator] 🆕 v6.19-Peng: 禁用截断模式，原始长度${allParts.length}字，直接透传`);
      return allParts;
    }
    const config = {
      coreRetentionRatio: 0.75,  // 核心叙事至少保留75%
      minCoreLength: 400,          // 核心叙事最少字符数
      separator: ', ',             // 字段间分隔符
      ...options
    };

    // 第一步：按优先级分类字段
    const prioritized = this.prioritizeFields(fields);

    // 第二步：计算核心叙事所需空间
    const coreText = this.assembleCore(prioritized.core);
    const coreLength = coreText.length;

    // 第三步：如果核心叙事已超过目标长度，智能压缩核心
    if (coreLength > targetLength * config.coreRetentionRatio) {
      return this.compressCoreFirst(prioritized, targetLength, config);
    }

    // 第四步：填充技术参数到目标长度
    return this.fillWithTechnical(prioritized, targetLength, config);
  }

  /**
   * 字段优先级分类
   * Tier 1（核心叙事，绝不截断）: Character, Action, Scene, Mood
   * Tier 2（技术参数，可适度截断）: Camera, Lighting
   * Tier 3（元数据，最后填充/可丢弃）: RenderStyle, DirectorStyle, NegativePrompt
   */
  static prioritizeFields(fields) {
    return {
      core: {
        character: fields.character || '',
        action: fields.action || '',
        scene: fields.scene || '',
        mood: fields.mood || '',
      },
      technical: {
        camera: fields.camera || '',
        lighting: fields.lighting || '',
      },
      meta: {
        renderStyle: fields.renderStyle || '',
        directorStyle: fields.directorStyle || '',
        negativePrompt: fields.negativePrompt || '',
      }
    };
  }

  /**
   * 组装核心叙事文本
   */
  static assembleCore(coreFields) {
    const parts = [];
    if (coreFields.character) parts.push(coreFields.character);
    if (coreFields.action) parts.push(coreFields.action);
    if (coreFields.scene) parts.push(coreFields.scene);
    if (coreFields.mood) parts.push(coreFields.mood);
    return parts.join(', ');
  }

  /**
   * 策略A：核心叙事过长，需要智能压缩
   */
  static compressCoreFirst(prioritized, targetLength, config) {
    const { core, technical, meta } = prioritized;
    
    // 按重要性排序核心字段
    const coreOrder = ['character', 'action', 'scene', 'mood'];
    let remaining = targetLength;
    const result = {};

    // 为每个核心字段分配配额（Character和Action各占30%，Scene和Mood各占20%）
    const quotas = {
      character: Math.floor(targetLength * 0.30),
      action: Math.floor(targetLength * 0.30),
      scene: Math.floor(targetLength * 0.20),
      mood: Math.floor(targetLength * 0.20),
    };

    let finalParts = [];

    for (const key of coreOrder) {
      const val = core[key];
      if (!val) continue;

      const quota = quotas[key];
      const truncated = this.smartSentenceTruncate(val, quota);
      if (truncated) {
        finalParts.push(truncated);
        remaining -= truncated.length + 2; // +2 for ', '
      }
    }

    // 剩余空间分配给技术参数
    const techText = this.assembleTechnical(technical);
    if (techText && remaining > 50) {
      const techTruncated = this.smartSentenceTruncate(techText, remaining - 10);
      finalParts.push(techTruncated);
    }

    return finalParts.join(', ');
  }

  /**
   * 策略B：核心叙事有空间，填充技术参数和元数据
   */
  static fillWithTechnical(prioritized, targetLength, config) {
    const { core, technical, meta } = prioritized;
    let parts = [];

    // 1. 核心叙事完整保留
    const coreText = this.assembleCore(core);
    if (coreText) parts.push(coreText);

    let currentLength = coreText.length;

    // 2. 填充技术参数（Camera + Lighting）
    const techOrder = ['camera', 'lighting'];
    for (const key of techOrder) {
      const val = technical[key];
      if (!val) continue;

      if (currentLength + val.length + 2 <= targetLength - 50) {
        parts.push(val);
        currentLength += val.length + 2;
      } else if (currentLength < targetLength - 50) {
        const remaining = targetLength - currentLength - 50;
        const truncated = this.smartSentenceTruncate(val, remaining);
        if (truncated) {
          parts.push(truncated);
          currentLength += truncated.length + 2;
        }
      }
    }

    // 3. 填充元数据（按优先级）
    const metaPriority = ['renderStyle', 'directorStyle', 'negativePrompt'];
    for (const key of metaPriority) {
      const val = meta[key];
      if (!val) continue;

      if (currentLength + val.length + 2 <= targetLength) {
        parts.push(val);
        currentLength += val.length + 2;
      } else if (currentLength < targetLength - 10) {
        const remaining = targetLength - currentLength - 10;
        const truncated = this.smartSentenceTruncate(val, remaining);
        if (truncated) {
          parts.push(truncated);
          currentLength += truncated.length + 2;
        }
      }
    }

    // 4. 如果还有剩余空间，扩展核心叙事（添加细节）
    const joined = parts.join(', ');
    if (joined.length < targetLength * 0.85) {
      return this.expandPrompt(joined, targetLength, core);
    }

    return joined;
  }

  /**
   * 组装技术参数文本
   */
  static assembleTechnical(technical) {
    const parts = [];
    if (technical.camera) parts.push(technical.camera);
    if (technical.lighting) parts.push(technical.lighting);
    return parts.join(', ');
  }

  /**
   * 智能句子截断：尽量保留完整语义单元
   * 优先在标点、连词、逗号处截断，不在单词中间截断
   */
  static smartSentenceTruncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;

    // 如果maxLength太小，直接截断并加省略号
    if (maxLength < 20) return text.slice(0, maxLength).trim();

    // 找到最佳截断点
    let cutPoint = maxLength;

    // 优先在句号、分号处截断
    const sentenceBreaks = ['。', '；', ';', '!', '.', '?'];
    for (let i = maxLength; i > maxLength * 0.6; i--) {
      if (sentenceBreaks.includes(text[i])) {
        cutPoint = i + 1;
        break;
      }
    }

    // 其次在逗号处截断
    if (cutPoint === maxLength) {
      const commaBreaks = ['，', ',', '、'];
      for (let i = maxLength; i > maxLength * 0.7; i--) {
        if (commaBreaks.includes(text[i])) {
          cutPoint = i + 1;
          break;
        }
      }
    }

    // 最后确保不在单词中间截断（找空格）
    if (cutPoint === maxLength) {
      for (let i = maxLength; i > maxLength * 0.8; i--) {
        if (text[i] === ' ') {
          cutPoint = i;
          break;
        }
      }
    }

    return text.slice(0, cutPoint).trim();
  }

  /**
   * 扩展提示词：当内容不足时智能补充到目标长度
   */
  static expandPrompt(currentPrompt, targetLength, coreFields) {
    const currentLength = currentPrompt.length;
    if (currentLength >= targetLength * 0.85) return currentPrompt;

    const gap = targetLength - currentLength - 10; // 留10字符缓冲
    if (gap < 20) return currentPrompt;

    // 生成扩展内容
    const expansions = this.generateExpansions(coreFields);

    let expanded = currentPrompt;
    for (const expansion of expansions) {
      if (expanded.length + expansion.length + 2 <= targetLength - 5) {
        expanded += ', ' + expansion;
      } else {
        const remaining = targetLength - expanded.length - 5;
        if (remaining > 15) {
          expanded += ', ' + this.smartSentenceTruncate(expansion, remaining);
        }
        break;
      }
    }

    return expanded;
  }

  /**
   * 基于核心字段生成扩展内容
   */
  static generateExpansions(coreFields) {
    const expansions = [];
    const { character, action, scene, mood } = coreFields;

    // 基于角色特征扩展细节
    if (character) {
      if (character.includes('战') || character.includes('war')) {
        expansions.push('battle-worn armor with intricate engravings');
      }
      if (character.includes('ancient') || character.includes('古')) {
        expansions.push('ancient mystical aura emanating from the body');
      }
    }

    // 基于动作扩展动态描述
    if (action) {
      if (action.includes('slow') || action.includes('缓')) {
        expansions.push('slow deliberate movement creating tension');
      }
    }

    // 基于场景扩展环境细节
    if (scene) {
      if (scene.includes('mountain') || scene.includes('山')) {
        expansions.push('mist swirling between jagged peaks');
      }
      if (scene.includes('ruin') || scene.includes('废墟')) {
        expansions.push('debris floating in the air from ancient destruction');
      }
    }

    // 🆕 v6.22-Peng-fix17: 移除所有硬编码通用增强器
    // 根因: genericEnhancers 无论 shot 内容如何都给每个 prompt 注入 Nirath/biosphere 等完全无关的内容
    // 修复: 只基于实际 shot 字段内容有针对性扩展，不使用通用增强器
    // 注释掉以下通用增强器:
    // const genericEnhancers = [
    //   'cinematic composition with depth of field',
    //   'atmospheric particles floating in dramatic lighting',
    //   'hyper-detailed textures visible in extreme close-up elements',
    //   'epic scale with environmental storytelling details',
    // ];
    // expansions.push(...shuffled.slice(0, 2));

    return expansions;
  }
}

// ============================================================================
// 模块3: 提示词组装器（替代原有 generateShotPrompt）
// ============================================================================
class PromptAssembler {
  constructor(options = {}) {
    this.targetLength = options.targetLength || 1000;
    this.minUtilization = options.minUtilization ?? 0.85;  // 🆕 v6.19-Peng: nullish coalescing确保0值有效，由expandPromptToTarget统一决策
    this.maxUtilization = options.maxUtilization || 0.99;
  }

  /**
   * 主入口：从shot对象生成完整提示词
   * 替代原有的 generateShotPrompt 函数
   */
  generate(shot) {
    // 1. 获取LLM增强描述（增加 scene/action fallback）
    // 根因修复：beat-sheet-generator 填了万能 description 模板，而正确内容在 shot.scene 字段
    // 策略：description 过短(<200字符)时，将 shot.scene 注入 rawDesc 供 PromptParser 提取
    const rawDesc = shot._llmEnhancedDescription
      || shot._llmEnhancedDesc
      || shot.enhancedDesc
      || shot.description
      || '';
    // 🆕 fix12-v1: 当 description 过短或疑似万能模板时，将 shot.scene/action 注入到 rawDesc
    // 🆕 v6.22-Peng-fix17: 增强placeholder检测 — 当字段内容为"未知xxx需补充"时也触发scene/action覆盖
    const PLACEHOLDER_PATTERN = /^未知|^待补充|^待描述|^未提供|^无$/;
    let finalRawDesc = rawDesc;
    const isPlaceholderField = (v) => PLACEHOLDER_PATTERN.test(String(v || '').trim());

    // 🆕 v6.24-fix27: placeholder检测也覆盖P1大写字段
    const hasPlaceholderField = isPlaceholderField(shot.Character) || isPlaceholderField(shot.Action) || isPlaceholderField(shot.Scene)
      || isPlaceholderField(shot.character) || isPlaceholderField(shot.action) || isPlaceholderField(shot.scene);
    if (!rawDesc || rawDesc.length < 200 || hasPlaceholderField) {
      // 🆕 fix-v6.26: Stage 3.5 LLM生成的小写英文字段优先，大写中文P1字段作为fallback
      const sceneContent = shot.scene || shot.Scene || shot.location || shot.setting || '';
      const actionContent = shot.action || shot.Action || shot.movement || shot.activity || '';
      // 🆕 fix13-v2增强: 当description疑似万能模板(≤200字符或含污染关键词)时，优先用scene/action重建描述
      const isLikelyTemplate = !rawDesc || rawDesc.length < 200 ||
        /光影变化|环境因异兽出现|小G的表情从平静|强烈尺度对比/.test(rawDesc);
      if (sceneContent && sceneContent.length > 30 && isLikelyTemplate) {
        // 🆕 fix13-v4: 当检测到万能模板时，不注入_rhythmEnhancement
        // 因为_rhythmEnhancement本身是从旧description继承的污染内容，scene优先重建时不使用
        const rhythmEnhancement = '';
        finalRawDesc = `Scene: ${sceneContent}. Action: ${actionContent || '镜头动作待描述'}. ${rhythmEnhancement}`;
        console.log(`  [PromptAssembler] 🔧 ${shot.id} description疑似万能模板(${rawDesc.length}字) → scene(${sceneContent.length}字)优先，清理污染`);
      }
    }

    // 2. 解析结构化字段
    const fields = PromptParser.parse(finalRawDesc);

    // 🆕 fix15-v1: 优先使用 shot 已有字段（Stage 3.5 已填充），避免依赖 description 推断
    // 🆕 v6.22-Peng-fix17: 增强 — 当解析结果为placeholder时也强制覆盖
    // 🆕 v6.22-Peng-fix17: 统一placeholder检测（避免重复声明）
    const PLACEHOLDER_PATTERN2 = /^未知|^待补充|^待描述|^未提供|^无$|^待.*补充$|^需.*补充$/;
    const isPlaceholder2 = (v) => PLACEHOLDER_PATTERN2.test(String(v || '').trim());
    // 🆕 fix-v6.26: Stage 3.5 LLM生成的小写英文字段优先，大写中文P1字段作为fallback
    // 小写字段=LLM英文内容，大写字段=StoryPlan中文泛化描述
    const P1_KEY_MAP = {
      character: 'Character', action: 'Action', scene: 'Scene',
      mood: 'Mood', camera: 'Camera', lighting: 'Lighting',
      negativePrompt: 'negativePrompt', renderStyle: 'renderStyle', directorStyle: 'directorStyle'
    };
    const shotFieldOverrides = {
      character: shot.character || shot.Character,
      action: shot.action || shot.Action,
      scene: shot.scene || shot.Scene,
      mood: shot.mood || shot.Mood,
      camera: shot.camera || shot.Camera,
      lighting: shot.lighting || shot.Lighting,
      negativePrompt: shot.negativePrompt,
      renderStyle: shot.renderStyle,
      directorStyle: shot.directorStyle
    };
    let overrideCount = 0;
    for (const [key, val] of Object.entries(shotFieldOverrides)) {
      // 🆕 v6.24-fix24: 优先用P1大写字段（有白泽具体内容），次用P2小写字段
      const p1Key = P1_KEY_MAP[key];
      const p1Val = p1Key ? shot[p1Key] : null;
      // 策略: P1有内容 → 用P1; P1无内容但P2有内容 → 用P2; 都没有 → 跳过
      const useVal = (p1Val && String(p1Val).trim().length > 0)
        ? String(p1Val).trim()
        : (val && String(val).trim().length > 0 ? String(val).trim() : null);
      if (useVal && (!fields[key] || String(fields[key]).trim().length === 0 || isPlaceholder2(fields[key]))) {
        fields[key] = useVal;
        overrideCount++;
      }
    }
    if (overrideCount > 0) {
      console.log(`  [PromptAssembler] 🆕 v6.24-fix24: P1大写字段优先覆盖 ${overrideCount} 个空字段`);
    }

    // 🆕 fix15-v2: 定妆照路径注入到字段中 (v2 路径)
    // 根因: v2 引擎 (PromptAssembler.generate) 完全跳过了 fix15-v2 原始路径的 CharacterRef 注入
    // 修复: 在 fields.characterRef 中填充 _characterRefs 的路径信息,SmartTruncator 会将其写入 prompt
    if (shot._characterRefs && Object.keys(shot._characterRefs).length > 0) {
      const maxRefsPerChar = 3;
      const refLines = [];
      for (const [charName, paths] of Object.entries(shot._characterRefs)) {
        if (!paths || paths.length === 0) continue;
        const trimmed = paths.slice(0, maxRefsPerChar);
        // 🆕 fix15-v5: 使用 P0 Character: 前缀,让闸机识别为 P0 Character 字段避免重复注入
        // 同时附加 Ref Images 路径,让 Seedance 能获取参考图
        const refStr = `P0 Character: ${charName} | Ref Images: ${trimmed.join(', ')}`;
        refLines.push(refStr);
        console.log(`  [PromptAssembler] 🆕 fix15-v2: 定妆照路径注入(${charName}, ${trimmed.length}张): ${require('path').basename(trimmed[0])}`);
      }
      if (refLines.length > 0) {
        fields.characterRef = refLines.join(' | ');
      }
    } else if (shot._characterRef && !fields.characterRef) {
      // 兑底: shot._characterRef 单字符串
      fields.characterRef = `P0 Character: ${shot._characterRef}`;
    }

    // 3. 记录解析结果供调试
    this.logParseResult(shot.id || 'unknown', fields);

    // 4. 智能截断与组装
    let finalPrompt = SmartTruncator.truncate(fields, this.targetLength);

    // 🆕 fix15-v6: SmartTruncator 默认按 core/technical/meta 分类，characterRef 丢
    // 修复: 在 truncate 后追加 characterRef,到目标长度内
    if (fields.characterRef && !finalPrompt.includes('CharacterRef:') && !finalPrompt.includes('Ref Images:')) {
      const charCount = (s) => [...s].length;
      const cr = fields.characterRef;
      // 缩到合理大小(原字符+定妆照路径可能长达 1500 字)
      const available = this.targetLength - charCount(finalPrompt);
      if (available > 50) {
        // 🆕 fix15-v9: 路径安全的 truncate — 在 path 之间 (', ') 断句，绝不切到 .png 中间
        // 原逻辑: cr.substring(0, available - 5) + '...' — 会切到路径中间 (e.g. '...produ...')
        // 修复: 从后往前查找 ', ' 分隔点, 保留到上一个完整路径
        let crTrimmed;
        if (charCount(cr) > available) {
          const slice = cr.substring(0, available - 5);
          // 查找最后个 ', ' 分割点
          const lastSep = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf(' | '));
          if (lastSep > available * 0.5) {
            crTrimmed = slice.substring(0, lastSep) + ', ...';
          } else {
            crTrimmed = slice + '...';
          }
        } else {
          crTrimmed = cr;
        }
        finalPrompt = finalPrompt + (finalPrompt ? ' | ' : '') + crTrimmed;
        console.log(`  [PromptAssembler] 🆕 fix15-v9: characterRef 路径安全裁断到 ${charCount(crTrimmed)}字`);
      } else {
        console.log(`  [PromptAssembler] ⚠️ fix15-v6: characterRef 无法追加 (可用${available}字)`);
      }
    }

    // 🆕 v6.20-fix4: 去除开头/结尾逗号和多余分隔符
    finalPrompt = finalPrompt.replace(/^\s*[,\|\s]+/, '').replace(/[,\|\s]+$/, '').replace(/,\s*,/g, ',').replace(/\|\s*\|/g, '|');

    // 🆕 v6.20-fix5: 去除 PromptAssembler 组装后的残留重复前缀
    // 处理 P0 Character（带P0前缀）的重复
    finalPrompt = finalPrompt.replace(/(\|\s*P0 Character[^|\n]*?)\s*(\|\s*P0 Character[^|\n]*)/g, '$1');
    finalPrompt = finalPrompt.replace(/(\bP0 Character[^|,\n]*?)\s*,\s*\1(?=[,\|\s]|$)/g, '$1');
    // 🆕 v6.20-fix5: 处理无P0前缀的 "Character: xxx" 重复（根因：S03出现 "Character: zhulong, Character: zhulong"）
    finalPrompt = finalPrompt.replace(/(\bCharacter:[^|,\n]*?)\s*,\s*\1(?=[,\|\s]|$)/g, '$1');
    finalPrompt = finalPrompt.replace(/(\bCharacter:[^|,\n]*?)\s*\|\s*\1(?=[,\|\s]|$)/g, '$1');

    // 5. 最终校验
    const validation = PromptValidator.validate(finalPrompt, fields);

    return {
      prompt: finalPrompt,
      fields,
      validation,
      utilization: (finalPrompt.length / this.targetLength * 100).toFixed(1),
    };
  }

  logParseResult(shotId, fields) {
    const filled = Object.entries(fields)
      .filter(([, v]) => v && v.length > 0)
      .map(([k]) => k);
    const missing = Object.keys(fields).filter(k => !filled.includes(k));
    console.log(`[PromptAssembler] Shot ${shotId} 解析结果:`);
    console.log(`  已解析字段 (${filled.length}/9): ${filled.join(', ')}`);
    if (missing.length > 0) {
      console.log(`  缺失字段: ${missing.join(', ')}`);
    }
  }
}

// ============================================================================
// 模块4: 验证器
// ============================================================================
class PromptValidator {
  /**
   * 三重验证：字段完整性 + 长度利用率 + 信息密度
   */
  static validate(finalPrompt, originalFields) {
    return {
      fieldCompleteness: this.validateFields(originalFields),
      lengthCheck: this.validateLength(finalPrompt),
      densityScore: this.calculateDensity(finalPrompt, originalFields),
    };
  }

  /**
   * 验证8个核心字段是否都存在
   */
  static validateFields(fields) {
    const required = ['character', 'action', 'scene', 'mood', 'camera', 'lighting', 'negativePrompt', 'renderStyle', 'directorStyle'];
    const present = required.filter(k => fields[k] && fields[k].length > 5);
    return {
      passed: present.length >= 7, // 允许1个字段缺失（NegativePrompt有时可省略）
      total: required.length,
      present: present.length,
      missing: required.filter(k => !fields[k] || fields[k].length <= 5),
      score: present.length / required.length,
    };
  }

  /**
   * 验证长度是否在目标范围内
   */
  static validateLength(prompt, targetLength = 1000) {
    const len = prompt.length;
    const utilization = len / targetLength;
    return {
      length: len,
      target: targetLength,
      utilization: (utilization * 100).toFixed(1) + '%',
      passed: utilization >= 0.85 && utilization <= 0.99,
      status: utilization < 0.85 ? 'UNDERFLOW' : utilization > 0.99 ? 'OVERFLOW' : 'OPTIMAL',
    };
  }

  /**
   * 计算信息密度分数
   * 核心叙事内容占比越高，分数越高
   */
  static calculateDensity(finalPrompt, fields) {
    const coreTerms = [
      fields.character, fields.action, fields.scene, fields.mood
    ].filter(Boolean).join(' ');
    if (!coreTerms || !finalPrompt) return 0;

    // 计算核心词汇在最终prompt中的覆盖率
    const coreWords = coreTerms.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const promptLower = finalPrompt.toLowerCase();

    let matched = 0;
    for (const word of coreWords) {
      if (promptLower.includes(word)) matched++;
    }

    const density = coreWords.length > 0 ? matched / coreWords.length : 0;

    return {
      score: (density * 100).toFixed(1) + '%',
      passed: density >= 0.7,
      coreWordsTotal: coreWords.length,
      coreWordsPreserved: matched,
    };
  }
}

// ============================================================================
// 模块5: 快速修复函数（直接替换原有代码）
// ============================================================================
/**
 * 直接替换你现有的 generateShotPrompt 函数
 * 使用方法：把原来的函数内容替换成这个函数的实现
 */
function generateShotPrompt_v2(shot, options = {}) {
  const assembler = new PromptAssembler({
    targetLength: options.targetLength || 1000,  // 🆕 v6.19-Peng: 统一1000基准
    minUtilization: 0,  // 🆕 v6.19-Peng: 禁用截断，由expandPromptToTarget统一决策
    ...options
  });
  return assembler.generate(shot);
}

/**
 * 替换原有的 expandPromptToTarget 函数
 */
function expandPromptToTarget_v2(fields, currentPrompt, targetLength = 1000) {
  return SmartTruncator.truncate(fields, targetLength);
}

// ============================================================================
// 导出（Node.js / ES Module 兼容）
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PromptParser,
    SmartTruncator,
    PromptAssembler,
    PromptValidator,
    generateShotPrompt_v2,
    expandPromptToTarget_v2,
  };
}