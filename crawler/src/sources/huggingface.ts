/**
 * HuggingFace data source.
 *
 * Fetches the most-downloaded models and trending Spaces from the public
 * HuggingFace Hub API (no authentication required, per P10).
 *
 *   GET https://huggingface.co/api/models?sort=downloads&direction=-1&limit=100
 *   GET https://huggingface.co/api/spaces?sort=trending&direction=-1&limit=30
 *
 * Rate-limit budget: 10 req/min via `globalLimiter`.
 * Maps to `CrawledProduct`:
 *   - models → `pricing_model = 'open_source'`, `category` from pipeline tags
 *   - spaces → `pricing_model = 'free'`,         `category` = 'AI Demos'
 *
 * No new npm packages are required — uses global `fetch` (Node 20+).
 */
import { CrawledProduct } from '../types.js';
import { BaseSource } from './base.js';
import { globalLimiter } from '../utils/rate-limiter.js';

const HF_API_BASE = 'https://huggingface.co/api';

const MODELS_LIMIT = 100;
const SPACES_LIMIT = 30;

/**
 * Raw shape of one entry from `/api/models`. Only the fields we actually
 * consume are typed — the upstream payload has ~30 fields and is permissive.
 */
export interface HuggingFaceModelRaw {
  id: string; // e.g. "meta-llama/Llama-3-8B"
  downloads?: number;
  likes?: number;
  tags?: string[];
  pipeline_tag?: string;
  last_modified?: string;
  gated?: boolean | string;
  private?: boolean;
  disabled?: boolean;
}

/**
 * Raw shape of one entry from `/api/spaces`.
 */
export interface HuggingFaceSpaceRaw {
  id: string; // e.g. "openai/chat-ui"
  likes?: number;
  tags?: string[];
  last_modified?: string;
  private?: boolean;
  disabled?: boolean;
}

export class HuggingFaceSource extends BaseSource {
  readonly name = 'huggingface';

  constructor() {
    // 10 req/min is the public HF budget.
    super(globalLimiter);
  }

  /**
   * Fetch + parse + map. Inherits rate-limit / failure-isolation from BaseSource.
   *
   * The whole body is wrapped in try/catch so that any unexpected error
   * (e.g. a mapper blowing up on a malformed payload) is logged and
   * surfaced as an empty result — a single bad HuggingFace entry must
   * never block the other 5 crawler sources.
   */
  async fetchRaw(): Promise<CrawledProduct[]> {
    try {
      const [modelsResult, spacesResult] = await Promise.allSettled([
        this.fetchModels(),
        this.fetchSpaces(),
      ]);

      const products: CrawledProduct[] = [];
      if (modelsResult.status === 'fulfilled') {
        products.push(...this.mapModels(modelsResult.value));
      } else {
        console.warn(
          `[${this.name}] models fetch failed: ${
            modelsResult.reason instanceof Error
              ? modelsResult.reason.message
              : String(modelsResult.reason)
          }`,
        );
      }
      if (spacesResult.status === 'fulfilled') {
        products.push(...this.mapSpaces(spacesResult.value));
      } else {
        console.warn(
          `[${this.name}] spaces fetch failed: ${
            spacesResult.reason instanceof Error
              ? spacesResult.reason.message
              : String(spacesResult.reason)
          }`,
        );
      }
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] fetchRaw failed: ${message}`);
      return [];
    }
  }

  // ---------- upstream fetchers ----------

  private async fetchModels(): Promise<HuggingFaceModelRaw[]> {
    const url = `${HF_API_BASE}/models?sort=downloads&direction=-1&limit=${MODELS_LIMIT}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ai-radar-crawler/1.0 (+huggingface)' },
    });
    if (!response.ok) {
      throw new Error(`HF models HTTP ${response.status}`);
    }
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error('HF models payload is not an array');
    }
    return data as HuggingFaceModelRaw[];
  }

  private async fetchSpaces(): Promise<HuggingFaceSpaceRaw[]> {
    const url = `${HF_API_BASE}/spaces?sort=trending&direction=-1&limit=${SPACES_LIMIT}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ai-radar-crawler/1.0 (+huggingface)' },
    });
    if (!response.ok) {
      throw new Error(`HF spaces HTTP ${response.status}`);
    }
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error('HF spaces payload is not an array');
    }
    return data as HuggingFaceSpaceRaw[];
  }

  // ---------- mappers ----------

  private mapModels(raws: HuggingFaceModelRaw[]): CrawledProduct[] {
    const crawledAt = new Date().toISOString();
    const products: CrawledProduct[] = [];

    for (const raw of raws) {
      if (!raw.id || raw.private || raw.disabled) continue;
      if (raw.gated === true || raw.gated === 'auto') continue;

      const tags = this.normalizeTags(raw.tags ?? []);
      const category = this.deriveCategoryFromPipeline(raw.pipeline_tag, tags);
      const websiteUrl = `https://huggingface.co/${raw.id}`;
      const description = this.buildModelDescription(raw);

      products.push({
        name: raw.id,
        name_en: raw.id,
        description,
        website_url: websiteUrl,
        github_url: undefined, // not exposed by the models endpoint
        tags,
        category,
        source: 'huggingface',
        source_url: websiteUrl,
        crawled_at: crawledAt,
        github_stars: raw.likes,
        pricing_model: 'open_source',
      });
    }
    return products;
  }

  private mapSpaces(raws: HuggingFaceSpaceRaw[]): CrawledProduct[] {
    const crawledAt = new Date().toISOString();
    const products: CrawledProduct[] = [];

    for (const raw of raws) {
      if (!raw.id || raw.private || raw.disabled) continue;

      const tags = this.normalizeTags(raw.tags ?? []);
      const websiteUrl = `https://huggingface.co/spaces/${raw.id}`;
      const description = `HuggingFace Space — ${raw.id}`;

      products.push({
        name: raw.id,
        name_en: raw.id,
        description,
        website_url: websiteUrl,
        github_url: undefined,
        tags,
        category: 'AI Demos',
        source: 'huggingface',
        source_url: websiteUrl,
        crawled_at: crawledAt,
        github_stars: raw.likes,
        pricing_model: 'free',
      });
    }
    return products;
  }

  private buildModelDescription(raw: HuggingFaceModelRaw): string {
    const parts: string[] = [];
    if (raw.pipeline_tag) {
      parts.push(`Pipeline: ${raw.pipeline_tag}`);
    }
    if (typeof raw.downloads === 'number') {
      parts.push(`${raw.downloads.toLocaleString('en-US')} downloads`);
    }
    if (typeof raw.likes === 'number') {
      parts.push(`${raw.likes} likes`);
    }
    if (parts.length === 0) {
      return `HuggingFace model — ${raw.id}`;
    }
    return `HuggingFace model — ${parts.join(' · ')}`;
  }

  private normalizeTags(tags: string[]): string[] {
    // Tags are lowercase strings upstream; cap at 10 and de-dup.
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of tags) {
      const lower = t.toLowerCase();
      if (!lower || seen.has(lower)) continue;
      seen.add(lower);
      out.push(lower);
      if (out.length >= 10) break;
    }
    return out;
  }

  private deriveCategoryFromPipeline(
    pipelineTag: string | undefined,
    tags: string[],
  ): string {
    if (pipelineTag) {
      const t = pipelineTag.toLowerCase();
      if (t.includes('text-generation') || t.includes('text2text') || t === 'summarization') {
        return 'LLM';
      }
      if (t.includes('image') || t.includes('diffusion') || t.includes('image-to-image')) {
        return 'Image Generation';
      }
      if (t.includes('text-to-speech') || t.includes('audio') || t.includes('speech')) {
        return 'Speech / Audio';
      }
      if (t.includes('translation')) {
        return 'Translation';
      }
      if (t.includes('text-classification') || t.includes('token-classification')) {
        return 'NLP';
      }
      if (t.includes('reinforcement-learning') || t.includes('agent')) {
        return 'AI Agents';
      }
    }

    // Fallback: try tag-based classification.
    const tagText = tags.join(' ').toLowerCase();
    if (tagText.includes('llm') || tagText.includes('chat') || tagText.includes('instruct')) {
      return 'LLM';
    }
    if (tagText.includes('image') || tagText.includes('vision')) {
      return 'Image Generation';
    }
    if (tagText.includes('audio') || tagText.includes('speech')) {
      return 'Speech / Audio';
    }
    return 'Other';
  }
}
