#!/usr/bin/env node
/**
 * 批量生成神兽档案脚本
 * 从15万字原始档案中提取关键信息，生成标准化JSON档案
 */

const fs = require('fs');
const path = require('path');

// 引入通用部位表模块
const { BeastBodyPartSystem } = require('./beast-body-part-system.js');
const BEASTS_DATA = [
  {
    id: 'zhulong', name: '烛龙', no: 1, category: '创世神祇',
    summary: '人面蛇身而赤，直目正乘，身长千里',
    body: '赤红色蛇身绵延千里，横亘于北方极寒天地之间',
    head: '人的面容，眉目深邃，目光如炬',
    eyes: '双眼竖直生长，炯炯有神，开合之间决定昼夜交替',
    skin: '赤红色鳞片或皮肤，在黑暗中散发灼灼光华，如同永不熄灭的熔岩之火',
    special: '口中衔持火精，永恒燃烧的神圣火焰，照亮西北无日之处的幽暗世界',
    abilities: ['掌控昼夜', '主宰四季', '呼风唤雨', '烛照九幽', '化息为风', '千里龙身'],
    habitat: 'Nirath星球北极圈永夜裂谷',
    scale: '超巨型（千里级）'
  },
  {
    id: 'yinglong', name: '应龙', no: 2, category: '上古凶兽',
    summary: '有翼之龙，金黄色鳞甲，翼展数百米',
    body: '身躯覆满金黄色或青铜色的坚硬鳞甲，脊背处长有一排锋利的棘刺',
    head: '头部硕大而修长，吻部尖细如鳄，前额高高突起，眉弓隆起，双目炯炯如炬',
    eyes: '双目炯炯如炬，深邃如渊',
    skin: '金黄色或青铜色坚硬鳞甲，在阳光下折射彩虹光泽',
    special: '生有一双遮天蔽日的巨大羽翼，翼展可达数百米，半透明龙鳞薄膜构成',
    abilities: ['兴云作雨', '翻江倒海', '尾画成江', '斩妖除魔', '擒获无支祁', '水火双修'],
    habitat: 'Nirath星球赤道云雷高原',
    scale: '巨型（百米级）'
  },
  {
    id: 'fenghuang', name: '凤凰', no: 3, category: '百鸟之王',
    summary: '五彩而文，鸡头蛇颈，燕颌龟背',
    body: '体型比普通雄鸡大数倍，身姿挺拔优雅，颈项修长如天鹅，气度雍容华贵',
    head: '鸡头，头顶翎羽呈炽烈朱红色，如同一顶燃烧的皇冠',
    eyes: '深邃明亮，蕴含王者之气',
    skin: '五彩羽毛：头顶朱红、背羽金黄、翅膀翠绿、胸部玉白、尾羽彩虹渐变',
    special: '尾羽修长飘逸，呈现彩虹渐变色彩，每根尾羽末端有eye-shaped眼状斑纹',
    abilities: ['预示太平', '自歌自舞', '五德兼备', '翱翔四海', '浴火涅槃', '预知吉凶'],
    habitat: 'Nirath星球赤道丹穴山脉',
    scale: '大型（十米级）'
  },
  {
    id: 'qilin', name: '麒麟', no: 4, category: '仁德之兽',
    summary: '狮头鹿角，虎眼麋身，龙鳞牛尾，覆盖五彩鳞片',
    body: '身形矫健如鹿，体态修长优雅，步伐轻盈从容',
    head: '头部像龙又像羊，前额圆润饱满，生着一对狮子般的威武鬃毛',
    eyes: '温润如玉，透出仁慈之光',
    skin: '层层叠叠的五彩鳞片，每一片都如同精心雕琢的玉片，流转青赤黄白黑五色光芒',
    special: '头顶生有一对带肉的独角，角表面覆盖细密鳞片，散发温润玉质光泽',
    abilities: ['吐火鸣雷', '食害虫', '择土而践', '行步中规', '音中律吕', '预示圣人'],
    habitat: 'Nirath星球中纬度百兽草原',
    scale: '大型（十米级）'
  },
  {
    id: 'baize', name: '白泽', no: 5, category: '智慧神兽',
    summary: '浑身雪白，头生双角，双角间有淡蓝色电光闪动',
    body: '体型庞大如狮如虎，浑身覆盖雪白无瑕的柔软长毛，每一根毛发都凝聚着月光清辉',
    head: '头部生有一对硕大的犄角，呈优美弧线向后弯曲，角表面布满天然螺旋纹路',
    eyes: '双眼深邃如古潭、清透如水晶，智慧之光仿佛能看穿一切伪装与幻象',
    skin: '雪白皮毛中隐藏着淡青色神秘花纹，随情绪变化而明灭不定，仿佛活着的星图',
    special: '两角间隐隐有淡蓝色电光闪动，仿佛一个小型的生物等离子场',
    abilities: ['通晓万物', '能言人语', '预知未来', '辟邪纳福', '辨识精怪', '智慧传承'],
    habitat: 'Nirath星球南半球智慧之峰',
    scale: '大型（十米级）'
  },
  {
    id: 'taotie', name: '饕餮', no: 6, category: '四大凶兽',
    summary: '羊身人面，目在腋下，虎齿人爪，有首无身',
    body: '主体是一具羊身或牛身，庞大壮硕，皮肤呈现死灰色或暗褐色，散发着腐败气息',
    head: '一张极度扭曲变形的人脸，充满贪婪与暴虐的表情，眼睛生在腋下',
    eyes: '双眼生在腋下，两大团凸出的眼球在腋窝里诡异转动，透出饥饿的凶光',
    skin: '头颅占了身体一半以上，身体其余部分日渐萎缩，因为贪欲无度把自己身体都吃掉了',
    special: '发出婴儿般的啼哭声引诱路人靠近，然后张开血盆大口将其吞噬',
    abilities: ['吞噬万物', '行动迅疾', '迷惑人心', '贪食无厌', '自我吞噬', '无限食欲'],
    habitat: 'Nirath星球北纬钩吾废墟',
    scale: '大型（十米级）'
  },
  {
    id: 'qiongqi', name: '穷奇', no: 7, category: '四大凶兽',
    summary: '状如虎，有翼，食人从头始，善恶颠倒',
    body: '大小如牛犊，外貌如同凶猛斑纹猛虎，浑身皮毛深灰与黑色相间条纹',
    head: '外貌像虎，头部硕大，目光凶残',
    eyes: '铜铃般的双眼中燃烧着暴虐与疯狂的火焰',
    skin: '每一根毛发都坚硬如钢针，刀剑砍上去只会发出金属般的碰撞声',
    special: '生有一双巨大的翅膀，翼展可达十数米，翼膜呈半透明暗红色，布满粗大血管',
    abilities: ['飞行', '食人', '知人言语', '善恶颠倒', '蛊惑人心', '驱邪食蛊'],
    habitat: 'Nirath星球西半球邽山裂谷带',
    scale: '大型（十米级）'
  },
  {
    id: 'hundun', name: '混沌', no: 8, category: '四大凶兽',
    summary: '状如黄囊，赤如丹火，六足四翼，浑敦无面目',
    body: '整体形状像个巨大的黄色口袋，直径约有数丈，全身赤红色如同凝固的丹火',
    head: '完全没有面目——没有眼睛、鼻子、嘴巴、耳朵，面部只是一片光滑的赤红色皮肤',
    eyes: '无目，却能 mysteriously 给人一种它在看着你的错觉',
    skin: '炽烈的赤红色，如同一团凝固的丹火，在黑暗中散发着温暖而诡异的红光',
    special: '没有五官，却懂得歌舞——歌声从身体内部发出，舞蹈是六足四翼的协调运动',
    abilities: ['识歌舞', '混沌之力', '善恶颠倒', '无形之体', '时空穿梭', '虚空无为'],
    habitat: 'Nirath星球核心区域天山空洞',
    scale: '巨型（百米级）'
  },
  {
    id: 'taowu', name: '梼杌', no: 9, category: '四大凶兽',
    summary: '状如虎而犬毛，长二尺，人面，虎足，猪口牙，尾长一丈八尺',
    body: '主体像老虎，体型庞大壮硕，浑身覆盖长达二尺的狗毛，粗硬如鬃，根根倒竖',
    head: '在那具虎躯之上，赫然长着一张人脸——充满倔强、叛逆和暴虐之气',
    eyes: '双目圆睁如火炭，嘴角永远向下撇着，仿佛对整个世界充满不屑与愤怒',
    skin: '虎身覆盖灰褐色狗毛，长达二尺，根根倒竖如钢针',
    special: '尾巴长达一丈八尺（约5.4米），几乎有身长的九倍，粗如人的大腿',
    abilities: ['力量强大', '搅乱荒野', '顽固不化', '挑拨作恶', '不分善恶', '长尾鞭击'],
    habitat: 'Nirath星球北半球三危荒原',
    scale: '中型（米级）'
  },
  {
    id: 'jiuweihu', name: '九尾狐', no: 10, category: '亦正亦邪',
    summary: '状如狐而九尾，其音如婴儿，能食人',
    body: '体型比普通狐狸大上数倍，身长可达丈余，姿态优雅灵动，行动时如行云流水',
    head: '面部比凡狐更加精致，轮廓如美人般秀美，嘴角微微上扬',
    eyes: '深邃的琥珀色或妖异的碧绿色，瞳孔在黑暗中会发出微光，仿佛两颗宝石',
    skin: '全身覆盖浓密柔滑的毛发，上古时期多为纯白色，如雪似玉',
    special: '九条尾巴从臀部优雅地散开，如同一把华丽的羽毛扇，每条都修长蓬松',
    abilities: ['魅惑人心', '通灵变化', '预知未来', '辟邪驱毒', '长寿延年', '食人'],
    habitat: 'Nirath星球东半球青丘群岛',
    scale: '中型（米级）'
  }
];

// 生成JSON档案（含部位表）
function generateArchive(beastData) {
  // 构建完整描述文本，用于部位表解析
  const fullDescription = [
    beastData.body,
    beastData.head,
    beastData.eyes,
    beastData.skin,
    beastData.special
  ].filter(Boolean).join('。');
  
  // 使用通用模块生成部位表
  const system = new BeastBodyPartSystem();
  const extracted = system._extractFeaturesFromText(fullDescription);
  
  return {
    id: beastData.id,
    name: beastData.name,
    nameEn: beastData.id.charAt(0).toUpperCase() + beastData.id.slice(1),
    category: beastData.category,
    no: beastData.no,
    origin: '《山海经》',
    appearance: {
      summary: beastData.summary,
      fullDescription: fullDescription,
      body: beastData.body,
      head: beastData.head,
      eyes: beastData.eyes,
      skin: beastData.skin,
      special: beastData.special
    },
    bodyParts: {
      version: 'v1.0-Peng',
      generatedAt: new Date().toISOString(),
      parts: extracted.parts,
      extension: extracted.extension,
      aura: extracted.aura
    },
    abilities: beastData.abilities,
    habitat: {
      location: beastData.habitat,
      climate: '待定',
      features: '待定'
    },
    story: '待定',
    symbolism: '待定',
    visualStyle: '待定',
    cinema: {
      scale: beastData.scale || '大型（十米级）',
      recommendedShots: ['medium', 'wide'],
      lighting: '自然光',
      effects: ''
    }
  };
}

// 主函数
function main() {
  const archiveDir = path.join(__dirname, '../skills/shanhaijing-beast-archive/beasts');
  
  // 确保目录存在
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  let generated = 0;
  
  for (const beast of BEASTS_DATA) {
    const archive = generateArchive(beast);
    const filePath = path.join(archiveDir, `${beast.id}.json`);
    
    // 检查是否已存在
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  跳过已存在: ${beast.name}`);
      continue;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(archive, null, 2), 'utf-8');
    console.log(`✅ 生成档案: ${beast.name} (${beast.id}.json)`);
    generated++;
  }
  
  console.log(`\n🎉 批量生成完成: ${generated} 只神兽档案`);
  console.log(`📁 档案目录: ${archiveDir}`);
}

main();