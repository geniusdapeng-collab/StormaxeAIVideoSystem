#!/bin/bash
# 🔥 PromptForge v2.1 生产固化脚本 — run-promptforge.sh
# 
# 使用方式：
#   ./run-promptforge.sh [production-dir]
#   默认：/root/.openclaw/workspace/productions/xingtian
#
# 功能：
#   1. 加载 story-plan.json
#   2. 调用 PromptForge Orchestrator v2.1 (Writer + DP + Compressor)
#   3. 生成 8 个镜头的提示词
#   4. 写入 story-plan.json 和 04-prompts/

set -e

PRODUCTION_DIR="${1:-/root/.openclaw/workspace/productions/xingtian}"
SCRIPT_DIR="/root/.openclaw/workspace/skills/shanhaijing-promptforge/scripts"

echo "🔥 PromptForge v2.1 生产链路 — 启动"
echo "========================================"
echo "📁 生产目录: $PRODUCTION_DIR"
echo "⏱️  开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查文件
echo "📋 检查环境..."
if [ ! -f "$PRODUCTION_DIR/01-story/story-plan.json" ]; then
    echo "❌ 错误: story-plan.json 不存在"
    exit 1
fi

echo "   ✅ story-plan.json 存在"

if [ ! -f "$SCRIPT_DIR/promptforge-orchestrator.js" ]; then
    echo "❌ 错误: promptforge-orchestrator.js 不存在"
    exit 1
fi

echo "   ✅ Orchestrator 存在"

# 运行 Orchestrator
echo ""
echo "🚀 启动 PromptForge v2.1..."
echo ""

node "$SCRIPT_DIR/promptforge-orchestrator.js" "$PRODUCTION_DIR"

echo ""
echo "========================================"
echo "✅ 提示词生成完成！"
echo "📁 输出位置: $PRODUCTION_DIR/04-prompts/"
echo "⏱️  完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "下一步：提交 Seedance 渲染"
echo "========================================"