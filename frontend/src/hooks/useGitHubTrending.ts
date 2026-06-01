import { useState, useEffect, useCallback } from 'react';
import type {
  GitHubTrendingRepo,
  GitHubTrendingApiResponse,
} from '@/types/github-trending';

/**
 * Hook options for fetching GitHub Trending repos.
 */
export interface UseGitHubTrendingOptions {
  /** Number of repos to fetch (default: 30, max: 100). */
  limit?: number;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Hook return type for useGitHubTrending.
 */
export interface UseGitHubTrendingResult {
  /** Fetched GitHub trending repositories. */
  repos: GitHubTrendingRepo[];
  /** Total number of repos returned. */
  total: number;
  /** Whether the initial fetch is in progress. */
  loading: boolean;
  /** Error message if the fetch failed. */
  error: string | null;
  /** ISO timestamp when the data was fetched. */
  fetchedAt: string | null;
  /** Whether the returned data comes from the mock fallback. */
  isMock: boolean;
  /** Manual refetch function. */
  refetch: () => Promise<void>;
}

/**
 * React hook that fetches trending AI/ML repositories from GitHub.
 *
 * Automatically fetches on mount (unless `skip` is true) and provides
 * a `refetch` function for manual refresh.
 *
 * @example
 * ```tsx
 * const { repos, loading, error, refetch } = useGitHubTrending({ limit: 20 });
 * ```
 */
export function useGitHubTrending(
  options: UseGitHubTrendingOptions = {}
): UseGitHubTrendingResult {
  const { limit = 30, skip = false } = options;

  const [repos, setRepos] = useState<GitHubTrendingRepo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));

      const response = await fetch(`/api/sources/github-trending?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: GitHubTrendingApiResponse = await response.json();

      setRepos(data.items);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch GitHub Trending repos';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!skip) {
      fetchRepos();
    }
  }, [fetchRepos, skip]);

  return {
    repos,
    total,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchRepos,
  };
}
