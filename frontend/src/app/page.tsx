'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  AlertTriangle,
  Layers,
  Shield,
  Bell,
  Target,
  CheckCircle2,
  ChevronDown,
  Github,
  Twitter,
  ArrowRight,
  ExternalLink,
  Star,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getConfidenceLevel, formatConfidenceScore } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ProductDemo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  confidence_score: number;
  pricing_model: string | null;
  website_url: string | null;
  github_url: string | null;
  github_stars: number | null;
  tags: string[];
}

export default function LandingPage() {
  const t = useTranslations('landing');
  const tNav = useTranslations('nav');
  const pricingTiers: PricingTier[] = t.raw('pricing_tiers') as PricingTier[];
  const faqItems: FAQItem[] = t.raw('faq') as FAQItem[];

  const [topProducts, setTopProducts] = useState<ProductDemo[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=6&sort=confidence')
      .then(r => r.json())
      .then(d => setTopProducts(d.products || []))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden gradient-animate py-20 lg:py-32">
        {/* Decorative elements */}
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-background/50">
            {t('hero_badge')}
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight">
            {t('hero_title_1')}{' '}
            <span className="gradient-text">{t('hero_title_2')}</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 py-6 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" asChild>
              <Link href="/discover">{t('cta_free')}</Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg rounded-full bg-background/50">
              {t('cta_demo')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            {[
              t('feature_free'),
              t('feature_accuracy'),
              t('feature_free_plan'),
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Pain Points */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t('pain_title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('pain_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto stagger">
            {[
              {
                icon: <Search className="h-8 w-8" />,
                title: t('pain_scattered_title'),
                desc: t('pain_scattered_desc'),
                color: 'from-blue-500/10 to-cyan-500/10',
              },
              {
                icon: <AlertTriangle className="h-8 w-8" />,
                title: t('pain_dead_title'),
                desc: t('pain_dead_desc'),
                color: 'from-amber-500/10 to-orange-500/10',
              },
              {
                icon: <Layers className="h-8 w-8" />,
                title: t('pain_messy_title'),
                desc: t('pain_messy_desc'),
                color: 'from-purple-500/10 to-pink-500/10',
              },
            ].map((item, i) => (
              <Card key={i} className="text-center p-8 card-hover border-0 bg-gradient-to-br ${item.color}">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t('features_title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto stagger">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                title: t('feat_discovery_title'),
                desc: t('feat_discovery_desc'),
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: t('feat_verification_title'),
                desc: t('feat_verification_desc'),
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: <Bell className="h-6 w-6" />,
                title: t('feat_alerts_title'),
                desc: t('feat_alerts_desc'),
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                icon: <Target className="h-6 w-6" />,
                title: t('feat_comparison_title'),
                desc: t('feat_comparison_desc'),
                gradient: 'from-purple-500 to-pink-500',
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 card-hover border-0 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: 4D Verification */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('verification_title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-14">
            {t('verification_desc')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto stagger">
            {[
              { label: t('ver_freshness_label'), desc: t('ver_freshness_desc'), gradient: 'from-blue-500 to-cyan-500' },
              { label: t('ver_multi_label'), desc: t('ver_multi_desc'), gradient: 'from-emerald-500 to-teal-500' },
              { label: t('ver_engagement_label'), desc: t('ver_engagement_desc'), gradient: 'from-amber-500 to-orange-500' },
              { label: t('ver_technical_label'), desc: t('ver_technical_desc'), gradient: 'from-purple-500 to-pink-500' },
            ].map((d, i) => (
              <Card key={i} className="p-6 text-center card-hover border-0 shadow-sm">
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} text-white text-2xl font-bold shadow-lg mb-4`}>
                  {i + 1}D
                </div>
                <h3 className="font-semibold text-lg">{d.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: User Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('users_title')}</h2>
          </div>
          <Tabs defaultValue="entrepreneur" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="entrepreneur">{t('user_entrepreneur')}</TabsTrigger>
              <TabsTrigger value="investor">{t('user_investor')}</TabsTrigger>
              <TabsTrigger value="developer">{t('user_developer')}</TabsTrigger>
            </TabsList>
            <TabsContent value="entrepreneur" className="mt-6">
              <Card className="p-8 border-0 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-lg">
                    L
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{t('user_entrepreneur_name')}</h3>
                    <p className="text-muted-foreground leading-relaxed italic">
                      &ldquo;{t('user_entrepreneur_quote')}&rdquo;
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="investor" className="mt-6">
              <Card className="p-8 border-0 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-lg">
                    S
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{t('user_investor_name')}</h3>
                    <p className="text-muted-foreground leading-relaxed italic">
                      &ldquo;{t('user_investor_quote')}&rdquo;
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="developer" className="mt-6">
              <Card className="p-8 border-0 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                    A
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{t('user_developer_name')}</h3>
                    <p className="text-muted-foreground leading-relaxed italic">
                      &ldquo;{t('user_developer_quote')}&rdquo;
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Section 6: Metrics */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-cyan-500/5 to-purple-500/5" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto stagger">
            {[
              { value: t('metrics_products_tracked'), label: t('metrics_label_tracked') },
              { value: t('metrics_products_daily'), label: t('metrics_label_daily') },
              { value: t('metrics_channels'), label: t('metrics_label_channels') },
            ].map((stat, i) => (
              <div key={i} className="p-6">
                <div className="text-5xl font-extrabold gradient-text">{stat.value}</div>
                <p className="mt-3 text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6.5: Product Demo */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('product_showcase_title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('product_showcase_desc')}
            </p>
          </div>

          {productsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto stagger">
              {topProducts.map((product) => {
                const confidence = getConfidenceLevel(product.confidence_score);
                const confidenceColor = {
                  high: 'bg-success/10 text-success border-success/20',
                  medium: 'bg-warning/10 text-warning border-warning/20',
                  low: 'bg-destructive/10 text-destructive border-destructive/20',
                  unverified: 'bg-muted text-muted-foreground border-muted-foreground/20',
                }[confidence];

                return (
                  <Card key={product.id} className="p-6 card-hover border-0 shadow-sm group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{product.category || 'AI'}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${confidenceColor}`}>
                        {formatConfidenceScore(product.confidence_score)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {product.description || 'No description available'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {(product.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-0.5 text-xs text-primary font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t">
                      {product.github_url && (
                        <a href={product.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {product.website_url && (
                        <a href={product.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {product.github_stars && product.github_stars > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto font-medium">
                          <Star className="h-3.5 w-3.5" />
                          {product.github_stars >= 1000 ? `${(product.github_stars / 1000).toFixed(1)}k` : product.github_stars}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('product_loading')}</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/discover">
                {t('product_showcase_btn')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 7: Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('pricing_title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('pricing_subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto stagger">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={`relative p-6 card-hover ${tier.popular ? 'border-primary ring-2 ring-primary shadow-lg shadow-primary/10' : 'border-0 shadow-sm'}`}>
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">{t('pricing_most_popular')}</Badge>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6 rounded-full" variant={tier.popular ? 'default' : 'outline'}>
                  {tier.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: FAQ + CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('faq_title')}</h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-xl border bg-card p-5 [&_summary::-webkit-details-marker]:hidden shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-lg">
                  {item.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/10">
            <h3 className="text-2xl font-bold">{t('cta_title')}</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              {t('cta_desc')}
            </p>
            <Button size="lg" className="mt-6 px-8 rounded-full shadow-lg shadow-primary/25" asChild>
              <Link href="/discover">{t('cta_button')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-14">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-white font-bold text-sm">
                  AI
                </div>
                <span className="font-bold text-lg">AI Radar</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('footer_tagline')}
              </p>
            </div>
            {[
              { title: t('footer_product'), links: [
                { href: '/discover', label: tNav('discover') },
                { href: '/watchlist', label: tNav('watchlist') },
                { href: '/compare', label: tNav('compare') },
                { href: '/trends', label: tNav('trends') },
              ]},
              { title: t('footer_resources'), links: [
                { href: '#', label: t('footer_api_docs') },
                { href: '#', label: t('footer_blog') },
                { href: '#', label: t('footer_changelog') },
              ]},
              { title: t('footer_company'), links: [
                { href: '#', label: t('footer_about') },
                { href: '#', label: t('footer_contact') },
              ]},
              { title: t('footer_legal'), links: [
                { href: '/privacy', label: t('footer_privacy') },
                { href: '/terms', label: t('footer_terms') },
                { href: '/cookie-settings', label: t('footer_cookies') },
              ]},
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t pt-8 gap-4">
            <p className="text-sm text-muted-foreground">
              {t('footer_copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
