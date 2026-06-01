/**
 * Papers With Code paper item returned by the /api/sources/paperswithcode endpoint.
 */
export interface PwcPaper {
  /** Unique identifier, typically the paper ID or slug. */
  id: string;
  /** Paper title. */
  title: string;
  /** Paper abstract text. */
  abstract: string;
  /** Paper URL on Papers With Code. */
  url: string;
  /** Associated GitHub repository URL (if available). */
  repoUrl: string | null;
  /** Publication date in ISO 8601 format. */
  publishDate: string;
  /** Data source indicator. */
  source: 'paperswithcode' | 'mock';
}

/**
 * API response shape for the Papers With Code source endpoint.
 */
export interface PwcApiResponse {
  /** Array of parsed PWC papers. */
  papers: PwcPaper[];
  /** Total number of papers returned. */
  total: number;
  /** Data source: 'paperswithcode' or 'mock'. */
  source: 'paperswithcode' | 'mock';
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
}
