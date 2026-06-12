# Stormaxe AI Video System — GitHub 发布安全指南

> ⚠️ **重要**：Stormaxe AI Video System 包含敏感的基础设施密钥。
> 请在发布前严格遵守以下安全协议。

---

## 🔐 发布安全检查清单

每次执行 `./scripts/github-publish.sh` 前，必须确认以下所有项目：

### ✅ 第一道闸机：暂存区扫描
```bash
git diff --cached --name-only | grep -E "(ark-|volc-|sk-|AKLTY|secret|token)"
```
如果有任何输出，**立即停止发布**。

### ✅ 第二道闸机：工作区全文扫描
```bash
grep -rE "(ark-|volc-|sk-|AKLTY)" --include="*.js" --include="*.json" --include="*.md" .
```
注意：仅扫描源代码，**不扫描** `productions/` 目录（该目录已从 git 排除）。

### ✅ 第三道闸机：环境文件确认
```bash
# 确认以下文件存在于 .gitignore
grep -E "^\.env$|^\.env\.|ark-|sk-" .gitignore
```

---

## 🚫 禁止上传的内容（自动拦截）

| 类型 | 模式 | 危险等级 |
|------|------|---------|
| ARK API Key | `ark-*` | 🔴 Critical |
| Volcengine TOS 凭证 | `X-Tos-*`, `AKLTY*` | 🔴 Critical |
| OpenAI API Key | `sk-*` | 🔴 Critical |
| 环境配置文件 | `.env*` | 🔴 Critical |
| OAuth Token | `*token*` | 🔴 Critical |
| SSH 私钥 | `*.pem`, `id_rsa*` | 🔴 Critical |
| 视频成品 | `*.mp4`, `*.mov` | 🟡 Medium |
| 角色定妆照 URL | TOS CDN URL | 🟡 Medium |
| Session 日志 | `*.jsonl` | 🟢 Low |

---

## 🔧 本地安全配置

### 1. 创建本地忽略文件（安全网）
```bash
# ~/.gitignore_global
# 添加到 ~/.gitconfig: core.excludesFile = ~/.gitignore_global
.env
*.env
ark-*
volc-*
sk-*
AKLTY*
*secret*
```

### 2. 设置 Git 钩子（预提交扫描）
```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/github-publish.sh --dry-run && exit 0 || exit 1
```

### 3. CI/CD 安全配置
- GitHub Actions 使用 `GITHUB_TOKEN` 而非个人 PAT
- secrets 配置在 GitHub仓库 Settings → Secrets and variables → Actions
- Workflow 文件中不硬编码任何密钥

---

## 📋 正确的敏感信息处理方式

### ✅ 正确做法
```javascript
// 使用环境变量引用
const apiKey = process.env.ARK_API_KEY;
const endpoint = process.env.VOLCENGINE_ENDPOINT;
```

### ❌ 错误做法（会触发安全闸机）
```javascript
// 硬编码密钥 - 禁止！
const apiKey = "ark-xxxxxxxxxxxxxxxxxxxx";
```

---

## 🚨 如果误发了密钥怎么办

1. **立即撤销**该密钥（通过云平台控制台）
2. 创建新密钥替换
3. 旋转（rotate）所有相关凭证
4. 提交 GitHub 安全报告：https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem/security/advisories

---

## 📞 安全联系

- **漏洞报告**：请通过私密渠道联系仓库管理员
- **Stormaxe 安全响应**：stormaxe-security@geniusdapeng.com

---

*本指南由 Stormaxe AI 系统自动生成，最后更新：2026-06-08*
