"""
多产品通用状态定义
支持 ai_daily / overseas_ceo / global_ai 三个产品
"""
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field


# 支持的产品ID
ProductId = Literal["ai_daily", "overseas_ceo", "global_ai"]

# v4.9 付费墙 - 用户层级
UserTier = Literal["free", "pro"]


class SearchResultItem(BaseModel):
    """单条搜索结果项"""
    title: str = Field(default="", description="信息标题")
    url: str = Field(default="", description="信息来源链接")
    snippet: str = Field(default="", description="内容摘要")
    source: str = Field(default="", description="来源站点")
    topic: str = Field(default="", description="所属主题分类")
    publish_time: str = Field(default="", description="发布时间")
    source_score: int = Field(default=50, description="信源可信度分数 0-100")


class DedupedEventItem(BaseModel):
    """去重后的单个事件"""
    event_id: int = Field(default=0, description="事件ID")
    title: str = Field(default="", description="事件主标题")
    url: str = Field(default="", description="主信源URL")
    snippet: str = Field(default="", description="内容摘要")
    source: str = Field(default="", description="主信源")
    topic: str = Field(default="", description="所属主题分类")
    publish_time: str = Field(default="", description="发布时间")
    source_score: int = Field(default=50, description="主信源可信度分数 0-100")
    other_sources: List[str] = Field(default=[], description="其他报道该事件的信源")
    source_count: int = Field(default=1, description="报道该事件的信源总数")


class GlobalState(BaseModel):
    """全局过程状态"""
    product_id: str = Field(default="ai_daily", description="产品ID")
    trigger_time: str = Field(default="", description="触发时段标识")
    run_type: str = Field(default="daily", description="运行类型：daily/weekly/curve")
    product_name: str = Field(default="", description="产品中文名称")
    user_tier: str = Field(default="pro", description="v4.9付费墙 - 用户层级 free/pro")
    card_title: str = Field(default="", description="卡片标题前缀")
    card_template: str = Field(default="blue", description="卡片模板颜色")
    raw_search_results: List[dict] = Field(default=[], description="所有主题的原始搜索结果")
    deduped_events: List[dict] = Field(default=[], description="事件级去重后的独立事件列表")
    filtered_results: List[dict] = Field(default=[], description="筛选后的有效信息列表")
    app_token: str = Field(default="", description="飞书多维表格Base的app_token")
    table_id: str = Field(default="", description="飞书多维表格数据表的table_id")
    bitable_write_status: str = Field(default="", description="写入多维表格的状态")
    trend_report: str = Field(default="", description="AI趋势分析报告")
    curve_text: str = Field(default="", description="主题热度曲线文本")
    weekly_report: str = Field(default="", description="周报文本")
    push_status: str = Field(default="", description="推送状态")
    feedback_signals: Dict[str, float] = Field(
        default_factory=dict,
        description="主题偏好信号：{主题: 偏好分数0-1}，由feedback_reader_node从Bitable反馈表读取，供filter_news_node个性化加权"
    )
    # v4.8：跨产品关联分析输出
    trending_topics: List[dict] = Field(default=[], description="主题趋势列表 [{topic, change, growth_pct, current_count, history_count}]")
    trend_insights: str = Field(default="", description="主题趋势洞察文本")
    cross_product_hints: List[str] = Field(default=[], description="跨产品关联提示（3产品共同话题）")
    # v5.0 多源数据融合 + 自然语言查询
    natural_query: str = Field(default="", description="v5.0自然语言查询语句（用户原话，可由LLM转关键词）")
    trendradar_items: List[dict] = Field(default=[], description="v5.0 TrendRadar热搜数据（35+平台）")
    aihot_items: List[dict] = Field(default=[], description="v5.0 AI-HotRadar AI垂直社区数据")
    unified_items: List[dict] = Field(default=[], description="v5.0 多源聚合器输出（4D评分+content_type）")
    content_type_stats: Dict[str, int] = Field(
        default_factory=dict,
        description="v5.0 内容类型统计 {product/model/industry/paper/discussion: count}"
    )


class GraphInput(BaseModel):
    """工作流的输入"""
    product_id: ProductId = Field(
        default="ai_daily",
        description="产品ID：ai_daily(中文AI早报) / overseas_ceo(出海CEO早报) / global_ai(国际AI洞察)"
    )
    trigger_time: str = Field(..., description="触发时段标识，如'早上8点'、'中午12点'、'下午5点'、'晚上10点'")
    app_token: Optional[str] = Field(default=None, description="飞书多维表格Base的app_token，为空则自动创建")
    table_id: Optional[str] = Field(default=None, description="飞书多维表格数据表的table_id，为空则自动创建")
    user_tier: UserTier = Field(default="pro", description="v4.9付费墙 - 用户层级 free(免费版，看Top3必读+精简分析) / pro(完整版，看必读+精读+速览+趋势+跨产品关联)")
    run_type: Literal["daily", "weekly", "curve"] = Field(
        default="daily",
        description="运行类型：daily(日报全流程) / weekly(周报生成) / curve(主题热度曲线)"
    )
    feedback_signals: Optional[Dict[str, float]] = Field(
        default=None,
        description="主题偏好信号，None=由feedback_reader_node自动读取"
    )
    # v5.0 多源数据融合
    natural_query: Optional[str] = Field(
        default=None,
        description="v5.0自然语言查询语句（用户原话），None=使用产品配置的search_topics。"
                     "示例：'国产大模型价格战最新动态'、'硅谷AI创业公司融资'。系统会用LLM自动生成搜索关键词。"
    )


class GraphOutput(BaseModel):
    """工作流的输出"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(default="", description="产品中文名称")
    run_type: str = Field(default="daily", description="运行类型")
    push_status: str = Field(..., description="推送状态")
    filtered_count: int = Field(default=0, description="筛选出的有效信息条数")
    bitable_info: str = Field(default="", description="多维表格信息（app_token/table_id/记录数）")
    analysis_summary: str = Field(default="", description="AI分析报告摘要")
    trend_report: str = Field(default="", description="AI趋势分析报告")
    curve_text: str = Field(default="", description="主题热度曲线文本")
    # v4.8 输出
    trending_topics: List[dict] = Field(default=[], description="主题趋势列表")
    trend_insights: str = Field(default="", description="主题趋势洞察")
    cross_product_hints: List[str] = Field(default=[], description="跨产品关联提示")
    weekly_report: str = Field(default="", description="周报文本")
    feedback_signals: Dict[str, float] = Field(
        default_factory=dict,
        description="主题偏好信号：{主题: 偏好分数0-1}，反映用户对各主题的历史反馈偏好"
    )


# ================== 各节点独立入出参 ==================

class LoadProductInput(BaseModel):
    """入口-加载产品配置节点的输入"""
    product_id: ProductId = Field(default="ai_daily", description="产品ID")
    trigger_time: str = Field(..., description="触发时段标识")
    feedback_signals: Dict[str, float] = Field(default_factory=dict, description="主题偏好信号（v4.6新流程，来自feedback_reader）")


class LoadProductOutput(BaseModel):
    """入口-加载产品配置节点的输出"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品中文名称")
    card_title: str = Field(..., description="卡片标题前缀")
    card_template: str = Field(..., description="卡片模板颜色")
    search_topics: List[str] = Field(default=[], description="搜索主题列表")
    search_time_range: str = Field(default="1d", description="搜索时间范围")
    search_count_per_topic: int = Field(default=5, description="每主题搜索条数")
    bitable_base_name: str = Field(..., description="飞书多维表格Base名称")


class SearchNewsInput(BaseModel):
    """搜索新闻节点的输入"""
    product_id: str = Field(..., description="产品ID")
    search_topics: List[str] = Field(..., description="搜索主题列表")
    search_time_range: str = Field(default="1d", description="搜索时间范围")
    search_count_per_topic: int = Field(default=5, description="每主题搜索条数")


class SearchNewsOutput(BaseModel):
    """搜索新闻节点的输出"""
    raw_search_results: List[dict] = Field(default=[], description="所有主题的原始搜索结果（已带信源分数）")
    product_id: str = Field(..., description="产品ID")


class EventDedupInput(BaseModel):
    """事件级去重节点的输入"""
    product_id: str = Field(..., description="产品ID")
    raw_search_results: List[dict] = Field(..., description="原始搜索结果（已带source_score）")


class EventDedupOutput(BaseModel):
    """事件级去重节点的输出"""
    deduped_events: List[dict] = Field(default=[], description="去重后的独立事件列表")
    product_id: str = Field(..., description="产品ID")


class FeedbackReaderInput(BaseModel):
    """反馈读取节点的输入（v4.6新增）"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品名称")
    days: int = Field(default=30, description="读取最近N天的反馈数据")


class FeedbackReaderOutput(BaseModel):
    """反馈读取节点的输出（v4.6新增）"""
    feedback_signals: Dict[str, float] = Field(default={}, description="主题偏好信号，格式：{topic: score}")
    positive_count: int = Field(default=0, description="累计点赞数")
    negative_count: int = Field(default=0, description="累计点踩数")
    favorite_count: int = Field(default=0, description="累计收藏数")
    total_feedback_records: int = Field(default=0, description="总反馈记录数")
    # 注意：不在Output中重复product_id（避免与event_dedup并行汇合时冲突）


class FilterNewsInput(BaseModel):
    """信息筛选节点的输入"""
    product_id: str = Field(..., description="产品ID")
    deduped_events: List[dict] = Field(default=[], description="事件级去重后的独立事件列表（v4.3新流程）")
    raw_search_results: List[dict] = Field(default=[], description="原始搜索结果（兼容旧版，为空时使用deduped_events）")
    trigger_time: str = Field(..., description="触发时段标识")
    feedback_signals: Dict[str, float] = Field(default_factory=dict, description="主题偏好信号（v4.6新流程，来自feedback_reader）")


class FilterNewsOutput(BaseModel):
    """信息筛选节点的输出"""
    filtered_results: List[dict] = Field(default=[], description="筛选后的有效信息列表")
    product_id: str = Field(..., description="产品ID")


class WriteToBitableInput(BaseModel):
    """飞书多维表格写入节点的输入"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品中文名称")
    bitable_base_name: str = Field(..., description="飞书多维表格Base名称")
    filtered_results: List[dict] = Field(..., description="筛选后的有效信息")
    trigger_time: str = Field(..., description="触发时段标识")
    feedback_signals: Dict[str, float] = Field(default_factory=dict, description="主题偏好信号（v4.6新流程，来自feedback_reader）")
    app_token: Optional[str] = Field(default=None, description="飞书多维表格Base的app_token，为空则自动创建")
    table_id: Optional[str] = Field(default=None, description="飞书多维表格数据表的table_id，为空则自动创建")


class WriteToBitableOutput(BaseModel):
    """飞书多维表格写入节点的输出"""
    app_token: str = Field(..., description="飞书多维表格Base的app_token")
    table_id: str = Field(..., description="飞书多维表格数据表的table_id")
    write_status: str = Field(..., description="写入状态")
    records_count: int = Field(..., description="写入的记录数")
    filtered_count: int = Field(..., description="筛选出的有效信息条数")
    filtered_results: List[dict] = Field(default=[], description="筛选后的有效信息列表")


class TrendAnalysisInput(BaseModel):
    """AI趋势分析节点的输入"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品中文名称")
    app_token: str = Field(default="", description="飞书多维表格Base的app_token")
    table_id: str = Field(default="", description="飞书多维表格数据表的table_id")
    current_results: List[dict] = Field(default=[], description="本次采集数据")
    trigger_time: str = Field(..., description="触发时段标识")
    feedback_signals: Dict[str, float] = Field(default_factory=dict, description="主题偏好信号（v4.6新流程，来自feedback_reader）")


class TrendAnalysisOutput(BaseModel):
    """AI趋势分析节点的输出"""
    trend_report: str = Field(default="", description="AI趋势分析报告（Markdown）")
    keyword_changes: dict = Field(default={}, description="关键词变化 dict {word: '↑/↓/→/NEW'}")


class HistoryReaderInput(BaseModel):
    """v4.4 节点拆分 - 历史记录读取节点输入"""
    product_id: str = Field(..., description="产品ID")
    app_token: str = Field(default="", description="飞书多维表格Base的app_token，为空则跳过读取")
    table_id: str = Field(default="", description="飞书多维表格数据表的table_id，为空则跳过读取")
    days: int = Field(default=30, description="统计天数，默认30天（仅供后续使用）")


class HistoryReaderOutput(BaseModel):
    """v4.4 节点拆分 - 历史记录读取节点输出"""
    history_records: List[dict] = Field(default=[], description="Bitable历史记录列表（按采集时间倒序）")
    history_count: int = Field(default=0, description="历史记录条数")


class AnalyzeLLMInput(BaseModel):
    """v4.4 节点拆分 - LLM深度分析节点输入"""
    product_id: str = Field(..., description="产品ID")
    filtered_results: List[dict] = Field(default=[], description="筛选后的有效信息")
    history_records: List[dict] = Field(default=[], description="Bitable历史记录（用于URL去重）")
    trend_report: str = Field(default="", description="趋势分析报告")
    trigger_time: str = Field(default="", description="触发时段标识")


class AnalyzeLLMOutput(BaseModel):
    """v4.4 节点拆分 - LLM深度分析节点输出"""
    product_id: str = Field(..., description="产品ID")
    analysis_json: dict = Field(default={}, description="LLM输出的完整JSON（决策视角结构）")
    analysis_summary: str = Field(default="", description="分析摘要（3秒必读）")
    filtered_count: int = Field(default=0, description="去重后的有效信息条数")
    topic_counts: dict = Field(default={}, description="主题分布统计")
    dup_count: int = Field(default=0, description="去重掉的条数")


class FormatCardInput(BaseModel):
    """v4.4 节点拆分 - 飞书卡片构建节点输入"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品中文名称")
    card_title: str = Field(..., description="卡片标题前缀")
    card_template: str = Field(default="blue", description="卡片模板颜色")
    app_token: str = Field(default="", description="飞书多维表格Base的app_token")
    table_id: str = Field(default="", description="飞书多维表格数据表的table_id")
    trigger_time: str = Field(default="", description="触发时段标识")
    user_tier: str = Field(default="pro", description="v4.9付费墙 - 用户层级 free(精简版) / pro(完整版)")
    filtered_count: int = Field(default=0, description="有效信息条数")
    filtered_results: List[dict] = Field(default=[], description="筛选后的有效信息（速览用）")
    analysis_json: dict = Field(default={}, description="LLM分析JSON")
    analysis_summary: str = Field(default="", description="分析摘要（fallback用）")
    trend_report: str = Field(default="", description="趋势分析报告")
    topic_counts: dict = Field(default={}, description="主题分布统计")


class FormatCardOutput(BaseModel):
    """v4.4 节点拆分 - 飞书卡片构建节点输出"""
    product_id: str = Field(..., description="产品ID")
    card_payload: dict = Field(default={}, description="飞书卡片payload")
    build_status: str = Field(..., description="构建状态")


class CrossProductOverlapInput(BaseModel):
    """v4.8 跨产品关联分析节点输入"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(default="", description="产品中文名称")
    history_records: List[dict] = Field(default=[], description="Bitable历史记录（history_reader输出）")
    filtered_results: List[dict] = Field(default=[], description="本次筛选结果（filter_news输出）")
    current_keyword_changes: dict = Field(default={}, description="trend_analysis输出的关键词变化")


class CrossProductOverlapOutput(BaseModel):
    """v4.8 跨产品关联分析节点输出"""
    trending_topics: List[dict] = Field(default=[], description="主题趋势列表 [{topic, change, growth_pct, current_count, history_count}]")
    trend_insights: str = Field(default="", description="主题趋势分析洞察（用于卡片展示）")
    cross_product_hints: List[str] = Field(default=[], description="跨产品关联提示（3产品共同话题，预备字段）")


class FeishuPusherInput(BaseModel):
    """v4.4 节点拆分 - 飞书推送节点输入"""
    product_id: str = Field(..., description="产品ID")
    card_payload: dict = Field(..., description="飞书卡片payload")
    webhook_url: str = Field(default="", description="飞书webhook URL，为空时从coze identity获取")


class FeishuPusherOutput(BaseModel):
    """v4.4 节点拆分 - 飞书推送节点输出"""
    product_id: str = Field(..., description="产品ID")
    push_status: str = Field(..., description="推送状态 success/fail:xxx")
    status_code: int = Field(default=0, description="HTTP状态码")


# ================== 周报相关类型 ==================

class WeeklyReportInput(BaseModel):
    """周报节点的输入"""
    product_id: ProductId = Field(..., description="产品ID")
    week_start: str = Field(default="", description="周报起始日期 YYYY-MM-DD")
    week_end: str = Field(default="", description="周报结束日期 YYYY-MM-DD")
    app_token: str = Field(default="", description="飞书多维表格Base的app_token，为空则不读历史")
    table_id: str = Field(default="", description="飞书多维表格数据表的table_id，为空则不读历史")


class WeeklyReportOutput(BaseModel):
    """周报节点的输出"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(default="", description="产品中文名称")
    week_start: str = Field(default="", description="周报起始日期 YYYY-MM-DD")
    week_end: str = Field(default="", description="周报结束日期 YYYY-MM-DD")
    report_text: str = Field(default="", description="LLM生成的周报分析文本")
    card_payload: dict = Field(default={}, description="飞书卡片payload")
    push_status: str = Field(..., description="推送状态")
    history_count: int = Field(default=0, description="本周历史数据条数")


# ================== 主题热度曲线相关类型 ==================

class HeatCurveInput(BaseModel):
    """主题热度曲线节点的输入"""
    product_id: ProductId = Field(..., description="产品ID")
    days: int = Field(default=7, description="统计天数，默认7天")
    app_token: str = Field(default="", description="飞书多维表格Base的app_token，为空则不读历史")
    table_id: str = Field(default="", description="飞书多维表格数据表的table_id，为空则不读历史")


class HeatCurveOutput(BaseModel):
    """主题热度曲线节点的输出"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(default="", description="产品中文名称")
    days: int = Field(default=7, description="统计天数")
    curve_text: str = Field(default="", description="曲线文本（unicode折线图+条形图+趋势标记）")
    topic_count: int = Field(default=0, description="主题总数")
    rising_count: int = Field(default=0, description="升温主题数")
    falling_count: int = Field(default=0, description="降温主题数")
    new_count: int = Field(default=0, description="新兴主题数")
    history_count: int = Field(default=0, description="历史数据总条数")
    topic_summary: List[dict] = Field(default=[], description="主题摘要列表TOP10")


# ================== v5.0 多源数据融合：TrendRadar + AI-HotRadar ==================

class NaturalQueryExpanderInput(BaseModel):
    """v5.0 自然语言查询扩展节点输入"""
    product_id: str = Field(..., description="产品ID")
    natural_query: str = Field(default="", description="用户自然语言查询语句（可为空）")
    fallback_topics: List[str] = Field(default_factory=list, description="产品配置中的默认搜索主题（兜底）")
    card_title: str = Field(default="", description="卡片标题（用于日志）")


class NaturalQueryExpanderOutput(BaseModel):
    """v5.0 自然语言查询扩展节点输出"""
    product_id: str = Field(..., description="产品ID")
    # 关键：字段名用 search_topics，下游 search_news/trendradar/aihot 全部兼容
    search_topics: List[str] = Field(default=[], description="LLM扩展后的搜索关键词列表（5-10个）")
    expanded_topics: List[str] = Field(default=[], description="LLM扩展后的搜索关键词列表（同 search_topics，方便画布展示）")
    query_understood: str = Field(default="", description="LLM对用户查询的理解（用于日志）")
    used_natural_query: bool = Field(default=False, description="是否使用了自然语言查询（否则走fallback）")


class TrendRadarInput(BaseModel):
    """v5.0 TrendRadar 节点输入"""
    product_id: str = Field(..., description="产品ID")
    search_topics: List[str] = Field(default=[], description="搜索主题列表（用于过滤）")
    max_items: int = Field(default=30, description="最大返回条数")


class TrendRadarOutput(BaseModel):
    """v5.0 TrendRadar 节点输出"""
    trendradar_items: List[dict] = Field(default=[], description="TrendRadar热搜数据")
    platforms_count: int = Field(default=0, description="抓取的平台数")
    fetched_count: int = Field(default=0, description="最终保留条数")


class AiHotRadarInput(BaseModel):
    """v5.0 AI-HotRadar 节点输入"""
    product_id: str = Field(..., description="产品ID")
    search_topics: List[str] = Field(default=[], description="搜索主题列表（用于过滤）")
    max_items: int = Field(default=30, description="最大返回条数")


class AiHotRadarOutput(BaseModel):
    """v5.0 AI-HotRadar 节点输出"""
    aihot_items: List[dict] = Field(default=[], description="AI-HotRadar数据")
    fetched_count: int = Field(default=0, description="最终保留条数")


class MultiSourceMappingInput(BaseModel):
    """v5.0 多源映射节点输入"""
    product_id: str = Field(..., description="产品ID")
    unified_items: List[dict] = Field(default=[], description="多源聚合器输出")


class MultiSourceMappingOutput(BaseModel):
    """v5.0 多源映射节点输出"""
    product_id: str = Field(..., description="产品ID")
    raw_search_results: List[dict] = Field(default=[], description="兼容 event_dedup 节点")


# ============ v5.1 AI-Radar Supabase 集成 ============

class AIRadarSupabaseInput(BaseModel):
    """AI-Radar Supabase 读节点输入"""
    product_id: str = Field(..., description="产品ID")
    push_date: str = Field(..., description="推送日期 YYYY-MM-DD")
    days: int = Field(default=1, description="读取近 N 天的数据")
    limit: int = Field(default=30, description="最多返回 N 条")


class AIRadarSupabaseOutput(BaseModel):
    """AI-Radar Supabase 读节点输出"""
    ai_radar_items: List[dict] = Field(default=[], description="从 AI-Radar Supabase 读取的产品/资讯列表")
    ai_radar_count: int = Field(default=0, description="成功读取条数")
    ai_radar_skipped: int = Field(default=0, description="跳过（无凭据/异常）")
    ai_radar_error: str = Field(default="", description="异常信息")
