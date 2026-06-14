'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Zap,
  Globe,
  TrendingUp,
  ArrowUpRight,
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
  logo_url?: string | null;
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
      {/* Hero Section */}
      <section className="hero-section relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />

        <div className="container-custom relative text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-background/80 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
            {t('hero_badge')}
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1]">
            {t('hero_title_1')}{' '}
            <span className="gradient-text">{t('hero_title_2')}</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc')}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="btn-gradient px-8 h-12 text-base rounded-full" asChild>
              <Link href="/discover">
                {t('cta_free')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 h-12 text-base rounded-full bg-background/80 backdrop-blur-sm">
              {t('cta_demo')}
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: <Globe className="h-4 w-4" />, text: t('feature_free') },
              { icon: <Shield className="h-4 w-4" />, text: t('feature_accuracy') },
              { icon: <Zap className="h-4 w-4" />, text: t('feature_free_plan') },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {feat.icon}
                </div>
                <span>{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container-custom py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '3,000+', label: t('metrics_label_tracked'), icon: <Globe className="h-5 w-5" /> },
              { value: '150+', label: t('metrics_label_daily'), icon: <TrendingUp className="h-5 w-5" /> },
              { value: '15+', label: 'Data Sources', icon: <Layers className="h-5 w-5" /> },
              { value: '98%', label: t('metrics_accuracy'), icon: <Shield className="h-5 w-5" /> },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2 text-primary">
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="section bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t('pain_title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pain_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto stagger">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                title: t('pain_scattered_title'),
                desc: t('pain_scattered_desc'),
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: <AlertTriangle className="h-6 w-6" />,
                title: t('pain_dead_title'),
                desc: t('pain_dead_desc'),
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                icon: <Layers className="h-6 w-6" />,
                title: t('pain_messy_title'),
                desc: t('pain_messy_desc'),
                gradient: 'from-purple-500 to-pink-500',
              },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-6 text-center card-hover">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white mb-4 shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-12">
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
              <div key={i} className="flex items-start gap-4 bg-card rounded-xl border border-border/50 p-5 card-hover">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} text-white shadow-sm`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-base">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4D Verification */}
      <section className="section bg-muted/30">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('verification_title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            {t('verification_desc')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto stagger">
            {[
              { label: t('ver_freshness_label'), desc: t('ver_freshness_desc'), gradient: 'from-blue-500 to-cyan-500', icon: <Zap className="h-6 w-6" /> },
              { label: t('ver_multi_label'), desc: t('ver_multi_desc'), gradient: 'from-emerald-500 to-teal-500', icon: <Globe className="h-6 w-6" /> },
              { label: t('ver_engagement_label'), desc: t('ver_engagement_desc'), gradient: 'from-amber-500 to-orange-500', icon: <TrendingUp className="h-6 w-6" /> },
              { label: t('ver_technical_label'), desc: t('ver_technical_desc'), gradient: 'from-purple-500 to-pink-500', icon: <Shield className="h-6 w-6" /> },
            ].map((d, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-6 card-hover">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${d.gradient} text-white mb-4 shadow-sm`}>
                  {d.icon}
                </div>
                <h3 className="font-semibold text-base mb-1">{d.label}</h3>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('product_showcase_title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('product_showcase_desc')}
            </p>
          </div>

          {productsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto stagger">
              {topProducts.map((product) => {
                const confidence = getConfidenceLevel(product.confidence_score);
                const scoreClass = confidence === 'high' ? 'score-high' : confidence === 'medium' ? 'score-medium' : 'score-low';

                return (
                  <Link key={product.id} href={`/discover/${product.slug}`} className="block group">
                    <div className="bg-card rounded-xl border border-border/50 p-5 card-hover">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
                          {product.logo_url ? (
                            <Image src={product.logo_url} alt={product.name} width={32} height={32} className="object-cover rounded-md" />
                          ) : (
                            <span className="text-lg font-bold text-primary">{product.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">{product.category || 'AI'}</p>
                        </div>
                        <span className={`score-badge ${scoreClass} shrink-0`}>
                          {formatConfidenceScore(product.confidence_score)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                        {product.description || 'No description available'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(product.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          {product.github_url && product.github_stars && product.github_stars > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3" />
                              {product.github_stars >= 1000 ? `${(product.github_stars / 1000).toFixed(1)}k` : product.github_stars}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          View <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('product_loading')}</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href="/discover">
                {t('product_showcase_btn')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('pricing_title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('pricing_subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto stagger">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-card rounded-xl border p-6 card-hover ${
                  tier.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border/50'
                }`}
              >
                {tier.popular && (
                  <Badge className="mb-4 bg-gradient-to-r from-primary to-cyan-600">
                    {t('pricing_most_popular')}
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-5">{tier.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full rounded-full" variant={tier.popular ? 'default' : 'outline'}>
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">{t('faq_title')}</h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details key={i} className="group bg-card rounded-xl border border-border/50 overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-medium hover:bg-muted/50 transition-colors">
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-muted/30">
        <div className="container-custom text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-cyan-500/5 rounded-2xl border border-primary/10 p-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('cta_title')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('cta_desc')}
            </p>
            <Button size="lg" className="btn-gradient rounded-full px-8" asChild>
              <Link href="/discover">
                {t('cta_button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-600 text-white font-bold text-sm">
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
                <h4 className="font-semibold text-sm mb-4">{section.title}</h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t('footer_copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
