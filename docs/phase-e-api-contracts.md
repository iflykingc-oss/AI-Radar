# AI Radar — Phase E API 契约

> **作者**: 高见远 (Architect)
> **日期**: 2026-05-30
> **范围**: A 线 6 endpoint + B 线 5 endpoint + 1 webhook = 12 个端点
> **基础路径**: `/api` (Next.js App Router 下 `frontend/src/app/api/**/route.ts`)
> **统一响应格式**: `{ "code": 0, "data": ..., "message": "ok" }` 成功 / `{ "code": 4xxx, "data": null, "message": "..." }` 失败

---

## 0. 全局约定

### 0.1 统一响应结构

```json
// 成功
{ "code": 0, "data": <payload>, "message": "ok" }

// 失败
{ "code": 4001, "data": null, "message": "Invalid email format" }
```

| 字段 | 类型 | 含义 |
|------|------|------|
| code | int | 0=成功; 4xxx=客户端错; 5xxx=服务端错 |
| data | object/array/null | 业务数据, 失败时 null |
| message | string | 人类可读消息, 英文 |

### 0.2 错误码清单 (全 API 共用)

| Code | 含义 | HTTP Status |
|------|------|-------------|
| 0 | 成功 | 200/201 |
| 4000 | 通用参数错误 | 400 |
| 4001 | 字段格式错误 (email/range 等) | 400 |
| 4002 | 必填字段缺失 | 400 |
| 4003 | 资源不存在 | 404 |
| 4004 | 鉴权失败 | 401 |
| 4005 | 无权限 | 403 |
| 4006 | 重复订阅 | 409 |
| 4007 | 限流触发 | 429 |
| 5000 | 服务端通用错误 | 500 |
| 5001 | 数据库错误 | 500 |
| 5002 | 邮件发送失败 (mock 阶段不触发) | 502 |

### 0.3 鉴权矩阵

| 端点 | anon | authenticated | service_role |
|------|------|---------------|--------------|
| `GET /api/launches` | ✅ | ✅ | ✅ |
| `GET /api/launches/:id` | ✅ | ✅ | ✅ |
| `GET /api/trends` | ✅ | ✅ | ✅ |
| `GET /api/trends/:id` | ✅ | ✅ | ✅ |
| `GET /api/categories` | ✅ | ✅ | ✅ |
| `GET /api/products/:id/signals` | ✅ | ✅ | ✅ |
| `POST /api/launches` | ❌ | ❌ | ✅ (crawler) |
| `POST /api/newsletter/subscribe` | ✅ | ✅ | ✅ |
| `GET /api/newsletter/confirm` | ✅ (token) | ❌ | ✅ |
| `GET /api/pricing` | ✅ | ✅ | ✅ |
| `POST /api/admin/plan-switch` | ❌ | ❌ | ✅ (admin) |
| `GET /api/admin/plan` | ❌ | ✅ (own) | ✅ |
| `POST /webhook/launch` | ❌ | ❌ | ✅ (pg_net 内部) |

### 0.4 Rate Limit (Phase E mock, 留接口)

| 端点 | anon | authenticated |
|------|------|---------------|
| `POST /api/newsletter/subscribe` | 5/min/IP | 5/min/user |
| `GET /api/launches` | 60/min/IP | 60/min/user |
| `GET /api/trends` | 60/min/IP | 60/min/user |

实现: 留 `lib/rateLimit.ts` 占位, Phase E 注释 `// TODO: 接 Vercel KV` 不实际生效。

### 0.5 分页

```json
// Request
{ "page": 1, "page_size": 20 }

// Response data 内
{
  "items": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 1234,
    "total_pages": 62,
    "has_next": true
  }
}
```

---

## 1. A 线 — Launches API

### 1.1 `GET /api/launches`

**用途**: `/launches` 页面时间轴数据源; 首页"今日新发布"横滑数据源

**鉴权**: anon / authenticated / service_role 均可

**Request Schema** (Query String):
```typescript
{
  range?: '24h' | '7d' | '30d' | '90d' | 'all'  // 默认 '24h'
  source?: 'producthunt' | 'hackernews' | 'github' | 'x' | 'arxiv' | 'huggingface' | 'rss' | 'xiaohongshu'
  event_type?: 'launch' | 'major_update' | 'open_source' | 'funding' | 'milestone' | 'pricing_change'
  category?: string   // 产品所属 category slug
  min_confidence?: number  // 0-1, 默认 0
  page?: number      // 默认 1
  page_size?: number // 默认 20, 最大 100
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid|null",
        "product_slug": "bolt-new",
        "product_name": "Bolt.new",
        "product_logo_url": "https://...",
        "source": "producthunt",
        "source_url": "https://producthunt.com/posts/bolt-new",
        "event_type": "launch",
        "title": "Bolt.new v2 — AI 全栈开发升级",
        "body": "StackBlitz 推出 Bolt.new v2, 支持一键部署...",
        "author": "Eric Simons",
        "engagement": { "upvotes": 234, "comments": 56 },
        "detected_at": "2026-05-30T06:32:00Z",
        "event_at": "2026-05-30T06:30:00Z",
        "confidence": 0.78
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1234,
      "total_pages": 62,
      "has_next": true
    }
  },
  "message": "ok"
}
```

**错误码**:
- 4000: range 参数非法
- 4001: min_confidence 超出 [0, 1] 范围

---

### 1.2 `GET /api/launches/:id`

**用途**: 详情抽屉 / 直接访问单条 launch event

**鉴权**: anon / authenticated / service_role

**Request Schema** (Path Param):
```
/api/launches/{id}   // UUID
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "product_id": "uuid",
    "product_slug": "bolt-new",
    "product_name": "Bolt.new",
    "source": "producthunt",
    "source_url": "...",
    "event_type": "launch",
    "title": "Bolt.new v2 — AI 全栈开发升级",
    "body": "...",
    "author": "Eric Simons",
    "engagement": { "upvotes": 234, "comments": 56, "stars": null, "retweets": null, "likes": null, "forks": null },
    "detected_at": "2026-05-30T06:32:00Z",
    "event_at": "2026-05-30T06:30:00Z",
    "confidence": 0.78,
    "raw_data": { /* 原平台 payload, 仅 service_role 可看 */ }
  },
  "message": "ok"
}
```

**错误码**:
- 4003: id 不存在或格式错误
- 4000: raw_data 仅 service_role 返回, anon/authenticated 返回 null

---

### 1.3 `POST /api/launches` (crawler 专用)

**用途**: 4 个新爬虫 (GitHub Trending / X / arXiv / HuggingFace) 写入入口

**鉴权**: **service_role only** (用 `SUPABASE_SERVICE_ROLE_KEY`)

**Request Schema**:
```typescript
{
  product_id?: string  // UUID, 可选; 已存在产品时填
  source: 'github' | 'x' | 'arxiv' | 'huggingface'  // 必填
  source_url: string  // 必填
  source_id: string   // 必填, 原平台 ID, 用于去重
  event_type?: 'launch' | 'major_update' | 'open_source' | 'funding' | 'milestone' | 'pricing_change'  // 默认 'launch'
  title?: string
  body?: string
  author?: string
  engagement?: { upvotes?: number, comments?: number, stars?: number, retweets?: number, likes?: number, forks?: number }
  event_at?: string  // ISO 8601; 默认 NOW()
  confidence?: number  // 0-1, 默认 0.5
  raw_data?: object
}
```

**Response Schema** (201 Created):
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "created": true,    // true=新建; false=已存在(去重命中)
    "duplicated_with_id": "uuid"  // duplicated=true 时返回
  },
  "message": "ok"
}
```

**错误码**:
- 4000: source 枚举非法
- 4001: source_id 缺失
- 4004: 鉴权失败 (非 service_role)
- 5001: 唯一约束冲突且 duplicate 处理失败

**去重逻辑**:
- `UNIQUE(source, source_id)` 命中 → 返回 200 `created: false`
- 不命中 → INSERT → 返回 201 `created: true`

---

## 2. A 线 — Trends API

### 2.1 `GET /api/trends`

**用途**: `/trends` 页面数据源; 首页"趋势方向 Top 5"数据源

**鉴权**: anon / authenticated / service_role

**Request Schema** (Query String):
```typescript
{
  range?: '7d' | '30d' | '90d'  // 默认 '7d', 影响 strength/velocity 计算窗口
  signal_type?: 'tag_emerging' | 'category_growing' | 'tech_stack_shift' | 'cluster_new' | 'funding_pattern'
  status?: 'emerging' | 'peaking' | 'cooling' | 'expired'  // 默认排除 expired
  scope_prefix?: string  // 例: 'tag:' | 'category:' | 'stack:'
  min_strength?: number  // 0-100, 默认 0
  page?: number
  page_size?: number  // 默认 20
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "signal_type": "tag_emerging",
        "scope": "tag:agent-orchestration",
        "title": "Agent 编排框架崛起",
        "description": "2025 Q4 起, LangGraph/AutoGen/CrewAI 等框架...",
        "evidence": {
          "products": ["uuid1", "uuid2"],
          "metrics": { "weekly_growth": 0.18, "monthly_launches": 12 },
          "sources": ["github", "producthunt"]
        },
        "strength": 87.5,
        "velocity": 18.2,
        "novelty": 0.82,
        "first_seen": "2025-12-15T00:00:00Z",
        "last_updated": "2026-05-30T06:00:00Z",
        "status": "emerging",
        "product_count": 5
      }
    ],
    "pagination": { "page": 1, "page_size": 20, "total": 40, "total_pages": 2, "has_next": true }
  },
  "message": "ok"
}
```

**错误码**: 4000 (range/signal_type 非法), 4001 (min_strength 超 [0,100])

---

### 2.2 `GET /api/trends/:id`

**用途**: 趋势信号详情 (含关联产品列表)

**鉴权**: anon / authenticated / service_role

**Request Schema** (Path):
```
/api/trends/{id}   // UUID
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "signal_type": "tag_emerging",
    "scope": "tag:agent-orchestration",
    "title": "Agent 编排框架崛起",
    "description": "...",
    "evidence": { "...": "..." },
    "strength": 87.5,
    "velocity": 18.2,
    "novelty": 0.82,
    "first_seen": "2025-12-15T00:00:00Z",
    "last_updated": "2026-05-30T06:00:00Z",
    "status": "emerging",
    "related_products": [
      {
        "product_id": "uuid",
        "slug": "langgraph",
        "name": "LangGraph",
        "logo_url": "https://...",
        "category": "ai-coding",
        "relevance": 0.95
      }
    ]
  },
  "message": "ok"
}
```

**错误码**: 4003 (id 不存在)

---

## 3. A 线 — Categories API

### 3.1 `GET /api/categories`

**用途**: 首页 / Discover 侧边栏分类筛选; `/api/products` 联合查询

**鉴权**: anon / authenticated / service_role

**Request Schema** (Query):
```typescript
{
  parent_id?: string  // UUID, 取子分类
  include_empty?: boolean  // 是否含 product_count=0 的分类, 默认 false
  order_by?: 'display_order' | 'hot_score' | 'product_count'  // 默认 display_order
  lang?: 'en' | 'zh'  // 返回 name 用哪个语言, 默认 'en'
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "slug": "ai-coding",
        "name_en": "AI Coding",
        "name_zh": "AI 编程",
        "description": "AI-assisted code generation and review tools",
        "parent_id": null,
        "product_count": 10,
        "hot_score": 78.5,
        "display_order": 1,
        "icon": "code"
      }
    ],
    "total": 13
  },
  "message": "ok"
}
```

**错误码**: 无 (空数组是合法响应)

---

## 4. A 线 — Product Signals API

### 4.1 `GET /api/products/:id/signals`

**用途**: 单产品详情页"相关趋势信号"模块

**鉴权**: anon / authenticated / service_role

**Request Schema** (Path + Query):
```typescript
{
  id: string  // 产品 UUID
  min_relevance?: number  // 0-1, 默认 0
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "product_id": "uuid",
    "signals": [
      {
        "id": "uuid",
        "signal_type": "tag_emerging",
        "scope": "tag:agent-orchestration",
        "title": "Agent 编排框架崛起",
        "strength": 87.5,
        "status": "emerging",
        "relevance": 0.95
      }
    ]
  },
  "message": "ok"
}
```

**错误码**: 4003 (产品不存在)

---

## 5. B 线 — Newsletter API

### 5.1 `POST /api/newsletter/subscribe`

**用途**: Newsletter 订阅表单提交

**鉴权**: anon / authenticated / service_role

**Request Schema** (Body):
```typescript
{
  email: string  // 必填, RFC 5322 简版
  frequency?: 'daily' | 'weekly'  // 默认 'daily'
  language?: 'en' | 'zh'  // 默认 'en'
  source?: string  // 客户端标识, 例: 'home_hero' | 'pricing_top' | 'launches_empty'
}
```

**Response Schema** (201 Created):
```json
{
  "code": 0,
  "data": {
    "subscription_id": "uuid",
    "email": "user@example.com",
    "frequency": "daily",
    "language": "en",
    "confirmation_required": true,  // 始终 true, 需邮件验证
    "mock_email_sent": true  // Phase E 标识, 表示邮件仅写日志
  },
  "message": "Please check your email to confirm subscription"
}
```

**错误码**:
- 4000: email 格式错
- 4001: frequency/language 非法
- 4002: email 字段缺失
- 4006: 重复订阅 (email 已存在且未退订) → 返回已存在记录 id

**Response 4006 示例**:
```json
{
  "code": 4006,
  "data": {
    "subscription_id": "uuid",
    "already_subscribed": true,
    "frequency": "daily"
  },
  "message": "Email already subscribed"
}
```

---

### 5.2 `GET /api/newsletter/confirm`

**用途**: 邮件中的验证链接点击

**鉴权**: 通过 URL `token` 参数, 不需要 session

**Request Schema** (Query):
```typescript
{
  token: string  // confirmation_token, 必填
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "subscription_id": "uuid",
    "email": "user@example.com",
    "frequency": "daily",
    "confirmed_at": "2026-05-30T07:00:00Z"
  },
  "message": "Subscription confirmed"
}
```

**副作用**:
- `newsletter_subscriptions.confirmed_at = NOW()`
- 触发 push-worker 发送"欢迎订阅"邮件 (mock)

**错误码**:
- 4000: token 缺失
- 4003: token 不存在 / 已使用

---

## 6. B 线 — Pricing API

### 6.1 `GET /api/pricing`

**用途**: `/pricing` 页面 SSR 数据源; 含 i18n 文案

**鉴权**: anon / authenticated / service_role

**Request Schema** (Query):
```typescript
{
  lang?: 'en' | 'zh'  // 默认 'en', 决定 features 描述语言
  cycle?: 'monthly' | 'yearly'  // 默认 'monthly', 决定价格显示
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "currency": "USD",
    "plans": [
      {
        "id": "starter",
        "name_en": "Starter",
        "name_zh": "入门版",
        "tagline_en": "For solo AI enthusiasts",
        "tagline_zh": "适合个人 AI 爱好者",
        "price_monthly": 29,
        "price_yearly": 290,  // 显示为 $24.17/mo (年付)
        "features_en": [
          "Daily digest email",
          "100 product queries / month",
          "Basic watchlist (up to 10 products)"
        ],
        "features_zh": [
          "每日摘要邮件",
          "每月 100 次产品查询",
          "基础 watchlist (最多 10 个产品)"
        ],
        "cta_label_en": "Subscribe now",
        "cta_label_zh": "立即订阅",
        "cta_target": "/api/admin/plan-switch?plan=starter",  // mock
        "highlighted": false
      },
      {
        "id": "pro",
        "name_en": "Pro",
        "name_zh": "专业版",
        "tagline_en": "For serious AI founders",
        "tagline_zh": "适合深度研究的 AI 创业者",
        "price_monthly": 79,
        "price_yearly": 790,
        "features_en": [
          "Everything in Starter",
          "Unlimited validation reports",
          "Trend curve details",
          "Advanced filters",
          "Multi-channel push"
        ],
        "features_zh": [
          "Starter 全部功能",
          "无限验证报告",
          "趋势曲线详情",
          "高级筛选",
          "多端推送"
        ],
        "cta_label_en": "Subscribe now",
        "cta_label_zh": "立即订阅",
        "cta_target": "/api/admin/plan-switch?plan=pro",
        "highlighted": true
      },
      {
        "id": "enterprise",
        "name_en": "Enterprise",
        "name_zh": "企业版",
        "tagline_en": "For teams and funds",
        "tagline_zh": "适合团队和投资机构",
        "price_monthly": 299,
        "price_yearly": 2990,
        "features_en": [
          "Everything in Pro",
          "API access",
          "Team accounts",
          "Custom crawler sources",
          "SLA guarantee"
        ],
        "features_zh": [
          "Pro 全部功能",
          "API 访问",
          "团队账号",
          "自定义爬虫源",
          "SLA 保障"
        ],
        "cta_label_en": "Contact sales",
        "cta_label_zh": "联系销售",
        "cta_target": "mailto:sales@airadar.example.com",
        "highlighted": false
      }
    ],
    "faq": [
      {
        "q_en": "What's the billing cycle?",
        "q_zh": "订阅周期是多久?",
        "a_en": "Monthly or yearly. Yearly saves 20%.",
        "a_zh": "月付或年付, 年付立省 20%。"
      },
      {
        "q_en": "Can I get a refund?",
        "q_zh": "能退款吗?",
        "a_en": "14-day money-back guarantee, no questions asked.",
        "a_zh": "14 天无理由退款。"
      }
    ]
  },
  "message": "ok"
}
```

**错误码**: 4000 (lang/cycle 非法)

---

## 7. B 线 — Admin Plan Switch API (mock)

### 7.1 `POST /api/admin/plan-switch`

**用途**: mock 控制台切换 plan, 不接 Stripe

**鉴权**: **service_role only** (admin token 或 service_role key)

**Request Schema** (Body):
```typescript
{
  user_id: string  // UUID, 必填
  plan: 'free' | 'starter' | 'pro' | 'enterprise'  // 必填
  reason?: string  // mock 备注
}
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "user_id": "uuid",
    "previous_plan": "free",
    "new_plan": "pro",
    "switched_at": "2026-05-30T07:30:00Z",
    "next_action": "redirect_to:/subscription/success?plan=pro"
  },
  "message": "Plan switched (mock)"
}
```

**错误码**:
- 4000: plan 枚举非法
- 4004: 鉴权失败
- 4005: user_id 不存在
- 5001: DB update 失败

**副作用**:
- `user_profiles.plan = NEW`, `updated_at = NOW()`
- 不发邮件 (Phase E mock)
- 不写 audit log (P1 阶段)

---

### 7.2 `GET /api/admin/plan`

**用途**: 当前用户 plan 状态查询 (前端 usePlan() hook 用)

**鉴权**: authenticated (仅查自己) / service_role

**Request Schema** (Header):
```
Authorization: Bearer <supabase_jwt>
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "plan": "free",
    "plan_updated_at": "2026-05-15T10:00:00Z",
    "is_pro": false,
    "is_enterprise": false
  },
  "message": "ok"
}
```

**错误码**:
- 4004: 未登录
- 4003: 用户不存在

---

## 8. Webhook — `/webhook/launch` (push-worker 内部)

### 8.1 `POST /webhook/launch`

**用途**: pg_net 触发器调用, push-worker 接收后分发

**鉴权**: **service_role** (或内部 IP 白名单; Phase E 简化: Header `X-AI-Radar-Source: launch_events_trigger` 必填)

**Request Schema** (Body, 来自 pg_net):
```typescript
{
  event_id: string        // launch_events.id
  product_id: string|null
  source: string          // producthunt|hackernews|github
  source_url: string
  event_type: 'launch'
  title: string
  body: string|null
  engagement: object
  detected_at: string     // ISO 8601
  event_at: string|null
  confidence: number
}
```

**Request Headers**:
```
Content-Type: application/json
X-AI-Radar-Source: launch_events_trigger
X-AI-Radar-Event-Id: <uuid>
X-AI-Radar-Signature: <hmac_sha256(secret, body)>  // 可选, Phase E 留位
```

**Response Schema** (200):
```json
{
  "code": 0,
  "data": {
    "received": true,
    "event_id": "uuid",
    "dispatched_users": 5,  // 推送给几个 user
    "channels_notified": ["email", "webhook", "telegram"],  // Phase E 仅 email mock
    "latency_ms": 234
  },
  "message": "ok"
}
```

**错误码**:
- 4000: X-AI-Radar-Source 缺失或非法
- 4003: event_id 在 DB 中找不到 (重复 / 误触发)
- 5001: DB / 邮件队列故障

**幂等**:
- push-worker 端基于 `event_id` 去重 (Redis set NX, Phase E 用内存 map)

**调用频次**:
- 预计: 50-200 次/天 (Phase E seed + 爬虫增量)
- P95 端到端延迟 ≤ 5 分钟 (PRD A.2 验收)

---

## 9. Schema 引用汇总

| 表 | 主要字段 | 引用契约 |
|----|----------|----------|
| launch_events | id, product_id, source, event_type, title, body, author, engagement, event_at, confidence | §1, §8 |
| trend_signals | id, signal_type, scope, title, evidence, strength, velocity, novelty, status | §2 |
| categories | id, slug, name_en, name_zh, parent_id, product_count, hot_score | §3 |
| product_signals | product_id, signal_id, relevance | §4 |
| products | id, slug, name, category, logo_url | §1, §4 |
| user_profiles | id, email, plan | §7 |
| newsletter_subscriptions | id, email, frequency, language, confirmation_token, unsubscribe_token | §5 |

---

## 10. Mock 标识

所有 Phase E 触发的"邮件发送"在响应中带 `"mock_email_sent": true` 字段, 工程师在 UI 上要展示 "Phase E: 邮件仅模拟" 提示横幅。

---

## 11. 变更记录

| 版本 | 日期 | 变更 | 作者 |
|------|------|------|------|
| v1.0 | 2026-05-30 | Phase E 初版, 12 端点 | 高见远 |
