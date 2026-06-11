import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/newsletter/subscribe
 * Body: { email, frequency?: 'daily'|'weekly'|'monthly', language?: 'en'|'zh', categories?: string[] }
 *
 * - Uses upsert on email conflict (partial unique idx is on
 *   unsubscribed_at IS NULL, see migration 003).
 * - Generates a UUID confirmation token; mock-emails the confirmation link
 *   via console.log.
 *
 * Response codes (per ADR-10 / T-3 spec):
 *   0    -> success (200 OK)
 *   4000 -> validation error (invalid email, bad frequency, malformed body)
 *   4001 -> already subscribed & active (idempotent re-submit; PRD hard constraint #5)
 *   4002 -> daily plan requires Starter+ (when server-side gating is enabled)
 *   4006 -> rate limit exceeded (60s cooldown per (ip, email) pair)
 *   5001 -> database/lookup failure
 *   5002 -> unexpected server error
 */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const VALID_FREQ = new Set(['daily', 'weekly', 'monthly']);
const VALID_CATEGORIES_MAX = 20;

// Rate limit: 1 subscribe per (ip, email) per 60 seconds. In-memory bucket;
// sufficient for W2 dev/mock — replace with Supabase-backed or Upstash in P0.5.
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitBucket = new Map<string, number>();

function rateLimitKey(request: NextRequest, email: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    (forwarded ? forwarded.split(',')[0]?.trim() : '') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return `${ip}::${email}`;
}

function isRateLimited(request: NextRequest, email: string): boolean {
  const key = rateLimitKey(request, email);
  const now = Date.now();
  const last = rateLimitBucket.get(key);
  if (last !== undefined && now - last < RATE_LIMIT_WINDOW_MS) {
    return true;
  }
  rateLimitBucket.set(key, now);
  // Opportunistic cleanup: drop entries older than the window so the
  // map does not grow unbounded during long-running dev sessions.
  if (rateLimitBucket.size > 500) {
    rateLimitBucket.forEach((ts, k) => {
      if (now - ts > RATE_LIMIT_WINDOW_MS) rateLimitBucket.delete(k);
    });
  }
  return false;
}

function rateLimitRetryAfterSeconds(request: NextRequest, email: string): number {
  const key = rateLimitKey(request, email);
  const last = rateLimitBucket.get(key);
  if (last === undefined) return 0;
  const elapsed = Date.now() - last;
  return Math.max(0, Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000));
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { code: 4000, data: null, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const email: string | undefined = body?.email;
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { code: 4000, data: null, message: 'email is required' },
        { status: 400 }
      );
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json(
        { code: 4000, data: null, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const frequency: string = body?.frequency ?? 'daily';
    if (!VALID_FREQ.has(frequency)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid frequency: ${frequency}` },
        { status: 400 }
      );
    }

    // Normalize language: accept 'en' | 'zh' only; default to 'en'.
    // This is the T-3 (P0) 1-line bug fix — previously hardcoded to 'en'.
    const language: 'en' | 'zh' = body?.language === 'zh' ? 'zh' : 'en';

    const categories: string[] = Array.isArray(body?.categories)
      ? body.categories.filter((c: any) => typeof c === 'string').slice(0, VALID_CATEGORIES_MAX)
      : [];

    // Duplicate-email check (4001) must run BEFORE the rate limit (4006).
    //
    // Reason: a user who is already subscribed and re-clicks "subscribe"
    // within the 60s rate-limit window should receive the idempotent
    // 4001 response (PRD hard constraint #5), not a transient 429.
    // The rate limit exists to throttle *fresh* subscription attempts
    // (spam / abuse), not legitimate re-clicks on an already-known email.
    //
    // Check existing record first. We use supabaseAdmin (service_role, bypasses
    // RLS) for this server-side lookup because:
    //   - RLS policy is FOR INSERT only (no SELECT for anon)
    //   - .maybeSingle() with RLS-filtered empty result returns PGRST116 (406)
    //     which supabase-js surfaces as a hard error, not a null data
    //   - The lookup needs to reliably see existing rows to distinguish
    //     "already subscribed" (4001) from "re-subscribe" (UPDATE) from
    //     "fresh subscribe" (INSERT)
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, email, frequency, confirmation_token, confirmed_at, unsubscribed_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupErr) {
      console.error('newsletter subscribe lookup error:', lookupErr);
      return NextResponse.json(
        { code: 5002, data: null, message: 'Failed to lookup subscription' },
        { status: 500 }
      );
    }

    // Idempotent duplicate detection (PRD hard constraint #5). If the
    // email is already on an *active* row, return 4001 immediately,
    // without consuming the rate-limit bucket. See the comment above
    // the lookup for why this branch must precede the rate limit.
    if (existing && !existing.unsubscribed_at) {
      return NextResponse.json(
        {
          code: 4001,
          data: {
            email: normalizedEmail,
            frequency: existing.frequency,
            already_subscribed: true,
          },
          message: 'This email is already subscribed.',
        },
        { status: 200 }
      );
    }

    // Rate limit check (4006). Applies only to *fresh* subscription
    // attempts (or re-activations of an unsubscribed row). Idempotent
    // re-clicks on an already-subscribed email are short-circuited
    // above and never touch the rate-limit bucket.
    if (isRateLimited(request, normalizedEmail)) {
      const retryAfter = rateLimitRetryAfterSeconds(request, normalizedEmail);
      return NextResponse.json(
        {
          code: 4006,
          data: { retry_after_seconds: retryAfter },
          message: `Rate limit exceeded; retry in ${retryAfter}s`,
        },
        { status: 429 }
      );
    }

    // Build a new confirmation token (and a row id, since we don't read back)
    const uuid =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const confirmationToken = uuid;

    // Build row payload. The DB has frequency check (daily|weekly); we
    // accept 'monthly' from API but coerce to 'weekly' if backend doesn't yet
    // support monthly (003 migration keeps daily|weekly only). Use 'weekly'
    // as a safe fallback so CHECK doesn't fail.
    const dbFrequency = frequency === 'monthly' ? 'weekly' : frequency;

    const row: any = {
      email: normalizedEmail,
      frequency: dbFrequency,
      language,
      confirmation_token: confirmationToken,
      unsubscribed_at: null,
      source: 'web',
    };
    if (categories.length > 0) {
      // No categories column in current schema; store in source for now.
      // (Future: add a categories TEXT[] column; safe to extend in P0.5)
      row.source = `web+${categories.slice(0, 5).join(',')}`;
    }

    // 003 migration uses PARTIAL unique index on email WHERE unsubscribed_at IS NULL.
    // Supabase upsert() requires a full UNIQUE constraint, not a partial index, so
    // we cannot use upsert(... { onConflict: 'email' }) here. Instead, branch on the
    // lookup result we already have:
    //   - existing ACTIVE row (unsubscribed_at IS NULL) -> 4001 (idempotent;
    //     covers both "confirmed" and "still-unconfirmed" cases; PRD hard
    //     constraint #5: re-submit same email must return code:4001)
    //   - existing UNSUBSCRIBED row                      -> 200 (re-subscribe;
    //     UPDATE clears the flag and re-issues a confirmation)
    //   - no existing row                                -> 201 (INSERT)
    // Status code: 201 for fresh INSERT, 200 for re-activate, 4001 for any
    // active duplicate (idempotent no-op).
    //
    // NOTE: We intentionally do NOT chain `.select().single()` after insert/update.
    // The supabase-js client auto-sets `Prefer: return=representation` when .select()
    // is chained, which makes PostgREST do a SELECT after the write. RLS on this
    // table is `FOR INSERT` only (no SELECT policy for anon), so that post-write
    // SELECT fails with 42501 and rolls back the whole request. Generating the id
    // in JS and skipping the read-back sidesteps this entirely. Final response is
    // built from JS-side data.
    let finalRow: any;
    let isNewSubscription = false;
    if (existing) {
      // NOTE: The active-duplicate branch (4001) is handled earlier,
      // before the rate-limit check. Reaching this point means the
      // existing row is *unsubscribed* — proceed with re-activation.

      // Re-subscribe (unsubscribed row): regen confirmation_token, update
      // frequency, clear unsubscribed_at. Use supabaseAdmin because RLS
      // has no UPDATE policy for anon.
      const updatePayload: any = {
        frequency: dbFrequency,
        confirmation_token: confirmationToken,
        source: row.source,
      };
      if (existing.unsubscribed_at) {
        updatePayload.unsubscribed_at = null;
      }
      const { error: updateErr } = await supabaseAdmin
        .from('newsletter_subscriptions')
        .update(updatePayload)
        .eq('id', existing.id);

      if (updateErr) {
        console.error('newsletter subscribe update error:', updateErr);
        return NextResponse.json(
          { code: 5002, data: null, message: 'Failed to reactivate subscription' },
          { status: 500 }
        );
      }
      finalRow = {
        id: existing.id,
        email: normalizedEmail,
        frequency: dbFrequency,
        confirmation_token: confirmationToken,
      };
    } else {
      // Fresh subscription: include the id we generated in JS.
      // Use supabaseAdmin for consistency (bypasses RLS, no Prefer header needed).
      row.id = uuid;
      const { error: insertErr } = await supabaseAdmin
        .from('newsletter_subscriptions')
        .insert(row);

      if (insertErr) {
        console.error('newsletter subscribe insert error:', insertErr);
        return NextResponse.json(
          { code: 5002, data: null, message: 'Failed to create subscription' },
          { status: 500 }
        );
      }
      finalRow = {
        id: uuid,
        email: normalizedEmail,
        frequency: dbFrequency,
        confirmation_token: confirmationToken,
      };
      isNewSubscription = true;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const confirmLink = `${baseUrl}/api/newsletter/confirm?token=${confirmationToken}`;
    // TODO: Phase E mock email - replace with Resend/SendGrid when SMTP ready
    console.log(
      '[MOCK EMAIL] To:',
      finalRow.email,
      '| Confirmation link:',
      confirmLink
    );

    return NextResponse.json(
      {
        code: 0,
        data: {
          subscription_id: finalRow.id,
          email: finalRow.email,
          frequency: finalRow.frequency,
          confirmation_required: true,
          mock_email_sent: true,
          // In mock mode, also return the link so QA / dev can confirm quickly
          dev_confirm_link: confirmLink,
        },
        message: 'ok',
      },
      { status: isNewSubscription ? 201 : 200 }
    );
  } catch (error) {
    console.error('newsletter subscribe unexpected error:', error);
    return NextResponse.json(
      { code: 5002, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
