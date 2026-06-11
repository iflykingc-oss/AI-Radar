'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiEnvelope, ApiError, CategoriesData, CategoryItem } from './types';

/**
 * Parameters for the `useCategories` hook (per `phase-e-api-contracts.md` §3.1).
 */
export interface UseCategoriesParams {
  /** UUID of a parent category — when set, returns only its children. */
  parent_id?: string;
  /** Include categories with `product_count = 0`. Defaults to `false`. */
  include_empty?: boolean;
  /**
   * Sort order for the response.
   * - `display_order` (default) — manual curation
   * - `hot_score` — descending heat
   * - `product_count` — descending product count
   */
  order_by?: 'display_order' | 'hot_score' | 'product_count';
  /** Language for the `name` field — affects the API's `lang` query param. */
  lang?: 'en' | 'zh';
  /** Disable automatic fetching. */
  enabled?: boolean;
}

/**
 * Return shape of the `useCategories` hook.
 */
export interface UseCategoriesResult {
  /** Category items, or `null` until the first fetch resolves. */
  items: CategoryItem[] | null;
  /** Total count of categories returned (may differ from items.length when paginated server-side). */
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * React hook for fetching the category dictionary from `GET /api/categories`.
 *
 * The hook matches the contract in `docs/phase-e-api-contracts.md` §3.1.
 * Note: the categories endpoint is NOT paginated (it returns `{ items, total }`).
 *
 * During W2 prep the endpoint is not yet implemented, so the hook
 * gracefully degrades to an empty list. Once the endpoint ships, the
 * Discover sidebar and the L1 entry card on the home page will populate.
 *
 * @example
 * ```tsx
 * const { items, loading } = useCategories({ order_by: 'hot_score' });
 * ```
 */
export function useCategories(
  params: UseCategoriesParams = {},
): UseCategoriesResult {
  const {
    parent_id,
    include_empty = false,
    order_by = 'display_order',
    lang = 'en',
    enabled = true,
  } = params;

  const [items, setItems] = useState<CategoryItem[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/categories', window.location.origin);
      if (parent_id) url.searchParams.set('parent_id', parent_id);
      url.searchParams.set('include_empty', String(include_empty));
      url.searchParams.set('order_by', order_by);
      url.searchParams.set('lang', lang);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 501) {
          setItems([]);
          setTotal(0);
          return;
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch categories: ${response.status} ${errorText}`,
        );
      }

      const envelope: ApiEnvelope<CategoriesData> = await response.json();
      if (envelope.code !== 0 || !envelope.data) {
        throw new ApiError(
          envelope.code,
          envelope.message || 'Unknown error',
          response.status,
        );
      }

      setItems(envelope.data.items ?? []);
      setTotal(envelope.data.total ?? envelope.data.items?.length ?? 0);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unknown error fetching categories';
      console.warn('[useCategories] falling back to empty state:', message);
      setError(message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [enabled, parent_id, include_empty, order_by, lang]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    items,
    total,
    loading,
    error,
    refetch: fetchCategories,
  };
}
