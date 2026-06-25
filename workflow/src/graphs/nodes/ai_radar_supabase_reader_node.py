"""
AI Radar Supabase Reader Node
==============================

从 AI-Radar 的 Supabase `products` 表直接读取已抓取的产品/资讯数据，
作为 LangGraph workflow 的高质量数据源（AI-Radar crawler 已完成 15 信源
抓取 + 4D 评分 + 去重 + 分类）。

数据流：
  AI-Radar crawler (TypeScript) → Supabase products
       ↓
  ai_radar_supabase_reader (Python) → workflow 流程的 raw_search_results
       ↓
  event_dedup / filter_news / analyze_llm ...

环境变量：
  SUPABASE_URL         - 例如 https://xxx.supabase.co
  SUPABASE_SERVICE_KEY - service role key（必须）
  AI_RADAR_TABLE       - 默认 products
  AI_RADAR_DAYS        - 默认 1（读近 N 天的数据）
"""
import os
import json
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin

import urllib.request
import urllib.error

from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from pydantic import BaseModel, Field

from graphs.state import GraphInput  # 仅复用类型提示


logger = logging.getLogger(__name__)


# ============ 节点入出参定义 ============


class AIRadarSupabaseInput(BaseModel):
    """AI-Radar Supabase 读节点的入参"""
    product_id: str = Field(..., description="产品ID，决定查询过滤 category 等")
    push_date: str = Field(..., description="推送日期 YYYY-MM-DD")
    days: int = Field(default=1, description="读取近 N 天的数据")
    limit: int = Field(default=30, description="最多返回 N 条")


class AIRadarSupabaseOutput(BaseModel):
    """AI-Radar Supabase 读节点的出参"""
    ai_radar_items: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="从 AI-Radar Supabase 读取的产品/资讯列表",
    )
    ai_radar_count: int = Field(default=0, description="成功读取条数")
    ai_radar_skipped: int = Field(default=0, description="跳过（无凭据/异常）条数")
    ai_radar_error: str = Field(default="", description="异常信息")


# ============ Supabase REST 客户端（无依赖） ============


def _supabase_get(
    path: str,
    params: Dict[str, str] | None = None,
    timeout: int = 10,
) -> List[Dict[str, Any]]:
    """通过 Supabase REST API 读取数据（无需 supabase-py 依赖）"""
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not base or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY 未配置")

    query = ""
    if params:
        query = "?" + "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{base}/rest/v1/{path}{query}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ============ 数据转换 ============


def _to_unified_record(row: Dict[str, Any]) -> Dict[str, Any]:
    """将 Supabase products 行转为 workflow 内部统一记录"""
    return {
        "title": row.get("name_zh") or row.get("name_en") or row.get("name") or "",
        "url": row.get("website_url") or row.get("github_url") or "",
        "summary": row.get("description_zh") or row.get("description_en") or row.get("description") or "",
        "source": "ai-radar-supabase",
        "source_id": row.get("slug") or row.get("id"),
        "content_type": _infer_content_type(row),
        "category": row.get("category") or "",
        "tags": row.get("tags") or [],
        "score": float(row.get("confidence_score") or 0),
        "published_at": row.get("last_seen") or row.get("updated_at") or "",
        "raw": row,
    }


def _infer_content_type(row: Dict[str, Any]) -> str:
    """根据 Supabase 字段推断 content_type（与 multi_source_aggregator 一致）"""
    cat = (row.get("category") or "").lower()
    if cat in ("model", "ai-models"):
        return "model_release"
    if cat in ("product", "ai-products"):
        return "product_launch"
    if cat in ("paper", "research"):
        return "paper"
    if cat in ("discussion", "community"):
        return "discussion"
    return "news"


# ============ 节点函数 ============


def ai_radar_supabase_reader_node(
    state: AIRadarSupabaseInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> AIRadarSupabaseOutput:
    """
    title: AI-Radar Supabase 读取
    desc: 从 AI-Radar 的 Supabase products 表读取已抓取的数据，
          作为 workflow 的高质量数据源（与 trendradar/aihot/websearch 并行）
    """
    ctx = runtime.context
    logger.info(
        "[ai_radar] start product=%s days=%d limit=%d",
        state.product_id, state.days, state.limit,
    )

    # 1. 凭据检查
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not supabase_url or not supabase_key:
        logger.warning("[ai_radar] 缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY,跳过")
        return AIRadarSupabaseOutput(
            ai_radar_skipped=1,
            ai_radar_error="missing_supabase_credentials",
        )

    # 2. 时间窗口
    since = (
        datetime.now(timezone.utc) - timedelta(days=state.days)
    ).isoformat()

    # 3. 查询
    try:
        rows = _supabase_get(
            os.getenv("AI_RADAR_TABLE", "products"),
            params={
                "select": "id,slug,name,name_en,name_zh,description,description_zh,"
                          "website_url,github_url,category,tags,confidence_score,"
                          "last_seen,updated_at",
                "last_seen": f"gte.{since}",
                "order": "last_seen.desc",
                "limit": str(state.limit),
            },
        )
    except urllib.error.HTTPError as e:
        logger.error("[ai_radar] HTTP %d: %s", e.code, e.reason)
        return AIRadarSupabaseOutput(
            ai_radar_error=f"http_{e.code}_{e.reason}",
        )
    except Exception as e:
        logger.error("[ai_radar] 抓取失败: %s", e)
        return AIRadarSupabaseOutput(
            ai_radar_error=f"fetch_failed:{e}",
        )

    # 4. 转换
    records: List[Dict[str, Any]] = []
    for row in rows or []:
        try:
            rec = _to_unified_record(row)
            if rec["title"]:
                records.append(rec)
        except Exception as e:
            logger.warning("[ai_radar] 跳过异常行: %s", e)
            continue

    logger.info(
        "[ai_radar] 成功 %d 条 (来源 AI-Radar Supabase products)",
        len(records),
    )

    return AIRadarSupabaseOutput(
        ai_radar_items=records,
        ai_radar_count=len(records),
    )
