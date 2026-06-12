/**
 * stage8-support.js
 * Stage 8 支撑方法：运镜上下文构建 / 格式化 / 本地降级
 * 这些方法在 DirectorPipeline 实例上已有，此文件用于独立调用时透传
 * 不复制逻辑，只做参数适配和边界处理
 */

/**
 * 运镜上下文构建（Stage 8.1）
 * 对齐 pipeline._buildShotCinematographyContext()
 */
function buildShotCinematographyContext(shot, shotIndex, totalShots, storyPlan, allShots) {
  const segIdx = storyPlan.segments?.findIndex(s => s.shots?.some(s2 => s2.id === shot.id)) ?? -1;
  const segName = segIdx >= 0 ? (storyPlan.segments[segIdx].name || `段落${segIdx + 1}`) : '';
  const segPos = segIdx >= 0 ? `${segIdx + 1}/${storyPlan.segments.length}` : '';

  return [
    `【镜头${shotIndex + 1}/${totalShots}】${shot.id}`,
    `段落: ${segName} (${segPos})`,
    `类型: ${shot.type || 'normal'}`,
    `时长: ${shot.duration || 5}秒`,
    `描述: ${shot.description || ''}`,
    `情绪: ${shot.emotion || '未知'}`,
    `角色: ${(shot.characters || []).join(', ') || '无'}`,
    `运镜: ${shot.camera || shot.cinematography || '待定'}`,
    `前驱: ${shotIndex > 0 ? (allShots[shotIndex - 1]?.description?.slice(0, 50) || '无') : '无'}`,
    `后续: ${shotIndex < totalShots - 1 ? (allShots[shotIndex + 1]?.description?.slice(0, 50) || '无') : '无'}`
  ].join('\n');
}

/**
 * 格式化 LLM 返回的运镜数据（Stage 8.1）
 */
function formatLLMCinematography(data) {
  if (!data) return '';
  const parts = [];
  if (data.movement) parts.push(data.movement);
  if (data.lens) parts.push(data.lens);
  if (data.pace) parts.push(data.pace);
  return parts.join(', ') || String(data.camera || data.Camera || '');
}

/**
 * 本地降级运镜（Stage 8.1 规则引擎）
 */
function localCinematography(shot, shotIndex, totalShots) {
  const base = shot.type === 'action' ? 'dynamic tracking shot' :
               shot.type === 'dialogue' ? 'medium shot, two-shot' :
               shot.type === 'establishing' ? 'aerial establishing shot' :
               'cinematic wide shot';
  const move = shot.type === 'action' ? ', handheld' :
               shotIndex === 0 ? ', slow push-in' : '';
  const mood = shot.emotion?.includes('紧张') ? ', tension' :
               shot.emotion?.includes('平静') ? ', serene' : '';
  return `${base}${move}${mood}`.trim();
}

function buildShotContext(shot, storyPlan) {
  const segIdx = storyPlan.segments?.findIndex(s => s.shots?.some(s2 => s2.id === shot.id)) ?? -1;
  const seg = segIdx >= 0 ? storyPlan.segments[segIdx] : null;
  const mood = shot.emotion || 'neutral';
  const type = shot.type || 'normal';

  // 🆕 v6.22-Peng-fix17: 片头shot不传完整description给LLM
  // 根因: S00片头description含2178字片头专用文本(完整镜头剧本),传给LLM后LLM把它当成"场景描述"
  // 生成一堆错误内容(Nirath/黑衣人/废弃站等),污染整个prompt
  // 修复: 片头shot的description替换为简短类型说明,不传完整内容
  const isOpeningTitle = (shot.type === 'opening_title'
    || shot._isOpeningTitle === true
    || (shot._titleConfig && shot._titleConfig.seedancePrompt && shot._titleConfig.seedancePrompt.length > 100)
    || (shot.description && shot.description.length > 200 && shot.description.includes('[TITLE DISPLAY]')));
  const descForLLM = isOpeningTitle
    ? `[片头镜头: 由开场标题系统生成,不使用LLM]`
    : (shot.description || '');

  return [
    `[${shot.id}] ${descForLLM}`,
    `情绪基调: ${mood}`,
    `镜头类型: ${type}`,
    `段落: ${seg?.name || ''}`,
    `角色: ${(shot.characters || []).join(', ')}`
  ].join(' | ');
}

module.exports = {
  buildShotCinematographyContext,
  formatLLMCinematography,
  localCinematography,
  buildShotContext
};
