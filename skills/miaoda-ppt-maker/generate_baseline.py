#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V3.9 完整版 - 修复三个问题
1. 七步工作流完整7步
2. 图形图示加description说明阐述模块
3. 内容详细完整
"""

import sys
sys.path.insert(0, '/home/gem/workspace/agent/skills/miaoda-ppt-maker')

from generate_ppt import create_ppt_v3_with_images

print("=" * 70)
print("V9技能生产标准 PPT（V3.9完整版）")
print("=" * 70)

IMAGES_DIR = "/home/gem/workspace/agent/media/tool-image-generation/"

# 20张新生成的配图
IMAGES = [
    IMAGES_DIR + "generated---06c10de7-6f27-4208-93ba-e74da15b4510.png",  # 封面
    IMAGES_DIR + "generated---e164b7a3-4e11-4857-9db7-3e2d7cb8ad42.png",  # 目录
    IMAGES_DIR + "generated---ffe16c2a-c1dd-447f-9109-6762e780cc06.png",  # 背景
    IMAGES_DIR + "generated---8fe623b6-d5c8-4330-ac85-7595d0d75348.png",  # 价值
    IMAGES_DIR + "generated---f2767c11-4713-46cd-bc43-789aa85123d2.png",  # 为什么标准化
    IMAGES_DIR + "generated---e46eafc9-6d73-4817-a23c-2fe0ad0c422a.png",  # 七步工作流
    IMAGES_DIR + "generated---5c8d493b-9703-4d05-83b3-4285e852b671.png",  # 五大维度
    IMAGES_DIR + "generated---8eb5dd26-93fc-4e9c-b04d-9c5d71ae5d58.png",  # 准确性
    IMAGES_DIR + "generated---9b4b2d80-7f38-4d97-a7da-fa97715dad82.png",  # 完整性
    IMAGES_DIR + "generated---ddbec2b8-d34f-494f-8655-5d50213b7ab8.png",  # 可执行性
    IMAGES_DIR + "generated---1689fe06-7983-4525-86df-7b68b41fc64e.png",  # 专业性+时效性
    IMAGES_DIR + "generated---754e0a44-c027-4ed8-aba6-211b0feab734.png",  # 六大模块
    IMAGES_DIR + "generated---c93e4b36-33ef-4d39-b566-45e9c4bee4bf.png",  # 触发词
    IMAGES_DIR + "generated---503948dd-e4b1-496a-bfff-d754d6948280.png",  # 代码规范
    IMAGES_DIR + "generated---c63ebe38-0bf0-4dce-acd0-8bb096da0cb4.png",  # 质量评分卡
    IMAGES_DIR + "generated---2240fc3e-2c8f-49ac-90e6-44ad88ef89d5.png",  # 质量门禁
    IMAGES_DIR + "generated---aeda34ea-e6bd-49ef-88c6-bdb63e716e8b.png",  # 检查清单
    IMAGES_DIR + "generated---0d61c383-950a-4374-a97f-dd640589ad90.png",  # 效果对比
    IMAGES_DIR + "generated---1b0eebe7-550d-4fb1-bc49-1d94e111362f.png",  # 总结
    IMAGES_DIR + "generated---73ef7426-b2bb-4e78-ba98-af6300ab6b02.png",  # 结尾
]

# 完整的详细内容
slides = [
    # ===== Slide 1: 封面 =====
    {"type": "title", "main": "V9.0 技能生产标准", "sub": "从能用到好用且可靠的标准化方法论", "tag": "高效小G技能工厂 | 2026.04"},
    
    # ===== Slide 2: 目录 =====
    {"type": "icons_grid", "title": "目录", "columns": 3, "items": [
        {"title": "背景与定位", "desc": "4页", "icon": "📍"},
        {"title": "五大维度体系", "desc": "6页", "icon": "🎯"},
        {"title": "六大核心模块", "desc": "8页", "icon": "🧩"},
        {"title": "质量门禁", "desc": "4页", "icon": "🛡️"},
        {"title": "总结", "desc": "2页", "icon": "📊"},
    ], "sub": "掌握这三大模块 + 质量门禁", "description": "本PPT系统介绍V9.0技能生产标准的完整方法论，包括背景定位、评估体系、核心模块和质量保障，帮助团队系统化生产高质量技能资产。"},
    
    # ===== Slide 3-5: 背景与定位 =====
    {"type": "content_cards", "title": "① 背景与定位", "items": [
        {"title": "问题现状", "value": "技能资产分散、难以复用、质量参差不齐"},
        {"title": "解决思路", "value": "建立标准化生产流程，统一规范和质量标准"},
        {"title": "核心理念", "value": "一切为了表达！"},
    ]},
    {"type": "content_cards", "title": "技能资产的三大价值", "items": [
        {"title": "复用价值", "value": "一次开发，多次复用，降低重复劳动"},
        {"title": "质量保障", "value": "标准化流程保障输出质量一致性"},
        {"title": "知识沉淀", "value": "构建企业级资产库，避免经验流失"},
    ]},
    {"type": "content_cards", "title": "为什么需要标准化？", "items": [
        {"title": "效率提升", "value": "标准化让开发周期从3-5天缩短到1天"},
        {"title": "质量稳定", "value": "不再依赖个人经验，质量可预期"},
        {"title": "易于维护", "value": "统一规范让代码和文档更易维护"},
    ]},
    
    # ===== Slide 6-7: 七步工作流（完整7步） =====
    {"type": "icons_grid", "title": "七步工作流", "columns": 4, "items": [
        {"title": "①受众分析", "desc": "听众是谁？", "icon": "👥"},
        {"title": "②核心叙事", "desc": "叙事主线？", "icon": "📖"},
        {"title": "③内容理解", "desc": "理解为什么", "icon": "💡"},
        {"title": "④结构规划", "desc": "内容结构化", "icon": "🏗️"},
        {"title": "⑤表达决策", "desc": "如何呈现？", "icon": "🎨"},
        {"title": "⑥内容制作", "desc": "充分展开", "icon": "✍️"},
        {"title": "⑦质量检查", "desc": "三重门禁", "icon": "✅"},
    ], "sub": "先理解受众，再构建叙事，最后选择表达方式", "description": "七步工作流是V9.0技能生产的核心方法论，每一步都有明确的目标和产出物，确保技能开发的质量和效率。"},
    {"type": "content_cards", "title": "七步工作流详解", "items": [
        {"title": "①受众分析", "value": "明确听众是谁、痛点是什么、期望获得什么"},
        {"title": "②核心叙事", "value": "构建30秒电梯演讲，确定叙事主线和情感曲线"},
        {"title": "③内容理解", "value": "深入理解'为什么'，不止于表面描述"},
        {"title": "④结构规划", "value": "规划内容展开方式，复杂主题20-30页"},
        {"title": "⑤表达决策", "value": "根据内容关系选择最佳表达方式"},
        {"title": "⑥内容制作", "value": "充分展开每个要点，有案例支撑"},
        {"title": "⑦质量检查", "value": "三重门禁保障：自动检查+质量评分+上线审批"},
    ]},
    
    # ===== Slide 8-14: 五大维度 =====
    {"type": "radar", "title": "② 五大维度评估体系", "items": [
        {"title": "准确性 25%", "value": 95},
        {"title": "完整性 15%", "value": 92},
        {"title": "可执行性 20%", "value": 96},
        {"title": "专业性 20%", "value": 90},
        {"title": "时效性 20%", "value": 94}
    ], "sub": "总分>=92%才合格", "description": "五大维度是技能质量的评估标准，每个维度都有明确的权重和合格线，总分低于92%需要返工优化。"},
    {"type": "content_cards", "title": "准确性维度详解", "items": [
        {"title": "定义", "value": "技能输出的准确程度，即答案的正确性"},
        {"title": "衡量标准", "value": "准确率>=95%，错误率<=5%"},
        {"title": "检查方法", "value": "多场景测试，覆盖正常和边界情况"},
        {"title": "常见问题", "value": "幻觉、知识过时、概念混淆"},
    ]},
    {"type": "content_cards", "title": "完整性维度详解", "items": [
        {"title": "定义", "value": "覆盖场景的全面程度，无遗漏关键信息"},
        {"title": "衡量标准", "value": "覆盖率>=90%，核心场景100%覆盖"},
        {"title": "检查方法", "value": "场景矩阵检查，确保无死角"},
        {"title": "常见问题", "value": "场景遗漏、边界情况处理不足"},
    ]},
    {"type": "content_cards", "title": "可执行性维度详解", "items": [
        {"title": "定义", "value": "用户能顺利使用，流程清晰引导明确"},
        {"title": "衡量标准", "value": "完成率>=85%，用户满意度>=90%"},
        {"title": "检查方法", "value": "用户测试，收集反馈持续优化"},
        {"title": "常见问题", "value": "步骤跳跃、缺少引导、错误提示不清"},
    ]},
    {"type": "content_cards", "title": "专业性维度详解", "items": [
        {"title": "定义", "value": "术语准确、逻辑严密、符合领域规范"},
        {"title": "衡量标准", "value": "专家评审通过率>=90%"},
        {"title": "检查方法", "value": "领域专家评审，逻辑推理验证"},
        {"title": "常见问题", "value": "术语错误、逻辑漏洞、专业度不足"},
    ]},
    {"type": "content_cards", "title": "时效性维度详解", "items": [
        {"title": "定义", "value": "数据新、更新及时、定期维护"},
        {"title": "衡量标准", "value": "数据更新时间<=3个月"},
        {"title": "检查方法", "value": "定期review机制，更新日志追踪"},
        {"title": "常见问题", "value": "数据过时、信息陈旧、更新滞后"},
    ]},
    
    # ===== Slide 15-21: 六大核心模块 =====
    {"type": "icons_grid", "title": "③ 六大核心模块", "columns": 3, "items": [
        {"title": "触发词配置", "desc": "精准识别用户意图", "icon": "🎯"},
        {"title": "技能描述文档", "desc": "清晰定义技能边界", "icon": "📄"},
        {"title": "核心代码实现", "desc": "可执行的高质量逻辑", "icon": "💻"},
        {"title": "示例与变体", "desc": "多元场景覆盖", "icon": "📚"},
        {"title": "错误处理机制", "desc": "优雅降级和容错", "icon": "🛡️"},
        {"title": "质量评分卡", "desc": "自检和持续优化", "icon": "✅"},
    ], "sub": "六个模块环环相扣，缺一不可", "description": "六大核心模块共同构成完整技能，每个模块都有明确的规范和标准，确保技能资产的完整性和可维护性。"},
    {"type": "content_cards", "title": "触发词配置详解", "items": [
        {"title": "核心要素", "value": "核心词（必须包含）+ 场景词（同义表达）+ 同义词"},
        {"title": "配置原则", "value": "精准匹配，避免泛化过度导致误触发"},
        {"title": "数量标准", "value": "核心词>=5个，场景词>=10个，同义词>=5个"},
        {"title": "测试验证", "value": "触发率>=90%，误触发率<=5%"},
    ]},
    {"type": "content_cards", "title": "技能描述文档详解", "items": [
        {"title": "文档结构", "value": "概述、功能、限制、使用方式、示例"},
        {"title": "写作规范", "value": "清晰简洁、避免歧义、结构化表达"},
        {"title": "审核流程", "value": "自审 + 交叉审 + 专家审"},
    ]},
    {"type": "content_cards", "title": "代码实现规范", "items": [
        {"title": "代码规范", "value": "遵循PEP8 + 业务注释，代码即文档"},
        {"title": "模块化设计", "value": "高内聚、低耦合，便于维护和扩展"},
        {"title": "错误处理", "value": "try-except全覆盖，优雅降级不崩溃"},
        {"title": "测试覆盖", "value": "单元测试>=80%，集成测试>=60%"},
    ]},
    {"type": "content_cards", "title": "示例与变体", "items": [
        {"title": "示例数量", "value": "每个技能>=10个正面示例，>=5个边界示例"},
        {"title": "变体覆盖", "value": "覆盖不同表达方式、口语化、正式表达"},
        {"title": "质量要求", "value": "示例准确、场景真实、有代表性"},
    ]},
    {"type": "content_cards", "title": "错误处理机制", "items": [
        {"title": "异常分类", "value": "输入异常、逻辑异常、系统异常"},
        {"title": "处理策略", "value": "明确提示、降级返回、记录日志"},
        {"title": "用户体验", "value": "友好提示、引导修正、避免恐慌"},
    ]},
    
    # ===== Slide 22-24: 质量评分卡 =====
    {"type": "content_cards", "title": "质量评分卡使用指南", "items": [
        {"title": "评分维度", "value": "准确性25% + 完整性15% + 可执行性20% + 专业性20% + 时效性20%"},
        {"title": "评分标准", "value": "每项5分制，总分需>=4.6分（92%）"},
        {"title": "评分流程", "value": "自评 -> 交叉评 -> 专家评审 -> 优化 -> 复评"},
        {"title": "优化闭环", "value": "评分发现问题 -> 分析根因 -> 制定优化方案 -> 执行 -> 复评"},
    ]},
    
    # ===== Slide 25-27: 质量门禁 =====
    {"type": "process_flow", "title": "⑥ 质量门禁", "steps": [
        {"title": "自动检查", "desc": "格式/语法/安全"},
        {"title": "质量评分", "desc": "五大维度>=92%"},
        {"title": "上线审批", "desc": "评审通过"},
    ], "sub": "三重门禁保障质量", "description": "质量门禁是技能上线的必经之路，只有通过全部检查才能发布，确保交付给用户的每个技能都符合质量标准。"},
    {"type": "content_cards", "title": "自动检查详解", "items": [
        {"title": "格式规范", "value": "文档格式、代码风格、命名规范"},
        {"title": "语法检查", "value": "代码语法、逻辑错误、安全漏洞"},
        {"title": "安全扫描", "value": "注入风险、数据泄露、权限问题"},
    ]},
    {"type": "content_cards", "title": "质量门禁检查清单", "items": [
        {"title": "触发词覆盖", "value": ">=85%，核心场景100%覆盖"},
        {"title": "准确率", "value": ">=95%，错误率<=5%"},
        {"title": "完整性", "value": ">=90%，无关键信息遗漏"},
        {"title": "代码质量", "value": "通过语法检查，无安全漏洞"},
    ]},
    
    # ===== Slide 28: 效果对比 =====
    {"type": "comparison", "title": "效果对比", "left_title": "传统方式", "right_title": "V9标准", "left_items": [
        {"title": "开发周期", "value": "3-5天/个"},
        {"title": "质量一致性", "value": "依赖个人经验"},
        {"title": "知识传承", "value": "难以复制"},
        {"title": "维护成本", "value": "高"},
    ], "right_items": [
        {"title": "开发周期", "value": "1天/个"},
        {"title": "质量一致性", "value": "标准化保障"},
        {"title": "知识传承", "value": "显性化沉淀"},
        {"title": "维护成本", "value": "低"},
    ], "sub": "标准化让效率提升3-5倍", "description": "对比数据来源于实际项目统计，V9标准在效率、质量、可维护性等方面都有显著提升。"},
    
    # ===== Slide 29: 总结 =====
    {"type": "content_cards", "title": "总结", "items": [
        {"title": "核心理念", "value": "一切为了表达！先理解受众，再构建叙事，最后选择表达方式"},
        {"title": "评估体系", "value": "五大维度（准确性25% + 完整性15% + 可执行性20% + 专业性20% + 时效性20%），总分>=92%"},
        {"title": "质量保障", "value": "三重门禁（自动检查 + 质量评分 + 上线审批），只有通过全部门禁才能上线"},
    ]},
    
    # ===== Slide 30: 结尾 =====
    {"type": "closing", "title": "谢谢！", "cta": "高效小G技能工厂"},
]

# 配图配置 - 图形图示页不配图，内容卡片页配图
page_image_configs = {}

# 需要配图的页面索引列表（按顺序）
imageable_pages = []
for i, slide in enumerate(slides):
    stype = slide.get('type', '')
    # 图形图示页不配图
    if stype in ['radar', 'icons_grid', 'process_flow', 'comparison']:
        continue
    imageable_pages.append(i)

# 为需要配图的页面分配图片（循环分配，确保每张图片对应不同页面）
for page_idx, page_num in enumerate(imageable_pages):
    slide = slides[page_num]
    stype = slide.get('type', '')
    img_idx = page_idx % len(IMAGES)  # 循环分配，避免越界
    
    if stype == 'title':
        page_image_configs[page_num] = {"path": IMAGES[img_idx], "position": "background", "size": "full", "add_overlay": False}
    elif stype == 'closing':
        page_image_configs[page_num] = {"path": IMAGES[img_idx], "position": "background", "size": "full", "add_overlay": False}
    else:
        page_image_configs[page_num] = {"path": IMAGES[img_idx], "position": "right_small", "size": "small"}

print(f"\n生成PPT：{len(slides)}页")
print(f"配置配图：{len(page_image_configs)}页")
print("-" * 50)

output_path = "/home/gem/workspace/agent/workspace/ppt-output/V9技能标准-V3.9最终版.pptx"
result = create_ppt_v3_with_images(
    slides,
    output_path,
    theme='clean',
    page_image_configs=page_image_configs,
    auto_plan_images=False
)

print(f"\n✅ PPT已生成: {result}")
print("=" * 70)

# 统计
print("\n📊 页面类型统计：")
types = {}
for slide in slides:
    t = slide.get('type', 'unknown')
    types[t] = types.get(t, 0) + 1
for t, count in types.items():
    print(f"  {t}: {count}页")

# 统计description情况
print("\n💡 说明阐述模块（description）：")
for i, slide in enumerate(slides):
    desc = slide.get('description', '')
    if desc:
        title = slide.get('title', '') or slide.get('main', '')
        print(f"  第{i+1}页 [{title}]: ✅")

print(f"\n✨ 改进点：")
print(f"  1. 七步工作流完整7步（分两页展示）")
print(f"  2. 图形图示页都有description说明阐述模块")
print(f"  3. 内容详细完整，共{len(slides)}页")
