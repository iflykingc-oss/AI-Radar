"""
v5.0 多源聚合节点
融合三个数据源的结果：
  1. 原 Web Search（通用搜索）
  2. TrendRadar（35+ 平台热搜）
  3. AI-HotRadar（AI 垂直社区精选）
统一去重、4D 评分、排序截取
"""
import os
import json
import logging
import time
import re
from typing import List, Dict, Any, Optional
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import GlobalState
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# 4D 评分权重（v5.0 重构自 AI-Radar 的 4D Verification）
WEIGHT_FRESHNESS = 0.25  # 新鲜度
WEIGHT_MULTI_SOURCE = 0.30  # 多源验证
WEIGHT_ENGAGEMENT = 0.20  # 互动信号
WEIGHT_VIABILITY = 0.25  # 内容质量/技术可行


class MultiSourceAggregatorInput(BaseModel):
    """v5.0 多源聚合节点输入"""
    product_id: str = Field(..., description="产品ID")
    # 注意：websearch_items/trendradar_items/aihot_items 三个字段必须与 GlobalState 同名，
    # LangGraph 会按字段名自动从 GlobalState 注入
    raw_search_results: List[dict] = Field(default=[], description="Web Search 原始结果（兼容来自search_news的raw_search_results）")
    trendradar_items: List[dict] = Field(default=[], description="TrendRadar 数据（来自 GlobalState）")
    aihot_items: List[dict] = Field(default=[], description="AI-HotRadar 数据（来自 GlobalState）")
    max_items: int = Field(default=40, description="最终保留条数")


class MultiSourceAggregatorOutput(BaseModel):
    """v5.0 多源聚合节点输出"""
    product_id: str = Field(..., description="产品ID")
    unified_items: List[dict] = Field(default=[], description="统一去重+4D评分的条目")
    total_input: int = Field(default=0, description="输入总条数")
    deduped_count: int = Field(default=0, description="去重后条数")
    avg_4d_score: float = Field(default=0.0, description="平均4D评分")
    content_type_stats: Dict[str, int] = Field(
        default_factory=dict,
        description="v5.0 内容类型统计 {product/paper/news/discussion/article/other: count}"
    )


def _normalize_title(title: str) -> str:
    """标准化标题用于去重"""
    if not title:
        return ""
    # 去除标点/空格/常见前后缀
    t = re.sub(r"[\s\W_]+", "", title.lower())
    # 去除常见前后缀
    for prefix in ["【", "[", "【独家】", "【快讯】", "【推荐】"]:
        if t.startswith(prefix):
            t = t[len(prefix):]
    return t[:60]  # 截断到60字减少哈希冲突


def _compute_4d_score(
    item: Dict,
    source_counts: Dict[str, int],
    now_ts: int,
) -> float:
    """
    4D 评分（融合自 AI-Radar 的 score.ts）
      1. Freshness (0-100): 数据新鲜度
      2. MultiSource (0-100): 多源验证（出现次数越多分越高）
      3. Engagement (0-100): 互动信号（热度分）
      4. Viability (0-100): 内容质量
    返回 0-100 的综合分
    """
    # 1. Freshness
    fetched_at = item.get("fetched_at", 0)
    if not fetched_at:
        fetched_at = now_ts
    age_hours = max(0, (now_ts - fetched_at) / 3600)
    freshness = max(0, 100 - age_hours * 4)  # 24h后约=4
    freshness = min(100, freshness)

    # 2. MultiSource（出现次数）
    title_key = _normalize_title(item.get("title", ""))
    multi_count = source_counts.get(title_key, 1)
    multi_source = min(100, 30 + multi_count * 25)  # 1源=55, 2源=80, 3源=100

    # 3. Engagement
    heat = item.get("heat", 0) or 0
    if heat > 0:
        # 0-10000+ 的热度 → 0-100
        engagement = min(100, max(10, 20 + (heat / 100)))
    else:
        # 无热度的内容给基础分
        engagement = 35

    # 4. Viability（内容质量）
    viability = 50  # 基础分
    title = item.get("title", "")
    desc = item.get("description") or item.get("content", "")
    # 有URL → 真实来源
    if item.get("url") and item["url"].startswith("http"):
        viability += 15
    # 有描述 → 完整内容
    if desc and len(str(desc)) > 50:
        viability += 10
    # 有发布时间
    if item.get("publish_time"):
        viability += 8
    # 标题长度合理
    if 8 <= len(title) <= 80:
        viability += 7
    viability = min(100, viability)

    return round(
        WEIGHT_FRESHNESS * freshness
        + WEIGHT_MULTI_SOURCE * multi_source
        + WEIGHT_ENGAGEMENT * engagement
        + WEIGHT_VIABILITY * viability,
        2,
    )


def _classify_content_type(item: Dict) -> str:
    """
    五层漏斗分类（移植自 AI-Radar classifier-v2）：
      product / news / article / discussion / other
    """
    title = item.get("title", "")
    url = item.get("url", "")
    source = item.get("source", "") or item.get("platform_name", "")
    text = (title + " " + url + " " + source).lower()

    # 1. 产品类
    product_kws = ["launch", "release", "发布", "上线", "open source", "开源", "github.com", "product hunt"]
    if any(kw in text for kw in product_kws):
        # 进一步判断（排除纯新闻）
        if "release notes" in text or "发布" in title or "开源" in title or "github.com" in url:
            return "product"

    # 2. 论文/研究类
    paper_kws = ["arxiv", "paper", "research", "论文", "研究", "benchmark", "study", "analysis"]
    if any(kw in text for kw in paper_kws):
        return "paper"

    # 3. 讨论类（论坛/社区）
    discussion_kws = ["reddit", "hacker news", "hn", "discuss", "hackernews", "buzzing"]
    if any(kw in text for kw in discussion_kws):
        return "discussion"

    # 4. 资讯类
    news_kws = ["news", "报道", "快讯", "资讯", "cnbeta", "ithome", "techcrunch", "theverge", "36kr"]
    if any(kw in text for kw in news_kws):
        return "news"

    # 5. 默认文章
    if item.get("description") and len(str(item["description"])) > 200:
        return "article"

    return "other"


def multi_source_aggregator_node(
    state: MultiSourceAggregatorInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> MultiSourceAggregatorOutput:
    """
    title: 多源聚合 + 4D评分
    desc: 融合三个数据源(Web Search/TrendRadar/AI-HotRadar)，
          去重后按4D评分(新鲜度+多源+互动+内容质量)排序，输出TOP条目
    """
    product_id = state.product_id
    websearch = state.raw_search_results or []  # 从 GlobalState 读 search_news 的输出
    trendradar = state.trendradar_items or []  # 从 GlobalState 读 trendradar_fetcher 的输出
    aihot = state.aihot_items or []  # 从 GlobalState 读 aihot_fetcher 的输出
    max_items = state.max_items or 40

    total_input = len(websearch) + len(trendradar) + len(aihot)
    logger.info(
        f"[multi_source_agg] product={product_id}, "
        f"websearch={len(websearch)} trendradar={len(trendradar)} aihot={len(aihot)} "
        f"total={total_input}"
    )

    # 1. 给每个源打 source_type 标签 + content_type 分类
    for it in websearch:
        it.setdefault("source_type", "websearch")
    for it in trendradar:
        it.setdefault("source_type", "trendradar")
    for it in aihot:
        it.setdefault("source_type", "aihot")

    all_items = websearch + trendradar + aihot

    # 2. 标准化去重
    title_groups: Dict[str, List[Dict]] = {}
    for it in all_items:
        title_key = _normalize_title(it.get("title", ""))
        if not title_key or len(title_key) < 4:
            continue
        title_groups.setdefault(title_key, []).append(it)

    # 3. 合并同标题的条目（保留热度最高的）
    deduped: List[Dict] = []
    source_counts: Dict[str, int] = {}
    for title_key, group in title_groups.items():
        source_counts[title_key] = len(group)
        # 选 heat+source_score 最高的作为代表
        best = max(
            group,
            key=lambda x: (
                x.get("heat", 0) or 0,
                x.get("source_score", 0) or 0,
            ),
        )
        # 合并来源信息
        sources = list(
            set(
                [g.get("source_type", "") for g in group]
                + [g.get("platform", "") for g in group if g.get("platform")]
                + [g.get("platform_name", "") for g in group if g.get("platform_name")]
            )
        )
        sources = [s for s in sources if s]
        best["_source_list"] = sources
        best["_multi_source_count"] = len(group)
        deduped.append(best)

    # 4. 4D 评分
    now_ts = int(time.time())
    for it in deduped:
        score_4d = _compute_4d_score(it, source_counts, now_ts)
        it["score_4d"] = score_4d
        it["content_type"] = _classify_content_type(it)

    # 4.5 统计 content_type
    content_type_stats: Dict[str, int] = {}
    for it in deduped:
        ct = it.get("content_type", "other")
        content_type_stats[ct] = content_type_stats.get(ct, 0) + 1

    # 5. 按 4D 评分排序
    deduped.sort(key=lambda x: x.get("score_4d", 0), reverse=True)

    # 6. 截取 TOP
    final = deduped[:max_items]
    avg_score = (
        sum(it.get("score_4d", 0) for it in final) / max(1, len(final))
    )

    logger.info(
        f"[multi_source_agg] product={product_id}, "
        f"输入={total_input} → 去重={len(deduped)} → TOP{len(final)}, "
        f"平均4D分={avg_score:.1f}"
    )

    return MultiSourceAggregatorOutput(
        product_id=product_id,
        unified_items=final,
        total_input=total_input,
        deduped_count=len(deduped),
        avg_4d_score=round(avg_score, 2),
        content_type_stats=content_type_stats,
    )
