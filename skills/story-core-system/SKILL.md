# Story Core System — 异兽故事核心架构

> 外部专家升级方案，2026-06-06 大鹏收到，代码已存档

## 架构定位
把"故事"从导演后面附属步骤，提升为**上游总控中枢**：
- Story Kernel（主题/欲望/冲突/代价/余韵）
- Nirath World Reaction Engine（Nirath 变成情绪响应系统）
- Drama Shot Engine（镜头绑定戏剧目的和内在状态）
- Narrative Consistency Guard（叙事一致性守卫）

## 7个核心模块
| 文件 | 职责 |
|------|------|
| `story-kernel-engine.js` | 生成故事内核（theme/desire/conflict/emotionalCurve） |
| `lore-drama-adapter.js` | 把异兽档案转成叙事人格（已支持：白泽/帝江/刑天/夸父） |
| `nirath-world-reaction-engine.js` | Nirath 世界对异兽情绪的响应映射 |
| `drama-shot-engine.js` | 镜头绑定 beat/dramaticPurpose/innerState |
| `story-aware-prompt-builder.js` | 故事感知提示词组装 |
| `narrative-consistency-guard.js` | 叙事一致性校验 |
| `story-core-orchestrator.js` | 总入口，输出 kernel/shots/prompts/validation |

## 集成方式
```js
const { StoryCoreOrchestrator } = require('./story-core-orchestrator');
const result = new StoryCoreOrchestrator().buildProject({ beastId: 'baize', duration: 60 });
```

## 状态
- [x] 代码存档（2026-06-06）
- [x] 语法检查全部通过
- [ ] 集成到现有 Director Pipeline
- [ ] 第一个样片验证（白泽：它早已看见结局）
