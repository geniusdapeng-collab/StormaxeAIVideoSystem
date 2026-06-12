#!/usr/bin/env node
/**
 * 生成山海经AI视频生成系统安装包MD文件
 * 输出: shanhaijing-video-system-install-v6.20-Peng.md
 */
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/home/gem/workspace/agent/skills';
const OUTPUT_FILE = path.join(SKILLS_DIR, 'shanhaijing-video-system-install-v6.20-Peng.md');

// 要打包的核心模块（按依赖顺序）
const MODULES = [
  {
    name: 'shanhaijing-bestiary',
    desc: '【数据层】异兽图鉴数据库（含32只核心异兽完整档案）',
    path: 'shanhaijing-bestiary',
    include: ['bestiary.js', 'lore-drama-adapter.js', 'SKILL.md']
  },
  {
    name: 'seedance-dialogue-engine',
    desc: '【对话层】对白引擎（逐镜台词+唇形同步）',
    path: 'seedance-dialogue-engine',
    include: ['*.js', '*.md']
  },
  {
    name: 'shanhaijing-character-manager',
    desc: '【角色层】角色资产管理器',
    path: 'shanhaijing-character-manager',
    include: ['*.js', '*.json', '*.md']
  },
  {
    name: 'shanhaijing-beast-archive',
    desc: '【数据层】异兽档案库（外观/动作/音效/神韵数据）',
    path: 'shanhaijing-beast-archive',
    include: ['**/*.json', '**/*.md']
  },
  {
    name: 'story-core-system',
    desc: '【内核层】Story Core内核（异兽视角叙事）',
    path: 'story-core-system',
    include: ['*.js', '*.md']
  },
  {
    name: 'shanhaijing-render-engine',
    desc: '【渲染层】Seedance渲染引擎（12阶段流水线）',
    path: 'shanhaijing-render-engine',
    include: ['*.js', '*.json', '*.md']
  },
  {
    name: 'shanhaijing-delivery-engine',
    desc: '【交付层】视频交付引擎（FFmpeg合成+TTS）',
    path: 'shanhaijing-delivery-engine',
    include: ['*.js', '*.md']
  },
  {
    name: 'shanhaijing-director',
    desc: '【编排层】导演预生产流水线（12阶段主演练）',
    path: 'shanhaijing-director',
    include: ['SKILL.md', 'PREPRODUCTION-FLOW*.md', 'RELEASE*.md', 'director.js',
               'scripts/*.js',
               'scripts/*.json',
               'scripts/*.md',
               'docs/*.md',
               'docs/*.json']
  }
];

// 排除规则
const EXCLUDE_PATTERNS = ['.bak', 'node_modules', '.DS_Store', 'pre-production/00-prd/', 'pre-production/01-story/'];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(p => filePath.includes(p));
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
        // 检查是否匹配include
        const ext = path.extname(entry.name);
        const isCode = ['.js', '.json', '.md', '.yaml', '.yml'].includes(ext);
        if (isCode) {
          files.push({ fullPath, relPath });
        }
      }
    }
  };

  walkDir(modulePath);
  return files;
}

function formatFileAsMd(filePath, relPath) {
  const ext = path.extname(filePath);
  const stat = fs.statSync(filePath);
  const sizeKb = (stat.size / 1024).toFixed(1);

  let content = fs.readFileSync(filePath, 'utf8');

  let lang = 'text';
  if (ext === '.js') lang = 'javascript';
  else if (ext === '.json') lang = 'json';
  else if (ext === '.md') lang = 'markdown';
  else if (ext === '.yaml' || ext === '.yml') lang = 'yaml';

  const header = `### 📄 ${relPath} \`${sizeKb}KB\`\n`;
  const codeBlock = `\`\`\`${lang}\n${content}\n\`\`\`\n`;

  return header + codeBlock;
}

function generateInstallMd() {
  let totalFiles = 0;
  let totalSize = 0;

  let md = `# 山海经AI视频生成系统 · 一键安装包\n`;
  md += `> **版本**: v6.20-Peng  \n`;
  md += `> **固化时间**: 2026-06-06  \n`;
  md += `> **安装路径**: \`~/workspace/agent/skills/\`  \n\n`;

  md += `## 快速安装\n\n`;
  md += `\`\`\`bash\n`;
  md += `# 1. 复制本MD文件内容到目标机器\n`;
  md += `# 2. 执行以下脚本（自动读取MD中的代码块并安装）\n`;
  md += `cat shanhaijing-video-system-install-v6.20-Peng.md | \\\n`;
  md += `  grep -A 10000 "## 核心模块" | \\\n`;
  md += `  grep -B 1 -A 9999 "^\\\`\\\`\\\`" | \\\n`;
  md += `  sed 's/^### 📄 //g' | \\\n`;
  md += `  sed 's/ \`.*KB\`$//g' > /tmp/install.sh && bash /tmp/install.sh\n`;
  md += `\`\`\`\n\n`;

  md += `## 系统架构\n\n`;
  md += `\`\`\`\n`;
  md += `shanhaijing-director/        ← 编排层（12阶段导演流水线）\n`;
  md += `  ├── story-core-system/     ← 内核层（异兽视角StoryCore）\n`;
  md += `  │   ├── story-core-orchestrator.js\n`;
  md += `  │   ├── beast-perspective-engine.js\n`;
  md += `  │   └── lore-drama-adapter.js\n`;
  md += `  ├── shanhaijing-bestiary/ ← 数据层（32只异兽档案）\n`;
  md += `  │   ├── bestiary.js        ← 异兽外观/灵魂/声线\n`;
  md += `  │   └── lore-drama-adapter.js\n`;
  md += `  ├── shanhaijing-render-engine/  ← 渲染层（Seedance调用）\n`;
  md += `  │   ├── seedance-render-engine.js\n`;
  md += `  │   └── tts-engine.js\n`;
  md += `  ├── shanhaijing-delivery-engine/ ← 交付层（FFmpeg合成）\n`;
  md += `  ├── shanhaijing-character-manager/  ← 角色层\n`;
  md += `  ├── seedance-dialogue-engine/  ← 对白层\n`;
  md += `  └── shanhaijing-beast-archive/ ← 数据层（异兽详细档案）\n`;
  md += `\`\`\`\n\n`;

  md += `## 核心模块\n\n`;

  for (const module of MODULES) {
    const files = getFilesForModule(module);
    if (files.length === 0) continue;

    let moduleSize = 0;
    files.forEach(f => { moduleSize += fs.statSync(f.fullPath).size; });

    md += `### ${module.desc}\n\n`;
    md += `**模块路径**: \`skills/${module.path}/\`  \n`;
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
  md += `# 验证director-pipeline可运行\n`;
  md += `cd ~/workspace/agent/skills/shanhaijing-director/scripts\n`;
  md += `node director-pipeline.js --help\n\n`;
  md += `# 验证bestiary数据\n`;
  md += `node -e "const {Bestiary}=require('../shanhaijing-bestiary/bestiary.js'); console.log(Object.keys(new Bestiary().beasts).length)"\n\n`;
  md += `# 验证story-core\n`;
  md += `node -e "const {StoryCoreOrchestrator}=require('../story-core-system/story-core-orchestrator.js'); console.log('OK')"\n`;
  md += `\`\`\`\n\n`;

  md += `## 依赖说明\n\n`;
  md += `| 模块 | 依赖 | 说明 |\n`;
  md += `|------|------|------|\n`;
  md += `| shanhaijing-director | Node.js ≥18 | 主编排引擎 |\n`;
  md += `| shanhaijing-render-engine | FFmpeg, ARK API Key | 视频渲染 |\n`;
  md += `| shanhaijing-delivery-engine | FFmpeg | 视频合成 |\n`;
  md += `| seedance-dialogue-engine | FFmpeg | 音频合成 |\n\n`;

  md += `---\n`;
  md += `**统计**: ${totalFiles} 个文件 | ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;

  return md;
}

const md = generateInstallMd();
fs.writeFileSync(OUTPUT_FILE, md, 'utf8');

const sizeMb = (Buffer.byteLength(md, 'utf8') / 1024 / 1024).toFixed(2);
console.log(`✅ 生成完成: ${OUTPUT_FILE}`);
console.log(`📦 总文件: ${require('fs').statSync(OUTPUT_FILE).size} bytes (~${sizeMb}MB)`);
