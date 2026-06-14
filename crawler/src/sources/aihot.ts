/**
 * AIHot data source (卡兹克 AI 热榜).
 *
 * Fetches trending AI topics from aihot.virxact.com public API.
 * Covers AI product launches, model releases, funding, and industry news.
 *
 * API: https://aihot.virxact.com/api/public/items?mode=selected
 */
import { CrawledProduct, DataSource } from '../types.js';

const AIHOT_BASE_URL = 'https://aihot.virxact.com';
const API_TIMEOUT_MS = 15_000;

export class AIHotSource implements DataSource {
  readonly name = 'aihot';

  async fetch(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    // Fetch both 'selected' and 'all' modes for broader coverage
    const endpoints = [
      '/api/public/items?mode=selected',
      '/api/public/items?mode=all',
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${AIHOT_BASE_URL}${endpoint}`;
        console.log(`[${this.name}] Fetching: ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          console.error(`[${this.name}] HTTP ${response.status} for ${endpoint}`);
          continue;
        }

        const data: any = await response.json();
        const items: any[] = Array.isArray(data) ? data : (data.items || []);

        for (const item of items) {
          const product = this.extractProduct(item);
          if (product) {
            products.push(product);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${this.name}] Error fetching ${endpoint}: ${message}`);
      }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = products.filter(p => {
      const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`[${this.name}] Extracted ${unique.length} products from AIhot.`);
    return unique;
  }

  private extractProduct(item: any): CrawledProduct | null {
    const title: string = item.title || '';
    if (!title || title.length < 5) return null;

    const description: string = item.description || '';
    const url: string = item.url || '';
    const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
    const category: string = item.category || 'AI';

    // Determine if this is news or product based on category
    const isNews = this.isNewsContent(title, description, category);

    // For news, use full title as name; for products, extract product name
    const name = isNews ? title.substring(0, 100) : (this.extractProductName(title) || title.substring(0, 100));
    if (!name) return null;

    // Try to get website URL from the item
    const websiteUrl = url.startsWith('http') ? url : 'https://aihot.virxact.com';

    // Look for GitHub URLs in description
    const githubMatch = description.match(/https?:\/\/github\.com\/[^\s"')]+/);
    const githubUrl = githubMatch ? githubMatch[0] : undefined;

    return {
      name,
      name_en: name,
      description: description.substring(0, 500) || title,
      website_url: websiteUrl,
      github_url: githubUrl,
      tags: tags.length > 0 ? tags : this.deriveTags(title, description),
      category: this.normalizeCategory(category),
      content_type: isNews ? 'news' : 'product',
      source: 'aihot',
      source_url: url,
      crawled_at: new Date().toISOString(),
      pricing_model: undefined,
    };
  }

  /**
   * Determine if content is news based on category and text patterns.
   */
  private isNewsContent(title: string, description: string, category: string): boolean {
    const lower = `${title} ${description} ${category}`.toLowerCase();

    // AIhot categories that are news
    const newsCategories = ['funding', 'acquisition', 'regulation', 'policy', 'industry', 'research', 'event'];
    if (newsCategories.some(c => category.toLowerCase().includes(c))) {
      return true;
    }

    // News patterns in text
    const newsPatterns = [
      /\b(layoff|firing|resign|internal|employees?|staff)\b/i,
      /\b(acquires?|acquisition|merger|buyout)\b/i,
      /\b(funding|raises?|raised|series [a-c]|valuation)\b/i,
      /\b(sues?|lawsuit|legal|regulation|ban)\b/i,
      /\b(controversy|scandal|backlash|criticism)\b/i,
      /\b(interview|analysis|editorial|commentary|report)\b/i,
      /\b(conference|summit|event|keynote)\b/i,
      /\b(predict|forecast|trend|landscape|market)\b/i,
    ];

    const newsScore = newsPatterns.filter(p => p.test(lower)).length;
    return newsScore >= 2;
  }

  private extractProductName(title: string): string | null {
    // Pattern: "Company launches Product Name"
    const launchMatch = title.match(
      /(?:launch|release|introduce|announce|unveil|debut)s?\s+["']?([^"':\-.]+)/i
    );
    if (launchMatch) {
      return launchMatch[1].trim().substring(0, 100);
    }

    // Pattern: "Product Name: description"
    const colonMatch = title.match(/^["']?([^"':\-\|–—]{2,})["']?(?:[-–—|:].*)?$/);
    if (colonMatch) {
      return colonMatch[1].trim().substring(0, 100);
    }

    // Fallback: use full title (truncated)
    return title.substring(0, 80).trim() || null;
  }

  private normalizeCategory(category: string): string {
    const lower = category.toLowerCase();
    if (lower.includes('model') || lower.includes('llm')) return 'LLM';
    if (lower.includes('launch') || lower.includes('product')) return 'Product Launch';
    if (lower.includes('funding') || lower.includes('acquisition')) return 'Funding';
    if (lower.includes('open source')) return 'Open Source';
    if (lower.includes('regulation') || lower.includes('policy')) return 'Regulation';
    if (lower.includes('research')) return 'Research';
    return category || 'AI';
  }

  private deriveTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];
    const keywords = [
      'openai', 'anthropic', 'google', 'meta', 'microsoft', 'apple',
      'gpt', 'claude', 'gemini', 'llama', 'mistral',
      'llm', 'agent', 'rag', 'diffusion', 'multimodal',
      'open source', 'funding', 'startup',
    ];

    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.push(kw);
      }
    }

    return tags.length > 0 ? tags : ['ai'];
  }
}
