#!/usr/bin/env node
/**
 * MiniMax M3 LLM 调用模块 — v1.1-Peng
 * 
 * 用途: 为 v6.17-Peng 系统提供统一的 LLM 调用能力
 * 模型: MiniMax M3 (minimax/MiniMax-M3)
 * 端点: https://api.minimaxi.com/v1
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ============ 配置 ============
const ENDPOINT = 'api.minimaxi.com';
const PATH = '/v1/chat/completions';
const MODEL = 'MiniMax-M3';

// ============ API Key 读取 ============
function extractApiKey(provider) {
  if (!provider) return null;
  if (typeof provider.apiKey === 'string' && provider.apiKey.startsWith('sk-')) {
    return provider.apiKey;
  }
  if (typeof provider.apiKey === 'object' && provider.apiKey !== null) {
    const obj = provider.apiKey;
    if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('sk-')) return obj.id;
    if (obj.value && typeof obj.value === 'string' && obj.value.startsWith('sk-')) return obj.value;
    if (obj.key && typeof obj.key === 'string' && obj.key.startsWith('sk-')) return obj.key;
  }
  return null;
}

function getApiKey() {
  const configPaths = [
    path.join(os.homedir(), '.openclaw', 'openclaw.json'),
    '/home/gem/workspace/agent/openclaw.json',
  ];
  
  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const providers = config.models?.providers || {};
        
        // 优先 minimax provider
        const minimax = providers.minimax;
        if (minimax) {
          const key = extractApiKey(minimax);
          if (key) return key;
        }
        
        // 其次遍历其他 provider
        for (const [name, provider] of Object.entries(providers)) {
          if (name === 'minimax') continue;
          const key = extractApiKey(provider);
          if (key) return key;
        }
      }
    } catch (e) { /* continue */ }
  }
  
  return process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY || null;
}

// ============ 核心请求 ============
function buildRequest(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('未找到 MiniMax API Key');
  
  const body = {
    model: options.model || MODEL,
    messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.maxTokens || 4096
  };
  
  if (options.topP !== undefined) body.top_p = options.topP;
  if (options.stop !== undefined) body.stop = options.stop;
  
  return { apiKey, body };
}

function postRequest(apiKey, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    
    const options = {
      hostname: ENDPOINT,
      port: 443,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch (e) { resolve(data); }
        } else {
          reject(new Error(`API错误 ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(postData);
    req.end();
  });
}

// ============ 公开 API ============
export const llm = {
  /** 同步调用 */
  async call(prompt, options = {}) {
    const { apiKey, body } = buildRequest(prompt, options);
    const result = await postRequest(apiKey, body);
    return result.choices?.[0]?.message?.content || '';
  },
  
  /** 生成故事 */
  async generateStory(context) {
    const { title, outline, characters, genre, tone } = context;
    const systemPrompt = `你是专业的影视剧本作家。按五幕结构创作剧本。每个场景需要包含镜头描述、对话、情绪氛围。`;
    const userPrompt = `作品: ${title || '未命名'}, 类型: ${genre || '剧情'}, 基调: ${tone || '现实主义'}\n大纲: ${outline || '暂无'}\n${characters ? `角色:\n${JSON.stringify(characters)}` : ''}`;
    return this.call([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: 0.8, maxTokens: 8192 });
  },
  
  /** 优化视频提示词 */
  async optimizePrompt(prompt, context = {}) {
    const { shotType, style, emotion, camera } = context;
    const systemPrompt = `你是AI视频提示词优化师。将简短描述扩展为专业视频生成提示词，保持核心创意，增加电影感细节（主体、动作、场景、光影、风格、构图），控制在150-300字。`;
    return this.call([{ role: 'system', content: systemPrompt }, { role: 'user', content: `原始: ${prompt}\n类型: ${shotType || '未指定'}, 风格: ${style || '写实'}, 情绪: ${emotion || '中性'}, 运镜: ${camera || '固定'}` }], { temperature: 0.6, maxTokens: 1024 });
  },
  
  /** 批量调用（带并发控制） */
  async batchCall(tasks, concurrency = 3) {
    const results = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(t => this.call(t.prompt, t.options)));
      results.push(...batchResults.map((content, idx) => ({ ...batch[idx], content })));
    }
    return results;
  },
  
  config: { endpoint: ENDPOINT, path: PATH, model: MODEL }
};

// ============ CLI ==========
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`MiniMax M3 LLM 模块 v1.1-Peng\n用法: node llm-minimax.mjs "问题" [--model M] [--temp 0.7] [--max 4096]`);
    process.exit(0);
  }
  
  const options = { model: MODEL, temperature: 0.7, maxTokens: 4096 };
  let prompt = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' || args[i] === '-m') options.model = args[++i];
    else if (args[i] === '--temp' || args[i] === '-t') options.temperature = parseFloat(args[++i]);
    else if (args[i] === '--max' || args[i] === '-M') options.maxTokens = parseInt(args[++i]);
    else if (!args[i].startsWith('--')) prompt = args[i];
  }
  
  if (!prompt) { console.error('请提供提示词'); process.exit(1); }
  
  llm.call(prompt, options).then(r => console.log(r)).catch(e => { console.error('错误:', e.message); process.exit(1); });
}

export default llm;
