<div align="center">

# AI Radar

**Discover, validate, and track the next wave of AI products — before everyone else.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)

[Live Demo](#) · [Report Bug](https://github.com/iflykingc-oss/AI-Radar/issues) · [Request Feature](https://github.com/iflykingc-oss/AI-Radar/issues)

</div>

---

## Why AI Radar?

Every day, 50+ new AI products launch across X, GitHub, Product Hunt, Hacker News, arXiv, and a dozen more channels. The signal is buried in noise.

**AI Radar cuts through the noise.** We automatically discover, validate, and rank AI products using a proprietary **4D Verification** system, so entrepreneurs, investors, and innovation teams can spot opportunities before they hit the mainstream.

## Features

### Discovery
- 🔍 **15 data sources** — Reddit, Hacker News, AIhot, Product Hunt, TechCrunch, Lobsters, Medium, Dev.to, GitHub Trending, Hugging Face, npm, arXiv, Papers With Code, YouTube, Bluesky
- 🎯 **Multi-dimensional filtering** — category, pricing, region, confidence, growth, tags
- 🌐 **12 categories** — Coding, Writing, Design, Video, Audio, Data, Agent, Infrastructure, API, Model, Search, Marketing
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
- 🏆 Top 20 by momentum
- 🔤 Word cloud of emerging tags

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js 14)                 │
│   App Router · next-intl · next-themes · Framer Motion     │
└──────────────────────────┬──────────────────────────────────┘
                           │ SSR / API routes
┌──────────────────────────▼──────────────────────────────────┐
│                    Supabase (PostgreSQL)                    │
│   products · user_profiles · watchlist · push_channels      │
│   RLS · 5 indexes · updated_at triggers                    │
└──────────────────────────▲──────────────────────────────────┘
                           │ upsert
┌──────────────────────────┴──────────────────────────────────┐
│              Crawler (TypeScript pipeline)                  │
│  Reddit · HN · Product Hunt · GitHub Trending · RSS         │
│  dedup → enrich → score → store                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 22+
- A free [Supabase](https://supabase.com) project
- (Optional) API keys for crawler sources

### 1. Clone and install
```bash
git clone https://github.com/iflykingc-oss/AI-Radar.git
cd AI-Radar
cd frontend && npm install
cd ../crawler && npm install
```

### 2. Configure Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run in order:
   - `supabase/migrations/001_initial_schema.sql` (schema + RLS)
   - `supabase/seed-full.sql` (63 seed products)
3. Copy your project URL, anon key, and service role key

### 3. Set environment variables

`frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`supabase/.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run
```bash
# Frontend
cd frontend && npm run dev
# → http://localhost:3000

# Crawler (separate terminal)
cd crawler && npm run dev
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS · Radix UI · Framer Motion |
| i18n | next-intl (zh / en) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth · next-auth |
| Charts | Recharts · Custom SVG |
| Crawler | TypeScript · GitHub Actions ready |
| State | Zustand · React Hook Form · Zod |

## Project Structure

```
AI-Radar/
├── frontend/                 # Next.js 14 application
│   ├── src/app/              # App Router pages
│   │   ├── api/              # 7 product APIs + 15 source APIs
│   │   ├── discover/         # Discovery + product detail
│   │   ├── dashboard/        # User dashboard
│   │   ├── watchlist/        # Personal watchlist
│   │   ├── compare/          # Product comparison
│   │   └── trends/           # Trend visualizations
│   ├── src/components/       # UI components
│   │   ├── ui/               # Design system primitives
│   │   ├── empty-states/     # Empty state components
│   │   ├── skeletons/        # Loading skeletons
│   │   └── transitions/      # Framer Motion transitions
│   └── src/lib/              # Supabase client, utilities
├── crawler/                  # Data ingestion pipeline
│   ├── src/sources/          # 4 source connectors
│   ├── src/pipeline/         # dedup → enrich → score
│   └── src/store/            # Supabase writer
├── supabase/
│   ├── migrations/           # Database schema
│   ├── seed.sql              # Seed data
│   └── seed.ts               # Regenerable seed generator
└── docs/                     # Product review, gap analysis, QA reports
```

## Roadmap

- [ ] OAuth login (Google, GitHub, WeChat)
- [ ] Real-time price tracking for paid products
- [ ] Product embed widget for third-party sites
- [ ] Public API + webhooks
- [ ] Mobile-optimized PWA
- [ ] Daily AI Radar newsletter (auto-generated)

## Contributing

Contributions are welcome! Please read the contribution guidelines first.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

## Security

For security issues, please email **security@airadar.com** (do not file a public issue).

## License

[MIT](LICENSE) © 2026 AI Radar contributors

## Acknowledgments

Built with data from the open community — Reddit, Hacker News, Product Hunt, GitHub, arXiv, Hugging Face, and the makers of every AI product we track. Thank you.
