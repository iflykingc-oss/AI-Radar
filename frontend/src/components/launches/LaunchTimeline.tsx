/**
 * AI Radar — `<LaunchTimeline>` (Server Component, T-1 P0)
 *
 * File: frontend/src/components/launches/LaunchTimeline.tsx
 * Author: 寇豆码 (Engineer)
 *
 * Grid container for a list of `<LaunchTimelineCard>` items. Renders a
 * responsive 1/2/3-column grid based on viewport width. The whole
 * component is RSC-safe (no `'use client'`, no client hooks).
 *
 * Per `docs/phase-f-w2-architecture.md` §6.1:
 *   - Wraps a list of launch items in a consistent grid + a status row
 *     at the top showing the count and the time range.
 *   - `data-testid="launch-timeline"` for QA selectors.
 *   - The grid uses CSS grid (no JS measurement) so it works on SSR.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LaunchItem, LaunchRange } from '@/lib/api/types';
import { LaunchTimelineCard } from './LaunchTimelineCard';

/**
 * Props for `<LaunchTimeline>`.
 */
export interface LaunchTimelineProps {
  /** The launch events to render (already paginated by the server). */
  items: LaunchItem[];
  /**
   * Currently active time range. Used to label the timeline header and
   *   for `data-range` QA attribute.
   */
  locale: LaunchRange;
  /** Optional className appended to the timeline root. */
  className?: string;
}

/**
 * Range label (bilingual). Mirrors the i18n keys under `launches.range.*`
 * but inlined here to keep the component self-contained for the T-1
 * manifest and to avoid an extra `useTranslations` round-trip.
 */
const RANGE_LABEL: Record<LaunchRange, { zh: string; en: string }> = {
  '24h': { zh: '过去 24 小时', en: 'Last 24 hours' },
  '7d': { zh: '过去 7 天', en: 'Last 7 days' },
  '30d': { zh: '过去 30 天', en: 'Last 30 days' },
  '90d': { zh: '过去 90 天', en: 'Last 90 days' },
  all: { zh: '全部时间', en: 'All time' },
};

/**
 * `<LaunchTimeline>` — responsive grid of `<LaunchTimelineCard>` items.
 *
 * Layout:
 *   - xs (<sm):   1 column
 *   - sm (≥640):  2 columns
 *   - lg (≥1024): 3 columns
 *
 * A subtle top rule + count line helps visually separate the timeline
 * from the filter bar above and the pagination below.
 */
export function LaunchTimeline({ items, locale, className }: LaunchTimelineProps) {
  const label = RANGE_LABEL[locale] ?? RANGE_LABEL['24h'];
  const count = items.length;

  return (
    <section
      data-testid="launch-timeline"
      data-range={locale}
      data-count={count}
      aria-label={`${label.zh} / ${label.en}`}
      className={cn('space-y-4', className)}
    >
      {/* Header strip: range + count */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2"
        data-testid="launch-timeline-header"
      >
        <h2 className="text-base font-semibold text-foreground">
          <span lang="zh">{label.zh}</span>
          <span lang="en" className="ml-2 text-sm text-muted-foreground font-normal">
            / {label.en}
          </span>
        </h2>
        <p className="text-xs text-muted-foreground" data-testid="launch-timeline-count">
          <span lang="zh">共 {count} 条</span>
          <span lang="en" className="ml-2 opacity-75">
            {count} launch{count === 1 ? '' : 'es'}
          </span>
        </p>
      </div>

      {/* Card grid */}
      {count === 0 ? (
        // Defensive: empty array is normally handled by `<LaunchEmptyState>`
        // before this component is rendered, but if a caller passes an
        // empty array we still show a friendly inline state rather than
        // a blank grid.
        <div
          data-testid="launch-timeline-empty-inline"
          className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
        >
          <span lang="zh">暂无该时间范围内的新品</span>
          <span lang="en" className="ml-2 opacity-75 block text-xs">
            No launches in this range.
          </span>
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-4',
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-3',
          )}
          data-testid="launch-timeline-grid"
        >
          {items.map((item) => (
            <LaunchTimelineCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default LaunchTimeline;
