import { useState, useEffect, useCallback } from 'react';
import type { AIHotItem, AIHotApiResponse } from '@/types/aihot';

/**
 * Parameters for fetching AIHot items.
 */
export interface UseAIHotItemsParams {
  /** Fetch mode: 'selected' for curated items, 'all' for broader coverage. */
  mode?: 'selected' | 'all';
  /** Keyword search query (uses PostgreSQL ILIKE fuzzy match). */
  query?: string;
  /** Filter by category. */
  category?: string;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Return shape of the useAIHotItems hook.
 */
export interface UseAIHotItemsResult {
  /** Array of fetched AIHot items. */
  items: AIHotItem[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error message if the fetch failed, otherwise null. */
  error: string | null;
  /** Total number of items returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string | null;
  /** Source of the data: 'aihot' or 'mock'. */
  source: string | null;
  /** Manually trigger a refetch with the current parameters. */
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching AI hot topics from aihot.virxact.com.
 *
 * Automatically fetches on mount and whenever the parameters change.
 * Provides loading and error states, plus a manual refetch function.
 *
 * @example
 * ```tsx
 * // Fetch selected items
 * const { items, loading, error, refetch } = useAIHotItems();
 *
 * // Fetch all items
 * const { items, loading } = useAIHotItems({ mode: 'all' });
 *
 * // Search for specific keywords
 * const { items, loading } = useAIHotItems({ query: 'LLM' });
 *
 * // Filter by category
 * const { items, loading } = useAIHotItems({ category: 'Model Release' });
 * ```
 */
export function useAIHotItems(params: UseAIHotItemsParams = {}): UseAIHotItemsResult {
  const { mode = 'selected', query, category, skip = false } = params;

  const [items, setItems] = useState<AIHotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/sources/aihot', window.location.origin);
      url.searchParams.set('mode', mode);
      if (query) {
        url.searchParams.set('q', query);
      }
      if (category) {
        url.searchParams.set('category', category);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch AIHot items: ${response.status} ${errorText}`);
      }

      const data: AIHotApiResponse = await response.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
      setSource(data.source ?? 'aihot');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching AIHot items';
      console.error('useAIHotItems error:', message);
      setError(message);
      // Keep existing items on error rather than clearing them.
    } finally {
      setLoading(false);
    }
  }, [mode, query, category]);

  useEffect(() => {
    if (!skip) {
      fetchItems();
    }
  }, [fetchItems, skip]);

  return {
    items,
    loading,
    error,
    total,
    fetchedAt,
    source,
    refetch: fetchItems,
  };
}
