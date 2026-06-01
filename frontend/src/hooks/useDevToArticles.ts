import { useState, useEffect, useCallback } from 'react';
import type { DevToArticle, DevToApiResponse } from '@/types/devto';

/**
 * Hook options for fetching Dev.to articles.
 */
export interface UseDevToArticlesOptions {
  /** Specific Dev.to tag to query (default: all configured tags). */
  tag?: string;
  /** Number of articles to fetch per tag (default: 15, max: 30). */
  perPage?: number;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Hook return type for useDevToArticles.
 */
export interface UseDevToArticlesResult {
  /** Fetched Dev.to articles. */
  articles: DevToArticle[];
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
 * React hook that fetches top AI/ML articles from Dev.to.
 *
 * Automatically fetches on mount (unless `skip` is true) and provides
 * a `refetch` function for manual refresh.
 *
 * @example
 * ```tsx
 * const { articles, loading, error, refetch } = useDevToArticles({ perPage: 10 });
 * ```
 */
export function useDevToArticles(
  options: UseDevToArticlesOptions = {}
): UseDevToArticlesResult {
  const { tag, perPage = 15, skip = false } = options;

  const [articles, setArticles] = useState<DevToArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (tag) params.set('tag', tag);
      params.set('per_page', String(perPage));

      const response = await fetch(
        `/api/sources/devto?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: DevToApiResponse = await response.json();

      setArticles(data.articles);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch Dev.to articles';
      setError(message);
      // Note: the API route itself falls back to mock data, so articles
      // may still be populated even on error. We leave existing articles
      // or empty array depending on desired UX.
    } finally {
      setLoading(false);
    }
  }, [tag, perPage]);

  useEffect(() => {
    if (!skip) {
      fetchArticles();
    }
  }, [fetchArticles, skip]);

  return {
    articles,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchArticles,
  };
}
