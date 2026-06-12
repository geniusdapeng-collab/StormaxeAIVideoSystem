# PPT制作技能 V1.1.0

## 元数据（V9.0标准）

---
skill_id: ppt-maker
name: PPT制作技能
english_name: PPT Maker
version: 1.2.0
last_updated: 2026-04-05
published_date: 2026-04-05
preview_date: 2026-04-05
author: 高效小G
status: preview  # preview | published
domain: 职场汇报与演示
sub_domain: PPT设计与制作
priority: high
quality_score: 95

trigger_words:
  # 核心触发词
  - "制作PPT"
  - "做PPT"
  - "生成PPT"
  - "发PPT给我"
  - "PPT文件"
  - "演示文稿"
  # 场景触发词
  - "汇报"
  - "提案"
  - "方案"
  - "总结"
  - "介绍"
  - "分享"
  # 动作触发词
  - "做成PPT"
  - "做成演示"
  - "做个幻灯片"
  - "发个文件"
  # 同义词
  - "幻灯片"
  - "slides"
  - "presentation"
  # V1.2.0 新增图表触发词
  - "雷达图"
  - "漏斗图"
  - "矩阵图"
  - "金字塔"
  - "SWOT"
  - "多维度分析"
  - "占比分析"
  - "转化漏斗"
  - "能力评估"

retrieval_profile:
  description: |
    将用户输入的报告内容、主题或场景描述，转化为完整的PPT视觉架构方案，
    并生成可下载的PPTX文件。核心能力是"降维打击"——将高密度文字翻译为可视化图表。
  logical_topics:
    - "PPT制作"
    - "演示文稿"
    - "商业汇报"
    - "图表设计"
    - "信息可视化"
    - "工作汇报"
    - "方案展示"
    - "数据呈现"
  aliases:
    - "做PPT"
    - "制作幻灯片"
    - "生成演示文稿"
    - "汇报材料"
    - "方案PPT"
    - "商业计划书PPT"
  sample_queries:
    - "帮我制作一个Q3工作汇报的PPT"
    - "把这个方案做成PPT"
    - "做个关于市场分析的演示文稿"
    - "发个PPT给我"
    - "把以下内容做成幻灯片"
  problem_patterns:
    - "不知道怎么做PPT"
    - "需要汇报材料"
    - "想要演示文稿"
    - "做个方案展示"
  entities:
    what:
      - "PPT"
      - "演示文稿"
      - "幻灯片"
      - "汇报材料"
      - "方案"
      - "报告"
    when:
      - "工作汇报"
      - "季度总结"
      - "年度汇报"
      - "项目提案"
      - "客户汇报"
      - "会议展示"
    where:
      - "商务场合"
      - "公司内部"
      - "客户现场"
      - "线上会议"

module_compatibility:
  input_preprocessing: true
  intent_clarification: true
  multi_intent_extraction: true
  task_analysis: true
  skill_matching: "exact"
  task_execution: "auto"
  result_integration: true

fallback_strategy:
  level1_tool: "feishu_ask_user_question"
  level2_data: "memory_search"
  level3_output: "direct_response"

persona_adaptation:
  user_profile:
    name: 职场人士
    role: 产品经理/运营/销售/管理层
    scene: 商业汇报与演示
  modes:
    - "efficient"  # 高效模式：直接生成
    - "detailed"  # 详细模式：先设计架构
    - "collaborative"  # 协作模式：边做边调整
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools:
    - "exec"  # 调用Python生成PPTX
    - "message"  # 发送文件给用户
  data_sources:
    - "user_input"  # 用户输入内容
    - "generate_ppt.py"  # PPT生成脚本
  output_formats:
    - "PPTX文件"  # 可编辑PPT文件
    - "Markdown方案"  # 视觉架构方案
    - "飞书消息"  # 直接发送

scoring_weights:
  accuracy: 0.25
  completeness: 0.15
  actionability: 0.20
  safety: 0.10
  empathy: 0.05
  efficiency: 0.10
  reliability: 0.10
  clarity: 0.05

pass_threshold: 92
response_time_ms: 30000

tools_read:
  - "memory_get"
  - "memory_search"

tools_write:
  - "memory"
  - "exec"

confirmation_required_for: []

output_schema:
  type: "structured"
  fields:
    - name: visual_schema
      type: object
      description: PPT视觉架构方案
      required: true
    - name: pptx_file
      type: string
      description: PPTX文件路径
      required: true
    - name: slide_count
      type: number
      description: 幻灯片数量
    - name: summary
      type: string
      description: 方案摘要
  schema_example: |
    {
      "visual_schema": {
        "title": "PPT标题",
        "pages": [
          {
            "page_num": 1,
            "title": "结论句标题",
            "chart_type": "图表类型",
            "content": "核心内容"
          }
        ]
      },
      "pptx_file": "/path/to/file.pptx",
      "slide_count": 8,
      "summary": "一句话总结"
    }

quality_standards:
  - "每页必须有明确结论型标题"
  - "必须提供可视化方案（禁止'可以用图'等模糊表述）"
  - "必须提供ASCII草图或布局描述"
  - "必须遵循四部分输出格式"
  - "必须生成可下载的PPTX文件"
  - "触发词召回准确率≥95%"
  - "生成成功率≥98%"
---

# TL;DR

**输入内容 → 降维可视化 → PPT文件。核心能力是"降维打击"——将高密度文字翻译为可视化图表，遵循"一图胜千言"原则，直接生成可编辑PPTX文件。**

---

# 一、场景分析

## 1.1 典型场景

| 场景 | 用户Query示例 | 核心诉求 |
|------|-------------|---------|
| 工作汇报 | "Q3业绩汇报PPT，包含销售、运营、团队" | 结构清晰、数据直观 |
| 商业提案 | "给客户的方案，包含背景、方案、报价" | 专业简洁、说服力强 |
| 产品介绍 | "产品功能介绍PPT" | 图文并茂、重点突出 |
| 项目提案 | "XX项目提案，包含背景、计划、预算" | 逻辑严密、步骤清晰 |
| 技能分享 | "分享PPT制作技能" | 知识结构化、易于理解 |
| 年度总结 | "年度总结汇报" | 成果量化、亮点突出 |

## 1.2 核心挑战

| 挑战类型 | 问题描述 | 解决思路 |
|---------|---------|---------|
| 内容堆砌 | 文字太多，重点不突出 | 降维可视化，结论先行 |
| 逻辑混乱 | 前后关系不清晰 | 结构分层，逻辑显性化 |
| 形式单调 | 全部是文字列表 | 图表驱动，视觉冲击 |
| 效率低下 | 手动排版耗时 | 自动生成，直接交付 |

## 1.3 正确认知

- **内容是基础，视觉是放大器**：好内容+好视觉=高效传达
- **结论先行**：让读者3秒内抓住要点
- **一图胜千言**：图形是降低理解成本的工具，不是装饰
- **结构化输出**：遵循V9.0五层输出规范

---

# 二、决策框架

## 2.1 内容解构（5类关系识别）

| 内容类型 | 识别特征 | 强制图表 |
|---------|---------|---------|
| **结构关系** | "包含"、"组成"、"分为" | 金字塔/逻辑树/组织架构图 |
| **流程步骤** | "首先"、"然后"、"最后" | 甘特图/时间轴/流程图 |
| **对比分析** | "相比"、"优劣"、"A vs B" | 矩阵图/雷达图/左右对比 |
| **组成占比** | "占比"、"份额"、"分配" | 饼图/瀑布图/进度条 |
| **趋势变化** | "增长"、"下降"、"波动" | 折线图/面积图/子弹图 |

## 2.2 PPT结构设计（4部分输出）

### A. PPT信息架构

```
| 页码 | 页面标题 | 核心图表类型 | 选用理由 |
|------|---------|------------|---------|
| 1 | [结论句标题] | [图表类型] | [不超过15字] |
| 2 | [结论句标题] | [图表类型] | [不超过15字] |
```

### B. 全局概览页

- **推荐形式**：路径图/逻辑树/飞轮模型/价值链
- **节点细节**：关键节点名称+逻辑箭头
- **版式描述**：左中右/中心发散/S型/上下分层

### C. 分模块可视化方案

```markdown
### [页X 标题：_____（结论句）]

**1. 这一页讲什么：**
[1句话核心信息]

**2. 可视化设计：**
- 图表类型：[具体图表名]
- 布局草图：
```
[ASCII布局图]
```
- 逻辑示意：[图形如何承载文字逻辑]

**3. 图表字段/维度：**
- [字段1]
- [字段2]

**4. 页面文案（极简）：**
- 关键结论：[<10字]
- 关键数字：[数据卡片]
- 图注：[<20字]
```

### D. 统一图表库

```
| 图表名称 | 类型 | 复用场景 | 视觉规范 |
|---------|------|---------|---------|
| [图表名] | [类型] | [场景] | [颜色/风格] |
```

## 2.3 PPT生成流程

```
用户输入 → 内容解构 → 架构设计 → PP TX生成 → 文件发送
   ↓           ↓           ↓           ↓           ↓
 原始文本    5类识别    4部分输出   Python脚本   飞书消息
```

---

# 三、专业建议

## 3.1 视觉架构设计建议

| 设计原则 | 说明 | 优先级 |
|---------|------|--------|
| 结论先行 | 标题即结论，<10字，动词开头 | ⭐⭐⭐⭐⭐ |
| 图形优先 | 图形占70%面积，文字辅助 | ⭐⭐⭐⭐⭐ |
| 层级清晰 | 标题>数据>正文>图注 | ⭐⭐⭐⭐ |
| 色彩克制 | 主色1+强调色1+灰阶 | ⭐⭐⭐ |
| 逻辑显性 | 用箭头/布局表达关系 | ⭐⭐⭐⭐⭐ |

## 3.2 PPT生成建议

| 建议类型 | 具体做法 | 效果 |
|---------|---------|------|
| 信息压缩 | 单页≤7个元素 | 降低认知负担 |
| 图表选择 | 基于内容类型选图 | 提高传达效率 |
| 标题优化 | 结论句替代描述句 | 3秒抓住要点 |
| 留白设计 | 保持30%以上留白 | 提升可读性 |

## 3.3 常见错误避免

| 错误类型 | 错误示例 | 正确做法 |
|---------|---------|---------|
| 标题模糊 | "Q3业绩概述" | "Q3营收增长45%" |
| 图表堆砌 | 同一页3种图表 | 每页1种最优图表 |
| 文字密集 | 大段文字 | 提炼要点+图形承载 |
| 逻辑隐藏 | "因为...所以..."文字描述 | 箭头逻辑图 |

---

# 四、质量检查

## 4.1 输出检查清单

- [ ] 每页有明确结论型标题
- [ ] 提供可视化方案（非模糊建议）
- [ ] 提供ASCII草图或布局描述
- [ ] 遵循A/B/C/D四部分输出格式
- [ ] 生成PPTX文件成功
- [ ] 文件可正常打开编辑

## 4.2 触发词召回检查

- [ ] 核心触发词（制作PPT、做PPT等）100%召回
- [ ] 场景触发词（汇报、提案等）≥95%召回
- [ ] 无歧义触发词准确率≥98%
- [ ] 误召率<5%

## 4.3 性能检查

- [ ] 响应时间<30秒
- [ ] PPT生成成功率≥98%
- [ ] 文件大小<10MB
- [ ] 兼容Office 2016+

---

# 五、附录

## 5.1 支持的幻灯片类型

| 类型 | 说明 | 参数配置 |
|------|------|---------|
| title | 标题幻灯片 | title, subtitle |
| content | 内容幻灯片 | title, bullets, highlight |
| chart | 图表幻灯片 | title, subtitle, items |
| comparison | 对比幻灯片 | title, left, right |
| process | 流程幻灯片 | title, steps |
| table | 表格幻灯片 | title, headers, rows |
| **radar** | **雷达图幻灯片** | title, subtitle, items, max_value |
| **funnel** | **漏斗图幻灯片** | title, subtitle, levels |
| **matrix** | **矩阵图幻灯片** | title, subtitle, quadrants |
| **pyramid** | **金字塔幻灯片** | title, subtitle, levels |

## 5.2 色彩规范

| 颜色类型 | 色值 | 用途 |
|---------|------|------|
| 主色 | #0066CC | 标题、强调 |
| 强调色 | #00994D | 正向、增长 |
| 警示色 | #CC0000 | 风险、问题 |
| 深灰 | #646464 | 正文 |
| 浅灰 | #F0F0F0 | 背景、卡片 |
| 白色 | #FFFFFF | 背景 |

## 5.3 迭代历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0.0 | 2026-04-05 | 初始版本发布 |
| V1.1.0 | 2026-04-05 | V9.0标准重构，增强触发词和检索配置 |
| V1.2.0 | 2026-04-05 | **新增雷达图、漏斗图、矩阵图、金字塔幻灯片类型** |

---

# 六、版本信息

| 项目 | 内容 |
|------|------|
| 技能ID | ppt-maker |
| 版本号 | V1.2.0（预发） |
| 发布日期 | 2026-04-05 |
| 预发日期 | 2026-04-05 |
| 作者 | 高效小G |
| 状态 | 🔍 预发验收中 |
| 质量评分 | 96/100 |

---

*技能版本：V1.1.0 | 更新日期：2026-04-05 | 遵循V9.0技能标准*
