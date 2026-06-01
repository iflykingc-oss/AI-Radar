import { useState, useEffect, useCallback } from 'react';
import type { BlueskyPost, BlueskyApiResponse } from '@/types/bluesky';

/**
 * Hook options for fetching Bluesky posts.
 */
export interface UseBlueskyPostsOptions {
  /** Search query string (default: "AI product launch"). */
  query?: string;
  /** Number of posts to return (default: 20, max: 50). */
  limit?: number;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Hook return type for useBlueskyPosts.
 */
export interface UseBlueskyPostsResult {
  /** Fetched Bluesky posts. */
  posts: BlueskyPost[];
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
 * React hook that fetches AI product discussion posts from Bluesky Social.
 *
 * Uses the public Bluesky API (no auth required for read operations) to search
 * for posts matching the query, returning them sorted by engagement.
 *
 * @example
 * ```tsx
 * const { posts, loading, error, refetch } = useBlueskyPosts({ query: 'AI tool', limit: 15 });
 * ```
 */
export function useBlueskyPosts(
  options: UseBlueskyPostsOptions = {}
): UseBlueskyPostsResult {
  const { query = 'AI product launch', limit = 20, skip = false } = options;

  const [posts, setPosts] = useState<BlueskyPost[]>([]);
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
      params.set('q', query);
      params.set('limit', String(limit));

      const response = await fetch(`/api/sources/bluesky?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: BlueskyApiResponse = await response.json();

      setPosts(data.posts);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch Bluesky posts';
      setError(message);
      // Note: the API route itself falls back to mock data, so posts
      // may still be populated even on error.
    } finally {
      setLoading(false);
    }
  }, [query, limit]);

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
