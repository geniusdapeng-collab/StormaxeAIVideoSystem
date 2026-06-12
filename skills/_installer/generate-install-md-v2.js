#!/usr/bin/env node
/**
 * 生成山海经AI视频生成系统安装包MD文件 v2（完整版）
 * 修复：加入director.js顶层层、shanhaijing-cinematography、seedance-render-engine等懒加载依赖
 */
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/home/gem/workspace/agent/skills';
const OUTPUT_FILE = path.join(SKILLS_DIR, 'shanhaijing-video-system-install-v6.20-Peng.md');

// 完整模块清单（v2 - 修复懒加载依赖遗漏）
const MODULES = [
  {
    name: 'shanhaijing-bestiary',
    desc: '【数据层】异兽图鉴数据库（含32只核心异兽完整档案）',
    path: 'shanhaijing-bestiary',
    notes: 'appearance/abilities/soul/voice五维数据'
  },
  {
    name: 'seedance-dialogue-engine',
    desc: '【对话层】对白引擎（逐镜台词+唇形同步）',
    path: 'seedance-dialogue-engine',
    notes: 'LIP_SYNC ENGINE'
  },
  {
    name: 'shanhaijing-character-manager',
    desc: '【角色层】角色资产管理器',
    path: 'shanhaijing-character-manager',
    notes: '角色锚定/一致性校验'
  },
  {
    name: 'shanhaijing-beast-archive',
    desc: '【数据层】异兽档案库（外观/动作/音效/神韵数据）',
    path: 'shanhaijing-beast-archive',
    notes: '异兽运动/音效/质感详细档案'
  },
  {
    name: 'story-core-system',
    desc: '【内核层】Story Core内核（异兽视角叙事）',
    path: 'story-core-system',
    notes: '异兽视角/旁白禁止/角色定妆照铁律'
  },
  {
    name: 'shanhaijing-story-engine',
    desc: '【叙事层】故事引擎（异兽视角注入+对白）',
    path: 'shanhaijing-story-engine',
    notes: 'beast-perspective-injector + dialogue-engine'
  },
  {
    name: 'shanhaijing-cinematography',
    desc: '【镜头层】电影感镜头设计器',
    path: 'shanhaijing-cinematography',
    notes: '镜头语言/情绪曲线，懒加载依赖'
  },
  {
    name: 'seedance-render-engine',
    desc: '【渲染层】Seedance渲染引擎（提示词三层架构）',
    path: 'seedance-render-engine',
    notes: 'prompt-three-layer/prompt-engine-v2/emotion-visual-translator'
  },
  {
    name: 'shanhaijing-render-engine',
    desc: '【渲染层】山海经渲染引擎（TTS+FFmpeg）',
    path: 'shanhaijing-render-engine',
    notes: 'seedance-render-wrapper/tts-engine'
  },
  {
    name: 'shanhaijing-delivery-engine',
    desc: '【交付层】视频交付引擎（FFmpeg合成）',
    path: 'shanhaijing-delivery-engine',
    notes: '音频合成/格式转换'
  },
  {
    name: 'shanhaijing-director',
    desc: '【编排层】导演预生产流水线（12阶段主演练）⭐核心入口',
    path: 'shanhaijing-director',
    notes: '⚠️ 必须完整：含director.js顶层层+scripts全部+docs全部'
  }
];

// 排除规则
const EXCLUDE = ['.bak', 'node_modules', '.DS_Store', 'pre-production/00-prd/', 'pre-production/01-story/'];

function shouldExclude(filePath) {
  return EXCLUDE.some(p => filePath.includes(p));
}

function getFilesForModule(module) {
  const modulePath = path.join(SKILLS_DIR, module.path);
  if (!fs.existsSync(modulePath)) {
    console.warn(`⚠️  模块不存在: ${module.path}`);
    return [];
  }

  const files = [];
  const walkDir = (dir, base = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name);
      if (shouldExclude(fullPath)) continue;
      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else {
        const ext = path.extname(entry.name);
        if (['.js', '.json', '.md', '.yaml', '.yml', '.txt'].includes(ext)) {
          files.push({ fullPath, relPath });
        }
      }
    }
  };
  walkDir(modulePath);
  return files;
}

function getExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.js': 'javascript', '.json': 'json', '.md': 'markdown',
    '.yaml': 'yaml', '.yml': 'yaml', '.txt': 'text'
  };
  return map[ext] || 'text';
}

function formatFileAsMd(filePath, relPath) {
  const stat = fs.statSync(filePath);
  const sizeKb = (stat.size / 1024).toFixed(1);
  let content = fs.readFileSync(filePath, 'utf8');
  const lang = getExt(filePath);

  const header = `### 📄 ${relPath} \`${sizeKb}KB\`\n`;
  const codeBlock = `\`\`\`${lang}\n${content}\n\`\`\`\n`;
  return header + codeBlock;
}

function generateInstallMd() {
  let totalFiles = 0;
  let totalSize = 0;

  let md = `# 山海经AI视频生成系统 · 一键安装包\n`;
  md += `> **版本**: v6.20-Peng (完整版)  \n`;
  md += `> **固化时间**: 2026-06-06  \n`;
  md += `> **安装路径**: \`~/workspace/agent/skills/\`  \n\n`;

  md += `## 快速安装\n\n`;
  md += '```bash\n';

  md += `# 在目标机器的 ~/workspace/agent/skills/ 目录下执行\n`;
  md += `# 本MD文件含所有源码，可直接提取覆盖安装\n`;
  md += `\`\`\`\n\n`;

  md += `## 系统架构\n\n`;
  md += `\`\`\`\n`;
  md += `shanhaijing-director/        ← ⭐编排层（唯一入口）\n`;
  md += `  ├── director.js           ← 顶层核心模块（含所有常量）\n`;
  md += `  ├── SKILL.md\n`;
  md += `  └── scripts/\n`;
  md += `      ├── director-pipeline.js  ← 12阶段主演练入口\n`;
  md += `      ├── stage-runner.js      ← 阶段运行器\n`;
  md += `      ├── seedream-wrapper.js  ← 定妆照生成\n`;
  md += `      ├── llm-caller.js        ← LLM调用（含record/replay）\n`;
  md += `      ├── smart-quality-calibration.js  ← 质量校准\n`;
  md += `      ├── prompt-metrics.js     ← 提示词质量清单\n`;
  md += `      ├── shanhaijing-cinematography/ ← 镜头设计（懒加载）\n`;
  md += `      └── seedance-render-engine/  ← 渲染引擎（懒加载）\n`;
  md += `      ├── story-core-system/  ← 内核层\n`;
  md += `      ├── shanhaijing-bestiary/  ← 数据层（32只异兽）\n`;
  md += `      └── shanhaijing-delivery-engine/  ← 交付层\n`;
  md += `\`\`\`\n\n`;

  md += `## 核心模块清单（${MODULES.length}个）\n\n`;

  for (const module of MODULES) {
    const files = getFilesForModule(module);
    if (files.length === 0) {
      console.warn(`⚠️  跳过（无文件）: ${module.name}`);
      continue;
    }

    let moduleSize = 0;
    files.forEach(f => { moduleSize += fs.statSync(f.fullPath).size; });

    md += `### ${module.desc}\n\n`;
    md += `**模块路径**: \`skills/${module.path}/\`  \n`;
    md += `**说明**: ${module.notes}  \n`;
    md += `**文件数**: ${files.length} | **大小**: ${(moduleSize / 1024).toFixed(1)}KB\n\n`;

    for (const file of files) {
      try {
        md += formatFileAsMd(file.fullPath, file.relPath);
        totalFiles++;
        totalSize += fs.statSync(file.fullPath).size;
      } catch (e) {
        console.warn(`⚠️  读取失败: ${file.relPath} - ${e.message}`);
      }
    }

    md += `---\n\n`;
  }

  md += `## 安装后验证\n\n`;
  md += `\`\`\`bash\n`;
  md += `cd ~/workspace/agent/skills/shanhaijing-director/scripts\n`;
  md += `node director-pipeline.js --help\n\n`;
  md += `node -e "const {Bestiary}=require('../shanhaijing-bestiary/bestiary.js'); console.log('异兽数:', Object.keys(new Bestiary().beasts).length)"\n\n`;
  md += `node -e "const {ShanhaiDirector}=require('../shanhaijing-director/director.js'); console.log('常量OK')"\n\n`;
  md += `node -e "const {StoryCoreOrchestrator}=require('../story-core-system/story-core-orchestrator.js'); console.log('StoryCore OK')"\n`;
  md += `\`\`\`\n\n`;

  md += `## 依赖说明\n\n`;
  md += `| 模块 | 依赖 | 说明 |\n`;
  md += `|------|------|------|\n`;
  md += `| shanhaijing-director | Node.js ≥18 | 主编排引擎 |\n`;
  md += `| seedance-render-engine | FFmpeg, ARK API Key | 视频渲染 |\n`;
  md += `| shanhaijing-render-engine | FFmpeg, TTS | 音频合成 |\n`;
  md += `| shanhaijing-delivery-engine | FFmpeg | 视频合成 |\n\n`;

  md += `---\n`;
  md += `**统计**: ${totalFiles} 个文件 | ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;

  return md;
}

const md = generateInstallMd();
fs.writeFileSync(OUTPUT_FILE, md, 'utf8');

const sizeMb = (Buffer.byteLength(md, 'utf8') / 1024 / 1024).toFixed(2);
console.log(`✅ 生成完成: ${OUTPUT_FILE}`);
console.log(`📦 总文件: ${totalFiles} | 大小: ~${sizeMb}MB`);
