/**
 * PromptForge 总导演 v1.0-Peng
 * 
 * Stage 1: 理解
 * 调用子系统获取素材，建立全片创作意图
 */

const fs = require('fs');
const path = require('path');

class PromptForgeDirector {
  constructor(options = {}) {
    this.projectDir = options.projectDir || process.cwd();
    this.verbose = options.verbose !== false;
  }

  /**
   * 创建导演创作意图
   */
  async createIntent(beastId, storyPlan, projectConfig) {
    // 1. 调用神兽档案库
    const beastProfile = this._loadBeastProfile(beastId);
    
    // 2. 调用Nirath星球档案
    const nirathElements = this._loadNirathElements();
    
    // 3. 调用导演风格库
    const styleChoices = this._selectDirectorStyles(storyPlan?.emotion || 'mysterious');
    
    // 4. 构建创作意图
    const intent = {
      coreTheme: this._deriveCoreTheme(beastProfile, storyPlan),
      emotionArc: this._buildEmotionArc(storyPlan),
      styleChoices: styleChoices,
      visualTone: this._deriveVisualTone(styleChoices, nirathElements),
      narrativePrinciples: this._loadNarrativePrinciples(),
      beastProfile: beastProfile,
      nirathElements: nirathElements,
      timestamp: new Date().toISOString()
    };
    
    return intent;
  }

  /**
   * 加载神兽档案
   */
  _loadBeastProfile(beastId) {
    try {
      // 尝试多个路径
      const possiblePaths = [
        path.join(this.projectDir, `productions/${beastId}/02-story-plan/beast-profile.json`),
        path.join(__dirname, `../../shanhaijing-beast-archive/beasts/${beastId}.json`),
        path.join(__dirname, `../../shanhaijing-beast-archive/beasts/${this._toPinyin(beastId)}.json`)
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const profile = JSON.parse(fs.readFileSync(p, 'utf8'));
          console.log(`  [Director] 📚 神兽档案加载: ${beastId}`);
          return profile;
        }
      }
    } catch (e) {
      console.warn(`  [Director] ⚠️ 无法加载神兽档案: ${beastId}`);
    }
    
    // 返回默认档案
    return this._getDefaultBeastProfile(beastId);
  }

  /**
   * 加载Nirath星球元素
   */
  _loadNirathElements() {
    // 调用 world-engine 或返回默认元素
    const defaultElements = [
      '双日暮光 (3200K+5600K)',
      '能量河流 (虹彩光芒)',
      '光脉网络 (地壳裂缝)',
      '发光孢子 (蓝绿荧光)',
      '硅基植物 (半透明蓝紫)',
      '断裂山脉 (不周山遗迹)',
      '能量结晶卵石 (玛瑙质)'
    ];
    
    console.log(`  [Director] 🌍 Nirath元素加载: ${defaultElements.length} 项`);
    return defaultElements;
  }

  /**
   * 选择导演风格
   */
  _selectDirectorStyles(emotionBase) {
    const styles = [];
    
    // 根据情绪基调选择导演
    const styleMap = {
      'mysterious': [
        { name: '维伦纽瓦', reason: '巨物敬畏，适合开场建立神话感', films: ['Dune', 'Arrival'] },
        { name: '塔可夫斯基', reason: '时间诗性，适合沉眠与苏醒的冥想', films: ['Stalker', 'Mirror'] }
      ],
      'awe': [
        { name: '维伦纽瓦', reason: '巨物敬畏，史诗尺度', films: ['Dune', 'Blade Runner 2049'] },
        { name: '斯皮尔伯格', reason: '奇迹感，人类与巨物的温柔相遇', films: ['Close Encounters'] }
      ],
      'tense': [
        { name: '诺兰', reason: '时间张力，紧迫感', films: ['Dunkirk', 'Inception'] },
        { name: '维伦纽瓦', reason: '静默张力', films: ['Sicario', 'Prisoners'] }
      ],
      'fury': [
        { name: '扎克·施奈德', reason: '力量美学，战斗仪式感', films: ['300', 'Man of Steel'] },
        { name: '维伦纽瓦', reason: '史诗狂暴', films: ['Dune'] }
      ],
      'climax': [
        { name: '维伦纽瓦', reason: '终极力量感', films: ['Dune'] },
        { name: '宫崎骏', reason: '温柔中的力量', films: ['Princess Mononoke'] }
      ],
      'transcendence': [
        { name: '塔可夫斯基', reason: '超越性诗性', films: ['Mirror', 'Stalker'] },
        { name: '宫崎骏', reason: '温柔超越', films: ['Spirited Away'] }
      ]
    };
    
    const matched = styleMap[emotionBase] || styleMap['mysterious'];
    
    // 选择1-2位导演
    const selected = matched.slice(0, 2);
    
    console.log(`  [Director] 🎨 导演风格选择 (${emotionBase}): ${selected.map(s => s.name).join(' + ')}`);
    
    return selected;
  }

  /**
   * 推导核心主题
   */
  _deriveCoreTheme(beastProfile, storyPlan) {
    const beastName = beastProfile?.name || '未知神兽';
    const beastTraits = beastProfile?.traits || ['孤独', '永恒'];
    
    // 基于异兽特征和故事计划推导主题
    const themes = [
      '孤独者的相互发现',
      '永恒与瞬间的相遇',
      '沉睡与唤醒的循环',
      '巨物与渺小的温柔碰撞',
      '战魂与童心的共鸣'
    ];
    
    // 根据神兽特征选择最匹配的主题
    if (beastTraits.includes('headless') || beastTraits.includes('warrior')) {
      return '战魂的永恒孤独与童心的唤醒';
    }
    if (beastTraits.includes('serpent') || beastTraits.includes('dragon')) {
      return '古老智慧与新生好奇的交汇';
    }
    
    return themes[0];
  }

  /**
   * 构建情绪弧线
   */
  _buildEmotionArc(storyPlan) {
    const segments = storyPlan?.segments || [];
    
    // 从故事段提取情绪递进
    const emotions = segments.map(s => s.emotion || 'mysterious');
    
    // 如果没有情绪，使用默认弧线
    if (emotions.length === 0) {
      return ['沉眠', '惊扰', '困惑', '共鸣', '觉醒', '释放', '碰撞', '超越'];
    }
    
    return emotions;
  }

  /**
   * 推导视觉基调
   */
  _deriveVisualTone(styleChoices, nirathElements) {
    const primaryStyle = styleChoices[0]?.name || '维伦纽瓦';
    
    const toneMap = {
      '维伦纽瓦': '巨物敬畏中的温柔相遇，史诗尺度与微观细节的并置',
      '塔可夫斯基': '时间的诗性流淌，记忆与梦境的模糊边界',
      '宫崎骏': '温柔的自然力量，生命与环境的和谐共生',
      '诺兰': '紧迫的时间张力，信息密度与视觉清晰度的平衡',
      '斯皮尔伯格': '奇迹的平民视角，日常中的超自然显现'
    };
    
    return toneMap[primaryStyle] || toneMap['维伦纽瓦'];
  }

  /**
   * 加载叙事原则
   */
  _loadNarrativePrinciples() {
    return [
      '异兽视角：人类是闯入者，故事由异兽的感知驱动',
      '心灵碰撞：不是战斗，而是两个孤独灵魂的相互发现',
      '时间尺度：异兽以地质年代思考，人类以心跳思考',
      '非语言感知：震颤、共鸣、回响，替代视觉描述',
      'Nirath原生：所有元素必须是星球的自然/生物/地质现象'
    ];
  }

  /**
   * 获取默认神兽档案
   */
  _getDefaultBeastProfile(beastId) {
    const defaults = {
      'xingtian': {
        name: '刑天',
        traits: ['headless', 'warrior', 'eternal'],
        appearance: {
          body: '无头躯干，以乳为目，以脐为口',
          material: '暗金晶化金属质感',
          weapons: '干（盾）、戚（斧）'
        },
        abilities: ['战魂不灭', '地脉共鸣', '金属化身躯'],
        personality: {
          archetype: '永恒的战士',
          timeScale: '三千年像昨天',
          perception: '非视觉，通过震颤和共鸣感知世界'
        }
      }
    };
    
    return defaults[beastId] || {
      name: beastId,
      traits: ['mysterious', 'ancient'],
      appearance: { body: '未知形态' },
      abilities: [],
      personality: { archetype: '神秘异兽' }
    };
  }

  /**
   * 中文转拼音（简化版）
   */
  _toPinyin(chinese) {
    const map = {
      '刑天': 'xingtian',
      '烛龙': 'zhulong',
      '帝江': 'dijiang',
      '九尾狐': 'jiuweihu',
      '白泽': 'baize',
      '饕餮': 'taotie',
      '穷奇': 'qiongqi',
      '混沌': 'hundun',
      '梼杌': 'taowu',
      '相柳': 'xiangliu',
      '毕方': 'bifang',
      '夔': 'kui',
      '青龙': 'qinglong',
      '白虎': 'baihu',
      '朱雀': 'zhuque',
      '玄武': 'xuanwu'
    };
    
    return map[chinese] || chinese;
  }
}

module.exports = PromptForgeDirector;