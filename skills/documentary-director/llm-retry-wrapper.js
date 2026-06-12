// LLMRetryWrapper — LLM调用重试包装器
// 处理网络波动、超时、速率限制等问题

class LLMRetryWrapper {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1秒
    this.maxDelay = options.maxDelay || 30000; // 30秒
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableErrors = options.retryableErrors || [
      'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE',
      'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN',
      'timeout', 'rate limit', 'too many requests', '429',
      '500', '502', '503', '504', 'Internal Server Error',
    ];
    this.stats = { calls: 0, retries: 0, failures: 0, success: 0 };
  }

  /**
   * 包装LLM调用，自动重试
   * @param {Function} llmCallFn - 返回Promise的LLM调用函数
   * @param {string} operationName - 操作名称（用于日志）
   * @returns {Promise} - LLM调用结果
   */
  async call(llmCallFn, operationName = 'llm-call') {
    this.stats.calls++;
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await llmCallFn();
        this.stats.success++;

        if (attempt > 0) {
          console.log(`[LLMRetryWrapper] ✅ ${operationName} 成功于第 ${attempt + 1} 次尝试`);
        }

        return {
          success: true,
          data: result,
          attempts: attempt + 1,
          retries: attempt,
        };
      } catch (error) {
        lastError = error;

        // 判断错误是否可重试
        if (!this._isRetryable(error)) {
          console.error(`[LLMRetryWrapper] ❌ ${operationName} 不可重试错误: ${error.message}`);
          this.stats.failures++;
          return {
            success: false,
            error: error.message,
            data: null,
            attempts: attempt + 1,
            retries: attempt,
          };
        }

        if (attempt < this.maxRetries) {
          const delay = this._calculateDelay(attempt);
          this.stats.retries++;
          console.warn(`[LLMRetryWrapper] ⚠️ ${operationName} 第 ${attempt + 1} 次失败，${delay}ms 后重试: ${error.message}`);
          await this._sleep(delay);
        } else {
          console.error(`[LLMRetryWrapper] ❌ ${operationName} 所有 ${this.maxRetries + 1} 次尝试均失败`);
          this.stats.failures++;
          return {
            success: false,
            error: `All ${this.maxRetries + 1} attempts failed. Last error: ${error.message}`,
            data: null,
            attempts: attempt + 1,
            retries: attempt,
          };
        }
      }
    }

    // 不应该到达这里
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      data: null,
      attempts: this.maxRetries + 1,
      retries: this.maxRetries,
    };
  }

  /**
   * 判断错误是否可重试
   */
  _isRetryable(error) {
    if (!error) return false;

    const errorMessage = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    const statusCode = error.statusCode || error.status || 0;

    for (const retryable of this.retryableErrors) {
      const lower = retryable.toLowerCase();
      if (errorMessage.includes(lower) || errorCode.includes(lower)) {
        return true;
      }
      // 检查HTTP状态码
      if (!isNaN(retryable) && statusCode === parseInt(retryable)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 计算退避延迟（指数退避 + 随机抖动）
   */
  _calculateDelay(attempt) {
    const exponential = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.3 * exponential; // 30% 随机抖动
    const delay = Math.min(exponential + jitter, this.maxDelay);
    return Math.round(delay);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 快速调用（无重试，仅错误分类）
   */
  async callOnce(llmCallFn, operationName = 'llm-call') {
    try {
      const result = await llmCallFn();
      return { success: true, data: result, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        retryable: this._isRetryable(error),
      };
    }
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { calls: 0, retries: 0, failures: 0, success: 0 };
  }
}

module.exports = { LLMRetryWrapper };