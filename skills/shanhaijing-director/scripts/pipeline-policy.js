// scripts/pipeline-policy.js
// 统一 pipeline 级别规则（确认词/阈值/路径）
module.exports = {
  PIPELINE_POLICY: {
    PREPRODUCTION_CONFIRM_WORDS: [
      '确认', '执行', '开始', '可以提交渲染', 'GO', '提交吧'
    ],
    PREPRODUCTION_INVALID_WORDS: [
      '嗯', '好的', 'OK', '行', '发来看看', '我看一下', '随便', '你决定'
    ],
    QUALITY_THRESHOLDS: {
      STORYBOARD_PASS_SCORE: 2.0,
      DIRECTOR_PASS_SCORE: 4.0
    },
    PATHS: {
      STORY_PLAN_RELATIVE: '01-story/story-plan.json',
      PRD_RELATIVE: '00-prd/prd.md',
      REPORT_DIR_RELATIVE: '99-reports',
      PROMPTS_DIR_RELATIVE: '04-prompts'
    }
  }
};
