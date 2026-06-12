# RELEASE v6.31-Peng — ShanhaiStory Director Pipeline
**发布日期**: 2026-06-10
**类型**: Bug Fix Release (热修)

---

## 修夏内容

### 🔧 fix1: repairAllShotPromptOutputs 时机修复
**问题**: 闸机检查循环先写盘并校验，repairAllShotPromptOutputs 在循环之后才执行（line ~4010），导致写盘时还未修复
**修复**: 将 repairAllShotPromptOutputs(allShots) 移至闸机检查循环之前（line ~3635）
**验证**: 16/16 镜头写盘后二次校验通过

### 🔧 fix2: 闸机P0注入判断格式兼容
**问题**: 闸机注入检查只识别 `| P0 Dialogue` 格式，不识别 repair 输出的 `【Dialogue】` 格式
**修复**: 
```javascript
const hasStandardFormat = /\|\\s*P0\\s+Dialogue.*TEXT/i.test(shot._generatedPrompt || "");
const hasRepairFormat = /[【\[]Dialogue[】\]].*SPEAKER.*TEXT/i.test(shot._generatedPrompt || "");
if (shot._p0Injected && (hasStandardFormat || hasRepairFormat)) { ... }
```
**验证**: S00 闸机自愈后不再截除 Character/Action/Scene 字段

### 🔧 fix3: 最终合规检查 Shot ID 转换
**问题**: 闸机检查使用转换后 shotId（"S01"），最终合规检查使用原始 shot.id（"1"），文件路径不匹配
**修复**: 在 _runComplianceCheck 最终检查循环中添加：
```javascript
const shotId = shot.id || shot.shotId || 'UNKNOWN';
const normalizedShotId = shotId.startsWith('S') ? shotId : `S${String(parseInt(shotId) || 0).padStart(2, '0')}`;
```
并替换 `prompt-${shot.id}.txt` → `prompt-${normalizedShotId}.txt`
**验证**: 最终合规检查读到的文件路径与闸机写出的路径一致

---

## 验证结果

白泽预生产测试（2026-06-10）:
- ✅ 16/16 镜头写盘后二次校验通过
- ✅ 16/16 镜头最终10字段合规检查通过
- ✅ S00: 3141 chars, EN words=419, 10字段完整
- ✅ Normal shots: 759-1478 chars/个，全部10字段完整
- Pipeline exit code: 0

---

## 技术细节

| 修复项 | 文件 | 行号 |
|--------|------|------|
| repairAllShotPromptOutputs 迁移 | director-pipeline.js | ~3635 |
| P0格式双重检测 | director-pipeline.js | ~3795-3815 |
| shotId 转换逻辑 | director-pipeline.js | ~2126-2128 |
| 文件名 normalizedShotId | director-pipeline.js | ~2183 |
