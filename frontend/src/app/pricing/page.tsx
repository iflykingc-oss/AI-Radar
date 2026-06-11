'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronDown, Sparkles, Zap, Building2, ArrowRight } from 'lucide-react';

type Lang = 'en' | 'zh';
type Cycle = 'monthly' | 'yearly';

interface Plan {
  id: string;
  name: string;
  name_en: string;
  name_zh: string;
  tagline: string;
  tagline_en: string;
  tagline_zh: string;
  price_monthly: number;
  price_yearly: number;
  price: number;
  cycle: Cycle;
  features: string[];
  features_en: string[];
  features_zh: string[];
  cta_label: string;
  cta_label_en: string;
  cta_label_zh: string;
  cta_target: string;
  highlighted: boolean;
}

interface FaqItem {
  q_en: string;
  q_zh: string;
  a_en: string;
  a_zh: string;
}

interface PricingPayload {
  currency: string;
  cycle: Cycle;
  plans: Plan[];
  faq: FaqItem[];
}

interface PricingResponse {
  code: number;
  data: PricingPayload;
  message: string;
}

const DEFAULT_PRICING_PAYLOAD: PricingPayload = {
  currency: 'USD',
  cycle: 'monthly',
  plans: [
    {
      id: 'free',
      name: 'Free',
      name_en: 'Free',
      name_zh: '免费版',
      tagline: 'For curious builders getting started',
      tagline_en: 'For curious builders getting started',
      tagline_zh: '适合刚开始探索的个人用户',
      price_monthly: 0,
      price_yearly: 0,
      price: 0,
      cycle: 'monthly',
      features: [
        'Browse the full AI product catalog',
        'Weekly digest email',
        '3 saved products',
      ],
      features_en: [
        'Browse the full AI product catalog',
        'Weekly digest email',
        '3 saved products',
      ],
      features_zh: [
        '浏览完整 AI 产品目录',
        '每周摘要邮件',
        '可保存 3 个产品',
      ],
      cta_label: 'Get started free',
      cta_label_en: 'Get started free',
      cta_label_zh: '免费开始',
      cta_target: '/discover',
      highlighted: false,
    },
    {
      id: 'starter',
      name: 'Starter',
      name_en: 'Starter',
      name_zh: '入门版',
      tagline: 'For solo AI enthusiasts',
      tagline_en: 'For solo AI enthusiasts',
      tagline_zh: '适合个人 AI 爱好者',
      price_monthly: 29,
      price_yearly: 278,
      price: 29,
      cycle: 'monthly',
      features: [
        'Daily digest email',
        '100 product queries / month',
        'Basic watchlist (up to 10 products)',
      ],
      features_en: [
        'Daily digest email',
        '100 product queries / month',
        'Basic watchlist (up to 10 products)',
      ],
      features_zh: [
        '每日摘要邮件',
        '每月 100 次产品查询',
        '基础关注列表（最多 10 个产品）',
      ],
      cta_label: 'Subscribe now',
      cta_label_en: 'Subscribe now',
      cta_label_zh: '立即订阅',
      cta_target: '/api/admin/plan-switch?plan=starter',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      name_en: 'Pro',
      name_zh: '专业版',
      tagline: 'For serious AI founders',
      tagline_en: 'For serious AI founders',
      tagline_zh: '适合深度研究的 AI 创业者',
      price_monthly: 79,
      price_yearly: 758,
      price: 79,
      cycle: 'monthly',
      features: [
        'Everything in Starter',
        'Unlimited validation reports',
        'Trend curve details',
        'Advanced filters',
        'Multi-channel push',
      ],
      features_en: [
        'Everything in Starter',
        'Unlimited validation reports',
        'Trend curve details',
        'Advanced filters',
        'Multi-channel push',
      ],
      features_zh: [
        'Starter 全部功能',
        '无限验证报告',
        '趋势曲线详情',
        '高级筛选',
        '多端推送',
      ],
      cta_label: 'Subscribe now',
      cta_label_en: 'Subscribe now',
      cta_label_zh: '立即订阅',
      cta_target: '/api/admin/plan-switch?plan=pro',
      highlighted: true,
    },
  ],
  faq: [],
};

const I18N = {
  en: {
    badge: 'Phase E · W1',
    title: 'Simple, transparent pricing',
    subtitle: 'Start free. Upgrade when you need unlimited validation reports and team push.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: 'Save 20%',
    perMonth: '/mo',
    perYear: '/yr',
    billedYearly: 'billed yearly',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Ready to cut through AI noise?',
    ctaDesc: 'Spin up a free account in 30 seconds. No credit card required.',
    ctaButton: 'Get started free',
    fitLabel: 'Best for',
    benefitsLabel: 'Core benefits',
    limitsLabel: 'Limits',
    mockNotice: 'Phase E: Newsletter emails are simulated. Plan switch is mocked (no Stripe yet).',
  },
  zh: {
    badge: 'Phase E · W1',
    title: '简单透明的定价',
    subtitle: '免费开始。需要无限验证报告与团队推送时再升级。',
    monthly: '月付',
    yearly: '年付',
    save: '立省 20%',
    perMonth: '/月',
    perYear: '/年',
    billedYearly: '按年计费',
    faqTitle: '常见问题',
    ctaTitle: '准备好穿透 AI 噪音了吗?',
    ctaDesc: '30 秒创建免费账号, 无需信用卡。',
    ctaButton: '免费开始',
    fitLabel: '适合人群',
    benefitsLabel: '核心权益',
    limitsLabel: '使用限制',
    mockNotice: 'Phase E: 邮件仅模拟，套餐切换为 mock 流程（未接入 Stripe）。',
  },
} as const;

function pickIcon(planId: string) {
  switch (planId) {
    case 'starter':
      return <Zap className="h-5 w-5" />;
    case 'pro':
      return <Sparkles className="h-5 w-5" />;
    case 'enterprise':
      return <Building2 className="h-5 w-5" />;
    default:
      return <CheckCircle2 className="h-5 w-5" />;
  }
}

function getPlanAudience(planId: string, lang: Lang): string {
  const audiences: Record<string, Record<Lang, string>> = {
    free: {
      en: 'Curious builders exploring AI products before committing.',
      zh: '适合先探索 AI 产品、暂不需要深度额度的用户。',
    },
    starter: {
      en: 'Solo researchers validating a focused shortlist.',
      zh: '适合个人研究者，持续跟踪少量重点产品。',
    },
    pro: {
      en: 'Founders and analysts who need deeper validation and trends.',
      zh: '适合创业者和分析师，做更深入的验证与趋势判断。',
    },
    enterprise: {
      en: 'Teams, funds, and organizations with shared workflows.',
      zh: '适合团队、基金和组织，支持协作与定制数据流程。',
    },
  };
  return audiences[planId]?.[lang] ?? (lang === 'zh' ? '适合按需升级的团队。' : 'For teams upgrading as needed.');
}

function getPlanLimits(planId: string, lang: Lang): string {
  const limits: Record<string, Record<Lang, string>> = {
    free: {
      en: 'Limited saved products and weekly updates; no daily alerts or validation reports.',
      zh: '保存产品和更新频率有限；不含每日提醒和验证报告。',
    },
    starter: {
      en: 'Watchlist and query volume are capped; advanced trend detail is not included.',
      zh: '关注列表和查询次数有限，不包含高级趋势详情。',
    },
    pro: {
      en: 'Best for single-seat use; API and team governance require Enterprise.',
      zh: '更适合单人深度使用；API 与团队治理需企业版。',
    },
    enterprise: {
      en: 'Custom setup required; contact sales for scope and SLA.',
      zh: '需要定制开通；请联系销售确认范围与 SLA。',
    },
  };
  return limits[planId]?.[lang] ?? (lang === 'zh' ? '具体限制以当前方案说明为准。' : 'Limits follow the current plan details.');
}

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [data, setData] = useState<PricingPayload | null>(DEFAULT_PRICING_PAYLOAD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(false);
    setError(null);
    const url = `/api/pricing?lang=${lang}&cycle=${cycle}`;
    fetch(url)
      .then((res) => res.json() as Promise<PricingResponse>)
      .then((json) => {
        if (cancelled) return;
        if (json.code === 0 && json.data) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load pricing');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Pricing fetch error:', err);
        setError('Failed to load pricing');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, cycle]);

  const t = I18N[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Top bar: language + cycle toggle */}
      <div className="container mx-auto px-4 pt-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← AI Radar
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-md ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('zh')}
            className={`px-3 py-1 rounded-md ${lang === 'zh' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-pressed={lang === 'zh'}
          >
            中文
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="container mx-auto px-4 text-center pt-12 pb-10">
        <Badge variant="outline" className="mb-4 px-3 py-1">
          {t.badge}
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto">
          {t.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.subtitle}
        </p>

        {/* Cycle toggle */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border bg-card p-1">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-4 py-1.5 text-sm rounded-full ${cycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-pressed={cycle === 'monthly'}
          >
            {t.monthly}
          </button>
          <button
            type="button"
            onClick={() => setCycle('yearly')}
            className={`px-4 py-1.5 text-sm rounded-full flex items-center gap-2 ${cycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-pressed={cycle === 'yearly'}
          >
            {t.yearly}
            <Badge variant="secondary" className="text-[10px] py-0">
              {t.save}
            </Badge>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-12">
        {loading && (
          <div className="text-center text-muted-foreground">Loading pricing…</div>
        )}
        {error && !loading && (
          <div className="text-center text-destructive">{error}</div>
        )}
        {data && !loading && (
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {data.plans.map((plan) => {
              const display = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
              const perUnit = cycle === 'yearly' ? t.perYear : t.perMonth;
              const name = lang === 'zh' ? plan.name_zh : plan.name_en;
              const tagline = lang === 'zh' ? plan.tagline_zh : plan.tagline_en;
              const ctaLabel = lang === 'zh' ? plan.cta_label_zh : plan.cta_label_en;
              const isExternal = plan.cta_target.startsWith('mailto:') || plan.cta_target.startsWith('http');
              return (
                <Card
                  key={plan.id}
                  data-testid={`pricing-plan-card-${plan.id}`}
                  className={`relative p-6 flex flex-col ${
                    plan.highlighted ? 'border-primary ring-2 ring-primary shadow-lg' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {lang === 'zh' ? '推荐' : 'Recommended'}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 text-primary">
                    {pickIcon(plan.id)}
                    <h3 className="text-xl font-semibold">{name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
                  <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.fitLabel}
                    </p>
                    <p className="mt-1 text-foreground">{getPlanAudience(plan.id, lang)}</p>
                  </div>
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold">${display}</span>
                    <span className="text-muted-foreground ml-1">{perUnit}</span>
                    {cycle === 'yearly' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t.billedYearly}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex-1">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.benefitsLabel}
                    </p>
                    <ul className="space-y-3">
                      {(lang === 'zh' ? plan.features_zh : plan.features_en).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      {t.limitsLabel}
                    </p>
                    <p>{getPlanLimits(plan.id, lang)}</p>
                  </div>
                  {isExternal ? (
                    <a
                      href={plan.cta_target}
                      className="mt-6"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                        {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={plan.cta_target} className="mt-6">
                      <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                        {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ */}
      {data && data.faq && data.faq.length > 0 && (
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">{t.faqTitle}</h2>
          <div className="space-y-4">
            {data.faq.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border bg-card p-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {lang === 'zh' ? item.q_zh : item.q_en}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  {lang === 'zh' ? item.a_zh : item.a_en}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-16 text-center">
        <h3 className="text-2xl sm:text-3xl font-bold">{t.ctaTitle}</h3>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t.ctaDesc}</p>
        <Button size="lg" className="mt-6 px-8" asChild>
          <Link href="/discover">{t.ctaButton}</Link>
        </Button>
        <p className="mt-6 text-xs text-muted-foreground/80">{t.mockNotice}</p>
      </section>
    </div>
  );
}
