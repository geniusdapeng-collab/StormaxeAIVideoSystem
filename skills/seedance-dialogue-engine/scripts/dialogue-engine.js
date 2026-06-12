#!/usr/bin/env node
/**
 * Seedance Dialogue Engine — 台词对白引擎 v2.0.0-Peng
 * 
 * 🎯 核心功能：
 * 1. 为每个镜头设计台词对白（基于剧情和角色）
 * 2. 角色音色映射（每个角色绑定 TTS voice）
 * 3. 调用 edge-tts 生成角色对白音频
 * 4. 为 Seedance 渲染准备音频参考文件
 * 
 * 用法:
 *   node dialogue-engine.js design --story-plan <plan.json> --output-dir <dir>
 *   node dialogue-engine.js tts --dialogue-file <dialogue.json> --output-dir <dir>
 *   node dialogue-engine.js full --story-plan <plan.json> --output-dir <dir>
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ============ 角色音色映射表 ============
const VOICE_PRESETS = {
  // 女声
  female_warm:     { voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', pitch: '+0Hz', desc: '温暖女声（通用女主）' },
  female_lively:   { voice: 'zh-CN-XiaoyiNeural',   rate: '+5%', pitch: '+5Hz', desc: '活泼女声（少女/可爱）' },
  female_regional: { voice: 'zh-CN-liaoning-XiaobeiNeural', rate: '+3%', pitch: '+3Hz', desc: '东北女声（方言喜剧）' },
  female_northern: { voice: 'zh-CN-shaanxi-XiaoniNeural', rate: '+2%', pitch: '+2Hz', desc: '陕北方言（质朴）' },
  // 男声
  male_professional: { voice: 'zh-CN-YunyangNeural', rate: '+0%', pitch: '-2Hz', desc: '专业男声（新闻/旁白）' },
  male_lively:     { voice: 'zh-CN-YunxiNeural',    rate: '+3%', pitch: '+0Hz', desc: '活泼男声（青年男主）' },
  male_passion:    { voice: 'zh-CN-YunjianNeural',  rate: '+5%', pitch: '-3Hz', desc: '激情男声（战斗/热血）' },
  male_cute:       { voice: 'zh-CN-YunxiaNeural',   rate: '+8%', pitch: '+8Hz', desc: '可爱男声（童声/动漫）' },
  // 旁白
  narrator:        { voice: 'zh-CN-YunyangNeural',  rate: '-5%', pitch: '-3Hz', desc: '旁白（沉稳专业）' },
  narrator_female: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-3%', pitch: '-2Hz', desc: '女旁白（温柔叙述）' },
};

// ============ 对白模板库 ============
const DIALOGUE_TEMPLATES = {
  action: {
    '建置': [
      { type: 'narration', text: '' }, // 动态生成
    ],
    '触发': [
      { type: 'dialogue', speaker: 0, text: '什么？这不可能！' },
      { type: 'dialogue', speaker: 1, text: '我们必须立刻行动！' },
    ],
    '对抗': [
      { type: 'dialogue', speaker: 0, text: '来吧，让我看看你的本事！' },
      { type: 'dialogue', speaker: 1, text: '你以为这样就能赢我？' },
      { type: 'sfx', text: '（金属碰撞声）' },
    ],
    '高潮前': [
      { type: 'narration', text: '' },
    ],
    '终极': [
      { type: 'dialogue', speaker: 0, text: '这一击，为了所有相信我的人！' },
      { type: 'sfx', text: '（能量爆发声）' },
    ],
  },
  drama: {
    '日常建置': [
      { type: 'dialogue', speaker: 0, text: '今天天气真好，要不要一起出去走走？' },
    ],
    '关系铺垫': [
      { type: 'dialogue', speaker: 0, text: '你还记得我们第一次见面的时候吗？' },
      { type: 'dialogue', speaker: 1, text: '当然记得，那时候你可真傻。' },
      { type: 'dialogue', speaker: 0, text: '（笑）是啊，那时候我们都还年轻。' },
    ],
    '冲突萌芽': [
      { type: 'dialogue', speaker: 0, text: '你为什么不告诉我？' },
      { type: 'dialogue', speaker: 1, text: '我以为...不说会更好。' },
    ],
    '情感升级': [
      { type: 'dialogue', speaker: 0, text: '你知道吗，我一直在等你。' },
      { type: 'dialogue', speaker: 1, text: '对不起，让你等了这么久。' },
    ],
    '情绪高潮': [
      { type: 'dialogue', speaker: 0, text: '不管怎样，我都不会放弃！' },
      { type: 'narration', text: '{character}的眼中闪着泪光，声音微微颤抖...' },
    ],
    '抉择时刻': [
      { type: 'narration', text: '{character}沉默了很久，终于开口...' },
      { type: 'dialogue', speaker: 0, text: '我选择...相信你。' },
    ],
    '余韵留白': [
      { type: 'narration', text: '风轻轻吹过，树叶沙沙作响。一切，才刚刚开始...' },
    ],
  },
  educational: {
    '问题呈现': [
      { type: 'narration', text: '关键时刻，有人突然双手捂喉，面色发紫——这是窒息的信号！' },
      { type: 'dialogue', speaker: 1, text: '救命...我...喘不上气...' },
    ],
    '场景建置': [
      { type: 'narration', text: '遇到这种情况，正确的急救方法能救命。今天我们演示海姆立克急救法的标准操作。' },
    ],
    '步骤演示': [
      { type: 'narration', text: '第一步：施救者站到患者身后，双脚前后分开保持稳定，双臂从背后环抱患者腰部。' },
      { type: 'dialogue', speaker: 0, text: '先站稳，从背后环抱，重心放低。' },
    ],
    '关键动作': [
      { type: 'narration', text: '核心动作——剪刀石头布定位法：剪刀定位肚脐上方，石头握拳，布包住拳头。' },
      { type: 'dialogue', speaker: 0, text: '记住口诀：剪刀、石头、布！拳头放在肚脐上方。' },
    ],
    '特写放大': [
      { type: 'narration', text: '放大看——手掌根部紧贴腹部，拇指关节对准肚脐与胸骨之间的冲击点。' },
    ],
    '效果展示': [
      { type: 'dialogue', speaker: 0, text: '向后向上用力冲击！一次不够就连续做！' },
      { type: 'narration', text: '异物排出，患者恢复呼吸——海姆立克急救法操作成功！' },
    ],
    '对比验证': [
      { type: 'narration', text: '左边是正确手法：向后向上冲击。右边是常见错误：按压胸部或拍背——这都可能让异物更深入。' },
    ],
    '总结回顾': [
      { type: 'narration', text: '回顾三步走：一、站位环抱；二、剪刀石头布定位；三、向后向上冲击。' },
      { type: 'dialogue', speaker: 0, text: '记住口诀：站位、定位、冲击。关键时刻能救命！' },
    ],
    '正确示范': [
      { type: 'narration', text: '完整流程再来一遍：站位环抱→剪刀石头布定位→向后向上冲击，一气呵成。' },
    ],
    '收尾定格': [
      { type: 'narration', text: '海姆立克急救法，关键时刻别犹豫，该出手就出手。' },
    ],
  },
  commercial: {
    '痛点呈现': [
      { type: 'narration', text: '你是否也遇到过这样的困扰？' },
      { type: 'dialogue', speaker: 0, text: '这东西真的太烦人了...' },
    ],
    '产品亮相': [
      { type: 'narration', text: '现在，一切都不一样了。' },
      { type: 'dialogue', speaker: 0, text: '这是什么？太神奇了吧！' },
    ],
    '功能展示': [
      { type: 'narration', text: '只需轻轻一点，就能...' },
      { type: 'dialogue', speaker: 0, text: '真的假的？这也太方便了吧！' },
    ],
    '行动号召': [
      { type: 'narration', text: '现在行动，享受专属优惠。' },
      { type: 'dialogue', speaker: 0, text: '你还在等什么？' },
    ],
  },
  documentary: {
    '环境建置': [
      { type: 'narration', text: '这里是{location}，一个被时间遗忘的角落。' },
    ],
    '人物登场': [
      { type: 'dialogue', speaker: 0, text: '我在这里生活了{years}年了，这里就是我的家。' },
    ],
    '事件展开': [
      { type: 'narration', text: '然而，平静的水面下，暗流涌动。' },
    ],
    '深度揭示': [
      { type: 'dialogue', speaker: 0, text: '很多人不知道，其实背后是这样的...' },
    ],
    '总结升华': [
      { type: 'narration', text: '这不仅是一个故事，更是一代人的缩影。' },
    ],
  },
};

// ============ 工具函数 ============
function log(section, msg, level = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const prefix = `[${timestamp}] [${section}]`;
  const icon = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', phase: '🎬', progress: '⏳' }[level] || 'ℹ️';
  console.log(`${icon} ${prefix} ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(text, vars = {}) {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] || key);
}

// ============ 解析命令行参数 ============
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const rawKey = process.argv[i];
    if (!rawKey.startsWith('--')) {
      // 🆕 捕获位置命令（full/design/tts）
      args.command = rawKey;
      continue;
    }
    let key = rawKey.replace(/^--/, '');
    key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = process.argv[i + 1];
    if (value && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  // 🆕 将 command 映射到 args.full/args.design/args.tts
  if (args.command === 'full') args.full = true;
  if (args.command === 'design') args.design = true;
  if (args.command === 'tts') args.tts = true;
  return args;
}

// ============ 动态旁白生成器 v2.0.0-Peng
// 根据 outline、角色、镜头描述生成贴合剧情的旁白，不再用万金油模板

function generateNarration(shot, videoType, characterNames, outline, usedNarrations) {
  const actName = shot.act || '';
  const shotType = shot.type || '';
  const charName = (shot.characters && shot.characters.length > 0) ? shot.characters[0] : (characterNames[0] || '主角');
  const allChars = characterNames.filter(Boolean).length > 1 ? characterNames.join('与') : charName;
  
  // 从 outline 提取关键元素
  const outlineElements = extractOutlineElements(outline);
  
  // 旁白模板库（按类型+幕分类）
  const narrationPool = getNarrationPool(videoType, actName, shotType, outlineElements, charName, allChars);
  
  // 避免重复
  for (let attempt = 0; attempt < narrationPool.length; attempt++) {
    const text = narrationPool[attempt];
    if (!usedNarrations.has(text)) {
      usedNarrations.add(text);
      return text;
    }
  }
  
  // 🆕 所有模板都用过？用多样化 fallback
  const fallbacks = [
    `${charName}的身影在光影中渐渐清晰，故事还在继续...`,
    `一切尚未可知，${charName}继续前行。`,
    `${charName}的脚步不停，前方还有更多考验。`,
    `暗流涌动之中，${charName}保持着警惕。`,
    `${allChars}的命运交织，故事走向未知。`,
    `每一秒都在变化，${charName}必须做出选择。`,
    `${charName}深吸一口气，迎接下一轮挑战。`,
    `局势尚未明朗，${charName}继续观察。`,
    `这一刻的平静，预示着更大的风暴。`,
    `${charName}的目光坚定，不再犹豫。`,
  ];
  for (const fb of fallbacks) {
    if (!usedNarrations.has(fb)) {
      usedNarrations.add(fb);
      return fb;
    }
  }
  // 最后手段：加序号区分
  const idx = usedNarrations.size;
  const lastFallback = `${charName}的旅程仍在继续，第${idx}幕。`;
  usedNarrations.add(lastFallback);
  return lastFallback;
}

// 从 outline 提取关键名词/动词用于旁白定制
function extractOutlineElements(outline) {
  if (!outline || outline.length < 10) return { scene: '', event: '', mood: '', objects: [] };
  
  // 场景词
  const sceneWords = ['花果山', '森林', '城市', '太空', '深海', '战场', '废墟', '山谷', '荒原', '大海', '雪山', '古庙', '庭院', '实验室', '医院', '学校', '家'];
  // 事件词
  const eventWords = ['入侵', '风暴', '发现', '相遇', '离别', '重逢', '战斗', '对决', '觉醒', '牺牲', '拯救', '逃离', '追逐', '守护', '约定', '告白'];
  // 情绪词
  const moodWords = ['愤怒', '悲伤', '希望', '恐惧', '决心', '温柔', '紧张', '激动', '平静', '释然'];
  // 物品词
  const objectWords = ['光芒', '火焰', '雷电', '风暴', '剑', '盾', '武器', '信物', '秘密', '宝藏'];
  
  return {
    scene: sceneWords.find(w => outline.includes(w)) || '',
    event: eventWords.find(w => outline.includes(w)) || '',
    mood: moodWords.find(w => outline.includes(w)) || '',
    objects: objectWords.filter(w => outline.includes(w)),
  };
}

// 根据上下文生成旁白池
function getNarrationPool(videoType, actName, shotType, outlineEls, charName, allChars) {
  const scene = outlineEls.scene;
  const event = outlineEls.event;
  const mood = outlineEls.mood;
  const obj = outlineEls.objects[0] || '';
  
  const pools = {
    action: {
      '起': {
        '建置': [
          scene ? `${scene}之上，风云暗涌。${charName}伫立原地，感知着即将到来的风暴...` : `${charName}伫立在暗影中，感知着即将到来的风暴...`,
          event ? `${event}的阴影正缓缓逼近，${charName}握紧拳头，目光如炬。` : `${charName}握紧拳头，目光扫视四周，空气中弥漫着紧张的气息。`,
          obj ? `${obj}在暗处闪烁，预示着不平静的一夜。${charName}深吸一口气，进入戒备。` : `夜色渐深，${charName}进入戒备状态，每一根神经都在绷紧。`,
          `风从远方吹来，带来危险的气息。${charName}知道，平静的日子到此为止了。`,
        ],
        '触发': [
          event ? `${event}的导火索被点燃了——${charName}瞳孔骤缩，形势急转直下。` : `突如其来的变故打破了宁静，${charName}瞬间进入战斗状态。`,
          `一声巨响撕裂天际，${charName}猛然回头，眼神凌厉。`,
          `一切发生得太快——${charName}的大脑飞速运转，判断着下一步行动。`,
        ],
        '反应': [
          mood ? `${charName}心中涌起${mood}，但很快压下情绪，强迫自己冷静。` : `${charName}咬紧牙关，将恐惧转化为力量。`,
          `${charName}的眼神从震惊变为坚定——退路已断，唯有向前。`,
        ],
        '准备': [
          obj ? `${charName}检查手中的${obj}，确认一切就绪。这一战，没有退路。` : `${charName}调整呼吸，积蓄力量，等待出击的最佳时机。`,
          `最后一片拼图归位——${charName}做好了一切准备。`,
        ],
      },
      '承': {
        '升级': [
          `交锋升级，${allChars}的碰撞激起阵阵气浪，每一击都比前一次更狠。`,
          event ? `${event}的烈度远超预期，双方都意识到这不是普通的较量。` : `局势急转直下，双方都亮出了真正的实力。`,
        ],
        '对抗': [
          `${allChars}正面交锋，拳脚之间火花四溅，谁也不肯退让半步。`,
          `这是意志的较量——${allChars}在硬碰硬中试探着对方的底线。`,
          scene ? `${scene}中回荡着碰撞的声响，战斗进入了白热化。` : `战斗进入了白热化，每一秒都在消耗体力。`,
        ],
        '转折': [
          `形势突变——局势朝着意想不到的方向发展。`,
          `谁也没料到，变数竟然来自这里。${charName}必须立刻做出判断。`,
        ],
      },
      '转': {
        '逼近': [
          `距离终极对决只剩一步之遥，${charName}的心跳越来越快。`,
          `空气中弥漫着决战前的压迫感，每一个动作都被无限放大。`,
        ],
        '高潮前': [
          obj ? `${charName}握紧${obj}，最后的准备已经完成——接下来，只有战斗。` : `${charName}闭上眼，在脑海中演练最后一击。接下来，只有战斗。`,
          `万籁俱寂——这是暴风雨前最后的宁静。`,
        ],
        '终极': [
          event ? `最终的${event}在此刻爆发，${allChars}的力量碰撞到极限。` : `终极碰撞——${allChars}倾尽全力，胜负在此一举。`,
          obj ? `${obj}爆发出最耀眼的光芒——这就是决胜的一瞬。` : `所有力量汇聚在这一刻，天地间只剩下碰撞的轰鸣。`,
        ],
      },
      '合': {
        '爆发': [
          `能量如潮水般炸开，冲击波横扫一切——胜负在这一刻揭晓。`,
          `最后的爆发，${charName}将所有信念凝聚成这一击。`,
        ],
        '结果': [
          `尘埃落定。${charName}缓缓放下手臂，一切已成定局。`,
          scene ? `${scene}恢复寂静，只剩下战斗的余痕。` : `硝烟散去，战场归于平静。`,
        ],
        '收束': [
          `${charName}转身离去，身后是战斗的遗迹。故事，还没结束。`,
          `一切归于平静，但${charName}知道，这只是一个开始。`,
        ],
        '定格': [
          `画面定格在${charName}的背影上——前路漫漫，战斗永不停歇。`,
          `最后一道光消散在天际，留下一个未完待续的故事。`,
        ],
      },
    },
    drama: {
      '起': {
        '日常建置': [
          scene ? `${scene}的清晨，阳光透过窗棂，照在${charName}平静的脸上。` : `晨光洒在窗台，${charName}开始了一个和往常一样的日子。`,
          `${charName}的日常生活看似平淡，但总有些小细节透着温暖。`,
        ],
        '关系铺垫': [
          `${allChars}之间的默契不需要语言——一个眼神就够了。`,
          `那些一起度过的小事，不知不觉间把两颗心拉得更近。`,
        ],
        '细节暗示': [
          `一个不经意的动作，一个躲闪的眼神——有些东西在暗处悄然变化。`,
          `${charName}没有说话，但沉默本身就是一种答案。`,
        ],
      },
      '承': {
        '冲突萌芽': [
          `空气里的温度突然降了下来。${charName}意识到，有些话迟早要说。`,
          `沉默比争吵更可怕——${charName}知道，问题不能再拖了。`,
          `一句话、一个表情，裂痕就在这不经意间产生了。`,
        ],
        '情感升级': [
          mood ? `${charName}再也压不住心中的${mood}，所有委屈涌了上来。` : `所有的情绪在这一刻决堤，${charName}再也装不下去了。`,
          `${charName}的声音在颤抖，不是因为生气，是因为在乎。`,
        ],
        '转折突变': [
          `意外来得太突然——${charName}愣在原地，半天没缓过神。`,
          `事情的发展完全偏离了预期，谁也没想到会是这样。`,
        ],
      },
      '转': {
        '情绪高潮': [
          `所有的忍耐到了极限。${charName}终于说出了那句藏在心里很久的话。`,
          `眼泪不是软弱，是积压太久的情绪终于找到了出口。`,
        ],
        '抉择时刻': [
          `${charName}站在十字路口，左边是理智，右边是心。`,
          `时间仿佛凝固了——${charName}必须做出选择，而且没有回头路。`,
        ],
        '真相揭示': [
          `真相大白的那一刻，所有的误解都烟消云散。`,
          `${charName}终于明白了——原来一直误会了最重要的事。`,
        ],
      },
      '合': {
        '情感释放': [
          `和解不需要太多话，一个拥抱就够了。`,
          `${charName}长长地出了一口气——压在心头的大石头终于落地了。`,
        ],
        '余韵留白': [
          `风轻轻吹过，一切归于平静。但有些东西，已经不一样了。`,
          `${charName}望着远方，嘴角微微上扬——明天会更好吧。`,
        ],
        '尾声定格': [
          `镜头拉远，${charName}的身影渐渐变小。故事到此，余味未尽。`,
          `阳光洒在肩上，新的一天开始了。`,
        ],
        '开放结局': [
          `没有结局的结局——${charName}还在路上，故事也还在继续。`,
        ],
      },
    },
    educational: {
      '起': {
        '问题呈现': [
          event ? `你是否也遇到过这样的困扰？${event}的难题让很多人头疼。` : `你是否也遇到过这样的困扰？关键时刻不知道该怎么办。`,
          `情况紧急，每一秒都很重要——正确的处理方法能救命。`,
        ],
        '场景建置': [
          scene ? `让我们把场景切换到${scene}，在真实环境中演示标准操作。` : `接下来，我们将在标准环境中演示每一步操作。`,
          `好的学习环境是掌握技能的第一步。`,
        ],
        '人物引入': [
          `${charName}登场——今天将为大家演示标准操作流程。`,
        ],
      },
      '承': {
        '步骤演示': [
          `第一步，站稳位置——从背后环抱患者，双脚分开保持平衡。`,
          `注意手法：找到正确位置，双手交叠，准备发力。`,
        ],
        '关键动作': [
          `核心动作来了——快速向上冲击，力度要够，方向要准。`,
          `这一步是成败的关键，请大家仔细看手势的定位。`,
        ],
        '强调重复': [
          `再来一遍——记住口诀：剪刀、石头、布。位置不能错。`,
          `重复是记忆之母。关键动作再做一次，加深印象。`,
        ],
      },
      '转': {
        '特写放大': [
          `放大看——手掌根部紧贴腹部，拇指关节对准冲击点。`,
          `细节决定成败：角度偏一点，效果就差很多。`,
        ],
        '效果展示': [
          `看，异物排出来了！患者恢复呼吸，操作成功。`,
          `前后对比一目了然——正确的手法效果立竿见影。`,
        ],
        '对比验证': [
          `左边是正确手法，右边是常见错误——差别很明显。`,
        ],
      },
      '合': {
        '总结回顾': [
          `回顾一下：站位、定位、冲击。三步走，一气呵成。`,
          `记住口诀：剪刀石头布。关键时刻能救人一命。`,
        ],
        '正确示范': [
          `完整流程再来一遍——标准节奏，一气呵成。`,
        ],
        '收尾定格': [
          `技能get！关键时刻别犹豫，该出手就出手。`,
        ],
      },
    },
    commercial: {
      '起': {
        '痛点呈现': [
          event ? `${event}的烦恼，你是不是也经历过？` : `每天都在被这个问题困扰，你是不是也受够了？`,
          `忙了一整天，回到家发现还有一堆麻烦等着你。`,
        ],
        '吸引力钩子': [
          `但如果有一种方法，能让这一切变得简单呢？`,
          `转机，往往就在意想不到的地方。`,
        ],
        '产品亮相': [
          scene ? `${scene}里走出的新选择——它就是今天的主角。` : `它来了——改变规则的产品，终于登场。`,
        ],
      },
      '承': {
        '功能展示': [
          `看好了——只需要三步，问题迎刃而解。`,
          `每一个功能，都是为了解决你的实际痛点而设计。`,
        ],
        '优势对比': [
          `和传统方案比，它省时一半——这不是吹牛，是实打实的数据。`,
          `同样的价格，更多的功能，这就是差距。`,
        ],
        '场景应用': [
          `无论是在家还是在外，它都能派上用场。`,
          `真实使用场景——不是摆拍，是日常。`,
        ],
      },
      '转': {
        '效果验证': [
          `数据不说谎——满意度提升87%，这可不是小数字。`,
          `用过的人都说好——看看他们的真实反馈。`,
        ],
        '用户见证': [
          `"用了一次就回不去了"——这是最真实的评价。`,
        ],
        '价值升华': [
          `这不仅是一件产品，更是一种生活态度。`,
          `从功能到理念，它重新定义了"好用"的标准。`,
        ],
      },
      '合': {
        '行动号召': [
          `现在就是最好的时机——限时优惠，错过就没有了。`,
        ],
        '品牌定格': [
          `好产品，用过就知道。你的选择，值得更好的。`,
        ],
        '记忆锚点': [
          `记住这个名字——它会让你的生活变得不一样。`,
        ],
        '结尾冲击': [
          `最后给你看个大招——准备好了吗？`,
        ],
      },
    },
    documentary: {
      '起': {
        '环境建置': [
          scene ? `${scene}——一个被大多数人遗忘的角落，却藏着动人的故事。` : `在城市的边缘，有这样一群人，过着不一样的生活。`,
          `镜头记录的，不只是风景，还有岁月留下的痕迹。`,
        ],
        '主题引入': [
          `今天我们要讲的，是一个关于${event || '坚守'}的故事。`,
          `故事从这里开始——平凡，但不普通。`,
        ],
        '人物登场': [
          `${charName}在这里已经生活了很多年，每一天都重复着同样的节奏。`,
        ],
      },
      '承': {
        '事件展开': [
          `平静的水面下，暗流涌动——事情并不像表面那么简单。`,
          `随着时间的推移，故事有了新的发展。`,
        ],
        '细节挖掘': [
          `镜头拉近——粗糙的双手，满是老茧。这双手做了多少事。`,
          `细节里藏着真相，只有放慢脚步才能看见。`,
        ],
        '视角切换': [
          `换一个人看同样的事，感受完全不同。`,
        ],
      },
      '转': {
        '冲突浮现': [
          `矛盾出现了——理想和现实之间的差距比想象中大。`,
          `问题摆在了桌面上，没有人能回避。`,
        ],
        '深度揭示': [
          `真相远比表面复杂——背后的原因让人深思。`,
          `当我们走进幕后才发现，事情远不止看到的那样。`,
        ],
        '情感冲击': [
          `这一幕让人沉默——真实的力量，胜过千言万语。`,
        ],
      },
      '合': {
        '总结升华': [
          `故事讲到这里，答案已经不重要了——重要的是思考。`,
          `${event || '这段经历'}告诉我们：生活比想象的复杂，也比想象的坚韧。`,
        ],
        '反思留白': [
          `如果你是故事里的人，你会怎么做？`,
          `没有标准答案——但问题本身就有意义。`,
        ],
        '余韵定格': [
          `太阳落下又升起，日子还在继续。`,
        ],
        '开放式收束': [
          `故事没有句号——因为生活本身就是未完成的。`,
        ],
      },
    },
  };
  
  return pools[videoType]?.[actName]?.[shotType] ||
    pools[videoType]?.[actName]?.[Object.keys(pools[videoType]?.[actName] || {})[0]] ||
    [`${charName}的故事，还在继续...`];
}

// ============ 功能 1: 台词设计 ============
function designDialogue(storyPlan, args = {}) {
  log('DialogueDesign', `开始设计台词: ${storyPlan.title}`, 'phase');
  
  const videoType = storyPlan.videoType || 'commercial';
  const outline = storyPlan.outline || '';
  const outlineElements = extractOutlineElements(outline);
  const scene = outlineElements.scene;
  const templates = DIALOGUE_TEMPLATES[videoType] || DIALOGUE_TEMPLATES.action;
  const characterNames = (storyPlan.characters || ['角色A', '角色B']).map(c => {
    // 🆕 去掉 ID 前缀（C01-男主 → 男主），支持多种格式
    if (c.includes('-')) {
      const parts = c.split('-');
      return parts.length === 2 ? parts[1] : parts.slice(1).join('-');
    }
    return c;
  });
  
  // 🆕 v2.0: 全局旁白去重集合
  const usedNarrations = new Set();
  
  const dialogueScript = {
    title: storyPlan.title,
    videoType,
    characters: characterNames,
    shots: [],
    totalLines: 0,
    totalNarrations: 0,
    totalSfx: 0,
  };
  
  for (const shot of storyPlan.shots) {
    const shotType = shot.type || '';
    const shotTemplates = templates[shotType] || [];
    
    // 生成台词
    const lines = [];
    const fillVars = {
      character: characterNames[0] || '主角',
      location: scene || '远方',
      years: randomInt(10, 50),
    };
    
    // 判断是否需要生成旁白（没有模板模板或模板text为空时动态生成）
    const hasNarrationTemplate = shotTemplates.some(t => t.type === 'narration' && t.text && t.text.trim());
    
    for (const tmpl of shotTemplates) {
      const line = {
        type: tmpl.type,
        text: '',
        duration: Math.max(1, Math.floor(shot.duration / (shotTemplates.length || 1))),
      };
      
      if (tmpl.type === 'narration') {
        if (hasNarrationTemplate && tmpl.text) {
          // 有固定模板，用模板填充
          line.text = fillTemplate(tmpl.text, fillVars);
        } else {
          // 🆕 v2.0: 用动态旁白生成器生成贴合剧情的旁白
          line.text = generateNarration(shot, videoType, characterNames, outline, usedNarrations);
        }
        dialogueScript.totalNarrations++;
      } else if (tmpl.type === 'dialogue') {
        line.text = tmpl.text || '';
        line.speakerIndex = tmpl.speaker;
        line.speakerName = characterNames[tmpl.speaker % characterNames.length] || '角色A';
        dialogueScript.totalLines++;
      } else if (tmpl.type === 'sfx') {
        line.text = tmpl.text || '';
        dialogueScript.totalSfx++;
      }
      
      lines.push(line);
    }
    
    // 🆕 v2.0: 没有任何模板的镜头类型，用动态旁白填充
    if (shotTemplates.length === 0) {
      const narrationText = generateNarration(shot, videoType, characterNames, outline, usedNarrations);
      lines.push({
        type: 'narration',
        text: narrationText,
        duration: shot.duration,
      });
      dialogueScript.totalNarrations++;
    }
    
    dialogueScript.shots.push({
      shotId: shot.id,
      act: shot.act,
      timeRange: shot.timeRange,
      lines,
    });
  }
  
  log('DialogueDesign', `台词设计完成: ${dialogueScript.totalLines}句对白, ${dialogueScript.totalNarrations}段旁白, ${dialogueScript.totalSfx}个音效`, 'success');
  return dialogueScript;
}

// ============ 功能 2: 角色音色配置 ============
function assignVoices(characters, videoType = 'action') {
  log('VoiceAssign', `为 ${characters.length} 个角色分配音色`, 'progress');
  
  // 根据视频类型和角色位置自动分配音色
  const defaultAssignments = {
    action: [
      { index: 0, preset: 'male_lively', desc: '男主（热血青年）' },
      { index: 1, preset: 'female_warm', desc: '女主（温暖坚定）' },
      { index: 2, preset: 'male_passion', desc: '反派（霸气低沉）' },
    ],
    drama: [
      { index: 0, preset: 'male_lively', desc: '男主（深情）' },
      { index: 1, preset: 'female_warm', desc: '女主（温柔）' },
      { index: 2, preset: 'female_lively', desc: '女配（活泼）' },
    ],
    educational: [
      { index: 0, preset: 'male_professional', desc: '讲师（专业）' },
      { index: 1, preset: 'female_lively', desc: '学生/助手（活泼）' },
    ],
    commercial: [
      { index: 0, preset: 'male_lively', desc: '男用户（惊喜）' },
      { index: 1, preset: 'female_warm', desc: '女用户（满意）' },
    ],
    documentary: [
      { index: 0, preset: 'narrator', desc: '旁白（沉稳）' },
      { index: 1, preset: 'female_warm', desc: '受访者（质朴）' },
    ],
  };
  
  const assignments = defaultAssignments[videoType] || defaultAssignments.action;
  const voiceConfig = [];
  
  for (let i = 0; i < characters.length; i++) {
    const assign = assignments[i] || { index: i, preset: 'male_lively', desc: `角色${i+1}` };
    const preset = VOICE_PRESETS[assign.preset];
    voiceConfig.push({
      characterIndex: i,
      characterName: characters[i] || `角色${i+1}`,
      voice: preset.voice,
      rate: preset.rate,
      pitch: preset.pitch,
      preset: assign.preset,
      description: assign.desc,
    });
  }
  
  log('VoiceAssign', `音色分配完成:`, 'success');
  for (const vc of voiceConfig) {
    log('VoiceAssign', `  ${vc.characterName} → ${vc.voice} (${vc.description})`, 'info');
  }
  
  return voiceConfig;
}

// ============ 功能 3: TTS 语音生成 ============
async function generateTTS(dialogueScript, voiceConfig, outputDir) {
  log('TTS', `开始生成语音: ${dialogueScript.title}`, 'phase');
  
  ensureDir(outputDir);
  ensureDir(path.join(outputDir, 'dialogue'));
  ensureDir(path.join(outputDir, 'narration'));
  
  const ttsManifest = {
    title: dialogueScript.title,
    totalAudioFiles: 0,
    files: [],
  };
  
  // 构建角色音色映射
  const voiceMap = {};
  for (const vc of voiceConfig) {
    voiceMap[vc.characterIndex] = vc;
  }
  
  // 遍历每个镜头的每句台词
  for (const shot of dialogueScript.shots) {
    ensureDir(path.join(outputDir, 'dialogue', shot.shotId));
    
    for (let i = 0; i < shot.lines.length; i++) {
      const line = shot.lines[i];
      const filename = `${shot.shotId}_line${String(i+1).padStart(2,'0')}`;
      
      if (line.type === 'dialogue') {
        // 对白
        const vc = voiceMap[line.speakerIndex] || voiceConfig[0];
        const outputPath = path.join(outputDir, 'dialogue', shot.shotId, `${filename}_${vc.voice.split('-')[2]}.mp3`);
        
        await generateSingleTTS(line.text, vc, outputPath);
        ttsManifest.files.push({
          shotId: shot.shotId,
          lineIndex: i,
          type: 'dialogue',
          speaker: vc.characterName,
          voice: vc.voice,
          text: line.text,
          outputPath,
          filename: path.basename(outputPath),
        });
        ttsManifest.totalAudioFiles++;
        
      } else if (line.type === 'narration') {
        // 旁白（默认用 narrator preset）
        const narratorPreset = VOICE_PRESETS.narrator;
        const narratorConfig = {
          voice: narratorPreset.voice,
          rate: narratorPreset.rate,
          pitch: narratorPreset.pitch,
        };
        const outputPath = path.join(outputDir, 'narration', `${filename}_${shot.shotId}.mp3`);
        
        await generateSingleTTS(line.text, narratorConfig, outputPath);
        ttsManifest.files.push({
          shotId: shot.shotId,
          lineIndex: i,
          type: 'narration',
          text: line.text,
          outputPath,
          filename: path.basename(outputPath),
        });
        ttsManifest.totalAudioFiles++;
      }
    }
  }
  
  // 保存清单
  fs.writeFileSync(path.join(outputDir, 'tts-manifest.json'), JSON.stringify(ttsManifest, null, 2));
  
  log('TTS', `语音生成完成: ${ttsManifest.totalAudioFiles} 个音频文件`, 'success');
  return ttsManifest;
}

async function generateSingleTTS(text, voiceConfig, outputPath) {
  const { voice, rate, pitch } = voiceConfig;
  
  // 使用 edge-tts 生成语音
  const cmd = `edge-tts --voice "${voice}" --rate=${rate} --pitch=${pitch} --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
  
  try {
    execSync(cmd, { timeout: 30000, stdio: 'pipe' });
    log('TTS', `  ✅ ${path.basename(outputPath)}: "${text.slice(0, 30)}..."`, 'success');
  } catch (e) {
    log('TTS', `  ❌ ${path.basename(outputPath)} 生成失败: ${e.message}`, 'error');
  }
}

// ============ 功能 4: 对白与 Seedance 对接 ============
function prepareAudioForSeedance(dialogueScript, ttsManifest, productionDir) {
  log('AudioPrep', '准备 Seedance 音频参考...', 'phase');
  
  const audioDir = path.join(productionDir, '06-dialogue-audio');
  ensureDir(audioDir);
  
  const audioManifest = {
    shots: {},
  };
  
  // 为每个镜头准备音频
  for (const shot of dialogueScript.shots) {
    const shotAudioDir = path.join(audioDir, shot.shotId);
    ensureDir(shotAudioDir);
    
    const audioFiles = [];
    
    // 查找该镜头的所有音频文件
    for (const file of ttsManifest.files) {
      if (file.shotId === shot.shotId) {
        const dstPath = path.join(shotAudioDir, file.filename);
        if (fs.existsSync(file.outputPath)) {
          fs.copyFileSync(file.outputPath, dstPath);
          audioFiles.push({
            type: file.type,
            speaker: file.speaker,
            text: file.text,
            path: dstPath,
            filename: file.filename,
          });
        }
      }
    }
    
    if (audioFiles.length > 0) {
      audioManifest.shots[shot.shotId] = {
        totalFiles: audioFiles.length,
        files: audioFiles,
        // 主要对白文件（用于 Seedance --audio-file）
        primaryAudio: audioFiles[0]?.path || null,
      };
    }
  }
  
  // 保存清单
  fs.writeFileSync(path.join(productionDir, '06-dialogue-audio-manifest.json'), JSON.stringify(audioManifest, null, 2));
  
  log('AudioPrep', `音频准备完成: ${Object.keys(audioManifest.shots).length} 个镜头有对白`, 'success');
  return audioManifest;
}

// ============ 主入口 ============
async function main() {
  const args = parseArgs();
  
  if (args.help || !args.storyPlan) {
    console.log(`
Seedance Dialogue Engine v2.0.0-Peng — 台词对白引擎

用法:
  node dialogue-engine.js design --story-plan <plan.json> [--output-dir <dir>]
  node dialogue-engine.js tts --story-plan <plan.json> --dialogue-file <dialogue.json> [--output-dir <dir>]
  node dialogue-engine.js full --story-plan <plan.json> [--output-dir <dir>]

命令:
  design      设计台词对白
  tts         生成语音（需要已有的 dialogue.json）
  full        完整流程：设计 + 生成语音 + 准备音频

选项:
  --story-plan    故事规划文件路径（story-plan.json）
  --dialogue-file 台词文件路径（可选）
  --output-dir    输出目录（默认自动）
  --help          显示此帮助

示例:
  node dialogue-engine.js full --story-plan "./01-story-plan.json"
    `);
    return;
  }
  
  const storyPlanPath = args.storyPlan;
  if (!fs.existsSync(storyPlanPath)) {
    console.error(`❌ 故事规划文件不存在: ${storyPlanPath}`);
    process.exit(1);
  }
  
  const storyPlan = JSON.parse(fs.readFileSync(storyPlanPath, 'utf8'));
  const outputDir = args.outputDir || path.dirname(storyPlanPath);
  ensureDir(outputDir);
  
  if (args.full || args.design) {
    // 1. 设计台词
    const dialogueScript = designDialogue(storyPlan, args);
    fs.writeFileSync(path.join(outputDir, 'dialogue-script.json'), JSON.stringify(dialogueScript, null, 2));
    
    // 生成 Markdown 台词本
    generateDialogueMarkdown(dialogueScript, outputDir);
    
    if (!args.full) return;
    
    // 2. 分配音色
    const voiceConfig = assignVoices(storyPlan.characters, storyPlan.videoType);
    fs.writeFileSync(path.join(outputDir, 'voice-config.json'), JSON.stringify(voiceConfig, null, 2));
    
    // 3. 生成 TTS
    await generateTTS(dialogueScript, voiceConfig, outputDir);
    
    // 4. 准备 Seedance 音频
    const ttsManifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'tts-manifest.json'), 'utf8'));
    const productionDir = path.dirname(storyPlanPath);
    prepareAudioForSeedance(dialogueScript, ttsManifest, productionDir);
    
    log('Full', '✅ 台词对白完整流程完成！', 'success');
    
  } else if (args.tts) {
    const dialogueFile = args.dialogueFile || path.join(outputDir, 'dialogue-script.json');
    if (!fs.existsSync(dialogueFile)) {
      console.error(`❌ 台词文件不存在: ${dialogueFile}`);
      process.exit(1);
    }
    
    const dialogueScript = JSON.parse(fs.readFileSync(dialogueFile, 'utf8'));
    const voiceConfig = assignVoices(storyPlan.characters, storyPlan.videoType);
    
    await generateTTS(dialogueScript, voiceConfig, outputDir);
  }
}

// 生成 Markdown 台词本
function generateDialogueMarkdown(dialogueScript, outputDir) {
  let md = `# ${dialogueScript.title} — 台词本\n\n`;
  md += `**视频类型**: ${dialogueScript.videoType}\n`;
  md += `**角色**: ${dialogueScript.characters.join('、')}\n`;
  md += `**总对白**: ${dialogueScript.totalLines} 句 | **旁白**: ${dialogueScript.totalNarrations} 段 | **音效**: ${dialogueScript.totalSfx} 个\n\n`;
  md += `---\n\n`;
  
  for (const shot of dialogueScript.shots) {
    md += `## ${shot.shotId}（${shot.act}幕，${shot.timeRange}）\n\n`;
    
    for (const line of shot.lines) {
      if (line.type === 'dialogue') {
        md += `🗣️ **${line.speakerName}**: "${line.text}"\n\n`;
      } else if (line.type === 'narration') {
        md += `🎙️ **旁白**: ${line.text}\n\n`;
      } else if (line.type === 'sfx') {
        md += `🔊 ${line.text}\n\n`;
      }
    }
    
    md += `---\n\n`;
  }
  
  fs.writeFileSync(path.join(outputDir, 'dialogue-script.md'), md);
  log('DialogueDesign', `台词本已保存: ${path.join(outputDir, 'dialogue-script.md')}`, 'success');
}

// 运行
main().catch(e => {
  console.error(`❌ 致命错误: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
