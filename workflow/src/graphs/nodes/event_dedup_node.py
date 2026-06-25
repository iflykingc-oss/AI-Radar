"""
事件级去重节点
将"同一事件不同信源报道"合并为一条事件记录，保留信源分数最高为"主源"，其他为"其他源"。
解决用户原话痛点："同一事件多源重复"，避免用户看5遍一样的内容。

算法：
1. 标题规范化（去标点、去停用词、转小写）
2. 实体指纹提取（公司/产品/人物常见词）
3. 标题 jaccard 相似度（中文按字切分）
4. 24h内 + 相似度>=0.5 → 判为同一事件
5. 同一事件保留 source_score 最高为主源，其他归入 sources
"""
import re
import logging
from typing import List, Dict, Any, Set
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import EventDedupInput, EventDedupOutput

logger = logging.getLogger(__name__)

# 中文停用词（精简版）
STOP_WORDS: Set[str] = {
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说",
    "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这", "那", "吗", "么", "什么", "怎么", "为",
    "与", "或", "及", "等", "之", "以", "将", "被", "由", "从", "向", "对", "于", "和", "而", "但", "却",
    "今天", "昨天", "刚刚", "最新", "重磅", "突发", "快讯", "速报", "消息", "资讯",
    "发布", "推出", "上线", "亮相", "曝光", "披露", "宣布", "官宣", "动态", "信息",
    "如何", "怎么", "为什么", "是什么", "哪些", "有何", "如何", "什么样",
    "一文", "解读", "分析", "评测", "报告", "盘点", "汇总", "合集", "大全",
}

# 常见实体（用于辅助识别事件）
ENTITY_KEYWORDS: Set[str] = {
    # 公司
    "openai", "anthropic", "deepmind", "google", "meta", "microsoft", "apple", "nvidia",
    "字节", "跳动", "豆包", "deepseek", "深度求索", "阿里", "通义", "百度", "文心", "腾讯",
    "混元", "华为", "盘古", "京东", "美团", "快手", "小红书", "知乎", "b站", "哔哩",
    # 人物
    "黄仁勋", "jensen", "黄仁勋", "马斯克", "musk", "altman", "山姆", "李彦宏", "任正非",
    # 产品
    "gpt", "claude", "llama", "gemini", "qwen", "kimi", "agent", "mcp", "workflow", "skill",
    "agent", "智能体", "工作流", "openclaw", "hermes",
    "微信", "抖音", "tiktok", "twitter", "x.com", "youtube",
}


def _normalize_title(title: str) -> str:
    """标题规范化：去标点、转小写、统一空格"""
    if not title:
        return ""
    t = re.sub(r"[【】《》（）()\[\]「」『』、，。：；？！!?.,;:]", " ", title)
    t = re.sub(r"\s+", " ", t).strip().lower()
    return t


def _tokenize(title: str) -> Set[str]:
    """中文按字切分 + 提取英文/数字token"""
    t = _normalize_title(title)
    tokens: Set[str] = set()
    # 连续英数作为一个token
    for m in re.finditer(r"[a-z0-9]+", t):
        tok = m.group(0)
        if len(tok) >= 2 and tok not in STOP_WORDS:
            tokens.add(tok)
    # 中文逐字
    for ch in t:
        if "\u4e00" <= ch <= "\u9fff" and ch not in STOP_WORDS:
            tokens.add(ch)
    return tokens


def _jaccard(set1: Set[str], set2: Set[str]) -> float:
    """Jaccard 相似度"""
    if not set1 or not set2:
        return 0.0
    intersection = set1 & set2
    union = set1 | set2
    return len(intersection) / len(union) if union else 0.0


def _entity_overlap(tokens1: Set[str], tokens2: Set[str]) -> int:
    """两个标题中共同实体数量（用于辅助判断同一事件）"""
    overlap: Set[str] = tokens1 & tokens2 & ENTITY_KEYWORDS
    return len(overlap)


def _is_same_event(item1: Dict[str, Any], item2: Dict[str, Any]) -> bool:
    """
    判断两条信息是否同一事件：
    1. 标题 jaccard 相似度 >= 0.5 → 同事件
    2. 标题 jaccard < 0.5 但共同实体 >= 2 → 同事件
    3. 标题 jaccard < 0.5 但共同实体 >= 1 且 source_score 都 >= 75 → 同事件
    """
    title1 = item1.get("title", "")
    title2 = item2.get("title", "")
    if not title1 or not title2:
        return False
    # 完全相同
    if title1 == title2:
        return True
    tokens1 = _tokenize(title1)
    tokens2 = _tokenize(title2)
    sim = _jaccard(tokens1, tokens2)
    entity_count = _entity_overlap(tokens1, tokens2)

    if sim >= 0.5:
        return True
    if entity_count >= 2:
        return True
    if entity_count >= 1:
        score1 = item1.get("source_score", 0)
        score2 = item2.get("source_score", 0)
        if score1 >= 75 and score2 >= 75:
            return True
    return False


def _group_events(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    把 raw_search_results 合并为事件列表。
    返回：[{event_id, main_item, sources: [...]}, ...]
    """
    groups: List[Dict[str, Any]] = []
    # 按 source_score 降序，优先保留高分主源
    sorted_items = sorted(items, key=lambda x: x.get("source_score", 0), reverse=True)

    for item in sorted_items:
        matched_group: Dict[str, Any] | None = None
        for g in groups:
            main = g["main_item"]
            if _is_same_event(main, item):
                matched_group = g
                break
        if matched_group is None:
            groups.append({
                "event_id": len(groups) + 1,
                "main_item": item,
                "sources": [item.get("source", "")],
            })
        else:
            # 合并到已有事件组
            if item.get("source", "") not in matched_group["sources"]:
                matched_group["sources"].append(item.get("source", ""))
    return groups


def event_dedup_node(
    state: EventDedupInput,
    config: RunnableConfig,
    runtime: Runtime[Context],
) -> EventDedupOutput:
    """
    title: 事件级去重
    desc: 将同一事件的多源报道合并为一条，保留信源分数最高为主源，其他信源归入 sources 列表；解决"同一事件多源重复"问题
    """
    raw_items: List[Dict[str, Any]] = state.raw_search_results or []
    logger.info(f"[event_dedup] 输入 {len(raw_items)} 条搜索结果")

    if not raw_items:
        logger.warning("[event_dedup] 输入为空，跳过")
        return EventDedupOutput(deduped_events=[], product_id=state.product_id)

    # 1. 按事件分组
    groups = _group_events(raw_items)
    # 2. 输出标准化
    deduped_events: List[Dict[str, Any]] = []
    for g in groups:
        main = g["main_item"]
        deduped_events.append({
            "event_id": g["event_id"],
            "title": main.get("title", ""),
            "url": main.get("url", ""),
            "snippet": main.get("snippet", ""),
            "source": main.get("source", ""),
            "publish_time": main.get("publish_time", ""),
            "topic": main.get("topic", ""),
            "source_score": main.get("source_score", 0),
            "other_sources": [s for s in g["sources"] if s != main.get("source", "")],
            "source_count": len(g["sources"]),
        })

    # 3. 统计
    original_count = len(raw_items)
    deduped_count = len(deduped_events)
    reduction_rate = (1 - deduped_count / original_count) * 100 if original_count > 0 else 0.0
    multi_source_events = sum(1 for e in deduped_events if e["source_count"] >= 2)
    logger.info(
        f"[event_dedup] 去重完成：{original_count} 条 → {deduped_count} 个独立事件，"
        f"压缩率 {reduction_rate:.1f}%，{multi_source_events} 个事件多源报道"
    )
    return EventDedupOutput(
        deduped_events=deduped_events,
        product_id=state.product_id,
    )
