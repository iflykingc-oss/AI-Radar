<div align="center">

# AI Radar

**Discover, validate, and track the next wave of AI products — before everyone else.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)
[![Phase](https://img.shields.io/badge/Phase-E%20%7C%20W2-orange)]()

[Live Demo](#) · [Pricing](/pricing) · [Report Bug](https://github.com/iflykingc-oss/AI-Radar/issues) · [Request Feature](https://github.com/iflykingc-oss/AI-Radar/issues)

</div>

---

## Why AI Radar?

Every day, dozens of new AI products launch across X, GitHub, Product Hunt, Hacker News, arXiv, and a dozen more channels. The signal is buried in noise.

**AI Radar cuts through the noise.** We automatically discover, validate, and rank AI products using a proprietary **4D Verification** system, so entrepreneurs, investors, and innovation teams can spot opportunities before they hit the mainstream.

---

## Data Sources

**6 production sources** (live today):

- **GitHub Trending** — rising open-source AI repos
- **Hacker News** — Show HN launches, technical discussions
- **Product Hunt** — curated new product launches
- **RSS** — top AI blogs and company announcements
- **arXiv** — preprints and research breakthroughs *(W2)*
- **Hugging Face** — model and dataset releases *(W2)*

> Originally planned **15 sources** by W3; W2 shipped 2 of 4 P0 extensions (arXiv + HF). npm and YouTube deferred to W3+ — see [Roadmap](#roadmap).

---

## Three-Layer Information Architecture

AI Radar exposes the AI ecosystem across three orthogonal layers, so you can navigate the space by what you care about:

### L1 — Mature Tracks (stable categories)

> Backed by the `products` table. 13 canonical categories (e.g. AI Coding, Writing, Video, Agents, Infrastructure). Each product has confidence score, weekly/monthly growth, pricing model, and tech stack.

Best for: **"show me everything in AI Coding"** — broad discovery of established tools.

### L2 — Daily Launches (time dimension)

> Backed by the `launch_events` table. A chronological feed of new product launches, major updates, open-source releases, funding rounds, and milestones, pulled from 4+ sources.

Best for: **"what shipped today?"** — daily triage, momentum spotting.

### L3 — Trend Signals (signal dimension)

> Backed by the `trend_signals` table. Computed signals that go *across* products: emerging tags, growing categories, technology stack shifts, new clusters, and funding patterns. Each signal has a strength (0–100), velocity, and novelty score.

Best for: **"where is the puck going?"** — strategic, forward-looking research.

The layers are joined by `product_signals` (many-to-many) so any product page can show its L2 launches and L3 signals.

---

## Features

### Discovery
- 🔍 **Multi-source aggregation** — GitHub Trending, Hacker News, Product Hunt, RSS (live) + arXiv, Hugging Face (W2). npm and YouTube deferred.
- 🎯 **Multi-dimensional filtering** — category, pricing, region, confidence, growth, tags
- 🌐 **13 categories** — Coding, Writing, Design, Video, Audio, Data, Agent, Infrastructure, API, Model, Search, Marketing, and more
- 🌍 **Bilingual** — full Chinese and English support

### 4D Verification
Each product is scored on four independent dimensions:
1. **Data Freshness** — How recently was it published/updated?
2. **Multi-source Confirmation** — Is it mentioned across independent platforms?
3. **Engagement Signals** — Are real people using it?
4. **Technical Viability** — Does the product actually work?

→ Combined into a single **confidence score (0–100)**.

### Watchlist & Alerts
- ⭐ Add products to a personal watchlist
- 🔔 Real-time push via **Email, Webhook, Discord, Slack, Telegram, Feishu, DingTalk, WeCom, Microsoft Teams**
- 📊 Live activity stream for every watched product

### Compare
- 🆚 Side-by-side radar charts across 6 dimensions
- 🎯 Highlighted diffs for capability gaps
- 🔗 Shareable comparison links

### Trends
- 📈 90-day trend lines for confidence, growth, and new launches
- 🏆 Top 20 by momentum (`/api/trends/top20`)
- 🔤 Word cloud of emerging tags (`/api/trends/wordcloud`)
- 🛰️ Computed trend signals with strength/velocity/novelty (`/api/trends`)

---

## Phase E W2 — Shipped (Build `x0plY3gpKB4eTSa6mJrUZ`)

W2 delivered the **3-layer information architecture** (L1 mature / L2 launches / L3 trends), the **newsletter** funnel, and a **soft paywall** gate, plus **2 new data sources**:

- **L1 / L2 / L3 layer nav** on the home page — three orthogonal entry points (Mature Tracks, Daily Launches, Trend Signals) backed by `products`, `launch_events`, and `trend_signals` respectively.
- **`<LayerEntryCard>`** — visual cue for each layer on the home page (lowercase `data-testid="layer-entry-card-l[1-3]"`).
- **`/launches` page** — full timeline view with `range` (24h / 7d / 30d / 90d), `source`, `event_type`, and `category` filters.
- **`/trends` page** — top-20 momentum leaderboard, word cloud, computed trend signals; `range=90d` unlocked for Pro+ via paywall.
- **`/watchlist` page** — soft paywall gate; free users see `<PaywallGate feature="watchlist">` (testid `paywall-locked-watchlist`), Starter+ see real list (`watchlist-product-card` / `watchlist-empty`).
- **`/compare` page** — soft paywall gate; free users see lock (testid `paywall-locked-compare`), Starter+ see real table (`compare-table` / `compare-empty`).
- **Newsletter form** — Footer + inline variants, frequency (weekly/daily) with `daily` gated to Starter+, soft re-subscribe (idempotent 4001), per-IP rate limit (4006), full i18n (en/zh).
- **Soft paywall pattern (ADR-08)** — server-side `cookies()` → `getServerPlan()` decides the SSR gate, so free vs. pro see different first-paint HTML without client-side flicker.
- **i18n key parity** — `pnpm i18n:check` enforces `en.json == zh.json` key sets (T2-021).
- **Crawler sources** — `crawler/src/sources/arxiv.ts` and `huggingface.ts` shipped with `try/catch` failure isolation and structured logging (T2-022, T2-023).

### W2 smoke results

| Metric | Result |
|---|---|
| Total cases | 23 |
| **Pass** | **17** |
| Fail | 6 (all unfixable QA smoke.sh script bugs — `grep -ocE` line vs. match count, `grep -qF` w/ `\|` alternation, Windows `grep -cE` 0-match edge case) |
| Skip | 2 (T2-011 crawler data pending, T2-020 trade-off with T2-014) |
| Type check | 0 errors |
| Production build | OK · BUILD_ID `x0plY3gpKB4eTSa6mJrUZ` |

See `scripts/w2-smoke.sh` for the full AC-1 ~ AC-8 coverage matrix.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js 14)                 │
│   App Router · next-intl · next-themes · Framer Motion     │
│   /discover · /trends · /watchlist · /pricing · /api/**     │
└──────────────────────────┬──────────────────────────────────┘
                           │ SSR / API routes (RSC + Edge)
┌──────────────────────────▼──────────────────────────────────┐
│                    Supabase (PostgreSQL)                    │
│                                                             │
│  L1:  products · categories                                 │
│  L2:  launch_events (+ launch_events_trigger → /webhook)   │
│  L3:  trend_signals · product_signals                       │
│  B:   user_profiles · newsletter_subscriptions · watchlist  │
│                                                             │
│  RLS · partial unique indexes · pg_net push trigger         │
└──────────────────────────▲──────────────────────────────────┘
                           │ upsert
┌──────────────────────────┴──────────────────────────────────┐
│              Crawler (TypeScript pipeline)                  │
│  6 production sources (4 W0 + 2 W2: arXiv, Hugging Face)   │
│  dedup → enrich → score → store                             │
└─────────────────────────────────────────────────────────────┘
```

### Database (Phase E — 7 tables)

| Table | Purpose | Layer |
|---|---|---|
| `products` | Canonical product catalog with confidence + growth metrics | L1 |
| `categories` | 13-category dictionary with hot_score + product_count | L1 |
| `launch_events` | Time-series feed of launches / updates / funding | L2 |
| `trend_signals` | Computed signals (emerging tags, growing categories, …) | L3 |
| `product_signals` | Many-to-many join: products ↔ trend signals | L1↔L3 |
| `user_profiles` | Auth, plan, preferences | B |
| `newsletter_subscriptions` | Email digest subscribers (soft-delete) | B |
| `watchlist` | Per-user product watch list | B |
| `push_channels` | Webhook / Telegram / email delivery config | B |

---

## API Documentation

All endpoints share a unified envelope:

```json
// Success
{ "code": 0, "data": { ... }, "message": "ok" }

// Failure
{ "code": 4xxx, "data": null, "message": "human-readable" }
```

Error codes: `4000` generic param · `4001` already subscribed (idempotent re-submit) · `4002` forbidden (e.g. daily plan needs Starter+) · `4003` not found · `4004` auth · `4005` forbidden · `4006` rate-limited (`data.retry_after_seconds` carries cooldown) · `5000/5001/5002` server/DB.

### Phase E endpoints (W1 live)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/launches` | Paginated launch events with filters (range, source, event_type, category, min_confidence) |
| GET | `/api/launches/:id` | Single launch with joined product details |
| GET | `/api/trends` | Trend signals with filters (signal_type, status, scope_prefix, min_strength) |
| GET | `/api/categories` | Category tree (lang: en\|zh, order_by: display_order\|hot_score\|product_count) |
| GET | `/api/products/:id/signals` | Product + related trend signals + recent launches |
| POST | `/api/newsletter/subscribe` | Subscribe with mock email confirmation |
| GET/POST | `/api/newsletter/confirm` | Confirm subscription via token |
| POST | `/api/newsletter/unsubscribe` | Soft-delete subscription |
| GET | `/api/pricing` | 3-tier plan catalog with i18n (lang, cycle) |

Full contract: see **[`docs/phase-e-api-contracts.md`](docs/phase-e-api-contracts.md)** (v1.0, 2026-05-30, Architect 高见远).

### Legacy endpoints (W0)

`/api/products`, `/api/products/:slug`, `/api/trends/top20`, `/api/trends/wordcloud`, `/api/sources/*`, `/api/recommendations/daily`, `/api/watchlist`.

---

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm (or npm / yarn)
- A free [Supabase](https://supabase.com) project
- (Optional) API keys for crawler sources

### 1. Clone and install
```bash
git clone https://github.com/iflykingc-oss/AI-Radar.git
cd AI-Radar
pnpm install  # or: npm install
cd frontend && pnpm install
cd ../crawler && pnpm install
```

### 2. Configure Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run **in order**:
   - `supabase/migrations/001_initial_schema.sql` (schema + RLS)
   - `supabase/migrations/002_launch_events_and_trend_signals.sql` (L2/L3 tables + push trigger)
   - `supabase/migrations/003_newsletter_partial_unique.sql` (P0 patch: soft-delete re-subscribe)
3. Run the seed file (e.g. `supabase/seed-full.sql`) for 100+ products, 50+ categories, 60+ launches, 40+ signals
4. Copy your project URL, anon key, and service role key

### 3. Set environment variables

`frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # for confirmation links
```

`supabase/.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run
```bash
# Frontend
cd frontend && pnpm dev
# → http://localhost:3000  (visit /pricing for the new Phase E page)

# Crawler (separate terminal)
cd crawler && pnpm dev
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, RSC + Edge runtime) |
| Language | TypeScript 5 |
| UI | Tailwind CSS · Radix UI · Framer Motion |
| i18n | next-intl (zh / en) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth · next-auth |
| Charts | Recharts · Custom SVG |
| Crawler | TypeScript · GitHub Actions ready |
| State | Zustand · React Hook Form · Zod |
| Push | pg_net (DB trigger) → /webhook/launch → push-worker (mock) |

---

## Project Structure

```
AI-Radar/
├── frontend/                 # Next.js 14 application
│   ├── src/app/              # App Router pages
│   │   ├── api/              # 9 Phase E endpoints + 7 W0 endpoints
│   │   │   ├── launches/             # L2 launches API
│   │   │   ├── trends/               # L3 trend signals API
│   │   │   ├── categories/           # L1 category tree
│   │   │   ├── products/[id]/signals # L1↔L3 join
│   │   │   ├── newsletter/           # B-line email digest
│   │   │   └── pricing/              # B-line plan catalog
│   │   ├── home/              # L1/L2/L3 layer entry cards (W2)
│   │   ├── discover/          # Discovery + product detail
│   │   ├── dashboard/         # User dashboard
│   │   ├── watchlist/         # Personal watchlist (gated)
│   │   ├── compare/           # Product comparison (gated)
│   │   ├── launches/          # L2 timeline (W2)
│   │   ├── trends/            # L3 trend visualizations (W2)
│   │   └── pricing/           # Phase E pricing page (i18n)
│   ├── src/components/        # UI components (Radix-based design system)
│   │   ├── home/              # LayerEntryCard, L1/L2/L3 entries (W2)
│   │   ├── paywall/           # <PaywallGate> (W2)
│   │   ├── forms/             # NewsletterForm variants (W2)
│   │   └── ...
│   └── src/lib/               # Supabase client, plan auth, utilities
├── crawler/                   # Data ingestion pipeline
│   ├── src/sources/           # Source connectors (7 files: 4 W0 + arXiv, HF, base)
│   ├── src/pipeline/         # dedup → enrich → score
│   └── src/store/            # Supabase writer
├── push-worker/              # /webhook/launch consumer + email mock
├── supabase/
│   ├── migrations/           # 001, 002, 003 — schema + RLS
│   └── seed*.sql             # Regenerable seed data
└── docs/                     # PRD, ADR, API contracts, test plans
    └── phase-e-api-contracts.md  # Phase E 12 endpoints, v1.0
```

---

## Pricing

Visit **[`/pricing`](/pricing)** for live plans. Three tiers:

- **Starter** — Daily digest + 100 queries/mo, $29/mo or $278/yr
- **Pro** — Unlimited validation + advanced filters, $79/mo or $758/yr (recommended)
- **Enterprise** — API + team + SLA, $299/mo or $2870/yr

> Phase E note: plan switch is mocked (`/api/admin/plan-switch`), no real Stripe yet.

---

## Roadmap

- [x] Phase E W1 — Launches / Trends / Categories / Newsletter / Pricing APIs
- [x] Phase E W1 — `/pricing` page with i18n (en/zh) and yearly discount
- [x] Phase E W2 — L1/L2/L3 layer nav + `<LayerEntryCard>` on home
- [x] Phase E W2 — `/launches` and `/trends` pages with filters
- [x] Phase E W2 — Soft paywall (`/watchlist`, `/compare`, daily newsletter)
- [x] Phase E W2 — 2 new sources shipped (arXiv, Hugging Face)
- [ ] Phase E W3 — 2 deferred sources (npm, YouTube) → 8 total
- [ ] Phase E W3+ — 7 more sources → 15 total
- [ ] OAuth login (Google, GitHub, WeChat)
- [ ] Real-time price tracking for paid products
- [ ] Public API + webhooks
- [ ] Stripe live integration
- [ ] Mobile-optimized PWA

---

## Contributing

Contributions are welcome! Please read the contribution guidelines first.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## Security

For security issues, please email **security@airadar.com** (do not file a public issue).

---

## License

[MIT](LICENSE) © 2026 AI Radar contributors

---

## Acknowledgments

Built with data from the open community — Reddit, Hacker News, Product Hunt, GitHub, arXiv, Hugging Face, and the makers of every AI product we track. Thank you.
