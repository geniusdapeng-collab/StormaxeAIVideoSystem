#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SKILLS = '/home/gem/workspace/agent/skills';
const OUTPUT = '/home/gem/workspace/agent/skills/shanhaijing-full-system-v6.20-Peng.md';

const MODULES = [
  { name: 'shanhaijing-director',         desc: '导演预生产流水线⭐核心' },
  { name: 'shanhaijing-bestiary',          desc: '异兽图鉴32只完整档案' },
  { name: 'shanhaijing-beast-archive',     desc: '异兽详细档案库' },
  { name: 'shanhaijing-render-engine',     desc: 'Seedance渲染引擎' },
  { name: 'shanhaijing-delivery-engine',  desc: 'FFmpeg视频交付' },
  { name: 'seedance-render-engine',       desc: '通用Seedance渲染' },
  { name: 'story-core-system',            desc: 'Story Core内核' },
  { name: 'shanhaijing-story-engine',     desc: '叙事引擎' },
  { name: 'shanhaijing-storyforge-pro',   desc: '故事锻造Pro' },
  { name: 'shanhaijing-story-forge',     desc: '故事工坊' },
  { name: 'shanhaijing-story-manifest',   desc: '故事清单' },
  { name: 'seedance-director',            desc: '通用导演流水线' },
  { name: 'seedance-story-engine',        desc: '通用故事引擎' },
  { name: 'seedance-micromotion',        desc: '微动作系统' },
  { name: 'seedance-shot-design',         desc: '镜头设计' },
  { name: 'seedance-sound-design',       desc: '音效设计' },
  { name: 'seedance-bid-eval',            desc: '投标评估' },
  { name: 'seedance-post-production',     desc: '后期制作' },
  { name: 'seedance-character-manager',   desc: '角色管理' },
  { name: 'seedance-choreography',        desc: '动作编排' },
  { name: 'seedance-delivery-engine',     desc: '通用交付引擎' },
  { name: 'shanhaijing-agent',           desc: '山海经Agent' },
  { name: 'seedance-agent',               desc: '通用Agent' },
  { name: 'shanhaijing-ark-seedance-skill',desc: 'ARK Seedance CLI' },
  { name: 'shanhaijing-character-manager',desc: '山海经角色管理' },
  { name: 'seedance-dialogue-engine',     desc: '对白引擎' },
  { name: 'shanhaijing-cinematography',   desc: '镜头设计' },
  { name: 'shanhaijing-promptforge',      desc: '提示词锻造' },
  { name: 'shanhaijing-opening-title',    desc: '开场标题' },
  { name: 'shanhaijing-persona-vault',     desc: '人格库' },
  { name: 'shanhaijing-voice-craft',      desc: '声线设计' },
  { name: 'shanhaijing-pitch-evaluation', desc: '提案评估' },
  { name: 'shanhaijing-post-production',  desc: '山海经后期' },
  { name: 'shanhaijing-pipeline',          desc: '总管道' },
  { name: 'shanhaijing-integrator',        desc: '集成器' },
  { name: 'shanhaijing-soul-forge',       desc: '灵魂锻造' },
  { name: 'shanhaijing-world-engine',      desc: '世界观引擎' },
  { name: 'shanhaijing-style-router',      desc: '风格路由' },
  { name: 'shanhaijing-micromotion',     desc: '微动作' },
  { name: 'shanhaijing-narrative-consistency',desc: '叙事一致性' },
  { name: 'shanhaijing-quality-oracle',    desc: '质量预言机' },
  { name: 'shanhaijing-emotion-calculator',desc: '情绪计算' },
  { name: 'shanhaijing-sensory-generator', desc: '感官生成' },
  { name: 'shanhaijing-beast-motion',      desc: '异兽运动' },
  { name: 'shanhaijing-choreography',     desc: '动作编排' },
  { name: 'shanhaijing-ip-asset-manager',  desc: 'IP资产管理' },
  { name: 'seedance2-storyboard-generator',desc: '故事板生成' },
];

const EXCLUDE = ['.bak', 'node_modules', '.DS_Store'];

function shouldExclude(fp) {
  return EXCLUDE.some(p => fp.includes(p));
}

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const walk = (d, base) => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(d, e.name);
      if (shouldExclude(fp)) continue;
      if (e.isDirectory()) {
        walk(fp, base ? path.join(base, e.name) : e.name);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (['.js', '.json', '.md', '.yaml', '.yml', '.txt'].includes(ext)) {
          files.push({
            fullPath: fp,
            relPath: base ? path.join(base, e.name) : e.name
          });
        }
      }
    }
  };
  walk(dir, '');
  return files;
}

function getExt(fp) {
  const m = { '.js': 'javascript', '.json': 'json', '.md': 'markdown' };
  return m[path.extname(fp).toLowerCase()] || 'text';
}

function formatFile(f) {
  const kb = (fs.statSync(f.fullPath).size / 1024).toFixed(1);
  const content = fs.readFileSync(f.fullPath, 'utf8');
  return `### 📄 ${f.relPath} \`${kb}KB\`\n\`\`\`${getExt(f.fullPath)}\n${content}\n\`\`\`\n`;
}

let totalFiles = 0;
let totalSize = 0;

let md = `# 山海经AI视频生成系统 · 全量安装包\n`;
md += `> **版本**: v6.20-Peng（全量版）  \n`;
md += `> **时间**: 2026-06-06  \n`;
md += `> **安装路径**: \`~/workspace/agent/skills/\`  \n\n`;
md += `> **安装说明**: 复制全部源码块到目标机器 \`~/workspace/agent/skills/\` 覆盖即可。\n\n`;
md += `## 系统架构\n\n`;
md += `\`\`\`\n`;
md += `shanhaijing-director/        ← ⭐核心编排层（12阶段导演流水线）\n`;
md += `  ├── story-core-system/     ← 内核（异兽视角叙事）\n`;
md += `  ├── shanhaijing-bestiary/  ← 数据层（32只异兽档案）\n`;
md += `  ├── shanhaijing-beast-archive/ ← 异兽详细档案库\n`;
md += `  ├── shanhaijing-render-engine/  ← 渲染层\n`;
md += `  ├── shanhaijing-delivery-engine/ ← 交付层\n`;
md += `  ├── shanhaijing-story-engine/   ← 叙事引擎\n`;
md += `  ├── seedance-director/     ← 通用导演流水线\n`;
md += `  ├── seedance-render-engine/ ← 通用渲染引擎\n`;
md += `  ├── seedance-story-engine/  ← 通用故事引擎\n`;
md += `  ├── shanhaijing-agent/     ← 山海经Agent\n`;
md += `  └── seedance-agent/        ← 通用Agent\n`;
md += `\`\`\`\n\n`;
md += `## 全量模块清单\n\n`;

for (const mod of MODULES) {
  const dir = path.join(SKILLS, mod.name);
  const files = getFiles(dir);
  if (files.length === 0) {
    console.log(`⚠️  跳过（无文件）: ${mod.name}`);
    continue;
  }

  let mSize = 0;
  files.forEach(f => { mSize += fs.statSync(f.fullPath).size; });

  md += `### ${mod.desc}\n\n`;
  md += `**模块**: \`${mod.name}/\`  \n`;
  md += `**文件**: ${files.length} | **大小**: ${(mSize / 1024).toFixed(1)}KB\n\n`;

  let count = 0;
  for (const f of files) {
    try {
      md += formatFile(f);
      totalFiles++;
      totalSize += fs.statSync(f.fullPath).size;
      count++;
    } catch (e) {
      console.warn(`⚠️  失败: ${f.relPath}`);
    }
  }
  md += `---\n\n`;
  console.log(`✅ ${mod.name}: ${count}文件`);
}

// 飞书插件单独处理
const larkDir = '/home/gem/workspace/agent/extensions/openclaw-lark';
const larkFiles = getFiles(larkDir);
if (larkFiles.length > 0) {
  let larkSize = 0;
  larkFiles.forEach(f => { larkSize += fs.statSync(f.fullPath).size; });
  md += `### 飞书插件扩展\n\n`;
  md += `**模块**: \`openclaw-lark/\`  \n`;
  md += `**文件**: ${larkFiles.length} | **大小**: ${(larkSize / 1024).toFixed(1)}KB\n\n`;
  let count = 0;
  for (const f of larkFiles) {
    try {
      md += formatFile(f);
      totalFiles++;
      totalSize += fs.statSync(f.fullPath).size;
      count++;
    } catch (e) {}
  }
  md += `---\n\n`;
  console.log(`✅ openclaw-lark: ${count}文件`);
}

md += `## 安装后验证\n\n`;
md += `\`\`\`bash\n`;
md += `cd ~/workspace/agent/skills/shanhaijing-director/scripts\n`;
md += `node director-pipeline.js --help\n`;
md += `node -e "const {Bestiary}=require('../shanhaijing-bestiary/bestiary.js'); console.log('异兽数:', Object.keys(new Bestiary().beasts).length)"\n`;
md += `\`\`\`\n\n`;
md += `---\n`;
md += `**统计**: ${totalFiles} 文件 | ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;

fs.writeFileSync(OUTPUT, md, 'utf8');
const sizeMb = (Buffer.byteLength(md, 'utf8') / 1024 / 1024).toFixed(2);
console.log(`\n✅ 全量包生成完成: ${OUTPUT}`);
console.log(`📊 大小: ~${sizeMb}MB | 文件: ${totalFiles}`);
