/**
 * 感官语法注入器 — 软性Prompt升级 (v2.2-Peng)
 * 
 * 功能：在生成Seedance Prompt时，注入V2感官叙事语法 + 待机感与生命细节
 * 原则：不改Prompt数据结构，只在内容层注入感官词汇和待机动作
 * 
 * v2.2-Peng 更新：
 * + 🆕 数字人显假问题软性注入（扩展）
 *   - 生物节律参数：眨眼15-20次/分、呼吸12-20次/分、目光漂移2-5秒/次
 *   - 微表情系统：眉毛/眼角/嘴部/鼻翼的微小变化
 *   - 不完美=真实：动作中断、呼吸乱拍、头发滑落不整理
 *   - 情绪外化：用身体变化替代情绪标签
 *   - 来源：AI人物显假问题实战指南（大鹏2026-05-26）
 * + v2.1-Peng：待机感与生命细节软性注入
 *   - 注入点：inject()方法增加_injectIdlePresence()调用
 *   - 词汇库：刑天/九尾狐/烛龙/帝江/通用生物的待机动作与微反应
 *   - 来源：异兽显真引擎方法论（大鹏2026-05-26）
 * + 保持所有现有字段和架构不变
 */

const fs = require('fs');
const path = require('path');

class SensoryGrammarInjector {
  constructor() {
    this.vocabulary = this._loadVocabulary();
    this.templates = this._loadTemplates();
  }

  _loadVocabulary() {
    // 修复：路径应为 ../ 而非 ../../（从 skills/shanhaijing-render-engine 到 skills/shanhaijing-beast-archive）
    const vocabPath = path.join(__dirname, '../shanhaijing-beast-archive/sensory-vocabulary.json');
    if (fs.existsSync(vocabPath)) {
      return JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    }
    // 备选：绝对路径
    const fallbackPath = '/root/.openclaw/workspace/skills/shanhaijing-beast-archive/sensory-vocabulary.json';
    if (fs.existsSync(fallbackPath)) {
      return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    }
    return null;
  }

  _loadTemplates() {
    // 修复：路径应为 ../ 而非 ../../
    const templatePath = path.join(__dirname, '../shanhaijing-story-engine/config/narrative-templates.json');
    if (fs.existsSync(templatePath)) {
      return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    }
    // 备选：绝对路径
    const fallbackPath = '/root/.openclaw/workspace/skills/shanhaijing-story-engine/config/narrative-templates.json';
    if (fs.existsSync(fallbackPath)) {
      return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    }
    return null;
  }

  /**
   * 主注入方法
   * 输入：原始Prompt（现有数据结构）
   * 输出：注入感官语法后的Prompt（不改结构，只改内容）
   */
  inject(prompt, shot, beastMind) {
    let injected = prompt;
    
    // 1. 根据镜头类型注入对应感官语法
    injected = this._injectByBeatType(injected, shot, beastMind);
    
    // 2. 替换人类中心视角词汇
    injected = this._replaceHumanCentric(injected, beastMind);
    
    // 3. 注入情感身体化描述
    injected = this._injectEmotionBody(injected, shot, beastMind);
    
    // 4. 注入核心意象预埋
    injected = this._injectImagerySeeds(injected, shot, beastMind);
    
    // 🆕 v2.1-Peng: 注入待机感与生命细节（软性知识注入，不改架构）
    // 来源：异兽显真引擎方法论 —— 角色"不做大事"时的生命迹象
    injected = this._injectIdlePresence(injected, shot, beastMind);
    
    // 5. 最后镜头注入静默语法
    if (this._isLastShot(shot)) {
      injected = this._injectSilence(injected, beastMind);
    }
    
    return injected;
  }

  /**
   * 根据节拍类型注入语法
   */
  /**
   * 解析神兽名称（支持多种标识）
   * 优先级：species > archetype中文映射 > archetype拼音映射 > 'beast'
   */
  _resolveBeastName(beastMind) {
    if (!beastMind) return 'beast';
    
    // 1. 直接species字段
    if (beastMind.species) return beastMind.species;
    
    // 2. archetype到拼音的映射表
    const archetypeToPinyin = {
      '失衡者': 'xingtian',
      '九尾狐': 'jiuweihu',
      '烛龙': 'zhulong',
      '帝江': 'diJiang',
      '白泽': 'baize',
      '饕餮': 'taotie',
      '麒麟': 'qilin',
      '穷奇': 'qiongqi',
      '混沌': 'hundun',
      '梼杌': 'taowu'
    };
    
    // 3. 中文名到拼音的映射表
    const chineseToPinyin = {
      '刑天': 'xingtian',
      '九尾狐': 'jiuweihu',
      '烛龙': 'zhulong',
      '帝江': 'diJiang',
      '白泽': 'baize'
    };
    
    const archetype = beastMind.archetype || '';
    if (archetypeToPinyin[archetype]) return archetypeToPinyin[archetype];
    
    const species = beastMind.species || beastMind.name || '';
    if (chineseToPinyin[species]) return chineseToPinyin[species];
    
    return 'beast';
  }

  _injectByBeatType(prompt, shot, beastMind) {
    // 修复：支持多种beast标识查找（species > archetype > 中文名映射）
    const beastName = this._resolveBeastName(beastMind);
    const vocab = this.vocabulary?.beasts?.[beastName]?.vocabulary;
    
    if (!vocab) {
      console.log(`  [SensoryGrammar] i️ 未找到词汇库: ${beastName}`);
      return prompt;
    }

    // v2.3-Peng: 注入器内置长度保护系统
    // 原则：注入内容不得导致Prompt超限（>990字符）
    // 降级优先级：尾部追加 > 前缀词 > 最小替换 > 跳过
    const MAX_PROMPT_LENGTH = 990;
    const SAFE_MARGIN = 10; // 🆕 v3.3-Peng-fix: 安全边距增加到10，避免边缘超限
    const MAX_ALLOWED = MAX_PROMPT_LENGTH - SAFE_MARGIN; // 980
    
    const shotType = shot?.type || shot?.shotType || 'action';
    const beatType = shot?.beatType || '';
    const emotion = shot?.emotion || shot?.emotionalTarget?.emotion || '';
    
    // 获取对应类型的感官前缀词（从词汇库 perspectivePrefix 读取）
    const fullPrefix = vocab.perspectivePrefix?.[shotType] || vocab.see || '感知';
    const shortPrefix = vocab.see || '感知'; // 降级用更短前缀
    
    // ========== 阶段1：计算各注入内容长度 ==========
    const prefixInjection = `从${beastName}的${fullPrefix}中，`;
    const shortPrefixInjection = `从${beastName}的${shortPrefix}中，`;
    const fearInjection = ` . ${vocab.fear || '战魂震颤，能量场波动'}`;
    const sadnessInjection = ` . ${vocab.sadness || '感知范围内的生命波动减少，像灯被吹灭'}`;
    const silenceInjection = ` . 最后${shot.duration || 8}秒绝对静默，只有${vocab.memory || '远古的频率'}在${vocab.see || '感知中'}呼吸`;
    
    // ========== 阶段2：按优先级注入，随时检查长度 ==========
    
    // P0: 基础替换 cinematic shot（尝试类型化前缀，超限降级到最短前缀）
    const hasSensoryGrammar = /从\w+的\w+(扫描|感知|解码|传递|中)/.test(prompt);
    if (!hasSensoryGrammar) {
      // 先尝试类型化完整前缀
      const typePrefix = vocab.perspectivePrefix?.[shotType];
      const typeInjection = typePrefix ? `从${beastName}的${typePrefix}中，` : null;
      const shortInjection = `从${beastName}的${shortPrefix}中，`;
      
      if (typeInjection) {
        const afterType = prompt.replace(/cinematic shot/i, typeInjection);
        if (afterType.length <= MAX_ALLOWED) {
          prompt = afterType;
          console.log(`  [SensoryGrammar] ✅ 类型化感官前缀已注入 (${typeInjection})`);
        } else {
          // 类型化前缀超限，降级到最短前缀
          const afterShort = prompt.replace(/cinematic shot/i, shortInjection);
          if (afterShort.length <= MAX_ALLOWED) {
            prompt = afterShort;
            console.log(`  [SensoryGrammar] ⚠️ 类型化前缀超限(${afterType.length})，降级注入 (${shortInjection})`);
          } else {
            console.log(`  [SensoryGrammar] ⚠️ Prompt过长(${prompt.length}字符)，跳过前缀注入以避免超限`);
          }
        }
      } else {
        // 无类型化前缀定义，用最短前缀
        const afterShort = prompt.replace(/cinematic shot/i, shortInjection);
        if (afterShort.length <= MAX_ALLOWED) {
          prompt = afterShort;
          console.log(`  [SensoryGrammar] ✅ 基础感官前缀已注入 (${shortInjection})`);
        }
      }
    }
    
    // P1: 尾部情感注入（可降级跳过）
    let tailInjections = [];
    
    // 动作/承幕镜头：注入战意/情感震颤
    if (beatType === 'resonance' || shotType === 'action' || emotion === '恐惧' || emotion === '害怕') {
      if (!prompt.includes(vocab.fear || '')) {
        tailInjections.push({ content: fearInjection, type: 'fear' });
      }
    }
    
    // 揭示/转幕镜头：注入困惑/震撼语法
    if (beatType === 'insight' || shotType === 'reveal' || shotType === 'climax') {
      if (!prompt.includes(vocab.anger || '') && !prompt.includes(vocab.sadness || '')) {
        tailInjections.push({ content: sadnessInjection, type: 'sadness' });
      }
    }
    
    // 结尾/合幕镜头：注入余震/静默语法
    if (beatType === 'aftermath' || shotType === 'resolution' || shotType === 'ending') {
      if (!prompt.includes('静默') && !prompt.includes('无声')) {
        tailInjections.push({ content: silenceInjection, type: 'silence' });
      }
    }
    
    // 按优先级逐个注入，超限即停
    for (const injection of tailInjections) {
      const projectedLength = prompt.length + injection.content.length;
      if (projectedLength <= MAX_ALLOWED) {
        prompt += injection.content;
        console.log(`  [SensoryGrammar] ✅ ${injection.type}注入成功`);
      } else {
        console.log(`  [SensoryGrammar] ⚠️ ${injection.type}注入跳过(投影${projectedLength} > ${MAX_ALLOWED})`);
      }
    }
    
    return prompt;
  }

  /**
   * 替换人类中心视角
   */
  _replaceHumanCentric(prompt, beastMind) {
    const beastName = this._resolveBeastName(beastMind);
    
    // 常见人类中心视角替换
    const replacements = [
      {
        from: /一个孩子走进峡谷/,
        to: `一个频率穿透地脉，轻得像谎言，却真实得像记忆`
      },
      {
        from: /孩子看到/,
        to: `从${beastName}的感知中，一个身影出现`
      },
      {
        from: /孩子抬头/,
        to: `感知范围内，一个波动向上移动`
      },
      {
        from: /孩子伸出手/,
        to: `一个频率靠近，像温暖的光在扩散`
      },
      {
        from: /男孩看到/,
        to: `从${beastName}的感知中，一个生命体出现`
      },
      {
        from: /人类看到/,
        to: `从${beastName}的感知中，一个入侵者切入`
      }
    ];
    
    for (const rep of replacements) {
      prompt = prompt.replace(rep.from, rep.to);
    }
    
    return prompt;
  }

  /**
   * 注入情感身体化描述
   */
  _injectEmotionBody(prompt, shot, beastMind) {
    const emotion = shot.emotionalTarget?.emotion || '';
    const beastName = this._resolveBeastName(beastMind);
    const vocab = this.vocabulary?.beasts?.[beastName]?.vocabulary;
    
    if (!vocab) return prompt;
    
    // 根据情感类型注入对应的身体化描述
    const emotionMap = {
      '恐惧': vocab.fear,
      '害怕': vocab.fear,
      '温暖': vocab.warmth,
      '孤独': vocab.loneliness,
      '愤怒': vocab.anger,
      '悲伤': vocab.sadness,
      '希望': vocab.hope,
      '记忆': vocab.memory,
      '死亡': vocab.death,
      '传承': vocab.legacy
    };
    
    const bodyDesc = emotionMap[emotion];
    if (bodyDesc && !prompt.includes(bodyDesc)) {
      // 在Prompt末尾追加身体化描述（确保不超出长度限制）
      const maxLength = 490; // 汉字上限
      if ((prompt + bodyDesc).length <= maxLength) {
        prompt += ` . ${bodyDesc}`;
      }
    }
    
    return prompt;
  }

  /**
   * 注入核心意象预埋
   */
  _injectImagerySeeds(prompt, shot, beastMind) {
    const beastName = this._resolveBeastName(beastMind);
    const imagery = this.vocabulary?.beasts?.[beastName]?.coreImagery;
    
    if (!imagery) return prompt;
    
    // 只在第一幕和第二幕注入预埋
    const isEarlyShot = shot.sequence && shot.sequence <= 3;
    if (!isEarlyShot) return prompt;
    
    // 检查是否已经包含预埋线索
    const hasSeed = imagery.prePlanting.some(seed => prompt.includes(seed));
    
    if (!hasSeed && imagery.prePlanting.length > 0) {
      // 选择一个预埋线索注入
      const seed = imagery.prePlanting[0];
      if (prompt.length + seed.length <= 490) {
        prompt += ` . ${seed}`;
      }
    }
    
    return prompt;
  }

  /**
   * 注入静默语法
   */
  _injectSilence(prompt, beastMind) {
    const beastName = this._resolveBeastName(beastMind);
    
    // 检查是否已经有静默设计
    if (prompt.includes('静默') || prompt.includes('无声') || prompt.includes('空镜')) {
      return prompt;
    }
    
    // 注入静默语法
    const silencePhrase = `最后8秒绝对静默，只有${beastName}的感知在空气中残留`;
    
    if (prompt.length + silencePhrase.length <= 490) {
      prompt += ` . ${silencePhrase}`;
    }
    
    return prompt;
  }

  /**
   * 判断是否为最后一个镜头
   */
  _isLastShot(shot) {
    // 简化判断：如果shot没有next字段，或者是ending类型
    return shot.type === 'ending' || shot.type === 'aftermath' || shot.isLast === true;
  }

  /**
   * 🆕 v2.1-Peng: 注入待机感与生命细节
   * 来源：异兽显真引擎方法论 —— AI角色显假不是因为五官，而是因为"太闲"
   * 核心公式：人物 + 正在做的小事 + 下意识反应 + 情绪落点
   * 原则：不改Prompt结构，只在角色描述层注入待机动作和生命反应
   * 
   * 🆕 v2.2-Peng 扩展：数字人显假问题实战指南
   * 新增注入：
   * - 生物节律参数（眨眼15-20次/分，呼吸12-20次/分）
   * - 微表情系统（眉毛/眼角/嘴部/鼻翼的微小变化）
   * - 不完美=真实（动作中断、瑕疵、自然sloppiness）
   * - 互动链（多人场景：一人行动，一人反应）
   * - 视线漂移（目光每2-5秒微调，避免死盯）
   */
  _injectIdlePresence(prompt, shot, beastMind) {
    const beastName = this._resolveBeastName(beastMind);
    
    // 待机感词汇库 —— 异兽特化版待机动作与生命反应
    const idleVocabulary = {
      xingtian: {
        // 刑天（战魂）—— 半虚半实的能量体
        idleActions: [
          '能量触须无意识缠绕脚边岩石碎片，三千年养成的习惯',
          '能量场边缘无意识地微微波动，像冷风中动物的毛发',
          '能量核心在胸腔内缓慢自转，低频嗡鸣约40Hz',
          '战魂的一侧无意识地"倚"在岩壁上，半虚半实',
          '两根能量触须相互摩擦产生微光，无意识的习惯'
        ],
        microReactions: [
          '能量脉动比平时慢15%，振幅增大——深度走神状态',
          '战魂核心频率从低频嗡鸣微微升高，加入不规则颤抖',
          '能量场边缘毛边无意识颤抖，像冷风中动物的毛发',
          '感知焦点从峡谷入口移开，无目的地在岩壁上游走'
        ],
        emotionalAnchors: [
          '孤独不是姿态，是这种连自己都意识不到的下意识',
          '能量触须停顿在半空，比平常久了两秒——某种变化发生了',
          '战魂的频率从防御性低频变成带着问号的波动'
        ]
      },
      jiuweihu: {
        // 九尾狐 —— 银白狐仙
        idleActions: [
          '尾巴尖轻咬自己的毛尖，整理毛发时的无意识动作',
          '耳朵间歇性抖动，整理听觉方位的习惯性动作',
          '前爪轻拨地面上的小石子，等待时的无聊动作',
          '下巴搁在前爪上，九条尾巴无意识地铺开',
          '舔爪子的动作比实际需要多几下，焦虑的惯性'
        ],
        microReactions: [
          '瞳孔在光线变化时收缩，琥珀色眼瞳闪过一丝金色',
          '耳朵转向声音来源，但身体保持不动——警觉的松弛',
          '尾巴无意识地轻扫地面，像思绪的外在延伸',
          '呼吸带动腹部绒毛微微起伏，银白色三层被毛 shimmer'
        ],
        emotionalAnchors: [
          '魅惑不是表情，是眼神飘移时那0.3秒的失焦',
          '尾巴突然停止摆动，像说话说到一半突然沉默',
          '耳朵向后微微压平，但立刻恢复——情绪泄露的微瑕'
        ]
      },
      zhulong: {
        // 烛龙 —— 时间之神，赤红龙身
        idleActions: [
          '时间线在某一点轻微"打结"，过去与现在的重叠',
          '热成像的额前区域无意识地闪烁，像思绪的温度变化',
          '眼中的时间沙漏缓慢倒转，记忆回流的物理表现',
          '脖颈（时间的通道）微微弯曲，承载万年重量的惯性',
          '龙须之间的时空火花无意识地跳跃，能量的外溢'
        ],
        microReactions: [
          '赤红鳞片的光热输出微微降低——进入回忆模式',
          '眼中的垂直瞳孔在注视时收缩，走神时扩散',
          '呼吸带动岩浆般的能量在鳞片下缓缓流动',
          '时间感知出现0.5秒的"漏拍"——心理活动的证据'
        ],
        emotionalAnchors: [
          '万年孤独不是叹息，是时间流速在某一瞬的变慢',
          '眼中的火焰从炽白变成暗红——不是愤怒，是疲惫',
          '龙须在感知到某个频率时突然静止——记忆的触发'
        ]
      },
      dijiang: {
        // 帝江 —— 混沌，无形无面
        idleActions: [
          '混沌云雾无意识地缓慢旋转，像深呼吸的节律',
          '无形的边缘偶尔凝结出短暂的形状，又立刻消散',
          '混沌核心处的颜色无意识地深浅变化——情绪的温度',
          '周围的空气因混沌的"呼吸"而产生微弱的扭曲'
        ],
        microReactions: [
          '混沌的"呼吸"节奏突然改变——感知到了什么',
          '云雾的旋转方向无意识地反转——思维的转向',
          '混沌内部出现短暂的"清晰"——像灵光一闪',
          '边缘的波纹比平时更密——警觉的生理表现'
        ],
        emotionalAnchors: [
          '混沌不是空无一物，是包含太多而无法成形',
          '那瞬间的"清晰"比永恒的混沌更让人心疼',
          '无形的存在渴望被看见——这是帝江的悖论'
        ]
      },
      human_child: {
        // 🆕 v2.2-Peng: 小G的"真实感"来自人类儿童的生物节律与微动作
        idleActions: [
          '等待时脚尖无意识点地打拍子，或手指轻敲指南针表壳',
          '思考时咬下唇或手指轻敲脸颊，眼神飘向虚空某点',
          '紧张时搓手指、整理衣服拉链、左脚鞋尖蹭地面画半圆',
          '兴奋时身体重心前倾，双手 gesturing animatedly',
          '无聊时反复解锁-锁屏-再解锁，没有实际目的',
          '发呆时下巴搁在膝盖上，目光落在窗外虚无点'
        ],
        microReactions: [
          '自然眨眼15-20次/分钟，专注时降至8-12次，走神时不规律',
          '呼吸带动胸部微微起伏，平静时18-22次/分钟',
          '眼神每2-5秒微调一次注视点，避免死盯某处',
          '眉毛随情绪瞬间上扬或压低，泄露内心活动',
          '嘴角微不可察的抽动，抑制情绪时的身体信号'
        ],
        emotionalAnchors: [
          '真实感不在大动作里，在转杯子的那只手里',
          '等待时的姿态比战斗时的姿态更真实',
          '那个无意识的小动作，泄露了孩子最深的秘密'
        ]
      },
      default: {
        // 🆕 v2.2-Peng: 通用生物待机感 —— 不完美=真实
        idleActions: [
          '无意识地轻触身边的物体，确认存在的习惯性动作',
          '呼吸节奏微微改变，进入等待时的自然状态',
          '目光无意识地飘向虚空某点，思绪的外在痕迹',
          '身体重心微调，从左脚移到右脚的微小转移',
          '手指无意识摩挲手中物品，思考时的习惯性动作',
          '头发从耳后滑落，没有立即整理——专注中无暇顾及'
        ],
        microReactions: [
          '瞳孔在思考时收缩，走神时扩散',
          '呼吸带动身体微微起伏，与情绪同步',
          '某个习惯性小动作比平时快或慢——心理变化的证据',
          '眼神从当前对象移开，看向虚空某点——走神的外在表现',
          '自然眨眼，间隔有20-30%的随机波动',
          '微表情泄露：与主情绪矛盾的瞬间表情'
        ],
        emotionalAnchors: [
          '真实感不在大动作里，在转杯子的那只手里',
          '等待时的姿态比战斗时的姿态更真实',
          '那个无意识的小动作，泄露了角色最深的秘密',
          '不完美才是真实——动作中途改变、眼神不知看哪、呼吸乱拍'
        ]
      }
    };
    
    const vocab = idleVocabulary[beastName] || idleVocabulary.default;
    
    // 检查Prompt中是否已经有待机感描述
    const hasIdle = /无意识|下意识|习惯|走神|呼吸|脉动|微动/.test(prompt);
    if (hasIdle) return prompt;
    
    // 🆕 v2.2-Peng: 随机选择一个待机动作、一个微反应、一个情绪落点
    // 使用确定性随机，保证同一次生成的一致性
    const seed = prompt.length + (shot.id || '').length;
    const idx1 = seed % vocab.idleActions.length;
    const idx2 = (seed * 7) % vocab.microReactions.length;
    const idx3 = (seed * 13) % vocab.emotionalAnchors.length;
    
    const idleAction = vocab.idleActions[idx1];
    const microReaction = vocab.microReactions[idx2];
    const emotionalAnchor = vocab.emotionalAnchors[idx3];
    
    // 构建待机感注入段落
    const idleInjection = `，${idleAction}，${microReaction}，${emotionalAnchor}`;
    
    // 在Prompt末尾注入（确保不超出长度限制）
    const MAX_PROMPT_LENGTH = 990;
    const SAFE_MARGIN = 10;
    if ((prompt + idleInjection).length <= MAX_PROMPT_LENGTH - SAFE_MARGIN) {
      prompt += idleInjection;
      console.log(`  [SensoryGrammar] ✅ 待机感注入成功 (${beastName})`);
    } else {
      console.log(`  [SensoryGrammar] ⚠️ 待机感注入跳过(投影${prompt.length + idleInjection.length} > ${MAX_PROMPT_LENGTH - SAFE_MARGIN})`);
    }
    
    return prompt;
  }

  /**
   * 生成钻石台词
   * 输入：beastMind + 当前节拍
   * 输出：一句钻石台词（多层含义）
   */
  generateDiamondLine(beastMind, beatType) {
    const beastName = beastMind?.species || 'beast';
    const narrative = this.vocabulary?.beasts?.[beastName]?.narrativeCore;
    
    if (!narrative) return null;
    
    // 根据节拍类型生成对应的钻石台词
    const lines = {
      'resistance': {
        surface: '你不该来。',
        hidden: '我害怕被看见。',
        emotional: '三千年来的第一句话。'
      },
      'curiosity': {
        surface: '你是谁？',
        hidden: '为什么你没有恐惧？',
        emotional: '第一次有人不带恐惧地靠近。'
      },
      'resonance': {
        surface: '战魂在颤抖。',
        hidden: '不是因为愤怒。',
        emotional: '是因为有人在看我。'
      },
      'retreat': {
        surface: '不...',
        hidden: '我不需要任何人。',
        emotional: '战意应该将她碾碎。'
      },
      'fall': {
        surface: '三千年...',
        hidden: '它一直在等。',
        emotional: 'Need终于浮出水面。'
      }
    };
    
    return lines[beatType] || null;
  }
}

module.exports = { SensoryGrammarInjector };