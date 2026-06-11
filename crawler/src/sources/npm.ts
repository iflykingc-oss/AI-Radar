/**
 * NPM Registry data source.
 *
 * Uses the NPM public search API to find AI-related packages.
 *
 * API docs: https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md
 */
import { CrawledProduct, DataSource } from '../types.js';

const NPM_SEARCH_API = 'https://registry.npmjs.org/-/v1/search';

const AI_QUERIES = [
  'keywords:llm',
  'keywords:openai',
  'keywords:ai-agent',
  'keywords:vector-database',
  'keywords:langchain',
  'keywords:embedding',
];

const MAX_PER_QUERY = 20;

export class NpmSource implements DataSource {
  readonly name = 'npm';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching AI packages from NPM...`);

      const products: CrawledProduct[] = [];
      const seen = new Set<string>();

      for (const query of AI_QUERIES) {
        try {
          const url = `${NPM_SEARCH_API}?text=${encodeURIComponent(query)}&size=${MAX_PER_QUERY}`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'AIRadarBot/1.0' },
          });
          clearTimeout(timeout);

          if (!response.ok) continue;

          const data = await response.json();
          if (!data.objects || !Array.isArray(data.objects)) continue;

          for (const obj of data.objects) {
            const product = this.extractProduct(obj);
            if (product && !seen.has(product.website_url)) {
              seen.add(product.website_url);
              products.push(product);
            }
          }
        } catch {
          // Skip failed query
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} packages.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private extractProduct(obj: any): CrawledProduct | null {
    const pkg = obj.package;
    if (!pkg) return null;

    const name = pkg.name || '';
    const description = pkg.description || '';
    const version = pkg.version || '';
    const keywords = pkg.keywords || [];
    const links = pkg.links || {};
    const homepage = links.homepage || links.repository || links.npm || '';
    const repository = links.repository || '';
    const weeklyDownloads = obj.downloads?.weekly || 0;

    if (!name || !description) return null;

    // Only include packages with decent downloads
    if (weeklyDownloads < 100) return null;

    const category = this.deriveCategory(keywords, name, description);

    return {
      name: name,
      slug: '', // Will be enriched
      description: `${description} (v${version}, ${weeklyDownloads.toLocaleString()} weekly downloads)`,
      website_url: homepage || `https://www.npmjs.com/package/${name}`,
      github_url: repository || undefined,
      tags: keywords.slice(0, 5),
      category,
      source: 'rss', // Use 'rss' as source type
      source_url: `https://www.npmjs.com/package/${name}`,
      crawled_at: new Date().toISOString(),
      pricing_model: 'open_source',
    };
  }

  private deriveCategory(keywords: string[], name: string, description: string): string {
    const text = (keywords.join(' ') + ' ' + name + ' ' + description).toLowerCase();

    if (text.includes('llm') || text.includes('language model') || text.includes('openai') || text.includes('chatgpt')) {
      return 'LLM';
    }
    if (text.includes('vector') || text.includes('embedding') || text.includes('database')) {
      return 'AI Infra';
    }
    if (text.includes('agent') || text.includes('autonomous') || text.includes('chain')) {
      return 'AI Agents';
    }
    if (text.includes('image') || text.includes('vision') || text.includes('diffusion')) {
      return 'AI Image';
    }
    if (text.includes('speech') || text.includes('audio') || text.includes('voice') || text.includes('tts')) {
      return 'AI Audio';
    }
    if (text.includes('search') || text.includes('recommendation')) {
      return 'AI Search';
    }
    return 'AI Tools';
  }
}
