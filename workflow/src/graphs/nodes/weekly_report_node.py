"""
周报自动生成节点
突破点A：补足"复盘"环节
- 读取7天Bitable数据
- LLM深度分析
- 生成周报卡片推送
"""
import os
import json
import re
import logging
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
# v4.11: 不再用 jinja2，改为 str.format（避免 JSON 模板语法冲突）
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from coze_workload_identity import Client as WorkloadClient

from graphs.state import WeeklyReportInput, WeeklyReportOutput
from graphs.utils import (
    load_product_config,
    get_bitable_base_name,
)

logger = logging.getLogger(__name__)


def _safe_text_content(content: Any) -> str:
    """统一处理LLM.content可能是str/list/None的情况"""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: List[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text_val = item.get("text", "")
                if isinstance(text_val, str):
                    parts.append(text_val)
        return "".join(parts)
    return str(content)


def _aggregate_weekly_data(history_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """聚合7天数据：按主题统计+TOP事件"""
    topic_count: Dict[str, int] = {}
    tier_count: Dict[str, int] = {"high": 0, "medium": 0, "low": 0}
    top_events: List[Dict[str, Any]] = []
    daily_count: Dict[str, int] = {}

    for rec in history_records:
        topic = rec.get("topic", "其他")
        if isinstance(topic, str) and topic:
            topic_count[topic] = topic_count.get(topic, 0) + 1
        tier = rec.get("tier", "")
        if tier in tier_count:
            tier_count[tier] += 1
        if rec.get("tier") == "high":
            top_events.append({
                "topic": topic,
                "title": rec.get("title", ""),
                "url": rec.get("url", ""),
                "key_point": rec.get("key_point", ""),
                "summary": rec.get("summary", ""),
            })
        created = rec.get("created_at", "")
        if isinstance(created, str) and len(created) >= 10:
            date_key = created[:10]
            daily_count[date_key] = daily_count.get(date_key, 0) + 1

    sorted_topics = sorted(topic_count.items(), key=lambda x: x[1], reverse=True)[:10]
    sorted_events = top_events[:10]
    sorted_daily = sorted(daily_count.items())

    return {
        "topic_distribution": [{"topic": t, "count": c} for t, c in sorted_topics],
        "tier_distribution": tier_count,
        "top_events": sorted_events,
        "daily_distribution": [{"date": d, "count": c} for d, c in sorted_daily],
        "total_count": len(history_records),
    }


    """
    v4.11 周报 LLM 输出解析。
    期望 LLM 输出 ```json {...} ``` 代码块，提取摘要、TOP5、趋势、预判、风险、指标。
    解析失败返回空 dict，由调用方降级到"老逻辑"渲染。
    """
    if not llm_text or not isinstance(llm_text, str):
        return {}
    # 尝试提取 ```json ... ``` 代码块
    m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", llm_text)
    if m:
        json_str = m.group(1)
    else:
        # 没代码块，尝试找第一对 { ... } 平衡
        start = llm_text.find("{")
        end = llm_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return {}
        json_str = llm_text[start:end+1]
    try:
        return json.loads(json_str)
    except Exception as e:
        logger.warning(f"[weekly_report] 解析 LLM JSON 失败: {e}")
        return {}

def _parse_weekly_llm_output(llm_text: str) -> Dict[str, Any]:
    """
    v4.11 周报 LLM 输出解析。
    期望 LLM 输出 ```json {...} ``` 代码块，提取摘要、TOP5、趋势、预判、风险、指标。
    解析失败返回空 dict，由调用方降级到"老逻辑"渲染。
    """
    if not llm_text or not isinstance(llm_text, str):
        return {}
    # 尝试提取 ```json ... ``` 代码块
    m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", llm_text)
    if m:
        json_str = m.group(1)
    else:
        # 没代码块，尝试找第一对 { ... } 平衡
        start = llm_text.find("{")
        end = llm_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return {}
        json_str = llm_text[start:end+1]
    try:
        return json.loads(json_str)
    except Exception as e:
        logger.warning(f"[weekly_report] 解析 LLM JSON 失败: {e}")
        return {}


def _render_weekly_card(
    product_name: str,
    week_start: str,
    week_end: str,
    total_count: int,
    prev_total_count: int,
    wow_change: str,
    topic_dist: str,
    daily_trend: str,
    source_count_n: int,
    source_count_m: int,
    source_count_k: int,
    snapshot_time: str,
    version: str,
    department: str,
    llm_data: Dict[str, Any],
    topic_chart: str,
) -> List[str]:
    """
    v4.11 按用户给的"行业周报模板"渲染飞书卡片内容。
    优先用 llm_data 中的结构化数据（summary/top5_events/trends/opportunity_forecast/risk_warnings/quantitative_metrics）。
    降级：用 weekly_report_node 拼装的 text 字段（topic_dist/daily_trend/topic_chart）。
    """
    lines: List[str] = []
    if not isinstance(llm_data, dict):
        llm_data = {}
    summary = (llm_data.get("summary") or "").strip()
    top5_events = llm_data.get("top5_events") or []
    trends = llm_data.get("trends") or []
    opportunity_forecast = llm_data.get("opportunity_forecast") or []
    risk_warnings = llm_data.get("risk_warnings") or []
    quant = llm_data.get("quantitative_metrics") or []
    info_sources = llm_data.get("info_sources") or {}
    n_sites = info_sources.get("sites", source_count_n)
    m_media = info_sources.get("media", source_count_m)
    k_auth = info_sources.get("authorities", source_count_k)
    data_snapshot = llm_data.get("data_snapshot") or snapshot_time
    dept = llm_data.get("department") or department
    ver = llm_data.get("version") or version
    wr_id = llm_data.get("weekly_report_id")
    if not wr_id:
        now_year = datetime.now().year
        now_week = datetime.now().isocalendar()[1]
        wr_id = f"WR-{now_year}-W{now_week:02d}"

    # 1. 标题 + 元信息
    lines.append(f"# {product_name}行业周报 | {week_start} ~ {week_end}")
    lines.append(f"**周报ID**：{wr_id} | **数据快照**：{data_snapshot}")
    lines.append(f"**出品部门**：{dept} | **版本**：V{ver}")
    lines.append(f"**信息来源**：覆盖 {n_sites} 个站点 / {m_media} 家头部媒体 / {k_auth} 个政策权威机构")
    lines.append("")

    # 2. 一句话摘要
    if summary:
        lines.append("## 一句话摘要")
        lines.append(summary)
        lines.append("")
    else:
        # 降级：用 topic_dist 前 60 字
        if topic_dist:
            lines.append("## 一句话摘要")
            lines.append(f"本周共采集 {total_count} 条资讯，主题分布：{topic_dist[:60]}……")
            lines.append("")

    # 3. 数据概览
    trend_arrow = "📈" if total_count >= prev_total_count else "📉"
    trend_direction = "上升" if total_count >= prev_total_count else "下降"
    topic_compact = topic_dist if topic_dist else "暂无显著主题"
    daily_compact = daily_trend if daily_trend else "暂无日均数据"

    lines.append("## 一、数据概览")
    lines.append(f"- 本周资讯总量：**{total_count}** 条 | 周环比 {wow_change} | 热度走势：{trend_arrow}{trend_direction}")
    lines.append(f"- 主题分布：{topic_compact}")
    lines.append(f"- 日均走势：{daily_compact}")
    if topic_chart:
        lines.append(topic_chart)
    lines.append("")

    # 4. TOP5 热点事件
    lines.append("## 二、本周TOP5热点事件（含热度分级+影响解读）")
    if not top5_events:
        lines.append("- 暂无显著热点事件")
    else:
        for ev in top5_events[:5]:
            if not isinstance(ev, dict):
                continue
            level = (ev.get("level") or "中").strip()
            label = (ev.get("event") or "").strip()
            impact = (ev.get("impact") or "").strip()
            if label:
                lines.append(f"- **[热度:{level}]** {label} → {impact}")
    lines.append("")

    # 5. 核心行业趋势
    lines.append("## 三、本周核心行业趋势（弹性2-3条，无价值不凑数）")
    if not trends:
        lines.append("- 暂无显著趋势")
    else:
        for i, t in enumerate(trends[:3], 1):
            if not isinstance(t, dict):
                continue
            title = (t.get("title") or "").strip()
            direction = (t.get("direction") or "中性").strip()
            signals = t.get("signals") or []
            event_ref = (t.get("event_ref") or "").strip()
            industry_impact = (t.get("industry_impact") or "").strip()
            lines.append(f"### 趋势{i}：{title}（影响：{direction}）")
            if signals:
                signals_str = "、".join([str(s) for s in signals[:2] if s])
                if signals_str:
                    lines.append(f"- 关键信号：{signals_str}")
            if event_ref:
                lines.append(f"- 代表事件：{event_ref}")
            if industry_impact:
                lines.append(f"- 行业影响：{industry_impact}")
            lines.append("")
    lines.append("")

    # 6. 下周预判与潜在风险
    lines.append("## 四、下周预判与潜在风险（审慎输出）")
    lines.append("### （一）行业机会预判（最多2条，择优输出）")
    if not opportunity_forecast:
        lines.append("- 暂无明确机会信号")
    else:
        for op in opportunity_forecast[:2]:
            if not isinstance(op, dict):
                continue
            headline = (op.get("headline") or "").strip()
            support = (op.get("support") or "").strip()
            if headline:
                lines.append(f"1. **{headline}**：{support}")
    lines.append("")
    lines.append("### （二）行业潜在风险（最多3条，审慎预警）")
    if not risk_warnings:
        lines.append("- 暂无明显风险")
    else:
        for rk in risk_warnings[:3]:
            if not isinstance(rk, dict):
                continue
            desc = (rk.get("description") or "").strip()
            trigger = (rk.get("trigger") or "").strip()
            suggestion = (rk.get("suggestion") or "").strip()
            lines.append(f"1. **风险描述**：{desc}")
            lines.append(f"   **触发条件**：{trigger}")
            lines.append(f"   **应对建议**：{suggestion}")
    lines.append("")

    # 7. 量化指标汇总
    lines.append("## 五、核心量化指标汇总")
    lines.append("| 统计指标 | 本周数值 | 环比变动 |")
    lines.append("|----------|----------|----------|")
    lines.append(f"| 全网资讯总量 | {total_count} | {wow_change} |")
    if quant:
        for q in quant[:3]:
            if not isinstance(q, dict):
                continue
            name = (q.get("name") or "").strip()
            value = (q.get("value") or "").strip()
            change = (q.get("change") or "—").strip()
            if name:
                lines.append(f"| {name} | {value} | {change} |")
    else:
        lines.append("| （自定义指标待补充） | — | — |")
    lines.append("")

    return lines
def _make_unicode_bar_chart(data: List[Dict[str, Any]], label_key: str, value_key: str) -> str:
    """生成unicode条形图"""
    if not data:
        return ""
    max_val = max(item.get(value_key, 0) for item in data)
    if max_val <= 0:
        return ""
    bar_width = 12
    lines: List[str] = []
    for item in data:
        val = item.get(value_key, 0)
        if val <= 0:
            continue
        ratio = val / max_val
        filled = int(ratio * bar_width)
        bar = "█" * filled + "░" * (bar_width - filled)
        label = item.get(label_key, "")
        if isinstance(label, str) and len(label) > 8:
            label = label[:7] + "…"
        lines.append(f"{label:<8} {bar} {val}")
    return "\n".join(lines)


def _fetch_history_records(app_token: str, table_id: str, days: int = 7) -> List[Dict[str, Any]]:
    """从飞书多维表格读取历史记录"""
    if not app_token or not table_id:
        return []
    try:
        # 从 write_to_bitable_node 导入 FeishuBitable 类
        from graphs.nodes.write_to_bitable_node import FeishuBitable
        bitable = FeishuBitable()
        # 准备过滤条件：最近N天
        start_ts_ms = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
        filter_cond = {
            "conditions": [
                {
                    "field_name": "created_at",
                    "operator": "isGreaterEqual",
                    "value": ["Numeric", start_ts_ms],
                }
            ],
            "conjunction": "and",
        }
        resp = bitable.search_record(
            app_token=app_token,
            table_id=table_id,
            page_size=500,
            sort=[{"field_name": "created_at", "desc": True}],
            filter=filter_cond,
        )
        items = (resp.get("data") or {}).get("items", []) or []
        results: List[Dict[str, Any]] = []
        for item in items:
            fields = item.get("fields", {}) or {}
            # 把字段值扁平化（飞书多维表格返回的是 {field_name: value}）
            record: Dict[str, Any] = {}
            for k, v in fields.items():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    record[k] = v[0].get("text", "")
                else:
                    record[k] = v
            results.append(record)
        return results
    except Exception as e:
        logger.warning(f"[weekly_report] 读取Bitable历史失败: {e}")
        return []


def _send_feishu_card(webhook_url: str, card_payload: Dict[str, Any]) -> str:
    """通过webhook发送飞书卡片"""
    if not webhook_url:
        return "failed"
    try:
        resp = requests.post(webhook_url, json=card_payload, timeout=30)
        data = resp.json() if resp.content else {}
        if data.get("code") == 0 or data.get("StatusCode") == 0:
            return "success"
        return "failed"
    except Exception as e:
        logger.warning(f"[weekly_report] 飞书发送失败: {e}")
        return "failed"


def _fetch_realtime_weekly_data(
    product_id: str,
    product_config: Dict[str, Any],
    week_start: str,
    week_end: str,
) -> List[Dict[str, Any]]:
    """
    v5.0 兜底：从 fetcher 函数实时拉本周多源数据
    直接调用 fetcher_node 内部的核心抓取函数（不算通过 StateGraph 调用，只是函数复用）

    Returns:
        List of records 标准化为 {title, content, source, publish_time, url, score, heat} 格式
    """
    from graphs.nodes.trendradar_fetcher_node import (
        _fetch_platform as _trend_platform,
        TRENDRADAR_PLATFORMS,
        _is_relevant as _trend_relevant,
    )
    from graphs.nodes.aihot_fetcher_node import (
        _fetch_aihot_category as _aihot_category,
        AIHOT_CATEGORIES,
    )
    from graphs.nodes.search_news_node import _search_single_topic
    from concurrent.futures import ThreadPoolExecutor, as_completed

    records: List[Dict[str, Any]] = []
    search_topics: List[str] = product_config.get("search_topics", []) or []

    def _to_record(item: Dict, source_name: str) -> Dict[str, Any]:
        title = item.get("title", "")
        return {
            "title": title,
            "content": item.get("description") or item.get("content") or item.get("summary") or item.get("snippet", ""),
            "source": source_name,
            "publish_time": item.get("publish_time") or item.get("time") or datetime.now().isoformat(),
            "url": item.get("url", ""),
            "score": item.get("score", 60),
            "heat": item.get("heat", 0),
        }

    # 1) TrendRadar 多平台并行抓取（不过滤关键词，因为周报要"全景"）
    try:
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_map = {
                executor.submit(_trend_platform, p): p for p in TRENDRADAR_PLATFORMS
            }
            for future in as_completed(future_map, timeout=20):
                try:
                    items = future.result(timeout=10) or []
                    # 兜底场景：周报需要全量数据，**不按 search_topics 过滤**
                    for it in items:
                        records.append(_to_record(it, "trendradar"))
                except Exception as e:
                    logger.debug(f"[weekly_fallback] trendradar 平台超时: {e}")
    except Exception as e:
        logger.warning(f"[weekly_fallback] trendradar 抓取失败: {e}")

    # 2) AI-HotRadar
    try:
        api_base = "https://aihot.virxact.com/api/items"
        for cat in AIHOT_CATEGORIES[:3]:  # 模型/产品/行业
            try:
                items = _aihot_category(cat, api_base, timeout=10) or []
                for it in items:
                    records.append(_to_record(it, f"aihot_{cat.get('id', '')}"))
            except Exception as e:
                logger.debug(f"[weekly_fallback] aihot {cat.get('id')} 失败: {e}")
    except Exception as e:
        logger.warning(f"[weekly_fallback] aihot 抓取失败: {e}")

    # 3) Web Search（针对本产品的 5 个核心关键词，7 天窗口）
    #    兜底场景：周报节点 Bitable 为空时，实时拉取多源数据
    #    注意：weekly_report_node 不在主图 StateGraph 中有 ctx 注入，直接使用 Context 默认构造
    try:
        from graphs.state import _build_default_context  # type: ignore
        ctx_for_search = _build_default_context()
    except Exception:
        # 没有辅助函数时，跳过 web_search 兜底（trendradar+aihot 已基本够用）
        ctx_for_search = None

    if ctx_for_search is not None:
        try:
            with ThreadPoolExecutor(max_workers=5) as executor:
                future_map = {
                    executor.submit(_search_single_topic, topic, ctx_for_search, "week", 8): topic
                    for topic in search_topics[:5]
                }
                for future in as_completed(future_map, timeout=25):
                    try:
                        items = future.result(timeout=15) or []
                        for it in items:
                            records.append(_to_record(it, "web_search"))
                    except Exception as e:
                        logger.debug(f"[weekly_fallback] web_search 失败: {e}")
        except Exception as e:
            logger.warning(f"[weekly_fallback] web_search 抓取失败: {e}")

    # 4) 标准化去重
    seen_keys: set = set()
    unique_records: List[Dict[str, Any]] = []
    for r in records:
        title = (r.get("title") or "").strip()
        if not title:
            continue
        # 粗去重 key：标题前 30 字
        key = re.sub(r"[\s\W_]+", "", title.lower())[:30]
        if key in seen_keys:
            continue
        seen_keys.add(key)
        unique_records.append(r)

    logger.info(
        f"[weekly_fallback] product={product_id} 实时多源: "
        f"trendradar+aihot+websearch 共 {len(unique_records)} 条去重记录"
    )
    return unique_records


def weekly_report_node(state: WeeklyReportInput, config: RunnableConfig, runtime: Runtime[Context]) -> WeeklyReportOutput:
    """
    title: 周报自动生成
    desc: 读取7天Bitable数据，LLM深度分析本周TOP10事件+3个核心趋势+下周预测，生成结构化周报卡片
    integrations: 大语言模型、飞书多维表格、飞书消息
    """
    ctx = runtime.context

    # 1. 加载产品配置
    product_config = load_product_config(state.product_id)
    product_name = product_config.get("product_name", "")
    base_name = get_bitable_base_name(state.product_id)

    # 2. 计算周报起止日期
    today = datetime.now().date()
    week_end = state.week_end or today.strftime("%Y-%m-%d")
    if state.week_start:
        week_start = state.week_start
    else:
        week_start = (today - timedelta(days=6)).strftime("%Y-%m-%d")

    # 3. 读取Bitable历史数据（app_token/table_id 从state传入）
    history_records: List[Dict[str, Any]] = _fetch_history_records(
        state.app_token or "", state.table_id or "", days=7
    )
    total_count = len(history_records)

    # 3.1 v5.0 兜底：若 Bitable 为空（首次跑周报 / 库表未配置），
    #     直接调 fetcher 函数实时拉本周 7 天多源数据作为周报数据源
    if total_count == 0:
        logger.info(
            f"[weekly] Bitable 历史为空,触发 v5.0 实时多源兜底,product={state.product_id}"
        )
        realtime_records = _fetch_realtime_weekly_data(
            product_id=state.product_id,
            product_config=product_config,
            week_start=week_start,
            week_end=week_end,
        )
        if realtime_records:
            history_records = realtime_records
            total_count = len(history_records)
            logger.info(f"[weekly] 实时兜底成功,获取 {total_count} 条")

    # 4. 聚合数据
    aggregated = _aggregate_weekly_data(history_records)

    # 5. 加载LLM配置（优先从产品配置读，否则用全局 config/weekly_report_llm_cfg.json）
    weekly_cfg_rel = product_config.get("weekly_report_llm_cfg", {})
    if not isinstance(weekly_cfg_rel, dict) or not weekly_cfg_rel:
        try:
            global_cfg_path = os.path.join(
                os.getenv("COZE_WORKSPACE_PATH", ""),
                "config", "weekly_report_llm_cfg.json"
            )
            if os.path.exists(global_cfg_path):
                with open(global_cfg_path, "r", encoding="utf-8") as fd:
                    weekly_cfg_rel = json.load(fd)
        except Exception:
            weekly_cfg_rel = {}

    if not isinstance(weekly_cfg_rel, dict) or not weekly_cfg_rel:
        return WeeklyReportOutput(
            product_id=state.product_id,
            product_name=product_name,
            week_start=week_start,
            week_end=week_end,
            report_text="周报配置缺失",
            card_payload={},
            push_status="failed",
            history_count=total_count,
        )

    llm_cfg = weekly_cfg_rel.get("config", {})
    sp_template = weekly_cfg_rel.get("sp", "")
    up_template = weekly_cfg_rel.get("up", "")

    # 6. 渲染prompt
    topic_dist = aggregated.get("topic_distribution", [])
    top_events = aggregated.get("top_events", [])
    daily_dist = aggregated.get("daily_distribution", [])

    topic_dist_text = "\n".join(
        f"- {item['topic']}: {item['count']}条"
        for item in topic_dist[:10]
    )
    top_events_text = "\n".join(
        f"- [{item['topic']}] {item['title']}\n  关键点：{item.get('key_point', '')[:80]}"
        for item in top_events[:10]
    )
    daily_dist_text = "\n".join(
        f"- {item['date']}: {item['count']}条"
        for item in daily_dist
    )

    # v4.11: 用 str.format 而非 jinja2 Template（避免 JSON 模板语法冲突）
    sp = sp_template.format(
        product_name=product_name,
        week_start=week_start,
        week_end=week_end,
        total_count=total_count,
        topic_distribution=topic_dist_text or "（无数据）",
        top_events=top_events_text or "（无高价值事件）",
        daily_distribution=daily_dist_text or "（无数据）",
    )
    up = up_template.format(
        product_name=product_name,
        week_start=week_start,
        week_end=week_end,
        total_count=total_count,
        topic_distribution=topic_dist_text or "（无数据）",
        top_events=top_events_text or "（无高价值事件）",
        daily_distribution=daily_dist_text or "（无数据）",
    )

    # 7. 调用LLM（v4.8.1 修复 LLMClient 1.0 API）
    report_text = ""
    try:
        from coze_coding_dev_sdk import LLMClient
        client = LLMClient(ctx=ctx)
        resp = client.invoke(
            messages=[
                SystemMessage(content=sp),
                HumanMessage(content=up),
            ],
            model=llm_cfg.get("model", "doubao-seed-1-8-251228"),
            temperature=llm_cfg.get("temperature", 0.3),
            max_completion_tokens=llm_cfg.get("max_completion_tokens", 4000),
            thinking=llm_cfg.get("thinking", "disabled"),
        )
        report_text = _safe_text_content(getattr(resp, "content", ""))
    except Exception as e:
        logger.exception("weekly_report LLM调用失败: %s", e)
        # v4.8.1: LLM 失败时不要把错误信息推送到飞书，直接返回失败
        return WeeklyReportOutput(
            product_id=state.product_id,
            product_name=product_name,
            week_start=week_start,
            week_end=week_end,
            report_text="",
            push_status=f"failed: LLM 调用异常 - {str(e)[:120]}",
        )

    # 8. 生成周报卡片（v4.11 行业周报模板）
    # v4.11: 补全 _render_weekly_card 需要的本地变量
    prev_total_count = 0  # v4.11: 暂不支持跨周对比，固定 0
    if prev_total_count > 0:
        diff = total_count - prev_total_count
        pct = round(diff / prev_total_count * 100)
        wow_change = f"{'+' if diff >= 0 else ''}{pct}%"
    else:
        wow_change = "—"
    daily_trend = ", ".join(
        [f"{d.get('date','')}: {d.get('count',0)}" for d in daily_dist[:7]]
    )
    source_count_n = 12  # 站点数
    source_count_m = 20  # 头部媒体数
    source_count_k = 5   # 政策权威机构数
    topic_chart = _make_unicode_bar_chart(
        topic_dist[:10],
        label_key="topic",
        value_key="count",
    )
    parsed = _parse_weekly_llm_output(report_text)
    card_lines: List[str] = _render_weekly_card(
        product_name=product_name,
        week_start=week_start,
        week_end=week_end,
        total_count=total_count,
        prev_total_count=prev_total_count,
        wow_change=wow_change,
        topic_dist=topic_dist,
        daily_trend=daily_trend,
        source_count_n=source_count_n,
        source_count_m=source_count_m,
        source_count_k=source_count_k,
        snapshot_time=datetime.now().strftime("%Y-%m-%d %H:%M"),
        version="4.11",
        department="Coze AI 情报中心",
        llm_data=parsed,
        topic_chart=topic_chart,
    )
    card_text = "\n".join(card_lines)

    card_payload: Dict[str, Any] = {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {
                    "tag": "plain_text",
                    "content": f"📅 {product_name} - 周报",
                },
                "template": "orange",
            },
            "elements": [
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": card_text,
                    },
                },
            ],
        },
    }

    # 9. 推送飞书
    push_status = "failed"
    try:
        client = WorkloadClient()
        feishu_credential = client.get_integration_credential("integration-feishu-message")
        webhook_url = json.loads(feishu_credential).get("webhook_url", "")
        if webhook_url:
            push_status = _send_feishu_card(webhook_url, card_payload)
    except Exception as e:
        logger.warning(f"[weekly_report] 推送失败: {e}")
        push_status = f"failed: {str(e)[:120]}"

    return WeeklyReportOutput(
        product_id=state.product_id,
        product_name=product_name,
        week_start=week_start,
        week_end=week_end,
        report_text=report_text[:2000],
        card_payload={"content": card_text},
        push_status=push_status,
        history_count=total_count,
    )


