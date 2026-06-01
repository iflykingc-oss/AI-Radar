# AI Radar — 待确认问题清单 (Open Questions)

> 基于 PRD v9.0 + 已实现前端走查，需用户确认的开放问题
> 日期：2026-05-29

---

## 1. 产品结构与路由

### Q1: `/` 与 `/home` 的职责分工？

- **现状**：`/` 是落地页（营销），`/home` 是登录后首页（Dashboard），但 Navbar 中两者并存
- **问题**：用户登录后应该看到 `/` 还是 `/home`？未登录访问 `/home` 是否重定向到 `/`？
- **建议**：
  - `/` = 落地页（未登录可见）
  - `/home` = 登录后 Dashboard（未登录 → 重定向 `/`）
  - Navbar 中移除 `/home`，改用 "Dashboard" 链接（登录后显示）

### Q2: 产品详情页 URL 格式？

- **现状**：ProductCard 使用 `/discover/${id}` 链接，但数据库 products 表有 `slug` 字段
- **建议**：使用 `/discover/${slug}`（SEO 友好），如 `/discover/chatgpt-clone-xyz`

---

## 2. 四维验证展示

### Q3: 四维验证的细分分数如何展示？

- **现状**：仅有 confidence_score（0-100）一个总分，四维（Freshness / Multi-source / Engagement / Technical）无独立分数
- **问题**：PRD 中四维是独立维度，是否需要每个维度单独评分（如 0-25）？
- **建议**：
  - 方案 A：四维各 0-25 分，总分 = 求和（便于用户理解各维度贡献）
  - 方案 B：四维各 0-100 分，总分 = 加权平均（更灵活但更复杂）
  - **推荐方案 A**

### Q4: 验证证据链是否需要展示具体来源链接？

- **建议**：详情页展示每条验证信号的来源（如 "GitHub: last commit 3 days ago"、"Product Hunt: 120 upvotes"）

---

## 3. 多渠道推送

### Q5: 推送渠道配置的 MVP 范围？

- **现状**：数据库 push_channels 表已定义 7 种渠道（飞书/钉钉/企微/Slack/Telegram/Discord/Teams）
- **问题**：Phase 1 是否需要全部支持？还是先支持 2-3 个核心渠道？
- **建议**：Phase 1 先支持 **飞书（Webhook） + Slack（Incoming Webhook）**，其余 Phase 2 补充

### Q6: 推送频率选项？

- **现状**：DB 定义 realtime / daily / weekly
- **建议**：Phase 1 仅支持 **daily digest**，realtime 需后端 WebSocket/SSE 支持，留到 Phase 2

---

## 4. 多语言

### Q7: i18n 框架选型？

- **现状**：Settings 有语言选择器，但页面文案硬编码英文
- **建议**：使用 **next-intl**（Next.js 官方推荐，App Router 友好）

### Q8: 产品数据多语言如何处理？

- **现状**：数据库有 name_en/name_zh、description_en/description_zh
- **问题**：当产品只有英文名时，中文用户看到的是英文还是 AI 翻译？
- **建议**：Phase 1 优先展示已有语言版本，AI 翻译留到 Phase 3

---

## 5. 定价与支付

### Q9: 支付网关选型？

- **现状**：落地页有 4 档定价（Free/Pro/Premium/Enterprise），但无支付流程
- **建议**：使用 **Stripe**（全球覆盖）或 **Lemon Squeezy**（对 SaaS 友好，支持中国区）
- **需确认**：目标市场是国内还是全球？决定支付网关选型

### Q10: Free 档的 "10 products per day" 是浏览限制还是 Watchlist 限制？

- **现状**：定价表写 "10 products per day"，但 Discover 页无计数逻辑
- **建议**：明确为 **Watchlist 上限 10 个产品**（而非浏览限制，浏览限制影响体验）

---

## 6. 管理后台

### Q11: 用户管理 MVP 需要哪些功能？

- **现状**：Admin 页用户管理为 Coming Soon
- **建议**：Phase 2 最小版本 = 用户列表（email/plan/注册时间）+ 封禁/解封 + 查看用户 Watchlist

### Q12: AI 模型配置是否需要前端 UI？

- **现状**：Admin 页 AI 模型配置为 Coming Soon
- **建议**：Phase 1 不需要，配置项（embedding 模型、分类阈值）通过环境变量/Supabase config 管理即可

---

## 7. 数据与后端

### Q13: 爬虫/后端是否已就绪？

- **现状**：项目有 `crawler/`、`push-worker/`、`ai-worker/` 目录，但前端 API 路由均返回 mock/空数据
- **问题**：前端开发是否假设后端已就绪？还是需要同步开发？
- **需确认**：后端当前状态

### Q14: 产品数据的初始填充方案？

- **问题**：产品库初始数据来源？手动导入 / 爬虫抓取 / 第三方 API？
- **建议**：Phase 1 使用种子数据（50-100 个知名 AI 产品）做功能演示，真实数据由爬虫填充

---

## 8. 其他

### Q15: Watchlist 的 "Recent Changes" Tab 数据来源？

- **现状**：Watchlist 页有 Changes Tab，但仅显示 "No recent changes"
- **问题**：是否需要在 products 表新增 `change_log` 表记录每次字段变更？
- **建议**：Phase 2 新增 `product_changes` 表，记录字段变更历史

### Q16: 是否需要产品评论/社区功能？

- **现状**：PRD 提及 "Community access" 和 "Community VIP access"
- **问题**：Phase 1 是否需要产品评论/讨论区？
- **建议**：Phase 1 不包含社区功能，用用户反馈（Report Issue）替代
