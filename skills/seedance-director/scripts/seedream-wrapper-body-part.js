#!/usr/bin/env node
/**
 * Seedream Character Reference Generator — Body Part Matrix 实验版
 * 角色定妆照生成器 — 部位表结构化方案 v4.4-Peng-BodyPart-Experiment
 * 
 * 🧪 实验目的：验证部位表（Body Part Matrix）结构化方案是否优于纯文本features
 * 🧪 实验方法：用白泽（16个部位字段）测试，对比v4.3（纯文本）效果
 * 🧪 实验脚本：不修改v4.3生产代码，创建独立实验副本
 * 
 * 核心升级（vs v4.3-Peng）：
 * + 新增 --body-parts-json 参数，接收结构化部位表JSON
 * + 动态组装beastDetail：只包含has=true的部位，按固定顺序拼接
 * + 部位级别智能对焦：不同角度自动聚焦对应部位
 * + 部位表通用模板：任何异兽只需填表即可
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execAsync } = require('./exec-utils');

const API_BASE = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com';
const API_PATH = '/api/v3/images/generations';
const MODEL_ID = 'doubao-seedream-5-0-260128';

// ============ 复用v4.3的API Key解析、日志、HTTP工具 ============
async function resolveApiKey() {
  if (process.env.ARK_API_KEY) return process.env.ARK_API_KEY;
  const configPaths = [
    path.join(require('os').homedir(), '.openclaw/workspace/skills/byted-ark-seedance-skill/.env'),
    path.join(require('os').homedir(), '.openclaw/workspace/skills/byted-ark-seedance-skill/config.json'),
  ];
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const match = content.match(/ark-[a-f0-9-]+/);
      if (match) return match[0];
    }
  }
  try {
    const envOutput = await execAsync('env | grep -i ARK_API_KEY || env | grep -i api_key', { encoding: 'utf8' });
    const match = envOutput.match(/ark-[a-f0-9-]+/);
    if (match) return match[0];
  } catch {}
  return null;
}

function log(tag, msg) {
  const time = new Date().toLocaleString('zh-CN', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({ hostname: urlObj.hostname, port: 443, path: urlObj.pathname + urlObj.search, method: 'POST', headers: { 'Content-Type': 'application/json', ...headers } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); } });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', reject);
  });
}

// ============ v4.3复用：异兽检测、约束常量 ============
const BEAST_BASE_STYLE = '超写实CG渲染，Unreal Engine 5，Octane渲染，8K画质，电影级光照，极其精细材质，照片级真实感，3D立体体积感，纯异兽本体，原始野性，生物发光，无人类角色，无科技元素，非机械非科幻，纯粹神话生物';
const BEAST_NEGATIVE_CONSTRAINTS = 'NO human characters, NO child, NO boy, NO girl, NO person, NO human face, NO xiaoG, NO technology, NO sci-fi, NO modern elements, NO mechanical parts, NO robots, NO cyberpunk, NO metal armor, NO electronic devices, NO glowing artificial lights, NO plastic, NO synthetic materials';
const BEAST_ANATOMICAL_LOCK = 'STRICT anatomical consistency across all views: body structure must remain IDENTICAL in every shot, same number of limbs same proportions same body shape, NO adding or removing body parts between angles, NO morphological drift, NO random protrusions or growths';
const BEAST_AESTHETIC_GUIDE = 'MAJESTIC sacred elegant divine aesthetic, harmonious rounded smooth forms, warm inviting gentle beauty, cosmic ritual grandeur, awe-inspiring transcendence, ABSOLUTELY NO horror NO disgust NO creepy elements NO sharp spikes NO barbs NO thorns, soft organic curves, pleasant approachable presence, gentle giant vibe, wholesome mythological creature, NO vampiric features NO grotesque textures NO diseased appearance, clean smooth skin surface';
const BEAST_MORPHOLOGY_LOCK = 'uniform smooth rounded body contour locked to original text description, consistent body volume and silhouette across all angles, body shape precisely fixed no variation between shots, proportions permanently locked, smooth organic rounded surfaces NO sharp protrusions NO spiky elements NO bulbous growths NO tumor-like masses, clean elegant silhouette';

function isBeastCharacter(species, name, beastType) {
  if (beastType && beastType.trim().length > 0) return true;
  if (!species) return false;
  const beastKeywords = ['兽','龙','鸟','鱼','蛇','狐','虎','豹','狼','熊','凤','凰','螭','夔','狰','獬','犼','貔','狻','应','虬','蛟','蜃','鼍','鳌','鼋','蜮','蠃','鸱','鸾','鸑','鷟','beast','dragon','phoenix','fox','serpent','creature','monster','spirit','god'];
  const lowerSpecies = species.toLowerCase();
  const lowerName = (name || '').toLowerCase();
  return beastKeywords.some(k => lowerSpecies.includes(k) || lowerName.includes(k));
}

// ============ 🧪 v4.4核心：部位表解析与动态组装 ============

/**
 * 解析部位表JSON，动态组装材质描述
 * @param {string} bodyPartsPath - 部位表JSON文件路径
 * @returns {object} { fullDesc: 完整描述, hasParts: 有效部位列表 }
 */
function parseBodyParts(bodyPartsPath) {
  if (!bodyPartsPath || !fs.existsSync(bodyPartsPath)) {
    return { fullDesc: '', hasParts: [] };
  }
  
  const data = JSON.parse(fs.readFileSync(bodyPartsPath, 'utf8'));
  const parts = data.parts || {};
  
  // 标准化部位顺序（16个字段）
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
    
    // 组装该部位的材质描述
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
  
  return {
    fullDesc: descriptions.join('；'),
    hasParts,
    rawParts: parts
  };
}

/**
 * 角度智能对焦 — 根据角度类型返回该角度应重点展示的部位
 * @param {string} angle - 角度类型
 * @param {string[]} hasParts - 异兽拥有的部位列表
 * @returns {string} 该角度的材质焦点描述
 */
function getAngleFocus(angle, hasParts) {
  const focusMap = {
    'front_fullbody': ['body', 'coat', 'special'],
    'side_profile': ['body', 'wings', 'tail', 'coat'],
    'back_fullbody': ['body', 'wings', 'tail', 'coat'],
    'three_quarter': ['head', 'face', 'eyes', 'horns', 'ears'],
    'face_closeup': ['head', 'face', 'eyes', 'horns', 'mouth', 'ears'],
    'action_running': ['forelimbs', 'hindlimbs', 'wings', 'tail', 'body'],
    'action_sitting': ['body', 'forelimbs', 'hindlimbs', 'wings', 'tail'],
    'hand_detail': ['hands', 'feet', 'forelimbs', 'hindlimbs', 'wings']
  };
  
  const preferred = focusMap[angle] || ['body'];
  const available = preferred.filter(p => hasParts.includes(p));
  
  if (available.length === 0) return '主体材质细节清晰可见';
  
  // 生成该角度的材质焦点描述
  const focusDesc = available.map(p => {
    switch(p) {
      case 'body': return '主体材质细节清晰可见，内部光芒透出形成次表面散射';
      case 'head': return '头部材质如温润玉石，微妙发光经络从中心辐射';
      case 'face': return '面部特征清晰，表情温和智慧';
      case 'eyes': return '双眼深邃如星空，眼神智慧通透';
      case 'horns': return '独角螺旋上升，表面有细微环状纹理如玉质';
      case 'ears': return '耳朵竖立，耳尖微微透明';
      case 'mouth': return '嘴唇柔软，能言人语之口';
      case 'neck': return '修长颈部优雅曲线';
      case 'forelimbs': return '前肢纤细优雅，关节处有细微褶皱';
      case 'hindlimbs': return '后肢强壮有力，肌肉饱满';
      case 'hands': return '手掌/爪子纹理极端清晰';
      case 'feet': return '足部/蹄部优雅，着地时有微弱光芒';
      case 'wings': return '翅膀薄膜透光逆光呈现光泽，脉络清晰可见';
      case 'tail': return '尾巴优雅摆动，末端有绒毛';
      case 'coat': return '毛发/皮肤覆盖全身，光泽温润';
      case 'special': return '特殊部位发光，神圣气息弥漫';
      default: return `${p}材质细节清晰可见`;
    }
  }).join('，');
  
  return focusDesc;
}

// ============ 🧪 v4.4核心：生成角色定妆照（部位表升级版） ============
async function generateCharacterReference(args) {
  const apiKey = await resolveApiKey();
  if (!apiKey) throw new Error('❌ 未找到ARK_API_KEY');
  
  const name = args.name;
  const species = args.species || '';
  const features = args.features || '';
  const signature = args.signature || '';
  const style = args.style || '3D国漫CG渲染,UnrealEngine5,工业光魔级VFX';
  const outputDir = args['output-dir'] || args.outputDir || './characters';
  const originalText = args.originalText || '';
  const beastType = args.beastType || '';
  
  // 🧪 v4.4: 读取部位表JSON
  const bodyPartsPath = args['body-parts-json'] || args.bodyPartsJson;
  const bodyParts = parseBodyParts(bodyPartsPath);
  
  const charDir = path.join(outputDir, `${name}`);
  ensureDir(charDir);
  
  log('BodyPart', `🧪 实验模式：为 [${name}] 生成8张部位表结构化定妆照...`);
  log('BodyPart', `   物种: ${species} | 标志: ${signature}`);
  if (bodyParts.hasParts.length > 0) {
    log('BodyPart', `   📋 部位表: ${bodyParts.hasParts.join(', ')} (${bodyParts.hasParts.length}/16)`);
  }
  
  const isBeast = isBeastCharacter(species, name, beastType);
  if (isBeast) {
    log('BodyPart', `   🐉 异兽模式 | 部位表组装: ${bodyParts.fullDesc.substring(0, 80)}...`);
  }
  
  // ========== 异兽专用（部位表版） ==========
  const artistPerspective = '超写实CG角色设计稿，Unreal Engine 5渲染，8K，电影级光照，体积光，次表面散射，极其精细材质，3D立体体积感，照片级真实感，微观纹理清晰可见';
  const beastBg = '角色设计稿展示背景，柔和渐变灰色背景，专业摄影棚布光，主体占画面85%，清晰的体积感和空间感，无杂乱环境干扰';
  const consistencyLock = `${BEAST_ANATOMICAL_LOCK}，${BEAST_AESTHETIC_GUIDE}，${BEAST_MORPHOLOGY_LOCK}`;
  
  // 🧪 v4.4: 动态组装beastDesc
  // 优先使用部位表描述，如果没有部位表则回退到纯文本features
  const beastDetail = bodyParts.fullDesc || features || '';
  const beastDesc = `${beastDetail}，${name}，${species}，${signature}`;
  
  // 8角度定义（通用化，不硬编码具体部位）
  const shotDefs = [
    { suffix: '正面全身', angle: 'front_fullbody', view: '正面全身纯本体展示' },
    { suffix: '侧面全身', angle: 'side_profile', view: '侧面全身轮廓' },
    { suffix: '背面全身', angle: 'back_fullbody', view: '背面全身姿态' },
    { suffix: '45度半身', angle: 'three_quarter', view: '45度角半身特写' },
    { suffix: '面部特写', angle: 'face_closeup', view: '面部/头部极端特写' },
    { suffix: '动作奔跑', angle: 'action_running', view: '自然奔跑/飞行姿态' },
    { suffix: '动作坐姿', angle: 'action_sitting', view: '自然栖息/盘踞姿态' },
    { suffix: '手部特写', angle: 'hand_detail', view: '肢体/爪/翼极端特写' }
  ];
  
  // 🧪 v4.4: 动态生成每个角度的prompt（带智能对焦）
  const shots = shotDefs.map(shot => {
    const angleFocus = getAngleFocus(shot.angle, bodyParts.hasParts);
    const prompt = `【CG角色设计稿 | ${shot.suffix}】8岁探险者小G在Nirath发光丛林中第一次遇见这只巨大神圣生物，抬头仰望，眼中充满惊奇。${name}${shot.view}，${beastDesc}，${artistPerspective}，${beastBg}，${angleFocus}，肢体对称排列结构稳定，山海经原著形态忠实还原，纯异兽主体占画面100%，无人类角色，无小G，无科技元素，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}`;
    return { ...shot, prompt };
  });
  
  // 追加原著约束
  if (originalText) {
    shots.forEach(shot => {
      shot.prompt += `，严格忠于《山海经》原著描述：${originalText}，不得偏离原著特征，不得添加非原著元素`;
    });
  }
  
  const results = [];
  let referenceImageUrl = null;
  
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const filename = `${name}-${shot.suffix}.png`;
    const filepath = path.join(charDir, filename);
    
    if (fs.existsSync(filepath)) {
      log('BodyPart', `   ✅ ${filename} 已存在，跳过`);
      results.push({ suffix: shot.suffix, angle: shot.angle, filepath, status: 'skipped' });
      continue;
    }
    
    log('BodyPart', `   ⏳ 生成 ${filename} (${shot.angle})...`);
    
    try {
      const body = {
        model: MODEL_ID,
        prompt: shot.prompt,
        size: '2K',
        output_format: 'png',
        response_format: 'url',
        watermark: false,
        sequential_image_generation: 'auto',
        sequential_image_generation_options: { max_images: 3 }
      };
      
      if (referenceImageUrl && i > 0) {
        body.image = referenceImageUrl;
        log('BodyPart', `   🖼️ 使用参考图`);
      }
      
      const response = await postJson(`${API_BASE}${API_PATH}`, { 'Authorization': `Bearer ${apiKey}` }, body);
      
      if (response.error) throw new Error(`API错误: ${response.error.code}`);
      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) throw new Error('API未返回图片URL');
      
      if (i === 0) {
        referenceImageUrl = imageUrl;
        log('BodyPart', `   🎯 正面全身已设为参考图模板`);
      }
      
      await downloadImage(imageUrl, filepath);
      log('BodyPart', `   ✅ ${filename} 已下载`);
      results.push({ suffix: shot.suffix, angle: shot.angle, filepath, status: 'success', url: imageUrl });
      
    } catch (err) {
      log('BodyPart', `   ❌ ${filename} 失败: ${err.message}`);
      results.push({ suffix: shot.suffix, angle: shot.angle, filepath, status: 'failed', error: err.message });
    }
  }
  
  // 生成实验元数据
  const meta = {
    name, species, signature, style, originalText, isBeast, beastType,
    bodyPartExperiment: {
      version: 'v4.4-Peng-BodyPart-Experiment',
      bodyPartsPath: bodyPartsPath || null,
      hasParts: bodyParts.hasParts,
      totalParts: 16,
      activeParts: bodyParts.hasParts.length
    },
    referencePhotos: results.map(r => ({
      type: r.suffix, angle: r.angle, filename: path.basename(r.filepath),
      status: r.status, url: r.url || null
    })),
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    version: 'v4.4-Peng-BodyPart-Experiment'
  };
  
  fs.writeFileSync(path.join(charDir, 'character-meta.json'), JSON.stringify(meta, null, 2));
  log('BodyPart', `✅ [${name}] 部位表实验定妆完成！有效部位: ${bodyParts.hasParts.length}/16，目录: ${charDir}`);
  
  return { charDir, results, meta, bodyParts };
}

// ============ CLI解析 ============
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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

// ============ 主流程 ============
async function main() {
  const command = process.argv[2];
  const args = parseArgs();
  
  if (command === 'generate') {
    if (!args.name) { console.error('❌ 缺少 --name'); process.exit(1); }
    await generateCharacterReference(args);
  } else {
    console.log(`
🧪 Seedream Body Part Matrix 实验版 v4.4-Peng

用法:
  node seedream-wrapper-body-part.js generate [options]

核心参数（vs v4.3新增）:
  --body-parts-json    部位表JSON文件路径（实验核心）

其他参数（与v4.3兼容）:
  --name          角色名
  --species       物种
  --features      纯文本特征（无部位表时的回退）
  --signature     标志性元素
  --style         视觉风格
  --output-dir    输出目录
  --original-text 原著约束
  --beastType     异兽类型

示例（白泽部位表测试）:
  node seedream-wrapper-body-part.js generate \\
    --name "白泽" \\
    --species "祥瑞之兽" \\
    --body-parts-json "./body-parts-baize.json" \\
    --signature "知晓万物，能言人语，通天达地" \\
    --style "超写实CG角色设计稿" \\
    --output-dir "./productions/baize-body-part-test" \\
    --original-text "东望山有兽，名曰白泽，能言语，达万物之情" \\
    --beastType "异兽"
    `);
  }
}

main().catch(e => {
  console.error(`❌ 致命错误: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});

module.exports = { generateCharacterReference, parseBodyParts, getAngleFocus };