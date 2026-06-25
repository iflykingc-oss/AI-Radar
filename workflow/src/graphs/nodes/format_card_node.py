"""
v4.4 节点拆分 - 飞书卡片构建节点
- 输入：analyze_llm_node 输出 + 历史数据 + 趋势报告
- 输出：飞书卡片 payload (dict) - 不推送，只构建
- 复用 analyze_and_push_node 中的 build_decision_card 逻辑
"""
import os
import logging
from typing import Any, Dict, List, Optional
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from graphs.state import FormatCardInput, FormatCardOutput

logger = logging.getLogger(__name__)


# ============================================================
# Unicode 工具（图表生成）
# ============================================================

def build_unified_bar_chart(topic_counts: Dict[str, int]) -> str:
    """主题热度条形图（unicode字符）"""
    if not topic_counts:
        return ""
    sorted_topics = sorted(topic_counts.items(), key=lambda x: -x[1])
    max_count = max([v for v in topic_counts.values()] + [1])
    lines: List[str] = []
    for topic, count in sorted_topics[:8]:
        bar_len = int((count / max_count) * 10)
        bar = "█" * bar_len + "░" * (10 - bar_len)
        lines.append(f"`{bar}` **{count:>3}** {topic}")
    return "\n".join(lines)


# ============================================================
# 决策视角卡片构建
# ============================================================

def build_decision_card(
    title: str,
    product_name: str,
    analysis: Dict,
    topic_counts: Optional[Dict] = None,
    trend_report: str = "",
    bitable_link: str = "",
    card_template: str = "blue",
    trending_topics: Optional[List[Dict]] = None,
    trend_insights: str = "",
    cross_product_hints: Optional[List[str]] = None,
    user_tier: str = "pro",
) -> Dict:
    """构建决策视角飞书卡片

    v4.9 付费墙:
    - free: 顶部3秒必读 + 必读TOP3 + 速览1-2条（精简版，约200字）
    - pro:  完整版 = 必读 + 精读 + 速览 + 趋势 + 跨产品关联
    """
    elements: List[Dict] = []

    # ============ v4.9 付费墙标识 ============
    is_free = (user_tier or "pro").lower() == "free"

    # ============ 顶部：3秒必读 ============
    summary = analysis.get("summary", "").strip()
    if summary:
        must_read_text = (
            f"**🎯 3秒必读总结**\n"
            f"> {summary[:400]}"
        )
        elements.append({
            "tag": "div",
            "text": {"tag": "lark_md", "content": must_read_text},
        })
        elements.append({"tag": "hr"})

    # ============ 必读卡片（1-3条）============
    must_read = analysis.get("must_read", [])
    if isinstance(must_read, list) and must_read:
        must_read_text = "**🔥 今日必读**\n"
        for i, item in enumerate(must_read[:3], 1):
            event = item.get("event", "")
            judgment = item.get("judgment", "")
            action = item.get("action", "")
            must_read_text += (
                f"\n**{i}. {event[:60]}**\n"
                f"   - 我的判断：{judgment[:100]}\n"
                f"   - 建议：{action[:80]}\n"
            )
        elements.append({
            "tag": "div",
            "text": {"tag": "lark_md", "content": must_read_text},
        })
        elements.append({"tag": "hr"})

    # ============ 机会/风险/建议 ============
    if not is_free:
        opportunities = analysis.get("opportunities", [])
        risks = analysis.get("risks", [])
        actions = analysis.get("actions", [])

        if opportunities or risks or actions:
            decision_text = ""
            if opportunities and isinstance(opportunities, list):
                decision_text += "**💡 机会雷达**\n"
                for opp in opportunities[:3]:
                    decision_text += f"- {str(opp)[:120]}\n"
                decision_text += "\n"
            if risks and isinstance(risks, list):
                decision_text += "**⚠️ 风险预警**\n"
                for r in risks[:3]:
                    decision_text += f"- {str(r)[:120]}\n"
                decision_text += "\n"
            if actions and isinstance(actions, list):
                decision_text += "**🎬 3角色建议**\n"
                for act in actions[:3]:
                    decision_text += f"- {str(act)[:120]}\n"
            if decision_text:
                elements.append({
                    "tag": "fold",
                    "summary": {"tag": "plain_text", "content": "💼 机会·风险·建议（点击展开）"},
                    "elements": [{
                        "tag": "div",
                        "text": {"tag": "lark_md", "content": decision_text},
                    }],
                })
                elements.append({"tag": "hr"})

    # ============ 关键趋势（独立判断）============
    if not is_free:
        trends = analysis.get("trends", [])
        if trends and isinstance(trends, list):
            trend_text = "**🔍 关键趋势（带独立判断）**\n\n"
            for i, t in enumerate(trends[:3], 1):
                if isinstance(t, dict):
                    title_t = t.get("title", "")
                    desc_t = t.get("description", "")
                    trend_text += f"**{i}. {title_t[:60]}**\n   {desc_t[:120]}\n\n"
                else:
                    trend_text += f"**{i}.** {str(t)[:120]}\n\n"
            elements.append({
                "tag": "div",
                "text": {"tag": "lark_md", "content": trend_text[:1500]},
            })
            elements.append({"tag": "hr"})

    # ============ 主题热度条形图 ============
    if not is_free and topic_counts:
        chart_text = build_unified_bar_chart(topic_counts)
        if chart_text:
            elements.append({
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**📊 主题热度**\n{chart_text}"},
            })
            elements.append({"tag": "hr"})

    # ============ v4.8 主题趋势（本周 vs 上周）============
    if not is_free and (trending_topics or trend_insights):
        trend_text_parts: List[str] = []
        if trend_insights:
            trend_text_parts.append(f"**📈 主题趋势**\n{trend_insights}")
        if trending_topics:
            trend_text_parts.append("\n**本周 Top 5 主题词：**")
            for i, t in enumerate(trending_topics[:5], 1):
                change = t.get("change", "→")
                change_emoji = {"↑": "🟢↑", "↓": "🔴↓", "→": "⚪→", "NEW": "🆕"}.get(change, change)
                topic = t.get("topic", "")
                cur = t.get("current_count", 0)
                his = t.get("history_count", 0)
                growth = t.get("growth_pct", 0)
                if change == "NEW":
                    trend_text_parts.append(f"\n{i}. `{topic}` {change_emoji} 本周新增 {cur} 次")
                else:
                    growth_str = f"+{growth}%" if growth > 0 else f"{growth}%"
                    trend_text_parts.append(
                        f"\n{i}. `{topic}` {change_emoji} 本周 {cur} 次 vs 上周 {his} 次 ({growth_str})"
                    )
        if cross_product_hints:
            trend_text_parts.append("\n\n**🔗 跨产品关联：**")
            for hint in cross_product_hints[:3]:
                trend_text_parts.append(f"\n• {hint}")
        elements.append({
            "tag": "fold",
            "summary": {"tag": "plain_text", "content": "📈 主题趋势 + 跨产品关联（点击展开）"},
            "elements": [{
                "tag": "div",
                "text": {"tag": "lark_md", "content": "".join(trend_text_parts)[:2000]},
            }],
        })
        elements.append({"tag": "hr"})

    # ============ 趋势报告（折叠）============
    if not is_free and trend_report:
        elements.append({
            "tag": "fold",
            "summary": {"tag": "plain_text", "content": "📈 主题热度曲线（点击展开）"},
            "elements": [{
                "tag": "div",
                "text": {"tag": "lark_md", "content": trend_report[:1500]},
            }],
        })
        elements.append({"tag": "hr"})

    # ============ 速览（折叠，10-20条）============
    filtered_results: List[Dict] = analysis.get("_filtered_results", [])
    if filtered_results:
        browse_text = ""
        # v4.9 付费墙: free 用户只看到 5 条
        max_browse = 5 if is_free else 15
        for i, item in enumerate(filtered_results[:max_browse], 1):
            topic = item.get("topic", "其他")
            title = item.get("title", "")
            url = item.get("url", "")
            browse_text += f"\n**{i}.** `{topic}` {title[:50]} [🔗]({url})\n"
        if browse_text:
            # v4.9 付费墙: free 用户看到升级提示
            browse_summary = f"📌 速览（{len(filtered_results)}条，点击展开）" if not is_free else f"🔒 速览（{min(len(filtered_results), 5)}/共{len(filtered_results)}条）"
            fold_elements = [{
                "tag": "div",
                "text": {"tag": "lark_md", "content": browse_text[:2000]},
            }]
            if is_free and len(filtered_results) > 5:
                fold_elements.append({
                    "tag": "div",
                    "text": {"tag": "lark_md", "content": f"\n\n---\n💎 **升级 Pro 会员解锁全部 {len(filtered_results)} 条速览 + 主题趋势 + 跨产品关联**\n👉 回复 `升级` 了解会员权益"},
                })
            elements.append({
                "tag": "fold",
                "summary": {"tag": "plain_text", "content": browse_summary},
                "elements": fold_elements,
            })

    # ============ 底部：footer + 按钮 ============
    elements.append({"tag": "hr"})
    if is_free:
        # v4.9 付费墙 - 免费版：精简内容，引导升级
        # 1) 速览只保留前 5 条
        # 2) 隐藏"关键趋势/主题热度/主题趋势/趋势报告/跨产品关联"在前面已过滤
        # 3) footer 用升级提示替代反馈按钮
        upgrade_text = (
            "🔓 **升级 Pro 解锁完整版**\n\n"
            "你现在看到的是【免费版】（3秒必读 + 必读TOP3 + 速览前5条）。\n\n"
            "升级 Pro 后可解锁：\n"
            "• 📊 完整必读 + 精读 + 速览（全部）\n"
            "• 💡 机会/风险/建议（决策视角）\n"
            "• 📈 主题热度条形图 + 主题趋势对比\n"
            "• 🔀 跨产品关联洞察（3产品网络效应）\n"
            "• ⭐ 个性化推荐（基于你的反馈信号）"
        )
        elements.append({
            "tag": "div",
            "text": {"tag": "lark_md", "content": upgrade_text},
        })
        if bitable_link:
            elements.append({"tag": "action", "actions": [
                {"tag": "button", "text": {"tag": "plain_text", "content": "🔓 升级 Pro 看完整版"},
                 "type": "primary", "url": "https://example.com/upgrade-pro"},
            ]})
        else:
            elements.append({"tag": "action", "actions": [
                {"tag": "button", "text": {"tag": "plain_text", "content": "🔓 升级 Pro 看完整版"},
                 "type": "primary", "url": "https://example.com/upgrade-pro"},
            ]})
    else:
        # v4.9 付费墙 - Pro 完整版：原样显示反馈按钮
        if bitable_link:
            elements.append({"tag": "action", "actions": [
                {"tag": "button", "text": {"tag": "plain_text", "content": f"📁 查看{product_name}多维表格"},
                 "type": "default", "url": bitable_link},
                {"tag": "button", "text": {"tag": "plain_text", "content": "👍 有用"},
                 "type": "primary", "value": {"action": "feedback_positive", "product_id": analysis.get("_product_id", "")}},
                {"tag": "button", "text": {"tag": "plain_text", "content": "👎 不感兴趣"},
                 "type": "danger", "value": {"action": "feedback_negative", "product_id": analysis.get("_product_id", "")}},
            ]})

    return {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {"tag": "plain_text", "content": title[:60]},
                "template": card_template or "blue",
            },
            "elements": elements,
        },
    }


def build_fallback_card(
    title: str,
    product_name: str,
    raw_text: str,
    topic_counts: Optional[Dict] = None,
    trend_report: str = "",
    bitable_link: str = "",
    card_template: str = "blue",
    trigger_time: str = "",
    filtered_count: int = 0,
) -> Dict:
    """回退：纯文本卡片（LLM分析失败时使用）"""
    elements: List[Dict] = []

    if trend_report:
        elements.append({
            "tag": "div",
            "text": {"tag": "lark_md", "content": trend_report[:1000]},
        })
        elements.append({"tag": "hr"})

    card_content = (
        f"**⏰ {trigger_time}** | **本次：{filtered_count}条**\n\n"
        f"{raw_text[:1500]}"
    )
    elements.append({"tag": "div", "text": {"tag": "lark_md", "content": card_content}})

    if topic_counts:
        chart_text = build_unified_bar_chart(topic_counts)
        if chart_text:
            elements.append({"tag": "div", "text": {"tag": "lark_md", "content": f"**📊 主题热度**\n{chart_text}"}})

    elements.append({"tag": "hr"})
    if bitable_link:
        elements.append({"tag": "action", "actions": [
            {"tag": "button", "text": {"tag": "plain_text", "content": f"📁 查看{product_name}多维表格"},
             "type": "default", "url": bitable_link}
        ]})

    return {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {"tag": "plain_text", "content": title[:60]},
                "template": card_template or "blue",
            },
            "elements": elements,
        },
    }


# ============================================================
# 节点主函数
# ============================================================

def format_card_node(state: FormatCardInput, config: RunnableConfig, runtime: Runtime[Context]) -> FormatCardOutput:
    """
    title: 飞书卡片构建
    desc: 将LLM分析结果构建为决策视角飞书卡片（必读+机会风险+趋势+速览）
    integrations: 无（纯本地计算）
    """
    logger.info(f"[format_card] product={state.product_id} 开始构建飞书卡片")

    try:
        bitable_link: str = ""
        if state.app_token and state.table_id:
            bitable_link = f"https://bytedance.feishu.cn/base/{state.app_token}?table={state.table_id}"

        if state.analysis_json:
            # 注入产品ID和筛选结果（供卡片内部使用）
            analysis = dict(state.analysis_json)
            analysis["_product_id"] = state.product_id
            analysis["_filtered_results"] = state.filtered_results
            card_payload = build_decision_card(
                title=state.card_title or f"📬 {state.product_name} | {state.trigger_time}",
                product_name=state.product_name,
                analysis=analysis,
                topic_counts=state.topic_counts,
                trend_report=state.trend_report or "",
                bitable_link=bitable_link,
                card_template=state.card_template or "blue",
                trending_topics=getattr(state, "trending_topics", None) or [],
                trend_insights=getattr(state, "trend_insights", "") or "",
                cross_product_hints=getattr(state, "cross_product_hints", None) or [],
                user_tier=getattr(state, "user_tier", "pro") or "pro",
            )
        else:
            card_payload = build_fallback_card(
                title=state.card_title or f"📬 {state.product_name} | {state.trigger_time}",
                product_name=state.product_name,
                raw_text=state.analysis_summary or "",
                topic_counts=state.topic_counts,
                trend_report=state.trend_report or "",
                bitable_link=bitable_link,
                card_template=state.card_template or "blue",
                trigger_time=state.trigger_time,
                filtered_count=state.filtered_count,
            )

        logger.info(f"[format_card] 卡片构建完成，elements数={len(card_payload.get('card', {}).get('elements', []))}")
        return FormatCardOutput(
            product_id=state.product_id,
            card_payload=card_payload,
            build_status="success",
        )
    except Exception as e:
        logger.error(f"[format_card] 卡片构建失败: {e}")
        return FormatCardOutput(
            product_id=state.product_id,
            card_payload={},
            build_status=f"fail: {e}",
        )
