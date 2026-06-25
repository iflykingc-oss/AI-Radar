"""
v4.6 用户反馈信号读取节点

核心能力：
1. 从飞书多维表格读取历史内容记录的反馈字段（like_count/dislike_count/favorite_count）
2. 按主题聚合反馈统计
3. 计算每个主题的"偏好分数"
4. 输出到 GlobalState.feedback_signals

数据流：
Bitable反馈表 → 按主题聚合 → 偏好分数 → feedback_signals

为什么放在这个位置：
- 在 search_news 之后、filter_news 之前
- filter_news 需要用 feedback_signals 做主题加权
- 实际上可以与 event_dedup 并行（读取 Bitable 不依赖搜索结果）

注意：
- 反馈聚合表的命名约定：<product_id>_feedback_aggregates
- 如果表不存在（首次运行）→ 返回空 dict（真实结果：没有历史反馈）
- 如果表存在但没有数据 → 返回空 dict
- 不使用 mock 数据，所有调用走真实飞书多维表格 API
"""
import os
import json
import logging
from typing import Tuple, Any, Dict, List, Optional
import requests
import datetime as _dt
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from cozeloop.decorator import observe
from coze_workload_identity import Client
from graphs.state import FeedbackReaderInput, FeedbackReaderOutput
from graphs.utils.harness import node_metrics, with_fallback, retry_with_backoff
from graphs.utils.harness import get_logger, is_retryable_error

logger = logging.getLogger(__name__)


# 飞书多维表格 HTTP 基础地址
_FEISHU_BASE_URL = "https://open.larkoffice.com/open-apis"


def _get_feishu_token() -> str:
    """获取飞书多维表格的租户访问令牌"""
    client = Client()
    return client.get_integration_credential("integration-feishu-base")


class FeishuFeedbackClient:
    """飞书多维表格 - 反馈聚合表读取客户端"""

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self._token: Optional[str] = None

    def _get_token(self) -> str:
        if not self._token:
            self._token = _get_feishu_token()
        return self._token

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json; charset=utf-8",
        }

    @observe
    def _request(self, method: str, path: str, params: dict = None, json_data: dict = None) -> dict:
        url = f"{_FEISHU_BASE_URL}{path}"
        resp = requests.request(
            method,
            url,
            headers=self._headers(),
            params=params,
            json=json_data,
            timeout=self.timeout,
        )
        try:
            resp_data = resp.json()
        except ValueError as e:
            raise Exception(f"FeishuFeedbackClient invalid JSON response: {e}; status={resp.status_code}")
        if resp_data.get("code") != 0:
            raise Exception(f"FeishuFeedbackClient API error: code={resp_data.get('code')}, msg={resp_data.get('msg')}")
        return resp_data

    def list_bases(self) -> list:
        """列出当前租户下所有多维表格 Base，返回 list[dict]，每个含 app_token/name"""
        result: list = []
        page_token: Optional[str] = None
        while True:
            params: Dict[str, Any] = {"page_size": 50}
            if page_token:
                params["page_token"] = page_token
            resp = self._request("GET", "/bitable/v1/apps", params=params)
            data = resp.get("data", {})
            items = data.get("items", [])
            result.extend(items)
            if not data.get("has_more"):
                break
            page_token = data.get("page_token")
            if not page_token:
                break
        return result

    def find_base_by_name(self, base_name: str) -> Optional[str]:
        """按名称查找 Base，返回 app_token（找不到返回 None）"""
        for base in self.list_bases():
            name = base.get("name", "")
            if name == base_name:
                return base.get("app_token")
        return None

    def list_tables(self, app_token: str) -> list:
        """列出 Base 下所有数据表"""
        resp = self._request("GET", f"/bitable/v1/apps/{app_token}/tables")
        return resp.get("data", {}).get("items", [])

    def search_records(self, app_token: str, table_id: str, page_size: int = 500) -> list:
        """查询所有记录（无过滤条件），返回 list[dict]"""
        result: list = []
        page_token: Optional[str] = None
        while True:
            params: Dict[str, Any] = {"page_size": min(page_size, 500)}
            if page_token:
                params["page_token"] = page_token
            body: Dict[str, Any] = {"sort": [{"field_name": "采集时间", "desc": True}]}
            resp = self._request(
                "POST",
                f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/search",
                params=params,
                json_data=body,
            )
            data = resp.get("data", {})
            items = data.get("items", [])
            result.extend(items)
            if not data.get("has_more"):
                break
            page_token = data.get("page_token")
            if not page_token:
                break
        return result


def _resolve_feedback_table(product_id: str) -> tuple:
    """
    解析反馈聚合表的位置。
    约定：反馈表命名为 `<product_id>_feedback`，位于与资讯表相同的 Base 下。
    返回 (app_token, table_id) 或 (None, None) 表示找不到。
    """
    client = FeishuFeedbackClient()

    # 1. 查找与 product_id 关联的 Base
    base_name_candidates = [
        f"{product_id}_bitable",
        f"{product_id}",
        f"{product_id}_资讯",
    ]
    app_token: Optional[str] = None
    for base_name in base_name_candidates:
        try:
            app_token = client.find_base_by_name(base_name)
            if app_token:
                logger.info(f"[feedback_reader] 找到Base: {base_name} → app_token={app_token[:8]}...")
                break
        except Exception as e:
            logger.warning(f"[feedback_reader] 查找Base {base_name} 失败: {e}")

    if not app_token:
        logger.info(f"[feedback_reader] 未找到产品 {product_id} 对应的Base，无历史反馈可读")
        return None, None

    # 2. 在 Base 下找反馈表
    feedback_table_name_candidates = [
        f"{product_id}_feedback",
        f"{product_id}_feedback_aggregates",
        "反馈聚合",
        "feedback_aggregates",
    ]
    try:
        tables = client.list_tables(app_token=app_token)
    except Exception as e:
        logger.warning(f"[feedback_reader] 列出Base下的表失败: {e}")
        return None, None

    for table in tables:
        table_name = table.get("name", "")
        if table_name in feedback_table_name_candidates:
            table_id = table.get("table_id")
            logger.info(f"[feedback_reader] 找到反馈表: {table_name} → table_id={table_id[:8] if table_id else 'empty'}...")
            return app_token, table_id

    logger.info(f"[feedback_reader] Base {app_token[:8]}... 下未找到反馈表（首跑 / 尚未创建）")
    return None, None


def _read_feedback_records(product_id: str) -> List[Dict[str, Any]]:
    """
    真实读取飞书多维表格中的反馈记录。
    返回 list[dict]，每条记录包含 topic / like_count / dislike_count / favorite_count 等字段。
    """
    app_token, table_id = _resolve_feedback_table(product_id)
    if not app_token or not table_id:
        return []

    client = FeishuFeedbackClient()
    try:
        raw_records = client.search_records(app_token=app_token, table_id=table_id, page_size=500)
    except Exception as e:
        logger.warning(f"[feedback_reader] 读取反馈表记录失败: {e}")
        return []

    # 提取字段映射
    records: List[Dict[str, Any]] = []
    for rec in raw_records:
        fields = rec.get("fields", {})
        if not isinstance(fields, dict):
            continue
        records.append(fields)

    return records


@retry_with_backoff(
    max_retries=2,
    initial_delay=1.0,
    backoff=2.0,
    exceptions=(Exception,),
)
def _read_feedback_with_retry(product_id: str) -> List[Dict[str, Any]]:
    """带重试的反馈表读取"""
    return _read_feedback_records(product_id)


def _safe_read_feedback(product_id: str) -> List[Dict[str, Any]]:
    """带降级的反馈读取：失败时返回空 list"""
    try:
        return _read_feedback_with_retry(product_id)
    except Exception as e:
        logger.warning(f"[feedback_reader] 反馈读取全部失败，使用空信号降级: {e}")
        return []


def _aggregate_feedback_signals(records: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    将反馈记录按主题聚合为偏好分数。
    每条记录字段：topic / like_count / dislike_count / favorite_count
    score = (like - dislike*2 + favorite*2) / max(1, total)
    归一化到 [-1.0, 1.0] 区间。
    """
    if not records:
        return {}

    # 先按 topic 聚合
    aggregated: Dict[str, Dict[str, int]] = {}
    for rec in records:
        if not isinstance(rec, dict):
            continue
        topic = str(rec.get("topic", "")).strip()
        if not topic:
            continue
        bucket = aggregated.setdefault(
            topic,
            {"like_count": 0, "dislike_count": 0, "favorite_count": 0},
        )
        try:
            bucket["like_count"] += int(rec.get("like_count", 0) or 0)
        except (TypeError, ValueError):
            pass
        try:
            bucket["dislike_count"] += int(rec.get("dislike_count", 0) or 0)
        except (TypeError, ValueError):
            pass
        try:
            bucket["favorite_count"] += int(rec.get("favorite_count", 0) or 0)
        except (TypeError, ValueError):
            pass

    # 计算偏好分数
    signals: Dict[str, float] = {}
    for topic, counts in aggregated.items():
        like = int(counts.get("like_count", 0))
        dislike = int(counts.get("dislike_count", 0))
        favorite = int(counts.get("favorite_count", 0))
        total = like + dislike + favorite
        if total <= 0:
            continue
        raw_score = (like - dislike * 2 + favorite * 2) / max(1, total)
        signals[topic] = round(max(-1.0, min(1.0, raw_score)), 4)

    return signals


def feedback_reader_node(
    state: FeedbackReaderInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> FeedbackReaderOutput:
    """
    title: 反馈信号读取
    desc: 从飞书多维表格读取历史内容反馈（点赞/点踩/收藏），按主题聚合为偏好分数，输出到 GlobalState 供 filter_news 节点加权使用
    integrations: 飞书多维表格
    """
    log = get_logger("feedback_reader") if get_logger else logger

    with node_metrics("feedback_reader", config) as m:
        m.add_metric("product_id", state.product_id)
        m.add_metric("days_window", state.days)

        records: List[Dict[str, Any]] = _safe_read_feedback(state.product_id)

        signals: Dict[str, float] = _aggregate_feedback_signals(records)

        # v4.10 反馈机制深度学习：从推送记录表读近 N 天主题频次，生成"重复推送降权"信号
        try:
            push_topic_count: Dict[str, int] = _read_recent_push_topics(state.product_id, days=state.days)
            push_penalty: Dict[str, float] = _aggregate_push_frequency_penalty(push_topic_count)
            for topic, score in push_penalty.items():
                # 推送频次降权与用户反馈叠加（取较小值，避免互相抵消）
                if topic in signals:
                    signals[topic] = round(min(signals[topic], score), 4)
                else:
                    signals[topic] = score
            m.add_metric("push_records_topics", len(push_topic_count))
            m.add_metric("push_penalty_applied", len(push_penalty))
            if log:
                log.info(
                    f"[feedback_reader v4.10] 推送频次降权: 读到 {len(push_topic_count)} 个近 {state.days} 天主题，应用 {len(push_penalty)} 条降权信号"
                )
        except Exception as e:
            logger.warning(f"[feedback_reader v4.10] 推送频次降权失败（不影响主流程）: {e}")
            m.add_metric("push_penalty_error", str(e)[:100])

        positive_count: int = 0
        negative_count: int = 0
        favorite_count: int = 0
        for rec in records:
            if not isinstance(rec, dict):
                continue
            try:
                positive_count += int(rec.get("like_count", 0) or 0)
            except (TypeError, ValueError):
                pass
            try:
                negative_count += int(rec.get("dislike_count", 0) or 0)
            except (TypeError, ValueError):
                pass
            try:
                favorite_count += int(rec.get("favorite_count", 0) or 0)
            except (TypeError, ValueError):
                pass

        m.add_metric("records_read", len(records))
        m.add_metric("signals_count", len(signals))
        m.add_metric("positive_count", positive_count)
        m.add_metric("negative_count", negative_count)
        m.add_metric("favorite_count", favorite_count)

        if log:
            log.info(
                "feedback_reader done",
                extra={
                    "product_id": state.product_id,
                    "records_read": len(records),
                    "signals_count": len(signals),
                    "positive": positive_count,
                    "negative": negative_count,
                    "favorite": favorite_count,
                },
            )

        return FeedbackReaderOutput(
            feedback_signals=signals,
            positive_count=positive_count,
            negative_count=negative_count,
            favorite_count=favorite_count,
            total_feedback_records=len(records),
        )


# ============== v4.10 反馈机制深度学习：推送频次降权 ==============

def _resolve_push_records_table(product_id: str) -> Tuple[Optional[str], Optional[str]]:
    """
    找推送记录表（write_to_bitable_node 写入的默认表）。
    返回 (app_token, table_id) 或 (None, None)。
    """
    try:
        from graphs.utils.bitable_locator import resolve_product_bitable
        loc: Optional[Tuple[str, str]] = resolve_product_bitable(product_id)
        if loc:
            return loc[0], loc[1]
    except Exception as e:
        logger.warning(f"[feedback_reader] 通过 bitable_locator 找推送记录表失败: {e}")

    # fallback: 自己用 list_bases + list_tables
    try:
        client = FeishuFeedbackClient()
        for base_name in [f"{product_id}_bitable", product_id]:
            app_token = client.find_base_by_name(base_name)
            if not app_token:
                continue
            tables = client.list_tables(app_token=app_token)
            if not tables:
                continue
            # 推送记录表：找"主题"字段的表，或第一个表
            for tbl in tables:
                fields = tbl.get("fields", []) or []
                field_names = [f.get("field_name") for f in fields]
                if "主题" in field_names and "URL" in field_names:
                    return app_token, tbl.get("table_id")
            # 找不到带"主题"字段的表，取第一个表
            return app_token, tables[0].get("table_id")
    except Exception as e:
        logger.warning(f"[feedback_reader] 找推送记录表失败: {e}")
    return None, None


def _read_recent_push_topics(product_id: str, days: int = 7) -> Dict[str, int]:
    """
    读推送记录表近 N 天的"主题"字段，按主题聚合频次。
    返回 {topic: count}
    """
    app_token, table_id = _resolve_push_records_table(product_id)
    if not app_token or not table_id:
        return {}

    client = FeishuFeedbackClient()
    try:
        raw_records = client.search_records(app_token=app_token, table_id=table_id, page_size=500)
    except Exception as e:
        logger.warning(f"[feedback_reader] 读推送记录表失败: {e}")
        return {}

    # 算 N 天前的截止时间戳
    import datetime as _dt
    cutoff = (_dt.datetime.now() - _dt.timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")

    topic_count: Dict[str, int] = {}
    for rec in raw_records:
        if not isinstance(rec, dict):
            continue
        fields = rec.get("fields", {})
        if not isinstance(fields, dict):
            continue
        topic = str(fields.get("主题", "")).strip()
        if not topic:
            continue
        collect_time = str(fields.get("采集时间", ""))
        # 采集时间格式: "2026-06-19 08:00:00 | 早上8点 | 中文AI早报"
        if "|" in collect_time:
            ts = collect_time.split("|", 1)[0].strip()
        else:
            ts = collect_time.strip()
        if ts and ts < cutoff:
            continue  # 超过 N 天的跳过
        topic_count[topic] = topic_count.get(topic, 0) + 1

    return topic_count


def _aggregate_push_frequency_penalty(topic_count: Dict[str, int]) -> Dict[str, float]:
    """
    根据推送频次生成降权信号。
    目标：避免重复推送同一主题（防止"过滤气泡"）。
    频次 1-2 次 → -0.15（轻度降权）
    频次 3+ 次 → -0.4（强制降权，让用户看到新主题）
    """
    penalty: Dict[str, float] = {}
    for topic, cnt in topic_count.items():
        if cnt >= 3:
            penalty[topic] = -0.4
        elif cnt >= 1:
            penalty[topic] = -0.15
    return penalty
