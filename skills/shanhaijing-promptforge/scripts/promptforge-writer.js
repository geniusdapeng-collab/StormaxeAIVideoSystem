/**
 * 🔥 PromptForge Writer v2.1-Peng — 完整叙事生成器
 * 
 * 升级：从"只生成台词" → 生成"完整核心叙事段落（画面+光影+情绪+台词）"
 * 输入：镜头描述 + 角色 + 情绪 + 时长 + 世界观
 * 输出：核心叙事（400-600字）+ 台词
 */

const path = require('path');

// 加载 LLM 调用器
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

class PromptForgeWriterV21 {
  constructor() {
    this.llm = createLLMCaller();
    this.version = 'v2.2-Peng';
  }

  /**
   * 生成完整核心叙事
   * @param {Object} shot - 镜头数据
   * @param {Object} storyPlan - 故事计划
   * @returns {Promise<Object>} - { coreNarrative, dialogue, emotion, shotId }
   */
  async generateFullNarrative(shot, storyPlan) {
    const { systemPrompt, userPrompt } = this._buildNarrativePrompt(shot, storyPlan);
    
    try {
      const result = await this.llm.call(systemPrompt, userPrompt, {
        temperature: 0.8,
        maxTokens: 800,
        timeout: 30000
      });

      return this._parseNarrativeResult(result, shot.id);
    } catch (error) {
      console.error(`❌ Writer v2.1 生成失败 (${shot.id}):`, error.message);
      return this._fallbackNarrative(shot);
    }
  }

  _buildNarrativePrompt(shot, storyPlan) {
    const duration = shot.duration || 8;
    const characters = shot.characters || [];
    const emotion = shot.emotion || 'mysterious';
    const description = shot.description || '';
    const worldview = storyPlan?.worldview || 'Nirath原创异世界星球';
    const style = storyPlan?.style || 'cinematic-epic史诗电影级';
    const location = shot.location || 'Nirath荒野';
    const camera = shot.camera || '';

    const systemPrompt = `你是顶级电影编剧，擅长为AI视频生成编写可执行的视觉叙事。

【系统级约束 — 必须遵守】
1. **环境描写唯一性**：每个镜头的环境描写必须独一无二，禁止在不同镜头中复用相同的描述句（如"千万条垂直丁达尔光柱"、"头部断口处黑色晶簇旋转"等）。如果系统提示你某描述已在其他镜头使用，必须换全新写法。
2. **抽象概念降维**：禁止使用AI无法渲染的抽象概念（如11维弦论、莫比乌斯环拓扑结构、相对论时间膨胀、拓扑学名词等）。必须转译为可视觉化的具象描述（如"金色丝线交织成立体网格"、"碎片沿涡线滑行形成∞符号"、"光矛前方碎片冻结、后方正常旋转形成速度差"）。
3. **镜头分工明确**：相邻镜头的动作链必须明确分工，禁止两个镜头描述几乎相同的动作链（如都是"核心脉动→小G惊惧"）。必须区分：微观发现 vs 宏观爆发、被动承受 vs 主动对抗、观察 vs 觉醒。
4. **时间格式统一**：时间标注必须使用统一格式 [0.0-2.0秒]，不得混用"第X秒"、"0.0-1.5秒："等其他格式。
5. **情绪精准执行**：情绪必须精准转化为视觉动作，禁止情绪偏差。例如：愤怒=不退反进、对抗姿态；恐惧=后退、凝固；震惊=瞳孔收缩、身体后仰；敬畏=放下戒备、抬头仰望。`;

    const userPrompt = `【任务】
为以下镜头编写"核心叙事段落"（400-600字），包含画面构图、光影氛围、运镜语言、情绪质感、材质细节。同时生成一句台词（30字以内）。

【世界观】
${worldview}

【风格】
${style}

【镜头信息】
- 镜头ID: ${shot.id}
- 时长: ${duration}秒
- 情绪: ${emotion}
- 角色: ${characters.join(', ') || '无'}
- 场景: ${location}
- 镜头描述: ${description}
- 原始运镜: ${camera}

【要求】
1. 叙事必须"可执行"——每个画面描述都是AI能直接渲染的指令
2. 时间参数必须匹配${duration}秒（如"在${duration}秒内完成..."）
3. 禁止旁白/解说，只写角色台词
4. 台词紧扣${emotion}情绪，30字以内
5. 材质细节要有质感（金属、岩石、织物等）
6. 如果前一镜头有动作，本镜头必须明确接续状态

【输出格式】
===核心叙事===
（400-600字的核心叙事段落）

===台词===
"角色台词"

===情绪节点===
（简述${duration}秒内的情绪变化）`;

    return { systemPrompt, userPrompt };
  }

  _parseNarrativeResult(result, shotId) {
    const text = result?.text || result?.content || result?.finalText || result;
    
    if (!text || typeof text !== 'string') {
      throw new Error('LLM返回格式错误');
    }

    const coreMatch = text.match(/===核心叙事===\s*([\s\S]*?)(?:===台词===|===情绪节点===|$)/);
    const dialogueMatch = text.match(/===台词===\s*["']?([^"'\n]+)["']?/);
    const emotionMatch = text.match(/===情绪节点===\s*([\s\S]*?)$/);

    const coreNarrative = coreMatch ? coreMatch[1].trim() : text.trim();
    const dialogue = dialogueMatch ? dialogueMatch[1].trim() : '';
    const emotionArc = emotionMatch ? emotionMatch[1].trim() : '';

    return {
      shotId,
      coreNarrative: coreNarrative.substring(0, 800), // 限制长度
      dialogue: dialogue.substring(0, 100),
      emotionArc: emotionArc.substring(0, 200),
      finalText: text, // 兼容旧接口
      text: text,
      version: this.version
    };
  }

  _fallbackNarrative(shot) {
    const emotion = shot.emotion || 'mysterious';
    const duration = shot.duration || 8;
    
    const fallbacks = {
      mysterious: `Nirath荒野黄昏，双日暮光将晶化大地染成紫金色。画面缓缓推进，从微距特写开始揭示神秘氛围。`,
      curious: `小G穿行于晶化峡谷，黄色冲锋衣在冷灰金属中形成暖色锚点。他好奇地探索着未知环境。`,
      tense: `能量裂隙深处，核心脉动逐渐加速。小G感受到来自远古的压迫，紧张情绪在空气中凝结。`,
      awe: `刑天巨像胸口核心爆裂，赤金光芒照亮整个战场遗迹。小G仰望着这神话级的觉醒时刻。`,
      shock: `小G瞳孔急剧收缩，面部明暗骤变。刑天乳目睁开射出光束，无首神躯带来的震撼直击灵魂。`,
      fury: `盾斧交击，能量环迸发。刑天无头神躯跃起，晶化金属碎片如逆雨回流，愤怒的力量撕裂空间。`,
      climax: `终极旋转中，盾斧轨迹在双日暮光中划出炽金交叉。虹彩能量液滴形成莫比乌斯环，神话级力量达到巅峰。`,
      transcendence: `小G与刑天在荒芜中对视，指南针微光与核心光桥缔结。文明传承的仪式在冷蓝暮穹下静静展开。`
    };

    return {
      shotId: shot.id,
      coreNarrative: fallbacks[emotion] || fallbacks.mysterious,
      dialogue: '',
      emotionArc: '',
      finalText: fallbacks[emotion] || fallbacks.mysterious,
      text: fallbacks[emotion] || fallbacks.mysterious,
      version: this.version + '-fallback',
      isFallback: true
    };
  }
}

module.exports = PromptForgeWriterV21;

// CLI 测试
if (require.main === module) {
  const writer = new PromptForgeWriterV21();
  
  const testShot = {
    id: 'S02',
    emotion: 'tense',
    duration: 9,
    characters: ['小G', '刑天'],
    description: '能量裂隙中刑天核心脉动，小G感受到远古压迫',
    location: '远古战场遗迹环形边缘'
  };
  
  const storyPlan = {
    worldview: 'Nirath原创异世界星球，暗金晶化峡谷远古战场遗迹',
    style: 'cinematic-epic史诗电影级'
  };

  writer.generateFullNarrative(testShot, storyPlan).then(result => {
    console.log('\n=== Writer v2.1 测试结果 ===');
    console.log('核心叙事长度:', result.coreNarrative.length, '字');
    console.log('台词:', result.dialogue);
    console.log('\n核心叙事:\n', result.coreNarrative.substring(0, 300) + '...');
  }).catch(err => {
    console.error('测试失败:', err);
  });
}