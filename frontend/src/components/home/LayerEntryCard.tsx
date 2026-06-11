import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * A single preview item rendered inside a `<LayerEntryCard>`.
 *
 * Cards may show up to `previewLimit` (default 3) of these as a teaser.
 * The full list lives on the destination page (e.g. `/categories`,
 * `/launches`, `/trends`).
 */
export interface LayerEntryPreview {
  /** Primary text — usually the product / category / signal name. */
  title: string;
  /** Optional secondary text (e.g. confidence %, source badge). */
  meta?: string;
  /** Optional href — if omitted, the card CTA is used. */
  href?: string;
}

/**
 * Visual accent for a layer card. Drives icon background + badge
 * colour. Centralised so the 3 cards look related but distinct.
 */
export type LayerAccent = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';

/**
 * Props for `<LayerEntryCard>`.
 *
 * Per ADR-07 the card is a Server Component: pure Tailwind, no
 * third-party carousel libs, no client-side state. The card accepts
 * placeholder data and renders gracefully when `items` is empty
 * (W2 prep state).
 */
export interface LayerEntryCardProps {
  /** Bilingual title pair — Chinese first, English second. */
  title_zh: string;
  title_en: string;
  /** Bilingual short description. */
  desc_zh: string;
  desc_en: string;
  /** Lucide icon component to render in the badge. */
  icon: LucideIcon;
  /** Visual accent. Defaults to `'blue'`. */
  accent?: LayerAccent;
  /** CTA link target. */
  href: string;
  /** Bilingual CTA label, e.g. "进入 →" / "Explore →". */
  cta_zh: string;
  cta_en: string;
  /** Optional count badge (e.g. "1,234 个赛道"). 0 hides the badge. */
  count?: number;
  /** Optional count unit, e.g. "个" / "items". */
  count_unit_zh?: string;
  count_unit_en?: string;
  /** Optional preview items rendered as a teaser. */
  items?: LayerEntryPreview[];
  /** Max preview items to show. Defaults to 3. */
  previewLimit?: number;
  /** Layer identifier — used for `data-layer` attribute (L1 / L2 / L3). */
  layer: 'L1' | 'L2' | 'L3';
  /** Optional className appended to the card root. */
  className?: string;
}

/**
 * Tailwind class fragments keyed by accent. Kept here (not in
 * `tailwind.config.ts`) so the file is self-contained and the
 * colour palette is colocated with the visual semantics.
 */
const ACCENT_CLASSES: Record<
  LayerAccent,
  { badge: string; iconBg: string; ring: string; dot: string }
> = {
  blue: {
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
    ring: 'hover:ring-blue-500/30',
    dot: 'bg-blue-500',
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    ring: 'hover:ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  purple: {
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
    ring: 'hover:ring-purple-500/30',
    dot: 'bg-purple-500',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    ring: 'hover:ring-amber-500/30',
    dot: 'bg-amber-500',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    ring: 'hover:ring-rose-500/30',
    dot: 'bg-rose-500',
  },
};

/**
 * Format a count number for display. Uses locale-agnostic grouping so
 * it works in both server and client contexts.
 */
function formatCount(n: number): string {
  if (n >= 10000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return n.toLocaleString('en-US');
}

/**
 * `<LayerEntryCard>` — single entry card for the home page.
 *
 * Renders one of the three layers (L1 成熟赛道 / L2 每日新发布 /
 * L3 趋势方向) with bilingual title, description, icon, optional
 * count badge, optional preview list, and a CTA arrow.
 *
 * The whole card is a `<Link>` so the entire surface is clickable
 * — better mobile UX and accessibility than a small CTA button.
 *
 * ## W2 prep behaviour
 * When `items` is empty / undefined, the card shows a single-line
 * skeleton-style placeholder ("加载中...") instead of a blank area.
 * This matches the existing convention of `ProductCard` and avoids
 * a jarring empty box during the data migration window.
 */
export function LayerEntryCard({
  title_zh,
  title_en,
  desc_zh,
  desc_en,
  icon: Icon,
  accent = 'blue',
  href,
  cta_zh,
  cta_en,
  count = 0,
  count_unit_zh,
  count_unit_en,
  items = [],
  previewLimit = 3,
  layer,
  className,
}: LayerEntryCardProps) {
  const accentClasses = ACCENT_CLASSES[accent];
  const preview = items.slice(0, previewLimit);
  const showCount = typeof count === 'number' && count > 0;
  const showPlaceholder = preview.length === 0;

  return (
    <Link
      href={href}
      aria-label={`${title_zh} / ${title_en}`}
      data-layer={layer}
      data-testid={`layer-entry-card-${layer.toLowerCase()}`}
      className={cn(
        'group block h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <Card
        className={cn(
          'relative h-full overflow-hidden transition-all',
          'hover:shadow-lg hover:-translate-y-0.5',
          'hover:ring-2',
          accentClasses.ring,
        )}
      >
        {/* Accent stripe along the top — visual differentiator */}
        <div
          aria-hidden="true"
          className={cn('absolute inset-x-0 top-0 h-1', accentClasses.dot)}
        />

        <CardContent className="flex h-full flex-col gap-4 p-6">
          {/* Icon + Layer badge */}
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                accentClasses.iconBg,
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {layer}
            </Badge>
          </div>

          {/* Title + description */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight">
              <span lang="zh">{title_zh}</span>
              <span className="text-muted-foreground font-normal">
                {' / '}
                <span lang="en">{title_en}</span>
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              <span lang="zh">{desc_zh}</span>
              <span lang="en" className="block text-xs">
                {desc_en}
              </span>
            </p>
          </div>

          {/* Count badge */}
          {showCount && (
            <div>
              <Badge
                variant="secondary"
                className={cn('text-sm font-medium', accentClasses.badge)}
              >
                <span lang="zh">
                  {formatCount(count)} {count_unit_zh ?? ''}
                </span>
                <span lang="en" className="ml-1 text-xs opacity-75">
                  ({count_unit_en ?? 'items'})
                </span>
              </Badge>
            </div>
          )}

          {/* Preview list or placeholder */}
          <div className="flex-1">
            {showPlaceholder ? (
              <div
                className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                aria-label="Loading placeholder"
              >
                <span lang="zh">数据接入中…</span>
                <span lang="en" className="ml-1 opacity-75">
                  Data syncing…
                </span>
              </div>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {preview.map((item, idx) => (
                  <li
                    key={`${item.title}-${idx}`}
                    className="flex items-center gap-2 truncate"
                  >
                    <span
                      aria-hidden="true"
                      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', accentClasses.dot)}
                    />
                    <span className="truncate font-medium">{item.title}</span>
                    {item.meta && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="font-medium text-primary">
              <span lang="zh">{cta_zh}</span>
              <span lang="en" className="ml-2 text-xs opacity-75">
                {cta_en}
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default LayerEntryCard;
