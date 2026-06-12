#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT工作流完整调用示例 V1.0

展示三种方式调用PPT工作流：
1. 从其他技能的内容调用
2. 从Markdown文本调用
3. 从结构化数据调用

用法：
    python generate_from_content.py --mode markdown --content "内容"
    python generate_from_content.py --mode structured --file data.json
"""

import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional, Union

# 添加PPT生成模块路径
sys.path.insert(0, '/home/gem/workspace/agent/skills/miaoda-ppt-maker')

from content_adapter import ContentAdapter, text_to_slides, structure_to_slides, any_to_slides
from generate_ppt import create_ppt_v3_with_images


# ══════════════════════════════════════════════════════════════
# 预设内容模板
# ══════════════════════════════════════════════════════════════

class ContentTemplates:
    """常用内容模板 - 用于快速生成PPT"""
    
    @staticmethod
    def market_research(title: str, background: list, findings: list, conclusion: str) -> dict:
        """市场调研模板
        
        Args:
            title: 调研标题
            background: 背景要点列表
            findings: 核心发现列表
            conclusion: 结论
        """
        return {
            "title": title,
            "subtitle": "市场调研报告",
            "sections": [
                {
                    "type": "content_cards",
                    "title": "背景",
                    "items": [{"title": b} for b in background]
                },
                {
                    "type": "content_cards",
                    "title": "核心发现",
                    "items": [{"title": f} for f in findings]
                },
                {
                    "type": "content_cards",
                    "title": "结论",
                    "items": [{"title": conclusion}]
                }
            ]
        }
    
    @staticmethod
    def competitor_comparison(title: str, competitors: list, dimensions: list) -> dict:
        """竞品对比模板
        
        Args:
            title: 对比标题
            competitors: 竞品列表 [{"name": "竞品A", "score": 8, "pros": [], "cons": []}]
            dimensions: 对比维度
        """
        return {
            "title": title,
            "subtitle": "竞品分析",
            "sections": [
                {
                    "type": "icons_grid",
                    "title": "竞品总览",
                    "items": [{"title": c["name"], "desc": f"评分: {c.get('score', 0)}/10"} for c in competitors]
                },
                {
                    "type": "comparison",
                    "title": "多维度对比",
                    "left_items": [f"{d}: {competitors[0].get(d, 'N/A')}" for d in dimensions if d in competitors[0]],
                    "right_items": [f"{d}: {competitors[1].get(d, 'N/A')}" for d in dimensions if d in competitors[1]] if len(competitors) > 1 else [],
                    "left_title": competitors[0]["name"] if competitors else "方案A",
                    "right_title": competitors[1]["name"] if len(competitors) > 1 else "方案B"
                }
            ]
        }
    
    @staticmethod
    def process_intro(title: str, steps: list, tips: list) -> dict:
        """流程介绍模板
        
        Args:
            title: 流程名称
            steps: 步骤列表 [{"step": "1", "name": "步骤名", "desc": "描述"}]
            tips: 注意事项
        """
        return {
            "title": title,
            "subtitle": "流程说明",
            "sections": [
                {
                    "type": "process_flow",
                    "title": "完整流程",
                    "steps": steps,
                    "description": f"共 {len(steps)} 个步骤"
                },
                {
                    "type": "content_cards",
                    "title": "注意事项",
                    "items": [{"title": t} for t in tips]
                }
            ]
        }
    
    @staticmethod
    def summary_report(title: str, key_points: list, recommendations: list) -> dict:
        """总结报告模板"""
        return {
            "title": title,
            "subtitle": "总结报告",
            "sections": [
                {
                    "type": "content_cards",
                    "title": "核心要点",
                    "items": [{"title": p} for p in key_points]
                },
                {
                    "type": "content_cards",
                    "title": "建议",
                    "items": [{"title": r} for r in recommendations]
                }
            ]
        }


# ══════════════════════════════════════════════════════════════
# PPT生成器
# ══════════════════════════════════════════════════════════════

class PPTGenerator:
    """PPT生成器 - 封装完整生成流程"""
    
    def __init__(self, theme: str = 'clean'):
        self.theme = theme
        self.adapter = ContentAdapter()
    
    def generate(self, content: Any, output_path: str, 
                  page_images: dict = None,
                  auto_plan: bool = False) -> str:
        """生成PPT
        
        Args:
            content: 输入内容（str/dict/list）
            output_path: 输出路径
            page_images: 配图配置 {page_index: image_path}
            auto_plan: 是否自动规划配图（暂未实现）
        
        Returns:
            生成的PPT文件路径
        """
        # 1. 内容转换
        slides = self.adapter.parse(content)
        
        print(f"📄 内容解析完成: {len(slides)} 页")
        
        # 2. 生成PPT
        ppt_path = create_ppt_v3_with_images(
            slides=slides,
            output_path=output_path,
            theme=self.theme,
            page_images=page_images or {},
            auto_plan_images=auto_plan
        )
        
        print(f"✅ PPT生成完成: {ppt_path}")
        return ppt_path
    
    def generate_with_images(self, content: Any, output_path: str,
                            images: list = None) -> str:
        """生成带配图的PPT
        
        Args:
            content: 输入内容
            output_path: 输出路径
            images: 配图列表 [{"page": 2, "path": "xxx.png"}, ...]
        """
        # 解析内容
        slides = self.adapter.parse(content)
        
        # 构建配图配置
        page_images = {}
        if images:
            for img in images:
                page_images[img["page"]] = img["path"]
        
        return self.generate(content, output_path, page_images)


# ══════════════════════════════════════════════════════════════
# 便捷调用接口
# ══════════════════════════════════════════════════════════════

def generate_ppt(content: Any, output_path: str, 
                theme: str = 'clean',
                images: list = None) -> str:
    """快捷函数：生成PPT
    
    Args:
        content: 输入内容（支持Markdown/结构化dict/直接slides列表）
        output_path: 输出路径
        theme: 配色主题 (clean/executive/spark/terminal)
        images: 配图列表
    
    Returns:
        生成的PPT文件路径
    """
    generator = PPTGenerator(theme)
    return generator.generate_with_images(content, output_path, images)


# ══════════════════════════════════════════════════════════════
# 命令行接口
# ══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='PPT生成工具')
    parser.add_argument('--mode', choices=['markdown', 'structured', 'detailed', 'file'],
                       default='markdown', help='输入模式')
    parser.add_argument('--content', type=str, help='直接传入内容')
    parser.add_argument('--file', type=str, help='从文件读取内容')
    parser.add_argument('--output', type=str, 
                       default='/home/gem/workspace/agent/workspace/ppt-output/generated.pptx',
                       help='输出路径')
    parser.add_argument('--theme', choices=['clean', 'executive', 'spark', 'terminal'],
                       default='clean', help='配色主题')
    
    args = parser.parse_args()
    
    # 读取内容
    if args.content:
        content = args.content
    elif args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        print("请提供 --content 或 --file 参数")
        sys.exit(1)
    
    # 生成PPT
    generator = PPTGenerator(args.theme)
    output = generator.generate(content, args.output)
    
    print(f"\n📁 输出文件: {output}")


if __name__ == "__main__":
    main()


# ══════════════════════════════════════════════════════════════
# 使用示例
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # 示例1：从Markdown生成
    print("=" * 60)
    print("示例1：从Markdown文本生成PPT")
    print("=" * 60)
    
    md_content = """
# 产品调研报告

## 市场背景

- 市场规模 → 100亿+
- 年增长率 → 30%
- 主要玩家 → 5家

## 核心发现

### 用户痛点
- 操作复杂，学习成本高
- 成本过高，中小企业难以承受
- 集成困难，难以与现有系统对接

### 技术趋势
- AI赋能成为主流
- 低代码平台崛起
- 云原生架构流行

## 结论

建议优先切入中小企业市场，采用订阅制商业模式
"""
    
    slides = text_to_slides(md_content, "产品调研")
    print(f"✅ 解析为 {len(slides)} 页")
    for i, s in enumerate(slides):
        print(f"  第{i+1}页: [{s['type']}] {s.get('title', s.get('main', ''))}")
