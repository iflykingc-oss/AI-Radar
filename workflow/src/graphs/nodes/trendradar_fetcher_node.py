"""
v5.0 TrendRadar 数据源节点
集成 github.com/sansan0/TrendRadar (35+ 平台热搜聚合)
底层通过 newsnow.busiyi.world API 公开接口
"""
import os
import json
import logging
import time
import re
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import TrendRadarInput, TrendRadarOutput

logger = logging.getLogger(__name__)

# TrendRadar 35+ 平台列表（去重精简版，保留AI相关主流平台）
TRENDRADAR_PLATFORMS = [
    {"id": "weibo", "name": "微博热搜", "lang": "zh"},
    {"id": "zhihu", "name": "知乎热榜", "lang": "zh"},
    {"id": "douyin", "name": "抖音热点", "lang": "zh"},
    {"id": "toutiao", "name": "今日头条", "lang": "zh"},
    {"id": "bilibili", "name": "B站热门", "lang": "zh"},
    {"id": "36kr", "name": "36氪", "lang": "zh"},
    {"id": "sspai", "name": "少数派", "lang": "zh"},
    {"id": "ithome", "name": "IT之家", "lang": "zh"},
    {"id": "wallstreetcn-hot", "name": "华尔街见闻", "lang": "zh"},
    {"id": "cls-telegraph", "name": "财联社", "lang": "zh"},
    {"id": "thepaper", "name": "澎湃新闻", "lang": "zh"},
    {"id": "huxiu", "name": "虎嗅", "lang": "zh"},
    {"id": "hackernews", "name": "Hacker News", "lang": "en"},
    {"id": "producthunt", "name": "Product Hunt", "lang": "en"},
    {"id": "github-trending-today", "name": "GitHub Trending", "lang": "en"},
    {"id": "techcrunch", "name": "TechCrunch", "lang": "en"},
    {"id": "theverge", "name": "The Verge", "lang": "en"},
    {"id": "engadget", "name": "Engadget", "lang": "en"},
    {"id": "wired", "name": "Wired AI", "lang": "en"},
    {"id": "mit-tech-review", "name": "MIT Tech Review", "lang": "en"},
]

# newsnow 公开 API（TrendRadar 用这个，5万 stars 项目稳定服务）
TRENDRADAR_API = "https://newsnow.busiyi.world/api/s"


def _fetch_platform(platform: Dict[str, str], timeout: int = 8) -> List[Dict[str, Any]]:
    """抓取单个平台热搜数据"""
    platform_id = platform["id"]
    platform_name = platform["name"]
    try:
        resp = requests.get(
            TRENDRADAR_API,
            params={"id": platform_id},
            timeout=timeout,
            headers={"User-Agent": "Mozilla/5.0 (TrendRadar-Adapter/1.0)"},
        )
        if resp.status_code != 200:
            logger.debug(f"[trendradar] {platform_id} HTTP {resp.status_code}")
            return []
        data = resp.json()
        # 兼容不同的返回格式
        items_raw = []
        if isinstance(data, dict):
            items_raw = data.get("items", data.get("data", []))
        elif isinstance(data, list):
            items_raw = data

        items = []
        for idx, it in enumerate(items_raw[:15]):  # 每个平台取前15
            if not isinstance(it, dict):
                continue
            title = it.get("title") or it.get("name") or ""
            url = it.get("url") or it.get("link") or ""
            heat = it.get("hot", it.get("score", 0))
            if not title:
                continue
            items.append(
                {
                    "title": str(title).strip(),
                    "url": str(url).strip(),
                    "heat": int(heat) if isinstance(heat, (int, float)) else 0,
                    "rank": idx + 1,
                    "platform": platform_id,
                    "platform_name": platform_name,
                    "lang": platform.get("lang", "zh"),
                    "source_type": "trendradar",
                    "fetched_at": int(time.time()),
                }
            )
        return items
    except Exception as e:
        logger.debug(f"[trendradar] {platform_id} 抓取失败: {e}")
        return []


def _is_relevant(title: str, topics: List[str]) -> bool:
    """判断热搜条目是否与搜索主题相关（粗筛）"""
    if not topics:
        return True
    title_lower = title.lower()
    for t in topics:
        t_clean = t.strip()
        if not t_clean:
            continue
        if t_clean.lower() in title_lower or t_clean in title:
            return True
    return False


def _deduplicate(items: List[Dict]) -> List[Dict]:
    """按标题相似度去重（去标点 + 长度过滤）"""
    seen_titles: List[str] = []
    result: List[Dict] = []
    for it in items:
        title = it.get("title", "")
        # 标准化：去标点、空格
        norm = re.sub(r"[\s\W]+", "", title.lower())
        if not norm or len(norm) < 4:
            continue
        # 简单包含判断
        is_dup = False
        for seen in seen_titles:
            if norm in seen or seen in norm:
                is_dup = True
                break
        if not is_dup:
            seen_titles.append(norm)
            result.append(it)
    return result


def trendradar_fetcher_node(
    state: TrendRadarInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> TrendRadarOutput:
    """
    title: TrendRadar 35+平台热搜抓取
    desc: 集成TrendRadar（35+平台热搜聚合），从微博/知乎/HN/PH/GitHub
          Trending等平台拉取AI相关热搜，与产品主题做关键词匹配后去重
    """
    product_id = state.product_id
    search_topics = state.search_topics or []
    max_items = state.max_items or 30

    logger.info(
        f"[trendradar] product={product_id}, platforms={len(TRENDRADAR_PLATFORMS)}, "
        f"topics={search_topics[:3]}{'...' if len(search_topics) > 3 else ''}"
    )

    # 1. 多线程并行抓取
    all_items: List[Dict] = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_map = {
            executor.submit(_fetch_platform, p): p for p in TRENDRADAR_PLATFORMS
        }
        for future in as_completed(future_map, timeout=20):
            try:
                items = future.result(timeout=10)
                if items:
                    all_items.extend(items)
            except Exception as e:
                logger.debug(f"[trendradar] 平台抓取超时/异常: {e}")

    platforms_count = len(
        set(it.get("platform") for it in all_items if it.get("platform"))
    )
    logger.info(
        f"[trendradar] product={product_id}, 抓取到 {len(all_items)} 条，"
        f"覆盖 {platforms_count} 个平台"
    )

    # 2. 主题相关性过滤
    if search_topics:
        before = len(all_items)
        all_items = [it for it in all_items if _is_relevant(it.get("title", ""), search_topics)]
        logger.info(
            f"[trendradar] 主题过滤: {before} → {len(all_items)} (主题: {search_topics[:5]})"
        )

    # 3. 去重
    all_items = _deduplicate(all_items)

    # 4. 排序：热度降序
    all_items.sort(key=lambda x: x.get("heat", 0), reverse=True)

    # 5. 截取
    final = all_items[:max_items]
    logger.info(
        f"[trendradar] product={product_id}, 最终返回 {len(final)} 条 "
        f"(平台={platforms_count})"
    )

    return TrendRadarOutput(
        trendradar_items=final,
        platforms_count=platforms_count,
        fetched_count=len(final),
    )
