#!/usr/bin/env node
/**
 * Stormaxe AI 全量代码安装脚本
 * v6.30-Peng
 * 
 * 功能：
 * 1. 解析MD导出文件，重建完整代码库
 * 2. 安装时引导用户选择默认语言和视频时长
 * 3. 生成 .stormaxerc 配置文件，供 pipeline 读取
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MD_FILE = '/home/gem/workspace/agent/media/inbound/export-v6.17-peng-final---7699af7b-fc77-4af4-a97f-6cf28b7e8e06';
const SKILLS_ROOT = '/home/gem/workspace/agent/skills';
const WORKSPACE_ROOT = '/home/gem/workspace/agent/workspace';
const RC_FILE = path.join(WORKSPACE_ROOT, '.stormaxerc');

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function choose(question, options, defaultVal) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log(`\n${question}`);
    options.forEach((opt, i) => {
      const marker = opt.value === defaultVal ? '▶' : ' ';
      console.log(`  ${marker} [${i + 1}] ${opt.label}`);
    });
    const prompt = defaultVal
      ? `请选择 (默认${options.findIndex(o => o.value === defaultVal) + 1}) 或直接回车: `
      : '请选择: ';
    rl.question(prompt, answer => {
      rl.close();
      const idx = parseInt(answer) - 1;
      if (answer === '' && defaultVal) {
        resolve(defaultVal);
      } else if (idx >= 0 && idx < options.length) {
        resolve(options[idx].value);
      } else {
        resolve(defaultVal || options[0].value);
      }
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('⚡ Stormaxe AI Video System — 安装向导 v6.30-Peng');
  console.log('='.repeat(60));

  // ============ 步骤1: 语言选择 ============
  console.log('\n📌 步骤 1/3: 选择默认语言');
  console.log('   (后续制作时可按项目灵活调整)');
  const language = await choose('   台词/标题默认使用哪种语言？', [
    { value: 'en', label: '英文 (English) — 推荐，AI视频主流语言' },
    { value: 'zh', label: '中文 (中文) — 适合中文市场内容' }
  ], 'en');

  // ============ 步骤2: 视频时长选择 ============
  console.log('\n📌 步骤 2/3: 选择默认视频时长');
  const duration = await choose('   默认视频时长？', [
    { value: '30', label: '30秒 — 抖音/快手爆款节奏，适合热点内容' },
    { value: '60', label: '60秒 — 标准短片，充分展示故事' },
    { value: '90', label: '90秒 — 深度叙事，有更多叙事空间' },
    { value: '120', label: '120秒 — 完整故事，但需联系作者获取中长视频系统' }
  ], '60');

  // ============ 步骤3: 确认安装 ============
  console.log('\n📌 步骤 3/3: 安装确认');
  console.log(`   默认语言: ${language === 'en' ? '英文 (English)' : '中文 (中文)'}`);
  console.log(`   默认时长: ${duration}秒`);
  if (duration === '120') {
    console.log('   ⚠️  120秒需联系作者获取中长视频系统 (Genius)');
  }
  const confirm = await ask('\n   按回车开始安装，或 Ctrl+C 退出: ');

  // ============ 写入配置文件 ============
  const rcConfig = {
    version: 'v6.30-Peng',
    installDate: new Date().toISOString(),
    defaults: {
      language: language,          // 'en' | 'zh'
      duration: parseInt(duration) // 30 | 60 | 90 | 120
    }
  };
  fs.writeFileSync(RC_FILE, JSON.stringify(rcConfig, null, 2), 'utf8');
  console.log(`\n✅ 配置已保存到 .stormaxerc`);
  console.log(`   language: ${language}`);
  console.log(`   duration: ${duration}s`);

  // ============ 安装代码 ============
  console.log('\n📖 读取安装包...');
  if (!fs.existsSync(MD_FILE)) {
    console.error(`❌ 安装包不存在: ${MD_FILE}`);
    console.error('   请先获取 StormaxeAI视频生成系统-全量源码安装包-v6.XX.md 文件');
    process.exit(1);
  }
  const content = fs.readFileSync(MD_FILE, 'utf8');

  const fileRegex = /## FILE: (.+?)\n\n```[\w-]*\n([\s\S]*?)```/g;
  let match;
  let count = 0;
  let errors = [];

  const files = [];
  while ((match = fileRegex.exec(content)) !== null) {
    const filePath = match[1].trim();
    const fileContent = match[2];
    files.push({ path: filePath, content: fileContent });
  }

  console.log(`\n📦 发现 ${files.length} 个文件，开始创建...\n`);

  for (const { path: filePath, content } of files) {
    try {
      let targetPath;

      if (filePath.startsWith('./skills/')) {
        targetPath = path.join(SKILLS_ROOT, filePath.replace(/^\.\/skills\//, ''));
      } else if (filePath.startsWith('./')) {
        targetPath = path.join(WORKSPACE_ROOT, filePath.replace(/^\.\//, ''));
      } else if (filePath.startsWith('skills/')) {
        targetPath = path.join(SKILLS_ROOT, filePath.replace(/^skills\//, ''));
      } else {
        targetPath = path.join(WORKSPACE_ROOT, filePath);
      }

      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(targetPath, content, 'utf8');
      count++;

      const ext = path.extname(filePath);
      const isJs = ext === '.js';
      const isJson = ext === '.json';
      const isMd = ext === '.md';

      let type = 'OTHER';
      if (isJs) type = '  JS';
      else if (isJson) type = 'JSON';
      else if (isMd) type = '  MD';

      console.log(`  ✅ [${type}] ${filePath}`);

    } catch (err) {
      errors.push({ path: filePath, error: err.message });
      console.log(`  ❌ ${filePath}: ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 安装完成！成功: ${count} 个文件`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} 个文件失败:`);
    errors.forEach(e => console.log(`  - ${e.path}: ${e.error}`));
  }

  const jsCount = files.filter(f => f.path.endsWith('.js')).length;
  const jsonCount = files.filter(f => f.path.endsWith('.json')).length;
  const mdCount = files.filter(f => f.path.endsWith('.md')).length;

  console.log(`\n📊 统计:`);
  console.log(`  - JS文件: ${jsCount}`);
  console.log(`  - JSON文件: ${jsonCount}`);
  console.log(`  - MD文件: ${mdCount}`);
  console.log(`  - 总计: ${files.length}`);

  console.log(`\n${'='.repeat(60)}`);
  console.log('⚡ 下一步:');
  console.log('  1. cp .env.example .env  # 填入你的 API Key');
  console.log('  2. node skills/shanhaijing-director/scripts/director-pipeline.js pre-production \\\\');
  console.log('       --production-dir ./productions/my-first-video \\\\');
  console.log('       --worldview nirath');
  console.log(`\n  默认语言: ${language}  |  默认时长: ${duration}s`);
  console.log(`  如需调整，随时可用 --language zh/en 和 --duration 30/60/90 参数覆盖`);
  console.log('='.repeat(60));
}

main().catch(console.error);
