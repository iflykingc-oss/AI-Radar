/**
 * Lobsters data source.
 *
 * Uses the Lobsters public JSON API to fetch AI-related stories.
 *
 * API docs: https://lobste.rs/about
 */
import { CrawledProduct, DataSource } from '../types.js';

const LOBSTERS_API = 'https://lobste.rs';

const AI_TAGS = ['ai', 'machine-learning', 'ml'];

export class LobstersSource implements DataSource {
  readonly name = 'lobsters';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching AI stories from Lobsters...`);

      const products: CrawledProduct[] = [];
      const seen = new Set<string>();

      // Fetch hottest stories
      const hottest = await this.fetchStories('/hottest.json');
      for (const story of hottest) {
        const product = this.extractProduct(story);
        if (product && !seen.has(product.website_url)) {
          seen.add(product.website_url);
          products.push(product);
        }
      }

      // Fetch newest stories
      const newest = await this.fetchStories('/newest.json');
      for (const story of newest) {
        const product = this.extractProduct(story);
        if (product && !seen.has(product.website_url)) {
          seen.add(product.website_url);
          products.push(product);
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} stories.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private async fetchStories(endpoint: string): Promise<any[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${LOBSTERS_API}${endpoint}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AIRadarBot/1.0' },
      });
      clearTimeout(timeout);

      if (!response.ok) return [];
      const stories = await response.json();
      return Array.isArray(stories) ? stories : [];
    } catch {
      return [];
    }
  }

  private extractProduct(story: any): CrawledProduct | null {
    const title = story.title || '';
    const url = story.url || story.short_id_url || '';
    const tags = story.tags || [];
    const score = story.score || 0;

    if (!title || !url) return null;

    // Only include AI-related stories
    const isAI = tags.some((tag: string) => AI_TAGS.includes(tag))
      || title.toLowerCase().includes('ai')
      || title.toLowerCase().includes('llm')
      || title.toLowerCase().includes('machine learning');
    if (!isAI) return null;

    const category = this.deriveCategory(tags, title);

    return {
      name: title.substring(0, 100),
      slug: '', // Will be enriched
      description: title,
      website_url: url,
      tags: tags.slice(0, 5),
      category,
      source: 'rss', // Use 'rss' as source type
      source_url: story.short_id_url || url,
      crawled_at: new Date().toISOString(),
    };
  }

  private deriveCategory(tags: string[], title: string): string {
    const text = (tags.join(' ') + ' ' + title).toLowerCase();

    if (text.includes('llm') || text.includes('gpt') || text.includes('language model')) {
      return 'LLM';
    }
    if (text.includes('image') || text.includes('vision') || text.includes('diffusion')) {
      return 'AI Image';
    }
    if (text.includes('agent') || text.includes('autonomous')) {
      return 'AI Agents';
    }
    if (text.includes('coding') || text.includes('developer') || text.includes('code')) {
      return 'AI Coding';
    }
    return 'AI Tools';
  }
}
