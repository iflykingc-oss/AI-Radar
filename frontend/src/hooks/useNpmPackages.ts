import { useState, useEffect, useCallback } from 'react';
import type { NpmPackage, NpmApiEndpointResponse } from '@/types/npm';

/**
 * Hook options for fetching npm trending AI packages.
 */
export interface UseNpmPackagesOptions {
  /** Whether to skip the initial fetch. */
  skip?: boolean;
  /** Additional search query appended to AI keywords (optional). */
  query?: string;
  /** Number of packages to fetch (default: 20, max: 50). */
  limit?: number;
}

/**
 * Hook return type for useNpmPackages.
 */
export interface UseNpmPackagesResult {
  /** Fetched npm packages. */
  packages: NpmPackage[];
  /** Total number of packages returned. */
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
 * React hook that fetches trending AI/ML packages from npm via npms.io.
 *
 * Automatically fetches on mount (unless `skip` is true) and provides
 * a `refetch` function for manual refresh.
 *
 * @param options - Optional configuration for the fetch.
 * @example
 * ```tsx
 * const { packages, loading, error, refetch } = useNpmPackages({
 *   limit: 15,
 *   query: 'keywords:agent',
 * });
 * ```
 */
export function useNpmPackages(
  options: UseNpmPackagesOptions = {}
): UseNpmPackagesResult {
  const { skip = false, query, limit = 20 } = options;

  const [packages, setPackages] = useState<NpmPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (query) {
        params.set('query', query);
      }

      const response = await fetch(`/api/sources/npm?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: NpmApiEndpointResponse = await response.json();

      setPackages(data.packages);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch npm packages';
      setError(message);
      // The API route itself falls back to mock data, so packages
      // may still be populated even when an error is logged.
    } finally {
      setLoading(false);
    }
  }, [query, limit]);

  useEffect(() => {
    if (!skip) {
      fetchPackages();
    }
  }, [fetchPackages, skip]);

  return {
    packages,
    total,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchPackages,
  };
}
