'use client';

/**
 * RangeSelector — segmented control for trend time-range selection.
 *
 * Renders three buttons (`7d` / `30d` / `90d`) and updates the URL
 * `?range=...` query parameter on click. The `90d` option is **disabled**
 * with a tooltip until the Pro paywall (T-4) ships — clicking it does
 * nothing and the underlying `<button>` carries a `title` attribute
 * that doubles as a native tooltip fallback.
 *
 * ## Why a client component?
 * The page itself is a Server Component (ADR-07) that reads the active
 * `range` from `searchParams`. We only need client-side behaviour for
 * the click handler (`router.push`), so this thin client component is
 * the minimal surface area to mark `'use client'`.
 *
 * ## T-4 hook
 * Replace the `disabled` + `title` UI with `<PaywallGate feature="trends.advanced">`
 * wrapping the `90d` button when the Pro paywall ships. The public
 * component API will not need to change.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendRange } from '@/lib/api/types';

export interface RangeOption {
  value: TrendRange;
  label: string;
  /** Tooltip / title text for the native title attribute. */
  tooltip: string;
  /** When true, the option is disabled and shows a lock icon. */
  disabled?: boolean;
}

export interface RangeSelectorProps {
  /** Currently active range — usually read from `searchParams.range`. */
  value: TrendRange;
  /** Optional className appended to the root. */
  className?: string;
  /**
   * Optional callback invoked after a successful navigation. Mostly
   * useful for tests that want to spy on routing without mocking
   * `next/navigation`.
   */
  onChange?: (next: TrendRange) => void;
}

/**
 * Resolve the option list. Kept as a function (not a module constant)
 * so `useTranslations` can be called inside it without violating the
 * rules of hooks.
 */
function useRangeOptions(): RangeOption[] {
  const t = useTranslations('trends');
  return [
    {
      value: '7d',
      label: t('range_7d'),
      tooltip: t('range_7d_tooltip'),
      disabled: false,
    },
    {
      value: '30d',
      label: t('range_30d'),
      tooltip: t('range_30d_tooltip'),
      disabled: false,
    },
    {
      value: '90d',
      label: t('range_90d'),
      tooltip: t('range_90d_tooltip'),
      // T-4: replace with <PaywallGate feature="trends.advanced">.
      // For now we hard-disable and surface the Pro-only copy via title.
      disabled: true,
    },
  ];
}

export function RangeSelector({
  value,
  className,
  onChange,
}: RangeSelectorProps) {
  const router = useRouter();
  const options = useRangeOptions();

  const handleClick = React.useCallback(
    (next: TrendRange, disabled: boolean) => {
      if (disabled) return;
      if (next === value) return;
      onChange?.(next);
      // Navigate to the same page with the new range so the RSC
      // re-fetches with the new search param. Using `router.push` keeps
      // the browser history consistent.
      const url = new URL(window.location.href);
      url.searchParams.set('range', next);
      router.push(url.pathname + url.search);
    },
    [router, value, onChange],
  );

  return (
    <div
      role="group"
      aria-label="Trend range"
      data-testid="range-selector"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1 text-sm',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={opt.disabled}
            disabled={opt.disabled}
            title={opt.tooltip}
            onClick={() => handleClick(opt.value, !!opt.disabled)}
            data-range={opt.value}
            data-disabled={opt.disabled ? 'true' : 'false'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              opt.disabled &&
                'cursor-not-allowed opacity-60 hover:text-muted-foreground',
            )}
          >
            <span>{opt.label}</span>
            {opt.disabled && (
              <Lock
                className="h-3.5 w-3.5"
                aria-hidden="true"
                data-testid="range-locked-icon"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default RangeSelector;
