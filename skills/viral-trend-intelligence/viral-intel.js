#!/usr/bin/env node
/**
 * ViralTrendIntel — 爆款情报技能核心模块
 * v1.0.0
 *
 * 在剧本创作之前抓取趋势情报，生成爆款洞察简报
 * 依赖: Python 3.10+ with scrapling, httpx, lxml
 *   pip install scrapling httpx lxml
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ViralTrendIntel {
  constructor(options = {}) {
    this.pythonBin = options.pythonBin || 'python3';
    this.llmCaller = options.llmCaller; // 外部注入 LLM Caller
  }

  /**
   * 生成爆款情报简报
   * @param {Object} userInput - { title, outline, duration, language }
   * @returns {Promise<Object>} ViralBrief
   */
  async generate(userInput) {
    const query = userInput.title || userInput.outline || '短视频';
    console.log(`\n📡 正在抓取爆款情报: "${query}"`);

    // Step 1: 并行爬取多平台热搜
    const rawTrends = await this._fetchTrends(query);

    // Step 2: LLM 分析融合
    const brief = await this._analyzeWithLLM(query, userInput, rawTrends);

    // Step 3: 注入剧本优化建议
    this._injectStoryAdvice(brief, userInput);

    return brief;
  }

  /**
   * 并行爬取多平台热搜
   * 使用 Python scrapling 脚本
   */
  async _fetchTrends(query) {
    const scriptPath = path.join(__dirname, 'trend_crawler.py');
    if (!fs.existsSync(scriptPath)) {
      console.warn('⚠️  trend_crawler.py 不存在，跳过实际爬取');
      return this._mockTrends(query);
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonBin, [scriptPath, query], {
        cwd: __dirname,
        timeout: 30000
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', d => stdout += d.toString());
      proc.stderr.on('data', d => stderr += d.toString());

      proc.on('close', code => {
        if (code !== 0) {
          console.warn(`⚠️  爬虫退出码 ${code}: ${stderr.substring(0, 100)}`);
          resolve(this._mockTrends(query));
          return;
        }
        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch {
          resolve(this._mockTrends(query));
        }
      });

      proc.on('error', () => resolve(this._mockTrends(query)));

      // 30秒超时
      setTimeout(() => {
        proc.kill();
        resolve(this._mockTrends(query));
      }, 30000);
    });
  }

  /**
   * 模拟趋势数据（爬虫不可用时的降级）
   */
  _mockTrends(query) {
    const q = query.toLowerCase();
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const mockPlatforms = {
      weibo: [
        '夏季清凉特惠 限时折扣',
        '职场人健康指南',
        '周末去哪玩 推荐',
        '618购物节 红包攻略',
        '新能源车补贴政策'
      ],
      zhihu: [
        '有哪些不起眼但很赚钱的副业',
        '为什么年轻人开始爱上露营',
        'AI对就业的影响有多大',
        '618该不该囤货',
        '如何避免职场内耗'
      ],
      toutiao: [
        '高温天气 注意事项',
        '夏季防晒产品热销',
        '毕业季 租房指南',
        '新能源板块再度爆发',
        '短视频创作技巧分享'
      ],
      tiktok_trending: [
        '#summer vibe #',
        '#life hack #',
        '#AI tools #',
        '#side hustle #',
        '#weekend plans #'
      ]
    };

    console.log('📊 使用模拟数据（Python爬虫未安装，使用离线情报）');
    return mockPlatforms;
  }

  /**
   * LLM 分析融合 — 将原始趋势 + 用户需求 → 结构化情报简报
   */
  async _analyzeWithLLM(query, userInput, rawTrends) {
    // 如果没有注入 LLM Caller，使用内置简单分析
    if (!this.llmCaller) {
      return this._ruleBasedAnalysis(query, userInput, rawTrends);
    }

    const prompt = this._buildAnalysisPrompt(query, userInput, rawTrends);
    try {
      const result = await this.llmCaller(prompt);
      return typeof result === 'string' ? JSON.parse(result) : result;
    } catch {
      return this._ruleBasedAnalysis(query, userInput, rawTrends);
    }
  }

  _buildAnalysisPrompt(query, userInput, rawTrends) {
    return `你是一个专业的短视频爆款分析师。用户想制作一个${userInput.duration || 60}秒的视频，主题是"${query}"。

以下是各平台当前热搜/趋势：
${JSON.stringify(rawTrends, null, 2)}

请分析并输出以下JSON格式（只输出JSON，不要其他文字）：

{
  "version": "1.0.0",
  "user_query": "${query}",
  "generated_at": "${new Date().toISOString()}",
  "trends": ${JSON.stringify(rawTrends)},
  "insights": [
    {
      "keyword": "热搜关键词",
      "relevance": 0-100,
      "platform": "平台名",
      "angle": "如何结合这个热点做内容"
    }
  ],
  "sentiment": "positive|neutral|negative",
  "viral_angles": ["爆款角度1", "爆款角度2", "爆款角度3"],
  "title_style": "疑问句|感叹句|数字列点|情绪共鸣",
  "best_timing": "最佳发布时机",
  "story_injection": {
    "recommended_themes": ["建议注入的主题词1", "2"],
    "forbidden_topics": ["政治", "宗教"],
    "emotional_hook": "情绪钩子：开头如何抓住观众",
    "hashtags": ["#标签1", "#标签2", "#标签3"]
  }
}

要求：
- insights 至少3条，按 relevance 降序
- relevance 低于60的不列出
- forbidden_topics 必须包含"政治"和"宗教"
- viral_angles 要具体可操作，不要泛泛而谈`;
  }

  /**
   * 规则降级分析（无 LLM 时的兜底）
   */
  _ruleBasedAnalysis(query, userInput, rawTrends) {
    const q = query.toLowerCase();
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // 简单关键词匹配
    const keywords = {
      '咖啡': ['618', '下午茶', '职场', '小资生活', '消费升级'],
      '汽车': ['新能源', '智能驾驶', '油价', '购车优惠'],
      '美食': ['夏季', '夜宵', '探店', '食谱', '省钱'],
      '科技': ['AI', '新品发布', '数码', '智能家居'],
      '职场': ['职场', '副业', '内卷', '加薪', '跳槽'],
      '健康': ['养生', '运动', '减肥', '体检', '睡眠']
    };

    let matched = [];
    for (const [cat, kws] of Object.entries(keywords)) {
      if (q.includes(cat)) {
        matched.push(...kws);
      }
    }

    if (matched.length === 0) {
      matched = ['热点', '趋势', '话题', '热门', '爆款'];
    }

    // 找最相关的热搜词
    const allHot = [
      ...(rawTrends.weibo || []),
      ...(rawTrends.zhihu || []),
      ...(rawTrends.toutiao || [])
    ];

    const insights = matched.slice(0, 4).map(kw => ({
      keyword: kw,
      relevance: Math.floor(Math.random() * 20) + 75,
      platform: '综合',
      angle: `从"${kw}"角度切入，结合用户主题"${query}"，可以引发共鸣`
    }));

    // 判断情感
    const negativeWords = ['内卷', '焦虑', '躺平', '翻车', '翻车', '踩雷', '失望'];
    const sentiment = negativeWords.some(w => q.includes(w)) ? 'negative' : 'neutral';

    // 时机
    let timing = '工作日午间（12:00-13:00）';
    if (day === 0 || day === 6) {
      timing = '周末晚间（20:00-22:00）';
    } else if (hour >= 18 || hour < 9) {
      timing = '通勤时段（早7-9点，晚18-20点）';
    }

    return {
      version: '1.0.0',
      user_query: query,
      generated_at: new Date().toISOString(),
      trends: rawTrends,
      insights,
      sentiment,
      viral_angles: [
        `反差对比：${query} vs 常规做法`,
        `实用教程：3步搞定${query}`,
        `情感共鸣：戳中目标人群痛点`
      ],
      title_style: ['疑问句', '感叹句'][Math.floor(Math.random() * 2)],
      best_timing: timing,
      story_injection: {
        recommended_themes: [...new Set(matched.slice(0, 5))],
        forbidden_topics: ['政治', '宗教', '竞品攻击'],
        emotional_hook: '开头3秒抛出痛点问题，引发共鸣继续看',
        hashtags: [
          `#${query.slice(0, 4)}`,
          '#爆款短视频',
          '#AI创作',
          '#干货分享'
        ].slice(0, 4)
      }
    };
  }

  /**
   * 将情报注入用户输入，供后续剧本创作使用
   */
  _injectStoryAdvice(brief, userInput) {
    // 在 userInput 上挂载情报（Pipeline 会读取）
    userInput._viralBrief = brief;
    userInput._viralAngles = brief.viral_angles;
    userInput._recommendedThemes = brief.story_injection?.recommended_themes || [];
    userInput._forbiddenTopics = brief.story_injection?.forbidden_topics || ['政治', '宗教'];
    userInput._emotionalHook = brief.story_injection?.emotional_hook;
    userInput._hashtags = brief.story_injection?.hashtags || [];
    userInput._titleStyle = brief.title_style;
    userInput._bestTiming = brief.best_timing;
  }
}

module.exports = { ViralTrendIntel };
