'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, ExternalLink, Github, Star, ArrowUpRight } from 'lucide-react';
import { getConfidenceLevel, formatConfidenceScore } from '@/lib/utils';
import { getStatusConfig, getPricingConfig } from '@/lib/constants';
import { LoginModal } from '@/components/auth/LoginModal';
import { useTranslations } from 'next-intl';

interface ProductCardProps {
  id: string;
  slug: string;
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
  github_stars?: number | null;
  is_in_watchlist?: boolean;
  content_type?: string;
}

export default function ProductCard({
  id,
  slug,
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
  github_stars,
  is_in_watchlist,
  content_type,
}: ProductCardProps) {
  const [inWatchlist, setInWatchlist] = useState(is_in_watchlist);
  const [loginOpen, setLoginOpen] = useState(false);
  const tCommon = useTranslations('common');

  const confidence = getConfidenceLevel(confidence_score);
  const scoreClass = confidence === 'high' ? 'score-high' : confidence === 'medium' ? 'score-medium' : 'score-low';
  const status = getStatusConfig(availability_status);
  const pricing = getPricingConfig(pricing_model || 'free');

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loginOpen) {
      setLoginOpen(true);
      return;
    }
    try {
      const method = inWatchlist ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id }),
      });
      if (res.ok) setInWatchlist(!inWatchlist);
    } catch (e) {
      console.error('Watchlist toggle failed:', e);
    }
  };

  return (
    <>
      <Link href={`/discover/${slug}`} className="block group">
        <div className="relative bg-card rounded-xl border border-border/50 p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1">
          {/* Header: Logo + Name + Bookmark */}
          <div className="flex items-start gap-3 mb-3">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
              {logo_url ? (
                <Image src={logo_url} alt={name} width={36} height={36} className="object-cover rounded-md" />
              ) : (
                <span className="text-lg font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                  {name}
                </h3>
                {content_type === 'news' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    News
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {category || tCommon('uncategorized', { defaultValue: 'Uncategorized' })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleWatchlistToggle}
              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
            {description || tCommon('no_description', { defaultValue: 'No description available' })}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>

          {/* Footer: Score + Status + Links */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className={`score-badge ${scoreClass}`}>
                {formatConfidenceScore(confidence_score)}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${status.color}`}>
                {status.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${pricing.color}`}>
                {pricing.label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {github_url && github_stars && github_stars > 0 && (
                <a
                  href={github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Star className="h-3 w-3" />
                  {github_stars >= 1000 ? `${(github_stars / 1000).toFixed(1)}k` : github_stars.toLocaleString()}
                </a>
              )}
              <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
