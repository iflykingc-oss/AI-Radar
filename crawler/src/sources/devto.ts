/**
 * Dev.to data source.
 *
 * Uses the Dev.to public API to fetch AI-related articles.
 * Articles about AI products/tools are treated as product mentions.
 *
 * API docs: https://developers.forem.com/api/v1
 */
import { CrawledProduct, DataSource } from '../types.js';

const DEVTO_API = 'https://dev.to/api/articles';

const AI_TAGS = [
  'ai',
  'machinelearning',
  'chatgpt',
  'openai',
  'llm',
  'generative-ai',
  'artificial-intelligence',
];

const MAX_PER_TAG = 20;

export class DevtoSource implements DataSource {
  readonly name = 'devto';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching AI articles from Dev.to...`);

      const products: CrawledProduct[] = [];
      const seen = new Set<string>();

      for (const tag of AI_TAGS) {
        try {
          const url = `${DEVTO_API}?tag=${tag}&top=7&per_page=${MAX_PER_TAG}`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'AIRadarBot/1.0' },
          });
          clearTimeout(timeout);

          if (!response.ok) continue;

          const articles = await response.json();
          if (!Array.isArray(articles)) continue;

          for (const article of articles) {
            const product = this.extractProduct(article, tag);
            if (product && !seen.has(product.website_url)) {
              seen.add(product.website_url);
              products.push(product);
            }
          }
        } catch {
          // Skip failed tag
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} articles.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private extractProduct(article: any, searchTag: string): CrawledProduct | null {
    const title = article.title || '';
    const description = article.description || '';
    const url = article.url || '';
    const tags = article.tag_list || [];

    if (!title || !url) return null;

    // Only include articles that mention specific AI products/tools
    const isProductMention = this.isProductMention(title, description);
    if (!isProductMention) return null;

    const category = this.deriveCategory(tags, title, description);

    return {
      name: title.substring(0, 100),
      slug: '', // Will be enriched
      description: description.substring(0, 500),
      website_url: url,
      tags: tags.slice(0, 5),
      category,
      source: 'rss', // Use 'rss' as source type
      source_url: url,
      crawled_at: new Date().toISOString(),
    };
  }

  private isProductMention(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    const productIndicators = [
      'launch', 'release', 'announce', 'introduce', 'new tool',
      'new framework', 'new library', 'new api', 'new platform',
      'open source', 'github', 'npm', 'pip install',
      'gpt', 'llm', 'model', 'agent', 'rag', 'vector',
    ];
    return productIndicators.some(indicator => text.includes(indicator));
  }

  private deriveCategory(tags: string[], title: string, description: string): string {
    const text = (tags.join(' ') + ' ' + title + ' ' + description).toLowerCase();

    if (text.includes('llm') || text.includes('gpt') || text.includes('language model')) {
      return 'LLM';
    }
    if (text.includes('image') || text.includes('vision') || text.includes('diffusion')) {
      return 'AI Image';
    }
    if (text.includes('agent') || text.includes('autonomous') || text.includes('rag')) {
      return 'AI Agents';
    }
    if (text.includes('coding') || text.includes('developer') || text.includes('code')) {
      return 'AI Coding';
    }
    if (text.includes('search') || text.includes('recommendation')) {
      return 'AI Search';
    }
    return 'AI Tools';
  }
}
