import { useState, useEffect, useCallback } from 'react';
import type { ArxivPaper, ArxivApiResponse } from '@/types/arxiv';

/**
 * Parameters for fetching arXiv papers.
 */
export interface UseArxivPapersParams {
  /** Search query string (default: "all:ai AND all:llm") */
  query?: string;
  /** Number of papers to fetch (default: 20, max: 50) */
  maxResults?: number;
  /** Sort field: submittedDate | lastUpdatedDate | relevance (default: submittedDate) */
  sortBy?: 'submittedDate' | 'lastUpdatedDate' | 'relevance';
  /** Sort direction: ascending | descending (default: descending) */
  sortOrder?: 'ascending' | 'descending';
}

/**
 * Return shape of the useArxivPapers hook.
 */
export interface UseArxivPapersResult {
  /** Array of fetched arXiv papers. */
  papers: ArxivPaper[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Error message if the fetch failed, otherwise null. */
  error: string | null;
  /** Total number of papers returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string | null;
  /** Source of the data: 'arxiv' or 'mock'. */
  source: 'arxiv' | 'mock' | null;
  /** Manually trigger a refetch with the current parameters. */
  refetch: () => void;
}

/**
 * React hook for fetching AI/ML papers from arXiv.
 *
 * Automatically fetches on mount and whenever the parameters change.
 * Provides loading and error states, plus a manual refetch function.
 *
 * @example
 * ```tsx
 * const { papers, loading, error, refetch } = useArxivPapers({
 *   query: 'all:ai AND all:llm',
 *   maxResults: 20,
 *   sortBy: 'submittedDate',
 *   sortOrder: 'descending',
 * });
 * ```
 */
export function useArxivPapers(params: UseArxivPapersParams = {}): UseArxivPapersResult {
  const {
    query = 'all:ai AND all:llm',
    maxResults = 20,
    sortBy = 'submittedDate',
    sortOrder = 'descending',
  } = params;

  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<'arxiv' | 'mock' | null>(null);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/sources/arxiv', window.location.origin);
      url.searchParams.set('query', query);
      url.searchParams.set('maxResults', String(maxResults));
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('sortOrder', sortOrder);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch arXiv papers: ${response.status} ${errorText}`);
      }

      const data: ArxivApiResponse = await response.json();
      setPapers(data.papers ?? []);
      setTotal(data.total ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
      setSource(data.source ?? 'arxiv');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching arXiv papers';
      console.error('useArxivPapers error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query, maxResults, sortBy, sortOrder]);

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
