# AI Radar — 需求优先级清单 (Requirement Priority)

> 基于 PRD v9.0 + 已实现前端走查结果
> 日期：2026-05-29

---

## Phase 1（MVP）— 必须交付

> 目标：用户能 **发现 → 查看 → 追踪 → 对比** AI 产品，核心价值闭环

| # | 需求 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| 1.1 | 产品发现页（搜索 + 筛选 + 列表） | P0 | ✅ 已完成 | `/discover` 已实现，需补 confidence/region 筛选 UI |
| 1.2 | 产品详情页 | P0 | ❌ 待开发 | 新增 `discover/[slug]/page.tsx`，展示完整四维验证、来源、技术栈、增长数据 |
| 1.3 | 四维验证细分展示 | P0 | ❌ 待开发 | 详情页展示 4 个子维度分数 + 验证证据（来源链接/更新时间/互动数据） |
| 1.4 | Watchlist 增删 + 状态追踪 | P1 | ✅ 已完成 | `/watchlist` 已实现基础功能 |
| 1.5 | 产品对比（2-5 产品） | P1 | ✅ 已完成 | `/compare` 已实现 10 维对比表 |
| 1.6 | 趋势页（Rising 排行 + 词云） | P1 | ⚠️ 部分完成 | 需补 Falling/Stable 数据或标记 Coming Soon |
| 1.7 | 用户认证（Email + Google OAuth） | P0 | ✅ 已完成 | Supabase Auth 已接入 |
| 1.8 | 响应式布局（Mobile + Desktop） | P0 | ✅ 已完成 | Navbar/Discover/对比页均有响应式 |
| 1.9 | 暗色模式 | P2 | ✅ 已完成 | ThemeProvider 已实现 |
| 1.10 | 数据库表结构 | P0 | ✅ 已完成 | Supabase 表已定义（user_profiles, products, watchlist, push_channels） |

**Phase 1 交付标准**：用户注册后，能搜索产品、查看详情（含四维验证）、加入 Watchlist、对比最多 5 个产品、查看趋势排行。

---

## Phase 2 — 重要增强

> 目标：提升数据质量感知、用户粘性、多端触达

| # | 需求 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| 2.1 | 多渠道推送配置 UI | P0 | ❌ 待开发 | Settings 页新增 Push Channels 配置区（飞书/钉钉/Slack/Telegram/Discord/Teams） |
| 2.2 | 多语言国际化（i18n） | P1 | ❌ 待开发 | 接入 next-intl/i18next，覆盖所有页面文案 |
| 2.3 | 全渠道来源展示 | P1 | ❌ 待开发 | 详情页展示每个产品的采集来源（X/GitHub/PH 等）和采集时间 |
| 2.4 | 智能去重融合展示 | P1 | ❌ 待开发 | 详情页展示 merge history（哪些平台记录被合并） |
| 2.5 | 用户反馈入口 | P2 | ❌ 待开发 | ProductCard/详情页添加 "Report Issue" 按钮 → 提交 → Admin 审核 |
| 2.6 | 管理后台完善 | P1 | ⚠️ 部分完成 | 用户管理表格 + AI 模型配置页 |
| 2.7 | 定价/订阅支付流程 | P1 | ❌ 待开发 | 接入 Stripe/Lemon Squeezy，实现升级/降级/取消订阅 |
| 2.8 | 产品详情页 SEO 优化 | P2 | ❌ 待开发 | metadata、Open Graph、结构化数据 |
| 2.9 | 对比页导出（CSV/PDF） | P2 | ❌ 待开发 | Export 按钮接入实际导出功能 |
| 2.10 | Watchlist 变化通知 | P1 | ❌ 待开发 |  tracked 产品状态变化时推送/邮件通知 |

---

## Phase 3 — 锦上添花

> 目标：高级功能、生态扩展、企业级能力

| # | 需求 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| 3.1 | API 开放（Pro/Premium） | P2 | ❌ 待开发 | API 文档 + 开发者 Portal + Rate Limit 管理 |
| 3.2 | 团队协作（Enterprise） | P2 | ❌ 待开发 | 多成员 Watchlist 共享、角色权限 |
| 3.3 | 自定义数据源 | P2 | ❌ 待开发 | 用户提交自己的产品/渠道 |
| 3.4 | 白标报告（Enterprise） | P2 | ❌ 待开发 | 导出 branded PDF 报告 |
| 3.5 | AI 模型配置管理 | P2 | ❌ 待开发 | Admin 页配置 embedding/分类模型参数 |
| 3.6 | Blog / Changelog | P2 | ❌ 待开发 | 内容营销入口 |
| 3.7 | Demo 视频嵌入落地页 | P2 | ❌ 待开发 | Hero Section 嵌入产品演示 |
| 3.8 | 社交分享（OG Image） | P2 | ❌ 待开发 | 产品详情页分享到 X/LinkedIn 的预览图 |

---

## Phase 1 必须交付项总结

以下 **6 项** 是 Phase 1 MVP 的核心交付，缺一不可：

1. **产品详情页** (`discover/[slug]/page.tsx`) — 展示完整产品信息 + 四维验证
2. **四维验证细分 UI** — 4 个子维度分数 + 证据链
3. **Discover 筛选补全** — confidence/region filter UI 渲染
4. **Trends 数据补全** — Falling/Stable 至少有一项有数据
5. **Navbar 路由清理** — 明确 `/` 与 `/home` 的分工
6. **i18n 框架接入** — 至少支持 EN 作为默认，ZH 作为可选项（文案可后续翻译）
