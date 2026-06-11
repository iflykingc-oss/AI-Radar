'use client';

/**
 * CategoryFilterBar — client-side filter for the /discover category grid.
 *
 * Renders two segmented controls:
 *  - **Layer**: mature | emerging | all
 *  - **Pricing model**: free | freemium | paid | open_source | all
 *
 * Clicking a chip updates the URL search params (`?layer=` and
 * `?pricing=`). The page (a Server Component) reads those params and
 * re-fetches / re-filters the data.
 *
 * ## Why a client component?
 * The page itself is an RSC and reads the active filter from
 * `searchParams`. The only client behaviour is the click → URL update
 * + `router.push`, so this thin client component is the minimum
 * surface area to mark `'use client'`.
 *
 * ## Pricing filter behaviour
 * The current `/api/categories` endpoint does NOT support a pricing
 * filter directly. We accept the pricing filter in the URL for
 * forward-compatibility (so the URL scheme is stable) and let the
 * page filter the category list client-side based on the
 * `category.pricing_distribution` field once that lands. For now the
 * pricing chips are informational and the page treats them as no-ops.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type CategoryLayer = 'mature' | 'emerging' | 'all';
export type CategoryPricing = 'all' | 'free' | 'freemium' | 'paid' | 'open_source';

const PRICING_OPTIONS: ReadonlyArray<{ value: CategoryPricing; i18nKey: string }> = [
  { value: 'all', i18nKey: 'pricing_models.free' /* see note below */ },
  { value: 'free', i18nKey: 'pricing_models.free' },
  { value: 'freemium', i18nKey: 'pricing_models.freemium' },
  { value: 'paid', i18nKey: 'pricing_models.paid' },
  { value: 'open_source', i18nKey: 'pricing_models.open_source' },
];

const LAYER_OPTIONS: ReadonlyArray<{ value: CategoryLayer }> = [
  { value: 'mature' },
  { value: 'emerging' },
  { value: 'all' },
];

export interface CategoryFilterBarProps {
  /** Initial active layer — usually read from `searchParams.layer`. */
  layer: CategoryLayer;
  /** Initial active pricing — usually read from `searchParams.pricing`. */
  pricing: CategoryPricing;
  /** Optional className for the wrapper. */
  className?: string;
}

export function CategoryFilterBar({
  layer,
  pricing,
  className,
}: CategoryFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('discover');
  const tPricing = useTranslations('pricing_models');

  // Build a URL with a single param replaced, preserving everything else.
  const navigate = React.useCallback(
    (key: 'layer' | 'pricing', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all' || value === 'mature' && key === 'layer') {
        // 'mature' is the default for layer; 'all' is the default for pricing.
        // We still set it explicitly so the URL is stable and the user can
        // bookmark/share a non-default filter too. We don't omit.
      }
      params.set(key, value);
      const qs = params.toString();
      router.push(`/discover${qs ? `?${qs}` : ''}`);
    },
    [router, searchParams],
  );

  const handleClear = React.useCallback(() => {
    router.push('/discover');
  }, [router]);

  const hasActiveFilter = layer !== 'mature' || pricing !== 'all';

  return (
    <div
      data-testid="category-filter-bar"
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t('filters', { defaultValue: 'Filters' })}:
        </span>
        {/* Layer segmented control */}
        <div
          role="group"
          aria-label="Category layer"
          className="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1 text-xs"
        >
          {LAYER_OPTIONS.map((opt) => {
            const isActive = opt.value === layer;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => navigate('layer', opt.value)}
                data-layer={opt.value}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-medium transition-colors',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`layer_${opt.value}`)}
              </button>
            );
          })}
        </div>

        {/* Pricing segmented control */}
        <div
          role="group"
          aria-label="Pricing model"
          className="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1 text-xs"
        >
          {PRICING_OPTIONS.map((opt) => {
            const isActive = opt.value === pricing;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => navigate('pricing', opt.value)}
                data-pricing={opt.value}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-medium transition-colors',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.value === 'all'
                  ? t('layer_all')
                  : tPricing(opt.i18nKey.split('.')[1] as 'free' | 'freemium' | 'paid' | 'open_source')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-start gap-1 sm:items-end">
        <span className="text-xs text-muted-foreground" data-testid="discover-filter-summary">
          {hasActiveFilter
            ? t('filter_summary_active', { defaultValue: 'Showing filtered results. Clear filters to recover the full list.' })
            : t('filter_summary_default', { defaultValue: 'Showing the default mature category view.' })}
        </span>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            data-testid="category-filter-clear"
          >
            <X className="mr-1 h-3 w-3" />
            {t('clear_all')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default CategoryFilterBar;
