"""
v5.0 AI-HotRadar 数据源节点
集成 aihot.virxact.com - AI 垂直社区精选 + 全量列表
提供五大分类：模型/产品/行业/论文/技巧
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
from graphs.state import AiHotRadarInput, AiHotRadarOutput

logger = logging.getLogger(__name__)

# AI-HotRadar 五大分类
AIHOT_CATEGORIES = [
    {"id": "ai-models", "name": "模型发布", "lang": "zh"},
    {"id": "ai-products", "name": "产品发布", "lang": "zh"},
    {"id": "industry", "name": "行业动态", "lang": "zh"},
    {"id": "paper", "name": "论文研究", "lang": "zh"},
    {"id": "tip", "name": "技巧与观点", "lang": "zh"},
]

# AI-HotRadar 公开端点（公开匿名API，可直接GET访问）
# 试过的端点格式：?category={id}&page=1
AIHOT_API_BASES = [
    "https://aihot.virxact.com/api/items",  # 优先尝试
    "https://aihot.virxact.com/api",  # 兜底
]


def _fetch_aihot_category(
    category: Dict[str, str],
    api_base: str,
    timeout: int = 10,
) -> List[Dict[str, Any]]:
    """抓取单个分类的 AI-HotRadar 数据"""
    category_id = category["id"]
    category_name = category["name"]
    items_out: List[Dict] = []

    for page in [1, 2]:  # 每个分类拉2页
        try:
            url = f"{api_base}"
            params = {"category": category_id, "page": page, "pageSize": 25}
            resp = requests.get(
                url,
                params=params,
                timeout=timeout,
                headers={
                    "User-Agent": "Mozilla/5.0 (AI-HotRadar-Adapter/1.0)",
                    "Accept": "application/json, text/plain, */*",
                    "Referer": "https://aihot.virxact.com/",
                },
            )
            if resp.status_code != 200:
                logger.debug(
                    f"[aihot] {category_id} page={page} HTTP {resp.status_code}"
                )
                continue

            # 兼容JSON/HTML/JSONP
            content_type = resp.headers.get("content-type", "")
            raw_text = resp.text.strip()
            if "json" not in content_type and not raw_text.startswith(("[", "{")):
                # HTML页面 → 解析items URL
                logger.debug(
                    f"[aihot] {category_id} page={page} 返回HTML, "
                    f"尝试提取items URL"
                )
                # 提取所有 /items/{id} 模式
                pattern = re.findall(
                    r'href="(/items/[a-z0-9]+)"[^>]*>([^<]+)', raw_text
                )
                for idx, (item_url, title) in enumerate(pattern[:25]):
                    if title and len(title.strip()) > 4:
                        items_out.append(
                            {
                                "title": title.strip()[:200],
                                "url": f"https://aihot.virxact.com{item_url}",
                                "category": category_id,
                                "category_name": category_name,
                                "lang": "zh",
                                "source_type": "aihot",
                                "fetched_at": int(time.time()),
                            }
                        )
                continue

            try:
                data = resp.json()
            except Exception:
                continue

            items_raw = []
            if isinstance(data, dict):
                for key in ["items", "data", "results", "list"]:
                    if key in data and isinstance(data[key], list):
                        items_raw = data[key]
                        break
                if not items_raw and "items" in data and isinstance(data["items"], list):
                    items_raw = data["items"]
            elif isinstance(data, list):
                items_raw = data

            for idx, it in enumerate(items_raw):
                if not isinstance(it, dict):
                    continue
                title = it.get("title") or it.get("name") or ""
                if not title:
                    continue
                desc = it.get("description") or it.get("summary") or it.get("content", "")
                # 描述截断
                if isinstance(desc, str) and len(desc) > 500:
                    desc = desc[:500] + "..."

                # 数字热度
                heat = it.get("heat", it.get("score", it.get("rank", 0)))
                if isinstance(heat, str):
                    try:
                        heat = int(re.sub(r"[^\d]", "", heat) or 0)
                    except Exception:
                        heat = 0

                item_id = it.get("id") or it.get("_id") or it.get("slug", "")
                item_url = it.get("url") or it.get("link")
                if not item_url and item_id:
                    item_url = f"https://aihot.virxact.com/items/{item_id}"

                items_out.append(
                    {
                        "title": str(title).strip()[:200],
                        "url": str(item_url or "").strip(),
                        "description": str(desc)[:500] if desc else "",
                        "heat": int(heat) if isinstance(heat, (int, float)) else 0,
                        "category": category_id,
                        "category_name": category_name,
                        "lang": "zh",
                        "source_type": "aihot",
                        "fetched_at": int(time.time()),
                    }
                )
        except Exception as e:
            logger.debug(
                f"[aihot] {category_id} page={page} 抓取异常: {e}"
            )
            continue
    return items_out


def _is_relevant(title: str, desc: str, topics: List[str]) -> bool:
    """判断条目是否与搜索主题相关"""
    if not topics:
        return True
    text = (title + " " + desc).lower()
    for t in topics:
        t_clean = t.strip()
        if not t_clean:
            continue
        if t_clean.lower() in text or t_clean in (title + desc):
            return True
    return False


def _deduplicate(items: List[Dict]) -> List[Dict]:
    """按标题相似度去重"""
    seen: List[str] = []
    result: List[Dict] = []
    for it in items:
        title = it.get("title", "")
        norm = re.sub(r"[\s\W]+", "", title.lower())
        if not norm or len(norm) < 4:
            continue
        is_dup = any(norm in s or s in norm for s in seen)
        if not is_dup:
            seen.append(norm)
            result.append(it)
    return result


def aihot_fetcher_node(
    state: AiHotRadarInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> AiHotRadarOutput:
    """
    title: AI-HotRadar AI垂直社区抓取
    desc: 集成AI-HotRadar（aihot.virxact.com），从5大分类(模型/产品/
          行业/论文/技巧)拉取AI精选内容，与产品主题做关键词匹配
    """
    product_id = state.product_id
    search_topics = state.search_topics or []
    max_items = state.max_items or 30

    logger.info(
        f"[aihot] product={product_id}, categories={len(AIHOT_CATEGORIES)}, "
        f"topics={search_topics[:3]}{'...' if len(search_topics) > 3 else ''}"
    )

    # 1. 多线程并行抓取各分类
    all_items: List[Dict] = []
    api_base = AIHOT_API_BASES[0]
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_map = {
            executor.submit(_fetch_aihot_category, c, api_base): c
            for c in AIHOT_CATEGORIES
        }
        for future in as_completed(future_map, timeout=30):
            try:
                items = future.result(timeout=25)
                if items:
                    all_items.extend(items)
            except Exception as e:
                logger.debug(f"[aihot] 分类抓取超时/异常: {e}")

    logger.info(
        f"[aihot] product={product_id}, 抓取到 {len(all_items)} 条"
    )

    # 2. 主题相关性过滤
    if search_topics:
        before = len(all_items)
        all_items = [
            it
            for it in all_items
            if _is_relevant(
                it.get("title", ""),
                it.get("description", ""),
                search_topics,
            )
        ]
        logger.info(
            f"[aihot] 主题过滤: {before} → {len(all_items)}"
        )

    # 3. 去重
    all_items = _deduplicate(all_items)

    # 4. 排序：热度降序
    all_items.sort(key=lambda x: x.get("heat", 0), reverse=True)

    # 5. 截取
    final = all_items[:max_items]
    logger.info(
        f"[aihot] product={product_id}, 最终返回 {len(final)} 条"
    )

    return AiHotRadarOutput(
        aihot_items=final,
        fetched_count=len(final),
    )
