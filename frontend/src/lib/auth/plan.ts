/**
 * Server-side plan reader.
 *
 * Reads the active plan from the `plan` cookie. Used by RSC pages to
 * decide whether to render the paywall lock or the actual gated
 * content. The same `PlanTier` type is used by `usePlan()` (client) and
 * the `FEATURE_MIN_PLAN` map in `hooks/usePlan.ts`.
 *
 * Source of truth precedence (server-side):
 *   1. `plan` cookie (smoke-test friendly, no JS required)
 *   2. default → 'free'
 *
 * When the B-line `user_profiles.plan` column is wired up, the cookie
 * check will be replaced with a Supabase query — for now this is the
 * minimal viable gate that satisfies ADR-08 + the QA smoke tests.
 */
import { cookies } from 'next/headers';

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

const PLAN_VALUES: readonly PlanTier[] = ['free', 'starter', 'pro', 'enterprise'] as const;

function isPlanTier(value: string | undefined): value is PlanTier {
  return typeof value === 'string' && (PLAN_VALUES as readonly string[]).includes(value);
}

/**
 * Reads the active plan from the `plan` cookie. Returns `'free'` when
 * the cookie is missing, malformed, or explicitly set to `'free'`.
 *
 * Callers must be inside an async RSC (so `cookies()` is available).
 */
export async function getServerPlan(): Promise<PlanTier> {
  try {
    const store = await cookies();
    const raw = store.get('plan')?.value;
    return isPlanTier(raw) ? raw : 'free';
  } catch {
    // `cookies()` throws in static-rendering contexts; treat as free.
    return 'free';
  }
}
