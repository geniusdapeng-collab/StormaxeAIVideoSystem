#!/usr/bin/env node
/**
 * Documentary Director v1.0-Peng
 * 写实纪录片导演调度器 — 系统核心入口
 *
 * 职责：
 * 1. 项目初始化（锁定写实风格）
 * 2. 角色档案管理（写实角色）
 * 3. 场景模板加载（写实场景）
 * 4. 剧本大纲生成
 * 5. 分镜自动生成（套用模板）
 * 6. Prompt构建（自动注入写实风格）
 * 7. 风格检查（强制通过才能渲染）
 * 8. 提交渲染
 * 9. 字幕与TTS生成
 * 10. 后期合成（调色+字幕+音频）
 *
 * 使用方式：
 * const director = new DocumentaryDirector({ projectName, category });
 * const result = await director.produce(productionRequest);
 */

'use strict';

const path = require('path');

// 加载底层基础设施
const { StyleIsolationGateway, STYLE_TYPES } = require('../style-isolation-gateway/style-isolation-gateway');
const { DocumentaryPromptBuilder } = require('../style-isolation-gateway/documentary-prompt-builder');
const { StyleContaminationGuard, CONTAMINATION_LEVELS } = require('../style-isolation-gateway/style-contamination-guard');

// 加载导演子系统
const { DocumentaryCharacterManager } = require('./documentary-character-manager');
const { DocumentarySceneLibrary } = require('./documentary-scene-library');
const { DocumentaryCharacterGenerator } = require('./documentary-character-generator');

// 加载 Prompt 质量优化模块（v6.14-Peng 第1批）
const { PromptFieldCleaner } = require('./clean-prompt-field');
const { PromptFinalizer } = require('./finalize-prompt');
const { FinalPromptValidator } = require('./final-prompt-validator');

// 加载通用校验工具（v6.14-Peng 第6批）
const { PromptValidationUtils } = require('./prompt-validation-utils');

// 加载结构化 Prompt 合成模块（v6.14-Peng 第2批）
const { PromptSchemaBuilder } = require('./prompt-schema-builder');
const { FinalPromptComposer } = require('./final-prompt-composer');
const { FieldMerger } = require('./field-merger');

// 加载精细化裁剪模块（v6.14-Peng 第3批）
const { PromptFieldPriority } = require('./prompt-field-priority');

// 加载 LLM 稳定性模块（v6.14-Peng 第4批）
const { JSONSafeParser } = require('./json-safe-parser');
const { LLMRetryWrapper } = require('./llm-retry-wrapper');

// ─── 分镜模板定义（按内容类型）───
const SHOT_TEMPLATES = {
  'health-education': {
    name: '健康教育四幕结构',
    acts: [
      {
        name: '开场建置',
        duration: 8,
        shots: [
          { id: 'S01', type: 'establishing', duration: 3, description: 'wide shot presenter standing in bright medical studio, white walls and windows visible' },
          { id: 'S02', type: 'medium', duration: 5, description: 'medium shot presenter speaking to camera with warm professional smile' }
        ]
      },
      {
        name: '问题引入',
        duration: 12,
        shots: [
          { id: 'S03', type: 'medium', duration: 4, description: 'medium shot presenter asking question with inviting expression' },
          { id: 'S04', type: 'closeup', duration: 4, description: 'close-up on medical diagram showing muscle tissue structure' },
          { id: 'S05', type: 'medium', duration: 4, description: 'medium shot presenter walking to demonstration area' }
        ]
      },
      {
        name: '核心内容',
        duration: 25,
        shots: [
          { id: 'S06', type: 'medium', duration: 6, description: 'medium shot presenter explaining with natural hand gestures' },
          { id: 'S07', type: 'closeup', duration: 5, description: 'extreme close-up on anatomical model showing muscle fiber detail' },
          { id: 'S08', type: 'medium', duration: 5, description: 'medium shot presenter summarizing key mechanism clearly' },
          { id: 'S09', type: 'wide', duration: 5, description: 'wide shot presenter demonstrating with anatomical model on table' },
          { id: 'S10', type: 'closeup', duration: 4, description: 'close-up on presenter face emphasizing important warning' }
        ]
      },
      {
        name: '总结收尾',
        duration: 14,
        shots: [
          { id: 'S11', type: 'medium', duration: 5, description: 'medium shot presenter summarizing prevention tips warmly' },
          { id: 'S12', type: 'wide', duration: 5, description: 'wide shot slow pull-out presenter in full studio context' },
          { id: 'S13', type: 'medium', duration: 4, description: 'medium shot presenter smiling goodbye encouraging healthy habits' }
        ]
      }
    ]
  },

  'product-introduction': {
    name: '产品介绍三幕结构',
    acts: [
      {
        name: '产品亮相',
        duration: 10,
        shots: [
          { id: 'S01', type: 'establishing', duration: 3, description: 'wide shot clean product showcase space, product on minimalist podium, soft even studio lighting, premium presentation' },
          { id: 'S02', type: 'medium', duration: 4, description: 'medium shot presenter introducing product with confident professional smile, clean modern backdrop, establishing credibility' },
          { id: 'S03', type: 'closeup', duration: 3, description: 'extreme close-up on product packaging or brand logo, premium material texture, sharp focus on detail' }
        ]
      },
      {
        name: '功能展示',
        duration: 30,
        shots: [
          { id: 'S04', type: 'detail', duration: 5, description: 'macro shot on key product feature, showing texture mechanism and material quality, premium craftsmanship' },
          { id: 'S05', type: 'medium', duration: 6, description: 'medium shot presenter demonstrating product usage, natural hand movements, clear functional explanation' },
          { id: 'S06', type: 'rotating', duration: 5, description: 'smooth 360-degree rotating shot around product, showing all angles and design details, clean background' },
          { id: 'S07', type: 'comparison', duration: 5, description: 'split frame comparison with similar product, highlighting superior features and design advantages' },
          { id: 'S08', type: 'medium', duration: 5, description: 'medium shot presenter summarizing core benefits, confident and persuasive tone, natural warmth' },
          { id: 'S09', type: 'detail', duration: 4, description: 'extreme close-up on product in use, showing real-world application and effectiveness' }
        ]
      },
      {
        name: '号召行动',
        duration: 15,
        shots: [
          { id: 'S10', type: 'medium', duration: 5, description: 'medium shot presenter with enthusiastic but genuine recommendation, clear call to action, trustworthy endorsement' },
          { id: 'S11', type: 'wide', duration: 5, description: 'wide shot showing product in full lifestyle context, aspirational but realistic setting, final impression' },
          { id: 'S12', type: 'closeup', duration: 5, description: 'close-up on presenter face with confident closing statement, brand slogan or tagline, memorable ending' }
        ]
      }
    ]
  }
};

// ─── 字幕与TTS配置 ───
const SUBTITLE_STYLES = {
  'medical-education': {
    fontName: 'Noto Sans SC',
    fontSize: 36,
    primaryColor: '#FFFFFF',
    outlineColor: '#1A237E',
    backColor: '#00000080',
    outline: 2,
    shadow: 1,
    alignment: 2,
    marginV: 30,
    styleName: 'MedicalEducation'
  },
  'product-showcase': {
    fontName: 'Noto Sans SC',
    fontSize: 32,
    primaryColor: '#FFFFFF',
    outlineColor: '#424242',
    backColor: '#00000060',
    outline: 1,
    shadow: 0,
    alignment: 2,
    marginV: 40,
    styleName: 'ProductShowcase'
  },
  'corporate': {
    fontName: 'Noto Sans SC',
    fontSize: 34,
    primaryColor: '#FFFFFF',
    outlineColor: '#37474F',
    backColor: '#00000070',
    outline: 1.5,
    shadow: 1,
    alignment: 2,
    marginV: 35,
    styleName: 'Corporate'
  }
};

const TTS_CONFIG = {
  'medical-education': {
    voice: 'system-default-female',
    speed: 1.0,
    pitch: 0,
    emotion: 'professional-warm'
  },
  'product-showcase': {
    voice: 'system-default-female',
    speed: 1.05,
    pitch: 0,
    emotion: 'enthusiastic-professional'
  }
};

// ─── 导演调度器 ───
class DocumentaryDirector {
  constructor(config = {}) {
    this.projectName = config.projectName || 'documentary-production';
    this.category = config.category || 'health-education';
    this.outputDir = config.outputDir || path.join('/tmp', this.projectName);

    // 初始化风格网关（锁定写实风格）
    this.gateway = new StyleIsolationGateway({
      styleType: 'documentary',
      projectName: this.projectName,
      category: this.category
    });

    // 初始化子系统
    this.guard = new StyleContaminationGuard(this.gateway);
    this.promptBuilder = new DocumentaryPromptBuilder(this.gateway);
    this.characterManager = new DocumentaryCharacterManager(config.characterRoot);
    this.sceneLibrary = new DocumentarySceneLibrary();
    this.characterGenerator = new DocumentaryCharacterGenerator(); // 定妆照生成器
    this.version = '1.0-Peng';

    // 初始化通用校验工具（v6.14-Peng 第6批）
    this.promptValidator = new PromptValidationUtils({
      maxLength: 990,
      weights: {
        subject: 1.5,
        action: 1.3,
        environment: 1.0,
        lighting: 0.8,
        camera: 0.7,
        style: 0.6,
        colors: 0.5,
        atmosphere: 0.3,
        meta: 0.2,
      }
    });

    this.decisionLog = [];
    this._log('INIT', `DocumentaryDirector 初始化: ${this.projectName} (${this.category})`);
  }

  /**
   * 一键生产视频（完整流程）
   * @param {Object} request
   *   {
   *     title: '什么是横纹肌溶解',
   *     duration: 59,
   *     characters: ['chen-nurse', 'xiaog-boy'],
   *     sceneType: 'medical-studio',
   *     scriptContent: { intro: '...', body: ['...'], conclusion: '...' },
   *     subtitleStyle: 'medical-education',
   *     ttsVoice: 'system-default-female'
   *   }
   * @returns {Object} 完整生产结果
   */
  async produce(request) {
    this._log('PRODUCE_START', `开始生产: ${request.title}`);

    // Step 1: 加载角色档案
    this._log('STEP1', '加载角色档案');
    const characterAssets = this._loadCharacters(request.characters);

    // Step 1.5: 为每个角色生成定妆照方案（集成CharacterGenerator）
    this._log('STEP1_5', '生成角色定妆照方案');
    const characterPhotoPlans = this._generateCharacterPhotoPlans(request.characters);

    // Step 2: 加载场景模板
    this._log('STEP2', `加载场景模板: ${request.sceneType}`);
    const sceneTemplate = this.sceneLibrary.getScene(request.sceneType);

    // Step 3: 生成剧本大纲
    this._log('STEP3', '生成剧本大纲');
    const storyOutline = this._generateStoryOutline(request);

    // Step 4: 生成完整分镜计划
    this._log('STEP4', '生成分镜计划');
    const shots = this._generateShots(request, sceneTemplate);

    // Step 5: 构建角色→分镜映射
    this._log('STEP5', '构建角色分镜映射');
    const shotCharacterMap = this.characterManager.buildShotCharacterMap(shots);

    // Step 6: 构建所有Prompt（自动注入写实风格）
    this._log('STEP6', '构建Prompt');
    const prompts = this._buildPrompts(shots, shotCharacterMap, sceneTemplate);

    // Step 7: 风格检查（强制通过才能继续）
    this._log('STEP7', '风格检查');
    const validation = this._validatePrompts(prompts);
    if (!validation.passed) {
      this._log('BLOCKED', `风格检查失败: ${validation.summary}`);
      throw new Error(`[DocumentaryDirector] 风格检查未通过，生产中断: ${validation.summary}`);
    }

    // Step 8: 渲染提交（模拟/真实）
    this._log('STEP8', '提交渲染');
    const segments = await this._submitRender(prompts, request.mock);

    // Step 9: 生成字幕与TTS
    this._log('STEP9', '生成字幕与TTS');
    const { subtitles, ttsAudio } = await this._generateMedia(shots, request);

    // Step 10: 后期合成
    this._log('STEP10', '后期合成');
    const finalVideo = await this._postProduce(segments, subtitles, ttsAudio, request);

    this._log('PRODUCE_COMPLETE', `生产完成: ${finalVideo}`);

    return {
      project: { name: this.projectName, category: this.category },
      request,
      storyOutline,
      shots,
      characterPhotoPlans,
      prompts: prompts.map(p => ({ id: p.id, length: p.promptLength, refCount: p.refImageCount })),
      validation,
      segments,
      subtitles,
      ttsAudio,
      finalVideo,
      report: this._generateReport()
    };
  }

  /**
   * 仅规划（不渲染）— 用于审查Prompt
   */
  async plan(request) {
    this._log('PLAN', `规划模式: ${request.title}`);

    const characterAssets = this._loadCharacters(request.characters);
    const sceneTemplate = this.sceneLibrary.getScene(request.sceneType);
    const storyOutline = this._generateStoryOutline(request);
    const shots = this._generateShots(request, sceneTemplate);
    const shotCharacterMap = this.characterManager.buildShotCharacterMap(shots);
    const prompts = this._buildPrompts(shots, shotCharacterMap, sceneTemplate);
    const validation = this._validatePrompts(prompts);

    return {
      storyOutline,
      shots,
      prompts,
      shotCharacterMap,
      validation,
      report: this._generateReport()
    };
  }

  /**
   * 仅渲染（已有Prompt）
   */
  async render(prompts, mock = false) {
    this._log('RENDER', `渲染模式: ${prompts.length}个镜头`);
    return await this._submitRender(prompts, mock);
  }

  /**
   * 仅后期合成
   */
  async postProduce({ segments, subtitles, ttsAudio, request }) {
    this._log('POST', '后期合成模式');
    return await this._postProduce(segments, subtitles, ttsAudio, request);
  }

  // ─── 内部方法 ───

  _loadCharacters(characterIds) {
    const assets = {};
    for (const id of (characterIds || [])) {
      assets[id] = this.characterManager.getCharacter(id);
    }
    this._log('CHARACTERS_LOADED', `已加载 ${Object.keys(assets).length}个角色`);
    return assets;
  }

  _generateStoryOutline(request) {
    const template = SHOT_TEMPLATES[this.category] || SHOT_TEMPLATES['health-education'];
    const totalDuration = template.acts.reduce((sum, act) => sum + act.duration, 0);

    return {
      title: request.title,
      category: this.category,
      template: template.name,
      acts: template.acts.map(act => ({
        name: act.name,
        duration: act.duration,
        shotCount: act.shots.length
      })),
      totalDuration,
      targetDuration: request.duration || totalDuration,
      script: request.scriptContent
    };
  }

  _generateShots(request, sceneTemplate) {
    const template = SHOT_TEMPLATES[this.category] || SHOT_TEMPLATES['health-education'];
    const shots = [];

    for (const act of template.acts) {
      for (const shotTemplate of act.shots) {
        shots.push({
          id: shotTemplate.id,
          name: `${act.name}-${shotTemplate.id}`,
          type: shotTemplate.type,
          duration: shotTemplate.duration,
          act: act.name,
          description: shotTemplate.description,
          characters: request.characters || [],
          scene: request.sceneType
        });
      }
    }

    this._log('SHOTS_GENERATED', `生成 ${shots.length}个镜头, 总时长 ${shots.reduce((s, sh) => s + sh.duration, 0)}秒`);
    return shots;
  }

  _buildPrompts(shots, shotCharacterMap, sceneTemplate) {
    const results = [];

    // 正向锚定式 — 精简版（v6.14-Peng 第5批优化）
    const POSITIVE_ANCHOR = 'realistic cinematic live-action, natural skin texture, ' +
      'anatomically correct proportions, photorealistic lighting, sharp focus 8K, ' +
      'professional photography, lifelike features, no stylization';

    for (const shot of shots) {
      // ─── 旁白检测拦截（系统级铁律）───
      const voCheck = this._detectVoiceover(shot);
      if (voCheck.hasVoiceover) {
        console.error(`[DocumentaryDirector] BLOCKED voiceover in shot ${shot.id}: ${voCheck.violations.join(', ')}`);
        throw new Error(`Shot ${shot.id} contains voiceover which is 100% forbidden. Remove SPEAKER:旁白 and set LIP_SYNC:YES`);
      }

      const charMap = shotCharacterMap[shot.id] || {};
      const characterRefs = {};

      // ─── 精简角色描述（每角色控制在120字符以内）───
      const charDescs = [];
      const charNegatives = []; // Fix-21: 收集角色级约束
      for (const [charId, charData] of Object.entries(charMap)) {
        // 只提取最核心的描述元素
        const coreDesc = this._buildCoreCharacterDesc(charData);
        charDescs.push(coreDesc);

        // Fix-21: 获取角色级负面约束并转为正面锚定词
        const constraints = this.characterManager?.getCharacterNegativeConstraints?.(charId);
        if (constraints?.join) {
          const positive = constraints.map(c =>
            c.replace(/^no\s+/i, '')
              .replace(/^(chibi|anime|cartoon|3D render|plastic skin)/i, 'realistic live-action')
          );
          charNegatives.push(...positive);
        }

        // 参考图映射
        for (const ref of charData.refs) {
          if (!characterRefs[charId]) characterRefs[charId] = [];
          characterRefs[charId].push(ref.fileName);
        }
      }

      // Fix-21: 去重后拼入角色约束
      let charConstraintStr = '';
      if (charNegatives.length > 0) {
        const uniqueNegs = [...new Set(charNegatives)].slice(0, 3).join(', ');
        charConstraintStr = uniqueNegs;
      }

      // ─── 精简场景描述（控制在200字符以内）───
      const scene = this.sceneLibrary.getScene(shot.scene);
      const sceneDesc = this._buildCoreSceneDesc(scene, shot.type);

      // Fix-22: 场景级forbidden检测
      if (this.sceneLibrary?.checkForbidden) {
        const fullPromptSoFar = [
          ...charDescs, sceneDesc, shot.description.trim()
        ].join(', ');
        const forbiddenResult = this.sceneLibrary.checkForbidden(shot.scene, fullPromptSoFar);
        if (forbiddenResult.hasForbidden) {
          console.warn(`[DocumentaryDirector] Scene ${shot.scene} contains forbidden: ${forbiddenResult.violations.join(', ')}`);
        }
      }

      // ─── 光影：优先使用场景库定义，无定义时fallback ───
      const sceneDef = this.sceneLibrary?.getScene ? this.sceneLibrary.getScene(shot.scene) : null;
      let lighting = (sceneDef?.lighting) || 'natural sunlight 5600K, soft even illumination';
      if (this.sceneLibrary?.buildScenePrompt) {
        const scenePrompt = this.sceneLibrary.buildScenePrompt(shot.scene, shot.type);
        if (scenePrompt?.lighting) {
          lighting = scenePrompt.lighting;
        }
      }

      // ─── 时代背景：根据场景类型动态选择 ───
      const eraBackground = this._getEraBackground(scene?.type, this.category);

      // ─── 色彩只保留HEX（控制在50字符以内）───
      const colors = scene.colorPalette.slice(0, 3).map(c => c.hex).join(' ');

      // ─── 精简运镜（控制在80字符以内）───
      const camera = this._buildCoreCameraDesc(scene, shot.type);

      // ─── 分镜动作描述（已有，直接使用）───
      const action = shot.description.trim();

      // ─── v6.14-Peng 第2批：结构化 Prompt 合成（替代原有的 promptParts 拼接）───
      // 构建结构化字段
      const schemaBuilder = new PromptSchemaBuilder();
      const structuredFields = {
        prefix: 'CG cinematic photorealistic hyper-detailed',
        era: eraBackground,
        subject: [...charDescs, charConstraintStr].filter(Boolean).join(', '),
        action: action,
        environment: sceneDesc,
        lighting: lighting,
        colors: colors,
        style: POSITIVE_ANCHOR,
        camera: camera,
        atmosphere: 'clean professional documentary',
      };

      // 使用 SchemaBuilder 构建
      const schemaResult = schemaBuilder.build(structuredFields);

      // 使用 FinalPromptComposer 统一合成（含优先级裁剪）
      const composer = new FinalPromptComposer({ maxLength: 990 });
      const composeResult = composer.compose(schemaResult.fields);
      let prompt = composeResult.prompt;

      // 记录裁剪信息
      if (composeResult.trimmed.length > 0) {
        for (const t of composeResult.trimmed) {
          console.warn(`[DocumentaryDirector] ⚠️ ${shot.id} ${t.action} ${t.field}: 节省 ${t.saved} 字符`);
        }
      }
      if (composeResult.hardTruncated) {
        const warningMsg = `[${new Date().toISOString()}] Shot ${shot.id}: prompt hard-truncated to ${prompt.length} chars`;
        console.warn(`[DocumentaryDirector] ${warningMsg}`);
        try {
          fsSync.appendFileSync('.prompt-warnings.log', warningMsg + '\n');
        } catch (e) { /* 忽略文件写入错误 */ }
      }

      // 旧版策略1-4保留为兼容 fallback（如果新版未裁剪但长度仍超，则触发）
      if (prompt.length > 990 && composeResult.trimmed.length === 0 && !composeResult.hardTruncated) {
        // 策略1: 移除氛围锚定
        prompt = prompt.replace(', clean professional documentary', '');
        if (prompt.length <= 990) {
          console.warn(`[DocumentaryDirector] ⚠️ ${shot.id} fallback-移除氛围锚定后: ${prompt.length}字符`);
        }
      }
      if (prompt.length > 990 && composeResult.trimmed.length === 0 && !composeResult.hardTruncated) {
        // 策略2: 缩短场景描述
        const shorterScene = scene.environment.base.split(',')[0] + ', ' + scene.environment.base.split(',')[1];
        prompt = prompt.replace(sceneDesc, shorterScene);
        if (prompt.length <= 990) {
          console.warn(`[DocumentaryDirector] ⚠️ ${shot.id} fallback-缩短场景描述后: ${prompt.length}字符`);
        }
      }
      if (prompt.length > 990 && composeResult.trimmed.length === 0 && !composeResult.hardTruncated) {
        // 策略4: 最终硬截断
        const cutoff = prompt.lastIndexOf(',', 986);
        if (cutoff > 500) {
          prompt = prompt.substring(0, cutoff) + '...';
        } else {
          prompt = prompt.substring(0, 987) + '...';
        }
        const warningMsg = `[${new Date().toISOString()}] Shot ${shot.id}: prompt fallback hard-truncated to ${prompt.length} chars`;
        console.warn(`[DocumentaryDirector] ${warningMsg}`);
        try {
          fsSync.appendFileSync('.prompt-warnings.log', warningMsg + '\n');
        } catch (e) { /* 忽略文件写入错误 */ }
      }

      // ─── v6.14-Peng 第1批：Prompt 质量三步处理 ───
      // Step 1: 清洗弱字段
      const cleaner = new PromptFieldCleaner();
      let rawPrompt = prompt; // 保留原始用于统计
      prompt = cleaner.cleanPrompt(prompt);
      const cleanStats = cleaner.getStats();
      if (cleanStats.saved > 0) {
        this._log('PROMPT_CLEANED', `${shot.id}: 清洗弱字段 ${cleanStats.saved} 字符 (${cleanStats.before}→${cleanStats.after})`);
      }

      // Step 2: 强制去重
      const finalizer = new PromptFinalizer();
      const finalResult = finalizer.finalize(prompt);
      prompt = finalResult.prompt;
      if (finalResult.saved > 0) {
        this._log('PROMPT_FINALIZED', `${shot.id}: 去重节省 ${finalResult.saved} 字符 (${finalResult.duplicates} 处重复)`);
      }

      // Step 3: 质量校验
      const validator = new FinalPromptValidator();
      const validation = validator.validate(prompt);
      if (!validation.passed) {
        console.warn(`[DocumentaryDirector] ${shot.id} 校验警告: ${validation.issues.join(', ')}`);
      }
      if (validation.score < 60) {
        console.warn(`[DocumentaryDirector] ${shot.id} 质量评分低: ${validation.score}/100`);
      }

      results.push({
        id: shot.id,
        name: shot.name,
        duration: shot.duration,
        prompt,
        promptLength: prompt.length,
        weightedLength: validation.weightedLength,
        utilization: validation.utilization,
        validationIssues: validation.issues,
        validationScore: validation.score,
        characterRefs,
        refImageCount: Object.values(characterRefs).flat().length,
        scene: shot.scene
      });
    }

    const avgLen = Math.round(results.reduce((s, r) => s + r.promptLength, 0) / results.length);
    this._log('PROMPTS_BUILT', `构建 ${results.length}个Prompt, 平均长度 ${avgLen}字符`);
    return results;
  }

  /**
   * 构建精简角色描述（控制在60-80字符）
   */
  _getEraBackground(sceneType, category) {
    if (category === 'mythical' || sceneType === 'ancient') {
      return 'ancient mythological epic era';
    }
    if (category === 'documentary') {
      return 'modern contemporary real-world';
    }
    return 'contemporary setting'; // 默认fallback
  }

  // 检测旁白/ narration 内容并拦截
  _detectVoiceover(shot) {
    const VO_PATTERNS = [
      /SPEAKER:\s*旁白/i,
      /旁白叙述/i,
      /narrator/i,
      /voiceover/i,
      / narration/i,
      /LIP_SYNC:\s*NO/i, // 不对嘴型=旁白
    ];
    const shotText = JSON.stringify(shot);
    const violations = [];
    for (const pattern of VO_PATTERNS) {
      if (pattern.test(shotText)) {
        violations.push(pattern.source);
      }
    }
    return {
      hasVoiceover: violations.length > 0,
      violations,
    };
  }

  _buildCoreCharacterDesc(charData) {
    const desc = charData.promptText;
    // 支持中英文逗号分隔
    const segments = desc.split(/[,，;；]/).map(s => s.trim()).filter(Boolean);

    // 用正则提取各维度（优先级从高到低）
    const EXTRACTORS = [
      { key: 'identity', pattern: /\b(\d+[-\s]*year[-\s]*old.*?)(?:,|$)|(\d+岁.*?)(?:,|$)/i, priority: 10 },
      { key: 'role', pattern: /\b(warrior|emperor|giant|beast|god|spirit|nurse|doctor|presenter|hero|deity|immortal|demon|monster|creature|sage|king|queen|guardian|chieftain|elder|child)\b/i, priority: 9 },
      { key: 'attire', pattern: /\b(robe|armor|coat|cape|uniform|dress|suit|helmet|crown|garment|loincloth|tunic|cloak|mantle|chainmail|breastplate)\b/i, priority: 8 },
      { key: 'physical', pattern: /\b(tall|short|muscular|slender|massive|huge|gigantic|towering)\b/i, priority: 7 },
      { key: 'feature', pattern: /\b(red hair|blue eyes|golden skin|scarred|bearded|bald|long hair|white hair)\b/i, priority: 6 },
    ];

    const extracted = [];
    for (const { pattern, priority } of EXTRACTORS) {
      for (const seg of segments) {
        if (pattern.test(seg) && !extracted.find(e => e.text === seg)) {
          extracted.push({ text: seg, priority });
          break; // 每个维度只取第一个匹配
        }
      }
    }

    // 按优先级排序组装
    let result = extracted.sort((a, b) => b.priority - a.priority)
      .map(e => e.text).join(', ');

    // 智能缩短（优先缩短最长的片段，而非硬截断）
    if (result.length > 100) {
      const sorted = [...extracted].sort((a, b) => b.text.length - a.text.length);
      for (const item of sorted) {
        if (result.length <= 100) break;
        // 把长片段缩短到最多4个词
        const words = item.text.split(/\s+/);
        if (words.length > 4) {
          const shortened = words.slice(0, 4).join(' ');
          result = result.replace(item.text, shortened);
        }
      }
    }
    // 如果还是超长，再从末尾截断
    if (result.length > 100) {
      result = result.substring(0, 97) + '...';
    }
    return result;
  }

  /**
   * 构建极简场景描述（控制在80字符以内）
   */
  _buildCoreSceneDesc(scene, shotType) {
    const env = scene.environment;
    // 按语义单元分割（中英文逗号都支持）
    const baseParts = env.base.split(/[,，]/).map(s => s.trim()).filter(Boolean);

    // 优先取包含核心场景信息的片段（地点+环境特征）
    const PRIORITY_PATTERNS = [
      /(mountain|river|forest|desert|ocean|sky|city|temple|palace|cave|valley)/i,
      /(ancient|ruins|wasteland|battlefield|summit|peak|cliff)/i,
    ];
    const picked = [];
    for (const pattern of PRIORITY_PATTERNS) {
      for (const part of baseParts) {
        if (pattern.test(part) && !picked.includes(part)) {
          picked.push(part);
          break;
        }
      }
    }
    // 如果正则无匹配，fallback取前两句
    let desc = picked.length >= 2 ? picked.slice(0, 2).join(', ') : baseParts.slice(0, 2).join(', ');

    // 根据镜头类型添加元素（特写也保留环境暗示）
    if (shotType === 'establishing' || shotType === 'wide') {
      const furniture = env.furniture?.split(/[,，]/)[0];
      if (furniture) desc += ', ' + furniture.trim();
    } else if (shotType === 'closeup' || shotType === 'detail') {
      // 特写也加环境暗示（如"blurred mountain background"）
      const bgHint = baseParts.find(p => /background|backdrop|depth/i.test(p));
      if (bgHint) desc += ', ' + bgHint;
    }
    if (desc.length > 100) desc = desc.substring(0, 97) + '...';
    return desc;
  }

  /**
   * 构建极简运镜描述（控制在50字符以内）
   */
  _buildCoreCameraDesc(scene, shotType) {
    const cam = scene.camera[shotType] || scene.camera.defaults;

    // 运镜类型匹配（按优先级排序）
    const CAMERA_PATTERNS = [
      { pattern: /drone|aerial|flyover|overhead|bird'?s[-\s]eye/i, term: 'drone aerial' },
      { pattern: /tracking|follow|chase/i, term: 'tracking shot' },
      { pattern: /dolly\s*(in|out)|push[-\s]*in|pull[-\s]*back/i, term: 'dolly' },
      { pattern: /crane|jib|boom/i, term: 'crane shot' },
      { pattern: /handheld|steady(\s*cam)?/i, term: 'handheld' },
      { pattern: /FPV|first[-\s]person|POV/i, term: 'FPV' },
      { pattern: /360|orbit|rotate/i, term: '360 orbital' },
      { pattern: /wide|establishing|master/i, term: 'wide' },
      { pattern: /close[-\s]?up|macro/i, term: 'close-up' },
      { pattern: /medium|mid/i, term: 'medium' },
    ];
    const HEIGHT_PATTERNS = [
      { pattern: /(\d+)\s*m/i, term: m => m[1] + 'm altitude' },
      { pattern: /low angle|worm'?s[-\s]eye/i, term: 'low angle' },
      { pattern: /high angle|overhead/i, term: 'high angle' },
      { pattern: /eye[-\s]?level/i, term: 'eye-level' },
    ];

    const coreTerms = [];
    for (const { pattern, term } of CAMERA_PATTERNS) {
      const match = cam.match(pattern);
      if (match) { coreTerms.push(typeof term === 'function' ? term(match) : term); break; }
    }
    for (const { pattern, term } of HEIGHT_PATTERNS) {
      const match = cam.match(pattern);
      if (match) { coreTerms.push(typeof term === 'function' ? term(match) : term); break; }
    }
    if (/stable|tripod|gimbal|smooth/i.test(cam)) coreTerms.push('stabilized');
    if (/shallow depth|bokeh|DOF/i.test(cam)) coreTerms.push('shallow DOF');

    // fallback
    if (coreTerms.length === 0) coreTerms.push('medium', 'eye-level');

    // 逗号分隔与其他部分格式一致
    return coreTerms.join(', ');
  }

  _validatePrompts(prompts) {
    const results = [];
    let criticalCount = 0;
    let warningCount = 0;

    for (const p of prompts) {
      const check = this.guard.validate(p.prompt, { strictMode: true, logLevel: 'none' });
      results.push({
        id: p.id,
        passed: check.passed,
        level: check.level,
        violations: check.allViolations
      });

      if (check.level === 'critical') criticalCount++;
      if (check.level === 'warning') warningCount++;
    }

    const allPassed = criticalCount === 0;

    return {
      passed: allPassed,
      summary: `${results.length}个Prompt中 ${criticalCount}个严重问题, ${warningCount}个警告`,
      details: results,
      criticalCount,
      warningCount
    };
  }

  /**
   * 批量 Prompt 深度校验（v6.14-Peng 第6批）
   * 使用通用校验工具进行长度、利用率、质量评分综合检查
   */
  _deepValidatePrompts(prompts) {
    if (!this.promptValidator) {
      console.warn('[DocumentaryDirector] promptValidator 未初始化，跳过深度校验');
      return null;
    }

    const promptStrings = prompts.map(p => p.prompt);
    const result = this.promptValidator.batchValidate(promptStrings, {
      expectedStyle: 'documentary'
    });

    // 生成报告
    const report = this.promptValidator.generateReport(result.results);
    console.log(`[DocumentaryDirector] ${report.replace(/\n/g, ' | ')}`);

    // 更新每个 prompt 的校验信息
    for (let i = 0; i < prompts.length; i++) {
      prompts[i].deepValidation = result.results[i];
    }

    return result.summary;
  }

  async _submitRender(prompts, mock = false) {
    // TODO: 接入真实Seedance API
    // 当前返回模拟结果
    const segments = prompts.map(p => ({
      id: p.id,
      status: mock ? 'mock-rendered' : 'submitted',
      promptLength: p.promptLength,
      refImages: p.refImageCount,
      duration: p.duration,
      filePath: path.join(this.outputDir, '04-segments', `${p.id}.mp4`)
    }));

    this._log('RENDER', `${mock ? 'Mock' : '真实'}渲染: ${segments.length}个片段`);
    return segments;
  }

  async _generateMedia(shots, request) {
    // 生成字幕文本
    const subtitles = this._generateSubtitles(shots, request);

    // TODO: 接入真实TTS API
    const ttsAudio = {
      filePath: path.join(this.outputDir, '05-post', 'narration.mp3'),
      duration: shots.reduce((s, sh) => s + sh.duration, 0),
      voice: request.ttsVoice || TTS_CONFIG[this.category]?.voice || 'system-default-female'
    };

    this._log('MEDIA', `字幕 ${subtitles.length}条, TTS ${ttsAudio.duration}秒`);
    return { subtitles, ttsAudio };
  }

  _generateSubtitles(shots, request) {
    const subtitles = [];
    let currentTime = 0;
    const style = SUBTITLE_STYLES[request.subtitleStyle || this.category] || SUBTITLE_STYLES['medical-education'];

    // 使用脚本内容分配字幕
    const script = request.scriptContent || {};
    const scriptLines = [
      script.intro,
      ...(script.body || []),
      script.conclusion
    ].filter(Boolean);

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const text = scriptLines[i] || `[${shot.id}] ${shot.description}`;

      subtitles.push({
        id: shot.id,
        start: currentTime,
        end: currentTime + shot.duration,
        text,
        style
      });

      currentTime += shot.duration;
    }

    return subtitles;
  }

  async _postProduce(segments, subtitles, ttsAudio, request) {
    // TODO: 接入真实FFmpeg
    // 当前返回模拟结果
    const finalPath = path.join(this.outputDir, '05-post', 'final.mp4');

    this._log('POST', `后期合成: ${segments.length}片段 + ${subtitles.length}字幕 + TTS`);

    return {
      filePath: finalPath,
      segments: segments.length,
      subtitles: subtitles.length,
      duration: segments.reduce((s, seg) => s + seg.duration, 0),
      style: this.gateway.getPostProductionConfig()
    };
  }

  _generateCharacterPhotoPlans(characterIds) {
    const plans = {};

    for (const charId of (characterIds || [])) {
      const char = this.characterManager.getCharacter(charId);
      if (!char) continue;

      // 使用CharacterGenerator生成定妆照方案
      const plan = this.characterGenerator.generatePlan({
        name: char.nameCN,
        description: char.description,
        age: char.metadata?.age,
        profession: char.role
      }, {
        shotType: 'portrait',
        generateRefAngles: char.refAngles || ['front-full', 'front-closeup']
      });

      plans[charId] = plan;
      this._log('PHOTO_PLAN', `${char.nameCN}: ${plan.generation.promptLength}字符, ${plan.compliance.level}`);
    }

    this._log('PHOTO_PLANS', `已生成 ${Object.keys(plans).length}个角色的定妆照方案`);
    return plans;
  }

  /**
   * 仅生成定妆照（独立API）
   */
  generateCharacterPhotos(characterId, options = {}) {
    const char = this.characterManager.getCharacter(characterId);
    if (!char) throw new Error(`[Director] 未知角色: ${characterId}`);

    return this.characterGenerator.generatePlan({
      name: char.nameCN,
      description: char.description,
      age: char.metadata?.age,
      profession: char.role
    }, {
      shotType: options.shotType || 'portrait',
      generateRefAngles: options.angles || char.refAngles
    });
  }

  _generateReport() {
    const totalDuration = this.decisionLog
      .filter(l => l.type === 'SHOTS_GENERATED')
      .map(l => {
        const match = l.message.match(/总时长 (\d+)秒/);
        return match ? parseInt(match[1]) : 0;
      })[0] || 0;

    return {
      projectName: this.projectName,
      category: this.category,
      styleType: 'documentary',
      totalDuration,
      decisionLog: this.decisionLog,
      timestamp: new Date().toISOString()
    };
  }

  _log(type, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    this.decisionLog.push(entry);
    console.log(`[DocumentaryDirector] [${type}] ${message}`);
  }
}

// ─── 导出 ───
module.exports = { DocumentaryDirector, SHOT_TEMPLATES };

// ─── CLI 测试 ───
if (require.main === module) {
  console.log('\n=== Documentary Director v1.0-Peng 测试 ===\n');

  // 测试1: 初始化导演
  console.log('--- Test 1: 初始化导演 ---');
  const director = new DocumentaryDirector({
    projectName: 'health-e01-rhabdomyolysis',
    category: 'health-education'
  });
  console.log('  ✅ 导演初始化完成');

  // 测试2: 一键规划（不渲染）
  console.log('\n--- Test 2: 规划模式 ---');
  (async () => {
    try {
      const plan = await director.plan({
        title: '什么是横纹肌溶解',
        duration: 59,
        characters: ['chen-nurse', 'xiaog-boy'],
        sceneType: 'medical-studio',
        scriptContent: {
          intro: '小朋友们，今天我们来认识一个名字很长但很重要的健康知识——横纹肌溶解',
          body: [
            '横纹肌溶解是指我们的肌肉细胞受到损伤后，里面的内容物释放到血液里',
            '常见的原因包括过度运动、严重的外伤，或者某些特殊的药物',
            '如果发现肌肉特别疼痛，或者尿液颜色变深像浓茶一样，一定要告诉爸爸妈妈',
            '及时去医院检查非常重要，医生可以通过抽血化验来确认'
          ],
          conclusion: '记住，适度运动，多喝水，身体不舒服一定要及时告诉爸爸妈妈，保护好自己的身体'
        }
      });

      console.log(`  剧本: ${plan.storyOutline.title}`);
      console.log(`  幕数: ${plan.storyOutline.acts.length}`);
      console.log(`  镜头数: ${plan.shots.length}`);
      console.log(`  总时长: ${plan.shots.reduce((s, sh) => s + sh.duration, 0)}秒`);
      console.log(`  Prompt数: ${plan.prompts.length}`);

      // 测试2.5: 定妆照方案
      console.log('\n--- Test 2.5: 定妆照方案 ---');
      const photoPlan = director.generateCharacterPhotos('chen-nurse');
      console.log(`  陈女士定妆照: ${photoPlan.generation.promptLength}字符`);
      console.log(`  合规: ${photoPlan.compliance.level}`);
      console.log(`  参考角度: ${photoPlan.referenceAngles.map(a => a.angle).join(', ')}`);
      console.log(`  前150字符: ${photoPlan.generation.positivePrompt.substring(0, 150)}...`);

      // 测试3: Prompt详情
      console.log('\n--- Test 3: Prompt详情 ---');
      plan.prompts.forEach((p, i) => {
        const status = p.promptLength > 990 ? '❌ 超限' : p.promptLength > 950 ? '⚠️ 接近' : '✅';
        console.log(`  ${p.id}: ${p.promptLength}字符 ${status} | ${p.refImageCount || 0}张参考图`);
        if (i === 0) {
          console.log(`    前150字符: ${p.prompt.substring(0, 150)}...`);
        }
      });

      // 测试4: 风格验证
      console.log('\n--- Test 4: 风格验证 ---');
      console.log(`  验证结果: ${plan.validation.passed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`  总结: ${plan.validation.summary}`);
      plan.validation.details.forEach(d => {
        const icon = d.level === 'critical' ? '❌' : d.level === 'warning' ? '⚠️' : '✅';
        console.log(`    ${icon} ${d.id}: ${d.level} (${d.violations?.length || 0}项问题)`);
      });

      // 测试4.5: 深度校验（v6.14-Peng 第6批）
      console.log('\n--- Test 4.5: 深度校验 ---');
      const deepValidation = director._deepValidatePrompts(plan.prompts);
      if (deepValidation) {
        console.log(`  平均评分: ${deepValidation.avgScore}/100`);
        console.log(`  平均长度: ${deepValidation.avgLength}字符`);
        console.log(`  通过: ${deepValidation.passed}/${deepValidation.total}`);
        console.log(`  ${deepValidation.allPassed ? '✅ 全部通过' : `⚠️ ${deepValidation.failed} 个需要修复`}`);
      }

      // 测试5: 分镜详情
      console.log('\n--- Test 5: 分镜详情 ---');
      plan.shots.forEach(s => {
        console.log(`  ${s.id} [${s.act}] ${s.type} ${s.duration}s: ${s.description.substring(0, 60)}...`);
      });

      // 测试6: 决策日志
      console.log('\n--- Test 6: 决策日志 ---');
      const report = plan.report;
      console.log(`  项目: ${report.projectName}`);
      console.log(`  风格: ${report.styleType}`);
      console.log(`  日志条数: ${report.decisionLog.length}`);
      report.decisionLog.slice(0, 5).forEach(l => {
        console.log(`    [${l.type}] ${l.message}`);
      });

      console.log('\n=== 全部测试通过 ===');

    } catch (err) {
      console.error('测试失败:', err.message);
      process.exit(1);
    }
  })();
}