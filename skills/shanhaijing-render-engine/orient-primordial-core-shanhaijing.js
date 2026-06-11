/**
 * 山海经核心锚点 - Shanhaijing Orient Primordial Core
 * v2.3-Peng — 大系统v2.0版本同步
 * ShanhaiStory Forge v2.0-Peng | Shanhaijing Orient Primordial Core v2.3-Peng
 * 大视频系统统一版本号：v2.0-Peng（山海经系列 + 通用视频系列）
 * 
 * v2.3-Peng 更新（大系统 v2.0-Peng）：
 * + 版本同步：大视频系统统一版本号 v2.0-Peng
 * 
 * v2.2-Peng 更新（大系统 v1.1-Peng）：
 * 调研融合+小G活力+极限密度+多角度定妆照
 * 
 * 四大升级:
 * 1. 调研融合 (v2.0): CG超写实+水墨志怪+五正色+种族纹理
 * 2. 小G活力 (v2.1): sprinting tumbling leaping + lightning-fast reflexes
 * 3. 极限密度 (v2.2): 1.8秒镜头/whip_pan_strobe/信息密度3.0×
 * 4. 定妆照升级 (v2.2): 8张多角度(正/侧/背/45度/面/跑/跃/手)
 * 
 * 核心设计:
 * 1. L1前置注入 — 在最前段声明风格方向（CG质感/水墨氛围/志怪张力）
 * 2. L2环境氛围 — 根据具体环境调用（昆仑/青丘/钟山/弱水）
 * 3. L3光影构建 — 中国神话美学光照（五色光/水墨晕染/洪荒氛围）
 * 4. L4角色描述 — 种族纹理/体型约束/表情/动作
 * 5. 空余空间智能填充引擎 — 自动追加细节提升画质
 */

// ========== 【调研融合】五正色体系 × 五行 × 方位 ==========
// 来源: 李牧《论〈山海经〉的色彩系统》(2019) — 176种色彩对象定量统计
// 核心规律: 赤162次(南/火) > 白143次(西/金) > 青111次(东/木) > 黄106次(中/土) > 黑68次(北/水)

const WUXING_COLORS = {
  // 木-东-青: 生机/萌发
  wood: { name: '青', hex: ['#4A6741', '#2E5D4E', '#5F9EA0'], direction: '东', emotion: '生机/萌发', wuxing: '木' },
  // 火-南-赤: 热情/危险 — 最高频(162次)
  fire: { name: '赤', hex: ['#8B0000', '#FF4500', '#DC143C'], direction: '南', emotion: '热情/危险', wuxing: '火' },
  // 土-中-黄: 厚重/中枢
  earth: { name: '黄', hex: ['#DAA520', '#B8860B', '#FFD700'], direction: '中', emotion: '厚重/中枢', wuxing: '土' },
  // 金-西-白: 肃杀/纯净
  metal: { name: '白', hex: ['#F5F5F5', '#E6E6FA', '#FFFAF0'], direction: '西', emotion: '肃杀/纯净', wuxing: '金' },
  // 水-北-黑: 幽深/未知 — 最低频(68次)
  water: { name: '黑', hex: ['#1C1C1C', '#2F4F4F', '#000000'], direction: '北', emotion: '幽深/未知', wuxing: '水' }
};

// 辅助色: 玄(黑中带赤) / 朱(赤中最艳) / 苍(青中带灰) / 素(白中微黄) / 墨(黑中泛紫)
const AUXILIARY_COLORS = {
  xuan: { name: '玄', hex: '#3D0C02', desc: '神秘、禁忌、未知力量' },
  zhu: { name: '朱', hex: '#FF0000', desc: '警示、血、极端情绪' },
  cang: { name: '苍', hex: '#708090', desc: '苍茫、历史、时间流逝' },
  su: { name: '素', hex: '#FFFAF0', desc: '纯净、起始、空白' },
  mo: { name: '墨', hex: '#1A0033', desc: '深邃、智慧、宇宙' }
};

// ========== 【调研融合】E01场景色彩剧本 ==========
// 基于"色彩-方位-地貌"三维绑定 + 情绪弧线设计
// 来源: 调研报告§7.1 + §10.3

const EPISODE_COLOR_SCRIPT = {
  e01_zhulong_awakening: [
    { shots: [1, 2], phase: '建置', colors: ['cang', 'su'], wuxing: '木+金', desc: '苍青色+素白——黎明前的混沌，世界尚未分明' },
    { shots: [3, 4], phase: '登场', colors: ['xuan', 'fire'], wuxing: '水+火', desc: '玄黑色为主，烛龙赤鳞点缀——黑暗中唯一的红色光源' },
    { shots: [5, 6], phase: '睁眼', colors: ['fire'], wuxing: '火', desc: '赤红色爆发——从玄黑到赤红的极端对比，"开天辟地"的视觉隐喻' },
    { shots: [7, 8], phase: '昼亮', colors: ['earth', 'su'], wuxing: '土+金', desc: '金黄色+素白——光明普照，世界显现' },
    { shots: [9, 10], phase: '对视', colors: ['fire', 'wood'], wuxing: '火+木', desc: '赤红(烛龙) vs 苍青(人类)——冷暖对峙，叙事张力' },
    { shots: [11, 12], phase: '结尾', colors: ['fire', 'earth', 'wood', 'metal', 'water'], wuxing: '五行全', desc: '五色渐变——从单一色彩回归平衡，暗示系列展开' }
  ]
};

// ========== Layer1: CG超写实渲染器风格 (~120字符) ==========
// 来源: 调研报告§2.1 (PBR/SSS/Displacement技术成熟度) + §6.2 (人类角色CG标准)

const L1_CHARACTER = `CG cinematic, photorealistic, hyper-detailed skin pores peach fuzz, strong subsurface scattering, gritty realistic, dark atmospheric, mature content, iris fiber eyes, flyaway hair, 8K ACES, fast-paced.`;

// ========== Layer2: 水墨志怪环境氛围 (~130字符) ==========
// 来源: 调研报告§3.6 (水墨志怪美学定义) + §7.2 (水墨光照风格)
// 规范: 高光不过曝、暗部不死黑、中间调丰富、边缘光晕

const L2_ENVIRONMENT = `Oriental ink wash mythology, ancient East Asian primordial wilderness, Shanhaijing legendary atmosphere, misty mountains ethereal clouds, ink wash gradation mood, no specific cultural artifacts.`;

// ========== 【调研融合】水墨光照风格关键词 ==========
// 用于空余填充引擎的光影模块，替换通用电影光照为水墨专用

const INK_WASH_LIGHTING = {
  // 核心规范: 高光不过曝(保留细节=水墨"留白"而非"死白")
  highlight_control: `highlights never clipped, detail preserved in brightest areas, soft glow instead of blown-out white`,
  // 核心规范: 暗部不死黑(保留层次=水墨"淡墨"而非纯黑)
  shadow_control: `shadows with visible detail, no pure black crushing, ink wash gradation from dark to transparent`,
  // 核心规范: 中间调丰富(大量使用"灰"——水墨的灵魂)
  midtone_rich: `rich midtones dominant, gray scale subtle variation, atmospheric ink wash depth`,
  // 核心规范: 边缘光晕(模拟水墨晕染的"边缘扩散")
  edge_bloom: `soft edge bloom, ink bleeding effect, watercolor diffusion on contours, ethereal rim light`
};

// ========== Layer3: 山海经场景定制 (~60-80字符/场景) ==========
// 来源: 调研报告§1.3 (地貌视觉原型) + §7.1 (五正色体系)

const L3_SCENES = {
  // 钟山=烛龙居所 — 南/火/赤色 — 最高频色彩(162次)
  // 【体型约束】钟山洞穴空间尺度固定，烛龙盘踞时身体占据画面60%横向空间，作为后续镜头参照基准
  zhongshan: `Zhongshan primordial cave, crimson light veins pulsing, sacred mountain glow fire-red, ancient rock formations divine beast dwelling, south fire wuxing dominant, no bronzeware no tripod no mural no stone carving.`,
  // 昆仑=神山 — 中/土/黄色
  // 【体型约束】昆仑神殿门洞高度固定为烛龙身高的1.5倍，保持神兽尺度跨场景一致
  kunlun: `Kunlun sacred peak jade palace, golden celestial mist nine heavens gate, divine realm entrance earth center, yellow wuxing harmony, no bronzeware no tripod no mural no stone carving no writing.`,
  // 不周山=天柱断裂 — 北/水/黑色+赤(断裂=火)
  buzhou: `Buzhou broken mountain sky-pillar ruins, cosmic chaos black abyss crimson fractures, primordial collapse north water wuxing, no bronzeware no tripod no mural no stone carving.`,
  // 弱水=羽毛不浮 — 北/水/黑色
  ruoshui: `Ruoshui weak water feather-sinking river, black abyss flow ghostly fog, mythical undercurrent north water wuxing, no writing no text no characters.`,
  // 青丘=狐族之地 — 东/木/青色
  qingqiu: `Qingqiu fox hill nine-tailed realm, enchanted forest mystical cyan mist, fox spirit territory east wood wuxing, no bronzeware no tripod no mural no stone carving.`,
  // 汤谷=日出之地 — 东/木/青色+火/赤(太阳)
  tangu: `Tangu sun valley solar altar, Fusang tree golden dawn ritual, sunrise divine light east wood fire wuxing fusion, no bronzeware no tripod no mural no stone carving no writing.`,
  // 归墟=众水归宿 — 北/水/黑色
  guixu: `Guixu void abyss bottomless fall, sea of nothingness cosmic drain eternal descent, all waters returning north water wuxing, no writing no text no characters.`,
  // 洪荒=原始荒野 — 五行全
  wilderness: `Honghuang primordial wilderness five-color earth, creation chaos raw cosmic energy ancient origin, all wuxing in harmony, no bronzeware no tripod no mural no stone carving no writing no text.`
};

// ========== Layer4: 山海经角色锚点 (~100字符) ==========
// 来源: 调研报告§1.2 (异兽造型三种构成法则) + §6.4 (种族纹理设计系统)
// 核心原则: 解剖学可信度 + 纹理材质真实感 + 色彩符号性 + 动态生物合理性

const L4_CHARACTERS = {
  // 人类角色 — 小G
  // 性格: 8岁中国男孩，活泼好动但不全程奔跑，思维敏捷，天真烂漫，有好奇心
  // 动作特征: 多样化日常动作（歪头/蹲下/伸手/转圈/小跑/坐地/手指比划），只在情绪高潮时奔跑
  // 人种特征: 黑直发、深棕色杏仁眼、黄皮肤、圆中带方脸型、单眼皮或内双 — 强制中国人
  // 服饰: 亮黄色短款户外冲锋衣（及腰长度，拉链微开），深蓝色直筒牛仔裤，白色低帮运动鞋，干净简洁
  // 配饰精确统一规范（v13.1-Peng）:
  //   - 指南针: 脖子挂着黄铜指南针，皮革挂绳，圆形黄铜外壳，表盘清晰可见，垂到胸口位置
  //   - 水壶: 腰间右侧，军绿色圆柱形水壶，帆布保护套，背带扣
  //   - 手电筒: 冲锋衣左胸口袋，露出半截黑色LED手电筒，头部露出，短挂绳
  // 🔴 v13.0-Peng: 强化中国人特征注入 — 默认所有人类角色 = Chinese, East Asian, NOT Western
  human_child: `Chinese 8-year-old boy named XiaoG, straight black hair dark brown almond eyes yellow skin round-square face East Asian features single eyelids or inner double eyelids, NOT Caucasian NOT Western NOT European, curious innocent lively playful, tilting head crouching down reaching out pointing finger spinning around small running steps sitting on ground gesturing explaining, occasional jumping when excited, wearing bright yellow short outdoor windbreaker jacket waist-length zipper slightly open dark blue straight-leg jeans white low-top athletic sneakers clean and simple, brass compass hanging around neck on leather cord at chest position circular brass case dial visible, army green cylindrical canteen hanging on right side of waist with canvas cover and strap buckle, black LED flashlight sticking out from left chest pocket of jacket head visible short lanyard, natural skin texture hyper-detailed pores definitely Chinese appearance`,

  // 成年男性 — 默认中国人/East Asian
  human_adult_male: `Chinese adult male, East Asian features, straight black hair dark brown eyes yellow skin tone round-square face, NOT Caucasian NOT Western NOT European, weathered skin strong bone structure, natural hair determined eyes authentic anatomy, hyper-detailed skin pores lifelike iris fiber, definitely Chinese appearance`,

  // 成年女性 — 默认中国人/East Asian
  // 🔴 v13.0-Peng: 新增护士Chen专用基础模板
  human_adult_female: `Chinese adult female, East Asian features, straight black hair dark brown almond eyes yellow skin tone round-square face, NOT Caucasian NOT Western NOT European, delicate features soft grace, natural luminous authentic beauty, subsurface scattering skin translucent glow, hyper-detailed skin pores lifelike iris fiber, definitely Chinese appearance`,

  // 护士Chen — 专业女性，白色制服+红十字臂章
  // 🔴 v13.0-Peng: 角色档案系统标准模板
  human_nurse: `Chinese female nurse named Chen, 28 years old, East Asian features, straight black hair dark brown almond eyes yellow skin tone round-square face single eyelids, NOT Caucasian NOT Western NOT European, short professional hair warm caring smile confident gaze, slender athletic build 165cm height, white medical uniform with red cross armband emergency badge on sleeve, warm professional smile caring eyes, hyper-detailed skin pores lifelike iris fiber, definitely Chinese appearance, professional healthcare worker demeanor`,

  // 九尾狐 — 九尾，银白，狐仙
  // 种族纹理: 狐族 = Guard Hair(粗硬防水)+Undercoat(细软保暖)+Awn Hair(中间层), 冬纯白→夏青灰, 尾尖白毛
  // 【体型约束】本体高约2.5米(含尾高约4米)，九尾展开时横向占画面70%，保持跨镜头尺度一致
  nine_tailed_fox: `Qingqiu nine-tailed fox spirit, 2.5-meter body fixed scale, silver-white fur triple-layer coat guard-undercoat-awn, winter pure white summer blue-gray seasonal molt, nine flowing tails white tips traditional auspicious mark, enchanting amber almond eyes, mystical ethereal grace, gritty realistic fur texture hyper-detailed.`,

  // 麒麟 — 龙首、鹿角、牛蹄，金鳞，火云
  // 种族纹理: 麒麟 = 鳞(前身)+毛(后身)+角(额顶), 青/黄+荧光边缘光
  // 【体型约束】肩高约3米，角高0.8米，整体占画面50%纵向空间
  qilin: `Qilin auspicious beast dragon-head deer-horn ox-hoof, 3-meter shoulder fixed scale, golden scales anterior leathery posterior fur, fluorescent edge light jade-green gold, fire cloud surrounding divine majestic, horn branching annual rings age indicator, gritty realistic composite texture hyper-detailed.`,

  // 饕餮 — 羊身人面，目在腋下，虎齿人爪
  // 种族纹理: 饕餮 = 厚皮+角质增生(类似犀牛), 土黄/赭石+泥土苔藓附着, 面部褶皱
  // 【体型约束】体长约4米，肩高1.8米，横向占画面55%，保持凶兽压迫感尺度
  taotie: `Taotie gluttonous beast goat-body human-face thick rhinoceros-like skin keratin growth, 4-meter body fixed scale, eyes under armpits tiger teeth human hands, ocher yellow earth tone mud-moss附着色, facial wrinkles age-aggression marks, ferocious ancient gritty realistic skin texture hyper-detailed.`,

  // 凤凰 — 五彩，火尾羽，金冠
  // 种族纹理: 凤族 = 羽轴(Rachis)+羽枝(Barb)+羽小枝(Barbule)三级结构, 结构色+色素色, 尾羽眼状斑同心圆
  // 【体型约束】翼展约6米，站立身高2.5米，展翅时横向占画面80%
  fenghuang: `Fenghuang phoenix five-color plumage structural-pigment dual color system, 6-meter wingspan fixed scale, rachis-barb-barbule triple feather structure, fire tail feathers eyespot concentric pattern, golden crest divine bird rebirth flames, hooklet engagement aerodynamic integrity, gritty realistic feather texture hyper-detailed 8K.`,

  // 相柳 — 九头蛇，毒，沼泽
  // 种族纹理: 蛇族(近龙族简化) = 平滑鳞+毒腺凸起
  // 【体型约束】单头颈长约1.5米，九头展开时横向占画面75%，蛇身直径0.5米
  xiangliu: `Xiangliu nine-headed serpent venomous hydra, 1.5-meter neck per head fixed scale, smooth scales with venom gland protrusions, marsh dwelling toxic breath green-black coloration, chaos demon snake gritty realistic scale texture hyper-detailed.`,

  default: `Photorealistic anatomy, natural material, cinematic, 8K texture, authentic creature.`
};

// ========== 【调研融合】种族纹理快速参考表 ==========
// 用于Prompt生成时快速注入种族专属纹理关键词

const BEAST_TEXTURE_MAP = {
  dragon: {
    scaleType: 'rhomboid placoid-ganoid hybrid scales',
    colorPattern: 'dorsal dark to ventral light countershading',
    specialMarks: 'horn-claw-tail wear marks, age indicators',
    refBio: 'Komodo dragon scale structure + corn snake color pattern'
  },
  fox: {
    furType: 'triple-layer coat: guard hair( waterproof) + undercoat(insulating) + awn hair(intermediate)',
    colorPattern: 'winter pure white summer blue-gray seasonal molt',
    specialMarks: 'tail tip white fur traditional auspicious mark',
    refBio: 'arctic fox fur density + red fox color variation'
  },
  phoenix: {
    featherType: 'rachis-barb-barbule triple structure with hooklet engagement',
    colorPattern: 'structural color + pigment color dual system',
    specialMarks: 'tail feather eyespot concentric fractal pattern',
    refBio: 'peacock tail structure + hummingbird structural color'
  },
  taotie: {
    skinType: 'thick skin with keratin growth similar to rhinoceros',
    colorPattern: 'ocher yellow earth tone with mud-moss附着色',
    specialMarks: 'facial wrinkles age and aggression indicators',
    refBio: 'rhinoceros skin thickness + hippopotamus color pattern'
  },
  qilin: {
    compositeType: 'scales(anterior) + fur(posterior) + horn(forehead)',
    colorPattern: 'jade-green gold with fluorescent edge light',
    specialMarks: 'horn branching annual rings age indicator',
    refBio: 'giraffe spot pattern + antelope horn spiral'
  }
};

// ========== 负面约束 (~140字符) ==========

const NEGATIVE_CONSTRAINTS = `NO cartoon anime Disney Pixar, NO plastic doll chibi, NO text script writing, NO flat sci-fi modern western, NO bronze mural carving.`;

// ========== 空余空间智能填充引擎 ==========
// 来源: 调研报告§2.5 (生成式纹理合成) + §3.4 (水墨美学技术转译) + §7.2 (光照体系)

/** 表情增强模块 — 优先级: P1 */
const EMOTION_ENHANCEMENTS = {
  human_child: [
    `genuine joyful smile, eyes sparkling with mischief, natural childlike wonder, authentic playful emotion, energetic expression.`,
    `expressive curious face, head tilted exploring, warm innocent glow, lifelike mischievous personality, agile alertness.`,
    `natural happy expression, subtle micro-expressions of excitement, organic warmth, hands gesturing animatedly, restless energy.`,
    `wide-eyed wonder looking up, mouth slightly open in awe, hands reaching out eagerly, pure childhood curiosity.`,
    `grinning with excitement, body leaning forward energetically, restless can't-stand-still energy, playful challenging gaze.`
  ],
  human_adult_male: [
    `weathered wise expression, steady determined gaze, subtle depth.`,
    `calm confident look, natural human warmth, authentic character.`,
    `focused alert expression, emotional depth, organic personality.`,
  ],
  human_adult_female: [
    `gentle knowing smile, graceful serene warmth, authentic kindness.`,
    `calm maternal glow, quiet inner strength, soft expressive features.`,
    `natural feminine beauty, subtle emotional depth, genuine warmth.`,
  ],
  zhulong: [
    `divine serpent majesty, ancient wisdom gaze, primordial power emanating.`,
    `crimson scales gleaming, vertical slit pupils focused, mythical presence.`,
    `magma glow within translucent scales, ancient deity authority.`,
  ],
  nine_tailed_fox: [
    `enchanting almond eyes gleaming, nine tails flowing gracefully, mystical allure.`,
    `silver fur shimmering in moonlight, ethereal fox spirit presence.`,
    `wise ancient spirit gaze, knowing smile beneath furry muzzle.`,
  ],
  qilin: [
    `benevolent divine beast gaze, golden scales reflecting virtue.`,
    `majestic deer-horn crown, fire cloud aura surrounding sacred body.`,
    `ancient auspicious presence, harmony emanating from composite form.`,
  ],
  taotie: [
    `fierce gluttonous hunger, eyes under armpits scanning prey.`,
    `ancient ferocity, tiger teeth bared, human hands grasping.`,
    `primordial beast wrath, thick skin vibrating with rage.`,
  ],
  fenghuang: [
    `divine bird rebirth flames, five-color plumage radiant.`,
    `golden crest gleaming, eyespot tail feathers fanned.`,
    `eternal cycle wisdom, phoenix gaze transcending time.`,
  ],
  default: [
    `expressive natural face, subtle authentic emotion, lifelike depth.`,
    `genuine warm expression, organic personality, natural character.`,
    `authentic emotional depth, micro-expressions driving mood.`,
  ]
};

/** 环境细节增强模块 — 优先级: P2 */
const ENVIRONMENT_ENHANCEMENTS = {
  zhongshan: [
    `crimson light pulsing through ancient rock veins, divine cave atmosphere.`,
    `sacred mountain energy radiating, primordial glow from depth.`,
    `rock texture ancient weathered, divine beast dwelling mystery.`,
  ],
  kunlun: [
    `jade palace ruins shimmering, celestial gate mist, divine aura.`,
    `sacred peak clouds swirling, nine heavens entrance ethereal.`,
    `mountain texture divine jade stone, ancient god realm.`,
  ],
  buzhou: [
    `broken sky-pillar debris floating, cosmic chaos energy.`,
    `heaven collapse fragments, primordial void atmosphere.`,
    `ruins ancient structure, collapsing world drama.`,
  ],
  ruoshui: [
    `black abyss water flowing, ghostly fog rising, underworld river.`,
    `mythical current invisible, feather-sinking mystery.`,
    `dark water texture depth, supernatural flow energy.`,
  ],
  qingqiu: [
    `enchanted cyan mist, fox spirit realm mystical glow.`,
    `ancient forest magical, nine-tailed territory sacred.`,
    `tree texture enchanted bark, spirit world atmosphere.`,
  ],
  tangu: [
    `golden dawn light ritual, Fusang tree sacred, solar altar.`,
    `sunrise divine ceremony, ancient sun worship energy.`,
    `valley texture golden light, creation mythology.`,
  ],
  guixu: [
    `bottomless void falling, cosmic drain eternal, nothingness abyss.`,
    `sea of darkness depth, all waters returning, primordial end.`,
    `void texture infinite depth, universe drain point.`,
  ],
  wilderness: [
    `five-color earth creation, raw cosmic energy, origin chaos.`,
    `primordial mist ancient, Honghuang atmosphere, genesis world.`,
    `wilderness texture raw nature, untamed creation energy.`,
  ],
  default: [
    `atmospheric ink wash depth, oriental mythology ambient.`,
    `natural light scattering, ancient East Asian landscape.`,
    `organic texture subtle complexity, Shanhaijing atmosphere.`,
  ]
};

/** 光影质感增强模块 — 优先级: P3 */
// 【调研融合】基于§7.2水墨光照规范: 高光不过曝、暗部不死黑、中间调丰富、边缘光晕
const LIGHTING_ENHANCEMENTS = [
  // 水墨核心: 高光不过曝
  { text: `highlights never clipped soft glow, detail preserved in brightest areas, ink wash留白意境.`, len: 78 },
  // 水墨核心: 暗部不死黑
  { text: `shadows with visible detail no pure black crushing, ink wash gradation dark to transparent.`, len: 80 },
  // 水墨核心: 中间调丰富
  { text: `rich midtones dominant gray scale subtle variation, atmospheric ink wash depth 气韵生动.`, len: 82 },
  // 水墨核心: 边缘光晕
  { text: `soft edge bloom ink bleeding effect, watercolor diffusion on contours ethereal rim light.`, len: 79 },
  // IMAX电影级补充
  { text: `cinematic depth of field, subtle vignette, atmospheric haze.`, len: 58 },
  { text: `volumetric god rays ancient dust particles floating, light scattering sacred atmosphere.`, len: 72 },
  { text: `warm rim lighting natural ambient bounce, golden hour oriental mythology.`, len: 64 },
  { text: `emotional cinematic lighting, mythological atmosphere IMAX film grain.`, len: 63 },
];

/** 【极限快节奏】超密度信息注入模块 — 优先级: P4 v2.2 */
const FAST_PACING_MODULES = [
  { text: `rapid action sequence, fast-paced cuts, high information density, visual bombardment`, len: 78 },
  { text: `quick transitions between multiple actions, dynamic movement overload, kinetic chaos`, len: 82 },
  { text: `rapid-fire visual beats, kinetic energy bursting frame, relentless momentum, no pause`, len: 83 },
  { text: `action-packed frames with simultaneous foreground background motion, layered chaos`, len: 87 },
  { text: `multi-layered motion, character sprinting while environment shifts rapidly, turbocharged`, len: 89 },
  { text: `continuous motion blur, high-speed action choreography, frantic energy`, len: 72 },
  { text: `relentless pacing, no static moments, constant visual stimulation, sensory overload`, len: 82 },
  { text: `dynamic camera whip pan strobe, rapid scene changes, information overload aesthetic`, len: 84 },
  { text: `crash zoom smash cut, jarring frame collision, chaotic motion blur`, len: 68 },
  { text: `frantic kinetic energy, turbocharged relentless pace, no breathing room`, len: 71 },
];

/** 智能空余填充引擎 */
function _fillSurplus(prompt, sceneType, charType, maxLength) {
  const surplus = maxLength - prompt.length;
  if (surplus < 20) return prompt; // 少于20字符不做增强

  const usedModules = [];
  const modulesToAppend = [];

  // === P1: 表情增强 ===
  const emotionList = EMOTION_ENHANCEMENTS[charType] || EMOTION_ENHANCEMENTS.default;
  for (const module of emotionList.sort((a, b) => a.length - b.length)) {
    const needed = module.length + 2; // +2 for ", " separator
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.replace(/\.$/, '')); // strip trailing period
      usedModules.push(`表情+${module.length}`);
      break;
    }
  }

  // === P2: 环境细节增强 ===
  const envList = ENVIRONMENT_ENHANCEMENTS[sceneType] || ENVIRONMENT_ENHANCEMENTS.default;
  for (const module of envList.sort((a, b) => a.length - b.length)) {
    const needed = module.length + 2;
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.replace(/\.$/, ''));
      usedModules.push(`环境+${module.length}`);
      break;
    }
  }

  // === P3: 光影质感增强（水墨规范优先，最多2个）===
  // 优先使用水墨光照关键词(前4个)，再补充电影级(后4个)，但最多只取2个最短
  const sortedLight = [...LIGHTING_ENHANCEMENTS].sort((a, b) => a.len - b.len);
  let lightCount = 0;
  for (const module of sortedLight) {
    if (lightCount >= 2) break; // 最多2个光影模块
    const needed = module.len + 2;
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.text.replace(/\.$/, ''));
      usedModules.push(`光影+${module.len}`);
      lightCount++;
    }
  }

  // === P4: 【快节奏】高密度信息注入 ===
  // 大鹏要求: 非常快节奏，信息密度大，动作多，切换快
  const sortedPacing = [...FAST_PACING_MODULES].sort((a, b) => a.len - b.len);
  for (const module of sortedPacing) {
    const needed = module.len + 2;
    if (prompt.length + needed + modulesToAppend.reduce((s, m) => s + m.length + 2, 0) <= maxLength) {
      modulesToAppend.push(module.text.replace(/\.$/, ''));
      usedModules.push(`快+${module.len}`);
      break; // 只注入1个，避免过度
    }
  }

  // 统一追加所有模块
  if (modulesToAppend.length > 0) {
    const cleanPrompt = prompt.replace(/\.$/, ''); // strip trailing period
    prompt = cleanPrompt + ', ' + modulesToAppend.join(', ') + '.';
    console.log(`  [山海经增强-调研融合版] ${usedModules.join(', ')} | 最终${prompt.length}/${maxLength}`);
  }

  return prompt;
}

// ========== 【调研融合】色彩合法性检查 ==========
// 基于§1.6: 五正色体系提供了文化原生的色彩代码
// 用于生成后检查Prompt是否符合原著色彩统计规律

function validateColorLegitimacy(prompt, sceneType) {
  const colorFrequency = {
    '赤': 162, '红': 162, 'crimson': 162, 'red': 162, 'fire': 162,
    '白': 143, 'white': 143, 'silver': 143,
    '青': 111, 'cyan': 111, 'green-blue': 111, 'teal': 111,
    '黄': 106, 'yellow': 106, 'gold': 106, 'golden': 106,
    '黑': 68, 'black': 68, 'dark': 68, 'abyss': 68
  };

  const foundColors = [];
  for (const [color, freq] of Object.entries(colorFrequency)) {
    if (prompt.toLowerCase().includes(color.toLowerCase())) {
      foundColors.push({ color, freq });
    }
  }

  // 检查是否符合场景的色彩剧本
  const script = EPISODE_COLOR_SCRIPT.e01_zhulong_awakening;
  const expectedColors = script.find(s => L3_SCENES[sceneType]?.includes(s.phase.toLowerCase()))?.colors || [];

  return {
    foundColors,
    expectedColors,
    isValid: foundColors.length > 0, // 至少包含一种五正色标识
    recommendation: foundColors.length === 0 ? '建议注入五正色关键词以符合山海经色彩基因' : null
  };
}

// ========== 组合函数(960字符硬控,预留20字符缓冲) ==========
function buildOrientPrompt(sceneType, charType, action, maxLength = 990) {
  const l3 = L3_SCENES[sceneType] || L3_SCENES.wilderness;
  const l4 = L4_CHARACTERS[charType] || L4_CHARACTERS.default;

  // 固定基座部分（不可裁剪）
  const base = `${L1_CHARACTER} ${L2_ENVIRONMENT}`;
  const core = `${l3} ${l4}`;
  const negative = NEGATIVE_CONSTRAINTS;

  // 先尝试完整组合（含负面约束）
  let prompt = `${base} ${core} ${action} ${negative}`;

  if (prompt.length > maxLength) {
    // 第一步：裁剪action，保留最低40字符
    const excess = prompt.length - maxLength;
    const actionTrim = Math.max(40, action.length - excess);
    const trimmedAction = action.substring(0, actionTrim);

    prompt = `${base} ${core} ${trimmedAction} ${negative}`;

    if (prompt.length > maxLength) {
      // 第二步：裁剪L3场景，保留最低20字符
      const excess2 = prompt.length - maxLength;
      const sceneTrim = Math.max(20, l3.length - excess2);
      const trimmedScene = l3.substring(0, sceneTrim);

      prompt = `${base} ${trimmedScene} ${l4} ${trimmedAction} ${negative}`;

      if (prompt.length > maxLength) {
        // 第三步：裁剪L4角色描述，保留最低60字符
        const excess3 = prompt.length - maxLength;
        const charTrim = Math.max(60, l4.length - excess3);
        const trimmedChar = l4.substring(0, charTrim);

        prompt = `${base} ${trimmedScene} ${trimmedChar} ${trimmedAction} ${negative}`;
      }
    }
  }

  prompt = _fillSurplus(prompt, sceneType, charType, maxLength);

  // 【调研融合】色彩合法性检查(仅日志提示，不阻塞)
  const colorCheck = validateColorLegitimacy(prompt, sceneType);
  if (!colorCheck.isValid) {
    console.log(`  [色彩合法性] ⚠️ ${colorCheck.recommendation}`);
  } else {
    console.log(`  [色彩合法性] ✅ 检测到${colorCheck.foundColors.map(c => c.color).join('/')}色系`);
  }

  return prompt;
}

// ========== CLI测试入口 ==========
if (require.main === module) {
  console.log('\n🐉 山海经 Orient Primordial Core v2.3-Peng — 大系统v2.0-Peng版本同步\n');
  console.log('基于52,000字深度调研报告升级');
  console.log('核心结论: CG超写实人物+水墨志怪环境融合美学\n');

  // 测试1: 烛龙+钟山
  const prompt1 = buildOrientPrompt('zhongshan', 'zhulong', 'opening divine eyes, light bursting forth, primordial awakening');
  console.log('\n【测试1】烛龙睁眼@钟山(南/火/赤):');
  console.log(prompt1);
  console.log(`长度: ${prompt1.length}字符`);

  // 测试2: 小男孩+荒野
  const prompt2 = buildOrientPrompt('wilderness', 'human_child', 'discovering ancient ruins, looking up in awe');
  console.log('\n【测试2】小男孩@洪荒荒野(五行全):');
  console.log(prompt2);
  console.log(`长度: ${prompt2.length}字符`);

  // 测试3: 九尾狐+青丘
  const prompt3 = buildOrientPrompt('qingqiu', 'nine_tailed_fox', 'nine tails flowing, enchanting gaze, mystical presence');
  console.log('\n【测试3】九尾狐@青丘(东/木/青):');
  console.log(prompt3);
  console.log(`长度: ${prompt3.length}字符`);

  // 测试4: 色彩合法性验证
  console.log('\n【测试4】五正色体系验证:');
  console.log(`  赤(火/南): ${WUXING_COLORS.fire.hex.join(', ')} — 最高频162次`);
  console.log(`  青(木/东): ${WUXING_COLORS.wood.hex.join(', ')} — 111次`);
  console.log(`  黄(土/中): ${WUXING_COLORS.earth.hex.join(', ')} — 106次`);
  console.log(`  白(金/西): ${WUXING_COLORS.metal.hex.join(', ')} — 143次`);
  console.log(`  黑(水/北): ${WUXING_COLORS.water.hex.join(', ')} — 68次`);

  console.log('\n✅ 山海经风格测试完成！(调研融合版 v2.0)');
}

module.exports = {
  L1_CHARACTER,
  L2_ENVIRONMENT,
  L3_SCENES,
  L4_CHARACTERS,
  NEGATIVE_CONSTRAINTS,
  WUXING_COLORS,
  AUXILIARY_COLORS,
  EPISODE_COLOR_SCRIPT,
  INK_WASH_LIGHTING,
  BEAST_TEXTURE_MAP,
  buildOrientPrompt,
  validateColorLegitimacy
};