/**
 * arXiv data source.
 *
 * Polls the public arXiv API (Atom XML) for the most-recent AI/ML/LLM papers
 * in three categories:
 *
 *   cat:cs.AI  — Artificial Intelligence
 *   cat:cs.CL  — Computation and Language (NLP, LLMs)
 *   cat:cs.LV  — Computer Vision and Pattern Recognition
 *
 *   GET http://export.arxiv.org/api/query?searchQuery=
 *         cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LV
 *         &sortBy=submittedDate&sortOrder=descending&max_results=80
 *
 * Rate-limit budget: 5 req/min via `arxivLimiter` (arXiv is stricter).
 * Uses `fast-xml-parser` (already in deps, v4.4.1) for Atom XML parsing.
 *
 * Maps each `<entry>` to a `CrawledProduct`:
 *   - name           = first 100 chars of the entry title (trimmed)
 *   - description    = abstract (HTML stripped)
 *   - website_url    = arXiv abs page (e.g. https://arxiv.org/abs/2401.01234)
 *   - category       = derived from primary_category
 *   - pricing_model  = 'open_source' (research artifact)
 *   - tags           = derived from categories + title keywords
 */
import { XMLParser } from 'fast-xml-parser';
import { CrawledProduct } from '../types.js';
import { BaseSource } from './base.js';
import { arxivLimiter } from '../utils/rate-limiter.js';

const ARXIV_ENDPOINT = 'http://export.arxiv.org/api/query';
const ARXIV_MAX_RESULTS = 80;
const ARXIV_CATEGORIES = ['cs.AI', 'cs.CL', 'cs.LV'];

/**
 * Subset of an arXiv Atom XML entry. Only the fields we consume are typed.
 * The upstream XML uses the Atom namespace (xmlns="http://www.w3.org/2005/Atom").
 */
export interface ArxivEntryRaw {
  id: string; // e.g. "http://arxiv.org/abs/2401.01234v1"
  title: string;
  summary: string;
  published: string;
  updated: string;
  author: ArxivAuthor | ArxivAuthor[];
  category: ArxivCategory | ArxivCategory[];
  link?: ArxivLink | ArxivLink[];
  'arxiv:primary_category'?: { '@_term'?: string };
  'arxiv:doi'?: string;
  'arxiv:journal_ref'?: string;
}

export interface ArxivAuthor {
  name?: string;
}

export interface ArxivCategory {
  '@_term': string;
}

export interface ArxivLink {
  '@_href'?: string;
  '@_rel'?: string;
  '@_type'?: string;
}

interface ArxivFeed {
  feed?: {
    entry?: ArxivEntryRaw | ArxivEntryRaw[];
  };
}

export class ArxivSource extends BaseSource {
  readonly name = 'arxiv';

  private parser: XMLParser;

  constructor() {
    // 5 req/min: arXiv is slower and more polite to the public mirror.
    super(arxivLimiter);
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
  }

  async fetchRaw(): Promise<CrawledProduct[]> {
    const url = this.buildQueryUrl();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ai-radar-crawler/1.0 (+arxiv)' },
    });
    if (!response.ok) {
      throw new Error(`arXiv HTTP ${response.status}`);
    }
    const xml = await response.text();
    const parsed = this.parser.parse(xml) as ArxivFeed;
    const entries = this.extractEntries(parsed);
    return entries.map((entry) => this.mapEntry(entry));
  }

  // ---------- internals ----------

  private buildQueryUrl(): string {
    const search = ARXIV_CATEGORIES.map((c) => `cat:${c}`).join('+OR+');
    const params = new URLSearchParams({
      searchQuery: search,
      sortBy: 'submittedDate',
      sortOrder: 'descending',
      max_results: String(ARXIV_MAX_RESULTS),
    });
    return `${ARXIV_ENDPOINT}?${params.toString()}`;
  }

  private extractEntries(parsed: ArxivFeed): ArxivEntryRaw[] {
    const feed = parsed.feed;
    if (!feed) return [];
    const entries = feed.entry;
    if (Array.isArray(entries)) return entries;
    if (entries) return [entries];
    return [];
  }

  private mapEntry(entry: ArxivEntryRaw): CrawledProduct {
    const arxivId = this.extractArxivId(entry.id);
    const websiteUrl = arxivId
      ? `https://arxiv.org/abs/${arxivId}`
      : entry.id;

    const primaryCategory =
      entry['arxiv:primary_category']?.['@_term'] ?? this.firstCategory(entry);

    const category = this.deriveCategory(primaryCategory);
    const tags = this.buildTags(primaryCategory, entry);

    const name = this.deriveName(entry.title);
    const description = this.stripWhitespace(entry.summary ?? '');

    return {
      name,
      name_en: name,
      description: description || entry.title,
      website_url: websiteUrl,
      github_url: undefined,
      tags,
      category,
      source: 'arxiv',
      source_url: websiteUrl,
      crawled_at: new Date().toISOString(),
      github_stars: undefined,
      pricing_model: 'open_source',
    };
  }

  /**
   * arXiv IDs look like "http://arxiv.org/abs/2401.01234v1" or with a
   * "v" suffix; we keep the version because it's stable and serves as a
   * strong dedup key. Returns null if the URL is malformed.
   */
  private extractArxivId(idUrl: string): string | null {
    if (!idUrl) return null;
    const match = idUrl.match(/arxiv\.org\/abs\/([^"\s]+)/i);
    if (match) return match[1];
    // Some payloads store just the bare id; tolerate that.
    const bare = idUrl.match(/^\d{4}\.\d{4,5}(v\d+)?$/);
    if (bare) return bare[0];
    return null;
  }

  private firstCategory(entry: ArxivEntryRaw): string | undefined {
    const cat = entry.category;
    if (!cat) return undefined;
    if (Array.isArray(cat)) return cat[0]?.['@_term'];
    return cat['@_term'];
  }

  private deriveName(title: string): string {
    if (!title) return 'Untitled arXiv paper';
    // arXiv titles often contain newlines and excessive whitespace; collapse them.
    const cleaned = title.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 100) return cleaned;
    return cleaned.substring(0, 97) + '...';
  }

  private stripWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private deriveCategory(primaryCategory: string | undefined): string {
    if (!primaryCategory) return 'AI Research';
    const c = primaryCategory.toLowerCase();
    if (c === 'cs.cl' || c.includes('cl')) return 'NLP';
    if (c === 'cs.lv' || c.includes('cv') || c.includes('vision')) return 'Computer Vision';
    if (c === 'cs.ai' || c.includes('ai')) return 'AI Research';
    if (c.includes('lg') || c.includes('learning')) return 'Machine Learning';
    if (c.includes('stat')) return 'Statistics';
    return 'AI Research';
  }

  private buildTags(primaryCategory: string | undefined, entry: ArxivEntryRaw): string[] {
    const tags = new Set<string>();
    if (primaryCategory) tags.add(primaryCategory.toLowerCase());

    const cat = entry.category;
    if (cat) {
      const list = Array.isArray(cat) ? cat : [cat];
      for (const c of list) {
        if (c?.['@_term']) tags.add(c['@_term'].toLowerCase());
        if (tags.size >= 6) break;
      }
    }

    // Title-based keyword detection (low-cost, high-signal).
    const titleLower = (entry.title ?? '').toLowerCase();
    const summaryLower = (entry.summary ?? '').toLowerCase();
    const text = titleLower + ' ' + summaryLower;
    const keywords = [
      'llm', 'transformer', 'gpt', 'rag', 'agent', 'multimodal',
      'diffusion', 'reinforcement', 'fine-tuning', 'instruction',
    ];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.add(kw);
        if (tags.size >= 8) break;
      }
    }

    if (tags.size === 0) tags.add('ai');
    return Array.from(tags).slice(0, 8);
  }
}
