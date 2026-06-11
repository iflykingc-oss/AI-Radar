/**
 * Tests for the token-bucket rate limiter.
 *
 * Verifies:
 *  - capacity is respected
 *  - `acquire()` blocks until a token is available
 *  - `recordSuccess()` resets the failure counter
 *  - `recordFailure()` escalates the backoff window exponentially
 *  - after MAX_FAILURES consecutive failures, `acquire()` throws SourceExhausted
 *    and `recordFailure()` throws the same
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, SourceExhausted, globalLimiter, arxivLimiter } from '../src/utils/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    // Tight, fast limiter for unit tests: capacity 3, refill 50 ms.
    limiter = new RateLimiter(3, 50);
  });

  it('starts with a full bucket', () => {
    expect(limiter.capacity).toBe(3);
    expect(limiter.state.tokens).toBe(3);
    expect(limiter.state.consecutiveFailures).toBe(0);
  });

  it('consumes one token per acquire()', async () => {
    await limiter.acquire('test');
    expect(limiter.state.tokens).toBe(2);
    await limiter.acquire('test');
    expect(limiter.state.tokens).toBe(1);
    await limiter.acquire('test');
    expect(limiter.state.tokens).toBe(0);
  });

  it('waits for refill when the bucket is empty', async () => {
    const start = Date.now();
    // Drain the bucket.
    for (let i = 0; i < 3; i++) await limiter.acquire('test');
    // The 4th acquire should block ~50 ms (one refill interval).
    await limiter.acquire('test');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // tolerate a tiny clock skew
  });

  it('recordSuccess() resets the failure counter', async () => {
    limiter.recordFailure('test');
    limiter.recordFailure('test');
    expect(limiter.state.consecutiveFailures).toBe(2);
    limiter.recordSuccess();
    expect(limiter.state.consecutiveFailures).toBe(0);
    expect(limiter.state.backoffUntil).toBe(0);
  });

  it('recordFailure() escalates the backoff window exponentially', () => {
    const baseline = Date.now();
    limiter.recordFailure('test');
    const firstBackoff = limiter.state.backoffUntil - baseline;
    expect(firstBackoff).toBeGreaterThanOrEqual(60_000 - 100); // 1 min ±
    expect(firstBackoff).toBeLessThanOrEqual(60_000 + 500);

    limiter.recordFailure('test');
    const secondBackoff = limiter.state.backoffUntil - baseline;
    expect(secondBackoff).toBeGreaterThanOrEqual(120_000 - 100); // 2 min

    limiter.recordFailure('test');
    const thirdBackoff = limiter.state.backoffUntil - baseline;
    expect(thirdBackoff).toBeGreaterThanOrEqual(240_000 - 100); // 4 min

    limiter.recordFailure('test');
    const fourthBackoff = limiter.state.backoffUntil - baseline;
    expect(fourthBackoff).toBeGreaterThanOrEqual(480_000 - 100); // 8 min

    limiter.recordFailure('test');
    const fifthBackoff = limiter.state.backoffUntil - baseline;
    expect(fifthBackoff).toBeGreaterThanOrEqual(960_000 - 100); // 16 min
  });

  it('throws SourceExhausted on the 6th consecutive failure', () => {
    for (let i = 0; i < 5; i++) limiter.recordFailure('test');
    expect(() => limiter.recordFailure('test')).toThrow(SourceExhausted);
    // After exhaustion, acquire() should also throw.
    return expect(limiter.acquire('test')).rejects.toBeInstanceOf(SourceExhausted);
  });

  it('SourceExhausted carries the source name and failure count', async () => {
    try {
      for (let i = 0; i < 6; i++) limiter.recordFailure('my-source');
      throw new Error('expected SourceExhausted');
    } catch (e) {
      expect(e).toBeInstanceOf(SourceExhausted);
      const err = e as SourceExhausted;
      expect(err.sourceName).toBe('my-source');
      expect(err.failureCount).toBe(6);
    }
  });

  it('rejects invalid construction arguments', () => {
    expect(() => new RateLimiter(0, 1000)).toThrow();
    expect(() => new RateLimiter(10, 0)).toThrow();
    expect(() => new RateLimiter(-1, 1000)).toThrow();
  });

  it('reset() restores the bucket to full and clears the failure counter', () => {
    for (let i = 0; i < 3; i++) limiter.recordFailure('test');
    expect(limiter.state.consecutiveFailures).toBe(3);
    expect(limiter.state.backoffUntil).toBeGreaterThan(0);

    limiter.reset();

    expect(limiter.state.tokens).toBe(limiter.capacity);
    expect(limiter.state.consecutiveFailures).toBe(0);
    expect(limiter.state.backoffUntil).toBe(0);
  });

  it('skips acquire() while a backoff window is active', async () => {
    // Use a slow refill so the backoff dominates.
    const slow = new RateLimiter(2, 60_000);
    slow.recordFailure('test');
    await expect(slow.acquire('test')).rejects.toBeInstanceOf(SourceExhausted);
  });

  it('globalLimiter is configured for HF: 10 req/min', () => {
    expect(globalLimiter.capacity).toBe(10);
    expect(globalLimiter.refillIntervalMs).toBe(6_000);
  });

  it('arxivLimiter is configured for arXiv: 5 req/min', () => {
    expect(arxivLimiter.capacity).toBe(5);
    expect(arxivLimiter.refillIntervalMs).toBe(12_000);
  });
});
