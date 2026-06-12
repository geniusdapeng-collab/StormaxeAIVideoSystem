#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT 设计系统加载器 V1.0
从 DESIGN.md 或配置字典加载设计规范，转换为 PPT 生成器可用的格式

基于 VoltAgent/awesome-design-md 理念：
- 纯文本 Markdown 描述设计系统
- AI agent 直接读取生成一致 UI
"""

import re
import os
from typing import Dict, Any, Optional, List
from pathlib import Path

# ══════════════════════════════════════════════════════════════
# 内置设计系统预设
# ══════════════════════════════════════════════════════════════

PRESET_THEMES = {
    # ─────────────────────────────────────────────
    # Executive - 商务深蓝 + 金色
    # ─────────────────────────────────────────────
    "executive": {
        "name": "Executive",
        "description": "商务汇报风格，深蓝背景配合金色强调",
        "mood": "专业、权威、高端",
        "scene": "商业路演、工作汇报、投标提案",
        "colors": {
            "primary": "#0D1B2A",
            "primary_light": "#1B2838",
            "primary_dark": "#050D15",
            "accent": "#FFB700",
            "accent_light": "#FFDC50",
            "success": "#00E676",
            "warning": "#FF9800",
            "danger": "#F44336",
            "info": "#2196F3",
            "text_primary": "#FFFFFF",
            "text_secondary": "#8899AA",
            "text_muted": "#6B7C8D",
            "bg_primary": "#0D1B2A",
            "bg_card": "#1B2838",
            "bg_elevated": "#253D54",
            "border": "#2D3F52",
        },
        "typography": {
            "font_title": "Inter",
            "font_body": "Inter",
            "font_number": "DM Sans",
            "h1_size": 44,
            "h2_size": 36,
            "h3_size": 28,
            "h4_size": 20,
            "body_size": 16,
            "caption_size": 12,
            "number_size": 32,
        },
        "layout": {
            "margin_left": 0.8,
            "margin_right": 0.8,
            "margin_top": 0.6,
            "margin_bottom": 0.6,
            "card_radius": 12,
            "card_padding": 20,
            "card_spacing": 16,
            "shadow": "0 4px 16px rgba(0,0,0,0.15)",
            "shadow_hover": "0 8px 24px rgba(0,0,0,0.25)",
        },
        "decorations": {
            "accent_line_height": 4,
            "icon_size": 24,
            "separator_width": 1,
            "dot_size": 8,
        }
    },

    # ─────────────────────────────────────────────
    # Clean - 简约白色系
    # ─────────────────────────────────────────────
    "clean": {
        "name": "Clean",
        "description": "简约专业风格，白色背景配合红色强调",
        "mood": "简洁、清新、专业",
        "scene": "产品介绍、方案展示、日常汇报",
        "colors": {
            "primary": "#FFFFFF",
            "primary_light": "#F8F9FA",
            "primary_dark": "#E9ECEF",
            "accent": "#DC3545",
            "accent_light": "#FF6B6B",
            "success": "#22C55E",
            "warning": "#F59E0B",
            "danger": "#EF4444",
            "info": "#3B82F6",
            "text_primary": "#1F2937",
            "text_secondary": "#6B7280",
            "text_muted": "#9CA3AF",
            "bg_primary": "#FFFFFF",
            "bg_card": "#F8F9FA",
            "bg_elevated": "#FFFFFF",
            "border": "#E5E7EB",
        },
        "typography": {
            "font_title": "Inter",
            "font_body": "Inter",
            "font_number": "DM Sans",
            "h1_size": 44,
            "h2_size": 36,
            "h3_size": 28,
            "h4_size": 20,
            "body_size": 16,
            "caption_size": 12,
            "number_size": 32,
        },
        "layout": {
            "margin_left": 0.8,
            "margin_right": 0.8,
            "margin_top": 0.6,
            "margin_bottom": 0.6,
            "card_radius": 8,
            "card_padding": 20,
            "card_spacing": 16,
            "shadow": "0 2px 8px rgba(0,0,0,0.08)",
            "shadow_hover": "0 4px 16px rgba(0,0,0,0.12)",
        },
        "decorations": {
            "accent_line_height": 3,
            "icon_size": 24,
            "separator_width": 1,
            "dot_size": 8,
        }
    },

    # ─────────────────────────────────────────────
    # Spark - 科技深紫 + 青色
    # ─────────────────────────────────────────────
    "spark": {
        "name": "Spark",
        "description": "科技创业风格，深紫背景配合青色强调",
        "mood": "年轻、创新、前沿",
        "scene": "创业路演、科技峰会、产品发布",
        "colors": {
            "primary": "#0F0C29",
            "primary_light": "#1E1B4B",
            "primary_dark": "#050510",
            "accent": "#24C8DB",
            "accent_light": "#64DCF0",
            "success": "#00E676",
            "warning": "#FFB300",
            "danger": "#FF5252",
            "info": "#7B61FF",
            "text_primary": "#F0F0F0",
            "text_secondary": "#A0A8B8",
            "text_muted": "#6B7C8D",
            "bg_primary": "#0F0C29",
            "bg_card": "#1E1B4B",
            "bg_elevated": "#2D2880",
            "border": "#3C3580",
        },
        "typography": {
            "font_title": "Inter",
            "font_body": "Inter",
            "font_number": "DM Sans",
            "h1_size": 48,
            "h2_size": 36,
            "h3_size": 28,
            "h4_size": 20,
            "body_size": 16,
            "caption_size": 12,
            "number_size": 36,
        },
        "layout": {
            "margin_left": 0.8,
            "margin_right": 0.8,
            "margin_top": 0.6,
            "margin_bottom": 0.6,
            "card_radius": 16,
            "card_padding": 24,
            "card_spacing": 20,
            "shadow": "0 8px 32px rgba(36,200,219,0.15)",
            "shadow_hover": "0 12px 48px rgba(36,200,219,0.25)",
        },
        "decorations": {
            "accent_line_height": 4,
            "icon_size": 24,
            "separator_width": 1,
            "dot_size": 10,
        }
    },

    # ─────────────────────────────────────────────
    # Terminal - 深灰 + 绿色极客风
    # ─────────────────────────────────────────────
    "terminal": {
        "name": "Terminal",
        "description": "极客技术风格，深灰背景配合绿色强调",
        "mood": "极客、技术、硬核",
        "scene": "技术分享、代码演示、开发者大会",
        "colors": {
            "primary": "#1A1A1A",
            "primary_light": "#2D2D2D",
            "primary_dark": "#0D0D0D",
            "accent": "#00FF88",
            "accent_light": "#50FFA8",
            "success": "#00E676",
            "warning": "#FFB300",
            "danger": "#FF5252",
            "info": "#00BFFF",
            "text_primary": "#E0E0E0",
            "text_secondary": "#A0A0A0",
            "text_muted": "#606060",
            "bg_primary": "#1A1A1A",
            "bg_card": "#2D2D2D",
            "bg_elevated": "#3D3D3D",
            "border": "#404040",
        },
        "typography": {
            "font_title": "JetBrains Mono",
            "font_body": "JetBrains Mono",
            "font_number": "JetBrains Mono",
            "h1_size": 40,
            "h2_size": 32,
            "h3_size": 24,
            "h4_size": 18,
            "body_size": 14,
            "caption_size": 11,
            "number_size": 28,
        },
        "layout": {
            "margin_left": 0.8,
            "margin_right": 0.8,
            "margin_top": 0.6,
            "margin_bottom": 0.6,
            "card_radius": 4,
            "card_padding": 16,
            "card_spacing": 12,
            "shadow": "none",
            "shadow_hover": "0 0 16px rgba(0,255,136,0.2)",
        },
        "decorations": {
            "accent_line_height": 2,
            "icon_size": 20,
            "separator_width": 1,
            "dot_size": 6,
        }
    },

    # ─────────────────────────────────────────────
    # Gradient - 渐变科技风（新增）
    # ─────────────────────────────────────────────
    "gradient": {
        "name": "Gradient",
        "description": "渐变科技风，紫色到蓝色渐变",
        "mood": "梦幻、未来、炫酷",
        "scene": "AI产品发布、科技展览、创意展示",
        "colors": {
            "primary": "#1A0533",
            "primary_light": "#2D1B4E",
            "primary_dark": "#0D0220",
            "accent": "#8B5CF6",
            "accent_light": "#A78BFA",
            "accent_gradient_start": "#6366F1",
            "accent_gradient_end": "#EC4899",
            "success": "#10B981",
            "warning": "#F59E0B",
            "danger": "#EF4444",
            "info": "#3B82F6",
            "text_primary": "#FFFFFF",
            "text_secondary": "#C4B5FD",
            "text_muted": "#8B5CF6",
            "bg_primary": "#1A0533",
            "bg_card": "#2D1B4E",
            "bg_elevated": "#3D2A5E",
            "border": "#4D3A6E",
        },
        "typography": {
            "font_title": "Inter",
            "font_body": "Inter",
            "font_number": "DM Sans",
            "h1_size": 48,
            "h2_size": 36,
            "h3_size": 28,
            "h4_size": 20,
            "body_size": 16,
            "caption_size": 12,
            "number_size": 36,
        },
        "layout": {
            "margin_left": 0.8,
            "margin_right": 0.8,
            "margin_top": 0.6,
            "margin_bottom": 0.6,
            "card_radius": 20,
            "card_padding": 24,
            "card_spacing": 20,
            "shadow": "0 8px 32px rgba(139,92,246,0.2)",
            "shadow_hover": "0 12px 48px rgba(139,92,246,0.3)",
            "use_gradient": True,
        },
        "decorations": {
            "accent_line_height": 4,
            "icon_size": 24,
            "separator_width": 1,
            "dot_size": 10,
        }
    },

    # ─────────────────────────────────────────────
    # Warm - 温暖橙色系（新增）
    # ─────────────────────────────────────────────
    "warm": {
        "name": "Warm",
        "description": "温暖橙色系，亲切友好",
        "mood": "温暖、友好、活力",
        "scene": "教育培训、团队分享、生活分享",
        "colors": {
            "primary": "#1F1B16",
            "primary_light": "#3D352A",
            "primary_dark": "#0F0D08",
            "accent": "#FF6B35",
            "accent_light": "#FF8F66",
            "success": "#22C55E",
            "warning": "#FBBF24",
            "danger": "#EF4444",
            "info": "#3B82F6",
            "text_primary": "#FEFEFE",
            "text_secondary": "#D4C4B0",
            "text_muted": "#9C8C78",
            "bg_primary": "#1F1B16",
            "bg_card": "#3D352A",
            "bg_elevated": "#4D453A",
            "border": "#5D554A",
        },
        "typography": {
            "font_title": "Noto Sans SC",
            "font_body": "Noto Sans SC",
            "font_number": "DM Sans",
            "h1_size": 44,
            "h2_size": 36,
            "h3_size": 28,
            "h4_size": 20,
            "body_size": 16,
            "caption_size": 12,
            "number_size": 32,
        },
        "layout": {
            "margin_left": 0.8,
            "margin_right": 0.8,
            "margin_top": 0.6,
            "margin_bottom": 0.6,
            "card_radius": 16,
            "card_padding": 20,
            "card_spacing": 16,
            "shadow": "0 4px 16px rgba(0,0,0,0.2)",
            "shadow_hover": "0 8px 24px rgba(0,0,0,0.3)",
        },
        "decorations": {
            "accent_line_height": 4,
            "icon_size": 24,
            "separator_width": 1,
            "dot_size": 8,
        }
    },
}


class DesignSystem:
    """PPT 设计系统加载器"""

    def __init__(self, theme_name: str = "executive", config: Dict = None):
        """
        初始化设计系统

        Args:
            theme_name: 预设主题名称 (executive/clean/spark/terminal/gradient/warm)
            config: 自定义配置（覆盖预设）
        """
        # 加载预设
        if theme_name in PRESET_THEMES:
            self.config = PRESET_THEMES[theme_name].copy()
        else:
            # 默认使用 executive
            self.config = PRESET_THEMES["executive"].copy()

        # 合并自定义配置
        if config:
            self._deep_merge(self.config, config)

        # 解析颜色为 RGB 元组
        self._parse_colors()

    def _deep_merge(self, base: Dict, override: Dict):
        """深度合并字典"""
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def _parse_colors(self):
        """解析颜色字符串为 RGB"""
        if "colors" not in self.config:
            return

        for key, value in self.config["colors"].items():
            if isinstance(value, str) and value.startswith("#"):
                self.config["colors"][key] = self._hex_to_rgb(value)

    @staticmethod
    def _hex_to_rgb(hex_color: str):
        """HEX 转 RGB"""
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 6:
            return (
                int(hex_color[0:2], 16),
                int(hex_color[2:4], 16),
                int(hex_color[4:6], 16)
            )
        elif len(hex_color) == 3:
            return (
                int(hex_color[0] * 2, 16),
                int(hex_color[1] * 2, 16),
                int(hex_color[2] * 2, 16)
            )
        return (0, 0, 0)

    @staticmethod
    def _rgb_to_hex(rgb: tuple) -> str:
        """RGB 转 HEX"""
        return "#{:02X}{:02X}{:02X}".format(*rgb)

    # ─────────────────────────────────────────────
    # 公开方法
    # ─────────────────────────────────────────────

    def get_color(self, role: str) -> tuple:
        """获取颜色 RGB"""
        return self.config.get("colors", {}).get(role, (0, 0, 0))

    def get_color_hex(self, role: str) -> str:
        """获取颜色 HEX"""
        color = self.get_color(role)
        if isinstance(color, tuple):
            return self._rgb_to_hex(color)
        return color

    def get_typography(self) -> Dict:
        """获取字体规范"""
        return self.config.get("typography", {})

    def get_layout(self) -> Dict:
        """获取布局规范"""
        return self.config.get("layout", {})

    def get_decorations(self) -> Dict:
        """获取装饰规范"""
        return self.config.get("decorations", {})

    def get_theme_info(self) -> Dict:
        """获取主题基本信息"""
        return {
            "name": self.config.get("name", ""),
            "description": self.config.get("description", ""),
            "mood": self.config.get("mood", ""),
            "scene": self.config.get("scene", ""),
        }

    def to_pptx_colors(self) -> Dict:
        """转换为 generate_ppt.py 使用的格式"""
        colors = self.config.get("colors", {})

        # 兼容 generate_ppt.py 的 THEMES 格式
        pptx_colors = {}

        # 基础色
        if "bg_primary" in colors:
            bg = colors["bg_primary"]
            pptx_colors["bg"] = bg if isinstance(bg, tuple) else self._hex_to_rgb(bg)

        if "bg_card" in colors:
            card_bg = colors["bg_card"]
            pptx_colors["card_bg"] = card_bg if isinstance(card_bg, tuple) else self._hex_to_rgb(card_bg)

        # 文字色
        if "text_primary" in colors:
            text = colors["text_primary"]
            pptx_colors["text"] = text if isinstance(text, tuple) else self._hex_to_rgb(text)

        if "text_secondary" in colors or "text_muted" in colors:
            muted = colors.get("text_secondary") or colors.get("text_muted")
            pptx_colors["muted"] = muted if isinstance(muted, tuple) else self._hex_to_rgb(muted)

        # 强调色
        if "accent" in colors:
            accent = colors["accent"]
            pptx_colors["accent"] = accent if isinstance(accent, tuple) else self._hex_to_rgb(accent)

        if "accent_light" in colors:
            light_accent = colors["accent_light"]
            pptx_colors["light_accent"] = light_accent if isinstance(light_accent, tuple) else self._hex_to_rgb(light_accent)

        # 功能色
        for semantic in ["success", "warning", "danger", "info"]:
            if semantic in colors:
                color = colors[semantic]
                pptx_colors[semantic] = color if isinstance(color, tuple) else self._hex_to_rgb(color)

        # 边框色
        if "border" in colors:
            border = colors["border"]
            pptx_colors["border"] = border if isinstance(border, tuple) else self._hex_to_rgb(border)

        return pptx_colors

    def get_quick_ref(self) -> str:
        """生成快速参考字符串（用于 AI prompt）"""
        info = self.get_theme_info()
        colors = self.config.get("colors", {})
        layout = self.config.get("layout", {})

        ref = f"""
# {info['name']} 设计系统

## 主题定位
- 风格: {info['description']}
- 情绪: {info['mood']}
- 场景: {info['scene']}

## 快速色彩参考
```
主色: {colors.get('primary', '#000000')}
强调色: {colors.get('accent', '#000000')}
文字: {colors.get('text_primary', '#000000')} / {colors.get('text_secondary', '#000000')}
成功: {colors.get('success', '#000000')}
警告: {colors.get('warning', '#000000')}
危险: {colors.get('danger', '#000000')}
```

## 布局规范
- 边距: {layout.get('margin_left', 0.8)}in (左右) / {layout.get('margin_top', 0.6)}in (上下)
- 卡片圆角: {layout.get('card_radius', 12)}px
- 卡片间距: {layout.get('card_spacing', 16)}px
- 阴影: {layout.get('shadow', 'none')}

## 字体层级
| 层级 | 字号 |
|------|------|
| h1 (封面) | {self.config.get('typography', {}).get('h1_size', 44)}pt |
| h2 (章节) | {self.config.get('typography', {}).get('h2_size', 36)}pt |
| h3 (页面标题) | {self.config.get('typography', {}).get('h3_size', 28)}pt |
| h4 (卡片标题) | {self.config.get('typography', {}).get('h4_size', 20)}pt |
| body | {self.config.get('typography', {}).get('body_size', 16)}pt |
| caption | {self.config.get('typography', {}).get('caption_size', 12)}pt |
"""
        return ref

    def export_design_md(self) -> str:
        """导出为 DESIGN.md 格式"""
        info = self.get_theme_info()
        colors = self.config.get("colors", {})
        typography = self.config.get("typography", {})
        layout = self.config.get("layout", {})
        decorations = self.config.get("decorations", {})

        md = f"""# {info['name']} DESIGN.md

> 自动生成的设计系统文档 | 适用于 PPT 演示文稿

---

## 1. 视觉主题 & 氛围

**风格定位**: {info['description']}

**情绪关键词**: {info['mood']}

**适用场景**: {info['scene']}

---

## 2. 色彩系统

### 主色系
| 角色 | 色值 | 用途 |
|------|------|------|
| primary | {colors.get('primary', '#000000')} | 主背景 |
| primary-light | {colors.get('primary_light', '#000000')} | 卡片背景 |
| primary-dark | {colors.get('primary_dark', '#000000')} | 深色变体 |

### 强调色
| 角色 | 色值 | 用途 |
|------|------|------|
| accent | {colors.get('accent', '#000000')} | 品牌强调 |
| accent-light | {colors.get('accent_light', '#000000')} | 浅色强调 |

### 功能色
| 角色 | 色值 | 用途 |
|------|------|------|
| success | {colors.get('success', '#000000')} | 正向指标 |
| warning | {colors.get('warning', '#000000')} | 警示信息 |
| danger | {colors.get('danger', '#000000')} | 风险预警 |

### 文字色
| 角色 | 色值 | 用途 |
|------|------|------|
| text-primary | {colors.get('text_primary', '#000000')} | 主标题 |
| text-secondary | {colors.get('text_secondary', '#000000')} | 副标题 |
| text-muted | {colors.get('text_muted', '#000000')} | 注释 |

---

## 3. 字体系统

| 层级 | 字号 | 用途 |
|------|------|------|
| h1 | {typography.get('h1_size', 44)}pt | 封面标题 |
| h2 | {typography.get('h2_size', 36)}pt | 章节标题 |
| h3 | {typography.get('h3_size', 28)}pt | 页面标题 |
| h4 | {typography.get('h4_size', 20)}pt | 卡片标题 |
| body | {typography.get('body_size', 16)}pt | 正文 |
| caption | {typography.get('caption_size', 12)}pt | 注释 |

---

## 4. 布局网格

| 属性 | 值 |
|------|------|
| 页面尺寸 | 16:9 (13.333 x 7.5 in) |
| 边距 (左右) | {layout.get('margin_left', 0.8)}in |
| 边距 (上下) | {layout.get('margin_top', 0.6)}in |
| 卡片圆角 | {layout.get('card_radius', 12)}px |
| 卡片内边距 | {layout.get('card_padding', 20)}px |
| 卡片间距 | {layout.get('card_spacing', 16)}px |
| 阴影 | {layout.get('shadow', 'none')} |

---

## 5. 装饰元素

| 元素 | 值 |
|------|------|
| 强调线高度 | {decorations.get('accent_line_height', 4)}px |
| 图标尺寸 | {decorations.get('icon_size', 24)}px |
| 圆点尺寸 | {decorations.get('dot_size', 8)}px |

---

## 6. AI Agent 使用方式

### 快速引用
```
主色: {colors.get('primary', '#000000')}
强调色: {colors.get('accent', '#000000')}
圆角: {layout.get('card_radius', 12)}px
```

### 提示词模板
```
创建一个 {info['name']} 风格的 PPT：
- 配色: {colors.get('primary', '#000000')} + {colors.get('accent', '#000000')}
- 字体: h1={typography.get('h1_size', 44)}pt, body={typography.get('body_size', 16)}pt
- 圆角: {layout.get('card_radius', 12)}px
```

---
*此文件由 DesignSystem 自动生成
"""
        return md


# ══════════════════════════════════════════════════════════════
# 便捷函数
# ══════════════════════════════════════════════════════════════

def load_theme(theme_name: str = "executive") -> DesignSystem:
    """加载预设主题"""
    return DesignSystem(theme_name)


def load_from_design_md(file_path: str) -> DesignSystem:
    """从 DESIGN.md 文件加载（未来扩展）"""
    # TODO: 实现从 Markdown 解析
    raise NotImplementedError("敬请期待")


def list_themes() -> List[str]:
    """列出所有可用主题"""
    return list(PRESET_THEMES.keys())


def get_theme_info(theme_name: str) -> Dict:
    """获取主题信息"""
    if theme_name in PRESET_THEMES:
        theme = PRESET_THEMES[theme_name]
        return {
            "name": theme.get("name", ""),
            "description": theme.get("description", ""),
            "mood": theme.get("mood", ""),
            "scene": theme.get("scene", ""),
        }
    return {}


if __name__ == "__main__":
    # 测试代码
    print("=== 可用主题 ===")
    for theme in list_themes():
        info = get_theme_info(theme)
        print(f"- {theme}: {info['name']} | {info['description']}")

    print("\n=== Executive 快速参考 ===")
    ds = load_theme("executive")
    print(ds.get_quick_ref())

    print("\n=== 导出 DESIGN.md ===")
    print(ds.export_design_md()[:500] + "...")
