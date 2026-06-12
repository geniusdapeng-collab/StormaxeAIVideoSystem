#!/usr/bin/env node
/**
 * 🔥 PromptForge Orchestrator v2.1-Peng — 完整链路编排器
 * 
 * 架构：Story Plan → Writer v2.1 (完整叙事) → DP v2.1 (完整运镜) → Compressor (智能压缩) → 最终提示词
 * 串行执行，每个镜头独立处理，镜头间休眠3秒
 */

const fs = require('fs');
const path = require('path');

const PromptForgeWriter = require('./promptforge-writer');
const PromptForgeDP = require('./promptforge-dp');
const LLMCompressor = require('./llm-compressor');

class PromptForgeOrchestratorV21 {
  constructor() {
    this.writer = new PromptForgeWriter();
    this.dp = new PromptForgeDP();
    this.compressor = new LLMCompressor();
    this.version = 'v2.1-Peng';
  }

  /**
   * 处理完整故事计划
   * @param {Object} storyPlan - 故事计划
   * @returns {Promise<Array>} - 所有镜头的最终提示词
   */
  async processStoryPlan(storyPlan) {
    const allShots = [];
    for (const segment of storyPlan.segments || []) {
      allShots.push(...(segment.shots || []));
    }

    console.log(`\n🔥 PromptForge Orchestrator v2.1 — 处理 ${allShots.length} 个镜头\n`);

    const results = [];
    for (let i = 0; i < allShots.length; i++) {
      const shot = allShots[i];
      console.log(`\n📽️  处理镜头 ${shot.id} (${i + 1}/${allShots.length})`);
      
      const result = await this.processShot(shot, storyPlan);
      results.push(result);

      // 镜头间休眠3秒
      if (i < allShots.length - 1) {
        console.log('⏱️  休眠 3 秒...');
        await this._sleep(3000);
      }
    }

    console.log(`\n✅ 全部完成！处理了 ${results.length} 个镜头`);
    return results;
  }

  /**
   * 处理单个镜头（带片头系统整合）
   * @param {Object} shot - 镜头数据
   * @param {Object} storyPlan - 故事计划
   * @returns {Promise<Object>} - 最终提示词和元数据
   */
  async processShot(shot, storyPlan) {
    const startTime = Date.now();

    // 如果是 S00（片头镜头），先调用片头系统
    if (shot.id === 'S00' && shot._titleConfig) {
      console.log('  🎬 调用片头系统生成标题配置...');
      const titleContent = this._generateTitleContent(shot, storyPlan);
      shot._titleGeneratedContent = titleContent;
      console.log(`     ✅ 片头内容: ${titleContent.length} 字`);
    }

    // Step 1: Writer 生成完整叙事
    console.log('  📝 Writer v2.1 生成叙事...');
    const writerResult = await this.writer.generateFullNarrative(shot, storyPlan);
    console.log(`     ✅ 叙事: ${writerResult.coreNarrative.length} 字 | 台词: ${writerResult.dialogue ? '✓' : '✗'}`);

    // Step 2: DP 生成完整运镜
    console.log('  🎬 DP v2.1 生成运镜...');
    const dpResult = await this.dp.generateFullCinematography(shot, writerResult, storyPlan);
    console.log(`     ✅ 运镜: ${dpResult.camera.length} 字 | 光影: ${dpResult.lighting.length} 字`);

    // Step 3: Compressor 智能压缩
    console.log('  🗜️  Compressor 压缩...');
    const finalPrompt = await this.compressor.compress({
      coreNarrative: writerResult.coreNarrative,
      camera: dpResult.camera,
      lighting: dpResult.lighting,
      material: dpResult.material,
      dialogue: writerResult.dialogue,
      characters: this._buildCharacterDefs(shot.characters),
      negativePrompt: 'NO dark scene NO pitch black NO total darkness, bright vivid colors',
      shotId: shot.id,
      duration: shot.duration || 8,
      emotion: shot.emotion
    });
    console.log(`     ✅ 最终: ${finalPrompt.length} 字 / 990`);

    const duration = Date.now() - startTime;
    console.log(`  ⏱️  耗时: ${(duration / 1000).toFixed(1)} 秒`);

    return {
      shotId: shot.id,
      finalPrompt,
      length: finalPrompt.length,
      writerResult,
      dpResult,
      duration: duration / 1000,
      version: this.version
    };
  }

  _buildCharacterDefs(characters) {
    if (!Array.isArray(characters)) return [];
    
    const defs = [];
    if (characters.includes('小G')) defs.push('小G(yellow jacket,child)');
    if (characters.includes('刑天')) defs.push('刑天(headless,breast-eyes,navel-mouth)');
    return defs;
  }

  /**
   * 生成片头内容（整合 opening-title-designer.js）
   */
  _generateTitleContent(shot, storyPlan) {
    const titleConfig = shot._titleConfig || {};
    const title = titleConfig.title || storyPlan.title || '刑天：不灭的战魂';
    const subtitle = titleConfig.subtitle || 'by Genius';
    
    // 使用片头系统的模板数据
    const titleEffect = titleConfig.titleEffect?.titleEffect || {};
    const subtitleEffect = titleConfig.subtitleEffect || {};
    const beastEntrance = titleConfig.beastEntrance || {};
    const xiaoGEntrance = titleConfig.xiaoGEntrance || {};
    
    let content = '';
    
    // 1. 标题显示
    if (titleEffect.promptEnhancement) {
      content += titleEffect.promptEnhancement + ' ';
    }
    
    // 2. 副标题显示
    if (subtitleEffect.promptEnhancement) {
      content += subtitleEffect.promptEnhancement + ' ';
    }
    
    // 3. 神兽出场
    if (beastEntrance.promptEnhancement) {
      content += beastEntrance.promptEnhancement + ' ';
    }
    
    // 4. 小G出场
    if (xiaoGEntrance.promptEnhancement) {
      content += xiaoGEntrance.promptEnhancement + ' ';
    }
    
    return content.trim();
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 写入 story-plan.json
   * @param {Array} results - 处理结果
   * @param {string} storyPlanPath - story-plan.json 路径
   */
  writeResultsToStoryPlan(results, storyPlanPath) {
    const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));

    for (const result of results) {
      const shotId = result.shotId;
      
      for (const segment of storyPlan.segments || []) {
        for (const shot of segment.shots || []) {
          if (shot.id === shotId) {
            shot._promptForgeV21Prompt = result.finalPrompt;
            shot._promptForgeV21CoreNarrative = result.writerResult.coreNarrative;
            shot._promptForgeV21Dialogue = result.writerResult.dialogue;
            shot._promptForgeV21Camera = result.dpResult.camera;
            shot._promptForgeV21Lighting = result.dpResult.lighting;
            shot._promptForgeV21Material = result.dpResult.material;
            shot._promptForgeV21Version = this.version;
          }
        }
      }
    }

    fs.writeFileSync(storyPlanPath, JSON.stringify(storyPlan, null, 2), 'utf8');
    console.log(`\n📝 已写入 story-plan.json: ${storyPlanPath}`);
  }

  /**
   * 生成最终提示词文件
   * @param {Array} results - 处理结果
   * @param {string} outputDir - 输出目录
   */
  generatePromptFiles(results, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });

    for (const result of results) {
      const fileContent = `# ${result.shotId} Prompt

**📝 字数**: ${result.length} / 990 (${(result.length / 990 * 100).toFixed(0)}%)

**⏱️ 生成耗时**: ${result.duration.toFixed(1)} 秒

\`\`\`
${result.finalPrompt}
\`\`\`

---

**核心叙事** (Writer v2.1):
\`\`\`
${result.writerResult.coreNarrative.substring(0, 300)}...
\`\`\`

**运镜** (DP v2.1):
\`\`\`
${result.dpResult.camera}
\`\`\`
`;

      const filePath = path.join(outputDir, `${result.shotId}-prompt-v21.md`);
      fs.writeFileSync(filePath, fileContent, 'utf8');
    }

    console.log(`📝 已生成提示词文件: ${outputDir}`);
  }
}

module.exports = PromptForgeOrchestratorV21;

// CLI 入口
if (require.main === module) {
  const orchestrator = new PromptForgeOrchestratorV21();
  
  const productionDir = process.argv[2] || '/root/.openclaw/workspace/productions/xingtian';
  const storyPlanPath = path.join(productionDir, '01-story/story-plan.json');
  const outputDir = path.join(productionDir, '04-prompts');

  const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));

  orchestrator.processStoryPlan(storyPlan).then(results => {
    orchestrator.writeResultsToStoryPlan(results, storyPlanPath);
    orchestrator.generatePromptFiles(results, outputDir);

    // 生成报告
    const avg = Math.round(results.reduce((a, b) => a + b.length, 0) / results.length);
    console.log(`\n📊 最终报告:`);
    console.log(`   平均: ${avg} 字 / 990 (${(avg / 990 * 100).toFixed(0)}%)`);
    console.log(`   最大: ${Math.max(...results.map(r => r.length))} 字`);
    console.log(`   最小: ${Math.min(...results.map(r => r.length))} 字`);
    console.log(`   总耗时: ${results.reduce((a, b) => a + b.duration, 0).toFixed(1)} 秒`);
  }).catch(err => {
    console.error('❌ 执行失败:', err);
    process.exit(1);
  });
}