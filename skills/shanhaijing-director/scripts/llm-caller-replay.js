const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_VERSION = 'v2'; // 每次格式变更时递增（hash算法改变 -> v2）

class LLMCallerReplay {
  constructor(realCaller, options = {}) {
    this.realCaller = realCaller;
    this.mode = options.mode || 'passthrough';
    this.cacheDir = options.cacheDir || path.resolve(process.cwd(), '.llm-replay-cache');
    fs.mkdirSync(this.cacheDir, { recursive: true });
    // 启动时异步清理过期缓存
    this._cleanupOldCaches();
  }

  _cleanupOldCaches() {
    const MAX_AGE_DAYS = 30;
    const CUTOFF_MS = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    try {
      const files = fs.readdirSync(this.cacheDir);
      let cleaned = 0;
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filepath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filepath);
        if (stats.mtimeMs < CUTOFF_MS) {
          fs.unlinkSync(filepath);
          cleaned++;
        }
      }
      if (cleaned > 0) console.error(`[LLMCallerReplay] Cleaned ${cleaned} stale cache files`);
    } catch (err) {
      // 缓存目录可能不存在，忽略错误
    }
  }

  _hash(systemPrompt, userPrompt, options) {
    const model = options?.model || this.realCaller?.options?.model || 'k2p6';
    const temperature = options?.temperature ?? this.realCaller?.options?.temperature ?? 0.7;
    // 使用完整prompt计算SHA-256，彻底消除截断冲突
    const normalized = JSON.stringify({
      model,
      system: String(systemPrompt || ''),
      prompt: String(userPrompt || ''),
      temperature
    });
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  _filePath(hash) {
    return path.join(this.cacheDir, `${hash}.json`);
  }

  async call(systemPrompt, userPrompt, options = {}) {
    const hash = this._hash(systemPrompt, userPrompt, options);
    const file = this._filePath(hash);

    if (this.mode === 'replay') {
      if (!fs.existsSync(file)) {
        const err = new Error(`LLM replay cache miss: ${hash}`);
        err.code = 'LLM_REPLAY_CACHE_MISS';
        throw err;
      }
      const cache = JSON.parse(fs.readFileSync(file, 'utf8'));
      // 版本校验：不匹配则删除旧缓存
      if (cache._version !== CACHE_VERSION) {
        console.error(`[LLMCallerReplay] Cache version mismatch: ${cache._version} != ${CACHE_VERSION}, removing stale cache`);
        fs.unlinkSync(file);
        const err = new Error(`LLM replay stale cache removed: ${hash}`);
        err.code = 'LLM_REPLAY_CACHE_MISS';
        throw err;
      }
      return cache;
    }

    if (this.mode === 'record') {
      if (fs.existsSync(file)) {
        const cache = JSON.parse(fs.readFileSync(file, 'utf8'));
        // 版本校验：不匹配则重新记录
        if (cache._version !== CACHE_VERSION) {
          console.error(`[LLMCallerReplay] Cache version mismatch (record): ${cache._version} != ${CACHE_VERSION}, re-recording`);
          fs.unlinkSync(file);
        } else {
          console.log(`[LLMCallerReplay] 📂 Cache hit (record): ${hash.substring(0, 16)}...`);
          return cache;
        }
      }
      const result = await this.realCaller.call(systemPrompt, userPrompt, options);
      // 原子写入：先写临时文件，再重命名
      const tmpFile = file + '.tmp';
      const cacheData = { ...result, _version: CACHE_VERSION, _timestamp: Date.now() };
      fs.writeFileSync(tmpFile, JSON.stringify(cacheData, null, 2), 'utf8');
      fs.renameSync(tmpFile, file);
      console.log(`[LLMCallerReplay] 💾 Recorded cache: ${hash.substring(0, 16)}...`);
      return cacheData;
    }

    return this.realCaller.call(systemPrompt, userPrompt, options);
  }

  async callJSON(systemPrompt, userPrompt, options = {}) {
    const result = await this.call(systemPrompt, userPrompt, options);
    
    const text = result.result || result.content || '';
    
    // 策略1: 提取```json代码块
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        result.parsedJSON = JSON.parse(codeBlockMatch[1].trim());
        return result;
      } catch (e) {
        // 继续尝试其他方法
      }
    }
    
    // 策略2: 从最后一个}往前找匹配的{
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
        try {
          result.parsedJSON = JSON.parse(text.substring(firstBrace, lastBrace + 1));
          return result;
        } catch (e) {
          // 继续尝试
        }
      }
      lastBrace = text.lastIndexOf('}', lastBrace - 1);
    }
    
    // 策略3: 直接解析整个文本
    try {
      result.parsedJSON = JSON.parse(text.trim());
      return result;
    } catch (e) {
      result.parsedJSON = null;
      result.parseError = e.message;
      return result;
    }
  }
}

module.exports = { LLMCallerReplay };