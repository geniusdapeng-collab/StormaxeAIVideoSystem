#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT内容工作流模块 V2.1
核心理念：先理解内容，再选表达方式
V2.1新增：精确的配图位置和大小控制

工作流：
1. 内容理解 → 2. 结构化 → 3. 表达决策 → 4. 内容制作（含排版+配图）→ 5. 质量检查

④ 内容制作 包含：
  ④.1 文字内容制作
  ④.2 排版布局（精确到网格）
  ④.3 配图决策（位置+大小+风格）
"""

import subprocess
import json
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


# ══════════════════════════════════════════════════════════════
# 枚举定义
# ══════════════════════════════════════════════════════════════

class ChartType(Enum):
    """图表类型枚举"""
    NONE = "none"
    RADAR = "radar"
    FUNNEL = "funnel"
    GAUGE = "gauge"
    COMBO = "combo"
    STACKED = "stacked"
    GANTT = "gantt"
    HEATMAP = "heatmap"
    MATRIX = "matrix"
    PYRAMID = "pyramid"
    LINE = "line"
    BAR = "bar"


class LayoutType(Enum):
    """布局类型枚举"""
    TITLE = "title"
    BIG_NUMBER = "big_number"
    TWO_COLUMNS = "two_columns"
    CONTENT_CARDS = "content_cards"
    QUOTE = "quote"
    TIMELINE = "timeline"
    CLOSING = "closing"
    CHART = "chart"


class ImageStyle(Enum):
    """AI生图风格"""
    MODERN = "modern"           # 现代科技感
    MINIMALIST = "minimalist"   # 极简风格
    PROFESSIONAL = "professional"  # 专业商务
    CREATIVE = "creative"       # 创意插画
    ABSTRACT = "abstract"       # 抽象艺术


class ImagePosition(Enum):
    """配图位置枚举"""
    BACKGROUND = "background"    # 全屏背景
    LEFT = "left"               # 左侧（40%宽度）
    RIGHT = "right"             # 右侧（40%宽度）
    TOP_RIGHT = "top_right"      # 右上角装饰
    BOTTOM_RIGHT = "bottom_right"  # 右下角装饰
    HEADER = "header"            # 顶部横条
    WIDE_BANNER = "wide_banner"  # 宽横幅（顶部）


class ImageSize(Enum):
    """配图尺寸枚举"""
    FULL = "full"               # 全屏/全背景
    LARGE = "large"             # 40%页面宽度
    MEDIUM = "medium"           # 30%页面宽度
    SMALL = "small"             # 20%页面宽度（装饰）
    TINY = "tiny"               # 角落装饰


# ══════════════════════════════════════════════════════════════
# 数据类定义
# ══════════════════════════════════════════════════════════════

@dataclass
class PageAnalysis:
    """单页内容分析"""
    page_num: int
    core_message: str
    target_audience: str
    key_data: List[str] = field(default_factory=list)
    relationships: List[str] = field(default_factory=list)
    recommended_chart: ChartType = ChartType.NONE
    recommended_layout: LayoutType = LayoutType.CONTENT_CARDS
    reasoning: str = ""


@dataclass
class ImageConfig:
    """配图配置"""
    need_image: bool = False
    prompt: str = ""
    style: ImageStyle = ImageStyle.PROFESSIONAL
    position: str = "right"     # background/left/right/top_right/bottom_right/header/wide_banner
    size: str = "large"         # full/large/medium/small/tiny
    opacity: float = 1.0
    add_overlay: bool = False


# ══════════════════════════════════════════════════════════════
# 配图策略表
# ══════════════════════════════════════════════════════════════

# 页面类型 -> 默认配图策略
PAGE_IMAGE_STRATEGY = {
    LayoutType.TITLE.value: {
        "need": True,
        "position": "background",
        "size": "full",
        "style": ImageStyle.MODERN,
        "add_overlay": True,
        "desc": "封面：全屏背景+遮罩"
    },
    LayoutType.CLOSING.value: {
        "need": True,
        "position": "background",
        "size": "full",
        "style": ImageStyle.MINIMALIST,
        "add_overlay": True,
        "desc": "结尾：全屏背景+遮罩"
    },
    LayoutType.BIG_NUMBER.value: {
        "need": True,
        "position": "right",
        "size": "large",
        "style": ImageStyle.ABSTRACT,
        "add_overlay": False,
        "desc": "大数据页：右侧装饰图"
    },
    LayoutType.TWO_COLUMNS.value: {
        "need": True,
        "position": "right",
        "size": "medium",
        "style": ImageStyle.CREATIVE,
        "add_overlay": False,
        "desc": "双栏页：右侧装饰图"
    },
    LayoutType.CONTENT_CARDS.value: {
        "need": True,
        "position": "top_right",
        "size": "small",
        "style": ImageStyle.ABSTRACT,
        "add_overlay": False,
        "desc": "卡片页：右上角小装饰"
    },
    LayoutType.CHART.value: {
        "need": True,
        "position": "bottom_right",
        "size": "tiny",
        "style": ImageStyle.ABSTRACT,
        "add_overlay": False,
        "desc": "图表页：右下角装饰（不抢图表风头）"
    },
    LayoutType.QUOTE.value: {
        "need": True,
        "position": "left",
        "size": "medium",
        "style": ImageStyle.CREATIVE,
        "add_overlay": False,
        "desc": "引用页：左侧装饰图"
    },
    LayoutType.TIMELINE.value: {
        "need": True,
        "position": "right",
        "size": "small",
        "style": ImageStyle.ABSTRACT,
        "add_overlay": False,
        "desc": "时间线：右侧装饰"
    },
}


# ══════════════════════════════════════════════════════════════
# 配图决策函数
# ══════════════════════════════════════════════════════════════

def decide_image_config(page_type: str, page_title: str, topic: str) -> ImageConfig:
    """
    决策页面配图配置
    
    Args:
        page_type: 页面类型 (LayoutType.value)
        page_title: 页面标题
        topic: PPT主题
    
    Returns:
        ImageConfig: 配图配置
    """
    # 获取页面类型的默认策略
    strategy = PAGE_IMAGE_STRATEGY.get(page_type, {})
    
    # 如果页面类型没有配图策略，则不配图
    if not strategy.get("need", False):
        return ImageConfig(need_image=False)
    
    # 构建配图提示词
    style = strategy.get("style", ImageStyle.PROFESSIONAL)
    position = strategy.get("position", "right")
    prompt = build_image_prompt(topic, page_title, style.value, position)
    
    return ImageConfig(
        need_image=True,
        prompt=prompt,
        style=style,
        position=position,
        size=strategy.get("size", "large"),
        opacity=0.8 if strategy.get("add_overlay", False) else 1.0,
        add_overlay=strategy.get("add_overlay", False)
    )


def build_image_prompt(topic: str, page_title: str, style: str, position: str) -> str:
    """
    构建AI生图提示词
    
    Args:
        topic: PPT主题
        page_title: 页面标题
        style: 风格 (modern/minimalist/professional/creative/abstract)
        position: 位置 (background/left/right/top_right/etc)
    
    Returns:
        生成的图片提示词
    """
    # 风格描述
    style_map = {
        "modern": "modern futuristic tech style, sleek lines, professional, inspiring, geometric patterns",
        "minimalist": "minimalist design, clean, white space, elegant, subtle, zen",
        "professional": "professional business style, corporate, clean, trustworthy",
        "creative": "creative illustration, modern flat design, colorful, engaging, playful",
        "abstract": "abstract geometric art, modern patterns, decorative, subtle, clean shapes"
    }
    style_desc = style_map.get(style, style_map["professional"])
    
    # 位置描述（影响构图）
    position_map = {
        "background": "wide landscape composition, subtle center focus, suitable for full background",
        "left": "left side composition, vertical elements on left, clean right side for overlay",
        "right": "right side composition, visual anchor on right, clear left area for text",
        "top_right": "corner detail, compact composition, works as accent, upper right",
        "bottom_right": "bottom corner accent, subtle, grounding element, lower right",
        "header": "wide horizontal banner, landscape, fits top section",
        "wide_banner": "ultra-wide panoramic, landscape orientation, subtle gradient"
    }
    position_desc = position_map.get(position, "")
    
    # 构建完整提示词
    prompt = f"{page_title} concept illustration, {topic}, {style_desc}, {position_desc}, high quality, 4K, no text, no watermark, no people"
    
    return prompt


# ══════════════════════════════════════════════════════════════
# PPT工作流类
# ══════════════════════════════════════════════════════════════

@dataclass
class PPTWorkflow:
    """PPT工作流"""
    topic: str
    purpose: str
    audience: str
    
    pages_analysis: List[PageAnalysis] = field(default_factory=list)
    total_pages: int = 0
    structure_decided: bool = False
    
    # 生成的图片列表
    generated_images: Dict[int, str] = field(default_factory=dict)  # page_num -> image_path
    
    # 配图配置
    page_image_configs: Dict[int, ImageConfig] = field(default_factory=dict)


# ══════════════════════════════════════════════════════════════
# AI生图函数
# ══════════════════════════════════════════════════════════════

def generate_image(prompt: str, ratio: str = "16:9", output_dir: str = "/tmp/ppt-images") -> Optional[str]:
    """
    使用AI生成图片
    
    Args:
        prompt: 图片描述
        ratio: 宽高比（16:9适合PPT横版）
        output_dir: 输出目录
    
    Returns:
        图片路径，失败返回None
    """
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"img_{abs(hash(prompt))}.png")
    
    # 如果图片已存在，直接返回
    if os.path.exists(output_file):
        return output_file
    
    try:
        result = subprocess.run(
            [
                "miaoda-studio-cli", "text-to-image",
                "--prompt", prompt,
                "--ratio", ratio,
                "--output", "json"
            ],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                if "url" in data:
                    img_url = data["url"]
                    subprocess.run(
                        ["curl", "-s", "-o", output_file, img_url],
                        timeout=30
                    )
                    if os.path.exists(output_file):
                        return output_file
            except:
                pass
        
        print(f"图片生成失败: {result.stderr}")
        return None
        
    except Exception as e:
        print(f"图片生成异常: {e}")
        return None


def decide_image_for_page(analysis: PageAnalysis, topic: str) -> tuple:
    """
    判断页面是否需要配图，并生成提示词
    
    Returns:
        (need_image, prompt, style, position)
    """
    page_title = analysis.core_message
    page_type = analysis.recommended_layout
    
    # 封面页 - 需要配图
    if page_type == LayoutType.TITLE:
        return (True, f"cover for {topic}, professional business style, modern, inspiring", 
                "modern", "background")
    
    # 结尾页 - 可以配图
    if page_type == LayoutType.CLOSING:
        return (True, f"conclusion visual for {topic}, professional, clean, inspiring", 
                "minimalist", "background")
    
    # 图表页 - 可以配装饰图
    if analysis.recommended_chart != ChartType.NONE:
        return (True, f"abstract data visualization art, modern tech style, subtle background", 
                "abstract", "bottom_right")
    
    # 内容页 - 根据关键词判断
    keywords_for_image = [
        "理念", "愿景", "价值观", "战略", "架构", "体系",
        "设计", "模式", "方法", "流程", "机制", "核心"
    ]
    
    if any(kw in page_title for kw in keywords_for_image):
        return (True, f"concept illustration for {page_title}, modern professional style", 
                "creative", "top_right")
    
    # 默认不需要配图
    return (False, "", "professional", "right")


def generate_page_image(page_num: int, topic: str, analysis: PageAnalysis, 
                       output_dir: str = "/tmp/ppt-images") -> Optional[str]:
    """
    为单个页面生成AI配图
    
    Args:
        page_num: 页码
        topic: PPT主题
        analysis: 页面分析结果
        output_dir: 输出目录
    
    Returns:
        图片路径
    """
    need_image, prompt, style, position = decide_image_for_page(analysis, topic)
    
    if not need_image:
        return None
    
    # 根据位置确定比例
    ratio = "16:9" if position == "background" else "3:2"
    
    # 生成图片
    image_path = generate_image(prompt, ratio, output_dir)
    
    if image_path:
        print(f"  🖼️ 页面{page_num}配图生成成功")
        return image_path
    else:
        print(f"  ⚠️ 页面{page_num}配图生成失败，跳过")
        return None


# ══════════════════════════════════════════════════════════════
# 内容分析函数
# ══════════════════════════════════════════════════════════════

def analyze_content(content: Dict[str, Any], topic: str = "", purpose: str = "", 
                   audience: str = "") -> List[PageAnalysis]:
    """分析内容，返回页面分析结果"""
    pages = []
    
    for i, section in enumerate(content.get('sections', [])):
        section_title = section.get('title', '')
        
        analysis = PageAnalysis(
            page_num=i + 1,
            core_message=section_title,
            target_audience=audience
        )
        
        # 提取关键数据
        for item in section.get('content', []):
            if isinstance(item, dict):
                if 'value' in item or 'score' in item:
                    analysis.key_data.append(str(item))
        
        # 决定图表类型
        chart_type, layout_type, reasoning = _decide_expression(
            section_title, section.get('content', [])
        )
        analysis.recommended_chart = chart_type
        analysis.recommended_layout = layout_type
        analysis.reasoning = reasoning
        
        pages.append(analysis)
    
    return pages


def _decide_expression(title: str, content: List[Any]) -> tuple:
    """根据内容决定表达方式"""
    title_lower = title.lower()
    
    has_comparison = any(word in title_lower for word in ['对比', 'vs', '比较', '差异'])
    has_progression = any(word in title_lower for word in ['转化', '漏斗', '递进', '层层', '阶段'])
    has_multi_dim = any(word in title_lower for word in ['维度', '评估', '能力', '分析'])
    has_hierarchy = any(word in title_lower for word in ['层级', '结构', '体系', '模块', '规范'])
    has_single_kpi = any(word in title_lower for word in ['评分', '达成', '完成率', '占比'])
    has_trend = any(word in title_lower for word in ['趋势', '增长', '变化', '历史'])
    
    if has_multi_dim:
        return (ChartType.RADAR, LayoutType.CHART, "多维度评估，雷达图适合")
    if has_progression:
        return (ChartType.FUNNEL, LayoutType.CHART, "递进关系，漏斗图清晰")
    if has_single_kpi:
        return (ChartType.GAUGE, LayoutType.CHART, "单一KPI，仪表盘直观")
    if has_comparison and has_trend:
        return (ChartType.COMBO, LayoutType.CHART, "对比+趋势，组合图")
    if has_comparison:
        return (ChartType.NONE, LayoutType.TWO_COLUMNS, "对比关系，双栏对比")
    if has_hierarchy:
        return (ChartType.NONE, LayoutType.CONTENT_CARDS, "并列模块，卡片更清晰")
    
    return (ChartType.NONE, LayoutType.CONTENT_CARDS, "内容优先，不用图表")


def quality_check(pages: List[PageAnalysis], total_pages: int) -> List[str]:
    """质量检查"""
    issues = []
    
    # 图表使用率
    chart_count = sum(1 for p in pages if p.recommended_chart != ChartType.NONE)
    chart_rate = chart_count / len(pages) * 100 if pages else 0
    
    if chart_rate > 30:
        issues.append(f"⚠️ 图表使用率{chart_rate:.0f}%偏高，建议≤30%")
    else:
        issues.append(f"✅ 图表使用率{chart_rate:.0f}%，符合标准")
    
    # 连续图表
    consecutive = 0
    max_consecutive = 0
    for p in pages:
        if p.recommended_chart != ChartType.NONE:
            consecutive += 1
            max_consecutive = max(max_consecutive, consecutive)
        else:
            consecutive = 0
    
    if max_consecutive > 3:
        issues.append(f"⚠️ 连续{max_consecutive}页图表，建议≤3页")
    else:
        issues.append(f"✅ 连续图表最多{max_consecutive}页，符合标准")
    
    return issues


# 使用示例
if __name__ == "__main__":
    # 测试AI生图
    test_prompt = "futuristic technology concept, data flow, modern professional style"
    print(f"测试AI生图...")
    result = generate_image(test_prompt, "16:9")
    print(f"结果: {result}")
