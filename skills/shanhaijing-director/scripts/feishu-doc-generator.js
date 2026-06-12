'use strict';

/**
 * FeishuDocGenerator v1.0-Peng
 * 生成预生产审核文档（Markdown格式）
 */

const fs = require('fs');
const path = require('path');

class FeishuDocGenerator {
  constructor() {}

  /**
   * 生成Markdown审核文档
   */
  generate(projectData) {
    const { title, stats, prd, checklist, characters, shots } = projectData;

    const markdown = this._buildMarkdown(projectData);
    const docTitle = `【预生产审核】${title || '未命名短片'}`;

    return {
      title: docTitle,
      markdown,
      saveToFile: (productionDir) => this._saveToFile(markdown, productionDir, docTitle)
    };
  }

  _buildMarkdown(data) {
    const { title, stats, prd, checklist, characters, shots, taskType, worldview } = data;
    const lines = [];

    // 标题
    lines.push(`# ${title || '未命名短片'} - 预生产审核文档`);
    lines.push('');
    lines.push(`**任务类型**: ${taskType || '通用视频'} | **世界观**: ${worldview || 'nirath'} | **生成时间**: ${new Date().toISOString()}`);
    lines.push('');

    // 统计概览
    lines.push('## 统计概览');
    lines.push('');
    if (stats) {
      lines.push(`- **总镜头数**: ${stats.totalShots || 0}`);
      lines.push(`- **总时长**: ${stats.totalDuration || 0}s`);
      lines.push(`- **平均Prompt长度**: ${stats.avgPromptLength || 0} 字符`);
      // v1.3-Peng: 三维利用率
      if (stats.promptEnglishWordUsage !== undefined) {
        lines.push(`- **英文词利用率**: ${stats.promptEnglishWordUsage}% (目标 ≤1000词)`);
      }
      if (stats.promptChineseUsage !== undefined) {
        lines.push(`- **中文台词利用率**: ${stats.promptChineseUsage}% (目标 ≤500字)`);
      }
      if (stats.promptTotalUsage !== undefined) {
        lines.push(`- **总字符利用率**: ${stats.promptTotalUsage}% (目标 ≤6500字)`);
      }
      if (stats.promptUtilization !== undefined && stats.promptEnglishWordUsage === undefined) {
        lines.push(`- **Prompt利用率**: ${stats.promptUtilization}%`);
      }
    }
    lines.push('');

    // PRD摘要
    if (prd) {
      lines.push('## PRD摘要');
      lines.push('');
      lines.push(`- **标题**: ${prd.title || '未指定'}`);
      lines.push(`- **风格**: ${prd.style || '未指定'}`);
      lines.push(`- **目标时长**: ${prd.targetDuration || '未指定'}`);
      lines.push(`- **目标受众**: ${prd.targetAudience || '未指定'}`);
      if (prd.summary) {
        lines.push('');
        lines.push(`> ${prd.summary}`);
      }
      lines.push('');
    }

    // 检查清单
    if (checklist) {
      lines.push('## 预生产检查清单');
      lines.push('');
      const summary = checklist.summary || {};
      lines.push(`- **通过**: ${summary.passed || 0} / **总计**: ${summary.total || 0}`);
      lines.push(`- **阻断项**: ${summary.blockers || 0}`);
      lines.push(`- **警告项**: ${summary.warnings || 0}`);
      lines.push('');

      if (checklist.items && checklist.items.length > 0) {
        lines.push('### 检查项详情');
        lines.push('');
        for (const item of checklist.items) {
          const icon = item.status === 'pass' ? '✅' : item.status === 'block' ? '🔴' : '⚠️';
          lines.push(`- ${icon} **${item.name || item.category}**: ${item.message || item.detail || ''}`);
        }
        lines.push('');
      }
    }

    // 角色信息
    if (characters && characters.length > 0) {
      lines.push('## 角色信息');
      lines.push('');
      for (const c of characters) {
        lines.push(`### ${c.name || '未命名'}`);
        lines.push(`- **物种**: ${c.species || '未知'}`);
        lines.push(`- **特征**: ${c.features || '未指定'}`);
        if (c.signature) lines.push(`- **标志**: ${c.signature}`);
        if (c.refPhotos && c.refPhotos.length > 0) {
          lines.push(`- **参考图**: ${c.refPhotos.length} 张`);
        }
        lines.push('');
      }
    }

    // 镜头详情
    if (shots && shots.length > 0) {
      lines.push('## 镜头详情');
      lines.push('');
      for (const shot of shots) {
        lines.push(`### ${shot.id || ''} - ${shot.title || '未命名'}`);
        lines.push('');
        lines.push(`- **时长**: ${shot.duration || 0}s | **类型**: ${shot.type || 'action'}`);
        if (shot.camera) lines.push(`- **运镜**: ${shot.camera}`);
        if (shot.emotion) lines.push(`- **情绪**: ${shot.emotion}`);
        if (shot.description) lines.push(`- **描述**: ${shot.description}`);
        if (shot.characters && shot.characters.length > 0) {
          lines.push(`- **角色**: ${shot.characters.join(', ')}`);
        }
        lines.push(`- **Prompt长度**: ${shot.promptLength || 0} 字符`);
        // v1.3-Peng: 三维利用率
        if (shot.promptEnglishWordUsage !== undefined) {
          lines.push(`  - 英文词: ${shot.promptEnglishWords || 0}词 (${shot.promptEnglishWordUsage || 0}%) | 中文台词: ${shot.promptChineseDialogueChars || 0}字 (${shot.promptChineseUsage || 0}%) | 总字符: ${shot.promptTotalUsage || 0}%)`);
        } else if (shot.promptUtilization !== undefined) {
          lines.push(`  - 利用率: ${shot.promptUtilization}%`);
        }
        lines.push('');

        // Prompt内容
        if (shot.prompt) {
          lines.push('<details>');
          lines.push('<summary>📝 完整Prompt</summary>');
          lines.push('');
          lines.push('```');
          lines.push(shot.prompt);
          lines.push('```');
          lines.push('');
          lines.push('</details>');
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  _saveToFile(markdown, productionDir, docTitle) {
    const reportsDir = path.join(productionDir, '99-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `pre-production-review-${Date.now()}.md`;
    const filePath = path.join(reportsDir, filename);
    fs.writeFileSync(filePath, markdown, 'utf8');
    return filePath;
  }
}

module.exports = { FeishuDocGenerator };
