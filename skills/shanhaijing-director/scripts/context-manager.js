#!/usr/bin/env node
/**
 * Context Manager v1.0-Peng
 * 自动清理workspace bootstrap文件，防止上下文膨胀导致系统卡死
 * 触发阈值: 总大小 > 60K 或单个文件 > 20K
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const ARCHIVE_DIR = path.join(WORKSPACE, 'memory', 'archive');
const TOTAL_THRESHOLD = 60 * 1024; // 60K总阈值
const SINGLE_THRESHOLD = 20 * 1024; // 单个文件20K
const MEMORY_KEEP_LINES = 200; // MEMORY.md保留最近200行
const USER_KEEP_LINES = 150; // USER.md保留最近150行

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getFileSize(file) {
  try {
    return fs.statSync(file).size;
  } catch { return 0; }
}

function archiveFile(sourceFile, archiveName) {
  const content = fs.readFileSync(sourceFile, 'utf8');
  const lines = content.split('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(ARCHIVE_DIR, `${archiveName}-${timestamp}.md`);
  
  fs.writeFileSync(archivePath, content, 'utf8');
  console.log(`📦 归档完成: ${archiveName} → ${archivePath} (${(content.length/1024).toFixed(1)}K)`);
  return { lines, archivePath };
}

function trimMemoryMd() {
  const file = path.join(WORKSPACE, 'MEMORY.md');
  const size = getFileSize(file);
  if (size < SINGLE_THRESHOLD) return { action: 'skip', size };
  
  const { lines, archivePath } = archiveFile(file, 'MEMORY');
  // 保留最后200行（最近的工作记录）
  const keepLines = lines.slice(-MEMORY_KEEP_LINES);
  const header = `# MEMORY.md — 自动清理后保留（最近${MEMORY_KEEP_LINES}行）\n\n> 完整历史已归档: ${path.basename(archivePath)}\n> 归档时间: ${new Date().toISOString()}\n\n`;
  fs.writeFileSync(file, header + keepLines.join('\n'), 'utf8');
  const newSize = fs.statSync(file).size;
  console.log(`✂️ MEMORY.md: ${(size/1024).toFixed(1)}K → ${(newSize/1024).toFixed(1)}K`);
  return { action: 'trimmed', before: size, after: newSize };
}

function trimUserMd() {
  const file = path.join(WORKSPACE, 'USER.md');
  const size = getFileSize(file);
  if (size < SINGLE_THRESHOLD) return { action: 'skip', size };
  
  const { lines, archivePath } = archiveFile(file, 'USER');
  // 激进精简：只保留基本信息（身份/职业/家庭等）+ 归档提示
  const identityEnd = lines.findIndex(l => l.startsWith('## Long-Term Memory'));
  const identityLines = identityEnd > 0 ? lines.slice(0, identityEnd) : lines.slice(0, 30);
  // 只保留身份部分中前30个非空行
  const identityTrimmed = identityLines.filter(l => l.trim()).slice(0, 30);
  const newContent = identityTrimmed.join('\n') + '\n\n## Long-Term Memory (LTM)\n\n> LTM内容已归档至: ' + path.basename(archivePath) + '\n> 最新归档时间: ' + new Date().toISOString() + '\n\n## Short-Term Memory (STM)\n\n> STM内容已归档，完整记录见归档文件\n> 最新归档时间: ' + new Date().toISOString() + '\n';
  fs.writeFileSync(file, newContent, 'utf8');
  const newSize = fs.statSync(file).size;
  console.log(`✂️ USER.md: ${(size/1024).toFixed(1)}K → ${(newSize/1024).toFixed(1)}K`);
  return { action: 'trimmed', before: size, after: newSize };
}

function checkAndClean() {
  console.log('\n🔍 Context Manager v1.0-Peng — 上下文大小检查');
  console.log('================================================');
  
  const files = [
    { name: 'MEMORY.md', path: path.join(WORKSPACE, 'MEMORY.md') },
    { name: 'USER.md', path: path.join(WORKSPACE, 'USER.md') },
    { name: 'SOUL.md', path: path.join(WORKSPACE, 'SOUL.md') },
    { name: 'AGENTS.md', path: path.join(WORKSPACE, 'AGENTS.md') },
  ];
  
  let total = 0;
  const report = [];
  for (const f of files) {
    const size = getFileSize(f.path);
    total += size;
    report.push(`${f.name}: ${(size/1024).toFixed(1)}K`);
  }
  
  console.log('📊 当前文件大小:');
  report.forEach(r => console.log(`  ${r}`));
  console.log(`  合计: ${(total/1024).toFixed(1)}K (阈值: ${TOTAL_THRESHOLD/1024}K)`);
  
  if (total > TOTAL_THRESHOLD) {
    console.log(`\n⚠️ 总大小 ${(total/1024).toFixed(1)}K > ${TOTAL_THRESHOLD/1024}K，触发自动清理！`);
    ensureDir(ARCHIVE_DIR);
    
    const memResult = trimMemoryMd();
    const userResult = trimUserMd();
    
    const newTotal = files.reduce((sum, f) => sum + getFileSize(f.path), 0);
    console.log(`\n✅ 清理完成！总大小: ${(total/1024).toFixed(1)}K → ${(newTotal/1024).toFixed(1)}K`);
    return { cleaned: true, before: total, after: newTotal, memResult, userResult };
  } else {
    console.log(`\n✅ 总大小 ${(total/1024).toFixed(1)}K 在阈值内，无需清理`);
    return { cleaned: false, total };
  }
}

// CLI入口
if (require.main === module) {
  const result = checkAndClean();
  process.exit(result.cleaned ? 0 : 0);
}

module.exports = { checkAndClean, trimMemoryMd, trimUserMd };