"""
信息筛选节点（v4.6升级）

核心能力：
1. 接收去重后的事件列表
2. 加载产品专属的筛选模型配置
3. v4.6新增：读 state.feedback_signals，将用户偏好注入LLM prompt
4. v4.6新增：筛选后根据 feedback_signals 对低偏好主题降权
5. 调用LLM进行智能筛选
6. 输出筛选后的新闻列表

v4.3+：
- 支持信源分数（source_score）
- 支持多源标记（source_count）

v4.6+：
- 读 GlobalState.feedback_signals
- 在LLM prompt中提示高偏好主题
"""
import os
import json
import re
from typing import List, Dict, Any
from jinja2 import Template
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from coze_coding_dev_sdk import LLMClient

from graphs.state import FilterNewsInput, FilterNewsOutput
from graphs.utils import get_filter_llm_config, get_logger
from graphs.utils.harness import node_metrics, with_fallback, retry_with_backoff


# 反馈权重：用于在 LLM 提示词中提示偏好
def _format_feedback_preferences(signals: Dict[str, float]) -> str:
    if not signals:
        return ""
    sorted_signals: List[tuple] = sorted(
        signals.items(), key=lambda x: x[1], reverse=True
    )
    lines: List[str] = []
    for topic, score in sorted_signals[:10]:
        if score > 0.1:
            lines.append(f"  - {topic}: ⭐用户偏好 (分数={score:.2f})，**优先保留**")
        elif score < -0.1:
            lines.append(f"  - {topic}: ⚠️用户不感兴趣 (分数={score:.2f})，**降低权重**")
    if not lines:
        return ""
    return "【用户偏好参考（来自历史反馈）】\n" + "\n".join(lines) + "\n\n"


def _apply_feedback_weighting(
    filtered: List[Dict[str, Any]],
    signals: Dict[str, float],
) -> List[Dict[str, Any]]:
    """
    对筛选结果应用反馈加权。
    - 高偏好主题 (score > 0.2)：添加 emphasis 标记
    - 低偏好主题 (score < -0.2)：降低 source_score 5分
    - 收藏主题 (score > 0.5)：添加 star 标记
    """
    if not signals or not filtered:
        return filtered

    for item in filtered:
        topic: str = str(item.get("topic", ""))
        signal: float = float(signals.get(topic, 0.0))
        if signal > 0.5:
            item["feedback_mark"] = "star"
        elif signal > 0.2:
            item["feedback_mark"] = "emphasis"
        elif signal < -0.2:
            original_score: int = int(item.get("source_score", 0))
            item["source_score"] = max(0, original_score - 5)
            item["feedback_mark"] = "demote"
    return filtered


def _fallback_filter(
    raw_data: List[Dict[str, Any]],
    product_id: str,
) -> List[Dict[str, Any]]:
    """降级函数：LLM失败时返回所有有效记录（按source_score排序）"""
    valid: List[Dict[str, Any]] = []
    for item in raw_data:
        if item.get("title") or item.get("snippet"):
            valid.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": (item.get("snippet", "") or "")[:200],
                "topic": item.get("topic", ""),
                "source": item.get("source", ""),
                "source_score": item.get("source_score", 0),
                "other_sources": item.get("other_sources", []),
                "source_count": item.get("source_count", 1),
            })
    valid.sort(key=lambda x: x.get("source_score", 0), reverse=True)
    return valid[:30]


@retry_with_backoff(
    max_retries=3,
    initial_delay=1.0,
    backoff=2.0,
    exceptions=(Exception,),
)
def _do_filter_with_llm(
    raw_data: List[Dict[str, Any]],
    product_id: str,
    search_text: str,
    feedback_preferences_text: str,
    trigger_time: str,
    sp_template: str,
    up_template: str,
    llm_config: Dict[str, Any],
    ctx: Context,
    logger,
) -> List[Dict[str, Any]]:
    """执行 LLM 筛选的主逻辑"""
    up_tpl = Template(up_template)
    user_prompt: str = up_tpl.render(
        search_results=search_text,
        trigger_time=trigger_time,
        feedback_preferences=feedback_preferences_text,
    )

    client = LLMClient(ctx=ctx)
    messages = [
        SystemMessage(content=sp_template),
        HumanMessage(content=user_prompt),
    ]

    response = client.invoke(
        messages=messages,
        model=llm_config.get("model", "doubao-seed-2-0-pro-260215"),
        temperature=llm_config.get("temperature", 0.1),
        top_p=llm_config.get("top_p", 0.0),
        max_completion_tokens=llm_config.get("max_completion_tokens", 4096),
        thinking=llm_config.get("thinking", "disabled"),
    )

    content: str = _get_text_content(response.content)
    logger.info(f"[filter_news] LLM返回内容: {content[:300]}")

    selected_indices: List[int] = []

    # 尝试1: 直接解析为JSON数组
    try:
        parsed = json.loads(content.strip())
        if isinstance(parsed, list):
            selected_indices = [int(x) for x in parsed if str(x).isdigit()]
    except (json.JSONDecodeError, ValueError):
        pass

    # 尝试2: 提取数字列表
    if not selected_indices:
        numbers = re.findall(r"\d+", content)
        if numbers:
            selected_indices = [int(n) for n in numbers if 1 <= int(n) <= len(raw_data)]

    # 尝试3: 匹配JSON数组
    if not selected_indices:
        array_match = re.search(r"\[[\s\S]*?\]", content)
        if array_match:
            try:
                parsed = json.loads(array_match.group())
                if isinstance(parsed, list):
                    selected_indices = [int(x) for x in parsed if str(x).isdigit()]
            except (json.JSONDecodeError, ValueError):
                pass

    filtered: List[Dict[str, Any]] = []
    for idx in selected_indices:
        if 1 <= idx <= len(raw_data):
            item = raw_data[idx - 1]
            filtered.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": (item.get("snippet", "") or "")[:200],
                "topic": item.get("topic", ""),
                "source": item.get("source", ""),
                "source_score": item.get("source_score", 0),
                "other_sources": item.get("other_sources", []),
                "source_count": item.get("source_count", 1),
            })
    return filtered


def _get_text_content(content: Any) -> str:
    """安全地获取 LLM 返回的文本内容"""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: List[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and "text" in item:
                parts.append(str(item.get("text", "")))
        return "".join(parts)
    return str(content) if content is not None else ""


def filter_news_node(
    state: FilterNewsInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> FilterNewsOutput:
    """
    title: 信息智能筛选
    desc: 根据产品配置中的大模型SP/UP，对搜索结果进行智能筛选，排除广告和低质内容
    integrations: 大语言模型
    """
    ctx = runtime.context
    logger = get_logger("filter_news")

    with node_metrics("filter_news", config) as m:
        m.add_metric("product_id", state.product_id)

        # 优先使用去重后的事件列表
        raw_data: List[Dict[str, Any]] = []
        if state.deduped_events:
            raw_data = state.deduped_events
            logger.info(f"[filter_news] product={state.product_id} 使用去重后事件列表，共 {len(raw_data)} 个独立事件")
        elif state.raw_search_results:
            raw_data = state.raw_search_results
            logger.info(f"[filter_news] product={state.product_id} 无去重事件，回退到原始搜索结果 {len(raw_data)} 条")

        if not raw_data:
            logger.info(f"[filter_news] product={state.product_id} 无数据可供筛选")
            return FilterNewsOutput(
                filtered_results=[],
                product_id=state.product_id,
                feedback_signals_used=0,
            )

        m.add_metric("raw_count", len(raw_data))
        logger.info(f"[filter_news] product={state.product_id} 开始筛选，共 {len(raw_data)} 条原始结果")

        # v4.6：读 GlobalState.feedback_signals
        feedback_signals: Dict[str, float] = state.feedback_signals or {}
        feedback_preferences_text: str = _format_feedback_preferences(feedback_signals)
        m.add_metric("feedback_signals_count", len(feedback_signals))
        logger.info(
            f"[filter_news] product={state.product_id} 加载 {len(feedback_signals)} 个主题的反馈信号"
        )

        # 加载产品专属的筛选模型配置
        try:
            llm_cfg = get_filter_llm_config(state.product_id)
        except Exception as e:
            logger.error(f"[filter_news] 加载产品配置失败: {e}")
            fallback_result = _fallback_filter(raw_data, state.product_id)
            return FilterNewsOutput(
                filtered_results=fallback_result,
                product_id=state.product_id,
                feedback_signals_used=len(feedback_signals),
            )

        llm_config = llm_cfg.get("config", {})
        sp_template: str = llm_cfg.get("sp", "")
        up_template: str = llm_cfg.get("up", "")

        # 准备搜索结果文本
        search_text_lines: List[str] = []
        for idx, item in enumerate(raw_data, 1):
            title = item.get("title", "")
            topic = item.get("topic", "")
            snippet = item.get("snippet", "")
            if not title and not snippet:
                continue
            short_snippet = (snippet or "")[:120].replace("\n", " ").replace("\r", " ")
            suffix_parts: List[str] = []
            score = item.get("source_score", 0)
            if score:
                suffix_parts.append(f"信源分{score}")
            src_count = item.get("source_count", 0)
            if src_count and src_count > 1:
                suffix_parts.append(f"{src_count}家信源")
            topic_signal: float = float(feedback_signals.get(str(topic), 0.0))
            if topic_signal > 0.2:
                suffix_parts.append(f"⭐用户偏好")
            suffix = f" ({' | '.join(suffix_parts)})" if suffix_parts else ""
            search_text_lines.append(
                f"[{idx}] 主题: {topic}\n"
                f"    标题: {title}{suffix}\n"
                f"    摘要: {short_snippet}\n"
            )

        if not search_text_lines:
            logger.warning(f"[filter_news] product={state.product_id} 所有搜索结果均为空，跳过筛选")
            return FilterNewsOutput(
                filtered_results=[],
                product_id=state.product_id,
                feedback_signals_used=len(feedback_signals),
            )

        search_text: str = "\n".join(search_text_lines)
        logger.info(f"[filter_news] 筛选输入文本长度: {len(search_text)} 字符")

        # 调用 LLM 筛选（带重试）
        filtered: List[Dict[str, Any]] = []
        try:
            filtered = _do_filter_with_llm(
                raw_data=raw_data,
                product_id=state.product_id,
                search_text=search_text,
                feedback_preferences_text=feedback_preferences_text,
                trigger_time=state.trigger_time,
                sp_template=sp_template,
                up_template=up_template,
                llm_config=llm_config,
                ctx=ctx,
                logger=logger,
            )
            logger.info(f"[filter_news] product={state.product_id} 筛选完成: {len(raw_data)} -> {len(filtered)} 条")
        except Exception as e:
            logger.error(f"[filter_news] LLM调用失败，使用降级函数: {e}")
            filtered = _fallback_filter(raw_data, state.product_id)

        # v4.6：应用反馈加权
        filtered = _apply_feedback_weighting(filtered, feedback_signals)

        m.add_metric("filtered_count", len(filtered))
        m.add_metric("feedback_signals_used", len(feedback_signals))
        return FilterNewsOutput(
            filtered_results=filtered,
            product_id=state.product_id,
            feedback_signals_used=len(feedback_signals),
        )
