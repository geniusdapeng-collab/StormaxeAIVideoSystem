#!/usr/bin/env node
/**
 * 全量打包：山海经+Seedance完整系统（所有模块）
 * 输出单个MD，约10MB
 */
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/home/gem/workspace/agent/skills';
const EXTENSIONS_DIR = '/home/gem/workspace/agent/extensions';
const WORKSPACE_SKILLS = '/home/gem/workspace/agent/workspace/skills';
const OUTPUT_FILE = path.join(SKILLS_DIR, 'shanhaijing-full-system-v6.20-Peng.md');

// 要打包的所有模块（按优先级）
const MODULES = [
  // 核心编排层
  { name: 'shanhaijing-director',         path: 'shanhaijing-director',         desc: '导演预生产流水线（12阶段主演练）⭐核心' },
  // 数据层
  { name: 'shanhaijing-bestiary',          path: 'shanhaijing-bestiary',          desc: '异兽图鉴32只完整档案' },
  { name: 'shanhaijing-beast-archive',     path: 'shanhaijing-beast-archive',     desc: '异兽详细档案库' },
  // 渲染+交付
  { name: 'shanhaijing-render-engine',     path: 'shanhaijing-render-engine',     desc: 'Seedance渲染引擎' },
  { name: 'shanhaijing-delivery-engine',  path: 'shanhaijing-delivery-engine',  desc: 'FFmpeg视频交付' },
  { name: 'seedance-render-engine',       path: 'seedance-render-engine',       desc: '通用Seedance渲染' },
  // 叙事+Story
  { name: 'story-core-system',             path: 'story-core-system',             desc: 'Story Core内核' },
  { name: 'shanhaijing-story-engine',     path: 'shanhaijing-story-engine',     desc: '叙事引擎' },
  { name: 'shanhaijing-storyforge-pro',   path: 'shanhaijing-storyforge-pro',   desc: '故事锻造Pro' },
  { name: 'shanhaijing-story-forge',     path: 'shanhaijing-story-forge',     desc: '故事工坊' },
  { name: 'shanhaijing-story-manifest',   path: 'shanhaijing-story-manifest',   desc: '故事清单' },
  // Seedance子系统
  { name: 'seedance-director',             path: 'seedance-director',             desc: '通用导演流水线' },
  { name: 'seedance-story-engine',         path: 'seedance-story-engine',         desc: '通用故事引擎' },
  { name: 'seedance-micromotion',         path: 'seedance-micromotion',         desc: '微动作系统' },
  { name: 'seedance-shot-design',          path: 'seedance-shot-design',          desc: '镜头设计' },
  { name: 'seedance-sound-design',        path: 'seedance-sound-design',        desc: '音效设计' },
  { name: 'seedance-bid-eval',             path: 'seedance-bid-eval',             desc: '投标评估' },
  { name: 'seedance-post-production',      path: 'seedance-post-production',      desc: '后期制作' },
  { name: 'seedance-character-manager',    path: 'seedance-character-manager',    desc: '角色管理' },
  { name: 'seedance-choreography',         path: 'seedance-choreography',         desc: '动作编排' },
  { name: 'seedance-delivery-engine',      path: 'seedance-delivery-engine',      desc: '通用交付引擎' },
  // Agent系统
  { name: 'shanhaijing-agent',            path: 'shanhaijing-agent',            desc: '山海经Agent' },
  { name: 'seedance-agent',                path: 'seedance-agent',                desc: '通用Agent' },
  // 其他山海经子系统
  { name: 'shanhaijing-ark-seedance-skill',path: 'shanhaijing-ark-seedance-skill',desc: 'ARK Seedance CLI' },
  { name: 'shanhaijing-character-manager', path: 'shanhaijing-character-manager', desc: '山海经角色管理' },
  { name: 'seedance-dialogue-engine',      path: 'seedance-dialogue-engine',      desc: '对白引擎' },
  { name: 'shanhaijing-cinematography',    path: 'shanhaijing-cinematography',    desc: '镜头设计' },
  { name: 'shanhaijing-promptforge',       path: 'shanhaijing-promptforge',       desc: '提示词锻造' },
  { name: 'shanhaijing-opening-title',     path: 'shanhaijing-opening-title',     desc: '开场标题' },
  { name: 'shanhaijing-persona-vault',      path: 'shanhaijing-persona-vault',     desc: '人格库' },
  { name: 'shanhaijing-voice-craft',       path: 'shanhaijing-voice-craft',       desc: '声线设计' },
  { name: 'shanhaijing-pitch-evaluation',  path: 'shanhaijing-pitch-evaluation',  desc: '提案评估' },
  { name: 'shanhaijing-post-production',    path: 'shanhaijing-post-production',   desc: '山海经后期' },
  { name: 'shanhaijing-pipeline',           path: 'shanhaijing-pipeline',           desc: '总管道' },
  { name: 'shanhaijing-integrator',         path: 'shanhaijing-integrator',         desc: '集成器' },
  { name: 'shanhaijing-soul-forge',         path: 'shanhaijing-soul-forge',         desc: '灵魂锻造' },
  { name: 'shanhaijing-world-engine',       path: 'shanhaijing-world-engine',       desc: '世界观引擎' },
  { name: 'shanhaijing-style-router',       path: 'shanhaijing-style-router',       desc: '风格路由' },
  { name: 'shanhaijing-micromotion',       path: 'shanhaijing-micromotion',       desc: '微动作' },
  { name: 'shanhaijing-narrative-consistency',path: 'shanhaijing-narrative-consistency',desc: '叙事一致性' },
  { name: 'shanhaijing-quality-oracle',     path: 'shanhaijing-quality-oracle',    desc: '质量预言机' },
  { name: 'shanhaijing-emotion-calculator', path: 'shanhaijing-emotion-calculator',desc: '情绪计算' },
  { name: 'shanhaijing-sensory-generator',  path: 'shanhaijing-sensory-generator', desc: '感官生成' },
  { name: 'shanhaijing-beast-motion',       path: 'shanhaijing-beast-motion',      desc: '异兽运动' },
  { name: 'shanhaijing-choreography',       path: 'shanhaijing-choreography',      desc: '动作编排' },
  { name: 'shanhaijing-ip-asset-manager',   path: 'shanhaijing-ip-asset-manager',  desc: 'IP资产管理' },
  { name: 'seedance2-storyboard-generator',  path: 'seedance2-storyboard-generator',desc: '故事板生成' },
  // 飞书插件
  { name: 'openclaw-lark',                  path: EXTENSIONS_DIR + '/openclaw-lark',desc: '飞书插件' },
  // workspace技能
  { name: 'workspace-skills',              path: WORKSPACE_SKILLS,                 desc: 'Workspace技能' },
];

// 排除规则
const EXCLUDE = ['.bak', 'node_modules', '.DS_Store'];

function shouldExclude(filePath) {
  return EXCLUDE.some(p => filePath.includes(p));
}

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const walk = (d, base = '') => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(d, e.name);
      const rp = path.join(base, e.name);
      if (shouldExclude(fp)) continue;
      if (e.isDirectory()) {
        walk(fp, rp);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (['.js', '.json', '.md', '.yaml', '.yml', '.txt'].includes(ext)) {
          files.push({ fullPath: fp, relPath: rp });
        }
      }
    }
  };
  walk(dir);
  return files;
}

function getExt(fp) {
  const map = { '.js': 'javascript', '.json': 'json', '.md': 'markdown', '.yaml': 'yaml', '.yml': 'yaml' };
  return map[path.extname(fp).toLowerCase()] || 'text';
}

function formatFile(f) {
  const sizeKb = (fs.statSync(f.fullPath).size / 1024).toFixed(1);
  let content = fs.readFileSync(f.fullPath, 'utf8');
  const lang = getExt(f.fullPath);
  return `### 📄 ${f.relPath} \`${sizeKb}KB\`\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
}

function generate() {
  let totalFiles = 0;
  let totalLines = 0;
  let totalSize = 0;

  let md = `# 山海经AI视频生成系统 · 全量安装包\n`;
  md += `> **版本**: v6.20-Peng（全量版）  \n`;
  md += `> **固化时间**: 2026-06-06  \n`;
  md += `> **安装路径**: \`~/workspace/agent/skills/\`  \n\n`;

  md += `## 安装说明\n\n`;
  md += `本MD含全部源码，复制到目标机器的 \`~/workspace/agent/skills/\` 目录，覆盖安装即可。\n\n`;
  md += `## 系统架构总览\n\n`;
  md += `\`\`\`\n`;
  md += `shanhaijing-director/        ← ⭐核心编排层（12阶段导演流水线）\n`;
  md += `  ├── story-core-system/     ← 内核（异兽视角叙事）\n`;
  md += `  ├── shanhaijing-bestiary/  ← 数据层（32只异兽档案）\n`;
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
    const files = getFiles(mod.path);
    if (files.length === 0) {
      console.warn(`⚠️  无文件: ${mod.name}`);
      continue;
    }

    let mLines = 0, mSize = 0;
    files.forEach(f => {
      const s = fs.statSync(f.fullPath).size;
      mSize += s;
      mLines += s; // 近似
    });
    mLines = files.reduce((sum, f) => sum + fs.statSync(f.fullPath).size, 0);

    md += `### ${mod.desc}\n\n`;
    md += `**模块**: \`${mod.name}\`  \n`;
    md += `**路径**: \`${mod.path}\`  \n`;
    md += `**文件**: ${files.length} | **行数**: ~${Math.round(mLines / 5)} | **大小**: ${(mSize / 1024).toFixed(1)}KB\n\n`;

    let modFileCount = 0;
    for (const f of files) {
      try {
        md += formatFile(f);
        totalFiles++;
        modFileCount++;
        totalSize += fs.statSync(f.fullPath).size;
      } catch (e) {
        console.warn(`⚠️  失败: ${f.relPath} - ${e.message}`);
      }
    }

    md += `---\n\n`;
    console.log(`✅ ${mod.name}: ${modFileCount}文件`);
  }

  md += `## 安装后验证\n\n`;
  md += `\`\`\`bash\n`;
  md += `cd ~/workspace/agent/skills/shanhaijing-director/scripts\n`;
  md += `node director-pipeline.js --help\n\n`;
  md += `node -e "const {Bestiary}=require('../shanhaijing-bestiary/bestiary.js'); console.log('异兽数:', Object.keys(new Bestiary().beasts).length)"\n`;
  md += `\`\`\`\n\n`;

  md += `---\n`;
  md += `**统计**: ${totalFiles} 文件 | ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;

  return md;
}

const md = generate();
fs.writeFileSync(OUTPUT_FILE, md, 'utf8');

const sizeMb = (Buffer.byteLength(md, 'utf8') / 1024 / 1024).toFixed(2);
console.log(`\n✅ 全量包生成完成`);
console.log(`📦 文件: ${OUTPUT_FILE}`);
console.log(`📊 大小: ~${sizeMb}MB`);
console.log(`📁 文件数: ${totalFiles}`);
