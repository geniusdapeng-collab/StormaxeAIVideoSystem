#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图表生成器 - V2.0 专业版
支持：雷达图/漏斗图/矩阵图/金字塔/甘特图/热力图/旭日图/仪表盘
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as path_effects
import numpy as np
from io import BytesIO
from PIL import Image
import warnings
warnings.filterwarnings('ignore')

# ══════════════════════════════════════════════════════════════
# 专业配色主题
# ══════════════════════════════════════════════════════════════

THEMES = {
    "executive": {
        "name": "Executive",
        "bg": "#0D1B2A",
        "card_bg": "#1B2838",
        "text": "#FFFFFF",
        "muted": "#8899AA",
        "accent": "#FFB700",
        "accent2": "#24C6DC",
        "success": "#00E676",
        "warning": "#FF9800",
        "danger": "#F44336",
        "border": "#2D3F52",
    },
    "spark": {
        "name": "Spark",
        "bg": "#0f0c29",
        "card_bg": "#1e1e3e",
        "text": "#F0F0F0",
        "muted": "#A0B0C0",
        "accent": "#24C6DC",
        "accent2": "#8b5cf6",
        "success": "#00E676",
        "warning": "#FF9800",
        "danger": "#F44336",
        "border": "#4a4a7a",
    },
    "terminal": {
        "name": "Terminal",
        "bg": "#1A1A1A",
        "card_bg": "#252525",
        "text": "#FFFFFF",
        "muted": "#B3B3B3",
        "accent": "#00E676",
        "accent2": "#00BFA5",
        "success": "#00E676",
        "warning": "#FFB700",
        "danger": "#FF5252",
        "border": "#333333",
    },
    "clean": {
        "name": "Clean",
        "bg": "#FFFFFF",
        "card_bg": "#F8F8F8",
        "text": "#1A1A1A",
        "muted": "#666666",
        "accent": "#E63946",
        "accent2": "#457B9D",
        "success": "#2A9D8F",
        "warning": "#E9C46A",
        "danger": "#E63946",
        "border": "#E0E0E0",
    },
}

DEFAULT_THEME = "executive"


def hex_to_rgb(hex_color):
    """HEX转RGB (0-1范围)"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16)/255 for i in (0, 2, 4))


def hex_to_rgb_255(hex_color):
    """HEX转RGB (0-255范围)"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def fig_to_image(fig, dpi=150):
    """Matplotlib图表转PIL图像"""
    buf = BytesIO()
    fig.savefig(buf, format='PNG', dpi=dpi, facecolor=fig.get_facecolor(),
                bbox_inches='tight', pad_inches=0.3, transparent=False)
    buf.seek(0)
    img = Image.open(buf).copy()
    buf.close()
    plt.close(fig)
    return img


# ══════════════════════════════════════════════════════════════
# 雷达图
# ══════════════════════════════════════════════════════════════

def create_radar_chart(values, labels, title="", theme=DEFAULT_THEME):
    """雷达图 - 多维度能力评估"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    plt.rcParams['font.family'] = ['DejaVu Sans', 'sans-serif']
    plt.rcParams['axes.unicode_minus'] = False
    
    fig, ax = plt.subplots(figsize=(8, 8), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    
    # 角度计算
    num_vars = len(values)
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    angles += angles[:1]
    values_plot = values + values[:1]
    
    # 绘制填充区域
    accent_rgb = hex_to_rgb(t['accent'])
    ax.fill(angles, values_plot, facecolor=accent_rgb, alpha=0.25, edgecolor=accent_rgb, linewidth=2.5)
    ax.plot(angles, values_plot, 'o-', linewidth=2.5, markersize=10, color=t['accent'])
    
    # 填充网格
    for level in [20, 40, 60, 80, 100]:
        ax.plot(angles, [level]*len(angles), '--', color=t['border'], alpha=0.3, linewidth=0.8)
    
    # 标签
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels([f"L{i+1}" for i in range(num_vars)], color=t['muted'], fontsize=13, fontweight='bold')
    
    # 设置极坐标
    max_val = max(values) * 1.2 if max(values) > 0 else 100
    ax.set_ylim(0, max_val)
    ax.set_yticks([max_val*i/4 for i in range(1, 5)])
    ax.set_yticklabels([], color=t['muted'], fontsize=10)
    ax.grid(True, color=t['border'], alpha=0.5, linewidth=0.8)
    for spine in ax.spines.values():
        spine.set_visible(False)
    
    # 数值标注
    for i, (angle, val) in enumerate(zip(angles[:-1], values)):
        ax.annotate(f'{int(val)}', xy=(angle, val), xytext=(angle, val + max_val*0.08),
                   fontsize=11, fontweight='bold', color=t['accent'], ha='center')
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=25)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 漏斗图
# ══════════════════════════════════════════════════════════════

def create_funnel_chart(values, labels, title="", theme=DEFAULT_THEME):
    """漏斗图 - 转化流程可视化"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax = plt.subplots(figsize=(10, 8), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.5, len(values) + 0.5)
    ax.axis('off')
    
    n = len(values)
    max_val = max(values) if max(values) > 0 else 1
    
    # 颜色渐变
    colors = plt.cm.Blues(np.linspace(0.9, 0.4, n))
    
    for i, (val, label) in enumerate(zip(values, labels)):
        ratio = val / max_val
        width = 0.8 * ratio
        height = 0.75
        
        # 梯形路径
        y_pos = n - i - 1
        
        # 绘制梯形
        trapezoid = patches.FancyBboxPatch(
            ((1 - width) / 2, y_pos * 0.85), width, height,
            boxstyle="round,pad=0.02,rounding_size=0.15",
            facecolor=colors[i],
            edgecolor='none',
            alpha=0.95
        )
        ax.add_patch(trapezoid)
        
        # 数值
        ax.text(0.5, y_pos * 0.85 + 0.38, f"{int(val):,}",
                ha='center', va='center', fontsize=16, fontweight='bold', color='white')
        
        # 转化率
        if i > 0:
            prev_ratio = values[i-1] / max_val
            conv_rate = val / values[i-1] * 100
            ax.text(0.5 + width/2 + 0.05, y_pos * 0.85 + 0.38, f"↓{conv_rate:.1f}%",
                    ha='left', va='center', fontsize=11, color=t['accent'], fontweight='bold')
        
        # 标签
        ax.text(0.5, y_pos * 0.85 + 0.12, label,
                ha='center', va='center', fontsize=11, color='white', fontweight='bold')
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=20, loc='left', x=0.1)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 矩阵图（BCG矩阵）
# ══════════════════════════════════════════════════════════════

def create_matrix_chart(quadrant_data, xlabel="X轴", ylabel="Y轴", title="", theme=DEFAULT_THEME):
    """矩阵图 - 四象限分析"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax = plt.subplots(figsize=(10, 9), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    
    # 四象限颜色
    quadrant_colors = [
        ('#1B5E20', '明星', '高增长·高份额'),  # 右上
        ('#E65100', '问题', '高增长·低份额'),  # 左上
        ('#B71C1C', '瘦狗', '低增长·低份额'),  # 左下
        ('#1565C0', '金牛', '低增长·高份额'),  # 右下
    ]
    
    # 绘制象限背景
    positions = [
        (0.5, 0.5, 0.5, 0.5),   # 右上
        (0, 0.5, 0.5, 0.5),     # 左上
        (0, 0, 0.5, 0.5),       # 左下
        (0.5, 0, 0.5, 0.5),     # 右下
    ]
    
    for (x, y, w, h), (color, name, desc) in zip(positions, quadrant_colors):
        rect = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.01",
            facecolor=color,
            edgecolor=t['bg'],
            alpha=0.25,
            linewidth=3
        )
        ax.add_patch(rect)
        
        # 象限名称
        ax.text(x + w/2, y + h/2 + 0.08, name, fontsize=32, fontweight='bold',
                ha='center', va='center', color=color, alpha=0.9)
        ax.text(x + w/2, y + h/2 - 0.08, desc, fontsize=12,
                ha='center', va='center', color=t['muted'], alpha=0.6)
        
        # 绘制示例数据点
        if quadrant_data and len(quadrant_data) > 0:
            data_idx = positions.index((x, y, w, h))
            if data_idx < len(quadrant_data) and quadrant_data[data_idx]:
                items = quadrant_data[data_idx][:3]  # 最多显示3个
                y_offset = 0.15
                for item in items:
                    ax.text(x + w/2, y + h/2 - y_offset, f"• {item}", 
                           fontsize=10, ha='center', va='center', color=t['text'], alpha=0.7)
                    y_offset += 0.1
    
    # 中心分隔线
    ax.axhline(y=0.5, color=t['muted'], linestyle='-', linewidth=2, alpha=0.5)
    ax.axvline(x=0.5, color=t['muted'], linestyle='-', linewidth=2, alpha=0.5)
    
    # 轴标签
    ax.text(1.02, 0.5, f"{ylabel}\n→", fontsize=13, fontweight='bold', color=t['accent'],
            ha='left', va='center', transform=ax.transAxes, rotation=0)
    ax.text(0.5, -0.05, f"→ {xlabel}", fontsize=13, fontweight='bold', color=t['accent'],
            ha='center', va='top', transform=ax.transAxes)
    
    ax.set_xlim(-0.05, 1.05)
    ax.set_ylim(-0.05, 1.05)
    ax.axis('off')
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15, loc='left', x=0.02)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 金字塔图
# ══════════════════════════════════════════════════════════════

def create_pyramid_chart(values, labels, title="", theme=DEFAULT_THEME):
    """金字塔图 - 层级结构"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax = plt.subplots(figsize=(10, 8), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.5, len(values) + 0.3)
    ax.axis('off')
    
    n = len(values)
    max_val = max(values) if max(values) > 0 else 100
    
    # 颜色渐变
    colors = plt.cm.RdYlGn(np.linspace(0.8, 0.3, n))[::-1]
    
    for i, (val, label) in enumerate(zip(values, labels)):
        ratio = val / max_val
        width = 0.85 * ratio
        height = 0.8
        
        y_pos = n - i - 1
        
        # 绘制
        rect = patches.FancyBboxPatch(
            ((1 - width) / 2, y_pos * 0.85), width, height,
            boxstyle="round,pad=0.01,rounding_size=0.1",
            facecolor=colors[i],
            edgecolor='none',
            alpha=0.95
        )
        ax.add_patch(rect)
        
        # 百分比
        pct = int(val)
        ax.text(0.5, y_pos * 0.85 + 0.4, f"{pct}%",
                ha='center', va='center', fontsize=18, fontweight='bold', color='white')
        
        # 标签
        ax.text(0.5, y_pos * 0.85 + 0.1, label,
                ha='center', va='center', fontsize=11, color='white', fontweight='bold')
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=20, loc='left', x=0.05)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 甘特图
# ══════════════════════════════════════════════════════════════

def create_gantt_chart(tasks, title="", theme=DEFAULT_THEME):
    """甘特图 - 项目进度管理"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax = plt.subplots(figsize=(12, max(6, len(tasks) * 0.8 + 2)), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    
    n = len(tasks)
    
    for i, task in enumerate(tasks):
        start = task.get('start', 0)
        duration = task.get('duration', 1)
        task_name = task.get('name', f'Task {i+1}')
        progress = task.get('progress', 100)
        status = task.get('status', 'complete')
        
        # 颜色根据状态
        if status == 'complete':
            color = t['success']
        elif status == 'in_progress':
            color = t['accent']
        elif status == 'pending':
            color = t['muted']
        else:
            color = t['danger']
        
        # 绘制进度条
        y_pos = n - i - 1
        
        # 背景条
        bg = patches.Rectangle((start, y_pos - 0.3), duration, 0.6,
                               facecolor=t['card_bg'], edgecolor=t['border'], linewidth=1)
        ax.add_patch(bg)
        
        # 进度条
        progress_width = duration * (progress / 100)
        if progress_width > 0:
            bar = patches.Rectangle((start, y_pos - 0.3), progress_width, 0.6,
                                   facecolor=color, edgecolor='none', alpha=0.9)
            ax.add_patch(bar)
        
        # 任务名称
        ax.text(-0.5, y_pos, task_name, fontsize=12, fontweight='bold',
               color=t['text'], va='center', ha='right')
        
        # 进度百分比
        ax.text(start + duration + 0.2, y_pos, f"{progress}%", fontsize=11,
               color=color, va='center', ha='left', fontweight='bold')
    
    # 设置坐标轴
    ax.set_xlim(-6, max(t.get('start', 0) + t.get('duration', 1) for t in tasks) + 2)
    ax.set_ylim(-0.8, n + 0.3)
    ax.set_yticks([])
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_color(t['border'])
    ax.spines['left'].set_visible(False)
    ax.grid(axis='x', color=t['border'], alpha=0.3, linestyle='--')
    ax.set_xlabel('时间（天）', color=t['muted'], fontsize=11)
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15, loc='left', x=0.02)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 热力图
# ══════════════════════════════════════════════════════════════

def create_heatmap_chart(data, xlabels, ylabels, title="", theme=DEFAULT_THEME):
    """热力图 - 数据分布可视化"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax = plt.subplots(figsize=(max(10, len(xlabels) * 1.2), max(6, len(ylabels) * 0.8 + 2)), 
                          facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    
    # 绘制热力图
    cmap = plt.cm.YlOrRd
    im = ax.imshow(data, cmap=cmap, aspect='auto', vmin=0, vmax=np.max(data) if np.max(data) > 0 else 100)
    
    # 设置标签
    ax.set_xticks(np.arange(len(xlabels)))
    ax.set_yticks(np.arange(len(ylabels)))
    ax.set_xticklabels(xlabels, color=t['muted'], fontsize=11)
    ax.set_yticklabels(ylabels, color=t['muted'], fontsize=11)
    
    # 添加数值标注
    for i in range(len(ylabels)):
        for j in range(len(xlabels)):
            val = data[i, j]
            color = 'white' if val > np.max(data) * 0.6 else t['text']
            ax.text(j, i, f'{val:.0f}', ha='center', va='center', 
                   color=color, fontsize=11, fontweight='bold')
    
    # 颜色条
    cbar = plt.colorbar(im, ax=ax, shrink=0.8)
    cbar.ax.tick_params(colors=t['muted'])
    cbar.set_label('数值', color=t['muted'])
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15, loc='left', x=0.02)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 旭日图
# ══════════════════════════════════════════════════════════════

def create_sunburst_chart(data, title="", theme=DEFAULT_THEME):
    """旭日图 - 多级占比结构"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    import matplotlib.cm as cm
    
    fig, ax = plt.subplots(figsize=(10, 10), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    
    # 层级数据
    levels = data.get('levels', [])
    colors = plt.cm.Set3(np.linspace(0, 1, 12))
    
    # 中心圆
    center_circle = plt.Circle((0.5, 0.5), 0.2, color=t['card_bg'], ec=t['border'], lw=2)
    ax.add_patch(center_circle)
    
    # 第一层（内圈）
    if levels and len(levels) > 0:
        level1 = levels[0]
        items = list(level1.items())
        n = len(items)
        total = sum(items.values()) if sum(items.values()) > 0 else 1
        
        for i, (name, val) in enumerate(items):
            # 角度
            start_angle = 360 * sum(v for k, v in items[:i]) / total - 90
            end_angle = start_angle + 360 * val / total
            
            # 绘制扇形
            wedge = patches.Wedge(
                (0.5, 0.5), 0.4, start_angle, end_angle,
                facecolor=colors[i % len(colors)], alpha=0.9, edgecolor=t['bg'], lw=2
            )
            ax.add_patch(wedge)
            
            # 标签
            mid_angle = np.radians(start_angle + (end_angle - start_angle)/2)
            label_r = 0.3
            x = 0.5 + label_r * np.cos(mid_angle)
            y = 0.5 + label_r * np.sin(mid_angle)
            ax.text(x, y, name, fontsize=9, fontweight='bold',
                   ha='center', va='center', color=t['text'])
    
    # 第二层（外圈）
    if len(levels) > 1:
        level2 = levels[1]
        items2 = list(level2.items())
        n = len(items2)
        
        for i, (name, val) in enumerate(items2):
            start_angle = 360 * sum(v for k, v in items2[:i]) / sum(items2.values()) - 90 if sum(items2.values()) > 0 else 0
            end_angle = start_angle + 360 * val / sum(items2.values()) if sum(items2.values()) > 0 else 0
            
            wedge = patches.Wedge(
                (0.5, 0.5), 0.7, start_angle, end_angle,
                facecolor=colors[(i+3) % len(colors)], alpha=0.7, edgecolor=t['bg'], lw=1
            )
            ax.add_patch(wedge)
            
            # 标签
            mid_angle = np.radians(start_angle + (end_angle - start_angle)/2)
            label_r = 0.55
            x = 0.5 + label_r * np.cos(mid_angle)
            y = 0.5 + label_r * np.sin(mid_angle)
            ax.text(x, y, f'{name}', fontsize=7,
                   ha='center', va='center', color='white')
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_aspect('equal')
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=20)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 仪表盘
# ══════════════════════════════════════════════════════════════

def create_gauge_chart(value, label="", min_val=0, max_val=100, title="", theme=DEFAULT_THEME):
    """仪表盘 - KPI指标展示"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig = plt.figure(figsize=(8, 6), facecolor=t['bg'])
    
    # 使用条形图模拟仪表盘
    ax = fig.add_subplot(111)
    ax.set_facecolor(t['bg'])
    
    # 计算比例
    value = max(min_val, min(max_val, value))
    ratio = (value - min_val) / (max_val - min_val) if max_val > min_val else 0.5
    
    # 背景弧（灰色）
    ax.barh(0, 1, height=0.3, left=0, color=t['border'], alpha=0.3)
    
    # 数值弧
    if ratio < 0.3:
        color = t['danger']
    elif ratio < 0.7:
        color = t['warning']
    else:
        color = t['success']
    
    ax.barh(0, ratio, height=0.3, left=0, color=color, alpha=0.9)
    
    # 中心数值
    ax.text(0.5, 0.2, f'{value:.0f}', fontsize=48, fontweight='bold',
           ha='center', va='center', color=t['text'])
    ax.text(0.5, -0.15, label, fontsize=16, ha='center', va='center', color=t['muted'])
    
    # 范围
    ax.text(0, 0.6, f'{min_val}', fontsize=12, ha='left', color=t['muted'])
    ax.text(1, 0.6, f'{max_val}', fontsize=12, ha='right', color=t['muted'])
    
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.5, 1)
    ax.axis('off')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 词云图
# ══════════════════════════════════════════════════════════════

def create_wordcloud_chart(words, title="", theme=DEFAULT_THEME):
    """词云图 - 文本分析"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    # 简单的词云效果（不使用wordcloud库）
    fig, ax = plt.subplots(figsize=(10, 8), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    ax.axis('off')
    
    # 准备数据
    if isinstance(words, dict):
        word_list = [(w, v) for w, v in words.items()]
    else:
        word_list = words
    
    word_list.sort(key=lambda x: x[1], reverse=True)
    n = len(word_list)
    
    # 颜色
    if 'accent' in t:
        colors = [t['accent'], t['accent2'] if 'accent2' in t else t['accent'], t['success'], t['warning']]
    else:
        colors = plt.cm.Set2(np.linspace(0, 1, 8))
    
    # 绘制文字
    positions = []
    for i, (word, freq) in enumerate(word_list[:15]):  # 最多15个词
        # 随机但有规律的位置
        import random
        random.seed(i * 42)
        
        x = random.uniform(0.1, 0.9)
        y = random.uniform(0.2, 0.8)
        
        # 大小根据频率
        size = int(3000 + freq * 70)
        color = colors[i % len(colors)]
        
        ax.text(x, y, word, fontsize=min(size // 100, 48), 
               fontweight='bold', color=color, alpha=0.85,
               ha='center', va='center',
               rotation=random.uniform(-15, 15))
        
        positions.append((x, y))
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15, loc='left', x=0.02)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 柱状图 + 折线图组合
# ══════════════════════════════════════════════════════════════

def create_combo_chart(categories, bar_values, line_values, title="", theme=DEFAULT_THEME):
    """组合图 - 柱状图+折线图"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax1 = plt.subplots(figsize=(12, 6), facecolor=t['bg'])
    ax1.set_facecolor(t['bg'])
    
    x = np.arange(len(categories))
    bar_width = 0.6
    
    # 柱状图
    bars = ax1.bar(x, bar_values, bar_width, color=t['accent'], alpha=0.85, label='Primary')
    
    # 数值标注
    for bar, val in zip(bars, bar_values):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(bar_values)*0.02,
                f'{val:.0f}', ha='center', va='bottom', fontsize=11, fontweight='bold', color=t['accent'])
    
    ax1.set_xlabel('Categories', color=t['muted'], fontsize=12)
    ax1.set_ylabel('Bar Values', color=t['accent'], fontsize=12)
    ax1.tick_params(axis='y', labelcolor=t['accent'])
    ax1.set_xticks(x)
    ax1.set_xticklabels([f'C{i+1}' for i in range(len(categories))], color=t['muted'], fontsize=11)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.grid(axis='y', color=t['border'], alpha=0.3, linestyle='--')
    
    # 折线图
    ax2 = ax1.twinx()
    ax2.plot(x, line_values, 'o-', color=t['accent2'], linewidth=3, markersize=10, label='Trend')
    
    # 数值标注
    for xi, yi in zip(x, line_values):
        ax2.annotate(f'{yi:.1f}%', xy=(xi, yi), xytext=(0, 10),
                    textcoords='offset points', ha='center', fontsize=10, 
                    color=t['accent2'], fontweight='bold')
    
    ax2.set_ylabel('Line Values (%)', color=t['accent2'], fontsize=12)
    ax2.tick_params(axis='y', labelcolor=t['accent2'])
    ax2.spines['top'].set_visible(False)
    
    if title:
        ax1.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15, loc='left', x=0.02)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 堆叠柱状图
# ══════════════════════════════════════════════════════════════

def create_stacked_bar_chart(categories, segments, title="", theme=DEFAULT_THEME):
    """堆叠柱状图 - 构成分析"""
    t = THEMES.get(theme, THEMES[DEFAULT_THEME])
    
    fig, ax = plt.subplots(figsize=(12, 6), facecolor=t['bg'])
    ax.set_facecolor(t['bg'])
    
    n = len(categories)
    segment_names = list(segments.keys())
    segment_values = list(segments.values())
    
    colors = [t['accent'], t['accent2'], t['success'], t['warning'], t['danger']][:len(segment_names)]
    bottom = np.zeros(n)
    
    x = np.arange(n)
    bar_width = 0.6
    
    for i, (name, values) in enumerate(zip(segment_names, segment_values)):
        bars = ax.bar(x, values, bar_width, bottom=bottom, color=colors[i], 
                     label=name, alpha=0.9, edgecolor='none')
        
        # 添加数值标注
        for bar, val in zip(bars, values):
            if val > 5:  # 太小的部分不标注
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_y() + bar.get_height()/2,
                       f'{val:.0f}%', ha='center', va='center', fontsize=10, 
                       color='white', fontweight='bold')
        
        bottom += values
    
    ax.set_xlabel('Categories', color=t['muted'], fontsize=12)
    ax.set_ylabel('Percentage', color=t['muted'], fontsize=12)
    ax.set_xticks(x)
    ax.set_xticklabels([f'C{i+1}' for i in range(n)], color=t['muted'], fontsize=11)
    ax.tick_params(colors=t['muted'])
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', color=t['border'], alpha=0.3, linestyle='--')
    ax.legend(facecolor=t['card_bg'], edgecolor=t['border'], labelcolor=t['text'], loc='upper right')
    
    if title:
        ax.set_title(title, color=t['text'], fontsize=18, fontweight='bold', pad=15, loc='left', x=0.02)
    
    plt.tight_layout()
    return fig_to_image(fig)


# ══════════════════════════════════════════════════════════════
# 测试代码
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # 测试各种图表
    print("测试雷达图...")
    img = create_radar_chart([85, 72, 90, 68, 78, 82], ["沟通", "技术", "创新", "协作", "执行", "领导"])
    img.save('/tmp/test_radar.png')
    
    print("测试漏斗图...")
    img = create_funnel_chart([10000, 5000, 2000, 500, 300], ["曝光", "点击", "注册", "下单", "支付"])
    img.save('/tmp/test_funnel.png')
    
    print("测试矩阵图...")
    img = create_matrix_chart([["产品A"], ["产品B"], ["产品C"], ["产品D"]], "增长率", "市场份额")
    img.save('/tmp/test_matrix.png')
    
    print("测试金字塔...")
    img = create_pyramid_chart([10, 30, 60], ["高层", "中层", "基层"])
    img.save('/tmp/test_pyramid.png')
    
    print("测试甘特图...")
    img = create_gantt_chart([
        {'name': '需求分析', 'start': 0, 'duration': 5, 'progress': 100, 'status': 'complete'},
        {'name': '系统设计', 'start': 5, 'duration': 8, 'progress': 100, 'status': 'complete'},
        {'name': '开发', 'start': 10, 'duration': 15, 'progress': 60, 'status': 'in_progress'},
        {'name': '测试', 'start': 20, 'duration': 5, 'progress': 0, 'status': 'pending'},
    ])
    img.save('/tmp/test_gantt.png')
    
    print("测试热力图...")
    data = np.random.rand(8, 6) * 100
    img = create_heatmap_chart(data, ['A', 'B', 'C', 'D', 'E', 'F'], ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'])
    img.save('/tmp/test_heatmap.png')
    
    print("测试仪表盘...")
    img = create_gauge_chart(78, '完成率', 0, 100)
    img.save('/tmp/test_gauge.png')
    
    print("测试词云...")
    img = create_wordcloud({'供应链': 95, '效率': 88, '成本': 82, '质量': 90, '创新': 75, '协同': 85})
    img.save('/tmp/test_wordcloud.png')
    
    print("测试组合图...")
    img = create_combo_chart(['1月', '2月', '3月', '4月', '5月'], [120, 150, 180, 160, 200], [5.2, 6.8, 7.5, 6.2, 8.1])
    img.save('/tmp/test_combo.png')
    
    print("测试堆叠柱状图...")
    img = create_stacked_bar_chart(
        ['Q1', 'Q2', 'Q3', 'Q4'],
        {'线上': [60, 65, 70, 75], '线下': [30, 25, 20, 15], '其他': [10, 10, 10, 10]}
    )
    img.save('/tmp/test_stacked.png')
    
    print("所有图表测试完成！")
