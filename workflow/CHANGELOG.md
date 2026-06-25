# Changelog

## v5.1 - AI-Radar Supabase 集成
- **新增** `ai_radar_supabase_reader_node` — 从 AI-Radar Supabase `products` 表直接读取
- **新增** `AIRadarSupabaseInput/Output` 状态类型
- **目标**：让 LangGraph workflow **优先消费** crawler 已抓取的数据，避免重复请求

## v5.0.1 - 周报实时兜底
- weekly_report_node 在 Bitable 为空时自动调用 fetcher 函数拉 7 天数据
- 修复 _make_unicode_bar_chart tuple 类型错误

## v5.0 - 多源数据融合
- 新增 3 个 fetcher 节点：trendradar_fetcher / aihot_fetcher
- 新增 natural_query_expander（自然语言查询展开）
- 新增 multi_source_aggregator（4D 评分 + 五层漏斗分类）
- 新增 multi_source_mapping（兼容下游 event_dedup）
- 移植 AI-Radar 的 classifier-v2 + score 逻辑到 Python

## v4.11 - 周报专业行业模板
- 重写 weekly_report_llm_cfg.json SP/UP，要求 LLM 输出结构化 JSON
- 新增 _parse_weekly_llm_output / _render_weekly_card
- 5 大段：摘要/数据概览/TOP5/趋势/预判/量化指标

## v4.10 - 反馈深度学习
- feedback_reader_node 双源读取：用户行为 + 推送频次降权
- 防止过滤气泡

## v4.9 - 付费墙验证
- user_tier: free / pro 字段
- free 用户速览 5 条 + 升级提示
- pro 用户完整 15 条

## v4.8.1 - LLMClient 1.0 兼容性
- 修复 weekly_report_node 的 LLMClient API 错误
