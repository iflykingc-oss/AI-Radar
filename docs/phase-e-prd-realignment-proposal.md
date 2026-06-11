# AI Radar — Phase E PRD 重新对齐方案 v1.0

> **作者**：齐活林（Qi）· 交付总监
> **日期**：2026-05-30
> **触发**：用户反馈"目前是不是有些跑偏了"——核心需求是"发现市面上在做什么产品 + 新方向/新产品"，但当前产品越来越像综合工具
> **目的**：在动 schema/代码前，先把方向对齐，所有人确认后再执行

---

## 0. 战略再确认（最重要）

经过两轮 AskUserQuestion + 用户最新回复，我们已锁定 AI Radar 的**3 层信息架构**：

| 层 | 名称 | 维度 | 解决的问题 | 现状 |
|---|---|---|---|---|
| **L1 成熟赛道** | 分类目录 | 静态结构（writing / coding / design...） | "我想找某个品类的工具" | ✅ 保留，13 个分类已实现 |
| **L2 新发布雷达** | 每日新发布 | 时间维度（今天 / 本周 / 本月） | "今天 AI 圈又出了什么新东西" | ⚠️ 缺失，首页/Discover 没有时间轴 |
| **L3 趋势方向探测器** | 方向信号 | 信号维度（哪些标签/技术/场景在升温） | "下一个值得押注的方向是什么" | ⚠️ 严重缺失，trends 页是空壳 |

**用户原话**（"这个静态分类也没问题，成型的赛道是有帮助的"）：3 层**共存互补**，不是替代。

---

## 1. 当前代码状态盘点（事实）

> 所有数据来自 `D:/wordkbuddywork/2026-05-29-00-16-56/` 实际项目文件

### 1.1 数据库（`supabase/migrations/001_initial_schema.sql`）

- **1 张核心表**：`products`（27 列，1 次迁移就定型）
- 4 张附属表：`user_profiles` / `watchlist` / `push_channels`
- **缺失**：`launch_events`（新发布事件流） / `trend_signals`（趋势信号） / `categories`（分类字典） / `product_signals`（多对多关联）

### 1.2 内容（`supabase/seed-full.sql`，63 条种子）

| 类别 | 数量 | 代表产品 | 类型 |
|---|---|---|---|
| LLM / Chatbot | ~20 | ChatGPT / Claude / Gemini / Qwen / Kimi / Doubao / DeepSeek / Llama / Mistral / Grok / 文心一言 | 成熟 + 头部 |
| AI Coding | ~10 | GitHub Copilot / Cursor / v0 / Devin / Cline / Bolt.new / Lovable | 成熟 + 头部 |
| Image Gen | ~8 | Midjourney / DALL·E / Stable Diffusion / Flux / Ideogram / Recraft | 成熟 |
| Video / Audio | ~6 | Runway / Pika / Suno / Udio / ElevenLabs | 成熟 |
| Search / Productivity | ~6 | Perplexity / Notion AI / Mem | 成熟 |
| 商业/Agent 等 | ~13 | Lindy / Manus / Replit Agent / 各种 wrapper | 头部+新 |

**问题**：63 条里 ≥ 80% 是已经发布 ≥ 6 个月、媒体反复报道的"成熟明星"。**真正"今天新发现"的产品几乎没有**。这与 PRD 1.1"新产品每天发布在十几个渠道"+"90% 僵尸产品"的痛点不匹配。

### 1.3 前端页面（`frontend/src/app/`）

- ✅ 已有：`/` `/home` `/discover` `/discover/[slug]` `/watchlist` `/compare` `/trends` `/dashboard` `/settings` `/admin` `/privacy` `/terms` `/cookie-settings`
- ⚠️ `/trends/page.tsx` — 需要查内容，目前是空壳（PRD 3.6 也是空的，估计是同步落后）
- ❌ 缺：专门的"今日新发布"页/区块

### 1.4 爬虫（`crawler/src/sources/`）

- **README 写的是 15 个数据源，实际只实现 4 个**：`github.ts` / `hackernews.ts` / `producthunt.ts` / `rss.ts`
- PRD 提到：`X / GitHub / 小红书 / 公众号 / 十几个渠道` — **实际覆盖度严重不足**

### 1.5 文档历史

`docs/` 里已经有这些沉淀：
- `phase-a-frontend-data-audit.md`
- `phase-b-competitor-gap-analysis.md`
- `phase-c-category-best-features.md`
- `discover-page-gap-analysis.md`
- `qa-test-report.md` / `qa-regression-report.md`

→ 团队之前已经做过"分类页优化"和"竞品分析"，但**没有解决"3 层模型"这个根本架构问题**。

---

## 2. 当前 vs PRD 愿景的差距矩阵

| 维度 | PRD 愿景 | 当前实现 | 差距 | 优先级 |
|---|---|---|---|---|
| **L1 成熟赛道目录** | 13+ 分类，完整画像 | ✅ 已实现 | 无 | P2（保持） |
| **L2 新发布雷达** | 今日/本周/本月 + 时间轴 | ❌ 无 | **缺失核心** | **P0** |
| **L3 趋势方向** | 标签云 + 增长曲线 + Top20 动量 | ⚠️ 趋势页空壳 | **严重缺失** | **P0** |
| 数据源覆盖 | 18 个频道（X / 小红书 / 公众号 / GitHub Trending / HuggingFace / arXiv ...） | 4 个（GH / HN / PH / RSS） | 14 个缺口 | P0 |
| 置信度算法 | 4D 验证（新鲜度/多源/参与/技术） | 字段已有（confidence_score/source_count），但算法没跑 | 算法未实现 | P1 |
| 用户系统 | Auth + Watchlist + 推送 8 渠道 | ✅ Watchlist + 9 渠道字段 | 推送链路未跑通 | P1 |
| 国际化 | en / zh 完整双语 | ✅ next-intl 已接入 | 内容覆盖度 | P2 |
| 合规 | GDPR / CCPA / 网安法 | 部分 privacy/terms 页 | 详情待补 | P2 |
| 商业模式 | Phase1 免费+Newsletter / Phase2 付费 / Phase3 B2B | README 提到，但代码无订阅层 | Phase2/3 暂缓 | P3 |

---

## 3. 推荐的重新对齐架构

### 3.1 三层信息架构（核心模型）

```
┌────────────────────────────────────────────────────────────┐
│  Landing (3.0) — 一句话传达"我们发现 AI 圈在发生什么"       │
│  ┌──────────────┬───────────────────┬──────────────────┐  │
│  │ L1 成熟赛道   │ L2 今日新发布       │ L3 趋势方向      │  │
│  │ (/) 分类目录  │ (/) 时间轴 24h     │ (/trends) 信号    │  │
│  │              │ (/) 卡片流          │ (/) 词云+曲线    │  │
│  └──────────────┴───────────────────┴──────────────────┘  │
│         ↓              ↓                    ↓              │
│      /discover     /launches            /trends           │
│   (静态筛选)    (时间线+订阅)        (方向+预测)             │
└────────────────────────────────────────────────────────────┘
```

### 3.2 新增数据库表（最少可行集）

#### 表 A：`launch_events`（新发布事件流 — L2 的核心）
```sql
CREATE TABLE launch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  source TEXT NOT NULL,                  -- 'producthunt' / 'github' / 'hackernews' / 'x' / 'xiaohongshu' / 'wechat' ...
  source_url TEXT,
  source_id TEXT,                         -- 原平台 ID，用于去重
  event_type TEXT DEFAULT 'launch',       -- 'launch' / 'major_update' / 'open_source' / 'funding' / 'milestone'
  title TEXT,
  body TEXT,
  author TEXT,
  engagement JSONB DEFAULT '{}',          -- {upvotes, comments, stars, retweets, ...}
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  event_at TIMESTAMPTZ,                   -- 原事件发生时间
  confidence REAL DEFAULT 0.5,            -- 来源可信度
  raw_data JSONB,                         -- 原始 payload 留痕
  UNIQUE(source, source_id)
);
CREATE INDEX idx_launch_event_at ON launch_events(event_at DESC);
CREATE INDEX idx_launch_product ON launch_events(product_id);
CREATE INDEX idx_launch_source ON launch_events(source, event_at DESC);
```

#### 表 B：`trend_signals`（趋势信号 — L3 的核心）
```sql
CREATE TABLE trend_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,              -- 'tag_emerging' / 'category_growing' / 'tech_stack_shift' / 'cluster_new' / 'funding_pattern'
  scope TEXT NOT NULL,                    -- 'tag:agent-orchestration' / 'category:video-gen' / 'stack:mamba'
  title TEXT,
  description TEXT,
  evidence JSONB DEFAULT '{}',            -- {products:[...], metrics:{...}, sources:[...]}
  strength REAL DEFAULT 0,                -- 0-100 信号强度
  velocity REAL DEFAULT 0,                -- 周环比增速
  novelty REAL DEFAULT 0,                 -- 0-1 新颖度（与历史 baseline 比）
  first_seen TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'            -- 'emerging' / 'peaking' / 'cooling' / 'expired'
);
CREATE INDEX idx_trend_status ON trend_signals(status, strength DESC);
CREATE INDEX idx_trend_type ON trend_signals(signal_type);
```

#### 表 C：`product_signals`（中间关联）
```sql
CREATE TABLE product_signals (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES trend_signals(id) ON DELETE CASCADE,
  relevance REAL DEFAULT 1.0,
  PRIMARY KEY (product_id, signal_id)
);
```

#### 表 D：`categories`（分类字典 — 取代字符串枚举）
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT, name_zh TEXT,
  parent_slug TEXT,                       -- 支持子分类
  description_en TEXT, description_zh TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  product_count INT DEFAULT 0
);
```
然后 `products.category` 改为 FK（数据迁移期间保留旧字段也可）。

### 3.3 首页/导航的 L1+L2+L3 改造

| 区块 | 旧 | 新 |
|---|---|---|
| 导航 | Discover / Watchlist / Compare / Trends | **保留 + 加 /launches** |
| 首页 Hero | "Discover, validate, and track" | "今天 AI 圈在发生什么" + 3 个入口卡片（成熟赛道 / 今日新发 / 趋势方向） |
| 首页中部 | 排行榜 | **今日新发布** 横滑卡片（来自 launch_events） |
| 首页底部 | 词云 | **趋势方向** Top 5（来自 trend_signals） |
| Discover | 列表+筛选 | 排序选项新增"今天/本周/本月" |
| Trends | 空壳 | 词云 + 增长曲线 + Top 20 动量 + 信号卡片 |
| **新增** Launches | — | 24h 时间轴，源标签（PH / HN / X / 小红书）可筛选 |

### 3.4 种子数据重构（关键）

| 类型 | 旧 | 新目标 | 备注 |
|---|---|---|---|
| 成熟明星 | 63 条全占 | **~35 条** | 保留 ChatGPT/Claude/Cursor/Notion/Midjourney 等头部，但**减半** |
| 近期新发布 | 0 | **~50 条** | 真实 2025 Q4-2026 Q1 期间在 PH/HN/GitHub trending 上架的新产品（如 Bolt.new / Lovable / Devin / Manus / Cursor Agent / Claude Code / Genspark 等） |
| 趋势信号定义者 | 0 | **~20 条** | 每个新兴标签/技术堆栈挑 1-2 个代表性产品（mamba-architecture / agent-orchestration / voice-clone / video-gen-open-source / browser-use） |

总目标：**100-110 条**，结构 35:50:20。

### 3.5 爬虫扩展（按 ROI 排序）

| 优先级 | 源 | 价值 | 接入难度 |
|---|---|---|---|
| P0 | GitHub Trending | 高（已有基础） | 低（扩 crawler/src/sources/github.ts） |
| P0 | Product Hunt | 高（已有基础） | 低（扩 crawler/src/sources/producthunt.ts） |
| P0 | Hacker News | 中（已有基础） | 低 |
| P0 | X/Twitter 关键词 | 极高 | 中（需 API 或第三方） |
| P1 | 小红书 AI 标签 | 高（中文唯一） | 高（反爬严格） |
| P1 | arXiv cs.AI / cs.CL | 中（学术新方向） | 低（免费 API） |
| P1 | HuggingFace Trending | 中 | 低 |
| P2 | 微信公众号 | 中 | 极高（无公开 API） |
| P2 | npm 增长榜 | 中 | 低 |
| P2 | 飞书/钉钉 AI 应用 | 低 | 中 |

---

## 4. 建议的 3 阶段执行计划

### Phase E（立即，1 周内）— 战略重置
> 目标：把方向摆正，不动 schema

1. **冻结 Phase D 商业化/TAAFT 类代码** — 暂缓订阅/付费层
2. **重写 README** — 把 3 层信息架构作为开篇，3 个入口卡片图
3. **完成 100 条种子数据** — 35 成熟 + 50 新发 + 20 趋势
4. **新增 `/launches` 路由** — MVP 版本，用静态 seed 数据展示
5. **完成 `/trends` 页面** — 把 3.6 画板的内容用静态数据落地

### Phase F（4 周）— 架构补齐
1. 数据库迁移：新增 `launch_events` / `trend_signals` / `categories` / `product_signals`
2. 爬虫扩展：补齐 GitHub Trending + X 关键词 + arXiv
3. 首页改造：3 个入口卡片 + 今日新发布 + 趋势 Top 5
4. Discover 排序选项新增"今天/本周/本月"
5. 推送链路跑通：新发布 / 趋势变化 推送到 webhook

### Phase G（8 周）— 信号算法 + 趋势图谱
1. 趋势信号聚合算法（标签突发检测 + 增长率 + 新颖度）
2. 趋势图谱可视化（按类别/标签/技术堆栈的关系图）
3. 推送系统扩展：8 渠道全跑通
4. i18n 内容补齐
5. 合规细节（GDPR/CCPA/网安法 详情页 + 同意机制）

---

## 5. 关键决策点（请用户确认）

在动任何 schema/代码前，请就以下 4 点给出指示：

### 决策 1：3 层模型定位
- **推荐**：3 层共存（L1 保留 / L2 新建 / L3 重建）
- 备选 A：只做 L2 + L3，砍掉 L1
- 备选 B：只做 L2，砍掉 L1 + L3

### 决策 2：趋势信号的"信号类型"集合
- **推荐**：`tag_emerging` / `category_growing` / `tech_stack_shift` / `cluster_new` / `funding_pattern`（5 类）
- 是否要加：`pricing_model_shift`（订阅 → 开源的转向）/ `region_emerging`（某个地区突然爆发）

### 决策 3：爬虫优先级
- **推荐**：Phase E 先用种子数据跑通 3 层 UI，爬虫在 Phase F 再扩展
- 备选 A：先扩爬虫（P0 4 个源），再上 UI
- 备选 B：并行

### 决策 4：种子数据的目标量
- **推荐**：100-110 条（35:50:20）
- 备选 A：保守 80 条（30:40:10）
- 备选 B：激进 200 条（40:120:40）

### 决策 5：是否暂停 Phase D 商业化
- **推荐**：暂停，等 Phase E+F 跑通用户反馈后再启动
- 备选：继续推 Phase D

---

## 6. 我建议的执行节奏

```
Day 1  (今天)     - 用户回复 5 个决策点
Day 2  (明天)     - 团队对齐 → PRD v9.1 终版
Day 3-7           - Phase E 实施（README + 种子 + /launches + /trends MVP）
Day 8              - QA 验证 + 用户验收
Day 9+            - 启动 Phase F
```

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 种子数据没新意（"看着像 ChatGPT 列表"） | 高 | 高 | 用户参与"新发布提名"，每周补充 10 条 |
| 趋势信号算法难以校准 | 中 | 中 | 先用规则（标签突增 + 周环比），跑 4 周后再上 ML |
| X / 小红书反爬严格 | 高 | 中 | 走第三方 API（apify / rapidapi），月成本 $20-50 可控 |
| 用户对"3 层并存"产生认知负担 | 中 | 中 | 落地页用 3 个入口卡片明示分工，不重叠 |
| Phase D 暂停导致早期用户失望 | 低 | 中 | 公开 changelog 说明"先做对，再收费" |

---

## 8. 不在本次范围内的（明确）

- ❌ Phase 2/3 付费订阅 / Stripe 集成
- ❌ 移动端 PWA
- ❌ Public API / Webhooks（PRD 5.3）
- ❌ 嵌入式 Widget
- ❌ OAuth 第三方登录（GitHub / Google / 微信）
- ❌ 完整 GDPR/CCPA 同意管理（仅保留页面）

这些都列在 Phase H+ 之后，不和 3 层信息架构冲突。

---

**TL;DR**：AI Radar 的核心价值 = **"3 层信息架构的发现工具"**。当前实现几乎全压在 L1（成熟明星 + 综合工具感），L2/L3 是空壳。Phase E 用 1 周把方向摆正（README + 100 条种子 + 2 个新页面 MVP），然后再用 4+8 周把架构和爬虫补齐。

**等你回复 5 个决策点，我就启动团队执行 Phase E。**
