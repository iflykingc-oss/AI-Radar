/**
 * CategoryCard — Server Component for a single mature category tile.
 *
 * Used by `/discover/page.tsx`. Renders an icon, a bilingual name
 * (Chinese first, English second), the product count, and the
 * hot-score. The whole card is a `<Link>` to a placeholder destination
 * (`/discover/${slug}`) — the detail page itself is out of scope for
 * T-2 and will be wired in a later task.
 *
 * Visual language mirrors `home/LayerEntryCard` so the home page L1
 * card and the dedicated /discover grid feel like the same family.
 */

import * as React from 'react';
import Link from 'next/link';
import {
  Code2,
  Image as ImageIcon,
  Music,
  Video,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '@/lib/api/types';

/**
 * Map icon identifier (the `icon` string in the DB) to a Lucide icon.
 * Falls back to `Sparkles` when the identifier is unknown so we never
 * render a broken/missing icon.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  code: Code2,
  image: ImageIcon,
  audio: Music,
  video: Video,
  text: MessageSquare,
  chat: MessageSquare,
  other: Sparkles,
};

export interface CategoryCardProps extends CategoryItem {
  /** Optional accent colour class. Defaults to `blue`. */
  accent?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
  /** Optional className for the outer Link. */
  className?: string;
}

const ACCENT_CLASSES: Record<string, { badge: string; iconBg: string; ring: string }> = {
  blue: {
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
    ring: 'hover:ring-blue-500/30',
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    ring: 'hover:ring-emerald-500/30',
  },
  purple: {
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
    ring: 'hover:ring-purple-500/30',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    ring: 'hover:ring-amber-500/30',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    ring: 'hover:ring-rose-500/30',
  },
};

/**
 * Format a count number for display. Mirrors the home page
 * `LayerEntryCard.formatCount` so the same widget style works.
 */
function formatCount(n: number): string {
  if (n >= 10000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return n.toLocaleString('en-US');
}

export function CategoryCard({
  slug,
  name_en,
  name_zh,
  description,
  icon,
  product_count,
  hot_score,
  display_order: _display_order,
  accent = 'blue',
  className,
}: CategoryCardProps) {
  const Icon = ICON_MAP[icon ?? 'other'] ?? Sparkles;
  const accentClasses = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.blue;
  // Cycle accents deterministically by display_order so the grid has
  // visual variety without being random.
  const accentCycle: Array<keyof typeof ACCENT_CLASSES> = [
    'blue',
    'emerald',
    'purple',
    'amber',
    'rose',
  ];
  const effectiveAccent = accent ?? accentCycle[_display_order % accentCycle.length];
  const accentCls = ACCENT_CLASSES[effectiveAccent] ?? ACCENT_CLASSES.blue;
  void accentClasses; // keep linter happy; we use accentCls below

  return (
    <Link
      href={`/discover/${slug}`}
      data-testid={`category-card-${slug}`}
      data-category-slug={slug}
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
          accentCls.ring,
        )}
      >
        <CardContent className="flex h-full flex-col gap-3 p-5">
          {/* Icon */}
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg',
              accentCls.iconBg,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Bilingual name */}
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold leading-tight">
              <span lang="zh">{name_zh || name_en}</span>
            </h3>
            <p className="text-xs text-muted-foreground" lang="en">
              {name_en}
            </p>
          </div>

          {/* Description (optional) */}
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}

          {/* Footer: count + hot badge */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <Badge
              variant="secondary"
              className={cn('text-xs font-medium', accentCls.badge)}
            >
              {formatCount(product_count ?? 0)}
              <span className="ml-1 text-xs opacity-75">
                {product_count === 1 ? 'product' : 'products'}
              </span>
            </Badge>
            {hot_score > 0 && (
              <Badge variant="outline" className="text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                {hot_score.toFixed(0)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default CategoryCard;
