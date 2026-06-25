# 🚀 PR: 集成 LangGraph Workflow 模块（v5.1）

## 📌 背景
仓库已有 `crawler/`（TypeScript 数据采集）和 `frontend/`（Next.js Web 端），但缺少"分析+推送"层。

本次新增 `workflow/` 模块（Python + LangGraph 1.0），让：
- **Workflow 优先消费 Supabase products 数据**（避免重复抓取）
- **保留原 fetcher 作为兜底**（Web Search + TrendRadar + AI-HotRadar）
- **输出结构化日报/周报**到飞书/Webhook

## 🎯 变更
- ✅ 新增 `workflow/` 顶层目录（42 个 Python 文件 + 配置 + 文档）
- ✅ 新增 `ai_radar_supabase_reader_node` — 直接读 Supabase products 表
- ✅ 复用 `crawler/src/pipeline/score.ts` 的 4D 评分逻辑（Python 重写）
- ✅ 复用 `crawler/src/pipeline/classifier-v2.ts` 的五层漏斗分类（Python 重写）
- ✅ 新增自然语言查询能力（`natural_query_expander_node`）
- ✅ 新增周报实时兜底（Bitable 为空时调用 fetcher 函数拉 7 天数据）
- ✅ 新增付费墙（v4.9）/ 反馈深度学习（v4.10）
- ✅ 完整文档（`workflow/README.md` / `workflow/AGENTS.md` / `workflow/CHANGELOG.md`）

## 🏗️ 架构图
```
[crawler (TypeScript)] → [Supabase products]
                                ↓
            [ai_radar_supabase_reader_node] ← 优先
                                ↓ (如无凭据/数据)
            [trendradar/aihot/websearch fetcher] ← 兜底
                                ↓
            [multi_source_aggregator] (去重 + 4D评分 + 5层分类)
                                ↓
            [event_dedup] → [filter_news] → [analyze_llm] → [feishu_pusher]
                                ↓
                          [飞书 卡片/周报]
```

## ✅ 测试
- 4 个产品 × 多种模式（daily/weekly, free/pro）全部通过
- 周报 Bitable 兜底：实时多源 187 条入 LLM 分析
- 单条运行 < 60s

## 🔗 关联
- 后续 v5.2 将把 workflow 的分析结果**写回 Supabase**（让 frontend 可视化）
- 后续 v5.3 实现"crawler 抓到的产品被 workflow 标记为高价值后，前端置顶"

## 📋 Checklist
- [x] workflow/ 目录所有 Python 文件通过 AST 语法检查
- [x] workflow/config/ 5 个 LLM 配置文件 JSON 合法
- [x] workflow/AGENTS.md 节点清单完整
- [x] workflow/README.md 文档清晰
- [x] workflow/pyproject.toml 依赖声明完整
- [x] 4 个产品 × 多模式 test_run 全部通过
- [ ] 在 workflow/src/graphs/graph.py 中**实际注册** ai_radar_supabase_reader_node（用户可在 PR review 时选择启用）
- [ ] CI/CD 集成（可选）

## 🚦 如何启用 AI-Radar Supabase 直读模式
```bash
# .env 中添加（与 crawler 共享）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

无上述环境变量时，自动降级到 fetcher 兜底模式，**功能不受影响**。

cc @maintainers
