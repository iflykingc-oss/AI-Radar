/**
 * RSS feed data source.
 *
 * Fetches and parses RSS feeds from tech news sites to discover new AI products.
 * Supported feeds:
 *   - TechCrunch AI
 *   - VentureBeat AI
 *
 * Uses fast-xml-parser for RSS parsing and node-fetch for HTTP requests.
 */
import { CrawledProduct, DataSource } from '../types.js';
import { XMLParser } from 'fast-xml-parser';

/**
 * RSS feed URLs to scrape for AI product news.
 */
const RSS_FEEDS: Array<{ url: string; name: string }> = [
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    name: 'TechCrunch AI',
  },
  {
    url: 'https://venturebeat.com/category/ai/feed/',
    name: 'VentureBeat AI',
  },
  {
    url: 'https://www.artificialintelligence-news.com/feed/',
    name: 'AI News',
  },
  {
    url: 'https://the-decoder.com/feed/',
    name: 'The Decoder',
  },
  {
    url: 'https://www.marktechpost.com/feed/',
    name: 'MarkTechPost',
  },
];

/**
 * Keywords that indicate a feed item is about a specific AI product.
 */
const PRODUCT_KEYWORDS = [
  'launch', 'launches', 'launched',
  'release', 'released',
  'introduces', 'introducing',
  'announces', 'announcing',
  'debuts', 'unveils',
  'now available', 'now live',
  'new tool', 'new platform', 'new service', 'new app',
  'startup',
];

export class RSSSource implements DataSource {
  readonly name = 'rss';

  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
  }

  /**
   * Fetch all configured RSS feeds and extract AI product mentions.
   * @returns Array of CrawledProduct objects, or empty array on failure.
   */
  async fetch(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`[${this.name}] Fetching feed: ${feed.name} (${feed.url})`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(feed.url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          console.error(
            `[${this.name}] Failed to fetch ${feed.name}: HTTP ${response.status}`
          );
          continue;
        }

        const xmlText = await response.text();
        const parsed = this.parser.parse(xmlText) as RSSFeed;

        const items = this.extractItems(parsed);

        for (const item of items) {
          const product = this.extractProduct(item, feed.name);
          if (product) {
            products.push(product);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${this.name}] Failed to parse ${feed.name}: ${message}`);
        // Continue to next feed
      }
    }

    console.log(`[${this.name}] Extracted ${products.length} products.`);
    return products;
  }

  /**
   * Extract the array of <item> elements from a parsed RSS feed.
   * Handles both RSS 2.0 and various nesting patterns.
   */
  private extractItems(parsed: RSSFeed): RSSItem[] {
    const channel = parsed.rss?.channel ?? parsed.feed;
    if (!channel) return [];

    const items = channel.item;
    if (Array.isArray(items)) return items;
    if (items) return [items];
    return [];
  }

  /**
   * Extract a CrawledProduct from an RSS feed item if it appears to be
   * about a new AI product.
   */
  private extractProduct(item: RSSItem, feedName: string): CrawledProduct | null {
    const title = item.title ?? '';
    const description = this.stripHtml(item.description ?? '');
    const link = item.link ?? '';

    // Check if the title suggests a product launch
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const isProductLaunch = PRODUCT_KEYWORDS.some(
      (kw) => titleLower.includes(kw) || descLower.includes(kw)
    );

    // Also check for AI-related keywords
    const hasAIKeyword = this.containsAIKeyword(titleLower, descLower);

    if (!hasAIKeyword) return null;

    // Extract product name from title
    // Typical format: "Company launches Product Name" or "Product Name: description"
    const name = this.extractProductName(title);

    if (!name || name.length < 2) return null;

    // Derive category
    const category = this.deriveCategory(titleLower, descLower);

    // Derive tags
    const tags = this.deriveTags(titleLower, descLower);

    return {
      name,
      name_en: name,
      description: description || title,
      website_url: link,
      tags,
      category,
      source: 'rss',
      source_url: link,
      crawled_at: new Date().toISOString(),
      pricing_model: undefined,
    };
  }

  /**
   * Strip HTML tags from a string (RSS descriptions often contain HTML).
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Check if the text contains AI-related keywords.
   */
  private containsAIKeyword(titleLower: string, descLower: string): boolean {
    const text = titleLower + ' ' + descLower;
    const aiKeywords = [
      'ai', 'llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini',
      'machine learning', 'artificial intelligence',
      'generative', 'diffusion', 'stable diffusion',
      'openai', 'anthropic', 'deepmind',
      'agent', 'chatbot',
      'rag', 'retrieval augmented',
    ];
    return aiKeywords.some((kw) => text.includes(kw));
  }

  /**
   * Extract a product name from an RSS item title.
   * Attempts common title patterns to isolate the product name.
   */
  private extractProductName(title: string): string | null {
    // Pattern: "Company launches Product Name"
    const launchMatch = title.match(
      /(?:launch|release|introduce|announce|unveil|debut)s?\s+["']?([^"':\-.]+)/i
    );
    if (launchMatch) {
      return launchMatch[1].trim();
    }

    // Pattern: "Product Name: description" or "Product Name - description"
    const colonMatch = title.match(/^["']?([^"':\-\|–—]+)["']?(?:[-–—|:].*)?$/);
    if (colonMatch) {
      return colonMatch[1].trim();
    }

    // Fallback: use the first 40 characters
    return title.substring(0, 40).trim() || null;
  }

  /**
   * Derive a category from the item text.
   */
  private deriveCategory(titleLower: string, descLower: string): string {
    const text = titleLower + ' ' + descLower;

    if (text.includes('llm') || text.includes('gpt') || text.includes('llama')) {
      return 'LLM';
    }
    if (text.includes('image') || text.includes('diffusion') || text.includes('video generation')) {
      return 'Image Generation';
    }
    if (text.includes('speech') || text.includes('voice') || text.includes('tts')) {
      return 'Speech / Audio';
    }
    if (text.includes('agent') || text.includes('autonomous')) {
      return 'AI Agents';
    }
    return 'Other';
  }

  /**
   * Derive tags from the item text.
   */
  private deriveTags(titleLower: string, descLower: string): string[] {
    const text = titleLower + ' ' + descLower;
    const tags: string[] = [];
    const keywords = ['llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini', 'agent', 'chatbot', 'rag', 'diffusion', 'openai', 'anthropic'];

    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.push(kw);
      }
    }

    if (tags.length === 0) {
      tags.push('ai');
    }

    return tags;
  }
}

// --- RSS types (simplified for common RSS 2.0 structure) ---

interface RSSFeed {
  rss?: {
    channel: RSSChannel;
  };
  feed?: RSSChannel;
}

interface RSSChannel {
  title?: string;
  link?: string;
  description?: string;
  item?: RSSItem | RSSItem[];
}

interface RSSItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  guid?: string;
  category?: string | { _text: string } | Array<string | { _text: string }>;
}
