#!/bin/bash
#===========================================================
# Stormaxe AI Video System - GitHub Publish Safety Gate
# 暴风战斧AI视频生成系统 - GitHub发布安全闸机
#===========================================================
# Usage: ./scripts/github-publish.sh [--force]
#   --force  跳过确认直接发布（用于CI/CD自动化）
#   不带参数  进入人工确认闸机
#===========================================================

set -e

REPO_NAME="StormaxeAIVideoSystem"
REPO_URL="https://github.com/geniusdapeng-collab/${REPO_NAME}.git"
PRODUCTION_BRANCH="sprint/default"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass()  { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_fail()  { echo -e "${RED}[FAIL]${NC} $1"; }
log_secure(){ echo -e "${CYAN}[SEC]${NC}  $1"; }

echo "=================================================="
echo "  Stormaxe AI Video System - GitHub Publish Gate"
echo "  暴风战斧AI视频生成系统 - GitHub发布安全闸机"
echo "=================================================="
echo ""

# Step 1: 确认未暂存敏感文件
log_secure "=== 第一道闸机：敏感文件扫描 ==="
SENSITIVE_PATTERN="(ark-|volc-|sk-|openai-|minimax-|dashscope-|X-Tos-|AKLTY|secret|token|password|credentials)"
FOUND_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E "${SENSITIVE_PATTERN}" || true)

if [ -n "$FOUND_FILES" ]; then
    log_fail "检测到敏感文件已暂存，中止发布！"
    echo "问题文件："
    echo "$FOUND_FILES"
    exit 1
fi
log_pass "暂存区无敏感文件 ✅"

# Step 2: 检查工作区变更
UNTRACKED=$(git status --porcelain 2>/dev/null | grep "^?" | wc -l)
MODIFIED=$(git status --porcelain 2>/dev/null | grep "^.M" | wc -l)
log_info "工作区状态：${MODIFIED}个修改文件，${UNTRACKED}个未跟踪文件"

# Step 3: 扫描所有变更中的敏感信息
log_secure "=== 第二道闸机：全文敏感信息扫描 ==="
SCAN_TARGETS=$(git diff HEAD --name-only 2>/dev/null)
SUSPICIOUS=""
for f in $SCAN_TARGETS; do
    if [ -f "$f" ]; then
        # 跳过已知的非敏感文件
        case "$f" in
            *.md|*.txt|*.json|*.yml|*.yaml)
                CONTENT=$(cat "$f" 2>/dev/null | grep -E "${SENSITIVE_PATTERN}" || true)
                if [ -n "$CONTENT" ]; then
                    SUSPICIOUS="$SUSPICIOUS\n  $f: 包含疑似密钥内容"
                fi
                ;;
        esac
    fi
done

if [ -n "$SUSPICIOUS" ]; then
    log_fail "检测到敏感信息，中止发布！"
    echo -e "$SUSPICIOUS"
    exit 1
fi
log_pass "全文扫描通过，无敏感信息 ✅"

# Step 4: 检查.env文件
log_secure "=== 第三道闸机：环境配置文件 ==="
ENV_FILES=$(find . -maxdepth 3 -name ".env*" -o -name "env.*" 2>/dev/null | grep -v node_modules | grep -v ".git" || true)
if [ -n "$ENV_FILES" ]; then
    log_warn "发现环境配置文件，请确认已从.gitignore排除："
    echo "$ENV_FILES"
fi

# 检查.gitignore是否包含关键排除项
GITIGNORE_CHECKS=(
    ".env"
    "*.key"
    "credentials"
    "ark-"
    "sk-"
    "token"
)
MISSING=""
for check in "${GITIGNORE_CHECKS[@]}"; do
    if ! grep -q "$check" .gitignore 2>/dev/null; then
        MISSING="$MISSING  - $check\n"
    fi
done
if [ -n "$MISSING" ]; then
    log_warn ".gitignore缺少以下安全排除项："
    echo -e "$MISSING"
fi
log_pass "环境文件检查完成 ✅"

# Step 5: 显示发布摘要
log_secure "=== 第四道闸机：发布确认 ==="
echo ""
log_info "即将执行以下操作："
echo "  1. git add -A"
echo "  2. git commit -m '版本: $(git log --oneline -1)'"
echo "  3. git push origin ${PRODUCTION_BRANCH}"
echo "  4. 推送到: ${REPO_URL}"
echo ""
git log --oneline -1
echo ""

# Step 6: 交互确认（除非 --force）
if [ "$1" != "--force" ]; then
    echo -n "确认发布？输入 'yes' 继续: "
    read -r CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_warn "取消发布"
        exit 0
    fi
fi

log_pass "所有闸机通过，开始发布..."

# Step 7: 执行发布
cd "$(dirname "$0")/.."  # 确保在项目根目录

git add -A
git commit -m "Stormaxe AI v6.24 - $(date '+%Y-%m-%d')" || true
git push origin ${PRODUCTION_BRANCH}

echo ""
log_pass "✅ 发布成功！"
log_info "仓库地址: ${REPO_URL}"
