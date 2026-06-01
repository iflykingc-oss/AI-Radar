/**
 * Product Hunt Post interface representing a normalized Product Hunt post/product.
 */
export interface ProductHuntPost {
  id: string;
  title: string;
  description: string;
  url: string;
  publishDate: string;
  upvotes?: number;
  commentsCount?: number;
  source: 'producthunt' | 'mock';
  thumbnail?: string;
  /** Extracted product mentions from title and description. */
  productMentions?: string[];
}

/**
 * API response shape for the Product Hunt source endpoint.
 */
export interface ProductHuntApiResponse {
  items: ProductHuntPost[];
  total: number;
  fetchedAt: string;
  source?: 'producthunt' | 'mock';
}
