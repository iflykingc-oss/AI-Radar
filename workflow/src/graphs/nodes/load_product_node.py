"""
入口节点：加载产品配置
根据 product_id 加载对应产品的元信息+配置
"""
import os
import logging
from typing import List
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import LoadProductInput, LoadProductOutput
from graphs.utils import load_product_config

logger = logging.getLogger(__name__)


def load_product_node(
    state: LoadProductInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> LoadProductOutput:
    """
    title: 加载产品配置
    desc: 根据 product_id 加载对应产品的元信息（搜索主题、卡片标题、表格名等）
    """
    ctx = runtime.context
    product_id = state.product_id or "ai_daily"
    logger.info(f"[load_product] 加载产品配置: {product_id}, 触发时段: {state.trigger_time}")

    cfg = load_product_config(product_id)

    return LoadProductOutput(
        product_id=cfg["product_id"],
        product_name=cfg["product_name"],
        card_title=cfg.get("card_title", f"📬 {cfg['product_name']}"),
        card_template=cfg.get("card_template", "blue"),
        search_topics=cfg.get("search_topics", []),
        search_time_range=cfg.get("search_time_range", "1d"),
        search_count_per_topic=cfg.get("search_count_per_topic", 5),
        bitable_base_name=cfg.get("bitable_base_name", cfg["product_name"]),
    )
