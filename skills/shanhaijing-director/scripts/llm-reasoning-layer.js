#!/usr/bin/env node
/**
 * LLM推理抽象层 v1.1-Peng
 * 所有Pipeline环节统一LLM调用入口，带完整运维保障
 * 
 * 核心设计：
 * 1. 分级超时 — 轻/中/重/超长推理不同超时
 * 2. 指数退避重试 — 最多3次，自动切换备用模型
 * 3. 故障降级 — LLM失败自动降级本地规则，不阻断Pipeline
 * 4. 并发控制 — 不依赖环节并行调用
 * 5. 成本监控 — 每环节Token/耗时/成功率记录
 * 
 * 版本: v1.1-Peng | 2026-05-31
 * 所属系统: ShanhaiStory Forge v2.35-Peng
 */

const { createLLMCaller } = require('./llm-caller');

class LLMReasoningLayer {
  constructor(options = {}) {
    this.options = {
      // 分级超时配置（毫秒）
      timeouts: {
        light: 600000,     // 低配: 10分钟
        medium: 600000,  // 低配: 10分钟
        heavy: 1200000,   // 高配: 20分钟
        extreme: 1200000, // 高配: 20分钟
        ultra: 1200000    // 高配: 20分钟
      },
      // 重试配置
      maxRetries: 3,
      retryBackoff: [1000, 2000, 4000], // 指数退避
      // 备用模型（降级链）
      fallbackModels: ['MiniMax-M3', 'bailian/qwen3.6-plus', 'deepseek/deepseek-v4-pro'],
      // 降级策略
      enableFallback: true,
      // 监控
      enableMonitoring: true,
      ...options
    };
    
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      fallbackCalls: 0,
      timeoutCalls: 0,
      totalTokens: 0,
      totalDuration: 0,
      stageStats: {}
    };
  }

  /**
   * 统一LLM推理入口
   * @param {Object} config
   * @param {string} config.stage - 环节名称（用于监控和超时分级）
   * @param {string} config.systemPrompt - 系统提示词
   * @param {string} config.userPrompt - 用户提示词
   * @param {string} config.level - 超时级别: light/medium/heavy/extreme
   * @param {Function} config.fallback - 降级函数(LLM失败时调用)
   * @param {boolean} config.parallel - 是否并发标记（仅用于日志）
   * @param {Object} config.llmOptions - 额外LLM选项(temperature/maxTokens等)
   */
  async llmReason(config) {
    const { stage, systemPrompt, userPrompt, level = 'medium', fallback, parallel = false, llmOptions = {} } = config;
    
    const timeout = this.options.timeouts[level] || this.options.timeouts.medium;
    const startTime = Date.now();
    const callId = `llm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n[LLMReasoningLayer] 🧠 ${stage} | 级别:${level} | 超时:${timeout}ms | 并发:${parallel ? '是' : '否'}`);
    
    this.stats.totalCalls++;
    
    // 初始化环节统计
    if (!this.stats.stageStats[stage]) {
      this.stats.stageStats[stage] = { calls: 0, success: 0, fallback: 0, timeouts: 0, tokens: 0, duration: 0 };
    }
    this.stats.stageStats[stage].calls++;
    
    // 尝试主调用 + 重试
    let lastError = null;
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = this.options.retryBackoff[Math.min(attempt - 1, this.options.retryBackoff.length - 1)];
        console.log(`[LLMReasoningLayer] ⏳ ${stage} 第${attempt + 1}次尝试,退避${backoff}ms...`);
        await this._sleep(backoff);
      }
      
      try {
        // 🆕 v6.3-Peng: 自动修复能力 — 只在评估/审片类环节启用，生成类环节禁用
        const autoFixStages = ['requirement-alignment', 'schema-check', 'storyboard-check', 'director-optimize', 'scriptwriter-optimize', 'director-review', 'scriptwriter-review'];
        const enableAutoFix = config.autoFix !== false && autoFixStages.includes(stage);
        const enhancedSystemPrompt = enableAutoFix ? `${systemPrompt || ''}

[自动修复指令] 如果在上文输入中发现任何不完善、矛盾、遗漏或可以改进的地方，请在分析/评估的同时，顺手提供修复后的内容。修复原则：
1. 只修复明显错误（事实矛盾、逻辑冲突、缺少必要信息），不修改艺术选择
2. 修复必须最小化改动，保留原文精华
3. 在返回结果中同时包含：①分析/评估 ②修复后的内容（如需要修复）
4. 如果不需要修复，正常返回分析/评估即可，无需额外声明
` : (systemPrompt || '');
        // 创建带超时的Promise
        const llmPromise = this._doLLMCall(enhancedSystemPrompt, userPrompt, { ...llmOptions, callId, attempt });
        const result = await this._withTimeout(llmPromise, timeout, stage, attempt);
        
        // 成功
        const duration = Date.now() - startTime;
        this.stats.successCalls++;
        this.stats.totalTokens += result.tokens || 0;
        this.stats.totalDuration += duration;
        this.stats.stageStats[stage].success++;
        this.stats.stageStats[stage].tokens += result.tokens || 0;
        this.stats.stageStats[stage].duration += duration;
        
        console.log(`[LLMReasoningLayer] ✅ ${stage} 成功 | 耗时:${duration}ms | Token:${result.tokens || 0} | 尝试:${attempt + 1}`);
        
        return {
          success: true,
          result: typeof result.content === 'string' ? result.content : JSON.stringify(result.content || ''),
          raw: result,
          duration,
          tokens: result.tokens || 0,
          attempts: attempt + 1,
          fallbackUsed: false,
          callId
        };
        
      } catch (error) {
        lastError = error;
        
        if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
          this.stats.timeoutCalls++;
          this.stats.stageStats[stage].timeouts++;
          console.log(`[LLMReasoningLayer] ⏱️ ${stage} 超时(尝试${attempt + 1})`);
        } else {
          console.log(`[LLMReasoningLayer] ❌ ${stage} 错误(尝试${attempt + 1}): ${error.message?.substring(0, 100)}`);
        }
        
        // 最后一次尝试失败，且配置了降级
        if (attempt === this.options.maxRetries && fallback && this.options.enableFallback) {
          console.log(`[LLMReasoningLayer] 🛡️ ${stage} LLM全部失败,执行降级...`);
          
          try {
            const fallbackStart = Date.now();
            const fallbackResult = await fallback();
            const fallbackDuration = Date.now() - fallbackStart;
            
            this.stats.fallbackCalls++;
            this.stats.stageStats[stage].fallback++;
            
            console.log(`[LLMReasoningLayer] ⚠️ ${stage} 降级成功 | 耗时:${fallbackDuration}ms | 来源:本地规则`);
            
          return {
              success: true, // 降级也算成功，只是来源不同
              result: fallbackResult,
              raw: null,
              duration: Date.now() - startTime,
              tokens: 0,
              attempts: attempt + 1,
              fallbackUsed: true,
              fallbackReason: error.message?.substring(0, 200),
              callId
            };
          } catch (fallbackError) {
            console.error(`[LLMReasoningLayer] 💥 ${stage} 降级也失败: ${fallbackError.message}`);
            throw new Error(`${stage} LLM失败且降级失败: ${error.message} | 降级错误: ${fallbackError.message}`);
          }
        }
      }
    }
    
    // 所有尝试失败且无降级
    throw new Error(`${stage} LLM推理失败(尝试${this.options.maxRetries + 1}次): ${lastError?.message}`);
  }

  /**
   * 并发执行多个LLM推理
   * @param {Array} configs - llmReason配置数组
   * @returns {Array} 结果数组
   */
  async llmReasonParallel(configs) {
    console.log(`\n[LLMReasoningLayer] 🚀 并发执行${configs.length}个LLM推理...`);
    const startTime = Date.now();
    
    const promises = configs.map((config, index) =>
      this.llmReason({ ...config, parallel: true }).catch(error => ({
        success: false,
        error: error.message,
        stage: config.stage,
        index
      })
    ));
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success !== false).length;
    
    console.log(`[LLMReasoningLayer] ✅ 并发完成 | 成功:${successCount}/${configs.length} | 总耗时:${duration}ms`);
    
    return results;
  }

  /**
   * 实际LLM调用
   */
  async _doLLMCall(systemPrompt, userPrompt, options = {}) {
    // v3.0.6-peng fix: 使用 DeepSeek 替代硬编码的 kimi endpoint
    // API key configured via environment variable
    const ENDPOINT = 'api.deepseek.com';
    const PATH = '/v1/chat/completions';
    const { getLLMConfig: _cfg } = require('./config-center');
const MODEL = 'deepseek-chat';  // 兼容旧接口

    // 从 openclaw.json 自动读取 API Key（按优先级尝试）
    function getApiKey() {
      const fs = require('fs');
      const configPath = '/home/gem/workspace/agent/openclaw.json';
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const providers = config.models?.providers || {};
        // 优先: sk-b6f69e (deepseek, 实测可用)
        // 其次: sk-sp- (bailian)
        // 再次: sk-cp- (minimax)
        const keyPriority = ['deepseek', 'bailian', 'minimax'];
        for (const name of keyPriority) {
          const p = providers[name];
          if (p?.apiKey && typeof p.apiKey === 'string') return p.apiKey;
        }
      } catch (e) { /* ignore */ }
      return null;
    }

    const apiKey = getApiKey();
    if (!apiKey) throw new Error('LLM API Key未配置。请在 openclaw.json 中配置 MiniMax API Key。');

    // 构造 messages（兼容字符串和消息数组）
    const messages = [];
    if (Array.isArray(systemPrompt)) {
      // 已经是消息数组（可能是 [{role:'system',...}, {role:'user',...}] 的组合）
      messages.push(...systemPrompt);
    } else if (systemPrompt) {
      messages.push({ role: 'system', content: String(systemPrompt) });
    }
    if (Array.isArray(userPrompt)) {
      messages.push(...userPrompt);
    } else if (typeof userPrompt === 'string' && userPrompt.trim()) {
      messages.push({ role: 'user', content: userPrompt });
    } else if (messages.length === 0 || !messages.some(m => m.role === 'user')) {
      // DeepSeek 要求必须有 user 消息（兜底）
      messages.push({ role: 'user', content: '请继续执行任务。' });
    }

    const _c = _cfg(options.stage || 'default');
    const body = {
      model: options.model || MODEL,
      messages,
      temperature: options.temperature ?? _c.temperature,
      max_tokens: options.maxTokens || options.max_tokens || _c.maxTokens
    };

    // HTTPS 请求
    const postData = JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const req = require('https').request({
        hostname: ENDPOINT, port: 443, path: PATH, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(postData) },
        timeout: options.timeout || 600000
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.message?.content || '';
              resolve({ content, tokens: parsed.usage?.completion_tokens || 0 });
            }
            catch (e) { reject(new Error(`JSON解析失败: ${data.slice(0, 200)}`)); }
          } else {
            reject(new Error(`API错误 ${res.statusCode}: ${data.slice(0, 300)}`));
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('LLM调用超时')); });
      req.write(postData);
      req.end();
    });
  }

  /**
   * 超时包装 + 进度心跳
   * 🆕 v6.4-Peng-fix: 每30秒输出进度，防止黑盒等待
   */
  _withTimeout(promise, timeoutMs, stage, attempt) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        clearInterval(heartbeat);
        reject(new Error(`timeout: ${stage} attempt ${attempt + 1} exceeded ${timeoutMs}ms`));
      }, timeoutMs);
      
      // 🆕 v6.4-Peng-fix: 进度心跳 - 每30秒输出一次
      let elapsed = 0;
      const heartbeatInterval = 30000; // 30秒
      const heartbeat = setInterval(() => {
        elapsed += heartbeatInterval;
        const remaining = Math.max(0, timeoutMs - elapsed);
        console.log(`[LLMReasoningLayer] ⏳ ${stage} 推理中...已运行${(elapsed/1000).toFixed(0)}秒 | 剩余约${(remaining/1000).toFixed(0)}秒 | 尝试:${attempt + 1}`);
      }, heartbeatInterval);
      
      promise
        .then(result => { clearTimeout(timer); clearInterval(heartbeat); resolve(result); })
        .catch(error => { clearTimeout(timer); clearInterval(heartbeat); reject(error); });
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🆕 v6.3-Peng-fix1: 智能JSON提取器
   * 解决LLM在JSON前后追加分析文字导致的解析失败
   * 从最后一个}往前找匹配的{，提取最内层平衡JSON
   */
  static extractJSON(text) {
    if (!text || typeof text !== 'string') return null;
    
    // 1. 先尝试从最后一个 } 往前找匹配的 {
    let lastBrace = text.lastIndexOf('}');
    if (lastBrace === -1) return null;
    
    let braceCount = 0;
    let start = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (text[i] === '}') braceCount++;
      if (text[i] === '{') {
        braceCount--;
        if (braceCount === 0) {
          start = i;
          break;
        }
      }
    }
    
    if (start !== -1) {
      const candidate = text.substring(start, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch (e) {
        // 不是有效JSON，继续尝试其他方法
      }
    }
    
    // 2. 回退：尝试匹配 ```json 代码块
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        JSON.parse(codeBlockMatch[1]);
        return codeBlockMatch[1];
      } catch (e) {
        // 不是有效JSON
      }
    }
    
    // 3. 回退：尝试匹配 ``` 代码块（不指定json）
    const genericCodeBlock = text.match(/```\s*([\s\S]*?)\s*```/);
    if (genericCodeBlock) {
      try {
        JSON.parse(genericCodeBlock[1]);
        return genericCodeBlock[1];
      } catch (e) {
        // 不是有效JSON
      }
    }
    
    // 4. 最终回退：贪婪匹配（可能包含额外文字，但试一下）
    const greedyMatch = text.match(/\{[\s\S]*\}/);
    if (greedyMatch) {
      try {
        JSON.parse(greedyMatch[0]);
        return greedyMatch[0];
      } catch (e) {
        return null;
      }
    }
    
    return null;
  }

  /**
   * 获取监控统计
   */
  getStats() {
    const stats = { ...this.stats };
    stats.successRate = this.stats.totalCalls > 0 ? (this.stats.successCalls / this.stats.totalCalls * 100).toFixed(1) : 0;
    stats.fallbackRate = this.stats.totalCalls > 0 ? (this.stats.fallbackCalls / this.stats.totalCalls * 100).toFixed(1) : 0;
    stats.avgDuration = this.stats.successCalls > 0 ? (this.stats.totalDuration / this.stats.successCalls).toFixed(0) : 0;
    return stats;
  }

  /**
   * 打印监控报告
   */
  printReport() {
    const stats = this.getStats();
    console.log(`\n========== LLM推理层监控报告 ==========`);
    console.log(`总调用: ${stats.totalCalls} | 成功: ${stats.successCalls} | 降级: ${stats.fallbackCalls} | 超时: ${stats.timeoutCalls}`);
    console.log(`成功率: ${stats.successRate}% | 降级率: ${stats.fallbackRate}% | 平均耗时: ${stats.avgDuration}ms`);
    console.log(`总Token: ${stats.totalTokens}`);
    console.log(`\n各环节详情:`);
    for (const [stage, s] of Object.entries(stats.stageStats)) {
      const rate = s.calls > 0 ? (s.success / s.calls * 100).toFixed(1) : 0;
      console.log(`  ${stage}: ${s.calls}次 | 成功${s.success} | 降级${s.fallback} | 超时${s.timeouts} | 成功率${rate}% | Token${s.tokens}`);
    }
    console.log(`========================================\n`);
  }
}

module.exports = { LLMReasoningLayer };