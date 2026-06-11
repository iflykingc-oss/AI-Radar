/**
 * Tests for the arXiv source.
 *
 * Mocks global `fetch` with a representative Atom XML payload so we never
 * hit the real network. Verifies:
 *  - the source hits the right URL with the right query params
 *  - the Atom XML is parsed by fast-xml-parser
 *  - entries are mapped to CrawledProduct with source="arxiv"
 *  - the primary_category drives the category field
 *  - arXiv IDs (with optional version suffix) are extracted from the abs URL
 *  - malformed payloads return [] without throwing
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArxivSource } from '../src/sources/arxiv.js';
import { arxivLimiter, globalLimiter } from '../src/utils/rate-limiter.js';

const SAMPLE_ATOM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:arxiv="http://arxiv.org/schemas/atom">
  <link href="http://arxiv.org/api/query?search_query=..." rel="self"/>
  <title type="html">ArXiv Query: search_query=cat:cs.AI</title>
  <id>http://arxiv.org/api/query</id>
  <updated>2024-05-15T00:00:00Z</updated>

  <entry>
    <id>http://arxiv.org/abs/2401.01234v1</id>
    <title>Sample Paper on Transformer Efficiency</title>
    <summary>We propose a new efficient transformer architecture for LLMs that reduces compute by 40%.</summary>
    <published>2024-05-10T00:00:00Z</published>
    <updated>2024-05-10T00:00:00Z</updated>
    <author><name>Alice Researcher</name></author>
    <category term="cs.CL" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.LG" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:primary_category term="cs.CL"/>
  </entry>

  <entry>
    <id>http://arxiv.org/abs/2402.99999v2</id>
    <title>Multimodal Diffusion for Video Generation</title>
    <summary>We present a diffusion-based approach to text-to-video generation with a focus on diffusion models and RAG-style conditioning.</summary>
    <published>2024-05-09T00:00:00Z</published>
    <updated>2024-05-09T00:00:00Z</updated>
    <author><name>Bob Author</name></author>
    <author><name>Carol Author</name></author>
    <category term="cs.CV" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:primary_category term="cs.CV"/>
  </entry>

  <entry>
    <id>http://arxiv.org/abs/2403.55555</id>
    <title>Reinforcement Learning for Multi-Agent Coordination</title>
    <summary>A new reinforcement-learning framework for agent coordination in dynamic environments.</summary>
    <published>2024-05-08T00:00:00Z</published>
    <updated>2024-05-08T00:00:00Z</updated>
    <author><name>Dana Author</name></author>
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.MA" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:primary_category term="cs.AI"/>
  </entry>
</feed>`;

describe('ArxivSource', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset the singleton limiters so prior tests do not drain the bucket
    // and the 12-second refill does not time out this suite.
    arxivLimiter.reset();
    globalLimiter.reset();

    fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith('http://export.arxiv.org/api/query')) {
        return new Response(SAMPLE_ATOM_XML, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hits export.arxiv.org with the expected query params', async () => {
    const source = new ArxivSource();
    await source.fetch();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('http://export.arxiv.org/api/query');
    // URLSearchParams URL-encodes the colons, so decode before asserting.
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('cat:cs.AI');
    expect(decoded).toContain('cat:cs.CL');
    expect(decoded).toContain('cat:cs.LV');
    expect(decoded).toContain('sortBy=submittedDate');
    expect(decoded).toContain('max_results=80');
  });

  it('parses Atom XML and maps entries to CrawledProduct', async () => {
    const source = new ArxivSource();
    const products = await source.fetch();
    expect(products.length).toBe(3);

    for (const p of products) {
      expect(p.source).toBe('arxiv');
      expect(p.pricing_model).toBe('open_source');
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.website_url).toMatch(/^https:\/\/arxiv\.org\/abs\//);
      expect(p.crawled_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('extracts the arXiv id (with version suffix) into the website_url', async () => {
    const source = new ArxivSource();
    const products = await source.fetch();
    const transformer = products.find((p) => p.name.includes('Transformer'));
    expect(transformer).toBeDefined();
    expect(transformer!.website_url).toBe('https://arxiv.org/abs/2401.01234v1');
  });

  it('maps primary_category to a human-readable category', async () => {
    const source = new ArxivSource();
    const products = await source.fetch();
    const byName = new Map(products.map((p) => [p.name, p] as const));

    const transformer = byName.get('Sample Paper on Transformer Efficiency');
    expect(transformer!.category).toBe('NLP'); // cs.CL → NLP

    const video = byName.get('Multimodal Diffusion for Video Generation');
    expect(video!.category).toBe('Computer Vision'); // cs.CV

    const agent = byName.get('Reinforcement Learning for Multi-Agent Coordination');
    expect(agent!.category).toBe('AI Research'); // cs.AI
  });

  it('derives tags from categories and title keywords', async () => {
    const source = new ArxivSource();
    const products = await source.fetch();
    const video = products.find((p) => p.name.includes('Multimodal Diffusion'));
    expect(video).toBeDefined();
    expect(video!.tags).toContain('cs.cv');
    expect(video!.tags.some((t) => t === 'diffusion' || t === 'multimodal')).toBe(true);
  });

  it('returns [] on HTTP error (failure isolation)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 503 })));
    const source = new ArxivSource();
    const products = await source.fetch();
    expect(products).toEqual([]);
  });

  it('returns [] on malformed XML without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<<<not xml>>>', { status: 200 })));
    const source = new ArxivSource();
    const products = await source.fetch();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(0);
  });

  it('returns [] on empty feed (no entries)', async () => {
    const emptyFeed = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(emptyFeed, { status: 200 })));
    const source = new ArxivSource();
    const products = await source.fetch();
    expect(products).toEqual([]);
  });

  it('truncates long titles gracefully', async () => {
    const longTitle = 'A'.repeat(250);
    const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:arxiv="http://arxiv.org/schemas/atom">
  <entry>
    <id>http://arxiv.org/abs/2401.00001</id>
    <title>${longTitle}</title>
    <summary>Short abstract.</summary>
    <published>2024-01-01T00:00:00Z</published>
    <updated>2024-01-01T00:00:00Z</updated>
    <author><name>X</name></author>
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:primary_category term="cs.AI"/>
  </entry>
</feed>`;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(xml, { status: 200 })));
    const source = new ArxivSource();
    const products = await source.fetch();
    expect(products[0].name.length).toBeLessThanOrEqual(100);
    expect(products[0].name.endsWith('...')).toBe(true);
  });
});
