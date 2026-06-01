import { useState, useEffect, useCallback } from 'react';
import type { SourceItem, SourceApiResponse } from '@/types/sources';

/**
 * Parameters for fetching Lobsters posts.
 */
export interface UseLobstersPostsParams {
  /** Number of posts to fetch (default: 20, max: 50). */
  limit?: number;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Return shape of the useLobstersPosts hook.
 */
export interface UseLobstersPostsResult {
  /** Array of fetched Lobsters posts. */
  posts: SourceItem[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error message if the fetch failed, otherwise null. */
  error: string | null;
  /** Total number of posts returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string | null;
  /** Source of the data: 'lobsters' or 'mock'. */
  source: string | null;
  /** Manually trigger a refetch with the current parameters. */
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching AI/ML posts from Lobsters community.
 *
 * Automatically fetches on mount and whenever the parameters change.
 * Provides loading and error states, plus a manual refetch function.
 *
 * @example
 * ```tsx
 * const { posts, loading, error, refetch } = useLobstersPosts({ limit: 15 });
 * ```
 */
export function useLobstersPosts(
  params: UseLobstersPostsParams = {}
): UseLobstersPostsResult {
  const { limit = 20, skip = false } = params;

  const [posts, setPosts] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/sources/lobsters', window.location.origin);
      url.searchParams.set('limit', String(limit));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch Lobsters posts: ${response.status} ${errorText}`);
      }

      const data: SourceApiResponse = await response.json();
      setPosts(data.items ?? []);
      setTotal(data.items?.length ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
      setSource(data.source ?? 'lobsters');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching Lobsters posts';
      console.error('useLobstersPosts error:', message);
      setError(message);
      // Keep existing posts on error rather than clearing them.
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!skip) {
      fetchPosts();
    }
  }, [fetchPosts, skip]);

  return {
    posts,
    loading,
    error,
    total,
    fetchedAt,
    source,
    refetch: fetchPosts,
  };
}
