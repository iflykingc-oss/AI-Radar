export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/pricing
 *
 * Query params:
 *   - lang: 'en' | 'zh' (default 'en')
 *   - cycle: 'monthly' | 'yearly' (default 'monthly')
 *
 * Returns the active plan catalog. Phase E mock: a static 3-tier catalog
 * is read from DB (`pricing_plans` table if present) with a hard-coded
 * fallback. Yearly prices already include the 20% annual discount.
 *
 * Response: { code, data: { currency, plans, faq }, message }
 */
const VALID_LANG = new Set(['en', 'zh']);
const VALID_CYCLE = new Set(['monthly', 'yearly']);

const P0_PLAN_IDS = ['free', 'starter', 'pro'];

const FALLBACK_PLANS = [
  {
    id: 'free',
    name_en: 'Free',
    name_zh: '免费版',
    tagline_en: 'For curious builders getting started',
    tagline_zh: '适合刚开始探索的个人用户',
    price_monthly: 0,
    price_yearly: 0,
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
    cta_label_en: 'Get started free',
    cta_label_zh: '免费开始',
    cta_target: '/discover',
    highlighted: false,
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'starter',
    name_en: 'Starter',
    name_zh: '入门版',
    tagline_en: 'For solo AI enthusiasts',
    tagline_zh: '适合个人 AI 爱好者',
    price_monthly: 29,
    price_yearly: 278, // 8% off
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
    cta_label_en: 'Subscribe now',
    cta_label_zh: '立即订阅',
    cta_target: '/api/admin/plan-switch?plan=starter',
    highlighted: false,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'pro',
    name_en: 'Pro',
    name_zh: '专业版',
    tagline_en: 'For serious AI founders',
    tagline_zh: '适合深度研究的 AI 创业者',
    price_monthly: 79,
    price_yearly: 758,
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
    cta_label_en: 'Subscribe now',
    cta_label_zh: '立即订阅',
    cta_target: '/api/admin/plan-switch?plan=pro',
    highlighted: true,
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'enterprise',
    name_en: 'Enterprise',
    name_zh: '企业版',
    tagline_en: 'For teams and funds',
    tagline_zh: '适合团队和投资机构',
    price_monthly: 299,
    price_yearly: 2870,
    features_en: [
      'Everything in Pro',
      'API access',
      'Team accounts',
      'Custom crawler sources',
      'SLA guarantee',
    ],
    features_zh: [
      'Pro 全部功能',
      'API 访问',
      '团队账号',
      '自定义爬虫源',
      'SLA 保障',
    ],
    cta_label_en: 'Contact sales',
    cta_label_zh: '联系销售',
    cta_target: 'mailto:sales@airadar.example.com',
    highlighted: false,
    sort_order: 3,
    is_active: true,
  },
];

const FALLBACK_FAQ = [
  {
    q_en: 'What billing cycles are available?',
    q_zh: '订阅周期有几种?',
    a_en: 'Monthly or yearly. Yearly billing saves 20%.',
    a_zh: '月付或年付, 年付立省 20%。',
  },
  {
    q_en: 'Can I cancel anytime?',
    q_zh: '能随时取消吗?',
    a_en: 'Yes. Cancel from your account settings; access continues until the end of the current period.',
    a_zh: '可以。在账户设置里取消, 当期可继续使用, 之后不再扣费。',
  },
  {
    q_en: 'Is there a refund policy?',
    q_zh: '能退款吗?',
    a_en: '14-day money-back guarantee, no questions asked.',
    a_zh: '14 天无理由退款。',
  },
  {
    q_en: 'How is AI Radar different from a search engine?',
    q_zh: 'AI Radar 和搜索引擎有什么不同?',
    a_en: 'We pre-discover, deduplicate, and score every AI product with our 4D verification system, so you only see real, active tools.',
    a_zh: '我们用 4 维验证系统对每个 AI 产品做预发现、去重与打分, 你看到的都是真实活跃的工具。',
  },
  {
    q_en: 'Can I upgrade or downgrade?',
    q_zh: '能升级或降级套餐吗?',
    a_en: 'Yes. Pro-rated charges apply on upgrade; downgrade takes effect at next renewal.',
    a_zh: '可以。升级按比例补差价, 降级在下个周期生效。',
  },
  {
    q_en: 'Do you offer team pricing?',
    q_zh: '有团队价格吗?',
    a_en: 'Enterprise plan includes team accounts. Contact sales for seat-based pricing.',
    a_zh: '企业版包含团队账号, 联系销售获取按席位定价。',
  },
  {
    q_en: 'What data sources do you cover?',
    q_zh: '覆盖哪些数据源?',
    a_en: '4 production sources (GitHub Trending, Hacker News, Product Hunt, RSS) and 4 P0 extensions (arXiv, Hugging Face, npm, YouTube) coming online in W2.',
    a_zh: '4 个已上线数据源 (GitHub Trending、Hacker News、Product Hunt、RSS), 4 个 P0 扩展 (arXiv、Hugging Face、npm、YouTube) 将在 W2 上线。',
  },
  {
    q_en: 'Is there a free plan?',
    q_zh: '有免费版吗?',
    a_en: 'Yes. The default Free tier lets you browse the full catalog and receive a weekly digest.',
    a_zh: '有。默认 Free 版可以浏览全部产品, 并接收每周摘要。',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const cycle = searchParams.get('cycle') || 'monthly';

    if (!VALID_LANG.has(lang)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid lang: ${lang}` },
        { status: 400 }
      );
    }
    if (!VALID_CYCLE.has(cycle)) {
      return NextResponse.json(
        { code: 4000, data: null, message: `Invalid cycle: ${cycle}` },
        { status: 400 }
      );
    }

    // Try to read pricing_plans table; if it doesn't exist, fall back.
    let plans = FALLBACK_PLANS;
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        plans = data as any;
      }
    } catch {
      // table missing or RLS deny - silently use fallback
    }

    // Keep DB-provided enterprise/add-ons, but never let them replace the P0 trio.
    const planById = new Map(FALLBACK_PLANS.map((plan) => [plan.id, plan]));
    plans
      .filter((p) => p.is_active !== false)
      .forEach((plan) => {
        planById.set(plan.id, plan);
      });
    P0_PLAN_IDS.forEach((planId) => {
      if (!planById.has(planId)) {
        const fallbackPlan = FALLBACK_PLANS.find((plan) => plan.id === planId);
        if (fallbackPlan) {
          planById.set(planId, fallbackPlan);
        }
      }
    });

    // Project to contract shape and compute display price.
    const projectedPlans = Array.from(planById.values())
      .filter((p) => p.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .map((p) => {
        const displayPrice = cycle === 'yearly' ? p.price_yearly : p.price_monthly;
        return {
          id: p.id,
          name: lang === 'zh' ? p.name_zh : p.name_en,
          name_en: p.name_en,
          name_zh: p.name_zh,
          tagline: lang === 'zh' ? p.tagline_zh : p.tagline_en,
          tagline_en: p.tagline_en,
          tagline_zh: p.tagline_zh,
          price_monthly: p.price_monthly,
          price_yearly: p.price_yearly,
          price: displayPrice,
          cycle,
          features: lang === 'zh' ? p.features_zh : p.features_en,
          features_en: p.features_en,
          features_zh: p.features_zh,
          cta_label: lang === 'zh' ? p.cta_label_zh : p.cta_label_en,
          cta_label_en: p.cta_label_en,
          cta_label_zh: p.cta_label_zh,
          cta_target: p.cta_target,
          highlighted: p.highlighted ?? false,
        };
      });

    return NextResponse.json({
      code: 0,
      data: {
        currency: 'USD',
        cycle,
        plans: projectedPlans,
        faq: FALLBACK_FAQ,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('pricing API unexpected error:', error);
    return NextResponse.json(
      { code: 5000, data: null, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
