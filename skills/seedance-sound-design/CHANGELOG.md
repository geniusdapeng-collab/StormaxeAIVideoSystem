#!/usr/bin/env node
/**
 * Seedance Sound Design — 声音设计流水线
 * 版本: v5.7-Peng
 * 
 * 用法:
 *   node sound-design.js design --production-dir <dir> [--output-dir <dir>]
 *   node sound-design.js export --production-dir <dir> --format <json|md>
 */

const fs = require('fs');
const path = require('path');

// ============ CLI解析 ============
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '');
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function log(tag, msg) {
  const time = new Date().toLocaleString('zh-CN', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

// ============ 音效知识库 ============
// v4.2-Peng-fix: 通用化环境音效库，移除具体场景硬编码描述
const AMBIENCE_LIBRARY = {
  '森林': ['风声穿过树叶', '远处鸟鸣', '树枝断裂', '落叶沙沙'],
  '城市': ['远处车流', '建筑回音', '人群嘈杂', '霓虹灯嗡鸣'],
  '战场': ['远处炮火', '尘土飞扬', '金属碰撞', '呐喊声'],
  '室内': ['空调运转', '键盘敲击', '脚步声回响', '门轴吱呀'],
  '太空': ['真空寂静', '飞船引擎低频嗡鸣', '金属热胀冷缩'],
  '海底': ['水泡声', '水压低频', '远处鲸鸣', '水流湍急'],
  '山洞': ['水滴回音', '蝙蝠振翅', '岩石摩擦', '气流呼啸'],
  '雨天': ['雨点击打', '雷声远播', '积水溅起', '屋檐滴水'],
};

const SFX_LIBRARY = {
  '打斗': [
    { name: '破风声', timeOffset: 0.0, volume: -8 },
    { name: '肉体撞击', timeOffset: 0.1, volume: -6 },
    { name: '骨骼震动', timeOffset: 0.15, volume: -10 },
    { name: '衣物撕裂', timeOffset: 0.2, volume: -12 },
  ],
  '魔法': [
    { name: '能量聚集嗡鸣', timeOffset: 0.0, volume: -12 },
    { name: '电荷噼啪声', timeOffset: 0.5, volume: -10 },
    { name: '能量释放爆裂', timeOffset: 1.0, volume: -5 },
    { name: '余波低频震动', timeOffset: 1.2, volume: -8 },
  ],
  '爆炸': [
    { name: '引信嘶嘶声', timeOffset: 0.0, volume: -15 },
    { name: '初始爆裂', timeOffset: 0.0, volume: -3 },
    { name: '冲击波', timeOffset: 0.1, volume: -5 },
    { name: '碎片飞溅', timeOffset: 0.2, volume: -8 },
    { name: '耳鸣效果', timeOffset: 0.3, volume: -10 },
  ],
  '脚步': [
    { name: '左脚落地', timeOffset: 0.0, volume: -15 },
    { name: '右脚落地', timeOffset: 0.4, volume: -15 },
    { name: '急停摩擦', timeOffset: 0.8, volume: -10 },
  ],
  '武器碰撞': [
    { name: '金属撞击', timeOffset: 0.0, volume: -6 },
    { name: '火花迸射', timeOffset: 0.05, volume: -8 },
    { name: '余震嗡鸣', timeOffset: 0.1, volume: -12 },
  ],
};

const MUSIC_STYLES = {
  'epic': { name: '史诗铜管', tempo: '80-140BPM', key: 'C小调→C大调', instruments: ['铜管','定音鼓','弦乐'], mood: '宏大/胜利' },
  'tense': { name: '紧张弦乐', tempo: '不规则', key: '减和弦', instruments: ['不规则拨弦','低频合成器'], mood: '紧迫/不安' },
  'sad': { name: '悲伤钢琴', tempo: '60BPM', key: 'A小调', instruments: ['独奏钢琴','大提琴'], mood: '哀伤/离别' },
  'suspense': { name: '悬疑氛围', tempo: '极简', key: '单音→双音冲突', instruments: ['低频合成器','不规则打击'], mood: '未知/恐惧' },
  'upbeat': { name: '轻快电子', tempo: '120-130BPM', key: '大调', instruments: ['合成器琶音','轻快鼓点'], mood: '活力/科技' },
  'romantic': { name: '浪漫弦乐', tempo: '70BPM', key: 'F大调', instruments: ['小提琴','竖琴','长笛'], mood: '温柔/爱意' },
  'horror': { name: '恐怖氛围', tempo: '无固定', key: '不协和音程', instruments: ['低频嗡鸣','弦乐滑音'], mood: '恐惧/战栗' },
  // v5.5-Peng-CinePrompt: 15种舞蹈音乐库
  'hip-hop': { name: '街舞嘻哈', tempo: '90-110BPM', key: 'G小调', instruments: ['808低音','采样切片','节拍器'], mood: '街头/律动' },
  'ballet': { name: '芭蕾古典', tempo: '60-120BPM', key: 'C大调/降B大调', instruments: ['钢琴','弦乐群','竖琴'], mood: '优雅/纯净' },
  'jazz': { name: '爵士摇摆', tempo: '120-180BPM', key: 'F大调/降B大调', instruments: ['萨克斯','低音提琴',' brushes鼓'], mood: '摇摆/随性' },
  'latin': { name: '拉丁热情', tempo: '100-140BPM', key: 'A小调', instruments: ['康加鼓','沙锤','尼龙弦吉他'], mood: '热情/奔放' },
  'contemporary': { name: '现代舞实验', tempo: '不规则', key: '无调性/微分音', instruments: ['电子合成器','环境采样','人声切片'], mood: '前卫/抽象' },
  'folk': { name: '民族舞传统', tempo: '80-160BPM', key: '民族调式', instruments: ['竹笛/马头琴/手鼓','民族打击乐'], mood: '传承/地域' },
  'kpop': { name: 'K-pop偶像', tempo: '110-130BPM', key: '大调', instruments: ['合成器主音','电子鼓组','低音炮'], mood: '青春/潮流' },
  'breaking': { name: '霹雳舞战斗', tempo: '110-135BPM', key: 'F小调', instruments: ['强力鼓机','刮碟采样','低音冲击'], mood: '对抗/爆发' },
  'tango': { name: '探戈戏剧', tempo: '110-130BPM', key: 'A小调/G小调', instruments: ['班多钮手风琴','小提琴','低音提琴'], mood: '激情/纠缠' },
  'waltz': { name: '华尔兹圆舞', tempo: '84-90BPM', key: '降E大调', instruments: ['弦乐群','圆号','竖琴'], mood: '旋转/浪漫' },
  'flamenco': { name: '弗拉门戈火焰', tempo: '90-120BPM', key: '弗里吉亚调式', instruments: ['弗拉门戈吉他','拍手','响板'], mood: '热烈/哀伤' },
  'battle': { name: '街舞Battle对决', tempo: '95-115BPM', key: 'C小调', instruments: ['DJ刮碟','鼓机break','观众呐喊采样'], mood: '对峙/竞技' },
  'popping': { name: '机械舞精准', tempo: '100-120BPM', key: 'F大调', instruments: ['合成器bass','电子snare','机械音效'], mood: '精准/控制' },
  'waacking': { name: '甩手舞 Disco', tempo: '120-130BPM', key: 'D大调', instruments: ['四拍鼓组','弦乐Stab','Disco合成器'], mood: '张扬/复古' },
  'dance-epic': { name: '舞蹈史诗', tempo: '120-160BPM', key: 'D小调→D大调', instruments: ['管弦乐+电子鼓组','合唱人声'], mood: '宏大/舞蹈高潮' },
};

// v5.1-Peng: 情感声学映射 — 情绪→声学参数
const EMOTION_ACOUSTICS_MAP = {
  '高潮/爆发': {
    frequencyProfile: '全频爆发，低频冲击+高频撕裂',
    reverb: '大厅混响(3-5s)',
    spatial: '环绕扩散',
    dynamics: '极度压缩+峰值限制',
    texture: '失真/颗粒感',
    seedanceCue: '震耳欲聋，声波可见，空气震颤'
  },
  '紧张/对抗': {
    frequencyProfile: '中频突出，低频暗涌',
    reverb: '短混响(0.5-1s)',
    spatial: '近场压迫',
    dynamics: '高压缩，呼吸可闻',
    texture: '粗糙/紧张',
    seedanceCue: '压迫感，心跳低频，细微声响放大'
  },
  '警觉/不安': {
    frequencyProfile: '高频警觉，低频不稳',
    reverb: '不规则混响',
    spatial: '左右不定',
    dynamics: '侧链压缩，忽大忽小',
    texture: '颗粒/断续',
    seedanceCue: '神经紧绷，风吹草动皆惊心'
  },
  '平静/建置': {
    frequencyProfile: '中频温暖，低频轻柔',
    reverb: '自然混响(1-2s)',
    spatial: '中距立体',
    dynamics: '自然动态',
    texture: '平滑/温暖',
    seedanceCue: '舒适宁静，如沐春风'
  },
  '宁静/舒缓': {
    frequencyProfile: '低频为主，高频极少',
    reverb: '长混响(5-8s)',
    spatial: '远景弥漫',
    dynamics: '极宽动态',
    texture: '丝滑/漂浮',
    seedanceCue: '空灵飘渺，余音绕梁'
  }
};

// ============ 场景分析引擎 ============
function analyzeScene(shot, storyPlan) {
  const desc = (shot.description || '').toLowerCase();
  const type = (shot.type || '').toLowerCase();
  const act = shot.act || '';
  
  // 判断场景环境
  let environment = '室内';
  if (desc.includes('森林') || desc.includes('树') || desc.includes('山')) environment = '森林';
  else if (desc.includes('城') || desc.includes('街') || desc.includes('楼')) environment = '城市';
  else if (desc.includes('战') || desc.includes('炸') || desc.includes('炮')) environment = '战场';
  else if (desc.includes('海') || desc.includes('水') || desc.includes('鱼')) environment = '海底';
  else if (desc.includes('洞') || desc.includes('穴')) environment = '山洞';
  else if (desc.includes('雨') || desc.includes('雷')) environment = '雨天';
  else if (desc.includes('太空') || desc.includes('星') || desc.includes('船')) environment = '太空';
  
  // 判断动作类型
  let actionType = '对话';
  if (desc.includes('打') || desc.includes('击') || desc.includes('战') || desc.includes('斗')) actionType = '打斗';
  else if (desc.includes('魔法') || desc.includes('能量') || desc.includes('光')) actionType = '魔法';
  else if (desc.includes('炸') || desc.includes('爆')) actionType = '爆炸';
  else if (desc.includes('跑') || desc.includes('追') || desc.includes('逃')) actionType = '奔跑';
  else if (desc.includes('走') || desc.includes('步')) actionType = '脚步';
  else if (desc.includes('武器') || desc.includes('剑') || desc.includes('棒')) actionType = '武器碰撞';
  
  // 判断情绪
  let emotion = '中性';
  if (shot.tension > 80) emotion = '高潮/爆发';
  else if (shot.tension > 60) emotion = '紧张/对抗';
  else if (shot.tension > 40) emotion = '警觉/不安';
  else if (shot.tension > 20) emotion = '平静/建置';
  else emotion = '宁静/舒缓';
  
  // 判断音乐风格
  let musicStyle = 'neutral';
  if (act === '起') musicStyle = shot.tension > 30 ? 'tense' : 'upbeat';
  else if (act === '承') musicStyle = shot.tension > 50 ? 'tense' : 'suspense';
  else if (act === '转') musicStyle = shot.tension > 70 ? 'epic' : 'tense';
  else if (act === '合') musicStyle = shot.tension > 80 ? 'epic' : 'sad';
  
  // 特殊覆盖
  if (desc.includes('离别') || desc.includes('死') || desc.includes('哭')) musicStyle = 'sad';
  if (desc.includes('爱') || desc.includes('吻') || desc.includes('拥抱')) musicStyle = 'romantic';
  if (desc.includes('恐怖') || desc.includes('鬼') || desc.includes('吓')) musicStyle = 'horror';
  
  // v5.5-Peng-CinePrompt: 舞蹈音乐风格自动检测（15种舞蹈库）
  const danceKeywords = {
    'hip-hop': ['街舞', 'hiphop', 'hip-hop', '嘻哈'],
    'ballet': ['芭蕾', 'ballet', '足尖', '天鹅湖'],
    'jazz': ['爵士', 'jazz', '摇摆舞'],
    'latin': ['拉丁', 'latin', '恰恰', '伦巴', '桑巴'],
    'contemporary': ['现代舞', 'contemporary', '现代舞蹈'],
    'folk': ['民族舞', 'folk', '广场舞', '傣族舞', '蒙古舞'],
    'kpop': ['k-pop', 'kpop', '韩舞', '偶像舞'],
    'breaking': ['霹雳舞', 'breaking', 'breakdance', '地板舞'],
    'tango': ['探戈', 'tango', '阿根廷'],
    'waltz': ['华尔兹', 'waltz', '圆舞曲'],
    'flamenco': ['弗拉门戈', 'flamenco', '西班牙舞'],
    'battle': ['街舞battle', 'battle', '斗舞', '尬舞'],
    'popping': ['机械舞', 'popping', 'poping', '震感舞'],
    'waacking': ['甩手舞', 'waacking', 'waack'],
    'dance-epic': ['群舞', '大型舞蹈', '舞蹈史诗', '百老汇']
  };
  for (const [style, keywords] of Object.entries(danceKeywords)) {
    if (keywords.some(kw => desc.includes(kw) || (storyPlan.title || '').includes(kw))) {
      musicStyle = style;
      break;
    }
  }
  
  return { environment, actionType, emotion, musicStyle };
}

// ============ 生成声音设计 ============
// v5.7-Peng-fix: 防御性字段访问 — 空值检查避免崩溃
function generateSoundDesign(shot, storyPlan, voiceSignatures) {
  // v5.7-Peng-fix: 防御默认值
  if (!shot || typeof shot !== 'object') {
    shot = {};
  }
  
  const analysis = analyzeScene(shot, storyPlan);
  const duration = shot.duration || 5;
  const shotId = shot.id || 'UNKNOWN';
  const shotTension = typeof shot.tension === 'number' ? shot.tension : 50;
  
  // 1. 环境音
  const ambienceElements = AMBIENCE_LIBRARY[analysis.environment] || AMBIENCE_LIBRARY['室内'];
  const ambience = {
    description: `${analysis.environment}环境音：${ambienceElements.join('、')}`,
    elements: ambienceElements,
    volume: -20,
    loop: true,
    fadeIn: 0.5,
    fadeOut: 0.5,
  };
  
  // 2. 音效
  const sfxEvents = [];
  const sfxTemplate = SFX_LIBRARY[analysis.actionType];
  if (sfxTemplate) {
    for (const evt of sfxTemplate) {
      const time = Math.min(evt.timeOffset, duration * 0.8); // 不超出镜头时长
      sfxEvents.push({
        time: parseFloat(time.toFixed(1)),
        description: evt.name,
        volume: evt.volume,
      });
    }
  }
  
  // 根据镜头类型补充额外音效
  if (shot.type?.includes('高潮') || shotTension > 85) {
    sfxEvents.push({ time: duration * 0.5, description: '冲击波低频震动', volume: -8 });
  }
  
  // 3. 音乐
  const musicInfo = MUSIC_STYLES[analysis.musicStyle] || MUSIC_STYLES['neutral'] || { name: '中性', tempo: '无', key: 'C', instruments: ['合成器'], mood: '中性' };
  const music = {
    style: musicInfo.name,
    mood: musicInfo.mood,
    tempo: musicInfo.tempo,
    key: musicInfo.key,
    instruments: musicInfo.instruments || ['合成器'],
    volume: -15,
    fadeIn: 1.0,
    fadeOut: 1.0,
    entryPoint: shot.type?.includes('建置') ? 0 : 0.5,
  };
  
  // v5.1-Peng: 情感声学映射
  const emotionAcoustics = EMOTION_ACOUSTICS_MAP[analysis.emotion] || EMOTION_ACOUSTICS_MAP['平静/建置'];
  
  // 4. 对白（融入 VoiceCraft 角色声纹）
  const dialogue = { lines: [], volume: -3 };
  
  // 尝试从角色声纹中匹配说话者
  let voiceSignature = null;
  let speakerName = '角色';
  
  // v5.7-Peng-fix: 防御性角色访问 — 空值检查避免崩溃
  const characters = shot.characters || [];
  if (voiceSignatures && characters.length > 0) {
    const charId = characters[0];
    // charId可能是字符串或对象
    const lookupId = typeof charId === 'string' ? charId : (charId.id || charId.name || String(charId));
    voiceSignature = voiceSignatures[lookupId];
    if (voiceSignature) {
      speakerName = voiceSignature.characterName || voiceSignature.name || lookupId;
    }
  }
  
  // 根据角色声纹生成对白风格
  let dialogueEmotion = analysis.emotion;
  let dialogueText = '【根据剧情补充对白】';
  let deliveryStyle = '常规演绎';
  
  if (voiceSignature) {
    const sig = voiceSignature;
    
    // v5.7-Peng-fix: 防御性声纹访问 — 空值检查避免崩溃
    const triggerThreshold = sig.triggerThreshold || 90;
    if (shotTension >= triggerThreshold) {
      dialogueEmotion = '失控/撕裂';
      const extremeVocal = sig.vocalCords?.extreme || sig.extreme || '声音撕裂';
      dialogueText = '【失控嘶吼——参考声纹: ' + extremeVocal + '】';
      deliveryStyle = extremeVocal;
    } else if (sig.dominantTimbre || sig.timbre) {
      deliveryStyle = sig.dominantTimbre || sig.timbre;
    }
    
    // 沉默模式：根据声纹中的沉默设计
    const silencePattern = sig.silencePattern || sig.silence;
    if (silencePattern && shot.type?.includes('濒死')) {
      dialogueText = '【完全静默——参考声纹: ' + silencePattern + '】';
      deliveryStyle = '绝对静默，仅余环境音';
    }
  }
  
  // 简单的对白生成逻辑
  if (shot.type?.includes('对话') || (shot.description || '').includes('说')) {
    dialogue.lines.push({
      time: duration * 0.2,
      speaker: speakerName,
      text: dialogueText,
      emotion: dialogueEmotion,
      delivery: deliveryStyle,
    });
  }
  
  // 动作喊叫
  if (analysis.actionType === '打斗' && shotTension > 60) {
    let shoutText = '【战斗呐喊/怒喝】';
    let shoutStyle = '粗犷喊叫';
    
    if (voiceSignature) {
      const combatVocal = voiceSignature.vocalCords?.combat || voiceSignature.combat || '爆发性怒喝';
      shoutText = '【战斗呐喊——参考声纹: ' + combatVocal + '】';
      shoutStyle = combatVocal;
    }
    
    dialogue.lines.push({
      time: duration * 0.3,
      speaker: speakerName,
      text: shoutText,
      emotion: '怒喝',
      delivery: shoutStyle,
    });
  }
  
  // 濒死/重伤（根据声纹沉默设计）
  const hasSilencePattern = voiceSignature && (voiceSignature.silencePattern || voiceSignature.silence);
  if ((shot.type?.includes('濒死') || shotTension > 90) && hasSilencePattern) {
    const silenceText = voiceSignature.silencePattern || voiceSignature.silence || '濒死静默';
    dialogue.lines.push({
      time: duration * 0.8,
      speaker: speakerName,
      text: '【' + silenceText + '】',
      emotion: '濒死/虚弱',
      delivery: '微弱喘息，逐渐静默',
    });
  }
  
  return {
    shotId: shotId,
    duration,
    tension: shotTension,
    sceneAnalysis: analysis,
    ambience,
    sfx: { events: sfxEvents },
    music,
    dialogue,
    voiceCraft: voiceSignature ? {
      characterId: voiceSignature.characterId || voiceSignature.id || 'unknown',
      signature: voiceSignature,
    } : null,
    // v5.1-Peng: 情感声学映射
    emotionAcoustics: {
      emotion: analysis.emotion,
      ...emotionAcoustics
    }
  };
}

// ============ Stage 1+2: 设计流程 ============
// v5.7-Peng-fix: 防御性编程 — 每个关键步骤增加try-catch
function design(args) {
  const productionDir = args['production-dir'] || args.productionDir;
  let outputDir = args['output-dir'] || args.outputDir;
  const generateAudio = args['generate-audio'] === 'true' || args.generateAudio === 'true';
  const voiceStatePath = args['voice-state'] || args.voiceState;
  
  if (!productionDir) {
    console.error('❌ 缺少 --production-dir 参数');
    process.exit(1);
  }
  
  if (!outputDir) {
    outputDir = path.join(productionDir, '07-sound');
  }
  
  log('SoundDesign', `🎵 开始声音设计: ${productionDir}`);
  log('SoundDesign', `📁 输出目录: ${outputDir}`);
  
  // v5.7-Peng-fix: 防御检查 — story-plan存在性和有效性
  const storyPlanPath = path.join(productionDir, '01-story-plan.json');
  if (!fs.existsSync(storyPlanPath)) {
    log('SoundDesign', `⚠️ 缺少story-plan.json，创建空的声音设计占位`, 'warn');
    // 不抛出异常，创建空设计
    createEmptyDesign(outputDir, '未找到故事计划');
    return { jsonPath: path.join(outputDir, 'sound-design-master.json'), mdPath: path.join(outputDir, 'sound-design.md'), csvPath: path.join(outputDir, 'sound-timeline.csv') };
  }
  
  let storyPlan;
  try {
    storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
  } catch (e) {
    log('SoundDesign', `⚠️ story-plan.json解析失败: ${e.message}，创建空设计`, 'warn');
    createEmptyDesign(outputDir, '故事计划解析失败');
    return { jsonPath: path.join(outputDir, 'sound-design-master.json'), mdPath: path.join(outputDir, 'sound-design.md'), csvPath: path.join(outputDir, 'sound-timeline.csv') };
  }
  
  // v5.7-Peng-fix: 防御检查 — shots有效性
  const shots = storyPlan.shots || [];
  if (!Array.isArray(shots) || shots.length === 0) {
    log('SoundDesign', `⚠️ story-plan中无镜头数据，创建空设计`, 'warn');
    createEmptyDesign(outputDir, storyPlan.title || '无镜头');
    return { jsonPath: path.join(outputDir, 'sound-design-master.json'), mdPath: path.join(outputDir, 'sound-design.md'), csvPath: path.join(outputDir, 'sound-timeline.csv') };
  }
  
  log('SoundDesign', `📋 项目: ${storyPlan.title || '未命名'}, ${shots.length}个镜头`);
  
  // 🔊 读取 VoiceCraft 角色声纹（如果提供）
  let voiceSignatures = null;
  if (voiceStatePath && fs.existsSync(voiceStatePath)) {
    try {
      const voiceState = JSON.parse(fs.readFileSync(voiceStatePath, 'utf8'));
      voiceSignatures = voiceState.signatures || voiceState;
      log('SoundDesign', `🔊 已加载 VoiceCraft 角色声纹: ${Object.keys(voiceSignatures).length} 个角色`);
    } catch (e) {
      log('SoundDesign', `⚠️ 读取 voice-state.json 失败: ${e.message}，继续通用设计`, 'warn');
    }
  } else if (voiceStatePath) {
    log('SoundDesign', `⚠️ 声纹文件不存在: ${voiceStatePath}，继续通用设计`, 'warn');
  }
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 为每个镜头生成声音设计
  const masterDesign = {
    project: storyPlan.title || '未命名项目',
    totalShots: shots.length,
    generatedAt: new Date().toISOString(),
    voiceCraftEnabled: !!voiceSignatures,
    voiceCharacters: voiceSignatures ? Object.keys(voiceSignatures) : [],
    shots: [],
  };
  
  // v5.7-Peng-fix: 每个shot独立try-catch，一个失败不影响其他
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    try {
      if (!shot || typeof shot !== 'object') {
        log('SoundDesign', `⚠️ Shot[${i}]无效，跳过`, 'warn');
        continue;
      }
      
      const shotId = shot.id || `S${String(i + 1).padStart(2, '0')}`;
      log('SoundDesign', `🎬 设计 ${shotId}: ${shot.type || '未分类'} (${shot.duration || '?'}秒)`);
      
      const design = generateSoundDesign(shot, storyPlan, voiceSignatures);
      masterDesign.shots.push(design);
    } catch (e) {
      log('SoundDesign', `⚠️ Shot[${i}]声音设计失败: ${e.message}，跳过`, 'warn');
      // 继续处理下一个shot
    }
  }
  
  // v5.7-Peng-fix: 文件写入独立try-catch，确保至少输出一个文件
  let jsonPath, mdPath, csvPath;
  
  try {
    jsonPath = path.join(outputDir, 'sound-design-master.json');
    fs.writeFileSync(jsonPath, JSON.stringify(masterDesign, null, 2));
    log('SoundDesign', `✅ 主数据: ${jsonPath}`);
  } catch (e) {
    log('SoundDesign', `❌ JSON写入失败: ${e.message}`, 'error');
    jsonPath = null;
  }
  
  try {
    mdPath = path.join(outputDir, 'sound-design.md');
    const mdContent = generateMarkdownReport(masterDesign, storyPlan);
    fs.writeFileSync(mdPath, mdContent);
    log('SoundDesign', `✅ 文档: ${mdPath}`);
  } catch (e) {
    log('SoundDesign', `❌ Markdown写入失败: ${e.message}`, 'error');
    mdPath = null;
  }
  
  try {
    csvPath = path.join(outputDir, 'sound-timeline.csv');
    const csvContent = generateCsvTimeline(masterDesign);
    fs.writeFileSync(csvPath, csvContent);
    log('SoundDesign', `✅ 时间码: ${csvPath}`);
  } catch (e) {
    log('SoundDesign', `❌ CSV写入失败: ${e.message}`, 'error');
    csvPath = null;
  }
  
  // 尝试生成音频（如果开启）
  if (generateAudio) {
    log('SoundDesign', '🔊 尝试生成音频文件...');
    // 🟢 v5.7-Peng: 音频生成待外部API集成（Suno/Freesound）
    log('SoundDesign', '⚠️ 音频生成功能待实现（需要Suno/Freesound API）');
  }
  
  log('SoundDesign', '🎉 声音设计完成！');
  console.log(`
═══════════════════════════════════════════════════════
🎵 声音设计输出

主数据: ${jsonPath || '写入失败'}
设计文档: ${mdPath || '写入失败'}
时间码表: ${csvPath || '写入失败'}
${voiceSignatures ? `
🔊 VoiceCraft 角色声纹已融入:
${Object.entries(voiceSignatures).map(([id, sig]) => `  - ${id}: ${sig.dominantTimbre || '已加载'}`).join('\n')}
` : ''}
下一步:
1. 查看 sound-design.md 了解每个镜头的声音方案
2. 使用 sound-timeline.csv 在PR/AU/剪映中手动配乐
3. 或配置Suno/Freesound API实现自动生成
═══════════════════════════════════════════════════════
  `);
  
  return { jsonPath, mdPath, csvPath };
}

// v5.7-Peng-fix: 空设计占位创建
function createEmptyDesign(outputDir, reason) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const emptyDesign = {
    project: reason,
    totalShots: 0,
    generatedAt: new Date().toISOString(),
    voiceCraftEnabled: false,
    voiceCharacters: [],
    shots: [],
    _empty: true,
    _reason: reason
  };
  
  fs.writeFileSync(path.join(outputDir, 'sound-design-master.json'), JSON.stringify(emptyDesign, null, 2));
  fs.writeFileSync(path.join(outputDir, 'sound-design.md'), `# 声音设计 — ${reason}\n\n⚠️ 未找到有效的故事计划数据，声音设计为空。\n\n请检查：\n1. story-plan.json是否存在且格式正确\n2. shots数组是否为空\n`);
  fs.writeFileSync(path.join(outputDir, 'sound-timeline.csv'), 'ShotID,Time,Layer,Description,Volume,Duration\n');
}

// ============ Markdown报告生成 ============
function generateMarkdownReport(master, storyPlan) {
  let md = `# 声音设计文档 — ${master.project}\n\n`;
  md += `**项目**: ${master.project}  
`;
  md += `**镜头数**: ${master.totalShots}  
`;
  md += `**生成时间**: ${new Date(master.generatedAt).toLocaleString('zh-CN')}  
\n`;
  md += `---\n\n`;
  
  for (const shot of master.shots) {
    if (!shot || !shot.sceneAnalysis) continue;
    
    const a = shot.sceneAnalysis || {};
    const music = shot.music || {};
    const ambience = shot.ambience || {};
    const sfx = shot.sfx || { events: [] };
    const dialogue = shot.dialogue || { lines: [] };
    
    md += `## ${shot.shotId || 'UNKNOWN'} — ${a.actionType || '未分类'} @ ${a.environment || '室内'}\n\n`;
    md += `**时长**: ${shot.duration || 0}秒 | **情绪**: ${a.emotion || '中性'} | **音乐风格**: ${music.style || '中性'}\n\n`;
    
    // 环境音
    md += `### 🔊 环境音（Ambience）\n`;
    md += `- **描述**: ${ambience.description || '无'}\n`;
    md += `- **音量**: ${ambience.volume !== undefined ? ambience.volume : -20}dB\n`;
    md += `- **淡入/淡出**: ${ambience.fadeIn || 0.5}s / ${ambience.fadeOut || 0.5}s\n\n`;
    
    // 音效
    md += `### 💥 音效（SFX）\n`;
    if (sfx.events && sfx.events.length > 0) {
      md += `| 时间 | 音效 | 音量 |\n`;
      md += `|------|------|------|\n`;
      for (const evt of sfx.events) {
        md += `| ${evt.time !== undefined ? evt.time : 0}s | ${evt.description || '未知'} | ${evt.volume !== undefined ? evt.volume : -10}dB |\n`;
      }
    } else {
      md += `*无特定音效事件*\n`;
    }
    md += `\n`;
    
    // 音乐
    md += `### 🎼 音乐（Music）\n`;
    md += `- **风格**: ${music.style || '中性'} (${music.mood || '中性'})\n`;
    md += `- **乐器**: ${(music.instruments || ['合成器']).join('、')}\n`;
    md += `- **速度/调性**: ${music.tempo || '无'} / ${music.key || 'C'}\n`;
    md += `- **音量**: ${music.volume !== undefined ? music.volume : -15}dB\n`;
    md += `- **入场点**: ${music.entryPoint !== undefined ? music.entryPoint : 0}s\n\n`;
    
    // 对白
    md += `### 🗣️ 对白（Dialogue）\n`;
    if (dialogue.lines && dialogue.lines.length > 0) {
      for (const line of dialogue.lines) {
        md += `- **${line.time !== undefined ? line.time : 0}s** [${line.speaker || '角色'}] *${line.emotion || '中性'}*: "${line.text || ''}"\n`;
        if (line.delivery) {
          md += `  - **演绎风格**: ${line.delivery}\n`;
        }
      }
    } else {
      md += `*无对白*\n`;
    }
    
    // VoiceCraft 角色声纹信息
    if (shot.voiceCraft && shot.voiceCraft.signature) {
      md += `\n**🔊 VoiceCraft 角色声纹**:\n`;
      const sig = shot.voiceCraft.signature;
      if (sig.dominantTimbre || sig.timbre) md += `- 主音色: ${sig.dominantTimbre || sig.timbre}\n`;
      if (sig.vocalCords?.normal || sig.normal) md += `- 常规状态: ${sig.vocalCords?.normal || sig.normal}\n`;
      if (sig.vocalCords?.combat || sig.combat) md += `- 战斗状态: ${sig.vocalCords?.combat || sig.combat}\n`;
      if (sig.vocalCords?.extreme || sig.extreme) md += `- 极端状态: ${sig.vocalCords?.extreme || sig.extreme}\n`;
      if (sig.silencePattern || sig.silence) md += `- 沉默模式: ${sig.silencePattern || sig.silence}\n`;
      if (sig.triggerThreshold) md += `- 失控阈值: 情绪值 ≥ ${sig.triggerThreshold}\n`;
    }
    
    md += `\n---\n\n`;
  }
  
  md += `## 音乐风格参考\n\n`;
  for (const [key, style] of Object.entries(MUSIC_STYLES || {})) {
    if (style) {
      md += `- **${style.name || key}**: ${(style.instruments || []).join('+')} | ${style.tempo || '无'} | ${style.mood || '中性'}\n`;
    }
  }
  
  return md;
}

// ============ CSV时间码生成 ============
// v5.7-Peng-fix: 防御性编程 — 所有字段访问前检查
function generateCsvTimeline(master) {
  let csv = 'ShotID,Time,Layer,Description,Volume,Duration\n';
  
  for (const shot of (master.shots || [])) {
    if (!shot) continue;
    
    const shotId = shot.shotId || 'UNKNOWN';
    const duration = shot.duration || 5;
    const ambience = shot.ambience || {};
    const sfx = shot.sfx || { events: [] };
    const music = shot.music || {};
    const dialogue = shot.dialogue || { lines: [] };
    
    // 环境音
    csv += `${shotId},0,Ambience,"${(ambience.description || '').replace(/"/g, '""')}",${ambience.volume !== undefined ? ambience.volume : -20},${duration}\n`;
    
    // 音效
    if (sfx.events) {
      for (const evt of sfx.events) {
        csv += `${shotId},${evt.time !== undefined ? evt.time : 0},SFX,"${(evt.description || '').replace(/"/g, '""')}",${evt.volume !== undefined ? evt.volume : -10},0.5\n`;
      }
    }
    
    // 音乐
    const musicStyle = (music.style || '中性') + ' (' + (music.mood || '中性') + ')';
    const entryPoint = music.entryPoint !== undefined ? music.entryPoint : 0;
    csv += `${shotId},${entryPoint},Music,"${musicStyle.replace(/"/g, '""')}",${music.volume !== undefined ? music.volume : -15},${duration - entryPoint}\n`;
    
    // 对白
    if (dialogue.lines) {
      for (const line of dialogue.lines) {
        const text = `[${line.speaker || '角色'}] ${line.text || ''} (${line.emotion || '中性'})`;
        csv += `${shotId},${line.time !== undefined ? line.time : 0},Dialogue,"${text.replace(/"/g, '""')}",${dialogue.volume !== undefined ? dialogue.volume : -3},2\n`;
      }
    }
  }
  
  return csv;
}

// ============ 导出功能 ============
function exportDoc(args) {
  const productionDir = args['production-dir'] || args.productionDir;
  const format = args.format || 'md';
  
  if (!productionDir) {
    console.error('❌ 缺少 --production-dir 参数');
    process.exit(1);
  }
  
  const soundDir = path.join(productionDir, '07-sound');
  const jsonPath = path.join(soundDir, 'sound-design-master.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ 未找到声音设计数据，请先运行 design 命令');
    process.exit(1);
  }
  
  const master = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const storyPlanPath = path.join(productionDir, '01-story-plan.json');
  const storyPlan = fs.existsSync(storyPlanPath) ? JSON.parse(fs.readFileSync(storyPlanPath, 'utf8')) : {};
  
  if (format === 'md') {
    const mdPath = path.join(soundDir, 'sound-design.md');
    fs.writeFileSync(mdPath, generateMarkdownReport(master, storyPlan));
    console.log(`✅ Markdown导出: ${mdPath}`);
  } else if (format === 'csv') {
    const csvPath = path.join(soundDir, 'sound-timeline.csv');
    fs.writeFileSync(csvPath, generateCsvTimeline(master));
    console.log(`✅ CSV导出: ${csvPath}`);
  } else {
    console.log(JSON.stringify(master, null, 2));
  }
}

// ============ 主入口 ============
function main() {
  const command = process.argv[2];
  const args = parseArgs();
  
  switch (command) {
    case 'design':
      try {
        design(args);
      } catch (e) {
        console.error(`❌ 声音设计失败: ${e.message}`);
        process.exit(1);
      }
      break;
    case 'export':
      exportDoc(args);
      break;
    case 'help':
    default:
      console.log(`
Seedance Sound Design — 声音设计流水线

用法:
  node sound-design.js design --production-dir <dir> [options]
  node sound-design.js export --production-dir <dir> --format <json|md|csv>

design 选项:
  --production-dir    生产目录（必须）
  --output-dir        声音输出目录（默认 生产目录/07-sound）
  --generate-audio    是否生成音频文件（默认false）
  --music-style       音乐风格（epic/tense/sad/suspense/upbeat）
  --voice-state       VoiceCraft 角色声纹文件路径（可选，来自 StoryForge Pro）

示例:
  node sound-design.js design --production-dir ./productions/我的短片-20260512
  node sound-design.js design --production-dir ./productions/我的短片 --voice-state ./voice-craft/voice-state.json
      `);
  }
}

main();
