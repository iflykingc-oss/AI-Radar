/**
 * Bluesky data source.
 *
 * Fetches AI-related posts from Bluesky's public API.
 * Bluesky has a free, open API - no authentication required for public data.
 *
 * API: https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts
 */
import { CrawledProduct, DataSource } from '../types.js';

/**
 * AI-related search queries to find products on Bluesky.
 */
const AI_QUERIES = [
  'AI launch',
  'AI tool release',
  'new AI model',
  'open source AI',
  'LLM release',
  'AI startup launch',
  'AI API launch',
  'GPT launch',
  'Claude release',
  'AI product launch',
];

/**
 * Maximum posts to fetch per query.
 */
const MAX_PER_QUERY = 15;

export class BlueskySource implements DataSource {
  readonly name = 'bluesky';

  async fetch(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];
    const seen = new Set<string>();

    console.log(`[${this.name}] Fetching AI posts from Bluesky...`);

    for (const query of AI_QUERIES) {
      try {
        const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${MAX_PER_QUERY}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[${this.name}] HTTP ${response.status} for query: ${query}`);
          continue;
        }

        const data = await response.json() as any;
        const posts = data?.posts || [];

        for (const post of posts) {
          const product = this.extractProduct(post);
          if (product) {
            const key = product.name.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              products.push(product);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${this.name}] Error fetching query "${query}": ${message}`);
      }
    }

    console.log(`[${this.name}] Extracted ${products.length} products from Bluesky.`);
    return products;
  }

  /**
   * Extract a product from a Bluesky post.
   */
  private extractProduct(post: any): CrawledProduct | null {
    const text = post.record?.text || '';
    if (!text || text.length < 20) return null;

    // Check if post mentions a product launch
    if (!this.isProductMention(text)) return null;

    // Extract product name
    const name = this.extractProductName(text);
    if (!name) return null;

    // Extract URLs from facets or text
    const urls = this.extractUrls(post);
    const websiteUrl = urls.find(u => !u.includes('bsky.social')) || `https://bsky.app/profile/${post.author?.handle}`;
    const githubUrl = urls.find(u => u.includes('github.com'));

    // Extract author info
    const authorHandle = post.author?.handle || 'unknown';
    const authorName = post.author?.displayName || authorHandle;

    return {
      name,
      slug: '',
      description: text.substring(0, 500),
      website_url: websiteUrl,
      github_url: githubUrl,
      tags: this.extractTags(text),
      category: this.deriveCategory(text),
      source: 'bluesky' as any,
      source_url: `https://bsky.app/profile/${authorHandle}/post/${post.uri?.split('/').pop()}`,
      crawled_at: new Date().toISOString(),
    };
  }

  /**
   * Check if a post mentions a product launch.
   */
  private isProductMention(text: string): boolean {
    const lower = text.toLowerCase();
    const indicators = [
      'launch', 'launches', 'launched',
      'release', 'released', 'releases',
      'introduce', 'introduces', 'introduced',
      'announce', 'announces', 'announced',
      'unveil', 'unveils', 'unveiled',
      'now available', 'now live', 'just launched',
      'new tool', 'new model', 'new api', 'new framework',
      'open source', 'open-source',
      'v2', 'v3', 'v4', 'v5',
      'gpt-4', 'gpt-5', 'claude', 'gemini', 'llama',
      'series a', 'series b', 'series c', 'funding', 'raised',
    ];
    return indicators.some(ind => lower.includes(ind));
  }

  /**
   * Extract a product name from post text.
   */
  private extractProductName(text: string): string | null {
    // Pattern: "launching ProductName" or "introducing ProductName"
    const launchMatch = text.match(
      /(?:launch|release|introduce|announce|unveil)(?:ing|ed|s)?\s+["']?([^"':\-.@]{2,40})/i
    );
    if (launchMatch) {
      return launchMatch[1].trim();
    }

    // Pattern: "ProductName is now available"
    const availableMatch = text.match(/^([A-Z][A-Za-z0-9\s]{2,30})\s+(?:is|are|now|just)/);
    if (availableMatch) {
      return availableMatch[1].trim();
    }

    // Pattern: "New: ProductName" or "Introducing ProductName"
    const introMatch = text.match(/(?:new|introducing|announcing):\s+["']?([^"':\-.@]{2,40})/i);
    if (introMatch) {
      return introMatch[1].trim();
    }

    // Fallback: extract capitalized phrases
    const capitalMatch = text.match(/\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\b/);
    if (capitalMatch && capitalMatch[1].length > 2) {
      return capitalMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract URLs from a Bluesky post (from facets or text).
   */
  private extractUrls(post: any): string[] {
    const urls: string[] = [];

    // Extract from facets
    const facets = post.record?.facets || [];
    for (const facet of facets) {
      const features = facet.features || [];
      for (const feature of features) {
        if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
          urls.push(feature.uri);
        }
      }
    }

    // Extract from text as fallback
    const text = post.record?.text || '';
    const urlRegex = /https?:\/\/[^\s<>"]+/g;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[0]);
    }

    return [...new Set(urls)];
  }

  /**
   * Derive category from post text.
   */
  private deriveCategory(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('llm') || lower.includes('gpt') || lower.includes('claude') || lower.includes('gemini') || lower.includes('llama')) {
      return 'LLM';
    }
    if (lower.includes('image') || lower.includes('diffusion') || lower.includes('midjourney') || lower.includes('stable diffusion')) {
      return 'Image Generation';
    }
    if (lower.includes('video') || lower.includes('runway') || lower.includes('sora')) {
      return 'Video Generation';
    }
    if (lower.includes('agent') || lower.includes('autonomous') || lower.includes('rag')) {
      return 'AI Agents';
    }
    if (lower.includes('coding') || lower.includes('copilot') || lower.includes('cursor') || lower.includes('code')) {
      return 'AI Coding';
    }
    if (lower.includes('voice') || lower.includes('speech') || lower.includes('tts') || lower.includes('elevenlabs')) {
      return 'Speech/Audio';
    }
    if (lower.includes('startup') || lower.includes('funding') || lower.includes('raised')) {
      return 'AI Startup';
    }

    return 'AI Tools';
  }

  /**
   * Extract tags from post text.
   */
  private extractTags(text: string): string[] {
    const lower = text.toLowerCase();
    const tags: string[] = [];

    const keywords = [
      'openai', 'anthropic', 'google', 'meta', 'microsoft',
      'gpt', 'claude', 'gemini', 'llama', 'mistral',
      'llm', 'agent', 'rag', 'diffusion', 'multimodal',
      'open-source', 'api', 'model', 'startup', 'funding',
    ];

    for (const kw of keywords) {
      if (lower.includes(kw)) {
        tags.push(kw);
      }
    }

    return tags.length > 0 ? tags.slice(0, 5) : ['ai'];
  }
}
