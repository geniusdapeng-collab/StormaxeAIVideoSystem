# 火山引擎API调用成功配置 (v2.5-Peng)
# 记录时间: 2026-05-18
# 用途: 固化成功经验，避免下次重复踩坑

## 核心原则
1. **端点路径**: 必须使用 `/api/v3`，不是 `/api/plan/v3`
2. **API Key**: 使用 `ARK_API_KEY` 环境变量或 `--api-key` 参数
3. **Endpoint ID**: 使用自定义端点ID（不是模型ID）
4. **Model String**: 使用火山引擎内部模型字符串（如 `doubao-seedance-2-0-260128`）

## 成功调用配置

### API Key
```
ark-0e6994f7-bf34-4f3a-9e78-0fc02aa5fc92-42751
```

### Base URL
```
https://ark.cn-beijing.volces.com/api/v3
```

### Seedance 视频生成
```bash
# 方法1: 直接调用seedance.js
node skills/byted-ark-seedance-skill/scripts/seedance.js generate \
  --endpoint-id "ep-xxx" \
  --api-key "ark-xxx" \
  --prompt "your prompt here" \
  --return-last-frame true \
  --seed 1798000067

# 方法2: 通过统一客户端
node skills/seedance-unified-client/scripts/seedance-wrapper.js \
  --endpoint-id "ep-xxx" \
  --api-key "ark-xxx" \
  --prompt "your prompt"

# 方法3: 通过渲染引擎（推荐）
node skills/seedance-render-engine/scripts/seedance-render-engine.js render \
  --production-dir "/path/to/production" \
  --max-concurrent 2
```

### Seedream 图片生成
```bash
node skills/byted-ark-seedance-skill/scripts/seedance.js seedream-generate \
  --endpoint-id "ep-xxx" \
  --api-key "ark-xxx" \
  --prompt "your prompt" \
  --response-format url \
  --size 2K
```

### 状态查询
```bash
curl -X GET "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/TASK_ID" \
  -H "Authorization: Bearer ark-xxx"
```

## 关键修复记录

### 修复1: 端点路径错误
- **问题**: `seedance.js` 使用 `/api/plan/v3`，API返回404
- **修复**: 改为 `/api/v3`
- **文件**: `skills/byted-ark-seedance-skill/scripts/seedance.js`

### 修复2: API Key不支持环境变量
- **问题**: `smartScanForArkKey()` 明确注释"不扫描 ARK_API_KEY"
- **修复**: 添加 `ARK_API_KEY` 环境变量支持
- **文件**: `skills/byted-ark-seedance-skill/scripts/seedance.js`

### 修复3: 正则表达式无法匹配JSON输出
- **问题**: `seedance-render-engine.js` 使用 `任务 ID:` 前缀匹配，但 `seedance.js` 输出 `{"id": "cgt-xxx"}`
- **修复**: 改为匹配 `{"id": "cgt-xxx"}` 格式
- **文件**: `skills/seedance-render-engine/scripts/seedance-render-engine.js`

### 修复4: ffmpeg覆盖输入文件
- **问题**: `cutSegmentToShots()` 中 `shotFile` 和 `segmentFile` 同名，ffmpeg报错"Cannot edit existing files in-place"
- **修复**: 使用临时文件+重命名模式
- **文件**: `skills/seedance-render-engine/scripts/seedance-render-engine.js`

### 修复5: 时长超过API限制
- **问题**: 每幕镜头时长45-54秒，但API限制4-15秒
- **修复**: 添加 `maxShotDuration = 15` 硬约束
- **文件**: `skills/shanhai-pipeline/scripts/shanhai-pipeline.js`

## 模型端点ID映射

| 模型 | Endpoint ID (自定义) | 模型字符串 |
|------|----------------------|-----------|
| Seedream 5.0 | ep-20260518004750-lz76f | doubao-seedream-5-0-260128 |
| Seedance 2.0 Standard | ep-20260518004622-jp46s | doubao-seedance-2-0-260128 |
| Seedance 2.0 Fast | ep-20260518003432-n8v8f | doubao-seedance-2-0-fast-260128 |

## 重要提醒

1. **并发限制**: 火山引擎API限制 `maxConcurrent=2`，超过会触发429
2. **熔断器**: `exec-utils.js` 中 `circuitMap` 进程级熔断器，连续失败5次后永久OPEN
3. **Prompt长度**: 中文prompt限制约500字符（含修饰词），超长会智能截断
4. **种子值**: 使用统一风格种子 `1798000067` 保持风格一致性
5. **时长**: 每段4-15秒，总时长59秒需要精确分配

## 生产验证记录

**E01《烛龙睁眼》v2.5**
- 提交时间: 2026-05-18 09:15-09:34
- 完成时间: 2026-05-18 09:38
- 任务ID: cgt-20260518091538-xxx 系列
- 成功率: 12/12 (100%)
- 成片: E01-烛龙睁眼-v2.5-final.mp4 (22M, 59秒)

---
*记录者: 小G*
*日期: 2026-05-18*
*版本: v2.5-Peng*