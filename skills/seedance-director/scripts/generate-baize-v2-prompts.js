#!/usr/bin/env node
/**
 * 白泽v2 Prompt生成器 - 用于文本质量审核
 * 基于完整部位表+aura字段，生成8角度完整prompt
 */

const fs = require('fs');
const path = require('path');

function parseBodyPartsV2(bodyPartsPath) {
  const data = JSON.parse(fs.readFileSync(bodyPartsPath, 'utf8'));
  const parts = data.parts || {};
  const aura = data.aura || {};
  
  const partOrder = [
    'body', 'head', 'face', 'eyes', 'horns', 'ears', 'mouth', 'neck',
    'forelimbs', 'hindlimbs', 'hands', 'feet', 'wings', 'tail', 'coat', 'special'
  ];
  
  const descriptions = [];
  const hasParts = [];
  
  for (const partName of partOrder) {
    const part = parts[partName];
    if (!part || !part.has) continue;
    hasParts.push(partName);
    const desc = [];
    if (part.material) desc.push(part.material);
    if (part.texture) desc.push(part.texture);
    if (part.color) desc.push(part.color);
    if (part.light) desc.push(part.light);
    if (part.detail) desc.push(part.detail);
    if (desc.length > 0) {
      descriptions.push(`【${partName}】${desc.join('，')}`);
    }
  }
  
  // aura描述
  const auraDesc = [];
  if (aura.presence) auraDesc.push(`威严气场：${aura.presence}`);
  if (aura.wisdom) auraDesc.push(`智慧之眼：${aura.wisdom}`);
  if (aura.divine) auraDesc.push(`神圣光芒：${aura.divine}`);
  if (aura.communication) auraDesc.push(`通言能力：${aura.communication}`);
  if (aura.power) auraDesc.push(`通天之力：${aura.power}`);
  
  return {
    fullDesc: descriptions.join('；'),
    hasParts,
    auraDesc: auraDesc.join('；'),
    rawParts: parts,
    aura
  };
}

function getAngleFocusV2(angle, hasParts, aura) {
  const focusMap = {
    'front_fullbody': ['body', 'coat', 'special', 'aura.presence', 'aura.divine'],
    'side_profile': ['body', 'tail', 'coat', 'aura.power'],
    'back_fullbody': ['body', 'tail', 'coat', 'aura.divine'],
    'three_quarter': ['head', 'face', 'eyes', 'horns', 'ears', 'aura.wisdom'],
    'face_closeup': ['head', 'face', 'eyes', 'horns', 'mouth', 'ears', 'aura.wisdom', 'aura.communication'],
    'action_running': ['forelimbs', 'hindlimbs', 'body', 'tail', 'feet', 'aura.power'],
    'action_sitting': ['body', 'forelimbs', 'hindlimbs', 'tail', 'feet', 'aura.presence'],
    'hand_detail': ['feet', 'forelimbs', 'hindlimbs', 'tail']
  };
  
  const preferred = focusMap[angle] || ['body'];
  const physicalParts = preferred.filter(p => !p.startsWith('aura.') && hasParts.includes(p));
  const auraParts = preferred.filter(p => p.startsWith('aura.')).map(p => p.replace('aura.', ''));
  
  const focusDesc = physicalParts.map(p => {
    switch(p) {
      case 'body': return '主体龙狮复合身躯，肌肉饱满有力，体型庞大威严（约3米高），展现神兽力量感';
      case 'head': return '虎首结构，额头宽阔饱满，眉骨突出，威严而非温顺';
      case 'face': return '神圣威严面容，庄严智慧慈悲三重交织，如古老哲人洞察一切';
      case 'eyes': return '金色琥珀神性之眼，瞳孔中有宇宙星辰倒影，看穿万物的智慧光芒';
      case 'horns': return '独角粗壮有力（50cm长），螺旋上升3圈，内部金色光芒如熔岩流动，尖端强烈圣光';
      case 'ears': return '狮耳宽大竖立，耳尖淡金色，可180度转动倾听万物';
      case 'mouth': return '能言人语之口，开口时金色光芒溢出，周围有符文若隐若现';
      case 'neck': return '粗壮有力如狮虎，鬃毛浓密，支撑神圣头部';
      case 'forelimbs': return '前肢粗壮如狮腿，肌肉饱满，展现神兽力量';
      case 'hindlimbs': return '后肢强壮有力，四足落地有金色波纹扩散';
      case 'feet': return '狮爪结构，五趾锋利优雅，着地时金色波纹扩散';
      case 'tail': return '长尾如狮尾，末端淡金色光芒，摆动时如流星';
      case 'coat': return '三层神圣毛发，圣白到淡金渐变，全身自身发光如移动光源';
      case 'special': return '身后智慧光环（金色背光），脚下祥云缭绕，周身符文若隐若现';
      default: return `${p}材质细节清晰可见`;
    }
  });
  
  // aura描述
  const auraFocus = auraParts.map(a => {
    switch(a) {
      case 'presence': return `威严气场：${aura.presence}`;
      case 'wisdom': return `智慧之眼：${aura.wisdom}`;
      case 'divine': return `神圣光芒：${aura.divine}`;
      case 'communication': return `通言能力：${aura.communication}`;
      case 'power': return `通天之力：${aura.power}`;
      default: return '';
    }
  }).filter(Boolean);
  
  return [...focusDesc, ...auraFocus].join('，');
}

function generatePrompts() {
  const bodyParts = parseBodyPartsV2('/root/.openclaw/workspace/skills/seedance-director/scripts/body-parts-baize-v2.md');
  const name = '白泽';
  const species = '祥瑞之兽';
  const signature = '知晓天下鬼神之名，能言人语，通天达地之智';
  
  const artistPerspective = '超写实CG角色设计稿，Unreal Engine 5渲染，8K，电影级光照，体积光，次表面散射，极其精细材质，3D立体体积感，照片级真实感，微观纹理清晰可见';
  const beastBg = '角色设计稿展示背景，柔和渐变灰色背景，专业摄影棚布光，主体占画面85%，清晰的体积感和空间感，无杂乱环境干扰';
  const consistencyLock = 'STRICT anatomical consistency across all views: body structure must remain IDENTICAL in every shot, same number of limbs same proportions same body shape, NO adding or removing body parts between angles, NO morphological drift, NO random protrusions or growths，MAJESTIC sacred elegant divine aesthetic, harmonious rounded smooth forms, warm inviting gentle beauty, cosmic ritual grandeur, awe-inspiring transcendence, ABSOLUTELY NO horror NO disgust NO creepy elements, soft organic curves, pleasant approachable presence, gentle giant vibe, wholesome mythological creature, NO vampiric features NO grotesque textures NO diseased appearance, clean smooth skin surface，uniform smooth rounded body contour locked to original text description, consistent body volume and silhouette across all angles, body shape precisely fixed no variation between shots, proportions permanently locked, smooth organic rounded surfaces NO sharp protrusions NO spiky elements NO bulbous growths NO tumor-like masses, clean elegant silhouette';
  const BEAST_NEGATIVE_CONSTRAINTS = 'NO human characters, NO child, NO boy, NO girl, NO person, NO human face, NO xiaoG, NO technology, NO sci-fi, NO modern elements, NO mechanical parts, NO robots, NO cyberpunk, NO metal armor, NO electronic devices, NO glowing artificial lights, NO plastic, NO synthetic materials';
  
  const shotDefs = [
    { suffix: '正面全身', angle: 'front_fullbody', view: '正面全身纯本体展示' },
    { suffix: '侧面全身', angle: 'side_profile', view: '侧面全身轮廓' },
    { suffix: '背面全身', angle: 'back_fullbody', view: '背面全身姿态' },
    { suffix: '45度半身', angle: 'three_quarter', view: '45度角半身特写' },
    { suffix: '面部特写', angle: 'face_closeup', view: '面部/头部极端特写' },
    { suffix: '动作奔跑', angle: 'action_running', view: '自然奔跑姿态' },
    { suffix: '动作坐姿', angle: 'action_sitting', view: '自然栖息/盘踞姿态' },
    { suffix: '手部特写', angle: 'hand_detail', view: '肢体/爪/足极端特写' }
  ];
  
  const prompts = shotDefs.map(shot => {
    const angleFocus = getAngleFocusV2(shot.angle, bodyParts.hasParts, bodyParts.aura);
    const prompt = `【CG角色设计稿 | ${shot.suffix}】8岁探险者小G在Nirath发光丛林中第一次遇见这只巨大神圣生物，抬头仰望，眼中充满敬畏。${name}${shot.view}，${bodyParts.fullDesc}；${bodyParts.auraDesc}，${name}，${species}，${signature}，${artistPerspective}，${beastBg}，${angleFocus}，山海经原著形态忠实还原：东望山有兽名曰白泽能言语达万物之情，帝巡狩东至海登桓山于海滨得白泽神兽能言达于万物之情，纯异兽主体占画面100%，无人类角色，无小G，无科技元素，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}`;
    return {
      ...shot,
      prompt,
      length: prompt.length
    };
  });
  
  return prompts;
}

// 生成并输出
const prompts = generatePrompts();
console.log('=== 白泽v2 完整8角度Prompt ===\n');
console.log(`部位表解析结果：`);
console.log(`- 有效部位: ${prompts[0].hasParts?.length || 'N/A'}/16`);
console.log(`-  aura字段: 5个气场属性`);
console.log(`\n`);

prompts.forEach((p, i) => {
  console.log(`\n--- 角度${i+1}: ${p.suffix} (${p.angle}) ---`);
  console.log(`Prompt长度: ${p.prompt.length} 字符`);
  console.log(`\n${p.prompt.substring(0, 500)}...`);
  console.log(`\n[完整prompt已保存到文件]`);
});

// 保存完整prompts
const output = prompts.map(p => ({
  angle: p.angle,
  suffix: p.suffix,
  length: p.prompt.length,
  prompt: p.prompt
}));

fs.writeFileSync('./baize-v2-prompts-review.json', JSON.stringify(output, null, 2));
console.log('\n✅ 完整prompt已保存到: baize-v2-prompts-review.json');