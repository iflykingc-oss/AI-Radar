/**
 * Hugging Face data source.
 *
 * Uses the Hugging Face API to fetch trending models.
 *
 * API docs: https://huggingface.co/docs/hub/api
 */
import { CrawledProduct, DataSource } from '../types.js';

const HF_API = 'https://huggingface.co/api/models';

const MODEL_FILTERS = [
  'text-generation',
  'text2text-generation',
  'text-to-image',
  'image-to-text',
  'automatic-speech-recognition',
  'text-to-speech',
  'fill-mask',
  'sentence-similarity',
  'question-answering',
  'summarization',
  'translation',
];

const MAX_PER_FILTER = 10;

export class HuggingFaceSource implements DataSource {
  readonly name = 'huggingface';

  async fetch(): Promise<CrawledProduct[]> {
    try {
      console.log(`[${this.name}] Fetching trending models from Hugging Face...`);

      const products: CrawledProduct[] = [];
      const seen = new Set<string>();

      for (const filter of MODEL_FILTERS) {
        try {
          const url = `${HF_API}?sort=trending&limit=${MAX_PER_FILTER}&filter=${filter}`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'AIRadarBot/1.0' },
          });
          clearTimeout(timeout);

          if (!response.ok) continue;

          const models = await response.json() as any[];
          if (!Array.isArray(models)) continue;

          for (const model of models) {
            const product = this.extractProduct(model);
            if (product && !seen.has(product.website_url)) {
              seen.add(product.website_url);
              products.push(product);
            }
          }
        } catch {
          // Skip failed filter
        }
      }

      console.log(`[${this.name}] Extracted ${products.length} models.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  private extractProduct(model: any): CrawledProduct | null {
    const id = model.id || '';
    const author = model.author || '';
    const pipelineTag = model.pipeline_tag || '';
    const tags = model.tags || [];
    const downloads = model.downloads || 0;
    const likes = model.likes || 0;
    const lastModified = model.lastModified || '';

    if (!id) return null;

    // Only include models with decent engagement
    if (downloads < 1000 && likes < 10) return null;

    const name = id.includes('/') ? id.split('/').pop() : id;
    const url = `https://huggingface.co/${id}`;

    const category = this.deriveCategory(pipelineTag, tags, id);
    const productTags = this.extractTags(pipelineTag, tags, id);

    return {
      name: name || id,
      slug: '', // Will be enriched
      description: `Hugging Face model by ${author}. Pipeline: ${pipelineTag}. Downloads: ${downloads.toLocaleString()}, Likes: ${likes}.`,
      website_url: url,
      tags: productTags,
      category,
      source: 'rss', // Use 'rss' as source type
      source_url: url,
      crawled_at: new Date().toISOString(),
      pricing_model: tags.includes('open_source') ? 'open_source' : 'free',
    };
  }

  private deriveCategory(pipelineTag: string, tags: string[], id: string): string {
    const text = (pipelineTag + ' ' + tags.join(' ') + ' ' + id).toLowerCase();

    if (text.includes('text-generation') || text.includes('text2text') || text.includes('llm')) {
      return 'LLM';
    }
    if (text.includes('text-to-image') || text.includes('image-to-text') || text.includes('diffusion') || text.includes('vision')) {
      return 'AI Image';
    }
    if (text.includes('speech') || text.includes('audio') || text.includes('tts') || text.includes('asr')) {
      return 'AI Audio';
    }
    if (text.includes('question-answering') || text.includes('summarization') || text.includes('translation')) {
      return 'LLM';
    }
    if (text.includes('sentence-similarity') || text.includes('embedding') || text.includes('retrieval')) {
      return 'AI Infra';
    }
    if (text.includes('robotics') || text.includes('rl')) {
      return 'AI Agents';
    }
    return 'AI Tools';
  }

  private extractTags(pipelineTag: string, tags: string[], id: string): string[] {
    const result: string[] = ['huggingface'];

    if (pipelineTag) result.push(pipelineTag);

    const relevantTags = tags
      .filter(t => !t.startsWith('transformers') && !t.startsWith('pytorch') && !t.startsWith('tensorflow'))
      .slice(0, 3);

    result.push(...relevantTags);

    return result.slice(0, 5);
  }
}
