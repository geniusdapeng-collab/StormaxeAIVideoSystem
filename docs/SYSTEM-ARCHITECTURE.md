# Stormaxe AI — System Architecture

## Overview

Stormaxe AI uses a **modular stage-based pipeline**. Each stage is an independent module with defined inputs and outputs. The Director Pipeline orchestrates execution, manages state, and enforces quality gates between stages.

## Pipeline Stages

```
PRD Input
    ↓
Stage 1: PRD Generation          ← Creative brief parsing
Stage 2: Requirement Alignment  ← Schema validation & story plan generation
Stage 3: Schema Validation      ← Output format verification
Stage 4: Storyboard Check       ← Narrative quality assessment
Stage 5: Compliance Check       ← Platform & safety rules
Stage 6: Duration Allocation    ← Shot timing & pacing
Stage 7: Cinematography Control  ← Camera instructions & shot composition
Stage 7.5: Dialogue Annotation ← Character dialogue generation
Stage 8: Prompt Pre-Generation  ← Assemble render prompts
Stage 9: Quality Calibration   ← Metadata completeness check
Stage 10: Director Optimize     ← Final polish & consistency check
Stage 11-12: Confirmation Gates ← Human approval before render
    ↓
Render → Post-Production → Delivery
```

## Core Modules

| Module | Path | Purpose |
|--------|------|---------|
| **Director Pipeline** | `skills/shanhaijing-director/director.js` | Main orchestrator, stage runner |
| **Story Engine** | `skills/shanhaijing-story-engine/` | Narrative logic, story structure |
| **Character Manager** | `skills/shanhaijing-character-manager/` | Character reference consistency |
| **Bestiary Archive** | `skills/shanhaijing-bestiary/` | Mythological creature library |
| **Render Engine** | `skills/shanhaijing-render-engine/` | Video generation & composition |
| **ARK Seedance Skill** | `skills/shanhaijing-ark-seedance-skill/` | ByteDance Seedance API integration |

## Data Flow

```
PRD (.md)
    ↓  [Stage 2]
Story Plan (JSON)
    ↓  [Stage 3-7]
Shot Definitions (JSON)
    ↓  [Stage 7.5]
Dialogue Annotations (JSON)
    ↓  [Stage 8]
Render Prompts (.txt per shot)
    ↓  [Stage 11-12]
Render (MP4)
    ↓  [Post-Production]
Final Delivery
```

## Configuration

System behavior is controlled via:
- Environment variables (API keys, endpoints)
- `skills/*/SKILL.md` — Skill-level configuration
- `skills/shanhaijing-director/SKILL.md` — Pipeline-level configuration

## Extending the System

To add a new stage:
1. Create a new module under `skills/shanhaijing-*/`
2. Export a function matching `async function stageX_YourStageName(shot, context)` signature
3. Register in `skills/shanhaijing-director/scripts/stage-registry.js`
4. Add quality gate checks in `skills/shanhaijing-director/scripts/pipeline-story-support.js`

## Version

Current: **v6.24** (2026-06-08)
See [CHANGELOG.md](CHANGELOG.md) for full version history.
