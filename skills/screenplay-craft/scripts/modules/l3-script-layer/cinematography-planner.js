/**
 * Cinematography Planner — 镜头预规划器 (L3)
 * 在剧本阶段规划镜头语言，为下游 shot-design 提供详细指导
 */
function run(input) {
  const sceneData = input.sceneData || { scenes: [] };
  const structureData = input.structureData || { acts: [] };
  const videoType = input.videoType || 'commercial';
  const visualStyle = input.visualStyle || '写实电影质感,动态光影,电影级构图';
  const totalDuration = input.totalDuration || 180;
  const spectaclePlan = input.spectaclePlan || null;

  const shotPlan = [];
  const emotionCurve = [];
  let currentTime = 0;
  let shotNum = 1;

  for (const scene of sceneData.scenes || []) {
    const sceneDuration = scene.durationEstimate || Math.round(totalDuration / (sceneData.scenes?.length || 10));
    const shotsPerScene = scene.shots?.length || 2;

    for (const shot of (scene.shots || [])) {
      const duration = shot.duration || Math.round(sceneDuration / shotsPerScene);
      const tension = Math.min(100, Math.round((currentTime / totalDuration) * 100));

      shotPlan.push({
        shotId: `S${String(shotNum).padStart(2,'0')}`,
        act: scene.slugLine?.includes('起') ? '起' : scene.slugLine?.includes('承') ? '承' : scene.slugLine?.includes('转') ? '转' : '合',
        actIndex: Math.ceil(shotNum / Math.ceil(sceneData.scenes?.length / 4)),
        duration,
        timeRange: `${currentTime}-${currentTime + duration}s`,
        type: shot.type || '过渡',
        description: shot.description || `${scene.action || ''}`,
        camera: {
          shotSize: tension > 70 ? '特写' : tension > 40 ? '中景' : '全景',
          angle: videoType === 'action' ? '仰拍' : '平视',
          movement: shot.cameraDirection || '推轨推进',
          lens: tension > 70 ? '长焦' : '广角'
        },
        lighting: videoType === 'action' ? '逆光暗金+冰蓝自发光' : videoType === 'drama' ? '侧光戏剧感+眼神光' : '柔和漫射光',
        composition: '三分法',
        colorPalette: videoType === 'action' ? ['#FFD700', '#00BFFF'] : videoType === 'drama' ? ['#FFB6C1', '#87CEEB'] : ['#F5F5F5', '#4169E1'],
        handoff: tension > 70 ? '动作定格' : '画面趋于静止',
        transition: { type: shotNum % 3 === 0 ? '交叉溶解' : '硬切', duration: shotNum % 3 === 0 ? 1 : 0.5 },
        tension,
        emotionStart: tension < 30 ? '宁静' : tension < 60 ? '紧张' : '激烈',
        emotionEnd: tension < 40 ? '警觉' : tension < 70 ? '对抗' : '爆发',
        characters: scene.shotCharacters || [scene.slugLine?.split('.')[1]?.trim() || '主角'],
        isSpectacle: spectaclePlan && Math.random() > 0.7,
        spectacleType: null
      });

      emotionCurve.push({ time: currentTime, tension });
      currentTime += duration;
      shotNum++;
    }
  }

  return {
    visualManifesto: visualStyle,
    videoType, // 🆕 存储视频类型供 exporter 使用
    lightingSystem: {
      keyLight: videoType === 'action' ? '主光从侧面45度打入，强调轮廓' : '柔和正面光',
      fillLight: '补光强度30%，保留阴影层次',
      backLight: '逆光勾勒轮廓，分离主体与背景',
      colorTemperature: videoType === 'drama' ? '暖色温3200K' : '标准5600K'
    },
    shotPlan,
    emotionCurve
  };
}
module.exports = { run };
