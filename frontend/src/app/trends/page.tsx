import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/transitions/FadeIn';
import { RangeSelector } from '@/components/trends/RangeSelector';
import { TrendsLineChart, type ChartSeries } from '@/components/trends/TrendsLineChart';
import { TrendsEmptyState } from '@/components/trends/TrendsEmptyState';
import { TrendsRankingsTabs } from '@/components/trends/TrendsRankingsTabs';
import { fetchTrends } from '@/lib/api/server';
import type { TrendItem, TrendRange } from '@/lib/api/types';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

/**
 * Validate the `range` query string against the `TrendRange` union.
 * Returns the validated value or `null` if the value is unrecognised.
 *
 * `24h` is intentionally rejected because it is a `LaunchRange` value,
 * not a `TrendRange` value (see `lib/api/types.ts`).
 */
function parseRange(raw: string | string[] | undefined): TrendRange | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '7d' || value === '30d' || value === '90d') {
    return value;
  }
  return null;
}

/**
 * Bucket a `TrendItem` into one of the three ranking sections.
 *
 * `TrendStatus` is one of `'emerging' | 'peaking' | 'cooling' | 'expired'`.
 *
 * - rising:   `emerging` / `peaking` with strength >= 70 and positive
 *             velocity — signals actively accelerating.
 * - falling:  `cooling` or `expired` — signals past their peak.
 * - stable:   anything else (peaking at low strength, emerging at low
 *             strength, etc.) — visible but not changing much.
 */
function bucketItem(item: TrendItem): 'rising' | 'falling' | 'stable' {
  if (item.status === 'cooling' || item.status === 'expired') return 'falling';
  if (item.strength >= 70 && item.velocity > 0) return 'rising';
  return 'stable';
}

/**
 * Build a weekly time series for the line chart, bucketed by trend status.
 *
 * The API does not return a time-series payload, so we synthesise one from
 * the signal `first_seen` date (anchored to the start of the range) and
 * `evidence.metrics.weekly_growth` (used as a slope modifier). Each bucket
 * produces a sparse 4-point series, which is enough for the visual to show
 * relative movement while remaining honest about data scarcity.
 *
 * The result is rendered by `<TrendsLineChart>` as three overlapping
 * coloured lines (rising=emerald, falling=rose, stable=slate).
 */
function buildChartSeries(items: TrendItem[], range: TrendRange): ChartSeries[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const samples = 4;

  const buckets: Record<'rising' | 'falling' | 'stable', ChartSeries> = {
    rising: {
      id: 'rising',
      label: 'rising',
      color: 'emerald',
      points: [],
    },
    falling: {
      id: 'falling',
      label: 'falling',
      color: 'rose',
      dasharray: '4 2',
      points: [],
    },
    stable: {
      id: 'stable',
      label: 'stable',
      color: 'slate',
      dasharray: '2 3',
      points: [],
    },
  };

  // Aggregate per-bucket: count + average weekly growth.
  const agg: Record<'rising' | 'falling' | 'stable', { count: number; avgGrowth: number }> = {
    rising: { count: 0, avgGrowth: 0 },
    falling: { count: 0, avgGrowth: 0 },
    stable: { count: 0, avgGrowth: 0 },
  };

  for (const item of items) {
    const bucket = bucketItem(item);
    const growth = item.evidence?.metrics?.weekly_growth ?? 0;
    agg[bucket].count += 1;
    agg[bucket].avgGrowth += growth;
  }

  // For each bucket, build `samples` evenly-spaced points from startDate to endDate.
  (Object.keys(buckets) as Array<keyof typeof buckets>).forEach((key) => {
    const series = buckets[key];
    const { count, avgGrowth } = agg[key];
    if (count === 0) return;

    // Normalise growth to 0-100. ±100 maps to ±50 from baseline (50).
    const clamped = Math.max(-100, Math.min(100, avgGrowth));
    const startValue = 50 + clamped * 0.3;
    const endValue = 50 + clamped * 0.5;

    for (let i = 0; i < samples; i++) {
      const ratio = i / (samples - 1);
      const value = Math.round(startValue + (endValue - startValue) * ratio);
      const pointDate = new Date(startDate);
      pointDate.setDate(pointDate.getDate() + Math.round(days * ratio));
      series.points.push({
        date: pointDate.toISOString().slice(0, 10),
        value: Math.max(0, Math.min(100, value)),
      });
    }
  });

  return Object.values(buckets);
}

type Props = {
  searchParams: { range?: string | string[] };
};

export default async function TrendsPage({ searchParams }: Props) {
  const t = await getTranslations('trends');
  const tCommon = await getTranslations('common');
  const parsed = parseRange(searchParams.range);
  // No range query: default to 7d. An explicitly invalid range (e.g. 24h) still 404s.
  if (searchParams.range !== undefined && !parsed) notFound();
  const range: TrendRange = parsed ?? '7d';

  // Single fetch — uses the unified `/api/trends?range=...` endpoint.
  const data = await fetchTrends({ range });
  const items: TrendItem[] = data?.items ?? [];

  // Group signals into sections.
  const groups = {
    rising: items.filter((i) => bucketItem(i) === 'rising'),
    falling: items.filter((i) => bucketItem(i) === 'falling'),
    stable: items.filter((i) => bucketItem(i) === 'stable'),
  };

  const series = buildChartSeries(items, range);

  // Header subtitle based on range.
  const headerSubtitle =
    range === '7d'
      ? tCommon('last_7_days')
      : range === '30d'
        ? tCommon('last_30_days')
        : tCommon('last_90_days');

  return (
    <FadeIn direction="up" duration={0.4}>
      <div className="container mx-auto px-4 py-8 space-y-8" data-testid="trends-page">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{headerSubtitle}</p>
          </div>
          <RangeSelector value={range} />
        </header>

        {/* Overview Line Chart */}
        <section
          aria-labelledby="trends-chart-heading"
          data-testid="trends-chart-section"
        >
          <Card>
            <CardHeader>
              <CardTitle id="trends-chart-heading">{t('chart_title')}</CardTitle>
              <CardDescription>{t('chart_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <TrendsEmptyState range={range} />
              ) : (
                <TrendsLineChart series={series} height={240} />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Rankings — Tabs (hoisted to client component for Radix boundary) */}
        <section
          aria-labelledby="trends-rankings-heading"
          data-testid="trends-rankings-section"
        >
          <h2 id="trends-rankings-heading" className="sr-only">
            {t('rankings_heading')}
          </h2>
          <TrendsRankingsTabs
            rising={{
              items: groups.rising,
              emptyMessage: t('no_rising'),
            }}
            falling={{
              items: groups.falling,
              emptyMessage: t('no_falling'),
            }}
            stable={{
              items: groups.stable,
              emptyMessage: t('no_stable'),
            }}
            labels={{
              rising: t('rising'),
              falling: t('falling'),
              stable: t('stable'),
            }}
            meta={{
              strength: t('strength'),
              velocity: t('velocity'),
              products: t('products'),
              whyItMatters: t('why_it_matters'),
            }}
            defaultTab={
              groups.rising.length > 0
                ? 'rising'
                : groups.falling.length > 0
                  ? 'falling'
                  : 'stable'
            }
          />
        </section>
      </div>
    </FadeIn>
  );
}
