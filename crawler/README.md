# AI Radar Crawler Service

Automated crawler that discovers new AI products from multiple data sources daily.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  Data Sources   │────▶│  Dedup +     │────▶│  Scoring    │────▶│ Supabase │
│                 │     │  Enrich      │     │  Pipeline   │     │  Store   │
│ • Product Hunt  │     │  Pipeline    │     │             │     │          │
│ • GitHub        │     │              │     │ • Multi-src │     │ INSERT   │
│ • Hacker News   │     │ • Name match │     │ • Stars     │     │ UPDATE   │
│ • RSS Feeds     │     │ • Domain     │     │ • Website   │     │          │
│                 │     │ • Similarity │     │ • Recency   │     │          │
└─────────────────┘     └──────────────┘     └─────────────┘     └──────────┘
```

## Directory Structure

```
crawler/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts              # Entry point + cron scheduler
│   ├── types.ts              # Core type definitions
│   ├── sources/
│   │   ├── producthunt.ts    # Product Hunt GraphQL API
│   │   ├── github.ts         # GitHub Search API
│   │   ├── hackernews.ts     # Hacker News Firebase API
│   │   └── rss.ts            # RSS feed parser
│   ├── pipeline/
│   │   ├── dedup.ts          # Deduplication (name + domain + similarity)
│   │   ├── enrich.ts         # Fill missing fields
│   │   └── score.ts          # Confidence scoring (0-100)
│   └── store/
│       └── supabase.ts       # Supabase read/write
├── .env.example
└── README.md
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

3. Type-check (no emit):
   ```bash
   npx tsc --noEmit
   ```

4. Build:
   ```bash
   npm run build
   ```

## Running

### Manual (single execution)
```bash
MANUAL_RUN=true npm start
# or
npx ts-node src/index.ts  # with MANUAL_RUN=true in .env
```

### Cron (scheduled)
```bash
npm start
```

Default schedule: daily at 2:00 AM UTC. Override with `CRON_SCHEDULE` env var (cron expression).

## Confidence Scoring

| Signal | Bonus |
|--------|-------|
| Base score | 20 |
| 2+ sources mention same product | +30 |
| GitHub stars > 100 | +20 |
| Has official website | +10 |
| Recently active (< 30 days) | +20 |
| **Maximum** | **100** |

Products below the `MIN_CONFIDENCE_SCORE` threshold (default: 30) are discarded.

## Data Sources

### Product Hunt
- Uses GraphQL API v2
- Fetches recent 24h posts
- Extracts: name, description, website, votes, topics

### GitHub
- Uses Search API with multiple AI/ML queries
- Filters: stars > 100, recently pushed, relevant topics
- Extracts: repo name, description, stars, homepage, topics

### Hacker News
- Uses Firebase API for top stories
- Keyword-based AI product detection
- Extracts: title, URL, inferred category/tags

### RSS Feeds
- TechCrunch AI, VentureBeat AI
- XML parsing with `fast-xml-parser`
- Product launch detection via keyword matching
