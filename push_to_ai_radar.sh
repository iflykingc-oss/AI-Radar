#!/bin/bash
# ============================================================
# 推送 workflow 模块到 AI-Radar 仓库
# ============================================================
# 使用前请先：
# 1. 配置 GitHub 凭据（推荐 SSH key 或 PAT）
# 2. 确认 push 权限（maintainer 才能直接 push main）
# 3. 建议用 PR 模式：先 push 到新分支，PR 后再合并
# ============================================================

set -e

REPO_DIR="/tmp/ai-radar"
BRANCH_NAME="feat/workflow-langgraph-v5.1"
COMMIT_MSG="feat(workflow): integrate LangGraph workflow v5.1

- Add workflow/ module: LangGraph 1.0 Python workflow
- New ai_radar_supabase_reader_node: read from AI-Radar Supabase products
- Multi-source fusion: Web Search + TrendRadar + AI-HotRadar
- Natural language query support
- Weekly report real-time fallback
- Paywall (free/pro) + feedback deep learning
- 4D scoring + 5-layer funnel classification (ported from crawler)
- Full docs: workflow/README.md, AGENTS.md, CHANGELOG.md

Tested: 4 products x daily/weekly x free/pro all pass"

cd "$REPO_DIR"

echo "==> 1. 创建分支 $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

echo "==> 2. 添加 workflow/ 目录"
git add workflow/ PULL_REQUEST.md README.md .vercelignore

echo "==> 3. 提交"
git commit -m "$COMMIT_MSG"

echo ""
echo "============================================"
echo "✅ 准备就绪！"
echo "============================================"
echo ""
echo "接下来请选其一执行："
echo ""
echo "【方式 A】直接推送到远端（需 push main 权限）："
echo "    git push -u origin $BRANCH_NAME"
echo ""
echo "【方式 B】在 GitHub 网页创建 PR："
echo "    1. 推送到你的 fork:"
echo "       git push https://github.com/<your-username>/AI-Radar.git $BRANCH_NAME"
echo "    2. 访问 https://github.com/iflykingc-oss/AI-Radar/compare/main...$BRANCH_NAME"
echo "    3. 复制 PULL_REQUEST.md 内容作为 PR 描述"
echo ""
echo "查看变更统计："
git diff --stat main
echo ""
