# W2 集成 PRD — AI Radar

| 字段 | 值 |
| --- | --- |
| 版本 | v0.1（W2 集成） |
| 状态 | Draft — 等待架构师评审 |
| 负责人 | 许清楚（Xu，Product Manager） |
| 工作目录 | `D:\wordkbuddywork\2026-05-29-00-16-56\` |
| 上游 | W1 11/11 API smoke tests 已通过；W2 prep 组件就绪 |
| 下游 | 架构师（Task 拆分）、前端（实现）、QA（验收） |

---

## 1. 项目信息

- **Language**: 中文 PRD，技术名词保留英文（ADR、Server Component、PaywallGate、PlanFeature、API envelope 等）
- **Programming Language**: Next.js 14.2 App Router + React 18 + TypeScript + Tailwind + Radix UI + lucide-react（沿用 W1 栈，**不引入** 第三方 carousel / chart 库）
- **Project Name**: `ai-radar-w2-integration`
- **原始需求复述**: 将 W2 准备好的 `LayerEntryCard` / `LayerEntrySection` / `PaywallGate` / `usePlan` / `useLaunches` / `useTrends` / `useCategories` 接入到现有页面，补齐 6 个页面（home / launches 新建 / trends / discover / watchlist / compare）的数据流、付费墙、Newsletter 订阅入口，并把 HuggingFace 与 arXiv 两个新数据源排入 Crawler 计划。
- **约束**:
  - i18n 双语（en + zh），复用 `frontend/messages/{en,zh}.json` 中已存在的 `home.layers.*` / `paywall.*` / `newsletter.*` 键
  - Server Component 优先（ADR-07），客户端 hook 仅在需要交互或 localStorage 时使用
  - 软付费墙（ADR-08）：首屏 HTML 同构，hydration 后再 swap
  - 错误码 4000–5002 沿用 `phase-e-api-contracts.md` §6

---

## 2. 产品定义

### 2.1 Product Goals（3 个正交目标）

1. **建立 3 层信息架构的认知价值** — 让访客在 3 秒内理解 L1（成熟分类）/ L2（每日新品）/ L3（新兴趋势）的差异，并通过 L1→/discover、L2→/launches、L3→/trends 三条主路径分别深入。
2. **打通「数据接入中…」占位到真实数据的过渡** — W1 期间 `LAYER_PLACEHOLDER = { count: 0, items: [] }` 让首页长期显示"数据接入中…/Data syncing…"，W2 必须把 W1 API 接上，让占位消失。
3. **形成首批付费转化漏斗** — 通过 `PaywallGate` 把 watchlist / comparison / newsletter.daily / trends.advanced 包装为可触达的升级触点，配合 Footer 的 Newsletter 订阅，验证从免费到入门版（$5/mo）的最小漏斗。

### 2.2 User Stories（4 个核心场景）

| # | Persona | Scenario | Expected Outcome |
| --- | --- | --- | --- |
| US-1 | **Anna — 独立 AI 创业者（free）** | 周末想找 AI 产品机会，进入首页看到 L1/L2/L3 三个入口卡 | 点击 L2 卡后跳转 `/launches?range=24h` 看到过去 24h 新品；点 L3 卡跳转 `/trends?range=7d` 看到 7d 趋势折线 |
| US-2 | **Brian — 投资人（free）** | 想持续追踪某细分赛道，访问 `/discover?layer=categories` 后尝试点 5 个产品加关注 | 第 5 个点击触发 `PaywallGate(feature="watchlist")` 升级弹窗，提示 starter $5/mo |
| US-3 | **Cathy — 增长负责人（starter）** | 在 `/launches` 浏览后想对比 3 个产品，访问 `/compare` | `PaywallGate` 判定 starter 已包含 `comparison` 特性，直接渲染对比表（无锁占位） |
| US-4 | **David — 沉默用户（free）** | 浏览首页 Footer 时看到 Newsletter 订阅框，输入邮箱并选 weekly | 提交后收到确认邮件；点击确认链接后页面显示"已订阅 / Subscribed"成功态 |

---

## 3. 技术规范

### 3.1 页面变更清单（Page Change List）

| 页面 | 当前状态 | W2 目标 | 优先级 |
| --- | --- | --- | --- |
| `/home`（dashboard） | 调 `/api/recommendations/daily` + `/api/products?sort=recent&limit=6`，**未使用** `LayerEntrySection` | Server Component 渲染 `LayerEntrySection`，三个 layer 卡片数据由 `useLaunches/useTrends/useCategories` 在 Server 端 prefetch 后注入 props；Footer 嵌入 `NewsletterForm` | **P0** |
| `/launches`（**新建**） | 路由不存在，L2 卡 CTA 跳 404 | Server Component，读取 `?range=24h\|7d\|30d` 与 `?category=xxx`，调 `/api/launches`；每条 item 卡片用 Server 渲染，支持点击进 `/products/[id]` | **P0** |
| `/trends` | 用文件内 mock `generateLineChartData`，**未调** `/api/trends` | Server Component，调 `/api/trends?range=7d\|30d\|90d`；折线图复用现有 SVG 实现（不引第三方 chart 库） | **P0** |
| `/discover` | 用 `@/lib/constants` 的硬编码 `CATEGORIES` / `PRICING_MODELS`，**未调** `/api/categories` | Server Component，调 `/api/categories?layer=mature`；保留现有筛选 UI，仅替换数据源 | **P0** |
| `/watchlist` | 页面存在但**未**包裹 `PaywallGate` | 整个内容外层包 `<PaywallGate feature="watchlist">`；空状态文案新增 i18n key `watchlist.empty_zh/_en` | **P1** |
| `/compare` | 页面存在但**未**包裹 `PaywallGate` | 整个内容外层包 `<PaywallGate feature="comparison">`；新增 i18n key `compare.empty_zh/_en` | **P1** |
| `/`（landing） | 营销页，已渲染 `LayerEntrySection` | 无改动（沿用 W2 prep），仅确保三层数据接入与 `/home` 一致 | **P2** |

### 3.2 Newsletter 订阅流程

#### 3.2.1 触发入口
- **位置 A（P0）**：`/home` 与 `/`（landing） 的 `<Footer>` 组件内，文案 `newsletter.cta_zh="订阅每周 AI 趋势速递"` / `newsletter.cta_en="Get the weekly AI radar in your inbox"`
- **位置 B（P1）**：`/launches?range=7d` 顶部加一个独立的 inline `<NewsletterForm variant="inline">`，捕获刚浏览完的用户

#### 3.2.2 表单字段
- `email`：必填，type=email，HTML5 + 服务端双重校验（RFC 5322 简化版）
- `frequency`：radio，值 `weekly`（默认）/ `daily`；`daily` 在 `<PaywallGate feature="newsletter.daily">` 内才可选，否则置灰
- `language`：hidden 字段，从 `<html lang>` 推断
- `source`：hidden 字段，取值 `home_footer` / `launches_inline`（埋点用）

#### 3.2.3 提交流程（前后端契约）
1. 客户端 `POST /api/newsletter/subscribe` body=`{email, frequency, language, source}`
2. 服务端按 `phase-e-api-contracts.md` §5.1 校验，返回 envelope `{code, data, message}`：
   - `200` 成功 → 前端展示"请查收确认邮件 / Check your inbox to confirm"
   - `4000` 邮箱格式非法 → 表单内联红字 `newsletter.error.invalid_email`
   - `4001` 已订阅 → 表单内联提示 `newsletter.error.already_subscribed`
   - `4002` 频率越权（free 选 daily）→ 触发 `PaywallGate` 升级弹窗
   - `4006` 速率限制 → 倒计时 60s
   - `5002` 服务端异常 → Toast `common.error_generic`，按钮恢复可点
3. 用户点击确认邮件链接 → `GET /api/newsletter/confirm?token=xxx` → 重定向到 `/newsletter/confirmed?lang=zh|en` 展示成功页

#### 3.2.4 确认邮件文案（双语文案已存在 `messages/{en,zh}.json` `newsletter.confirm_email.*`）
- 主题：zh=`请确认你的 AI Radar 订阅` / en=`Confirm your AI Radar subscription`
- 正文：含 24h 有效 token 链接、unsubscribe 链接、品牌签名

### 3.3 PaywallGate 映射表（feature → 页面位置 → 必需 plan）

| Feature | 出现位置 | 触发行为 | 必需 plan | 升级文案 i18n key |
| --- | --- | --- | --- | --- |
| `watchlist` | `/watchlist` 整页 + `/products/[id]` 详情页"加入关注"按钮 | 整页锁占位 / 按钮触发 Dialog | `starter` ($5/mo) | `paywall.feature.watchlist.title_zh/_en` + `.body_*` |
| `comparison` | `/compare` 整页 | 整页锁占位 | `starter` ($5/mo) | `paywall.feature.comparison.*` |
| `trends.advanced` | `/trends` 时间范围切换到 `90d` 时 | 范围切换器置灰 + Tooltip 提示 | `pro` ($10/mo) | `paywall.feature.trends_advanced.*` |
| `newsletter.daily` | NewsletterForm 频率 radio 的 `daily` 选项 | radio 置灰 + Dialog | `starter` ($5/mo) | `paywall.feature.newsletter_daily.*` |
| `api.access` | `/settings` "API Keys" 标签页 | 整 tab 锁占位 | `pro` ($10/mo) | `paywall.feature.api_access.*` |
| `team.collaboration` | `/settings` "Team" 标签页 | 整 tab 锁占位 | `enterprise` (Custom) | `paywall.feature.team_collaboration.*` |

> 映射以 `frontend/src/hooks/usePlan.ts` 的 `FEATURE_MIN_PLAN` 为单一真源；UI 不得硬编码 plan 名。

### 3.4 数据源扩展（Crawler W2 Schedule）

| 数据源 | 接入原因 | 反向风险 | Cron 时间（UTC） | 预期日增量 |
| --- | --- | --- | --- | --- |
| **HuggingFace** | 模型 / Space 是 L1 成熟分类与 L2 新品的重要信号源（与 GitHub 互补）；HF API 公开无需鉴权 | （1）`huggingface_hub` 库体积大 → 用 raw REST `https://huggingface.co/api/...`；（2）模型/数据集/space 三类混合，需在 schema 区分 | 每日 03:00 UTC | ~80–150 trending 模型 + ~30 spaces |
| **arXiv** | 学术研究是 L3 趋势的领先指标（论文 6–12 月后才进工业产品） | （1）需对 cs.AI / cs.CL / cs.LV 等分类做关键词过滤；（2）摘要中英文混合，正文不入库 | 每日 04:00 UTC | ~50–100 篇 |

- **不做**：Reddit、Twitter/X（API 付费/风控）、微信公众号（合规风险，open-questions Q5 已暂缓）
- **依赖**：`crawler/` 现有 4 源（ProductHunt/GitHub/HN/RSS）每日 02:00 UTC cron 跑通后追加；新源使用同样的 `crawler/sources/<name>.py` 模块结构 + `crawler/README.md` 注册流程
- **失败隔离**：单源失败不影响其他源；日志入 `crawler/logs/<date>.log`，触发 PagerDuty（已有 W1 报警通道）

### 3.5 验收标准（Acceptance Criteria，可测试）

> 每条须能由 QA 在 staging 环境复现；引用文件路径便于回归。

#### AC-1（首页三层接入）
- [ ] 访问 `/home`，DOM 中存在 `data-testid="layer-entry-card-l1|l2|l3"` 各 1 个
- [ ] 三层卡片 `count` 数值来自 API 而非 `LAYER_PLACEHOLDER`（非零）
- [ ] L2 CTA `<a href="/launches?range=24h">` 点击后 200，不出现 404
- [ ] L1→`/discover?layer=categories`、L3→`/trends?range=7d` 同上
- [ ] 切换 `?lang=zh` 与 `?lang=en`，三层标题同时存在 `<span lang="zh">` 与 `<span lang="en">`

#### AC-2（新建 /launches）
- [ ] `GET /launches?range=24h` 返回 200，渲染 ≥1 条 item
- [ ] `?range=7d|30d` 切换不报错
- [ ] `?category=xxx` 过滤生效，空结果显示 `launches.empty_zh/_en`
- [ ] 无效 `?range=99h` 返回 envelope `code=4000` 并显示错误态

#### AC-3（/trends 真数据）
- [ ] 移除 `frontend/src/app/trends/page.tsx` 内的 `generateLineChartData` mock
- [ ] `GET /api/trends?range=7d` 返回 envelope `code=0`，折线图使用该数据
- [ ] 时间范围切到 `90d` 触发 `PaywallGate(feature="trends.advanced")` 升级 Dialog

#### AC-4（/discover 数据源切换）
- [ ] 不再引用 `@/lib/constants` 的 `CATEGORIES`
- [ ] 渲染分类数 ≥ API `/api/categories` 返回的 `data.items.length`

#### AC-5（PaywallGate 包装）
- [ ] free 用户访问 `/watchlist` 看到 `LockedPlaceholder`，点击 CTA 触发 Dialog
- [ ] starter 用户访问 `/watchlist` 与 `/compare` 看到真实内容（无锁占位）
- [ ] Dialog 标题/正文/CTA 来自 i18n key，中英文切换同步

#### AC-6（Newsletter 订阅）
- [ ] Footer 渲染 `<NewsletterForm>`，提交 `weekly` + 合法邮箱 → 200 + 成功态
- [ ] 提交 `daily`（free 用户）→ 触发 `PaywallGate(newsletter.daily)` Dialog，不调 API
- [ ] 重复邮箱提交 → `code=4001` + 内联提示 `newsletter.error.already_subscribed`
- [ ] 速率限制触发 → 60s 倒计时
- [ ] 点击确认邮件链接 → `/newsletter/confirmed?lang=zh` 显示成功页，DB `newsletter_subscriptions.status='confirmed'`

#### AC-7（i18n 完整性）
- [ ] `pnpm i18n:check`（或等价脚本）通过，无缺失 key
- [ ] 新增 key 全部出现在 `messages/en.json` 与 `messages/zh.json`

#### AC-8（数据源扩展）
- [ ] `crawler/sources/huggingface.py` 与 `crawler/sources/arxiv.py` 存在
- [ ] 单源 mock 注入 500 错误时，其他 5 源正常入库（隔离生效）
- [ ] `crawler/README.md` §"已注册数据源" 列表更新到 6 源

---

## 4. 范围外（Out of Scope）

- **支付网关**（open-questions Q9 仍未定，付费墙仅展示文案与跳转 `/pricing`，不接 Stripe / 微信支付）
- **企业 SSO / 团队协作 UI**（`team.collaboration` 仅在 PaywallGate 注册，UI 留 P2）
- **AI 摘要 / Newsletter 自动生成**（订阅成功仅发确认邮件，digest 内容生成在 W3+）
- **付费数据导出 / API Key 管理**（`api.access` 触发但不实现 key 签发）
- **移动端原生 App**（仅响应式 Web 适配）
- **多语言扩展**（en + zh 之外）
- **A/B 测试与转化漏斗埋点后端**（前端埋点先行，后台在 W3）

---

## 5. 风险与依赖

### 5.1 风险

| ID | 风险 | 等级 | 缓解 |
| --- | --- | --- | --- |
| R-1 | `LAYER_PLACEHOLDER` 占位被接替后，原 W1 的 `useLaunches` / `useTrends` / `useCategories` 在 SSR 阶段若返回 5xx，会让首屏出现"数据接入中…"又出现的循环 | 中 | Server Component 优先；失败时降级为 placeholder + 触发 `revalidatePath` 间隔 60s |
| R-2 | `PaywallGate` 误判导致付费用户看到锁占位 | 高 | E2E 测试覆盖 free/starter/pro/enterprise 四档 × watchlist/comparison/trends.advanced/newsletter.daily 四 feature 矩阵 |
| R-3 | HuggingFace / arXiv 触发 W1 报警风暴（如 HF API 限流） | 中 | 入口处加本地 token bucket（10 req/min），失败指数退避 1/2/4/8/16 min |
| R-4 | `localStorage` 在隐身 / 跨域 iframe 中不可用，导致 `usePlan().plan` 退回 `free` | 低 | 文案提示用户"建议在普通窗口订阅"；B 线接 `user_profiles.plan` 后消除 |
| R-5 | 双语文案遗漏导致 `pnpm i18n:check` 红灯 | 中 | CI 阶段加 `i18n:check` gate，PR 不通过禁止 merge |
| R-6 | `newsletter.daily` 升级弹窗与频率 radio 状态不同步（用户选 daily 后再降级 plan） | 中 | Dialog 关闭后强制把 radio 复位到 `weekly` |

### 5.2 依赖

- **后端**：W1 11/11 API 已上线（`/api/launches`、`/api/trends`、`/api/categories`、`/api/newsletter/*`）；`/api/launches/[id]` 在 AC-2 链路会被消费
- **i18n 词条**：`messages/{en,zh}.json` 中 `home.layers.*` / `paywall.*` 已存在；`newsletter.*` 与 `launches.*` 需在 W2 任务中**新增**并 review
- **Crawler**：`crawler/README.md` §"调度器" cron 已有；HF/arXiv 模块为新增
- **设计稿**：PaywallGate 升级 Dialog 当前已有 W1 占位视觉，W2 不做视觉大改；NewsletterForm 复用 Button / Input 组件
- **Open Questions 联动**：
  - Q1（`/` vs `/home` 拆分）— 本 PRD 沿用前者为 landing、后者为 dashboard
  - Q6（push 频率）— 与 `newsletter.daily` 特性对齐，独立通道
  - Q9（支付）— 见范围外

---

## 6. Open Questions（需架构师 / 团队澄清）

1. **/launches 分页**：API 当前是否支持 `cursor` 分页？首页渲染前 30 条还是服务端分页？
2. **PaywallGate 锁占位的 a11y 标签**：是否需要 `aria-live` 提示用户已锁定？需要 ARIA 评审
3. **HF/arXiv 限流配额**：HuggingFace 公开 API 是否需要 token？arXiv 有无 IP 频率上限？需要 crawler 负责人确认
4. **Newsletter digest 内容来源**：W3 之前 digest 由谁生成（产品手动 / AI 摘要）？影响 W2 是否预留 digest payload 字段
5. **i18n key 命名规范**：`newsletter.error.*` 与现有 `common.error_*` 风格是否统一？需要前端 i18n owner 确认

---

## 7. 给架构师的下一步建议

1. **任务拆分建议**：
   - T-1（P0）：新建 `/launches` 页面 + `/home` 接入 `LayerEntrySection`（同一 PR）
   - T-2（P0）：`/trends` 切真数据 + `/discover` 切 `/api/categories`（同一 PR）
   - T-3（P0）：`NewsletterForm` 组件 + Footer 嵌入 + 双端 API 联通
   - T-4（P1）：`PaywallGate` 包裹 `/watchlist` + `/compare` + `/settings` 标签页
   - T-5（P1）：`crawler/sources/{huggingface,arxiv}.py` + `crawler/README.md` 更新
2. **先决条件**：i18n 词条 `newsletter.*` / `launches.*` 由 PM 在 T-1 开工前补齐
3. **QA 协同**：AC-1 ~ AC-8 同步进 `phase-f-test-plan-w2.md`（沿用 W1 模板）
4. **里程碑**：M2.1 = T-1 + T-2 + T-3（数据通 + 订阅通）；M2.2 = T-4 + T-5（付费墙 + 数据源扩展）
