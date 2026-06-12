/**
 * Spectacle Planner — 奇观设计器 (M5)
 * 设计 AI 视觉奇观，发挥 AI 视频优势
 */
function run(input) {
  const cinematography = input.cinematography || {};
  const spectacleLevel = input.spectacleLevel || 'standard';
  const videoType = input.videoType || 'commercial';

  const spectacleTypes = {
    action: [
      { type: 'creatureReveal', desc: '异兽登场', prompt: '宏大环境+全貌reveal+动态光影', duration: 6 },
      { type: 'transformation', desc: '变身化形', prompt: '粒子转换效果+形态切换', duration: 4 },
      { type: 'magicRelease', desc: '法术释放', prompt: '手势→能量聚集→释放→击中', duration: 3 },
      { type: 'sceneReveal', desc: '场景奇观', prompt: '遮挡物→逐渐reveal→全景震撼', duration: 8 },
      { type: 'battleImpact', desc: '战斗冲击', prompt: '对峙→冲击瞬间→冲击波扩散', duration: 4 }
    ],
    drama: [
      { type: 'emotionalVisual', desc: '情绪视觉', prompt: '人物表情+环境呼应情绪+特效', duration: 3 },
      { type: 'sceneReveal', desc: '场景奇观', prompt: '光影变化+氛围转换', duration: 5 }
    ]
  };

  const pool = spectacleTypes[videoType] || spectacleTypes.action;
  const spectacles = [];
  let shotNum = 1;
  const shots = cinematography.shotPlan || [];

  for (const shot of shots) {
    if (shot.tension > 70 || (spectacleLevel === 'maximum' && shot.tension > 40)) {
      const spec = pool[spectacles.length % pool.length];
      spectacles.push({
        shotId: shot.shotId || shot.id,
        type: spec.type,
        description: spec.desc,
        seedancePrompt: spec.prompt,
        duration: spec.duration,
        emotionalContext: shot.emotionStart || '震撼'
      });
    }
    shotNum++;
  }

  return {
    spectacles,
    spectacleDensity: {
      total: spectacles.length,
      big: spectacles.filter(s => s.duration >= 5).length,
      small: spectacles.filter(s => s.duration < 5).length
    },
    level: spectacleLevel
  };
}
module.exports = { run };
