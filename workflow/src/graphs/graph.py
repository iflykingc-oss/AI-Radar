"""
主图编排（v5.0 多源数据融合版）
支持 3 个产品：ai_daily / overseas_ceo / global_ai
支持 3 种运行类型：daily（日报） / weekly（周报） / curve（主题热度曲线）

v5.0 架构升级（融合 AI-Radar + TrendRadar + AI-HotRadar）：
- 自然语言查询扩展：用户可用自然语言描述需求，LLM 动态展开为关键词
- 三源并行抓取：Web Search + TrendRadar(35+平台热搜) + AI-HotRadar(AI垂直社区)
- 多源聚合 + 4D评分：新鲜度/多源/互动/内容质量四维评分
- 五层漏斗分类：product / paper / news / discussion / article

v4.4 架构升级：
- analyze_and_push 拆分为 4 个职责单一节点
- history_reader：读Bitable历史
- analyze_llm：LLM分析+URL去重+主题统计+合并趋势
- format_card：构建飞书卡片
- feishu_pusher：推送到飞书

v4.5 Harness 引入：
- 关键节点加重试（指数退避）
- 关键节点加降级（卡片→text/主模型→小模型）
- 关键节点加可观测性（耗时+指标）

v4.6 反馈机制：
- 新增 feedback_reader_node：从 Bitable 读"反馈聚合表"
- 链路：search_news → [event_dedup, feedback_reader] → filter_news（并行）
- filter_news_node：读 state.feedback_signals，LLM prompt 提示偏好，筛选后应用加权

流程：
- daily:  load_product -> search_news -> [event_dedup, feedback_reader] -> filter_news
         -> write_to_bitable -> trend_analysis -> history_reader -> analyze_llm
         -> format_card -> feishu_pusher
- weekly: load_product -> weekly_report
- curve:  load_product -> heat_curve
"""
import os
import logging
from langgraph.graph import StateGraph, END
from graphs.state import (
    GlobalState,
    GraphInput,
    GraphOutput,
)
from graphs.nodes.load_product_node import load_product_node
# v5.0：自然语言查询扩展 + 多源融合
from graphs.nodes.natural_query_expander_node import natural_query_expander_node
from graphs.nodes.search_news_node import search_news_node
from graphs.nodes.trendradar_fetcher_node import trendradar_fetcher_node
from graphs.nodes.aihot_fetcher_node import aihot_fetcher_node
from graphs.nodes.multi_source_aggregator_node import multi_source_aggregator_node
from graphs.nodes.multi_source_mapping_node import multi_source_mapping_node
from graphs.nodes.event_dedup_node import event_dedup_node
from graphs.nodes.filter_news_node import filter_news_node
from graphs.nodes.feedback_reader_node import feedback_reader_node
from graphs.nodes.write_to_bitable_node import write_to_bitable_node
from graphs.nodes.trend_analysis_node import trend_analysis_node
from graphs.nodes.history_reader_node import history_reader_node
from graphs.nodes.analyze_llm_node import analyze_llm_node
from graphs.nodes.format_card_node import format_card_node
from graphs.nodes.feishu_pusher_node import feishu_pusher_node
from graphs.nodes.weekly_report_node import weekly_report_node
from graphs.nodes.heat_curve_node import heat_curve_node
from graphs.nodes.cross_product_overlap_node import cross_product_overlap_node

logger = logging.getLogger(__name__)


def route_by_run_type(state: GlobalState) -> str:
    """
    title: 运行类型路由
    desc: 根据 run_type 字段决定走日报全流程/周报/主题热度曲线
    """
    run_type = (state.run_type or "daily").lower()
    if run_type == "weekly":
        return "走周报"
    if run_type == "curve":
        return "走曲线"
    return "走日报"


# 创建状态图（一定指定工作流的入参和出参）
builder = StateGraph(GlobalState, input_schema=GraphInput, output_schema=GraphOutput)

# 添加节点
builder.add_node("load_product", load_product_node)
# v5.0: 自然语言查询扩展 → 3 源并行 → 多源聚合
builder.add_node("natural_query_expander", natural_query_expander_node, metadata={"type": "agent", "llm_cfg": ""})
builder.add_node("search_news", search_news_node)
builder.add_node("trendradar_fetcher", trendradar_fetcher_node, metadata={"type": "task"})
builder.add_node("aihot_fetcher", aihot_fetcher_node, metadata={"type": "task"})
builder.add_node("multi_source_aggregator", multi_source_aggregator_node, metadata={"type": "task"})
builder.add_node("multi_source_mapping", multi_source_mapping_node, metadata={"type": "task"})
builder.add_node("event_dedup", event_dedup_node)
# v4.6：新增反馈读取节点
builder.add_node("feedback_reader", feedback_reader_node, metadata={"type": "task"})
builder.add_node("filter_news", filter_news_node)
builder.add_node("write_to_bitable", write_to_bitable_node, metadata={"type": "task"})
builder.add_node("trend_analysis", trend_analysis_node)
# v4.4: analyze_and_push 拆分为 4 个职责单一节点
builder.add_node("history_reader", history_reader_node, metadata={"type": "task"})
# v4.8：跨产品关联分析节点（基于本周/上周主题词对比，零 LLM 调用）
builder.add_node("cross_product_overlap", cross_product_overlap_node, metadata={"type": "task"})
builder.add_node("analyze_llm", analyze_llm_node, metadata={"type": "agent", "llm_cfg": "config/analysis_llm_cfg.json"})
builder.add_node("format_card", format_card_node, metadata={"type": "task"})
builder.add_node("feishu_pusher", feishu_pusher_node, metadata={"type": "task"})
builder.add_node("weekly_report", weekly_report_node, metadata={"type": "agent", "llm_cfg": "config/weekly_report_llm_cfg.json"})
builder.add_node("heat_curve", heat_curve_node, metadata={"type": "task"})

# 设置入口点
builder.set_entry_point("load_product")

# 入口节点后根据 run_type 路由
builder.add_conditional_edges(
    source="load_product",
    path=route_by_run_type,
    path_map={
        "走日报": "natural_query_expander",
        "走周报": "weekly_report",
        "走曲线": "heat_curve",
    },
)

# ====== v5.0 日报流程：自然语言扩展 → 三源并行 → 多源聚合 → 后续 ======
# 1. 自然语言查询扩展 → 3 源并行抓取
builder.add_edge("natural_query_expander", "search_news")
builder.add_edge("natural_query_expander", "trendradar_fetcher")
builder.add_edge("natural_query_expander", "aihot_fetcher")
# 2. 三源汇聚到多源聚合器
builder.add_edge(["search_news", "trendradar_fetcher", "aihot_fetcher"], "multi_source_aggregator")
# 3. 多源聚合 → 映射 → 进入原有日报管线（event_dedup + feedback_reader 并行）
builder.add_edge("multi_source_aggregator", "multi_source_mapping")
builder.add_edge("multi_source_mapping", "event_dedup")
builder.add_edge("multi_source_aggregator", "feedback_reader")
builder.add_edge(["event_dedup", "feedback_reader"], "filter_news")

# v4.7：filter_news 后分叉为 write_to_bitable + trend_analysis + history_reader（三者并行）
# - write_to_bitable：写入新数据（写操作）
# - trend_analysis：读历史做趋势对比（统计式，无LLM）
# - history_reader：读历史做URL去重
# 三个 task 都从 GlobalState 拿 product_id，trend/history 通过 resolve_product_bitable
# 主动按 product_id 查找 base（不再串行等待 app_token/table_id）
builder.add_edge("filter_news", "write_to_bitable")
builder.add_edge("filter_news", "trend_analysis")
builder.add_edge("filter_news", "history_reader")
# analyze_llm 必须等三者全部完成
builder.add_edge(["write_to_bitable", "trend_analysis", "history_reader"], "analyze_llm")

builder.add_edge(["write_to_bitable", "trend_analysis", "history_reader"], "cross_product_overlap")
builder.add_edge(["write_to_bitable", "trend_analysis", "history_reader"], "analyze_llm")
builder.add_edge(["cross_product_overlap", "analyze_llm"], "format_card")

builder.add_edge("analyze_llm", "format_card")
builder.add_edge("format_card", "feishu_pusher")
builder.add_edge("feishu_pusher", END)

# 周报/曲线 终点
builder.add_edge("weekly_report", END)
builder.add_edge("heat_curve", END)

# 编译图
main_graph = builder.compile()
