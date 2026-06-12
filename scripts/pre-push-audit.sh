#!/usr/bin/env bash
# ============================================================
# pre-push-audit.sh — 推送前合规性审核
# 在 git push 之前运行，检查待推送内容是否合规
# 用法: ./scripts/pre-push-audit.sh [--strict]
#   --strict: 任何不合规都阻断推送
#   默认:   🔴 阻断，🟡 警告但允许
# ============================================================
set -euo pipefail

STRICT=false
[[ "${1:-}" == "--strict" ]] && STRICT=true

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

BLOCKERS=0
WARNINGS=0
PASSED=0
TOTAL=0

# ── 确定待推送范围 ──────────────────────────────────
REMOTE_BRANCH="origin/$(git rev-parse --abbrev-ref HEAD)"
if ! git rev-parse --verify "$REMOTE_BRANCH" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ remote branch $REMOTE_BRANCH not found, comparing against empty tree${NC}"
    FILES=$(git ls-files)
else
    FILES=$(git diff --name-only "$REMOTE_BRANCH" HEAD 2>/dev/null || git ls-files)
fi

if [[ -z "$FILES" ]]; then
    echo -e "${GREEN}✅ 没有待推送文件，审核通过${NC}"
    exit 0
fi

TOTAL=$(echo "$FILES" | wc -l)

echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  🔍 推送合规性审核 — 待推送 $TOTAL 个文件${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 规则引擎 ────────────────────────────────────────
# 格式: "pattern|severity|category|message"
# severity: BLOCKER | WARNING | ALLOW
RULES=(
    # 🔴 安全红线 — 绝对阻断
    "identity/device-auth.json|BLOCKER|安全泄漏|包含设备认证密钥"
    "identity/device.json|BLOCKER|安全泄漏|包含设备身份信息"
    "*.env|BLOCKER|安全泄漏|环境变量文件可能含密钥"
    "*secret*|BLOCKER|安全泄漏|文件名含 secret"
    "*credential*|BLOCKER|安全泄漏|文件名含 credential"
    "*token*|BLOCKER|安全泄漏|文件名含 token"
    "*.pem|BLOCKER|安全泄漏|私钥文件"
    "*.key|BLOCKER|安全泄漏|密钥文件"

    # 🔴 大文件 — 绝对阻断 (>10MB)
    "*.pptx|BLOCKER|大文件|PPTX 文件，仓库膨胀"
    "*.mp4|BLOCKER|大文件|视频文件，仓库膨胀"
    "*.mp3|BLOCKER|大文件|音频文件，仓库膨胀"
    "*.ogg|BLOCKER|大文件|OGG 音频，仓库膨胀"
    "*.wav|BLOCKER|大文件|WAV 音频，仓库膨胀"
    "*.mov|BLOCKER|大文件|视频文件，仓库膨胀"
    "*.avi|BLOCKER|大文件|视频文件，仓库膨胀"
    "*.zip|BLOCKER|大文件|压缩包，仓库膨胀"
    "*.tar|BLOCKER|大文件|压缩包，仓库膨胀"
    "*.gz|BLOCKER|大文件|压缩包，仓库膨胀"
    "*.7z|BLOCKER|大文件|压缩包，仓库膨胀"

    # 🟡 非代码文件 — 警告
    "media/*|WARNING|非代码|媒体文件目录"
    "workspace/media/*|WARNING|非代码|workspace 媒体文件"
    "workspace/memory/*|WARNING|非代码|workspace memory 文件"
    "workspace/reports/*|WARNING|非代码|workspace 报告文件"
    "workspace/research/*|WARNING|非代码|workspace 调研文件"
    "workspace/diary/*|WARNING|非代码|workspace 日记文件"
    "*.pdf|WARNING|非代码|PDF 文件"
    "*.png|WARNING|非代码|PNG 图片"
    "*.jpg|WARNING|非代码|JPG 图片"
    "*.jpeg|WARNING|非代码|JPEG 图片"
    "*.gif|WARNING|非代码|GIF 图片"
    "*.webp|WARNING|非代码|WebP 图片"
    "*.svg|WARNING|非代码|SVG 图片"

    # 🟡 构建产物 — 警告
    ".spark/*|WARNING|构建产物|.spark 构建缓存"
    "node_modules/*|WARNING|构建产物|node_modules 不应入库"
    "dist/*|WARNING|构建产物|dist 构建输出"
    "build/*|WARNING|构建产物|build 构建输出"
    ".next/*|WARNING|构建产物|Next.js 构建输出"

    # 🟡 自动生成文件 — 警告
    "cron/jobs/*|WARNING|自动生成|cron job 配置"
    "canvas/*|WARNING|自动生成|canvas 状态文件"
    "completions/*|WARNING|自动生成|completions 缓存"

    # ✅ 核心代码 — 放行
    "skills/*|ALLOW|核心代码|skills 目录"
    "scripts/*|ALLOW|核心代码|scripts 目录"
    "docs/*|ALLOW|文档|文档目录"
    "*.md|ALLOW|文档|Markdown 文件"
    "*.js|ALLOW|核心代码|JavaScript 文件"
    "*.json|ALLOW|配置|JSON 配置文件"
    "*.yml|ALLOW|配置|YAML 配置文件"
    "*.yaml|ALLOW|配置|YAML 配置文件"
    "*.sh|ALLOW|脚本|Shell 脚本"
    "*.css|ALLOW|核心代码|CSS 文件"
    "*.html|ALLOW|核心代码|HTML 文件"
    "*.gitignore|ALLOW|配置|Git 配置"
    "AGENTS.md|ALLOW|配置|Agent 配置"
    "SOUL.md|ALLOW|配置|Soul 配置"
    "IDENTITY.md|ALLOW|配置|Identity 配置"
    "USER.md|ALLOW|配置|User 配置"
    "MEMORY.md|ALLOW|配置|Memory 配置"
    "HEARTBEAT.md|ALLOW|配置|Heartbeat 配置"
    "TOOLS.md|ALLOW|配置|Tools 配置"
    "BOOTSTRAP.md|ALLOW|配置|Bootstrap 配置"
)

# ── 逐文件审核 ──────────────────────────────────────
declare -A FILE_VERDICT
declare -A FILE_REASON

for file in $FILES; do
    verdict="UNKNOWN"
    reason=""

    for rule in "${RULES[@]}"; do
        IFS='|' read -r pattern severity category message <<< "$rule"

        # glob 匹配
        if [[ "$file" == $pattern ]]; then
            if [[ "$severity" == "BLOCKER" ]]; then
                verdict="BLOCKER"
                reason="[$category] $message"
                break
            elif [[ "$severity" == "WARNING" ]] && [[ "$verdict" != "BLOCKER" ]]; then
                verdict="WARNING"
                reason="[$category] $message"
            elif [[ "$severity" == "ALLOW" ]] && [[ "$verdict" == "UNKNOWN" ]]; then
                verdict="ALLOW"
                reason="[$category] $message"
            fi
        fi
    done

    FILE_VERDICT["$file"]="$verdict"
    FILE_REASON["$file"]="$reason"
done

# ── 输出结果 ────────────────────────────────────────
BLOCKER_FILES=()
WARNING_FILES=()
ALLOW_FILES=()
UNKNOWN_FILES=()

for file in $FILES; do
    v="${FILE_VERDICT[$file]}"
    case "$v" in
        BLOCKER) BLOCKER_FILES+=("$file") ;;
        WARNING) WARNING_FILES+=("$file") ;;
        ALLOW)   ALLOW_FILES+=("$file") ;;
        *)       UNKNOWN_FILES+=("$file") ;;
    esac
done

# 阻断项
if [[ ${#BLOCKER_FILES[@]} -gt 0 ]]; then
    echo -e "${RED}${BOLD}🔴 阻断项 (${#BLOCKER_FILES[@]}) — 必须移除才能推送${NC}"
    for f in "${BLOCKER_FILES[@]}"; do
        echo -e "  ${RED}✗${NC} $f  ${RED}← ${FILE_REASON[$f]}${NC}"
    done
    echo ""
fi

# 警告项
if [[ ${#WARNING_FILES[@]} -gt 0 ]]; then
    echo -e "${YELLOW}${BOLD}🟡 警告项 (${#WARNING_FILES[@]}) — 建议移除${NC}"
    for f in "${WARNING_FILES[@]}"; do
        echo -e "  ${YELLOW}⚠${NC} $f  ${YELLOW}← ${FILE_REASON[$f]}${NC}"
    done
    echo ""
fi

# 未知项
if [[ ${#UNKNOWN_FILES[@]} -gt 0 ]]; then
    echo -e "${YELLOW}${BOLD}❓ 未分类 (${#UNKNOWN_FILES[@]}) — 需人工审核${NC}"
    for f in "${UNKNOWN_FILES[@]}"; do
        echo -e "  ${YELLOW}?${NC} $f"
    done
    echo ""
fi

# 放行项（仅摘要）
echo -e "${GREEN}✅ 合规文件: ${#ALLOW_FILES[@]}/${TOTAL}${NC}"

# ── 大文件检查 ──────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ 📦 大文件扫描 (>1MB) ━━━${NC}"
LARGE_FILES=$(while IFS= read -r f; do
    if [[ -f "$f" ]]; then
        size=$(stat -c%s "$f" 2>/dev/null || echo 0)
        if [[ $size -gt 1048576 ]]; then
            echo "$(numfmt --to=iec $size 2>/dev/null || echo ${size})  $f"
        fi
    fi
done <<< "$FILES")

if [[ -z "$LARGE_FILES" ]]; then
    echo -e "${GREEN}  无大文件 (>1MB)${NC}"
else
    echo "$LARGE_FILES" | while read line; do
        echo -e "  ${YELLOW}⚠${NC} $line"
    done
fi

# ── 敏感内容扫描 ──────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ 🔐 敏感内容扫描 ━━━${NC}"
SENSITIVE_HITS=0
for f in $FILES; do
    if [[ ! -f "$f" ]]; then continue; fi
    # 跳过二进制
    if file "$f" | grep -q "binary"; then continue; fi
    hits=$(grep -c -iE '(ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9_-]{20,}|password\s*=\s*["'"'"'][^"'"'"']+["'"'"'])' "$f" 2>/dev/null || true)
    if [[ "$hits" -gt 0 ]]; then
        echo -e "  ${RED}🔴${NC} $f — 检测到 $hits 处疑似密钥/密码"
        SENSITIVE_HITS=$((SENSITIVE_HITS + hits))
    fi
done
if [[ $SENSITIVE_HITS -eq 0 ]]; then
    echo -e "${GREEN}  未检测到敏感内容${NC}"
fi

# ── 合规率 ──────────────────────────────────────────
COMPLIANCE=$(( (${#ALLOW_FILES[@]} * 100) / TOTAL ))
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  合规率: ${GREEN}${COMPLIANCE}%${NC} (${#ALLOW_FILES[@]}/${TOTAL})"
echo -e "  阻断: ${RED}${#BLOCKER_FILES[@]}${NC}  警告: ${YELLOW}${#WARNING_FILES[@]}${NC}  未分类: ${YELLOW}${#UNKNOWN_FILES[@]}${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── 判决 ────────────────────────────────────────────
if [[ ${#BLOCKER_FILES[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}${BOLD}⛔ 审核不通过 — 存在 ${#BLOCKER_FILES[@]} 个阻断项${NC}"
    echo -e "${RED}   请移除阻断文件后重新审核${NC}"
    exit 1
fi

if $STRICT && [[ ${#WARNING_FILES[@]} -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}${BOLD}⚠ Strict 模式 — ${#WARNING_FILES[@]} 个警告项导致不通过${NC}"
    exit 1
fi

if [[ ${#WARNING_FILES[@]} -gt 0 ]] || [[ ${#UNKNOWN_FILES[@]} -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}${BOLD}⚠ 审核通过（有警告）— 建议清理后推送${NC}"
else
    echo ""
    echo -e "${GREEN}${BOLD}✅ 审核通过 — 所有文件合规${NC}"
fi

exit 0
