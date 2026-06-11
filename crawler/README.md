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
│ • HuggingFace   │     │ • Similarity │     │ • Recency   │     │          │
│ • arXiv         │     │              │     │             │     │          │
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
│   │   ├── base.ts           # BaseSource abstract class (W2)
│   │   ├── producthunt.ts    # Product Hunt GraphQL API
│   │   ├── github.ts         # GitHub Search API
│   │   ├── hackernews.ts     # Hacker News Firebase API
│   │   ├── rss.ts            # RSS feed parser
│   │   ├── huggingface.ts    # HuggingFace Hub (models + spaces)
│   │   └── arxiv.ts          # arXiv Atom XML feed
│   ├── utils/
│   │   └── rate-limiter.ts   # Token-bucket + exponential backoff (W2)
│   ├── pipeline/
│   │   ├── dedup.ts          # Deduplication (name + domain + similarity)
│   │   ├── enrich.ts         # Fill missing fields
│   │   └── score.ts          # Confidence scoring (0-100)
│   └── store/
│       └── supabase.ts       # Supabase read/write
├── tests/                    # Vitest suites (W2)
│   ├── rate-limiter.test.ts
│   ├── huggingface.test.ts
│   └── arxiv.test.ts
├── logs/                     # Runtime logs (gitignored, kept via .gitkeep)
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

5. Run unit tests (Vitest):
   ```bash
   npm test
   ```

## Running

### Manual (single execution)
```bash
MANUAL_RUN=true npm start
# or
MANUAL_RUN=true npx ts-node src/index.ts
```

### Cron (scheduled)
```bash
npm start
```

Default schedule: daily at 2:00 AM UTC. Override with `CRON_SCHEDULE` env var (cron expression).

### Per-source cron overrides (optional)
You can register per-source offsets via env vars. By default the W2 sources
share the same 2:00 AM UTC cron with all W1 sources; staggered times are
recommended for production:

| Source        | Recommended cron | UTC time |
|---------------|------------------|----------|
| Product Hunt  | `0 1 * * *`      | 01:00    |
| GitHub        | `0 1 * * *`      | 01:00    |
| Hacker News   | `30 1 * * *`     | 01:30    |
| RSS Feeds     | `0 2 * * *`      | 02:00    |
| HuggingFace   | `0 3 * * *`      | 03:00    |
| arXiv         | `0 4 * * *`      | 04:00    |

(The current implementation runs all six sources in a single `runCrawlCycle`
invocation. The per-source offset table is a deployment-time cron-job
recommendation; see `phase-f-w2-integration-prd.md` §3.4.)

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
- Auth: `PRODUCT_HUNT_API_TOKEN` required

### GitHub
- Uses Search API with multiple AI/ML queries
- Filters: stars > 100, recently pushed, relevant topics
- Extracts: repo name, description, stars, homepage, topics
- Auth: `GITHUB_TOKEN` required (raises rate-limit to 5 000 req/h)

### Hacker News
- Uses Firebase API for top stories
- Keyword-based AI product detection
- Extracts: title, URL, inferred category/tags
- Auth: none

### RSS Feeds
- TechCrunch AI, VentureBeat AI
- XML parsing with `fast-xml-parser`
- Product launch detection via keyword matching
- Auth: none

### HuggingFace (W2)
- Endpoints (no auth required, P10):
  - `GET /api/models?sort=downloads&direction=-1&limit=100`
  - `GET /api/spaces?sort=trending&direction=-1&limit=30`
- Rate-limit budget: **10 req/min** via `globalLimiter`
- Mapping:
  - `models` → `pricing_model = 'open_source'`, `category` derived from `pipeline_tag`
  - `spaces` → `pricing_model = 'free'`, `category = 'AI Demos'`
- Skips: `private`, `disabled`, and `gated` (auto) entries
- Implements `BaseSource` → inherits rate-limit + failure-isolation

### arXiv (W2)
- Endpoint: `http://export.arxiv.org/api/query?searchQuery=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LV&sortBy=submittedDate&sortOrder=descending&max_results=80`
- Rate-limit budget: **5 req/min** via `arxivLimiter`
- Parses Atom XML with `fast-xml-parser`
- Mapping: each `<entry>` → `pricing_model = 'open_source'`, `category` derived from `primary_category`
- Implements `BaseSource` → inherits rate-limit + failure-isolation

## Rate Limiting & Backoff (W2)

New sources (`HuggingFaceSource`, `ArxivSource`) are protected by a
token-bucket rate limiter defined in `src/utils/rate-limiter.ts`.

| Limiter         | Capacity | Refill          | Used by      |
|-----------------|----------|-----------------|--------------|
| `globalLimiter` | 10       | 1 token / 6 s   | HuggingFace  |
| `arxivLimiter`  | 5        | 1 token / 12 s  | arXiv        |

**Exponential backoff (R-3 mitigation):** on every consecutive failure the
limiter schedules a backoff window of `2^attempt` minutes:

| Attempt | Backoff |
|---------|---------|
| 1       | 1 min   |
| 2       | 2 min   |
| 3       | 4 min   |
| 4       | 8 min   |
| 5       | 16 min  |
| 6       | skip rest of day (`SourceExhausted`) |

A successful call resets the counter. A `SourceExhausted` exception causes
`BaseSource.fetch()` to return `[]` for the rest of the day — failure is
isolated to the affected source and never blocks the other five.

## Failure Isolation

`src/index.ts::runCrawlCycle` wraps every `source.fetch()` in a try/catch
loop (lines 68–77). A single source that throws or returns `SourceExhausted`
is logged and skipped; the remaining 5 sources continue to run normally.

This is the architect's §9.5 contract: **no single source can block the
pipeline for the other five.**

## Testing

```bash
npm test
```

Test coverage target: **≥ 80 %** for new code (W2 rate-limiter, HuggingFace,
arXiv). The four W1 sources are not re-tested in this round — they must
continue to pass their pre-existing smoke tests unchanged.
