# Phase A — 前端真实数据连通验证审计报告

**审计范围**: 9 个页面 + 7 个核心 API + 类型定义 + Supabase 客户端
**审计时间**: 2026-05-29
**结论**: 数据通路已通，但有 **1 个会让所有详情页 404 的 P0 Bug**，3 个 API 行为偏差，4 处 mock 数据泄漏，2 处类型漂移风险。

---

## 0. TL;DR

| 等级 | 数量 | 说明 |
|------|------|------|
| 🔴 P0 | 1 | `ProductCard` 详情链接用 `id` 而非 `slug` → 所有产品卡片点开即 404 |
| 🟠 P1 | 3 | API 分页总数永远 0；`/api/trends/*` 忽略 `range` 参数；`/api/trends/wordcloud` 在 `tags=null` 时崩溃 |
| 🟡 P2 | 4 | `discover/[slug]` 硬编码接口、trends/dashboard/watchlist 大量 mock 数据 |
| ⚪ P3 | 2 | 类型微漂移（`(p as any)`）、`getConfidenceLevel` 适配层风险 |

---

## 1. 数据通路总览

```
┌──────────────┐     HTTP/JSON      ┌────────────────┐   Supabase JS   ┌──────────────┐
│  Page (CSR)  │ ──────────────────▶│ /api/* (Next)  │ ───────────────▶│  PostgreSQL  │
│ discover,    │  /api/products     │                │                 │  products    │
│ compare,     │  /api/products/    │  Route Handler│                 │  watchlist   │
│ trends,      │    [slug]          │  (Edge/Node)   │                 │  push_chan.  │
│ watchlist,   │  /api/products/    │                │                 │  user_prof.  │
│ dashboard    │    search          │                │                 │              │
└──────────────┘                    └────────────────┘                 └──────────────┘
       ▲
       │ generateMetadata() 期间 server-component 直连 supabase
       │
┌──────────────┐
│  Page (SSR)  │  ── supabase 直连 ──▶ PostgreSQL
│ discover/    │
│   [slug]     │
└──────────────┘
```

**已确认 schema 字段**（`Database['public']['Tables']['products']['Row']`）:
- `slug` ✅ `last_seen` ✅ `github_stars` ✅ `weekly_growth_rate` ✅ `monthly_growth_rate` ✅
- `validation_signals` (jsonb) ✅ `commercialization_status` ✅ `founder_info` ✅ `funding_stage` ✅
- 34 个字段，**全部覆盖前端读取需求**

---

## 2. 🔴 P0 致命 Bug — 详情链接全错

### 2.1 `ProductCard.tsx:151` 使用 `id` 而非 `slug`

**当前代码**（`frontend/src/components/ProductCard.tsx` 第 151 行）:

```tsx
<Link href={`/discover/${id}`} className="...">
  {tCommon('details')}
</Link>
```

**问题**: 动态路由是 `/discover/[slug]/page.tsx`，但这里传的是产品的 `id`（UUID）。`slug` 是 URL 友好的字符串标识。**结果：所有 "详情" 链接点击直接 404**。

**修复**:

```tsx
<Link href={`/discover/${slug}`} className="...">
  {tCommon('details')}
</Link>
```

**影响范围**:
- `discover/page.tsx` 调用 ProductCard
- `watchlist/page.tsx` 调用 ProductCard
- **用户从首页或收藏页点任何产品 → 直接 404**

### 2.2 验证步骤

```bash
cd frontend
npm run dev
# 浏览器打开 http://localhost:3000/discover
# 任意点一个产品的"详情"按钮 → 应该看到 404 页面
```

---

## 3. 🟠 P1 — API 行为偏差

### 3.1 `/api/products` 分页总数永远为 0

**位置**: `frontend/src/app/api/products/route.ts:51`

```ts
const { data: products, error, count } = await query;
```

**问题**: Supabase JS 默认 `count` 是 `'none'`，**必须显式传 `'exact'` 才会返回总数**。当前代码拿到的 `count` 永远 `null`，所以前端拿到的 `pagination.total = 0`，分页组件会算成"总共 0 页"。

**修复**:

```ts
let query = supabase
  .from('products')
  .select('*', { count: 'exact' })   // ← 加 count
  .eq('availability_status', 'active');
```

### 3.2 `/api/trends/top20` 和 `/api/trends/wordcloud` 忽略 `range`

**位置**: `frontend/src/app/api/trends/top20/route.ts:11` & `wordcloud/route.ts:11`

```ts
const range = searchParams.get('range') || '7d';
// 然后 ... 后面没有用 range
```

**问题**: 接受 `range=24h|7d|30d` 参数但完全没用到 SQL 查询里。前端 `trends/page.tsx` 切时间范围 tab 时**实际不换数据**。

**修复方案**（需要先在 schema 加 `weekly_growth_rate_24h` / `weekly_growth_rate_30d` 三档，或加 `metric_snapshots` 表）:

```ts
// 临时方案：直接根据 range 决定排序字段（假设 schema 加了对应字段）
const rangeToField: Record<string, string> = {
  '24h': 'growth_24h',
  '7d':  'weekly_growth_rate',
  '30d': 'monthly_growth_rate',
};
const field = rangeToField[range] || 'weekly_growth_rate';

let query = supabase
  .from('products')
  .select('*', { count: 'exact' })
  .eq('availability_status', 'active')
  .not(field, 'is', null)
  .order(field, { ascending: false })
  .limit(20);
```

> **建议**: 在 `phase A.2 schema 增量` 里新增 `growth_24h` 字段（来自 cron 每小时计算），或加 `product_metrics_snapshots` 表。

### 3.3 `/api/trends/wordcloud` 在 `tags=null` 时崩溃

**位置**: `frontend/src/app/api/trends/wordcloud/route.ts:27`

```ts
for (const tag of product.tags) {     // ← 如果 product.tags 是 null，迭代会抛
  tagCounts.set(tag, (tagCounts.get(tag) || 0) + weight);
}
```

**问题**: schema 里 `tags string[]` 允许数据库 `NULL`（虽然类型是数组，但 Postgres 没强约束）。如果有产品 `tags=NULL`，这条 API 整个 500。

**修复**:

```ts
for (const product of products || []) {
  if (product.availability_status !== 'active') continue;
  if (!Array.isArray(product.tags) || product.tags.length === 0) continue;
  const weight = (product.weekly_growth_rate ?? 0) * 100 + (product.confidence_score / 10);
  for (const tag of product.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + weight);
  }
}
```

---

## 4. 🟡 P2 — Mock 数据泄漏到真实页面

| 文件 | 行号 | 现状 | 风险 | 建议 |
|------|------|------|------|------|
| `trends/page.tsx` | 226-247 | `decliningProducts: TrendProduct[]` 和 `stableProducts: TrendProduct[]` 硬编码 8 个假产品 | 用户切到"下滑/稳定" tab 看到假数据 | 改成真实查询：`weekly_growth_rate < 0` (下滑) / `Math.abs(weekly_growth_rate) < 5` (稳定) |
| `trends/page.tsx` | 115-152 | `generateLineChartData()` 用 seeded random 画线 | 30天趋势图是假图 | 改查 `metric_snapshots` 表（需要新增） |
| `trends/page.tsx` | 155-166 | `generateBarChartData()` 硬编码 8 个中文分类 | 分类分布柱状图是假的 | 改成 `groupBy(category).count(*)` |
| `dashboard/page.tsx` | 11-27 | `DATA_SOURCES` 数组硬编码 11 个数据源 + 状态 | 数据源管理页面是假 UI | 接 `data_sources` 表（需要新增 schema）或用 env 读 |
| `dashboard/page.tsx` | 337-338 | `Math.random()` 生成 Items 数和 last fetch | 数据源监控数字是假的 | 改查 `crawl_logs` 表（需要新增 schema） |
| `watchlist/page.tsx` | 130+ | `generateActivities()` 用 `Math.random()` 拼活动 | "最近活动"全是假 | 接 `activity_log` 表（需要新增 schema） |
| `admin/page.tsx` | 全文 | 4 个 stat + 3 个 pending review 全硬编码 | 管理后台是纯占位 | 优先做"数据源监控" + "产品审核"两个子页面 |

**总体策略**: 不要在 phase A 全部修，先把 **trends 三个假图**（用户首次访问 100% 会看到）和 **watchlist 活动**修掉，其余归到 P3 backlog 配合新增 schema 一起做。

---

## 5. ⚪ P3 — 类型/接口漂移

### 5.1 `discover/[slug]/page.tsx` 硬编码 `ProductDetail` interface

```ts
// 第 6-34 行
interface ProductDetail {
  id, slug, name, name_en, name_zh, description, description_en, description_zh,
  website_url, github_url, logo_url, category, subcategory, tags, tech_stack,
  pricing_model, availability_status, confidence_score, confidence_level,
  validation_signals, source_count, weekly_growth_rate, monthly_growth_rate,
  github_stars, launch_date, created_at, updated_at
  // ↑ 缺了: last_seen, commercialization_status, funding_stage, founder_info, pricing_url
}
```

**风险**: schema 后续加字段（比如 `founder_info` 已经在类型里，但这里没列），**这个文件会静默丢数据**，TypeScript 不会报错（因为 `select('*')` 返回的完整对象被塞进 `ProductDetail` 时，TypeScript 只检查已知字段多余不检查）。

**修复**:

```ts
// 直接用生成的类型
import { Database } from '@/lib/supabase/types';
type ProductDetail = Database['public']['Tables']['products']['Row'];
```

### 5.2 `(p as any).slug` / `(p as any).github_stars`

**位置**:
- `trends/page.tsx:412` — `(p as any).slug || p.id`
- `watchlist/page.tsx:56, 81, 86` — `(p as any).slug` / `(p as any).github_stars`

**真相**: 这些字段在 schema 和生成类型里**都已经存在**。`as any` 是开发期间没认出来时的临时补丁，**应该删掉**。

**修复**:

```ts
// trends/page.tsx
href={`/discover/${p.slug || p.id}`}

// watchlist/page.tsx
href={`/discover/${p.slug || p.id}`}
{p.github_stars?.toLocaleString()}
```

---

## 6. ✅ 已经做对的事

| 维度 | 现状 |
|------|------|
| TypeScript 严格模式 | ✅ `tsconfig.json` + `tsc` 通过 |
| 国际化 | ✅ `next-intl` + `messages/{en,zh}.json` 双语 |
| Schema 类型生成 | ✅ 全部用 `Database['public']['Tables']['products']['Row']`（除 [slug] 页外）|
| 服务端组件直连 | ✅ `discover/[slug]/page.tsx` 用 `generateMetadata` 服务端渲染 + JSON-LD |
| 鉴权兜底 | ✅ watchlist API 在 `getUser()` 失败时返回空数组（不阻塞） |
| zod 验证 | ✅ watchlist POST/DELETE 校验 `product_id: uuid` |
| 错误码分流 | ✅ `PGRST116` (404) / `23505` (409 重复) 分别处理 |
| 唯一索引保护 | ✅ watchlist 表 23505 提示"已收藏" |

---

## 7. 本地启动验证清单

### 7.1 前置条件

```bash
# 1. 环境变量（你已经在 .env.local 里有）
cd frontend
cat .env.local    # 确认:
#   NEXT_PUBLIC_SUPABASE_URL=https://prwqhfahtqfmosmslgon.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 2. 安装依赖
npm install

# 3. 验证 schema 已上
# (已经在上一阶段用 PAT 执行了 init.sql，63 个种子产品已写入)
```

### 7.2 启动 + 冒烟测试

```bash
npm run dev
# 终端 1 启动 next dev (port 3000)
```

**冒烟测试用例**:

| # | 操作 | 预期 |
|---|------|------|
| 1 | 访问 `/` | 落地页加载，无报错 |
| 2 | 访问 `/discover` | 看到 20 个产品卡片（图、名称、分类、信心分）|
| 3 | 点任意产品"详情"按钮 | ✅ 应进入 `/discover/<slug>` 详情页（P0 修复前会 404）|
| 4 | 访问 `/discover/chatgpt` (或任意已知 slug) | 看到完整产品页 + JSON-LD |
| 5 | 访问 `/compare?ids=id1,id2` | 看到对比表格 + 雷达图 |
| 6 | 访问 `/trends` | 词云 + Top 20 显示（24h/7d/30d 切 tab 看是否换数据 — P1 修复前不换）|
| 7 | 访问 `/dashboard` | 看到 11 个数据源列表（状态/Items 是假的 — P2）|
| 8 | 访问 `/watchlist` | 空状态（未登录）或产品列表（已登录）|
| 9 | 访问 `/admin` | 占位页（接受，纯 mock）|

### 7.3 API 独立测试

```bash
# 验证分页
curl "http://localhost:3000/api/products?page=1&limit=5" | jq '.pagination'
# 修复前: { "total": 0, "totalPages": 0 }   ← bug
# 修复后: { "total": 63, "totalPages": 13 }  ← 正确

# 验证搜索
curl "http://localhost:3000/api/products/search?q=ai" | jq '.products | length'
# 期望: 20 (limit 20)

# 验证趋势
curl "http://localhost:3000/api/trends/top20?range=7d" | jq '.products | length'
curl "http://localhost:3000/api/trends/top20?range=30d" | jq '.products | length'
# 修复前: 两个返回完全一样（range 被忽略）
# 修复后: 返回不同排序结果

# 验证 wordcloud 容错
curl "http://localhost:3000/api/trends/wordcloud?range=7d" | jq '.tags | length'
# 修复前: 可能 500 (有 null tags) 或 200
# 修复后: 永远 200
```

---

## 8. 优先级修复路线图

### 🚀 一次 commit 干掉（30 分钟）
1. **P0** `ProductCard.tsx:151` — `id` → `slug`
2. **P1.1** `api/products/route.ts:15` — `select('*', { count: 'exact' })`
3. **P1.3** `api/trends/wordcloud/route.ts:27` — 加 `Array.isArray()` 守卫
4. **P3.2** `trends/watchlist` — 删 `(p as any)`

### 📦 配 phase A.2 schema 增量（与 phase C 并行）
5. **P1.2** `api/trends/*` — schema 加 `growth_24h` / `growth_30d` 字段 + route 用
6. **P5.1** `discover/[slug]/page.tsx` — 改用 `Database['public']['Tables']['products']['Row']`
7. **P2** 3 个 trends 假图 → 真聚合查询
8. **P2** dashboard DATA_SOURCES 改读 `data_sources` 表（需先建表）

### 🗓️ V0.2 backlog
- watchlist 真实活动流（`activity_log` 表）
- admin 真实审核 + 用户管理
- crawler/ 数据源状态实时

---

## 9. 给用户的提醒清单

> ⚠️ **上线前必做**:
> 1. 把 P0 (ProductCard 链接) 修了再发布，否则 100% 流量进 404
> 2. 修 P1.1 (分页) — 否则分页器坏了用户会以为只有一页数据
> 3. 撤回 supabase PAT: https://supabase.com/dashboard/account/tokens (上一轮提醒过)

---

**审计人**: 齐活林（Delivery Director）
**下一步**: 进入 Phase B — 竞品差距分析（5-7 个 AI 工具目录站）
