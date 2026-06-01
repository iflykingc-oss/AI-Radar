import { useState, useEffect, useCallback } from 'react';
import type { YouTubeVideo, YouTubeApiResponse } from '@/types/youtube';

/**
 * Hook options for fetching YouTube videos.
 */
export interface UseYouTubeVideosOptions {
  /** Maximum number of videos to return (default: 20, max: 50). */
  limit?: number;
  /** Whether to skip the initial fetch. */
  skip?: boolean;
}

/**
 * Hook return type for useYouTubeVideos.
 */
export interface UseYouTubeVideosResult {
  /** Fetched YouTube videos. */
  videos: YouTubeVideo[];
  /** Total number of videos returned. */
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
 * React hook that fetches recent videos from AI-focused YouTube channels.
 *
 * Aggregates content from multiple channel RSS feeds (Two Minute Papers,
 * AI Explained) and returns videos sorted by publish date.
 *
 * @example
 * ```tsx
 * const { videos, loading, error, refetch } = useYouTubeVideos({ limit: 15 });
 * ```
 */
export function useYouTubeVideos(
  options: UseYouTubeVideosOptions = {}
): UseYouTubeVideosResult {
  const { limit = 20, skip = false } = options;

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));

      const response = await fetch(`/api/sources/youtube?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: YouTubeApiResponse = await response.json();

      setVideos(data.videos);
      setTotal(data.total);
      setFetchedAt(data.fetchedAt);
      setIsMock(data.source === 'mock');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch YouTube videos';
      setError(message);
      // Note: the API route itself falls back to mock data, so videos
      // may still be populated even on error.
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!skip) {
      fetchVideos();
    }
  }, [fetchVideos, skip]);

  return {
    videos,
    total,
    loading,
    error,
    fetchedAt,
    isMock,
    refetch: fetchVideos,
  };
}
