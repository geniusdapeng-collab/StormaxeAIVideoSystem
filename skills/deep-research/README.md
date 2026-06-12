# 深度调研工作流 V5.9 — 客观深度分析版

> **核心引擎**：`deep_research_v5_9.py`
> **写作范式**：问题定义 → 分析框架 → 子维度深钻 → 数据证据 → 批判审视 → 结构化结论
> **作者**：小 G（大鹏的 AI 搭档）

---

## 概述

V5.9 采用客观分析报告体，像麦肯锡/Gartner/IDC 分析师一样写深度调研。禁用所有文学性创作手法，以结构化分析框架驱动深度，用数据表格和证据链支撑每个判断。

## 核心规范

| 指标 | 要求 |
|------|------|
| 📄 全报告底线 | ≥30000 字 |
| 📄 全报告最佳 | 60000-80000 字 |
| 📄 深度报告 | 100000+ 字（小红花奖励） |
| 📄 每章节底线 | 4000-6000 字 |
| 📄 每章节最佳 | 6000-10000 字 |
| 📊 子维度数量 | 每章 5-7 个 |
| 📊 分析框架 | 每章 ≥2 种 |
| 📊 数据表格 | 每章 ≥2 个 |
| 🔗 独立信源 | ≥70 个 |
| 📊 定量数据点 | ≥90 个（每条标注来源） |
| 📊 PPT | 配套生成 |

## V5.9 vs V5.8 核心变化

| 维度 | V5.8（废弃） | V5.9（当前） |
|------|-------------|-------------|
| 写作风格 | 特稿叙事体（《人物》《财经》） | 客观分析报告体（麦肯锡/Gartner） |
| 开场方式 | 场景开场（时间+地点+人物） | 问题定义（核心问题列表） |
| 展开方式 | 叙事深描（故事线+引语） | 子维度深钻（5-7 个维度逐项分析） |
| 驱动方式 | 叙事张力 | 分析框架（SWOT/PESTEL/价值链等） |
| 数据呈现 | 文字描述为主 | 结构化数据表格强制 |
| 收束方式 | 金句（让人想划线） | 结构化结论（要点式+置信度） |
| 人物引语 | 必须（每章 ≥2 个） | **禁用** |
| 场景开场 | 必须（每章 ≥1 个） | **禁用** |

## 文件结构

```
deep-research/
├── deep_research_v5_9.py               # V5.9 核心引擎
├── SKILL.md                             # 技能定义（主入口）
├── README.md                            # 使用说明
├── VERSION.md                           # 版本记录
├── v59_analytical_writing_guide.md      # 客观分析写作指南
├── v59_analytical_prompt.md             # 章节分析提示词
├── v59_sub_dimension_template.md        # 子维度深挖模板
├── v59_quality_checklist.md             # 质量自检清单（15项）
├── plugins/                             # 领域插件
└── templates/                           # 报告模板
```

## 使用方式

```python
from deep_research_v5_9 import deep_research_v59_workflow

result = deep_research_v59_workflow(
    topic="你的调研课题",
    llm_call_fn=call_llm,
    search_fn=search,
    depth="deep",
    verbose=True,
    enable_analytical_writing=True      # V5.9 开启客观分析
)

print(result["report"])              # 客观分析版完整报告
print(result["analytical_chapters"]) # 各章节分析内容
print(result["data_tables"])         # 结构化数据表格
print(result["quality_check"])       # 15 项质量检查结果
```

## Phase 流程（14 步）

```
Phase 0:    LLM课题理解
Phase 0.5:  调研框架设计
Phase 0.8:  核心发现预提取
Phase 1:    多维度章节拆解（每章 5-7 个子维度）
Phase 2-4:  多轮搜索 + 链式深挖
Phase 5:    信息增量去重
Phase 6:    LLM深度分析（按子维度逐项分析）
Phase 6.3:  递归深钻子代理
Phase 6.5:  批判性思考模块
Phase 6.8:  设计哲学提炼
Phase 7:    客观分析报告重写
Phase 7.5:  战略展望
Phase 7.8:  质量自检 15 项
           ↑              ↓
           └─ 迭代闭环评估 ─┘
```

## 前置依赖

- ✅ Python 3.8+
- ✅ OpenClaw 工具：web_search、web_crawl、feishu_create_doc

---

**版本：** V5.9（客观深度分析版）
**最后更新：** 2026-05-06
**维护者：** 小 G
