/**
 * Enrichment pipeline.
 *
 * Fills in missing or incomplete fields on crawled products:
 * - If name_zh or name_en is missing, copies from name
 * - Normalizes description (truncates if too long, strips whitespace)
 * - Infers category from tags if missing
 * - Ensures tags array is not empty
 *
 * This pipeline runs after deduplication and before scoring.
 */
import { CrawledProduct } from '../types.js';

/**
 * Maximum length for the description field.
 */
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Enrich a list of crawled products with missing information.
 *
 * @param products - Products to enrich
 * @returns Enriched products (same array reference, mutated in place)
 */
export function enrich(products: CrawledProduct[]): CrawledProduct[] {
  for (const product of products) {
    enrichSlug(product);
    enrichName(product);
    enrichDescription(product);
    enrichContentType(product);
    enrichCategory(product);
    enrichTags(product);
  }
  return products;
}

/**
 * Generate a URL-safe slug from the product name if not already set.
 * Includes source suffix and a short hash to avoid collisions.
 */
function enrichSlug(product: CrawledProduct): void {
  if (!product.slug) {
    const base = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40); // Limit length
    // Create a short hash from name + source + website_url for uniqueness
    const hashInput = `${product.name}-${product.source}-${product.website_url || ''}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const shortHash = Math.abs(hash).toString(36).substring(0, 6);
    product.slug = `${base}-${product.source}-${shortHash}`;
  }
}

/**
 * Ensure name_en and name_zh are set.
 * If name_zh is missing, tries to detect if name contains Chinese characters.
 * Otherwise copies name to both name_en and name_zh as fallbacks.
 */
function enrichName(product: CrawledProduct): void {
  // If name_en is not set, copy from name
  if (!product.name_en) {
    product.name_en = product.name;
  }

  // If name_zh is not set, check if name contains Chinese characters
  if (!product.name_zh) {
    if (containsChinese(product.name)) {
      product.name_zh = product.name;
    }
    // If no Chinese characters, leave name_zh undefined
    // (it can be filled in later by a translation service if needed)
  }
}

/**
 * Normalize and truncate the description.
 * - Trim leading/trailing whitespace
 * - Truncate to MAX_DESCRIPTION_LENGTH characters
 * - Ensure description is not empty (fallback to name)
 */
function enrichDescription(product: CrawledProduct): void {
  let description = product.description.trim();

  if (!description) {
    description = product.name;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    description = description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + '...';
  }

  product.description = description;
}

/**
 * Classify content as 'product' or 'news' based on title and description.
 * News articles typically discuss industry events, not specific tools/products.
 */
function enrichContentType(product: CrawledProduct): void {
  // If already set, keep it
  if (product.content_type) return;

  const text = `${product.name} ${product.description}`.toLowerCase();

  // Strong news indicators in title
  const newsPatterns = [
    // Company internal/management news
    /\b(layoff|firing|resign|quit|internal|employees?|staff|workforce|restructur)\b/i,
    /\b(acquires?|acquisition|merger|buyout|deal)\b/i,
    /\b(funding|raises?|raised|series [a-c]|valuation|invest)\b/i,
    /\b(sues?|lawsuit|legal|regulation|regulatory|ban|ban)\b/i,
    /\b(controversy|scandal|backlash|criticism|complaint)\b/i,

    // Industry analysis/opinion
    /\b(why |how |opinion|analysis|editorial|commentary|predict)\b/i,
    /\b(future of|state of|trend|landscape|market)\b/i,
    /\b(interview|q&a|profile|story|report)\b/i,

    // Event coverage
    /\b(conference|summit|event|keynote|announce)\b.*\b(day|week|recap|highlights?)\b/i,
    /\bCES\b.*\b(2025|2026)\b/i,
    /\b(GTC|WWDC|Google\s+I\/O|re:MARS)\b/i,

    // Policy/governance
    /\b(EU|US|China|government|policy|law|act|bill)\b.*\b(AI|artificial intelligence)\b/i,
    /\b(safety|alignment|ethics|bias|fairness)\b.*\b(report|study|research)\b/i,

    // Meta-commentary about companies
    /\b(OpenAI|Google|Meta|Microsoft|Anthropic)\b.*\b(says|announces|plans|strategy|internal)\b/i,
  ];

  // Strong product indicators
  const productPatterns = [
    // Launch/release language
    /\b(launch|launches|launched|release|released|releases)\b/i,
    /\b(introduce|introduces|introduced|unveil|unveils|unveiled)\b/i,
    /\b(now available|now live|just launched|just released)\b/i,
    /\b(new tool|new app|new platform|new service|new API|new model)\b/i,

    // Product-specific language
    /\b(v\d+\.\d+|version \d+|update|upgrade)\b/i,
    /\b(free|open.?source|pricing|plan|tier|subscription)\b/i,
    /\b(sign up|get started|try it|download|install)\b/i,
    /\b(demo|tutorial|guide|documentation|docs)\b/i,

    // Technical product details
    /\b(API|SDK|CLI|plugin|extension|integration)\b/i,
    /\b(docker|npm|pip|brew|install)\b/i,
    /\b(github\.com|npmjs\.com|pypi\.org)\b/i,
  ];

  // Count matches
  const newsScore = newsPatterns.filter(p => p.test(text)).length;
  const productScore = productPatterns.filter(p => p.test(text)).length;

  // Check if URL points to a product
  const hasProductUrl = product.website_url && (
    product.website_url.includes('github.com') ||
    product.website_url.includes('npmjs.com') ||
    product.website_url.includes('pypi.org') ||
    product.website_url.includes('huggingface.co') ||
    product.website_url.includes('producthunt.com')
  );

  // Decision logic
  if (newsScore > productScore && newsScore >= 2) {
    product.content_type = 'news';
  } else if (productScore > newsScore || hasProductUrl) {
    product.content_type = 'product';
  } else if (newsScore >= 2) {
    product.content_type = 'news';
  } else {
    // Default to product for sources that are product-focused
    const productSources = ['producthunt', 'github', 'npm', 'huggingface'];
    product.content_type = productSources.includes(product.source) ? 'product' : 'product';
  }
}

/**
 * Infer category from tags if it's set to "Other" or empty.
 */
function enrichCategory(product: CrawledProduct): void {
  if (!product.category || product.category === 'Other') {
    const categoryFromTags = inferCategoryFromTags(product.tags);
    if (categoryFromTags) {
      product.category = categoryFromTags;
    }
  }
}

/**
 * Ensure tags array is not empty.
 * If empty, adds a default "ai" tag.
 */
function enrichTags(product: CrawledProduct): void {
  if (!product.tags || product.tags.length === 0) {
    product.tags = ['ai'];
  }

  // Ensure "ai" is always in the tags
  if (!product.tags.includes('ai')) {
    product.tags.push('ai');
  }
}

/**
 * Check if a string contains Chinese characters.
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Map common tags to category names.
 */
function inferCategoryFromTags(tags: string[]): string | null {
  const tagMap: Record<string, string> = {
    'llm': 'LLM',
    'gpt': 'LLM',
    'llama': 'LLM',
    'language-model': 'LLM',
    'image-generation': 'Image Generation',
    'diffusion': 'Image Generation',
    'stable-diffusion': 'Image Generation',
    'speech': 'Speech / Audio',
    'tts': 'Speech / Audio',
    'stt': 'Speech / Audio',
    'nlp': 'NLP',
    'agent': 'AI Agents',
    'autonomous': 'AI Agents',
    'robotics': 'Robotics',
    'robot': 'Robotics',
    'computer-vision': 'Computer Vision',
    'vision': 'Computer Vision',
  };

  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    if (tagMap[tagLower]) {
      return tagMap[tagLower];
    }
  }

  return null;
}
