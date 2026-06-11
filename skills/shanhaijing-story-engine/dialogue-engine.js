/**
 * Dialogue Engine v6.4-Peng — 镜头专属台词版（生产版本）
 * 核心设计: 每个镜头有专属台词，不循环复用
 * 旁白彻底删除，小G台词极少
 * 刑天声线：腹部共鸣+脐部发声+心灵感应混合
 */

const DIALOGUE_TEMPLATES = {
  // 小G台词模板（童声，极少）
  xiaoG: {
    voiceProfile: {
      speed: 1.0, pitch: 1.1, emotion: 'curious', reverb: 0.0
    },
    byAct: {
      '起': [],
      '承': [],
      '转': [],
      '高潮': [
        "I... I understand. (voice trembles)",
        "You are... the bravest one.",
        "I will not forget you."
      ],
      '合': [
        "I will remember you, Xingtian.",
        "Thank you for showing me... what an eternal war spirit truly is."
      ]
    },
    byAct_Cn: {
      '起': [],
      '承': [],
      '转': [],
      '高潮': [
        '我...我明白了。（哽咽）',
        '你是...最勇敢的人。',
        '我不会忘记你。'
      ],
      '合': [
        '我会记住你的，刑天。',
        '谢谢你让我看到...什么是不灭的战魂。'
      ]
    }
  },
  
  // 神兽台词模板 — 刑天内心独白/战魂低语
  beast: {
    voiceProfile: {
      speed: 0.7, pitch: 0.8, emotion: 'epic', reverb: 0.6
    },
    byAct: {
      '起': [
        "Another footstep... light as the hunter child three thousand years ago. (War spirit senses) When was the last time I heard footsteps?",
        "Such a small life... the twin suns have not yet pierced his shadow, yet he dares enter my canyon.",
        "He looks at me? Not the rock, not the shadow... he looks at me. (Confused, war spirit focuses)"
      ],
      '承': [
        "He fell. He rose. (Pause, navel voice grows hoarse) Last time someone rose before me, it was the Yellow Emperor's soldier.",
        "Two lights in his eyes — one is fear. What is the other? (War spirit senses deeply)",
        "My axe and shield halt mid-air. (Shocked, energy freezes) Why stop? The war spirit does not stop."
      ],
      '转': [
        "He sees. He truly sees. (War spirit trembles, cannot believe) Not the axe and shield, but where they swing.",
        "He reads my memories? (Shudders) No. He feels. His heartbeat resonates with my war spirit...",
        "That is not the sky. (Whispers, energy narrows to a line) That is my enemy, eternal enemy."
      ],
      '高潮': [
        "He walks toward me. (War spirit shudders, energy transfer begins) Unafraid of this headless body?",
        "His tears are not fear... but awe. (War spirit trembles at peak) For me? First time in three thousand years.",
        "Remember this feeling, child. (Legacy declaration, belly resonance peaks) Not remember Xingtian. Remember this — the feeling of fighting on."
      ],
      '合': [
        "Go, child. (Released, energy ebbs like receding tide) Carry my story outward.",
        "The hunter child from three thousand years ago aged and died. (Whispers, war spirit flickers)",
        "The war spirit... never extinguishes. (Final resonance before dissipation) Not because I am strong... but because you remember."
      ]
    },
    byAct_Cn: {
      '起': [
        '又一个脚步声...轻得像三千年前的猎户孩童。（战魂感知）上次听到脚步声是什么时候？',
        '这么小的生命...双日还没穿透他的影子，就敢进入我的峡谷。',
        '他看着我？不是岩石，不是影子...他看着我。（困惑，战魂聚焦）'
      ],
      '承': [
        '他跌倒了。他站了起来。（停顿，脐音沙哑）上次有人在我面前站起来，是黄帝的士兵。',
        '他眼中有两道光——一道是恐惧。另一道是什么？（战魂深深感知）',
        '我的斧和盾停在半空。（震惊，能量冻结）为什么停？战魂不会停。'
      ],
      '转': [
        '他看见了。他真的看见了。（战魂颤抖，不敢相信）不是斧和盾，而是它们挥向的地方。',
        '他在读取我的记忆？（战栗）不。他在感受。他的心跳与我的战魂共鸣...',
        '那不是天空。（低语，能量缩成一线）那是我的敌人，永恒的敌人。'
      ],
      '高潮': [
        '他向我走来。（战魂颤抖，能量转移开始）不怕这个无头的身体？',
        '他的眼泪不是恐惧...而是敬畏。（战魂颤抖至巅峰）为我？三千年来的第一次。',
        '记住这份感觉，孩子。（传承宣言，腹部共鸣达到峰值）不是记住刑天，是记住这份——即使失去一切，依然在战斗的感觉。'
      ],
      '合': [
        '去吧，孩子。（释然，能量如退潮般消散）把我的故事带出去。',
        '三千年前的猎户孩子老了死了。（低语，战魂余韵如风中残烛）但他的孙子还记得。',
        '战魂...永不熄灭。（消散前的最后一声共鸣）不是因为我强...是因为你记住了。'
      ]
    }
  },
  
  narrator: {
    voiceProfile: { speed: 0.9, pitch: 1.0, emotion: 'neutral', reverb: 0.1 },
    byAct: { '起': [], '承': [], '转': [], '高潮': [], '合': [] }
  }
};

// 🆕 v6.4-Peng-fix: 镜头专属台词表（每个镜头唯一，不循环复用）
const SHOT_SPECIFIC_DIALOGUES = {
  'S00': null, // 无台词，标题展示
  'S01': {
    character: 'xiaoG',
    characterName: '小G',
    text: '这些石头...在发光？',
    voiceProfile: { speed: 1.0, pitch: 1.1, emotion: 'curious', reverb: 0.0 }
  },
  'S02': {
    character: 'xiaoG',
    characterName: '小G',
    text: '有人...在这里吗？',
    voiceProfile: { speed: 1.0, pitch: 1.1, emotion: 'curious', reverb: 0.0 }
  },
  'S03': {
    character: 'beast',
    characterName: '刑天',
    text: '又一个脚步声...轻得像三千年前的猎户孩童。',
    voiceProfile: { speed: 0.7, pitch: 0.8, emotion: 'epic', reverb: 0.6 }
  },
  'S04': {
    character: 'xiaoG',
    characterName: '小G',
    text: '他...没有头...',
    voiceProfile: { speed: 1.0, pitch: 1.1, emotion: 'shock', reverb: 0.0 }
  },
  'S05': {
    character: 'beast',
    characterName: '刑天',
    text: '他看着我？不是岩石...他看着我。',
    voiceProfile: { speed: 0.7, pitch: 0.8, emotion: 'fury', reverb: 0.6 }
  },
  'S06': {
    character: 'beast',
    characterName: '刑天',
    text: '【战吼】低沉的腹部共鸣震动，像远古战鼓在峡谷中回响。',
    voiceProfile: { speed: 0.6, pitch: 0.7, emotion: 'climax', reverb: 0.8 }
  },
  'S07': {
    character: 'beast',
    characterName: '刑天',
    text: '继承者...终于来了。',
    voiceProfile: { speed: 0.7, pitch: 0.8, emotion: 'transcendence', reverb: 0.6 }
  }
};

/**
 * 根据故事板生成台词
 * @param {Array} shots 故事板镜头数组
 * @param {Array} characters 角色数组
 * @param {string} outline 故事大纲
 * @returns {Object} 台词映射 { shotId: { character, text, voiceProfile } }
 */
function generateDialogues(shots, characters, outline) {
  const dialogues = {};
  
  // 🆕 v6.4-Peng-fix: 优先使用镜头专属台词（每个镜头唯一，不循环）
  for (const shot of shots) {
    const shotId = shot.id;
    const specific = SHOT_SPECIFIC_DIALOGUES[shotId];
    if (specific !== undefined) {
      if (specific === null) {
        dialogues[shotId] = null;
      } else {
        dialogues[shotId] = {
          character: specific.character,
          characterName: specific.characterName,
          text: specific.text,
          voiceProfile: specific.voiceProfile,
          act: shot.act || '起'
        };
      }
      continue;
    }
  }
  
  const _chars = Array.isArray(characters) ? characters : Object.values(characters || {});
  const beastName = _chars.find(c => c.role === 'beast' || c.role === 'antagonist')?.name;
  const mainChar = _chars[0]?.name || '小G';
  
  const usedLinesByActChar = {};
  
  for (const shot of shots) {
    const act = shot.act || '起';
    const shotId = shot.id;
    
    // 如果已用镜头专属台词，跳过
    if (dialogues[shotId] !== undefined) continue;
    
    let selectedChar, template;
    
    if (act === '起') {
      selectedChar = 'beast';
      template = DIALOGUE_TEMPLATES.beast;
    } else if (act === '承') {
      selectedChar = 'beast';
      template = DIALOGUE_TEMPLATES.beast;
    } else if (act === '转') {
      selectedChar = 'beast';
      template = DIALOGUE_TEMPLATES.beast;
    } else if (act === '高潮') {
      if (shot.description?.includes('流泪') || shot.description?.includes('特写') || shot.description?.includes('感悟')) {
        selectedChar = 'xiaoG';
        template = DIALOGUE_TEMPLATES.xiaoG;
      } else {
        selectedChar = 'beast';
        template = DIALOGUE_TEMPLATES.beast;
      }
    } else if (act === '合') {
      if (shot.description?.includes('日出') || shot.description?.includes('远景') || shot.id?.includes('S05-2')) {
        selectedChar = 'xiaoG';
        template = DIALOGUE_TEMPLATES.xiaoG;
      } else {
        selectedChar = 'beast';
        template = DIALOGUE_TEMPLATES.beast;
      }
    } else {
      selectedChar = 'beast';
      template = DIALOGUE_TEMPLATES.beast;
    }
    
    const actKey = act.split('/')[0] || '起';
    const actLines = template.byAct[actKey] || template.byAct['起'];
    const actCharKey = `${actKey}-${selectedChar}`;
    
    if (!usedLinesByActChar[actCharKey]) {
      usedLinesByActChar[actCharKey] = new Set();
    }
    const usedSet = usedLinesByActChar[actCharKey];
    
    let lineIndex = 0;
    while (usedSet.has(lineIndex) && lineIndex < actLines.length) {
      lineIndex++;
    }
    
    if (lineIndex >= actLines.length) {
      lineIndex = 0;
      usedSet.clear();
    }
    
    usedSet.add(lineIndex);
    const line = actLines[lineIndex];
    
    dialogues[shotId] = {
      character: selectedChar,
      characterName: selectedChar === 'xiaoG' ? mainChar : 
                     selectedChar === 'beast' ? beastName || '神兽' : '旁白',
      text: line,
      voiceProfile: template.voiceProfile,
      act: act
    };
  }
  
  return dialogues;
}

function generateDialogueScript(dialogues) {
  let md = '# 台词脚本\n\n';
  
  for (const [shotId, dialogue] of Object.entries(dialogues)) {
    if (!dialogue) {
      md += `## ${shotId}\n\n`;
      md += '- **台词**: 无（环境音/标题）\n\n';
      continue;
    }
    md += `## ${shotId}\n\n`;
    md += `- **角色**: ${dialogue.characterName}\n`;
    md += `- **声线**: 语速${dialogue.voiceProfile.speed}x, 音高${dialogue.voiceProfile.pitch}, 混响${dialogue.voiceProfile.reverb}\n`;
    md += `- **台词**: ${dialogue.text}\n\n`;
  }
  
  return md;
}

module.exports = {
  DIALOGUE_TEMPLATES,
  SHOT_SPECIFIC_DIALOGUES,
  generateDialogues,
  generateDialogueScript
};