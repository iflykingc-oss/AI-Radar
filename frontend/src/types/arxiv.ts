/**
 * ArXiv paper item returned by the /api/sources/arxiv endpoint.
 */
export interface ArxivPaper {
  /** Unique identifier, typically the arXiv ID (e.g., "2401.12345"). */
  id: string;
  /** Paper title. */
  title: string;
  /** Paper summary/abstract text. */
  summary: string;
  /** Full arXiv URL (e.g., "https://arxiv.org/abs/2401.12345"). */
  url: string;
  /** List of paper authors. */
  authors: string[];
  /** Publication date in ISO 8601 format. */
  publishDate: string;
  /** arXiv category tags (e.g., ["cs.AI", "cs.LG"]). */
  categories: string[];
  /** Data source indicator. */
  source: 'arxiv' | 'mock';
}

/**
 * API response shape for the arXiv source endpoint.
 */
export interface ArxivApiResponse {
  /** Array of parsed arXiv papers. */
  papers: ArxivPaper[];
  /** Total number of papers returned. */
  total: number;
  /** Search query used. */
  query: string;
  /** Data source: 'arxiv' or 'mock'. */
  source: 'arxiv' | 'mock';
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
}
