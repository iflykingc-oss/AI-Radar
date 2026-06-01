import { useState, useEffect, useCallback } from 'react';

/**
 * HackerNews post shape returned by /api/sources/hackernews.
 */
export interface HNPost {
  objectID: string;
  title: string;
  author: string;
  points: number;
  numComments: number;
  url: string;
  createdAt: string;
  storyText?: string;
  isShowHN: boolean;
  isAskHN: boolean;
  productMentions?: string[];
}

/**
 * API response shape for the HackerNews source endpoint.
 */
interface HNApiResponse {
  posts: HNPost[];
  total: number;
  query: string;
  tag?: string;
  limit?: number;
  timeRange?: number;
  source?: string;
  fetchedAt: string;
}

/**
 * Parameters for fetching HN posts.
 */
export interface UseHNPostsParams {
  /** Filter by tag: show_hn, story, ask_hn (default: show_hn) */
  tag?: string;
  /** Search query string (default: "AI") */
  query?: string;
  /** Number of posts to fetch (default: 25, max: 50) */
  limit?: number;
  /** Time range in hours: 24, 168, 720 (default: 168) */
  timeRange?: number;
}

/**
 * Return shape of the useHNPosts hook.
 */
export interface UseHNPostsResult {
  /** Array of fetched HackerNews posts. */
  posts: HNPost[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error message if the fetch failed, otherwise null. */
  error: string | null;
  /** Total number of hits returned by the API. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string | null;
  /** Source of the data: 'algolia' or 'mock'. */
  source: string | null;
  /** Manually trigger a refetch with the current parameters. */
  refetch: () => void;
}

/**
 * React hook for fetching AI-related posts from HackerNews.
 *
 * Automatically fetches on mount and whenever the parameters change.
 * Provides loading and error states, plus a manual refetch function.
 *
 * @example
 * ```tsx
 * const { posts, loading, error, refetch } = useHNPosts({
 *   tag: 'show_hn',
 *   query: 'AI',
 *   limit: 25,
 *   timeRange: 168,
 * });
 * ```
 */
export function useHNPosts(params: UseHNPostsParams = {}): UseHNPostsResult {
  const { tag = 'show_hn', query = 'AI', limit = 25, timeRange = 168 } = params;

  const [posts, setPosts] = useState<HNPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/sources/hackernews', window.location.origin);
      url.searchParams.set('tag', tag);
      url.searchParams.set('query', query);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('timeRange', String(timeRange));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch HN posts: ${response.status} ${errorText}`);
      }

      const data: HNApiResponse = await response.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
      setSource(data.source ?? 'algolia');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching HN posts';
      console.error('useHNPosts error:', message);
      setError(message);
      // Keep existing posts on error rather than clearing them.
    } finally {
      setLoading(false);
    }
  }, [tag, query, limit, timeRange]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
