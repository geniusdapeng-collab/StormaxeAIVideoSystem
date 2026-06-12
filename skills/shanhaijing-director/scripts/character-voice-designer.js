/**
 * Character Voice Designer v1.0-Peng
 * 角色语音设计师 — 为山海经剧集角色分配独特声音
 * 
 * 核心功能：
 * 1. 角色语音档案管理（小G + 40只异兽）
 * 2. 剧本对白解析与标注
 * 3. TTS音频生成 + Seedance音频参考上传
 * 4. Prompt对白层注入
 * 
 * 集成点：导演管线 Stage 7.5 Dialogue Annotation
 * 
 * Seedance 2.0 音频参考规格：
 * - 格式：wav、mp3
 * - 时长：单个 [2, 15] s，最多 3 段，总时长 ≤ 15 s
 * - 大小：单个 ≤ 15 MB
 * - 必须同时传图片/视频（不能纯音频）
 * - 角色：content.role = "reference_audio"
 * 
 * ShanhaiStory Forge v2.3-Peng | Character Voice Designer v1.0-Peng
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 角色语音档案库
// ============================================================================

const CHARACTER_VOICE_PROFILES = {
  // 主角：小G（8岁中国男孩探险者）
  xiaoG: {
    id: 'xiaoG',
    name: '小G',
    nameEn: 'Little G',
    age: 8,
    gender: 'boy',
    voiceType: 'child_boy',
    voiceDescription: '8岁中国男孩，清亮童声，带好奇与活力',
    tone: 'curious_warm',
    toneDescription: '好奇温暖，天真烂漫',
    dialect: 'mandarin',
    dialectDescription: '标准普通话，略带孩童软糯感',
    pitchRange: 'medium_high',
    pitchNote: '中高音区，清脆明亮',
    speed: 'normal',
    speedDescription: '正常语速，兴奋时加快',
    speakingStyle: 'energetic_inquisitive',
    styleDescription: '活力好奇型，喜欢提问',
    ttsVoiceId: 'zh-CN-XiaoxiaoNeural',  // Azure TTS 童声
    emotionMap: {
      curious: { desc: '语调上扬，尾音带疑问感', pitchShift: '+5%', speedShift: '100%' },
      scared: { desc: '语速加快，声音微微颤抖', pitchShift: '+10%', speedShift: '120%' },
      amazed: { desc: '停顿+吸气声+惊叹', pitchShift: '+15%', speedShift: '80%' },
      brave: { desc: '语速放缓，坚定有力', pitchShift: '-5%', speedShift: '90%' },
      happy: { desc: '轻快跳跃，带笑声', pitchShift: '+8%', speedShift: '110%' },
      sad: { desc: '低沉，尾音下沉', pitchShift: '-10%', speedShift: '85%' }
    },
    typicalPhrases: [
      '这是哪里？',
      '太神奇了！',
      '我不怕！',
      '我们能成为朋友吗？',
      '哇——那是什么？'
    ]
  },

  // 神话级异兽
  zhulong: {
    id: 'zhulong',
    name: '烛龙',
    nameEn: 'Torch Dragon',
    voiceType: 'ancient_deep',
    voiceDescription: '远古深沉男声，如地底轰鸣',
    tone: 'wise_authoritative',
    toneDescription: '智慧威严，不急不躁',
    dialect: 'mandarin',
    dialectDescription: '古朴典雅，用词考究',
    pitchRange: 'very_low',
    pitchNote: '极低音，共鸣感强',
    speed: 'slow',
    speedDescription: '极慢语速，一字一顿',
    speakingStyle: 'slow_deliberate',
    styleDescription: '缓慢从容，如钟声回荡',
    reverb: 'cave_echo',
    reverbDescription: '洞穴回响效果，尾音悠长',
    ttsVoiceId: 'zh-CN-YunxiNeural',  // 低沉男声
    ttsEffect: 'pitch:-20%,rate:-30%,volume:+10%',
    emotionMap: {
      wise: { desc: '每个字间隔1秒，如古钟', pitchShift: '-20%', speedShift: '60%' },
      warning: { desc: '低沉轰鸣，地面微震', pitchShift: '-25%', speedShift: '70%' },
      gentle: { desc: '暖光伴随，语调柔和', pitchShift: '-15%', speedShift: '80%' },
      anger: { desc: '如雷咆哮，震撼山谷', pitchShift: '-10%', speedShift: '50%' }
    },
    typicalPhrases: [
      '孩子，光不在眼中，而在心中。',
      '我已在此等待千年。',
      '勇气不是无惧，而是心怀恐惧仍前行。',
      '睁开我的眼睛，照亮你的路。'
    ]
  },

  // 九尾狐（雌性智慧型）
  jiuweihu: {
    id: 'jiuweihu',
    name: '九尾狐',
    nameEn: 'Nine-Tailed Fox',
    voiceType: 'mature_feminine',
    voiceDescription: '成熟磁性女声，带丝魅惑与智慧',
    tone: 'mysterious_seductive',
    toneDescription: '神秘魅惑，亦正亦邪',
    dialect: 'mandarin',
    dialectDescription: '优雅婉转，尾音带钩',
    pitchRange: 'medium_low',
    pitchNote: '中低音，磁性迷人',
    speed: 'slow',
    speedDescription: '缓慢慵懒，漫不经心',
    speakingStyle: 'mysterious_playful',
    styleDescription: '神秘俏皮，话中有话',
    ttsVoiceId: 'zh-CN-XiaohanNeural',  // 温柔女声
    ttsEffect: 'pitch:-10%,rate:-15%',
    emotionMap: {
      mysterious: { desc: '轻笑一声，意味深长', pitchShift: '-5%', speedShift: '80%' },
      playful: { desc: '尾音上扬，带戏谑', pitchShift: '+5%', speedShift: '90%' },
      warning: { desc: '突然冷厉，九尾炸开', pitchShift: '-15%', speedShift: '60%' }
    },
    typicalPhrases: [
      '小探险家，你有趣得很。',
      '我的尾巴每一条都有故事，想听吗？',
      '真相往往藏在第九个尾巴里。',
      '聪明的猎物才配做我的客人。'
    ]
  },

  // 帝江（混沌 — 无面无口，用心灵感应）
  dijiang: {
    id: 'dijiang',
    name: '帝江',
    nameEn: 'Emperor River',
    voiceType: 'non_human_resonance',
    voiceDescription: '非人声，环境共鸣，如风声+心跳+低鸣混合',
    tone: 'primordial_chaotic',
    toneDescription: '原始混沌，不带人类情感',
    dialect: 'non_verbal',
    dialectDescription: '无语言，纯心灵感应/环境共鸣',
    pitchRange: 'sub_bass',
    pitchNote: '次声波+环境共振',
    speed: 'irregular',
    speedDescription: '无固定语速，与自然节律同步',
    speakingStyle: 'environmental_resonance',
    styleDescription: '环境共鸣，光波/震动传递信息',
    ttsVoiceId: null,  // 帝江不使用TTS
    emotionMap: {
      neutral: { desc: '身体表面光波缓慢流动', method: 'visual_only' },
      curious: { desc: '光波加速闪烁，伴随低频震动', method: 'visual_only' },
      warning: { desc: '全身光芒大盛，空气嗡鸣', method: 'visual_only' }
    },
    typicalPhrases: [],  // 帝江不说话，纯视觉表达
    communicationMethod: 'visual_resonance',  // 视觉共鸣
    communicationDescription: '身体表面光波图案变化传递信息，无需口型'
  },

  // 鲲鹏（宏大辽阔）
  kunpeng: {
    id: 'kunpeng',
    name: '鲲鹏',
    nameEn: 'Kun Peng',
    voiceType: 'grand_resonant',
    voiceDescription: '宏大共鸣声，如风暴+海浪+雷鸣混合',
    tone: 'majestic_detached',
    toneDescription: '威严超然，视万物如尘埃',
    dialect: 'mandarin',
    dialectDescription: '宏大叙事感，用词如史诗',
    pitchRange: 'low_resonant',
    pitchNote: '低音共鸣，如远处雷声',
    speed: 'very_slow',
    speedDescription: '极慢，每个字如陨石坠落',
    speakingStyle: 'epic_grand',
    styleDescription: '史诗宏大，自带混响',
    reverb: 'storm_echo',
    reverbDescription: '风暴级混响，余音不绝',
    ttsVoiceId: 'zh-CN-YunxiNeural',
    ttsEffect: 'pitch:-30%,rate:-40%,reverb:large_hall',
    emotionMap: {
      majestic: { desc: '声如海啸，震撼天地', pitchShift: '-30%', speedShift: '50%' },
      curious: { desc: '风暴暂缓，语调低沉探询', pitchShift: '-20%', speedShift: '70%' }
    },
    typicalPhrases: [
      '北冥有鱼，其名为鲲...',
      '天地如棋盘，万物为棋子。',
      '振翅一次，便是春秋。'
    ]
  },

  // 凤凰（高贵神圣）
  fenghuang: {
    id: 'fenghuang',
    name: '凤凰',
    nameEn: 'Phoenix',
    voiceType: 'ethereal_soprano',
    voiceDescription: '空灵高音，如竖琴+风铃+火焰噼啪',
    tone: 'divine_noble',
    toneDescription: '神圣高贵，不容亵渎',
    dialect: 'mandarin',
    dialectDescription: '古雅文言，如诗经吟诵',
    pitchRange: 'very_high',
    pitchNote: '极高音，空灵穿透',
    speed: 'graceful',
    speedDescription: '优雅从容，如舞蹈节奏',
    speakingStyle: 'divine_recitation',
    styleDescription: '神圣吟诵，自带光芒回响',
    ttsVoiceId: 'zh-CN-XiaoxiaoNeural',
    ttsEffect: 'pitch:+20%,rate:-10%,reverb:cathedral',
    emotionMap: {
      divine: { desc: '声如天籁，光芒绽放', pitchShift: '+20%', speedShift: '85%' },
      anger: { desc: '凤鸣九天，烈火燎原', pitchShift: '+30%', speedShift: '120%' }
    },
    typicalPhrases: [
      '浴火者，方能重生。',
      '吾之尾羽，可遮天蔽日。',
      '千年涅磐，只为今日。'
    ]
  },

  // 应龙（雷霆战神）
  yinglong: {
    id: 'yinglong',
    name: '应龙',
    nameEn: 'Responsive Dragon',
    voiceType: 'thunderous_commander',
    voiceDescription: '雷霆轰鸣嗓，如战鼓+闪电+龙吟',
    tone: 'warrior_commanding',
    toneDescription: '战士威严，令出如山',
    dialect: 'mandarin',
    dialectDescription: '刚毅果决，斩钉截铁',
    pitchRange: 'low_thunderous',
    pitchNote: '低音轰鸣，如雷贯耳',
    speed: 'commanding',
    speedDescription: '短促有力，命令式',
    speakingStyle: 'warrior_bark',
    styleDescription: '战士式断喝，气势逼人',
    ttsVoiceId: 'zh-CN-YunxiNeural',
    ttsEffect: 'pitch:-25%,rate:-20%,volume:+20%',
    emotionMap: {
      command: { desc: '如雷霆断喝，震慑四方', pitchShift: '-20%', speedShift: '70%' },
      battle: { desc: '龙吟虎啸，战意沸腾', pitchShift: '-25%', speedShift: '90%' }
    },
    typicalPhrases: [
      '雷电听我号令！',
      '挡我者，灰飞烟灭。',
      '战！'
    ]
  },

  // 麒麟（仁慈瑞兽）
  qilin: {
    id: 'qilin',
    name: '麒麟',
    nameEn: 'Qilin',
    voiceType: 'gentle_bass',
    voiceDescription: '温和低音，如大提琴+泉水叮咚',
    tone: 'benevolent_wise',
    toneDescription: '仁慈智慧，祥和宁静',
    dialect: 'mandarin',
    dialectDescription: '温润如玉，谦谦君子',
    pitchRange: 'low_gentle',
    pitchNote: '低音但不沉闷，温暖浑厚',
    speed: 'gentle_slow',
    speedDescription: '温和缓慢，如流水',
    speakingStyle: 'gentle_sage',
    styleDescription: '温和智者，自带祥和气场',
    ttsVoiceId: 'zh-CN-YunxiNeural',
    ttsEffect: 'pitch:-15%,rate:-25%,volume:-5%',
    emotionMap: {
      benevolent: { desc: '语调柔和，如春风拂面', pitchShift: '-15%', speedShift: '75%' },
      warning: { desc: '仍温和但带坚定', pitchShift: '-10%', speedShift: '70%' }
    },
    typicalPhrases: [
      '仁德之人，自有天助。',
      '万物皆有灵，善待之。',
      '不急，慢慢来。'
    ]
  },

  // 饕餮（贪婪凶兽）
  taotie: {
    id: 'taotie',
    name: '饕餮',
    nameEn: 'Taotie',
    voiceType: 'guttural_greedy',
    voiceDescription: '喉音贪婪嗓，如咀嚼声+低吼+涎水滴落',
    tone: 'greedy_menacing',
    toneDescription: '贪婪威胁，永不知足',
    dialect: 'mandarin',
    dialectDescription: '粗鄙贪婪，口水音重',
    pitchRange: 'low_guttural',
    pitchNote: '喉音极低，如腹中雷鸣',
    speed: 'erratic',
    speedDescription: '时而急促（饥饿）时而拖沓（吃撑）',
    speakingStyle: 'gluttonous_snarl',
    styleDescription: '贪婪嘶吼，口涎横流',
    ttsVoiceId: 'zh-CN-YunxiNeural',
    ttsEffect: 'pitch:-35%,rate:+20%,distortion:light',
    emotionMap: {
      hungry: { desc: '急促低吼，口水音', pitchShift: '-30%', speedShift: '130%' },
      eating: { desc: '咀嚼间含糊嘟囔', pitchShift: '-35%', speedShift: '60%' }
    },
    typicalPhrases: [
      '饿...好饿...',
      '这个能吃吗？那个呢？',
      '不够...永远不够...'
    ]
  },

  // 穷奇（凶兽 — 叛逆挑衅）
  qiongqi: {
    id: 'qiongqi',
    name: '穷奇',
    nameEn: 'Qiongqi',
    voiceType: 'sneering_masculine',
    voiceDescription: '嘲弄男声，带鼻音和冷笑',
    tone: 'mischievous_cruel',
    toneDescription: '调皮残忍，以捉弄为乐',
    dialect: 'mandarin',
    dialectDescription: '轻佻挑衅，阴阳怪气',
    pitchRange: 'medium',
    pitchNote: '中等音，带嘲弄感',
    speed: 'quick_taunting',
    speedDescription: '语速快，带冷笑间断',
    speakingStyle: 'taunting_mischief',
    styleDescription: '嘲弄捣蛋，幸灾乐祸',
    ttsVoiceId: 'zh-CN-YunxiNeural',
    ttsEffect: 'pitch:+5%,rate:+15%',
    emotionMap: {
      taunt: { desc: '冷笑+嘲讽语调', pitchShift: '+10%', speedShift: '110%' },
      anger: { desc: '突然暴怒，咆哮', pitchShift: '-10%', speedShift: '130%' }
    },
    typicalPhrases: [
      '哈哈，你上当啦！',
      '好玩好玩，再来一次！',
      '弱者就该被捉弄~'
    ]
  }
};

// 默认语音档案（用于未定义的角色）
const DEFAULT_VOICE_PROFILE = {
  voiceType: 'neutral_standard',
  voiceDescription: '标准中性声音',
  tone: 'neutral',
  dialect: 'mandarin',
  pitchRange: 'medium',
  speed: 'normal',
  speakingStyle: 'standard',
  ttsVoiceId: 'zh-CN-XiaoxiaoNeural',
  emotionMap: {
    neutral: { desc: '标准语调', pitchShift: '0%', speedShift: '100%' }
  }
};

// ============================================================================
// 对白解析器
// ============================================================================

class DialogueParser {
  constructor() {
    this.dialoguePattern = /【对白】\s*speaker:\s*([^\n]+)\s*text:\s*"([^"]+)"(?:\s*tone:\s*([^\n]+))?/g;
  }

  /**
   * 从剧本中提取所有对白节点
   * @param {string} script - 剧本文本
   * @returns {Array} 对白节点列表
   */
  parseDialogue(script) {
    const dialogues = [];
    let match;
    
    while ((match = this.dialoguePattern.exec(script)) !== null) {
      dialogues.push({
        speaker: match[1].trim(),
        text: match[2].trim(),
        tone: match[3] ? match[3].trim() : 'neutral',
        raw: match[0]
      });
    }
    
    return dialogues;
  }

  /**
   * 将自然语言剧本转换为结构化对白
   * 支持格式：小G（好奇）："这是哪里？"
   */
  parseNaturalDialogue(script) {
    const pattern = /([^（]+)（([^）]+)）：\s*"([^"]+)"/g;
    const dialogues = [];
    let match;
    
    while ((match = pattern.exec(script)) !== null) {
      dialogues.push({
        speaker: match[1].trim(),
        emotion: match[2].trim(),
        text: match[3].trim()
      });
    }
    
    return dialogues;
  }
}

// ============================================================================
// Prompt对白注入器
// ============================================================================

class DialoguePromptInjector {
  constructor(voiceProfiles = CHARACTER_VOICE_PROFILES) {
    this.voiceProfiles = voiceProfiles;
    this.parser = new DialogueParser();
  }

  /**
   * 为单个镜头Prompt注入对白层
   * @param {string} prompt - 原始Prompt
   * @param {Array} dialogues - 对白节点列表
   * @returns {string} 注入后的Prompt
   */
  injectDialogue(prompt, dialogues) {
    if (!dialogues || dialogues.length === 0) return prompt;

    let dialogueSection = '\n\n【角色对白】\n';
    
    dialogues.forEach((dialogue, index) => {
      const profile = this.getVoiceProfile(dialogue.speaker);
      const voiceDesc = this.buildVoiceDescription(profile, dialogue.emotion || 'neutral');
      
      dialogueSection += `[${index + 1}] ${dialogue.speaker} ${voiceDesc}："${dialogue.text}"\n`;
    });

    // Seedance 2.0 建议格式：对话放双引号内
    dialogueSection += '\n注意：上述对白需在画面中同步口型。';

    return prompt + dialogueSection;
  }

  /**
   * 为异兽定制说话方式描述（无人类口型的异兽）
   */
  injectBeastCommunication(prompt, beastId, message, method = 'auto') {
    const profile = this.getVoiceProfile(beastId);
    
    if (method === 'auto' && profile.communicationMethod) {
      // 使用异兽特有的沟通方式
      return prompt + `\n\n【异兽沟通】${profile.name} ${profile.communicationDescription}，传递信息："${message}"`;
    }
    
    // 默认：假设有人面或类人口型
    const voiceDesc = this.buildVoiceDescription(profile, 'neutral');
    return prompt + `\n\n【异兽对白】${profile.name} ${voiceDesc}："${message}"`;
  }

  /**
   * 构建角色声音描述文本（用于Prompt）
   */
  buildVoiceDescription(profile, emotion = 'neutral') {
    const emotionData = profile.emotionMap[emotion] || profile.emotionMap.neutral;
    
    let desc = '';
    
    if (profile.communicationMethod === 'visual_resonance') {
      return `（${emotionData.desc}）`;
    }
    
    desc += `（${profile.voiceDescription}，`;
    desc += `${emotionData.desc}，`;
    desc += `语速${this.translateSpeed(profile.speed)}）`;
    
    return desc;
  }

  translateSpeed(speed) {
    const map = {
      'very_slow': '极慢',
      'slow': '缓慢',
      'gentle_slow': '温和缓慢',
      'graceful': '优雅从容',
      'normal': '正常',
      'commanding': '短促有力',
      'quick_taunting': '快速嘲弄',
      'erratic': '时快时慢',
      'irregular': '无固定节奏'
    };
    return map[speed] || speed;
  }

  getVoiceProfile(characterId) {
    return this.voiceProfiles[characterId] || DEFAULT_VOICE_PROFILE;
  }
}

// ============================================================================
// TTS音频生成配置
// ============================================================================

class TTSAudioGenerator {
  constructor() {
    this.maxDuration = 15;  // 秒，Seedance限制
    this.maxSegments = 3;   // 最多3段音频
  }

  /**
   * 为对白列表生成TTS配置
   * @param {Array} dialogues - 对白节点
   * @returns {Array} TTS任务列表
   */
  generateTTSConfig(dialogues) {
    const configs = [];
    let totalDuration = 0;

    for (const dialogue of dialogues) {
      const profile = CHARACTER_VOICE_PROFILES[dialogue.speaker] || DEFAULT_VOICE_PROFILE;
      
      // 估算时长（中文约4字/秒）
      const estimatedDuration = Math.ceil(dialogue.text.length / 4);
      
      if (totalDuration + estimatedDuration > this.maxDuration) {
        console.warn(`⚠️ 音频总时长将超过${this.maxDuration}秒限制，截断后续对白`);
        break;
      }

      configs.push({
        speaker: dialogue.speaker,
        text: dialogue.text,
        voiceId: profile.ttsVoiceId,
        ssml: this.buildSSML(dialogue.text, profile, dialogue.emotion),
        estimatedDuration,
        outputFile: `tts_${dialogue.speaker}_${Date.now()}.mp3`
      });

      totalDuration += estimatedDuration;
    }

    return configs;
  }

  /**
   * 构建SSML（语音合成标记语言）
   */
  buildSSML(text, profile, emotion = 'neutral') {
    // 获取情绪数据，如果没有指定情绪或neutral不存在，使用第一个可用情绪
    let emotionData = profile.emotionMap[emotion];
    if (!emotionData) {
      emotionData = profile.emotionMap.neutral || Object.values(profile.emotionMap)[0];
    }
    
    // 如果帝江等视觉共鸣角色，返回空SSML（不需要TTS）
    if (profile.communicationMethod === 'visual_resonance') {
      return null;
    }
    
    // 音高调整
    const pitch = emotionData.pitchShift || '0%';
    // 语速调整
    const rate = emotionData.speedShift || '100%';
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">`;
    ssml += `<prosody pitch="${pitch}" rate="${rate}">`;
    ssml += text;
    ssml += `</prosody>`;
    ssml += `</speak>`;
    
    return ssml;
  }

  /**
   * 生成Seedance API音频参考参数
   */
  buildSeedanceAudioRefs(audioFiles) {
    const refs = [];
    
    audioFiles.forEach((file, index) => {
      refs.push({
        type: 'audio_url',
        audio_url: {
          url: file.url  // 需要预先上传到可访问的URL
        },
        role: 'reference_audio'
      });
    });
    
    return refs;
  }
}

// ============================================================================
// 导演管线集成接口
// ============================================================================

class CharacterVoiceDesigner {
  constructor(options = {}) {
    this.profiles = options.profiles || CHARACTER_VOICE_PROFILES;
    this.injector = new DialoguePromptInjector(this.profiles);
    this.ttsGenerator = new TTSAudioGenerator();
    this.parser = new DialogueParser();
    
    // 配置
    this.enableAutoTTS = options.enableAutoTTS !== false;  // 默认启用
    this.maxDialoguePerShot = options.maxDialoguePerShot || 2;  // 每镜头最多2句对白
  }

  /**
   * Stage 7.5: 对话标注
   * 输入：剧本 + 镜头列表
   * 输出：带对白标注的镜头Prompt列表 + TTS任务列表
   */

  /**
   * 将剧本对白分配到各镜头
   */

  /**
   * 生成TTS任务配置
   */

  /**
   * 获取角色语音档案
   */
  getVoiceProfile(characterId) {
    return this.profiles[characterId] || DEFAULT_VOICE_PROFILE;
  }

  /**
   * 注册新角色语音
   */
  registerVoiceProfile(characterId, profile) {
    this.profiles[characterId] = {
      ...DEFAULT_VOICE_PROFILE,
      ...profile,
      id: characterId
    };
    console.log(`🎙️ 已注册角色语音: ${characterId}`);
  }

  /**
   * 生成完整API请求体（含音频参考）
   */
  buildSeedanceRequest(prompt, imageRefs, audioRefs) {
    const content = [
      {
        type: 'text',
        text: prompt
      }
    ];

    // 添加图片参考
    imageRefs.forEach(img => {
      content.push({
        type: 'image_url',
        image_url: { url: img.url },
        role: 'reference_image'
      });
    });

    // 添加音频参考
    audioRefs.forEach(audio => {
      content.push({
        type: 'audio_url',
        audio_url: { url: audio.url },
        role: 'reference_audio'
      });
    });

    return {
      model: 'seedance-2.0',
      content,
      generate_audio: true,  // 同时启用自动生成
      resolution: '1080p',
      duration: 5
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  CharacterVoiceDesigner,
  DialogueParser,
  DialoguePromptInjector,
  TTSAudioGenerator,
  CHARACTER_VOICE_PROFILES,
  DEFAULT_VOICE_PROFILE
};

// 版本号
console.log('🎙️ Character Voice Designer v1.0-Peng loaded');