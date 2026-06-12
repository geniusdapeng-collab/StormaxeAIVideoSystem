#!/usr/bin/env node
/**
 * Seedance Character Manager
 * 角色资产管理脚本
 * 
 * 用法:
 *   node character-manager.js generate --name "角色名" --species "物种" --features "特征1,特征2" --signature "标志性元素" --style "风格"
 *   node character-manager.js list
 *   node character-manager.js match --shot-desc "镜头描述" --characters "C01,C02" --output "./refs"
 *   node character-manager.js batch-match --shots-dir "./shots/" --output-dir "./output/"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🔴 v8.0-Peng: 引入 Seedream 真实生成能力
const { generateCharacterReference } = require('../../seedance-director/scripts/seedream-wrapper.js');

const SAVE_PATH = process.env.CHARACTER_SAVE_PATH || path.join(require('os').homedir(), 'Seedance-Characters');
const REGISTRY_FILE = path.join(SAVE_PATH, 'character-registry.json');

// 判断是否为写实风格的人类角色
function isRealisticHuman(args) {
  const style = args.style || '';
  const species = args.species || '';
  return /人类|真人|写实|现实|realistic|human|live-action/i.test(species + ' ' + style);
}

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 初始化注册表
function initRegistry() {
  ensureDir(SAVE_PATH);
  if (!fs.existsSync(REGISTRY_FILE)) {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify({ characters: [], lastUpdated: new Date().toISOString() }, null, 2));
  }
}

// 读取注册表
function readRegistry() {
  initRegistry();
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  } catch (err) {
    console.error(`[CharacterManager] 注册表解析失败: ${err.message}`);
    return { characters: [], lastUpdated: new Date().toISOString() };
  }
}

// 写入注册表
function writeRegistry(registry) {
  registry.lastUpdated = new Date().toISOString();
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

// 生成下一个角色ID
function nextCharacterId(registry) {
  const ids = registry.characters.map(c => c.id);
  let num = 1;
  while (ids.includes(`C${String(num).padStart(2, '0')}`)) {
    num++;
  }
  return `C${String(num).padStart(2, '0')}`;
}

// 生成角色参考图（调用豆包Seedream文生图）
// 🔴 v8.0-Peng: 真正调用 Seedream API 生成角色定妆照
async function generateCharacter(args) {
  const registry = readRegistry();
  const id = nextCharacterId(registry);

  const savePath = args.output || SAVE_PATH;
  const charDir = path.join(savePath, `${id}-${args.name}`);
  ensureDir(charDir);

  console.log(`🎨 开始为角色 [${id}] ${args.name} 生成真实定妆照 (Seedream)...`);

  // 调用 seedream-wrapper.js 生成 3 张核心定妆照
  const seedreamResult = await generateCharacterReference({
    name: args.name,
    species: args.species || '',
    features: args.features || '',
    signature: args.signature || '',
    style: args.style || '',
    'output-dir': charDir  // 输出到角色专属目录
  });

  // 将 seedream 结果映射到 character-manager 的视图格式
  const generatedFiles = seedreamResult.results.map(r => {
    const viewMap = {
      '全身': '正面全身',
      '特写': '面部表情',
      '动态': '动作姿态'
    };
    return {
      suffix: viewMap[r.suffix] || r.suffix,
      filepath: r.filepath,
      prompt: seedreamResult.meta?.referencePhotos?.find(p => p.type === r.suffix)?.prompt || '',
      status: r.status
    };
  }).filter(f => f.status === 'success');

  if (generatedFiles.length === 0) {
    throw new Error('❌ Seedream 未能生成任何角色定妆照，请检查 API Key 和配额');
  }

  console.log(`  ✅ 成功生成 ${generatedFiles.length}/3 张定妆照`);

  // 写入角色元数据（兼容现有格式）
  const meta = {
    id,
    name: args.name,
    species: args.species,
    features: typeof args.features === 'string' && args.features.trim() ? args.features.split(',').map(s => s.trim()) : [],
    signature: args.signature,
    style: args.style,
    views: generatedFiles.map(f => ({ suffix: f.suffix, filename: path.basename(f.filepath) })),
    createdAt: new Date().toISOString(),

    seedreamMeta: seedreamResult.meta
  };
  fs.writeFileSync(path.join(charDir, `${id}_meta.json`), JSON.stringify(meta, null, 2));
  registry.characters.push({
    id,
    name: args.name,
    species: args.species,
    features: meta.features,
    signature: args.signature,
    style: args.style,
    refCount: generatedFiles.length,
    createdAt: meta.createdAt
  });
  writeRegistry(registry);

  console.log(`\n✅ 角色 [${id}] ${args.name} 真实定妆照已生成！`);
  console.log(`📁 路径: ${charDir}`);
  console.log(`📊 生成视图: ${generatedFiles.length} 张`);
  console.log(`💡 下一步: 用 "character-manager.js match" 为镜头匹配参考图`);
}

// 列出所有角色
function listCharacters() {
  const registry = readRegistry();
  if (registry.characters.length === 0) {
    console.log('📭 角色资产库为空');
    return;
  }

  console.log('\n📚 角色资产库清单:\n');
  console.log('ID    名称        物种              特征数  视图数  创建时间');
  console.log('─────────────────────────────────────────────────────────────');
  for (const c of registry.characters) {
    console.log(`${c.id}  ${c.name.padEnd(10)} ${c.species.padEnd(16)} ${c.features.length}      ${c.refCount}      ${c.createdAt.split('T')[0]}`);
  }
  console.log(`\n总计: ${registry.characters.length} 个角色`);
}

// 为镜头匹配参考图
function matchReferences(args) {
  const registry = readRegistry();
  const charIds = args.characters.split(',').map(s => s.trim());
  const outputDir = args.output || './refs';
  ensureDir(outputDir);

  console.log(`🔍 为镜头匹配参考图...`);
  console.log(`📝 镜头描述: ${args.shotDesc}`);
  console.log(`👤 涉及角色: ${charIds.join(', ')}`);

  const matchedRefs = [];
  let imgIndex = 1;

  for (const charId of charIds) {
    const char = registry.characters.find(c => c.id === charId);
    if (!char) {
      console.warn(`⚠️ 角色 ${charId} 不存在，跳过`);
      continue;
    }

    const savePath = args.outputDir || SAVE_PATH;
    const charDir = path.join(savePath, `${charId}-${char.name}`);
    const metaPath = path.join(charDir, `${charId}_meta.json`);
    
    if (!fs.existsSync(metaPath)) {
      console.warn(`⚠️ 角色 ${charId} 元数据丢失`);
      continue;
    }

    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (err) {
      console.error(`[CharacterManager] 元数据解析失败: ${metaPath} — ${err.message}`);
      continue;
    }
    
    // 智能匹配逻辑：根据镜头描述选择最合适的参考图
    const shotDesc = args.shotDesc.toLowerCase();
    let selectedViews = [];

    // 如果镜头描述包含动作关键词，优先选动作姿态图
    if (/跃起|腾空|挥|舞|冲|打|踢|跳|旋转/.test(shotDesc)) {
      const actionView = meta.views.find(v => v.suffix.includes('动作'));
      if (actionView) selectedViews.push(actionView);
    }
    
    // 如果镜头描述包含正面/面部关键词，选正面图
    if (/正面|面部|表情|眼神|特写/.test(shotDesc)) {
      const faceView = meta.views.find(v => v.suffix.includes('正面') || v.suffix.includes('面部'));
      if (faceView) selectedViews.push(faceView);
    }

    // 如果镜头描述包含侧面/轮廓，选侧面图
    if (/侧面|轮廓|侧脸/.test(shotDesc)) {
      const sideView = meta.views.find(v => v.suffix.includes('侧面'));
      if (sideView) selectedViews.push(sideView);
    }

    // 兜底：如果没有匹配到，选正面全身+动作姿态
    if (selectedViews.length === 0) {
      const frontView = meta.views.find(v => v.suffix.includes('正面'));
      const actionView = meta.views.find(v => v.suffix.includes('动作'));
      if (frontView) selectedViews.push(frontView);
      if (actionView) selectedViews.push(actionView);
    }

    // 去重
    selectedViews = [...new Set(selectedViews)];

    for (const view of selectedViews) {
      const srcPath = path.join(charDir, view.filename);
      const dstName = `@图片${imgIndex}_${char.name}_${view.suffix}.png`;
      const dstPath = path.join(outputDir, dstName);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        matchedRefs.push({
          charId,
          charName: char.name,
          viewSuffix: view.suffix,
          srcPath,
          dstPath,
          promptRef: `@图片${imgIndex}`
        });
        console.log(`  ✅ ${dstName} — ${view.suffix}`);
        imgIndex++;
      } else if (fs.existsSync(srcPath + '.pending')) {
        // 如果图片还在pending状态，复制prompt文件
        fs.copyFileSync(srcPath + '.pending', dstPath + '.prompt');
        matchedRefs.push({
          charId,
          charName: char.name,
          viewSuffix: view.suffix,
          prompt: fs.readFileSync(srcPath + '.pending', 'utf8'),
          promptRef: `@图片${imgIndex}`
        });
        console.log(`  ⏳ ${dstName} — ${view.suffix} (待生成)`);
        imgIndex++;
      }
    }
  }

  // 写入匹配清单
  const matchManifest = {
    shotDesc: args.shotDesc,
    characters: charIds,
    matchedAt: new Date().toISOString(),
    references: matchedRefs
  };
  fs.writeFileSync(path.join(outputDir, 'match-manifest.json'), JSON.stringify(matchManifest, null, 2));

  console.log(`\n✅ 匹配完成！共 ${matchedRefs.length} 张参考图`);
  console.log(`📁 输出目录: ${outputDir}`);
  console.log(`📄 清单文件: ${path.join(outputDir, 'match-manifest.json')}`);
}

// 批量匹配
function batchMatch(args) {
  const shotsDir = args.shotsDir || './shots';
  const outputDir = args.outputDir || './shots_with_refs';
  
  if (!fs.existsSync(shotsDir)) {
    console.error(`❌ 镜头目录不存在: ${shotsDir}`);
    return;
  }

  const shotFiles = fs.readdirSync(shotsDir).filter(f => f.endsWith('.json'));
  console.log(`📁 发现 ${shotFiles.length} 个镜头文件`);

  for (const file of shotFiles) {
    const shotPath = path.join(shotsDir, file);
    let shot;
    try {
      shot = JSON.parse(fs.readFileSync(shotPath, 'utf8'));
    } catch (err) {
      console.error(`[CharacterManager] 镜头文件解析失败: ${shotPath} — ${err.message}`);
      continue;
    }
    const shotOutputDir = path.join(outputDir, path.basename(file, '.json'), 'refs');
    
    console.log(`\n🎬 处理镜头: ${shot.id || file}`);
    matchReferences({
      shotDesc: shot.description || shot.prompt || '',
      characters: (shot.characters || []).join(','),
      output: shotOutputDir
    });
  }

  console.log(`\n✅ 批量匹配完成！所有参考图已存入 ${outputDir}`);
}

// 解析命令行参数
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) continue;
    const key = rawKey.replace(/^--/, '');
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) {
      args[key] = value;
      i++; // 跳过已消费的 value
    } else {
      args[key] = true;
    }
  }
  return args;
}

// 主入口
function main() {
  const command = process.argv[2];
  const args = parseArgs();

  switch (command) {
    case 'generate':
      if (!args.name || !args.species) {
        console.error('❌ 缺少必要参数: --name, --species');
        process.exit(1);
      }
      generateCharacter(args);
      break;
    case 'list':
      listCharacters();
      break;
    case 'match':
      if (!args.shotDesc || !args.characters) {
        console.error('❌ 缺少必要参数: --shot-desc, --characters');
        process.exit(1);
      }
      matchReferences(args);
      break;
    case 'batch-match':
      batchMatch(args);
      break;
    case 'help':
    default:
      console.log(`
Seedance Character Manager — 角色资产管理

用法:
  node character-manager.js generate --name <name> --species <species> [options]
  node character-manager.js list
  node character-manager.js match --shot-desc <desc> --characters <ids> [--output <dir>]
  node character-manager.js batch-match --shots-dir <dir> --output-dir <dir>

命令:
  generate      生成角色多角度参考图
  list          列出所有角色资产
  match         为单个镜头匹配参考图
  batch-match   批量为多个镜头匹配参考图
  help          显示此帮助

generate 选项:
  --name        角色名称
  --species     物种/类型（如"猴形金色生物"）
  --features    特征列表（逗号分隔）
  --signature   标志性元素
  --style       视觉风格
  --count       生成视图数量（默认5）

示例:
  node character-manager.js generate --name "大圣" --species "猴形金色生物" --features "火眼金睛,金色毛发,身形灵巧" --signature "燃烧长棒" --style "3D国漫CG渲染"
      `);
  }
}

main();