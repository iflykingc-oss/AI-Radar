/**
 * AI Radar — `/watchlist` (Server Component shell, W2 P0.3 / T-4 wiring)
 *
 * This page is now an RSC wrapper that:
 *   1. Reads the active plan from the `plan` cookie (`getServerPlan`).
 *   2. If the user is on the `free` plan, renders a server-side
 *      paywall lock that matches the `<PaywallGate>` `data-testid`
 *      contract (`paywall-locked-watchlist`).
 *   3. If the user is on `starter` / `pro` / `enterprise`, renders
 *      the client-side `<WatchlistClient>` (interactive UI).
 *
 * The smoke test (T2-015) needs `paywall-locked-watchlist` to appear
 * in the SSR HTML for a free user. The `<PaywallGate>` component
 * follows ADR-08 ("same first-paint HTML"), so it cannot render the
 * lock during SSR — that's why this page does the gate decision
 * server-side via the cookie.
 */
import { getServerPlan } from '@/lib/auth/plan';
import { getTranslations } from 'next-intl/server';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import WatchlistClient from './WatchlistClient';

export const dynamic = 'force-dynamic';

/**
 * Map a `PlanTier` cookie value to the i18n plan name used in the
 * paywall copy. The lock body says "this feature requires <plan>" so
 * the user understands the upgrade target.
 */
function planDisplayName(plan: 'starter' | 'pro' | 'enterprise'): 'Starter' | 'Pro' | 'Enterprise' {
  if (plan === 'starter') return 'Starter';
  if (plan === 'enterprise') return 'Enterprise';
  return 'Pro';
}

async function PaywallLockedWatchlist() {
  const tWatchlist = await getTranslations('watchlist');
  const tFeature = await getTranslations('paywall.feature.watchlist');
  // `paywall.feature.watchlist.body` uses a `{plan}` placeholder, e.g.
  // "此功能需要 Starter 套餐". The required plan for `watchlist` is
  // `starter` per `FEATURE_MIN_PLAN` in `hooks/usePlan.ts`.
  const requiredPlan = 'Starter' as const;
  const planName = planDisplayName('starter');

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="watchlist-page"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tWatchlist('title')}</h1>
        </div>
      </div>

      <div
        className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center"
        data-paywall-locked="true"
        data-testid="paywall-locked-watchlist"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{tFeature('title')}</p>
          <p className="text-sm text-muted-foreground">
            {tFeature('body', { plan: planName })}
          </p>
        </div>
        <Button size="sm" asChild className="mt-2" data-testid="paywall-upgrade-cta">
          <Link href="/pricing">
            <Sparkles className="mr-2 h-4 w-4" />
            {tFeature('cta')}
          </Link>
        </Button>
        <span className="sr-only">{requiredPlan}</span>
      </div>
    </div>
  );
}

export default async function WatchlistPage() {
  const plan = await getServerPlan();

  if (plan === 'free') {
    return <PaywallLockedWatchlist />;
  }

  return <WatchlistClient />;
}
