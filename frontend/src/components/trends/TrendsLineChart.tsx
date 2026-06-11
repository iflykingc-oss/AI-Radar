/**
 * TrendsLineChart — pure-SVG line chart for trend signal strength.
 *
 * Renders one stacked line per signal-type group (rising / cooling /
 * emerging / peaking) over the configured time buckets. No
 * third-party chart library — Tailwind + inline SVG keeps the bundle
 * small and the rendering deterministic on the server.
 *
 * ## Data shape
 * The chart receives pre-bucketed `ChartPoint[]` so the parent page
 * (a Server Component) can decide the bucketing strategy
 * (per-day / per-week) based on the active `range` without the
 * component needing to know the API contract.
 *
 * ## Accessibility
 * - A `<title>` element inside the SVG provides the chart summary
 *   for screen readers.
 * - A `<desc>` element enumerates the visible series.
 * - Each line has an `aria-label` describing the metric.
 * - The chart is purely decorative in colour — series are also
 *   distinguished by stroke-dasharray so colour is not the only cue.
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * A single point on the chart.
 */
export interface ChartPoint {
  /** ISO date string (YYYY-MM-DD or full ISO). */
  date: string;
  /** Numeric value at this point (e.g. average signal strength). */
  value: number;
}

/**
 * A single series (one line) on the chart.
 */
export interface ChartSeries {
  /** Stable id, used as React key and for accessibility. */
  id: string;
  /** Human-readable label (already localised by the caller). */
  label: string;
  /** Colour class for the line stroke (Tailwind hex, e.g. '#10b981'). */
  color: string;
  /** Optional dash pattern. */
  dasharray?: string;
  /** Data points, ordered ascending by date. */
  points: ChartPoint[];
}

export interface TrendsLineChartProps {
  /** Series to render, one `<polyline>` per series. */
  series: ChartSeries[];
  /** Optional className for the outer card. */
  className?: string;
  /** Chart height in pixels. */
  height?: number;
}

/**
 * Determine the chart domain (min/max) across all series so the Y
 * axis can be scaled consistently. Always pads a little so flat
 * series don't draw a 0-thick line at the edge.
 */
function computeDomain(
  series: ChartSeries[],
): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const s of series) {
    for (const p of s.points) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 100 };
  }
  // Pad by 10% on each side, ensure at least 0 on the floor and a
  // little headroom on the ceiling.
  const span = Math.max(1, max - min);
  return {
    min: Math.max(0, Math.floor(min - span * 0.1)),
    max: Math.ceil(max + span * 0.1),
  };
}

/**
 * Build the X axis (time) domain. We use the union of all series'
 * dates sorted ascending, deduplicated.
 */
function computeTimeline(series: ChartSeries[]): string[] {
  const set = new Set<string>();
  for (const s of series) for (const p of s.points) set.add(p.date);
  return Array.from(set).sort();
}

/**
 * TrendsLineChart (RSC).
 *
 * No `'use client'` directive — the SVG and Tailwind classes render
 * identically on the server. The component uses `useTranslations`
 * for the header label, which is server-safe in next-intl v3+.
 */
export function TrendsLineChart({
  series,
  className,
  height = 220,
}: TrendsLineChartProps) {
  const t = useTranslations('trends');
  const filteredSeries = series.filter((s) => s.points.length > 0);
  const empty = filteredSeries.length === 0;
  const domain = computeDomain(filteredSeries);
  const timeline = computeTimeline(filteredSeries);

  // SVG viewBox dimensions. We keep these fixed (640 × height) so the
  // chart scales fluidly via `width="100%"` without re-laying out.
  const W = 640;
  const H = height;
  const PAD_L = 36;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 24;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // X scale: index in timeline → pixel.
  const xFor = (date: string): number => {
    if (timeline.length <= 1) return PAD_L + innerW / 2;
    const idx = timeline.indexOf(date);
    return PAD_L + (idx / (timeline.length - 1)) * innerW;
  };
  // Y scale: value → pixel (inverted because SVG Y grows down).
  const yFor = (v: number): number => {
    const span = Math.max(1, domain.max - domain.min);
    const ratio = (v - domain.min) / span;
    return PAD_T + innerH - ratio * innerH;
  };

  // Y axis gridlines (4 horizontal lines, 0%, 25%, 50%, 75%, 100%).
  const yTicks: number[] = [0, 0.25, 0.5, 0.75, 1].map(
    (r) => domain.min + (domain.max - domain.min) * r,
  );

  // X tick labels — show up to 5 dates evenly spaced.
  const xTickIndices: number[] = (() => {
    if (timeline.length === 0) return [];
    if (timeline.length <= 5) return timeline.map((_, i) => i);
    const step = (timeline.length - 1) / 4;
    return [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), timeline.length - 1];
  })();

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="trends-line-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {t('chart_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: H }}
          >
            {t('no_signals')}
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
              {filteredSeries.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <svg
                    width="20"
                    height="8"
                    aria-hidden="true"
                    className="overflow-visible"
                  >
                    <line
                      x1="0"
                      y1="4"
                      x2="20"
                      y2="4"
                      stroke={s.color}
                      strokeWidth="2"
                      strokeDasharray={s.dasharray}
                    />
                  </svg>
                  <span className="text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>

            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              height={H}
              role="img"
              aria-labelledby="trends-chart-title trends-chart-desc"
              preserveAspectRatio="none"
            >
              <title id="trends-chart-title">{t('chart_title')}</title>
              <desc id="trends-chart-desc">
                {filteredSeries.map((s) => s.label).join(', ')}
              </desc>

              {/* Y axis gridlines + labels */}
              {yTicks.map((v, i) => {
                const y = yFor(v);
                return (
                  <g key={`yt-${i}`}>
                    <line
                      x1={PAD_L}
                      y1={y}
                      x2={W - PAD_R}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.08}
                      strokeWidth={1}
                    />
                    <text
                      x={PAD_L - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize={10}
                      fill="currentColor"
                      opacity={0.5}
                    >
                      {Math.round(v)}
                    </text>
                  </g>
                );
              })}

              {/* X axis labels */}
              {xTickIndices.map((idx) => {
                const date = timeline[idx];
                if (!date) return null;
                const x = xFor(date);
                return (
                  <text
                    key={`xt-${idx}`}
                    x={x}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.5}
                  >
                    {date.slice(5) /* MM-DD */}
                  </text>
                );
              })}

              {/* Series lines */}
              {filteredSeries.map((s) => {
                const polyline = s.points
                  .map((p) => `${xFor(p.date).toFixed(1)},${yFor(p.value).toFixed(1)}`)
                  .join(' ');
                return (
                  <g key={s.id} aria-label={s.label}>
                    <polyline
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeDasharray={s.dasharray}
                      points={polyline}
                    />
                    {/* Dots on each point — sized down to avoid visual
                        clutter on dense data. */}
                    {s.points.map((p, i) => (
                      <circle
                        key={`${s.id}-${i}`}
                        cx={xFor(p.date)}
                        cy={yFor(p.value)}
                        r={2.5}
                        fill={s.color}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default TrendsLineChart;
