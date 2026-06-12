#!/usr/bin/env node
/**
 * 🔥 PromptForge 首席编剧 v2.0-Peng — LLM 驱动版
 * 
 * 升级：从硬编码模板 → 调用 LLM 生成独特台词
 * 策略：串行调用，逐个镜头生成，避免并发问题
 */

const fs = require('fs');
const path = require('path');

class PromptForgeWriter {
  constructor(options = {}) {
    this.projectDir = options.projectDir || process.cwd();
    this.verbose = options.verbose !== false;
    this.llmOptions = options.llmOptions || { temperature: 0.7, maxTokens: 512 };
  }

  /**
   * 🆕 v2.0: 调用 LLM 生成独特台词
   */
  async createDialogue(shot, directorIntent, storyPlan) {
    // 1. 获取角色声音档案（保留规则部分，作为 LLM 上下文）
    const voiceProfiles = this._loadVoiceProfiles(shot, directorIntent);
    
    // 2. 构建 LLM 提示词
    const prompt = this._buildDialoguePrompt(shot, directorIntent, voiceProfiles);
    
    // 3. 调用 LLM 生成
    console.log(`    [Writer] 🧠 调用 LLM 生成台词...`);
    const llmResult = await this._callLLM(prompt);
    
    // 4. 解析结果
    const dialogue = this._parseLLMResult(llmResult, shot, voiceProfiles);
    
    console.log(`    [Writer] ✅ 台词生成: "${dialogue.text.substring(0, 40)}..."`);
    
    return dialogue;
  }

  /**
   * 构建 LLM 提示词
   */
  _buildDialoguePrompt(shot, directorIntent, voiceProfiles) {
    const characters = shot.characters || [];
    const primaryChar = characters[0] || '角色';
    const charType = this._isBeast(primaryChar) ? '异兽' : '人类';
    const voiceProfile = voiceProfiles[primaryChar] || {};
    
    return `你是一位资深电影编剧，擅长为AI视频创作有深度、有电影感的角色台词。

【角色信息】
- 角色名称: ${primaryChar}
- 角色类型: ${charType}
- 声音特征: ${voiceProfile.tone || '待设定'}
- 语言风格: ${voiceProfile.language || '隐喻来自地质和能量'}
- 时间感知: ${voiceProfile.timeScale || '三千年像昨天'}
- 感知方式: ${voiceProfile.perception || '非视觉，通过震颤感知'}
- 避免词汇: ${(voiceProfile.avoid || []).join(', ')}

【镜头信息】
- 镜头ID: ${shot.id}
- 情绪: ${shot.emotion}
- 时长: ${shot.duration}秒
- 角色: ${characters.join(', ')}
- 镜头描述: ${shot.description?.substring(0, 100) || 'N/A'}...

【导演意图】
- 核心主题: ${directorIntent?.coreTheme || '探索与传承'}
- 情绪弧线: ${(directorIntent?.emotionArc || []).join(' → ')}

【台词要求】
1. 必须贴合镜头情绪和场景
2. 要有电影感，像《沙丘》《银翼杀手2049》的台词风格
3. 异兽台词用隐喻和地质意象，人类台词用感官细节和童真
4. 长度控制在15-35字（适合${shot.duration}秒镜头）
5. 不要解释性台词，要有潜台词和留白

【输出格式】
直接输出台词文本，不要加任何前缀、引号或解释。只输出角色要说的那句话。`;
  }

  /**
   * 调用 LLM
   */
  async _callLLM(prompt) {
    try {
      // 尝试多种调用方式
      let result = null;
      
      // 方式1: 通过 LLMReasoningLayer
      try {
        const { LLMReasoningLayer } = require('../../shanhaijing-director/scripts/llm-reasoning-layer');
        const llm = new LLMReasoningLayer();
        const response = await llm.llmReason({
          stage: 'promptforge-writer',
          systemPrompt: '你是一位电影编剧，只输出台词，不输出解释。',
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
      
      // 方式2: 通过 spawn 调用外部 LLM
      if (!result) {
        result = await this._callLLMViaSpawn(prompt);
      }
      
      return result || '';
    } catch (e) {
      console.warn(`    [Writer] ⚠️ LLM 调用失败: ${e.message}`);
      return '';
    }
  }

  /**
   * 通过 spawn 调用 LLM（串行安全）
   */
  async _callLLMViaSpawn(prompt) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // 使用系统默认的 LLM 调用方式
      const child = spawn('node', [
        '-e',
        `
        const { LLMReasoningLayer } = require('${path.join(__dirname, '../../shanhaijing-director/scripts/llm-reasoning-layer').replace(/\\/g, '\\\\')}');
        const llm = new LLMReasoningLayer();
        llm.llmReason({
          stage: 'promptforge-writer',
          systemPrompt: '你是一位电影编剧，只输出台词，不输出解释。',
          userPrompt: ${JSON.stringify(prompt)},
          level: 'medium',
          llmOptions: { temperature: 0.7, maxTokens: 512 }
        }).then(r => {
          if (r.success) console.log(r.result);
          else console.log('');
        }).catch(() => console.log(''));
        `
      ], { timeout: 120000 });
      
      let output = '';
      child.stdout.on('data', data => { output += data.toString(); });
      child.stderr.on('data', data => { /* 忽略错误输出 */ });
      
      child.on('close', (code) => {
        resolve(output.trim());
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * 解析 LLM 结果
   */
  _parseLLMResult(rawText, shot, voiceProfiles) {
    const characters = shot.characters || [];
    const primaryChar = characters[0] || '角色';
    const voiceProfile = voiceProfiles[primaryChar] || {};
    
    // 清理结果
    let text = rawText.trim();
    
    // 去掉引号
    text = text.replace(/^["']|["']$/g, '');
    
    // 去掉 "台词：" 等前缀
    text = text.replace(/^.*?[：:]\s*/, '');
    
    // 如果 LLM 返回空或失败，回退到硬编码模板
    if (!text || text.length < 5) {
      console.log(`    [Writer] ⚠️ LLM 返回空，回退到模板`);
      return this._fallbackTemplate(shot, primaryChar, voiceProfile);
    }
    
    return {
      speaker: primaryChar,
      emotion: shot.emotion || 'neutral',
      text: text,
      finalText: text,
      lipSync: voiceProfile.type === 'human' ? 'YES' : 'NO',
      subtext: `LLM生成: ${shot.emotion}情绪, ${voiceProfile.language}风格`,
      process: 'LLM实时生成'
    };
  }

  /**
   * 回退模板（保留原逻辑）
   */
  _fallbackTemplate(shot, charName, voiceProfile) {
    const emotion = shot.emotion || 'mysterious';
    
    const fallbackMap = {
      'mysterious': { text: '大地记得所有脚步...三千年，不过是两次呼吸之间。', lipSync: 'NO' },
      'tense': { text: '震颤不是恐惧，是 stone 在调整它的倾听。', lipSync: 'NO' },
      'awe': { text: '三千年...终于又有一个小生命敢直视我的伤口。', lipSync: 'NO' },
      'fury': { text: '战斧记得每一次劈开黑暗的声音...让我再为你演示一次。', lipSync: 'NO' },
      'climax': { text: '来吧，让地脉记住这一刻！', lipSync: 'NO' },
      'transcendence': { text: '有些相遇不需要眼睛...地脉已经记住了你的重量。', lipSync: 'NO' }
    };
    
    const result = fallbackMap[emotion] || fallbackMap['mysterious'];
    
    return {
      speaker: charName,
      emotion: emotion,
      text: result.text,
      finalText: result.text,
      lipSync: result.lipSync,
      subtext: '回退模板（LLM失败）',
      process: '硬编码模板'
    };
  }

  /**
   * 加载角色声音档案（保留原逻辑）
   */
  _loadVoiceProfiles(shot, directorIntent) {
    const characters = shot.characters || [];
    const profiles = {};
    
    for (const char of characters) {
      const charName = typeof char === 'string' ? char : char.name;
      
      if (this._isBeast(charName)) {
        profiles[charName] = {
          type: 'beast',
          perception: '非视觉，通过震颤和共鸣感知世界',
          timeScale: '三千年像昨天',
          language: '隐喻来自stone/wind/vein',
          tone: '低沉、缓慢、带有金属共鸣',
          emotionExpression: '通过地脉震颤、空气共鸣、能量脉动',
          avoid: ['人类口语化', '现代词汇', '过于情绪化的表达']
        };
      } else {
        profiles[charName] = {
          type: 'human',
          perception: '视觉主导，五感分明',
          timeScale: '以心跳和呼吸思考',
          language: '直接、具体、充满好奇',
          tone: '天真、勇敢、略带恐惧',
          emotionExpression: '通过面部表情、肢体动作、声音颤抖',
          avoid: ['过于成熟', '过于理性', '失去童真']
        };
      }
    }
    
    return profiles;
  }

  /**
   * 判断是否为异兽角色
   */
  _isBeast(charName) {
    const beastKeywords = ['刑天', '烛龙', '帝江', '九尾狐', '白泽', '饕餮', '穷奇', '混沌', '梼杌', '相柳', '毕方', '夔'];
    return beastKeywords.some(kw => charName.includes(kw));
  }
}

module.exports = PromptForgeWriter;