# AI Radar — GitHub Open Source Research Report

> Date: 2026-05-29
> Purpose: Discover actionable patterns from existing open source projects to improve AI Radar's data collection and analysis capabilities.

---

## Area 1: AI Tool Discovery & Aggregation

### Top Repos

| # | Repository | Description |
|---|-----------|-------------|
| 1 | [mahseema/awesome-ai-tools](https://github.com/mahseema/awesome-ai-tools) | Curated list of AI tools organized by category (text, code, image, video, audio, marketing, etc.) with 729 PRs and community-driven submissions |
| 2 | [OpenShelf](https://openshelf.dev/) | GitHub-based AI tool directory with 500+ tools, install difficulty ratings, weekly growth indicators, and curated collections |
| 3 | [Github-Ranking-AI](https://yuxiaopeng.com/Github-Ranking-AI/) | Daily auto-updated ranking of AI-topic GitHub repositories by star count |

### Data Collection Methods

| Project | Method | Details |
|---------|--------|---------|
| awesome-ai-tools | Manual curation + PR submissions | Community submits via GitHub PR or altern.ai form. Maintainer reviews and merges. 729 PRs merged so far. |
| OpenShelf | GitHub API indexing + community submissions | Auto-indexes GitHub repos, extracts metadata (stars, language, description, commits). Accepts manual submissions via web form. |
| Github-Ranking-AI | Automated GitHub API polling | Queries repos tagged with AI topics, sorts by stars, auto-updates daily via cron. |

### Key Data Fields Tracked

| Field | awesome-ai-tools | OpenShelf | Github-Ranking-AI |
|-------|-----------------|-----------|-------------------|
| Name + URL | Yes | Yes | Yes |
| Description | Yes | Yes | Yes |
| Category/Tags | Yes (hashtag-style) | Yes (emoji + text tags) | Yes (GitHub topics) |
| GitHub Stars | No | Yes | Yes (primary sort) |
| Weekly Growth | No | Yes (+N this week) | No |
| Last Updated | No | Yes (relative time) | No |
| Install Difficulty | No | Yes (easy/moderate/dev) | No |
| Language/Runtime | No | Yes | Yes |
| Verification Status | No | Yes (curated badge) | No |
| Pricing | No | No | No |

### Techniques We Can Borrow

1. **Emoji-based category tags** (OpenShelf) — Visually categorizes tools into Platform, Agent, Skill, Tool, LLM with emoji prefixes. Easy to implement, great UX.
2. **Install difficulty rating** (OpenShelf) — Three-tier system (easy/moderate/dev) helps non-technical users filter. We should add this.
3. **Weekly growth indicator** (OpenShelf) — Shows "+N this week" next to star count. Provides instant momentum signal.
4. **Curated collections** (OpenShelf) — "Local AI Stack", "Agent Toolkit" bundles. We should build thematic collections for our users.
5. **Community submission + curation workflow** (awesome-ai-tools) — Accept submissions via form, review before publishing. Low-cost content acquisition.
6. **Auto-updated ranking** (Github-Ranking-AI) — Daily cron job queries GitHub API, rebuilds ranking page. Simple but effective for freshness.

---

## Area 2: GitHub Trending & Repository Analytics

### Top Repos/Tools

| # | Repository/Tool | Description |
|---|----------------|-------------|
| 1 | [star-history/star-history](https://github.com/star-history/star-history) | The de facto GitHub star history tracker. Next.js frontend + separate backend API. 21k+ stars. Generates embeddable SVG charts. |
| 2 | [NiklasTiede/Github-Trending-API](https://github.com/NiklasTiede/Github-Trending-API) | FastAPI service that scrapes GitHub Trending and returns JSON. Docker-ready. Supports daily/weekly/monthly views. |
| 3 | [juzikuwei/github-trending-scraper](https://github.com/juzikuwei/github-trending-scraper) | Simple Python scraper using BeautifulSoup. Exports CSV/JSON. Supports language + time period filtering. |
| 4 | [Apify GitHub Trending Scraper](https://apify.com/automation-lab/github-trending-scraper) | Production-grade scraper on Apify platform. Includes topics, license, contributors. Multiple output formats. |
| 5 | [The-Migus-Group/gh-repo-stats](https://github.com/The-Migus-Group/gh-repo-stats) | Python CLI for fetching repo stats via GitHub API (stars, forks, clones, views). Available on PyPI. |

### Data Collection Methods

| Project | Method | Details |
|---------|--------|---------|
| star-history | GitHub API + custom backend | Uses GitHub API for star data, stores historical data in own backend, serves SVG charts via API endpoints. Chrome extension available. |
| Github-Trending-API | HTML scraping (httpx + BS4) | Scrapes github.com/trending HTML, parses DOM, returns structured JSON. In-memory cache. Docker container. |
| github-trending-scraper | HTML scraping (BS4 + requests) | Fetches trending page, parses with BeautifulSoup, exports CSV/JSON. |
| Apify Scraper | Headless browser scraping | Runs on Apify cloud infrastructure, supports additional metadata extraction. |
| gh-repo-stats | GitHub REST API | Uses authenticated GitHub API calls to fetch traffic/clones/views data. |

### Key Metrics/Signals Tracked

| Metric | star-history | Trending API | Scraper | Apify | gh-repo-stats |
|--------|-------------|-------------|---------|-------|---------------|
| Total Stars | Yes (time-series) | Yes | Yes | Yes | Yes |
| Star Growth (delta) | Yes | Yes (starsSince) | Yes (stars_today) | Yes (starGains) | No |
| Forks | No | Yes | No | Yes | Yes |
| Language | No | Yes | Yes | Yes | No |
| Contributors | No | Yes (builtBy) | No | Yes | No |
| Clones | No | No | No | No | Yes |
| Page Views | No | No | No | No | Yes |
| Topics | No | No | No | Yes (optional) | No |
| License | No | No | No | Yes (optional) | No |

### Github-Trending-API Data Schema (from NiklasTiede)

```json
{
  "rank": 1,
  "username": "sherlock-project",
  "repositoryName": "sherlock",
  "url": "https://github.com/sherlock-project/sherlock",
  "description": "Hunt down social media accounts by username across social networks",
  "language": "Python",
  "languageColor": "#3572A5",
  "totalStars": 21977,
  "forks": 2214,
  "starsSince": 462,
  "since": "daily",
  "builtBy": [
    {
      "username": "hoadlck",
      "url": "https://github.com/hoadlck",
      "avatar": "https://avatars.githubusercontent.com/u/1666888?s=40&v=4"
    }
  ]
}
```

### Techniques We Can Borrow

1. **SVG embed badges** (star-history) — Generates embeddable SVG charts for READMEs (`/chart?repos=...`). We should offer similar embeddable widgets for AI Radar products.
2. **Time-series star tracking** (star-history) — Store star counts over time, not just current values. Enables trend analysis and velocity calculations.
3. **FastAPI scraping service pattern** (Github-Trending-API) — Lightweight FastAPI + Pydantic service with in-memory cache. Perfect pattern for our own trending endpoint. Supports `since` (daily/weekly/monthly) and language filters.
4. **Multi-format export** (Apify) — Support JSON, CSV, Excel exports. Essential for B2B users who want to analyze data offline.
5. **Traffic metrics** (gh-repo-stats) — GitHub API provides clones and views data (requires auth). These are valuable engagement signals beyond stars.
6. **Chrome Extension** (star-history) — Companion browser extension for quick star history viewing. Could be a future feature.

---

## Area 3: Product Hunt & Launch Platform Scrapers

### Top Repos/Tools

| # | Repository/Tool | Description |
|---|----------------|-------------|
| 1 | [scraper-bank/ProductHunt.com-Scrapers](https://github.com/scraper-bank/ProductHunt.com-Scrapers) | Production-ready scrapers in Python (BS4, Playwright, Selenium) and Node.js (Cheerio, Playwright, Puppeteer). |
| 2 | [markolofsen/producthunt-api](https://github.com/markolofsen/producthunt-api) | Python library (PyPI: producthunt-api) that mimics Product Hunt's internal GraphQL API to fetch category data. |
| 3 | [Product Hunt Official API v2](https://api.producthunt.com/v2/docs) | Official GraphQL API with OAuth2 authentication. |

### Data Collection Methods

| Project | Method | Details |
|---------|--------|---------|
| ProductHunt.com-Scrapers | Multiple scraping approaches | Python: BeautifulSoup (static), Playwright (dynamic), Selenium (interactive). Node.js: Cheerio+Axios, Playwright, Puppeteer. All output JSONL. |
| producthunt-api (PyPI) | GraphQL API mimicry | Replicates Product Hunt's internal GraphQL endpoint (`/frontend/graphql`). Requires browser cookie + sha256Hash. |
| Official PH API | OAuth2 + GraphQL | Requires developer application, OAuth2 flow. Returns structured data via GraphQL queries. |

### Data Fields Extracted

| Field | PH Scrapers | producthunt-api | Official API |
|-------|------------|-----------------|-------------|
| Product Name | Yes | Yes | Yes |
| Description | Yes | Yes | Yes |
| Category/Topic | Yes | Yes (by category slug) | Yes |
| Votes/Upvotes | Yes | Yes | Yes |
| Comments | Yes | No | Yes |
| Maker Info | Yes | No | Yes |
| Website URL | Yes | No | Yes |
| Screenshot/Thumbnail | Yes | No | Yes |
| Launch Date | Yes | No | Yes |
| Reviews/Ratings | No | No | Yes |

### Techniques We Can Borrow

1. **JSONL output format** (PH Scrapers) — JSON Lines format allows streaming processing, low memory footprint, easy database import. We should use this for large-scale data exports.
2. **Multi-framework scraper library** (PH Scrapers) — Offering multiple implementations (BS4, Playwright, Puppeteer) lets users choose based on their needs. We should support both static and dynamic scraping.
3. **Category-based data collection** (producthunt-api) — Fetching by category slug (e.g., `ai-software`) is efficient for targeted data collection. We should mirror this pattern.
4. **Cookie-based auth workaround** (producthunt-api) — When official API rate limits hit, scraping with browser cookies is a fallback. Useful for high-volume collection.
5. **Official API as primary source** — Product Hunt's GraphQL API is the most reliable source. We should use it as the primary data source, with scraping as fallback.

---

## Area 4: AI Project Evaluation & Scoring

### Top Repos/Tools

| # | Repository/Tool | Description |
|---|----------------|-------------|
| 1 | [Repo Audit](https://repo-audit.coey.dev/) | Deterministic scoring across 11 categories. Fast, opinionated repo triage. Scores: 1-10 with letter grades (A-F). |
| 2 | [GitRepoAI](https://www.gitrepoai.com/) | AI-powered repository analyzer for quality, adaptation, and implementation estimates. |
| 3 | [RepoScan.ai](https://reposcan.ai/) | Real-time AI analysis for code quality, security checks, and documentation. |
| 4 | [QUARE](https://apex974.com/articles/quare-ontology-based-quality-assessment-for-git-repositories) | Ontology-based quality assessment for git repositories. Academic/open-source project. |

### Scoring Signals (from Repo Audit and industry patterns)

Repo Audit uses "deterministic analysis across 11 categories" with optional Workers AI qualitative pass. Typical signals in repo scoring:

| Signal Category | Specific Signals |
|----------------|-----------------|
| Activity | Commit frequency, last commit date, release frequency |
| Community | Contributor count, issue response time, PR merge rate |
| Popularity | Star count, star velocity, fork count, watcher count |
| Code Quality | Test coverage, code complexity, linting compliance |
| Documentation | README quality, wiki presence, API docs, examples |
| Maintenance | Dependency updates, version release cadence, issue backlog |
| Trustworthiness | License presence, security policy, code of conduct |
| Growth | Star growth rate, contributor growth, issue resolution rate |

### Scoring Output Format (from Repo Audit)

- **Numeric score**: 1-10 scale (e.g., `5.9`, `5.1`, `4.1`)
- **Letter grade**: A, B, C, D, F
- **Combined display**: `5.9 (B)`
- **AI qualitative pass**: Optional LLM-based analysis (selectable model: glm-4.7-flash, gpt-oss-20b, llama-3.3-70b)

### Techniques We Can Borrow

1. **Deterministic scoring system** (Repo Audit) — Rule-based scoring (not ML-based) is faster, more transparent, and easier to debug. We should start with deterministic rules, add ML later.
2. **Letter grade + numeric score** (Repo Audit) — Output format: `5.9 (B)`. Combines precision with quick readability. Perfect for product cards.
3. **Multi-category scoring** — Breaking score into categories (activity, community, quality, etc.) provides actionable insights. Users can see "why" a product scored a certain way.
4. **AI qualitative pass** (Repo Audit) — Optional LLM-based analysis on top of deterministic scoring. We can add this as a premium feature.
5. **Star velocity as growth signal** — Stars per week/month is more valuable than total stars for discovering emerging products.
6. **Issue response time** — Fast issue resolution indicates an active, responsive maintainer. Key trustworthiness signal.

---

## Area 5: RSS / News Aggregation for AI

### Top Repos

| # | Repository | Description |
|---|-----------|-------------|
| 1 | [SuYxh/ai-news-aggregator](https://github.com/SuYxh/ai-news-aggregator) | Auto-aggregates 140+ AI/tech sources, supports RSS import, smart AI-content filtering, bilingual translation, updates every 2 hours via GitHub Actions. |
| 2 | [FreshRSS](https://github.com/FreshRSS/FreshRSS) | 10k+ stars. Self-hostable RSS aggregator and reader. Mature, widely used. |
| 3 | [News Agent](https://xiaoyi.vc/news-agent.html) | Automated news aggregation via GitHub Actions. Multi-category news, deduplication, AI-powered distribution. |

### Data Sources Tracked (from ai-news-aggregator)

The project aggregates **140+ sources** across 6 categories:

| Category | Count | Examples |
|----------|-------|---------|
| Top AI Companies | 17 | OpenAI, Anthropic, Google DeepMind, Meta, NVIDIA, xAI, Hugging Face |
| Chinese AI Companies | 11 | Alibaba Qwen, DeepSeek, Tencent Hunyuan, MiniMax, Dify, Jina AI |
| AI Researchers | 8 | Fei-Fei Li, Andrew Ng, Jim Fan, Lilian Weng, LlamaIndex founder |
| AI Dev Tools | 12 | LangChain, LlamaIndex, Ollama, Cursor, Firecrawl, OpenRouter |
| Chinese AI Bloggers | 15 | Various tech influencers |
| Chinese Tech Blogs | 6 | QuantumBit, Ruan Yifeng, Meituan tech blog |

Plus **52 WeChat public accounts** and **14 aggregator platforms** (AI Today Hot List, TechURLs, Hacker News, etc.)

### Data Collection Methods

| Project | Method | Details |
|---------|--------|---------|
| ai-news-aggregator | RSS + custom fetchers + GitHub Actions | Uses `rss-parser`, `fast-xml-parser`, `cheerio` for HTML parsing. Custom WeChat RSS fetchers. Runs every 2 hours via GitHub Actions cron. |
| FreshRSS | RSS/Atom feed polling | Standard RSS/Atom protocol. Supports OPML import/export. Self-hosted. |
| News Agent | GitHub Actions + AI filtering | Automated cron jobs with AI-powered content categorization and deduplication. |

### Filtering & Deduplication Techniques

| Technique | Implementation |
|-----------|---------------|
| Keyword-based AI relevance filtering | Maintain a keyword list (AI, ML, LLM, GPT, etc.) to filter only relevant content from broader tech feeds. |
| URL fingerprinting for deduplication | Compare article URLs or content hashes to eliminate duplicates across sources. |
| Time window filtering | `--window-hours` parameter limits processing to recent content (default 24h). |
| Bilingual translation | Automatic English-to-Chinese title translation with caching (`title-zh-cache.json`). |
| Source health monitoring | `source-status.json` tracks which feeds are alive/dead. |

### Data Pipeline Architecture (from ai-news-aggregator)

```
[GitHub Actions cron: every 2 hours]
  |
  v
[Fetch Layer] pnpm fetch -> src/fetchers/ (wechat-rss.ts, youtube.ts, etc.)
  |- rss-parser + fast-xml-parser for RSS/Atom feeds
  |- cheerio for HTML scraping
  - Custom fetchers for WeChat, YouTube, etc.
  |
  v
[Process Layer] src/filters/ & src/translate/
  |- Keyword matching for AI relevance
  |- URL/content hash deduplication
  - Title translation (with caching)
  |
  v
[Output Layer] data/ directory
  |- latest-24h.json
  |- latest-7d.json
  |- archive.json (45-day archive)
  |- source-status.json
  - title-zh-cache.json
  |
  v
[Deploy Layer] React Web App -> GitHub Pages
```

### Techniques We Can Borrow

1. **OPML-based feed management** — Use standard OPML format for feed subscriptions. Easy to import/export, widely supported.
2. **GitHub Actions as scheduler** — Free, reliable cron execution. No need for dedicated server for periodic fetching.
3. **Keyword relevance filtering** — Simple but effective. Maintain a curated keyword list to filter AI-relevant content from general tech feeds.
4. **Translation caching** — Cache translated titles to avoid redundant API calls. Significant cost savings.
5. **Source health monitoring** — Track which feeds are dead/slow. Auto-disable unhealthy sources, alert on recovery.
6. **Tiered output files** — Separate files for 24h, 7d, and archive. Enables efficient data serving based on recency needs.

---

## Summary: Actionable Recommendations for AI Radar

### Priority 1 - Data Collection Pipeline

| Pattern | Source | Implementation Effort | Impact |
|---------|--------|----------------------|--------|
| GitHub Trending scraping via FastAPI | NiklasTiede/Github-Trending-API | Low (1-2 days) | High - daily product discovery |
| Product Hunt GraphQL scraping | producthunt-api | Medium (3-5 days) | High - launch date tracking |
| RSS aggregation with keyword filtering | SuYxh/ai-news-aggregator | Medium (3-5 days) | High - news/trend tracking |
| GitHub API polling for repo metadata | gh-repo-stats | Low (1-2 days) | Medium - validation data |

### Priority 2 - Scoring & Evaluation

| Pattern | Source | Implementation Effort | Impact |
|---------|--------|----------------------|--------|
| Deterministic multi-category scoring | Repo Audit | Medium (3-5 days) | High - product quality signal |
| Star velocity tracking | star-history | Low (1-2 days) | High - momentum detection |
| Activity signals (commits, issues, releases) | gh-repo-stats + GitHub API | Low (1-2 days) | Medium - trustworthiness |

### Priority 3 - UX & Presentation

| Pattern | Source | Implementation Effort | Impact |
|---------|--------|----------------------|--------|
| Emoji-based category tags | OpenShelf | Low (1 day) | Medium - visual scanning |
| Install difficulty ratings | OpenShelf | Low (1 day) | Medium - user filtering |
| Curated collections | OpenShelf | Low (1-2 days) | High - user engagement |
| Embeddable SVG badges | star-history | Medium (3-5 days) | Medium - virality/sharing |
| JSONL export format | PH Scrapers | Low (1 day) | Medium - B2B utility |

### Architecture Recommendation

```
+-------------------------------------------------------------+
|                     AI Radar Data Pipeline                   |
+-------------------------------------------------------------+
|                                                             |
|  +-------------+  +--------------+  +------------------+    |
|  | GitHub      |  | Product Hunt |  | RSS/News Feeds   |    |
|  | Trending    |  | GraphQL      |  | (80+ sources)    |    |
|  | Scraper     |  | Scraper      |  | + OPML           |    |
|  +------+------|  +------+-------+  +--------+---------+    |
|         |                |                    |             |
|         v                v                    v             |
|  +------------------------------------------------------+  |
|  |              Data Processing Layer                    |  |
|  |  - Deduplication (URL/content hash)                  |  |
|  |  - AI relevance filtering (keyword matching)         |  |
|  |  - Translation caching                               |  |
|  |  - Source health monitoring                          |  |
|  +----------------------+-------------------------------+  |
|                         |                                   |
|                         v                                   |
|  +------------------------------------------------------+  |
|  |              Scoring Engine                           |  |
|  |  - Deterministic multi-category scoring              |  |
|  |  - Star velocity calculation                         |  |
|  |  - Activity signals (commits, issues, releases)      |  |
|  |  - Letter grade + numeric score output               |  |
|  +----------------------+-------------------------------+  |
|                         |                                   |
|                         v                                   |
|  +------------------------------------------------------+  |
|  |              Storage & API Layer                      |  |
|  |  - Tiered output (24h, 7d, archive)                  |  |
|  |  - JSONL export                                      |  |
|  |  - REST API (FastAPI)                                |  |
|  |  - Embeddable SVG badges                             |  |
|  +------------------------------------------------------+  |
|                                                             |
+-------------------------------------------------------------+
```

### Key Tech Stack Recommendations

| Layer | Recommended Tech | Rationale |
|-------|-----------------|-----------|
| Scraping | Python (httpx + BS4 + Playwright) | Mature ecosystem, handles both static and dynamic pages |
| API | FastAPI + Pydantic | Auto-generated OpenAPI docs, type-safe, async |
| Scheduling | GitHub Actions / APScheduler | Free, reliable, easy to manage |
| Data Processing | Python (pandas for analysis, jsonlines for I/O) | Standard data manipulation |
| Frontend | React + TypeScript + Vite + Tailwind | Modern, fast, consistent with existing patterns |
| Storage | SQLite (prototype) -> PostgreSQL (production) | SQLite for rapid iteration, PostgreSQL for scale |
| Caching | Redis (for API rate limits, translation cache) | Fast, widely supported |
