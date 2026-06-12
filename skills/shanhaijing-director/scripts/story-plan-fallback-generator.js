/**
 * story-plan-fallback-generator.js
 * 本地StoryPlan生成器 - 当LLM生成的StoryPlan结构无效时触发
 * 调用: generateFallbackStoryPlan(prd, worldview)
 */
const { extractBalancedJSON } = require('./pipeline-helpers');

/**
 * 从PRD文本解析叙事结构，生成StoryPlan JSON
 * @param {string} prd - PRD文本内容
 * @param {string} worldview - 世界观
 * @returns {object|null} storyPlan对象
 */
function generateFallbackStoryPlan(prd, worldview = 'nirath') {
  if (!prd || typeof prd !== 'string') return null;

  const segments = [];

  // 策略1: 从PRD的"叙事结构"章节提取镜头列表
  // 匹配 ## 叙事结构 章节直到下一个 ## 章节
  const narrativeSectionMatch = prd.match(/##\s*叙事结构.*?(?=##\s*\d|##\s*技术规格|##\s*定妆照|$)/is);
  const narrativeSection = narrativeSectionMatch ? narrativeSectionMatch[0] : prd;

  // 提取所有镜头行（匹配 S00, S01, ... 或 "片头 S00" 等格式）
  const shotLines = [];
  const lines = narrativeSection.split('\n');
  for (const line of lines) {
    if (/S\d\d/i.test(line) || /第\s*\d\s*个?镜?头/.test(line)) {
      shotLines.push(line.trim());
    }
  }

  // 策略2: 如果策略1失败，从PRD全文提取所有S00-S99的行
  if (shotLines.length === 0) {
    const allLines = prd.split('\n');
    for (const line of allLines) {
      if (/S\d\d/i.test(line) && line.length < 300) {
        shotLines.push(line.trim());
      }
    }
  }

  // 策略3: 如果PRD明确提到镜头数(如"7个镜头")，则生成对应数量的镜头
  const shotCountMatch = prd.match(/(\d)\s*个?镜?头/);
  const declaredShotCount = shotCountMatch ? parseInt(shotCountMatch[1]) : 7;

  // 提取角色名
  const beastMatch = prd.match(/(白泽|刑天|烛龙|穷奇|梼杌|饕餮|混沌|英招|陆吾|开明兽)/);
  const humanMatch = prd.match(/(小G|主角|少年|少女)/);
  const beastName = beastMatch ? beastMatch[1] : '白泽';
  const humanName = humanMatch ? humanMatch[1] : '小G';

  // 提取场景关键词
  const sceneKeywords = [];
  const scenePatterns = [
    /远古山脉.{0,20}绝壁|山脉绝壁/,
    /双日.{0,10}暮光|暮光/,
    /地底深处|山脚|深渊/,
    /岩壁裂缝|裂缝/,
    /金色光芒|金色|光芒/,
  ];
  for (const pat of scenePatterns) {
    const m = prd.match(pat);
    if (m) sceneKeywords.push(m[0]);
  }

  if (shotLines.length === 0) {
    // 策略3: 从PRD叙事描述生成镜头
    const defaultShots = [
      { id: 'S00', name: '片头：神兽现身', desc: '远古山脉绝壁，双日暮光，神兽从黑暗中浮现' },
      { id: 'S01', name: '声响：蹄声回荡', desc: '山脚远处，低频震动，蹄声在岩壁间回荡' },
      { id: 'S02', name: '光芒：火焰尾现', desc: '神兽三尾末端的白色火焰从绝壁裂缝中透出' },
      { id: 'S03', name: '震动：大地共鸣', desc: '人物感受到空气中的低频脉动，脚下岩石发出共鸣' },
      { id: 'S04', name: '浮现：竖眼睁开', desc: '神兽额头中央的竖眼首次睁开，金色光芒横扫山脉' },
      { id: 'S05', name: '凝视：神兽全貌', desc: '神兽完全展现身形，人物远远观望' },
      { id: 'S06', name: '接触：人兽相会', desc: '人物缓缓走近，伸手触碰神兽，光脉绽放' },
    ];

    const seg = {
      name: '正片',
      shots: defaultShots.slice(0, declaredShotCount).map((s, i) => ({
        id: `S${String(i).padStart(2, '0')}`,
        description: s.desc,
        character: `${beastName}, ${humanName}`,
        action: '未知',
        scene: sceneKeywords.join('，') || '远古山脉绝壁，双日暮光',
        mood: '神秘',
        camera: '未知',
        lighting: '双日暮光',
        emotion: 'epic_reveal',
        shotSize: '全景',
        cameraMove: '缓慢推进',
        characters: [beastName],
        duration: 8,
        negativePrompt: 'bright daylight, vivid colors, cartoon style',
        renderStyle: 'hyperrealistic CG',
        directorStyle: 'cinematic',
      }))
    };
    segments.push(seg);
  } else {
    // 策略1/2: 从shotLines解析镜头
    const shotList = [];

    for (const line of shotLines) {
      // 跳过"镜头数: X个镜头"这种汇总行
      if (/镜头数/.test(line) && shotLines.length > 1) continue;

      // 提取镜头号
      const idMatch = line.match(/S(\d\d)/i);
      const id = idMatch ? `S${idMatch[1].padStart(2, '0')}` : null;

      // 提取完整描述（冒号后的全部内容，作为主要描述）
      const colonIdx = line.indexOf('：');
      const colonIdx2 = line.indexOf(':');
      const splitIdx = Math.max(colonIdx, colonIdx2);
      let name = '';
      let desc = '';

      if (splitIdx >= 0) {
        const rawDesc = line.substring(splitIdx + 1).trim();
        // 取第一句话（到逗号/句号/顿号为止）作为镜头名
        const firstSentence = rawDesc.split(/[，,]/)[0].trim();
        name = firstSentence;
        // 描述 = 冒号后的完整内容（去掉"1. " "**" 等格式前缀）
        desc = rawDesc.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '').trim();
        if (desc.length < 10) desc = rawDesc; // fallback
      } else {
        name = line.replace(/[*#\-\\]+/g, '').trim();
        desc = name;
      }

      const shotNum = id ? parseInt(id.replace('S', '')) : shotList.length;
      const characters = shotNum >= 2 ? [beastName, humanName] : [beastName];

      shotList.push({
        id: id || `S${String(shotList.length).padStart(2, '0')}`,
        description: desc.substring(0, 300),
        character: `${beastName}, ${humanName}`,
        action: '未知',
        scene: sceneKeywords.join('，') || '远古山脉绝壁',
        mood: '神秘',
        camera: '未知',
        lighting: '双日暮光',
        emotion: 'epic_reveal',
        shotSize: '全景',
        cameraMove: '缓慢推进',
        characters,
        duration: 8,
        negativePrompt: 'bright daylight, vivid colors, cartoon style',
        renderStyle: 'hyperrealistic CG',
        directorStyle: 'cinematic',
      });
    }

    if (shotList.length > 0) {
      segments.push({ name: '正片', shots: shotList });
    }
  }

  if (segments.length === 0) return null;

  // 如果只有1个镜头，补充到 declaredShotCount
  const totalShots = segments.reduce((n, s) => n + s.shots.length, 0);
  if (totalShots === 1 && declaredShotCount > 1) {
    const seg = segments[0];
    const lastId = parseInt(seg.shots[0].id.replace('S', ''));
    for (let i = 1; i < declaredShotCount; i++) {
      seg.shots.push({
        id: `S${String(lastId + i).padStart(2, '0')}`,
        description: `镜头${i + 1}内容`,
        character: `${beastName}, ${humanName}`,
        action: '未知',
        scene: sceneKeywords.join('，') || '远古山脉绝壁',
        mood: '神秘',
        camera: '未知',
        lighting: '双日暮光',
        emotion: 'epic_reveal',
        shotSize: '全景',
        cameraMove: '缓慢推进',
        characters: [beastName, humanName],
        duration: 8,
        negativePrompt: 'bright daylight, vivid colors, cartoon style',
        renderStyle: 'hyperrealistic CG',
        directorStyle: 'cinematic',
      });
    }
  }

  return {
    project: {
      name: beastName,
      type: 'AI视频生成 - 山海经异兽叙事短片',
      worldview: worldview || 'nirath',
      core_theme: '中国古风神话 + 异兽美学',
      total_duration: '60-70秒',
      total_shots: segments.reduce((n, s) => n + s.shots.length, 0)
    },
    segments,
    title: beastName,
    _generatedBy: 'fallback-generator-v6.25'
  };
}

module.exports = { generateFallbackStoryPlan };
