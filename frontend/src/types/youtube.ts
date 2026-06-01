/**
 * YouTube video item parsed from Atom XML RSS feed.
 */
export interface YouTubeVideo {
  /** YouTube video ID (e.g., "dQw4w9WgXcQ"). */
  id: string;
  /** Video title. */
  title: string;
  /** Channel display name. */
  channelName: string;
  /** Full YouTube video URL. */
  url: string;
  /** ISO 8601 publish date string. */
  publishDate: string;
  /** Thumbnail image URL. */
  thumbnail: string;
  /** Data source indicator. */
  source: 'youtube' | 'mock';
}

/**
 * API response shape for the YouTube source endpoint.
 */
export interface YouTubeApiResponse {
  /** Array of parsed YouTube video items. */
  videos: YouTubeVideo[];
  /** Total number of videos returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
  /** Whether the returned data comes from the mock fallback. */
  source: 'youtube' | 'mock';
}
