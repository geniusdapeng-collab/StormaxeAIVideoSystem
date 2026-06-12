#!/usr/bin/env node
/**
 * Dependency Verifier — 依赖完整性检查

 * 用途:
 *   - 安装后运行: node verify-dependencies.js
 *   - 打包前运行: node verify-dependencies.js --strict
 *   - CI/CD集成: 自动检查所有required依赖是否齐全
 * 
 * 输出:
 *   - 所有依赖齐全 → exit 0
 *   - 有缺失依赖 → exit 1 + 打印缺失清单
 */

const fs = require('fs');
const path = require('path');

const DEPS_FILE = path.join(__dirname, '../dependencies.json');
const SKILLS_DIR = path.join(require('os').homedir(), '.openclaw/workspace/skills');

function loadDependencies() {
  if (!fs.existsSync(DEPS_FILE)) {
    console.error(`❌ dependencies.json 不存在: ${DEPS_FILE}`);
    console.error('   请确保在 seedance-director/ 目录下运行此脚本');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(DEPS_FILE, 'utf8'));
}

function checkDependency(name, info, strict = false) {
  const fullPath = path.join(SKILLS_DIR, name.replace(/^\.\.\//, ''));
  const entryFile = info.entry ? path.join(fullPath, info.entry) : null;
  
  // 检查技能目录是否存在
  const dirExists = fs.existsSync(fullPath);
  
  // 检查入口文件是否存在（如果有声明）
  const entryExists = entryFile ? fs.existsSync(entryFile) : true;
  
  const status = {
    name,
    required: info.required,
    dirExists,
    entryExists,
    path: fullPath,
    entry: entryFile,
    reason: info.reason
  };
  
  return status;
}

function verify(args = []) {
  const strict = args.includes('--strict');
  const deps = loadDependencies();
  
  console.log(`\n🔍 检查依赖完整性 — seedance-director ${deps.version || 'unknown'}`);
  console.log(`   工作目录: ${SKILLS_DIR}`);
  console.log(`   模式: ${strict ? '严格模式（含optional）' : '标准模式（仅required）'}`);
  console.log('');
  
  const allDeps = {
    ...deps.dependencies,
    ...(strict ? deps.optionalDependencies : {}),
    ...(strict ? deps.devDependencies : {})
  };
  
  const results = [];
  const errors = [];
  const warnings = [];
  
  for (const [name, info] of Object.entries(allDeps)) {
    const result = checkDependency(name, info, strict);
    results.push(result);
    
    if (!result.dirExists) {
      if (result.required) {
        errors.push(`❌ ${name} 目录缺失 (${result.reason})`);
      } else {
        warnings.push(`⚠️  ${name} 目录缺失 (可选依赖，${result.reason})`);
      }
    } else if (!result.entryExists) {
      if (result.required) {
        errors.push(`❌ ${name} 入口文件缺失: ${result.entry}`);
      } else {
        warnings.push(`⚠️  ${name} 入口文件缺失: ${result.entry} (可选)`);
      }
    } else {
      console.log(`✅ ${name} ${result.required ? '[required]' : '[optional]'}`);
    }
  }
  
  // 打印警告
  if (warnings.length > 0) {
    console.log('\n⚠️  可选依赖缺失（不影响运行）:');
    warnings.forEach(w => console.log(`   ${w}`));
  }
  
  // 打印错误
  if (errors.length > 0) {
    console.log('\n❌ 必须依赖缺失（运行会崩溃）:');
    errors.forEach(e => console.log(`   ${e}`));
    console.log('\n💡 修复方法:');
    console.log('   1. 确保所有技能目录在 ~/.openclaw/workspace/skills/ 下');
    console.log('   2. 从完整代码包复制缺失的模块');
    console.log('   3. 或运行: node scripts/verify-dependencies.js --fix（如支持）');
    process.exit(1);
  }
  
  console.log('\n✅ 所有依赖齐全，系统可正常运行');
  process.exit(0);
}

// 主入口
if (require.main === module) {
  verify(process.argv.slice(2));
}

module.exports = { verify, checkDependency };