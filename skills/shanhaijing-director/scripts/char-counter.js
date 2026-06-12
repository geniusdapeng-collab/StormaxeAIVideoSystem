/**
 * CharCounter v2.1-Peng（fix5-词上限修复版）
 * 统一字符数计算工具
 *
 * 业务逻辑规则：
 * - 真实字符计数（[...str].length），直接反映文件实际大小
 * - 加权计数（countWeighted）仅供旧日志兼容展示，不参与业务逻辑
 *
 * v6.27-Peng 更新（2026-06-09）：
 * - 英文词上限：1000词
 * - 中文台词上限：500字
 * - 总字符预算：6500字符（≈6000英文字符+500中文台词）
 * - 最终提交Seedance前压缩到API要求（1499字符）
 */

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function _isChineseChar(char) {
  if (!char || char.length === 0) return false;
  const code = char.codePointAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df)
  );
}

// ─── 主类 ───────────────────────────────────────────────────────────────────

class CharCounter {
  constructor() {
    this.TARGET_MAX   = 6500;   // 英文1000词+中文台词500字≈6500字符
    this.HARD_LIMIT   = 6500;   // 硬上限（不可超）
    this.SAFETY_MARGIN = 50;
  }

  /**
   * 业务逻辑计数：真实字符数
   * 用于所有业务判断（截断、补齐、质检）
   */
  count(str) {
    if (!str || typeof str !== 'string') return 0;
    return [...str].length;
  }

  /**
   * 截断到指定字符数
   * 🆕 fix15-v9: 路径安全截断 — 避开 .png 路径中间
   * 根因: 原实现 chars.slice(0, max).join('') 在字符序列中间切断,会产生 '.../20260607010109' 这种残片
   * 修复: 切断后检测是否包含未完整结束的 PNG 路径,若是则回退到最近 ', ' / ' | ' 分隔符
   * 路径数多于可容纳数时,优先保留全部描述 + 部分路径 (按顺序从头开始)
   * 额外保护: 如果 result 在 '/小G/小G-X' 或 '/X-X.X' 这样的路径中字被切断,也需回退
   */
  truncate(str, max = this.TARGET_MAX) {
    if (!str || typeof str !== 'string') return '';
    const chars = [...str];
    if (chars.length <= max) return str;
    let result = chars.slice(0, max).join('');
    // fix15-v9: 路径安全 — 多重检测
    const hasPng = /\.png/.test(result);
    const endsWithPng = /\.png\s*[,|]?[\s'"]*$/.test(result);
    // 检测是否在路径中字被切断: 以 '.png' 前缀或 '路径/X-' 结尾 (中文目录名)
    // 简化: 如果 result 包含 '.png' 但不结束于完整路径,需要回退
    // 或者: result 末段是 '<中文>/<中文>...' 模式 (路径中字)
    const isMidPath = hasPng && !endsWithPng;
    // 额外检测: 不含 .png 但 result 末尾是 '<中文>/<中文>...' (例如 '/小G/小')
    // 如果 result 以 '/' 结尾 + 1-2 个汉字, 推测是路径中字
    const tailIsMidPath = /\/[\u4e00-\u9fa5]{1,3}$/.test(result) && !endsWithPng;
    if (isMidPath || tailIsMidPath) {
      // 优先 ', ' (路径分隔符) → ' | ' (元数据分隔符) → 最后回退到 .png
      let lastSep = result.lastIndexOf(', ');
      if (lastSep < 0) lastSep = result.lastIndexOf(' | ');
      if (lastSep > 0) {
        result = result.substring(0, lastSep);
      } else if (hasPng) {
        const lastPng = result.lastIndexOf('.png');
        if (lastPng > 0) {
          result = result.substring(0, lastPng + 4);
        }
      }
    }
    return result.trim();
  }

  /**
   * 计算利用率（0-1）
   */
  utilization(str, max = this.TARGET_MAX) {
    const len = this.count(str);
    return max > 0 ? (len / max) : 0;
  }

  /**
   * 检查是否超过目标
   */
  exceedsTarget(str) {
    return this.count(str) > this.TARGET_MAX;
  }

  /**
   * 检查是否超过硬上限
   */
  exceedsHardLimit(str) {
    return this.count(str) > this.HARD_LIMIT;
  }

  /**
   * 剩余可用字符数
   */
  remaining(str) {
    return Math.max(0, this.TARGET_MAX - this.count(str));
  }

  // ─── 仅供旧日志兼容的加权计数（不参与业务逻辑）───────────

  /**
   * 加权计数：汉字=1.5，英文=1
   * 仅用于旧日志展示兼容，新代码统一用 count()
   */
  countWeighted(str) {
    if (!str || typeof str !== 'string') return 0;
    let total = 0;
    for (const char of str) {
      total += _isChineseChar(char) ? 1.5 : 1;
    }
    return total;
  }

  /** v6.27-Peng: 统计英文单词数（排除中文后） */
  countEnglishWords(str) {
    if (!str || typeof str !== 'string') return 0;
    const noCN = str.replace(/[\u4e00-\u9fff]/g, ' ');
    const words = noCN.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
    return words ? words.length : 0;
  }

  /** v6.27-Peng: 统计中文字符数 */
  countChineseChars(str) {
    if (!str || typeof str !== 'string') return 0;
    const chars = str.match(/[\u4e00-\u9fff]/g);
    return chars ? chars.length : 0;
  }
}

// ─── 单例 ───────────────────────────────────────────────────────────────────

const charCounter = new CharCounter();

module.exports = {
  CharCounter,
  charCounter,
  // 快捷函数
  countChars:      (str) => charCounter.count(str),
  charUtilization: (str) => charCounter.utilization(str),
  truncateToChars: (str, max) => charCounter.truncate(str, max),
  countWeighted:   (str) => charCounter.countWeighted(str),
  // 常量
  TARGET_MAX:      6500,   // 英文1000词+中文台词500字≈6500字符
  HARD_LIMIT:      6500,   // 硬上限
  SAFETY_MARGIN:   50
};
