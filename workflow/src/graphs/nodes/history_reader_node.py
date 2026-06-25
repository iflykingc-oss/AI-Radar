"""
v4.4 节点拆分 - 历史记录读取节点
- 从飞书多维表格查询历史数据
- 用于URL去重+趋势分析
"""
import os
import json
import logging
from typing import Any, Dict, List, Optional
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import HistoryReaderInput, HistoryReaderOutput
from cozeloop.decorator import observe
from coze_workload_identity import Client
import requests

logger = logging.getLogger(__name__)


# ============================================================
# 飞书多维表格 HTTP 客户端（只读历史数据用）
# ============================================================

def get_access_token() -> str:
    """获取飞书多维表格的租户访问令牌"""
    client = Client()
    return client.get_integration_credential("integration-feishu-base")


class FeishuBitableHistory:
    """飞书多维表格历史数据查询客户端"""

    def __init__(self, base_url: str = "https://open.larkoffice.com/open-apis", timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._token: Optional[str] = None

    def _get_token(self) -> str:
        if not self._token:
            self._token = get_access_token()
        return self._token

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json; charset=utf-8",
        }

    @observe
    def _request(self, method: str, path: str, params: dict = None, json_data: dict = None) -> dict:
        url = f"{self.base_url}{path}"
        try:
            resp = requests.request(method, url, headers=self._headers(), params=params, json=json_data, timeout=self.timeout)
            resp_data = resp.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"FeishuBitable API request error: {e}")
        if resp_data.get("code") != 0:
            raise Exception(f"FeishuBitable API error: {resp_data}")
        return resp_data

    def search_record(self, app_token: str, table_id: str, page_size: int = 500) -> dict:
        """查询多维表格历史记录（按采集时间倒序）"""
        params = {"page_size": page_size}
        body = {"sort": [{"field_name": "采集时间", "desc": True}]}
        return self._request(
            "POST",
            f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/search",
            params=params,
            json=body,
        )


# ============================================================
# 节点主函数
# ============================================================

def history_reader_node(state: HistoryReaderInput, config: RunnableConfig, runtime: Runtime[Context]) -> HistoryReaderOutput:
    """
    title: 读取飞书多维表格历史数据
    desc: 从飞书多维表格查询历史已推送信息，用于URL去重+趋势对比
    integrations: 飞书多维表格
    """
    logger.info(
        f"[history_reader] product={state.product_id} "
        f"app_token={state.app_token[:8] if state.app_token else 'empty'}... "
        f"table_id={state.table_id[:8] if state.table_id else 'empty'}... "
        f"days={state.days}"
    )

    # v4.7：app_token/table_id 为空时主动按 product_id 派生查找
    app_token: str = state.app_token
    table_id: str = state.table_id
    if not app_token or not table_id:
        try:
            from graphs.utils import resolve_product_bitable
            resolved_token, resolved_table = resolve_product_bitable(
                product_id=state.product_id,
                bitable_base_name=None,
                app_token=None,
                table_id=None,
                table_name_candidates=[f"{state.product_id}_news", f"{state.product_id}", "数据表", "default_table"],
            )
            if resolved_token:
                app_token = resolved_token
            if resolved_table:
                table_id = resolved_table
            logger.info(
                f"[history_reader] v4.7 fallback resolve: app_token={app_token[:8] if app_token else 'empty'}... "
                f"table_id={table_id[:8] if table_id else 'empty'}..."
            )
        except Exception as e:
            # v4.7 fallback 失败时（如 401 集成未授权）降级为空记录
            logger.warning(f"[history_reader] v4.7 fallback resolve 失败（降级为空记录）: {e}")
            app_token = ""
            table_id = ""

    if not app_token or not table_id:
        logger.warning("[history_reader] app_token/table_id 为空，跳过历史读取")
        return HistoryReaderOutput(
            history_records=[],
            history_count=0,
        )

    try:
        bitable = FeishuBitableHistory()
        resp = bitable.search_record(
            app_token=app_token,
            table_id=table_id,
            page_size=500,
        )
        items = resp.get("data", {}).get("items", [])
        history_records = [item.get("fields", {}) for item in items]
        logger.info(f"[history_reader] 读取到 {len(history_records)} 条历史记录")
    except Exception as e:
        logger.warning(f"[history_reader] 读取Bitable失败: {e}")

    return HistoryReaderOutput(
        history_records=history_records,
        history_count=len(history_records),
    )
