# Release v10.33-Peng

## 修复内容

### 1. 截断预算控制（v10.33-Peng-fix）
- **根因**：`minPrompt = prompt.length * 0.5` 在 prompt 3000+ 字时产生 1500+ 字的截断下限，远超 `effectiveTarget`（~500字），导致截断后仍超上限，硬截断时丢弃时间轴
- **修复**：删除 `minPrompt` 兜底，truncatedPrompt 必须服从 `effectiveTarget - minMandatoryReserve` 预算
- **影响**：所有镜头的截断行为更可控，避免 `prompt.length * 0.5` 导致的预算失控

### 2. MandatoryBudget 超配额保留（v10.33-Peng-fix2）
- **根因**：`MAX_MANDATORY_TOTAL = 350` 导致 P0 Dialogue 和 Disclaimer 被丢弃
- **修复**：总预算提升至 450，P0 Dialogue（台词）和 Disclaimer（免责声明）超配额强制保留
- **影响**：台词和免责声明不再被截断，符合系统级合规要求

### 3. 时间轴存活验证（v10.33-Peng-fix3）
- **根因**：`shot.timeRange` 从未被赋值，`generateShotPrompt` 返回前的验证条件 `if (shot.timeRange && !finalPrompt.includes('[T:'))` 永远为 false
- **修复**：在 `generateTemporalBreakdown` 调用后写入 `shot.timeRange = timelineText`，并在 `generateShotPrompt` 返回前校验 `[T:` 标记，缺失则自动追加
- **影响**：Timeline 从 3/8 OK 提升至 8/8 OK

## 验证结果

| 镜头 | 时长 | 长度 | Timeline | Dialogue |
|------|------|------|----------|----------|
| S00 | 8s | 971 | OK | OK |
| S01 | 6s | 990 | OK | OK |
| S02 | 6s | 984 | OK | OK |
| S03 | 12s | 990 | OK | 无（预期内） |
| S04 | 6s | 962 | OK | OK |
| S05 | 11s | 990 | OK | OK |
| S06 | 12s | 990 | OK | OK |
| S07 | 6s | 990 | OK | OK |

- **Timeline**: 8/8 OK
- **Dialogue**: 7/8 OK（S03 无台词，预期内）
- **利用率**: 96.2%–100.0%（全部达标）

## 版本号

- Engine: `v10.33-Peng`
- 文件：`skills/seedance-render-engine/scripts/seedance-render-engine.js`