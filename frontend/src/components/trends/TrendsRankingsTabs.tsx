'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { TrendItem } from '@/lib/api/types';

export interface TrendGroup {
  items: TrendItem[];
  emptyMessage: string;
}

interface TrendsRankingsTabsProps {
  rising: TrendGroup;
  falling: TrendGroup;
  stable: TrendGroup;
  labels: {
    rising: string;
    falling: string;
    stable: string;
  };
  meta: {
    strength: string;
    velocity: string;
    products: string;
    whyItMatters: string;
  };
  defaultTab?: 'rising' | 'falling' | 'stable';
}

/**
 * Client wrapper for the three Tabs on the trends page.
 *
 * The page itself is an RSC. Radix Tabs requires a client boundary, so we
 * hoist the tab state into this small client component and pass the
 * pre-grouped signals down as props.
 */
export function TrendsRankingsTabs({
  rising,
  falling,
  stable,
  labels,
  meta,
  defaultTab = 'rising',
}: TrendsRankingsTabsProps) {
  const [active, setActive] = useState<'rising' | 'falling' | 'stable'>(defaultTab);

  return (
    <Tabs
      value={active}
      onValueChange={(v) => setActive(v as 'rising' | 'falling' | 'stable')}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="rising" data-testid="trends-tab-rising">
          <TrendingUp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {labels.rising} ({rising.items.length})
        </TabsTrigger>
        <TabsTrigger value="falling" data-testid="trends-tab-falling">
          <TrendingDown className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {labels.falling} ({falling.items.length})
        </TabsTrigger>
        <TabsTrigger value="stable" data-testid="trends-tab-stable">
          <Minus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {labels.stable} ({stable.items.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rising" data-testid="trends-panel-rising">
        <SignalsPanel
          items={rising.items}
          emptyMessage={rising.emptyMessage}
          variant="rising"
          meta={meta}
        />
      </TabsContent>

      <TabsContent value="falling" data-testid="trends-panel-falling">
        <SignalsPanel
          items={falling.items}
          emptyMessage={falling.emptyMessage}
          variant="falling"
          meta={meta}
        />
      </TabsContent>

      <TabsContent value="stable" data-testid="trends-panel-stable">
        <SignalsPanel
          items={stable.items}
          emptyMessage={stable.emptyMessage}
          variant="stable"
          meta={meta}
        />
      </TabsContent>
    </Tabs>
  );
}

function buildWhyItMatters(
  item: TrendItem,
  variant: 'rising' | 'falling' | 'stable',
  t: ReturnType<typeof useTranslations>,
): string {
  const productSignal = item.product_count > 0
    ? t('why_products', { count: item.product_count })
    : t('why_multiple_sources');

  if (variant === 'rising') {
    return t('why_rising', {
      strength: item.strength,
      velocity: Math.max(0, item.velocity),
      productSignal,
    });
  }

  if (variant === 'falling') {
    return t('why_falling', { status: item.status });
  }

  return t('why_stable');
}

function SignalsPanel({
  items,
  emptyMessage,
  variant,
  meta,
}: {
  items: TrendItem[];
  emptyMessage: string;
  variant: 'rising' | 'falling' | 'stable';
  meta: { strength: string; velocity: string; products: string; whyItMatters: string };
}) {
  const t = useTranslations('trends');

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {items.slice(0, 12).map((item, idx) => (
          <article
            key={item.id}
            className="flex items-start gap-4 p-4"
            data-testid={`trend-signal-${variant}`}
          >
            <span className="w-8 shrink-0 text-2xl font-bold text-muted-foreground/50">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{item.title}</h3>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {item.signal_type}
                </Badge>
              </div>
              {item.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              <p
                className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                data-testid="trend-why-it-matters"
              >
                <span className="font-medium text-foreground">{meta.whyItMatters}: </span>
                {buildWhyItMatters(item, variant, t)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {meta.strength}:{' '}
                  <strong className="text-foreground">{item.strength}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {meta.velocity}:{' '}
                  <strong
                    className={
                      item.velocity > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.velocity < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-foreground'
                    }
                  >
                    {item.velocity > 0 ? '+' : ''}
                    {item.velocity}
                  </strong>
                </span>
                {typeof item.product_count === 'number' && item.product_count > 0 ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.product_count} {meta.products}
                    </span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <time dateTime={item.first_seen}>
                  {new Intl.DateTimeFormat(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }).format(new Date(item.first_seen))}
                </time>
              </div>
            </div>
            <Badge
              variant={
                variant === 'rising'
                  ? 'success'
                  : variant === 'falling'
                    ? 'destructive'
                    : 'secondary'
              }
              className="shrink-0"
            >
              {item.status}
            </Badge>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
