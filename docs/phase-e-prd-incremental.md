# AI Radar Phase E 增量 PRD v1.0

> **作者**：许清楚（Xu）· 产品经理
> **日期**：2026-05-30
> **前置对齐**：docs/phase-e-prd-realignment-proposal.md（齐活林）
> **范围**：双线并行 — A 线 3 层信息架构重构 + B 线 Phase D 商业化

---

## TL;DR

3 周内并行交付两条线 —— **A 线把 AI Radar 拉回"AI 圈在发生什么"的本质**（200 条种子 + 4 张新表 + 2 个新页面 + 4 个新爬虫源），**B 线启动订阅化试水**（Pricing 页 + Newsletter + mock 付费墙 + 邮件模板），全程不接 Stripe。

---

## 一、产品目标（Phase E 范围）

### A 线 - 3 层信息架构重构（核心战略）

**A.1 目标**：让 AI Radar 从"分类目录工具"回归"AI 圈发现引擎"，3 层信息（L1 成熟赛道 / L2 今日新发 / L3 趋势方向）显性化、互不替代。

**A.2 验收标准**：
- 首页出现 3 个入口卡片（成熟赛道 / 今日新发 / 趋势方向），新用户 5 秒内能感知产品价值
- `/launches` 页面有 ≥ 120 条新发布事件，可按源/时间筛选
- `/trends` 页面有 ≥ 40 条趋势信号 + 词云 + 增长曲线 + Top 20 动量
- L1 分类目录保持原有 13 个分类，覆盖度不退化
- 推送链路跑通：新事件入 `launch_events` → webhook 端到端 ≤ 5 分钟

### B 线 - Phase D 商业化（并行试水）

**B.1 目标**：建立"免费 + Newsletter + 付费 3 档"的产品分层，让早期用户产生第一笔转化（哪怕是 0 元订阅）信号。

**B.2 验收标准**：
- `/pricing` 页面 3 档（Starter $29 / Pro $79 / Enterprise $299）完整展示
- Newsletter 订阅表单在首页 + Pricing 页可访问，提交后写库
- `user_profiles.plan` 字段从 `free` → `starter` / `pro` / `enterprise` 可切换（mock）
- 付费墙软墙：未订阅用户在 Pro 专属内容看到"立即升级"弹窗，可关闭不强制
- 3 套邮件模板就位（订阅确认 / 续费提醒 / 周报）

---

## 二、用户故事

### A 线 - 3 层重构

- **US-A-01**：作为**早期 AI 创业者**，我想打开网站就看到"今天 AI 圈又出了什么新产品"，这样我不用刷 PH / HN / X 十几个平台也能掌握全貌。
- **US-A-02**：作为**关注 AI 赛道的投资人**，我想发现"最近哪些方向在升温"，这样我能提前布局下一轮押注。
- **US-A-03**：作为**AI 工具重度使用者**，我想按成熟品类找工具（比如找一个好用的 AI 视频生成器），这样我不用被淹没在大量新发布里。
- **US-A-04**：作为**老用户**，我希望现有的 watchlist / compare / dashboard 都不被破坏，新增的 L2/L3 是补充不是替代。
- **US-A-05**：作为**运营人员**，我想看到新发布事件的原始抓取时间和来源，这样我能验证数据可信度。

### B 线 - 商业化

- **US-B-01**：作为**不想每天开网站**的创业者，我想订阅 Newsletter 每日摘要，邮件里收到"今天 10 条新发布 + 3 个升温方向"。
- **US-B-02**：作为**想深度研究**的创业者，我想订阅 Pro 档解锁"无限验证报告 + 趋势曲线详情"。
- **US-B-03**：作为**投资机构**，我想订阅 Enterprise 档获取 API + 多账号管理能力（B 线先留 mock 入口，等 A 线稳定后再上真实 API）。
- **US-B-04**：作为**免费用户**，我看到"立即升级"弹窗时能理解付费价值，能关掉继续用，但关键功能有提示。

---

## 三、需求池

### A 线 - 3 层重构

#### P0（必做）

- **A-1** `launch_events` 表 + schema 迁移
  - 字段：id / product_id (FK) / source / source_url / source_id / event_type / title / body / author / engagement(JSONB) / detected_at / event_at / confidence / raw_data(JSONB)
  - 索引：event_at DESC、product_id、source+event_at DESC
  - 唯一约束：`(source, source_id)` 用于去重

- **A-2** `trend_signals` 表 + schema 迁移
  - 字段：id / signal_type / scope / title / description / evidence(JSONB) / strength / velocity / novelty / first_seen / last_updated / status
  - signal_type 枚举：`tag_emerging` / `category_growing` / `tech_stack_shift` / `cluster_new` / `funding_pattern`
  - status 枚举：`emerging` / `peaking` / `cooling` / `expired`
  - 索引：status+strength DESC、signal_type

- **A-3** `categories` 表 + `product_signals` 多对多关联表
  - `categories`：id / slug(UNIQUE) / name_en / name_zh / parent_slug / description_en / description_zh / icon / display_order / product_count
  - `product_signals`：product_id + signal_id 联合主键，relevance 字段
  - 迁移策略：`products.category` 字符串字段保留，新老兼容

- **A-4** 200 条种子数据 SQL（40:120:40 配比）
  - L1 成熟赛道 40 条：覆盖 13 个分类，每个分类 2-4 个明星产品（保留 ChatGPT/Claude/Cursor/Midjourney 等头部）
  - L2 近期新发布 120 条：2025 Q4 - 2026 Q1 真实在 PH/HN/GitHub trending/X 上架的新产品（Cursor Agent / Claude Code / Devin / Manus / Bolt.new / Lovable / Genspark / Lindy / Replit Agent 等）
  - L3 趋势信号定义者 40 条：每个新兴标签/技术堆栈挑 1-2 个代表性产品（agent-orchestration / browser-use / voice-clone / video-gen-open-source / mamba-architecture / multi-modal-coding 等）
  - 配套：每条新产品配 1-3 条 `launch_events` 记录 + 标注所属的 1-2 个 `trend_signals`

- **A-5** `/launches` 页面 MVP
  - 路由：`/launches`
  - 布局：24h 时间轴（最新在上）+ 源标签筛选（PH / HN / X / GitHub / 小红书）+ 卡片流
  - 卡片字段：产品名 / 来源 logo / 标题 / 摘要 / 互动数（upvotes/comments/stars）/ 检测时间 / 置信度
  - 排序：默认按 event_at DESC，可切"今天/本周/本月"
  - 空态：友好引导去订阅 Newsletter

- **A-6** `/trends` 页面改造
  - 现有 `trends/page.tsx` 是空壳，改为完整版
  - 布局：
    - 顶部 Hero："AI 圈正在升温的方向" + 简短副标题
    - 中部：标签词云（按 strength 着色，emerging=红 / peaking=橙 / cooling=蓝）
    - 增长曲线：Top 5 信号周环比折线图
    - 信号卡片网格：每张卡片 = 1 个 trend_signal，含 title / description / evidence 摘要 / 关联产品数
    - 底部：Top 20 动量榜（按 velocity 排序）

- **A-7** 首页 3 入口卡片
  - 修改 `frontend/src/app/page.tsx` 或 `home/page.tsx`
  - Hero 文案改为："今天 AI 圈在发生什么"
  - Hero 下方 3 个并排卡片：
    - 卡 1：L1 成熟赛道 → 跳转 `/discover`，配图标 + 副标"13 个品类的 AI 工具"
    - 卡 2：L2 今日新发 → 跳转 `/launches`，配图标 + 副标"过去 24h 新上架的产品"
    - 卡 3：L3 趋势方向 → 跳转 `/trends`，配图标 + 副标"正在升温的方向"
  - 卡片下方：
    - "今日新发布" 横滑卡片（取自 launch_events，最多 10 条）
    - "趋势方向" Top 5（取自 trend_signals，按 strength）

- **A-8** README v9.1 重写
  - 开篇先讲 3 层信息架构理念，配 3 入口卡片示意图
  - 数据流图：sources → launch_events/trend_signals → products → 前端
  - 章节：项目背景 / 信息架构 / 数据模型 / 爬虫矩阵 / 商业化（Phase D 同步说明） / 路线图
  - 修正 1.4 节"15 个数据源"为实际实现状态（4 个已实现 + 4 个 P0 扩展中）

- **A-9** 爬虫 P0 扩展（4 个源，并行于 UI）
  - 扩展 `crawler/src/sources/github.ts`：加 GitHub Trending 抓取（按语言 + 时间窗口）
  - 新建 `crawler/src/sources/x_keyword.ts`：X/Twitter 关键词（AI/Agent/LLM 等），走第三方 API（apify/rapidapi mock 接口先跑通）
  - 新建 `crawler/src/sources/arxiv.ts`：arXiv cs.AI / cs.CL 每日新增
  - 新建 `crawler/src/sources/huggingface.ts`：HuggingFace Trending repos
  - 写入策略：抓到的 raw event 写 `launch_events`，对其中识别为新产品的写 `products`（confidence ≥ 0.7 才入 products 表）

- **A-10** 推送链路跑通
  - 触发器：insert `launch_events` 且 event_type = 'launch' 且 source ∈ (PH, HN, GitHub) 且 confidence ≥ 0.6
  - 接收方：push-worker webhook（已有），加新通道 `/webhook/launch`
  - 端到端：写入 → 触发 → 推送 worker 收到 → 调用 push_channels 中配置的 webhook URL
  - 验收：人工触发 1 条 launch_event，从写入到 webhook 收到延迟 ≤ 5 分钟

#### P1（应做）

- **A-11** Discover 排序选项新增"今天/本周/本月"
  - 修改 `discover/page.tsx` 排序下拉
  - 依据：`products.first_seen` 或 `launch_events.event_at` 最近时间

- **A-12** 启动事件筛选面板（侧边栏）
  - 来源多选：PH / HN / X / GitHub / 小红书 / RSS
  - 事件类型：launch / major_update / open_source / funding
  - 时间范围：今天/本周/本月/全部

- **A-13** `/launches` 详情抽屉
  - 点击卡片从右侧滑出，含 raw_data JSON 美化展示 + 跳转源链接

#### P2（待定/Phase G）

- **A-14** 信号聚合算法（标签突发检测 + 周环比 + 新颖度）— 留给 Phase G
- **A-15** 趋势图谱可视化 — 留给 Phase G
- **A-16** i18n 内容补齐（中英双语词云/趋势标题）— 留给 Phase G

### B 线 - 商业化

#### P0（必做）

- **B-1** `/pricing` 页面
  - 路由：`/pricing`
  - 布局：3 档卡片横排（Starter / Pro / Enterprise）
  - 字段：价格（月/年切换）/ 功能列表（3-5 条）/ CTA 按钮（"立即订阅" → mock 弹窗）
  - 文案（暂定）：
    - Starter $29/月：每日摘要邮件 / 100 次产品查询 / 基础 watchlist
    - Pro $79/月：无限验证报告 / 趋势曲线详情 / 高级筛选 / 多端推送
    - Enterprise $299/月：API 访问 / 团队账号 / 自定义爬虫源 / SLA 保障
  - 底部 FAQ：3-5 条常见问题（订阅周期 / 退款 / 发票）

- **B-2** Newsletter 订阅表单
  - 位置：首页 Hero 下方 + Pricing 页顶部 + `/launches` 页空态
  - 字段：email（必填）+ 频率（每日/每周，默认每日）
  - 提交后：写 `newsletter_subscriptions` 表（新建） + 触发"订阅确认"邮件
  - 反馈：成功 toast / 失败原因（重复订阅/格式错误）

- **B-3** `user_profiles.plan` 状态映射（mock）
  - 现有 `user_profiles` 表加 `plan` 字段，枚举：`free` / `starter` / `pro` / `enterprise`
  - 状态切换：mock 控制台（`/admin/plan-switcher`），无真实支付
  - 默认值：`free`
  - 升级路径：用户在 Pricing 页点"立即订阅" → 后端 mock 写入 → 跳转成功页

- **B-4** 付费墙软墙
  - 触发点：未订阅用户访问 Pro 专属内容（趋势曲线详情 / 验证报告 / 高级筛选）
  - 行为：显示"立即升级"弹窗（不强制，可关闭）
  - 弹窗内容：3 档对比表 + 30 天免费试用 CTA（mock）
  - 实现：客户端组件包裹 + `usePlan()` hook

#### P1（应做）

- **B-5** 邮件模板 3 套
  - 订阅确认：欢迎语 + 邮箱验证链接（mock 链接到 /newsletter/confirm?token=xxx）+ 退订链接
  - 续费提醒：提前 7 天推送，含当前 plan + 到期日 + 一键续费
  - 周报（每日摘要 B 阶段再做）：含过去 24h Top 5 新发布 + 3 个升温方向
  - 实现：`push-worker` 加 `/email/send` 通道，HTML 模板放 `push-worker/templates/`

- **B-6** 隐私页订阅协议更新
  - 修改 `frontend/src/app/privacy/page.tsx`
  - 增补：邮件订阅的数据使用说明 / 第三方邮件服务声明（mock SendGrid）/ 退订机制 / 数据保留期

- **B-7** 订阅成功页
  - 路由：`/subscription/success?plan=xxx`
  - 内容：成功提示 + 当前 plan + 下一步引导 + 返回首页按钮

#### P2（待定）

- **B-8** 试用倒计时横幅（首页顶部，"30 天 Pro 免费试用"）— 需设计评审
- **B-9** 团队账号（Enterprise）— 留给 Phase F+
- **B-10** Stripe 集成 — 明确**不做**，留 mock 入口

---

## 四、UI/UX 草图（描述）

### 4.1 首页 3 入口卡片布局

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo AI Radar]              [导航: Discover Launches Trends ...] │
│                                                              │
│            今天 AI 圈在发生什么                                │
│       3 层信息架构，发现你想押注的下一个方向                    │
│                                                              │
│       [邮箱] [订阅每日摘要]  ← 嵌入 Newsletter 表单             │
│                                                              │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│   │ 🗂          │  │ 🚀          │  │ 📈          │             │
│   │ 成熟赛道    │  │ 今日新发    │  │ 趋势方向    │             │
│   │ 13 个品类   │  │ 24h 120+   │  │ 40+ 信号    │             │
│   │ → /discover│  │ → /launches│  │ → /trends   │             │
│   └────────────┘  └────────────┘  └────────────┘             │
│                                                              │
│   今日新发布 (横滑卡片，最多 10 条)                            │
│   [卡] [卡] [卡] [卡] [卡] →                                 │
│                                                              │
│   趋势方向 Top 5                                              │
│   #1 agent-orchestration  strength 87 ↑12%                    │
│   #2 browser-use           strength 76 ↑8%                    │
│   ...                                                        │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 /launches 时间轴样式

```
┌──────────────────────────────────────────────────────────────┐
│  今日新发布                                                   │
│  [全部] [ProductHunt] [HackerNews] [X] [GitHub] [小红书]      │
│  时间: [今天] [本周] [本月] [全部]                            │
│                                                              │
│  ● 14:32  [PH] Bolt.new v2 — AI 全栈开发升级                 │
│           upvotes 234 / comments 56   [查看 →]                │
│           ───────────────────────────                         │
│  ● 12:15  [GitHub] openai/agentkit — Agent 编排框架          │
│           stars 1.2k / forks 89   [查看 →]                    │
│           ───────────────────────────                         │
│  ● 09:48  [X] @navan 发布 "Lindy 3.0 自主 Agent 平台"         │
│           retweets 432 / likes 2.1k   [查看 →]                │
│           ───────────────────────────                         │
│  ...                                                         │
│                                                              │
│  [加载更多]                                                   │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 /trends 信号卡片样式

```
┌──────────────────────────────────────────────────────────────┐
│  AI 圈正在升温的方向                                          │
│  数据更新于 2026-05-30 14:00                                  │
│                                                              │
│  [词云区域：标签大小=strength，颜色=status]                    │
│    agent-orchestration  mamba-architecture  browser-use       │
│    voice-clone          video-gen-open-source                │
│    multi-modal-coding   text-to-3d                          │
│                                                              │
│  Top 5 增长曲线（折线图）                                     │
│  [折线: 5 条不同颜色的线，过去 8 周数据]                       │
│                                                              │
│  信号卡片网格（4 列 × N 行）                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ emerging 🔥  │ │ peaking ⭐   │ │ emerging 🔥  │ │ ...     │ │
│  │ Agent 编排   │ │ Mamba 架构   │ │ Browser Use │ │         │ │
│  │ strength 87 │ │ strength 79 │ │ strength 72 │ │         │ │
│  │ +12% 周     │ │ +5% 周      │ │ +18% 周     │ │         │ │
│  │ 关联 5 个产品│ │ 关联 3 个   │ │ 关联 4 个   │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                              │
│  Top 20 动量榜                                                │
│  1. agent-orchestration  velocity +18%                       │
│  2. text-to-3d            velocity +14%                       │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 /pricing 3 档卡片样式

```
┌──────────────────────────────────────────────────────────────┐
│  选择适合你的方案                                              │
│  [月付] [年付（省 20%）]                                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Starter     │  │ Pro ⭐ 推荐 │  │ Enterprise │             │
│  │ $29/月      │  │ $79/月      │  │ $299/月    │             │
│  │ ────────── │  │ ────────── │  │ ────────── │             │
│  │ ✓ 每日摘要 │  │ ✓ Starter   │  │ ✓ Pro      │             │
│  │ ✓ 100次查询 │  │ ✓ 无限报告 │  │ ✓ API 访问 │             │
│  │ ✓ 基础     │  │ ✓ 趋势详情 │  │ ✓ 团队账号 │             │
│  │   watchlist │  │ ✓ 高级筛选 │  │ ✓ 自定义源 │             │
│  │ ────────── │  │ ────────── │  │ ────────── │             │
│  │ [立即订阅] │  │ [立即订阅]  │  │ [联系销售] │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                              │
│  FAQ: 订阅周期? / 能退款吗? / 发票? / 多账号? / 取消?         │
│                                                              │
│  [Newsletter 订阅表单]                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 五、关键 KPI（Phase E 验收）

### A 线

| 指标 | 目标值 | 测量方式 |
|---|---|---|
| 3 层数据覆盖 | L1 ≥ 40 / L2 ≥ 120 / L3 ≥ 40 | SQL 计数 |
| 首页 3 入口卡片可达性 | 100%（新用户首屏可见） | 手动验证 + 截图 |
| `/launches` 可用性 | 至少 5 个源可筛选 | 手动验证 |
| `/trends` 完整度 | 词云+曲线+Top20+信号卡 4 件套齐全 | 手动验证 |
| 推送链路延迟 | 新发布入 launch_events → webhook ≤ 5 分钟 | 端到端测试 |
| 爬虫 P0 4 源 | 4 个源都能成功跑通 1 次抓取 | 日志 |
| README v9.1 | 3 层架构作为开篇 | 文档评审 |
| 旧功能不退化 | watchlist / compare / dashboard 100% 保留 | 回归测试 |

### B 线

| 指标 | 目标值 | 测量方式 |
|---|---|---|
| `/pricing` 页面 | 3 档卡片完整展示 | 手动验证 |
| Newsletter 订阅转化 | 提交成功率 ≥ 95% | 后端日志 |
| 付费墙软墙触发 | Pro 专属内容触发 100%，可关闭 | 手动验证 |
| 邮件模板 | 3 套模板就位 + 发送成功 | 手动触发 |
| mock 订阅路径 | free → pro 状态切换成功 | 手动验证 |

---

## 六、待明确事项

以下事项需架构师 / 工程师确认后补充，不阻塞 PRD v1.0 发布：

1. **A-1/A-2 schema 迁移策略**：直接 `ALTER TABLE` 还是新建 `002_xxx.sql` 迁移文件？建议后者（与现有 `001_initial_schema.sql` 一致）。
2. **A-9 X/Twitter 抓取**：apify / rapidapi 选哪家？月预算 $20-50 可控，但需明确是 mock 抓取（用模拟数据）还是真实抓取（需 API key）。
3. **A-10 推送链路**：push-worker 已有 9 渠道字段，是否复用现有 webhook 通道，还是新加 `/webhook/launch`？建议后者，区分数据来源。
4. **B-3 plan 字段类型**：用 `TEXT` + check 约束，还是 `ENUM`？建议 `TEXT` + check，便于后续扩展。
5. **B-5 邮件发送**：mock 还是接 SendGrid / Resend（免费层）？Phase E 建议 mock（写到 `outbox` 表 + 日志），Phase F 再接真实服务。
6. **Newsletter 数据表**：新建 `newsletter_subscriptions`（含 email / frequency / subscribed_at / unsubscribe_token）还是复用 push_channels？建议新建。
7. **i18n 处理**：Pricing 页 + Newsletter 表单中英文是否同步？建议同步（en + zh 都写），避免后续回填。

---

## 七、不在 Phase E 范围内（明确）

- ❌ Stripe / 真实支付集成（仅 mock）
- ❌ Public API / Webhook 对外暴露
- ❌ 移动端 PWA
- ❌ OAuth 第三方登录
- ❌ 完整 GDPR/CCPA 同意管理（仅保留页面）
- ❌ 趋势图谱可视化（Phase G）
- ❌ 信号聚合算法（Phase G）
- ❌ 团队账号（Phase F+）

---

**TL;DR v2**：3 周双线并行 —— A 线 4 表 + 200 种子 + 2 新页 + 4 爬虫 + 推送；B 线 Pricing + Newsletter + mock 付费墙 + 3 邮件模板。验收看 3 层数据覆盖 + 推送延迟 + 软墙可达。
