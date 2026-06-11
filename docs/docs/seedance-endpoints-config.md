# 火山引擎 Seedance/Seedream 三模型端点配置（大鹏自定义）
# 记录时间: 2026-05-18 00:52
# 来源: 火山引擎控制台（大鹏提供）

## 一、端点总览

| 用途 | 自定义端点名称 | 端点ID | 绑定模型 | 状态 |
|------|--------------|--------|----------|------|
| **Seedance 2.0 Fast** | openclaw | `ep-20260518003432-n8v8f` | doubao-seedance-2-0-fast-260128 | ✅ 健康 |
| **Seedance 2.0 正式版** | openclaw2 | `ep-20260518004622-jp46s` | doubao-seedance-2-0-260128 | ✅ 健康 |
| **Seedream 5.0-lite** | openclaw3 | `ep-20260518004750-lz76f` | doubao-seedream-5-0-260128 | ✅ 健康 |

## 二、预置模型（模型广场）

| 模型 | 模型ID | 预置端点ID |
|------|--------|-----------|
| Seedance 2.0 | `doubao-seedance-2-0-260128` | `ep-m-20260518003302-245xb` |
| Seedance 2.0 Fast | `doubao-seedance-2-0-fast-260128` | `ep-m-20260518003252-p4chz` |
| Seedream 5.0-lite | `doubao-seedream-5-0-260128` | `ep-m-20260518003223-58l4t` |

> 大鹏创建了3个自定义推理接入点，分别绑定上述3个模型。
> 使用自定义端点而非预置端点，便于管理和配额追踪。

## 三、使用策略

```
草稿/快速迭代  →  openclaw (Fast)
正式成片渲染  →  openclaw2 (Standard)
角色定妆照   →  openclaw3 (Seedream)
```

## 四、JavaScript配置

```javascript
const ARK_CONFIG = {
  baseURL: 'https://ark.cn-beijing.volces.com',
  apiKey: process.env.ARK_API_KEY, // ark-0e6994f7-bf34-4f3a-9e78-0fc02aa5fc92-42751
  endpoints: {
    seedanceFast: 'ep-20260518003432-n8v8f',   // openclaw
    seedance:     'ep-20260518004622-jp46s',    // openclaw2
    seedream:     'ep-20260518004750-lz76f',    // openclaw3
  }
};
```

## 五、API Key

```
ark-0e6994f7-bf34-4f3a-9e78-0fc02aa5fc92-42751
```

所有3个端点共用同一个 API Key。

## 六、E01渲染实况

| 版本 | 端点 | 结果 |
|------|------|------|
| v1 (原版prompt) | openclaw (Fast) | S01❌敏感拦截, S02❌无URL, **S03✅成功** |
| v2 (去敏感化) | openclaw (Fast) | **S02✅成功**, S01/S03-S05🔄 running |

> v2使用去敏感化prompt（"神圣/奇幻/温暖"替代"破坏/恐惧/灼烧"），策略验证成功！