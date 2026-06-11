/**
 * 批量填充40异兽部位表数据
 * 使用 beast-body-part-system.js 通用模块
 */

const fs = require('fs');
const path = require('path');

// 引入通用模块
const { BeastBodyPartSystem } = require('./beast-body-part-system.js');

const system = new BeastBodyPartSystem();

const BEASTS_DIR = path.join(__dirname, '..', 'beasts');
const files = fs.readdirSync(BEASTS_DIR).filter(f => f.endsWith('.json'));

console.log(`=== 批量填充部位表 v1.0-Peng ===`);
console.log(`共 ${files.length} 只异兽\n`);

const results = {
  total: files.length,
  success: 0,
  failed: 0,
  details: []
};

for (const file of files) {
  const beastId = file.replace('.json', '');
  const filePath = path.join(BEASTS_DIR, file);
  
  try {
    // 读取原始档案
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 使用通用模块生成部位表
    const profile = system.loadFromArchive(beastId);
    
    // 新增 bodyParts 字段到档案
    data.bodyParts = {
      version: 'v1.0-Peng',
      generatedAt: new Date().toISOString(),
      parts: profile.parts,
      extension: profile.extension,
      aura: profile.aura,
      scale: profile.scale
    };
    
    // 写回档案
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    results.success++;
    results.details.push({
      id: beastId,
      name: data.name,
      status: '✅ 已填充',
      bodyShape: profile.extension.body_shape,
      headType: profile.extension.head_type,
      limbCount: profile.extension.limb_count,
      tailCount: profile.extension.tail_count,
      wingCount: profile.extension.wing_count
    });
    
    console.log(`✅ ${data.name} (${beastId}) — ${profile.extension.body_shape} | ${profile.extension.head_type} | 肢${profile.extension.limb_count} 尾${profile.extension.tail_count} 翼${profile.extension.wing_count}`);
    
  } catch (err) {
    results.failed++;
    results.details.push({
      id: beastId,
      status: '❌ 失败',
      error: err.message
    });
    console.log(`❌ ${beastId} — ${err.message}`);
  }
}

console.log(`\n=== 填充完成 ===`);
console.log(`成功: ${results.success}/${results.total}`);
console.log(`失败: ${results.failed}/${results.total}`);

// 生成汇总报告
const reportPath = path.join(__dirname, 'beasts-body-parts-summary.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`\n汇总报告: ${reportPath}`);