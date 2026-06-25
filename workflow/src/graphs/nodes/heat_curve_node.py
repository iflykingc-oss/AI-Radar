"""
主题热度曲线节点
突破点B：趋势可视化升级
- 读7天Bitable数据
- 统计每个主题每天数量
- 生成unicode折线图/条形图
- 标记升温/降温/新词
"""
import os
import re
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context

from graphs.state import HeatCurveInput, HeatCurveOutput
from graphs.utils import (
    load_product_config,
    get_bitable_base_name,
)

logger = logging.getLogger(__name__)


def _parse_date(date_str: str) -> str:
    """提取日期字符串的YYYY-MM-DD部分"""
    if not isinstance(date_str, str):
        return ""
    # 尝试多种格式
    for fmt_pattern in [r"^(\d{4}-\d{2}-\d{2})", r"^(\d{4}/\d{2}/\d{2})", r"^(\d{10})"]:
        match = re.match(fmt_pattern, date_str)
        if match:
            if fmt_pattern == r"^(\d{10})":
                # 10位时间戳
                try:
                    ts = int(date_str[:10])
                    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
                except Exception:
                    return ""
            return match.group(1).replace("/", "-")
    return ""


def _fetch_history_records(app_token: str, table_id: str, days: int = 7) -> List[Dict[str, Any]]:
    """从飞书多维表格读取历史记录"""
    if not app_token or not table_id:
        return []
    try:
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
            record: Dict[str, Any] = {}
            for k, v in fields.items():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    record[k] = v[0].get("text", "")
                else:
                    record[k] = v
            results.append(record)
        return results
    except Exception as e:
        logger.warning(f"[heat_curve] 读取Bitable历史失败: {e}")
        return []


def _compute_daily_topic_count(records: List[Dict[str, Any]], days: int = 7) -> Dict[str, List[int]]:
    """
    计算每个主题在过去days天每天的数量
    返回: {topic: [day1_count, day2_count, ...]}
    """
    today = datetime.now().date()
    date_list: List[str] = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        date_list.append(d.strftime("%Y-%m-%d"))

    topic_date_count: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for rec in records:
        topic = rec.get("topic", "")
        created = rec.get("created_at", "")
        if not isinstance(topic, str) or not topic:
            continue
        date_key = _parse_date(created)
        if not date_key or date_key not in date_list:
            continue
        topic_date_count[topic][date_key] += 1

    result: Dict[str, List[int]] = {}
    for topic, date_count in topic_date_count.items():
        counts = [date_count.get(d, 0) for d in date_list]
        result[topic] = counts

    return result


def _classify_trend(counts: List[int]) -> str:
    """根据最近天数数据判断趋势类型"""
    if not counts or all(c == 0 for c in counts):
        return "new"
    if len(counts) < 2:
        return "stable"
    mid = len(counts) // 2
    if mid == 0:
        return "stable"
    first_half_avg = sum(counts[:mid]) / mid if mid > 0 else 0
    second_half_avg = sum(counts[mid:]) / (len(counts) - mid) if (len(counts) - mid) > 0 else 0
    if second_half_avg >= first_half_avg * 1.5 and second_half_avg >= 1:
        return "rising"
    if first_half_avg > 0 and second_half_avg <= first_half_avg * 0.5:
        return "falling"
    if all(c == 0 for c in counts[:mid]) and any(c > 0 for c in counts[mid:]):
        return "new"
    return "stable"


def _render_sparkline(counts: List[int]) -> str:
    """将数字列表渲染为unicode sparkline（折线图）"""
    if not counts:
        return ""
    max_val = max(counts)
    if max_val == 0:
        return "▁" * len(counts)
    bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
    sparkline_chars: List[str] = []
    for c in counts:
        if c == 0:
            sparkline_chars.append("▁")
        else:
            idx = min(int((c / max_val) * 7), 7)
            sparkline_chars.append(bars[idx])
    return "".join(sparkline_chars)


def _render_bar_chart(data: List[Dict[str, Any]], label_key: str, value_key: str) -> str:
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


def heat_curve_node(state: HeatCurveInput, config: RunnableConfig, runtime: Runtime[Context]) -> HeatCurveOutput:
    """
    title: 主题热度曲线
    desc: 读取7天Bitable历史数据，统计每个主题每天数量，生成unicode折线图+条形图+升温降温新词标记
    integrations: 飞书多维表格
    """
    ctx = runtime.context

    # 1. 加载产品配置
    product_config = load_product_config(state.product_id)
    product_name = product_config.get("product_name", "")
    base_name = get_bitable_base_name(state.product_id)
    days = state.days or 7

    # 2. 读取历史数据
    history_records: List[Dict[str, Any]] = _fetch_history_records(
        state.app_token or "", state.table_id or "", days=days
    )

    # 3. 计算每日主题数量
    daily_topic_count = _compute_daily_topic_count(history_records, days=days)

    # 4. 分类趋势 + 聚合统计
    topic_summary: List[Dict[str, Any]] = []
    for topic, counts in daily_topic_count.items():
        total = sum(counts)
        if total == 0:
            continue
        trend = _classify_trend(counts)
        topic_summary.append({
            "topic": topic,
            "total": total,
            "counts": counts,
            "trend": trend,
            "sparkline": _render_sparkline(counts),
        })

    topic_summary.sort(key=lambda x: x.get("total", 0), reverse=True)

    # 5. 分类（升温/降温/新词）
    rising_topics = [t for t in topic_summary if t.get("trend") == "rising"][:5]
    falling_topics = [t for t in topic_summary if t.get("trend") == "falling"][:5]
    new_topics = [t for t in topic_summary if t.get("trend") == "new"][:5]
    top_total = topic_summary[:10]

    # 6. 生成可视化文本
    sparkline_block_lines: List[str] = []
    for t in top_total:
        sparkline_block_lines.append(
            f"{t['topic']:<8} {t['sparkline']}  {t['total']}条"
        )
    sparkline_block = "\n".join(sparkline_block_lines)

    trend_marks: List[str] = []
    if rising_topics:
        trend_marks.append("🔥 **升温主题**：" + "、".join(t["topic"] for t in rising_topics))
    if falling_topics:
        trend_marks.append("📉 **降温主题**：" + "、".join(t["topic"] for t in falling_topics))
    if new_topics:
        trend_marks.append("🆕 **新兴主题**：" + "、".join(t["topic"] for t in new_topics))
    trend_marks_text = "\n".join(trend_marks) if trend_marks else "（暂无明显趋势变化）"

    top_bar_chart = _render_bar_chart(
        [{"topic": t["topic"], "total": t["total"]} for t in top_total],
        "topic", "total",
    )

    # 7. 拼装输出文本
    curve_lines: List[str] = []
    curve_lines.append(f"📈 **{product_name}** | 主题热度曲线（近{days}天）")
    curve_lines.append("")
    if sparkline_block:
        curve_lines.append("**📊 主题热度折线图**")
        curve_lines.append("```")
        curve_lines.append(sparkline_block)
        curve_lines.append("```")
        curve_lines.append("")
    if top_bar_chart:
        curve_lines.append("**📊 主题热度TOP10**")
        curve_lines.append("```")
        curve_lines.append(top_bar_chart)
        curve_lines.append("```")
        curve_lines.append("")
    curve_lines.append("**🎯 趋势洞察**")
    curve_lines.append(trend_marks_text)
    curve_text = "\n".join(curve_lines)

    return HeatCurveOutput(
        product_id=state.product_id,
        product_name=product_name,
        days=days,
        curve_text=curve_text,
        topic_count=len(topic_summary),
        rising_count=len(rising_topics),
        falling_count=len(falling_topics),
        new_count=len(new_topics),
        history_count=len(history_records),
        topic_summary=topic_summary[:10],
    )
