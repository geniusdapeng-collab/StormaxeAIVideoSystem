/**
 * Prompt字段标准规范模块 v1.4-Peng-fix16
 * 
 * 定位：全链路统一的Prompt字段标准配置
 * 被引用：生成环节、导演优化、编剧优化、字段精简Agent
 * 作用：确保所有环节使用同一套字段定义、优先级、精简策略
 * 
 * 2026-06-10: v1.5-Peng — 六维方法论升级
 *   - 新增PhysicsLayer字段（水体/大气/材质/柔体物理描述）
 *   - 新增ColorScience字段（12种标准色彩方案+色温控制）
 *   - Camera字段接入完整词库（机位12级/运镜14种/光学参数）
 *   - Lighting字段标准化三要素格式（位置+性质+效果）
 *   - Scene字段接入五维空间描述法
 * 2026-06-07: v1.4-Peng-fix16 — 提示词英文统一 + 1000词限制
 *   - 10个字段description/examples/mustContain/forbiddenActions全部英文
 *   - Dialogue TEXT保留中文台词
 *   - TARGET_MAX 980→1000
 * 2026-06-06: v1.3-Peng-fix3 — 元数据字段修复（fix3）
 *   - 新增CharacterRef字段（P0绝不截断，用于定妆照绑定）
 *   - 新增Timeline字段（P1绝不截断，时间轴完整保留）
 *   - 新增Dialogue字段（P0绝不截断，台词完整保留）
 *   - 新增AudioLayer字段（P1，S00开场白专用）
 * 2026-05-31: v1.2-Peng-fix — 极简锚点模式适配
 *   - Character字段从minChars:80→30, standardChars:120→40
 *   - 适配dual-character-anchor.js极简锚点模式
 *   - 核心特征足够LLM识别，详细描述由LLM核心叙事生成
 * 2026-05-31: 创建，初始版本v1.0-Peng
 */

class PromptFieldStandard {
  constructor() {
    this.version = 'v1.5-Peng';

    // ========== 🆕 元数据字段 v1.0-fix3 ==========
    // 2026-06-06 fix3: 定妆照绑定、时间轴、台词、S00开场白
    this.META_FIELDS = [
      {
        name: 'CharacterRef',
        priority: 0,
        priorityLabel: '🔴 P0',
        description: '角色定妆照绑定：image://路径，每角色最多9张，必须包含角色特征关键张',
        minChars: 40,
        standardChars: 100,
        maxChars: 300,
        isEssential: true,
        trimStrategy: 'never',
        canDeleteContent: false,
        canTrimDetail: false,
        examples: [
          'character_ref: image://global-character-references/xiaoG/07-dynamic-walking.png',
          'character_ref: image://productions/xingtian/03-characters/刑天-正面全身.png'
        ],
        mustContain: ['image://', 'character_ref']
      },
      {
        name: 'Timeline',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: 'Timeline: mark shot start/end time, duration, type, mood',
        minChars: 40,
        standardChars: 60,
        maxChars: 100,
        isEssential: true,
        trimStrategy: 'never',
        canDeleteContent: false,
        canTrimDetail: false,
        examples: [
          'timeline: [0:08-0:14] duration: 6s type: normal mood: curious'
        ],
        mustContain: ['duration', 'type']
      },
      {
        name: 'Dialogue',
        priority: 0,
        priorityLabel: '🔴 P0',
        description: 'Character dialogue: SPEAKER + speech TYPE + EMOTION tag + LIP_SYNC marker. NO voiceover/narration, only character spoken lines',
        minChars: 60,
        standardChars: 100,
        maxChars: 150,
        isEssential: true,
        trimStrategy: 'keep_core_dialogue',
        canDeleteContent: false,
        canTrimDetail: true,
        examples: [
          'SPEAKER: 小G | TYPE: monologue | EMOTION: curious | TEXT: "指南针……你在找什么？" | LIP_SYNC: YES | 口型情绪: curious'
        ],
        mustContain: ['SPEAKER', 'TEXT', 'LIP_SYNC']
      },
      {
        name: 'AudioLayer',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: '音频层：仅S00使用，开场神兽/旁白开场白，含时间段（跨镜头延续）',
        minChars: 30,
        standardChars: 60,
        maxChars: 120,
        isEssential: false,
        trimStrategy: 'keep_core_audio',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'audio_layer: Nirath Guide开场白 [0:00-0:21] 跨镜头延续'
        ],
        mustContain: ['[0:00-']
      }
    ];
    
    // ========== 镜头语言标准术语表 v1.0-Peng ==========
    this.CINEMATIC_TERMS = {
      shotSize: {
        recommended: ['extreme close-up', 'close-up', 'medium shot', 'medium wide', 'wide shot', 'extreme wide', 'establishing'],
        avoid: ['近景', '大画面', '半身', '全身']
      },
      cameraMovement: {
        recommended: ['dolly in/out', 'crane up/down', 'handheld', 'steadicam', 'static', 'pan left/right', 'tilt up/down', 'tracking', 'orbital'],
        avoid: ['push camera', 'fly through', 'move around', 'go closer']
      },
      lens: {
        recommended: ['24mm wide', '50mm standard', '85mm portrait', '135mm telephoto', 'macro'],
        avoid: ['zoom in/out', 'wide angle', 'long lens']
      },
      speed: {
        recommended: ['slow motion', 'real-time', 'time-lapse', 'speed ramp', 'static'],
        avoid: ['very slow', 'fast', 'quickly', 'slowly']
      }
    };
    
    // 字数目标（按大鹏规则：汉字=2字符，英文=1字符）
    this.TARGET_MIN = 4500;   // 约90%利用率
    this.TARGET_MAX = 5500;   // 目标上限
    this.TARGET_IDEAL = 5000; // 理想值
    
    // 8个标准字段定义（按优先级排序）
    // ========== 10字段标准定义 v1.1-Peng (审阅后修订) ==========
    this.FIELDS = [
      {
        name: 'Dialogue',
        priority: 0,
        priorityLabel: '🔴 P0',
        description: 'Character dialogue: SPEAKER + speech TYPE + EMOTION tag + LIP_SYNC marker. NO voiceover/narration, only character spoken lines',
        minChars: 60,
        standardChars: 100,
        maxChars: 150,
        isEssential: true,
        trimStrategy: 'keep_core_dialogue',
        canDeleteContent: false,
        canTrimDetail: true,
        examples: [
          '- SPEAKER: 小G | TYPE: 低语 | EMOTION: 紧张 | TEXT: "那是什么..." | LIP_SYNC: YES | 口型情绪: 下唇微颤, 语速放慢, 尾音上扬带疑问'
        ],
        mustContain: ['SPEAKER', 'TEXT', 'LIP_SYNC'],
        forbiddenActions: ['删除角色台词', '添加旁白/解说', '删除LIP_SYNC标记']
      },
      {
        name: 'Character',
        priority: 0,
        priorityLabel: '🔴 P0',
        description: '角色核心特征（极简锚点优先）：种族/物种 + 3-5个核心视觉关键词，禁止详细描述',
        minChars: 30,
        standardChars: 40,
        maxChars: 80,
        isEssential: true,
        trimStrategy: 'minimal_anchor_only',
        canDeleteContent: false,
        canTrimDetail: true,
        examples: [
          'headless torso, breast-eyes, navel-mouth, war-axe, shield'
        ],
        mustContain: ['race/species', 'core visual keywords'],
        forbiddenActions: ['delete core clothing color', 'delete key accessory name', 'delete race description', 'add detailed description (e.g. fifteen meters, six eyes, lava)']
      },
      {
        name: 'Action',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: 'Action performance: core actions, body movement, environment interaction',
        minChars: 60,
        standardChars: 80,
        maxChars: 100,
        isEssential: false,
        trimStrategy: 'keep_core_verb_object',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'fingers tracing compass engravings, body leaning forward over hexagonal altar, weight shifting to toes'
        ],
        mustContain: ['core verb', 'interaction target'],
        forbiddenActions: ['delete all action descriptions', 'delete core interaction']
      },
      {
        name: 'Scene',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: 'Scene environment: five-dimension spatial (macro geography + meso landform + micro material + weather/time + spatial depth) + physics enhancement',
        minChars: 120,
        standardChars: 170,
        maxChars: 220,
        isEssential: false,
        trimStrategy: 'keep_core_location',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'crystalline metallic canyon labyrinth, hexagonal volcanic rock fractures, bioluminescent spore clouds drifting, twin sunset casting purple-gold rim light.'
        ],
        mustContain: ['地点', '≥2种材质细节'],
        forbiddenActions: ['delete core location', 'delete all material details']
      },
      {
        name: 'Mood',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: '情绪氛围：3-5个情绪关键词',
        minChars: 20,
        standardChars: 40,
        maxChars: 60,
        isEssential: false,
        trimStrategy: 'keyword_list',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'mysterious, epic, awe, ancient awakening, destiny'
        ],
        mustContain: ['3-5个情绪关键词'],
        forbiddenActions: ['keep long sentence descriptions']
      },
      {
        name: 'Camera',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: 'Camera: 12-level height system + 14 movement types + optical parameters (focal length/aperture/format) + speed control',
        minChars: 80,
        standardChars: 120,
        maxChars: 160,
        isEssential: false,
        trimStrategy: 'keep_core_movement',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          '85mm macro tracking across compass glass surface, slow dolly in, speed ramp at light-flare explosion.'
        ],
        mustContain: ['shot size', 'core movement term'],
        forbiddenActions: ['delete shot size', 'delete core movement direction']
      },
      {
        name: 'Lighting',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: '光影方案：主光方向+色温数值、核心特效光',
        minChars: 60,
        standardChars: 100,
        maxChars: 140,
        isEssential: false,
        trimStrategy: 'keep_main_light_temp',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          '3200K purple-gold rim light from behind, 6500K cool blue ambient fill, 2700K pulsing energy glow.'
        ],
        mustContain: ['主光方向', '色温数值(K)'],
        forbiddenActions: ['删除主光方向', '删除色温K值', '删除核心特效光']
      },
      {
        name: 'PhysicsLayer',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: 'Physics layer: water/atmosphere/material/softbody physics descriptors — replaces vague adjectives with physical processes',
        minChars: 40,
        standardChars: 80,
        maxChars: 120,
        isEssential: false,
        trimStrategy: 'keep_core_physics',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'water physics: breaking wave, white foam, caustic light patterns | atmosphere: volumetric fog, god rays | softbody: cloth billowing in wind',
          'material physics: weathered stone surface, subsurface scattering | dynamic: ice cracking, water droplets bouncing'
        ],
        mustContain: ['physics type', 'physical descriptor'],
        forbiddenActions: ['replace physics terms with vague adjectives']
      },
      {
        name: 'ColorScience',
        priority: 1,
        priorityLabel: '🟡 P1',
        description: 'Color science: 12 standard palettes (Teal&Orange/Neon Noir/Earth Tones etc) + color temperature + scene-adaptive mapping',
        minChars: 50,
        standardChars: 80,
        maxChars: 120,
        isEssential: false,
        trimStrategy: 'keep_palette_temp',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'color_palette: teal shadows + amber highlights + gold accents | color_temp: 3200K warm golden | mood: epic cinematic',
          'color_palette: deep purple shadows + neon cyan highlights + magenta accents | color_temp: 8000K cool blue | mood: cyberpunk noir'
        ],
        mustContain: ['palette', 'color temperature', 'mood'],
        forbiddenActions: ['use conflicting color descriptions', 'delete color temperature']
      },
      {
        name: 'NegativePrompt',
        priority: 2,
        priorityLabel: '🟢 P2',
        description: 'Negative prompt: visual elements to exclude, technical flaws',
        minChars: 50,
        standardChars: 65,
        maxChars: 80,
        isEssential: false,
        trimStrategy: 'keep_project_exclusions',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'no deformed hands, no extra limbs, no modern objects, no text watermark, no cartoon style, no flat lighting'
        ],
        mustContain: ['exclusion list'],
        forbiddenActions: ['delete all exclusion items']
      },
      {
        name: 'RenderStyle',
        priority: 2,
        priorityLabel: '🟢 P2',
        description: 'Render style: overall visual style, quality statement, character-background consistency',
        minChars: 30,
        standardChars: 40,
        maxChars: 60,
        isEssential: false,
        trimStrategy: 'keep_style_core',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'photorealistic cinematic, 4K UHD, subtle film grain, character CG hyper-realistic with background real location filming'
        ],
        mustContain: ['style statement', 'quality statement'],
        forbiddenActions: ['delete style statement', 'delete quality statement']
      },
      {
        name: 'DirectorStyle',
        priority: 3,
        priorityLabel: '🔵 P3',
        description: '导演风格：导演标识+1-2项风格参数',
        minChars: 15,
        standardChars: 30,
        maxChars: 50,
        isEssential: false,
        trimStrategy: 'keep_director_tag',
        canDeleteContent: true,
        canTrimDetail: true,
        examples: [
          'Cameron-scale contrast, rim lighting emphasis'
        ],
        mustContain: ['director signature'],
        forbiddenActions: ['delete director name']
      }
    ];
    
    // 字段映射（快速查找）
    this.FIELD_MAP = {};
    this.FIELDS.forEach(f => {
      this.FIELD_MAP[f.name] = f;
    });
    
    // 🆕 fix3: 元数据字段初始化
    this.META_FIELDS.forEach(f => {
      this.FIELD_MAP[f.name] = f;
    });

    // 分隔符
    this.SEPARATOR = ' | ';
    
    // 冗余词汇库（可安全删除）
    this.REDUNDANT_WORDS = [
      'very', 'extremely', 'absolutely', 'definitely', 'quite', 'really', 'incredibly',
      'highly', 'particularly', 'especially', 'significantly', 'substantially',
      'beautifully', 'perfectly', 'precisely', 'exactly', 'clearly',
      '极其', '非常', '特别', '绝对', '确实', '真的', '相当', '十分', '格外',
      '精心', '细致', '完美', '精确', '准确', '明显', '显著',
      '很很', '非常非常', '特别特别', '极其极其'
    ];
    
    // 可精简的长句模式（替换为短词）
    this.SIMPLIFICATION_PATTERNS = [
      { pattern: /with a sense of \w+/gi, replacement: '' },
      { pattern: /creating an atmosphere of \w+/gi, replacement: '' },
      { pattern: /which makes the scene feel \w+/gi, replacement: '' },
      { pattern: /giving the impression of \w+/gi, replacement: '' },
      { pattern: /在[^，。]+方面/g, replacement: '' },
      { pattern: /呈现出[^，。]+的状态/g, replacement: '' },
      { pattern: /营造出[^，。]+的氛围/g, replacement: '氛围: ' },
    ];
  }

  /**
   * 获取字段定义
   */
  getField(name) {
    return this.FIELD_MAP[name] || null;
  }

  /**
   * 按优先级排序的字段列表（P0→P3）
   */
  getFieldsByPriority() {
    return [...this.FIELDS].sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取某优先级的所有字段
   */
  getFieldsOfPriority(priority) {
    return this.FIELDS.filter(f => f.priority === priority);
  }

  /**
   * 获取精简优先级列表（从低到高，即先精简P3，最后精简P0）
   */
  getTrimPriorityOrder() {
    return [...this.FIELDS]
      .filter(f => !f.isEssential)  // 排除绝不可删除的
      .sort((a, b) => b.priority - a.priority);  // P3→P2→P1
  }

  /**
   * 检查字段是否存在于Prompt中
   */
  /**
   * 检查字段是否存在于Prompt中（支持 P0/P1/P2/P3 前缀）
   * 例如: hasField(prompt, 'Dialogue') 匹配 "Dialogue:" 或 "P0 Dialogue:" 或 "P1 Dialogue:"
   */
  hasField(prompt, fieldName) {
    // 匹配 fieldName: 或 P0/P1/P2/P3 fieldName: 或 【fieldName】 格式
    const regex = new RegExp(`(?:P\\d+ )?${fieldName}[:：]\\s*|\\[${fieldName}\\]`, 'i');
    return regex.test(prompt);
  }

  /**
   * 提取字段内容（支持 P0/P1/P2/P3 前缀）
   */
  extractField(prompt, fieldName) {
    // 匹配可选的P前缀 + fieldName + 内容（到下一字段或字符串末尾）
    const fieldNames = this.FIELDS.map(f => f.name).join('|');
    const regex = new RegExp(`(?:P\\d+ )?${fieldName}[:：]\\s*(.+?)(?=(?:P\\d+ )?(?:${fieldNames})[:：]|$)`, 'i');
    const match = prompt.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * 统计Prompt中的字段
   */
  analyzeFields(prompt) {
    const result = {
      present: [],
      missing: [],
      fieldLengths: {},
      totalLength: prompt.length,
      fieldCount: 0
    };
    
    this.FIELDS.forEach(field => {
      if (this.hasField(prompt, field.name)) {
        result.present.push(field.name);
        const content = this.extractField(prompt, field.name);
        result.fieldLengths[field.name] = content ? content.length : 0;
        result.fieldCount++;
      } else {
        result.missing.push(field.name);
      }
    });
    
    return result;
  }

  /**
   * 校验Prompt是否符合标准
   */
  validate(prompt) {
    const analysis = this.analyzeFields(prompt);
    const errors = [];
    
    // 检查缺失字段
    if (analysis.missing.length > 0) {
      errors.push(`缺失字段: ${analysis.missing.join(', ')}`);
    }
    
    // 检查字符数
    if (prompt.length < this.TARGET_MIN) {
      errors.push(`字符数不足: ${prompt.length} < ${this.TARGET_MIN}`);
    }
    if (prompt.length > this.TARGET_MAX) {
      errors.push(`字符数超标: ${prompt.length} > ${this.TARGET_MAX}`);
    }
    
    // 检查每个字段长度
    analysis.present.forEach(fieldName => {
      const field = this.getField(fieldName);
      const length = analysis.fieldLengths[fieldName];
      if (field && length < field.minChars) {
        errors.push(`${fieldName}字段过短: ${length} < ${field.minChars}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      analysis,
      utilization: (prompt.length / this.TARGET_MAX * 100).toFixed(1) + '%'
    };
  }

  /**
   * 获取精简策略说明（用于LLM System Prompt）
   */
  getTrimStrategyForLLM() {
    const lines = [];
    lines.push('## Prompt字段精简优先级（从低到高，先精简低优先级）');
    lines.push('');
    
    this.getTrimPriorityOrder().forEach(field => {
      lines.push(`${field.priorityLabel} ${field.name}（${field.description}）`);
      lines.push(`  - 精简策略: ${field.trimStrategy}`);
      lines.push(`  - 可删除: ${field.canDeleteContent ? '次要内容' : '仅冗余形容词'}`);
      lines.push(`  - 字符数范围: ${field.minChars}-${field.maxChars}（标准${field.standardChars}）`);
      lines.push(`  - 必须保留: ${field.mustContain.join(', ')}`);
      lines.push(`  - 禁止: ${field.forbiddenActions.join(', ')}`);
      lines.push('');
    });
    
    lines.push('## 绝对规则');
    lines.push('1. 绝不可删除的字段（P0）: Dialogue, Character');
    lines.push('2. 绝不可删除的内容: 核心台词、种族描述、核心服装色、关键配饰名称');
    lines.push('3. 字段分隔符: " | "，截断只能在分隔符处，绝不在字段中间');
    lines.push(`4. 总字符数目标: ${this.TARGET_MIN}-${this.TARGET_MAX}（理想${this.TARGET_IDEAL}）`);
    lines.push('5. 精简时只改变表达方式，不改变核心视觉信息');
    lines.push('6. **极简锚点模式**: Character字段只需3-5个核心视觉关键词（如"headless torso, breast-eyes, war-axe"），禁止详细描述（如"十五米高的巨型身躯"）');
    lines.push('7. **核心特征足够**: 3-5个关键词已足够LLM识别角色，详细描述会浪费Prompt空间');
    
    return lines.join('\n');
  }

  /**
   * 获取生成标准说明（用于生成环节）
   */
  getGenerationStandardForLLM() {
    const lines = [];
    lines.push('## Prompt字段生成标准（必须按此顺序和格式）');
    lines.push('');
    
    this.FIELDS.forEach(field => {
      const pLabel = field.priority === 0 ? '必须' : field.priority === 1 ? '核心' : field.priority === 2 ? '重要' : '可选';
      lines.push(`[${pLabel}] ${field.name}: ${field.description}`);
      lines.push(`  - 建议字符数: ${field.standardChars}（范围${field.minChars}-${field.maxChars}）`);
      lines.push(`  - 必须包含: ${field.mustContain.join(', ')}`);
      lines.push(`  - 示例: ${field.examples[0]}`);
      lines.push('');
    });
    
    lines.push('## 格式要求');
    lines.push(`字段之间用 "${this.SEPARATOR}" 分隔`);
    lines.push(`总字符数必须控制在 ${this.TARGET_MIN}-${this.TARGET_MAX} 之间`);
    lines.push('每个字段内容必须提供具体的可拍摄信息，禁止抽象形容词堆砌');
    lines.push('## 极简锚点模式（Character字段专用）');
    lines.push('Character字段采用极简锚点格式：种族/物种 + 3-5个核心视觉关键词');
    lines.push('示例：刑天 → "headless torso, breast-eyes, navel-mouth, war-axe, shield"（40字）');
    lines.push('示例：小G → "yellow jacket, compass, child"（25字）');
    lines.push('禁止：详细描述（如"十五米高的巨型身躯"）、完整外貌描写、多余形容词');
    lines.push('原因：3-5个关键词已足够LLM识别角色，详细描述由LLM核心叙事生成');
    
    return lines.join('\n');
  }

  /**
   * 获取字段优先级标签
   */
  getPriorityLabel(priority) {
    const labels = { 0: '🔴 P0', 1: '🟡 P1', 2: '🟢 P2', 3: '🔵 P3' };
    return labels[priority] || '⚪ P?';
  }

  /**
   * 获取标准字符数分配表（用于审核）
   */
  getCharAllocationTable() {
    return this.FIELDS.map(f => ({
      field: f.name,
      description: f.description,
      priority: f.priorityLabel,
      min: f.minChars,
      standard: f.standardChars,
      max: f.maxChars,
      essential: f.isEssential
    }));
  }
}

module.exports = PromptFieldStandard;