/**
 * Twitter/X data source.
 *
 * Fetches AI-related tweets from Twitter/X using multiple strategies:
 * 1. RSSHub (self-hosted or public instance) - most reliable
 * 2. Nitter RSS feeds (if available)
 * 3. Twitter API v2 (requires API key)
 *
 * Configuration via environment variables:
 * - TWITTER_RSSHub_URL: RSSHub instance URL (default: https://rsshub.app)
 * - TWITTER_AUTH_TOKEN: Twitter auth token for RSSHub
 * - TWITTER_BEARER_TOKEN: Twitter API v2 bearer token
 *
 * Target accounts: AI researchers, companies, and influencers
 */
import { CrawledProduct, DataSource } from '../types.js';

/**
 * AI-focused Twitter accounts to monitor.
 * These are the most influential AI accounts that frequently announce new products.
 */
const AI_ACCOUNTS = [
  // === AI Companies ===
  { handle: 'OpenAI', name: 'OpenAI', category: 'LLM' },
  { handle: 'AnthropicAI', name: 'Anthropic', category: 'LLM' },
  { handle: 'GoogleDeepMind', name: 'Google DeepMind', category: 'LLM' },
  { handle: 'MetaAI', name: 'Meta AI', category: 'LLM' },
  { handle: 'MistralAI', name: 'Mistral AI', category: 'LLM' },
  { handle: 'Cohere', name: 'Cohere', category: 'LLM' },
  { handle: 'StabilityAI', name: 'Stability AI', category: 'Image Generation' },
  { handle: 'Midaborney', name: 'Midjourney', category: 'Image Generation' },
  { handle: 'RunwayML', name: 'Runway', category: 'Video Generation' },
  { handle: 'elevenlabsio', name: 'ElevenLabs', category: 'Speech/Audio' },
  { handle: 'PerplexityAI', name: 'Perplexity AI', category: 'AI Search' },
  { handle: 'cursor_ai', name: 'Cursor', category: 'AI Coding' },
  { handle: 'replit', name: 'Replit', category: 'AI Coding' },
  { handle: 'LangChainAI', name: 'LangChain', category: 'AI Framework' },
  { handle: 'llaboratory_index', name: 'LlamaIndex', category: 'AI Framework' },
  { handle: 'huggingface', name: 'Hugging Face', category: 'AI Platform' },
  { handle: 'WeightsBiases', name: 'Weights & Biases', category: 'MLOps' },
  { handle: 'Replicate', name: 'Replicate', category: 'AI Platform' },
  { handle: 'togethercompute', name: 'Together AI', category: 'AI Infrastructure' },
  { handle: 'ollama', name: 'Ollama', category: 'Local AI' },

  // === AI Researchers & Influencers ===
  { handle: 'karpathy', name: 'Andrej Karpathy', category: 'AI Research' },
  { handle: 'ylecun', name: 'Yann LeCun', category: 'AI Research' },
  { handle: 'AndrewYNg', name: 'Andrew Ng', category: 'AI Education' },
  { handle: 'sama', name: 'Sam Altman', category: 'AI Industry' },
  { handle: 'demaborney_hassabis', name: 'Demis Hassabis', category: 'AI Research' },
  { handle: 'JimFan', name: 'Jim Fan', category: 'AI Research' },
  { handle: 'DrJimFan', name: 'Jim Fan (NVIDIA)', category: 'AI Research' },
  { handle: '_jasonwei', name: 'Jason Wei', category: 'AI Research' },
  { handle: 'swyx', name: 'Shawn Wang', category: 'AI Engineering' },
  { handle: 'simonw', name: 'Simon Willison', category: 'AI Engineering' },
  { handle: 'chipro', name: 'Chi Wang', category: 'AI Research' },

  // === AI News & Media ===
  { handle: 'ai_breakdown', name: 'AI Breakdown', category: 'AI News' },
  { handle: 'TheAIExchange', name: 'The AI Exchange', category: 'AI News' },
  { handle: 'AIatMeta', name: 'AI at Meta', category: 'AI Research' },
  { handle: 'GoogleAI', name: 'Google AI', category: 'AI Research' },
  { handle: 'MicrosoftAI', name: 'Microsoft AI', category: 'AI Research' },
];

/**
 * RSSHub instance URL. Can be configured via environment variable.
 * Self-hosted instances work better than public ones for Twitter.
 */
const RSSHUB_URL = process.env.TWITTER_RSSHub_URL || 'https://rsshub.app';

/**
 * Twitter auth token for RSSHub (optional, improves reliability).
 * Get from browser cookies when logged into Twitter.
 */
const AUTH_TOKEN = process.env.TWITTER_AUTH_TOKEN;

/**
 * Twitter API v2 bearer token (optional, fallback method).
 * Get from https://developer.twitter.com/en/portal/dashboard
 */
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

/**
 * Nitter instances to try as fallback for Twitter RSS.
 * Some public instances may still work.
 */
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.woodland.cafe',
];

/**
 * Maximum tweets to fetch per account.
 */
const MAX_PER_ACCOUNT = 10;

export class TwitterSource implements DataSource {
  readonly name = 'twitter';

  async fetch(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];
    const seen = new Set<string>();

    console.log(`[${this.name}] Fetching AI tweets from ${AI_ACCOUNTS.length} accounts...`);

    // Strategy 1: Try RSSHub
    console.log(`[${this.name}] Trying RSSHub...`);
    const rsshubProducts = await this.fetchViaRSSHub();
    for (const p of rsshubProducts) {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        products.push(p);
      }
    }

    // Strategy 2: Try Nitter instances if RSSHub failed
    if (products.length < 10) {
      console.log(`[${this.name}] RSSHub returned few results, trying Nitter...`);
      const nitterProducts = await this.fetchViaNitter();
      for (const p of nitterProducts) {
        const key = p.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          products.push(p);
        }
      }
    }

    // Strategy 3: Try Twitter API if bearer token is available
    if (BEARER_TOKEN && products.length < 50) {
      console.log(`[${this.name}] Trying Twitter API...`);
      const apiProducts = await this.fetchViaAPI();
      for (const p of apiProducts) {
        const key = p.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          products.push(p);
        }
      }
    }

    console.log(`[${this.name}] Extracted ${products.length} products from Twitter/X.`);
    return products;
  }

  /**
   * Fetch tweets via RSSHub Twitter route.
   * Route: /twitter/user/:id
   * Uses parallel requests for speed.
   */
  private async fetchViaRSSHub(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    // Fetch all accounts in parallel
    const promises = AI_ACCOUNTS.map(async (account) => {
      try {
        const url = `${RSSHUB_URL}/twitter/user/${account.handle}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const headers: Record<string, string> = {
          'Accept': 'application/rss+xml, application/xml, text/xml',
        };
        if (AUTH_TOKEN) {
          headers['Cookie'] = `auth_token=${AUTH_TOKEN}`;
        }
        const response = await fetch(url, { signal: controller.signal, headers });
        clearTimeout(timeout);

        if (!response.ok) return [];

        const xmlText = await response.text();
        const items = this.parseItems(xmlText);
        const accountProducts: CrawledProduct[] = [];

        for (const item of items.slice(0, MAX_PER_ACCOUNT)) {
          const product = this.extractProductFromTweet(item, account);
          if (product) {
            accountProducts.push(product);
          }
        }

        return accountProducts;
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        products.push(...result.value);
      }
    }

    return products;
  }

  /**
   * Fetch tweets via Twitter API v2.
   * Requires BEARER_TOKEN environment variable.
   */
  private async fetchViaAPI(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    for (const account of AI_ACCOUNTS) {
      try {
        // First, get user ID by username
        const userUrl = `https://api.twitter.com/2/users/by/username/${account.handle}`;
        const userResp = await fetch(userUrl, {
          headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` },
          signal: AbortSignal.timeout(10000),
        });

        if (!userResp.ok) continue;
        const userData = await userResp.json() as any;
        const userId = userData?.data?.id;
        if (!userId) continue;

        // Then, get user's tweets
        const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=${MAX_PER_ACCOUNT}&tweet.fields=created_at,entities,public_metrics`;
        const tweetsResp = await fetch(tweetsUrl, {
          headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` },
          signal: AbortSignal.timeout(10000),
        });

        if (!tweetsResp.ok) continue;
        const tweetsData = await tweetsResp.json() as any;
        const tweets = tweetsData?.data || [];

        for (const tweet of tweets) {
          const product = this.extractProductFromAPI(tweet, account);
          if (product) {
            products.push(product);
          }
        }
      } catch {
        // Skip failed account
      }
    }

    return products;
  }

  /**
   * Fetch tweets via Nitter RSS feeds.
   * Nitter is an open-source Twitter front-end that provides RSS feeds.
   * Uses parallel requests for speed.
   */
  private async fetchViaNitter(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    // Only check a subset of accounts to avoid rate limiting and timeout
    const accountsToCheck = AI_ACCOUNTS.slice(0, 8);

    for (const instance of NITTER_INSTANCES) {
      if (products.length >= 20) break;

      // Fetch all accounts in parallel for this instance
      const promises = accountsToCheck.map(async (account) => {
        try {
          const url = `${instance}/${account.handle}/rss`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
          });
          clearTimeout(timeout);

          if (!response.ok) return [];

          const xmlText = await response.text();
          const items = this.parseItems(xmlText);
          const accountProducts: CrawledProduct[] = [];

          for (const item of items.slice(0, 3)) {
            const product = this.extractProductFromTweet(item, account);
            if (product) {
              accountProducts.push(product);
            }
          }

          return accountProducts;
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(promises);
      for (const result of results) {
        if (result.status === 'fulfilled') {
          products.push(...result.value);
        }
      }

      if (products.length > 0) {
        console.log(`[${this.name}] Nitter instance ${instance} returned ${products.length} products`);
        break;
      }
    }

    return products;
  }

  /**
   * Parse RSS XML to extract items.
   */
  private parseItems(xmlText: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const title = this.extractTag(itemXml, 'title');
      const link = this.extractTag(itemXml, 'link');
      const description = this.extractTag(itemXml, 'description');
      const pubDate = this.extractTag(itemXml, 'pubDate');

      if (title) {
        items.push({ title, link, description, pubDate });
      }
    }

    return items;
  }

  /**
   * Extract content from an XML tag.
   */
  private extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract a product from a tweet (RSS format).
   */
  private extractProductFromTweet(
    item: { title: string; link: string; description: string; pubDate: string },
    account: { handle: string; name: string; category: string }
  ): CrawledProduct | null {
    const text = item.title || item.description || '';
    if (!text || text.length < 20) return null;

    // Check if tweet mentions a product launch
    if (!this.isProductMention(text)) return null;

    // Extract product name
    const name = this.extractProductName(text);
    if (!name) return null;

    // Extract URLs from text
    const urlMatch = text.match(/https?:\/\/[^\s<>"]+/);
    const websiteUrl = urlMatch ? urlMatch[0] : `https://twitter.com/${account.handle}`;

    // Extract GitHub URLs
    const githubMatch = text.match(/https?:\/\/github\.com\/[^\s<>"]+/);

    return {
      name,
      slug: '',
      description: text.substring(0, 500),
      website_url: websiteUrl,
      github_url: githubMatch ? githubMatch[0] : undefined,
      tags: this.extractTags(text, account.category),
      category: account.category,
      source: 'twitter' as any,
      source_url: item.link || `https://twitter.com/${account.handle}`,
      crawled_at: new Date().toISOString(),
    };
  }

  /**
   * Extract a product from a tweet (API format).
   */
  private extractProductFromAPI(
    tweet: any,
    account: { handle: string; name: string; category: string }
  ): CrawledProduct | null {
    const text = tweet.text || '';
    if (!text || text.length < 20) return null;

    if (!this.isProductMention(text)) return null;

    const name = this.extractProductName(text);
    if (!name) return null;

    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    const githubMatch = text.match(/https?:\/\/github\.com\/[^\s]+/);

    return {
      name,
      slug: '',
      description: text.substring(0, 500),
      website_url: urlMatch ? urlMatch[0] : `https://twitter.com/${account.handle}/status/${tweet.id}`,
      github_url: githubMatch ? githubMatch[0] : undefined,
      tags: this.extractTags(text, account.category),
      category: account.category,
      source: 'twitter' as any,
      source_url: `https://twitter.com/${account.handle}/status/${tweet.id}`,
      crawled_at: new Date().toISOString(),
    };
  }

  /**
   * Check if a tweet mentions a product launch or announcement.
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
   * Extract a product name from tweet text.
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

    // Pattern: "@mention launches ProductName"
    const mentionMatch = text.match(/@\w+\s+(?:launch|release|introduce)s?\s+["']?([^"':\-.]{2,40})/i);
    if (mentionMatch) {
      return mentionMatch[1].trim();
    }

    // Fallback: extract capitalized phrases
    const capitalMatch = text.match(/\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\b/);
    if (capitalMatch && capitalMatch[1].length > 2) {
      return capitalMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract tags from tweet text.
   */
  private extractTags(text: string, category: string): string[] {
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

    // Add category as tag
    if (!tags.includes(category.toLowerCase())) {
      tags.push(category.toLowerCase());
    }

    return tags.slice(0, 5);
  }
}
