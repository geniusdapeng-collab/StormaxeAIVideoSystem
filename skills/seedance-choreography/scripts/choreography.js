#!/usr/bin/env node
/**
 * Seedance Choreography — 动作编排流水线
 * 
 * 用法:
 *   node choreography.js choreograph --scene-type "打斗" --characters "A:灵巧型,B:力量型" --duration 8 [--style "成龙风格"]
 *   node choreography.js help
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

// ============ 体型分析 ============
const BODY_TYPES = {
  '灵巧型': { speed: 9, power: 4, defense: 5, evasion: 9, style: '侧闪/翻滚/空中连击' },
  '力量型': { speed: 4, power: 9, defense: 7, evasion: 3, style: '正面硬撼/重击/投摔' },
  '均衡型': { speed: 6, power: 6, defense: 6, evasion: 6, style: '组合拳/防守反击' },
  '速度型': { speed: 10, power: 3, defense: 3, evasion: 10, style: '瞬移/残影/快速位移' },
  '防御型': { speed: 3, power: 5, defense: 10, evasion: 4, style: '龟缩/反击/消耗战' },
};

// ============ 编排风格库 ============
const CHOREO_STYLES = {
  '成龙': {
    name: '成龙风格',
    features: ['环境利用', '喜剧化', '长镜头不剪辑', '道具战', '顽强感'],
    camera: '跟随动作的长镜头，极少剪辑',
    pacing: '失误→补救→反杀的喜剧节奏',
    signature: '用周围物品当武器（椅子/梯子/滑板）',
  },
  '李连杰': {
    name: '李连杰风格',
    features: ['优雅武术', '舞蹈感', '对称构图', '传统套路'],
    camera: '对称/圆形构图，流畅跟拍',
    pacing: '一招一式有起承转合',
    signature: '传统武术套路（形意拳/八卦掌/太极拳）',
  },
  '甄子丹': {
    name: '甄子丹风格',
    features: ['MMA综合格斗', '写实', '快速组合拳', '街斗混乱感'],
    camera: '快速正反打，手持抖动',
    pacing: '拳拳到肉，快速连续攻击',
    signature: '现代格斗技术（拳击+巴西柔术+摔跤）',
  },
  '好莱坞': {
    name: '好莱坞风格',
    features: ['镜头切换', '特效辅助', '慢动作', '视觉奇观'],
    camera: '大量正反打切换，CGI辅助',
    pacing: '慢动作关键时刻，爆炸配合',
    signature: '夸张动作+爆炸/破坏',
  },
  '武侠': {
    name: '武侠风格',
    features: ['轻功', '内力对轰', '违反物理定律', '东方美学'],
    camera: '飘逸长镜头，竹林/水面/屋顶',
    pacing: '违反物理的飘逸动作',
    signature: '招式有名（降龙十八掌/九阴白骨爪）',
  },
  'MMA': {
    name: 'MMA风格',
    features: ['地面技', '降伏', '体能消耗', '伤口积累'],
    camera: '近身肉搏，地面视角',
    pacing: '抱摔→地面控制→降伏',
    signature: '体能 visibly 下降，真实比赛规则感',
  },
};

// ============ 动作库 ============
const MOVE_LIBRARY = {
  '灵巧型': [
    '侧闪', '翻滚', '后空翻', '滑铲', '借力跳起', '空中转身',
    '借力蹬墙', '鱼跃前扑', '凌波微步', '轻功点水'
  ],
  '力量型': [
    '正面冲拳', '重击地面', '抱摔', '投摔', '震地一击',
    '硬撼格挡', '破坏环境', '拆柱为棍', '泰山压顶'
  ],
  '均衡型': [
    '组合拳', '防守反击', '侧踢', '肘击', '膝撞',
    '擒拿', '反关节', '借力打力', '四两拨千斤'
  ],
  '速度型': [
    '瞬移残影', '快速连击', 'Hit-and-Run', '绕背攻击',
    '分身术', '闪现突击', '超音速移动', '时间凝滞感'
  ],
  '防御型': [
    '龟缩格挡', '护盾反击', '再生愈合', '消耗战',
    '以守为攻', '借力反击', '金钟罩', '铁布衫'
  ],
};

const IMPACT_MOVES = [
  '击中腹部', '击中面部', '击中胸口', '击中后背',
  '格挡反击', '闪避反击', '武器碰撞', '能量对轰'
];

const FINISH_MOVES = [
  'KO倒地', '击飞', '震退', '跪地喘息',
  '武器脱手', '护盾碎裂', '能量耗尽发光'
];

// ============ 编排引擎 ============
function generateChoreography(args) {
  const sceneType = args['scene-type'] || args.sceneType || '打斗';
  const charactersRaw = args.characters || '';
  const duration = parseFloat(args.duration || 8);
  const styleName = args.style || '好莱坞';
  const environment = args.environment || '开阔';
  const intensity = parseInt(args.intensity || 7);
  
  log('Choreo', `🥋 编排: ${sceneType} | ${charactersRaw} | ${duration}秒 | ${styleName}风格`);
  
  // 解析角色
  const characters = charactersRaw.split(',').map(c => {
    const [name, type] = c.split(':');
    return {
      name: name.trim(),
      type: (type || '均衡型').trim(),
      stats: BODY_TYPES[(type || '均衡型').trim()] || BODY_TYPES['均衡型']
    };
  });
  
  if (characters.length < 2) {
    log('Choreo', '⚠️ 至少需要2个角色，使用默认角色');
    characters.push({ name: 'B', type: '均衡型', stats: BODY_TYPES['均衡型'] });
  }
  
  const style = CHOREO_STYLES[styleName] || CHOREO_STYLES['好莱坞'];
  const movesA = MOVE_LIBRARY[characters[0].type] || MOVE_LIBRARY['均衡型'];
  const movesB = MOVE_LIBRARY[characters[1].type] || MOVE_LIBRARY['均衡型'];
  
  // 生成时间切片
  const slices = [];
  const sliceDuration = 0.5;
  const numSlices = Math.floor(duration / sliceDuration);
  
  let currentTime = 0;
  let phase = '开场'; // 开场→升级→高潮→收束
  
  for (let i = 0; i < numSlices; i++) {
    const sliceStart = currentTime;
    const sliceEnd = Math.min(currentTime + sliceDuration, duration);
    
    // 根据进度调整阶段
    const progress = i / numSlices;
    if (progress < 0.2) phase = '开场';
    else if (progress < 0.5) phase = '升级';
    else if (progress < 0.8) phase = '高潮';
    else phase = '收束';
    
    // 根据阶段生成动作
    let action = '';
    let camera = '';
    
    if (phase === '开场') {
      // 开场：试探/对峙/蓄力
      if (i % 2 === 0) {
        action = `${characters[0].name}${randomPick(movesA)}逼近${characters[1].name}`;
        camera = '中景，缓慢推进';
      } else {
        action = `${characters[1].name}${randomPick(movesB)}防御姿态`;
        camera = '中景，对峙构图';
      }
    } else if (phase === '升级') {
      // 升级：攻击/闪避/反击
      if (i % 3 === 0) {
        action = `${characters[0].name}${randomPick(movesA)}攻击`;
        camera = '侧跟拍，动作全景';
      } else if (i % 3 === 1) {
        action = `${characters[1].name}${randomPick(movesB)}${randomPick(IMPACT_MOVES)}`;
        camera = '近景，冲击瞬间';
      } else {
        action = `${characters[0].name}${randomPick(movesA)}闪避反击`;
        camera = '快速横移，跟拍闪避';
      }
    } else if (phase === '高潮') {
      // 高潮：连续打击/大招/破坏环境
      if (i % 4 === 0) {
        action = `${characters[0].name}大招：${randomPick(movesA)}`;
        camera = '俯拍/overhead，大招全景';
      } else if (i % 4 === 1) {
        action = `${characters[1].name}${randomPick(FINISH_MOVES)}`;
        camera = '仰拍，面部特写';
      } else if (i % 4 === 2) {
        action = '环境破坏：碎石飞溅/地面崩裂';
        camera = '低角度，破坏冲击';
      } else {
        action = `${characters[0].name}追击${randomPick(movesA)}`;
        camera = '追逐跟拍，速度感';
      }
    } else {
      // 收束：结果/定格/余韵
      if (i === numSlices - 1) {
        action = `${characters[0].name}收势，${characters[1].name}倒地，定格`;
        camera = '正面中景，英雄站位';
      } else {
        action = `${randomPick(FINISH_MOVES)}，尘埃落定`;
        camera = '缓慢拉远，全景收束';
      }
    }
    
    slices.push({
      time: `${sliceStart.toFixed(1)}-${sliceEnd.toFixed(1)}`,
      phase,
      action,
      camera,
      intensity: Math.round(intensity * (phase === '高潮' ? 1.2 : phase === '开场' ? 0.6 : 1.0)),
    });
    
    currentTime = sliceEnd;
  }
  
  // 关键瞬间
  const keyMoments = [];
  if (numSlices > 4) {
    keyMoments.push({ time: (duration * 0.3).toFixed(1), type: '升级', desc: '首次有效击中' });
    keyMoments.push({ time: (duration * 0.6).toFixed(1), type: '特技', desc: '环境利用/空中动作' });
    keyMoments.push({ time: (duration * 0.8).toFixed(1), type: '高潮', desc: '大招释放' });
    keyMoments.push({ time: duration.toFixed(1), type: '定格', desc: '胜负已定' });
  }
  
  return {
    sceneType,
    duration,
    style: style.name,
    styleFeatures: style.features,
    styleSignature: style.signature,
    characters,
    environment,
    slices,
    keyMoments,
  };
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============ 嵌入shot-design ============
function embedIntoPrompt(choreo, originalPrompt) {
  const actionLines = choreo.slices.map(s => 
    `${s.time}秒：${s.action}，${s.camera}`
  ).join('；\n');
  
  return `动作编排（${choreo.style}，精确时间码）：\n${actionLines}\n\n${originalPrompt}`;
}

// ============ 输出 ============
function saveChoreography(choreo, outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(choreo, null, 2));
  log('Choreo', `✅ 编排数据: ${outputPath}`);
  
  // Markdown报告
  const mdPath = outputPath.replace('.json', '.md');
  let md = `# 动作编排 — ${choreo.sceneType}\n\n`;
  md += `**风格**: ${choreo.style} | **时长**: ${choreo.duration}秒 | **环境**: ${choreo.environment}\n\n`;
  md += `**角色**: ${choreo.characters.map(c => `${c.name}(${c.type})`).join(' vs ')}\n\n`;
  md += `**风格特征**: ${choreo.styleFeatures.join('、')}\n\n`;
  md += `**标志性元素**: ${choreo.styleSignature}\n\n`;
  md += `---\n\n`;
  md += `## 动作序列（${choreo.slices.length}个切片）\n\n`;
  md += `| 时间 | 阶段 | 动作 | 运镜 | 强度 |\n`;
  md += `|------|------|------|------|------|\n`;
  for (const s of choreo.slices) {
    md += `| ${s.time}s | ${s.phase} | ${s.action} | ${s.camera} | ${s.intensity} |\n`;
  }
  md += `\n`;
  md += `## 关键瞬间\n\n`;
  for (const km of choreo.keyMoments) {
    md += `- **${km.time}s** [${km.type}] ${km.desc}\n`;
  }
  md += `\n---\n*编排: seedance-choreography v1.0.0-Peng*\n`;
  
  fs.writeFileSync(mdPath, md);
  log('Choreo', `✅ 编排文档: ${mdPath}`);
}

// ============ 主流程 ============
function main() {
  const command = process.argv[2];
  const args = parseArgs();
  
  switch (command) {
    case 'choreograph': {
      const choreo = generateChoreography(args);
      const outputPath = args.output || `./choreo-${Date.now()}.json`;
      saveChoreography(choreo, outputPath);
      
      console.log(`\n🥋 编排完成！`);
      console.log(`风格: ${choreo.style}`);
      console.log(`切片: ${choreo.slices.length}个`);
      console.log(`输出: ${outputPath}`);
      console.log(`\n嵌入shot-design提示词示例:`);
      console.log(`---`);
      console.log(embedIntoPrompt(choreo, '3D国漫CG渲染...').slice(0, 200) + '...');
      break;
    }
    case 'help':
    default:
      console.log(`
Seedance Choreography — 动作编排专家

用法:
  node choreography.js choreograph [options]

选项:
  --scene-type    场景类型（打斗/追逐/舞蹈/逃脱/训练）
  --characters    角色定义，逗号分隔（如 "A:灵巧型,B:力量型"）
  --duration      时长（秒，默认8）
  --style         编排风格（成龙/李连杰/甄子丹/好莱坞/武侠/MMA）
  --environment   环境限制（狭窄/开阔/高空/水中）
  --intensity     强度等级（1-10，默认7）
  --output        输出文件路径

示例:
  node choreography.js choreograph --scene-type "打斗" --characters "大圣:灵巧型,机甲:力量型" --duration 8 --style "成龙"
      `);
  }
}

main();