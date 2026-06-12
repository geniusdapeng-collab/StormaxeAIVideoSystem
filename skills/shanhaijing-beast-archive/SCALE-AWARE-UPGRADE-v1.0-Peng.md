# Scale-Aware Shot Designer 升级方案 v1.0-Peng

## 问题背景

当前系统中的镜头设计存在严重缺陷：
- **所有异兽使用同一套景别策略**，没有考虑体型差异
- 微型异兽（一尺级，0.3米）和神话级异兽（千里级，500公里）被同等对待
- **人物（小G，1.3米）与异兽的比例关系没有在镜头中体现**
- 远景/中景/近景的定义是固定的，没有根据异兽大小动态调整

## 升级目标

1. **尺度感知**：每个异兽根据其真实大小，获得定制化的镜头策略
2. **比例体现**：人物与异兽的大小差异必须在画面中清晰可感知
3. **景别差异化**：
   - 远景：展示异兽全貌（或局部全貌，当异兽太大时）
   - 中景：对异兽来说是"特写"，对人物来说是"全景"
   - 近景：刻画人物表情，异兽作为背景或环境元素

## 系统架构升级

### 新增模块

```
skills/shanhaijing-beast-archive/
├── scale-aware-shot-designer.js    ← 新增（核心模块）
├── beast-engine.js                  ← 修改（集成scale注入）
├── beast-integration.js             ← 修改（传递scale策略）
└── director-pipeline.js           ← 修改（stage8应用scale策略）
```

### 数据流

```
异兽档案 (bodyParts.scale)
    ↓
Scale-Aware Shot Designer (解析尺度 → 生成分类 → 生成策略)
    ↓
导演管线 Stage8 (运镜控制)
    ↓
Shot Prompt (注入尺度描述)
    ↓
Seedance 渲染 (生成带真实比例感的画面)
```

## 尺度分类体系

| 分类 | 高度范围 | 相对于人物 | 代表异兽 | 镜头策略 |
|------|---------|-----------|---------|---------|
| **微型** | < 2米 | 1-1.5x | 孟槐(1.5m)、天狗(0.6m) | 强调互动，近景多 |
| **中型** | 2-10米 | 2-7x | 英招(3m)、陆吾(3m) | 展示比例差异 |
| **大型** | 10-50米 | 7-35x | 饕餮(20m)、穷奇(15m) | 强调压迫感 |
| **巨型** | 50-100米 | 35-75x | 烛龙(100m+) | 如山岳般的体量 |
| **超巨型** | 100-1000米 | 100-750x | 凤凰(数百米) | 天地般的存在 |
| **神话级** | > 1000米 | 750x+ | 鲲鹏(千里) | 只能展示局部 |

## 景别差异化策略

### 微型异兽（<2米）

| 景别 | 画面内容 | 人物关系 |
|------|---------|---------|
| **远景** | 人物+异兽同框全身 | 并肩站立，比例相近 |
| **中景** | 异兽半身+人物手部互动 | 可以抚摸、抱起 |
| **近景** | 人物面部特写 | 异兽在肩头/怀中 |

**运镜特色**：低角度仰拍让异兽显得可爱，平视互动镜头，手持跟随

### 中型异兽（2-10米）

| 景别 | 画面内容 | 人物关系 |
|------|---------|---------|
| **远景** | 异兽全身+人物在旁边 | 人物作为比例参考 |
| **中景** | 异兽躯干（占画面2/3） | 人物入镜显示比例 |
| **近景** | 人物面部 | 背景中异兽模糊身影 |

**运镜特色**：低角度仰拍强调高度差，水平推移展示并肩行走

### 大型异兽（10-50米）

| 景别 | 画面内容 | 人物关系 |
|------|---------|---------|
| **远景** | 异兽全身巍峨耸立 | 人物在画面一角渺小 |
| **中景** | 异兽躯干局部填满画面 | 人物在边缘仰望 |
| **近景** | 人物面部特写 | 背景是异兽的皮毛/鳞片纹理 |

**运镜特色**：极低角度仰拍（worm view），从小G视角快速上摇，航拍全貌

### 巨型异兽（50-100米）

| 景别 | 画面内容 | 人物关系 |
|------|---------|---------|
| **远景** | 只能拍到腰部以上 | 人物在底部如蚂蚁 |
| **中景** | 一个器官（如眼睛/爪掌） | 人物站在器官下方 |
| **近景** | 人物仰望面部特写 | 瞳孔中倒映异兽身影 |

**运镜特色**：航拍展示全貌，超广角镜头边缘畸变，FPV穿越身躯缝隙

### 超巨型异兽（100-1000米）

| 景别 | 画面内容 | 人物关系 |
|------|---------|---------|
| **远景** | 航拍，身躯如山脉横亘 | 人物只是一个黑点 |
| **中景** | 鳞片/皮肤纹理的局部特写 | 纹理缝隙间人物如行于峡谷 |
| **近景** | 人物面部 | 表情是面对"天地"的震撼 |

**运镜特色**：卫星视角，延时摄影展示呼吸起伏，FPV从鳞片缝隙穿梭

### 神话级异兽（>1000米）

| 景别 | 画面内容 | 人物关系 |
|------|---------|---------|
| **远景** | 卫星/地图视角，绵延如大陆 | 人物完全不可见 |
| **中景** | 一个微小局部（如一根睫毛） | 人物在其上攀登 |
| **近景** | 人物面部特写 | 面对"天地本身"的敬畏 |

**运镜特色**：太空俯瞰，穿越云层，极端微宏观对比

## Prompt 注入示例

### 微型异兽（孟槐，1.5米）

```
【尺度】孟槐(1.5米，1.2倍于小G)，与小G身高相近，可以并肩同行。
远景：全身入镜，小G与异兽同框站立，比例相近，背景为开阔原野。
```

### 中型异兽（英招，3米）

```
【尺度】英招(3米，2.3倍于小G)，是小G的2倍高，需要仰望。
中景：异兽躯干特写占据画面2/3，小G入镜作为比例尺，展现2倍震撼差异。
```

### 大型异兽（饕餮，20米）

```
【尺度】饕餮(20米，15.4倍于小G)，是小G的15倍高，小G只到它的膝盖。
远景：异兽全身巍峨耸立，小G在画面一角显得渺小，仰视视角强调巨兽压迫感。
```

### 神话级异兽（鲲鹏，千里）

```
【尺度】鲲鹏(500000米，384615倍于小G)，绵延千里，小G如同微尘般渺小。
远景：卫星视角，异兽绵延如大地本身，小G如同微尘般渺小，仅通过环境比例暗示存在。
```

## 集成修改清单

### 1. beast-engine.js — PromptInjector 升级

在 `_buildPrompt` 方法中，加入尺度感知注入：

```javascript
// 🆕 v1.2-Peng: Scale-Aware 注入
const { generateScalePrompt, parseBeastScale } = require('./scale-aware-shot-designer.js');

_buildPrompt(archive, mode, shotType = 'medium') {
  // ... 现有代码 ...
  
  // 🆕 加入尺度描述
  const scaleText = archive.bodyParts?.scale || archive.cinema?.scale || '大型';
  const meters = parseBeastScale(scaleText);
  const scalePrompt = generateScalePrompt(meters, shotType);
  
  // ... 在 Prompt 中追加 scalePrompt ...
}
```

### 2. beast-integration.js — 传递 Scale 策略

在 `processStoryPlan` 中，为每个 shot 附加 scale 策略：

```javascript
// 🆕 v1.2-Peng: Scale-Aware 策略附加
const { generateShotScaleStrategy } = require('../../shanhaijing-beast-archive/scale-aware-shot-designer.js');

processStoryPlan(storyPlan) {
  // ... 现有代码 ...
  
  for (const shot of storyPlan.shots || []) {
    // 🆕 附加 scale 策略
    for (const beast of beasts) {
      const scaleStrategy = generateShotScaleStrategy(beast.id);
      if (scaleStrategy) {
        shot._scaleStrategy = scaleStrategy;
        shot._scalePrompt = scaleStrategy[shot.type + 'Prompt'] || scaleStrategy.mediumPrompt;
      }
    }
  }
}
```

### 3. director-pipeline.js — Stage8 应用 Scale 策略

在 `stage8_CinematographyControl` 中，注入 scale-aware 描述：

```javascript
// 🆕 v2.3-Peng: Scale-Aware 运镜注入
const { injectScaleAwareness } = require('../../shanhaijing-beast-archive/scale-aware-shot-designer.js');

stage8_CinematographyControl() {
  // ... 现有代码 ...
  
  for (const shot of shots) {
    // 检测异兽
    const beasts = detectBeasts(shot.description);
    if (beasts.length > 0) {
      // 🆕 注入尺度感知
      for (const beast of beasts) {
        shot.description = injectScaleAwareness(shot, beast.id, shot.type || 'medium');
      }
    }
    
    // ... 继续现有运镜处理 ...
  }
}
```

## 版本号规划

| 模块 | 当前版本 | 升级后版本 |
|------|---------|-----------|
| Scale-Aware Shot Designer | — | **v1.0-Peng** |
| Beast Engine | v1.0-Peng | **v1.2-Peng** |
| Beast Integration | v1.1-Peng | **v1.2-Peng** |
| Director Pipeline | v5.2-Peng | **v5.3-Peng** |
| 大系统版本 | v2.2-Peng | **v2.3-Peng** |

## 预期效果

### 渲染效果对比

**升级前（无尺度感知）**：
- 烛龙（千里级）和孟槐（1.5米）都用同样的镜头
- 远景中两者都是"全身"，无法体现真实大小差异
- 观众无法感知异兽的压迫感或可爱感

**升级后（有尺度感知）**：
- 烛龙：远景是"航拍山脉般的身躯"，中景是"一片鳞甲如山崖"
- 孟槐：远景是"小G和它并肩站立"，中景是"可以抚摸的互动"
- 每个异兽都有独特的视觉尺度体验

### 用户体验

- **视觉冲击**：巨型异兽的压迫感、微型异兽的亲近感都能准确传达
- **叙事支持**：异兽的大小本身就是叙事的一部分（如面对巨兽的恐惧 vs 与小兽的温情）
- **认知准确**：观众能直观理解"这只异兽有多大"

## 下一步工作

1. ✅ Scale-Aware Shot Designer 核心模块（已完成）
2. ✅ 修改 beast-engine.js PromptInjector（已完成）
3. ✅ 修改 director-pipeline.js Stage8 注入（已完成）
4. ✅ 测试验证：38/40只异兽解析成功（已完成）
5. ⏳ 修复凤凰、麒麟JSON文件（待执行）
6. ✅ 文档更新：RELEASE v2.3-Peng（已完成）

## 注意事项

1. **Prompt 长度控制**：尺度注入会增加 Prompt 长度，需要确保不超过 Seedance 上限
2. **多异兽同框**：当多个异兽同框时，需要以最大的异兽为准进行尺度设计
3. **人物安全**：巨型异兽的近景中，人物不能显得太危险（保持PG-13友好）
4. **性能影响**：解析和注入是轻量级操作，不会显著增加 Pipeline 耗时