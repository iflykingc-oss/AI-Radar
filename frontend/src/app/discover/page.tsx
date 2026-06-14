'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { ProductCardGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { NoResults } from '@/components/empty-states/NoResults';
import { ErrorState } from '@/components/empty-states/ErrorState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Star,
  TrendingUp,
  Zap,
  Globe,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

type Product = Database['public']['Tables']['products']['Row'];

const CATEGORIES = [
  'LLM',
  'Image Generation',
  'Video Generation',
  'Speech/Audio',
  'AI Agents',
  'AI Coding',
  'AI Search',
  'AI Framework',
  'AI Platform',
  'MLOps',
  'Computer Vision',
  'NLP',
  'Robotics',
  'Other',
];

const PRICING_MODELS = [
  { value: 'free', label: 'Free', icon: '🆓' },
  { value: 'freemium', label: 'Freemium', icon: '🆓💎' },
  { value: 'paid', label: 'Paid', icon: '💰' },
  { value: 'open_source', label: 'Open Source', icon: '📦' },
];

const getSortOptions = (t: any) => [
  { value: 'recent', label: t('newest_first'), icon: <Calendar className="h-4 w-4" /> },
  { value: 'confidence', label: t('highest_score'), icon: <Star className="h-4 w-4" /> },
  { value: 'stars', label: t('most_stars'), icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'name', label: t('alphabetical'), icon: <ArrowUpDown className="h-4 w-4" /> },
];

const CONFIDENCE_LEVELS = [
  { value: 'high', label: 'High (80+)', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'medium', label: 'Medium (50-79)', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'low', label: 'Low (<50)', color: 'bg-red-500/10 text-red-600' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'low_active', label: 'Low Active', color: 'bg-amber-500/10 text-amber-600' },
];

const getTimeRanges = (t: any) => [
  { value: '7d', label: t('last_7_days') },
  { value: '30d', label: t('last_30_days') },
  { value: '90d', label: t('last_90_days') },
  { value: 'all', label: t('all_time') },
];

export default function DiscoverPage() {
  const t = useTranslations('discover');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    pricing: searchParams.get('pricing') || '',
    confidence: searchParams.get('confidence') || '',
    status: searchParams.get('status') || '',
    timeRange: searchParams.get('timeRange') || '',
    minStars: searchParams.get('minStars') || '',
    source: searchParams.get('source') || '',
  });

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Sync URL state
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '18');
      params.set('sort', sort);
      if (search) params.set('search', search);
      if (filters.category) params.set('category', filters.category);
      if (filters.pricing) params.set('pricing', filters.pricing);
      if (filters.confidence) params.set('confidence', filters.confidence);
      if (filters.minStars) params.set('minStars', filters.minStars);
      if (filters.source) params.set('source', filters.source);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error('Failed to fetch products:', e);
      setError(t('failed_to_load'));
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, filters, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search URL sync
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl({ search, page: '1' });
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
    updateUrl({ sort: newSort, page: '1' });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: filters[key as keyof typeof filters] === value ? '' : value };
    setFilters(newFilters);
    setPage(1);
    updateUrl({ [key]: newFilters[key as keyof typeof filters], page: '1' });
  };

  const clearAllFilters = () => {
    setSearch('');
    setFilters({
      category: '',
      pricing: '',
      confidence: '',
      status: '',
      timeRange: '',
      minStars: '',
      source: '',
    });
    setSort('recent');
    setPage(1);
    router.replace(pathname);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('subtitle', { count: total.toLocaleString() })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-12 pr-4 h-12 text-base"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-72 shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <h2 className="font-semibold">{t('filters')}</h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    {t('clear_all')}
                  </Button>
                )}
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('sort_by')}</h3>
                <div className="space-y-1">
                  {getSortOptions(t).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        sort === option.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('category')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={filters.category === cat ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => handleFilterChange('category', cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('pricing')}</h3>
                <div className="space-y-1">
                  {PRICING_MODELS.map((pricing) => (
                    <button
                      key={pricing.value}
                      onClick={() => handleFilterChange('pricing', pricing.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.pricing === pricing.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{pricing.icon}</span>
                      {pricing.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Level */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('confidence_level')}</h3>
                <div className="space-y-1">
                  {CONFIDENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleFilterChange('confidence', level.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.confidence === level.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${level.color}`}>
                        {level.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('status')}</h3>
                <div className="space-y-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleFilterChange('status', status.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.status === status.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GitHub Stars */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('min_stars')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['100', '1000', '5000', '10000'].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => handleFilterChange('minStars', filters.minStars === stars ? '' : stars)}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.minStars === stars
                          ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                          : 'border border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Star className="h-3 w-3" />
                      {parseInt(stars) >= 1000 ? `${parseInt(stars)/1000}k` : stars}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div>
                <h3 className="text-sm font-medium mb-3">{t('added')}</h3>
                <div className="space-y-1">
                  {getTimeRanges(t).map((range) => (
                    <button
                      key={range.value}
                      onClick={() => handleFilterChange('timeRange', range.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.timeRange === range.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                {activeFilterCount > 0 && (
                  <div className="hidden lg:flex items-center gap-2">
                    {filters.category && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.category}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('category', '')} />
                      </Badge>
                    )}
                    {filters.pricing && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.pricing}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('pricing', '')} />
                      </Badge>
                    )}
                    {filters.confidence && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.confidence}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('confidence', '')} />
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {loading ? t('loading') : `${total.toLocaleString()} ${t('products_found')}`}
              </p>
            </div>

            {/* Products Grid/List */}
            {error ? (
              <ErrorState message={error} onRetry={fetchProducts} />
            ) : loading ? (
              <ProductCardGridSkeleton count={6} />
            ) : products.length === 0 ? (
              <NoResults onClearFilters={clearAllFilters} />
            ) : viewMode === 'grid' ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
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
                  onClick={() => {
                    setPage(page - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => {
                          setPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage(page + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
