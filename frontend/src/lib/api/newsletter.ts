'use client';

import {
  ApiEnvelope,
  ApiError,
  NewsletterSubscribeRequest,
  NewsletterSubscribeResponse,
} from './types';

/**
 * Newsletter API client wrapper (per `docs/phase-f-w2-architecture.md` §6 T-3).
 *
 * Thin fetch helper used by `useNewsletterSubmit`. Returns the unwrapped
 * `data` payload on success and throws `ApiError` on non-zero `code`.
 *
 * Error code mapping (matches `subscribe` route handler):
 *   4000 -> validation error (invalid email, bad frequency, malformed body)
 *   4001 -> already subscribed & active (idempotent re-submit)
 *   4002 -> daily plan requires Starter+ (future server-side gate)
 *   4006 -> rate limit exceeded; `data.retry_after_seconds` carries the cooldown
 *   5002 -> server / database error
 */
export async function subscribeNewsletter(
  payload: NewsletterSubscribeRequest,
): Promise<NewsletterSubscribeResponse> {
  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  let envelope: ApiEnvelope<NewsletterSubscribeResponse> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<NewsletterSubscribeResponse>;
  } catch {
    // Non-JSON body (unlikely, but possible if a proxy or middleware
    // returns HTML). Surface as a 5002 so the UI can show a generic error.
    throw new ApiError(5002, 'Invalid response from server', response.status);
  }

  if (!envelope) {
    throw new ApiError(5002, 'Empty response from server', response.status);
  }

  if (envelope.code !== 0 || !envelope.data) {
    throw new ApiError(
      envelope.code,
      envelope.message || 'Unknown error',
      response.status,
    );
  }

  return envelope.data;
}
