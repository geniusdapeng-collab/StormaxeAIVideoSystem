/**
 * 🐉 神兽震撼出场设计师 - Beast Entrance Designer v1.0-Peng
 * 
 * 负责设计神兽的"震撼出场方式"——不是简单出现，而是结合神兽特点的
 * 创意出场动效，铺满全屏，震撼视听。
 * 
 * 核心原则：
 * 1. 出场必须震撼——不是fade in，而是有力量感的出场
 * 2. 必须铺满全屏——神兽占据画面50%以上
 * 3. 必须有重磅音效——sub-bass earth rumble、战斧破空、盾牌撞击等
 * 4. 出场方式必须与神兽特点呼应——刑天的无头+战斧、烛龙的双眼+火焰
 * 5. 8秒内完成出场，精确到0.5秒
 * 
 * 输出结构：
 * {
 *   entranceConcept: string,
 *   phases: [{ time, name, description, visual, sound, camera }],
 *   promptEnhancement: string,
 *   soundEffects: [{ type, frequency, duration, description }],
 *   fullScreenStrategy: string
 * }
 */

const fs = require('fs');
const path = require('path');

/**
 * 神兽出场设计器
 * @param {string} beastId - 神兽ID
 * @param {Object} beastInfo - 神兽信息
 * @param {string} templateId - 片头模板ID
 * @returns {Object} 出场设计方案
 */
function designBeastEntrance(beastId, beastInfo, templateId) {
  console.log(`\n🐉 [BeastEntranceDesigner] 设计神兽出场: ${beastId}`);
  
  const entranceStart = 0.5; // 神兽在第0.5秒开始登场（声音先出0.5秒）
  const entranceEnd = 3.0;   // 神兽在第3秒完成登场
  
  // 🆕 v4.0-Peng-fix: 中文名称到拼音的映射
  const nameToPinyinMap = {
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
    '玄武': 'xuanwu',
    '蛊雕': 'gudiao',
    '天狗': 'tiangou',
    '狰': 'zheng',
    '蠃鱼': 'leiyu',
    '旋龟': 'xuangui',
    '化蛇': 'huashe',
    '陆吾': 'luwu',
    '英招': 'yingzhao',
    '诸犍': 'zhujian',
    '肥遗': 'feiyi',
    '狻猊': 'suanni',
    '獬豸': 'xiezhi',
    '重明鸟': 'chongming',
    '鲲鹏': 'kunpeng',
    '巴蛇': 'bashe',
    '鹿蜀': 'lushu',
    '文鳐鱼': 'wenyaoyu',
    '朱厌': 'zhuyan',
    '夫诸': 'fuzhu',
    '祸斗': 'huodou',
    '蜚': 'fei',
    '酸与': 'suanyu',
    '孟槐': 'menghuai',
    '麒麟': 'qilin'
  };
  
  // 尝试使用原始ID或映射后的拼音
  const pinyinId = nameToPinyinMap[beastId] || beastId;
  
  // 根据神兽ID选择出场策略
  const entranceStrategies = {
    xingtian: _designXingtianEntrance,
    zhulong: _designZhulongEntrance,
    jiuweihu: _designJiuweihuEntrance,
    dijiang: _designDijiangEntrance,
    baize: _designBaizeEntrance,
    qilin: _designQilinEntrance,
    taotie: _designTaotieEntrance
  };
  
  const strategy = entranceStrategies[pinyinId] || _designGenericEntrance;
  
  return strategy(beastId, beastInfo, templateId, entranceStart, entranceEnd);
}

// ==================== 刑天出场：战斧劈天 ====================
function _designXingtianEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '刑天',
    entranceConcept: '地面震动→裂缝蔓延→战斧劈开岩壁→无头巨躯从裂缝升起→盾牌撞击形成冲击波。整个过程充满力量感和远古战意，让观众感受到"不可阻挡的战神归来"',
    fullScreenStrategy: '低角度仰拍，镜头从地面裂缝开始，随着刑天升起而缓缓上摇，最终定格在刑天占据画面70%的构图——观众必须抬头才能看全',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '地底震动',
        description: '地面开始微微震动，细小碎石跳起，远处岩壁出现裂缝——不是地震，而是某种巨大的东西正在从地下升起的前兆',
        visual: '地面震动幅度约2-3cm，碎石跳起10-20cm，岩壁裂缝约1-2cm宽，有紫金色光脉从裂缝渗出',
        camera: '固定低角度镜头，从地面裂缝平视',
        sound: {
          type: 'sub-bass earth rumble',
          frequency: '20-60Hz',
          intensity: '从30%渐增至60%',
          description: '地底传来的低频震动，如远古战鼓在地下敲响'
        }
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.0).toFixed(1)}s`,
        name: '战斧劈岩',
        description: '一只巨大的青铜战斧从岩壁裂缝中劈出，斧刃切割岩石的声音震耳欲聋，碎石飞溅，岩壁被劈开一道巨大的缺口',
        visual: '战斧刃宽约3米，青铜质感，表面有古老铭文和氧化痕迹，劈开岩壁时产生大量碎石和烟尘',
        camera: '镜头跟随战斧劈出的轨迹快速移动，产生强烈运动感',
        sound: {
          type: 'axe swoosh + rock shattering',
          frequency: '低频斧刃破空(80-200Hz) + 高频碎石飞溅(2-5kHz)',
          intensity: '峰值80%',
          description: '战斧劈开空气的呼啸声 + 岩石碎裂的爆裂声'
        }
      },
      {
        time: `${(start + 1.0).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '巨躯升起',
        description: '无头巨躯从岩壁裂缝中缓缓升起——没有头颅，但双乳如目（发出紫金色光芒），肚脐如口（呼吸时开合），干戚（盾+斧）在手中握持。巨躯每升高一米，地面震动就增强一分',
        visual: '刑天身高约30米，躯干肌肉线条如岩石般坚硬，皮肤呈青铜色，双乳位置有两团紫金色光芒（如眼睛），肚脐位置有呼吸开合的裂缝（如嘴巴），干戚在手中',
        camera: '镜头从地面缓缓上摇，随着刑天升起而上升，产生强烈的尺度对比——观众从平视到必须仰视',
        sound: {
          type: 'massive body rising + armor creaking',
          frequency: '低频身体移动(30-80Hz) + 中频盔甲摩擦(200-500Hz)',
          intensity: '从50%渐增至80%',
          description: '巨躯移动的低频震动 + 古老盔甲的金属摩擦声'
        }
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${(start + 2.5).toFixed(1)}s`,
        name: '盾牌撞击',
        description: '刑天举起盾牌猛击地面，产生一圈冲击波——冲击波呈紫金色环形扩散，所过之处地面龟裂，碎石被震飞',
        visual: '冲击波环形扩散，半径约50米，波前有明显的空气扭曲，地面被震出放射状裂缝',
        camera: '镜头在冲击波前方，被气浪冲击产生轻微晃动',
        sound: {
          type: 'shield impact + shockwave',
          frequency: '超低频冲击(10-30Hz) + 低频冲击波(50-100Hz)',
          intensity: '峰值100%',
          description: '盾牌撞击地面的超低频冲击 + 冲击波扩散的轰鸣'
        }
      },
      {
        time: `${(start + 2.5).toFixed(1)}-${end.toFixed(1)}s`,
        name: '战魂屹立',
        description: '刑天完全升起，屹立在岩壁前——无头巨躯占据画面70%，干戚在手，双乳光芒如眼睛般扫视前方，肚脐呼吸开合。整个场景充满不可侵犯的威严',
        visual: '刑天占据画面70%，背景是Nirath断裂山脉，双日暮光从身后照射，形成逆光剪影效果，双乳紫金色光芒成为画面视觉焦点',
        camera: '镜头停止上摇，稳定在低角度仰拍位置，刑天成为画面绝对主体',
        sound: {
          type: 'ambient presence + breathing resonance',
          frequency: '持续低频环境音(20-40Hz) + 呼吸共鸣(40-80Hz)',
          intensity: '稳定在60%',
          description: '刑天存在的环境底噪 + 无头躯体的呼吸共鸣声'
        }
      }
    ],
    soundEffects: [
      { type: 'sub-bass earth rumble', frequency: '20-60Hz', duration: '0-3s', description: '地底传来的低频震动，贯穿整个出场过程' },
      { type: 'axe swoosh', frequency: '80-200Hz', duration: '0.5-1.0s', description: '战斧劈开空气的呼啸声' },
      { type: 'rock shattering', frequency: '2-5kHz', duration: '0.5-1.2s', description: '岩石碎裂的爆裂声' },
      { type: 'shield impact', frequency: '10-30Hz', duration: '2.0-2.5s', description: '盾牌撞击地面的超低频冲击' },
      { type: 'shockwave expansion', frequency: '50-100Hz', duration: '2.0-3.0s', description: '冲击波扩散的轰鸣' },
      { type: 'armor creaking', frequency: '200-500Hz', duration: '1.0-3.0s', description: '古老盔甲的金属摩擦声' },
      { type: 'breathing resonance', frequency: '40-80Hz', duration: '2.5-8.0s', description: '无头躯体的呼吸共鸣声' }
    ],
    promptEnhancement: `神兽刑天的出场必须是震撼的力量展示——不是fade in，而是地底震动→战斧劈岩→巨躯升起→盾牌撞击→战魂屹立。整个过程充满远古战意和不可阻挡的力量感。刑天必须占据画面70%以上，低角度仰拍让观众必须仰视。音效包括sub-bass earth rumble 20-60Hz、战斧破空80-200Hz、岩石碎裂2-5kHz、盾牌撞击10-30Hz、冲击波扩散50-100Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.0s': '地面震动，战斧劈岩',
      '1.0-2.0s': '巨躯升起',
      '2.0-2.5s': '盾牌撞击，冲击波',
      '2.5-3.0s': '战魂屹立，画面定格',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 烛龙出场：双眼睁眼 ====================
function _designZhulongEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '烛龙',
    entranceConcept: '黑暗中双眼缓缓睁开→目光如光柱划破夜空→龙身从光柱中蜿蜒而出→火焰从龙鳞缝隙喷涌。整个过程充满神性和不可直视的威严',
    fullScreenStrategy: '双眼特写占据画面60%，然后镜头急速后拉reveal整条龙身盘踞山脉——尺度从微观到宏观的震撼跳跃',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '黑暗中的双眼',
        description: '纯黑画面中，两团赤金色光芒缓缓亮起——那是烛龙的双眼，如同两颗恒星在黑暗中苏醒。光芒从微弱到强烈，照亮周围空气',
        visual: '双眼直径约5米，赤金色光芒，瞳孔呈竖直裂缝状，周围空气因高温而扭曲',
        camera: '固定特写镜头，双眼占据画面60%',
        sound: {
          type: 'eyes igniting + atmospheric heating',
          frequency: '低频能量积聚(30-60Hz) + 高频空气电离(1-3kHz)',
          intensity: '从20%渐增至70%',
          description: '双眼点燃的低频能量声 + 空气被高温电离的噼啪声'
        }
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '目光划破夜空',
        description: '烛龙双眼完全睁开，两道赤金色光柱从瞳孔射出，划破夜空——光柱所过之处云层被蒸发，山脉被照亮，整个Nirath世界从黑暗中被唤醒',
        visual: '光柱直径约10米，长度延伸至地平线，光柱内部有等离子体流动，边缘有彩虹色散',
        camera: '镜头跟随光柱移动，从双眼特写急速拉远至全景',
        sound: {
          type: 'light beam slicing + atmospheric ionization',
          frequency: '超低频光柱(20-40Hz) + 高频电离(2-5kHz)',
          intensity: '峰值90%',
          description: '光柱划破空气的轰鸣 + 大气层被电离的爆裂声'
        }
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.5).toFixed(1)}s`,
        name: '龙身蜿蜒',
        description: '烛龙全身从光柱中蜿蜒而出——赤红色龙鳞，每片鳞片边缘有火焰燃烧，龙身长度约百米，盘踞在Nirath山脉之上。龙身移动时，鳞片摩擦产生火星',
        visual: '龙身盘踞山脉，赤红色龙鳞，鳞片边缘有火焰，龙身移动时产生大量火星和烟雾',
        camera: '环绕航拍，镜头围绕烛龙做螺旋上升，展示龙身与山脉的尺度对比',
        sound: {
          type: 'dragon movement + scale friction',
          frequency: '低频龙身移动(20-50Hz) + 中频鳞片摩擦(300-800Hz)',
          intensity: '从60%渐增至80%',
          description: '龙身移动的低频震动 + 鳞片摩擦的沙沙声'
        }
      },
      {
        time: `${(start + 2.5).toFixed(1)}-${end.toFixed(1)}s`,
        name: '烛火神威',
        description: '烛龙完全展现，盘踞在山脉之巅——双眼如太阳般照耀，龙口微张，火焰从牙缝间渗出，整个场景被赤金色光芒笼罩。Nirath世界因烛龙睁眼而从黑夜变为白昼',
        visual: '烛龙盘踞山脉之巅，双眼光芒照亮整个画面，龙身赤红色龙鳞在光芒中闪烁，背景是Nirath双日暮光',
        camera: '低角度仰拍，烛龙占据画面70%，光芒从身后照射形成逆光',
        sound: {
          type: 'ambient divine presence + fire breathing',
          frequency: '持续低频神性底噪(15-35Hz) + 中频火焰(200-600Hz)',
          intensity: '稳定在70%',
          description: '烛龙存在的环境底噪 + 牙缝间火焰的呼呼声'
        }
      }
    ],
    soundEffects: [
      { type: 'eyes igniting', frequency: '30-60Hz', duration: '0.5-1.0s', description: '双眼点燃的低频能量声' },
      { type: 'light beam slicing', frequency: '20-40Hz', duration: '0.5-1.5s', description: '光柱划破空气的轰鸣' },
      { type: 'atmospheric ionization', frequency: '1-5kHz', duration: '0.5-2.0s', description: '大气层被电离的爆裂声' },
      { type: 'dragon movement', frequency: '20-50Hz', duration: '1.5-3.0s', description: '龙身移动的低频震动' },
      { type: 'scale friction', frequency: '300-800Hz', duration: '1.5-3.0s', description: '鳞片摩擦的沙沙声' },
      { type: 'divine presence', frequency: '15-35Hz', duration: '2.5-8.0s', description: '烛龙存在的环境底噪' }
    ],
    promptEnhancement: `神兽烛龙的出场必须是神性展示——黑暗中双眼缓缓睁开→目光如光柱划破夜空→龙身从光柱中蜿蜒而出→火焰从龙鳞缝隙喷涌。双眼特写占据画面60%，然后镜头急速后拉reveal整条龙身盘踞山脉。音效包括双眼点燃30-60Hz、光柱划破20-40Hz、大气电离1-5kHz、龙身移动20-50Hz、鳞片摩擦300-800Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.0s': '黑暗中双眼缓缓睁开',
      '0.5-1.5s': '目光如光柱划破夜空',
      '1.5-2.5s': '龙身从光柱中蜿蜒而出',
      '2.5-3.0s': '烛火神威，画面定格',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 九尾狐出场：幻光迷踪 ====================
function _designJiuweihuEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '九尾狐',
    entranceConcept: '黑暗中九条尾巴如极光般缓缓展开→每条尾巴释放不同颜色的幻光→幻光交织成迷宫般的空间→九尾狐从幻光中心优雅现身。整个过程充满魅惑和神秘感',
    fullScreenStrategy: '九条尾巴从画面边缘向中心汇聚，每条尾巴占据画面一条边，最终狐狸面孔从幻光中心浮现——画面被尾巴和幻光填满',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '尾巴初现',
        description: '黑暗中，九条发光的尾巴从画面边缘缓缓探入——每条尾巴颜色不同（红、橙、黄、绿、青、蓝、紫、金、银），如同九道极光在黑暗中舞动',
        visual: '九条尾巴从画面四周探入，每条尾巴宽约0.5米，长度延伸至画面中心，尾巴尖端有发光粒子',
        camera: '固定镜头，尾巴从画面边缘向中心汇聚',
        sound: {
          type: 'tails emerging + light particles',
          frequency: '中频粒子声(500-1kHz) + 低频尾巴移动(40-80Hz)',
          intensity: '从20%渐增至50%',
          description: '尾巴出现的粒子声 + 尾巴舞动的低频声'
        }
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '幻光迷宫',
        description: '九条尾巴释放的幻光交织成迷宫般的空间——光线在空气中反射、折射，形成无数镜像。每个镜像中都有狐狸的倒影，但哪个是真身？',
        visual: '幻光交织成三维迷宫，光线之间有彩虹色散，镜像中狐狸倒影姿态各异',
        camera: '镜头在幻光迷宫中穿梭，穿过一道道光墙，每个光墙后都有狐狸倒影',
        sound: {
          type: 'light maze + mirror reflections',
          frequency: '中高频光折射(1-3kHz) + 低频空间共鸣(30-60Hz)',
          intensity: '从50%渐增至70%',
          description: '幻光折射的清脆声 + 迷宫空间的共鸣声'
        }
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.5).toFixed(1)}s`,
        name: '真身浮现',
        description: '幻光逐渐收敛，所有镜像汇聚到中心——九尾狐的真身从幻光中心优雅浮现。白色皮毛，九条尾巴在身后如孔雀开屏般展开，双眼有魅惑的紫色光芒',
        visual: '狐狸真身从幻光中心浮现，白色皮毛，九条尾巴展开，双眼紫色光芒，周围幻光如星云般旋转',
        camera: '镜头从迷宫穿梭中突然定格，狐狸面孔特写占据画面50%',
        sound: {
          type: 'true form emerging +魅惑 resonance',
          frequency: '中频浮现声(400-800Hz) + 低频魅惑共鸣(25-50Hz)',
          intensity: '从60%渐增至80%',
          description: '真身浮现的神秘声 + 魅惑共鸣的低频声'
        }
      },
      {
        time: `${(start + 2.5).toFixed(1)}-${end.toFixed(1)}s`,
        name: '魅影定格',
        description: '九尾狐完全展现，九条尾巴在身后优雅舞动——每条尾巴尖端有发光粒子飘散，双眼紫色光芒扫视前方，嘴角有神秘的微笑。整个场景充满魅惑和不可捉摸的神秘感',
        visual: '狐狸占据画面60%，九条尾巴在身后展开，尾巴舞动时产生光粒子轨迹，双眼紫色光芒成为视觉焦点',
        camera: '中景镜头，狐狸成为画面主体，尾巴舞动填充画面边缘',
        sound: {
          type: 'ambient魅惑 + tail dancing',
          frequency: '持续低频魅惑底噪(20-40Hz) + 中频尾巴舞动(300-600Hz)',
          intensity: '稳定在60%',
          description: '九尾狐存在的环境底噪 + 尾巴舞动的沙沙声'
        }
      }
    ],
    soundEffects: [
      { type: 'tails emerging', frequency: '40-80Hz', duration: '0.5-1.0s', description: '尾巴出现的低频声' },
      { type: 'light particles', frequency: '500-1kHz', duration: '0.5-1.5s', description: '发光粒子的中频声' },
      { type: 'light maze', frequency: '1-3kHz', duration: '0.5-2.0s', description: '幻光折射的清脆声' },
      { type: 'mirror reflections', frequency: '30-60Hz', duration: '0.5-2.0s', description: '迷宫空间的共鸣声' },
      { type: '魅惑 resonance', frequency: '20-40Hz', duration: '1.5-8.0s', description: '魅惑共鸣的低频底噪' },
      { type: 'tail dancing', frequency: '300-600Hz', duration: '2.5-8.0s', description: '尾巴舞动的沙沙声' }
    ],
    promptEnhancement: `神兽九尾狐的出场必须是魅惑展示——九条尾巴如极光般展开→幻光交织成迷宫→真身从幻光中心优雅浮现。九条尾巴从画面边缘向中心汇聚，每条尾巴颜色不同，最终狐狸面孔从幻光中心浮现占据画面60%。音效包括尾巴出现40-80Hz、幻光折射1-3kHz、魅惑共鸣20-40Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.0s': '九条尾巴如极光般展开',
      '0.5-2.0s': '幻光交织成迷宫',
      '1.5-2.5s': '真身从幻光中心浮现',
      '2.5-3.0s': '魅影定格',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 帝江出场：混沌初开 ====================
function _designDijiangEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '帝江',
    entranceConcept: '混沌空间中六足四翼的轮廓逐渐清晰→翅膀扇动产生时空扭曲→身体表面的纹理如宇宙星云般旋转→帝江从混沌中完全显现。整个过程充满宇宙诞生的神秘感',
    fullScreenStrategy: '混沌空间占据整个画面，帝江的身体逐渐从混沌中浮现，翅膀展开时画面被六足和四翼填满',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 1.0).toFixed(1)}s`,
        name: '混沌初现',
        description: '画面中充满混沌的暗物质能量，如同宇宙诞生前的星云。混沌中隐约可见六足四翼的轮廓，但看不清具体形态',
        visual: '画面充满暗紫色和黑色的混沌能量，有微弱的星云纹理旋转，轮廓模糊',
        camera: '固定镜头，混沌空间充满画面',
        sound: {
          type: 'chaos energy + cosmic background',
          frequency: '超低频混沌(10-25Hz) + 中频星云旋转(200-500Hz)',
          intensity: '稳定在40%',
          description: '混沌空间的超低频底噪 + 星云旋转的中频声'
        }
      },
      {
        time: `${(start + 1.0).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '翅膀扇动',
        description: '帝江的四只翅膀缓缓扇动，每一次扇动都产生时空扭曲——画面中的光线弯曲，远处的山脉被扭曲成波浪形。翅膀表面有宇宙星云般的纹理',
        visual: '四只翅膀展开，每只翅膀宽约20米，翅膀表面有星云纹理，扇动时产生光线弯曲效果',
        camera: '镜头跟随翅膀扇动的轨迹移动，画面产生扭曲变形',
        sound: {
          type: 'wing flap + space-time distortion',
          frequency: '低频翅膀扇动(20-50Hz) + 中频时空扭曲(300-1kHz)',
          intensity: '从40%渐增至70%',
          description: '翅膀扇动的低频声 + 时空扭曲的奇异声'
        }
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '帝江显现',
        description: '帝江完全从混沌中显现——六足四翼，无头无面，身体表面有宇宙星云纹理旋转。混沌能量被翅膀扇动驱散，露出Nirath星空背景',
        visual: '帝江占据画面70%，六足四翼展开，身体表面星云纹理旋转，背景是Nirath星空',
        camera: '环绕航拍，展示帝江的六足四翼与星空的尺度对比',
        sound: {
          type: 'divine chaos + cosmic resonance',
          frequency: '持续超低频混沌(10-25Hz) + 高频星空(2-5kHz)',
          intensity: '稳定在60%',
          description: '帝江存在的混沌底噪 + 星空的高频声'
        }
      }
    ],
    soundEffects: [
      { type: 'chaos energy', frequency: '10-25Hz', duration: '0.5-3.0s', description: '混沌空间的超低频底噪' },
      { type: 'wing flap', frequency: '20-50Hz', duration: '1.0-3.0s', description: '翅膀扇动的低频声' },
      { type: 'space-time distortion', frequency: '300-1kHz', duration: '1.0-3.0s', description: '时空扭曲的奇异声' },
      { type: 'cosmic resonance', frequency: '2-5kHz', duration: '2.0-8.0s', description: '星空的高频声' }
    ],
    promptEnhancement: `神兽帝江的出场必须是混沌展示——混沌空间中轮廓逐渐清晰→翅膀扇动产生时空扭曲→身体表面星云纹理旋转→从混沌中完全显现。六足四翼展开填满画面，身体表面有宇宙星云纹理。音效包括混沌底噪10-25Hz、翅膀扇动20-50Hz、时空扭曲300-1kHz、星空2-5kHz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.5s': '混沌初现，轮廓隐约',
      '1.0-2.0s': '翅膀扇动，时空扭曲',
      '2.0-3.0s': '帝江显现，混沌驱散',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 白泽出场：智慧显现 ====================
function _designBaizeEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '白泽',
    entranceConcept: '知识光芒从地下涌出→光芒中浮现白泽的轮廓→白泽从光芒中走出，每一步都有知识符号在地面显现→白泽完全展现，目光如智慧之光。整个过程充满知识和神圣感',
    fullScreenStrategy: '知识光芒从地面涌起填满画面，白泽从光芒中浮现，目光中的智慧之光照亮整个场景',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 1.0).toFixed(1)}s`,
        name: '知识涌起',
        description: '地面开始涌出金色的知识光芒——光芒中有无数符号和文字在流动，如同地下埋藏的智慧被唤醒。光芒逐渐汇聚成白泽的轮廓',
        visual: '地面涌出金色光芒，高度约10米，光芒中有符号流动，轮廓逐渐清晰',
        camera: '低角度镜头，从地面光芒仰视',
        sound: {
          type: 'knowledge emerging + symbols flowing',
          frequency: '中频知识声(400-800Hz) + 低频光芒(30-60Hz)',
          intensity: '从20%渐增至60%',
          description: '知识涌现的中频声 + 光芒的低频声'
        }
      },
      {
        time: `${(start + 1.0).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '白泽浮现',
        description: '白泽从光芒中走出——白色毛发，羊角，牛尾，目光中有智慧的光芒。每一步都有知识符号在地面显现，符号发光后消散',
        visual: '白泽从光芒中走出，白色毛发，羊角弯曲，牛尾摆动，目光中有金色光芒',
        camera: '镜头跟随白泽的步伐移动',
        sound: {
          type: 'beast emerging + steps glowing',
          frequency: '中频浮现声(300-600Hz) + 低频脚步(20-50Hz)',
          intensity: '从50%渐增至70%',
          description: '白泽浮现的中频声 + 脚步的低频声'
        }
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '智慧定格',
        description: '白泽完全展现，目光中的智慧之光照亮整个场景——目光所及之处，地面浮现知识符号，符号发光后消散。整个场景充满知识和神圣感',
        visual: '白泽占据画面60%，目光金色光芒照亮场景，地面有符号浮现',
        camera: '中景镜头，白泽成为画面主体',
        sound: {
          type: 'wisdom presence + symbol resonance',
          frequency: '持续低频智慧底噪(15-35Hz) + 中频符号(300-700Hz)',
          intensity: '稳定在60%',
          description: '白泽存在的智慧底噪 + 符号浮现的中频声'
        }
      }
    ],
    soundEffects: [
      { type: 'knowledge emerging', frequency: '30-60Hz', duration: '0.5-2.0s', description: '知识光芒的低频声' },
      { type: 'symbols flowing', frequency: '400-800Hz', duration: '0.5-2.0s', description: '符号流动的中频声' },
      { type: 'wisdom presence', frequency: '15-35Hz', duration: '2.0-8.0s', description: '智慧底噪' }
    ],
    promptEnhancement: `神兽白泽的出场必须是智慧展示——知识光芒从地下涌出→光芒中浮现轮廓→从光芒中走出→目光智慧之光照亮场景。知识符号在地面浮现发光。音效包括知识涌现30-60Hz、符号流动400-800Hz、智慧底噪15-35Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.5s': '知识光芒涌起',
      '1.0-2.0s': '白泽从光芒中浮现',
      '2.0-3.0s': '智慧定格',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 麒麟出场：祥瑞降临 ====================
function _designQilinEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '麒麟',
    entranceConcept: '天空中祥云汇聚→祥云形成麒麟的轮廓→麒麟从祥云中踏出，每一步都有祥云在脚下生成→麒麟完全展现，祥瑞之光照亮整个场景。整个过程充满祥瑞和神圣感',
    fullScreenStrategy: '祥云从天空汇聚填满画面，麒麟从祥云中踏出，祥瑞之光照亮整个场景',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 1.0).toFixed(1)}s`,
        name: '祥云汇聚',
        description: '天空中祥云从四面八方汇聚——祥云呈七彩颜色，如同彩虹般的云朵在天空中流动。祥云逐渐汇聚成麒麟的轮廓',
        visual: '天空中七彩祥云流动，汇聚成轮廓，祥云边缘有发光粒子',
        camera: '仰拍镜头，从地面仰视天空',
        sound: {
          type: 'clouds gathering + divine wind',
          frequency: '低频祥云(20-40Hz) + 中频风声(300-600Hz)',
          intensity: '从20%渐增至50%',
          description: '祥云汇聚的低频声 + 神圣风的中频声'
        }
      },
      {
        time: `${(start + 1.0).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '麒麟踏云',
        description: '麒麟从祥云中踏出——鹿身，牛尾，马蹄，头有独角。每一步都有祥云在脚下生成，祥云被踏散后化为发光粒子飘散',
        visual: '麒麟从祥云中踏出，鹿身白色毛发，牛尾摆动，马蹄踏云，独角有光芒',
        camera: '镜头跟随麒麟的步伐，从仰拍转为平视',
        sound: {
          type: 'beast stepping + clouds dispersing',
          frequency: '低频脚步(15-40Hz) + 中频祥云消散(250-500Hz)',
          intensity: '从40%渐增至70%',
          description: '麒麟脚步的低频声 + 祥云消散的中频声'
        }
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '祥瑞定格',
        description: '麒麟完全展现，祥瑞之光照亮整个场景——独角发出七彩光芒，光芒所及之处，地面生长出奇花异草。整个场景充满祥瑞和生机',
        visual: '麒麟占据画面60%，独角七彩光芒，地面奇花异草生长',
        camera: '中景镜头，麒麟成为画面主体',
        sound: {
          type: 'divine blessing + life growing',
          frequency: '持续低频祥瑞底噪(10-30Hz) + 高频生命(2-4kHz)',
          intensity: '稳定在60%',
          description: '麒麟存在的祥瑞底噪 + 生命生长的高频声'
        }
      }
    ],
    soundEffects: [
      { type: 'clouds gathering', frequency: '20-40Hz', duration: '0.5-2.0s', description: '祥云汇聚的低频声' },
      { type: 'divine wind', frequency: '300-600Hz', duration: '0.5-2.0s', description: '神圣风的中频声' },
      { type: 'beast stepping', frequency: '15-40Hz', duration: '1.0-3.0s', description: '麒麟脚步的低频声' },
      { type: 'divine blessing', frequency: '10-30Hz', duration: '2.0-8.0s', description: '祥瑞底噪' }
    ],
    promptEnhancement: `神兽麒麟的出场必须是祥瑞展示——祥云汇聚→祥云形成轮廓→从祥云中踏出→祥瑞之光照亮场景。七彩祥云填满天空，麒麟踏云而出，独角七彩光芒照亮地面。音效包括祥云汇聚20-40Hz、神圣风300-600Hz、麒麟脚步15-40Hz、祥瑞底噪10-30Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.5s': '祥云汇聚',
      '1.0-2.0s': '麒麟踏云而出',
      '2.0-3.0s': '祥瑞定格',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 饕餮出场：吞噬天地 ====================
function _designTaotieEntrance(beastId, beastInfo, templateId, start, end) {
  return {
    beastId,
    beastName: '饕餮',
    entranceConcept: '黑暗中巨口缓缓张开→口中产生吞噬漩涡→周围一切（光、尘、能量）被吸入漩涡→饕餮从漩涡中心完全显现。整个过程充满吞噬一切的恐怖感',
    fullScreenStrategy: '巨口张开占据画面80%，吞噬漩涡填满画面中心，饕餮的面孔从漩涡中浮现',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '巨口初现',
        description: '黑暗中，一张巨大的嘴缓缓张开——嘴宽约50米，牙齿如刀刃般锋利，口腔内部是深不见底的黑暗。巨口张开时，周围空气被吸入产生气流',
        visual: '巨口从画面中心张开，牙齿锋利，口腔黑暗，周围空气扭曲',
        camera: '正面特写，巨口占据画面80%',
        sound: {
          type: 'mouth opening + air suction',
          frequency: '低频巨口(15-30Hz) + 中频气流(200-500Hz)',
          intensity: '从20%渐增至50%',
          description: '巨口张开的低频声 + 空气被吸入的气流声'
        }
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '吞噬漩涡',
        description: '巨口中产生吞噬漩涡——周围的光线、尘埃、能量被吸入漩涡，漩涡呈逆时针旋转，中心是绝对的黑暗。漩涡产生的吸力让地面碎石飞起',
        visual: '漩涡直径约30米，逆时针旋转，中心黑暗，周围光线被吸入产生光带，地面碎石飞起',
        camera: '镜头在漩涡前方，画面产生被吸入的扭曲感',
        sound: {
          type: 'devouring vortex + debris flying',
          frequency: '超低频漩涡(5-20Hz) + 高频碎石(2-5kHz)',
          intensity: '从50%渐增至80%',
          description: '吞噬漩涡的超低频轰鸣 + 碎石飞舞的高频声'
        }
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${end.toFixed(1)}s`,
        name: '饕餮显现',
        description: '饕餮从漩涡中心完全显现——羊身人面，虎齿人爪，眼睛在腋下。吞噬漩涡逐渐收敛，但饕餮的巨口仍然张开，准备吞噬一切',
        visual: '饕餮占据画面70%，羊身，人面，虎齿，人爪，眼睛在腋下，巨口张开',
        camera: '中景镜头，饕餮成为画面主体',
        sound: {
          type: 'devouring presence + hunger resonance',
          frequency: '持续超低频吞噬底噪(5-15Hz) + 中频饥饿(200-600Hz)',
          intensity: '稳定在70%',
          description: '饕餮存在的吞噬底噪 + 饥饿感的中频声'
        }
      }
    ],
    soundEffects: [
      { type: 'mouth opening', frequency: '15-30Hz', duration: '0.5-1.0s', description: '巨口张开的低频声' },
      { type: 'devouring vortex', frequency: '5-20Hz', duration: '0.5-2.0s', description: '吞噬漩涡的超低频轰鸣' },
      { type: 'debris flying', frequency: '2-5kHz', duration: '0.5-2.0s', description: '碎石飞舞的高频声' },
      { type: 'devouring presence', frequency: '5-15Hz', duration: '1.5-8.0s', description: '吞噬底噪' }
    ],
    promptEnhancement: `神兽饕餮的出场必须是吞噬展示——巨口缓缓张开→口中产生吞噬漩涡→周围一切被吸入→从漩涡中心完全显现。巨口张开占据画面80%，吞噬漩涡填满画面中心。音效包括巨口张开15-30Hz、吞噬漩涡5-20Hz、碎石飞舞2-5kHz、吞噬底噪5-15Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.0s': '巨口初现',
      '0.5-1.5s': '吞噬漩涡',
      '1.5-3.0s': '饕餮显现',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 通用出场（未知神兽） ====================
function _designGenericEntrance(beastId, beastInfo, templateId, start, end) {
  const beastName = beastInfo?.name || beastId;
  
  return {
    beastId,
    beastName,
    entranceConcept: `${beastName}从黑暗中缓缓浮现→身体细节逐渐清晰→完全展现。出场过程充满神秘感和力量感`,
    fullScreenStrategy: '从黑暗到光明的渐变，神兽占据画面70%',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 1.0).toFixed(1)}s`,
        name: '轮廓浮现',
        description: `${beastName}的轮廓从黑暗中缓缓浮现——先是模糊的阴影，然后逐渐清晰`,
        visual: '轮廓从模糊到清晰，有微弱的发光效果',
        camera: '固定镜头',
        sound: {
          type: 'presence emerging',
          frequency: '20-50Hz',
          intensity: '从20%渐增至50%',
          description: '神兽出现的低频声'
        }
      },
      {
        time: `${(start + 1.0).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '细节清晰',
        description: `${beastName}的身体细节逐渐清晰——毛发、鳞片、眼睛等细节一一呈现`,
        visual: '细节逐渐清晰，有微弱的发光效果',
        camera: '镜头缓缓推进',
        sound: {
          type: 'details revealing',
          frequency: '100-500Hz',
          intensity: '从40%渐增至70%',
          description: '细节呈现的中频声'
        }
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '完全展现',
        description: `${beastName}完全展现，占据画面70%，目光如炬`,
        visual: '神兽占据画面70%，目光有光芒',
        camera: '中景镜头',
        sound: {
          type: 'ambient presence',
          frequency: '15-35Hz',
          intensity: '稳定在60%',
          description: '神兽存在的环境底噪'
        }
      }
    ],
    soundEffects: [
      { type: 'presence emerging', frequency: '20-50Hz', duration: '0.5-2.0s', description: '神兽出现的低频声' },
      { type: 'ambient presence', frequency: '15-35Hz', duration: '2.0-8.0s', description: '神兽存在的环境底噪' }
    ],
    promptEnhancement: `神兽${beastName}的出场必须是力量展示——从黑暗中缓缓浮现→身体细节逐渐清晰→完全展现占据画面70%。音效包括出现低频声20-50Hz、环境底噪15-35Hz。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-1.5s': '轮廓浮现',
      '1.0-2.0s': '细节清晰',
      '2.0-3.0s': '完全展现',
      '3.0-4.5s': '标题创意出现',
      '4.5-6.5s': '小G入镜',
      '6.5-8.0s': '稳定展示'
    }
  };
}

// ==================== 主导出 ====================
module.exports = {
  designBeastEntrance,
  _designXingtianEntrance,
  _designZhulongEntrance,
  _designJiuweihuEntrance,
  _designDijiangEntrance,
  _designBaizeEntrance,
  _designQilinEntrance,
  _designTaotieEntrance,
  _designGenericEntrance
};