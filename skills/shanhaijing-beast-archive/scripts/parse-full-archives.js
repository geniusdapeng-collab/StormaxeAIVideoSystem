#!/usr/bin/env node
/**
 * 从15万字MD原始档案解析并生成完整JSON档案
 * 提取每只神兽的10个标准维度
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = '/root/.openclaw/media/inbound/å_æµ_ç_40ç_å_½å_¾é---a308f775-b0f1-4b77-a9e9-891ca8f6abad.md';
const OUTPUT_DIR = path.join(__dirname, '..', 'beasts');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 读取原始文件
const content = fs.readFileSync(INPUT_FILE, 'utf-8');
const lines = content.split('\n');

// 神兽列表（编号和名称映射）
const BEAST_LIST = [
  { no: 1, name: '烛龙', id: 'zhulong' },
  { no: 2, name: '应龙', id: 'yinglong' },
  { no: 3, name: '凤凰', id: 'fenghuang' },
  { no: 4, name: '麒麟', id: 'qilin' },
  { no: 5, name: '白泽', id: 'baize' },
  { no: 6, name: '饕餮', id: 'taotie' },
  { no: 7, name: '穷奇', id: 'qiongqi' },
  { no: 8, name: '混沌', id: 'hundun' },
  { no: 9, name: '梼杌', id: 'taowu' },
  { no: 10, name: '九尾狐', id: 'jiuweihu' },
  { no: 11, name: '相柳', id: 'xiangliu' },
  { no: 12, name: '毕方', id: 'bifang' },
  { no: 13, name: '夔', id: 'kui' },
  { no: 14, name: '青龙', id: 'qinglong' },
  { no: 15, name: '白虎', id: 'baihu' },
  { no: 16, name: '朱雀', id: 'zhuque' },
  { no: 17, name: '玄武', id: 'xuanwu' },
  { no: 18, name: '蛊雕', id: 'gudiao' },
  { no: 19, name: '天狗', id: 'tiangou' },
  { no: 20, name: '狰', id: 'zheng' },
  { no: 21, name: '蠃鱼', id: 'luoyu' },
  { no: 22, name: '旋龟', id: 'xuanyuan' },
  { no: 23, name: '化蛇', id: 'huashe' },
  { no: 24, name: '陆吾', id: 'luwu' },
  { no: 25, name: '英招', id: 'yingzhao' },
  { no: 26, name: '诸犍', id: 'zhujian' },
  { no: 27, name: '肥遗', id: 'feiyi' },
  { no: 28, name: '狻猊', id: 'suanni' },
  { no: 29, name: '獬豸', id: 'xiezhi' },
  { no: 30, name: '重明鸟', id: 'chongming' },
  { no: 31, name: '鲲鹏', id: 'kunpeng' },
  { no: 32, name: '巴蛇', id: 'bashe' },
  { no: 33, name: '鹿蜀', id: 'lushu' },
  { no: 34, name: '文鳐鱼', id: 'wenyaoyu' },
  { no: 35, name: '朱厌', id: 'zhuyan' },
  { no: 36, name: '夫诸', id: 'fuzhu' },
  { no: 37, name: '祸斗', id: 'huodou' },
  { no: 38, name: '蜚', id: 'fei' },
  { no: 39, name: '酸与', id: 'suanyu' },
  { no: 40, name: '孟槐', id: 'menghuai' }
];

// 提取神兽档案
function extractBeast(startIdx, endIdx) {
  const section = lines.slice(startIdx, endIdx).join('\n');
  
  const beast = {
    rawText: section,
    name: '',
    pinyin: '',
    aliases: [],
    origin: '',
    originText: '',
    introduction: '',
    appearance: '',
    abilities: [],
    story: '',
    symbolism: [],
    cinema: '',
    nirath: '',
    related: []
  };
  
  // 提取名称
  const nameMatch = section.match(/### ①[\s\S]*?-\s*\*\*中文名称\*\*：(.+)/);
  if (nameMatch) beast.name = nameMatch[1].trim();
  
  const pinyinMatch = section.match(/-\s*\*\*拼音注音\*\*：(.+)/);
  if (pinyinMatch) beast.pinyin = pinyinMatch[1].trim();
  
  const aliasesMatch = section.match(/-\s*\*\*别名\*\*：(.+)/);
  if (aliasesMatch) beast.aliases = aliasesMatch[1].split(/[,、]/).map(s => s.trim()).filter(Boolean);
  
  // 提取出处
  const originMatch = section.match(/### ②[\s\S]*?-\s*\*\*具体篇章\*\*：(.+)/);
  if (originMatch) beast.origin = originMatch[1].trim();
  
  // 提取介绍
  const introMatch = section.match(/### ③[\s\S]*?(?=### ④|$)/);
  if (introMatch) {
    beast.introduction = introMatch[0].replace('### ③ 神兽介绍', '').trim();
  }
  
  // 提取外观
  const appearMatch = section.match(/### ④[\s\S]*?(?=### ⑤|$)/);
  if (appearMatch) {
    beast.appearance = appearMatch[0].replace('### ④ 神兽外观', '').trim();
  }
  
  // 提取能力
  const abilityMatch = section.match(/### ⑤[\s\S]*?(?=### ⑥|$)/);
  if (abilityMatch) {
    const abilityText = abilityMatch[0].replace('### ⑤ 神兽能力/神通', '').trim();
    const abilityLines = abilityText.split('\n').filter(l => l.trim().startsWith('-'));
    beast.abilities = abilityLines.map(l => l.replace(/^-\s*/, '').trim());
  }
  
  // 提取故事
  const storyMatch = section.match(/### ⑥[\s\S]*?(?=### ⑦|$)/);
  if (storyMatch) {
    beast.story = storyMatch[0].replace('### ⑥ 神兽故事', '').trim();
  }
  
  // 提取象征
  const symbolMatch = section.match(/### ⑦[\s\S]*?(?=### ⑧|$)/);
  if (symbolMatch) {
    const symbolText = symbolMatch[0].replace('### ⑦ 象征寓意', '').trim();
    beast.symbolism = symbolText;
  }
  
  // 提取影视建议
  const cinemaMatch = section.match(/### ⑧[\s\S]*?(?=### ⑨|$)/);
  if (cinemaMatch) {
    beast.cinema = cinemaMatch[0].replace('### ⑧ 影视创作建议', '').trim();
  }
  
  // 提取Nirath
  const nirathMatch = section.match(/### ⑨[\s\S]*?(?=### ⑩|$)/);
  if (nirathMatch) {
    beast.nirath = nirathMatch[0].replace('### ⑨ 与Nirath星球结合的建议', '').trim();
  }
  
  // 提取相关神兽
  const relatedMatch = section.match(/### ⑩[\s\S]*?(?=## [一二三四五六七八九十]|$)/);
  if (relatedMatch) {
    const relatedText = relatedMatch[0].replace('### ⑩ 相关神兽', '').trim();
    const relatedLines = relatedText.split('\n').filter(l => l.trim().startsWith('-'));
    beast.related = relatedLines.map(l => {
      const match = l.match(/-\s*\*\*(.+?)\*\*/);
      return match ? match[1] : l.replace(/^-\s*/, '').trim();
    }).filter(Boolean);
  }
  
  return beast;
}

// 查找每只神兽的起始位置
function findBeastPositions() {
  const positions = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const beast of BEAST_LIST) {
      // 匹配 "## 一、烛龙" 或 "## 1. 烛龙" 或 "## 烛龙" 格式
      const patterns = [
        new RegExp(`^##\\s*[一二三四五六七八九十\\d]+[、.\\s]+${beast.name}`),
        new RegExp(`^##\\s*${beast.name}`)
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          positions.push({ ...beast, startIdx: i });
          break;
        }
      }
    }
  }
  
  // 排序并计算结束位置
  positions.sort((a, b) => a.startIdx - b.startIdx);
  for (let i = 0; i < positions.length; i++) {
    if (i < positions.length - 1) {
      positions[i].endIdx = positions[i + 1].startIdx;
    } else {
      positions[i].endIdx = lines.length;
    }
  }
  
  return positions;
}

// 生成完整JSON档案
function generateFullArchive(beastData, beastInfo) {
  // 从原始文本中提取外观关键词
  const appearanceText = beastData.appearance || '';
  
  // 提取核心描述（第一句）
  const summaryMatch = appearanceText.match(/^(.+?)(?=。|$)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : `${beastInfo.name}外观描述`;
  
  // 解析能力为结构化数组
  const abilities = (beastData.abilities || []).map(ability => {
    const parts = ability.split(/[:：]/);
    if (parts.length >= 2) {
      return { name: parts[0].trim(), description: parts.slice(1).join(':').trim() };
    }
    return { name: ability, description: '' };
  });
  
  // 解析Nirath栖息地
  let habitat = { location: '', climate: '', features: '' };
  if (beastData.nirath) {
    const locationMatch = beastData.nirath.match(/栖息地[：:]\s*(.+?)(?=\n|$)/);
    if (locationMatch) habitat.location = locationMatch[1].trim();
    
    const climateMatch = beastData.nirath.match(/气候|环境[：:]\s*(.+?)(?=\n|$)/);
    if (climateMatch) habitat.climate = climateMatch[1].trim();
  }
  
  // 解析影视建议中的运镜
  let recommendedShots = ['medium', 'wide'];
  let scale = '大型（十米级）';
  let lighting = '自然光';
  let effects = '';
  
  if (beastData.cinema) {
    if (beastData.cinema.includes('extreme_wide') || beastData.cinema.includes('IMAX')) {
      scale = '超巨型（千里级）';
      recommendedShots = ['extreme_wide', 'slow_push', 'aerial'];
    } else if (beastData.cinema.includes('wide') || beastData.cinema.includes('航拍')) {
      scale = '巨型（百米级）';
      recommendedShots = ['wide', 'slow_push'];
    } else if (beastData.cinema.includes('close_up') || beastData.cinema.includes('特写')) {
      recommendedShots = ['close_up', 'extreme_close_up'];
    }
  }
  
  return {
    id: beastInfo.id,
    name: beastData.name || beastInfo.name,
    nameEn: beastInfo.id.charAt(0).toUpperCase() + beastInfo.id.slice(1),
    category: '待定',
    no: beastInfo.no,
    origin: beastData.origin || '《山海经》',
    nameDetails: {
      chinese: beastData.name || beastInfo.name,
      pinyin: beastData.pinyin || '',
      aliases: beastData.aliases || []
    },
    appearance: {
      summary: summary,
      fullDescription: beastData.appearance || ''
    },
    abilities: abilities,
    story: beastData.story || '',
    symbolism: beastData.symbolism || '',
    cinema: {
      fullAdvice: beastData.cinema || '',
      scale: scale,
      recommendedShots: recommendedShots,
      lighting: lighting,
      effects: effects
    },
    habitat: habitat,
    nirath: {
      fullDescription: beastData.nirath || ''
    },
    related: beastData.related || []
  };
}

// 主函数
function main() {
  console.log('🔍 查找神兽位置...');
  const positions = findBeastPositions();
  console.log(`   找到 ${positions.length} 只神兽`);
  
  let generated = 0;
  let failed = 0;
  
  for (const pos of positions) {
    console.log(`\n📖 提取: ${pos.name} (第${pos.no}号)`);
    
    try {
      const beastData = extractBeast(pos.startIdx, pos.endIdx);
      const archive = generateFullArchive(beastData, pos);
      
      const filePath = path.join(OUTPUT_DIR, `${pos.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(archive, null, 2), 'utf-8');
      
      console.log(`   ✅ 已生成: ${pos.id}.json`);
      console.log(`      外观: ${(archive.appearance.fullDescription || '').length} 字`);
      console.log(`      故事: ${(archive.story || '').length} 字`);
      console.log(`      Nirath: ${(archive.nirath.fullDescription || '').length} 字`);
      generated++;
    } catch (err) {
      console.error(`   ❌ 失败: ${pos.name} - ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 处理完成`);
  console.log(`   成功: ${generated} 只`);
  console.log(`   失败: ${failed} 只`);
  console.log(`   输出目录: ${OUTPUT_DIR}`);
}

main();