/**
 * 🎭 创意标题动效设计师 - Opening Title Effect Designer v1.0-Peng
 * 
 * 负责设计标题和副标题的"创意出现方式"——不是静态显示，而是有生命、有动感的呈现。
 * 每个模板都有独特的生长/显现动效，让标题成为场景叙事的一部分。
 * 
 * 核心原则：
 * 1. 标题不是后期叠加，而是场景中的自然现象
 * 2. 每个笔画/字母都有独立的"生长时间轴"
 * 3. 动效必须呼应异兽特点和Nirath生态
 * 4. 8秒内完成，精确到0.5秒
 * 
 * 输出结构：
 * {
 *   titleEffect: { start, end, phases: [{ time, description, visual }] },
 *   subtitleEffect: { start, end, phases: [{ time, description, visual }] }
 * }
 */

const fs = require('fs');
const path = require('path');

/**
 * 标题动效设计器
 * @param {string} templateId - 模板ID
 * @param {string} title - 主标题文字
 * @param {string} subtitle - 副标题文字
 * @param {string} beastId - 神兽ID
 * @param {Object} beastInfo - 神兽信息
 * @returns {Object} 动效时间轴
 */
function designTitleEffect(templateId, title, subtitle, beastId, beastInfo) {
  console.log(`\n🎨 [TitleEffectDesigner] 设计标题动效: ${title}`);
  console.log(`   模板: ${templateId}, 神兽: ${beastId || '无'}`);

  const baseTime = 3.0; // 标题在第3秒开始显示（神兽登场之后）
  const titleDuration = 2.0; // 标题出现耗时2秒
  const subtitleDelay = 1.0; // 副标题延迟1秒出现
  const subtitleDuration = 1.5; // 副标题出现耗时1.5秒

  // 根据模板选择动效策略
  const effectStrategies = {
    mountain_carving: _designMountainCarvingEffect,
    beast_manifestation: _designBeastManifestationEffect,
    xiaoG_holding: _designXiaoGHoldingEffect,
    sky_projection: _designSkyProjectionEffect,
    crystal_formation: _designCrystalFormationEffect,
    water_reflection: _designWaterReflectionEffect,
    spore_lights: _designSporeLightsEffect
  };

  const strategy = effectStrategies[templateId] || _designMountainCarvingEffect;
  
  return strategy(title, subtitle, beastId, beastInfo, {
    titleStart: baseTime,
    titleDuration,
    subtitleStart: baseTime + subtitleDelay,
    subtitleDuration
  });
}

// ==================== 模板1: 山崖纹理动效 ====================
function _designMountainCarvingEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  return {
    template: 'mountain_carving',
    overallConcept: '岩壁天然纹理不是突然出现的，而是被某种力量"唤醒"的——光脉矿脉从岩壁深处逐笔点亮，生物荧光从裂缝中渗出，文字笔画像植物生长一样从岩层中浮现',
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: '光脉逐笔点亮 + 岩层生长浮现',
      phases: [
        {
          time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`,
          name: '光脉初现',
          description: '岩壁深处第一道紫金色光脉从裂缝中渗出，沿着"刑"字的第一笔走向缓缓流淌，像熔岩在岩石脉络中流动',
          visual: '紫金色光痕在灰暗岩壁上蜿蜒，宽度约2-3像素，亮度从0%渐增至30%',
          soundHint: '低频嗡鸣声开始出现，如同地底能量苏醒'
        },
        {
          time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.0).toFixed(1)}s`,
          name: '笔画点亮',
          description: '光脉分支出更多细小光痕，沿着"天"、"："、"不"、"灭"等笔画走向同时蔓延，岩壁表面生物荧光被唤醒，在笔画边缘形成蓝绿色发光轮廓',
          visual: '多道光痕同时从岩壁不同位置渗出，汇聚成完整字形，笔画边缘有0.5px的生物荧光发光晕',
          soundHint: '光脉嗡鸣声增强，加入细微的岩层震动共鸣'
        },
        {
          time: `${(titleStart + 1.0).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`,
          name: '纹理定型',
          description: '光脉达到最亮后缓缓稳定，岩壁天然风化纹理与光脉完美融合——光线不是覆盖纹理，而是让纹理本身发光，笔画中的地质层理清晰可见',
          visual: '字形发光稳定，紫金色光脉(80%亮度)与岩壁天然纹理叠加，笔画内部可见亿万年地质层理细节',
          soundHint: '嗡鸣声趋于稳定，成为环境底噪'
        },
        {
          time: `${(titleStart + 1.5).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`,
          name: '光晕扩散',
          description: '笔画周围的光脉向岩壁周边扩散，形成一圈淡淡的紫金色光晕，如同墨迹在宣纸上晕染——但这里是光在岩石上晕染',
          visual: '字形周围3-5cm范围有渐弱光晕，光晕边缘有虹脉孢子彩虹色散效果',
          soundHint: '光晕扩散伴随微弱的能量释放声，类似静电消散'
        }
      ],
      promptEnhancement: `标题不是静态文字，而是岩壁深处光脉矿脉被唤醒后逐笔流淌形成的——先见紫金色光痕从裂缝渗出，沿着笔画走向蜿蜒流淌，然后更多光痕同时从岩壁不同位置渗出，汇聚成完整字形，笔画边缘有蓝绿色生物荧光发光晕，最终光脉稳定发光并与岩壁天然地质层理完美融合，字形周围有淡淡的紫金色光晕向周边扩散。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '地衣蔓延拼合',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + 0.5).toFixed(1)}s`,
          name: '地衣萌发',
          description: '岩壁底部蓝绿色地衣开始以肉眼可见的速度生长，孢子从地衣母体扩散，在岩壁上留下发光轨迹',
          visual: '地衣边缘发出微弱的蓝绿色荧光，生长速度约1cm/秒，轨迹宽度约3-5mm',
          soundHint: '细微的生物生长声，类似植物抽芽的轻微摩擦声'
        },
        {
          time: `${(subtitleStart + 0.5).toFixed(1)}-${(subtitleStart + 1.0).toFixed(1)}s`,
          name: '轮廓成型',
          description: '地衣生长轨迹恰好构成"by Genius"的笔画轮廓，每个笔画都是独立的地衣菌落，菌落之间留有岩壁底色作为字间距',
          visual: '地衣拼合形成完整副标题，菌落密度均匀，边缘清晰，笔画内部可见地衣的纹理细节',
          soundHint: '地衣生长声渐强，与主标题的嗡鸣形成和声'
        },
        {
          time: `${(subtitleStart + 1.0).toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '稳定发光',
          description: '地衣菌落生长停止，但生物荧光继续脉动——如同呼吸般明暗变化，让整个副标题仿佛有生命',
          visual: '副标题稳定显示，但亮度以约0.5Hz频率轻微脉动(±10%)，脉动与主标题光晕同步',
          soundHint: '脉动伴随细微的生物电场嗡鸣'
        }
      ],
      promptEnhancement: `副标题不是静态文字，而是岩壁底部蓝绿色地衣（类视紫红质共生苔藓）以肉眼可见的速度生长拼合而成——地衣孢子从母体扩散，在岩壁上留下蓝绿色发光轨迹，轨迹恰好构成"by Genius"的笔画轮廓，最终地衣菌落稳定但生物荧光以呼吸般节奏脉动发光。`
    },
    overallPrompt: `标题呈现过程必须是动态的、有生长感的——不是静态叠加文字。主标题由岩壁深处光脉矿脉逐笔渗出流淌形成，副标题由地衣菌落蔓延生长拼合而成。整个过程2-3秒，观众能看到文字"生长"出来的过程。`
  };
}

// ==================== 模板2: 异兽显化动效 ====================
function _designBeastManifestationEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  const beastAbility = beastInfo?.abilities?.[0] || '能量释放';
  const manifestationType = _getManifestationType(beastAbility);
  
  return {
    template: 'beast_manifestation',
    overallConcept: `${beastInfo?.name || '神兽'}的${beastAbility}能力自然凝结成标题——不是施法，而是能力释放后的物理残留`,
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: `${manifestationType}凝结成型`,
      phases: _generateManifestationPhases(manifestationType, title, timing),
      promptEnhancement: `标题由${beastInfo?.name || '神兽'}释放${beastAbility}后的物理残留自然凝结而成——${manifestationType}从能量释放中心向四周扩散，在扩散轨迹中恰好构成字形轮廓，每个笔画都是能量残留的独立痕迹。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '余烬/残留物自然分布',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '残留物飘落',
          description: `能量释放后的细小残留物（${manifestationType === '火焰' ? '余烬' : manifestationType === '冰晶' ? '冰屑' : '电荷粒子'}）受重力飘落，在地面自然分布成副标题字形`,
          visual: '残留物飘落轨迹清晰，密度均匀，形成完整副标题',
          soundHint: '残留物落地的细微声响'
        }
      ],
      promptEnhancement: `副标题由能量释放后的残留物受重力飘落，在地面自然分布而成。`
    },
    overallPrompt: `标题呈现必须是能量物理现象的自然结果——不是神兽刻意为之，而是能力释放后的必然残留。`
  };
}

// ==================== 模板3: 探险者之证动效 ====================
function _designXiaoGHoldingEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  return {
    template: 'xiaoG_holding',
    overallConcept: 'Nirath环境对探险装备的自然反应——光线折射、冷凝水珠、氧化反应，让装备自己"说出"标题',
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: '双日光折射生长',
      phases: [
        {
          time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`,
          name: '光斑初现',
          description: '指南针玻璃表面因双日角度变化，开始折射出微弱的光斑，光斑在地面形成模糊的字形轮廓',
          visual: '地面上有淡淡的、不稳定的光字形，亮度约20%，边缘有虹脉孢子色散',
          soundHint: '细微的光折射高频音'
        },
        {
          time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`,
          name: '光字稳定',
          description: '双日角度达到最佳折射位置，光字从模糊变得清晰，字形稳定呈现，光字边缘有彩虹色散',
          visual: '光字清晰稳定，亮度60%，彩虹色散边缘约2-3mm',
          soundHint: '折射声趋于稳定'
        }
      ],
      promptEnhancement: `标题由指南针玻璃表面因双日特殊光谱折射在地面投射形成——光斑从模糊到清晰，边缘有虹脉孢子彩虹色散。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '氧化铜绿蔓延',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '铜绿生长',
          description: '指南针金属边框的氧化铜绿以化学反应速度蔓延，纹理恰好构成副标题字形',
          visual: '铜绿纹理清晰可见，与金属原色形成对比',
          soundHint: '细微的氧化反应声'
        }
      ],
      promptEnhancement: `副标题由指南针金属边框氧化铜绿自然蔓延纹理形成。`
    },
    overallPrompt: `标题呈现必须是Nirath环境对探险装备的自然光学/化学反应——不是科技投影。`
  };
}

// ==================== 模板4: 天象显字动效 ====================
function _designSkyProjectionEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  return {
    template: 'sky_projection',
    overallConcept: 'Nirath双恒星系统造成的大气物理现象——带电粒子云层分层，光线穿透电离层，在地面投射出巨大光影字',
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: '电离层光影生长',
      phases: [
        {
          time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`,
          name: '云层分层',
          description: '高层大气带电粒子云层开始分层，不同密度的电离层如幕布般展开',
          visual: '天空出现多层彩色光带，每层颜色不同',
          soundHint: '大气电离的静电声'
        },
        {
          time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`,
          name: '光字投射',
          description: '双日光线穿透不同密度电离层，在地面投射出巨大的光影字，每个字由亿万发光孢子组成',
          visual: '地面出现百米级巨大光影字，笔画内部可见孢子流动',
          soundHint: '光线穿透大气的共鸣声'
        }
      ],
      promptEnhancement: `标题由Nirath双日光线穿透不同密度电离层在地面投射形成——光影字由亿万发光孢子组成，笔画内部可见粒子流动。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '地面阴影落款',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '阴影成型',
          description: '光影字下方的地面上，因光线角度恰好形成阴影副标题',
          visual: '地面阴影字清晰可辨，与天空光影字形成天地呼应',
          soundHint: '无新增音效'
        }
      ],
      promptEnhancement: `副标题由光影字下方地面阴影自然形成。`
    },
    overallPrompt: `标题呈现必须是Nirath双恒星系统造成的大气光学物理现象——不是神迹。`
  };
}

// ==================== 模板5: 光脉拼字动效 ====================
function _designCrystalFormationEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  return {
    template: 'crystal_formation',
    overallConcept: '浮空光脉山脉碎片受引力/磁场影响漂移排列——每个笔画都是独立的岩石板块，光脉网络因磁场共振亮度变化',
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: '板块漂移拼合',
      phases: [
        {
          time: `${titleStart.toFixed(1)}-${(titleStart + 1.0).toFixed(1)}s`,
          name: '板块漂移',
          description: '浮空岩石板块受引力潮汐缓缓漂移，内部光脉网络因磁场变化明暗闪烁',
          visual: '板块从画面四周向中心漂移，轨迹留下光脉尾迹',
          soundHint: '岩石摩擦的低频震动声'
        },
        {
          time: `${(titleStart + 1.0).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`,
          name: '磁场锁定',
          description: '板块到达预定位置后受磁场锁定停止漂移，光脉网络达到共振峰值，笔画明亮稳定',
          visual: '板块拼合成完整字形，光脉共振形成统一的紫金色辉光',
          soundHint: '磁场共振的嗡鸣声达到峰值后稳定'
        }
      ],
      promptEnhancement: `标题由浮空岩石板块受引力潮汐漂移排列而成——每个笔画都是独立板块，内部光脉网络因磁场共振亮度变化，最终磁场锁定板块位置形成稳定字形。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '碎石飘落分布',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '碎石飘落',
          description: '板块边缘碰撞脱落的碎石受重力飘落，在地面上自然分布成副标题',
          visual: '碎石飘落轨迹清晰，分布密度均匀',
          soundHint: '碎石落地的清脆声响'
        }
      ],
      promptEnhancement: `副标题由板块碰撞脱落的碎石受重力飘落自然分布而成。`
    },
    overallPrompt: `标题呈现必须是地质板块受引力/磁场物理影响的自然结果——不是水晶魔法。`
  };
}

// ==================== 模板6: 水面显字动效 ====================
function _designWaterReflectionEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  return {
    template: 'water_reflection',
    overallConcept: '流光虹脉河水中矿物质光学特性——温度梯度形成密度分层，双日光线在不同水层间全反射',
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: '水层折射生长',
      phases: [
        {
          time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`,
          name: '水层分层',
          description: '河水因温度梯度形成密度分层，不同深度的水层呈现不同颜色',
          visual: '水面出现多层色带，每层颜色不同',
          soundHint: '水流分层的气泡声'
        },
        {
          time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`,
          name: '光字折射',
          description: '双日光线在不同水层间全反射，恰好构成发光字，每个笔画都是不同深度的水流层',
          visual: '水中光字清晰可辨，字体如水中生物般微微摇曳',
          soundHint: '光线穿透水层的折射共鸣声'
        }
      ],
      promptEnhancement: `标题由双日光线在河水不同密度水层间全反射形成——每个笔画都是不同深度的水流层，字体如水中生物般微微摇曳。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '矿物质沉积',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '沉积成型',
          description: '涟漪扩散至岸边，河水退潮后在湿地上留下矿物质沉积痕迹',
          visual: '湿地上的矿物质沉积痕迹清晰可辨，与水中光字呼应',
          soundHint: '水退潮的细微声响'
        }
      ],
      promptEnhancement: `副标题由河水退潮后在湿地留下矿物质沉积痕迹自然形成。`
    },
    overallPrompt: `标题呈现必须是Nirath河水矿物质光学特性的自然结果——不是人工添加。`
  };
}

// ==================== 模板7: 孢子聚字动效 ====================
function _designSporeLightsEffect(title, subtitle, beastId, beastInfo, timing) {
  const { titleStart, titleDuration, subtitleStart, subtitleDuration } = timing;
  
  return {
    template: 'spore_lights',
    overallConcept: '发光孢子水母受大型生物电场影响自然汇聚——如带电粒子在磁场中的运动轨迹',
    titleEffect: {
      start: titleStart,
      end: titleStart + titleDuration,
      concept: '电场汇聚拼字',
      phases: [
        {
          time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`,
          name: '孢子受激',
          description: '远处大型生物电场（异兽或地质电磁场）增强，孢子水母开始从四面八方缓缓移动',
          visual: '画面边缘可见发光孢子向中心移动，轨迹留下微弱光痕',
          soundHint: '电场增强的静电嗡鸣声'
        },
        {
          time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`,
          name: '电场拼字',
          description: '孢子水母受电场力影响，如同带电粒子在磁场中的运动轨迹，在空中精密排列成发光字',
          visual: '数千只孢子水母组成字形，内部发光器官因兴奋而明亮，字形边缘有能量尾迹',
          soundHint: '电场共振的嗡鸣声增强'
        },
        {
          time: `${(titleStart + 1.5).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`,
          name: '稳定脉动',
          description: '电场稳定后，孢子水母保持在字形位置，但内部发光器官继续以生物电场频率脉动',
          visual: '字形稳定，但亮度以约1Hz频率脉动，脉动与生物电场同步',
          soundHint: '生物电场脉动的细微节拍声'
        }
      ],
      promptEnhancement: `标题由发光孢子水母受大型生物电场影响自然汇聚而成——孢子从四面八方缓缓移动，如同带电粒子在磁场中的运动轨迹，在空中精密排列成发光字，每个字由数千只孢子组成，内部发光器官因兴奋而明亮，字形边缘有能量尾迹，最终稳定但继续以生物电场频率脉动。`
    },
    subtitleEffect: {
      start: subtitleStart,
      end: subtitleStart + subtitleDuration,
      concept: '掉队孢子飘落',
      phases: [
        {
          time: `${subtitleStart.toFixed(1)}-${(subtitleStart + subtitleDuration).toFixed(1)}s`,
          name: '孢子飘落',
          description: '电场边缘几只因电场强度衰减而掉队的孢子，自然飘落到地面，分布位置恰好组成副标题',
          visual: '地面上的孢子发光点分布均匀，形成完整副标题',
          soundHint: '孢子落地的微弱声响'
        }
      ],
      promptEnhancement: `副标题由电场边缘掉队的孢子自然飘落分布而成。`
    },
    overallPrompt: `标题呈现必须是生物电场的物理现象——不是意识控制的神秘主义。`
  };
}

// ==================== 辅助函数 ====================

function _getManifestationType(ability) {
  if (ability.includes('火') || ability.includes('焰') || ability.includes('炎')) return '火焰';
  if (ability.includes('冰') || ability.includes('水') || ability.includes('霜')) return '冰晶';
  if (ability.includes('雷') || ability.includes('电') || ability.includes('磁')) return '电荷';
  if (ability.includes('风') || ability.includes('气')) return '气流';
  if (ability.includes('光') || ability.includes('荧光')) return '光粒子';
  return '能量粒子';
}

function _generateManifestationPhases(type, title, timing) {
  const { titleStart, titleDuration } = timing;
  
  const phaseMap = {
    '火焰': [
      { time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`, name: '火源初现', description: '异兽鼻孔/口中喷出第一缕火焰，火焰接触空气后迅速膨胀', visual: '火焰从一点迅速扩散，温度约800°C，橙红色核心', soundHint: '火焰喷射的呼呼声' },
      { time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`, name: '凝字成型', description: '高温火焰在冷却空气中凝结，烟雾与火星恰好构成字形轮廓', visual: '烟雾中的火星排列成字形，笔画由火星密度差异形成', soundHint: '火焰凝结的噼啪声' },
      { time: `${(titleStart + 1.5).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`, name: '余烬稳定', description: '火焰熄灭后，余烬继续发光，字形由发红的余烬稳定呈现', visual: '余烬发出暗红色光芒，字形稳定，边缘有微弱热气扭曲', soundHint: '余烬燃烧的细微声响' }
    ],
    '冰晶': [
      { time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`, name: '水雾凝结', description: '异兽周围空气中水分迅速凝结成冰晶，冰晶在空气中漂浮', visual: '空气中出现细小冰晶颗粒，折射光线形成彩虹', soundHint: '冰晶凝结的细微碎裂声' },
      { time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`, name: '冰晶排列', description: '冰晶受低温气流影响自然排列，恰好构成字形轮廓', visual: '冰晶在空中排列成字形，每个笔画都是密集的冰晶群', soundHint: '冰晶碰撞的清脆声' },
      { time: `${(titleStart + 1.5).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`, name: '冰字稳定', description: '冰晶群在低温中稳定存在，字形由半透明的冰晶群呈现', visual: '冰晶字形半透明，内部可见光线折射，边缘有霜花', soundHint: '冰晶稳定的寂静' }
    ],
    '电荷': [
      { time: `${titleStart.toFixed(1)}-${(titleStart + 0.5).toFixed(1)}s`, name: '电荷聚集', description: '异兽周围电荷粒子开始聚集，空气中出现微弱的电离发光', visual: '空气中出现蓝色电离光丝，像细小的闪电', soundHint: '电荷聚集的静电声' },
      { time: `${(titleStart + 0.5).toFixed(1)}-${(titleStart + 1.5).toFixed(1)}s`, name: '电弧拼字', description: '电荷粒子在电场中运动，轨迹形成字形轮廓——每个笔画都是一道微电弧', visual: '字形由蓝色微电弧组成，电弧之间有电荷粒子流动', soundHint: '电弧的噼啪声' },
      { time: `${(titleStart + 1.5).toFixed(1)}-${(titleStart + titleDuration).toFixed(1)}s`, name: '电场稳定', description: '电场稳定后，电荷粒子保持在字形位置，形成稳定的等离子体发光字', visual: '字形由稳定的等离子体发光，亮度均匀，边缘有微弱的电晕', soundHint: '电场稳定的持续嗡鸣' }
    ]
  };
  
  return phaseMap[type] || phaseMap['能量粒子'];
}

// ==================== 主导出 ====================
module.exports = {
  designTitleEffect,
  _designMountainCarvingEffect,
  _designBeastManifestationEffect,
  _designXiaoGHoldingEffect,
  _designSkyProjectionEffect,
  _designCrystalFormationEffect,
  _designWaterReflectionEffect,
  _designSporeLightsEffect
};