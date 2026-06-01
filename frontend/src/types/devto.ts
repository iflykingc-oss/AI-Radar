/**
 * Dev.to article interface representing a normalized article from Dev.to API.
 */
export interface DevToArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  reactions: number;
  comments: number;
  author: string;
  tags: string[];
  coverImage?: string;
  source: 'devto' | 'mock';
}

/**
 * API response shape for the Dev.to source endpoint.
 */
export interface DevToApiResponse {
  articles: DevToArticle[];
  source: 'devto' | 'mock';
  fetchedAt: string;
}
