#!/usr/bin/env node
/**
 * Documentary Scene Library v1.0-Peng
 * 写实纪录片场景模板库
 *
 * 预定义各类写实场景的环境描述、光影、色彩、运镜默认值。
 * 与山海经场景（洪荒山水/浮空岛屿）完全隔离。
 */

'use strict';

// ─── 场景模板定义 ───
const SCENE_TEMPLATES = {
  'medical-studio': {
    id: 'medical-studio',
    name: '医疗教育工作室',
    nameCN: '医疗教育工作室',
    description: '明亮干净的专业医疗教育空间，适合健康科普、医学知识讲解',
    category: 'health-education',

    environment: {
      base: 'bright modern health education studio with floor-to-ceiling windows showing green park and trees outside, white walls with subtle texture and light blue decorative trim lines, light wood floor with natural grain texture',
      furniture: 'bookshelves with anatomy models and medical books, white demonstration table with light gray anti-slip mat, ergonomic chairs, whiteboard with clean content on wall',
      equipment: 'professional ring fill light from right side, shadowless lamp on demonstration table, large LED display screen showing medical diagrams',
      atmosphere: 'clean, professional, educational, trustworthy, warm and inviting, bright naturalistic atmosphere'
    },

    lighting: 'natural sunlight 5600K from large left window, soft even illumination filling entire studio, professional ring fill light from right eliminating shadows, no dead blacks, gentle shadows with full detail in dark areas, natural warm trapezoid light patches on floor from window',

    colorPalette: [
      { name: '医疗白', hex: '#FFFFFF', usage: '主色调，干净专业空间基调' },
      { name: '浅蓝', hex: '#E3F2FD', usage: '装饰线条、辅助色，科技感与宁静感' },
      { name: '健康绿', hex: '#4CAF50', usage: '窗外自然景观、安全/正常指标指示' },
      { name: '警示橙', hex: '#FF9800', usage: '警告/注意标识、重点强调' },
      { name: '暖木', hex: '#8D6E63', usage: '地板、家具，温馨自然' },
      { name: '深红', hex: '#D32F2F', usage: '护士红十字标志、危险/异常指示' },
      { name: '正常黄', hex: '#FFEB3B', usage: '正常状态指示灯、积极元素' },
      { name: '临床蓝', hex: '#E3F2FD', usage: '医疗图表背景、数据展示' }
    ],

    camera: {
      defaults: 'medium shot eye-level stable tripod, shallow depth of field focusing on subject face, smooth professional framing',
      establishing: 'wide shot showing full studio environment, floor-to-ceiling windows, demonstration area and presenter',
      medium: 'medium shot at presenter chest height, natural human perspective, smooth subtle movement',
      closeup: 'close-up on presenter face or demonstration detail, shallow depth of field, soft background blur',
      tracking: 'smooth slow tracking shot following presenter walking, stable tripod feel',
      overhead: 'high angle showing demonstration table and medical models from above, clean symmetrical composition'
    },

    texture: [
      'white wall texture with subtle plaster marks',
      'light wood floor grain with natural color variation',
      'fabric weave texture on cotton uniforms showing cloth fiber',
      'metal medical equipment with subtle brushed finish',
      'glass refraction on laboratory beakers showing thickness',
      'paper texture on medical books and charts'
    ],

    props: [
      'human anatomy model with realistic proportions',
      'medical textbooks with colorful diagrams',
      'whiteboard with clean markers and erasers',
      'demonstration table with gray anti-slip mat',
      'stethoscope and blood pressure monitor',
      'small potted green plants on windowsill'
    ],

    duration: { min: 3, max: 8, default: 5 },

    // 禁止出现的元素（防止神话风格混入）
    forbidden: [
      'floating islands', 'spiritual mist', 'mystical glow',
      'Honghuang era', 'ancient Chinese architecture',
      'ink wash painting background', 'divine light rays',
      'supernatural particles', 'fantasy landscape',
      'dark gloomy atmosphere', 'horror elements'
    ]
  },

  'product-showcase': {
    id: 'product-showcase',
    name: 'Product Showcase Space',
    nameCN: '产品展示空间',
    description: '现代极简产品展示空间，适合产品介绍、营销推广、电商展示',
    category: 'commercial-promotion',

    environment: {
      base: 'modern minimalist product showcase space with white cyclorama backdrop curving seamlessly into floor, soft diffused overhead lighting creating even illumination, reflective white floor with subtle gloss, clean geometric display stands in light wood and brushed metal',
      furniture: 'minimalist product podium with adjustable height, clean display shelves with subtle warm backlight, small accent tables for product comparison',
      equipment: 'softbox overhead lighting array, subtle rim light for product separation, clean background lighting',
      atmosphere: 'clean, modern, professional, premium, focused attention on product, uncluttered and sophisticated'
    },

    lighting: 'soft diffused studio lighting 5500K from overhead softbox array, even illumination across entire space, subtle rim light from behind product for separation, gentle shadows under product, no harsh highlights or blown whites',

    colorPalette: [
      { name: '纯白', hex: '#FFFFFF', usage: '主背景色，无限白空间' },
      { name: '浅灰', hex: '#F5F5F5', usage: '地面、次要背景' },
      { name: '产品橙', hex: '#FF9800', usage: '重点产品强调、CTA元素' },
      { name: '科技蓝', hex: '#2196F3', usage: '科技产品、数据展示' },
      { name: '金属银', hex: '#C0C0C0', usage: '金属质感、高端感' },
      { name: '暖木', hex: '#8D6E63', usage: '展示架、自然温暖对比' }
    ],

    camera: {
      defaults: 'product photography angle, medium shot with shallow depth of field, smooth slow tracking movement',
      establishing: 'wide shot showing full product and showcase space, clean symmetrical composition',
      detail: 'extreme close-up on product feature or texture, macro lens feel, sharp focus on detail',
      rotating: 'smooth 360-degree rotating shot around product, slow and deliberate movement',
      comparison: 'split frame showing two products side by side, equal lighting and composition'
    },

    texture: [
      'seamless white cyclorama texture',
      'brushed metal surface with subtle grain',
      'smooth product surface with realistic material reflection',
      'light wood grain on display stands',
      'soft fabric texture on accent props'
    ],

    props: [
      'geometric display stands',
      'product podium with clean lines',
      'subtle accent lighting fixtures',
      'small plant or lifestyle prop (if appropriate)',
      'clean product packaging'
    ],

    duration: { min: 3, max: 6, default: 4 },

    forbidden: [
      'cluttered background', 'distracting patterns',
      'dark moody atmosphere', 'vintage elements',
      'busy street scene', 'natural outdoor environment'
    ]
  },

  'corporate-office': {
    id: 'corporate-office',
    name: 'Corporate Office',
    nameCN: '现代企业办公室',
    description: '专业现代企业办公环境，适合商业宣传、企业介绍、商务内容',
    category: 'corporate-promotion',

    environment: {
      base: 'modern corporate office with floor-to-ceiling glass walls with subtle reflection, natural light from large windows, minimalist furniture with light wood and white surfaces, green plants in clean white planters, professional and productive atmosphere',
      furniture: 'glass conference table with clean lines, ergonomic office chairs with light fabric, minimalist desk with subtle organization, whiteboard with professional content',
      equipment: 'large monitor displaying clean data visualization, professional video conference equipment, subtle ambient lighting',
      atmosphere: 'professional, collaborative, innovative, clean and organized, bright and energizing'
    },

    lighting: 'natural daylight mixed with warm 4000K artificial overhead light, soft even illumination, gentle shadows, professional ambiance, subtle warm accent from desk lamps',

    colorPalette: [
      { name: '办公白', hex: '#FFFFFF', usage: '主色调，干净专业' },
      { name: '浅灰蓝', hex: '#ECEFF1', usage: '玻璃反射、科技感' },
      { name: '商务蓝', hex: '#607D8B', usage: '品牌色、专业感' },
      { name: '暖木', hex: '#8D6E63', usage: '家具、自然温暖' },
      { name: '生机绿', hex: '#4CAF50', usage: '植物、活力' },
      { name: '金属灰', hex: '#78909C', usage: '设备、现代感' }
    ],

    camera: {
      defaults: 'medium shot eye-level, stable framing, subtle slow push-in or tracking',
      establishing: 'wide shot showing full office space, glass walls, workstations, collaborative areas',
      medium: 'medium shot at conference table, shallow depth of field on speaker',
      closeup: 'close-up on face during presentation or important statement',
      walking: 'smooth tracking shot following person walking through office, glass reflections'
    },

    texture: [
      'glass surface with subtle reflection and transparency',
      'light wood desk grain with natural variation',
      'fabric texture on ergonomic chair upholstery',
      'metal frame with brushed finish on furniture',
      'green plant leaves with natural texture'
    ],

    props: [
      'laptop with clean screen display',
      'notebook and professional pen',
      'coffee cup on coaster',
      'small potted plant',
      'clean whiteboard with strategic content'
    ],

    duration: { min: 3, max: 7, default: 5 },

    forbidden: [
      'messy desk', 'personal clutter',
      'dark lighting', 'cubicle farm aesthetic',
      'outdated technology', 'tacky decorations'
    ]
  },

  'kitchen-lifestyle': {
    id: 'kitchen-lifestyle',
    name: 'Modern Kitchen',
    nameCN: '现代家居厨房',
    description: '温馨现代家居厨房，适合生活方式、美食、家庭类内容',
    category: 'lifestyle',

    environment: {
      base: 'modern bright kitchen with white shaker cabinets and light wood countertops, large window with natural light streaming in, stainless steel appliances with subtle brushed finish, fresh ingredients neatly arranged on counter, warm and inviting home atmosphere',
      furniture: 'kitchen island with light wood top and white base, ergonomic bar stools with light fabric, open shelving with white ceramic dishes and glass containers',
      equipment: 'stainless steel range hood and cooktop, modern refrigerator with clean lines, professional-looking small appliances',
      atmosphere: 'warm, inviting, clean, homey, natural, fresh and wholesome'
    },

    lighting: 'warm natural sunlight 4800K from large kitchen window, soft even kitchen lighting from under-cabinet LED strips, gentle shadows, warm and inviting, subtle warm highlights on fresh ingredients',

    colorPalette: [
      { name: '厨房白', hex: '#FFFFFF', usage: '橱柜主色，干净明亮' },
      { name: '木色', hex: '#FFECB3', usage: '台面、温暖基调' },
      { name: '食材橙', hex: '#FF9800', usage: '新鲜食材、活力' },
      { name: '蔬菜绿', hex: '#4CAF50', usage: '新鲜蔬菜、健康' },
      { name: '金属银', hex: '#B0BEC5', usage: '不锈钢器具' },
      { name: '暖黄', hex: '#FFF8E1', usage: '自然光、温馨' }
    ],

    camera: {
      defaults: 'medium shot slightly low angle, smooth tracking, shallow depth of field on subject',
      establishing: 'wide shot showing full kitchen, island, window, and cooking area',
      overhead: 'top-down shot showing ingredients on counter, flat lay composition',
      closeup: 'close-up on hands preparing food, food texture detail, cooking action',
      detail: 'extreme close-up on sizzling food, steam rising, texture and color'
    },

    texture: [
      'white cabinet surface with subtle wood grain edge',
      'light wood countertop with natural grain and slight wear marks',
      'stainless steel with brushed directional texture',
      'fresh vegetable skin texture with natural gloss',
      'ceramic plate with smooth glaze and subtle rim detail'
    ],

    props: [
      'fresh vegetables and fruits in ceramic bowl',
      'wooden cutting board with knife',
      'glass containers with grains and spices',
      'white ceramic plates and bowls',
      'linen kitchen towel',
      'small potted herb plant on windowsill'
    ],

    duration: { min: 3, max: 6, default: 4 },

    forbidden: [
      'cluttered countertops', 'dirty dishes in sink',
      'dark gloomy atmosphere', 'outdated appliances',
      'messy cooking process', 'unappetizing presentation'
    ]
  }
};

// ─── 场景库类 ───
class DocumentarySceneLibrary {
  constructor() {
    this.scenes = { ...SCENE_TEMPLATES };
  }

  /**
   * 获取场景模板
   * @param {string} sceneId — 场景ID
   * @returns {Object} 完整场景定义
   */
  getScene(sceneId) {
    const scene = this.scenes[sceneId];
    if (!scene) {
      const available = Object.keys(this.scenes).join(', ');
      throw new Error(`[SceneLibrary] 未知场景: "${sceneId}"。可用场景: ${available}`);
    }
    return scene;
  }

  /**
   * 列出所有场景
   */
  listScenes() {
    return Object.values(this.scenes).map(s => ({
      id: s.id,
      name: s.nameCN || s.name,
      category: s.category,
      description: s.description
    }));
  }

  /**
   * 按类别筛选场景
   */
  getScenesByCategory(category) {
    return Object.values(this.scenes)
      .filter(s => s.category === category)
      .map(s => ({ id: s.id, name: s.nameCN || s.name, description: s.description }));
  }

  /**
   * 获取场景环境描述（用于Prompt注入）
   * @param {string} sceneId
   * @returns {string} 环境描述文本
   */
  getEnvironmentPrompt(sceneId) {
    const scene = this.getScene(sceneId);
    const env = scene.environment;
    const parts = [
      env.base,
      env.furniture,
      env.equipment,
      env.atmosphere
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * 获取场景光影描述
   */
  getLightingPrompt(sceneId) {
    return this.getScene(sceneId).lighting;
  }

  /**
   * 获取场景色彩系统（HEX格式，用于Prompt）
   */
  getColorPrompt(sceneId) {
    const scene = this.getScene(sceneId);
    return scene.colorPalette.map(c => `${c.name} ${c.hex}`).join(' ');
  }

  /**
   * 获取场景运镜默认值
   * @param {string} sceneId
   * @param {string} shotType — 'establishing'|'medium'|'closeup'|'tracking'|'overhead'|'detail'|'rotating'|'comparison'
   */
  getCameraPrompt(sceneId, shotType = 'defaults') {
    const scene = this.getScene(sceneId);
    return scene.camera[shotType] || scene.camera.defaults;
  }

  /**
   * 获取完整场景Prompt（环境+光影+色彩+运镜）
   * @param {string} sceneId
   * @param {string} shotType
   * @returns {Object} { environment, lighting, color, camera, full }
   */
  buildScenePrompt(sceneId, shotType = 'defaults') {
    const scene = this.getScene(sceneId);

    const environment = this.getEnvironmentPrompt(sceneId);
    const lighting = scene.lighting;
    const color = this.getColorPrompt(sceneId);
    const camera = this.getCameraPrompt(sceneId, shotType);

    return {
      environment,
      lighting,
      color,
      camera,
      full: `${environment}, ${lighting}, color palette: ${color}, camera: ${camera}`,
      duration: scene.duration,
      forbidden: scene.forbidden
    };
  }

  /**
   * 获取场景材质描述数组
   */
  getTexturePrompts(sceneId) {
    return this.getScene(sceneId).texture;
  }

  /**
   * 获取场景道具列表
   */
  getProps(sceneId) {
    return this.getScene(sceneId).props;
  }

  /**
   * 验证Prompt是否包含场景禁用元素
   * @param {string} sceneId
   * @param {string} promptText
   * @returns {Array} 检测到的禁用元素
   */
  checkForbidden(sceneId, promptText) {
    const scene = this.getScene(sceneId);
    const promptLower = promptText.toLowerCase();
    const found = [];

    for (const item of scene.forbidden) {
      if (promptLower.includes(item.toLowerCase())) {
        found.push(item);
      }
    }

    return found;
  }

  /**
   * 注册自定义场景
   * @param {Object} sceneDef — 场景定义对象
   */
  registerScene(sceneDef) {
    if (!sceneDef.id) throw new Error('[SceneLibrary] 场景定义必须包含id');
    if (!sceneDef.environment?.base) throw new Error('[SceneLibrary] 场景必须包含environment.base');

    this.scenes[sceneDef.id] = {
      ...sceneDef,
      registeredAt: new Date().toISOString()
    };

    console.log(`[SceneLibrary] ✅ 已注册场景: ${sceneDef.id} (${sceneDef.name || sceneDef.nameCN || '未命名'})`);
  }
}

// ─── 导出 ───
module.exports = { DocumentarySceneLibrary, SCENE_TEMPLATES };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Documentary Scene Library v1.0-Peng 测试 ===\n');

  const lib = new DocumentarySceneLibrary();

  // 测试1: 列出场景
  console.log('--- Test 1: 列出所有场景 ---');
  const scenes = lib.listScenes();
  scenes.forEach(s => {
    console.log(`  • ${s.id}: ${s.name} (${s.category})`);
    console.log(`    ${s.description}`);
  });

  // 测试2: 获取医疗工作室场景
  console.log('\n--- Test 2: 医疗工作室场景详情 ---');
  const medical = lib.getScene('medical-studio');
  console.log(`  名称: ${medical.nameCN}`);
  console.log(`  色彩系统: ${medical.colorPalette.map(c => c.name).join(', ')}`);
  console.log(`  运镜类型: ${Object.keys(medical.camera).join(', ')}`);
  console.log(`  道具: ${medical.props.slice(0, 3).join(', ')}...`);

  // 测试3: 环境Prompt
  console.log('\n--- Test 3: 环境Prompt ---');
  const envPrompt = lib.getEnvironmentPrompt('medical-studio');
  console.log(`  长度: ${envPrompt.length}字符`);
  console.log(`  前120字符: ${envPrompt.substring(0, 120)}...`);

  // 测试4: 完整场景Prompt
  console.log('\n--- Test 4: 完整场景Prompt ---');
  const fullPrompt = lib.buildScenePrompt('medical-studio', 'medium');
  console.log(`  环境: ${fullPrompt.environment.length}字符`);
  console.log(`  光影: ${fullPrompt.lighting.length}字符`);
  console.log(`  色彩: ${fullPrompt.color.length}字符`);
  console.log(`  运镜: ${fullPrompt.camera.length}字符`);
  console.log(`  完整: ${fullPrompt.full.length}字符`);

  // 测试5: 产品展示场景
  console.log('\n--- Test 5: 产品展示场景 ---');
  const product = lib.buildScenePrompt('product-showcase', 'detail');
  console.log(`  场景: ${product.environment.substring(0, 100)}...`);
  console.log(`  运镜: ${product.camera}`);

  // 测试6: 禁用元素检测
  console.log('\n--- Test 6: 禁用元素检测 ---');
  const contaminated = 'bright medical studio with floating islands and spiritual mist in background, Honghuang era atmosphere';
  const found = lib.checkForbidden('medical-studio', contaminated);
  console.log(`  检测到的禁用元素: ${found.length}项`);
  found.forEach(f => console.log(`    ❌ ${f}`));

  // 测试7: 材质描述
  console.log('\n--- Test 7: 材质描述 ---');
  const textures = lib.getTexturePrompts('medical-studio');
  console.log(`  材质数: ${textures.length}`);
  textures.forEach(t => console.log(`    • ${t.substring(0, 60)}...`));

  // 测试8: 错误处理
  console.log('\n--- Test 8: 错误处理 ---');
  try {
    lib.getScene('nonexistent');
  } catch (e) {
    console.log(`  ✅ 正确捕获: ${e.message.substring(0, 100)}...`);
  }

  console.log('\n=== 全部测试通过 ===');
}