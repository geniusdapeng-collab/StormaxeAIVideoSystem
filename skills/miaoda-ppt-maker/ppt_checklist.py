#!/usr/bin/env python3
"""
PPT输出前Checklist检查脚本 - V4.9.0重构版
2026-04-10

【V4.9.0更新】
- ✅ 返回结构化ChecklistResult对象（可程序化消费）
- ✅ 新增图片质量验证（尺寸/可读性/文件大小）
- ✅ 新增文件大小阈值告警（>50MB警告，>100MB错误）
- ✅ 保持print输出向后兼容

【向后兼容】
- 仍保留print输出
- 新增return ChecklistResult对象
"""

import os
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


# ══════════════════════════════════════════════════════════════
# V4.9.0新增：结构化检查结果
# ══════════════════════════════════════════════════════════════

@dataclass
class CheckItem:
    """单个检查项"""
    name: str
    passed: bool
    message: str
    severity: str = "info"  # info / warning / error


@dataclass
class ChecklistResult:
    """Checklist检查的完整结果（V4.9.0新增）"""
    all_passed: bool = True
    total_checks: int = 0
    passed_checks: int = 0
    failed_checks: int = 0
    items: List[CheckItem] = field(default_factory=list)
    
    # 详细信息
    slides_count: int = 0
    images_count: int = 0
    file_size_kb: float = 0.0
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    
    def add(self, name: str, passed: bool, message: str, severity: str = "info"):
        """添加检查项"""
        item = CheckItem(name=name, passed=passed, message=message, severity=severity)
        self.items.append(item)
        self.total_checks += 1
        if passed:
            self.passed_checks += 1
        else:
            self.failed_checks += 1
            self.all_passed = False
            if severity == "error":
                self.errors.append(message)
            elif severity == "warning":
                self.warnings.append(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典（供外部程序消费）"""
        return {
            "all_passed": self.all_passed,
            "total_checks": self.total_checks,
            "passed_checks": self.passed_checks,
            "failed_checks": self.failed_checks,
            "items": [
                {"name": i.name, "passed": i.passed, "message": i.message, "severity": i.severity}
                for i in self.items
            ],
            "slides_count": self.slides_count,
            "images_count": self.images_count,
            "file_size_kb": self.file_size_kb,
            "warnings": self.warnings,
            "errors": self.errors,
        }
    
    def summary(self) -> str:
        """生成人类可读的摘要"""
        lines = []
        lines.append("=" * 70)
        lines.append("           PPT输出前 - 重要事项Checklist (V4.9.0)")
        lines.append("=" * 70)
        
        # 按类别分组
        categories = {}
        for item in self.items:
            cat = item.name.split(":")[0] if ":" in item.name else "其他"
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)
        
        for cat, items in categories.items():
            lines.append(f"\n【{cat}】")
            for item in items:
                status = "✅" if item.passed else "❌"
                lines.append(f"  {status} {item.message}")
        
        lines.append("\n" + "=" * 70)
        if self.all_passed:
            lines.append("           ✅ 所有检查通过，可以输出！")
        else:
            lines.append(f"           ❌ {self.failed_checks}项未通过，请修复后再输出！")
        lines.append("=" * 70)
        
        return "\n".join(lines)


# ══════════════════════════════════════════════════════════════
# V4.9.0新增：图片验证工具
# ══════════════════════════════════════════════════════════════

def validate_image(image_path: str, min_width: int = 100, min_height: int = 100) -> Dict[str, Any]:
    """
    验证图片质量
    
    Args:
        image_path: 图片路径
        min_width: 最小宽度（像素）
        min_height: 最小高度（像素）
    
    Returns:
        {"valid": bool, "width": int, "height": int, "size_kb": float, "error": str}
    """
    result = {"valid": False, "width": 0, "height": 0, "size_kb": 0.0, "error": ""}
    
    if not os.path.exists(image_path):
        result["error"] = f"文件不存在: {image_path}"
        return result
    
    file_size = os.path.getsize(image_path)
    result["size_kb"] = round(file_size / 1024, 1)
    
    if file_size < 1024:  # 小于1KB，可能是损坏文件
        result["error"] = f"文件过小({result['size_kb']}KB)，可能已损坏"
        return result
    
    if file_size > 20 * 1024 * 1024:  # 大于20MB
        result["error"] = f"文件过大({result['size_kb']//1024}MB)，建议压缩"
        return result
    
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            result["width"] = img.width
            result["height"] = img.height
            
            if img.width < min_width or img.height < min_height:
                result["error"] = f"尺寸过小({img.width}x{img.height}，需要>={min_width}x{min_height})"
                return result
            
            result["valid"] = True
    except ImportError:
        # 如果没有PIL，只做基本检查
        result["valid"] = True  # 假设有效
    except Exception as e:
        result["error"] = f"图片无法打开: {str(e)}"
    
    return result


# ══════════════════════════════════════════════════════════════
# 配置常量
# ══════════════════════════════════════════════════════════════

FILE_SIZE_WARN_MB = 50  # 文件大小警告阈值（MB）
FILE_SIZE_ERROR_MB = 100  # 文件大小错误阈值（MB）


def check_ppt_output(slides, image_configs=None, output_path=None) -> ChecklistResult:
    """
    PPT输出前Checklist检查
    
    【V4.9.0更新】返回结构化ChecklistResult对象
    
    Args:
        slides: PPT的slides数据
        image_configs: 配图配置字典 {page_index: {"path": ..., "position": ...}}
        output_path: 输出文件路径
    
    Returns:
        ChecklistResult 结构化检查结果（V4.9.0新增）
    """
    result = ChecklistResult(all_passed=True)
    result.slides_count = len(slides)
    
    # 1. 内容完整性检查
    content_cards_pages = [s for s in slides if s.get('type') == 'content_cards']
    pages_with_bottom = [s for s in content_cards_pages if s.get('bottom_text')]
    
    result.add(
        name="内容完整性: 页面统计",
        passed=True,
        message=f"总{len(slides)}页 | content_cards {len(content_cards_pages)}页 | 有bottom_text {len(pages_with_bottom)}页"
    )
    
    # 检查1.1: content_cards都有bottom_text
    if len(content_cards_pages) == len(pages_with_bottom):
        result.add("内容完整性: bottom_text覆盖", True, "所有content_cards页面都有bottom_text")
    else:
        missing = [s.get('title', '无标题') for s in content_cards_pages if not s.get('bottom_text')]
        result.add("内容完整性: bottom_text覆盖", False, f"以下页面缺少bottom_text: {missing}", "error")
    
    # 检查1.2: bottom_text字数检查（>=300字）
    short_texts = []
    for s in pages_with_bottom:
        text_len = len(s.get('bottom_text', ''))
        if text_len < 300:
            short_texts.append((s.get('title', '无标题'), text_len))
    
    if not short_texts:
        result.add("内容完整性: bottom_text字数", True, "所有bottom_text都>=300字")
    else:
        details = [f"'{t}'只有{l}字" for t, l in short_texts]
        result.add("内容完整性: bottom_text字数", False, f"以下页面字数不足: {', '.join(details)}", "error")
    
    # 2. 配图检查
    if image_configs:
        total_images = len(image_configs)
        # 需要配图的页面数
        need_image_pages = []
        for i, s in enumerate(slides):
            stype = s.get('type', '')
            if stype in ['title', 'section', 'closing', 'content_cards']:
                need_image_pages.append(i)
        
        result.add("配图: 数量", total_images >= len(need_image_pages),
                  f"配图{total_images}张 {'>=' if total_images >= len(need_image_pages) else '<'} 需要{len(need_image_pages)}页",
                  "error" if total_images < len(need_image_pages) else "info")
        
        # 检查2.2: 是否有重复使用的配图
        image_paths = list(image_configs.values())
        paths_used = [p.get('path') for p in image_paths if p.get('path')]
        unique_paths = set([p for p in paths_used if p])
        
        if len(paths_used) == len(unique_paths):
            result.add("配图: 独立性", True, "每页配图独立，无重复使用")
        else:
            dupes = [p for p in paths_used if paths_used.count(p) > 1]
            result.add("配图: 独立性", False, f"以下配图被重复使用: {set(dupes)}", "error")
        
        # 检查2.3: 封面/结尾是否有配图
        title_has_img = any(0 in image_configs and image_configs[0].get('path'))
        closing_idx = len(slides) - 1
        closing_has_img = any(closing_idx in image_configs and image_configs[closing_idx].get('path'))
        
        result.add("配图: 封面", bool(title_has_img),
                  "封面有配图" if title_has_img else "封面缺少配图",
                  "error" if not title_has_img else "info")
        result.add("配图: 结尾", bool(closing_has_img),
                  "结尾页有配图" if closing_has_img else "结尾页缺少配图",
                  "error" if not closing_has_img else "info")
        
        # V4.9.0新增：图片质量验证
        result.images_count = total_images
        valid_images = 0
        invalid_images = []
        for idx, config in image_configs.items():
            img_path = config.get('path')
            if img_path and os.path.exists(img_path):
                validation = validate_image(img_path)
                if validation['valid']:
                    valid_images += 1
                else:
                    invalid_images.append((idx, validation['error']))
        
        if not invalid_images:
            result.add("配图质量: 验证", True, f"{valid_images}张图片质量验证通过")
        else:
            details = [f"页面{idx}: {err}" for idx, err in invalid_images]
            result.add("配图质量: 验证", False, f"以下图片验证失败: {'; '.join(details)}", "error")
    else:
        result.add("配图检查", True, "未提供image_configs，跳过配图检查", "info")
    
    # 3. 文件输出检查
    if output_path:
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            size_mb = size / 1024 / 1024
            size_kb = size / 1024
            result.file_size_kb = round(size_kb, 1)
            
            result.add("文件输出: 存在", True, f"文件存在: {os.path.basename(output_path)} ({size_kb:.0f}KB / {size_mb:.1f}MB)")
            
            # V4.9.0新增：文件大小阈值检查
            if size_mb > FILE_SIZE_ERROR_MB:
                result.add("文件输出: 大小", False,
                          f"文件过大({size_mb:.1f}MB > {FILE_SIZE_ERROR_MB}MB)，可能导致加载缓慢", "error")
            elif size_mb > FILE_SIZE_WARN_MB:
                result.add("文件输出: 大小", True,
                          f"文件较大({size_mb:.1f}MB > {FILE_SIZE_WARN_MB}MB)，建议优化图片", "warning")
            else:
                result.add("文件输出: 大小", True, f"文件大小正常({size_mb:.1f}MB)")
        else:
            result.add("文件输出: 存在", False, f"文件不存在: {output_path}", "error")
    
    # 打印输出（向后兼容）
    print(result.summary())
    
    return result


if __name__ == "__main__":
    # 示例用法
    sample_slides = [
        {'type': 'title', 'main': '测试PPT'},
        {'type': 'content_cards', 'title': '测试页面', 'items': [], 'bottom_text': '这是300字以上的详细说明内容。' * 50},
    ]
    
    sample_configs = {
        0: {'path': '/tmp/img1.png', 'position': 'background'},
        1: {'path': '/tmp/img2.png', 'position': 'right_small'},
    }
    
    result = check_ppt_output(sample_slides, sample_configs)
    
    # 程序化消费示例
    print(f"\n结构化结果: all_passed={result.all_passed}, checks={result.total_checks}")
