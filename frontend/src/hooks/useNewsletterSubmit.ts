'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeNewsletter } from '@/lib/api/newsletter';
import {
  ApiError,
  NewsletterFrequency,
  NewsletterLanguage,
  NewsletterSource,
  NewsletterSubscribeResponse,
} from '@/lib/api/types';

/**
 * Form-state result codes surfaced to the UI layer. These are
 * UI-friendly categorisations, not the raw API codes (use `errorCode`
 * if you need the numeric value).
 */
export type SubmitStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error';

export type ErrorKind =
  | 'invalid_email'
  | 'already_subscribed'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'unknown';

export interface UseNewsletterSubmitState {
  /** Current submission lifecycle. */
  status: SubmitStatus;
  /** Whether the user is currently rate-limited (separate from a one-off 4006). */
  rateLimited: boolean;
  /** Seconds remaining on the current rate-limit window. 0 when not limited. */
  rateLimitSeconds: number;
  /** User-facing error key (matches `newsletter.error_*` i18n entries). */
  errorKind: ErrorKind | null;
  /** Raw API code if available, otherwise `null`. */
  errorCode: number | null;
  /** Last successful response payload (e.g. for the dev confirm link). */
  lastResult: NewsletterSubscribeResponse | null;
}

export interface UseNewsletterSubmitResult extends UseNewsletterSubmitState {
  /**
   * Submit a new subscription. The promise resolves with the API payload
   * on success, or rejects with the `ApiError` on failure (also reflected
   * in `state` for component-level handling).
   */
  submit: (input: {
    email: string;
    frequency: NewsletterFrequency;
    language: NewsletterLanguage;
    source?: NewsletterSource;
  }) => Promise<NewsletterSubscribeResponse | null>;
  /** Manually reset the hook state to `idle` (e.g. after a success toast). */
  reset: () => void;
}

/**
 * Countdown tick rate. We re-derive the rate-limit seconds remaining
 * every second from the `lastRequestAt` timestamp; a tighter interval
 * would not improve accuracy (server clock is the source of truth).
 */
const COUNTDOWN_INTERVAL_MS = 1000;

/**
 * Map raw API error codes to UI-friendly error categories. Kept here
 * (not in the API client) so the translation layer can use them.
 */
function classifyError(code: number): ErrorKind {
  switch (code) {
    case 4000:
      return 'invalid_email';
    case 4001:
      return 'already_subscribed';
    case 4006:
      return 'rate_limit';
    case 5002:
    case 5001:
    case 5000:
      return 'server';
    default:
      return 'unknown';
  }
}

/**
 * `useNewsletterSubmit` — React hook for submitting the newsletter form.
 *
 * Behaviour:
 * - Tracks `submitting | success | error` lifecycle states.
 * - On `4006` (rate limit), starts a 60-second cooldown countdown based on
 *   the timestamp the last request was sent. The button stays disabled
 *   while the countdown is > 0.
 * - On `4001` (already subscribed), surfaces a friendly "you're already
 *   on the list" message — the API is idempotent so this is the expected
 *   re-submit behaviour (PRD hard constraint #5).
 *
 * SSR safe: all state is initialised to safe defaults; no `window` access
 * during render.
 *
 * @example
 * ```tsx
 * const { submit, status, rateLimitSeconds, errorKind } = useNewsletterSubmit();
 *
 * const onSubmit = async (e: FormEvent) => {
 *   e.preventDefault();
 *   const result = await submit({ email, frequency: 'weekly', language: 'en' });
 *   if (result) toast({ type: 'success', ... });
 * };
 * ```
 */
export function useNewsletterSubmit(): UseNewsletterSubmitResult {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [lastResult, setLastResult] =
    useState<NewsletterSubscribeResponse | null>(null);

  // Track the last request timestamp so the countdown derives from a
  // stable source (avoids drift from React re-renders). Stored in a ref
  // so the interval callback can read it without re-subscribing.
  const lastRequestAtRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup the countdown interval on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const stopCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRateLimited(false);
    setRateLimitSeconds(0);
  }, []);

  const startCountdown = useCallback(
    (fromSeconds: number) => {
      stopCountdown();
      setRateLimited(true);
      setRateLimitSeconds(fromSeconds);
      lastRequestAtRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - lastRequestAtRef.current) / 1000,
        );
        const remaining = Math.max(0, fromSeconds - elapsed);
        setRateLimitSeconds(remaining);
        if (remaining <= 0) {
          stopCountdown();
        }
      }, COUNTDOWN_INTERVAL_MS);
    },
    [stopCountdown],
  );

  const submit = useCallback(
    async (input: {
      email: string;
      frequency: NewsletterFrequency;
      language: NewsletterLanguage;
      source?: NewsletterSource;
    }): Promise<NewsletterSubscribeResponse | null> => {
      // Guard: don't fire while a previous request is in flight or while
      // the user is rate-limited.
      if (status === 'submitting' || rateLimited) {
        return null;
      }

      setStatus('submitting');
      setErrorKind(null);
      setErrorCode(null);
      lastRequestAtRef.current = Date.now();

      try {
        const result = await subscribeNewsletter({
          email: input.email.trim().toLowerCase(),
          frequency: input.frequency,
          language: input.language,
          source: input.source,
        });
        setLastResult(result);
        setStatus('success');
        return result;
      } catch (err) {
        if (err instanceof ApiError) {
          const kind = classifyError(err.code);
          setErrorKind(kind);
          setErrorCode(err.code);
          if (kind === 'rate_limit') {
            // Use the server-reported retry hint when present; fall back
            // to the client-side 60s default.
            const retryAfter =
              typeof (err as ApiError & { data?: { retry_after_seconds?: number } })
                .data === 'object' &&
              (err as ApiError & { data?: { retry_after_seconds?: number } }).data
                ?.retry_after_seconds !== undefined
                ? (err as ApiError & { data?: { retry_after_seconds?: number } }).data!
                    .retry_after_seconds!
                : 60;
            startCountdown(retryAfter);
          }
        } else {
          // Network error, JSON parse error, etc.
          setErrorKind('network');
          setErrorCode(null);
        }
        setStatus('error');
        return null;
      }
    },
    [status, rateLimited, startCountdown],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorKind(null);
    setErrorCode(null);
    stopCountdown();
  }, [stopCountdown]);

  return {
    status,
    rateLimited,
    rateLimitSeconds,
    errorKind,
    errorCode,
    lastResult,
    submit,
    reset,
  };
}

export default useNewsletterSubmit;
