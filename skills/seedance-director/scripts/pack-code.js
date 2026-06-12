const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/root/.openclaw/workspace/skills';
const DIRECTOR_DIR = path.join(SKILLS_DIR, 'seedance-director');
const OUTPUT = '/tmp/v5.6-Peng-auto-pack.md';

function loadDependencies() {
  const depsFile = path.join(DIRECTOR_DIR, 'dependencies.json');
  if (!fs.existsSync(depsFile)) {
    throw new Error('dependencies.json 不存在，请先创建依赖声明文件');
  }
  return JSON.parse(fs.readFileSync(depsFile, 'utf8'));
}

function collectFilesRecursive(dir, patterns, ignoreSet) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(SKILLS_DIR, fullPath);
    
    if (entry.isDirectory()) {
      // 检查是否在忽略列表
      if (ignoreSet.has(entry.name)) continue;
      files.push(...collectFilesRecursive(fullPath, patterns, ignoreSet));
    } else {
      // 检查文件扩展名是否匹配
      const ext = path.extname(entry.name).slice(1);
      if (patterns.includes(ext)) {
        // 检查是否匹配RELEASE*/HARDCODE*文件名
        if (entry.name.startsWith('RELEASE') || entry.name.startsWith('HARDCODE')) continue;
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function collectFiles(deps, includeOptional = true) {
  const files = new Set();
  
  // 所有需要打包的模块 = required + optional（if includeOptional）
  const allModules = {
    ...deps.dependencies,
    ...(includeOptional ? deps.optionalDependencies : {}),
    ...(includeOptional ? deps.devDependencies : {})
  };
  
  const ignoreSet = new Set(['node_modules', 'test', 'tests', '__tests__', 'package-lock.json']);
  const patterns = ['js', 'md', 'json'];
  
  for (const [name, info] of Object.entries(allModules)) {
    const modulePath = path.join(SKILLS_DIR, name);
    if (!fs.existsSync(modulePath)) {
      console.log(`⚠️  跳过缺失模块: ${name}`);
      continue;
    }
    
    const moduleFiles = collectFilesRecursive(modulePath, patterns, ignoreSet);
    moduleFiles.forEach(f => files.add(f));
    console.log(`✅ ${name}: ${moduleFiles.length} 文件`);
  }
  
  return [...files].sort();
}

function generatePack(files) {
  const deps = loadDependencies();
  
  let output = `# Seedance Director v5.6-Peng 自动打包代码包
# 一键安装用MD文件
# 生成方式: 依赖声明驱动 + 自动递归扫描
# 总文件数: ${files.length}
# 生成时间: ${new Date().toISOString()}

---

## 安装说明

### 1. 前置检查

\`\`\`bash
node seedance-director/scripts/verify-dependencies.js --strict
\`\`\`

### 2. 创建目录结构

\`\`\`bash
cd ~/.openclaw/workspace/skills

# 自动创建所有依赖模块目录
${Object.entries({...deps.dependencies, ...deps.optionalDependencies}).map(([name]) => `mkdir -p ${name}/scripts`).join('\n')}
\`\`\`

### 3. 安装依赖

\`\`\`bash
cd seedance-post-production && npm install
cd ../byted-ark-seedance-skill && npm install 2>/dev/null || true
\`\`\`

### 4. 运行测试

\`\`\`bash
node seedance-director/scripts/director.js produce \
  --title "测试" --duration 30 \
  --outline "起幕：测试场景" \
  --style "3D国漫CG" \
  --skip-render
\`\`\`

---

## 模块清单

| 模块 | 类型 | 用途 |
|------|------|------|
${Object.entries(deps.dependencies).map(([name, info]) => `| ${name} | required | ${info.reason} |`).join('\n')}
${Object.entries(deps.optionalDependencies || {}).map(([name, info]) => `| ${name} | optional | ${info.reason} |`).join('\n')}

---

`;

  let totalLines = 0;
  let totalChars = 0;
  let missingCount = 0;

  for (const fullPath of files) {
    if (!fs.existsSync(fullPath)) {
      missingCount++;
      continue;
    }
    
    const relPath = path.relative(SKILLS_DIR, fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
    totalChars += content.length;
    
    const ext = path.extname(relPath).slice(1) || 'text';
    output += `\n## ${relPath}\n\n\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
  }

  output += `\n---\n\n# 统计信息\n\n- 总文件数: ${files.length}\n- 有效文件: ${files.length - missingCount}\n- 总行数: ${totalLines}\n- 总字符数: ${totalChars}\n- 预估大小: ${(totalChars/1024).toFixed(1)}KB\n- 打包方式: 依赖声明驱动 + 递归自动扫描\n\n`;

  fs.writeFileSync(OUTPUT, output);
  const stat = fs.statSync(OUTPUT);
  
  return {
    fileCount: files.length,
    validCount: files.length - missingCount,
    totalLines,
    totalChars,
    sizeMB: stat.size / 1024 / 1024
  };
}

// 主入口
console.log('🚀 开始自动打包...\n');

const deps = loadDependencies();
console.log(`📦 依赖声明: seedance-director ${deps.version}`);
console.log(`   Required: ${Object.keys(deps.dependencies).length} 个`);
console.log(`   Optional: ${Object.keys(deps.optionalDependencies || {}).length} 个`);
console.log(`   Dev: ${Object.keys(deps.devDependencies || {}).length} 个\n`);

const files = collectFiles(deps, true); // include optional
console.log(`\n📁 共收集 ${files.length} 个文件\n`);

const stats = generatePack(files);

console.log(`✅ 自动打包完成: ${OUTPUT}`);
console.log(`   文件数: ${stats.fileCount}`);
console.log(`   有效: ${stats.validCount}`);
console.log(`   总行数: ${stats.totalLines.toLocaleString()}`);
console.log(`   总字符: ${stats.totalChars.toLocaleString()}`);
console.log(`   大小: ${stats.sizeMB.toFixed(2)}MB`);
