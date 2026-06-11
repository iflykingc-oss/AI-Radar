/**
 * TrendsEmptyState — Server Component for "no trend signals" pages.
 *
 * Used by `/trends/page.tsx` when the API returns an empty
 * `PaginatedData<TrendItem>` (or when the endpoint is not yet
 * implemented and the server fetcher gracefully degrades to `null`).
 *
 * The component intentionally mirrors the visual language of
 * `components/empty-states/ErrorState.tsx` but is **not** an error
 * state — there is nothing wrong, there are simply no signals in the
 * selected range. We surface a "try a different range" hint and link
 * back to the 7d view via the URL.
 */

import * as React from 'react';
import Link from 'next/link';
import { LineChart, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export interface TrendsEmptyStateProps {
  /** The currently active range, used to render the page header. */
  range: '7d' | '30d' | '90d';
  /** Optional className for the outer wrapper. */
  className?: string;
}

export function TrendsEmptyState({ range, className }: TrendsEmptyStateProps) {
  const t = useTranslations('trends');
  const tCommon = useTranslations('common');

  return (
    <Card
      data-testid="trends-empty-state"
      className={className}
    >
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <LineChart className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            {t('no_signals')}
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {tCommon('error_desc', {
              defaultValue:
                'No trend signals matched the current filters. Try switching to a wider time range.',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {range !== '7d' && (
            <Button variant="default" asChild>
              <Link href="/trends?range=7d" data-testid="trends-empty-cta-7d">
                <Search className="mr-2 h-4 w-4" />
                {t('range_7d')}
              </Link>
            </Button>
          )}
          {range === '7d' && (
            <Button variant="outline" asChild>
              <Link href="/trends?range=30d" data-testid="trends-empty-cta-30d">
                {t('range_30d')}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrendsEmptyState;
