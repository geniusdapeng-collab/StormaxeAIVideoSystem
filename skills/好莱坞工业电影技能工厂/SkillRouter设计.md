# Skill Router — 技能路由设计

> 用户需求 → 激活哪些技能？按什么顺序调用？输出如何组合？

---

## 核心定位

Skill Router 是系统的"智能调度中心"，负责：
1. **接收**：用户的自然语言需求
2. **分析**：判断需要哪些技能
3. **编排**：确定调用顺序和依赖关系
4. **分发**：将任务分配给对应技能
5. **组装**：收集技能输出，组装成主链路可用的格式

```
用户输入 → Skill Router → 技能分支链路 → 融合层 → 主链路 → 视频生成
```

---

## 路由判断逻辑

### 三层路由机制

#### 第一层：意图分类（Intent Classification）

```python
def classify_intent(user_input: str) -> IntentType:
    """
    判断用户需求的整体意图类型
    """
    keywords = extract_keywords(user_input)
    
    if contains_any(keywords, ["生成", "制作", "拍", "渲染"]):
        return IntentType.GENERATION
    elif contains_any(keywords, ["修改", "调整", "换个", "改一下"]):
        return IntentType.MODIFICATION
    elif contains_any(keywords, ["分析", "评估", "打分", "怎么样"]):
        return IntentType.ANALYSIS
    elif contains_any(keywords, ["串联", "编排", "顺序", "安排"]):
        return IntentType.SEQUENCING
    else:
        return IntentType.GENERATION  # 默认走生成
```

#### 第二层：领域识别（Domain Detection）

```python
def detect_domains(user_input: str) -> list[Domain]:
    """
    识别需求涉及的专业领域
    """
    domains = []
    
    # 叙事/故事领域
    if contains_any(user_input, ["故事", "叙事", "情节", "场景", "角色"]):
        domains.extend([Domain.WRITING, Domain.CHARACTER])
    
    # 镜头/视觉领域
    if contains_any(user_input, ["镜头", "运镜", "景别", "构图", "机位"]):
        domains.append(Domain.CINEMATOGRAPHY)
    
    # 光线/视觉氛围
    if contains_any(user_input, ["光线", "光影", "灯光", "明暗", "色调"]):
        domains.append(Domain.LIGHTING)
    
    # 表演/角色行为
    if contains_any(user_input, ["表情", "表演", "情绪", "动作", "走位"]):
        domains.append(Domain.ACTING)
    
    # 声音/音乐
    if contains_any(user_input, ["音乐", "配乐", "音效", "声音", "旁白"]):
        domains.append(Domain.SOUND)
    
    # 剪辑/节奏
    if contains_any(user_input, ["剪辑", "节奏", "转场", "快慢"]):
        domains.append(Domain.EDITING)
    
    # 美术/场景
    if contains_any(user_input, ["场景", "道具", "服装", "环境", "空间"]):
        domains.append(Domain.PRODUCTION_DESIGN)
    
    # 特效
    if contains_any(user_input, ["特效", "粒子", "爆炸", "魔法", "发光"]):
        domains.append(Domain.VFX)
    
    # 默认：激活核心技能组合
    if not domains:
        domains = [Domain.DIRECTOR, Domain.CINEMATOGRAPHY, Domain.LIGHTING]
    
    return domains
```

#### 第三层：技能激活（Skill Activation）

```python
def activate_skills(domains: list[Domain], intent: IntentType) -> list[SkillCall]:
    """
    根据领域和意图，确定需要激活的技能及调用顺序
    """
    skill_calls = []
    
    # 阶段1：需求解析（所有类型都走）
    skill_calls.append(SkillCall(
        skill_id="skill_creative_director",
        stage=1,
        priority=1,
        input={"user_input": "...", "intent": intent}
    ))
    
    # 阶段2：根据领域激活技能
    for domain in domains:
        if domain == Domain.WRITING:
            skill_calls.extend([
                SkillCall(skill_id="skill_wga_story_editor", stage=2, priority=2),
                SkillCall(skill_id="skill_wga_screenwriter", stage=3, priority=3),
                SkillCall(skill_id="skill_wga_polish", stage=3.5, priority=4),
            ])
        elif domain == Domain.CHARACTER:
            skill_calls.append(SkillCall(
                skill_id="skill_sag_character_analysis", stage=6, priority=5
            ))
        elif domain == Domain.CINEMATOGRAPHY:
            skill_calls.append(SkillCall(
                skill_id="skill_iatse_600_dp", stage=5, priority=5
            ))
        elif domain == Domain.LIGHTING:
            skill_calls.append(SkillCall(
                skill_id="skill_iatse_728_gaffer", stage=5, priority=5
            ))
        elif domain == Domain.ACTING:
            skill_calls.extend([
                SkillCall(skill_id="skill_sag_acting_coach", stage=5.5, priority=5),
                SkillCall(skill_id="skill_sag_portrait_guard", stage=6.5, priority=6),
            ])
        elif domain == Domain.SOUND:
            skill_calls.append(SkillCall(
                skill_id="skill_iatse_695_sound", stage=14, priority=12
            ))
        elif domain == Domain.EDITING:
            skill_calls.append(SkillCall(
                skill_id="skill_iatse_700_editor", stage=13, priority=11
            ))
        elif domain == Domain.PRODUCTION_DESIGN:
            skill_calls.append(SkillCall(
                skill_id="skill_iatse_800_production_designer", stage=3, priority=3
            ))
        elif domain == Domain.VFX:
            skill_calls.append(SkillCall(
                skill_id="skill_vfx_supervisor", stage=12, priority=10
            ))
    
    # 阶段3：导演和质量门控（生成类必须走）
    if intent == IntentType.GENERATION:
        skill_calls.extend([
            SkillCall(skill_id="skill_dga_director", stage=3, priority=2),
            SkillCall(skill_id="skill_qa_director_review", stage=10, priority=9),
        ])
    
    # 按stage排序
    skill_calls.sort(key=lambda x: (x.stage, x.priority))
    
    return skill_calls
```

---

## 技能输入输出Schema

### 技能输入Schema（统一）

```yaml
SkillInput:
  user_requirements: string          # 用户的原始需求
  context:                           # 上下文信息
    project_name: string
    project_type: enum               # 单镜/短片/系列
    duration_target: string          # 目标时长
    style_reference: list[string]    # 风格参考
  previous_outputs: dict             # 前序技能输出
    scene_cards: list[SceneCard]    # 已有SceneCard
    shot_cards: list[ShotCard]      # 已有ShotCard
    character_blueprints: list       # 已有角色蓝图
  constraints:                       # 约束条件
    hard_constraints: list[string] # 硬约束（v4.1规范）
    soft_constraints: list[string]  # 软约束（用户偏好）
```

### 技能输出Schema（统一）

```yaml
SkillOutput:
  skill_id: string
  version: string
  status: enum                      # success/partial/failed/skipped
  intermediate_products:             # 专业中间产物
    scene_cards: list[SceneCard]    # 符合SceneCardSchema
    shot_cards: list[ShotCard]      # 符合ShotCardSchema
    performance_designs: list        # 符合PerformanceDesignSchema
    light_designs: list             # 符合LightDesignSchema
    sound_events: list               # 符合SoundEventTableSchema
    vfx_designs: list               # 符合VFXDesignSchema
  metadata:
    confidence: float                # 输出置信度 0-1
    warnings: list[string]          # 警告信息
    suggestions: list[string]        # 优化建议
  execution_time: float             # 执行耗时（秒）
```

---

## 技能调用顺序

### 标准调用顺序（按Stage排列）

```yaml
SkillExecutionOrder:
  stage_1:
    - skill_creative_director        # 需求解析 + 自然语言→参数
  
  stage_2:
    - skill_wga_story_editor          # Logline + 角色弧线雏形
  
  stage_3:
    - skill_wga_screenwriter          # Scene Card生成（叙事结构）
    - skill_dga_director              # 场次意图确认
    - skill_iatse_800_production_designer  # Environment Bible
  
  stage_5:
    - skill_iatse_600_dp              # Shot Card摄影指导部分
    - skill_iatse_728_gaffer          # Shot Card灯光设计部分
    - skill_sag_acting_coach          # 表演设计部分
    - skill_wga_showrunner             # 跨集一致性（系列时）
  
  stage_6:
    - skill_sag_character_analysis    # 7维角色分析
  
  stage_7:
    - skill_sag_portrait_guard        # 定妆照审核
  
  stage_8:
    - skill_creative_director         # Prompt融合
  
  stage_10:
    - skill_qa_director_review        # 导演终审
  
  stage_12:
    - skill_vfx_supervisor            # VFX设计
  
  stage_13:
    - skill_iatse_700_editor          # 剪辑方案
  
  stage_14:
    - skill_iatse_695_sound           # 声音事件表
    - skill_colorist                  # 色彩脚本
```

### 依赖关系图

```
[creative_director] → [wga_story_editor] → [wga_screenwriter] → [scene_card]
                                                                        ↓
[dga_director] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← [director_approval]
                                                                        ↓
[production_designer] → [environment_bible] → [shot_card] → [dp/gaffer/acting]
                                                                        ↓
[character_analysis] → [portrait_guard] → [prompt_fusion] → [vfx/sound]
                                                                        ↓
[qa_director_review] → [render] → [editing] → [final_delivery]
```

---

## 路由决策表（快速参考）

| 用户需求关键词 | 激活技能组合 | 调用顺序 |
|---------------|-------------|---------|
| "生成一个神兽镜头" | Creative Director + DP + Gaffer + Acting Coach + Director | 1→5→5→5→10 |
| "要暗一点的光线" | Creative Director + Gaffer（仅此两个） | 1→5 |
| "修改角色的表情" | Acting Coach + Portrait Guard + Director Review | 5→6→10 |
| "加个深海场景" | Creative Director + Production Designer + Gaffer + DP | 1→3→5→5 |
| "这个镜头不够震撼" | Creative Director + Director + QA Review | 1→3→10 |
| "配个背景音乐" | Creative Director + Sound Designer | 1→14 |

---

## Skill Router 配置

### 声明式描述（Skill Registry）

```yaml
SkillRegistry:
  # DGA导演工会
  skill_dga_director:
    domains: [DIRECTION]
    stage: 3
    input_schema: SkillInput
    output_schema: SkillOutput
    dependencies: [skill_creative_director]
    conflicts: []
    
  # WGA编剧工会
  skill_wga_screenwriter:
    domains: [WRITING]
    stage: 3
    input_schema: SkillInput
    output_schema: SkillOutput
    dependencies: [skill_wga_story_editor]
    conflicts: []
  
  # SAG-AFTRA
  skill_sag_acting_coach:
    domains: [ACTING]
    stage: 5
    input_schema: SkillInput
    output_schema: SkillOutput
    dependencies: [skill_sag_character_analysis]
    conflicts: []
  
  # IATSE技术
  skill_iatse_600_dp:
    domains: [CINEMATOGRAPHY]
    stage: 5
    input_schema: SkillInput
    output_schema: SkillOutput
    dependencies: [skill_wga_screenwriter]
    conflicts: []
  
  skill_iatse_728_gaffer:
    domains: [LIGHTING]
    stage: 5
    input_schema: SkillInput
    output_schema: SkillOutput
    dependencies: [skill_wga_screenwriter]
    conflicts: []
  
  # 质量门控
  skill_qa_director_review:
    domains: [QUALITY]
    stage: 10
    input_schema: SkillInput
    output_schema: SkillOutput
    dependencies: [skill_dga_director]
    conflicts: []
```

---

## 路由示例

### 示例1："拍一个深海神兽苏醒的镜头"

```
输入分析：
  意图类型: GENERATION
  识别领域: WRITING, CHARACTER, CINEMATOGRAPHY, LIGHTING, VFX

技能激活：
  1. skill_creative_director (Stage 1) ← 需求解析
  2. skill_wga_story_editor (Stage 2) ← 叙事结构
  3. skill_wga_screenwriter (Stage 3) ← Scene Card
  4. skill_sag_character_analysis (Stage 6) ← 神兽角色分析
  5. skill_iatse_600_dp (Stage 5) ← 镜头设计
  6. skill_iatse_728_gaffer (Stage 5) ← 光线设计
  7. skill_vfx_supervisor (Stage 12) ← 深海发光粒子
  8. skill_qa_director_review (Stage 10) ← 终审

融合层输入：
  SceneCard (wga_screenwriter)
  ShotCards[] (dp + gaffer + acting)
  VFXDesign (vfx_supervisor)
  
最终输出：
  Prompt → Seedance渲染
```

### 示例2："把这个角色的表情改得更恐惧一点"

```
输入分析：
  意图类型: MODIFICATION
  识别领域: ACTING

技能激活：
  1. skill_creative_director (Stage 1) ← 解析"恐惧"意图
  2. skill_sag_acting_coach (Stage 5) ← 修改表演设计
  3. skill_sag_portrait_guard (Stage 6.5) ← 验证一致性
  4. skill_qa_director_review (Stage 10) ← 终审

融合层输入：
  PerformanceDesign (acting_coach) ← 新版表演设计
  
最终输出：
  新Prompt → Seedance重新渲染
```

---

**编制日期**：2026-06-04
**版本**：v1.0.0
