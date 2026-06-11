'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Plan tier identifiers (per `docs/phase-e-architecture.md` §2 — `user_profiles.plan`).
 *
 * Ordered from most-restrictive to most-permissive so we can use
 * index comparisons when answering "is `actual >= required`" questions.
 */
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

/**
 * Numeric rank for each plan tier. Higher = more capable.
 */
const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Features that may be paywalled in the UI. Each feature is mapped to
 * the minimum plan tier required to access it.
 *
 * Once the B-line `user_profiles.plan` column is wired up, this map
 * remains the single source of truth for client-side gating.
 */
export type PlanFeature =
  | 'watchlist'
  | 'comparison'
  | 'trends.advanced'
  | 'newsletter.daily'
  | 'api.access'
  | 'team.collaboration';

/**
 * Minimum plan required for each gated feature.
 */
const FEATURE_MIN_PLAN: Record<PlanFeature, PlanTier> = {
  watchlist: 'starter',
  comparison: 'starter',
  'trends.advanced': 'pro',
  'newsletter.daily': 'starter',
  'api.access': 'pro',
  'team.collaboration': 'enterprise',
};

/**
 * localStorage key for the persisted plan. Exported so tests can
 * reset the state in one place.
 */
export const PLAN_STORAGE_KEY = 'airadar.plan';

/**
 * Plan metadata used by the pricing UI and `PaywallGate` upgrade copy.
 * Pricing is intentionally a display string — actual billing happens
 * server-side in a later phase.
 */
export interface PlanMeta {
  id: PlanTier;
  /** Display name (English). */
  name_en: string;
  /** Display name (Chinese). */
  name_zh: string;
  /** Short marketing line shown in `<PaywallGate>`. */
  tagline_en: string;
  tagline_zh: string;
  /** Monthly price in USD, or `null` for "Custom" (Enterprise). */
  price_usd: number | null;
}

export const PLAN_CATALOG: readonly PlanMeta[] = [
  {
    id: 'free',
    name_en: 'Free',
    name_zh: '免费',
    tagline_en: 'Explore the AI product universe.',
    tagline_zh: '探索 AI 产品世界。',
    price_usd: 0,
  },
  {
    id: 'starter',
    name_en: 'Starter',
    name_zh: '入门版',
    tagline_en: 'For solo founders tracking their first niches.',
    tagline_zh: '适合追踪首批利基市场的独立创业者。',
    price_usd: 5,
  },
  {
    id: 'pro',
    name_en: 'Pro',
    name_zh: '专业版',
    tagline_en: 'For serious AI founders and investors.',
    tagline_zh: '适合认真的 AI 创业者和投资人。',
    price_usd: 10,
  },
  {
    id: 'enterprise',
    name_en: 'Enterprise',
    name_zh: '企业版',
    tagline_en: 'For teams and organisations.',
    tagline_zh: '适合团队与组织。',
    price_usd: null,
  },
] as const;

/**
 * Public return shape of `usePlan()`.
 */
export interface UsePlanResult {
  /** Current active plan. Defaults to `free` when none is persisted. */
  plan: PlanTier;
  /** True once the localStorage value has been read (avoids SSR flash). */
  hydrated: boolean;
  /**
   * Set the active plan. Persists to `localStorage` and broadcasts a
   * `storage`-like event so other tabs / components stay in sync.
   */
  setPlan: (next: PlanTier) => void;
  /**
   * Returns `true` if the active plan can access `feature`.
   */
  hasFeature: (feature: PlanFeature) => boolean;
  /**
   * Returns the minimum plan tier required to access `feature`.
   * Useful for "Upgrade to {tier}" copy in `PaywallGate`.
   */
  requiredPlanFor: (feature: PlanFeature) => PlanTier;
}

/**
 * Internal custom event name used to synchronise `usePlan` consumers
 * within the same tab (the native `storage` event only fires in other
 * tabs). Components subscribe via `window.addEventListener`.
 */
const PLAN_EVENT = 'airadar:plan-change';

function isPlanTier(value: unknown): value is PlanTier {
  return (
    typeof value === 'string' &&
    (value === 'free' ||
      value === 'starter' ||
      value === 'pro' ||
      value === 'enterprise')
  );
}

/**
 * Read the current plan from `localStorage`. Safe to call from SSR
 * (returns `null` when `window` is not available).
 */
function readPersistedPlan(): PlanTier | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
    return isPlanTier(raw) ? raw : null;
  } catch {
    // localStorage can throw in private mode or when blocked.
    return null;
  }
}

/**
 * Persist the plan to `localStorage` and notify in-tab listeners.
 */
function persistPlan(plan: PlanTier): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, plan);
  } catch {
    // Storage quota / private mode — fall through silently. The
    // `plan-change` event still fires so the in-tab UI updates.
  }
  try {
    window.dispatchEvent(
      new CustomEvent<PlanTier>(PLAN_EVENT, { detail: plan }),
    );
  } catch {
    // CustomEvent is universally supported in modern browsers, but
    // guard against legacy environments.
  }
}

/**
 * `usePlan` — client-side plan state hook.
 *
 * ## W2 Prep Behaviour
 * During W2 the `user_profiles.plan` column is being migrated (B-line work
 * owned by 寇豆码-1), so this hook intentionally **does not** call
 * Supabase. Instead it persists the plan to `localStorage` so the
 * `<PaywallGate>` can be exercised end-to-end without a backend.
 *
 * ## SSR Safety
 * On the server (or before hydration) the hook returns `plan = 'free'`
 * and `hydrated = false`. After mount it reads the persisted value and
 * flips `hydrated` to `true` so consumers can avoid a flash of "free"
 * for paying users.
 *
 * ## Cross-tab Sync
 * The hook listens to the native `storage` event (other tabs) and a
 * custom `airadar:plan-change` event (same tab) so multiple components
 * stay synchronised without prop-drilling.
 *
 * @example
 * ```tsx
 * const { plan, hasFeature, setPlan } = usePlan();
 * if (!hasFeature('comparison')) return <PaywallGate feature="comparison" />;
 * ```
 */
export function usePlan(): UsePlanResult {
  const [plan, setPlanState] = useState<PlanTier>('free');
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Initial hydration — read once on mount.
  useEffect(() => {
    const persisted = readPersistedPlan();
    if (persisted) {
      setPlanState(persisted);
    }
    setHydrated(true);
  }, []);

  // Cross-tab sync (native `storage` event).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PLAN_STORAGE_KEY) return;
      if (isPlanTier(event.newValue)) {
        setPlanState(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Same-tab sync (custom event).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePlanChange = (event: Event) => {
      const custom = event as CustomEvent<PlanTier>;
      if (isPlanTier(custom.detail)) {
        setPlanState(custom.detail);
      }
    };
    window.addEventListener(PLAN_EVENT, handlePlanChange as EventListener);
    return () =>
      window.removeEventListener(
        PLAN_EVENT,
        handlePlanChange as EventListener,
      );
  }, []);

  const setPlan = useCallback((next: PlanTier) => {
    setPlanState(next);
    persistPlan(next);
  }, []);

  const hasFeature = useCallback(
    (feature: PlanFeature) => {
      const required = FEATURE_MIN_PLAN[feature];
      return PLAN_RANK[plan] >= PLAN_RANK[required];
    },
    [plan],
  );

  const requiredPlanFor = useCallback((feature: PlanFeature) => {
    return FEATURE_MIN_PLAN[feature];
  }, []);

  return useMemo(
    () => ({ plan, hydrated, setPlan, hasFeature, requiredPlanFor }),
    [plan, hydrated, setPlan, hasFeature, requiredPlanFor],
  );
}

/**
 * Helper for non-React code paths (e.g. imperative gating in event
 * handlers). Returns `true` if the persisted plan can access `feature`.
 */
export function planHasFeature(
  plan: PlanTier,
  feature: PlanFeature,
): boolean {
  const required = FEATURE_MIN_PLAN[feature];
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}
