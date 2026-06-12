#!/usr/bin/env node
/**
 * Character Forge — 角色锻造炉 (L2)
 * 深度设计角色系统：角色弧光、关系网络、差异化设计
 */

function run(input) {
  const worldData = input.worldData || {};
  const themeData = input.themeData || {};
  const structureData = input.structureData || {};
  const count = input.characterCount || 3;
  const protagonistHint = input.protagonistHint || '';
  const antagonistHint = input.antagonistHint || '';

  // 内置角色模板库
  const templates = {
    action: [
      { name: '大圣', role: 'protagonist', species: '猴形灵体', features: ['火眼金睛', '金色毛发', '矫健身姿'], signature: '燃烧长棒', personality: { coreDesire: '自由', coreFear: '被束缚', lieTheyBelieve: '力量就是自由', truthTheyNeed: '真正的自由是责任' }, arc: { startingState: '桀骜不驯', incitingChange: '被迫踏上旅程', midpointShift: '意识到同伴的重要', darkestMoment: '失去力量', climaxChoice: '为保护他人而牺牲自我', endingState: '成熟与担当' } },
      { name: '机甲', role: 'antagonist', species: '银甲战争机甲', features: ['冰蓝核心', '厚重装甲', '能量光束'], signature: '等离子盾', personality: { coreDesire: '秩序', coreFear: '混乱', lieTheyBelieve: '秩序高于一切', truthTheyNeed: '秩序需要包容差异' }, arc: { startingState: '冷酷执行命令', incitingChange: '遇到无法用规则解决的问题', midpointShift: '开始质疑指令', darkestMoment: '背叛创造者', climaxChoice: '选择守护而非征服', endingState: '找到新的存在意义' } },
      { name: '灵狐', role: 'mentor', species: '九尾灵狐', features: ['白色毛发', '九条尾巴', '金色眼眸'], signature: '幻术珠', personality: { coreDesire: '守护平衡', coreFear: '失衡毁灭', lieTheyBelieve: '必须独自守护', truthTheyNeed: '可以信任他人' } }
    ],
    drama: [
      { name: '男主', role: 'protagonist', species: '人类', features: ['深邃眼神', '温暖笑容', '略带沧桑'], signature: '旧怀表', personality: { coreDesire: '被理解', coreFear: '孤独', lieTheyBelieve: '爱是软肋', truthTheyNeed: '爱是勇气' } },
      { name: '女主', role: 'love', species: '人类', features: ['清澈目光', '温柔坚定', '独立气质'], signature: '手写信', personality: { coreDesire: '真实的连接', coreFear: '被欺骗', lieTheyBelieve: '完美才能被爱', truthTheyNeed: '真实才值得被爱' } }
    ],
    educational: [
      { name: '施救者', role: 'protagonist', species: '急救员', features: ['蓝色急救背心', '短发', '专注表情'], signature: '标准环抱手势', personality: { coreDesire: '救助他人', coreFear: '无能为力' }, arc: { startingState: '准备教学', incitingChange: '患者出现窒息', midpointShift: '发现关键步骤', darkestMoment: '操作失败', climaxChoice: '冷静重试', endingState: '成功救人' } },
      { name: '患者', role: 'ally', species: '普通人', features: ['面色发紫', '双手捂喉', '弯腰'], signature: '窒息痛苦表情', personality: { coreDesire: '恢复呼吸', coreFear: '窒息' } }
    ],
    commercial: [
      { name: '用户体验官', role: 'protagonist', species: '都市白领', features: ['职业装', '自信笑容', '干练气质'], signature: '产品体验手势', personality: { coreDesire: '高效生活', coreFear: '落后时代' } },
      { name: '产品专家', role: 'mentor', species: '专业人士', features: ['商务休闲', '温和眼神', '专业气质'], signature: '产品演示动作', personality: { coreDesire: '传递价值', coreFear: '被误解' } }
    ]
  };

  // 🆕 IP 模式：根据 IP 解析结果生成角色
  const ipAnalysis = input.ipAnalysis || input.ipCharacterMapping || null;
  if (ipAnalysis?.spiritualCore?.coreDNA) {
    const ipChars = ipAnalysis.characterMatrix?.characterMatrix || ipAnalysis.characterMatrix || null;
    const sourceTitle = input.sourceTitle || '';
    // 西游记角色映射
    if (sourceTitle.includes('西游记') || ipAnalysis.sourceTitle?.includes('西游记')) {
      return {
        characters: [
          { id: 'C01', name: '悟空', role: 'protagonist', species: '石猴灵体', features: ['火眼金睛', '金色紧箍', '矫健身姿'], signature: '如意金箍棒', personality: { coreDesire: '自由', coreFear: '被束缚', lieTheyBelieve: '力量就是自由', truthTheyNeed: '真正的自由是责任' }, arc: { startingState: '失去记忆的灵猴', incitingChange: '觉醒前世记忆', midpointShift: '发现记忆并非真相', darkestMoment: '面对曾经的罪孽', climaxChoice: '选择原谅还是复仇', endingState: '超越宿命的新悟空' }, voiceProfile: { speakingStyle: '桀骜不羁', vocabularyLevel: '口语化', catchphrases: ['俺老孙来也', '吃我一棒'], emotionRange: ['愤怒', '坚定', '悲悯'] }, visualDesignNotes: '石猴灵体，火眼金睛，金色紧箍，矫健身姿', seedanceCharFormat: { name: '悟空', species: '石猴灵体', features: '火眼金睛,金色紧箍,矫健身姿', signature: '如意金箍棒', style: worldData.atmosphereKeywords?.join(',') || '写实电影质感,动态光影,电影级构图' } },
          { id: 'C02', name: '菩提祖师', role: 'mentor', species: '仙风道骨老者', features: ['白发长须', '青色道袍', '深邃目光'], signature: '拂尘', personality: { coreDesire: '传承道法', coreFear: '道统断绝', lieTheyBelieve: '天意不可违', truthTheyNeed: '变革才是传承' } },
          { id: 'C03', name: '白骨夫人', role: 'antagonist', species: '白骨妖灵', features: ['苍白面容', '黑衣如墨', '幽蓝鬼火'], signature: '白骨扇', personality: { coreDesire: '复仇', coreFear: '被遗忘', lieTheyBelieve: '仇恨是唯一的意义', truthTheyNeed: '放下才能获得新生' } }
        ],
        relationshipMap: { 'C01-C02': { type: '师徒', dynamic: '传承与觉醒', evolution: '从依赖到超越' }, 'C01-C03': { type: '宿敌', dynamic: '前世恩怨', evolution: '从仇恨到理解' } },
        ensembleBalance: '1主1反1辅，铁三角结构'
      };
    }
    // 山海经角色映射
    if (sourceTitle.includes('山海经')) {
      return {
        characters: [
          { id: 'C01', name: '灵巫', role: 'protagonist', species: '人族巫祝', features: ['兽皮披风', '骨饰面具', '手持法杖'], signature: '青铜铃', personality: { coreDesire: '守护部族', coreFear: '失去力量' }, arc: { startingState: '初入巫道', incitingChange: '异兽入侵', midpointShift: '发现真相', darkestMoment: '力量反噬', climaxChoice: '牺牲自我', endingState: '成为传说' } },
          { id: 'C02', name: '九尾', role: 'mentor', species: '九尾白狐', features: ['白色毛发', '九条尾巴', '金色眼眸'], signature: '幻术珠', personality: { coreDesire: '守护平衡', coreFear: '失衡毁灭' } }
        ],
        relationshipMap: { 'C01-C02': { type: '师徒', dynamic: '人妖共修', evolution: '从恐惧到信任' } },
        ensembleBalance: '1主1辅'
      };
    }
    // 通用 IP 角色
    return {
      characters: [
        { id: 'C01', name: '新主角', role: 'protagonist', species: '人', features: ['独特外貌', '标志性装饰'], signature: '信物', personality: { coreDesire: '追寻真相', coreFear: '迷失自我' }, arc: { startingState: '平凡开始', incitingChange: '意外觉醒', midpointShift: '发现真相', darkestMoment: '信念动摇', climaxChoice: '最终抉择', endingState: '蜕变新生' } },
        { id: 'C02', name: '宿敌', role: 'antagonist', species: '人', features: ['压迫感气场', '独特标志'], signature: '武器', personality: { coreDesire: '统治', coreFear: '失去控制' } }
      ],
      relationshipMap: { 'C01-C02': { type: '对抗', dynamic: '宿命对决', evolution: '从对立到理解' } },
      ensembleBalance: '1主1反'
    };
  }

  // 🆕 根据 videoType 优先判断角色类型，再 fallback 到主题/风格
  let worldType = (input.videoType || '').toLowerCase();
  if (!worldType || !templates[worldType]) {
    const worldName = (worldData.worldName || '').toLowerCase();
    const coreTheme = (themeData.coreTheme || '').toLowerCase();
    const styleHint = (worldData.atmosphereKeywords || []).join('').toLowerCase();
    if (worldName.includes('灵') || styleHint.includes('国漫') || styleHint.includes('神话')) worldType = 'action';
    else if (coreTheme.includes('爱') || coreTheme.includes('情感') || coreTheme.includes('成长')) worldType = 'drama';
    else if (styleHint.includes('写实') || styleHint.includes('清晰') || styleHint.includes('教学') || coreTheme.includes('知识')) worldType = 'educational';
    else if (styleHint.includes('商业') || styleHint.includes('产品') || styleHint.includes('品牌')) worldType = 'commercial';
    else worldType = 'action';
  }
  const pool = templates[worldType] || templates.action;

  // 根据需求数量取角色
  const characters = pool.slice(0, count).map((t, i) => ({
    id: `C${String(i+1).padStart(2,'0')}`,
    ...t,
    voiceProfile: {
      speakingStyle: t.role === 'protagonist' ? '坚定有力' : t.role === 'antagonist' ? '冷静低沉' : '温和睿智',
      vocabularyLevel: '中等',
      catchphrases: t.role === 'protagonist' ? ['我不会退缩', '还有别的路'] : t.role === 'antagonist' ? ['这是唯一的选择', '你不懂'] : ['一切皆有定数'],
      emotionRange: t.role === 'protagonist' ? ['愤怒', '坚定', '温柔'] : ['冷酷', '犹豫', '释然']
    },
    visualDesignNotes: `${t.species}，${t.features.join('，')}，标志性${t.signature}`,
    seedanceCharFormat: {
      name: t.name,
      species: t.species,
      features: t.features.join(','),
      signature: t.signature,
      style: worldData.atmosphereKeywords?.join(',') || '写实电影质感,动态光影,电影级构图'
    }
  }));

  // 关系网络
  const relationshipMap = {};
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const key = `${characters[i].id}-${characters[j].id}`;
      const c1 = characters[i], c2 = characters[j];
      if (c1.role === 'protagonist' && c2.role === 'antagonist') {
        relationshipMap[key] = { type: '对抗', dynamic: '理念冲突', evolution: '从对立到理解' };
      } else if (c1.role === 'protagonist' && c2.role === 'mentor') {
        relationshipMap[key] = { type: '师徒', dynamic: '指导与成长', evolution: '从依赖到独立' };
      } else if (c1.role === 'protagonist' && c2.role === 'love') {
        relationshipMap[key] = { type: '情感', dynamic: '吸引与试探', evolution: '从误解到信任' };
      } else {
        relationshipMap[key] = { type: '关联', dynamic: '互动推动剧情', evolution: '关系深化' };
      }
    }
  }

  return {
    characters,
    relationshipMap,
    ensembleBalance: `${characters.length}个角色，${characters.filter(c=>c.role==='protagonist').length}主+${characters.filter(c=>c.role==='antagonist').length}反+${characters.filter(c=>!['protagonist','antagonist'].includes(c.role)).length}辅`
  };
}

module.exports = { run };
