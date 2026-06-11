#!/usr/bin/env node
/**
 * Nirath原创世界观感官词汇生成器 — Shanhaijing Sensory Vocabulary Generator
 * 
 * ⚠️ 重要声明：这是【山海经专用子系统】，感官词汇与特定异兽绑定为设计意图
 * ⚠️ 通用视频分支（FPV/科普/广告）请勿引用此文件
 * ⚠️ associatedBeasts等硬编码为Nirath世界观预期设计，非系统漏洞
 * 
 * 将故事内核的文学化感官词汇转化为Seedance可执行的渲染提示词
 * 视觉：灵晕/锈光/骨白/渊蓝/荧绿 → 英文/中文渲染参数
 * 听觉：灵嗡/骨响/狐吟/渊默/龙吟 → 声音设计指令
 */

// ============ 视觉词汇→渲染提示词映射 ============
const VISUAL_VOCABULARY_PROMPTS = {
  linghun: {
    name: '灵晕',
    chinese: '光脉能量光晕',
    description: '异兽或灵物周围散发的柔和光芒，如呼吸般起伏',
    seedancePrompt: 'soft golden aura glowing around creature, volumetric lighting, subtle edge bloom, breathing glow rhythm, ethereal light particles floating, warm ambient illumination',
    seedancePromptCN: '柔和金色光晕围绕生物，体积光，边缘微泛光，呼吸般起伏发光，空灵光粒子漂浮，温暖环境照明',
    parameters: {
      glowIntensity: 0.6,
      colorTemperature: 'warm',
      edgeBloom: 0.3,
      particleDensity: 0.4,
      animation: 'breathing_rhythm'
    },
    associatedBeasts: ['dijiang', 'baize', 'fenghuang', 'jiuweihu'],
    associatedRegions: ['nanshan', 'zhongshan'],
    emotionalContext: '温暖、神秘、神圣',
    usage: '异兽出场/光脉能量流动/神圣时刻'
  },
  xiuguang: {
    name: '锈光',
    chinese: '废墟锈光',
    description: '旧世界科技废墟表面反射的金属光泽，带有氧化痕迹',
    seedancePrompt: 'oxidized metallic surface with orange-brown rust patches, specular highlights on corroded steel, industrial decay aesthetic, cold blue-green ambient light reflecting off rust',
    seedancePromptCN: '氧化金属表面，橙褐色锈斑，腐蚀钢材上的镜面高光，工业衰败美学，冷蓝绿色环境光反射在锈迹上',
    parameters: {
      roughness: 0.9,
      metallic: 0.7,
      colorTemperature: 'cold',
      specularIntensity: 0.4,
      decayLevel: 0.8
    },
    associatedBeasts: ['taotie', 'qiongqi'],
    associatedRegions: ['xishan', 'hainei'],
    emotionalContext: '衰败、记忆、工业遗迹',
    usage: '旧世界场景/科技废墟/金属异兽'
  },
  gubai: {
    name: '骨白',
    chinese: '骨白色',
    description: '苍白如骨骼的冷白色调，常用于死亡/终极/褪色世界场景',
    seedancePrompt: 'bone-white desaturated palette, cold pale lighting, skeletal texture surfaces, deathly still atmosphere, minimal contrast, ghostly white fog',
    seedancePromptCN: '骨白去饱和色调，冷苍白光线，骨骼质感表面，死寂氛围，最小对比度，幽灵白雾',
    parameters: {
      saturation: 0.1,
      brightness: 0.7,
      contrast: 0.3,
      colorTemperature: 'cold',
      atmosphere: 'deathly_still'
    },
    associatedBeasts: ['gudiao'],
    associatedRegions: ['dahuang'],
    emotionalContext: '死亡、终极、褪色',
    usage: '大荒经/死亡场景/终极审判'
  },
  yuanlan: {
    name: '渊蓝',
    chinese: '深渊蓝',
    description: '深海或深渊般的幽蓝色，带有吞噬感和未知恐惧',
    seedancePrompt: 'abyssal deep blue tone, crushing darkness depth, bioluminescent particles in deep water, cavernous underwater void, cold pressure atmosphere, mysterious blue-black gradient',
    seedancePromptCN: '深渊深蓝色调，压迫性黑暗深度，深海生物发光粒子，洞穴式水下虚空，冷压氛围，神秘蓝黑渐变',
    parameters: {
      saturation: 0.8,
      brightness: 0.2,
      depth: 0.9,
      colorTemperature: 'cold',
      atmosphere: 'crushing_depth'
    },
    associatedBeasts: ['jiaoren', 'xuangui'],
    associatedRegions: ['beishan', 'hainei'],
    emotionalContext: '深邃、未知、恐惧',
    usage: '深海场景/水下洞穴/深渊凝视'
  },
  yinglv: {
    name: '荧绿',
    chinese: '荧光绿',
    description: '幽暗环境中的荧光绿色，常见于有毒/神秘/异化场景',
    seedancePrompt: 'toxic fluorescent green glow, bioluminescent organic patterns, eerie green light in darkness, swamp-like luminescence, mysterious alien flora glow, sickly green atmosphere',
    seedancePromptCN: '有毒荧光绿光芒，生物发光有机图案，黑暗中诡异绿光，沼泽般发光，神秘外星植物光芒，病态绿色氛围',
    parameters: {
      saturation: 0.9,
      hue: 'green',
      glowIntensity: 0.7,
      colorTemperature: 'toxic',
      atmosphere: 'eerie_bioluminescence'
    },
    associatedBeasts: ['zheng'],
    associatedRegions: ['haiwai'],
    emotionalContext: '诡异、有毒、异化',
    usage: '海外经/有毒沼泽/异化植物/凶兽领域'
  }
};

// ============ 听觉词汇→声音设计映射 ============
const AUDITORY_VOCABULARY_PROMPTS = {
  lingweng: {
    name: '灵嗡',
    chinese: '光脉能量嗡鸣',
    description: '光脉能量流动时产生的低频嗡鸣声，如大地呼吸',
    soundDesign: 'Low-frequency drone (60-120Hz), subtle harmonic overtones, breathing-like rhythm, ambient energy hum, no melody',
    soundDesignCN: '低频嗡鸣(60-120Hz)，微妙谐波泛音，呼吸般节奏，环境能量嗡鸣，无旋律',
    technical: {
      frequency: '60-120Hz',
      waveform: 'sine_with_harmonics',
      rhythm: 'breathing_4s_cycle',
      spatial: 'omnidirectional',
      dynamicRange: 'soft_to_medium'
    },
    associatedBeasts: ['dijiang', 'zhulong'],
    associatedRegions: ['nanshan', 'zhongshan'],
    emotionalContext: '神圣、宏大、持续',
    usage: '光脉能量流动/异兽呼吸/神圣场景背景音'
  },
  guxiang: {
    name: '骨响',
    chinese: '骨响',
    description: '骨骼碰撞或摩擦的声音，带有干涩、清脆的质感',
    soundDesign: 'Dry bone clacking, hollow resonance, brittle texture, sharp attack with quick decay, occasional creaking',
    soundDesignCN: '干涩骨骼碰撞声，空心共鸣，脆性质感，锐利起音+快速衰减，偶尔吱嘎声',
    technical: {
      frequency: '2000-8000Hz',
      waveform: 'noise_with_impulse',
      rhythm: 'irregular_sparse',
      spatial: 'close_miked',
      dynamicRange: 'sharp_transients'
    },
    associatedBeasts: ['gudiao', 'taotie'],
    associatedRegions: ['dahuang', 'xishan'],
    emotionalContext: '死亡、干枯、恐惧',
    usage: '死亡场景/骨骼异兽/废墟探索'
  },
  huyin: {
    name: '狐吟',
    chinese: '狐吟',
    description: '九尾光狐发出的介于呜咽和歌唱之间的声音，带有魅惑感',
    soundDesign: 'Ethereal vocalization between whimper and song, sliding pitches, breathy texture, haunting melody fragments, reverberant tail',
    soundDesignCN: '空灵发声介于呜咽与歌唱之间，滑音，气息质感，萦绕旋律片段，混响尾音',
    technical: {
      frequency: '400-2000Hz',
      waveform: 'vocal_formant',
      rhythm: 'flowing_irregular',
      spatial: 'wide_stereo',
      dynamicRange: 'soft_to_loud'
    },
    associatedBeasts: ['jiuweihu'],
    associatedRegions: ['nanshan'],
    emotionalContext: '魅惑、孤独、哀伤',
    usage: '九尾光狐出场/幻术时刻/情感交流'
  },
  yuanmo: {
    name: '渊默',
    chinese: '渊默',
    description: '深渊般的绝对寂静，带有压迫性的沉默',
    soundDesign: 'Near-total silence with subtle sub-bass pressure (-60dB floor), occasional deep water drip, crushing weight of absence',
    soundDesignCN: '接近完全寂静，微妙次低音压迫(-60dB底噪)，偶尔深水水滴声，缺失的碾压感',
    technical: {
      frequency: 'sub_bass',
      waveform: 'silence_with_subtle_pressure',
      rhythm: 'almost_none',
      spatial: 'immersive_3d',
      dynamicRange: 'extreme_dynamic'
    },
    associatedBeasts: ['jiaoren'],
    associatedRegions: ['beishan', 'hainei'],
    emotionalContext: '恐惧、未知、压迫',
    usage: '深渊场景/水下沉默/终极恐惧'
  },
  longyin: {
    name: '龙吟',
    chinese: '龙吟',
    description: '龙类发出的长啸，带有金属质感和多重共鸣',
    soundDesign: 'Powerful brass-like roar with metallic resonance, multiple harmonic layers, long sustain with slow vibrato, thunderous low-end',
    soundDesignCN: '强力铜管般长啸，金属共鸣，多层谐波，长持续+慢颤音，雷鸣般低频',
    technical: {
      frequency: '80-800Hz',
      waveform: 'brass_with_overtones',
      rhythm: 'long_sustains',
      spatial: 'large_space_reverb',
      dynamicRange: 'very_loud'
    },
    associatedBeasts: ['yinglong', 'zhulong'],
    associatedRegions: ['dongshan', 'zhongshan'],
    emotionalContext: '威严、力量、古老',
    usage: '龙类出场/力量觉醒/史诗时刻'
  }
};

// ============ 复合感官场景模板 ============
const COMPOSITE_SCENE_TEMPLATES = {
  beast_entrance: {
    name: '异兽出场',
    visual: ['linghun'],
    auditory: ['lingweng'],
    prompt: 'Soft golden aura materializing from mist, volumetric god-rays breaking through clouds, creature silhouette emerging, low-frequency energy hum building up',
    promptCN: '柔和金色光晕从雾气中物质化，体积神光穿透云层，生物剪影浮现，低频能量嗡鸣渐强'
  },
  sanctuary_visit: {
    name: '圣所拜访',
    visual: ['linghun', 'gubai'],
    auditory: ['lingweng', 'yuanmo'],
    prompt: 'Bone-white temple structures with golden aura accents, crushing silence of sacred space, occasional deep bell resonance, overwhelming sense of timelessness',
    promptCN: '骨白色庙宇结构配金色光晕点缀，神圣空间的压迫性寂静，偶尔深沉钟声共鸣，压倒性的永恒感'
  },
  underwater_exploration: {
    name: '水下探索',
    visual: ['yuanlan', 'yinglv'],
    auditory: ['yuanmo'],
    prompt: 'Crushing abyssal blue enveloping the scene, bioluminescent green organisms floating, near-total silence with sub-bass water pressure, mysterious cavernous depths',
    promptCN: '压迫性深渊蓝笼罩场景，生物发光绿色有机体漂浮，接近完全寂静+次低音水压，神秘洞穴深处'
  },
  memory_flashback: {
    name: '记忆闪回',
    visual: ['xiuguang', 'gubai'],
    auditory: ['huyin'],
    prompt: 'Rust-oxidized metallic surfaces of old world, bone-white memory fragments, haunting fox-song echoing from past, desaturated nostalgic color grading',
    promptCN: '旧世界氧化锈蚀金属表面，骨白色记忆碎片，萦绕狐吟从历史传来，去饱和怀旧色调分级'
  },
  climactic_battle: {
    name: '高潮战斗',
    visual: ['linghun', 'yinglv'],
    auditory: ['longyin', 'guxiang'],
    prompt: 'Explosive golden aura clashing with toxic green energy, dragon roar shaking the ground, bone-dry impact sounds, overwhelming visual chaos with divine light piercing through',
    promptCN: '爆炸性金色光晕与有毒绿色能量碰撞，龙吟震动大地，干枯骨骼撞击声，压倒性视觉混乱+神圣光芒刺穿'
  },
  peaceful_moment: {
    name: '宁静时刻',
    visual: ['linghun'],
    auditory: ['lingweng'],
    prompt: 'Gentle golden aura bathing the scene, soft breathing-like energy hum, warm ambient light, complete absence of threat',
    promptCN: '温和金色光晕沐浴场景，柔软呼吸般能量嗡鸣，温暖环境光，完全没有威胁感'
  }
};

// ============ 感官词汇生成器核心类 ============
class SensoryVocabularyGenerator {
  constructor() {
    this.visual = VISUAL_VOCABULARY_PROMPTS;
    this.auditory = AUDITORY_VOCABULARY_PROMPTS;
    this.composite = COMPOSITE_SCENE_TEMPLATES;
  }

  /**
   * 获取视觉词汇的渲染提示词
   */
  getVisualPrompt(vocabId, language = 'en') {
    const vocab = this.visual[vocabId];
    if (!vocab) return null;

    return language === 'en' ? vocab.seedancePrompt : vocab.seedancePromptCN;
  }

  /**
   * 获取听觉词汇的声音设计指令
   */
  getAuditoryPrompt(vocabId, language = 'en') {
    const vocab = this.auditory[vocabId];
    if (!vocab) return null;

    return language === 'en' ? vocab.soundDesign : vocab.soundDesignCN;
  }

  /**
   * 获取词汇完整信息
   */
  getVocabInfo(vocabId, type = 'visual') {
    const collection = type === 'visual' ? this.visual : this.auditory;
    return collection[vocabId] || null;
  }

  /**
   * 根据异兽获取推荐感官词汇
   */
  getVocabularyForBeast(beastId) {
    const visual = Object.values(this.visual).filter(v =>
      v.associatedBeasts.includes(beastId)
    );
    const auditory = Object.values(this.auditory).filter(v =>
      v.associatedBeasts.includes(beastId)
    );

    return { visual, auditory };
  }

  /**
   * 根据区域获取推荐感官词汇
   */
  getVocabularyForRegion(regionId) {
    const visual = Object.values(this.visual).filter(v =>
      v.associatedRegions.includes(regionId)
    );
    const auditory = Object.values(this.auditory).filter(v =>
      v.associatedRegions.includes(regionId)
    );

    return { visual, auditory };
  }

  /**
   * 获取复合场景模板
   */
  getCompositeSceneTemplate(sceneType, language = 'en') {
    const template = this.composite[sceneType];
    if (!template) return null;

    return language === 'en' ? template.prompt : template.promptCN;
  }

  /**
   * 生成完整感官提示词（视觉+听觉组合）
   */
  generateFullSensoryPrompt(sceneType, options = {}) {
    const template = this.composite[sceneType];
    if (!template) return null;

    const language = options.language || 'en';
    const basePrompt = language === 'en' ? template.prompt : template.promptCN;

    // 添加异兽特定增强
    let enhancedPrompt = basePrompt;
    if (options.beastId) {
      const beastVocab = this.getVocabularyForBeast(options.beastId);
      if (beastVocab.visual.length > 0) {
        const primaryVisual = beastVocab.visual[0];
        const visualAdd = language === 'en'
          ? primaryVisual.seedancePrompt
          : primaryVisual.seedancePromptCN;
        enhancedPrompt += ` | ${visualAdd}`;
      }
      if (beastVocab.auditory.length > 0) {
        const primaryAuditory = beastVocab.auditory[0];
        const audioAdd = language === 'en'
          ? primaryAuditory.soundDesign
          : primaryAuditory.soundDesignCN;
        enhancedPrompt += ` | ${audioAdd}`;
      }
    }

    // 添加情感基调
    if (options.emotion) {
      const emotionMap = {
        warm: 'warm golden light, soft atmosphere',
        fear: 'cold shadows, oppressive darkness',
        awe: 'epic scale, divine light rays',
        sadness: 'desaturated colors, misty atmosphere',
        hope: 'bright emerging light, warm glow'
      };
      if (emotionMap[options.emotion]) {
        enhancedPrompt += ` | ${emotionMap[options.emotion]}`;
      }
    }

    return {
      sceneType,
      basePrompt,
      enhancedPrompt,
      language,
      visualVocab: template.visual,
      auditoryVocab: template.auditory,
      beastId: options.beastId || null,
      emotion: options.emotion || null
    };
  }

  /**
   * 批量生成所有词汇提示词
   */
  generateAllPrompts(language = 'en') {
    const result = {
      visual: {},
      auditory: {},
      composite: {}
    };

    Object.entries(this.visual).forEach(([id, vocab]) => {
      result.visual[id] = language === 'en' ? vocab.seedancePrompt : vocab.seedancePromptCN;
    });

    Object.entries(this.auditory).forEach(([id, vocab]) => {
      result.auditory[id] = language === 'en' ? vocab.soundDesign : vocab.soundDesignCN;
    });

    Object.entries(this.composite).forEach(([id, template]) => {
      result.composite[id] = language === 'en' ? template.prompt : template.promptCN;
    });

    return result;
  }

  /**
   * 获取所有视觉词汇列表
   */
  getAllVisualVocabulary() {
    return Object.values(this.visual).map(v => ({
      id: v.name,
      name: v.chinese,
      description: v.description,
      emotionalContext: v.emotionalContext,
      usage: v.usage
    }));
  }

  /**
   * 获取所有听觉词汇列表
   */
  getAllAuditoryVocabulary() {
    return Object.values(this.auditory).map(v => ({
      id: v.name,
      name: v.chinese,
      description: v.description,
      emotionalContext: v.emotionalContext,
      usage: v.usage
    }));
  }
}

// ============ 导出 ============
module.exports = {
  SensoryVocabularyGenerator,
  VISUAL_VOCABULARY_PROMPTS,
  AUDITORY_VOCABULARY_PROMPTS,
  COMPOSITE_SCENE_TEMPLATES
};

// CLI 测试
if (require.main === module) {
  const generator = new SensoryVocabularyGenerator();

  console.log('\n🎨 Nirath原创世界观感官词汇生成器测试\n');

  // 测试视觉词汇
  const linghunPrompt = generator.getVisualPrompt('linghun', 'en');
  console.log('视觉词汇「灵晕」英文提示词:');
  console.log(linghunPrompt);
  console.log();

  // 测试听觉词汇
  const longyinPrompt = generator.getAuditoryPrompt('longyin', 'en');
  console.log('听觉词汇「龙吟」英文声音设计:');
  console.log(longyinPrompt);
  console.log();

  // 测试异兽推荐词汇
  const dijiangVocab = generator.getVocabularyForBeast('dijiang');
  console.log('光囊母兽推荐感官词汇:');
  console.log(`- 视觉: ${dijiangVocab.visual.map(v => v.chinese).join(', ')}`);
  console.log(`- 听觉: ${dijiangVocab.auditory.map(v => v.chinese).join(', ')}`);
  console.log();

  // 测试复合场景
  const entrancePrompt = generator.generateFullSensoryPrompt('beast_entrance', {
    beastId: 'dijiang',
    emotion: 'warm',
    language: 'en'
  });
  console.log('复合场景「异兽出场」完整提示词:');
  console.log(entrancePrompt.enhancedPrompt);
  console.log();

  // 测试中文输出
  const cnPrompt = generator.generateFullSensoryPrompt('peaceful_moment', {
    beastId: 'baize',
    emotion: 'warm',
    language: 'cn'
  });
  console.log('复合场景「宁静时刻」中文提示词:');
  console.log(cnPrompt.enhancedPrompt);
  console.log();

  // 批量生成
  const allPrompts = generator.generateAllPrompts('en');
  console.log(`已生成 ${Object.keys(allPrompts.visual).length} 个视觉词汇 + ${Object.keys(allPrompts.auditory).length} 个听觉词汇 + ${Object.keys(allPrompts.composite).length} 个复合场景`);
}