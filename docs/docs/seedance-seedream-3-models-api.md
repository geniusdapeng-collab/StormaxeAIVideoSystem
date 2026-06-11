# 火山引擎 Seedance/Seedream 三模型 API 完整记录
# 记录时间: 2026-05-18
# 来源: 火山引擎官方接入示例（大鹏提供）

## 一、三模型总览

| 模型 | 用途 | 端点 | 模型号 |
|------|------|------|--------|
| **Seedance 2.0 正式版** | 高质量最终视频渲染 | `/api/v3/contents/generations/tasks` | `doubao-seedance-2-0-260128` |
| **Seedance 2.0 Fast** | 快速草稿/预览渲染 | `/api/v3/contents/generations/tasks` | `doubao-seedance-2-0-fast-260128` |
| **Seedream 5.0** | 定妆照/角色一致性图片 | `/api/v3/images/generations` | `doubao-seedream-5-0-260128` |

## 二、Seedance 2.0 正式版

### 端点
```
POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
```

### 请求体
```json
{
  "model": "doubao-seedance-2-0-260128",
  "content": [
    { "type": "text", "text": "导演指令..." },
    { "type": "image_url", "image_url": { "url": "..." }, "role": "reference_image" },
    { "type": "video_url", "video_url": { "url": "..." }, "role": "reference_video" },
    { "type": "audio_url", "audio_url": { "url": "..." }, "role": "reference_audio" }
  ],
  "generate_audio": true,
  "ratio": "16:9",
  "duration": 11,
  "watermark": false
}
```

### 特性
- ✅ 多模态输入：text + image + video + audio
- ✅ 显式参数控制：ratio / duration / watermark / generate_audio
- ✅ 异步任务：返回 task_id，需轮询查询
- ✅ 高质量：最终成片标准

---

## 三、Seedance 2.0 Fast

### 端点
```
POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
```

### 请求体（与正式版结构完全相同，仅 model 不同）
```json
{
  "model": "doubao-seedance-2-0-fast-260128",
  "content": [...],
  "generate_audio": true,
  "ratio": "16:9",
  "duration": 11,
  "watermark": false
}
```

### 特性
- ⚡ **快速渲染**：速度更快，适合草稿预览和快速迭代
- ⚡ **相同端点**：与正式版共享 `/contents/generations/tasks`
- ⚡ **相同结构**：content 数组、role、参数完全一致
- ❌ **质量降级**：画面细节/光影/运动精度略低于正式版

### 使用策略
| 场景 | 推荐模型 |
|------|----------|
| 分镜草稿验证 | Fast |
| 镜头运动测试 | Fast |
| 角色姿态探索 | Fast |
| 最终成片输出 | 正式版 |
| 首帧/尾帧接力 | 正式版（质量优先） |
| 批量集数渲染 | Fast 预跑 → 正式版精修 |

---

## 四、Seedream 5.0（定妆照/图片生成）

### 端点
```
POST https://ark.cn-beijing.volces.com/api/v3/images/generations
```

### 请求体
```json
{
  "model": "doubao-seedream-5-0-260128",
  "prompt": "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车...",
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "size": "2K",
  "stream": false,
  "watermark": true
}
```

### 参数详解

| 参数 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `model` | string | `doubao-seedream-5-0-260128` | 模型标识 |
| `prompt` | string | 中英文均可 | 图片描述指令 |
| `sequential_image_generation` | string | `"disabled"` / `"enabled"` | 序列图生成开关（多角色一致性） |
| `response_format` | string | `"url"` / `"base64"` | 返回格式 |
| `size` | string | `"2K"` / `"4K"` / `"1080P"` | 分辨率 |
| `stream` | boolean | `false` | 是否流式输出 |
| `watermark` | boolean | `true` / `false` | 是否添加水印 |

### 特性
- 🎨 **图片生成**：非视频，单张/多张图片
- 🎨 **序列一致性**：`sequential_image_generation=enabled` 时，同一 prompt 生成多张保持角色一致性
- 🎨 **高分辨率**：支持 2K/4K
- 🎨 **与 Seedance 互补**：Seedream 生成定妆照 → Seedance 视频渲染引用

---

## 五、三端点对比

| 维度 | Seedance 正式版 | Seedance Fast | Seedream 5.0 |
|------|-----------------|---------------|--------------|
| **端点** | `/contents/generations/tasks` | `/contents/generations/tasks` | `/images/generations` |
| **输出** | 视频任务ID（异步） | 视频任务ID（异步） | 图片URL（同步/异步） |
| **输入** | content[] 多模态数组 | content[] 多模态数组 | prompt 字符串 |
| **多模态** | text+image+video+audio | text+image+video+audio | 仅 text(prompt) |
| **控制参数** | ratio/duration/generate_audio | ratio/duration/generate_audio | size/watermark/stream |
| **序列生成** | ❌ | ❌ | ✅ `sequential_image_generation` |
| **角色一致性** | 通过首尾帧图片引用 | 通过首尾帧图片引用 | 通过序列模式内置 |
| **分辨率** | 视频分辨率 | 视频分辨率 | 2K/4K |
| **配额消耗** | 高（正式版） | 中（Fast版） | 低（图片） |

---

## 六、山海经系统三模型协作流

```
Phase 0: 角色定妆（Seedream 5.0）
├── 输入: 角色详细描述（帝江/小G/白泽）
├── 参数: sequential_image_generation=enabled, size=2K
├── 输出: 3张一致性定妆照（全身/特写/动态姿势）
└── 保存: TOS 云存储，获取公网 URL

Phase 1: 分镜草稿（Seedance 2.0 Fast）
├── 输入: 分镜 prompt + 定妆照 URL（reference_image）
├── 参数: model=fast, duration=5-8s
├── 输出: 快速草稿视频
└── 导演审核: 确认运镜/构图/角色姿态

Phase 2: 正式渲染（Seedance 2.0 正式版）
├── 输入: 精修 prompt + 定妆照 URL + 参考视频 URL（可选）
├── 参数: model=正式版, duration=8-11s, generate_audio=true
├── 输出: 最终成片视频
└── 首帧接力: 上一段尾帧 → 下一段首帧（reference_image）

Phase 3: 后期拼接（本地 ffmpeg）
└── 所有镜头拼接 → 完整集数成片
```

---

## 七、通用视频生成系统三模型协作流

```
快速迭代模式:
├── 用户 prompt → Seedance Fast（5秒出草稿）
├── 用户确认 → Seedance 正式版（精修成片）
└── 如需角色锁定 → 先跑 Seedream 生成定妆照 → 引用到 Seedance

批量生产模式:
├── Seedream 批量生成角色一致性素材
├── Seedance Fast 批量跑分镜草稿
├── 人工审核后 → Seedance 正式版精修
└── ffmpeg 批量拼接成片
```

---

## 八、API Key 配置

```bash
# 环境变量（通用）
export ARK_API_KEY="ark-0e6994f7-bf34-4f3a-9e78-0fc02aa5fc92-42751"

# 三模型共用同一个 API Key
# Seedance 正式版 / Seedance Fast / Seedream 5.0 → 同一个 Bearer Token
```

---

## 九、关键注意事项

1. **素材 URL 要求**: 所有 reference_image/video/audio 必须是公网可访问 URL
   - 推荐：火山引擎 TOS（对象存储）直链
   - 临时 URL：需设置合理过期时间（建议 ≥1小时）

2. **Seedance 异步任务**:
   ```
   POST → 返回 { task_id, status: "queued" }
   GET /tasks/{task_id} → 轮询 { status, progress, output }
   ```

3. **Seedream 同步返回**:
   ```
   POST → 直接返回 { url: "https://..." } 或 base64
   ```

4. **配额关系**:
   - Seedance Fast 消耗 ≈ 正式版的 40-60%
   - Seedream 消耗 ≈ Seedance 正式版的 20-30%（单张图片）
   - 共用同一个 Agent 燃料值配额池

5. **角色一致性最佳实践**:
   - Seedream: sequential_image_generation=enabled 生成系列图
   - Seedance: reference_image 引用 Seedream 生成的定妆照 URL
   - 尾帧接力: 上一段视频尾帧提取 → 下一段首帧 reference_image

---

## 十、集成代码要点（JavaScript）

```javascript
// 统一配置
const ARK_CONFIG = {
  baseURL: 'https://ark.cn-beijing.volces.com',
  apiKey: process.env.ARK_API_KEY,
  models: {
    seedance: 'doubao-seedance-2-0-260128',
    seedanceFast: 'doubao-seedance-2-0-fast-260128',
    seedream: 'doubao-seedream-5-0-260128',
  }
};

// Seedance 2.0（正式版/Fast版通用）
async function callSeedance(content, options = {}) {
  const model = options.fast ? ARK_CONFIG.models.seedanceFast : ARK_CONFIG.models.seedance;
  const res = await fetch(`${ARK_CONFIG.baseURL}/api/v3/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model,
      content,
      generate_audio: options.generateAudio || false,
      ratio: options.ratio || '16:9',
      duration: options.duration || 8,
      watermark: options.watermark || false,
    }),
  });
  return res.json(); // { task_id, status }
}

// Seedream 5.0（定妆照）
async function callSeedream(prompt, options = {}) {
  const res = await fetch(`${ARK_CONFIG.baseURL}/api/v3/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: ARK_CONFIG.models.seedream,
      prompt,
      sequential_image_generation: options.sequential || 'disabled',
      response_format: 'url',
      size: options.size || '2K',
      stream: false,
      watermark: options.watermark || false,
    }),
  });
  return res.json(); // { url } or base64
}

// 任务查询（Seedance 异步）
async function queryTask(taskId) {
  const res = await fetch(
    `${ARK_CONFIG.baseURL}/api/v3/contents/generations/tasks/${taskId}`,
    { headers: { 'Authorization': `Bearer ${ARK_CONFIG.apiKey}` } }
  );
  return res.json(); // { status, progress, output: { video_url } }
}
```

---

*记录人: 小G*
*版本: v2.1-Peng*
*状态: 已记录，待集成到渲染引擎*