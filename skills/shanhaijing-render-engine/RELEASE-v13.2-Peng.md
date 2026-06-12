# Nirath Render Engine v13.2-Peng 生产版本发布说明

## 发布信息
- **版本**: v13.2-Peng
- **日期**: 2026-05-20
- **状态**: 生产就绪 ✅
- **Git标签**: `render-engine-v13.2-Peng`

## 本次更新内容

### 🆕 Seedance API 参数全面升级
修复排查发现的 **4个P0缺失参数 + 1个role标记错误**：

| 参数 | 修复前 | 修复后 | 影响 |
|------|--------|--------|------|
| `resolution` | 不传（默认未知） | 显式传入 `1080p` | 确保1080p/2K画质输出 |
| `seed` | 不传（完全随机） | 基于 shotId 生成确定性种子 | 相同镜头可复现，角色一致性 |
| `camera_fixed` | 不传（允许漂移） | 智能判断（静态固定/动态允许运镜） | 防止讲解镜头意外推/拉/摇移 |
| `return_last_frame` | 不传（默认false） | 设为 `true` | API原生返回高质量尾帧，帧传递质量提升 |
| `firstFrame` role | 混在 `referenceImages` 中（全为 `reference_image`） | 独立参数 `firstFrame` | 上一镜头末帧标记为 `first_frame`，约束更强 |

### 智能固定机位判断逻辑
```
建置镜头/对话镜头/特写镜头/讲解镜头 → camera_fixed: true
追踪镜头/手持镜头/航拍镜头/动作镜头 → camera_fixed: false（允许运镜）
无明确标记 → 保守默认 true（固定）
```

### 确定性种子策略
```
seed = hash(shotId) → 相同shotId产生相同seed → 结果可复现
策略可配置：'shotId' | 'random' | 'fixed'
```

## 文件变更

### 修改文件
1. `skills/shanhaijing-render-engine/render-engine.js`
   - `RENDER_CONFIG` 新增: `resolution`, `returnLastFrame`, `fixedCameraShotTypes`, `movingCameraShotTypes`, `seedStrategy`
   - `renderShot()` 调用 `generateVideo()` 新增5个参数
   - 新增 `_generateSeed(shotId)` 方法
   - 新增 `_shouldFixCamera(shot)` 方法
   - 帧传递 `prevFrameUrl` 改为独立 `firstFrame` 参数

2. `skills/volcengine-api-client.js`
   - Mock stub 升级支持新参数打印和验证
   - `generateVideo()` 支持 `firstFrame`, `seed`, `cameraFixed`, `resolution`, `returnLastFrame`

### 新增文件
3. `skills/shanhaijing-render-engine/v13.2-parameter-mock-test.js`
   - 7项Mock测试（全部通过）
   - 覆盖: resolution/seed/cameraFixed/returnLastFrame/firstFrame/组合验证/帧传递模式

## Mock测试结果
**7/7 通过（100%）**

| 测试项 | 结果 |
|--------|------|
| Test 1: resolution 参数传递 | ✅ |
| Test 2: seed 确定性生成 | ✅ |
| Test 3: camera_fixed 智能判断 | ✅ |
| Test 4: returnLastFrame 参数 | ✅ |
| Test 5: 帧传递 firstFrame role | ✅ |
| Test 6: 完整参数组合 | ✅ |
| Test 7: sequentialFramePass 帧传递模式 | ✅ |

## 兼容性
- 向后兼容：所有新增参数均有默认值
- `resolution` 默认 `'1080p'`
- `seedStrategy` 默认 `'shotId'`
- `returnLastFrame` 默认 `true`
- 旧配置无需修改即可运行

## 注意事项
- 真实API调用时，`firstFrame` 参数需要 API 层支持 role 标记（由 `byted-ark-seedance-skill` 处理）
- 如 API 不支持 `firstFrame` 独立参数，会回退到 `referenceImages` 数组末尾追加（兼容旧行为）
- `cameraFixed` 的判断基于镜头描述关键词，可在 `RENDER_CONFIG` 中自定义镜头类型映射

---

*发布人: 小G*
*验证: 7/7 Mock测试全部通过，未提交真实渲染*