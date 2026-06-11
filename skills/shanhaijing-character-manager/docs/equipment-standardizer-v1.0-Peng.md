# 角色装备一致性约束系统 v1.0-Peng

**系统定位**：将武器/装备从"描述性文字"升级为"标准化规格"，确保所有携带装备的角色跨图100%一致。

**设计哲学**：刑天的教训 → 机制级改进 → 所有新角色自动生效

---

## 核心问题

**刑天案例暴露的系统性漏洞**：
1. 武器描述是模糊自然语言（"半月形宽刃"），AI可能理解为双刃或单刃
2. 没有装备注册机制，每个角色武器约束散落在Prompt中
3. 没有握持方向锁定，左右手可能互换
4. 没有跨图一致性自动核查机制

**根因**：装备管理 = 0，完全依赖Prompt中的自然语言描述

---

## 系统架构

### 1. 装备标准库（Equipment Standards Library）

```javascript
EQUIPMENT_STANDARDS = {
  'rectangular-shield': {
    type: 'shield',
    name: '长方形四角盾',
    shape: '竖直长方形平板状',
    dimensions: '宽约肩宽，高约从胸至膝',
    edges: '四边平直，四个直角，底部无尖角',
    material: '暗金晶化金属质地',
    grip: '左手持',
    holdConsistency: '左手始终握盾'
  },
  'single-bitted-axe': {
    type: 'axe', 
    name: '单刃战斧',
    blade: '头部一侧有弯曲锋利的半月形刃口',
    back: '另一侧为平直钝背，顶部有小锤头结构',
    handle: '短粗柄，约半臂长',
    grip: '右手持',
    holdConsistency: '右手始终持斧，斧刃朝向一致'
  }
  // ... 可扩展：剑、法杖、宝珠、弓等
}
```

**关键设计**：
- 每个装备有**精确的形态定义**（不是模糊描述）
- `blade` vs `back` 明确区分单刃/双刃
- `edges` 明确边缘形状（直角 vs 尖角）
- `grip` + `holdConsistency` 锁定握持方向

### 2. 角色装备注册表（Character Equipment Registry）

```json
{
  "xingtian": {
    "characterId": "xingtian",
    "equipment": [
      { "standardId": "rectangular-shield", "grip": "左手持" },
      { "standardId": "single-bitted-axe", "grip": "右手握" }
    ],
    "registeredAt": "2026-05-25T07:42:00Z"
  }
}
```

**注册时机**：
- 角色创建时（生成定妆照前）自动注册
- 支持后续追加装备
- 持久化到JSON文件

### 3. Prompt自动注入机制

```javascript
// 生成时自动调用
const equipmentPrompt = generateEquipmentPrompt('xingtian');
// 输出：左手持长方形四角盾...；右手握单刃战斧...；WEAPON CONSISTENCY LOCK...

// 注入到每个镜头的Prompt中
shot.prompt += equipmentPrompt;
```

**注入内容**：
1. 装备精确描述（从标准库生成）
2. WEAPON CONSISTENCY LOCK（跨图一致性约束）
3. 握持方向锁定（左手/右手不可互换）
4. 材质纹理统一（所有视图100%匹配）

### 4. 生成后核查（Post-Generation Verification）

```javascript
verifyEquipmentConsistency(generatedFiles, 'xingtian');
// 返回：{ pass: true/false, issues: [...] }
```

**当前实现**：Prompt约束为主 + 人工核查
**未来扩展**：集成图像识别API自动检查装备形状

---

## 使用流程

### 新角色携带装备时的标准流程：

```javascript
// Step 1: 注册装备（生成前）
registerCharacterEquipment('new-character', [
  { standardId: 'rectangular-shield', customizations: { grip: '左手持' } },
  { standardId: 'single-bitted-axe', customizations: { grip: '右手握' } }
]);

// Step 2: 生成定妆照（自动注入装备约束）
generateCharacterReference({
  name: 'new-character',
  // ... 其他参数
});
// 系统会自动调用 generateEquipmentPrompt() 注入约束

// Step 3: 核查（生成后）
verifyEquipmentConsistency(files, 'new-character');
```

---

## 可用装备标准清单

| 标准ID | 类型 | 名称 | 适用场景 |
|--------|------|------|----------|
| rectangular-shield | 盾 | 长方形四角盾 | 刑天、重甲战士 |
| tower-shield | 盾 | 塔盾 | 骑士、防御型角色 |
| round-shield | 盾 | 圆盾 | 轻装战士 |
| single-bitted-axe | 斧 | 单刃战斧 | 刑天、野蛮人 |
| double-bitted-axe | 斧 | 双刃战斧 | 狂战士 |
| straight-sword | 剑 | 直剑 | 剑客、骑士 |
| broadsword | 剑 | 阔剑 | 重装战士 |
| staff | 法器 | 法杖 | 法师、祭司 |
| orb | 法器 | 宝珠 | 术士、精灵 |

**扩展方式**：在 `EQUIPMENT_STANDARDS` 中新增定义即可

---

## 版本信息

- **系统版本**: v1.0-Peng
- **发布日期**: 2026-05-25
- **触发案例**: 刑天武器不一致（单刃/双刃混淆）
- **设计原则**: 单点修复 → 机制级改进
- **文件位置**: `skills/shanhaijing-character-manager/scripts/equipment-standardizer.js`
- **注册表位置**: `skills/shanhaijing-character-manager/character-archive/equipment-registry.json`

---

## 与现有系统集成

| 模块 | 集成方式 |
|------|----------|
| seedream-wrapper.js | require装备标准器，生成时自动注入 |
| character-archive.json | 增加 `equipment` 字段 |
| director-pipeline.js | 角色创建时自动注册装备 |
| character-manager.js | 注册/查询/核查API封装 |

---

## 验证方法

1. **Prompt检查**: 查看生成的Prompt中是否包含 `WEAPON CONSISTENCY LOCK`
2. **跨图对比**: 检查不同角度的定妆照中装备形状是否一致
3. **材质对比**: 检查装备材质纹理是否跨图统一
4. **握持方向**: 确认左右手没有互换

---

*制作人: 小G | 审核: 大鹏 | 版本: v1.0-Peng*
*"单点修复必须提升为机制级改进" — P0级系统级优化原则*