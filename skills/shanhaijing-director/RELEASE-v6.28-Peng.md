# 🎬 ShanhaiStory Forge — v6.28-Peng 发布记录

**发布日期**: 2026-06-09
**版本**: v6.28-Peng
**入口**: `skills/shanhaijing-director/scripts/director-pipeline.js`

## 调用方式

```bash
# 默认叙事模式（30-120s，7镜，故事弧线）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath

# 抖音快剪模式（15-30s，10镜，钩子先行）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath --platform douyin_short

# TikTok创作模式（30-60s，12镜，BGM卡点）
node director-pipeline.js pre-production --production-dir <目录> --worldview nirath --platform tiktok_creator
```

---

## 核心升级：肾上腺镜头库 + 抖音/TikTok快剪模式

本次版本新增两个独立系统，不影响现有叙事模式主链路。

---

## 新增文件

### 1. `adrenaline-shot-library.js`
**位置**: `skills/shanhaijing-cinematography/adrenaline-shot-library.js`
**核心概念**: 极限运动震撼镜头库 — 第一视角(POV) + 外部跟拍双系统

**支持运动类型**（6种）：
- `skiing` — 高山滑雪
- `wingsuit` — 翼装飞行
- `surfing` — 冲浪
- `parkour` — 跑酷
- `climbing` — 徒手攀岩
- `mountain_bike` — 速降山地车

**两层镜头结构**：

```
L1-ATOMIC — 运动原子镜头（不可分割）
  FVP（First Vision Perspective）
    - 极速POV / 恐惧POV / 等待POV / G力POV / 水溅POV / 狂风POV
  EFX（External Fixed Shot）
    - 极速侧跟 / 环绕捕捉 / 慢动作定格 / 超低角仰拍 / 高速甩镜 / 长焦压缩 / 水下仰拍 / 航拍大全景

L2-COMBO — 预制组合模板（每种运动4组 × 3镜 = 12镜/运动）
  buildup(3镜) → action(3镜) → peak(3镜) → release(3镜)
```

**导出函数**：
- `getFVPInject(sportType, phase)` — 获取POV英文注入文本
- `getEFXInject(sportType, phase)` — 获取外部视角英文注入文本
- `getRandomFullSequence(sportType)` — 随机抽取完整4阶段组合
- `getAvailableSports()` — 获取支持运动列表
- `getAtomicShot(layer, shotKey)` — 获取单原子镜头描述

---

### 2. `platform-preset.js`
**位置**: `skills/shanhaijing-director/scripts/platform-preset.js`
**核心理念**: 不同平台有不同叙事节奏，通过preset注入差异化配置

**预设类型**（3种）：

| 预设 | 时长 | 镜头数 | 单镜时长 | 节奏系数 | 字幕 | 钩子 |
|------|------|--------|----------|----------|------|------|
| `narrative` | 60s | 7 | 4-15s | 0.65 | 可选 | 建立式 |
| `douyin_short` | 20s | 10 | 1.5-3.5s | 0.35 | 必须 | 第0帧 |
| `tiktok_creator` | 45s | 12 | 2-5s | 0.45 | 必须 | 第0帧 |

**抖音/TikTok快剪独有Prompt字段**：
- `HOOK` — 片头黄金钩子（恐惧/速度/悬念/视觉/肾上腺素5型）
- `SUBTITLE_KEY` — 每镜字幕关键词（抖音算法依赖）
- `VERTICAL_COMPOSE` — 竖版9:16构图指引
- `BEAT_MARK` — BGM节拍卡点标记（仅TikTok）
- `CAMPO` — 摄像机位置（v1.1新增）

**钩子库**（25个英文钩子，5种类型）：
- fear型: "The wave is twice her height. She paddles anyway."
- speed型: "200 km/h. No helmet. No brakes."
- suspense型: "For 10 years, no one attempted this. Here's why."
- visual型: "The angle no camera has ever captured from this position."
- adrenaline型: "When you're falling at 200 km/h and time slows down."

---

## director-pipeline.js 改动

### CLI 新增 `--platform` 参数
```
--platform narrative       # 默认，叙事型中视频
--platform douyin_short    # 抖音快剪 15-30s
--platform tiktok_creator # TikTok创作 30-60s
```

### shot-quality-enhancer.js 新增两项增强

**肾上腺镜头注入**（`injectAdrenalineShot`）：
- 当 `shot._sportType` 设置时自动注入
- 自动根据镜头位置选择 `buildup/action/peak/release` 阶段
- 在 `Camera` 字段注入POV+EFX双视角描述

**抖音快剪前3秒杀手检查**（`enforceFirst3SecondsKiller`）：
- 前3个镜头禁止 `establishing/establish/transition/explanation` 类型
- 强制提升情绪张力 + 注入视觉钩子
- 仅在 `platform !== 'narrative'` 时生效

---

## shot-quality-enhancer.js v1.1-Peng 改动清单

| 函数 | 改动 |
|------|------|
| `injectAdrenalineShot()` | 新增，肾上腺镜头注入 |
| `enforceFirst3SecondsKiller()` | 新增，抖音前3秒强制冲击 |
| `enhanceShotQualityBundle()` | 循环内增加两项新检查 |

---

## 版本历史

| 版本 | 日期 | 核心变更 |
|------|------|---------|
| v6.28-Peng | 2026-06-09 | 肾上腺镜头库+抖音/TikTok快剪模式+平台预设系统 |
| v6.27-Peng | 2026-06-09 | 最终标准化闸门+内容质量增强+S00片头保护 |
| v6.26-Peng | 2026-06-09 | 提示词全英文+片头清理+字段优先级反转 |
| v6.25 | 2026-06-09 | PRD质量校验+StoryPlan fallback+dias iter修复 |
| v6.24-fix31 | 2026-06-08 | 对话标注+角色绑定修复 |
| v6.22-fix17 | 2026-06-08 | 字段格式统一+语言全英文+片头修复 |
