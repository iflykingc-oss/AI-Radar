'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, Star, Plus, Bell, AlertCircle } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

type Product = Database['public']['Tables']['products']['Row'];

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [recRes, recentRes] = await Promise.all([
          fetch('/api/recommendations/daily'),
          fetch('/api/products?sort=recent&limit=6'),
        ]);
        if (!recRes.ok || !recentRes.ok) {
          throw new Error('Failed to fetch data');
        }
        const [recData, recentData] = await Promise.all([recRes.json(), recentRes.json()]);
        setRecommendations(recData.products || []);
        setRecentProducts(recentData.products || []);
      } catch (e) {
        console.error('Failed to fetch home data:', e);
        setError('Failed to load your personalized feed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome + Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('welcome')}</h1>
          <p className="text-muted-foreground">{t('digest')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/discover">
              <Plus className="mr-2 h-4 w-4" /> {t('browse_all')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifications">
              <Bell className="mr-2 h-4 w-4" /> {t('notifications')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-warning" />
          <h2 className="text-xl font-semibold">{t('recommended')}</h2>
        </div>
        {error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>{tCommon('retry')}</Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((p) => (
              <ProductCard key={p.id} {...p} tags={p.tags || []} category={p.category || ''} confidence_score={p.confidence_score || 0} availability_status={p.availability_status || 'active'} pricing_model={p.pricing_model || 'free'} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Products */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t('recent')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProducts.map((p) => (
            <ProductCard key={p.id} {...p} tags={p.tags || []} category={p.category || ''} confidence_score={p.confidence_score || 0} availability_status={p.availability_status || 'active'} pricing_model={p.pricing_model || 'free'} />
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('watchlist_label')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">{t('products_tracked')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('new_today')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{recentProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('products_discovered')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('alerts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">{t('unread')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
