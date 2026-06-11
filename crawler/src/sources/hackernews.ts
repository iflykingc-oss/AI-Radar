/**
 * Hacker News data source.
 *
 * Uses the Firebase-based Hacker News API to fetch top stories,
 * then checks if the story URL or title mentions an AI product.
 *
 * API docs: https://github.com/HackerNews/API
 */
import { CrawledProduct, DataSource } from '../types.js';

/**
 * Base URL for the Hacker News Firebase API.
 */
const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

/**
 * Number of top stories to scan.
 */
const HN_TOP_STORIES_LIMIT = 30;

/**
 * Keywords that indicate a story might be about an AI product.
 */
const AI_KEYWORDS = [
  'ai ', 'ai.', ' ai',
  'llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini',
  'machine learning', 'ml ',
  'artificial intelligence',
  'agent', 'chatbot', 'chat bot',
  'generative', 'diffusion', 'stable diffusion',
  'openai', 'anthropic',
  'rag', 'retrieval augmented',
];

export class HackerNewsSource implements DataSource {
  readonly name = 'hackernews';

  /**
   * Fetch top stories from Hacker News and extract AI product mentions.
   * @returns Array of CrawledProduct objects, or empty array on failure.
   */
  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching top ${HN_TOP_STORIES_LIMIT} stories...`);

      // Fetch top story IDs
      const topIds = await this.fetchTopStoryIds();

      if (topIds.length === 0) {
        console.warn(`[${this.name}] No top stories returned.`);
        return [];
      }

      const products: CrawledProduct[] = [];

      // Fetch details for each story in parallel (with concurrency limit)
      const storyDetails = await this.fetchStoriesBatch(topIds);

      for (const story of storyDetails) {
        if (!story) continue;
        const product = this.extractProduct(story);
        if (product) {
          products.push(product);
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} products.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  /**
   * Fetch the list of top story IDs from HN.
   */
  private async fetchTopStoryIds(): Promise<number[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${HN_API_BASE}/topstories.json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Failed to fetch top stories: HTTP ${response.status}`);
    }
    const ids: unknown = await response.json();
    if (!Array.isArray(ids)) return [];
    return (ids as number[]).slice(0, HN_TOP_STORIES_LIMIT);
  }

  /**
   * Fetch story details for a batch of IDs with limited concurrency.
   */
  private async fetchStoriesBatch(ids: number[]): Promise<HackerNewsStory[]> {
    const results: HackerNewsStory[] = [];
    const concurrency = 5;

    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      const promises = batch.map((id) => this.fetchStory(id).then((s) => s));
      const batchResults = await Promise.all(promises);
      results.push(...(batchResults.filter((s) => s !== null) as HackerNewsStory[]));
    }

    return results;
  }

  /**
   * Fetch a single story by its ID.
   */
  private async fetchStory(id: number): Promise<HackerNewsStory | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${HN_API_BASE}/item/${id}.json`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;
      return (await response.json()) as HackerNewsStory;
    } catch {
      return null;
    }
  }

  /**
   * Extract a CrawledProduct from a Hacker News story if it appears to
   * be about an AI product.
   */
  private extractProduct(story: HackerNewsStory): CrawledProduct | null {
    const title = story.title ?? '';
    const url = story.url ?? '';

    // Check if title or URL contains AI-related keywords
    const titleLower = title.toLowerCase();
    const hasAIKeyword = AI_KEYWORDS.some((kw) => titleLower.includes(kw));

    if (!hasAIKeyword) return null;

    // Skip if there's no URL (story-only posts are less likely to be products)
    if (!url) return null;

    // Extract a product name from the title
    // Typical HN title format: "Product Name - tagline" or "Product Name: tagline"
    const nameMatch = title.match(/^["']?([^"':\-\|–—]+)["']?(?:[-–—|:].*)?$/);
    const name = nameMatch ? nameMatch[1].trim() : title.substring(0, 50);

    if (name.length < 2) return null;

    // Derive category from title keywords
    const category = this.deriveCategory(titleLower);

    // Derive tags from keywords found in title
    const tags = this.deriveTags(titleLower);

    return {
      name,
      name_en: name,
      description: title,
      website_url: url,
      tags,
      category,
      source: 'hackernews',
      source_url: `https://news.ycombinator.com/item?id=${story.id}`,
      crawled_at: new Date().toISOString(),
      // HN stories don't have pricing info
      pricing_model: undefined,
    };
  }

  /**
   * Derive a category from the story title.
   */
  private deriveCategory(titleLower: string): string {
    if (titleLower.includes('llm') || titleLower.includes('gpt') || titleLower.includes('llama')) {
      return 'LLM';
    }
    if (titleLower.includes('image') || titleLower.includes('diffusion') || titleLower.includes('video')) {
      return 'Image Generation';
    }
    if (titleLower.includes('speech') || titleLower.includes('tts') || titleLower.includes('voice')) {
      return 'Speech / Audio';
    }
    if (titleLower.includes('agent') || titleLower.includes('autonomous')) {
      return 'AI Agents';
    }
    return 'Other';
  }

  /**
   * Derive tags from the story title.
   */
  private deriveTags(titleLower: string): string[] {
    const tags: string[] = [];
    const allKeywords = ['llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini', 'agent', 'chatbot', 'rag', 'diffusion', 'openai', 'anthropic'];

    for (const kw of allKeywords) {
      if (titleLower.includes(kw)) {
        tags.push(kw);
      }
    }

    if (tags.length === 0) {
      tags.push('ai');
    }

    return tags;
  }
}

// --- Hacker News API response types ---

interface HackerNewsStory {
  id: number;
  title: string;
  url?: string;
  score?: number;
  by?: string;
  time?: number;
  descendants?: number;
  type: string;
}
