# Discover Page Gap Analysis: AI Radar vs Industry Leaders

> Competitors analyzed: **Product Hunt**, **G2**, **Futurepedia**, **There's An AI For That (TAAFT)**, **Capterra**
> Date: 2026-06-01

---

## Competitor Summary

### 1. Product Hunt

| Dimension | Details |
|---|---|
| **Discovery** | Global search with autocomplete, Categories (50+), Topics, Collections, Launches calendar |
| **Filters** | Category, Pricing (Free/Freemium/Paid/Open Source), Platform (Web/iOS/Android/macOS/Chrome/Figma), API availability, Company stage |
| **Sorting** | Relevance/Hot (default), Most Upvoted, Most Discussed, Newest, Trending |
| **Card Info** | Logo, name, tagline, topics/tags (2-4), upvote count, comment count, maker avatar+name, platform icons, official badges |
| **View** | List view only (no toggle), responsive |
| **Loading** | Infinite scroll with skeleton loading |
| **Empty State** | Illustration + clear copy + spell check suggestion + reset filters + recommend categories + submit product CTA |
| **Social Proof** | Upvotes (core metric), comments, maker identity with badge, user avatar wall, official badges (PH Team Pick, Top of Week/Month) |

### 2. Futurepedia

| Dimension | Details |
|---|---|
| **Discovery** | Global search with autocomplete, top nav categories, Featured/Trending/New/Deals shortcuts |
| **Filters** | Pricing (5 options), Use Case (tag cloud, 50+), Features (API, Open Source, No-Code, SaaS, Extension, etc.), Language support, Status (New/Verified/Sponsored) |
| **Sorting** | Relevance (default), Newest, Most Popular/Trending, Highest Rated, Recently Updated, A-Z |
| **Card Info** | Logo, name, 1-2 line description, pricing badge, 2-3 feature tags, upvote count, star rating, bookmark/save, CTA button, trending/new badges |
| **View** | Responsive grid (3-4 columns desktop, 2 tablet, 1 mobile), no list toggle |
| **Loading** | Infinite scroll or "Load More" button |
| **Empty State** | Reset all filters + recommend popular categories |
| **Social Proof** | Community upvotes, star ratings + review count, Verified badge, Editor's Pick, usage scale ("Used by 50k+") |

### 3. There's An AI For That (TAAFT)

| Dimension | Details |
|---|---|
| **Discovery** | Global search (Cmd+K), quick category bar, task-oriented navigation (Personal/Work/Creativity), Leaderboard, Map, Collections, Requests |
| **Filters** | Free mode (100% free/Freemium/Free Trial), task/category tags, country/region |
| **Sorting** | Latest (default), Popular, Trending, Most saved, Leaderboard, Deals, For You |
| **Card Info** | Logo, name, one-liner, category tags, release time ("Released 1h ago"), pricing model, country flag, view count, vote/save count, rating, embedded user comments |
| **View** | Grid flow (responsive) |
| **Loading** | Infinite scroll |
| **Empty State** | Not explicitly observed, likely follows standard pattern |
| **Social Proof** | View counts, vote/save counts, star ratings (4.8, 5.0), user comments with avatar+timestamp, developer karma, trending rank badges, "Used by 80M+" |

### 4. G2

| Dimension | Details |
|---|---|
| **Discovery** | Global search with category suggestions, category browsing (1000+ categories), comparison tools, market reports |
| **Filters** | Category, Pricing, Deployment (Cloud/On-Prem), Company Size (SMB/Mid/Enterprise), Industry, Platform/OS, Integrations, Feature keywords, Verified reviews only |
| **Sorting** | Relevance (default), Most Reviews, Highest Rated, Most Popular, Newest |
| **Card Info** | Logo, name, category, star rating (out of 5), review count, satisfaction score, pricing tier, brief description, "Compare" checkbox |
| **View** | List view (primary) |
| **Loading** | Pagination (page 1, 2, 3...) |
| **Empty State** | Suggestions to broaden search + alternative categories |
| **Social Proof** | Star ratings + detailed review counts, satisfaction scores, user segment ratings (SMB vs Enterprise), "Most Popular" badges, analyst picks |

### 5. Capterra

| Dimension | Details |
|---|---|
| **Discovery** | Global search, category navigation, comparison matrix, "Alternatives" pages |
| **Filters** | Category, Pricing model, Deployment type, Company size, Industry, Features (multi-select), Ratings threshold, Country |
| **Sorting** | Relevance, Most Reviews, Highest Rated, A-Z |
| **Card Info** | Logo, name, star rating, review count, pricing info, short description, "Compare" checkbox, "Visit" CTA |
| **View** | List view with comparison checkboxes |
| **Loading** | Pagination |
| **Social Proof** | Star ratings, review counts, "Easy to Use" / "Good Value" sub-scores, user segment ratings |

---

## Gap Analysis

### GAP 1: No Sorting Options

**What competitors do:**
- All 5 competitors offer sorting: Product Hunt (Hot/Upvoted/Discussed/Newest/Trending), Futurepedia (Relevance/Newest/Popular/Rated/Updated/A-Z), TAAFT (Latest/Popular/Trending/Most Saved), G2 (Reviews/Rated/Popular/New), Capterra (Reviews/Rated/A-Z)
- Sorting is placed prominently at top-right of results area

**What we do:**
- **No sorting at all.** Products are returned in whatever order the API returns them (likely by `created_at` descending)

**Priority: P0**

**Implementation:**
- Add sort selector dropdown next to results count
- Backend: Update `/api/products` to accept `sort_by` param with options: `newest` (default), `name_asc`, `name_desc`, `github_stars`, `confidence_score`, `updated_at`
- Frontend: Dropdown component with `Select` from shadcn/ui
- Show active sort in URL params for shareability

---

### GAP 2: No Pagination / Infinite Scroll

**What competitors do:**
- Product Hunt, Futurepedia, TAAFT: Infinite scroll with skeleton loading
- G2, Capterra: Traditional pagination (page numbers)
- All show result counts ("Showing 1-20 of 150")

**What we do:**
- **All products returned at once.** No pagination, no infinite scroll, no limit param
- With growing database this will become unusable

**Priority: P0**

**Implementation:**
- Backend: Add `page` and `limit` (default 20) params to `/api/products`
- Frontend option A: Infinite scroll with IntersectionObserver + "Load More" button fallback
- Frontend option B: Simple pagination component (shadcn/ui Pagination) — faster to implement
- Show "Showing X of Y products" text

---

### GAP 3: Limited Filter Dimensions

**What competitors do:**
- Product Hunt: Category + Pricing + Platform (7+ platforms) + API + Company stage
- Futurepedia: Pricing (5 types) + Use Case (50+ tags) + Features + Language + Status
- TAAFT: Pricing + Task/Category + Country + Deals
- G2: Category + Pricing + Deployment + Company Size + Industry + Integrations + Features
- Capterra: Category + Pricing + Deployment + Company Size + Industry + Features + Ratings threshold

**What we do:**
- **Only 2 active filters:** Category (single-select badges) and Pricing (single-select badges)
- `region` and `confidence` filters exist in state but are **not rendered in UI**
- No multi-select — can only pick ONE category or ONE pricing model

**Priority: P0**

**Implementation:**
- Convert category and pricing from single-select to **multi-select** (checkbox groups)
- Add filter for `availability_status` (Active/Low Active/Inactive/Dead) — data already exists
- Add filter for `confidence_level` (High/Medium/Low) — UI filter exists in state but not rendered
- Consider adding: tech_stack filter, open_source flag, launch_date range
- Persist filter state in URL params for sharing/bookmarking

---

### GAP 4: No Grid/List View Toggle

**What competitors do:**
- Product Hunt: List view only (optimized for comparison)
- Futurepedia: Grid view only (optimized for visual scanning)
- G2/Capterra: List view with comparison checkboxes
- Some platforms (ecommerce) offer toggle — best practice for directories with 100+ items

**What we do:**
- **Grid view only** (3-column responsive). No toggle.

**Priority: P2**

**Implementation:**
- Add view toggle button (Grid/List icons) next to sort dropdown
- List view: More compact, shows same data horizontally
- Persist preference in localStorage
- Lower priority since grid works fine for current scale

---

### GAP 5: Missing Social Proof on Product Cards

**What competitors do:**
- Product Hunt: Upvotes + comments count + maker avatar
- Futurepedia: Upvotes + star rating + review count
- TAAFT: View count + save count + star rating + embedded comments + developer karma
- G2: Star rating + review count + satisfaction score
- Capterra: Star rating + review count + sub-scores

**What we do:**
- **No reviews, no ratings, no user counts** on cards
- Only shows: confidence score badge, availability status, pricing model
- GitHub stars available in detail page but **not shown on card**
- No social proof beyond confidence score (which is platform-generated, not community-driven)

**Priority: P1**

**Implementation:**
- Add GitHub stars count to card (data already exists, just not displayed)
- Future: Add user rating system (stars + count)
- Show weekly growth rate as trend indicator (e.g., "+12% this week" with arrow)
- Consider "saved by X users" if watchlist data is aggregated

---

### GAP 6: Empty State is Generic

**What competitors do:**
- Product Hunt: Custom illustration + spell check + reset filters + category recommendations + submit product CTA
- Futurepedia: Reset all + popular category links
- G2/Capterra: Broaden search suggestions + alternative categories

**What we do:**
- Generic `NoResults` component with clear filters button
- No spelling suggestions, no category recommendations, no "submit a product" CTA

**Priority: P2**

**Implementation:**
- Enhance `NoResults` component to show:
  - Suggested popular categories as clickable links
  - "Clear all filters" button
  - "Can't find what you're looking for? Submit a product" link
  - If search query exists: "Did you mean..." (basic spell check)

---

### GAP 7: No Product Recommendations / Personalization

**What competitors do:**
- Product Hunt: Collections (curated lists), Topics (interest-based), "For You" feed
- Futurepedia: Featured/Editor's Pick, personalized recommendations
- TAAFT: "For You" sorting, Collections, task-based navigation
- G2: "Recommended for you" based on browsing history

**What we do:**
- **No recommendations.** Pure search + filter.
- Detail page has "Similar Products" but only by category match (basic)

**Priority: P2**

**Implementation:**
- Short term: Improve "Similar Products" algorithm (match on tags + tech_stack, not just category)
- Medium term: Add "Featured Products" section on discover page
- Long term: User preference tracking → personalized recommendations

---

### GAP 8: No Active Filter Pills / Visual Feedback

**What competitors do:**
- All competitors show active filters as removable pills/chips above results
- "3 filters applied" badge with clear individual or clear-all option

**What we do:**
- Filters are visible in sidebar but **no active filter pills** in the results area
- User must look at sidebar to see what's filtered
- On mobile, filter panel is hidden behind drawer — no visible indicator of active filters

**Priority: P1**

**Implementation:**
- Add filter pills row between search bar and results grid
- Each active filter shown as removable chip with X icon
- "Clear all" button when 2+ filters active
- Especially critical for mobile UX

---

### GAP 9: No URL State / Shareability

**What competitors do:**
- All competitors encode filters, sorting, and pagination in URL
- URLs are shareable and bookmarkable
- Browser back/forward works correctly

**What we do:**
- **No URL state.** Filters and search are purely React state
- Refreshing the page loses all filters
- Cannot share a filtered view via URL
- Browser back button doesn't restore previous filter state

**Priority: P1**

**Implementation:**
- Use `useSearchParams` (Next.js) to sync filters to URL
- Debounce URL updates to avoid excessive history entries
- On page load, read URL params to restore filter state
- Use `router.replace()` instead of `router.push()` to avoid bloating history

---

### GAP 10: No "Featured" or "Trending" Sections

**What competitors do:**
- Product Hunt: Today's launches, Trending, Top of Week/Month
- Futurepedia: Featured, Trending, New, Deals sections
- TAAFT: Trending tools, Just released, Leaderboard, Deals
- G2: Market Leaders, High Performers, Most Popular

**What we do:**
- **Flat list only.** No featured, no trending, no curated sections
- Discover page is purely search/filter — no discovery hooks

**Priority: P1**

**Implementation:**
- Add "Trending This Week" horizontal scroll section at top
- Add "Recently Launched" section
- Use `weekly_growth_rate` and `monthly_growth_rate` (already in data) for trending calculation
- Curated section can be manually managed initially, algorithmic later

---

## Priority Summary

| Priority | Gap | Impact | Effort |
|----------|-----|--------|--------|
| **P0** | No sorting options | High — users can't organize results | Low |
| **P0** | No pagination / infinite scroll | High — performance degrades with scale | Medium |
| **P0** | Limited filter dimensions | High — can't narrow down effectively | Medium |
| **P1** | Missing social proof on cards | Medium — less trust/engagement signals | Low |
| **P1** | No active filter pills | Medium — poor mobile UX | Low |
| **P1** | No URL state / shareability | Medium — can't bookmark/share views | Medium |
| **P1** | No featured/trending sections | Medium — no discovery hooks | Medium |
| **P2** | No grid/list view toggle | Low — grid works fine currently | Low |
| **P2** | Generic empty state | Low — functional but not delightful | Low |
| **P2** | No recommendations | Low — nice to have, not critical | High |

---

## Quick Wins (Low Effort, High Impact)

1. **Add sorting dropdown** — 1-2 hours frontend + backend
2. **Show GitHub stars on cards** — 30 min, data already exists
3. **Add active filter pills** — 1 hour
4. **URL state for filters** — 2-3 hours
5. **Multi-select filters** — 2 hours (convert badges to checkboxes)

## Recommended Implementation Order

1. **Sprint 1:** Sorting + Pagination + URL state + Filter pills
2. **Sprint 2:** Multi-select filters + Social proof on cards + Enhanced empty state
3. **Sprint 3:** Featured/Trending sections + Grid/List toggle + Recommendations
