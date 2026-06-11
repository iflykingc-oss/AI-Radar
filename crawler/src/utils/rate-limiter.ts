/**
 * Token-bucket rate limiter with exponential backoff on failure.
 *
 * Design (per architect's T-5 spec, see phase-f-w2-architecture.md §6):
 *  - capacity:    maximum tokens in the bucket
 *  - refillRateMs: how often (ms) a single token is added back
 *  - acquire():  blocks (async) until a token is available
 *  - recordSuccess(): clears the failure counter
 *  - recordFailure(): triggers exponential backoff (1/2/4/8/16 min)
 *                   throws `SourceExhausted` after 6 consecutive failures
 *                   (the source should be skipped for the rest of the day)
 *
 * Two pre-configured limiters are exported:
 *  - globalLimiter : 10 req/min (HuggingFace default — matches the public
 *                    rate-limit budget for unauthenticated traffic)
 *  - arxivLimiter  :  5 req/min (arXiv is stricter and slower)
 */
export class SourceExhausted extends Error {
  public readonly sourceName: string;
  public readonly failureCount: number;

  constructor(sourceName: string, failureCount: number) {
    super(
      `Source "${sourceName}" has failed ${failureCount} consecutive times; ` +
        `skipping the rest of the day (per exponential-backoff policy).`,
    );
    this.name = 'SourceExhausted';
    this.sourceName = sourceName;
    this.failureCount = failureCount;
  }
}

/**
 * Token-bucket rate limiter (async, single-process).
 */
export class RateLimiter {
  /** Bucket capacity (max tokens). */
  public readonly capacity: number;
  /** How often (ms) one token is added back. */
  public readonly refillIntervalMs: number;

  private tokens: number;
  private lastRefill: number;
  private consecutiveFailures: number = 0;
  /** Cooldown deadline (ms epoch). 0 = not in backoff. */
  private backoffUntil: number = 0;

  constructor(capacity: number, refillIntervalMs: number) {
    if (capacity <= 0) {
      throw new Error('RateLimiter capacity must be > 0');
    }
    if (refillIntervalMs <= 0) {
      throw new Error('RateLimiter refillIntervalMs must be > 0');
    }
    this.capacity = capacity;
    this.refillIntervalMs = refillIntervalMs;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Wait until a token is available, or until the current backoff window
   * expires. Throws `SourceExhausted` immediately if the source has already
   * been failed-out for the day.
   *
   * @param sourceName - human-readable name, used in error message
   */
  async acquire(sourceName: string = 'unknown'): Promise<void> {
    if (this.consecutiveFailures >= RateLimiter.MAX_FAILURES) {
      throw new SourceExhausted(sourceName, this.consecutiveFailures);
    }

    // If we're in a backoff window, wait it out (skip the source for this run).
    const now = Date.now();
    if (this.backoffUntil > now) {
      const waitMs = this.backoffUntil - now;
      console.warn(
        `[RateLimiter] ${sourceName}: in backoff, skipping for ${(waitMs / 1000).toFixed(0)}s`,
      );
      throw new SourceExhausted(sourceName, this.consecutiveFailures);
    }

    // Refill tokens based on elapsed time.
    this.refill();

    if (this.tokens < 1) {
      // Wait until the next refill slot.
      const elapsed = Date.now() - this.lastRefill;
      const waitMs = Math.max(0, this.refillIntervalMs - elapsed);
      await this.sleep(waitMs);
      this.refill();
    }

    if (this.tokens < 1) {
      // Should not happen after refill, but guard anyway.
      throw new Error(
        `RateLimiter for "${sourceName}" could not allocate a token after wait`,
      );
    }

    this.tokens -= 1;
  }

  /**
   * Record a successful call. Resets the failure counter.
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.backoffUntil = 0;
  }

  /**
   * Record a failed call. Increments the consecutive-failure counter
   * and sets the backoff window using `2^attempt` minutes.
   *
   * @throws SourceExhausted when failure count reaches MAX_FAILURES (6)
   */
  recordFailure(sourceName: string = 'unknown'): void {
    this.consecutiveFailures += 1;

    if (this.consecutiveFailures >= RateLimiter.MAX_FAILURES) {
      this.backoffUntil = Date.now() + 24 * 60 * 60 * 1000; // skip the rest of the day
      throw new SourceExhausted(sourceName, this.consecutiveFailures);
    }

    // 1, 2, 4, 8, 16 minutes (for attempts 1..5)
    const backoffMinutes = Math.pow(2, this.consecutiveFailures - 1);
    this.backoffUntil = Date.now() + backoffMinutes * 60 * 1000;

    console.warn(
      `[RateLimiter] ${sourceName}: failure #${this.consecutiveFailures}, ` +
        `backing off for ${backoffMinutes} minute(s) ` +
        `(until ${new Date(this.backoffUntil).toISOString()})`,
    );
  }

  /**
   * Read-only introspection (mostly for tests and observability).
   */
  get state(): {
    tokens: number;
    consecutiveFailures: number;
    backoffUntil: number;
    nextTokenAt: number;
  } {
    return {
      tokens: this.tokens,
      consecutiveFailures: this.consecutiveFailures,
      backoffUntil: this.backoffUntil,
      nextTokenAt: this.lastRefill + this.refillIntervalMs,
    };
  }

  /**
   * Reset the limiter to its initial state (full bucket, zero failures,
   * no backoff). Useful for:
   *   - unit tests that share a singleton limiter across cases
   *   - a daily cron restart that wants to clear the "skip rest of day"
   *     state from the previous run
   */
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.consecutiveFailures = 0;
    this.backoffUntil = 0;
  }

  /** Maximum consecutive failures before the source is skipped for the day. */
  public static readonly MAX_FAILURES = 6;

  // ---------- private helpers ----------

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    const refilled = Math.floor(elapsed / this.refillIntervalMs);
    if (refilled > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + refilled);
      this.lastRefill += refilled * this.refillIntervalMs;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (ms <= 0) {
        resolve();
        return;
      }
      setTimeout(resolve, ms);
    });
  }
}

// ---------- pre-configured limiters ----------

/**
 * HuggingFace / global default: 10 req/min ⇒ refill 1 token every 6 000 ms.
 */
export const globalLimiter = new RateLimiter(10, 6_000);

/**
 * arXiv: 5 req/min ⇒ refill 1 token every 12 000 ms.
 */
export const arxivLimiter = new RateLimiter(5, 12_000);
