#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT技能调用入口 V5.0
提供标准化的PPT生成接口

【版本信息】
- 版本: V5.0.0
- 更新日期: 2026-04-08
- 核心: 设计系统集成 + 内容先行 + 智能配图

【V5.0 核心升级：设计系统集成】
- 6 套预设主题（executive/clean/spark/terminal/gradient/warm）
- 支持自定义设计系统（通过 DesignSystem 类）
- 渐进式兼容：theme='gradient' 和 design_system=DesignSystem() 两种方式

【V4.4 → V5.0 升级点】
1. 集成 design_system.py 设计系统加载器
2. generate_ppt() 支持 design_system 参数
3. PPTMaker 支持 design_system 参数
4. 保留向后兼容（theme='xxx' 仍然有效）
5. 新增 design_ppt() 函数，支持从 DESIGN.md 生成

【约束条件】
- 【重要】必须先有内容，再做PPT（内容先行原则）
- 配图覆盖率必须 >= 50%
- 内容需要保真导入，不删减
- 最大支持100页PPT

【调用方式】
# 方式1：使用预设主题（保持兼容）
from generate_ppt_entry import generate_ppt
result = generate_ppt(content="Markdown文本", title="标题", theme='gradient')

# 方式2：使用设计系统（推荐）
from generate_ppt_entry import generate_ppt, DesignSystem
ds = DesignSystem('gradient')
ds.config['colors']['accent'] = '#FF6B6B'  # 自定义强调色
result = generate_ppt(content="Markdown文本", title="标题", design_system=ds)

# 方式3：使用 PPTMaker
from generate_ppt_entry import PPTMaker
maker = PPTMaker(theme='spark')
result = maker.make(content="Markdown文本", title="标题")

# 方式4：从 DESIGN.md 生成
from generate_ppt_entry import design_ppt
result = design_ppt(content="Markdown文本", design_md_path="/path/to/design.md")

# 方式5：【推荐】完整工作流（设计系统 + 内容 + 配图）
from generate_ppt_entry import DesignSystem, PPTMaker
ds = DesignSystem('gradient', scene='ai_product')
maker = PPTMaker(design_system=ds)
result = maker.make_with_images(content=content, title=title, image_paths={...})
"""

import sys
import os
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

# 添加模块路径
sys.path.insert(0, '/home/gem/workspace/agent/skills/miaoda-ppt-maker')

from content_adapter import text_to_slides, structure_to_slides, any_to_slides, ContentAdapter
from generate_ppt import create_ppt_v3_with_images, THEMES as PPT_THEMES
from image_planner import plan_page_images

# ══════════════════════════════════════════════════════════════
# 【V5.0 新增】导入设计系统
# ══════════════════════════════════════════════════════════════

try:
    from design_system import DesignSystem, PRESET_THEMES, list_themes, get_theme_info
    HAS_DESIGN_SYSTEM = True
except ImportError:
    HAS_DESIGN_SYSTEM = False
    DesignSystem = None


# ══════════════════════════════════════════════════════════════
# 版本信息
# ══════════════════════════════════════════════════════════════

__version__ = "V5.0.0"
__version_date__ = "2026-04-09"


# ══════════════════════════════════════════════════════════════
# 配置常量
# ══════════════════════════════════════════════════════════════

DEFAULT_OUTPUT_DIR = '/home/gem/workspace/agent/workspace/ppt-output'
DEFAULT_THEME = 'clean'
DEFAULT_IMAGE_RATE = 0.5


# ══════════════════════════════════════════════════════════════
# 配色转换工具函数
# ══════════════════════════════════════════════════════════════

def _to_rgbcolor(val):
    """将各种格式转为 RGBColor"""
    from pptx.dml.color import RGBColor
    
    if val is None:
        return RGBColor(0, 0, 0)
    
    if hasattr(val, 'rgb'):  # 已经是 RGBColor
        return val
    if isinstance(val, tuple) and len(val) == 3:
        return RGBColor(val[0], val[1], val[2])
    if isinstance(val, str) and val.startswith('#'):
        hex_color = val.lstrip('#')
        if len(hex_color) == 6:
            return RGBColor(
                int(hex_color[0:2], 16),
                int(hex_color[2:4], 16),
                int(hex_color[4:6], 16)
            )
    
    return RGBColor(0, 0, 0)


def _apply_design_system_to_themes(design_system: 'DesignSystem', theme_name: str = None):
    """将设计系统应用到 PPT_THEMES
    
    Args:
        design_system: DesignSystem 实例
        theme_name: 要覆盖的主题名称（默认覆盖默认主题）
    """
    if not HAS_DESIGN_SYSTEM or design_system is None:
        return
    
    # 转换为 PPTX 格式
    raw_colors = design_system.to_pptx_colors()
    
    # 构建主题配置
    pptx_colors = {}
    for key, val in raw_colors.items():
        pptx_colors[key] = _to_rgbcolor(val)
    
    # 注入到 THEMES
    theme_key = theme_name or design_system.config.get('name', 'custom').lower().replace(' ', '_')
    PPT_THEMES[theme_key] = pptx_colors


# ══════════════════════════════════════════════════════════════
# 【V5.0 新增】统一入口函数
# ══════════════════════════════════════════════════════════════

def design_ppt(
    content: Union[str, Dict, List],
    title: str = None,
    design_system: 'DesignSystem' = None,
    theme: str = None,
    **kwargs
) -> Dict[str, Any]:
    """【V5.0 核心】使用设计系统生成 PPT
    
    这是推荐的使用方式，支持：
    1. 预设主题 + 自定义配置
    2. 从 DESIGN.md 加载
    3. 完全自定义设计系统
    
    Args:
        content: PPT 内容（Markdown/结构化/列表）
        title: PPT 标题
        design_system: DesignSystem 实例（推荐）
        theme: 主题名称（快捷方式，与 design_system 二选一）
        **kwargs: 其他参数（见 generate_ppt）
    
    Returns:
        {
            "success": bool,
            "output_path": str,
            "theme_info": {...},  # 主题信息
            ...
        }
    """
    # 1. 处理设计系统
    ds = design_system
    actual_theme = theme
    
    if ds is None and theme:
        # 从预设加载主题
        if HAS_DESIGN_SYSTEM and theme in list_themes():
            ds = DesignSystem(theme)
            actual_theme = theme
        else:
            # 使用传统方式
            actual_theme = theme
    
    # 2. 如果有设计系统，应用到 THEMES
    if ds is not None:
        _apply_design_system_to_themes(ds, actual_theme)
        # 使用设计系统的名称作为 theme key
        theme_key = ds.config.get('name', 'custom').lower().replace(' ', '_')
        actual_theme = theme_key
    
    # 3. 调用 generate_ppt
    result = generate_ppt(
        content=content,
        title=title,
        theme=actual_theme,
        design_system=ds,
        **kwargs
    )
    
    # 4. 添加主题信息到结果
    if ds is not None:
        result['theme_info'] = ds.get_theme_info()
        result['theme_colors'] = {
            'primary': ds.get_color_hex('primary'),
            'accent': ds.get_color_hex('accent'),
            'text': ds.get_color_hex('text_primary'),
        }
    
    return result


# ══════════════════════════════════════════════════════════════
# 【V5.0 增强】generate_ppt 函数
# ══════════════════════════════════════════════════════════════

def generate_ppt(
    content: Union[str, Dict, List],
    title: str = None,
    subtitle: str = None,
    theme: str = None,
    design_system: 'DesignSystem' = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    with_images: bool = False,
    image_prompts: List[Dict] = None,
    preserve: bool = True,
    **kwargs
) -> Dict[str, Any]:
    """生成PPT的便捷函数
    
    【V5.0 升级】
    - 支持 design_system 参数
    - 自动应用设计系统到 THEMES
    - 保留向后兼容（theme 参数仍然有效）
    
    Args:
        content: 输入内容（Markdown文本/结构化Dict/slides列表）
        title: PPT标题（用于文件名和封面）
        subtitle: 副标题（用于封面）
        theme: 配色主题 (clean/executive/spark/terminal/gradient/warm)
        design_system: 【V5.0新增】设计系统实例（覆盖theme）
        output_dir: 输出目录
        with_images: 是否启用AI配图规划
        image_prompts: 配图提示词列表 [{"page": 0, "prompt": "...", "path": "/path/to/image.png"}]
        preserve: 是否保真导入（默认True）
    
    Returns:
        {
            "success": bool,
            "output_path": str,
            "slides_count": int,
            "images_count": int,
            "image_plans": [...],  # 配图规划列表
            "theme_info": {...},   # 【V5.0新增】主题信息
            "message": str
        }
    """
    try:
        # 1. 处理设计系统
        actual_theme = theme or 'clean'
        
        if design_system is not None:
            # 【V5.0】应用设计系统
            _apply_design_system_to_themes(design_system, actual_theme)
            # 使用设计系统名称作为 theme key
            theme_key = design_system.config.get('name', 'custom').lower().replace(' ', '_')
            actual_theme = theme_key
            
        elif theme and HAS_DESIGN_SYSTEM and theme in list_themes():
            # 从预设加载设计系统（如果可用）
            ds = DesignSystem(theme)
            _apply_design_system_to_themes(ds, actual_theme)
        
        # 2. 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 3. 生成文件名
        if title:
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_title = safe_title[:30]
        else:
            safe_title = f"PPT_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        filename = f"{safe_title}.pptx"
        output_path = os.path.join(output_dir, filename)
        
        # 4. 内容解析
        topic_hint = title or subtitle or ""
        if isinstance(content, str):
            slides = _parse_raw_markdown(content, topic_hint)
        elif isinstance(content, dict):
            if "slides" in content:
                slides = any_to_slides(content, preserve=preserve)
            else:
                slides = structure_to_slides(content, preserve=preserve)
        elif isinstance(content, list):
            slides = any_to_slides(content, preserve=preserve)
        else:
            return {
                "success": False,
                "message": f"不支持的内容类型: {type(content)}"
            }
        
        slides_count = len(slides)
        
        # 5. 配图规划
        image_plans = []
        page_images = {}
        images_count = 0
        
        if with_images:
            plans_dict = plan_page_images(slides, topic_hint=topic_hint, use_v2=True)
            
            for page_idx, plan in plans_dict.items():
                if plan.get('needs_image', False):
                    image_plans.append({
                        "page": page_idx,
                        "page_type": plan.get('slide', {}).get('type', 'content'),
                        "concept": plan.get('image_type', 'unknown'),
                        "prompt": plan.get('prompt', ''),
                        "position": plan.get('position', 'right'),
                        "size": plan.get('size', 'medium'),
                        "path": None
                    })
            
            if image_prompts:
                for img_config in image_prompts:
                    page_idx = img_config.get("page", 0)
                    img_path = img_config.get("path")
                    if img_path and os.path.exists(img_path):
                        page_images[page_idx] = img_path
                        images_count += 1
                        for plan in image_plans:
                            if plan["page"] == page_idx:
                                plan["path"] = img_path
        
        # 6. 生成PPT
        result_path = create_ppt_v3_with_images(
            slides=slides,
            output_path=output_path,
            theme=actual_theme,
            page_images=page_images,
            auto_plan_images=False
        )
        
        # 7. 返回结果
        file_size = os.path.getsize(result_path) if os.path.exists(result_path) else 0
        
        result = {
            "success": True,
            "output_path": result_path,
            "file_name": filename,
            "slides_count": slides_count,
            "images_count": images_count,
            "image_plans": image_plans if with_images else [],
            "file_size_kb": round(file_size / 1024, 1),
            "theme": actual_theme,
            "preserve_mode": preserve,
            "version": __version__,
            "message": f"PPT生成成功！{slides_count}页，{images_count}张配图"
        }
        
        # 【V5.0 新增】添加主题信息
        if design_system is not None:
            result["theme_info"] = design_system.get_theme_info()
            result["theme_colors"] = {
                "primary": design_system.get_color_hex('primary'),
                "accent": design_system.get_color_hex('accent'),
                "text": design_system.get_color_hex('text_primary'),
            }
        elif HAS_DESIGN_SYSTEM and theme in list_themes():
            ds = DesignSystem(theme)
            result["theme_info"] = ds.get_theme_info()
            result["theme_colors"] = {
                "primary": ds.get_color_hex('primary'),
                "accent": ds.get_color_hex('accent'),
                "text": ds.get_color_hex('text_primary'),
            }
        
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"PPT生成失败: {str(e)}",
            "error": str(e),
            "version": __version__
        }


# ══════════════════════════════════════════════════════════════
# 【V5.0 增强】PPTMaker 类
# ══════════════════════════════════════════════════════════════

class PPTMaker:
    """PPT制作器 V5.0 - 支持设计系统的完整PPT生成"""
    
    def __init__(
        self,
        theme: str = None,
        design_system: 'DesignSystem' = None,
        output_dir: str = DEFAULT_OUTPUT_DIR,
        preserve: bool = True
    ):
        """
        Args:
            theme: 配色主题 (clean/executive/spark/terminal/gradient/warm)
            design_system: 【V5.0新增】设计系统实例（覆盖theme）
            output_dir: 输出目录
            preserve: 是否保真导入
        """
        self.theme = theme
        self.design_system = design_system
        self.output_dir = output_dir
        self.preserve = preserve
        self.adapter = ContentAdapter(preserve=preserve)
        
        # 【V5.0】应用设计系统
        if self.design_system is not None:
            _apply_design_system_to_themes(self.design_system, self.theme)
            theme_key = self.design_system.config.get('name', 'custom').lower().replace(' ', '_')
            self.theme = theme_key
        elif self.theme and HAS_DESIGN_SYSTEM and self.theme in list_themes():
            ds = DesignSystem(self.theme)
            _apply_design_system_to_themes(ds, self.theme)
    
    def make(
        self,
        content: Union[str, Dict, List],
        title: str = None,
        subtitle: str = None,
        with_images: bool = False,
        image_prompts: List[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """制作PPT
        
        Args:
            content: 输入内容
            title: 标题
            subtitle: 副标题
            with_images: 是否启用AI配图规划
            image_prompts: 配图配置
        
        Returns:
            生成结果
        """
        return generate_ppt(
            content=content,
            title=title,
            subtitle=subtitle,
            theme=self.theme,
            design_system=self.design_system,
            output_dir=self.output_dir,
            with_images=with_images,
            image_prompts=image_prompts,
            preserve=self.preserve,
            **kwargs
        )
    
    def make_with_plan(
        self,
        content: Union[str, Dict, List],
        title: str = None,
        subtitle: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """制作PPT（仅规划配图，不生成配图）
        
        返回配图规划列表，供后续AI生图使用
        
        Returns:
            {
                "success": True,
                "slides_count": int,
                "image_plans": [...],
                "steps": [...]
            }
        """
        topic_hint = title or subtitle or ""
        
        # 内容解析
        if isinstance(content, str):
            slides = _parse_raw_markdown(content, topic_hint)
        elif isinstance(content, dict):
            if "slides" in content:
                slides = any_to_slides(content, preserve=self.preserve)
            else:
                slides = structure_to_slides(content, preserve=self.preserve)
        elif isinstance(content, list):
            slides = any_to_slides(content, preserve=self.preserve)
        else:
            return {
                "success": False,
                "message": f"不支持的内容类型: {type(content)}"
            }
        
        # 配图规划
        plans_dict = plan_page_images(slides, topic_hint=topic_hint, use_v2=True)
        image_plans = []
        for page_idx, plan in plans_dict.items():
            if plan.get('needs_image', False):
                image_plans.append({
                    "page": page_idx,
                    "page_type": plan.get('slide', {}).get('type', 'content'),
                    "concept": plan.get('image_type', 'unknown'),
                    "prompt": plan.get('prompt', ''),
                    "position": plan.get('position', 'right'),
                    "size": plan.get('size', 'medium'),
                })
        
        return {
            "success": True,
            "slides_count": len(slides),
            "image_plans": image_plans,
            "theme_info": self.design_system.get_theme_info() if self.design_system else {"name": self.theme},
            "steps": [
                "✅ 步骤1: 内容解析完成",
                "✅ 步骤2: 配图规划完成",
                f"   → 规划 {len(image_plans)} 张配图",
                "⏳ 步骤3: 使用 image_generate 生成配图",
                "⏳ 步骤4: 调用 make_with_images 完成PPT"
            ]
        }
    
    def make_with_images(
        self,
        content: Union[str, Dict, List],
        title: str = None,
        subtitle: str = None,
        image_paths: Dict[int, str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """使用已有配图制作PPT
        
        Args:
            content: 输入内容
            title: 标题
            subtitle: 副标题
            image_paths: 配图路径字典 {page_index: image_path}
        
        Returns:
            生成结果
        """
        image_prompts = []
        if image_paths:
            for page_idx, img_path in image_paths.items():
                image_prompts.append({"page": page_idx, "path": img_path})
        
        return self.make(
            content=content,
            title=title,
            subtitle=subtitle,
            with_images=True,
            image_prompts=image_prompts,
            **kwargs
        )
    
    def get_theme_preview(self) -> Dict[str, Any]:
        """获取主题预览信息"""
        if self.design_system:
            return {
                "name": self.design_system.config.get('name'),
                "description": self.design_system.config.get('description'),
                "mood": self.design_system.config.get('mood'),
                "scene": self.design_system.config.get('scene'),
                "colors": {
                    "primary": self.design_system.get_color_hex('primary'),
                    "accent": self.design_system.get_color_hex('accent'),
                    "text": self.design_system.get_color_hex('text_primary'),
                }
            }
        elif HAS_DESIGN_SYSTEM and self.theme in list_themes():
            ds = DesignSystem(self.theme)
            return {
                "name": ds.config.get('name'),
                "description": ds.config.get('description'),
                "mood": ds.config.get('mood'),
                "scene": ds.config.get('scene'),
                "colors": {
                    "primary": ds.get_color_hex('primary'),
                    "accent": ds.get_color_hex('accent'),
                    "text": ds.get_color_hex('text_primary'),
                }
            }
        else:
            return {
                "name": self.theme,
                "description": "自定义主题"
            }


# ══════════════════════════════════════════════════════════════
# 【V5.0 新增】快速创建函数
# ══════════════════════════════════════════════════════════════

def create_ppt_maker(
    theme: str = None,
    design_system: 'DesignSystem' = None,
    **kwargs
) -> PPTMaker:
    """快速创建 PPTMaker 实例
    
    Args:
        theme: 主题名称
        design_system: 设计系统实例
    
    Returns:
        PPTMaker 实例
    """
    return PPTMaker(theme=theme, design_system=design_system, **kwargs)


def list_available_themes() -> List[Dict[str, str]]:
    """列出所有可用主题"""
    if not HAS_DESIGN_SYSTEM:
        return [
            {"id": "clean", "name": "Clean", "description": "简约专业风格"},
            {"id": "executive", "name": "Executive", "description": "商务汇报风格"},
            {"id": "spark", "name": "Spark", "description": "科技创业风格"},
            {"id": "terminal", "name": "Terminal", "description": "极客技术风格"},
        ]
    
    themes = []
    for theme_id in list_themes():
        info = get_theme_info(theme_id)
        themes.append({
            "id": theme_id,
            "name": info.get('name', theme_id),
            "description": info.get('description', ''),
            "mood": info.get('mood', ''),
            "scene": info.get('scene', ''),
        })
    return themes


# ══════════════════════════════════════════════════════════════
# 保留旧函数（向后兼容）
# ══════════════════════════════════════════════════════════════

def generate_ppt_with_content(
    topic: str,
    title: str = None,
    context: Dict = None,
    theme: str = None,
    **kwargs
) -> Dict[str, Any]:
    """【V4.3兼容】内容先行的PPT制作"""
    context = context or {}
    return generate_ppt(
        content=context.get('content'),
        title=title or topic,
        theme=theme,
        **kwargs
    )


# ══════════════════════════════════════════════════════════════
# 技能编排系统集成接口
# ══════════════════════════════════════════════════════════════

def skill_entry(query: str, context: Dict = None) -> Dict[str, Any]:
    """技能编排系统调用的入口函数
    
    Args:
        query: 用户的原始请求
        context: 上下文信息
    
    Returns:
        技能执行结果
    """
    context = context or {}
    
    # 1. 解析请求
    content = context.get("content")
    theme = context.get("theme")
    design_system_config = context.get("design_system")
    
    # 2. 处理设计系统
    ds = None
    if design_system_config:
        # 从配置创建设计系统
        if isinstance(design_system_config, dict):
            theme_name = design_system_config.get('theme', 'clean')
            if HAS_DESIGN_SYSTEM:
                ds = DesignSystem(theme_name)
                # 应用自定义配置
                if 'colors' in design_system_config:
                    ds.config['colors'].update(design_system_config['colors'])
                if 'layout' in design_system_config:
                    ds.config['layout'].update(design_system_config['layout'])
        elif isinstance(design_system_config, str) and HAS_DESIGN_SYSTEM:
            ds = DesignSystem(design_system_config)
    
    if content:
        title = context.get("title") or _extract_title_from_query(query)
        return generate_ppt(
            content=content,
            title=title,
            subtitle=context.get("subtitle"),
            theme=theme,
            design_system=ds,
            with_images=context.get("with_images", False),
            preserve=True
        )
    else:
        return {
            "success": False,
            "action": "need_content",
            "message": "请提供PPT内容",
            "query": query,
            "available_themes": list_available_themes()
        }


def _extract_title_from_query(query: str) -> str:
    """从用户query中提取标题"""
    for prefix in ["做个", "做个", "帮我做", "帮我生成", "生成一个", "制作"]:
        if query.startswith(prefix):
            query = query[len(prefix):]
    
    for suffix in ["的PPT", "PPT", "的汇报", "汇报", "的演示", "演示", "的幻灯片"]:
        if query.endswith(suffix):
            query = query[:-len(suffix)]
    
    return query.strip()


def _parse_raw_markdown(markdown_text: str, topic: str = "") -> List[Dict]:
    """将原始Markdown解析为slides结构"""
    import re
    
    slides = []
    lines = markdown_text.strip().split('\n')
    
    current_section = None
    current_items = []
    current_page_title = ""
    current_group = None
    
    def _flush_items():
        nonlocal current_items, current_section, current_group
        if current_items:
            total_chars = sum(len(item.get('text', '')) for item in current_items)
            item_count = len(current_items)
            
            has_group_header = any(item.get('is_group_header') for item in current_items)
            
            if has_group_header and item_count <= 3:
                slides.append({
                    "type": "content_cards",
                    "title": current_section or topic,
                    "subtitle": current_group,
                    "items": current_items,
                    "layout": "compact"
                })
            elif item_count <= 2 and total_chars > 300:
                full_text = '\n'.join(item.get('text', '') for item in current_items)
                slides.append({
                    "type": "content_paragraph",
                    "title": current_section or topic,
                    "content": full_text,
                    "layout": "full"
                })
            elif item_count <= 4:
                slides.append({
                    "type": "content_cards",
                    "title": current_section or topic,
                    "items": current_items,
                    "layout": "grid"
                })
            elif item_count <= 8:
                slides.append({
                    "type": "content_cards",
                    "title": current_section or topic,
                    "items": current_items,
                    "layout": "split"
                })
            else:
                slides.append({
                    "type": "content_list",
                    "title": current_section or topic,
                    "items": current_items,
                    "layout": "compact"
                })
            
            current_items = []
            current_group = None
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if not line:
            i += 1
            continue
        
        if line.startswith('---') or line.startswith('***'):
            i += 1
            continue
        
        if line.startswith('# ') and not line.startswith('## '):
            _flush_items()
            title = line[2:].strip()
            slides.append({
                "type": "title",
                "main": title,
                "sub": topic or "内容总结",
                "tag": "内容总结"
            })
            current_section = title
            current_items = []
            current_group = None
        
        elif line.startswith('## '):
            _flush_items()
            section_title = line[3:].strip()
            section_short = section_title.split('：')[0] if '：' in section_title else section_title[:20]
            slides.append({
                "type": "section",
                "title": section_short,
                "subtitle": section_title
            })
            current_section = section_title
            current_items = []
            current_group = None
        
        elif line.startswith('### '):
            if current_items:
                _flush_items()
            current_group = line[4:].strip()
            current_items.append({
                "title": current_group,
                "value": "",
                "is_group_header": True
            })
        
        elif line.startswith('- ') or line.startswith('* '):
            content = line[2:].strip()
            item = _parse_item_content(content)
            if item:
                current_items.append(item)
        
        elif re.match(r'^\d+\.\s', line):
            content = re.sub(r'^\d+\.\s', '', line).strip()
            item = _parse_item_content(content)
            if item:
                current_items.append(item)
        
        elif line.startswith('|') and '|' in line[1:]:
            table_lines = [line]
            j = i + 1
            while j < len(lines) and lines[j].strip().startswith('|'):
                table_lines.append(lines[j].strip())
                j += 1
            
            if len(table_lines) >= 2:
                table_data = _parse_table(table_lines)
                if table_data:
                    current_items.append({
                        "title": "表格数据",
                        "value": "",
                        "table_data": table_data,
                        "is_table": True
                    })
            
            i = j
            continue
        
        elif line.startswith('>'):
            i += 1
            continue
        
        elif line.startswith('```'):
            i += 1
            continue
        
        elif not line.startswith('#'):
            if line and not line.startswith('-'):
                current_items.append({
                    "title": line,
                    "value": ""
                })
        
        i += 1
    
    _flush_items()
    
    if slides:
        slides.append({
            "type": "closing",
            "title": "谢谢观看"
        })
    
    return slides


def _parse_item_content(content: str) -> Dict:
    """解析内容项"""
    import re
    
    if not content:
        return None
    
    if ' → ' in content:
        parts = content.split(' → ', 1)
        return {
            "title": parts[0].strip(),
            "value": parts[1].strip() if len(parts) > 1 else ""
        }
    
    if ' - ' in content and not content.startswith('-'):
        parts = content.split(' - ', 1)
        return {
            "title": parts[0].strip(),
            "value": parts[1].strip() if len(parts) > 1 else ""
        }
    
    return {
        "title": content,
        "value": ""
    }


def _parse_table(table_lines: List[str]) -> Dict:
    """解析Markdown表格"""
    if len(table_lines) < 2:
        return None
    
    header = [cell.strip() for cell in table_lines[0].strip('|').split('|')]
    
    rows = []
    for line in table_lines[2:]:
        cells = [cell.strip() for cell in line.strip('|').split('|')]
        if len(cells) == len(header):
            rows.append(cells)
    
    return {
        "headers": header,
        "rows": rows
    }


# ══════════════════════════════════════════════════════════════
# 主函数（测试用）
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"PPT技能调用入口 {__version__} ({__version_date__})")
    print()
    
    # 列出所有主题
    print("📦 可用主题:")
    for theme in list_available_themes():
        print(f"   [{theme['id']:12}] {theme['name']:12} - {theme['description']}")
    print()
    
    # 测试设计系统
    if HAS_DESIGN_SYSTEM:
        print("🎨 测试设计系统:")
        ds = DesignSystem('gradient')
        info = ds.get_theme_info()
        print(f"   主题: {info['name']}")
        print(f"   描述: {info['description']}")
        print(f"   配色: primary={ds.get_color_hex('primary')}, accent={ds.get_color_hex('accent')}")
        print()
    
    # 测试生成
    print("🧪 测试生成:")
    content = """
# 设计系统测试

## 产品介绍

- 智能助手
- 语音交互
- 个性化推荐

## 技术架构

- 云原生
- 分布式系统
- 实时计算
"""
    
    result = generate_ppt(
        content=content,
        title="设计系统测试PPT",
        theme='gradient',
        with_images=False
    )
    
    print(f"结果: {result.get('message')}")
    print(f"文件: {result.get('output_path')}")
