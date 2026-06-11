/**
 * Core type definitions for the AI Radar Crawler Service.
 *
 * Defines the product data model, data source interfaces,
 * and configuration types used throughout the crawler pipeline.
 */

/**
 * Represents an AI product discovered by any data source.
 * This is the canonical shape written to Supabase.
 */
export interface CrawledProduct {
  /** Product name (primary identifier) */
  name: string;
  /** English name variant, if known */
  name_en?: string;
  /** Chinese name variant, if known */
  name_zh?: string;
  /** Short description of the product */
  description: string;
  /** Official website URL */
  website_url: string;
  /** GitHub repository URL, if applicable */
  github_url?: string;
  /** Tags / topics associated with the product */
  tags: string[];
  /** High-level category (e.g. "LLM", "Image Generation", "Dev Tools") */
  category: string;
  /** Which data source discovered this product */
  source: 'producthunt' | 'github' | 'hackernews' | 'rss' | 'huggingface' | 'arxiv';
  /** Original URL where the product was found */
  source_url: string;
  /** ISO timestamp of when this record was crawled */
  crawled_at: string;
  /** GitHub star count, if applicable */
  github_stars?: number;
  /** Pricing model of the product */
  pricing_model?: 'free' | 'freemium' | 'paid' | 'open_source';
}

/**
 * Confidence score attached to a crawled product.
 * - base: 20 (minimum)
 * - max: 100
 */
export interface ScoredProduct extends CrawledProduct {
  /** Confidence score (0-100) */
  confidence_score: number;
  /** Array of source names that mentioned this product */
  source_mentions: string[];
}

/**
 * Generic interface that every data source must implement.
 */
export interface DataSource {
  /** Human-readable name of this source */
  readonly name: string;

  /**
   * Fetch new products from this source.
   * @returns Array of crawled products (may be empty on error)
   */
  fetch(): Promise<CrawledProduct[]>;
}

/**
 * Supabase table row shape for the crawled_products table.
 * Maps 1:1 to CrawledProduct + confidence_score.
 */
export interface ProductRow extends CrawledProduct {
  id?: number;
  confidence_score: number;
  source_mentions: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * All sources currently registered in the crawler.
 * Used for health checks and dashboards.
 */
export const REGISTERED_SOURCES = [
  'producthunt',
  'github',
  'hackernews',
  'rss',
  'huggingface',
  'arxiv',
] as const;

export type RegisteredSource = (typeof REGISTERED_SOURCES)[number];
