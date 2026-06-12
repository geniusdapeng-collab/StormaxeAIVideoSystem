#!/usr/bin/env python3
"""
PPT配图自动生成工作流 - V4.9.8
2026-04-11

【V4.9.8 配图策略】
只给关键页面配图，减少图片生成量

配图规则：
1. 📌 封面页（title）—— 必选
2. 📌 章节过渡页（section）—— 必选
3. 📌 结尾页（closing）—— 必选
4. 📌 中间关键页面 —— 按间距均匀选择

总体配图数量：不少于10张，不多于20张
"""

import os
import sys
import glob
import shutil
import math
from typing import Dict, List, Any, Optional, Set

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from image_prompt_agent import ImagePromptAgent
from generate_ppt import create_ppt_v3_with_images

IMAGE_SOURCE_DIR = "/home/gem/workspace/agent/media/tool-image-generation"


def get_all_ppt_temp_dirs() -> List[str]:
    """获取所有PPT相关的临时目录（通配符）"""
    import glob as g
    return g.glob("/tmp/ppt_*")

# 配图数量限制
MIN_IMAGES = 10
MAX_IMAGES = 20


# ══════════════════════════════════════════════════════════════
# V4.9.8 图片清理规则
# ══════════════════════════════════════════════════════════════

def cleanup_before_generation():
    """
    【V4.10.0 硬规则】制作新PPT前清空所有历史图片
    - 清空图片源目录所有PNG
    - 清理所有 /tmp/ppt_* 临时目录（通配符，覆盖所有项目）
    """
    cleaned = 0
    for f in glob.glob(os.path.join(IMAGE_SOURCE_DIR, "*.png")):
        try:
            os.remove(f)
            cleaned += 1
        except:
            pass
    # 通配符清理所有PPT临时目录
    for tmp_dir in get_all_ppt_temp_dirs():
        if os.path.exists(tmp_dir):
            try:
                shutil.rmtree(tmp_dir)
                cleaned += 1
            except:
                pass
    print(f"  🧹 已清理 {cleaned} 个历史文件/目录（新PPT前清空旧图）")


# ══════════════════════════════════════════════════════════════
# V4.9.8 配图策略：只给关键页面配图
# ══════════════════════════════════════════════════════════════

def select_key_pages(slides: List[Dict]) -> Set[int]:
    """
    选择需要配图的关键页面
    
    规则：
    1. 封面页（title）—— 必选
    2. 章节过渡页（section）—— 必选
    3. 结尾页（closing）—— 必选
    4. 中间关键内容页 —— 按间距均匀选择
    
    总数量：不少于10张，不多于20张
    """
    total_pages = len(slides)
    key_pages = set()
    
    # 1. 封面页
    for idx, slide in enumerate(slides):
        if slide.get('type') == 'title':
            key_pages.add(idx)
            break
    
    # 2. 章节过渡页
    for idx, slide in enumerate(slides):
        if slide.get('type') == 'section':
            key_pages.add(idx)
    
    # 3. 结尾页
    for idx, slide in enumerate(slides):
        if slide.get('type') == 'closing':
            key_pages.add(idx)
            break
    
    # 4. 中间关键内容页（content_cards）
    content_pages = [
        idx for idx, slide in enumerate(slides)
        if slide.get('type') == 'content_cards' and idx not in key_pages
    ]
    
    # 计算还需要多少张图
    mandatory_count = len(key_pages)
    remaining_slots = max(0, MIN_IMAGES - mandatory_count)
    max_additional = MAX_IMAGES - mandatory_count
    
    if content_pages and remaining_slots > 0:
        # 按间距均匀选择
        target = min(remaining_slots, max_additional, len(content_pages))
        if target > 0:
            step = len(content_pages) / target
            selected = [content_pages[int(i * step)] for i in range(target)]
            key_pages.update(selected)
    
    # 确保不超过最大值
    while len(key_pages) > MAX_IMAGES:
        # 移除最中间的内容页
        content_in_keys = sorted([
            idx for idx in key_pages
            if slides[idx].get('type') == 'content_cards'
        ])
        if content_in_keys:
            mid = len(content_in_keys) // 2
            key_pages.discard(content_in_keys[mid])
        else:
            break
    
    return key_pages


# ══════════════════════════════════════════════════════════════
# 配图收集器
# ══════════════════════════════════════════════════════════════

class ImageAutoGenerator:
    """配图收集器 - V4.10.0"""
    
    def __init__(self, expected_count: int = 0, output_dir: str = None):
        self.expected_count = expected_count
        self.output_dir = output_dir or "/tmp/ppt_images_comp"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def collect_fresh_images(self) -> List[str]:
        """只收集本次生成的新图片"""
        all_images = glob.glob(os.path.join(IMAGE_SOURCE_DIR, "*.png"))
        all_images.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        return all_images[:self.expected_count]
    
    def compress_image(self, src_path: str, idx: int) -> str:
        """
        【V4.10.1 压缩修复】1280px 最大宽度 + JPEG 75% 质量
        修复 PPT-20260419-002：原 30MB 飞书上传 400 失败
        压缩后目标：< 10MB（单张约 200-500KB）
        """
        from PIL import Image
        img = Image.open(src_path)
        # 1. 缩放到最大 1280px 宽度
        max_width = 1280
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)
        # 2. JPEG 75% 质量（非 95%，95% 仍会导致文件过大）
        dst = os.path.join(self.output_dir, f"page_{idx:02d}.jpg")
        img.save(dst, 'JPEG', quality=75, optimize=True)
        return dst
    
    def collect_all_images(
        self,
        slides: List[Dict],
        key_pages: Set[int],
    ) -> Dict[int, str]:
        """收集配图并建立 page_index → image_path 映射（含压缩）"""
        new_images = self.collect_fresh_images()
        needed = len(key_pages)
        
        if len(new_images) < needed:
            print(f"  ⚠️ 只有 {len(new_images)} 张新图，需要 {needed} 张")
        
        page_images = {}
        used = set()
        
        for idx in sorted(key_pages):
            img_path = None
            for img in new_images:
                if img not in used:
                    img_path = img
                    break
            
            if img_path:
                used.add(img_path)
                # V4.10.0: 压缩后返回
                compressed_path = self.compress_image(img_path, idx)
                page_images[idx] = compressed_path
                title = (slides[idx].get('title', '') or slides[idx].get('main', '') or '')[:25]
                print(f"  ✅ Page {idx}: {title} → {os.path.getsize(compressed_path)/1024:.0f}KB")
            else:
                print(f"  ⚠️ Page {idx}: 无可用新图")
        
        print(f"  📊 收集: {len(page_images)}/{needed} 张（每张独立，无复用）")
        return page_images


# ══════════════════════════════════════════════════════════════
# 主工作流
# ══════════════════════════════════════════════════════════════

def generate_ppt_with_auto_images(
    slides: List[Dict],
    topic: str = "",
    output_path: str = None,
    theme: str = "clean",
    style: str = "photorealistic",
) -> Dict[str, Any]:
    """
    完整工作流：清理 → 选择关键页面 → 配图规划 → 收集图片 → PPT制作
    
    【V4.10.1 压缩修复】
    - 1280px 最大宽度 + JPEG 75% 质量
    - 修复 PPT-20260419-002：文件过大飞书上传失败
    - 生成后校验文件大小 < 10MB
    """
    # 生成前清理
    cleanup_before_generation()
    
    if output_path is None:
        safe_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '-', '_')).strip()[:30]
        output_path = f"/home/gem/workspace/agent/workspace/ppt-output/{safe_topic}.pptx"
    
    # 1. 选择关键页面
    key_pages = select_key_pages(slides)
    print(f"\n  📌 关键配图页面: {sorted(key_pages)}")
    print(f"  📊 共需 {len(key_pages)} 张配图（{MIN_IMAGES}-{MAX_IMAGES}张）")
    
    # 2. 生成配图prompt
    agent = ImagePromptAgent(topic=topic, style=style)
    prompts = {idx: agent.generate_prompt(slides[idx], idx, len(slides)) for idx in key_pages}
    
    # 3. 收集图片
    generator = ImageAutoGenerator(expected_count=len(key_pages))
    page_images = generator.collect_all_images(slides, key_pages)
    
    # 4. 构建 page_image_configs
    page_image_configs = {}
    for idx, img_path in page_images.items():
        if img_path and os.path.exists(img_path):
            slide_type = slides[idx].get('type', '')
            if slide_type == 'title':
                page_image_configs[idx] = {"path": img_path, "position": "background", "size": "full"}
            elif slide_type == 'section':
                page_image_configs[idx] = {"path": img_path, "position": "decorative_right", "size": "medium"}
            elif slide_type == 'closing':
                page_image_configs[idx] = {"path": img_path, "position": "background", "size": "full"}
            else:
                page_image_configs[idx] = {"path": img_path, "position": "right_small", "size": "small"}
    
    # 5. 生成PPT
    result = create_ppt_v3_with_images(
        slides=slides,
        output_path=output_path,
        theme=theme,
        page_image_configs=page_image_configs,
        auto_plan_images=False,
    )
    
    size_mb = os.path.getsize(result) / 1024 / 1024 if os.path.exists(result) else 0
    
    # 【PPT-20260419-002 修复】飞书上传限制 10MB，超过则告警
    if size_mb > 10:
        print(f"  ⚠️ 文件大小 {size_mb:.1f}MB 超过飞书上传限制（10MB）")
        print(f"  ⚠️ 建议：降低 JPEG 质量到 60% 或进一步缩小图片尺寸")
    
    # 保留图片方便反复调整
    remaining = len(glob.glob(os.path.join(IMAGE_SOURCE_DIR, "*.png")))
    if remaining > 0:
        print(f"\n  ♻️ 保留 {remaining} 张图片（方便反复调整）")
    
    return {
        "success": True,
        "output_path": result,
        "slides_count": len(slides),
        "images_count": len(page_image_configs),
        "file_size_mb": round(size_mb, 1),
        "message": f"PPT生成成功！{len(slides)}页，{len(page_image_configs)}张配图",
    }
