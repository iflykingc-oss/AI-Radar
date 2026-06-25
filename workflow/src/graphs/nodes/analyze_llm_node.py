"""
v4.4 节点拆分 - LLM分析节点
- 输入：filtered_results（去重后）+ history_records（去重用）
- URL去重（基于历史）
- 主题热度统计
- 加载产品专属LLM配置
- 调用LLM输出决策视角深度分析
- 输出：analysis_json + analysis_summary
"""
import os
import re
import json
import logging
from typing import Any, Dict, List, Optional
from jinja2 import Template
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import AnalyzeLLMInput, AnalyzeLLMOutput
from graphs.utils import get_analysis_llm_config
from coze_coding_dev_sdk import LLMClient
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)


# ============================================================
# 工具函数
# ============================================================

def get_text_content(content: Any) -> str:
    """安全地从LLM响应中提取文本内容"""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        texts: List[str] = []
        for item in content:
            if isinstance(item, str):
                texts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                texts.append(item.get("text", ""))
        return " ".join(texts)
    return str(content)


def extract_json_from_text(text: str) -> Optional[Dict]:
    """从文本中提取JSON对象，支持代码块包裹和纯文本"""
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if json_match:
        json_str = json_match.group(1).strip()
    else:
        brace_match = re.search(r"\{[\s\S]*\}", text)
        if brace_match:
            json_str = brace_match.group(0)
        else:
            return None
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        fixed = json_str.replace("'", '"')
        fixed = re.sub(r",\s*}", "}", fixed)
        fixed = re.sub(r",\s*]", "]", fixed)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            return None


# ============================================================
# 节点主函数
# ============================================================

def analyze_llm_node(state: AnalyzeLLMInput, config: RunnableConfig, runtime: Runtime[Context]) -> AnalyzeLLMOutput:
    """
    title: LLM深度分析（决策视角）
    desc: URL去重 + 主题统计 + 调用产品专属LLM输出决策视角分析（独立判断+机会+风险+建议）
    integrations: 大语言模型
    """
    ctx = runtime.context
    logger.info(
        f"[analyze_llm] product={state.product_id} "
        f"开始LLM分析, time={state.trigger_time}"
    )

    # ====== 1. URL去重（基于历史）======
    history_urls: set = set()
    for record in state.history_records or []:
        url = (record.get("URL", "") or "").strip().rstrip("/")
        if url:
            history_urls.add(url)

    current_data = state.filtered_results or []
    deduped_data: List[Dict] = []
    for item in current_data:
        item_url = (item.get("url", "") or "").strip().rstrip("/")
        if item_url and item_url in history_urls:
            continue
        deduped_data.append(item)

    dup_count: int = len(current_data) - len(deduped_data)
    logger.info(f"[analyze_llm] 去重: 原始{len(current_data)}条 → {len(deduped_data)}条 (重复{dup_count}条)")

    # ====== 2. 主题热度统计 ======
    topic_counts: Dict[str, int] = {}
    for item in deduped_data:
        topic = item.get("topic", "其他")
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
    logger.info(f"[analyze_llm] 主题分布: {topic_counts}")

    # ====== 3. 加载产品专属的LLM分析配置 + 调用LLM ======
    analysis_json: Optional[Dict] = None
    analysis_raw_text: str = ""
    try:
        llm_cfg = get_analysis_llm_config(state.product_id)
        llm_config = llm_cfg.get("config", {})
        sp = llm_cfg.get("sp", "")
        up = llm_cfg.get("up", "")

        up_tpl = Template(up)
        user_prompt_content = up_tpl.render({
            "trigger_time": state.trigger_time,
            "filtered_count": len(deduped_data),
            "dup_count": dup_count,
            "history_count": len(state.history_records or []),
            "topic_counts": topic_counts,
            "current_data": json.dumps(deduped_data, ensure_ascii=False),
            "history_records": json.dumps((state.history_records or [])[:50], ensure_ascii=False),
            "trend_report": state.trend_report or "",
        })

        llm = LLMClient(ctx=ctx)
        messages = [
            SystemMessage(content=sp),
            HumanMessage(content=user_prompt_content),
        ]
        llm_resp = llm.invoke(
            messages=messages,
            model=llm_config.get("model"),
            temperature=llm_config.get("temperature", 0.1),
            top_p=llm_config.get("top_p", 0.7),
            max_completion_tokens=llm_config.get("max_completion_tokens", 5000),
        )
        raw_content = llm_resp.content if hasattr(llm_resp, "content") else str(llm_resp)
        analysis_raw_text = get_text_content(raw_content)
        logger.info(f"[analyze_llm] LLM响应长度: {len(analysis_raw_text)}")

        parsed = extract_json_from_text(analysis_raw_text)
        if parsed and isinstance(parsed, dict):
            analysis_json = parsed
            logger.info("[analyze_llm] JSON解析成功")
        else:
            logger.warning("[analyze_llm] JSON解析失败，回退纯文本")
    except Exception as e:
        analysis_raw_text = f"⚠️ AI分析异常: {e}"
        logger.error(f"[analyze_llm] LLM异常: {e}")

    # ====== 4. 汇总输出 ======
    if analysis_json:
        summary_text = analysis_json.get("summary", analysis_raw_text[:200])
    else:
        summary_text = analysis_raw_text[:200] if analysis_raw_text else "AI分析未产出"

    return AnalyzeLLMOutput(
        product_id=state.product_id,
        analysis_json=analysis_json or {},
        analysis_summary=summary_text,
        filtered_count=len(deduped_data),
        topic_counts=topic_counts,
        dup_count=dup_count,
    )
