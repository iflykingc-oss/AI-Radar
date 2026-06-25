# AGENTS.md - 工作流项目结构索引

## 项目概述
- **名称**: AI 情报决策引擎 v5.0.1
- **功能**: 基于飞书生态的多产品AI信息聚合+决策视角分析+可视化推送引擎+用户反馈学习+并行架构+主题趋势洞察+付费墙+专业行业周报模板

### 节点清单

| 节点名 | 文件位置 | 类型 | 功能描述 | 配置文件 |
|-------|---------|------|---------|---------|
| load_product | `nodes/load_product_node.py` | task | 入口节点：根据 product_id 加载产品配置 | - |
| **natural_query_expander** 🆕 | `nodes/natural_query_expander_node.py` | agent | v5.0自然语言查询扩展（用户原话→5-10关键词） | - |
| search_news | `nodes/search_news_node.py` | task | 5线程并行搜索+信源可信度打分 | - |
| **trendradar_fetcher** 🆕 | `nodes/trendradar_fetcher_node.py` | task | v5.0 TrendRadar (35+平台热搜) 抓取+主题过滤 | - |
| **aihot_fetcher** 🆕 | `nodes/aihot_fetcher_node.py` | task | v5.0 AI-HotRadar (5分类:模型/产品/行业/论文/技巧) 抓取 | - |
| **multi_source_aggregator** 🆕 | `nodes/multi_source_aggregator_node.py` | task | v5.0 三源聚合+4D评分(新鲜度/多源/互动/质量)+五层漏斗分类 | - |
| **multi_source_mapping** 🆕 | `nodes/multi_source_mapping_node.py` | task | v5.0 将 unified_items 映射为 raw_search_results（兼容下游） | - |
| event_dedup | `nodes/event_dedup_node.py` | task | 事件级去重（标题指纹+Jaccard+24h时间窗口） | - |
| feedback_reader | `nodes/feedback_reader_node.py` | task | 从飞书多维表格读历史反馈（v4.6新增） | - |
| filter_news | `nodes/filter_news_node.py` | agent | LLM筛选（产品专属SP/UP，v4.6支持偏好信号加权） | 加载自 `config/products/{id}.json` 的 `config` |
| **write_to_bitable** ⚡ | `nodes/write_to_bitable_node.py` | task | 飞书多维表格自动创建+写入（v4.7并行） | - |
| **trend_analysis** ⚡ | `nodes/trend_analysis_node.py` | task | 趋势分析（v4.7并行；app_token为空时通过product_id主动查找） | - |
| **history_reader** ⚡ | `nodes/history_reader_node.py` | task | 读Bitable历史（v4.7并行；app_token为空时通过product_id主动查找） | - |
| analyze_llm | `nodes/analyze_llm_node.py` | agent | LLM分析+URL去重+主题统计+合并趋势 | `config/products/{id}.json` 的 `analysis_config` |
| format_card | `nodes/format_card_node.py` | task | 构建飞书卡片JSON（带3个action按钮 👍/👎/⭐） | - |
| feishu_pusher | `nodes/feishu_pusher_node.py` | task | 推送到飞书webhook（带重试+降级） | - |
| weekly_report | `nodes/weekly_report_node.py` | agent | 周报自动生成（LLM深度分析） | `config/weekly_report_llm_cfg.json` |
| heat_curve | `nodes/heat_curve_node.py` | task | 主题热度曲线（统计式+unicode图表） | - |
| **cross_product_overlap** ⚡ | `nodes/cross_product_overlap_node.py` | task | v4.8 主题趋势对比（本周/上周）+ 跨产品关联提示 | - |

> ⚡ v4.7：三个节点并行启动，节省 ~50% 下游耗时
> ⚡ v4.8：cross_product_overlap 与 analyze_llm 并行，零LLM调用（仅字符级分词）
> 🔒 v4.9 付费墙：format_card_node 按 user_tier 渲染卡片（free=精简5条+升级提示 / pro=完整15条+趋势+跨产品）
> 📊 v4.10 反馈深度学习：feedback_reader 双源读取（用户行为 + 推送频次降权，避免过滤气泡）
> 📰 v4.11 周报模板升级：weekly_report_node 输出专业行业周报（摘要/数据概览/TOP5/趋势/预判/量化指标），SP/UP 改为 str.format 避免 jinja2 JSON 模板冲突

**类型说明**: task(普通节点) / agent(大模型节点) / condition(条件分支) / looparray(列表循环) / loopcond(条件循环)

### 节点拆分对比

| 旧架构 (v4.3) | 新架构 (v4.4) | 改进 |
|--------------|--------------|------|
| `analyze_and_push`（7件事） | `history_reader`（读历史） | 单一职责 |
| | `analyze_llm`（LLM分析+去重+合并） | 单一职责 |
| | `format_card`（构建卡片） | 单一职责 |
| | `feishu_pusher`（推送到飞书） | 单一职责 |

**改进价值**：
- 单点崩溃影响范围从 100% → 25%
- 节点可独立测试/重试
- 易于扩展新推送渠道（邮件/公众号/Telegram）
- 易于并行化（analyze_llm 和 feishu_pusher 之间可插入缓存层）

## 子图清单
无

## v4.5 Harness 设计
- 文件：`src/graphs/utils/harness.py`
- 三层能力：
  - **Retry Layer**：`retry_with_backoff` 装饰器，指数退避（默认 1s→2s→4s）
  - **Fallback Layer**：`with_fallback` 装饰器，主函数失败时执行降级函数
  - **Observability Layer**：`node_metrics` 上下文管理器 + `NodeMetricsCollector.add_metric()` + `log_node_result()` 结构化JSON日志
- 工具函数：`get_logger(name)` / `is_retryable_error(exc)` / `log_node_result(...)`
- 引入节点：feishu_pusher、analyze_llm、search_news、write_to_bitable、filter_news、feedback_reader

## v4.7 并行架构升级- **新工具 bitable_locator**：`src/graphs/utils/bitable_locator.py`
  - `resolve_product_bitable(product_id, ...)` 通过 product_id 派生查找 Base / 数据表
  - `find_base_by_name(name)` / `find_table_by_names(app_token, names)` / `list_bases()`
  - 让 trend_analysis 和 history_reader 在 app_token/table_id 为空时仍能主动查找（不阻塞并行启动）
- **并行化 2 处**：
  1. **search_news → [event_dedup, feedback_reader] → filter_news**（v4.6 已有）
  2. **filter_news → [write_to_bitable, trend_analysis, history_reader] → analyze_llm**（v4.7 新增）
- **节省耗时**：原串行 `write_to_bitable (3-5s) → trend (3-5s) → history (3-5s) = 9-15s`
  → 并行 `max(3-5s, 3-5s, 3-5s) = 3-5s`，**节省约 50% 下游耗时**
- **安全降级**：trend_analysis / history_reader 的 v4.7 fallback 失败时（如 401 集成未授权）降级为空 records，不阻塞主流程

## v4.8 跨产品关联分析（轻量级）

### 核心目标
- 让用户从"单一产品的当天推送"升级为"看见产品与产品之间的关联"
- 不依赖 LLM，纯文本匹配 + 字符级分词，节省 token 成本

### 实现方案
- **新节点 cross_product_overlap**：基于本周/上周主题词对比 + 跨产品关键词命中探测
  - 输入：`history_records`（30天Bitable历史）+ `filtered_results`（本次筛选结果）
  - 切分历史为本周/上周（按时间戳或数量均分）
  - 字符级中文 2-gram 分词（不依赖 jieba）→ 统计 Top 5 主题词
  - 计算增长率 → 输出 `trending_topics: List[Dict]` + `trend_insights: str`
  - **跨产品关联提示**：基于预定义的产品专属关键词库（如 ai_daily→国产大模型，overseas_ceo→TikTok/SaaS，global_ai→OpenAI/Anthropic），命中主题词时输出"「X」在Y产品中也有相关报道"
- **节点并行**：`[write_to_bitable, trend_analysis, history_reader] → [cross_product_overlap + analyze_llm] → format_card`
  - cross_product_overlap 与 analyze_llm 并行（不依赖 LLM 输出，~2-3s 完成）
- **卡片升级**：format_card_node 在主题热度条形图后增加"📈 主题趋势 + 跨产品关联"折叠栏

### 输出效果（global_ai/daily 实测）
```
trending_topics: [{"topic":"深度","change":"NEW",...}, {"topic":"几何","change":"NEW",...}]
trend_insights: "📈 升温：深度(新增)、几何(新增)、突破(新增)"
cross_product_hints: ["「深度」在中文AI早报中也有相关报道"]
```

### 价值
- 用户可看到"本周 vs 上周"主题热度变化（不只是当天事件）
- 用户可看到"3个产品中哪些话题是共同的"（强化跨产品价值）
- 零 LLM 调用 → 零 token 成本 → 可持续运行
- 为后续 v4.9 "3产品网络效应深度分析"打下基础

## v4.6 反馈机制设计
- **新节点 feedback_reader**：从飞书多维表格读"反馈聚合表"，按主题聚合为偏好分数 `feedback_signals: Dict[str, float]`
  - 表名约定：`<product_id>_feedback` 或 `<product_id>_feedback_aggregates` / 中文名"反馈聚合"
  - 记录字段：`topic / like_count / dislike_count / favorite_count`
  - 偏好分数公式：`score = (like - dislike*2 + favorite*2) / max(1, total)`，归一化到 `[-1.0, 1.0]`
- **链路调整**：search_news 后分叉为 event_dedup + feedback_reader（并行），再汇聚到 filter_news
- **filter_news 升级**：读取 `state.feedback_signals`，将偏好分数注入 LLM 提示词 + 候选打分加权
- **format_card 升级**：卡片底部加 3 个 action 按钮（👍/👎/⭐），点击后调用飞书 webhook 回调写入反馈聚合表
- **首次运行**：未找到反馈表时返回空 signals（真实结果，非 mock），filter_news 退化为旧版无加权逻辑

## 技能使用
- 节点 `filter_news` / `analyze_llm` / `weekly_report` 使用大语言模型技能
- 节点 `write_to_bitable` / `trend_analysis` / `history_reader` / `feedback_reader` 使用飞书多维表格技能（integration-feishu-base）
- 节点 `weekly_report` / `feishu_pusher` 使用飞书消息技能（integration-feishu-message，webhook方式）

## 项目结构

```
src/graphs/
├── state.py              # 全局状态+图入出参+13个节点I/O类型
├── graph.py              # 主图编排（DAG：12节点 + 2处并行汇合）
├── utils/
│   ├── harness.py        # v4.5 三层 Harness
│   ├── bitable_locator.py # v4.7 Bitable 派生查找工具
│   └── __init__.py       # 产品配置加载器 + harness + bitable_locator
└── nodes/                # 12个节点（按调用顺序）
    ├── load_product_node.py
    ├── search_news_node.py
    ├── event_dedup_node.py
    ├── feedback_reader_node.py     # v4.6
    ├── filter_news_node.py
    ├── write_to_bitable_node.py
    ├── trend_analysis_node.py
    ├── history_reader_node.py
    ├── analyze_llm_node.py
    ├── format_card_node.py
    ├── feishu_pusher_node.py
    ├── weekly_report_node.py
    └── heat_curve_node.py
```

## 工作流

### Daily（日报）全流程（v4.7 并行架构）
```
load_product
  → search_news
    → [event_dedup, feedback_reader]   ← 并行汇合
      → filter_news
        → [write_to_bitable, trend_analysis, history_reader]  ← 并行汇合（v4.7）
          → analyze_llm
            → format_card
              → feishu_pusher → END
```

### Weekly（周报）
```
load_product → weekly_report → END
```

### Curve（主题热度曲线）
```
load_product → heat_curve → END
```

## 产品配置

| 产品ID | 中文名 | 颜色 | 文件 |
|-------|--------|------|------|
| ai_daily | 中文AI早报 | 紫色 | `config/products/ai_daily.json` |
| overseas_ceo | 出海CEO早报 | 橙色 | `config/products/overseas_ceo.json` |
| global_ai | 国际AI洞察 | 蓝色 | `config/products/global_ai.json` |

每个产品JSON包含：
- 顶层：`config`(筛选LLM) / `sp`(筛选系统提示) / `up`(筛选用户提示) / `tools` / `bitable_base_name` / `card_template` 等
- 嵌套 `analysis_config`：分析LLM（决策视角SP/UP）

## 版本演进

| 版本 | 关键能力 | 状态 |
|-----|---------|------|
| v1 | 基础搜索+筛选+推送 | ✅ |
| v2 | 飞书多维表格沉淀+AI分析 | ✅ |
| v3 | 6项全能优化（并行/去重/分级/热词/卡片/可视化） | ✅ |
| v4.0 | 3产品配置层（1引擎×3产品） | ✅ |
| v4.1 | 周报+主题热度曲线 | ✅ |
| v4.2 | 决策视角升级（独立判断+机会/风险/3角色建议） | ✅ |
| v4.3 | 事件级去重+信源可信度打分（−26%~49%噪音） | ✅ |
| v4.4 | 节点拆分（analyze_and_push→4个职责单一节点） | ✅ |
| v4.5 | 三层 Harness（Retry+Fallback+Observability） | ✅ |
| v4.6 | 用户反馈机制（feedback_reader + filter加权 + 卡片action按钮） | ✅ |
| v4.7 | 并行架构升级（filter_news 后三路并行：write_to_bitable + trend + history） | ✅ |
| v4.8 | 跨产品关联分析（轻量级主题趋势 + 跨产品关键词匹配） | ✅ |
| v4.9 | 付费墙验证（user_tier 字段 + free/pro 差异化渲染） | ✅ |
| v4.10 | 反馈机制深度学习（用户行为+推送频次降权） | ✅ |
| v4.11 | 周报专业行业模板升级（5大段：摘要/数据/TOP5/趋势/预判） | ✅ |
| v5.0 | **多源数据融合**：自然语言查询 + TrendRadar(35+平台) + AI-HotRadar(5分类) + 4D评分 + 五层漏斗分类 | ✅ 当前 |

## 下一步规划

| 优先级 | 改进 | 价值 | 工作量 | 状态 |
|-------|------|------|--------|------|
| 🥇 | 邮件/公众号/Telegram多渠道分发 | ⭐⭐⭐ | 1-2周 | 待启动（用户排除邮件） |
| 🥈 | 付费墙验证（A/B测试免费/付费分层） | ⭐⭐⭐ | 2-3周 | ✅ v4.9 完成 |
| 🥉 | 反馈机制深度学习（基于反馈再训练个性化SP） | ⭐⭐⭐ | 2-3周 | ✅ v4.10 完成 |
| 4 | v4.7 fallback 优化（trend/history 第一次跑也能读到历史） | ⭐⭐ | 1-2天 | 待启动 |
| 5 | v4.12 跨产品深度关联（3产品 Bitable 真实共享） | ⭐⭐⭐⭐ | 2-3周 | 待启动 |
| 6 | 周报专业行业模板升级 | ⭐⭐⭐ | 1-2天 | ✅ v4.11 完成 |
| 7 | **v5.0 多源数据融合**（融合 AI-Radar + TrendRadar + AI-HotRadar 三大数据源） | ⭐⭐⭐⭐⭐ | 1-2天 | ✅ v5.0 完成 |
| 7a | **v5.0.1 周报实时兜底**（Bitable历史为空时直接调 fetcher 拉本周多源数据） | ⭐⭐⭐⭐ | 0.5天 | ✅ v5.0.1 完成 |
| 8 | v5.1 自然语言查询 + 语义检索 | ⭐⭐⭐⭐ | 1周 | 📋 |
