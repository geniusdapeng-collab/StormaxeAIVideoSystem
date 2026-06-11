#!/usr/bin/env node
/**
 * Scene Writer v3.6-Peng
 * L3 剧本层 — 场景书写器
 * 
 * 将场景大纲转化为专业剧本格式的场景描写
 */

const fs = require('fs');

function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  
  const scenes = writeScenes(input);
  
  const output = {
    version: '3.5-Peng',
    filler: 'scene-writer',
    output: scenes
  };
  
  fs.writeFileSync(args.output, JSON.stringify(output, null, 2));
  console.log(`✅ Scene Writer: ${scenes.length}个场景书写完成`);
}

function writeScenes(input) {
  // 支持两种输入格式
  const plotData = input.plot || {};
  const characterData = input.characterData || input.characters || {};
  const world = input.world || {};
  
  // 从 plotData 获取场景分解
  const sceneBreakdown = plotData.sceneBreakdown || plotData.scenes || [];
  const characters = characterData.characters || characterData || [];
  
  return sceneBreakdown.map((sceneData, index) => {
    const scene = writeScene(sceneData, characters, world, index);
    return scene;
  });
}

function writeScene(sceneData, characters, world, index) {
  const setting = sceneData.setting || '主要场景';
  const timeOfDay = inferTimeOfDay(index);
  const location = inferLocation(setting, world);
  const weather = inferWeather(world);
  const atmosphere = world.atmosphereKeywords?.[0] || '中性氛围';
  
  // v5.5-Peng-CinePrompt: 保留act字段（支持五幕结构）
  const act = sceneData.act || '起';
  const actNumber = sceneData.actNumber || 1;
  
  // 生成slugline（专业剧本格式）
  const slugline = `${location} - ${timeOfDay}`;
  
  // 生成动作段落（更详细）
  const action = generateAction(sceneData, characters, world, weather);
  
  // 生成视觉提示（更详细）
  const visualNotes = generateVisualNotes(sceneData, world, weather);
  
  // 生成音频提示
  const audioNotes = generateAudioNotes(sceneData, world);
  
  // 生成场景设计
  const setDesign = generateSetDesign(sceneData, world);
  
  // 生成道具
  const props = generateProps(sceneData, world);
  
  // 生成镜头建议（更专业）
  const shots = generateShots(sceneData, characters, world);
  
  // 生成情绪曲线
  const emotionCurve = {
    start: sceneData.emotionalTurn?.split('到')[0] || '平静',
    end: sceneData.emotionalTurn?.split('到')[1] || '平静',
    peak: sceneData.isClimax ? '高潮' : '渐进'
  };
  
  return {
    sceneId: sceneData.sceneId || `SC${String(index + 1).padStart(2, '0')}`,
    act,
    actNumber,
    slugLine: slugline,
    action,
    visualNotes,
    audioNotes,
    setDesign,
    props,
    vfxNotes: sceneData.isClimax ? '高潮特效：粒子+光影+慢动作' : '',
    durationEstimate: sceneData.durationEstimate || 15,
    emotionalTone: sceneData.emotionalTurn || '中性',
    emotionCurve,
    shots,
    purpose: sceneData.purpose,
    characters: sceneData.characters || [],
    weather,
    atmosphere,
    lightingSetup: generateLightingSetup(sceneData, world)
  };
}

function inferTimeOfDay(index) {
  const times = ['黎明', '清晨', '正午', '黄昏', '夜晚', '深夜'];
  return times[index % times.length];
}

function inferLocation(setting, world) {
  const locations = world.geography?.split('、') || ['主要场景'];
  return locations[0] || '内景. 未知地点';
}

function inferWeather(world) {
  const climate = world.climate || '温和';
  const weathers = {
    '温和': ['晴朗', '多云', '微风'],
    '寒冷': ['下雪', '冰冻', '寒风'],
    '炎热': ['烈日', '沙尘', '热浪']
  };
  const options = weathers[climate] || weathers['温和'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateLightingSetup(sceneData, world) {
  const timeOfDay = inferTimeOfDay(0);
  const mood = sceneData.emotionalTurn || '中性';
  
  const setups = {
    '黎明': '晨光逆光，暖金色，低角度',
    '清晨': '柔和侧光，冷蓝+暖金混合',
    '正午': '顶光直射，高对比，硬阴影',
    '黄昏': '黄金时刻，侧逆光，长阴影',
    '夜晚': '人工光源为主，霓虹/烛光/路灯',
    '深夜': '月光/星光，极低照度，剪影'
  };
  
  return setups[timeOfDay] || '自然光，中性色温';
}

function generateAction(sceneData, characters, world, weather) {
  const charNames = sceneData.characters?.map(cid => {
    const char = characters.find(c => c.id === cid);
    return char?.name || cid;
  }) || ['角色'];
  
  const atmosphere = world.atmosphereKeywords?.[0] || '氛围';
  const location = sceneData.setting || '场景';
  
  // 更详细的动作描写
  let action = `${charNames.join('和')}在${location}中${sceneData.purpose || '互动'}。`;
  action += `${weather}的${atmosphere}笼罩着整个空间。`;
  
  if (sceneData.isClimax) {
    action += '气氛紧张到极点，每一个动作都充满决定性。';
  }
  
  return action;
}

function generateVisualNotes(sceneData, world, weather) {
  const lighting = world.climate || '自然光';
  const mood = sceneData.emotionalTurn || '中性';
  const style = world.visual_style?.style || '写实';
  const palette = world.visual_style?.color_palette?.join('/') || '中性';
  
  return `${style}风格，${lighting}，${mood}情绪，${weather}天气，色彩${palette}`;
}

function generateAudioNotes(sceneData, world) {
  const ambience = world.atmosphereKeywords?.[0] || '环境音';
  const mood = sceneData.emotionalTurn || '中性';
  
  const musicNotes = {
    '愤怒': '低沉弦乐+打击乐渐强',
    '悲伤': '独奏钢琴+大提琴',
    '喜悦': '轻快弦乐+木管',
    '恐惧': '不和谐音程+电子低音',
    '决心': '铜管+定音鼓',
    '温柔': '竖琴+长笛'
  };
  
  return `${ambience}环境音，${musicNotes[mood] || '中性背景音乐'}`;
}

function generateSetDesign(sceneData, world) {
  const architecture = world.architecture || '现代建筑';
  const style = world.visual_style?.style || '写实';
  return `${architecture}风格${style}呈现，${sceneData.setting || '场景'}设计`;
}

function generateProps(sceneData, world) {
  const baseProps = ['笔记本', '水杯'];
  
  if (world.technology) {
    const tech = world.technology.split('、');
    if (tech[0]) baseProps.push(tech[0]);
  }
  
  if (sceneData.isClimax) {
    baseProps.push('关键道具（剧情转折点）');
  }
  
  // 根据场景类型添加道具
  if (sceneData.purpose?.includes('战斗')) baseProps.push('武器');
  if (sceneData.purpose?.includes('魔法')) baseProps.push('法器');
  if (sceneData.purpose?.includes('科技')) baseProps.push('设备');
  
  return baseProps;
}

function generateShots(sceneData, characters, world) {
  const shots = [];
  const sceneDuration = sceneData.durationEstimate || 15;
  
  // 根据场景时长动态计算镜头数量（更合理）
  let shotCount;
  if (sceneDuration <= 10) {
    shotCount = sceneData.isClimax ? 2 : 1;  // 短场景：1-2个镜头
  } else if (sceneDuration <= 20) {
    shotCount = sceneData.isClimax ? 3 : 2;  // 中场景：2-3个镜头
  } else if (sceneDuration <= 40) {
    shotCount = sceneData.isClimax ? 4 : 3;  // 长场景：3-4个镜头
  } else {
    shotCount = sceneData.isClimax ? 5 : 4;  // 超长场景：4-5个镜头
  }
  
  // 镜头类型多样化（根据场景位置动态分配）
  const shotTypes = [
    { type: '建置', size: '全景', movement: '缓慢推轨', description: '环境展示' },
    { type: '发展', size: '中景', movement: '固定', description: '人物互动' },
    { type: '高潮', size: '特写', movement: '快速推进', description: '情感爆发' },
    { type: '反应', size: '近景', movement: '微推', description: '人物反应' },
    { type: '过渡', size: '空镜', movement: '缓慢横移', description: '氛围延续' },
    { type: '揭示', size: '大全景', movement: '航拍下降', description: '世界观揭示' },
    { type: '紧张', size: '手持特写', movement: '抖动跟随', description: '紧迫感' },
    { type: '对话', size: '过肩镜头', movement: '平滑横移', description: '对白场景' }
  ];
  
  // 为每个场景选择不同的镜头组合（避免重复）
  const startIdx = Math.floor(Math.random() * 3); // 随机起始偏移
  
  for (let i = 0; i < shotCount; i++) {
    const typeIdx = (startIdx + i) % shotTypes.length;
    const shotType = shotTypes[typeIdx];
    const duration = Math.max(2, Math.round(sceneDuration / shotCount));
    
    shots.push({
      shotId: `${sceneData.sceneId}-S${i + 1}`,
      type: shotType.type,
      description: `${shotType.size}镜头，${shotType.movement}，${shotType.description}，${sceneData.purpose || '场景内容'}`,
      cameraDirection: `${shotType.size}构图，${shotType.movement}运镜，${world.visual_style?.style || '写实'}风格`,
      duration,
      lighting: sceneData.emotionalTurn || '中性光',
      focus: i === shotCount - 1 ? '人物面部/关键动作' : '环境/氛围'
    });
  }
  
  return shots;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input') args.input = argv[++i];
    if (argv[i] === '--output') args.output = argv[++i];
  }
  return args;
}

main();