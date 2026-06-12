// scripts/llm-validate-layer.js
// LLM驱动的故事计划验证层

class LLMValidateLayer {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  async validateStoryPlan(storyPlan) {
    if (!storyPlan) {
      return { valid: false, score: 0, issues: ['StoryPlan为空'] };
    }

    const issues = [];
    let score = 1.0;

    // 基本结构检查
    const hasSegments = Array.isArray(storyPlan.segments) && storyPlan.segments.length > 0;
    const hasShots = hasSegments && storyPlan.segments.some(s => Array.isArray(s.shots) && s.shots.length > 0);

    if (!hasSegments) {
      issues.push('缺少segments数组');
      score -= 0.5;
    }
    if (!hasShots) {
      issues.push('缺少shots数据');
      score -= 0.3;
    }

    // 检查每个segment
    if (hasSegments) {
      for (const seg of storyPlan.segments) {
        if (!seg.name) {
          issues.push(`Segment缺少name`);
          score -= 0.1;
        }
        if (!Array.isArray(seg.shots) || seg.shots.length === 0) {
          issues.push(`Segment "${seg.name || '?'}" 缺少shots`);
          score -= 0.1;
        }
      }
    }

    const valid = score >= 0.5 && issues.length === 0;

    if (this.verbose) {
      console.log(`[LLMValidateLayer] 验证完成: valid=${valid}, score=${score}, issues=${issues.length}`);
    }

    return {
      valid,
      score: Math.max(0, score),
      issues,
      stats: {
        segments: storyPlan.segments?.length || 0,
        shots: storyPlan.segments?.reduce((a, s) => a + (s.shots?.length || 0), 0) || 0
      }
    };
  }

  printReport() {
    // no-op: validation report already printed during validateStoryPlan
  }
}

module.exports = { LLMValidateLayer };
