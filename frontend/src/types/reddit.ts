/**
 * Reddit Post interface representing a normalized Reddit post.
 */
export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  upvotes: number;
  commentCount: number;
  url: string;
  permalink: string;
  createdAt: string;
  thumbnail?: string;
  isSelfPost: boolean;
  selftext?: string;
  /** Extracted product mentions from title and selftext. */
  productMentions?: string[];
}

/**
 * API response shape for the Reddit source endpoint.
 */
export interface RedditApiResponse {
  posts: RedditPost[];
  total: number;
  fetchedAt: string;
  source?: 'reddit' | 'mock';
}
