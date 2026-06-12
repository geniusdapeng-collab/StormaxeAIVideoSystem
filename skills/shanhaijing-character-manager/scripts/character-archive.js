#!/usr/bin/env node
/**
 * 角色档案库 — Character Archive v1.0-Peng
 * 
 * 职责：
 * 1. 角色档案持久化存储（定妆照 + 完整人设）
 * 2. 自动注入Prompt中的角色描述
 * 3. 中国人特征默认强化（所有人类角色 = 中国人/East Asian）
 * 4. 角色一致性保障（跨镜头统一描述）
 * 
 * 档案格式（JSON）:
 * {
 *   id: "C01",
 *   name: "护士Chen",
 *   type: "human",           // human | beast | prop | hybrid
 *   role: "protagonist",     // protagonist | supporting | animal | prop
 *   
 *   // 基础设定
 *   species: "东亚人类",     // 物种/种族
 *   age: 28,
 *   gender: "female",
 *   nationality: "Chinese", // 默认 Chinese
 *   
 *   // 完整人设
 *   personality: "专业严谨、亲切温暖、耐心细致",  // 性格
 *   expertise: "健康护理科普、急救知识",           // 擅长领域
 *   preferences: "喜欢帮助小朋友理解健康知识",     // 偏好
 *   traits: "短发干练、微笑时眼角有细纹",          // 特点
 *   backstory: "三甲医院急诊科护士，转岗健康科普",   // 背景
 *   
 *   // 视觉特征（用于Prompt注入）
 *   visual: {
 *     ethnicity: "East Asian Chinese",    // 人种
 *     face: "round-square face, single eyelids or inner double eyelids, straight black hair, dark brown almond eyes, yellow skin tone",
 *     body: "slender athletic build, 165cm height",
 *     clothing: "white uniform with red cross armband, emergency badge",
 *     expression: "warm professional smile, confident gaze",
 *     signature: "red cross armband and emergency badge on uniform sleeve"
 *   },
 *   
 *   // 定妆照
 *   portraits: [
 *     { type: "full_body_front", path: "./03-characters/C01-full-body.png" },
 *     { type: "face_closeup", path: "./03-characters/C01-face-closeup.png" },
 *     { type: "side_profile", path: "./03-characters/C01-side.png" }
 *   ],
 *   
 *   // 使用记录
 *   appearances: ["HEALTH-E01-RHABDO", "HEALTH-E02-xxx"],
 *   createdAt: "2026-05-20",
 *   updatedAt: "2026-05-20"
 * }
 * 
 * 使用方式:
 *   const archive = new CharacterArchive('./productions/health-edu/02-characters');
 *   await archive.create({ name: "护士Chen", type: "human", ... });
 *   const char = archive.get("C01");
 *   const promptInjection = char.toPromptInjection(); // 返回可直接注入Prompt的字符串
 */

const fs = require('fs');
const path = require('path');

// ========== 默认人种特征库 — 中国人强化 ==========
const DEFAULT_CHINESE_FEATURES = {
  face: 'straight black hair, dark brown almond eyes, yellow skin tone, round-square face, single eyelids or inner double eyelids, East Asian features',
  child: 'straight black hair, dark brown almond eyes, yellow skin, round-square face, East Asian child features, innocent curious expression',
  adult_male: 'straight black hair, dark brown eyes, yellow skin tone, strong bone structure, East Asian male features, weathered authentic appearance',
  adult_female: 'straight black hair, dark brown almond eyes, yellow skin tone, delicate East Asian female features, natural authentic beauty',
};

// ========== 人种特征注入规则 ==========
const ETHNICITY_RULES = {
  // 所有人类角色默认中国人
  default: {
    ethnicity: 'Chinese',
    nationality: 'Chinese',
    visualPrefix: 'East Asian Chinese'
  },
  
  // 角色类型 → 默认人种特征
  roleDefaults: {
    human_child: DEFAULT_CHINESE_FEATURES.child,
    human_adult_male: DEFAULT_CHINESE_FEATURES.adult_male,
    human_adult_female: DEFAULT_CHINESE_FEATURES.adult_female,
    human_nurse: `${DEFAULT_CHINESE_FEATURES.adult_female}, professional nurse uniform, white medical attire with red cross armband`,
    default_human: DEFAULT_CHINESE_FEATURES.face
  }
};

class CharacterArchive {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.archivePath = path.join(baseDir, 'character-archive.json');
    this.portraitsDir = path.join(baseDir, 'portraits');
    this.ensureDir(baseDir);
    this.ensureDir(this.portraitsDir);
    this.data = this.load();
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  load() {
    if (fs.existsSync(this.archivePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.archivePath, 'utf8'));
      } catch (e) {
        console.error(`[CharacterArchive] 加载失败: ${e.message}`);
        return { version: '1.0-Peng', characters: [], lastUpdated: new Date().toISOString() };
      }
    }
    return { version: '1.0-Peng', characters: [], lastUpdated: new Date().toISOString() };
  }

  save() {
    this.data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.archivePath, JSON.stringify(this.data, null, 2));
  }

  // 创建新角色档案
  create(options) {
    const id = options.id || this.nextId();
    const type = options.type || 'human';
    
    // 自动注入中国人特征（如果是人类角色）
    const visual = this.enforceChineseFeatures(options.visual || {}, type);
    
    const character = {
      id,
      name: options.name,
      type,
      role: options.role || 'supporting',
      
      // 基础设定
      species: options.species || (type === 'human' ? '东亚人类' : '神话生物'),
      age: options.age,
      gender: options.gender,
      nationality: options.nationality || 'Chinese',
      
      // 完整人设
      personality: options.personality || '',
      expertise: options.expertise || '',
      preferences: options.preferences || '',
      traits: options.traits || '',
      backstory: options.backstory || '',
      
      // 视觉特征
      visual,
      
      // 定妆照
      portraits: options.portraits || [],
      
      // 使用记录
      appearances: options.appearances || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 去重：同名角色更新而非新建
    const existingIdx = this.data.characters.findIndex(c => c.name === character.name);
    if (existingIdx >= 0) {
      this.data.characters[existingIdx] = { ...this.data.characters[existingIdx], ...character, updatedAt: new Date().toISOString() };
      console.log(`[CharacterArchive] 更新角色: ${character.name} (${id})`);
    } else {
      this.data.characters.push(character);
      console.log(`[CharacterArchive] 新建角色: ${character.name} (${id})`);
    }
    
    this.save();
    return character;
  }

  // 强制注入中国人特征（人类角色）
  enforceChineseFeatures(visual, type) {
    if (type !== 'human' && type !== 'hybrid') {
      return visual; // 非人类角色不强制
    }
    
    const defaultFeature = ETHNICITY_RULES.roleDefaults.default_human;
    const currentFace = visual.face || '';
    
    // 检查是否已含中国人特征关键词
    const hasChineseFeatures = /Chinese|East Asian|Asian|yellow skin|almond eyes|straight black hair|single eyelid/i.test(currentFace);
    
    if (!hasChineseFeatures) {
      // 自动注入中国人特征
      visual.face = `${defaultFeature}${currentFace ? ', ' + currentFace : ''}`;
      console.log(`[CharacterArchive] ⚠️ 自动注入中国人特征到 ${type} 角色`);
    }
    
    // 确保 ethnicity 字段
    if (!visual.ethnicity) {
      visual.ethnicity = 'East Asian Chinese';
    }
    
    return visual;
  }

  // 获取角色
  get(idOrName) {
    return this.data.characters.find(c => c.id === idOrName || c.name === idOrName);
  }

  // 获取所有角色
  list() {
    return this.data.characters;
  }

  // 生成Prompt注入字符串
  toPromptInjection(idOrName) {
    const char = this.get(idOrName);
    if (!char) return null;
    
    const parts = [];
    
    // 核心视觉描述
    if (char.visual.face) parts.push(char.visual.face);
    if (char.visual.body) parts.push(char.visual.body);
    if (char.visual.clothing) parts.push(char.visual.clothing);
    if (char.visual.expression) parts.push(char.visual.expression);
    if (char.visual.signature) parts.push(char.visual.signature);
    
    // 人种确认
    parts.push(`definitely Chinese, East Asian appearance, not Western, not Caucasian`);
    
    // 性格/特点注入（简短版，用于Prompt）
    if (char.personality) parts.push(`personality: ${char.personality}`);
    if (char.traits) parts.push(`distinctive traits: ${char.traits}`);
    
    return parts.join(', ');
  }

  // 生成完整人设描述（用于文档/展示）
  toFullProfile(idOrName) {
    const char = this.get(idOrName);
    if (!char) return null;
    
    return `【${char.name}】${char.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 基础设定
  物种: ${char.species} | 年龄: ${char.age || '未知'} | 性别: ${char.gender || '未知'}
  国籍: ${char.nationality} | 角色定位: ${char.role}

🧠 完整人设
  性格: ${char.personality || '未设定'}
  擅长: ${char.expertise || '未设定'}
  偏好: ${char.preferences || '未设定'}
  特点: ${char.traits || '未设定'}
  背景: ${char.backstory || '未设定'}

🎨 视觉特征
  人种: ${char.visual.ethnicity || '未设定'}
  面部: ${char.visual.face || '未设定'}
  体型: ${char.visual.body || '未设定'}
  服饰: ${char.visual.clothing || '未设定'}
  表情: ${char.visual.expression || '未设定'}
  标志: ${char.visual.signature || '无'}

📸 定妆照 (${char.portraits.length}张)
${char.portraits.map(p => `  [${p.type}] ${p.path}`).join('\n')}

🎬 出场记录 (${char.appearances.length}集)
${char.appearances.map(a => `  - ${a}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  // 添加出场记录
  addAppearance(idOrName, episodeId) {
    const char = this.get(idOrName);
    if (!char) return false;
    if (!char.appearances.includes(episodeId)) {
      char.appearances.push(episodeId);
      char.updatedAt = new Date().toISOString();
      this.save();
    }
    return true;
  }

  // 添加定妆照
  addPortrait(idOrName, type, filePath) {
    const char = this.get(idOrName);
    if (!char) return false;
    
    const existing = char.portraits.find(p => p.type === type);
    if (existing) {
      existing.path = filePath;
    } else {
      char.portraits.push({ type, path: filePath });
    }
    
    char.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // 获取所有Prompt注入（批量）
  getAllPromptInjections(charIds) {
    const injections = {};
    for (const id of charIds) {
      const injection = this.toPromptInjection(id);
      if (injection) {
        injections[id] = injection;
      }
    }
    return injections;
  }

  // 下一个ID
  nextId() {
    const ids = this.data.characters.map(c => c.id);
    let num = 1;
    while (ids.includes(`C${String(num).padStart(2, '0')}`)) {
      num++;
    }
    return `C${String(num).padStart(2, '0')}`;
  }
}

// ========== 快捷函数 ==========
function createArchive(baseDir) {
  return new CharacterArchive(baseDir);
}

function loadArchive(baseDir) {
  return new CharacterArchive(baseDir);
}

// ========== 模块导出 ==========
module.exports = {
  CharacterArchive,
  createArchive,
  loadArchive,
  DEFAULT_CHINESE_FEATURES,
  ETHNICITY_RULES
};

// ========== CLI测试 ==========
if (require.main === module) {
  (async () => {
    const testDir = '/tmp/test-character-archive';
    const archive = new CharacterArchive(testDir);
    
    // 测试1: 创建护士Chen
    const chen = archive.create({
      name: '护士Chen',
      type: 'human',
      role: 'protagonist',
      age: 28,
      gender: 'female',
      personality: '专业严谨、亲切温暖、耐心细致',
      expertise: '健康护理科普、急救知识',
      preferences: '喜欢帮助小朋友理解健康知识',
      traits: '短发干练、微笑时眼角有细纹、佩戴红十字臂章',
      backstory: '三甲医院急诊科护士，转岗健康科普',
      visual: {
        face: 'short black hair, warm professional smile, confident gaze',
        body: 'slender athletic build, 165cm height',
        clothing: 'white medical uniform with red cross armband, emergency badge on sleeve',
        expression: 'warm professional smile, caring eyes',
        signature: 'red cross armband and emergency badge on uniform sleeve'
      }
    });
    
    console.log('\n✅ 角色创建成功:', chen.id, chen.name);
    console.log('\n📝 Prompt注入测试:');
    console.log(archive.toPromptInjection(chen.id));
    
    // 测试2: 创建小G
    const xiaog = archive.create({
      name: '小G',
      type: 'human',
      role: 'supporting',
      age: 8,
      gender: 'male',
      personality: '好奇活泼、天真烂漫、喜欢提问',
      expertise: '问出大人想不到的问题',
      preferences: '喜欢听故事、对动物和神话感兴趣',
      traits: '大眼睛、总有很多问号',
      backstory: '8岁中国小学生，健康科普课堂的常客',
      visual: {
        face: 'round face, big curious eyes',
        body: '8-year-old Chinese boy, blue elementary school uniform',
        clothing: 'blue elementary school uniform, red scarf',
        expression: 'curious innocent expression, always asking questions'
      }
    });
    
    console.log('\n✅ 角色创建成功:', xiaog.id, xiaog.name);
    console.log('\n📝 Prompt注入测试:');
    console.log(archive.toPromptInjection(xiaog.id));
    
    // 测试3: 中国人特征注入检查
    console.log('\n🔍 中国人特征注入检查:');
    console.log('护士Chen visual.face:', chen.visual.face);
    console.log('小G visual.face:', xiaog.visual.face);
    
    // 测试4: 完整人设输出
    console.log('\n📋 完整人设:');
    console.log(archive.toFullProfile(chen.id));
    
    // 清理
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('\n✅ 测试完成，已清理');
  })();
}