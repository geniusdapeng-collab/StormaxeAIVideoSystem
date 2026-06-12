const fs = require('fs');
const path = require('path');

const MD_FILE = '/home/gem/workspace/agent/media/inbound/export-v6.17-peng-final---7699af7b-fc77-4af4-a97f-6cf28b7e8e06';

const raw = fs.readFileSync(MD_FILE, 'utf8');
const lines = raw.split('\n');

const markers = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('## FILE: ')) markers.push(i);
}

// Find beast-body-part-system.js
let targetMi = -1;
for (let mi = 0; mi < markers.length; mi++) {
  const fp = lines[markers[mi]].replace('## FILE: ', '').trim();
  if (fp.includes('beast-body-part-system.js')) {
    targetMi = mi;
    console.log(`Found at mi=${mi}, line ${markers[mi]+1}: ${fp}`);
    break;
  }
}

const ml = markers[targetMi];
const nextMl = markers[targetMi + 1];

// Opening fence
let codeStart = -1;
let fenceLen = 0;
for (let i = ml + 1; i < nextMl; i++) {
  const m = lines[i].match(/^(`+)/);
  if (m) {
    codeStart = i + 1;
    fenceLen = m[1].length;
    console.log(`Opening fence at line ${i+1}: ${JSON.stringify(lines[i])}`);
    console.log(`Fence len: ${fenceLen}`);
    break;
  }
}

const fenceStr = '`'.repeat(fenceLen);
console.log(`Fence str: ${JSON.stringify(fenceStr)}`);

const codeLines = [];
let closingFound = false;
for (let i = codeStart; i < nextMl; i++) {
  const ln = lines[i];
  const trimmed = ln.trimEnd();
  
  if (trimmed === fenceStr) {
    console.log(`Closing (pure) at line ${i+1}: ${JSON.stringify(ln)}`);
    closingFound = true;
    break;
  }
  if (trimmed.endsWith(fenceStr)) {
    const after = trimmed.slice(fenceLen);
    if (after.trim() === '') {
      console.log(`Closing (fence-at-end) at line ${i+1}: ${JSON.stringify(ln)}`);
      console.log(`  Code before fence: ${JSON.stringify(ln.slice(0, ln.length - fenceLen))}`);
      codeLines.push(ln.slice(0, ln.length - fenceLen));
      closingFound = true;
      break;
    } else {
      console.log(`Inline fence at line ${i+1}: ${JSON.stringify(ln.slice(-30))}`);
      codeLines.push(ln.slice(0, ln.length - fenceLen));
    }
  } else {
    if (codeLines.length < 5 || i > nextMl - 5) {
      // Show first/last few
    }
    codeLines.push(ln);
  }
}

console.log(`Total code lines: ${codeLines.length}`);
console.log(`First line: ${JSON.stringify(codeLines[0])}`);
console.log(`Last line: ${JSON.stringify(codeLines[codeLines.length - 1])}`);

const code = codeLines.join('\n');
console.log(`Total chars: ${code.length}`);
console.log(`Closing found: ${closingFound}`);

// Write
const targetPath = '/tmp/test-bbp-v5.js';
fs.writeFileSync(targetPath, code, 'utf8');
console.log(`Written to ${targetPath}`);

// Check syntax
const { execSync } = require('child_process');
try {
  execSync(`node --check "${targetPath}"`, { stdio: 'pipe' });
  console.log('Syntax: OK ✅');
} catch(e) {
  console.log('Syntax: ERROR ❌');
  console.log(e.stderr ? e.stderr.substring(0, 200) : e.message.substring(0, 200));
}
