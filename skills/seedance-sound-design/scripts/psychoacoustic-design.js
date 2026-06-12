#!/usr/bin/env node
/**
 * Seedance Sound Design — 心理声学设计 + 音乐动机系统 v5.1-Peng
 * 
 * 功能：
 * 1. 情绪-频率映射（心理声学）
 * 2. 音乐动机 (Leitmotif) 系统
 * 3. 声音层次设计
 * 4. 场景音景规划
 */
const fs = require('fs');
const path = require('path');

// ====== 心理声学映射 ======
const PSYCHOACOUSTIC_MAP = {
  anger: {
    frequency: '低频主导 (40-120Hz)',
    timbre: '粗糙、锯齿波、不和谐音程',
    rhythm: '不规则、急促、syncopated',
    volume: 'ff (极强)',
    instruments: '大鼓、低音弦乐、铜管、打击乐',
    sfx: '金属碰撞、爆炸、碎裂声'
  },
  fear: {
    frequency: '高频紧张 (2000-5000Hz) + 低频压迫',
    timbre: '尖锐、颤音、微分音',
    rhythm: '心跳节奏 (60-80bpm) 逐渐加速',
    volume: 'p → ff (渐强)',
    instruments: '小提琴泛音、木管颤音、合成器Pad',
    sfx: '心跳、呼吸急促、风声、不明来源的低鸣'
  },
  sadness: {
    frequency: '中低频 (200-600Hz)',
    timbre: '温暖、圆润、长混响',
    rhythm: '缓慢、rubato（自由节奏）',
    volume: 'p - mp (弱到中弱)',
    instruments: '大提琴、钢琴、英国管、竖琴',
    sfx: '雨声、滴水、远处钟声、风声'
  },
  joy: {
    frequency: '中高频 (400-2000Hz)',
    timbre: '明亮、谐波丰富、大调',
    rhythm: '轻快、规则、dance-like',
    volume: 'mf - f (中强到强)',
    instruments: '长笛、竖琴、弦乐拨奏、木琴',
    sfx: '鸟鸣、流水、微风、儿童笑声'
  },
  tension: {
    frequency: '全频段渐强 (20-8000Hz)',
    timbre: '不和谐、dissonant cluster、 Shepard tone',
    rhythm: 'accelerando (逐渐加速)',
    volume: 'pp → ff (极强渐强)',
    instruments: '全乐团渐入、合成器riser',
    sfx: '滴答声、低频嗡鸣、逐渐增强的环境噪音'
  },
  calm: {
    frequency: '中频 (300-800Hz)',
    timbre: '平滑、正弦波、和谐泛音',
    rhythm: '缓慢稳定 (60-72bpm)',
    volume: 'pp - p (极弱到弱)',
    instruments: '钢琴独奏、弦乐长音、竖琴琶音',
    sfx: '海浪轻拍、虫鸣、远处风铃'
  },
  awe: {
    frequency: '全频段展开 (20-20000Hz)',
    timbre: '辉煌、宽广、reverb-rich',
    rhythm: '宏大缓慢、grandioso',
    volume: 'mp → ff (渐强到高潮)',
    instruments: '全乐团、合唱、管风琴',
    sfx: '雷声回响、山谷回声、宏大环境声'
  }
};

// ====== 音乐动机 (Leitmotif) 系统 ======
class LeitmotifSystem {
  constructor() {
    this.motifs = new Map();
  }

  register(characterId, motif) {
    this.motifs.set(characterId, {
      id: characterId,
      melody: motif.melody,
      instrument: motif.instrument,
      key: motif.key,
      mood: motif.mood,
      variations: motif.variations || []
    });
  }

  getMotif(characterId, emotion = 'neutral') {
    const motif = this.motifs.get(characterId);
    if (!motif) return null;
    // 根据情绪返回变体
    const variation = motif.variations.find(v => v.emotion === emotion);
    return variation || { ...motif, currentEmotion: emotion };
  }

  planMotifsForPlan(storyPlan) {
    const timeline = [];
    for (const shot of storyPlan.shots || []) {
      const chars = shot.characters || [];
      const motifs = chars.map(c => this.getMotif(c, shot.emotionStart));
      const activeMotifs = motifs.filter(Boolean);
      
      if (activeMotifs.length > 0) {
        timeline.push({
          shotId: shot.id,
          timeRange: shot.timeRange,
          emotion: shot.emotionStart,
          motifs: activeMotifs.map(m => ({
            character: m.id,
            melody: m.melody,
            instrument: m.instrument,
            emotion: m.currentEmotion
          })),
          psychoacoustic: PSYCHOACOUSTIC_MAP[shot.emotionStart.toLowerCase()] || null
        });
      }
    }
    return timeline;
  }
}

// ====== 声音层次设计 ======
function designSoundLayers(shot, videoType = 'action') {
  const layers = {
    foreground: [],  // 前景：对白、主要音效
    midground: [],   // 中景：环境音、背景音乐
    background: []   // 背景：氛围音、远景噪音
  };

  const sfx = getSFXForShot(shot, videoType);
  const psycho = PSYCHOACOUSTIC_MAP[shot.emotionStart?.toLowerCase()] || null;

  layers.foreground.push(sfx.primary || '主要动作音效');
  if (psycho?.sfx) layers.foreground.push(psycho.sfx);
  layers.midground.push(sfx.ambient || '环境氛围音');
  if (psycho?.instruments) layers.midground.push(`配乐方向: ${psycho.instruments}`);
  layers.background.push(sfx.background || '远景环境声');

  return layers;
}

function getSFXForShot(shot, videoType) {
  const type = shot.type || '';
  const sfxByType = {
    action: { primary: '金属碰撞+能量爆裂', ambient: '战场环境音', background: '远处爆炸回音' },
    educational: { primary: '清晰讲解声', ambient: '安静室内', background: '轻微白噪音' },
    drama: { primary: '情绪音效', ambient: '场景环境音', background: '远处城市声' },
    commercial: { primary: '产品音效', ambient: '品牌BGM', background: '场景氛围' },
    documentary: { primary: '现场实录音', ambient: '自然环境音', background: '远景声' }
  };
  return sfxByType[videoType] || sfxByType.action;
}

// ====== 完整声音设计方案 ======
function generateSoundDesign(storyPlan, videoType = 'action') {
  const motifs = new LeitmotifSystem();
  
  // 从 storyPlan 注册角色动机
  for (const char of storyPlan.characters || []) {
    motifs.register(char, {
      melody: `${char} 主题旋律`,
      instrument: '弦乐组',
      key: '小调',
      mood: 'heroic',
      variations: [
        { emotion: '愤怒', melody: `${char} 战斗变奏`, instrument: '铜管+打击乐' },
        { emotion: '悲伤', melody: `${char} 悲伤变奏`, instrument: '大提琴独奏' },
        { emotion: '喜悦', melody: `${char} 欢快变奏`, instrument: '长笛+竖琴' }
      ]
    });
  }

  const timeline = motifs.planMotifsForPlan(storyPlan);
  const soundLayers = (storyPlan.shots || []).map(shot => ({
    shotId: shot.id,
    layers: designSoundLayers(shot, videoType)
  }));

  return {
    version: 'v5.1-Peng',
    totalShots: timeline.length,
    motifs: Array.from(motifs.motifs.values()),
    timeline,
    soundLayers,
    psychoacousticSummary: Object.keys(PSYCHOACOUSTIC_MAP).map(k => ({
      emotion: k,
      frequency: PSYCHOACOUSTIC_MAP[k].frequency,
      volume: PSYCHOACOUSTIC_MAP[k].volume
    }))
  };
}

// CLI
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || true;
      if (args[key] !== true) i++;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.log('用法: node psychoacoustic-design.js --input story-plan.json [--output sound-design.json] [--type action|drama|...]');
    process.exit(0);
  }
  const plan = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  const design = generateSoundDesign(plan, args.type || 'action');
  fs.writeFileSync(args.output || './sound-design.json', JSON.stringify(design, null, 2));
  console.log(`✅ 心理声学设计完成: ${design.totalShots}个镜头`);
}

if (require.main === module) main();
module.exports = { generateSoundDesign, designSoundLayers, LeitmotifSystem, PSYCHOACOUSTIC_MAP };
