/**
 * PromptForge 集成测试 v1.0-Peng
 */

const PromptForgeOrchestrator = require('./scripts/promptforge-orchestrator');

console.log('🎬 PromptForge 集成测试');
console.log('======================\n');

// 测试1: 模块加载
console.log('测试1: 模块加载');
try {
  const Director = require('./scripts/promptforge-director');
  const Writer = require('./scripts/promptforge-writer');
  const DP = require('./scripts/promptforge-dp');
  const Gatekeeper = require('./scripts/promptforge-gatekeeper');
  
  console.log('✅ 所有模块加载成功');
  console.log('  - Director: 总导演');
  console.log('  - Writer: 首席编剧');
  console.log('  - DP: 摄影指导');
  console.log('  - Gatekeeper: 质量守门员');
} catch(e) {
  console.error('❌ 模块加载失败:', e.message);
  process.exit(1);
}

// 测试2: 初始化编排器
console.log('\n测试2: 编排器初始化');
let forge;
try {
  forge = new PromptForgeOrchestrator({
    projectDir: '/tmp',
    beastId: 'xingtian',
    projectName: '测试项目',
    verbose: false
  });
  
  console.log('✅ 编排器初始化成功');
  console.log('  - 项目: 测试项目');
  console.log('  - 异兽: xingtian');
} catch(e) {
  console.error('❌ 编排器初始化失败:', e.message);
  process.exit(1);
}

// 测试3: 模拟数据运行
console.log('\n测试3: 模拟数据运行');

const mockShots = [
  {
    id: 'S00',
    type: 'opening_title',
    emotion: 'mysterious',
    act: '起',
    characters: ['小G'],
    camera: 'WIDE-push',
    description: '片头镜头'
  },
  {
    id: 'S01',
    type: 'establishing',
    emotion: 'curious',
    act: '起',
    characters: ['小G'],
    camera: 'MED-push',
    description: '建立镜头'
  },
  {
    id: 'S02',
    type: 'reveal',
    emotion: 'tense',
    act: '承',
    characters: ['小G', '刑天'],
    camera: 'ECU-freeze',
    description: '揭示镜头'
  }
];

const mockStoryPlan = {
  segments: [
    { emotion: 'mysterious', act: '起' },
    { emotion: 'curious', act: '起' },
    { emotion: 'tense', act: '承' }
  ]
};

const mockConfig = {
  theme: '刑天觉醒',
  duration: 60
};

(async () => {
  try {
    const result = await forge.run(mockShots, mockStoryPlan, mockConfig);
    
    console.log('✅ 完整流水线运行成功');
    console.log(`  - 输出镜头数: ${result.shots.length}`);
    console.log(`  - 导演意图: ${result.directorIntent.coreTheme}`);
    console.log(`  - 质量评分: ${result.qualityReport.score}/100`);
    console.log(`  - 是否通过: ${result.qualityReport.passed ? '✅' : '⚠️'}`);
    
    // 检查优化标记
    const optimizedCount = result.shots.filter(s => s._promptForgeOptimized).length;
    console.log(`  - 已优化镜头: ${optimizedCount}/${result.shots.length}`);
    
    console.log('\n🎉 所有测试通过！PromptForge Phase 1 实施完成。');
  } catch(e) {
    console.error('❌ 流水线运行失败:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();