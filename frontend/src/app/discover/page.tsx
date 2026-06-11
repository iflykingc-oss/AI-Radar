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
import { CATEGORIES, PRICING_MODELS, SORT_OPTIONS } from '@/lib/constants';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

type Product = Database['public']['Tables']['products']['Row'];

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
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    pricing: searchParams.get('pricing') || '',
  });

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

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
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
  }, [page, sort, search, filters.category, filters.pricing, t]);

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
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAll = () => {
    setSearch('');
    setFilters({ category: '', pricing: '' });
    setSort('recent');
    setPage(1);
    router.replace(pathname);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (sort !== 'recent' ? 1 : 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className={`w-full lg:w-64 shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{t('filters')}</h2>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    {t('clear_all')}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setFilterOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <h3 className="text-sm font-medium mb-2">{t('category')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={filters.category === cat ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleFilterChange('category', cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-medium mb-2">{t('pricing')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {PRICING_MODELS.map((mode) => (
                    <Badge
                      key={mode}
                      variant={filters.pricing === mode ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => handleFilterChange('pricing', mode)}
                    >
                      {mode.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-10 pr-10 h-12 text-lg"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Toolbar: count + sort + mobile filter */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? t('loading') : `${total} ${t('products_found')}`}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFilterOpen(!filterOpen)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t('filters')} {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </div>
          </div>

          {/* Product Grid */}
          {error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : loading ? (
            <ProductCardGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <NoResults
              onClearFilters={() => {
                clearAll();
              }}
            />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
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
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
