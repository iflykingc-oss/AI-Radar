"""
v4.5 节点：飞书推送节点（带 Harness 能力）
- 单一职责：HTTP 调用飞书 webhook + 状态返回
- Harness 能力：
  - Retry: 指数退避重试3次（requests.RequestException, Timeout）
  - Fallback: 卡片发送失败 → 降级为 text 消息
  - Observability: 节点耗时 + 推送状态指标
"""
import os
import json
import logging
import requests
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import FeishuPusherInput, FeishuPusherOutput
from graphs.utils.harness import (
    retry_with_backoff,
    with_fallback,
    node_metrics,
    log_node_result,
)

logger = logging.getLogger(__name__)

FEISHU_INTEGRATION_ID = "integration-feishu-message"


def _get_feishu_webhook() -> str:
    """从 coze workload identity 获取飞书消息 webhook URL"""
    from coze_workload_identity import Client
    client = Client()
    credential = client.get_integration_credential(FEISHU_INTEGRATION_ID)
    return json.loads(credential).get("webhook_url", "")


@retry_with_backoff(
    max_retries=3,
    initial_delay=1.0,
    backoff=2.0,
    exceptions=(requests.RequestException, requests.Timeout, ConnectionError),
)
def _send_feishu_card_with_retry(webhook_url: str, payload: dict, timeout: int = 15) -> tuple:
    """带重试的飞书卡片推送。返回 (status_code, text)"""
    resp = requests.post(webhook_url, json=payload, timeout=timeout)
    return resp.status_code, resp.text[:200]


def _send_feishu_card_with_fallback(webhook_url: str, payload: dict) -> str:
    """
    发送飞书卡片 + 降级到 text
    返回 'success' 或 'fail: ...'
    """
    # 1. 尝试发送卡片（带3次重试）
    try:
        status_code, text = _send_feishu_card_with_retry(webhook_url, payload, timeout=15)
        if status_code == 200:
            return "success"
        # 状态码非200，触发降级
        raise RuntimeError(f"HTTP {status_code}: {text}")
    except Exception as e:
        logger.warning(f"[feishu_pusher] 卡片发送失败，触发降级到 text: {e}")

    # 2. 降级：发送 text 消息（从卡片 payload 提取 summary）
    text_payload = _build_fallback_text_payload(payload)
    try:
        status_code, text = _send_feishu_card_with_retry(webhook_url, text_payload, timeout=15)
        if status_code == 200:
            logger.info("[feishu_pusher] 降级为 text 成功")
            return "success:fallback_text"
        return f"fail: 降级text也失败(HTTP {status_code})"
    except Exception as fe:
        return f"fail: 降级text失败({fe})"


def _build_fallback_text_payload(card_payload: dict) -> dict:
    """从卡片 payload 提取摘要，构造降级的 text 消息 payload"""
    # 卡片通常有 header.title 和 elements 结构
    title = ""
    summary = ""
    try:
        header = card_payload.get("header", {})
        title = header.get("title", {}).get("content", "") if isinstance(header.get("title"), dict) else str(header.get("title", ""))
        # 提取第一个 markdown/lark_md 元素的内容作为摘要
        elements = card_payload.get("elements", [])
        for el in elements:
            tag = el.get("tag", "")
            if tag in ("markdown", "lark_md"):
                content = el.get("content", "")
                if content and len(content) > 20:
                    summary = content[:1500]  # 飞书 text 消息有长度限制
                    break
    except Exception:
        pass

    text_content = f"{title}\n{summary}" if title else (summary or "推送失败，请查看日志")
    return {
        "msg_type": "text",
        "content": {"text": text_content[:2000]},
    }


def feishu_pusher_node(state: FeishuPusherInput, config: RunnableConfig, runtime: Runtime[Context]) -> FeishuPusherOutput:
    """
    title: 飞书消息推送
    desc: 将构建好的飞书卡片 payload 推送到飞书 webhook
    integrations: 飞书消息
    """
    with node_metrics("feishu_pusher", {"product_id": state.product_id}):
        if not state.card_payload:
            logger.error("[feishu_pusher] card_payload 为空，跳过推送")
            log_node_result(node_name="feishu_pusher", status="fail: empty_payload", duration_ms=0)
            return FeishuPusherOutput(
                product_id=state.product_id,
                push_status="fail: card_payload 为空",
                status_code=0,
            )

        try:
            webhook_url = state.webhook_url or _get_feishu_webhook()
            if not webhook_url:
                raise ValueError("未获取到飞书 webhook URL")

            push_status = _send_feishu_card_with_fallback(webhook_url, state.card_payload)
            status_code = 200 if push_status.startswith("success") else 0

            log_node_result(
                node_name="feishu_pusher",
                status=push_status,
                duration_ms=0,
                metrics={"used_fallback": "text" if "fallback" in push_status else "card"},
            )

            if push_status.startswith("success"):
                logger.info(f"[feishu_pusher] 推送成功: product={state.product_id}")
            else:
                logger.error(f"[feishu_pusher] 推送失败: {push_status}")

            return FeishuPusherOutput(
                product_id=state.product_id,
                push_status=push_status,
                status_code=status_code,
            )
        except Exception as e:
            logger.error(f"[feishu_pusher] 异常: {e}")
            log_node_result(
                node_name="feishu_pusher",
                status=f"fail: {e}",
                duration_ms=0,
            )
            return FeishuPusherOutput(
                product_id=state.product_id,
                push_status=f"fail: {e}",
                status_code=0,
            )
