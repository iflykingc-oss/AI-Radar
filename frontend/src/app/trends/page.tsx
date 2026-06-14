'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ArrowUpRight,
  Zap,
  Clock,
  BarChart3,
  Activity,
  Globe,
  Flame,
  Loader2,
  Tag,
  Layers,
  Rocket,
  Eye,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import WordCloud from '@/components/WordCloud';

interface TrendingProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  confidence_score: number;
  github_stars: number | null;
  weekly_growth_rate: number;
  monthly_growth_rate: number;
  tags: string[];
  logo_url?: string | null;
  source: string;
  created_at: string;
  trend_score?: number;
  trend_category?: string;
}

interface TrendData {
  trending: TrendingProduct[];
  rising: TrendingProduct[];
  falling: TrendingProduct[];
  newThisWeek: TrendingProduct[];
  topCategories: { name: string; count: number; growth: number }[];
}

interface WordData {
  text: string;
  value: number;
}

function GrowthBadge({ value }: { value: number }) {
  if (value > 10) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><TrendingUp className="h-3 w-3" /> +{value.toFixed(1)}%</Badge>;
  if (value > 0) return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><TrendingUp className="h-3 w-3" /> +{value.toFixed(1)}%</Badge>;
  if (value < -5) return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 gap-1"><TrendingDown className="h-3 w-3" /> {value.toFixed(1)}%</Badge>;
  return <Badge variant="outline" className="gap-1"><Minus className="h-3 w-3" /> {value.toFixed(1)}%</Badge>;
}

function TrendCategoryBadge({ category }: { category: string }) {
  const config: Record<string, { icon: React.ReactNode; className: string }> = {
    hot: { icon: <Flame className="h-3 w-3" />, className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    rising: { icon: <TrendingUp className="h-3 w-3" />, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    stable: { icon: <Activity className="h-3 w-3" />, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    declining: { icon: <TrendingDown className="h-3 w-3" />, className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
  };

  const { icon, className } = config[category] || config.stable;

  return (
    <Badge variant="outline" className={className}>
      {icon} {category}
    </Badge>
  );
}

function MiniBarChart({ data, max }: { data: number[]; max: number }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/20 rounded-t-sm transition-all hover:bg-primary/40"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function TrendsPage() {
  const t = useTranslations('trends');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'rising' | 'new' | 'categories'>('trending');
  const [wordCloudData, setWordCloudData] = useState<WordData[]>([]);

  useEffect(() => {
    async function fetchTrends() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/trends/top20?limit=50');
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        setData(result);

        // Generate word cloud from tags
        const tagMap = new Map<string, number>();
        const allProducts = [
          ...(result.trending || []),
          ...(result.rising || []),
          ...(result.newThisWeek || []),
        ];

        allProducts.forEach((product: TrendingProduct) => {
          product.tags?.forEach((tag: string) => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
          });
        });

        const wordData = Array.from(tagMap.entries())
          .map(([text, value]) => ({ text, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 50);

        setWordCloudData(wordData);
      } catch (e) {
        console.error('Failed to fetch trends:', e);
        setError('Failed to load trends data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <BarChart3 className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load trends</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const trendingProducts = data?.trending || [];
  const risingProducts = data?.rising || [];
  const fallingProducts = data?.falling || [];
  const newProducts = data?.newThisWeek || [];
  const topCategories = data?.topCategories || [];

  const displayProducts = activeTab === 'trending'
    ? trendingProducts
    : activeTab === 'rising'
    ? risingProducts
    : activeTab === 'new'
    ? newProducts
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-purple-500/5 to-transparent">
        <div className="container-custom py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: `🔥 ${t('hot')}`, value: trendingProducts.filter(p => p.trend_category === 'hot').length, color: 'from-red-500 to-orange-500' },
            { label: `📈 ${t('rising')}`, value: risingProducts.length, color: 'from-emerald-500 to-teal-500' },
            { label: `📉 ${t('falling')}`, value: fallingProducts.length, color: 'from-gray-500 to-gray-600' },
            { label: `✨ ${tCommon('new')}`, value: newProducts.length, color: 'from-blue-500 to-cyan-500' },
            { label: `📂 ${tCommon('categories')}`, value: topCategories.length, color: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 overflow-hidden">
              <CardContent className="pt-5 pb-4 relative">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 bg-muted p-1 rounded-lg w-fit">
              {[
                { key: 'trending', label: `🔥 ${tCommon('trending')}`, count: trendingProducts.length },
                { key: 'rising', label: `📈 ${t('rising')}`, count: risingProducts.length },
                { key: 'new', label: `✨ ${tCommon('new')}`, count: newProducts.length },
                { key: 'categories', label: `📂 ${t('top_categories')}`, count: topCategories.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === 'categories' ? (
              /* Categories View */
              <div className="space-y-4">
                {topCategories.map((cat, index) => (
                  <Card key={cat.name} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{cat.name}</h3>
                          <p className="text-sm text-muted-foreground">{cat.count} products</p>
                        </div>
                        <GrowthBadge value={cat.growth} />
                      </div>
                      <div className="mt-3">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                            style={{ width: `${Math.min(100, (cat.count / (topCategories[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Products View */
              <div className="space-y-3">
                {displayProducts.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('no_data')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('no_data_desc')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  displayProducts.map((product, index) => (
                    <Link key={product.id} href={`/discover/${product.slug}`} className="block group">
                      <div className="bg-card rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold shrink-0 ${
                            index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Logo */}
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
                            {product.logo_url ? (
                              <img src={product.logo_url} alt={product.name} className="h-8 w-8 object-cover rounded-md" />
                            ) : (
                              <span className="text-lg font-bold text-primary">{product.name.charAt(0)}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                {product.name}
                              </h3>
                              {product.trend_category && (
                                <TrendCategoryBadge category={product.trend_category} />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {product.description}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 shrink-0">
                            {product.github_stars && product.github_stars > 0 && (
                              <div className="text-right hidden sm:block">
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <Star className="h-3.5 w-3.5 text-amber-500" />
                                  {product.github_stars >= 1000
                                    ? `${(product.github_stars / 1000).toFixed(1)}k`
                                    : product.github_stars.toLocaleString()}
                                </div>
                              </div>
                            )}
                            <GrowthBadge value={product.weekly_growth_rate || 0} />
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3 ml-14">
                          {product.tags?.slice(0, 4).map((tag) => (
                            <span key={tag} className="tag text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Word Cloud */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t('trending_tags')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <WordCloud words={wordCloudData} width={280} height={200} />
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t('top_categories')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCategories.slice(0, 6).map((cat, i) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{cat.count}</span>
                        <GrowthBadge value={cat.growth} />
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (cat.count / (topCategories[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Fastest Rising */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-emerald-500" />
                  {t('fastest_rising')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risingProducts.slice(0, 5).map((product, i) => (
                  <Link key={product.id} href={`/discover/${product.slug}`} className="flex items-center gap-3 group">
                    <span className={`text-sm font-bold w-5 ${i < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {product.name}
                      </p>
                    </div>
                    <GrowthBadge value={product.weekly_growth_rate || 0} />
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Most Viewed (by confidence) */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  {t('highest_confidence')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingProducts
                  .sort((a, b) => b.confidence_score - a.confidence_score)
                  .slice(0, 5)
                  .map((product, i) => (
                    <Link key={product.id} href={`/discover/${product.slug}`} className="flex items-center gap-3 group">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {product.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.confidence_score}%
                      </Badge>
                    </Link>
                  ))}
              </CardContent>
            </Card>

            {/* Ecosystem Stats */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('ecosystem')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: t('total_products'), value: '3,000+' },
                  { label: t('data_sources'), value: '15+' },
                  { label: t('rss_feeds'), value: '150+' },
                  { label: t('update_frequency'), value: t('daily') },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-medium">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
