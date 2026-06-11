/**
 * Base class for crawler data sources.
 *
 * P6 principle (phase-f-w2-architecture.md §3): "Crawler 扩源零侵入 — 6 源共用同一 BaseSource 抽象".
 * Concrete sources extend `BaseSource` and inherit the rate-limiter handshake:
 * every `fetch()` is wrapped in `acquire()` / `recordSuccess()` / `recordFailure()`.
 *
 * The four W1 sources (producthunt, github, hackernews, rss) continue to
 * implement `DataSource` directly and are unchanged — that keeps the W1
 * regression window intact. New W2 sources (huggingface, arxiv) extend this
 * `BaseSource` to opt in to rate-limit handling.
 */
import { CrawledProduct, DataSource } from '../types.js';
import { RateLimiter, globalLimiter } from '../utils/rate-limiter.js';

export abstract class BaseSource implements DataSource {
  public abstract readonly name: string;

  /**
   * Per-source rate limiter. Override in the subclass for source-specific
   * budgets (e.g. arXiv uses a slower limiter). Defaults to `globalLimiter`
   * (10 req/min) so any forgotten override is a safe fallback.
   */
  protected limiter: RateLimiter;

  constructor(limiter?: RateLimiter) {
    this.limiter = limiter ?? globalLimiter;
  }

  /**
   * Fetch products from the upstream API.
   *
   * Subclasses should implement `fetchRaw()` and return a `CrawledProduct[]`.
   * The default `fetch()` here wraps it with the rate-limit handshake and
   * a try/catch that returns `[]` on failure (failure isolation — see
   * phase-f-w2-architecture.md §9.5).
   */
  abstract fetchRaw(): Promise<CrawledProduct[]>;

  /**
   * Public entry-point used by `index.ts`. Always returns an array — never
   * throws — so a single source failure cannot block the other 5 sources.
   */
  async fetch(): Promise<CrawledProduct[]> {
    try {
      await this.limiter.acquire(this.name);
    } catch (error) {
      // SourceExhausted or other limiter-level rejection: skip this run.
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Skipped: ${message}`);
      return [];
    }

    try {
      const products = await this.fetchRaw();
      this.limiter.recordSuccess();
      console.log(`[${this.name}] Fetched ${products.length} product(s).`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      try {
        this.limiter.recordFailure(this.name);
      } catch (innerError) {
        // SourceExhausted — already logged by the limiter, just keep going.
        const innerMsg = innerError instanceof Error ? innerError.message : String(innerError);
        console.error(`[${this.name}] ${innerMsg}`);
      }
      return [];
    }
  }
}
