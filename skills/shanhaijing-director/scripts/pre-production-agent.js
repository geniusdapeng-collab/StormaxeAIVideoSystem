#!/usr/bin/env node
/**
 * ShanhaiStory Forge v2.1-Peng | Pre-Production Agent v1.3-Peng
 * 大视频系统统一版本号：v2.1-Peng
 *
 * 职责：执行导演管线 Stage 1-8，生成飞书审核文档
 * 核心价值：把试错成本从渲染端移到文档端
 */

const fs = require('fs');
const path = require('path');

const { PreProductionChecklist } = require('./pre-production-checklist');
const { FeishuDocGenerator } = require('./feishu-doc-generator');
const { countEnglishWords, countChineseChars } = require('./prompt-budget-metrics');
const { ENGLISH_WORD_LIMIT, CHINESE_DIALOGUE_BUDGET, FINAL_TOTAL_CHAR_LIMIT } = require('./prompt-final-normalizer');

const AGENT_VERSION = 'v1.3-Peng';

class PreProductionAgent {
  constructor(productionDir, options = {}) {
    this.productionDir = productionDir;
    this.options = options;
    this.pipelineResults = {};
    this.checklistResults = null;
    this.docUrl = null;

    // 初始化检查清单
    this.checklist = new PreProductionChecklist();

    // 初始化文档生成器
    this.docGenerator = new FeishuDocGenerator();
  }

  /**
   * 主入口：执行预生产全流程
   * @param {Object} pipelineResults - 导演管线 Stage 1-8 的执行结果
   * @returns {Object} { status, docUrl, checklist, message }
   */
  async run(pipelineResults) {
    console.log(`\n🎬 Pre-Production Agent ${AGENT_VERSION} 启动`);
    console.log(`📁 生产目录: ${this.productionDir}`);
    console.log('='.repeat(60));

    this.pipelineResults = pipelineResults;

    try {
      // Step 1: 执行预生产检查清单
      console.log('\n📋 Step 1/3: 执行预生产检查清单...');
      this.checklistResults = await this.checklist.run(pipelineResults, this.productionDir);
      console.log(`✅ 检查清单完成: ${this.checklistResults.summary.passed}/${this.checklistResults.summary.total} 项通过`);

      // Step 2: 生成飞书审核文档（Markdown保存到本地）
      console.log('\n📝 Step 2/3: 生成飞书审核文档...');
      const docResult = await this.generateFeishuDoc();
      this.docPath = docResult.markdownPath;
      console.log(`✅ Markdown文档已保存: ${this.docPath}`);

      // Step 3: 保存本地报告
      console.log('\n💾 Step 3/3: 保存本地预生产报告...');
      await this.saveLocalReport();

      // 返回结果
      const hasBlockers = this.checklistResults.summary.blockers > 0;
      const status = 'paused';
      const message = hasBlockers
        ? `预生产检查完成，发现 ${this.checklistResults.summary.blockers} 个阻断项（已在文档中标注）。文档路径: ${this.docPath}`
        : `预生产检查全部通过，等待人工审核。文档路径: ${this.docPath}`;

      return {
        status,
        docPath: this.docPath,
        docTitle: docResult.title,
        checklist: this.checklistResults,
        message,
        canProceed: true,
        hasBlockers
      };

    } catch (error) {
      console.error(`\n❌ Pre-Production Agent 执行失败:`, error.message);
      return {
        status: 'error',
        docUrl: null,
        checklist: null,
        message: `预生产阶段执行失败: ${error.message}`,
        canProceed: false
      };
    }
  }

  /**
   * 生成飞书审核文档（Markdown格式，保存到本地）
   */
  async generateFeishuDoc() {
    const projectData = this.buildProjectData();
    const docResult = this.docGenerator.generate(projectData);
    const markdownPath = docResult.saveToFile(this.productionDir);
    console.log(`  📝 Markdown文档已保存: ${markdownPath}`);
    return {
      markdownPath,
      title: docResult.title,
      markdown: docResult.markdown
    };
  }

  /**
   * 构建项目数据（用于生成文档）
   */
  buildProjectData() {
    const prdRaw = this.pipelineResults['prd-generation'] || {};
    const prd = typeof prdRaw === 'string'
      ? { title: prdRaw.match(/^#\s+(.+)$/m)?.[1] || '未命名', summary: prdRaw.substring(0, 200) }
      : prdRaw;

    const storyPlan = this.pipelineResults['story-plan'] || {};

    // 从segments中提取所有shots
    let allShots = [];
    if (storyPlan.segments) {
      for (const segment of storyPlan.segments) {
        if (segment.shots) {
          for (const shot of segment.shots) {
            shot._segmentId = segment.id;
            shot._segmentTitle = segment.title;
            allShots.push(shot);
          }
        }
      }
    }
    if (storyPlan.shots && storyPlan.shots.length && allShots.length === 0) {
      allShots = storyPlan.shots;
    }

    const shots = allShots;
    const characters = storyPlan.characters || [];

    // v1.1-Peng-fix: 从04-prompts/文件读取实际Prompt内容
    const promptsDir = path.join(this.productionDir, '04-prompts');
    const getPromptFromFile = (shotId) => {
      const promptFile = path.join(promptsDir, `${shotId}-prompt.md`);
      if (fs.existsSync(promptFile)) {
        const fileContent = fs.readFileSync(promptFile, 'utf8');
        const match = fileContent.match(/```([\s\S]*?)```/);
        return match ? match[1].trim() : fileContent.trim();
      }
      return null;
    };

    // v1.3-Peng: 统一的三维利用率计算
    const calcShotMetrics = (prompt) => {
      const nonDialogue = prompt.replace(/【Dialogue】[\s\S]*?(?=\s*\|\s*【|$)/gi, '');
      const dialogueMatch = prompt.match(/【Dialogue】([\s\S]*?)(?=\s*\|\s*【|$)/i);
      const dialogueText = dialogueMatch ? dialogueMatch[1] : '';
      const enWords = countEnglishWords(nonDialogue);
      const cnChars = countChineseChars(dialogueText);
      const totalChars = prompt.length;
      return {
        enWords,
        cnChars,
        totalChars,
        enUsage: Math.round((enWords / ENGLISH_WORD_LIMIT) * 100),
        cnUsage: Math.round((cnChars / CHINESE_DIALOGUE_BUDGET) * 100),
        totalUsage: Math.round((totalChars / FINAL_TOTAL_CHAR_LIMIT) * 100)
      };
    };

    const statsAvg = this._calcStatsAvg(shots, getPromptFromFile);

    return {
      title: prd.title || storyPlan.title || '未命名短片',
      projectCode: this.options.projectCode || '未指定',
      taskType: this.options.taskType || '通用视频',
      worldview: this.options.worldview || 'nirath',

      // 统计信息（v1.3-Peng: 三维利用率）
      stats: {
        totalShots: shots.length,
        totalDuration: shots.reduce((sum, s) => sum + (s.duration || 5), 0),
        avgPromptLength: statsAvg.avgLen,
        promptEnglishWordUsage: statsAvg.avgEnUsage,
        promptChineseUsage: statsAvg.avgCnUsage,
        promptTotalUsage: statsAvg.avgTotalUsage,
        promptUtilization: statsAvg.avgTotalUsage
      },

      // PRD信息
      prd: {
        title: prd.title || storyPlan.title,
        summary: prd.summary || storyPlan.outline,
        style: prd.style || storyPlan.metadata?.style,
        targetDuration: prd.targetDuration || storyPlan.metadata?.totalDuration,
        targetAudience: prd.targetAudience || '未指定'
      },

      // 检查清单结果
      checklist: this.checklistResults,

      // 角色信息
      characters: characters.map(c => ({
        name: c.name,
        species: c.species,
        age: c.age,
        features: c.features,
        signature: c.signature,
        refPhotos: c.refPhotos || [],
        promptAnchor: c.promptAnchor || ''
      })),

      // 镜头信息（v1.3-Peng: 三维利用率）
      shots: shots.map((shot, index) => {
        const shotId = shot.id || `S${String(index + 1).padStart(2, '0')}`;
        const filePrompt = getPromptFromFile(shotId);
        const prompt = filePrompt || shot._generatedPrompt || shot._finalPrompt || shot.prompt || '';
        const metrics = calcShotMetrics(prompt);

        return {
          id: shotId,
          index: index + 1,
          title: shot.title || `镜头${index + 1}`,
          description: shot.description || '',
          type: shot.type || 'action',
          duration: shot.duration || 5,
          camera: shot.camera || shot.cinematography || '',
          emotion: shot.emotion || '',
          act: shot.act || '',
          characters: shot.characters || [],

          // 提示词信息（v1.3-Peng: 三维利用率）
          prompt,
          promptLength: metrics.totalChars,
          promptEnglishWords: metrics.enWords,
          promptChineseDialogueChars: metrics.cnChars,
          promptEnglishWordUsage: metrics.enUsage,
          promptChineseUsage: metrics.cnUsage,
          promptTotalUsage: metrics.totalUsage,

          // 运镜信息
          cinematicMove: shot._cinematicMove || '',

          // 角色引用
          refPhotos: shot._refPhotos || [],
          characterVisualNote: shot._characterVisualNote || '',

          // 场景语法
          sceneGrammar: shot._sceneGrammar || null,
          sceneId: shot._sceneId || '',
          shotRole: shot._shotRole || '',

          // 转场
          transition: shot._transition || '',

          // 质量检查
          quality: {
            lengthOk: metrics.totalChars >= 960,
            hasRefs: (shot._refPhotos || []).length > 0,
            hasCharacterAnchor: (shot._characterVisualNote || '').length > 0
          }
        };
      }),

      // 时长分配
      durationAllocation: this.pipelineResults['duration-allocation'] || {},

      // 运镜控制
      cinematography: this.pipelineResults['cinematography-control'] || {},

      // 合规报告
      compliance: this.pipelineResults['compliance-check'] || {}
    };
  }

  /**
   * 计算批次平均统计（v1.3-Peng: 三维利用率）
   */
  _calcStatsAvg(shots, getPromptFromFile) {
    if (!shots.length) return { avgLen: 0, avgEnUsage: 0, avgCnUsage: 0, avgTotalUsage: 0 };
    const calcOne = (s) => {
      const shotId = s.id || `S${String(0).padStart(2, '0')}`;
      const prompt = (getPromptFromFile ? getPromptFromFile(shotId) : null)
        || s._generatedPrompt || s._finalPrompt || s.prompt || '';
      const nonDialogue = prompt.replace(/【Dialogue】[\s\S]*?(?=\s*\|\s*【|$)/gi, '');
      const dialogueMatch = prompt.match(/【Dialogue】([\s\S]*?)(?=\s*\|\s*【|$)/i);
      const dialogueText = dialogueMatch ? dialogueMatch[1] : '';
      const enWords = countEnglishWords(nonDialogue);
      const cnChars = countChineseChars(dialogueText);
      const totalChars = prompt.length;
      return {
        len: totalChars,
        enUsage: Math.round((enWords / ENGLISH_WORD_LIMIT) * 100),
        cnUsage: Math.round((cnChars / CHINESE_DIALOGUE_BUDGET) * 100),
        totalUsage: Math.round((totalChars / FINAL_TOTAL_CHAR_LIMIT) * 100)
      };
    };
    const all = shots.map(calcOne);
    const n = all.length;
    return {
      avgLen: Math.round(all.reduce((s, a) => s + a.len, 0) / n),
      avgEnUsage: Math.round(all.reduce((s, a) => s + a.enUsage, 0) / n),
      avgCnUsage: Math.round(all.reduce((s, a) => s + a.cnUsage, 0) / n),
      avgTotalUsage: Math.round(all.reduce((s, a) => s + a.totalUsage, 0) / n)
    };
  }

  /**
   * 保存本地预生产报告
   */
  async saveLocalReport() {
    const reportPath = path.join(this.productionDir, '99-reports', 'pre-production-report.json');
    const report = {
      version: AGENT_VERSION,
      timestamp: new Date().toISOString(),
      status: this.checklistResults?.summary?.blockers === 0 ? 'awaiting_review' : 'blocked',
      docUrl: this.docUrl,
      checklist: this.checklistResults,
      projectData: this.buildProjectData()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 本地报告已保存: ${reportPath}`);
  }

  /**
   * 处理审核反馈
   */
  parseFeedback(feedback) {
    const lower = feedback.toLowerCase();

    const approveKeywords = ['确认渲染', '开始生产', '执行', 'ok', '确认', '通过', '生产', '渲染'];
    const isApproved = approveKeywords.some(k => lower.includes(k));

    const rejectKeywords = ['放弃', '取消', '停止', '不做了'];
    const isRejected = rejectKeywords.some(k => lower.includes(k));

    const isModification = !isApproved && !isRejected;

    let modifications = [];
    if (isModification) {
      const shotPattern = /S(\d+)[\s:：](.+?)(?=S\d+|$)/g;
      let match;
      while ((match = shotPattern.exec(feedback)) !== null) {
        modifications.push({
          shotId: `S${match[1].padStart(2, '0')}`,
          instruction: match[2].trim()
        });
      }
      if (modifications.length === 0) {
        modifications.push({ shotId: 'all', instruction: feedback.trim() });
      }
    }

    return {
      action: isApproved ? 'approve' : isRejected ? 'reject' : 'modify',
      originalFeedback: feedback,
      modifications,
      isApproved,
      isRejected,
      isModification
    };
  }
}

module.exports = { PreProductionAgent, AGENT_VERSION };
