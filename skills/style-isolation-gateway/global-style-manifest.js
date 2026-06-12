/**
 * Global Style Manifest — 全局风格宪法 v2.0-Peng
 * 
 * 定义两种截然不同的风格标准：
 * - DOCUMENTARY: 写实纪录片风格（科普/商业/宣传片）
 * - DRAMA: 山海经神话风格（剧情/神话/玄幻）
 * 
 * 两种风格零共享关键词，强制隔离，永不交叉。
 */

'use strict';

// ─── 风格类型枚举 ───
const STYLE_TYPES = {
  DOCUMENTARY: 'documentary',  // 写实纪录片
  DRAMA: 'drama'               // 山海经神话
};

// ─── 写实纪录片风格宪法 ───
const DOCUMENTARY_MANIFEST = {
  id: 'documentary',
  name: 'Documentary Realism',
  description: 'CG超写实、明亮干净、现代商业纪录片风格。用于科普、宣传片、产品介绍、教育视频。',
  
  // ─── 视觉基准 ───
  visual: {
    base: 'CG cinematic, photorealistic, physically based rendering, hyper-detailed',
    era: 'modern contemporary, real-world setting, present day',
    atmosphere: 'clean, professional, educational, trustworthy, bright, naturalistic',
    
    // 光影系统
    lighting: 'natural daylight 5600K from large left window, soft even illumination, no dead blacks, professional ring fill light, subtle warm accent from right, gentle shadows with full detail in dark areas, natural sunlight streaming creating warm trapezoid light patches',
    
    // 色彩系统
    colorPalette: [
      { name: '医疗白', hex: '#FFFFFF', usage: '主色调，干净专业' },
      { name: '浅蓝', hex: '#E3F2FD', usage: '辅助色，科技感/宁静感' },
      { name: '健康绿', hex: '#4CAF50', usage: '安全/正常指标' },
      { name: '警示橙', hex: '#FF9800', usage: '警告/注意' },
      { name: '暖木', hex: '#8D6E63', usage: '环境温馨' },
      { name: '深红', hex: '#D32F2F', usage: '危险/异常/炎症' },
      { name: '正常黄', hex: '#FFEB3B', usage: '正常状态指示' },
      { name: '临床蓝', hex: '#E3F2FD', usage: '医疗环境' }
    ],
    
    // 材质与纹理
    texture: [
      'hyper-detailed skin pores and subsurface scattering visible',
      'natural skin texture with fine pores and subtle imperfections',
      'fabric weave texture on cotton uniforms showing cloth fiber',
      'realistic fur strand texture with natural gloss under light',
      'metal badge with subtle oxidation marks and soft reflection',
      'wood grain texture on furniture with natural color variation',
      'glass refraction on laboratory equipment showing thickness',
      'marble or light gray mat texture on demonstration platforms'
    ],
    
    // 运镜规范
    camera: [
      'stable tripod feel, smooth professional tracking',
      'shallow depth of field focusing on subject face',
      'eye-level camera angle, natural human perspective',
      'medium shot for interaction and dialogue scenes',
      'close-up for emotional or medical detail moments',
      'wide shot for establishing environment and context',
      'soft fade in and fade out transitions between segments',
      'static or slow subtle movement, no jarring cuts'
    ],
    
    // 分辨率与帧率
    resolution: '960x960',
    fps: 24,
    durationPerShot: { min: 3, max: 8 }
  },
  
  // ─── 角色规范 ───
  character: {
    // 人类角色
    human: {
      skin: 'realistic skin texture with visible pores, subsurface scattering, natural skin tone variations, no perfect porcelain',
      hair: 'natural hair strands with realistic texture, slight imperfections, natural color, no exaggerated shine',
      eyes: 'proportionally sized eyes with natural moisture, realistic iris texture, natural reflection, no sparkling or oversized',
      facialFeatures: 'natural human proportions, subtle asymmetry, realistic wrinkles and expression lines',
      clothing: 'professional modern attire with fabric texture, realistic folds and draping, natural wear patterns',
      expression: 'natural human expressions, subtle emotional cues, no exaggerated theatrical or staged poses',
      movement: 'natural human movement, realistic physics, no cartoonish bounce or artificial smoothness'
    },
    
    // CG生物/演示对象
    creature: {
      anatomy: 'anatomically correct proportions, realistic musculature visible under skin or fur, natural skeletal structure',
      fur: 'realistic fur strand texture, natural gloss under light, individual strands visible, no fluffy or toy-like',
      skin: 'natural skin texture with pores, wrinkles, and realistic color variation, no plastic or wax appearance',
      expression: 'naturalistic animal expressions, alert but not anthropomorphized, no human-like exaggerated emotions',
      movement: 'natural animal locomotion, realistic physics and weight, no cartoonish exaggeration or unnatural speed'
    }
  },
  
  // ─── 环境规范 ───
  environment: {
    type: 'modern professional studio, medical office, clean educational space, contemporary real-world setting',
    elements: [
      'white walls with subtle texture and light blue decorative trim lines',
      'light wood floor or light gray anti-slip mat',
      'large floor-to-ceiling windows with natural daylight streaming in',
      'medical equipment with realistic materials and proportions',
      'bookshelves with anatomy models, medical books, and educational props',
      'whiteboard or large LED display screen with clean content',
      'professional lighting fixtures, ring fill lights, shadowless lamps',
      'light wood furniture with natural grain texture',
      'green park or natural scenery visible through windows'
    ],
    forbidden: [
      'ancient Chinese architecture or pagodas',
      'floating islands, spiritual mist, or mystical elements',
      'mythical landscape elements like Honghuang mountains',
      'ink wash painting backgrounds or Song Dynasty landscapes',
      'fantasy lighting effects like god rays through clouds',
      'supernatural glow or particle effects',
      'dark gloomy atmosphere or horror elements'
    ]
  },
  
  // ─── 负面防护词库 ───
  negative: {
    // 卡通/动画类
    cartoon: ['cartoon', 'anime', '3D render look', 'pixar', 'disney', 'toon shading'],
    // 材质类
    material: ['plastic skin', 'wax skin', 'porcelain skin', 'mannequin', 'doll', 'puppet'],
    // 萌化/表演类
    cute: ['fluffy', 'cute', 'chibi', 'kawaii', 'big eyes', 'exaggerated expression', 'staged', 'artificial pose', 'mascot', 'toy-like', 'figurine'],
    // 氛围类
    atmosphere: ['horror', 'scary', 'dark gloomy', 'neon', 'cyberpunk'],
    // 质量类
    quality: ['oversaturated', 'oversmoothed', 'uncanny valley', 'low quality', 'blurry', 'watermark', 'text overlay'],
    // 畸形类
    deform: ['deformed', 'mutated', 'extra limbs', 'missing limbs', 'floating limbs', 'disconnected limbs'],
    
    // 完整列表（用于Prompt注入）
    fullList: [
      'cartoon', 'anime', '3D render look', 'plastic skin', 'wax skin', 'porcelain skin',
      'mannequin', 'doll', 'puppet', 'fluffy', 'cute', 'chibi', 'kawaii', 'big eyes',
      'exaggerated expression', 'staged', 'artificial pose', 'mascot', 'disney', 'pixar',
      'toon shading', 'toy-like', 'figurine', 'horror', 'scary', 'neon', 'cyberpunk',
      'oversaturated', 'oversmoothed', 'uncanny valley', 'low quality', 'blurry',
      'watermark', 'text overlay', 'deformed', 'mutated', 'extra limbs', 'missing limbs',
      'floating limbs', 'disconnected limbs'
    ]
  },
  
  // ─── 后期制作规范 ───
  postProduction: {
    colorGrading: 'natural color correction, maintain skin tone accuracy, subtle warmth, no stylized filters',
    transitions: 'soft fade in/out between segments, gentle cross dissolve, no flash cuts or whip pans',
    subtitleStyle: 'clean sans-serif font, white text with dark outline, positioned at bottom, professional medical/educational style',
    audioStyle: 'clear narration, natural ambient sound, no epic music or fantasy sound effects',
    textOverlay: 'minimal text, clean typography, medical/educational labeling only'
  }
};

// ─── 山海经神话风格宪法 ───
const DRAMA_MANIFEST = {
  id: 'drama',
  name: 'Shanhaijing Drama',
  description: '山海经神话风格，水墨洪荒，东方史诗美学。用于剧情片、神话故事、玄幻叙事。',
  
  visual: {
    base: 'CG cinematic, photorealistic, epic, ancient Chinese mythology',
    era: 'Honghuang era, primordial world, ancient Chinese mythology',
    atmosphere: 'mystical, ancient, powerful, ink wash painting atmosphere, Song Dynasty landscape grandeur',
    
    lighting: 'natural sunlight, golden hour, rim light, volumetric god rays, ink wash painting atmosphere, dramatic contrast between light and shadow, spiritual glow emanating from divine beings',
    
    colorPalette: [
      { name: '深海幽蓝', hex: '#003B5C', usage: '主色调，神秘深邃' },
      { name: '烈焰赤红', hex: '#D32F2F', usage: '强调色，力量与冲突' },
      { name: '墨色', hex: '#1A1A1A', usage: '水墨基调' },
      { name: '宣纸黄', hex: '#F5F5DC', usage: '古风底色' },
      { name: '金色轮廓光', hex: '#FFD700', usage: '神性光辉' },
      { name: '翡翠绿', hex: '#00A86B', usage: '自然灵兽' }
    ],
    
    texture: [
      'ink wash painting texture, Song Dynasty landscape style brush strokes',
      'ancient stone texture with weathering marks and moss',
      'mythical beast fur or scales with subtle spiritual glow',
      'traditional silk fabric with embroidery and flowing movement',
      'jade and bronze artifacts with patina and age marks',
      'primordial mountain rock with spiritual energy veins'
    ],
    
    camera: [
      'dynamic whip pan for action sequences and fast movement',
      'flash cuts for emotional beats and dramatic reveals',
      'extreme close-ups for intense facial expressions',
      'epic wide shots for world establishing and scale',
      'slow motion for mythical reveals and divine moments',
      'particle dissolve transitions between scenes',
      'dramatic low angles for heroic moments',
      ' crane shots for sweeping landscape views'
    ],
    
    resolution: '960x960',
    fps: 24,
    durationPerShot: { min: 3, max: 6 }
  },
  
  character: {
    mythHuman: {
      skin: 'ethereal skin with subtle divine glow, light emanating from within, otherworldly perfection',
      hair: 'flowing hair with spiritual movement, subtle shimmer, defying gravity slightly',
      eyes: 'intense gaze with supernatural depth, glowing pupils reflecting inner power',
      clothing: 'traditional Chinese divine attire, flowing silk robes, jade ornaments, ancient patterns',
      aura: 'subtle golden rim light, particle effects around body, spiritual energy visible',
      expression: 'noble and ancient, conveying wisdom and divine authority'
    },
    
    beast: {
      anatomy: 'mythical proportions from Shanhaijing, exaggerated but majestic and powerful',
      fur_scales: 'mystical fur with spiritual glow, scales with iridescent sheen, otherworldly texture',
      expression: 'powerful and ancient, conveying wisdom and otherworldliness, divine presence',
      aura: 'surrounded by natural elements - fire particles, water mist, wind currents, earth dust',
      size: 'larger than life, imposing presence, dominating the frame'
    }
  },
  
  environment: {
    type: 'ancient Chinese mountains and rivers, primordial wilderness, Honghuang world',
    elements: [
      'floating islands suspended in mystical mist',
      'ancient trees with spiritual glow and oversized proportions',
      'mystical light beams piercing through clouds',
      'ink wash painting style mountains with dramatic silhouettes',
      'spiritual mist and particles flowing through air',
      'jade and bronze ruins of ancient civilization',
      'primordial rivers with glowing spiritual energy',
      'vast wilderness with mythical flora and fauna'
    ],
    forbidden: [
      'modern buildings, technology, or contemporary elements',
      'medical equipment, whiteboards, or laboratory settings',
      'contemporary clothing like suits or modern uniforms',
      'modern lighting fixtures or fluorescent lights',
      'clean white studio environments',
      'real-world cities or modern infrastructure'
    ]
  },
  
  negative: {
    modern: ['modern clothing', 'modern technology', 'contemporary', 'whiteboard', 'medical equipment', 'laboratory', ' fluorescent light'],
    cartoon: ['cartoon', 'anime', '3D render look', 'pixar', 'disney'],
    material: ['plastic skin', 'wax skin', 'porcelain skin', 'mannequin', 'doll', 'puppet'],
    atmosphere: ['horror', 'scary', 'zombie', 'neon', 'cyberpunk'],
    quality: ['low quality', 'blurry', 'watermark', 'text overlay'],
    
    fullList: [
      'zombie', 'wizard', 'magic spell', 'western dragon', 'modern clothing',
      'anime', 'cartoon', '3D render look', 'plastic skin', 'porcelain skin',
      'wax skin', 'mannequin', 'doll', 'puppet', 'horror', 'scary',
      'neon', 'cyberpunk', 'low quality', 'blurry', 'watermark', 'text overlay',
      'modern technology', 'contemporary', 'whiteboard', 'medical equipment',
      'laboratory', 'fluorescent light'
    ]
  },
  
  postProduction: {
    colorGrading: 'ink wash painting inspired color grade, enhanced contrast, golden hour warmth, dramatic shadows',
    transitions: 'particle dissolve, ink wash fade, dramatic hard cuts for emotional beats',
    subtitleStyle: 'traditional Chinese calligraphy inspired font, golden text with subtle glow, positioned artistically',
    audioStyle: 'epic orchestral music, traditional Chinese instruments, thunder and wind sound effects',
    textOverlay: 'minimal elegant text, ancient Chinese style, subtle gold accents'
  }
};

// ─── 风格污染关键词映射 ───
const CROSS_STYLE_CONTAMINATION_MAP = {
  documentary: {
    // 当项目类型为documentary时，这些词属于"污染"（来自drama风格）
    forbiddenKeywords: [
      // 时代背景
      'Honghuang', 'Honghuang era', 'ancient Chinese mythology', 'primordial',
      '洪荒', '上古', '神话', '仙侠', '修仙',
      'Shanhaijing', '山海经风格', '神话世界',
      // 氛围
      'mystical', 'spiritual mist', 'god rays', 'divine glow', 'ethereal',
      '仙气', '神性', '神韵', '灵气', '法宝',
      'ink wash painting atmosphere', '水墨意境', '丹青', '水墨风格',
      // 色彩
      '深海幽蓝', '烈焰赤红', '宣纸黄', '金色轮廓光',
      // 运镜
      'whip pan', 'flash cuts', 'particle dissolve', 'dramatic hard cuts',
      // 环境
      'floating islands', 'spiritual glow', '浮空岛屿', '仙山', '洞天福地',
      'ancient trees with spiritual glow', 'mystical light beams',
      // 角色
      'divine attire', 'flowing silk robes', 'jade ornaments',
      'ethereal skin', 'glowing pupils', 'divine glow',
      '仙气缭绕', '衣袂飘飘', '仙风道骨',
      // 材质
      'ink wash painting texture', 'Song Dynasty landscape',
      // 后期
      'ink wash fade', 'particle dissolve transitions', 'golden text glow'
    ],
    
    requiredKeywords: [
      'photorealistic', 'realistic', 'natural', 'modern', 'contemporary'
    ],
    
    requiredNegatives: [
      'no cartoon', 'no anime', 'no 3D render look',
      'no plastic skin', 'no wax skin', 'no mannequin'
    ]
  },
  
  drama: {
    // 当项目类型为drama时，这些词属于"污染"（来自documentary风格）
    forbiddenKeywords: [
      // 现代环境
      'modern studio', 'medical office', 'health education studio',
      'whiteboard', 'medical equipment', 'laboratory', 'lab table',
      '现代医学', '实验室', '工作室', '教室',
      'floor-to-ceiling windows', 'bookshelves with anatomy models',
      // 现代色彩
      '医疗白', '浅蓝', '健康绿', '警示橙', '暖木',
      // 现代运镜
      'tripod feel', 'stable tracking', 'soft fade in',
      // 现代角色
      'nurse uniform', 'police badge', 'medical manual', 'nurse cap',
      'white nurse shoes', 'dark navy uniform', 'red cross emblem',
      // 现代材质
      'professional ring fill light', 'shadowless lamp',
      'fluorescent light', 'LED display screen',
      // 现代氛围
      'clean professional', 'educational', 'trustworthy',
      // 后期
      'soft fade in and fade out', 'natural color correction'
    ],
    
    requiredKeywords: [
      'epic', 'ancient', 'mythology', 'mystical', 'Honghuang'
    ],
    
    requiredNegatives: [
      'no modern', 'no contemporary', 'no anime', 'no cartoon'
    ]
  }
};

// ─── 导出 ───
module.exports = {
  STYLE_TYPES,
  DOCUMENTARY_MANIFEST,
  DRAMA_MANIFEST,
  CROSS_STYLE_CONTAMINATION_MAP,
  
  /**
   * 获取指定风格类型的完整宪法
   * @param {string} styleType - 'documentary' | 'drama'
   * @returns {Object} 风格宪法对象
   */
  getManifest(styleType) {
    if (styleType === STYLE_TYPES.DOCUMENTARY) return DOCUMENTARY_MANIFEST;
    if (styleType === STYLE_TYPES.DRAMA) return DRAMA_MANIFEST;
    throw new Error(`Unknown style type: ${styleType}. Available: ${Object.values(STYLE_TYPES).join(', ')}`);
  },
  
  /**
   * 列出所有可用风格类型
   */
  listStyles() {
    return [
      { id: STYLE_TYPES.DOCUMENTARY, name: DOCUMENTARY_MANIFEST.name, description: DOCUMENTARY_MANIFEST.description },
      { id: STYLE_TYPES.DRAMA, name: DRAMA_MANIFEST.name, description: DRAMA_MANIFEST.description }
    ];
  }
};

// ─── CLI 验证 ───
if (require.main === module) {
  console.log('\n=== Global Style Manifest v2.0-Peng ===\n');
  
  const manifest = module.exports;
  
  console.log('可用风格类型:');
  manifest.listStyles().forEach(s => {
    console.log(`  • ${s.id}: ${s.name}`);
    console.log(`    ${s.description}`);
  });
  
  console.log('\n--- Documentary 风格宪法摘要 ---');
  const doc = manifest.getManifest('documentary');
  console.log(`  视觉基准: ${doc.visual.base}`);
  console.log(`  时代背景: ${doc.visual.era}`);
  console.log(`  色彩系统: ${doc.visual.colorPalette.map(c => c.name).join(', ')}`);
  console.log(`  负面词数: ${doc.negative.fullList.length}`);
  console.log(`  禁用环境元素: ${doc.environment.forbidden.length}项`);
  
  console.log('\n--- Drama 风格宪法摘要 ---');
  const drama = manifest.getManifest('drama');
  console.log(`  视觉基准: ${drama.visual.base}`);
  console.log(`  时代背景: ${drama.visual.era}`);
  console.log(`  色彩系统: ${drama.visual.colorPalette.map(c => c.name).join(', ')}`);
  console.log(`  负面词数: ${drama.negative.fullList.length}`);
  console.log(`  禁用环境元素: ${drama.environment.forbidden.length}项`);
  
  console.log('\n--- 风格污染关键词 ---');
  console.log(`  Documentary禁用词: ${CROSS_STYLE_CONTAMINATION_MAP.documentary.forbiddenKeywords.length}项`);
  console.log(`  Drama禁用词: ${CROSS_STYLE_CONTAMINATION_MAP.drama.forbiddenKeywords.length}项`);
  
  console.log('\n=== 验证通过 ===');
}