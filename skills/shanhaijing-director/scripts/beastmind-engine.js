#!/usr/bin/env node
/**
 * BeastMind Engine v2.0-Peng — 兽魂叙事引擎 (ShanhaiStory Forge v2.8-Peng)
 * 核心定位: 为山海经神话视频生成增强型故事计划 (story-plan.json)
 * 核心哲学: "兽负" (The Beast's Burden) — 异兽不是主角，它的负担才是
 * + 🆕 v2.0-Peng: 软性注入V2编剧方法论 — 四层角色内核推导 (Want/Need/Ghost/Lie)
 *
 * 集成点: 替换 director-pipeline.js Stage-3 中 story-plan.json 的生成逻辑
 * 向后兼容: 默认关闭，通过 projectConfig.enableBeastMind = true 启用
 *
 * @version v2.0-Peng
 * @author 小G
 * @date 2026-05-26
 */

const fs = require('fs');
const path = require('path');

class BeastMindEngine {
  constructor(options = {}) {
    this.version = 'v2.0-Peng';
    this.options = options;
    
    // 加载原型数据
    const archetypesPath = path.join(__dirname, 'beastmind-archetypes.json');
    this.archetypesData = JSON.parse(fs.readFileSync(archetypesPath, 'utf8'));
    
    // 加载模板数据
    const templatesPath = path.join(__dirname, 'beastmind-templates.json');
    this.templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
  }

  /**
   * 主入口：根据输入生成增强型story-plan
   * @param {Object} input - 输入参数
   *   - beastName: 异兽名称（如"饕餮"）
   *   - beastDescription: 异兽描述（来自档案）
   *   - habitat: Nirath生态区ID（如"S01"）
   *   - duration: 目标时长（30/60/90/120）
   *   - xiaoGContext: 小G角色设定
   * @returns {Object} 增强型story-plan JSON
   */
  generate(input) {
    console.log(`\n🧠 BeastMind Engine ${this.version} 启动`);
    console.log(`   异兽: ${input.beastName} | 时长: ${input.duration}s | 生态区: ${input.habitat || 'auto'}`);

    // Step 1: 原型匹配
    const archetype = this._matchArchetype(input.beastName, input.beastDescription);
    console.log(`   🎯 原型匹配: ${archetype.name} (${archetype.nameEn})`);

    // Step 2: 选择时长模板
    const template = this._selectTemplate(input.duration);
    console.log(`   📐 时长模板: ${template.duration}s / ${template.beatCount}节拍 / ${template.reversalMode}断裂`);

    // Step 3: 生成兽魂心理模型
    const psyche = this._generatePsyche(archetype, input);
    console.log(`   💭 兽负: ${psyche.burden}`);

    // Step 4: 生成增强节拍
    const beats = this._generateBeats(template, archetype, input);
    console.log(`   🎬 生成 ${beats.length} 个叙事节拍`);

    // Step 5: 转换为标准story-plan格式
    const storyPlan = this._convertToStoryPlan(beats, archetype, psyche, input);
    console.log(`   ✅ 增强型story-plan生成完成`);

    return storyPlan;
  }

  /**
   * Step 1: 原型匹配 — 根据异兽名称/描述匹配8大原型
   */
  _matchArchetype(beastName, beastDescription) {
    const archetypes = this.archetypesData.archetypes;
    const keywordMap = this.archetypesData.mappingHints.keywordsToArchetype;
    
    // 组合搜索文本
    const searchText = `${beastName} ${beastDescription || ''}`;
    
    // 关键词匹配计数
    const scores = {};
    for (const [keyword, archetypeId] of Object.entries(keywordMap)) {
      if (searchText.includes(keyword)) {
        scores[archetypeId] = (scores[archetypeId] || 0) + 1;
      }
    }
    
    // 找到最高分原型
    let bestArchetypeId = 'guardian'; // 默认守望者
    let bestScore = 0;
    for (const [id, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestArchetypeId = id;
      }
    }
    
    // 如果没有任何匹配，尝试从typicalBeasts列表匹配
    if (bestScore === 0) {
      for (const [id, archetype] of Object.entries(archetypes)) {
        if (archetype.typicalBeasts.includes(beastName)) {
          bestArchetypeId = id;
          break;
        }
      }
    }
    
    return archetypes[bestArchetypeId];
  }

  /**
   * Step 2: 选择时长模板
   */
  _selectTemplate(duration) {
    const templates = this.templatesData.templates;
    
    // 找最接近的模板（键格式为 "30s", "60s" 等）
    const templateKey = duration <= 30 ? '30s' : 
                        duration <= 60 ? '60s' : 
                        duration <= 90 ? '90s' : '120s';
    
    const template = templates[templateKey];
    
    // 如果请求时长与模板不同，按比例缩放
    const templateDuration = parseInt(templateKey); // 30, 60, 90, 120
    if (templateDuration !== duration) {
      const scale = duration / templateDuration;
      const scaledBeats = template.beats.map(b => ({
        ...b,
        duration: Math.round(b.duration * scale),
        durationRange: b.durationRange.map(d => Math.round(d * scale))
      }));
      return {
        ...template,
        duration,
        beats: scaledBeats
      };
    }
    
    return template;
  }

  /**
   * Step 3: 生成兽魂心理模型
   */
  _generatePsyche(archetype, input) {
    const basePsyche = archetype.psyche;
    
    return {
      archetype: archetype.name,
      archetypeEn: archetype.nameEn,
      coreDrive: archetype.coreDrive,
      burden: archetype.burdenEssence, // 修复：从原型直接取burdenEssence
      motivation: basePsyche.motivation,
      fear: basePsyche.fear,
      desire: basePsyche.desire,
      memory: basePsyche.memory,
      judgmentMode: basePsyche.judgmentMode,
      dailyBehavior: basePsyche.dailyBehavior,
      alertBehavior: basePsyche.alertBehavior,
      acceptanceBehavior: basePsyche.acceptanceBehavior,
      // 🆕 v2.0-Peng: 软性注入V2编剧方法论 — 四层角色内核推导（不入库，只用于提示词生成）
      narrativeCore: this._deriveNarrativeCore(archetype, basePsyche),
      // 生态功能（与栖息地绑定）
      ecologicalRole: archetype.ecologicalRole
    };
  }

  /**
   * 🆕 v2.0-Peng: 从原型和心理模型推导四层角色内核（Want/Need/Ghost/Lie）
   * 软性推导，不入库，只用于下游提示词生成
   */
  _deriveNarrativeCore(archetype, basePsyche) {
    // 从现有字段软性推导，不新增数据源
    const want = archetype.coreDrive || '守护自己的存在意义';
    const need = basePsyche.desire || '被理解，不再孤独';
    const ghost = basePsyche.memory || '被遗忘的过去';
    const lie = basePsyche.fear || '我不需要任何人';
    
    // 根据原型类型微调
    const archetypeId = Object.keys(this.archetypesData.archetypes).find(
      id => this.archetypesData.archetypes[id].name === archetype.name
    ) || 'guardian';
    
    const archetypeSpecific = {
      guardian: {
        want: '守护领地，驱逐入侵者',
        need: '被记住，不再孤独',
        ghost: '被遗忘的守护者，失去被守护对象',
        lie: '我不需要任何人，战意就是一切'
      },
      prisoner: {
        want: '打破封印，重获自由',
        need: '被接纳，即使带着诅咒',
        ghost: '被封印前的伤害记忆',
        lie: '自由就是一切，不需要羁绊'
      },
      wanderer: {
        want: '找到归宿，结束流浪',
        need: '被一个地方真正接纳',
        ghost: '永远漂泊，无法扎根',
        lie: '我不需要家，流浪就是自由'
      },
      devourer: {
        want: '满足无尽的饥饿',
        need: '被填满内心的空虚',
        ghost: '永远无法满足的渴望',
        lie: '饥饿就是力量，不需要满足'
      },
      trickster: {
        want: '戏弄他人，获取优势',
        need: '被认真对待一次',
        ghost: '从未被认真对待',
        lie: '我不在乎别人怎么看'
      },
      sage: {
        want: '解答所有问题',
        need: '遇到一个自己无法解答的问题',
        ghost: '从未体验过未知的惊喜',
        lie: '我知道一切，未知是弱点'
      },
      destroyer: {
        want: '毁灭一切阻碍',
        need: '被阻止，被拯救',
        ghost: '失控时造成的伤害',
        lie: '我不需要控制，毁灭就是释放'
      },
      innocent: {
        want: '保持纯真，避免伤害',
        need: '体验真实的情感，即使痛苦',
        ghost: '被保护的代价是失去真实',
        lie: '我不需要长大，纯真就是力量'
      }
    };
    
    const specific = archetypeSpecific[archetypeId] || archetypeSpecific['guardian'];
    
    return {
      want: want || specific.want,
      need: need || specific.need,
      ghost: ghost || specific.ghost,
      lie: lie || specific.lie,
      // 推导来源标记（用于调试）
      _derivedFrom: {
        archetypeId,
        coreDrive: archetype.coreDrive,
        desire: basePsyche.desire,
        fear: basePsyche.fear,
        memory: basePsyche.memory
      }
    };
  }

  /**
   * Step 4: 生成增强节拍 — 将模板节拍与原型心理模型融合
   */
  _generateBeats(template, archetype, input) {
    const { beastName, habitat } = input;
    const baseEmotionCurve = archetype.emotionCurve;
    
    return template.beats.map((beatTemplate, index) => {
      // 获取原型对应节拍的情绪基线
      const emotionKey = beatTemplate.type;
      const baseEmotion = baseEmotionCurve[emotionKey] || { emotion: '平静', intensity: 50 };
      
      // 生成生态嵌入描述
      const ecologicalEmbed = this._generateEcologicalEmbed(beatTemplate, archetype, beastName, habitat);
      
      // 生成视觉语法
      const visualGrammar = this._generateVisualGrammar(beatTemplate, archetype, index, template.beats.length);
      
      return {
        id: beatTemplate.id,
        type: beatTemplate.type,
        name: beatTemplate.name,
        duration: beatTemplate.duration,
        durationRange: beatTemplate.durationRange,
        purpose: beatTemplate.purpose,
        
        // 核心叙事内容
        narrativeContent: {
          mustInclude: beatTemplate.mustInclude,
          visualScale: beatTemplate.visualScale,
          ecologicalEmbed: ecologicalEmbed
        },
        
        // 情绪目标
        emotionalTarget: {
          emotion: baseEmotion.emotion,
          intensity: baseEmotion.intensity,
          humanReaction: this._inferHumanReaction(beatTemplate.type, archetype.name)
        },
        
        // 4层认知落差
        misunderstandingLayers: beatTemplate.misunderstandingLayers || this._generateDefaultLayers(beatTemplate.type, archetype),
        
        // 视觉语法
        visualGrammar: visualGrammar,
        
        // 反转质量预估
        reversalQuality: this._calculateReversalQuality(beatTemplate.type, archetype.name, index, template.beats.length)
      };
    });
  }

  /**
   * 生成生态嵌入描述
   */
  _generateEcologicalEmbed(beat, archetype, beastName, habitat) {
    // 根据节拍类型和原型生成生态级描述
    const behaviors = {
      guardian: {
        hook: `${beastName}的身体与${habitat || 'Nirath环境'}的光脉/能量流同步脉动，这不是展示力量，是调节生态平衡的生理反应`,
        deepening: `${beastName}的姿态扩张是${habitat || '环境'}能量过载时的自然防御，如同免疫系统发炎`,
        crack: `${beastName}的"阻挡"动作精确地拦截了能量乱流，小G尚未意识到的危险被默默化解`,
        flip: `${beastName}转身背对小G，面向${habitat || '生态核心'}——它一直在守护的不是领地，是整个${habitat || '生态区'}`,
        resonance: `${habitat || 'Nirath'}的光脉因${beastName}的调节而平稳流动，这是它每日每夜无声的承担`
      },
      prisoner: {
        hook: `${beastName}身上的封印发光不是警告，是封印强度实时监控——它在承受，不是在威胁`,
        deepening: `${beastName}展示伤痕是封印即将破裂时的求救信号，而非攻击前奏`,
        crack: `${beastName}避开小G的视线——不是傲慢，是害怕封印被触发会伤害无辜`,
        flip: `封印核心处，${beastName}主动展示给小G看——"我的诅咒保护了你"`,
        resonance: `${beastName}的伤痕在${habitat || 'Nirath'}月光下显得神圣——这是自愿的枷锁`
      },
      // 其他原型可扩展...
    };
    
    const archetypeId = Object.keys(this.archetypesData.archetypes).find(
      id => this.archetypesData.archetypes[id].name === archetype.name
    ) || 'guardian';
    
    const archetypeBehaviors = behaviors[archetypeId] || behaviors['guardian'];
    return archetypeBehaviors[beat.type] || `${beastName}的行为在${habitat || 'Nirath'}有其生态功能`;
  }

  /**
   * 生成视觉语法
   */
  _generateVisualGrammar(beat, archetype, beatIndex, totalBeats) {
    const scalePatterns = archetype.visualLanguage?.scalePattern || ['中观', '中观→微观'];
    
    return {
      scale: beat.visualScale || scalePatterns[beatIndex % scalePatterns.length],
      bodyLanguage: {
        misunderstanding: archetype.visualLanguage?.bodyLanguage?.misunderstanding || '姿态扩张',
        truth: archetype.visualLanguage?.bodyLanguage?.truth || '姿态柔和'
      },
      cameraCue: this._generateCameraCue(beat.type, beatIndex, totalBeats),
      lightingCue: this._generateLightingCue(beat.type, archetype.name),
      scaleJump: beatIndex > 0 && beatIndex < totalBeats - 1 // 中间节拍有尺度跳跃
    };
  }

  /**
   * 生成镜头提示
   */
  _generateCameraCue(beatType, beatIndex, totalBeats) {
    const cues = {
      hook: '生态级航拍缓慢下降，双恒星橙紫光芒交织',
      deepening: '斯坦尼康跟随，从低角度仰拍异兽',
      crack: '微距镜头缓慢推进，生态级细节特写',
      flip: 'FPV俯冲环绕，从异兽视角转向生态级全景',
      resonance: '远景定格，异兽与小G在Nirath尺度下的 silhouettes',
      daily: '固定机位延时摄影，异兽日常行为的自然记录',
      revelation: '360度环绕航拍，生态级→微观→生态级',
      cost: '特写异兽封印/伤痕核心，光影在痛苦处雕刻',
      inheritance: '双恒星光芒穿透云层，照亮异兽守护的领地'
    };
    return cues[beatType] || '专业电影级运镜';
  }

  /**
   * 生成光线提示
   */
  _generateLightingCue(beatType, archetypeName) {
    const lighting = {
      hook: '双恒星自然光，冷暖色调交织，侧面柔和洒落',
      deepening: '光脉生物发光增强，异兽特征被光脉勾勒',
      crack: '阴影开始移动，暗示光源/能量流向变化',
      flip: '顶光暖金色洒落，如同生态系统的认可',
      resonance: '柔和暮光，光脉余辉在环境中脉动',
      daily: '自然日光，Nirath双星的温和照明',
      revelation: '戏剧性光比，阴影与光芒的极致对比',
      cost: '底光向上，封印/伤痕在暗光中发光',
      inheritance: '双恒星同时照耀，光芒交织成神圣光柱'
    };
    return lighting[beatType] || '自然光+补光+轮廓光三层体系';
  }

  /**
   * 推断人类（小G）反应
   */
  _inferHumanReaction(beatType, archetypeName) {
    const reactions = {
      hook: '后退/握紧指南针/警觉观察',
      deepening: '恐惧/转身想逃/身体僵硬',
      crack: '迟疑/歪头/停下逃跑',
      flip: '理解萌芽/模仿异兽动作/主动靠近',
      resonance: '伸手/并肩站立/眼神温柔',
      daily: '远距离观察/好奇但保持安全',
      revelation: '震惊/跪坐/敬畏',
      cost: '共情/伸手触碰伤痕/眼泪',
      inheritance: '庄严/接受使命/目送'
    };
    return reactions[beatType] || '自然反应';
  }

  /**
   * 生成默认认知落差层
   */
  _generateDefaultLayers(beatType, archetype) {
    const patterns = {
      hook: {
        audience: `这${archetype.name}看起来好可怕`,
        human: '那是什么？我要小心',
        beast: '有人类闯入。警戒模式。',
        ecosystem: '外来生命体进入'
      },
      deepening: {
        audience: `${archetype.name}在展示力量，这是威胁`,
        human: '它在攻击我！',
        beast: '他误解了。我需要阻止他。',
        ecosystem: '能量扰动'
      },
      crack: {
        audience: `等等，${archetype.name}的行为不太对……`,
        human: '它没追来？',
        beast: '他停下了。第一次。',
        ecosystem: '能量流向变化'
      },
      flip: {
        audience: `原来${archetype.name}不是在威胁……`,
        human: '你……你在保护我？',
        beast: '他终于看见了。',
        ecosystem: '共生关系萌芽'
      },
      resonance: {
        audience: `${archetype.name}的${archetype.coreDrive}……`,
        human: '我不会再怕你了。',
        beast: '终于不孤独了。',
        ecosystem: '共生关系确立'
      }
    };
    return patterns[beatType] || patterns['hook'];
  }

  /**
   * 计算反转质量分数
   */
  _calculateReversalQuality(beatType, archetypeName, beatIndex, totalBeats) {
    if (beatType === 'flip') return 85;
    if (beatType === 'revelation') return 95;
    if (beatType === 'crack') return 60;
    if (beatType === 'resonance') return 75;
    return 40;
  }

  /**
   * Step 5: 转换为标准story-plan格式
   */
  _convertToStoryPlan(beats, archetype, psyche, input) {
    const { beastName, duration, habitat, xiaoGContext } = input;
    
    // 将节拍转换为shots
    const shots = beats.map((beat, index) => ({
      id: `S${String(index + 1).padStart(2, '0')}`,
      act: this._beatTypeToAct(beat.type),
      actIndex: index + 1,
      duration: beat.duration,
      timeRange: `${this._calculateTimeStart(beats, index)}-${this._calculateTimeStart(beats, index) + beat.duration}s`,
      type: this._beatTypeToShotType(beat.type),
      title: `${beat.name}: ${beastName}的${this._getBehaviorTitle(beat.type, archetype.name)}`,
      
      // 增强描述（核心！）
      description: this._generateEnhancedDescription(beat, archetype, psyche, beastName, habitat),
      
      // 情绪
      emotion: beat.emotionalTarget.emotion,
      emotionStart: beat.emotionalTarget.emotion,
      emotionEnd: this._getNextBeatEmotion(beats, index),
      tension: beat.emotionalTarget.intensity,
      
      // 镜头
      camera: beat.visualGrammar.cameraCue,
      lighting: beat.visualGrammar.lightingCue,
      
      // 角色
      characters: [beastName, '小G'],
      
      // BeastMind增强字段
      beastMind: {
        beatId: beat.id,
        beatType: beat.type,
        archetype: archetype.name,
        misunderstandingLayers: beat.misunderstandingLayers,
        ecologicalEmbed: beat.narrativeContent.ecologicalEmbed,
        visualScale: beat.narrativeContent.visualScale,
        reversalQuality: beat.reversalQuality,
        visualGrammar: beat.visualGrammar,
        narrativeCore: psyche.narrativeCore // 🆕 v2.0-Peng: 每个镜头携带四层内核（软性注入）
      }
    }));
    
    // 计算总shots和总duration
    const totalDuration = beats.reduce((sum, b) => sum + b.duration, 0);
    const totalShots = shots.length;
    
    return {
      title: input.title || `${beastName}：${psyche.burden}`,
      episode: input.episode || 'E01',
      outline: this._generateOutline(beats, archetype, psyche, beastName),
      worldview: 'nirath',
      styleProfile: 'nirath',
      targetDuration: totalDuration,
      totalDuration: totalDuration,
      totalShots: totalShots,
      aspectRatio: '16:9',
      
      metadata: {
        totalDuration: totalDuration,
        totalShots: totalShots,
        segments: 1,
        emotionCurve: beats.map(b => ({
          act: b.id,
          emotion: b.emotionalTarget.emotion
        })),
        template: 'beastmind_v1',
        videoType: 'shanhaijing_beast_pov'
      },
      
      // BeastMind核心字段
      beastMind: {
        version: this.version,
        archetype: archetype.name,
        archetypeEn: archetype.nameEn,
        psyche: psyche,
        burden: psyche.burden,
        narrativeCore: psyche.narrativeCore, // 🆕 v2.0-Peng: 四层角色内核(Want/Need/Ghost/Lie)
        ecologicalRole: psyche.ecologicalRole,
        beats: beats.map(b => ({
          id: b.id,
          type: b.type,
          emotionalTarget: b.emotionalTarget,
          reversalQuality: b.reversalQuality
        })),
        emotionalCurve: beats.map(b => ({
          beat: b.id,
          emotion: b.emotionalTarget.emotion,
          intensity: b.emotionalTarget.intensity
        })),
        reversalMode: this._selectTemplate(duration).reversalMode,
        reversalQuality: Math.round(beats.reduce((sum, b) => sum + (b.reversalQuality || 0), 0) / beats.length)
      },
      
      characters: [
        {
          id: 'beast',
          name: beastName,
          type: 'beast',
          role: 'deuteragonist',
          species: '异兽',
          description: input.beastDescription || `${beastName}，山海经异兽`,
          archetype: archetype.name
        },
        {
          id: 'xiaoG',
          name: '小G',
          type: 'human',
          role: 'protagonist',
          description: xiaoGContext || '8岁中国男孩，Nirath探险者'
        }
      ],
      
      // 兼容格式
      segments: [
        {
          id: 'act1',
          title: `${beastName}的${archetype.name}`,
          shots: shots
        }
      ],
      shots: shots
    };
  }

  // 辅助方法：节拍类型→幕名称
  _beatTypeToAct(beatType) {
    const map = {
      hook: '起/Setup',
      daily: '起/Setup',
      deepening: '承/Build',
      crack: '转/Turn',
      flip: '转/Turn',
      cost: '转/Turn',
      revelation: '高潮/Climax',
      inheritance: '合/Resolution',
      resonance: '合/Resolution'
    };
    return map[beatType] || '承/Build';
  }

  // 辅助方法：节拍类型→镜头类型
  _beatTypeToShotType(beatType) {
    const map = {
      hook: 'establishing',
      daily: 'establishing',
      deepening: 'action',
      crack: 'reveal',
      flip: 'climax',
      cost: 'closeup',
      revelation: 'climax',
      inheritance: 'resolution',
      resonance: 'resolution'
    };
    return map[beatType] || 'reveal';
  }

  // 辅助方法：计算时间起点
  _calculateTimeStart(beats, index) {
    let start = 0;
    for (let i = 0; i < index; i++) {
      start += beats[i].duration;
    }
    return start;
  }

  // 辅助方法：获取行为标题
  _getBehaviorTitle(beatType, archetypeName) {
    const titles = {
      hook: '初现',
      daily: '日常',
      deepening: '警戒',
      crack: '裂缝',
      flip: '真相',
      cost: '代价',
      revelation: '揭示',
      inheritance: '传承',
      resonance: '余韵'
    };
    return titles[beatType] || '时刻';
  }

  // 辅助方法：生成增强描述
  _generateEnhancedDescription(beat, archetype, psyche, beastName, habitat) {
    const parts = [
      // 1. 视觉动作
      beat.visualGrammar.cameraCue,
      
      // 2. 生态嵌入
      beat.narrativeContent.ecologicalEmbed,
      
      // 3. 4层认知落差中的生态层（作为深层含义）
      `（生态真相：${beat.misunderstandingLayers.ecosystem}）`,
      
      // 4. 光线氛围
      beat.visualGrammar.lightingCue,
      
      // 5. 人类反应
      `小G的反应：${beat.emotionalTarget.humanReaction || '自然反应'}`
    ];
    
    return parts.join('。');
  }

  // 辅助方法：获取下一个节拍的情绪
  _getNextBeatEmotion(beats, currentIndex) {
    if (currentIndex < beats.length - 1) {
      return beats[currentIndex + 1].emotionalTarget.emotion;
    }
    return '平静';
  }

  // 辅助方法：生成大纲
  _generateOutline(beats, archetype, psyche, beastName) {
    const beatSummaries = beats.map(b => `${b.name}：${b.purpose}`).join(' → ');
    return `${beastName}是${archetype.name}（${psyche.burden}）。${beatSummaries}。观众最终将理解：${archetype.reversalPattern}。`;
  }
}

// 导出
module.exports = { BeastMindEngine };

// CLI入口（用于独立测试）
if (require.main === module) {
  const engine = new BeastMindEngine();
  
  // 测试：饕餮60s
  const result = engine.generate({
    beastName: '饕餮',
    beastDescription: '羊身人面，虎齿人爪，目在腋下，其音如婴儿，食人。食量大，永远饥饿。',
    habitat: '钩吾山',
    duration: 60,
    title: '饕餮：饥饿的牢笼',
    episode: 'E01',
    xiaoGContext: '8岁中国男孩，Nirath探险者'
  });
  
  console.log('\n📄 生成的story-plan摘要:');
  console.log(`   标题: ${result.title}`);
  console.log(`   时长: ${result.totalDuration}s | 镜头: ${result.totalShots}`);
  console.log(`   原型: ${result.beastMind.archetype} | 兽负: ${result.beastMind.burden}`);
  console.log(`   反转模式: ${result.beastMind.reversalMode} | 平均质量: ${result.beastMind.reversalQuality}`);
  console.log(`\n   节拍结构:`);
  result.beastMind.beats.forEach(b => {
    console.log(`   ${b.id}: ${b.type} | 情绪: ${b.emotionalTarget.emotion}(${b.emotionalTarget.intensity}) | 质量: ${b.reversalQuality}`);
  });
  
  // 保存测试输出
  const testOutputPath = path.join(__dirname, '../../../productions/beastmind-test/test-beastmind-output.json');
  fs.writeFileSync(testOutputPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 测试输出保存到: ${testOutputPath}`);
}