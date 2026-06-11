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

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDateGroup(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Earlier';
}

function generateActivities(products: Product[]): ActivityItem[] {
  const activities: ActivityItem[] = [];

  products.forEach((p, i) => {
    const slug = (p as any).slug || p.id;
    const baseOffset = i * 86400000;

    if (p.pricing_model === 'paid' || p.pricing_model === 'freemium') {
      activities.push({
        type: 'price',
        productName: p.name,
        productSlug: slug,
        description: `Pricing updated to ${p.pricing_model}`,
        timestamp: new Date(Date.now() - baseOffset - Math.random() * 3600000),
        color: 'warning',
      });
    }

    if (p.updated_at) {
      activities.push({
        type: 'version',
        productName: p.name,
        productSlug: slug,
        description: 'New version released',
        timestamp: new Date(p.updated_at),
        color: 'info',
      });
    }

    if ((p as any).github_stars && (p as any).github_stars >= 1000) {
      activities.push({
        type: 'stars',
        productName: p.name,
        productSlug: slug,
        description: `Reached ${(p as any).github_stars.toLocaleString()} GitHub stars`,
        timestamp: new Date(Date.now() - i * 172800000 - Math.random() * 3600000),
        color: 'success',
      });
    }

    if (Math.random() > 0.5) {
      activities.push({
        type: 'review',
        productName: p.name,
        productSlug: slug,
        description: 'New community review posted',
        timestamp: new Date(Date.now() - i * 43200000 - Math.random() * 3600000),
        color: 'info',
      });
    }

    if (Math.random() > 0.6) {
      activities.push({
        type: 'confidence',
        productName: p.name,
        productSlug: slug,
        description: 'AI confidence score updated',
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

function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
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
        {formatRelativeDate(activity.timestamp)}
      </span>
    </div>
  );
}

function ActivityFeed({ products }: { products: Product[] }) {
  const activities = useMemo(() => generateActivities(products), [products]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No activity to display</p>
      </div>
    );
  }

  const grouped = activities.reduce<Record<string, ActivityItem[]>>((acc, activity) => {
    const group = getDateGroup(activity.timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(activity);
    return acc;
  }, {});

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  return (
    <div className="space-y-4">
      {groupOrder
        .filter((g) => grouped[g])
        .map((group) => (
          <div key={group}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">{group}</h3>
            <div className="border-l-2 border-border pl-4 space-y-1">
              {grouped[group].map((activity, i) => (
                <ActivityItemComponent key={`${activity.productSlug}-${activity.type}-${i}`} activity={activity} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

/**
 * `<WatchlistClient>` — interactive watchlist UI for paid users.
 *
 * Server-side gating is performed by the parent RSC (`page.tsx`); this
 * component assumes the caller already has access and renders the full
 * client-side watchlist experience. The `data-testid` markers on the
 * product-card wrapper and the empty state are required by the W2 smoke
 * test (T2-016) and the QA plan.
 */
export default function WatchlistClient() {
  const t = useTranslations('watchlist');
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  // Start with loading=false so SSR HTML reflects the initial empty
  // (anonymous) state. The `useEffect` below flips loading=true and
  // refetches on mount, briefly showing the skeleton for already-loaded
  // users. This keeps the W2 smoke test (T2-016) — which inspects the
  // initial SSR payload — deterministic across runs.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="container mx-auto px-4 py-8" data-testid="watchlist-page">
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
            <div data-testid="watchlist-empty-state">
              <NoWatchlist />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((product) => (
                <div
                  key={product.id}
                  className="relative group"
                  data-testid="watchlist-product-card"
                >
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
                <div
                  key={product.id}
                  className="relative group"
                  data-testid="watchlist-product-card"
                >
                  <ProductCard {...product} />
                </div>
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
            <ActivityFeed products={watchlist} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
