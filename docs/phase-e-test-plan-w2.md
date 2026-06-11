# AI Radar — Phase E W2 测试计划

> **作者**: 严过关 (QA Engineer)
> **日期**: 2026-06-01
> **状态**: v1 预研稿 (待 W2 启动时基于 寇豆码-1 实际产出微调)
> **范围**: T10-T20 (W2 核心交互周)
> **关联文档**:
> - `docs/phase-e-test-plan.md` (W1 测试计划, 68 cases, 已交付)
> - `docs/phase-e-architecture-review.md` (W1 架构评审, 3 P0/5 P1/4 P2)
> - `docs/phase-e-task-breakdown.md` §2 (T10-T20 任务分解)
> - `docs/phase-e-prd-incremental.md` A-5~A-16/B-2~B-3 (PRD)
> - `docs/phase-e-api-contracts.md` §1/§2/§7 (Launches/Trends/Admin API)
> - `docs/phase-e-architecture.md` ADR-07/ADR-08 (RSC + PaywallGate 决策)

---

## 0. 测试策略

### 0.1 W2 重心

W1 是**基建+API** 单测为主 (SQL/RLS/错误码), W2 是**前端组件+页面+E2E** 为主:

| 层级 | W1 | W2 |
|------|----|----|
| 单元 | SQL 幂等、RLS、API 错误码 | 组件 props/state、usePlan hook |
| 集成 | curl + psql | curl + 浏览器 + Playwright |
| 端到端 | 无 | T20 全链路 4 页面截图 |
| 视觉/性能 | 无 | Lighthouse ≥ 85、i18n、3 断点截图 |
| a11y | 无 | 焦点管理、键盘可达、ARIA |

### 0.2 不在 W2 测试范围

- ❌ **爬虫单元测试** (T21-T24 属 W3)
- ❌ **真实邮件发送** (mock 标识验证即可)
- ❌ **Stripe 集成** (PM 排除)
- ❌ **OAuth 登录** (沿用 Phase D 已有)
- ❌ **信号聚合算法真值** (seed 写死, Phase G 接入)
- ❌ **PWA / service-worker** (PM 排除)

### 0.3 验收门槛

W2 整体 PASS 条件 (对应 T20):

| 项 | 门槛 |
|----|------|
| Lighthouse 性能 | 4 页均 ≥ 85 |
| Lighthouse SEO | 4 页均 ≥ 95 |
| i18n 切换 | 4 页 (en/zh) 无硬编码漏翻 |
| 回归 | watchlist / compare / dashboard 100% 保留 |
| API 状态码 | 12 个端点全部 2xx (无 5xx) |
| 视觉断点 | 桌面 1440 / 平板 768 / 手机 375 三套截图存档 |

---

## 1. 测试矩阵总览 (T10-T20)

| 任务 | 优先级 | 复杂度 | 测试数 | 主要测试类型 |
|------|--------|--------|--------|--------------|
| T10 /launches 列表页 | P0 | L | 8 | 单元 3 + 集成 3 + 视觉 2 |
| T11 /trends 重构 | P0 | L | 9 | 单元 4 + 集成 3 + 视觉 2 |
| T12 首页 3 入口 | P0 | M | 7 | 单元 3 + 集成 2 + 视觉 2 |
| T13 启动筛选面板 | P1 | M | 6 | 单元 3 + 集成 2 + 视觉 1 |
| T14 详情抽屉 | P1 | M | 5 | 单元 2 + 集成 2 + a11y 1 |
| T15 Discover 排序 | P1 | S | 4 | 单元 2 + 集成 1 + 回归 1 |
| T16 plan-switcher | P0 | M | 6 | 单元 3 + 集成 2 + 安全 1 |
| T17 PaywallGate | P0 | M | 5 | 单元 2 + 集成 2 + a11y 1 |
| T18 订阅成功页 | P0 | S | 3 | 单元 1 + 集成 1 + 视觉 1 |
| T19 SEO + sitemap | P1 | S | 4 | 单元 2 + 集成 1 + 视觉 1 |
| T20 W2 E2E QA | P0 | M | 5 | 集成 3 + 视觉 2 |
| **合计** | - | - | **62** | 单元 27 + 集成 22 + 视觉 8 + a11y 2 + 安全 1 + 回归 2 |

---

## 2. T10 — /launches 页面 + 时间轴 (8 cases)

### T10-001 [单元] LaunchCard 组件 props/必填字段

**目标**: 验证 LaunchCard 接受完整 launch 对象并渲染所有 PRD 字段

**预置条件**:
- `frontend/src/components/LaunchCard.tsx` 已实现
- 准备 mock launch fixture (含 product_slug, source, event_type, title, body, author, engagement, event_at, confidence)

**步骤**:
1. 用 React Testing Library 渲染 `<LaunchCard launch={mockLaunch} />`
2. 断言: 卡片含产品名 / 来源徽章 (PH/HN/X/GitHub/小红书) / 标题 / 摘要 / 互动数 (upvotes+comments) / 检测时间 / 置信度
3. 缺字段场景: 传 `{ ...mockLaunch, body: undefined }` → 断言 body 区域渲染 fallback "—"
4. 缺字段场景: 传 `{ ...mockLaunch, engagement: {} }` → 断言互动数显示 0

**通过条件**:
- 全部 8 个字段在 DOM 可见
- 缺字段不崩, 有 fallback

**盲点参考**: BL-13 (confidence 显示格式), BL-22 (raw_data 字段不在卡片)

---

### T10-002 [单元] 时间范围按钮 → URL 参数映射

**目标**: "今天/本周/本月/全部" 4 个按钮正确切换 URL query 与 API 调用

**预置条件**:
- `LaunchTimeline.tsx` 内置 4 个按钮 (today/this_week/this_month/all)
- `/api/launches` §1.1 接受 `range: '24h'|'7d'|'30d'|'90d'|'all'`

**步骤**:
1. 渲染组件, 等待 hydration
2. 点 "今天" → 断言 URL 变为 `?range=24h` (或保留默认, 不写 query)
3. 点 "本周" → 断言 `?range=7d`
4. 点 "本月" → 断言 `?range=30d`
5. 点 "全部" → 断言 `?range=all`
6. **关键检查**: mock fetch 被调用 4 次, 每次 `range` 参数正确

**通过条件**:
- 4 个按钮 → 4 个不同 range 值
- 浏览器后退按钮能恢复前一个 range

**盲点参考**: BL-11 (默认是否写 URL)

---

### T10-003 [单元] 加载更多 (分页 page_size=20)

**目标**: 滚动到底自动加载 / 点 "加载更多" 按钮加载下一页

**步骤**:
1. Mock `/api/launches` 第 1 页 20 条, 第 2 页 20 条
2. 渲染页面, 断言初始 20 条可见
3. 滚动到底 (jsdom: `fireEvent.scroll` 到底部) → 断言加载第 2 页
4. 总数显示 `pagination.total`

**通过条件**:
- 翻页流畅无重复
- loading 状态可观察
- 末页时 "加载更多" 按钮 disabled 或隐藏

---

### T10-004 [集成] curl /api/launches?range=24h 验证种子数据

**目标**: API 实际返回 200 + 含 seed 120 条中今日范围的数据

**步骤**:
```bash
curl -s "https://<vercel>/api/launches?range=24h&page=1&page_size=20" \
  -H "apikey: <anon_key>" | jq '.code, .data.pagination.total, (.data.items|length)'
```
1. 断言 code=0
2. 断言 total ≥ 1 (种子里有 2026-05-30 的事件)
3. 断言 items[0].event_at 是最近 24h

**通过条件**:
- 状态 200
- items 长度 = page_size (20)
- 时间倒序

---

### T10-005 [集成] 多源筛选 URL 同步

**目标**: 筛选面板的 3 组多选 (来源 / 事件类型 / 时间范围) 反映到 URL

**步骤**:
1. 打开 `/launches?source=github&source=x&event_type=launch&range=7d`
2. 断言初始列表已应用筛选 (GitHub + X 来源, launch 类型, 7d)
3. 在筛选面板取消勾选 "GitHub" → 断言 URL 变为 `?source=x&event_type=launch&range=7d` (去重, 不留空)
4. 取消全部 source → 断言 `?event_type=launch&range=7d` (source 参数完全消失)

**通过条件**:
- 浏览器后退可恢复勾选状态
- 复制 URL 粘贴到新 tab, 筛选状态一致

**盲点参考**: BL-21 (多选 URL 格式: `?source=github&source=x` vs `?source=github,x`)

---

### T10-006 [集成] 空态触发 + NewsletterForm 引用

**目标**: 当 range=24h 但 0 条数据时, 显示 NewsletterForm

**预置条件**:
- mock /api/launches 在 `range=24h` 返回 `{ items: [], total: 0 }`

**步骤**:
1. 访问 `/launches?range=24h`
2. 断言看到 "暂无今日新发布" 提示
3. 断言内嵌 `<NewsletterForm source="launches_empty" />` (T07 组件)
4. 断言 Hero 文案 / 引导文案

**通过条件**:
- 空态不显示 "加载更多" 按钮
- NewsletterForm 提交走 T05 API, 显示 toast

**盲点参考**: BL-12 (空态阈值定义)

---

### T10-007 [视觉] LCP < 2s + 桌面/平板/手机 3 断点

**目标**: 性能 + 响应式

**步骤**:
1. Lighthouse Mobile 跑 `/launches?range=24h`
2. 桌面 1440 / 平板 768 / 手机 375 三套断点截图
3. 断言: 桌面 1 列宽卡 / 平板 1 列窄卡 / 手机 1 列全宽
4. 断言: LCP < 2.0s (Server Component 流式渲染)

**通过条件**:
- Lighthouse Performance ≥ 85
- LCP 元素是 3 条 launch card 之一 (而非 spinner)

---

### T10-008 [视觉] i18n 双语 + SEO meta

**目标**: 中英切换 + meta 完整

**步骤**:
1. 访问 `/en/launches` → 断言所有 UI 文案英文化
2. 访问 `/zh/launches` → 断言中文化 (词云/筛选/按钮)
3. 断言 `<title>` 含 "AI Radar" + "新发布" / "Launches"
4. 断言 `<meta name="description">` 描述页内容
5. 断言 `<meta property="og:image">` 非空
6. 断言 `<link rel="canonical">` 指向当前 URL

**通过条件**:
- 中英无硬编码漏翻
- meta 完整, 长度合适 (title 50-60 字符, desc 150-160)

---

## 3. T11 — /trends 页面改造 (9 cases)

### T11-001 [单元] TrendWordCloud 接受 signals 数组

**目标**: 词云组件正确渲染 40 条信号

**预置条件**:
- `react-d3-cloud@^1.0.0` 已安装
- 组件用 `next/dynamic` ssr:false 懒加载

**步骤**:
1. RTL render `<TrendWordCloud signals={mockSignals} />`
2. 断言 DOM 含 `text` 元素 40 个 (词云标签)
3. 断言 font-size 与 strength 成正比 (检查 inline style)
4. 断言 fill 颜色映射: emerging=红 / peaking=橙 / cooling=蓝 / expired=灰

**通过条件**:
- 40 个标签全部渲染
- 颜色 + 大小映射正确
- expired 信号**不渲染** (词云过滤)

**盲点参考**: BL-15 (d3 包 peer dep), BL-16 (expired 灰但又说不显示)

---

### T11-002 [单元] 词云懒加载 (避免 window is not defined)

**目标**: 验证 `next/dynamic` ssr:false 模式不引 SSR 错误

**步骤**:
1. `pnpm build` → 断言构建无 `window is not defined` 错误
2. 服务端渲染时 TrendWordCloud 占位 div (如 "Loading...") 可见
3. 客户端 hydration 后, 真实词云接管

**通过条件**:
- pnpm build 成功
- 服务端无 d3 报错
- 客户端词云交互 (hover/click) 正常

---

### T11-003 [单元] TrendSignalCard props + 4 列网格

**目标**: 信号卡片完整字段 + 响应式列数

**步骤**:
1. RTL render 网格容器 + 12 张 mock card
2. 断言每张卡含: title / description / evidence 摘要 / 关联产品数 / +周% / 强度条
3. 断言 viewport ≥ 1024px 时 4 列
4. 断言 viewport 768-1023 时 2 列
5. 断言 viewport < 768 时 1 列

**通过条件**:
- 字段全渲染, evidence 摘要截断 ≤ 120 字符
- 强度条按 strength 百分比渲染 (inline style width)
- 响应式 CSS grid 正确

---

### T11-004 [单元] Top 20 按 velocity DESC 排序

**目标**: 动量榜正确排序

**步骤**:
1. mock 20 条不同 velocity (1-20%)
2. render `<TrendTop20 signals={mock} />`
3. 断言 DOM 顺序: 速度从高到低
4. 断言第 1 名 velocity = 19% (mock 最高)

**通过条件**:
- 排序稳定 (相同 velocity 按 id 排序)
- 显示名次 1-20

---

### T11-005 [集成] curl /api/trends 默认排除 expired

**目标**: API 默认 status 排除 expired

**步骤**:
```bash
curl -s "https://<vercel>/api/trends" -H "apikey: <anon_key>" | \
  jq '.data.items | map(.status) | unique'
```
1. 断言 items 数组中 status 字段不含 "expired"
2. 显式传 `?status=expired` → 断言返回 expired 项
3. 断言 total = 40 (seed)

**通过条件**:
- 默认排除 expired
- 显式 status=expired 返回 expired

---

### T11-006 [集成] /trends 页面数据加载 + 时间戳显示

**目标**: Hero 区显示 "数据更新于 YYYY-MM-DD HH:MM"

**步骤**:
1. 访问 `/trends`
2. 断言 Hero 副标含 "AI 圈正在升温的方向" (中) / "Trending AI directions" (英)
3. 断言时间戳 = `last_updated` 字段最新值
4. 手动 mock `/api/trends` 慢响应 2s, 断言页面有 loading skeleton

**通过条件**:
- 时间戳动态 (不是硬编码)
- loading 状态用户可见

---

### T11-007 [集成] 信号卡点击 → /trends/[id] 详情

**目标**: 点击信号卡跳转详情

**步骤**:
1. 点击任一信号卡
2. 断言跳转 `/trends/<uuid>`
3. 详情页断言: 关联产品列表 ≥ 1, 字段完整

**通过条件**:
- 跳转流畅
- 详情页 RSC 渲染含 product_count, related_products

---

### T11-008 [视觉] 词云 + 强度条 + Top 20 三件套截图

**目标**: 完整 /trends 页面在 3 断点的视觉

**步骤**:
1. 桌面 1440 截图, 检查词云 40 标签 + 4 列信号卡 + 右侧 Top 20
2. 平板 768 截图, 2 列信号卡
3. 手机 375 截图, 1 列信号卡 + 词云缩小

**通过条件**:
- 三断点布局不破
- 词云无溢出
- 强度条颜色与图例一致

---

### T11-009 [视觉] 词云 i18n + 移动端交互

**目标**: 中英切换 + 移动端词云可点

**步骤**:
1. /en/trends: 词云标签 "agent-orchestration" / "mamba-architecture"
2. /zh/trends: 词云标签 "智能体编排" / "Mamba 架构" (seed 中文 title)
3. 移动端点击词云标签 → 断言 filter 到对应 signal
4. 移动端横滑信号卡 (T11-003 响应式)

**通过条件**:
- 中英词云都渲染
- 移动端可点

**盲点参考**: BL-17 (evidence 摘要格式)

---

## 4. T12 — 首页 3 入口卡片 (7 cases)

### T12-001 [单元] HomeEntryCard 3 种 variant

**目标**: L1/L2/L3 入口卡片分别渲染对应副标 + 跳转链接

**步骤**:
1. RTL render 3 个 HomeEntryCard, variant='L1'|'L2'|'L3'
2. 断言 L1: "13 个品类的 AI 工具" → `/discover`
3. 断言 L2: "过去 24h 新上架的产品" → `/launches`
4. 断言 L3: "正在升温的方向" → `/trends`
5. 断言每卡含 icon + 标题 + 副标 + 链接

**通过条件**:
- 3 卡内容区分清晰
- 链接正确 (相对路径)

---

### T12-002 [单元] NewLaunchesCarousel 纯 CSS scroll-snap

**目标**: 横滑组件用 CSS overflow-x-auto, 不引第三方轮播库

**步骤**:
1. RTL render 组件, mock 10 条 launch
2. 断言父容器 className 含 `overflow-x-auto` + `scroll-snap-type-x-mandatory`
3. 断言子元素 className 含 `scroll-snap-align-start`
4. 断言未引 `embla-carousel-react` / `swiper` 等

**通过条件**:
- 纯 CSS 实现
- 10 条全部渲染 (不截断)
- 不引第三方包

**盲点参考**: BL-18 (横滑 10 条 vs API page_size=20)

---

### T12-003 [单元] TopTrendsMini 强度条 + Top 5

**目标**: 趋势 Top 5 mini 列表

**步骤**:
1. RTL render `<TopTrendsMini trends={mockTop5} />`
2. 断言 5 个 trend, 名次 1-5
3. 断言每个含名次 + 标签 + 强度条
4. 断言按 strength DESC

**通过条件**:
- 5 项可见
- 强度条宽度与 strength 成正比

---

### T12-004 [集成] 首页 SSR 3 入口 + 横滑 + Top 5 一次 fetch

**目标**: 验证 RSC 并行 fetch, 不串行 await

**步骤**:
1. 在 `/api/launches`, `/api/trends` 加 mock 延迟 1s
2. 访问 `/`
3. 浏览器 DevTools Network 面板: 断言 3 个 API 并行触发, 总耗时 < 1.5s (而非 3s)
4. 断言首屏 HTML 含 3 张入口卡 HTML (而非空 div + JS 注水)

**通过条件**:
- RSC 流式渲染
- 3 API 并行 (chrome waterfall: 同时发起)

---

### T12-005 [集成] HomeEntryCard a11y role=link + 键盘可达

**目标**: 卡片可键盘 Tab + Enter 触发跳转

**步骤**:
1. 渲染首页
2. 断言 3 张卡片 `role="link"` 或 `<a>`
3. Tab 键依次聚焦 3 张卡 (focus ring 可见)
4. Enter 键触发跳转

**通过条件**:
- 3 张卡均可键盘访问
- 焦点环 CSS 明显

**盲点参考**: BL-19 (焦点环样式)

---

### T12-006 [视觉] LCP < 1.5s + 移动端单列

**目标**: 首页性能

**步骤**:
1. Lighthouse Mobile 跑 `/`
2. 断言 LCP < 1.5s
3. 桌面截图 3 入口卡并排
4. 手机截图 3 入口卡单列 + 横滑保留

**通过条件**:
- LCP 元素是首张入口卡
- 移动端不破布局

---

### T12-007 [视觉] Hero 文案 + NewsletterForm (T07) 嵌入

**目标**: Hero "今天 AI 圈在发生什么" + 下方表单

**步骤**:
1. 访问 `/`
2. 断言 Hero 标题 = "今天 AI 圈在发生什么" (zh) / "What's happening in AI today" (en)
3. 断言 Hero 下方有 `<NewsletterForm source="home_hero" defaultFrequency="daily" />`
4. 提交测试 email → 断言 toast 显示

**通过条件**:
- 文案正确
- 表单可提交

---

## 5. T13 — 启动筛选面板 (6 cases)

### T13-001 [单元] 3 组筛选 UI 渲染

**目标**: 侧边栏含 来源多选 / 事件类型 / 时间范围

**步骤**:
1. RTL render `<LaunchFilterPanel />`
2. 断言 3 个 group: "来源" / "事件类型" / "时间范围"
3. 断言 source 6 个 checkbox: PH/HN/X/GitHub/小红书/RSS
4. 断言 event_type 6 个 checkbox (与 §1.1 枚举一致)
5. 断言 range 5 个 radio: 24h/7d/30d/90d/all

**通过条件**:
- 全部 checkbox + radio 渲染
- 默认值: 全部勾选 source / 全部勾选 type / range=24h

**盲点参考**: BL-20 (T13 默认 range 冲突)

---

### T13-002 [单元] URL query 同步双向

**目标**: 勾选 / 取消勾选 → URL 更新; 复制 URL 打开 → 状态恢复

**步骤**:
1. 勾选 GitHub + X → URL 变 `?source=github&source=x&event_type=...&range=24h`
2. 复制 URL 到新 tab → 断言初始勾选状态一致
3. 浏览器后退 → 断言状态回到上一步

**通过条件**:
- 双向同步
- 后退按钮工作

**盲点参考**: BL-21 (URL 格式)

---

### T13-003 [单元] 移动端折叠为顶部抽屉

**目标**: viewport < 768px 时, 面板变抽屉

**步骤**:
1. mock window.innerWidth=375
2. render 组件, 断言默认折叠 (无 filter UI 可见)
3. 点击 "筛选" 按钮 → 断言抽屉打开
4. 关闭抽屉 → 断言回到折叠

**通过条件**:
- 桌面/移动端两种 UI
- 抽屉内仍含 3 组

---

### T13-004 [集成] 筛选结果正确反映 API

**目标**: URL 变化触发 API 重 fetch

**步骤**:
1. 访问 `/launches?source=github&range=7d`
2. 断言 API 被调用, query 参数匹配
3. 取消 GitHub → 断言 API 重 fetch (新 query 不含 source)
4. 改 range 到 30d → 断言 API 重 fetch

**通过条件**:
- 每次 URL 变化触发新 fetch
- 旧请求被 cancel (避免竞态)

---

### T13-005 [集成] 与 T10 时间轴联动

**目标**: 筛选面板与 LaunchTimeline 共享状态

**步骤**:
1. 访问 `/launches?source=github`
2. 断言: 时间轴列表只显示 GitHub 来源
3. 顶部"来源" 标签徽章显示 "GitHub"
4. 点其他来源 → 时间轴实时更新

**通过条件**:
- 状态共享 (URL 是 single source of truth)
- UI 同步无延迟

---

### T13-006 [视觉] 桌面侧边 / 移动抽屉截图

**目标**: 两种 layout 视觉

**步骤**:
1. 桌面 1440 截图: 左侧 240px 侧边栏
2. 手机 375 截图: 折叠 + 抽屉展开两态

**通过条件**:
- 桌面不与时间轴内容重叠
- 移动端抽屉遮罩可点击关闭

---

## 6. T14 — /launches 详情抽屉 (5 cases)

### T14-001 [单元] Radix Dialog 行为

**目标**: 抽屉滑出/关闭/ESC 行为

**步骤**:
1. RTL render `<LaunchDetailDrawer open={true} launch={mock} />`
2. 断言抽屉在 DOM, 标题/正文/置信度/源链接可见
3. 模拟 ESC 键 → 断言 onOpenChange(false) 被调用
4. 模拟点击遮罩 → 断言 onOpenChange(false) 被调用

**通过条件**:
- ESC 工作
- 遮罩可点

---

### T14-002 [单元] raw_data JSON 美化展示

**目标**: service_role 看 raw_data, anon 看 null

**步骤**:
1. mock `usePlan()` 返回 service_role (mock admin token)
2. 断言 raw_data 区域含可折叠的 `<details>` 含语法高亮
3. mock anon 用户 → 断言 raw_data=null, 区域显示 "— (登录可看更多)"

**通过条件**:
- 两种角色 UI 区分
- JSON 高亮 (或至少格式化)

**盲点参考**: BL-22 (anon raw_data 处理)

---

### T14-003 [集成] curl /api/launches/:id 验证

**目标**: API 返回完整字段

**步骤**:
```bash
LAUNCH_ID=$(curl -s ".../api/launches?range=all&page_size=1" | jq -r '.data.items[0].id')
curl -s ".../api/launches/$LAUNCH_ID" -H "apikey: <anon>" | \
  jq '.data | {id, title, body, engagement, confidence, raw_data}'
```
1. 断言 code=0
2. 断言 raw_data=null (anon)
3. 切换 service_role header → 断言 raw_data 有内容

**通过条件**:
- anon 看不到 raw_data
- service_role 看到

---

### T14-004 [集成] 详情抽屉与 T10 卡片联动

**目标**: 点 LaunchCard → 抽屉打开

**步骤**:
1. /launches 页面, 点任一 LaunchCard
2. 断言抽屉滑出 (CSS transition 200-300ms)
3. 抽屉内容 = 该卡对应 launch
4. 关闭抽屉 → 焦点返回卡片 (a11y)

**通过条件**:
- 联动正确
- 焦点管理 (a11y)

**盲点参考**: 焦点返回触发元素

---

### T14-005 [a11y] focus trap + 焦点返回

**目标**: Radix Dialog 默认行为

**步骤**:
1. 打开抽屉, Tab 键循环焦点在抽屉内
2. 关闭抽屉, 断言 document.activeElement 回到触发卡
3. 屏幕阅读器测试 (axe-core / NVDA): 抽屉有 role="dialog" + aria-modal

**通过条件**:
- 焦点 trap 正确
- aria 属性完整

---

## 7. T15 — Discover 排序扩展 (4 cases)

### T15-001 [单元] 排序下拉新增 3 选项

**目标**: "今天/本周/本月" 3 个选项

**步骤**:
1. RTL render `<SortDropdown />` (或 `<select>`)
2. 断言选项: 默认 / 最新 / 热门 / 今天 / 本周 / 本月
3. 选 "今天" → onChange 回调 value="today"
4. 选 "本周" → value="this_week"
5. 选 "本月" → value="this_month"

**通过条件**:
- 3 选项可见可选

**盲点参考**: BL-23 (first_seen vs event_at 取哪个)

---

### T15-002 [集成] 排序参数传递 + 旧 ?sort=newest 重定向

**目标**: 新参数映射 + 旧 URL 302

**步骤**:
1. 选 "今天" → URL 变 `?sort=today`
2. curl `/api/products?sort=today` → 断言按 launch_events.event_at DESC 排
3. 访问 `/discover?sort=newest` → 断言 302 → `/discover?sort=today`

**通过条件**:
- 新参数工作
- 旧 URL 重定向

**盲点参考**: BL-24 (旧参数兼容)

---

### T15-003 [集成] 产品列表按新排序正确

**目标**: 排序结果合理

**步骤**:
1. mock /api/products 返回 40 产品, 每个有 first_seen
2. sort=today → 断言: 关联了 launch_events.event_at 在 24h 内的产品在前
3. sort=this_month → 断言: 30d 内的产品在前

**通过条件**:
- 排序逻辑正确
- 边缘: 无 launch_events 的产品放最后

**盲点参考**: BL-23 (无 launch 关联产品的 fallback)

---

### T15-004 [回归] watchlist/compare/dashboard 不受影响

**目标**: 旧功能 100% 保留

**步骤**:
1. 添加 3 个产品到 watchlist → 断言保存
2. 比较 2 个产品 → 断言 compare 页正常
3. 访问 /dashboard → 断言图表渲染
4. 切换 sort=today/this_month → 断言 watchlist/compare/dashboard 不刷新

**通过条件**:
- 4 个旧功能全部正常
- 排序切换不触发旧数据重 fetch

---

## 8. T16 — Plan Switcher Mock (6 cases)

### T16-001 [单元] /admin/plan-switcher 4 radio

**目标**: 4 个 plan radio + 当前 plan 高亮

**步骤**:
1. mock 当前 user plan=pro
2. 访问 `/admin/plan-switcher`
3. 断言 4 个 radio: free/starter/pro/enterprise
4. 断言 "pro" radio 选中 + 高亮
5. 选 "enterprise" → 断言可点 "切换" 按钮

**通过条件**:
- 4 radio 渲染
- 当前 plan 高亮

---

### T16-002 [单元] usePlan() hook 暴露 4 字段

**目标**: usePlan 暴露 { plan, isPro, isEnterprise, refresh }

**步骤**:
1. RTL 在组件内调用 `usePlan()`
2. 断言返回 { plan, isPro, isEnterprise, refresh }
3. mock plan='pro' → isPro=true, isEnterprise=false
4. mock plan='enterprise' → isPro=true (含 pro), isEnterprise=true
5. mock plan='free' → isPro=false, isEnterprise=false
6. 调 refresh() → 断言 SWR 重新 fetch

**通过条件**:
- 4 字段齐全
- isPro 包含 pro + enterprise
- refresh 触发 re-fetch

**盲点参考**: BL-26 (SWR 60s 缓存 vs 实时性)

---

### T16-003 [集成] POST /api/admin/plan-switch 鉴权

**目标**: service_role only, anon 返回 4004

**步骤**:
```bash
# 1. anon 调用 (无 admin token)
curl -X POST "https://<vercel>/api/admin/plan-switch" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"00000000-0000-0000-0000-000000000001","plan":"pro"}'
# 断言 code=4004

# 2. service_role 调用
curl -X POST "..." -H "Authorization: Bearer <service_role_key>" \
  -d '{"user_id":"...","plan":"pro"}'
# 断言 code=0, data.new_plan=pro
```

**通过条件**:
- anon 4004
- service_role 200
- DB 中 user_profiles.plan 已更新

**盲点参考**: BL-25 (mock admin token 机制)

---

### T16-004 [集成] plan 切换 → /subscription/success 跳转

**目标**: 切换后前端跳转成功页

**步骤**:
1. 在 plan-switcher 选 "pro" + 提交
2. 断言 POST /api/admin/plan-switch 返回 200
3. 断言前端 router.push('/subscription/success?plan=pro')
4. 断言成功页 T18 渲染

**通过条件**:
- 跳转 URL 含 `?plan=pro`
- 成功页加载无 404

---

### T16-005 [安全] service_role key 不泄露到前端

**目标**: 前端 bundle 不含 service_role

**步骤**:
1. `pnpm build`
2. `grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static/`
3. 断言: 0 匹配 (前端 bundle 不含)
4. `grep -r "service_role" frontend/src/` (源码) → 断言: 仅出现在 API route (服务端), 不出现在 page/component (客户端)

**通过条件**:
- 前端 bundle 0 匹配
- 源码分层清晰

**盲点参考**: BL-25 (env 注入位置)

---

### T16-006 [集成] usePlan SWR 60s 缓存

**目标**: 60s 内不重复 fetch

**步骤**:
1. 渲染 usePlan 组件
2. 记录 /api/admin/plan fetch 次数 (mock 计数 1)
3. 60s 内重渲染 → 断言 fetch 次数仍为 1
4. 等 65s → 断言 fetch 次数 = 2
5. 调 refresh() → 立即 fetch (绕过缓存)

**通过条件**:
- 60s 缓存生效
- refresh 强制刷新

---

## 9. T17 — PaywallGate 组件 (5 cases)

### T17-001 [单元] props.requires + plan 匹配逻辑

**目标**: plan 满足时不显示弹窗, 不满足时显示

**步骤**:
1. mock usePlan() 返回 plan='free'
2. RTL render `<PaywallGate requires="pro"><div>Pro 内容</div></PaywallGate>`
3. 断言: children**不渲染** 或 显示 + 弹窗
4. 断言 fallback 元素可见
5. mock plan='pro' → 断言 children 渲染, 弹窗不显示

**通过条件**:
- 逻辑正确
- fallback 可自定义

**盲点参考**: BL-27 (children 是否渲染 / SEO)

---

### T17-002 [单元] 弹窗 (AlertDialog) 内容

**目标**: 弹窗含 3 档对比 + 30 天试用 CTA

**步骤**:
1. render PaywallGate + 弹窗打开
2. 断言: 弹窗标题 "升级解锁更多" (中) / "Upgrade to unlock" (英)
3. 断言: 3 列 Starter/Pro/Enterprise 价格
4. 断言: "30 天免费试用" 按钮 (mock, 不跳支付)
5. 断言: "稍后再说" 关闭按钮

**通过条件**:
- 3 档对比齐全
- CTA 是 mock (不调 Stripe)

---

### T17-003 [集成] /trends 趋势曲线详情包裹 PaywallGate

**目标**: 实际使用位点验证

**步骤**:
1. mock usePlan() = free
2. 访问 /trends/<id> (含趋势曲线详情模块)
3. 断言: 详情区域显示 PaywallGate 弹窗
4. 关闭弹窗 → 断言曲线图仍可见 (软墙, 不强制)
5. mock plan=pro → 断言弹窗不出现, 曲线直接显示

**通过条件**:
- 弹窗触发条件正确
- 可关闭

**盲点参考**: ADR-08 软墙策略

---

### T17-004 [a11y] AlertDialog 焦点管理

**目标**: Radix AlertDialog 默认 a11y

**步骤**:
1. 弹窗打开, Tab 键循环焦点在弹窗内
2. ESC 关闭弹窗
3. 断言 aria-modal=true
4. 断言: 屏幕阅读器读到 dialog role

**通过条件**:
- 焦点 trap
- ARIA 完整

---

### T17-005 [集成] 弹窗 → /pricing 跳转路径

**目标**: "30 天免费试用" CTA 跳到 pricing

**步骤**:
1. 弹窗打开, 点 "30 天免费试用"
2. 断言: router.push('/pricing')
3. /pricing 页 Pro 卡片 (T06 产出) 显示 "推荐" 角标

**通过条件**:
- 跳转流畅
- /pricing 正常

---

## 10. T18 — /subscription/success 页 (3 cases)

### T18-001 [单元] 路由参数 + 显示内容

**目标**: `/subscription/success?plan=pro` 正确显示

**步骤**:
1. 访问 `/subscription/success?plan=pro`
2. 断言: 标题 "欢迎升级到 Pro" (中) / "Welcome to Pro" (英)
3. 断言: 当前 plan = "Pro"
4. 断言: 有效期 "30 天" (mock)
5. 断言: 3 个引导链接: 探索趋势方向 / 订阅 Newsletter / 返回首页

**通过条件**:
- 路由参数正确解析
- mock 标识明显 ("Phase E: 模拟成功" 横幅)

---

### T18-002 [集成] usePlan() 实时反映新 plan

**目标**: 跳转后 plan 已是新值

**步骤**:
1. mock user 切换前 plan=free
2. 触发 plan-switch → 跳转 success 页
3. 在 success 页调用 usePlan() → 断言 plan=pro (而非 free)
4. 若用 SWR 60s 缓存 → 断言 success 页**强制 refresh** (避免显示旧 plan)

**通过条件**:
- plan 同步
- success 页绕过 SWR 缓存

**盲点参考**: BL-26 (SWR 60s 缓存 vs 实时性, success 页需 refresh)

---

### T18-003 [视觉] i18n + 桌面/移动 截图

**目标**: 双语 + 响应式

**步骤**:
1. 桌面截图: 中央卡片 + 3 引导按钮
2. 手机截图: 卡片全宽, 按钮纵向堆叠
3. /en 与 /zh 截图

**通过条件**:
- 三态视觉一致

---

## 11. T19 — SEO + Sitemap (4 cases)

### T19-001 [单元] 3 页 metadata export

**目标**: 3 个新页面有完整 metadata

**步骤**:
1. 访问 /, /launches, /trends
2. 断言每个 page.tsx 有 `export const metadata: Metadata = { ... }`
3. 断言 metadata 含: title / description / openGraph (image) / alternates (canonical)

**通过条件**:
- 3 页 metadata 完整
- description 长度 150-160 字符

---

### T19-002 [集成] sitemap.xml 包含 4 核心页

**目标**: `frontend/src/app/sitemap.ts` 输出含 4 URL

**步骤**:
```bash
curl -s https://<vercel>/sitemap.xml | xmllint --xpath "//*[local-name()='loc']/text()" -
```
1. 断言含 /, /launches, /trends, /pricing 4 URL
2. 断言 lastmod 字段非空 (sitemap.ts 取 build 时间)

**通过条件**:
- 4 URL 全列
- XML 格式合法

---

### T19-003 [集成] robots.txt 允许爬取

**目标**: `frontend/src/app/robots.ts` 不误封

**步骤**:
```bash
curl -s https://<vercel>/robots.txt
```
1. 断言含 `User-agent: *` + `Allow: /`
2. 断言含 `Sitemap: https://.../sitemap.xml`
3. 断言: 未误封 `/api/*` (公开 API 应允许)

**通过条件**:
- 允许爬取
- sitemap 指向正确

---

### T19-004 [集成] JSON-LD 结构化数据

**目标**: 3 入口卡用 ItemList, 趋势页用 Article

**步骤**:
1. 访问 / → 断言 HTML 含 `<script type="application/ld+json">` JSON-LD
2. 解析 JSON, 断言 `@type: "ItemList"`
3. 断言 itemListElement 含 3 项 (L1/L2/L3)
4. 访问 /trends → 断言 JSON-LD `@type: "Article"`
5. 用 Google Rich Results Test (手动) 验证无错误

**通过条件**:
- JSON-LD 有效
- 3 + Article 类型匹配

**盲点参考**: BL-29 (ItemList listItem 字段完整性)

---

## 12. T20 — W2 端到端 QA (5 cases)

### T20-001 [E2E] 4 页面 Lighthouse 性能 ≥ 85

**目标**: 全站性能门槛

**步骤**:
1. Lighthouse CI 跑 /, /launches, /trends, /pricing
2. 断言 4 页 Performance ≥ 85
3. 断言 4 页 SEO ≥ 95
4. 断言 4 页 Accessibility ≥ 90

**通过条件**:
- 性能门槛全过
- 输出 4 份 Lighthouse JSON 报告

**盲点参考**: BL-30 (词云 d3 影响 /trends LCP)

---

### T20-002 [E2E] i18n 切换 4 页无硬编码

**目标**: 中英切换

**步骤**:
1. 4 页各开 /en 与 /zh
2. 断言: 关键术语 (新发布 / 趋势方向 / 升级 / 订阅) 中英对照
3. 断言: 数字 (日期 / 价格 / 计数) 国际化
4. 断言: 无英文字符串硬编码漏翻 (grep 关键短语)

**通过条件**:
- 4 页 × 2 语言 = 8 视图全过
- 漏翻清单 0 条

---

### T20-003 [E2E] 旧功能回归 100% 保留

**目标**: 现有功能不破

**步骤** (Playwright E2E):
```javascript
test('regression: watchlist + compare + dashboard + discover', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type=email]', 'regress@test.com')
  await page.fill('input[type=password]', 'test1234')
  await page.click('button:has-text("Sign in")')

  // 1. watchlist
  await page.goto('/discover')
  await page.click('[data-testid="add-to-watchlist"]')
  await page.goto('/watchlist')
  expect(await page.locator('[data-testid="watchlist-item"]').count()).toBeGreaterThan(0)

  // 2. compare
  await page.goto('/discover')
  await page.click('[data-testid="add-to-compare"]:nth(0)')
  await page.click('[data-testid="add-to-compare"]:nth(1)')
  await page.goto('/compare')
  expect(await page.locator('[data-testid="compare-column"]').count()).toBe(2)

  // 3. dashboard
  await page.goto('/dashboard')
  expect(await page.locator('[data-testid="dashboard-chart"]').isVisible()).toBe(true)

  // 4. discover 旧排序
  await page.goto('/discover?sort=newest')
  expect(page.url()).toContain('sort=today')  // 302 redirect
})
```

**通过条件**:
- 4 个旧功能 E2E 全过
- 旧 URL 重定向生效

---

### T20-004 [E2E] 4 页面 3 断点截图存档

**目标**: 视觉回归基线

**步骤**:
1. Playwright 跑 4 页 × 3 断点 (1440/768/375) × 2 语言 = 24 截图
2. 存档到 `docs/screenshots/phase-e-w2/`
3. 视觉对比工具 (Percy / Chromatic) 标记 diff

**通过条件**:
- 24 截图齐全
- 无意外 diff (除 W2 改动)

---

### T20-005 [E2E] 12 端点 smoke test

**目标**: W1+W2 全部 API 端点 2xx

**步骤**:
```bash
ENDPOINTS=(
  "GET /api/launches?range=24h"
  "GET /api/launches?range=7d"
  "GET /api/launches?range=all&page=1"
  "GET /api/launches/{id}"
  "GET /api/trends"
  "GET /api/trends?status=emerging"
  "GET /api/trends/{id}"
  "GET /api/categories"
  "GET /api/products/{id}/signals"
  "GET /api/pricing?lang=zh&cycle=yearly"
  "POST /api/newsletter/subscribe -d {email,frequency}"
  "GET /api/newsletter/confirm?token=xxx"
)
for ep in "${ENDPOINTS[@]}"; do
  curl -s -o /dev/null -w "%{http_code} $ep\n" ...
done
```
1. 断言: 12 端点全部 200/201
2. 断言: 错误码测试 (4000/4001/4002/4003/4004) 正确返回

**通过条件**:
- smoke test 全过
- 错误码覆盖

---

## 13. 盲点清单 (W2 预研发现, 类似 W1 的 BL-1~BL-10)

> 与 W1 评审方法相同, 在 W2 实施前揭示验收标准中**可测但未明**的环节

| # | 盲点 | 关联任务 | 建议澄清 |
|---|------|----------|----------|
| **BL-11** | T10 时间范围按钮 "今天/本周/本月/全部" 4 个, 后端 API 接受 `range=24h\|7d\|30d\|90d\|all` 5 个枚举 | T10 | 前端做 today→24h / this_week→7d / this_month→30d / all→all 映射; 任务仅 4 按钮但 API 多一个 90d 不可达 |
| **BL-12** | T10 空态触发条件未明 | T10 | 建议: `range=24h` + 0 条 + 当前时间 0-6 点 视为 "今日尚无", 显示空态; 其他 range 不显示空态, 改显示 "暂无数据" |
| **BL-13** | T10 confidence 字段显示格式 (78% / 0.78 / 高/中/低) 未明 | T10 | 建议: 0.8+ 显示 "高" 绿; 0.5-0.8 "中" 橙; <0.5 "低" 灰 |
| **BL-14** | T10 LCP<2s vs T12 LCP<1.5s 一致性 | T10/T12 | /launches 因列表较长, LCP 应是首张卡片; 首页是入口卡, 略快合理 |
| **BL-15** | T11 `react-d3-cloud@^1.0.0` peer dep 与 Next.js 14 兼容 | T11 | 建议: pnpm install 后跑 build, 若报 peer dep 警告需 overrides |
| **BL-16** | T11 任务说 "expired=灰" 但又说 "不在词云显示" | T11 | 建议: 词云仅渲染 emerging/peaking/cooling (4 status 中 3 个); expired 走"过期信号" 折叠区, 不入词云 |
| **BL-17** | T11 evidence 摘要的具体格式未明 | T11 | 建议: `{products: ["..."], metrics: {weekly_growth: 0.18, monthly_launches: 12}}` 渲染为 "12 launches/mo +18% wow" |
| **BL-18** | T12 横滑 10 条 vs API page_size=20 | T12 | 建议: API 端传 `page_size=10`, 避免前端截断; 词云也用 page_size=5 |
| **BL-19** | T12 卡片键盘焦点环 CSS 未明 | T12 | 建议: 默认 Tailwind `focus:ring-2 focus:ring-offset-2` |
| **BL-20** | T13 默认 range=24h 与 T10 任务说"今天/本周/本月/全部" 4 按钮矛盾 | T13 | 与 BL-11 同一议题, 默认值建议统一为 24h |
| **BL-21** | T13 多选 URL 格式 `?source=github&source=x` vs `?source=github,x` | T13 | 建议: 用重复 key (Next.js searchParams 支持), 与 API 单值参数语义清晰 |
| **BL-22** | T14 raw_data 对 anon 返回 null, 抽屉 UI 处理 | T14 | 建议: anon 显示 "— (登录查看更多)" 占位, 不显示折叠区 |
| **BL-23** | T15 排序 "first_seen (旧) 或 event_at 最近时间" 取哪个 | T15 | 建议: 主排序用 event_at DESC; 若产品无 launch_events, fallback first_seen; UI 加 "含新发布" tooltip |
| **BL-24** | T15 旧 `?sort=newest` 重定向 `?sort=today`, 但 API 不接受 sort | T15 | 建议: 前端处理, redirect 后调 `/api/products?sort=today` 走新逻辑; API 不变 |
| **BL-25** | T16 service_role 鉴权 + admin token 写 env, anon 用户如何调 | T16 | 建议: 前端用 mock 登录, 写 cookie 表示 admin role; API route 读 cookie + env 校验, 避免硬编码 service_role |
| **BL-26** | T16 usePlan SWR 60s 缓存与 /subscription/success 即时性矛盾 | T16/T18 | 建议: success 页用 `mutate()` 强制刷新, 不等 60s |
| **BL-27** | T17 软墙 children 仍渲染 (SEO 友好), 但内容暴露 | T17 | 建议: 软墙策略不变 (Phase E mock), Phase F+ 接真付费时加 SSR 截断 |
| **BL-28** | T18 成功页 mock 标识不明显 | T18 | 建议: 顶部黄色 banner "Phase E: 模拟成功, 未真实扣费", 与 mock_email_sent 呼应 |
| **BL-29** | T19 JSON-LD ItemList listItem 需 name+url | T19 | 建议: 3 入口卡 listItem: {name, url: '/discover\|/launches\|/trends', description} |
| **BL-30** | T20 /trends 含词云 d3 约 +50KB, Lighthouse 可能 < 85 | T20 | 建议: 词云组件 next/dynamic + 拆 chunk; 若仍不达标, 词云降级为静态标签云 |

---

## 14. 回归检查清单 (W1 + W2 整体)

> W2 启动前先回归 W1, 避免新任务破坏已交付功能

### 14.1 数据库层 (W1 T01-T03)

- [ ] 5 张新表 (launch_events / trend_signals / categories / product_signals / newsletter_subscriptions) 全部存在
- [ ] 002 + 003 migration 重复执行无报错 (幂等)
- [ ] RLS: anon SELECT 成功, anon INSERT 被拒, service_role 全通
- [ ] 12 索引 (`\di`) 全部存在
- [ ] 触发器 `trg_launch_events_notify_push` 存在
- [ ] 视图 `v_launches_recent` / `v_trends_active` 可查
- [ ] partial UNIQUE index `idx_newsletter_email_active` 存在 (P0-1 修复)
- [ ] 200 条 seed 数据完整: 40 products + 120 events + 40 signals + 40 categories (13 L1 + 27 L2) + 25 product_signals
- [ ] 63 旧 product 数据完整 (回归)

### 14.2 API 层 (W1 T05/T09, W2 T10-T20)

- [ ] 12 端点 smoke test 全 200
- [ ] Newsletter: 4000/4001/4002/4006 错误码覆盖
- [ ] Newsletter confirm: 4000/4003 (P0-2 已修复)
- [ ] 重复 email 退订后重新订阅, 部分 UNIQUE 索引允许 (P0-1 修复验证)
- [ ] Launches /api/launches?range=24h/7d/30d/90d/all 全部 200
- [ ] Trends 默认排除 expired
- [ ] Categories 含 13 L1 + 27 L2
- [ ] Admin plan-switch: anon 4004, service_role 200

### 14.3 前端层 (W1 T06-T07, W2 T10-T19)

- [ ] /pricing 3 档卡片 + 月年付 + 推荐角标
- [ ] NewsletterForm 在 3 位点 (首页 Hero / /pricing 顶部 / /launches 空态) 渲染
- [ ] NewsletterForm 提交后 201 + toast
- [ ] /launches ≥ 120 条 + 排序 + 筛选 + 分页 + 抽屉
- [ ] /trends 词云 + 信号卡 + Top 20 + i18n
- [ ] 首页 3 入口卡 + 横滑 + Top 5 + NewsletterForm
- [ ] LaunchFilterPanel 桌面侧边 / 移动抽屉
- [ ] LaunchDetailDrawer Radix Dialog + 焦点管理
- [ ] Discover 排序 3 新选项 + 旧 ?sort=newest 302
- [ ] /admin/plan-switcher 4 radio + usePlan
- [ ] PaywallGate 弹窗 + 软墙
- [ ] /subscription/success i18n + mock banner
- [ ] sitemap.xml 4 URL + robots.txt Allow

### 14.4 文档 + 部署 (W1 T04/T08)

- [ ] README v9.1 3 层架构开篇
- [ ] 3 份 .env.example 完整
- [ ] docs/deploy.md 含 pg_net 开启步骤
- [ ] pnpm build / typecheck / lint 全绿

### 14.5 性能 + 视觉 (W2 T20)

- [ ] 4 页 Lighthouse Performance ≥ 85
- [ ] 4 页 Lighthouse SEO ≥ 95
- [ ] 4 页 i18n 切换无硬编码
- [ ] 3 断点截图存档 (12 页 × 2 语言 = 24 图)

### 14.6 回归 (旧功能)

- [ ] /discover 列表 + 筛选
- [ ] /watchlist 添加/删除
- [ ] /compare 2-N 个产品对比
- [ ] /dashboard 图表 + 摘要
- [ ] /products/[slug] 详情页
- [ ] /login / /signup Supabase Auth
- [ ] crawler 4 旧源 (producthunt/hackernews/github) 不破

---

## 15. 执行计划 (W2 节奏)

| 周日 | 任务 | 测试动作 |
|------|------|----------|
| W2-D1 (6/4) | T10 + T12 | T10 cases + T12 cases 单元跑通 |
| W2-D2 (6/5) | T11 + T16 | T11 cases + T16 cases |
| W2-D3 (6/6) | T13 + T14 + T17 | T13/T14/T17 cases + a11y |
| W2-D4 (6/7) | T15 + T18 + T19 | T15/T18/T19 cases + 回归 |
| W2-D5 (6/8) | T20 E2E | 全链路 5 cases + 截图存档 |

**报告输出**:
- W2 测试执行报告: `docs/qa-phase-e-w2.md` (T20 任务第 1 条)
- W2 架构评审 (P0/P1/P2 增量): `docs/phase-e-architecture-review-w2.md` (可选, 仅当发现新 P0)

---

## 16. 待 W2 启动时的微调项

> 此预研稿基于现有 PRD/任务分解/契约, W2 实施时**寇豆码-1** 实际产出可能与预期有差异, 以下为预判的微调点

1. **组件命名**: 任务说 `LaunchCard.tsx`, 实际可能命名 `LaunchItem.tsx` 或 `EventCard.tsx` — 测试导入路径需同步
2. **API 端点分页**: 任务说 page_size=20, API §1.1 默认 20, 一致; 但前端 T12 横滑要 10 条, 需传 page_size=10
3. **JSON-LD 库**: 任务未指定, 建议用 `next-seo` 或手写 `<script type="application/ld+json">`, 测试时按实际选型调整
4. **i18n 库**: 假设延续 `next-intl` 或 `next-i18next`, 测试时按实际库调整 `messages/en.json` 路径
5. **SWR 版本**: usePlan 用 SWR, 需确认 swr 版本 (v2 API 与 v1 不同)
6. **Radix 版本**: Dialog / AlertDialog 在 `@radix-ui/react-dialog` v1 vs v2 API 差异
7. **Playwright vs Cypress**: 现有项目若用 Playwright, T20 E2E 走 Playwright; 否则 Cypress

---

## 17. 总结

- **总测试数**: 62 (T10-T20) + 回归 30+ = **~92 cases**
- **核心盲点**: 30 个 (BL-11~BL-30), 重点 BL-22 (raw_data anon) / BL-26 (SWR 缓存) / BL-30 (词云性能)
- **关键集成点**: T20 E2E 是 W2 验收总闸, 4 页性能 + 3 断点 + 12 端点 smoke + 4 旧功能回归
- **风险**:
  - R1 (pg_net W1 已发, W2 验证) → T20 间接验证
  - R3 (X mock 数据过期) → T11 trends 页 + T12 首页
  - R4 (d3 词云 SSR 冲突) → T11-002 必须测
  - R9 (Discover URL 旧参数) → T15-002 必测

**W1 已闭环, W2 预研就绪。等 W2 启动后, 基于实际产出版本(1-2 天微调)即可立即执行。**
