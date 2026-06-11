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
} from 'lucide-react';
import { useTranslations } from 'next-intl';

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

export default function LandingPage() {
  const t = useTranslations('landing');
  const tNav = useTranslations('nav');
  const pricingTiers: PricingTier[] = t.raw('pricing_tiers') as PricingTier[];
  const faqItems: FAQItem[] = t.raw('faq') as FAQItem[];

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm">
            {t('hero_badge')}
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto">
            {t('hero_title_1')}{' '}
            <span className="text-primary">{t('hero_title_2')}</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('hero_desc')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 py-6 text-lg" asChild>
              <Link href="/discover">{t('cta_free')}</Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              {t('cta_demo')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>{t('feature_free')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>{t('feature_accuracy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>{t('feature_free_plan')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Pain Points */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t('pain_title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('pain_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: <Search className="h-8 w-8" />,
                title: t('pain_scattered_title'),
                desc: t('pain_scattered_desc'),
              },
              {
                icon: <AlertTriangle className="h-8 w-8" />,
                title: t('pain_dead_title'),
                desc: t('pain_dead_desc'),
              },
              {
                icon: <Layers className="h-8 w-8" />,
                title: t('pain_messy_title'),
                desc: t('pain_messy_desc'),
              },
            ].map((item, i) => (
              <Card key={i} className="text-center p-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t('features_title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                title: t('feat_discovery_title'),
                desc: t('feat_discovery_desc'),
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: t('feat_verification_title'),
                desc: t('feat_verification_desc'),
              },
              {
                icon: <Bell className="h-6 w-6" />,
                title: t('feat_alerts_title'),
                desc: t('feat_alerts_desc'),
              },
              {
                icon: <Target className="h-6 w-6" />,
                title: t('feat_comparison_title'),
                desc: t('feat_comparison_desc'),
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.desc}</p>
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            {t('verification_desc')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { label: t('ver_freshness_label'), desc: t('ver_freshness_desc'), color: 'text-blue-500' },
              { label: t('ver_multi_label'), desc: t('ver_multi_desc'), color: 'text-green-500' },
              { label: t('ver_engagement_label'), desc: t('ver_engagement_desc'), color: 'text-yellow-500' },
              { label: t('ver_technical_label'), desc: t('ver_technical_desc'), color: 'text-purple-500' },
            ].map((d, i) => (
              <Card key={i} className="p-6 text-center">
                <div className={`text-4xl font-bold ${d.color}`}>{i + 1}D</div>
                <h3 className="mt-3 font-semibold">{d.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
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
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-3">{t('user_entrepreneur_name')}</h3>
                <p className="text-muted-foreground">
                  {t('user_entrepreneur_quote')}
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="investor" className="mt-6">
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-3">{t('user_investor_name')}</h3>
                <p className="text-muted-foreground">
                  {t('user_investor_quote')}
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="developer" className="mt-6">
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-3">{t('user_developer_name')}</h3>
                <p className="text-muted-foreground">
                  {t('user_developer_quote')}
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Section 6: Metrics */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-5xl font-extrabold text-primary">50,000+</div>
              <p className="mt-2 text-muted-foreground">AI Tools Tracked</p>
            </div>
            <div>
              <div className="text-5xl font-extrabold text-primary">200+</div>
              <p className="mt-2 text-muted-foreground">New Products Daily</p>
            </div>
            <div>
              <div className="text-5xl font-extrabold text-primary">10+</div>
              <p className="mt-2 text-muted-foreground">Channels Monitored</p>
            </div>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={`relative p-6 ${tier.popular ? 'border-primary ring-2 ring-primary' : ''}`}>
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
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
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={tier.popular ? 'default' : 'outline'}>
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
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-lg border bg-card p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold">{t('cta_title')}</h3>
            <p className="mt-3 text-muted-foreground">
              {t('cta_desc')}
            </p>
            <Button size="lg" className="mt-6 px-8" asChild>
              <Link href="/discover">{t('cta_button')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  AI
                </div>
                <span className="font-bold">AI Radar</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('footer_tagline')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer_product')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/discover" className="hover:text-foreground">{tNav('discover')}</Link></li>
                <li><Link href="/watchlist" className="hover:text-foreground">{tNav('watchlist')}</Link></li>
                <li><Link href="/compare" className="hover:text-foreground">{tNav('compare')}</Link></li>
                <li><Link href="/trends" className="hover:text-foreground">{tNav('trends')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer_resources')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{t('footer_api_docs')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('footer_blog')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('footer_changelog')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer_company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">{t('footer_about')}</Link></li>
                <li><Link href="#" className="hover:text-foreground">{t('footer_contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('footer_legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">{t('footer_privacy')}</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">{t('footer_terms')}</Link></li>
                <li><Link href="/cookie-settings" className="hover:text-foreground">{t('footer_cookies')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t pt-8">
            <p className="text-sm text-muted-foreground">
              {t('footer_copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
