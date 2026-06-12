# Seedance 提示词智能合规优化器 V1.0
## 设计理念：零丢失 + 效果最大化

### 核心原则
1. **内容零丢失**：角色外貌、动作、环境、台词全部保留
2. **改写而非截断**：用更精炼的说法替代冗长描述
3. **语序重排**：调整成 6 步公式结构但不丢信息
4. **信息合并**：重叠内容自动合并（styleManifesto + lightingThreeLayer）
5. **优先级保护**：超长时按优先级保核心信息

---

## 优化流程

```
丰富提示词（generateShotPrompt 输出）
    ↓
[Step1] 信息提取与结构化
    - 解析出：主体、动作、环境、镜头、风格、光线、约束
    - 标记每个部分的"重要性等级"
    ↓
[Step2] 智能压缩（可选）
    - 如果长度 > 500 字：
      a) 把冗长描述→关键词（"两个角色物种/类型不同..." → "distinct species, contrasting builds"）
      b) 合并重复信息（风格 + 光线有重叠时）
      c) 去掉废话（"画面清晰"这种 Seedance 天然会做的）
    - 如果长度 ≤ 500 字：跳过此步
    ↓
[Step3] 语序重排
    - 调整为：[主体], [动作], in [环境], camera [镜头运动], style [风格 + 光线], avoid [约束]
    - 保持所有关键信息不丢失
    ↓
[Step4] 最终检查
    - 字数 ≤ 500？是→通过；否→执行 Step5
    - 包含必要元素？是→通过；否→补全
    ↓
[Step5] 优先级截断（最后手段）
    - 按优先级保：角色外貌 > 动作描述 > 场景环境 > 镜头运镜 > 风格光线 > 负面约束
    - 只删最低优先级的冗余部分
```

---

## 具体改写策略

### 1. 冗长描述→关键词映射表

| 原描述 | 改写后 | 说明 |
|--------|--------|------|
| "两个角色物种/类型不同，各有≥3 个外貌锚点，体型比例差异明显，标志性元素不重叠" | "distinct species, 3+ visual anchors each, contrasting builds" | 英文更精炼，Seedance 理解更好 |
| "主光：暖金色侧逆光，辅光：冰蓝轮廓光，环境光：云海漫射光" | "warm golden rim light, icy blue backlight, soft cloud ambient" | 去掉中文标签，直接写光影关键词 |
| "孙悟空手持金箍棒从云层中跃出，二郎神三眼神开，金色锁链从天而降" | "Sun Wukong leaps from clouds with golden cudgel, Erlang Shen opens third eye, golden chains descend" | 保持动作但精简动词 |
| "画面趋于静止，双方对峙" | "freeze frame, standoff" | 2 词替代 8 字 |

### 2. 信息合并规则

- **风格 + 光线合并**：`styleManifesto`和 `lightingThreeLayer` 都提到"暖金色"时，合并为一次
- **角色外貌去重**：如果 `anchorKeywords`和 `shot.description` 都提到"火眼金睛"，只保留一次
- **镜头语言统一**：`shot.camera`和 `extractCameraMotion` 输出冲突时，以 `extractCameraMotion`为准

### 3. 废话识别清单（可安全删除）

- ✅ "画面清晰"（Seedance 默认高清）
- ✅ "无文字无字幕无 LOGO"（已有 `avoid text and watermark`）
- ✅ "高质量渲染"（模型默认）
- ✅ "电影级画质"（冗余形容词）

### 4. 优先级保护列表（不可删除）

- 🔴 **角色外貌锚点**：姓名 + 关键特征（火眼金睛、三眼、铠甲等）
- 🟢 **核心动作**：主要动作描述（跃出、交手、变身等）
- 🟡 **场景环境**：地点 + 氛围（天宫云海、金光万丈等）
- 🟠 **镜头运镜**：景别 + 运动（仰拍推轨、特写等）
- 🔵 **风格光线**：整体调性（写实电影风、暖金底调等）

---

## 示例

### 输入（generateShotPrompt 输出）
```
孙悟空，二郎神，孙悟空：金色毛发 + 火眼金睛 + 金色铠甲，二郎神：银色铠甲 + 三眼 + 天眼金光，孙悟空手持金箍棒从云层中跃出，二郎神三眼神开，金色锁链从天而降，双方对峙，in 天宫云海战场，金光万丈，camera low angle slow push-in, style realistic, cinematic film tone, 3D CGI, Chinese animation style, warm golden tone, dramatic rim light, backlit, warm tone lighting, avoid jitter and bent limbs, avoid text and watermark, avoid identity drift
```

### 优化过程
1. **信息提取**：
   - 主体：孙悟空、二郎神 + 外貌锚点
   - 动作：跃出、三眼神开、锁链降、对峙
   - 环境：天宫云海战场、金光万丈
   - 镜头：low angle slow push-in
   - 风格：realistic, cinematic, 3D CGI, Chinese animation
   - 光线：dramatic rim light, backlit, warm tone
   - 约束：jitter/bent limbs/text/watermark/identity drift

2. **智能压缩**：
   - "孙悟空手持金箍棒从云层中跃出" → "Sun Wukong leaps from clouds with golden cudgel"
   - "二郎神三眼神开，金色锁链从天而降" → "Erlang Shen opens third eye, golden chains descend"
   - "双方对峙" → "standoff"
   - "天宫云海战场，金光万丈" → "celestial palace, sea of clouds, radiant golden light"

3. **语序重排**：
   ```
   Sun Wukong (golden fur, fiery eyes, golden armor), Erlang Shen (silver armor, third eye, glowing third-eye light), 
   Sun Wukong leaps from clouds with golden cudgel, Erlang Shen opens third eye, golden chains descend, standoff,
   in celestial palace, sea of clouds, radiant golden light,
   camera low angle slow push-in,
   style realistic, cinematic film tone, 3D CGI, Chinese animation style, warm golden tone, dramatic rim light, backlit,
   avoid jitter and bent limbs, avoid text and watermark, avoid identity drift
   ```

4. **字数检查**：~320 字 < 500 字 → 通过

### 输出（最终提交给 API 的提示词）
```
Sun Wukong (golden fur, fiery eyes, golden armor), Erlang Shen (silver armor, third eye, glowing third-eye light), Sun Wukong leaps from clouds with golden cudgel, Erlang Shen opens third eye, golden chains descend, standoff, in celestial palace, sea of clouds, radiant golden light, camera low angle slow push-in, style realistic, cinematic film tone, 3D CGI, Chinese animation style, warm golden tone, dramatic rim light, backlit, avoid jitter and bent limbs, avoid text and watermark, avoid identity drift
```

---

## 实现代码框架

```python
def optimize_prompt_for_seedance(raw_prompt: str) -> str:
    """
    智能合规优化器
    输入：generateShotPrompt 输出的丰富提示词
    输出：符合 Seedance 规范的精炼提示词
    """
    
    # Step1: 信息提取与结构化
    structured = parse_prompt_to_structured(raw_prompt)
    
    # Step2: 智能压缩（如需要）
    if len(raw_prompt) > MAX_PROMPT_LENGTH:
        structured = apply_compression(structured)
    
    # Step3: 语序重排
    restructured = reorder_to_six_step_formula(structured)
    
    # Step4: 组装并检查
    optimized = assemble_prompt(restructured)
    
    # Step5: 优先级截断（兜底）
    if len(optimized) > MAX_PROMPT_LENGTH:
        optimized = truncate_by_priority(optimized)
    
    return optimized


def parse_prompt_to_structured(prompt: str) -> dict:
    """解析提示词为结构化数据"""
    return {
        'subject': extract_subject(prompt),
        'action': extract_action(prompt),
        'environment': extract_environment(prompt),
        'camera': extract_camera_motion(prompt),
        'style': extract_style_keywords(prompt),
        'lighting': extract_lighting_keywords(prompt),
        'constraints': extract_constraints(prompt)
    }


def apply_compression(structured: dict) -> dict:
    """对每个字段应用智能压缩"""
    # 角色外貌：保留核心锚点，去掉冗余修饰
    structured['subject'] = compress_anchor_keywords(structured['subject'])
    
    # 动作：精简动词，去掉时间切片标签
    structured['action'] = simplify_action_verbs(structured['action'])
    
    # 环境：合并重复描述
    structured['environment'] = merge_redundant_env(structured['environment'])
    
    # 风格 + 光线：合并重叠部分
    combined = merge_style_and_lighting(structured['style'], structured['lighting'])
    structured['style'] = combined
    
    return structured


def reorder_to_six_step_formula(structured: dict) -> dict:
    """调整为 6 步公式顺序"""
    return {
        'subject': structured['subject'],
        'action': structured['action'],
        'environment': structured['environment'],
        'camera': structured['camera'],
        'style': structured['style'],  # 已合并光线
        'constraints': structured['constraints']
    }


def truncate_by_priority(prompt: str) -> str:
    """按优先级截断（最后手段）"""
    priority_order = ['subject', 'action', 'environment', 'camera', 'style', 'constraints']
    # 实现略...
    return prompt
```

---

## 下一步行动

1. **实现 optimize_prompt_for_seedance() 函数**（Python 或 Node.js）
2. **集成到 director.js 调用 seedance-wrapper 之前**
3. **测试验证**：对比优化前后的提示词效果和字数
4. **迭代优化**：根据实际渲染结果调整压缩策略
