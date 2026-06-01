import { useState, useEffect, useCallback } from 'react';
import type { HuggingFaceModel, HuggingFaceApiResponse } from '@/types/huggingface';

/**
 * Hook options for fetching Hugging Face trending models.
 */
export interface UseHuggingFaceModelsOptions {
  /** Whether to skip the initial fetch. */
  skip?: boolean;
  /** Filter by pipeline tag (e.g., text-generation, text-to-image). */
  pipelineTag?: string;
  /** Number of models to fetch (default: 20, max: 50). */
  limit?: number;
}

/**
 * Hook return type for useHuggingFaceModels.
 */
export interface UseHuggingFaceModelsResult {
  /** Fetched Hugging Face models. */
  models: HuggingFaceModel[];
  /** Total number of models returned. */
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
 * React hook that fetches trending AI models from Hugging Face.
 *
 * Automatically fetches on mount (unless `skip` is true) and provides
 * a `refetch` function for manual refresh.
 *
 * @param options - Optional configuration for the fetch.
 * @example
 * ```tsx
 * const { models, loading, error, refetch } = useHuggingFaceModels({
 *   limit: 15,
 *   pipelineTag: 'text-generation',
 * });
 * ```
 */
export function useHuggingFaceModels(
  options: UseHuggingFaceModelsOptions = {}
): UseHuggingFaceModelsResult {
  const { skip = false, pipelineTag, limit = 20 } = options;

  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (pipelineTag) {
        params.set('pipelineTag', pipelineTag);
      }

      const response = await fetch(`/api/sources/huggingface?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: HuggingFaceApiResponse = await response.json();

      setModels(data.models);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch Hugging Face models';
      setError(message);
      // The API route itself falls back to mock data, so models
      // may still be populated even when an error is logged.
    } finally {
      setLoading(false);
    }
  }, [pipelineTag, limit]);

  useEffect(() => {
    if (!skip) {
      fetchModels();
    }
  }, [fetchModels, skip]);

  return {
    models,
    total,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchModels,
  };
}
