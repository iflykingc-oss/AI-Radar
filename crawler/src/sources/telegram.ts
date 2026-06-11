/**
 * Telegram data source.
 *
 * Fetches public Telegram channel posts via web scraping.
 * No API key needed - uses public t.me/s/ preview pages.
 */
import { CrawledProduct, DataSource } from '../types.js';
import { XMLParser } from 'fast-xml-parser';

const TELEGRAM_CHANNELS = [
  'AI_News_Daily',
  'artificialintelligence_latest',
  'MachineLearning_News',
  'openai_updates',
  'AnthropicAI',
];

export class TelegramSource implements DataSource {
  readonly name = 'telegram';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching from Telegram channels...`);

      const products: CrawledProduct[] = [];
      const seen = new Set<string>();

      for (const channel of TELEGRAM_CHANNELS) {
        try {
          const url = `https://t.me/s/${channel}`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          clearTimeout(timeout);

          if (!response.ok) continue;

          const html = await response.text();
          const extracted = this.extractFromHtml(html, channel);

          for (const product of extracted) {
            if (!seen.has(product.website_url)) {
              seen.add(product.website_url);
              products.push(product);
            }
          }
        } catch {
          // Skip failed channel
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} posts.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private extractFromHtml(html: string, channel: string): CrawledProduct[] {
    const products: CrawledProduct[] = [];

    // Simple regex extraction for Telegram post previews
    // Look for post text blocks
    const postRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;

    while ((match = postRegex.exec(html)) !== null) {
      const rawText = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      if (rawText.length < 20) continue;

      // Only include posts that mention AI products/tools
      const isProduct = this.isProductMention(rawText);
      if (!isProduct) continue;

      const category = this.deriveCategory(rawText);
      const tags = this.extractTags(rawText, channel);

      products.push({
        name: rawText.substring(0, 80).replace(/\s+\S*$/, ''),
        slug: '',
        description: rawText.substring(0, 500),
        website_url: `https://t.me/${channel}`,
        tags,
        category,
        source: 'rss',
        source_url: `https://t.me/s/${channel}`,
        crawled_at: new Date().toISOString(),
      });
    }

    return products.slice(0, 10); // Limit per channel
  }

  private isProductMention(text: string): boolean {
    const lower = text.toLowerCase();
    const indicators = [
      'launch', 'release', 'announce', 'new model', 'new tool',
      'open source', 'github', 'api', 'gpt', 'llm', 'claude',
      'gemini', 'mistral', 'llama', 'agent', 'rag',
    ];
    return indicators.some(ind => lower.includes(ind));
  }

  private deriveCategory(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('llm') || lower.includes('gpt') || lower.includes('language model')) {
      return 'LLM';
    }
    if (lower.includes('image') || lower.includes('vision') || lower.includes('diffusion')) {
      return 'AI Image';
    }
    if (lower.includes('agent') || lower.includes('autonomous')) {
      return 'AI Agents';
    }
    return 'AI Tools';
  }

  private extractTags(text: string, channel: string): string[] {
    const lower = text.toLowerCase();
    const tags: string[] = [channel];

    const keywords = ['llm', 'gpt', 'claude', 'gemini', 'mistral', 'openai', 'anthropic', 'agent', 'model'];
    for (const kw of keywords) {
      if (lower.includes(kw) && !tags.includes(kw)) {
        tags.push(kw);
      }
    }

    return tags.slice(0, 5);
  }
}
