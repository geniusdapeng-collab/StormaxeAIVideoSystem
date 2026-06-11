# Seedance 2.0 多模态内容生成任务 API — 官方格式记录
# 记录时间: 2026-05-18
# 来源: 火山引擎官方快捷API接入示例

## 一、API 端点

```
POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
```

**区别于旧端点**:
- ❌ 旧: `POST /api/v3/images/generations` — Seedream/单图生成
- ✅ 新: `POST /api/v3/contents/generations/tasks` — Seedance 2.0 多模态视频任务

## 二、Headers

```
Content-Type: application/json
Authorization: Bearer {ARK_API_KEY}
```

## 三、请求体结构

```json
{
  "model": "doubao-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "导演指令/分镜脚本..."
    },
    {
      "type": "image_url",
      "image_url": { "url": "https://..." },
      "role": "reference_image"
    },
    {
      "type": "video_url",
      "video_url": { "url": "https://..." },
      "role": "reference_video"
    },
    {
      "type": "audio_url",
      "audio_url": { "url": "https://..." },
      "role": "reference_audio"
    }
  ],
  "generate_audio": true,
  "ratio": "16:9",
  "duration": 11,
  "watermark": false
}
```

## 四、Content 数组规范

| type | role | 用途 | 数量限制 |
|------|------|------|----------|
| `text` | (默认) | 导演指令/分镜脚本 | 1个（主指令） |
| `image_url` | `reference_image` | 参考图片（首尾帧/角色定妆照） | 2个（示例中） |
| `video_url` | `reference_video` | 参考视频（构图/运镜风格） | 1个 |
| `audio_url` | `reference_audio` | 参考音频（背景音乐/配音） | 1个 |

**关键字段**:
- `role`: 必须为 `reference_image` / `reference_video` / `reference_audio`，标识素材类型
- `url`: 必须是公网可访问的 HTTP(S) URL（TOS/云存储直链）
- `text`: 完整分镜脚本，含时间轴、镜头语言、音频指令

## 五、控制参数

| 参数 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `generate_audio` | boolean | `true` | 是否生成音频（口型同步+音画同步） |
| `ratio` | string | `"16:9"` | 画幅比，支持 `16:9`, `9:16`, `1:1` |
| `duration` | integer | `11` | 视频时长（秒），示例为11秒 |
| `watermark` | boolean | `false` | 是否添加水印 |

## 六、与本系统现有 Seedance API 对比

| 维度 | 旧 API (`images/generations`) | 新 API (`contents/generations/tasks`) |
|------|-------------------------------|----------------------------------------|
| 端点 | `/api/v3/images/generations` | `/api/v3/contents/generations/tasks` |
| 模型 | `doubao-seedance-2-0-t2v-250526` | `doubao-seedance-2-0-260128` |
| 输入 | 单条 prompt 字符串 | `content` 多模态数组 |
| 图片引用 | `--image-file` 路径参数 | `content[]` 中 `image_url` + `role` |
| 视频引用 | 不支持 | `content[]` 中 `video_url` + `role` |
| 音频引用 | `--generate-audio` 布尔开关 | `content[]` 中 `audio_url` + `role` + `generate_audio` |
| 画幅 | prompt 中嵌入比例指令 | `ratio` 显式参数 |
| 时长 | prompt 中嵌入时长指令 | `duration` 显式参数 |
| 返回 | 图片/视频URL | 任务ID，需轮询查询 |

## 七、山海经系统集成建议

### 7.1 何时使用新 API

**适合场景**:
- ✅ 复杂多镜头叙事（需要首尾帧锁定+构图参考+背景音乐）
- ✅ 商业化内容（广告/宣传片，需要精确时间轴控制）
- ✅ 多模态素材丰富时（已有定妆照+参考视频+配乐）

**仍用旧 API**:
- ✅ 单镜头快速迭代
- ✅ 纯文本导演指令，无参考素材
- ✅ 首帧接力渲染（--return-last-frame + --image-file）

### 7.2 集成方案

**方案A: 扩展 ShanhaiRenderEngine 支持双API模式**

```javascript
// 新增 renderMode: 'multimodal-task'
renderSegment(segment, options) {
  if (options.renderMode === 'multimodal-task') {
    return this._callSeedanceContentTaskAPI({
      model: 'doubao-seedance-2-0-260128',
      content: [
        { type: 'text', text: segment.prompt },
        ...(segment.firstFrame ? [{ type: 'image_url', image_url: { url: segment.firstFrame }, role: 'reference_image' }] : []),
        ...(segment.lastFrame ? [{ type: 'image_url', image_url: { url: segment.lastFrame }, role: 'reference_image' }] : []),
        ...(segment.referenceVideo ? [{ type: 'video_url', video_url: { url: segment.referenceVideo }, role: 'reference_video' }] : []),
        ...(segment.referenceAudio ? [{ type: 'audio_url', audio_url: { url: segment.referenceAudio }, role: 'reference_audio' }] : []),
      ],
      generate_audio: segment.generateAudio || false,
      ratio: segment.ratio || '16:9',
      duration: segment.duration || 8,
      watermark: false,
    });
  } else {
    return this._callSeedanceImageAPI(segment.prompt, options);
  }
}
```

**方案B: 新建 `seedance-multimodal-task.js` 独立模块**
- 与现有渲染引擎解耦
- 专门处理复杂多模态任务
- 任务状态轮询（提交→查询→下载）

### 7.3 关键注意事项

1. **URL 要求**: 所有素材必须是公网可访问 URL（TOS/云存储/CDN）
   - 本地文件需先上传至火山引擎对象存储（TOS）
   - 临时授权URL需设置合理过期时间

2. **任务异步**: 此 API 返回任务ID，需轮询查询状态
   ```
   GET /api/v3/contents/generations/tasks/{task_id}
   ```

3. **配额消耗**: 多模态任务（含音频/视频参考）配额消耗可能更高

4. **文本指令格式**: 需严格按「时间轴+镜头+音频」三段式，示例：
   ```
   0-2s: [动作描述]，[声音描述]
   2-4s: [动作描述]，背景音「[台词]」
   ```

## 八、示例任务 ID 追踪

```
# 提交任务
Response: { "task_id": "cgt-xxxxxxxx", "status": "queued" }

# 轮询查询
GET /api/v3/contents/generations/tasks/cgt-xxxxxxxx
Response: { "status": "processing", "progress": 45 }

# 完成
Response: { "status": "completed", "output": { "video_url": "https://..." } }
```

## 九、与山海经 E01 结合的应用设想

**E01《烛龙睁眼》首镜多模态渲染**:
```json
{
  "model": "doubao-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "0-2s: 小G蜷缩在学校废墟角落，手里紧握着半张照片，远处传来奇怪的呼吸声；2-4s: 镜头缓缓抬起，看到一只没有五官的巨大异兽（帝江）正悬浮在废墟上方，全身燃烧着无形的火焰；4-6s: 小G慢慢站起身， notebooks从手中滑落，帝江向他靠近，空气中弥漫着木灵气的清香"
    },
    {
      "type": "image_url",
      "image_url": { "url": "https://tos-bucket/seedream-dijiang-fullbody-v1.png" },
      "role": "reference_image"
    },
    {
      "type": "image_url",
      "image_url": { "url": "https://tos-bucket/seedream-xiaog-school-v1.png" },
      "role": "reference_image"
    }
  ],
  "generate_audio": true,
  "ratio": "16:9",
  "duration": 8,
  "watermark": false
}
```

---
*记录人: 小G*
*版本: v2.1-Peng*
*状态: 待集成决策*