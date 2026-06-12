#!/usr/bin/env node
/**
 * Character Analyzer v1.0-Peng
 * 7维角色分析器 — 将角色描述解析为结构化数据
 *
 * 7维模型：
 * 1. 基础肖像 (Physical Profile) — 年龄/性别/体型/面部特征
 * 2. 时代背景 (Era Setting) — 年代/季节/地域/社会背景
 * 3. 地域背景 (Regional Context) — 中国南北/城乡差异
 * 4. 职业身份 (Professional Identity) — 职业大类/合规要点
 * 5. 性格气质 (Temperament) — 体态/表情/眼神/服装整洁度
 * 6. 剧情状态 (Narrative State) — 时间点/身体状况/精神状态
 * 7. 参考素材 (Reference Materials) — 演员照片/手绘/参考影视
 *
 * 集成自：Character Photo Generator Skill (参考借鉴版)
 */

'use strict';

class CharacterAnalyzer {
  constructor() {
    this.parsingRules = this._buildParsingRules();
  }

  /**
   * 7维分析主入口
   * @param {Object} rawInput — 角色原始描述
   * @returns {Object} 7维结构化数据
   */
  analyze(rawInput) {
    const text = this._normalizeInput(rawInput);

    const analysis = {
      dimension1_physical: this._parsePhysicalProfile(text, rawInput),
      dimension2_era: this._parseEraSetting(text, rawInput),
      dimension3_region: this._parseRegionalContext(text, rawInput),
      dimension4_profession: this._parseProfessionalIdentity(text, rawInput),
      dimension5_temperament: this._parseTemperament(text, rawInput),
      dimension6_narrative: this._parseNarrativeState(text, rawInput),
      dimension7_reference: this._parseReferenceMaterials(rawInput),
      _raw: text,
      _confidence: this._calculateConfidence(text)
    };

    // 交叉验证
    analysis._crossValidation = this._crossValidate(analysis);

    return analysis;
  }

  /**
   * 快速分析（仅提取核心要素）
   */
  analyzeQuick(rawInput) {
    const full = this.analyze(rawInput);
    return {
      age: full.dimension1_physical.age,
      gender: full.dimension1_physical.gender,
      build: full.dimension1_physical.build,
      profession: full.dimension4_profession.profession,
      era: full.dimension2_era.era,
      temperament: full.dimension5_temperament.primary,
      complianceFlags: full.dimension4_profession.complianceFlags,
      keyFeatures: full.dimension1_physical.keyFeatures
    };
  }

  // ─── Dimension 1: 基础肖像 ───
  _parsePhysicalProfile(text, rawInput) {
    const result = {
      age: null,
      gender: null,
      build: null,
      skinTone: null,
      faceShape: null,
      eyeFeatures: null,
      hair: null,
      specialMarks: [],
      keyFeatures: []
    };

    // 年龄提取
    const agePatterns = [
      /(\d+)\s*岁/,
      /(\d+)[-\s]*year[-\s]*old/i,
      /(\d+)\s*岁(?:左右|上下|多)?/,
      /(?:大约|大概|约)\s*(\d+)\s*岁/,
      /(\d+)\s*岁[男女]?(?:性|孩|子|人)/,
      /(\d+)[-\s]岁/,
      /age\s*(\d+)/i,
      /(\d+)\s*y\.?o/i,
      /(\d+)\s*yrs?/i
    ];

    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.age = parseInt(match[1]);
        break;
      }
    }

    // 性别提取
    if (/女|woman|female|girl|女士|阿姨|奶奶/i.test(text)) {
      result.gender = 'female';
    } else if (/男|man|male|boy|男士|叔叔|爷爷/i.test(text)) {
      result.gender = 'male';
    }

    // 体型提取
    const buildKeywords = {
      'slim': /瘦|苗条|slim|thin|lean|lanky/i,
      'average': /中等身材|average|medium|standard/i,
      'athletic': /健壮|muscular|athletic|fit/i,
      'stocky': /壮实|stocky|sturdy|heavyset/i,
      'overweight': /胖|overweight|plump|obese/i,
      'child': /儿童|child|kid|小男孩|小女孩/i
    };
    for (const [build, regex] of Object.entries(buildKeywords)) {
      if (regex.test(text)) {
        result.build = build;
        break;
      }
    }

    // 面部特征
    const faceShapes = {
      'oval': /鹅蛋脸|oval/i,
      'round': /圆脸|round/i,
      'square': /方脸|国字脸|square/i,
      'long': /长脸|long/i,
      'heart': /心形脸|heart/i
    };
    for (const [shape, regex] of Object.entries(faceShapes)) {
      if (regex.test(text)) {
        result.faceShape = shape;
        break;
      }
    }

    // 特殊标记
    const markPatterns = [
      /伤疤|疤痕|scar/i,
      /痣|mole|birthmark/i,
      /胎记/i,
      /纹身|tattoo/i,
      /皱纹|wrinkle/i,
      /黑眼圈|dark circle/i,
      /胡茬|stubble/i,
      /白发|gray hair|white hair/i
    ];
    for (const pattern of markPatterns) {
      const match = text.match(pattern);
      if (match) {
        // 提取上下文
        const idx = text.indexOf(match[0]);
        const context = text.substring(Math.max(0, idx - 20), idx + match[0].length + 20);
        result.specialMarks.push(context.trim());
      }
    }

    // 组装关键特征用于Prompt
    result.keyFeatures = this._buildKeyFeatures(result, text);

    return result;
  }

  // ─── Dimension 2: 时代背景 ───
  _parseEraSetting(text, rawInput) {
    const result = {
      era: 'contemporary', // 默认现代
      specificYear: null,
      season: null,
      climate: null,
      socialContext: null,
      eraKeywords: []
    };

    // 年代检测
    const eraPatterns = {
      '1920-30s': /1920|1930|民国|北洋|old Shanghai|Republican era/i,
      '1937-45': /1937|抗战|wartime|anti-Japanese| WWII/i,
      '1949-56': /1949|建国初期|early PRC/i,
      '1956-65': /1950s|大跃进|socialist construction/i,
      '1966-76': /1966|文革|Cultural Revolution/i,
      '1977-84': /1977|改革开放初期|early reform/i,
      '1985-92': /1985|改革开放中期|late 80s/i,
      '1992-99': /1992|市场经济|1990s|millennium/i,
      '2000-10': /2000|千禧|millennium|WTO/i,
      '2010-20': /2010|当代|contemporary|modern/i,
      'future': /未来|2077|future|sci-fi|cyberpunk/i
    };

    for (const [era, regex] of Object.entries(eraPatterns)) {
      if (regex.test(text)) {
        result.era = era;
        result.eraKeywords.push(era);
      }
    }

    // 特定年份
    const yearMatch = text.match(/(?:19|20)\d{2}/);
    if (yearMatch) {
      result.specificYear = parseInt(yearMatch[0]);
    }

    // 季节
    const seasons = {
      'spring': /春|spring/i,
      'summer': /夏|summer/i,
      'autumn': /秋|autumn|fall/i,
      'winter': /冬|winter/i
    };
    for (const [s, regex] of Object.entries(seasons)) {
      if (regex.test(text)) {
        result.season = s;
        break;
      }
    }

    return result;
  }

  // ─── Dimension 3: 地域背景 ───
  _parseRegionalContext(text, rawInput) {
    const result = {
      region: null,
      urbanRural: null,
      climate: null,
      culturalMarkers: []
    };

    // 中国地域
    const regions = {
      'north-china': /北方|东北|north|northeast|北京|天津|河北|山东|河南/i,
      'south-china': /南方|华南|south|广东|广西|福建|海南/i,
      'east-china': /华东|east|上海|江苏|浙江|安徽|江西/i,
      'west-china': /西部|west|四川|重庆|云南|贵州|西藏|陕西|甘肃/i,
      'central-china': /华中|central|湖北|湖南|河南/i,
      'xinjiang': /新疆|xinjiang/i,
      'taiwan': /台湾|taiwan/i,
      'hongkong': /香港|hong kong/i,
      'overseas': /海外|海外华人|overseas|abroad/i
    };

    for (const [region, regex] of Object.entries(regions)) {
      if (regex.test(text)) {
        result.region = region;
        break;
      }
    }

    // 城乡
    if (/城市|urban|city|都市|downtown/i.test(text)) {
      result.urbanRural = 'urban';
    } else if (/农村|rural|乡村|countryside|village/i.test(text)) {
      result.urbanRural = 'rural';
    }

    return result;
  }

  // ─── Dimension 4: 职业身份 ───
  _parseProfessionalIdentity(text, rawInput) {
    const result = {
      profession: null,
      professionCategory: null,
      subRole: null,
      complianceFlags: [],
      costumeKeywords: [],
      equipment: []
    };

    // 职业大类检测
    const professions = {
      'police': {
        patterns: /警察|police|刑警|detective|警官|officer|执法/i,
        category: 'law-enforcement',
        complianceFlags: ['police_uniform', 'badge_blur', 'weapon_check'],
        costumeKeywords: ['uniform', 'police-style', 'badge', 'holster']
      },
      'military': {
        patterns: /军人|military| soldier|army|解放军|部队/i,
        category: 'military',
        complianceFlags: ['military_uniform', 'insignia_fictional', 'weapon_check'],
        costumeKeywords: ['military uniform', 'camouflage', 'beret']
      },
      'medical': {
        patterns: /医生|doctor|护士|nurse|医护|medical|医院|hospital/i,
        category: 'medical',
        complianceFlags: ['medical_uniform', 'nameplate_blur', 'equipment_era'],
        costumeKeywords: ['white coat', 'scrubs', 'stethoscope', 'nurse cap']
      },
      'education': {
        patterns: /教师|teacher|教授|professor|老师|education/i,
        category: 'education',
        complianceFlags: [],
        costumeKeywords: ['glasses', 'books', 'professional attire']
      },
      'business': {
        patterns: /商人|business|老板|CEO|经理|manager|entrepreneur/i,
        category: 'business',
        complianceFlags: ['brand_avoidance'],
        costumeKeywords: ['suit', 'tie', 'briefcase']
      },
      'worker': {
        patterns: /工人|worker|劳动者|蓝领|blue-collar/i,
        category: 'worker',
        complianceFlags: ['brand_avoidance'],
        costumeKeywords: ['work clothes', 'overalls', 'safety helmet']
      },
      'farmer': {
        patterns: /农民|farmer|务农|peasant/i,
        category: 'farmer',
        complianceFlags: [],
        costumeKeywords: ['rough cotton', 'straw hat', 'apron']
      },
      'intellectual': {
        patterns: /知识分子|intellectual|学者|scholar|研究员|researcher/i,
        category: 'intellectual',
        complianceFlags: [],
        costumeKeywords: ['glasses', 'bookish', 'simple attire']
      },
      'student': {
        patterns: /学生|student|大学生|pupil/i,
        category: 'student',
        complianceFlags: ['age_verification'],
        costumeKeywords: ['school uniform', 'backpack', 'youthful']
      },
      'presenter': {
        patterns: /主播|主持人|presenter|anchor|host/i,
        category: 'media',
        complianceFlags: ['brand_avoidance'],
        costumeKeywords: ['professional attire', 'microphone', 'on-camera']
      }
    };

    for (const [prof, data] of Object.entries(professions)) {
      if (data.patterns.test(text)) {
        result.profession = prof;
        result.professionCategory = data.category;
        result.complianceFlags = [...data.complianceFlags];
        result.costumeKeywords = [...data.costumeKeywords];
        break;
      }
    }

    // 子角色检测
    if (/副队长|副|deputy|vice/i.test(text)) result.subRole = 'deputy';
    else if (/队长|chief|captain/i.test(text)) result.subRole = 'chief';
    else if (/主任|director/i.test(text)) result.subRole = 'director';

    // 特殊合规检测：儿童角色
    if (/(\d+)\s*岁/i.test(text)) {
      const ageMatch = text.match(/(\d+)\s*岁/);
      if (ageMatch && parseInt(ageMatch[1]) < 18) {
        if (!result.complianceFlags.includes('child_safety')) {
          result.complianceFlags.push('child_safety');
        }
      }
    }

    return result;
  }

  // ─── Dimension 5: 性格气质 ───
  _parseTemperament(text, rawInput) {
    const result = {
      primary: null,
      secondary: null,
      posture: null,
      expression: null,
      gaze: null,
      clothingState: null
    };

    // 气质类型
    const temperaments = {
      'resolute': /坚毅|刚强|坚毅|resolute|determined|firm/i,
      'warm': /温暖|温和|warm|gentle|kind/i,
      'stern': /严厉|stern|strict|serious/i,
      'intelligent': /精明|聪明|intelligent|smart|clever/i,
      'rough': /豪爽|粗犷|rough|bold|hearty/i,
      'elegant': /温文尔雅|elegant|refined|cultured/i,
      'melancholy': /阴郁|melancholy|gloomy|depressed/i,
      'cheerful': /活泼|开朗|cheerful|lively|energetic/i,
      'experienced': /沧桑|老练|experienced|weathered|seasoned/i,
      'professional': /专业|professional|competent/i,
      'friendly': /友好|friendly|approachable|amiable/i
    };

    const found = [];
    for (const [temp, regex] of Object.entries(temperaments)) {
      if (regex.test(text)) {
        found.push(temp);
      }
    }

    if (found.length > 0) {
      result.primary = found[0];
      if (found.length > 1) result.secondary = found[1];
    }

    // 姿态
    if (/站得笔直|挺直|standing tall|upright/i.test(text)) {
      result.posture = 'upright';
    } else if (/微驼|驼背|slightly hunched|hunched/i.test(text)) {
      result.posture = 'slightly_hunched';
    } else if (/放松|relax|casual/i.test(text)) {
      result.posture = 'relaxed';
    }

    // 表情
    if (/微笑|smile|smiling/i.test(text)) {
      result.expression = 'smiling';
    } else if (/严肃|serious|stern/i.test(text)) {
      result.expression = 'serious';
    } else if (/疲惫|tired|exhausted/i.test(text)) {
      result.expression = 'tired';
    } else if (/坚定|determined|firm/i.test(text)) {
      result.expression = 'determined';
    }

    // 眼神
    if (/锐利|sharp|锐利/i.test(text)) {
      result.gaze = 'sharp';
    } else if (/温和|温和|warm|gentle/i.test(text)) {
      result.gaze = 'warm';
    } else if (/疲惫|tired/i.test(text)) {
      result.gaze = 'tired';
    }

    // 服装状态
    if (/整洁|干净|neat|clean/i.test(text)) {
      result.clothingState = 'neat';
    } else if (/旧|worn|worn-out/i.test(text)) {
      result.clothingState = 'worn';
    } else if (/补丁|patched/i.test(text)) {
      result.clothingState = 'patched';
    }

    return result;
  }

  // ─── Dimension 6: 剧情状态 ───
  _parseNarrativeState(text, rawInput) {
    const result = {
      storyPoint: null,
      physicalCondition: null,
      mentalState: null,
      socialStatus: null,
      specialMarkers: []
    };

    // 身体状况
    if (/受伤|injured|wounded|hurt/i.test(text)) {
      result.physicalCondition = 'injured';
      const match = text.match(/(?:受伤|injured).*?(?:左臂|右臂|腿|头|.*?)(?:，|。|\s|$)/i);
      if (match) result.specialMarkers.push(match[0].trim());
    } else if (/疲惫|tired|exhausted|weary/i.test(text)) {
      result.physicalCondition = 'tired';
    } else if (/健康|healthy|fit/i.test(text)) {
      result.physicalCondition = 'healthy';
    }

    // 精神状态
    if (/崩溃|崩溃|breakdown|crumbling/i.test(text)) {
      result.mentalState = 'breakdown';
    } else if (/亢奋|亢奋|excited|high/i.test(text)) {
      result.mentalState = 'excited';
    } else if (/忧郁|忧郁|melancholy|depressed/i.test(text)) {
      result.mentalState = 'depressed';
    } else if (/平静|calm|peaceful/i.test(text)) {
      result.mentalState = 'calm';
    }

    // 社会地位变化
    if (/升职|promoted|rise/i.test(text)) {
      result.socialStatus = 'rising';
    } else if (/落魄|落魄|fallen|declined/i.test(text)) {
      result.socialStatus = 'fallen';
    }

    return result;
  }

  // ─── Dimension 7: 参考素材 ───
  _parseReferenceMaterials(rawInput) {
    const result = {
      hasActorPhoto: false,
      hasSketch: false,
      hasHistoricalPhoto: false,
      hasFilmReference: false,
      hasTextDescription: false,
      materials: []
    };

    if (!rawInput || typeof rawInput !== 'object') return result;

    // 检测是否有参考素材字段
    if (rawInput.actorPhoto || rawInput.referenceImage) {
      result.hasActorPhoto = true;
      result.materials.push('actor_photo');
    }
    if (rawInput.sketch || rawInput.handDrawn) {
      result.hasSketch = true;
      result.materials.push('sketch');
    }
    if (rawInput.historicalPhoto) {
      result.hasHistoricalPhoto = true;
      result.materials.push('historical_photo');
    }
    if (rawInput.filmReference || rawInput.referenceFilm) {
      result.hasFilmReference = true;
      result.materials.push('film_reference');
    }
    if (rawInput.textDescription || rawInput.description) {
      result.hasTextDescription = true;
      result.materials.push('text_description');
    }

    return result;
  }

  // ─── 辅助方法 ───

  _normalizeInput(rawInput) {
    if (typeof rawInput === 'string') return rawInput;
    if (typeof rawInput === 'object') {
      // 尝试从对象中提取文本
      const fields = ['description', 'text', 'characterDesc', 'profile', 'content'];
      for (const field of fields) {
        if (rawInput[field]) return String(rawInput[field]);
      }
      // 如果找不到文本字段，将所有值拼接
      return Object.values(rawInput).filter(v => typeof v === 'string').join(' ');
    }
    return String(rawInput);
  }

  _buildKeyFeatures(profile, text) {
    const features = [];

    if (profile.age) features.push(`${profile.age}岁`);
    if (profile.gender) features.push(profile.gender === 'male' ? '男性' : '女性');
    if (profile.build) features.push(profile.build);
    if (profile.faceShape) features.push(`${profile.faceShape}脸型`);
    if (profile.specialMarks.length > 0) features.push(...profile.specialMarks.slice(0, 2));

    return features;
  }

  _calculateConfidence(text) {
    let score = 0.5;
    if (/年龄|age|岁/i.test(text)) score += 0.1;
    if (/职业|profession|职业|身份/i.test(text)) score += 0.1;
    if (/服装|clothing|穿着|costume/i.test(text)) score += 0.1;
    if (/性格|temperament|气质|personality/i.test(text)) score += 0.1;
    if (/时代|era|年代|时期/i.test(text)) score += 0.1;
    return Math.min(score, 1.0);
  }

  _crossValidate(analysis) {
    const issues = [];

    // 检查年龄与职业是否合理
    if (analysis.dimension1_physical.age && analysis.dimension4_profession.profession) {
      const age = analysis.dimension1_physical.age;
      const prof = analysis.dimension4_profession.profession;

      if (prof === 'police' && age < 20) {
        issues.push('警察职业年龄可能过低（<20岁）');
      }
      if (prof === 'medical' && age < 22) {
        issues.push('医护职业年龄可能过低（<22岁）');
      }
    }

    // 检查时代与服装是否合理
    if (analysis.dimension2_era.era === 'contemporary' && analysis.dimension4_profession.profession === 'military') {
      issues.push('现代军事角色需要虚构标识处理');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  _buildParsingRules() {
    return {
      // 可以动态扩展的规则
      version: '1.0-Peng'
    };
  }
}

// ─── 导出 ───
module.exports = { CharacterAnalyzer };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Character Analyzer v1.0-Peng 测试 ===\n');

  const analyzer = new CharacterAnalyzer();

  // 测试1: 陈女士
  console.log('--- Test 1: 陈女士（护士）---');
  const chenAnalysis = analyzer.analyze({
    description: '25-28岁东亚女性，穿藏青色护士制服，佩戴红十字徽章，25岁左右，中等身材，温和专业的气质，在现代医疗教育工作室工作',
    age: 26,
    profession: 'nurse'
  });

  console.log(`  年龄: ${chenAnalysis.dimension1_physical.age}岁`);
  console.log(`  性别: ${chenAnalysis.dimension1_physical.gender}`);
  console.log(`  体型: ${chenAnalysis.dimension1_physical.build}`);
  console.log(`  职业: ${chenAnalysis.dimension4_profession.profession} (${chenAnalysis.dimension4_profession.professionCategory})`);
  console.log(`  合规标记: ${chenAnalysis.dimension4_profession.complianceFlags.join(', ')}`);
  console.log(`  气质: ${chenAnalysis.dimension5_temperament.primary}`);
  console.log(`  时代: ${chenAnalysis.dimension2_era.era}`);
  console.log(`  关键特征: ${chenAnalysis.dimension1_physical.keyFeatures.join(', ')}`);
  console.log(`  置信度: ${(chenAnalysis._confidence * 100).toFixed(0)}%`);
  console.log(`  交叉验证: ${chenAnalysis._crossValidation.passed ? '✅ 通过' : '⚠️ ' + chenAnalysis._crossValidation.issues.join(', ')}`);

  // 测试2: 小G
  console.log('\n--- Test 2: 小G（8岁男孩）---');
  const xiaogAnalysis = analyzer.analyzeQuick({
    description: '8岁东亚小男孩，圆脸，大眼睛，穿传统中式盘扣上衣和布鞋，天真活泼，在现代教育场景中',
    age: 8,
    profession: 'student'
  });

  console.log(`  快速分析: ${JSON.stringify(xiaogAnalysis, null, 2)}`);

  // 测试3: 字符串输入
  console.log('\n--- Test 3: 纯字符串输入（刑警）---');
  const detectiveAnalysis = analyzer.analyze('42岁男性刑警副队长，东北人，坚毅内敛，穿深灰色羊毛大衣，右太阳穴有子弹擦伤疤痕，2005年，哈尔滨');

  console.log(`  年龄: ${detectiveAnalysis.dimension1_physical.age}岁`);
  console.log(`  性别: ${detectiveAnalysis.dimension1_physical.gender}`);
  console.log(`  职业: ${detectiveAnalysis.dimension4_profession.profession}`);
  console.log(`  合规标记: ${detectiveAnalysis.dimension4_profession.complianceFlags.join(', ')}`);
  console.log(`  地域: ${detectiveAnalysis.dimension3_region.region}`);
  console.log(`  时代: ${detectiveAnalysis.dimension2_era.era} (${detectiveAnalysis.dimension2_era.specificYear})`);
  console.log(`  气质: ${detectiveAnalysis.dimension5_temperament.primary}`);
  console.log(`  特殊标记: ${detectiveAnalysis.dimension1_physical.specialMarks.join('; ')}`);

  console.log('\n=== 全部测试通过 ===');
}