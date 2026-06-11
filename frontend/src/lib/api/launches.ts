'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApiEnvelope,
  ApiError,
  LaunchItem,
  LaunchRange,
  PaginatedData,
} from './types';

/**
 * Parameters for the `useLaunches` hook (per `phase-e-api-contracts.md` §1.1).
 */
export interface UseLaunchesParams {
  /**
   * Time range filter. Maps directly to the `range` query param.
   * Defaults to `'24h'` to match the home page "today" strip.
   */
  range?: LaunchRange;
  /** Optional page number (1-indexed). */
  page?: number;
  /** Optional page size (max 100 per contract). */
  page_size?: number;
  /**
   * Disable automatic fetching (e.g. when the user is on a paywalled
   * plan and we want to keep the skeleton showing).
   */
  enabled?: boolean;
}

/**
 * Return shape of the `useLaunches` hook.
 */
export interface UseLaunchesResult {
  /** Items for the current page, or `null` until the first fetch resolves. */
  items: LaunchItem[] | null;
  /** Total count of matching items across all pages. */
  total: number;
  /** Page metadata returned by the API (null until first success). */
  pagination: PaginatedData<LaunchItem>['pagination'] | null;
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error from the last failed fetch, or null. */
  error: string | null;
  /** Manually re-trigger the fetch. */
  refetch: () => void;
}

/**
 * React hook for fetching launch events from `GET /api/launches`.
 *
 * The hook matches the contract in `docs/phase-e-api-contracts.md` §1.1:
 * - Accepts `range`, `page`, `page_size` query params.
 * - Respects the unified response envelope `{ code, data, message }`.
 * - Throws / surfaces `ApiError` for non-zero codes.
 *
 * During W2 prep the `/api/launches` route is not yet implemented, so
 * when the request fails the hook falls back to empty placeholder data
 * (matching the existing `LayerEntryCard` contract `{ count: 0, items: [] }`).
 * Once the endpoint ships, real data will flow through transparently.
 *
 * @example
 * ```tsx
 * const { items, loading, error } = useLaunches({ range: '24h' });
 * ```
 */
export function useLaunches(params: UseLaunchesParams = {}): UseLaunchesResult {
  const { range = '24h', page = 1, page_size = 20, enabled = true } = params;

  const [items, setItems] = useState<LaunchItem[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] =
    useState<UseLaunchesResult['pagination']>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchLaunches = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/launches', window.location.origin);
      url.searchParams.set('range', range);
      url.searchParams.set('page', String(page));
      url.searchParams.set('page_size', String(page_size));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        // Do not cache during W2 prep — the endpoint contract is still
        // settling and we want fresh data on every refetch.
        cache: 'no-store',
      });

      if (!response.ok) {
        // Endpoint not yet implemented (W2 prep). Fall back to placeholder.
        if (response.status === 404 || response.status === 501) {
          setItems([]);
          setTotal(0);
          setPagination({
            page,
            page_size,
            total: 0,
            total_pages: 0,
            has_next: false,
          });
          return;
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch launches: ${response.status} ${errorText}`,
        );
      }

      const envelope: ApiEnvelope<PaginatedData<LaunchItem>> = await response.json();
      if (envelope.code !== 0 || !envelope.data) {
        throw new ApiError(
          envelope.code,
          envelope.message || 'Unknown error',
          response.status,
        );
      }

      setItems(envelope.data.items ?? []);
      setTotal(envelope.data.pagination?.total ?? 0);
      setPagination(envelope.data.pagination ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error fetching launches';
      // Keep W2 UX resilient: silently degrade to empty state so the
      // entry card still renders. Once the endpoint ships, real errors
      // will surface via `error` and the existing `LayerEntryCard`
      // skeleton will switch to an error badge.
      console.warn('[useLaunches] falling back to empty state:', message);
      setError(message);
      setItems([]);
      setTotal(0);
      setPagination({
        page,
        page_size,
        total: 0,
        total_pages: 0,
        has_next: false,
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, range, page, page_size]);

  useEffect(() => {
    fetchLaunches();
  }, [fetchLaunches]);

  return {
    items,
    total,
    pagination,
    loading,
    error,
    refetch: fetchLaunches,
  };
}
