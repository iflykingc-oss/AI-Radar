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
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatConfidenceScore, getConfidenceLevel } from '@/lib/utils';

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
}

interface TrendData {
  trending: TrendingProduct[];
  rising: TrendingProduct[];
  falling: TrendingProduct[];
  newThisWeek: TrendingProduct[];
  topCategories: { name: string; count: number; growth: number }[];
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-sm text-emerald-600">
        <TrendingUp className="h-3.5 w-3.5" />
        +{value.toFixed(1)}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-1 text-sm text-red-600">
        <TrendingDown className="h-3.5 w-3.5" />
        {value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      0%
    </span>
  );
}

export default function TrendsPage() {
  const t = useTranslations('trends');
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'rising' | 'new'>('trending');

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/trends/top20');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (e) {
        console.error('Failed to fetch trends:', e);
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

  const trendingProducts = data?.trending || [];
  const risingProducts = data?.rising || [];
  const newProducts = data?.newThisWeek || [];
  const topCategories = data?.topCategories || [];

  const displayProducts = activeTab === 'trending'
    ? trendingProducts
    : activeTab === 'rising'
    ? risingProducts
    : newProducts;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container-custom py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Trends</h1>
              <p className="text-sm text-muted-foreground">
                Discover what's trending in the AI ecosystem
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Trending Now',
              value: trendingProducts.length,
              icon: <Flame className="h-5 w-5" />,
              color: 'from-red-500 to-orange-500',
            },
            {
              label: 'Rising Fast',
              value: risingProducts.length,
              icon: <TrendingUp className="h-5 w-5" />,
              color: 'from-emerald-500 to-teal-500',
            },
            {
              label: 'New This Week',
              value: newProducts.length,
              icon: <Zap className="h-5 w-5" />,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'Categories',
              value: topCategories.length,
              icon: <Globe className="h-5 w-5" />,
              color: 'from-purple-500 to-pink-500',
            },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
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
                { key: 'trending', label: '🔥 Trending', count: trendingProducts.length },
                { key: 'rising', label: '📈 Rising', count: risingProducts.length },
                { key: 'new', label: '✨ New', count: newProducts.length },
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

            {/* Product List */}
            <div className="space-y-3">
              {displayProducts.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Trends will appear as the crawler collects more data
                    </p>
                  </CardContent>
                </Card>
              ) : (
                displayProducts.map((product, index) => (
                  <Link key={product.id} href={`/discover/${product.slug}`} className="block group">
                    <div className="bg-card rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-lg font-bold text-muted-foreground shrink-0">
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
                            {product.category && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {product.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 shrink-0">
                          {product.github_stars && product.github_stars > 0 && (
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                {product.github_stars >= 1000
                                  ? `${(product.github_stars / 1000).toFixed(1)}k`
                                  : product.github_stars.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">stars</div>
                            </div>
                          )}
                          <div className="text-right">
                            <GrowthIndicator value={product.weekly_growth_rate} />
                            <div className="text-xs text-muted-foreground">weekly</div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3 ml-14">
                        {product.tags.slice(0, 4).map((tag) => (
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Categories */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Top Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  topCategories.slice(0, 8).map((cat, i) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{cat.count} products</span>
                      </div>
                      <MiniBar
                        value={cat.count}
                        max={topCategories[0]?.count || 1}
                        color={i < 3 ? 'bg-gradient-to-r from-primary to-cyan-500' : 'bg-muted-foreground/30'}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Ecosystem Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <span className="font-semibold">{(trendingProducts.length + risingProducts.length + newProducts.length).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Sources</span>
                  <span className="font-semibold">15+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">RSS Feeds</span>
                  <span className="font-semibold">150+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Daily
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Top Risers */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Fastest Growing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risingProducts.slice(0, 5).map((product, i) => (
                  <Link key={product.id} href={`/discover/${product.slug}`} className="flex items-center gap-3 group">
                    <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {product.name}
                      </p>
                    </div>
                    <GrowthIndicator value={product.weekly_growth_rate} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
