# PPT制作技能 版本记录

## V4.10.0 (2026-04-11) ✅ 生产发布 - 图片压缩质量优化

**压缩质量优化（大鹏反馈）**
- 之前：1400px宽度 + JPEG 90% → 保留28%信息，3.1MB（压太狠）
- 现在：不缩放原图 + JPEG 95% → 保留78%信息，8.4MB（质量好）

**image_auto_generator.py 改进**
- 新增 compress_image() 方法：不缩放 + JPEG 95%
- collect_all_images() 自动调用压缩
- 压缩后返回路径直接用于PPT生成

---


## V4.9.7 (2026-04-11) ✅ 生产发布 - 图片清理逻辑优化

### 核心更新

**图片清理逻辑优化（大鹏反馈）**
- **之前（V4.9.6）**：PPT生成完成后立即清空图片 → 反复调整需要重新生成所有图片，浪费资源
- **现在（V4.9.7）**：只在开始新PPT前清空历史图片 → 生成后保留图片，方便反复调整

**清理规则：**
1. ⛔ 制作新PPT前清空所有历史图片（绝不复用旧图）
2. ⛔ 每页配图独立，绝不重复使用同一张
3. ♻️ PPT生成完成后保留图片（方便调内容、调配图、调排版）
4. ♻️ 下次制作新主题PPT时自动清空

---

## V4.9.6 (2026-04-11) ✅ 生产发布 - 图片生命周期管理

### 核心更新

**1. ⛔ 绝不复用历史旧图（硬规则）**
- `cleanup_before_generation()`: 生成PPT前清空所有历史图片
- `ImageAutoGenerator.collect_fresh_images()`: 只取本次生成的最新图片
- 绝不从旧图池中随机收集

**2. ⛔ 绝不重复使用同一张图（硬规则）**
- `used` set 追踪已分配的图片
- 每张图只能分配给一个页面
- 如果图片数量不足，明确警告

**3. 🗑️ 用完即删（硬规则）**
- `cleanup_all_images()`: PPT生成完成后立即删除所有图片
- 清理图片源目录：`/home/gem/workspace/agent/media/tool-image-generation/*.png`
- 清理临时目录：`/tmp/ppt_images_auto/`, `/tmp/ppt_images/`, `/tmp/ppt_image_cache/`
- 节省宝贵的磁盘空间

**4. image_auto_generator.py 重写**
- 精简为清理 + 收集 + 生成 三个核心函数
- 硬规则注释明确标注

---

## V4.9.4 (2026-04-11) ✅ 生产发布 - ImagePromptAgent通用化 + 茶道验证

### 核心更新

**1. ImagePromptAgent 完全通用化（不再绑定任何主题）**
- 新增 `tea_ceremony`（茶道）内容分类
- 新增 `lifestyle`（生活方式）内容分类
- 修复分类逻辑：优先标题匹配 > items匹配 > bottom_text匹配
- 加入PPT主题上下文到每个prompt
- 验证通过：干泡台泡茶、年终工作汇报两个主题均正常

**2. 封面标题金色描边色块**
- `page_title_with_image()` 标题添加白色圆角底色块（10.5×3.5英寸）
- 色块外框金色描边（3pt），确保任何背景下清晰可读
- 修复章节页标题硬编码黑色问题
- 标题文字黑色，副标题深灰色

**3. 内容页数扩展到20+页**
- 内容适配器支持自动扩展，标准PPT从14页扩展到22-33页
- 符合20-50页行业标准

**4. 图片压缩策略**
- PNG转JPEG，quality=75，宽度限制1200px
- 体积减少86%，从43.6MB压缩到2.5MB
- 远低于飞书30MB限制

**5. 预发目录整理**
- 预发文件：`pre-release/V4.9.0/`
- 生产文件：根目录 `image_prompt_agent.py`、`generate_ppt.py`、`ppt_checklist.py`

### 已验证主题
- ✅ 临安家庭两日游（33页）
- ✅ 干泡台泡茶指南（33页）
- ✅ 年终工作汇报（验证通用性）

---

## V4.9.3 (2026-04-10) ✅ 生产发布 - 封面标题色块 + 22页扩页

### 核心更新

**1. 封面标题金色描边色块**
- `page_title_with_image()` 标题添加白色圆角底色块（10.5×3.5英寸）
- 色块外框金色描边（3pt），确保任何背景下清晰可读
- 标题文字黑色（RGB 0,0,0），副标题深灰色（RGB 80,80,80）

**2. 内容扩页到20+页**
- 新增页面：为什么选择临安、穿衣建议、Day1上午/下午/晚上独立页
- 新增页面：Day2上午/中午/下午独立页、拍照建议、香香专属贴士
- 标准PPT从14页扩展到22页，符合20-50页的行业标准

**3. ImagePromptAgent 配图专家模块（V4.9.2引入，V4.9.3生产化）**
- 三层理解机制：PPT主题 → 页面类型 → 内容关键词
- 强制写实风格后缀（photorealistic + no cartoon/illustration）
- 场景映射库：22种页面类型各有专属prompt
- 解决图片与主题不贴合、风格不统一的问题

### 输出文件
- `/home/gem/workspace/agent/workspace/ppt-output/临安两日游_V4.9.3生产版.pptx`
- 22页 / 22张配图 / 约32MB

---

## V4.8.0 (2026-04-10) ✅ 重大更新 - 配图工作流重构

### 核心更新：修复配图映射错误，固化正确工作流

**问题诊断：**
1. **图片路径错误**：一直从 `/home/gem/workspace/agent/workspace/media/` 读取，但图片实际在 `/home/gem/workspace/agent/media/tool-image-generation/`
2. **缺少索引映射**：生成图片后没有建立 page_index → image_path 的映射
3. **复制时机错误**：等待所有图片生成完再收集，导致文件名混乱

**V4.8.0 修复方案：**

1. **新增 ImageWorkflow 类**
   - 正确的图片源路径：`/home/gem/workspace/agent/media/tool-image-generation/`
   - 每生成一张图片后**立即**调用 `collect_image()` 收集
   - 用页面索引命名：`page_00.png`, `page_01.png`, ...
   - 自动建立映射表

2. **正确的配图工作流**
   ```
   1. 调用 plan_page_images() 规划配图策略
   2. 逐页生成图片（调用 image_generate 工具）
   3. 每生成一张后立即调用 workflow.collect_image(idx)
   4. 调用 workflow.get_page_image_configs() 获取映射表
   5. 将映射表传给 create_ppt_v3_with_images()
   ```

3. **图片位置规则（V4.8.0硬约束）**
   - 封面 (title) → `position: "background"` (全屏背景)
   - 章节分隔 (section) → `position: "background"` (全屏背景)
   - 内容页 (content_cards) → `position: "right_image"` (右侧图片)
   - 结尾 (closing) → `position: "background"` (全屏背景)

4. **新增便捷函数**
   - `collect_latest_image(output_path)`: 收集最新生成的图片
   - `create_page_image_mapping(slides, output_dir, topic_hint)`: 创建完整映射
   - `print_mapping_suggestions(strategies, slides)`: 打印配图建议

**关键API**：
- `collect_latest_image(output_path)`: 收集最新生成的图片
- `create_page_image_mapping(slides)`: 创建完整映射
- `print_mapping_suggestions()`: 打印配图建议

**V4.8.0 新增规则：交付后清理**
- **目的**：避免图片混淆
- **时机**：PPT交付给用户后，**必须**删除所有相关图片
- **清理范围**：`/tmp/page_*.png`、`/tmp/*ppt*/`、`/tmp/*spring*/` 等
- **命令**：`rm -rf /tmp/page_*.png /tmp/*ppt*/ /tmp/*spring*/`

**文件更新**：
- `image_planner.py`: 添加 ImageWorkflow 类和便捷函数
- `SKILL.md`: 版本号 4.7.3 → 4.8.0，更新工作流说明

**生产状态：** ✅ 已发布

---

## V4.7.3 (2026-04-10) ✅ 重大更新 - Checklist固化到工作流

### 核心更新：V4.7.3 Checklist强制执行

**重大改进：**
1. **Checklist固化到工作流**：第⑦环节必须执行V4.7.3 Checklist
2. **自动化检查**：集成ppt_checklist.py到PPT生成流程
3. **硬性门禁**：Checklist未通过，禁止输出PPT

**V4.7.3 Checklist检查项：**
- 内容完整性检查
- 配图检查（V4.7.2硬约束）
- 辅助说明检查（V4.7.3硬约束）
- 文件输出检查
- 用户确认

**约束强化：**
- 每次生成PPT后，必须调用 `check_ppt_output()`
- Checklist全部通过才能发送给用户
- 脚本位置：`ppt_checklist.py`

**SKILL.md更新：**
- 版本号：4.7.1 → 4.7.3
- 第⑦环节新增V4.7.3 Checklist说明
- 添加自动化检查代码示例

**生产状态：** ✅ 已发布

---

## V4.3.11 (2026-04-07) ✅ 生产发布 - 香香妈妈双赞！
### 最终版：章节分隔页全配图+左上角金色边框

**核心优化：**
1. 章节分隔页左上角位置（与其他页面一致）
2. 紧凑型白色色块+金色边框
3. 所有章节分隔页都有AI配图
4. 配图内容与章节主题相关

**章节分隔页设计：**
- 位置：左上角（与导航目录一致）
- 样式：紧凑型白色色块+2.5pt金色边框
- 字体：44pt黑色加粗
- 配图：6个章节全覆盖

**生产状态：** ✅ 已发布

## V4.3.4 (2026-04-07) ✅ 细节优化
### 章节分隔页只保留大标题

**优化内容：**
- 移除小字号副标题
- 移除装饰线
- 只保留大标题（80pt居中）

**章节分隔页设计：**
- 整版背景图片
- 半透明遮罩层
- 大标题居中（白色80pt）
- 简洁大气

**生产状态：** ✅ 已发布

## V4.3.3 (2026-04-07) ✅ 生产发布
### 优化：AI图片排版策略

**问题修复：**
1. 左右分栏时图片遮挡内容 → 内容页使用55:45比例
2. 整版图片效果更好 → 封面/章节/结尾使用整版背景

**图片排版策略：**
- 封面 (title) → 整版背景 + 白色文字
- 章节分隔 (section) → 整版背景 + 半透明遮罩 + 白色文字
- 内容页 (content_cards) → 左图右文 (55:45)
- 结尾 (closing) → 整版背景 + 居中文字

**新增功能：**
- `_add_text_overlay()`: 在图片上添加文字叠加层
- `page_section()` 优化: 整版图片 + 半透明遮罩

**生产状态：** ✅ 已发布
## V1.2 (2026-04-07) 🔧 内容适配器透明通道

### 问题修复：内容适配器破坏排版

**问题描述：**
之前的content_adapter在解析Markdown时，会改变原始内容的组织方式，导致PPT排版混乱。

**解决方案：**
1. 当 preserve=True（默认）时，content_adapter变成透明通道
2. 原始Markdown内容原封不动地传给PPT工作流
3. 让PPT工作流自己处理内容渲染

**工作原理：**
```
用户内容（Markdown）
    ↓
content_adapter（透明通道，不处理）
    ↓
raw_content类型
    ↓
_parse_raw_markdown（让PPT工作流自己解析）
    ↓
slides结构
    ↓
PPT生成器渲染
```

**V1.2核心代码：**
- `ContentAdapter.parse_from_text()` - 检测到preserve=True时，直接返回raw_content
- `_parse_raw_markdown()` - 新增函数，负责解析原始Markdown
- `_parse_item_content()` - 辅助函数，解析内容项
- `_parse_table()` - 辅助函数，解析表格

---

## V4.3 (2026-04-07) ⭐ 内容先行工作流

### 核心升级：内容先行原则

**问题背景：**
之前的做法是直接调用PPT工作流处理主题，导致：
1. 没有深度理解主题生成专业内容
2. 跳过了内容生成阶段
3. PPT工作流本身不擅长"生成内容"

**V4.3解决方案：**

1. **内容输入判断**：
   - 检查上游是否有内容（context.content）
   - 检查是否有参考文档（context.references）
   - 如果有，直接使用
   
2. **自动内容生成**：
   - 如果没有内容，返回 `phase: need_content`
   - 提示上层AI生成专业内容
   - 把生成的内容传给PPT工作流

3. **完整工作流**：
   ```
   用户："做一个XX的PPT"
         ↓
   检查上游内容
         ↓
   【无内容】→ 提示生成内容
   【有内容】→ 解析内容
         ↓
   配图规划（50%覆盖率）
         ↓
   AI生图（每个needs_image页面）
         ↓
   配置配图 + 生成PPT
         ↓
   验证覆盖率 >= 50%
   ```

**新增接口：**
- `generate_content_for_ppt()` - 内容生成判断
- `generate_ppt_with_content()` - 内容先行的PPT制作

**约束强化：**
- 【重要】必须先有内容，再做PPT（内容先行原则）
- 配图覆盖率必须 >= 50%

---

## V1.2 (2026-04-07) 🔧 内容适配器透明通道

### 问题修复：内容适配器破坏排版

**问题描述：**
之前的content_adapter在解析Markdown时，会改变原始内容的组织方式，导致PPT排版混乱。

**解决方案：**
1. 当 preserve=True（默认）时，content_adapter变成透明通道
2. 原始Markdown内容原封不动地传给PPT工作流
3. 让PPT工作流自己处理内容渲染

**工作原理：**
```
用户内容（Markdown）
    ↓
content_adapter（透明通道，不处理）
    ↓
raw_content类型
    ↓
_parse_raw_markdown（让PPT工作流自己解析）
    ↓
slides结构
    ↓
PPT生成器渲染
```

**V1.2核心代码：**
- `ContentAdapter.parse_from_text()` - 检测到preserve=True时，直接返回raw_content
- `_parse_raw_markdown()` - 新增函数，负责解析原始Markdown
- `_parse_item_content()` - 辅助函数，解析内容项
- `_parse_table()` - 辅助函数，解析表格

---

## V4.3 (2026-04-07) ⭐ V9.0技能标准 + YAML修复

### 核心升级：技能编排系统集成

**YAML Frontmatter修复：**
- 问题：Markdown语法（`**版本：**`）被YAML解析器误认为锚点别名
- 解决：删除frontmatter中的Markdown注释内容
- 结果：✅ YAML解析成功，技能编排系统正确加载

**V9.0技能标准集成：**
- Skill ID: `ppt-maker-v42`
- 触发词：25个（中英文）
- 逻辑主题：10个
- 别名：5个
- 示例查询：5个
- 执行接口：标准化调用入口

**意图理解模块增强：**
- 新增 `ppt_query_parser.py`
- 支持30+种query模式
- 意图识别：DIRECT/WRAP_CONTENT/NEED_THEME/UNKNOWN
- 场景识别：竞品分析、周报月报、调研报告等

**技能入口封装：**
- 新增 `generate_ppt_entry.py`
- 一行代码生成PPT
- 标准化返回结果

**技能编排系统召回测试：**
```
❓ 「做个PPT」→ miaoda-ppt-maker (0.113)
❓ 「做个调研报告PPT」→ miaoda-ppt-maker (0.113)
❓ 「生成竞品分析汇报」→ miaoda-ppt-maker (0.096)
❓ 「做个周报」→ miaoda-ppt-maker (0.096)
```

---

## V4.2 (2026-04-07) ⭐ 内容适配器 + 标准化调用

### 核心升级：与其他技能产出的内容无缝对接

**新增文件：**

**1. content_adapter.py - 内容适配器 V1.1**
- 统一接口：将各种格式内容转换为slides格式
- 支持三种输入模式：
  - `parse_from_text()` - Markdown/纯文本自动解析
  - `parse_from_structure()` - 结构化数据解析
  - `parse_from_detailed()` - 详细配置解析
- **保真模式（默认）**：不总结、不删减、不压缩上游内容
- 自动识别内容类型并智能转换

**2. generate_from_content.py - 完整调用示例**
- `PPTGenerator` 类 - 封装完整生成流程
- `generate_ppt()` 快捷函数
- `ContentTemplates` 类 - 常用内容模板
- 命令行接口支持

**3. generate_ppt_entry.py - 技能调用入口 V1.0**
- `generate_ppt()` - 一行代码生成PPT
- `PPTMaker` 类 - 完整封装
- `skill_entry()` - 技能编排系统集成接口
- 标准化返回结果格式

**4. ppt_query_parser.py - 意图理解与调用 V1.0**
- `PPTQueryParser` 类 - 解析用户自然语言请求
- `PPTExecutor` 类 - 执行PPT生成
- 支持的意图类型：
  - DIRECT - 直接生成（有主题）
  - WRAP_CONTENT - 包装现有内容
  - NEED_THEME - 需要确认主题
  - UNKNOWN - 未知意图
- 支持的query模式（30+）：
  - 直接型：「做个PPT」
  - 带主题型：「做个竞品分析的汇报」
  - 带内容型：「把这段文字做成演示」
  - 场景型：「做个周报」「年终总结PPT」

**5. SKILL.md - 技能编排系统集成**
- 添加 trigger_keywords（30+触发词）
- 添加 input_examples（8个示例）
- 添加 pipeline_info（上下游技能信息）
- 添加 output_schema（输出格式规范）

**技能编排系统集成：**
```yaml
trigger_keywords:
  - 做PPT / 做个PPT
  - 生成PPT / 生成演示
  - 做成PPT / 做成演示
  - 做个汇报 / 调研报告PPT
  - 内容做成PPT
  
pipeline_info:
  upstream:
    - content-adapter  # 内容适配器（保真导入）
    - ai-research      # 调研技能
    - ai-analysis      # 分析技能
  downstream:
    - image-generation  # AI配图
```

**与其他技能结合的方式：**
```python
# 方式1：便捷函数
from generate_ppt_entry import generate_ppt
result = generate_ppt(content=markdown文本, title="标题")

# 方式2：完整封装
from generate_ppt_entry import PPTMaker
maker = PPTMaker()
result = maker.make(content=content, title="标题")

# 方式3：技能编排系统集成
from generate_ppt_entry import skill_entry
result = skill_entry("做个PPT", context={"content": "..."})
```

---

## V4.1 (2026-04-07)

### 核心升级：配图内容关联性强化 + section类型支持

**重大改进：**

**1. section类型支持（generate_ppt.py）**
- 新增 `page_section()` 方法，支持Part分隔页
- Part分隔页包含：Part标签（超大字号72pt金色）+ 副标题 + 装饰线
- 在 `create_ppt_v3_with_images()` 中添加section类型处理

**2. 内容感知提示词工程（image_planner.py V3.0）**
- 新增 `build_content_aware_prompt()` 函数
- 深度结合页面标题、items、description生成提示词
- 不再使用泛化的"科技感"配图
- 确保每张配图与页面内容高度相关

**3. 内容关联规则：**
```
输入：页面标题、items、description
    ↓
1. 提取关键概念（从标题和items中）
2. 推断视觉主题（架构/流程/对比/安全等）
3. 映射到具体视觉元素（基于概念映射表）
4. 生成深度关联的提示词
```

**4. 概念映射表（100+映射）：**
- 架构相关 → 现代架构图/层次结构
- 约束/安全 → 安全盾牌/边界可视化
- 验证 → 验证清单/质量保证
- Agent → AI机器人/智能体可视化
- 模型/大脑 → 神经网络/AI模型概念
- 多Agent协作 → 多Agent协作图
- 工具 → 工具箱/功能调用
- 等等...

**5. 50%覆盖率智能分配：**
- 封面和结尾：必须有配图
- section类型：优先配图
- content_cards类型：按50%覆盖率智能分配
- 图形图示类型：不配图（避免遮挡）

**6. 提示词生成示例对比：**

❌ 旧版（无关联）：
```
"Professional illustration, tech blue and gold accents, clean white background..."
```

✅ V4.1新版（深度关联）：
```
"security shield and boundary visualization for 'Constrain - 约束', 
AI robot illustration for 'Agent = Model + Harness', 
clean white background, no text, 16:9..."
```

---

## V4.0 (2026-04-06) ⭐ 基线版本

### 核心升级：AI配图增强 + 说明阐述模块 + 白色主题优化 + 内容详细化

**重大改进：**

**1. AI配图策略优化**
- 配图比例目标：≥50%（内页）
- content_cards页面：全部配图（右侧分栏）
- 图形图示页面（icons_grid/process_flow/comparison）：不配图，保持内容清晰
- 封面/结尾：铺满背景（不计入比例）

**2. 封面标题颜色自适应**
- clean白色主题下，封面标题自动调整为黑色/深灰色
- 深色主题下保持白色标题
- 代码逻辑：根据背景色自动判断

**3. 左右分栏保护内容**
- content_cards页面：左侧60%内容区 + 右侧40%配图区
- 配图不会覆盖原有内容
- 图形图示页面不添加配图，避免遮挡

**4. 说明阐述模块（💡必选项）**
- 所有图形图示页面底部增加说明阐述模块
- 支持的页面类型：`icons_grid`、`radar`、`process_flow`、`comparison`等
- 自动保障机制：即使配置遗漏，系统自动生成默认说明
- 格式：「💡 说明阐述」标题 + 说明内容

**5. 图形图示增强**
- `process_flow` - 流程图页（支持subtitle+description）
- `icons_grid` - 图标网格页（支持subtitle+description）
- `comparison` - 对比图页（支持subtitle+description）
- `radar` - 雷达图页（支持description）

**6. 七步工作流完整展示**
- 分两页：图标网格概览 + 内容卡片详解
- 完整7步全部展示，不再压缩

**7. 内容详细化**
- 每项内容4个要点（增加定义、标准、方法、常见问题）
- 效果对比从2项扩展到4项
- 26-30页完整内容，充分展开

**⭐ 页面数量原则：**
- 页面数量由内容决定，宁多勿少
- 宁可多几页把内容讲透，也不要删减导致信息遗漏
- 参考：简单主题8-12页，一般主题12-20页，复杂主题20-30页

**技术要点：**

封面标题颜色逻辑：
```python
# 如果是白色背景(clean主题)，标题用黑色；深色背景用白色
if t['bg'] == RGBColor(255, 255, 255):
    p.font.color.rgb = RGBColor(33, 33, 33)  # 黑色
else:
    p.font.color.rgb = RGBColor(255, 255, 255)  # 白色
```

配图配置策略：
```python
# content_cards页面：配右侧图
page_image_configs[i] = {"path": img_path, "position": "right_image", "size": "right_image"}

# 图形图示页面：不配图
# icons_grid / process_flow / comparison 不添加配图
```

---

## V3.8 (2026-04-06)

### 核心升级：内容可视化增强

**新增功能：**

**1. 配图策略分析（image_planner.py V2.1）**
- `analyze_page_needs_image()` - 判断页面是否需要配图
- `analyze_content_relationship()` - 分析内容关系类型
- `recommend_visualization()` - 推荐最佳可视化方案
- `analyze_full_presentation()` - 整体PPT分析

**内容关系识别：**
- 并列关系、递进关系、流程关系
- 对比关系、层级关系、循环关系
- 组成关系、因果关系

**2. 图形图示类型（generate_ppt.py V3.6）**
- `process_flow` - 流程图页
- `icons_grid` - 图标网格页
- `comparison` - 对比图页
- 原有：`timeline`、`radar`、`funnel`等

**3. 可视化方案推荐**
- 根据内容关系自动推荐最佳展示方式
- 8种可视化类型：卡片/图标/流程/金字塔/对比/矩阵/循环/堆叠

---

## V3.7 (2026-04-06)

### 核心升级：AI配图V2增强版

**配图规划模块（image_planner.py）：**
- V2增强版提示词工程
- 7维提示词结构：主题+元素+配色+光效+质感+构图+参数
- 白底适配：所有提示词包含 WHITE BACKGROUND
- 风格库：科技风/商务风/创意风/极简风
- 构图库：中心放射/层次深度/极简中心等

---

## V3.6 (2026-04-06)

### 核心升级：七步工作流

---

## V3.5 (2026-04-06)

### 核心升级：AI智能配图 + 白色主题

**新增AI配图能力：**
- 封面/结尾：全屏背景图
- 内页配图：左右分栏（左侧55%内容 + 右侧45%配图）
- 配图按尺寸生成，16:9比例，保持原始宽高比

**配图版式策略：**
- 涉及AI配图的页面：一劈两半，左边内容、右边配图
- 不涉及AI配图的页面：保持原有专注内容的排版

**白色主题适配：**
- PPT整体背景：纯白
- 图表背景：白色主题（clean）
- 文字：深灰，蓝色强调色
- 与AI配图完美融合

---

## V3.4 (2026-04-06)

### 核心升级：AI智能配图初版

**集成方式：**
- 使用 `miaoda-studio-cli text-to-image` 生成配图
- 新增 `create_ppt_v3_with_images()` 函数支持配图融合
- 配图位置：封面右侧、结尾背景、内容页装饰

---

## V3.3 (2026-04-06)

### 核心升级：内容工作流质量保障

**工作流五环节质量标准：**
1. 环节① 内容理解 - 理解"为什么"，不止于表面
2. 环节② 结构化 - 规划展开，复杂主题20-30页
3. 环节③ 表达决策 - 内容关系决定表达方式
4. 环节④ 内容制作 - 充分展开，有案例支撑
5. 环节⑤ 质量检查 - 每项必须通过

---

## V3.2 (2026-04-05)

### 核心升级：图表+文字配合

**布局改进：**
- 左侧60%：专业图表
- 右侧40%：详细洞察文字

---

## V3.1 (2026-04-05)

### 核心升级：图表能力强化

**新增8种图表类型：**
- 雷达图、仪表盘 - 能力评估
- 漏斗图 - 转化漏斗
- 甘特图、热力图 - 项目管理
- 矩阵图、金字塔 - 决策分析
- 组合图、堆叠图 - 趋势/构成分析

---

## V3.0 (2026-04-05)

### 核心升级：美学设计体系

**六大设计原则：**
1. 视觉层次 - 标题66pt / 数字160pt / 正文20pt
2. 留白呼吸 - 边距统一，内容≤60%
3. 图形化 - 卡片布局+进度条
4. 节奏变化 - 多种布局交替
5. 对齐网格 - 边距系统
6. 色彩克制 - 金色强调

**四套配色主题：** Executive/Spark/Terminal/Clean

---

## V1.0 (2026-04-05)

基础功能

## V4.7.1 封面图片拉伸修复 (2026-04-09)

### 修复内容

**封面图片拉伸问题**：
- 原因：add_picture同时设置width和height，导致图片被强制拉伸
- 修复：只设置width，高度自动按比例计算
- 代码位置：generate_ppt.py 第255-268行

### 配图最佳实践

1. **封面/结尾配图**：
   - 比例：16:9 (1920x1080)
   - 处理：生成后裁剪为16:9
   - 代码：只设置width，垂直居中

2. **内容页配图**：
   - 比例：可以是正方形(1:1)或4:3
   - 处理：按原始比例使用，不拉伸
   - 代码：只设置width或height其中之一

3. **配图生成提示词约束**：
   ```
   ABSOLUTELY NO TEXT: no words, no letters, no numbers, 
   no typography, no Chinese characters, pure visual only
   ```

4. **底部辅助文字**：
   - 内容页：不少于300字详细说明
   - 包含：核心观点、方法步骤、安全提醒、温馨提示

### 图片裁剪脚本参考

```python
# 封面用16:9裁剪
img = Image.open(path).convert("RGB")
TARGET_W, TARGET_H = 1920, 1080
target_ratio = TARGET_W / TARGET_H
orig_ratio = img.size[0] / img.size[1]
if orig_ratio > target_ratio:
    new_w = int(img.size[1] * target_ratio)
    left = (img.size[0] - new_w) // 2
    img = img.crop((left, 0, left + new_w, img.size[1]))
else:
    new_h = int(img.size[0] / target_ratio)
    top = (img.size[1] - new_h) // 2
    img = img.crop((0, top, img.size[0], top + new_h))
img = img.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)

# 其他页面用正方形
size = min(img.size[0], img.size[1])
left = (img.size[0] - size) // 2
top = (img.size[1] - size) // 2
img = img.crop((left, top, left + size, top + size))
img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
```

## V4.9.7 (2026-04-11) ✅ 生产发布 - 图片清理逻辑优化

**图片清理逻辑优化（大鹏反馈）**
- 之前：PPT生成完成后立即清空图片 → 反复调整需要重新生成所有图片，浪费资源
- 现在：只在开始新PPT前清空历史图片 → 生成后保留图片，方便反复调整


## V4.9.8 (2026-04-11) ✅ 生产发布 - 配图策略优化

**配图策略优化（大鹏反馈）**
- 之前：每页都配图，33页PPT需要33张图，浪费资源
- 现在：只给关键页面配图，总体10-20张

**配图规则：**
1. 📌 封面页（title）—— 必选
2. 📌 章节过渡页（section）—— 必选
3. 📌 结尾页（closing）—— 必选
4. 📌 中间关键内容页 —— 按间距均匀选择

**数量控制：** 不少于10张，不多于20张
