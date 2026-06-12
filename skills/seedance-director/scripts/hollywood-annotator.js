#!/usr/bin/env node
/**
 * Hollywood Annotator — 专业注解生成器 (v1.0-Peng)
 * 
 * 第一层接入：为Seedance的generateShotPrompt()注入Hollywood专业能力
 * 
 * 功能：
 * - 读取Hollywood技能文件（DP/Gaffer/Acting Coach）
 * - 根据shot plan生成专业注解（Light Tier / 表演设计 / 光影参数）
 * - 注入到prompt的光线段之前
 * 
 * 用法：
 *   node hollywood-annotator.js generate --shot-file <shot.json> --plan-file <plan.json> [options]
 *   node hollywood-annotator.js annotate --shots <shots.json> --plan <plan.json> --output <output.json>
 */

const fs = require('fs');
const path = require('path');

// ============ Hollywood技能库路径 ============
const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');
const HOLLYWOOD_SKILLS_DIR = path.join(WORKSPACE, 'skills', '好莱坞工业电影技能工厂', '技能系列');

// ============ Light Tier定义（来自v4.1规范） ============
const LIGHT_TIER_MAP = {
  'A': {
    name: '黄金时刻',
    description: '低角度暖光，侧逆光，光质软，硬阴影，长影',
    colorTemp: '1800-2500K',
    lighting: 'golden hour sunlight, warm 2000K, side-back lighting, soft light, long shadows, cinematic',
    mood: '温暖怀旧',
    scenes: ['回忆', '黄昏', '告别', '温情']
  },
  'B': {
    name: '神秘低照',
    description: '单点定向光，无补光，深色背景，高对比，隐喻丰富',
    colorTemp: '2800-4500K',
    lighting: 'single directional light, no fill light, dark background, high contrast, mysterious deep-sea blue-black ambient, volumetric fog',
    mood: '神秘悬疑',
    scenes: ['深海', '夜晚', '古墓', '密室']
  },
  'C': {
    name: '正常日光',
    description: '主光+补光平衡，色温正常，阴影柔和，色彩准确',
    colorTemp: '5000-6500K',
    lighting: 'daylight key light with balanced fill, 5600K neutral white, soft shadows, accurate color, clean professional look',
    mood: '日常专业',
    scenes: ['日间内景', '演播室', '正常光照环境']
  },
  'D': {
    name: '神圣显现',
    description: '内发光/神圣光/火焰，光质强烈，色温极端，明暗对比极强',
    colorTemp: '2500-3500K或9000K+',
    lighting: 'divine inner glow, intense backlight, god ray, strong rim light, golden or cyan bioluminescence, 16:1 contrast ratio',
    mood: '神圣威严',
    scenes: ['神兽苏醒', '神器显现', '奇迹时刻', '神圣降临']
  }
};

// ============ 情绪→Light Tier映射（默认智能推断） ============
const EMOTION_TO_LIGHT_TIER = {
  'awe': 'D',
  'wonder': 'D',
  'fear': 'B',
  'unease': 'B',
  'curiosity': 'B',
  'mystery': 'B',
  'warmth': 'A',
  'nostalgia': 'A',
  'joy': 'A',
  'peace': 'A',
  'tension': 'C',
  'neutral': 'C',
  'sadness': 'A',
  'anger': 'D',
  'love': 'A'
};

// ============ 表演强度→景别映射 ============
const PERFORMANCE_INTENSITY_TO_SHOT = {
  1: 'FS',      // 情绪最低用全景
  2: 'MS',      // 低强度用中景
  3: 'MCU',     // 中等强度用中近景
  4: 'CU',      // 高强度用特写
  5: 'ECU'      // 最高强度用超大特写
};

// ============ 工具函数 ============

/**
 * 从shot描述推断情绪
 */
function inferEmotion(shot) {
  const desc = (shot.description || '').toLowerCase();
  const emotionalKeywords = {
    awe: ['神圣', '威严', '震撼', '敬畏', '惊叹', '发光', '神兽', '神器', '显现'],
    fear: ['恐惧', '害怕', '惊吓', '黑暗', '危险', '逼近', '威胁'],
    curiosity: ['探索', '发现', '好奇', '寻找', '观察', '窥视'],
    warmth: ['温情', '温暖', '拥抱', '爱意', '亲密', '家人'],
    peace: ['平静', '安详', '沉睡', '休息', '宁静'],
    tension: ['紧张', '对峙', '僵持', '危机', '冲突'],
    sadness: ['悲伤', '哭泣', '失落', '哀伤', '绝望'],
    anger: ['愤怒', '爆发', '激动', '激烈', '对抗']
  };
  
  for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
    if (keywords.some(kw => desc.includes(kw))) {
      return emotion;
    }
  }
  return 'neutral';
}

/**
 * 推断Light Tier
 * 优先级：D档(神圣词) > D档(情绪) > B档/D档(场景) > 情绪推断
 */
function inferLightTier(shot) {
  const desc = shot.description || '';
  
  // 1. 先看shot是否有明确指定
  if (shot.lightTier && LIGHT_TIER_MAP[shot.lightTier]) {
    return shot.lightTier;
  }
  
  // 2. 神圣/敬畏关键词 → 强制D档（最高优先级）
  const divineKeywords = ['神圣', '发光', '神兽', '神器', '火焰', '爆发', '显现', '苏醒', '神', '光芒', '光耀', '神迹'];
  if (divineKeywords.some(kw => desc.includes(kw))) {
    return 'D';
  }
  
  // 3. 情绪是awe/wonder → 强制D档
  const emotion = inferEmotion(shot);
  if (emotion === 'awe' || emotion === 'wonder') {
    return 'D';
  }
  
  // 4. 从描述关键词推断
  const tierKeywords = {
    'A': ['黄昏', '日落', '夕阳', '暖光', '黄金', '回忆', '温馨'],
    'B': ['深海', '夜晚', '黑暗', '神秘', '阴影', '古墓', '低照'],
    'C': ['日光', '白天', '正常', '室内', '白天']
  };
  
  for (const [tier, keywords] of Object.entries(tierKeywords)) {
    if (keywords.some(kw => desc.includes(kw))) {
      return tier;
    }
  }
  
  // 5. 兜底：情绪推断
  return EMOTION_TO_LIGHT_TIER[emotion] || 'C';
}

/**
 * 推断表演强度 — 最长匹配优先
 */
function inferPerformanceIntensity(shot) {
  const desc = shot.description || '';
  const intensityKeywords = {
    5: ['咆哮', '怒吼', '爆发', '剧烈', '震撼', '震颤', '摧毁', '冲击', '炸裂', '激战', '震耳欲聋'],
    5: ['咆哮', '怒吼', '爆发', '剧烈', '震撼', '震颤', '摧毁', '冲击', '炸裂', '激战', '震耳欲聋'],
    4: ['紧张', '激动', '震惊', '惊吓', '专注', '严肃', '恐惧', '害怕', '威胁', '对峙', '逼近', '瞪大', '微张'],
    3: ['正常', '自然', '日常', '对话', '互动', '发出', '缓缓'],
    2: ['安静', '沉思', '观察', '轻微', '后退', '凝视', '靠近', '微光', '睁眼', '后退半步'],
    1: ['沉睡', '静止', '沉默', '远景', '全景', '静止的', '从沉睡中']
  };

  // 找最长匹配
  let bestMatch = { length: 0, intensity: 3 };
  for (const [intensity, keywords] of Object.entries(intensityKeywords)) {
    for (const kw of keywords) {
      if (desc.includes(kw) && kw.length > bestMatch.length) {
        bestMatch = { length: kw.length, intensity: parseInt(intensity) };
      }
    }
  }
  return bestMatch.intensity;
}

/**
 * 生成单个镜头的Hollywood注解
 */
function generateShotAnnotation(shot, plan) {
  const lightTier = inferLightTier(shot);
  const tierInfo = LIGHT_TIER_MAP[lightTier];
  const emotion = inferEmotion(shot);
  const perfIntensity = inferPerformanceIntensity(shot);
  const shotSize = PERFORMANCE_INTENSITY_TO_SHOT[perfIntensity];
  
  // 从plan中获取场景信息
  const scene = plan.scenes?.find(s => s.id === shot.sceneId) || {};
  const pacingNote = scene.pacing || '';
  
  // 表演设计注解
  const performanceNote = generatePerformanceNote(shot, emotion, perfIntensity);
  
  // 光线注解
  const lightingNote = tierInfo.lighting;
  
  return {
    shotId: shot.id,
    lightTier,
    lightTierName: tierInfo.name,
    lightTierMood: tierInfo.mood,
    lightingNote,
    emotion,
    performanceIntensity: perfIntensity,
    suggestedShotSize: shotSize,
    performanceNote,
    cameraGuidance: generateCameraGuidance(shot, lightTier, emotion),
    continuityNote: generateContinuityNote(shot),
    soundHint: generateSoundHint(emotion, lightTier)
  };
}

/**
 * 生成表演注解
 */
function generatePerformanceNote(shot, emotion, intensity) {
  const emotionExpressions = {
    awe: `瞳孔缓慢放大（0.5s入点，持续3-5s），呼吸频率降低，下意识后退半步，${intensity >= 4 ? '嘴巴微张，身体僵硬' : '保持静止但眼神变化'}`,
    fear: `${intensity >= 4 ? '瞳孔收缩，眨眼频率加快，身体微微后仰' : '眼神飘移，避免直视，姿态防御性收缩'}`,
    curiosity: `眼神聚焦，眉毛微微抬起，头部略微前倾，${intensity >= 3 ? '嘴角微扬' : '表情中性'}`,
    warmth: `眉眼放松，嘴角上扬，${intensity >= 4 ? '眼眶泛红，情绪外露' : '温和微笑，身体开放性姿态'}`,
    peace: `面部肌肉完全放松，呼吸深长缓慢，${intensity <= 2 ? '眼睛半闭或完全闭合' : '面部平静'}`,
    tension: `${intensity >= 4 ? '下颌紧绷，拳头握紧，肩膀耸起' : '眼神锐利，姿态僵硬'}${intensity >= 3 ? '，吞咽动作' : ''}`,
    sadness: `${intensity >= 4 ? '眼眶泛红，嘴角下垂，身体蜷缩' : '眼神黯淡，面部下垂，叹气'}`,
    anger: `${intensity >= 4 ? '面部涨红，眉间紧锁，身体前倾威胁感' : '眉头紧皱，语气变硬'}`,
    neutral: `${intensity >= 4 ? '表情夸张，肢体幅度大，表演外放' : intensity <= 2 ? '表情控制自然，身体放松，表演内敛' : '自然表情，适度肢体，表演克制'}`
  };

  const expr = emotionExpressions[emotion] || emotionExpressions.neutral;
  return `[performance: ${expr}]`;
}

/**
 * 生成镜头指导注解
 */
function generateCameraGuidance(shot, lightTier, emotion) {
  const cameraNotes = {
    'D': '固定机位优先，推近时保持稳定，若动则极慢，让神圣感有时间建立',
    'B': '允许手持轻微晃动增加紧张感，推近时节奏稳定，营造逼近感',
    'A': '缓慢推近或轻微横移，保持抒情节奏，配合长阴影建立时间',
    'C': '稳定professional风格，允许正常剪辑节奏'
  };
  
  let note = cameraNotes[lightTier] || cameraNotes['C'];
  
  // 情绪调整
  if (emotion === 'awe' || emotion === 'wonder') {
    note += '，推近速度极慢（每5秒不超过10%），让观众有时间消化画面';
  } else if (emotion === 'fear') {
    note += '，不规则微调机位增加不安感';
  }
  
  return note;
}

/**
 * 生成连续性注解
 */
function generateContinuityNote(shot) {
  const desc = (shot.description || '').toLowerCase();
  const hasAction = shot.action || desc;
  
  // 基于shot描述推断连续性需求
  if (desc.includes('继续') || desc.includes('紧接') || desc.includes('承接')) {
    return '注意与前镜头的动作连续性（soft continuity模式）';
  }
  if (desc.includes('全新') || desc.includes('开始') || desc.includes('开场')) {
    return '新场景，无需连续性约束（none模式）';
  }
  return '注意表演和视线连续性（strict continuity模式）';
}

/**
 * 生成声音提示
 */
function generateSoundHint(emotion, lightTier) {
  const soundMap = {
    'D': '静默或极低频轰鸣，让视觉震撼独占',
    'B': '环境音低频暗示，配合偶尔的声响惊喜',
    'A': '温暖的背景氛围音，避免打断抒情节奏',
    'C': '标准专业混音，环境音自然'
  };
  
  return soundMap[lightTier] || soundMap['C'];
}

// ============ 主函数 ============

/**
 * 为所有shots生成注解
 */
function generateAnnotations(shots, plan) {
  const annotations = {};
  
  for (const shot of shots) {
    annotations[shot.id] = generateShotAnnotation(shot, plan);
  }
  
  return annotations;
}

/**
 * 将注解注入prompt
 */
function injectAnnotationToPrompt(annotation, originalPrompt) {
  if (!annotation) return originalPrompt;
  
  // 在atmospheric lighting之后插入Hollywood注解
  // 格式：[Hollywood: LightTier-D|表演设计|镜头指导]
  
  const hollywoodNote = `[Hollywood: ${annotation.lightTierName}(Tier ${annotation.lightTier}) — ${annotation.performanceNote} — ${annotation.cameraGuidance}]`;
  
  // 插入到负面提示词之前
  const negIndex = originalPrompt.indexOf('. Negative:');
  if (negIndex > 0) {
    return originalPrompt.substring(0, negIndex) + ', ' + hollywoodNote + originalPrompt.substring(negIndex);
  }
  
  // 如果没有负面提示词，追加到末尾
  return originalPrompt + ', ' + hollywoodNote;
}

// ============ CLI ============

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'generate') {
    const shotFile = args.find(a => a.startsWith('--shot-file='))?.split('=')[1];
    const planFile = args.find(a => a.startsWith('--plan-file='))?.split('=')[1];
    const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1];
    
    if (!shotFile || !planFile) {
      console.error('用法: hollywood-annotator.js generate --shot-file=<file> --plan-file=<file> --output=<file>');
      process.exit(1);
    }
    
    const shot = JSON.parse(fs.readFileSync(shotFile, 'utf8'));
    const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    
    const annotation = generateShotAnnotation(shot, plan);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(annotation, null, 2));
      console.log(`✅ 注解已保存至 ${outputFile}`);
    } else {
      console.log(JSON.stringify(annotation, null, 2));
    }
  }
  else if (command === 'annotate') {
    const shotsFile = args.find(a => a.startsWith('--shots='))?.split('=')[1];
    const planFile = args.find(a => a.startsWith('--plan='))?.split('=')[1];
    const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1];
    
    if (!shotsFile || !planFile) {
      console.error('用法: hollywood-annotator.js annotate --shots=<file> --plan=<file> --output=<file>');
      process.exit(1);
    }
    
    const shots = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));
    const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    
    const annotations = generateAnnotations(shots, plan);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(annotations, null, 2));
      console.log(`✅ ${Object.keys(annotations).length}个镜头注解已保存至 ${outputFile}`);
    } else {
      console.log(JSON.stringify(annotations, null, 2));
    }
  }
  else if (command === 'inject') {
    // 用于测试：将注解注入到prompt
    const prompt = args.find(a => a.startsWith('--prompt='))?.split('=')[1]?.replace(/\\n/g, '\n');
    const annotationFile = args.find(a => a.startsWith('--annotation='))?.split('=')[1];
    
    if (!prompt || !annotationFile) {
      console.error('用法: hollywood-annotator.js inject --prompt=<text> --annotation=<file>');
      process.exit(1);
    }
    
    const annotation = JSON.parse(fs.readFileSync(annotationFile, 'utf8'));
    const enhanced = injectAnnotationToPrompt(annotation, prompt);
    
    console.log('原始prompt:', prompt);
    console.log('---');
    console.log('增强后:', enhanced);
  }
  else {
    console.log('Hollywood Annotator v1.0-Peng');
    console.log('用法:');
    console.log('  hollywood-annotator.js generate --shot-file=<file> --plan-file=<file> --output=<file>');
    console.log('  hollywood-annotator.js annotate --shots=<file> --plan=<file> --output=<file>');
    console.log('  hollywood-annotator.js inject --prompt=<text> --annotation=<file>');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateShotAnnotation,
  generateAnnotations,
  injectAnnotationToPrompt,
  inferLightTier,
  inferEmotion,
  inferPerformanceIntensity,
  LIGHT_TIER_MAP
};
