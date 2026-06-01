/**
 * Unified source item shape used across all data sources.
 */
export interface SourceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: 'techcrunch' | 'lobsters' | 'medium' | 'mock';
  publishDate: string;
  author?: string;
  score?: number;
  tags?: string[];
}

/**
 * API response shape for unified source endpoints.
 */
export interface SourceApiResponse {
  items: SourceItem[];
  source: string;
  fetchedAt: string;
}

/**
 * TechCrunch article parsed from RSS feed.
 */
export interface TechCrunchArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  publishDate: string;
  categories: string[];
}

/**
 * Lobsters post parsed from JSON or RSS endpoint.
 */
export interface LobstersPost {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  publishDate: string;
  score: number;
  commentCount: number;
  tags: string[];
}

/**
 * Medium article parsed from RSS feed.
 */
export interface MediumArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  publishDate: string;
  categories: string[];
}
