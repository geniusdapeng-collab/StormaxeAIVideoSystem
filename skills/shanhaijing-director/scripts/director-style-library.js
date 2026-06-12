#!/usr/bin/env node
/**
 * 导演风格库 v1.1-Peng (ShanhaiStory Forge)
 *
 * 核心设计：
 * - 导演风格DNA参数化建模
 * - 20位导演：卡梅隆/斯皮尔伯格/诺兰/卢卡斯/维伦纽瓦/艾布拉姆斯/德尔·托罗/迈克尔·贝/艾默里奇/埃文斯/皮尔/施奈德/费儒/罗素兄弟/古恩/杰克逊/伯顿/里奇/沃恩/赖特
 * - 四维权重动态调整
 * - CAP规则映射（Condition-Action-Priority）
 * - 自动推荐关键词匹配
 *
 * 版本: v1.1-Peng | 2026-05-29
 * 所属系统: ShanhaiStory Forge v2.27-Peng
 */

class DirectorStyleLibrary {
  constructor() {
    this.version = '1.1-Peng';

    // 导演风格DNA数据库
    this.STYLES = {
      cameron: {
        name: 'James Cameron',
        type: 'visual_epic',
        description: '视觉奇观驱动型 - 宏大场面、技术细节、英雄主义、蓝色调宇宙、物理仿真',
        weights: { story: 0.25, continuity: 0.25, visual: 0.35, style: 0.15 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._cameronStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._cameronVisualCheck(shots, prompts),
          style: (shots, prompts) => this._cameronStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'classic_three_act',
          motionStyle: 'grand_tracking_deep_push',
          lightingStyle: 'dramatic_rim_contour',
          colorTone: 'cold_blue_high_saturation',
          emotionTone: 'heroic_technological_optimism'
        }
      },
      spielberg: {
        name: 'Steven Spielberg',
        type: 'emotional',
        description: '情感驱动型 - 角色共情、人文关怀、经典叙事、斯皮尔伯格面孔',
        weights: { story: 0.35, continuity: 0.20, visual: 0.20, style: 0.25 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._spielbergStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._spielbergVisualCheck(shots, prompts),
          style: (shots, prompts) => this._spielbergStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'linear_progression_emotional_arc',
          motionStyle: 'smooth_tracking_reaction_focus',
          lightingStyle: 'naturalistic_symbolic',
          colorTone: 'warm_realistic_selective',
          emotionTone: 'warm_humanistic_care'
        }
      },
      nolan: {
        name: 'Christopher Nolan',
        type: 'intellectual',
        description: '智性叙事型 - 时间结构、逻辑闭环、IMAX质感、蓝灰冷调',
        weights: { story: 0.25, continuity: 0.35, visual: 0.20, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._nolanStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._nolanVisualCheck(shots, prompts),
          style: (shots, prompts) => this._nolanStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'nonlinear_puzzle',
          motionStyle: 'fixed_wide_geometric',
          lightingStyle: 'cold_naturalistic',
          colorTone: 'cold_gray_monochrome',
          emotionTone: 'cold_intellectual_detachment'
        }
      },
      // ==== 新增导演（基于20位导演档案库） ====
      lucas: {
        name: 'George Lucas',
        type: 'space_opera',
        description: '太空歌剧型 - 二手未来美学、运动控制摄影、 Kitbashing模型、二战空战纪录片质感',
        weights: { story: 0.30, continuity: 0.20, visual: 0.30, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'hero_journey',
          motionStyle: 'motion_control_precision',
          lightingStyle: 'practical_industrial',
          colorTone: 'warm_orange_vs_cold_steel',
          emotionTone: 'epic_adventure_wonder'
        }
      },
      villeneuve: {
        name: 'Denis Villeneuve',
        type: 'spectacle_realism',
        description: '奇观写实主义 - BDO巨物崇拜、静默空旷、去饱和色彩、红外黑白、沙漠金',
        weights: { story: 0.30, continuity: 0.30, visual: 0.25, style: 0.15 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'slow_contemplative',
          motionStyle: 'static_wide_minimal',
          lightingStyle: 'naturalistic_single_source',
          colorTone: 'desaturated_ochre_indigo',
          emotionTone: 'existential_solitude_awe'
        }
      },
      abrams: {
        name: 'J.J. Abrams',
        type: 'kinetic_nostalgia',
        description: '动感怀旧型 - Lens Flare美学、Snap Zoom、神秘盒子、高饱和primary colors',
        weights: { story: 0.25, continuity: 0.20, visual: 0.35, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'mystery_box',
          motionStyle: 'handheld_orbit_snap_zoom',
          lightingStyle: 'bright_even_lens_flare',
          colorTone: 'high_sat_primary_colors',
          emotionTone: 'nostalgic_excitement_immediacy'
        }
      },
      deltoro: {
        name: 'Guillermo del Toro',
        type: 'dark_fairytale',
        description: '黑暗童话型 - 怪兽诗学、生物荧光、蓝绿琥珀对比色、实体特效、歌剧化规模',
        weights: { story: 0.30, continuity: 0.20, visual: 0.30, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'dark_fairytale_tragedy',
          motionStyle: 'wide_depth_long_take',
          lightingStyle: 'dramatic_low_angle_bioluminescent',
          colorTone: 'teal_amber_high_contrast',
          emotionTone: 'melancholic_wonder_tragic_beauty'
        }
      },
      bay: {
        name: 'Michael Bay',
        type: 'explosive_action',
        description: '爆炸动作型 - Bayhem环绕运镜、日落金调、多层爆炸构图、递进式快切、Teal-Orange',
        weights: { story: 0.15, continuity: 0.20, visual: 0.40, style: 0.25 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'hero_journey_action',
          motionStyle: '360_orbit_long_lens',
          lightingStyle: 'golden_hour_sunset_backlight',
          colorTone: 'sunset_amber_teal_orange',
          emotionTone: 'adrenaline_hero_worship'
        }
      },
      emmerich: {
        name: 'Roland Emmerich',
        type: 'disaster_epic',
        description: '灾难史诗型 - 地标毁灭、巨物遮天、灰暗末日调色、多重灾难叠加、Massive人群',
        weights: { story: 0.25, continuity: 0.25, visual: 0.30, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'suspense_reveal_escape',
          motionStyle: 'epic_scale_aerial',
          lightingStyle: 'dead_gray_apocalyptic',
          colorTone: 'desaturated_gray_blue_fire_orange',
          emotionTone: 'sublime_terror_human_unity'
        }
      },
      edwards: {
        name: 'Gareth Edwards',
        type: 'documentary_sci_fi',
        description: '纪录片科幻型 - 遮蔽怪兽、POV人类视角、氧化铜夜色调、慢热释放、手持摄影',
        weights: { story: 0.30, continuity: 0.25, visual: 0.25, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'delayed_gratification',
          motionStyle: 'handheld_documentary',
          lightingStyle: 'copper_oxide_night',
          colorTone: 'desaturated_natural_copper_green',
          emotionTone: 'awe_of_unknown_restraint'
        }
      },
      peele: {
        name: 'Jordan Peele',
        type: 'social_horror',
        description: '社会恐怖型 - 日常恐怖、蓝绿诡异色调、天空角色化、中断式剪辑、社会隐喻',
        weights: { story: 0.35, continuity: 0.20, visual: 0.20, style: 0.25 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'social_metaphor_horror',
          motionStyle: 'static_contemplative',
          lightingStyle: 'cyan_green_uncanny',
          colorTone: 'bright_daylight_to_uncanny_dark',
          emotionTone: 'systemic_evil_hidden'
        }
      },
      snyder: {
        name: 'Zack Snyder',
        type: 'mythic_hero',
        description: '神话英雄型 - 速度渐变、漂白旁通色彩、漫画分镜转译、逆光神格化、4:3画幅',
        weights: { story: 0.20, continuity: 0.20, visual: 0.40, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'mythic_hero_journey',
          motionStyle: 'speed_ramping_mythic',
          lightingStyle: 'dramatic_backlight_god_rim',
          colorTone: 'bleach_bypass_desaturated_metallic',
          emotionTone: 'sacred_solemn_greek_tragedy'
        }
      },
      favreau: {
        name: 'Jon Favreau',
        type: 'practical_blend',
        description: '实体融合型 - LED Volume虚拟制作、实体盔甲优先、自然光+变形镜头、复古未来',
        weights: { story: 0.25, continuity: 0.25, visual: 0.25, style: 0.25 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'grounded_hero_origin',
          motionStyle: 'stable_measured',
          lightingStyle: 'natural_light_anamorphic',
          colorTone: 'warm_natural_5600K',
          emotionTone: 'believable_realism_humanity'
        }
      },
      russo: {
        name: 'Russo Brothers',
        type: 'ensemble_action',
        description: '群像动作型 - 群战编排、Hard-Knuckle格斗、三色法则、手持+清晰空间',
        weights: { story: 0.25, continuity: 0.25, visual: 0.30, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'ensemble_character_driven',
          motionStyle: 'handheld_clear_spatial',
          lightingStyle: 'naturalistic_three_color_rule',
          colorTone: 'desaturated_MCU_grey',
          emotionTone: 'team_coordination_emotional_beats'
        }
      },
      gunn: {
        name: 'James Gunn',
        type: 'colorful_grotesque',
        description: '多彩怪诞型 - 品红水绿霓虹、分场景独立色板、怪诞生物、经典摇滚、非传统家庭',
        weights: { story: 0.25, continuity: 0.20, visual: 0.35, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'misfit_chosen_family',
          motionStyle: 'music_synced_long_take',
          lightingStyle: 'pulp_sci_fi_dramatic_multi_color',
          colorTone: 'fuchsia_aqua_orange_neon',
          emotionTone: 'irreverent_humor_warm_weird'
        }
      },
      jackson: {
        name: 'Peter Jackson',
        type: 'epic_fantasy',
        description: '史诗奇幻型 - 中土现实主义、MASSIVE群战、远近景对比、微缩模型、善恶色谱',
        weights: { story: 0.30, continuity: 0.25, visual: 0.25, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'epic_fantasy_hero_journey',
          motionStyle: 'extreme_long_shot_close_up_contrast',
          lightingStyle: 'golden_hour_chiaroscuro_ethereal',
          colorTone: 'warm_shire_vs_cold_mordor',
          emotionTone: 'ancient_history_myth_destiny'
        }
      },
      burton: {
        name: 'Tim Burton',
        type: 'gothic_fairytale',
        description: '哥特童话型 - Burtonesque暗黑美学、德国表现主义、高对比剪影、条纹螺旋、生死反转',
        weights: { story: 0.30, continuity: 0.20, visual: 0.30, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'gothic_fairytale_outsider',
          motionStyle: 'dreamlike_slow_fluid',
          lightingStyle: 'dramatic_high_contrast_silhouette',
          colorTone: 'desaturated_blue_grey_black',
          emotionTone: 'misunderstood_outsider_dark_warmth'
        }
      },
      ritchie: {
        name: 'Guy Ritchie',
        type: 'cool_chaos',
        description: '酷感编排型 - 多线并行叙事、定格介绍、快-慢-快时间操控、MTV剪辑、英伦街头',
        weights: { story: 0.25, continuity: 0.20, visual: 0.35, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'multi_line_parallel_coincidence',
          motionStyle: 'speed_ramp_freeze_snap_zoom',
          lightingStyle: 'gritty_urban_tungsten_cold',
          colorTone: 'cool_grey_blue_sepia_brown',
          emotionTone: 'british_dry_wit_urban_chaos'
        }
      },
      vaughn: {
        name: 'Matthew Vaughn',
        type: 'gentleman_violence',
        description: '绅士暴力型 - 暴力舞蹈化、烟花爆头、碎片式剪辑、西装视觉系统、漫画感特效',
        weights: { story: 0.20, continuity: 0.20, visual: 0.40, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'stylized_spy_action',
          motionStyle: 'fragmented_speed_ramp_dance',
          lightingStyle: 'dramatic_theatrical_colorful',
          colorTone: 'burgundy_navy_gold_champagne',
          emotionTone: 'gentleman_sophistication_brutal_efficiency'
        }
      },
      wright: {
        name: 'Edgar Wright',
        type: 'rhythmic_comedy',
        description: '节拍喜剧型 - 踩点剪辑、Smash Zoom、Whip Pan、匹配剪辑、音乐可视化、游戏特效',
        weights: { story: 0.25, continuity: 0.20, visual: 0.35, style: 0.20 },
        specialFocus: {
          storytelling: (storyPlan, shots) => this._genericStoryCheck(storyPlan, shots),
          visual: (shots, prompts) => this._genericVisualCheck(shots, prompts),
          style: (shots, prompts) => this._genericStyleCheck(shots, prompts)
        },
        preferences: {
          narrativeStructure: 'genre_deconstruction',
          motionStyle: 'smash_zoom_whip_pan_match_cut',
          lightingStyle: 'super_dramatic_shift_comic_panel',
          colorTone: 'vivid_saturated_comic_book_neon',
          emotionTone: 'hyper_kinetic_rhythmic_comedy'
        }
      }
    };
  }

  /**
   * 加载指定导演风格配置
   * @param {string} directorId - 导演标识符
   * @returns {Object} 风格配置
   */
  loadStyle(directorId) {
    const style = this.STYLES[directorId.toLowerCase()];
    if (!style) {
      console.warn(`[DirectorStyleLibrary] 未知导演风格: ${directorId}，回退到默认(cameron)`);
      return this.STYLES.cameron;
    }
    console.log(`[DirectorStyleLibrary v${this.version}] 加载风格: ${style.name} (${style.type})`);
    return style;
  }

  /**
   * 自动推荐导演风格
   * @param {Object} context - 剧本上下文
   * @returns {string} 推荐导演ID
   */
  recommendStyle(context) {
    const { storyPlan, shots, styleProfile } = context;

    // 基于类型标签推荐
    if (styleProfile) {
      if (/emotional|warm|human|family|child|nostalgic|wonder/i.test(styleProfile)) return 'spielberg';
      if (/intellectual|puzzle|time|memory|complex|nonlinear/i.test(styleProfile)) return 'nolan';
      if (/epic|grand|visual|spectacle|action|heroic|imax/i.test(styleProfile)) return 'cameron';
      if (/space|opera|sci.fi|star.wars|future|alien|spaceship/i.test(styleProfile)) return 'lucas';
      if (/desert|dune|slow|contemplative|monumental|vast|scale/i.test(styleProfile)) return 'villeneuve';
      if (/kinetic|nostalgia|lens.flare|mystery|retro.future|snap/i.test(styleProfile)) return 'abrams';
      if (/dark|fairytale|gothic|monster|creature|bioluminescent|teal|poetic/i.test(styleProfile)) return 'deltoro';
      if (/explosion|bayhem|sunset|transformer|robot|chaos|360.orbit/i.test(styleProfile)) return 'bay';
      if (/disaster|apocalypse|landmark|destruction|tsunami|global/i.test(styleProfile)) return 'emmerich';
      if (/documentary|concealment|monster|glimpses|silhouette|copper/i.test(styleProfile)) return 'edwards';
      if (/horror|social|suburban|uncanny|sky|cloud|daylight|eerie/i.test(styleProfile)) return 'peele';
      if (/mythic|hero|slow.mo|bleach|comic.panel|god.like|sacred|300/i.test(styleProfile)) return 'snyder';
      if (/practical|led|volume|armor|iron.man|realistic|grounded|mandalorian/i.test(styleProfile)) return 'favreau';
      if (/ensemble|team|group|marvel|avengers|civil.war|collaboration/i.test(styleProfile)) return 'russo';
      if (/colorful|neon|grotesque|music|rock|guardians|misfit|family/i.test(styleProfile)) return 'gunn';
      if (/fantasy|middle.earth|massive|battle|lord.of.rings|hobbit|epic.fantasy/i.test(styleProfile)) return 'jackson';
      if (/burton|gothic|stripes|spiral|outsider|halloween|puppet|stop.motion/i.test(styleProfile)) return 'burton';
      if (/cool|chaos|british|gangster|cockney|multi.line|freeze.frame|speed.ramp/i.test(styleProfile)) return 'ritchie';
      if (/gentleman|suit|kingsman|stylized|dance|champagne|burgundy|firework/i.test(styleProfile)) return 'vaughn';
      if (/rhythm|beat|music.sync|smash.zoom|whip.pan|match.cut|comedy|game/i.test(styleProfile)) return 'wright';
    }

    // 基于情感基调推荐
    if (storyPlan?.emotionArc) {
      const arc = storyPlan.emotionArc.join(' ').toLowerCase();
      if (/warm|tender|family|love|friendship|wonder|child/i.test(arc)) return 'spielberg';
      if (/cold|distant|puzzle|mystery|complex|nonlinear|time/i.test(arc)) return 'nolan';
      if (/epic|grand|heroic|spectacle|imax|climax|reveal/i.test(arc)) return 'cameron';
      if (/horror|eerie|uncanny|suburban|social|systemic|dread/i.test(arc)) return 'peele';
      if (/gothic|dark|fairytale|melancholic|poetic|monster/i.test(arc)) return 'deltoro';
      if (/colorful|fun|humor|music|rock|irreverent|misfit/i.test(arc)) return 'gunn';
      if (/kinetic|fast|action|chase|explosion|adrenaline|speed/i.test(arc)) return 'bay';
    }

    // 默认推荐卡梅隆（视觉奇观最通用）
    return 'cameron';
  }

  /**
   * 获取所有可用风格列表
   */
  listStyles() {
    return Object.entries(this.STYLES).map(([id, style]) => ({
      id,
      name: style.name,
      type: style.type,
      description: style.description,
      weights: style.weights
    }));
  }

  // ====== 新增导演通用检查方法 ======
  _genericStoryCheck(storyPlan, shots) {
    return { penalty: 0, issues: [] };
  }

  _genericVisualCheck(shots, prompts) {
    return { penalty: 0, issues: [] };
  }

  _genericStyleCheck(shots, prompts) {
    return { penalty: 0, issues: [] };
  }

  // ====== 卡梅隆风格检查 ======
  _cameronStoryCheck(storyPlan, shots) {
    const issues = [];
    let penalty = 0;

    // 检查是否有英雄时刻（高潮缺乏视觉冲击力）
    const climaxShots = shots?.filter((s, idx) =>
      s.emotion === 'epic_reveal' || s.emotion === 'climax' || s.type === 'climax'
    );

    if (!climaxShots || climaxShots.length === 0) {
      penalty += 0.5;
      issues.push({
        type: 'story',
        severity: 'moderate',
        description: '缺乏英雄主义高潮时刻（Cameron风格要求）',
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '在高潮部分增加史诗级揭示或英雄时刻镜头'
      });
    }

    // 检查技术细节密度
    const hasTechnicalDetail = shots?.some(s =>
      /detail|texture|structure|mechanism|technology|weapon|armor/i.test(
        s.description || s._generatedPrompt || ''
      )
    );

    if (!hasTechnicalDetail) {
      penalty += 0.3;
      issues.push({
        type: 'story',
        severity: 'minor',
        description: '技术细节密度不足（Cameron风格偏好）',
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '增加武器、装备、环境的技术细节描写'
      });
    }

    return { penalty, issues };
  }

  _cameronVisualCheck(shots, prompts) {
    const issues = [];
    let penalty = 0;

    // 检查大景别比例（应占较高比例）
    const wideShots = shots?.filter(s => {
      const scale = s.camera?.scale || s.scale || '';
      return /ELS|LS|FS|wide|grand|epic/i.test(scale);
    });

    const wideRatio = shots?.length > 0 ? (wideShots?.length || 0) / shots.length : 0;
    if (wideRatio < 0.3) {
      penalty += 0.3;
      issues.push({
        type: 'visual',
        severity: 'moderate',
        description: `大景别比例过低(${Math.round(wideRatio * 100)}%)，Cameron风格要求≥30%`,
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '增加全景、远景镜头比例，强化视觉奇观'
      });
    }

    return { penalty, issues };
  }

  _cameronStyleCheck(shots, prompts) {
    return { penalty: 0, issues: [] };
  }

  // ====== 斯皮尔伯格风格检查 ======
  _spielbergStoryCheck(storyPlan, shots) {
    const issues = [];
    let penalty = 0;

    // 检查情感弧线是否平滑递进
    if (shots) {
      const emotions = shots.map(s => s.emotion).filter(Boolean);
      const hasRegression = this._detectEmotionRegression(emotions);

      if (hasRegression) {
        penalty += 0.3;
        issues.push({
          type: 'story',
          severity: 'moderate',
          description: '情感弧线存在回退，Spielberg风格要求平滑递进',
          relatedShots: shots.map(s => s.id),
          suggestion: '确保情感从低到高逐步积累，避免情绪跳变'
        });
      }
    }

    // 检查是否有"反应-奇观-反应"三镜头结构
    const hasReactionPattern = shots?.some((s, idx) => {
      if (idx >= 2) {
        const prev = shots[idx - 2];
        const curr = shots[idx - 1];
        const next = shots[idx];
        return /reaction|face|expression|look|gaze/i.test(prev?.description || '') &&
               /wide|grand|spectacle|vista|landscape/i.test(curr?.description || '') &&
               /reaction|face|expression|look|gaze/i.test(next?.description || '');
      }
      return false;
    });

    if (!hasReactionPattern && shots?.length >= 3) {
      penalty += 0.2;
      issues.push({
        type: 'story',
        severity: 'minor',
        description: '缺少"反应-奇观-反应"经典三镜头结构（Spielberg Face）',
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '在奇观展示前后增加角色反应特写'
      });
    }

    return { penalty, issues };
  }

  _spielbergVisualCheck(shots, prompts) {
    const issues = [];
    let penalty = 0;

    // 检查特写比例（应占较高比例用于情感表达）
    const closeUps = shots?.filter(s => {
      const scale = s.camera?.scale || s.scale || '';
      return /CU|MCU|ECU|close|face|expression/i.test(scale);
    });

    const closeUpRatio = shots?.length > 0 ? (closeUps?.length || 0) / shots.length : 0;
    if (closeUpRatio < 0.25) {
      penalty += 0.3;
      issues.push({
        type: 'visual',
        severity: 'moderate',
        description: `特写比例过低(${Math.round(closeUpRatio * 100)}%)，Spielberg风格要求≥25%用于情感表达`,
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '增加面部特写和情感反应镜头'
      });
    }

    return { penalty, issues };
  }

  _spielbergStyleCheck(shots, prompts) {
    return { penalty: 0, issues: [] };
  }

  // ====== 诺兰风格检查 ======
  _nolanStoryCheck(storyPlan, shots) {
    const issues = [];
    let penalty = 0;

    // 检查时间结构复杂度
    const hasTimeMarkers = shots?.some(s =>
      /time|past|future|memory|flashback|parallel|simultaneous/i.test(
        s.description || s._generatedPrompt || ''
      )
    );

    if (!hasTimeMarkers && shots?.length > 3) {
      penalty += 0.2;
      issues.push({
        type: 'story',
        severity: 'minor',
        description: '时间结构标记不足（Nolan风格偏好时间复杂性）',
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '增加时间标记（如"三年前"、"与此同时"）强化时间结构'
      });
    }

    // 检查逻辑闭环
    if (storyPlan?.acts) {
      const firstAct = storyPlan.acts[0];
      const lastAct = storyPlan.acts[storyPlan.acts.length - 1];

      if (firstAct && lastAct) {
        const hasSetup = /setup|introduce|establish|begin/i.test(firstAct.summary || '');
        const hasPayoff = /resolve|conclude|reveal|payoff|answer/i.test(lastAct.summary || '');

        if (!hasSetup || !hasPayoff) {
          penalty += 0.3;
          issues.push({
            type: 'story',
            severity: 'moderate',
            description: '叙事结构缺乏明确的铺垫-回收闭环（Nolan风格核心）',
            relatedShots: shots?.map(s => s.id) || [],
            suggestion: '确保第一幕的设定在最后一幕得到回应和解答'
          });
        }
      }
    }

    return { penalty, issues };
  }

  _nolanVisualCheck(shots, prompts) {
    const issues = [];
    let penalty = 0;

    // 检查固定机位比例（诺兰偏好固定机位和IMAX宽幅）
    const fixedShots = shots?.filter(s => {
      const move = s.camera?.move || s.cameramove || '';
      return /static|lock|fixed|wide|im/i.test(move);
    });

    const fixedRatio = shots?.length > 0 ? (fixedShots?.length || 0) / shots.length : 0;
    if (fixedRatio < 0.2) {
      penalty += 0.2;
      issues.push({
        type: 'visual',
        severity: 'minor',
        description: `固定机位比例过低(${Math.round(fixedRatio * 100)}%)，Nolan风格偏好稳定构图`,
        relatedShots: shots?.map(s => s.id) || [],
        suggestion: '增加固定机位和宽银幕构图镜头'
      });
    }

    return { penalty, issues };
  }

  _nolanStyleCheck(shots, prompts) {
    return { penalty: 0, issues: [] };
  }

  // ====== 辅助方法 ======
  _detectEmotionRegression(emotions) {
    if (!emotions || emotions.length < 3) return false;

    const intensityMap = {
      'peaceful': 1, 'calm': 1, 'serene': 1,
      'curious': 2, 'wonder': 2,
      'uneasy': 3, 'tense': 3, 'anxious': 3,
      'confused': 4, 'conflict': 4,
      'epic_reveal': 5, 'climax': 5, 'triumphant': 5
    };

    let lastIntensity = 0;
    let regressionCount = 0;

    emotions.forEach(em => {
      const intensity = intensityMap[em?.toLowerCase()] || 3;
      if (intensity < lastIntensity - 1) {
        regressionCount++;
      }
      lastIntensity = intensity;
    });

    return regressionCount >= 2;
  }
}

module.exports = DirectorStyleLibrary;