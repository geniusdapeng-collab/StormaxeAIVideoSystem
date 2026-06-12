// PromptInjectionGuard — Prompt注入攻击防护
// 检测和清理危险输入，防止用户内容覆盖系统指令

class PromptInjectionGuard {
  // 检测危险模式
  static detect(input) {
    const DANGEROUS_PATTERNS = [
      /ignore\s+all\s+previous\s+instructions?/i,
      /system\s*override/i,
      /\[\s*system\s*:\s*[^\]]+\]/i,
      /new\s+instruction\s*:\s*/i,
      /you\s+are\s+now\s+/i,
      /forget\s+(everything|all|previous)/i,
      /\n\s*\n\s*(system|user|assistant)\s*[:>]/i,
      /<\/?\s*(system|override|config)\s*>/i,
    ];
    const violations = [];
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        violations.push(pattern.source);
      }
    }
    return {
      isSafe: violations.length === 0,
      violations,
    };
  }

  // 清理输入（保留内容但中和危险指令）
  static sanitize(input) {
    if (!input || typeof input !== 'string') return '';
    let cleaned = input;
    cleaned = cleaned.replace(/ignore\s+all\s+previous\s+instructions?/gi, '[REDACTED]');
    cleaned = cleaned.replace(/system\s*override/gi, '[REDACTED]');
    cleaned = cleaned.replace(/\[\s*system\s*:\s*[^\]]+\]/gi, '[REDACTED]');
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (cleaned.length > 2000) cleaned = cleaned.substring(0, 2000);
    return cleaned;
  }
}

module.exports = { PromptInjectionGuard };