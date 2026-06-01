/**
 * GitHub Trending repository shape returned by /api/sources/github-trending.
 */
export interface GitHubTrendingRepo {
  id: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  lastUpdated: string;
  source: 'github' | 'mock';
}

/**
 * API response shape for the GitHub Trending source endpoint.
 */
export interface GitHubTrendingApiResponse {
  items: GitHubTrendingRepo[];
  total: number;
  source: string;
  fetchedAt: string;
}
