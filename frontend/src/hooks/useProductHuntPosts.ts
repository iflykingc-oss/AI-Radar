import { useState, useEffect, useCallback } from 'react';
import type { ProductHuntPost, ProductHuntApiResponse } from '@/types/producthunt';

/**
 * Hook options for fetching Product Hunt posts.
 */
export interface UseProductHuntPostsOptions {
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Hook return type for useProductHuntPosts.
 */
export interface UseProductHuntPostsResult {
  /** Fetched Product Hunt posts. */
  items: ProductHuntPost[];
  /** Total number of items returned. */
  total: number;
  /** Whether the initial fetch is in progress. */
  loading: boolean;
  /** Error message if the fetch failed (even mock data may be returned). */
  error: string | null;
  /** ISO timestamp when the data was fetched. */
  fetchedAt: string | null;
  /** Whether the returned data comes from the mock fallback. */
  isMock: boolean;
  /** Manual refetch function. */
  refetch: () => Promise<void>;
}

/**
 * React hook that fetches latest AI products from Product Hunt.
 *
 * Automatically fetches on mount (unless `skip` is true) and provides
 * a `refetch` function for manual refresh.
 *
 * @example
 * ```tsx
 * const { items, loading, error, refetch } = useProductHuntPosts();
 * ```
 */
export function useProductHuntPosts(
  options: UseProductHuntPostsOptions = {}
): UseProductHuntPostsResult {
  const { skip = false } = options;

  const [items, setItems] = useState<ProductHuntPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sources/producthunt', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: ProductHuntApiResponse = await response.json();

      setItems(data.items);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch Product Hunt posts';
      setError(message);
      // The API route itself falls back to mock data, so items
      // may still be populated even when an error is logged.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skip) {
      fetchItems();
    }
  }, [fetchItems, skip]);

  return {
    items,
    total,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchItems,
  };
}
