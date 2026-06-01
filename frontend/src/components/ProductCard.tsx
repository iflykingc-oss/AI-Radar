'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, ExternalLink, Github } from 'lucide-react';
import { getConfidenceLevel, formatConfidenceScore } from '@/lib/utils';
import { LoginModal } from '@/components/auth/LoginModal';
import { useTranslations } from 'next-intl';

interface ProductCardProps {
  id: string;
  name: string;
  name_en?: string | null;
  name_zh?: string | null;
  description: string | null;
  logo_url?: string | null;
  tags: string[];
  category: string | null;
  confidence_score: number;
  availability_status: 'active' | 'low_active' | 'inactive' | 'dead';
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | null;
  website_url?: string | null;
  github_url?: string | null;
  is_in_watchlist?: boolean;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  low_active: 'warning',
  inactive: 'destructive',
  dead: 'destructive',
};

const pricingVariantMap: Record<string, 'success' | 'default' | 'secondary' | 'outline'> = {
  free: 'success',
  freemium: 'default',
  paid: 'secondary',
  open_source: 'outline',
};

export default function ProductCard({
  id,
  name,
  description,
  logo_url,
  tags,
  category,
  confidence_score,
  availability_status,
  pricing_model,
  website_url,
  github_url,
  is_in_watchlist,
}: ProductCardProps) {
  const [inWatchlist, setInWatchlist] = useState(is_in_watchlist);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const tStatus = useTranslations('availability');
  const tPricing = useTranslations('pricing_models');
  const tCommon = useTranslations('common');

  const confidence = getConfidenceLevel(confidence_score);
  const confidenceColor = {
    high: 'bg-success/10 text-success',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-destructive/10 text-destructive',
    unverified: 'bg-muted text-muted-foreground',
  }[confidence];

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    try {
      const method = inWatchlist ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ product_id: id }) : JSON.stringify({ product_id: id }),
      });
      if (res.ok) setInWatchlist(!inWatchlist);
    } catch (e) {
      console.error('Watchlist toggle failed:', e);
    }
  };

  const statusKey = availability_status as keyof typeof statusVariantMap;
  const pricingKey = (pricing_model || 'free') as keyof typeof pricingVariantMap;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {logo_url ? (
                <img src={logo_url} alt={name} className="h-10 w-10 object-cover" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{(name || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{name}</h3>
              <p className="text-sm text-muted-foreground">{category || tCommon('uncategorized', { defaultValue: 'Uncategorized' })}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleWatchlistToggle} className="h-8 w-8">
            <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{description || tCommon('no_description', { defaultValue: 'No description available' })}</p>

        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${confidenceColor}`}>
              {formatConfidenceScore(confidence_score)}
            </span>
            <Badge variant={statusVariantMap[statusKey]}>{tStatus(statusKey)}</Badge>
            <Badge variant={pricingVariantMap[pricingKey]}>{tPricing(pricingKey)}</Badge>
          </div>

          <div className="flex items-center space-x-1">
            {github_url && (
              <a href={github_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted transition-colors">
                <Github className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
            {website_url && (
              <a href={website_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted transition-colors">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
            <Link href={`/discover/${id}`} className="ml-1 text-sm font-medium text-primary hover:underline">
              {tCommon('details')}
            </Link>
          </div>
        </div>
      </CardContent>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </Card>
  );
}
