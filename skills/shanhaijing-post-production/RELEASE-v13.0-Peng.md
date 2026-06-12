# v13.0-Peng 生产发布说明

## 发布时间
2026-05-20

## 版本号
v13.0-Peng

## 核心升级（5大模块）

### 1. CharacterArchive 角色档案系统 v1.0-Peng
- **定妆照管理**：支持 full_body_front / face_closeup / side_profile 等类型
- **完整人设**：性格、擅长领域、偏好、特点、背景故事
- **Prompt自动注入**：`toPromptInjection()` 生成可直接注入Prompt的字符串
- **中国人特征硬编码**：所有人类角色默认 `definitely Chinese, East Asian appearance, not Western, not Caucasian`
- **资产库积累**：角色档案随内容积累越积越多，形成长期可复用资产

### 2. 渲染引擎角色一致性增强
- **自动加载CharacterArchive**：`render()` 函数自动从 `02-characters/` 加载角色档案
- **定妆照自动注入**：根据角色优先级（主角3张/配角2张/动物1张），自动将定妆照注入 `shotRefs`
- **Prompt描述增强**：`generateShotPrompt()` 优先使用档案完整人设，回退到 `plan.characters` 简化描述
- **中国人特征兜底**：未找到档案的人类角色，自动注入 `straight black hair, dark brown almond eyes, yellow skin tone, East Asian features`

### 3. 首尾帧衔接修复
- **根因修复**：`seedance.js` API端点从 `/api/plan/v3` 修正为 `/api/v3`
- **pollTaskForLastFrame恢复**：任务状态查询不再报404，尾帧可正常获取
- **串行渲染保障**：非fast模式下强制串行，`previousLastFrame` 正常传递
- **定妆照与首尾帧协同**：有previousLastFrame时最多再注入1张定妆照（共2张=first_frame+last_frame）

### 4. TTS+字幕工作流固化
- **Stage 4.5 TTS旁白生成**：`post-production.js` 新增 `stage45GenerateTTS()`
- **Stage 5音画合成升级**：`stage5AudioMix()` 优先使用TTS音频合成，使用 `-map 0:v:0 -map 1:a:0 -shortest`
- **默认音色锁定**：`zh-CN-YunyangNeural`（云扬）纪录片旁白男声
- **旁白脚本来源**：`storyPlan.narrationScript` 或 `storyPlan.narration`
- **FFmpeg铁律**：`TOOLS.md` 已固化 `-map` 指定音轨来源方案

### 5. 中国人特征系统级强化
- **orient-primordial-core.js**：`L4_CHARACTERS.human_child` 已注入 `East Asian features`
- **generateShotPrompt兜底**：未归档人类角色自动注入中国人特征
- **CharacterArchive默认**：所有新建角色 `nationality: 'Chinese'`, `ethnicity: 'East Asian Chinese'`

## 测试报告
- **Mock测试**：6/6 全部通过
  - ✅ CharacterArchive模块加载
  - ✅ 渲染引擎加载（含CharacterArchive引入）
  - ✅ seedance.js API端点 /api/v3
  - ✅ TTS引擎模块加载（默认音色云扬）
  - ✅ post-production.js TTS集成
  - ✅ 角色档案Prompt注入（中国人特征+完整人设）

## 文件变更
| 文件 | 变更 |
|------|------|
| `seedance-render-engine.js` | v13.0-Peng，集成CharacterArchive+定妆照注入+中国人兜底 |
| `post-production.js` | v13.0-Peng，新增Stage 4.5 TTS+Stage 5升级 |
| `character-archive.js` | 新建，CharacterArchive v1.0-Peng完整实现 |
| `seedance.js` | 修复API端点 /api/plan/v3 → /api/v3 |
| `orient-primordial-core.js` | 强化中国人特征注入 |
| `TOOLS.md` | 固化TTS合成铁律 |

## Git Commit
`331c50a` — v13.0-Peng: 角色一致性系统+TTS固化+首尾帧修复

## 使用方式

### 创建角色档案
```javascript
const archive = new CharacterArchive('./productions/我的短片/02-characters');
archive.create({
  id: 'C01', name: '护士Chen', type: 'human', role: 'protagonist',
  personality: '专业严谨、亲切温暖',
  expertise: '健康护理科普',
  visual: { face: '...', clothing: '...', signature: '...' },
  portraits: [
    { type: 'full_body_front', path: './03-characters/C01-full-body.png' },
    { type: 'face_closeup', path: './03-characters/C01-face.png' }
  ]
});
```

### story-plan.json 添加旁白
```json
{
  "narrationScript": "大家好，欢迎收看健康小课堂。今天我们来讲一个听起来可怕但其实可以预防的问题..."
}
```

### 运行后期制作（自动TTS+合成）
```bash
node post-production.js assemble --production-dir ./productions/我的短片
```

---
*v13.0-Peng — 角色一致性不再是问题，TTS+字幕全自动，首尾帧无缝衔接*