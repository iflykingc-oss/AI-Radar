/**
 * AIHot Item interface representing a single hot topic item from aihot.virxact.com.
 */
export interface AIHotItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  category?: string;
  tags?: string[];
  publish_date?: string;
  source?: string;
  /** Extracted product mentions from title and description. */
  productMentions?: string[];
  /** Normalized ISO timestamp for consistent sorting across sources. */
  createdAt?: string;
}

/**
 * API response shape for the AIhot source endpoint.
 */
export interface AIHotApiResponse {
  items: AIHotItem[];
  total: number;
  fetchedAt: string;
  source?: 'aihot' | 'mock';
}
