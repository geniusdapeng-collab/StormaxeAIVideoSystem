#!/usr/bin/env node
/**
 * Seedream Character Reference Generator
 * 角色定妆照生成器 — 用Seedream为每个角色生成多角度一致性定妆照
 * ShanhaiStory Forge v2.4-Peng | Seedream Wrapper v4.9-Peng (Production)
 * 大视频系统统一版本号：v2.4-Peng（山海经系列 + 通用视频系列）
 * 
 * 🌍 v4.9-Peng 更新（2026-05-25）：
 * + 🆕 角色武器装备系统 v1.1-Peng — 通用装备一致性约束（刑天案例 → 机制级改进）
 * + 🆕 装备标准库 — 盾牌/斧子/剑/法器 精确形态定义，所有新角色自动生效
 * + 🆕 装备注册表持久化 — 新角色自动继承标准约束
 * + 🆕 握持方向锁定 — 左手/右手/双手/悬浮/融合等9种持握方式
 * + 🆕 Prompt自动注入 — 自动生成WEAPON CONSISTENCY LOCK并注入每个镜头
 * 
 * 🌍 v4.8-Peng-ULTIMATE 更新（2026-05-24）：
 * + 🆕 武器参考图终极方案 — 单独生成武器标准参考图，所有角度强制引用
 * + 🆕 彻底解决武器跨图不一致问题（盾牌/战斧形状尺寸统一）
 * 
 * 🌍 v4.7-Peng 更新（2026-05-24）：
 * + 🆕 恐怖谷异兽二创系统 — 自动神话化重塑残缺人体形态异兽（刑天）
 * + 🆕 武器标准化约束系统 — 精确尺寸锁定 + WEAPON CONSISTENCY LOCK
 * + 🆕 敏感异兽参考图跳过机制 — 避免平台内容审核拦截
 * + 🆕 武器中国上古战神风格 — 去除西方骑士风格/中国传统文化纹理
 * 
 * 🌍 v4.6.2-Peng 更新（2026-05-24）：
 * + 通用性修复：beastDetail从硬编码混沌专属 → 从--features动态传入
 * + 艺术家视角升级：8岁探险者好奇打量 + CG角色设计稿级别材质细胞级细节
 * + 参考图机制：正面全身作为后续7张参考，强制跨图一致性
 * + 部位表设计（Body Part Matrix v1.0-Peng）：16个标准化部位字段
 * + 零负面约束策略：删除"非XX"医学词汇，改用正面美学引导
 * + 饕餮通用性验证：羊身人面+虎齿+腋下眼，与混沌完全不同形态
 * 
 * 🌍 v4.2-Peng 更新（大系统 v2.0-Peng）：
 * + 三层一致性约束系统（解剖锁定 + 美学引导 + 形态锁定）
 * + 解决异兽定妆照跨视图不一致问题（肢体数量/形态漂移/恐怖谷）
 * + 定妆照提交策略：生成8张 → 精选3-4张提交Seedance
 * 
 * 🌍 v4.1-Peng 更新（大系统 v2.0-Peng）：
 * + 版本同步：大视频系统统一版本号 v2.0-Peng
 * 
 * 🌍 v4.0-Peng 更新（大系统 v1.1-Peng）：
 * + 超写实真人风格强制注入（非CG/非卡通）
 * + 中国人特征强制注入（所有人类角色默认中国人）
 * + 负面约束系统（不要雀斑/不要西方特征等）
 * + 8岁儿童特征专项优化
 * + 服装细节强化（黄色冲锋衣+牛仔裤+马丁靴+探险配饰等）
 * 
 * 用法:
 *   node seedream-wrapper.js generate \
 *     --name "大圣" \
 *     --species "猴形金色生物" \
 *     --features "火眼金睛+金色毛发+灵巧" \
 *     --signature "燃烧长棒" \
 *     --style "3D国漫CG渲染,UnrealEngine5" \
 *     --output-dir "./productions/xxx/03-characters"
 * 
 *   node seedream-wrapper.js batch \
 *     --story-plan "./productions/xxx/01-story-plan.json" \
 *     --output-dir "./productions/xxx/03-characters"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execAsync } = require('./exec-utils');

const API_BASE = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com';
const API_PATH = '/api/v3/images/generations';
// v6.x-Peng: 使用接入点endpoint ID（新版ARK API）替代旧model ID
const MODEL_ID = 'ep-20260518004750-lz76f';

// ============ API Key解析（复用seedance逻辑） ============
async function resolveApiKey() {
  // 1. 环境变量
  if (process.env.ARK_API_KEY) return process.env.ARK_API_KEY;
  
  // 2. 尝试从OpenClaw主配置文件读取（新增 — 实际Key存放位置）
  const os = require('os');
  const openclawConfigPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  if (fs.existsSync(openclawConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf8'));
      const providers = config.models?.providers || {};
      for (const [providerName, provider] of Object.entries(providers)) {
        if (provider.apiKey && provider.apiKey.startsWith('ark-')) {
          return provider.apiKey;
        }
      }
    } catch (e) {
      // 静默跳过配置读取错误
    }
  }
  
  // 3. 尝试从seedance技能目录读取配置
  const configPaths = [
    path.join(os.homedir(), '.openclaw/workspace/skills/byted-ark-seedance-skill/.env'),
    path.join(os.homedir(), '.openclaw/workspace/skills/byted-ark-seedance-skill/config.json'),
  ];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const match = content.match(/ark-[a-f0-9-]+/);
      if (match) return match[0];
    }
  }
  
  // 4. 尝试从OpenClaw环境变量获取
  try {
    const envOutput = await execAsync('env | grep -i ARK_API_KEY || env | grep -i api_key', { encoding: 'utf8' });
    const match = envOutput.match(/ark-[a-f0-9-]+/);
    if (match) return match[0];
  } catch {}
  
  return null;
}

// 🌍 v4.7.1-Peng: 武器标准化约束系统 — 通用装备一致性（从恐怖谷专用升级为通用机制）
const { generateEquipmentPrompt } = require('../../shanhaijing-character-manager/scripts/equipment-standardizer.js');

// 🌍 v4.6-Peng: 恐怖谷异兽二创系统 — 残缺人类形态异兽的神话化重塑
// 问题：刑天"无头+以乳为目+以脐为口"产生强烈恐怖谷效应（uncanny valley）
// 方案：材质替换+器官神化+整体神像化，保留100%识别特征，消除恐怖感
// v4.6.1-Peng优化：去除中国传统文化纹理/样式，武器改为上古战神风格
// v4.6.2-Peng优化：武器精确尺寸标准化约束（解决跨图不一致）
const UNCANNY_VALLEY_BEASTS = {
  '刑天': {
    originalFeatures: '无头巨人+以乳为目+以脐为口+操干戚以舞',
    creativeRemix: {
      bodyMaterial: '暗金色晶化金属与黑曜石交织的神话躯体，表面有类似火山玻璃的自然熔岩纹理，非人类皮肤，金属与晶体融合的超自然材质，带有微妙的生物发光脉络在表层下流动',
      headReplacement: '颈部以上不是平切伤口，而是一团永恒的赤金色能量漩涡缓缓旋转，漩涡中心有星云般的粒子流转，如同神性光环在呼吸',
      eyesRemix: '胸部镶嵌两颗发光的琥珀色能量核心，核心内部有熔岩般的金色光芒流动，如同神之眼眸凝视前方，边缘有微弱的光晕溢出',
      mouthRemix: '腹部是自然的能量裂隙，裂隙中透出温暖的橙红色光芒，如同神谕之口在呼吸，裂隙边缘有细腻的光脉纹理向四周蔓延',
      weaponRemix: '左手持巨大的矩形上古神盾（干），盾为竖直长方形平板状，宽约肩宽，高约从胸至膝，暗金晶化金属质地，边缘平直无弧度，表面仅有自然的熔岩脉络纹理，无装饰图案；右手握单刃短柄战斧（戚），斧刃只在头部一侧有弯曲锋利的半月形刃口，另一侧为平直钝背（顶部有小锤头结构），斧柄短粗约半臂长，整体呈简洁有力的上古武器风格，绝非西方骑士风格',
      overallVibe: '远古战神神像，威严庄重，神圣不可侵犯，完全没有人类恐怖感，如同远古神殿中苏醒的战神雕像，材质介于金属与晶体之间的超自然存在',
      horrorElimination: 'ABSOLUTELY NO human skin, NO human flesh, NO bloody wounds, NO decapitated neck stump, NO creepy body horror, NO uncanny valley, NO realistic human body parts, NO traditional Chinese cultural patterns, NO bronze ritual patterns, NO Chinese calligraphy or seal script, NO dragon patterns, NO phoenix patterns, NO Chinese knots, 纯粹神话艺术造型，超自然材质',
      // 🌍 v4.6.2-Peng: 武器精确标准化约束
      weaponConsistency: 'WEAPON CONSISTENCY LOCK: 盾必须是同一竖直长方形平板，尺寸形状在所有角度中保持100%一致；斧必须是同一单刃短柄战斧（单刃侧始终朝向画面右侧或外侧），尺寸形状在所有角度中保持100%一致；左手始终握盾，右手始终持斧，不得换手；武器材质纹理必须在所有视图中完全匹配，不得变形或改变'
    }
  }
};

function isUncannyValleyBeast(name) {
  return Object.keys(UNCANNY_VALLEY_BEASTS).some(b => name.toLowerCase().includes(b.toLowerCase()));
}

function getCreativeRemix(name, originalFeatures) {
  const beast = Object.entries(UNCANNY_VALLEY_BEASTS).find(([k, v]) => name.toLowerCase().includes(k.toLowerCase()));
  if (!beast) return null;
  return beast[1].creativeRemix;
}

// 🌍 v4.5-Peng: 敏感异兽处理系统 — 残缺人体/恐怖形象等易触发平台检测的异兽
const SENSITIVE_BEASTS = ['刑天'];
const SENSITIVE_BEAST_COMPLIANCE = 'CG神话艺术创作，古典雕塑风格，无真实暴力，无血腥，无恐怖，数字艺术作品，非真实人物，神话角色设计稿';

function isSensitiveBeast(name) {
  return SENSITIVE_BEASTS.some(b => name.toLowerCase().includes(b.toLowerCase()));
}
function log(tag, msg) {
  const time = new Date().toLocaleString('zh-CN', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

// ============ 确保目录 ============
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============ HTTP请求 ============
function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// ============ 下载图片 ============
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', reject);
  });
}

// 🌍 v4.0-Peng: 异兽专用约束 — 纯粹异兽，无人类，无科技
const BEAST_BASE_STYLE = '超写实CG渲染，Unreal Engine 5，Octane渲染，8K画质，电影级光照，极其精细材质，照片级真实感，3D立体体积感，纯异兽本体，原始野性，生物发光，无人类角色，无科技元素，非机械非科幻，纯粹神话生物。皮肤质感要求：生物组织真实纹理，毛孔和微血管隐约可见，次表面散射自然，绝无塑料感/硅胶感/合成材料感，表皮纹理遵循生物学真实规律，角质鳞片有自然嵴纹和磨损痕迹，毛发有方向性和层次感，皮肤温度分区真实（裸露区冰凉/被毛区温暖）';
const BEAST_NEGATIVE_CONSTRAINTS = 'NO human characters, NO child, NO boy, NO girl, NO person, NO human face, NO xiaoG, NO technology, NO sci-fi, NO modern elements, NO mechanical parts, NO robots, NO cyberpunk, NO metal armor, NO electronic devices, NO glowing artificial lights, NO plastic, NO synthetic materials, NO silicone skin, NO artificial smoothness, NO plastic-like texture, NO unnaturally perfect skin, NO synthetic fur, NO artificial scales';

// 🌍 v4.2-Peng: 新增三层一致性约束系统
const BEAST_ANATOMICAL_LOCK = 'STRICT anatomical consistency across all views: body structure must remain IDENTICAL in every shot, same number of limbs same proportions same body shape, NO adding or removing body parts between angles, NO morphological drift, NO random protrusions or growths';
const BEAST_AESTHETIC_GUIDE = 'MAJESTIC sacred elegant divine aesthetic, harmonious rounded smooth forms, warm inviting gentle beauty, cosmic ritual grandeur, awe-inspiring transcendence, ABSOLUTELY NO horror NO disgust NO creepy elements NO sharp spikes NO barbs NO thorns, soft organic curves, pleasant approachable presence, gentle giant vibe, wholesome mythological creature, NO vampiric features NO grotesque textures NO diseased appearance, clean smooth skin surface. 皮肤质感必须真实：有自然纹理、毛孔、微血管、次表面散射，禁止塑料感/硅胶感/人工光滑，表皮有自然磨损和生物痕迹，鳞片有嵴纹和生长纹理，毛发有方向性和层次结构';
const BEAST_MORPHOLOGY_LOCK = 'uniform smooth rounded body contour locked to original text description, consistent body volume and silhouette across all angles, body shape precisely fixed no variation between shots, proportions permanently locked, smooth organic rounded surfaces NO sharp protrusions NO spiky elements NO bulbous growths NO tumor-like masses, clean elegant silhouette';

// 🌍 v4.0-Peng: 判断是否为异兽（非人类角色）
function isBeastCharacter(species, name, beastType) {
  if (beastType && beastType.trim().length > 0) return true;
  if (!species) return false;
  // 通用模式匹配：部首/类别关键词 + 英文通用类别词 + 山海经知名异兽名
  const beastKeywords = [
    '兽', '龙', '鸟', '鱼', '蛇', '狐', '虎', '豹', '狼', '熊', '凤', '凰',
    '螭', '夔', '狰', '獬', '犼', '貔', '狻', '应', '虬', '蛟', '蜃', '鼍',
    '鳌', '鼋', '蜮', '蠃', '鸱', '鸾', '鸑', '鷟',
    '刑天', '帝江', '烛龙', '白泽', '饕餮', '穷奇', '混沌', '梼杌', '九尾狐', '应龙',
    'beast', 'dragon', 'phoenix', 'fox', 'serpent', 'creature', 'monster', 'spirit', 'god'
  ];
  const lowerSpecies = species.toLowerCase();
  const lowerName = (name || '').toLowerCase();
  return beastKeywords.some(k => lowerSpecies.includes(k) || lowerName.includes(k));
}

// ============ 生成角色定妆照（v4.0-Peng 异兽专用升级） ============
// 支持人类角色和异兽角色的差异化生成
async function generateCharacterReference(args) {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error('❌ 未找到ARK_API_KEY。请设置环境变量：export ARK_API_KEY=ark-xxx');
  }
  
  const name = args.name;
  const species = args.species || '';
  const features = args.features || '';
  const signature = args.signature || '';
  const style = args.style || '3D国漫CG渲染,UnrealEngine5,工业光魔级VFX';
  const outputDir = args['output-dir'] || args.outputDir || './characters';
  
  // 🔴 v2.2-Peng: 新增原著忠实约束
  const originalText = args.originalText || '';
  const beastType = args.beastType || '';
  
  const charDir = path.join(outputDir, `${name}`);
  ensureDir(charDir);
  
  log('Seedream', `🎨 为角色 [${name}] 生成8张多角度定妆照...`);
  log('Seedream', `   物种: ${species} | 特征: ${features} | 标志: ${signature}`);
  if (originalText) log('Seedream', `   📜 原著约束: ${originalText}`);
  
  // 🌍 v4.0-Peng: 检测是否为异兽角色
  const isBeast = isBeastCharacter(species, name, beastType);
  
  if (isBeast) {
    log('Seedream', `   🐉 检测到异兽角色，启用异兽专用生成模式`);
    log('Seedream', `   ⚠️ 约束: 纯异兽本体 | 无人类 | 无科技元素`);
  }

  // 🆕 v5.0-Peng: 武器与角色合一方案（禁用分离方案）
  // 大鹏要求：武器和定妆照不能分开，必须在同一张图中生成
  // 武器描述通过signature参数传入，每张定妆照Prompt都包含完整武器描述
  const weaponDesc = signature || '';
  if (weaponDesc && isBeast) {
    log('Seedream', `   ⚔️ 武器描述已融入角色描述: ${weaponDesc.substring(0, 50)}...`);
  }

  // 🚫 禁用v4.8武器参考图分离方案（大鹏要求武器和角色合一）
  // let weaponRefUrl = null;
  // if (isBeast && signature && signature.trim().length > 0) { ... }

  // 🌍 v4.0-Peng: 人类/异兽双分支prompt构建
  let shots;
  
  if (isBeast) {
    // ========== 异兽专用8角度定妆照（v4.2-Peng 一致性升级） ==========
    // 🎨 v4.2-Peng-Artist: 艺术家视角 — 8岁探险者好奇打量 + CG角色设计稿级别
    // 核心思路：不是"生成角色"，而是"记录一次真实遇见"
    const artistPerspective = '超写实CG角色设计稿，Unreal Engine 5渲染，8K，电影级光照，体积光，次表面散射，极其精细材质，3D立体体积感，照片级真实感，微观纹理清晰可见';
    
    // 🎨 v4.2-Peng-Artist: 材质细胞级描述 — 从 --features 动态传入（通用结构）
    // 标准化格式：【主体】材质描述 【肢体】材质描述 【翅膀/特殊部位】材质描述 【头部/面部】材质描述
    // 每个异兽根据自身体型填入对应内容，结构统一但内容差异化
    const beastDetail = features || ''; // 从 --features 参数传入材质细胞级描述
    
    // 🌍 v4.6-Peng: 恐怖谷异兽二创 — 自动应用神话化重塑
    let beastDesc = `${beastDetail}，${name}，${species}，${signature}`;
    let uncannyRemix = null;
    if (isUncannyValleyBeast(name)) {
      uncannyRemix = getCreativeRemix(name, features);
      if (uncannyRemix) {
        log('Seedream', `   🎭 恐怖谷异兽 detected，启用神话化二创重塑`);
        beastDesc = `${name}，${species}，${uncannyRemix.bodyMaterial}，${uncannyRemix.headReplacement}，${uncannyRemix.eyesRemix}，${uncannyRemix.mouthRemix}，${uncannyRemix.weaponRemix}，${uncannyRemix.overallVibe}，${signature}`;
      }
    }
    
    // 🎨 v4.2-Peng-Artist: 从纯白背景升级为角色设计稿背景 — 有体积感、有光影、有故事性
    const beastBg = '角色设计稿展示背景，柔和渐变灰色背景，专业摄影棚布光，主体占画面85%，清晰的体积感和空间感，无杂乱环境干扰';
    
    // 🌍 v4.2-Peng: 构建一致性约束包（三层约束）
    const consistencyLock = `${BEAST_ANATOMICAL_LOCK}，${BEAST_AESTHETIC_GUIDE}，${BEAST_MORPHOLOGY_LOCK}`;
    
    // 🌍 v4.5-Peng: 敏感异兽添加合规包装
    const sensitiveCompliance = isSensitiveBeast(name) ? `，${SENSITIVE_BEAST_COMPLIANCE}` : '';
    
    // 🌍 v4.6-Peng: 恐怖谷异兽添加恐怖消除约束
    const uncannyElimination = (uncannyRemix && uncannyRemix.horrorElimination) ? `，${uncannyRemix.horrorElimination}` : '';
    
    // 🌍 v4.6.2-Peng: 武器跨图一致性约束
    const weaponConsistency = (uncannyRemix && uncannyRemix.weaponConsistency) ? `，${uncannyRemix.weaponConsistency}` : '';
    
    shots = [
      {
        suffix: '正面全身',
        angle: 'front_fullbody',
        prompt: `【CG角色设计稿 | 正面全身】8岁探险者小G在Nirath发光丛林中第一次遇见这只巨大神圣生物，抬头仰望，眼中充满惊奇。${name}正面全身纯本体展示，${beastDesc}，${artistPerspective}，${beastBg}，正面朝向镜头，完整展示${name}全部身体特征，主体材质细节清晰可见，内部光芒透出形成次表面散射，肢体对称排列结构稳定，翅膀/特殊部位薄膜透光呈现光泽，山海经原著形态忠实还原，纯异兽主体占画面100%，无人类角色，无小G，无科技元素，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '侧面全身',
        angle: 'side_profile',
        prompt: `【CG角色设计稿 | 侧面全身】8岁探险者小G在Nirath星球环绕观察这只神圣生物的侧面轮廓。${name}侧面全身轮廓，${beastDesc}，${artistPerspective}，${beastBg}，90度侧面展示，完整侧面轮廓，体型比例清晰，侧面展示主体膜壁透光性，内部光芒从边缘透出形成柔和轮廓光，翅膀/特殊部位侧面展示薄膜厚度渐变，山海经原著侧面特征，纯异兽主体，无人类，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '背面全身',
        angle: 'back_fullbody',
        prompt: `【CG角色设计稿 | 背面全身】8岁探险者小G从后方悄悄观察这只正在发光的巨大生物。${name}背面全身姿态，${beastDesc}，${artistPerspective}，${beastBg}，背面朝向镜头，背部特征完整可见，背部膜质表面微光纹理，光芒从背部透出形成温暖光晕，肢体从背部视角对称排列，翅膀/特殊部位背面展示脉络发光，山海经原著背面形态，纯异兽，无人类，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '45度半身',
        angle: 'three_quarter',
        prompt: `【CG角色设计稿 | 45度半身】8岁探险者小G蹲下身子，好奇地观察这只生物的头部细节。${name}45度角半身特写，${beastDesc}，${artistPerspective}，${beastBg}，经典肖像角度，${name}头部和上半身主体，头部材质如温润玉石，微妙发光经络从中心辐射，特定角度反射微弱光芒，头部表面细腻纹理清晰可见，山海经原著头部特征，纯异兽主体，无人类，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '面部特写',
        angle: 'face_closeup',
        prompt: `【CG角色设计稿 | 面部/头部特写】8岁探险者小G屏住呼吸，近距离凝视这只神圣生物的头部。${name}面部/头部极端特写，${beastDesc}，${artistPerspective}，${beastBg}，${name}头部占画面主体，头部材质温润如玉，微妙发光经络纹理极端清晰，从中心向外辐射的淡淡光芒，宇宙纯净表面的微观起伏，神圣空白中的无限深度，山海经原著面部特征，纯异兽，无人类面孔，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '动作奔跑',
        angle: 'action_running',
        prompt: `【CG角色设计稿 | 疾驰姿态】${name}在Nirath峡谷底部S形波浪式疾驰，躯体离地腾空，鳞片与空气摩擦产生金色能量涟漪，背部能量腺体光轨拉长如流星，鹿角向后引流气流。${name}疾驰动态，${beastDesc}，${artistPerspective}，${beastBg}，疾驰姿态主体占画面85%，运动模糊仅在鳞片边缘，躯体S形曲线清晰，连续推进感，次表面散射光效，纯异兽疾驰，无人类，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '动作坐姿',
        angle: 'action_sitting',
        prompt: `【CG角色设计稿 | 昂首警戒姿态】${name}头胸部直立提升，蛇身前半段竖起如塔，颈部扩张呈防御态势，背部能量腺体脉冲加快，红宝石双眼警觉地凝视远方。${name}昂首警戒，${beastDesc}，${artistPerspective}，${beastBg}，直立姿态占画面80%，重心稳固，鹿角剪影如树枝，光芒从背部放射，纯异兽警戒态，无人类，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      },
      {
        suffix: '手部特写',
        angle: 'hand_detail',
        prompt: `【CG角色设计稿 | 肢体/翅膀/足部特写】8岁探险者小G凑近观察这只生物的肢体纹理和特殊部位结构。${name}肢体/爪/翼极端特写，${beastDesc}，${artistPerspective}，${beastBg}，${name}肢体细节占画面主体，足部/肢体末端纹理极端清晰，皮肤细腻纹理，翅膀/特殊部位脉络清晰可见，薄膜厚度透光光泽，材质表面细微高光反射，山海经原著肢体特征，纯异兽，无人类，无小G，无科技，${consistencyLock}，${BEAST_NEGATIVE_CONSTRAINTS}${sensitiveCompliance}${uncannyElimination}${weaponConsistency}`
      }
    ];
    
    // 异兽：追加原著约束
    if (originalText) {
      shots.forEach(shot => {
        shot.prompt += `，严格忠于《山海经》原著描述：${originalText}，不得偏离原著特征，不得添加非原著元素`;
      });
    }
    
  } else {
    // ========== 人类角色（小G等）8角度定妆照 ==========
    // 🌍 v3.0-Peng: 超写实真人风格强化 + 中国人特征强制注入
    // 基础风格：强制超写实真人风格（非CG/非卡通）
    const baseStyle = '超写实真人风格，摄影级真实感，接近真人比例，非CG渲染，非动画，非皮克斯风格，非卡通化';
    
    // 中国人特征强制注入（所有人类角色）
    const chineseFeatures = '中国人，东亚人特征，黑色短发，深棕色杏仁眼，黄皮肤，单眼皮或内双，圆脸方下巴，无雀斑，无欧美特征，无深眼窝，无高鼻梁';
    
    // 8岁男孩年龄特征
    const childFeatures = '8岁男孩，儿童面部比例，大眼睛占面部比例较大，真实皮肤纹理有自然的毛孔和细微纹理，健康的东亚儿童肤色，略带婴儿肥，天真无邪的表情，自然抓拍感';
    
    // 负面约束（明确排除不想要的元素 + v5.0-Peng眼睛颜色全局规则）
    const negativeConstraints = '不要雀斑，不要痘痘，不要西方特征，不要深眼窝，不要高鼻梁，不要卷发，不要金发，不要蓝眼睛，不要红眼睛，不要黄眼睛，不要发光眼睛，不要非自然瞳孔颜色，自然黑色瞳孔，眼睛干净，瞳孔中可有对面景物的微弱倒影';
    
    // 服装特征（探险装备）+ 配饰精确统一规范
    const clothing = '穿亮黄色短款户外冲锋衣，及腰长度，拉链微开，深蓝色直筒牛仔裤，白色低帮运动鞋，干净简洁';
    const accessories = '脖子挂着黄铜指南针，皮革挂绳垂到胸口位置，指南针为圆形黄铜外壳，表盘清晰可见；腰间右侧挂着军绿色圆柱形水壶，带有帆布保护套和背带扣；冲锋衣左胸口袋里插着半截黑色LED手电筒，手电筒头部露出口袋外，带有短挂绳';
    
    // 纯黑背景
    const bg = '纯黑背景，工作室布光，均匀照明，无环境干扰';
    
    // 组合完整描述
    const fullDesc = `${name}，${species}，${features}，${signature}，${childFeatures}，${chineseFeatures}，${clothing}`;
    
    shots = [
      {
        suffix: '正面全身',
        angle: 'front_fullbody',
        prompt: `正面全身站立姿态，${fullDesc}，${baseStyle}，${bg}，全身完整可见，正面朝向镜头，双脚站立，双臂自然下垂，真实人体比例，服装细节清晰，光影立体感强，360度无死角展示正面特征，${negativeConstraints}`
      },
      {
        suffix: '侧面全身',
        angle: 'side_profile',
        prompt: `侧面全身轮廓，${fullDesc}，${baseStyle}，${bg}，90度侧面展示，完整侧面轮廓可见，体型比例清晰，从头部到脚部完整展示，侧面线条流畅，真实人体比例，${negativeConstraints}`
      },
      {
        suffix: '背面全身',
        angle: 'back_fullbody',
        prompt: `背面全身姿态，${fullDesc}，${baseStyle}，${bg}，背面朝向镜头，背部特征完整可见，后脑勺发型清晰，背部纹理真实，从后方展示整体体型，真实人体比例，${negativeConstraints}`
      },
      {
        suffix: '45度半身',
        angle: 'three_quarter',
        prompt: `45度角半身像，${fullDesc}，${baseStyle}，${bg}，经典肖像角度，腰部以上，面部和上半身立体展示，自然光影，真实皮肤纹理，略带自然肌理，${negativeConstraints}`
      },
      {
        suffix: '面部特写',
        angle: 'face_closeup',
        prompt: `面部特写，${fullDesc}，${baseStyle}，${bg}，面部占画面主体，五官清晰，眼神明亮有神，表情天真好奇，东亚儿童面部特征，真实皮肤有自然纹理和毛孔，健康的肤色，自然抓拍瞬间，柔和自然光影，发丝有自然杂乱感，${negativeConstraints}`
      },
      {
        suffix: '动作奔跑',
        angle: 'action_running',
        prompt: `自然奔跑姿态，${fullDesc}，${baseStyle}，${bg}，双腿自然奔跑，身体轻微前倾，真实儿童运动姿态，动态自然，无夸张变形，真实人体比例，${negativeConstraints}`
      },
      {
        suffix: '动作坐姿',
        angle: 'action_sitting',
        prompt: `自然坐姿，${fullDesc}，${baseStyle}，${bg}，盘腿坐或蹲坐，真实儿童坐姿，放松自然，真实人体比例，无夸张变形，${negativeConstraints}`
      },
      {
        suffix: '手部特写',
        angle: 'hand_detail',
        prompt: `手部极端特写，${fullDesc}，${baseStyle}，${bg}，双手占画面主体，手指向前自然伸展，掌心朝前，五指张开无重叠，正常人类儿童手部比例，手指对称分布，无镜像反转，无六指或畸形，真实皮肤纹理可见掌纹，${negativeConstraints}`
      }
    ];
    
    // 人类：追加原著约束
    if (originalText) {
      shots.forEach(shot => {
        shot.prompt += `，严格忠于《山海经》原著描述：${originalText}，不得偏离原著特征`;
      });
    }
  }
  
  const results = [];
  
  // 🌍 v4.2-Peng: 参考图机制 — 第一张正面全身作为后续所有角度的参考，强制跨图一致
  let referenceImageUrl = null;
  
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const filename = `${name}-${shot.suffix}.png`;
    const filepath = path.join(charDir, filename);
    
    // 检查是否已存在（避免重复生成）
    if (fs.existsSync(filepath)) {
      log('Seedream', `   ✅ ${filename} 已存在，跳过`);
      results.push({ suffix: shot.suffix, angle: shot.angle, filepath, status: 'skipped' });
      continue;
    }
    
    log('Seedream', `   ⏳ 生成 ${filename} (${shot.angle})...`);
    
    try {
      const body = {
        model: MODEL_ID,
        prompt: shot.prompt,
        size: '1920x1920',
        output_format: 'png',
        response_format: 'url',
        watermark: false,
        sequential_image_generation: 'auto',
        sequential_image_generation_options: { max_images: 3 }
      };
      
      // 🆕 v5.0-Peng: 武器参考图引用已禁用（大鹏要求武器和角色合一，不分离生成）
      // if (weaponRefUrl) { body.image = weaponRefUrl; }
      
      // 🌍 v4.5-Peng: 敏感异兽不使用参考图机制（避免参考图被判定敏感）
      if (referenceImageUrl && i > 0 && !isSensitiveBeast(name)) {
        body.image = referenceImageUrl;
        log('Seedream', `   🖼️ 使用参考图: ${referenceImageUrl.substring(0, 80)}...`);
      } else if (isSensitiveBeast(name) && i > 0) {
        log('Seedream', `   🔒 敏感异兽模式: 不使用参考图，独立生成`);
      }
      
      const response = await postJson(
        `${API_BASE}${API_PATH}`,
        { 'Authorization': `Bearer ${apiKey}` },
        body
      );
      
      if (response.error) {
        throw new Error(`API错误: ${response.error.code} - ${response.error.message}`);
      }
      
      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('API未返回图片URL');
      }
      
      // 🌍 v4.5-Peng: 第一张正面全身保存为参考图（敏感异兽除外）
      if (i === 0 && !isSensitiveBeast(name)) {
        referenceImageUrl = imageUrl;
        log('Seedream', `   🎯 正面全身已设为参考图模板`);
      } else if (i === 0 && isSensitiveBeast(name)) {
        log('Seedream', `   🔒 敏感异兽: 不保存参考图模板`);
      }
      
      // 下载图片
      await downloadImage(imageUrl, filepath);
      log('Seedream', `   ✅ ${filename} 已下载 (${response.data[0].size || 'unknown'})`);
      results.push({ suffix: shot.suffix, angle: shot.angle, filepath, status: 'success', url: imageUrl });
      
    } catch (err) {
      log('Seedream', `   ❌ ${filename} 失败: ${err.message}`);
      results.push({ suffix: shot.suffix, angle: shot.angle, filepath, status: 'failed', error: err.message });
    }
  }
  
  // 生成角色元数据（v2.2升级）
  const meta = {
    name,
    species,
    features: Array.isArray(features) ? features.filter(Boolean) : features.split(/[,+]/).map(s => s.trim()).filter(Boolean),
    signature,
    style,
    originalText, // 🔴 v2.2: 记录原著约束
    isBeast,      // 🌍 v4.0-Peng: 标记是否为异兽
    beastType,    // 🔴 v2.2: 记录异兽类型
    referencePhotos: results.map(r => ({
      type: r.suffix,
      angle: r.angle,
      filename: path.basename(r.filepath),
      status: r.status,
      url: r.url || null
    })),
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    version: 'v4.0-Peng'
  };
  
  fs.writeFileSync(path.join(charDir, 'character-meta.json'), JSON.stringify(meta, null, 2));
  log('Seedream', `✅ 角色 [${name}] 8角度定妆完成！目录: ${charDir}`);
  
  return { charDir, results, meta };
}

// ============ 批量生成（从story-plan.json读取角色） ============
async function batchGenerate(args) {
  const storyPlanPath = args['story-plan'] || args.storyPlan;
  const outputDir = args['output-dir'] || args.outputDir || './characters';
  
  if (!storyPlanPath || !fs.existsSync(storyPlanPath)) {
    throw new Error(`❌ 未找到story-plan.json: ${storyPlanPath}`);
  }
  
  const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
  const characters = storyPlan.characters || [];
  
  if (characters.length === 0) {
    log('Seedream', '⚠️ story-plan中未定义角色，跳过定妆');
    return [];
  }
  
  log('Seedream', `🎬 批量生成 ${characters.length} 个角色的定妆照...`);
  
  const allResults = [];
  for (const char of characters) {
    const result = await generateCharacterReference({
      name: char.name,
      species: char.species || '',
      features: (char.features || []).join('+'),
      signature: char.signature || '',
      style: storyPlan.styleManifesto || '',
      'output-dir': outputDir
    });
    allResults.push(result);
  }
  
  // 生成批量报告
  const report = {
    totalCharacters: characters.length,
    totalPhotos: allResults.reduce((sum, r) => sum + r.results.length, 0),
    successCount: allResults.reduce((sum, r) => sum + r.results.filter(x => x.status === 'success').length, 0),
    failedCount: allResults.reduce((sum, r) => sum + r.results.filter(x => x.status === 'failed').length, 0),
    characters: allResults.map(r => ({
      name: r.meta.name,
      dir: r.charDir,
      photos: r.results.map(p => ({ type: p.suffix, status: p.status }))
    }))
  };
  
  fs.writeFileSync(path.join(outputDir, 'batch-report.json'), JSON.stringify(report, null, 2));
  log('Seedream', `✅ 批量定妆完成！成功: ${report.successCount}, 失败: ${report.failedCount}`);
  
  return allResults;
}

// 🆕 v4.8-Peng-ULTIMATE: 武器参考图生成 — 单独生成武器标准参考图
// 武器本身不敏感，可以正常生成。然后所有角度强制引用此图
async function generateWeaponReference({ name, species, signature, features, apiKey, charDir }) {
  log('Seedream', `   ⚔️ 生成武器标准参考图...`);
  
  // 提取武器描述
  const weaponDesc = signature || '';
  const weaponPrompt = `【武器设计稿 | 标准参考图】${name}的武器特写，${weaponDesc}，超写实CG渲染，Unreal Engine 5，8K，极其精细材质，专业摄影棚布光，纯黑背景，武器占画面主体85%，正面展示武器完整形态，尺寸比例清晰可见，金属质感细腻，边缘平直，无人物，无背景干扰，多角度通用武器标准参考图`;
  
  const body = {
    model: MODEL_ID,
    prompt: weaponPrompt,
    size: '1920x1920',
    output_format: 'png',
    response_format: 'url',
    watermark: false
  };
  
  try {
    const response = await postJson(
      `${API_BASE}${API_PATH}`,
      { 'Authorization': `Bearer ${apiKey}` },
      body
    );
    
    if (response.error) {
      log('Seedream', `   ⚠️ 武器参考图生成失败: ${response.error.message}`);
      return null;
    }
    
    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      log('Seedream', `   ⚠️ 武器参考图未返回URL`);
      return null;
    }
    
    // 下载武器参考图
    const weaponFile = path.join(charDir, 'weapon-reference.png');
    await downloadImage(imageUrl, weaponFile);
    log('Seedream', `   ✅ 武器参考图已保存: ${weaponFile}`);
    
    return imageUrl;
  } catch (err) {
    log('Seedream', `   ⚠️ 武器参考图生成异常: ${err.message}`);
    return null;
  }
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
  
  switch (command) {
    case 'generate':
      if (!args.name) {
        console.error('❌ 缺少 --name 参数');
        process.exit(1);
      }
      await generateCharacterReference(args);
      break;
      
    case 'batch':
      if (!args.storyPlan) {
        console.error('❌ 缺少 --story-plan 参数');
        process.exit(1);
      }
      await batchGenerate(args);
      break;
      
    case 'help':
    default:
      console.log(`
Seedream Character Reference Generator — 角色定妆照生成器

用法:
  node seedream-wrapper.js generate [options]   为单个角色生成定妆照
  node seedream-wrapper.js batch [options]        从story-plan批量生成

命令:
  generate    单角色生成
  batch       批量生成（读取story-plan.json）
  help        显示帮助

generate 选项:
  --name          角色名（必须）
  --species       物种/类型
  --features      特征列表（用+或,分隔）
  --signature     标志性元素
  --style         视觉风格
  --output-dir    输出目录（默认./characters）

batch 选项:
  --story-plan    story-plan.json路径（必须）
  --output-dir    输出目录（默认./characters）

环境变量:
  ARK_API_KEY     火山方舟API Key（必须）

示例:
  node seedream-wrapper.js generate --name "大圣" --species "猴形金色生物" --features "火眼金睛+金色毛发+灵巧" --signature "燃烧长棒"
  node seedream-wrapper.js batch --story-plan "./productions/xxx/01-story-plan.json" --output-dir "./productions/xxx/03-characters"
      `);
  }
}

main().catch(e => {
  console.error(`❌ 致命错误: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});

module.exports = { generateCharacterReference, batchGenerate };