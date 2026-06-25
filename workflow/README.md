# AI-Radar Workflow Module

> AI 情报决策引擎（LangGraph 工作流层）— 消费 AI-Radar crawler 的输出，生成行业决策日报/周报

## 定位

AI-Radar 仓库 = 三个并列模块：

| 模块 | 技术栈 | 职责 |
|------|--------|------|
| `crawler/` | TypeScript | 15 个数据源抓取 + 4D 评分 + 去重 + 分类，写入 Supabase |
| `frontend/` | Next.js 14 | Web 端产品发现/对比/趋势可视化 |
| **`workflow/`（本模块）** | **Python · LangGraph 1.0** | **从 Supabase 读取 → AI 深度分析 → 飞书/邮件/公众号推送** |

## 核心能力

1. **多源融合**：直接消费 AI-Radar Supabase `products` 表（**无需重复抓取**），同时保留 TrendRadar / AI-HotRadar / Web Search 作为补充信源
2. **自然语言查询**：用户用一句话描述想看的趋势，LLM 自动展开为 5-10 个中英文关键词
3. **4D 评分 + 五层漏斗分类**（移植自 crawler）：新鲜度 / 多源验证 / 互动 / 质量
4. **三个产品线**：中文 AI 早报 / 出海 CEO 早报 / 国际 AI 洞察
5. **日报 + 周报双模式**：日报 1 天数据，周报 7 天数据（Bitable 为空时实时多源兜底）
6. **付费墙（v4.9）**：Free 用户速览 5 条 + 升级提示，Pro 用户完整 15 条
7. **反馈深度学习（v4.10）**：用户 👍/👎 + 推送频次降权，避免过滤气泡
8. **飞书卡片推送**：含 3 个 action 按钮 + 周报专业行业模板

## 快速开始

```bash
# 1. 安装依赖
uv sync

# 2. 配置环境变量
cp .env.example .env
# SUPABASE_URL=          # AI-Radar 同一 Supabase
# SUPABASE_SERVICE_KEY=  # service role key
# FEISHU_WEBHOOK_URL=    # 飞书机器人 webhook

# 3. 启动
bash scripts/http_run.sh
# → http://localhost:5000
```

## 与 crawler 的双向数据流

```
crawler (TypeScript, 每6h)
    ↓
[Supabase products]
    ↓
workflow.ai_radar_supabase_reader_node ← 优先读这里
    ↓ (如Supabase无凭据/数据为空)
[trendradar/aihot/websearch fetcher] ← 兜底
    ↓
multi_source_aggregator (去重 + 4D评分 + 五层分类)
    ↓
event_dedup → filter_news → analyze_llm → feishu_pusher
```

## 核心节点

详见 [`AGENTS.md`](./AGENTS.md) 的"节点清单"章节。

## 集成状态

- ✅ v5.0 多源融合（Web Search + TrendRadar + AI-HotRadar）
- ✅ v5.0.1 周报实时兜底
- ✅ v5.1 **AI-Radar Supabase 直读**（与 crawler 共享数据）
- ⏳ v5.2 写回分析结果到 Supabase（让 frontend 可视化 workflow 的分析）
- ⏳ v5.3 反向推荐：crawler 抓到的产品被 workflow 标记为"高价值"后，前端置顶

## License

MIT
