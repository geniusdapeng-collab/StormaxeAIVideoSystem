#!/usr/bin/env node
/**
 * 批量生成第一批P0神兽档案
 * 10只核心神兽：烛龙/帝江/白泽/饕餮/应龙/凤凰/穷奇/九尾狐/青龙/麒麟
 */

const fs = require('fs');
const path = require('path');

const BEAST_DIR = path.join(__dirname, '..', 'beasts');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const P0_BEASTS = [
  'zhulong', 'hundun', 'baize', 'taotie', 'yinglong',
  'fenghuang', 'qiongqi', 'jiuweihu', 'qinglong', 'qilin'
];

function generateMarkdown(beastId) {
  const jsonPath = path.join(BEAST_DIR, `${beastId}.json`);
  if (!fs.existsSync(jsonPath)) {
    return null;
  }
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  const abilities = (data.abilities || []).map(a => {
    return `- **${a.name}**：${a.description}`;
  }).join('\n');
  
  const related = (data.related || [])
    .filter(r => r !== '--')
    .map(r => `- ${r}`)
    .join('\n');
  
  return `# ${data.name}档案

> **异兽档案系统 v2.0-Peng | 山海经四十大神兽图鉴**
> 编号：第${data.no}号
> 制作人：小G | 审核：大鹏

---

## ① 神兽身份信息

- **中文名称**：${data.name}
- **拼音注音**：${data.nameDetails?.pinyin || ''}
- **别名**：${(data.nameDetails?.aliases || []).join('、') || '无'}
- **山海经出处**：${data.origin || '《山海经》'}

---

## ② 综合介绍

${data.appearance?.summary || ''}

---

## ③ 外观描述

${data.appearance?.fullDescription || ''}

---

## ④ 神通能力

${abilities}

---

## ⑤ 传说故事

${data.story || ''}

---

## ⑥ 象征寓意

${data.symbolism || ''}

---

## ⑦ 影视创作建议

${data.cinema?.fullAdvice || ''}

---

## ⑧ Nirath星球融合设定

${data.nirath?.fullDescription || ''}

---

## ⑨ 相关神兽网络

${related}

---

## ⑩ 档案元数据

- **档案版本**：v2.0-Peng
- **编号**：第${data.no}号
- **创建时间**：2026-05-23
- **审核状态**：待审

---

> **备注**：此为v2.0-Peng基础档案（10维度），待大鹏审阅确认后，将升级为完整15维度。
> —— 小G，2026-05-23
`;
}

// 批量生成
let generated = 0;
for (const beastId of P0_BEASTS) {
  const markdown = generateMarkdown(beastId);
  if (markdown) {
    const outputPath = path.join(OUTPUT_DIR, `${beastId}.md`);
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`✅ ${beastId}.md`);
    generated++;
  } else {
    console.log(`❌ ${beastId}.json 不存在`);
  }
}

console.log(`\n🎉 完成！成功: ${generated}/${P0_BEASTS.length}`);