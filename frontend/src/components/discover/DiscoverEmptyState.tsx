/**
 * DiscoverEmptyState — Server Component for "no categories" state.
 *
 * Used by `/discover/page.tsx` when `/api/categories` returns no root
 * items (or when the endpoint is not yet implemented and the server
 * fetcher gracefully degrades to `null`). Mirrors the visual language
 * of `components/empty-states/NoProducts.tsx` for consistency.
 */

import * as React from 'react';
import Link from 'next/link';
import { Compass, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export interface DiscoverEmptyStateProps {
  /** Whether the empty state was caused by a filter (vs no data at all). */
  hasActiveFilter?: boolean;
  /** Optional className for the outer Card. */
  className?: string;
}

export function DiscoverEmptyState({
  hasActiveFilter = false,
  className,
}: DiscoverEmptyStateProps) {
  const t = useTranslations('discover');

  return (
    <Card
      data-testid="discover-empty-state"
      className={className}
    >
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Compass className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            {t('no_categories', { defaultValue: 'No categories found' })}
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {hasActiveFilter
              ? t('no_results_help', { defaultValue: 'Your current filters may be too narrow. Clear them to return to the full category list.' })
              : t('no_categories_help', { defaultValue: 'Category data is still syncing. Try the launch radar or return later.' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {hasActiveFilter ? (
            <Button variant="default" asChild>
              <Link href="/discover" data-testid="discover-empty-cta-clear">
                <Search className="mr-2 h-4 w-4" />
                {t('clear_filters', { defaultValue: 'Clear all filters' })}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/" data-testid="discover-empty-cta-home">
                {t('browse_all', { defaultValue: 'Browse all categories' })}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DiscoverEmptyState;
