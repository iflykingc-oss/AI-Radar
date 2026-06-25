"""
并行搜索节点
根据产品配置中的 search_topics 并行执行搜索，并在搜索后立即进行信源可信度打分
"""
import os
import re
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any
from urllib.parse import urlparse
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from coze_coding_dev_sdk import SearchClient
from graphs.state import SearchNewsInput, SearchNewsOutput

logger = logging.getLogger(__name__)


# ============== 信源可信度打分配置 ==============

# 一线权威媒体（基础分85）
TIER1_SOURCES = {
    "36氪": 90, "36kr": 90, "虎嗅": 88, "huxiu": 88, "钛媒体": 85, "tmtpost": 85,
    "澎湃新闻": 88, "澎湃": 88, "界面新闻": 85, "jiemian": 85,
    "财新": 92, "caixin": 92, "第一财经": 88, "yicai": 88, "21世纪经济报道": 85,
    "新京报": 80, "南方周末": 85, "经济观察报": 85, "财经": 88,
    "证券时报": 85, "中国证券报": 85, "上海证券报": 80,
    "雷锋网": 82, "leiphone": 82, "爱范儿": 80, "ifanr": 80,
    "少数派": 78, "sspai": 78, "极客公园": 82, "geekpark": 82,
    "人人都是产品经理": 78, "woshipm": 78, "产品经理": 78,
    "机器之心": 90, "almosthuman": 90, "量子位": 88, "qbitai": 88,
    "新智元": 85, "synced": 85, "AI科技评论": 85, "leiphone-ai": 85,
    "掘金": 75, "juejin": 75, "CSDN": 75, "csdn": 75, "博客园": 70, "cnblogs": 70,
    "InfoQ": 85, "infoq": 85, "开源中国": 78, "oschina": 78,
    "腾讯科技": 80, "网科技": 80, "新浪科技": 78, "网易科技": 75, "凤凰科技": 75,
    "创业邦": 82, "cyzone": 82, "投资界": 85, "pedaily": 85, "投中网": 85,
    "36氪出海": 85, "志象网": 80, "霞光社": 82,
}

# 二线行业媒体（基础分70）
TIER2_SOURCES = {
    "techweb": 72, "donews": 70, "donews消费": 70, "快科技": 68, "mydrivers": 68,
    "IT之家": 70, "ithome": 70, "cnbeta": 68, "cnbeta-": 68,
    "砍柴网": 65, "techweb.cn": 65, "至顶网": 68, "zhidx": 68,
    "硅谷分析狮": 70, "开柒": 70, "互联网那些事": 68, "techsohu": 68,
    "锌财经": 72, "btc112": 65, "巴比特": 75,
}

# 海外权威（基础分90）
GLOBAL_SOURCES = {
    "techcrunch": 92, "theverge": 92, "wired": 92, "ars technica": 88,
    "reuters": 95, "路透": 95, "bloomberg": 95, "彭博": 95,
    "wsj": 95, "金融时报": 92, "ft.com": 92, "nytimes": 92,
    "bbc": 90, "cnn": 88, "the guardian": 88, "forbes": 88, "fortune": 88,
    "mit technology review": 92, "technology review": 92,
    "openai": 95, "anthropic": 95, "deepmind": 95, "google": 90,
    "hugging face": 90, "arxiv": 90, "github": 90,
    "producthunt": 88, "product hunt": 88, "hacker news": 85, "hn": 85,
    "indie hackers": 80, "indiehackers": 80,
    "y combinator": 88, "yc": 88, "a16z": 92, "sequoia": 92, "红杉": 90,
}

# 黑名单（低分/广告站/SEO站/内容农场）
BLACKLIST = {
    "百家号": 15, "baijia": 15, "百度知道": 10, "baidu": 10,
    "今日头条号": 30, "头条": 30, "toutiao": 30,
    "搜狐号": 25, "sohu": 25, "网易号": 25, "163.com": 25,
    "自媒体": 15, "自媒": 15,
    "广告": 5, "ad.": 5, "promotion": 5,
    "wikiHow": 30, "wikihow": 30,
    "content farm": 5, "伪原创": 5,
}

# 默认分数（不在字典中）
DEFAULT_SCORE = 50

# 政府/教育域名加分
GOV_EDU_BONUS = 5


def _extract_domain(url: str) -> str:
    """从URL中提取域名"""
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # 去掉www.前缀
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def _score_source(item: Dict[str, Any]) -> int:
    """
    计算信源可信度分数（0-100）
    算法：
    1. 基础分（从字典匹配网站名/域名）
    2. 黑名单降分
    3. gov/edu域名加分
    4. 短链/重定向降分
    """
    url: str = item.get("url", "")
    source_name: str = item.get("source", "")
    title: str = item.get("title", "")
    domain: str = _extract_domain(url)
    score: int = DEFAULT_SCORE
    matched: str = ""

    # 1. 基础分：优先匹配source_name，再匹配domain
    if source_name:
        for key, base_score in TIER1_SOURCES.items():
            if key.lower() in source_name.lower():
                score = max(score, base_score)
                matched = key
                break
        if not matched:
            for key, base_score in TIER2_SOURCES.items():
                if key.lower() in source_name.lower():
                    score = max(score, base_score)
                    matched = key
                    break
        if not matched:
            for key, base_score in GLOBAL_SOURCES.items():
                if key.lower() in source_name.lower():
                    score = max(score, base_score)
                    matched = key
                    break
        if not matched:
            for key, black_score in BLACKLIST.items():
                if key.lower() in source_name.lower():
                    score = min(score, black_score)
                    matched = f"黑名单:{key}"
                    break

    # 2. 域名匹配（如果source_name没匹配上）
    if not matched and domain:
        for key, base_score in TIER1_SOURCES.items():
            if key.lower() in domain:
                score = max(score, base_score)
                matched = key
                break
        if not matched:
            for key, base_score in TIER2_SOURCES.items():
                if key.lower() in domain:
                    score = max(score, base_score)
                    matched = key
                    break
        if not matched:
            for key, base_score in GLOBAL_SOURCES.items():
                if key.lower() in domain:
                    score = max(score, base_score)
                    matched = key
                    break
        if not matched:
            for key, black_score in BLACKLIST.items():
                if key.lower() in domain:
                    score = min(score, black_score)
                    matched = f"黑名单:{key}"
                    break

    # 3. gov/edu域名加分
    if domain.endswith(".gov.cn") or domain.endswith(".gov") or domain.endswith(".edu.cn") or domain.endswith(".edu"):
        score += GOV_EDU_BONUS

    # 4. 短链/重定向降分
    shortener_domains = ["t.cn", "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly", "reurl.cc", "sina.lt"]
    if any(sd in domain for sd in shortener_domains):
        score -= 10

    # 5. 标题包含"广告/营销/课程/培训"等强降分
    spam_keywords = ["广告", "营销推广", "课程报名", "限时优惠", "加微信", "扫码进群", "扫码咨询", "招生"]
    if any(kw in title for kw in spam_keywords):
        score = min(score, 20)

    # 限制范围
    score = max(0, min(100, score))
    return score


def _enrich_with_score(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """为每个搜索结果加上信源分数"""
    enriched: List[Dict[str, Any]] = []
    for item in items:
        try:
            item["source_score"] = _score_source(item)
        except Exception as e:
            logger.warning(f"信源打分失败（item={item.get('url','')}）: {e}")
            item["source_score"] = DEFAULT_SCORE
        enriched.append(item)
    return enriched


def _search_single_topic(
    topic: str,
    ctx: Context,
    time_range: str,
    count: int,
) -> List[Dict[str, Any]]:
    """搜索单个主题（供线程池调用）"""
    try:
        client = SearchClient(ctx=ctx)
        response = client.search(
            query=topic,
            search_type="web",
            count=count,
            need_summary=True,
            time_range=time_range,
        )
        results: List[Dict[str, Any]] = []
        if response.web_items:
            for item in response.web_items:
                results.append({
                    "title": item.title or "",
                    "url": item.url or "",
                    "snippet": item.snippet or "",
                    "source": item.site_name or "",
                    "publish_time": str(item.publish_time or ""),
                    # 主题分类取搜索词第一个词
                    "topic": topic.split(" ")[0] if topic else "",
                })
        return results
    except Exception as e:
        logger.error(f"搜索主题「{topic}」失败: {e}")
        return []


def search_news_node(
    state: SearchNewsInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> SearchNewsOutput:
    """
    title: 多主题并行信息搜索
    desc: 根据产品配置中的搜索主题列表，使用线程池并发加速搜索；搜索后立即为每条结果打信源可信度分数（0-100），高权重信源优先保留
    integrations: Web Search
    """
    ctx = runtime.context
    all_results: List[Dict[str, Any]] = []
    topics = state.search_topics or []
    time_range = state.search_time_range or "1d"
    count = state.search_count_per_topic or 5

    logger.info(
        f"[search_news] product={state.product_id}, 主题数={len(topics)}, "
        f"time_range={time_range}, count_per_topic={count}"
    )

    if not topics:
        logger.warning("[search_news] 搜索主题列表为空，跳过")
        return SearchNewsOutput(raw_search_results=[], product_id=state.product_id)

    # 使用线程池并行搜索（最多5个并发）
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_topic = {
            executor.submit(_search_single_topic, topic, ctx, time_range, count): topic
            for topic in topics
        }

        for future in as_completed(future_to_topic):
            topic = future_to_topic[future]
            try:
                results = future.result()
                all_results.extend(results)
                logger.info(f"[search_news] 主题「{topic}」搜索到 {len(results)} 条结果")
            except Exception as e:
                logger.error(f"[search_news] 主题「{topic}」搜索异常: {e}")

    # ============== 信源可信度打分 ==============
    all_results = _enrich_with_score(all_results)
    if all_results:
        scores = [r.get("source_score", 0) for r in all_results]
        high = sum(1 for s in scores if s >= 80)
        mid = sum(1 for s in scores if 50 <= s < 80)
        low = sum(1 for s in scores if s < 50)
        logger.info(
            f"[search_news] 信源打分完成：高分(>=80)={high} 中分(50-79)={mid} 低分(<50)={low}"
        )

    logger.info(f"[search_news] 全部搜索完成，共获取 {len(all_results)} 条结果")
    return SearchNewsOutput(
        raw_search_results=all_results,
        product_id=state.product_id,
    )
