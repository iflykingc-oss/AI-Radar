'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

type Product = Database['public']['Tables']['products']['Row'];

// ---- Data Sources Configuration ----
const DATA_SOURCES = [
  { name: 'Product Hunt', category: 'Community', status: 'active' as const },
  { name: 'GitHub Trending', category: 'Open Source', status: 'active' as const },
  { name: 'Hacker News', category: 'Community', status: 'active' as const },
  { name: 'Reddit r/artificial', category: 'Community', status: 'active' as const },
  { name: 'Twitter/X AI Feed', category: 'Social Media', status: 'degraded' as const },
  { name: 'ArXiv Papers', category: 'Research', status: 'active' as const },
  { name: 'Crunchbase', category: 'Funding', status: 'active' as const },
  { name: 'TechCrunch', category: 'News', status: 'active' as const },
  { name: 'VentureBeat', category: 'News', status: 'active' as const },
  { name: 'AI News RSS', category: 'News', status: 'active' as const },
  { name: 'Dev.to', category: 'Developer', status: 'active' as const },
  { name: 'Medium AI Tag', category: 'Blog', status: 'degraded' as const },
  { name: 'Google Alerts', category: 'Aggregator', status: 'active' as const },
  { name: 'Betalist', category: 'Launchpad', status: 'offline' as const },
  { name: 'AlternativeTo', category: 'Review', status: 'active' as const },
];

// ---- SVG Charts ----
function SimpleLineChart({ data, width = 600, height = 200 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  if (data.length === 0) return <div className="text-center text-sm text-muted-foreground py-8">No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const gridLines = 4;
  const gridY = Array.from({ length: gridLines + 1 }, (_, i) => ({
    y: padding.top + (i / gridLines) * chartH,
    label: Math.round(maxVal - (i / gridLines) * range),
  }));
  const step = Math.max(Math.ceil(data.length / 8), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Products trend over 30 days">
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="hsl(var(--muted))" strokeWidth="0.5" strokeDasharray="4" />
          <text x={padding.left - 6} y={g.y + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">{g.label}</text>
        </g>
      ))}
      <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="hsl(var(--primary))" />)}
      {data.filter((_, i) => i % step === 0).map((d, i) => {
        const idx = data.indexOf(d);
        return <text key={i} x={points[idx].x} y={height - 6} textAnchor="middle" className="text-[9px] fill-muted-foreground">{d.label}</text>;
      })}
    </svg>
  );
}

function SimpleBarChart({ data, width = 600, height = 240 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  if (data.length === 0) return <div className="text-center text-sm text-muted-foreground py-8">No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 10, right: 10, bottom: 60, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barGap = Math.max(chartW / data.length * 0.15, 2);
  const barWidth = (chartW / data.length) - barGap;

  const gridLines = 4;
  const gridY = Array.from({ length: gridLines + 1 }, (_, i) => ({
    y: padding.top + (i / gridLines) * chartH,
    label: Math.round(maxVal - (i / gridLines) * maxVal),
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Category distribution">
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="hsl(var(--muted))" strokeWidth="0.5" strokeDasharray="4" />
          <text x={padding.left - 6} y={g.y + 4} textAnchor="end" className="text-[9px] fill-muted-foreground">{g.label}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + i * (barWidth + barGap);
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="2" fill="hsl(var(--primary))" opacity={0.85} />
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="text-[8px] fill-muted-foreground" transform={`rotate(-30, ${x + barWidth / 2}, ${height - 8})`}>{d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Status Badge ----
function StatusBadge({ status }: { status: 'active' | 'degraded' | 'offline' }) {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    degraded: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    offline: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };
  return <Badge variant="outline" className={`${styles[status]} capitalize`}>{status}</Badge>;
}

// ---- Main Page ----
export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const res = await fetch('/api/products?limit=500&sort=recent');
        if (!res.ok) throw new Error('Failed to fetch products');
        const json = await res.json();
        setProducts(json.products || []);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
        setError(t('error_loading'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // --- Computed Stats ---
  const totalProducts = products.length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const productsThisWeek = products.filter(p => {
    const d = new Date(p.created_at);
    return d >= sevenDaysAgo;
  }).length;

  const activeSources = DATA_SOURCES.filter(s => s.status === 'active').length;
  const avgConfidence = totalProducts > 0
    ? Math.round(products.reduce((sum, p) => sum + (p.confidence_score ?? 0), 0) / totalProducts)
    : 0;

  // --- Category Distribution ---
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    }
  });
  const categoryData = Object.entries(categoryCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Trend Data (last 30 days cumulative) ---
  const trendData: { label: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const label = `${day.getMonth() + 1}/${day.getDate()}`;
    const count = products.filter(p => {
      const d = new Date(p.created_at);
      return d.toISOString().split('T')[0] <= dayStr;
    }).length;
    trendData.push({ label, value: count });
  }

  // --- Recent Activity ---
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const now = new Date();
  const activityEvents = recentProducts.map(p => {
    const created = new Date(p.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    let timeAgo: string;
    if (diffMins < 1) timeAgo = t('just_now');
    else if (diffMins < 60) timeAgo = t('minutes_ago', { n: diffMins });
    else if (diffHours < 24) timeAgo = t('hours_ago', { n: diffHours });
    else timeAgo = t('days_ago', { n: diffDays });

    return {
      name: p.name,
      category: p.category || 'Unknown',
      confidence: p.confidence_score ?? 0,
      timeAgo,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 rounded-lg bg-muted" />
            <div className="h-64 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('title')}</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('total_products')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('products_this_week')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productsThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('active_sources')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSources} <span className="text-lg text-muted-foreground">/ {DATA_SOURCES.length}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('avg_confidence')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgConfidence}<span className="text-lg text-muted-foreground">%</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('trend_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={trendData} width={560} height={200} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('category_distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={categoryData} width={560} height={240} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Data Source Health + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data Source Health Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('source_health')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('source_name')}</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('source_category')}</th>
                    <th className="text-center py-2 pr-4 font-medium text-muted-foreground">{t('source_status')}</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">{t('source_items')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_SOURCES.map((ds) => {
                    const randomItems = Math.floor(Math.random() * 50) + 5;
                    return (
                      <tr key={ds.name} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{ds.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{ds.category}</td>
                        <td className="py-2 pr-4 text-center">
                          <StatusBadge status={ds.status} />
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {randomItems.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('recent_activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('no_activity')}</p>
              ) : (
                activityEvents.map((event, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {i < activityEvents.length - 1 && <div className="w-px h-full min-h-[20px] bg-border" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{event.name}</span>
                        <Badge variant="outline" className="text-xs">{event.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{t('confidence_label')}: {event.confidence}%</span>
                        <span>·</span>
                        <span>{event.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
