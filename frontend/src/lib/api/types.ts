/**
 * AI Radar — Phase E Frontend API Common Types
 *
 * These types mirror `docs/phase-e-api-contracts.md` and are shared
 * by all Phase E React Query hooks (useLaunches / useTrends / useCategories).
 *
 * Note: this file is intentionally framework-agnostic (no React Query
 * imports) so it can be reused by Server Components or non-React layers.
 */

/**
 * Unified API response envelope (per `phase-e-api-contracts.md` §0.1).
 *
 * Success: `{ code: 0, data: <payload>, message: "ok" }`
 * Failure: `{ code: 4xxx | 5xxx, data: null, message: "..." }`
 */
export interface ApiEnvelope<T> {
  /** 0 = success; 4xxx = client error; 5xxx = server error. */
  code: number;
  /** Business payload on success; null on failure. */
  data: T | null;
  /** Human-readable message (English). */
  message: string;
}

/**
 * Standard pagination block (per §0.5).
 */
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
}

/**
 * Standard paginated list payload shape.
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * Range filter accepted by `/api/launches` and `/api/trends`.
 */
export type LaunchRange = '24h' | '7d' | '30d' | '90d' | 'all';
export type TrendRange = '7d' | '30d' | '90d';

/**
 * Source identifiers for launch_events.
 */
export type LaunchSource =
  | 'producthunt'
  | 'hackernews'
  | 'github'
  | 'x'
  | 'arxiv'
  | 'huggingface'
  | 'rss'
  | 'xiaohongshu';

/**
 * Event type taxonomy (per ADR-03 / contracts §1.1).
 */
export type LaunchEventType =
  | 'launch'
  | 'major_update'
  | 'open_source'
  | 'funding'
  | 'milestone'
  | 'pricing_change';

/**
 * Engagement block normalised across sources.
 */
export interface LaunchEngagement {
  upvotes?: number | null;
  comments?: number | null;
  stars?: number | null;
  retweets?: number | null;
  likes?: number | null;
  forks?: number | null;
}

/**
 * Single launch event item as returned by `GET /api/launches`.
 */
export interface LaunchItem {
  id: string;
  product_id: string | null;
  product_slug: string;
  product_name: string;
  product_logo_url: string | null;
  source: LaunchSource;
  source_url: string;
  event_type: LaunchEventType;
  title: string;
  body: string | null;
  author: string | null;
  engagement: LaunchEngagement;
  detected_at: string;
  event_at: string;
  confidence: number;
}

/**
 * Signal type taxonomy (per ADR-03 / contracts §2.1).
 */
export type TrendSignalType =
  | 'tag_emerging'
  | 'category_growing'
  | 'tech_stack_shift'
  | 'cluster_new'
  | 'funding_pattern';

/**
 * Status of a trend signal (per ADR-03).
 */
export type TrendStatus = 'emerging' | 'peaking' | 'cooling' | 'expired';

/**
 * Evidence block attached to a trend signal.
 */
export interface TrendEvidence {
  products?: string[];
  metrics?: {
    weekly_growth?: number;
    monthly_launches?: number;
    [key: string]: number | undefined;
  };
  sources?: string[];
}

/**
 * Single trend signal item as returned by `GET /api/trends`.
 */
export interface TrendItem {
  id: string;
  signal_type: TrendSignalType;
  /** e.g. `tag:agent-orchestration` / `category:text-to-3d`. */
  scope: string;
  title: string;
  description: string;
  evidence: TrendEvidence;
  /** 0-100. */
  strength: number;
  /** Week-over-week %, can be negative. */
  velocity: number;
  /** 0-1, novelty score. */
  novelty: number;
  first_seen: string;
  last_updated: string;
  status: TrendStatus;
  product_count: number;
}

/**
 * Single category item as returned by `GET /api/categories`.
 */
export interface CategoryItem {
  id: string;
  slug: string;
  name_en: string;
  name_zh: string;
  description: string | null;
  parent_id: string | null;
  product_count: number;
  hot_score: number;
  display_order: number;
  /** Icon identifier (e.g. `code`, `image`, `audio`). */
  icon: string | null;
}

/**
 * Categories API returns a flat item list plus a `total` count,
 * not a paginated list (per contracts §3.1).
 */
export interface CategoriesData {
  items: CategoryItem[];
  total: number;
}

/**
 * Client-side error raised when the API returns a non-zero code.
 */
export class ApiError extends Error {
  public readonly code: number;
  public readonly httpStatus: number;

  constructor(code: number, message: string, httpStatus: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// ---------------------------------------------------------------------------
// Newsletter types (per `docs/phase-f-w2-architecture.md` §7.5 / T-3 spec)
// ---------------------------------------------------------------------------

/**
 * Frequency options for the newsletter. The API accepts `daily | weekly |
 * monthly` but the DB CHECK constraint is `daily | weekly`; `monthly` is
 * coerced to `weekly` server-side.
 */
export type NewsletterFrequency = 'daily' | 'weekly' | 'monthly';

/** Persisted DB frequencies (subset of the above). */
export type NewsletterDbFrequency = 'daily' | 'weekly';

/** Locale for confirmation emails. */
export type NewsletterLanguage = 'en' | 'zh';

/** Source identifier for analytics (which form/variant the user came from). */
export type NewsletterSource =
  | 'home_footer'
  | 'home_inline'
  | 'launches_inline'
  | 'pricing_inline'
  | 'other';

/**
 * Request body for `POST /api/newsletter/subscribe`.
 */
export interface NewsletterSubscribeRequest {
  email: string;
  frequency?: NewsletterFrequency;
  language?: NewsletterLanguage;
  /** Optional list of category slugs to filter the digest by. */
  categories?: string[];
  /** Optional, defaults to `'home_footer'` server-side. */
  source?: NewsletterSource;
}

/**
 * Successful response payload for `POST /api/newsletter/subscribe`.
 *
 * `confirmation_required: true` means a confirmation email has been sent
 * (in mock mode it's logged to the server console and the link is also
 * returned in `dev_confirm_link` for fast QA). The user must click the
 * link before they receive any digests.
 */
export interface NewsletterSubscribeResponse {
  subscription_id: string;
  email: string;
  frequency: NewsletterDbFrequency;
  confirmation_required: boolean;
  /** Always `true` in W2 — the SMTP integration lands in P0.5. */
  mock_email_sent: boolean;
  /** Dev/QA shortcut to the confirmation URL; remove in production. */
  dev_confirm_link?: string;
}
