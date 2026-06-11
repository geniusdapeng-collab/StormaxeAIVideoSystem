# Shanhaijing Director v2.3-Peng 发布说明

**发布日期**: 2026-05-21  
**版本号**: v2.3-Peng  
**状态**: 生产就绪 ✅

---

## 核心修复

### 1. 完整Director Pipeline（新增）
**文件**: `skills/shanhaijing-director/scripts/director-pipeline.js`

**10步完整流程（不可跳过）**:
1. **PRD生成** — 基于用户输入生成产品需求文档，保存到 `00-prd/prd.md`
2. **需求对齐闸机** — 提取需求契约，多阶段对齐检查（≥60分通过）
3. **Schema校验器** — 校验story-plan.json结构（story-plan.schema.json）
4. **故事板校验器** — 校验叙事逻辑、情绪弧线、镜头连贯性
5. **角色提示词构建器** — 检查定妆照完整性，报告缺失
6. **合规检查器** — Prompt长度/内容/安全性检查（≤490字符）
7. **时长分配Agent** — 校验总时长偏差（≤5%通过）
8. **运镜控制系统** — 注入cinematography.js专业运镜词
9. **渲染引擎** — 调用seedance-render-engine.js
10. **后期制作** — 调用post-production.js

**硬性规则**:
- 任何一步失败 → Pipeline停止，返回错误报告
- 不可跳过任何步骤（包括mock模式）
- 所有中间产物保存到生产目录对应子目录
- 最终报告保存到 `99-reports/pipeline-report-{timestamp}.json`

### 2. 尾帧衔接修复
**文件**: `skills/seedance-render-engine/scripts/seedance-render-engine.js`

**根因**: 尾帧被unshift到refs列表开头，变成第1张图。Seedance API把第1张图当成first_frame（动作锁定），定妆照变成第2张图被当成last_frame。更严重的是，≥3张图时所有图都变成reference_image（风格参考，不锁动作）。

**修复**:
- 控制注入数量：有尾帧时最多再注入1张定妆照，否则最多2张
- 确保总图数 ≤2，触发API的first_frame + last_frame机制
- 第1张：定妆照 → first_frame（锁定角色外貌）
- 第2张：上一镜头尾帧 → last_frame（锁定结束姿态）

### 3. 好莱坞级运镜词库（新增）
**文件**: `skills/seedance-render-engine/scripts/cinematography.js`

**内容**: 50+英文专业运镜词，中文简写 → 英文电影级描述
- `大全景` → `extreme wide shot, epic landscape`
- `急速跟拍` → `tracking shot following subject at breakneck speed, ground-level rushing, motion blur trails`
- `甩镜` → `whip pan rapid camera swing, kinetic energy burst`
- `航拍` → `drone shot sweeping over epic landscape at 100km/h`

**集成**: `generateShotPrompt()`使用`getCinematicMove()`替换中文运镜词

### 4. 承接叙事（新增）
**位置**: `cinematography.js`中的`generateContinuityNarrative()`

**功能**: 第2+镜头自动添加简洁承接前缀
- `"延续上一步动作，..."`
- `"动作无缝衔接，..."`
- `"承接上一镜头，..."`
- `"连贯叙事，..."`

### 5. TTS配置（更新）
**文件**: `skills/seedance-director/scripts/config-center.js`

**新增**: `postProduction.tts.enabled: false`（山海经系列默认禁用TTS）

**原因**: 山海经系列保留Seedance原始生成的音效（环境音、动作音效等）

---

## Mock测试结果

### Round 1 — Schema错误
- **状态**: ❌ 失败
- **问题**: shot-prompt schema被错误用于校验story-plan中的shot
- **修复**: 移除单独的shot-prompt校验，story-plan的shot结构由story-plan.schema.json的$defs/shot定义

### Round 2 — 基础功能测试
- **状态**: ✅ 通过
- **数据**: 2 shots，12秒
- **结果**: 所有10步流程完成，PRD/闸机/Schema/故事板/角色/合规/时长/运镜/渲染/后期

### Round 3 — 完整数据测试
- **状态**: ✅ 通过
- **数据**: 9 shots，59秒（夸父逐日完整数据）
- **结果**: 所有10步流程完成，时长偏差0%，运镜控制9 shots

---

## 文件清单

### 新增文件
- `skills/shanhaijing-director/scripts/director-pipeline.js` — 完整Pipeline入口
- `skills/seedance-render-engine/scripts/cinematography.js` — 好莱坞运镜词库

### 修改文件
- `skills/seedance-render-engine/scripts/seedance-render-engine.js` — 尾帧数量控制+运镜词注入
- `skills/shanhaijing-render-engine/scripts/seedance-render-engine.js` — 承接叙事+运镜词注入
- `skills/seedance-director/scripts/config-center.js` — TTS默认禁用配置
- `skills/seedance-post-production/scripts/post-production.js` — TTS状态检测

---

## 使用方式

### Mock测试模式（推荐先用）
```bash
node director-pipeline.js mock --production-dir /path/to/production
```

### 生产模式
```bash
node director-pipeline.js run --production-dir /path/to/production
```

### 必需输入
生产目录必须包含：
- `01-story/story-plan.json` — 故事规划（符合story-plan.schema.json）
- `02-characters/` — 角色定妆照（可选，但强烈建议）

---

## 已知问题

1. **镜头ID连续性检查**: 当前segment.shots格式下，ID是S01-01, S02-01而非S01, S02。不影响实际渲染，但故事板校验会报告。后续版本优化。

2. **角色定妆照检查简化**: 当前仅检查目录存在性，未精确匹配每个角色的定妆照文件。后续版本接入CharacterArchive系统。

3. **合规检查质量分**: 平均0.74-0.78，有提升空间。后续版本优化Prompt生成策略。

---

## 版本历史

- v2.3-Peng (2026-05-21): 完整Pipeline + 尾帧衔接修复 + 运镜词升级
- v2.2-Peng (之前): 极限密度超快模式 + 1.8秒镜头 + 信息密度3.0×
- v2.1-Peng (之前): 小G活力改造 + 孩童活泼性格 + 急速跟随运镜
- v2.0-Peng (之前): 调研融合 + 五正色/水墨光照/种族纹理

---

*生成时间: 2026-05-21 13:20*  
*Pipeline版本: v2.3-Peng*