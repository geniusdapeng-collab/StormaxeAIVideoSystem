#!/usr/bin/env node
/**
 * MiniMax M3 LLM 调用模块 — v1.0-Peng
 * 
 * 用途: 为 v6.17-Peng 系统提供统一的 LLM 调用能力
 * 模型: MiniMax M3 (minimax/MiniMax-M3)
 * 端点: https://api.minimaxi.com/v1
 * 
 * 用法:
 *   const llm = require('./llm-minimax');
 *   
 *   // 简单调用
 *   const result = await llm.call('请生成一个故事大纲');
 *   
 *   // 带参数的调用
 *   const result = await llm.call(prompt, {
 *     model: 'MiniMax-M3',
 *     temperature: 0.7,
 *     maxTokens: 2000
 *   });
 *   
 *   // 流式调用
 *   for await (const chunk of llm.stream('续写这个故事')) {
 *     process.stdout.write(chunk);
 *   }
 */

const https = require('https');
const http = require('http');

// ============ 配置 ============
const ENDPOINT = 'api.minimaxi.com';
const PATH = '/v1/chat/completions';
const MODEL = 'MiniMax-M3';

// MiniMax API Key（从环境变量读取）
function getApiKey() {
  // 方案1: 直接从 openclaw.json 读取
  const fs = require('fs');
  const path = require('path');
  const homedir = require('os').homedir();
  
  const configPaths = [
    path.join(homedir, '.openclaw', 'openclaw.json'),
    '/home/gem/workspace/agent/openclaw.json',
    path.join(homedir, '.openclaw', 'config.json')
  ];
  
  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const providers = config.models?.providers || {};
        
        // 尝试 minimax provider
        const minimax = providers.minimax || {};
        if (minimax.apiKey && minimax.apiKey.startsWith('sk-')) {
          return minimax.apiKey;
        }
        
        // 尝试 bailian provider (通义千问)
        const bailian = providers.bailian || {};
        if (bailian.apiKey) {
          return bailian.apiKey;
        }
        
        // 遍历所有 provider 找 sk- 开头的 key
        for (const [name, provider] of Object.entries(providers)) {
          if (provider.apiKey && provider.apiKey.startsWith('sk-')) {
            return provider.apiKey;
          }
        }
      }
    } catch (e) {
      // 继续试下一个
    }
  }
  
  // 方案2: 环境变量
  return process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY || null;
}

// ============ 核心请求函数 ============
function buildRequest(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('未找到 MiniMax API Key，请检查 openclaw.json 配置或设置 MINIMAX_API_KEY 环境变量');
  }
  
  const body = {
    model: options.model || MODEL,
    messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.maxTokens || options.max_tokens || 4096,
    stream: options.stream || false
  };
  
  // MiniMax 特定参数
  if (options.topP !== undefined) body.top_p = options.topP;
  if (options.topK !== undefined) body.top_k = options.topK;
  if (options.n !== undefined) body.n = options.n;
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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: (options && options.timeout) || 60000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data); // 可能是流式响应
          }
        } else {
          reject(new Error(`API错误 ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.write(postData);
    req.end();
  });
}

// ============ 同步调用（流式） ============
function postRequestStream(apiKey, body, onChunk, onEnd) {
  const postData = JSON.stringify(body);
  
  const options = {
    hostname: ENDPOINT,
    port: 443,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    res.on('data', chunk => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') {
            onEnd && onEnd();
            return;
          }
          try {
            const obj = JSON.parse(jsonStr);
            const content = obj.choices?.[0]?.delta?.content || '';
            if (content) onChunk(content);
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });
    res.on('end', onEnd);
  });
  
  req.on('error', e => console.error('Stream error:', e));
  req.write(postData);
  req.end();
}

// ============ 公开 API ============
const llm = {
  /**
   * 同步 LLM 调用
   * @param {string|Array} prompt - 提示词或消息数组
   * @param {Object} options - 调用选项
   * @returns {Promise<string>} 生成的文本
   */
  async call(prompt, options = {}) {
    const { apiKey, body } = buildRequest(prompt, options);
    const result = await postRequest(apiKey, body);
    return result.choices?.[0]?.message?.content || '';
  },
  
  /**
   * 流式 LLM 调用
   * @param {string|Array} prompt - 提示词或消息数组
   * @param {Object} options - 调用选项
   * @returns {AsyncIterable<string>} 流式文本块
   */
  async *stream(prompt, options = {}) {
    const { apiKey, body } = buildRequest(prompt, { ...options, stream: true });
    
    const chunks = [];
    const promise = new Promise((resolve) => {
      postRequestStream(
        apiKey, 
        body,
        chunk => { chunks.push(chunk); },  // 收集到数组
        () => resolve()
      );
    });
    
    // 逐个yield已收集的chunk
    let lastLen = 0;
    while (true) {
      await new Promise(r => setTimeout(r, 50));
      while (chunks.length > lastLen) {
        yield chunks[lastLen];
        lastLen++;
      }
      if (chunks._done) break;
      if (lastLen > 0 && chunks._done) {
        break;
      }
    }
    await promise;
  },
  
  /**
   * 带工具调用的 LLM 调用
   * @param {string|Array} prompt - 提示词或消息数组
   * @param {Array} tools - 工具定义数组
   * @param {Object} options - 调用选项
   * @returns {Promise<Object>} 包含内容和工具调用的结果
   */
  async callWithTools(prompt, tools, options = {}) {
    const { apiKey, body } = buildRequest(prompt, options);
    body.tools = tools;
    const result = await postRequest(apiKey, body);
    
    const message = result.choices?.[0]?.message;
    return {
      content: message?.content || '',
      toolCalls: message?.tool_calls || [],
      raw: result
    };
  },
  
  /**
   * 便捷方法: 生成故事/剧本
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} 生成结果
   */
  async generateStory(context) {
    const { title, outline, characters, genre, tone } = context;
    
    const systemPrompt = `你是专业的影视剧本作家。你的任务是：
1. 根据用户提供的故事大纲，创作完整的剧本结构
2. 按照专业五幕结构组织故事（建置、对抗、转折、高潮、结局）
3. 每个场景需要包含：镜头描述、对话、情绪氛围
4. 确保角色动机明确，冲突激烈

请直接输出剧本内容，不需要额外解释。`;

    const userPrompt = `作品名: ${title || '未命名作品'}
类型: ${genre || '剧情片'}
基调: ${tone || '现实主义'}
故事大纲: ${outline || '暂无大纲'}

${characters ? `角色信息:\n${JSON.stringify(characters, null, 2)}` : ''}

请按五幕结构创作完整剧本。`;

    const result = await this.call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.8, maxTokens: 8192 });
    
    return { content: result, title, outline };
  },
  
  /**
   * 便捷方法: 优化提示词
   * @param {string} prompt - 原始提示词
   * @param {Object} context - 上下文（镜头信息、风格等）
   * @returns {Promise<string>} 优化后的提示词
   */
  async optimizePrompt(prompt, context = {}) {
    const { shotType, style, emotion, camera } = context;
    
    const systemPrompt = `你是专业的AI视频提示词优化师。你的任务是：
1. 将用户提供的简短描述扩展为专业的视频生成提示词
2. 保持核心创意不变，增加电影感的细节描写
3. 包含：主体描述、动作、场景、光影、风格、构图等要素
4. 长度控制在150-300字之间

请直接输出优化后的提示词，不要额外解释。`;

    const result = await this.call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `原始描述: ${prompt}\n镜头类型: ${shotType || '未指定'}\n风格: ${style || '写实'}\n情绪: ${emotion || '中性'}\n运镜: ${camera || '固定'}` }
    ], { temperature: 0.6, maxTokens: 1024 });
    
    return result;
  },
  
  /**
   * 获取配置信息
   */
  config: {
    endpoint: ENDPOINT,
    path: PATH,
    model: MODEL,
    provider: 'minimax'
  }
};

// ============ 命令行接口 ============
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
MiniMax M3 LLM 调用模块 v1.0-Peng

用法:
  node llm-minimax.js "你的问题"
  node llm-minimax.js --prompt "你的问题" --model MiniMax-M3 --temperature 0.7
  node llm-minimax.js --stream "你的问题"

选项:
  --prompt, -p     提示词
  --model, -m     模型名称 (默认: ${MODEL})
  --temperature, -t 温度参数 (默认: 0.7)
  --max-tokens, -M 最大token数 (默认: 4096)
  --stream, -s    启用流式输出
  --help, -h      显示帮助
    `);
    process.exit(0);
  }
  
  const options = {
    model: MODEL,
    temperature: 0.7,
    maxTokens: 4096,
    stream: false
  };
  
  let prompt = '';
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt':
      case '-p':
        prompt = args[++i];
        break;
      case '--model':
      case '-m':
        options.model = args[++i];
        break;
      case '--temperature':
      case '-t':
        options.temperature = parseFloat(args[++i]);
        break;
      case '--max-tokens':
      case '-M':
        options.maxTokens = parseInt(args[++i]);
        break;
      case '--stream':
      case '-s':
        options.stream = true;
        break;
      default:
        if (!args[i].startsWith('--')) {
          prompt = args[i];
        }
    }
  }
  
  if (!prompt) {
    console.error('错误: 请提供提示词');
    process.exit(1);
  }
  
  if (options.stream) {
    console.error('流式模式...');
    let full = '';
    for await (const chunk of llm.stream(prompt, options)) {
      process.stdout.write(chunk);
      full += chunk;
    }
    console.error('\n\n[流式输出完成]');
  } else {
    llm.call(prompt, options).then(result => {
      console.log(result);
    }).catch(err => {
      console.error('错误:', err.message);
      process.exit(1);
    });
  }
}

module.exports = llm;
