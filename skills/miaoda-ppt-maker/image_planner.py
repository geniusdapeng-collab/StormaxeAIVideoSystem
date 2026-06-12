#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI配图规划模块 - V2.0
为PPT智能生成相关性强的配图提示词
增强版提示词工程，提升图片质量
白底适配，所有图片与PPT白色背景协调

V2.0 新增功能：
- 配图策略判断（analyze_page_needs_image）
- 内容关系识别（analyze_content_relationship）
- 可视化方案推荐（recommend_visualization）
- 整体PPT分析（analyze_full_presentation）
"""

# ══════════════════════════════════════════════════════════════
# 内容关系类型定义
# ══════════════════════════════════════════════════════════════

RELATIONSHIP_TYPES = {
    "parallel": {
        "name": "并列关系",
        "keywords": ["和", "与", "以及", "兼", "共", "分别", "都", "同时"],
        "visual_types": ["cards", "icons", "grid", "columns"],
        "description": "多个同等重要的元素并列"
    },
    "progressive": {
        "name": "递进关系",
        "keywords": ["递进", "深入", "升级", "进阶", "层层", "逐步", "越来越", "从...到"],
        "visual_types": ["pyramid", "ladder", "funnel", "progress"],
        "description": "从基础到高级的递进过程"
    },
    "process": {
        "name": "流程关系",
        "keywords": ["流程", "步骤", "阶段", "先后", "然后", "接着", "首先", "其次", "最后", "1.2.3."],
        "visual_types": ["flow", "timeline", "gantt", "steps"],
        "description": "按顺序执行的操作步骤"
    },
    "comparison": {
        "name": "对比关系",
        "keywords": ["对比", "比较", "差异", "优劣", "不同", "vs", "versus", "反而"],
        "visual_types": ["comparison", "matrix", "before_after", "swot"],
        "description": "两个或多个对象的对比"
    },
    "hierarchy": {
        "name": "层级关系",
        "keywords": ["层级", "等级", "层次", "金字塔", "顶层", "底层", "上级", "下级", "架构"],
        "visual_types": ["pyramid", "tree", "org_chart", "nested"],
        "description": "上下级或包含关系"
    },
    "cycle": {
        "name": "循环关系",
        "keywords": ["循环", "周期", "轮转", "迭代", "闭环", "持续", "不断"],
        "visual_types": ["cycle", "loop", "circular", "rotation"],
        "description": "首尾相连的循环过程"
    },
    "composition": {
        "name": "组成关系",
        "keywords": ["组成", "构成", "包含", "占比", "比例", "%", "分配", "份额"],
        "visual_types": ["pie", "stacked", "breakdown", "percentage"],
        "description": "整体由各部分组成"
    },
    "cause_effect": {
        "name": "因果关系",
        "keywords": ["因为", "所以", "导致", "造成", "因此", "结果", "原因", "由于"],
        "visual_types": ["arrow", "fishbone", "logic_chain", "impact"],
        "description": "原因导致结果的逻辑关系"
    }
}

# ══════════════════════════════════════════════════════════════
# 可视化方案推荐
# ══════════════════════════════════════════════════════════════

VISUALIZATION_TYPES = {
    "cards": {"name": "卡片列表", "description": "多个要点的清晰展示", "icon": "📋"},
    "icons": {"name": "图标网格", "description": "带图标的多列展示", "icon": "🔲"},
    "flow": {"name": "流程图", "description": "步骤间的流向关系", "icon": "➡️"},
    "timeline": {"name": "时间线", "description": "按时间顺序的展示", "icon": "📅"},
    "pyramid": {"name": "金字塔图", "description": "层级递进的三角形展示", "icon": "🔺"},
    "funnel": {"name": "漏斗图", "description": "从宽到窄的筛选过程", "icon": "📉"},
    "comparison": {"name": "对比图", "description": "两列或多项对比展示", "icon": "⚖️"},
    "matrix": {"name": "矩阵图", "description": "2x2或更多维度的矩阵", "icon": "田"},
    "cycle": {"name": "循环图", "description": "首尾相连的循环", "icon": "🔄"},
    "stacked": {"name": "堆叠图", "description": "各部分堆叠的组成", "icon": "📊"},
}

# ══════════════════════════════════════════════════════════════
# 配图优先级定义
# ══════════════════════════════════════════════════════════════

IMAGE_PRIORITY = {
    "cover": {"score": 10, "reason": "封面必须配图"},
    "closing": {"score": 10, "reason": "结尾必须配图"},
    "concept": {"score": 8, "reason": "抽象概念需要具象化"},
    "summary": {"score": 5, "reason": "总结页强化印象"},
    "process": {"score": 4, "reason": "流程页辅助理解"},
    "detail": {"score": 1, "reason": "详细内容保持专注"},
}

# ══════════════════════════════════════════════════════════════
# 内容关系分析函数
# ══════════════════════════════════════════════════════════════

def analyze_content_relationship(items):
    """分析内容的关系类型"""
    if not items:
        return {"relationship": "parallel", "confidence": 0.5, "recommended_visuals": ["cards"]}
    
    all_text = " ".join([
        str(item.get("title", "")) + " " + str(item.get("value", ""))
        for item in items
    ]).lower()
    
    scores = {}
    for rel_id, rel_info in RELATIONSHIP_TYPES.items():
        score = sum(1 for kw in rel_info["keywords"] if kw.lower() in all_text)
        scores[rel_id] = score
    
    if max(scores.values()) > 0:
        best_rel = max(scores, key=lambda x: scores[x])
        confidence = min(scores[best_rel] / 3.0, 1.0)
    else:
        if len(items) >= 3:
            has_numbers = any(any(c.isdigit() for c in str(item.get("value", ""))) for item in items)
            best_rel = "composition" if has_numbers else "parallel"
            confidence = 0.6
        else:
            best_rel = "parallel"
            confidence = 0.7
    
    return {
        "relationship": best_rel,
        "relationship_name": RELATIONSHIP_TYPES[best_rel]["name"],
        "confidence": confidence,
        "recommended_visuals": RELATIONSHIP_TYPES[best_rel]["visual_types"]
    }


def analyze_page_needs_image(page_data, page_index, total_pages):
    """分析页面是否需要配图及优先级"""
    page_type = page_data.get("type", "content")
    title = page_data.get("title", "")
    items = page_data.get("items", [])
    
    # 封面和结尾必须配图
    if page_type == "title" and page_index == 0:
        return {"needs_image": True, "priority": 10, "priority_label": "必须", "reason": "封面是门面"}
    
    if page_type == "closing":
        return {"needs_image": True, "priority": 10, "priority_label": "必须", "reason": "结尾优雅收尾"}
    
    title_lower = title.lower()
    
    # 概念抽象页
    abstract_keywords = ["概念", "本质", "核心", "体系", "框架", "模型", "方法论"]
    if any(kw in title_lower for kw in abstract_keywords):
        return {"needs_image": True, "priority": 8, "priority_label": "强烈推荐", "reason": "抽象概念具象化"}
    
    # 图表页
    if page_type in ["radar", "funnel", "gauge", "pie", "stacked"]:
        return {"needs_image": True, "priority": 6, "priority_label": "增强推荐", "reason": "增强图表可视化"}
    
    # 总结页
    summary_keywords = ["总结", "回顾", "要点"]
    if any(kw in title_lower for kw in summary_keywords):
        return {"needs_image": True, "priority": 5, "priority_label": "推荐", "reason": "强化核心印象"}
    
    # 流程页
    if any(kw in title_lower for kw in ["流程", "步骤", "阶段"]):
        return {"needs_image": True, "priority": 4, "priority_label": "可选", "reason": "辅助流程理解"}
    
    # 详细内容页
    if len(items) >= 4:
        return {"needs_image": False, "priority": 1, "priority_label": "不需要", "reason": "保持专注"}
    
    # 内容少于3项
    if 0 < len(items) <= 3:
        return {"needs_image": True, "priority": 3, "priority_label": "可选", "reason": "内容较少可配图"}
    
    return {"needs_image": False, "priority": 1, "priority_label": "不需要", "reason": "默认不配图"}


def recommend_visualization(page_data, page_index, total_pages):
    """推荐最佳可视化方案"""
    page_type = page_data.get("type", "content")
    items = page_data.get("items", [])
    
    relationship = analyze_content_relationship(items)
    
    # 图表页类型
    if page_type == "radar":
        return {"visual_type": "radar", "visual_name": "雷达图", "confidence": 0.95}
    if page_type == "funnel":
        return {"visual_type": "funnel", "visual_name": "漏斗图", "confidence": 0.9}
    if page_type == "gauge":
        return {"visual_type": "gauge", "visual_name": "仪表盘", "confidence": 0.9}
    
    # 根据关系类型推荐
    rel_type = relationship["relationship"]
    
    if rel_type == "parallel":
        return {
            "visual_type": "icons" if len(items) <= 4 else "cards",
            "visual_name": "图标网格" if len(items) <= 4 else "卡片列表",
            "confidence": relationship["confidence"]
        }
    elif rel_type == "progressive":
        return {"visual_type": "pyramid", "visual_name": "金字塔图", "confidence": relationship["confidence"]}
    elif rel_type == "process":
        return {"visual_type": "flow", "visual_name": "流程图", "confidence": relationship["confidence"]}
    elif rel_type == "comparison":
        return {"visual_type": "comparison", "visual_name": "对比图", "confidence": relationship["confidence"]}
    elif rel_type == "hierarchy":
        return {"visual_type": "pyramid", "visual_name": "金字塔图", "confidence": relationship["confidence"]}
    elif rel_type == "cycle":
        return {"visual_type": "cycle", "visual_name": "循环图", "confidence": relationship["confidence"]}
    elif rel_type == "composition":
        return {"visual_type": "stacked", "visual_name": "堆叠图", "confidence": relationship["confidence"]}
    
    return {"visual_type": "cards", "visual_name": "卡片列表", "confidence": 0.5}


def analyze_full_presentation(slides, topic_hint=""):
    """分析整个PPT，给出整体可视化建议"""
    results = {
        "total_pages": len(slides),
        "statistics": {"needs_image": 0, "relationships": {}, "visuals": {}},
        "image_plan": [],
        "visual_plan": []
    }
    
    for idx, slide in enumerate(slides):
        img_analysis = analyze_page_needs_image(slide, idx, len(slides))
        vis_recommendation = recommend_visualization(slide, idx, len(slides))
        rel = analyze_content_relationship(slide.get("items", []))
        
        if img_analysis["needs_image"]:
            results["statistics"]["needs_image"] += 1
            results["image_plan"].append({"page": idx, "priority": img_analysis["priority"], **img_analysis})
        
        results["visual_plan"].append({"page": idx, **vis_recommendation})
        
        rel_name = rel.get("relationship_name", "未知")
        results["statistics"]["relationships"][rel_name] = results["statistics"]["relationships"].get(rel_name, 0) + 1
        
        vis_type = vis_recommendation["visual_type"]
        results["statistics"]["visuals"][vis_type] = results["statistics"]["visuals"].get(vis_type, 0) + 1
    
    results["image_plan"] = sorted(results["image_plan"], key=lambda x: x["priority"], reverse=True)
    return results


# ══════════════════════════════════════════════════════════════
# 专业提示词工程库
# ══════════════════════════════════════════════════════════════

# 构图方式库
COMPOSITIONS = {
    "center_radiating": {
        "name": "中心放射型",
        "description": "元素从中心向外扩散",
        "prompt_addition": "center-radiating composition, dynamic energy flow from center outward, symmetrical balance"
    },
    "rule_of_thirds": {
        "name": "三分法",
        "description": "按九宫格构图",
        "prompt_addition": "rule of thirds composition, balanced placement, visual hierarchy, professional layout"
    },
    "layered_depth": {
        "name": "层次深度型",
        "description": "前景/中景/背景分层",
        "prompt_addition": "layered depth composition, foreground midground background, 3D perspective, dimensional"
    },
    "diagonal_leading": {
        "name": "对角线引导型",
        "description": "对角线引导视线",
        "prompt_addition": "diagonal leading lines, dynamic movement, directional flow, energetic composition"
    },
    "frame_within_frame": {
        "name": "框架嵌套型",
        "description": "用元素构建框架",
        "prompt_addition": "frame within frame composition, layered framing, visual depth, architectural elements"
    },
    "minimalist_center": {
        "name": "极简中心型",
        "description": "中心简洁留白",
        "prompt_addition": "minimalist centered composition, generous whitespace, clean negative space, elegant simplicity"
    }
}

# 视觉元素库
VISUAL_ELEMENTS = {
    # 几何图形
    "hexagonal": ["hexagonal grid patterns", "hexagonal modules", "six-sided geometric shapes"],
    "circular": ["circular nodes", "orbital rings", "radial patterns", "concentric circles"],
    "triangular": ["triangular shapes", "angular geometry", "pyramid structures"],
    "grid": ["digital grid", "matrix pattern", "grid lines", "pixel grid"],
    # 数据可视化
    "data_charts": ["abstract bar charts", "floating data points", "metric indicators", "statistical elements"],
    "network": ["neural network nodes", "connected dots", "relationship lines", "graph structures"],
    "flow": ["data streams", "information flow", "streaming particles", "dynamic lines"],
    # 科技元素
    "tech_circuit": ["circuit board traces", "electronic pathways", "microchip patterns"],
    "digital_particles": ["floating particles", "digital dust", "light particles", "luminous dots"],
    "waveform": ["sound waves", "frequency patterns", "oscillating lines", "wave graphics"],
    # 商务元素
    "growth": ["upward arrows", "growth charts", "ascending bars", "progress indicators"],
    "target": ["bullseye target", "goal markers", "achievement indicators", "precision elements"],
    "shield": ["security shield", "protection barrier", "quality seal", "verification checkmark"],
    # 创意元素
    "abstract_fluid": ["fluid gradients", "flowing shapes", "organic curves", "liquid geometry"],
    "geometric_abstract": ["floating geometric blocks", "abstract shapes", "modern art elements"],
    "light_effects": ["bokeh lights", "lens flares", "light rays", "glowing edges"]
}

# 光效风格库
LIGHTING_STYLES = {
    "soft_glow": {
        "name": "柔和光晕",
        "prompt": "soft ambient lighting, subtle glow effects, gentle highlights, diffused light"
    },
    "dramatic_lighting": {
        "name": "戏剧光影",
        "prompt": "dramatic lighting, high contrast, spotlight effects, chiaroscuro, bold shadows"
    },
    "neon_glow": {
        "name": "霓虹光效",
        "prompt": "neon glow lighting, vibrant neon accents, electric highlights, modern cyberpunk aesthetic"
    },
    "glass_morphism": {
        "name": "玻璃拟态",
        "prompt": "glass morphism style, translucent elements, frosted glass effect, modern UI aesthetic"
    },
    "gradient_light": {
        "name": "渐变光效",
        "prompt": "smooth gradient lighting, color transitions, luminous gradients, soft color blending"
    }
}

# 质感风格库
TEXTURE_STYLES = {
    "glossy": {
        "name": "光滑质感",
        "prompt": "glossy surface, reflective materials, polished finish, sleek texture"
    },
    "matte": {
        "name": "哑光质感",
        "prompt": "matte finish, soft texture, understated elegance, non-reflective surface"
    },
    "metallic": {
        "name": "金属质感",
        "prompt": "metallic finish, brushed aluminum look, steel texture, premium material feel"
    },
    "isometric": {
        "name": "等轴测",
        "prompt": "isometric perspective, 2.5D illustration, consistent 30-degree angles, clean vector style"
    }
}

# 配色方案库
COLOR_PALETTES = {
    "tech_blue": {
        "name": "科技蓝",
        "colors": ["#0066FF", "#00D4FF", "#0066CC", "#003366"],
        "prompt": "vibrant blue tones, cyan highlights, deep navy accents, tech-forward color scheme"
    },
    "professional_blue": {
        "name": "专业蓝金",
        "colors": ["#1E3A5F", "#FFD700", "#4A90D9", "#FFFFFF"],
        "prompt": "deep navy blue, gold accents, professional business palette, corporate elegance"
    },
    "modern_purple": {
        "name": "现代紫",
        "colors": ["#6366F1", "#8B5CF6", "#A855F7", "#C084FC"],
        "prompt": "modern purple gradient, violet to lavender tones, contemporary color palette, vibrant yet professional"
    },
    "clean_white": {
        "name": "清新白蓝",
        "colors": ["#FFFFFF", "#F0F4F8", "#3B82F6", "#10B981"],
        "prompt": "clean white base, soft blue accents, subtle green highlights, fresh modern aesthetic"
    },
    "elegant_teal": {
        "name": "优雅青绿",
        "colors": ["#0D9488", "#14B8A6", "#5EEAD4", "#FFFFFF"],
        "prompt": "elegant teal tones, emerald accents, sophisticated green-blue palette, premium feel"
    }
}

# ══════════════════════════════════════════════════════════════
# 配图风格库
# ══════════════════════════════════════════════════════════════

IMAGE_STYLES = {
    "tech_future": {
        "name": "科技未来风",
        "elements": [
            "geometric shapes", "neural network nodes", "data streams",
            "particle effects", "hexagonal patterns", "circuit lines",
            "digital grid", "floating icons"
        ],
        "colors": [
            "deep blue", "cyan", "purple gradient", "glowing accents",
            "neon highlights", "blue-purple gradient"
        ],
        "composition": [
            "center-radiating", "layered depth", "floating elements",
            "digital grid background", "radial symmetry"
        ],
        "keywords": ["AI", "技术", "系统", "架构", "数据", "智能", "算法", "网络", "科技"]
    },
    "business": {
        "name": "专业商务风",
        "elements": [
            "minimalist icons", "data charts", "human silhouettes",
            "abstract shapes", "clean lines", "professional symbols",
            "business icons", "growth indicators"
        ],
        "colors": [
            "navy blue", "gold accent", "white background",
            "professional blue", "elegant gray"
        ],
        "composition": [
            "clean layout", "balanced composition", "minimalist",
            "professional grid", "symmetric design"
        ],
        "keywords": ["汇报", "方案", "总结", "商务", "管理", "流程", "标准", "体系"]
    },
    "creative": {
        "name": "创意插画风",
        "elements": [
            "hand-drawn elements", "colorful gradients", "playful shapes",
            "creative illustrations", "fun icons", "artistic elements",
            "bright colors", "whimsical patterns"
        ],
        "colors": [
            "vibrant colors", "colorful gradients", "bright palette",
            "rainbow accents", "lively tones"
        ],
        "composition": [
            "dynamic composition", "creative layout", "asymmetric balance",
            "artistic arrangement", "whimsical placement"
        ],
        "keywords": ["分享", "介绍", "培训", "创意", "趣味", "活泼", "展示"]
    },
    "minimalist": {
        "name": "极简抽象风",
        "elements": [
            "simple lines", "geometric blocks", "negative space",
            "clean shapes", "minimal elements", "abstract forms",
            "subtle gradients", "elegant curves"
        ],
        "colors": [
            "monochrome", "two-tone", "subtle gray",
            "clean white", "elegant black", "muted accent"
        ],
        "composition": [
            "centered composition", "balanced whitespace",
            "minimalist layout", "clean hierarchy", "simple grid"
        ],
        "keywords": ["结尾", "过渡", "感谢", "总结", "极简", "高端"]
    }
}

# ══════════════════════════════════════════════════════════════
# 配图类型定义
# ══════════════════════════════════════════════════════════════

IMAGE_TYPES = {
    "cover": {
        "name": "封面背景图",
        "position": "background",
        "size": "full",
        "style_priority": ["tech_future", "business"],
        "prompt_template": "{theme} concept, WHITE BACKGROUND, {style_elements}, {composition}, dramatic impact, professional presentation backdrop, ABSOLUTELY NO TEXT: no words, no letters, no numbers, no typography, no Chinese characters, pure visual only, 16:9 aspect ratio"
    },
    "chapter_transition": {
        "name": "章节过渡图",
        "position": "background",
        "size": "full",
        "style_priority": ["minimalist", "tech_future"],
        "prompt_template": "Chapter transition visual for {topic}, WHITE BACKGROUND, abstract representation, {style_elements}, {composition}, bridging concept, professional style, ABSOLUTELY NO TEXT: no words, no letters, no numbers, no typography, no Chinese characters, pure visual only, 16:9 aspect ratio"
    },
    "data_visualization": {
        "name": "数据可视化图",
        "position": "right_image",
        "size": "right_image",
        "style_priority": ["tech_future", "business"],
        "prompt_template": "Data visualization art for {topic}, WHITE BACKGROUND, abstract chart elements, {style_elements}, {composition}, data-driven aesthetic, infographic style, ABSOLUTELY NO TEXT: no words, no letters, no numbers, no typography, no Chinese characters, pure visual only, 16:9 aspect ratio"
    },
    "content_decoration": {
        "name": "内容装饰图",
        "position": "right_image",
        "size": "right_image",
        "style_priority": ["business", "creative", "tech_future"],
        "prompt_template": "Professional illustration for {topic}, WHITE BACKGROUND, {style_elements}, {composition}, matching presentation theme, decorative visual, ABSOLUTELY NO TEXT: no words, no letters, no numbers, no typography, no Chinese characters, pure visual only, 16:9 aspect ratio"
    },
    "closing": {
        "name": "结尾背景图",
        "position": "background",
        "size": "full",
        "style_priority": ["minimalist", "creative"],
        "prompt_template": "Closing slide background for {topic}, WHITE BACKGROUND, elegant {style_elements}, {composition}, thank you atmosphere, professional ending visual, ABSOLUTELY NO TEXT: no words, no letters, no numbers, no typography, no Chinese characters, pure visual only, 16:9 aspect ratio"
    }
}

# ══════════════════════════════════════════════════════════════
# 核心函数
# ══════════════════════════════════════════════════════════════

def detect_style(slides_content):
    """检测PPT整体风格"""
    # 合并所有内容进行关键词检测
    all_text = ""
    for slide in slides_content:
        if isinstance(slide, dict):
            all_text += " ".join(str(v) for v in slide.values()) + " "
    
    all_text = all_text.lower()
    
    # 统计各风格关键词匹配次数
    style_scores = {}
    for style_id, style in IMAGE_STYLES.items():
        score = 0
        for keyword in style["keywords"]:
            if keyword in all_text:
                score += 1
        style_scores[style_id] = score
    
    # 返回得分最高的风格
    if max(style_scores.values()) > 0:
        return max(style_scores, key=style_scores.get)
    return "business"  # 默认商务风


def analyze_page_content(slide, slide_index, total_slides):
    """分析单页内容，提取视觉元素"""
    result = {
        "page_type": slide.get("type", "content"),
        "title": slide.get("title", ""),
        "items": slide.get("items", []),
        "visual_keywords": [],
        "suggested_type": "content_decoration"
    }
    
    # 提取关键词
    all_text = ""
    if isinstance(slide, dict):
        for key, value in slide.items():
            if isinstance(value, str):
                all_text += value + " "
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        all_text += " ".join(str(v) for v in item.values()) + " "
                    else:
                        all_text += str(item) + " "
    
    all_text = all_text.lower()
    
    # 识别视觉关键词
    visual_keywords = {
        "radar": ["雷达", "评估", "维度", "能力", "分析", "五维", "六维"],
        "funnel": ["漏斗", "转化", "流程", "步骤", "阶段", "递进"],
        "chart": ["数据", "指标", "图表", "统计", "数字", "比例"],
        "architecture": ["架构", "体系", "结构", "系统", "框架", "组成"],
        "process": ["流程", "步骤", "顺序", "过程", "阶段", "周期"],
        "comparison": ["对比", "比较", "差异", "不同", "优劣势"],
        "hierarchy": ["层级", "等级", "层次", "金字塔", "塔形"],
        "network": ["网络", "连接", "关系", "节点", "关联"]
    }
    
    for category, keywords in visual_keywords.items():
        if any(kw in all_text for kw in keywords):
            result["visual_keywords"].append(category)
    
    # 确定配图类型
    slide_type = slide.get("type", "")
    if slide_index == 0:
        result["suggested_type"] = "cover"
    elif slide_index == total_slides - 1:
        result["suggested_type"] = "closing"
    elif slide_type == "section":
        result["suggested_type"] = "chapter_transition"  # section类型映射为章节过渡
    elif "radar" in result["visual_keywords"]:
        result["suggested_type"] = "data_visualization"
    elif "funnel" in result["visual_keywords"] or "process" in result["visual_keywords"]:
        result["suggested_type"] = "chapter_transition"
    elif "chart" in result["visual_keywords"] or "数据" in all_text:
        result["suggested_type"] = "data_visualization"
    elif slide_type in ["radar", "gauge", "funnel"]:
        result["suggested_type"] = "data_visualization"
    else:
        result["suggested_type"] = "content_decoration"
    
    return result


def build_prompt_v2(slide_analysis, style_id, topic_hint="", options=None):
    """构建高质量配图提示词 V2.0 - 增强版
    
    Args:
        slide_analysis: 页面分析结果
        style_id: 风格ID
        topic_hint: 主题提示
        options: 自定义选项 {
            "composition": str,      # 构图方式
            "lighting": str,        # 光效风格
            "texture": str,         # 质感风格
            "palette": str,        # 配色方案
            "elements": list,       # 视觉元素
            "custom_theme": str,    # 自定义主题描述
            "extra_details": str    # 额外细节描述
        }
    """
    options = options or {}
    style = IMAGE_STYLES.get(style_id, IMAGE_STYLES["business"])
    img_type = IMAGE_TYPES.get(slide_analysis["suggested_type"], IMAGE_TYPES["content_decoration"])
    
    # 提取主题
    topic = slide_analysis.get("title", "")
    if not topic and slide_analysis.get("visual_keywords"):
        topic = slide_analysis["visual_keywords"][0]
    if not topic:
        topic = topic_hint or "professional concept"
    
    # 获取视觉关键词对应的元素
    visual_keywords = slide_analysis.get("visual_keywords", [])
    selected_elements = []
    for kw in visual_keywords:
        if kw in VISUAL_ELEMENTS:
            selected_elements.extend(VISUAL_ELEMENTS[kw][:2])
    
    # 如果没有匹配的元素，使用风格默认元素
    if not selected_elements:
        selected_elements = style["elements"][:3]
    
    # 如果有自定义元素，添加
    if options.get("elements"):
        selected_elements = options["elements"] + selected_elements[:2]
    
    # 构建元素字符串
    elements_str = ", ".join(selected_elements[:4])
    
    # 获取配色
    palette_id = options.get("palette", "clean_white")
    palette = COLOR_PALETTES.get(palette_id, COLOR_PALETTES["clean_white"])
    palette_prompt = palette["prompt"]
    
    # 获取构图方式
    composition_id = options.get("composition", "minimalist_center")
    if slide_analysis["suggested_type"] == "cover":
        composition_id = "center_radiating"
    elif slide_analysis["suggested_type"] == "data_visualization":
        composition_id = "layered_depth"
    composition = COMPOSITIONS.get(composition_id, COMPOSITIONS["minimalist_center"])
    composition_prompt = composition["prompt_addition"]
    
    # 获取光效风格
    lighting_id = options.get("lighting", "gradient_light")
    lighting = LIGHTING_STYLES.get(lighting_id, LIGHTING_STYLES["gradient_light"])
    lighting_prompt = lighting["prompt"]
    
    # 获取质感风格
    texture_id = options.get("texture", "isometric")
    texture = TEXTURE_STYLES.get(texture_id, TEXTURE_STYLES["isometric"])
    texture_prompt = texture["prompt"]
    
    # 获取类型特定的提示词
    type_prompt = img_type["prompt_template"]
    
    # 构建完整提示词
    prompt_parts = []
    
    # 1. 主题（放在最前面，强调内容相关性）
    prompt_parts.append(f"Professional illustration for {topic}")
    
    # 2. 视觉元素
    prompt_parts.append(f"featuring {elements_str}")
    
    # 3. 配色方案
    prompt_parts.append(palette_prompt)
    
    # 4. 光效风格
    prompt_parts.append(lighting_prompt)
    
    # 5. 质感风格
    prompt_parts.append(texture_prompt)
    
    # 6. 构图方式
    prompt_parts.append(composition_prompt)
    
    # 7. 技术参数（白底 + 无文字）
    prompt_parts.append("WHITE BACKGROUND, no dark background, no text, no typography, 16:9 aspect ratio, high quality, 4K resolution")
    
    # 8. 额外细节（可选）
    if options.get("extra_details"):
        prompt_parts.append(options["extra_details"])
    
    # 组合完整提示词
    full_prompt = ", ".join(prompt_parts)
    
    return {
        "prompt": full_prompt,
        "elements": elements_str,
        "palette": palette["name"],
        "composition": composition["name"],
        "lighting": lighting["name"],
        "texture": texture["name"]
    }


def build_content_aware_prompt(slide, slide_analysis, style_id, topic_hint=""):
    """构建与页面内容深度关联的配图提示词 V3.0
    
    核心改进：
    1. 深度结合页面标题、items、description等具体内容
    2. 生成与当前页面主题高度相关的视觉元素
    3. 确保配图能够准确传达页面信息
    
    Args:
        slide: 完整幻灯片数据（包含title、items等）
        slide_analysis: 页面分析结果
        style_id: 风格ID
        topic_hint: 主题提示
    
    Returns:
        dict: 包含prompt和详细信息的字典
    """
    style = IMAGE_STYLES.get(style_id, IMAGE_STYLES["business"])
    
    # 1. 提取页面的具体内容
    title = slide.get('title', '') or slide.get('main', '') or ''
    subtitle = slide.get('subtitle', '') or slide.get('sub', '') or ''
    items = slide.get('items', [])
    description = slide.get('description', '') or ''
    slide_type = slide.get('type', 'content_cards')
    
    # 2. 构建内容主题词（从标题和items中提取关键概念）
    content_keywords = []
    
    # 从标题提取
    if title:
        # 清理标题，提取核心概念
        title_clean = title.replace('Part ', '').replace('：', ':').replace('①', '').replace('②', '')
        title_parts = [p.strip() for p in title_clean.split(':')]
        content_keywords.extend(title_parts)
        if len(title_parts) > 1:
            # 使用冒号后的内容作为主要主题
            content_keywords.append(title_parts[-1])
    
    # 从items提取关键概念
    key_concepts = []
    for item in items[:4]:  # 最多取4个items
        item_title = item.get('title', '')
        item_value = item.get('value', '')
        if item_title:
            key_concepts.append(item_title)
        if item_value:
            # 简化value，提取关键词
            value_short = item_value.split('→')[0].split('+')[0].strip()
            key_concepts.append(value_short)
    
    content_keywords.extend(key_concepts[:6])
    
    # 3. 根据内容类型选择视觉主题
    visual_theme = _infer_visual_theme(title, items, slide_type)
    
    # 4. 如果没有匹配到特定主题，使用topic_hint
    if visual_theme == "professional concept illustration, business visualization" and topic_hint:
        # 从topic_hint提取主题词，生成婴儿春游相关提示词
        hint_keywords = topic_hint.replace(",", " ").split()
        spring_keywords = ["spring", "baby", "outdoor", "park", "flower", "family", "picnic"]
        matched_hint = [k for k in hint_keywords if k.lower() in spring_keywords]
        if matched_hint or any(k in ["春游", "宝宝", "户外", "公园", "婴儿"] for k in [title, subtitle] + content_keywords):
            visual_theme = "baby spring outing, family picnic in park, cherry blossoms, cute baby, warm sunshine, joyful family moment"
    
    # 5. 构建深度关联的提示词
    prompt_parts = []
    
    # 主视觉主题（基于内容）
    if visual_theme:
        prompt_parts.append(visual_theme)
    
    # 添加内容相关的具体元素
    if key_concepts:
        # 将关键概念转化为视觉元素
        visual_elements = _concepts_to_visuals(key_concepts)
        if visual_elements:
            prompt_parts.append(visual_elements)
    
    # 风格元素
    style_elements = style.get("elements", ["professional", "clean"])
    prompt_parts.append(", ".join(style_elements[:2]))
    
    # 配色（白底）
    prompt_parts.append("clean white background, WHITE BACKGROUND, no dark background")
    
    # 构图要求
    if slide_type == 'section':
        prompt_parts.append("dramatic composition, bold typography space, minimalist design")
    elif slide_type == 'content_cards':
        prompt_parts.append("balanced composition, content illustration style")
    elif slide_type == 'icons_grid':
        prompt_parts.append("grid-friendly layout, modular design")
    elif slide_type == 'process_flow':
        prompt_parts.append("flow direction, connected elements, process visualization")
    elif slide_type == 'comparison':
        prompt_parts.append("split composition, comparison layout, two sides")
    else:
        prompt_parts.append("professional illustration, clean vector style")
    
    # ═══════════════════════════════════════════════════════════════════
    # ⚠️ 强约束：绝对禁止出现任何文字 ⚠️
    # ═══════════════════════════════════════════════════════════════════
    prompt_parts.append("ABSOLUTELY NO TEXT: no words, no letters, no numbers, no typography, no Chinese characters, no English words, no symbols that resemble text, no watermarks, no signatures")
    
    # 技术参数
    prompt_parts.append("pure visual illustration only, 16:9 aspect ratio, high quality, 4K resolution, professional photography or clean vector style")
    
    full_prompt = ", ".join(prompt_parts)
    
    return {
        "prompt": full_prompt,
        "content_keywords": content_keywords,
        "visual_theme": visual_theme,
        "key_concepts": key_concepts,
        "style": style_id
    }


def _infer_visual_theme(title, items, slide_type):
    """根据页面内容推断合适的视觉主题"""
    title_lower = title.lower()
    items_text = " ".join([str(i) for i in items]).lower()
    combined = title_lower + " " + items_text
    
    # ══════════════════════════════════════════════════════════════════════
    # 婴儿护理相关主题（高优先级匹配）
    # ══════════════════════════════════════════════════════════════════════
    baby_care_mappings = {
        # 睡眠相关
        ("睡眠", "sleep", "睡觉", "nap", "bedtime"): "sleeping baby in cozy crib, peaceful nursery, soft lighting",
        ("睡眠安全", "sleep safety"): "baby sleep safety, crib with rails, safe sleeping position",
        
        # 喂养相关
        ("母乳", "breastfeed", "哺乳", "nursing"): "mother breastfeeding baby, warm bonding moment, natural light",
        ("配方奶", "formula", "奶瓶", "bottle"): "baby bottle feeding, warm milk preparation, nurturing scene",
        ("辅食", "solid food", "米粉", "果泥", "辅食添加"): "baby food introduction, pureed fruits vegetables, high chair",
        ("喂养", "feeding"): "baby feeding time, nurturing care scene",
        
        # 发育相关
        ("发育", "development", " milestone", "成长"): "baby developmental milestone, growing achievement",
        ("体格", "体重", "身高", "发育指标"): "baby growth chart, healthy development measurement",
        ("大动作", "翻身", "抬头", "爬行", "坐"): "baby motor skills, tummy time, rolling over",
        ("精细动作", "抓握", "手指", "手部"): "baby fine motor skills, hand coordination",
        ("语言", "说话", "发声", "早教"): "baby language development, reading together, interaction",
        ("认知", "智力", "早教", "镜子"): "baby cognitive development, mirror play, cognitive games",
        
        # 健康相关
        ("疫苗", "接种", "vaccin"): "baby vaccination, medical care, doctor visit",
        ("皮肤", "湿疹", "护肤", "沐浴"): "baby skincare, bath time, gentle skin care",
        ("口腔", "出牙", "牙胶", "刷牙"): "baby dental care, teething, oral hygiene",
        ("指甲", "头发", "理发"): "baby grooming, nail trimming, hair care",
        
        # 护理场景
        ("换尿布", "尿布", "diaper"): "diaper changing, baby care routine",
        ("洗澡", "浴盆", "洗浴"): "baby bath time, warm water, bubble bath",
        ("抚触", "按摩", "被动操"): "baby massage, infant massage therapy, bonding",
        ("户外", "晒太阳", "通风"): "baby outdoor time, fresh air, sunlight",
        
        # 护理要点
        ("护理要点", "注意事项", "要点"): "baby care essentials, nursing tips",
        ("环境", "室温", "湿度"): "baby room environment, temperature control, cozy nursery",
        
        # ══════════════════════════════════════════════════════════════════════
        # 春游/户外相关（新增）
        # ══════════════════════════════════════════════════════════════════════
        ("春游", "春游记", "spring outing", "spring trip"): "baby spring outing, family picnic, outdoor adventure, cherry blossoms",
        ("出行", "出行准备", "travel", "trip preparation"): "baby travel supplies, family outing preparation, infant gear",
        ("户外活动", "户外"): "baby outdoor, fresh air, sunlight exposure, park scenery, green grass",
        ("婴儿衣物", "宝宝衣物", "衣物", "clothes", "outfit"): "baby clothes, cute onesie, baby outfit, cotton fabric, tiny clothes",
        ("宝宝帽子", "帽子", "sun hat", "headwear"): "baby sun hat, infant headwear, sun protection, cute baby hat",
        ("包被", "毯子", "blanket", "swaddle"): "baby blanket, swaddle, infant wrap, cozy fabric, soft blanket",
        ("防晒", "防暑", "sun protection", "sunscreen"): "baby sun protection, sun hat shade, UV protection, delicate skin care",
        ("防风", "防寒", "wind protection"): "wind protection, cozy baby, spring breeze, warm baby",
        ("婴儿防晒", "宝宝防晒"): "baby sunscreen, infant sun protection, delicate skin care, gentle formula",
        ("防蚊", "防虫", "mosquito", "防蚊虫"): "mosquito free baby, insect protection, safe outdoor, baby protection",
        ("公园", "city park", "park"): "city park, green grass, spring scenery, family walk, beautiful trees",
        ("花园", "植物园", "flower garden", "tulips", "花园"): "flower garden, tulips, cherry blossoms, spring bloom, colorful flowers",
        ("野餐", "picnic"): "family picnic, picnic blanket, outdoor meal, spring day, delicious food",
        ("婴儿车", "stroller", "pram"): "baby stroller, infant pram, walk in park, comfortable ride",
        ("亲子", "parent child", "亲子互动"): "parent baby bonding, family time, loving togetherness, warm family moment",
        ("拍照", "摄影", "photo", "photography"): "family photo, capturing moments, spring photography, beautiful memories",
        ("合影", "合照", "portrait", "group photo"): "family portrait, group photo, memorable moment, happy family",
        ("安全防护", "安全", "safety", "防护"): "baby safety, protective care, secure environment, safe baby",
        ("喂养用品", "喂养", "feeding supplies"): "baby feeding supplies, bottles, formula preparation, nursing essentials",
        ("护理用品", "护理", "care products"): "baby care products, diaper, wipes, skincare, baby essentials",
        ("目的地", "destination", "地点"): "travel destination, scenic spot, beautiful location, wonderful place",
        ("穿衣", "穿着", "dressing"): "baby dressing, cute outfit, spring clothes, comfortable wear",
    }
    
    # 婴儿护理主题优先匹配
    for keywords_tuple, theme in baby_care_mappings.items():
        for kw in keywords_tuple:
            if kw in combined:
                return theme
    
    # ══════════════════════════════════════════════════════════════════════
    # 通用主题映射
    # ══════════════════════════════════════════════════════════════════════
    theme_mappings = {
        # 架构相关
        ("架构", "architecture", "layer", "层次"): "modern architecture diagram, layered structure visualization",
        ("系统", "system", "platform"): "system architecture illustration, interconnected modules",
        
        # 流程相关
        ("流程", "process", "步骤", "工作流"): "process flow visualization, step-by-step diagram",
        ("循环", "cycle", "反馈", "反馈回路"): "circular process diagram, feedback loop visualization",
        
        # 对比相关
        ("对比", "compare", "vs", "versus"): "side-by-side comparison layout, two contrasting concepts",
        ("传统", "old", "modern", "new"): "before and after comparison, transformation visualization",
        
        # 约束/安全相关
        ("约束", "constrain", "安全", "security", "边界"): "security shield, boundary visualization, protection concept",
        ("验证", "verify", "检查", "quality"): "verification checklist, quality assurance, inspection concept",
        
        # 告知/信息相关
        ("告知", "inform", "信息", "context", "上下文"): "information flow, document stack, knowledge graph",
        ("文档", "document", "知识"): "document collection, knowledge base visualization",
        
        # 纠正相关
        ("纠正", "correct", "修复", "recovery"): "correction loop, recovery process, improvement cycle",
        ("错误", "error", "exception"): "error handling, troubleshooting visualization",
        
        # Agent/AI相关
        ("agent", "智能体", "机器人"): "AI robot illustration, intelligent agent visualization",
        ("模型", "model", "brain"): "brain neural network, AI model concept",
        ("多agent", "multi-agent", "协作"): "multiple agents collaborating, swarm intelligence",
        
        # 产品相关
        ("操作系统", "os", "platform"): "operating system interface, platform concept",
        ("用户", "user", "客户"): "user interface, customer journey visualization",
        ("产品", "product", "功能"): "product feature illustration, capability showcase",
        
        # 数据相关
        ("数据", "data", "分析"): "data visualization, analytics dashboard concept",
        ("指标", "kpi", "metric"): "metrics dashboard, KPI visualization",
        
        # 团队/角色相关
        ("角色", "role", "分工"): "role assignment, team collaboration visualization",
        ("协作", "collaborate", "合作"): "team collaboration, cooperation concept",
        
        # 工具相关
        ("工具", "tool", "方法"): "tool collection, methodology visualization",
        
        # 资源相关
        ("资源", "resource", "模板"): "resource library, template collection visualization",
        
        # 最佳实践
        ("原则", "principle", "最佳实践"): "principle illustration, best practice concept",
        
        # 总结
        ("总结", "summary", "回顾"): "summary concept, key takeaways visualization",
        
        # 封面
        ("cover", "封面"): "hero illustration, impactful opening visual",
        
        # 结尾
        ("closing", "结尾", "谢谢", "thanks"): "inspiring closing, motivational illustration",
    }
    
    # 遍历匹配
    for keywords_tuple, theme in theme_mappings.items():
        for kw in keywords_tuple:
            if kw in combined:
                return theme
    
    # 默认主题
    return "professional concept illustration, business visualization"


def _concepts_to_visuals(key_concepts):
    """将关键概念转化为具体的视觉元素描述"""
    if not key_concepts:
        return ""
    
    # ══════════════════════════════════════════════════════════════════════
    # 婴儿护理相关映射（高优先级）
    # ══════════════════════════════════════════════════════════════════════
    baby_care_mappings = {
        # 睡眠
        "5月龄宝宝睡眠": "sleeping baby, peaceful nursery, soft moonlight",
        "睡眠特点": "baby sleep patterns, cozy bassinet, dreamy atmosphere",
        "睡眠安全": "safe baby sleep, crib with firm mattress, no loose bedding",
        "睡眠倒退": "baby sleep regression, comforting parent presence",
        
        # 喂养
        "母乳喂养": "mother breastfeeding, bonding moment, natural warm tones",
        "配方奶喂养": "baby bottle feeding, prepared formula, nurturing care",
        "辅食添加": "baby first solid food, high chair, colorful purees",
        "辅食准备": "baby food preparation, fresh ingredients, kitchen scene",
        "补充营养素": "baby vitamins supplements, pediatric recommendation",
        
        # 发育
        "发育里程碑": "baby milestone achievement, developmental progress",
        "体格发育": "baby growth measurement, healthy development",
        "大动作": "baby gross motor, tummy time, rolling over practice",
        "精细动作": "baby fine motor, grasping toys, hand coordination",
        "语言能力": "baby talking, babbling sounds, communication",
        "认知发展": "baby cognitive, mirror play, exploration",
        "社会性": "baby social, smiling, interaction with parents",
        
        # 健康
        "疫苗接种": "baby vaccination, doctor visit, medical care",
        "皮肤护理": "baby skin care, gentle moisturizer, soft skin",
        "口腔护理": "baby oral care, teething toys, gum massage",
        "指甲护理": "baby nail trimming, tiny fingers, gentle care",
        "头发护理": "baby hair care, soft brush, gentle styling",
        
        # 护理
        "换尿布": "diaper changing, clean baby, changing table",
        "洗澡": "baby bath time, warm water, rubber duck toys",
        "抚触": "baby massage, parent touch, bonding skin to skin",
        "户外活动": "baby outdoor, fresh air, sunlight exposure",
        
        # 5月龄特有
        "5月龄宝宝": "5 month old baby, reaching grabbing, interactive play",
        "宝宝护理": "baby care essentials, nurturing environment",
        
        # ══════════════════════════════════════════════════════════════════════
        # 春游/户外相关（新增）
        # ══════════════════════════════════════════════════════════════════════
        ("春游", "春游记", "spring outing", "spring trip"): "baby spring outing, family picnic, outdoor adventure, cherry blossoms",
        ("出行", "出行准备", "travel", "trip preparation"): "baby travel supplies, family outing preparation, infant gear",
        ("户外活动", "户外", "outdoor", "晒太阳"): "baby outdoor, fresh air, sunlight exposure, park scenery, green grass",
        ("婴儿衣物", "宝宝衣物", "衣物", "clothes", "outfit"): "baby clothes, cute onesie, baby outfit, cotton fabric, tiny clothes",
        ("宝宝帽子", "帽子", "sun hat", "headwear"): "baby sun hat, infant headwear, sun protection, cute baby hat",
        ("包被", "毯子", "blanket", "swaddle"): "baby blanket, swaddle, infant wrap, cozy fabric, soft blanket",
        ("防晒", "防暑", "sun protection", "sunscreen"): "baby sun protection, sun hat shade, UV protection, delicate skin care",
        ("防风", "防寒", "wind protection"): "wind protection, cozy baby, spring breeze, warm baby",
        ("婴儿防晒", "宝宝防晒"): "baby sunscreen, infant sun protection, delicate skin care, gentle formula",
        ("防蚊", "防虫", "mosquito", "防蚊虫"): "mosquito free baby, insect protection, safe outdoor, baby protection",
        ("公园", "city park", "park"): "city park, green grass, spring scenery, family walk, beautiful trees",
        ("花园", "植物园", "flower garden", "tulips", "花园"): "flower garden, tulips, cherry blossoms, spring bloom, colorful flowers",
        ("野餐", "picnic"): "family picnic, picnic blanket, outdoor meal, spring day, delicious food",
        ("婴儿车", "stroller", "pram"): "baby stroller, infant pram, walk in park, comfortable ride",
        ("亲子", "parent child", "亲子互动"): "parent baby bonding, family time, loving togetherness, warm family moment",
        ("拍照", "摄影", "photo", "photography"): "family photo, capturing moments, spring photography, beautiful memories",
        ("合影", "合照", "portrait", "group photo"): "family portrait, group photo, memorable moment, happy family",
        ("安全防护", "安全", "safety", "防护"): "baby safety, protective care, secure environment, safe baby",
        ("喂养用品", "喂养", "feeding supplies"): "baby feeding supplies, bottles, formula preparation, nursing essentials",
        ("护理用品", "护理", "care products"): "baby care products, diaper, wipes, skincare, baby essentials",
        ("目的地", "destination", "地点"): "travel destination, scenic spot, beautiful location, wonderful place",
    }
    
    # ══════════════════════════════════════════════════════════════════════
    # 通用映射
    # ══════════════════════════════════════════════════════════════════════
    visual_mappings = {
        # 模型/大脑
        "AI智能的大脑": "brain icon with circuit patterns",
        "理解需求": "magnifying glass over user needs",
        "逻辑推理": "logical flowchart, decision tree",
        "内容生成": "content creation workspace, document generation",
        "决策判断": "decision fork, choice visualization",
        
        # Harness/外壳
        "环境感知": "sensor network, environment monitoring",
        "工具调度": "tool toolbox, function calling",
        "错误恢复": "recovery button, error reset",
        "安全约束": "security shield, lock icon",
        
        # CIVC
        "约束": "boundary lines, constraint visualization",
        "定义边界": "scope definition, border concept",
        "防止失控": "control panel, emergency stop",
        "告知": "notification bell, information bubble",
        "注入上下文": "context injection, knowledge flow",
        "验证": "checkmark, verification stamp",
        "纠正": "correction arrow, improvement direction",
        "反馈回路": "circular arrow, feedback loop",
        
        # 架构层次
        "基础层": "foundation blocks, base layer",
        "组织层": "organization chart, hierarchy",
        "运行时层": "runtime engine, execution visualization",
        "治理层": "governance framework, policy shield",
        
        # 最佳实践
        "工具优先": "wrench and tools, tool-first icon",
        "单一职责": "single focus icon, one target",
        "外部化": "external file icon, separation symbol",
        "保持简单": "simplified design, minimal complexity",
        "容器化": "container box, packaging concept",
        "Clean架构": "clean layers, modular architecture",
        
        # 竞品
        "DevOps平台": "DevOps pipeline, CI/CD flow",
        "通用AI": "universal AI brain, general intelligence",
        "企业级": "enterprise building, corporate structure",
    }
    
    # 收集匹配的视觉元素（优先婴儿护理映射）
    matched_visuals = []
    for concept in key_concepts:
        # 先检查婴儿护理映射（支持tuple key）
        found = False
        for key, visual in baby_care_mappings.items():
            # 处理tuple类型的key
            if isinstance(key, tuple):
                if any(k in concept or concept in k for k in key):
                    matched_visuals.append(visual)
                    found = True
                    break
            else:
                if key in concept or concept in key:
                    matched_visuals.append(visual)
                    found = True
                    break
        if found:
            continue
        # 再检查通用映射
        for key, visual in visual_mappings.items():
            if key in concept:
                matched_visuals.append(visual)
                break
    
    # 如果没有精确匹配，使用概括性描述（不使用emoji和中文）
    if not matched_visuals:
        # 生成通用的婴儿主题描述
        return "cute baby illustration, soft pastel colors, spring theme, professional children's illustration"
    
    return ", ".join(matched_visuals[:3])


def build_prompt(slide_analysis, style_id, topic_hint=""):
    """构建高质量配图提示词 - 兼容V1版本"""
    result = build_prompt_v2(slide_analysis, style_id, topic_hint)
    return result["prompt"]


def plan_page_images(slides, topic_hint="", use_v2=True):
    """规划整个PPT的配图策略
    
    Args:
        slides: PPT内容列表
        topic_hint: 主题提示
        use_v2: 是否使用V2增强版提示词工程
                  V3: 使用内容感知版提示词（深度关联页面内容）
    
    Returns:
        dict: 每页的配图策略
    """
    if not slides:
        return {}
    
    # 1. 检测整体风格
    main_style = detect_style(slides)
    
    # 2. 分析每页内容并构建配图策略
    page_strategies = {}
    content_aware_count = 0  # 统计使用内容感知的页面数
    
    for i, slide in enumerate(slides):
        analysis = analyze_page_content(slide, i, len(slides))
        
        # 选择提示词生成策略
        if use_v2:
            # V3: 使用内容感知版（深度关联）
            prompt_result = build_content_aware_prompt(slide, analysis, main_style, topic_hint)
            prompt = prompt_result["prompt"]
            prompt_details = prompt_result
            content_aware_count += 1
        else:
            # V2: 使用V2增强版
            prompt_result = build_prompt_v2(analysis, main_style, topic_hint)
            prompt = prompt_result["prompt"]
            prompt_details = prompt_result
        
        # 获取图片类型信息
        img_type_info = IMAGE_TYPES.get(analysis["suggested_type"], IMAGE_TYPES["content_decoration"])
        
        # 确定是否需要配图（50%覆盖率目标）
        needs_image = _should_add_image(slide, analysis, i, len(slides), content_aware_count)
        
        page_strategies[i] = {
            "page_analysis": analysis,
            "slide": slide,  # 保存完整slide数据用于内容感知
            "style": main_style,
            "image_type": analysis["suggested_type"],
            "image_type_name": img_type_info["name"],
            "prompt": prompt,
            "prompt_details": prompt_details,
            "position": img_type_info["position"],
            "size": img_type_info["size"],
            "needs_image": needs_image,
            "use_content_aware": use_v2
        }
    
    return page_strategies


def _should_add_image(slide, analysis, index, total, current_count):
    """判断当前页面是否应该添加配图（目标50%覆盖率）
    
    规则：
    1. 封面和结尾必须有配图
    2. section类型优先配图（过渡页需要视觉强调）
    3. content_cards类型按50%覆盖率分配
    4. 图形图示类型（icons_grid/process_flow/comparison）不配图
    5. 已达50%后不再添加
    
    Args:
        slide: 幻灯片数据
        analysis: 分析结果
        index: 当前页索引
        total: 总页数
        current_count: 已规划配图的页面数
    
    Returns:
        bool: 是否应该添加配图
    """
    slide_type = slide.get('type', 'content_cards')
    
    # 封面和结尾必须有配图
    if index == 0 or index == total - 1:
        return True
    
    # 图形图示类型不配图（内容本身已是图形）
    if slide_type in ['icons_grid', 'process_flow', 'comparison', 'radar', 'funnel']:
        return False
    
    # section类型优先配图（过渡页需要视觉强调）
    if slide_type == 'section':
        # section页面应该有配图，除非已经达到很高的覆盖率
        # section是重要的过渡页，应该有视觉强调
        return current_count < total * 0.6
    
    # content_cards类型按50%覆盖率
    if slide_type == 'content_cards':
        # 计算还需要多少配图达到50%
        remaining_pages = total - index - 1
        needed_images = int(remaining_pages * 0.5)
        current_needed = current_count + needed_images
        
        # 如果当前覆盖率低于50%，添加配图
        if current_count < total * 0.5:
            return True
    
    return False


def get_image_path_for_page(page_strategy, style_id):
    """根据配图策略返回对应的本地图片路径（如果有的话）
    
    这是V1版本的fallback，使用预设图片
    V2版本会直接调用AI生成
    """
    # 目前返回None，由PPT生成器决定是否使用预设图片
    return None


# ══════════════════════════════════════════════════════════════
# 测试
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # 测试数据
    test_slides = [
        {"type": "title", "title": "AI时代的技能炼金术"},
        {"type": "content", "title": "为什么需要V9.0", "items": [{"title": "问题", "value": "效率低"}]},
        {"type": "radar", "title": "五大维度评估", "items": [
            {"title": "准确性", "value": 95},
            {"title": "完整性", "value": 92}
        ]},
        {"type": "content", "title": "V9.0核心模块", "items": []},
        {"type": "closing", "title": "谢谢"}
    ]
    
    print("测试配图规划：")
    print("=" * 60)
    
    strategies = plan_page_images(test_slides, "AI技能体系")
    
    for page_idx, strategy in strategies.items():
        print(f"\n第{page_idx + 1}页:")
        print(f"  类型: {strategy['image_type']}")
        print(f"  风格: {IMAGE_STYLES[strategy['style']]['name']}")
        print(f"  位置: {strategy['position']}")
        print(f"  提示词: {strategy['prompt'][:80]}...")


# ══════════════════════════════════════════════════════════════
# 配图概念推荐
# ══════════════════════════════════════════════════════════════

IMAGE_CONCEPTS = {
    "background": {
        "name": "背景与定位",
        "concepts": ["puzzle pieces connecting", "building blocks foundation"],
        "elements": ["architecture", "construction", "structure"]
    },
    "assessment": {
        "name": "评估体系",
        "concepts": ["radar chart visualization", "quality checkpoints", "shield with metrics"],
        "elements": ["measurement", "evaluation", "verification", "gauge meters"]
    },
    "modules": {
        "name": "核心模块",
        "concepts": ["building blocks", "modular components", "hexagonal units"],
        "elements": ["modular", "components", "lego pieces", "integration"]
    },
    "triggers": {
        "name": "触发机制",
        "concepts": ["lightning activation", "signal radar waves", "neural recognition"],
        "elements": ["activation", "recognition", "detection", "trigger"]
    },
    "standards": {
        "name": "输出规范",
        "concepts": ["ruler and compass", "standards documentation", "quality blueprint"],
        "elements": ["standardization", "quality", "documentation", "rules"]
    },
    "quality": {
        "name": "质量门禁",
        "concepts": ["security shield", "checkpoint gate", "quality inspection badge"],
        "elements": ["security", "verification", "approval", "checklist"]
    },
    "summary": {
        "name": "总结",
        "concepts": ["target bullseye", "achievement trophy", "success metrics"],
        "elements": ["achievement", "success", "completion", "target"]
    },
    "process": {
        "name": "流程",
        "concepts": ["gear mechanism", "workflow arrows", "process chain"],
        "elements": ["workflow", "process", "sequence", "steps"]
    },
    "comparison": {
        "name": "对比",
        "concepts": ["scales balance", "versus badges", "comparison chart"],
        "elements": ["comparison", "contrast", "difference", "before_after"]
    },
    "workflow": {
        "name": "工作流",
        "concepts": ["circular workflow", "connected nodes", "process pipeline"],
        "elements": ["workflow", "pipeline", "sequence", "automation"]
    },
    "tech_future": {
        "name": "科技未来",
        "concepts": ["neural network", "digital grid", "tech abstraction"],
        "elements": ["technology", "future", "innovation", "digital"]
    }
}


def get_image_concept_for_page(title, items, page_type):
    """根据页面内容推荐配图概念"""
    title_lower = title.lower()
    items_text = " ".join([
        str(item.get("title", "")) + " " + str(item.get("value", ""))
        for item in items
    ]).lower()
    
    # 根据关键词匹配
    if "维度" in title or "评估" in title or "准确性" in title:
        return IMAGE_CONCEPTS["assessment"]
    elif "模块" in title or "核心" in title:
        return IMAGE_CONCEPTS["modules"]
    elif "触发" in title:
        return IMAGE_CONCEPTS["triggers"]
    elif "规范" in title or "标准" in title:
        return IMAGE_CONCEPTS["standards"]
    elif "质量" in title or "门禁" in title or "检查" in title:
        return IMAGE_CONCEPTS["quality"]
    elif "总结" in title or "要点" in title:
        return IMAGE_CONCEPTS["summary"]
    elif "流程" in title or "步骤" in title or "工作流" in title:
        return IMAGE_CONCEPTS["workflow"]
    elif "对比" in title or "比较" in title:
        return IMAGE_CONCEPTS["comparison"]
    elif "背景" in title or "定位" in title:
        return IMAGE_CONCEPTS["background"]
    elif page_type == "title":
        return IMAGE_CONCEPTS["tech_future"]
    elif page_type == "closing":
        return IMAGE_CONCEPTS["summary"]
    else:
        return IMAGE_CONCEPTS["tech_future"]


# ══════════════════════════════════════════════════════════════════════════════
# V2.0 图片收集与工作流模块（V4.8.0新增）
# ══════════════════════════════════════════════════════════════════════════════
"""
图片工作流说明：
1. 使用 image_generate 工具生成图片
2. 图片保存路径: /home/gem/workspace/agent/media/tool-image-generation/
3. 每生成一张图片后立即收集（不要等待）
4. 用页面索引命名: page_00.png, page_01.png, ...
5. 建立 page_index → image_path 的映射表
6. 将映射表传给 create_ppt_v3_with_images() 的 page_image_configs 参数

正确的工作流示例：
```python
from image_planner import plan_page_images, ImageWorkflow

# 1. 规划配图
strategies = plan_page_images(slides, topic_hint="xxx")

# 2. 逐页生成并收集图片
workflow = ImageWorkflow(output_dir="/tmp/my_ppt")
for idx, strategy in strategies.items():
    if strategy['needs_image']:
        # 调用 image_generate(prompt=strategy['prompt'])
        # 生成后立即调用:
        workflow.collect_image(idx, strategy)
        
# 3. 获取映射表
mapping = workflow.get_page_image_configs()

# 4. 传给PPT生成函数
create_ppt_v3_with_images(
    slides=slides,
    page_image_configs=mapping,
    auto_plan_images=False
)
```
"""

import os
import shutil


class ImageWorkflow:
    """
    图片工作流管理类
    用于管理PPT配图的生成、收集和映射
    
    【V4.10.1 修复 PPT-20260419-001】
    - collect_image() 不再复制图片到 /tmp/ 目录
    - 直接使用 IMAGE_SOURCE_DIR 的原始路径，避免目录被清理后路径失效
    """
    
    # 图片保存的正确路径（V4.8.0修正）
    IMAGE_SOURCE_DIR = "/home/gem/workspace/agent/media/tool-image-generation"
    
    def __init__(self, output_dir: str = "/tmp/ppt_images"):
        """
        初始化工作流
        
        Args:
            output_dir: 图片输出目录（已弃用，保留向后兼容，collect_image 不再使用此路径）
        """
        self.output_dir = output_dir
        self.mapping = {}  # {page_index: {"path": xxx, "position": xxx}}
        self._ensure_output_dir()
    
    def _ensure_output_dir(self):
        """确保输出目录存在"""
        os.makedirs(self.output_dir, exist_ok=True)
    
    def _get_latest_image(self) -> str:
        """
        获取最新生成的图片路径
        
        Returns:
            最新图片的完整路径，如果没有找到返回None
        """
        if not os.path.exists(self.IMAGE_SOURCE_DIR):
            print(f"⚠️ 图片目录不存在: {self.IMAGE_SOURCE_DIR}")
            return None
        
        # 获取所有png文件，按修改时间排序
        png_files = [
            os.path.join(self.IMAGE_SOURCE_DIR, f)
            for f in os.listdir(self.IMAGE_SOURCE_DIR)
            if f.endswith('.png')
        ]
        
        if not png_files:
            return None
        
        # 按修改时间倒序，返回最新的
        png_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        return png_files[0]
    
    def collect_image(self, page_index: int, strategy: dict = None, force_position: str = None):
        """
        收集最新生成的图片并分配给指定页面
        
        Args:
            page_index: 页面索引
            strategy: 配图策略（包含needs_image, position等信息）
            force_position: 强制指定位置（"background"或"right_image"）
        """
        latest_image = self._get_latest_image()
        
        if not latest_image:
            print(f"⚠️ 页面 {page_index}: 未找到生成的图片")
            return False
        
        # 确定图片位置
        if force_position:
            position = force_position
        elif strategy and strategy.get('position'):
            position = strategy['position']
        else:
            # 根据策略判断位置
            position = "right_image"
        
        # 【PPT-20260419-001 修复】不再复制到 /tmp/ 目录（会被清理导致路径失效）
        # 直接使用原始图片路径
        original_path = latest_image
        
        # 记录映射（使用原始路径，不复制）
        self.mapping[page_index] = {
            "path": original_path,
            "position": position
        }
        
        print(f"✅ 页面 {page_index}: {os.path.basename(original_path)} ({position})")
        return True
    
    def collect_all_images(self, strategies: dict, slides: list):
        """
        根据策略自动收集所有需要的配图
        
        Args:
            strategies: plan_page_images()返回的策略字典
            slides: slides列表（用于判断页面类型）
        
        Returns:
            收集到的图片数量
        """
        count = 0
        for idx, strategy in strategies.items():
            if strategy.get('needs_image', False):
                # 判断页面类型，决定图片位置
                if idx < len(slides):
                    slide_type = slides[idx].get('type', '')
                    if slide_type in ['title', 'closing', 'section']:
                        strategy['position'] = 'background'  # 全屏背景
                    else:
                        strategy['position'] = 'right_image'  # 右侧图片
                
                if self.collect_image(idx, strategy):
                    count += 1
        
        return count
    
    def get_page_image_configs(self) -> dict:
        """
        获取页面配图配置（用于传给create_ppt_v3_with_images）
        
        Returns:
            {page_index: {"path": xxx, "position": xxx}, ...}
        """
        return self.mapping
    
    def print_mapping_table(self, slides: list = None):
        """
        打印配图映射表
        
        Args:
            slides: slides列表（用于显示页面标题）
        """
        print("\n" + "=" * 70)
        print("配图映射表")
        print("=" * 70)
        print(f"{'页面':<6} {'标题':<25} {'位置':<12} {'图片文件'}")
        print("-" * 70)
        
        for idx in sorted(self.mapping.keys()):
            config = self.mapping[idx]
            title = ""
            if slides and idx < len(slides):
                slide = slides[idx]
                title = slide.get('title', '') or slide.get('main', '') or ''
                title = title[:23]
            
            filename = os.path.basename(config['path'])
            print(f"{idx:<6} {title:<25} {config['position']:<12} {filename}")
        
        print("=" * 70)
        print(f"共 {len(self.mapping)} 张配图")
        print()


# ══════════════════════════════════════════════════════════════════════════════
# 便捷函数
# ══════════════════════════════════════════════════════════════════════════════


def collect_latest_image(output_path: str) -> str:
    """
    收集最新生成的图片到指定路径
    
    Args:
        output_path: 输出文件路径（包括文件名）
    
    Returns:
        输出文件路径，失败返回None
    """
    workflow = ImageWorkflow()
    latest = workflow._get_latest_image()
    
    if latest:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        shutil.copy2(latest, output_path)
        return output_path
    
    return None


def create_page_image_mapping(
    slides: list,
    output_dir: str = "/tmp/ppt_images",
    topic_hint: str = ""
) -> dict:
    """
    为PPT创建完整的页面配图映射
    
    Args:
        slides: PPT的slides列表
        output_dir: 图片输出目录
        topic_hint: 主题提示词
    
    Returns:
        page_image_configs字典，可直接传给create_ppt_v3_with_images
    """
    # 1. 规划配图策略
    strategies = plan_page_images(slides, topic_hint)
    
    # 2. 创建工作流
    workflow = ImageWorkflow(output_dir)
    
    # 3. 打印策略（供外部生成图片参考）
    print_mapping_suggestions(strategies, slides)
    
    # 4. 返回空的映射（图片需要外部生成后收集）
    return workflow.mapping, strategies


def print_mapping_suggestions(strategies: dict, slides: list):
    """
    打印配图建议（供外部生成图片参考）
    
    Args:
        strategies: 配图策略字典
        slides: slides列表
    """
    print("\n" + "=" * 70)
    print("配图策略建议（请逐页生成图片）")
    print("=" * 70)
    
    for idx, strategy in strategies.items():
        if strategy.get('needs_image'):
            title = ""
            if idx < len(slides):
                slide = slides[idx]
                title = slide.get('title', '') or slide.get('main', '') or ''
            
            slide_type = slides[idx].get('type', '') if idx < len(slides) else ''
            position = "background" if slide_type in ['title', 'closing', 'section'] else "right_image"
            
            print(f"\n[页面 {idx}] {title[:25]}")
            print(f"  位置: {position}")
            print(f"  提示词: {strategy['prompt'][:100]}...")
    
    print("\n" + "=" * 70)
    print("生成图片后，调用 ImageWorkflow().collect_image(idx) 收集图片")
    print("=" * 70)
