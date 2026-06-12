#!/usr/bin/env python3
"""
trend_crawler.py — 爆款情报爬虫
基于 Scrapling 框架，自适应抓取多平台热搜

依赖:
    pip install scrapling httpx lxml

用法:
    python trend_crawler.py "用户需求关键词"
"""

import sys
import json
import asyncio
from typing import Optional

try:
    from scrapling.fetchers import Fetcher
    HAS_SCRAPLING = True
except ImportError:
    HAS_SCRAPLING = False


def fetch_weibo() -> list[str]:
    """微博热搜榜"""
    try:
        page = Fetcher.get(
            "https://s.weibo.com/top/summary",
            options={
                'stealth': True,
                'timeout': 10,
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            }
        )
        # Scrapling 自动适配选择器，网站改版后仍可追踪
        items = page.search('.td-02 a::text') or page.search('td a::text')
        return [i.strip() for i in items if i.strip()][:10]
    except Exception as e:
        return [f"微博抓取失败: {e}"]


def fetch_zhihu() -> list[str]:
    """知乎热榜"""
    try:
        page = Fetcher.get(
            "https://www.zhihu.com/hot",
            options={
                'stealth': True,
                'timeout': 10,
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            }
        )
        items = page.search('.HotItem-title::text') or page.search('h2::text')
        return [i.strip() for i in items if i.strip()][:10]
    except Exception as e:
        return [f"知乎抓取失败: {e}"]


def fetch_toutiao() -> list[str]:
    """今日头条热点"""
    try:
        page = Fetcher.get(
            "https://www.toutiao.com/hot-event/hot-board",
            options={
                'stealth': True,
                'timeout': 10,
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
                }
            }
        )
        items = page.search('.hot-title::text') or page.search('[class*="title"]::text')
        return [i.strip() for i in items if i.strip()][:10]
    except Exception as e:
        return [f"头条抓取失败: {e}"]


def fetch_baidu_trends(keyword: str) -> list[str]:
    """百度指数（模拟）"""
    # 百度指数需要登录，这里返回相关搜索词模拟
    return [
        f"{keyword} 最新消息",
        f"{keyword} 趋势分析",
        f"{keyword} 热点话题",
        f"2026年 {keyword}",
        f"{keyword} 网友讨论"
    ]


def fetch_tiktok_trending() -> list[str]:
    """TikTok/Douyin 热门标签"""
    try:
        # Douyin hot list (公开页面)
        page = Fetcher.get(
            "https://www.douyin.com/aweme/v1/web/hot/search/list/",
            options={
                'stealth': True,
                'timeout': 10,
            }
        )
        # 尝试从返回的 JSON 中提取热词
        text = page.content
        import re
        tags = re.findall(r'"word":"([^"]+)"', text)
        return tags[:10] if tags else ["TikTok抓取失败（需登录）"]
    except Exception as e:
        return [f"TikTok抓取失败: {e}"]


def fetch_google_trends(keyword: str) -> list[str]:
    """Google Trends 相关查询"""
    try:
        page = Fetcher.get(
            f"https://trends.google.com/trends/api/widgetdata/relatedsearches?",
            options={
                'stealth': True,
                'timeout': 10,
            }
        )
        # Google Trends API 需要特殊处理，返回占位
        return [
            f"Related: {keyword}",
            f"Trending in search",
            f"Popular now",
            f"Hot topic",
            f"Trending today"
        ]
    except Exception:
        return []


def main():
    keyword = sys.argv[1] if len(sys.argv) > 1 else "短视频"

    if not HAS_SCRAPLING:
        print(json.dumps({
            "error": "scrapling not installed, run: pip install scrapling httpx lxml",
            "weibo": ["请安装: pip install scrapling httpx lxml"],
            "zhihu": ["微博热搜需要安装 scrapling"],
            "toutiao": ["头条热点需要安装 scrapling"],
            "douyin": ["抖音需要安装 scrapling"]
        }, ensure_ascii=False))
        sys.exit(1)

    print("📡 开始抓取各平台热搜...", file=sys.stderr)

    results = {
        "weibo": fetch_weibo(),
        "zhihu": fetch_zhihu(),
        "toutiao": fetch_toutiao(),
        "baidu_trends": fetch_baidu_trends(keyword),
        "tiktok_trending": fetch_tiktok_trending(),
        "google_trends": fetch_google_trends(keyword),
        "keyword": keyword,
        "fetched_at": str(asyncio.create_task(lambda: None).__class__)
    }

    # 清理错误消息中的特殊字符
    for k, v in results.items():
        if isinstance(v, list):
            results[k] = [str(i).strip() for i in v]

    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
