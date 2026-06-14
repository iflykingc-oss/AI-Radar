'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  ExternalLink,
  Clock,
  ArrowUpRight,
  Newspaper,
  TrendingUp,
  Zap,
  Building2,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NewsItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tags: string[];
  source: string;
  source_url: string;
  website_url: string | null;
  created_at: string;
  confidence_score: number;
}

const sourceIcons: Record<string, string> = {
  rss: '📰',
  aihot: '🔥',
  twitter: '🐦',
  bluesky: '🦋',
  reddit: '🤖',
  hackernews: '🟠',
};

const sourceColors: Record<string, string> = {
  rss: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  aihot: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  twitter: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  bluesky: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  reddit: 'bg-red-500/10 text-red-600 dark:text-red-400',
  hackernews: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'LLM': <Zap className="h-4 w-4" />,
  'Funding': <TrendingUp className="h-4 w-4" />,
  'Acquisition': <Building2 className="h-4 w-4" />,
  'Product Launch': <ArrowUpRight className="h-4 w-4" />,
  'Research': <Newspaper className="h-4 w-4" />,
  'Regulation': <Globe className="h-4 w-4" />,
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewsPage() {
  const t = useTranslations('news');
  const tCommon = useTranslations('common');

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const sources = [
    { value: '', label: t('all_sources') },
    { value: 'rss', label: '📰 RSS' },
    { value: 'aihot', label: '🔥 AIhot' },
    { value: 'twitter', label: '🐦 Twitter' },
    { value: 'reddit', label: '🤖 Reddit' },
    { value: 'hackernews', label: '🟠 Hacker News' },
  ];

  const categories = [
    { value: '', label: t('all_categories') },
    { value: 'Funding', label: `💰 ${t('funding')}` },
    { value: 'Acquisition', label: `🏢 ${t('acquisition')}` },
    { value: 'Product Launch', label: `🚀 ${t('product_launch')}` },
    { value: 'Research', label: `🔬 ${t('research')}` },
    { value: 'Regulation', label: `⚖️ ${t('regulation')}` },
    { value: 'LLM', label: '🧠 LLM' },
  ];

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      params.set('content_type', 'news');
      if (search) params.set('search', search);
      if (selectedSource) params.set('source', selectedSource);
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNews(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error('Failed to fetch news:', e);
      setError(tCommon('error_desc', { defaultValue: 'Failed to load news. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedSource, selectedCategory, tCommon]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const clearFilters = () => {
    setSearch('');
    setSelectedSource('');
    setSelectedCategory('');
    setPage(1);
  };

  const hasFilters = search || selectedSource || selectedCategory;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container-custom py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
              <Newspaper className="h-5 w-5" />
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
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Source Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sources.map((source) => (
              <Button
                key={source.value}
                variant={selectedSource === source.value ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setSelectedSource(source.value);
                  setPage(1);
                }}
              >
                {source.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => {
                setSelectedCategory(cat.value);
                setPage(1);
              }}
            >
              {cat.label}
            </Button>
          ))}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${total} news articles found`}
          </p>
        </div>

        {/* News List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Newspaper className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{tCommon('error_title', { defaultValue: 'Something went wrong' })}</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchNews}>
              {tCommon('retry', { defaultValue: 'Retry' })}
            </Button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('no_news')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasFilters ? t('adjust_filters') : t('no_news_desc')}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {tCommon('clear_filters', { defaultValue: 'Clear filters' })}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <Link key={item.id} href={`/discover/${item.slug}`} className="block group">
                <div className="bg-card rounded-xl border border-border/50 p-5 transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    {/* Source Icon */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${sourceColors[item.source] || 'bg-muted'}`}>
                      {sourceIcons[item.source] || '📰'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {/* Category */}
                        {item.category && (
                          <Badge variant="outline" className="text-xs gap-1">
                            {categoryIcons[item.category]}
                            {item.category}
                          </Badge>
                        )}

                        {/* Tags */}
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag text-xs">
                            {tag}
                          </span>
                        ))}

                        {/* Time */}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Clock className="h-3 w-3" />
                          {timeAgo(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
