#!/usr/bin/env node
/**
 * 《山海经：异兽志》导演系统 — Shanhaijing Director
 * v2.2-Peng — 调研融合+小G活力+快节奏架构+极限密度
 * 
 * ⚠️ 重要声明：这是【山海经专用导演系统】，为Nirath原创世界观深度定制
 * ⚠️ 通用视频分支（FPV/科普/广告）请勿引用此文件
 * ⚠️ 通用分支请使用：skills/seedance-director/scripts/director-pipeline.js
 * 
 * 四大升级:
 * 1. 调研融合 (v2.0基座): 五正色/水墨光照/种族纹理/场景剧本
 * 2. 小G活力改造 (v2.1): 孩童活泼性格+灵动试探模板+急速跟随运镜
 * 3. 快节奏架构 (v2.1): GLOBAL_PACING_MODE/2.5秒镜头/hard_cut主导/信息密度2.0×
 * 4. 极限密度 (v2.2新增): 1.8秒镜头/whip_pan_strobe/信息密度3.0×/动作更激烈
 * 
 * 5种志怪单元剧模板 + Anthology系列一致性管理 + 17情绪-运镜映射
 * 以Seedance director的9步流水线为框架，志怪专业能力为插件注入
 */

const { Bestiary } = require('../shanhaijing-bestiary/bestiary');
const { SoulForge } = require('../shanhaijing-soul-forge/soul-forge');

// ============ 【全局节奏配置】极限密度超快模式 v2.2 ============
const GLOBAL_PACING_MODE = 'extreme_density_hyper_fast'; // 极限密度超快模式
const SHOT_DURATION_BASE = 1.8; // 从2.5秒→1.8秒/镜头，12镜头=21.6秒，节奏拉满
const TRANSITION_STYLE = 'whip_pan_hard_cut_strobe'; // 甩镜+硬切+频闪，最激进切换
const INFO_DENSITY_MULTIPLIER = 3.0; // 从2.0×→3.0×，信息密度再翻倍

// 极限快节奏Prompt注入词库（信息密度×3，动作激烈×3，切换狂暴）
const FAST_PACING_KEYWORDS = [
  'rapid action sequence', 'fast-paced cuts', 'high information density',
  'quick transitions', 'dynamic movement overload', 'rapid-fire visual beats',
  'kinetic energy bursting', 'relentless momentum', 'action-packed frames',
  'multi-layered motion', 'simultaneous foreground background action',
  'whip pan strobe', 'crash zoom smash cut', 'jarring frame collision',
  'frantic chaotic motion', 'turbocharged relentless pace', 'no breathing room',
  'sensory overload aesthetic', 'visual bombardment relentless'
];

// ============ 五大志怪单元剧模板 ============
const SHANHAI_EPISODE_TEMPLATES = {
  origin_myth: {
    name: '异兽起源型',
    example: 'E01 烛龙睁眼',
    acts: [
      { name: '混沌之初', durationRatio: 0.20, tension: 0.1, purpose: 'establish_cosmology', requiredShots: ['创世全景', '混沌气流', '鸿蒙初辟'] },
      { name: '异象初生', durationRatio: 0.20, tension: 0.4, purpose: 'birth_of_beast', requiredShots: ['异兽诞生特写', '天地异变', '灵气汇聚'] },
      { name: '力量觉醒', durationRatio: 0.25, tension: 0.8, purpose: 'power_awakening', requiredShots: ['力量爆发', '天地重构', '异兽全貌'] },
      { name: '天地重构', durationRatio: 0.20, tension: 1.0, purpose: 'world_restructure', requiredShots: ['新秩序建立', '万物生长', '异兽归位'] },
      { name: '余韵传说', durationRatio: 0.15, tension: 0.3, purpose: 'legend_legacy', requiredShots: ['传说余韵', '后世回响', '卷轴闭合'] }
    ],
    emotionalArc: ['敬畏', '惊奇', '震撼', '庄严', '悠远'],
    visualSignature: '高山深谷情绪弧线，张力从0.1爬升至1.0后迅速回落',
    motif: 'time_cycle × guardian_solitude'
  },
  
  encounter_fable: {
    name: '人兽相遇型',
    example: 'E02 九尾的赌局',
    acts: [
      { name: '孩童日常', durationRatio: 0.20, tension: 0.1, purpose: 'human_world', requiredShots: ['孩童跑跳', '活泼探索', '天真烂漫'] },
      { name: '异兽现身', durationRatio: 0.20, tension: 0.5, purpose: 'beast_appears', requiredShots: ['异兽轮廓', '灵气波动', '初见震撼'] },
      { name: '灵动试探', durationRatio: 0.25, tension: 0.7, purpose: 'negotiation', requiredShots: ['孩童蹦跳试探', '好奇追逐', '天真互动'] },
      { name: '真相揭露', durationRatio: 0.20, tension: 0.9, purpose: 'revelation', requiredShots: ['真相瞬间', '情感爆发', '抉择时刻'] },
      { name: '启示余味', durationRatio: 0.15, tension: 0.3, purpose: 'aftermath', requiredShots: ['余韵悠长', '改变发生', '新的日常'] }
    ],
    emotionalArc: ['活泼', '好奇', '紧张', '顿悟', '回味'],
    visualSignature: '从孩童活泼跑跳到异兽幻境的灵动揭示',
    motif: 'beast_encounter × childlike_wonder'
  },
  
  transformation_journey: {
    name: '蜕变成长型',
    example: 'E09 鲲化鹏',
    acts: [
      { name: '困顿之局', durationRatio: 0.20, tension: 0.2, purpose: 'stuck', requiredShots: ['困境展现', '内心挣扎', '局限显现'] },
      { name: '渴望萌芽', durationRatio: 0.20, tension: 0.4, purpose: 'desire', requiredShots: ['渴望闪现', '外界刺激', '内心觉醒'] },
      { name: '艰难蜕变', durationRatio: 0.25, tension: 0.8, purpose: 'transformation', requiredShots: ['蜕变过程', '痛苦挣扎', '形态改变'] },
      { name: '新生翱翔', durationRatio: 0.20, tension: 1.0, purpose: 'breakthrough', requiredShots: ['新生瞬间', '力量释放', '自由飞翔'] },
      { name: '天地辽阔', durationRatio: 0.15, tension: 0.5, purpose: 'expansion', requiredShots: ['新天地', '视野开阔', '未来可期'] }
    ],
    emotionalArc: ['压抑', '渴望', '痛苦', '解放', '自由'],
    visualSignature: '从压抑到爆发的U型情绪弧线',
    motif: 'transformation × growth'
  },
  
  divine_conflict: {
    name: '神权秩序型',
    example: 'E04 光翼游天兽之翼',
    acts: [
      { name: '秩序显现', durationRatio: 0.20, tension: 0.3, purpose: 'order_established', requiredShots: ['天庭秩序', '法则运转', '庄严氛围'] },
      { name: '反叛萌芽', durationRatio: 0.20, tension: 0.5, purpose: 'rebellion', requiredShots: ['不满显现', '暗流涌动', '冲突种子'] },
      { name: '正面对抗', durationRatio: 0.25, tension: 0.9, purpose: 'confrontation', requiredShots: ['激烈战斗', '力量碰撞', '天地变色'] },
      { name: '代价显现', durationRatio: 0.20, tension: 1.0, purpose: 'cost', requiredShots: ['牺牲瞬间', '代价付出', '情感冲击'] },
      { name: '新秩序', durationRatio: 0.15, tension: 0.4, purpose: 'new_order', requiredShots: ['余波平息', '新平衡', '反思沉淀'] }
    ],
    emotionalArc: ['庄严', '紧张', '激烈', '悲壮', '沉思'],
    visualSignature: '阶梯式上升后陡然回落的悲壮弧线',
    motif: 'divine_order × sacrifice'
  },
  
  chorus_harmony: {
    name: '群像共生型',
    example: 'E10 山海一岁',
    acts: [
      { name: '万物苏醒', durationRatio: 0.20, tension: 0.2, purpose: 'awakening', requiredShots: ['春回大地', '万物复苏', '生机盎然'] },
      { name: '各展其能', durationRatio: 0.20, tension: 0.4, purpose: 'showcase', requiredShots: ['异兽登场', '各显神通', '和谐共处'] },
      { name: '危机降临', durationRatio: 0.25, tension: 0.8, purpose: 'crisis', requiredShots: ['危机征兆', '团结应对', '合力抗敌'] },
      { name: '合力渡劫', durationRatio: 0.20, tension: 0.9, purpose: 'unity', requiredShots: ['齐心协力', '牺牲奉献', '最终胜利'] },
      { name: '和谐共生', durationRatio: 0.15, tension: 0.3, purpose: 'harmony', requiredShots: ['劫后重生', '和谐景象', '永续共存'] }
    ],
    emotionalArc: ['生机', '欢乐', '紧张', '感动', '祥和'],
    visualSignature: '多线并进最后汇聚的合唱式弧线',
    motif: 'unity × harmony'
  },
  
  beastmind_v1: {
    name: 'BeastMind通用型',
    example: 'E01 刑天：不灭的战魂',
    acts: [
      { name: '混沌之初', durationRatio: 0.20, tension: 0.1, purpose: 'establish_cosmology', requiredShots: ['创世全景', '混沌气流', '鸿蒙初辟'] },
      { name: '异象初生', durationRatio: 0.20, tension: 0.4, purpose: 'birth_of_beast', requiredShots: ['异兽诞生特写', '天地异变', '灵气汇聚'] },
      { name: '力量觉醒', durationRatio: 0.25, tension: 0.8, purpose: 'power_awakening', requiredShots: ['力量爆发', '天地重构', '异兽全貌'] },
      { name: '天地重构', durationRatio: 0.20, tension: 1.0, purpose: 'world_restructure', requiredShots: ['新秩序建立', '万物生长', '异兽归位'] },
      { name: '余韵传说', durationRatio: 0.15, tension: 0.3, purpose: 'legend_legacy', requiredShots: ['传说余韵', '后世回响', '卷轴闭合'] }
    ],
    emotionalArc: ['敬畏', '惊奇', '震撼', '庄严', '悠远'],
    visualSignature: 'BeastMind引擎通用五幕结构：误解建立→深入展示→裂缝出现→真相翻转→情感余韵',
    motif: 'misunderstanding × revelation × ecological_truth'
  }
};

// ============ 12种志怪情绪-运镜映射 ============
const SHANHAI_EMOTION_CAMERA_MAP = {
  敬畏: { lens: '广角', movement: '急速上升甩镜', angle: '仰拍', lighting: '天光+体积光' },
  神秘: { lens: '长焦', movement: '急速推进跳切', angle: '微俯', lighting: '逆光+雾气' },
  妖异: { lens: '标准', movement: '急速环绕甩镜', angle: '平视略低', lighting: '异色光紫青+轮廓光' },
  威严: { lens: '广角', movement: '急速跟拍跳切', angle: '低角度', lighting: '轮廓光+顶光' },
  幻梦: { lens: '柔焦', movement: '急速漂浮横移', angle: '不稳定', lighting: '柔光+光斑' },
  恐惧: { lens: '广角', movement: '急速后退甩镜', angle: '主观视角', lighting: '硬光+强对比' },
  悲壮: { lens: '长焦', movement: '急速拉远跳切', angle: '远景', lighting: '落日逆光' },
  祥和: { lens: '标准', movement: '急速观察跳切', angle: '鸟瞰', lighting: '柔光散射+暖调' },
  激昂: { lens: '广角', movement: '急速推进甩镜', angle: '低角度', lighting: '强轮廓光' },
  孤独: { lens: '长焦', movement: '急速横移跳切', angle: '远景', lighting: '冷调+暗角' },
  禅意: { lens: '标准', movement: '急速凝视跳切', angle: '微俯', lighting: '天光漫射' },
  悠远: { lens: '长焦', movement: '急速上升甩镜', angle: '俯瞰', lighting: '柔光+远山雾' },
  活泼: { lens: '广角', movement: '急速跟随跳切', angle: '平视', lighting: '自然光+跳切' },
  好奇: { lens: '标准', movement: '急速跟拍跳切', angle: '平视略俯', lighting: '自然光+侧光' },
  温暖: { lens: '标准', movement: '急速固定跳切', angle: '微俯', lighting: '暖色调+柔光' },
  心碎: { lens: '长焦', movement: '急速拉远甩镜', angle: '特写', lighting: '冷调+暗角' },
  成长: { lens: '广角', movement: '急速上升甩镜', angle: '低角度', lighting: '逆光+暖调' }
};

// ============ 【故事内核融入】四季结构 ============
const SEASON_STRUCTURE = {
  season1: {
    name: '灵生季',
    nameEn: 'Awakening',
    episodes: 10,
    coreQuestion: '这个世界是什么？',
    growthStage: '8-9岁',
    emotionalTone: '好奇、恐惧、温暖',
    narrativeFunction: '引入世界：展示规则，建立关系，制造悬念',
    mainRegion: '青丘之泽',
    keyEvents: ['烛龙睁眼', '遇见烛龙', '命名之力觉醒', '建立庇护所', '遇见白泽']
  },
  season2: {
    name: '灵盛季',
    nameEn: 'Abundance',
    episodes: 18,
    coreQuestion: '这个世界为什么是这样？',
    growthStage: '9-10岁',
    emotionalTone: '兴奋、困惑、震撼',
    narrativeFunction: '深化世界：引入哲学，揭示过去，升级冲突',
    mainRegion: '昆仑山脉+冰原禁区+弱水之滨',
    keyEvents: ['遍历山海', '白泽的教导', '遇见鲲鹏', '发现天道轮回线索']
  },
  season3: {
    name: '灵收季',
    nameEn: 'Understanding',
    episodes: 18,
    coreQuestion: '我为什么会在这里？',
    growthStage: '10-11岁',
    emotionalTone: '哀伤、顿悟、使命感',
    narrativeFunction: '打碎与重建：失去与获得，让小G真正成为"记录者"',
    mainRegion: '昆仑神域+海外经',
    keyEvents: ['烛龙牺牲', '归墟深渊真相', '太素之问', '决定写《山海经：异兽志》']
  },
  season4: {
    name: '灵藏季',
    nameEn: 'Legacy',
    episodes: 18,
    coreQuestion: '我该怎么办？',
    growthStage: '11-12岁+',
    emotionalTone: '平静、力量、温暖',
    narrativeFunction: '完成与开放：写出《山海经：异兽志》，给出答案但保留神秘',
    mainRegion: '大荒经+海内经',
    keyEvents: ['面对烛龙', '穿越归墟深渊', '完成《山海经：异兽志》', '汤谷日出']
  }
};

// ============ 【故事内核融入】18个情节点序列 ============
const EPISODE_BEAT_POINTS = [
  // === 第一幕：发现世界（S1E1-S1E10 + S2E1-S2E8） ===
  { episode: 'S1E1', title: '归元', coreEvent: '小G从废墟中醒来，世界已改变', keyBeasts: ['烛龙（幼体）', '灌灌'], emotionArc: ['恐惧', '安全'], narrativeEngine: '我在哪里？', infoRelease: '洪荒初辟、新世界基本形态' },
  { episode: 'S1E2', title: '有兽焉', coreEvent: '系统记录异兽，学命名之力', keyBeasts: ['灌灌', '旋龟（远景）'], emotionArc: ['好奇', '成就感'], narrativeEngine: '这些东西是什么？', infoRelease: '低级异兽生态、命名之力' },
  { episode: 'S1E3', title: '南山之南', coreEvent: '遇九尾狐长老，学灵气语言', keyBeasts: ['九尾狐长老', '九尾狐族群'], emotionArc: ['渴望', '温暖'], narrativeEngine: '它们在说什么？', infoRelease: '灵气系统、九尾狐社会' },
  { episode: 'S1E4', title: '火', coreEvent: '生火取暖，建立群体连接', keyBeasts: ['旋龟（正式登场）', '低级异兽群'], emotionArc: ['孤独', '群体温暖'], narrativeEngine: '火是什么？', infoRelease: '火的神话地位、旋龟功能' },
  { episode: 'S1E5', title: '母与子', coreEvent: '目睹异兽母子离别，收养小角', keyBeasts: ['异兽母子', '小角', '掠食者'], emotionArc: ['温柔', '心碎'], narrativeEngine: '为什么要死？', infoRelease: '自然法则残酷性' },
  { episode: 'S1E6', title: '洪水', coreEvent: '灵生季洪水，帮助异兽迁徙', keyBeasts: ['旋龟', '迁徙群体'], emotionArc: ['紧张', '成就感'], narrativeEngine: '洪水来了怎么办？', infoRelease: '季节系统、旋龟功能' },
  { episode: 'S1E7', title: '蝴蝶', coreEvent: '发现上古书籍，遇蝴蝶灵兽', keyBeasts: ['蝴蝶灵兽', '烛龙'], emotionArc: ['惊喜', '领悟'], narrativeEngine: '这本书是什么？', infoRelease: '上古秘辛价值' },
  { episode: 'S1E8', title: '白泽', coreEvent: '遇白泽，得知"记录者"概念', keyBeasts: ['白泽', '烛龙'], emotionArc: ['困惑', '使命感'], narrativeEngine: '我是谁？', infoRelease: '记录者概念、世界观升级' },
  { episode: 'S1E9', title: '冬日之炉', coreEvent: '建立庇护所，开始系统记录', keyBeasts: ['烛龙', '小角', '旋龟'], emotionArc: ['充实', '成长'], narrativeEngine: '我要记下什么？', infoRelease: '记录系统化' },
  { episode: 'S1E10', title: '山海经：异兽志', coreEvent: '离开青丘之泽，向更大世界出发', keyBeasts: ['烛龙', '旋龟', '九尾狐长老'], emotionArc: ['伤感', '希望'], narrativeEngine: '我要去哪？', infoRelease: '更大世界存在' },
  // === 第二幕：理解世界（S2E9-S2E18） ===
  { episode: 'S2E1', title: '旋转之地', coreEvent: '旋龟背纹地图揭示，了解世界结构', keyBeasts: ['旋龟'], emotionArc: ['好奇', '向往'], narrativeEngine: '世界有多大？', infoRelease: '世界地理结构、天道轮回线索' },
  { episode: 'S2E2', title: '有翼之虎', coreEvent: '首次遭遇高级异兽猬毛凶兽', keyBeasts: ['猬毛凶兽'], emotionArc: ['恐惧', '敬畏'], narrativeEngine: '暴力是什么？', infoRelease: '高级异兽规则意识、暴力即秩序' },
  { episode: 'S2E3', title: '旧日之灵', coreEvent: '废墟中发现上古物品，记忆风暴', keyBeasts: ['白泽'], emotionArc: ['悲伤', '接受'], narrativeEngine: '他们都去哪了？', infoRelease: '洪荒初辟确认、白泽轮回哲学' },
  { episode: 'S2E4', title: '光余草', coreEvent: '发现发光草，揭示科技神话融合', keyBeasts: ['光余草'], emotionArc: ['兴奋', '领悟'], narrativeEngine: '科技去哪了？', infoRelease: '灵气=科技能量、新旧共生' },
  { episode: 'S2E5', title: '九尾之誓', coreEvent: '帮助九尾狐度过危机，获"公民身份"', keyBeasts: ['九尾狐', '九尾狐长老'], emotionArc: ['成就感', '归属感'], narrativeEngine: '我属于这里吗？', infoRelease: '异兽生态系统、小G独特价值' },
  { episode: 'S2E6', title: '归墟深渊之口', coreEvent: '到达世界边缘归墟深渊，时间折叠真相', keyBeasts: ['白泽'], emotionArc: ['眩晕', '希望'], narrativeEngine: '世界有边界吗？', infoRelease: '时间循环部分揭示、使命概念' },
  { episode: 'S2E7', title: '太素之问', coreEvent: '哲学对话，直面"记忆即存在"', keyBeasts: ['白泽'], emotionArc: ['深沉', '坚定'], narrativeEngine: '我为什么要写？', infoRelease: '记忆即存在终极表达' },
  // === 第三幕：成为传说（S3E1-S3E18 + S4E1-S4E10） ===
  { episode: 'S3E1', title: '蛊雕之怒', coreEvent: '蛊雕袭击，烛龙重伤', keyBeasts: ['蛊雕群', '烛龙', '小角'], emotionArc: ['恐惧', '绝望', '理解'], narrativeEngine: '我什么都做不了吗？', infoRelease: '灵气过载危险、理解而非对抗' },
  { episode: 'S3E2', title: '冬日之炉', coreEvent: '灾难后重建，决定系统记录', keyBeasts: ['旋龟', '烛龙', '白泽'], emotionArc: ['平静', '使命'], narrativeEngine: '我还能做什么？', infoRelease: '记录者传承、写作对抗遗忘' }
];

// ============ 【故事内核融入】8个标志性场景 ============
const EIGHT_ICONIC_SCENES = [
  {
    id: 'scene_1',
    name: '归元之眼',
    episode: 'S1E1',
    emotion: '压倒性的震撼与恐惧',
    visual: '从男孩眼睛特写开始→两个时间碰撞（2147城市+上古森林）→摩天大楼钢筋缠绕发光藤蔓→LED碎片漂浮如鳞片→异兽在翻倒出租车旁饮水',
    colorScheme: '冷色调(蓝灰白)与暖色调(金绿赤)强烈对比',
    soundDesign: '极低环境音→"时间撕裂"的低频共鸣',
    narrativeFunction: '30秒内建立世界观核心设定',
    symbolism: '两个时代的融合——这不是普通的末日'
  },
  {
    id: 'scene_2',
    name: '无面之暖',
    episode: 'S1E1',
    emotion: '恐惧消融于温柔',
    visual: '低级异兽逼到山洞角落→烛龙缓缓出现（黄囊状、赤金色、无面）→用身体挡住低级异兽→包裹男孩→男孩手贴表面感受低频振动',
    colorScheme: '从冷暗到暖光的渐变',
    soundDesign: '紧张低音→温暖的低频振动（烛龙"歌声"）',
    narrativeFunction: '建立烛龙"无条件庇护者"角色、异兽非敌人',
    symbolism: '无面=无条件的爱——不看、不听、不说，只感受'
  },
  {
    id: 'scene_3',
    name: '篝火议会',
    episode: 'S1E4',
    emotion: '群体温暖与孤独的对照',
    visual: '夜晚篝火→低级异兽围坐（非攻击，取暖）→男孩给每只取名→每次命名异兽回应',
    colorScheme: '暖色调为主——橙色火光、金色灵气、深蓝夜空',
    soundDesign: '篝火噼啪声+异兽轻柔呼吸+远处夜行动物叫声',
    narrativeFunction: '展示"命名之力"、建立男孩与异兽群体关系',
    symbolism: '篝火=人类最古老的技术，重新成为连接的桥梁'
  },
  {
    id: 'scene_4',
    name: '鱼鹿之舞',
    episode: 'S1E2',
    emotion: '从恐惧到理解的关键转折',
    visual: '溪边异兽（鹿身鱼尾）→男孩躲在树后→小声说"鱼鹿"→异兽停下脚步→对视→歪头→从此建立羁绊',
    colorScheme: '清晨光线、溪水蓝、森林绿、异兽金光泽',
    soundDesign: '溪水流淌+鸟鸣+"鱼鹿"清晰回响',
    narrativeFunction: '展示"命名即理解"主题',
    symbolism: '命名=人类最古老的权力，也是最早的创作'
  },
  {
    id: 'scene_5',
    name: '钢铁摇篮',
    episode: 'S1E1-S1E2',
    emotion: '悲伤中的温暖',
    visual: '半塌百货商场→婴儿用品区→完好摇篮→男孩坐下轻轻推动→摇篮"吱吱"响→烛龙陪伴→男孩蜷缩入睡',
    colorScheme: '柔和粉色与灰暗废墟对比',
    soundDesign: '摇篮"吱吱"声+呼吸声+远处异兽低鸣',
    narrativeFunction: '后启示录主题展开——上古记忆是温柔的',
    symbolism: '摇篮=生命的脆弱与延续——即使末日，温柔仍在'
  },
  {
    id: 'scene_6',
    name: '破碎照片',
    episode: 'S1E7/S2E2',
    emotion: '极致的悲伤——失去一切的实感',
    visual: '废墟办公室→家庭合影→男孩认出幼儿园→抱着照片坐地哭泣→烛龙包裹→"我不记得他们的名字了"',
    colorScheme: '褪色暖色调——照片黄色、废墟灰色、眼泪透明',
    soundDesign: '压抑哭声→幼儿园回忆闪回（孩子笑闹声）',
    narrativeFunction: '上古记忆个人化——末日不是概念，是具体失去',
    symbolism: '照片=记忆载体。照片模糊=记忆消逝。烛龙=新记忆载体'
  },
  {
    id: 'scene_7',
    name: '旋龟之渡',
    episode: 'S1E6',
    emotion: '冒险的兴奋与伙伴的信任',
    visual: '洪水后水域→旋龟浮现（背纹发光=地图）→男孩爬上背→水中穿行→穿过购物中心（水下珊瑚礁）→地铁站（鱼群通道）→桥梁（瀑布）',
    colorScheme: '水蓝渐变（浅蓝到深蓝）、废墟灰、背纹金色',
    soundDesign: '水流声+低频振动+水下"静谧"',
    narrativeFunction: '展示山海世界"水生态"、旋龟功能、废墟与自然共生',
    symbolism: '旋龟的背=移动地图——承载穿越未知，象征方向与引导'
  },
  {
    id: 'scene_8',
    name: '浮空晶簇山脉之写',
    episode: 'S4E10',
    emotion: '极致的平静与bittersweet满足',
    visual: '浮空晶簇山脉顶→少年小G→巨大兽皮写满文字→最后一块炭笔→写完最后一笔→日出来临→文字发光→异兽注视→"完成了"',
    colorScheme: '日出金红色、兽皮白、文字黑与金色光芒',
    soundDesign: '极度安静→烛龙"歌声"→其他异兽加入→自然交响乐',
    narrativeFunction: '叙事闭环——从第一集"醒来"到最后一集"完成"',
    symbolism: '书写=对抗遗忘的终极方式。《山海经：异兽志》=男孩留给世界的情书'
  }
];

// ============ 【故事内核融入】小G成长阶段与集数对应 ============
const XG_GROWTH_STAGES = [
  { stage: 1, name: '恐惧的幸存者', episodes: 'S1E1-S1E3', age: '8岁', mindset: '我要活下去', writing: '涂鸦——宣泄恐惧' },
  { stage: 2, name: '好奇的探索者', episodes: 'S1E4-S1E8', age: '8-9岁', mindset: '这是什么世界？', writing: '图画——记录好奇' },
  { stage: 3, name: '孤独的求问者', episodes: 'S1E9-S2E3', age: '9-10岁', mindset: '我为什么会在这里？', writing: '文字开始——提问' },
  { stage: 4, name: '信任的建造者', episodes: 'S2E4-S2E8', age: '9-10岁', mindset: '我有了朋友', writing: '系统记录——建立秩序' },
  { stage: 5, name: '失去的痛苦者', episodes: 'S3E1-S3E5', age: '10-11岁', mindset: '我失去了一切', writing: '写作暂停——悲痛' },
  { stage: 6, name: '理解的承受者', episodes: 'S3E6-S3E10', age: '10-11岁', mindset: '失去是成长的一部分', writing: '重新开始——带着痛苦' },
  { stage: 7, name: '使命的承担者', episodes: 'S3E11-S4E5', age: '11-12岁', mindset: '我必须记录这一切', writing: '使命驱动——书写成为责任' },
  { stage: 8, name: '传承的完成者', episodes: 'S4E6-S4E10', age: '11-12岁+', mindset: '我是桥梁', writing: '完成——从记录者到被记录者' }
];

// ============ Anthology系列一致性管理器 ============
class AnthologyConsistencyManager {
  constructor() {
    this.seriesDNA = {
      unifiedElements: {
        colorPalette: ['玄黑', '赤红', '金色', '玉白', '苍青'],
        titleCardStyle: '篆体+金石纹理+墨汁扩散入场',
        transitionStyle: '墨汁扩散过渡',
        endCreditStyle: '卷轴展开+印章落下',
        logoAnimation: '远古发光祭器纹饰浮现+金光流转'
      },
      perEpisodeVariable: {
        dominantHue: ['赤红', '玄黑', '金色', '玉白', '苍青', '翠绿', '湛蓝', '橙红', '紫青', '赭石'],
        lightingMood: ['庄严', '神秘', '温暖', '冷峻', '梦幻'],
        beastSignature: null // 每集由主角异兽定义
      }
    };
    
    this.episodes = [];
  }
  
  /**
   * 注册新剧集
   */
  registerEpisode(episodeData) {
    const episode = {
      id: episodeData.id,
      beastId: episodeData.beastId,
      template: episodeData.template,
      dominantHue: this.seriesDNA.perEpisodeVariable.dominantHue[episodeData.id % 10],
      lightingMood: episodeData.lightingMood || '庄严',
      unifiedElements: this.seriesDNA.unifiedElements,
      timestamp: Date.now()
    };
    
    this.episodes.push(episode);
    return episode;
  }
  
  /**
   * 获取系列统一视觉基因
   */
  getUnifiedElements() {
    return this.seriesDNA.unifiedElements;
  }
  
  /**
   * 获取片头序列定义
   */
  getOpeningSequence() {
    return {
      duration: 15,
      frames: [
        { time: 0, description: '墨汁滴落纯黑背景' },
        { time: 3, description: '"山海经：异兽志"篆字扩散成型' },
        { time: 6, description: '晶齿萌兽纹与云雷纹浮现' },
        { time: 9, description: '暗金光芒中异兽剪影闪现' },
        { time: 12, description: '汇聚为"山海经：异兽志：异兽志"Logo' },
        { time: 14, description: '朱红印章盖落' }
      ],
      audio: '古琴+洪荒韵律+电子低音融合'
    };
  }
  
  /**
   * 获取片尾序列定义
   */
  getEndingSequence() {
    return {
      duration: 20,
      frames: [
        { time: 0, description: '水墨化隐' },
        { time: 5, description: '下集预告轮廓' },
        { time: 10, description: '卷轴展开' },
        { time: 18, description: '最终篆字水印' }
      ]
    };
  }
  
  /**
   * 跨集一致性校验
   */
  validateCrossEpisodeConsistency() {
    const hues = new Set(this.episodes.map(e => e.dominantHue));
    const avgPeakTension = this.episodes.reduce((sum, e) => {
      const template = SHANHAI_EPISODE_TEMPLATES[e.template];
      const peak = Math.max(...template.acts.map(a => a.tension));
      return sum + peak;
    }, 0) / this.episodes.length;
    
    const warnings = [];
    
    if (hues.size / this.episodes.length < 0.7) {
      warnings.push('主色重复率过高，建议增加色彩多样性');
    }
    
    if (avgPeakTension > 0.85) {
      warnings.push('全季平均峰值张力过高，建议增加舒缓集数');
    }
    
    return {
      valid: warnings.length === 0,
      warnings,
      hueDiversity: hues.size / this.episodes.length,
      avgPeakTension
    };
  }
}

// ============ 导演系统核心类 ============
class ShanhaiDirector {
  constructor() {
    this.bestiary = new Bestiary();
    this.soulForge = new SoulForge();
    this.consistencyManager = new AnthologyConsistencyManager();
  }
  
  /**
   * 生成单集导演方案
   */
  generateEpisodePlan(episodeData) {
    const { id, title, beastId, template, duration = 720 } = episodeData;
    
    // 获取异兽档案（防御性：找不到时使用默认未知异兽）
    let beast = this.bestiary.getBeast(beastId);
    if (!beast) {
      console.warn(`  ⚠️ 未找到异兽档案: ${beastId}，使用默认未知异兽`);
      beast = {
        name: beastId,
        category: 'unknown',
        soulThreeLayers: {
          instinct: { coreDrive: '未知本能', behavioralPatterns: [], emotionalExpressions: {} },
          humanity: { woundPatterns: [], evolutionArc: '', relationships: {} },
          spirituality: { tao: '未知之道', wuwei: '顺应自然', cosmicRole: '未知存在' }
        },
        personality: { dialogueStyle: '' }
      };
    }
    
    let soul;
    try {
      soul = this.soulForge.forgeSoul(beastId);
    } catch (e) {
      console.warn(`  ⚠️ 灵魂铸造失败: ${e.message}，使用默认灵魂档案`);
      soul = {
        coreDrive: '未知本能',
        keyWound: '',
        coreNeed: '',
        coreLie: '',
        evolutionArc: '',
        tao: '未知之道',
        wuwei: '顺应自然',
        cosmicRole: '未知存在',
        emotionalExpressions: {},
        dialogueStyle: ''
      };
    }
    
    // 获取模板（未知模板时回退到origin_myth）
    let templateData = SHANHAI_EPISODE_TEMPLATES[template];
    if (!templateData) {
      console.warn(`  ⚠️ [ShanhaiDirector] 未知模板: ${template}，回退到 origin_myth`);
      templateData = SHANHAI_EPISODE_TEMPLATES['origin_myth'];
    }
    
    // 注册到一致性管理器
    this.consistencyManager.registerEpisode({ id, beastId, template });
    
    // 生成五幕结构
    const acts = templateData.acts.map((act, index) => {
      const actDuration = Math.floor(duration * act.durationRatio);
      const emotion = templateData.emotionalArc[index];
      const camera = SHANHAI_EMOTION_CAMERA_MAP[emotion];
      
      return {
        actNumber: index + 1,
        name: act.name,
        duration: actDuration,
        tension: act.tension,
        purpose: act.purpose,
        requiredShots: act.requiredShots,
        emotion,
        camera,
        startTime: Math.floor(duration * templateData.acts.slice(0, index).reduce((sum, a) => sum + a.durationRatio, 0)),
        endTime: Math.floor(duration * templateData.acts.slice(0, index + 1).reduce((sum, a) => sum + a.durationRatio, 0))
      };
    });
    
    return {
      id,
      title,
      beastId,
      beastName: beast.name,
      template,
      templateName: templateData.name,
      totalDuration: duration,
      acts,
      emotionalArc: templateData.emotionalArc,
      visualSignature: templateData.visualSignature,
      motif: templateData.motif,
      soulProfile: this.soulForge.exportDirectorsProfile(soul),
      seriesConsistency: this.consistencyManager.getUnifiedElements()
    };
  }
  
  /**
   * 生成整季方案
   */
  generateSeasonPlan(episodesData) {
    const plans = episodesData.map(ep => this.generateEpisodePlan(ep));
    const consistency = this.consistencyManager.validateCrossEpisodeConsistency();
    
    return {
      episodes: plans,
      consistency,
      unifiedElements: this.consistencyManager.getUnifiedElements()
    };
  }
  
  /**
   * 根据情绪获取运镜参数
   */
  getCameraByEmotion(emotion) {
    return SHANHAI_EMOTION_CAMERA_MAP[emotion] || SHANHAI_EMOTION_CAMERA_MAP['神秘'];
  }
  
  /**
   * 获取四季结构
   */
  getSeasonStructure(seasonId) {
    return SEASON_STRUCTURE[seasonId] || null;
  }
  
  /**
   * 获取所有四季结构
   */
  getAllSeasons() {
    return SEASON_STRUCTURE;
  }
  
  /**
   * 获取情节点
   */
  getEpisodeBeat(episodeCode) {
    return EPISODE_BEAT_POINTS.find(ep => ep.episode === episodeCode) || null;
  }
  
  /**
   * 获取所有情节点
   */
  getAllEpisodeBeats() {
    return EPISODE_BEAT_POINTS;
  }
  
  /**
   * 获取指定季的所有情节点
   */
  getSeasonEpisodeBeats(seasonPrefix) {
    return EPISODE_BEAT_POINTS.filter(ep => ep.episode.startsWith(seasonPrefix));
  }
  
  /**
   * 获取标志性场景
   */
  getIconicScene(sceneId) {
    return EIGHT_ICONIC_SCENES.find(s => s.id === sceneId) || null;
  }
  
  /**
   * 获取所有标志性场景
   */
  getAllIconicScenes() {
    return EIGHT_ICONIC_SCENES;
  }
  
  /**
   * 获取指定集的标志性场景
   */
  getIconicScenesByEpisode(episodeCode) {
    return EIGHT_ICONIC_SCENES.filter(s => s.episode.includes(episodeCode));
  }
  
  /**
   * 获取小G成长阶段
   */
  getXGGrowthStage(stageNumber) {
    return XG_GROWTH_STAGES.find(s => s.stage === stageNumber) || null;
  }
  
  /**
   * 获取小G当前成长阶段（根据集数）
   */
  getXGGrowthStageByEpisode(episodeCode) {
    const stage = XG_GROWTH_STAGES.find(s => {
      const episodes = s.episodes.split('-');
      if (episodes.length === 1) {
        return s.episodes.includes(episodeCode);
      }
      const start = episodes[0];
      const end = episodes[1];
      return episodeCode >= start && episodeCode <= end;
    });
    return stage || XG_GROWTH_STAGES[0];
  }
  
  /**
   * 获取所有小G成长阶段
   */
  getAllXGGrowthStages() {
    return XG_GROWTH_STAGES;
  }
}

// ============ 导出 ============
module.exports = {
  ShanhaiDirector,
  AnthologyConsistencyManager,
  SHANHAI_EPISODE_TEMPLATES,
  SHANHAI_EMOTION_CAMERA_MAP,
  SEASON_STRUCTURE,
  EPISODE_BEAT_POINTS,
  EIGHT_ICONIC_SCENES,
  XG_GROWTH_STAGES,
  GLOBAL_PACING_MODE,
  SHOT_DURATION_BASE,
  TRANSITION_STYLE,
  INFO_DENSITY_MULTIPLIER,
  FAST_PACING_KEYWORDS
};

// CLI 测试入口
if (require.main === module) {
  const director = new ShanhaiDirector();
  
  console.log('\n🎬 山海经：异兽志志怪Anthology导演系统测试\n');
  
  const plan = director.generateEpisodePlan({
    id: 1,
    title: '烛龙睁眼',
    beastId: 'zhulong',
    template: 'origin_myth',
    duration: 720
  });
  
  console.log(`剧集：${plan.title}`);
  console.log(`模板：${plan.templateName}`);
  console.log(`五幕结构：`);
  plan.acts.forEach(act => {
    console.log(`  ${act.actNumber}. ${act.name} (${act.duration}s, 张力${act.tension}) — ${act.emotion}`);
    console.log(`     运镜：${act.camera.lens} + ${act.camera.movement} + ${act.camera.angle}`);
  });
}