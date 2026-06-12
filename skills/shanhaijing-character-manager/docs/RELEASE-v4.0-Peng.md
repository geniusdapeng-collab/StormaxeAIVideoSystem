# 🎬 ShanhaiStory Forge 视频生产系统 v4.0-Peng 发布说明

**发布日期:** 2026-05-22
**版本号:** v4.0-Peng
**状态:** 🟢 生产就绪

---

## 🚀 核心亮点

### 1. 🌍 全局定妆照系统 (Global Character References)
**解决问题:** 不同项目中角色形象不一致，每个项目重复生成定妆照

**解决方案:**
- 全局统一目录: `productions/global-character-references/xiaoG/`
- 包含6张核心定妆照: 正面全身/侧面全身/背面全身/45度半身/面部特写/动作奔跑
- 所有新项目自动调用全局定妆照，无需重复生成
- 项目级定妆照作为回退机制保留

**技术实现:**
- 渲染引擎优先检测全局目录 → 项目目录 → 角色目录 三级回退
- 导演管线角色生成阶段自动指向全局目录
- 旧版定妆照全部清理，避免冲突

---

### 2. 🐉 异兽专用生成模式 (Beast-Only Mode)
**解决问题:** 异兽定妆照中出现小G/人类角色，异兽+科技元素混搭

**双铁律:**
1. **纯粹异兽本体** — 画面中只有异兽本身，绝对无人类角色
2. **零科技元素** — 禁止机械、电子、科幻、现代元素

**自动检测机制:**
- 关键词匹配: 兽/龙/鸟/蛇/狐/凤/麒麟/饕餮/帝江/烛龙...
- 自动切换人类/异兽双分支prompt生成

**15项负面约束自动注入:**
```
NO human characters, NO child, NO boy, NO girl, NO person,
NO human face, NO xiaoG, NO technology, NO sci-fi,
NO modern elements, NO mechanical parts, NO robots,
NO cyberpunk, NO metal armor, NO electronic devices,
NO glowing artificial lights, NO plastic, NO synthetic materials
```

**山海经 + Nirath 融合策略:**
- 每只异兽强制包含山海经原文引用
- Nirath生态融合: 生物发光 + 双恒星光照 + 原始野性
- 十大场景作为自然环境背景

---

### 3. 🎨 白泽测试验证 (BaiZe Validation)
**测试对象:** 白泽 — 《山海经》瑞兽神兽

**测试结果:**
- ✅ 自动识别为异兽角色（关键词"神兽"匹配）
- ✅ 异兽专用prompt分支正常生效
- ✅ 山海经原文注入: 「有兽焉，其状如虎而牛尾...能言语」
- ✅ 全部8张定妆照生成成功（正面/侧面/背面/45度/面部/奔跑/坐姿/肢体）
- ✅ 零人类/零科技元素验证通过

---

## 📦 子系统版本号

| 子系统 | 旧版本 | 新版本 | 更新内容 |
|--------|--------|--------|---------|
| Director Pipeline | v3.0-Peng | **v4.0-Peng** | 全局定妆照 + 异兽模式 |
| Render Engine | v9.6.1-Peng | **v9.7.0-Peng** | 全局目录优先检测 + 安全网强化 |
| Orient Primordial Core | v3.0-Peng | **v4.0-Peng** | 异兽表情去科技化 + 纯粹神话描述 |
| Seedream Wrapper | — | **v4.0-Peng** | 异兽双分支prompt + 自动检测 |
| Character Archive | — | **v4.0-Peng** | 全局引用 + 异兽规则配置 |

---

## 🗂️ 新增/更新文件清单

### 新增文件
- `skills/shanhaijing-character-manager/docs/beast-generation-spec-v4.0-Peng.md`
  - 异兽生成系统完整规范文档

### 更新文件
1. `skills/seedance-director/scripts/seedream-wrapper.js`
   - v4.0-Peng: 异兽检测 + 双分支prompt
2. `skills/shanhaijing-director/scripts/director-pipeline.js`
   - v4.0-Peng: 全局定妆照 + 异兽模式集成
3. `skills/seedance-render-engine/scripts/seedance-render-engine.js`
   - v9.7.0-Peng: 全局目录优先检测
4. `skills/shanhaijing-render-engine/orient-primordial-core.js`
   - v4.0-Peng: 异兽表情去科技化
5. `skills/shanhaijing-character-manager/character-archive/character-archive.json`
   - 新增全局定妆照引用 + 异兽规则配置

### 全局定妆照目录
- `productions/global-character-references/xiaoG/` (6张PNG)

---

## 🎯 使用指南

### 人类角色（小G）
系统自动使用全局定妆照，无需额外操作

### 异兽角色（帝江/烛龙/白泽等）
1. 角色名称或物种包含异兽关键词
2. 系统自动启用异兽专用模式
3. 生成的定妆照: 纯异兽本体 + 零科技 + 山海经原文
4. 支持8角度: 正面/侧面/背面/45度/面部/奔跑/坐姿/肢体

---

## 🔒 安全与合规

- ✅ Seedance平台合规: 异兽为CG虚构生物，不涉及真人
- ✅ 小G定妆照已加免责声明: "CGI数字角色，非真实人物"
- ✅ 零依赖承诺: 所有系统保持零外部依赖

---

## 📋 已知问题

- 无

---

## 🔮 下一步计划

- [ ] 帝江/烛龙等异兽批量生成
- [ ] 科普视频系列（横纹肌溶解E01）
- [ ] 异世界原创系列开发

---

**发布者:** 小G (Kimi Claw)
**审核者:** 大鹏 👍
**发布时间:** 2026-05-22 13:51 UTC+8

🎉 **一万个赞的发布！**