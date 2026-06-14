/**
 * RSS feed data source.
 *
 * Fetches and parses RSS feeds from tech news sites to discover new AI products.
 * Supported feeds:
 *   - TechCrunch AI
 *   - VentureBeat AI
 *
 * Uses fast-xml-parser for RSS parsing and node-fetch for HTTP requests.
 */
import { CrawledProduct, DataSource } from '../types.js';
import { XMLParser } from 'fast-xml-parser';

/**
 * RSS feed URLs to scrape for AI product news.
 * Organized by category for maintainability.
 * Last verified: 2026-06-14
 */
const RSS_FEEDS: Array<{ url: string; name: string }> = [
  // === Tech Media (新闻为主) ===
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review' },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', name: 'Wired AI' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
  { url: 'https://www.artificialintelligence-news.com/feed/', name: 'AI News' },
  { url: 'https://the-decoder.com/feed/', name: 'The Decoder' },
  { url: 'https://www.marktechpost.com/feed/', name: 'MarkTechPost' },
  { url: 'https://aibusiness.com/rss.xml', name: 'AI Business' },
  { url: 'https://lastweekin.ai/feed', name: 'Last Week in AI' },
  { url: 'https://semianalysis.com/feed/', name: 'SemiAnalysis' },
  { url: 'https://www.newscientist.com/subject/artificial-intelligence/feed/', name: 'New Scientist AI' },
  { url: 'https://spectrum.ieee.org/rss/topic/artificial-intelligence', name: 'IEEE Spectrum AI' },
  { url: 'https://www.nature.com/subjects/machine-learning.rss', name: 'Nature ML' },
  { url: 'https://www.nature.com/natmachintell.rss', name: 'Nature Machine Intelligence' },
  { url: 'https://www.science.org/rss/news_current.xml', name: 'Science Magazine' },

  // === 更多科技新闻 ===
  { url: 'https://www.engadget.com/rss.xml', name: 'Engadget' },
  { url: 'https://singularityhub.com/feed/', name: 'Singularity Hub' },
  { url: 'https://www.futurism.com/feeds/latest', name: 'Futurism' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NY Times Tech' },
  { url: 'https://www.reuters.com/rssFeed/technologyNews', name: 'Reuters Tech' },

  // === AI 专业新闻 ===
  { url: 'https://www.unite.ai/feed/', name: 'Unite AI' },
  { url: 'https://neurosciencenews.com/feed/', name: 'Neuroscience News' },
  { url: 'https://analyticsindiamag.com/feed/', name: 'Analytics India Magazine' },
  { url: 'https://www.kdnuggets.com/feed', name: 'KDnuggets' },
  { url: 'https://machinelearningmastery.com/feed/', name: 'Machine Learning Mastery' },
  { url: 'https://www.freecodecamp.org/news/rss/', name: 'freeCodeCamp' },
  { url: 'https://dev.to/feed', name: 'Dev.to' },
  { url: 'https://medium.com/feed/tag/artificial-intelligence', name: 'Medium AI' },
  { url: 'https://towardsdatascience.com/feed', name: 'Towards Data Science' },

  // === Chinese Media ===
  { url: 'https://www.jiqizhixin.com/rss', name: '机器之心' },
  { url: 'https://www.qbitai.com/feed', name: '量子位' },
  { url: 'https://sspai.com/feed', name: '少数派' },
  { url: 'https://www.infoq.cn/feed', name: 'InfoQ中文' },
  { url: 'https://36kr.com/feed', name: '36氪' },
  { url: 'https://www.leiphone.com/feed', name: '雷锋网' },
  { url: 'https://www.geekpark.net/rss', name: '极客公园' },
  { url: 'https://www.tmtpost.com/feed', name: '钛媒体' },
  { url: 'https://www.ifanr.com/feed', name: '爱范儿' },
  { url: 'https://www.woshipm.com/feed', name: '人人都是产品经理' },

  // === Company Blogs (验证过的) ===
  { url: 'https://huggingface.co/blog/feed.xml', name: 'HuggingFace Blog' },
  { url: 'https://deepmind.google/blog/rss.xml', name: 'Google DeepMind' },
  { url: 'https://mistral.ai/news/rss.xml', name: 'Mistral AI' },
  { url: 'https://blog.langchain.dev/rss/', name: 'LangChain Blog' },
  { url: 'https://blog.vllm.ai/feed', name: 'vLLM Blog' },

  // === Research & Academic ===
  { url: 'https://bair.berkeley.edu/blog/feed.xml', name: 'BAIR Blog' },
  { url: 'https://thegradient.pub/rss/', name: 'The Gradient' },
  { url: 'https://blog.ml.cmu.edu/feed/', name: 'CMU ML Blog' },
  { url: 'https://allenai.org/rss.xml', name: 'Allen AI' },
  { url: 'https://www.lesswrong.com/feed.xml', name: 'LessWrong' },
  { url: 'https://www.alignmentforum.org/feed.xml', name: 'Alignment Forum' },

  // === Newsletters & Personal Blogs ===
  { url: 'https://simonwillison.net/atom/everything/', name: 'Simon Willison' },
  { url: 'https://lilianweng.github.io/index.xml', name: 'Lilian Weng' },
  { url: 'https://karpathy.ai/feed.xml', name: 'Andrej Karpathy' },
  { url: 'https://www.deeplearning.ai/the-batch/feed/', name: 'The Batch (Andrew Ng)' },
  { url: 'https://importai.substack.com/feed', name: 'Import AI' },
  { url: 'https://www.latent.space/feed', name: 'Latent Space' },
  { url: 'https://www.interconnects.ai/feed', name: 'Interconnects' },
  { url: 'https://huyenchip.com/feed.xml', name: 'Huyen Chip' },
  { url: 'https://eugeneyan.com/rss/', name: 'Eugene Yan' },
  { url: 'https://magazine.sebastianraschka.com/feed', name: 'Sebastian Raschka' },
  { url: 'https://wandb.ai/site/rss.xml', name: 'Weights & Biases' },

  // === Product & Community ===
  { url: 'https://www.producthunt.com/feed', name: 'Product Hunt' },
  { url: 'https://www.ruanyifeng.com/blog/atom.xml', name: '阮一峰周刊' },

  // === arXiv ===
  { url: 'https://arxiv.org/rss/cs.AI', name: 'arXiv CS.AI' },
  { url: 'https://arxiv.org/rss/cs.CL', name: 'arXiv CS.CL (NLP)' },
  { url: 'https://arxiv.org/rss/cs.LG', name: 'arXiv CS.LG (ML)' },
];

/**
 * Keywords that indicate a feed item is about a specific AI product.
 */
const PRODUCT_KEYWORDS = [
  'launch', 'launches', 'launched',
  'release', 'released',
  'introduces', 'introducing',
  'announces', 'announcing',
  'debuts', 'unveils',
  'now available', 'now live',
  'new tool', 'new platform', 'new service', 'new app',
  'startup',
];

export class RSSSource implements DataSource {
  readonly name = 'rss';

  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
  }

  /**
   * Fetch all configured RSS feeds and extract AI product mentions.
   * @returns Array of CrawledProduct objects, or empty array on failure.
   */
  async fetch(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`[${this.name}] Fetching feed: ${feed.name} (${feed.url})`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(feed.url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          console.error(
            `[${this.name}] Failed to fetch ${feed.name}: HTTP ${response.status}`
          );
          continue;
        }

        const xmlText = await response.text();
        const parsed = this.parser.parse(xmlText) as RSSFeed;

        const items = this.extractItems(parsed);

        for (const item of items) {
          const product = this.extractProduct(item, feed.name);
          if (product) {
            products.push(product);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${this.name}] Failed to parse ${feed.name}: ${message}`);
        // Continue to next feed
      }
    }

    console.log(`[${this.name}] Extracted ${products.length} products.`);
    return products;
  }

  /**
   * Extract the array of <item> elements from a parsed RSS feed.
   * Handles both RSS 2.0 and various nesting patterns.
   */
  private extractItems(parsed: RSSFeed): RSSItem[] {
    const channel = parsed.rss?.channel ?? parsed.feed;
    if (!channel) return [];

    const items = channel.item;
    if (Array.isArray(items)) return items;
    if (items) return [items];
    return [];
  }

  /**
   * Extract a CrawledProduct from an RSS feed item if it appears to be
   * about a new AI product.
   */
  private extractProduct(item: RSSItem, feedName: string): CrawledProduct | null {
    const title = item.title ?? '';
    const description = this.stripHtml(item.description ?? '');
    const link = item.link ?? '';

    // Check if the title suggests a product launch
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const isProductLaunch = PRODUCT_KEYWORDS.some(
      (kw) => titleLower.includes(kw) || descLower.includes(kw)
    );

    // Also check for AI-related keywords
    const hasAIKeyword = this.containsAIKeyword(titleLower, descLower);

    if (!hasAIKeyword) return null;

    // Extract product name from title
    // Typical format: "Company launches Product Name" or "Product Name: description"
    const name = this.extractProductName(title);

    if (!name || name.length < 2) return null;

    // Derive category
    const category = this.deriveCategory(titleLower, descLower);

    // Derive tags
    const tags = this.deriveTags(titleLower, descLower);

    return {
      name,
      name_en: name,
      description: description || title,
      website_url: link,
      tags,
      category,
      source: 'rss',
      source_url: link,
      crawled_at: new Date().toISOString(),
      pricing_model: undefined,
    };
  }

  /**
   * Strip HTML tags from a string (RSS descriptions often contain HTML).
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Check if the text contains AI-related keywords.
   */
  private containsAIKeyword(titleLower: string, descLower: string): boolean {
    const text = titleLower + ' ' + descLower;
    const aiKeywords = [
      'ai', 'llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini',
      'machine learning', 'artificial intelligence',
      'generative', 'diffusion', 'stable diffusion',
      'openai', 'anthropic', 'deepmind',
      'agent', 'chatbot',
      'rag', 'retrieval augmented',
    ];
    return aiKeywords.some((kw) => text.includes(kw));
  }

  /**
   * Extract a product name from an RSS item title.
   * Attempts common title patterns to isolate the product name.
   */
  private extractProductName(title: string): string | null {
    // Pattern: "Company launches Product Name"
    const launchMatch = title.match(
      /(?:launch|release|introduce|announce|unveil|debut)s?\s+["']?([^"':\-.]+)/i
    );
    if (launchMatch) {
      return launchMatch[1].trim();
    }

    // Pattern: "Product Name: description" or "Product Name - description"
    const colonMatch = title.match(/^["']?([^"':\-\|–—]+)["']?(?:[-–—|:].*)?$/);
    if (colonMatch) {
      return colonMatch[1].trim();
    }

    // Fallback: use the first 40 characters
    return title.substring(0, 40).trim() || null;
  }

  /**
   * Derive a category from the item text.
   */
  private deriveCategory(titleLower: string, descLower: string): string {
    const text = titleLower + ' ' + descLower;

    if (text.includes('llm') || text.includes('gpt') || text.includes('llama')) {
      return 'LLM';
    }
    if (text.includes('image') || text.includes('diffusion') || text.includes('video generation')) {
      return 'Image Generation';
    }
    if (text.includes('speech') || text.includes('voice') || text.includes('tts')) {
      return 'Speech / Audio';
    }
    if (text.includes('agent') || text.includes('autonomous')) {
      return 'AI Agents';
    }
    return 'Other';
  }

  /**
   * Derive tags from the item text.
   */
  private deriveTags(titleLower: string, descLower: string): string[] {
    const text = titleLower + ' ' + descLower;
    const tags: string[] = [];
    const keywords = ['llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini', 'agent', 'chatbot', 'rag', 'diffusion', 'openai', 'anthropic'];

    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.push(kw);
      }
    }

    if (tags.length === 0) {
      tags.push('ai');
    }

    return tags;
  }
}

// --- RSS types (simplified for common RSS 2.0 structure) ---

interface RSSFeed {
  rss?: {
    channel: RSSChannel;
  };
  feed?: RSSChannel;
}

interface RSSChannel {
  title?: string;
  link?: string;
  description?: string;
  item?: RSSItem | RSSItem[];
}

interface RSSItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  guid?: string;
  category?: string | { _text: string } | Array<string | { _text: string }>;
}
