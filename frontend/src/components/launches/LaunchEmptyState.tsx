/**
 * AI Radar — `<LaunchEmptyState>` (Server Component, T-1 P0)
 *
 * File: frontend/src/components/launches/LaunchEmptyState.tsx
 * Author: 寇豆码 (Engineer)
 *
 * Empty/error state for the `/launches` page. Rendered when the launches
 * list is empty, the user has filtered down to 0 results, or the
 * requested range is invalid (per AC-2.4).
 *
 * Per `docs/phase-f-w2-architecture.md` §6.1:
 *   - Three variants: `'empty' | 'filtered' | 'error'`.
 *   - Bilingual copy inline (no `useTranslations` round-trip — keeps
 *     this component trivially RSC).
 *   - Carries `data-testid="launch-empty-state"` and a variant-scoped
 *     test id for QA selectors.
 */
import * as React from 'react';
import Link from 'next/link';
import { Inbox, Filter, AlertTriangle, ArrowLeft, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Variant drives both the icon and the copy. Centralised here so the
 * caller only has to choose the semantic intent.
 */
export type LaunchEmptyVariant = 'empty' | 'filtered' | 'error';

/**
 * Props for `<LaunchEmptyState>`.
 */
export interface LaunchEmptyStateProps {
  /** Visual + copy variant. Defaults to `'empty'`. */
  variant?: LaunchEmptyVariant;
  /**
   * When `variant === 'filtered'`, the slug of the category the user
   *   filtered by. Used to label the empty state.
   */
  category?: string;
  /** Optional className appended to the root container. */
  className?: string;
}

const VARIANT_META: Record<
  LaunchEmptyVariant,
  {
    icon: LucideIcon;
    title_zh: string;
    title_en: string;
    desc_zh: string;
    desc_en: string;
    iconClasses: string;
  }
> = {
  empty: {
    icon: Inbox,
    title_zh: '暂无新品',
    title_en: 'No launches yet',
    desc_zh: '试试切换时间范围，或稍后再来看看',
    desc_en: 'Try a different time range, or check back later.',
    iconClasses: 'bg-muted text-muted-foreground',
  },
  filtered: {
    icon: Filter,
    title_zh: '当前筛选下没有匹配的新品',
    title_en: 'No matches for this filter',
    desc_zh: '换一个类别，或清除筛选条件',
    desc_en: 'Try a different category, or clear the filter.',
    iconClasses: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  },
  error: {
    icon: AlertTriangle,
    title_zh: '加载失败',
    title_en: 'Failed to load',
    desc_zh: '请检查 URL 参数是否正确',
    desc_en: 'Please check that the URL parameters are valid.',
    iconClasses: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  },
};

/**
 * `<LaunchEmptyState>` — friendly placeholder for the 0-result case.
 *
 * Server-renderable, no client hooks. The "back to /launches" button
 * is a plain `<Link>` so it works during SSR (no `useRouter`).
 */
export function LaunchEmptyState({
  variant = 'empty',
  category,
  className,
}: LaunchEmptyStateProps) {
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      data-testid="launch-empty-state"
      data-variant={variant}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'mx-auto flex max-w-xl flex-col items-center gap-4 rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center',
        className,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full',
          meta.iconClasses,
        )}
        aria-hidden="true"
      >
        <Icon className="h-7 w-7" />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          <span lang="zh">{meta.title_zh}</span>
          <span lang="en" className="ml-2 text-sm text-muted-foreground font-normal">
            / {meta.title_en}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          <span lang="zh">{meta.desc_zh}</span>
          <span lang="en" className="ml-2 block text-xs opacity-75">
            {meta.desc_en}
          </span>
        </p>
      </div>

      {/* Filtered variant: show the slug the user filtered by */}
      {variant === 'filtered' && category && (
        <p className="text-xs text-muted-foreground">
          <span lang="zh">当前类别：</span>
          <span lang="en" className="ml-1 opacity-75">category:</span>
          <code
            data-testid="launch-empty-state-filtered-category"
            className="ml-1 rounded bg-background px-1.5 py-0.5 font-mono text-xs"
          >
            {category}
          </code>
        </p>
      )}

      {/* Error variant: hint to go back to the canonical URL */}
      {variant === 'error' && (
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/launches">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            <span lang="zh">返回新品列表</span>
            <span lang="en" className="ml-2 text-xs opacity-75">
              back to /launches
            </span>
          </Link>
        </Button>
      )}
    </div>
  );
}

export default LaunchEmptyState;
