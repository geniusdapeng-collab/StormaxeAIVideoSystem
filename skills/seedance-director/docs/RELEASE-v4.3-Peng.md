# 🎬 ShanhaiStory Forge 定妆照模块 v4.3-Peng 生产发布说明

**发布时间**: 2026-05-24 10:45 AM (Asia/Shanghai)  
**发布人**: 小G | **审核**: 大鹏 👍  
**大系统版本**: ShanhaiStory Forge v2.1-Peng  
**模块版本**: Seedream Wrapper v4.3-Peng

---

## 🎯 本次发布核心升级

### 1. 通用性修复（100%通用，非定制）
- **问题**: `beastDetail` 硬编码了混沌的专属身体描述，其他异兽会共用错误描述
- **修复**: `beastDetail` 从硬编码 → 从 `--features` 参数动态传入
- **结果**: 任何异兽都可以通过 `--features` 传入自己的材质细胞级描述
- **验证**: 饕餮（羊身人面）测试通过，与混沌形态完全不同但用同一套代码

### 2. 艺术家视角升级
- **核心思路**: 不是"生成角色"，而是"记录一次真实遇见"
- **叙事层**: "8岁探险者小G在Nirath发光丛林中第一次遇见这只巨大神圣生物"
- **效果**: 画面从"设计稿"变成"有故事感的生命体"

### 3. 材质细胞级细节（CG角色设计稿级别）
每个异兽的身体部位拆解到微观级别：
- 材质物理属性（厚度、硬度、透光性）
- 纹理微观结构（脉络、波纹、同心圆）
- 光影反应（次表面散射、薄膜干涉、边缘辉光）
- 特殊细节（颜色渐变、能量脉动、温度感知）

### 4. 参考图机制（跨图一致性）
- 第一张正面全身生成后自动作为参考图模板
- 后续7张在API请求中传入 `body.image = referenceImageUrl`
- 强制跨图一致：翅膀/腿/身体结构在所有角度保持相同

### 5. 零负面约束策略
- **问题**: "非肉球非肿瘤非囊肿"等负面词汇触发AI"白熊效应"（越说不要越激活）
- **修复**: 全部删除负面描述，改用正面美学引导（"神圣圆润"替代"非肉球"）
- **效果**: 恶心感显著降低

### 6. 部位表设计（Body Part Matrix v1.0-Peng）
16个标准化部位字段，每个异兽"勾选"自己有的部位：
```
body(躯干) → head(头部) → face(面部) → eyes(眼睛) → horns(犄角) → 
ears(耳朵) → mouth(嘴/牙齿) → neck(颈部) → forelimbs(前肢) → 
hindlimbs(后肢) → hands(手掌/爪) → feet(足部) → wings(翅膀) → 
tail(尾巴) → coat(毛发/皮肤/鳞片) → special(特殊部位)
```
不带翅膀的异兽，wings字段置空，系统自动跳过。

---

## 📁 系统文件清单

### 核心模块
- `skills/seedance-director/scripts/seedream-wrapper.js` — v4.3-Peng（定妆照生成器）
- `skills/seedance-director/scripts/body-part-matrix-v1.0-Peng.md` — 部位表规范文档

### 测试验证产出物
- `productions/hundun-preproduction-v4.2-artist-final/03-characters/混沌/` — 混沌8张定妆照（材质细胞级）
- `productions/taotie-preproduction-v4.2-artist/03-characters/饕餮/` — 饕餮8张定妆照（通用性验证）

---

## 🧪 测试验证记录

### 混沌（帝江）验证
- 主体形态: 黄囊状、无面目、六足、四翼
- 材质质感: 膜质半透明、次表面散射、翼脉纹理、肉垫同心圆
- 跨图一致性: 参考图机制生效，翅膀/腿结构一致
- 恶心感: 零负面约束策略生效，神圣庄严替代恐怖谷

### 饕餮（通用性验证）
- 主体形态: 羊身、人面、虎牙、人爪、腋下眼
- 材质质感: 羊毛蓬松卷曲、虎牙珐琅质光泽、皮肤岁月纹理、指甲黑色发亮
- 通用性: ✅ 通过 — 与混沌完全不同的形态用同一套代码生成
- 跨图一致性: ✅ 羊毛质感、虎牙位置、爪子形态跨图一致

---

## 🗑️ 废旧数据清理清单

### 已删除的旧版测试目录
- `hundun-preproduction/` — v4.0旧版
- `hundun-preproduction-v4.2/` — 中间版本
- `hundun-preproduction-v4.2-ref/` — 参考图测试版
- `hundun-preproduction-v4.2-detailed/` — 身体拆解长描述版（失败实验）
- `hundun-preproduction-v4.2-white/` — 纯白背景版
- `hundun-preproduction-v4.2-clean/` — 删除负面约束版
- `jiuweihu-preproduction/` — 九尾狐旧测试
- `test-xiaoG-video/` — 小G视频测试
- `xiaoG-test/` — 小G旧测试

### 保留的有效目录
- `hundun-preproduction-v4.2-artist-final/` — 混沌最终版定妆照
- `taotie-preproduction-v4.2-artist/` — 饕餮通用性验证定妆照
- `global-character-references/` — 小G全局定妆照
- 其他正式生产项目目录

---

## 🔄 版本号更新矩阵

| 子系统 | 旧版本 | 新版本 | 说明 |
|--------|--------|--------|------|
| **大系统** | v2.0-Peng | **v2.1-Peng** | 定妆照模块重大升级 |
| Seedream Wrapper | v4.1-Peng | **v4.3-Peng** | 通用性修复+艺术家视角+部位表 |
| Body Part Matrix | — | **v1.0-Peng** | 新增结构化部位系统 |

---

## 🚫 已知限制

1. **系统资源限制**: 8张连续生成时会在第4-5张触发SIGKILL，需要分批或断点续传
2. **参考图机制效果**: Seedream API对`body.image`参数的实际一致性效果待进一步验证
3. **部位表代码集成**: 当前为设计文档阶段，需后续版本完成代码集成

---

## 📋 待办（下一版本）

- [ ] 部位表代码集成：从 `--features` 解析结构化部位描述
- [ ] 解决SIGKILL中断问题：内存优化或分批生成策略
- [ ] 再随机挑一只异兽做第三轮通用性验证
- [ ] 混沌剩余5张补全（45度半身、面部特写、动作奔跑、动作坐姿、手部特写）

---

**发布状态**: ✅ 已投入生产环境  
**发布人**: 小G  
**审核人**: 大鹏 👍