import { useState, useEffect, useCallback } from 'react';
import type { RedditPost, RedditApiResponse } from '@/types/reddit';

/**
 * Hook options for fetching Reddit posts.
 */
export interface UseRedditPostsOptions {
  /** Specific subreddit to query (default: all configured subreddits). */
  subreddit?: string;
  /** Number of posts to fetch per subreddit (default: 25, max: 100). */
  limit?: number;
  /** Time filter: hour, day, week, month, year, all (default: week). */
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Hook return type for useRedditPosts.
 */
export interface UseRedditPostsResult {
  /** Fetched Reddit posts. */
  posts: RedditPost[];
  /** Total number of posts returned. */
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
 * React hook that fetches recent top posts from AI-related subreddits.
 *
 * Automatically fetches on mount (unless `skip` is true) and provides
 * a `refetch` function for manual refresh.
 *
 * @example
 * ```tsx
 * const { posts, loading, error, refetch } = useRedditPosts({ limit: 10, time: 'day' });
 * ```
 */
export function useRedditPosts(
  options: UseRedditPostsOptions = {}
): UseRedditPostsResult {
  const { subreddit, limit = 25, time = 'week', skip = false } = options;

  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (subreddit) params.set('subreddit', subreddit);
      params.set('limit', String(limit));
      params.set('time', time);

      const response = await fetch(`/api/sources/reddit?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: RedditApiResponse = await response.json();

      setPosts(data.posts);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch Reddit posts';
      setError(message);
      // Note: the API route itself falls back to mock data, so posts
      // may still be populated even on error. We leave existing posts
      // or empty array depending on desired UX.
    } finally {
      setLoading(false);
    }
  }, [subreddit, limit, time]);

  useEffect(() => {
    if (!skip) {
      fetchPosts();
    }
  }, [fetchPosts, skip]);

  return {
    posts,
    total,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchPosts,
  };
}
