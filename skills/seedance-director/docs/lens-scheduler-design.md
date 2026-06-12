# LensScheduler — 镜头调度器设计文档 V1.0

## 问题定义

**当前痛点：**
- 每个镜头固定 11 秒，1 镜头=1 次 API 提交
- 长镜头被强行截断→损伤叙事完整性
- 短镜头被拉长到 11 秒→浪费配额且画面拖沓
- 无法合并多个短镜头→效率低下
- 无法拆分超长镜头→艺术性受损

**核心矛盾：**
```
叙事逻辑：1 个镜头 = 1 个完整叙事单元（自然时长 3-20 秒不等）
平台限制：每次提交 2-12 秒（官方 Seedance API）
```

---

## 设计目标

**LensScheduler 的职责：**
1. 接收 story-engine 生成的镜头列表（每个镜头有自然时长）
2. 根据平台限制智能分配提交计划
3. 输出：哪些镜头合并、哪些拆分、每个提交的 duration

**规则：**
- 镜头 ≤12 秒 → 独立提交（duration=镜头自然时长）
- 镜头 >12 秒 → 拆成首帧 + 尾帧连续提交（或上下半场）
- 相邻短镜头 → 合并成 1 次提交（总时长≤12 秒）
- 必须保证画面连贯性（尾帧衔接）

---

## 算法设计

### 输入数据结构

```javascript
{
  shots: [
    {
      id: "S01",
      naturalDuration: 8,        // 故事引擎计算的自然时长
      description: "...",
      characters: [...],
      emotion: {...},
      // ... 其他字段
    },
    // ...
  ]
}
```

### 输出数据结构

```javascript
{
  submissions: [
    {
      submissionId: "SUB001",
      shots: ["S01"],           // 独立提交
      totalDuration: 8,         // 总时长
      type: "single",           // single/merged/split
      isFirstFrameVideo: true,  // 是否文生视频（首帧）
      isLastFrameVideo: false,  // 是否图生视频（尾帧衔接）
      lastFrameImage: null      // 上一镜头的尾帧（用于图生视频）
    },
    {
      submissionId: "SUB002",
      shots: ["S02", "S03"],    // 合并提交
      totalDuration: 10,        // 5+5=10
      type: "merged",
      isFirstFrameVideo: true,
      isLastFrameVideo: false
    },
    {
      submissionId: "SUB003",
      shots: ["S04_part1", "S04_part2"],  // 拆分提交
      totalDuration: 6,         // 原镜头 14 秒拆成 6+6+2
      type: "split",
      isFirstFrameVideo: true,
      isLastFrameVideo: true,   // 使用尾帧衔接
      lastFrameImage: "path/to/S03_last_frame.png"
    }
  ]
}
```

### 调度算法

```python
def schedule(shots):
    submissions = []
    current_batch = []
    current_duration = 0
    
    for shot in shots:
        natural_duration = shot.naturalDuration
        
        if natural_duration <= 12:
            # 情况 1: 镜头≤12 秒，尝试合并
            if current_duration + natural_duration <= 12 and len(current_batch) < 3:
                # 可以合并（最多 3 个短镜头）
                current_batch.append(shot)
                current_duration += natural_duration
            else:
                # 提交当前批次
                if current_batch:
                    submissions.append(create_submission(current_batch, "merged"))
                # 开始新批次
                current_batch = [shot]
                current_duration = natural_duration
                
        elif natural_duration > 12:
            # 情况 2: 镜头>12 秒，需要拆分
            if current_batch:
                submissions.append(create_submission(current_batch, "merged"))
                current_batch = []
                current_duration = 0
            
            # 拆分策略：每段≤12 秒
            num_parts = ceil(natural_duration / 12)
            part_duration = natural_duration / num_parts
            
            for i in range(num_parts):
                part_shot = copy(shot)
                part_shot.id = f"{shot.id}_part{i+1}"
                part_shot.naturalDuration = part_duration
                
                if i == 0:
                    # 第一部分：文生视频
                    submissions.append(create_submission([part_shot], "split_first"))
                elif i == num_parts - 1:
                    # 最后一部分：图生视频（尾帧衔接）
                    submissions.append(create_submission([part_shot], "split_last"))
                else:
                    # 中间部分：图生视频
                    submissions.append(create_submission([part_shot], "split_middle"))
    
    # 提交剩余批次
    if current_batch:
        submissions.append(create_submission(current_batch, "merged"))
    
    return submissions
```

---

## 关键细节

### 1. 尾帧连续生成

**原理：**
- 第 N 个镜头提交时，如果 `isFirstFrameVideo=true` → 文生视频
- 如果 `isFirstFrameVideo=false` → 图生视频，用第 N-1 个镜头的尾帧作首帧

**API 参数：**
```javascript
{
  model: "doubao-seedance-2-0-pro",
  prompt: "...",
  image_url: "path/to/previous_last_frame.png",  // 图生视频模式
  return_last_frame: true,                        // 返回尾帧供下一镜头使用
  duration: 8                                     // 本次提交时长
}
```

### 2. 拆分镜头的视觉连贯性

**挑战：** 同一个镜头拆成多段，如何保证视觉连贯？

**解决方案：**
- Part1: 文生视频（纯文本提示词）
- Part2+: 图生视频（Part1 尾帧作为首帧 + 相同的文本提示词）
- 提示词中明确标注："continuation of previous shot"

### 3. 合并镜头的画面过渡

**挑战：** 两个不同镜头合并成一次提交，如何保证过渡自然？

**解决方案：**
- 在提示词中明确描述："从场景 A 过渡到场景 B"
- 利用 MicroMotion 增强描述过渡动作
- 示例：`孙悟空跃出云层，落地后与二郎神对峙`

---

## 实施步骤

### Phase 1: 基础调度器（V1.0）
- [x] 设计文档完成
- [ ] 实现 `LensScheduler.schedule()` 函数
- [ ] 集成到 director.js Phase4 之前
- [ ] 单元测试

### Phase 2: 尾帧连续生成（V1.1）
- [ ] 修改 seedance-wrapper 支持 `return_last_frame`
- [ ] 实现尾帧缓存机制
- [ ] 图生视频模式切换逻辑

### Phase 3: 拆分镜头优化（V1.2）
- [ ] 拆分提示词生成策略
- [ ] 视觉连贯性增强
- [ ] 用户可配置拆分粒度

---

## 预期收益

**效率提升：**
- 短镜头合并：4 个 5 秒镜头 → 2 次提交（节省 50% 配额）
- 长镜头拆分：14 秒镜头 → 2 次 7 秒提交（符合平台限制）

**艺术性保障：**
- 镜头自然时长不再被强制截断
- 画面连贯性质的飞跃（尾帧衔接）
- 导演级控制力（可调整合并/拆分策略）

---

*设计完毕。有问题随时问。—— 小G 🦞*
