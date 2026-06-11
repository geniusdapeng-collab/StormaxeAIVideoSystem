/**
 * 异兽定妆照通用渲染适配器 v1.0-Peng
 * 
 * 集成：beast-body-part-system.js → seedream-wrapper.js
 * 
 * 功能：
 * 1. 接收任意异兽（已有/新增/自创）
 * 2. 自动生成部位表
 * 3. 生成8角度分镜Prompt
 * 4. 调用Seedance API渲染
 * 5. 返回定妆照URL列表
 * 
 * 使用方式：
 * ```javascript
 * const adapter = require('./beast-rendering-adapter.js');
 * 
 * // 已有异兽
 * const urls = await adapter.renderBeast({
 *   mode: 'archive',
 *   beastId: 'baize',
 *   outputDir: './productions/baize-preproduction/03-characters/白泽'
 * });
 * 
 * // 新增异兽（文本描述）
 * const urls = await adapter.renderBeast({
 *   mode: 'text',
 *   name: '雷霆兽',
 *   description: '形如巨狮，背生双翼...',
 *   outputDir: './productions/thunder/03-characters/雷霆兽'
 * });
 * 
 * // 自创异兽（完全自定义）
 * const urls = await adapter.renderBeast({
 *   mode: 'custom',
 *   name: '晶龙',
 *   bodyParts: { body: {...}, head: {...} },
 *   outputDir: './productions/crystal/03-characters/晶龙'
 * });
 * ```
 */

const fs = require('fs');
const path = require('path');
const { BeastBodyPartSystem, BeastProfile } = require('./beast-body-part-system.js');

class BeastRenderingAdapter {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.SEEDREAM_API_KEY;
    this.apiEndpoint = options.apiEndpoint || '/api/v3/images/generations';
    this.system = new BeastBodyPartSystem({ archiveDir: options.archiveDir });
    
    // 8个标准角度
    this.angles = [
      { id: 'front_fullbody', name: '正面全身', priority: ['body', 'head', 'face', 'coat', 'forelimbs', 'hindlimbs'] },
      { id: 'side_profile', name: '侧面全身', priority: ['body', 'head', 'neck', 'tail', 'coat'] },
      { id: 'back_fullbody', name: '背面全身', priority: ['body', 'spine', 'tail', 'coat', 'hindlimbs'] },
      { id: 'three_quarter', name: '45度半身', priority: ['head', 'body', 'forelimbs', 'coat'] },
      { id: 'face_closeup', name: '面部特写', priority: ['face', 'eyes', 'horns', 'ears', 'mouth'] },
      { id: 'action_running', name: '动作奔跑', priority: ['forelimbs', 'hindlimbs', 'body', 'tail'] },
      { id: 'action_sitting', name: '动作坐姿', priority: ['body', 'forelimbs', 'hindlimbs', 'tail', 'coat'] },
      { id: 'hand_detail', name: '手部特写', priority: ['hands', 'feet', 'forelimbs', 'hindlimbs'] }
    ];
  }

  /**
   * 主入口：渲染任意异兽的8张定妆照
   * @param {Object} config - 渲染配置
   * @returns {Array<string>} 8张图片URL
   */
  async renderBeast(config) {
    const { mode, outputDir } = config;
    
    // Step 1: 获取或创建部位表
    let profile;
    if (mode === 'archive') {
      profile = this.system.loadFromArchive(config.beastId);
    } else if (mode === 'text') {
      profile = this.system.parseFromText({
        name: config.name,
        description: config.description,
        origin: config.origin
      });
    } else if (mode === 'custom') {
      profile = this.system.createCustom({
        name: config.name,
        parts: config.bodyParts,
        extension: config.extension,
        aura: config.aura
      });
    } else {
      throw new Error(`不支持的模式: ${mode}`);
    }
    
    // Step 2: 生成8角度Prompt
    const prompts = this._generateAllPrompts(profile);
    
    // Step 3: 渲染
    const urls = await this._renderAll(prompts, outputDir, profile.name);
    
    return { profile, prompts, urls };
  }

  /**
   * 仅生成Prompt（不渲染，用于预生产审核）
   * @param {Object} config 
   * @returns {Object} { profile, prompts }
   */
  generatePromptsOnly(config) {
    const { mode } = config;
    
    let profile;
    if (mode === 'archive') {
      profile = this.system.loadFromArchive(config.beastId);
    } else if (mode === 'text') {
      profile = this.system.parseFromText({
        name: config.name,
        description: config.description,
        origin: config.origin
      });
    } else if (mode === 'custom') {
      profile = this.system.createCustom({
        name: config.name,
        parts: config.bodyParts,
        extension: config.extension,
        aura: config.aura
      });
    }
    
    const prompts = this._generateAllPrompts(profile);
    return { profile, prompts };
  }

  /**
   * 生成8角度Prompt列表
   */
  _generateAllPrompts(profile) {
    return this.angles.map(angle => ({
      angleId: angle.id,
      angleName: angle.name,
      prompt: profile.generatePrompt({ 
        angle: angle.id,
        style: 'CG hyper-realistic, UE5, Octane render, 8K',
        includeAura: true 
      }),
      priority: angle.priority
    }));
  }

  /**
   * 批量渲染
   */
  async _renderAll(prompts, outputDir, beastName) {
    const urls = [];
    let referenceImageUrl = null;
    
    for (let i = 0; i < prompts.length; i++) {
      const { angleId, angleName, prompt } = prompts[i];
      
      try {
        // 第1张生成后作为参考图
        const imageUrl = await this._callSeedanceAPI({
          prompt,
          referenceImage: referenceImageUrl,
          outputPath: path.join(outputDir, `${beastName}-${angleName}.png`)
        });
        
        if (i === 0) referenceImageUrl = imageUrl;
        urls.push(imageUrl);
        
        console.log(`✅ ${angleName} 完成`);
      } catch (err) {
        console.error(`❌ ${angleName} 失败:`, err.message);
        urls.push(null);
      }
    }
    
    return urls;
  }

  /**
   * 调用Seedance API
   */
  async _callSeedanceAPI({ prompt, referenceImage, outputPath }) {
    // TODO: 集成实际的Seedance API调用
    // 这里返回模拟URL，实际使用时替换为真实API调用
    return `https://seedance.example.com/${Date.now()}.png`;
  }
}

// 导出
module.exports = { BeastRenderingAdapter };

// 测试
if (require.main === module) {
  const adapter = new BeastRenderingAdapter();
  
  console.log('=== 异兽定妆照通用渲染适配器 v1.0-Peng ===\n');
  
  // 测试模式1：已有异兽
  console.log('【模式1】已有异兽 - 白泽');
  const result1 = adapter.generatePromptsOnly({
    mode: 'archive',
    beastId: 'baize'
  });
  console.log(`✅ 生成 ${result1.prompts.length} 张Prompt`);
  console.log(`   第1张Prompt长度: ${result1.prompts[0].prompt.length}字符`);
  console.log(`   预览: ${result1.prompts[0].prompt.substring(0, 100)}...\n`);
  
  // 测试模式2：新增异兽
  console.log('【模式2】新增异兽 - 雷霆兽');
  const result2 = adapter.generatePromptsOnly({
    mode: 'text',
    name: '雷霆兽',
    description: '形如巨狮，背生双翼，额有独角，通体雷电缠绕，双目如闪电般耀眼，四足踏火，威风凛凛'
  });
  console.log(`✅ 生成 ${result2.prompts.length} 张Prompt`);
  console.log(`   第1张Prompt长度: ${result2.prompts[0].prompt.length}字符\n`);
  
  // 测试模式3：自创异兽
  console.log('【模式3】自创异兽 - 晶龙');
  const result3 = adapter.generatePromptsOnly({
    mode: 'custom',
    name: '晶龙',
    bodyParts: {
      body: { has: true, shape: 'draconic', material: '水晶构成', texture: '透明晶体', color: '冰蓝', light: '内部发光', detail: '10米长' },
      head: { has: true, type: 'draconic', material: '龙头', texture: '晶面', color: '透明', light: '眼发光', detail: '独角' },
      wings: { has: true, count: 2, type: 'crystalline', material: '冰晶翼', texture: '透明', color: '冰蓝', light: '折射光芒', detail: '膜翼如钻石' }
    },
    extension: {
      body_shape: 'draconic',
      head_type: 'draconic',
      limb_count: 4,
      wing_count: 2,
      coat_type: 'shell'
    },
    aura: {
      presence: '冰冷威严',
      power: '操控寒冰'
    }
  });
  console.log(`✅ 生成 ${result3.prompts.length} 张Prompt`);
  console.log(`   第1张Prompt长度: ${result3.prompts[3].prompt.length}字符`);
  console.log(`   第4张(45度)预览: ${result3.prompts[3].prompt.substring(0, 100)}...\n`);
  
  console.log('=== 测试完成 ===');
}