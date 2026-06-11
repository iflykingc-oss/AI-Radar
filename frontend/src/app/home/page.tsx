/**
 * AI Radar — Home Page (Server Component, T-1 P0)
 *
 * File: frontend/src/app/home/page.tsx
 * Author: 寇豆码 (Engineer)
 *
 * 重写自 W1 实现的 `'use client'` + `useEffect` 形态 (违反 ADR-07)。
 * W2 改造为 RSC:
 *   - 顶部 Hero / Welcome 区保留 (静态文本 + i18n)
 *   - 3 层 LayerEntryCard 通过 `Promise.all` 并行调 3 个 W1 API
 *   - 数据经 `lib/api/server.ts` 助手解 envelope + 404/501 fallback
 *   - 失败路径返回 `{ count: 0, items: [] }`,卡片自动渲染 skeleton
 *
 * 验收点 (per `phase-f-w2-architecture.md` §11 / PRD §5):
 *   - AC-1.1 3 张卡片在同一请求中渲染
 *   - AC-1.2 3 张卡 count 数值来自 API (非零, 非 LAYER_PLACEHOLDER)
 *   - AC-1.3 3 张卡 items 数组有 3-5 条真实预览
 *   - AC-1.4 失败时降级, 不抛错
 *
 * 范围:
 *   - 删除了 W1 中的 "推荐 / 最新产品 / 快速统计" 块 (W3+ 候选,
 *     不在 T-1 范围). 后续由位置 C 重新引入.
 */
import { getTranslations } from 'next-intl/server';
import { Rocket, Compass, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LayerEntrySection from '@/components/home/LayerEntrySection';
import {
  buildL1FromCategories,
  buildL2FromLaunches,
  buildL3FromTrends,
  fetchCategoriesServer,
  fetchLaunchesServer,
  fetchTrendsServer,
} from '@/lib/api/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  // Server-side i18n — `getTranslations` is RSC-safe in next-intl v3+.
  const t = await getTranslations('home');

  // 3 endpoints in parallel, with a hard timeout cap (Next.js fetch
  // supports AbortSignal but we keep it simple: rely on `revalidate`
  // + short per-request timeout via env if needed).
  const [categoriesResult, launchesResult, trendsResult] = await Promise.all([
    fetchCategoriesServer({
      order_by: 'hot_score',
      include_empty: false,
      lang: 'zh',
    }),
    fetchLaunchesServer({ range: '24h', page: 1, page_size: 12 }),
    fetchTrendsServer({ range: '7d', page: 1, page_size: 12 }),
  ]);

  const l1 = buildL1FromCategories(categoriesResult, 5);
  const l2 = buildL2FromLaunches(launchesResult, 3);
  const l3 = buildL3FromTrends(trendsResult, 3);

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Hero / Welcome strip (RSC, no client state) */}
      <section
        aria-labelledby="home-hero-title"
        className="border-b bg-gradient-to-b from-background to-muted/30 py-12 lg:py-20"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span lang="zh">给开发者、创投和企业创新团队的 AI 产品雷达</span>
              <span lang="en" className="opacity-75">
                / AI product radar for builders, investors and innovation teams
              </span>
            </div>

            <h1
              id="home-hero-title"
              className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              <span lang="zh">{t('welcome')}</span>
              <span className="mt-1 block text-xl text-muted-foreground sm:text-2xl">
                <span lang="en">{t('digest')}</span>
              </span>
            </h1>

            <div className="flex w-full flex-col flex-wrap items-stretch justify-center gap-2 pt-2 sm:w-auto sm:flex-row sm:items-center">
              <Button className="w-full sm:w-auto" asChild>
                <Link href="/discover">
                  <Compass className="mr-2 h-4 w-4" />
                  {t('browse_all')}
                </Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/launches?range=24h">
                  <Rocket className="mr-2 h-4 w-4" />
                  <span lang="zh">新品雷达</span>
                  <span lang="en" className="ml-1 opacity-75">
                    Launch radar
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto" asChild>
                <Link href="/trends?range=7d">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span lang="zh">趋势方向</span>
                  <span lang="en" className="ml-1 opacity-75">
                    Trends
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Layer Entry — RSC, data via props, no client hooks */}
      <LayerEntrySection l1={l1} l2={l2} l3={l3} />

      {/* Mini stat strip (static, optional). Numbers come from API
          results where available, otherwise render `—`. */}
      <section
        aria-label="Quick stats"
        className="border-t bg-muted/20 py-10"
        data-testid="home-quick-stats"
      >
        <div className="container mx-auto grid grid-cols-1 gap-4 px-4 text-center sm:grid-cols-3">
          <div>
            <div className="text-2xl font-bold text-primary sm:text-3xl">
              {l1.count > 0 ? l1.count : '—'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              <span lang="zh">个成熟赛道</span>
              <span lang="en" className="ml-1 opacity-75">
                categories
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {l2.count > 0 ? l2.count : '—'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              <span lang="zh">条新发布(24h)</span>
              <span lang="en" className="ml-1 opacity-75">
                launches (24h)
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 sm:text-3xl">
              {l3.count > 0 ? l3.count : '—'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              <span lang="zh">个趋势信号</span>
              <span lang="en" className="ml-1 opacity-75">
                trend signals
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
