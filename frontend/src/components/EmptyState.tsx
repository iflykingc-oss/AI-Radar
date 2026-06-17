'use client';

import { Button } from '@/components/ui/button';
import { Search, Bookmark, TrendingUp, Newspaper, Package, Filter } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: 'search' | 'bookmark' | 'trending' | 'news' | 'package' | 'filter';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const icons = {
  search: Search,
  bookmark: Bookmark,
  trending: TrendingUp,
  news: Newspaper,
  package: Package,
  filter: Filter,
};

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">{description}</p>

      <div className="flex gap-3">
        {action && (
          action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )
        )}
        {secondaryAction && (
          secondaryAction.href ? (
            <Button variant="outline" asChild>
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
          )
        )}
      </div>
    </div>
  );
}

export function NoSearchResults({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or clear your filters.`}
      action={onClear ? { label: 'Clear Filters', onClick: onClear } : undefined}
    />
  );
}

export function NoProducts({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon="package"
      title="No products yet"
      description="Products will appear here once the crawler collects data. Check back later!"
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  );
}

export function NoNews({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon="news"
      title="No news yet"
      description="AI industry news will appear here once the crawler collects data."
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  );
}

export function NoWatchlist() {
  return (
    <EmptyState
      icon="bookmark"
      title="Your watchlist is empty"
      description="Save products to your watchlist to track them and get updates."
      action={{ label: 'Discover Products', href: '/discover' }}
    />
  );
}
