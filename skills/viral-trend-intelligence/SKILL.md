---
name: viral-trend-intelligence
license: MIT
description: |
  爆款情报技能。当用户提出视频制作需求后，在剧本创作之前激活。
  调用 Scrapling 爬虫框架抓取与需求相关的热点趋势、流行话题、时事新闻，
  生成《爆款情报简报》，为剧本创作提供方向性洞察，让视频自带爆款基因。
  触发词：制作视频、创作内容、拍短视频、热点、趋势、爆款。
compatibility: Requires Python 3.10+, pip install scrapling, Node.js 22+
metadata:
  author: geniusdapeng
  version: "1.0.0"
  status: "beta"
  releaseDate: "2026-06-10"
  changelog: "v1.0.0: 初始版本，基于 Scrapling 爬虫框架 + LLM 情报分析"
  category: ai/video-production
---

# Viral Trend Intelligence — 爆款情报技能 v1.0.0

## 一句话

**需求来了，先抓情报，再写剧本。让视频踩在热点上。**

## 核心原理

爆款视频 = 好内容 × 时机 × 趋势。

大多数 AI 视频工具只管"内容质量"，忽略了**时机和趋势**——同一句话主题，早三天发和晚三天发，流量可能差 10 倍。

本技能在剧本创作**之前**，先抓取与用户需求相关的趋势数据，生成结构化情报简报，供 Story Engine 注入爆款基因。

## 工作流程

```
用户需求输入
     ↓
[需求关键词提取]
     ↓
[Scrapling 并行爬取]
  ├── 微博/抖音热搜榜
  ├── 知乎热榜
  ├── 百度指数 / Google Trends
  ├── 今日头条热点
  └── Reddit/ Twitter 趋势 (英文主题)
     ↓
[LLM 情报融合]
  ├── 提取核心热点词
  ├── 关联度评分 (0-100)
  ├── 情感极性判断
  └── 爆款角度建议
     ↓
[爆款情报简报]
  └── 交由 Story Engine 注入剧本
```

## 技术实现

### 依赖安装

```bash
pip install scrapling httpx lxml
```

### 爬虫核心 (基于 Scrapling)

```python
from scrapling.fetchers import Fetcher
import asyncio, json

async def fetch_trending(keywords: list[str]) -> dict:
    """
    并行抓取多个平台热搜榜
    keywords: 用户需求中的核心关键词
    """
    urls = {
        'weibo': 'https://s.weibo.com/top/summary',
        'zhihu': 'https://www.zhihu.com/hot',
        'toutiao': 'https://www.toutiao.com/hot-event/hot-board',
    }

    results = {}

    async def fetch_one(platform: str, url: str):
        try:
            page = Fetcher.get(url, options={'stealth': True})
            # Scrapling 自动适配 CSS/XPath，网站改版后仍可追踪元素
            titles = page.search('.hot-title::text') or page.search('h2::text')
            results[platform] = [t.strip() for t in titles if t.strip()][:10]
        except Exception as e:
            results[platform] = [f'抓取失败: {e}']

    await asyncio.gather(*[fetch_one(k, v) for k, v in urls.items()])
    return results
```

### 情报分析 (LLM)

```python
def analyze_trends(user_query: str, raw_data: dict) -> dict:
    """
    将原始热搜数据 + 用户需求发给 LLM
    输出结构化爆款情报简报
    """
    prompt = f"""
    用户想制作视频，主题是：{user_query}

    以下是各平台最新热搜：
    {json.dumps(raw_data, ensure_ascii=False, indent=2)}

    请分析：
    1. 哪些热搜与用户主题高度相关？（关联度 0-100）
    2. 当前舆论情绪是正面/负面/中性？
    3. 最有可能爆的方向是什么？（给出 3 个具体角度）
    4. 建议的标题风格？（疑问句/感叹句/数字列点/情绪共鸣）
    5. 最佳发布时机？（工作日/周末/早晚高峰）

    输出 JSON 格式：
    {{
      "insights": [
        {{"keyword": "...", "relevance": 85, "platform": "微博", "angle": "..."}}
      ],
      "sentiment": "positive|neutral|negative",
      "viral_angles": ["角度1", "角度2", "角度3"],
      "title_style": "疑问句|感叹句|数字列点|情绪共鸣",
      "best_timing": "周末晚间|工作日午间|..."
    }}
    """
    # 调用 LLM 返回结果
    return llm_call(prompt, schema=...)
```

## 输出格式

### 爆款情报简报 (ViralBrief)

```json
{
  "version": "1.0.0",
  "user_query": "用戶原始需求",
  "generated_at": "2026-06-10T12:00:00+08:00",
  "trends": {
    "weibo": ["热搜词1", "热搜词2"],
    "zhihu": ["热榜问题1", "热榜问题2"],
    "toutiao": ["头条热点1", "头条热点2"]
  },
  "insights": [
    {
      "keyword": "618",
      "relevance": 92,
      "platform": "微博",
      "angle": "从'消费主义反叛'角度切入，比直接推产品更有话题性"
    },
    {
      "keyword": "反内卷",
      "relevance": 88,
      "platform": "知乎",
      "angle": "情绪共鸣型标题，戳中职场人痛点"
    }
  ],
  "sentiment": "negative",
  "viral_angles": [
    "躺平 vs 奋斗：反差叙事",
    "反消费主义：理性种草",
    "职场焦虑：情绪宣泄口"
  ],
  "title_style": "情绪共鸣",
  "best_timing": "周五晚间（情绪最敏感时期）",
  "story_injection": {
    "recommended_themes": ["躺平", "反内卷", "消费降级"],
    "forbidden_topics": ["政治", "宗教", "竞品攻击"],
    "emotional_hook": "愤怒/焦虑 -> 反转/释然",
    "hashtags": ["#反内卷", "#躺平", "#618翻车", "#职场真相"]
  }
}
```

## 与 Pipeline 的集成

在 `director-pipeline.js` Stage 1（需求理解）之后、Stage 2（剧本创作）之前插入：

```
Stage 1.5: Viral Intelligence
  输入: userInput (title, outline, duration, language)
  输出: ViralBrief (爆款情报简报)
  ↓ 注入
Stage 2: Story Engine
  剧本创作时自动参考 ViralBrief.viral_angles + story_injection
```

### 集成代码 (Stage 1.5)

```javascript
// director-pipeline.js 新增阶段
if (command === 'pre-production' || command === 'run') {
  // ... 现有 Stage 1 代码 ...

  // 🆕 v1.0.0: Stage 1.5 — 爆款情报
  if (!options._skipViralIntel) {
    const { ViralTrendIntel } = require('../viral-trend-intelligence/viral-intel');
    const viralIntel = new ViralTrendIntel();
    const viralBrief = await viralIntel.generate(userInput);
    console.log(`\n📊 爆款情报: 命中 ${viralBrief.insights.length} 个相关热点`);
    // 将 viralBrief 注入 pipeline context
    pipeline.options.viralBrief = viralBrief;
  }

  // 继续 Stage 2...
}
```

## 安全约束

- **隐私保护**: 爬取内容仅用于剧本创作，不存储/传播
- **反爬策略**: Scrapling stealth 模式自动绕过 Cloudflare 等防护
- **频率限制**: 单次任务最多抓 5 个平台，避免触发限流
- **内容过滤**: 自动过滤政治/色情/暴力相关热搜词

## 局限与免责

- 热搜数据来自公开页面，延迟 5-30 分钟
- 关联度分析基于 LLM 判断，不保证 100% 准确
- 爆款没有公式，本技能仅供参考，最终决策权在创作者
- 120 秒以上内容不适用，需使用中长视频系统

---

*Stormaxe AI — 让每一次创作，都踩在时代的脉搏上.*
