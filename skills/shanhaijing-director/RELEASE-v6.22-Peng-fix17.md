# RELEASE v6.22-Peng-fix17 — 字段格式统一 + 语言全英文 + 片头系统修复

**日期**: 2026-06-08
**类型**: 系统级规范统一（全链路）
**验证场景**: 白泽预生产

---

## 🔥 核心变更总览

| 类别 | 变更 | 影响范围 |
|------|------|----------|
| 字段格式 | 全部统一为【字段名】格式 | 全链路 10 个字段 |
| 语言统一 | 非 Dialogue 内容全部英文，Dialogue 保留中文 | 全链路 |
| S00 片头 | 从 opening-title-design.json 重建，清理 LLM 污染 | 片头系统 |
| null 清理 | beastEntrance/xiaoGEntrance 中的 null → 白泽/beast | 片头系统 |
| LLM 污染清洗 | 移除 [TITLE DISPLAY]、EPIC SCALE、GRAND VISTA 等残留 | 片头系统 |

---

## 1. 字段格式统一为【字段名】格式

**变更前**：部分字段名不统一，格式混杂
**变更后**：全部 10 个字段使用【】包裹，字段名全英文

### 10 个标准字段

```
【CharacterRef】【Dialogue】【Timeline】【Camera】【Lighting】【Character】【Scene】【Mood】【EnvironmentStyle】【DirectorStyle】
```

### 额外扩展字段（S00 专用）

```
【AudioLayer】【TitleEffect】【SubtitleEffect】【BeastEntrance】【XiaoGEntrance】
```

### 格式要求

- 字段名：**英文**，【】包裹
- 内容：**非 Dialogue 全部英文**，Dialogue 保留中文
- 字段顺序：Scene → Timeline → 其他字段 → Dialogue/CharacterRef
- 每个字段**不重复**，Pipeline 写入前先清洗旧内容

---

## 2. S00 片头系统修复

### 问题根因

Stage 8.1 生成片头后，Stage 8.2 将 S00 当普通镜头重新生成，导致：
- LLM 污染残留：`[TITLE DISPLAY]`、`EPIC SCALE`、`GRAND VISTA`、`full-screen presence`
- 未走标准片头系统（`_insertOpeningTitleShot`）
- `beastEntrance` 和 `xiaoGEntrance` 中的 `null` 未替换

### 修复方案

从 `opening-title-design.json` 的 `titleShot._titleConfig` 字段重建 S00 prompt，包含：

1. **场景描述**：Nirath 断裂山脉绝壁的地质纹理（英文）
2. **时间轴**：`【Timeline】 8 seconds`
3. **镜头效果**：白泽出场 3 个 phase（轮廓浮现→细节清晰→完全展现 70%）
4. **小G入镜**：4 个 phase（远处张望→好奇走近→面对神兽→伸手触碰）
5. **定妆照绑定**：白泽 5 张 + 小G 5 张全部写入【CharacterRef】
6. **AudioLayer**：Nirath Guide 开场白（0s 先声夺人）

### S00 字段清单

| 字段 | 内容 |
|------|------|
| Scene | Nirath fractured mountain cliff, geological textures (英文) |
| 【Timeline】 | 8 seconds |
| 【Mood】 | epic, mysterious, awe-inspiring, geological timescale grandeur |
| 【Camera】 | wide-angle low-angle sweep, human→cliff scale contrast |
| 【Lighting】 | dual-sunset purple-gold, bioluminescent cyan-green |
| 【Style】 | hyperrealistic geological wonder, natural coincidence aesthetic |
| 【Avoid】 | artificial text overlay, static typography, smooth plastic |
| 【AudioLayer】 | Nirath Guide Opening, 0s voice-first |
| 【TitleEffect】 | Mountain Texture — Light Vein Illumination (4 phases) |
| 【SubtitleEffect】 | Lichen Growth (3 phases) |
| 【BeastEntrance】 | 白泽 emerges from darkness (3 phases) |
| 【XiaoGEntrance】 | xiaoG attracted by phenomenon (4 phases) |
| 【CharacterRef】 | 白泽 5张 + 小G 5张 |

---

## 3. null 清理

| 位置 | 修复前 | 修复后 |
|------|--------|--------|
| beastEntrance phases | `null的轮廓...` | `白泽的轮廓...` |
| xiaoGEntrance phases | `被null的某种现象...` | `被beast的某种现象...` |

---

## 4. LLM 污染清洗清单

| 污染标记 | 含义 | 状态 |
|----------|------|------|
| `[TITLE DISPLAY]` | LLM 模板残留 | ✅ 已清除 |
| `EPIC SCALE opening:` | LLM 夸张描述 | ✅ 已清除 |
| `GRAND VISTA` | LLM 模板残留 | ✅ 已清除 |
| `full-screen presence` | LLM 夸张描述 | ✅ 已清除 |
| `null` | 未替换占位符 | ✅ 已清除 |
| `{{...}}` | 模板变量残留 | ✅ 已清除 |
| `sky carved into thin strips` | 描述矛盾（S02 洞穴内无天空） | ✅ 已修正 |

---

## 5. S01-S06 字段验证

| 镜头 | Timeline=1 | CharacterRef | Dialogue | 全英文字段 |
|------|-----------|-------------|----------|-----------|
| S01 | ✅ | ✅ 白泽 | ✅ | ✅ |
| S02 | ✅ | ✅ 空镜 | ✅ | ✅ |
| S03 | ✅ | ✅ 空镜 | ✅ 空镜无对白 | ✅ |
| S04 | ✅ | ✅ 小G | ✅ | ✅ |
| S05 | ✅ | ✅ 空镜 | ✅ | ✅ |
| S06 | ✅ | ✅ 空镜 | ✅ | ✅ |

---

## 6. 白泽预生产最终状态

**生产目录**: `productions/白泽预生产-20260607010109-baize/pre-production/04-prompts/`

**最终文件**:
- `prompt-S00.txt` — 3327 字，片头系统重建
- `prompt-S01.txt` — 1342 字，英文 + 白泽定妆照
- `prompt-S02.txt` — 966 字，英文 + 空镜
- `prompt-S03.txt` — 628 字，英文 + 空镜
- `prompt-S04.txt` — 1435 字，英文 + 小G定妆照
- `prompt-S05.txt` — 867 字，英文 + 空镜
- `prompt-S06.txt` — 1092 字，英文 + 空镜

**总字数**: 9657 字

---

## 7. 发布清单

- [x] 字段格式统一【字段名】英文
- [x] 非 Dialogue 内容英文
- [x] S00 片头从 opening-title-design.json 重建
- [x] null → 白泽/beast 清理
- [x] LLM 污染清洗
- [x] S01-S06 字段验证通过
- [x] 发布文档固化

---

## 📌 版本继承关系

```
v6.21-Peng-fix16 (2026-06-07)
  ↓ 字段格式+语言统一+片头修复
v6.22-Peng-fix17 (2026-06-08)
```

**关联文件**:
- `opening-title-design.json`（片头系统设计）
- `prompt-field-standard.js`（字段标准化）
- `director-pipeline.js`（Pipeline 主链路）
