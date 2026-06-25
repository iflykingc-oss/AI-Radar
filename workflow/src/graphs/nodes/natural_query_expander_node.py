"""
v5.0 自然语言查询扩展节点
支持用户用自然语言描述需求（如"国产大模型价格战最新动态"），
由 LLM 自动展开为多个搜索关键词（兼容产品配置）
"""
import os
import json
import logging
from typing import List, Dict, Any
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from langchain_core.messages import SystemMessage, HumanMessage
from coze_coding_utils.runtime_ctx.context import Context
from coze_coding_dev_sdk import LLMClient
from graphs.state import NaturalQueryExpanderInput, NaturalQueryExpanderOutput

logger = logging.getLogger(__name__)


# v5.0 LLM 提示词配置（硬编码以避免 config 依赖）
EXPAND_SP = """# 角色定义
你是AI情报检索专家，擅长将用户的自然语言需求展开为多个互补的搜索关键词。
# 任务目标
将用户输入的自然语言查询，展开为5-10个互补的搜索关键词（中英文混合），覆盖：
- 核心实体词（人名/公司/产品/事件）
- 同义词/近义词
- 相关上下游概念
- 中英文双语
# 约束与规则
- 关键词长度2-10个字（中）或1-5个单词（英）
- 避免过于宽泛的词（如"AI"、"新闻"）
- 优先具体名词，避免抽象词
- **仅返回 JSON 数组**，不要任何其他文字
# 输出格式
[\\"关键词1\\", \\"关键词2\\", \\"关键词3\\", ...]
"""

EXPAND_UP_TPL = """用户的自然语言查询：{natural_query}

请展开为5-10个搜索关键词（中英文混合），仅返回JSON数组。"""


def _extract_json_array(text: str) -> List[str]:
    """从LLM输出中安全提取 JSON 数组"""
    text = text.strip()
    # 去除markdown代码块
    if text.startswith("```"):
        lines = text.split("\n")
        # 移除第一行 ```json 或 ``` 和最后一行 ```
        if len(lines) >= 2:
            text = "\n".join(lines[1:])
        if text.endswith("```"):
            text = text[:-3]
    text = text.strip()

    # 找 JSON 数组
    start = text.find("[")
    end = text.rfind("]")
    if start >= 0 and end > start:
        try:
            arr = json.loads(text[start:end + 1])
            if isinstance(arr, list):
                # 过滤非字符串和空字符串
                return [str(x).strip() for x in arr if x and str(x).strip()]
        except json.JSONDecodeError:
            pass

    # 兜底：按行/逗号拆分
    for sep in ["\n", ",", "，"]:
        if sep in text:
            parts = [p.strip().strip("\"'`[]") for p in text.split(sep)]
            parts = [p for p in parts if 2 <= len(p) <= 30]
            if parts:
                return parts[:10]
    return []


def natural_query_expander_node(
    state: NaturalQueryExpanderInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> NaturalQueryExpanderOutput:
    """
    title: 自然语言查询扩展
    desc: 将用户的自然语言需求（如"国产大模型价格战"）展开为多个搜索关键词。
          优先用 LLM 智能展开；失败时回退到产品配置的 search_topics。
    integrations: 大语言模型
    """
    ctx = runtime.context
    natural_query = (state.natural_query or "").strip()
    fallback_topics = state.fallback_topics or []
    product_id = state.product_id

    # 1. 无自然语言查询 → 直接返回 fallback
    if not natural_query:
        logger.info(
            f"[query_expander] product={product_id}, 无自然语言查询，使用产品配置 fallback ({len(fallback_topics)} 主题)"
        )
        return NaturalQueryExpanderOutput(
            product_id=product_id,
            search_topics=fallback_topics,
            expanded_topics=fallback_topics,
            query_understood="",
            used_natural_query=False,
        )

    # 2. 有自然语言查询 → LLM 展开
    try:
        client = LLMClient(ctx=ctx)
        messages = [
            SystemMessage(content=EXPAND_SP),
            HumanMessage(content=EXPAND_UP_TPL.format(natural_query=natural_query)),
        ]
        resp = client.invoke(
            messages=messages,
            model="doubao-seed-1-8-250615",  # 小模型快，适合做关键词展开
            temperature=0.3,
            top_p=0.8,
            max_completion_tokens=400,
            thinking="disabled",
        )
        raw_text = resp.content if hasattr(resp, "content") else str(resp)
        if isinstance(raw_text, list):
            raw_text = " ".join(
                it.get("text", "") if isinstance(it, dict) else str(it)
                for it in raw_text
            )
        expanded = _extract_json_array(str(raw_text))
        if expanded:
            logger.info(
                f"[query_expander] product={product_id}, 自然语言→{len(expanded)} 关键词: {expanded[:3]}..."
            )
            return NaturalQueryExpanderOutput(
                product_id=product_id,
                search_topics=expanded,
                expanded_topics=expanded,
                query_understood=natural_query,
                used_natural_query=True,
            )
        else:
            logger.warning(
                f"[query_expander] LLM 展开失败，输出无法解析: {str(raw_text)[:200]}"
            )
    except Exception as e:
        logger.error(f"[query_expander] LLM 调用异常: {e}")

    # 3. 失败回退
    logger.info(
        f"[query_expander] product={product_id}, LLM展开失败，回退到产品配置"
    )
    return NaturalQueryExpanderOutput(
        product_id=product_id,
        search_topics=fallback_topics,
        expanded_topics=fallback_topics,
        query_understood=natural_query,
        used_natural_query=False,
    )
