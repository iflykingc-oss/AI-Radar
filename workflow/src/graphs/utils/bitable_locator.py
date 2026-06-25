"""
v4.7 飞书多维表格定位器 - 共享工具

提供"通过 product_id 派生查找 Base / 数据表"的能力。
- 替代各节点硬编码的 app_token/table_id 依赖
- 允许 trend_analysis / history_reader / feedback_reader 在 app_token/table_id 未设置时
  仍然能通过 product_id 找到对应的 Base 和表

这样可以实现 v4.7 的并行架构：
  filter_news → [write_to_bitable, trend_analysis, history_reader] → analyze_llm
三个下游 task 不再互相串行等待 app_token/table_id。
"""
import logging
from typing import Optional, Tuple, List, Dict, Any
import requests
from cozeloop.decorator import observe
from coze_workload_identity import Client

logger = logging.getLogger(__name__)


_FEISHU_BASE_URL = "https://open.larkoffice.com/open-apis"


def _get_feishu_token() -> str:
    """获取飞书多维表格的租户访问令牌"""
    client = Client()
    return client.get_integration_credential("integration-feishu-base")


def _feishu_headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_feishu_token()}",
        "Content-Type": "application/json; charset=utf-8",
    }


@observe
def _feishu_request(method: str, path: str, params: dict = None, json_data: dict = None, timeout: int = 30) -> dict:
    url = f"{_FEISHU_BASE_URL}{path}"
    resp = requests.request(
        method,
        url,
        headers=_feishu_headers(),
        params=params,
        json=json_data,
        timeout=timeout,
    )
    try:
        resp_data = resp.json()
    except ValueError as e:
        raise Exception(f"BitableLocator invalid JSON: {e}; status={resp.status_code}")
    if resp_data.get("code") != 0:
        raise Exception(f"BitableLocator API error: code={resp_data.get('code')}, msg={resp_data.get('msg')}")
    return resp_data


def list_bases(page_size: int = 50) -> List[Dict[str, Any]]:
    """列出当前租户下所有多维表格 Base。"""
    result: List[Dict[str, Any]] = []
    page_token: Optional[str] = None
    while True:
        params: Dict[str, Any] = {"page_size": min(page_size, 50)}
        if page_token:
            params["page_token"] = page_token
        resp = _feishu_request("GET", "/bitable/v1/apps", params=params)
        data = resp.get("data", {})
        result.extend(data.get("items", []))
        if not data.get("has_more"):
            break
        page_token = data.get("page_token")
        if not page_token:
            break
    return result


def find_base_by_name(base_name: str) -> Optional[str]:
    """按名称查找 Base，返回 app_token（找不到返回 None）"""
    if not base_name:
        return None
    for base in list_bases():
        if base.get("name") == base_name:
            return base.get("app_token")
    return None


def find_table_by_names(app_token: str, name_candidates: List[str]) -> Optional[Tuple[str, str]]:
    """
    在指定 Base 下按名称列表查找数据表。
    返回 (table_id, table_name) 或 None。
    """
    if not app_token:
        return None
    try:
        resp = _feishu_request("GET", f"/bitable/v1/apps/{app_token}/tables")
    except Exception as e:
        logger.warning(f"[BitableLocator] 列出Base下的表失败: {e}")
        return None
    tables = resp.get("data", {}).get("items", [])
    for name in name_candidates:
        for t in tables:
            if t.get("name") == name:
                return t.get("table_id"), name
    return None


def resolve_product_bitable(
    product_id: str,
    bitable_base_name: Optional[str] = None,
    app_token: Optional[str] = None,
    table_id: Optional[str] = None,
    table_name_candidates: Optional[List[str]] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    解析产品对应的 Bitable (app_token, table_id)。

    解析顺序：
    1. 如果同时给了 app_token 和 table_id → 直接返回
    2. 如果给了 app_token 但没有 table_id → 在该 Base 下按 table_name_candidates 查找
    3. 否则按 bitable_base_name / 默认命名规则查找 Base，再在 Base 下找表

    Args:
        product_id: 产品ID
        bitable_base_name: 产品对应的 Bitable Base 名（None 时用 product_id 派生）
        app_token: 已知的 app_token（可空）
        table_id: 已知的 table_id（可空）
        table_name_candidates: 在 Base 下要查找的表名候选列表（None 时用默认列表）

    Returns:
        (app_token, table_id) 或 (None, None) 表示找不到
    """
    # 1. 已知 app_token 和 table_id
    if app_token and table_id:
        return app_token, table_id

    # 2. 给定 app_token 但需要找 table_id
    if app_token and not table_id:
        candidates = table_name_candidates or [f"{product_id}_news", f"{product_id}", "default_table", "数据表"]
        result = find_table_by_names(app_token, candidates)
        if result:
            tid, tname = result
            logger.info(f"[BitableLocator] 在app_token下找到表: {tname} → table_id={tid[:8]}...")
            return app_token, tid
        return app_token, None

    # 3. 完全按 product_id 派生查找
    if not bitable_base_name:
        bitable_base_name = f"{product_id}_bitable"

    base_candidates = [bitable_base_name, product_id, f"{product_id}_资讯"]
    resolved_app_token: Optional[str] = None
    for name in base_candidates:
        resolved_app_token = find_base_by_name(name)
        if resolved_app_token:
            logger.info(f"[BitableLocator] 找到Base: {name} → app_token={resolved_app_token[:8]}...")
            break

    if not resolved_app_token:
        logger.info(f"[BitableLocator] 未找到产品 {product_id} 对应的Base")
        return None, None

    # 在该 Base 下找表
    table_candidates = table_name_candidates or [f"{product_id}_news", f"{product_id}", "default_table", "数据表"]
    result = find_table_by_names(resolved_app_token, table_candidates)
    if result:
        tid, tname = result
        logger.info(f"[BitableLocator] 找到表: {tname} → table_id={tid[:8]}...")
        return resolved_app_token, tid

    logger.info(f"[BitableLocator] Base {resolved_app_token[:8]}... 下未找到符合的表")
    return resolved_app_token, None
