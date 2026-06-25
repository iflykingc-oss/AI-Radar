"""
产品配置加载器
从 config/products/{product_id}.json 读取产品元信息+筛选/分析LLM配置

# 配置文件结构：
# {
#   "config": {...},        # 筛选模型配置（顶层）
#   "tools": [...],
#   "sp": "...",            # 筛选系统提示词
#   "up": "...",            # 筛选用户提示词
#   "product_id": "ai_daily",
#   "product_name": "中文AI早报",
#   "card_title": "🤖 中文AI早报",
#   "card_template": "purple",
#   "search_topics": [...],
#   "bitable_base_name": "...",
#   "analysis_config": {    # 分析模型配置（嵌套）
#     "config": {...},
#     "sp": "...",
#     "up": "..."
#   }
# }
"""
import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

WORKSPACE_PATH = os.getenv("COZE_WORKSPACE_PATH", "")
PRODUCTS_DIR = os.path.join(WORKSPACE_PATH, "config", "products")

# 支持的产品ID列表
SUPPORTED_PRODUCTS = ["ai_daily", "overseas_ceo", "global_ai"]

# 产品ID -> 默认配置路径
DEFAULT_PRODUCT = "ai_daily"


def load_product_config(product_id: str) -> Dict[str, Any]:
    """
    加载产品配置

    Args:
        product_id: 产品ID，支持 'ai_daily' / 'overseas_ceo' / 'global_ai'

    Returns:
        产品配置字典（包含元信息+筛选/分析LLM配置）
    """
    if not product_id:
        product_id = DEFAULT_PRODUCT
    if product_id not in SUPPORTED_PRODUCTS:
        logger.warning(f"[product_config] 不支持的产品ID: {product_id}，使用默认: {DEFAULT_PRODUCT}")
        product_id = DEFAULT_PRODUCT

    config_path = os.path.join(PRODUCTS_DIR, f"{product_id}.json")
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"产品配置文件不存在: {config_path}")

    with open(config_path, "r", encoding="utf-8") as fd:
        cfg = json.load(fd)

    # 校验必填字段
    required = ["product_id", "product_name", "search_topics", "analysis_config"]
    for key in required:
        if key not in cfg:
            raise ValueError(f"产品配置缺少必填字段 {key}: {config_path}")

    logger.info(f"[product_config] 加载产品配置成功: {cfg['product_name']} ({product_id})")
    return cfg


def get_filter_llm_config(product_id: str) -> Dict[str, Any]:
    """获取产品专属的筛选模型配置 (config/sp/up) - 从顶层取"""
    cfg = load_product_config(product_id)
    return {
        "config": cfg.get("config", {}),
        "tools": cfg.get("tools", []),
        "sp": cfg.get("sp", ""),
        "up": cfg.get("up", ""),
    }


def get_analysis_llm_config(product_id: str) -> Dict[str, Any]:
    """获取产品专属的分析模型配置 (config/sp/up) - 从 analysis_config 嵌套中取"""
    cfg = load_product_config(product_id)
    analysis_cfg = cfg.get("analysis_config", {})
    return {
        "config": analysis_cfg.get("config", {}),
        "tools": analysis_cfg.get("tools", []),
        "sp": analysis_cfg.get("sp", ""),
        "up": analysis_cfg.get("up", ""),
    }


def get_weekly_report_llm_config(product_id: str) -> Dict[str, Any]:
    """获取产品专属的周报模型配置 (config/sp/up) - 从 weekly_report_llm_cfg 嵌套中取"""
    cfg = load_product_config(product_id)
    weekly_cfg = cfg.get("weekly_report_llm_cfg", {})
    if not isinstance(weekly_cfg, dict) or not weekly_cfg:
        return {"config": {}, "tools": [], "sp": "", "up": ""}
    return {
        "config": weekly_cfg.get("config", {}),
        "tools": weekly_cfg.get("tools", []),
        "sp": weekly_cfg.get("sp", ""),
        "up": weekly_cfg.get("up", ""),
    }


def get_search_topics(product_id: str) -> list:
    """获取产品搜索主题列表"""
    cfg = load_product_config(product_id)
    return cfg.get("search_topics", [])


def get_bitable_base_name(product_id: str) -> str:
    """获取产品对应的飞书多维表格Base名称"""
    cfg = load_product_config(product_id)
    return cfg.get("bitable_base_name", cfg.get("product_name", "未知产品"))


def get_card_meta(product_id: str) -> Dict[str, str]:
    """获取产品卡片元信息 (title/template)"""
    cfg = load_product_config(product_id)
    return {
        "card_title": cfg.get("card_title", f"📬 {cfg.get('product_name', '资讯速递')}"),
        "card_template": cfg.get("card_template", "blue"),
        "product_name": cfg.get("product_name", "资讯速递"),
    }


# ============ Harness 工具（重试+降级+可观测）============
from .harness import (
    get_logger,
    is_retryable_error,
    node_metrics,
    with_fallback,
    retry_with_backoff,
    NodeMetricsCollector,
    log_node_result,
)

# ============ Bitable 定位器（v4.7 通过 product_id 查找 base/table）============
from .bitable_locator import (
    resolve_product_bitable,
    find_base_by_name,
    find_table_by_names,
    list_bases,
)
