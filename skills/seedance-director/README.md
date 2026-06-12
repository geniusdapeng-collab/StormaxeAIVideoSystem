# Seedance Video Production System v2.6.3-Peng

> CinePrompt V2 — 信息流转缩水修复版 | 5轮压力测试验证

## 架构图

```
用户输入 (title/outline/video-type/style/characters)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Phase 0: 角色定妆照 (Seedream，需ARK_API_KEY)       │
├─────────────────────────────────────────────────────┤
│  Phase 1: 故事规划 (story-engine)                    │
│    ↳ [闸机] AlignmentGate check('story-plan', ≥30)  │
│  Phase 1.2: 钩子注入 (hook-factory + spectacle)      │
├─────────────────────────────────────────────────────┤
│  Phase 2: 角色锚定 (character-manager)               │
│  Phase 2.5: 台词对白 (dialogue-engine + edge-tts)    │
├─────────────────────────────────────────────────────┤
│  Phase 3: 镜头提示词 (shot-design + 锚定注入)         │
│    ↳ [v2.6.3] 需求契约强制注入场景名+核心词           │
│    ↳ [Eye-Story] 眼神特写自动检测与标记               │
│    ↳ [面部稳定性] 人类角色强制注入 catchlight+no distortion │
│  Phase 3.5: 微动作增强 (micromotion)                  │
│  Phase 3.7: 比稿评估 (bid-eval + Prompt Quality)     │
│    ↳ [v2.6.1] winner plan 重新生成 prompts           │
├─────────────────────────────────────────────────────┤
│  Phase 4: 批量渲染 (seedance-wrapper + 回调服务器)    │
│    ↳ [闸机] AlignmentGate check('pre-render', ≥40)  │
│    ↳ [v2.6.1] 评分<40 阻断 + --force-continue 兜底   │
│    ↳ [v2.6.3] 闸机评分 57→90 (+33分)                 │
│    ↳ [Token] prompt-token-estimator 超限检查         │
├─────────────────────────────────────────────────────┤
│  Phase 5.5: 声音设计 (sound-design)                  │
│  Phase 6: 后期合成 (post-production: 拼接+调色+字幕+混音) │
├─────────────────────────────────────────────────────┤
│  Phase 7: 汇总交付 + 飞书通知                         │
└─────────────────────────────────────────────────────┘
    │
    ▼
成片输出 (mp4 + 静音版 + 分轨素材包 + 报告)
```

## 四大模块归属

| 模块 | 包含子模块 | 说明 |
|------|-----------|------|
| **a. 方案制作** | story-engine + shot-design + character-manager + narrative-bridge + hook-factory + spectacle + choreography | 故事规划→角色锚定→分镜设计→舞蹈编排 |
| **b. 比稿** | bid-eval + requirement-alignment-gate + prompt-quality | 创意方案评估+需求对齐闸机+提示词质量评估 |
| **c. 渲染** | byted-ark-seedance-skill + micromotion（横跨a→c）+ seedance-render-engine | API调用+微动作+Prompt token估算 |
| **d. 后期合成** | post-production + sound-design + dialogue-engine | 音画合成+声音设计+对白TTS |

## 5种视频类型

| 类型 | 光影风格 | 典型时长 |
|------|---------|---------|
| action | dramatic rim light, warm golden backlight | 60-180s |
| drama | soft golden hour lighting, gentle shadows | 60-180s |
| educational | bright even lighting, clean background | 30-120s |
| commercial | studio lighting, product highlight | 15-60s |
| documentary | natural lighting, available light | 60-300s |

## 快速开始

```bash
node director.js produce \
  --title "短片名" \
  --video-type educational \
  --duration 60 \
  --style "写实风格，自然光" \
  --characters "角色1:物种,角色2:物种" \
  --output-dir ./output
```

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| --title | ✅ | 视频标题 |
| --video-type | 否 | action/drama/educational/commercial/documentary，默认autoDetect |
| --duration | 否 | 总时长（秒），默认60 |
| --style | 否 | 风格描述，默认按类型自动匹配 |
| --characters | 否 | 角色定义，格式：名称:物种:特征:道具 |
| --outline | 否 | 故事大纲 |
| --output-dir | ✅ | 输出目录 |
| --skip-render | 否 | 跳过渲染（测试用） |
| --force-continue | 否 | 闸机评分不足时强制继续渲染 |
| --bid-count | 否 | 比稿方案数（默认1=无比稿） |

## 配置文件

`config/system.json` — 集中管理模型优先级、错误码、提示词限制、并发数等

优先级：环境变量 > 配置文件 > 内置默认值

## 模块清单

| 模块 | 版本 | 路径 | 脚本数 |
|------|------|------|--------|
| seedance-director | **v2.6.3-Peng** | seedance-director/ | 9 + config |
| seedance-story-engine | v2.6.1-Peng | seedance-story-engine/ | 4 |
| seedance-character-manager | v2.2.0-Peng | seedance-character-manager/ | 1 |
| seedance-dialogue-engine | v2.1.0-Peng | seedance-dialogue-engine/ | 1 |
| seedance-post-production | v1.2.0-Peng | seedance-post-production/ | 1 |
| seedance-sound-design | v1.0.0 | seedance-sound-design/ | 2 |
| seedance-micromotion | v1.1.0 | seedance-micromotion/ | 7 |
| seedance-bid-eval | v1.1.0-Peng | seedance-bid-eval/ | 6 |
| seedance-choreography | v2.0.0-Peng | seedance-choreography/ | 1 |
| seedance-shot-design | v1.0.0 | seedance-shot-design/ | 0 (references only) |
| byted-ark-seedance-skill | v1.2.0 | byted-ark-seedance-skill/ | 2 |
| seedance-render-engine | v0.1.0 | seedance-render-engine/ | 1 |

## 🆕 v2.6.2 闸机精度优化（57→90分）

| 优化项 | 严重度 | 效果 |
|--------|--------|------|
| 关键词提取重写 | 🔴 P0 | 废弃滑动窗口，三策略提取+黑名单过滤，命中率38%→83% |
| 需求契约注入提示词 | 🔴 P0 | Phase3构建契约，强制注入场景名+核心词到environment，100%覆盖 |
| 情节匹配同义词容差 | 🟡 P1 | synonymMap映射表，"对决"≈"交锋"，匹配率67%→100% |
| 场景提取正则修复 | 🟡 P1 | 最小匹配+角色名过滤，"天宫"不再被污染为"郎神在天宫" |

### 闸机评分提升路径

```
v2.6.0: 21分（大量关键词丢失+无场景注入+无同义词容差）
    ↓ v2.6.1: +36分（5个流转断点修复+动作词保护+闸机阻断）
v2.6.1: 57分（关键词提取仍是滑动窗口+场景未注入）
    ↓ v2.6.2: +33分（关键词重写+契约注入+同义词容差+场景修复）
v2.6.2: 90分 ✅
```

## v2.6.1 数据流转修复（5个断点）

| 断点 | 严重度 | 修复内容 |
|------|--------|---------|
| P0：比稿winner prompts未重新生成 | 🔴 | winner plan选出后重新调用phase3ShotDesign |
| P1：BidEval评估维度缺失 | 🟡 | 新增promptQuality维度(15%)+prompt-quality.js |
| P2：配角轮询频率过低 | 🟡 | 按幕结构智能分配：起独角→承双角→转全员→合收尾 |
| P3：压缩误伤动作词 | 🟡 | 删除3条有害压缩规则 |
| P4：闸机不阻断流程 | 🔵 | 评分<40默认阻断+--force-continue |

## 世界奔放舞蹈音乐库（v2.6.0）

15种世界舞蹈：迪斯科/弗拉门戈/桑巴/萨尔萨/宝莱坞/非洲鼓舞/毛利战舞/爱尔兰踢踏/哥萨克/摇摆舞/探戈/肚皮舞/康康舞/舞厅/塔兰泰拉

## 依赖

- Node.js >= 18
- ffmpeg（后期合成必需）
- edge-tts（对白TTS，pip install edge-tts）
- 火山引擎账号 + Seedance API 配额
