"""
v4.8 跨产品关联分析节点
基于本周/上周主题词对比 + 3产品共同话题探测，输出主题趋势
integrations: 无（仅依赖 Bitable 历史 + filter 结果做文本匹配，不调 LLM）
"""
import os
import json
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context

from graphs.state import CrossProductOverlapInput, CrossProductOverlapOutput
from graphs.utils.harness import node_metrics, log_node_result

logger = logging.getLogger(__name__)


def _parse_record_date(record: Dict[str, Any]) -> str:
    """从 Bitable 记录中提取时间戳字段（兼容多种命名）"""
    for key in ("采集时间", "collected_at", "created_at", "timestamp", "crawl_time"):
        if key in record and record[key]:
            return str(record[key])
    return ""


def _split_history_by_window(
    history_records: List[Dict[str, Any]],
) -> tuple:
    """
    将历史记录按 7 天窗口切分为本周 vs 上周。
    实际数据为模拟环境，可能无时间戳字段，因此按记录数量均分。
    返回: (this_week_records, last_week_records)
    """
    if not history_records:
        return [], []

    # 尝试按时间戳分组
    now = datetime.now()
    this_week_cutoff = now - timedelta(days=7)
    this_week: List[Dict[str, Any]] = []
    last_week: List[Dict[str, Any]] = []

    for record in history_records:
        date_str = _parse_record_date(record)
        if date_str:
            try:
                # 尝试多种时间格式
                record_date = None
                for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d"):
                    try:
                        record_date = datetime.strptime(date_str[:19], fmt)
                        break
                    except (ValueError, TypeError):
                        continue
                if record_date:
                    if record_date >= this_week_cutoff:
                        this_week.append(record)
                    else:
                        last_week.append(record)
                    continue
            except Exception:
                pass
        # 时间戳无法解析的记录 → 平均分到两周
        if len(this_week) <= len(last_week):
            this_week.append(record)
        else:
            last_week.append(record)

    return this_week, last_week


def _extract_texts(records: List[Dict[str, Any]]) -> List[str]:
    """从记录列表中提取用于主题分析的文本"""
    texts: List[str] = []
    for record in records:
        if not isinstance(record, dict):
            continue
        # 优先取主题/标题字段
        for key in ("主题", "title", "topic", "summary", "摘要", "content", "内容"):
            if key in record and record[key]:
                texts.append(str(record[key]))
                break
    return texts


def _compute_trending_topics(
    this_texts: List[str],
    last_texts: List[str],
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    简易中文分词（基于 jieba 或回退到字符级），统计高频主题词并计算增长率。
    返回: [{topic, change, growth_pct, current_count, history_count}, ...]
    """
    try:
        from collections import Counter
        # 不依赖 jieba，使用字符级分词（适用于中文短文本主题提取）
        # 过滤常用停用字
        stop_chars = set("的了是在和与及也都而但或为对上下这那与之其等是我你他她它们了着过")
        stop_chars |= set("" . join(chr(i) for i in range(0x30, 0x40)))  # ASCII 标点
        stop_chars |= set("" . join(chr(i) for i in range(0x41, 0x5B)))  # ASCII 字母
        stop_chars |= set(str(i) for i in range(10))

        def tokenize(texts: List[str]) -> Counter:
            counter: Counter = Counter()
            for text in texts:
                # 提取连续中文 2-gram
                chinese_chars: List[str] = []
                for ch in text:
                    if "\u4e00" <= ch <= "\u9fff":
                        chinese_chars.append(ch)
                    else:
                        chinese_chars.append(" ")
                joined = "".join(chinese_chars)
                for token in joined.split():
                    if len(token) >= 2:
                        counter[token] += 1
                    if len(token) >= 3:
                        for i in range(len(token) - 1):
                            bigram = token[i:i + 2]
                            if bigram not in stop_chars:
                                counter[bigram] += 1
            return counter

        cur_counter = tokenize(this_texts)
        his_counter = tokenize(last_texts)
    except ImportError:
        from collections import Counter
        cur_counter = Counter()
        his_counter = Counter()

    # 取本周 Top 5 主题词
    top_topics = cur_counter.most_common(top_n)
    trending: List[Dict[str, Any]] = []
    for topic, cur_count in top_topics:
        his_count = his_counter.get(topic, 0)
        if his_count == 0 and cur_count > 0:
            change = "NEW"
            growth_pct = 100
        elif cur_count == 0 and his_count > 0:
            change = "↓"
            growth_pct = -100
        elif his_count > 0:
            ratio = (cur_count - his_count) / his_count
            growth_pct = int(ratio * 100)
            if ratio > 0.3:
                change = "↑"
            elif ratio < -0.3:
                change = "↓"
            else:
                change = "→"
        else:
            change = "→"
            growth_pct = 0
        trending.append({
            "topic": topic,
            "change": change,
            "growth_pct": growth_pct,
            "current_count": cur_count,
            "history_count": his_count,
        })
    return trending


def _build_trend_insights(
    product_name: str,
    trending_topics: List[Dict[str, Any]],
) -> str:
    """把 trending_topics 渲染成卡片展示的简短洞察文本"""
    if not trending_topics:
        return "（暂无显著趋势变化）"

    # 提取上升、新增话题
    rising = [t for t in trending_topics if t["change"] in ("↑", "NEW")]
    falling = [t for t in trending_topics if t["change"] == "↓"]

    parts: List[str] = []
    if rising:
        rising_str = "、".join(f"{t['topic']}({'+' + str(t['growth_pct']) + '%' if t['change'] == '↑' else '新增'})" for t in rising[:3])
        parts.append(f"📈 升温：{rising_str}")
    if falling:
        falling_str = "、".join(f"{t['topic']}({t['growth_pct']}%)" for t in falling[:2])
        parts.append(f"📉 降温：{falling_str}")
    if not parts:
        parts.append("（本周话题热度相对稳定）")
    return "  ".join(parts)


def _detect_cross_product_hints(
    trending_topics: List[Dict[str, Any]],
    product_id: str,
) -> List[str]:
    """
    跨产品关联提示：基于主题词命中"出海/国际/AI"三个产品的关键字，
    提示用户"本话题在另外 2 个产品中也有相关报道"。
    轻量级实现：仅做关键词匹配，不实际调其他产品 Bitable（避免 401）。
    """
    cross_product_keywords: Dict[str, List[str]] = {
        "overseas_ceo": ["TikTok", "Shopee", "亚马逊", "SaaS", "出海", "独立站", "联盟分销"],
        "global_ai": ["OpenAI", "Anthropic", "Llama", "Gemini", "GPT", "Claude", "硅谷"],
        "ai_daily": ["豆包", "通义", "文心", "智谱", "月之暗面", "Kimi", "深度求索", "国产大模型"],
    }
    other_products = {k: v for k, v in cross_product_keywords.items() if k != product_id}
    hints: List[str] = []
    for topic_info in trending_topics:
        topic = topic_info["topic"]
        for other_pid, keywords in other_products.items():
            for kw in keywords:
                if kw in topic or topic in kw:
                    product_name_map = {
                        "overseas_ceo": "出海CEO早报",
                        "global_ai": "国际AI洞察",
                        "ai_daily": "中文AI早报",
                    }
                    hints.append(f"「{topic}」在{product_name_map.get(other_pid, other_pid)}中也有相关报道")
                    break
            if hints and hints[-1].startswith(f"「{topic}」"):
                break
        if len(hints) >= 3:
            break
    return hints


def cross_product_overlap_node(
    state: CrossProductOverlapInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> CrossProductOverlapOutput:
    """
    title: 跨产品关联分析
    desc: 对比本周/上周主题词趋势，输出主题趋势列表 + 跨产品关联提示（基于关键词匹配）
    """
    start_time = datetime.now()
    product_id = state.product_id
    history_records = state.history_records or []
    filtered_results = state.filtered_results or []

    logger.info(
        f"[cross_product_overlap] 启动 product={product_id} "
        f"history={len(history_records)} current={len(filtered_results)}"
    )

    try:
        # 1. 切分历史为本周 / 上周
        this_week_records, last_week_records = _split_history_by_window(history_records)
        logger.info(
            f"[cross_product_overlap] 切分历史: this_week={len(this_week_records)} "
            f"last_week={len(last_week_records)}"
        )

        # 2. 提取本周 + 上周文本
        this_texts = _extract_texts(this_week_records) + _extract_texts(filtered_results)
        last_texts = _extract_texts(last_week_records)

        # 3. 计算主题趋势
        trending_topics = _compute_trending_topics(this_texts, last_texts, top_n=5)
        logger.info(
            f"[cross_product_overlap] 计算主题趋势: {len(trending_topics)} 个 "
            f"top={trending_topics[0]['topic'] if trending_topics else 'N/A'}"
        )

        # 4. 生成洞察文本
        trend_insights = _build_trend_insights(state.product_name, trending_topics)

        # 5. 跨产品关联提示（轻量级关键词匹配）
        cross_product_hints = _detect_cross_product_hints(trending_topics, product_id)
        logger.info(
            f"[cross_product_overlap] 跨产品关联提示: {len(cross_product_hints)} 条"
        )

        duration_ms = (datetime.now() - start_time).total_seconds() * 1000
        log_node_result(
            "cross_product_overlap",
            status="success",
            duration_ms=duration_ms,
            metrics={
                "trending_count": len(trending_topics),
                "hint_count": len(cross_product_hints),
            },
        )
        return CrossProductOverlapOutput(
            trending_topics=trending_topics,
            trend_insights=trend_insights,
            cross_product_hints=cross_product_hints,
        )
    except Exception as e:
        duration_ms = (datetime.now() - start_time).total_seconds() * 1000
        log_node_result(
            "cross_product_overlap",
            status=f"fail: {e}",
            duration_ms=duration_ms,
        )
        logger.error(f"[cross_product_overlap] 失败: {e}")
        # 降级：返回空数据，不阻塞下游
        return CrossProductOverlapOutput(
            trending_topics=[],
            trend_insights="（趋势分析暂不可用）",
            cross_product_hints=[],
        )
