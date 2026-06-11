'use client';

import * as React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PLAN_CATALOG, usePlan, type PlanFeature, type PlanTier } from '@/hooks/usePlan';

/**
 * Props for `<PaywallGate>`.
 *
 * Per ADR-08 (architecture §3.8), the gate is a soft wall rendered on
 * the client. Pro users and free users receive the same first-paint
 * HTML (good for SEO) — the gate only swaps the children for a
 * "locked" placeholder after hydration.
 */
export interface PaywallGateProps {
  /** Which feature this gate protects. Drives the upgrade copy. */
  feature: PlanFeature;
  /**
   * The actual content to render when the active plan satisfies
   * `feature`. May be a single node or any React node.
   */
  children: React.ReactNode;
  /**
   * Optional element to render instead of the upgrade dialog when the
   * gate is locked. Useful for inline placeholders on dense pages.
   */
  fallback?: React.ReactNode;
  /**
   * Optional override for the upgrade dialog. When `false`, the gate
   * will not open a dialog on lock — it will simply swap in `fallback`.
   * @default true
   */
  showDialog?: boolean;
  /** Optional className applied to the wrapper element. */
  className?: string;
}

/**
 * Format a USD price for display. `null` means "Custom" (Enterprise).
 */
function formatPrice(price_usd: number | null): string {
  if (price_usd === null) return 'Custom';
  if (price_usd === 0) return 'Free';
  return `$${price_usd}/mo`;
}

/**
 * Map a `PlanFeature` value (which uses dots, e.g. `trends.advanced`)
 * to the snake_case i18n namespace segment used in `messages/*.json`
 * (e.g. `trends_advanced`).
 *
 * Kept as a tiny helper so the rest of the component can stay declarative.
 */
function featureKey(feature: PlanFeature): string {
  return feature.replace(/\./g, '_');
}

/**
 * Try to detect the current UI locale from the document or navigator.
 * Used as a fallback when the component is rendered outside the
 * `next-intl` provider (e.g. in Storybook or unit tests). All real UI
 * copy now goes through `useTranslations`, so this is only used to
 * pick the plan name from `PLAN_CATALOG` (which carries explicit
 * `name_zh` / `name_en` fields) and the static dialog chrome.
 */
function detectLocale(): 'en' | 'zh' {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang?.toLowerCase() ?? '';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('en')) return 'en';
  }
  if (typeof navigator !== 'undefined') {
    if (navigator.language?.toLowerCase().startsWith('zh')) return 'zh';
  }
  return 'en';
}

/**
 * Small, reusable "locked" placeholder rendered when the gate is
 * closed and the user does not have access. Mirrors the visual
 * language of `<Card>` but uses lighter borders so it doesn't fight
 * with the surrounding grid.
 *
 * `tFeature` is a per-feature translator bound to
 * `paywall.feature.<key>` (so calls like `tFeature('title')` resolve
 * to the right copy in the current locale). `t` is the shared
 * `paywall` translator for cross-feature strings.
 */
interface LockedPlaceholderProps {
  feature: PlanFeature;
  requiredPlan: PlanTier;
  onOpenDialog: () => void;
  planName: string;
  tFeature: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
}

function LockedPlaceholder({
  feature,
  requiredPlan,
  onOpenDialog,
  planName,
  tFeature,
  t,
}: LockedPlaceholderProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center"
      data-paywall-locked="true"
      data-testid={`paywall-locked-${feature}`}
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
      <Button
        size="sm"
        onClick={onOpenDialog}
        className="mt-2"
        data-testid="paywall-upgrade-cta"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {tFeature('cta')}
      </Button>
      {/* `pro_badge_*` lives on the shared `paywall` namespace and is
          intentionally kept here as a sub-line for screen readers and
          for the QA smoke test. */}
      <span className="sr-only">{t('pro_badge')}</span>
    </div>
  );
}

/**
 * `<PaywallGate>` — soft paywall wrapper.
 *
 * Wraps gated content and renders an upgrade dialog (or `fallback`)
 * when the active plan lacks `feature`. Follows ADR-08:
 *
 * - RSC-friendly: the gate itself is a client component, but the
 *   `children` prop can be RSC content; the client only swaps markup
 *   after hydration.
 * - Soft wall: free users see "locked" copy, never a server error.
 * - No forced redirect: we link to `/pricing` but the dialog is
 *   dismissible so the user can keep browsing.
 *
 * Copy lives in `messages/{en,zh}.json` under `paywall.feature.<key>`;
 * the per-feature translator is bound dynamically off the `feature`
 * prop. `detectLocale()` is preserved as a fallback for non-i18n
 * contexts.
 *
 * @example
 * ```tsx
 * <PaywallGate feature="trends.advanced">
 *   <TrendCurveDetail />
 * </PaywallGate>
 * ```
 */
export function PaywallGate({
  feature,
  children,
  fallback,
  showDialog = true,
  className,
}: PaywallGateProps) {
  const { plan, hydrated, hasFeature, requiredPlanFor, setPlan } = usePlan();
  const t = useTranslations('paywall');
  const tFeature = useTranslations(`paywall.feature.${featureKey(feature)}`);
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [locale, setLocale] = React.useState<'en' | 'zh'>('en');

  React.useEffect(() => {
    setLocale(detectLocale());
  }, []);

  // Before hydration we render the children — this matches ADR-08's
  // "Pro and free users see the same first-paint HTML" rule. After
  // hydration we either keep them visible or swap in the placeholder.
  const allowed = hydrated ? hasFeature(feature) : true;
  const requiredPlan = requiredPlanFor(feature);

  if (allowed) {
    return (
      <div
        className={className}
        data-paywall-state="unlocked"
        data-plan={plan}
        data-testid={`paywall-gate-${feature}`}
      >
        {children}
      </div>
    );
  }

  const openDialog = () => {
    if (showDialog) setDialogOpen(true);
  };

  // The plan name comes from `PLAN_CATALOG` (which stores `name_zh` /
  // `name_en`), so we still need `detectLocale()` to pick the right
  // one for the body placeholder.
  const planMeta = PLAN_CATALOG.find((p) => p.id === requiredPlan);
  const planName = planMeta
    ? locale === 'zh'
      ? planMeta.name_zh
      : planMeta.name_en
    : requiredPlan;

  return (
    <div
      className={className}
      data-paywall-state="locked"
      data-plan={plan}
      data-testid={`paywall-gate-${feature}`}
    >
      {fallback ?? (
        <LockedPlaceholder
          feature={feature}
          requiredPlan={requiredPlan}
          onOpenDialog={openDialog}
          planName={planName}
          tFeature={tFeature}
          t={t}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t('pro_badge')}</Badge>
              <span className="text-sm text-muted-foreground">
                {t('current_plan')}:{' '}
                <span className="font-medium text-foreground">{plan}</span>
              </span>
            </div>
            <DialogTitle className="mt-2">{t('dialog_title')}</DialogTitle>
            <DialogDescription>{t('dialog_desc')}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLAN_CATALOG.filter((p) => p.id !== 'free').map((meta) => {
              const isRequired = meta.id === requiredPlan;
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => {
                    setPlan(meta.id);
                    setDialogOpen(false);
                  }}
                  className={[
                    'flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors',
                    isRequired
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-accent',
                  ].join(' ')}
                  data-plan-option={meta.id}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-semibold">
                      {locale === 'zh' ? meta.name_zh : meta.name_en}
                    </span>
                    <span className="text-sm font-medium">
                      {formatPrice(meta.price_usd)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {locale === 'zh' ? meta.tagline_zh : meta.tagline_en}
                  </span>
                  {isRequired && (
                    <Badge variant="default" className="mt-1">
                      {t('required_badge')}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" asChild className="sm:order-1">
              <Link href="/pricing" onClick={() => setDialogOpen(false)}>
                {t('see_full_pricing')}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="sm:order-2"
              aria-label={locale === 'zh' ? '关闭' : 'Close'}
            >
              <X className="mr-2 h-4 w-4" />
              {t('maybe_later')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaywallGate;
