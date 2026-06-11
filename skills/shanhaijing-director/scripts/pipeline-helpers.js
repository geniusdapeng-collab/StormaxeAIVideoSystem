// scripts/pipeline-helpers.js
// 统一 JSON/文件读写、平衡 JSON 提取、目录保证
const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readTextSafe(filePath, fallback = '') {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`[readTextSafe] ${filePath}: ${err.message}`);
    return fallback;
  }
}

function writeTextSafe(filePath, text) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, text, 'utf8');
    return true;
  } catch (err) {
    console.error(`[writeTextSafe] ${filePath}: ${err.message}`);
    return false;
  }
}

function readJSONSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`[readJSONSafe] ${filePath}: ${err.message}`);
    return fallback;
  }
}

function writeJSONSafe(filePath, data) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[writeJSONSafe] ${filePath}: ${err.message}`);
    return false;
  }
}

function extractBalancedJSON(text) {
  if (!text || typeof text !== 'string') return null;

  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  let lastBrace = text.lastIndexOf('}');
  while (lastBrace > 0) {
    let braceCount = 0;
    let firstBrace = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (text[i] === '}') braceCount++;
      if (text[i] === '{') {
        braceCount--;
        if (braceCount === 0) {
          firstBrace = i;
          break;
        }
      }
    }

    if (firstBrace >= 0) {
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      try {
        JSON.parse(jsonStr);
        return jsonStr;
      } catch (_) {}
    }
    lastBrace = text.lastIndexOf('}', lastBrace - 1);
  }

  try {
    JSON.parse(text.trim());
    return text.trim();
  } catch (_) {
    return null;
  }
}

function toSafeString(data) {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    return data.content || data.result || data.text || JSON.stringify(data);
  }
  return String(data || '');
}

function getPRDPath(productionDir) {
  const p = path.join(productionDir, '00-prd', 'prd.md');
  return fs.existsSync(p) ? p : null;
}

// Aliases for compatibility
const readText = readTextSafe;
const writeText = writeTextSafe;
const readJson = readJSONSafe;
const writeJson = writeJSONSafe;

module.exports = {
  ensureDir,
  readTextSafe,
  writeTextSafe,
  readJSONSafe,
  writeJSONSafe,
  extractBalancedJSON,
  toSafeString,
  getPRDPath,
  // Aliases
  readText,
  writeText,
  readJson,
  writeJson
};
