'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Bookmark,
  Star,
  TrendingUp,
  Calendar,
  RefreshCw,
  Globe,
  Shield,
  Users,
  Cpu,
  ChevronRight,
  Plus,
  Zap,
  HeartPulse,
  Rocket,
  Check,
  X,
  Image as ImageIcon,
  ChevronLeft,
  DollarSign,
  Clock,
} from 'lucide-react';
import { getConfidenceLevel, formatConfidenceScore } from '@/lib/utils';
import { LoginModal } from '@/components/auth/LoginModal';
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
  contributor_count?: number | null;
  open_issues_count?: number | null;
  latest_release_date?: string | null;
  github_stars_history?: Array<{ date: string; stars: number }> | null;
}

interface ValidationDimension {
  key: string;
  label: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  colorClass?: string;
  progressClassName?: string;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
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

function calculateVerificationScore(
  product: ProductDetail
): { freshness: number; activity: number; security: number; trust: number; starVelocity: number; communityHealth: number; releaseMomentum: number; overall: number } {
  // 1. Freshness: Based on how recently the product was created/updated
  const now = new Date();
  const updatedAt = new Date(product.updated_at);
  const daysSinceUpdate = Math.max(0, (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

  let freshness: number;
  if (daysSinceUpdate <= 30) {
    freshness = 95 + Math.round((30 - daysSinceUpdate) / 30 * 5); // 95-100
  } else if (daysSinceUpdate <= 90) {
    const ratio = (90 - daysSinceUpdate) / 60;
    freshness = 85 + Math.round(ratio * 10); // 85-95
  } else {
    const ratio = Math.min(1, 180 / Math.max(1, daysSinceUpdate));
    freshness = 70 + Math.round(ratio * 15); // 70-85
  }
  freshness = Math.min(100, Math.max(0, freshness));

  // 2. Activity: Based on GitHub metrics (stars, forks from validation_signals)
  const signals = product.validation_signals || {};
  const githubStars = product.github_stars || 0;
  const githubForks = signals.github_forks || 0;
  const weeklyGrowth = product.weekly_growth_rate || 0;

  let activity: number;
  if (githubStars > 10000) {
    activity = 95;
  } else if (githubStars > 1000) {
    activity = 85 + Math.round((githubStars - 1000) / 9000 * 10);
  } else if (githubStars > 100) {
    activity = 75 + Math.round((githubStars - 100) / 900 * 10);
  } else {
    activity = 60 + Math.round(githubStars / 100 * 5);
  }
  // Bonus for forks and weekly growth
  if (githubForks > 100) activity += 3;
  if (weeklyGrowth > 5) activity += 2;
  activity = Math.min(100, Math.max(0, activity));

  // 3. Security: Based on whether the product has a website, privacy policy, etc.
  let security = 80; // Base score
  if (product.website_url) security += 5;
  if (signals.has_privacy_policy) security += 5;
  if (signals.ssl_enabled) security += 5;
  if (product.confidence_score > 80) security += 3;
  if (product.validation_signals?.custom_domain) security += 2;
  security = Math.min(100, Math.max(0, security));

  // 4. Trust: Based on githubStars threshold
  let trust: number;
  if (githubStars >= 10000) {
    trust = 95 + Math.round((githubStars - 10000) / 90000 * 5); // 95-100
  } else if (githubStars >= 1000) {
    trust = 85 + Math.round((githubStars - 1000) / 9000 * 10); // 85-95
  } else if (githubStars >= 100) {
    trust = 75 + Math.round((githubStars - 100) / 900 * 10); // 75-85
  } else {
    trust = 65 + Math.round(githubStars / 100 * 10); // 65-75
  }
  trust = Math.min(100, Math.max(0, trust));

  // 5. Star Velocity: How fast is the project gaining stars?
  let starVelocity: number;
  if (product.weekly_growth_rate !== undefined && product.weekly_growth_rate !== null) {
    const rate = product.weekly_growth_rate;
    if (rate >= 50) {
      starVelocity = 95 + Math.min(5, Math.round((rate - 50) / 50 * 5));
    } else if (rate >= 20) {
      starVelocity = 85 + Math.round((rate - 20) / 30 * 10);
    } else if (rate >= 5) {
      starVelocity = 70 + Math.round((rate - 5) / 15 * 15);
    } else if (rate >= 0) {
      starVelocity = 50 + Math.round((rate / 5) * 20);
    } else {
      // Declining: rate is negative
      starVelocity = Math.max(30, 50 + Math.round((rate / 5) * 20));
    }
  } else if (product.github_stars_history && product.github_stars_history.length >= 2) {
    // Calculate 7-day growth rate from history
    const history = product.github_stars_history;
    const latest = history[history.length - 1];
    const weekAgo = history[history.length - Math.min(8, history.length)];
    if (weekAgo && weekAgo.stars > 0) {
      const rate = ((latest.stars - weekAgo.stars) / weekAgo.stars) * 100;
      if (rate >= 50) {
        starVelocity = 95 + Math.min(5, Math.round((rate - 50) / 50 * 5));
      } else if (rate >= 20) {
        starVelocity = 85 + Math.round((rate - 20) / 30 * 10);
      } else if (rate >= 5) {
        starVelocity = 70 + Math.round((rate - 5) / 15 * 15);
      } else if (rate >= 0) {
        starVelocity = 50 + Math.round((rate / 5) * 20);
      } else {
        starVelocity = Math.max(30, 50 + Math.round((rate / 5) * 20));
      }
    } else {
      starVelocity = 50;
    }
  } else {
    // Fallback: use github_stars as proxy for velocity base
    if (githubStars >= 10000) {
      starVelocity = 80;
    } else if (githubStars >= 1000) {
      starVelocity = 70;
    } else if (githubStars >= 100) {
      starVelocity = 60;
    } else {
      starVelocity = 45;
    }
  }
  starVelocity = Math.min(100, Math.max(0, starVelocity));

  // 6. Community Health: Contributor activity and issue handling
  let communityHealth: number;
  if (product.contributor_count !== undefined && product.contributor_count !== null) {
    const cc = product.contributor_count;
    if (cc >= 50) {
      communityHealth = 90 + Math.min(10, Math.round((cc - 50) / 50 * 10));
    } else if (cc >= 10) {
      communityHealth = 75 + Math.round((cc - 10) / 40 * 15);
    } else if (cc >= 3) {
      communityHealth = 60 + Math.round((cc - 3) / 7 * 15);
    } else {
      communityHealth = 40 + Math.round((cc / 3) * 20);
    }
  } else if (githubForks > 0) {
    // Fallback: use github_forks as proxy
    if (githubForks >= 1000) {
      communityHealth = 85;
    } else if (githubForks >= 100) {
      communityHealth = 70;
    } else if (githubForks >= 10) {
      communityHealth = 55;
    } else {
      communityHealth = 45;
    }
  } else {
    communityHealth = 45;
  }

  // Adjust based on open issues ratio if available
  if (product.open_issues_count !== undefined && product.open_issues_count !== null) {
    const openIssues = product.open_issues_count;
    const totalIssues = signals.github_total_issues || openIssues;
    if (totalIssues > 0 && totalIssues >= openIssues) {
      const ratio = openIssues / totalIssues;
      if (ratio < 0.2) {
        communityHealth += 10;
      } else if (ratio > 0.5) {
        communityHealth -= 10;
      }
    }
  }
  communityHealth = Math.min(100, Math.max(0, communityHealth));

  // 7. Release Momentum: How actively is the project shipping?
  let releaseMomentum: number;
  const releaseDateStr = product.latest_release_date || product.updated_at;
  const releaseDate = new Date(releaseDateStr);
  const daysSinceRelease = Math.max(0, (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceRelease <= 7) {
    releaseMomentum = 95 + Math.round((7 - daysSinceRelease) / 7 * 5);
  } else if (daysSinceRelease <= 30) {
    releaseMomentum = 80 + Math.round((30 - daysSinceRelease) / 23 * 15);
  } else if (daysSinceRelease <= 90) {
    releaseMomentum = 60 + Math.round((90 - daysSinceRelease) / 60 * 20);
  } else if (daysSinceRelease <= 180) {
    releaseMomentum = 40 + Math.round((180 - daysSinceRelease) / 90 * 20);
  } else {
    releaseMomentum = Math.max(20, 40 - Math.round((daysSinceRelease - 180) / 180 * 20));
  }
  releaseMomentum = Math.min(100, Math.max(0, releaseMomentum));

  // Overall: weighted average of all 7 dimensions
  const overall = Math.round(
    freshness * 0.15 +
    activity * 0.15 +
    security * 0.10 +
    trust * 0.10 +
    starVelocity * 0.20 +
    communityHealth * 0.15 +
    releaseMomentum * 0.15
  );

  return { freshness, activity, security, trust, starVelocity, communityHealth, releaseMomentum, overall };
}

function deriveValidationDimensions(
  product: ProductDetail,
  tVer: ReturnType<typeof useTranslations>
): ValidationDimension[] {
  const scores = calculateVerificationScore(product);

  return [
    {
      key: 'data_freshness',
      label: tVer('ver_freshness_label'),
      score: scores.freshness,
      icon: <RefreshCw className="h-4 w-4" />,
      description: tVer('ver_freshness_desc'),
    },
    {
      key: 'multi_source',
      label: tVer('ver_multi_label'),
      score: scores.activity,
      icon: <Shield className="h-4 w-4" />,
      description: tVer('ver_multi_desc'),
    },
    {
      key: 'engagement',
      label: tVer('ver_engagement_label'),
      score: scores.security,
      icon: <Users className="h-4 w-4" />,
      description: tVer('ver_engagement_desc'),
    },
    {
      key: 'technical_viability',
      label: tVer('ver_technical_label'),
      score: scores.trust,
      icon: <Cpu className="h-4 w-4" />,
      description: tVer('ver_technical_desc'),
    },
    {
      key: 'star_velocity',
      label: tVer('ver_star_velocity_label', { defaultValue: 'Star Velocity' }),
      score: scores.starVelocity,
      icon: <Zap className="h-4 w-4" />,
      description: tVer('ver_star_velocity_desc', { defaultValue: 'How fast the project is gaining stars' }),
      colorClass: 'text-purple-500',
      progressClassName: '[&>div]:bg-purple-500',
    },
    {
      key: 'community_health',
      label: tVer('ver_community_health_label', { defaultValue: 'Community Health' }),
      score: scores.communityHealth,
      icon: <HeartPulse className="h-4 w-4" />,
      description: tVer('ver_community_health_desc', { defaultValue: 'Contributor activity and issue handling' }),
      colorClass: 'text-orange-500',
      progressClassName: '[&>div]:bg-orange-500',
    },
    {
      key: 'release_momentum',
      label: tVer('ver_release_momentum_label', { defaultValue: 'Release Momentum' }),
      score: scores.releaseMomentum,
      icon: <Rocket className="h-4 w-4" />,
      description: tVer('ver_release_momentum_desc', { defaultValue: 'How actively the project is shipping' }),
      colorClass: 'text-pink-500',
      progressClassName: '[&>div]:bg-pink-500',
    },
  ];
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function deriveFeatures(product: ProductDetail): { label: string; included: boolean }[] {
  // Try to use product.features if available (cast to any since it's not in interface)
  const anyProduct = product as any;
  if (anyProduct.features && Array.isArray(anyProduct.features) && anyProduct.features.length > 0) {
    return anyProduct.features.map((f: string | { name: string; included?: boolean }) => {
      if (typeof f === 'string') return { label: f, included: true };
      return { label: f.name || f, included: f.included !== false };
    });
  }

  // Derive from tags and tech_stack
  const derivedFeatures: { label: string; included: boolean }[] = [];

  // Common feature keywords from tags
  const tagFeatures = [
    { keywords: ['api', 'rest', 'graphql', 'sdk'], label: 'API Integration', icon: '🔌' },
    { keywords: ['ml', 'machine learning', 'ai', 'llm', 'nlp'], label: 'AI/ML Powered', icon: '🤖' },
    { keywords: ['cloud', 'saas', 'hosted'], label: 'Cloud/SaaS', icon: '☁️' },
    { keywords: ['open source', 'oss'], label: 'Open Source', icon: '📦' },
    { keywords: ['real-time', 'realtime', 'streaming'], label: 'Real-time Processing', icon: '⚡' },
    { keywords: ['dashboard', 'analytics', 'monitoring'], label: 'Analytics Dashboard', icon: '📊' },
    { keywords: ['auth', 'oauth', 'sso', 'security'], label: 'Authentication & Security', icon: '🔒' },
    { keywords: ['mobile', 'ios', 'android', 'responsive'], label: 'Mobile Support', icon: '📱' },
    { keywords: ['plugin', 'extension', 'integration'], label: 'Plugin System', icon: '🧩' },
    { keywords: ['cli', 'command line', 'terminal'], label: 'CLI Tool', icon: '💻' },
    { keywords: ['docker', 'container', 'kubernetes'], label: 'Container Support', icon: '🐳' },
    { keywords: ['automation', 'workflow', 'pipeline'], label: 'Automation', icon: '🔄' },
    { keywords: ['collaboration', 'team', 'multi-user'], label: 'Team Collaboration', icon: '👥' },
    { keywords: ['customization', 'configurable', 'theme'], label: 'Customization', icon: '🎨' },
    { keywords: ['export', 'import', 'sync'], label: 'Data Export/Import', icon: '📤' },
    { keywords: ['documentation', 'docs', 'tutorial'], label: 'Documentation', icon: '📖' },
    { keywords: ['webhook', 'event', 'notification'], label: 'Webhooks & Events', icon: '🔔' },
    { keywords: ['scalable', 'performance', 'fast'], label: 'High Performance', icon: '🚀' },
    { keywords: ['free', 'open'], label: 'Free Tier Available', icon: '🎁' },
    { keywords: ['support', 'community'], label: 'Community Support', icon: '💬' },
  ];

  const lowerTags = product.tags.map((t) => t.toLowerCase());
  const lowerTech = product.tech_stack.map((t) => t.toLowerCase());
  const lowerDesc = (product.description || '').toLowerCase();

  for (const feature of tagFeatures) {
    const matches =
      lowerTags.some((tag) => feature.keywords.some((kw) => tag.includes(kw))) ||
      lowerTech.some((tech) => feature.keywords.some((kw) => tech.includes(kw))) ||
      feature.keywords.some((kw) => lowerDesc.includes(kw));
    if (matches) {
      derivedFeatures.push({ label: feature.label, included: true });
    }
    if (derivedFeatures.length >= 8) break;
  }

  // Fallback: use raw tags as features
  if (derivedFeatures.length === 0) {
    for (const tag of product.tags.slice(0, 8)) {
      derivedFeatures.push({ label: tag, included: true });
    }
  }

  return derivedFeatures;
}

function getFreeTierFeatures(product: ProductDetail): string[] {
  const features = [
    'Basic access',
    'Community support',
    'Core functionality',
    'Public API (limited)',
  ];

  if (product.pricing_model === 'freemium') {
    features.push('Up to 3 projects');
    features.push('Basic analytics');
  }

  if (product.tags.some((t) => t.toLowerCase().includes('open source'))) {
    features.push('Self-hosting available');
    features.push('Community contributions');
  }

  return features.slice(0, 6);
}

function getPaidTierFeatures(product: ProductDetail): string[] {
  const features = [
    'Full access to all features',
    'Priority support',
    'Advanced analytics',
    'Unlimited projects',
    'API access (unlimited)',
    'Team collaboration',
    'Custom integrations',
    'Dedicated account manager',
  ];

  if (product.tech_stack.some((t) => t.toLowerCase().includes('api'))) {
    features.push('Webhook support');
    features.push('Custom endpoints');
  }

  return features.slice(0, 8);
}

export default function ProductDetailClient({
  product,
}: {
  product: ProductDetail;
}) {
  const router = useRouter();

  const t = useTranslations('product_detail');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('availability');
  const tPricing = useTranslations('pricing_models');
  const tVer = useTranslations('landing');

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<ProductDetail[]>([]);

  // Generate screenshot URLs
  const screenshots = [1, 2, 3, 4].map(
    (i) => `https://placehold.co/800x500/1a1a2e/16213e?text=Screenshot+${i}`
  );

  // Fetch similar products
  const fetchSimilarProducts = async () => {
    if (!product.category) return;
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(product.category)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.products || []).filter(
          (p: ProductDetail) => p.id !== product.id
        ).slice(0, 6);
        setSimilarProducts(filtered);
      }
    } catch (e) {
      console.error('Failed to fetch similar products:', e);
    }
  };

  // Trigger fetch on mount
  if (product.category && similarProducts.length === 0) {
    fetchSimilarProducts();
  }

  // Derive features from product data
  const features = deriveFeatures(product);

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/watchlist', {
        method: inWatchlist ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      if (res.ok) setInWatchlist(!inWatchlist);
    } catch (e) {
      console.error('Watchlist toggle failed:', e);
    }
  };

  const confidenceLevel = getConfidenceLevel(product.confidence_score);
  const confidenceColor = {
    high: 'bg-success/10 text-success',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-destructive/10 text-destructive',
    unverified: 'bg-muted text-muted-foreground',
  }[confidenceLevel];

  const dimensions = deriveValidationDimensions(product, tVer);
  const statusKey = product.availability_status as keyof typeof statusVariantMap;
  const pricingKey = (product.pricing_model || 'free') as keyof typeof pricingVariantMap;
  const displayName = product.name;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: product.name,
            description: product.description,
            url: product.website_url,
            applicationCategory: 'AI Application',
            offers: {
              '@type': 'Offer',
              price: product.pricing_model === 'free' ? '0' : undefined,
              priceCurrency: 'USD',
            },
          }),
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/discover" className="hover:text-foreground transition-colors">
          {t('back_to_discover')}
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      {/* Hero Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo + Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {product.logo_url ? (
                    <img src={product.logo_url} alt={displayName} className="h-14 w-14 object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {(displayName || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                  <p className="text-muted-foreground text-lg">
                    {product.description || tCommon('no_description', { defaultValue: 'No description available' })}
                  </p>
                </div>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Confidence Score */}
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${confidenceColor}`}>
                  {formatConfidenceScore(product.confidence_score)} {t('confidence')}
                </span>

                {/* Availability Status */}
                <Badge variant={statusVariantMap[statusKey]}>
                  {tStatus(statusKey)}
                </Badge>

                {/* Pricing Model */}
                {product.pricing_model && (
                  <Badge variant={pricingVariantMap[pricingKey]}>
                    {tPricing(pricingKey)}
                  </Badge>
                )}

                {/* Category */}
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}

                {/* Source Count */}
                {product.source_count > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {product.source_count} {t('sources')}
                  </Badge>
                )}
              </div>

              {/* External Links */}
              <div className="flex items-center gap-3">
                {product.website_url && (
                  <a
                    href={product.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('visit_website')}
                  </a>
                )}
                {product.github_url && (
                  <a
                    href={product.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
              </div>
            </div>

            {/* Confidence Score Ring */}
            <div className="flex flex-col items-center justify-center md:w-40">
              <div className="relative h-28 w-28">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    className={getScoreTextColor(product.confidence_score)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${product.confidence_score * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreTextColor(product.confidence_score)}`}>
                    {formatConfidenceScore(product.confidence_score)}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('score')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4D Verification Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('verification_title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('verification_desc')}</p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {dimensions.map((dim) => (
              <div key={dim.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={dim.colorClass || 'text-muted-foreground'}>{dim.icon}</span>
                    <span className="text-sm font-medium">{dim.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${dim.colorClass || getScoreTextColor(dim.score)}`}>
                    {dim.score}%
                  </span>
                </div>
                <Progress value={dim.score} className={`h-2 ${dim.progressClassName || ''}`} />
                <p className="text-xs text-muted-foreground">{dim.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      {features.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              {t('features', { defaultValue: 'Key Features' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('features_desc', { defaultValue: 'Core capabilities and highlights' })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                >
                  {feature.included ? (
                    <Check className="h-4 w-4 mt-0.5 text-success shrink-0" />
                  ) : (
                    <X className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">{feature.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshots/Gallery Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('screenshots', { defaultValue: 'Screenshots' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Main Image */}
          <div className="relative mb-4 rounded-lg overflow-hidden bg-muted aspect-video">
            <img
              src={screenshots[activeImage]}
              alt={`Screenshot ${activeImage + 1} of ${displayName}`}
              className="w-full h-full object-cover"
            />
            {/* Navigation Arrows */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {/* Thumbnail Navigation */}
          {screenshots.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {screenshots.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`shrink-0 w-20 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    idx === activeImage
                      ? 'border-primary shadow-md'
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                >
                  <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('activity_timeline', { defaultValue: 'Activity Timeline' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Launch Event */}
            {product.launch_date && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-primary" />
                  </div>
                  <div className="w-px h-full bg-border min-h-[20px]" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{t('product_launch', { defaultValue: 'Product Launch' })}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(product.launch_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Star Milestone */}
            {product.github_stars !== null && product.github_stars !== undefined && product.github_stars > 0 && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <Star className="h-4 w-4 text-warning" />
                  </div>
                  <div className="w-px h-full bg-border min-h-[20px]" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">
                    {t('star_milestone', { defaultValue: 'GitHub Star Milestone' })}: {product.github_stars.toLocaleString()} ⭐
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.weekly_growth_rate !== undefined && product.weekly_growth_rate !== null
                      ? `${product.weekly_growth_rate >= 0 ? '+' : ''}${product.weekly_growth_rate.toFixed(1)}% weekly growth`
                      : 'Active community'}
                  </p>
                </div>
              </div>
            )}

            {/* Last Release */}
            {product.latest_release_date && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-success" />
                  </div>
                  <div className="w-px h-full bg-border min-h-[20px]" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{t('latest_release', { defaultValue: 'Latest Release' })}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(product.latest_release_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{t('last_updated_event', { defaultValue: 'Last Data Update' })}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(product.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers Card */}
      {(product.pricing_model === 'paid' || product.pricing_model === 'freemium') && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('pricing', { defaultValue: 'Pricing Plans' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('pricing_desc', { defaultValue: 'Compare available plans' })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Free Tier */}
              <div className="rounded-lg border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{t('free_tier', { defaultValue: 'Free' })}</h3>
                  <Badge variant="outline">{t('free', { defaultValue: '$0' })}</Badge>
                </div>
                <div className="space-y-2">
                  {getFreeTierFeatures(product).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paid Tier */}
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    {product.pricing_model === 'freemium'
                      ? t('premium_tier', { defaultValue: 'Premium' })
                      : t('pro_tier', { defaultValue: 'Pro' })}
                  </h3>
                  <Badge variant="default">{t('paid', { defaultValue: 'Paid' })}</Badge>
                </div>
                <div className="space-y-2">
                  {getPaidTierFeatures(product).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Info Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Description Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('about')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {product.description || tCommon('no_description', { defaultValue: 'No description available' })}
            </p>

            {/* Tech Stack */}
            {product.tech_stack && product.tech_stack.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">{t('tech_stack')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.tech_stack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium mb-2">{t('tags')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('metrics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GitHub Stars */}
            {product.github_stars !== null && product.github_stars !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">{t('github_stars')}</span>
                </div>
                <span className="font-semibold">{product.github_stars.toLocaleString()}</span>
              </div>
            )}

            {/* Weekly Growth */}
            {product.weekly_growth_rate !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">{t('weekly_growth')}</span>
                </div>
                <span className={`font-semibold ${product.weekly_growth_rate >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {product.weekly_growth_rate >= 0 ? '+' : ''}{product.weekly_growth_rate.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Monthly Growth */}
            {product.monthly_growth_rate !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">{t('monthly_growth')}</span>
                </div>
                <span className={`font-semibold ${product.monthly_growth_rate >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {product.monthly_growth_rate >= 0 ? '+' : ''}{product.monthly_growth_rate.toFixed(1)}%
                </span>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              {/* Launch Date */}
              {product.launch_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{t('launch_date')}: {new Date(product.launch_date).toLocaleDateString()}</span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-sm">{t('added_date')}: {new Date(product.created_at).toLocaleDateString()}</span>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span className="text-sm">{t('last_updated')}: {new Date(product.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={inWatchlist ? 'default' : 'outline'}
              onClick={handleWatchlistToggle}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
              {inWatchlist ? t('in_watchlist') : t('add_watchlist')}
            </Button>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t('add_compare')}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/discover')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back_to_discover')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('similar_products', { defaultValue: 'Similar Products' })}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarProducts.map((similarProduct) => (
              <Link
                key={similarProduct.id}
                href={`/discover/${similarProduct.slug || similarProduct.id}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {similarProduct.logo_url ? (
                          <img
                            src={similarProduct.logo_url}
                            alt={similarProduct.name}
                            className="h-8 w-8 object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">
                            {(similarProduct.name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{similarProduct.name}</h3>
                        {similarProduct.category && (
                          <p className="text-xs text-muted-foreground">{similarProduct.category}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {similarProduct.description || 'No description available'}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {similarProduct.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            similarProduct.confidence_score >= 80
                              ? 'bg-success/10 text-success'
                              : similarProduct.confidence_score >= 50
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {formatConfidenceScore(similarProduct.confidence_score)}
                        </span>
                        {similarProduct.github_stars !== null && (
                          <span className="text-[10px] text-muted-foreground">
                            <Star className="h-3 w-3 inline mr-0.5" />
                            {similarProduct.github_stars > 1000
                              ? `${(similarProduct.github_stars / 1000).toFixed(1)}k`
                              : similarProduct.github_stars}
                          </span>
                        )}
                      </div>
                      {similarProduct.pricing_model && (
                        <Badge variant={pricingVariantMap[similarProduct.pricing_model as keyof typeof pricingVariantMap]} className="text-[10px] px-1.5 py-0">
                          {tPricing(similarProduct.pricing_model)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
