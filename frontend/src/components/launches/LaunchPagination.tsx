/**
 * AI Radar — `<LaunchPagination>` (Client Component, T-1 P0)
 *
 * File: frontend/src/components/launches/LaunchPagination.tsx
 * Author: 寇豆码 (Engineer)
 *
 * Prev / next + page-num controls for the `/launches` page. State is
 *   fully URL-driven (no local React state) so deep links, browser
 *   back/forward, and SSR all work.
 *
 * Per `docs/phase-f-w2-architecture.md` §6.1:
 *   - `'use client'` required (URL + router hooks).
 *   - Preserves the active `range` and `category` filters when changing
 *     pages, but strips them when going to page 1.
 *   - Shows "Showing X–Y of Z" hint + accessible labels.
 */
'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LaunchRange } from '@/lib/api/types';

/**
 * Props for `<LaunchPagination>`.
 */
export interface LaunchPaginationProps {
  /** 1-based current page (from server). */
  currentPage: number;
  /** Total number of pages. 0 means empty result set (component is hidden). */
  totalPages: number;
  /** Convenience flag — usually equivalent to `currentPage < totalPages`. */
  hasNext: boolean;
  /** Currently active range. Preserved across page changes. */
  range: LaunchRange;
  /** Currently active category slug. Preserved across page changes. */
  category: string;
  /** Total number of items across all pages. */
  total: number;
  /** Page size used by the server. */
  pageSize: number;
  /** Optional className appended to the root container. */
  className?: string;
}

/**
 * Build the query string for a target page, preserving other filters.
 */
function buildPageHref(
  pathname: string,
  current: URLSearchParams,
  page: number,
  range: LaunchRange,
  category: string,
): string {
  const next = new URLSearchParams();
  // Preserve range if it isn't the default '24h'.
  if (range !== '24h') {
    next.set('range', range);
  }
  // Preserve category if non-empty.
  if (category) {
    next.set('category', category);
  }
  // Page 1 doesn't need a `page` param; only set it for >1.
  if (page > 1) {
    next.set('page', String(page));
  }
  // Carry over any other unrelated params from the current URL so we
  // don't break things like UTM tracking or the `lang` param.
  // Use forEach (not for..of) to avoid the es5 downlevelIteration
  // requirement on URLSearchParamsIterator.
  current.forEach((value, key) => {
    if (key === 'range' || key === 'category' || key === 'page') return;
    next.set(key, value);
  });
  const qs = next.toString();
  return `${pathname}${qs ? `?${qs}` : ''}`;
}

/**
 * Format the "Showing X–Y of Z" hint. Returns null-safe bilingual copy.
 */
function formatShowingHint(
  currentPage: number,
  pageSize: number,
  total: number,
): { from: number; to: number; total: number } {
  const safeTotal = Math.max(0, total);
  if (safeTotal === 0) {
    return { from: 0, to: 0, total: 0 };
  }
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, safeTotal);
  return { from, to, total: safeTotal };
}

/**
 * `<LaunchPagination>` — prev/next + numbered pages with URL sync.
 *
 * Renders nothing when `totalPages <= 1` (the page-level RSC already
 * guards this, but we double-check here).
 */
export function LaunchPagination({
  currentPage,
  totalPages,
  hasNext,
  range,
  category,
  total,
  pageSize,
  className,
}: LaunchPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide when there's nothing to paginate.
  if (totalPages <= 1 && total === 0) {
    return null;
  }

  const hasPrev = currentPage > 1;
  // hasNext is provided by the server, but we also clamp it.
  const effectiveHasNext = hasNext && currentPage < totalPages;
  const hint = formatShowingHint(currentPage, pageSize, total);

  const prevHref = hasPrev
    ? buildPageHref(pathname, new URLSearchParams(searchParams.toString()), currentPage - 1, range, category)
    : null;
  const nextHref = effectiveHasNext
    ? buildPageHref(pathname, new URLSearchParams(searchParams.toString()), currentPage + 1, range, category)
    : null;

  const handleNavigate = React.useCallback(
    (href: string | null) => {
      if (!href) return;
      router.replace(href, { scroll: false });
    },
    [router],
  );

  return (
    <nav
      data-testid="launch-pagination"
      data-page={currentPage}
      data-total-pages={totalPages}
      data-total={total}
      data-range={range}
      data-category={category || ''}
      aria-label="Pagination"
      className={cn(
        'flex flex-col items-stretch gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {/* Hint line */}
      <p
        data-testid="launch-pagination-hint"
        className="text-xs text-muted-foreground"
      >
        {hint.total > 0 ? (
          <>
            <span lang="zh">
              第 {currentPage} / {totalPages || 1} 页 · 显示 {hint.from}–{hint.to} / 共 {hint.total} 条
            </span>
            <span lang="en" className="ml-2 opacity-75">
              Page {currentPage} of {totalPages || 1} · showing {hint.from}–{hint.to} of {hint.total}
            </span>
          </>
        ) : (
          <>
            <span lang="zh">无数据</span>
            <span lang="en" className="ml-2 opacity-75">no data</span>
          </>
        )}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          asChild={hasPrev && prevHref !== null}
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          data-testid="launch-pagination-prev"
          onClick={() => handleNavigate(prevHref)}
          className="h-8"
        >
          {hasPrev && prevHref ? (
            <a href={prevHref} aria-label="Previous page">
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              <span lang="zh">上一页</span>
              <span lang="en" className="ml-1 text-xs opacity-75">prev</span>
            </a>
          ) : (
            <span>
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              <span lang="zh">上一页</span>
              <span lang="en" className="ml-1 text-xs opacity-75">prev</span>
            </span>
          )}
        </Button>

        <span
          data-testid="launch-pagination-current"
          className="min-w-[3.5rem] rounded-md border bg-background px-2 py-1 text-center text-xs font-medium tabular-nums"
        >
          <span lang="zh">{currentPage} / {totalPages || 1}</span>
          <span lang="en" className="ml-1 text-[10px] text-muted-foreground">
            {currentPage} / {totalPages || 1}
          </span>
        </span>

        <Button
          asChild={effectiveHasNext && nextHref !== null}
          variant="outline"
          size="sm"
          disabled={!effectiveHasNext}
          data-testid="launch-pagination-next"
          onClick={() => handleNavigate(nextHref)}
          className="h-8"
        >
          {effectiveHasNext && nextHref ? (
            <a href={nextHref} aria-label="Next page">
              <span lang="zh">下一页</span>
              <span lang="en" className="ml-1 text-xs opacity-75">next</span>
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            <span>
              <span lang="zh">下一页</span>
              <span lang="en" className="ml-1 text-xs opacity-75">next</span>
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}

export default LaunchPagination;
