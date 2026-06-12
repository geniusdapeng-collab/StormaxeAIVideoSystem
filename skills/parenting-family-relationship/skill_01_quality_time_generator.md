---
name: 高质量陪伴生成器
skill_id: parenting-quality-time-generator
version: 1.0.0
last_updated: 2026-04-04
domain: 育儿与家庭关系
sub_domain: 亲子陪伴
type: skill
priority: high

execution_layer: execution
execution_mode: proactive

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
    name: 李大鹏
    role: AI产品经理
    family: 异地育儿（女儿香香2025年11月出生、宝妈在南昌）
  modes: ["efficient", "warm", "practical"]
  constraints:
    safety_first: true
    location_aware: false
    time_sensitive: false

capabilities:
  tools: []
  data_sources: ["儿童发展心理学", "游戏力育儿法", "蒙台梭利教育"]
  output_formats: ["活动方案", "清单模板", "对话话术"]

retrieval_profile:
  logical_topics: ["亲子陪伴", "周末活动", "高效陪伴", "亲子互动"]
  aliases: ["陪孩子玩", "带娃活动", "亲子时光", "爸爸陪娃"]
  sample_queries:
    - "周末怎么陪1岁宝宝玩"
    - "高质量亲子陪伴怎么做"
    - "1-3岁孩子适合什么活动"
  problem_patterns: ["人在心不在", "不知道玩什么", "陪伴太单调"]
  entities:
    who: ["爸爸", "妈妈", "家长", "看护人"]
    what: ["亲子活动", "陪伴游戏", "互动时光"]
    when: ["周末", "下班后", "节假日", "寒暑假"]
    where: ["家里", "户外", "公园", "游乐场"]

trigger_words:
  - "周末陪娃"
  - "亲子陪伴"
  - "高质量陪伴"
  - "陪孩子玩"
  - "带娃活动"
  - "亲子时光"

quality_standards:
  pass_threshold: 92
  scoring_weights:
    accuracy: 0.20
    completeness: 0.15
    actionability: 0.20
    safety: 0.15
    empathy: 0.10
    efficiency: 0.10
    reliability: 0.05
    clarity: 0.05
  response_time_ms: 3000
  accuracy: 0.92
  recall_at_50: 0.95

tools_read:
  - "memory_get"
  - "memory_search"

tools_write:
  - "memory"

confirmation_required_for: []

output_schema:
  type: "structured"
  fields: ["活动方案", "年龄段", "所需准备", "注意事项"]
---

# TL;DR

根据孩子年龄定制亲子活动方案，识别低质量陪伴陷阱，提供可直接执行的周末陪娃计划。

# 场景分析

## 典型场景
用户是一位异地工作的父亲（千问AI产品经理），女儿香香2025年11月出生（目前约5个月）。每周末从杭州往返南昌探望妻女。有限的相处时间需要最大化利用质量。

## 核心挑战
1. **时间稀缺**：周末2天，扣除路途实际陪伴时间有限
2. **年龄适配**：5个月宝宝活动能力有限，需要适合其发育阶段的互动方式
3. **高质量门槛**：避免"人在心不在"的无效陪伴
4. **仪式感需求**：每次见面都要给孩子留下深刻记忆

## 情感需求
- 对女儿的愧疚感（不能每天陪伴）
- 想要证明自己是好爸爸的强烈愿望
- 担心错过孩子成长的焦虑

# 决策框架

## 第一步：年龄判断
根据孩子月龄确定活动类型：
- **0-6月**：感官刺激为主（视觉卡片、追视游戏、抚触按摩）
- **6-12月**：大运动发展为主（爬行引导、扶站练习、简单玩具互动）
- **1-2岁**：探索欲满足为主（藏猫猫、搭积木、涂鸦、沙水游戏）
- **2-3岁**：角色扮演与社会性游戏（过家家、假想游戏）

## 第二步：场景选择
根据家庭环境选择：
- **家中**：日常照料+亲子游戏
- **户外公园**：感官刺激+大运动
- **室内游乐场**：社交能力培养
- **近郊出行**：探索体验+高质量记忆

## 第三步：活动设计
单个活动不超过30分钟，保持孩子注意力；
组合3-4个活动形成完整的一天；
留出"缓冲带"应对孩子状态变化。

# 专业建议

## 0-6月宝宝陪伴指南

### 每日陪伴模板（周末一天）

| 时段 | 活动 | 时长 | 重点 |
|------|------|------|------|
| 上午 | 抚触按摩+被动操 | 20min | 增进亲子联结 |
| 上午 | 视觉追踪游戏 | 15min | 刺激视觉发育 |
| 午间 | 户外晒太阳 | 30min | 补钙+感官刺激 |
| 下午 | 亲子阅读（布书） | 10min | 早期阅读启蒙 |
| 下午 | 音乐互动 | 15min | 音乐感知培养 |
| 傍晚 | 洗澡+抚触 | 30min | 睡眠仪式 |

### "假装陪伴"红灯清单
- ❌ 边看手机边抱孩子
- ❌ 让孩子自己玩，家长在旁边发呆
- ❌ 强迫孩子按大人节奏活动
- ❌ 过度安排，不给孩子自由探索时间

### 高质量陪伴绿灯清单
- ✅ 全程眼神交流，孩子看你时立即回应
- ✅ 跟随孩子的节奏，及时调整活动
- ✅ 用语言描述你正在做的事情（输入语言）
- ✅ 留出"无所事事"的空白时间（自由探索）

## 亲子回忆档案模板

每次相聚结束时，记录：
```
【相聚日期】：2026年4月4日
【宝宝月龄】：5个月15天
【今日亮点】：
1. 宝宝第一次主动伸手要抱
2. 亲子抚触时发出咯咯笑声
3. 户外晒太阳时盯着树叶看

【爸爸的感受】：
（记录你的真实情感）

【下次想尝试】：
1. 尝试引入第一本硬纸板书
2. 带宝宝去小区花园看花
```

## 香香专属建议（5月龄）

当前发育重点：
- **大运动**：翻身练习（从仰卧到俯卧）
- **精细动作**：抓握练习（够取小物件）
- **语言**：咿呀学语阶段，多与宝宝说话
- **社交**：认人期开始，对熟悉人微笑

本周推荐活动：
1. **翻身引导游戏**：在宝宝侧面用摇铃吸引注意力，引导翻身
2. **照镜子认知**：抱着宝宝照镜子，指向镜中图像
3. **抚触升级**：加入婴儿按摩油，增加触觉刺激
4. **户外探索**：小区花园，让宝宝感受风、阳光、树叶

# 质量检查

## 自检清单
- [ ] 方案是否适合孩子当前月龄？
- [ ] 活动时间是否符合孩子作息（避开困倦时段）？
- [ ] 是否有足够的"缓冲"时间？
- [ ] 是否避免了"人在心不在"陷阱？
- [ ] 是否有记录今日亲子时刻？

## 快速评估
回答以下3个问题：
1. 今天的陪伴中，我有没有放下手机专心陪孩子？
2. 孩子在这段时间里是否展现出愉悦和投入？
3. 我有没有用语言描述正在发生的事（语言输入）？

如果任何问题答案是否定，请调整当前活动安排。
