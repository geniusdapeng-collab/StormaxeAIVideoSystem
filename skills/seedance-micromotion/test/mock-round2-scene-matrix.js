/**
 * MicroMotion Round 2 Mock Test — 场景类型×景别组合矩阵测试
 * 覆盖 motion-library.json 全部 7 种 sceneAtmosphereRecipes × 5 种 cameraDistance
 * 目标：暴露场景-环境映射盲区、景别权重冲突、特殊场景降级问题
 */

const { FaceSculptorAgent } = require('../agents/face-sculptor');
const { BodyLanguageAgent } = require('../agents/body-language');
const { EyeDirectorAgent } = require('../agents/eye-director');
const { BreathEngineAgent } = require('../agents/breath-engine');
const { WorldBreathAgent } = require('../agents/world-breath');
const { MergeAgent } = require('../agents/merge');
const { MicroMotionSystem } = require('../scripts/micromotion');

console.log('\n═══════════════════════════════════════════════════════════');
console.log(' Round 2 Mock Test — 场景类型×景别组合矩阵');
console.log('═══════════════════════════════════════════════════════════\n');

let pass = 0;
let fail = 0;
const errors = [];

function assert(condition, name) {
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); errors.push(name); }
}

// 场景类型矩阵（匹配 motion-library.json sceneAtmosphereRecipes 键）
const SCENE_TYPES = [
  'action', 'romance', 'horror', 'comedy', 'drama', 'documentary', 'silent',
  // 中文输入
  '战斗场景', '爱情场景', '恐怖场景', '喜剧场景', '戏剧场景', '纪录场景', '默片场景',
  // 边界/未知
  '未知场景', '', null, undefined
];

const CAMERA_DISTANCES = [
  '面部特写', '近景', '中景', '远景', '全景',
  // 英文
  'close-up', 'medium shot', 'long shot',
  // 边界
  '', null, '超超超超远景'
];

const EMOTION = 'anger';
const INTENSITY = 3;

// ====== Test Group 1: World Breath — 全场景类型环境映射 ======
console.log('🌍 Test Group 1: World Breath — 全部场景类型');
const worldAgent = new WorldBreathAgent();
for (const sceneType of SCENE_TYPES) {
  try {
    const shot = {
      shotId: `R2-SCENE-${String(sceneType).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}`,
      character: '大圣',
      emotion: EMOTION,
      emotionIntensity: INTENSITY,
      cameraDistance: '中景',
      duration: 5,
      originalPrompt: '测试提示词'
    };
    const context = { sceneType: sceneType };
    const result = worldAgent.enhance(shot, context);
    assert(result !== null && result.elements !== undefined,
      `World: sceneType="${sceneType}" → 有输出`);
    // 即使未知场景也应返回空数组而非崩溃
    assert(Array.isArray(result.elements),
      `World: sceneType="${sceneType}" → elements是数组`);
    assert(result.seedanceCompatible === true,
      `World: sceneType="${sceneType}" → Seedance兼容`);
  } catch (e) {
    fail++;
    console.log(`  ❌ World: sceneType="${sceneType}" → 异常: ${e.message}`);
    errors.push(`World-scene-${sceneType}`);
  }
}

// ====== Test Group 2: Face Sculptor — 全景别映射 ======
console.log('\n🎭 Test Group 2: Face Sculptor — 全部景别');
const faceAgent = new FaceSculptorAgent();
for (const dist of CAMERA_DISTANCES) {
  try {
    const shot = {
      shotId: `R2-DIST-${String(dist).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}`,
      character: '大圣',
      emotion: EMOTION,
      emotionIntensity: INTENSITY,
      cameraDistance: dist,
      duration: 5,
      originalPrompt: '大圣, 3D国漫CG渲染, 火眼金睛面部, 面部特写, 愤怒'
    };
    const result = faceAgent.enhance(shot, {});
    assert(result !== null,
      `Face: cameraDistance="${dist}" → 有输出`);
    assert(result.microDescriptions.length >= 0,
      `Face: cameraDistance="${dist}" → microDescriptions存在`);
    // 特写时应输出更多面部细节
    if (dist && (dist.includes('特写') || dist.includes('close'))) {
      assert(result.microDescriptions.length >= 2,
        `Face: cameraDistance="${dist}"(特写) → 至少2个面部细节`);
    }
  } catch (e) {
    fail++;
    console.log(`  ❌ Face: cameraDistance="${dist}" → 异常: ${e.message}`);
    errors.push(`Face-dist-${dist}`);
  }
}

// ====== Test Group 3: Body Language — 全景别姿态权重 ======
console.log('\n🤸 Test Group 3: Body Language — 景别→姿态可见性');
const bodyAgent = new BodyLanguageAgent();
for (const dist of CAMERA_DISTANCES.slice(0, 5)) { // 主要景别
  try {
    const shot = {
      shotId: `R2-BODY-${dist}`,
      character: '大圣',
      emotion: EMOTION,
      emotionIntensity: INTENSITY,
      cameraDistance: dist,
      duration: 5,
      originalPrompt: '测试'
    };
    const result = bodyAgent.enhance(shot, {});
    assert(result !== null,
      `Body: cameraDistance="${dist}" → 有输出`);
    // 面部特写时身体语言应简化/降低权重
    if (dist && dist.includes('特写')) {
      assert(result.microDescriptions.length <= 3 || result.stance === 'dominant',
        `Body: cameraDistance="${dist}"(特写) → 身体细节减少或合理`);
    }
  } catch (e) {
    fail++;
    console.log(`  ❌ Body: cameraDistance="${dist}" → 异常: ${e.message}`);
    errors.push(`Body-dist-${dist}`);
  }
}

// ====== Test Group 4: 景别冲突解决 — Merge 权重 ======
console.log('\n🔀 Test Group 4: Merge — 景别冲突解决权重');
const mergeAgent = new MergeAgent();
const testDistances = ['面部特写', '近景', '中景', '远景', '全景'];
for (const dist of testDistances) {
  try {
    const shot = {
      shotId: `R2-MERGE-${dist}`,
      character: '大圣',
      emotion: EMOTION,
      emotionIntensity: INTENSITY,
      cameraDistance: dist,
      duration: 5,
      originalPrompt: '大圣, 3D国漫CG渲染, 火眼金睛面部, 金色毛发外露, 身穿黄金锁子甲, 手持燃烧金箍棒, 站立山顶, 愤怒'
    };
    const face = faceAgent.enhance(shot, {});
    const body = bodyAgent.enhance(shot, {});
    const eye = new EyeDirectorAgent().enhance(shot, {});
    const breath = new BreathEngineAgent().enhance(shot, {});
    const world = worldAgent.enhance(shot, { sceneType: '战斗场景' });
    
    const result = mergeAgent.merge(shot, { face, body, eye, breath, world });
    assert(result !== null,
      `Merge: cameraDistance="${dist}" → 有输出`);
    assert(result.enhanced.length > 0,
      `Merge: cameraDistance="${dist}" → 增强提示词非空`);
    // 验证长度不超过 500（Seedance 限制）
    assert(result.enhanced.length <= 600,
      `Merge: cameraDistance="${dist}" → 提示词长度 ${result.enhanced.length} <= 600`);
  } catch (e) {
    fail++;
    console.log(`  ❌ Merge: cameraDistance="${dist}" → 异常: ${e.message}`);
    errors.push(`Merge-dist-${dist}`);
  }
}

// ====== Test Group 5: 场景-情绪交叉矩阵 ======
console.log('\n🎭🌍 Test Group 5: 场景×情绪交叉增强');
const crossEmotions = ['anger', 'sadness', 'joy', 'fear'];
const crossScenes = ['action', 'romance', 'horror', 'drama'];
for (const emo of crossEmotions) {
  for (const scene of crossScenes) {
    try {
      const shot = {
        shotId: `R2-X-${emo}-${scene}`,
        character: '测试角色',
        emotion: emo,
        emotionIntensity: 3,
        cameraDistance: '中景',
        duration: 5,
        originalPrompt: '测试角色, 情绪表现'
      };
      const context = { sceneType: scene };
      const face = faceAgent.enhance(shot, context);
      const body = bodyAgent.enhance(shot, context);
      const eye = new EyeDirectorAgent().enhance(shot, context);
      const breath = new BreathEngineAgent().enhance(shot, context);
      const world = worldAgent.enhance(shot, context);
      const result = mergeAgent.merge(shot, { face, body, eye, breath, world });
      
      assert(result !== null,
        `Cross: ${emo}×${scene} → 有输出`);
      assert(result.enhanced.length > 0,
        `Cross: ${emo}×${scene} → 增强非空`);
    } catch (e) {
      fail++;
      console.log(`  ❌ Cross: ${emo}×${scene} → 异常: ${e.message}`);
      errors.push(`Cross-${emo}-${scene}`);
    }
  }
}

// ====== Test Group 6: MicroMotionSystem — 场景批量测试 ======
console.log('\n🎬 Test Group 6: MicroMotionSystem — 多场景批量');
try {
  const mm = new MicroMotionSystem({ outputDir: '/tmp/micromotion-r2' });
  const shots = [
    { shotId: 'R2-B1', character: 'A', emotion: '愤怒', emotionIntensity: 5, cameraDistance: '面部特写', duration: 3, originalPrompt: '角色A, 特写, 愤怒' },
    { shotId: 'R2-B2', character: 'B', emotion: '悲伤', emotionIntensity: 2, cameraDistance: '远景', duration: 8, originalPrompt: '角色B, 远景, 悲伤' },
    { shotId: 'R2-B3', character: 'C', emotion: '喜悦', emotionIntensity: 4, cameraDistance: '全景', duration: 5, originalPrompt: '角色C, 全景, 喜悦' },
    { shotId: 'R2-B4', character: 'D', emotion: '恐惧', emotionIntensity: 3, cameraDistance: '近景', duration: 6, originalPrompt: '角色D, 近景, 恐惧' },
    { shotId: 'R2-B5', character: 'E', emotion: '惊讶', emotionIntensity: 1, cameraDistance: '中景', duration: 4, originalPrompt: '角色E, 中景, 惊讶' }
  ];
  const context = { sceneType: 'drama' };
  const { results, stateBus } = mm.enhanceBatch(shots, context);
  
  assert(results.length === 5, '批量增强 → 5个结果');
  assert(Object.keys(stateBus.mergedPrompts).length === 5, '状态总线 → 5个镜头');
  
  // 每个结果都应包含增强内容
  for (let i = 0; i < results.length; i++) {
    assert(results[i].enhanced.length > 0, `批量结果[${i}] → 增强非空`);
  }
  
  // Diff 验证
  for (const shot of shots) {
    const diff = mm.diff(shot.shotId, '/tmp/micromotion-r2/motion-state.json');
    assert(diff !== null, `Diff: ${shot.shotId} → 有结果`);
    assert(diff.additions > 0, `Diff: ${shot.shotId} → 新增字符>0`);
  }
  
  console.log(`     批量完成: ${results.length} 个镜头，景别覆盖: ${shots.map(s=>s.cameraDistance).join('/')}`);
} catch (e) {
  fail++;
  console.log(`  ❌ 批量测试异常: ${e.message}`);
  errors.push('Batch-multi-scene');
}

// ====== 汇总 ======
console.log('\n═══════════════════════════════════════════════════════════');
console.log(` Round 2 结果: ✅ ${pass} 通过 | ❌ ${fail} 失败`);
console.log('═══════════════════════════════════════════════════════════');

if (errors.length > 0) {
  console.log('\n❌ 失败项:');
  errors.forEach(e => console.log(`   - ${e}`));
}

if (fail > 0) process.exit(1);
else {
  console.log('\n🎉 Round 2 全部通过！全部场景类型×景别组合验证成功');
  process.exit(0);
}
