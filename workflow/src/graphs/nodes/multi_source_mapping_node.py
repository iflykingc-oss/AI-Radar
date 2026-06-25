"""
v5.0 数据映射节点
将多源聚合器的 unified_items 映射为下游 event_dedup 期望的 raw_search_results
保持下游节点零修改
"""
import logging
from typing import List, Dict, Any
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from pydantic import BaseModel, Field
from coze_coding_utils.runtime_ctx.context import Context

logger = logging.getLogger(__name__)


class MultiSourceMappingInput(BaseModel):
    """v5.0 多源映射节点输入"""
    product_id: str = Field(..., description="产品ID")
    # 关键：字段名必须叫 unified_items 以匹配 GlobalState
    unified_items: List[dict] = Field(default=[], description="多源聚合器输出（来自 GlobalState）")


class MultiSourceMappingOutput(BaseModel):
    """v5.0 多源映射节点输出"""
    product_id: str = Field(..., description="产品ID")
    raw_search_results: List[dict] = Field(default=[], description="兼容 event_dedup 节点")


def multi_source_mapping_node(
    state: MultiSourceMappingInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> MultiSourceMappingOutput:
    """
    title: 多源数据映射
    desc: 将多源聚合器的 unified_items 映射为下游 event_dedup 期望的
          raw_search_results 格式（保持下游零修改）
    """
    product_id = state.product_id
    items = state.unified_items or []
    # 把 4D 评分映射为 source_score（保持下游兼容性）
    mapped: List[Dict[str, Any]] = []
    for it in items:
        m = dict(it)
        # 用 4D 评分作为 source_score（保持下游打分体系连续）
        m.setdefault("source_score", it.get("score_4d", 0))
        m.setdefault("source_type", it.get("source_type", "multi_source"))
        m.setdefault("source", it.get("source") or it.get("platform_name") or "multi_source")
        mapped.append(m)
    logger.info(
        f"[multi_source_mapping] product={product_id}, 映射 {len(mapped)} 条 → raw_search_results"
    )
    return MultiSourceMappingOutput(
        product_id=product_id,
        raw_search_results=mapped,
    )
