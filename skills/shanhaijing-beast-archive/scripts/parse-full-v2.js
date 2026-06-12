#!/usr/bin/env node
/**
 * 从15万字MD原始档案解析并生成完整JSON档案 v2
 * 支持多种标题格式：
 *   - ## 一、烛龙（烛九阴）
 *   - ## 【档案十一】相柳（相繇）
 *   - ## 【21】蠃鱼（Luǒ Yú）
 *   - ## 第三十一号神兽 · 鲲鹏
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = '/root/.openclaw/media/inbound/å_æµ_ç_40ç_å_½å_¾é---a308f775-b0f1-4b77-a9e9-891ca8f6abad.md';
const OUTPUT_DIR = path.join(__dirname, '..', 'beasts');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const content = fs.readFileSync(INPUT_FILE, 'utf-8');
const lines = content.split('\n');

// 所有标题格式正则
const TITLE_PATTERNS = [
  // 格式1: ## 一、烛龙（烛九阴）
  { regex: /^##\s*[一二三四五六七八九十]+、\s*(.+?)(?:\s*[（(].*?[）)])?\s*$/, nameIndex: 1 },
  // 格式2: ## 【档案十一】相柳（相繇）
  { regex: /^##\s*【档案[一二三四五六七八九十]+】\s*(.+?)(?:\s*[（(].*?[）)])?\s*$/, nameIndex: 1 },
  // 格式3: ## 【21】蠃鱼（Luǒ Yú）
  { regex: /^##\s*【\d+】\s*(.+?)(?:\s*[（(].*?[）)])?\s*$/, nameIndex: 1 },
  // 格式4: ## 第三十一号神兽 · 鲲鹏
  { regex: /^##\s*第[一二三四五六七八九十]+号神兽\s*[·•]\s*(.+?)\s*$/, nameIndex: 1 }
];

// 神兽名称到ID映射
const NAME_TO_ID = {
  '烛龙': 'zhulong', '应龙': 'yinglong', '凤凰': 'fenghuang', '麒麟': 'qilin',
  '白泽': 'baize', '饕餮': 'taotie', '穷奇': 'qiongqi', '混沌': 'hundun',
  '梼杌': 'taowu', '九尾狐': 'jiuweihu', '相柳': 'xiangliu', '毕方': 'bifang',
  '夔': 'kui', '青龙': 'qinglong', '白虎': 'baihu', '朱雀': 'zhuque',
  '玄武': 'xuanwu', '蛊雕': 'gudiao', '天狗': 'tiangou', '狰': 'zheng',
  '蠃鱼': 'luoyu', '旋龟': 'xuanyuan', '化蛇': 'huashe', '陆吾': 'luwu',
  '英招': 'yingzhao', '诸犍': 'zhujian', '肥遗': 'feiyi', '狻猊': 'suanni',
  '獬豸': 'xiezhi', '重明鸟': 'chongming', '鲲鹏': 'kunpeng', '巴蛇': 'bashe',
  '鹿蜀': 'lushu', '文鳐鱼': 'wenyaoyu', '朱厌': 'zhuyan', '夫诸': 'fuzhu',
  '祸斗': 'huodou', '蜚': 'fei', '酸与': 'suanyu', '孟槐': 'menghuai'
};

// 查找所有神兽位置
function findAllBeasts() {
  const beasts = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const pattern of TITLE_PATTERNS) {
      const match = line.match(pattern.regex);
      if (match) {
        const name = match[pattern.nameIndex].trim();
        const id = NAME_TO_ID[name];
        if (id) {
          beasts.push({ name, id, startIdx: i });
        }
        break;
      }
    }
  }
  
  // 计算结束位置
  for (let i = 0; i < beasts.length; i++) {
    beasts[i].endIdx = (i < beasts.length - 1) ? beasts[i + 1].startIdx : lines.length;
  }
  
  return beasts;
}

// 提取字段内容
function extractField(section, fieldName) {
  const patterns = [
    new RegExp(`###\\s*\\d*[①②③④⑤⑥⑦⑧⑨⑩]?\\s*${fieldName}\\s*\\n?([\\s\\S]*?)(?=###|##|$)`, 'i'),
    new RegExp(`###\\s*${fieldName}\\s*\\n?([\\s\\S]*?)(?=###|##|$)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = section.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

// 提取列表项
function extractListItems(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.map(l => {
    const cleaned = l.replace(/^-\s*/, '').trim();
    // 移除粗体标记
    return cleaned.replace(/\*\*/g, '');
  }).filter(Boolean);
}

// 解析能力
function parseAbilities(text) {
  const items = extractListItems(text);
  return items.map(item => {
    const parts = item.split(/[:：]/);
    if (parts.length >= 2) {
      return { name: parts[0].trim(), description: parts.slice(1).join(':').trim() };
    }
    return { name: item, description: '' };
  });
}

// 解析Nirath栖息地
function parseNirath(text) {
  const habitat = { location: '', climate: '', features: '', adaptation: '', relationship: '', storylines: [], scientific: '' };
  
  if (!text) return habitat;
  
  const lines = text.split('\n');
  let currentKey = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.includes('栖息地') && trimmed.includes('：')) {
      habitat.location = trimmed.split('：')[1]?.trim() || '';
    } else if (trimmed.includes('生态适应') || trimmed.includes('外星生态')) {
      currentKey = 'adaptation';
    } else if (trimmed.includes('人类文明') || trimmed.includes('与人类文明')) {
      currentKey = 'relationship';
    } else if (trimmed.includes('故事线') || trimmed.includes('科幻故事线')) {
      currentKey = 'storylines';
    } else if (trimmed.includes('科学解释') || trimmed.includes('超科学解释')) {
      currentKey = 'scientific';
    } else if (trimmed.startsWith('-') && currentKey === 'storylines') {
      habitat.storylines.push(trimmed.replace(/^-\s*/, '').replace(/\*\*/g, '').trim());
    } else if (trimmed && currentKey === 'adaptation') {
      habitat.adaptation += trimmed + '\n';
    } else if (trimmed && currentKey === 'relationship') {
      habitat.relationship += trimmed + '\n';
    } else if (trimmed && currentKey === 'scientific') {
      habitat.scientific += trimmed + '\n';
    }
  }
  
  return habitat;
}

// 生成完整JSON档案
function generateArchive(name, id, section) {
  const text = section;
  
  // 提取基本信息
  const nameSection = extractField(text, '神兽名称');
  const pinyinMatch = nameSection.match(/拼音注音[：:]\s*(.+?)(?=\n|$)/);
  const aliasesMatch = nameSection.match(/别名[：:]\s*(.+?)(?=\n|$)/);
  
  // 提取出处
  const originSection = extractField(text, '山海经出处');
  const originTextMatch = originSection.match(/具体篇章[：:]\s*(.+?)(?=\n|$)/);
  
  // 提取各维度
  const introduction = extractField(text, '神兽介绍');
  const appearance = extractField(text, '神兽外观');
  const abilitiesText = extractField(text, '神兽能力/神通');
  const story = extractField(text, '神兽故事');
  const symbolism = extractField(text, '象征寓意');
  const cinema = extractField(text, '影视创作建议');
  const nirathText = extractField(text, '与Nirath星球结合的建议');
  const relatedText = extractField(text, '相关神兽');
  
  // 解析结构化数据
  const abilities = parseAbilities(abilitiesText);
  const nirath = parseNirath(nirathText);
  const related = extractListItems(relatedText);
  
  // 提取外观核心描述（第一句）
  const summaryMatch = appearance.match(/^(.+?)(?=。|$)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';
  
  return {
    id: id,
    name: name,
    nameEn: id.charAt(0).toUpperCase() + id.slice(1),
    no: Object.keys(NAME_TO_ID).indexOf(name) + 1,
    category: '待定',
    origin: originTextMatch ? originTextMatch[1].trim() : '《山海经》',
    nameDetails: {
      chinese: name,
      pinyin: pinyinMatch ? pinyinMatch[1].trim() : '',
      aliases: aliasesMatch ? aliasesMatch[1].split(/[,、]/).map(s => s.trim()).filter(Boolean) : []
    },
    appearance: {
      summary: summary,
      fullDescription: appearance
    },
    abilities: abilities,
    story: story,
    symbolism: symbolism,
    cinema: {
      fullAdvice: cinema,
      scale: '大型（十米级）',
      recommendedShots: ['medium', 'wide'],
      lighting: '自然光',
      effects: ''
    },
    nirath: {
      habitat: nirath,
      fullDescription: nirathText
    },
    related: related
  };
}

// 主函数
function main() {
  console.log('🔍 扫描所有神兽...');
  const beasts = findAllBeasts();
  console.log(`   找到 ${beasts.length} 只神兽\n`);
  
  let generated = 0;
  let failed = 0;
  
  for (const beast of beasts) {
    const section = lines.slice(beast.startIdx, beast.endIdx).join('\n');
    
    try {
      const archive = generateArchive(beast.name, beast.id, section);
      const filePath = path.join(OUTPUT_DIR, `${beast.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(archive, null, 2), 'utf-8');
      
      console.log(`✅ ${beast.name} (${beast.id}.json)`);
      console.log(`   外观: ${archive.appearance.fullDescription.length} 字 | 故事: ${archive.story.length} 字 | Nirath: ${archive.nirath.fullDescription.length} 字`);
      generated++;
    } catch (err) {
      console.error(`❌ ${beast.name} - ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n🎉 完成！成功: ${generated} | 失败: ${failed}`);
}

main();