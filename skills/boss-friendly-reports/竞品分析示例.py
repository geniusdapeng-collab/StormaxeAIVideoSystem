#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
职场生存技能包 - 竞品分析报告生成示例
按照Leader友好原则生成竞品分析材料
"""

print("=" * 70)
print("职场生存技能包 - 竞品分析报告生成")
print("=" * 70)

# 竞品分析报告模板
report = {
    "type": "竞品分析报告",
    "title": "竞品XXX调研汇报",
    "executive_summary": {
        "conclusion": "竞品在XX方面有一定优势，但差距可控，我们可在6-12个月内追上",
        "key_finding": "竞品做得不错，但我们可以做得更好",
        "recommendation": "建议启动XX项目，3人团队6个月见效果"
    },
    "competitors": [
        {
            "name": "竞品A",
            "one_sentence_review": "竞品A在功能XX方面做得不错，但在用户体验方面还有提升空间",
            "strengths": [
                "功能完整，覆盖YY场景",
                "品牌影响力强",
                "用户基数大"
            ],
            "weaknesses": [
                "用户体验一般，流程复杂",
                "价格偏高",
                "更新迭代慢"
            ],
            "gap": "与我们相比，差距主要在用户体验，预计6个月可以追上",
            "opportunity": "我们可以做得更简洁、更便宜"
        },
        {
            "name": "竞品B",
            "one_sentence_review": "竞品B是市场跟随者，创新能力一般",
            "strengths": [
                "渠道资源丰富",
                "价格有优势"
            ],
            "weaknesses": [
                "功能单一",
                "技术储备不足",
                "创新能力弱"
            ],
            "gap": "与我们相比，功能差距约3-6个月可以追上",
            "opportunity": "这是我们的机会，因为竞品做得也不好"
        }
    ],
    "comparison_matrix": {
        "dimensions": ["功能完整性", "用户体验", "价格竞争力", "技术先进性", "服务能力"],
        "scores": {
            "us": {"name": "我们", "scores": [4, 4, 4, 4, 4], "notes": ["领先"]},
            "competitor_a": {"name": "竞品A", "scores": [5, 3, 3, 4, 4], "notes": ["功能强"]},
            "competitor_b": {"name": "竞品B", "scores": [3, 3, 5, 2, 3], "notes": ["价格低"]}
        },
        "gap_analysis": "综合来看，我们与竞品A的主要差距在功能完整性，但这是6-12个月可以追上的差距，不是本质差距"
    },
    "recommendations": [
        {
            "title": "方案A：快速追赶",
            "description": "集中资源在XX功能上投入，3个月补齐功能差距",
            "priority": "高",
            "timeline": "3个月",
            "investment": "3人团队",
            "risk": "低风险，即使失败损失可控",
            "expected_outcome": "功能完整性追平竞品A"
        },
        {
            "title": "方案B：差异化竞争",
            "description": "不在XX功能上与竞品正面竞争，在YY功能上建立差异化优势",
            "priority": "中",
            "timeline": "6个月",
            "investment": "2人团队",
            "risk": "低风险，差异化方向竞品也没做好",
            "expected_outcome": "建立独特竞争优势"
        },
        {
            "title": "方案C：观望等待",
            "description": "暂不投入，观察竞品动向",
            "priority": "低",
            "timeline": "持续观察",
            "investment": "0",
            "risk": "中等风险，可能错过窗口期",
            "expected_outcome": "不投入无损失，但无进展"
        }
    ],
    "recommended_option": "方案A：快速追赶",
    "recommended_reason": "竞品差距可控，我们有能力快速追上，且YY功能市场仍有空间"
}

print("\n📊 竞品分析报告（Leader版）")
print("=" * 70)

print("\n【执行摘要】")
print("-" * 50)
print(f"📌 核心结论：{report['executive_summary']['conclusion']}")
print(f"🔍 关键发现：{report['executive_summary']['key_finding']}")
print(f"💡 核心建议：{report['executive_summary']['recommendation']}")

print("\n\n【竞品概览】")
print("-" * 50)
for comp in report['competitors']:
    print(f"\n🔹 {comp['name']}")
    print(f"   一句话评价：{comp['one_sentence_review']}")
    print(f"   优势：{', '.join(comp['strengths'][:2])}")
    print(f"   弱点：{', '.join(comp['weaknesses'][:2])}")
    print(f"   与我们的差距：{comp['gap']}")
    print(f"   💡 我们的机会：{comp['opportunity']}")

print("\n\n【功能对比】")
print("-" * 50)
dimensions = report['comparison_matrix']['dimensions']
print(f"{'维度':<12} | {'我们':<6} | {'竞品A':<6} | {'竞品B':<6}")
print("-" * 50)
for i, dim in enumerate(dimensions):
    us_score = report['comparison_matrix']['scores']['us']['scores'][i]
    comp_a_score = report['comparison_matrix']['scores']['competitor_a']['scores'][i]
    comp_b_score = report['comparison_matrix']['scores']['competitor_b']['scores'][i]
    print(f"{dim:<10} | {us_score:<6} | {comp_a_score:<6} | {comp_b_score:<6}")

print("\n差距分析：", report['comparison_matrix']['gap_analysis'])

print("\n\n【建议方案】")
print("-" * 50)
for i, rec in enumerate(report['recommendations']):
    mark = "✅" if rec == report['recommended_option'] else "  "
    print(f"\n{mark} 方案{chr(65+i)}：{rec['title']}")
    print(f"    描述：{rec['description']}")
    print(f"    优先级：{rec['priority']} | 时间：{rec['timeline']} | 投入：{rec['investment']}")
    print(f"    风险：{rec['risk']}")
    print(f"    预期成果：{rec['expected_outcome']}")

print(f"\n💡 推荐方案：{report['recommended_option']}")
print(f"   推荐理由：{report['recommended_reason']}")

print("\n\n" + "=" * 70)
print("📋 Leader看完即可决策：")
print("   1. 竞品差距可控（6-12个月）")
print("   2. 有明确建议方案（方案A）")
print("   3. 投入小风险低（3人团队，低风险）")
print("   4. 预期成果明确（功能追平）")
print("=" * 70)
