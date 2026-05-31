'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Star, Github, ExternalLink, MessageSquare, ArrowUpRight } from 'lucide-react';
import { FadeIn } from '@/components/transitions/FadeIn';
import { TrendsSkeleton } from '@/components/skeletons/TrendsSkeleton';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type WordTag = { name: string; count: number };

interface TrendProduct {
  name: string;
  category: string;
  description: string;
  trendScore: number;
  weeklyChange: number;
  monthlyViews: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

/** Simple SVG line chart showing values over time. */
function SimpleLineChart({ data, width = 600, height = 200 }: { data: ChartDataPoint[]; width?: number; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * (width - 60) + 40,
    y: height - 30 - (d.value / maxVal) * (height - 60),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((ratio, i) => {
        const y = height - 30 - ratio * (height - 60);
        const val = Math.round(ratio * maxVal);
        return (
          <text key={i} x={36} y={y + 4} textAnchor="end" className="text-[10px] fill-muted-foreground">{val}</text>
        );
      })}
      <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" />)}
      {data.filter((_, i) => i % Math.max(Math.ceil(data.length / 8), 1) === 0).map((d, i) => {
        const idx = data.indexOf(d);
        return <text key={i} x={points[idx].x} y={height - 8} textAnchor="middle" className="text-[10px] fill-muted-foreground">{d.label}</text>;
      })}
    </svg>
  );
}

/** Simple SVG bar chart comparing categories. */
function SimpleBarChart({ data, width = 600, height = 200 }: { data: ChartDataPoint[]; width?: number; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min((width - 60) / data.length - 8, 50);
  const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(220, 80%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)'];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {data.map((d, i) => {
        const barHeight = (d.value / maxVal) * (height - 60);
        const x = i * (barWidth + 8) + 40;
        const y = height - 30 - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={colors[i % colors.length]} opacity="0.85" />
            <text x={x + barWidth / 2} y={height - 14} textAnchor="middle" className="text-[10px] fill-muted-foreground">{d.label.slice(0, 10)}</text>
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="text-[10px] fill-foreground font-medium">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Generate mock line chart data based on time range. */
function generateLineChartData(timeRange: string): ChartDataPoint[] {
  const now = new Date();
  let days: number;
  let formatLabel: (d: Date) => string;

  if (timeRange === '24h') {
    days = 1;
    formatLabel = (d) => d.getHours().toString() + ':00';
  } else if (timeRange === '7d') {
    days = 7;
    formatLabel = (d) => (d.getMonth() + 1) + '/' + d.getDate();
  } else if (timeRange === '30d') {
    days = 30;
    formatLabel = (d) => (d.getMonth() + 1) + '/' + d.getDate();
  } else if (timeRange === '90d') {
    days = 90;
    formatLabel = (d) => (d.getMonth() + 1) + '/' + d.getDate();
  } else {
    days = 7;
    formatLabel = (d) => (d.getMonth() + 1) + '/' + d.getDate();
  }

  const data: ChartDataPoint[] = [];
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = timeRange === '24h' ? 5 : timeRange === '7d' ? 12 : timeRange === '30d' ? 8 : 10;
    const value = Math.round(base + seededRandom() * base * 0.8);
    data.push({ label: formatLabel(d), value });
  }
  return data;
}

/** Generate mock bar chart data for top categories. */
function generateBarChartData(): ChartDataPoint[] {
  return [
    { label: 'AI 写作', value: 45 },
    { label: '代码助手', value: 38 },
    { label: '图像生成', value: 52 },
    { label: '视频编辑', value: 31 },
    { label: '语音合成', value: 27 },
    { label: '数据分析', value: 22 },
    { label: '翻译工具', value: 18 },
    { label: '教育学习', value: 15 },
  ];
}

/**
 * Generate deterministic pseudo-random positions for word cloud layout.
 * Uses a simple seeded PRNG so layout is stable across renders.
 */
function generateWordLayout(words: WordTag[], width: number, height: number) {
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Sort by count descending so bigger words get priority placement
  const sorted = [...words].sort((a, b) => b.count - a.count);
  const positions: { name: string; x: number; y: number; fontSize: number; count: number }[] = [];

  // Divide the container into a grid and place words in grid cells
  const cols = Math.ceil(Math.sqrt(words.length * (width / height)));
  const rows = Math.ceil(words.length / cols) + 1;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let i = 0; i < sorted.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tag = sorted[i];

    // Font size proportional to count: 12px to 36px
    const maxCount = Math.max(...words.map(w => w.count), 1);
    const fontSize = 12 + (tag.count / maxCount) * 24;

    // Position within grid cell with some jitter
    const jitterX = (seededRandom() - 0.5) * cellW * 0.4;
    const jitterY = (seededRandom() - 0.5) * cellH * 0.3;

    positions.push({
      name: tag.name,
      x: col * cellW + cellW / 2 + jitterX,
      y: row * cellH + cellH / 2 + jitterY,
      fontSize,
      count: tag.count,
    });
  }

  return positions;
}

/**
 * Map a score (0-100) to a color from muted blue to vibrant green.
 */
function getWordColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  const hue = 220 - ratio * 60; // 220 (blue) → 160 (teal/green)
  const saturation = 60 + ratio * 20; // 60% → 80%
  const lightness = 60 - ratio * 15; // 60% → 45%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Mock data for declining products tab
const decliningProducts: TrendProduct[] = [
  { name: "AI Writer Pro", category: "写作", description: "Automated content generation tool", trendScore: 35, weeklyChange: -12, monthlyViews: 8500 },
  { name: "CodeAssist AI", category: "开发", description: "AI-powered code completion", trendScore: 42, weeklyChange: -8, monthlyViews: 12000 },
  { name: "VoiceClone Studio", category: "音频", description: "Voice cloning and synthesis", trendScore: 38, weeklyChange: -15, monthlyViews: 6200 },
  { name: "ChatBot Builder", category: "对话", description: "No-code chatbot creation", trendScore: 45, weeklyChange: -5, monthlyViews: 15000 },
  { name: "ImageGen Pro", category: "图像", description: "AI image generation tool", trendScore: 50, weeklyChange: -3, monthlyViews: 22000 },
  { name: "DataMind AI", category: "数据", description: "Automated data analysis", trendScore: 33, weeklyChange: -18, monthlyViews: 4100 },
  { name: "TranslationMax", category: "翻译", description: "Neural machine translation", trendScore: 40, weeklyChange: -10, monthlyViews: 9800 },
  { name: "VideoEdit AI", category: "视频", description: "AI video editing assistant", trendScore: 47, weeklyChange: -6, monthlyViews: 11000 },
];

// Mock data for stable products tab
const stableProducts: TrendProduct[] = [
  { name: "Notion AI", category: "生产力", description: "AI integration for Notion", trendScore: 72, weeklyChange: 2, monthlyViews: 45000 },
  { name: "GrammarlyGO", category: "写作", description: "AI writing assistant", trendScore: 75, weeklyChange: 1, monthlyViews: 52000 },
  { name: "Jasper AI", category: "营销", description: "AI marketing copy generator", trendScore: 70, weeklyChange: -1, monthlyViews: 38000 },
  { name: "Midjourney", category: "图像", description: "AI art generation", trendScore: 78, weeklyChange: 3, monthlyViews: 68000 },
  { name: "Otter AI", category: "音频", description: "AI meeting transcription", trendScore: 68, weeklyChange: 0, monthlyViews: 28000 },
  { name: "Synthesia", category: "视频", description: "AI video avatar creation", trendScore: 73, weeklyChange: 2, monthlyViews: 35000 },
  { name: "Runway ML", category: "视频", description: "AI video editing suite", trendScore: 71, weeklyChange: 1, monthlyViews: 31000 },
  { name: "Claude", category: "对话", description: "Anthropic's AI assistant", trendScore: 80, weeklyChange: 4, monthlyViews: 72000 },
];

export default function TrendsPage() {
  const t = useTranslations('trends');
  const [timeRange, setTimeRange] = useState('7d');
  const [wordcloud, setWordcloud] = useState<WordTag[]>([]);
  const [trending, setTrending] = useState<Database['public']['Tables']['products']['Row'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const [wcRes, trendRes] = await Promise.all([
          fetch(`/api/trends/wordcloud?range=${timeRange}`),
          fetch(`/api/trends/top20?range=${timeRange}`),
        ]);
        const [wcData, trendData] = await Promise.all([wcRes.json(), trendRes.json()]);
        setWordcloud(wcData.tags || []);
        setTrending(trendData.products || []);
      } catch (e) {
        console.error('Failed to fetch trends:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [timeRange]);

  // Word cloud positions computed once for stability
  const wordPositions = useMemo(() => {
    if (wordcloud.length === 0) return [];
    return generateWordLayout(wordcloud, 700, 300);
  }, [wordcloud]);

  const maxWordCount = useMemo(() => {
    return Math.max(...wordcloud.map(w => w.count), 1);
  }, [wordcloud]);

  // Shared table header class
  const thClass = "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TrendsSkeleton />
      </div>
    );
  }

  return (
    <FadeIn direction="up" duration={0.4}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <div className="flex items-center gap-2">
            {['24h', '7d', '30d', '90d'].map((r) => (
              <Badge
                key={r}
                variant={timeRange === r ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTimeRange(r)}
              >
                {r}
              </Badge>
            ))}
          </div>
        </div>

        {/* Trend Overview Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('trend_overview') || 'Trend Overview'}</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={generateLineChartData(timeRange)} />
          </CardContent>
        </Card>

        {/* Word Cloud */}
        <Card>
          <CardHeader>
            <CardTitle>{t('trending_topics')}</CardTitle>
          </CardHeader>
          <CardContent>
            {wordPositions.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trending topics available
              </div>
            ) : (
              <div className="min-h-[300px] flex items-center justify-center">
                <svg
                  viewBox="0 0 700 300"
                  className="w-full max-w-3xl"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {wordPositions.map((pos) => (
                    <text
                      key={pos.name}
                      x={pos.x}
                      y={pos.y}
                      fontSize={pos.fontSize}
                      fill={getWordColor(pos.count, maxWordCount)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ fontWeight: pos.count / maxWordCount > 0.6 ? '700' : '500' }}
                    >
                      {pos.name}
                    </text>
                  ))}
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('category_comparison') || 'Category Comparison'}</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={generateBarChartData()} />
          </CardContent>
        </Card>

        {/* Rankings */}
        <Tabs defaultValue="rising" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rising">{t('rising')}</TabsTrigger>
            <TabsTrigger value="falling">{t('falling')}</TabsTrigger>
            <TabsTrigger value="stable">{t('stable')}</TabsTrigger>
          </TabsList>

          <TabsContent value="rising">
            <Card>
              <CardContent className="py-4">
                <div className="space-y-2">
                  {trending.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-2xl font-bold text-muted-foreground/50 w-8 text-center">
                        {i + 1}
                      </span>
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="h-8 w-8 object-cover rounded" />
                        ) : (
                          <span className="font-bold text-sm">{p.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-semibold">+{Math.round(p.weekly_growth_rate * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('this_week')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Falling / Declining tab */}
          <TabsContent value="falling">
            <Card>
              <CardContent className="py-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className={thClass}>#</th>
                        <th className={thClass}>Product</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Trend Score</th>
                        <th className={thClass}>Weekly Change</th>
                        <th className={thClass}>Monthly Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decliningProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-muted-foreground w-8">
                            {i + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <span className="font-bold text-xs">{p.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{p.category}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{p.trendScore}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-destructive">
                              <TrendingDown className="h-4 w-4" />
                              <span className="font-semibold">{p.weeklyChange}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {p.monthlyViews.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stable tab */}
          <TabsContent value="stable">
            <Card>
              <CardContent className="py-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className={thClass}>#</th>
                        <th className={thClass}>Product</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Trend Score</th>
                        <th className={thClass}>Weekly Change</th>
                        <th className={thClass}>Monthly Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stableProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-muted-foreground w-8">
                            {i + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <span className="font-bold text-xs">{p.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{p.category}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{p.trendScore}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              {p.weeklyChange > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : p.weeklyChange < 0 ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                              <span className="font-medium">{p.weeklyChange > 0 ? '+' : ''}{p.weeklyChange}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {p.monthlyViews.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FadeIn>
  );
}
