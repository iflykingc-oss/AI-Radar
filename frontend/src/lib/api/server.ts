/**
 * AI Radar — Server-side API fetchers (Phase E / W2 T-1)
 *
 * This module provides **Server Component / Route Handler-safe** helpers
 * for calling the AI Radar JSON APIs (`/api/...`) during SSR / RSC
 * rendering. It mirrors the client-side hooks in `categories.ts`,
 * `trends.ts`, and `launches.ts` but does NOT use `useState` /
 * `useEffect` / `window`, and respects Next.js 14's `cache()` /
 * `revalidateTag()` primitives for per-request memoisation.
 *
 * ## T-1 ownership & merge plan
 * This file was created by Kou-B (Engineer B) as a **fallback / draft**
 * for T-2 (P0) because T-1 (the dedicated `lib/api/server.ts` task owned
 * by Engineer A) had not yet merged when the W2 T-2 page rewrites
 * started. It intentionally matches the contract documented in
 * `docs/phase-e-api-contracts.md` §0.1 (envelope) and §0.5 (pagination),
 * so the two implementations are drop-in compatible.
 *
 * When T-1 ships, Engineer A should:
 *  1. Take this file as the merge base, or
 *  2. Replace it with their preferred implementation.
 * Either way, the public export surface (`fetchEnvelope`,
 * `fetchCategories`, `fetchTrends`, `fetchLaunches`) and the return
 * shapes must remain stable so the T-2 pages do not have to change.
 *
 * ## Conventions
 * - All helpers are async functions, never hooks.
 * - They never throw to the caller for 404/501 — they return `null` /
 *   empty payload and log a single `console.warn`.
 * - The unified envelope is **unwrapped** for callers — they receive
 *   the bare `data` field (or `null` on non-zero `code`).
 * - `next: { revalidate }` is set per call so different ranges /
 *   filters get independent cache keys.
 */

import { cache } from 'react';
import { headers } from 'next/headers';
import {
  ApiEnvelope,
  CategoriesData,
  CategoryItem,
  LaunchItem,
  PaginatedData,
  TrendItem,
} from './types';
import type { LayerEntryPreview } from '@/components/home/LayerEntryCard';

/* ===========================================================================
 * T-1 aliases + builders
 *
 * The T-1 home page and /launches page were written against a slightly
 * different export shape than the W2 T-2 helpers above:
 *   - `fetchXxxServer` (new) — accepts a `revalidate` override in params
 *     so the caller can tune the cache window per-page.
 *   - `buildL{1,2,3}FromXxx` (new) — transform a `T | null` payload into
 *     the `LayerData` shape that `<LayerEntrySection>` / `<LayerEntryCard>`
 *     expect. Centralised here so the home page and any future caller
 *     share the same "count + preview items" rendering contract.
 *
 * The new helpers **delegate to** the originals so we don't duplicate
 * cache logic; we only re-shape the args + result.
 * ========================================================================== */

/**
 * Shape returned by `buildL1FromCategories` / `buildL2FromLaunches` /
 * `buildL3FromTrends`. Matches `LayerData` from `<LayerEntrySection>`.
 */
export interface LayerEntryData {
  count: number;
  items: LayerEntryPreview[];
}

/**
 * Server-side fetcher for `/api/categories` — T-1 alias.
 *
 * Same as `fetchCategories` but accepts a `revalidate` override and uses
 * the same parameter names as the W1 API contract. Returns `null` on
 * failure (404/501/network); the caller is expected to render a
 * placeholder rather than `throw`.
 */
export async function fetchCategoriesServer(
  params: {
    parent_id?: string;
    include_empty?: boolean;
    order_by?: 'display_order' | 'hot_score' | 'product_count';
    lang?: 'en' | 'zh';
    revalidate?: number;
  } = {},
): Promise<CategoriesData | null> {
  const data = await fetchEnvelope<CategoriesData>(
    '/api/categories',
    {
      parent_id: params.parent_id,
      include_empty: params.include_empty ? 'true' : 'false',
      order_by: params.order_by ?? 'display_order',
      lang: params.lang ?? 'en',
    },
    { next: { revalidate: params.revalidate ?? 60, tags: ['categories'] } },
  );
  if (!data) return null;
  return {
    items: data.items ?? [],
    total: data.total ?? data.items?.length ?? 0,
  };
}

/**
 * Server-side fetcher for `/api/launches` — T-1 alias.
 *
 * Accepts the full launch filter set (range, source, event_type,
 * category, min_confidence, page, page_size) and a `revalidate` knob.
 * Returns `null` on failure.
 */
export async function fetchLaunchesServer(
  params: {
    range?: '24h' | '7d' | '30d' | '90d' | 'all';
    source?: string;
    event_type?: string;
    category?: string;
    min_confidence?: number;
    page?: number;
    page_size?: number;
    revalidate?: number;
  } = {},
): Promise<PaginatedData<LaunchItem> | null> {
  const data = await fetchEnvelope<PaginatedData<LaunchItem>>(
    '/api/launches',
    {
      range: params.range ?? '24h',
      source: params.source,
      event_type: params.event_type,
      category: params.category,
      min_confidence: params.min_confidence,
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    },
    { next: { revalidate: params.revalidate ?? 60, tags: ['launches'] } },
  );
  if (!data) return null;
  return {
    items: data.items ?? [],
    pagination: data.pagination ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      total: data.items?.length ?? 0,
      total_pages: 1,
      has_next: false,
    },
  };
}

/**
 * Server-side fetcher for `/api/trends` — T-1 alias.
 *
 * Accepts the trend filter set (range, signal_type, status, page,
 * page_size) and a `revalidate` knob. Returns `null` on failure.
 */
export async function fetchTrendsServer(
  params: {
    range?: '7d' | '30d' | '90d';
    signal_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
    revalidate?: number;
  } = {},
): Promise<PaginatedData<TrendItem> | null> {
  const data = await fetchEnvelope<PaginatedData<TrendItem>>(
    '/api/trends',
    {
      range: params.range ?? '7d',
      signal_type: params.signal_type,
      status: params.status,
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    },
    { next: { revalidate: params.revalidate ?? 60, tags: ['trends'] } },
  );
  if (!data) return null;
  return {
    items: data.items ?? [],
    pagination: data.pagination ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      total: data.items?.length ?? 0,
      total_pages: 1,
      has_next: false,
    },
  };
}

/* ---------------------------------------------------------------------------
 * Builders: turn an API payload (or `null`) into the `LayerData` shape
 * the home page's `<LayerEntryCard>` expects.
 *
 * When the payload is `null` (API failed / 404 / 501), the builder
 * returns `{ count: 0, items: [] }` so the card renders its built-in
 * skeleton placeholder (per LayerEntryCard's W2 prep behaviour).
 * ------------------------------------------------------------------------- */

/**
 * L1 = mature / root categories. We use the top-N categories ordered
 * by `display_order` as a teaser preview, and `total` as the count.
 */
export function buildL1FromCategories(
  data: CategoriesData | null,
  limit: number = 5,
): LayerEntryData {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    return { count: 0, items: [] };
  }
  const items: LayerEntryPreview[] = data.items
    .filter((c) => c.parent_id === null)
    .slice(0, limit)
    .map((c) => ({
      title: c.name_zh || c.name_en,
      meta: c.product_count > 0 ? `${c.product_count} 个产品` : undefined,
      href: `/discover?category=${encodeURIComponent(c.slug)}`,
    }));
  return {
    count: data.total ?? data.items.length,
    items,
  };
}

/**
 * L2 = 24h launches. Top-N launches by `event_at` (already sorted by
 * the API). We use the event title as the preview text and a short
 * source label as meta.
 */
export function buildL2FromLaunches(
  data: PaginatedData<LaunchItem> | null,
  limit: number = 3,
): LayerEntryData {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    return { count: 0, items: [] };
  }
  const items: LayerEntryPreview[] = data.items.slice(0, limit).map((l) => ({
    title: l.product_name || l.title,
    meta: l.source,
    href: l.source_url || (l.product_slug ? `/products/${l.product_slug}` : '/launches'),
  }));
  return {
    count: data.pagination?.total ?? data.items.length,
    items,
  };
}

/**
 * L3 = 7d trends. Top-N trends by `strength` (API returns strongest
 * first; if not, we accept the server's ordering).
 */
export function buildL3FromTrends(
  data: PaginatedData<TrendItem> | null,
  limit: number = 3,
): LayerEntryData {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    return { count: 0, items: [] };
  }
  const items: LayerEntryPreview[] = data.items.slice(0, limit).map((t) => ({
    title: t.title,
    meta: `强度 ${Math.round(t.strength)}`,
    href: `/trends?range=7d#${encodeURIComponent(t.scope)}`,
  }));
  return {
    count: data.pagination?.total ?? data.items.length,
    items,
  };
}

/**
 * Options accepted by the generic `fetchEnvelope` helper.
 */
export interface FetchEnvelopeOptions {
  /**
   * Next.js fetch cache mode. Defaults to `{ revalidate: 60 }` so
   * pages stay warm for 60s without being permanently static. Pass
   * `{ cache: 'no-store' }` for always-fresh data, or `0` for
   * effectively no cache.
   */
  next?: { revalidate?: number; tags?: string[] };
  /** Extra headers to attach, e.g. forwarded cookies for auth. */
  headers?: HeadersInit;
  /** Optional AbortSignal for the underlying fetch. */
  signal?: AbortSignal;
}

/**
 * Build an absolute URL for a server-side fetch. Honours the standard
 * environment variables used by Next.js (`NEXT_PUBLIC_SITE_URL`,
 * `VERCEL_URL`) and falls back to a relative fetch via the configured
 * `baseUrl` argument.
 *
 * T-1 fix: when called from an RSC, prefer the **actual request's**
 * `host` header. The previous hard-coded fallback to
 * `http://localhost:3000` was fragile in dev — when port 3000 is
 * occupied (e.g. by a leftover `next dev` process) Next.js auto-picks
 * 3001/3002, and every internal fetch then crashed with ECONNREFUSED
 * against the now-unbound 3000. The new behaviour:
 *   1. Explicit env override (`AI_RADAR_INTERNAL_BASE_URL`) wins.
 *   2. If `headers()` is available (RSC / route handler), use the
 *      request's `host` + `x-forwarded-proto` (or `http` for dev).
 *   3. VERCEL_URL for Vercel previews.
 *   4. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL for self-hosted prod.
 *   5. Hard-coded `http://localhost:3000` last-resort dev default.
 *
 * The `try { headers() } catch` wrapper keeps the helper callable from
 * non-RSC contexts (e.g. Node scripts, tests) where `headers()` would
 * throw.
 */
function resolveBaseUrl(): string {
  // 1. Explicit override always wins.
  const explicit = process.env.AI_RADAR_INTERNAL_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // 2. In RSC / route handler context, derive from the request itself.
  try {
    const h = headers();
    const host = h.get('host');
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? 'http';
      return `${proto}://${host}`;
    }
  } catch {
    // headers() is not available outside an active request — fall through.
  }

  // 3. Vercel deployments set VERCEL_URL (no protocol).
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  // 4. Self-hosted prod via NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL.
  const publicSite = process.env.NEXT_PUBLIC_SITE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL;
  if (publicSite) return publicSite.replace(/\/$/, '');

  // 5. Dev fallback.
  return 'http://localhost:3000';
}

/**
 * Generic server-side fetch that unwraps the unified `ApiEnvelope<T>`.
 *
 * Behaviour matrix:
 *
 * | HTTP status | App code     | Returns                | Logs             |
 * |-------------|--------------|------------------------|------------------|
 * | 200         | 0            | `envelope.data`        | —                |
 * | 200         | non-zero     | `null`                 | `[server] warn`  |
 * | 404 / 501   | any          | `null`                 | `[server] warn`  |
 * | 5xx         | any          | `null`                 | `[server] error` |
 * | network err | n/a          | `null`                 | `[server] error` |
 *
 * @example
 * ```ts
 * const data = await fetchEnvelope<PaginatedData<TrendItem>>(
 *   '/api/trends',
 *   { range: '7d', page_size: '20' },
 *   { next: { revalidate: 60 } }
 * );
 * ```
 */
export async function fetchEnvelope<T>(
  path: string,
  searchParams: Record<string, string | number | boolean | undefined> = {},
  options: FetchEnvelopeOptions = {},
): Promise<T | null> {
  const base = resolveBaseUrl();
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      // Default to short-window revalidation so the page is dynamic-ish
      // but still cache-friendly. Callers can override.
      next: options.next ?? { revalidate: 60 },
      signal: options.signal,
    });

    if (res.status === 404 || res.status === 501) {
      console.warn(
        `[server] ${path} returned ${res.status} — returning null`,
      );
      return null;
    }

    if (!res.ok) {
      console.error(
        `[server] ${path} HTTP ${res.status} ${res.statusText}`,
      );
      return null;
    }

    const envelope = (await res.json()) as ApiEnvelope<T>;
    if (envelope.code !== 0 || envelope.data === null) {
      console.warn(
        `[server] ${path} app.code=${envelope.code} message="${envelope.message}"`,
      );
      return null;
    }

    return envelope.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[server] ${path} network error: ${message}`);
    return null;
  }
}

/**
 * Server-side fetcher for `/api/categories`. Returns the unwrapped
 * `CategoriesData` payload (items + total), or `null` if the API is
 * not yet implemented / fails.
 *
 * Wrapped in React `cache()` so repeated calls within the same request
 * share a single network round trip.
 *
 * @example
 * ```ts
 * const data = await fetchCategories({ order_by: 'display_order', lang: 'en' });
 * if (!data) return <DiscoverEmptyState />;
 * ```
 */
export const fetchCategories = cache(
  async (
    params: {
      parent_id?: string;
      include_empty?: boolean;
      order_by?: 'display_order' | 'hot_score' | 'product_count';
      lang?: 'en' | 'zh';
    } = {},
  ): Promise<CategoriesData | null> => {
    const data = await fetchEnvelope<CategoriesData>(
      '/api/categories',
      {
        parent_id: params.parent_id,
        include_empty: params.include_empty ? 'true' : 'false',
        order_by: params.order_by ?? 'display_order',
        lang: params.lang ?? 'en',
      },
      { next: { revalidate: 60, tags: ['categories'] } },
    );
    if (!data) return null;
    return {
      items: data.items ?? [],
      total: data.total ?? data.items?.length ?? 0,
    };
  },
);

/**
 * Convenience: fetch only the **root** (mature) categories, i.e.
 * categories with `parent_id IS NULL`. This is what `/discover` and
 * the home page's L1 entry card use.
 *
 * Implementation note: the `/api/categories` endpoint as of W2
 * accepts a `parent_id` filter but does not have a `layer=mature`
 * shortcut, so we simply request no parent and let the API return the
 * tree — callers can then filter roots client-side. We expose a
 * convenience `roots` array on the result for ergonomics.
 */
export interface MatureCategoriesData extends CategoriesData {
  /** Only root categories (parent_id null). */
  roots: CategoryItem[];
  /** Sum of product_count across all roots (for the "X categories" header). */
  total_products: number;
}

export async function fetchMatureCategories(
  lang: 'en' | 'zh' = 'en',
): Promise<MatureCategoriesData | null> {
  const data = await fetchCategories({ order_by: 'display_order', lang });
  if (!data) return null;
  const roots = data.items.filter((c) => c.parent_id === null);
  const total_products = roots.reduce((sum, c) => sum + (c.product_count || 0), 0);
  return { ...data, roots, total_products };
}

/**
 * Server-side fetcher for `/api/trends`. Returns the unwrapped
 * `PaginatedData<TrendItem>` payload or `null`.
 *
 * @example
 * ```ts
 * const data = await fetchTrends({ range: '7d', page_size: 20 });
 * ```
 */
export const fetchTrends = cache(
  async (
    params: {
      range?: '7d' | '30d' | '90d';
      signal_type?: string;
      status?: string;
      page?: number;
      page_size?: number;
    } = {},
  ): Promise<PaginatedData<TrendItem> | null> => {
    const data = await fetchEnvelope<PaginatedData<TrendItem>>(
      '/api/trends',
      {
        range: params.range ?? '7d',
        signal_type: params.signal_type,
        status: params.status,
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
      },
      { next: { revalidate: 60, tags: ['trends'] } },
    );
    if (!data) return null;
    return {
      items: data.items ?? [],
      pagination: data.pagination ?? {
        page: 1,
        page_size: data.items?.length ?? 0,
        total: data.items?.length ?? 0,
        total_pages: 1,
        has_next: false,
      },
    };
  },
);

/**
 * Server-side fetcher for `/api/launches`. Returns the unwrapped
 * `PaginatedData<LaunchItem>` payload or `null`. Currently unused by
 * the W2 T-2 pages but exported for symmetry and to give the future
 * `/launches` rewrite a one-line import.
 */
export const fetchLaunches = cache(
  async (
    params: {
      range?: '24h' | '7d' | '30d' | '90d' | 'all';
      source?: string;
      category?: string;
      page?: number;
      page_size?: number;
    } = {},
  ): Promise<PaginatedData<LaunchItem> | null> => {
    const data = await fetchEnvelope<PaginatedData<LaunchItem>>(
      '/api/launches',
      {
        range: params.range ?? '24h',
        source: params.source,
        category: params.category,
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
      },
      { next: { revalidate: 30, tags: ['launches'] } },
    );
    if (!data) return null;
    return {
      items: data.items ?? [],
      pagination: data.pagination ?? {
        page: 1,
        page_size: data.items?.length ?? 0,
        total: data.items?.length ?? 0,
        total_pages: 1,
        has_next: false,
      },
    };
  },
);

export default {
  fetchEnvelope,
  fetchCategories,
  fetchMatureCategories,
  fetchTrends,
  fetchLaunches,
};
