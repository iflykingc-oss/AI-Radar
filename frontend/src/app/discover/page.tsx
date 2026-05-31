'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { ProductCardGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { NoResults } from '@/components/empty-states/NoResults';
import { ErrorState } from '@/components/empty-states/ErrorState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORIES, PRICING_MODELS } from '@/lib/constants';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

type Product = Database['public']['Tables']['products']['Row'];

export default function DiscoverPage() {
  const t = useTranslations('discover');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    region: '',
    pricing: '',
    confidence: '',
  });

  const fetchProducts = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filters.category) params.set('category', filters.category);
      if (filters.pricing) params.set('pricing', filters.pricing);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error('Failed to fetch products:', e);
      setError(t('failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, filters.category, filters.pricing]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ category: '', region: '', pricing: '', confidence: '' })}
                  >
                    {t('clear_all')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setFilterOpen(false)}
                >
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
                      onClick={() => setFilters((f) => ({ ...f, category: f.category === cat ? '' : cat }))}
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
                      onClick={() => setFilters((f) => ({ ...f, pricing: f.pricing === mode ? '' : mode }))}
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
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? t('loading') : `${products.length} ${t('products_found')}`}
            </p>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFilterOpen(!filterOpen)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t('filters')} {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          {/* Product Grid */}
          {error ? (
            <ErrorState
              message={error}
              onRetry={fetchProducts}
            />
          ) : loading ? (
            <ProductCardGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <NoResults
              onClearFilters={() => {
                setSearch('');
                setFilters({ category: '', region: '', pricing: '', confidence: '' });
              }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
