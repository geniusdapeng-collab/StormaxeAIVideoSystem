#!/usr/bin/env node
/**
 * Seedance Story Engine
 * 故事引擎脚本 - v9.2.0-Peng
 * 

 *   - 角色弧光增强: 转幕/高潮幕注入转变/觉醒/成长关键词
 *   - 情绪特写增强: 高潮/转折处description增加表情/眼神关键词  
 *   - 光影层次强化: camera字段确保包含光/影关键词
 *   - 记忆点质量提升: 高潮幕强制特写镜头

 *   - 角色弧光增强: 转幕/高潮幕注入转变/觉醒/成长关键词
 *   - 情绪特写增强: 高潮/转折处description增加表情/眼神关键词
 *   - 光影层次强化: camera字段确保包含光/影关键词
 *   - 记忆点质量提升: 高潮幕强制特写镜头

 *   - P0-1修复: overrideWithUserOutline去重 — 同幕shots递进生成独特description
 *   - 保留StoryForge Pro独特生成: 检测到独特description时不覆盖

 *   - 幕type一致性修正: overrideWithUserOutline末尾修正起/承/转/高潮/合的shot.type
 *   - 合幕主动注入: 检测缺失时从用户大纲生成2个合幕镜头
 *   - 时长精确补偿: 基于shots实际duration总和，按幕优先级分配
 *   - 角色智能推断: inferCharactersForShot根据act和description推断所需角色
 *   - 中文标点正则修复: [：:] / [^；。] 支持全角中文标点
 *   - 动作关键词注入: parseUserOutline提取按幕归类，覆盖时注入description
 *   - 情绪-运镜映射: EMOTION_CAMERA_MAP + 舞蹈检测 + 舞蹈运镜追加
 *
 * 已整合到 StoryForge Pro,本文件作为兼容入口保留
 * 内部调用: skills/storyforge-pro/orchestrator.js create
 *
 * 用法:
 *   node story-engine.js plan --title <title> --duration <sec> --outline <text> --characters <ids>
 *   node story-engine.js curve --plan <file>
 *   node story-engine.js export --plan <file> --format <md|json>
 */

const fs = require('fs');
const path = require('path');
const { execAsync } = require('../../seedance-director/scripts/exec-utils');

const EMOTION_CAMERA_MAP = {
  // 0-20: 宁静/建置
  serene: {
    tensionRange: [0, 20],
    camera: '航拍缓慢下降,全景构图,固定机位观察',
    seedanceCue: '缓慢,静谧,固定'
  },
  // 21-40: 警觉/不安
  alert: {
    tensionRange: [21, 40],
    camera: '推轨缓推,中景构图,微晃手持',
    seedanceCue: '渐进,探索,微晃'
  },
  // 41-60: 对抗/冲突升级
  conflict: {
    tensionRange: [41, 60],
    camera: '侧面跟拍,中全景,快速横移',
    seedanceCue: '跟随,对抗,横移'
  },
  // 61-80: 转折/高潮逼近
  climax_approach: {
    tensionRange: [61, 80],
    camera: '环绕180度拍摄,仰拍低角度,快速推进',
    seedanceCue: '环绕,仰拍,推进'
  },
  // 81-100: 高潮/爆发
  climax: {
    tensionRange: [81, 100],
    camera: '子弹时间冻结环绕,特写快速推进,360度旋转',
    seedanceCue: '冻结,环绕,特写'
  },
  // 101+: 超高潮/终极(舞蹈峰值用)
  ultimate: {
    tensionRange: [101, 120],
    camera: '极速甩镜+环绕冻结+仰拍推进复合运镜',
    seedanceCue: '极速,甩镜,复合'
  }
};

function isDanceContent(outline, title) {
  const danceKeywords = [
    '舞', 'dance', '芭蕾', 'ballet', '街舞', 'hiphop', '爵士', 'jazz',
    '拉丁', 'latin', '现代舞', 'contemporary', '民族舞', 'folk',
    'K-pop', 'kpop', '霹雳舞', 'breaking', '探戈', 'tango',
    '华尔兹', 'waltz', '弗拉门戈', 'flamenco', '机械舞', 'popping',
    '甩手舞', 'waacking', '踢踏舞', 'tap', '广场舞', '独舞', '群舞'
  ];
  const text = (outline || '') + ' ' + (title || '');
  return danceKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()));
}

function applyEmotionCameraMap(shot, isDance = false, style = '') {
  const tension = shot.tension || 0;
  let matched = null;

  // 找到匹配的张力区间
  for (const [key, config] of Object.entries(EMOTION_CAMERA_MAP)) {
    if (tension >= config.tensionRange[0] && tension <= config.tensionRange[1]) {
      matched = config;
      break;
    }
  }

  // 默认使用serene
  if (!matched) matched = EMOTION_CAMERA_MAP.serene;

  // 舞蹈内容特殊处理:在原有camera基础上追加舞蹈运镜
  if (isDance) {
    const danceCameraMods = {
      serene: ',舞者静态起势,镜头缓推至手型细节',
      alert: ',舞者步伐启动,跟拍脚部特写',
      conflict: ',双人舞对抗性走位,侧面跟拍身体线条',
      climax_approach: ',独舞旋转加速,环绕拍摄裙摆/衣袂',
      climax: ',舞蹈高潮定格,子弹时间冻结舞者腾空姿态',
      ultimate: ',群舞阵列同步,航拍俯拍几何队形变化'
    };
    const mod = danceCameraMods[Object.entries(EMOTION_CAMERA_MAP).find(([k,v]) => v === matched)?.[0]] || '';
    shot.camera = matched.camera + mod;
  } else {
    // 非舞蹈内容:直接替换为情绪映射的camera(保留原有风格描述)
    const styleMarker = style || '';
    const existingStyle = styleMarker && (typeof shot.camera === 'string' && shot.camera?.includes(styleMarker.split(',')[0])) ? `,${styleMarker.split(',')[0]}风格` : '';
    shot.camera = matched.camera + existingStyle;
  }

  // 添加seedanceCue到shot
  shot.seedanceCameraCue = matched.seedanceCue;
}

function parseUserOutline(outline, explicitCharacters) {
  const result = { characters: [], acts: {}, actionKeywords: [], raw: outline };

  // 1. 优先使用 --characters 参数中明确指定的角色(最可靠)
  if (explicitCharacters && explicitCharacters.trim()) {
    // 支持格式: "关羽,吕布" 或 "C01-关羽,C02-吕布"
    result.characters = explicitCharacters.split(',').map(c => {
      const trimmed = c.trim();
      // 去掉 C01- 前缀
      if (trimmed.match(/^C\d+-/)) {
        return trimmed.replace(/^C\d+-/, '');
      }
      return trimmed;
    }).filter(c => c);
  } else if (outline) {
    // 2. 未提供 --characters 时,从大纲通用提取可能的人名
    // 策略:寻找 "X与Y"、"X和Y"、"X对决Y"、"X大战Y" 等模式中的 X 和 Y
    const pairPatterns = [
      /([^\s,,、]{2,4})与([^\s,,、]{2,4})/,
      /([^\s,,、]{2,4})和([^\s,,、]{2,4})/,
      /([^\s,,、]{2,4})对战([^\s,,、]{2,4})/,
      /([^\s,,、]{2,4})对决([^\s,,、]{2,4})/,
      /([^\s,,、]{2,4})大战([^\s,,、]{2,4})/,
      /([^\s,,、]{2,4})vs([^\s,,、]{2,4})/i
    ];
    const seen = new Set();
    for (const pattern of pairPatterns) {
      const match = outline.match(pattern);
      if (match) {
        for (let i = 1; i < match.length; i++) {
          const rawCandidate = match[i];
          // 清理:去掉末尾的介词/助词(如"在"、"的"、"了"等)
          const suffixesToStrip = ['在', '的', '了', '着', '被', '把', '将'];
          let candidate = rawCandidate;
          for (const suffix of suffixesToStrip) {
            if (candidate.endsWith(suffix) && candidate.length > 2) {
              candidate = candidate.slice(0, -suffix.length);
            }
          }
          // 过滤:排除明显不是人名的词(地点、物品、通用词)
          const nonNameKeywords = ['废墟', '终极', '暗黑', '神话', '电影', '光影', '风格', '动作', '短片', '虎牢关', '大观园'];
          if (candidate && candidate.length >= 2 && !seen.has(candidate) && !nonNameKeywords.some(kw => candidate.includes(kw))) {
            seen.add(candidate);
            result.characters.push(candidate);
          }
        }
      }
    }
  }

  // 3. 通用起承转合提取(与具体角色无关)
  if (outline) {

    const actRegex = /(起幕?|承幕?|发展|转幕?|转折|高潮|合幕?)[：:]\s*([^；。]+)/g;
    let match;
    while ((match = actRegex.exec(outline)) !== null) {
      // 统一key为单个字:起幕→起,合幕→合,发展→承,转折→转,高潮保持高潮
      let actKey = match[1];
      if (actKey === '起幕') actKey = '起';
      else if (actKey === '承幕') actKey = '承';
      else if (actKey === '发展') actKey = '承';
      else if (actKey === '转幕') actKey = '转';
      else if (actKey === '转折') actKey = '转';
      else if (actKey === '合幕') actKey = '合';
      result.acts[actKey] = match[2].trim();
    }
  }

  // 3. 提取场景关键词并按幕归类 (v5.7-Peng-fix: 新增场景提取器)
  const sceneKeywordList = [
    // 地点类
    '南极', '北极', '冰川', '冰屋', '冰原', '雪山', '雪原', '雪地', '雪谷',
    '温泉', '海滩', '海边', '海洋', '大海', '湖泊', '森林', '丛林', '草原',
    '沙漠', '废墟', '城市', '都市', '小镇', '村庄', '城堡', '宫殿', '庭院',
    '天宫', '天庭', '地府', '龙宫', '花果山', '水帘洞', '五行山', '火焰山',
    // 环境元素
    '极光', '星空', '流星雨', '彩虹', '日出', '日落', '黄昏', '黎明', '午夜',
    '暴风雪', '暴风雨', '雷雨', '大雾', '沙尘暴', '龙卷风', '海啸', '地震',
    '樱花', '枫叶', '竹林', '松林', '花海', '麦田', '稻田', '荷塘', '梅林',
    // 生物/角色相关
    '企鹅', '海豹', '北极熊', '鲸鱼', '海豚', '鲨鱼', '章鱼', '海龟',
    '凤凰', '龙', '麒麟', '貔貅', '九尾狐', '白泽', '朱雀', '玄武',
    // 建筑/设施
    '邮轮', '飞船', '飞机', '火车', '马车', '飞艇', '热气球', '潜艇',
    '酒店', '旅馆', '客栈', '营地', '帐篷', '别墅', '公寓', '豪宅',
    // 特殊场景
    '战场', '擂台', '竞技场', '角斗场', '武馆', '道馆', '寺庙', '道观',
    '实验室', '工坊', '密室', '迷宫', '监狱', '地牢', '古墓', '遗迹'
  ];
  if (outline) {

    const segments = outline.split(/；/);
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      let actName = null;
      const actMarkers = {

        '起': /^起[幕:]*/,
        '承': /^承|发展/,
        '转': /^转|转折/,
        '高潮': /^高潮/,
        '合': /^合[幕:]*/
      };
      for (const [act, pattern] of Object.entries(actMarkers)) {
        if (pattern.test(trimmed)) { actName = act; break; }
      }
      const foundScenes = sceneKeywordList.filter(kw => trimmed.includes(kw));
      if (actName && foundScenes.length > 0) {
        if (!result.sceneKeywordsByAct) result.sceneKeywordsByAct = {};
        if (!result.sceneKeywordsByAct[actName]) result.sceneKeywordsByAct[actName] = [];
        result.sceneKeywordsByAct[actName].push(...foundScenes);
      }
    }
    // 全局场景关键词
    result.sceneKeywords = sceneKeywordList.filter(kw => outline.includes(kw));
  }

  // 4. 提取动作关键词并按幕归类(v5.7-Peng-fix: 扩展为全类型动作词库)
  const actionKeywordList = [
    // 战斗类
    '大战', '对决', '激战', '交锋', '碰撞', '追逐', '逃亡', '变身',
    '施展', '祭出', '释放', '挥舞', '横扫', '刺穿', '击碎', '闪避',
    '腾空', '飞跃', '坠落', '撞击', '炸裂', '爆发', '凝聚', '消散',
    '追捕', '请缨', '迷惑', '收兵', '再战',
    // 日常/喜剧类 (新增)
    '度假', '旅游', '旅行', '游玩', '玩耍', '嬉戏', '打闹', '追逐',
    '泡温泉', '游泳', '潜水', '冲浪', '滑雪', '滑冰', '漂流',
    '品尝', '吃饭', '喝茶', '聊天', '谈心', '散步', '逛街', '购物',
    '睡觉', '休息', '放松', '享受', '体验', '参观', '游览', '探险',
    '钓鱼', '烧烤', '野餐', '露营', '篝火', '聚会', '派对', '庆祝',
    '跳舞', '跳冰桶舞', '唱歌', '演奏', '表演', '比赛', '竞技', '运动', '健身',
    // 困境/救援类 (新增)
    '被困', '迷路', '失联', '遇险', '受伤', '生病', '饥饿', '寒冷',
    '求救', '呼救', '救援', '拯救', '帮助', '协助', '支援', '援救',
    '分析', '思考', '推理', '判断', '计划', '策划', '计谋', '策略',
    '分身', '变形', '幻化', '隐身', '瞬移', '传送', '穿越', '穿梭',
    // 奇幻/魔法类 (新增)
    '施法', '念咒', '召唤', '封印', '解封', '觉醒', '顿悟', '领悟',
    '修炼', '打坐', '冥想', '闭关', '渡劫', '飞升', '成仙', '成佛',
    // 情感/互动类 (新增)
    '拥抱', '握手', '亲吻', '告别', '送别', '重逢', '相聚', '团圆',
    '赠送', '馈赠', '礼物', '惊喜', '感动', '流泪', '微笑', '大笑',
    '安慰', '鼓励', '支持', '陪伴', '守护', '等待', '思念', '牵挂'
  ];
  if (outline) {
    // 按段落分割大纲（v5.7-Peng-fix: 使用全角中文分号）
    const segments = outline.split(/；/);
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      // 检测段落所属的幕
      let actName = null;
      const actMarkers = {

        '起': /^起[幕:]*/,
        '承': /^承|发展/,
        '转': /^转|转折/,
        '高潮': /^高潮/,
        '合': /^合[幕:]*/
      };

      for (const [act, pattern] of Object.entries(actMarkers)) {
        if (pattern.test(trimmed)) { actName = act; break; }
      }
      // 提取该段落的动作关键词
      const foundActions = actionKeywordList.filter(kw => trimmed.includes(kw));
      if (actName && foundActions.length > 0) {
        if (!result.actionKeywordsByAct) result.actionKeywordsByAct = {};
        result.actionKeywordsByAct[actName] = foundActions;
      }
    }
    // 全局动作关键词
    result.actionKeywords = actionKeywordList.filter(kw => outline.includes(kw));
  }

  return result;
}

/**

 * 为同幕shots生成视角递进的独特description
 * 
 * 递进逻辑:
 *   第1个镜头: 全景环境建置
 *   第2个镜头: 中景主体动作  
 *   第3个镜头: 特写情绪细节（+表情/眼神关键词）
 *   第4+镜头: 动态变化/转折（+转变/觉醒/成长关键词）
 */
function generateProgressiveDescription(baseDesc, shotIndexInAct, totalShotsInAct, shot, actName) {
  const cameraDesc = shot.camera || '';

  const arcKeywords = {
    '转': ['局势悄然转变', '眼神中闪过觉醒', '内心做出决定', '情绪开始转变'],
    '高潮': ['情绪达到顶点', '眼神坚定充满决心', '觉醒的光芒在脸上绽放', '表情从犹豫转为坚定'],
    '合': ['表情释然', '眼神中流露出成长', '领悟后的平静']
  };
  
  // 景别描述词映射
  const sizeDescriptions = {
    '全景': '全景展现',
    '中景': '中景聚焦',
    '近景': '近景刻画',
    '特写': '特写捕捉',
    '航拍': '航拍俯瞰',
    '远景': '远景烘托',
    '大全景': '大全景铺开'
  };
  
  // 匹配shot声明的景别
  const matchedSize = Object.keys(sizeDescriptions).find(sz => cameraDesc.includes(sz));
  const sizePrefix = matchedSize ? sizeDescriptions[matchedSize] : '';
  
  // 基于shot在同幕中的位置分配递进视角
  if (shotIndexInAct === 0) {
    // 第一个镜头: 环境建置 + 主体入场
    return sizePrefix ? `${sizePrefix}：${baseDesc}，环境氛围缓缓铺开` : `${baseDesc}，全景展现环境氛围`;
  } else if (shotIndexInAct === 1) {
    // 第二个镜头: 主体动作聚焦
    const subjectMatch = baseDesc.match(/^[^，,；。]+/);
    const subject = subjectMatch ? subjectMatch[0] : '主角';
    return sizePrefix ? `${sizePrefix}：镜头推进至${subject}，动作细节渐次清晰` : `镜头推进至${subject}，${baseDesc.substring(0, 40)}`;
  } else if (shotIndexInAct === 2) {

    const emotionHints = [
      '表情变化细腻入微', '眼神流转间透露出情绪', '面部特写情绪在脸上漾开', 
      '眼神中闪烁着复杂情绪', '表情从紧张转为释然', '眼神坚定而充满决心'
    ];
    const emotionHint = emotionHints[Math.min(shotIndexInAct - 2, emotionHints.length - 1)];
    // 如果是转幕或高潮幕，叠加角色弧光
    const arcHint = (actName === '转' || actName === '高潮') && arcKeywords[actName] 
      ? '，' + arcKeywords[actName][Math.floor(Math.random() * arcKeywords[actName].length)]
      : '';
    return sizePrefix ? `${sizePrefix}：${baseDesc.substring(0, 25)}，${emotionHint}${arcHint}` : `${baseDesc.substring(0, 25)}，${emotionHint}${arcHint}`;
  } else {

    const dynamicHints = [
      '局势悄然转变', '情绪达到顶点', '节奏突然加快', '悬念在此凝聚', '转折一触即发',
      '角色在瞬间完成蜕变', '眼神中充满觉醒后的光芒', '决然的表情预示着转变'
    ];
    const dynamicHint = dynamicHints[shotIndexInAct - 3] || dynamicHints[dynamicHints.length - 1];
    // 如果是转幕/高潮幕，强制加入弧光关键词
    const arcHint = (actName === '转' || actName === '高潮') && arcKeywords[actName]
      ? '，' + arcKeywords[actName][Math.floor(Math.random() * arcKeywords[actName].length)]
      : '';
    return sizePrefix ? `${sizePrefix}：${baseDesc.substring(0, 30)}，${dynamicHint}${arcHint}` : `${baseDesc.substring(0, 30)}，${dynamicHint}${arcHint}`;
  }
}

// 🔴 v4.2-Peng-fix: 用后处理强制覆盖 StoryForge Pro 的错误输出(通用版本)
function overrideWithUserOutline(plan, outlineData, style = '') {
  if (!outlineData || outlineData.characters.length === 0) {
    console.log('⚠️ 未检测到用户指定角色,保留 StoryForge Pro 自动生成');
    return plan;
  }

  const chars = outlineData.characters;
  const acts = outlineData.acts;

  console.log(`🔧 检测到用户指定角色: ${chars.join(', ')}`);
  console.log(`🔧 强制覆盖 StoryForge Pro 的随机生成角色...`);

  // 1. 建立角色映射表:C01->chars[0], C02->chars[1], ...
  const charMap = {};
  for (let i = 0; i < chars.length; i++) {
    const oldId = `C${String(i + 1).padStart(2, '0')}`;
    charMap[oldId] = chars[i];
  }

  // 2. 替换所有 shot 中的角色引用
  // 策略:根据 shot.act 和 description 推断需要哪些角色
  function inferCharactersForShot(shot, allChars, outlineData) {
    const desc = (shot.description || '').toLowerCase();
    const act = shot.act || '';
    const needed = new Set();

    // 主角(C01)默认需要
    if (allChars.length > 0) needed.add(allChars[0]);

    // 根据描述中出现的角色名匹配
    for (const char of allChars) {
      if (desc.includes(char.toLowerCase()) || desc.includes(char)) {
        needed.add(char);
      }
    }

    // 特殊场景推断
    if (act === '起' && allChars.length >= 2) {
      // 起幕通常需要主角+触发者(第二角色)
      needed.add(allChars[1]);
    }

    // 确保至少1个角色
    if (needed.size === 0 && allChars.length > 0) {
      needed.add(allChars[0]);
    }

    return Array.from(needed);
  }

  for (const shot of plan.shots || []) {
    if (shot.characters) {
      shot.characters = shot.characters.map(oldId => charMap[oldId] || oldId);
      // 🟢 v5.4-Peng-fix: 过滤null/undefined,空时fallback推断
      shot.characters = shot.characters.filter(Boolean);

      const neededChars = inferCharactersForShot(shot, chars, outlineData);
      shot.characters = neededChars;
    }

    // 3. 用起承转合内容覆盖 description(通用:不依赖具体角色名)

    if (shot.act && acts[shot.act]) {
      const outlineDesc = acts[shot.act];
      const actActions = outlineData.actionKeywordsByAct?.[shot.act] || [];
      const actScenes = outlineData.sceneKeywordsByAct?.[shot.act] || []; // 新增场景词
      
      // 检查同幕shots是否已有独特description
      const actShots = (plan.shots || []).filter(s => s.act === shot.act);
      const shotIndex = actShots.findIndex(s => s.id === shot.id);
      
      // 如果StoryForge Pro已生成独特description，保留之
      const uniqueDescs = new Set(actShots.map(s => s.description));
      const hasUniqueDesc = uniqueDescs.size > 1 && actShots[0]?.description;
      
      if (!hasUniqueDesc || !shot.description || shot.description === outlineDesc) {
        // 仅在原始全部相同或为空时，做递进覆盖

        shot.description = generateProgressiveDescription(outlineDesc, shotIndex, actShots.length, shot, shot.act);
      }
      // 否则: 保留StoryForge Pro的独特生成
      
      // 注入场景关键词（v5.7-Peng-fix: 新增场景注入）
      if (actScenes.length > 0) {
        const sceneStr = actScenes.join('、');
        if (!shot.description.includes(sceneStr.substring(0, 2))) { // 避免重复注入
          shot.description += '，' + sceneStr;
        }
      }
      
      // 注入动作关键词（保留原有逻辑）
      if (actActions.length > 0) {
        const actionStr = actActions.join('、');
        if (!shot.description.includes(actionStr.substring(0, 2))) { // 避免重复注入
          shot.description += '，' + actionStr;
        }
      }
    }

    // 4. 替换对白中的角色名
    if (shot.dialogues) {
      for (const d of shot.dialogues) {
        if (d.characterId && charMap[d.characterId]) {
          d.character = charMap[d.characterId];
        }
        if (d.speaker && d.characterId && charMap[d.characterId]) {
          d.speaker = charMap[d.characterId];
        }
      }
    }

    // 5. 替换 dialogueSpeaker
    if (shot.dialogueSpeaker && charMap['C01']) {
      shot.dialogueSpeaker = charMap['C01'];
    }

    const danceDetected = isDanceContent(outlineData.raw, '');
    applyEmotionCameraMap(shot, danceDetected, style);
  }

  // 6. 更新 plan.characters (v5.7-Peng-fix: 根据类型判断角色关系)
  plan.characters = chars.map((name, i) => {
    let role = 'ally';
    if (i === 0) role = 'protagonist';
    else if (i === 1) {

      const videoType = (plan.metadata?.type || plan.videoType || '').toLowerCase();
      if (videoType === 'comedy' || videoType === '治愈' || videoType === '温馨') {
        role = 'partner'; // 喜剧/治愈类型: 伙伴/朋友
      } else if (videoType === 'action' || videoType === '战斗') {
        role = 'antagonist'; // 战斗类型: 反派/对手
      } else {
        role = 'deuteragonist'; // 默认: 第二主角
      }
    }
    return {
      id: `C${String(i + 1).padStart(2, '0')}`,
      name,
      role
    };
  });

  // 7. 更新 characterTimeline
  if (plan.characterTimeline) {
    for (let i = 0; i < Math.min(chars.length, plan.characterTimeline.length); i++) {
      plan.characterTimeline[i].character = chars[i];
    }
  }

  for (const shot of plan.shots || []) {
    const act = shot.act || '';
    if (act === '起' && shot.type !== '建置') shot.type = '建置';
    else if (act === '承' && shot.type !== '发展') shot.type = '发展';
    else if (act === '转' && shot.type !== '转折') shot.type = '转折';
    else if (act === '高潮' && shot.type !== '高潮') shot.type = '高潮';
    else if (act === '合' && shot.type !== '收束') shot.type = '收束';
  }
  console.log(`✅ 幕-type一致性修正完成`);

  const hasClosingAct = (plan.shots || []).some(s => s.act === '合');
  const closingContent = outlineData.acts?.['合'];
  if (!hasClosingAct && closingContent) {
    console.log(`🔧 检测到合幕缺失,从用户大纲注入合幕...`);
    const lastShot = plan.shots[plan.shots.length - 1];
    const lastTime = lastShot ? parseInt(lastShot.timeRangeAbsolute?.split('-')[1] || '0') : 0;
    const lastTension = lastShot?.tension || 100;

    // 生成2个合幕镜头(收场+尾声)
    const closingShots = [
      {
        id: `S${String(plan.shots.length + 1).padStart(2, '0')}`,
        act: '合',
        actIndex: 5,
        duration: 10,
        timeRange: `${lastTime}-${lastTime + 10}s`,
        timeRangeAbsolute: `${lastTime}-${lastTime + 10}`,
        type: '建置',
        description: closingContent,
        characters: chars.slice(0, 3), // 主角+关键配角
        emotionStart: '释然',
        emotionEnd: '平静',
        tension: Math.max(20, lastTension - 40),
        camera: '航拍缓慢下降,全景构图,固定机位观察',
        handoff: '淡入淡出',
        handoffType: '动作冻结',
        notes: '环境/氛围',
        lighting: '从高潮到平静',
        seedanceCameraCue: '缓慢,静谧,固定'
      },
      {
        id: `S${String(plan.shots.length + 2).padStart(2, '0')}`,
        act: '合',
        actIndex: 5,
        duration: 10,
        timeRange: `${lastTime + 10}-${lastTime + 20}s`,
        timeRangeAbsolute: `${lastTime + 10}-${lastTime + 20}`,
        type: '发展',
        description: closingContent + ',完美收尾',
        characters: chars.slice(0, 2), // 主角+核心对手/伴侣
        emotionStart: '平静',
        emotionEnd: '温馨',
        tension: 20,
        camera: '推轨缓推,中景构图,微晃手持',
        handoff: '硬切',
        handoffType: '动作冻结',
        notes: '人物面部/关键动作',
        lighting: '温馨圆满',
        seedanceCameraCue: '渐进,温暖,微晃'
      }
    ];

    // 追加合幕镜头
    plan.shots.push(...closingShots);
    plan.totalShots = plan.shots.length;
    plan.totalDuration = (plan.totalDuration || 0) + 20;
    if (plan.emotionCurve) {
      plan.emotionCurve.push(
        { time: lastTime, tension: closingShots[0].tension },
        { time: lastTime + 10, tension: closingShots[1].tension },
        { time: lastTime + 20, tension: 20 }
      );
    }
    if (plan.narrativeValidation) {
      plan.narrativeValidation.errors = plan.narrativeValidation.errors.filter(e => !e.includes('缺少合幕'));
      plan.narrativeValidation.warnings = plan.narrativeValidation.warnings.filter(w => !w.includes('时长偏差'));
      if (plan.narrativeValidation.errors.length === 0) {
        plan.narrativeValidation.passed = true;
        plan.narrativeValidation.score = Math.min(100, plan.narrativeValidation.score + 20);
        plan.narrativeValidation.summary = `✅ 叙事完整性校验通过(0错误, 0警告, 已自动修复合幕缺失)`;
      }
    }

    console.log(`✅ 合幕注入完成: +2镜头 (+20秒)`);
  }

  const targetDuration = plan.targetDuration || 180;
  // 重新计算实际总时长(基于shots,不依赖可能过时的totalDuration)
  const actualDuration = (plan.shots || []).reduce((sum, s) => sum + (s.duration || 0), 0);
  plan.totalDuration = actualDuration; // 同步修正

  if (actualDuration < targetDuration) {
    const deficit = targetDuration - actualDuration;
    console.log(`🔧 时长不足: 当前${actualDuration}s / 目标${targetDuration}s, 缺口${deficit}s`);

    // 策略: 优先增加高潮和合幕镜头(观众最关注), 每镜最多+2s,精确控制不超目标
    const priorityMap = { '高潮': 3, '合': 2, '转': 1, '起': 0, '承': 0 };
    const sortedShots = [...(plan.shots || [])].sort((a, b) => {
      return (priorityMap[b.act] || 0) - (priorityMap[a.act] || 0);
    });

    // 给优先镜头增加时长,精确补偿不超目标
    let remaining = deficit;
    for (const shot of sortedShots) {
      if (remaining <= 0) break;
      const add = Math.min(remaining, 2); // 每镜最多+2s
      shot.duration = (shot.duration || 0) + add;
      remaining -= add;
    }

    console.log(`✅ 时长补偿完成: ${actualDuration}s → 目标${targetDuration}s`);
  } else if (actualDuration > targetDuration) {

    const excess = actualDuration - targetDuration;
    console.log(`🔧 时长超标: 当前${actualDuration}s / 目标${targetDuration}s, 超标${excess}s`);
    
    // 策略: 优先缩减起幕和承幕(铺垫部分), 每镜最多-3s,保护高潮和合幕
    const priorityMap = { '起': 3, '承': 3, '转': 1, '高潮': 0, '合': 0 }; // 数字越大越先缩减
    const sortedShots = [...(plan.shots || [])].sort((a, b) => {
      return (priorityMap[b.act] || 0) - (priorityMap[a.act] || 0);
    });

    let remaining = excess;
    for (const shot of sortedShots) {
      if (remaining <= 0) break;
      // 每镜最多缩减3s，但不低于2s（更激进的缩减策略）
      const maxReduce = Math.min(remaining, 3, (shot.duration || 0) - 2);
      if (maxReduce > 0) {
        shot.duration = (shot.duration || 0) - maxReduce;
        remaining -= maxReduce;
      }
    }

    console.log(`✅ 时长缩减完成: ${actualDuration}s → 目标${targetDuration}s`);

    const newActualDuration = (plan.shots || []).reduce((sum, s) => sum + (s.duration || 0), 0);
    if (newActualDuration > targetDuration) {
      const newExcess = newActualDuration - targetDuration;
      console.log(`🔧 仍然超标${newExcess}s，删除次要镜头...`);
      
      // 找出可删除的镜头（起/承/转幕中保留2个，高潮保留4个）
      const maxShotsByAct = { '起': 2, '承': 2, '转': 2, '高潮': 4, '合': 2 };
      const shotsToDelete = [];
      
      for (const [act, maxCount] of Object.entries(maxShotsByAct)) {
        const actShots = (plan.shots || []).filter((s, idx) => s.act === act && !shotsToDelete.includes(idx));
        if (actShots.length > maxCount) {
          for (let i = maxCount; i < actShots.length; i++) {
            const idx = plan.shots.indexOf(actShots[i]);
            if (idx >= 0) shotsToDelete.push(idx);
          }
        }
      }
      
      // 从后往前删除，避免索引错位
      shotsToDelete.sort((a, b) => b - a);
      for (const idx of shotsToDelete) {
        const removed = plan.shots.splice(idx, 1);
        if (removed.length > 0) {
          console.log(`  删除镜头 ${removed[0].id} (${removed[0].act}幕, ${removed[0].duration}s)`);
        }
      }
      
      console.log(`✅ 镜头删除完成: 剩余${plan.shots.length}个镜头`);
    }

    const finalDuration = (plan.shots || []).reduce((sum, s) => sum + (s.duration || 0), 0);
    if (finalDuration > targetDuration) {
      const finalExcess = finalDuration - targetDuration;
      console.log(`🔧 最终缩减: 当前${finalDuration}s / 目标${targetDuration}s, 超标${finalExcess}s`);
      
      // 按比例缩减每个镜头，最低2s
      const reducibleShots = (plan.shots || []).filter(s => (s.duration || 0) > 2);
      if (reducibleShots.length > 0) {
        const reducePerShot = Math.ceil(finalExcess / reducibleShots.length);
        for (const shot of reducibleShots) {
          const actualReduce = Math.min(reducePerShot, (shot.duration || 0) - 2);
          if (actualReduce > 0) {
            shot.duration = (shot.duration || 0) - actualReduce;
          }
        }
      }
      
      console.log(`✅ 最终缩减完成`);
    }
  } else {
    console.log(`✅ 时长正好达标: ${actualDuration}s / 目标${targetDuration}s`);
  }

  plan.totalShots = (plan.shots || []).length;
  plan.totalDuration = (plan.shots || []).reduce((sum, s) => sum + (s.duration || 0), 0);

  // 重新计算timeRange和总时长
  let currentTime = 0;
  for (const shot of plan.shots || []) {
    const dur = shot.duration || 0;
    shot.timeRange = `${currentTime}-${currentTime + dur}s`;
    shot.timeRangeAbsolute = `${currentTime}-${currentTime + dur}`;
    currentTime += dur;
  }
  plan.totalDuration = currentTime;

  return plan;
}

// 解析命令行参数
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '');
    const value = process.argv[i + 1];
    if (value !== undefined && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

// 主入口
async function main() {
  const args = parseArgs();
  const command = process.argv[2];

  if (command === 'plan') {
    await runPlan(args);
  } else if (command === 'plan-multi') {
    await runPlanMulti(args);
  } else if (command === 'curve') {
    runCurve(args);
  } else if (command === 'export') {
    runExport(args);
  } else {
    console.log(`
用法:
  node story-engine.js plan --title <title> --duration <sec> --outline <text> --characters <ids>
  node story-engine.js plan-multi --title <title> --duration <sec> --outline <text> --variants <n>
  node story-engine.js curve --plan <file>
  node story-engine.js export --plan <file> --format <md|json>

选项:
  --title        作品标题
  --duration     时长(秒)
  --outline      故事大纲
  --characters   角色ID列表(逗号分隔)
  --style        视觉风格
  --type         视频类型
  --variants     方案数量(plan-multi用)
  --output-dir   输出目录(plan-multi用)
  --output       输出文件路径
  --format       导出格式(md|json)
`);
  }
}

// ============ Phase 1: Plan - 调用 StoryForge Pro ============
async function runPlan(args) {
  const title = args.title || '未命名作品';
  const duration = args.duration || '180';
  const outline = args.outline || '';
  const characters = args.characters || '';
  const style = args.style || '';
  const type = args.type || '';
  const output = args.output || `./story-plan-${Date.now()}.json`;

  console.log(`🎬 Story Engine v3.5-Peng (兼容层)`);
  console.log(`   内部调用 StoryForge Pro...\n`);

  // 构建 StoryForge Pro 参数
  const concept = outline || title;
  const tmpDir = `/tmp/storyforge-${Date.now()}-${Math.floor(Math.random()*10000)}`;

  const workspace = path.join(require('os').homedir(), '.openclaw/workspace');

  const orchestrator = path.join(workspace, 'storyforge-pro/orchestrator.js');

  const cmd = [
    'node', orchestrator, 'create',
    '--title', `"${title}"`,
    '--concept', `"${concept}"`,
    '--duration', duration,
    ...(style ? ['--style', `"${style}"`] : []),
    ...(type ? ['--videoType', `"${type}"`] : []),
    '--output', tmpDir
  ].join(' ');

  console.log(`▶️ 执行: ${cmd}`);
  await execAsync(cmd, { stdio: 'inherit', timeout: 120000 });

  // 读取 StoryForge Pro 生成的 plan 文件（支持多种文件名）
  let sfpPlanPath = path.join(tmpDir, '01-story-plan.json');
  if (!fs.existsSync(sfpPlanPath)) {

    sfpPlanPath = path.join(tmpDir, 'story-plan.json');
  }
  if (!fs.existsSync(sfpPlanPath)) {
    throw new Error('StoryForge Pro 未生成 plan 文件 (尝试了 01-story-plan.json 和 story-plan.json)');
  }

  let plan;
  try {
    plan = JSON.parse(fs.readFileSync(sfpPlanPath, 'utf8'));
  } catch (err) {
    console.error(`❌ Plan文件解析失败: ${sfpPlanPath} — ${err.message}`);
    throw new Error(`Plan文件解析失败: ${sfpPlanPath}`);
  }

  plan.targetDuration = parseInt(duration) || 180;
  plan.videoType = type || plan.metadata?.type || ''; // 传递类型用于角色关系判断

  // 🔴 v4.2-Peng-fix: 用用户大纲强制覆盖 StoryForge Pro 的错误输出（通用版本）
  const outlineData = parseUserOutline(outline, characters);
  if (outlineData.characters.length > 0) {
    overrideWithUserOutline(plan, outlineData, style);
  }

  const targetDuration = parseInt(duration) || 180;
  plan.targetDuration = targetDuration;

  const actualDuration = (plan.shots || []).reduce((sum, s) => sum + (s.duration || 0), 0);
  plan.totalDuration = actualDuration;

  if (actualDuration !== targetDuration && plan.shots && plan.shots.length > 0) {
    console.log(`🔧 时长校准: 当前${actualDuration}s → 目标${targetDuration}s`);
    
    if (actualDuration < targetDuration) {
      const deficit = targetDuration - actualDuration;
      const addPerShot = Math.floor(deficit / plan.shots.length);
      let remainder = deficit - (addPerShot * plan.shots.length);
      
      // 优先给高潮和合幕增加时长
      const priorityMap = { '高潮': 3, '合': 2, '转': 1, '起': 0, '承': 0 };
      const sortedShots = [...plan.shots].sort((a, b) => 
        (priorityMap[b.act] || 0) - (priorityMap[a.act] || 0)
      );
      
      for (const shot of sortedShots) {
        const extra = addPerShot + (remainder > 0 ? 1 : 0);
        shot.duration = (shot.duration || 0) + extra;
        if (remainder > 0) remainder--;
      }
    } else if (actualDuration > targetDuration) {
      const excess = actualDuration - targetDuration;
      const reducePerShot = Math.floor(excess / plan.shots.length);
      let remainder = excess - (reducePerShot * plan.shots.length);
      
      // 优先缩减起幕和承幕
      const priorityMap = { '起': 3, '承': 3, '转': 1, '高潮': 0, '合': 0 };
      const sortedShots = [...plan.shots].sort((a, b) => 
        (priorityMap[b.act] || 0) - (priorityMap[a.act] || 0)
      );
      
      for (const shot of sortedShots) {
        const reduce = reducePerShot + (remainder > 0 ? 1 : 0);
        const maxReduce = Math.min(reduce, (shot.duration || 0) - 2);
        if (maxReduce > 0) {
          shot.duration = (shot.duration || 0) - maxReduce;
          if (remainder > 0) remainder--;
        }
      }
    }
    
    // 重新计算总时长
    plan.totalDuration = (plan.shots || []).reduce((sum, s) => sum + (s.duration || 0), 0);
    console.log(`✅ 时长校准完成: ${plan.totalDuration}s (目标: ${targetDuration}s)`);
  }

  // 添加 characters 信息(从参数解析)
  if (characters && plan.characters.length === 0) {
    plan.characters = characters.split(',').map(c => {
      const parts = c.split('-');
      return { id: parts[0], name: parts[1] || parts[0] };
    });
  }

  // 保存到指定输出路径
  fs.writeFileSync(output, JSON.stringify(plan, null, 2));

  console.log(`\n✅ 生产计划已生成!(via StoryForge Pro)`);
  console.log(`📊 总镜头数: ${plan.totalShots}`);
  console.log(`⏱️ 总时长: ${plan.totalDuration}秒 (目标: ${plan.targetDuration}秒)`);
  console.log(`📁 保存路径: ${output}`);

  return plan;
}

// ============ Phase 2: Curve ============
function runCurve(args) {
  const planPath = args.plan;
  if (!planPath || !fs.existsSync(planPath)) {
    console.error('❌ 请提供有效的 plan 文件路径');
    return;
  }

  try {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  } catch (err) {
    console.error(`❌ Plan文件解析失败: ${planPath} — ${err.message}`);
    return;
  }

  const tensionData = plan.tensionCurve || {};
  const curve = tensionData.curve || plan.emotionCurve || [];
  const nonlinearBeats = tensionData.nonlinearBeats || plan.nonlinearBeats || [];

  console.log('\n📈 情绪曲线(v5.1-Peng 非线性引擎):');
  console.log('时间(s) | 张力 | 非线性节拍');
  console.log('─────────────────────────────────');

  for (const point of curve) {
    const bar = '█'.repeat(Math.round(point.tension / 5));
    const beatMark = point.nonlinearBeat ? ` 🎭 ${point.nonlinearBeat.name}` : '';
    console.log(`${String(point.time).padStart(6)} | ${bar} ${String(point.tension).padStart(3)}${beatMark}`);
  }

  // 打印非线性节拍详情
  if (nonlinearBeats.length > 0) {
    console.log('\n🎭 非线性情绪节拍详情:');
    for (const beat of nonlinearBeats) {
      console.log(`  [${beat.name}] @ ${beat.time}s (${beat.zone})`);
      console.log(`  └─ 镜头提示: ${beat.shotCue || beat.config?.shotCue || 'N/A'}`);
      console.log(`  └─ 情感效果: ${beat.emotionalEffect || beat.config?.emotionalEffect || 'N/A'}`);
    }
  } else {
    console.log('\ni️ 无非线性节拍(纯线性曲线)');
  }

  console.log(`\n📊 统计: ${curve.length} 个采样点, ${nonlinearBeats.length} 个非线性节拍`);
}

// ============ Phase 3: Export ============
function runExport(args) {
  const planPath = args.plan;
  const format = args.format || 'md';

  if (!planPath || !fs.existsSync(planPath)) {
    console.error('❌ 请提供有效的 plan 文件路径');
    return;
  }

  try {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  } catch (err) {
    console.error(`❌ Plan文件解析失败: ${planPath} — ${err.message}`);
    return;
  }

  if (format === 'md') {
    const outFile = planPath.replace('.json', '.md');
    let md = `# ${plan.title} - 分镜表\n\n`;
    md += `**总时长**: ${plan.totalDuration}秒 | **镜头数**: ${plan.totalShots} | **幕数**: ${plan.segments}\n\n`;
    md += `**风格总纲**: ${plan.styleManifesto || ''}\n\n`;
    md += `**光影三层**: ${plan.lightingThreeLayer || ''}\n\n`;
    md += '---\n\n';

    for (const shot of (plan.shots || [])) {
      md += `### ${shot.id} - ${shot.type}\n\n`;
      md += `- **时长**: ${shot.duration}秒 (${shot.timeRange})\n`;
      md += `- **幕**: ${shot.act} (${shot.actIndex}/4)\n`;
      md += `- **角色**: ${(shot.characters || []).join(', ') || '无'}\n`;
      md += `- **情绪**: ${shot.emotionStart} → ${shot.emotionEnd}\n`;
      md += `- **张力**: ${shot.tension}\n`;
      md += `- **镜头**: ${shot.camera}\n`;
      md += `- **描述**: ${shot.description}\n`;
      md += `- **转场**: ${shot.handoff} (${shot.handoffType})\n\n`;
    }

    fs.writeFileSync(outFile, md);
    console.log(`✅ 已导出 Markdown: ${outFile}`);
  } else {
    console.log('✅ JSON 格式已是最优,无需转换');
  }
}

// ============ Phase 4: Multi-Plan (v5.0-Peng) ============
// 一次生成多个不同变体的方案,供比稿使用
async function runPlanMulti(args) {
  const title = args.title || "未命名作品";
  const duration = args.duration || "180";
  const outline = args.outline || "";
  const characters = args.characters || "";
  const style = args.style || "";
  const type = args.type || "";
  const variants = parseInt(args.variants) || 3;
  const outputDir = args["output-dir"] || `./candidates-${Date.now()}`;

  console.log(`🎬 Story Engine v5.0-Peng - 多方案生成`);
  console.log(`   生成 ${variants} 个不同变体的方案...
`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const candidates = [];

  const strategies = [
    { name: "标准版", styleModifier: "", structureModifier: "standard", desc: "标准四幕结构,平衡叙事与视觉" },
    { name: "情绪强化版", styleModifier: ",情感特写强化", structureModifier: "emotion", desc: "增加面部特写和情绪转折" },
    { name: "视觉冲击版", styleModifier: ",大场面环绕运镜", structureModifier: "visual", desc: "增加全景和环绕运镜" },
    { name: "快节奏版", styleModifier: ",快节奏剪辑", structureModifier: "fast", desc: "减少铺垫,加速冲突" },
    { name: "慢节奏版", styleModifier: ",长镜头美学", structureModifier: "slow", desc: "增加长镜头,强化沉浸" }
  ];

  for (let i = 0; i < variants; i++) {
    const strategy = strategies[i % strategies.length];
    const variantStyle = style ? `${style}${strategy.styleModifier}` : strategy.styleModifier;
    const variantDir = path.join(outputDir, `variant-${String(i+1).padStart(2, "0")}-${strategy.name}`);

    if (!fs.existsSync(variantDir)) {
      fs.mkdirSync(variantDir, { recursive: true });
    }

    console.log(`
🎨 生成方案 ${i+1}/${variants}: ${strategy.name}`);
    console.log(`   策略: ${strategy.desc}`);

    try {
      // 添加短暂延迟确保临时目录名不同
      const startWait = Date.now();
      while (Date.now() - startWait < 100) { /* 同步等待100ms */ }

      // 🟢 v5.4-Peng-fix: 修复--plan-multi中runPlan未加await,导致plan为Promise
      const plan = await runPlan({
        title: `${title}-${strategy.name}`,
        duration,
        outline,
        characters,
        style: variantStyle,
        type,
        output: path.join(variantDir, "01-story-plan.json")
      });

      if (plan && strategy.structureModifier !== "standard") {
        modifyStructureByStrategy(plan, strategy.structureModifier);
        fs.writeFileSync(path.join(variantDir, "01-story-plan.json"), JSON.stringify(plan, null, 2));
      }

      candidates.push({
        id: `方案${String(i+1).padStart(2, "0")}-${strategy.name}`,
        storyPlan: plan,
        prompts: [],
        rationale: strategy.desc,
        variantDir
      });

      console.log(`✅ 方案 ${strategy.name} 生成完成: ${plan.totalShots}个镜头`);
    } catch (e) {
      console.error(`❌ 方案 ${strategy.name} 生成失败: ${e.message}`);
    }
  }

  const candidatesData = {
    userRequest: { title, outline, duration: parseInt(duration), style, type, constraints: [] },
    candidates: candidates.map(c => ({
      id: c.id,
      storyPlan: c.storyPlan,
      prompts: c.prompts,
      rationale: c.rationale,
      variantDir: c.variantDir
    }))
  };

  const candidatesPath = path.join(outputDir, "candidates.json");
  fs.writeFileSync(candidatesPath, JSON.stringify(candidatesData, null, 2));

  console.log(`
✅ 多方案生成完成!`);
  console.log(`📁 输出目录: ${outputDir}`);
  console.log(`📊 生成方案: ${candidates.length}个`);
  console.log(`📋 候选文件: ${candidatesPath}`);

  return candidatesData;
}

function modifyStructureByStrategy(plan, strategy) {
  const shots = plan.shots || [];
  switch (strategy) {
    case "emotion":
      for (const shot of shots) {
        // 🔴 fix: StoryForge Pro 的 type 是 "建置/发展/高潮/反应",不是 "转折"
        const isHighTension = shot.tension > 70;
        const isClimaxType = shot.type === "高潮" || shot.type === "反应";
        const isTransitionType = shot.act === "转";
        if (isClimaxType || isTransitionType || isHighTension) {
          shot.camera = shot.camera.replace("全景", "近景").replace("中景", "特写");
          if (!shot.description.includes("表情") && !shot.description.includes("眼神") && !shot.description.includes("面部")) {
            shot.description += ",面部情绪特写";
          }
        }
      }
      break;
    case "visual":
      for (const shot of shots) {
        // 🔴 fix: 匹配 "建置" 和 "高潮" type(StoryForge Pro 实际输出的 type)
        const isVisualType = shot.type === "建置" || shot.type === "高潮";
        if (isVisualType || shot.tension > 80) {
          shot.camera = shot.camera.replace("特写", "中景").replace("近景", "全景");
          if (!shot.camera.includes("环绕") && !shot.camera.includes("推轨") && !shot.camera.includes("航拍")) {
            shot.camera += ",环绕运镜";
          }
        }
      }
      break;
    case "fast":
      for (const shot of shots) { shot.duration = Math.max(3, Math.floor(shot.duration * 0.7)); }
      let t = 0;
      for (const shot of shots) { shot.timeRange = `${t}s-${t + shot.duration}s`; t += shot.duration; }
      break;
    case "slow":
      // 🔴 fix: 匹配 act="起"/"合" 或 type="建置"/"反应"(StoryForge Pro 没有 "收束" type)
      for (const shot of shots) {
        if (shot.act === "起" || shot.act === "合" || shot.type === "建置" || shot.type === "反应") {
          shot.duration = Math.floor(shot.duration * 1.3);
        }
      }
      let t2 = 0;
      for (const shot of shots) { shot.timeRange = `${t2}s-${t2 + shot.duration}s`; t2 += shot.duration; }
      break;
  }
  plan.totalDuration = shots.reduce((sum, s) => sum + (s.duration || 0), 0);
}

(async () => {
  await main();
})();