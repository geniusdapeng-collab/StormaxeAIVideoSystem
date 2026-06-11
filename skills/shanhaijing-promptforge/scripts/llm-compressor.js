#!/usr/bin/env node
/**
 * 🔥 LLM Compressor v1.0-Peng — 智能提示词压缩器
 * 
 * 核心功能：用 LLM 把 Writer + DP 的输出智能压缩到990字
 * 不是硬截断，而是让 LLM 重新改写，保留最重要的画面、运镜、台词
 */

const path = require('path');

let createLLMCaller;
try {
  const llmModule = require(path.resolve(__dirname, '../../../shanhaijing-director/scripts/llm-caller.js'));
  createLLMCaller = llmModule.createLLMCaller || llmModule;
} catch (e) {
  try {
    const llmModule = require(path.resolve(__dirname, '../../shanhaijing-director/scripts/llm-caller.js'));
    createLLMCaller = llmModule.createLLMCaller || llmModule;
  } catch (e2) {
    console.error('❌ 无法加载 createLLMCaller:', e2.message);
    process.exit(1);
  }
}

class LLMCompressor {
  constructor() {
    this.llm = createLLMCaller();
    this.version = 'v2.2-Peng';
    this.maxLength = 1000;
    this.safetyMargin = 5;
  }

  /**
   * 智能压缩提示词
   * @param {Object} params - 包含 coreNarrative, camera, lighting, material, dialogue, characters, negativePrompt
   * @returns {Promise<string>} - 压缩后的最终提示词
   */
  async compress(params) {
    const {
      coreNarrative,
      camera,
      lighting,
      material,
      dialogue,
      characters,
      negativePrompt,
      shotId,
      duration
    } = params;

    // 先拼接原始内容
    const rawContent = this._assembleRawContent({
      coreNarrative, camera, lighting, material, dialogue, characters, negativePrompt
    });

    const rawLength = rawContent.length;
    
    // 如果原始内容已经在限制内，直接返回
    if (rawLength <= this.maxLength - this.safetyMargin) {
      console.log(`✅ ${shotId} 原始内容 ${rawLength} 字，无需压缩`);
      return rawContent;
    }

    console.log(`🗜️  ${shotId} 原始内容 ${rawLength} 字，需要压缩到 ${this.maxLength - this.safetyMargin} 字`);

    // 调用 LLM 压缩
    const compressed = await this._llmCompress({
      coreNarrative, camera, lighting, material, dialogue, characters, negativePrompt,
      shotId, duration, targetLength: this.maxLength - this.safetyMargin
    });

    return compressed;
  }

  _assembleRawContent(params) {
    const parts = [];
    
    if (params.coreNarrative) parts.push(params.coreNarrative);
    if (params.camera) parts.push(params.camera);
    if (params.lighting) parts.push(params.lighting);
    if (params.material) parts.push(params.material);
    if (params.dialogue) parts.push(`"${params.dialogue}"`);
    if (params.characters?.length > 0) parts.push(params.characters.join(', '));
    if (params.negativePrompt) parts.push(params.negativePrompt);
    
    return parts.join(', ');
  }

  async _llmCompress(params) {
    const { systemPrompt, userPrompt } = this._buildCompressPrompt(params);
    
    try {
      const result = await this.llm.call(systemPrompt, userPrompt, {
        temperature: 0.6, // 较低温度，保持稳定性
        maxTokens: 1000,
        timeout: 30000
      });

      let text = result?.content || result?.text || result?.finalText || result;
      
      if (!text || typeof text !== 'string') {
        throw new Error('LLM返回格式错误');
      }

      // 清理可能的格式标签
      text = text.replace(/===最终提示词===\s*/g, '');
      text = text.trim();

      // 如果压缩后仍然超限，做最后的硬截断
      if (text.length > this.maxLength) {
        console.warn(`⚠️  ${params.shotId} LLM压缩后仍超限(${text.length}字)，做最后截断`);
        text = this._emergencyTruncate(text, params.targetLength);
      }

      return text;
    } catch (error) {
      console.error(`❌ Compressor 压缩失败 (${params.shotId}):`, error.message);
      return this._emergencyTruncate(
        this._assembleRawContent(params),
        params.targetLength
      );
    }
  }

  _buildCompressPrompt(params) {
    const rawContent = this._assembleRawContent(params);
    
    const systemPrompt = `你是顶级AI视频提示词优化师。你的任务是将提示词压缩到指定字数以内，同时保留所有核心信息。

【系统级约束 — 必须遵守】
1. **时间格式统一**：压缩后的时间标注必须使用统一格式 [0.0-2.0秒]，禁止混用其他格式。如果原始提示词中有其他格式（如"第X秒"、"0.0-1.5秒："），必须转换为标准格式。
2. **环境描写唯一性**：压缩时必须保留当前镜头独特的环境描写，禁止与其他镜头的描述合并或复用。如果检测到某描述句（如"千万条垂直丁达尔光柱"、"头部断口处黑色晶簇旋转"）可能在其他镜头已出现，必须删除或替换为全新描述。
3. **情绪精准执行**：压缩时不得改变情绪对应的视觉动作。愤怒必须保持对抗姿态；恐惧必须保持后退凝固；震惊必须保持身体后仰；敬畏必须保持放下戒备。禁止将"愤怒"压缩为"恐惧"或"被动承受"。
4. **色温声明保留**：压缩后必须在末尾保留"画面保持高亮度不暗沉，色温对比自然过渡"这一句，禁止删除。
5. **抽象概念降维**：如果原始提示词包含AI无法渲染的抽象概念（如11维弦论、莫比乌斯环拓扑、相对论时间膨胀等），压缩时必须将其转译为可视觉化的具象描述（如"金色丝线交织成立体网格"、"碎片沿涡线滑行形成∞符号"、"光矛前方碎片冻结、后方正常旋转形成速度差"）。
6. **角色参考标注**：如果原始提示词包含角色参考标注（如[REF:小G]或[REF:刑天]），必须保留在压缩后的提示词末尾，供渲染引擎绑定定妆照。`;

    const userPrompt = `【原始提示词】(${rawContent.length}字)
${rawContent}

【镜头信息】
- 镜头ID: ${params.shotId}
- 时长: ${params.duration}秒
- 情绪: ${params.emotion || 'unknown'}

【压缩规则】
1. 保留核心画面（最重要的2-3个画面）
2. 保留运镜（机位、运动、焦距）
3. 保留台词（如果有时）
4. 保留角色定义
5. 保留负向提示
6. 删除冗余形容词（如"史诗级"、"震撼的"）
7. 合并相似描述
8. 用更简洁的动词替换长描述

【输出要求】
直接输出压缩后的提示词文本，不要加任何解释、标题或格式标记。
字数必须严格控制在${params.targetLength}字以内。`;

    return { systemPrompt, userPrompt };
  }

  _emergencyTruncate(text, targetLength) {
    if (text.length <= targetLength) return text;

    // 尝试在句子边界截断
    const truncated = text.substring(0, targetLength - 50);
    const lastPeriod = Math.max(
      truncated.lastIndexOf('。'),
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf(', ')
    );
    
    if (lastPeriod > targetLength * 0.7) {
      return text.substring(0, lastPeriod + 1);
    }
    
    return text.substring(0, targetLength - 10);
  }
}

module.exports = LLMCompressor;

// CLI 测试
if (require.main === module) {
  const compressor = new LLMCompressor();
  
  const testParams = {
    shotId: 'S02',
    duration: 9,
    emotion: 'tense',
    coreNarrative: '裂隙深渊之上，赤金脉动自晶化金属深处苏醒，暗金躯体内部血管般的纹路逐次点亮，如同被封印的远古心脏重新搏动。微距视野中，能量核心的每一次收缩都裹挟着液态光晕的涟漪，金属表面的分子级纹理在极端放大下呈现出生物膜般的有机质感。摄影机以失重姿态急速抽离，裂隙边缘的漂浮过渡中，尺度骤然崩塌——十六毫米超广角将刑天巨像的完整轮廓暴力挤入画框，畸变的穹顶结构如神谕压顶，小G的身影被压缩成裂隙边缘一粒颤抖的尘埃。丁达尔光柱在脉冲光谱中切割出冷蓝与炽金的交错层，能量粒子沿光路悬浮，形成呼吸般的明暗潮汐。小G仰面，顶光与底光在其面部高速交替，皮肤肌理在惊悚照明下呈现蜡质透明感，瞳孔中倒映的赤金核心正以不同步的时间流速膨胀。黄铜指南针震颤出虚影残像，金色微光与巨像脉动形成肉眼可辨的谐波。后退的脚跟碾碎浮尘，防御姿态的臂膀在广角边缘被拉伸为脆弱的十字——末帧凝固于小G喉结的吞咽动作与刑天下肢金属褶皱的压迫性俯视之间，崇高恐惧在悬殊尺度中悬停。',
    camera: '低机位广角固定镜头，缓慢推轨前移。起始全景框住小G与刑天巨像的尺度对比，推轨过程中自然过渡为中景，最终在小G胸前的黄铜指南针上形成微距焦点。运动速度0.3m/s，与能量脉动同频，制造呼吸般的沉浸节奏。',
    lighting: '侧逆光勾勒轮廓，核心爆裂强光，丁达尔光柱。冷蓝与炽金交织，形成脉冲光谱。',
    material: '晶化金属表面，分子级纹理，生物膜质感。黄铜指南针氧化铜绿。',
    dialogue: '它在呼吸。和我一样。',
    characters: ['小G(yellow jacket,child)', '刑天(headless,breast-eyes,navel-mouth)'],
    negativePrompt: 'NO dark scene NO pitch black NO total darkness, bright vivid colors'
  };

  compressor.compress(testParams).then(result => {
    console.log('\n=== Compressor 测试结果 ===');
    console.log('压缩后长度:', result.length, '字');
    console.log('压缩后内容:\n', result);
  }).catch(err => {
    console.error('测试失败:', err);
  });
}