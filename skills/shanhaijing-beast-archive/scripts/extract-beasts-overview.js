const fs = require('fs');
const path = require('path');

const BEASTS_DIR = '/root/.openclaw/workspace/skills/shanhaijing-beast-archive/beasts';

// 读取所有异兽档案
const files = fs.readdirSync(BEASTS_DIR).filter(f => f.endsWith('.json'));
console.log(`发现 ${files.length} 只异兽档案\n`);

const beasts = [];
for (const file of files.sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(BEASTS_DIR, file), 'utf8'));
  beasts.push({
    id: data.id,
    name: data.name,
    nameEn: data.nameEn,
    no: data.no,
    category: data.category,
    origin: data.origin,
    appearance_summary: data.appearance?.summary?.substring(0, 80) + '...',
    appearance_length: data.appearance?.fullDescription?.length || 0,
    abilities_count: data.abilities?.length || 0,
    scale: data.cinema?.scale || '未知',
    has_nirath: !!data.nirath,
    related_count: data.related?.length || 0
  });
}

// 按编号排序
beasts.sort((a, b) => (a.no || 999) - (b.no || 999));

console.log('=== 40异兽档案汇总 ===\n');
console.log('| 编号 | ID | 名称 | 英名 | 出处 | 体型 | 特征字数 | 能力数 |');
console.log('|------|-----|------|------|------|------|---------|--------|');
for (const b of beasts) {
  console.log(`| ${b.no?.toString().padStart(2) || '--'} | ${b.id.padEnd(10)} | ${b.name.padEnd(6)} | ${b.nameEn?.padEnd(12) || '----'} | ${b.origin?.padEnd(6) || '----'} | ${b.scale?.padEnd(8) || '----'} | ${b.appearance_length.toString().padStart(5)} | ${b.abilities_count.toString().padStart(3)} |`);
}

console.log(`\n总计: ${beasts.length} 只异兽`);
console.log(`有Nirath设定: ${beasts.filter(b => b.has_nirath).length} 只`);
console.log(`有外观描述: ${beasts.filter(b => b.appearance_length > 0).length} 只`);

// 保存汇总
fs.writeFileSync('/root/.openclaw/workspace/skills/shanhaijing-beast-archive/beasts-summary.json', JSON.stringify(beasts, null, 2));
console.log('\n✅ 汇总已保存到 beasts-summary.json');