
/**
 * 🆕 v1.4-Peng: 生成声音层注入文本
 * 将audioLayer声音描述转化为Seedance Prompt可用的声音指令
 * Seedance --generate-audio 会根据Prompt中的声音描述同步生成音频
 */
function _generateSoundInjection(audioLayer, beastId) {
  if (!audioLayer) return '';
  
  const parts = [];
  
  // 1. 开场白声音（角色台词，非旁白）
  // 旁白禁止约束：开场白必须是角色台词，不是旁白解说
  if (audioLayer.metadata) {
    const beastName = audioLayer.metadata.beastName || beastId;
    const fixedAnchor = audioLayer.metadata.fixedAnchor;
    const suspenseHook = audioLayer.metadata.suspenseHook;
    
    if (fixedAnchor) {
      parts.push(`a deep resonant bass voice with strong chest resonance and metallic undertone speaks slowly from the depths of the ancient cavern: "${fixedAnchor}"`);
    }
    if (suspenseHook) {
      parts.push(`the same voice continues with deliberate pauses between each word: "${suspenseHook}"`);
    }
  }
  
  // 2. 震撼音效（根据异兽特点定制）
  const beastSfx = _getBeastSoundEffects(beastId);
  if (beastSfx) {
    parts.push(beastSfx);
  }
  
  // 3. 环境音（Nirath星球特有）
  parts.push('sub-bass earth rumble 20-60Hz vibrating through the ground, Nirath magnetic field humming resonating with the beast\'s energy, bioluminescent spore particles pulsing with subtle rhythmic sound');
  
  return parts.join('. ');
}

/**
 * 🆕 v1.4-Peng: 获取异兽专属音效描述
 */
function _getBeastSoundEffects(beastId) {
  const sfxMap = {
    'xingtian': 'massive axe swoosh cutting through air with shockwave, shield clang resonating like ancient war drum deep reverberation, sub-bass earth rumble 20-60Hz as the beast moves, battle aura humming with low frequency vibration',
    'zhulong': 'deep dragon roar with harmonic overtones, scales shifting with crystalline chime sound, breath creating wind howl through canyon, eye blinking with thunderclap resonance',
    'jiuweihu': 'nine tails swaying with wind chime harmony, soft paw steps on crystal surface creating bell-like tones, gentle breathing with flute-like melody, fox chirp echoing through mist'
  };
  
  return sfxMap[beastId] || 'ancient beast presence creating low frequency hum, footsteps causing ground vibration audible, breathing creating atmospheric pressure waves';
}

// 🆕 v1.4-Peng: 导出声音注入函数供外部调用
module.exports._generateSoundInjection = _generateSoundInjection;