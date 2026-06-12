/**
 * 👦 小G入镜设计师 - XiaoG Entrance Designer v1.0-Peng
 * 
 * 负责设计小G的"自然入镜方式"——不是生硬出现，而是被吸引/被召唤/偶然闯入，
 * 与本集内容和神兽相融合。
 * 
 * 核心原则：
 * 1. 入镜必须自然——不是fade in，而是有原因的进入
 * 2. 必须与神兽呼应——小G的出现与神兽的存在有某种联系
 * 3. 必须与本集内容融合——入镜方式暗示本集的故事走向
 * 4. 小G必须展现"待机感与生命细节"——不是木偶，而是有呼吸、有微动作的真实孩子
 * 5. 8秒内完成入镜，精确到0.5秒
 * 
 * 输出结构：
 * {
 *   entranceConcept: string,
 *   phases: [{ time, name, description, visual, xiaoGAction, camera }],
 *   promptEnhancement: string,
 *   idlePresenceDetails: string
 * }
 */

const fs = require('fs');
const path = require('path');

/**
 * 小G入镜设计器
 * @param {string} beastId - 神兽ID
 * @param {Object} beastInfo - 神兽信息
 * @param {string} templateId - 片头模板ID
 * @param {string} episodeTheme - 本集主题
 * @returns {Object} 入镜设计方案
 */
function designXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme) {
  console.log(`\n👦 [XiaoGEntranceDesigner] 设计小G入镜: ${beastId}`);
  
  const entranceStart = 4.5; // 小G在第4.5秒开始入镜（神兽登场+标题出现后）
  const entranceEnd = 6.5;   // 小G在第6.5秒完成入镜
  
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
  
  // 根据神兽ID选择入镜策略
  const entranceStrategies = {
    xingtian: _designXingtianXiaoGEntrance,
    zhulong: _designZhulongXiaoGEntrance,
    jiuweihu: _designJiuweihuXiaoGEntrance,
    dijiang: _designDijiangXiaoGEntrance,
    baize: _designBaizeXiaoGEntrance,
    qilin: _designQilinXiaoGEntrance,
    taotie: _designTaotieXiaoGEntrance
  };
  
  const strategy = entranceStrategies[pinyinId] || _designGenericXiaoGEntrance;
  
  return strategy(beastId, beastInfo, templateId, episodeTheme, entranceStart, entranceEnd);
}

// ==================== 刑天篇：被战意吸引 ====================
function _designXingtianXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '刑天',
    entranceConcept: '小G不是主动来找刑天，而是被某种"声音/震动"吸引——循着战斧劈岩的低频震动和盾牌撞击的回响，小G好奇地走近。他的入镜是"被召唤"的，体现刑天战魂的不可抗拒的吸引力',
    idlePresenceDetails: '小G的呼吸节奏因兴奋而加快，手指无意识地攥紧指南针挂绳，瞳孔因远处光芒而收缩，嘴角有抑制不住的好奇微笑——不是恐惧，是探险家发现宝藏的兴奋',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '远处身影',
        description: '画面边缘出现一个微小的人影——那是小G，他正从远处的山脊上探头张望。身影很小（约占画面5%），但观众的注意力被吸引——"那是什么？"',
        visual: '小G身影在画面左下角，距离约200米，身影微小但轮廓清晰（黄色冲锋衣在灰暗岩壁上很显眼），他正在探头张望',
        xiaoGAction: '探头张望，身体前倾，右手遮阳远望（虽然双日暮光并不刺眼，但这是孩子的习惯性动作）',
        camera: '镜头从刑天身上缓缓下移，移向小G的方向',
        soundHint: '远处传来小G的脚步声（微弱），与刑天的环境底噪形成对比'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '好奇走近',
        description: '小G从山脊上走下来，向刑天方向走近——步伐轻快但不奔跑，是探险家发现有趣事物时的步伐。他一边走一边抬头看刑天，眼神中有好奇和敬畏',
        visual: '小G从画面边缘向中心移动，步伐轻快，距离从200米缩短到50米，黄色冲锋衣和牛仔裤清晰可见',
        xiaoGAction: '快步行走但不奔跑，左手自然摆动，右手握着指南针（指南针在晃动），不时抬头看刑天，眼神好奇',
        camera: '镜头跟随小G移动，从远景转为中景',
        soundHint: '脚步声渐强（运动鞋踩在碎石上的沙沙声），指南针挂绳晃动的细微声响'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '抬头仰望',
        description: '小G走到刑天脚下（约10米距离），停下脚步，抬头仰望——刑天的巨躯占据他整个视野。小G的脖子后仰到极限，嘴巴微张，这是孩子看到不可思议事物时的本能反应',
        visual: '小G站在刑天脚下，身高对比悬殊（小G约1.3米，刑天约30米），小G的头部在画面下方，刑天的双乳光芒在画面上方',
        xiaoGAction: '停下脚步，双脚并拢，脖子后仰到极限，嘴巴微张，双手自然下垂但手指微微颤抖（不是恐惧，是兴奋），指南针在胸前晃动',
        camera: '低角度仰拍，从小G的视角看刑天——观众感受到小G的渺小和刑天的巨大',
        soundHint: '小G的呼吸声（因兴奋而加快），刑天的环境底噪（持续低频）'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '伸手触碰',
        description: '小G缓缓伸出右手，向刑天的方向——不是真的要去触碰（距离还有10米），而是孩子面对巨大事物时的本能反应：想确认这是不是真的。手指微微颤抖，呼吸急促',
        visual: '小G的右手伸出，手指微微颤抖，指尖指向刑天的方向。小G的面部表情从好奇转为敬畏，眼睛睁大',
        xiaoGAction: '右手缓缓伸出，手指微微颤抖，左手仍然握着指南针，身体微微前倾，脚尖踮起（想看得更清楚）',
        camera: '特写镜头，小G的右手和面部表情，背景是模糊的刑天巨躯',
        soundHint: '小G的心跳声（微弱但加快），呼吸声（急促）'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找刑天，而是被战斧劈岩的震动和盾牌撞击的回响吸引，循着声音好奇走近。他的步伐轻快但不奔跑，是探险家发现有趣事物时的步伐。走到刑天脚下时，他停下脚步抬头仰望，脖子后仰到极限，嘴巴微张——这是孩子看到不可思议事物时的本能反应。最后他缓缓伸出右手，手指微微颤抖，想确认这是不是真的。整个过程展现小G的"待机感与生命细节"：呼吸因兴奋而加快，手指无意识地攥紧指南针挂绳，瞳孔因远处光芒而收缩。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G远处探头张望',
      '5.0-6.0s': '小G好奇走近',
      '6.0-6.5s': '小G抬头仰望',
      '6.5-8.0s': '小G伸手触碰'
    }
  };
}

// ==================== 烛龙篇：被光芒吸引 ====================
function _designZhulongXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '烛龙',
    entranceConcept: '小G不是主动来找烛龙，而是被那道划破夜空的光柱吸引——他原本在睡觉（或休息），被光芒惊醒，循着光芒走来。他的入镜是"被唤醒"的，体现烛龙光芒的神性和不可抗拒的吸引力',
    idlePresenceDetails: '小G的眼睛被光芒刺得微微眯起，但倔强地不肯完全闭上——探险家想看清楚。手指无意识地揉眼睛（被光芒惊醒的习惯），但眼睛始终盯着光芒的方向',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '被光惊醒',
        description: '画面边缘，小G原本蜷缩在一块岩石旁（似乎在休息），突然被远处的光芒惊醒——他猛地坐起，揉了揉眼睛，望向光芒的方向',
        visual: '小G蜷缩在岩石旁，黄色冲锋衣在黑暗中很显眼，被光芒惊醒后猛地坐起',
        xiaoGAction: '蜷缩→猛地坐起→揉眼睛→望向光芒方向，动作连贯自然',
        camera: '镜头从烛龙的光芒移向小G',
        soundHint: '小G被惊醒的喘息声'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '循光走来',
        description: '小G站起身，向光芒方向走来——步伐有些不稳（刚睡醒），但眼神坚定。他一边走一边抬头看光芒，眼睛被刺得微微眯起',
        visual: '小G向光芒方向走来，步伐不稳但坚定，黄色冲锋衣在光芒中发光',
        xiaoGAction: '站起身，拍拍裤子上的灰尘，向光芒方向走来，不时抬头眯眼看光芒',
        camera: '镜头跟随小G移动',
        soundHint: '脚步声（有些不稳），指南针挂绳晃动'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '仰望龙身',
        description: '小G走到烛龙盘踞的山脉脚下，停下脚步，仰望龙身——烛龙的龙鳞在光芒中闪烁，龙身蜿蜒至天际。小G的嘴巴微张，眼睛睁大',
        visual: '小G站在山脉脚下，仰望烛龙，龙身占据整个天空',
        xiaoGAction: '停下脚步，双脚分开站稳，脖子后仰，嘴巴微张，眼睛睁大',
        camera: '低角度仰拍，从小G视角看烛龙',
        soundHint: '小G的呼吸声（因 awe 而屏住）'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '被光芒笼罩',
        description: '烛龙的光芒照在小G身上，小G被光芒笼罩——他的黄色冲锋衣在光芒中变成金色，头发被光芒照亮。小G缓缓伸出右手，想触碰那道光芒',
        visual: '小G被光芒笼罩，冲锋衣变成金色，右手伸向光芒',
        xiaoGAction: '右手伸向光芒，手指张开，表情从 awe 转为平静（被光芒的温柔感染）',
        camera: '中景镜头，小G被光芒笼罩',
        soundHint: '光芒的温暖感（高频柔和声）'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找烛龙，而是被划破夜空的光柱惊醒，循着光芒好奇走近。他原本蜷缩在岩石旁休息，被光芒惊醒后猛地坐起，揉了揉眼睛，望向光芒方向。他的步伐有些不稳（刚睡醒），但眼神坚定。走到烛龙脚下时，他仰望龙身，嘴巴微张，眼睛睁大。最后被光芒笼罩，黄色冲锋衣变成金色，缓缓伸出右手想触碰光芒。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G被光惊醒',
      '5.0-6.0s': '小G循光走来',
      '6.0-6.5s': '小G仰望龙身',
      '6.5-8.0s': '小G被光芒笼罩'
    }
  };
}

// ==================== 九尾狐篇：被幻光迷惑 ====================
function _designJiuweihuXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '九尾狐',
    entranceConcept: '小G不是主动来找九尾狐，而是被幻光迷宫吸引——他原本在追踪一只发光的小动物，追着追着进入了幻光迷宫，最终发现那是九尾狐的尾巴。他的入镜是"被迷惑"的，体现九尾狐的魅惑和不可捉摸',
    idlePresenceDetails: '小G的眼神有些迷离（被幻光影响），但嘴角有微笑——他不是害怕，而是觉得有趣。手指无意识地跟随幻光移动，像是在追逐蝴蝶的孩子',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '追逐光点',
        description: '画面边缘，小G正在追逐一只发光的小动物（或孢子）——他弯着腰，双手张开，像抓蝴蝶一样追逐。小动物向幻光迷宫方向逃去',
        visual: '小G弯腰追逐，双手张开，黄色冲锋衣在幻光中很显眼',
        xiaoGAction: '弯腰追逐，双手张开，步伐轻快，脸上带着微笑',
        camera: '镜头跟随小G追逐',
        soundHint: '小G的笑声（轻快）'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '进入迷宫',
        description: '小G追着光点进入幻光迷宫——他停下脚步，环顾四周，发现周围都是幻光。他的表情从好奇转为困惑，然后转为惊叹',
        visual: '小G站在幻光迷宫中，周围是七彩幻光，表情从好奇→困惑→惊叹',
        xiaoGAction: '停下脚步，环顾四周，双手放下，表情变化',
        camera: '镜头围绕小G旋转',
        soundHint: '幻光的清脆声'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '发现真身',
        description: '幻光逐渐收敛，小G发现面前站着九尾狐——他的表情从惊叹转为敬畏，嘴巴微张。九尾狐的双眼紫色光芒照在小G身上',
        visual: '小G站在九尾狐面前，九尾狐双眼紫色光芒',
        xiaoGAction: '表情从惊叹转为敬畏，嘴巴微张，双手自然下垂',
        camera: '中景镜头，小G和九尾狐同框',
        soundHint: '九尾狐的魅惑共鸣声'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '被魅惑',
        description: '九尾狐的尾巴在小G周围舞动，小G被魅惑——他的眼神有些迷离，但嘴角有微笑。他缓缓伸出右手，想触碰九尾狐的尾巴',
        visual: '小G被尾巴包围，眼神迷离但微笑，右手伸出',
        xiaoGAction: '眼神迷离但微笑，右手缓缓伸出，想触碰尾巴',
        camera: '特写镜头，小G的右手和九尾狐的尾巴',
        soundHint: '尾巴舞动的沙沙声'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找九尾狐，而是被幻光迷宫吸引，追着发光的小动物进入迷宫。他的表情从好奇→困惑→惊叹→敬畏，最后被魅惑。整个过程展现九尾狐的不可捉摸和魅惑力。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G追逐光点',
      '5.0-6.0s': '小G进入迷宫',
      '6.0-6.5s': '小G发现真身',
      '6.5-8.0s': '小G被魅惑'
    }
  };
}

// ==================== 帝江篇：被时空扭曲卷入 ====================
function _designDijiangXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '帝江',
    entranceConcept: '小G不是主动来找帝江，而是被时空扭曲卷入——他原本在观察一块奇怪的岩石，突然周围空间扭曲，他被卷入帝江的混沌空间。他的入镜是"被动卷入"的，体现帝江的混沌和不可预测',
    idlePresenceDetails: '小G的表情从困惑转为惊恐，然后转为接受——他是个勇敢的孩子，即使面对未知也不逃跑。手指无意识地抓紧岩石（本能的求生反应）',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '观察岩石',
        description: '画面边缘，小G正蹲在地上观察一块奇怪的岩石——他歪着头，手指轻轻敲击岩石，耳朵贴近听声音。岩石表面有星云纹理',
        visual: '小G蹲在地上，歪着头，手指敲击岩石，黄色冲锋衣在混沌中很显眼',
        xiaoGAction: '蹲下，歪头，手指敲击岩石，耳朵贴近',
        camera: '镜头从帝江的混沌移向小G',
        soundHint: '手指敲击岩石的清脆声'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '空间扭曲',
        description: '周围空间突然扭曲——小G惊恐地站起，环顾四周，发现周围的景物开始弯曲变形。他的表情从困惑转为惊恐',
        visual: '小G站起，周围景物扭曲，表情从困惑→惊恐',
        xiaoGAction: '猛地站起，环顾四周，双手张开（保持平衡），表情惊恐',
        camera: '镜头扭曲，跟随小G的视角',
        soundHint: '空间扭曲的奇异声'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '被卷入混沌',
        description: '小G被时空扭曲卷入帝江的混沌空间——他的身体被拉扯，但仍然保持清醒。他的表情从惊恐转为接受，嘴角甚至有一丝微笑（勇敢的探险家）',
        visual: '小G被卷入混沌，身体被拉扯，表情从惊恐→接受→微笑',
        xiaoGAction: '身体被拉扯，但保持清醒，表情变化',
        camera: '镜头跟随小G被卷入',
        soundHint: '被卷入的呼啸声'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '面对帝江',
        description: '小G从混沌中浮现，面对帝江——他的表情平静，甚至有些兴奋。他缓缓伸出右手，向帝江的方向',
        visual: '小G从混沌中浮现，面对帝江，表情平静',
        xiaoGAction: '表情平静，右手伸出，向帝江方向',
        camera: '中景镜头，小G和帝江同框',
        soundHint: '混沌的底噪'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找帝江，而是被时空扭曲卷入。他原本在观察一块奇怪的岩石，突然周围空间扭曲，他被卷入帝江的混沌空间。他的表情从困惑→惊恐→接受→微笑，展现勇敢探险家的气质。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G观察岩石',
      '5.0-6.0s': '小G被空间扭曲',
      '6.0-6.5s': '小G被卷入混沌',
      '6.5-8.0s': '小G面对帝江'
    }
  };
}

// ==================== 白泽篇：被知识光芒吸引 ====================
function _designBaizeXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '白泽',
    entranceConcept: '小G不是主动来找白泽，而是被知识光芒吸引——他原本在采集植物样本，突然发现地面涌出金色光芒，好奇地走近。他的入镜是"被知识吸引"的，体现白泽的智慧和吸引力',
    idlePresenceDetails: '小G的眼神充满好奇和求知欲，手指无意识地翻开笔记本（想记录），嘴角有微笑——他是个热爱学习的孩子',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '采集样本',
        description: '画面边缘，小G正蹲在地上采集植物样本——他拿着放大镜，仔细观察一株发光植物，笔记本摊开在身旁',
        visual: '小G蹲在地上，拿着放大镜，黄色冲锋衣在知识光芒中很显眼',
        xiaoGAction: '蹲下，拿着放大镜，仔细观察，不时在笔记本上记录',
        camera: '镜头从白泽的知识光芒移向小G',
        soundHint: '放大镜移动的细微声'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '发现光芒',
        description: '小G突然发现地面涌出金色光芒——他惊讶地站起，放下放大镜，向光芒方向走来。他的表情从专注转为惊讶，然后转为好奇',
        visual: '小G惊讶站起，向光芒方向走来',
        xiaoGAction: '惊讶站起，放下放大镜，向光芒方向走来，表情专注→惊讶→好奇',
        camera: '镜头跟随小G移动',
        soundHint: '知识光芒的涌出声'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '面对白泽',
        description: '小G走到白泽面前，停下脚步——他看着白泽的目光中的智慧之光，表情从好奇转为敬畏。他缓缓翻开笔记本，想记录',
        visual: '小G站在白泽面前，表情敬畏，翻开笔记本',
        xiaoGAction: '停下脚步，表情敬畏，翻开笔记本，准备记录',
        camera: '中景镜头，小G和白泽同框',
        soundHint: '笔记本翻页的细微声'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '求知',
        description: '小G抬头看着白泽，眼神充满求知欲——他缓缓伸出右手，想触碰白泽的独角（知识之源）。他的表情平静但眼中闪烁光芒',
        visual: '小G抬头看着白泽，右手伸出，表情平静但眼中闪烁',
        xiaoGAction: '抬头看着白泽，右手伸出，想触碰独角',
        camera: '特写镜头，小G的右手和白泽的独角',
        soundHint: '知识光芒的柔和声'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找白泽，而是被知识光芒吸引。他原本在采集植物样本，突然发现地面涌出金色光芒，好奇地走近。他的表情从专注→惊讶→好奇→敬畏，展现热爱学习的孩子的气质。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G采集样本',
      '5.0-6.0s': '小G发现光芒',
      '6.0-6.5s': '小G面对白泽',
      '6.5-8.0s': '小G求知'
    }
  };
}

// ==================== 麒麟篇：被祥瑞之光照耀 ====================
function _designQilinXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '麒麟',
    entranceConcept: '小G不是主动来找麒麟，而是被祥瑞之光照耀——他原本在攀爬一座小山，突然山顶发出七彩光芒，他好奇地爬上去，发现麒麟站在那里。他的入镜是"被祥瑞召唤"的，体现麒麟的祥瑞和神圣',
    idlePresenceDetails: '小G的表情充满喜悦和敬畏，手指无意识地合十（祈祷的姿态），嘴角有微笑——他被祥瑞之光感染，感到幸福和平安',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '攀爬小山',
        description: '画面边缘，小G正在攀爬一座小山——他手脚并用，有些吃力，但眼神坚定。黄色冲锋衣在绿色山壁上很显眼',
        visual: '小G攀爬小山，手脚并用，黄色冲锋衣显眼',
        xiaoGAction: '攀爬，手脚并用，有些吃力，眼神坚定',
        camera: '镜头从麒麟的祥瑞之光移向小G',
        soundHint: '攀爬的喘息声'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '发现光芒',
        description: '小G爬到山顶，突然发现山顶发出七彩光芒——他惊讶地站起，环顾四周，发现麒麟站在光芒中。他的表情从疲惫转为惊讶，然后转为喜悦',
        visual: '小G爬到山顶，惊讶站起，麒麟站在光芒中',
        xiaoGAction: '爬到山顶，惊讶站起，环顾四周，表情疲惫→惊讶→喜悦',
        camera: '镜头跟随小G爬上山顶',
        soundHint: '祥瑞之光的柔和声'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '面对麒麟',
        description: '小G站在麒麟面前，停下脚步——他看着麒麟的独角七彩光芒，表情从喜悦转为敬畏。他缓缓跪下（单膝），表示尊敬',
        visual: '小G站在麒麟面前，单膝跪下，表情敬畏',
        xiaoGAction: '停下脚步，单膝跪下，表情敬畏',
        camera: '中景镜头，小G和麒麟同框',
        soundHint: '麒麟的祥瑞底噪'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '被祥瑞笼罩',
        description: '麒麟的祥瑞之光照在小G身上，小G被祥瑞笼罩——他的表情平静，眼中闪烁光芒。他缓缓伸出右手，向麒麟的方向',
        visual: '小G被祥瑞之光笼罩，表情平静',
        xiaoGAction: '表情平静，右手伸出，向麒麟方向',
        camera: '特写镜头，小G的右手和麒麟的独角',
        soundHint: '祥瑞之光的柔和声'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找麒麟，而是被祥瑞之光照耀。他原本在攀爬小山，突然发现山顶发出七彩光芒，好奇地爬上去。他的表情从疲惫→惊讶→喜悦→敬畏，最后单膝跪下表示尊敬。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G攀爬小山',
      '5.0-6.0s': '小G发现光芒',
      '6.0-6.5s': '小G面对麒麟',
      '6.5-8.0s': '小G被祥瑞笼罩'
    }
  };
}

// ==================== 饕餮篇：被吞噬漩涡卷入 ====================
function _designTaotieXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  return {
    beastId,
    beastName: '饕餮',
    entranceConcept: '小G不是主动来找饕餮，而是被吞噬漩涡卷入——他原本在逃跑（看到远处的恐怖景象），但被漩涡的吸力拉回。他的入镜是"被动卷入"的，体现饕餮的恐怖和不可逃避',
    idlePresenceDetails: '小G的表情充满恐惧，但眼神中有倔强——他不是懦夫，即使面对恐怖也不放弃。手指无意识地抓紧地面（本能的求生反应），身体被吸力拉扯但仍在挣扎',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '逃跑',
        description: '画面边缘，小G正在逃跑——他拼命奔跑，黄色冲锋衣在风中飘动，脸上充满恐惧。他在逃离某个恐怖的景象',
        visual: '小G拼命奔跑，黄色冲锋衣飘动，脸上恐惧',
        xiaoGAction: '拼命奔跑，双手摆动，脸上恐惧',
        camera: '镜头从饕餮的吞噬漩涡移向小G',
        soundHint: '奔跑的喘息声'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '被吸力拉回',
        description: '小G突然被一股强大的吸力拉回——他的身体向后倾斜，双脚在地面上滑行，双手试图抓住什么东西。他的表情从恐惧转为惊恐',
        visual: '小G被吸力拉回，身体后倾，双脚滑行，双手试图抓东西',
        xiaoGAction: '身体后倾，双脚滑行，双手试图抓东西，表情恐惧→惊恐',
        camera: '镜头跟随小G被拉回',
        soundHint: '吸力呼啸声'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '面对饕餮',
        description: '小G被拉到饕餮面前，停下脚步——他看着饕餮的巨口，表情从惊恐转为倔强。他咬紧牙关，不让自己叫出声',
        visual: '小G站在饕餮面前，表情倔强，咬紧牙关',
        xiaoGAction: '停下脚步，表情倔强，咬紧牙关',
        camera: '中景镜头，小G和饕餮同框',
        soundHint: '饕餮的吞噬底噪'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '不屈',
        description: '小G面对饕餮，缓缓站直身体——他的表情从倔强转为平静，甚至有一丝微笑（勇敢的探险家）。他缓缓伸出右手，向饕餮的方向',
        visual: '小G站直身体，表情平静，右手伸出',
        xiaoGAction: '站直身体，表情平静，右手伸出',
        camera: '特写镜头，小G的右手和饕餮的巨口',
        soundHint: '小G的心跳声（微弱但坚定）'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找饕餮，而是被吞噬漩涡卷入。他原本在逃跑，但被吸力拉回。他的表情从恐惧→惊恐→倔强→平静，展现勇敢探险家的不屈精神。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G逃跑',
      '5.0-6.0s': '小G被吸力拉回',
      '6.0-6.5s': '小G面对饕餮',
      '6.5-8.0s': '小G不屈'
    }
  };
}

// ==================== 通用入镜（未知神兽） ====================
function _designGenericXiaoGEntrance(beastId, beastInfo, templateId, episodeTheme, start, end) {
  const beastName = beastInfo?.name || beastId;
  
  return {
    beastId,
    beastName,
    entranceConcept: `小G不是主动来找${beastName}，而是被某种自然现象吸引——循着声音/光芒/震动好奇走近。他的入镜是"被吸引"的，体现${beastName}的神秘和吸引力`,
    idlePresenceDetails: '小G的表情充满好奇和敬畏，手指无意识地攥紧指南针挂绳，瞳孔因远处景象而收缩',
    phases: [
      {
        time: `${start.toFixed(1)}-${(start + 0.5).toFixed(1)}s`,
        name: '远处张望',
        description: `画面边缘，小G从远处探头张望——他被${beastName}的某种现象吸引（声音/光芒/震动），好奇地走近`,
        visual: '小G身影在画面边缘，探头张望',
        xiaoGAction: '探头张望，身体前倾',
        camera: '镜头从神兽移向小G',
        soundHint: '远处的声音'
      },
      {
        time: `${(start + 0.5).toFixed(1)}-${(start + 1.5).toFixed(1)}s`,
        name: '好奇走近',
        description: `小G向${beastName}方向走近——步伐轻快，眼神好奇`,
        visual: '小G向神兽方向走近',
        xiaoGAction: '快步行走，眼神好奇',
        camera: '镜头跟随小G',
        soundHint: '脚步声'
      },
      {
        time: `${(start + 1.5).toFixed(1)}-${(start + 2.0).toFixed(1)}s`,
        name: '面对神兽',
        description: `小G走到${beastName}面前，停下脚步，抬头仰望——表情从好奇转为敬畏`,
        visual: '小G站在神兽面前，表情敬畏',
        xiaoGAction: '停下脚步，抬头仰望，表情敬畏',
        camera: '中景镜头',
        soundHint: '神兽的环境底噪'
      },
      {
        time: `${(start + 2.0).toFixed(1)}-${end.toFixed(1)}s`,
        name: '伸手触碰',
        description: '小G缓缓伸出右手，向神兽的方向——想确认这是不是真的',
        visual: '小G右手伸出',
        xiaoGAction: '右手伸出',
        camera: '特写镜头',
        soundHint: '小G的呼吸声'
      }
    ],
    promptEnhancement: `小G的入镜必须自然且有原因——他不是主动来找${beastName}，而是被某种自然现象吸引，循着声音/光芒/震动好奇走近。他的表情从好奇→敬畏，最后伸手触碰。`,
    overallTimeline: {
      '0.0-0.5s': '纯黑画面，神兽声音开场白',
      '0.5-3.0s': '神兽震撼登场',
      '3.0-4.5s': '标题创意出现',
      '4.5-5.0s': '小G远处张望',
      '5.0-6.0s': '小G好奇走近',
      '6.0-6.5s': '小G面对神兽',
      '6.5-8.0s': '小G伸手触碰'
    }
  };
}

// ==================== 主导出 ====================
module.exports = {
  designXiaoGEntrance,
  _designXingtianXiaoGEntrance,
  _designZhulongXiaoGEntrance,
  _designJiuweihuXiaoGEntrance,
  _designDijiangXiaoGEntrance,
  _designBaizeXiaoGEntrance,
  _designQilinXiaoGEntrance,
  _designTaotieXiaoGEntrance,
  _designGenericXiaoGEntrance
};