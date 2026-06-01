/**
 * Bluesky post item parsed from Bluesky public API.
 */
export interface BlueskyPost {
  /** Unique post identifier. */
  id: string;
  /** Post text content. */
  text: string;
  /** Author display name. */
  author: string;
  /** Author handle (e.g., "@user.bsky.social"). */
  authorHandle: string;
  /** Full post URL on Bluesky. */
  url: string;
  /** Number of likes on the post. */
  likeCount: number;
  /** Number of reposts of the post. */
  repostCount: number;
  /** ISO 8601 publish date string. */
  publishDate: string;
  /** Data source indicator. */
  source: 'bluesky' | 'mock';
}

/**
 * API response shape for the Bluesky source endpoint.
 */
export interface BlueskyApiResponse {
  /** Array of parsed Bluesky post items. */
  posts: BlueskyPost[];
  /** Total number of posts returned. */
  total: number;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
  /** Whether the returned data comes from the mock fallback. */
  source: 'bluesky' | 'mock';
}
