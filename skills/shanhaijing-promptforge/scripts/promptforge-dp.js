/**
 * 🔥 PromptForge DP v2.1-Peng — 完整运镜生成器
 * 
 * 升级：从"只生成运镜" → 生成"完整运镜+光影+材质（300-400字）"
 * 输入：Writer输出 + 时长 + 景别 + 镜头类型
 * 输出：运镜 + 光影 + 材质
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

class PromptForgeDPV21 {
  constructor() {
    this.llm = createLLMCaller();
    this.version = 'v2.2-Peng';
  }

  async generateFullCinematography(shot, writerOutput, storyPlan) {
    const { systemPrompt, userPrompt } = this._buildCinematographyPrompt(shot, writerOutput, storyPlan);
    
    try {
      const result = await this.llm.call(systemPrompt, userPrompt, {
        temperature: 0.7,
        maxTokens: 600,
        timeout: 30000
      });

      return this._parseCinematographyResult(result, shot.id);
    } catch (error) {
      console.error(`❌ DP v2.1 生成失败 (${shot.id}):`, error.message);
      return this._fallbackCinematography(shot);
    }
  }

  _buildCinematographyPrompt(shot, writerOutput, storyPlan) {
    const duration = shot.duration || 8;
    const emotion = shot.emotion || 'mysterious';
    const coreNarrative = writerOutput?.coreNarrative || '';
    const camera = shot.camera || '';
    const shotType = shot.type || 'normal';
    const scale = shot.scale || 'medium';

    const systemPrompt = `你是顶级电影摄影师（DP），擅长为AI视频生成编写可执行的运镜、光影和材质指令。

【系统级约束 — 必须遵守】
1. **情绪精准执行**：情绪必须精准转化为视觉动作和光影，禁止情绪偏差。例如：愤怒=对抗姿态（不退反进、武器格挡、斗篷逆风飞扬）；恐惧=后退凝固（瞳孔收缩、身体后仰、防御姿态）；震惊=身体后仰、瞳孔扩张、面部明暗骤变；敬畏=放下戒备、抬头仰望、身体前倾。光影必须与情绪匹配：愤怒→硬光高对比；恐惧→底光向上照射；震惊→顶光炸裂；敬畏→柔和均匀光。
2. **时间格式统一**：时间标注必须使用统一格式 [0.0-2.0秒]，不得混用其他格式。运镜时间分段必须精确到秒且覆盖完整${duration}秒。
3. **环境描写唯一性**：光影描述中的环境元素（如光柱、粒子、雾气等）必须与当前镜头独特，禁止直接复用其他镜头已出现的环境描述。如果系统提示某描述已存在，必须换全新视觉元素。
4. **色温声明统一**：每镜头末尾必须包含一句"画面保持高亮度不暗沉，色温对比自然过渡"，防止与全局 bright vivid colors 指令冲突。`;

    const userPrompt = `【任务】
基于以下核心叙事，编写"运镜+光影+材质"段落（300-400字）。

【核心叙事】
${coreNarrative.substring(0, 400)}
...

【镜头信息】
- 镜头ID: ${shot.id}
- 时长: ${duration}秒
- 情绪: ${emotion}
- 类型: ${shotType}
- 景别: ${scale}
- 原始运镜: ${camera}

【要求】
1. 运镜必须精确到秒（如"前3秒...中段${Math.floor(duration/2)}秒...末${duration-Math.floor(duration/2)}秒..."）
2. 时间参数必须匹配${duration}秒
3. 焦距必须明确（如"24mm广角"、"100mm微距"）
4. 光影必须包含色温（如"3200K暖金"、"6500K冷青"）
5. 材质细节要有质感（金属氧化、岩石风化、织物纤维等）
6. 如果镜头有角色互动，必须明确机位关系（如"小G肩后30cm"）

【输出格式】
===运镜===
（150-200字的完整运镜描述，包含镜头运动、焦距、速度、景别转换）

===光影===
（100-150字的光影描述，包含色温、明暗比、光源方向）

===材质===
（50-100字的材质细节）`;

    return { systemPrompt, userPrompt };
  }

  _parseCinematographyResult(result, shotId) {
    const text = result?.text || result?.content || result?.finalText || result;
    
    if (!text || typeof text !== 'string') {
      throw new Error('LLM返回格式错误');
    }

    const cameraMatch = text.match(/===运镜===\s*([\s\S]*?)(?:===光影===|===材质===|$)/);
    const lightingMatch = text.match(/===光影===\s*([\s\S]*?)(?:===材质===|$)/);
    const materialMatch = text.match(/===材质===\s*([\s\S]*?)$/);

    const camera = cameraMatch ? cameraMatch[1].trim() : '';
    const lighting = lightingMatch ? lightingMatch[1].trim() : '';
    const material = materialMatch ? materialMatch[1].trim() : '';

    // 合并为完整运镜段落
    const fullCinematography = [
      camera,
      lighting,
      material
    ].filter(Boolean).join('\n\n');

    return {
      shotId,
      camera: camera.substring(0, 300),
      lighting: lighting.substring(0, 200),
      material: material.substring(0, 150),
      fullCinematography: fullCinematography.substring(0, 600),
      finalText: fullCinematography,
      text: fullCinematography,
      version: this.version
    };
  }

  _fallbackCinematography(shot) {
    const emotion = shot.emotion || 'mysterious';
    
    const fallbacks = {
      mysterious: '低角度仰拍，缓慢推轨。侧逆光勾勒轮廓，边缘光保持神秘感。',
      curious: '斯坦尼康跟随，匀速贴行。夕阳侧逆光，环境光骤变。',
      tense: '急速后撤，广角畸变。顶光底光夹击，形成惊悚照明。',
      awe: '微距起幅，急速后拉大全景。核心爆裂强光，丁达尔光柱。',
      shock: '低角度仰拍，急速后撤兼上升。顶光炸裂，冷暗金与炽红交织。',
      fury: '极低机位贴地，急速后撤下拉。盾斧交击青白能量环，冲击波吞噬。',
      climax: '轨道缓推环绕，高速摄影捕捉。双日暮光炽金轨迹，虹彩能量液滴。',
      transcendence: '轨道缓推结合微幅升降，0.3m/s环绕。冷蓝暮穹，渐变光桥。'
    };

    const fallback = fallbacks[emotion] || fallbacks.mysterious;

    return {
      shotId: shot.id,
      camera: fallback,
      lighting: '',
      material: '',
      fullCinematography: fallback,
      finalText: fallback,
      text: fallback,
      version: this.version + '-fallback',
      isFallback: true
    };
  }
}

module.exports = PromptForgeDPV21;

// CLI 测试
if (require.main === module) {
  const dp = new PromptForgeDPV21();
  
  const testShot = {
    id: 'S02',
    emotion: 'tense',
    duration: 9,
    type: 'emotional',
    scale: 'extreme_close'
  };
  
  const writerOutput = {
    coreNarrative: '裂隙深渊之上，赤金脉动自晶化金属深处苏醒，暗金躯体内部血管般的纹路逐次点亮...'
  };

  dp.generateFullCinematography(testShot, writerOutput).then(result => {
    console.log('\n=== DP v2.1 测试结果 ===');
    console.log('运镜长度:', result.camera.length, '字');
    console.log('光影长度:', result.lighting.length, '字');
    console.log('材质长度:', result.material.length, '字');
    console.log('\n运镜:\n', result.camera);
  }).catch(err => {
    console.error('测试失败:', err);
  });
}