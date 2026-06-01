# AI Radar — 产品走查报告 (Product Review)

> 对比：已实现前端（46 文件，Next.js 14 + shadcn/ui）vs PRD v9.0 核心功能
> 日期：2026-05-29

---

## 1. 核心功能覆盖情况

| # | PRD v9.0 核心模块 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | **全渠道自动挖掘**（X, GitHub, PH 等 10+ 渠道） | P0 | ❌ 缺失 | 前端无 UI 展示渠道来源/采集状态，需后端爬虫 + 前端展示页 |
| 2 | **智能去重融合**（同名/同产品跨平台合并） | P0 | ❌ 缺失 | 无融合记录 UI，无 merge history 展示 |
| 3 | **四维有效性验证**（Freshness / Multi-source / Engagement / Technical） | P0 | ⚠️ 部分实现 | 落地页和 ProductCard 有 confidence_score 展示，但 **四维细分维度未独立展示**，无验证证据链 UI |
| 4 | **多渠道推送**（飞书/钉钉/Slack/Telegram/Discord/Teams） | P0 | ❌ 缺失 | 数据库有 push_channels 表，但 **无配置 UI**（Settings 页仅通知开关） |
| 5 | **决策辅助**（对比最多 5 产品 + 置信度 + 技术栈 + 增长） | P1 | ✅ 已实现 | `/compare` 页完整实现 10 维对比表 |
| 6 | **产品发现/搜索** | P0 | ✅ 已实现 | `/discover` 页有搜索 + 分类/定价筛选 + ProductCard |
| 7 | **Watchlist 追踪** | P1 | ✅ 已实现 | `/watchlist` 页支持添加/移除/Tab 分组 |
| 8 | **趋势分析**（词云 + Rising/Falling/Stable 排行） | P1 | ⚠️ 部分实现 | `/trends` 页有词云和 Rising 排行，**Falling/Stable 为空占位** |
| 9 | **用户认证**（Email + Google OAuth） | P0 | ✅ 已实现 | LoginModal + RegisterModal + Supabase Auth |
| 10 | **管理后台**（数据审核/用户管理/AI 模型配置） | P1 | ⚠️ 部分实现 | 用户反馈审核 ✅，用户管理 ⏳ Coming Soon，AI 模型配置 ⏳ Coming Soon |
| 11 | **多语言**（i18n EN/ZH） | P1 | ⚠️ 部分实现 | Settings 有语言选择器 + LanguageSwitcher 组件，**但页面文案硬编码英文，未接入 i18n 框架** |
| 12 | **暗色模式** | P2 | ✅ 已实现 | ThemeProvider + Tailwind CSS dark mode |
| 13 | **产品详情页** (`/discover/[id]`) | P1 | ❌ 缺失 | ProductCard 有 `href="/discover/${id}"` 链接，**但页面无对应路由文件** |
| 14 | **定价/订阅** | P1 | ⚠️ 部分实现 | 落地页有 4 档定价展示，**但无支付流程/订阅管理 UI** |
| 15 | **用户反馈系统** | P2 | ❌ 缺失 | Admin 页有审核列表（硬编码 mock），**但前端无用户提交反馈的入口组件** |

---

## 2. 落地页 8 个 Section 覆盖核心用户故事

| Section | 内容 | 覆盖的用户故事 | 评价 |
|---|---|---|---|
| 1. Hero | 标题 + CTA + 信任指标 | "快速找到活跃 AI 产品" | ✅ 覆盖 |
| 2. Pain Points | 3 大痛点卡片 | 问题意识唤醒 | ✅ 覆盖 |
| 3. Core Features | 4 大功能卡片 | 平台能力展示 | ✅ 覆盖 |
| 4. 4D Verification | 四维验证展示 | 建立信任 | ⚠️ 仅展示标签，无交互/证据 |
| 5. User Cases | 3 类角色 Tab（创业者/投资人/开发者） | 场景代入 | ✅ 覆盖 |
| 6. Metrics | 3 个关键指标 | 数据背书 | ✅ 覆盖 |
| 7. Pricing | 4 档定价表 | 转化引导 | ✅ 覆盖 |
| 8. FAQ + CTA | 6 个 FAQ + 最终 CTA | 消除疑虑 + 转化 | ✅ 覆盖 |

**结论**：落地页 8 个 Section 结构完整，但均为静态展示，缺乏交互性（如 live product count、demo 视频嵌入）。

---

## 3. UI/UX 不符合 PRD 的地方

| # | 问题 | 所在页面 | 严重度 | 建议 |
|---|---|---|---|---|
| 1 | 产品详情页 `/discover/[id]` 缺失（404） | 路由 | P0 | 新增 `discover/[slug]/page.tsx` |
| 2 | 四维验证仅展示标签名，无细分分数/证据链 | Discover, ProductCard | P0 | 在详情页展开四维子分数 + 验证来源 |
| 3 | 多渠道推送无配置 UI（DB 有表但无页面） | Settings | P0 | 新增 Push Channels 配置区 |
| 4 | 搜索筛选缺少置信度/地区筛选 UI（state 有但 UI 未渲染） | Discover | P1 | 补充 confidence/region filter 组件 |
| 5 | 趋势页 Falling/Stable Tab 仅空占位 | Trends | P1 | 补充数据或改为 Coming Soon 态 |
| 6 | 管理后台用户管理/AI 配置为 Coming Soon | Admin | P1 | 标记 Phase 2 或补充 MVP 版本 |
| 7 | 多语言选择器存在但页面文案未国际化 | 全局 | P1 | 接入 next-intl 或 i18next |
| 8 | 用户反馈入口缺失（Admin 只有审核 mock） | 全局 | P2 | 在 ProductCard/详情页加 "Report Issue" 按钮 |
| 9 | 对比页 Export 按钮无实际功能 | Compare | P2 | 接入 CSV/PDF 导出 |
| 10 | Navbar 链接 `/home` 与落地页 `/` 功能重叠 | 导航 | P2 | 明确 `/` 与 `/home` 的分工 |

---

## 4. 总结

| 维度 | 覆盖率 | 说明 |
|---|---|---|
| P0 核心功能 | 3/5 (60%) | 认证、发现、对比已实现；全渠道挖掘展示、去重融合、多维推送缺失 |
| P1 重要功能 | 4/7 (57%) | Watchlist、趋势、管理后台部分实现；详情页、推送配置、多语言待补 |
| P2 锦上添花 | 2/3 (67%) | 暗色模式、定价展示已实现；反馈入口缺失 |
| 落地页 | 8/8 Sections | 结构完整，均为静态展示 |
