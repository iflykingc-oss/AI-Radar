import { useState, useEffect, useCallback } from 'react';
import type { PwcPaper, PwcApiResponse } from '@/types/paperswithcode';

/**
 * Parameters for fetching Papers With Code papers.
 */
export interface UsePapersWithCodeParams {
  /** Page number (default: 1) */
  page?: number;
  /** Number of papers per page (default: 20, max: 50) */
  pageSize?: number;
}

/**
 * Return shape of the usePapersWithCode hook.
 */
export interface UsePapersWithCodeResult {
  /** Array of fetched PWC papers. */
  papers: PwcPaper[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error message if the fetch failed, otherwise null. */
  error: string | null;
  /** Total number of papers returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string | null;
  /** Source of the data: 'paperswithcode' or 'mock'. */
  source: 'paperswithcode' | 'mock' | null;
  /** Manually trigger a refetch with the current parameters. */
  refetch: () => void;
}

/**
 * React hook for fetching papers from Papers With Code.
 *
 * Automatically fetches on mount and whenever the parameters change.
 * Provides loading and error states, plus a manual refetch function.
 *
 * @example
 * ```tsx
 * const { papers, loading, error, refetch } = usePapersWithCode({
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function usePapersWithCode(params: UsePapersWithCodeParams = {}): UsePapersWithCodeResult {
  const { page = 1, pageSize = 20 } = params;

  const [papers, setPapers] = useState<PwcPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<'paperswithcode' | 'mock' | null>(null);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/sources/paperswithcode', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('pageSize', String(pageSize));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch PWC papers: ${response.status} ${errorText}`);
      }

      const data: PwcApiResponse = await response.json();
      setPapers(data.papers ?? []);
      setTotal(data.total ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
      setSource(data.source ?? 'paperswithcode');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching PWC papers';
      console.error('usePapersWithCode error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  return {
    papers,
    loading,
    error,
    total,
    fetchedAt,
    source,
    refetch: fetchPapers,
  };
}
