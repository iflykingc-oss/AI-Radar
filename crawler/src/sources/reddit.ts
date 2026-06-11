/**
 * Reddit data source.
 *
 * Uses Reddit's public JSON API to fetch AI-related posts.
 *
 * API docs: https://www.reddit.com/dev/api/
 */
import { CrawledProduct, DataSource } from '../types.js';

const AI_SUBREDDITS = [
  'MachineLearning',
  'artificial',
  'LocalLLaMA',
  'singularity',
  'OpenAI',
  'ClaudeAI',
];

const MAX_PER_SUBREDDIT = 15;

export class RedditSource implements DataSource {
  readonly name = 'reddit';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching AI posts from Reddit...`);

      const products: CrawledProduct[] = [];
      const seen = new Set<string>();

      for (const subreddit of AI_SUBREDDITS) {
        try {
          const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${MAX_PER_SUBREDDIT}&raw_json=1`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'AIRadarBot/1.0 (by /u/airadar)' },
          });
          clearTimeout(timeout);

          if (!response.ok) continue;

          const data = await response.json();
          const children = data?.data?.children;
          if (!Array.isArray(children)) continue;

          for (const child of children) {
            const product = this.extractProduct(child.data, subreddit);
            if (product && !seen.has(product.website_url)) {
              seen.add(product.website_url);
              products.push(product);
            }
          }
        } catch {
          // Skip failed subreddit
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

  private extractProduct(post: any, subreddit: string): CrawledProduct | null {
    const title = post.title || '';
    const selftext = post.selftext || '';
    const url = post.url || '';
    const permalink = post.permalink || '';
    const score = post.score || 0;
    const numComments = post.num_comments || 0;

    if (!title || title.length < 10) return null;

    // Skip low-quality posts
    if (score < 10) return null;

    // Check if it's about a specific AI product/tool
    const isProduct = this.isProductMention(title, selftext);
    if (!isProduct) return null;

    const category = this.deriveCategory(subreddit, title, selftext);
    const tags = this.extractTags(title, selftext, subreddit);

    return {
      name: title.substring(0, 100),
      slug: '', // Will be enriched
      description: (selftext || title).substring(0, 500),
      website_url: url.startsWith('http') ? url : `https://www.reddit.com${permalink}`,
      tags,
      category,
      source: 'rss', // Use 'rss' as source type
      source_url: `https://www.reddit.com${permalink}`,
      crawled_at: new Date().toISOString(),
    };
  }

  private isProductMention(title: string, selftext: string): boolean {
    const text = (title + ' ' + selftext).toLowerCase();
    const productIndicators = [
      'launch', 'release', 'announce', 'introduce', 'new tool',
      'new framework', 'new model', 'new api', 'open source',
      'github', 'npm', 'pip install', 'docker',
      'gpt-4', 'claude', 'gemini', 'llama', 'mistral',
      'langchain', 'llamaindex', 'openai', 'anthropic',
      'vector database', 'rag', 'agent',
    ];
    return productIndicators.some(indicator => text.includes(indicator));
  }

  private deriveCategory(subreddit: string, title: string, selftext: string): string {
    const text = (title + ' ' + selftext).toLowerCase();

    if (subreddit === 'LocalLLaMA' || text.includes('llama') || text.includes('mistral') || text.includes('local llm')) {
      return 'LLM';
    }
    if (text.includes('image') || text.includes('vision') || text.includes('diffusion') || text.includes('midjourney')) {
      return 'AI Image';
    }
    if (text.includes('agent') || text.includes('autonomous') || text.includes('rag')) {
      return 'AI Agents';
    }
    if (text.includes('coding') || text.includes('copilot') || text.includes('cursor')) {
      return 'AI Coding';
    }
    if (text.includes('openai') || text.includes('gpt') || text.includes('chatgpt')) {
      return 'LLM';
    }
    if (text.includes('anthropic') || text.includes('claude')) {
      return 'LLM';
    }
    return 'AI Tools';
  }

  private extractTags(title: string, selftext: string, subreddit: string): string[] {
    const text = (title + ' ' + selftext).toLowerCase();
    const tags: string[] = [subreddit.toLowerCase()];

    const tagKeywords = [
      'llm', 'gpt', 'claude', 'gemini', 'llama', 'mistral',
      'openai', 'anthropic', 'google', 'meta',
      'agent', 'rag', 'vector', 'embedding',
      'open-source', 'api', 'model',
    ];

    for (const keyword of tagKeywords) {
      if (text.includes(keyword) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return tags.slice(0, 5);
  }
}
