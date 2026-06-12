#!/usr/bin/env node
/**
 * Seedance Storyboard Generator v2.0-Peng
 * 
 * 专业分镜生成器，与seedance-director Phase 3深度整合。
 * 输入story-plan.json，输出完整分镜表 + 资产清单 + 拍摄排期。
 * 
 * 用法:
 *   node storyboard-generator.js generate --story-plan <path> --output-dir <dir>
 *   node storyboard-generator.js generate --story-plan <path> --output-dir <dir> --series-mode --episodes 20
 */

const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const WORKSPACE = path.join(require('os').homedir(), '.openclaw/workspace');

// ============ 工具函数 ============
function log(section, msg) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] [${section}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============ Step 1: 解析story-plan ============
function parseStoryPlan(planPath) {
  if (!fs.existsSync(planPath)) {
    throw new Error(`story-plan.json 不存在: ${planPath}`);
  }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  log('Parse', `标题: ${plan.title}, 镜头数: ${plan.totalShots}, 时长: ${plan.totalDuration}秒`);
  return plan;
}

// ============ Step 2: 资产清点与编号 ============
function catalogAssets(plan) {
  log('Assets', '开始资产清点...');
  
  const assets = {
    characters: [],
    scenes: [],
    props: []
  };
  
  // 从角色列表提取
  if (plan.characters) {
    plan.characters.forEach((char, i) => {
      assets.characters.push({
        id: `C${String(i+1).padStart(2,'0')}`,
        name: char.name,
        species: char.species || '未知物种',
        features: char.features || [],
        signature: char.signature || '',
        description: `${char.species || '未知物种'}，${(char.features || []).join('，')}，标志性元素：${char.signature || '无'}`
      });
    });
  }
  
  // 从场景描述提取（基于shot中的场景关键词）
  const sceneSet = new Set();
  if (plan.shots) {
    plan.shots.forEach(shot => {
      // 从shot描述中提取场景关键词
      const desc = shot.description || '';
      // 简单的场景提取逻辑（实际可扩展为NLP）
      const sceneKeywords = ['废墟', '山脉', '城市', '森林', '沙漠', '海洋', '宫殿', '飞船', '母舰', '走廊'];
      sceneKeywords.forEach(keyword => {
        if (desc.includes(keyword)) {
          sceneSet.add(keyword);
        }
      });
    });
  }
  
  // 如果没有提取到场景，使用默认场景
  if (sceneSet.size === 0) {
    sceneSet.add('主场景');
  }
  
  Array.from(sceneSet).forEach((sceneName, i) => {
    assets.scenes.push({
      id: `S${String(i+1).padStart(2,'0')}`,
      name: sceneName,
      description: `${sceneName}场景，${plan.styleManifesto || ''}风格`
    });
  });
  
  // 从标志性元素提取道具
  assets.characters.forEach(char => {
    if (char.signature) {
      assets.props.push({
        id: `P${String(assets.props.length+1).padStart(2,'0')}`,
        name: char.signature,
        owner: char.name,
        description: `${char.name}的标志性元素：${char.signature}`
      });
    }
  });
  
  log('Assets', `角色: ${assets.characters.length}, 场景: ${assets.scenes.length}, 道具: ${assets.props.length}`);
  return assets;
}

// ============ Step 3: 镜头拆解 ============
function designShots(plan, assets) {
  log('Shots', '开始设计镜头...');
  
  const shots = [];
  let currentAct = '';
  let actIndex = 0;
  
  if (plan.shots) {
    plan.shots.forEach((shot, i) => {
      // 检测幕变化
      if (shot.act !== currentAct) {
        currentAct = shot.act;
        actIndex++;
      }
      
      // 确定景别
      const shotSize = inferShotSize(shot.type, shot.tension);
      
      // 确定角度
      const angle = inferAngle(shot.type, shot.emotionStart);
      
      // 确定运动
      const movement = inferMovement(shot.type, shot.camera);
      
      // 确定转场
      const transition = inferTransition(shot, plan.shots[i+1]);
      
      // 匹配角色资产
      const charAssets = matchCharacterAssets(shot.characters, assets);
      
      // 匹配场景资产
      const sceneAsset = matchSceneAsset(shot.description, assets);
      
      shots.push({
        ...shot,
        actIndex,
        shotSize,
        angle,
        movement,
        transition,
        charAssets,
        sceneAsset,
        timecode: formatTimecode(shot.timeStart || 0),
        durationSec: shot.duration || 5
      });
    });
  }
  
  log('Shots', `设计了 ${shots.length} 个镜头`);
  return shots;
}

// 推断景别
function inferShotSize(type, tension) {
  const sizeMap = {
    '建置': '全景',
    '触发': '中景',
    '反应': '近景',
    '准备': '中全景',
    '升级': '中景',
    '对抗': '全景',
    '转折': '特写',
    '逼近': '中近景',
    '高潮前': '近景',
    '终极': '全景',
    '爆发': '特写',
    '结果': '中景',
    '收束': '全景',
    '定格': '大特写'
  };
  
  // 根据张力调整
  if (tension >= 90) return '特写';
  if (tension <= 20) return '大全景';
  
  return sizeMap[type] || '中景';
}

// 推断角度
function inferAngle(type, emotion) {
  const angleMap = {
    '建置': '平视',
    '触发': '俯拍',
    '反应': '平视',
    '准备': '平视',
    '升级': '仰拍',
    '对抗': '平视',
    '转折': '倾斜',
    '逼近': '仰拍',
    '高潮前': '俯拍',
    '终极': '仰拍',
    '爆发': '仰拍',
    '结果': '平视',
    '收束': '鸟瞰',
    '定格': '平视'
  };
  
  // 根据情绪调整
  if (emotion && (emotion.includes('愤怒') || emotion.includes('强势'))) return '仰拍';
  if (emotion && (emotion.includes('恐惧') || emotion.includes('弱势'))) return '俯拍';
  
  return angleMap[type] || '平视';
}

// 推断运动
function inferMovement(type, camera) {
  // 优先使用story-engine指定的camera
  if (camera) {
    if (camera.includes('推')) return '推轨';
    if (camera.includes('拉')) return '拉轨';
    if (camera.includes('跟')) return '跟拍';
    if (camera.includes('环绕')) return '环绕';
    if (camera.includes('航拍')) return '航拍';
    if (camera.includes('摇')) return '摇摄';
    if (camera.includes('手持')) return '手持';
    if (camera.includes('升降')) return '升降';
  }
  
  const movementMap = {
    '建置': '航拍',
    '触发': '推轨',
    '反应': '手持',
    '准备': '跟拍',
    '升级': '推轨',
    '对抗': '跟拍',
    '转折': '甩镜',
    '逼近': '推轨',
    '高潮前': '环绕',
    '终极': '推轨',
    '爆发': '拉轨',
    '结果': '摇摄',
    '收束': '拉轨',
    '定格': '定格'
  };
  
  return movementMap[type] || '推轨';
}

// 推断转场
function inferTransition(currentShot, nextShot) {
  if (!nextShot) return '收束';
  
  // 同角色连续 → 硬切
  if (currentShot.characters && nextShot.characters) {
    const currentChars = currentShot.characters.join(',');
    const nextChars = nextShot.characters.join(',');
    if (currentChars === nextChars) return '硬切';
  }
  
  // 情绪突变 → 闪白
  if (currentShot.emotionEnd && nextShot.emotionStart) {
    const endEmotion = currentShot.emotionEnd;
    const startEmotion = nextShot.emotionStart;
    if (endEmotion !== startEmotion) return '叠化';
  }
  
  // 时间跳跃 → 叠化
  if (currentShot.type === '收束' || currentShot.type === '结果') return '叠化';
  
  return '硬切';
}

// 匹配角色资产
function matchCharacterAssets(charIds, assets) {
  if (!charIds || !assets.characters) return [];
  
  return charIds.filter(Boolean).map(charId => {
    const charName = charId.split('-')[1] || charId;
    const matched = assets.characters.find(c => c.name === charName || charId.includes(c.name));
    return matched ? matched.id : null;
  }).filter(Boolean);
}

// 匹配场景资产
function matchSceneAsset(description, assets) {
  if (!description || !assets.scenes) return null;
  
  for (const scene of assets.scenes) {
    if (description.includes(scene.name)) {
      return scene.id;
    }
  }
  
  // 默认返回第一个场景
  return assets.scenes[0]?.id || null;
}

// 格式化时间码
function formatTimecode(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ============ Step 4: 生成提示词 ============
function generatePrompts(shots, plan, assets) {
  log('Prompts', '开始生成镜头提示词...');
  
  const prompts = [];
  
  shots.forEach(shot => {
    const prompt = buildShotPrompt(shot, plan, assets);
    prompts.push({
      shotId: shot.id,
      prompt,
      refs: buildReferences(shot, assets)
    });
  });
  
  log('Prompts', `生成了 ${prompts.length} 个提示词`);
  return prompts;
}

function buildShotPrompt(shot, plan, assets) {
  const styleManifesto = plan.styleManifesto || '3D国漫CG渲染,UnrealEngine5,工业光魔级VFX';
  const lightingThreeLayer = plan.lightingThreeLayer || '逆光暗金+冰蓝自发光+火焰散射暖光（光源层），体积光穿透烟尘+碎片逆光透亮+金属战损高光（光行为层），暗金暖底调+冰蓝高光冷暖对撞（色调层）';
  
  // 角色差异化检查
  let roleDiffNote = '';
  if (shot.characters && shot.characters.length >= 2) {
    roleDiffNote = `\n角色差异化：两个角色物种/类型不同，各有≥3个外貌锚点，体型比例差异明显，标志性元素不重叠。`;
  }
  
  // 时间切片
  let timeSlices = '';
  const duration = shot.durationSec || 5;
  if (duration <= 5) {
    timeSlices = `${shot.description}，${shot.movement}。结尾${shot.handoff || '画面趋于静止'}。`;
  } else {
    const mid = Math.floor(duration / 2);
    timeSlices = `0-${mid}秒：${shot.description}，${shot.movement}。\n${mid}-${duration}秒：动作收束，${shot.handoff || '画面趋于静止'}。`;
  }
  
  // 参考图引用
  let refLines = '';
  if (shot.charAssets && shot.charAssets.length > 0) {
    refLines = shot.charAssets.map((refId, i) => {
      const char = assets.characters.find(c => c.id === refId);
      return `@图片${i+1}：${char ? char.name : refId}角色外貌锚定`;
    }).join('\n');
    if (refLines) refLines = '\n' + refLines + '\n';
  }
  
  return `统一风格总纲：${styleManifesto}。${roleDiffNote}${refLines}
${timeSlices}
光影：统一光影三层（${lightingThreeLayer}）
音效：${getSFX(shot.type)}
禁止：任何文字、字幕、LOGO或水印`;
}

function buildReferences(shot, assets) {
  const refs = [];
  
  // 添加角色参考图
  if (shot.charAssets) {
    shot.charAssets.forEach(refId => {
      const char = assets.characters.find(c => c.id === refId);
      if (char) {
        refs.push({
          type: 'character',
          id: refId,
          name: char.name,
          path: `03-characters/${refId}-${char.name}/`
        });
      }
    });
  }
  
  // 添加场景参考图
  if (shot.sceneAsset) {
    const scene = assets.scenes.find(s => s.id === shot.sceneAsset);
    if (scene) {
      refs.push({
        type: 'scene',
        id: shot.sceneAsset,
        name: scene.name,
        path: `03-scenes/${shot.sceneAsset}-${scene.name}/`
      });
    }
  }
  
  return refs;
}

function getSFX(type) {
  const sfxMap = {
    '建置': '环境氛围音渐强',
    '触发': '巨响+冲击波轰鸣',
    '反应': '呼吸声+心跳加速',
    '准备': '能量聚集嗡鸣',
    '升级': '动作音逐渐加强',
    '对抗': '金属碰撞+能量爆裂',
    '转折': '意外音效+局势变化',
    '逼近': '紧张节奏加快',
    '高潮前': '蓄力音效+静默前的紧张',
    '终极': '终极对撞爆炸声',
    '爆发': '能量爆发轰鸣',
    '结果': '尘埃落定声',
    '收束': '音效渐弱至静默',
    '定格': '最后一声音效定格'
  };
  return sfxMap[type] || '环境音+动作拟声';
}

// ============ Step 5: 拍摄排期 ============
function generateSchedule(shots, assets) {
  log('Schedule', '生成拍摄排期...');
  
  // 按场景分组
  const sceneGroups = {};
  shots.forEach(shot => {
    const sceneId = shot.sceneAsset || 'default';
    if (!sceneGroups[sceneId]) {
      sceneGroups[sceneId] = [];
    }
    sceneGroups[sceneId].push(shot);
  });
  
  // 按角色分组
  const charGroups = {};
  shots.forEach(shot => {
    if (shot.charAssets) {
      shot.charAssets.forEach(charId => {
        if (!charGroups[charId]) {
          charGroups[charId] = [];
        }
        charGroups[charId].push(shot);
      });
    }
  });
  
  // 生成排期建议
  const schedule = {
    principle: '同场景集中拍摄，减少切换成本',
    sceneOrder: Object.keys(sceneGroups).map(id => {
      const scene = assets.scenes.find(s => s.id === id);
      return {
        sceneId: id,
        sceneName: scene ? scene.name : id,
        shotCount: sceneGroups[id].length,
        shots: sceneGroups[id].map(s => s.id)
      };
    }),
    characterOrder: Object.keys(charGroups).map(id => {
      const char = assets.characters.find(c => c.id === id);
      return {
        charId: id,
        charName: char ? char.name : id,
        shotCount: charGroups[id].length,
        shots: charGroups[id].map(s => s.id)
      };
    }),
    dependencies: shots.filter(s => s.transition && s.transition.includes('依赖')).map(s => ({
      shot: s.id,
      dependsOn: s.transition
    }))
  };
  
  log('Schedule', `排期完成: ${schedule.sceneOrder.length} 个场景组, ${schedule.characterOrder.length} 个角色组`);
  return schedule;
}

// ============ 文档生成 ============
function generateShotListMd(shots, plan, assets) {
  let md = `# ${plan.title} — 分镜表\n\n`;
  md += `**总时长**: ${plan.totalDuration}秒 | **镜头数**: ${shots.length} | **幕数**: ${plan.segments || 4}\n\n`;
  md += `**风格总纲**: ${plan.styleManifesto || '未指定'}\n\n`;
  md += `**光影三层**: ${plan.lightingThreeLayer || '未指定'}\n\n`;
  md += `---\n\n`;
  
  let currentAct = '';
  
  shots.forEach(shot => {
    if (shot.act !== currentAct) {
      currentAct = shot.act;
      md += `## 第${shot.actIndex}幕：${currentAct}\n\n`;
    }
    
    md += `### ${shot.id}（${shot.timeRange || shot.timecode}，${shot.durationSec}秒）\n\n`;
    md += `- **景别**: ${shot.shotSize}\n`;
    md += `- **角度**: ${shot.angle}\n`;
    md += `- **运动**: ${shot.movement}\n`;
    md += `- **类型**: ${shot.type}\n`;
    md += `- **角色**: ${shot.characters ? shot.characters.join(', ') : '无'}\n`;
    md += `- **角色资产**: ${shot.charAssets ? shot.charAssets.join(', ') : '无'}\n`;
    md += `- **场景资产**: ${shot.sceneAsset || '无'}\n`;
    md += `- **情绪**: ${shot.emotionStart || '无'} → ${shot.emotionEnd || '无'}\n`;
    md += `- **张力**: ${shot.tension || 0}/100\n`;
    md += `- **转场**: ${shot.transition}\n`;
    md += `- **交接帧**: ${shot.handoff || '画面趋于静止'}\n\n`;
  });
  
  return md;
}

function generateAssetsMd(assets, plan) {
  let md = `# ${plan.title} — 资产清单\n\n`;
  
  md += `## 角色资产（C01-C99）\n\n`;
  assets.characters.forEach(char => {
    md += `### ${char.id} — ${char.name}\n\n`;
    md += `- **物种**: ${char.species}\n`;
    md += `- **特征**: ${char.features.join('，')}\n`;
    md += `- **标志性元素**: ${char.signature}\n`;
    md += `- **描述**: ${char.description}\n`;
    md += `- **参考图路径**: 03-characters/${char.id}-${char.name}/\n\n`;
  });
  
  md += `## 场景资产（S01-S99）\n\n`;
  assets.scenes.forEach(scene => {
    md += `### ${scene.id} — ${scene.name}\n\n`;
    md += `- **描述**: ${scene.description}\n`;
    md += `- **参考图路径**: 03-scenes/${scene.id}-${scene.name}/\n\n`;
  });
  
  md += `## 道具资产（P01-P99）\n\n`;
  assets.props.forEach(prop => {
    md += `### ${prop.id} — ${prop.name}\n\n`;
    md += `- **所属角色**: ${prop.owner}\n`;
    md += `- **描述**: ${prop.description}\n\n`;
  });
  
  return md;
}

function generateScheduleMd(schedule, assets) {
  let md = `# 拍摄排期\n\n`;
  md += `**拍摄原则**: ${schedule.principle}\n\n`;
  
  md += `## 场景拍摄顺序\n\n`;
  md += `| 顺序 | 场景 | 镜头数 | 包含镜头 |\n`;
  md += `|------|------|--------|----------|\n`;
  schedule.sceneOrder.forEach((scene, i) => {
    md += `| ${i+1} | ${scene.sceneName} | ${scene.shotCount} | ${scene.shots.join(', ')} |\n`;
  });
  
  md += `\n## 角色拍摄顺序\n\n`;
  md += `| 顺序 | 角色 | 镜头数 | 包含镜头 |\n`;
  md += `|------|------|--------|----------|\n`;
  schedule.characterOrder.forEach((char, i) => {
    md += `| ${i+1} | ${char.charName} | ${char.shotCount} | ${char.shots.join(', ')} |\n`;
  });
  
  if (schedule.dependencies.length > 0) {
    md += `\n## 镜头依赖关系\n\n`;
    schedule.dependencies.forEach(dep => {
      md += `- ${dep.shot} → 依赖: ${dep.dependsOn}\n`;
    });
  }
  
  return md;
}

// ============ 主流程 ============
async function generate(args) {
  const startTime = Date.now();
  
  const storyPlanPath = args.storyPlan;
  const outputDir = args.outputDir;
  
  if (!storyPlanPath || !outputDir) {
    console.error('❌ 缺少必要参数: --story-plan, --output-dir');
    process.exit(1);
  }
  
  log('Main', `🎬 Storyboard Generator v2.0-Peng 启动`);
  log('Main', `输入: ${storyPlanPath}`);
  log('Main', `输出: ${outputDir}`);
  
  ensureDir(outputDir);
  
  try {
    // Step 1: 解析story-plan
    const plan = parseStoryPlan(storyPlanPath);
    
    // Step 2: 资产清点
    const assets = catalogAssets(plan);
    
    // Step 3: 镜头拆解
    const shots = designShots(plan, assets);
    
    // Step 4: 生成提示词
    const prompts = generatePrompts(shots, plan, assets);
    
    // Step 5: 拍摄排期
    const schedule = generateSchedule(shots, assets);
    
    // 生成文档
    const shotListMd = generateShotListMd(shots, plan, assets);
    const assetsMd = generateAssetsMd(assets, plan);
    const scheduleMd = generateScheduleMd(schedule, assets);
    
    // 保存文档
    fs.writeFileSync(path.join(outputDir, '02-shot-list.md'), shotListMd);
    fs.writeFileSync(path.join(outputDir, '02-assets.md'), assetsMd);
    fs.writeFileSync(path.join(outputDir, 'shot-schedule.md'), scheduleMd);
    
    // 保存提示词
    const promptsDir = path.join(outputDir, '04-prompts');
    ensureDir(promptsDir);
    prompts.forEach(({ shotId, prompt }) => {
      fs.writeFileSync(path.join(promptsDir, `${shotId}.md`), prompt);
    });
    
    // 保存元数据
    const metadata = {
      status: 'completed',
      totalShots: shots.length,
      assets: {
        characters: assets.characters.length,
        scenes: assets.scenes.length,
        props: assets.props.length
      },
      shotListPath: path.join(outputDir, '02-shot-list.md'),
      assetsPath: path.join(outputDir, '02-assets.md'),
      promptsDir,
      schedulePath: path.join(outputDir, 'shot-schedule.md'),
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(outputDir, '02-storyboard-meta.json'), JSON.stringify(metadata, null, 2));
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    log('Main', `✅ 分镜生成完成！耗时: ${duration}秒`);
    log('Main', `📁 分镜表: ${path.join(outputDir, '02-shot-list.md')}`);
    log('Main', `📁 资产清单: ${path.join(outputDir, '02-assets.md')}`);
    log('Main', `📁 提示词: ${promptsDir}`);
    log('Main', `📁 拍摄排期: ${path.join(outputDir, 'shot-schedule.md')}`);
    
    return metadata;
  } catch (e) {
    log('Main', `❌ 分镜生成失败: ${e.message}`, 'error');
    console.error(e.stack);
    process.exit(1);
  }
}

// ============ CLI ============
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

async function main() {
  const command = process.argv[2];
  const args = parseArgs();
  
  switch (command) {
    case 'generate':
      await generate(args);
      break;
    case 'help':
    default:
      console.log(`
Seedance Storyboard Generator v2.0-Peng

用法:
  node storyboard-generator.js generate --story-plan <path> --output-dir <dir>

命令:
  generate    生成分镜表
  help        显示帮助

选项:
  --story-plan    story-plan.json路径（必须）
  --output-dir    输出目录（必须）
  --series-mode   系列模式（多集规划）
  --episodes      集数（默认20）
      `);
  }
}

main().catch(e => {
  console.error(`❌ 致命错误: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
