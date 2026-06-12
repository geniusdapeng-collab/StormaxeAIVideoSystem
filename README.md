# 🌟 Stormaxe AI Video System

> **暴风战斧AI视频生成系统** — One prompt. One blockbuster short video.
> Powered by Chinese mythological narratives and modern AI rendering.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-22+-green.svg)](https://nodejs.org/)
[![Stars](https://img.shields.io/github/stars/geniusdapeng-collab/StormaxeAIVideoSystem?style=flat&color=yellow)](https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem/stargazers)
[![Issues](https://img.shields.io/github/issues/geniusdapeng-collab/StormaxeAIVideoSystem?style=flat&color=orange)](https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem/issues)
[![Last Commit](https://img.shields.io/github/last-commit/geniusdapeng-collab/StormaxeAIVideoSystem?style=flat&color=green)](https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem/commits)

**Stormaxe AI** — "一句话制作爆款短视频" (One prompt. One blockbuster short video.)

An intelligent video pre-production system that transforms ideas into director-grade cinematic stories — fully automatically, in minutes. No editing skills required.

---

## ✨ What Makes It Different

Most AI video tools give you generic clips. Stormaxe AI gives you **stories with soul**.

- 🐉 **Mythological Depth** — Built around the *Shanhaijing* (山海经, Classic of Mountains and Seas), the world's richest mythological bestiary. Dragons, phoenixes, and spirit beasts become cinematic protagonists.
- 🎬 **Director-Grade Pipeline** — 28-stage automated pre-production pipeline with quality gates at every step. Not a prompt wrapper — a real workflow engine.
- 🛡️ **Brand-Safe by Design** — Built-in advertising integration system with LogoShield™ protection, 8-dimension brand safety validation, and four standardized integration modes.
- ⚡ **Minutes, Not Days** — From PRD to render-ready prompts in a single command. No manual storyboarding, no prompt engineering expertise needed.

---

## 🎯 What It Produces

Stormaxe AI generates the full pre-production package for AI video:

| Output | Description |
|--------|-------------|
| **Story Plan** | Narrative structure with emotional beats |
| **Character Designs** | Consistent character sheets from a rich bestiary |
| **Shot Storyboard** | Scene-by-scene breakdown with camera instructions |
| **Dialogue Scripts** | Character dialogue with lip-sync annotations |
| **Render Prompts** | English prompts optimized for Seedance / Kling / Sora |
| **Quality Report** | 23-point quality gate checklist per shot |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+**
- **An AI API key** — ARK (ByteDance), OpenAI, or Minimax

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem.git
cd StormaxeAIVideoSystem

# 2. Install
npm install

# 3. Configure (copy and fill in your key)
cp .env.example .env

# 4. Run your first production
node skills/shanhaijing-director/scripts/director-pipeline.js pre-production \
  --production-dir ./productions/my-first-video \
  --worldview nirath
```

That's it. The pipeline handles everything else — story design, character sheets, shot prompts, quality checks.

### With Brand Integration

```bash
node skills/shanhaijing-director/scripts/director-pipeline.js pre-production \
  --production-dir ./productions/brand-campaign \
  --worldview nirath \
  --brand manner-coffee \
  --ad-mode highlight-15s
```

---

## 🐉 Built-in Mythological Bestiary

Stormaxe AI ships with a rich library of Chinese mythological creatures, each with:

- Detailed appearance specs (colors, signatures, body types)
- Narrative personas and behavioral patterns
- Camera/lighting presets optimized for each creature

| Creature | Type | Signature Feature |
|----------|------|-------------------|
| 白泽 (Baize) | Wisdom Spirit |竖眼 + 三尾火焰，洞察万物 |
| 烛龙 (Zhulong) | Sun Dragon | 赤色鳞甲，睁眼为昼 |
| 九尾狐 (Jiuweihu) | Charm Spirit | 九尾，银白毛发，媚态天成 |
| 鲲鹏 (Kunpeng) | Cosmic Bird | 翼若垂天之云，扶摇直上九万里 |

*...and 40+ more in the bestiary archive.*

---

## 🏗️ Architecture

```
PRD / Creative Brief
       ↓
┌─────────────────────────────────────────────────────┐
│  ShanhaiStory Forge (Director Pipeline v6.30-Peng)  │
│                                                     │
│  Stage 1-4   → Narrative Design & Story Plan       │
│  Stage 5-7   → Character & Shot Storyboard         │
│  Stage 8     → Quality Gates (23 checks per shot)   │
│  Stage 9-12  → Prompt Assembly & Export             │
│  [Ad Stages] → Brand Safety & Integration          │
└─────────────────────────────────────────────────────┘
       ↓
Render-Ready Prompts → Seedance / Kling / Sora
```

Each stage is independently testable. The pipeline is versioned with semantic releases.

---

## 📁 Project Structure

```
StormaxeAIVideoSystem/
├── skills/
│   ├── shanhaijing-director/         # Core Director Pipeline
│   │   └── scripts/director-pipeline.js
│   ├── shanhaijing-bestiary/        # Mythological creature library
│   ├── shanhaijing-character-manager/ # Character consistency engine
│   ├── shanhaijing-render-engine/   # Video render integration
│   ├── shanhaijing-story-engine/    # Narrative logic engine
│   └── shanhaijing-cinematography/  # Camera & lighting presets
├── productions/
│   └── product-archive/              # Ad integration system (v1.0)
│       ├── brands/                   # Brand profiles (5 brands)
│       ├── ad-shot-library/          # 15 reveal + 20 integration shots
│       ├── narrative-adapter.js      # Product→mythology mapping
│       ├── logo-shield.js           # Logo protection system
│       └── integration-modes.js     # 4 standardized ad modes
├── docs/                             # System documentation
├── scripts/                          # Utility scripts
└── README.md
```

---

## 🛡️ Brand Integration System (v1.0)

Stormaxe AI's advertising module lets brands appear in mythological narratives **without breaking the story**:

| Mode | Duration | Invasiveness | Best For |
|------|----------|-------------|----------|
| `highlight-15s` | 12-18s | High | Douyin / Social ads |
| `full-integration` | 30-120s | Low | Brand films / IP collabs |
| `opening-brand` | 3-5s | Direct | Show openers |
| `closing-callout` | 3-8s | Direct | CTAs / Promos |

**LogoShield™** ensures brand logos never appear as text — only as visual metaphors (shape, color, material texture).

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting PRs.

**Development philosophy:**
- Modular stages — each pipeline stage is independently testable
- Quality gates before aesthetics — correctness over prettiness
- Chinese mythological narratives are a first-class feature — respect the source material

---

## 🔒 Security

**Never commit API keys or credentials.** All secrets belong in `.env` (not tracked by git).

See [SECURITY-GITHUB-GUIDE.md](SECURITY-GITHUB-GUIDE.md) for the full security protocol.

---

## ⭐ If This Helped You

Give us a star! It helps the project grow and encourages continued development.

[![Star the Project](https://img.shields.io/github/stars/geniusdapeng-collab/StormaxeAIVideoSystem?style=social)](https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem/stargazers)

---

*Stormaxe AI — 让每一次创作，都像一场精心策划的风暴.*

*Stormaxe AI — Forge your vision. Render the storm.*
