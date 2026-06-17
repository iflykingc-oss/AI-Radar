'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Bookmark,
  Star,
  TrendingUp,
  Calendar,
  Globe,
  Tag,
  FolderOpen,
  DollarSign,
  Activity,
  ChevronRight,
  Clock,
  Users,
  Code,
  MessageSquare,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { getConfidenceLevel, formatConfidenceScore } from '@/lib/utils';
import { getStatusConfig, getPricingConfig } from '@/lib/constants';
import { LoginModal } from '@/components/auth/LoginModal';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  name_zh: string | null;
  description: string | null;
  description_en: string | null;
  description_zh: string | null;
  website_url: string | null;
  github_url: string | null;
  logo_url: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  tech_stack: string[];
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | null;
  availability_status: 'active' | 'low_active' | 'inactive' | 'dead';
  confidence_score: number;
  confidence_level: 'high' | 'medium' | 'low' | 'unverified';
  validation_signals: Record<string, any>;
  source_count: number;
  weekly_growth_rate: number;
  monthly_growth_rate: number;
  github_stars: number | null;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
  content_type?: string;
}

function getConfidenceText(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  if (score >= 20) return 'text-orange-500';
  return 'text-destructive';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const t = useTranslations('product_detail');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<ProductDetail[]>([]);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check auth status
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/check');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(!!data.role);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch similar products
  useEffect(() => {
    if (!product.category) return;
    fetch(`/api/products?category=${encodeURIComponent(product.category)}&limit=4`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.json();
      })
      .then((d) => {
        const filtered = (d.products || []).filter((p: ProductDetail) => p.id !== product.id).slice(0, 3);
        setSimilarProducts(filtered);
        setSimilarError(null);
      })
      .catch((e) => {
        console.error('Failed to fetch similar products:', e);
        setSimilarError('Failed to load similar products');
      });
  }, [product.category, product.id]);

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
        body: JSON.stringify({ product_id: product.id }),
      });
      if (res.ok) {
        setInWatchlist(!inWatchlist);
        toast({
          type: 'success',
          title: inWatchlist ? 'Removed from watchlist' : 'Added to watchlist',
          description: inWatchlist
            ? `${product.name} has been removed from your watchlist`
            : `${product.name} has been added to your watchlist`,
        });
      } else {
        toast({
          type: 'error',
          title: 'Failed to update watchlist',
          description: 'Please try again later',
        });
      }
    } catch (e) {
      console.error('Watchlist toggle failed:', e);
      toast({
        type: 'error',
        title: 'Failed to update watchlist',
        description: 'Please check your connection and try again',
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        type: 'success',
        title: 'Link copied!',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        type: 'error',
        title: 'Failed to copy link',
      });
    }
  };

  const status = getStatusConfig(product.availability_status);
  const pricing = getPricingConfig(product.pricing_model || 'free');
  const confidenceLevel = getConfidenceLevel(product.confidence_score);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/discover" className="hover:text-foreground transition-colors">
          {t('back_to_discover')}
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Main Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              {/* Logo */}
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
                {product.logo_url ? (
                  <Image src={product.logo_url} alt={product.name} width={56} height={56} className="object-cover rounded-lg" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{product.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Title + Meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{product.name}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {product.description || 'No description available'}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Confidence Score */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border ${getConfidenceText(product.confidence_score)}`}>
                <Activity className="h-3.5 w-3.5" />
                <span className={getConfidenceText(product.confidence_score)}>
                  {formatConfidenceScore(product.confidence_score)}
                </span>
                <span className="text-muted-foreground">confidence</span>
              </span>

              {/* Status */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>

              {/* Pricing */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pricing.color}`}>
                {pricing.label}
              </span>

              {/* Category */}
              {product.category && (
                <Badge variant="outline" className="gap-1">
                  <FolderOpen className="h-3 w-3" />
                  {product.category}
                </Badge>
              )}

              {/* Source Count */}
              {product.source_count > 1 && (
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  {product.source_count} sources
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {product.website_url && (
                <Button asChild>
                  <a href={product.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('visit_website')}
                  </a>
                </Button>
              )}
              {product.github_url && (
                <Button variant="outline" asChild>
                  <a href={product.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleWatchlistToggle}>
                <Bookmark className={`mr-2 h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
                {inWatchlist ? t('in_watchlist') : t('add_watchlist')}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-success" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Share'}
              </Button>
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="lg:w-80 shrink-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${getConfidenceText(product.confidence_score)}`}>
                    {formatConfidenceScore(product.confidence_score)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Confidence Score</p>
                </div>

                <div className="space-y-3">
                  {/* GitHub Stars */}
                  {product.github_stars !== null && product.github_stars > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span className="text-sm">GitHub Stars</span>
                      </div>
                      <span className="font-semibold">{product.github_stars.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Weekly Growth */}
                  {product.weekly_growth_rate !== undefined && product.weekly_growth_rate !== 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Weekly Growth</span>
                      </div>
                      <span className={`font-semibold ${product.weekly_growth_rate >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {product.weekly_growth_rate >= 0 ? '+' : ''}{product.weekly_growth_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Monthly Growth */}
                  {product.monthly_growth_rate !== undefined && product.monthly_growth_rate !== 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Monthly Growth</span>
                      </div>
                      <span className={`font-semibold ${product.monthly_growth_rate >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {product.monthly_growth_rate >= 0 ? '+' : ''}{product.monthly_growth_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Launch Date */}
                  {product.launch_date && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Launched</span>
                      </div>
                      <span className="font-medium">{formatDate(product.launch_date)}</span>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Updated</span>
                    </div>
                    <span className="font-medium">{timeAgo(product.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Description & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('about')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'No detailed description available for this product.'}
              </p>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          {product.tech_stack && product.tech_stack.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {t('tech_stack')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tech_stack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {t('tags')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.category && (
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{product.category}</span>
                </div>
              )}
              {product.pricing_model && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getPricingConfig(product.pricing_model).label}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getStatusConfig(product.availability_status).label}</span>
              </div>
              {product.source_count > 0 && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{product.source_count} data sources</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidence Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confidence Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Score</span>
                  <span className={`font-bold text-lg ${getConfidenceText(product.confidence_score)}`}>
                    {product.confidence_score}/100
                  </span>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-2 pt-2 border-t">
                  {product.source_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Multi-source</span>
                      <span className="text-xs font-medium">
                        {product.source_count >= 3 ? '✅ Strong' : product.source_count >= 2 ? '✅ Good' : '⚠️ Single'}
                      </span>
                    </div>
                  )}
                  {product.github_stars !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">GitHub Stars</span>
                      <span className="text-xs font-medium">
                        {product.github_stars >= 1000 ? '✅ Popular' : product.github_stars >= 100 ? '✅ Growing' : '⚠️ New'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Data Freshness</span>
                    <span className="text-xs font-medium">
                      {new Date(product.updated_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 ? '✅ Recent' : '⚠️ Old'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* External Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.website_url && (
                <a
                  href={product.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Official Website
                </a>
              )}
              {product.github_url && (
                <a
                  href={product.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                </a>
              )}
              {!product.website_url && !product.github_url && (
                <p className="text-sm text-muted-foreground">No external links available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar Products */}
      {similarError ? (
        <div className="mb-8 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {similarError}
        </div>
      ) : similarProducts.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('similar_products', { defaultValue: 'Similar Products' })}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarProducts.map((sp) => (
              <Link key={sp.id} href={`/discover/${sp.slug || sp.id}`} className="block">
                <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
                        {sp.logo_url ? (
                          <Image src={sp.logo_url} alt={sp.name} width={32} height={32} className="object-cover rounded-md" />
                        ) : (
                          <span className="text-lg font-bold text-primary">{sp.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{sp.name}</h3>
                        {sp.category && <p className="text-xs text-muted-foreground">{sp.category}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {sp.description || tCommon('no_description', { defaultValue: 'No description' })}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className={`text-xs font-semibold ${getConfidenceText(sp.confidence_score)}`}>
                        {formatConfidenceScore(sp.confidence_score)}
                      </span>
                      {sp.github_stars !== null && sp.github_stars > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ⭐ {sp.github_stars >= 1000 ? `${(sp.github_stars / 1000).toFixed(1)}k` : sp.github_stars}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Back Button */}
      <div className="text-center">
        <Button variant="outline" onClick={() => router.push('/discover')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back_to_discover')}
        </Button>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
