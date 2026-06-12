#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT工作流内容适配器 V1.1
将各种格式的内容转换为PPT工作流所需的slides格式

【核心原则】：保真导入，不处理内容
- 不总结、不删减、不压缩上游内容
- PPT制作工作流（七步工作流）负责内容处理
- 内容适配器只做格式转换

支持三种输入模式：
1. parse_from_text - Markdown/纯文本自动解析
2. parse_from_structure - 结构化数据解析
3. parse_from_detailed - 详细配置解析

V1.1 新增：
- 保真模式（preserve=True）：原封不动导入
- 不自动分页：内容适配器不分页，由PPT工作流决定
"""

import re
import json
from typing import List, Dict, Any, Optional, Union


class ContentAdapter:
    """内容适配器 - 只做格式转换，不处理内容"""
    
    def __init__(self, preserve: bool = True):
        """
        Args:
            preserve: 保真模式，True时不处理内容（默认True）
        """
        self.preserve = preserve
        self.default_theme = 'clean'
        
    # ══════════════════════════════════════════════════════════════
    # 公共接口
    # ══════════════════════════════════════════════════════════════
    
    def parse(self, content: Any, mode: str = "auto") -> List[Dict]:
        """统一入口，自动识别内容类型并解析
        
        Args:
            content: 输入内容（str/dict/list）
            mode: 解析模式 auto/structure/detailed
        
        Returns:
            slides列表（保真格式）
        """
        if isinstance(content, list):
            # 直接是slides格式，原封不动
            return self._validate_slides(content)
        elif isinstance(content, dict):
            # 结构化数据
            if "slides" in content:
                return self.parse_from_detailed(content)
            elif "sections" in content or "title" in content:
                return self.parse_from_structure(content)
            else:
                return self.parse_from_dict(content)
        elif isinstance(content, str):
            # 纯文本/Markdown
            return self.parse_from_text(content)
        else:
            raise ValueError(f"不支持的内容类型: {type(content)}")
    
    def parse_from_text(self, text: str, topic_hint: str = "", 
                        preserve: bool = None) -> List[Dict]:
        """从文本/Markdown解析PPT结构
        
        【V1.2 透明通道模式】：
        - 当 preserve=True 时，直接将原始文本作为slides传给PPT工作流
        - 不做任何解析、不改变内容结构
        - 让PPT工作流（七步工作流）自己处理内容
        
        【旧版解析模式】（preserve=False时）：
        - # 标题 → 封面
        - ## 二级标题 → section分隔页
        - ### 三级标题 → 当前section的子标题/分组标题
        - - 要点 → 内容项（支持 A → B 格式）
        - 1. 有序列表 → 内容项
        
        Args:
            text: Markdown格式文本
            topic_hint: 主题提示（仅用于封面副标题）
            preserve: 是否透明通道（默认True，覆盖构造函数）
        
        Returns:
            slides列表
        """
        use_preserve = preserve if preserve is not None else self.preserve
        
        # 【V1.2 透明通道模式】直接返回原始文本
        if use_preserve:
            # 直接将原始Markdown文本作为content传给PPT工作流
            # 不做任何解析，保持原始排版
            return [{
                "type": "raw_content",
                "content": text.strip(),
                "title": topic_hint or "PPT内容",
                "preserve": True
            }]
        
        # 旧版解析模式（如果明确设置preserve=False）
        slides = []
        lines = text.split('\n')
        
        i = 0
        current_section = None
        current_group = None  # ### 三级标题作为分组标题
        current_items = []  # 当前页的所有items
        
        while i < len(lines):
            line = lines[i].strip()
            
            if not line:
                i += 1
                continue
            
            # # 标题 → 封面
            if line.startswith('# '):
                # 保存之前的内容
                if current_items:
                    slides.extend(self._build_slides_from_content(
                        current_section, current_items, use_preserve
                    ))
                    current_items = []
                
                title = line[2:].strip()
                slides.append({
                    "type": "title",
                    "main": title,
                    "sub": topic_hint or "内容总结",
                    "tag": "内容总结"
                })
                current_section = title
                current_group = None
                
            # ## 二级标题 → section分隔页
            elif line.startswith('## '):
                # 保存之前的内容
                if current_items:
                    slides.extend(self._build_slides_from_content(
                        current_section, current_items, use_preserve
                    ))
                    current_items = []
                
                section_title = line[3:].strip()
                slides.append({
                    "type": "section",
                    "title": section_title.split('：')[0] if '：' in section_title else section_title[:15],
                    "subtitle": section_title
                })
                current_section = section_title
                current_group = None
                
            # ### 三级标题 → 当前section的子标题（不是新页面）
            elif line.startswith('### '):
                page_title = line[4:].strip()
                # 作为当前页的分组标题，不单独成页
                # 如果当前已有items，先保存
                if current_items:
                    slides.extend(self._build_slides_from_content(
                        current_section, current_items, use_preserve
                    ))
                    current_items = []
                # 设置新的分组标题
                current_group = page_title
                # 添加分组标题为第一个item
                current_items.append({
                    "title": page_title,
                    "value": "",
                    "is_group_header": True  # 标记为分组标题
                })
                
            # - 要点 / * 要点
            elif line.startswith(('- ', '* ')):
                content = line[2:].strip()
                item = self._parse_item(content)
                # 如果是普通项（非分组标题），添加到当前items
                if not (item.get("title") == current_group and item.get("value") == ""):
                    current_items.append(item)
                    
            # 有序列表
            elif re.match(r'^\d+\.\s', line):
                content = re.sub(r'^\d+\.\s', '', line).strip()
                item = self._parse_item(content)
                current_items.append(item)
                
            # 分割线 → 保真模式下忽略
            elif line.startswith('---') or line.startswith('***'):
                pass
                
            # ```代码块
            elif line.startswith('```'):
                code_lines = []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith('```'):
                    code_lines.append(lines[i])
                    i += 1
                code_content = "\n".join(code_lines)
                current_items.append({
                    "title": "代码示例",
                    "value": code_content[:500]
                })
                
            i += 1
        
        # 保存最后的内容
        if current_items:
            slides.extend(self._build_slides_from_content(
                current_section, current_items, use_preserve
            ))
        
        # 如果没有内容
        if not slides:
            slides.append({
                "type": "title",
                "main": topic_hint or "内容总结",
                "sub": "由AI辅助生成"
            })
        
        # 添加结尾
        slides.append({
            "type": "closing",
            "title": "谢谢观看"
        })
        
        return slides
    
    def _parse_item(self, content: str) -> Dict:
        """解析单个内容项，保持原始格式
        
        支持的格式：
        - "纯文本" → title: 纯文本
        - "A → B" → title: A, value: B
        - "A: B" → title: A, value: B
        """
        if '→' in content:
            parts = content.split('→', 1)
            return {
                "title": parts[0].strip(),
                "value": parts[1].strip()
            }
        elif ':' in content and not content.startswith('http'):
            parts = content.split(':', 1)
            return {
                "title": parts[0].strip(),
                "value": parts[1].strip()
            }
        else:
            return {"title": content, "value": ""}
    
    def _build_slides_from_content(self, section: str, items: List[Dict], 
                                    preserve: bool) -> List[Dict]:
        """将收集的内容转换为slides
        
        【保真原则】：
        - 不删减任何内容项
        - 不合并items
        - 按原始顺序排列
        - ### 分组标题保留在items中
        """
        if not items:
            return []
        
        # 过滤完全空的项（但保留分组标题）
        valid_items = []
        for item in items:
            if item.get("title") or item.get("value"):
                valid_items.append(item)
        
        if not valid_items:
            return []
        
        # 确定页面标题
        page_title = section if section else "内容"
        
        # 检查是否有分组标题（###开头的）
        has_group_header = any(
            item.get("is_group_header") and item.get("value") == ""
            for item in valid_items
        )
        
        slide = {
            "type": "content_cards",
            "title": page_title,
            "items": valid_items
        }
        
        if has_group_header:
            slide["has_subtitle"] = True
        
        return [slide]
    
    def parse_from_structure(self, structure: Dict) -> List[Dict]:
        """从结构化数据解析PPT
        
        【保真原则】：完全保留原始数据结构
        
        Expected format:
        {
            "title": "PPT标题",
            "subtitle": "副标题",
            "sections": [
                {"type": "content_cards", "title": "...", "items": [...]},
                {"type": "icons_grid", "title": "...", "items": [...]},
                ...
            ]
        }
        """
        slides = []
        data = structure.copy()
        
        # 封面
        slides.append({
            "type": "title",
            "main": data.get("title", "内容总结"),
            "sub": data.get("subtitle", ""),
            "tag": data.get("tag", "")
        })
        
        # 内容部分 - 原封不动保留
        sections = data.get("sections", [])
        for section in sections:
            # 完全保留原始结构
            slide = dict(section)
            
            # 确保有type
            if "type" not in slide:
                slide["type"] = "content_cards"
            
            slides.append(slide)
        
        # 结尾
        slides.append({
            "type": "closing",
            "title": "谢谢观看",
            "cta": data.get("cta", "")
        })
        
        return slides
    
    def parse_from_detailed(self, detailed: Dict) -> List[Dict]:
        """从详细配置解析PPT
        
        【保真原则】：slides数组原封不动
        
        Expected format:
        {
            "slides": [
                {"type": "title", "main": "...", "sub": "..."},
                {"type": "content_cards", "title": "...", "items": [...]},
                ...
            ]
        }
        """
        slides = detailed.get("slides", [])
        
        # 添加封面（如果没有）
        if not slides:
            slides.insert(0, {
                "type": "title",
                "main": detailed.get("title", "内容总结"),
                "sub": detailed.get("subtitle", "")
            })
        elif slides[0].get("type") != "title":
            slides.insert(0, {
                "type": "title",
                "main": detailed.get("title", "内容总结"),
                "sub": detailed.get("subtitle", "")
            })
        
        # 添加结尾（如果没有）
        if slides and slides[-1].get("type") != "closing":
            slides.append({
                "type": "closing",
                "title": "谢谢观看"
            })
        
        return self._validate_slides(slides)
    
    def parse_from_dict(self, data: Dict) -> List[Dict]:
        """从简单字典解析PPT
        
        【保真原则】：尽量保留原始数据
        """
        # 如果包含常见的内容字段，按结构化处理
        if any(k in data for k in ["sections", "items", "points", "content"]):
            return self.parse_from_structure(data)
        
        # 否则转换为单页
        title = data.get("title", "内容总结")
        return [{
            "type": "title",
            "main": title,
            "sub": data.get("subtitle", "")
        }, {
            "type": "content_cards",
            "title": title,
            "items": data.get("items", [{"title": k, "value": str(v)} for k, v in data.items()])
        }, {
            "type": "closing",
            "title": "谢谢观看"
        }]
    
    # ══════════════════════════════════════════════════════════════
    # 私有方法
    # ══════════════════════════════════════════════════════════════
    
    def _validate_slides(self, slides: List[Dict]) -> List[Dict]:
        """验证slides格式"""
        validated = []
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            if "type" not in slide:
                slide["type"] = "content_cards"
            validated.append(slide)
        return validated


# ══════════════════════════════════════════════════════════════
# 便捷函数
# ══════════════════════════════════════════════════════════════

def text_to_slides(text: str, topic_hint: str = "", preserve: bool = True) -> List[Dict]:
    """快捷函数：从文本转换为slides
    
    【透明通道模式 V1.2】：
    - 当 preserve=True 时，不做任何解析
    - 直接将原始Markdown文本包装成slides格式
    - 让PPT工作流（七步工作流）自己处理内容
    - 保持原始排版不受影响
    
    Args:
        text: Markdown格式文本
        topic_hint: 主题提示（用于封面）
        preserve: 是否保真（默认True）
    
    Returns:
        slides列表
    """
    adapter = ContentAdapter(preserve=preserve)
    return adapter.parse_from_text(text, topic_hint)


def structure_to_slides(structure: Dict, preserve: bool = True) -> List[Dict]:
    """快捷函数：从结构化数据转换为slides（默认保真模式）"""
    adapter = ContentAdapter(preserve=preserve)
    return adapter.parse_from_structure(structure)


def any_to_slides(content: Any, preserve: bool = True) -> List[Dict]:
    """快捷函数：从任意格式转换为slides（默认保真模式）"""
    adapter = ContentAdapter(preserve=preserve)
    return adapter.parse(content)


# ══════════════════════════════════════════════════════════════
# 测试
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # 测试保真模式
    md_content = """
# 产品调研报告

## 背景

- 市场规模 → 100亿+
- 年增长率 → 30%
- 主要玩家 → 5家

## 核心发现

### 用户痛点
- 痛点1：操作复杂 → 学习成本高
- 痛点2：成本高 → 中小企业难以承受
- 痛点3：集成难 → 难以与现有系统对接

### 技术方案
- 方案A：自研 → 投入大，周期长
- 方案B：采购 → 成本可控，快速上线
- 方案C：混合 → 平衡风险

## 结论

建议优先切入中小企业市场，采用订阅制商业模式
"""
    
    adapter = ContentAdapter(preserve=True)
    slides = adapter.parse_from_text(md_content, "产品调研")
    
    print(f"✅ 保真解析完成，共 {len(slides)} 页")
    print()
    for i, slide in enumerate(slides):
        slide_type = slide.get('type')
        title = slide.get('title', slide.get('main', ''))
        items_count = len(slide.get('items', []))
        print(f"第{i+1}页: [{slide_type}] {title}")
        if slide_type == 'content_cards' and items_count > 0:
            print(f"  └─ items数量: {items_count}")
            for item in slide['items'][:2]:  # 只显示前2个
                if item.get('value'):
                    print(f"      • {item['title']} → {item['value']}")
                else:
                    print(f"      • {item['title']}")
            if items_count > 2:
                print(f"      ... 还有 {items_count - 2} 项")
        print()
