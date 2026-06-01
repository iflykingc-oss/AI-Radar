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
    enrichName(product);
    enrichDescription(product);
    enrichCategory(product);
    enrichTags(product);
  }
  return products;
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
