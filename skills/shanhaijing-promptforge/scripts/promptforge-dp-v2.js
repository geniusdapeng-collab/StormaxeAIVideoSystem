#!/usr/bin/env node
/**
 * 🔥 PromptForge 摄影指导 v2.0-Peng — LLM 驱动版
 * 
 * 升级：从硬编码模板 → 调用 LLM 生成独特运镜和光影
 * 策略：串行调用，逐个镜头生成，避免并发问题
 */

const fs = require('fs');
const path = require('path');

class PromptForgeDP {
  constructor(options = {}) {
    this.projectDir = options.projectDir || process.cwd();
    this.verbose = options.verbose !== false;
    this.llmOptions = options.llmOptions || { temperature: 0.6, maxTokens: 1024 };
  }

  /**
   * 🆕 v2.0: 调用 LLM 生成独特运镜
   */
  async designShot(shot, directorIntent, dialogueResult, storyPlan) {
    // 1. 构建 LLM 提示词
    const prompt = this._buildShotPrompt(shot, directorIntent, dialogueResult);
    
    // 2. 调用 LLM 生成
    console.log(`    [DP] 🧠 调用 LLM 生成运镜...`);
    const llmResult = await this._callLLM(prompt);
    
    // 3. 解析结果
    const shotDesign = this._parseLLMResult(llmResult, shot, directorIntent);
    
    console.log(`    [DP] ✅ 运镜生成: ${shotDesign.movement?.substring(0, 40)}...`);
    
    return shotDesign;
  }

  /**
   * 构建 LLM 提示词
   */
  _buildShotPrompt(shot, directorIntent, dialogueResult) {
    const style = directorIntent?.styleChoices?.[0]?.name || '维伦纽瓦';
    
    return `你是一位拥有20年经验的电影摄影指导（DP），擅长设计电影级镜头语言。
你的风格参考：${style}、罗杰·迪金斯、艾曼努尔·卢贝兹基。

【镜头信息】
- 镜头ID: ${shot.id}
- 类型: ${shot.type}
- 情绪: ${shot.emotion}
- 时长: ${shot.duration}秒
- 角色: ${(shot.characters || []).join(', ')}
- 原始描述: ${shot.description?.substring(0, 150) || 'N/A'}...

【导演意图】
- 核心主题: ${directorIntent?.coreTheme || '探索与传承'}
- 视觉基调: ${directorIntent?.visualTone || '史诗感与神秘并存'}
- 风格选择: ${style}

${dialogueResult?.finalText ? `【台词参考】
- 发言人: ${dialogueResult.speaker}
- 台词: "${dialogueResult.finalText}"
- 情绪: ${dialogueResult.emotion}` : ''}

【输出要求】
请为上述镜头设计完整的摄影方案，包括：

1. 运镜语言（100字内）：摄像机如何运动、速度、景别变化
2. 光影方案（80字内）：光源方向、色温、明暗对比、特殊光效
3. 构图策略（60字内）：主体位置、空间层次、视觉焦点
4. 氛围描述（60字内）：画面情绪、质感、空气感

【格式要求】
直接输出4个段落，用中文，不要加标题或序号。每个段落100字以内。
段落之间用空行分隔。`;
  }

  /**
   * 调用 LLM
   */
  async _callLLM(prompt) {
    try {
      let result = null;
      
      // 方式1: 通过 LLMReasoningLayer
      try {
        const { LLMReasoningLayer } = require('../../shanhaijing-director/scripts/llm-reasoning-layer');
        const llm = new LLMReasoningLayer();
        const response = await llm.llmReason({
          stage: 'promptforge-dp',
          systemPrompt: '你是一位电影摄影指导，只输出摄影方案，不输出解释。',
          userPrompt: prompt,
          level: 'medium',
          llmOptions: this.llmOptions
        });
        if (response.success && response.result) {
          result = response.result.trim();
        }
      } catch (e) {
        // 回退到方式2
      }
      
      // 方式2: 通过 spawn 调用
      if (!result) {
        result = await this._callLLMViaSpawn(prompt);
      }
      
      return result || '';
    } catch (e) {
      console.warn(`    [DP] ⚠️ LLM 调用失败: ${e.message}`);
      return '';
    }
  }

  /**
   * 通过 spawn 调用 LLM（串行安全）
   */
  async _callLLMViaSpawn(prompt) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      const child = spawn('node', [
        '-e',
        `
        const { LLMReasoningLayer } = require('${path.join(__dirname, '../../shanhaijing-director/scripts/llm-reasoning-layer').replace(/\\/g, '\\\\')}');
        const llm = new LLMReasoningLayer();
        llm.llmReason({
          stage: 'promptforge-dp',
          systemPrompt: '你是一位电影摄影指导，只输出摄影方案，不输出解释。',
          userPrompt: ${JSON.stringify(prompt)},
          level: 'medium',
          llmOptions: { temperature: 0.6, maxTokens: 1024 }
        }).then(r => {
          if (r.success) console.log(r.result);
          else console.log('');
        }).catch(() => console.log(''));
        `
      ], { timeout: 120000 });
      
      let output = '';
      child.stdout.on('data', data => { output += data.toString(); });
      child.stderr.on('data', data => { /* 忽略 */ });
      
      child.on('close', () => resolve(output.trim()));
      child.on('error', reject);
    });
  }

  /**
   * 解析 LLM 结果
   */
  _parseLLMResult(rawText, shot, directorIntent) {
    const lines = rawText.split('\n').filter(l => l.trim());
    
    // 如果 LLM 返回空或失败，回退到硬编码模板
    if (lines.length < 2) {
      console.log(`    [DP] ⚠️ LLM 返回空，回退到模板`);
      return this._fallbackTemplate(shot, directorIntent);
    }
    
    // 尝试将 LLM 输出分为4个部分
    const parts = {
      movement: lines[0] || '',
      lighting: lines[1] || '',
      composition: lines[2] || '',
      atmosphere: lines[3] || ''
    };
    
    // 组合完整描述
    const fullDescription = Object.values(parts).filter(Boolean).join('. ');
    
    return {
      movement: parts.movement,
      lighting: parts.lighting,
      composition: parts.composition,
      atmosphere: parts.atmosphere,
      nirathElements: this._deriveNirathElements(shot.emotion),
      fullDescription: fullDescription
    };
  }

  /**
   * 回退模板（保留原逻辑）
   */
  _fallbackTemplate(shot, directorIntent) {
    const style = directorIntent?.styleChoices?.[0]?.name || '维伦纽瓦';
    const emotion = shot.emotion || 'mysterious';
    
    const movementMap = {
      '维伦纽瓦': {
        'mysterious': '从极远景缓慢推至intimate细节，18mm超广角低角度，巨物对比构图',
        'tense': '稳定器跟随，温柔的诗意运动，非手持抖动',
        'awe': '极缓慢推镜，从轮廓到细节，保持巨物敬畏感',
        'fury': '对称构图，缓慢抬升，从地面到天空的能量释放',
        'climax': '稳定器跟随，温柔的诗意运动，非手持抖动',
        'transcendence': '固定长镜头，余韵在画面中自然消散'
      }
    };
    
    const lightingMap = {
      '维伦纽瓦': {
        'mysterious': 'volumetric light贯穿全场景，光束穿透浮尘，双日暮光染紫金色',
        'tense': '硬光高对比，冷色调主导，阴影锋利如刀',
        'awe': '顶光洒落，神圣光芒，暖金色调，庄严神圣感',
        'fury': '极端光比，明暗对比强烈，戏剧性突出',
        'climax': 'volumetric light达到最高密度，能量漩涡光效',
        'transcendence': '柔和暮光，能量缓缓收敛，暖色调回归平静'
      }
    };
    
    const styleMovement = movementMap[style] || movementMap['维伦纽瓦'];
    const styleLighting = lightingMap[style] || lightingMap['维伦纽瓦'];
    
    return {
      movement: styleMovement[emotion] || styleMovement['mysterious'],
      lighting: styleLighting[emotion] || styleLighting['mysterious'],
      composition: '中心构图，主体占据视觉焦点',
      atmosphere: '史诗感与神秘并存',
      nirathElements: '双日暮光，能量微粒',
      fullDescription: '回退模板生成'
    };
  }

  /**
   * 推导 Nirath 元素
   */
  _deriveNirathElements(emotion) {
    const elementMap = {
      'mysterious': '发光孢子悬浮，双日暮光交织，能量微粒漂浮',
      'tense': '地脉光幽蓝脉动，能量裂缝渗出，空气微微扭曲',
      'awe': '光脉网络亮起，虹脉河反射双日，巨型硅基植物发光',
      'fury': '地壳裂缝喷涌能量，碎石悬浮在冲击波中，虹脉孢子疯狂脉动',
      'climax': '六方光脉网络全开，双日交汇形成神圣光柱，能量漩涡达到最高速',
      'transcendence': '光脉缓缓收敛，孢子 gently 飘落，双日暮光温柔包裹'
    };
    
    return elementMap[emotion] || elementMap['mysterious'];
  }
}

module.exports = PromptForgeDP;