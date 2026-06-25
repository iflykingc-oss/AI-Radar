"""
飞书多维表格写入节点
根据 product_id / bitable_base_name 自动创建/写入对应产品的多维表格
"""
import os
import json
import datetime
import logging
from typing import List, Optional, Dict, Any
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import WriteToBitableInput, WriteToBitableOutput
from cozeloop.decorator import observe
from coze_workload_identity import Client

logger = logging.getLogger(__name__)


def get_access_token() -> str:
    """获取飞书多维表格的租户访问令牌"""
    client = Client()
    access_token = client.get_integration_credential("integration-feishu-base")
    return access_token


# 资讯数据表的字段定义（产品通用）
BITABLE_FIELDS = [
    {"field_name": "标题", "type": 1},
    {"field_name": "URL", "type": 1},
    {"field_name": "摘要", "type": 1},
    {"field_name": "来源", "type": 1},
    {"field_name": "主题", "type": 1},
    {"field_name": "采集时间", "type": 1},
]


class FeishuBitable:
    """飞书多维表格 HTTP 客户端"""

    def __init__(self, base_url: str = "https://open.larkoffice.com/open-apis", timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._token = None

    def _get_token(self) -> str:
        """惰性获取token"""
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
        import requests
        try:
            url = f"{self.base_url}{path}"
            resp = requests.request(method, url, headers=self._headers(), params=params, json=json_data, timeout=self.timeout)
            resp_data = resp.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"FeishuBitable API request error: {e}")
        if resp_data.get("code") != 0:
            raise Exception(f"FeishuBitable API error: {resp_data}")
        return resp_data

    def create_base(self, name: str = None) -> dict:
        """创建多维表格 Base"""
        body = {}
        if name:
            body["name"] = name
        return self._request("POST", "/bitable/v1/apps", json_data=body)

    def list_tables(self, app_token: str) -> dict:
        """列出 Base 下所有数据表"""
        return self._request("GET", f"/bitable/v1/apps/{app_token}/tables")

    def add_field(self, app_token: str, table_id: str, field: dict) -> dict:
        """新增字段"""
        return self._request("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/fields", json_data=field)

    def add_records(self, app_token: str, table_id: str, records: list) -> dict:
        """批量新增记录"""
        body = {"records": records}
        return self._request("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create", json_data=body)

    def search_record(
        self,
        app_token: str,
        table_id: str,
        page_size: int = 100,
        sort: list = None,
        filter: dict = None,
    ) -> dict:
        """条件查询记录"""
        params: Dict[str, Any] = {}
        body: Dict[str, Any] = {}
        if page_size:
            params["page_size"] = page_size
        if sort:
            body["sort"] = sort
        if filter:
            body["filter"] = filter
        return self._request("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/search", params=params, json_data=body)


def _ensure_bitable_exists(bitable_cls, app_token: str, table_id: str, base_name: str) -> tuple:
    """
    确保多维表格和数据表存在。
    如果未提供app_token，自动创建Base并初始化数据表。
    返回 (app_token, table_id, status_msg)
    """
    if app_token and table_id:
        return app_token, table_id, "使用已有配置"

    try:
        bitable = bitable_cls()
        # 1. 创建Base（按产品名命名）
        create_resp = bitable.create_base(name=base_name)
        # 返回格式: { "code": 0, "data": { "app": { "app_token": "xxx", ... } } }
        app_data = create_resp.get("data", {})
        app_info = app_data.get("app", {})
        new_app_token = app_info.get("app_token", "")
        if not new_app_token:
            # 兜底: 直接取 data.app_token
            new_app_token = app_data.get("app_token", "")
        if not new_app_token:
            raise Exception(f"创建Base失败，无法获取app_token，返回: {create_resp}")

        logger.info(f"[bitable] 创建Base成功({base_name}): {new_app_token}")

        # 2. 获取默认数据表（新建Base自动附带一张空表）
        tables_resp = bitable.list_tables(app_token=new_app_token)
        tables_items = tables_resp.get("data", {}).get("items", [])
        if not tables_items:
            raise Exception("新建Base无默认数据表")

        new_table_id = tables_items[0]["table_id"]
        logger.info(f"[bitable] 获取默认表成功: {new_table_id}")

        # 3. 添加自定义字段到默认表
        added_fields: List[str] = []
        for field_def in BITABLE_FIELDS:
            try:
                bitable.add_field(app_token=new_app_token, table_id=new_table_id, field=field_def)
                added_fields.append(field_def["field_name"])
            except Exception as e:
                logger.warning(f"[bitable] 添加字段「{field_def['field_name']}」失败: {e}")

        status_msg = f"自动创建: Base={new_app_token[:8]}... 表={new_table_id[:8]}... 字段={len(added_fields)}个"
        logger.info(f"[bitable] {status_msg}")
        return new_app_token, new_table_id, status_msg

    except Exception as e:
        logger.error(f"[bitable] 自动创建失败: {e}")
        return "", "", f"auto_create_fail: {e}"


def write_to_bitable_node(state: WriteToBitableInput, config: RunnableConfig, runtime: Runtime[Context]) -> WriteToBitableOutput:
    """
    title: 飞书多维表格写入
    desc: 根据产品(product_id)自动创建/写入飞书多维表格，每个产品独立Base
    integrations: 飞书多维表格
    """
    ctx = runtime.context
    logger.info(
        f"[write_to_bitable] product={state.product_id} ({state.product_name}) "
        f"开始写入，共 {len(state.filtered_results)} 条记录"
    )

    # 自动创建/获取Base + Table（每个产品独立Base）
    app_token, table_id, setup_status = _ensure_bitable_exists(
        FeishuBitable,
        state.app_token,
        state.table_id,
        state.bitable_base_name,
    )

    if not app_token or not table_id:
        logger.warning(f"[write_to_bitable] 多维表格就绪失败: {setup_status}")
        return WriteToBitableOutput(
            app_token=app_token or "",
            table_id=table_id or "",
            write_status=f"skipped: {setup_status}",
            records_count=0,
            filtered_count=len(state.filtered_results),
            filtered_results=state.filtered_results,
        )

    # 准备写入数据
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    records: List[Dict[str, Any]] = []
    for item in state.filtered_results:
        if not isinstance(item, dict):
            continue
        title = item.get("title", "")
        url = item.get("url", "")
        snippet = item.get("snippet", "")[:500] if item.get("snippet") else ""
        source = item.get("source", "")
        topic = item.get("topic", "")
        collect_time = f"{now_str} | {state.trigger_time} | {state.product_name}"
        records.append({
            "fields": {
                "标题": title,
                "URL": url,
                "摘要": snippet,
                "来源": source,
                "主题": topic,
                "采集时间": collect_time,
            }
        })

    # 批量写入（每次最多500条）
    if records:
        try:
            bitable = FeishuBitable()
            batch_size = 500
            total_written = 0
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                bitable.add_records(app_token=app_token, table_id=table_id, records=batch)
                total_written += len(batch)
            write_status = f"success: 写入{total_written}条 | {setup_status}"
            logger.info(f"[write_to_bitable] 写入成功: {total_written}条")
        except Exception as e:
            write_status = f"fail: {e}"
            logger.error(f"[write_to_bitable] 写入失败: {e}")
    else:
        write_status = "skipped: 无有效数据"
        logger.info("[write_to_bitable] 无有效数据可写入")

    return WriteToBitableOutput(
        app_token=app_token,
        table_id=table_id,
        write_status=write_status,
        records_count=len(records),
        filtered_count=len(state.filtered_results),
        filtered_results=state.filtered_results,
    )
