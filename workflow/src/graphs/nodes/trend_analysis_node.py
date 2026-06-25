"""
AI趋势分析节点（基建能力）
从多维表格读取历史数据，提取高频关键词，对比本次与历史的热词变化，生成趋势报告
"""
import os
import json
import re
import logging
from collections import Counter
from typing import List, Dict, Any, Optional
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from coze_coding_dev_sdk import LLMClient
from langchain_core.messages import SystemMessage, HumanMessage
from graphs.state import TrendAnalysisInput, TrendAnalysisOutput
from graphs.utils import resolve_product_bitable
from cozeloop.decorator import observe
from coze_workload_identity import Client

logger = logging.getLogger(__name__)


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


# 中文停用词（高频但无信息量）
STOPWORDS = set([
    "的", "了", "是", "在", "和", "与", "或", "及", "等", "对", "为", "以",
    "一个", "一些", "我们", "你", "我", "他", "她", "它", "他们", "这", "那",
    "也", "都", "就", "还", "而", "但", "却", "又", "再", "已", "已经", "正在",
    "可以", "可能", "应该", "需要", "想", "要", "没有", "不", "没", "不是",
    "今天", "昨天", "明天", "近日", "目前", "当前", "最近", "今日", "昨日",
    "大家", "很多", "不少", "全部", "一些", "相关", "发布", "推出", "上线", "更新",
    "据", "了解", "获悉", "显示", "透露", "指出", "表示", "认为", "称", "报道",
    "据悉", "信息", "消息", "新闻", "动态", "资讯", "情况", "方面", "领域",
])


def tokenize_zh(text: str) -> List[str]:
    """简单中文分词：基于2-4字滑动窗口 + 数字/英文词"""
    if not text:
        return []
    tokens: List[str] = []

    # 提取英文/数字词
    en_words = re.findall(r"[A-Za-z][A-Za-z0-9_\-]{1,}", text)
    for w in en_words:
        w_lower = w.lower()
        if len(w_lower) >= 2 and w_lower not in STOPWORDS:
            tokens.append(w_lower)

    # 提取中文片段（2-4字）
    # 简单策略: 提取非标点连续中文字符
    chinese_chunks = re.findall(r"[\u4e00-\u9fa5]+", text)
    for chunk in chinese_chunks:
        if len(chunk) < 2:
            continue
        # 2-4字滑动窗口
        for n in (4, 3, 2):
            for i in range(len(chunk) - n + 1):
                gram = chunk[i:i + n]
                if gram in STOPWORDS:
                    continue
                tokens.append(gram)

    return tokens


def extract_keywords(items: List[Dict[str, Any]], top_n: int = 30) -> List[tuple]:
    """从信息列表中提取高频关键词"""
    counter: Counter = Counter()
    for item in items:
        if not isinstance(item, dict):
            continue
        # 拼接标题+摘要
        text = f"{item.get('title', '')} {item.get('snippet', '')}"
        for token in tokenize_zh(text):
            counter[token] += 1
    return counter.most_common(top_n)


def compare_keywords(
    current: List[tuple],
    history: List[tuple],
) -> Dict[str, str]:
    """对比当前与历史关键词，输出每个词的变化方向
    返回: {word: '↑'(显著上升) / '↓'(显著下降) / '→'(持平) / 'NEW'(新出现)}
    """
    cur_dict = {w: c for w, c in current}
    his_dict = {w: c for w, c in history}

    all_words = set(cur_dict.keys()) | set(his_dict.keys())
    changes: Dict[str, str] = {}

    for w in all_words:
        cur_c = cur_dict.get(w, 0)
        his_c = his_dict.get(w, 0)
        if his_c == 0 and cur_c > 0:
            changes[w] = "NEW"
        elif his_c > 0 and cur_c == 0:
            changes[w] = "↓"  # 消失
        else:
            # 计算变化率
            if his_c > 0:
                ratio = (cur_c - his_c) / his_c
            else:
                ratio = 0
            if ratio > 0.5:
                changes[w] = "↑"
            elif ratio < -0.5:
                changes[w] = "↓"
            else:
                changes[w] = "→"

    return changes


def query_history_from_bitable(app_token: str, table_id: str, page_size: int = 500) -> List[Dict[str, Any]]:
    """从飞书多维表格查询历史记录（惰性token）"""
    if not app_token or not table_id:
        return []

    try:
        # 惰性导入避免模块加载时401
        import requests

        def get_token() -> str:
            client = Client()
            return client.get_integration_credential("integration-feishu-base")

        headers = {
            "Authorization": f"Bearer {get_token()}",
            "Content-Type": "application/json; charset=utf-8",
        }
        url = f"https://open.larkoffice.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search"
        resp = requests.post(
            url,
            headers=headers,
            params={"page_size": page_size},
            json={"sort": [{"field_name": "采集时间", "desc": True}]},
            timeout=30,
        )
        data = resp.json()
        if data.get("code") != 0:
            logger.warning(f"[trend_analysis] 查询Bitable失败: {data}")
            return []
        items = data.get("data", {}).get("items", [])
        return [item.get("fields", {}) for item in items]
    except Exception as e:
        logger.warning(f"[trend_analysis] 查询Bitable异常: {e}")
        return []


def trend_analysis_node(
    state: TrendAnalysisInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> TrendAnalysisOutput:
    """
    title: AI趋势分析
    desc: 从多维表格读取历史数据，提取高频关键词，对比本次与历史的热词变化，生成趋势报告
    integrations: 大语言模型, 飞书多维表格
    """
    ctx = runtime.context
    logger.info(
        f"[trend_analysis] product={state.product_id} ({state.product_name}) "
        f"开始趋势分析, 当前{len(state.current_results)}条"
    )

    # 1. 查询历史数据（v4.7：app_token/table_id 为空时主动按 product_id 派生）
    app_token: str = state.app_token
    table_id: str = state.table_id
    if not app_token or not table_id:
        try:
            resolved_token, resolved_table = resolve_product_bitable(
                product_id=state.product_id,
                bitable_base_name=getattr(state, "bitable_base_name", None) or None,
                app_token=None,
                table_id=None,
                table_name_candidates=[f"{state.product_id}_news", f"{state.product_id}", "数据表", "default_table"],
            )
            if resolved_token:
                app_token = app_token or resolved_token
            if resolved_table:
                table_id = table_id or resolved_table
            logger.info(
                f"[trend_analysis] v4.7 fallback resolve: app_token={app_token[:8] if app_token else 'empty'}... "
                f"table_id={table_id[:8] if table_id else 'empty'}..."
            )
        except Exception as e:
            # v4.7 fallback 失败时（如 401 集成未授权）降级为空历史，不阻塞主流程
            logger.warning(f"[trend_analysis] v4.7 fallback resolve 失败（降级为空历史）: {e}")
            app_token = ""
            table_id = ""

    history_records: List[Dict[str, Any]] = query_history_from_bitable(
        app_token, table_id, page_size=500
    )
    logger.info(f"[trend_analysis] 查询到 {len(history_records)} 条历史记录")

    # 2. 提取本次与历史关键词
    current_kw = extract_keywords(state.current_results, top_n=30)
    history_kw = extract_keywords(history_records[:200], top_n=30)  # 历史限制前200条避免过大

    logger.info(f"[trend_analysis] 当前关键词TOP10: {current_kw[:10]}")

    # 3. 对比变化
    keyword_changes = compare_keywords(current_kw, history_kw)

    # 4. 生成趋势报告（统计式，不需要LLM）
    # 上升词：当前频次比历史高
    rising = [(w, c) for w, c in current_kw if keyword_changes.get(w) == "↑"]
    rising.sort(key=lambda x: x[1], reverse=True)
    rising = rising[:8]

    # 新出现词
    new_words = [w for w, c in current_kw if keyword_changes.get(w) == "NEW"][:8]

    # 下降/消失词
    falling = [(w, his_c) for w, his_c in history_kw if keyword_changes.get(w) == "↓"]
    falling.sort(key=lambda x: x[1], reverse=True)
    falling = falling[:5]

    # 5. 构建Markdown趋势报告
    report_lines: List[str] = []
    report_lines.append(f"**📈 {state.product_name} 趋势速报**（{state.trigger_time}）")
    report_lines.append("")

    if rising:
        report_lines.append("**🔥 升温热词 TOP8**")
        for w, c in rising:
            report_lines.append(f"- `{w}` ×{c}")
        report_lines.append("")

    if new_words:
        report_lines.append("**✨ 新出现关键词 TOP8**")
        for w in new_words:
            report_lines.append(f"- `{w}`")
        report_lines.append("")

    if falling:
        report_lines.append("**📉 降温词 TOP5**")
        for w, c in falling:
            report_lines.append(f"- `{w}`")
        report_lines.append("")

    # 当前热点词
    if current_kw:
        report_lines.append("**📊 当前热点词 TOP10**")
        for w, c in current_kw[:10]:
            arrow = keyword_changes.get(w, "→")
            report_lines.append(f"- `{w}` ×{c} {arrow}")
        report_lines.append("")

    trend_report = "\n".join(report_lines)
    logger.info(f"[trend_analysis] 趋势报告生成完成，长度={len(trend_report)}")

    return TrendAnalysisOutput(
        trend_report=trend_report,
        keyword_changes=keyword_changes,
    )
