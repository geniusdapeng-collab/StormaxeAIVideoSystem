#!/usr/bin/env node
/**
 * CircuitBreaker — 断路器模式 V1.0
 * 
 * 解决问题：
 * 当前模型降级是简单的线性 fallback，无法感知服务是否恢复。
 * 断路器在连续失败后自动熔断，避免浪费配额在不可用的服务上。
 * 
 * 状态机：CLOSED → OPEN → HALF_OPEN → CLOSED
 * 
 * 用法：
 *   const cb = new CircuitBreaker({ threshold: 5, timeoutMs: 120000 });
 *   try {
 *     const result = await cb.execute(() => seedanceAPI.createJob(...));
 *   } catch (e) {
 *     if (e instanceof CircuitBreakerOpenError) {
 *       // 服务熔断中，降级到下一个模型
 *     }
 *   }
 */

class CircuitBreakerOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || parseInt(process.env.CB_THRESHOLD || '5');        // 连续失败次数阈值
    this.timeoutMs = options.timeoutMs || parseInt(process.env.CB_TIMEOUT_MS || '120000');   // OPEN → HALF_OPEN 等待时间
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 2; // 半开状态试探次数
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    this.onStateChange = options.onStateChange || null; // 状态变化回调
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this._transitionTo('HALF_OPEN');
        this.halfOpenCalls = 0;
      } else {
        const retryAfter = Math.ceil((this.lastFailureTime + this.timeoutMs - Date.now()) / 1000);
        throw new CircuitBreakerOpenError(`服务熔断中，请 ${retryAfter}s 后重试`);
      }
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
      if (this.halfOpenCalls > this.halfOpenMaxCalls) {
        throw new CircuitBreakerOpenError('半开状态试探次数已达上限');
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (e) {
      this._onFailure();
      throw e;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this._transitionTo('CLOSED');
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN') {
      this._transitionTo('OPEN');
    } else if (this.failureCount >= this.threshold) {
      this._transitionTo('OPEN');
    }
  }

  _transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(oldState, newState, {
        failureCount: this.failureCount,
        timeoutMs: this.timeoutMs
      });
    }
  }

  getState() {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      threshold: this.threshold
    };
  }

  // 手动重置（运维操作）
  reset() {
    this._transitionTo('CLOSED');
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
  }
}

// 按模型维度维护断路器实例
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  getOrCreate(modelId, options = {}) {
    if (!this.breakers.has(modelId)) {
      const cb = new CircuitBreaker({
        ...options,
        onStateChange: (oldState, newState, metrics) => {
          const ts = new Date().toISOString();
          console.log(`[${ts}] [CircuitBreaker] ${modelId}: ${oldState} → ${newState} (失败=${metrics.failureCount})`);
        }
      });
      this.breakers.set(modelId, cb);
    }
    return this.breakers.get(modelId);
  }

  getAllMetrics() {
    const metrics = {};
    for (const [modelId, cb] of this.breakers) {
      metrics[modelId] = cb.getMetrics();
    }
    return metrics;
  }

  resetAll() {
    for (const cb of this.breakers.values()) {
      cb.reset();
    }
  }
}

module.exports = { CircuitBreaker, CircuitBreakerOpenError, CircuitBreakerRegistry };

// 独立运行模式：测试
if (require.main === module) {
  console.log('🧪 CircuitBreaker 测试...\n');
  
  const cb = new CircuitBreaker({ threshold: 3, timeoutMs: 2000, onStateChange: (old, next) => {
    console.log(`   状态变化: ${old} → ${next}`);
  }});
  
  let failCount = 0;
  const mockService = async () => {
    failCount++;
    if (failCount <= 5) throw new Error('Service unavailable');
    return 'OK';
  };

  // 连续失败 → 触发熔断
  for (let i = 0; i < 5; i++) {
    try {
      await cb.execute(mockService);
    } catch (e) {
      console.log(`   调用 ${i+1}: ${e.name === 'CircuitBreakerOpenError' ? '🔴 熔断' : '❌ 失败'}`);
    }
  }
  
  console.log(`\n   当前状态: ${cb.getState()}`);
  console.log('   等待超时恢复...');
  
  // 等待超时后自动 HALF_OPEN
  setTimeout(async () => {
    try {
      const result = await cb.execute(mockService);
      console.log(`   恢复成功: ${result}, 状态: ${cb.getState()}`);
    } catch (e) {
      console.log(`   恢复失败: ${e.message}`);
    }
    console.log('\n✅ 测试完成');
  }, 2500);
}
