'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApiEnvelope,
  ApiError,
  PaginatedData,
  TrendItem,
  TrendRange,
  TrendSignalType,
  TrendStatus,
} from './types';

/**
 * Parameters for the `useTrends` hook (per `phase-e-api-contracts.md` §2.1).
 */
export interface UseTrendsParams {
  /**
   * Time range over which strength/velocity are computed.
   * Defaults to `'7d'`.
   */
  range?: TrendRange;
  /** Optional filter by signal type. */
  signal_type?: TrendSignalType;
  /** Optional filter by lifecycle status. */
  status?: TrendStatus;
  /** Optional page number (1-indexed). */
  page?: number;
  /** Optional page size (max 100 per contract). */
  page_size?: number;
  /** Disable automatic fetching. */
  enabled?: boolean;
}

/**
 * Return shape of the `useTrends` hook.
 */
export interface UseTrendsResult {
  /** Trend items for the current page, or `null` until first fetch. */
  items: TrendItem[] | null;
  /** Total count of matching signals across all pages. */
  total: number;
  /** Page metadata returned by the API. */
  pagination: PaginatedData<TrendItem>['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * React hook for fetching trend signals from `GET /api/trends`.
 *
 * The hook matches the contract in `docs/phase-e-api-contracts.md` §2.1:
 * - Accepts `range`, `signal_type`, `status`, `page`, `page_size`.
 * - Respects the unified `{ code, data, message }` envelope.
 * - Falls back to empty data when the endpoint is not yet implemented
 *   (W2 prep), so the L3 entry card on the home page still renders.
 *
 * @example
 * ```tsx
 * const { items, loading, error } = useTrends({ range: '7d' });
 * ```
 */
export function useTrends(params: UseTrendsParams = {}): UseTrendsResult {
  const {
    range = '7d',
    signal_type,
    status,
    page = 1,
    page_size = 20,
    enabled = true,
  } = params;

  const [items, setItems] = useState<TrendItem[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] =
    useState<UseTrendsResult['pagination']>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/trends', window.location.origin);
      url.searchParams.set('range', range);
      url.searchParams.set('page', String(page));
      url.searchParams.set('page_size', String(page_size));
      if (signal_type) url.searchParams.set('signal_type', signal_type);
      if (status) url.searchParams.set('status', status);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
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
          `Failed to fetch trends: ${response.status} ${errorText}`,
        );
      }

      const envelope: ApiEnvelope<PaginatedData<TrendItem>> = await response.json();
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
        err instanceof Error ? err.message : 'Unknown error fetching trends';
      console.warn('[useTrends] falling back to empty state:', message);
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
  }, [enabled, range, signal_type, status, page, page_size]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return {
    items,
    total,
    pagination,
    loading,
    error,
    refetch: fetchTrends,
  };
}
