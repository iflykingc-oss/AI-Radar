/**
 * AI Radar — `<LaunchFilterBar>` (Client Component, T-1 P0)
 *
 * File: frontend/src/components/launches/LaunchFilterBar.tsx
 * Author: 寇豆码 (Engineer)
 *
 * Client-side filter strip for the `/launches` page. Two controls:
 *
 *   1. Time range (24h / 7d / 30d / 90d / all) — segmented control.
 *   2. Category — Select dropdown populated from the server-supplied
 *      `categories` list.
 *
 * Both controls write their state to the URL via `useRouter().replace()`
 * + `useSearchParams()` so deep links and back/forward navigation work
 * natively (per ADR-07 RSC + URL-driven filter pattern).
 *
 * Per `docs/phase-f-w2-architecture.md` §6.1:
 *   - `'use client'` is required because of `useSearchParams` +
 *     `useRouter`.
 *   - Filter changes navigate to a new URL; the parent RSC re-fetches
 *     and re-renders. This is intentional — it keeps the page RSC.
 */
'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Filter as FilterIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CategoryItem, LaunchRange } from '@/lib/api/types';

/**
 * Props for `<LaunchFilterBar>`.
 *
 * The component is *fully controlled by the URL* — the parent RSC reads
 * the current `range` / `category` from `searchParams` and passes them
 * back in as initial values.
 */
export interface LaunchFilterBarProps {
  /** Current range (from URL). */
  range: LaunchRange;
  /** Current category slug (from URL), empty string = no filter. */
  category: string;
  /** Available categories for the dropdown (from server). */
  categories: CategoryItem[];
  /**
   * If the requested range is invalid (per AC-2.4) we render an
   *   inline error pill next to the range selector. Optional.
   */
  invalidRange?: boolean;
  /** Optional className appended to the root container. */
  className?: string;
}

const RANGE_OPTIONS: { value: LaunchRange; label_zh: string; label_en: string }[] = [
  { value: '24h', label_zh: '24h', label_en: '24h' },
  { value: '7d', label_zh: '7d', label_en: '7d' },
  { value: '30d', label_zh: '30d', label_en: '30d' },
  { value: '90d', label_zh: '90d', label_en: '90d' },
  { value: 'all', label_zh: '全部', label_en: 'All' },
];

/**
 * The category "no filter" sentinel used in the `<Select>`. We use a
 * non-empty string ("all") so Radix Select (which rejects `value=""`)
 * works out of the box. We strip it back to "no category" in the URL.
 */
const ALL_CATEGORIES_VALUE = '__all__';

/**
 * Build a new `URLSearchParams` from the current state, applying the
 * given changes. Strips the `page` param on any filter change so the
 * user is always taken back to page 1.
 */
function buildNextParams(
  current: URLSearchParams,
  changes: { range?: LaunchRange; category?: string | null },
): string {
  const next = new URLSearchParams(current.toString());
  if (changes.range) {
    next.set('range', changes.range);
  }
  if (changes.category !== undefined) {
    if (changes.category === null || changes.category === '' || changes.category === ALL_CATEGORIES_VALUE) {
      next.delete('category');
    } else {
      next.set('category', changes.category);
    }
  }
  // Reset to page 1 on any filter change.
  next.delete('page');
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

/**
 * `<LaunchFilterBar>` — segmented range + category select.
 *
 * Writes URL on every change. The parent RSC reads the URL and
 * re-fetches.
 */
export function LaunchFilterBar({
  range,
  category,
  categories,
  invalidRange = false,
  className,
}: LaunchFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The current category slug, normalised for Radix Select (which
  // requires a non-empty value).
  const selectValue = category && category.length > 0 ? category : ALL_CATEGORIES_VALUE;

  const handleRangeChange = React.useCallback(
    (nextRange: LaunchRange) => {
      if (nextRange === range) return;
      const qs = buildNextParams(new URLSearchParams(searchParams.toString()), {
        range: nextRange,
      });
      router.replace(`${pathname}${qs}`, { scroll: false });
    },
    [range, router, pathname, searchParams],
  );

  const handleCategoryChange = React.useCallback(
    (nextValue: string) => {
      if (nextValue === selectValue) return;
      const nextCategory = nextValue === ALL_CATEGORIES_VALUE ? null : nextValue;
      const qs = buildNextParams(new URLSearchParams(searchParams.toString()), {
        category: nextCategory,
      });
      router.replace(`${pathname}${qs}`, { scroll: false });
    },
    [selectValue, router, pathname, searchParams],
  );

  return (
    <div
      data-testid="launch-filter-bar"
      data-range={range}
      data-category={category || ''}
      data-invalid-range={invalidRange ? 'true' : 'false'}
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:gap-4',
        className,
      )}
    >
      {/* Range segmented control */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <FilterIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span lang="zh">时间</span>
          <span lang="en" className="opacity-75">range</span>
        </span>
        <div
          role="radiogroup"
          aria-label="Time range"
          data-testid="launch-filter-range"
          className="inline-flex flex-wrap items-center gap-1 rounded-md border bg-background p-0.5"
        >
          {RANGE_OPTIONS.map((opt) => {
            const active = opt.value === range;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                data-range-value={opt.value}
                data-active={active ? 'true' : 'false'}
                onClick={() => handleRangeChange(opt.value)}
                className={cn(
                  'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <span lang="zh">{opt.label_zh}</span>
                <span lang="en" className="ml-1 text-[10px] opacity-75">
                  {opt.label_en}
                </span>
              </button>
            );
          })}
        </div>
        {invalidRange && (
          <span
            data-testid="launch-filter-invalid-range-badge"
            role="status"
            className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <span lang="zh">无效时间范围</span>
            <span lang="en" className="opacity-75">invalid range</span>
          </span>
        )}
      </div>

      {/* Category Select */}
      <div className="flex w-full flex-col gap-2 sm:min-w-[14rem] sm:flex-row sm:items-center sm:w-auto">
        <label
          htmlFor="launch-filter-category"
          className="whitespace-nowrap text-xs font-medium text-muted-foreground"
        >
          <span lang="zh">类别</span>
          <span lang="en" className="ml-1 opacity-75">category</span>
        </label>
        <Select
          value={selectValue}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger
            id="launch-filter-category"
            data-testid="launch-filter-category"
            className="h-9 w-full text-xs"
            aria-label="Filter by category"
          >
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE} data-testid="launch-filter-category-all">
              <span lang="zh">全部类别</span>
              <span lang="en" className="ml-2 text-xs opacity-75">All categories</span>
            </SelectItem>
            {categories.length === 0 ? (
              <SelectItem value="__none__" disabled>
                <span lang="zh">无可用类别</span>
                <span lang="en" className="ml-2 text-xs opacity-75">no categories</span>
              </SelectItem>
            ) : (
              categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.slug}
                  data-testid={`launch-filter-category-${cat.slug}`}
                >
                  <span lang="zh">{cat.name_zh}</span>
                  <span lang="en" className="ml-2 text-xs opacity-75">
                    {cat.name_en}
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default LaunchFilterBar;
