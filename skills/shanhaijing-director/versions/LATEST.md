# LATEST.md — ShanhaiStory Director Pipeline
**当前版本**: v6.31-Peng
**发布日期**: 2026-06-10
**入口文件**: scripts/director-pipeline.js

## 核心变更 (v6.31-Peng)

### 🔧 热修: 3个Bug修复

1. **fix1: repairAllShotPromptOutputs 时机修复**
   - 问题: 闸机检查先写盘，repair 在之后才执行，写盘时未修复
   - 修复: 移至闸机检查循环之前（line ~3635）

2. **fix2: 闸机P0注入判断格式兼容**
   - 问题: 闸机只识别 `| P0 Dialogue`，不识别 `【Dialogue】`
   - 修复: 双重格式检测

3. **fix3: 最终合规检查 Shot ID 转换**
   - 问题: 闸机写 "S01"，最终检查读 "1"，路径不匹配
   - 修复: 统一使用 normalizedShotId

### 🆕 好莱坞技能路由集成 (v6.31首发)
- cinematographer-skill-router.js 接入 Stage 8.1
- 149个镜头级技能自动匹配
- 复合情绪词解析: 史诗航拍_IMAX → emotion=史诗, shotType=航拍, tech=IMAX

## 验证结果
- ✅ 16/16 镜头写盘后二次校验通过
- ✅ 16/16 镜头最终10字段合规检查通过
- ✅ 白泽预生产测试通过

## 调用方式
```bash
node director-pipeline.js pre-production --production-dir <绝对路径> --worldview nirath
```
