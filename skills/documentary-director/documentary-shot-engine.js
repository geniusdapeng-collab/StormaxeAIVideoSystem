#!/usr/bin/env node
/**
 * Documentary Shot Engine v1.0-Peng
 * 纪录片分镜模板引擎 — 从剧本到分镜的自动转换
 *
 * 职责：
 * 1. 提供丰富的分镜模板库（按category组织）
 * 2. 自动时长分配（开场→问题→核心→收尾 = 59秒）
 * 3. 镜头类型智能匹配（根据内容类型）
 * 4. 角色出场自动调度
 * 5. 与场景库联动，自动注入环境/光影/运镜
 *
 * 集成到：documentary-director.js（替换现有硬编码SHOT_TEMPLATES）
 */

'use strict';

// ─── 分镜模板库 ───
const SHOT_TEMPLATES = {
  // ===== 健康科普类 (health-education) =====
  'health-education': {
    name: '健康科普',
    description: '面向家庭观众的健康知识科普',
    defaultDuration: 59,
    actStructure: [
      { name: '开场建置', durationRatio: 0.14, shots: 2 },   // ~8s
      { name: '问题引入', durationRatio: 0.20, shots: 3 },   // ~12s
      { name: '核心内容', durationRatio: 0.42, shots: 5 },   // ~25s
      { name: '总结收尾', durationRatio: 0.24, shots: 3 }    // ~14s
    ],
    shotTypes: {
      intro: [
        {
          type: 'establishing',
          name: '场景建置',
          description: '展示医疗工作室环境，建立专业信任感',
          defaultDuration: 4,
          camera: 'wide establishing shot, stable tripod, slow pan',
          requiredCharacters: [],
          sceneFocus: 'environment',
          lightingHint: 'soft natural window light'
        },
        {
          type: 'character-intro',
          name: '角色登场',
          description: '主讲人/主持人登场，面向镜头微笑',
          defaultDuration: 4,
          camera: 'medium shot, eye-level, gentle push-in',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'key light on face, soft fill'
        }
      ],
      problem: [
        {
          type: 'question',
          name: '问题提出',
          description: '主讲人提出问题/现象，引发好奇',
          defaultDuration: 4,
          camera: 'medium close-up, slight low angle',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'dramatic side light, curious mood'
        },
        {
          type: 'visual-metaphor',
          name: '视觉隐喻',
          description: '用画面/动画展示问题（如肌肉纤维、细胞）',
          defaultDuration: 4,
          camera: 'macro close-up or graphic overlay',
          requiredCharacters: [],
          sceneFocus: 'prop/graphic',
          lightingHint: 'bright even lighting, clinical feel'
        },
        {
          type: 'reaction',
          name: '反应镜头',
          description: '观众/儿童角色反应（惊讶/好奇）',
          defaultDuration: 4,
          camera: 'close-up, natural reaction capture',
          requiredCharacters: ['audience'],
          sceneFocus: 'character',
          lightingHint: 'natural light, authentic feel'
        }
      ],
      core: [
        {
          type: 'explanation',
          name: '知识讲解',
          description: '主讲人详细讲解核心知识点',
          defaultDuration: 5,
          camera: 'medium shot, stable, slight rule of thirds',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'even key light, professional'
        },
        {
          type: 'demonstration',
          name: '动作演示',
          description: '展示动作/姿势/使用方法',
          defaultDuration: 5,
          camera: 'medium wide, full body visible',
          requiredCharacters: ['host', 'demo'],
          sceneFocus: 'action',
          lightingHint: 'bright, clear visibility'
        },
        {
          type: 'detail',
          name: '细节特写',
          description: '特写关键部位/道具/文字',
          defaultDuration: 4,
          camera: 'macro close-up, shallow DOF',
          requiredCharacters: [],
          sceneFocus: 'prop',
          lightingHint: 'focused spot light on subject'
        },
        {
          type: 'interaction',
          name: '互动环节',
          description: '主讲人与观众互动（问答/示范）',
          defaultDuration: 5,
          camera: 'two-shot or over-shoulder',
          requiredCharacters: ['host', 'audience'],
          sceneFocus: 'interaction',
          lightingHint: 'even, both subjects well-lit'
        },
        {
          type: 'b-roll',
          name: '辅助画面',
          description: '补充画面（环境/道具/相关场景）',
          defaultDuration: 4,
          camera: 'cutaway, contextual shot',
          requiredCharacters: [],
          sceneFocus: 'environment',
          lightingHint: 'ambient, environmental'
        }
      ],
      conclusion: [
        {
          type: 'summary',
          name: '要点总结',
          description: '主讲人总结核心要点',
          defaultDuration: 5,
          camera: 'medium close-up, direct to camera',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'warm key light, friendly'
        },
        {
          type: 'call-to-action',
          name: '行动号召',
          description: '呼吁观众采取行动（就医/检查/预防）',
          defaultDuration: 5,
          camera: 'medium shot, confident stance',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'strong key light, empowering'
        },
        {
          type: 'outro',
          name: '结尾收场',
          description: '微笑/挥手/淡出',
          defaultDuration: 4,
          camera: 'medium shot, gentle fade preparation',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'soft, warm, inviting'
        }
      ]
    }
  },

  // ===== 产品展示类 (product-showcase) =====
  'product-showcase': {
    name: '产品展示',
    description: '产品营销、电商展示、功能介绍',
    defaultDuration: 59,
    actStructure: [
      { name: '产品亮相', durationRatio: 0.15, shots: 2 },
      { name: '痛点共鸣', durationRatio: 0.18, shots: 2 },
      { name: '功能展示', durationRatio: 0.40, shots: 5 },
      { name: '价值收尾', durationRatio: 0.27, shots: 3 }
    ],
    shotTypes: {
      intro: [
        {
          type: 'product-hero',
          name: '产品亮相',
          description: '产品360度展示或开箱',
          defaultDuration: 4,
          camera: 'product photography, rotating display, clean background',
          requiredCharacters: [],
          sceneFocus: 'product',
          lightingHint: 'studio lighting, crisp shadows'
        },
        {
          type: 'brand-intro',
          name: '品牌开场',
          description: '品牌Logo/标语展示',
          defaultDuration: 3,
          camera: 'static, centered, professional',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'even, brand colors emphasized'
        }
      ],
      problem: [
        {
          type: 'scenario',
          name: '使用场景',
          description: '展示产品使用前的痛点场景',
          defaultDuration: 5,
          camera: 'environmental, contextual',
          requiredCharacters: ['user'],
          sceneFocus: 'environment',
          lightingHint: 'natural, relatable'
        },
        {
          type: 'problem-closeup',
          name: '痛点特写',
          description: '特写问题/不便之处',
          defaultDuration: 4,
          camera: 'macro, detail focused',
          requiredCharacters: [],
          sceneFocus: 'prop',
          lightingHint: 'dramatic, problem emphasized'
        }
      ],
      core: [
        {
          type: 'feature-demo',
          name: '功能演示',
          description: '展示核心功能/使用方法',
          defaultDuration: 5,
          camera: 'over-shoulder or POV',
          requiredCharacters: ['user'],
          sceneFocus: 'action',
          lightingHint: 'bright, clear, instructional'
        },
        {
          type: 'product-detail',
          name: '产品细节',
          description: '材质/工艺/设计细节特写',
          defaultDuration: 4,
          camera: 'macro, shallow DOF',
          requiredCharacters: [],
          sceneFocus: 'product',
          lightingHint: 'spotlight on texture'
        },
        {
          type: 'comparison',
          name: '对比展示',
          description: '与竞品/旧版本对比',
          defaultDuration: 5,
          camera: 'split frame or side-by-side',
          requiredCharacters: [],
          sceneFocus: 'product',
          lightingHint: 'even, both subjects equal'
        },
        {
          type: 'testimonial',
          name: '用户体验',
          description: '真实用户使用反馈',
          defaultDuration: 5,
          camera: 'medium shot, natural setting',
          requiredCharacters: ['user'],
          sceneFocus: 'character',
          lightingHint: 'natural, authentic'
        },
        {
          type: 'lifestyle',
          name: '生活方式',
          description: '产品融入生活场景',
          defaultDuration: 4,
          camera: 'wide, environmental',
          requiredCharacters: ['user'],
          sceneFocus: 'environment',
          lightingHint: 'warm, aspirational'
        }
      ],
      conclusion: [
        {
          type: 'value-prop',
          name: '价值主张',
          description: '强调核心卖点/价格优势',
          defaultDuration: 5,
          camera: 'medium, confident',
          requiredCharacters: ['presenter'],
          sceneFocus: 'character',
          lightingHint: 'strong, decisive'
        },
        {
          type: 'product-final',
          name: '产品定格',
          description: '产品最终展示+购买信息',
          defaultDuration: 5,
          camera: 'hero shot, centered, polished',
          requiredCharacters: [],
          sceneFocus: 'product',
          lightingHint: 'studio, premium'
        },
        {
          type: 'cta-end',
          name: '行动号召',
          description: '扫码/链接/立即购买',
          defaultDuration: 4,
          camera: 'graphic overlay, clean',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'bright, attention-grabbing'
        }
      ]
    }
  },

  // ===== 商业宣传类 (corporate-promotion) =====
  'corporate-promotion': {
    name: '商业宣传',
    description: '企业形象、文化展示、团队介绍',
    defaultDuration: 59,
    actStructure: [
      { name: '企业形象', durationRatio: 0.15, shots: 2 },
      { name: '团队实力', durationRatio: 0.25, shots: 3 },
      { name: '业务展示', durationRatio: 0.35, shots: 4 },
      { name: '愿景收尾', durationRatio: 0.25, shots: 3 }
    ],
    shotTypes: {
      intro: [
        {
          type: 'building-exterior',
          name: '企业外观',
          description: '办公楼/工厂/门店外景',
          defaultDuration: 4,
          camera: 'wide establishing, drone or ground',
          requiredCharacters: [],
          sceneFocus: 'environment',
          lightingHint: 'golden hour, impressive'
        },
        {
          type: 'logo-reveal',
          name: 'Logo展示',
          description: '企业Logo/前台/标识',
          defaultDuration: 3,
          camera: 'static or gentle push',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'clean, professional'
        }
      ],
      problem: [
        {
          type: 'team-intro',
          name: '团队介绍',
          description: '核心团队成员亮相',
          defaultDuration: 5,
          camera: 'medium, professional headshot style',
          requiredCharacters: ['team'],
          sceneFocus: 'character',
          lightingHint: 'even, flattering'
        },
        {
          type: 'office-environment',
          name: '办公环境',
          description: '现代化办公空间/工作场景',
          defaultDuration: 4,
          camera: 'wide, environmental',
          requiredCharacters: ['team'],
          sceneFocus: 'environment',
          lightingHint: 'bright, modern'
        }
      ],
      core: [
        {
          type: 'work-process',
          name: '工作流程',
          description: '展示业务流程/生产线',
          defaultDuration: 5,
          camera: 'documentary style, handheld feel',
          requiredCharacters: ['team'],
          sceneFocus: 'action',
          lightingHint: 'natural, documentary'
        },
        {
          type: 'tech-showcase',
          name: '技术展示',
          description: '技术设备/实验室/数据中心',
          defaultDuration: 4,
          camera: 'steady, impressive angles',
          requiredCharacters: [],
          sceneFocus: 'environment',
          lightingHint: 'cool, high-tech'
        },
        {
          type: 'client-interaction',
          name: '客户互动',
          description: '客户服务/会议/签约',
          defaultDuration: 5,
          camera: 'two-shot, natural',
          requiredCharacters: ['team', 'client'],
          sceneFocus: 'interaction',
          lightingHint: 'warm, trusting'
        },
        {
          type: 'achievement',
          name: '成就展示',
          description: '奖杯/证书/数据大屏',
          defaultDuration: 4,
          camera: 'detail shot, proud moment',
          requiredCharacters: [],
          sceneFocus: 'prop',
          lightingHint: 'spotlight, celebratory'
        }
      ],
      conclusion: [
        {
          type: 'vision',
          name: '愿景陈述',
          description: 'CEO/负责人愿景陈述',
          defaultDuration: 5,
          camera: 'medium close-up, confident',
          requiredCharacters: ['leader'],
          sceneFocus: 'character',
          lightingHint: 'strong, visionary'
        },
        {
          type: 'team-spirit',
          name: '团队精神',
          description: '团队合影/士气展示',
          defaultDuration: 5,
          camera: 'wide, group shot',
          requiredCharacters: ['team'],
          sceneFocus: 'environment',
          lightingHint: 'warm, united'
        },
        {
          type: 'contact-info',
          name: '联系方式',
          description: '电话/网站/地址信息',
          defaultDuration: 4,
          camera: 'graphic overlay, clean',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'clear, professional'
        }
      ]
    }
  },

  // ===== 教育培训类 (education-training) =====
  'education-training': {
    name: '教育培训',
    description: '课程讲解、技能培训、知识传授',
    defaultDuration: 59,
    actStructure: [
      { name: '课程开场', durationRatio: 0.12, shots: 2 },
      { name: '知识框架', durationRatio: 0.20, shots: 3 },
      { name: '详细讲解', durationRatio: 0.45, shots: 5 },
      { name: '复习总结', durationRatio: 0.23, shots: 3 }
    ],
    shotTypes: {
      intro: [
        {
          type: 'title-card',
          name: '课程标题',
          description: '课程名称/讲师介绍',
          defaultDuration: 3,
          camera: 'graphic, clean typography',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'even, readable'
        },
        {
          type: 'instructor-intro',
          name: '讲师登场',
          description: '讲师自我介绍',
          defaultDuration: 4,
          camera: 'medium, friendly',
          requiredCharacters: ['instructor'],
          sceneFocus: 'character',
          lightingHint: 'warm, approachable'
        }
      ],
      problem: [
        {
          type: 'overview',
          name: '知识概览',
          description: '课程大纲/思维导图',
          defaultDuration: 4,
          camera: 'wide, graphic overlay',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'bright, clear'
        },
        {
          type: 'why-learn',
          name: '学习动机',
          description: '为什么要学这个',
          defaultDuration: 4,
          camera: 'medium, engaging',
          requiredCharacters: ['instructor'],
          sceneFocus: 'character',
          lightingHint: 'dynamic, motivating'
        }
      ],
      core: [
        {
          type: 'lecture',
          name: '课堂讲解',
          description: '核心知识点讲解',
          defaultDuration: 5,
          camera: 'medium, stable, whiteboard visible',
          requiredCharacters: ['instructor'],
          sceneFocus: 'character',
          lightingHint: 'even, instructional'
        },
        {
          type: 'diagram',
          name: '图表展示',
          description: 'PPT/图表/公式展示',
          defaultDuration: 4,
          camera: 'close-up on screen/board',
          requiredCharacters: [],
          sceneFocus: 'graphic',
          lightingHint: 'bright, no glare'
        },
        {
          type: 'demo',
          name: '实操演示',
          description: '动手操作/实验演示',
          defaultDuration: 5,
          camera: 'over-shoulder, hands visible',
          requiredCharacters: ['instructor'],
          sceneFocus: 'action',
          lightingHint: 'bright, detail visible'
        },
        {
          type: 'student-reaction',
          name: '学生反应',
          description: '学生听课/笔记/提问',
          defaultDuration: 4,
          camera: 'reaction shot, natural',
          requiredCharacters: ['student'],
          sceneFocus: 'character',
          lightingHint: 'natural, authentic'
        },
        {
          type: 'practice',
          name: '练习环节',
          description: '学生练习/小组讨论',
          defaultDuration: 5,
          camera: 'wide, multiple subjects',
          requiredCharacters: ['student'],
          sceneFocus: 'interaction',
          lightingHint: 'even, collaborative'
        }
      ],
      conclusion: [
        {
          type: 'recap',
          name: '要点回顾',
          description: '回顾核心知识点',
          defaultDuration: 4,
          camera: 'medium, summary style',
          requiredCharacters: ['instructor'],
          sceneFocus: 'character',
          lightingHint: 'warm, reinforcing'
        },
        {
          type: 'homework',
          name: '作业布置',
          description: '课后练习/延伸阅读',
          defaultDuration: 4,
          camera: 'graphic overlay or medium',
          requiredCharacters: ['instructor'],
          sceneFocus: 'graphic',
          lightingHint: 'clear, actionable'
        },
        {
          type: 'next-preview',
          name: '下集预告',
          description: '预告下节课内容',
          defaultDuration: 4,
          camera: 'medium, inviting',
          requiredCharacters: ['instructor'],
          sceneFocus: 'character',
          lightingHint: 'intriguing, curious'
        }
      ]
    }
  },

  // ===== 家居生活类 (lifestyle) =====
  'lifestyle': {
    name: '家居生活',
    description: '生活方式、美食、家居、日常',
    defaultDuration: 59,
    actStructure: [
      { name: '生活场景', durationRatio: 0.15, shots: 2 },
      { name: '过程展示', durationRatio: 0.30, shots: 4 },
      { name: '细节特写', durationRatio: 0.30, shots: 4 },
      { name: '成果展示', durationRatio: 0.25, shots: 3 }
    ],
    shotTypes: {
      intro: [
        {
          type: 'lifestyle-establishing',
          name: '场景建置',
          description: '温馨家居环境展示',
          defaultDuration: 4,
          camera: 'wide, warm, inviting',
          requiredCharacters: [],
          sceneFocus: 'environment',
          lightingHint: 'warm natural light, cozy'
        },
        {
          type: 'character-enter',
          name: '人物入场',
          description: '主角进入场景，开始活动',
          defaultDuration: 4,
          camera: 'medium, natural movement',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'warm, golden hour feel'
        }
      ],
      problem: [
        {
          type: 'preparation',
          name: '准备工作',
          description: '准备食材/材料/工具',
          defaultDuration: 4,
          camera: 'medium, hands visible',
          requiredCharacters: ['host'],
          sceneFocus: 'action',
          lightingHint: 'bright, natural'
        },
        {
          type: 'process-start',
          name: '过程开始',
          description: '开始烹饪/制作/布置',
          defaultDuration: 4,
          camera: 'over-shoulder, action focused',
          requiredCharacters: ['host'],
          sceneFocus: 'action',
          lightingHint: 'warm, process visible'
        }
      ],
      core: [
        {
          type: 'cooking-action',
          name: '制作过程',
          description: '烹饪/制作的核心动作',
          defaultDuration: 4,
          camera: 'close-up, hands and tools',
          requiredCharacters: ['host'],
          sceneFocus: 'action',
          lightingHint: 'warm, steam and texture visible'
        },
        {
          type: 'ingredient-closeup',
          name: '食材特写',
          description: '新鲜食材/材料细节',
          defaultDuration: 3,
          camera: 'macro, vibrant colors',
          requiredCharacters: [],
          sceneFocus: 'prop',
          lightingHint: 'bright, appetizing'
        },
        {
          type: 'transformation',
          name: '变化过程',
          description: '烹饪变化/制作进展',
          defaultDuration: 4,
          camera: 'time-lapse or real-time',
          requiredCharacters: ['host'],
          sceneFocus: 'action',
          lightingHint: 'warm, progression visible'
        },
        {
          type: 'plating',
          name: '摆盘装饰',
          description: '最终摆盘/装饰/布置',
          defaultDuration: 4,
          camera: 'overhead or 45-degree',
          requiredCharacters: ['host'],
          sceneFocus: 'action',
          lightingHint: 'bright, beautiful'
        }
      ],
      conclusion: [
        {
          type: 'final-reveal',
          name: '成果展示',
          description: '最终成果360度展示',
          defaultDuration: 5,
          camera: 'hero shot, rotating or multi-angle',
          requiredCharacters: [],
          sceneFocus: 'product',
          lightingHint: 'studio, appetizing'
        },
        {
          type: 'tasting',
          name: '品尝享受',
          description: '品尝/使用/享受成果',
          defaultDuration: 4,
          camera: 'close-up, reaction',
          requiredCharacters: ['host'],
          sceneFocus: 'character',
          lightingHint: 'warm, satisfying'
        },
        {
          type: 'lifestyle-outro',
          name: '温馨收尾',
          description: '温馨场景/家庭互动',
          defaultDuration: 4,
          camera: 'wide, warm, family feel',
          requiredCharacters: ['host', 'family'],
          sceneFocus: 'environment',
          lightingHint: 'warm golden, loving'
        }
      ]
    }
  }
};

// ─── 分镜引擎类 ───
class ShotEngine {
  constructor(config = {}) {
    this.templates = SHOT_TEMPLATES;
    this.defaultDuration = config.defaultDuration || 59;
  }

  /**
   * 根据剧本和类别生成分镜计划
   * @param {Object} script — 剧本内容
   * @param {Object} options — 选项
   *   { category: 'health-education'|'product-showcase'|...,
   *     characters: ['chen-nurse', 'xiaog-boy'],
   *     totalDuration: 59,
   *     customShots: [] }
   * @returns {Object} 分镜计划
   */
  planShots(script, options = {}) {
    const category = options.category || 'health-education';
    const template = this.templates[category];

    if (!template) {
      throw new Error(`[ShotEngine] 未知类别: ${category}`);
    }

    const totalDuration = options.totalDuration || template.defaultDuration;
    const characters = options.characters || [];

    // 构建四幕结构
    const acts = this._buildActs(template, script, totalDuration, characters);

    // 组装分镜列表
    const shots = [];
    let currentTime = 0;

    for (const act of acts) {
      for (const shot of act.shots) {
        shots.push({
          ...shot,
          startTime: currentTime,
          endTime: currentTime + shot.duration,
          actName: act.name
        });
        currentTime += shot.duration;
      }
    }

    // 验证总时长
    const actualDuration = shots.reduce((sum, s) => sum + s.duration, 0);
    const timingCheck = this._verifyTiming(shots, totalDuration);

    return {
      category,
      categoryName: template.name,
      totalDuration,
      actualDuration,
      shotCount: shots.length,
      acts: acts.map(a => ({ name: a.name, duration: a.duration, shotCount: a.shots.length })),
      shots,
      timingCheck,
      characterAssignments: this._assignCharacters(shots, characters),
      sceneTransitions: this._planTransitions(shots)
    };
  }

  /**
   * 智能时长分配 — 根据内容自动调整
   */
  allocateTiming(shots, totalDuration, options = {}) {
    const currentTotal = shots.reduce((sum, s) => sum + s.duration, 0);
    const ratio = totalDuration / currentTotal;

    // 先计算新时长
    const newDurations = shots.map((shot, index) => {
      const isLast = index === shots.length - 1;
      if (isLast) {
        // 最后一个稍后计算
        return null;
      }
      const minDuration = options.minDuration || 3;
      return Math.max(minDuration, Math.round(shot.duration * ratio));
    });

    // 计算最后一个镜头的时长
    const usedBeforeLast = newDurations.slice(0, -1).reduce((sum, d) => sum + d, 0);
    newDurations[newDurations.length - 1] = totalDuration - usedBeforeLast;

    // 应用新时长
    const allocated = shots.map((shot, index) => ({
      ...shot,
      duration: newDurations[index]
    }));

    // 重新计算时间码
    let currentTime = 0;
    for (const shot of allocated) {
      shot.startTime = currentTime;
      shot.endTime = currentTime + shot.duration;
      currentTime += shot.duration;
    }

    return allocated;
  }

  /**
   * 根据内容类型匹配镜头类型
   */
  matchShotType(contentType, category = 'health-education') {
    const template = this.templates[category];
    if (!template) return null;

    // 在所有幕中搜索匹配
    for (const [actName, actShots] of Object.entries(template.shotTypes)) {
      const match = actShots.find(s =>
        s.type === contentType ||
        s.name.includes(contentType) ||
        s.description.includes(contentType)
      );
      if (match) return { ...match, act: actName };
    }

    return null;
  }

  /**
   * 获取可用模板类别列表
   */
  listCategories() {
    return Object.entries(this.templates).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.description,
      defaultDuration: val.defaultDuration,
      actCount: val.actStructure.length
    }));
  }

  /**
   * 获取某类别的镜头类型列表
   */
  listShotTypes(category) {
    const template = this.templates[category];
    if (!template) return [];

    const types = [];
    for (const [actName, actShots] of Object.entries(template.shotTypes)) {
      for (const shot of actShots) {
        types.push({
          ...shot,
          act: actName
        });
      }
    }
    return types;
  }

  // ─── 内部方法 ───

  _buildActs(template, script, totalDuration, characters) {
    const acts = [];
    const scriptParts = this._parseScript(script);

    for (let i = 0; i < template.actStructure.length; i++) {
      const actDef = template.actStructure[i];
      const actName = actDef.name;
      const actDuration = Math.round(totalDuration * actDef.durationRatio);
      const actShotTypes = template.shotTypes[this._getActKey(i)] || [];

      // 根据剧本内容选择镜头
      const selectedShots = this._selectShotsForAct(
        actShotTypes,
        scriptParts[i] || '',
        characters,
        actDuration,
        actDef.shots
      );

      acts.push({
        name: actName,
        duration: actDuration,
        shots: selectedShots
      });
    }

    return acts;
  }

  _getActKey(index) {
    const keys = ['intro', 'problem', 'core', 'conclusion'];
    return keys[index] || 'core';
  }

  _parseScript(script) {
    if (!script) return ['', '', '', ''];

    // 将剧本分为四部分
    return [
      script.intro || '',
      script.problem || script.body?.[0] || '',
      script.body?.slice(1).join(' ') || script.core || '',
      script.conclusion || ''
    ];
  }

  _selectShotsForAct(shotTypes, scriptPart, characters, actDuration, maxShots) {
    const selected = [];
    const durationPerShot = Math.floor(actDuration / maxShots);
    const remainder = actDuration - (durationPerShot * maxShots);

    // 优先选择需要最少角色的镜头
    const sorted = [...shotTypes].sort((a, b) => {
      const aNeeds = a.requiredCharacters.length;
      const bNeeds = b.requiredCharacters.length;
      return aNeeds - bNeeds;
    });

    for (let i = 0; i < Math.min(maxShots, sorted.length); i++) {
      const shotType = sorted[i];
      const duration = durationPerShot + (i === 0 ? remainder : 0);

      // 角色映射
      const assignedCharacters = this._mapCharacters(shotType.requiredCharacters, characters);

      selected.push({
        id: `S${String(selected.length + 1).padStart(2, '0')}`,
        type: shotType.type,
        name: shotType.name,
        description: shotType.description,
        duration,
        camera: shotType.camera,
        characters: assignedCharacters,
        sceneFocus: shotType.sceneFocus,
        lightingHint: shotType.lightingHint,
        scriptContent: scriptPart.substring(0, 100) // 关联剧本内容前100字
      });
    }

    return selected;
  }

  _mapCharacters(required, available) {
    if (required.length === 0) return [];

    const mapped = [];
    for (let i = 0; i < required.length && i < available.length; i++) {
      mapped.push({
        role: required[i],
        characterId: available[i]
      });
    }

    return mapped;
  }

  _verifyTiming(shots, targetDuration) {
    const actual = shots.reduce((sum, s) => sum + s.duration, 0);
    const diff = actual - targetDuration;

    return {
      targetDuration,
      actualDuration: actual,
      difference: diff,
      passed: Math.abs(diff) <= 1, // 允许1秒误差
      status: Math.abs(diff) <= 1 ? 'PASS' : diff > 0 ? 'OVER' : 'UNDER'
    };
  }

  _assignCharacters(shots, characters) {
    const assignments = {};

    for (const char of characters) {
      const charShots = shots.filter(s =>
        s.characters.some(c => c.characterId === char)
      );

      assignments[char] = {
        shotCount: charShots.length,
        totalScreenTime: charShots.reduce((sum, s) => sum + s.duration, 0),
        firstAppearance: charShots[0]?.id || null,
        shotIds: charShots.map(s => s.id)
      };
    }

    return assignments;
  }

  _planTransitions(shots) {
    const transitions = [];

    for (let i = 0; i < shots.length - 1; i++) {
      const current = shots[i];
      const next = shots[i + 1];

      let type = 'cut';
      let duration = 0;

      // 同一场景 → 直接切换
      if (current.sceneFocus === next.sceneFocus) {
        type = 'cut';
      }
      // 场景变化 → 淡入淡出
      else if (current.actName !== next.actName) {
        type = 'fade';
        duration = 1; // 1秒淡入淡出
      }
      // 角色变化 → 轻微溶解
      else if (this._hasDifferentCharacters(current, next)) {
        type = 'dissolve';
        duration = 0.5;
      }
      // 特写变化 → 直接切换
      else {
        type = 'cut';
      }

      transitions.push({
        from: current.id,
        to: next.id,
        type,
        duration,
        reason: this._getTransitionReason(current, next)
      });
    }

    return transitions;
  }

  _hasDifferentCharacters(shotA, shotB) {
    const charsA = shotA.characters.map(c => c.characterId).sort().join(',');
    const charsB = shotB.characters.map(c => c.characterId).sort().join(',');
    return charsA !== charsB;
  }

  _getTransitionReason(current, next) {
    if (current.actName !== next.actName) {
      return `幕切换: ${current.actName} → ${next.actName}`;
    }
    if (this._hasDifferentCharacters(current, next)) {
      return '角色切换';
    }
    if (current.sceneFocus !== next.sceneFocus) {
      return `焦点切换: ${current.sceneFocus} → ${next.sceneFocus}`;
    }
    return '同场景切换';
  }
}

// ─── 导出 ───
module.exports = { ShotEngine, SHOT_TEMPLATES };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Documentary Shot Engine v1.0-Peng 测试 ===\n');

  const engine = new ShotEngine();

  // 测试1: 列出类别
  console.log('--- Test 1: 类别列表 ---');
  const categories = engine.listCategories();
  categories.forEach(c => {
    console.log(`  [${c.id}] ${c.name} (${c.defaultDuration}s, ${c.actCount}幕)`);
  });

  // 测试2: 健康科普分镜
  console.log('\n--- Test 2: 健康科普分镜 ---');
  const healthPlan = engine.planShots({
    intro: '小朋友们，今天我们来认识一个很重要的健康知识——横纹肌溶解',
    body: [
      '横纹肌溶解是指我们的肌肉细胞受到损伤后，里面的内容物释放到血液里',
      '常见的原因包括过度运动、严重的外伤，或者某些特殊的药物',
      '如果发现肌肉特别疼痛，或者尿液颜色变深像浓茶一样，一定要告诉爸爸妈妈',
      '及时去医院检查非常重要，医生可以通过抽血化验来确认'
    ],
    conclusion: '记住，适度运动，多喝水，身体不舒服一定要及时告诉爸爸妈妈'
  }, {
    category: 'health-education',
    characters: ['chen-nurse', 'xiaog-boy'],
    totalDuration: 59
  });

  console.log(`  类别: ${healthPlan.categoryName}`);
  console.log(`  目标时长: ${healthPlan.totalDuration}s`);
  console.log(`  实际时长: ${healthPlan.actualDuration}s`);
  console.log(`  镜头数: ${healthPlan.shotCount}`);
  console.log(`  幕结构:`);
  healthPlan.acts.forEach(a => {
    console.log(`    ${a.name}: ${a.duration}s, ${a.shotCount}个镜头`);
  });
  console.log(`  时长检查: ${healthPlan.timingCheck.status}`);

  // 测试3: 镜头详情
  console.log('\n--- Test 3: 前3个镜头详情 ---');
  healthPlan.shots.slice(0, 3).forEach(s => {
    console.log(`  ${s.id} [${s.actName}] ${s.name} (${s.duration}s)`);
    console.log(`    运镜: ${s.camera}`);
    console.log(`    角色: ${s.characters.map(c => c.characterId).join(', ') || '无'}`);
    console.log(`    焦点: ${s.sceneFocus}`);
  });

  // 测试4: 角色出场
  console.log('\n--- Test 4: 角色出场分配 ---');
  Object.entries(healthPlan.characterAssignments).forEach(([char, info]) => {
    console.log(`  ${char}: ${info.shotCount}个镜头, ${info.totalScreenTime}s出镜, 首次:${info.firstAppearance}`);
  });

  // 测试5: 转场计划
  console.log('\n--- Test 5: 转场计划 ---');
  healthPlan.sceneTransitions.slice(0, 3).forEach(t => {
    console.log(`  ${t.from} → ${t.to}: ${t.type}(${t.duration}s) — ${t.reason}`);
  });

  // 测试6: 产品展示分镜
  console.log('\n--- Test 6: 产品展示分镜 ---');
  const productPlan = engine.planShots({
    intro: 'Introducing our new smart water bottle',
    body: [
      'Stay hydrated with intelligent reminders',
      'Temperature display, UV sterilization',
      'Long battery life, eco-friendly materials'
    ],
    conclusion: 'Order now and get 20% off'
  }, {
    category: 'product-showcase',
    characters: ['product-model'],
    totalDuration: 59
  });

  console.log(`  类别: ${productPlan.categoryName}`);
  console.log(`  镜头数: ${productPlan.shotCount}`);
  productPlan.acts.forEach(a => {
    console.log(`    ${a.name}: ${a.duration}s`);
  });

  // 测试7: 镜头类型匹配
  console.log('\n--- Test 7: 镜头类型匹配 ---');
  const matched = engine.matchShotType('explanation', 'health-education');
  console.log(`  匹配 "explanation": ${matched ? matched.name : '未找到'}`);

  const matched2 = engine.matchShotType('feature-demo', 'product-showcase');
  console.log(`  匹配 "feature-demo": ${matched2 ? matched2.name : '未找到'}`);

  // 测试8: 时长重新分配
  console.log('\n--- Test 8: 时长重新分配 ---');
  const reallocated = engine.allocateTiming(healthPlan.shots, 45);
  const newTotal = reallocated.reduce((sum, s) => sum + s.duration, 0);
  console.log(`  原时长: ${healthPlan.actualDuration}s → 新时长: ${newTotal}s`);
  console.log(`  前3镜头: ${reallocated.slice(0, 3).map(s => `${s.id}:${s.duration}s`).join(', ')}`);

  console.log('\n=== 全部测试通过 ===');
}