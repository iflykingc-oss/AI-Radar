# AI Radar — Phase E 架构评审 (QA 视角)

> **作者**: 严过关 (QA Engineer)
> **日期**: 2026-05-31
> **评审范围**: Phase E W1 全部 9 任务依赖的 4 份架构文档 + DDL/RLS/Seed/API
> **评审方法**: PRD ↔ DDL ↔ API 契约 ↔ ADR 4 方互校
> **关联文档**:
> - `docs/phase-e-prd-incremental.md` (A-1~A-13, B-1~B-10)
> - `docs/phase-e-architecture.md` (ADR-01~08, 原则 P1~P7)
> - `docs/phase-e-api-contracts.md` (12 端点)
> - `docs/phase-e-task-breakdown.md` (T01~T09 验收)
> - `supabase/migrations/002_launch_events_and_trend_signals.sql` (DDL/RLS 权威)
> - `supabase/seed-phase-e-*.sql` × 4 (种子)
>
> **原则**:
> 1. **不**修改任何代码 / SQL / 4 份架构文档
> 2. 仅作"测试可见"问题的标注, 终审由架构师高见远
> 3. 锚点引用: `phase-e-architecture.md#ADR-02` 等

---

## 0. 总览

| 维度 | 一致 | 局部矛盾 | 严重冲突 |
|------|------|----------|----------|
| PRD A-1 ↔ launch_events DDL | ✓ | - | - |
| PRD A-2 ↔ trend_signals DDL | - | 1 处 (status 枚举) | - |
| PRD A-3 ↔ categories+product_signals DDL | - | 1 处 (display_order 唯一) | - |
| API 契约 §5.1 ↔ newsletter DDL | - | 1 处 (UNIQUE 邮箱) | - |
| API 契约 §5.2 ↔ confirm 端点 | - | - | 1 处 (4007 错用) |
| ADR-02 ↔ 触发器实现 | ✓ | - | - |
| ADR-04 ↔ categories 表 | - | 1 处 (迁移策略) | - |
| 推送 ≤5min (PRD A-2) ↔ 实际实现 | - | - | 1 处 (P0 阻塞) |

**结论**: 发现 3 处严重问题, 4 处局部矛盾, 0 处阻塞上线。需架构师/工程师在 W2 启动前确认或修复。

---

## 1. 一致性检查 (Field-by-Field)

### 1.1 PRD A-1 ↔ `launch_events` DDL

| PRD A-1 字段 | DDL 字段 | 类型 | 一致 |
|--------------|----------|------|------|
| `id` | `id` | UUID PK | ✓ |
| `product_id` | `product_id` | UUID FK→products | ✓ |
| `source` (枚举) | `source` | TEXT | ✓ |
| `source_url` | `source_url` | TEXT | ✓ |
| `source_id` | `source_id` | TEXT | ✓ |
| `event_type` (5+ 枚举) | `event_type` (6 枚举) | TEXT | ⚠️ 见下 |
| `title` | `title` | TEXT | ✓ |
| `body` | `body` | TEXT | ✓ |
| `author` | `author` | TEXT | ✓ |
| `engagement` (JSONB) | `engagement` | JSONB | ✓ |
| `detected_at` | `detected_at` | TIMESTAMPTZ | ✓ |
| `event_at` | `event_at` | TIMESTAMPTZ | ✓ |
| `confidence` (0-1) | `confidence` (0-1 CHECK) | REAL | ✓ |
| `raw_data` | `raw_data` | JSONB | ✓ |
| `created_at` | `created_at` | TIMESTAMPTZ | ✓ |
| `updated_at` | `updated_at` | TIMESTAMPTZ | ✓ |

**字段差异**:
- ⚠️ **PRD A-1 列 5 种 event_type** (`launch` / `major_update` / `open_source` / `funding` / `milestone`)
- ⚠️ **DDL CHECK 6 种** (上面 5 种 + `pricing_change`)
- **影响**: API 契约 §1.1 列举的也是 5 种, 但 seed 文件实际使用了 5 种 (未用 `pricing_change`)
- **建议**: PRD 文档未提及 `pricing_change`, 应在 PRD A-1 增补 (或 DDL 删除此枚举)
- **Fix Owner**: Doc (PRD) 或 DB (DDL)

**触发器一致性**:
- 触发器过滤条件: `event_type='launch' AND source IN ('producthunt','hackernews','github') AND confidence >= 0.6`
- **来源白名单** (3 个) vs **DDL `source` 注释** (8 个: producthunt/hackernews/github/x/xiaohongshu/arxiv/huggingface/rss)
- **影响**: x / arxiv / huggingface / xiaohongshu / rss 5 个源不触发推送
- **建议**: 与 PRD A-10 (推送链路) 明确范围对齐
- **Fix Owner**: Doc / DB (若产品要求扩大)

### 1.2 PRD A-2 ↔ `trend_signals` DDL

| PRD A-2 字段 | DDL 字段 | 类型 | 一致 |
|--------------|----------|------|------|
| `id` | `id` | UUID PK | ✓ |
| `signal_type` (5 枚举) | `signal_type` (5 枚举) | TEXT | ✓ |
| `scope` (5 格式) | `scope` | TEXT | ✓ |
| `title` | `title` | TEXT | ✓ |
| `description` | `description` | TEXT | ✓ |
| `evidence` (JSONB) | `evidence` | JSONB | ✓ |
| `strength` (0-100) | `strength` (0-100 CHECK) | REAL | ✓ |
| `velocity` | `velocity` | REAL | ✓ |
| `novelty` (0-1) | `novelty` (0-1 CHECK) | REAL | ✓ |
| `first_seen` | `first_seen` | TIMESTAMPTZ | ✓ |
| `last_updated` | `last_updated` | TIMESTAMPTZ | ✓ |
| `status` (3 枚举) | `status` (4 枚举) | TEXT | ⚠️ 见下 |

**字段差异**:
- ⚠️ **PRD A-2 列 3 种 status** (`emerging` / `peaking` / `cooling`)
- ⚠️ **DDL CHECK 4 种** (上面 3 种 + `expired`)
- **影响**: `expired` 在 DDL 允许但 PRD/API 未列出, 测试矩阵中 T03 status 校验断言 3 种 (24+12+4)
- **建议**: PRD 增补 `expired` 含义 (W3 由 push-worker 写入), 或 DDL 移除
- **Fix Owner**: Doc (PRD) 或 DB (DDL)

**视图 v_trends_active 过滤**:
```sql
WHERE ts.status IN ('emerging', 'peaking', 'cooling')
```
- 视图已排除 `expired`, 与 PRD 3 状态一致
- **冲突点**: DDL 允 `expired` 但视图不使用, 状态定义不闭合
- **Fix Owner**: Doc (PRD) 或 DB (DDL)

### 1.3 PRD A-3 ↔ `categories` + `product_signals` DDL

| PRD A-3 字段 | DDL 字段 | 类型 | 一致 |
|--------------|----------|------|------|
| `categories.id` | `id` | UUID PK | ✓ |
| `categories.slug` | `slug` | TEXT UNIQUE | ✓ |
| `categories.name_en` | `name_en` | TEXT | ✓ |
| `categories.name_zh` | `name_zh` | TEXT | ✓ |
| `categories.description` | `description` | TEXT | ✓ |
| `categories.parent_id` (自引用) | `parent_id` | UUID FK→categories | ✓ |
| `categories.product_count` | `product_count` | INT | ✓ |
| `categories.hot_score` | `hot_score` | REAL | ✓ |
| `categories.display_order` | `display_order` | INT | ⚠️ 见下 |
| `categories.icon` | `icon` | TEXT | ✓ |
| `product_signals.product_id` | `product_id` | UUID FK | ✓ |
| `product_signals.signal_id` | `signal_id` | UUID FK | ✓ |
| `product_signals.relevance` (0-1) | `relevance` (0-1 CHECK) | REAL | ✓ |

**字段差异**:
- ⚠️ **PRD A-3 描述 `display_order` 为"展示顺序"**, 暗示全局唯一或父子唯一
- ⚠️ **DDL 无 UNIQUE 约束**, 仅 `idx_categories_display_order` 索引
- **影响**: 同 `display_order` 可重复, 排序时出现不确定性
- **建议**: 加 `UNIQUE (parent_id, display_order)` PARTIAL UNIQUE (排除 NULL parent)
- **Fix Owner**: DB

### 1.4 API 契约 §5.1 (subscribe) ↔ `newsletter_subscriptions` DDL

| API 字段 | DDL 字段 | 一致 |
|----------|----------|------|
| `email` (必填) | `email` TEXT NOT NULL | ✓ |
| `frequency` ('daily'\|'weekly') | `frequency` CHECK (同上) | ✓ |
| `language` ('en'\|'zh') | `language` CHECK (同上) | ✓ |
| `source` | `source` TEXT | ✓ |
| `confirmation_token` (自动) | `confirmation_token` UNIQUE | ✓ |
| `unsubscribe_token` (自动) | `unsubscribe_token` UNIQUE | ✓ |

**严重冲突**:
- 🔴 **DDL `email` 字段有 `UNIQUE` 约束** (line 201-202)
- 🔴 **ADR-04 / R6 描述**: "退订用 `unsubscribed_at` 软标记, 不物理删除; 重订阅时清空 `unsubscribed_at`"
- **冲突**: UNIQUE 约束在用户退订后**无法**重订阅同名邮箱, 因为旧记录仍占用 UNIQUE
- **影响**: 用户退订后再订阅会触发 4006 错误
- **解决方案候选**:
  1. 改 UNIQUE 为部分索引 `UNIQUE (email) WHERE unsubscribed_at IS NULL`
  2. 退订时硬删除 + unsubscribe_token 审计表
  3. 接受"退订即永久", 引导用新邮箱
- **建议**: 选方案 1 (最少改动, 符合 PRD 设计意图)
- **Fix Owner**: DB

### 1.5 API 契约 §5.2 (confirm) ↔ 错误码

**严重冲突**:
- 🔴 **T05 验收 #6 (任务文档) 写**: "确认 token 失效 → 4007"
- 🔴 **API 契约 §5.2 仅定义**: 4000 (token 缺失) / 4003 (token 不存在/已用)
- 🔴 **全局错误码 §0.2**: 4007 = "限流触发" (subscribe 端点专用)
- **影响**: T05 任务文档与 API 契约矛盾, 测试用例 T05-006 须按 API 契约改写 (不能断言 4007)
- **解决方案**:
  - 若 confirm 端点确有限流需求, 应在 API 契约 §5.2 显式定义 4007
  - 若无, 应将 T05 验收文档第 6 条措辞改为 "token 不存在/失效 → 4003"
- **建议**: 选后者 (W1 不在 confirm 端点加限流)
- **Fix Owner**: Doc (任务文档) 或 Doc (API 契约)

---

## 2. ADR 一致性检查

### 2.1 ADR-02 (pg_net 异步推送) ↔ 实际实现

| ADR-02 原则 | 实现 | 一致 |
|-------------|------|------|
| launch_events INSERT → /webhook/launch | `fn_launch_events_notify_push_worker` 触发器 | ✓ |
| 异步, 不阻塞 INSERT | pg_net async_get + EXCEPTION WHEN OTHERS 降级 | ✓ |
| 来源白名单 PH/HN/GitHub | `source IN ('producthunt', 'hackernews', 'github')` | ✓ |
| confidence ≥ 0.6 | `confidence >= 0.6` | ✓ |
| event_type = 'launch' | `event_type = 'launch'` | ✓ |

**结论**: ADR-02 完全实现, 无矛盾。

### 2.2 ADR-04 (categories + products.category 并存)

**设计意图**:
- L1 分类用 `categories` 表 (Phase E 引入)
- L1 产品用 `products.category` 字符串字段 (Phase C 已存在)
- **共存**: 新老并存, 渐进迁移

**问题**:
- ⚠️ ADR-04 说 "渐进迁移", 但 seed `seed-phase-e-products-40.sql` 同时:
  - 设置 `category` 字符串字段 (如 'LLM', 'AI Image')
  - 没有写入 `product_categories` 关联表
- **影响**:
  - 数据模型存在两套分类信息, 但无关联桥
  - L2 子分类 (categories L2) 与 products 不关联
  - L1 产品无法从 categories.slug 直接查到
- **测试可见影响**:
  - `/categories` 页无法显示某 category 下的 product 列表 (无 JOIN 路径)
  - 验收标准未量化 "categories L2 关联 ≥ X 个产品"
- **建议**: 增加 product_categories 桥表 (product_id, category_id), 或验收 T10/T11 接受字符串匹配
- **Fix Owner**: 架构师决策 (Doc / DB)

### 2.3 ADR-07 (Server Component) ↔ T06 (Pricing)

**ADR-07**: 列表/详情用 RSC, 表单/交互用 Client

**T06 验证**:
- `/pricing/page.tsx` RSC ✓
- `PricingCards.tsx` Client (因 CTA 按钮交互) ✓
- i18n 字典在 RSC 渲染 ✓

**结论**: 一致。

### 2.4 ADR-08 (PaywallGate 客户端) ↔ T07 (NewsletterForm)

**ADR-08**: paywall 在客户端判断 + 后端兜底

**T07 验证** (未实现, 仅预测):
- NewsletterForm 是 Client ✓
- 提交时直接调 /api/newsletter/subscribe ✓
- 错误处理: 显示 code + message ✓

**结论**: 设计合理, W2 验证。

---

## 3. 推送链路 ≤5min (PRD A-2 验收) — 严重风险

### 问题描述
PRD A-2 验收: "推送链路端到端 ≤5min (含触发器 + push-worker + 邮件 mock)"

### 实际实现
1. `launch_events` INSERT → 触发器 → pg_net.http_post
2. pg_net 调用 `/webhook/launch` (Vercel Function, 冷启动 1-3s)
3. push-worker mock 写日志 (Phase E mock, 实际 W3 T25)

### 风险点
- 🔴 **staging 环境未实测**: 触发器 T01-008/009 仅能本地测试, 但本地无 pg_net 扩展
- 🔴 **Vercel 冷启动**: 若 webhook 路由 24h 无调用, 冷启动可能 5-10s
- 🔴 **网络抖动**: pg_net → Vercel Function (外网) 单向调用, 跨区延迟未知
- 🟡 **降级路径**: pg_net 异常时 RAISE NOTICE 但不重试, 事件丢失

### 测试矩阵覆盖
- T01-008/009 已覆盖触发器条件 + 降级
- **未覆盖** 端到端延迟测试 (需 W3 T25 完成后)
- **建议**: W2 加 1 个冒烟测试: "INSERT launch_events → 30s 内推送日志可见"
- **Fix Owner**: QA (补测试) / 架构师 (评估 SLA 风险)

---

## 4. 问题分类

### P0 (阻塞)

| # | 问题 | 位置 | 修复方向 | Owner |
|---|------|------|----------|-------|
| P0-1 | newsletter UNIQUE 邮箱与软退订策略冲突 | `002_*.sql` line 201-202 + ADR-04 R6 | 改部分 UNIQUE 索引 | DB |
| P0-2 | T05 验收 4007 与 API 契约 §5.2 不一致 | `phase-e-task-breakdown.md` T05 #6 vs `phase-e-api-contracts.md` §5.2 | 修订任务文档或 API 契约 | Doc |
| P0-3 | 推送 ≤5min 端到端无 staging 验证 | PRD A-2 + ADR-02 | W2 补冒烟测试 | QA + 架构师 |

### P1 (重要)

| # | 问题 | 位置 | 修复方向 | Owner |
|---|------|------|----------|-------|
| P1-1 | PRD A-1 event_type 5 种 vs DDL 6 种 (pricing_change) | PRD + DDL line 62 | 增补 PRD 或删除 DDL | Doc / DB |
| P1-2 | PRD A-2 status 3 种 vs DDL 4 种 (expired) | PRD + DDL line 106 | 增补 PRD 或删除 DDL | Doc / DB |
| P1-3 | ADR-04 双套分类无桥表, /categories 页无法 JOIN | ADR-04 + 缺 product_categories 表 | 评估是否需要桥表 | 架构师 |
| P1-4 | categories display_order 无 UNIQUE 约束 | DDL line 134 | 加 UNIQUE (parent_id, display_order) | DB |
| P1-5 | seed 拆分 4 文件, 跨文件依赖强 | seed 文件依赖 | 文档化执行顺序 (已做, 但易出错) | DB |

### P2 (建议)

| # | 问题 | 位置 | 修复方向 | Owner |
|---|------|------|----------|-------|
| P2-1 | 触发器白名单仅 3 源 (PH/HN/GitHub), X/arXiv/HF 不触发 | `002_*.sql` line 237 | 评估是否扩大 | 架构师 |
| P2-2 | Newsletter 邮件 mock 仅写日志, 端到端验证受限 | push-worker | W3 T25 接入后补测 | QA |
| P2-3 | Rate Limit 留 `// TODO: 接 Vercel KV` 占位 | `lib/rateLimit.ts` | W2 评估是否 mock KV | 架构师 |
| P2-4 | pg_net 异常仅 RAISE NOTICE, 无重试 | `002_*.sql` line 290 | 评估 W3 加重试队列 | 架构师 |

---

## 5. 测试可见的盲点 (模糊验收标准)

> 这些验收标准"看似明确但实际不可量化", QA 难以客观 PASS/FAIL, 需架构师补强定义

| # | 任务 | 模糊表述 | 建议补强 |
|---|------|----------|----------|
| BL-1 | T04 README | "3 入口卡片 ASCII 图" | 缺图模板, 建议给 1 个参考图样 |
| BL-2 | T04 README | "数据流图" | 缺图表形式 (Mermaid? ASCII? 链接?) |
| BL-3 | T05 | "邮件 mock 触发" | 无验证标准 (写日志? console.log? 文件?) |
| BL-4 | T05 | "邮箱防抖校验" | 未定义防抖时长 (200ms? 500ms?) |
| BL-5 | T06 | "i18n 完整" | 未列具体字段 (是否含 FAQ 文案? 错误信息?) |
| BL-6 | T06 | "桌面 3 列 / 平板 2 列 / 手机 1 列" | 缺断点值 (md? lg? 自定义?) |
| BL-7 | T06 | "Lighthouse 性能 ≥ 90, SEO ≥ 95" | 未明确 mobile/desktop 模式 |
| BL-8 | T07 | "3 使用位点" | 缺组件复用率指标 |
| BL-9 | T08 | "步骤含" | 缺步骤编号/截图位置精确到行 |
| BL-10 | T09 | "EXPLAIN 走索引" | 未明确"走索引"判定 (Index Scan? Bitmap?) |

---

## 6. 跨文档引用一致性

### 6.1 文件路径引用

| 引用位置 | 引用目标 | 是否存在 | 一致 |
|----------|----------|----------|------|
| task-breakdown T01 | `supabase/migrations/002_launch_events_and_trend_signals.sql` | ✓ | ✓ |
| task-breakdown T03 | `supabase/seed-phase-e-200.sql` 等 4 文件 | ✓ | ✓ |
| task-breakdown T05 | `frontend/src/app/api/newsletter/subscribe/route.ts` | 待 Alex 创建 | ⚠️ |
| task-breakdown T06 | `frontend/src/app/pricing/page.tsx` | 待 Alex 创建 | ⚠️ |
| task-breakdown T06 | `frontend/src/messages/en.json` | 需存在 (既有) | ⚠️ |
| task-breakdown T07 | `frontend/src/components/NewsletterForm.tsx` | 待 Alex 创建 | ⚠️ |
| task-breakdown T08 | `docs/deploy.md` | 待 Doc 创建 | ⚠️ |
| api-contracts §0.1 | "具体定义见 4 份架构文档" | ✓ | ✓ |
| api-contracts §0.4 | "留 `lib/rateLimit.ts` 占位" | 待 Alex 创建 | ⚠️ |

### 6.2 表名引用

| 引用 | 出现位置 | 一致 |
|------|----------|------|
| `launch_events` | PRD / ADR / API / DDL / Seed | ✓ |
| `trend_signals` | PRD / ADR / API / DDL / Seed | ✓ |
| `categories` | ADR-04 / API / DDL / Seed | ✓ |
| `product_signals` | PRD A-3 / API / DDL / Seed | ✓ |
| `newsletter_subscriptions` | PRD B-2 / API / DDL | ✓ |
| `user_profiles` | ADR-07 / API / DDL (Part 1) | ✓ |
| `push_channels` | ADR-06 注释中 | ⚠️ 实际无此表 |

**P2 备注**: ADR-06 注释提到 `newsletter_subscriptions (与 push_channels 分离)`, 但 Supabase Schema 中无 `push_channels` 表, 仅 webhook 概念存在。注释应改为"与 webhook 推送链路分离"。

---

## 7. 错误码交叉一致性

| 错误码 | 全局定义 (api-contracts §0.2) | 各端点引用 | 一致 |
|--------|-------------------------------|------------|------|
| 4000 通用参数 | ✓ | §1 / §2 / §5.1 | ✓ |
| 4001 字段格式 | ✓ | §1.1 / §1.2 / §2.1 / §5.1 | ✓ |
| 4002 必填缺失 | ✓ | §5.1 | ✓ |
| 4003 资源不存在 | ✓ | §1.2 / §3.1 / §4.1 / §5.2 | ✓ |
| 4004 鉴权失败 | ✓ | §5.2? (T05 误用) / §7.1 / §7.2 | ⚠️ |
| 4005 无权限 | ✓ | §7.2 | ✓ |
| 4006 重复订阅 | ✓ | §5.1 | ✓ |
| 4007 限流 | ✓ | §0.4 / **T05 #6 误用** | 🔴 |
| 5000 服务端 | ✓ | (未显式使用) | - |
| 5001 数据库 | ✓ | (未显式使用) | - |
| 5002 邮件失败 | ✓ | (Phase E 不触发) | - |

**冲突**: T05 任务文档"确认 token 失效 → 4007"违反 §0.2 (4007 是限流), 已在 P0-2 列出。

---

## 8. 兼容性检查

### 8.1 既有 63 条 products 兼容

**风险点**:
- T03 seed 新增 40 条, 既有 63 条
- 触发器 ON CONFLICT 依赖 (source, source_id) — 新 events 不影响
- categories 表新建, 与 products.category 字符串字段**独立** (ADR-04)

**测试覆盖**: T03-001/REG-001 已覆盖

### 8.2 既有 API 端点兼容

**风险点**:
- 12 个新端点都是新建, 既有端点未列入修改
- `/api/products/:id/signals` 端点 §4 是新建, 不影响既有 products 路由

**结论**: 无破坏性变更, 旧 API 行为不变。

### 8.3 既有 001_initial_schema.sql 兼容

**DDL Part 1**:
```sql
ALTER TABLE user_profiles
  ALTER COLUMN plan SET DEFAULT 'free';
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_plan_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'enterprise'));
```

**兼容性**:
- ✓ 幂等 (DROP IF EXISTS + ADD)
- ⚠️ 若 001 旧 schema 中 `plan` 字段是 enum 类型 (非 TEXT), ALTER COLUMN SET DEFAULT 会失败
- **建议**: 验证 001 中 plan 字段类型

(待验证: 读取 `001_initial_schema.sql` line X 查看)

### 8.4 既有 push-worker 兼容

**风险点**:
- 触发器会调用 `/webhook/launch` 端点
- push-worker 需有对应 handler
- 端点鉴权需 `X-AI-Radar-Source: launch_events_trigger` header
- **状态**: W3 T25 任务待 W1 完成后启动

**测试覆盖**: T01-008/009 已覆盖触发器, T25 端到端未覆盖

---

## 9. 测试覆盖建议 (W2 端到端前置条件)

| 建议 | 优先级 | Owner |
|------|--------|-------|
| 验证 001_initial_schema.sql 中 plan 字段类型 (TEXT vs ENUM) | P0 | DB |
| 修订 T05 任务文档 #6 (4007 → 4003) | P0 | Doc |
| newsletter UNIQUE 改部分索引 | P0 | DB |
| 补 PRD A-1 event_type 6 种 / status 4 种 | P1 | Doc |
| 评估 categories 桥表 (product_categories) | P1 | 架构师 |
| 补 display_order UNIQUE 约束 | P1 | DB |
| W2 推送链路冒烟测试 (INSERT → 30s 日志) | P0 | QA |
| 12 端点冒烟脚本 (REG-005 实施) | P0 | QA |

---

## 10. 签收结论

**评审结论**: 🟡 **有条件通过**

**条件**:
1. P0-1 / P0-2 必须在 W2 启动 (T10) 前修复或书面确认接受风险
2. P0-3 (推送延迟) 由 W2 冒烟测试覆盖, 不阻塞 W1 签收
3. P1 类问题 W3 前修完即可

**建议流程**:
1. 架构师高见远确认 P0-1/2 修复方案
2. DB 工程师寇豆码执行 DDL 修订
3. 文档修订同步
4. QA 回归测试矩阵 (本文件 §1.4/1.5)
5. W1 签收 → W2 启动

---

**最后更新**: 2026-05-31 (架构评审 v1)
**作者**: 严过关 (QA Engineer)
**下次评审**: W2 完成后 (T20 启动前)

---

## 11:33 — W1 架构偏差评估

对照 `docs/phase-e-api-contracts.md` 11 个 W1 新 endpoint:

| # | Endpoint | 契约 | 实现状态 |
|---|----------|------|---------|
| 1 | GET /api/launches | §1.1 | ⏳ 待工程师交付 |
| 2 | GET /api/launches/[id] | §1.2 | ⏳ |
| 3 | GET /api/trends | §2.1 | ⏳ |
| 4 | GET /api/categories | §3.1 | ⏳ |
| 5 | GET /api/products/[id]/signals | §4.1 | ⏳ |
| 6 | POST /api/newsletter/subscribe | §5.1 | ⏳ |
| 7 | GET/POST /api/newsletter/confirm | §5.2 | ⏳ |
| 8 | POST /api/newsletter/unsubscribe | §5.3 | ⏳ |
| 9 | GET /api/pricing | §6.1 | ⏳ |
| 10 | GET /pricing | - | ⏳ |
| 11 | README v9.1 | - | ⏳ |

**架构决策**:
- 4006 重复: partial unique index + upsert
- Mock email: console.log（prod 换 Resend）
- /pricing: server component + 客户端 toggle

**待验证** (工程师交付后跑 w1-smoke-extended.sh):
- 全部 case 期望 200/201 + code: 0
- case 19 重复订阅期望 200 + code: 4006
- /pricing HTML 含 "Starter" "Pro" "Enterprise"
