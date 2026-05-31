'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { ProductCardGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { NoWatchlist } from '@/components/empty-states/NoWatchlist';
import { ErrorState } from '@/components/empty-states/ErrorState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

type Product = Database['public']['Tables']['products']['Row'];

export default function WatchlistPage() {
  const t = useTranslations('watchlist');
  const tCommon = useTranslations('common');
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/watchlist');
      if (!res.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      const data = await res.json();
      setWatchlist(data.products || []);
    } catch (e) {
      console.error('Failed to fetch watchlist:', e);
      setError(t('failed_to_load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const removeFromWatchlist = async (productId: string) => {
    try {
      const res = await fetch(`/api/watchlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((p) => p.id !== productId));
      } else {
        throw new Error('Failed to remove');
      }
    } catch (e) {
      console.error('Failed to remove from watchlist:', e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('tracking')} {watchlist.length} {t('products_label')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">{t('all')} ({watchlist.length})</TabsTrigger>
          <TabsTrigger value="active">{t('active')}</TabsTrigger>
          <TabsTrigger value="changes">{t('changes')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {error ? (
            <ErrorState
              message={error}
              onRetry={fetchWatchlist}
            />
          ) : loading ? (
            <ProductCardGridSkeleton count={3} />
          ) : watchlist.length === 0 ? (
            <NoWatchlist />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard {...product} is_in_watchlist />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-14 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromWatchlist(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist
              .filter((p) => p.availability_status === 'active')
              .map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="changes">
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('no_recent_changes')}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
