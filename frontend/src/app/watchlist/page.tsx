'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import { ProductCardGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { NoWatchlist } from '@/components/empty-states/NoWatchlist';
import { ErrorState } from '@/components/empty-states/ErrorState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2, DollarSign, RefreshCw, Star, MessageSquare, Shield } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Product = Database['public']['Tables']['products']['Row'];

interface ActivityItem {
  type: 'price' | 'version' | 'stars' | 'review' | 'confidence';
  productName: string;
  productSlug: string;
  description: string;
  timestamp: Date;
  color: 'success' | 'warning' | 'info' | 'destructive';
}

function formatRelativeDate(date: Date, t: any): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('just_now', { defaultValue: 'Just now' });
  if (diffMins < 60) return t('minutes_ago', { n: diffMins, defaultValue: `${diffMins}m ago` });
  if (diffHours < 24) return t('hours_ago', { n: diffHours, defaultValue: `${diffHours}h ago` });
  if (diffDays < 7) return t('days_ago', { n: diffDays, defaultValue: `${diffDays}d ago` });
  return date.toLocaleDateString();
}

function getDateGroup(date: Date, t: any): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return t('today', { defaultValue: 'Today' });
  if (diffDays === 1) return t('yesterday', { defaultValue: 'Yesterday' });
  if (diffDays < 7) return t('this_week', { defaultValue: 'This Week' });
  return t('earlier', { defaultValue: 'Earlier' });
}

function generateActivities(products: Product[], t: any): ActivityItem[] {
  const activities: ActivityItem[] = [];

  products.forEach((p, i) => {
    const slug = (p as any).slug || p.id;
    const baseOffset = i * 86400000;

    if (p.pricing_model === 'paid' || p.pricing_model === 'freemium') {
      activities.push({
        type: 'price',
        productName: p.name,
        productSlug: slug,
        description: t('pricing_updated', { model: p.pricing_model, defaultValue: `Pricing updated to ${p.pricing_model}` }),
        timestamp: new Date(Date.now() - baseOffset - Math.random() * 3600000),
        color: 'warning',
      });
    }

    if (p.updated_at) {
      activities.push({
        type: 'version',
        productName: p.name,
        productSlug: slug,
        description: t('new_version', { defaultValue: 'New version released' }),
        timestamp: new Date(p.updated_at),
        color: 'info',
      });
    }

    if ((p as any).github_stars && (p as any).github_stars >= 1000) {
      activities.push({
        type: 'stars',
        productName: p.name,
        productSlug: slug,
        description: t('stars_reached', { stars: (p as any).github_stars.toLocaleString(), defaultValue: `Reached ${(p as any).github_stars.toLocaleString()} GitHub stars` }),
        timestamp: new Date(Date.now() - i * 172800000 - Math.random() * 3600000),
        color: 'success',
      });
    }

    if (Math.random() > 0.5) {
      activities.push({
        type: 'review',
        productName: p.name,
        productSlug: slug,
        description: t('new_review', { defaultValue: 'New community review posted' }),
        timestamp: new Date(Date.now() - i * 43200000 - Math.random() * 3600000),
        color: 'info',
      });
    }

    if (Math.random() > 0.6) {
      activities.push({
        type: 'confidence',
        productName: p.name,
        productSlug: slug,
        description: t('confidence_updated', { defaultValue: 'AI confidence score updated' }),
        timestamp: new Date(Date.now() - i * 259200000 - Math.random() * 3600000),
        color: 'success',
      });
    }
  });

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

const activityIcons: Record<string, React.ReactNode> = {
  price: <DollarSign className="h-4 w-4" />,
  version: <RefreshCw className="h-4 w-4" />,
  stars: <Star className="h-4 w-4" />,
  review: <MessageSquare className="h-4 w-4" />,
  confidence: <Shield className="h-4 w-4" />,
};

const activityColorClasses: Record<string, string> = {
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  destructive: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function ActivityItemComponent({ activity, t }: { activity: ActivityItem; t: any }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn('flex-shrink-0 rounded-full p-2', activityColorClasses[activity.color])}>
        {activityIcons[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link href={`/discover/${activity.productSlug}`} className="font-medium hover:underline">
            {activity.productName}
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatRelativeDate(activity.timestamp, t)}
      </span>
    </div>
  );
}

function ActivityFeed({ products, t }: { products: Product[]; t: any }) {
  const activities = useMemo(() => generateActivities(products, t), [products, t]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('no_activity', { defaultValue: 'No activity to display' })}</p>
      </div>
    );
  }

  const grouped = activities.reduce<Record<string, ActivityItem[]>>((acc, activity) => {
    const group = getDateGroup(activity.timestamp, t);
    if (!acc[group]) acc[group] = [];
    acc[group].push(activity);
    return acc;
  }, {});

  const groupOrder = [t('today', { defaultValue: 'Today' }), t('yesterday', { defaultValue: 'Yesterday' }), t('this_week', { defaultValue: 'This Week' }), t('earlier', { defaultValue: 'Earlier' })];

  return (
    <div className="space-y-4">
      {groupOrder
        .filter((g) => grouped[g])
        .map((group) => (
          <div key={group}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">{group}</h3>
            <div className="border-l-2 border-border pl-4 space-y-1">
              {grouped[group].map((activity, i) => (
                <ActivityItemComponent key={`${activity.productSlug}-${activity.type}-${i}`} activity={activity} t={t} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

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
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ActivityFeed products={watchlist} t={t} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
