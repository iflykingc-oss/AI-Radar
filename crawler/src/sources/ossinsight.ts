/**
 * OSSInsight data source.
 *
 * Uses the OSSInsight API to fetch trending GitHub repositories.
 *
 * API docs: https://ossinsight.io/docs/api
 */
import { CrawledProduct, DataSource } from '../types.js';

const OSSINSIGHT_API = 'https://api.ossinsight.io/v1/trends/repos';

export class OSSInsightSource implements DataSource {
  readonly name = 'ossinsight';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching trending repos from OSSInsight...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(OSSINSIGHT_API, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AIRadarBot/1.0' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      const rows = data?.data || [];
      const products: CrawledProduct[] = [];

      for (const row of rows) {
        const product = this.extractProduct(row);
        if (product) {
          products.push(product);
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} trending repos.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private extractProduct(row: any): CrawledProduct | null {
    const name = row.repo_name || '';
    const description = row.description || '';
    const stars = row.stargazers || 0;
    const language = row.language || '';
    const url = `https://github.com/${name}`;

    if (!name || stars < 100) return null;

    // Only include AI-related repos
    const isAI = this.isAIRelated(name, description, language);
    if (!isAI) return null;

    const category = this.deriveCategory(name, description, language);
    const tags = this.extractTags(name, description, language);

    return {
      name: name.split('/')[1] || name,
      slug: '', // Will be enriched
      description: description.substring(0, 500),
      website_url: url,
      github_url: url,
      github_stars: stars,
      tags,
      category,
      source: 'github',
      source_url: url,
      crawled_at: new Date().toISOString(),
      pricing_model: 'open_source',
    };
  }

  private isAIRelated(name: string, description: string, language: string): boolean {
    const text = (name + ' ' + description).toLowerCase();
    const aiKeywords = [
      'ai', 'ml', 'llm', 'gpt', 'transformer', 'neural', 'deep-learning',
      'machine-learning', 'nlp', 'cv', 'vision', 'diffusion', 'agent',
      'openai', 'anthropic', 'langchain', 'llamaindex', 'vector', 'embedding',
      'rag', 'chatbot', 'model', 'inference', 'training',
    ];
    return aiKeywords.some(kw => text.includes(kw));
  }

  private deriveCategory(name: string, description: string, language: string): string {
    const text = (name + ' ' + description).toLowerCase();

    if (text.includes('llm') || text.includes('gpt') || text.includes('language model') || text.includes('chatbot')) {
      return 'LLM';
    }
    if (text.includes('agent') || text.includes('autonomous') || text.includes('chain') || text.includes('rag')) {
      return 'AI Agents';
    }
    if (text.includes('image') || text.includes('vision') || text.includes('diffusion')) {
      return 'AI Image';
    }
    if (text.includes('speech') || text.includes('audio') || text.includes('voice') || text.includes('tts')) {
      return 'AI Audio';
    }
    if (text.includes('vector') || text.includes('embedding') || text.includes('database')) {
      return 'AI Infra';
    }
    if (text.includes('code') || text.includes('copilot') || text.includes('coding')) {
      return 'AI Coding';
    }
    return 'AI Tools';
  }

  private extractTags(name: string, description: string, language: string): string[] {
    const text = (name + ' ' + description).toLowerCase();
    const tags: string[] = [];

    if (language) tags.push(language.toLowerCase());

    const tagKeywords = [
      'llm', 'gpt', 'transformer', 'agent', 'rag', 'vector',
      'openai', 'anthropic', 'langchain', 'diffusion',
    ];

    for (const kw of tagKeywords) {
      if (text.includes(kw) && !tags.includes(kw)) {
        tags.push(kw);
      }
    }

    return tags.slice(0, 5);
  }
}
