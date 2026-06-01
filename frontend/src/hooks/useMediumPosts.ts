import { useState, useEffect, useCallback } from 'react';
import type { SourceItem, SourceApiResponse } from '@/types/sources';

/**
 * Parameters for fetching Medium articles.
 */
export interface UseMediumPostsParams {
  /** Number of articles to fetch (default: 20, max: 50). */
  limit?: number;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Return shape of the useMediumPosts hook.
 */
export interface UseMediumPostsResult {
  /** Array of fetched Medium articles. */
  articles: SourceItem[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error message if the fetch failed, otherwise null. */
  error: string | null;
  /** Total number of articles returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string | null;
  /** Source of the data: 'medium' or 'mock'. */
  source: string | null;
  /** Manually trigger a refetch with the current parameters. */
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching AI articles from Medium.
 *
 * Automatically fetches on mount and whenever the parameters change.
 * Provides loading and error states, plus a manual refetch function.
 *
 * @example
 * ```tsx
 * const { articles, loading, error, refetch } = useMediumPosts({ limit: 15 });
 * ```
 */
export function useMediumPosts(
  params: UseMediumPostsParams = {}
): UseMediumPostsResult {
  const { limit = 20, skip = false } = params;

  const [articles, setArticles] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/sources/medium', window.location.origin);
      url.searchParams.set('limit', String(limit));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch Medium articles: ${response.status} ${errorText}`);
      }

      const data: SourceApiResponse = await response.json();
      setArticles(data.items ?? []);
      setTotal(data.items?.length ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
      setSource(data.source ?? 'medium');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching Medium articles';
      console.error('useMediumPosts error:', message);
      setError(message);
      // Keep existing articles on error rather than clearing them.
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!skip) {
      fetchArticles();
    }
  }, [fetchArticles, skip]);

  return {
    articles,
    loading,
    error,
    total,
    fetchedAt,
    source,
    refetch: fetchArticles,
  };
}
