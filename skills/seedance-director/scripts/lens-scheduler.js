/**
 * LensScheduler — 镜头调度器 V1.0
 * 根据镜头自然时长智能分配提交计划
 * 
 * 核心规则：
 * - 镜头 ≤12 秒 → 独立提交（duration=镜头自然时长）
 * - 镜头 >12 秒 → 拆成首帧 + 尾帧连续提交
 * - 相邻短镜头 → 合并成 1 次提交（总时长≤12 秒，最多 3 个）
 */

const MAX_SUBMISSION_DURATION = 12; // 官方 API 限制
const MAX_MERGED_SHOTS = 3;         // 最多合并 3 个短镜头

class LensScheduler {
  constructor() {
    this.submissions = [];
    this.currentBatch = [];
    this.currentDuration = 0;
    this.lastFrameImage = null; // 上一镜头的尾帧路径
  }

  /**
   * 调度所有镜头
   * @param {Array} shots - story-engine 生成的镜头列表，每个镜头有 naturalDuration
   * @returns {Object} 调度结果
   */
  schedule(shots) {
    this.submissions = [];
    this.currentBatch = [];
    this.currentDuration = 0;
    this.lastFrameImage = null;

    for (const shot of shots) {
      const naturalDuration = shot.naturalDuration || 11; // 默认 11 秒

      if (naturalDuration <= MAX_SUBMISSION_DURATION) {
        // 情况 1: 镜头≤12 秒，尝试合并
        this._tryMerge(shot, naturalDuration);
      } else {
        // 情况 2: 镜头>12 秒，需要拆分
        this._submitCurrentBatch(); // 先提交当前批次
        this._handleLongShot(shot, naturalDuration);
      }
    }

    // 提交剩余批次
    this._submitCurrentBatch();

    return {
      submissions: this.submissions,
      totalSubmissions: this.submissions.length,
      totalShots: shots.length,
      estimatedQuotaUsage: this.submissions.length // 每次提交消耗 1 个配额
    };
  }

  /**
   * 尝试合并到当前批次
   */
  _tryMerge(shot, duration) {
    if (
      this.currentDuration + duration <= MAX_SUBMISSION_DURATION &&
      this.currentBatch.length < MAX_MERGED_SHOTS
    ) {
      // 可以合并
      this.currentBatch.push(shot);
      this.currentDuration += duration;
    } else {
      // 提交当前批次，开始新批次
      this._submitCurrentBatch();
      this.currentBatch = [shot];
      this.currentDuration = duration;
    }
  }

  /**
   * 处理长镜头（>12 秒）
   */
  _handleLongShot(shot, naturalDuration) {
    const numParts = Math.ceil(naturalDuration / MAX_SUBMISSION_DURATION);
    const partDuration = naturalDuration / numParts;

    for (let i = 0; i < numParts; i++) {
      const partShot = {
        ...shot,
        id: `${shot.id}_part${i + 1}`,
        naturalDuration: partDuration,
        isSplitPart: true,
        splitIndex: i,
        totalSplitParts: numParts
      };

      let submissionType = "split_middle";
      if (i === 0) {
        submissionType = "split_first";
      } else if (i === numParts - 1) {
        submissionType = "split_last";
      }

      const submission = this._createSubmission([partShot], submissionType);
      
      // 如果是中间或最后一部分，使用尾帧衔接
      if (i > 0) {
        submission.isFirstFrameVideo = false; // 图生视频
        submission.lastFrameImage = this.lastFrameImage;
      }

      this.submissions.push(submission);

      // 更新 lastFrameImage（用于下一镜头）
      if (i === numParts - 1) {
        this.lastFrameImage = `path/to/${partShot.id}_last_frame.png`;
      }
    }
  }

  /**
   * 提交当前批次
   */
  _submitCurrentBatch() {
    if (this.currentBatch.length === 0) return;

    let type = "single";
    if (this.currentBatch.length > 1) {
      type = "merged";
    }

    const submission = this._createSubmission(this.currentBatch, type);

    // 如果不是第一个批次，使用尾帧衔接
    if (this.lastFrameImage && this.submissions.length > 0) {
      submission.isFirstFrameVideo = false;
      submission.lastFrameImage = this.lastFrameImage;
    }

    this.submissions.push(submission);
    this.currentBatch = [];
    this.currentDuration = 0;
  }

  /**
   * 创建提交对象
   */
  _createSubmission(shots, type) {
    const totalDuration = shots.reduce((sum, s) => sum + (s.naturalDuration || 11), 0);
    
    return {
      submissionId: `SUB${String(this.submissions.length + 1).padStart(3, '0')}`,
      shots: shots.map(s => s.id),
      shotDetails: shots,
      totalDuration: Math.round(totalDuration * 10) / 10, // 保留 1 位小数
      type: type, // single/merged/split_first/split_middle/split_last
      isFirstFrameVideo: type === "single" || type === "merged" || type === "split_first",
      isLastFrameVideo: type === "split_last",
      lastFrameImage: null,
      promptTemplate: this._generatePromptTemplate(shots, type),
      notes: this._generateNotes(shots, type)
    };
  }

  /**
   * 生成提示词模板
   */
  _generatePromptTemplate(shots, type) {
    if (type === "merged") {
      return `${shots[0].description}, 过渡到 ${shots[1].description}`;
    } else if (type.startsWith("split")) {
      return `${shots[0].description} (continuation of previous shot)`;
    }
    return shots[0].description;
  }

  /**
   * 生成备注说明
   */
  _generateNotes(shots, type) {
    const notes = [];
    
    if (type === "merged") {
      notes.push(`合并 ${shots.length} 个镜头`);
      notes.push(`总时长：${shots.reduce((a, b) => a + b.naturalDuration, 0)}秒`);
      notes.push("注意：需在提示词中描述镜头间过渡");
    } else if (type.startsWith("split")) {
      notes.push(`拆分镜头 ${shots[0].id.split('_')[0]}`);
      notes.push(`第 ${shots[0].splitIndex + 1}/${shots[0].totalSplitParts} 部分`);
      notes.push(`单段时长：${Math.round(shots[0].naturalDuration * 10) / 10}秒`);
      if (shots[0].splitIndex > 0) {
        notes.push("⚠️ 使用尾帧衔接（图生视频模式）");
      }
    }

    return notes.join(" | ");
  }
}

module.exports = LensScheduler;
