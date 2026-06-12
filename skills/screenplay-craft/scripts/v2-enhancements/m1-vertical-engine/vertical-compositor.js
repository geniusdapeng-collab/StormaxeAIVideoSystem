/**
 * Vertical Compositor — 竖屏镜头转换器 (M1)
 * 将横屏镜头语言转换为竖屏 9:16
 */
function convert(cinematography, config) {
  const aspectRatio = config.aspectRatio || '9:16';
  const shotPlan = (cinematography.shotPlan || []).map(shot => {
    // 转换景别描述
    let camera = shot.camera;
    if (typeof camera === 'object') {
      const sizeMap = { '全景': '竖屏半全景，人物占画面30%', '中景': '竖屏中近景，人物占画面60%', '近景': '竖屏胸像，占70%', '特写': '竖屏面部特写，占80%' };
      const moveMap = { '推轨推进': '纵向推进，从全身推至面部', '航拍': '纵向拉远，revealing宏大背景' };
      camera = {
        ...camera,
        shotSize: sizeMap[camera.shotSize] || camera.shotSize,
        movement: moveMap[camera.movement] || camera.movement
      };
    }

    // 转换描述
    let description = shot.description || '';
    description = description.replace(/全景/g, '竖屏构图').replace(/横移/g, '上下摇镜');

    return { ...shot, camera, description };
  });

  return { converted: true, aspectRatio, shotPlan };
}
module.exports = { convert };
