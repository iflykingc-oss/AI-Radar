/**
 * ArXiv data source.
 *
 * Uses the ArXiv API to fetch recent AI/ML papers.
 * Papers are treated as "products" in the research/academic category.
 *
 * API docs: https://info.arxiv.org/help/api/index.html
 */
import { CrawledProduct, DataSource } from '../types.js';
import { XMLParser } from 'fast-xml-parser';

const ARXIV_API = 'https://export.arxiv.org/api/query';

const AI_CATEGORIES = [
  'cat:cs.AI',  // Artificial Intelligence
  'cat:cs.LG',  // Machine Learning
  'cat:cs.CL',  // Computation and Language (NLP)
  'cat:cs.CV',  // Computer Vision
];

const MAX_RESULTS = 30;

export class ArxivSource implements DataSource {
  readonly name = 'arxiv';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching recent AI papers...`);

      const query = AI_CATEGORIES.join('+OR+');
      const url = `${ARXIV_API}?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${MAX_RESULTS}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);

      const entries = parsed?.feed?.entry || [];
      const entryArray = Array.isArray(entries) ? entries : [entries];

      const products: CrawledProduct[] = [];

      for (const entry of entryArray) {
        const product = this.extractProduct(entry);
        if (product) {
          products.push(product);
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} papers.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private extractProduct(entry: any): CrawledProduct | null {
    const title = (entry.title || '').replace(/\s+/g, ' ').trim();
    const summary = (entry.summary || '').replace(/\s+/g, ' ').trim();
    const link = Array.isArray(entry.link) ? entry.link : [entry.link];
    const paperUrl = link.find((l: any) => l['@_type'] === 'text/html')?.['@_href']
      || link[0]?.['@_href']
      || '';

    if (!title || title.length < 5) return null;

    // Extract authors
    const authors = Array.isArray(entry.author) ? entry.author : [entry.author];
    const authorNames = authors.map((a: any) => a.name).filter(Boolean);

    // Extract categories
    const categories = Array.isArray(entry.category) ? entry.category : [entry.category];
    const tags = categories
      .map((c: any) => c['@_term'] || '')
      .filter(Boolean)
      .slice(0, 5);

    // Determine AI subcategory
    const category = this.deriveCategory(tags, title, summary);

    return {
      name: title.substring(0, 100),
      slug: '', // Will be enriched
      description: summary.substring(0, 500),
      website_url: paperUrl,
      tags: ['arxiv', 'research', ...tags.slice(0, 3)],
      category,
      source: 'rss', // Use 'rss' as source type since ArXiv is similar
      source_url: paperUrl,
      crawled_at: new Date().toISOString(),
      pricing_model: 'free',
    };
  }

  private deriveCategory(tags: string[], title: string, summary: string): string {
    const text = (tags.join(' ') + ' ' + title + ' ' + summary).toLowerCase();

    if (text.includes('vision') || text.includes('image') || text.includes('cv') || text.includes('diffusion')) {
      return 'AI Image';
    }
    if (text.includes('language') || text.includes('nlp') || text.includes('text') || text.includes('llm')) {
      return 'LLM';
    }
    if (text.includes('speech') || text.includes('audio') || text.includes('voice')) {
      return 'AI Audio';
    }
    if (text.includes('video') || text.includes('motion')) {
      return 'AI Video';
    }
    if (text.includes('agent') || text.includes('planning') || text.includes('reasoning')) {
      return 'AI Agents';
    }
    return 'AI Research';
  }
}
